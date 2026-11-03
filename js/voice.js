/**
 * AI speech — Adam talks and listens.
 * Voices are the English ones installed on this device.
 */
const ADAM_AI_LANGS = {
  'en-US': 'US',
  'en-GB': 'UK',
  'en-AU': 'Australia',
  'en-IE': 'Ireland',
  'en-IN': 'India',
  'en-ZA': 'South Africa',
  'en-CA': 'Canada',
  'en-NZ': 'New Zealand',
  en: 'English'
};

const ADAM_AI_MALE = ['Daniel', 'David', 'Mark', 'Guy', 'George', 'Ryan', 'Eric', 'Alex', 'Fred', 'James', 'Christopher', 'Brian', 'Andrew', 'Roger', 'Steffan', 'Brandon', 'Davis', 'Connor', 'William', 'Tony'];
const ADAM_AI_FEMALE = /female|woman|girl|zira|samantha|karen|susan|hazel|linda|aria|jenny|emma|lisa|nancy|sara|sonia|helen|laura|olivia|michelle|catherine|victoria|fiona|moira|tessa|kate|serena|salli|ivy|joanna|kimberly|kendra|amy/i;

const adamVoice = {
  supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  listenSupported: typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  autoRead: localStorage.getItem('adam-voice-auto') === '1',
  loop: localStorage.getItem('adam-voice-loop') !== '0',
  rate: Number(localStorage.getItem('adam-voice-rate')) || 0.92,
  pitch: Number(localStorage.getItem('adam-voice-pitch')) || 1,
  voiceUri: localStorage.getItem('adam-ai-voice') || '',
  gender: localStorage.getItem('adam-ai-gender') || 'any',
  lang: localStorage.getItem('adam-ai-lang') || '',
  resumeDelay: 450,
  speaking: false,
  listening: false,
  voices: [],
  _lastText: '',
  _recognition: null,
  _session: false,
  _phase: 'idle',
  _speakGen: 0,
  _sentThisListen: false,
  _resumeTimer: null,
  _replyTurn: 0,
  _speakingText: '',
  _barge: false,
  _listenHint: '',
  _fillingInput: false,
  _endPause: 5000, // quiet time before Adam answers; a breath must not end the turn
  _silenceTimer: null,
  _kept: '',
  _finals: [],
  _interim: '',

  init() {
    if (!this.supported && !this.listenSupported) return;
    this.toggleBtn = document.getElementById('voice-toggle');
    this.micBtn = document.getElementById('voice-mic');
    this.statusEl = document.getElementById('voice-status');
    this.rateInput = document.getElementById('voice-rate');
    this.pitchInput = document.getElementById('voice-pitch');
    this.autoInput = document.getElementById('voice-auto');
    this.loopInput = document.getElementById('voice-loop');
    this.genderInput = document.getElementById('ai-gender');
    this.voiceInput = document.getElementById('ai-voice');

    if (this.rateInput) this.rateInput.value = String(this.rate);
    if (this.pitchInput) this.pitchInput.value = String(this.pitch);
    if (this.autoInput) this.autoInput.checked = this.autoRead;
    if (this.loopInput) this.loopInput.checked = this.loop;
    if (this.genderInput) this.genderInput.value = this.gender;
    const unsupported = document.getElementById('ai-speech-unsupported');
    if (unsupported) unsupported.classList.toggle('hidden', this.supported);

    if (this.supported) {
      speechSynthesis.addEventListener('voiceschanged', () => this._loadVoices());
      this._loadVoices();
      this._watchVoices();
    }
    this._syncToggle();
    this._syncMic();
    this._syncSliderLabels();
    this._bind();
    this._fillAiVoices();
  },

  refreshVoices() {
    this._loadVoices();
    this._watchVoices();
  },

  _watchVoices() {
    if (!this.supported) return;
    let tries = 0;
    const tick = () => {
      const before = this.voices.length;
      this._loadVoices();
      tries += 1;
      if (this.voices.length > before || tries >= 10) return;
      this._voiceWatch = setTimeout(tick, 400);
    };
    clearTimeout(this._voiceWatch);
    this._voiceWatch = setTimeout(tick, 200);
  },

  _bind() {
    this.toggleBtn?.addEventListener('click', () => {
      this.autoRead = !this.autoRead;
      localStorage.setItem('adam-voice-auto', this.autoRead ? '1' : '0');
      if (this.autoInput) this.autoInput.checked = this.autoRead;
      this._syncToggle();
      if (this.autoRead) this.speak(this._lastText);
      else this.stop();
    });
    this.micBtn?.addEventListener('click', () => this.toggleTalk());
    const hangup = document.getElementById('voice-hangup');
    if (hangup && typeof hangup.addEventListener === 'function') {
      hangup.addEventListener('click', () => this.stopTalk());
    }
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (this._phase !== 'speaking' && this._phase !== 'thinking') return;
        event.preventDefault();
        this.interrupt();
      });
    }
    this.rateInput?.addEventListener('input', () => {
      this.rate = Number(this.rateInput.value) || 0.92;
      localStorage.setItem('adam-voice-rate', String(this.rate));
      this._syncSliderLabels();
    });
    this.pitchInput?.addEventListener('input', () => {
      this.pitch = Number(this.pitchInput.value) || 1;
      localStorage.setItem('adam-voice-pitch', String(this.pitch));
      this._syncSliderLabels();
    });
    this.genderInput?.addEventListener('change', () => {
      this.gender = this.genderInput.value || 'any';
      localStorage.setItem('adam-ai-gender', this.gender);
      this._fillAiVoices();
    });
    this.voiceInput?.addEventListener('change', () => {
      this.voiceUri = this.voiceInput.value || '';
      localStorage.setItem('adam-ai-voice', this.voiceUri);
    });
    document.getElementById('ai-preview')?.addEventListener('click', () => this.preview());
    this.autoInput?.addEventListener('change', () => {
      this.autoRead = this.autoInput.checked;
      localStorage.setItem('adam-voice-auto', this.autoRead ? '1' : '0');
      this._syncToggle();
      if (!this.autoRead) this.stop();
    });
    this.loopInput?.addEventListener('change', () => {
      this.loop = !!this.loopInput.checked;
      localStorage.setItem('adam-voice-loop', this.loop ? '1' : '0');
    });
    const chatInput = document.getElementById('chat-input');
    if (typeof chatInput?.addEventListener === 'function') {
      chatInput.addEventListener('input', () => {
        if (this._fillingInput) return;
        if (this._phase === 'speaking' || this._phase === 'thinking') this._cutSpeech();
      });
    }
  },

  _loadVoices() {
    if (!this.supported) return;
    const next = speechSynthesis.getVoices().filter(v => v && (v.name || v.voiceURI));
    if (!next.length && this.voices.length) return;
    this.voices = next;
    this._fillAiVoices();
  },

  _normLang(lang) {
    const raw = String(lang || '').replace('_', '-');
    const [a, b] = raw.split('-');
    if (!a) return '';
    return b ? `${a.toLowerCase()}-${b.toUpperCase()}` : a.toLowerCase();
  },

  _langLabel(code) {
    const norm = this._normLang(code);
    return ADAM_AI_LANGS[norm] || ADAM_AI_LANGS[norm.split('-')[0]] || norm;
  },

  _voiceText(voice) {
    return `${voice?.name || ''} ${voice?.voiceURI || ''}`;
  },

  _isFemale(voice) {
    return ADAM_AI_FEMALE.test(this._voiceText(voice));
  },

  _isMale(voice) {
    if (this._isFemale(voice)) return false;
    const text = this._voiceText(voice);
    if (/\bmale\b/i.test(text)) return true;
    return ADAM_AI_MALE.some(name => new RegExp(`\\b${name}\\b`, 'i').test(text));
  },

  _matchesGender(voice) {
    if (this.gender === 'female') return this._isFemale(voice);
    if (this.gender === 'male') return this._isMale(voice) || (voice.localService && !this._isFemale(voice));
    return true;
  },

  _matchesLang(voice) {
    if (!this.lang) return true;
    return this._normLang(voice?.lang) === this._normLang(this.lang);
  },

  _voiceId(voice) {
    return voice?.voiceURI || `${voice?.name || ''}::${voice?.lang || ''}`;
  },

  _filteredVoices() {
    return this.voices.filter(v => this._matchesLang(v) && this._matchesGender(v));
  },

  _installedLangs() {
    const codes = new Set();
    this.voices.forEach(v => {
      const code = this._normLang(v.lang);
      if (code) codes.add(code);
    });
    return [...codes].sort((a, b) => {
      const order = Object.keys(ADAM_AI_LANGS);
      return (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99) || a.localeCompare(b);
    });
  },

  _pickVoice() {
    const chosen = this.voiceUri && this.voices.find(v => this._voiceId(v) === this.voiceUri);
    if (chosen && this._matchesLang(chosen) && this._matchesGender(chosen)) return chosen;
    let pool = this._filteredVoices();
    const local = pool.filter(v => v.localService);
    if (local.length) pool = local;
    if (this.gender !== 'female') {
      for (const name of ADAM_AI_MALE) {
        const hit = pool.find(v => new RegExp(`\\b${name}\\b`, 'i').test(v.name || ''));
        if (hit) return hit;
      }
    }
    if (pool.length) return pool[0];
    const anyLocal = this.voices.find(v => v.localService);
    return anyLocal || this.voices[0] || null;
  },

  _freshVoice(voice) {
    if (!voice || !this.supported) return voice || null;
    const id = this._voiceId(voice);
    const live = speechSynthesis.getVoices();
    return live.find(v => this._voiceId(v) === id)
      || live.find(v => v.name === voice.name && v.lang === voice.lang)
      || voice;
  },

  _listenLang() {
    return this.lang || this._pickVoice()?.lang || 'en-US';
  },

  _syncSliderLabels() {
    const rateVal = document.getElementById('voice-rate-val');
    const pitchVal = document.getElementById('voice-pitch-val');
    if (rateVal) rateVal.textContent = `${Number(this.rate).toFixed(2)}×`;
    if (pitchVal) pitchVal.textContent = Number(this.pitch).toFixed(2);
  },

  _fillAiVoices() {
    const picks = document.getElementById('ai-lang-picks');
    const voiceSel = document.getElementById('ai-voice');
    const count = document.getElementById('ai-voice-count');
    if (!picks && !voiceSel && !count) return;

    if (picks) {
      picks.replaceChildren();
      const langs = this._installedLangs();
      [{ id: '', label: 'All' }, ...langs.map(code => ({ id: code, label: this._langLabel(code) }))].forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ai-lang-pick' + (this.lang === item.id ? ' active' : '');
        btn.textContent = item.label;
        btn.addEventListener('click', () => {
          this.lang = item.id;
          localStorage.setItem('adam-ai-lang', this.lang);
          this._fillAiVoices();
        });
        picks.appendChild(btn);
      });
    }

    const list = this._filteredVoices();
    if (voiceSel) {
      const previous = this.voiceUri;
      voiceSel.replaceChildren();
      const auto = document.createElement('option');
      auto.value = '';
      auto.textContent = list.length ? 'Best match' : 'No voice installed for this choice';
      voiceSel.appendChild(auto);
      list.forEach(voice => {
        const opt = document.createElement('option');
        opt.value = this._voiceId(voice);
        const place = voice.localService ? 'this device' : 'browser';
        const lang = this._langLabel(voice.lang) || 'voice';
        opt.textContent = `${voice.name} — ${lang} — ${place}`;
        voiceSel.appendChild(opt);
      });
      const inList = previous && list.some(v => this._voiceId(v) === previous);
      const inAll = previous && this.voices.some(v => this._voiceId(v) === previous);
      if (inList) {
        this.voiceUri = previous;
      } else if (previous && this.voices.length && !inAll) {
        this.voiceUri = '';
        localStorage.setItem('adam-ai-voice', '');
      }
      voiceSel.value = inList ? previous : '';
    }

    if (count) {
      const total = this.voices.length;
      const shown = list.length;
      const local = this.voices.filter(v => v.localService).length;
      if (!total) {
        count.textContent = 'No TTS reported yet. Tap Preview AI voice so this browser can load the voices installed on this device.';
      } else if (!shown) {
        count.textContent = `${total} voices found, none match this filter. Choose All to see your TTS.`;
      } else {
        count.textContent = `${shown} shown. ${local} of ${total} are installed on this device. Voices marked “browser” are the browser’s own.`;
      }
    }
  },

  preview() {
    if (!this.supported) {
      this._setStatus('This browser cannot speak. Use Chrome or Edge.');
      return;
    }
    if (this._session || this._phase !== 'idle') this.stopTalk();
    this._loadVoices();
    const voice = this._freshVoice(this._pickVoice());
    const gen = ++this._speakGen;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance('Hi, I am Adam, your Volcano Vent guide. Ask me about the Vent, the countdown, or a lucky charm.');
    if (voice) {
      utter.voice = voice;
      if (voice.lang) utter.lang = voice.lang;
    } else {
      utter.lang = this._listenLang();
    }
    utter.rate = this.rate;
    utter.pitch = this.pitch;
    this._setStatus(`AI preview — ${voice?.name || 'default voice'}`);
    const finish = () => {
      if (gen !== this._speakGen) return;
      if (this._phase === 'idle') this._setStatus('');
    };
    utter.onend = finish;
    utter.onerror = finish;
    speechSynthesis.speak(utter);
  },

  _syncToggle() {
    if (!this.toggleBtn) return;
    const icon = this.toggleBtn.querySelector('.voice-icon');
    const label = this.toggleBtn.querySelector('.voice-label');
    if (this.autoRead) {
      this.toggleBtn.classList.add('on');
      this.toggleBtn.title = 'AI on — Adam reads replies aloud';
      this.toggleBtn.setAttribute('aria-label', 'AI on');
      if (icon) icon.textContent = '🔊';
      if (label) label.textContent = 'AI on';
    } else {
      this.toggleBtn.classList.remove('on');
      this.toggleBtn.title = 'AI off — tap to hear Adam speak';
      this.toggleBtn.setAttribute('aria-label', 'AI off');
      if (icon) icon.textContent = '🔇';
      if (label) label.textContent = 'AI';
    }
  },

  _setStatus(text) {
    this._statusText = text || '';
    if (!this.statusEl) return;
    this.statusEl.textContent = this._statusText;
    this.statusEl.classList.toggle('hidden', !this._statusText);
  },

  _nav() {
    return this._navigator || globalThis.navigator || {};
  },

  _askMic() {
    const media = this._nav().mediaDevices;
    if (typeof media?.getUserMedia !== 'function') return null;
    // Called in the tap, before any wait, so mobile Chrome can show Allow.
    return media.getUserMedia.call(media, { audio: true }).then(stream => {
      try { stream.getTracks().forEach(track => track.stop()); } catch { /* already stopped */ }
      this._micGranted = true;
      return 'granted';
    }).catch(err => {
      const name = err?.name || '';
      if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'missing';
      return 'denied';
    });
  },

  _showMicBlocked() {
    this._session = false;
    this._phase = 'idle';
    this._syncMic();
    this._statusLocked = true;
    const mobile = /Android|iPhone|iPad|Mobile/i.test(this._nav().userAgent || '');
    this._setStatus(mobile
      ? 'Chrome is blocking the microphone. Tap the lock icon left of the address bar, open Permissions, set Microphone to Allow, reload, then tap the microphone. If Microphone is missing there, open the phone Settings, Apps, Chrome, Permissions, Microphone, Allow, then reload.'
      : 'Chrome is blocking the microphone. Click the lock icon in the address bar, set Microphone to Allow, reload, then tap the microphone.');
  },

  _syncMic() {
    const btn = this.micBtn;
    const live = this._session || this._phase !== 'idle';
    if (btn) {
      btn.classList.toggle('listening', this._phase === 'listening');
      btn.classList.toggle('speaking', false);
      btn.setAttribute('aria-pressed', live ? 'true' : 'false');
      const label = live ? 'Listening' : 'Call Adam';
      btn.title = label;
      btn.setAttribute('aria-label', label);
      const icon = btn.querySelector('.voice-mic-icon');
      if (icon) icon.textContent = '🎤';
    }
    const hangup = document.getElementById('voice-hangup');
    if (hangup) hangup.classList.toggle('hidden', !live);
    if (this._phase === 'listening') this._setStatus(this._listenHint || 'On a call. I’m listening.');
    else if (this._phase === 'thinking') this._setStatus('One moment.');
    else if (this._phase === 'speaking') this._setStatus('Adam is talking. Just speak.');
    else if (!this._statusLocked) this._setStatus('');
  },

  _ensureRecognition() {
    if (this._recognition || !this.listenSupported) return this._recognition;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = true;
    const mobile = /Android|iPhone|iPad|Mobile/i.test(this._nav().userAgent || '');
    rec.continuous = !mobile;
    rec.maxAlternatives = 5;
    this._biasRecognition(rec);
    rec.onstart = () => {
      this._bargeTries = 0;
      this._micRetries = 0;
      this._glitchTries = 0;
      this._heardOnce = true;
      this.listening = true;
      if (this._phase === 'thinking' || !this._session) {
        try { rec.stop(); } catch { /* already stopping */ }
        return;
      }
      if (this._phase !== 'speaking') this._phase = 'listening';
      this._syncMic();
    };
    rec.onresult = (event) => this._onHeard(event);
    rec.onerror = (event) => this._onListenError(event);
    rec.onend = () => this._onListenEnd();
    this._recognition = rec;
    return rec;
  },

  _biasRecognition(rec) {
    if (!rec || this._phrasesOff) return;
    const Phrase = window.SpeechRecognitionPhrase;
    if (typeof Phrase !== 'function') return;
    const hints = [
      ['six', 8],
      ['roll a six', 6],
      ['tribute six', 6],
      ['vent', 8],
      ['the vent', 8],
      ['Volcano Vent', 8],
      ['Volcano Vent Dice', 6],
      ['lucky charm', 5],
      ['countdown', 4]
    ];
    try {
      rec.phrases = hints.map(([phrase, boost]) => new Phrase(phrase, boost));
    } catch {
      this._phrasesOff = true;
    }
  },

  _gameWordScore(text) {
    const t = String(text || '').toLowerCase();
    if (!t.trim()) return -100;
    let score = 0;
    if (/\bvents?\b/.test(t)) score += 5;
    if (/\bsix\b/.test(t)) score += 4;
    if (/\bsex\b/.test(t)) score -= 6;
    if (/\bvolcano\b/.test(t)) score += 2;
    if (/\blucky\s*charms?\b/.test(t)) score += 2;
    if (/\brents?\b|\bbents?\b|\bmoons?\b|\bevents?\b/.test(t)) score -= 4;
    return score;
  },

  _bestAlternative(result) {
    if (!result) return '';
    let best = result[0]?.transcript || '';
    let bestScore = this._gameWordScore(best);
    const count = typeof result.length === 'number' ? result.length : 1;
    for (let i = 1; i < count; i++) {
      const text = result[i]?.transcript || '';
      const score = this._gameWordScore(text);
      if (score > bestScore) {
        best = text;
        bestScore = score;
      }
    }
    return best;
  },

  _asVent(word) {
    const next = /s$/i.test(word) ? 'vents' : 'vent';
    return word[0] === word[0].toUpperCase() ? next[0].toUpperCase() + next.slice(1) : next;
  },

  _correctGameWords(text) {
    const raw = String(text || '');
    const gameAsk = /^(?:tell me|what|whats|what's|how|explain|describe|talk|about)\b/i.test(raw.trim());
    const housing = /\b(?:pay|paying|paid|owe|owing|my|monthly|apartment|house|due|for)\s+$/i;
    const moonKeep = /\b(?:full|blue|new|half|harvest|super|to\s+the)\s+$/i;
    const eventKeep = /\b(?:sports|main|track|next|charity|family|social)\s+$/i;
    const cue = /^(?:the|a|an|about|on|onto|volcano|hit|miss|missed)$/i;
    return raw.replace(/\b(rents?|bents?|wents?|moons?|events?)\b/gi, (word, _g, offset, whole) => {
      const before = whole.slice(Math.max(0, offset - 48), offset);
      const prev = (before.match(/([A-Za-z]+)\s+$/) || [])[1] || '';
      if (/rent/i.test(word) && housing.test(before)) return word;
      if (/moon/i.test(word)) {
        if (moonKeep.test(before)) return word;
        if (!cue.test(prev)) return word;
        if (!gameAsk && whole.trim().split(/\s+/).length > 3) return word;
        return this._asVent(word);
      }
      if (/went/i.test(word)) {
        if (!cue.test(prev)) return word;
        return this._asVent(word);
      }
      if (/event/i.test(word)) {
        if (eventKeep.test(before)) return word;
        if (!cue.test(prev)) return word;
        return this._asVent(word);
      }
      return this._asVent(word);
    });
  },

  _correctHeard(text) {
    const fixed = this._correctGameWords(text);
    const nsfw = typeof volcanoIsNsfw === 'function'
      ? volcanoIsNsfw(fixed)
      : /\b(?:porn|nude|naked|horny|nsfw|sexy|talk\s+dirty|have\s+sex|want\s+sex)\b/i.test(fixed);
    if (nsfw) return fixed;
    return fixed.replace(/\bsex\b/gi, (word) => (word[0] === 'S' ? 'Six' : 'six'));
  },

  _isEcho(heard) {
    const said = String(this._speakingText || '').toLowerCase();
    const h = String(heard || '').toLowerCase().trim();
    if (!h || !said) return false;
    if (/^(?:no|nope|nah|wait|stop|wrong|hold on|not that|i meant|i mean)\b/.test(h)) return false;
    const norm = (s) => s.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const hn = norm(h);
    const sn = norm(said);
    const words = hn.split(' ').filter(Boolean);
    if (words.length < 4) return false;
    return sn.includes(hn);
  },

  _setInput(text) {
    const input = document.getElementById('chat-input');
    if (!input) return;
    this._fillingInput = true;
    input.value = text;
    this._fillingInput = false;
  },

  _showOnChat(text) {
    if (typeof showVoiceDraft === 'function') showVoiceDraft(text);
  },

  _partsFromEvent(event) {
    let heard = '';
    let interim = '';
    const finals = [];
    if (!event || !event.results) return { heard, interim, finals };
    const start = event.resultIndex || 0;
    for (let i = start; i < event.results.length; i++) {
      const piece = this._bestAlternative(event.results[i]).trim();
      if (!piece) continue;
      if (event.results[i].isFinal) {
        finals.push({ i, piece });
        heard = heard ? heard + ' ' + piece : piece;
      } else {
        interim = interim ? interim + ' ' + piece : piece;
      }
    }
    return { heard, interim, finals };
  },

  _absorb(event) {
    const parts = this._partsFromEvent(event);
    parts.finals.forEach(({ i, piece }) => {
      if (this._isEcho(piece)) return;
      this._finals[i] = piece;
    });
    this._interim = this._isEcho(parts.interim) ? '' : parts.interim;
    return parts;
  },

  _stashFinals() {
    const finals = (this._finals || []).filter(Boolean).join(' ').trim();
    const extra = String(this._interim || '').trim();
    const line = [finals, extra].filter(Boolean).join(' ').trim();
    if (line) this._kept = [this._kept, line].filter(Boolean).join(' ').trim();
    this._finals = [];
    this._interim = '';
  },

  _liveLine() {
    const finals = (this._finals || []).filter(Boolean).join(' ').trim();
    return this._correctHeard([this._kept, finals, this._interim].filter(Boolean).join(' ').trim());
  },

  _clearTranscript() {
    this._kept = '';
    this._finals = [];
    this._interim = '';
    clearTimeout(this._silenceTimer);
    this._silenceTimer = null;
  },

  _pauseFor(line) {
    const base = typeof this._endPause === 'number' ? this._endPause : 5000;
    if (base < 500) return base;
    const dangling = /\b(?:and|or|but|so|because|the|a|an|to|of|for|about|with|on|in|at|like|if|when|what|how|is|was|uh|um)\s*$/i.test(String(line || ''));
    return dangling ? base + 2500 : base;
  },

  _scheduleTurnEnd() {
    clearTimeout(this._silenceTimer);
    this._silenceTimer = setTimeout(() => this._finishTurn(), this._pauseFor(this._liveLine()));
  },

  _finishTurn() {
    this._silenceTimer = null;
    if (!this._session || this._phase !== 'listening' || this._sentThisListen) return;
    const line = this._liveLine();
    if (!line) return;
    this._commitHeard(line);
  },

  _showLive() {
    const shown = this._liveLine();
    if (!shown) return;
    this._setInput(shown);
    this._showOnChat(shown);
  },

  _commitHeard(text) {
    const line = this._correctHeard(String(text || '').trim());
    if (!line || this._sentThisListen) return;
    this._sentThisListen = true;
    this._phase = 'thinking';
    if (!this.loop) this._session = false;
    this._clearTranscript();
    this._speakingText = '';
    this._listenHint = '';
    this._setInput(line);
    this._showOnChat(line);
    this._syncMic();
    try { this._recognition?.stop(); } catch { /* already stopped */ }
    if (typeof sendMessage === 'function') sendMessage();
  },

  _onHeard(event) {
    if (this._ignoreUntil && Date.now() < this._ignoreUntil) return;
    const parts = this._partsFromEvent(event);
    const heard = this._correctHeard(parts.heard.trim());
    const shown = this._correctHeard((parts.heard || parts.interim).trim());
    if (this._phase === 'speaking') {
      const live = heard || shown;
      if (!live || this._isEcho(live)) return;
      const stop = /^(?:no|nope|nah|wait|stop|wrong|hold on)\b/i.test(live);
      if (!heard && !stop) return;
      this._cutSpeech();
      this._session = true;
      this._sentThisListen = false;
      this._phase = 'listening';
      this._listenHint = 'Go ahead.';
      this._absorb(event);
      this._showLive();
      this._scheduleTurnEnd();
      this._syncMic();
      if (!this.listening) this._armListen(100);
      return;
    }
    if (this._sentThisListen || this._phase !== 'listening') return;
    this._absorb(event);
    if (!this._liveLine()) return;
    this._showLive();
    this._scheduleTurnEnd();
  },

  _onListenError(event) {
    const code = event?.error || '';
    if (code === 'phrases-not-supported') {
      this._phrasesOff = true;
      try { if (this._recognition) this._recognition.phrases = []; } catch { /* ignore */ }
      if (this._session) this._armListen(200);
      return;
    }
    if (code === 'aborted' || code === 'no-speech') return;
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      if (this._heardOnce && this._session) {
        this._glitchTries = (this._glitchTries || 0) + 1;
        if (this._glitchTries <= 4) {
          this._beginListen();
          return;
        }
        this._statusLocked = true;
        this._setStatus('Tap the microphone so I can hear you.');
        return;
      }
      this._needUnlock = true;
      this._showMicBlocked();
      return;
    }
    if (code === 'audio-capture') {
      this._session = false;
      this._phase = 'idle';
      this._statusLocked = true;
      this._setStatus('No microphone found.');
      this._syncMic();
      this._statusLocked = false;
    }
  },

  _onListenEnd() {
    this.listening = false;
    if (this._phase === 'speaking' && this._session && this._barge) {
      this._armListen(250);
      return;
    }
    if (this._phase === 'listening' && this._session && !this._sentThisListen) {
      this._stashFinals();
      const since = Date.now() - (this._listenStarted || 0);
      if (since < 250 && !this._liveLine()) {
        this._emptyStarts = (this._emptyStarts || 0) + 1;
        if (this._emptyStarts > 6) {
          this._statusLocked = true;
          this._setStatus('Tap the microphone so I can hear you.');
          return;
        }
      } else {
        this._emptyStarts = 0;
      }
      this._beginListen();
      return;
    }
    if (!this._session || this._phase === 'thinking' || this._phase === 'speaking') {
      this._syncMic();
      return;
    }
    this._armListen(200);
  },

  _armListen(delay) {
    clearTimeout(this._resumeTimer);
    const wait = typeof delay === 'number' ? delay : this.resumeDelay;
    this._resumeTimer = setTimeout(() => this._beginListen(), wait);
  },

  _beginListen() {
    if (!this._session || !this.listenSupported) return;
    if (this._phase === 'thinking') return;
    if (this._phase === 'speaking' && !this._barge) return;
    const rec = this._ensureRecognition();
    if (!rec) return;
    rec.lang = this._listenLang();
    if (this._phase !== 'speaking') this._phase = 'listening';
    this._listenStarted = Date.now();
    this._syncMic();
    try {
      rec.start();
    } catch {
      this._bargeTries = (this._bargeTries || 0) + 1;
      if (this._barge && this._phase === 'speaking' && this._bargeTries < 8) this._armListen(300);
    }
  },

  toggleTalk() {
    if (!this._session && this._phase === 'idle') {
      this.startTalk();
      return;
    }
    if (this._phase === 'speaking' || this._phase === 'thinking') {
      this._cutSpeech();
      this._session = true;
      this._sentThisListen = false;
      this._phase = 'listening';
      this._listenHint = 'Go ahead.';
    }
    this._emptyStarts = 0;
    this._glitchTries = 0;
    this._beginListen();
  },

  _chunks(text) {
    const plain = this.stripMarkdown(text);
    const parts = plain.split(/(?<=[.!?])\s+/).map(part => part.trim()).filter(Boolean);
    const source = parts.length ? parts : [plain];
    const chunks = [];
    source.forEach(part => {
      if (part.length <= 140) {
        chunks.push(part);
        return;
      }
      for (let i = 0; i < part.length; i += 140) {
        const bite = part.slice(i, i + 140).trim();
        if (bite) chunks.push(bite);
      }
    });
    return chunks.length ? chunks : [plain];
  },

  _cutSpeech() {
    this._replyTurn += 1;
    this._barge = false;
    this._queue = [];
    clearTimeout(this._resumeTimer);
    clearTimeout(this._speakWatch);
    this.stop();
    this.speaking = false;
  },

  interrupt(line) {
    const text = String(line || '').trim();
    this._cutSpeech();
    this._clearTranscript();
    this._session = true;
    this._sentThisListen = false;
    if (text) {
      this._ignoreUntil = 0;
      this._speakingText = '';
      this._listenHint = '';
      this._commitHeard(text);
      return;
    }
    this._ignoreUntil = Date.now() + 900;
    this._listenHint = 'Your turn. Correct that.';
    this._phase = 'listening';
    this._syncMic();
    clearTimeout(this._resumeTimer);
    this._resumeTimer = setTimeout(() => {
      if (!this._session || this._phase !== 'listening') return;
      this._speakingText = '';
      this._ignoreUntil = 0;
      this._beginListen();
    }, 900);
  },

  _openCall() {
    this.autoRead = true;
    localStorage.setItem('adam-voice-auto', '1');
    if (this.autoInput) this.autoInput.checked = true;
    this._syncToggle();
    this.stop();
    this._clearTranscript();
    this._sentThisListen = false;
    this._listenHint = '';
    this._session = true;
    this._statusLocked = false;
    this._needUnlock = false;
    this._heardOnce = false;
    this._glitchTries = 0;
    this._emptyStarts = 0;
    // Start in this tap. A wait, or grabbing the mic first, makes Android Chrome drop the tap.
    this._beginListen();
    if (this.supported) {
      const prime = new SpeechSynthesisUtterance(' ');
      prime.volume = 0;
      try { speechSynthesis.speak(prime); } catch { /* gesture already used */ }
    }
  },

  _askForAllow() {
    const ask = this._askMic();
    if (!ask) {
      this._showMicBlocked();
      return;
    }
    if (this._asking) return;
    this._asking = true;
    this._setStatus('Allow the microphone, then tap the microphone again.');
    ask.then(result => {
      this._asking = false;
      if (result === 'granted') {
        this._needUnlock = false;
        this._statusLocked = true;
        this._setStatus('Microphone allowed. Tap the microphone again.');
        return;
      }
      if (result === 'missing') {
        this._session = false;
        this._phase = 'idle';
        this._syncMic();
        this._statusLocked = true;
        this._setStatus('No microphone found on this phone.');
        return;
      }
      this._needUnlock = true;
      this._showMicBlocked();
    });
  },

  startTalk() {
    this._statusLocked = false;
    if (!this.listenSupported) {
      this._setStatus('This browser cannot hear you. Use Chrome or Edge, then tap the microphone.');
      return;
    }
    if (this._needUnlock) {
      this._askForAllow();
      return;
    }
    this._openCall();
  },

  stopTalk() {
    this._session = false;
    this._phase = 'idle';
    clearTimeout(this._resumeTimer);
    this._clearTranscript();
    this._speakGen += 1;
    this.stop();
    try { this._recognition?.abort?.(); } catch { /* ignore */ }
    try { this._recognition?.stop(); } catch { /* ignore */ }
    this.listening = false;
    this._setInput('');
    this._showOnChat('');
    this._syncMic();
  },

  stripMarkdown(text) {
    return String(text || '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/•/g, '')
      .replace(/\n+/g, '. ')
      .trim();
  },

  speak(text) {
    if (!text) return;
    this._lastText = text;
    if (!this.supported || !this.autoRead) {
      this._queue = [];
      this._afterSpeak();
      return;
    }

    this.stop();
    this._queue = this._chunks(text);
    this._speakingText = this._queue.join(' ');
    const gen = ++this._speakGen;
    this._barge = false;
    this._phase = 'speaking';
    this.speaking = true;
    this._syncMic();
    try { this._recognition?.stop(); } catch { /* not listening */ }
    this._speakChunk(gen);
  },

  _speakChunk(gen) {
    if (gen !== this._speakGen) return;
    const line = (this._queue || []).shift();
    if (!line) {
      this._afterSpeak();
      return;
    }
    const utter = new SpeechSynthesisUtterance(line);
    this._loadVoices();
    const voice = this._freshVoice(this._pickVoice());
    if (voice) {
      utter.voice = voice;
      if (voice.lang) utter.lang = voice.lang;
    } else {
      utter.lang = this._listenLang();
    }
    utter.rate = this.rate;
    utter.pitch = this.pitch;
    const finish = () => {
      if (gen !== this._speakGen) return;
      if (this.supported && (speechSynthesis.speaking || speechSynthesis.pending)) {
        this._armSpeakWatch(gen);
        return;
      }
      this._speakChunk(gen);
    };
    utter.onend = finish;
    utter.onerror = finish;
    speechSynthesis.speak(utter);
    if (this._session && !this._barge) {
      this._barge = true;
      this._armListen(400);
    }
  },

  _armSpeakWatch(gen) {
    clearTimeout(this._speakWatch);
    this._speakWatch = setTimeout(() => {
      if (gen !== this._speakGen) return;
      if (this.supported && (speechSynthesis.speaking || speechSynthesis.pending)) {
        this._armSpeakWatch(gen);
        return;
      }
      this._speakChunk(gen);
    }, 200);
  },

  _afterSpeak() {
    this.speaking = false;
    this._barge = false;
    this._speakingText = '';
    this._listenHint = '';
    this._clearTranscript();
    this._sentThisListen = false;
    if (this._phase === 'speaking' || this._phase === 'thinking') this._phase = 'idle';
    this._syncMic();
    if (this._session && this.loop) this._armListen(this.resumeDelay);
    else {
      this._session = false;
      clearTimeout(this._resumeTimer);
      try { this._recognition?.stop(); } catch { /* already stopped */ }
    }
  },

  speakLast() {
    if (this._lastText) this.speak(this._lastText);
  },

  stop() {
    this._speakGen += 1;
    this._queue = [];
    clearTimeout(this._speakWatch);
    if (this.supported) {
      try { if (typeof speechSynthesis.resume === 'function') speechSynthesis.resume(); } catch { /* ignore */ }
      try { speechSynthesis.cancel(); } catch { /* ignore */ }
      try { if (typeof speechSynthesis.resume === 'function') speechSynthesis.resume(); } catch { /* ignore */ }
      try { speechSynthesis.cancel(); } catch { /* ignore */ }
    }
    this.speaking = false;
  },

  saveFromForm() {
    const autoInput = document.getElementById('voice-auto');
    const rateInput = document.getElementById('voice-rate');
    const pitchInput = document.getElementById('voice-pitch');
    const loopInput = document.getElementById('voice-loop');
    const genderInput = document.getElementById('ai-gender');
    const voiceInput = document.getElementById('ai-voice');
    if (autoInput) {
      this.autoRead = !!autoInput.checked;
      localStorage.setItem('adam-voice-auto', this.autoRead ? '1' : '0');
    }
    if (loopInput) {
      this.loop = !!loopInput.checked;
      localStorage.setItem('adam-voice-loop', this.loop ? '1' : '0');
    }
    if (genderInput) {
      this.gender = genderInput.value || 'any';
      localStorage.setItem('adam-ai-gender', this.gender);
    }
    if (voiceInput) {
      this.voiceUri = voiceInput.value || '';
      localStorage.setItem('adam-ai-voice', this.voiceUri);
    }
    if (rateInput) {
      this.rate = Number(rateInput.value) || 0.92;
      localStorage.setItem('adam-voice-rate', String(this.rate));
    }
    if (pitchInput) {
      this.pitch = Number(pitchInput.value) || 1;
      localStorage.setItem('adam-voice-pitch', String(this.pitch));
    }
    this._syncToggle();
    this._syncSliderLabels();
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.adamVoice = adamVoice;
}
