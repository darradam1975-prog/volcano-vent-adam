import { jsonResponse, optionsResponse } from './cors.mjs';

const METHODS = 'GET, POST, DELETE, OPTIONS';

export async function handleShare(request, env) {
  if (request.method === 'OPTIONS') return optionsResponse(METHODS);
  if (!env.ADAM_KV) {
    return jsonResponse({
      error: 'Share links are not available right now — try again later.'
    }, 503, METHODS);
  }

  if (request.method === 'GET') return handleGet(request, env);
  if (request.method === 'POST') return handlePost(request, env);
  if (request.method === 'DELETE') return handleDelete(request, env);
  return jsonResponse({ error: 'GET, POST, or DELETE only' }, 405, METHODS);
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

export function generateShareId() {
  const a = Math.random().toString(36).slice(2, 8);
  const b = Math.random().toString(36).slice(2, 8);
  const c = Date.now().toString(36).slice(-6);
  return sanitizeShareId(`vent-${c}-${a}${b}`) || `vent${Date.now().toString(36)}${a}`;
}

async function handleGet(request, env) {
  const url = new URL(request.url);
  const shareId = sanitizeShareId(url.searchParams.get('shareId') || url.searchParams.get('s'));
  if (!shareId) return jsonResponse({ error: 'Missing shareId' }, 400, METHODS);

  const raw = await env.ADAM_KV.get(shareKey(shareId));
  if (!raw) return jsonResponse({ error: 'Share link not found or expired' }, 404, METHODS);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: 'Corrupt share data' }, 500, METHODS);
  }

  return jsonResponse({
    shareId,
    title: data.title,
    messages: data.messages,
    sharedAt: data.sharedAt,
    updatedAt: data.updatedAt
  }, 200, METHODS);
}

async function handlePost(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, METHODS);
  }

  const payload = sanitizeSharePayload(body.conversation);
  if (!payload) return jsonResponse({ error: 'Conversation needs at least one message' }, 400, METHODS);

  let shareId = sanitizeShareId(body.shareId);
  if (!shareId) shareId = generateShareId();

  const now = Date.now();
  const existingRaw = await env.ADAM_KV.get(shareKey(shareId));
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

  await env.ADAM_KV.put(shareKey(shareId), JSON.stringify(record));
  const verified = await env.ADAM_KV.get(shareKey(shareId));
  if (!verified) {
    return jsonResponse({ error: 'Share save did not stick — try again.' }, 503, METHODS);
  }

  const siteBase = String(env.ADAM_SITE_BASE || '').replace(/\/$/, '');
  const url = siteBase
    ? `${siteBase}/share.html?s=${encodeURIComponent(shareId)}`
    : `/share.html?s=${encodeURIComponent(shareId)}`;

  return jsonResponse({
    ok: true,
    shareId,
    url,
    title: record.title,
    updatedAt: record.updatedAt
  }, 200, METHODS);
}

async function handleDelete(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, METHODS);
  }
  const shareId = sanitizeShareId(body.shareId);
  if (!shareId) return jsonResponse({ error: 'Invalid shareId' }, 400, METHODS);

  await env.ADAM_KV.delete(shareKey(shareId));
  return jsonResponse({ ok: true, shareId }, 200, METHODS);
}

function shareKey(shareId) {
  return `share:${shareId}`;
}