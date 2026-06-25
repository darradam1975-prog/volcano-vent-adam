/**
 * Adam The Volcano Vent Bot — dedicated Volcano Vent Dice rules companion.
 */
const ADAM_BOT_NAME = 'Adam The Volcano Vent Bot';
const ADAM_SOURCE = '🌋 ' + ADAM_BOT_NAME;

const adam = {
  conversationHistory: [],
  lastTopic: 'general',
  lastBettingSubtopic: 'overview',
  teachMode: false,
  walkthroughStep: 0,

  greet() {
    const betNote = adamAgeVerifier.canDiscussBetting()
      ? ' You can ask about **buttons, beads, and pretend bets** too.'
      : ' Ask me anything about rules and scoring — pretend bets with buttons and beads need **18+** (set your birthday in Settings).';
    const llmUsable = typeof adamLlmSettings !== 'undefined' && adamLlmSettings.isUsable();
    const llmNote = llmUsable
      ? ' **GPT is on** — plain-English on rules, beads, buttons, teach mode, and brief off-topic help.'
      : ' Rule-based guide works now — optional **GPT** adds plain-English polish.';
    const setupNote = !llmUsable && typeof adamLlmSettings !== 'undefined'
      ? `\n\n${adamLlmSettings.setupGuideShort()}`
      : '';
    return `Hey — I'm **${ADAM_BOT_NAME}**, your **Volcano Vent Dice** guide.${betNote}\n\nSay **"teach me"** for a **brief summary** then **learn by questions** — not a lecture.${llmNote}${setupNote}\n\nPlain English anytime: the **Vent**, **2+2+2**, lucky charm, variants, house rules. **"Full rules"** only if you want the long version.`;
  },

  respond(message) {
    const reply = this._buildReply(message);
    const m = String(message || '').trim();
    if (m) this._recordTurn(m, reply);
    return reply;
  },

  async respondAsync(message) {
    const m = String(message || '').trim();
    if (!m) return 'Say something when you are ready — I am here for Volcano Vent Dice questions!';

    let reply = this._buildReply(message);
    if (typeof adamLlm !== 'undefined' && adamLlm.isEnabled()) {
      const roughGuide = /^I'm a \*\*rough guide\*\*/.test(reply);
      const offTopic = this._isLikelyOffTopic(m);
      if (/lucky\s*charm/i.test(m) && !roughGuide) {
        // Keep topic-specific charm answers — skip GPT rewrite.
      } else if (roughGuide || offTopic) {
        reply = await adamLlm.completeOffTopic(m, reply, this.conversationHistory);
      } else if (adamLlm.shouldEnhance(m, reply)) {
        reply = await adamLlm.complete(m, reply, this.conversationHistory);
      }
    }
    this._recordTurn(m, reply);
    return reply;
  },

  _isLikelyOffTopic(message) {
    const m = String(message || '').toLowerCase().trim();
    if (!m || m.length < 4) return false;
    if (this._isGreeting(m) || this._isThanks(m) || this._isBareAffirmative(m)
      || this._isDeclineContinuation(m) || this._isAffirmativeContinuation(m)) {
      return false;
    }
    if (this._isStartTeach(m) || this._isQuoteRulesRequest(m) || this._isRulebookSourceQuestion(m)) {
      return false;
    }
    if (/full\s+rules|all\s+rules|complete\s+rules|^rule\s*book$/.test(m)) return false;
    if (this._isOtherDiceGameQuestion(m)) return false;

    const gameSignals = /volcano|vent(?:\s+dice)?|lucky\s+charm|countdown|2[\s-]*2[\s-]*2|bead|button|sewing|token|ante|napkin|keeper|pretend\s+bet|roll(?:ing)?|round|scor(?:e|ing)|teach(?:\s+me)?|walkthrough|variant|tribute|gambl|1-800|birthday|craft|pebble|marble|jack|seed|clip|house\s+rule|vent\s+sacrifice|sum\s+dice|d6|2\+2\+2/i;
    if (gameSignals.test(m)) return false;

    return true;
  },

  _buildReply(message) {
    const m = String(message || '').trim();
    if (!m) return 'Say something when you are ready — I am here for Volcano Vent Dice questions!';

    if (this._isGamblingHelpQuestion(m.toLowerCase())) {
      return this._gamblingHelp();
    }
    if (!adamAgeVerifier.canDiscussBetting() && adamAgeVerifier.messageRequiresBettingAge(m)) {
      const parts = this._splitCompoundQuestions(m);
      const hasOpenPart = parts && parts.some(p => !adamAgeVerifier.messageRequiresBettingAge(p));
      if (!hasOpenPart) {
        if (!adamAgeVerifier.hasBirthday()) {
          adamAgeVerifier.requestVerification(() => {
            addMessage('assistant', this._handleBetting(m), ADAM_SOURCE);
            adamVoice?.speakLast?.();
          });
          return adamAgeVerifier.bettingBlockedReply() + '\n\nOpening birthday picker now…';
        }
        return adamAgeVerifier.bettingBlockedReply();
      }
    }
    return this._route(m);
  },

  _recordTurn(userMessage, assistantReply) {
    this.conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantReply }
    );
    if (this.conversationHistory.length > 24) {
      this.conversationHistory = this.conversationHistory.slice(-24);
    }
    const inferred = this._inferTopicFromText(assistantReply);
    this.lastTopic = inferred || this.lastTopic;
    if (inferred === 'betting') {
      this.lastBettingSubtopic = this._inferBettingSubtopic(assistantReply, userMessage);
    }
  },

  _questionLeadRe() {
    return /^(?:what|how|when|who|where|why|can|could|should|do|does|is|are|tell\s+me|explain)\b/i;
  },

  _looksLikeGameQuestion(segment) {
    const s = String(segment || '').trim();
    if (s.length < 6) return false;
    const lower = s.toLowerCase();
    if (/^(?:and|also|plus|yes|no|ok|sure|thanks)\b/.test(lower)) return false;
    if (/\?/.test(s)) return true;
    return this._questionLeadRe().test(s);
  },

  _extractQuestionSegments(raw) {
    const text = String(raw || '').trim();
    if (!text) return [];

    if (text.includes('?')) {
      const chunks = text.split('?').map(c => c.trim()).filter(Boolean);
      if (chunks.length >= 2) {
        const endsWithQ = text.trimEnd().endsWith('?');
        return chunks.map((chunk, idx) => {
          const needsQ = idx < chunks.length - 1 || endsWithQ;
          const seg = needsQ ? `${chunk}?` : chunk;
          return seg.replace(/^(?:and|also|plus)\s+/i, '').trim();
        }).filter(Boolean);
      }
    }

    const conj = /\s+(?:and|also|plus)\s+(?=(?:what|how|when|who|where|why|can|could|should|do|does|is|are|tell\s+me|explain)\b)/i;
    if (!conj.test(text)) return [text];

    const splits = [];
    let rest = text;
    while (conj.test(rest)) {
      const idx = rest.search(conj);
      const left = rest.slice(0, idx).trim().replace(/[?,]\s*$/, '').trim();
      if (left) splits.push(left);
      rest = rest.slice(idx).replace(/^\s*(?:and|also|plus)\s+/i, '').trim();
    }
    if (rest) splits.push(rest.replace(/\?$/,'').trim());
    return splits.length >= 2 ? splits : [text];
  },

  _splitCompoundQuestions(message) {
    const raw = String(message || '').trim();
    if (!raw || raw.length < 18) return null;
    const lower = raw.toLowerCase();
    if (/walk\s+(?:me\s+)?through|step\s+by\s+step|full\s+rules|quote\s+the\s+rules|rule\s*book/.test(lower)) return null;
    if (/\b(?:buttons?\s+and\s+beads?|beads?\s+and\s+buttons?)\b/.test(lower) && !/\?\s*(?:and|also)\s+(?:what|how|when)/.test(lower)) {
      const multiQ = (raw.match(/\?/g) || []).length >= 2;
      if (!multiQ) return null;
    }

    const segments = this._extractQuestionSegments(raw)
      .map(s => s.replace(/^(?:and|also|plus)\s+/i, '').trim())
      .filter(s => this._looksLikeGameQuestion(s));

    if (segments.length < 2) return null;
    return segments.slice(0, 3);
  },

  _loreLabelForTopic(topic) {
    const map = {
      luckyCharm: 'Lucky charm lore',
      whyVent: 'Why "the Vent"? (lore)',
      ventEdge: 'Vent edge (lore)',
      countdown: 'Countdown (lore)',
      crawling: 'Crawling down (lore)',
      name: 'Name story (lore)',
      tokens: 'Tokens & sacrifice (lore)',
      overview: 'Volcano Vent lore'
    };
    return map[topic] || 'Lore';
  },

  _compoundKind(part) {
    if (typeof matchLoreTopic === 'function') {
      const topic = matchLoreTopic(part);
      if (topic) return `lore:${topic}`;
    }
    const s = String(part || '').toLowerCase();
    if (/lucky\s+charm/.test(s)) return 'rules:luckyCharm';
    if (/vent/.test(s) && !/prevent|event/.test(s)) return 'rules:vent';
    if (/countdown|6.*5.*4/.test(s)) return 'rules:countdown';
    if (/how\s+many\s+dice|\bd6\b/.test(s)) return 'rules:dice';
    if (/player|people/.test(s)) return 'rules:players';
    if (/ante|pot|keeper|pretend\s+bet|napkin/.test(s)) return 'rules:betting';
    if (/\btoken/.test(s)) return 'rules:tokens';
    return `rules:${s.replace(/\s+/g, ' ').trim().slice(0, 48)}`;
  },

  _shortLabelForQuestion(question) {
    const s = String(question || '').toLowerCase().replace(/\?/g, '').trim();
    if (typeof matchLoreTopic === 'function') {
      const topic = matchLoreTopic(question);
      if (topic) return this._loreLabelForTopic(topic);
    }
    if (/lucky\s+charm/.test(s)) return 'Lucky charm (rules)';
    if (/vent/.test(s) && !/prevent|event/.test(s)) return 'The Vent (rules)';
    if (/countdown|6.*5.*4/.test(s)) return 'Countdown';
    if (/how\s+many\s+dice|\bd6\b|dice\s+do\s+we/.test(s)) return 'Dice';
    if (/player|people|how\s+many\s+play/.test(s)) return 'Players';
    if (/ante|pot\s+size|keeper|house\s+rule|pretend\s+bet|napkin/.test(s)) return 'Pretend bets';
    if (/\btoken/.test(s)) return 'Vent tokens';
    if (/win|last.*token|who\s+wins/.test(s)) return 'Winning';
    if (/scor/.test(s)) return 'Scoring';
    if (/2[\s-]*2[\s-]*2|sum|add\s+up/.test(s)) return 'Sums (2+2+2)';
    if (/round|how\s+long|how\s+many\s+cycle/.test(s)) return 'Rounds';
    const plain = String(question || '').replace(/\*\*/g, '').replace(/\?$/,'').trim();
    if (plain.length <= 48) {
      return plain.charAt(0).toUpperCase() + plain.slice(1);
    }
    return `${plain.slice(0, 45)}…`;
  },

  _formatCompoundReply(items) {
    const n = items.length;
    const intro = n === 2
      ? '**Two questions — here are quick answers:**'
      : `**${n} questions — here are quick answers:**`;
    let out = `${intro}\n\n`;
    items.forEach((item, idx) => {
      out += `**${idx + 1}. ${item.label}**\n${item.answer.trim()}\n\n`;
    });
    return out.trim();
  },

  _compactCompoundAnswer(part, answer) {
    let out = String(answer || '').trim();
    const kind = this._compoundKind(part);
    if (kind === 'rules:luckyCharm') {
      out = out.replace(/^\*\*Lucky charm:\*\*\s*/i, '');
    }
    if (kind === 'rules:vent' && /^\*\*The Vent:\*\*/i.test(out)) {
      out = out.replace(/^\*\*The Vent:\*\*\s*/i, '');
    }
    return out.trim();
  },

  _routeSingleForCompound(part) {
    if (typeof matchLoreTopic === 'function' && typeof formatVolcanoVentLoreMarkdown === 'function') {
      const topic = matchLoreTopic(part);
      if (topic) return formatVolcanoVentLoreMarkdown(topic, { compound: true });
    }
    return this._compactCompoundAnswer(part, this._routeSingle(part));
  },

  _answerCompoundQuestions(message) {
    const parts = this._splitCompoundQuestions(message);
    if (!parts || parts.length < 2) return null;

    const items = [];
    const seen = new Map();
    for (const part of parts) {
      let answer;
      if (!adamAgeVerifier.canDiscussBetting() && adamAgeVerifier.messageRequiresBettingAge(part)) {
        answer = adamAgeVerifier.bettingBlockedReply();
      } else {
        answer = this._routeSingleForCompound(part);
      }
      const kind = this._compoundKind(part);
      const key = `${kind}::${answer.replace(/\s+/g, ' ').trim()}`;
      const label = this._shortLabelForQuestion(part);
      if (seen.has(key)) continue;
      const item = { label, answer, part };
      seen.set(key, item);
      items.push(item);
    }
    if (items.length < 2) return null;
    return this._formatCompoundReply(items);
  },

  _isTableJokeRequest(m) {
    return /(?:table\s+joke|another\s+table\s+joke|volcano\s+(?:vent\s+)?joke|tell\s+(?:me\s+)?(?:another\s+)?(?:a\s+)?joke)/.test(m);
  },

  _inferJokeTopic(m) {
    const s = String(m || '').toLowerCase();
    if (/2[\s-]*2[\s-]*2|clever\s+sum|sum/.test(s)) return 'sums';
    if (/lucky|charm/.test(s)) return 'luckyCharm';
    if (/rescue/.test(s)) return 'rescue';
    if (/countdown/.test(s)) return 'countdown';
    if (/first\s+roll|opening/.test(s)) return 'firstRoll';
    if (/reset|back\s+to\s+6/.test(s)) return 'reset';
    if (/token|sacrifice/.test(s)) return 'tokens';
    if (/win|last\s+player/.test(s)) return 'winning';
    if (/player|people|group/.test(s)) return 'players';
    if (/dice/.test(s)) return 'dice';
    if (/ante|bead|button|bowl|keeper|napkin/.test(s)) return 'betting';
    if (/vent/.test(s)) return 'vent';
    return 'general';
  },

  _withTableJoke(answer, topic, message) {
    const out = String(answer || '').trim();
    if (!out || /Table joke:/i.test(out) || out.length > 2200) return out;
    if (typeof pickVolcanoVentTableJoke !== 'function' || typeof formatTableJokeLine !== 'function') return out;
    const joke = pickVolcanoVentTableJoke(topic, `${message}::${topic}`);
    return out + formatTableJokeLine(joke);
  },

  _tableJoke(m) {
    const topic = this._inferJokeTopic(m);
    const seed = `${m}::${this.conversationHistory.length}::joke`;
    const joke = typeof pickVolcanoVentTableJoke === 'function'
      ? pickVolcanoVentTableJoke(topic, seed)
      : 'the volcano isn\'t angry; it\'s just counting.';
    const labels = {
      luckyCharm: 'lucky charm',
      vent: 'the Vent',
      rescue: 'rescue rolls',
      countdown: 'countdown',
      sums: '2+2+2 & sums',
      tokens: 'tokens',
      winning: 'winning',
      players: 'players',
      dice: 'dice',
      firstRoll: 'first-roll Vent',
      reset: 'reset to 6',
      betting: 'pretend bets',
      general: 'general'
    };
    const label = labels[topic] || 'general';
    return `**Volcano Vent table joke** (${label}):\n\n"${joke}"\n\nSay **"another table joke"**, **"table joke about the Vent"**, **"table joke about lucky charms"**, or **"table joke about 2+2+2"** — or ask any rules question and I will slip one in when it fits.`;
  },

  _route(message) {
    const m = message.toLowerCase();

    if (this._isGreeting(m)) return this.greet();
    if (this._isDeclineContinuation(m)) return this._declineContinuation();
    if (this._isThanks(m)) return this._thanks();
    if (this._isWalkthroughContinue(m)) return this._walkthrough({ continue: true });
    if (this._isAffirmativeContinuation(m)) return this._affirmativeContinuation(m);
    if (this._isBareAffirmative(m)) return this._yesClarify();
    if (this._isAcknowledgment(m)) return this._acknowledgment();
    if (/stop\s+teach|exit\s+teach|end\s+teach|leave\s+teach/.test(m)) {
      this.teachMode = false;
      return 'Teach mode off — ask anything in plain English, or say **"teach me"** to start again.';
    }
    if (/teach\s+menu|question\s+menu|what\s+questions?\s+(?:can\s+)?(?:i|we)\s+ask/.test(m)) {
      return typeof formatTeachMenuMarkdown === 'function' ? formatTeachMenuMarkdown() : this._startTeach();
    }
    if (this._isStartTeach(m)) return this._startTeach();
    if (this._isTableJokeRequest(m)) return this._tableJoke(m);
    if (/lucky\s*charm/.test(m)) {
      const charmReply = this._routeLuckyCharm(m);
      if (charmReply) return charmReply;
    }
    if (this.teachMode && typeof formatTeachAnswer === 'function') {
      const taught = formatTeachAnswer(message);
      if (taught) return taught;
    }
    const compound = this._answerCompoundQuestions(message);
    if (compound) return compound;
    return this._routeSingle(message);
  },

  _routeSingle(message) {
    const m = message.toLowerCase();

    if (this._isBettingFollowUp(m)) return this._bettingFollowUp(m);
    if (this._isWhatNext(m)) return this._whatNext();
    if (this._isWho(m)) return this._who();
    if (this._isGptSetupQuestion(m)) return this._gptSetupGuide(m);
    const charmReply = this._routeLuckyCharm(m);
    if (charmReply) return charmReply;
    if (this._isLoreQuestion(m)) return this._lore(m);
    if (this._isOtherDiceGameQuestion(m)) return this._otherDiceGameRedirect();
    if (/set\s+birthday|save\s+birthday|my\s+birthday/.test(m)) {
      adamAgeVerifier.openModal();
      return 'Let us set your birthday — you need to be **18+** to discuss pretend bets with buttons and beads. Game rules are always open!';
    }
    if (this._isEqualSixQuestion(m)) return this._equalSixGuide(m);
    if (this._isNoDiceLeftQuestion(m)) return this._noDiceLeftGuide(m);
    if (this._isRollingSixQuestion(m)) return this._rollingSixGuide(m);
    if (this._isQuoteRulesRequest(m)) return formatQuotedRulesLecture();
    if (this._isRulebookSourceQuestion(m)) return this._rulebookSources(m);
    if (this._isExplicitFullRulesRequest(m)) return formatFullRulesMarkdown();
    if (/^rule\s*book$|official\s+rules|canonical\s+rules/.test(m.trim())) return formatFullRulesMarkdown();
    if (/walk\s+(?:me\s+)?through|step\s+by\s+step|typical\s+turn|in\s+our\s+minds|mentally|imagine|reasoning|piece(?:ing)?\s+together|aha/.test(m)) {
      return this._walkthrough({ continue: false });
    }
    if (/how\s+(?:do\s+)?(?:i|we)\s+play|how\s+to\s+play|explain\s+the\s+game/.test(m) && !/full\s+rules/.test(m)) {
      return this._startTeach();
    }
    if (/clever\s+sum|example.*sum|push.?your.?luck|tension|thrill|laughter/.test(m)) return this._walkthroughExtras(m);
    if (/setup|set\s*up|what\s+do\s+i\s+need|materials|equipment/.test(m)) return this._setup();
    if (this._isVentCharmMissConfusionQuestion(m)) return formatVentCharmMissClarificationMarkdown();
    if (this._isScoringQuestion(m)) return this._scoring();
    if (this._isHowWeDecideQuestion(m)) return formatHowWeDecideMarkdown();
    if (this._isNapkinVoteQuestion(m)) return formatNapkinVoteMarkdown();
    if (this._isRoundsQuestion(m)) return formatRoundsAnswerMarkdown();
    if (this._isFirstRollVentQuestion(m)) return this._firstRollVentGuide();
    if (this._isWinningQuestion(m)) return this._winning();
    const basicAnswer = this._matchBasicRule(m);
    if (basicAnswer) return basicAnswer;
    if (this._isCraftTokenQuestion(m)) return this._craftTokensConcise(m);
    if (this._isGamblingHelpQuestion(m)) return this._gamblingHelp();
    if (this._isButtonsBeadsQuestion(m) || this._isBetting(m) || this._isPretendBetsFitQuestion(m)) return this._handleBetting(m);
    if (this._isTipsQuestion(m)) return this._tips(m);
    if (this._isVentQuestion(m)) return this._vent();
    if (/countdown|6.*5.*4|six.*five|target\s*number/.test(m)) return this._countdown();
    if (/2[\s-]*2[\s-]*2|how\s+many\s+dice|sum|add up/.test(m)) return this._sumDiceQuestion(m);
    if (/turn|round|roll|sum|add up|combine/.test(m) && !/lucky\s+charm|six|6\b|vent|how\s+many\s+round/.test(m)) return this._turnFlow(m);
    if (/variant|short\s+vent|cooperative|co-?op|6\s+point/.test(m)) return this._variants();
    if (/player|how\s+many\s+people|2\s+player|group/.test(m)) return this._players();
    if (this._isGameTokenQuestion(m)) return this._tokens();
    if (/dice|how\s+many\s+dice|d6/.test(m)) return this._dice();
    if (/kid|child|family|age|7\+|young/.test(m)) return this._kids();
    if (/adult|grown.?up|can\s+adults/.test(m)) return this._adults();
    if (/hello|hi\b|hey|good\s+(?:morning|afternoon|evening)/.test(m)) return this.greet();
    if (/help|what\s+can\s+you/.test(m)) return this._help();

    return this._fallback(message);
  },

  _isGreeting(m) {
    return /^(?:hi|hey|hello|howdy|yo|sup|greetings)(?:\s|!|$)/.test(m)
      || /^good\s+(?:morning|afternoon|evening)/.test(m);
  },

  _isThanks(m) {
    if (/^no\s+thanks/i.test(String(m || '').trim())) return false;
    if (/(?:thanks|thank\s+you|thx|ty|cheers|appreciate\s+it|much\s+appreciated)/.test(m)) {
      return m.length < 80 || /^(?:thanks|thank\s+you|thx|ty|cheers)/.test(m);
    }
    return false;
  },

  _isAcknowledgment(m) {
    if (this._isThanks(m) || this._isWhatNext(m) || this._isGreeting(m)) return false;
    if (this._isBareAffirmative(m)) return false;
    return /^(?:got\s+it|gotcha|okay|ok|k|cool|great|nice|perfect|awesome|helpful|useful|makes\s+sense|understood|i\s+see|alright|all\s+right|fair\s+enough|good\s+to\s+know|noted)(?:\s|!|\?|\.|$)/.test(m)
      || /^(?:that\s+)?(?:helps|makes\s+sense|clears?\s+it\s+up)(?:\s|!|\.|$)/.test(m);
  },

  _isBareAffirmative(m) {
    const t = String(m || '').trim().toLowerCase();
    return t.length < 40 && /^(?:yes|yeah|yep|yup|sure|sur|definitely|definetly|please|please\s+do)$/.test(t);
  },

  _lastMessageEndsWithQuestion() {
    return /\?\s*$/.test(this._lastAssistantText().trim());
  },

  _lastAssistantHadQuestion() {
    return /\?/.test(this._lastAssistantText());
  },

  _lastAssistantInvitedResponse() {
    const last = this._lastAssistantText();
    if (!last) return false;
    const lower = last.toLowerCase();
    if (this._lastAssistantOfferedContinuation()) return true;
    if (this._lastAssistantHadQuestion()) return true;
    return /reply\s+(?:\*\*)?(?:yes|sure)|say\s+(?:\*\*)?(?:yes|sure)|try\s+next|want\s+a\s+mini|mini\s+example|okay\s+go\s+ahead/i.test(lower);
  },

  _isWhatNext(m) {
    const t = String(m || '').trim().toLowerCase();
    if (/^(?:continue|keep\s+going|go\s+on|carry\s+on|please\s+continue|continue\s+please)(?:\s|!|\.|$)/.test(t)) {
      if (this._isWalkthroughContinue(t)) return false;
      return this._lastAssistantInvitedResponse() || this._activeTopic() !== 'general';
    }
    return /what(?:'s|\s+is|\s+happens)\s+next|and\s+then|then\s+what|what\s+now|what\s+do\s+(?:i|we)\s+do\s+now|go\s+on|keep\s+going|continue|tell\s+me\s+more|what\s+after\s+that|after\s+that\s+what/.test(m)
      || (/^go\s+ahead\.?$/i.test(t) && this._lastAssistantOfferedContinuation());
  },

  _isExplicitFullRulesRequest(m) {
    const t = String(m || '').trim().toLowerCase();
    return /^(?:full\s+rules|all\s+rules|complete\s+rules|rule\s*book|quote\s+the\s+rules|rule\s+lecture)$/.test(t)
      || /^(?:give\s+me\s+|show\s+me\s+|i\s+want\s+)?(?:the\s+)?(?:full|complete|all)\s+rules/.test(t)
      || /full\s+rules|all\s+rules|complete\s+rules/.test(t) && /want|need|give|show|list|read/.test(t);
  },

  _isWalkthroughContinue(m) {
    const t = String(m || '').trim().toLowerCase();
    if (!/^(?:please(?:\s+continue)?|continue(?:\s+please)?|keep\s+going|go\s+on|carry\s+on|yes|yeah|yep|yup|sure|sur|okay|ok|definitely|okay\s+go\s+ahead)(?:\s|!|\.|$)/.test(t)) {
      return false;
    }
    if (this.walkthroughStep > 0 && this.walkthroughStep < this._walkthroughSteps().length) return true;
    return this._lastAssistantOfferedStepContinue();
  },

  _lastAssistantOfferedStepContinue() {
    const last = this._lastAssistantText().toLowerCase();
    return /step \d+ of \d+/i.test(last)
      && /(?:for step|next step|say \*\*continue|keep going)/i.test(last);
  },

  _lastAssistantOfferedContinuation() {
    const last = this._lastAssistantText().toLowerCase();
    return /(?:mini|quick)\s+example|want\s+(?:a|an|the)\s+example|(?:would|do)\s+you\s+like|shall\s+i|want\s+me\s+to|want\s+to\s+(?:know|hear|see|learn)|should\s+i|show\s+you|walk\s+(?:you\s+)?through|go\s+deeper|try\s+next|follow[- ]?up|like\s+to\s+hear|hear\s+more|curious\s+about|want\s+more|dig\s+deeper|example\s+of|expand\s+on|interested\s+in|like\s+me\s+to|say\s+\*\*?(?:yes|sure)/i.test(last)
      || /reply\s+(?:yes|sure)|say\s+(?:yes|sure|okay\s+go\s+ahead)/i.test(last)
      || /ask\s+["']/.test(last)
      || /\*\*try\s+next:\*\*/i.test(last)
      || (this._lastMessageEndsWithQuestion() && /want|like|shall|example|more|explain|walk|show|continue|explore|mini/i.test(last));
  },

  _sanitizeSuggestedQuestion(question) {
    const q = String(question || '').replace(/\*\*/g, '').trim();
    const lower = q.toLowerCase();
    if (!q) return null;
    if (/full\s+rules|all\s+rules|complete\s+rules|quote\s+the\s+rules|rule\s+lecture|^rule\s*book$/.test(lower)) {
      return null;
    }
    return q;
  },

  _extractSuggestedQuestion(text) {
    const t = String(text || '');
    const tryNext = t.match(/\*\*try\s+next:\*\*\s*["']?([^"'\n*]+)/i)
      || t.match(/try\s+next[:\s]*["']?([^"'\n*]+)/i);
    if (tryNext) return this._sanitizeSuggestedQuestion(tryNext[1].replace(/\*\*/g, '').replace(/\.$/, '').trim());
    const askQuoted = t.match(/ask\s+["']([^"']+)["']/i);
    if (askQuoted) return askQuoted[1].trim();
    const endQuoted = t.match(/["']([^"']+\?)["']\s*$/);
    if (endQuoted) return endQuoted[1].trim();
    const offerAbout = t.match(/(?:would you like|do you want|shall i)[^?]*?(?:a\s+)?(?:mini\s+)?example\s+of\s+(.+?)\?/i);
    if (offerAbout) return `how does ${offerAbout[1].trim()} work`;
    return null;
  },

  _inferContinuationOffer(text) {
    const t = String(text || '').toLowerCase();
    const suggested = this._extractSuggestedQuestion(text);
    if (/try\s+next/i.test(t) && suggested) {
      return { type: 'suggested_question', question: suggested };
    }
    if (/(?:mini|quick)\s+example|want\s+.*example|show\s+you\s+an?\s+example|example\s+of/i.test(t)) {
      let topic = this._activeTopic();
      if (/bead/i.test(t) && !/button/.test(t)) topic = 'beads';
      else if (/button/i.test(t) && !/bead/.test(t)) topic = 'buttons';
      else if (/ante|pretend|keeper|napkin|bowl/.test(t)) topic = 'betting';
      else if (/vent|rescue/.test(t)) topic = 'vent';
      else if (/countdown|2\+2\+2|sum|tribute/.test(t)) topic = 'countdown';
      else if (/lucky\s+charm/.test(t)) topic = 'lucky_charm';
      return { type: 'example', topic };
    }
    if (this.walkthroughStep > 0 && this.walkthroughStep < this._walkthroughSteps().length) {
      return { type: 'walkthrough_step' };
    }
    if (/next step|step \d+ of|for the next step/i.test(t)) {
      return { type: 'walkthrough_step' };
    }
    if (/walk\s+(?:you\s+)?through|step\s+by\s+step/i.test(t)) {
      return { type: 'walkthrough' };
    }
    if (suggested) return { type: 'suggested_question', question: suggested };
    if (/tell\s+me\s+more|go\s+deeper|want\s+more|keep\s+going/i.test(t)) {
      return { type: 'more', topic: this._activeTopic() };
    }
    return { type: 'more', topic: this._activeTopic() };
  },

  _isAffirmativeContinuation(m) {
    const t = String(m || '').trim().toLowerCase();
    if (!t) return false;
    if (/^(?:no|nah|nope|not\s+now|skip|i'?m\s+good|no\s+thanks|don'?t|maybe\s+later)/.test(t)) return false;
    const invited = this._lastAssistantInvitedResponse();
    const shortYes = this._isBareAffirmative(t)
      || (t.length < 40 && /^(?:okay|ok|sounds\s+good)$/.test(t));
    const longYes = /^(?:sure|sur|definitely|definetly|definately|absolutely|for\s+sure|of\s+course|yes\s+please|yeah|yep|yup|please|please\s+do|please\s+continue|continue\s+please|ok(?:ay)?\s+go\s+ahead|go\s+ahead|do\s+it|let'?s\s+see|show\s+me|why\s+not|that\s+would\s+(?:help|be\s+great)|i'?d\s+like\s+that|sounds\s+good|hit\s+me|go\s+for\s+it)(?:\s|!|\.|$)/.test(t)
      || /^(?:okay|ok)\s+(?:go\s+ahead|sure|yes|please)/.test(t)
      || /^(?:yeah|yes|yep)\s+(?:sure|please|definitely|go\s+ahead)/.test(t)
      || /^(?:give\s+me\s+)?(?:the\s+)?(?:mini\s+)?example/.test(t);
    if (!invited) return false;
    return longYes || shortYes;
  },

  _yesClarify() {
    if (this._lastAssistantInvitedResponse()) {
      return this._affirmativeContinuation();
    }
    const topic = this._activeTopic();
    const label = this._topicLabel(topic);
    return `If that was **yes** or **sure** to something I offered, tap it again right after my message — or say **okay go ahead**.\n\nOtherwise ask in plain English about ${label}, or say **"what happens next?"**`;
  },

  _isDeclineContinuation(m) {
    const t = String(m || '').trim().toLowerCase();
    if (!this._lastAssistantOfferedContinuation()) return false;
    return /^(?:no|nah|nope|not\s+now|skip|i'?m\s+good|no\s+thanks|maybe\s+later|that'?s\s+ok|all\s+good)(?:\s|!|\.|$)/.test(t)
      || /^no\s+(?:thanks|thank\s+you)/.test(t);
  },

  _declineContinuation() {
    return 'No worries — jump in anytime with another plain-English question, or say **"teach menu"** to pick a topic.';
  },

  _affirmativeContinuation() {
    const last = this._lastAssistantText();
    const offer = this._inferContinuationOffer(last);

    if (offer.type === 'suggested_question' && offer.question) {
      const q = this._sanitizeSuggestedQuestion(offer.question);
      if (q) return this._route(q.toLowerCase());
      return this._whatNext();
    }
    if (offer.type === 'example') {
      return this._miniExampleForTopic(offer.topic);
    }
    if (offer.type === 'walkthrough_step') {
      return this._walkthrough({ continue: true });
    }
    if (offer.type === 'walkthrough') {
      if (this.walkthroughStep > 0 && this.walkthroughStep < this._walkthroughSteps().length) {
        return this._walkthrough({ continue: true });
      }
      if (/whole heartbeat|over many rounds|dig deeper/i.test(last)) {
        return this._whatNext();
      }
      return this._walkthrough({ continue: false });
    }
    if (offer.type === 'more') {
      if (offer.topic === 'betting' && adamAgeVerifier.canDiscussBetting()) {
        return this._bettingFollowUp('tell me more');
      }
      return this._whatNext();
    }
    return this._whatNext();
  },

  _miniExampleForTopic(topic) {
    const examples = {
      countdown:
        '**Mini example — countdown:** Roll **2-2-2-4-5-1** for tribute **6**. Set the three **2**s aside — **3 dice** left. Next target is **5**, not 6. Hit **5** with **2+3**, set those aside — **1 die** left for **4**, and so on down to **1**.',
      vent:
        '**Mini example — the Vent:** You need **4** with 2 dice, roll **2-3** (no 4, no sum of 4). **Vent!** **Rescue reroll:** roll those **same 2 dice again** (fresh roll). Lucky charm **3** on the rescue → safe. No **3** on rescue → lose **1 token**. All **6** dice return; **next player** at **6**.',
      first_roll_vent:
        '**Mini example — Vent on the first roll:** Open with all **6** for tribute **6**, roll **1-2-3-4-5-2** — miss → **Vent** right away. **Rescue reroll:** all **6 dice** again. Lucky charm **2** on rescue → safe. No **2** on rescue → lose **1 token**. **Next player** at **6**.',
      lucky_charm:
        '**Mini example — lucky charm:** At setup, Riley picks **5** and writes it on paper. Later, a Vent **rescue reroll** (same dice count, fresh roll) shows **5** — saved, **no token** lost. The **next player** rolls all **6** at **6**.',
      betting:
        '**Mini example — beads & antes:** Four adults each drop **one pony bead** into the bowl when countdown resets to **6**. Play the normal game. At the end — **House Rule 1** — everyone takes their beads back. Winner = whoever still has **Vent tokens**.',
      beads:
        '**Mini example — beads:** A shared bowl of mismatched pony beads. Each player starts with **3 beads** for antes. Every new chain at **6**, everyone drops **one bead** in. After the night, **return all** — winner is last **Vent tokens**, not who has the most beads.',
      buttons:
        '**Mini example — buttons:** Sewing buttons in a jar — everyone starts equal. One button per player into the bowl at **6**. Play on. **House Rule 1:** every button goes home with its owner after the game.',
      sums:
        '**Mini example — clever sums:** Need **6** with roll **2-2-2-1-4-5** → **2+2+2** pays tribute **6**. **3 dice** remain → next need **5**. With **1-2-2** you could pay **5** next.',
      tokens:
        '**Mini example — Vent tokens:** Start with **3** tokens. Fail a Vent rescue → lose **1**. At **0 tokens**, you are out. Last player with tokens wins — bowl beads do not count as Vent tokens.',
      rolling_six:
        '**Mini example — rolling a 6:** Roll **6-6-3-2-1-4** for tribute **6**. Set **one** six aside (only one needed). Pass **6-3-2-1-4** — wait, set one 6 aside, pass the other five dice. Next player needs **5**.',
      walkthrough:
        '**Mini example — one chain:** Pay **6** → **5** → **4** → miss on **3** → Vent rescue saves with lucky charm → **next player** fresh at **6**. Tokens only drop when a rescue **fails**.',
      overview:
        '**Mini example — one turn:** All **6** dice roll for **6**. Pay with **4+2**. **4 dice** left for **5**. Pay **5** with lone **5**. **3 dice** left for **4**… keep going or hit the **Vent**.',
      general:
        '**Mini example:** Pay tribute **6** with **2+2+2**, pass **3 dice**, work down to **5**, then **4**… miss → **Vent** → rescue or lose a token → after **1**, **next player** at **6**.'
    };
    return examples[topic] || examples.general;
  },

  _inferTopicFromText(text) {
    const t = String(text || '').toLowerCase();
    if (/how antes work|pretend bet|house rule|keeper pot|napkin vote|how we decide|what can be used for pretend|craft token|poker chip|marbles? & jacks|seeds? & beans|paper clips? &|ante bowl|shared bowl.*ante/i.test(t)) return 'betting';
    if (/roll(?:ed|ing)?\s+(?:a\s+)?(?:six|6)|multiple sixes|lone\s+\*\*6\*\*/.test(t)) return 'rolling_six';
    if (/2\+2\+2|three dice can equal|sum.*6/.test(t)) return 'sums';
    if (/first\s+roll.*vent|wind\s+up\s+on.*vent|vent.*first\s+roll/.test(t)) return 'first_roll_vent';
    if (/walk through|step\s*1|volcano wants\s*6/.test(t)) return 'walkthrough';
    if (/countdown|6→5|6\s*→\s*5/.test(t)) return 'countdown';
    if (/vent|rescue|sacrifice|miss the mark/.test(t)) return 'vent';
    if (/lucky charm/.test(t)) return 'lucky_charm';
    if (/buttons|beads|keeper|ante/.test(t)) return 'betting';
    if (/token|paper lives|scoring|lose\s+1/.test(t)) return 'tokens';
    if (/setup|materials|shared bowl/.test(t)) return 'setup';
    if (/how to play|in a nutshell|quick steps/.test(t)) return 'overview';
    if (/last player|who wins|wins/.test(t)) return 'winning';
    if (/turn flow|each round/.test(t)) return 'turn_flow';
    return null;
  },

  _topicLabel(topic) {
    const labels = {
      sums: 'clever sums like **2+2+2**',
      rolling_six: 'rolling a **6**',
      walkthrough: 'the walkthrough',
      first_roll_vent: 'Vent on the first roll',
      countdown: 'the **6→1** countdown',
      vent: 'the **Vent**',
      lucky_charm: 'lucky charms',
      betting: 'pretend bets',
      tokens: 'tokens',
      setup: 'setup',
      overview: 'how to play',
      winning: 'winning',
      turn_flow: 'turn flow'
    };
    return labels[topic] || 'Volcano Vent Dice';
  },

  _activeTopic() {
    const lastAssistant = [...this.conversationHistory].reverse().find(m => m.role === 'assistant');
    return this._inferTopicFromText(lastAssistant?.content) || this.lastTopic || 'general';
  },

  _acknowledgment() {
    const topic = this._activeTopic();
    const label = this._topicLabel(topic);
    if (this._lastAssistantOfferedContinuation() || this._lastMessageEndsWithQuestion()) {
      return 'If that was a **yes** to my question, say **yes**, **sure**, or **okay go ahead** — I will continue. Or ask something new in plain English.';
    }
    if (topic === 'betting') {
      return 'Glad that helps! Still on **pretend bets** — **"tell me more"**, **"what about keeper?"**, or any follow-up in plain English.';
    }
    if (topic === 'general') {
      return 'Glad that landed! Ask **"how do I play?"**, **"what happens next?"**, or anything about the countdown, **Vent**, or lucky charm.';
    }
    return `Glad that helps! We were on ${label} — **"what happens next?"** or another question anytime.`;
  },

  _whatNext() {
    const topic = this._activeTopic();
    const lastUser = [...this.conversationHistory].reverse().find(m => m.role === 'user');
    const userCtx = String(lastUser?.content || '').toLowerCase();

    if (topic === 'rolling_six' || /roll.*six|multiple six/.test(userCtx)) {
      return '**After paying tribute 6 with a six:** set **one** six aside, pass the rest. Next player rolls for **5**. Extra sixes in that roll stay in the passing pool — only the dice used for the tribute get set aside.';
    }
    if (/2[\s-]*2[\s-]*2|three dice|equal\s*6/.test(userCtx) || topic === 'sums') {
      return '**Next after 2+2+2=6:** set those three twos aside. **3 dice** go to the next player — they need **5**, not 6. Then **4 → 3 → 2 → 1**. Miss any step? **Vent** rescue with your **lucky charm**, or lose a token.';
    }
    if (topic === 'walkthrough' || /walk|step/.test(userCtx)) {
      return '**Next in the chain:** after tribute **6**, the demand drops to **5** with whatever dice remain — then **4, 3, 2, 1**. Someone misses? **Vent** edge → one rescue roll. Charm saves you; miss it and you lose a token. Hit **1**? All **6 dice** come back and the **next player** starts fresh at **6**.';
    }
    if (topic === 'vent') {
      return '**After the Vent:** charm save → all **6 dice** to the pool, reset to **6**, **next player** rolls (rescuer does not). Miss the rescue → **lose 1 token**, same dice reset, **next player** at **6**. Out of tokens? You\'re done.';
    }
    if (topic === 'lucky_charm') {
      return '**What happens next with your charm:** you only need it when you **miss** a countdown number and stand on the **Vent**. One rescue roll with the same dice you failed with — your charm on any die saves you. No charm? Sacrifice a token and move on.';
    }
    if (topic === 'countdown') {
      return '**After each successful tribute:** set those dice aside and pass the rest. Targets keep dropping **6 → 5 → 4 → 3 → 2 → 1**. After **1**, all dice return and the **next player** starts at **6** again. Can\'t hit the number? That\'s when the **Vent** opens.';
    }
    if (topic === 'setup') {
      return '**Once you\'re set up:** first player rolls all **6 dice** for tribute **6** (lone **6**, **4+2**, **2+2+2**, etc.). Set paying dice aside, pass the rest, and the countdown continues at **5**.';
    }
    if (topic === 'tokens' || topic === 'winning') {
      return '**During play:** lose a token only when you **fail** the lucky-charm rescue on the **Vent**. The countdown keeps cycling around the table until only **one player** still has tokens — that\'s your winner.';
    }
    if (topic === 'betting') {
      return this._bettingWhatNext(userCtx);
    }
    if (topic === 'overview' || topic === 'turn_flow') {
      return '**Typical flow:** roll for **6** with all dice → pass leftovers down **5, 4, 3, 2, 1** → miss and hit the **Vent** → rescue or lose a token → after **1**, next player starts fresh at **6**. Last tokens wins.';
    }
    return '**Rough order of play:** setup (6 dice, 3 tokens, lucky charm) → countdown **6→1** with sums allowed → **Vent** on a miss → last player with tokens wins. Say **"walk me through"** for the full story, or name a step like **"the Vent"** or **"2+2+2"**.';
  },

  _lastAssistantText() {
    const last = [...this.conversationHistory].reverse().find(m => m.role === 'assistant');
    return String(last?.content || '');
  },

  _inferBettingSubtopic(assistantText, userMsg) {
    const t = String(assistantText || '').toLowerCase();
    const u = String(userMsg || '').toLowerCase();
    if (/keeper|house rule 2|house rule two|keeper pot/.test(u) || (/keeper|house rule 2/.test(t) && !/ante/.test(u))) return 'keeper';
    if (/ante|when to pay|when do we pay/.test(u) || /how antes work|when to pay an ante|at ante time/.test(t)) return 'antes';
    if (/napkin|how we decide|unanimous/.test(u) || /napkin vote|how we decide/.test(t)) return 'napkin';
    if (/what can be used|craft token|seeds|marble|poker chip|pebble|paper clip/.test(t) || /material|what can.*use/.test(u)) return 'materials';
    if (/side bet|antes or side/.test(t) || /side bet/.test(u)) return 'side_bets';
    if (/return all|house rule 1|house rule one/.test(u) || /house rule 1|return all/.test(t)) return 'return_all';
    if (/keeper|keeper pot|house rule 2/.test(t)) return 'keeper';
    if (/ante/.test(t)) return 'antes';
    if (/napkin/.test(t)) return 'napkin';
    return 'overview';
  },

  _onBettingThread() {
    return this._activeTopic() === 'betting' || this.lastTopic === 'betting';
  },

  _isBettingFollowUp(m) {
    if (!this._onBettingThread() && !/pretend\s+bet|buttons?\s+and\s+beads?/.test(m)) return false;
    if (!adamAgeVerifier.canDiscussBetting()) return false;
    return /further\s+inquir|more\s+(?:about|on)\s+pretend|follow[\s-]?up.*(?:pretend|bet)|continue.*pretend\s+bet/.test(m)
      || /^(?:tell\s+me\s+more|go\s+on|what\s+else|anything\s+else|more\s+on\s+that|keep\s+going|say\s+more)(?:\s+about\s+pretend|\s+about\s+bets?)?\.?$/i.test(m.trim())
      || /what\s+about\s+(?:the\s+)?(?:keeper|antes?|napkin|return\s+all|side\s+bets?|materials?|seeds?|marbles?)/.test(m)
      || /^(?:and\s+)?(?:the\s+)?(?:keeper|antes?|napkin|return\s+all|side\s+bets?)\??$/i.test(m.trim())
      || (m.length < 50 && /^(?:what\s+about|how\s+about)\s+/.test(m) && /keeper|ante|napkin|return|side|seed|marble|bet/.test(m));
  },

  _bettingFollowUp(m) {
    const u = String(m || '').toLowerCase();
    const last = this._lastAssistantText();
    const sub = this._inferBettingSubtopic(last, m);

    if (/keeper/.test(u) && /not|avoid|skip|when not/.test(u)) {
      return formatKeeperGuidanceMarkdown({ focus: 'not' }) + this._bettingFooter();
    }
    if (/keeper/.test(u)) {
      return formatKeeperGuidanceMarkdown({ focus: /okay|ok|fine|when/.test(u) ? 'ok' : undefined }) + this._bettingFooter();
    }
    if (/ante/.test(u)) return formatAntesInstructionsMarkdown() + this._bettingFooter();
    if (/napkin|decide|vote/.test(u)) return formatHowWeDecideMarkdown() + this._bettingFooter();
    if (/return\s+all|house\s+rule\s*1/.test(u)) return this._houseRules('house rule one') + '';
    if (/what can|material|seed|marble|pebble|use for/.test(u)) {
      return formatCraftTokensMarkdown() + this._bettingFooter();
    }
    if (/side\s+bet|antes?\s+or\s+side/.test(u)) {
      return formatPretendBetsFitMarkdown() + this._bettingFooter();
    }
    if (/tell\s+me\s+more|go\s+on|what\s+else|more\s+on|keep\s+going|further|continue|follow/.test(u)) {
      const next = typeof formatBettingFollowUpNext === 'function'
        ? formatBettingFollowUpNext(sub)
        : '';
      const menu = typeof formatBettingFollowUpMenu === 'function' ? formatBettingFollowUpMenu() : '';
      return `${next}\n\n${menu}` + this._bettingFooter();
    }
    return (typeof formatBettingFollowUpMenu === 'function' ? formatBettingFollowUpMenu() : this._handleBetting(m)) + this._bettingFooter();
  },

  _bettingWhatNext(userCtx) {
    const last = this._lastAssistantText();
    const sub = this._inferBettingSubtopic(last, userCtx);
    if (/keeper/.test(userCtx)) {
      return formatKeeperGuidanceMarkdown({ focus: /not|avoid/.test(userCtx) ? 'not' : 'ok' }) + this._bettingFooter();
    }
    if (/ante/.test(userCtx)) return formatAntesInstructionsMarkdown() + this._bettingFooter();
    if (/napkin|decide|vote/.test(userCtx)) return formatHowWeDecideMarkdown() + this._bettingFooter();
    if (/material|what can|seed|marble/.test(userCtx)) {
      return formatCraftTokensMarkdown() + this._bettingFooter();
    }
    const next = typeof formatBettingFollowUpNext === 'function'
      ? formatBettingFollowUpNext(sub)
      : '**Next:** napkin, antes, then play.';
    return `${next}\n\nAsk **"tell me more"** or name a topic — **keeper**, **antes**, **napkin vote** — and I will keep going in plain English.` + this._bettingFooter();
  },

  _isWho(m) {
    return /who\s+are\s+you|your\s+name|what(?:'s|\s+is)\s+your\s+name/.test(m);
  },

  _isGameTokenQuestion(m) {
    if (/pretend|bet|ante|keeper|house\s+rule|bowl|pot/.test(m) && /bead|button/.test(m)) return false;
    return /(?:game\s+)?token|chip|how\s+many\s+(?:token|chip)/.test(m)
      || (/lose\s+(?:a\s+)?token|sacrifice\s+(?:a\s+)?token/.test(m) && !/bead|button|pretend|bet/.test(m));
  },

  _isButtonsBeadsQuestion(m) {
    return (
      /how\s+do\s+(?:the\s+)?(?:buttons?|beads?)\s+work/.test(m)
      || /what\s+do\s+(?:the\s+)?(?:buttons?|beads?)\s+do/.test(m)
      || /how\s+do\s+(?:the\s+)?buttons?\s+and\s+beads?/.test(m)
      || /buttons?\s+and\s+beads?/.test(m) && /how|what|work|mean|pretend|bet|pot|bowl|keeper|return/.test(m)
      || /what\s+(?:are|is)\s+(?:the\s+)?(?:pretend\s+)?(?:buttons?|beads?)/.test(m)
      || /pretend\s+(?:bet|play|money|stakes)/.test(m)
      || /(?:craft|sewing)\s+(?:bead|button)/.test(m)
      || /shared\s+bowl/.test(m)
      || /when\s+(?:is\s+)?keeper|keeper\s+(?:okay|ok|fine|not)/.test(m)
      || /return\s+(?:all|everything)|get\s+(?:my|our)\s+(?:bead|button)/.test(m) && /back|after/.test(m)
      || /(?:real|actual)\s+money/.test(m) && /bead|button|bet|pretend/.test(m)
      || /how\s+much.*(?:bead|button|pot|ante)/.test(m)
      || /pot\s+size|size\s+of\s+(?:the\s+)?pot|one\s+ante\s+per\s+reset/.test(m)
      || /how\s+(?:do|does)\s+antes?\s+work|what\s+(?:are|is)\s+antes?|explain\s+antes?|instructions?\s+(?:on|for)\s+antes?/.test(m)
      || /what\s+can\s+(?:be|i|we)\s+use\s+for\s+(?:pretend\s+)?bets?/.test(m)
      || /what\s+goes\s+in\s+(?:the\s+)?(?:bowl|pot)/.test(m)
      || /winner\s+keep(?:s)?\s+(?:the\s+)?(?:pot|bead|button)/.test(m)
      || /first\s+time.*(?:pretend|bet|bead|button)/.test(m)
      || /pressure.*(?:bet|bead|button)/.test(m)
      || /(?:bead|button).*(?:replace|instead\s+of).*(?:token|vent)/.test(m)
    );
  },

  _isBetting(m) {
    if (this._isGameTokenQuestion(m)) return false;
    return (
      /\b(?:bet|bets|betting|wager|antes?|pot|pretend|keeper|return\s+all)\b/.test(m)
      || /\b(?:button|buttons|bead|beads)\b/.test(m) && /\b(?:bet|pretend|house|keeper|pot|ante|bowl)\b/.test(m)
      || /house\s+rule/.test(m)
    );
  },

  _isRoundsQuestion(m) {
    return /how\s+many\s+round|how\s+many\s+cycle|how\s+many\s+countdown|number\s+of\s+round/.test(m)
      || /how\s+long\s+(?:is\s+)?(?:a\s+)?(?:game|match|night)/.test(m)
      || /how\s+many\s+times\s+(?:do\s+we|does\s+it)\s+(?:play|go\s+around)/.test(m);
  },

  _isHowWeDecideQuestion(m) {
    if (/first\s+player|who\s+goes\s+first|goes\s+first/.test(m)) return false;
    return /how\s+(?:do|does)\s+we\s+decide|how\s+to\s+decide|who\s+decides|how\s+(?:do|does)\s+(?:the\s+)?(?:table|group)\s+(?:decide|vote|agree)/.test(m)
      || /do\s+we\s+need\s+everyone|does\s+everyone\s+need|everyone\s+(?:must\s+)?(?:agree|vote|say\s+yes|take\s+part)|must\s+everyone\s+vote/.test(m)
        && /keeper|bead|button|napkin|house\s+rule|pretend|pot|unanimous|return/.test(m)
      || /unanimous/.test(m) && /keeper|bead|button|napkin|vote/.test(m);
  },

  _isNapkinVoteQuestion(m) {
    return /napkin\s+vote|napkin\s+agreement|(?:what|explain).*(?:is\s+)?(?:a\s+)?napkin|tell\s+me\s+about\s+(?:the\s+)?napkin|write\s+(?:it\s+)?on\s+(?:a\s+)?napkin|scrap\s+paper\s+vote/.test(m);
  },

  _matchBasicRule(m) {
    if (typeof matchBasicRuleQuestion !== 'function') return null;
    return matchBasicRuleQuestion(m);
  },

  _isCraftTokenQuestion(m) {
    return (
      /gold|silver|precious|jewelry|jewellery|poker\s+chip/.test(m) && /bead|button|token|chip|ante|pretend|bet/.test(m)
      || /craft\s*shop|sewing\s+button|fabric\s+button/.test(m)
      || /seed|bean|corn\s+kernel|pumpkin\s+seed|sunflower/.test(m)
      || /pebble|river\s+stone|aquarium\s+gravel|gem\s+chip/.test(m)
      || /paper\s*clip|binder\s*clip|brass\s+fastener|fastener/.test(m)
      || /marble|jacks?\b/.test(m) && /ante|pretend|bet|token|bead|button|chip|bowl|pot/.test(m)
      || /pot.*match|match.*pot|same\s+kind|same\s+size|any\s+size|mismatched/.test(m) && /bead|button|token|chip|pot|ante/.test(m)
      || /what\s+(?:kind|type)\s+of\s+(?:bead|button|token|ante)/.test(m)
      || /what\s+can\s+(?:be|i|we)\s+use\s+for\s+(?:pretend\s+)?(?:bets?|antes?)/.test(m)
      || /what\s+(?:to|can)\s+use\s+for\s+(?:pretend\s+)?bets?/.test(m)
      || /can\s+i\s+use\s+(?:bead|button|seed|bean|pebble|marble|paper\s*clip)/.test(m)
      || /seeds?\s+and\s+beans|stones?\s+and\s+pebble/.test(m)
    );
  },

  _isGamblingHelpQuestion(m) {
    return (
      /1[-\s]?800[-\s]?(?:gambler|426[-\s]?2537)/.test(m)
      || /gambling\s+help|problem\s+gambl|gambl(?:ing)?\s+(?:problem|addiction|support)/.test(m)
      || /out\s+of\s+hand|getting\s+(?:too\s+)?serious|things?\s+(?:are\s+)?getting/.test(m) && /bet|bead|button|gambl|pot|token/.test(m)
      || /need\s+help.*(?:bet|gambl|bead|button)/.test(m)
      || /helpline|hotline/.test(m) && /gambl|bet/.test(m)
    );
  },

  _craftTokensConcise(m) {
    const t = String(m || '').toLowerCase();
    const c = VOLCANO_VENT_CRAFT_TOKENS;
    if (/poker\s+chip/.test(t)) {
      let out = '**Never real poker chips** — too casino. Use **marbles**, **jacks**, beans, beads, buttons, pebbles, or paper clips for antes instead.';
      if (adamAgeVerifier.canDiscussBetting()) out += this._bettingFooter();
      return out;
    }
    if (/gold|silver|precious|jewelry|jewellery/.test(t)) {
      let out = '**Skip gold, silver, and precious-metal tokens** — they feel too much like real stakes. Use seeds, beads, buttons, pebbles, clips, **marbles**, or **jacks** instead.';
      if (adamAgeVerifier.canDiscussBetting()) out += this._bettingFooter();
      return out;
    }
    if (/pot.*match|match.*pot|same\s+(?:kind|size)|any\s+size|mismatched/.test(t)) {
      let out = '**The pot does not have to match** — mix beads, beans, pebbles, and clips in one bowl if the napkin agrees. Everyone still starts with **equal stacks**.';
      if (adamAgeVerifier.canDiscussBetting()) out += this._bettingFooter();
      return out;
    }
    if (/seed|bean|corn|pumpkin|sunflower/.test(t) && !/what\s+can/.test(t)) {
      let out = '**Seeds & beans — great for antes:** dried beans, corn kernels, pumpkin or sunflower seeds. Lightweight, easy to count, rustic. Fine in the same bowl as buttons if everyone agrees on the napkin.';
      if (adamAgeVerifier.canDiscussBetting()) out += this._bettingFooter();
      return out;
    }
    if (/pebble|stone|gravel|gem\s+chip/.test(t)) {
      let out = '**Stones & pebbles work** — smooth river stones, aquarium gravel, polished gem chips. Durable; different colors can mean different pretend ante sizes (like colored buttons).';
      if (adamAgeVerifier.canDiscussBetting()) out += this._bettingFooter();
      return out;
    }
    if (/paper\s*clip|binder\s*clip|fastener/.test(t)) {
      let out = '**Paper clips & fasteners** — metal or colored plastic clips, binder clips, brass fasteners. Office-supply tokens that stack and clink; easy to count antes.';
      if (adamAgeVerifier.canDiscussBetting()) out += this._bettingFooter();
      return out;
    }
    if (/marble|jack\b/.test(t)) {
      let out = '**Marbles & jacks** — perfect pretend tokens. **Use these instead of real poker chips** — clearly a game, not a casino.';
      if (adamAgeVerifier.canDiscussBetting()) out += this._bettingFooter();
      return out;
    }
    let out = formatCraftTokensMarkdown();
    if (adamAgeVerifier.canDiscussBetting()) out += this._bettingFooter();
    return out;
  },

  _gamblingHelp() {
    const h = VOLCANO_VENT_HELPLINE;
    return `**${h.name}** — **${h.phone}** (free, confidential, **24/7**).\n\n${h.note}\n\nFor the game itself: stick with **craft-shop beads** and **regular sewing buttons** — pretend only, never real money. **House Rule 1** (everyone gets their tokens back) is the easy default if the table wants to keep things light.`;
  },

  _bettingFooter() {
    if (!adamAgeVerifier.canDiscussBetting()) return '';
    return typeof formatBettingSupportFooter === 'function' ? formatBettingSupportFooter() : '';
  },

  _thanks() {
    const topic = this._activeTopic();
    if (topic === 'betting') {
      return 'You\'re welcome! Happy to keep going on **pretend bets** — **"tell me more"**, **"what about keeper?"**, or any plain-English follow-up works.';
    }
    if (topic && topic !== 'general') {
      return `You're welcome! Happy to keep chatting about ${this._topicLabel(topic)} — or ask **"what happens next?"** if you want the next step.`;
    }
    return 'You\'re welcome! Happy rolling — ask me anything about **Volcano Vent Dice** whenever you need.';
  },

  _who() {
    const gptNote = typeof adamLlmSettings !== 'undefined' && adamLlmSettings.isUsable()
      ? ' **GPT is on** for plain-English answers.'
      : ' Say **"setup GPT"** for API key + billing credits steps.';
    return `I am **${ADAM_BOT_NAME}** — your guide for **Volcano Vent Dice** only. Your chats are **strictly confidential** — never shared with other users, like any private GPT session.${gptNote} I quote from the **Volcano Vent Dice Home Rule Guide** stored in this app, plus plain-English help on scoring, setup, and variants. For pretend bets I only advise **buttons, beads, and craft things** (seeds, pebbles, marbles, clips, jacks) — two house rules, **18+** with a saved birthday. I do not discuss other dice games.`;
  },

  _isGptSetupQuestion(m) {
    return (
      /setup\s+gpt|set\s+up\s+gpt|enable\s+gpt|turn\s+on\s+gpt|gpt\s+setup|how\s+(?:do|to)\s+(?:i|we)\s+(?:set\s+up|enable|use|get)\s+gpt/.test(m)
      || (/api\s+key|openai\s+key|sk-/.test(m) && /(?:how|where|set\s+up|paste|get|create|add)/.test(m))
      || /openai\s+(?:account|billing|credits?|api)/.test(m)
      || /billing\s+credits?|add\s+credits?|pay\s+as\s+you\s+go/.test(m)
      || /how\s+(?:do|to)\s+(?:i|we)\s+(?:use|connect)\s+(?:gpt|openai)/.test(m)
      || /^gpt\s+settings?$|^openai\s+settings?$/.test(m.trim())
    );
  },

  _gptSetupGuide(m) {
    if (typeof adamLlmSettings !== 'undefined' && adamLlmSettings.isUsable()) {
      const label = adamLlmSettings.modelLabel(adamLlmSettings.get().model);
      return `**GPT is already on** (${label}). Open **Settings ⚙️** to change model or key.\n\n${adamLlmSettings.setupGuideFull()}`;
    }
    if (typeof openSettings === 'function' && /settings|⚙/.test(m)) {
      openSettings();
    }
    return typeof adamLlmSettings !== 'undefined'
      ? adamLlmSettings.setupGuideFull()
      : 'Open **Settings ⚙️** → **GPT** to paste an OpenAI API key (sk-…) and add billing credits at platform.openai.com/account/billing.';
  },

  _isLoreQuestion(m) {
    return typeof matchLoreQuestion === 'function' && matchLoreQuestion(m);
  },

  _lore(m) {
    const topic = typeof matchLoreTopic === 'function' ? matchLoreTopic(m) : 'overview';
    const base = typeof formatVolcanoVentLoreMarkdown === 'function'
      ? formatVolcanoVentLoreMarkdown(topic || 'overview')
      : VOLCANO_VENT_LORE?.overview || 'Ask about **why the Vent**, the **countdown**, or **volcano vent lore**.';
    const jokeTopic = topic === 'luckyCharm' ? 'luckyCharm'
      : topic === 'whyVent' || topic === 'ventEdge' ? 'vent'
      : topic === 'countdown' ? 'countdown'
      : topic === 'crawling' ? 'countdown'
      : 'general';
    return this._withTableJoke(base, jokeTopic, m);
  },

  _isOtherDiceGameQuestion(m) {
    return (
      /\b(?:yahtzee|yatzy|craps|farkle|liar'?s?\s+dice|bunco|bunko|pig\s+dice|tenzi|zilch|balut|chuck-?a-?luck|sic\s+bo|street\s+craps|shut\s+the\s+box|left\s+right\s+center|lcr)\b/.test(m)
      || /\bother\s+dice\s+game|different\s+dice\s+game|another\s+dice\s+game|dice\s+game\s+(?:like|such\s+as|besides|other\s+than)|recommend\s+(?:a\s+)?dice\s+game|what\s+dice\s+game\s+should/.test(m)
      || (/\bdice\s+game/.test(m) && !/volcano|vent\s+dice/i.test(m))
    );
  },

  _otherDiceGameRedirect() {
    return `I only cover **Volcano Vent Dice** — I do not explain or compare other dice games.\n\nAsk me about the **Vent**, **countdown**, **lucky charm**, or **pretend bets with buttons and beads** if you are **18+**.`;
  },

  _isRulebookSourceQuestion(m) {
    return (
      /rule\s*book|rulebook|rule\s+lecture|import\s+rule/.test(m)
      || /quote\s+(?:the\s+)?rules|rules?\s+we\s+can\s+quote/.test(m)
      || (/standard|official|canonical|published/.test(m) && /rule/.test(m))
      || /what\s+source|where.*rules\s+from|cite|attribution/.test(m)
      || /hoyle|according\s+to\s+hoyle|book\s+of\s+hoyle/.test(m)
    );
  },

  _isQuoteRulesRequest(m) {
    return /quote\s+(?:the\s+)?rules|rule\s+lecture|read\s+(?:the\s+)?rules\s+aloud/.test(m);
  },

  _rulebookSources(m) {
    if (this._isQuoteRulesRequest(m)) return formatQuotedRulesLecture();
    return formatRulebookSourceMarkdown();
  },

  _help() {
    let out = 'I can help with:\n';
    out += '• **Teach me** — brief summary, then learn by **questions** (not a lecture)\n';
    out += '• **Teach menu** — plain-English starters for all modes & house rules\n';
    out += '• **Full rules** — long version only if you ask\n';
    out += '• **Variants** — paper lives, short game, gentle Vent\n';
    out += '• **Lore** — why the **Vent**, countdown story, crawling down the volcano\n';
    out += '• **Two questions at once** — e.g. *"what is the Vent and how do lucky charms work?"*\n';
    out += '• **Table jokes** — say **"table joke"** or **"table joke about the Vent"**\n';
    if (typeof adamLlmSettings !== 'undefined' && adamLlmSettings.isUsable()) {
      out += '• **GPT** — on (plain-English answers)\n';
    } else {
      out += '• **Setup GPT** — say **"setup GPT"** for API key + billing credits (or **Settings ⚙️**)\n';
    }
    if (adamAgeVerifier.canDiscussBetting()) {
      out += '• **Pretend bets** — buttons, beads, house rules one and two\n';
    } else {
      out += '• **Pretend bets** — unlock at **18+** (Settings → birthday)\n';
    }
    out += '\nJust chat naturally — I will do my best to answer!';
    return out;
  },

  _isStartTeach(m) {
    return /teach\s+me|learn\s+by\s+question|teach\s+by\s+question|quiz\s+me|start\s+teach/.test(m);
  },

  _startTeach() {
    this.teachMode = true;
    this.lastTopic = 'overview';
    return typeof formatTeachStartMarkdown === 'function'
      ? formatTeachStartMarkdown()
      : this._howToPlayBrief();
  },

  _howToPlayBrief() {
    const g = VOLCANO_VENT_GAME;
    return `${g.summary}\n\nAsk one question at a time — say **"teach menu"** for starters.`;
  },

  _setup() {
    const g = VOLCANO_VENT_GAME;
    return `**You need:** ${g.dice}; **3 tokens** per player; paper for lucky charms (**1 through 6**). Each player picks a charm at setup (favorite number is fine), writes it down, then roll all **6 dice** for tribute **6**. **${g.players}** players.\n\nKids → **paper lives**, no pretend bets. Say **"full rules"** for the long version.`;
  },

  _isVentCharmMissConfusionQuestion(m) {
    if (/who\s+(?:gets?|rolls?|takes?)|do\s+i\s+roll\s+again|next\s+player|whose\s+turn/.test(m)) return false;
    if (/after.*(?:save|saved)|(?:save|saved).*(?:who|next|turn)/.test(m)) return false;
    return /automatic(?:ally)?\s+safe|auto\s+safe/.test(m) && /charm|vent|rescue/.test(m)
      || /charm.*(?:in|on|was\s+in|showed|appeared).*(?:miss|failed)|(?:miss|failed).*(?:charm|lucky).*(?:in|on|showed|appeared)/.test(m)
      || /miss.*target.*charm|charm.*in\s+(?:the\s+)?(?:miss|failed)\s+roll/.test(m)
      || /reroll.*(?:charm|vent|rescue)|(?:charm|vent|rescue).*reroll/.test(m)
      || /rule\s+confus.*charm|two\s+rolls?.*charm|charm.*two\s+rolls?/.test(m)
      || /on\s+the\s+vent.*miss.*charm|miss.*(?:on\s+)?the\s+vent.*charm/.test(m);
  },

  _isLuckyCharmDiceResetQuestion(m) {
    if (/keep\s+track|write|paper|remember|pick|choose|what\s+is\s+a\s+lucky/.test(m)) return false;
    return /who\s+(?:gets?|rolls?|takes?).*(?:6\s+dice|the\s+dice|restart)|who\s+rolls?\s+after.*(?:lucky\s*charm|charm|rescue|save)/.test(m)
      && /lucky\s*charm|charm|vent|rescue|save|restart/.test(m)
      || /(?:restart|reset).*(?:6\s+)?dice.*(?:lucky\s*charm|charm|vent)/.test(m)
      || /do\s+i\s+roll\s+again.*(?:charm|save|rescue|vent)/.test(m)
      || /after.*lucky\s*charm.*(?:who|next\s+player|whose\s+turn)/.test(m)
      || /lucky\s*charm.*who\s+(?:gets?|rolls?)/.test(m);
  },

  _classifyLuckyCharmTopic(m) {
    const s = String(m || '').toLowerCase().trim();
    if (!/lucky\s*charms?|charm\s*number|escape\s+number/.test(s)) return null;
    if (/lucky\s+charm.*(?:lore|story|metaphor)|(?:lore|story).*(?:the\s+)?lucky\s+charm|why.*lucky\s+charm/.test(s)) {
      return 'lore';
    }
    if (this._isLuckyCharmDiceResetQuestion(s)) return 'dice_reset';
    if (this._isLuckyCharmFavoriteQuestion(s)) return 'favorite';
    if (/same\s+(?:lucky\s+)?charm|duplicate\s+charm|two\s+(?:players|people).*(?:same|share).*charm|can\s+two.*same.*charm/.test(s)) {
      return 'duplicate';
    }
    if (/what\s+numbers?\s+(?:can|could|must)\s+(?:a\s+)?lucky\s+charm|lucky\s+charm.*(?:1\s+through\s+6|one\s+through\s+six)/.test(s)
      || /only\s+(?:1|one)\s+through\s+6/.test(s) && /lucky\s+charm|charm/.test(s)) {
      return 'numbers';
    }
    if (this._isLuckyCharmChooseQuestion(s)) return 'choose';
    if (/keep\s+track|remember.*(?:charm|lucky)|write.*paper|on\s+paper/.test(s) && /charm|lucky/.test(s)) {
      return 'tracking';
    }
    if (this._isLuckyCharmRollQuestion(s)
      || /how\s+(?:does|do)\s+lucky\s+charm\s+work|when\s+(?:does|do)\s+lucky\s+charm/.test(s)) {
      return 'roll';
    }
    if (/what\s+(?:is\s+)?(?:a\s+)?lucky\s+charms?|explain\s+(?:the\s+)?lucky\s+charm|tell\s+me\s+about\s+(?:the\s+)?lucky\s+charms?|^lucky\s+charms?\??$/.test(s)) {
      return 'overview';
    }
    return 'overview';
  },

  _routeLuckyCharm(m) {
    const topic = this._classifyLuckyCharmTopic(m);
    if (!topic) return null;
    if (topic === 'lore') return this._lore(m);
    if (topic === 'dice_reset') {
      return this._withTableJoke(
        typeof formatLuckyCharmDiceResetMarkdown === 'function' ? formatLuckyCharmDiceResetMarkdown() : '',
        'luckyCharm',
        m
      );
    }
    if (topic === 'favorite') return this._luckyCharmFavorite(m);
    if (topic === 'duplicate') {
      return this._withTableJoke(
        typeof formatLuckyCharmDuplicateMarkdown === 'function' ? formatLuckyCharmDuplicateMarkdown() : '',
        'luckyCharm',
        m
      );
    }
    if (topic === 'numbers') {
      return this._withTableJoke(
        typeof formatLuckyCharmNumbersMarkdown === 'function' ? formatLuckyCharmNumbersMarkdown() : '',
        'luckyCharm',
        m
      );
    }
    if (topic === 'choose') return this._luckyCharmChoose(m);
    if (topic === 'tracking') {
      return this._withTableJoke(
        typeof formatLuckyCharmTrackingMarkdown === 'function' ? formatLuckyCharmTrackingMarkdown() : '',
        'luckyCharm',
        m
      );
    }
    if (topic === 'roll') return this._luckyCharmRollOutcome(m);
    if (topic === 'overview') {
      return this._withTableJoke(
        typeof formatLuckyCharmOverviewMarkdown === 'function' ? formatLuckyCharmOverviewMarkdown() : this._luckyCharmOverviewFallback(),
        'luckyCharm',
        m
      );
    }
    return null;
  },

  _luckyCharmOverviewFallback() {
    return '**Lucky charm:** pick **1 through 6** at setup, write on paper, keep all game. Saves you on **Vent** rescue rolls only.';
  },

  _isLuckyCharmFavoriteQuestion(m) {
    return /can\s+(?:my|our|your|i|we|the)\s+lucky\s+charm\s+(?:always\s+)?be/.test(m)
      && /favorit(?:e|ite)\s+number|favorit(?:e|ite)\b/.test(m)
      || /lucky\s+charm\s+be\s+(?:my|our|your|a)\s+favorit/.test(m)
      || /be\s+(?:my|our|your)\s+favorit(?:e|ite)\s+number/.test(m) && /lucky\s+charm|charm/.test(m)
      || /use\s+(?:my\s+)?favorit(?:e|ite)\s+number\s+as\s+(?:my\s+)?lucky\s+charm/.test(m)
      || /is\s+it\s+ok(?:ay)?.*favorit(?:e|ite)\s+number.*lucky\s+charm/.test(m);
  },

  _luckyCharmFavorite(m) {
    const base = typeof formatLuckyCharmFavoriteNumberMarkdown === 'function'
      ? formatLuckyCharmFavoriteNumberMarkdown()
      : '**Yes** — your lucky charm can be your favorite number, but it must still be **1 through 6** (a die face).';
    return this._withTableJoke(base, 'luckyCharm', m);
  },

  _isLuckyCharmChooseQuestion(m) {
    if (this._isLuckyCharmFavoriteQuestion(m)) return false;
    return /how\s+(?:do|does)\s+(?:you|i|we)\s+choose|how\s+to\s+(?:choose|pick)|(?:choose|pick)\s+(?:a\s+)?(?:my\s+|our\s+|your\s+)?lucky\s+charm/.test(m)
      || /favorite\s+number|favourite\s+number/.test(m) && /lucky\s+charm|charm/.test(m)
      || /always\s+(?:the\s+)?same\s+(?:lucky\s+charm|number|charm\s+number)/.test(m)
      || /same\s+number\s+every\s+(?:game|night|time)/.test(m) && /lucky\s+charm|charm/.test(m)
      || /regular\s+group.*lucky\s+charm|lucky\s+charm.*regular\s+group/.test(m)
      || /must\s+(?:choose|pick)\s+from/.test(m) && /lucky\s+charm|charm/.test(m);
  },

  _luckyCharmChoose(m) {
    const base = typeof formatLuckyCharmChooseMarkdown === 'function'
      ? formatLuckyCharmChooseMarkdown()
      : 'Pick **1 through 6** at setup before the first roll. Favorite numbers are fine — regular groups often reuse the same charm every game night.';
    return this._withTableJoke(base, 'luckyCharm', m);
  },

  _isLuckyCharmRollQuestion(m) {
    if (this._isLuckyCharmDiceResetQuestion(m)) return false;
    if (this._isLuckyCharmFavoriteQuestion(m) || this._isLuckyCharmChooseQuestion(m)) return false;
    if (/keep\s+track|write|paper|remember|pick|choose|favorite|favourite|what\s+is/.test(m)) return false;
    return (
      /what\s+(?:happens|if).*(?:lucky\s*charm|my\s*charm)/.test(m)
      || /(?:roll|rolled|rolling|hit|hits|hitting|get|got|show|shows|land|landed).*(?:lucky\s*charm|my\s*charm)/.test(m)
      || /(?:lucky\s*charm|my\s*charm).*(?:roll|rolled|hit|show|land|rescue|save)/.test(m)
      || /(?:lucky\s*charm|my\s*charm).*(?:on\s+)?(?:the\s+)?(?:vent|rescue)/.test(m)
      || /how\s+(?:does|do)\s+lucky\s+charm\s+work|when\s+(?:does|do)\s+lucky\s+charm\s+(?:matter|help|save)/.test(m)
    );
  },

  _luckyCharmRollOutcome(m) {
    if (this._isVentCharmMissConfusionQuestion(m)) {
      return this._withTableJoke(formatVentCharmMissClarificationMarkdown(), 'rescue', m);
    }
    const onVent = /vent|rescue|miss(?:ed)?/.test(m);
    if (onVent) {
      return this._withTableJoke(
        '**On a Vent rescue roll** (the **second** roll after a miss), if **your** lucky charm appears on **any** die:\n\n• **No token lost**\n• All **6 dice** return to the **shared pool**\n• Countdown **resets to 6**\n• **Next player** rolls all **6** — you do **not** roll again\n\nCharm on the **miss roll** does **not** auto-save — you must hit it on the **rescue roll** (unless it paid the tribute and you did not miss).',
        'rescue',
        m
      );
    }
    return this._withTableJoke(
      '**If you roll your lucky charm — it depends when:**\n\n**1 — Miss roll → Vent:** Charm in the miss roll only saves you if it **paid the tribute**. Otherwise you still need a **rescue roll**.\n\n**2 — Rescue roll** (reroll same dice count):\n• **Charm shows** → **Safe!** No token. All **6** back. **Next player** at **6**.\n• **No charm** → Lose **1 token**. **Next player** at **6**.\n\n**3 — Normal countdown** (no miss): charm is just a die face unless it pays the target.',
      'luckyCharm',
      m
    );
  },

  _isScoringQuestion(m) {
    if (this._classifyLuckyCharmTopic(m) === 'tracking') return false;
    return (
      /scor|scorecard|points?\s+board/.test(m)
      || /how\s+(?:do|does)\s+(?:you|i|we)\s+keep\s+score/.test(m)
      || /track\s+(?:score|points?|tokens?)/.test(m)
      || /vent\s+path|how\s+many\s+points?/.test(m)
      || /clarif.*scor|scor.*clarif|explain.*scor/.test(m)
    );
  },

  _scoring() {
    const g = VOLCANO_VENT_GAME;
    return this._withTableJoke(
      `**Only tokens count** — start with **${g.scoring.track}**, lose **1** on a failed Vent rescue. The countdown **6→1** is **NOT scoring**. Lucky charms are **NOT scoring** either — write them on **paper**; they matter only on Vent rescues. **Last player with tokens wins.** Kids use **paper lives**.`,
      'tokens',
      'scoring'
    );
  },

  _winning() {
    return this._withTableJoke(
      `**Winning:** ${VOLCANO_VENT_GAME.winning}\n\nYou are eliminated when you lose all **3 tokens** (or paper lives). The countdown keeps cycling until only one player still has tokens.`,
      'winning',
      'winning'
    );
  },

  _isWinningQuestion(m) {
    if (/wind\s+up|end\s+up\s+on/.test(m)) return false;
    return /who\s+wins|first\s+to|how\s+(?:do|does)\s+(?:you|i|we)\s+win|win(?:ning)?\s+condition/.test(m);
  },

  _isFirstRollVentQuestion(m) {
    return (
      /wind\s+up\s+on|end\s+up\s+on|land\s+on/.test(m) && /vent/.test(m) && /first|opening|start|tribute\s*6|right\s+away|immediately/.test(m)
      || /first\s+roll.*(?:vent|miss)|(?:vent|miss).*first\s+roll/.test(m)
      || /can\s+(?:you|i|we).*(?:vent|miss).*(?:first|opening|start)/.test(m)
      || /vent.*(?:first|opening)\s+roll|(?:first|opening)\s+roll.*vent/.test(m)
    );
  },

  _firstRollVentGuide() {
    const base = typeof formatFirstRollVentMarkdown === 'function'
      ? formatFirstRollVentMarkdown()
      : this._miniExampleForTopic('first_roll_vent');
    return this._withTableJoke(base, 'firstRoll', 'first roll vent');
  },

  _isVentQuestion(m) {
    if (/pretend|betting|bead|button|house\s+rule|ante|side\s+bet|keeper|return\s+all/.test(m)) return false;
    if (/tip|strategy|advice|beginner|advanced/.test(m)) return false;
    if (/volcano\s+vent(?:\s+dice)?/.test(m) && !/(?:the\s+)?vent\s+(?:work|edge|sacrifice|miss)|on\s+the\s+vent|rescue\s+roll/.test(m)) {
      return false;
    }
    return /(?:the\s+)?vent|on\s+the\s+vent|sacrifice|rescue\s+roll|jeopardy/.test(m)
      || (/miss/.test(m) && /countdown|target|mark|roll/.test(m));
  },

  _vent() {
    return this._withTableJoke(
      '**The Vent:** when you cannot roll the countdown target (no single die and no sum), you stand on the Vent edge — **even on the opening roll** for tribute **6**.\n\n• **Miss roll:** tribute failed → you are on the Vent.\n• **Rescue reroll:** roll **again** the **same number of dice** you failed with — a **fresh roll**, not a re-read of the miss.\n• **Lucky charm on the rescue reroll** → safe; all **6 dice** return; reset to **6**; **next player** rolls.\n• No charm on rescue → lose **1 token**; **next player** at **6**.\n\nCharm on the **miss roll** does **not** auto-save unless it paid the tribute.\n\nSay **"wind up on the Vent first roll"** for a mini example.',
      'vent',
      'vent'
    );
  },

  _countdown() {
    return this._withTableJoke(
      '**Countdown 6→1:**\n\n1. Roll all **6 dice** for a **6** (or dice summing to 6) — set those aside.\n2. Next player rolls what is left for **5**.\n3. Continue **4 → 3 → 2 → 1**.\n4. After **1**, restart at **6** with all dice and the next player.\n\n**Sums count** — **2+2+2=6** (three dice), **4+2=6** (two dice), or a lone **6** (one die).',
      'countdown',
      'countdown'
    );
  },

  _isNoDiceLeftQuestion(m) {
    return (
      /no\s+dice\s+left|dice\s+left\s+to\s+pass|nothing\s+left\s+to\s+pass|zero\s+dice|0\s+dice/.test(m)
      || /no\s+dice.*pass|all\s+dice\s+(?:set\s+aside|gone|used|aside)/.test(m)
      || (/what\s+happens|then\s+what/.test(m) && /no\s+dice|dice\s+left|nothing\s+to\s+pass/.test(m))
    );
  },

  _noDiceLeftGuide(m) {
    const bigGroup = /six\s+player|6\s+player|big\s+group|large\s+group/.test(m);
    const groupNote = bigGroup
      ? '**Six players?** Great table size — but Volcano Vent still uses **6 dice total** for everyone, not six dice per person. More people means more waiting between your turns, not a bigger dice pool.\n\n'
      : '';

    return this._withTableJoke(
      `${groupNote}**When there are no dice left to pass:**\n\n• Someone paid a tribute using **every die in the pool** (rare but possible — e.g. **1+1+1+1+1+1=6** sets all six aside).\n• The **next player** now needs the **next countdown number** (say **5**) but has **zero dice** to roll — that counts as **missing the mark**.\n• They stand on the **Vent**. Rescue roll uses the **same dice count you failed with** — with **0 dice**, most tables treat that as an automatic miss: **lose 1 token**, then **all 6 dice come back** and the countdown **resets to 6** for the next player.\n\n**Table tip:** you do not have to use every die on a tribute — a lone **6** for tribute **6** leaves **5 dice** to pass on; **2+2+2** still leaves **3**. Leaving dice in the pool is often smarter than emptying it.`,
      'dice',
      m
    );
  },

  _isRollingSixQuestion(m) {
    if (this._isNoDiceLeftQuestion(m)) return false;
    if (/(?:six|6)\s+player|player.*(?:six|6)|big\s+group|large\s+group/.test(m)) return false;
    return (
      /roll(?:ed|ing|s)?\s+(?:a\s+)?(?:six|6)\b/.test(m)
      || /(?:two|three|multiple|several|many)\s+sixes?\b/.test(m)
      || /(?:six|6)es?\s+on\s+(?:the\s+)?roll/.test(m)
      || /what\s+happens\s+when\s+you\s+roll\s+(?:a\s+)?(?:six|6)\b/.test(m)
      || /(?:get|got|land)\s+(?:a\s+)?(?:six|6)\b/.test(m)
    );
  },

  _rollingSixGuide(m) {
    const notTributeSix = /after|remain|left|next|pass|already|need\s*5|tribute\s*5|target\s*5/.test(m)
      && !this._isNoDiceLeftQuestion(m);
    const multiple = /multiple|several|two|three|many|\b6{2,}\b|sixes/.test(m);

    if (notTributeSix) {
      return this._withTableJoke(
        '**When the tribute is not 6** (say you already paid 6 and need **5**): a lone **6** does **not** pay the tribute — it stays in the pool unused unless it helps a **sum** to the current target. For **5**, you need a **5** or dice that add to **5** (like **2+3**), not a **6** by itself.',
        'countdown',
        m
      );
    }
    if (multiple) {
      return this._withTableJoke(
        '**Multiple sixes when tribute is 6:** you only need **one** die showing **6** to pay the tribute — set **that one** aside. Extra sixes stay with the dice you pass on (they do not all get set aside). Example: roll **6-6-3-2-1-4** → set **one** six aside, **5 dice** pass to the next player, who needs **5**, not 6.',
        'dice',
        m
      );
    }
    return this._withTableJoke(
      '**When tribute is 6** and you roll a **6:** set **that one die** aside as tribute — you do not need to use more dice. The other **5 dice** pass to the next player, who needs **5** next. A lone **6** is the simplest way to open the countdown; **4+2** and **2+2+2** work too.',
      'dice',
      m
    );
  },

  _isEqualSixQuestion(m) {
    return (
      /trying\s+to\s+equal/.test(m)
      || /equal\s*(?:6|six)\b/.test(m)
      || /(?:are|am)\s+(?:you|i|we)\s+trying/.test(m)
      || /can\s+(?:three|3)\s+dice/.test(m)
      || /three\s+dice\s+equal/.test(m)
      || /make\s+(?:6|six)/.test(m)
      || /need\s+(?:6|six)\b/.test(m) && /dice|roll|tribute|countdown/.test(m)
    );
  },

  _equalSixGuide(m) {
    const afterSixPaid = /after|remain|left|next|pass|already|then/.test(m) || /2[\s-]*2[\s-]*2/.test(m);
    const asksThree = /can\s+(?:three|3)\s+dice|three\s+dice/.test(m);

    if (asksThree && !/trying/.test(m)) {
      return this._withTableJoke(
        '**Yes — three dice can equal 6.** Example: **2+2+2**. Set those three aside; **3 dice** pass to the next player, who needs **5**, not 6.',
        'sums',
        m
      );
    }
    if (afterSixPaid || (/trying|equal/.test(m) && /after|next|left|remain|pass/.test(m))) {
      return this._withTableJoke(
        '**No — not trying to equal 6.** Tribute **6** is already paid. With the dice left, you need **5** next (then 4, 3, 2, 1).',
        'countdown',
        m
      );
    }
    if (/trying|are you|am i/.test(m)) {
      return this._withTableJoke(
        '**Yes — you are trying to equal 6** when the countdown starts and all **6 dice** are rolled. After someone pays 6 (even **2+2+2**), the next player needs **5**, not 6.',
        'sums',
        m
      );
    }
    return this._withTableJoke(
      '**Yes — three dice can equal 6** (e.g. **2+2+2**). **Yes — you try to equal 6** only at the start of the countdown; after that, the target counts down **5, 4, 3, 2, 1**.',
      'sums',
      m
    );
  },

  _sumDiceQuestion(m) {
    if (/2[\s-]*2[\s-]*2/.test(m)) {
      return this._withTableJoke(
        '**2+2+2=6** — set all three twos aside. **3 dice remain.** Next tribute is **5**, not 6.',
        'sums',
        m
      );
    }
    return this._withTableJoke(
      'Sums count — **1 to 6 dice** can pay a tribute if they add up. Examples: lone **6**, **4+2**, **2+2+2**. Set only the dice you used aside; pass the rest.',
      'sums',
      m
    );
  },

  _turnFlow(m) {
    if (/full|every\s+step|all\s+steps|complete/.test(String(m || '').toLowerCase())) {
      let out = '**Turn flow each round:**\n\n';
      VOLCANO_VENT_GAME.turnFlow.forEach(s => { out += `• ${s}\n`; });
      return out;
    }
    return this._withTableJoke(
      'Roll for the **current target** (6 down to 1) with whatever dice are in the pool — **sums count**. Set paying dice aside, pass the rest. **Miss** → **Vent** rescue with your lucky charm or lose a token. After **1** or a Vent, **all 6 dice** return, reset to **6**, **next player**. Say **"full rules"** for every step written out.',
      'countdown',
      m
    );
  },

  _variants() {
    let out = '**Volcano Vent variants:**\n\n';
    VOLCANO_VENT_GAME.variants.forEach(s => { out += `• ${s}\n`; });
    return out;
  },

  _isTipsQuestion(m) {
    return /tip|strategy|advice|beginner|advanced/.test(m)
      && /volcano|vent(?:\s+dice)?|dice|game|lucky\s+charm|token|round|roll|play|table/i.test(m);
  },

  _tips(m) {
    const g = VOLCANO_VENT_GAME;
    let level = 'beginner';
    if (/advanced|expert/.test(m)) level = 'advanced';
    else if (/intermediate|party|classroom/.test(m)) level = 'intermediate';

    let out = `**Tips (${level}):**\n\n`;
    g.tips[level].forEach(t => { out += `• ${t}\n`; });
    return out;
  },

  _players() {
    return this._withTableJoke(
      `**Players:** ${VOLCANO_VENT_GAME.players}.\n\n**Sweet spot: 3–6** — enough suspense as the countdown passes around.\n\n**Six players** works well — but remember: the game still uses **6 dice total** shared by the whole table, not six dice per person.\n\n**2 players** works (hot duel — every miss hurts).\n\n**7+** still plays — louder table, more groans when someone hits the Vent.`,
      'players',
      'players'
    );
  },

  _walkthroughSteps() {
    return [
      '**Step 1 of 5 — The volcano wants 6.** First player rolls all **six dice**. A single **6** works. **4+2** or **3+3** work too. **2-2-2**? **Yes — three dice can equal 6.** Set those dice aside. **Three dice remain.**\n\n**Miss on this first roll?** You can **wind up on the Vent right away** — then **rescue reroll** (same dice count, fresh roll) for your lucky charm.\n\n*Table question:* **How many dice can equal 6?** (**1 to 6** — use as many as you need.)',
      '**Step 2 of 5 — Now the demand is 5** with those **3 remaining dice**, not 6. Smaller target, fewer dice — that shrinking pool is where the tension lives.',
      '**Step 3 of 5 — The chain runs 5 → 4 → 3 → 2 → 1.** Each success sets dice aside. Hit **1**? **All six dice come back**, demand resets to **6**, and the **next player** starts fresh.',
      '**Step 4 of 5 — Miss the mark?** No single die and no combo hits the target — you are on the **Vent** edge. **Rescue reroll:** roll the **same number of dice again** (fresh roll). Your **lucky charm on that rescue reroll**? Safe — reset to **6**, **next player**.',
      '**Step 5 of 5 — Miss the rescue?** Lose **one token**. Still reset to **6** for the **next player**. Over many rounds, tokens dwindle until one player is left.'
    ];
  },

  _walkthrough({ continue: isContinue } = {}) {
    const steps = this._walkthroughSteps();
    if (!isContinue) {
      this.walkthroughStep = 0;
      this.lastTopic = 'walkthrough';
    }
    const idx = this.walkthroughStep;
    if (idx >= steps.length) {
      return this._walkthroughWrapUp();
    }
    const step = steps[idx];
    this.walkthroughStep = idx + 1;
    const total = steps.length;
    const prompt = idx < total - 1
      ? `Say **continue**, **please**, **yes**, or **keep going** for step ${idx + 2} of ${total}.`
      : 'That is the whole chain in five beats. Ask about **clever sums**, **same lucky charm**, or **what happens next?**';
    return `${step}\n\n${prompt}`;
  },

  _walkthroughWrapUp() {
    this.walkthroughStep = this._walkthroughSteps().length;
    return '**That is the whole heartbeat:** roll, sum cleverly, save yourself on the **Vent**, or sacrifice a token. Last player with tokens wins.\n\nDig deeper: **"clever sums"**, **"same lucky charm"**, **"push your luck"**, or **"what happens next?"** — say **"full rules"** only if you want the long lecture.';
  },

  _walkthroughExtras(m) {
    if (/clever\s+sum|example.*sum|sum dice/.test(m)) {
      return this._withTableJoke(
        '**Clever sum examples:**\n\n• Need **6:** roll **2-2-2-1-4-5** → set aside **2+2+2** (three dice). **3 dice remain** → next demand is **5**.\n• Need **5** with 3 dice left: lone **5**, **2+3**, or **1+2+2**.\n• Need **6** with six dice: **4+2**, **3+3**, **1+2+3**, or lone **6**.\n\n*Ask the table:* "How many dice can equal 6?" — answer: **1 through 6**, as many as needed.',
        'sums',
        m
      );
    }
    if (/push.?your.?luck|tension|thrill|laughter/.test(m)) {
      return this._withTableJoke(
        '**Why it feels so good:** every step down the countdown uses fewer dice — the target gets smaller but your tools shrink faster. One miss and the whole table leans in for your **one** rescue roll. Narrow escape = cheers. Sacrifice = sympathetic "nooo" and a token clink into the bowl. That mix of luck, hope, and group drama is the whole game.',
        'vent',
        m
      );
    }
    return this._walkthrough();
  },

  _dice() {
    return this._withTableJoke(
      `You need **${VOLCANO_VENT_GAME.dice}**. All six stay in play at the start of each countdown cycle. As you hit targets, dice are set aside until someone misses or the countdown finishes at **1**.`,
      'dice',
      'dice'
    );
  },

  _tokens() {
    let out = `**Tokens:** ${VOLCANO_VENT_GAME.tokens}.\n\nLose one when you fail the lucky-charm rescue on the **Vent**. Last player with tokens wins. For kids, use **3 paper lives** instead of beads.`;
    if (adamAgeVerifier.canDiscussBetting()) {
      out += `\n\n${VOLCANO_VENT_CRAFT_TOKENS.summary}`;
      out += this._bettingFooter();
    }
    return this._withTableJoke(out, 'tokens', 'tokens');
  },

  _kids() {
    return `**Volcano Vent Dice** is listed **${VOLCANO_VENT_GAME.ages}**. When kids are at the table:\n\n• Use **paper lives** (3 stickers) instead of losing beads.\n• **No pretend bets** — buttons and betting chat are for **18+** only.\n• Try the **short game** variant — **2 tokens/lives** each.\n\nAdults can play too — it is a family token game, not kids-only!`;
  },

  _adults() {
    return '**Yes — adults can absolutely play Volcano Vent Dice!** It is a family scoring game, not restricted to children. On an **adults-only (18+)** table you may add optional pretend bets with buttons and beads — ask me about **house rules** if your birthday is saved.';
  },

  _isCraftBetsMaterialsQuestion(m) {
    return /what\s+can\s+(?:be|i|we)\s+use\s+for\s+(?:pretend\s+)?(?:bets?|antes?|wagering)/.test(m)
      || /what\s+(?:to|can)\s+use\s+for\s+(?:pretend\s+)?bets?/.test(m)
      || /what\s+(?:material|stuff|token)s?\s+(?:can\s+)?(?:be\s+used\s+)?for\s+(?:pretend\s+)?bets?/.test(m);
  },

  _isAntesQuestion(m) {
    return /how\s+(?:do|does)\s+antes?\s+work|what\s+(?:are|is)\s+(?:an?\s+)?antes?|explain\s+antes?/.test(m)
      || /when\s+(?:do\s+we|to)\s+(?:pay|put|drop|add)\s+antes?/.test(m)
      || /antes?.*(?:button|bead)|(?:button|bead).*antes?/.test(m)
      || /(?:clear\s+)?instructions?\s+(?:on|for)\s+antes?|antes?\s+instructions?/.test(m)
      || /clear\s+instructions.*antes?|instructions?\s+on\s+how\s+antes?/.test(m);
  },

  _isPretendBetsFitQuestion(m) {
    if (this._isAntesQuestion(m)) return false;
    return (
      /side\s+bets?|antes?/.test(m) && /pretend|bet|bead|button|chip|coincide|rules/.test(m)
      || /how\s+do\s+pretend\s+bets?\s+work/.test(m)
      || /pretend\s+bets?.*(?:coincide|fit|work\s+with|alongside|with\s+the\s+rules)/.test(m)
      || /(?:coincide|fit|alongside|work\s+with).*(?:pretend|bet|rules)/.test(m)
      || /suggest.*pretend|pretend.*suggest|suggestions?\s+(?:on|for)\s+pretend/.test(m)
      || /are\s+they\s+(?:side\s+bets?|antes?)/.test(m)
      || /antes?\s+or\s+side/.test(m)
    );
  },

  _resolveBeadsAnswer(code) {
    if (code === 'beads_intro') return typeof formatBeadsWorkMarkdown === 'function' ? formatBeadsWorkMarkdown() : formatConciseButtonsBeadsIntro();
    if (code === 'buttons_intro') return typeof formatButtonsWorkMarkdown === 'function' ? formatButtonsWorkMarkdown() : formatConciseButtonsBeadsIntro();
    if (code === 'intro') return formatConciseButtonsBeadsIntro();
    if (code === 'keeper_ok') return formatKeeperGuidanceMarkdown({ focus: 'ok' });
    if (code === 'keeper_not') return formatKeeperGuidanceMarkdown({ focus: 'not' });
    if (code === 'how_we_decide') return formatHowWeDecideMarkdown();
    if (code === 'antes_guide') return formatAntesInstructionsMarkdown();
    if (code === 'pot_size') return typeof formatPotSizeMarkdown === 'function' ? formatPotSizeMarkdown() : code;
    if (code === 'craft_tokens_list') return formatCraftTokensMarkdown();
    if (code === 'safety_advice') return formatPretendBetSafetyAdviceMarkdown();
    return code;
  },

  _handleBetting(m) {
    if (!adamAgeVerifier.canDiscussBetting()) {
      return adamAgeVerifier.bettingBlockedReply();
    }

    if (this._isAntesQuestion(m)) {
      return formatAntesInstructionsMarkdown() + this._bettingFooter();
    }

    if (this._isCraftBetsMaterialsQuestion(m)) {
      return formatCraftTokensMarkdown() + this._bettingFooter();
    }

    if (this._isPretendBetSafetyQuestion(m)) {
      if (/avoid\s+house\s+rule\s*2|when.*avoid.*(?:house\s+rule\s*2|keeper)/.test(m)) {
        return formatPretendBetSafetyAdviceMarkdown({ focus: 'avoid_hr2' }) + this._bettingFooter();
      }
      return formatPretendBetSafetyAdviceMarkdown() + this._bettingFooter();
    }

    if (/house\s+rule\s*(?:one|1|two|2)|return\s+all/.test(m)
      || /keeper|keep\s+the\s+pot/.test(m) && /house\s+rule|rule\s*(?:one|two|1|2)\b/.test(m)) {
      return this._houseRules(m);
    }

    const beadsHit = typeof matchButtonsBeadsQuestion === 'function' ? matchButtonsBeadsQuestion(m) : null;
    if (beadsHit) {
      return this._resolveBeadsAnswer(beadsHit) + this._bettingFooter();
    }

    if (this._isKeeperGuidanceQuestion(m)) {
      return formatKeeperGuidanceMarkdown() + this._bettingFooter();
    }

    if (this._isPretendBetsFitQuestion(m)) {
      return formatPretendBetsFitMarkdown() + this._bettingFooter();
    }

    if (/keeper|keep\s+the\s+pot/.test(m)) {
      return this._houseRules(m);
    }
    if (/not\s+allowed|what\s+(?:is\s+)?not|forbidden|never/.test(m)) {
      let out = '**Not allowed:** no real cash or payment apps; **no poker chips**; no gold/silver; **no chasing losses**; **no double-or-nothing**; no keeper without unanimous napkin vote; no pretend bets with kids; no pressuring anyone.';
      return out + this._bettingFooter();
    }
    if (/allowed|what\s+can|ok\s+to/.test(m)) {
      let out = '**Allowed (18+):** equal craft tokens (beads, seeds, pebbles, clips, marbles, jacks…), tiny **antes** per countdown reset, **House Rule 1** default, keeper only if everyone agrees **before** the first roll.';
      return out + this._bettingFooter();
    }
    return formatConciseButtonsBeadsIntro() + this._bettingFooter();
  },

  _isPretendBetSafetyQuestion(m) {
    return /chas(?:e|ing)\s+loss|cas(?:e|ing)\s+loss|chase\s+what\s+(?:i|you|we)\s+lost|win\s+it\s+back/.test(m)
      && /bet|ante|pretend|bead|button|bowl|pot|keeper|loss/.test(m)
      || /double[\s-]?or[\s-]?nothing|double\s+the\s+pot|all\s+or\s+nothing/.test(m)
        && /bet|ante|pretend|bead|button|bowl|pot|keeper|volcano/.test(m)
      || /avoid\s+house\s+rule\s*2|skip\s+house\s+rule\s*2|when\s+(?:to|should\s+we)\s+avoid\s+(?:house\s+rule\s*2|keeper)/.test(m)
      || /no\s+chasing\s+loss|no\s+double[\s-]?or[\s-]?nothing/.test(m);
  },

  _isKeeperGuidanceQuestion(m) {
    return /when\s+(?:is\s+)?keeper|keeper\s+(?:okay|ok|fine|not)|should\s+(?:we|i)\s+use\s+keeper|keeper\s+or\s+return/.test(m)
      || /when\s+not\s+(?:to\s+)?keep/.test(m)
      || /avoid\s+house\s+rule\s*2|when\s+(?:to|should)\s+avoid\s+keeper/.test(m);
  },

  _houseRules(m) {
    const b = VOLCANO_VENT_BETTING;
    if (/when\s+(?:is\s+)?keeper|keeper\s+(?:okay|not)|when\s+not|avoid\s+house\s+rule\s*2/.test(m)) {
      const focus = /avoid\s+house\s+rule\s*2|not|avoid|skip|should\s+not/.test(m)
        ? (/avoid\s+house\s+rule\s*2/.test(m) ? 'avoid_hr2' : 'not')
        : (/okay|ok|fine|when\s+can/.test(m) ? 'ok' : undefined);
      return formatKeeperGuidanceMarkdown(focus ? { focus } : {}) + this._bettingFooter();
    }
    if (/house\s+rule\s*two|rule\s*two|rule\s*2|keeper|keep\s+the\s+pot/.test(m)) {
      const r = b.houseRules[1];
      return `**${r.name}**\n\n${r.text}\n\nAsk **"how do we decide?"** for the napkin-vote steps. If **anyone** is unsure → **House Rule 1** (return all).` + this._bettingFooter();
    }
    if (/house\s+rule\s*one|rule\s*one|rule\s*1|return\s+all/.test(m)) {
      const r = b.houseRules[0];
      return `**${r.name}**\n\n${r.text}` + this._bettingFooter();
    }
    return `**House Rule 1 (default):** return every bead after play. **House Rule 2 (optional):** **unanimous napkin vote** — **every player takes part**, all **yes**, before the first roll.\n\n${VOLCANO_VENT_CRAFT_TOKENS.summary}\n\nAsk **"how do we decide?"** for the vote steps.` + this._bettingFooter();
  },

  _fallback(message) {
    const m = String(message || '').toLowerCase();
    const t = String(message || '').trim().toLowerCase();
    if (this._isBareAffirmative(t) || this._isAffirmativeContinuation(t)) {
      return this._yesClarify();
    }
    if (this._isEqualSixQuestion(m)) return this._equalSixGuide(m);
    if (this._isNoDiceLeftQuestion(m)) return this._noDiceLeftGuide(m);
    if (this._isRollingSixQuestion(m)) return this._rollingSixGuide(m);

    if (this._onBettingThread() && adamAgeVerifier.canDiscussBetting()) {
      return `Still on **pretend bets** — try **"tell me more"**, **"what about keeper?"**, **"how do antes work?"**, or **"what can be used for bets?"** in plain English.\n\nYou asked: "${message}"`;
    }
    return `I'm a **rough guide** — I may not have every phrasing perfect. Try **"how do I play?"**, **"full rules"**, **"lucky charm"**, or **"the Vent"**. You asked: "${message}"`;
  },

  _hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return h;
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.adam = adam;
  globalThis.ADAM_BOT_NAME = ADAM_BOT_NAME;
  globalThis.ADAM_SOURCE = ADAM_SOURCE;
}