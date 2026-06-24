/**
 * Conversation history — local storage + optional cloud sync (mobile ↔ web).
 */
const ADAM_CONV_STORAGE = 'adam-conversations-v1';
const ADAM_SYNC_ID_KEY = 'adam-sync-id';
const ADAM_CONV_MAX = 80;

const adamConversations = {
  data: null,
  _syncTimer: null,
  _cloudSyncReady: false,

  async init() {
    this._cloudSyncReady = false;
    this.data = this._loadLocal();
    this.bindUi();
    if (this.getSyncId()) {
      try {
        await this.pullFromCloud({ initial: true, skipUi: true });
      } catch { /* offline */ }
    }
    if (!this.data.conversations.length) {
      this.createNew({ silent: true });
    }
    this._cloudSyncReady = true;
    this.renderList();
    this.loadActiveIntoChat();
    this._updateSyncHint();
    this._bindVisibilitySync();
  },

  _loadLocal() {
    try {
      const raw = localStorage.getItem(ADAM_CONV_STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.conversations?.length) return this._normalize(parsed);
      }
    } catch { /* fresh */ }
    return { activeId: null, conversations: [], updatedAt: Date.now() };
  },

  _normalize(data) {
    const tombstones = { ...(data.deletedConversationIds || {}) };
    const conversations = (data.conversations || [])
      .filter(c => c?.id && !tombstones[c.id])
      .slice(0, ADAM_CONV_MAX)
      .map(c => ({
        id: c.id || this._id(),
        title: String(c.title || 'New chat').slice(0, 80),
        createdAt: c.createdAt || Date.now(),
        updatedAt: c.updatedAt || Date.now(),
        messages: Array.isArray(c.messages) ? c.messages.slice(-200) : [],
        adamState: {
          teachMode: !!c.adamState?.teachMode,
          lastTopic: c.adamState?.lastTopic || 'general',
          lastBettingSubtopic: c.adamState?.lastBettingSubtopic || 'overview',
          walkthroughStep: c.adamState?.walkthroughStep || 0
        }
      }));
    return {
      activeId: data.activeId && conversations.some(c => c.id === data.activeId)
        ? data.activeId
        : conversations[0]?.id,
      conversations,
      updatedAt: data.updatedAt || Date.now(),
      deletedConversationIds: tombstones
    };
  },

  _tombstoneConversation(id) {
    if (!id) return;
    if (!this.data.deletedConversationIds) this.data.deletedConversationIds = {};
    this.data.deletedConversationIds[id] = Date.now();
  },

  _mergeDeletedIds(a = {}, b = {}) {
    const out = { ...a };
    Object.entries(b).forEach(([id, ts]) => {
      out[id] = Math.max(out[id] || 0, Number(ts) || 0);
    });
    return out;
  },

  _syncAfterDelete() {
    if (!this.getSyncId() || !this._cloudSyncReady) return;
    clearTimeout(this._syncTimer);
    this.syncFull({ quiet: true }).catch(() => {});
  },

  _saveLocal({ skipCloud } = {}) {
    this.data.updatedAt = Date.now();
    localStorage.setItem(ADAM_CONV_STORAGE, JSON.stringify(this.data));
    if (!skipCloud) this._scheduleCloudPush();
  },

  _id() {
    return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  },

  getActive() {
    return this.data.conversations.find(c => c.id === this.data.activeId) || this.data.conversations[0];
  },

  _snapshotAdamState() {
    if (typeof adam === 'undefined') return;
    const conv = this.getActive();
    if (!conv) return;
    conv.adamState = {
      teachMode: !!adam.teachMode,
      lastTopic: adam.lastTopic || 'general',
      lastBettingSubtopic: adam.lastBettingSubtopic || 'overview',
      walkthroughStep: adam.walkthroughStep || 0
    };
  },

  _applyAdamState(conv) {
    if (typeof adam === 'undefined' || !conv) return;
    const s = conv.adamState || {};
    adam.teachMode = !!s.teachMode;
    adam.lastTopic = s.lastTopic || 'general';
    adam.lastBettingSubtopic = s.lastBettingSubtopic || 'overview';
    adam.walkthroughStep = s.walkthroughStep || 0;
    adam.conversationHistory = (conv.messages || [])
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.text }));
  },

  _titleFromMessage(text) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return 'New chat';
    return t.length > 42 ? `${t.slice(0, 42)}…` : t;
  },

  _sortConversations() {
    return [...this.data.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  },

  _promoteConversation(id) {
    const conv = this.data.conversations.find(c => c.id === id);
    if (!conv) return;
    conv.updatedAt = Date.now();
    const rest = this.data.conversations.filter(c => c.id !== id);
    this.data.conversations = [conv, ...rest.sort((a, b) => b.updatedAt - a.updatedAt)];
  },

  createNew({ silent } = {}) {
    this._snapshotAdamState();
    this._closeMobileSidebar();
    const conv = {
      id: this._id(),
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      adamState: { teachMode: false, lastTopic: 'general', lastBettingSubtopic: 'overview' }
    };
    this.data.conversations.unshift(conv);
    if (this.data.conversations.length > ADAM_CONV_MAX) {
      this.data.conversations = this.data.conversations.slice(0, ADAM_CONV_MAX);
    }
    this.data.activeId = conv.id;
    this._promoteConversation(conv.id);
    this._saveLocal();
    this.renderList();
    this.loadActiveIntoChat({ greet: true, silent });
    this._closeMobileSidebar();
    return conv;
  },

  switchTo(id) {
    if (id === this.data.activeId) return;
    this._snapshotAdamState();
    this.data.activeId = id;
    this._promoteConversation(id);
    this._saveLocal();
    this.renderList();
    this.loadActiveIntoChat();
    this._closeMobileSidebar();
  },

  deleteConversation(id) {
    this._tombstoneConversation(id);
    const wasActive = this.data.activeId === id;
    this.data.conversations = this.data.conversations.filter(c => c.id !== id);
    if (!this.data.conversations.length) {
      this.createNew({ silent: true });
    } else if (wasActive) {
      this.data.activeId = this._sortConversations()[0]?.id;
      this.loadActiveIntoChat();
    }
    this._saveLocal();
    this.renderList();
    this._syncAfterDelete();
  },

  appendMessage(role, text, source) {
    const conv = this.getActive();
    if (!conv) return;
    conv.messages.push({
      role,
      text: String(text || ''),
      source: source || null,
      at: Date.now()
    });
    if (role === 'user' && (conv.title === 'New chat' || !conv.title)) {
      conv.title = this._titleFromMessage(text);
    }
    this._promoteConversation(conv.id);
    this._snapshotAdamState();
    this._saveLocal();
    this.renderList();
  },

  loadActiveIntoChat({ greet, silent } = {}) {
    const conv = this.getActive();
    const chat = document.getElementById('chat');
    if (!chat || !conv) return;

    chat.innerHTML = '';
    const spacer = document.createElement('div');
    spacer.className = 'chat-top-spacer';
    spacer.id = 'chat-top-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    chat.appendChild(spacer);
    const anchor = document.createElement('div');
    anchor.className = 'chat-scroll-anchor';
    anchor.id = 'chat-scroll-anchor';
    anchor.setAttribute('aria-hidden', 'true');
    chat.appendChild(anchor);
    if (typeof window !== 'undefined') window.chatHistory = [];

    this._applyAdamState(conv);

    if (conv.messages.length) {
      conv.messages.forEach(m => {
        if (typeof window.renderChatMessage === 'function') {
          window.renderChatMessage(m.role, m.text, m.source, { persist: false, skipScroll: true });
        }
      });
    } else if (greet && typeof adam !== 'undefined') {
      const greeting = adam.greet();
      if (typeof window.renderChatMessage === 'function') {
        window.renderChatMessage('assistant', greeting, typeof ADAM_SOURCE !== 'undefined' ? ADAM_SOURCE : '🌋 Adam The Volcano Vent Bot', { persist: false });
      }
      conv.messages.push({
        role: 'assistant',
        text: greeting,
        source: typeof ADAM_SOURCE !== 'undefined' ? ADAM_SOURCE : '🌋 Adam The Volcano Vent Bot',
        at: Date.now()
      });
      this._saveLocal();
    }

    if (typeof adamChatScroll !== 'undefined') {
      adamChatScroll.scrollToLatest({ force: true });
    }
  },

  renderList() {
    const list = document.getElementById('conv-list');
    if (!list || !this.data) return;
    list.innerHTML = '';
    const sorted = this._sortConversations();
    const activeId = this.data.activeId;
    const active = sorted.find(c => c.id === activeId);
    const display = active
      ? [active, ...sorted.filter(c => c.id !== activeId)]
      : sorted;
    display.forEach(conv => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `conv-item${conv.id === this.data.activeId ? ' active' : ''}`;
      btn.dataset.id = conv.id;
      const title = document.createElement('span');
      title.className = 'conv-item-title';
      title.textContent = conv.title || 'New chat';
      const date = document.createElement('span');
      date.className = 'conv-item-date';
      date.textContent = this._formatDate(conv.updatedAt);
      btn.appendChild(title);
      btn.appendChild(date);
      btn.addEventListener('click', () => this.switchTo(conv.id));
      li.appendChild(btn);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'conv-delete';
      del.title = `Delete "${conv.title || 'New chat'}"`;
      del.setAttribute('aria-label', `Delete conversation: ${conv.title || 'New chat'}`);
      del.textContent = '🗑';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${conv.title || 'New chat'}"?`)) this.deleteConversation(conv.id);
      });
      li.appendChild(del);
      list.appendChild(li);
    });
    list.scrollTop = 0;
  },

  _formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  },

  getSyncId() {
    return String(localStorage.getItem(ADAM_SYNC_ID_KEY) || '').trim().toLowerCase();
  },

  setSyncId(id) {
    const v = String(id || '').trim().toLowerCase();
    if (v) localStorage.setItem(ADAM_SYNC_ID_KEY, v);
    else localStorage.removeItem(ADAM_SYNC_ID_KEY);
    this._updateSyncHint();
  },

  async saveSyncIdAndSync(id) {
    const v = String(id || '').trim().toLowerCase();
    if (v.length < 6) {
      throw new Error('Sync ID needs at least 6 characters — or tap Generate.');
    }
    this.setSyncId(v);
    const input = document.getElementById('sync-id-input');
    if (input) input.value = v;
    this._cloudSyncReady = true;
    await this.syncFull();
  },

  generateSyncId() {
    const words = 'vent-dice-lava-bead-button-charm-token-count-rescue-ember-ash-flow-game-play-roll-sum-ante-keeper-napkin-table-home-rule-guide-adam-sync';
    const parts = words.split('-');
    const pick = () => parts[Math.floor(Math.random() * parts.length)];
    return `${pick()}-${pick()}-${pick()}-${Math.random().toString(36).slice(2, 6)}`;
  },

  syncEndpoint() {
    if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
      return 'https://volcano-vent-adam.netlify.app/.netlify/functions/sync';
    }
    return '/.netlify/functions/sync';
  },

  _scheduleCloudPush() {
    if (!this.getSyncId() || !this._cloudSyncReady) return;
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this.syncFull({ quiet: true }).catch(() => {}), 1500);
  },

  async syncFull({ quiet } = {}) {
    if (this._syncInFlight) return this._syncInFlight;
    this._syncInFlight = this._runSyncFull({ quiet }).finally(() => {
      this._syncInFlight = null;
    });
    return this._syncInFlight;
  },

  async _runSyncFull({ quiet } = {}) {
    const localBefore = this.data.conversations.length;
    const activeBefore = this.data.activeId;
    this._snapshotAdamState();
    const pulled = await this.pullFromCloud({ quiet, skipUi: true, keepActiveId: activeBefore });
    const remoteCount = pulled?.data?.conversations?.length || 0;
    await this.pushToCloud({ quiet });
    await this.pullFromCloud({ quiet, skipUi: true, keepActiveId: this.data.activeId || activeBefore });
    this._restoreActiveId(activeBefore);
    this.renderList();
    this.loadActiveIntoChat();
    if (!quiet) {
      const n = this.data.conversations.length;
      const titles = this.data.conversations.slice(0, 4).map(c => c.title || 'New chat').join(', ');
      const more = n > 4 ? ` +${n - 4} more` : '';
      this._setSyncStatus(
        `Synced — ${n} chat${n === 1 ? '' : 's'} on this device`
        + (remoteCount ? ` (cloud had ${remoteCount}, you had ${localBefore})` : '')
        + (titles ? `: ${titles}${more}` : '')
      );
    }
  },

  async pushToCloud({ quiet } = {}) {
    const syncId = this.getSyncId();
    if (!syncId) return { ok: false, reason: 'no-sync-id' };
    this._snapshotAdamState();
    const res = await fetch(this.syncEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ syncId: syncId.toLowerCase(), data: this.data })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || `Sync push HTTP ${res.status}`;
      if (res.status === 404) {
        throw new Error('Sync service not found — hard-refresh the page (Ctrl+F5). Or use Export / Import bundle.');
      }
      if (res.status === 503) {
        throw new Error(msg);
      }
      throw new Error(msg);
    }
    if (!quiet) this._setSyncStatus('Synced to cloud');
    return res.json();
  },

  _restoreActiveId(preferredId) {
    if (!preferredId || !this.data?.conversations?.length) return;
    if (this.data.conversations.some(c => c.id === preferredId)) {
      this.data.activeId = preferredId;
    }
  },

  async pullFromCloud({ quiet, initial, skipUi, keepActiveId } = {}) {
    const syncId = this.getSyncId();
    if (!syncId) return { ok: false, reason: 'no-sync-id' };
    const res = await fetch(
      `${this.syncEndpoint()}?syncId=${encodeURIComponent(syncId)}&_=${Date.now()}`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || `Sync pull HTTP ${res.status}`;
      if (res.status === 404) {
        throw new Error('Sync service not found — hard-refresh the page (Ctrl+F5). Or use Export / Import bundle.');
      }
      if (res.status === 503) {
        throw new Error(msg);
      }
      throw new Error(msg);
    }
    const payload = await res.json();
    if (payload?.data) {
      const remote = this._normalize(payload.data);
      if (remote.conversations.length || initial) {
        const pinActive = keepActiveId || this.data.activeId;
        this.data = this._mergeRemote(this.data, remote, { keepActiveId: pinActive });
        this._saveLocal({ skipCloud: true });
        if (!skipUi) {
          this.renderList();
          this.loadActiveIntoChat();
        }
      }
    }
    if (!quiet) this._setSyncStatus('Synced from cloud');
    return payload;
  },

  _mergeMessages(a = [], b = []) {
    const seen = new Set();
    const out = [];
    [...a, ...b]
      .sort((x, y) => (x.at || 0) - (y.at || 0))
      .forEach(m => {
        const key = `${m.at || 0}|${m.role}|${String(m.text || '').slice(0, 300)}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(m);
      });
    return out.slice(-200);
  },

  _mergeConversationPair(a, b) {
    if (!a) return b;
    if (!b) return a;
    const messages = this._mergeMessages(a.messages, b.messages);
    const updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
    const winner = (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b;
    return {
      ...a,
      ...b,
      messages,
      updatedAt,
      title: winner.title || a.title || b.title,
      adamState: winner.adamState || a.adamState || b.adamState,
      createdAt: Math.min(a.createdAt || updatedAt, b.createdAt || updatedAt)
    };
  },

  _mergeRemote(local, remote, { keepActiveId } = {}) {
    const tombstones = this._mergeDeletedIds(
      local?.deletedConversationIds,
      remote?.deletedConversationIds
    );
    const byId = new Map();
    [...(local?.conversations || []), ...(remote?.conversations || [])].forEach(c => {
      if (!c?.id || tombstones[c.id]) return;
      byId.set(c.id, this._mergeConversationPair(byId.get(c.id), c));
    });
    const conversations = [...byId.values()]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, ADAM_CONV_MAX);
    const pinned = keepActiveId || local?.activeId;
    let activeId = null;
    if (pinned && conversations.some(c => c.id === pinned)) {
      activeId = pinned;
    } else if (local?.activeId && conversations.some(c => c.id === local.activeId)) {
      activeId = local.activeId;
    } else if (remote?.activeId && conversations.some(c => c.id === remote.activeId)) {
      activeId = remote.activeId;
    } else {
      activeId = conversations[0]?.id;
    }
    return {
      activeId,
      conversations,
      updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0),
      deletedConversationIds: tombstones
    };
  },

  _bindVisibilitySync() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.getSyncId() && this._cloudSyncReady) {
        this.syncFull({ quiet: true }).catch(() => {});
      }
    });
  },

  _setSyncStatus(msg) {
    const el = document.getElementById('sync-hint');
    if (el) el.textContent = msg;
    const status = document.getElementById('sync-settings-status');
    if (status) status.textContent = msg;
  },

  _updateSyncHint() {
    const id = this.getSyncId();
    const el = document.getElementById('sync-hint');
    if (!el) return;
    el.textContent = id
      ? `Your Sync ID — private sync across your devices only`
      : 'Private on this device — never shared with other users';
  },

  bindUi() {
    const startNew = () => this.createNew();
    document.getElementById('new-conversation-btn')?.addEventListener('click', startNew);
    document.getElementById('header-new-conversation-btn')?.addEventListener('click', startNew);
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => this._openMobileSidebar());
    document.getElementById('sidebar-close')?.addEventListener('click', () => this._closeMobileSidebar());
    document.getElementById('sidebar-backdrop')?.addEventListener('click', () => this._closeMobileSidebar());

    document.getElementById('sync-generate-id')?.addEventListener('click', () => {
      const input = document.getElementById('sync-id-input');
      if (input) input.value = this.generateSyncId();
    });
    document.getElementById('sync-save-id')?.addEventListener('click', async () => {
      const input = document.getElementById('sync-id-input');
      const id = input?.value?.trim() || '';
      try {
        await this.saveSyncIdAndSync(id);
      } catch (e) {
        if (String(e.message || e).includes('6 characters')) {
          alert(e.message || e);
        } else {
          this._setSyncStatus('Sync ID saved — cloud sync failed (try Sync now later)');
        }
      }
    });
    document.getElementById('sync-now')?.addEventListener('click', async () => {
      const btn = document.getElementById('sync-now');
      if (btn) btn.disabled = true;
      try {
        await this.syncFull();
      } catch (e) {
        this._setSyncStatus(`Sync failed — ${e.message || e}`);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
    document.getElementById('sync-clear-id')?.addEventListener('click', () => {
      this.setSyncId('');
      const input = document.getElementById('sync-id-input');
      if (input) input.value = '';
      this._setSyncStatus('Sync ID cleared — device-only storage');
    });
    document.getElementById('sync-export-bundle')?.addEventListener('click', () => this.exportBundle());
    document.getElementById('sync-import-bundle')?.addEventListener('click', () => this.importBundle());

    const savedId = this.getSyncId();
    const input = document.getElementById('sync-id-input');
    if (input && savedId) input.value = savedId;
  },

  _openMobileSidebar() {
    document.body.classList.add('sidebar-open');
  },

  _closeMobileSidebar() {
    document.body.classList.remove('sidebar-open');
  },

  exportBundle() {
    this._snapshotAdamState();
    const bundle = {
      v: 1,
      exportedAt: Date.now(),
      syncId: this.getSyncId() || null,
      data: this.data
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(bundle))));
    const ta = document.getElementById('sync-bundle-text');
    if (ta) {
      ta.value = encoded;
      ta.classList.remove('hidden');
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(encoded).then(() => {
        this._setSyncStatus('Sync bundle copied — paste on your other device');
      }).catch(() => {
        this._setSyncStatus('Sync bundle ready — copy from the box below');
      });
    } else {
      this._setSyncStatus('Sync bundle ready — copy from the box below');
    }
  },

  importBundle() {
    const ta = document.getElementById('sync-bundle-text');
    const raw = ta?.value?.trim();
    if (!raw) {
      alert('Paste a sync bundle first (from Export on your other device).');
      return;
    }
    try {
      const json = decodeURIComponent(escape(atob(raw)));
      const bundle = JSON.parse(json);
      if (!bundle?.data?.conversations?.length) throw new Error('Invalid bundle');
      const activeBefore = this.data.activeId;
      this.data = this._mergeRemote(this.data, this._normalize(bundle.data), { keepActiveId: activeBefore });
      if (bundle.syncId) {
        this.setSyncId(bundle.syncId);
        const input = document.getElementById('sync-id-input');
        if (input) input.value = bundle.syncId;
      }
      this._saveLocal();
      this.renderList();
      this.loadActiveIntoChat();
      this._setSyncStatus('Imported — chats merged from other device');
    } catch (e) {
      alert('Could not read that bundle — copy the full export string.');
    }
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.adamConversations = adamConversations;
}