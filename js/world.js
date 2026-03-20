// world.js — locations, movement, event triggers

/** @param {GameContext} ctx */
export function createWorld(ctx) {

  const MESS_TIER_RANK = { tidy: 0, cluttered: 1, messy: 2, chaotic: 3 };

  // --- Location definitions ---
  // Each location has an id, connections, and travel times (in minutes)

  /** @type {Record<string, LocationDef>} */
  const locations = {
    apartment_bedroom: {
      name: 'bedroom',
      area: 'apartment',
      smoke_exposure: 0,
      acoustic: { reverb: 0.2, absorption: 0.7, floor: 'carpet' },
      connections: {
        apartment_kitchen: 1,
        apartment_bathroom: 1,
        apartment_living_room: 1,
      },
    },
    apartment_living_room: {
      name: 'living room',
      area: 'apartment',
      smoke_exposure: 0,
      acoustic: { reverb: 0.25, absorption: 0.6, floor: 'carpet' },
      connections: {
        apartment_bedroom: 1,
        apartment_kitchen: 1,
      },
    },
    apartment_kitchen: {
      name: 'kitchen',
      area: 'apartment',
      smoke_exposure: 0,
      acoustic: { reverb: 0.3, absorption: 0.35, floor: 'linoleum' },
      connections: {
        apartment_bedroom: 1,
        apartment_bathroom: 1,
        apartment_living_room: 1,
        street: 2,
      },
    },
    apartment_bathroom: {
      name: 'bathroom',
      area: 'apartment',
      smoke_exposure: 0,
      acoustic: { reverb: 0.6, absorption: 0.2, floor: 'tile' },
      connections: {
        apartment_bedroom: 1,
        apartment_kitchen: 1,
        // apartment_living_room not connected — bathroom is a side room accessed via bedroom or kitchen, not directly from living room
      },
    },
    street: {
      name: 'street',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.1, absorption: 0.3, floor: 'asphalt' },
      connections: {
        apartment_kitchen: 2,
        bus_stop: 3,
        corner_store: 4,
        park: 7,
        soup_kitchen: 8,
        food_bank: 12,
        library: 10,
        friends_apartment: 15,
        shelter: 10,
        clinic: 15,
        pharmacy: 10,
        er: 25,
        gym: {
          time: 20,
          available: () => ctx.state.get('gym_membership') === true,
        },
      },
    },
    gym: {
      name: 'the gym',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.45, absorption: 0.3, floor: 'rubber' },
      connections: {
        street: 20,
      },
    },
    bus_stop: {
      name: 'bus stop',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.15, absorption: 0.25, floor: 'concrete' },
      connections: {
        street: 3,
        workplace: { time: 20, available: () => ctx.state.isWorkday() }, // Bus ride; weekends off
      },
    },
    workplace: {
      name: 'workplace',
      area: 'work',
      // Approximation debt (secondhand smoke): varies heavily by jurisdiction and workplace type.
      // Indoor smoking bans cover most developed-country workplaces; 0.07 represents residual
      // exposure (break-room adjacency, building ventilation, pre-ban building history).
      // Jurisdiction gate applied in advanceTime() passive accumulation block.
      smoke_exposure: 0.07,
      acoustic: { reverb: 0.3, absorption: 0.4, floor: 'linoleum' },
      connections: {
        bus_stop: 20,
        workplace_bathroom: 2,
      },
    },
    workplace_bathroom: {
      name: 'restroom',
      area: 'work',
      smoke_exposure: 0,
      acoustic: { reverb: 0.55, absorption: 0.2, floor: 'tile' },
      connections: {
        workplace: 2,
      },
    },
    corner_store: {
      name: 'corner store',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.25, absorption: 0.35, floor: 'linoleum' },
      connections: {
        street: 4,
      },
    },
    park: {
      name: 'park',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.05, absorption: 0.5, floor: 'grass' },
      connections: {
        street: 7,
      },
    },
    library: {
      name: 'library',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.35, absorption: 0.8, floor: 'carpet' },
      connections: {
        street: 10,
      },
    },
    soup_kitchen: {
      name: 'community meal',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.5, absorption: 0.25, floor: 'linoleum' },
      connections: {
        street: 8,
      },
    },
    food_bank: {
      name: 'food bank',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.45, absorption: 0.3, floor: 'concrete' },
      connections: {
        street: 12,
      },
    },
    friends_apartment: {
      name: "your friend's place",
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.2, absorption: 0.65, floor: 'wood' },
      connections: {
        street: 15,
      },
    },
    shelter: {
      name: 'the shelter',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.5, absorption: 0.2, floor: 'linoleum' },
      connections: {
        street: 10,
      },
    },
    clinic: {
      name: 'the clinic',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.35, absorption: 0.4, floor: 'linoleum' },
      connections: {
        street: 15,
      },
    },
    pharmacy: {
      name: 'the pharmacy',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.3, absorption: 0.4, floor: 'linoleum' },
      connections: {
        street: 10,
      },
    },
    er: {
      name: 'the ER',
      area: 'outside',
      smoke_exposure: 0,
      acoustic: { reverb: 0.4, absorption: 0.3, floor: 'linoleum' },
      connections: {
        street: 25,
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

    // Leaving corner store — exit browsing mode if active
    if (prevLocation === 'corner_store' && ctx.state.get('browsing_store')) {
      ctx.state.set('browsing_store', false);
    }

    // Arriving at corner store — increment lifetime visit count for recognition tiers
    if (destId === 'corner_store') {
      ctx.state.set('corner_store_visits', ctx.state.get('corner_store_visits') + 1);
    }

    // Arriving at street or bus_stop — block-level recognition tiers
    if (destId === 'street') {
      ctx.state.set('street_visits', ctx.state.get('street_visits') + 1);
      // Neighbor encounter — daytime only (6am–10pm), one increment per arrival.
      // Neighbor may or may not be out; encounters accumulate via the raw arrival count.
      const tod = ctx.state.timeOfDay();
      if (tod >= 360 && tod <= 1320) { // 6am–10pm
        ctx.state.set('neighbor_encounters', ctx.state.get('neighbor_encounters') + 1);
      }
    }
    if (destId === 'bus_stop') {
      ctx.state.set('bus_stop_visits', ctx.state.get('bus_stop_visits') + 1);
      // Bus regular encounters — morning commute hours (7-9 AM) only
      const busHour = ctx.state.getHour();
      if (busHour >= 7 && busHour < 9) {
        ctx.state.set('bus_regular_encounters', ctx.state.get('bus_regular_encounters') + 1);
      }
    }
    if (destId === 'shelter') {
      ctx.state.set('shelter_visits', ctx.state.get('shelter_visits') + 1);
    }
    if (destId === 'shelter') {
      ctx.state.set('shelter_visits', ctx.state.get('shelter_visits') + 1);
    }

    // Arriving at work
    if (destId === 'workplace') {
      const wps = ctx.state.get('wake_period_start');
      const arrivalCount = ctx.events.count('arrived_at_work', wps);
      const todayShift = ctx.state.shiftFor(ctx.state.currentAbsoluteDay());
      const arr = ctx.state.get('labor_arrangement');
      // Split shifts allow two arrivals per wake period (one per block); contiguous shifts allow one.
      const maxArrivals = (todayShift?.blocks) ? todayShift.blocks.length : 1;
      if (arrivalCount < maxArrivals) {
        ctx.events.record('arrived_at_work');
        const tod = ctx.state.timeOfDay();
        // For split shifts, find which block this arrival is for.
        let blockStart, blockEnd;
        if (todayShift?.blocks) {
          // Find the current/next block based on time of day
          const block = todayShift.blocks.find(b => tod <= b.end + 15) ?? todayShift.blocks[todayShift.blocks.length - 1];
          blockStart = block.start;
          blockEnd = block.end;
        } else {
          blockStart = todayShift?.start ?? arr.shift_start;
          blockEnd = todayShift?.end ?? arr.shift_end;
        }
        // Track hours worked for paycheck calculation — add this block's duration
        const blockHours = (blockEnd - blockStart) / 60;
        ctx.state.set('hours_worked_period', ctx.state.get('hours_worked_period') + blockHours);
        if (tod > blockStart + 15) {
          ctx.state.set('times_late_this_week', ctx.state.get('times_late_this_week') + 1);
          // Approximation debt (job standing): -5 base late penalty chosen; real penalties vary by industry.
          const lateMult = ctx.state.workIncidentMultiplier();
          ctx.state.adjustJobStanding(-5 * lateMult);
          ctx.events.record('work_incident', { type: 'late_arrival', minutesLate: Math.round(tod - blockStart) });
          ctx.events.record('late_for_work', { minutesLate: Math.round(tod - blockStart) });
        } else {
          // On time — demonstrates reliability
          ctx.state.adjustJobStanding(2);
        }
        ctx.events.record('arrived_at_work', { late: tod > blockStart + 15, minutesLate: Math.round(tod - blockStart) });
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
        let shift;
        let revealShiftStart = null;
        let revealShiftEnd = null;
        let revealType = null;

        if (arr.type === 'rotating') {
          // Rotating workers: probabilistic day off and variable shift start.
          // RNG discipline: exactly 2 calls always — call 1 (work vs off), call 2 (shift variation).
          const isWorkDay = ctx.timeline.chance(0.70);  // RNG call 1: ~70% work days
          const variation = (ctx.timeline.random() - 0.5) * 2 * 180;  // RNG call 2: ±3hr in minutes
          if (isWorkDay && ctx.state.isPotentialWorkDayFor(day)) {
            if (arr.split_shift && arr.shift_start_2 != null && arr.shift_end_2 != null) {
              // Split shift rotating: variation shifts both blocks together.
              const baseStart1 = arr.shift_start;
              const baseStart2 = arr.shift_start_2;
              const block1Duration = arr.shift_end - arr.shift_start;
              const block2Duration = arr.shift_end_2 - arr.shift_start_2;
              const newStart1 = Math.max(6 * 60, Math.min(23 * 60, Math.round((baseStart1 + variation) / 60) * 60));
              const newEnd1 = newStart1 + block1Duration;
              const gap = baseStart2 - arr.shift_end;  // gap between blocks stays the same
              const newStart2 = newEnd1 + gap;
              const newEnd2 = (newStart2 + block2Duration) % (24 * 60);
              revealShiftStart = newStart1;
              revealShiftEnd = newEnd2;
              shift = {
                start: newStart1,
                end: newEnd2,
                blocks: [
                  { start: newStart1, end: newEnd1 },
                  { start: newStart2, end: newEnd2 },
                ],
              };
            } else {
              const baseStart = arr.shift_start;
              const newStart = Math.max(6 * 60, Math.min(23 * 60, Math.round((baseStart + variation) / 60) * 60));
              const duration = 8 * 60;
              revealShiftStart = newStart;
              revealShiftEnd = (newStart + duration) % (24 * 60);
              shift = { start: revealShiftStart, end: revealShiftEnd };
            }
            revealType = 'work';
          } else {
            shift = null;  // day off
            revealType = 'off';
          }
        } else {
          // on_demand (and any future arrangement types): deterministic assignment.
          // Approximation debt (work scheduling): always assigns shift if potential work day.
          // Real model: probability based on employer demand, season, hours throttling.
          // See docs/design/work-scheduling.md.
          if (ctx.state.isPotentialWorkDayFor(day)) {
            if (arr.split_shift && arr.shift_start_2 != null && arr.shift_end_2 != null) {
              shift = {
                start: arr.shift_start,
                end: arr.shift_end_2,
                blocks: [
                  { start: arr.shift_start, end: arr.shift_end },
                  { start: arr.shift_start_2, end: arr.shift_end_2 },
                ],
              };
            } else {
              shift = { start: arr.shift_start, end: arr.shift_end };
            }
          } else {
            shift = null;
          }
          revealShiftStart = shift?.start ?? null;
          revealShiftEnd = shift ? (shift.blocks ? shift.blocks[shift.blocks.length - 1].end : shift.end) : null;
          revealType = shift ? 'work' : 'off';
        }

        ctx.state.setKnownShift(day, shift);
        // Schedule next reveal: same time tomorrow, for the day after that.
        const nextRevealAt = interrupt.triggerAt + 1440;
        const nextDay = day + 1;
        ctx.state.scheduleInterrupt('schedule_reveal', nextRevealAt, 'schedule_reveal', { absoluteDay: nextDay });
        // Fire event for both work and off reveals for rotating workers (off day is also news);
        // for on_demand only fire when there's a shift (original behavior).
        if (arr.type === 'rotating') {
          events.push('schedule_reveal');
          // Store reveal result in state for idle thoughts and prose access
          ctx.state.set('upcoming_shift_type', revealType);
          ctx.state.set('upcoming_shift_start', revealShiftStart);
          ctx.state.set('upcoming_shift_end', revealShiftEnd);
        } else if (shift) {
          events.push('schedule_reveal');
        }
      } else if (interrupt.type === 'time_to_leave' || interrupt.type === 'time_to_leave_2') {
        // Reschedule daily regardless — fires every day, only generates an event on workdays
        // when the player is still home (or away from work for the second block).
        ctx.state.rescheduleInterrupt(interrupt.id, interrupt.triggerAt + 1440);
        const shift = ctx.state.shiftFor(ctx.state.currentAbsoluteDay());
        if (shift && locations[location]?.area === 'apartment') events.push('time_to_leave');
      } else if (interrupt.type === 'interview') {
        // Interview fires once — cancel after firing so hasInterrupt('interview')
        // returns false and job_search becomes available again.
        ctx.state.cancelInterrupt(interrupt.id);
        // Pass follow-up flag to event handler via state — eventText.interview() reads ctx.state
        ctx.state.set('interview_is_followup', interrupt.data.isFollowUp === true);
        if (interrupt.data.isFollowUp === true) {
          // Follow-up firing — clear the pending flag
          ctx.state.set('callback_pending', false);
        }
        events.push('interview');
      } else if (interrupt.type === 'dentist') {
        // Dentist appointment fires once — eventText.dentist_appointment() cancels the interrupt
        // so schedule_dentist becomes available again if needed.
        events.push('dentist_appointment');
      } else if (interrupt.type === 'clinic_ready') {
        // Clinic ready — the wait is over; see_doctor_clinic becomes available.
        // Fires once; see_doctor_clinic clears it when executed.
        ctx.state.cancelInterrupt(interrupt.id);
        ctx.state.set('clinic_ready', true);
      } else if (interrupt.type === 'er_ready') {
        // ER ready — triage complete; er_treatment becomes available.
        // Fires once; er_treatment clears it when executed.
        ctx.state.cancelInterrupt(interrupt.id);
        ctx.state.set('er_ready', true);
      } else if (interrupt.type === 'tooth_extraction') {
        // Untreated abscess reaches end-state — emergency extraction.
        ctx.state.cancelInterrupt(interrupt.id);
        events.push('tooth_extraction');
      } else if (interrupt.type === 'family_visit') {
        // Family visit fires once — family member arrives at apartment.
        ctx.state.cancelInterrupt(interrupt.id);
        ctx.state.set('family_visit_active', true);
        ctx.state.set('family_visit_pending', false);
        events.push('family_visit');
      } else if (interrupt.type === 'medication_reminder') {
        // Medication reminder — fires daily at 9 AM for characters with active prescriptions.
        // Reschedule for tomorrow. Cancel if no supply remains.
        const rx = ctx.state.get('clinic_prescriptions') ?? [];
        const supply = ctx.state.get('medication_supply') ?? {};
        const dailyMeds = rx.filter(r => !r.endsWith('_referral') && r !== 'hrt');
        const hasSupply = dailyMeds.some(r => (supply[r] ?? 0) > 0);
        if (hasSupply) {
          // Only show reminder if they haven't taken medication today
          const lastTaken = ctx.state.get('last_medication_time') ?? 0;
          const timeSince = ctx.state.get('time') - lastTaken;
          if (lastTaken === 0 || timeSince >= 22 * 60) {
            events.push('medication_reminder');
          }
          // Reschedule for tomorrow
          ctx.state.rescheduleInterrupt('medication_reminder', interrupt.triggerAt + 1440);
        } else {
          // No supply left — cancel the reminder
          ctx.state.cancelInterrupt('medication_reminder');
        }
      } else if (interrupt.type === 'work_meeting_alert') {
        // Meeting alert fires 30 min before meeting time — notification only.
        // Cancel after firing — the work_meeting interrupt handles the actual meeting.
        ctx.state.cancelInterrupt(interrupt.id);
        events.push('work_meeting_alert');
      } else if (interrupt.type === 'work_meeting') {
        // Work meeting fires at meeting time — the meeting happens.
        // Cancel after firing (one-shot).
        ctx.state.cancelInterrupt(interrupt.id);
        // Only fire if at workplace — missed meetings if absent
        if (locations[location]?.area === 'work') {
          events.push('work_meeting');
        } else {
          // Missed meeting — job standing penalty
          // Approximation debt (work meetings): -2 standing for missed meeting chosen;
          // real consequences vary widely by workplace culture and meeting importance.
          ctx.state.adjustJobStanding(-2);
        }
      } else if (interrupt.type === 'called_in') {
        // On-call worker called in — set pending flag so accept/decline interactions appear.
        ctx.state.cancelInterrupt(interrupt.id);
        ctx.state.set('on_call_pending', true);
        events.push('called_in');
      } else if (interrupt.type === 'therapy_appointment') {
        // Weekly therapy — reschedule for next week regardless of attendance.
        // The event surfaces attend_therapy / skip_therapy choices.
        ctx.state.rescheduleInterrupt(interrupt.id, interrupt.triggerAt + 7 * 1440);
        if (ctx.state.get('therapy_active')) {
          events.push('therapy_appointment');
        }
      }
      else if (interrupt.type === 'calendar_alert') {
        // Personal calendar reminder — birthday, anniversary, etc.
        // Fire the event, cancel the interrupt, and schedule the next one.
        ctx.state.cancelInterrupt(interrupt.id);
        // Store alert data in state for event text to read
        ctx.state.set('current_calendar_alert', interrupt.data);
        events.push('calendar_alert');
        // Schedule the next upcoming calendar event
        ctx.state.scheduleNextCalendarAlert();
      }
      // Future interrupt types: flights.
    }

    // Timer — fires when game time reaches timer_end_time. Deterministic: no RNG consumed here.
    const timerEnd = ctx.state.get('timer_end_time');
    if (timerEnd !== null && ctx.state.get('time') >= timerEnd) {
      ctx.state.set('timer_end_time', null);
      events.push('timer_fired');
    }

    // Late for work stress — fires once per tier crossing (fine → late → very_late).
    // Deterministic: no RNG consumed. Resets each morning (scoped to wake_period_start).
    // Only fires on workdays — weekends have no shift to be late for.
    // Note: no hour guard here — night-shift workers (shift_start >= 22*60) need late detection
    // at evening hours. isLateForWork() and lateTier() return 'fine' when there is no lateness,
    // so removing the guard is safe for all shift types.
    const LATE_TIER_RANK = { fine: 0, late: 1, very_late: 2 };
    if (ctx.state.isWorkday()) {
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
      // Clock-in: fire once per wake period, immediately after first arrival at work.
      // Gig workers don't use a time clock. Deterministic — no RNG consumed here.
      const wps = ctx.state.get('wake_period_start');
      if (!ctx.state.isGigWorker() &&
          ctx.events.any('arrived_at_work', wps) &&
          !ctx.events.any('clock_in', wps)) {
        ctx.events.record('clock_in');
        events.push('clock_in');
      }

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

        // Background coworker drama — events that exist whether or not the player engages.
        // Probability is per checkEvents call (~per idle tick at work), so daily rates are approximate.
        // RNG discipline: 2 calls per event check, always — 1 (chance) + 1 (prose or balance).
        // This guarantees the same RNG consumption on every branch, keeping replay deterministic.
        //
        // recencyFactor: continuous cooldown — 1 when no prior drama, recovers toward 1 after drama.
        // Approximation debt (coworker drama): τ=480min chosen; ideally emerges from
        // coworker_sentiment + stress/NE levels rather than an explicit timer.
        // Replace when sim tests confirm emergent modulation from interpersonal systems.
        const lastDrama = ctx.events.last('coworker_drama');
        const minutesSinceDrama = lastDrama ? (now - lastDrama.time) : Infinity;
        const DRAMA_TAU = 480; // minutes — see approximation debt above
        const recencyFactor = minutesSinceDrama === Infinity ? 1 : 1 - Math.exp(-minutesSinceDrama / DRAMA_TAU);

        // coworker_argument: ~15% daily probability, gated on job_standing < 40.
        // Low job_standing means a stressed or dysfunctional floor. Conflict is independent of
        // whether coworkers like the player — no warmth gate.
        if (ctx.timeline.chance(0.15 * recencyFactor) && ctx.state.get('job_standing') < 40) {
          events.push('coworker_argument'); // prose call (RNG call 2) happens in event handler
          ctx.events.record('coworker_drama', { subtype: 'coworker_argument' });
        }

        // coworker_good_news: ~10% daily probability, unconditional.
        if (ctx.timeline.chance(0.10 * recencyFactor)) {
          events.push('coworker_good_news'); // prose call (RNG call 2) happens in event handler
          ctx.events.record('coworker_drama', { subtype: 'coworker_good_news' });
        }

        // coworker_overwhelmed: ~12% daily probability, gated on player stress being elevated.
        // Shared stress environment — overwhelm clusters when the floor is already under pressure.
        if (ctx.timeline.chance(0.12 * recencyFactor) && ['strained', 'overwhelmed'].includes(ctx.state.stressTier())) {
          events.push('coworker_overwhelmed'); // prose call (RNG call 2) happens in event handler
          ctx.events.record('coworker_drama', { subtype: 'coworker_overwhelmed' });
        }

        // coworker_management_tension: ~8% daily probability, unconditional.
        if (ctx.timeline.chance(0.08 * recencyFactor)) {
          events.push('coworker_management_tension'); // prose call (RNG call 2) happens in event handler
          ctx.events.record('coworker_drama', { subtype: 'coworker_management_tension' });
        }
      }
    }

    // On-call check — once per on-call period, roll whether the worker gets called in.
    // RNG discipline: 1 call (chance) when in on-call period and not yet checked today.
    // Approximation debt (on-call): 15% call-in probability chosen; real rates vary widely.
    if (ctx.state.isOnCallPeriod() && !ctx.state.get('on_call_checked_today') && !ctx.state.get('on_call_pending')) {
      ctx.state.set('on_call_checked_today', true);
      if (ctx.timeline.chance(0.15)) {
        const callInTime = ctx.state.get('time') + 30;
        ctx.state.scheduleInterrupt('called_in', callInTime, 'called_in', {});
        if (ctx.state.get('has_phone') && ctx.state.get('phone_service') !== false) {
          ctx.state.get('phone_inbox').unshift({
            type: 'message',
            text: 'Can you come in? We need someone.',
            read: false,
            source: 'supervisor',
            direction: 'incoming',
            timestamp: ctx.state.get('time'),
          });
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

    // Park ambient
    if (location === 'park') {
      if (ctx.timeline.chance(0.06)) {
        events.push('park_ambient');
      }
    }

    // Library ambient
    if (location === 'library') {
      if (ctx.timeline.chance(0.05)) {
        events.push('library_ambient');
      }
    }

    // ER ambient
    if (location === 'er') {
      if (ctx.timeline.chance(0.07)) {
        events.push('er_ambient');
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

    // Family visit end — deterministic, no RNG. Visit ends when the scheduled end time passes
    // or the player leaves the apartment. Fires 'family_visit_end' event once.
    if (ctx.state.get('family_visit_active')) {
      const visitEnd = ctx.state.getInterrupt('family_visit_end');
      const leftApartment = locations[location]?.area !== 'apartment';
      if (leftApartment || (visitEnd && visitEnd.fired)) {
        ctx.state.set('family_visit_active', false);
        ctx.state.cancelInterrupt('family_visit_end');
        if (!leftApartment) {
          events.push('family_visit_end');
        }
        ctx.events.record('family_visit_ended', { leftEarly: leftApartment });
      }
    }

    // Displacement — fires once when displaced flag is first set by failBill().
    // Deterministic: no RNG consumed. Fires exactly once: gated on no prior 'displacement_surfaced' event.
    if (ctx.state.get('displaced') && !ctx.events.last('displacement_surfaced')) {
      ctx.events.record('displacement_surfaced', {});
      events.push('displacement');
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

