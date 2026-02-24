// world.js — locations, movement, event triggers

export function createWorld(ctx) {

  const MESS_TIER_RANK = { tidy: 0, cluttered: 1, messy: 2, chaotic: 3 };

  // --- Location definitions ---
  // Each location has an id, connections, and travel times (in minutes)

  /** @type {Record<string, LocationDef>} */
  const locations = {
    apartment_bedroom: {
      name: 'bedroom',
      area: 'apartment',
      connections: {
        apartment_kitchen: 1,
        apartment_bathroom: 1,
      },
    },
    apartment_kitchen: {
      name: 'kitchen',
      area: 'apartment',
      connections: {
        apartment_bedroom: 1,
        apartment_bathroom: 1,
        street: 2,
      },
    },
    apartment_bathroom: {
      name: 'bathroom',
      area: 'apartment',
      connections: {
        apartment_bedroom: 1,
        apartment_kitchen: 1,
      },
    },
    street: {
      name: 'street',
      area: 'outside',
      connections: {
        apartment_kitchen: 2,
        bus_stop: 3,
        corner_store: 4,
        soup_kitchen: 8,
        food_bank: 12,
      },
    },
    bus_stop: {
      name: 'bus stop',
      area: 'outside',
      connections: {
        street: 3,
        workplace: { time: 20, available: () => ctx.state.isWorkday() }, // Bus ride; weekends off
      },
    },
    workplace: {
      name: 'workplace',
      area: 'work',
      connections: {
        bus_stop: 20,
        workplace_bathroom: 2,
      },
    },
    workplace_bathroom: {
      name: 'restroom',
      area: 'work',
      connections: {
        workplace: 2,
      },
    },
    corner_store: {
      name: 'corner store',
      area: 'outside',
      connections: {
        street: 4,
      },
    },
    soup_kitchen: {
      name: 'community meal',
      area: 'outside',
      connections: {
        street: 8,
      },
    },
    food_bank: {
      name: 'food bank',
      area: 'outside',
      connections: {
        street: 12,
      },
    },
  };

  /** @param {string} id */
  function getLocation(id) {
    return locations[id] || null;
  }

  function getCurrentLocation() {
    return locations[ctx.state.get('location')];
  }

  function getLocationId() {
    return ctx.state.get('location');
  }

  /**
   * Extract travel time from a connection entry (number or {time, available?} object).
   * @param {number | {time: number, available?: () => boolean}} entry
   */
  function connTime(entry) {
    return typeof entry === 'number' ? entry : entry.time;
  }

  /**
   * Check if a connection is currently available.
   * @param {number | {time: number, available?: () => boolean}} entry
   */
  function connAvailable(entry) {
    if (typeof entry === 'number') return true;
    return entry.available ? entry.available() : true;
  }

  function getConnections() {
    const loc = getCurrentLocation();
    if (!loc) return [];
    const connections = [];
    for (const [destId, entry] of Object.entries(loc.connections)) {
      if (!connAvailable(entry)) continue;
      const dest = locations[destId];
      if (dest) {
        connections.push({
          id: destId,
          name: dest.name,
          travelTime: connTime(entry),
          area: dest.area,
        });
      }
    }
    return connections;
  }

  /** @param {string} destId */
  function canTravel(destId) {
    const loc = getCurrentLocation();
    if (!loc) return false;
    const entry = loc.connections[destId];
    if (entry === undefined) return false;
    return connAvailable(entry);
  }

  /** @param {string} destId */
  function travelTo(destId) {
    const loc = getCurrentLocation();
    if (!loc || !canTravel(destId)) return null;

    const travelTime = connTime(loc.connections[destId]);
    const prevLocation = ctx.state.get('location');

    ctx.state.set('previous_location', prevLocation);
    ctx.state.set('location', destId);
    ctx.state.advanceTime(travelTime);
    ctx.state.set('location_arrival_time', ctx.state.get('time')); // reset habituation for new location

    // Travel costs energy — more if tired or hungry
    const energyCost = travelTime > 10 ? -5 : -1;
    ctx.state.adjustEnergy(energyCost);

    // Bus ride is stressful when crowded (morning/evening)
    if ((prevLocation === 'bus_stop' || destId === 'bus_stop') && travelTime >= 20) {
      const hour = ctx.state.getHour();
      if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
        ctx.state.adjustStress(3);
      }
    }

    // Arriving at corner store — increment lifetime visit count for recognition tiers
    if (destId === 'corner_store') {
      ctx.state.set('corner_store_visits', ctx.state.get('corner_store_visits') + 1);
    }

    // Arriving at work
    if (destId === 'workplace') {
      if (!ctx.events.any('arrived_at_work', ctx.state.get('wake_period_start'))) {
        ctx.events.record('arrived_at_work');
        // Track attendance for paycheck calculation
        ctx.state.set('days_worked_this_period', ctx.state.get('days_worked_this_period') + 1);
        const tod = ctx.state.timeOfDay();
        const todayShift = ctx.state.shiftFor(ctx.state.currentAbsoluteDay());
        const shiftStart = todayShift?.start ?? ctx.state.get('labor_arrangement').shift_start;
        if (tod > shiftStart + 15) {
          ctx.state.set('times_late_this_week', ctx.state.get('times_late_this_week') + 1);
          ctx.state.adjustJobStanding(-5);
          ctx.events.record('late_for_work', { minutesLate: Math.round(tod - shiftStart) });
        } else {
          // On time — demonstrates reliability
          ctx.state.adjustJobStanding(2);
        }
        ctx.events.record('arrived_at_work', { late: tod > shiftStart + 15, minutesLate: Math.round(tod - shiftStart) });
      }
    }

    return {
      from: prevLocation,
      to: destId,
      travelTime,
    };
  }

  // --- Event checking ---
  // Returns events that should fire based on current state

  /** @returns {string[]} */
  function checkEvents() {
    /** @type {(string | undefined)[]} */
    const events = [];
    const tod = ctx.state.timeOfDay();
    const hour = ctx.state.getHour();
    const location = ctx.state.get('location');

    // Scheduled interrupts — fire any whose triggerAt has passed
    const firedInterrupts = ctx.state.fireScheduledInterrupts();
    for (const interrupt of firedInterrupts) {
      if (interrupt.type === 'alarm') {
        ctx.events.record('woke_by_alarm', {});
        events.push('alarm');
      } else if (interrupt.type === 'schedule_reveal') {
        const arr = ctx.state.get('labor_arrangement');
        const day = interrupt.data.absoluteDay;
        // Approximation debt (work scheduling): always assigns shift if potential work day.
        // Real model: probability based on employer demand, season, hours throttling.
        // See docs/design/work-scheduling.md.
        const shift = ctx.state.isPotentialWorkDayFor(day)
          ? { start: arr.shift_start, end: arr.shift_end }
          : null;
        ctx.state.setKnownShift(day, shift);
        // Schedule next reveal: same time tomorrow, for the day after that.
        const nextRevealAt = interrupt.triggerAt + 1440;
        const nextDay = day + 1;
        ctx.state.scheduleInterrupt('schedule_reveal', nextRevealAt, 'schedule_reveal', { absoluteDay: nextDay });
        if (shift) events.push('schedule_reveal');
      } else if (interrupt.type === 'time_to_leave') {
        // Reschedule daily regardless — fires every day, only generates an event on workdays
        // when the player is still home.
        ctx.state.rescheduleInterrupt(interrupt.id, interrupt.triggerAt + 1440);
        const shift = ctx.state.shiftFor(ctx.state.currentAbsoluteDay());
        if (shift && locations[location]?.area === 'apartment') events.push('time_to_leave');
      }
      // Future interrupt types: 'medication_reminder', 'timer', 'calendar_alert', etc.
    }

    // Late for work stress — fires once per tier crossing (fine → late → very_late).
    // Deterministic: no RNG consumed. Resets each morning (scoped to wake_period_start).
    // Only fires on workdays — weekends have no shift to be late for.
    const LATE_TIER_RANK = { fine: 0, late: 1, very_late: 2 };
    if (hour < 12 && ctx.state.isWorkday()) {
      const lTier = ctx.state.lateTier();
      const wps = ctx.state.get('wake_period_start');
      const lastNoticed = ctx.events.last('late_anxiety_noticed');
      const lastLTier = (lastNoticed && lastNoticed.time >= wps) ? lastNoticed.data.tier : null;
      const currentLateRank = LATE_TIER_RANK[lTier] ?? 0;
      const lastLateRank = lastLTier !== null && lastLTier in LATE_TIER_RANK ? LATE_TIER_RANK[lastLTier] : -1;
      if (lTier !== 'fine' && currentLateRank > lastLateRank) {
        ctx.events.record('late_anxiety_noticed', { tier: lTier });
        events.push('late_anxiety');
      }
    }

    // Hunger pang — fires once per tier crossing (hungry → very_hungry → starving).
    // Deterministic: no RNG consumed. Resets when eating.
    const hTier = ctx.state.hungerTier();
    const lastHTier = ctx.state.get('last_surfaced_hunger_tier');
    const hungerTierRank = { hungry: 0, very_hungry: 1, starving: 2 };
    if (hTier in hungerTierRank) {
      const current = hungerTierRank[hTier];
      const last = lastHTier !== null && lastHTier in hungerTierRank ? hungerTierRank[lastHTier] : -1;
      if (current > last) {
        ctx.state.set('last_surfaced_hunger_tier', hTier);
        events.push('hunger_pang');
      }
    }

    // Thirst pang — fires once per tier crossing (thirsty → very_thirsty → parched).
    // Deterministic: no RNG consumed. Resets when drinking.
    const tTier = ctx.state.thirstTier();
    const lastTTier = ctx.state.get('last_surfaced_thirst_tier');
    const thirstTierRank = { thirsty: 0, very_thirsty: 1, parched: 2 };
    if (tTier in thirstTierRank) {
      const current = thirstTierRank[tTier];
      const last = lastTTier !== null && lastTTier in thirstTierRank ? thirstTierRank[lastTTier] : -1;
      if (current > last) {
        ctx.state.set('last_surfaced_thirst_tier', tTier);
        events.push('thirst_pang');
      }
    }

    // Bladder pang — fires once per tier crossing (aware → urgent → pressing).
    // Deterministic: no RNG consumed. Resets when voiding.
    const bTier = ctx.state.bladderNeedTier();
    const lastBTier = ctx.state.get('last_surfaced_bladder_tier');
    const bladderTierRank = { aware: 0, urgent: 1, pressing: 2 };
    if (bTier in bladderTierRank) {
      const current = bladderTierRank[bTier];
      const last = lastBTier !== null && lastBTier in bladderTierRank ? bladderTierRank[lastBTier] : -1;
      if (current > last) {
        ctx.state.set('last_surfaced_bladder_tier', bTier);
        events.push('bladder_pang');
      }
    }

    // Exhaustion wave — fires once per tier crossing (exhausted → depleted).
    // Deterministic: no RNG consumed. Resets when energy recovers.
    const eTier = ctx.state.energyTier();
    const lastETier = ctx.state.get('last_surfaced_energy_tier');
    const energyTierRank = { exhausted: 0, depleted: 1 };
    if (eTier in energyTierRank) {
      const current = energyTierRank[eTier];
      const last = lastETier !== null && lastETier in energyTierRank ? energyTierRank[lastETier] : -1;
      if (current > last) {
        ctx.state.set('last_surfaced_energy_tier', eTier);
        events.push('exhaustion_wave');
      }
    }

    // Vasovagal prodrome / episode — fires on tier escalation. Deterministic: no RNG consumed.
    // Episode resets risk, starts recovery, and applies immediate physiological effects.
    const vvTier = ctx.state.vasovagalTier();
    const lastVVTier = ctx.state.get('last_surfaced_vasovagal_tier');
    const vvRank = { building: 0, prodrome: 1, episode: 2 };
    if (vvTier in vvRank) {
      const current = vvRank[vvTier];
      const last = lastVVTier !== null && lastVVTier in vvRank ? vvRank[lastVVTier] : -1;
      if (current > last) {
        ctx.state.set('last_surfaced_vasovagal_tier', vvTier);
        if (vvTier === 'episode') {
          ctx.state.set('vasovagal_risk', 0);
          ctx.state.set('vasovagal_recovery', 80);
          ctx.state.set('last_surfaced_vasovagal_tier', null);
          ctx.state.adjustNT('norepinephrine', 15); // compensatory NE surge before the drop
          ctx.state.adjustNT('adenosine', 20);      // post-event fatigue load
          ctx.state.set('nausea', Math.min(100, ctx.state.get('nausea') + 30));
          ctx.state.adjustEnergy(-20);
          events.push('vasovagal_episode');
        } else if (vvTier === 'prodrome') {
          events.push('vasovagal_prodrome');
        }
        // 'building': silent — visible in location descriptions only
      }
    }
    // Reset surfaced tier when risk fully clears
    if (vvTier === 'none') {
      ctx.state.set('last_surfaced_vasovagal_tier', null);
    }

    // Weather change
    if (ctx.timeline.chance(0.03)) {
      events.push('weather_shift');
    }

    // Workplace events
    if (location === 'workplace') {
      if (ctx.timeline.chance(0.1)) {
        events.push(ctx.timeline.pick(['coworker_speaks', 'work_task_appears', 'break_room_noise']));
      }

      // Coworker notices — deterministic checks, no RNG consumed here.
      // (a) Absence: ≥2 work days (~2880 min) since any coworker interaction, warmth above neutral,
      //     not fired in last ~3 work days (~4320 min). Fires at most once per long silence.
      // (b) Stress: player is strained/overwhelmed, not fired in last ~1 work day (~1440 min).
      //     Independent from absence — two different reasons a coworker notices.
      if (ctx.state.isWorkHours()) {
        const now = ctx.state.get('time');
        const WORK_DAY_MIN = 1440; // minutes per calendar day (proxy for work day spacing)
        const lastTalked = ctx.events.last('talked_to_coworker');
        const lastSpoke = ctx.events.last('coworker_speaks');
        const lastInteraction = Math.max(
          lastTalked ? lastTalked.time : 0,
          lastSpoke ? lastSpoke.time : 0,
        );
        const lastNotice = ctx.events.last('coworker_notices');

        // Check warmth: at least one coworker must care enough to reach out.
        // Use slot coworker1 as representative — ties to the specific coworker will vary inside
        // the event handler, which picks a slot then checks that slot's warmth only at fire time.
        // Here we just gate on whether either coworker has warmth > 0.25 (above neutral).
        const c1Warmth = ctx.state.sentimentIntensity('coworker1', 'warmth');
        const c2Warmth = ctx.state.sentimentIntensity('coworker2', 'warmth');
        const anyWarmth = c1Warmth > 0.25 || c2Warmth > 0.25;

        // (a) Absence check
        const silenceDuration = now - lastInteraction;
        const noticeCooldown = lastNotice ? (now - lastNotice.time) : Infinity;
        if (
          anyWarmth
          && silenceDuration >= 2 * WORK_DAY_MIN      // quiet for 2+ calendar days
          && noticeCooldown >= 3 * WORK_DAY_MIN        // hasn't checked in for 3+ days
          && lastInteraction > 0                        // there was prior contact (not first day)
        ) {
          events.push('coworker_notices_absence');
        } else {
          // (b) Stress check — independent from absence, shorter cooldown
          const stressTier = ctx.state.stressTier();
          const lastStressNotice = ctx.events.last('coworker_notices');
          const stressCooldown = lastStressNotice ? (now - lastStressNotice.time) : Infinity;
          if (
            anyWarmth
            && ['strained', 'overwhelmed'].includes(stressTier)
            && stressCooldown >= WORK_DAY_MIN           // at most once per calendar day
          ) {
            events.push('coworker_notices_stress');
          }
        }
      }
    }

    // Apartment ambient
    if (locations[location]?.area === 'apartment') {
      if (ctx.timeline.chance(0.06)) {
        // Always push apartment_sound for the ambient chance roll.
        // apartment_notice fires separately — deterministically on tier worsening.
        // Explicit balance call: preserves RNG consumption vs. the old ctx.timeline.pick() that
        // chose between apartment_sound and apartment_notice on this path.
        ctx.timeline.random();
        events.push('apartment_sound');
      }
      // apartment_notice fires when mess tier has worsened since last surfacing.
      // Deterministic: no RNG consumed. Resets when cleaning (apartment_cleaned event) or on wake.
      // Ignore tidy — no notice warranted when things are tidy.
      const currentMessTier = ctx.mess.tier();
      const wps = ctx.state.get('wake_period_start');
      const lastCleaned = ctx.events.last('apartment_cleaned');
      const noticeFloor = (lastCleaned && lastCleaned.time >= wps) ? lastCleaned.time : wps;
      const lastNotice = ctx.events.last('apartment_notice_surfaced');
      const lastSurfacedTier = (lastNotice && lastNotice.time >= noticeFloor) ? lastNotice.data.tier : null;
      const currentRank = MESS_TIER_RANK[currentMessTier] ?? 0;
      const lastRank = lastSurfacedTier !== null ? (MESS_TIER_RANK[lastSurfacedTier] ?? 0) : -1;
      if (currentMessTier !== 'tidy' && currentRank > lastRank) {
        ctx.events.record('apartment_notice_surfaced', { tier: currentMessTier });
        events.push('apartment_notice');
      }
    }

    // Street ambient
    if (location === 'street' || location === 'bus_stop') {
      if (ctx.timeline.chance(0.08)) {
        events.push(ctx.timeline.pick(['street_ambient', 'someone_passes']));
      }
    }

    // Vomiting — pending flag set in advanceTime() when nausea exceeds threshold.
    // Deterministic: no RNG consumed here. Fires and clears the flag.
    if (ctx.state.get('pending_vomit')) {
      ctx.state.set('pending_vomit', false);
      events.push('vomit');
    }

    // Bill due — fires once per bill when a bill arrives and money is insufficient.
    // Deterministic: no RNG consumed. Each pending bill fires its arrival event exactly once
    // (notified flag prevents re-fire on subsequent checkEvents calls).
    const pendingBills = ctx.state.get('pending_bills') || [];
    for (const bill of pendingBills) {
      if (!bill.notified) {
        bill.notified = true;
        events.push('bill_due_' + bill.name);
      }
    }

    return /** @type {string[]} */ (events.filter(e => e !== undefined));
  }

  // --- Weather ---

  function updateWeather() {
    const weathers = [
      { weight: 3, value: 'overcast' },
      { weight: 2, value: 'clear' },
      { weight: 2, value: 'grey' },
      { weight: 1, value: 'drizzle' },
    ];
    // Snow: only in winter when cold enough
    if (ctx.state.season() === 'winter' && ctx.state.seasonalTemperatureBaseline() <= 2) {
      weathers.push({ weight: 2, value: 'snow' });
    }
    const newWeather = ctx.timeline.weightedPick(weathers);
    ctx.state.set('weather', newWeather);
    ctx.state.set('rain', newWeather === 'drizzle');
    // Temperature is a derived value (ambientTemperature() in state.js); no state written here.
  }

  function isInside() {
    const area = getCurrentLocation()?.area;
    return area === 'apartment' || area === 'work';
  }

  function isHome() {
    return getCurrentLocation()?.area === 'apartment';
  }

  function isWorkplace() {
    return getCurrentLocation()?.area === 'work';
  }

  return {
    locations,
    getLocation,
    getCurrentLocation,
    getLocationId,
    getConnections,
    canTravel,
    travelTo,
    checkEvents,
    updateWeather,
    isInside,
    isHome,
    isWorkplace,
  };
}

