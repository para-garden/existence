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

    // Arriving at work
    if (destId === 'workplace') {
      if (!ctx.events.any('arrived_at_work', ctx.state.get('wake_period_start'))) {
        ctx.events.record('arrived_at_work');
        // Condition resolved — reset late tier tracking so it can fire again next day.
        ctx.state.set('last_surfaced_late_tier', null);
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
        // Approximation debt: always assigns shift if potential work day.
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
      }
      // Future interrupt types: 'medication_reminder', 'timer', 'calendar_alert', etc.
    }

    // Late for work stress — fires once per tier crossing (fine → late → very_late).
    // Deterministic: no RNG consumed. Resets each morning in wakeUp() and on work arrival.
    // Only fires on workdays — weekends have no shift to be late for.
    const LATE_TIER_RANK = { fine: 0, late: 1, very_late: 2 };
    if (hour < 12 && ctx.state.isWorkday()) {
      const lTier = ctx.state.lateTier();
      const lastLTier = ctx.state.get('last_surfaced_late_tier');
      const currentLateRank = LATE_TIER_RANK[lTier] ?? 0;
      const lastLateRank = lastLTier !== null && lastLTier in LATE_TIER_RANK ? LATE_TIER_RANK[lastLTier] : -1;
      if (lTier !== 'fine' && currentLateRank > lastLateRank) {
        ctx.state.set('last_surfaced_late_tier', lTier);
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

    // Weather change
    if (ctx.timeline.chance(0.03)) {
      events.push('weather_shift');
    }

    // Workplace events
    if (location === 'workplace') {
      if (ctx.timeline.chance(0.1)) {
        events.push(ctx.timeline.pick(['coworker_speaks', 'work_task_appears', 'break_room_noise']));
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
      // Deterministic: no RNG consumed. Resets when cleaning or on wake.
      // Ignore tidy — no notice warranted when things are tidy.
      const currentMessTier = ctx.mess.tier();
      const lastSurfaced = ctx.state.get('last_surfaced_mess_tier');
      const currentRank = MESS_TIER_RANK[currentMessTier] ?? 0;
      const lastRank = lastSurfaced !== null ? (MESS_TIER_RANK[lastSurfaced] ?? 0) : -1;
      if (currentMessTier !== 'tidy' && currentRank > lastRank) {
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
    // Temperature: seasonal baseline + weather offset + diurnal variation
    // (advanceTime keeps this updated continuously; updateWeather recalculates on weather change)
    const base = ctx.state.seasonalTemperatureBaseline();
    const weatherOffset = newWeather === 'drizzle' ? -3
      : newWeather === 'overcast' ? -1
      : newWeather === 'snow' ? -2
      : 0;
    ctx.state.set('temperature', Math.round((base + weatherOffset + ctx.state.diurnalTemperatureOffset()) * 10) / 10);
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

