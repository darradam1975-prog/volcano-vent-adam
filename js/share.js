/**
 * Share conversation links — opt-in public read-only view (like ChatGPT share).
 */
const adamShare = {
  _lastUrl: '',

  endpoint() {
    if (typeof adamSite !== 'undefined' && !adamSite.hasCloudBackend) return null;
    if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
      return 'https://volcano-vent-adam.netlify.app/.netlify/functions/share';
    }
    return '/.netlify/functions/share';
  },

  siteOrigin() {
    if (typeof window === 'undefined') return 'https://darradam1975-prog.github.io/volcano-vent-adam';
    if (window.location?.protocol === 'file:') return 'http://localhost:8765';
    return window.location.origin;
  },

  buildShareUrl(shareId) {
    if (typeof window !== 'undefined' && typeof adamSite !== 'undefined') {
      return `${window.location.origin}${adamSite.shareViewUrl(shareId)}`;
    }
    return `${this.siteOrigin()}/s/${encodeURIComponent(shareId)}`;
  },

  readEndpoint() {
    if (this.endpoint()) return this.endpoint();
    return 'https://volcano-vent-adam.netlify.app/.netlify/functions/share';
  },

  conversationSnapshot(conv) {
    if (!conv?.messages?.length) return null;
    return {
      title: conv.title || 'Volcano Vent chat',
      messages: conv.messages.map(m => ({
        role: m.role,
        text: m.text,
        source: m.source,
        at: m.at
      }))
    };
  },

  async publishConversation(conv, { shareId } = {}) {
    const conversation = this.conversationSnapshot(conv);
    if (!conversation) throw new Error('Add at least one message before sharing.');
    const endpoint = this.endpoint();
    if (!endpoint) {
      throw new Error(typeof adamSite !== 'undefined'
        ? 'Public share links need the Netlify cloud backend. On GitHub Pages, use Export bundle in Settings to copy chats.'
        : 'Share cloud backend not available');
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ shareId: shareId || conv.shareId || null, conversation })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Share failed (${res.status})`);

    const url = data.url?.startsWith('http')
      ? data.url
      : `${this.siteOrigin()}${data.url || `/s/${data.shareId}`}`;

    return { ...data, url };
  },

  async revokeShare(shareId) {
    if (!shareId) return;
    await fetch(this.endpoint(), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId })
    }).catch(() => {});
  },

  async fetchShared(shareId) {
    const res = await fetch(
      `${this.readEndpoint()}?shareId=${encodeURIComponent(shareId)}&_=${Date.now()}`,
      { cache: 'no-store' }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Share not found (${res.status})`);
    return data;
  },

  socialTargets(url, title) {
    const u = encodeURIComponent(url);
    const text = encodeURIComponent(`${title} — Volcano Vent Dice chat with Adam The Volcano Vent Bot`);
    return {
      twitter: `https://twitter.com/intent/tweet?url=${u}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      reddit: `https://www.reddit.com/submit?url=${u}&title=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${u}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${text}%0A%0A${u}`
    };
  },

  async copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  },

  openModal() {
    document.getElementById('share-modal')?.classList.add('open');
    document.body.classList.add('modal-open');
  },

  closeModal() {
    document.getElementById('share-modal')?.classList.remove('open');
    document.body.classList.remove('modal-open');
  },

  setStatus(msg, isError) {
    const el = document.getElementById('share-status');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('share-status-error', !!isError);
    el.classList.toggle('hidden', !msg);
  },

  renderSocialButtons(url, title) {
    const wrap = document.getElementById('share-social');
    if (!wrap) return;
    const links = this.socialTargets(url, title);
    const items = [
      { id: 'native', label: 'Share…', href: null },
      { id: 'twitter', label: 'X / Twitter', href: links.twitter },
      { id: 'facebook', label: 'Facebook', href: links.facebook },
      { id: 'linkedin', label: 'LinkedIn', href: links.linkedin },
      { id: 'reddit', label: 'Reddit', href: links.reddit },
      { id: 'whatsapp', label: 'WhatsApp', href: links.whatsapp },
      { id: 'email', label: 'Email', href: links.email }
    ];
    wrap.innerHTML = '';
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'share-social-btn';
      btn.textContent = item.label;
      btn.addEventListener('click', async () => {
        if (item.id === 'native' && navigator.share) {
          try {
            await navigator.share({ title, text: `${title} — Volcano Vent Dice chat`, url });
          } catch { /* cancelled */ }
          return;
        }
        if (item.href) window.open(item.href, '_blank', 'noopener,noreferrer,width=600,height=520');
      });
      if (item.id === 'native' && !navigator.share) btn.classList.add('hidden');
      wrap.appendChild(btn);
    });
  },

  showShareResult({ url, title, shareId }) {
    this._lastUrl = url;
    const input = document.getElementById('share-url-input');
    if (input) {
      input.value = url;
      input.removeAttribute('readonly');
    }
    const revoke = document.getElementById('share-revoke-btn');
    if (revoke) {
      revoke.dataset.shareId = shareId || '';
      revoke.classList.remove('hidden');
    }
    this.renderSocialButtons(url, title);
    this.setStatus('Link ready — anyone with this link can view this chat (read-only).');
  },

  async shareActiveConversation() {
    const conv = typeof adamConversations !== 'undefined' ? adamConversations.getActive() : null;
    if (!conv?.messages?.length) {
      alert('Start a conversation first, then share.');
      return;
    }

    this.openModal();
    this.setStatus('Creating share link…');
    const input = document.getElementById('share-url-input');
    if (input) input.value = '';
    document.getElementById('share-revoke-btn')?.classList.add('hidden');

    const titleEl = document.getElementById('share-conv-title');
    if (titleEl) titleEl.textContent = conv.title || 'Volcano Vent chat';

    try {
      const result = await this.publishConversation(conv);
      conv.shareId = result.shareId;
      conv.shareUrl = result.url;
      conv.sharedAt = Date.now();
      adamConversations?._saveLocal?.({ skipCloud: false });

      this.showShareResult({
        url: result.url,
        title: result.title || conv.title,
        shareId: result.shareId
      });
    } catch (e) {
      this.setStatus(String(e.message || e), true);
    }
  },

  bindUi() {
    document.getElementById('share-conversation-btn')?.addEventListener('click', () => {
      this.shareActiveConversation();
    });
    document.getElementById('share-modal-close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('share-modal')?.addEventListener('click', e => {
      if (e.target.id === 'share-modal') this.closeModal();
    });
    document.getElementById('share-copy-btn')?.addEventListener('click', async () => {
      const url = document.getElementById('share-url-input')?.value || this._lastUrl;
      if (!url) return;
      try {
        await this.copyToClipboard(url);
        this.setStatus('Link copied — paste anywhere (Messages, Discord, email, social).');
      } catch {
        this.setStatus('Could not copy — select the link and copy manually.', true);
      }
    });
    document.getElementById('share-revoke-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('share-revoke-btn');
      const shareId = btn?.dataset?.shareId;
      if (!shareId) return;
      if (!confirm('Stop sharing? The link will stop working for everyone.')) return;
      await this.revokeShare(shareId);
      const conv = adamConversations?.getActive?.();
      if (conv) {
        delete conv.shareId;
        delete conv.shareUrl;
        delete conv.sharedAt;
        adamConversations?._saveLocal?.();
      }
      this.setStatus('Share link revoked.');
      if (btn) btn.classList.add('hidden');
      const input = document.getElementById('share-url-input');
      if (input) input.value = '';
      this._lastUrl = '';
    });
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.adamShare = adamShare;
}