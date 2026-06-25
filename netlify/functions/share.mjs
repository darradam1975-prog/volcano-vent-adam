/**
 * Public conversation share links — anyone with the link can view (opt-in).
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
    if (event.httpMethod === 'DELETE') {
      return await handleDelete(event, store);
    }
    return json(405, { error: 'GET, POST, or DELETE only' });
  } catch (e) {
    const msg = String(e.message || e);
    if (/not been configured|MissingBlobsEnvironment/i.test(msg)) {
      return json(503, {
        error: 'Share links are not available right now — try again later.'
      });
    }
    return json(500, { error: msg });
  }
}

export function sanitizeShareId(id) {
  const s = String(id || '').trim().toLowerCase();
  if (s.length < 8 || s.length > 48) return null;
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s) && !/^[a-z0-9]{8,}$/.test(s)) return null;
  return s;
}

export function sanitizeSharePayload(conversation) {
  if (!conversation || !Array.isArray(conversation.messages) || !conversation.messages.length) {
    return null;
  }
  const messages = conversation.messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
    .slice(-200)
    .map(m => ({
      role: m.role,
      text: String(m.text || '').slice(0, 12000),
      source: m.role === 'assistant' ? String(m.source || '').slice(0, 80) : null,
      at: Number(m.at) || Date.now()
    }))
    .filter(m => m.text.trim().length > 0);

  if (!messages.length) return null;

  return {
    title: String(conversation.title || 'Volcano Vent chat').slice(0, 120),
    messages,
    messageCount: messages.length
  };
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
    return getStore({ name: 'adam-shares', siteID, token });
  }
  return getStore('adam-shares');
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
  const shareId = sanitizeShareId(event.queryStringParameters?.shareId || event.queryStringParameters?.s);
  if (!shareId) return json(400, { error: 'Missing shareId' });

  const raw = await readBlob(store, shareKey(shareId));
  if (!raw) return json(404, { error: 'Share link not found or expired' });

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json(500, { error: 'Corrupt share data' });
  }

  return json(200, {
    shareId,
    title: data.title,
    messages: data.messages,
    sharedAt: data.sharedAt,
    updatedAt: data.updatedAt
  });
}

async function handlePost(event, store) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const payload = sanitizeSharePayload(body.conversation);
  if (!payload) return json(400, { error: 'Conversation needs at least one message' });

  let shareId = sanitizeShareId(body.shareId);
  if (!shareId) {
    shareId = generateShareId();
  }

  const now = Date.now();
  const existingRaw = await readBlob(store, shareKey(shareId));
  let sharedAt = now;
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw);
      sharedAt = existing.sharedAt || now;
    } catch { /* fresh */ }
  }

  const record = {
    ...payload,
    shareId,
    sharedAt,
    updatedAt: now,
    v: 1
  };

  await store.set(shareKey(shareId), JSON.stringify(record));
  const verified = await readBlob(store, shareKey(shareId));
  if (!verified) {
    return json(503, { error: 'Share save did not stick — try again.' });
  }

  return json(200, {
    ok: true,
    shareId,
    url: publicSharePath(shareId),
    title: record.title,
    updatedAt: record.updatedAt
  });
}

async function handleDelete(event, store) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }
  const shareId = sanitizeShareId(body.shareId);
  if (!shareId) return json(400, { error: 'Invalid shareId' });

  try {
    await store.delete(shareKey(shareId));
  } catch { /* may already be gone */ }

  return json(200, { ok: true, shareId });
}

export function generateShareId() {
  const a = Math.random().toString(36).slice(2, 8);
  const b = Math.random().toString(36).slice(2, 8);
  const c = Date.now().toString(36).slice(-6);
  return sanitizeShareId(`vent-${c}-${a}${b}`) || `vent${Date.now().toString(36)}${a}`;
}

function shareKey(shareId) {
  return `share:${shareId}`;
}

function publicSharePath(shareId) {
  return `/s/${shareId}`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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