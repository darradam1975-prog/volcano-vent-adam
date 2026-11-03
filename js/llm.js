/**
 * Optional GPT layer — plain English, teach by questions, no lectures.
 */
const adamLlm = {
  isEnabled() {
    return typeof adamLlmSettings !== 'undefined' && adamLlmSettings.isUsable();
  },

  _shouldPreserveRuleReply(message, ruleReply) {
    const m = String(message || '').toLowerCase();
    if (!/lucky\s*charm/.test(m)) return false;
    if (!ruleReply || /^I'm a \*\*rough guide\*\*/.test(ruleReply)) return false;
    return true;
  },

  shouldEnhance(message, ruleReply) {
    if (!this.isEnabled()) return false;
    const m = String(message || '').trim().toLowerCase();
    if (!m) return false;
    if (/lucky\s*charm/.test(m) && ruleReply && !/^I'm a \*\*rough guide\*\*/.test(ruleReply)) return false;
    if (/full\s+rules|quote\s+the\s+rules|rule\s+lecture|^rule\s*book$/.test(m)) return false;
    if (this._isChitChat(m)) return false;
    if (this._shouldPreserveRuleReply(m, ruleReply)) return false;
    if (ruleReply && /^I'm a \*\*rough guide\*\*/.test(ruleReply)) return true;
    if (typeof adam !== 'undefined' && typeof adam._isLikelyOffTopic === 'function' && adam._isLikelyOffTopic(m)) {
      return true;
    }
    if (typeof adam !== 'undefined' && adam.teachMode) return true;
    return this._isPlainEnglishQuestion(m);
  },

  _isChitChat(m) {
    return /^(?:hi|hey|hello|howdy|thanks|thank\s*you|thankyou|thanky|thank\s*ya|thank\s*ye|thx|ty|ok|okay|got\s+it|cool|great|bye|cheers|yes|yeah|yep|yup|sure|nope|no|nah|lol+|lmao|omg|oh\s+my\s+god|oh\s+my\s+gosh)\b/.test(m)
      && m.length < 50;
  },

  _isPlainEnglishQuestion(m) {
    if (/\?/.test(m)) return true;
    return /\b(?:how|what|when|who|why|can|could|should|does|do|is|are|explain|tell\s+me|walk\s+me)\b/.test(m);
  },

  buildSystemPrompt() {
    const botName = typeof ADAM_BOT_NAME !== 'undefined' ? ADAM_BOT_NAME : 'Adam The Volcano Vent Bot';
    const summary = typeof VOLCANO_VENT_TEACH !== 'undefined'
      ? VOLCANO_VENT_TEACH.briefSummary
      : VOLCANO_VENT_GAME?.summary || '';
    return (
      `You are ${botName}, a friendly companion who wants to talk about Volcano Vent Dice. You are pro-America. If they debate a left-wing or right-wing issue, hear both wings, then say where you land: the country, the Constitution, and the people who live here. Do not invent headlines, poll numbers, or court cases. `
      + 'Short table talk — thanks, thank you, thanky, lol, or omg — is not a new topic. Welcome them, share the laugh or the surprise, stay on the current rule, and invite the next step. Do not dump the rule sheet. '
      + 'When they move from one rule to another, follow them. Answer the new rule. Do not keep explaining the previous one. '
      + 'A short friendly line can mark the switch, then give the new ruling. '
      + 'Never discuss sexual or NSFW topics. If they ask, refuse in one sentence and invite a Volcano Vent question. Do not describe it. '
      + 'The die face is six. If "sex" shows up where the number belongs, treat it as six. '
      + 'Answer in plain everyday English — like explaining to a friend at the table. '
      + 'When they ask how a roll, a miss, a sum, a rescue, or a token works, give the detailed ruling: the dice counts, what is set aside, the fresh rescue roll, and who goes next. '
      + 'Use only the game logic below. Do not invent a step. Two short paragraphs is the right size. '
      + 'Dump the full rule sheet only if they explicitly asked for full rules. '
      + 'If the user says please, continue, or yes during a walkthrough, give ONLY the next short step — do not repeat earlier steps. '
      + 'Use the canonical facts you are given — do not invent rules. '
      + 'NEVER discuss, compare, or recommend other dice or board games (Yahtzee, Craps, Farkle, Liar\'s Dice, etc.) — only Volcano Vent Dice. '
      + 'Lore (table flavor): the **Vent** is the crater opening/rim when you miss a tribute; countdown **6→1** is descending rings down the volcano; lucky charms pull you back from the Vent edge; tokens are sacrifices. Use this imagery when asked about terminology — rules stay mechanical. '
      + 'Players can wind up on the Vent on the **first roll** for tribute 6. After any miss, explain the **rescue reroll**: roll the same number of dice again (fresh roll) — lucky charm must appear on the rescue roll, not just the miss roll. '
      + 'For betting: ONLY Volcano Vent **pretend** antes with craft tokens — wood & glass beads preferred, buttons, seeds, pebbles, marbles, paper clips, jacks (18+). Never gold, silver, or precious-gem beads. Regular stone beads like turquoise OK. Shared bowl, optional antes, separate from 3 Vent tokens. '
      + 'Never real money, poker chips, casino games, sports betting, chasing losses, or double-or-nothing. '
      + 'House Rule 1 = return all (default). House Rule 2 = keeper only with unanimous napkin vote. '
      + 'End with ONE clear yes/no offer — e.g. "Want a mini example?" or **Try next:** "How does the Vent work?" '
      + 'Tell the user they can reply **yes**, **sure**, or **okay go ahead**. Never end with a vague question if you need **yes** to continue. '
      + 'Privacy: chats are strictly confidential — never shared with other users, like any private GPT session. Do not suggest sharing chat logs with strangers or other players. '
      + `Core game: ${summary.replace(/\*\*/g, '')} `
      + `Game logic: ${typeof formatGameLogicFacts === 'function' ? formatGameLogicFacts() : ''}`
    );
  },

  buildOffTopicSystemPrompt() {
    const botName = typeof ADAM_BOT_NAME !== 'undefined' ? ADAM_BOT_NAME : 'Adam The Volcano Vent Bot';
    const summary = typeof VOLCANO_VENT_TEACH !== 'undefined'
      ? VOLCANO_VENT_TEACH.briefSummary
      : VOLCANO_VENT_GAME?.summary || '';
    return (
      `You are ${botName} — a friendly companion at a home Volcano Vent table. Warm, glad to be here, and you would rather talk about the dice game. You are pro-America. When they want a political debate, take it: give the left-wing case, the right-wing case, and your own landing. Do not brush it off. Do not invent headlines or statistics. `
      + 'If they only say thanks, thank you, thanky, lol, or omg, answer like a friend at the table: welcome them or share the reaction, stay on the current Volcano Vent topic, and invite the next step. '
      + 'Never discuss sexual or NSFW topics. Refuse those in one sentence and invite a Volcano Vent question. Do not describe them. The number six is a die face, not that subject. '
      + 'The user left the rule guide. Stay in character. Have a point of view about the night: the snacks, the weather, the people, the shift they just left. '
      + 'Answer the human question in plain English, under 90 words. Use one table image (the rim, the snack bowl, the charm on paper, the countdown). '
      + 'Do not say you are a rough guide. Do not list commands. Do not refuse unrelated topics outright. Do not flatten into a FAQ. '
      + 'Then one short line back to the table. '
      + 'NEVER discuss, explain, compare, or recommend other dice games or board games (Yahtzee, Craps, Farkle, Liar\'s Dice, Bunko, Tenzi, etc.). '
      + 'If they ask about other dice games, politely say you only cover **Volcano Vent Dice** and invite a Volcano Vent question — do not summarize those games. '
      + 'If betting or gambling comes up off-topic, ONLY mention Volcano Vent **pretend** antes with craft tokens (buttons, beads, seeds, pebbles, marbles, clips, jacks). '
      + 'Never suggest real money, poker chips, casino play, sports betting, or any betting outside those craft pretend tokens. '
      + 'If the topic is unrelated to the game, answer it directly, then add one short line inviting them back to the table '
      + '(e.g. "When you are back at the table, ask me about the Vent or lucky charm."). '
      + 'If they mixed game and non-game topics, cover both. Give any Volcano Vent ruling in detail from the game logic, then one short line back to the table. '
      + 'Privacy: chats are strictly confidential — never shared with other users, like any private GPT session. '
      + 'Never invent Volcano Vent Dice rules — for game facts stick to: '
      + `${summary.replace(/\*\*/g, '')} `
      + `Game logic: ${typeof formatGameLogicFacts === 'function' ? formatGameLogicFacts() : ''}`
    );
  },

  _historyMessages(history) {
    return (history || []).slice(-8).map(h => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: String(h.content || '').replace(/\*\*/g, '').slice(0, 500)
    }));
  },

  async completeOffTopic(userMessage, ruleBasedReply, history) {
    if (!this.isEnabled()) return ruleBasedReply;
    const settings = adamLlmSettings.get();
    const model = adamLlmSettings.resolveModel(settings);
    const messages = [
      { role: 'system', content: this.buildOffTopicSystemPrompt() },
      ...this._historyMessages(history),
      { role: 'user', content: String(userMessage || '') }
    ];
    if (ruleBasedReply && !/^I'm a \*\*rough guide\*\*/.test(ruleBasedReply)) {
      messages.push({
        role: 'system',
        content: `The draft is the voice. Keep its joke, its image, and its warmth. You may add one human detail. Do not turn it into a help desk, a list, or a refusal: ${String(ruleBasedReply).replace(/\*\*/g, '').slice(0, 500)}`
      });
    }

    try {
      const data = await this._requestChat(model, settings.apiKey, messages);
      const text = data?.reply?.trim();
      if (!text) throw new Error('empty reply');
      return text;
    } catch (err) {
      const hint = this._friendlyError(err);
      return ruleBasedReply + (ruleBasedReply ? `\n\n*(GPT unavailable — ${hint})*` : '');
    }
  },

  async complete(userMessage, ruleBasedReply, history) {
    if (!this.isEnabled()) return ruleBasedReply;
    const settings = adamLlmSettings.get();
    const model = adamLlmSettings.resolveModel(settings);
    const messages = [
      { role: 'system', content: this.buildSystemPrompt() },
      ...this._historyMessages(history),
      { role: 'user', content: String(userMessage || '') }
    ];
    if (ruleBasedReply && !/^I'm a \*\*rough guide\*\*/.test(ruleBasedReply)) {
      const detailed = /Here is the ruling/i.test(ruleBasedReply);
      messages.push({
        role: 'system',
        content: detailed
          ? `This draft is the table ruling. Keep every step, number, and who rolls next. You may warm the voice. Do not shrink it into a teaser: ${ruleBasedReply.replace(/\*\*/g, '').slice(0, 1200)}`
          : `Rewrite this rule-guide answer in plain English (stay accurate, keep the ruling steps): ${ruleBasedReply.replace(/\*\*/g, '').slice(0, 700)}`
      });
    }

    try {
      const data = await this._requestChat(model, settings.apiKey, messages);
      const text = data?.reply?.trim();
      if (!text) throw new Error('empty reply');
      return text;
    } catch (err) {
      const hint = this._friendlyError(err);
      return ruleBasedReply + (ruleBasedReply ? `\n\n*(GPT unavailable — ${hint})*` : '');
    }
  },

  chatEndpoint() {
    if (typeof adamSite !== 'undefined') {
      const url = adamSite.functionUrl('chat');
      if (url) return url;
    }
    return null;
  },

  async _requestChat(model, apiKey, messages) {
    const endpoint = this.chatEndpoint();
    if (!endpoint) {
      throw new Error(typeof adamSite !== 'undefined'
        ? adamSite.cloudUnavailableMessage()
        : 'GPT cloud proxy not available on this host');
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, apiKey, messages })
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    if (!res.ok) {
      const msg = data?.error || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  },

  _friendlyError(err) {
    const raw = String(err?.message || err || 'unknown error');
    if (/xai-|grok/i.test(raw)) {
      return 'use an OpenAI key (sk-…), not a Grok/xAI key';
    }
    if (/starts with sk-/i.test(raw)) {
      return 'paste a key from platform.openai.com/api-keys (starts with sk-)';
    }
    if (/incorrect api key|invalid api key|invalid_api_key|authentication/i.test(raw)) {
      return 'invalid API key — create a new one at platform.openai.com/api-keys and paste the full sk-… key';
    }
    if (/quota|billing|insufficient|payment|credit|exceeded your current/i.test(raw)) {
      return 'add billing/credits at platform.openai.com/account/billing (API is separate from ChatGPT Plus)';
    }
    if (/model.*not found|does not exist|does not have access/i.test(raw)) {
      return 'that model is not on your account — try GPT-5.4 mini or GPT-4o mini';
    }
    if (/rate limit|429/i.test(raw)) {
      return 'OpenAI rate limit — wait a moment and try again';
    }
    if (/failed to fetch|network|load failed/i.test(raw)) {
      return 'network error — check connection and ADAM_CLOUD_API_BASE in js/cloud-config.js';
    }
    return raw.slice(0, 160);
  },

  async testConnection(formOrModel, apiKeyMaybe) {
    const form = typeof formOrModel === 'object'
      ? formOrModel
      : { model: formOrModel, customModel: '', apiKey: apiKeyMaybe };
    const key = String(form.apiKey || '').trim();
    const primary = adamLlmSettings.resolveModel(form);
    const fallbacks = (typeof ADAM_GPT_TEST_FALLBACKS !== 'undefined' ? ADAM_GPT_TEST_FALLBACKS : ['gpt-4o-mini'])
      .filter(m => m !== primary);
    const toTry = [primary, ...fallbacks];
    const messages = [
      { role: 'system', content: 'Reply briefly.' },
      { role: 'user', content: 'Say exactly: Adam GPT OK' }
    ];

    let lastErr = null;
    for (const model of toTry) {
      try {
        const data = await this._requestChat(model, key, messages);
        const reply = data?.reply?.trim();
        if (!reply) throw new Error('empty reply');
        return {
          reply,
          modelUsed: data.modelUsed || model,
          api: data.api || 'openai',
          triedFallback: model !== primary
        };
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || e);
        const keyOrBilling = /incorrect api key|invalid api key|billing|quota|starts with sk-|xai-/i.test(msg);
        if (keyOrBilling) break;
      }
    }
    throw lastErr || new Error('GPT test failed');
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.adamLlm = adamLlm;
}