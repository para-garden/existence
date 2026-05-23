// ui.js — rendering, text display, interaction handling

/** @param {GameContext} ctx */
export function createUI(ctx) {
  /** @type {HTMLElement} */ let passageEl;
  /** @type {HTMLElement} */ let eventTextEl;
  /** @type {HTMLElement} */ let actionsEl;
  /** @type {HTMLElement} */ let movementEl;
  /** @type {HTMLElement} */ let awarenessEl;
  /** @type {HTMLElement} */ let awarenessTimeEl;
  /** @type {HTMLElement} */ let awarenessMoneyEl;
  /** @type {HTMLElement | null} */ let phoneEl = null;
  /** @type {((interaction: Interaction, data?: Record<string, any>) => void) | null} */
  let onAction = null;
  /** @type {((destId: string) => void) | null} */
  let onMove = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let idleTimer = null;
  /** @type {(() => void) | null} */
  let idleCallback = null;
  let idleCount = 0;
  let lastActivityTime = Date.now();
  let afkDetectionEnabled = true;
  /** @type {HTMLElement | null} */
  let afkIndicatorEl = null;

  // Focus state — UI-only, not saved or replayed
  let timeFocus = 0.5;
  let moneyFocus = 0.5;

  // Phone navigation state — UI-only closure, never persisted.
  // Sim-level phone state (viewing_phone, phone_inbox, notes) lives in state.js.
  let phoneScreen = 'home';
  /** @type {string | null} */
  let phoneThreadContact = null;
  /** @type {string | null} */
  let phonePrevScreen = null;
  /** @type {number | null} */
  let phoneNoteIndex = null;
  let wasViewingPhone = false;

  function resetPhoneNav() {
    phoneScreen = 'home';
    phoneThreadContact = null;
    phonePrevScreen = null;
    phoneNoteIndex = null;
  }

  // How long without any user input before idle thoughts stop firing
  const ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  // Color interpolation between unfocused and focused
  const FOCUSED_COLOR = { r: 0xc8, g: 0xc0, b: 0xb8 };
  const UNFOCUSED_COLOR = { r: 0x50, g: 0x48, b: 0x40 };

  /** @param {number} t */
  function lerpColor(t) {
    const r = Math.round(UNFOCUSED_COLOR.r + (FOCUSED_COLOR.r - UNFOCUSED_COLOR.r) * t);
    const g = Math.round(UNFOCUSED_COLOR.g + (FOCUSED_COLOR.g - UNFOCUSED_COLOR.g) * t);
    const b = Math.round(UNFOCUSED_COLOR.b + (FOCUSED_COLOR.b - UNFOCUSED_COLOR.b) * t);
    return `rgb(${r},${g},${b})`;
  }

  /** @param {UICallbacks} callbacks */
  function init(callbacks) {
    if (passageEl) return;
    passageEl = /** @type {HTMLElement} */ (document.getElementById('passage'));
    eventTextEl = /** @type {HTMLElement} */ (document.getElementById('event-text'));
    actionsEl = /** @type {HTMLElement} */ (document.getElementById('actions'));
    movementEl = /** @type {HTMLElement} */ (document.getElementById('movement'));
    awarenessEl = /** @type {HTMLElement} */ (document.getElementById('awareness'));
    awarenessTimeEl = /** @type {HTMLElement} */ (document.getElementById('awareness-time'));
    awarenessMoneyEl = /** @type {HTMLElement} */ (document.getElementById('awareness-money'));
    phoneEl = /** @type {HTMLElement} */ (document.getElementById('phone'));
    phoneEl.addEventListener('click', phoneClickHandler);
    onAction = callbacks.onAction;
    onMove = callbacks.onMove;
    idleCallback = callbacks.onIdle;

    awarenessTimeEl.addEventListener('click', () => {
      if (callbacks.onFocusTime) callbacks.onFocusTime();
    });
    awarenessMoneyEl.addEventListener('click', () => {
      if (callbacks.onFocusMoney) callbacks.onFocusMoney();
    });

    // Pause idle timer when tab is hidden.
    // Don't restart on return — let the player's next action restart it.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopIdleTimer();
      }
    });

    // Track real user presence — any input resets the activity clock.
    // Don't touch the indicator here; it clears when a game action is taken.
    const markActive = () => { lastActivityTime = Date.now(); };
    document.addEventListener('mousemove', markActive, { passive: true });
    document.addEventListener('keydown', markActive, { passive: true });
    document.addEventListener('click', markActive, { passive: true });

    afkIndicatorEl = /** @type {HTMLElement} */ (document.getElementById('afk-indicator'));
    afkIndicatorEl.addEventListener('click', () => {
      afkDetectionEnabled = !afkDetectionEnabled;
      if (!afkDetectionEnabled) {
        // Detection off — show indicator in off state, restart chain so thoughts continue
        afkIndicatorEl.classList.remove('hidden');
        afkIndicatorEl.classList.add('detection-off');
        resetIdleTimer();
      } else {
        // Detection on — remove off styling and hide (player just clicked = present)
        afkIndicatorEl.classList.remove('detection-off');
        afkIndicatorEl.classList.add('hidden');
      }
    });
  }

  // --- Text rendering ---

  /** @param {string} text */
  function showPassage(text) {
    // Fade out, swap, fade in
    passageEl.classList.remove('visible');

    setTimeout(() => {
      passageEl.innerHTML = textToHTML(text);
      passageEl.classList.add('visible');
    }, 150);

    // Clear event text
    clearEventText();

    // Reset idle timer
    resetIdleTimer();
  }

  /** @param {string} text */
  function showEventText(text) {
    if (!text || text.trim() === '') return;

    eventTextEl.classList.remove('visible');

    setTimeout(() => {
      eventTextEl.innerHTML = textToHTML(text);
      eventTextEl.classList.add('visible');
    }, 200);
  }

  function clearEventText() {
    eventTextEl.classList.remove('visible');
    setTimeout(() => {
      eventTextEl.innerHTML = '';
    }, 500);
  }

  /** @param {string} text */
  function appendEventText(text) {
    if (!text || text.trim() === '') return;

    const p = document.createElement('p');
    p.innerHTML = text;
    p.style.opacity = '0';
    p.style.transition = 'opacity 0.5s ease';
    eventTextEl.appendChild(p);
    eventTextEl.classList.add('visible');

    // Trigger fade in
    requestAnimationFrame(() => {
      p.style.opacity = '1';
    });
  }

  /**
   * @param {string} text
   * @param {string} tier — 'uneasy' | 'prominent' | 'tremor'
   */
  function appendInnerVoice(text, tier) {
    if (!text || text.trim() === '') return;
    const p = document.createElement('p');
    p.innerHTML = text;
    p.className = `inner-voice inner-voice--${tier}`;
    p.style.opacity = '0';
    p.style.transition = 'opacity 0.5s ease';
    eventTextEl.appendChild(p);
    eventTextEl.classList.add('visible');
    requestAnimationFrame(() => { p.style.opacity = '1'; });
  }

  /** @param {string} text */
  function textToHTML(text) {
    // Split into paragraphs on double newlines, wrap in <p>
    // Single string = single paragraph
    const paragraphs = text.split(/\n\n+/).filter(/** @param {string} p */ p => p.trim());
    if (paragraphs.length <= 1) {
      return `<p>${text}</p>`;
    }
    return paragraphs.map(/** @param {string} p */ p => `<p>${p.trim()}</p>`).join('');
  }

  // --- Habit strength → color ---
  // Continuous brightness based on prediction strength. No threshold snap.
  // Strength 0.6 (minimum) = barely above base, 1.0 = approaching body text.

  // Action: base #8a8078 (138,128,120) → bright #c8c0b8 (200,192,184)
  const ACTION_BASE = { r: 0x8a, g: 0x80, b: 0x78 };
  const ACTION_BRIGHT = { r: 0xc8, g: 0xc0, b: 0xb8 };
  // Movement: base #605850 (96,88,80) → bright #a09890 (160,152,144)
  const MOVE_BASE = { r: 0x60, g: 0x58, b: 0x50 };
  const MOVE_BRIGHT = { r: 0xa0, g: 0x98, b: 0x90 };

  /**
   * Interpolate color from base to bright based on habit strength.
   * @param {number} strength — prediction probability (0.6–1.0 range)
   * @param {{ r: number, g: number, b: number }} base
   * @param {{ r: number, g: number, b: number }} bright
   * @returns {string}
   */
  function habitColor(strength, base, bright) {
    const t = Math.min(1, Math.max(0, (strength - 0.6) / 0.4));
    const r = Math.round(base.r + (bright.r - base.r) * t);
    const g = Math.round(base.g + (bright.g - base.g) * t);
    const b = Math.round(base.b + (bright.b - base.b) * t);
    return `rgb(${r},${g},${b})`;
  }

  // --- Actions ---

  /** @param {Interaction[]} interactions @param {{ actionId: string, strength: number, tier: string } | null} [prediction] */
  function showActions(interactions, prediction) {
    actionsEl.innerHTML = '';
    actionsEl.classList.remove('visible');

    if (interactions.length === 0) {
      actionsEl.classList.add('visible');
      return;
    }

    for (const interaction of interactions) {
      const btn = document.createElement('button');
      btn.className = 'action';
      if (prediction && prediction.actionId === interaction.id) {
        btn.style.color = habitColor(prediction.strength, ACTION_BASE, ACTION_BRIGHT);
      }
      btn.textContent = interaction.label;
      btn.addEventListener('click', () => {
        if (onAction) onAction(interaction);
      });
      actionsEl.appendChild(btn);
    }

    // Slight delay before showing
    setTimeout(() => {
      actionsEl.classList.add('visible');
    }, 400);
  }

  // --- Movement ---

  /** @param {ConnectionInfo[]} connections @param {{ actionId: string, strength: number, tier: string } | null} [prediction] */
  function showMovement(connections, prediction) {
    movementEl.innerHTML = '';
    movementEl.classList.remove('visible');

    if (connections.length === 0) {
      return;
    }

    for (const conn of connections) {
      const btn = document.createElement('button');
      btn.className = 'movement-link';
      if (prediction && prediction.actionId === 'move:' + conn.id) {
        btn.style.color = habitColor(prediction.strength, MOVE_BASE, MOVE_BRIGHT);
      }
      btn.textContent = conn.name;
      btn.addEventListener('click', () => {
        if (onMove) onMove(conn.id);
      });
      movementEl.appendChild(btn);
    }

    setTimeout(() => {
      movementEl.classList.add('visible');
    }, 600);
  }

  // --- Idle behavior ---

  function scheduleNextIdle() {
    if (ctx.state.get('viewing_phone')) return;
    // Escalating delays: quick at first, then space out. Plateau at 20 min.
    const delays = [30000, 60000, 120000, 300000, 1200000];
    const delay = delays[Math.min(idleCount, delays.length - 1)];
    idleTimer = setTimeout(() => {
      // If the player has been truly absent, drop silently without rescheduling.
      if (afkDetectionEnabled && Date.now() - lastActivityTime > ACTIVITY_TIMEOUT) {
        if (afkIndicatorEl) afkIndicatorEl.classList.remove('hidden');
        return;
      }
      if (idleCallback) idleCallback();
      idleCount++;
      scheduleNextIdle();
    }, delay);
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleCount = 0;
    // Clear the absent indicator when the player takes a game action
    if (afkDetectionEnabled && afkIndicatorEl) {
      afkIndicatorEl.classList.add('hidden');
    }
    scheduleNextIdle();
  }

  function stopIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  // --- Phone UI ---

  const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function phoneTimeStr() {
    const cal = ctx.state.calendarDate();
    const h = cal.hour;
    const m = cal.minute;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return h12 + ':' + String(m).padStart(2, '0') + '\u202f' + ampm;
  }

  function phoneDateStr() {
    const cal = ctx.state.calendarDate();
    return WEEKDAY_NAMES[cal.weekday] + ', ' + MONTH_NAMES[cal.month] + '\u202f' + cal.day;
  }

  /** @param {string} text */
  function escPhoneText(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Get display name for a contact slot */
  function contactDisplayName(slot) {
    if (slot === 'bank') return 'Bank';
    if (slot === 'supervisor') {
      const sup = /** @type {{ name: string } | undefined} */ (ctx.character && ctx.character.get('supervisor'));
      return sup ? sup.name : 'Work';
    }
    if (slot === 'family') {
      // family is now family_members array — show name of first alive member, or generic "Family"
      const charAllUi = ctx.character && ctx.character.getAll();
      const familyMembersUi = /** @type {FamilyMemberPerson[] | undefined} */ (charAllUi?.family_members);
      const firstAliveMember = familyMembersUi?.find(fm => fm.alive);
      return firstAliveMember ? firstAliveMember.name : 'Family';
    }
    const c = /** @type {{ name: string } | undefined} */ (ctx.character && ctx.character.get(slot));
    return c ? c.name : slot;
  }

  /** Get messages for a specific contact slot from the inbox */
  function contactMessages(inbox, slot) {
    return inbox.filter(m => {
      if (slot === 'bank') return m.source === 'bank' || (!m.source && (m.type === 'bank' || m.type === 'paycheck' || m.type === 'bill'));
      if (slot === 'supervisor') return m.source === 'supervisor' || (!m.source && m.type === 'work');
      return m.source === slot;
    });
  }

  /** Returns true if slot is a dynamic friend slot (friend1, friend2, friend3...) */
  function isFriendSlot(slot) {
    return /^friend\d+$/.test(slot);
  }

  /** Discover all active friend slots from the character. */
  function activeFriendSlotsUI() {
    const char = ctx.character.getAll();
    if (!char) return [];
    return Object.keys(char).filter(k => isFriendSlot(k) && char[k] != null).sort();
  }

  /** Build ordered contact list for messages screen */
  function buildContactList(inbox) {
    const contacts = [];

    for (const slot of activeFriendSlotsUI()) {
      const msgs = contactMessages(inbox, slot);
      if (msgs.length === 0) continue;
      const lastMsg = msgs[msgs.length - 1];
      const hasUnread = msgs.some(m => !m.read && m.direction !== 'sent');
      contacts.push({ slot, name: contactDisplayName(slot), lastMsg, hasUnread, ts: lastMsg.timestamp || 0 });
    }

    // Sort friends by most recent message
    contacts.sort((a, b) => b.ts - a.ts);

    // Family — appears before supervisor/bank if they have messages
    {
      const famMsgs = contactMessages(inbox, 'family');
      if (famMsgs.length > 0) {
        const lastMsg = famMsgs[famMsgs.length - 1];
        const hasUnread = famMsgs.some(m => !m.read && m.direction !== 'sent');
        contacts.push({ slot: 'family', name: contactDisplayName('family'), lastMsg, hasUnread, ts: lastMsg.timestamp || 0 });
      }
    }

    for (const slot of ['supervisor', 'bank']) {
      const msgs = contactMessages(inbox, slot);
      if (msgs.length === 0) continue;
      const lastMsg = msgs[msgs.length - 1];
      const hasUnread = msgs.some(m => !m.read && m.direction !== 'sent');
      contacts.push({ slot, name: contactDisplayName(slot), lastMsg, hasUnread, ts: lastMsg.timestamp || 0 });
    }

    return contacts;
  }

  function buildPhoneStatusBar(timeStr, batteryPct) {
    const batteryClass = batteryPct <= 15 ? ' phone-battery--low' : '';
    const isSilent = ctx.state.get('phone_silent');
    const silentDot = isSilent ? `<span class="phone-silent-dot" title="Silent"></span>` : '';
    return `<button class="phone-status-bar" data-phone-nav="notifications"><span class="phone-status-time">${timeStr}</span>${silentDot}<span class="phone-battery-pct${batteryClass}">${Math.round(batteryPct)}%</span></button>`;
  }

  function buildPhoneNotificationsScreen(timeStr, batteryPct) {
    const isSilent = ctx.state.get('phone_silent');
    const silentLabel = isSilent ? 'Sound on' : 'Silent';
    const silentState = isSilent ? 'on' : 'off';
    return `<div class="phone-notifications">`
      + `<div class="phone-notif-header"><span class="phone-notif-time">${timeStr}</span><button class="phone-notif-close" data-phone-nav="back">&#x2715;</button></div>`
      + `<div class="phone-quick-settings">`
      + `<button class="phone-quick-tile phone-quick-tile--silent-${silentState}" data-phone-action="toggle_phone_silent">${silentLabel}</button>`
      + `</div>`
      + `</div>`;
  }

  function buildPhoneHomeScreen(timeStr, dateStr, batteryPct, unreadCount) {
    const badge = unreadCount > 0 ? `<span class="phone-app-badge">${unreadCount}</span>` : '';
    // Job Board app — visible when actively seeking, unemployed, or terminated.
    // Also visible when job_standing is at_risk or shaky (pre-termination urgency).
    const jobBoardVisible = ctx.state.get('job_seeking')
      || ctx.state.isUnemployed()
      || ctx.state.isTerminated()
      || ctx.state.jobTier() === 'at_risk'
      || ctx.state.jobTier() === 'shaky';
    const jobBoardBtn = jobBoardVisible
      ? `<button class="phone-app" data-phone-nav="job_search">Jobs</button>`
      : '';
    // Unemployment benefits app — visible when terminated/unemployed and benefit not yet applied for.
    const benefitsVisible = (ctx.state.isUnemployed() || ctx.state.isTerminated())
      && !ctx.state.get('unemployment_benefit_active')
      && ctx.state.get('unemployment_applied_day') === 0;
    const benefitsBtn = benefitsVisible
      ? `<button class="phone-app" data-phone-action="apply_for_unemployment">Benefits</button>`
      : '';
    return buildPhoneStatusBar(timeStr, batteryPct)
      + `<div class="phone-home-time">${timeStr}</div>`
      + `<div class="phone-home-date">${dateStr}</div>`
      + `<div class="phone-apps">`
      + `<button class="phone-app" data-phone-nav="messages">Messages${badge}</button>`
      + `<button class="phone-app" data-phone-nav="notes">Notes</button>`
      + `<button class="phone-app" data-phone-nav="alarms">Alarm</button>`
      + `<button class="phone-app" data-phone-nav="calendar">Calendar</button>`
      + `<button class="phone-app" data-phone-nav="timer">Timer</button>`
      + jobBoardBtn
      + benefitsBtn
      + `</div>`
      + `<button class="phone-home-bar" data-phone-action="put_phone_away">&#x2014;</button>`;
  }

  function buildPhoneNotesScreen(timeStr, batteryPct, notes) {
    const writeInter = ctx.content.getInteraction('write_note');
    const canWrite = writeInter && writeInter.available();

    let rows = '';
    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i];
      const firstLine = escPhoneText(note.text.split('\n')[0].substring(0, 48) + (note.text.split('\n')[0].length > 48 ? '\u2026' : ''));
      rows += `<button class="phone-contact-row" data-phone-nav="note_view" data-note-index="${i}">`
        + `<span class="phone-contact-preview">${firstLine}</span>`
        + `</button>`;
    }
    if (rows === '') rows = '<div class="phone-empty">Nothing written.</div>';

    let compose = '';
    if (canWrite) {
      compose = '<div class="phone-compose">'
        + `<textarea class="phone-note-input" id="phone-note-text" placeholder="write something\u2026" rows="3"></textarea>`
        + `<button class="phone-compose-btn" data-phone-action="write_note">Save</button>`
        + '</div>';
    }

    return buildPhoneStatusBar(timeStr, batteryPct)
      + `<div class="phone-nav-header"><button class="phone-nav-back" data-phone-nav="home">&#x2039;</button><span class="phone-nav-title">Notes</span></div>`
      + `<div class="phone-contact-list">${rows}</div>`
      + compose
      + `<button class="phone-home-bar" data-phone-action="put_phone_away">&#x2014;</button>`;
  }

  function buildPhoneNoteViewScreen(timeStr, batteryPct, notes, idx) {
    const note = notes[idx];
    if (!note) {
      return buildPhoneStatusBar(timeStr, batteryPct)
        + `<div class="phone-nav-header"><button class="phone-nav-back" data-phone-nav="notes">&#x2039;</button><span class="phone-nav-title">Note</span></div>`
        + `<div class="phone-empty">Note not found.</div>`
        + `<button class="phone-home-bar" data-phone-action="put_phone_away">&#x2014;</button>`;
    }
    return buildPhoneStatusBar(timeStr, batteryPct)
      + `<div class="phone-nav-header"><button class="phone-nav-back" data-phone-nav="notes">&#x2039;</button><span class="phone-nav-title">Note</span></div>`
      + `<div class="phone-thread-messages"><div class="phone-note-body">${escPhoneText(note.text)}</div></div>`
      + `<button class="phone-home-bar" data-phone-action="put_phone_away">&#x2014;</button>`;
  }

  function buildPhoneAlarmScreen(timeStr, batteryPct) {
    const alarm = ctx.state.getInterrupt('wake_alarm');
    let statusHtml;
    if (alarm) {
      const tod = alarm.data.alarmTod;
      const h = Math.floor(tod / 60);
      const m = tod % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const timeLabel = displayH + ':' + String(m).padStart(2, '0') + '\u202f' + period;
      const canCancel = ctx.content.getInteraction('cancel_alarm_app')?.available();
      const cancelBtn = canCancel
        ? `<button class="phone-compose-btn phone-alarm-cancel" data-phone-action="cancel_alarm_app">Cancel</button>`
        : '';
      statusHtml = `<div class="phone-alarm-status">`
        + `<span class="phone-alarm-time">${timeLabel}</span>`
        + cancelBtn
        + `</div>`;
    } else {
      statusHtml = `<div class="phone-empty">No alarm set.</div>`;
    }

    const canSet = ctx.content.getInteraction('set_alarm')?.available();
    let setForm = '';
    if (canSet) {
      // Pre-fill from habit history when confidence is high
      const suggested = ctx.habits.suggestedData('set_alarm');
      let prefillH = 7, prefillM = 0, prefillAmpm = 'AM';
      if (suggested && typeof suggested.alarmTod === 'number') {
        const tod = suggested.alarmTod;
        const h24 = Math.floor(tod / 60);
        prefillM = tod % 60;
        prefillAmpm = h24 >= 12 ? 'PM' : 'AM';
        prefillH = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
        // Snap minute to nearest 5-minute increment for select compatibility
        prefillM = Math.round(prefillM / 5) * 5;
        if (prefillM >= 60) prefillM = 55;
      }
      // Hour options 1–12
      let hourOpts = '';
      for (let i = 1; i <= 12; i++) {
        hourOpts += `<option value="${i}"${i === prefillH ? ' selected' : ''}>${i}</option>`;
      }
      // Minute options in 5-minute increments
      let minOpts = '';
      for (let i = 0; i < 60; i += 5) {
        minOpts += `<option value="${i}"${i === prefillM ? ' selected' : ''}>${String(i).padStart(2, '0')}</option>`;
      }
      setForm = `<div class="phone-compose phone-alarm-form">`
        + `<div class="phone-alarm-inputs">`
        + `<select class="phone-alarm-select" id="phone-alarm-hour">${hourOpts}</select>`
        + `<span class="phone-alarm-colon">:</span>`
        + `<select class="phone-alarm-select" id="phone-alarm-min">${minOpts}</select>`
        + `<select class="phone-alarm-select" id="phone-alarm-ampm"><option value="AM"${prefillAmpm === 'AM' ? ' selected' : ''}>AM</option><option value="PM"${prefillAmpm === 'PM' ? ' selected' : ''}>PM</option></select>`
        + `</div>`
        + `<button class="phone-compose-btn" data-phone-action="set_alarm_app">Set</button>`
        + `</div>`;
    }

    return buildPhoneStatusBar(timeStr, batteryPct)
      + `<div class="phone-nav-header"><button class="phone-nav-back" data-phone-nav="home">&#x2039;</button><span class="phone-nav-title">Alarm</span></div>`
      + `<div class="phone-alarm-body">${statusHtml}</div>`
      + setForm
      + `<button class="phone-home-bar" data-phone-action="put_phone_away">&#x2014;</button>`;
  }

  function buildPhoneCalendarScreen(timeStr, batteryPct) {
    const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = ctx.state.currentAbsoluteDay();
    const startTs = ctx.state.get('start_timestamp'); // minutes since Unix epoch

    /**
     * Format a shift time in minutes-since-midnight as 12h clock.
     * @param {number} tod
     */
    function fmtTod(tod) {
      const h = Math.floor(tod / 60);
      const m = tod % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return m === 0 ? `${h12}\u202f${period}` : `${h12}:${String(m).padStart(2, '0')}\u202f${period}`;
    }

    let rows = '';
    for (let i = 0; i < 7; i++) {
      const absDay = today + i;
      // Derive calendar date for this absolute game-day
      const d = new Date((startTs + absDay * 1440) * 60000);
      const dayAbbr = DAY_ABBR[d.getUTCDay()];
      const monthAbbr = MONTH_ABBR[d.getUTCMonth()];
      const dateNum = d.getUTCDate();
      const dateLabel = `${dayAbbr}\u202f${monthAbbr}\u202f${dateNum}`;

      const shift = ctx.state.shiftFor(absDay);
      let shiftLabel;
      if (shift === undefined) {
        // Not yet revealed (rotating/on_demand)
        shiftLabel = '<span class="phone-cal-unknown">\u2014</span>';
      } else if (shift === null) {
        shiftLabel = '<span class="phone-cal-off">off</span>';
      } else if (shift.blocks) {
        // Split shift: show both blocks
        shiftLabel = shift.blocks.map(b =>
          `<span class="phone-cal-shift">${fmtTod(b.start)}\u2013${fmtTod(b.end)}</span>`
        ).join('<span class="phone-cal-split-gap">, </span>');
      } else {
        shiftLabel = `<span class="phone-cal-shift">${fmtTod(shift.start)}\u2013${fmtTod(shift.end)}</span>`;
      }

      // Check for personal calendar events on this day
      const personalCal = ctx.state.get('personal_calendar') || [];
      let eventLabel = '';
      for (const evt of personalCal) {
        if (evt.month === d.getUTCMonth() && evt.day === d.getUTCDate()) {
          eventLabel += `<span class="phone-cal-event">${escPhoneText(evt.label)}</span>`;
        }
      }

      const todayClass = i === 0 ? ' phone-cal-row--today' : '';
      rows += `<div class="phone-cal-row${todayClass}">`
        + `<span class="phone-cal-date">${dateLabel}</span>`
        + shiftLabel
        + eventLabel
        + `</div>`;
    }

    return buildPhoneStatusBar(timeStr, batteryPct)
      + `<div class="phone-nav-header"><button class="phone-nav-back" data-phone-nav="home">&#x2039;</button><span class="phone-nav-title">Calendar</span></div>`
      + `<div class="phone-cal-list">${rows}</div>`
      + `<button class="phone-home-bar" data-phone-action="put_phone_away">&#x2014;</button>`;
  }

  function buildPhoneTimerScreen(timeStr, batteryPct) {
    const timerEnd = ctx.state.get('timer_end_time');
    const now = ctx.state.get('time');
    let bodyHtml;
    if (timerEnd !== null) {
      const remaining = Math.max(0, timerEnd - now);
      const mins = Math.floor(remaining);
      const secs = Math.round((remaining - mins) * 60);
      const timeLabel = mins > 0
        ? (mins + ' min' + (secs > 0 ? ' ' + secs + ' sec' : ''))
        : (secs > 0 ? secs + ' sec' : 'Done');
      const canCancel = ctx.content.getInteraction('cancel_timer')?.available();
      const cancelBtn = canCancel
        ? `<button class="phone-compose-btn phone-timer-cancel" data-phone-action="cancel_timer">Cancel</button>`
        : '';
      bodyHtml = `<div class="phone-timer-status">`
        + `<span class="phone-timer-remaining">${timeLabel}</span>`
        + cancelBtn
        + `</div>`;
    } else {
      const canStart = ctx.content.getInteraction('start_timer')?.available();
      if (canStart) {
        const presets = [5, 10, 20, 30];
        const timerSuggested = ctx.habits.suggestedData('start_timer');
        const suggestedDuration = timerSuggested?.duration;
        let presetBtns = '';
        for (const d of presets) {
          const style = d === suggestedDuration ? ` style="color:${habitColor(0.75, ACTION_BASE, ACTION_BRIGHT)}"` : '';
          presetBtns += `<button class="phone-timer-preset"${style} data-phone-action="start_timer" data-duration="${d}">${d} min</button>`;
        }
        bodyHtml = `<div class="phone-timer-presets">${presetBtns}</div>`;
      } else {
        bodyHtml = `<div class="phone-empty">No timer running.</div>`;
      }
    }

    return buildPhoneStatusBar(timeStr, batteryPct)
      + `<div class="phone-nav-header"><button class="phone-nav-back" data-phone-nav="home">&#x2039;</button><span class="phone-nav-title">Timer</span></div>`
      + `<div class="phone-timer-body">${bodyHtml}</div>`
      + `<button class="phone-home-bar" data-phone-action="put_phone_away">&#x2014;</button>`;
  }

  function buildPhoneJobSearchScreen(timeStr, batteryPct) {
    const apps = ctx.state.get('applications') || [];
    const pending = apps.filter(a => a.status === 'pending');
    const canApply = ctx.content.getInteraction('apply_for_job')?.available();
    const canCheck = ctx.content.getInteraction('check_application')?.available();
    const offers = apps.filter(a => a.status === 'offer');

    let appsHtml = '';
    // Show offers first -- they need action
    if (offers.length > 0) {
      appsHtml += '<div class="phone-job-search-pending">';
      for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        if (app.status !== 'offer') continue;
        const label = app.company_type === 'small' ? 'Small company'
                    : app.company_type === 'mid'   ? 'Mid-size company'
                    : 'Large company';
        appsHtml += `<div class="phone-job-search-app">${escPhoneText(label)} &mdash; offer</div>`;
      }
      appsHtml += '</div>';
    }
    if (pending.length > 0) {
      appsHtml += '<div class="phone-job-search-pending">';
      for (const app of pending) {
        const label = app.company_type === 'small' ? 'Small company'
                    : app.company_type === 'mid'   ? 'Mid-size company'
                    : 'Large company';
        appsHtml += `<div class="phone-job-search-app">${escPhoneText(label)} &mdash; pending</div>`;
      }
      if (canCheck) {
        appsHtml += `<button class="phone-compose-btn" data-phone-action="check_application">Check</button>`;
      }
      appsHtml += '</div>';
    }

    let applyHtml = '';
    if (canApply) {
      applyHtml = '<div class="phone-job-search-apply">'
        + `<button class="phone-compose-btn" data-phone-action="apply_for_job" data-company-type="small">Small</button>`
        + `<button class="phone-compose-btn" data-phone-action="apply_for_job" data-company-type="mid">Mid-size</button>`
        + `<button class="phone-compose-btn" data-phone-action="apply_for_job" data-company-type="large">Large</button>`
        + '</div>';
    } else if (pending.length >= 3) {
      applyHtml = '<div class="phone-empty">3 applications out. Wait for responses.</div>';
    }

    return buildPhoneStatusBar(timeStr, batteryPct)
      + `<div class="phone-nav-header"><button class="phone-nav-back" data-phone-nav="home">&#x2039;</button><span class="phone-nav-title">Job Board</span></div>`
      + `<div class="phone-job-search-body">${appsHtml}${applyHtml}</div>`
      + `<button class="phone-home-bar" data-phone-action="put_phone_away">&#x2014;</button>`;
  }

  function buildPhoneMessagesScreen(timeStr, batteryPct, inbox) {
    const contacts = buildContactList(inbox);
    let rows = '';
    for (const c of contacts) {
      const dot = c.hasUnread ? '<span class="phone-unread-dot"></span>' : '';
      const preview = escPhoneText(c.lastMsg.text.substring(0, 48) + (c.lastMsg.text.length > 48 ? '\u2026' : ''));
      rows += `<button class="phone-contact-row${c.hasUnread ? ' phone-contact-row--unread' : ''}" data-phone-nav="thread" data-contact="${c.slot}">`
        + `<span class="phone-contact-name">${escPhoneText(c.name)}</span>`
        + `<span class="phone-contact-preview">${preview}</span>`
        + dot
        + `</button>`;
    }
    if (rows === '') rows = '<div class="phone-empty">No messages.</div>';
    return buildPhoneStatusBar(timeStr, batteryPct)
      + `<div class="phone-nav-header"><button class="phone-nav-back" data-phone-nav="home">&#x2039;</button><span class="phone-nav-title">Messages</span></div>`
      + `<div class="phone-contact-list">${rows}</div>`
      + `<button class="phone-home-bar" data-phone-action="put_phone_away">&#x2014;</button>`;
  }

  function buildPhoneThreadScreen(timeStr, batteryPct, inbox, slot) {
    const name = contactDisplayName(slot);
    const msgs = contactMessages(inbox, slot);
    let bubbles = '';
    for (const msg of msgs) {
      const isSent = msg.direction === 'sent';
      const cls = isSent ? 'phone-bubble--sent' : 'phone-bubble--received';
      const unreadCls = (!msg.read && !isSent) ? ' phone-bubble--unread' : '';
      const sender = isSent ? 'You' : name.split(' ')[0];
      bubbles += `<div class="phone-bubble ${cls}${unreadCls}">`
        + `<div class="phone-bubble-sender">${escPhoneText(sender)}</div>`
        + `<div class="phone-bubble-text">${escPhoneText(msg.text)}</div>`
        + `</div>`;
    }
    if (bubbles === '') bubbles = '<div class="phone-empty">No messages yet.</div>';

    // Compose row — for friend and family threads
    let compose = '';
    if (isFriendSlot(slot)) {
      const replyInter = ctx.content.getInteraction('reply_to_friend');
      const writeInter = ctx.content.getInteraction('message_friend');
      const helpFriendInter = ctx.content.getInteraction('help_friend');
      const askInter = ctx.content.getInteraction('ask_for_help');
      const housingInter = ctx.content.getInteraction('call_friend_for_housing');
      const canReply = replyInter && replyInter.available({ contact: slot });
      const canWrite = writeInter && writeInter.available({ contact: slot });
      const canHelpFriend = helpFriendInter && helpFriendInter.available({ contact: slot });
      const canAsk = askInter && askInter.available({ contact: slot });
      const canCallForHousing = housingInter && housingInter.available();
      if (canReply || canWrite || canHelpFriend || canAsk || canCallForHousing) {
        compose = '<div class="phone-compose">';
        if (canReply) compose += `<button class="phone-compose-btn" data-phone-action="reply_to_friend">Reply</button>`;
        if (canWrite) compose += `<button class="phone-compose-btn" data-phone-action="message_friend">Write</button>`;
        if (canHelpFriend) {
          const helpSuggested = ctx.habits.suggestedData('help_friend');
          const prefillAmt = helpSuggested?.amount;
          const valueAttr = typeof prefillAmt === 'number' ? ` value="${prefillAmt}"` : '';
          compose += `<div class="phone-amount-row"><span class="phone-amount-prefix">$</span><input type="number" class="phone-amount-input" id="phone-help-amount" min="1" step="1" placeholder="amount"${valueAttr}><button class="phone-compose-btn phone-amount-send" data-phone-action="help_friend">Send</button></div>`;
        }
        if (canAsk) compose += `<button class="phone-compose-btn" data-phone-action="ask_for_help">Ask for help</button>`;
        if (canCallForHousing) compose += `<button class="phone-compose-btn" data-phone-action="call_friend_for_housing">Call about a place to stay</button>`;
        compose += '</div>';
      }
    } else if (slot === 'family') {
      const readFamInter = ctx.content.getInteraction('read_family_message');
      const replyFamInter = ctx.content.getInteraction('reply_to_family');
      const canReadFam = readFamInter && readFamInter.available({ contact: slot });
      const canReplyFam = replyFamInter && replyFamInter.available({ contact: slot });
      if (canReadFam || canReplyFam) {
        compose = '<div class="phone-compose">';
        if (canReadFam) compose += `<button class="phone-compose-btn" data-phone-action="read_family_message">Read</button>`;
        if (canReplyFam) compose += `<button class="phone-compose-btn" data-phone-action="reply_to_family">Reply</button>`;
        compose += '</div>';
      }
    }

    return buildPhoneStatusBar(timeStr, batteryPct)
      + `<div class="phone-nav-header"><button class="phone-nav-back" data-phone-nav="messages">&#x2039;</button><span class="phone-nav-title">${escPhoneText(name)}</span></div>`
      + `<div class="phone-thread-messages" id="phone-thread-scroll">${bubbles}</div>`
      + compose
      + `<button class="phone-home-bar" data-phone-action="put_phone_away">&#x2014;</button>`;
  }

  function renderPhone() {
    if (!phoneEl) return;
    phoneEl.removeAttribute('hidden');
    document.body.classList.add('phone-open');

    // Cracked screen — cosmetic overlay, set once from character property
    if (ctx.character.get('phone_cracked')) {
      phoneEl.classList.add('phone--cracked');
    } else {
      phoneEl.classList.remove('phone--cracked');
    }

    const screen = phoneScreen;
    const threadContact = phoneThreadContact;
    const noteIndex = phoneNoteIndex;
    const battery = ctx.state.get('phone_battery');
    const inbox = ctx.state.get('phone_inbox') || [];
    const notes = ctx.state.get('notes') || [];
    const timeStr = phoneTimeStr();
    const dateStr = phoneDateStr();

    let html = '';
    if (screen === 'notifications') {
      html = buildPhoneNotificationsScreen(timeStr, battery);
    } else if (screen === 'messages') {
      html = buildPhoneMessagesScreen(timeStr, battery, inbox);
    } else if (screen === 'thread' && threadContact) {
      html = buildPhoneThreadScreen(timeStr, battery, inbox, threadContact);
    } else if (screen === 'notes') {
      html = buildPhoneNotesScreen(timeStr, battery, notes);
    } else if (screen === 'alarms') {
      html = buildPhoneAlarmScreen(timeStr, battery);
    } else if (screen === 'calendar') {
      html = buildPhoneCalendarScreen(timeStr, battery);
    } else if (screen === 'timer') {
      html = buildPhoneTimerScreen(timeStr, battery);
    } else if (screen === 'note_view' && noteIndex !== null && noteIndex !== undefined) {
      html = buildPhoneNoteViewScreen(timeStr, battery, notes, noteIndex);
    } else if (screen === 'job_search') {
      html = buildPhoneJobSearchScreen(timeStr, battery);
    } else {
      const unreadCount = inbox.filter(m => !m.read && m.direction !== 'sent').length;
      html = buildPhoneHomeScreen(timeStr, dateStr, battery, unreadCount);
    }

    phoneEl.innerHTML = html;

    // Scroll thread to bottom
    if (screen === 'thread') {
      const scrollEl = document.getElementById('phone-thread-scroll');
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
    }

    // Supervisor/bank threads still auto-mark-read on open (no sim consequence — read state
    // for those threads is pure UI bookkeeping; no guilt, no contact timestamp).
    if (screen === 'thread' && threadContact && (threadContact === 'supervisor' || threadContact === 'bank')) {
      const msgs = contactMessages(inbox, threadContact);
      for (const msg of msgs) {
        if (!msg.read) msg.read = true;
      }
    }
    // Friend thread side-effects (mark read, friend_contact timestamp, guilt) are dispatched
    // through the `read_friend_thread` interaction at click time — see phoneClickHandler.
  }

  function phoneClickHandler(e) {
    const target = /** @type {HTMLElement} */ (e.target);
    const btn = target.closest('[data-phone-nav],[data-phone-action]');
    if (!btn) return;

    const nav = btn.getAttribute('data-phone-nav');
    const action = btn.getAttribute('data-phone-action');

    if (nav) {
      e.stopPropagation();
      if (nav === 'notifications') {
        phonePrevScreen = phoneScreen;
        phoneScreen = 'notifications';
      } else if (nav === 'back') {
        phoneScreen = phonePrevScreen || 'home';
        phonePrevScreen = null;
      } else if (nav === 'home') {
        phoneScreen = 'home';
        phoneThreadContact = null;
      } else if (nav === 'messages') {
        phoneScreen = 'messages';
        phoneThreadContact = null;
      } else if (nav === 'thread') {
        const contact = btn.getAttribute('data-contact');
        // For friend threads, dispatch read_friend_thread so read receipts / guilt / contact
        // timestamp go through the action pipeline (replay-coherent). Family / supervisor / bank
        // threads handle their own read semantics (read_family_message; UI bookkeeping for the rest).
        if (contact && isFriendSlot(contact)) {
          const inter = ctx.content.getInteraction('read_friend_thread');
          if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { contact });
        }
        phoneThreadContact = contact;
        phoneScreen = 'thread';
      } else if (nav === 'notes') {
        phoneScreen = 'notes';
        const inter = ctx.content.getInteraction('open_notes_app');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
        return; // onAction triggers re-render via game pipeline
      } else if (nav === 'alarms') {
        phoneScreen = 'alarms';
        const inter = ctx.content.getInteraction('open_alarm_app');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
        return; // onAction triggers re-render via game pipeline
      } else if (nav === 'calendar') {
        phoneScreen = 'calendar';
        const inter = ctx.content.getInteraction('open_calendar_app');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
        return; // onAction triggers re-render via game pipeline
      } else if (nav === 'timer') {
        phoneScreen = 'timer';
        const inter = ctx.content.getInteraction('open_timer_app');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
        return; // onAction triggers re-render via game pipeline
      } else if (nav === 'note_view') {
        const idxStr = btn.getAttribute('data-note-index');
        const idx = idxStr !== null ? parseInt(idxStr, 10) : null;
        phoneNoteIndex = idx;
        phoneScreen = 'note_view';
        const inter = ctx.content.getInteraction('read_note');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { index: idx });
        return; // onAction triggers re-render via game pipeline
      } else if (nav === 'job_search') {
        phoneScreen = 'job_search';
        const inter = ctx.content.getInteraction('job_search');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
        return; // onAction triggers re-render via game pipeline
      }
      renderPhone();
    } else if (action) {
      e.stopPropagation();
      if (action === 'put_phone_away') {
        const inter = ctx.content.getInteraction('put_phone_away');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
      } else if (action === 'reply_to_friend') {
        const inter = ctx.content.getInteraction('reply_to_friend');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { contact: phoneThreadContact });
      } else if (action === 'message_friend') {
        const inter = ctx.content.getInteraction('message_friend');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { contact: phoneThreadContact });
      } else if (action === 'help_friend') {
        const amountInput = /** @type {HTMLInputElement | null} */ (document.getElementById('phone-help-amount'));
        const amount = amountInput ? parseFloat(amountInput.value) : 0;
        if (!amount || amount <= 0) return;
        const inter = ctx.content.getInteraction('help_friend');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { amount, contact: phoneThreadContact });
      } else if (action === 'ask_for_help') {
        const inter = ctx.content.getInteraction('ask_for_help');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { contact: phoneThreadContact });
      } else if (action === 'call_friend_for_housing') {
        const inter = ctx.content.getInteraction('call_friend_for_housing');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
      } else if (action === 'read_family_message') {
        const inter = ctx.content.getInteraction('read_family_message');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { contact: phoneThreadContact });
      } else if (action === 'reply_to_family') {
        const inter = ctx.content.getInteraction('reply_to_family');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { contact: phoneThreadContact });
      } else if (action === 'toggle_phone_silent') {
        const inter = ctx.content.getInteraction('toggle_phone_silent');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
      } else if (action === 'write_note') {
        const textInput = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('phone-note-text'));
        const text = textInput ? textInput.value.trim() : '';
        if (!text) return;
        const inter = ctx.content.getInteraction('write_note');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { text });
      } else if (action === 'set_alarm_app') {
        const hourEl = /** @type {HTMLSelectElement | null} */ (document.getElementById('phone-alarm-hour'));
        const minEl = /** @type {HTMLSelectElement | null} */ (document.getElementById('phone-alarm-min'));
        const ampmEl = /** @type {HTMLSelectElement | null} */ (document.getElementById('phone-alarm-ampm'));
        if (!hourEl || !minEl || !ampmEl) return;
        let h = parseInt(hourEl.value, 10);
        const m = parseInt(minEl.value, 10);
        const ampm = ampmEl.value;
        // Convert to 24h minutes-since-midnight
        if (ampm === 'AM') {
          h = h === 12 ? 0 : h;
        } else {
          h = h === 12 ? 12 : h + 12;
        }
        const alarmTod = h * 60 + m;
        const inter = ctx.content.getInteraction('set_alarm');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { alarmTod });
      } else if (action === 'cancel_alarm_app') {
        const inter = ctx.content.getInteraction('cancel_alarm_app');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
      } else if (action === 'start_timer') {
        const durationStr = btn.getAttribute('data-duration');
        const duration = durationStr !== null ? parseInt(durationStr, 10) : 20;
        const inter = ctx.content.getInteraction('start_timer');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { duration });
      } else if (action === 'cancel_timer') {
        const inter = ctx.content.getInteraction('cancel_timer');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
      } else if (action === 'apply_for_job') {
        const companyType = btn.getAttribute('data-company-type') || 'small';
        const inter = ctx.content.getInteraction('apply_for_job');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter), { company_type: companyType });
      } else if (action === 'apply_for_unemployment') {
        const inter = ctx.content.getInteraction('apply_for_unemployment');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
      } else if (action === 'check_application') {
        const inter = ctx.content.getInteraction('check_application');
        if (inter && onAction) onAction(/** @type {Interaction} */ (inter));
      }
    }
  }

  function hidePhone() {
    if (!phoneEl) return;
    phoneEl.setAttribute('hidden', '');
    document.body.classList.remove('phone-open');
  }

  // --- Full render ---

  function render() {
    const viewing = ctx.state.get('viewing_phone');
    if (viewing) {
      // Show phone overlay; clear main content areas
      showPassage('');
      showActions([]);
      showMovement([]);
      renderPhone();
      wasViewingPhone = true;
      return;
    }

    // Detect viewing_phone true → false transition; reset phone-local nav.
    if (wasViewingPhone) {
      resetPhoneNav();
      wasViewingPhone = false;
    }

    hidePhone();

    const location = ctx.world.getLocationId();
    const descFn = /** @type {Record<string, (() => string) | undefined>} */ (ctx.content.locationDescriptions)[location];
    const description = descFn ? descFn() : '';

    showPassage(description);

    const interactions = ctx.content.getAvailableInteractions();
    const connections = ctx.world.getConnections();
    const allIds = [
      ...interactions.map(i => i.id),
      ...connections.map(c => 'move:' + c.id),
    ];
    const prediction = ctx.habits.predictHabit(allIds);
    showActions(interactions, prediction);
    showMovement(connections, prediction);
  }

  // --- Awareness display ---

  function updateAwareness() {
    // Decay focus each update
    timeFocus = Math.max(0.1, timeFocus - 0.08);
    moneyFocus = Math.max(0.1, moneyFocus - 0.08);

    // Read perceived strings from state
    awarenessTimeEl.textContent = ctx.state.perceivedTimeString();
    awarenessMoneyEl.textContent = ctx.state.perceivedMoneyString();

    // Apply focus-driven opacity and color
    awarenessTimeEl.style.opacity = String(timeFocus);
    awarenessTimeEl.style.color = lerpColor(timeFocus);
    awarenessMoneyEl.style.opacity = String(moneyFocus);
    awarenessMoneyEl.style.color = lerpColor(moneyFocus);
  }

  function boostTimeFocus() {
    timeFocus = 1.0;
  }

  function boostMoneyFocus() {
    moneyFocus = 1.0;
  }

  function showAwareness() {
    awarenessEl.classList.remove('hidden');
  }

  function hideAwareness() {
    awarenessEl.classList.add('hidden');
  }

  return {
    init,
    showPassage,
    showEventText,
    clearEventText,
    appendEventText,
    appendInnerVoice,
    showActions,
    showMovement,
    resetIdleTimer,
    stopIdleTimer,
    render,
    updateAwareness,
    boostTimeFocus,
    boostMoneyFocus,
    showAwareness,
    hideAwareness,
  };
}

