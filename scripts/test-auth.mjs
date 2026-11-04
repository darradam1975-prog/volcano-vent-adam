/**
 * Account auth — password hash, Google token check, sync id shape.
 */
import { webcrypto } from 'crypto';
import {
  hashPassword,
  verifyPassword,
  passwordError,
  normalizeEmail,
  makeSyncId,
  verifyGoogleIdToken,
  bytesToB64,
  handleAuth
} from '../cloudflare/auth.mjs';
import { sanitizeSyncId } from '../cloudflare/sync.mjs';

if (!globalThis.crypto?.subtle) globalThis.crypto = webcrypto;

let passed = 0;
let failed = 0;

function check(name, ok) {
  if (ok) {
    console.log('OK', name);
    passed += 1;
  } else {
    console.log('FAIL', name);
    failed += 1;
  }
}

function b64url(text) {
  const bytes = typeof text === 'string' ? new TextEncoder().encode(text) : new Uint8Array(text);
  return bytesToB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

const salt = new Uint8Array(16);
crypto.getRandomValues(salt);
const hash = await hashPassword('vent-table-8', salt);
check('a password hash matches', await verifyPassword('vent-table-8', bytesToB64(salt), hash));
check('a wrong password does not match', !(await verifyPassword('vent-table-9', bytesToB64(salt), hash)));
check('a short password is refused', passwordError('short') === 'Password needs at least 8 characters.');
check('an email is normalized', normalizeEmail('  Adam@Volcano-Vent.com ') === 'adam@volcano-vent.com');
check('a bad email is empty', normalizeEmail('not-an-email') === '');
const syncId = makeSyncId();
check('an account sync id is safe to store', !!sanitizeSyncId(syncId));

const pair = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify']
);
const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
jwk.kid = 'test-key';
const now = Date.now();
const header = b64url(JSON.stringify({ alg: 'RS256', kid: 'test-key', typ: 'JWT' }));
const goodPayload = b64url(JSON.stringify({
  iss: 'https://accounts.google.com',
  aud: 'adam.apps.googleusercontent.com',
  exp: Math.floor(now / 1000) + 3600,
  email: 'player@example.com',
  email_verified: true,
  sub: 'google-sub-1',
  name: 'Player'
}));
const signingInput = new TextEncoder().encode(`${header}.${goodPayload}`);
const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, signingInput));
const token = `${header}.${goodPayload}.${b64url(sig)}`;
const checked = await verifyGoogleIdToken(token, [jwk], {
  clientId: 'adam.apps.googleusercontent.com',
  now
});
check('a Google token yields the email', checked.email === 'player@example.com' && checked.sub === 'google-sub-1');
const wrongApp = await verifyGoogleIdToken(token, [jwk], {
  clientId: 'other.apps.googleusercontent.com',
  now
});
check('a Google token for another app is refused', !!wrongApp.error);
const bad = await verifyGoogleIdToken(`${header}.${goodPayload}.aaaa`, [jwk], {
  clientId: 'adam.apps.googleusercontent.com',
  now
});
check('a tampered Google token is refused', !!bad.error);

function memoryKv() {
  const rows = new Map();
  return {
    async get(key) { return rows.has(key) ? rows.get(key) : null; },
    async put(key, value) { rows.set(key, String(value)); },
    async delete(key) { rows.delete(key); }
  };
}

function post(body) {
  return new Request('https://example.com/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

const kv = memoryKv();
const env = { ADAM_KV: kv, GOOGLE_CLIENT_ID: '' };
const email = 'player@example.com';
const saltB64 = bytesToB64(salt);
await kv.put(`acct:${email}`, JSON.stringify({
  email,
  name: 'Player',
  googleSub: 'google-sub-1',
  passwordHash: hash,
  passwordSalt: saltB64,
  passwordIterations: 15000,
  syncId,
  createdAt: 1,
  updatedAt: 1
}));
const login = await handleAuth(post({ action: 'login', email, password: 'vent-table-8' }), env);
const loginBody = await login.json();
check('a password sign-in returns a session', login.status === 200 && loginBody.session && loginBody.user.syncId === syncId);
const wrong = await handleAuth(post({ action: 'login', email, password: 'nope-nope' }), env);
check('a wrong password is refused', wrong.status === 401);
const setPw = await handleAuth(post({
  action: 'set-password',
  session: loginBody.session,
  currentPassword: 'vent-table-8',
  password: 'new-table-8'
}), env);
check('a signed-in player can change the password', setPw.status === 200 && (await setPw.json()).user.hasPassword === true);
const relog = await handleAuth(post({ action: 'login', email, password: 'new-table-8' }), env);
check('the new password signs in', relog.status === 200);

console.log(`\nPassed ${passed} / ${passed + failed}`);
if (failed) process.exit(1);
