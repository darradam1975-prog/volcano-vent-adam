/**
 * Adam cloud API — OpenAI proxy + optional sync/share (Cloudflare KV).
 * GitHub Pages hosts the UI; this Worker is the backend.
 */
import { handleChat } from './chat.mjs';
import { handleSync } from './sync.mjs';
import { handleShare } from './share.mjs';
import { jsonResponse } from './cors.mjs';

const ROUTES = {
  chat: handleChat,
  sync: handleSync,
  share: handleShare
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const route = parts[parts.length - 1] || '';

    if (route === 'health') {
      return jsonResponse({
        ok: true,
        service: 'volcano-vent-adam-api',
        kv: !!env.ADAM_KV
      });
    }

    const handler = ROUTES[route];
    if (!handler) {
      return jsonResponse({
        error: 'Not found — use /chat, /sync, or /share',
        routes: Object.keys(ROUTES)
      }, 404);
    }

    return handler(request, env);
  }
};