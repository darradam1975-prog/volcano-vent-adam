/**
 * Hosting detection — GitHub Pages + optional Cloudflare Worker API.
 */
const adamSite = {
  get basePath() {
    if (typeof window === 'undefined') return '/';
    const { hostname, pathname } = window.location;
    if (hostname.endsWith('github.io')) {
      const seg = pathname.split('/').filter(Boolean)[0];
      if (seg && seg !== 's' && seg !== 'share.html') return `/${seg}/`;
    }
    return '/';
  },

  get isGitHubPages() {
    return typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
  },

  get isNetlify() {
    return typeof window !== 'undefined' && /netlify\.app$/i.test(window.location.hostname);
  },

  /** Worker base URL from js/cloud-config.js (no trailing slash). */
  get cloudApiBase() {
    const fromConfig = typeof ADAM_CLOUD_API_BASE !== 'undefined'
      ? String(ADAM_CLOUD_API_BASE || '').trim()
      : '';
    if (fromConfig) return fromConfig.replace(/\/$/, '');
    return '';
  },

  /** OpenAI proxy, cloud sync, public share links */
  get hasCloudBackend() {
    return this.isNetlify || !!this.cloudApiBase;
  },

  /**
   * Backend route for chat | sync | share.
   * Netlify: same-origin /.netlify/functions/{name}
   * GitHub Pages + Worker: {ADAM_CLOUD_API_BASE}/{name}
   */
  functionUrl(name) {
    const fn = String(name || '').replace(/^\//, '');
    if (!fn) return null;
    if (this.isNetlify) return `/.netlify/functions/${fn}`;
    const base = this.cloudApiBase;
    if (!base) return null;
    return `${base}/${fn}`;
  },

  homeUrl() {
    const base = this.basePath;
    return base.endsWith('/') ? base : `${base}/`;
  },

  shareViewUrl(shareId) {
    const id = encodeURIComponent(shareId || '');
    if (this.isNetlify) return `${this.homeUrl()}s/${id}`;
    return `${this.homeUrl()}share.html?s=${id}`;
  },

  cloudUnavailableMessage() {
    if (this.isGitHubPages && !this.cloudApiBase) {
      return 'GPT needs the Cloudflare Worker API — set ADAM_CLOUD_API_BASE in js/cloud-config.js (see cloudflare/README.md). Rule-based Adam works fully without it.';
    }
    if (this.isGitHubPages) {
      return 'Cloud API unreachable — check ADAM_CLOUD_API_BASE in js/cloud-config.js. Rule-based Adam still works.';
    }
    return 'Cloud backend unavailable — rule-based bot still works. Use Export / Import for sync.';
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.adamSite = adamSite;
}