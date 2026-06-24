/**
 * Age verification — birthday saved on this device only.
 * Must be 18+ to discuss pretend bets with buttons and beads.
 */
const ADAM_BIRTHDAY_KEY = 'adam-birthday';
const ADAM_AGE_VERIFIED_KEY = 'adam-age-verified';
const ADAM_MIN_BET_AGE = 18;
const ADAM_MAX_AGE = 120;

const ADAM_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function adamDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function adamAgeFromBirthday(month, day, year) {
  const today = new Date();
  let age = today.getFullYear() - year;
  const curMonth = today.getMonth() + 1;
  const curDay = today.getDate();
  if (curMonth < month || (curMonth === month && curDay < day)) age -= 1;
  return age;
}

function adamIsValidBirthday(month, day, year) {
  if (!month || !day || !year) return false;
  return day >= 1 && day <= adamDaysInMonth(month, year);
}

function adamIsBelievableBirthday(month, day, year) {
  if (!adamIsValidBirthday(month, day, year)) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const born = new Date(year, month - 1, day);
  if (born > today) return false;
  const age = adamAgeFromBirthday(month, day, year);
  return age >= 0 && age <= ADAM_MAX_AGE;
}

function adamFormatBirthday(b) {
  if (!b) return '';
  return `${ADAM_MONTHS[b.month - 1] || ''} ${b.day}, ${b.year}`;
}

function adamDefaultBirthday() {
  const now = new Date();
  return { month: 1, day: 1, year: now.getFullYear() - 25 };
}

function adamToIso(b) {
  return `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`;
}

function adamFromIso(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { month: m, day: d, year: y };
}

function adamMaxIsoToday() {
  const d = new Date();
  return adamToIso({ month: d.getMonth() + 1, day: d.getDate(), year: d.getFullYear() });
}

function adamMinIso() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - ADAM_MAX_AGE);
  return adamToIso({ month: d.getMonth() + 1, day: d.getDate(), year: d.getFullYear() });
}

const adamAgeVerifier = {
  pending: null,
  _pickers: {},

  getAge() {
    const b = this.getSavedBirthday();
    if (!b) return null;
    return adamAgeFromBirthday(b.month, b.day, b.year);
  },

  hasBirthday() {
    return !!this.getSavedBirthday();
  },

  canDiscussBetting() {
    const age = this.getAge();
    return age != null && age >= ADAM_MIN_BET_AGE;
  },

  getSavedBirthday() {
    try {
      const raw = localStorage.getItem(ADAM_BIRTHDAY_KEY);
      if (!raw) return null;
      const b = JSON.parse(raw);
      if (!adamIsBelievableBirthday(b.month, b.day, b.year)) return null;
      return { month: b.month, day: b.day, year: b.year };
    } catch {
      return null;
    }
  },

  saveBirthday(b) {
    try {
      localStorage.setItem(ADAM_BIRTHDAY_KEY, JSON.stringify(b));
      const age = adamAgeFromBirthday(b.month, b.day, b.year);
      if (age >= ADAM_MIN_BET_AGE) {
        localStorage.setItem(ADAM_AGE_VERIFIED_KEY, '1');
      } else {
        localStorage.removeItem(ADAM_AGE_VERIFIED_KEY);
      }
    } catch { /* ignore */ }
  },

  clearAll() {
    try {
      localStorage.removeItem(ADAM_BIRTHDAY_KEY);
      localStorage.removeItem(ADAM_AGE_VERIFIED_KEY);
    } catch { /* ignore */ }
  },

  messageRequiresBettingAge(message) {
    if (this.canDiscussBetting()) return false;
    const m = String(message || '').toLowerCase();
    if (!m) return false;
    if (
      /how\s+(?:do|does)\s+we\s+decide|how\s+to\s+decide|who\s+decides|napkin\s+vote/.test(m)
      || /unanimous|everyone\s+(?:must\s+)?(?:agree|vote|take\s+part)|does\s+everyone\s+need/.test(m) && /decide|vote|napkin|keeper|agree/.test(m)
    ) {
      return false;
    }
    return (
      /\b(?:bet|bets|betting|wager|antes?|pot|gambl|stake|stakes)\b/.test(m)
      || /\b(?:button|buttons|bead|beads|chip|chips|token|tokens)\b/.test(m)
      || /\b(?:keeper|keep the pot|return all|house rule)\b/.test(m)
      || /\bpretend\s+(?:bet|money|stakes)\b/.test(m)
    );
  },

  bettingBlockedReply() {
    const b = this.getSavedBirthday();
    if (!b) {
      return 'To talk about **buttons, beads, and pretend bets**, I need your birthday saved first — tap **Settings** or say **"set birthday"**. You must be **18 or older**. Game rules and scoring are always open to everyone!';
    }
    const age = adamAgeFromBirthday(b.month, b.day, b.year);
    const label = adamFormatBirthday(b);
    return `Your saved birthday (**${label}**) shows age **${age}**. Pretend-bet chat with buttons and beads unlocks at **18**. I can still explain all the **Volcano Vent Dice** rules, scoring, and variants — just ask!`;
  },

  requestVerification(onSuccess) {
    this.pending = typeof onSuccess === 'function' ? onSuccess : null;
    this.openModal();
  },

  openModal() {
    const modal = document.getElementById('age-modal');
    if (!modal) return;
    this.hideError('modal');
    this._updateModalCopy();
    this.mountPicker('modal', 'birthday-picker-modal', 'age-birthday-label');
    modal.classList.add('open');
    document.body.classList.add('modal-open');
  },

  closeModal() {
    document.getElementById('age-modal')?.classList.remove('open');
    this.pending = null;
    document.body.classList.remove('modal-open');
  },

  _updateModalCopy() {
    const intro = document.querySelector('#age-modal .age-intro');
    const confirm = document.getElementById('age-confirm');
    const b = this.getSavedBirthday();
    if (intro) {
      if (b && !this.canDiscussBetting()) {
        intro.innerHTML = 'Pretend bets with <strong>buttons and beads</strong> need you to be <strong>18+</strong>. Your saved birthday shows you are not 18 yet — update only if that was a mistake, or tap <strong>Not now</strong> and keep asking about game rules.';
      } else {
        intro.innerHTML = 'To discuss <strong>pretend bets</strong> with buttons and beads, save a real birthday on this device. You must be <strong>18 or older</strong>. Game rules are always available — no birthday needed.';
      }
    }
    if (confirm) {
      confirm.textContent = b && !this.canDiscussBetting() ? 'Update birthday (18+ only)' : 'Save birthday';
    }
  },

  hideError(target) {
    const id = target === 'settings' ? 'settings-birthday-error' : 'age-error';
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  },

  showError(msg, target) {
    const id = target === 'settings' ? 'settings-birthday-error' : 'age-error';
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg.replace(/\*\*/g, '');
    el.classList.remove('hidden');
  },

  getBirthday(target) {
    const picker = this._pickers[target];
    if (!picker) return null;
    if (picker.dateInput?.value) return adamFromIso(picker.dateInput.value);
    const month = Number(picker.monthSelect?.value);
    const day = Number(picker.daySelect?.value);
    const year = Number(picker.yearSelect?.value);
    if (!month || !day || !year) return null;
    return { month, day, year };
  },

  _applyBirthday(b, { closeModal = false, announce = false, requireBetAge = false } = {}) {
    if (!b || !adamIsBelievableBirthday(b.month, b.day, b.year)) {
      return { ok: false, error: 'Pick a real birthday — not in the future, and within a believable age.' };
    }
    const age = adamAgeFromBirthday(b.month, b.day, b.year);
    if (requireBetAge && age < ADAM_MIN_BET_AGE) {
      return {
        ok: false,
        error: `That birthday makes you ${age} — pretend-bet chat unlocks at 18. Game rules stay open!`
      };
    }
    this.saveBirthday(b);
    this.hideError('modal');
    this.hideError('settings');
    this.refreshSettingsUI();
    this.refreshBadge();

    const next = this.pending;
    const hadPending = !!this.pending;
    this.pending = null;
    if (closeModal) this.closeModal();

    if (hadPending && age >= ADAM_MIN_BET_AGE && next) next();

    if (announce && typeof addMessage === 'function') {
      const label = adamFormatBirthday(b);
      if (age >= ADAM_MIN_BET_AGE) {
        addMessage('assistant', `Birthday saved as **${label}** (age ${age}). You can now ask me about **buttons, beads, and pretend bets** on Volcano Vent Dice!`, typeof ADAM_SOURCE !== 'undefined' ? ADAM_SOURCE : '🌋 Adam The Volcano Vent Bot');
      } else {
        addMessage('assistant', `Birthday saved as **${label}** (age ${age}). Pretend-bet chat unlocks at **18** — but I am always here for rules and scoring questions!`, typeof ADAM_SOURCE !== 'undefined' ? ADAM_SOURCE : '🌋 Adam The Volcano Vent Bot');
      }
    }
    return { ok: true, age };
  },

  handleConfirm() {
    const result = this._applyBirthday(this.getBirthday('modal'), { closeModal: true, requireBetAge: true });
    if (!result.ok) this.showError(result.error, 'modal');
  },

  saveBirthdayFromForm({ announce = false } = {}) {
    const b = this.getBirthday('settings');
    if (!b) return { saved: false, skipped: true };
    if (!adamIsBelievableBirthday(b.month, b.day, b.year)) {
      return { saved: false, skipped: true };
    }
    const result = this._applyBirthday(b, { announce, requireBetAge: false });
    if (!result.ok) {
      this.showError(result.error, 'settings');
      return { saved: false, error: result.error };
    }
    return { saved: true };
  },

  handleSaveSettings() {
    const result = this.saveBirthdayFromForm({ announce: true });
    if (result.error) return;
    if (result.saved && typeof closeSettings === 'function') closeSettings();
  },

  refreshSettingsUI() {
    const status = document.getElementById('settings-birthday-status');
    if (!status) return;
    const saved = this.getSavedBirthday();
    if (!saved) {
      status.textContent = 'No birthday saved yet. Pretend-bet chat needs 18+.';
      return;
    }
    const age = adamAgeFromBirthday(saved.month, saved.day, saved.year);
    const label = adamFormatBirthday(saved);
    if (age >= ADAM_MIN_BET_AGE) {
      status.innerHTML = `Saved: <strong>${label}</strong> (age <strong>${age}</strong>) · <strong>18+ pretend bets unlocked</strong>`;
    } else {
      status.innerHTML = `Saved: <strong>${label}</strong> (age <strong>${age}</strong>) · Pretend bets locked until <strong>18</strong>`;
    }
  },

  refreshBadge() {
    const badge = document.getElementById('age-badge');
    if (!badge) return;
    if (this.canDiscussBetting()) {
      badge.textContent = '18+';
      badge.className = 'age-badge verified';
      badge.title = 'Pretend-bet chat unlocked';
    } else if (this.hasBirthday()) {
      badge.textContent = 'Rules only';
      badge.className = 'age-badge partial';
      badge.title = 'Game rules open — pretend bets need 18+';
    } else {
      badge.textContent = 'Guest';
      badge.className = 'age-badge guest';
      badge.title = 'Set birthday in Settings for pretend-bet chat';
    }
  },

  _yearOptions() {
    const now = new Date();
    const years = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - ADAM_MAX_AGE; y--) years.push(y);
    return years;
  },

  _fillDaySelect(select, month, year, selectedDay) {
    if (!select) return;
    const max = adamDaysInMonth(month, year);
    const day = Math.min(selectedDay || 1, max);
    select.innerHTML = Array.from({ length: max }, (_, i) => {
      const d = i + 1;
      return `<option value="${d}"${d === day ? ' selected' : ''}>${d}</option>`;
    }).join('');
    select.value = String(day);
  },

  mountPicker(target, wrapId, labelId) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    const initial = this.getSavedBirthday() || adamDefaultBirthday();
    const inputId = `${wrapId}-date`;
    const monthId = `${wrapId}-month`;
    const dayId = `${wrapId}-day`;
    const yearId = `${wrapId}-year`;

    const monthOptions = ADAM_MONTHS.map((name, i) => {
      const v = i + 1;
      return `<option value="${v}"${v === initial.month ? ' selected' : ''}>${name}</option>`;
    }).join('');

    const yearOptions = this._yearOptions().map(y =>
      `<option value="${y}"${y === initial.year ? ' selected' : ''}>${y}</option>`
    ).join('');

    wrap.innerHTML = `
      <label class="birthday-label" for="${inputId}">Your birthday</label>
      <input type="date" id="${inputId}" class="birthday-date"
        min="${adamMinIso()}" max="${adamMaxIsoToday()}" value="${adamToIso(initial)}"
        aria-label="Your birthday">
      <p class="birthday-or">or choose below</p>
      <div class="birthday-row">
        <select id="${monthId}" aria-label="Month">${monthOptions}</select>
        <select id="${dayId}" aria-label="Day"></select>
        <select id="${yearId}" aria-label="Year">${yearOptions}</select>
      </div>
      <p class="birthday-preview" id="${labelId}"></p>
    `;

    const dateInput = wrap.querySelector(`#${inputId}`);
    const monthSelect = wrap.querySelector(`#${monthId}`);
    const daySelect = wrap.querySelector(`#${dayId}`);
    const yearSelect = wrap.querySelector(`#${yearId}`);

    this._pickers[target] = { dateInput, monthSelect, daySelect, yearSelect, labelId, _syncing: false };
    this._fillDaySelect(daySelect, initial.month, initial.year, initial.day);

    const onChange = () => this._onPickerChange(target);
    dateInput?.addEventListener('change', onChange);
    dateInput?.addEventListener('input', onChange);
    monthSelect?.addEventListener('change', onChange);
    daySelect?.addEventListener('change', onChange);
    yearSelect?.addEventListener('change', onChange);
    this._updateLabel(target);
  },

  _onPickerChange(target) {
    const picker = this._pickers[target];
    if (!picker || picker._syncing) return;

    const fromDate = picker.dateInput?.value ? adamFromIso(picker.dateInput.value) : null;
    if (fromDate && document.activeElement === picker.dateInput) {
      picker._syncing = true;
      picker.monthSelect.value = String(fromDate.month);
      picker.yearSelect.value = String(fromDate.year);
      this._fillDaySelect(picker.daySelect, fromDate.month, fromDate.year, fromDate.day);
      picker._syncing = false;
    } else {
      const month = Number(picker.monthSelect?.value) || 1;
      const year = Number(picker.yearSelect?.value) || adamDefaultBirthday().year;
      const day = Number(picker.daySelect?.value) || 1;
      const clamped = Math.min(day, adamDaysInMonth(month, year));
      picker._syncing = true;
      this._fillDaySelect(picker.daySelect, month, year, clamped);
      if (picker.dateInput) {
        picker.dateInput.value = adamToIso({ month, day: clamped, year });
      }
      picker._syncing = false;
    }
    this._updateLabel(target);
  },

  _updateLabel(target) {
    const picker = this._pickers[target];
    if (!picker) return;
    const label = document.getElementById(picker.labelId);
    const b = this.getBirthday(target);
    if (label && b) {
      const age = adamAgeFromBirthday(b.month, b.day, b.year);
      label.textContent = `${adamFormatBirthday(b)} (age ${age})`;
    }
  },

  initSettingsPicker() {
    this.mountPicker('settings', 'birthday-picker-settings', 'settings-birthday-label');
    this.refreshSettingsUI();
  }
};

function initAdamAgeVerifier() {
  document.getElementById('age-confirm')?.addEventListener('click', () => adamAgeVerifier.handleConfirm());
  document.getElementById('age-close')?.addEventListener('click', () => adamAgeVerifier.closeModal());
  document.getElementById('age-dismiss')?.addEventListener('click', () => adamAgeVerifier.closeModal());
  document.getElementById('age-modal')?.addEventListener('click', e => {
    if (e.target.id === 'age-modal') adamAgeVerifier.closeModal();
  });
  document.getElementById('settings-save-birthday')?.addEventListener('click', () => adamAgeVerifier.handleSaveSettings());
  document.getElementById('settings-clear-birthday')?.addEventListener('click', () => {
    adamAgeVerifier.clearAll();
    adamAgeVerifier.initSettingsPicker();
    adamAgeVerifier.refreshBadge();
    addMessage?.('assistant', 'Birthday cleared. Pretend-bet chat will ask again when needed.', typeof ADAM_SOURCE !== 'undefined' ? ADAM_SOURCE : '🌋 Adam The Volcano Vent Bot');
    closeSettings?.();
  });
  adamAgeVerifier.refreshBadge();
}