/**
 * Adam The Volcano Vent Bot — UI and chat wiring.
 */
let chatHistory = [];

function renderChatMessage(role, text, source, { persist = true, skipScroll = false } = {}) {
  const chat = document.getElementById('chat');
  if (!chat) return;

  const el = document.createElement('div');
  el.className = `message ${role}`;
  const body = document.createElement('div');
  body.className = 'message-body';
  body.innerHTML = formatMarkdown(text);
  el.appendChild(body);

  if (source && role === 'assistant') {
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = source;
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

function addMessage(role, text, source) {
  renderChatMessage(role, text, source, { persist: true });
}

if (typeof window !== 'undefined') {
  window.renderChatMessage = renderChatMessage;
  window.chatHistory = chatHistory;
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

  input.value = '';
  addMessage('user', text);

  const typing = document.getElementById('typing');
  if (typing) typing.classList.remove('hidden');

  try {
    const reply = typeof adam.respondAsync === 'function'
      ? await adam.respondAsync(text)
      : adam.respond(text);
    if (typing) typing.classList.add('hidden');
    addMessage('assistant', reply, ADAM_SOURCE);
  } catch {
    if (typing) typing.classList.add('hidden');
    addMessage('assistant', adam.respond(text), ADAM_SOURCE);
  }
}

function openSettings() {
  document.getElementById('settings-modal')?.classList.add('open');
  document.body.classList.add('modal-open');
  adamAgeVerifier.initSettingsPicker();
  adamLlmSettings?.initSettingsUi?.();
  adamConversations?._updateSyncHint?.();
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

  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      if (input) {
        input.value = chip.dataset.prompt || chip.textContent;
        sendMessage();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initApp);