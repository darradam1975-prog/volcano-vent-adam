/**
 * Account sign-in — Google ID token, then an optional password.
 * Passwords are stored as PBKDF2 hashes in KV. Sessions are random tokens.
 */
import { jsonResponse, optionsResponse } from './cors.mjs';
import { sanitizeSyncId } from './sync.mjs';

const METHODS = 'GET, POST, OPTIONS';
const PBKDF2_ITERATIONS = 15000;
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_TTL = 30 * 24 * 60 * 60;
const LOCK_MS = 15 * 60 * 1000;
const GOOGLE_CERTS = 'https://www.googleapis.com/oauth2/v3/certs';

let certCache = { at: 0, keys: [] };

export function normalizeEmail(email) {
  const s = String(email || '').trim().toLowerCase();
  if (s.length < 6 || s.length > 120) return '';
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(s)) return '';
  return s;
}

export function passwordError(password) {
  const p = String(password || '');
  if (p.length < 8) return 'Password needs at least 8 characters.';
  if (p.length > 80) return 'Password is too long.';
  return '';
}

export function bytesToB64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function b64ToBytes(b64) {
  const s = atob(String(b64 || ''));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i);
  return out;
}

export function base64UrlToBytes(part) {
  const pad = part.length % 4 === 0 ? '' : '='.repeat(4 - (part.length % 4));
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return b64ToBytes(b64);
}

export function randomToken(bytes = 32) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function makeSyncId() {
  return `acct${randomToken(8)}`;
}

export async function hashPassword(password, saltBytes, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: saltBytes,
    iterations,
    hash: 'SHA-256'
  }, key, 256);
  return bytesToB64(new Uint8Array(bits));
}

export async function verifyPassword(password, saltB64, hashB64, iterations = PBKDF2_ITERATIONS) {
  if (!saltB64 || !hashB64) return false;
  const got = await hashPassword(password, b64ToBytes(saltB64), iterations || PBKDF2_ITERATIONS);
  if (got.length !== String(hashB64).length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i += 1) diff |= got.charCodeAt(i) ^ hashB64.charCodeAt(i);
  return diff === 0;
}

export function decodeJwtPayload(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1])));
  } catch {
    return null;
  }
}

export async function verifyRs256(token, jwk) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return false;
  let header;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0])));
  } catch {
    return false;
  }
  if (header?.alg !== 'RS256') return false;
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const sig = base64UrlToBytes(parts[2]);
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data);
}

export async function verifyGoogleIdToken(token, keys, { clientId = '', now = Date.now() } = {}) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return { error: 'Google sign-in was not valid.' };
  let header;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0])));
  } catch {
    return { error: 'Google sign-in was not valid.' };
  }
  const jwk = (keys || []).find(k => k.kid && k.kid === header.kid) || null;
  if (!jwk) return { error: 'Google sign-in could not be checked.' };
  const ok = await verifyRs256(token, jwk);
  if (!ok) return { error: 'Google sign-in was not valid.' };
  const payload = decodeJwtPayload(token);
  if (!payload) return { error: 'Google sign-in was not valid.' };
  const iss = String(payload.iss || '');
  if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') {
    return { error: 'Google sign-in was not valid.' };
  }
  if (!payload.exp || payload.exp * 1000 <= now) return { error: 'Google sign-in expired. Try again.' };
  const email = normalizeEmail(payload.email);
  if (!email || payload.email_verified !== true && payload.email_verified !== 'true') {
    return { error: 'Google did not confirm that email.' };
  }
  const aud = String(payload.aud || '');
  if (!aud.endsWith('.apps.googleusercontent.com') || aud.length > 200) {
    return { error: 'Google client ID was not recognized.' };
  }
  if (clientId && aud !== clientId) return { error: 'This Google sign-in is for a different app.' };
  const sub = String(payload.sub || '').trim();
  if (!sub || sub.length > 80) return { error: 'Google sign-in was not valid.' };
  const name = String(payload.name || email).replace(/[\u0000-\u001f]/g, '').slice(0, 80);
  return { email, name, sub, aud };
}

function publicUser(user) {
  return {
    email: user.email,
    name: user.name || user.email,
    hasPassword: !!user.passwordHash,
    syncId: user.syncId || ''
  };
}

async function readUser(kv, email) {
  const raw = await kv.get(`acct:${email}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeUser(kv, user) {
  await kv.put(`acct:${user.email}`, JSON.stringify(user));
  if (user.googleSub) await kv.put(`acctsub:${user.googleSub}`, user.email);
}

async function expectedClientId(env) {
  const fromEnv = String(env.GOOGLE_CLIENT_ID || '').trim();
  if (fromEnv) return fromEnv;
  if (!env.ADAM_KV) return '';
  return (await env.ADAM_KV.get('config:google-client-id')) || '';
}

async function googleCerts() {
  if (certCache.keys.length && Date.now() - certCache.at < 60 * 60 * 1000) return certCache.keys;
  const res = await fetch(GOOGLE_CERTS);
  if (!res.ok) throw new Error('Google certs unavailable');
  const data = await res.json();
  certCache = { at: Date.now(), keys: data.keys || [] };
  return certCache.keys;
}

async function createSession(kv, email) {
  const token = randomToken(32);
  const exp = Date.now() + SESSION_MS;
  await kv.put(`session:${token}`, JSON.stringify({ email, exp }), { expirationTtl: SESSION_TTL });
  return { token, exp };
}

async function sessionUser(kv, token) {
  const raw = token ? await kv.get(`session:${token}`) : null;
  if (!raw) return null;
  let row;
  try {
    row = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!row?.email || !row.exp || row.exp < Date.now()) {
    await kv.delete(`session:${token}`);
    return null;
  }
  return readUser(kv, row.email);
}

function pickSyncId(existing, requested) {
  if (existing && sanitizeSyncId(existing)) return existing;
  const req = sanitizeSyncId(requested);
  if (req) return req;
  return makeSyncId();
}

async function failCount(kv, email) {
  const raw = await kv.get(`login-fail:${email}`);
  if (!raw) return { count: 0, until: 0 };
  try {
    return JSON.parse(raw);
  } catch {
    return { count: 0, until: 0 };
  }
}

export async function handleAuth(request, env) {
  if (request.method === 'OPTIONS') return optionsResponse(METHODS);
  if (request.method === 'GET') {
    const googleClientId = await expectedClientId(env);
    return jsonResponse({
      googleClientId,
      storage: !!env.ADAM_KV
    }, 200, METHODS);
  }
  if (request.method !== 'POST') return jsonResponse({ error: 'GET or POST only' }, 405, METHODS);
  if (!env.ADAM_KV) {
    return jsonResponse({
      error: 'Account storage is not on the cloud yet. Chats still stay on this device.'
    }, 503, METHODS);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, METHODS);
  }

  try {
    const action = String(body.action || '');
    if (action === 'google') return await onGoogle(env, body);
    if (action === 'login') return await onLogin(env, body);
    if (action === 'set-password') return await onSetPassword(env, body);
    if (action === 'session') return await onSession(env, body);
    if (action === 'logout') return await onLogout(env, body);
    return jsonResponse({ error: 'Unknown account action' }, 400, METHODS);
  } catch {
    return jsonResponse({ error: 'Account sign-in failed. Try again.' }, 500, METHODS);
  }
}

async function onGoogle(env, body) {
  const keys = await googleCerts();
  const clientId = await expectedClientId(env);
  const checked = await verifyGoogleIdToken(body.credential, keys, { clientId });
  if (checked.error) return jsonResponse({ error: checked.error }, 401, METHODS);

  if (!clientId) await env.ADAM_KV.put('config:google-client-id', checked.aud);

  const bySub = await env.ADAM_KV.get(`acctsub:${checked.sub}`);
  let user = bySub ? await readUser(env.ADAM_KV, bySub) : null;
  if (!user) user = await readUser(env.ADAM_KV, checked.email);
  if (user?.googleSub && user.googleSub !== checked.sub) {
    return jsonResponse({ error: 'This email is already on a different Google account.' }, 409, METHODS);
  }

  const now = Date.now();
  if (!user) {
    user = {
      email: checked.email,
      name: checked.name,
      googleSub: checked.sub,
      passwordHash: '',
      passwordSalt: '',
      passwordIterations: 0,
      syncId: pickSyncId('', body.syncId),
      createdAt: now,
      updatedAt: now
    };
  } else {
    user.name = checked.name || user.name;
    user.googleSub = checked.sub;
    user.syncId = pickSyncId(user.syncId, body.syncId);
    user.updatedAt = now;
  }
  await writeUser(env.ADAM_KV, user);
  const session = await createSession(env.ADAM_KV, user.email);
  return jsonResponse({ ok: true, session: session.token, user: publicUser(user) }, 200, METHODS);
}

async function onLogin(env, body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  if (!email || passwordError(password)) {
    return jsonResponse({ error: 'Email or password is wrong.' }, 401, METHODS);
  }
  const fail = await failCount(env.ADAM_KV, email);
  if (fail.until > Date.now()) {
    return jsonResponse({ error: 'Too many tries. Wait a few minutes.' }, 429, METHODS);
  }
  const user = await readUser(env.ADAM_KV, email);
  const ok = user
    ? await verifyPassword(password, user.passwordSalt, user.passwordHash, user.passwordIterations)
    : false;
  if (!ok) {
    const next = { count: (fail.count || 0) + 1, until: 0 };
    if (next.count >= 8) {
      next.count = 0;
      next.until = Date.now() + LOCK_MS;
    }
    await env.ADAM_KV.put(`login-fail:${email}`, JSON.stringify(next), { expirationTtl: 3600 });
    return jsonResponse({ error: 'Email or password is wrong.' }, 401, METHODS);
  }
  await env.ADAM_KV.delete(`login-fail:${email}`);
  const session = await createSession(env.ADAM_KV, user.email);
  return jsonResponse({ ok: true, session: session.token, user: publicUser(user) }, 200, METHODS);
}

async function onSetPassword(env, body) {
  const user = await sessionUser(env.ADAM_KV, String(body.session || ''));
  if (!user) return jsonResponse({ error: 'Sign in again, then set the password.' }, 401, METHODS);
  const err = passwordError(body.password);
  if (err) return jsonResponse({ error: err }, 400, METHODS);
  if (user.passwordHash) {
    const currentOk = await verifyPassword(
      body.currentPassword,
      user.passwordSalt,
      user.passwordHash,
      user.passwordIterations
    );
    if (!currentOk) return jsonResponse({ error: 'Current password is wrong.' }, 401, METHODS);
  }
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  user.passwordSalt = bytesToB64(salt);
  user.passwordIterations = PBKDF2_ITERATIONS;
  user.passwordHash = await hashPassword(body.password, salt, PBKDF2_ITERATIONS);
  user.updatedAt = Date.now();
  await writeUser(env.ADAM_KV, user);
  return jsonResponse({ ok: true, user: publicUser(user) }, 200, METHODS);
}

async function onSession(env, body) {
  const user = await sessionUser(env.ADAM_KV, String(body.session || ''));
  if (!user) return jsonResponse({ error: 'Sign in again.' }, 401, METHODS);
  return jsonResponse({ ok: true, user: publicUser(user) }, 200, METHODS);
}

async function onLogout(env, body) {
  const token = String(body.session || '');
  if (token) await env.ADAM_KV.delete(`session:${token}`);
  return jsonResponse({ ok: true }, 200, METHODS);
}
