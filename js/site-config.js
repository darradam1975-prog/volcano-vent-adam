/**
 * Hosting detection — GitHub Pages vs Netlify (cloud features).
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

  /** OpenAI proxy, cloud sync, public share links */
  get hasCloudBackend() {
    return this.isNetlify;
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
    if (this.isGitHubPages) {
      return 'Cloud features (GPT proxy, sync, share links) are not on GitHub Pages. Rule-based Adam works fully. Run locally with preview.bat / npm start — or use the rule-based bot here.';
    }
    return 'Cloud backend unavailable — rule-based bot still works. Use Export / Import for sync.';
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.adamSite = adamSite;
}