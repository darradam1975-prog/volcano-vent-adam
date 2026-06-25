/**
 * Cloudflare Worker API base — enables GPT (and optional sync/share) on GitHub Pages.
 *
 * After deploying the worker (see cloudflare/README.md), paste your Worker URL here:
 *   https://volcano-vent-adam-api.<your-subdomain>.workers.dev
 *
 * Leave empty until deployed — rule-based Adam still works fully.
 */
const ADAM_CLOUD_API_BASE = 'https://volcano-vent-adam-api.darradam1975.workers.dev';

if (typeof globalThis !== 'undefined') {
  globalThis.ADAM_CLOUD_API_BASE = ADAM_CLOUD_API_BASE;
}