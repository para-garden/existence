// character.js — character schema, accessors, state application

export function createCharacter(ctx) {
  /** @type {GameCharacter | null} */
  let current = null;

  /** @param {GameCharacter} character */
  function set(character) {
    current = { ...character };
  }

  /** @template {keyof GameCharacter} K @param {K} key @returns {GameCharacter[K]} */
  function get(key) {
    return current?.[key];
  }

  function getAll() {
    return current ? { ...current } : null;
  }

  function isSet() {
    return current !== null;
  }

  // Apply character to game state (called once at game start)
  function applyToState() {
    if (!current) return;


    // Calendar and geography
    ctx.state.set('start_timestamp', current.start_timestamp);
    ctx.state.set('latitude', current.latitude);

    // Personality — raw values stored in state for drift engine to read.
    // Set base values first; backstory adjustments are applied below additively.
    ctx.state.set('neuroticism', current.personality.neuroticism);
    ctx.state.set('self_esteem', current.personality.self_esteem);
    ctx.state.set('rumination', current.personality.rumination);
    ctx.state.set('trait_loneliness', current.personality.trait_loneliness ?? 30);
    ctx.state.set('introversion', current.personality.introversion ?? 50);

    // Sentiments — Layer 2 basic likes/dislikes. Start with chargen sentiments.
    ctx.state.set('sentiments', [...current.sentiments]);

    // --- Financial parameters from backstory ---
    const sim = current.financial_sim;
    ctx.state.set('money', sim.starting_money);
    // Fidelity: approximate awareness of starting balance
    ctx.state.set('last_observed_money', sim.starting_money > 100
      ? sim.starting_money - 50  // off by ~$50 at larger amounts
      : Math.max(0, sim.starting_money - 5));
    ctx.state.set('pay_rate', sim.pay_rate);
    ctx.state.set('rent_amount', sim.rent_amount);
    ctx.state.set('job_standing', sim.job_standing_start);
    // Health conditions — determines which condition systems are active
    ctx.state.set('health_conditions', current.conditions || []);
    // Sleep cycle length — personal biology (70–120 min, default 90 for legacy saves)
    ctx.state.set('sleep_cycle_length', current.sleep_cycle_length ?? 90);
    // Age — drives age-dependent physiology (N3 scaling, etc.). Default 35 for legacy saves.
    ctx.state.set('age_stage', current.age_stage ?? 35);
    // Billing cycle offsets — needed by ctx.state.nextPaycheck() / nextBillDue()
    ctx.state.set('paycheck_day_offset', current.paycheck_day_offset ?? 7);
    ctx.state.set('rent_day_offset', current.rent_day_offset ?? 1);
    ctx.state.set('utility_day_offset', current.utility_day_offset ?? 15);
    ctx.state.set('phone_bill_day_offset', current.phone_bill_day_offset ?? 20);
    ctx.state.set('ebt_day_offset', current.ebt_day_offset ?? 5);

    // EBT/SNAP — start with one month's balance if enrolled
    ctx.state.set('ebt_monthly_amount', sim.ebt_monthly_amount ?? 0);
    ctx.state.set('ebt_balance', sim.ebt_monthly_amount ?? 0);

    // Financial anxiety sentiment
    if (sim.financial_anxiety > 0.01) {
      ctx.state.adjustSentiment('money', 'anxiety', sim.financial_anxiety);
    }

    // Work sentiment from career stability
    if (sim.work_sentiment && sim.work_sentiment.intensity > 0.01) {
      ctx.state.adjustSentiment('work', sim.work_sentiment.quality, sim.work_sentiment.intensity);
    }

    // Personality adjustments from life events (additive nudges, clamped)
    if (sim.personality_adjustments) {
      const adj = sim.personality_adjustments;
      if (adj.neuroticism) {
        const n = ctx.state.get('neuroticism');
        ctx.state.set('neuroticism', Math.max(0, Math.min(100, n + adj.neuroticism)));
      }
      if (adj.self_esteem) {
        const se = ctx.state.get('self_esteem');
        ctx.state.set('self_esteem', Math.max(0, Math.min(100, se + adj.self_esteem)));
      }
    }

    // Life event sentiments (health anxiety, authority dread, etc.)
    if (current.backstory && current.backstory.life_events) {
      const lifeEventDefs = {
        medical_crisis:    { target: 'health', quality: 'anxiety', intensity: 0.1 },
        job_loss:          { target: 'work', quality: 'dread', intensity: 0.05 },
        family_help:       { target: 'family', quality: 'guilt', intensity: 0.05 },
        legal_trouble:     { target: 'authority', quality: 'dread', intensity: 0.08 },
      };
      for (const evt of current.backstory.life_events) {
        const def = lifeEventDefs[evt.type];
        if (def) {
          ctx.state.adjustSentiment(def.target, def.quality, def.intensity);
        }
      }
    }

    // Phone battery — slept at home, charged overnight, but not everyone charges to full
    ctx.state.set('phone_battery', ctx.timeline.charRandomInt(80, 100));

    // Job type affects shift times, alarm, and task expectations
    // last_observed_time offset by -20 from alarm → starts at rounded fidelity
    // Approximation debt: all job types get fixed/weekdays arrangement.
    // Task 4 replaces this with proper labor_arrangement generation from job type + modifiers.
    switch (current.job_type) {
      case 'office':
        ctx.state.set('work_shift_start', 9 * 60);    // 9:00 AM
        ctx.state.set('work_shift_end', 17 * 60);      // 5:00 PM
        ctx.state.set('work_tasks_expected', 4);
        ctx.state.set('time', 7 * 60 + 30);
        ctx.state.scheduleInterrupt('wake_alarm', ctx.state.nextAbsoluteForTod(7 * 60 + 30), 'alarm', { alarmTod: 7 * 60 + 30 });
        ctx.state.set('last_observed_time', 7 * 60 + 10);
        ctx.state.set('last_msg_gen_time', 7 * 60 + 30);
        ctx.state.set('labor_arrangement', { type: 'fixed', day_pattern: 'weekdays', work_days: [1,2,3,4,5], shift_start: 9 * 60, shift_end: 17 * 60, reveal_horizon_hours: null, reveal_tod: null, work_days_per_week: 5 });
        break;
      case 'retail':
        ctx.state.set('work_shift_start', 10 * 60);   // 10:00 AM
        ctx.state.set('work_shift_end', 18 * 60);      // 6:00 PM
        ctx.state.set('work_tasks_expected', 5);
        ctx.state.set('time', 8 * 60 + 30);
        ctx.state.scheduleInterrupt('wake_alarm', ctx.state.nextAbsoluteForTod(8 * 60 + 30), 'alarm', { alarmTod: 8 * 60 + 30 });
        ctx.state.set('last_observed_time', 8 * 60 + 10);
        ctx.state.set('last_msg_gen_time', 8 * 60 + 30);
        ctx.state.set('labor_arrangement', { type: 'fixed', day_pattern: 'weekdays', work_days: [1,2,3,4,5], shift_start: 10 * 60, shift_end: 18 * 60, reveal_horizon_hours: null, reveal_tod: null, work_days_per_week: 5 });
        break;
      case 'food_service':
        ctx.state.set('work_shift_start', 7 * 60);    // 7:00 AM
        ctx.state.set('work_shift_end', 15 * 60);      // 3:00 PM
        ctx.state.set('work_tasks_expected', 6);
        ctx.state.set('time', 5 * 60 + 30);
        ctx.state.scheduleInterrupt('wake_alarm', ctx.state.nextAbsoluteForTod(5 * 60 + 30), 'alarm', { alarmTod: 5 * 60 + 30 });
        ctx.state.set('last_observed_time', 5 * 60 + 10);
        ctx.state.set('last_msg_gen_time', 5 * 60 + 30);
        ctx.state.set('labor_arrangement', { type: 'fixed', day_pattern: 'weekdays', work_days: [1,2,3,4,5], shift_start: 7 * 60, shift_end: 15 * 60, reveal_horizon_hours: null, reveal_tod: null, work_days_per_week: 5 });
        break;
    }
  }

  return {
    set,
    get,
    getAll,
    isSet,
    applyToState,
  };
}

