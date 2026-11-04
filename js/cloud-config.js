/**
 * Cloudflare Worker API base — enables GPT (and optional sync/share) on GitHub Pages.
 *
 * After deploying the worker (see cloudflare/README.md), paste your Worker URL here:
 *   https://volcano-vent-adam-api.<your-subdomain>.workers.dev
 *
 * Leave empty until deployed — rule-based Adam still works fully.
 */
const ADAM_CLOUD_API_BASE = 'https://volcano-vent-adam-api.darradam1975.workers.dev';

/**
 * Google OAuth Web client ID. Public. Leave empty until you create one.
 * Same value can be set on the worker as GOOGLE_CLIENT_ID.
 */
const ADAM_GOOGLE_CLIENT_ID = '';

if (typeof globalThis !== 'undefined') {
  globalThis.ADAM_CLOUD_API_BASE = ADAM_CLOUD_API_BASE;
  globalThis.ADAM_GOOGLE_CLIENT_ID = ADAM_GOOGLE_CLIENT_ID;
}