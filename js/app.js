/**
 * Adam The Volcano Vent Bot — UI and chat wiring.
 */
let chatHistory = [];

function renderChatMessage(role, text, source, { persist = true, skipScroll = false } = {}) {
  const chat = document.getElementById('chat');
  if (!chat) return;

  const el = document.createElement('div');
  el.className = `message ${role}`;

  if (role === 'assistant') {
    const who = document.createElement('div');
    who.className = 'message-who';
    who.textContent = 'Adam';
    el.appendChild(who);
  }

  const body = document.createElement('div');
  body.className = 'message-body';
  body.innerHTML = formatMarkdown(text);
  el.appendChild(body);

  const note = messageSourceNote(source);
  if (note && role === 'assistant') {
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = note;
    el.appendChild(meta);
  }

  const anchor = document.getElementById('chat-scroll-anchor');
  if (anchor) {
    chat.insertBefore(el, anchor);
  } else {
    chat.appendChild(el);
  }
  if (!skipScroll) {
    if (typeof adamChatScroll !== 'undefined') {
      adamChatScroll.scrollToLatest();
    } else {
      chat.scrollTop = Math.max(0, chat.scrollHeight - chat.clientHeight);
    }
  }
  chatHistory.push({ role, text, source });

  if (persist && typeof adamConversations !== 'undefined') {
    adamConversations.appendMessage(role, text, source);
  }

  if (role === 'assistant' && persist) {
    adamVoice.speak(text);
  }
}

function messageSourceNote(source) {
  const s = String(source || '');
  if (!s) return '';
  if (/gpt/i.test(s) && !/Adam The Volcano Vent Bot/i.test(s)) return s;
  return '';
}

const ADAM_DEFAULT_PROMPTS = [
  ['Teach me', 'Teach me'],
  ['Rules', 'Full rules'],
  ['Scoring', 'How does scoring work?'],
  ['The Vent', 'What happens on the Vent?'],
  ['Lucky charm', 'What is a lucky charm?'],
  ['Beads', 'How do beads work?']
];

function renderPromptChips() {
  const row = document.getElementById('quick-chips');
  if (!row) return;
  const teaching = typeof adam !== 'undefined' && adam.teachMode;
  const items = teaching && typeof VOLCANO_VENT_TEACH !== 'undefined'
    ? [
      ['Stop', 'stop teach'],
      ...VOLCANO_VENT_TEACH.categories.map(c => [c.label, c.starters[0]])
    ]
    : ADAM_DEFAULT_PROMPTS;

  row.replaceChildren();
  if (teaching) {
    const mode = document.createElement('span');
    mode.className = 'chip-mode';
    mode.textContent = 'Teach';
    row.appendChild(mode);
  }
  items.forEach(([label, prompt]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = teaching ? 'quick-chip quick-chip-teach' : 'quick-chip';
    btn.dataset.prompt = prompt;
    btn.textContent = label;
    btn.addEventListener('click', () => askPrompt(prompt));
    row.appendChild(btn);
  });
}

function askPrompt(prompt) {
  const input = document.getElementById('chat-input');
  if (!input || !prompt) return;
  input.value = prompt;
  sendMessage();
}

function addMessage(role, text, source) {
  renderChatMessage(role, text, source, { persist: true });
}

function showVoiceDraft(text) {
  const chat = document.getElementById('chat');
  if (!chat) return;
  const clean = String(text || '').trim();
  let el = document.getElementById('voice-draft');
  if (!clean) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('div');
    el.id = 'voice-draft';
    el.className = 'message user voice-draft';
    const body = document.createElement('div');
    body.className = 'message-body';
    el.appendChild(body);
    const anchor = document.getElementById('chat-scroll-anchor');
    if (anchor) chat.insertBefore(el, anchor);
    else chat.appendChild(el);
  }
  const body = el.querySelector('.message-body');
  if (body) body.textContent = clean;
  if (typeof adamChatScroll !== 'undefined') adamChatScroll.scrollToLatest({ force: true });
}

function clearVoiceDraft() {
  document.getElementById('voice-draft')?.remove();
}

if (typeof window !== 'undefined') {
  window.renderChatMessage = renderChatMessage;
  window.chatHistory = chatHistory;
  window.showVoiceDraft = showVoiceDraft;
  window.clearVoiceDraft = clearVoiceDraft;
}

function formatMarkdown(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input?.value?.trim();
  if (!text) return;

  const fromVoice = typeof adamVoice !== 'undefined'
    && (adamVoice._session || adamVoice._phase === 'thinking' || adamVoice._phase === 'speaking');
  const turn = typeof adamVoice !== 'undefined' ? (adamVoice._replyTurn || 0) : 0;
  const stillThisTurn = () => typeof adamVoice === 'undefined' || (adamVoice._replyTurn || 0) === turn;

  input.value = '';
  clearVoiceDraft();
  addMessage('user', text);
  if (fromVoice && typeof adamChatScroll !== 'undefined') adamChatScroll.scrollToLatest({ force: true });

  const typing = document.getElementById('typing');
  if (typing) typing.classList.remove('hidden');

  try {
    const reply = typeof adam.respondAsync === 'function'
      ? await adam.respondAsync(text)
      : adam.respond(text);
    if (!stillThisTurn()) {
      if (typing) typing.classList.add('hidden');
      return;
    }
    if (typing) typing.classList.add('hidden');
    addMessage('assistant', reply, ADAM_SOURCE);
  } catch {
    if (!stillThisTurn()) {
      if (typing) typing.classList.add('hidden');
      return;
    }
    if (typing) typing.classList.add('hidden');
    addMessage('assistant', adam.respond(text), ADAM_SOURCE);
  }
  if (fromVoice && typeof adamChatScroll !== 'undefined') adamChatScroll.scrollToLatest({ force: true });
  renderPromptChips();
}

function openSettings() {
  document.getElementById('settings-modal')?.classList.add('open');
  document.body.classList.add('modal-open');
  adamAgeVerifier.initSettingsPicker();
  adamLlmSettings?.initSettingsUi?.();
  adamConversations?._updateSyncHint?.();
  adamVoice?.refreshVoices?.();
}

function closeSettings() {
  document.getElementById('settings-modal')?.classList.remove('open');
  document.body.classList.remove('modal-open');
  const status = document.getElementById('settings-save-all-status');
  if (status) {
    status.textContent = '';
    status.classList.add('hidden');
  }
}

async function saveAllSettingsAndClose() {
  const btn = document.getElementById('settings-save-all');
  const status = document.getElementById('settings-save-all-status');
  if (btn) btn.disabled = true;
  if (status) {
    status.textContent = 'Saving…';
    status.classList.remove('hidden');
  }

  const saved = [];

  try {
    adamVoice?.saveFromForm?.();
    saved.push('voice');

    const birthday = adamAgeVerifier?.saveBirthdayFromForm?.({ announce: false });
    if (birthday?.saved) saved.push('birthday');
    if (birthday?.error) throw new Error(birthday.error);

    const llm = adamLlmSettings?.saveFromForm?.();
    if (llm?.saved) saved.push('GPT');
    if (llm?.error) throw new Error(llm.error);

    const syncInput = document.getElementById('sync-id-input')?.value?.trim();
    if (syncInput && syncInput.length >= 6) {
      await adamConversations?.saveSyncIdAndSync?.(syncInput);
      saved.push('sync');
    } else if (adamConversations?.getSyncId?.()) {
      await adamConversations?.syncFull?.();
      saved.push('sync');
    }

    if (status) {
      status.textContent = `Saved ${saved.join(', ')}`;
    }
    closeSettings();
  } catch (e) {
    if (status) {
      status.textContent = String(e.message || e);
      status.classList.remove('hidden');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function initApp() {
  initAdamAgeVerifier();
  adamVoice.init();
  adamLlmSettings?.initSettingsUi?.();
  adamLlmSettings?.bindSettingsUi?.();
  adamChatScroll?.init?.();
  adamConversations?.init?.();
  adamShare?.bindUi?.();

  document.getElementById('send-btn')?.addEventListener('click', sendMessage);
  document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  document.getElementById('settings-btn')?.addEventListener('click', openSettings);
  document.getElementById('settings-close')?.addEventListener('click', closeSettings);
  document.getElementById('settings-save-all')?.addEventListener('click', () => {
    saveAllSettingsAndClose();
  });
  document.getElementById('settings-modal')?.addEventListener('click', e => {
    if (e.target.id === 'settings-modal') closeSettings();
  });

  renderPromptChips();
}

document.addEventListener('DOMContentLoaded', initApp);