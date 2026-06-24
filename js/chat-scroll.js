/**
 * Disappearing chat scroll — newest at bottom; scroll up to preview older messages.
 */
const adamChatScroll = {
  _bound: false,
  _nearBottomThreshold: 80,
  _scrollTimers: [],

  init() {
    const chat = document.getElementById('chat');
    const viewport = document.getElementById('chat-viewport');
    if (!chat || !viewport || this._bound) return;
    this._bound = true;

    chat.addEventListener('scroll', () => this.updateState(), { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (this.isNearBottom(chat)) this._pinToBottom(chat, { silent: true });
        this.updateState();
      });
      ro.observe(chat);
      ro.observe(viewport);
    }

    if (typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver(() => this.updateState());
      mo.observe(chat, { childList: true, subtree: true, characterData: true });
    }

    this.updateState();
    this.scrollToLatest({ force: true });
  },

  isNearBottom(chat = document.getElementById('chat')) {
    if (!chat) return true;
    const distance = chat.scrollHeight - chat.scrollTop - chat.clientHeight;
    return distance <= this._nearBottomThreshold;
  },

  hasOverflow(chat = document.getElementById('chat')) {
    if (!chat) return false;
    return chat.scrollHeight > chat.clientHeight + 4;
  },

  _pinToBottom(chat, { silent = false } = {}) {
    const maxScroll = Math.max(0, chat.scrollHeight - chat.clientHeight);
    chat.scrollTop = maxScroll;
    if (!silent) this.updateState();
  },

  _clearScrollTimers() {
    this._scrollTimers.forEach(id => clearTimeout(id));
    this._scrollTimers = [];
  },

  scrollToLatest({ force = false } = {}) {
    const chat = document.getElementById('chat');
    if (!chat) return;
    if (!force && !this.isNearBottom(chat)) {
      this.updateState();
      return;
    }

    const run = () => this._pinToBottom(chat, { silent: true });
    this._clearScrollTimers();

    run();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(run));
    }
    [50, 150, 300].forEach(ms => {
      this._scrollTimers.push(setTimeout(() => {
        run();
        this.updateState();
      }, ms));
    });

    this.updateState();
  },

  _updateScrollbar(chat) {
    const bar = document.getElementById('chat-scrollbar');
    const thumb = document.getElementById('chat-scrollbar-thumb');
    if (!bar || !thumb || !chat) return;

    const overflow = this.hasOverflow(chat);
    bar.classList.toggle('visible', overflow);
    if (!overflow) return;

    const trackHeight = bar.clientHeight;
    const ratio = chat.clientHeight / chat.scrollHeight;
    const thumbHeight = Math.max(32, Math.round(ratio * trackHeight));
    const maxScroll = Math.max(0, chat.scrollHeight - chat.clientHeight);
    const travel = Math.max(0, trackHeight - thumbHeight);
    const offset = maxScroll > 0 ? (chat.scrollTop / maxScroll) * travel : 0;

    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${offset}px)`;
  },

  updateState() {
    const chat = document.getElementById('chat');
    const viewport = document.getElementById('chat-viewport');
    const hint = document.getElementById('chat-scroll-hint');
    if (!chat || !viewport) return;

    const overflow = this.hasOverflow(chat);
    const atBottom = this.isNearBottom(chat);

    viewport.classList.toggle('has-history', overflow);
    viewport.classList.toggle('at-bottom', atBottom);
    viewport.classList.toggle('scrolled-up', overflow && !atBottom);

    if (hint) {
      hint.classList.toggle('hidden', !overflow || !atBottom);
    }

    this._updateScrollbar(chat);
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.adamChatScroll = adamChatScroll;
}