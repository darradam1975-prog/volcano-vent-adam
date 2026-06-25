import { jsonResponse, optionsResponse } from './cors.mjs';

const METHODS = 'GET, POST, OPTIONS';

export async function handleSync(request, env) {
  if (request.method === 'OPTIONS') return optionsResponse(METHODS);
  if (!env.ADAM_KV) {
    return jsonResponse({
      error: 'Cloud sync storage is not available. Use Export / Import bundle in Settings instead.'
    }, 503, METHODS);
  }

  if (request.method === 'GET') return handleGet(request, env);
  if (request.method === 'POST') return handlePost(request, env);
  return jsonResponse({ error: 'GET or POST only' }, 405, METHODS);
}

async function handleGet(request, env) {
  const url = new URL(request.url);
  const syncId = sanitizeSyncId(url.searchParams.get('syncId'));
  if (!syncId) return jsonResponse({ error: 'Missing syncId' }, 400, METHODS);

  const raw = await env.ADAM_KV.get(syncKey(syncId));
  if (!raw) return jsonResponse({ data: null, updatedAt: null }, 200, METHODS);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: 'Corrupt sync data' }, 500, METHODS);
  }
  return jsonResponse({ data, updatedAt: data.updatedAt || null }, 200, METHODS);
}

async function handlePost(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, METHODS);
  }

  const syncId = sanitizeSyncId(body.syncId);
  if (!syncId) return jsonResponse({ error: 'Invalid syncId' }, 400, METHODS);
  if (!body.data?.conversations) return jsonResponse({ error: 'Missing conversation data' }, 400, METHODS);

  const incoming = {
    activeId: body.data.activeId || null,
    conversations: body.data.conversations.slice(0, 80),
    updatedAt: body.data.updatedAt || Date.now(),
    deletedConversationIds: body.data.deletedConversationIds || {}
  };

  const key = syncKey(syncId);
  const existingRaw = await env.ADAM_KV.get(key);
  let payload = incoming;
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw);
      const tombstones = mergeDeletedIds(
        existing.deletedConversationIds,
        incoming.deletedConversationIds
      );
      payload = {
        activeId: incoming.activeId || existing.activeId || null,
        conversations: mergeConversations(existing.conversations, incoming.conversations, tombstones),
        updatedAt: Math.max(existing.updatedAt || 0, incoming.updatedAt || 0, Date.now()),
        deletedConversationIds: tombstones
      };
    } catch { /* use incoming */ }
  } else {
    payload.updatedAt = Date.now();
  }

  await env.ADAM_KV.put(key, JSON.stringify(payload));
  const verified = await env.ADAM_KV.get(key);
  if (!verified) {
    return jsonResponse({
      error: 'Cloud save did not stick — use Export / Import bundle in Settings for now.'
    }, 503, METHODS);
  }

  return jsonResponse({
    ok: true,
    updatedAt: payload.updatedAt,
    count: payload.conversations.length
  }, 200, METHODS);
}

function mergeMessages(a = [], b = []) {
  const seen = new Set();
  const out = [];
  [...a, ...b]
    .sort((x, y) => (x.at || 0) - (y.at || 0))
    .forEach(m => {
      const k = `${m.at || 0}|${m.role}|${String(m.text || '').slice(0, 300)}`;
      if (seen.has(k)) return;
      seen.add(k);
      out.push(m);
    });
  return out.slice(-200);
}

function mergeConversationPair(a, b) {
  if (!a) return b;
  if (!b) return a;
  const messages = mergeMessages(a.messages, b.messages);
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
}

function mergeDeletedIds(a = {}, b = {}) {
  const out = { ...a };
  Object.entries(b).forEach(([id, ts]) => {
    out[id] = Math.max(out[id] || 0, Number(ts) || 0);
  });
  return out;
}

function mergeConversations(a = [], b = [], tombstones = {}) {
  const byId = new Map();
  [...a, ...b].forEach(c => {
    if (!c?.id || tombstones[c.id]) return;
    byId.set(c.id, mergeConversationPair(byId.get(c.id), c));
  });
  return [...byId.values()].sort((x, y) => (y.updatedAt || 0) - (x.updatedAt || 0)).slice(0, 80);
}

export function sanitizeSyncId(id) {
  const s = String(id || '').trim().toLowerCase();
  if (s.length < 6 || s.length > 64) return null;
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s) && !/^[a-z0-9]{6,}$/.test(s)) return null;
  return s;
}

function syncKey(syncId) {
  return `sync:${syncId}`;
}