// character.js — character schema, accessors, state application

/** @param {GameContext} ctx */
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

    // Always-present items — phone on nightstand, keys by the door
    ctx.items.add('phone', 'nightstand', 1);
    ctx.items.add('keys', 'by_the_door', 1);

    // Calendar and geography
    ctx.state.set('start_timestamp', current.start_timestamp);
    ctx.state.set('latitude', current.latitude);

    // Personality — raw values stored in state for drift engine to read.
    // Set base values first; backstory adjustments are applied below additively.
    ctx.state.set('neuroticism', current.personality.neuroticism);
    ctx.state.set('self_esteem', current.personality.self_esteem);
    ctx.state.set('rumination', current.personality.rumination);
    ctx.state.set('trait_loneliness', current.personality.trait_loneliness);
    ctx.state.set('introversion', current.personality.introversion);

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
    ctx.state.set('health_conditions', current.conditions);
    // Sleep cycle length — personal biology (70–120 min)
    ctx.state.set('sleep_cycle_length', current.sleep_cycle_length);
    // Age — drives age-dependent physiology (N3 scaling, etc.)
    ctx.state.set('age_stage', current.age_stage);
    // Housing type — determines bill structure (all_inclusive skips utility bills, room_share halves them)
    ctx.state.set('housing_type', current.housing_type);
    // Billing cycle offsets — needed by ctx.state.nextPaycheck() / nextBillDue()
    ctx.state.set('paycheck_day_offset', current.paycheck_day_offset);
    ctx.state.set('rent_day_offset', current.rent_day_offset);
    ctx.state.set('utility_day_offset', current.utility_day_offset);
    ctx.state.set('phone_bill_day_offset', current.phone_bill_day_offset);
    ctx.state.set('ebt_day_offset', current.ebt_day_offset);

    // EBT/SNAP — start with one month's balance if enrolled
    ctx.state.set('ebt_monthly_amount', sim.ebt_monthly_amount);
    ctx.state.set('ebt_balance', sim.ebt_monthly_amount);
    ctx.state.set('phone_bill_amount', sim.phone_bill_amount);

    // Insurance — type, premium, and bill offset
    // Approximation debt (insurance): premiums are rough US averages; no age, region,
    // or plan-tier variation. Non-US characters receive insurance_type='public' at chargen
    // which maps to $0 premium — their healthcare costs route through jurisdiction-based
    // multipliers in healthcareCostMultiplier() instead.
    const insType = current.insurance_type ?? 'uninsured';
    ctx.state.set('insurance_type', insType);
    ctx.state.set('insurance_bill_day_offset', current.insurance_bill_day_offset ?? 15);
    // 'public' = non-US public/statutory system; no monthly premium billed separately.
    const premiums = { employer: 150, marketplace: 300, medicaid: 0, uninsured: 0, public: 0 };
    ctx.state.set('insurance_premium', premiums[insType] ?? 0);

    // Financial anxiety sentiment
    if (sim.financial_anxiety > 0.01) {
      ctx.state.adjustSentiment('money', 'anxiety', sim.financial_anxiety);
    }

    // Work sentiment from career stability
    if (sim.work_sentiment.intensity > 0.01) {
      ctx.state.adjustSentiment('work', sim.work_sentiment.quality, sim.work_sentiment.intensity);
    }

    // Personality adjustments from life events (additive nudges, clamped)
    const adj = sim.personality_adjustments;
    if (adj.neuroticism) {
      const n = ctx.state.get('neuroticism');
      ctx.state.set('neuroticism', Math.max(0, Math.min(100, n + adj.neuroticism)));
    }
    if (adj.self_esteem) {
      const se = ctx.state.get('self_esteem');
      ctx.state.set('self_esteem', Math.max(0, Math.min(100, se + adj.self_esteem)));
    }

    // Personality drift anchors — set once after all adjustments, never updated.
    // Traits are clamped to [base − 20, base + 20] (or ±15/±0.10 for the tighter traits)
    // by the drift engine; these are the chargen values.
    ctx.state.set('base_neuroticism',          ctx.state.get('neuroticism'));
    ctx.state.set('base_self_esteem',          ctx.state.get('self_esteem'));
    ctx.state.set('base_rumination',           ctx.state.get('rumination'));
    ctx.state.set('base_trait_loneliness',     ctx.state.get('trait_loneliness'));
    ctx.state.set('base_introversion',         ctx.state.get('introversion'));
    ctx.state.set('base_sensory_sensitivity',  ctx.state.get('sensory_sensitivity'));

    // Life event sentiments (health anxiety, authority dread, etc.)
    if (current.backstory.life_events) {
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
      ctx.items.add('cigarettes', 'nightstand', current.has_cigarettes_start);
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
    if (current.has_alcohol_start !== undefined && current.has_alcohol_start > 0) {
      ctx.items.add('alcohol', 'kitchen_counter', current.has_alcohol_start);
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
    if (current.has_cannabis_start !== undefined && current.has_cannabis_start > 0) {
      ctx.items.add('cannabis', 'nightstand', current.has_cannabis_start);
    }

    // Body composition — set from chargen values
    ctx.state.set('body_mass', current.body_mass ?? 70);
    ctx.state.set('waist_cm', current.waist_cm ?? 80);
    ctx.state.set('hip_cm', current.hip_cm ?? 100);
    ctx.state.set('chest_cm', current.chest_cm ?? 85);
    ctx.state.set('caloric_balance_ema', 0);
    ctx.state.set('chest_structural_offset', 0);

    // Muscle & fitness — set from chargen values
    ctx.state.set('skeletal_muscle_mass', current.skeletal_muscle_mass ?? 25);
    ctx.state.set('aerobic_capacity', current.aerobic_capacity ?? 40);
    // last_resistance_session and last_cardio_session start at 0 (defaults handle it)

    // Stomach capacity — default 100 (normal ~1000ml, ~900-1500ml typical range).
    // Bariatric surgery: sleeve gastrectomy reduces usable volume to ~150ml (15 units here).
    // Approximation debt (stomach capacity): 15 chosen for sleeve; gastric bypass pouch ~30ml (~3 units)
    // but bypass is rarer in population and sleeve is the dominant modern procedure.
    // Real post-sleeve capacity varies 50-150ml vs 900-1500ml typical; 15 units is mid-range.
    // Citation: Schauer 2017 PMID 28329612 (prevalence); capacity range is surgical literature approximation.
    if (current.has_bariatric_surgery) {
      // Approximation debt (stomach capacity): 15 units chosen for sleeve gastrectomy (~150ml).
      ctx.state.set('stomach_capacity', 15);
    } else {
      ctx.state.set('stomach_capacity', 100);
    }

    // Phone age → initial phone_age_days and battery_health.
    // Li-ion capacity loss combines calendar aging (∝ √t; Broussely et al. 2005
    // DOI 10.1016/j.jpowsour.2004.12.031) and cycle aging (cumulative). For consumer phones
    // the combined effect is well-approximated by exponential decay: health = 100·exp(-age/τ).
    // τ=10 years gives: 1yr≈90, 2yr≈82, 3yr≈74, 4yr≈67, 5yr≈61 — consistent with
    // consumer Li-ion reports (Apple: ≥80% at 500 cycles/~2yr; industry avg 2-3%/yr early,
    // accelerating after year 2-3).
    // Approximation debt (phone aging): τ=10yr chosen to fit consumer averages; real capacity
    // loss depends on charge cycles, temperature history, depth-of-discharge patterns, and
    // device-specific battery chemistry — none modeled individually.
    const phoneAge = current.phone_age ?? 0;
    ctx.state.set('phone_age_days', phoneAge * 365);
    ctx.state.set('phone_model_age_years', phoneAge); // stored separately; drives phoneSlownessTier()
    const battHealth = Math.max(50, Math.round(100 * Math.exp(-phoneAge / 10)));
    ctx.state.set('battery_health', battHealth);

    // Phone battery — slept at home, charged overnight, but capped at battery_health (degraded capacity)
    const rawCharge = ctx.timeline.charRandomInt(80, 100);
    ctx.state.set('phone_battery', Math.min(battHealth, rawCharge));

    // Pain reliever starting count — characters with chronic pain conditions likely keep
    // ibuprofen on hand; others may have a partial bottle or none.
    // hEDS characters also keep pain relievers; chronic joint/tissue pain drives habitual stocking.
    // Approximation debt (consumables): starting count placeholder — not derived from
    // any modeled supply behavior; just a plausible range given typical household stock.
    {
      const painCount = (ctx.state.hasCondition('migraines') || ctx.state.hasCondition('dental_pain') || current.heds)
        ? ctx.timeline.charRandomInt(6, 24)
        : ctx.timeline.charRandomInt(0, 12);
      if (painCount > 0) {
        ctx.items.add('pain_reliever', 'bathroom_cabinet', painCount);
      }
    }

    // Opioid prescription — hEDS characters with established chronic pain start with an active
    // prescription. This is circumstantial: derived from having hEDS (which produces chronic pain
    // baseline ~25), not a random roll. The character has been managing this condition; they've
    // already seen a doctor. Characters without hEDS can acquire a prescription via clinic visit.
    // Approximation debt (opioids): starting doses range 4–16; mid-range of a typical prescription.
    // Starting tolerance 15 reflects established but not escalated use — they take it as directed.
    // Unconditional charRng call — 1 call always for RNG balance (same pattern as chargen.js
    // hEDS-POTS roll). Result ignored when heds=false.
    const opioidStartDoses = ctx.timeline.charRandomInt(4, 16); // unconditional — 1 call always
    if (current.heds) {
      ctx.state.set('opioid_prescription', true);
      ctx.state.set('opioid_doses_remaining', opioidStartDoses);
      ctx.state.set('opioid_tolerance', 15);
      ctx.state.set('opioid_level', 0); // morning — last dose was yesterday
      const prescriptions = ctx.state.get('clinic_prescriptions') ?? [];
      if (!prescriptions.includes('pain_management')) {
        ctx.state.set('clinic_prescriptions', [...prescriptions, 'pain_management']);
      }
      ctx.items.add('prescription_opioid', 'bathroom_cabinet', 1);
    }

    // Dental condition — characters with dental_pain start with an active underlying condition.
    // State.init() defaults dental_condition to 'sound'; promote to 'inflamed' (pulpitis / early caries).
    // dental_last_treated defaults to 0 (never treated) — worsening timer starts from game start.
    if (ctx.state.hasCondition('dental_pain') && ctx.state.get('dental_condition') === 'sound') {
      ctx.state.set('dental_condition', 'inflamed');
    }

    // Dental health — overall oral health derived from economic origin and age.
    // Characters with dental_pain condition start lower; precarious/modest origins → less historical access.
    // Approximation debt (dental): initial dental_health values chosen; no published oral health index
    // calibrated to SES × age. Direction from CDC NHANES data on untreated caries by income.
    {
      let initialHealth = 70; // default for comfortable/secure
      if (current.backstory.economic_origin === 'precarious') initialHealth = 35;
      else if (current.backstory.economic_origin === 'modest') initialHealth = 50;
      // Age penalty: older characters have more accumulated wear
      if (current.age_stage >= 45) initialHealth -= 10; // Approximation debt (dental): age penalty
      else if (current.age_stage >= 35) initialHealth -= 5;
      // Dental condition penalty: active disease means worse overall health
      if (ctx.state.hasCondition('dental_pain')) initialHealth -= 15;
      // Smoking penalty: periodontal disease risk
      if (current.starting_smoker) initialHealth -= 8; // Approximation debt (dental): smoking penalty
      ctx.state.set('dental_health', Math.max(5, Math.min(100, initialHealth)));
    }

    // Dental insurance — transfer from character to state for runtime access.
    ctx.state.set('has_dental_insurance', current.has_dental_insurance ?? false);

    // Dental insurance annual cap — US PPO plans only.
    // Employer plans are generous; marketplace plans rarely include standalone dental;
    // Medicaid adult dental is limited (many states cover emergencies only, $500 approximate).
    // DHMO plans have no annual cap — cap stays 0 (no cap mechanic applies).
    // Approximation debt (dental): cap values chosen from NADP/ADA survey ranges:
    //   employer PPO typical $1,000–$2,500; using $1,500 (median for generous employer plans).
    //   Medicaid adult dental: $500 approximate (state-by-state variation, no single source).
    //   marketplace dental: not modeled — has_dental_insurance stays false for marketplace-only.
    {
      const country = current.jurisdiction?.country ?? 'US';
      if (country === 'US' && (current.has_dental_insurance ?? false)) {
        const insType = current.insurance_type ?? 'uninsured';
        let cap = 0;
        if (insType === 'employer') {
          cap = 1500; // Approximation debt (dental): employer PPO annual max $1,500 chosen; real range $1,000–$2,500.
        } else if (insType === 'medicaid') {
          cap = 500;  // Approximation debt (dental): Medicaid adult dental annual limit ~$500; varies by state.
        }
        // marketplace: dental sold separately; has_dental_insurance=false for marketplace — cap stays 0.
        ctx.state.set('dental_insurance_cap', cap);
      }
      // Non-US: no cap mechanic — dentalCostMultiplier() handles jurisdiction pricing.
    }

    // Food profile — dietary identity from chargen.
    ctx.state.set('cooking_skill', current.food_profile.cooking_skill);
    ctx.state.set('ethical_stance', current.food_profile.ethical_stance);
    ctx.state.set('cultural_tradition', current.food_profile.cultural_tradition);
    ctx.state.set('health_restrictions', [...current.food_profile.health_restrictions]);
    ctx.state.set('comfort_foods', [...current.food_profile.comfort_foods]);
    // pantry_slots: the set of ingredient types this character tracks; drives what's purchasable.
    ctx.state.set('pantry_slots', [...current.food_profile.pantry_slots]);
    // Register active pantry slots as habit features so CART trees can learn shopping patterns.
    ctx.habits.setupPantryFeatures(current.food_profile.pantry_slots);

    // Initial pantry — cooking ingredients on hand at game start.
    ctx.state.set('pantry', { ...current.initial_pantry });
    if (current.initial_pantry.peanut_butter > 0) {
      ctx.state.set('peanut_butter_uses', 10);
    }
    if (current.initial_pantry.oil > 0) {
      ctx.state.set('oil_uses', 10);
    }

    // Umbrella — durable item; most characters start without one.
    // Approximation debt (consumables): 30% starting ownership is a plausible range based
    // on general practicality habits; no empirical prevalence data sourced.
    if (current.has_umbrella) {
      ctx.items.add('umbrella', 'by_the_door', 1);
    }

    // Period supplies and menstrual cycle — only relevant for characters with a uterus.
    if (ctx.body.hasUterus()) {
      if (current.period_supply_count > 0) {
        ctx.items.add('period_supplies', 'bathroom_cabinet', current.period_supply_count);
      }
      ctx.state.set('cycle_length', current.cycle_length);
      ctx.state.set('cramp_severity', current.cramp_severity);
      const startDay = current.cycle_start_day;
      const now = ctx.state.get('time');
      ctx.state.set('cycle_start_time', now - (startDay - 1) * 1440);
      // Initialize supply consumption timer to now so supply rate doesn't spike on first tick.
      ctx.state.set('period_supply_last_consumed', now);
    } else {
      ctx.state.set('cycle_start_time', null);  // not applicable
    }

    // Constitutional perceptual traits
    ctx.state.set('synesthesia', current.synesthesia);
    ctx.state.set('sensory_sensitivity', current.sensory_sensitivity);
    ctx.state.set('apd', current.apd);
    ctx.state.set('connective_tissue_laxity', current.connective_tissue_laxity);
    ctx.state.set('heds', current.heds);
    ctx.state.set('mcas', current.mcas);

    // MCAS flare risk — baseline 40 for MCAS characters; 0 otherwise.
    // Approximation debt (specialist treatment): mcas_flare_risk baseline 40 chosen.
    if (current.mcas) {
      ctx.state.set('mcas_flare_risk', 40);
    }

    // POTS standing tolerance — autonomic_dysregulation (POTS comorbidity) reduces to 30.
    // Approximation debt (specialist treatment): pots_standing_tolerance 30 chosen for POTS.
    if (current.conditions && current.conditions.includes('autonomic_dysregulation')) {
      ctx.state.set('pots_standing_tolerance', 30);
    }

    ctx.state.set('adhd', current.adhd);
    ctx.state.set('autism', current.autism);
    ctx.state.set('special_interest', current.special_interest);
    ctx.state.set('race_ethnicity', current.race_ethnicity);

    // Bariatric surgery history — stored in state so content.js can gate prose on it.
    ctx.state.set('has_bariatric_surgery', current.has_bariatric_surgery ?? false);

    // Constitutional mental health conditions
    ctx.state.set('has_depression', current.has_depression);
    ctx.state.set('has_gad', current.has_gad);
    ctx.state.set('has_ptsd', current.has_ptsd);
    ctx.state.set('has_bipolar', current.has_bipolar);
    // Bipolar phase anchor — random day offset so characters don't all cycle in sync.
    // Uses the game start time as the anchor; phase is derived, never stored.
    // PTSD sensory sensitivity boost — constitutional, applied once at game start.
    if (current.has_ptsd) {
      const baseSens = ctx.state.get('sensory_sensitivity');
      ctx.state.set('sensory_sensitivity', Math.min(1.0, baseSens + 0.15));
    }

    // Identity dimensions — structured pronoun sets, gender model, attraction profile
    ctx.state.set('pronoun_sets', current.pronoun_sets);
    ctx.state.set('gender', current.gender);
    ctx.state.set('attraction', current.attraction);
    ctx.state.set('hrt_active', current.hrt_active);
    ctx.state.set('hrt_type', current.hrt_type);
    // HRT supply — characters already on HRT start with an existing prescription and
    // mid-cycle supply (15 days remaining of a 30-day fill). Deterministic — no RNG.
    if (current.hrt_active) {
      const rx = ctx.state.get('clinic_prescriptions') ?? [];
      if (!rx.includes('hrt')) {
        ctx.state.set('clinic_prescriptions', [...rx, 'hrt']);
      }
      const supply = { ...(ctx.state.get('medication_supply') ?? {}) };
      if ((supply['hrt'] ?? 0) === 0) {
        supply['hrt'] = 15; // mid-cycle: 15 days remaining
        ctx.state.set('medication_supply', supply);
      }
    }
    ctx.state.set('out_at_work', current.out_at_work);
    ctx.state.set('out_to_family', current.out_to_family);
    // Legal name change — whether the character has already navigated the process before game start.
    // Probability set at chargen based on jurisdiction difficulty + age + economic_origin.
    if (current.legal_name_changed !== undefined) {
      ctx.state.set('legal_name_changed', current.legal_name_changed);
    }

    // Makeup
    if (current.makeup_count > 0) {
      ctx.items.add('makeup', 'bathroom_cabinet', current.makeup_count);
    }

    // Binder
    if (current.binder_count > 0) {
      ctx.items.add('binder', 'bedroom_drawer', current.binder_count);
    }

    // Neighbor
    ctx.state.set('neighbor_name',        current.neighbor.name);
    ctx.state.set('neighbor_archetype',   current.neighbor.archetype);
    ctx.state.set('neighbor_pronoun_set', current.neighbor.pronoun_set);

    // Corner store clerk
    ctx.state.set('clerk_name',        current.corner_store_clerk.name);
    ctx.state.set('clerk_pronoun_set', current.corner_store_clerk.pronoun_set);

    // Bus stop regular
    ctx.state.set('bus_regular_name',        current.bus_regular.name);
    ctx.state.set('bus_regular_pronoun_set', current.bus_regular.pronoun_set);

    // Shelter residents — named recurring people at shelter, encountered during displacement
    ctx.state.set('shelter_residents', current.shelter_residents || []);

    // Family relationship — new multi-member schema (v32+).
    // family_type is stored directly on character; family_members is the full array.
    // Legacy fallback: if character still has the old single-member family object, derive a single-member array.
    if (current.family_members && current.family_members.length >= 0) {
      ctx.state.set('family_type', current.family_type ?? 'distant');
      // family_archetype: use the first member's archetype, or fall back to a derived value.
      const firstMember = current.family_members[0];
      ctx.state.set('family_archetype', firstMember ? firstMember.archetype : 'checked_out');
      ctx.state.set('family_member', firstMember ? firstMember.relationship_type : 'parent');
    } else {
      // Legacy: old single-member family object. Read from it for backward compat.
      const legacyFamily = /** @type {any} */ (current);
      ctx.state.set('family_type',      legacyFamily.family?.type      ?? 'distant');
      ctx.state.set('family_archetype', legacyFamily.family?.archetype ?? 'checked_out');
      ctx.state.set('family_member',    legacyFamily.family?.member    ?? 'parent');
    }

    // Personal calendar — recurring dates (birthdays, anniversaries)
    if (current.personal_calendar) {
      ctx.state.set('personal_calendar', [...current.personal_calendar]);
    }

    // Housing quality — 0–100 composite from rent, origin, and financial anxiety.
    ctx.state.set('housing_quality', current.housing_quality);

    // Laundry access — derived from housing_quality at chargen; stored verbatim on character.
    ctx.state.set('laundry_access', current.laundry_access);

    // Grocery access — derived from economic_origin at chargen; stored verbatim on character.
    ctx.state.set('grocery_access', current.grocery_access ?? 'nearby');
    ctx.state.set('grocery_distance', current.grocery_distance ?? 20);

    // Housing characteristics — affect utility bill calculation
    ctx.state.set('apartment_size', current.apartment_size);
    ctx.state.set('heating_type', current.heating_type);
    ctx.state.set('insulation_quality', current.insulation_quality);

    // Gym membership — set from character; billing offset also stored.
    ctx.state.set('gym_membership', current.gym_membership);
    ctx.state.set('gym_membership_cost', current.gym_membership_cost);
    ctx.state.set('gym_bill_day_offset', current.gym_bill_day_offset);

    // Labor arrangement
    const arr = current.labor_arrangement;
    ctx.state.set('labor_arrangement', arr);

    // Job type affects tasks expected, start time, and alarm.
    switch (current.job_type) {
      case 'office': {
        ctx.state.set('work_tasks_expected', 4);
        const alarmTod = arr.shift_start - 90;
        ctx.state.set('time', alarmTod);
        ctx.state.scheduleInterrupt('wake_alarm', ctx.state.nextAbsoluteForTod(alarmTod), 'alarm', { alarmTod });
        ctx.state.set('last_observed_time', alarmTod - 20);
        ctx.state.set('last_msg_gen_time', alarmTod);
        break;
      }
      case 'retail': {
        ctx.state.set('work_tasks_expected', 5);
        const alarmTod = arr.shift_start - 90;
        ctx.state.set('time', alarmTod);
        ctx.state.scheduleInterrupt('wake_alarm', ctx.state.nextAbsoluteForTod(alarmTod), 'alarm', { alarmTod });
        ctx.state.set('last_observed_time', alarmTod - 20);
        ctx.state.set('last_msg_gen_time', alarmTod);
        break;
      }
      case 'food_service': {
        ctx.state.set('work_tasks_expected', 6);
        const alarmTod = arr.shift_start - 90;
        ctx.state.set('time', alarmTod);
        ctx.state.scheduleInterrupt('wake_alarm', ctx.state.nextAbsoluteForTod(alarmTod), 'alarm', { alarmTod });
        ctx.state.set('last_observed_time', alarmTod - 20);
        ctx.state.set('last_msg_gen_time', alarmTod);
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
        break;
      }
      case 'unemployed':
      case 'cant_work': {
        // No employer, no alarm, no shift. Day starts whenever the body wakes.
        // Default 8am — the day that has no structure still has a morning.
        const wakeTime = 8 * 60;
        ctx.state.set('time', wakeTime);
        ctx.state.set('last_observed_time', wakeTime - 20);
        ctx.state.set('last_msg_gen_time', wakeTime);
        ctx.state.set('work_tasks_expected', 0);
        // No job_standing applies — null employer means no standing to track.
        ctx.state.set('job_standing', 0);
        // unemployed_weeks — derived from backstory. Approximation debt (unemployed_weeks):
        // derived from career_stability as proxy for gap length; real derivation would require
        // backstory to simulate a specific job loss event and its timestamp.
        const stability = current.backstory?.career_stability ?? 0.5;
        const baseWeeks = Math.round((1 - stability) * 24); // low stability → longer gap (up to ~24 weeks)
        ctx.state.set('unemployed_weeks', Math.max(1, baseWeeks));
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
      // Split shift: schedule a second time_to_leave for the second block.
      if (finalArrEarly.split_shift && finalArrEarly.shift_start_2 != null) {
        const leaveTod2 = finalArrEarly.shift_start_2 - travelMinutes;
        ctx.state.scheduleInterrupt('time_to_leave_2', ctx.state.nextAbsoluteForTod(leaveTod2), 'time_to_leave_2', { leaveTod: leaveTod2, travelMinutes });
      }
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
        if (finalArr.split_shift && finalArr.shift_start_2 != null && finalArr.shift_end_2 != null) {
          ctx.state.setKnownShift(today, {
            start: finalArr.shift_start,
            end: finalArr.shift_end_2,
            blocks: [
              { start: finalArr.shift_start, end: finalArr.shift_end },
              { start: finalArr.shift_start_2, end: finalArr.shift_end_2 },
            ],
          });
        } else {
          ctx.state.setKnownShift(today, { start: finalArr.shift_start, end: finalArr.shift_end });
        }
      } else {
        ctx.state.setKnownShift(today, null);
      }
      // Schedule first reveal at reveal_tod, revealing tomorrow's shift.
      const revealAt = ctx.state.nextAbsoluteForTod(finalArr.reveal_tod);
      const revealDay = Math.floor(revealAt / 1440) + 1;  // day after the reveal fires
      ctx.state.scheduleInterrupt('schedule_reveal', revealAt, 'schedule_reveal', { absoluteDay: revealDay });
    }

    // Schedule first personal calendar alert
    ctx.state.scheduleNextCalendarAlert();

    // Flight interrupts — queue time_to_leave_flight + flight_departure for any upcoming flights.
    // Lead time: 180 min (3h) domestic, 240 min (4h) international.
    // Both are one-shot; cancelled after firing.
    for (let fi = 0; fi < (current.upcoming_flights ?? []).length; fi++) {
      const flight = (current.upcoming_flights ?? [])[fi];
      if (!flight) continue;
      const departureMinutes = flight.departure_offset_days * 24 * 60;
      const leadMinutes = flight.flight_type === 'international' ? 240 : 180;
      const leaveAt = departureMinutes - leadMinutes;
      ctx.state.scheduleInterrupt(
        `time_to_leave_flight_${fi}`,
        leaveAt,
        'time_to_leave_flight',
        { flight }
      );
      ctx.state.scheduleInterrupt(
        `flight_departure_${fi}`,
        departureMinutes,
        'flight_departure',
        { flight }
      );
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

