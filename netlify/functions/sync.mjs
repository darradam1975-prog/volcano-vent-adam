/**
 * Conversation sync — store JSON by user-chosen Sync ID (Netlify Blobs).
 */
import { connectLambda, getStore, setEnvironmentContext } from '@netlify/blobs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  try {
    const store = openStore(event);
    if (event.httpMethod === 'GET') {
      return await handleGet(event, store);
    }
    if (event.httpMethod === 'POST') {
      return await handlePost(event, store);
    }
    return json(405, { error: 'GET or POST only' });
  } catch (e) {
    const msg = String(e.message || e);
    if (/not been configured|MissingBlobsEnvironment/i.test(msg)) {
      return json(503, {
        error: 'Cloud sync storage is not available. Use Export / Import bundle in Settings instead.'
      });
    }
    return json(500, { error: msg });
  }
}

function wireBlobs(event) {
  if (!event?.blobs) return;
  try {
    const data = JSON.parse(Buffer.from(event.blobs, 'base64').toString('utf8'));
    setEnvironmentContext({
      deployID: event.headers?.['x-nf-deploy-id'] || event.headers?.['X-Nf-Deploy-Id'],
      siteID: event.headers?.['x-nf-site-id'] || event.headers?.['X-Nf-Site-Id'],
      token: data.token,
      edgeURL: data.url || data.edgeURL,
      apiURL: data.apiURL || data.api_url,
      uncachedEdgeURL: data.uncachedURL || data.uncachedEdgeURL || data.uncached_edge_url
    });
  } catch {
    connectLambda(event);
  }
}

function openStore(event) {
  wireBlobs(event);
  const siteID = event?.headers?.['x-nf-site-id'] || event?.headers?.['X-Nf-Site-Id']
    || process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  let token;
  try {
    if (event?.blobs) {
      const data = JSON.parse(Buffer.from(event.blobs, 'base64').toString('utf8'));
      token = data.token;
    }
  } catch { /* ignore */ }
  token = token || process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name: 'adam-conversations', siteID, token });
  }
  return getStore('adam-conversations');
}

async function readBlob(store, key) {
  for (const consistency of ['strong', 'eventual', undefined]) {
    try {
      const opts = consistency ? { consistency } : undefined;
      const raw = await store.get(key, opts);
      if (raw) return raw;
    } catch { /* try next */ }
  }
  return null;
}

async function handleGet(event, store) {
  const syncId = sanitizeSyncId(event.queryStringParameters?.syncId);
  if (!syncId) return json(400, { error: 'Missing syncId' });

  const raw = await readBlob(store, syncKey(syncId));
  if (!raw) return json(200, { data: null, updatedAt: null });

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json(500, { error: 'Corrupt sync data' });
  }
  return json(200, { data, updatedAt: data.updatedAt || null });
}

async function handlePost(event, store) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const syncId = sanitizeSyncId(body.syncId);
  if (!syncId) return json(400, { error: 'Invalid syncId' });
  if (!body.data?.conversations) return json(400, { error: 'Missing conversation data' });

  const incoming = {
    activeId: body.data.activeId || null,
    conversations: body.data.conversations.slice(0, 80),
    updatedAt: body.data.updatedAt || Date.now(),
    deletedConversationIds: body.data.deletedConversationIds || {}
  };

  const key = syncKey(syncId);
  const existingRaw = await readBlob(store, key);
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

  await store.set(key, JSON.stringify(payload));
  const verified = await readBlob(store, key);
  if (!verified) {
    return json(503, {
      error: 'Cloud save did not stick — use Export / Import bundle in Settings for now.'
    });
  }

  return json(200, {
    ok: true,
    updatedAt: payload.updatedAt,
    count: payload.conversations.length
  });
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

function sanitizeSyncId(id) {
  const s = String(id || '').trim().toLowerCase();
  if (s.length < 6 || s.length > 64) return null;
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s) && !/^[a-z0-9]{6,}$/.test(s)) return null;
  return s;
}

function syncKey(syncId) {
  return `sync:${syncId}`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  };
}