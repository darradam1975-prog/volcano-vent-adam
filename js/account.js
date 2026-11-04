/**
 * Account panel — Sign in with Google, then set a password.
 * The session token stays on this device. The password is hashed in the cloud.
 */
const ADAM_ACCOUNT_SESSION = 'adam-account-session';
const ADAM_GOOGLE_CLIENT_KEY = 'adam-google-client-id';

const adamAccount = {
  session: '',
  user: null,
  workerClientId: '',
  _gsi: null,
  _renderedFor: '',

  endpoint() {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'volcano-vent.com' || host === 'www.volcano-vent.com' || /netlify\.app$/i.test(host)) {
        return '/.netlify/functions/auth';
      }
      if (host.endsWith('github.io')) return 'https://volcano-vent.com/.netlify/functions/auth';
    }
    if (typeof adamSite !== 'undefined') return adamSite.functionUrl('auth');
    return null;
  },

  clientId() {
    const fromConfig = typeof ADAM_GOOGLE_CLIENT_ID !== 'undefined'
      ? String(ADAM_GOOGLE_CLIENT_ID || '').trim()
      : '';
    if (fromConfig) return fromConfig;
    if (this.workerClientId) return this.workerClientId;
    try {
      return String(localStorage.getItem(ADAM_GOOGLE_CLIENT_KEY) || '').trim();
    } catch {
      return '';
    }
  },

  async init() {
    try {
      this.session = localStorage.getItem(ADAM_ACCOUNT_SESSION) || '';
    } catch {
      this.session = '';
    }
    this.bind();
    await this.refreshConfig();
    if (this.session) await this.refreshSession();
    this.render();
  },

  bind() {
    document.getElementById('account-btn')?.addEventListener('click', () => {
      if (typeof openSettings === 'function') openSettings();
      document.getElementById('account-section')?.scrollIntoView({ block: 'start' });
    });
    document.getElementById('account-save-client')?.addEventListener('click', () => this.saveClientId());
    document.getElementById('account-password-signin')?.addEventListener('click', () => this.signInWithPassword());
    document.getElementById('account-save-password')?.addEventListener('click', () => this.setPassword());
    document.getElementById('account-sign-out')?.addEventListener('click', () => this.signOut());
    document.getElementById('account-password')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.signInWithPassword();
    });
    document.getElementById('account-confirm-password')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.setPassword();
    });
  },

  async refreshConfig() {
    const url = this.endpoint();
    if (!url) return;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      this.workerClientId = String(data.googleClientId || '').trim();
      this.storage = !!data.storage;
    } catch {
      this.storage = false;
    }
  },

  async post(body) {
    const url = this.endpoint();
    if (!url) throw new Error('Sign-in needs the cloud connection.');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 404) throw new Error('Sign-in is not on the server yet. Hard-refresh the page.');
    if (!res.ok) throw new Error(data.error || 'Sign-in failed.');
    return data;
  },

  remember(data) {
    this.session = data.session || this.session;
    this.user = data.user || this.user;
    if (data.session) localStorage.setItem(ADAM_ACCOUNT_SESSION, data.session);
    const syncId = data.user?.syncId;
    if (syncId && typeof adamConversations !== 'undefined') {
      const input = document.getElementById('sync-id-input');
      if (input) input.value = syncId;
      if (adamConversations.getSyncId() !== syncId) {
        adamConversations.setSyncId(syncId);
        adamConversations._cloudSyncReady = true;
        adamConversations.syncFull?.({ quiet: true })?.catch?.(() => {});
      }
    }
    this.render();
  },

  async refreshSession() {
    try {
      const data = await this.post({ action: 'session', session: this.session });
      this.user = data.user;
    } catch {
      this.session = '';
      this.user = null;
      localStorage.removeItem(ADAM_ACCOUNT_SESSION);
    }
  },

  async onGoogleCredential(credential) {
    this.setError('');
    this.setStatus('Checking Google sign-in…');
    try {
      const data = await this.post({
        action: 'google',
        credential,
        syncId: typeof adamConversations !== 'undefined' ? adamConversations.getSyncId() : ''
      });
      this.remember(data);
      this.setStatus(data.user?.hasPassword
        ? 'Signed in. Your password is already set.'
        : 'Signed in with Google. Set a password below so you can sign in either way.');
    } catch (e) {
      this.setError(e.message || 'Google sign-in failed.');
    }
  },

  async signInWithPassword() {
    this.setError('');
    const email = document.getElementById('account-email')?.value || '';
    const password = document.getElementById('account-password')?.value || '';
    this.setStatus('Signing in…');
    try {
      const data = await this.post({
        action: 'login',
        email,
        password,
        syncId: typeof adamConversations !== 'undefined' ? adamConversations.getSyncId() : ''
      });
      const field = document.getElementById('account-password');
      if (field) field.value = '';
      this.remember(data);
      this.setStatus('Signed in with your password.');
    } catch (e) {
      this.setError(e.message || 'Sign-in failed.');
    }
  },

  async setPassword() {
    this.setError('');
    const password = document.getElementById('account-new-password')?.value || '';
    const confirm = document.getElementById('account-confirm-password')?.value || '';
    const currentPassword = document.getElementById('account-current-password')?.value || '';
    if (password !== confirm) {
      this.setError('Those passwords do not match.');
      return;
    }
    this.setStatus('Saving password…');
    try {
      const data = await this.post({
        action: 'set-password',
        session: this.session,
        password,
        currentPassword
      });
      ['account-new-password', 'account-confirm-password', 'account-current-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      this.user = data.user || this.user;
      this.render();
      this.setStatus('Password saved. You can sign in with Google or this password.');
    } catch (e) {
      this.setError(e.message || 'Could not save the password.');
    }
  },

  async signOut() {
    const session = this.session;
    this.session = '';
    this.user = null;
    localStorage.removeItem(ADAM_ACCOUNT_SESSION);
    this.render();
    this.setStatus('Signed out on this device. Chats stay here.');
    if (!session) return;
    try {
      await this.post({ action: 'logout', session });
    } catch { /* local sign-out already happened */ }
  },

  saveClientId() {
    const id = document.getElementById('account-google-client')?.value?.trim() || '';
    if (!id.endsWith('.apps.googleusercontent.com')) {
      this.setError('Paste the Web client ID from Google. It ends with .apps.googleusercontent.com.');
      return;
    }
    localStorage.setItem(ADAM_GOOGLE_CLIENT_KEY, id);
    this._renderedFor = '';
    this.setError('');
    this.setStatus('Google client ID saved on this device.');
    this.render();
  },

  loadGsi() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (this._gsi) return this._gsi;
    this._gsi = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Google sign-in did not load.'));
      document.head.appendChild(s);
    });
    return this._gsi;
  },

  async renderGoogle() {
    const host = document.getElementById('google-signin-btn');
    const id = this.clientId();
    if (!host || !id || this.user) return;
    if (this._renderedFor === id && host.childElementCount) return;
    try {
      await this.loadGsi();
      host.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: id,
        callback: (resp) => this.onGoogleCredential(resp?.credential || '')
      });
      window.google.accounts.id.renderButton(host, {
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 280
      });
      this._renderedFor = id;
    } catch (e) {
      this.setError(e.message || 'Google sign-in did not load.');
    }
  },

  render() {
    const signedIn = !!this.user;
    document.getElementById('account-signed-out')?.classList.toggle('hidden', signedIn);
    document.getElementById('account-signed-in')?.classList.toggle('hidden', !signedIn);
    const who = document.getElementById('account-who');
    if (who && this.user) {
      who.textContent = `Signed in as ${this.user.name || this.user.email} (${this.user.email}).`;
    }
    const currentWrap = document.getElementById('account-current-wrap');
    if (currentWrap) currentWrap.classList.toggle('hidden', !this.user?.hasPassword);
    const savePw = document.getElementById('account-save-password');
    if (savePw) savePw.textContent = this.user?.hasPassword ? 'Change password' : 'Set password';
    const btn = document.getElementById('account-btn');
    if (btn) {
      const label = signedIn
        ? String(this.user.name || this.user.email || 'Account').split(' ')[0].slice(0, 12)
        : 'Sign in';
      btn.textContent = label;
      btn.title = signedIn ? `Signed in as ${this.user.email}` : 'Sign in with Google or a password';
    }
    const clientField = document.getElementById('account-google-client');
    if (clientField && !clientField.value) clientField.value = this.clientId();
    const setup = document.getElementById('account-google-setup');
    if (setup) setup.classList.toggle('hidden', !!this.clientId() || signedIn);
    if (!signedIn) this.renderGoogle();
  },

  setStatus(text) {
    const el = document.getElementById('account-status');
    if (el) el.textContent = text || '';
  },

  setError(text) {
    const el = document.getElementById('account-error');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('hidden', !text);
    if (text) this.setStatus('');
  }
};

if (typeof globalThis !== 'undefined') globalThis.adamAccount = adamAccount;
