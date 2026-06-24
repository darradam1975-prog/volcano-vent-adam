/**
 * Optional OpenAI / GPT settings — API key stays on this device only.
 */
const ADAM_LLM_KEY = 'adam-llm-settings';
const ADAM_GPT_SETUP_INTRO_KEY = 'adam-gpt-setup-intro-v1';

const ADAM_GPT_MODELS = [
  { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini (recommended — fast & smart)', group: 'Latest' },
  { id: 'gpt-5.4-nano', label: 'GPT-5.4 nano (cheapest)', group: 'Latest' },
  { id: 'gpt-5.4', label: 'GPT-5.4', group: 'Latest' },
  { id: 'gpt-5.5', label: 'GPT-5.5 (best quality)', group: 'Latest' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', group: 'Standard' },
  { id: 'gpt-4o', label: 'GPT-4o', group: 'Standard' },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini', group: 'Standard' },
  { id: 'gpt-4.1', label: 'GPT-4.1', group: 'Standard' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', group: 'Legacy' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', group: 'Legacy' },
  { id: 'o3-mini', label: 'o3-mini (reasoning)', group: 'Reasoning' },
  { id: 'custom', label: 'Other — type model ID below', group: 'Custom' }
];

const ADAM_GPT_TEST_FALLBACKS = ['gpt-5.4-mini', 'gpt-4o-mini', 'gpt-4o'];

const adamLlmSettings = {
  get() {
    try {
      const raw = localStorage.getItem(ADAM_LLM_KEY);
      if (!raw) return this.defaults();
      return { ...this.defaults(), ...JSON.parse(raw) };
    } catch {
      return this.defaults();
    }
  },

  defaults() {
    return {
      enabled: false,
      model: 'gpt-5.4-mini',
      customModel: '',
      apiKey: ''
    };
  },

  save(partial) {
    const prev = this.get();
    const next = { ...prev, ...partial };
    const key = String(next.apiKey || '').trim();
    let enabled = !!next.enabled;
    if (key.length > 10 && this.validateKey(key) === null && !prev.apiKey) {
      enabled = true;
    }
    localStorage.setItem(ADAM_LLM_KEY, JSON.stringify({
      enabled,
      model: next.model || 'gpt-5.4-mini',
      customModel: String(next.customModel || '').trim(),
      apiKey: key
    }));
    return this.get();
  },

  clearKey() {
    const s = this.get();
    s.apiKey = '';
    return this.save(s);
  },

  resolveModel(partial) {
    const s = { ...this.get(), ...partial };
    if (s.model === 'custom') {
      const custom = String(s.customModel || '').trim();
      return custom || 'gpt-4o-mini';
    }
    return s.model || 'gpt-5.4-mini';
  },

  isUsable() {
    const s = this.get();
    return s.enabled && s.apiKey.length > 10;
  },

  needsSetup() {
    return !this.isUsable();
  },

  setupGuideShort() {
    return '**Want GPT plain-English?** Tap **Settings ⚙️** or say **"setup GPT"** for step-by-step **API key + billing credits**.';
  },

  /** Compact copy for Settings panel (plain text lines). */
  setupGuideMiniLines() {
    return [
      'Sign in at platform.openai.com',
      'Add billing credits (pay-as-you-go)',
      'Create API key (sk-…) at API keys page',
      'Paste key here → pick model → Test → Save',
      'Turn on “Use GPT for plain-English answers”'
    ];
  },

  renderSetupMiniHtml() {
    const links = [
      '<a href="https://platform.openai.com" target="_blank" rel="noopener">Sign in</a>',
      '<a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener">Add billing credits</a> (pay-as-you-go)',
      'Create <strong>sk-</strong> key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">API keys</a>',
      'Paste below → pick model → <strong>Test connection</strong> → <strong>Save</strong>',
      'Turn on <strong>Use GPT</strong> above'
    ];
    return (
      '<p class="settings-setup-mini-title"><strong>Quick GPT setup</strong></p>'
      + '<ol class="settings-setup-mini">'
      + links.map((line, i) => `<li>${line}</li>`).join('')
      + '</ol>'
    );
  },

  setupGuideFull() {
    return (
      '**How to set up GPT (optional)** — your key stays on this device only.\n\n'
      + '1. **Sign in** at [platform.openai.com](https://platform.openai.com) (create an account if needed).\n'
      + '2. **Add billing credits** at [platform.openai.com/account/billing](https://platform.openai.com/account/billing) — GPT uses a small **pay-as-you-go** balance (not the same as free ChatGPT).\n'
      + '3. **Create an API key** at [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → **Create secret key** (must start with **sk-**).\n'
      + '4. In this app, tap **Settings ⚙️** → scroll to **GPT (optional)**.\n'
      + '5. Pick a model — **GPT-5.4 mini** is recommended (fast and low cost).\n'
      + '6. Paste your **sk-** key → **Test connection** → **Save GPT settings**.\n'
      + '7. Turn on **Use GPT for plain-English answers**.\n\n'
      + 'Without GPT, the rule-based guide still works. Chats are **never shared with other users**.'
    );
  },

  hasShownSetupIntro() {
    try {
      return localStorage.getItem(ADAM_GPT_SETUP_INTRO_KEY) === '1';
    } catch {
      return false;
    }
  },

  markSetupIntroShown() {
    try {
      localStorage.setItem(ADAM_GPT_SETUP_INTRO_KEY, '1');
    } catch { /* ignore */ }
  },

  modelLabel(id) {
    if (id === 'custom') {
      const custom = this.get().customModel;
      return custom ? `Custom (${custom})` : 'Custom model';
    }
    return ADAM_GPT_MODELS.find(m => m.id === id)?.label || id;
  },

  validateKey(key) {
    const k = String(key || '').trim();
    if (k.length < 10) return 'Paste your full OpenAI API key (starts with sk-…).';
    if (/^xai-/i.test(k)) {
      return 'That is a Grok/xAI key — Adam needs OpenAI from platform.openai.com/api-keys';
    }
    if (!/^sk-/i.test(k)) {
      return 'OpenAI keys start with sk- — not a ChatGPT login password.';
    }
    return null;
  },

  populateModelSelect() {
    const sel = document.getElementById('llm-model');
    if (!sel || sel.dataset.populated === '1') return;
    const groups = [...new Set(ADAM_GPT_MODELS.map(m => m.group))];
    sel.innerHTML = '';
    groups.forEach(group => {
      const og = document.createElement('optgroup');
      og.label = group;
      ADAM_GPT_MODELS.filter(m => m.group === group).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.label;
        og.appendChild(opt);
      });
      sel.appendChild(og);
    });
    sel.dataset.populated = '1';
  },

  syncCustomModelVisibility() {
    const wrap = document.getElementById('llm-custom-model-wrap');
    const isCustom = document.getElementById('llm-model')?.value === 'custom';
    if (wrap) wrap.classList.toggle('hidden', !isCustom);
  },

  readForm() {
    return {
      enabled: !!document.getElementById('llm-enabled')?.checked,
      model: document.getElementById('llm-model')?.value || 'gpt-5.4-mini',
      customModel: document.getElementById('llm-model-custom')?.value?.trim() || '',
      apiKey: document.getElementById('llm-api-key')?.value?.trim() || ''
    };
  },

  saveFromForm() {
    const err = document.getElementById('settings-llm-error');
    const form = this.readForm();
    if (form.enabled) {
      const keyErr = this.validateKey(form.apiKey);
      if (keyErr) {
        if (err) {
          err.textContent = keyErr;
          err.classList.remove('hidden');
        }
        return { saved: false, error: keyErr };
      }
      if (form.model === 'custom' && !form.customModel) {
        const msg = 'Type a model ID (e.g. gpt-5.4-mini) or pick a preset.';
        if (err) {
          err.textContent = msg;
          err.classList.remove('hidden');
        }
        return { saved: false, error: msg };
      }
    }
    if (err) err.classList.add('hidden');
    this.save(form);
    this.initSettingsUi();
    return { saved: true };
  },

  initSettingsUi() {
    this.populateModelSelect();
    const s = this.get();
    const en = document.getElementById('llm-enabled');
    const model = document.getElementById('llm-model');
    const custom = document.getElementById('llm-model-custom');
    const key = document.getElementById('llm-api-key');
    const status = document.getElementById('llm-status');
    if (en) en.checked = s.enabled;
    if (model) {
      const known = ADAM_GPT_MODELS.some(m => m.id === s.model);
      model.value = known ? s.model : 'custom';
    }
    if (custom) custom.value = s.customModel || (ADAM_GPT_MODELS.some(m => m.id === s.model) ? '' : s.model);
    if (key) key.value = s.apiKey;
    this.syncCustomModelVisibility();
    const mini = document.getElementById('llm-setup-mini');
    const steps = document.getElementById('llm-setup-steps');
    const showSetup = !this.isUsable();
    if (mini) {
      mini.innerHTML = showSetup ? this.renderSetupMiniHtml() : '';
      mini.classList.toggle('hidden', !showSetup);
    }
    if (steps) steps.classList.toggle('hidden', true);
    if (status) {
      if (!s.apiKey) {
        status.textContent = 'GPT not set up — follow the steps below: sign in at OpenAI, add billing credits, create an sk- key, then Test connection and Save.';
      } else if (s.enabled) {
        status.textContent = `GPT on: ${this.modelLabel(s.model === 'custom' ? 'custom' : s.model)}. Falls back to rules if the API fails.`;
      } else {
        status.textContent = 'API key saved — turn on GPT, Test connection, then Save GPT settings.';
      }
    }
  },

  bindSettingsUi() {
    document.getElementById('llm-model')?.addEventListener('change', () => this.syncCustomModelVisibility());

    document.getElementById('settings-save-llm')?.addEventListener('click', () => {
      const err = document.getElementById('settings-llm-error');
      const form = this.readForm();
      const keyErr = form.enabled ? this.validateKey(form.apiKey) : null;
      if (keyErr) {
        if (err) {
          err.textContent = keyErr;
          err.classList.remove('hidden');
        }
        return;
      }
      if (form.model === 'custom' && !form.customModel) {
        if (err) {
          err.textContent = 'Type a model ID (e.g. gpt-5.4-mini) or pick a preset.';
          err.classList.remove('hidden');
        }
        return;
      }
      if (err) err.classList.add('hidden');
      this.save(form);
      this.initSettingsUi();
    });

    document.getElementById('settings-test-llm')?.addEventListener('click', async () => {
      const err = document.getElementById('settings-llm-error');
      const status = document.getElementById('llm-status');
      const form = this.readForm();
      const keyErr = this.validateKey(form.apiKey);
      if (keyErr) {
        if (err) {
          err.textContent = keyErr;
          err.classList.remove('hidden');
        }
        return;
      }
      if (form.model === 'custom' && !form.customModel) {
        if (err) {
          err.textContent = 'Type a model ID or pick a preset from the list.';
          err.classList.remove('hidden');
        }
        return;
      }
      if (err) err.classList.add('hidden');
      if (status) status.textContent = 'Testing GPT connection…';
      const btn = document.getElementById('settings-test-llm');
      if (btn) btn.disabled = true;
      try {
        if (typeof adamLlm?.testConnection !== 'function') throw new Error('GPT module not loaded');
        const result = await adamLlm.testConnection(form);
        const label = this.modelLabel(result.modelUsed === form.customModel ? 'custom' : form.model);
        if (status) {
          status.textContent = `GPT connected — ${label} (${result.api || 'openai'}). Reply: "${(result.reply || 'OK').slice(0, 50)}". Now click Save.`;
        }
      } catch (e) {
        const msg = typeof adamLlm?._friendlyError === 'function'
          ? adamLlm._friendlyError(e)
          : String(e?.message || e);
        if (status) status.textContent = `GPT test failed — ${msg}`;
        if (err) {
          err.textContent = msg;
          err.classList.remove('hidden');
        }
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    document.getElementById('settings-clear-llm-key')?.addEventListener('click', () => {
      this.clearKey();
      const keyEl = document.getElementById('llm-api-key');
      if (keyEl) keyEl.value = '';
      this.initSettingsUi();
    });
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.ADAM_GPT_SETUP_INTRO_KEY = ADAM_GPT_SETUP_INTRO_KEY;
  globalThis.ADAM_GPT_MODELS = ADAM_GPT_MODELS;
  globalThis.ADAM_GPT_TEST_FALLBACKS = ADAM_GPT_TEST_FALLBACKS;
  globalThis.adamLlmSettings = adamLlmSettings;
}