/**
 * Adam The Volcano Vent Bot voice — English text-to-speech via Web Speech API.
 */
const adamVoice = {
  supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  autoRead: localStorage.getItem('adam-voice-auto') === '1',
  rate: Number(localStorage.getItem('adam-voice-rate')) || 0.92,
  pitch: Number(localStorage.getItem('adam-voice-pitch')) || 1,
  speaking: false,
  voices: [],
  _lastText: '',

  init() {
    if (!this.supported) return;
    this.toggleBtn = document.getElementById('voice-toggle');
    this.rateInput = document.getElementById('voice-rate');
    this.autoInput = document.getElementById('voice-auto');

    if (this.rateInput) this.rateInput.value = String(this.rate);
    if (this.autoInput) this.autoInput.checked = this.autoRead;

    speechSynthesis.addEventListener('voiceschanged', () => this._loadVoices());
    this._loadVoices();
    this._syncToggle();
    this._bind();
  },

  _bind() {
    this.toggleBtn?.addEventListener('click', () => {
      this.autoRead = !this.autoRead;
      localStorage.setItem('adam-voice-auto', this.autoRead ? '1' : '0');
      if (this.autoInput) this.autoInput.checked = this.autoRead;
      this._syncToggle();
      if (this.autoRead) this.speak(this._lastText);
    });
    this.rateInput?.addEventListener('input', () => {
      this.rate = Number(this.rateInput.value) || 0.92;
      localStorage.setItem('adam-voice-rate', String(this.rate));
    });
    this.autoInput?.addEventListener('change', () => {
      this.autoRead = this.autoInput.checked;
      localStorage.setItem('adam-voice-auto', this.autoRead ? '1' : '0');
      this._syncToggle();
    });
  },

  _loadVoices() {
    this.voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  },

  _pickVoice() {
    const preferred = ['Daniel', 'Google UK English Male', 'Microsoft David', 'Alex', 'Fred', 'Mark'];
    for (const name of preferred) {
      const v = this.voices.find(x => x.name.includes(name));
      if (v) return v;
    }
    return this.voices[0] || null;
  },

  _syncToggle() {
    if (!this.toggleBtn) return;
    const icon = this.toggleBtn.querySelector('.voice-icon');
    const label = this.toggleBtn.querySelector('.voice-label');
    if (this.autoRead) {
      this.toggleBtn.classList.add('on');
      this.toggleBtn.title = 'Listen: on — bot reads replies aloud';
      if (icon) icon.textContent = '🔊';
      if (label) label.textContent = 'Listen on';
    } else {
      this.toggleBtn.classList.remove('on');
      this.toggleBtn.title = 'Listen: off — tap to hear replies aloud';
      if (icon) icon.textContent = '🔇';
      if (label) label.textContent = 'Listen off';
    }
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
    if (!this.supported || !text) return;
    this._lastText = text;
    if (!this.autoRead) return;

    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(this.stripMarkdown(text));
    const voice = this._pickVoice();
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang || 'en-US';
    } else {
      utter.lang = 'en-US';
    }
    utter.rate = this.rate;
    utter.pitch = this.pitch;
    this.speaking = true;
    utter.onend = () => { this.speaking = false; };
    speechSynthesis.speak(utter);
  },

  speakLast() {
    if (this._lastText) this.speak(this._lastText);
  },

  stop() {
    if (this.supported) speechSynthesis.cancel();
    this.speaking = false;
  },

  saveFromForm() {
    const autoInput = document.getElementById('voice-auto');
    const rateInput = document.getElementById('voice-rate');
    if (autoInput) {
      this.autoRead = !!autoInput.checked;
      localStorage.setItem('adam-voice-auto', this.autoRead ? '1' : '0');
    }
    if (rateInput) {
      this.rate = Number(rateInput.value) || 0.92;
      localStorage.setItem('adam-voice-rate', String(this.rate));
    }
    this._syncToggle();
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.adamVoice = adamVoice;
}