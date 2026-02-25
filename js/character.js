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
    ctx.state.set('hourly_rate', sim.hourly_rate);
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
    ctx.state.set('phone_bill_amount', sim.phone_bill_amount ?? 45);

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

    // Smoker starting state — established habit + starting cigarette inventory.
    // Smokers start with high habit (habit=80: ~13 days of daily use at +6/day)
    // and mid nicotine level (just woke, last cigarette was before sleep — some withdrawal building).
    // Approximation debt (nicotine): habit=80 and nicotine_level=10 chosen; real overnight
    // nicotine level depends on time of last cigarette and metabolic rate.
    if (current.starting_smoker) {
      ctx.state.set('nicotine_habit', 80);
      ctx.state.set('nicotine_level', 10);   // early morning — level low, withdrawal beginning
      ctx.state.set('has_cigarettes', current.has_cigarettes_start ?? 0);
    }

    // Alcohol starting state — tolerance from backstory drinking pattern.
    // alcohol_level = 0 (morning, sober). Withdrawal begins building if high-tolerance.
    // Approximation debt (alcohol): heavy drinkers start with habit=80 (established).
    if (current.alcohol_tolerance_start !== undefined) {
      ctx.state.set('alcohol_tolerance', current.alcohol_tolerance_start);
      // High-tolerance users likely had a drink the night before — mild withdrawal beginning.
      // Previously a withdrawal pre-load; now withdrawal is derived from NT baseline deficit,
      // so no pre-load is needed. The gaba_baseline drift will produce the gap naturally.
    }
    if (current.has_alcohol_start !== undefined) {
      ctx.state.set('has_alcohol', current.has_alcohol_start);
    }

    // Cannabis starting state — tolerance from backstory use pattern.
    // cannabis_level = 0 (morning, not currently high). Withdrawal begins building if high-tolerance.
    // Approximation debt (cannabis): tolerance thresholds chosen; mirrors alcohol applyToState pattern.
    if (current.cannabis_tolerance_start !== undefined) {
      ctx.state.set('cannabis_tolerance', current.cannabis_tolerance_start);
      // High-tolerance users may have mild withdrawal beginning after overnight abstinence.
      // Previously a withdrawal pre-load; now withdrawal is derived from NT baseline deficit,
      // so no pre-load is needed. The dopamine_baseline drift will produce the gap naturally.
    }
    if (current.has_cannabis_start !== undefined) {
      ctx.state.set('has_cannabis', current.has_cannabis_start);
    }

    // Phone battery health — older/worse-off phones have degraded capacity.
    // Derived from financial_anxiety at chargen: higher anxiety → older, less-maintained phone.
    // Approximation debt (phone aging): health thresholds (65/0.65, 75/0.4, 90 otherwise) chosen;
    // real battery health depends on charge cycles, age, and model — not individually modeled.
    const finAnx = sim.financial_anxiety ?? 0;
    const battHealth = finAnx > 0.65 ? 55 : finAnx > 0.4 ? 70 : 90;
    ctx.state.set('battery_health', battHealth);

    // Phone battery — slept at home, charged overnight, but capped at battery_health (degraded capacity)
    const rawCharge = ctx.timeline.charRandomInt(80, 100);
    ctx.state.set('phone_battery', Math.min(battHealth, rawCharge));

    // Pain reliever starting count — characters with chronic pain conditions likely keep
    // ibuprofen on hand; others may have a partial bottle or none.
    // hEDS characters also keep pain relievers; chronic joint/tissue pain drives habitual stocking.
    // Approximation debt (consumables): starting count placeholder — not derived from
    // any modeled supply behavior; just a plausible range given typical household stock.
    if (ctx.state.hasCondition('migraines') || ctx.state.hasCondition('dental_pain') || (current.heds ?? false)) {
      ctx.state.set('pain_reliever_count', ctx.timeline.charRandomInt(6, 24));
    } else {
      ctx.state.set('pain_reliever_count', ctx.timeline.charRandomInt(0, 12));
    }

    // Dental condition — characters with dental_pain start with an active underlying condition.
    // 'inflamed' is the earliest disease state (pulpitis / early caries). If legacy save has
    // dental_pain but dental_condition is unset (defaulted to 'sound'), promote to 'inflamed'.
    // dental_last_treated defaults to 0 (never treated) — worsening timer starts from game start.
    if (ctx.state.hasCondition('dental_pain') && ctx.state.get('dental_condition') === 'sound') {
      ctx.state.set('dental_condition', 'inflamed');
    }

    // Initial pantry — cooking ingredients on hand at game start.
    // Derived from economic_origin and financial_anxiety at chargen (no charRng consumed).
    // Legacy saves without initial_pantry default to empty pantry (all zeros).
    if (current.initial_pantry) {
      ctx.state.set('pantry', { ...{ pasta: 0, rice: 0, canned: 0, eggs: 0, bread: 0 }, ...current.initial_pantry });
    }

    // Umbrella — durable item; most characters start without one.
    // Approximation debt (consumables): 30% starting ownership is a plausible range based
    // on general practicality habits; no empirical prevalence data sourced.
    ctx.state.set('has_umbrella', current.has_umbrella ?? false);

    // Period supplies and menstrual cycle — only relevant for characters with a uterus.
    if (ctx.body.hasUterus()) {
      ctx.state.set('period_supply_count', current.period_supply_count ?? 0);
      // Menstrual cycle — derive cycle_start_time from cycle_start_day and current game time.
      // cycle_start_time = time when day 1 of current cycle began (may be negative for legacy).
      ctx.state.set('cycle_length', current.cycle_length ?? 28);
      ctx.state.set('cramp_severity', current.cramp_severity ?? 0);
      // cycle_start_day: which day of the cycle it is at game start.
      // Legacy saves without cycle_start_day default to mid-follicular (day 8).
      const startDay = current.cycle_start_day ?? 8;
      const now = ctx.state.get('time');
      ctx.state.set('cycle_start_time', now - (startDay - 1) * 1440);
      // Initialize supply consumption timer to now so supply rate doesn't spike on first tick.
      ctx.state.set('period_supply_last_consumed', now);
    } else {
      ctx.state.set('period_supply_count', 0);
      ctx.state.set('cycle_start_time', null);  // not applicable
    }

    // Constitutional perceptual traits
    // synesthesia: chromesthesia (sound → colour percepts). Legacy saves default false.
    ctx.state.set('synesthesia', current.synesthesia ?? false);
    // sensory_sensitivity: −1.0 (hyposensitive) to +1.0 (hypersensitive). Legacy saves default 0 (typical).
    ctx.state.set('sensory_sensitivity', current.sensory_sensitivity ?? 0);
    // apd: auditory processing disorder — parsing fails, detection intact. Legacy saves default false.
    ctx.state.set('apd', current.apd ?? false);
    // connective_tissue_laxity: heritable continuous parameter (0–100). Legacy saves default 50 (mid-range).
    ctx.state.set('connective_tissue_laxity', current.connective_tissue_laxity ?? 50);
    // heds: hypermobile Ehlers-Danlos Syndrome — derived from laxity >= 88 at chargen.
    // Legacy saves default false (laxity defaults to 50, well below threshold; no mechanical effect).
    ctx.state.set('heds', current.heds ?? false);
    // mcas: mast cell activation syndrome — comorbid with hEDS (~30–70%). Legacy saves default false.
    ctx.state.set('mcas', current.mcas ?? false);
    // adhd: attention-deficit/hyperactivity disorder. Legacy saves default false (no effect).
    ctx.state.set('adhd', current.adhd ?? false);
    // autism: autism spectrum. Legacy saves default false (no effect).
    ctx.state.set('autism', current.autism ?? false);
    // special_interest: domain-specific focus, present only for autistic characters.
    // Legacy saves default null (no effect).
    ctx.state.set('special_interest', current.special_interest ?? null);

    // Identity dimensions — gender, trans status, sexuality, out status.
    // Legacy saves default to straight/cis — no effect on those runs.
    ctx.state.set('pronouns', current.pronouns ?? 'she/her');
    ctx.state.set('trans', current.trans ?? false);
    ctx.state.set('trans_presentation', current.trans_presentation ?? null);
    ctx.state.set('hrt_active', current.hrt_active ?? false);
    ctx.state.set('sexuality', current.sexuality ?? 'straight');
    ctx.state.set('out_at_work', current.out_at_work ?? true);
    ctx.state.set('out_to_family', current.out_to_family ?? true);

    // Makeup — apply starting stock to state (legacy saves get 0).
    ctx.state.set('makeup_count', current.makeup_count ?? 0);

    // Binder — apply starting stock to state (legacy saves get 0 = no binder).
    ctx.state.set('binder_count', current.binder_count ?? 0);

    // Neighbor — recurring person on the block. Legacy saves default to null (no neighbor shown).
    ctx.state.set('neighbor_name',     current.neighbor?.name     ?? null);
    ctx.state.set('neighbor_archetype', current.neighbor?.archetype ?? null);
    ctx.state.set('neighbor_pronoun',   current.neighbor?.pronoun  ?? 'they');

    // Family relationship — set from character.family; defaults for legacy saves.
    const fam = current.family;
    ctx.state.set('family_type',      fam?.type      ?? 'distant');
    ctx.state.set('family_archetype', fam?.archetype ?? 'checked_out');
    ctx.state.set('family_member',    fam?.member    ?? 'parent');

    // Housing quality — 0–100 composite from rent, origin, and financial anxiety.
    // Legacy saves without housing_quality default to 50 (neutral mid-range; don't assume good or bad).
    ctx.state.set('housing_quality', current.housing_quality ?? 50);

    // Laundry access — derived from housing_quality at chargen; stored verbatim on character.
    // Legacy saves default to 'in_unit' (conservative; don't penalize existing players).
    ctx.state.set('laundry_access', current.laundry_access ?? 'in_unit');

    // Labor arrangement — use generated arrangement if present (new saves), fall back to
    // hardcoded defaults for legacy saves without labor_arrangement on character.
    const arr = current.labor_arrangement;
    if (arr) {
      ctx.state.set('labor_arrangement', arr);
    }

    // Job type affects tasks expected, start time, and alarm.
    // Alarm = shift_start - 90 min (if arrangement present); otherwise hardcoded fallback.
    const shiftStart = arr ? arr.shift_start : null;
    switch (current.job_type) {
      case 'office': {
        ctx.state.set('work_tasks_expected', 4);
        const alarmTod = shiftStart !== null ? shiftStart - 90 : 7 * 60 + 30;
        ctx.state.set('time', alarmTod);
        ctx.state.scheduleInterrupt('wake_alarm', ctx.state.nextAbsoluteForTod(alarmTod), 'alarm', { alarmTod });
        ctx.state.set('last_observed_time', alarmTod - 20);
        ctx.state.set('last_msg_gen_time', alarmTod);
        if (!arr) ctx.state.set('labor_arrangement', { type: 'fixed', day_pattern: 'weekdays', work_days: [1,2,3,4,5], shift_start: 9 * 60, shift_end: 17 * 60, reveal_horizon_hours: null, reveal_tod: null, work_days_per_week: 5 });
        break;
      }
      case 'retail': {
        ctx.state.set('work_tasks_expected', 5);
        const alarmTod = shiftStart !== null ? shiftStart - 90 : 8 * 60 + 30;
        ctx.state.set('time', alarmTod);
        ctx.state.scheduleInterrupt('wake_alarm', ctx.state.nextAbsoluteForTod(alarmTod), 'alarm', { alarmTod });
        ctx.state.set('last_observed_time', alarmTod - 20);
        ctx.state.set('last_msg_gen_time', alarmTod);
        if (!arr) ctx.state.set('labor_arrangement', { type: 'fixed', day_pattern: 'weekdays', work_days: [1,2,3,4,5], shift_start: 10 * 60, shift_end: 18 * 60, reveal_horizon_hours: null, reveal_tod: null, work_days_per_week: 5 });
        break;
      }
      case 'food_service': {
        ctx.state.set('work_tasks_expected', 6);
        const alarmTod = shiftStart !== null ? shiftStart - 90 : 5 * 60 + 30;
        ctx.state.set('time', alarmTod);
        ctx.state.scheduleInterrupt('wake_alarm', ctx.state.nextAbsoluteForTod(alarmTod), 'alarm', { alarmTod });
        ctx.state.set('last_observed_time', alarmTod - 20);
        ctx.state.set('last_msg_gen_time', alarmTod);
        if (!arr) ctx.state.set('labor_arrangement', { type: 'fixed', day_pattern: 'weekdays', work_days: [1,2,3,4,5], shift_start: 7 * 60, shift_end: 15 * 60, reveal_horizon_hours: null, reveal_tod: null, work_days_per_week: 5 });
        break;
      }
      case 'gig_worker': {
        // Gig workers have no fixed alarm or shift start. Wake whenever.
        // Default 8am start time — the app picks up around then.
        const alarmTod = 8 * 60;
        ctx.state.set('time', alarmTod);
        ctx.state.scheduleInterrupt('wake_alarm', ctx.state.nextAbsoluteForTod(alarmTod), 'alarm', { alarmTod });
        ctx.state.set('last_observed_time', alarmTod - 20);
        ctx.state.set('last_msg_gen_time', alarmTod);
        ctx.state.set('work_tasks_expected', 0); // no task quota — gigs are self-driven
        if (!arr) ctx.state.set('labor_arrangement', { type: 'gig', day_pattern: 'any', work_days: [], shift_start: null, shift_end: null, reveal_horizon_hours: null, reveal_tod: null, work_days_per_week: 0 });
        break;
      }
    }

    // Time-to-leave interrupt — fires at shift_start − travel time each morning to prompt departure.
    // Approximation debt (work scheduling): travel time hardcoded to 25 min (apartment → bus_stop → workplace).
    // Real value depends on housing location, transit availability, walking speed.
    const finalArrEarly = ctx.state.get('labor_arrangement');
    if (finalArrEarly?.shift_start != null) {
      const travelMinutes = 25;
      const leaveTod = finalArrEarly.shift_start - travelMinutes;
      ctx.state.scheduleInterrupt('time_to_leave', ctx.state.nextAbsoluteForTod(leaveTod), 'time_to_leave', { leaveTod, travelMinutes });
    }

    // For on_demand/rotating arrangements: pre-populate today's shift (yesterday's reveal
    // already happened before game start) and schedule the first reveal interrupt.
    // on_demand: evening-before reveal (9pm or 10pm) → first reveal fires tonight for tomorrow.
    // rotating: morning reveal (6am) → first reveal fires this morning/tomorrow morning for the next day.
    const finalArr = ctx.state.get('labor_arrangement');
    if (finalArr && (finalArr.type === 'on_demand' || finalArr.type === 'rotating') && finalArr.reveal_tod !== null) {
      // Today's shift is already known (yesterday's reveal happened before the game started).
      // Approximation debt (work scheduling): always assigns a shift if potential work day.
      // See docs/design/work-scheduling.md — on_demand probability model not yet implemented.
      const today = ctx.state.currentAbsoluteDay();
      if (ctx.state.isPotentialWorkDayFor(today)) {
        ctx.state.setKnownShift(today, { start: finalArr.shift_start, end: finalArr.shift_end });
      } else {
        ctx.state.setKnownShift(today, null);
      }
      // Schedule first reveal at reveal_tod, revealing tomorrow's shift.
      const revealAt = ctx.state.nextAbsoluteForTod(finalArr.reveal_tod);
      const revealDay = Math.floor(revealAt / 1440) + 1;  // day after the reveal fires
      ctx.state.scheduleInterrupt('schedule_reveal', revealAt, 'schedule_reveal', { absoluteDay: revealDay });
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

