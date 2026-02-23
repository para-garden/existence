// state.js — hidden state engine
// The player never sees these numbers. Ever.

/** @typedef {ReturnType<typeof State.getAll>} GameState */

export function createState(ctx) {
  // --- Internal state ---
  /** @type {ReturnType<typeof defaults>} */
  let s = /** @type {any} */ ({});

  function defaults() {
    return {
      energy: 60,       // 0-100. Physical/mental capacity.
      money: 47.50,     // Dollars. Tight but not zero.
      stress: 30,       // 0-100. Accumulated friction.
      hunger: 25,           // 0-100. Felt hunger signal. 0 = not hungry, 100 = starving.
      stomach_fullness: 0,  // 0-100. Physical stomach contents. Filled by eating, drained by digestion (~20 pts/hr).
                            // Suppresses hunger signal accumulation. Vomiting empties this, not hunger directly.
      stomach_liquid_fraction: 0, // 0-1. Fraction of stomach_fullness that is liquid. Liquids empty faster (~25 min half-life).
      thirst: 200,          // ml fluid deficit. 0 = fully hydrated; thirst onset ~700ml (1% body water for 70kg adult).
                            // Unit grounded in physiology: Cheuvront & Kenefick 2014 (Compr Physiol, DOI 10.1002/cphy.c130017).
                            // Approximation debt: single scalar collapses hydration status and thirst signal.
                            // Body weight not tracked — 70kg reference used throughout. Electrolytes absent — see TODO.md.
      pending_hydration: 0, // ml of fluid consumed but not yet absorbed. Drained into thirst reduction
                            // by advanceTime() with τ=20 min half-life (water gastric emptying: Shi et al. 2004 PMID 15107010).
                            // Drinking adds here; excess above deficit routes to bladder_fill.
      bladder_fill: 0,      // ml of urine in bladder. Fills from: baseline kidney output (~40ml/hr) + caffeine
                            // diuresis + excess absorbed fluid above hydration deficit. Voided by use_toilet.
                            // Functional capacity ~300-400ml; first urge ~150ml (Weiss 2012 PMID 23140552).
      time: 6 * 60 + 30, // Minutes since game start. Keeps incrementing, never resets.
      social: 40,         // 0-100. 0 = deeply isolated, 100 = connected.
      social_energy: 100, // 0-100. Depleted by social interaction, recovered by solitude and sleep.
                          // Depletion scales with introversion (0.2–0.8×); recovery scales inversely (0.8–1.4×).
      job_standing: 65, // 0-100. How work perceives you.

      // Calendar anchor — minutes since Unix epoch. Set once from charRng.
      start_timestamp: 0,

      // Geography — latitude in degrees (-90 to 90). Everything derives from this:
      // sign → hemisphere, |lat| < 23.5 → tropical, |lat| 23.5-66.5 → temperate
      latitude: 42,

      // --- Neurochemistry (0-100 scales, hidden) ---
      // Layer 1 of emotional architecture (DESIGN-EMOTIONS.md).
      // These drift toward targets via exponential approach, giving mood inertia.
      // References: RESEARCH-HORMONES.md, REFERENCE-HORMONES.md

      // Neurotransmitters
      // Serotonin: tonic mood regulator. Half-life days. Fed by sleep quality, social, tryptophan/hunger.
      // Low serotonin → depressed mood, irritability. SSRIs block reuptake.
      // Ref: estradiol upregulates synthesis (RESEARCH-HORMONES.md Part 1)
      serotonin: 50,
      // Dopamine: reward, motivation, energy. Half-life ~12-24h.
      // Fed by energy, achievement. Depleted by chronic stress.
      // Ref: substantia nigra, D1/D2 receptors (REFERENCE-HORMONES.md)
      dopamine: 50,
      // Norepinephrine: arousal, alertness, fight-or-flight. Half-life hours.
      // Fed by stress, poor sleep quality. Adrenal medulla + locus coeruleus.
      // REM sleep occurs in NE-free environment (DESIGN-EMOTIONS.md Layer 1)
      norepinephrine: 40,
      // GABA: primary inhibitory NT. Half-life ~12-24h.
      // Chronic stress slowly depletes. ALLO is a GABA-A modulator.
      // Ref: ALLO/GABA-A withdrawal mechanism (RESEARCH-HORMONES.md Part 1)
      gaba: 55,
      // Glutamate: primary excitatory NT. Half-life days. Placeholder.
      // Ketamine targets NMDA glutamate receptors.
      glutamate: 50,
      // Beta-endorphin: endogenous opioid. Half-life ~12-24h. Placeholder.
      // Released by exercise, bonding, pain. Opioids target mu-opioid receptor.
      endorphin: 45,
      // Acetylcholine: attention, memory, neuromuscular. Half-life ~12h. Placeholder.
      // Nicotine is an acetylcholine receptor agonist.
      acetylcholine: 50,
      // Endocannabinoid (anandamide + 2-AG): mood regulation, stress buffering. Half-life ~12-24h. Placeholder.
      // Released by exercise and stress. Cannabis targets CB1/CB2 receptors.
      endocannabinoid: 50,
      // Histamine: wakefulness, arousal. Half-life hours. Diurnal — high during waking.
      // Antihistamines cause drowsiness by blocking H1 receptors.
      histamine: 50,

      // Stress axis
      // Cortisol: primary stress hormone. Diurnal rhythm (peaks AM, nadir PM).
      // CRH → ACTH → cortisol chain modeled as single output.
      // Chronic stress flattens diurnal rhythm (DESIGN-EMOTIONS.md).
      // Ref: dual hormone hypothesis — high cortisol suppresses testosterone behavioral effects (RESEARCH-HORMONES.md Part 4)
      cortisol: 50,
      // Cortisol GI slow pathway — filtered cortisol for gastric motility effects.
      // Cortisol acts on GI motility via the genomic pathway (hours), unlike NE which acts
      // via fast synaptic transmission (minutes). This variable tracks a slow-moving
      // exponential average of cortisol to model that distinction.
      // Initialized equal to cortisol baseline (50) at game start.
      // Approximation debt: time constant (~210 min, ~3.5h half-life) is chosen to represent
      // the hours-long genomic pathway, not derived from measured GI motility kinetics. See TODO.md.
      cortisol_gi_slow: 50,

      // Circadian
      // Melatonin: sleep/wake regulator. Diurnal — rises in darkness, suppressed by light.
      // Pineal gland, derived from tryptophan via serotonin.
      // Ref: REFERENCE-HORMONES.md #2
      melatonin: 20,
      // Adenosine: sleep pressure. Accumulates during wakefulness, cleared by sleep.
      // Caffeine blocks adenosine receptors (A1, A2A).
      adenosine: 20,

      // Sex/reproductive hormones
      // Testosterone: diurnal rhythm (peaks 5:30-8AM, nadir ~7-8PM). 25-50% amplitude in young adults.
      // Ref: amygdala reactivity + reduced PFC coupling (RESEARCH-HORMONES.md Part 4)
      testosterone: 50,
      // DHT (dihydrotestosterone): converted from testosterone by 5α-reductase. Placeholder.
      // More potent androgen receptor agonist than testosterone.
      dht: 50,
      // Estradiol (E2): primary estrogen. Placeholder. Menstrual cycle / HRT later.
      // Upregulates serotonin synthesis, increases 5-HT2A density, reduces reuptake.
      // Ref: estradiol-serotonin link (RESEARCH-HORMONES.md Part 1)
      estradiol: 50,
      // Progesterone: placeholder. Menstrual cycle / pregnancy later.
      // Converts to allopregnanolone via 5α-reductase → 3α-HSD.
      // Ref: ALLO pathway (RESEARCH-HORMONES.md Part 1)
      progesterone: 50,
      // Allopregnanolone (ALLO): derived from progesterone. GABA-A positive allosteric modulator.
      // Placeholder. PMS/PMDD mechanism — withdrawal causes GABAergic deficit.
      // Ref: ALLO/GABA-A withdrawal (RESEARCH-HORMONES.md Part 1)
      allopregnanolone: 50,
      // LH (luteinizing hormone): placeholder. Drives sex hormone production.
      // Pre-ovulatory surge triggers ovulation.
      lh: 50,
      // FSH (follicle-stimulating hormone): placeholder. Follicle development.
      fsh: 50,

      // Bonding hormones
      // Oxytocin: social bonding, trust, anxiolytic. Placeholder.
      // Released by touch, social interaction, suckling.
      // Ref: oxytocin pulses during breastfeeding (RESEARCH-HORMONES.md Part 3)
      oxytocin: 45,
      // Prolactin: promotes well-being, calmness. Inverse relationship with dopamine. Placeholder.
      // Elevated during lactation. Suppresses HPA axis.
      // Ref: prolactin mood effects (RESEARCH-HORMONES.md Part 3)
      prolactin: 50,

      // Metabolic hormones
      // Thyroid (T3/T4 composite): metabolic rate regulator. Very slow dynamics. Placeholder.
      // Hypothyroidism → fatigue, depression, weight gain. Hyperthyroidism → anxiety, irritability.
      // Ref: REFERENCE-HORMONES.md #4, #5
      thyroid: 50,
      // Insulin: blood sugar regulation. Placeholder. Diabetes later.
      // Ref: REFERENCE-HORMONES.md polypeptide section
      insulin: 50,
      // Leptin: long-term satiety signal from adipose tissue. Placeholder.
      // High body fat → high leptin (but leptin resistance possible).
      leptin: 50,
      // Ghrelin: hunger hormone. Active — maps to hunger state.
      // Stomach produces when empty. Rises before meals, drops after eating.
      ghrelin: 40,
      // Post-prandial hormonal satiation (CCK, GLP-1, PYY, ghrelin suppression composite).
      // Rises on eating proportional to amount ingested; decays independently of stomach emptying.
      // Represents the 2–4h hormonal phase that keeps hunger suppressed after a meal even as
      // the stomach physically empties. Default 0 (fasted / no recent meal).
      hormonal_satiation: 0,

      // Other
      // DHEA (dehydroepiandrosterone): anti-cortisol, precursor to sex hormones. Placeholder.
      // Adrenal gland. Declines with age.
      dhea: 50,
      // hCG (human chorionic gonadotropin): pregnancy marker. Default 0.
      // Stimulates thyroid weakly (nausea in first trimester).
      // Ref: hCG/thyroid interaction (RESEARCH-HORMONES.md Part 2)
      hcg: 0,
      // Calcitriol (active vitamin D): mood effects from deficiency. Placeholder.
      // Sunlight exposure → skin synthesis. Deficiency linked to depression.
      calcitriol: 50,

      // Layer 2 — directed sentiments. Array of {target, quality, intensity}.
      // Generated at chargen, written by Character.applyToState(). Mutable during play.
      sentiments: /** @type {{ target: string, quality: string, intensity: number }[]} */ ([]),

      // Personality — raw values from character, used by emotional inertia.
      // 50/50/50 = neutral (inertia 1.0). Set by Character.applyToState().
      neuroticism: 50,       // 0-100. Higher → negative moods persist longer.
      self_esteem: 50,       // 0-100. Lower → all moods stickier.
      rumination: 50,        // 0-100. Higher → all moods stickier.
      trait_loneliness: 50,  // 0-100. Sets social decay asymptote — floor below which connection doesn't fully recover.
      introversion: 50,      // 0-100. Higher → social interaction more depleting, solitude more restorative.

      // Sleep tracking for neurochemistry
      last_sleep_quality: 0.8,  // 0-1 quality multiplier from most recent sleep
      sleep_debt: 0,            // minutes of accumulated deficit (cap 4800 = 10 days)
      daylight_exposure: 0,     // bright-light minutes in current wake period

      // Substances
      // Caffeine: 0-100. Blocks adenosine receptors — wakefulness without clearing sleep pressure.
      // Half-life ~5h. High caffeine at bedtime degrades sleep quality.
      // One cup of coffee ≈ 50 units.
      caffeine_level: 0,
      // Tolerance tracking: grows when daily peak ≥ 40, fades when day passes without caffeine.
      caffeine_habit: 0,       // 0-100; habitual use level
      // Withdrawal: builds when habit > 10 and caffeine_level < 15. Clears with caffeine.
      caffeine_withdrawal: 0,  // 0-100; headache + dopamine suppression + nausea at severe
      caffeine_today_peak: 0,  // highest caffeine_level this wake period; reset at wakeUp

      // General nausea — shared across systems (withdrawal, illness, alcohol eventually).
      // Decays naturally; some sources clear faster with treatment.
      nausea: 0,               // 0-100
      // Vomiting — set in advanceTime() when nausea > 75, cleared in checkEvents() on fire.
      pending_vomit: false,

      // Environment
      // Temperature in celsius. Set by updateWeather() in world.js.
      // Baseline from latitude + season; weather shifts it ±3°C.
      temperature: 15,

      // Flags and soft state
      alarm_time: 6 * 60 + 30,  // Minutes since midnight. When the alarm fires.
      alarm_set: true,
      alarm_went_off: false,
      just_woke_alarm: false,   // true after alarm truncates sleep — enables snooze/dismiss
      snooze_count: 0,          // how many times snoozed this wake
      at_work_today: false,
      called_in: false,
      ate_today: false,
      showered: false,
      dressed: false,
      has_phone: true,
      phone_battery: 70,     // 0-100
      fridge_food: 2,        // Rough units. 0 = empty.
      pantry_food: 1,        // Shelf-stable. Doesn't spoil. 0 = empty.
      weather: 'overcast',   // Set by events
      rain: false,

      // Location
      location: 'apartment_bedroom',
      previous_location: /** @type {string | null} */ (null),
      location_arrival_time: 0,   // game-time (minutes) when character last arrived at current location

      // Work specifics
      work_shift_start: 9 * 60,   // 9:00 AM in minutes since midnight
      work_shift_end: 17 * 60,    // 5:00 PM in minutes since midnight
      work_tasks_done: 0,
      work_tasks_expected: 4,

      // Phone inbox and mode
      phone_inbox: /** @type {{ type: string, text: string, read: boolean, source?: string, direction?: string, timestamp?: number, paid?: boolean }[]} */ ([]),
      phone_silent: false,
      viewing_phone: false,
      // Phone navigation — transient, reset on put_phone_away, not meaningful in save
      phone_screen: 'home',            // 'home' | 'messages' | 'thread' | 'notifications'
      phone_thread_contact: /** @type {string | null} */ (null), // 'friend1' | 'friend2' | 'supervisor' | 'bank'
      phone_prev_screen: /** @type {string | null} */ (null),  // screen to return to from notifications
      last_msg_gen_time: 0,     // game time of last generateIncomingMessages call
      work_nagged_today: false, // reset on wake
      // Financial cycle
      pay_rate: 0,              // biweekly take-home, set from character backstory
      rent_amount: 0,           // monthly rent, from character backstory
      days_worked_this_period: 0, // tracks attendance for variable pay
      last_paycheck_day: 0,     // guard: game day of last paycheck
      last_rent_day: 0,         // guard: game day of last rent deduction
      last_utility_day: 0,      // guard: game day of last utility deduction
      last_phone_bill_day: 0,   // guard: game day of last phone bill deduction
      last_ebt_day: 0,          // guard: game day of last EBT load
      // Billing cycle offsets — set from character by applyToState()
      paycheck_day_offset: 7,   // day % 14 === this → paycheck fires
      rent_day_offset: 1,       // day % 30 === this → rent fires
      utility_day_offset: 15,   // day % 30 === this → utilities fire
      phone_bill_day_offset: 20, // day % 30 === this → phone bill fires
      ebt_day_offset: 5,        // day % 30 === this → EBT reloads

      // SNAP/EBT food benefit
      ebt_balance: 0,           // current spendable EBT balance
      ebt_monthly_amount: 0,    // monthly load amount (0 = not enrolled)

      // Sleep cycle length — personal biology, set by applyToState(). 90 = population mean.
      sleep_cycle_length: 90,  // minutes (70–120); set by applyToState() from character
      // Character age — drives age-dependent physiology (e.g. N3 deep sleep scaling).
      age_stage: 35,            // years; set by applyToState() from character

      // Body system — set at chargen, modified during play
      pregnancy_week: /** @type {number | null} */ (null),   // null = not pregnant; 0–42 = weeks
      binder_start_time: /** @type {number | null} */ (null), // game-time (minutes) when binder was put on

      // Health conditions
      health_conditions: /** @type {string[]} */ ([]),  // set by applyToState()
      // Migraines — only relevant if health_conditions includes 'migraines'
      migraine_active: false,
      migraine_intensity: 0,    // 0-100 pain level; decays ~8 pts/hr during active phase
      migraine_hours_active: 0, // hours since onset; used to pace decay

      // Dental pain — only relevant if health_conditions includes 'dental_pain'
      dental_ache: 0,   // 0-100 continuous pain; spikes from eating/hot-cold, decays ~1.5/hr

      // Acute illness — transient, anyone can get it. Separate from chronic health_conditions.
      illness_severity: 0,                             // 0-1 continuous (0 = healthy)
      illness_type: /** @type {string|null} */ (null), // 'flu' | 'cold' | 'gi'
      illness_day: 0,                                  // days since onset; drives severity arc
      illness_medicated: false,                        // OTC medicine taken today; resets each wakeUp

      // Internal counters the player never sees
      actions_since_rest: 0,
      times_late_this_week: 0,
      consecutive_meals_skipped: 0,
      last_social_interaction: 0, // action count at last interaction
      friend_contact: /** @type {Record<string, number>} */ ({}), // slot → game time of last engagement
      pending_replies: /** @type {{ slot: string, arrivesAt: number, text: string, effect?: { type: 'receiveMoney', amount: number } }[]} */ ([]),

      // Event surfacing — tracks last tier at which body-state events fired.
      // Events fire once per tier crossing (hungry→very_hungry→starving, exhausted→depleted).
      // Reset when the condition resolves (eating, resting).
      last_surfaced_hunger_tier: /** @type {string|null} */ (null),
      last_surfaced_thirst_tier: /** @type {string|null} */ (null),
      last_surfaced_bladder_tier: /** @type {string|null} */ (null),
      last_surfaced_energy_tier: /** @type {string|null} */ (null),
      last_surfaced_mess_tier: /** @type {string|null} */ (null),
      last_surfaced_late_tier: /** @type {string|null} */ (null),

      // Daily work meal — food_service workers can eat once per shift
      ate_at_work_today: false,

      // Office break room grazing — once per shift
      grazed_break_room_today: false,

      // Soup kitchen
      ate_at_soup_kitchen_today: false,
      soup_kitchen_visits: 0,    // lifetime visit count — shapes prose

      // Food bank
      last_food_bank_day: 0,     // game day of last visit (0 = never)
      food_bank_visits: 0,       // lifetime visit count — shapes prose

      // Asking a friend for money — cooldown and repeat tracking
      last_asked_for_help_time: 0, // game time of last ask (0 = never)
      asked_for_help_count: /** @type {Record<string, number>} */ ({}), // slot → times asked

      // Friend in-need messages — per-slot cooldown (14-day minimum gap)
      friend_in_need_last: /** @type {Record<string, number>} */ ({}), // slot → game time of last in-need msg

      // Laundry async state
      laundry_phase: 'none',    // 'none' | 'washing' | 'drying' | 'done'
      laundry_phase_started: 0, // State.get('time') when current phase began

      // Observation tracking — fidelity degrades with distance from last observation
      last_observed_time: 6 * 60 + 30,   // alarm time
      last_observed_money: 47.50,         // matches default starting money
    };
  }

  function init() {
    s = defaults();
  }

  /** @template {keyof ReturnType<typeof defaults>} K @param {K} key @returns {ReturnType<typeof defaults>[K]} */
  function get(key) {
    return s[key];
  }

  /** @template {keyof ReturnType<typeof defaults>} K @param {K} key @param {ReturnType<typeof defaults>[K]} value */
  function set(key, value) {
    s[key] = value;
  }

  function getAll() {
    return { ...s };
  }

  /** @param {Partial<ReturnType<typeof defaults>>} saved */
  function loadState(saved) {
    s = { ...defaults(), ...saved };
  }

  /** @param {ReturnType<typeof defaults>} snapshot */
  function restoreSnapshot(snapshot) {
    s = structuredClone(snapshot);
  }

  // --- Time ---

  /** @param {number} minutes */
  function advanceTime(minutes) {
    s.time += minutes;

    // Passive effects per time passage
    const hours = minutes / 60;

    // Cortisol GI slow pathway — exponential approach toward current cortisol.
    // Cortisol acts on GI motility via the slow genomic pathway (hours), not the fast
    // synaptic pathway like NE (minutes). Half-life ~210 min (~3.5h) represents that delay.
    // Approximation debt: the 210 min half-life is chosen to represent the genomic pathway
    // timescale, not derived from measured cortisol GI kinetics literature. See TODO.md.
    s.cortisol_gi_slow = s.cortisol_gi_slow + (s.cortisol - s.cortisol_gi_slow) * (1 - Math.exp(-minutes / 210));

    // Stomach digestion — exponential decay with content-type blending.
    // Liquid half-life ~25 min derived from real gastric emptying data for fluids
    // (simple liquids clear the stomach in ~20–30 min under normal conditions).
    // Solid half-life ~90 min derived from real gastric emptying data for solid food
    // (first-order kinetics, slowing as it empties).
    // High sympathetic tone (NE, cortisol) suppresses GI motility via inhibition of the
    // enteric nervous system. Stressed characters digest more slowly.
    // NE: fast pathway (synaptic, minutes) — uses instant NE value. Correct.
    // Cortisol: slow pathway (genomic, hours) — uses cortisol_gi_slow, not instant cortisol.
    //   Acute cortisol spikes have minimal immediate GI effect; sustained elevation does.
    // Approximation debt: the scaling coefficients (0.5 for NE, 0.3 for cortisol_gi_slow)
    // and baseline threshold (50) are chosen. At NE=100, cortisol_gi_slow=100 the factor
    // is 1.8× (not 2× — the coefficients sum to 0.8, giving 1.0+0.8=1.8 max). Not derived
    // from real GI physiology data. See TODO.md.
    // Approximation debt: blending by stomach_liquid_fraction is a simplified linear mix.
    // Real stomachs partition contents heterogeneously; liquids float above solids and
    // drain through the pylorus preferentially. A full two-pool model would track separate
    // liquid and solid compartments, each with its own emptying curve. See TODO.md.
    const ne = s.norepinephrine;
    const cortGiSlow = s.cortisol_gi_slow;
    const gastricSlowFactor = 1
      + 0.5 * Math.max(0, Math.min(1, (ne - 50) / 50))
      + 0.3 * Math.max(0, Math.min(1, (cortGiSlow - 50) / 50));
    const liqFrac = s.stomach_liquid_fraction || 0;
    const baseHalfLife = liqFrac * 25 + (1 - liqFrac) * 90;
    const gastricHalfLife = baseHalfLife * gastricSlowFactor;
    s.stomach_fullness = Math.max(0, s.stomach_fullness * Math.exp(-Math.LN2 / gastricHalfLife * minutes));
    // When stomach empties fully, reset liquid fraction
    if (s.stomach_fullness <= 0) s.stomach_liquid_fraction = 0;

    // Post-prandial hormonal satiation — exponential decay independent of stomach emptying.
    // Represents CCK, GLP-1, PYY persistence and ghrelin suppression after a meal.
    // Approximation debt: half-life 150 min (2.5h) is the midpoint of the physiological
    // 2–4h range. Real duration varies by meal composition: protein and fat extend it (up to
    // 4h), simple carbohydrates shorten it (~2h). No nutrient differentiation yet. See TODO.md.
    if (s.hormonal_satiation > 0) {
      s.hormonal_satiation = Math.max(0, s.hormonal_satiation * Math.pow(0.5, hours / 2.5));
    }

    // Hunger signal — felt experience, suppressed by stomach fullness, nausea, and illness.
    // Base rate derived from real hunger return: people typically feel hungry ~3–5h after
    // a normal meal. Working back through stomach suppression: ~8 pts/hr gives "hungry" tier
    // (~40 pts above satiated) in ~5h including fullness suppression from a full meal.
    // Remaining approximation debt: suppression coefficient 0.85 is chosen not derived.
    // See TODO.md.
    let hungerRate = 8;
    // Stomach stretch receptors suppress hunger when full (physical volume signal)
    const stomachSuppression = s.stomach_fullness > 10 ? (s.stomach_fullness / 100) * 0.85 : 0;
    // Hormonal satiation suppresses hunger independently of stomach volume (CCK, GLP-1, PYY)
    // Approximation debt: same 0.85 coefficient applied to hormonal_satiation as to stomach
    // fullness. Real hormonal contribution has different weights per hormone and is additive
    // with volume signals, not interchangeable. Using max() rather than multiplication to avoid
    // over-suppression when both are high; real interaction is more complex. See TODO.md.
    const hormonalSuppression = (s.hormonal_satiation / 100) * 0.85;
    const hungerSuppression = Math.max(stomachSuppression, hormonalSuppression);
    if (hungerSuppression > 0) {
      hungerRate *= Math.max(0.1, 1 - hungerSuppression);
    }
    // Nausea overrides the hunger signal
    if (s.nausea > 15) {
      hungerRate *= Math.max(0.15, 1 - (s.nausea / 100) * 0.85);
    }
    // Illness suppresses appetite
    if (s.illness_severity > 0) {
      hungerRate *= Math.max(0.3, 1 - s.illness_severity * 0.7);
    }
    s.hunger = Math.min(100, s.hunger + hours * hungerRate);

    // Fluid deficit accumulation — ml/hr.
    // Derived: resting insensible loss (skin + respiration) ~25ml/hr + minimum urine output ~40ml/hr
    // = ~65ml/hr total at rest. (Popkin et al. 2010, Nutr Rev, PMC2908954; Cheuvront & Kenefick 2014
    // DOI 10.1002/cphy.c130017). Approximation debt: body weight not tracked (70kg reference);
    // activity level and temperature not wired to rate — see TODO.md.
    let thirstRate = 65; // ml/hr
    // Caffeine mild diuresis: ~20–30% increase in urine output at typical doses, adding ~8–15ml/hr.
    // (Armstrong 2002 PMID 12187535: net negative fluid balance only at very high doses ≥250mg.)
    // Approximation debt: linear scaling with caffeine_level; threshold 15 chosen.
    if (s.caffeine_level > 15) thirstRate += (s.caffeine_level - 15) / 85 * 15;
    s.thirst = s.thirst + hours * thirstRate;

    // Fluid absorption — pending_hydration drains into actual deficit reduction.
    // τ = 20 min (water gastric emptying half-life: Shi et al. 2004 PMID 15107010).
    // absorbed = pending × (1 − exp(−ln2 × hours / τ_h)) where τ_h = 20/60 h
    let excessAbsorbed = 0;
    if (s.pending_hydration > 0) {
      const absorbed = s.pending_hydration * (1 - Math.exp(-Math.LN2 * hours / (20 / 60)));
      s.pending_hydration = Math.max(0, s.pending_hydration - absorbed);
      excessAbsorbed = Math.max(0, absorbed - s.thirst); // surplus above deficit → kidneys excrete
      s.thirst = Math.max(0, s.thirst - absorbed);
    }

    // Bladder filling — from baseline kidney urine output + caffeine diuresis + excess absorbed fluid.
    // Baseline ~40ml/hr = urine component of total 65ml/hr fluid loss (insensible ~25ml/hr not included).
    // (Popkin et al. 2010 PMC2908954; van Kerrebroeck et al. 2002 BJU Int 90:4)
    // Caffeine diuretic: same modifier as thirst drain — produces more urine specifically.
    // (Armstrong 2002 PMID 12187535)
    // Approximation debts: nighttime ADH reduction (antidiuresis during sleep) not modeled;
    // cold diuresis not wired to temperature; stress-induced urgency not wired to fill rate.
    let urineRate = 40; // ml/hr
    if (s.caffeine_level > 15) urineRate += (s.caffeine_level - 15) / 85 * 15;
    s.bladder_fill = s.bladder_fill + hours * urineRate + excessAbsorbed;

    // Energy drain — accelerated by hunger and dehydration
    // Approximation debt: 3 pts/hr base energy drain is chosen. Real fatigue rate depends on
    // task load, circadian phase, physical demands — not a simple linear rate.
    // Hunger multipliers calibrated to sleep deprivation / caloric restriction literature:
    // moderate hunger (40-70): 1.1× — small, consistent with mild cognitive impairment only at
    // extreme restriction (Monk 1996 PMID 8877121); severe hunger (>70): 1.3× — moderate impairment
    // with glucose depletion (Gailliot & Baumeister 2007 PMID 17760605).
    const hungerDrainMultiplier = s.hunger > 70 ? 1.3 : s.hunger > 40 ? 1.1 : 1.0;
    // Mild dehydration accelerates fatigue. Effect smaller than hunger — dehydration at 1–2% body
    // water primarily impairs mood and cognition before energy (Ganio 2011 PMID 21736786).
    // Thresholds: 700ml = 1% deficit (thirst onset); 1400ml = 2% (cognitive/energy effects).
    // Approximation debt: magnitudes 0.3/0.1 chosen.
    const thirstEnergyDrain = s.thirst > 1400 ? 0.3 : s.thirst > 700 ? 0.1 : 0;
    s.energy = Math.max(0, s.energy - hours * (3 * hungerDrainMultiplier + thirstEnergyDrain));

    // Stress decays toward 0 via HPA negative feedback; impaired by rumination
    // Real mechanism: cortisol plasma t½ ~70-120 min → decay rate ~0.35-0.60/hr at genuine rest
    // (Zoccola 2020 PMID 30961457: ruminators show ~2× slower cortisol recovery post-stressor).
    // The self-escalating "+1 pt/hr above 50" model was wrong — no biological mechanism supports
    // autonomous HPA escalation within hours. The resistance to recovery IS the real phenomenon:
    // rumination re-activates the stress response, extending elevated state rather than adding to it.
    // Base rate 0.46/hr (t½ ≈ 90 min); halved at max rumination → 0.23/hr (t½ ≈ 3h).
    const rumination = s.rumination ?? 50;
    const stressDecayRate = 0.46 * (1 - (rumination / 100) * 0.5);
    s.stress = Math.max(0, s.stress * Math.exp(-hours * stressDecayRate));

    // Phone battery drains — screen-on vs standby
    const batteryDrain = s.viewing_phone ? 15 : 1;
    s.phone_battery = Math.max(0, s.phone_battery - hours * batteryDrain);

    // Daylight exposure — accumulates during astronomical daytime; faster when outside
    if (isDaytime()) {
      const area = ctx.world.getCurrentLocation()?.area;
      const outsideRate = (area === 'outside') ? 1.0 : 0.15;
      s.daylight_exposure = Math.min(300, s.daylight_exposure + minutes * outsideRate);
    }

    // Caffeine metabolism — half-life ~5 hours (300 min)
    if (s.caffeine_level > 0) {
      s.caffeine_level = Math.max(0, s.caffeine_level * Math.exp(-Math.LN2 / 300 * minutes));
    }

    // Diurnal temperature variation — coldest ~6am, warmest ~3pm
    // Only when temperature state exists (after first weather set)
    if (s.temperature !== undefined && s.weather) {
      const weatherOffset = s.weather === 'drizzle' ? -3
        : s.weather === 'snow' ? -2
        : s.weather === 'overcast' ? -1
        : 0;
      s.temperature = Math.round((seasonalTemperatureBaseline() + weatherOffset + diurnalTemperatureOffset()) * 10) / 10;
    }

    // Social connection decays asymptotically toward 0 during isolation.
    // τ=66h gives ~7 pts decline over 10h from social=50 (vs old linear 2 pts/hr = 20 pts, 2-4× too fast).
    // Threshold-based onset removed — accumulation is continuous from first isolation
    // (Tomova 2020 PMID 33230328; Ding et al. 2025 PMID 40011768).
    // Neuroticism scales rate ±35% (Buecker et al. 2020 meta-analysis N=93,668, DOI 10.1002/per.2229).
    // τ=66h: approximation debt — bounded by >10h (Tomova 2020 PMID 33230328) and <months (Roberts & Dunbar 2011).
    // Trait loneliness floor: high-trait-loneliness individuals have a structurally lower social asymptote —
    // even after contact, connection decays back toward a non-zero baseline rather than toward 0.
    // Cacioppo hypervigilance model (Hawkley & Cacioppo 2010 PMID 20652462). h²=48% (Boomsma 2005 PMID 16273322).
    // Scale 0.25: trait_loneliness=100 → floor=25; trait_loneliness=50 → floor=12.5.
    // Approximation debt: scale 0.25 chosen; literature says high-trait floor ~20-30 on this scale.
    // Legacy saves (no trait_loneliness): default 30 → floor 7.5.
    const neuroMod = 1 + (s.neuroticism - 50) / 50 * 0.35;
    const lonelinessFl = (s.trait_loneliness ?? 30) * 0.25;
    s.social = lonelinessFl + (s.social - lonelinessFl) * Math.exp(-hours * neuroMod / 66);
    // Social energy recovers during solitude — background recharge between interactions.
    // Introverts recharge faster in solitude; extroverts slower.
    // Full recovery from sleep via wakeUp().
    // Approximation debt: 3 pts/hr base rate and introversion coefficient 0.4 chosen.
    const introRecovery = 1 + ((s.introversion - 50) / 50) * 0.4; // 0.6–1.4×
    s.social_energy = Math.min(100, s.social_energy + hours * 3 * introRecovery);

    // Actions since rest
    s.actions_since_rest++;

    // Migraine mechanics (only for characters with the condition)
    if (s.health_conditions.includes('migraines')) {
      if (s.migraine_active) {
        // Decay: slow ramp to peak in first 2h, then decay ~8 pts/hr
        // Approximation debt: 8 pts/hr decay rate chosen — see intensity range comment at trigger site.
        s.migraine_hours_active += hours;
        if (s.migraine_hours_active > 2) {
          s.migraine_intensity = Math.max(0, s.migraine_intensity - hours * 8);
        }
        if (s.migraine_intensity < 5) {
          s.migraine_active = false;
          s.migraine_intensity = 0;
          s.migraine_hours_active = 0;
        }
        // Active migraine raises NE (pain signal) and suppresses dopamine
        adjustNT('norepinephrine', hours * 3);
        adjustNT('dopamine', -hours * 2);
      } else {
        // Trigger check: risk factors determine base probability per hour
        const riskScore = (s.adenosine > 60 ? (s.adenosine - 60) / 40 : 0) * 0.4
                        + (s.stress > 55 ? (s.stress - 55) / 45 : 0) * 0.4
                        + (s.sleep_debt > 480 ? Math.min(s.sleep_debt / 4800, 1) : 0) * 0.2;
        // Approximation debt: 0.003/hr base rate and 8× risk multiplier chosen. Migraine frequency
        // varies widely per individual (episodic: 1-14/month). The 8× maximum amplification from
        // combined risk factors is not derived from triggering threshold data.
        const baseChancePerHour = 0.003; // ~3 per 1000 play-hours at baseline
        const triggerChance = baseChancePerHour * (1 + riskScore * 8) * hours;
        if (ctx.timeline.chance(triggerChance)) {
          s.migraine_active = true;
          // Approximation debt: initial intensity range 30–70 and 8 pts/hr decay rate chosen.
          // Real migraine duration 4–72h (ICD-11); 8 pts/hr implies ~3.75–8.75h which is within
          // range but not calibrated to distribution data.
          s.migraine_intensity = 30 + riskScore * 40; // 30-70 depending on risk
          s.migraine_hours_active = 0;
        }
      }
    }

    // Dental pain — NT effects per tick
    if (s.health_conditions.includes('dental_pain') && s.dental_ache > 0) {
      // Passive decay — ache fades slowly (~1.5 pts/hr); lingers for hours after a spike
      // Approximation debt: 1.5 pts/hr decay rate chosen; real decay depends on underlying condition (caries, abscess, periodontal).
      s.dental_ache = Math.max(0, s.dental_ache - hours * 1.5);
      // Pain signal: low NE raise when aching, stronger when flaring
      adjustNT('norepinephrine', hours * 2 * (s.dental_ache / 100)); // Approximation debt: coefficient 2 chosen
      // Acute flare prevents settling — suppresses GABA
      if (s.dental_ache > 50) {
        adjustNT('gaba', -hours * 1.5); // Approximation debt: coefficient 1.5 and threshold 50 chosen
      }
    }

    // Acute illness — NT effects per tick
    if (s.illness_severity > 0) {
      const sev = s.illness_severity;
      const medFactor = s.illness_medicated ? 0.4 : 1.0;
      // Illness drives fatigue that doesn't clear through normal rest
      adjustNT('adenosine', sev * hours * 3 * medFactor);
      // Immune activation + body ache elevates NE (dull, not sharp)
      adjustNT('norepinephrine', sev * hours * 1.5 * medFactor);
      // Suppresses motivation and engagement
      adjustNT('dopamine', -sev * hours * 2 * medFactor);
    }

    // Caffeine withdrawal — builds when habitual user goes without caffeine.
    // Approximation debt: all rates below are chosen, not derived from real pharmacokinetics.
    // Real onset: ~12–24h after last dose. Real peak: ~20–51h. See TODO.md.
    if (s.caffeine_habit > 10) {
      if (s.caffeine_level < 15) {
        // Build rate from real caffeine withdrawal onset timing (Juliano & Griffiths 2004,
        // PMID 15448977): 12–24h onset, 20–51h peak. At habit=100, 1.2 pts/hr →
        // mild threshold (15pts) at ~12.5h, moderate (40pts) at ~33h, severe (70pts) at
        // ~58h — onset and peak within the documented real ranges.
        // Reduced from 1.5 to 1.2 to match the real 12–24h mild onset window.
        const buildRate = (s.caffeine_habit / 100) * 1.2;
        s.caffeine_withdrawal = Math.min(100, s.caffeine_withdrawal + buildRate * hours);

        // Receptor upregulation effect: chronic caffeine causes the brain to grow more
        // adenosine receptors. When caffeine is removed, the same adenosine hits a much
        // larger/more sensitive receptor population — effective adenosine signal amplified.
        // Approximation debt: sensitivity bonus formula (habit/100 * 0.5 * withdrawal/100)
        // is chosen, not derived from receptor density data.
        if (s.caffeine_habit > 30) {
          const sensitivityBonus = (s.caffeine_habit / 100) * 0.5 * (s.caffeine_withdrawal / 100);
          s.adenosine = clamp(s.adenosine + sensitivityBonus * hours * 4, 0, 100);
        }

        // Nausea — severe withdrawal + high habit triggers GI symptoms.
        // Mechanism: adenosine A1/A2A receptors in gut + brainstem chemoreceptor trigger
        // zone (area postrema) flood with unblocked adenosine. Vagus nerve involvement.
        // Approximation debt: thresholds (withdrawal>55, habit>45) and rate *5 are chosen.
        if (s.caffeine_withdrawal > 55 && s.caffeine_habit > 45) {
          const nauseaRate = ((s.caffeine_withdrawal - 55) / 45) * (s.caffeine_habit / 100) * 5;
          s.nausea = Math.min(100, s.nausea + nauseaRate * hours);
        }
      } else if (s.caffeine_level >= 25) {
        // Approximation debt: clear rates (25 pts/hr withdrawal, 8 pts/hr nausea) are chosen.
        // Real relief noticeable within 30–45 min of dosing.
        s.caffeine_withdrawal = Math.max(0, s.caffeine_withdrawal - hours * 25);
        s.nausea = Math.max(0, s.nausea - hours * 8);
      }
      if (s.caffeine_withdrawal > 0) {
        // Approximation debt: NE +2.5 and dopamine −2 pts/hr at withdrawal=100 are chosen.
        adjustNT('norepinephrine', (s.caffeine_withdrawal / 100) * hours * 2.5);
        adjustNT('dopamine', -(s.caffeine_withdrawal / 100) * hours * 2);
      }
    }

    // Nausea — NT effects and natural decay.
    // Approximation debt: decay 2 pts/hr, NT magnitudes (GABA −1.5, NE +1.0, adenosine +2)
    // are all chosen with no real-world anchor. See TODO.md.
    if (s.nausea > 0) {
      s.nausea = Math.max(0, s.nausea - hours * 2);
      // Can't settle when nauseated — suppresses GABA; mild NE from body distress
      adjustNT('gaba', -(s.nausea / 100) * hours * 1.5);
      adjustNT('norepinephrine', (s.nausea / 100) * hours * 1.0);
      // Severe nausea: systemic adenosine flood via vagus/brainstem compounds fog
      if (s.nausea > 60) {
        adjustNT('adenosine', (s.nausea / 100) * hours * 2);
      }
    }

    // Vomiting — probabilistic when nausea is severe.
    // Guard on !pending_vomit: once the flag is set, skip further rolls until it fires and clears.
    // Emesis probability is etiology-dependent (Andrews et al. 2021 PMC8198651: nausea and vomiting
    // are distinct phenomena with no fixed relationship). Illness (gastroenteritis) has high emetic
    // efficiency via peripheral 5-HT3 vagal pathway; psychogenic/withdrawal has low efficiency.
    if (!s.pending_vomit) {
      let vomitRate = 0;
      if (s.illness_severity > 0.1 && s.nausea > 40) {
        // Illness curve: norovirus challenge data (Atmar 2016 PMC4845978); CTCAE grades (PMC3503672).
        // VAS onset threshold ~40 (Meek 2015 PMID 25996342; Boogaerts 2000 PMID 10757584).
        // Approximation debt: piecewise linear; no published P(vomit|VAS) curve exists.
        const n = s.nausea;
        if (n > 70)      vomitRate = 0.25 + ((n - 70) / 30) * 0.5;  // 0.25–0.75/hr (CTCAE grade 3+)
        else if (n > 50) vomitRate = 0.05 + ((n - 50) / 20) * 0.2;  // 0.05–0.25/hr (grade 2)
        else             vomitRate = ((n - 40) / 10) * 0.05;         // 0–0.05/hr (grade 1 onset)
        vomitRate *= Math.min(1, s.illness_severity * 3); // mild illness damps rate
      } else if (s.nausea > 75) {
        // Non-illness (caffeine withdrawal, psychogenic): low emetic efficiency.
        // Approximation debt: rate 0.2/hr at nausea=100 chosen; functional vomiting ~2% monthly (Talley 2007 PMID 17885700).
        vomitRate = ((s.nausea - 75) / 25) * 0.2;
      }
      if (vomitRate > 0 && ctx.timeline.chance(vomitRate * hours)) {
        s.pending_vomit = true;
      }
    }

    // Neurochemistry drift — levels approach targets with inertia
    driftNeurochemistry(hours);
  }

  // --- Time of day / calendar ---

  /** Minutes within the current 24h period */
  function timeOfDay() {
    return ((s.time % 1440) + 1440) % 1440;
  }

  function getHour() {
    return Math.floor(timeOfDay() / 60);
  }

  function getMinute() {
    return Math.floor(timeOfDay() % 60);
  }

  function getTimeString() {
    const h = getHour();
    const m = getMinute();
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }

  /** Game day counter (1-indexed) */
  function getDay() {
    return Math.floor(s.time / 1440) + 1;
  }

  /** Calendar date from start_timestamp + time */
  function calendarDate() {
    const d = new Date((s.start_timestamp + s.time) * 60000);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),    // 0-11
      day: d.getUTCDate(),       // 1-31
      weekday: d.getUTCDay(),    // 0-6 (Sun=0)
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
    };
  }

  function dayOfWeek() {
    return calendarDate().weekday;
  }

  function season() {
    const month = calendarDate().month;
    const absLat = Math.abs(s.latitude);

    // Tropical — wet/dry, not four seasons
    if (absLat < 23.5) {
      // Wet season aligns with the hemisphere's summer
      if (s.latitude >= 0) {
        return (month >= 4 && month <= 9) ? 'wet' : 'dry';
      }
      return (month >= 10 || month <= 3) ? 'wet' : 'dry';
    }

    // Temperate / subarctic — four seasons from calendar month
    let m = month;
    if (s.latitude < 0) {
      m = (month + 6) % 12;
    }
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'autumn';
    return 'winter';
  }

  function hemisphere() {
    return s.latitude >= 0 ? 'north' : 'south';
  }

  function climateZone() {
    const absLat = Math.abs(s.latitude);
    if (absLat < 23.5) return 'tropical';
    if (absLat <= 66.5) return 'temperate';
    return 'polar';
  }

  /** Hours of daylight today — standard astronomical formula from latitude + day of year */
  function dayLengthHours() {
    const cd = calendarDate();
    // Day of year from month/day (ignoring leap year — fine for this purpose)
    const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const doy = monthDays[cd.month] + cd.day;
    const lat = s.latitude * Math.PI / 180;
    const decl = -23.45 * Math.PI / 180 * Math.cos(2 * Math.PI / 365 * (doy + 10));
    const cosH = -Math.tan(lat) * Math.tan(decl);
    if (cosH <= -1) return 24; // polar day
    if (cosH >= 1) return 0;   // polar night
    return 2 * Math.acos(cosH) * 180 / Math.PI / 15;
  }

  function sunriseHour() { return 12 - dayLengthHours() / 2; }
  function sunsetHour()  { return 12 + dayLengthHours() / 2; }

  function isDaytime() {
    const h = getHour() + getMinute() / 60;
    return h >= sunriseHour() && h < sunsetHour();
  }

  function isSunrise() {
    const h = getHour() + getMinute() / 60;
    return Math.abs(h - sunriseHour()) < 0.5;
  }

  function isSunset() {
    const h = getHour() + getMinute() / 60;
    return Math.abs(h - sunsetHour()) < 0.5;
  }

  /** @param {number} eventTime @returns {number} */
  function daysSince(eventTime) {
    return (s.time - eventTime) / 1440;
  }

  /** @param {number} t1 @param {number} t2 @returns {boolean} */
  function isSameDay(t1, t2) {
    return Math.floor(t1 / 1440) === Math.floor(t2 / 1440);
  }

  function isWorkHours() {
    if (!isWorkday()) return false;
    const tod = timeOfDay();
    return tod >= s.work_shift_start && tod < s.work_shift_end;
  }

  function isLateForWork() {
    if (!isWorkday()) return false;
    const tod = timeOfDay();
    return tod > s.work_shift_start + 15 && !s.at_work_today && !s.called_in;
  }

  /** Reset wake-period flags — called when the player wakes from sleep */
  function wakeUp() {
    s.dressed = false;
    s.showered = false;
    s.ate_today = false;
    s.at_work_today = false;
    s.called_in = false;
    s.work_tasks_done = 0;
    s.alarm_went_off = false;
    s.just_woke_alarm = false;
    s.snooze_count = 0;
    s.last_surfaced_late_tier = null;
    s.last_surfaced_mess_tier = null;
    s.work_nagged_today = false;
    s.ate_at_work_today = false;
    s.grazed_break_room_today = false;
    s.ate_at_soup_kitchen_today = false;
    s.daylight_exposure = 0;
    s.location_arrival_time = s.time; // sleep resets bedroom familiarity
    s.illness_medicated = false;
    s.pending_vomit = false;  // clear any stale vomit flag — sleep resolves nausea
    s.social_energy = 100; // sleep fully restores social energy
    // Caffeine habit — update from yesterday's peak, then reset.
    // Build: +5/day → habit reaches 100 in ~20 days of daily use, matching the real
    // 2-week tolerance development timeline (Beaumont et al. 2017, PLOS ONE).
    // Fade: -4/day → 25-day washout from habit=100, consistent with 7–21 day receptor
    // normalization for moderate users and up to 25 days for heavy users.
    // Previous rates (+8/−5) compressed real timelines by ~35%.
    if (s.caffeine_today_peak >= 40) {
      s.caffeine_habit = Math.min(100, s.caffeine_habit + 5);
    } else {
      s.caffeine_habit = Math.max(0, s.caffeine_habit - 4);
    }
    s.caffeine_today_peak = 0;
    // Dental — underlying condition means you always wake with at least a dull ache
    if (s.health_conditions.includes('dental_pain')) {
      s.dental_ache = Math.max(s.dental_ache, 8);
    }
  }

  // --- Qualitative tiers ---
  // These translate numbers into qualitative states the content system uses.
  // The player never sees "energy: 23" — they see prose that reflects the tier.

  /** @param {number} value @param {[number, string][]} thresholds */
  function tier(value, thresholds) {
    // thresholds = [[max, label], ...] sorted ascending
    for (const [max, label] of thresholds) {
      if (value <= max) return label;
    }
    return /** @type {[number, string]} */ (thresholds[thresholds.length - 1])[1];
  }

  function energyTier() {
    return tier(s.energy, [
      [10, 'depleted'],
      [25, 'exhausted'],
      [45, 'tired'],
      [65, 'okay'],
      [85, 'rested'],
      [100, 'alert']
    ]);
  }

  function stressTier() {
    return tier(s.stress, [
      [15, 'calm'],
      [35, 'baseline'],
      [55, 'tense'],
      [75, 'strained'],
      [100, 'overwhelmed']
    ]);
  }

  function hungerTier() {
    return tier(s.hunger, [
      [15, 'satisfied'],
      [35, 'fine'],
      [55, 'hungry'],
      [75, 'very_hungry'],
      [100, 'starving']
    ]);
  }

  function thirstTier() {
    // Thresholds in ml fluid deficit. 700ml = ~1% body water (70kg reference) = thirst onset.
    // 1400ml = ~2% = clear thirst + cognitive effects. (Cheuvront & Kenefick 2014 DOI 10.1002/cphy.c130017)
    return tier(s.thirst, [
      [100,  'quenched'],
      [350,  'fine'],
      [700,  'thirsty'],
      [1400, 'very_thirsty'],
      [4000, 'parched']
    ]);
  }

  function bladderNeedTier() {
    // Thresholds from Weiss 2012 (PMID 23140552): first urge ~150ml, functional capacity ~300-400ml.
    // Maximal capacity (discomfort onset) ~500-600ml. Pressing = above functional capacity.
    return tier(s.bladder_fill, [
      [50,  'empty'],
      [150, 'fine'],
      [300, 'aware'],   // first urge sensation
      [450, 'urgent'],  // functional capacity — genuine need
      [700, 'pressing'] // above functional capacity — uncomfortable
    ]);
  }

  function socialTier() {
    return tier(s.social, [
      [15, 'isolated'],
      [35, 'withdrawn'],
      [55, 'neutral'],
      [75, 'connected'],
      [100, 'warm']
    ]);
  }

  function socialEnergyTier() {
    return tier(s.social_energy, [
      [20, 'drained'],
      [40, 'tired'],
      [65, 'neutral'],
      [85, 'rested'],
      [100, 'energized']
    ]);
  }

  function jobTier() {
    return tier(s.job_standing, [
      [20, 'at_risk'],
      [40, 'shaky'],
      [55, 'adequate'],
      [75, 'solid'],
      [100, 'valued']
    ]);
  }

  function batteryTier() {
    if (s.phone_battery <= 0) return 'dead';
    if (s.phone_battery <= 5) return 'critical';
    if (s.phone_battery <= 15) return 'low';
    return 'fine';
  }

  function moneyTier() {
    if (s.money <= 0) return 'broke';
    if (s.money < 50) return 'scraping';
    if (s.money < 200) return 'tight';
    if (s.money < 600) return 'careful';
    if (s.money < 1500) return 'okay';
    if (s.money < 5000) return 'comfortable';
    return 'cushioned';
  }

  function sleepDebtTier() {
    if (s.sleep_debt <= 60) return 'none';       // under an hour
    if (s.sleep_debt <= 240) return 'mild';      // up to 4 hours
    if (s.sleep_debt <= 720) return 'moderate';  // up to 12 hours
    return 'severe';                             // 12+ hours
  }

  function fridgeTier() {
    const f = s.fridge_food;
    if (f === 0) return 'empty';
    if (f <= 2) return 'sparse';
    if (f <= 4) return 'stocked';
    return 'well_stocked';
  }

  function pantryTier() {
    const p = s.pantry_food;
    if (p === 0) return 'empty';
    if (p <= 1) return 'sparse';
    return 'stocked';
  }

  /**
   * Typographic intensity tier for inner voice rendering.
   * Returns null when NT state is calm — no inner voice surfaces.
   * Score-based: each destabilizing condition adds 1 point.
   * @returns {null | 'uneasy' | 'prominent' | 'tremor'}
   */
  function innerVoiceTier() {
    let score = 0;
    if (s.gaba < 40) score++;
    if (s.norepinephrine > 65) score++;
    if (s.serotonin < 35) score++;
    if (s.rumination > 65) score++;
    if (score === 0) return null;
    if (score === 1) return 'uneasy';
    if (score === 2) return 'prominent';
    return 'tremor';
  }

  /** Whether the character has enough money to spend this amount. */
  function canAfford(amount) {
    return s.money >= amount;
  }

  /**
   * Days until next paycheck (0 = today, 1 = tomorrow, etc.).
   * Paycheck fires on day % 14 === paycheck_day_offset % 14.
   */
  function nextPaycheckDays() {
    const day = getDay();
    const offset = s.paycheck_day_offset % 14;
    const daysInCycle = ((offset - day % 14) + 14) % 14;
    // If today is paycheck day and it already fired this period, next is in 14 days
    return (daysInCycle === 0 && s.last_paycheck_day === day) ? 14 : daysInCycle;
  }

  /**
   * The next bill due: name, rough amount, and days until it fires.
   * Returns the soonest upcoming bill.
   */
  function nextBillDue() {
    const day = getDay();
    const bills = [
      { name: 'rent',      amount: s.rent_amount, offset: s.rent_day_offset % 30,      cycle: 30, last: s.last_rent_day },
      { name: 'utilities', amount: 65,            offset: s.utility_day_offset % 30,   cycle: 30, last: s.last_utility_day },
      { name: 'phone',     amount: 45,            offset: s.phone_bill_day_offset % 30, cycle: 30, last: s.last_phone_bill_day },
    ];
    let soonest = null;
    for (const bill of bills) {
      const daysUntil = ((bill.offset - day % bill.cycle) + bill.cycle) % bill.cycle;
      const adjustedDays = (daysUntil === 0 && bill.last === day) ? bill.cycle : daysUntil;
      if (soonest === null || adjustedDays < soonest.daysUntil) {
        soonest = { name: bill.name, amount: bill.amount, daysUntil: adjustedDays };
      }
    }
    return soonest;
  }

  /**
   * Minutes late for work right now (0 if on time, not a workday, or already clocked in).
   * Matches the 15-minute grace window used by isLateForWork().
   */
  function latenessMinutes() {
    if (!isLateForWork()) return 0;
    return Math.max(0, Math.round(timeOfDay() - (s.work_shift_start + 15)));
  }

  /**
   * Qualitative tier for how late the character is.
   * Returns 'fine' when not late. Used for transition-based event firing.
   * Approximation debt: thresholds (0 min, 20 min) are chosen — not derived from
   * real workplace tolerance data. Real grace windows vary by industry and employer
   * (5–30 min). A missed-punch system or manager relationship would provide the
   * right upstream variable.
   */
  function lateTier() {
    const minutes = latenessMinutes();
    if (minutes <= 0) return 'fine';
    if (minutes <= 20) return 'late';
    return 'very_late';
  }

  /** True on Mon–Fri (weekday 1–5). The character's specific schedule may differ, but this is the baseline. */
  function isWorkday() {
    const dow = dayOfWeek(); // 0=Sun, 1=Mon, ..., 6=Sat
    return dow >= 1 && dow <= 5;
  }

  // --- Caffeine ---

  /** Qualitative caffeine level. Content branches on these labels. */
  function caffeineTier() {
    const c = s.caffeine_level;
    if (c < 10) return 'none';
    if (c < 35) return 'low';
    if (c < 70) return 'active';
    return 'high';
  }

  /**
   * Consume caffeine (one cup of coffee ≈ 50 units).
   * Blocks adenosine receptors — adenosine still accumulates behind the block.
   * Crash hits when caffeine clears and all that accumulated adenosine is felt.
   * Small acute NE bump from sympathomimetic effect.
   *
   * Acute tolerance: at high habit, fewer spare receptors are available to block,
   * so each dose has diminished effect. At habit=0, full amount. At habit=100, ~70%.
   */
  function consumeCaffeine(amount) {
    // The 0.3 coefficient (30% reduction at max habit) is contested. Cross-sectional
    // meta-analyses (Carvalho 2022) find no significant blunting in habitual vs.
    // non-habitual consumers. Longitudinal controlled studies (Beaumont 2017) show some
    // blunting of ~20–30% after weeks of daily use. The 0.3 represents the upper end of
    // longitudinal estimates. Approximation debt: direction is right, magnitude uncertain.
    const effectiveAmount = amount * (1 - 0.3 * (s.caffeine_habit / 100));
    s.caffeine_level = clamp(s.caffeine_level + effectiveAmount, 0, 100);
    s.caffeine_today_peak = Math.max(s.caffeine_today_peak, s.caffeine_level);
    // Acute sympathomimetic effect: small NE boost, also tolerance-scaled
    adjustNT('norepinephrine', effectiveAmount * 0.2);
  }

  /**
   * Adenosine receptor block factor. 0 = fully blocked (caffeine=100), 1 = unblocked (no caffeine).
   * Multiply lerp01(adenosine, ...) weights by this before using them in prose.
   * High caffeine → adenosine still accumulates but isn't felt — crash hits when caffeine clears.
   *
   * Tolerance adjustment: at high habit, the receptor pool is upregulated — more receptors
   * exist, so the same caffeine_level blocks a smaller fraction of total receptor capacity.
   * The blocking curve is shifted: a habituated user at caffeine_level=50 gets less block
   * than a naive user at the same level.
   *
   * Tolerance adjustment grounded in Bhagwat 1993 (PMC3437321): chronic caffeine causes
   * ~20% A1 receptor upregulation in animals. At habit=100, denominator=120, meaning
   * ~83% max block for a habituated user vs. 100% for a naive user.
   * Approximation debt: animal data applied to a human model; direct human receptor
   * density data unavailable. The ~20% figure is the best available estimate.
   */
  function adenosineBlock() {
    // Tolerance shifts the effective denominator upward: more caffeine needed for full block.
    // At habit=0: denominator=100 (unchanged). At habit=100: denominator=120.
    // ~20% A1 receptor upregulation (Bhagwat 1993, PMC3437321) — animal data, human approximate.
    const denominator = 100 + 0.20 * s.caffeine_habit;
    return Math.max(0, 1 - s.caffeine_level / denominator);
  }

  /**
   * Sleep quality multiplier from caffeine. 1.0 = no interference.
   * Caffeine above 30 at bedtime meaningfully degrades sleep.
   */
  function caffeineSleepInterference() {
    const c = s.caffeine_level;
    if (c < 30) return 1.0;
    // Linear from 1.0 at 30 → 0.65 at 100
    return Math.max(0.65, 1.0 - (c - 30) * 0.005);
  }

  /** Qualitative caffeine withdrawal tier. Content branches on these labels. */
  function withdrawalTier() {
    const w = s.caffeine_withdrawal;
    if (w < 15) return 'none';
    if (w < 40) return 'mild';
    if (w < 70) return 'moderate';
    return 'severe';
  }

  /** Qualitative nausea tier. Shared across systems (withdrawal, illness, alcohol). */
  function nauseaTier() {
    const n = s.nausea;
    if (n < 15) return 'none';
    if (n < 40) return 'queasy';
    if (n < 70) return 'sick';
    return 'severe';
  }

  // --- Temperature ---

  /**
   * Seasonal temperature baseline in celsius from latitude + current season.
   * Formula calibrated to real-world means ± seasonal amplitude.
   * Tropical: ~27-30°C year-round. Temperate lat 42: ~1–19°C range.
   */
  function seasonalTemperatureBaseline() {
    const absLat = Math.abs(s.latitude);
    const mean = 30 - 0.5 * absLat; // lat 0 → 30, lat 42 → 9, lat 58 → 1
    if (absLat < 23.5) {
      // Tropical: slight wet/dry variation (±2°C)
      const sn = season();
      return sn === 'wet' ? mean + 2 : mean - 2;
    }
    // Temperate: amplitude scales with latitude beyond tropics
    const amplitude = (absLat - 23.5) / 43 * 22; // 0 at tropical edge, ~22°C at lat 66.5
    const sn = season();
    if (sn === 'summer') return mean + amplitude;
    if (sn === 'winter') return mean - amplitude;
    return mean; // spring/autumn at mean
  }

  /**
   * Diurnal temperature offset in celsius.
   * Coldest ~6am, warmest ~3pm (15:00). Amplitude ≈3°C tropical, 5°C temperate.
   */
  function diurnalTemperatureOffset() {
    const hour = timeOfDay() / 60; // fractional hours 0–24
    const absLat = Math.abs(s.latitude);
    const amplitude = absLat < 23.5 ? 3 : 5;
    return amplitude * Math.cos(2 * Math.PI * (hour - 15) / 24);
  }

  /** Qualitative temperature label. Content branches on these. */
  function temperatureTier() {
    const t = s.temperature;
    if (t < -5)  return 'bitter';
    if (t < 5)   return 'freezing';
    if (t < 10)  return 'cold';
    if (t < 16)  return 'cool';
    if (t < 22)  return 'mild';
    if (t < 28)  return 'warm';
    return 'hot';
  }

  // --- Health ---

  function hasCondition(id) {
    return s.health_conditions.includes(id);
  }

  /**
   * Maximum achievable energy this moment. Conditions (and migraines) reduce the ceiling.
   * Body.energyCeiling() — content can read this to understand what's possible.
   */
  function energyCeiling() {
    if (s.migraine_active) {
      // Migraine cuts ceiling: -30 at intensity 60, -50 at intensity 100
      return Math.max(30, 100 - s.migraine_intensity * 0.5);
    }
    if (s.illness_severity > 0.1) {
      // Illness cuts ceiling proportionally: -25 at severity 0.5, -45 at severity 1.0
      return Math.max(30, 100 - s.illness_severity * 50);
    }
    // Acute dental flare cuts ceiling modestly — pain is local but consuming
    if (s.dental_ache > 60) {
      return Math.max(50, 100 - s.dental_ache * 0.4);
    }
    return 100;
  }

  /** Qualitative migraine state. 'none' when no migraine. */
  function migraineTier() {
    if (!s.migraine_active || s.migraine_intensity < 5) return 'none';
    if (s.migraine_intensity < 30) return 'building';
    if (s.migraine_intensity < 65) return 'active';
    return 'severe';
  }

  /** Qualitative acute illness state. 'healthy' when not sick. */
  function illnessTier() {
    if (s.illness_severity < 0.05) return 'healthy';
    if (s.illness_severity < 0.3) return 'unwell';
    if (s.illness_severity < 0.65) return 'sick';
    return 'very_sick';
  }

  /** Qualitative dental pain state. 'none' when condition absent or quiescent. */
  function dentalTier() {
    if (!s.health_conditions.includes('dental_pain') || s.dental_ache < 5) return 'none';
    if (s.dental_ache < 45) return 'dull';   // clinically mild (VAS 5–44, PMC5766084); background ache, easy to push through
    if (s.dental_ache < 75) return 'ache';   // clinically moderate (VAS 45–74); noticeably painful, affects eating choices
    return 'flare';                          // clinically severe (VAS ≥75); acute, hard to ignore, affects everything
  }

  /**
   * Spike dental ache by amount (from eating, hot/cold triggers).
   * No-op if dental_pain condition is absent.
   * @param {number} amount
   */
  function dentalSpike(amount) {
    if (!s.health_conditions.includes('dental_pain')) return;
    s.dental_ache = Math.max(0, Math.min(100, s.dental_ache + amount));
  }

  function timePeriod() {
    const h = getHour();
    if (h < 5) return 'deep_night';
    if (h < 7) return 'early_morning';
    if (h < 9) return 'morning';
    if (h < 12) return 'late_morning';
    if (h < 14) return 'midday';
    if (h < 17) return 'afternoon';
    if (h < 20) return 'evening';
    if (h < 23) return 'night';
    return 'deep_night';
  }

  // --- Sleep cycle breakdown ---
  // Models the internal architecture of a sleep episode. Cycle lengths are
  // variable: first cycle is shorter (deep sleep onset is fast), later cycles
  // lengthen as REM dominates. Personal base cycle length is a stable biological
  // trait generated at chargen (truncated normal: mean=93, SD=12, clipped [70,120],
  // per Blume et al. 2023 PSG data), stored in state as sleep_cycle_length and applied
  // by Character.applyToState().
  // Early cycles are deep-sleep heavy; later cycles are REM heavy.
  // Deep-sleep (N3) fractions scale with character age (Van Cauter et al. 2000).
  // No PRNG consumed — purely deterministic from duration and state.

  /**
   * Duration of cycle i (0-indexed), scaled to the character's personal base length.
   * Ratios: [0.83, 1.0, 1.11, 1.17] — first cycle is shorter (sleep onset is fast),
   * later cycles lengthen as REM episodes extend.
   * Approximation debt: ratios are derived from the population-mean cycle structure
   * (75/90/100/105 → 0.83/1.0/1.11/1.17 of 90). Real ratio variation across
   * individuals and nights is unknown. Needs calibration against polysomnography data.
   * sleep_cycle_length drawn from truncated normal (mean=93, SD=12, [70,120])
   * per Blume et al. 2023 — replaces old uniform [70,120] draw.
   * @param {number} i
   * @returns {number} minutes
   */
  function cycleDuration(i) {
    const base = s.sleep_cycle_length ?? 90;
    // Approximation debt: ratios approximate population-mean staging; per-character
    // cycle shape variation (not just length) is not yet modeled.
    if (i === 0) return Math.round(base * 0.83);
    if (i === 1) return base;
    if (i === 2) return Math.round(base * 1.11);
    return Math.round(base * 1.17);
  }

  /**
   * Break a sleep episode into its cycle components.
   * @param {number} sleepMinutes
   * @returns {{ completeCycles: number, partialCycleFrac: number, deepSleepFrac: number, remFrac: number, sleepInertia: number }}
   */
  function sleepCycleBreakdown(sleepMinutes) {
    // Walk through variable-length cycles to find how many complete and the partial fraction.
    let elapsed = 0;
    let completeCycles = 0;
    let partialCycleFrac = 0;
    while (true) {
      const dur = cycleDuration(completeCycles);
      if (elapsed + dur <= sleepMinutes) {
        elapsed += dur;
        completeCycles++;
      } else {
        partialCycleFrac = (sleepMinutes - elapsed) / dur;
        break;
      }
    }

    // Per-cycle deep/REM fractions fitted to match real staging targets:
    // 8-hour sleep → ~20% deep, ~25% REM (fractions of total sleep time).
    // Approximation debt: k=0.57 (deep decay), slope=0.07 (REM growth), cap=0.55 (REM max),
    // and cycle-0 anchors (deep=0.50, rem=0.10) are chosen to hit the staging targets above,
    // not independently derived from polysomnography mechanistic data. See TODO.md.
    //
    // Age-dependent N3 scaling: Van Cauter et al. 2000 (JAMA, n=149) found N3 falls from
    // ~19% at age 16–25 to ~3–8% at age 36–50 — roughly 80% reduction by midlife.
    // We linearly interpolate: age ≤ 25 → factor 1.0, age ≥ 50 → factor 0.2.
    // Approximation debt: real N3-vs-age relationship is non-linear (steep drop in 3rd decade,
    // plateau later); linear interpolation from two anchor points is an approximation.
    // Approximation debt: only the deep-sleep anchors (cycle-0 deep and k decay) are scaled;
    // cycle shape ratios and REM trajectory are not age-adjusted (REM is negligibly affected
    // over 22–48 per Joffe et al.: −0.6% per decade).
    // Cycle 0: deep ~50%, REM ~10% (at age ≤ 25; lower at older ages)
    // Cycle 1: deep ~29%, REM ~17%
    // Cycle 2: deep ~16%, REM ~24%
    // Cycle 3: deep ~9%,  REM ~31%
    // Cycle 4: deep ~5%,  REM ~38%
    // Cycle 5+: deep ~2-3%, REM ~45-55%
    const age = s.age_stage ?? 35;
    // Linear interpolation: 1.0 at age≤25, 0.2 at age≥50.
    const ageFactor = Math.max(0.2, Math.min(1.0, 1.0 - (Math.max(0, age - 25) / 25) * 0.8));
    function cycleFracs(i) {
      // Scale both the cycle-0 deep anchor and the k-decay anchor by ageFactor.
      const deep = i === 0
        ? 0.50 * ageFactor
        : Math.max(0.50 * ageFactor * Math.pow(0.57, i), 0.02 * ageFactor);
      const rem  = Math.min(0.10 + i * 0.07, 0.55);
      return { deep, rem };
    }

    // Normalize by total sleep time (not cycle count) — cycles have different durations,
    // so equal-weight averaging over cycles would inflate REM from longer late cycles.
    let deepMinutes = 0;
    let remMinutes = 0;
    for (let i = 0; i < completeCycles; i++) {
      const { deep, rem } = cycleFracs(i);
      const dur = cycleDuration(i);
      deepMinutes += deep * dur;
      remMinutes += rem * dur;
    }
    if (partialCycleFrac > 0) {
      const { deep, rem } = cycleFracs(completeCycles);
      const dur = cycleDuration(completeCycles);
      deepMinutes += deep * partialCycleFrac * dur;
      remMinutes += rem * partialCycleFrac * dur;
    }

    const deepSleepFrac = sleepMinutes > 0 ? clamp(deepMinutes / sleepMinutes, 0, 1) : 0;
    const remFrac = sleepMinutes > 0 ? clamp(remMinutes / sleepMinutes, 0, 1) : 0;

    // Sleep inertia: waking mid-deep-sleep in early cycles is worst.
    // Deep sleep fraction drops sharply after cycle 2, so inertia fades quickly.
    // The 0.6 ceiling is calibrated to worst-case stacking: N3 + early cycle + high
    // sleep debt + circadian nadir (Dinges: ~41% N3 impairment; Scheer 2008: 3.6×
    // circadian range; McCauley/Rajaraman PMC6519907: ~2.7× CSR amplification).
    let sleepInertia = 0;
    if (partialCycleFrac > 0 && completeCycles < 3) {
      const depthFactor = cycleFracs(completeCycles).deep;
      // Mid-cycle is worst (peak at 0.3-0.6 of cycle = deep sleep phase)
      const phaseInertia = partialCycleFrac < 0.6 ? partialCycleFrac / 0.6 : (1 - partialCycleFrac) / 0.4;
      const baseInertia = depthFactor * phaseInertia * 1.2;

      // Sleep debt amplifier: chronic restriction produces ~2.7× worse inertia magnitude
      // (McCauley / Rajaraman, PMC6519907). Conservative 1.5× max here since duration
      // extension (7×) is not modeled — that's a separate approximation debt.
      const debtAmp = 1 + 0.5 * (s.sleep_debt / 4800);

      // Circadian phase amplifier: waking at biological night (2300–0300) vs afternoon
      // is ~3.6× worse (Scheer et al. 2008, PMC3130065). Conservative 1.25× max here —
      // the full 3.6× effect compounds with base inertia and debt, and the 0.6 cap holds.
      // Cosine peaks at 0100h (biological nadir ~1h from midnight), troughs at 1300h.
      const todH = timeOfDay() / 60;
      const circAdj = Math.cos(((todH - 1 + 24) % 24) * 2 * Math.PI / 24);
      const circAmp = 1 + 0.25 * Math.max(0, circAdj);

      sleepInertia = clamp(baseInertia * debtAmp * circAmp, 0, 0.6);
    }

    return { completeCycles, partialCycleFrac, deepSleepFrac, remFrac, sleepInertia };
  }

  // --- Compound state queries ---
  // These reflect how states interact

  function canFocus() {
    return s.energy > 20 && s.hunger < 70 && s.stress < 80;
  }

  function moodTone() {
    // WARNING: This is a lossy bottleneck. 28 continuous neurochemical systems
    // collapsed to one of 8 discrete strings — hard thresholds producing the
    // exact snap the neurochemistry layer exists to prevent. Fine as a coarse
    // prose-variant selector for now, but content.js should increasingly read
    // NT values directly for continuous shading. This function must not remain
    // the primary interface between state and prose.
    //
    // Primary: neurochemistry (serotonin, dopamine, NE, GABA).
    // Override: extreme physical conditions can break through.
    // Same 8 tones as before — all ~27 content.js callsites unchanged.

    const ser = s.serotonin;
    const dop = s.dopamine;
    const ne = s.norepinephrine;
    const ga = s.gaba;
    const e = s.energy;
    const st = s.stress;
    const so = s.social;

    // Physical overrides — the body breaking through neurochemistry
    if (st > 75) return 'fraying';        // acute stress overwhelms everything
    if (e <= 15 && st > 60) return 'numb'; // depleted + stressed = shutdown

    // Neurochemical fraying — NE high + GABA low = system overloaded
    if (ne > 65 && ga < 35) return 'fraying';

    // Neurochemical numb — serotonin + dopamine both very low = emotional shutdown
    if (ser < 25 && dop < 25) return 'numb';

    // Heavy — low energy + lowered serotonin, or sustained low serotonin + dopamine
    if ((e <= 25 && ser < 40) || (ser < 35 && dop < 35)) return 'heavy';

    // Hollow — low serotonin + social isolation
    if (ser < 40 && so <= 20) return 'hollow';

    // Quiet — low social engagement + moderate NE (withdrawn but not in pain)
    if (so <= 20 && ne > 35) return 'quiet';

    // Clear — serotonin high + dopamine high + NE moderate + GABA adequate (rare, earned)
    if (ser > 65 && dop > 65 && ne > 30 && ne < 60 && ga > 45) return 'clear';

    // Present — serotonin and dopamine above baseline
    if (ser > 45 && dop > 42) return 'present';

    return 'flat';
  }

  // --- State modification helpers ---

  /** @param {number} amount */
  function adjustEnergy(amount) {
    s.energy = Math.max(0, Math.min(100, s.energy + amount));
    // Significant energy recovery resets exhaustion surfacing — next crossing noticed fresh
    if (amount >= 10) s.last_surfaced_energy_tier = energyTier();
  }

  /** @param {number} amount */
  function adjustStress(amount) {
    s.stress = Math.max(0, Math.min(100, s.stress + amount));
  }

  /** @param {number} amount */
  function adjustHunger(amount) {
    s.hunger = Math.max(0, Math.min(100, s.hunger + amount));
    // Eating resets hunger surfacing to current tier — prevents immediate re-fire
    if (amount < 0) s.last_surfaced_hunger_tier = hungerTier();
  }

  /** @param {number} amount — direct thirst delta (ml). Use addPendingHydration for drinking. */
  function adjustThirst(amount) {
    s.thirst = Math.max(0, s.thirst + amount);
  }

  /** @param {number} ml — fluid consumed (positive). Routes through absorption buffer. */
  function addPendingHydration(ml) {
    s.pending_hydration += ml;
    // Reset tier tracking when the player drinks — suppresses re-fire during the absorption lag.
    s.last_surfaced_thirst_tier = thirstTier();
  }

  /** Empty the bladder. Called by use_toilet interactions. */
  function voidBladder() {
    s.bladder_fill = 0;
    s.last_surfaced_bladder_tier = null; // reset so tiers re-fire on next fill
  }

  /**
   * Fill the stomach with physical food/liquid content.
   * Call alongside adjustHunger() for all eating interactions.
   * Vomiting empties this; digestion drains it over time.
   * @param {number} amount
   * @param {'solid' | 'liquid' | 'mixed'} [contentType='solid']
   *   'solid' — solid food (~90 min half-life).
   *   'liquid' — water, coffee, broth (~25 min half-life).
   *   'mixed' — soup, stew: 30% liquid fraction (~74 min effective half-life when full).
   */
  function fillStomach(amount, contentType = 'solid') {
    const prevFull = s.stomach_fullness;
    const newFull = Math.min(100, prevFull + amount);
    const added = newFull - prevFull;

    // Liquid fraction of the added portion
    // Approximation debt: mixed=0.3 is chosen. Real gastric partitioning for mixed meals
    // (e.g. soup) depends on solid:liquid ratio, viscosity, and particle size. See TODO.md.
    const addedLiqFrac = contentType === 'liquid' ? 1.0
      : contentType === 'mixed' ? 0.3
      : 0.0;

    // Weighted average: blend existing liquid fraction with added portion's fraction
    if (newFull > 0) {
      s.stomach_liquid_fraction = (prevFull * (s.stomach_liquid_fraction || 0) + added * addedLiqFrac) / newFull;
    }
    s.stomach_fullness = newFull;

    // Post-prandial hormonal satiation — rises proportional to amount eaten.
    // Approximation debt: proportional-to-stomach-fill is a simplification. Real ghrelin
    // suppression and CCK/GLP-1/PYY release are partly volume-dependent and partly
    // nutrient-dependent (protein and fat trigger stronger and longer hormonal responses
    // than simple carbohydrates). No nutrient differentiation yet — `contentType` is not
    // used here because the hormonal response to a liquid vs. solid of the same caloric
    // density differs mainly in timing, not magnitude, at this level of approximation.
    // A full meal (~100 stomach units) gives ~100 satiation (full suppression). See TODO.md.
    s.hormonal_satiation = Math.min(100, s.hormonal_satiation + amount);
  }

  /** Qualitative stomach contents tier. Used for vomiting branch (dry heave vs. expulsion). */
  function stomachTier() {
    return tier(s.stomach_fullness, [
      [15, 'empty'],
      [40, 'light'],
      [65, 'partial'],
      [100, 'full'],
    ]);
  }

  /** @param {number} amount */
  function adjustSocial(amount) {
    s.social = Math.max(0, Math.min(100, s.social + amount));
    if (amount > 0) {
      s.last_social_interaction = ctx.timeline.getActionCount();
      // Interaction depletes social energy — the cost of sustained engagement.
      // Introverts deplete faster; extroverts deplete slower.
      // Approximation debt: range [0.2, 0.8] and base 0.5 chosen; no single-study source for introversion × social fatigue scaling.
      const introDepletion = 0.2 + (s.introversion / 100) * 0.6;
      s.social_energy = Math.max(0, s.social_energy - amount * introDepletion);
    }
  }

  /** @param {number} amount */
  function adjustMoney(amount) {
    s.money = Math.round((s.money + amount) * 100) / 100;
  }

  /** @param {number} amount */
  function adjustJobStanding(amount) {
    s.job_standing = Math.max(0, Math.min(100, s.job_standing + amount));
  }

  /** @param {number} amount */
  function adjustBattery(amount) {
    s.phone_battery = Math.max(0, Math.min(100, s.phone_battery + amount));
  }

  /** Nudge a neurochemistry value by amount, clamped 0-100.
   * @param {string} key @param {number} amount */
  function adjustNT(key, amount) {
    if (typeof s[key] === 'number') {
      s[key] = clamp(s[key] + amount, 0, 100);
    }
  }

  /** @param {number} amount */
  function spendMoney(amount) {
    if (s.money >= amount) {
      const before = s.money;
      adjustMoney(-amount);

      // Bank notification — qualitative balance after purchase
      const balStr = perceivedMoneyString();
      addPhoneMessage({ type: 'bank', source: 'bank', text: 'Purchase notification. Remaining balance: ' + balStr + '.', read: false });

      // Threshold warnings
      if (before >= 50 && s.money < 50) {
        addPhoneMessage({ type: 'bank', source: 'bank', text: 'Low balance alert.', read: false });
      } else if (before >= 20 && s.money < 20) {
        addPhoneMessage({ type: 'bank', source: 'bank', text: 'Your account balance is very low.', read: false });
      }

      return true;
    }
    return false;
  }

  // --- Financial cycle helpers ---

  /**
   * Receive money (paycheck, etc). Adds amount, generates bank notification.
   * @param {number} amount
   * @param {string} source — 'paycheck' or other identifier
   * @param {string} [extraText] — optional additional note text
   */
  function receiveMoney(amount, source, extraText) {
    adjustMoney(amount);
    const balStr = perceivedMoneyString();
    let text;
    if (source === 'paycheck') {
      text = 'Direct deposit. Balance: ' + balStr + '.';
      if (extraText) text = extraText + ' Balance: ' + balStr + '.';
    } else {
      text = 'Deposit. Balance: ' + balStr + '.';
    }
    addPhoneMessage({ type: 'paycheck', source: 'bank', text, read: false });
  }

  /**
   * Auto-deduct a bill. Handles insufficient funds.
   * @param {number} amount
   * @param {string} billName — 'rent', 'utilities', 'phone'
   * @returns {boolean} whether payment succeeded
   */
  function deductBill(amount, billName) {
    if (s.money >= amount) {
      adjustMoney(-amount);
      const balStr = perceivedMoneyString();
      addPhoneMessage({
        type: 'bill',
        source: 'bank',
        text: 'Autopay \u2014 ' + billName + '. ' + balStr + ' remaining.',
        read: false,
        paid: true,
      });
      return true;
    }
    // Insufficient funds — drain to zero, bill fails
    s.money = 0;
    addPhoneMessage({
      type: 'bill',
      source: 'bank',
      text: 'Payment declined \u2014 ' + billName + '. Insufficient funds.',
      read: false,
      paid: false,
    });
    adjustStress(8);
    adjustSentiment('money', 'anxiety', 0.03);
    return false;
  }

  /** Load EBT benefits for the month. Adds to balance, sends phone notification. */
  function receiveEbt(amount) {
    s.ebt_balance = Math.round((s.ebt_balance + amount) * 100) / 100;
    addPhoneMessage({
      type: 'system',
      source: null,
      text: 'EBT: Monthly benefits loaded. Balance: $' + s.ebt_balance.toFixed(2) + '.',
      read: false,
    });
  }

  /** Spend EBT balance (grocery store purchases). */
  function spendEbt(amount) {
    s.ebt_balance = Math.max(0, Math.round((s.ebt_balance - amount) * 100) / 100);
  }

  // --- Phone inbox helpers ---

  /** @param {{ type: string, text: string, read: boolean, source?: string, direction?: string, timestamp?: number, paid?: boolean, subtype?: string }} msg */
  function addPhoneMessage(msg) {
    if (msg.direction === undefined) msg.direction = 'received';
    if (msg.timestamp === undefined) msg.timestamp = s.time;
    s.phone_inbox.push(msg);
  }

  function getUnreadMessages() {
    return s.phone_inbox.filter(m => !m.read);
  }

  function hasUnreadMessages() {
    return s.phone_inbox.some(m => !m.read);
  }

  function markMessagesRead() {
    for (const m of s.phone_inbox) m.read = true;
  }

  /** @param {{ slot: string, arrivesAt: number, text: string, effect?: { type: 'receiveMoney', amount: number } }} reply */
  function addPendingReply(reply) {
    if (!s.pending_replies) s.pending_replies = [];
    s.pending_replies.push(reply);
  }

  // --- Observation / fidelity ---
  // The player's awareness of time and money degrades with distance
  // from when they last directly observed the value.

  function observeTime() {
    s.last_observed_time = s.time;
  }

  function observeMoney() {
    s.last_observed_money = s.money;
  }

  function glanceTime() {
    s.last_observed_time = s.time - 20;
  }

  function glanceMoney() {
    // Offset by ~$5 in the direction of last known
    const offset = s.last_observed_money > s.money ? 5 : -5;
    s.last_observed_money = s.money + offset;
  }

  function timeFidelity() {
    const elapsed = Math.abs(s.time - s.last_observed_time);
    if (elapsed < 15) return 'exact';
    if (elapsed < 45) return 'rounded';
    if (elapsed < 120) return 'vague';
    return 'sensory';
  }

  function moneyFidelity() {
    const change = Math.abs(s.money - s.last_observed_money);
    if (change < 2) return 'exact';
    if (change < 10) return 'approximate';
    if (change < 25) return 'rough';
    return 'qualitative';
  }

  // --- Perceived strings ---
  // Prose representations at each fidelity tier.

  function perceivedTimeString() {
    const fidelity = timeFidelity();
    if (fidelity === 'exact') return getTimeString();
    if (fidelity === 'rounded') return roundedTimeString();
    if (fidelity === 'vague') return vagueTimeString();
    return sensoryTimeString();
  }

  function perceivedMoneyString() {
    const fidelity = moneyFidelity();
    if (fidelity === 'exact') return '$' + Math.round(s.money);
    if (fidelity === 'approximate') return approximateMoneyString();
    if (fidelity === 'rough') return roughMoneyString();
    return qualitativeMoneyString();
  }

  function roundedTimeString() {
    // Round to nearest 15 minutes within current day
    const tod = timeOfDay();
    const rounded = Math.round(tod / 15) * 15;
    const h = Math.floor(rounded / 60) % 24;
    const m = rounded % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return 'around ' + displayH + ':' + m.toString().padStart(2, '0') + ' ' + period;
  }

  function vagueTimeString() {
    const h = getHour();
    if (h < 5) return 'the middle of the night';
    if (h < 7) return 'early morning';
    if (h < 9) return 'sometime in the morning';
    if (h < 11) return 'mid-morning';
    if (h < 13) return 'around midday';
    if (h < 15) return 'early afternoon';
    if (h < 17) return 'late afternoon';
    if (h < 19) return 'early evening';
    if (h < 21) return 'evening';
    if (h < 23) return 'late';
    return 'the middle of the night';
  }

  function sensoryTimeString() {
    const h = getHour();
    if (h < 5) return 'It feels late. Or early. Hard to tell.';
    if (h < 7) return 'The light is thin. Morning, but barely.';
    if (h < 9) return 'Morning light. You\'re not sure when exactly.';
    if (h < 12) return 'The light has shifted. Morning still, probably.';
    if (h < 15) return 'The light says afternoon.';
    if (h < 18) return 'The light has changed. Later than you thought.';
    if (h < 21) return 'It\'s getting dark. You lost track of when.';
    return 'It\'s dark. Has been for a while.';
  }

  function approximateMoneyString() {
    const m = s.money;
    if (m < 100) {
      const rounded = Math.round(m / 5) * 5;
      return 'around $' + rounded;
    }
    if (m < 1000) {
      const rounded = Math.round(m / 10) * 10;
      return 'around $' + rounded;
    }
    const rounded = Math.round(m / 100) * 100;
    return 'around $' + rounded.toLocaleString();
  }

  function roughMoneyString() {
    const m = s.money;
    if (m < 10) return 'not much — under ten dollars, maybe';
    if (m < 100) return 'maybe $' + (Math.floor(m / 10) * 10) + '-something';
    if (m < 1000) return 'a few hundred, maybe';
    if (m < 5000) return 'a few thousand';
    return 'several thousand';
  }

  function qualitativeMoneyString() {
    const mt = moneyTier();
    if (mt === 'broke') return 'almost nothing';
    if (mt === 'scraping') return 'barely anything';
    if (mt === 'tight') return 'not much';
    if (mt === 'careful') return 'some, but not a lot';
    if (mt === 'okay') return 'enough for now';
    if (mt === 'cushioned') return 'more than enough';
    return 'enough';
  }

  // --- Sentiment helpers ---

  /** Look up a sentiment's intensity by target and quality. Returns 0 if not found. */
  function sentimentIntensity(target, quality) {
    if (!s.sentiments || !s.sentiments.length) return 0;
    for (const sent of s.sentiments) {
      if (sent.target === target && sent.quality === quality) return sent.intensity;
    }
    return 0;
  }

  /** Adjust a sentiment's intensity by amount. Finds existing or creates new entry.
   *  Entries at intensity 0 remain (sleep processing needs them). Clamped [0, 1].
   *  No PRNG consumed — deterministic and replay-safe.
   *  @param {string} target @param {string} quality @param {number} amount */
  function adjustSentiment(target, quality, amount) {
    if (!s.sentiments) s.sentiments = [];
    let found = null;
    for (const sent of s.sentiments) {
      if (sent.target === target && sent.quality === quality) { found = sent; break; }
    }
    if (!found) {
      found = { target, quality, intensity: 0 };
      s.sentiments.push(found);
    }
    found.intensity = clamp(found.intensity + amount, 0, 1);
  }

  // --- Sleep emotional processing ---
  // REM sleep attenuates sentiment deviations from character baseline.
  // Better sleep = more processing. No PRNG consumed — fully deterministic.
  // See DESIGN-EMOTIONS.md Layer 2 step: Sleep Emotional Processing.

  // Per-quality processing factors for sleep emotional processing.
  // Comfort processes fully (1.0), negative sentiments resist processing (entrenchment).
  const qualityProcessingFactor = {
    comfort: 1.0,
    satisfaction: 0.9,
    warmth: 0.85,
    guilt: 0.7,
    anxiety: 0.6,       // financial anxiety entrenches like dread
    dread: 0.6,
    irritation: 0.6,
  };
  const defaultQualityFactor = 0.8;

  /**
   * Sleep emotional processing — attenuate sentiment deviations from baseline.
   * REM sleep strips emotional charge; better sleep = more processing.
   * Three multiplicative modifiers create meaningful dynamics:
   *   - intensityFactor: high-intensity deviations resist processing
   *   - qualityFactor: negative sentiments (dread, irritation) process 40% slower
   *   - regulation: personality-dependent processing efficiency
   * @param {Array} baseSentiments - character's original sentiments (baseline)
   * @param {number} qualityMult - sleep quality (0-1+)
   * @param {number} sleepMinutes - total sleep duration
   */
  function processSleepEmotions(baseSentiments, qualityMult, sleepMinutes) {
    if (!s.sentiments || !s.sentiments.length) return;

    const durationFactor = clamp(sleepMinutes / 420, 0.3, 1.0);
    const baseRate = 0.4 * qualityMult * durationFactor;
    const regulation = regulationCapacity();

    for (const sent of s.sentiments) {
      const base = baseSentiments
        ? baseSentiments.find(cs => cs.target === sent.target && cs.quality === sent.quality)
        : null;
      const baseIntensity = base ? base.intensity : 0;
      const deviation = sent.intensity - baseIntensity;
      if (Math.abs(deviation) < 0.001) continue;

      // Intensity resistance: high deviations resist processing (squared falloff)
      const intensityFactor = Math.max(0.3, 1 - 0.7 * deviation * deviation);

      // Entrenchment: negative sentiments process slower than comfort
      const qf = qualityProcessingFactor[sent.quality] ?? defaultQualityFactor;

      const effectiveRate = baseRate * intensityFactor * qf * regulation;
      sent.intensity -= deviation * effectiveRate;
    }
  }

  // --- Friend absence effects ---
  // Friends who reach out deserve a response. Ignoring them builds guilt over time.
  // Called during sleep — guilt accumulates per night of absence, not per tick.
  // No PRNG consumed — fully deterministic.

  /**
   * Process friend absence effects during sleep.
   * For each friend: if no contact time yet, initialize to current time.
   * After 1.5 days grace period, guilt accumulates each night.
   * Unread messages from the friend intensify guilt by 40%.
   */
  function processAbsenceEffects() {
    const now = s.time;
    const inbox = s.phone_inbox;
    if (!s.friend_contact) s.friend_contact = {};

    for (const slot of ['friend1', 'friend2']) {
      let lastContact = s.friend_contact[slot];

      // First sleep: initialize contact time, skip guilt
      if (lastContact === undefined || lastContact === 0) {
        s.friend_contact[slot] = now;
        continue;
      }

      const absenceMinutes = now - lastContact;
      const absenceDays = absenceMinutes / 1440;

      // Grace period: 1.5 days
      if (absenceDays <= 1.5) continue;

      // Growth rate: base 0.005, scaling gently with duration (cap 1.6x at 14 days)
      let growth = 0.005 * Math.min(1 + absenceDays / 14, 1.6);

      // Unread messages from this friend intensify guilt
      const hasUnreadFromFriend = inbox.some(m => !m.read && m.source === slot);
      if (hasUnreadFromFriend) {
        growth *= 1.4;
      }

      adjustSentiment(slot, 'guilt', growth);
    }
  }

  // --- Neurochemistry drift engine ---
  // Exponential approach to target with asymmetric up/down rates.
  // Biological jitter via incommensurate sine waves (no PRNG consumed).
  // See DESIGN-EMOTIONS.md Layer 1.

  /** @param {number} v @param {number} lo @param {number} hi */
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /** Map value to 0–1 between lo and hi, clamped. Building block for continuous prose weights. */
  /** @param {number} value @param {number} lo @param {number} hi */
  function lerp01(value, lo, hi) {
    return clamp((value - lo) / (hi - lo), 0, 1);
  }

  /**
   * Deterministic biological noise — "some days are harder and you can't name why."
   * Two incommensurate sine frequencies with per-system phase seeds.
   * Range ±3.5. No PRNG consumed — safe for forward-compatibility.
   * @param {number} timeHours - total game hours
   * @param {number} seed - unique per system
   */
  function biologicalJitter(timeHours, seed) {
    // Approximation debt: frequencies (0.017 ≈ 59h period, 0.0073 ≈ 137h period) chosen to be
    // incommensurate, preventing period-locking. Amplitudes (2.0 and 1.5) chosen. Real biological
    // rhythms include documented ultradian (~90min) and infradian periods that could ground these choices.
    return Math.sin(timeHours * 0.017 + seed) * 2 +
           Math.sin(timeHours * 0.0073 + seed * 1.7) * 1.5;
  }

  // --- Target functions ---
  // Active systems have target functions fed by current state.
  // Placeholder systems return baseline 50 (will gain feeders as systems are built).

  /** Serotonin target: sleep quality, social connection, hunger (tryptophan availability), sentiments */
  function serotoninTarget() {
    let t = 50;
    // Sleep quality is the strongest lever (DESIGN-EMOTIONS.md)
    const sq = s.last_sleep_quality;
    t += (sq - 0.7) * 20;  // good sleep pushes up, poor sleep pushes down // Approximation debt: coefficient 20 and reference 0.7 chosen
    // Social connection
    t += (s.social - 50) * 0.15; // Approximation debt: coefficient 0.15 chosen
    // Hunger reduces tryptophan availability (competes for blood-brain transport)
    if (s.hunger > 60) t -= (s.hunger - 60) * 0.2; // Approximation debt: coefficient 0.2 and threshold 60 chosen
    // Dehydration lowers mood. Threshold 700ml = 1% deficit; max meaningful effect ~1400ml (2%).
    // Approximation debt: coefficient 0.009 chosen to produce ~6pt serotonin drop at 1400ml.
    if (s.thirst > 700) t -= (s.thirst - 700) * 0.009;

    // Sentiments: weather preference
    const wComfort = sentimentIntensity('weather_' + s.weather, 'comfort');
    const wIrritation = sentimentIntensity('weather_' + s.weather, 'irritation');
    t += wComfort * 4 - wIrritation * 3;

    // Sentiments: time-of-day preference
    const hour = Math.floor(timeOfDay() / 60);
    const mornComfort = sentimentIntensity('time_morning', 'comfort');
    const eveComfort = sentimentIntensity('time_evening', 'comfort');
    if (mornComfort > 0) {
      if (hour >= 6 && hour <= 11) t += mornComfort * 4;
      else if (hour >= 21) t -= mornComfort * 3;
    }
    if (eveComfort > 0) {
      if (hour >= 18 && hour <= 23) t += eveComfort * 4;
      else if (hour >= 6 && hour <= 9) t -= eveComfort * 3;
    }

    // Accumulating sentiments: work dread/satisfaction at workplace
    if (s.location === 'workplace') {
      const workDread = sentimentIntensity('work', 'dread');
      const workSat = sentimentIntensity('work', 'satisfaction');
      t -= workDread * 6;    // dread lowers serotonin target at work // Approximation debt: dread -6, satisfaction +3 chosen
      t += workSat * 3;      // satisfaction gives a small lift
    }

    // Friend guilt at home — the weight of not responding
    if (s.location && s.location.startsWith('apartment')) {
      const g1 = sentimentIntensity('friend1', 'guilt');
      const g2 = sentimentIntensity('friend2', 'guilt');
      t -= (g1 + g2) * 3;   // max ~6 points at extreme guilt toward both friends // Approximation debt: coefficient 3 (max -6 total) chosen
    }

    // Financial anxiety at home — the weight of bills you haven't checked
    if (s.location && s.location.startsWith('apartment')) {
      const moneyAnx = sentimentIntensity('money', 'anxiety');
      t -= moneyAnx * 4;    // max ~3.2 at high anxiety // Approximation debt: coefficient 4 chosen
    }

    // Direct money level effects — being broke hurts regardless of anxiety
    const mt = moneyTier();
    if (mt === 'tight' || mt === 'scraping' || mt === 'broke') {
      // Scale: tight → -1, scraping → -2.5, broke → -3.75
      if (s.money < 200) t -= (200 - s.money) * 0.019; // Approximation debt: coefficient 0.019 and threshold 200 chosen
    }

    // Sleep debt — cumulative deficit erodes serotonin baseline
    if (s.sleep_debt > 240) {
      t -= Math.min((s.sleep_debt - 240) * 0.005, 8);  // max -8 at extreme debt // Approximation debt: coefficient 0.005, cap 8 chosen
    }

    return clamp(t, 20, 82); // Approximation debt: floor/ceiling from clinical literature. Floor 20: ATD leaves ~10-15% function but chronic depression floor ~20-25% (PMC3756112, PMC3398160). Ceiling 82: no natural sustained ceiling above healthy baseline.
  }

  /** Dopamine target: energy, general vitality, sentiments */
  function dopamineTarget() {
    let t = 50;
    // Energy reflects capacity for engagement
    t += (s.energy - 50) * 0.25; // Approximation debt: coefficient 0.25 chosen
    // Chronic stress depletes dopamine
    if (s.stress > 60) t -= (s.stress - 60) * 0.2; // Approximation debt: coefficient 0.2 and threshold 60 chosen

    // Sentiments: time-of-day preference
    const hour = Math.floor(timeOfDay() / 60);
    const mornComfort = sentimentIntensity('time_morning', 'comfort');
    const eveComfort = sentimentIntensity('time_evening', 'comfort');
    if (mornComfort > 0) {
      if (hour >= 6 && hour <= 11) t += mornComfort * 3;
      else if (hour >= 21) t -= mornComfort * 2;
    }
    if (eveComfort > 0) {
      if (hour >= 18 && hour <= 23) t += eveComfort * 3;
      else if (hour >= 6 && hour <= 9) t -= eveComfort * 2;
    }

    // Accumulating sentiments: work dread/satisfaction at workplace
    if (s.location === 'workplace') {
      const workDread = sentimentIntensity('work', 'dread');
      const workSat = sentimentIntensity('work', 'satisfaction');
      t -= workDread * 5;    // dread kills motivation // Approximation debt: dread -5, satisfaction +4 chosen
      t += workSat * 4;      // satisfaction supports engagement

      // Financial anxiety at work — working for money you'll never keep
      const moneyAnx = sentimentIntensity('money', 'anxiety');
      t -= moneyAnx * 2; // Approximation debt: coefficient 2 chosen
    }

    // Sleep debt — cumulative deficit kills motivation
    if (s.sleep_debt > 240) {
      t -= Math.min((s.sleep_debt - 240) * 0.006, 10);  // max -10 at extreme debt // Approximation debt: coefficient 0.006, cap 10 chosen
    }

    return clamp(t, 25, 85); // Approximation debt: floor from MDD anhedonia ~30-40% dopaminergic tone — not near-zero (that's end-stage Parkinson's, structural denervation) (PMID 3347226, PMC10594643). Ceiling 85: stimulant-induced sustained ceiling.
  }

  /** Norepinephrine target: stress, sleep quality.
   *  REM sleep occurs in NE-free environment — good sleep lowers NE. */
  function norepinephrineTarget() {
    let t = 40;
    // Stress is the primary driver
    t += (s.stress - 30) * 0.3; // Approximation debt: stress coefficient 0.3 and baseline 30 chosen
    // Poor sleep elevates NE (unprocessed emotional charge)
    const sq = s.last_sleep_quality;
    t -= (sq - 0.5) * 15;  // good sleep lowers, poor sleep raises // Approximation debt: sleep quality coefficient 15 and reference 0.5 chosen
    // Mild dehydration activates sympathetic nervous system — NE elevation at ~1% body water deficit.
    // (Ganio 2011 PMID 21736786: mood/fatigue/cognitive effects at 1.36% dehydration in women)
    // Threshold 700ml = 1% deficit. Approximation debt: coefficient 0.005 chosen to produce ~3.5pt NE rise at 1400ml.
    if (s.thirst > 700) t += (s.thirst - 700) * 0.005;
    // Bladder urgency — autonomic arousal from detrusor distension activates sympathetic axis.
    // (Chermansky & Gebhart 2009 PMID 19234784)
    // Approximation debts: magnitudes 2/5 chosen; real effect is via pudendal/pelvic nerve circuitry.
    if (s.bladder_fill > 450) t += 5;
    else if (s.bladder_fill > 300) t += 2;
    return clamp(t, 25, 88); // Approximation debt: floor from low-NE depression subtype ~40-50% below healthy; floor 10 would be pharmacological NE blockade (PMID 3415426). Ceiling 88: PTSD chronic hyperarousal ~1.5-2× healthy (PMID 3588809).
  }

  /** GABA target: chronic stress slowly erodes. ALLO crosslink (placeholder). */
  function gabaTarget() {
    let t = 55;
    // Chronic stress depletes GABA (slow mechanism)
    if (s.stress > 50) t -= (s.stress - 50) * 0.15; // Approximation debt: stress threshold 50 and coefficient 0.15 chosen
    // ALLO modulates GABA-A — when implemented, allopregnanolone will feed here
    return clamp(t, 28, 78); // Approximation debt: floor from Sanacora 1999 (PMID 10565505): 52% GABA reduction in melancholic depression = ~48% of healthy. Floor 20 implies acute BZ withdrawal, not mood disorder. Ceiling 78: no natural chronic high-GABA ambulatory state.
  }

  /** Cortisol target: diurnal rhythm + stress.
   *  Peaks at ~8AM (Cortisol Awakening Response), nadir at ~midnight.
   *  Ref: RESEARCH-HORMONES.md Part 4 (dual hormone hypothesis) */
  function cortisolTarget() {
    const tod = timeOfDay();
    const hourFrac = tod / 60;
    // Diurnal curve: peak at 8, nadir at 0/24
    // Using cosine shifted so peak=8AM: cos((hour - 8) * pi/12)
    const diurnal = Math.cos((hourFrac - 8) * Math.PI / 12);
    // Map diurnal [-1,1] to [25,65]
    let t = 45 + diurnal * 20; // Approximation debt: diurnal amplitude 20 chosen (plausible for ~±8 µg/dL swing but uncalibrated)
    // Stress pushes cortisol above rhythm
    if (s.stress > 40) t += (s.stress - 40) * 0.3; // Approximation debt: stress coefficient 0.3 and threshold 40 chosen
    // Very low money — financial stress adds cortisol
    if (s.money < 50) t += 3; // Approximation debt: money broke penalty +3 chosen
    return clamp(t, 10, 95);
  }

  /** Melatonin target: rises in darkness, suppressed by light/activity.
   *  Peaks ~2-3AM, suppressed during daylight hours.
   *  Modulated by daylight exposure, phone screen at night, indoor evening. */
  function melatoninTarget() {
    const tod = timeOfDay();
    const hourFrac = tod / 60;
    // Inverse of light: high at night (peak ~3AM), low during day
    // cos((hour - 3) * pi/12) peaks at 3AM
    const nocturnal = Math.cos((hourFrac - 3) * Math.PI / 12);
    // Base: [5,80]: fully suppressed during day, high at night
    let t = 42.5 + nocturnal * 37.5;

    // Good daylight exposure strengthens nighttime melatonin peak
    // Saturates at 120 min of bright light (outside daytime)
    // Approximation debt: 120 min saturation threshold chosen (ignores illuminance — real melatonin
    // phase effects require lux, not just minutes).
    const daylightBonus = Math.min(s.daylight_exposure / 120, 1.0) * 10;
    if (hourFrac >= 20 || hourFrac <= 6) {
      t += daylightBonus;  // up to +10 at night if you got enough light
    }

    // Phone screen suppression at night — blue light blocks melatonin
    // Approximation debt: phone suppression -15, indoor delay -3 chosen.
    if (s.viewing_phone && (hourFrac >= 21 || hourFrac <= 5)) {
      t -= 15;
    }

    // Indoor evening suppression — dim indoor light delays melatonin onset
    if (hourFrac >= 19 && hourFrac <= 21) {
      const area = ctx.world.getCurrentLocation()?.area;
      if (area === 'apartment' || area === 'work') {
        t -= 3;
      }
    }

    // Approximation debt: fall-asleep delay multipliers (0.7× high melatonin, 1.4× low) chosen.
    // Applied in content.js sleep interaction, derived from this target. Not calibrated to
    // measured sleep-onset latency data.
    return clamp(t, 5, 90);
  }

  /** Ghrelin target: maps directly to hunger state.
   *  Stomach produces ghrelin when empty, suppressed after eating. */
  function ghrelinTarget() {
    // Hunger 0-100 maps to ghrelin 15-85
    // Approximation debt: linear mapping of hunger→ghrelin (range 15-85) chosen. In reality
    // ghrelin drives hunger (not the reverse) and has its own circadian rhythm and meal-entrainment.
    // Direction of causality is reversed here as a proxy until a proper ghrelin model exists.
    return 15 + (s.hunger / 100) * 70;
  }

  /** Histamine target: wakefulness signal. High during day, low at night.
   *  Ref: REFERENCE-HORMONES.md #2 (antihistamines cause drowsiness) */
  function histamineTarget() {
    const tod = timeOfDay();
    const hourFrac = tod / 60;
    // Follows wakefulness: peaks midday (~14:00), low at night
    const wake = Math.cos((hourFrac - 14) * Math.PI / 12);
    // Approximation debt: amplitude 30 and peak hour chosen. Real histaminergic firing is tonic
    // during wakefulness, not simply cosine-shaped.
    return clamp(50 + wake * 30, 10, 80);
  }

  /** Testosterone target: diurnal rhythm.
   *  Peaks 5:30-8AM, nadir ~7-8PM. 25-50% amplitude.
   *  Ref: RESEARCH-HORMONES.md Part 4 */
  function testosteroneTarget() {
    const tod = timeOfDay();
    const hourFrac = tod / 60;
    // Peaks at ~7AM: cos((hour - 7) * pi/12)
    const diurnal = Math.cos((hourFrac - 7) * Math.PI / 12);
    // ~25% amplitude around baseline: [37, 63]
    return clamp(50 + diurnal * 13, 30, 70);
  }

  // --- Rate constants ---
  // Per-system up/down rates (per hour) derived from biological half-lives.
  // Asymmetric: most systems fall faster than they rise.
  // rate = ln(2) / halflife_hours, scaled to give meaningful drift on 0-100 scale.
  //
  // Rate constants: [upRate, downRate] per-hour exponential approach rates.
  // upRate = rate when level is below target (drifting up); downRate = rate when above target (drifting down).
  // Dopamine and NE calibrated to acute microdialysis recovery data (RESEARCH-CALIBRATION.md).
  // Serotonin: days half-life, approximately correct but uncalibrated (see calibration doc).
  // All other systems: approximation debts — rates chosen, not derived from receptor kinetics.
  // Approximation debt: scale mapping real t½ to simulation 0-100 scale is itself chosen.
  // Calibration notes: RESEARCH-CALIBRATION.md § NT Rate Constants: Mood-Primary Systems.

  const ntRates = {
    // key:        [upRate,  downRate]  — per-hour exponential approach rates
    serotonin:     [0.06,    0.08],     // t½ ~9-11h — ATD behavioral data: mood onset 5-6h, recovery <24h (PMID 18452034, PMID 3931142). Asymmetry: falls faster (SERT clears excess rapidly; resynthesis via TPH2 rate-limited by tryptophan)
    dopamine:      [0.35,    0.45],     // acute NAc recovery 1-2h (PMID 1606494); falls faster than rises
    norepinephrine:[0.55,    0.45],     // rises fast (LC phasic); recovery 45-90 min (PMID 6727569); upRate > downRate
    gaba:          [0.03,    0.05],     // ~12-24h, chronic stress mechanism is slow
    glutamate:     [0.015,   0.02],     // days half-life, placeholder
    endorphin:     [0.04,    0.06],     // ~12-24h
    acetylcholine: [0.05,    0.07],     // ~12h
    endocannabinoid:[0.04,   0.06],     // ~12-24h
    histamine:     [0.08,    0.12],     // hours — tracks wakefulness quickly
    cortisol:      [0.1,     0.15],     // diurnal — needs to follow rhythm
    melatonin:     [0.12,    0.18],     // diurnal — rises and falls with darkness
    testosterone:  [0.06,    0.08],     // diurnal rhythm, moderate speed
    dht:           [0.03,    0.04],     // slow, placeholder
    estradiol:     [0.01,    0.015],    // very slow, placeholder (cycle later)
    progesterone:  [0.01,    0.015],    // very slow, placeholder
    allopregnanolone:[0.02,  0.03],     // derived from progesterone
    lh:            [0.02,    0.03],     // placeholder
    fsh:           [0.01,    0.015],    // placeholder
    oxytocin:      [0.06,    0.1],      // short bursts, decays faster
    prolactin:     [0.03,    0.05],     // placeholder
    thyroid:       [0.005,   0.005],    // very slow — weeks timescale
    insulin:       [0.15,    0.2],      // fast — meal-responsive (placeholder)
    leptin:        [0.005,   0.008],    // very slow — body composition
    ghrelin:       [0.1,     0.15],     // fast — tracks hunger
    dhea:          [0.008,   0.01],     // slow, placeholder
    hcg:           [0.001,   0.001],    // pregnancy only, near-static
    calcitriol:    [0.005,   0.008],    // very slow — sunlight/diet
  };

  // Phase seeds for biological jitter — each system gets a unique offset
  // so their noise patterns don't correlate
  const ntPhaseSeed = {
    serotonin: 1.0, dopamine: 2.3, norepinephrine: 3.7, gaba: 4.1,
    glutamate: 5.9, endorphin: 6.4, acetylcholine: 7.2, endocannabinoid: 8.8,
    histamine: 9.3, cortisol: 10.6, melatonin: 11.1, testosterone: 12.5,
    dht: 13.2, estradiol: 14.7, progesterone: 15.3, allopregnanolone: 16.9,
    lh: 17.4, fsh: 18.0, oxytocin: 19.6, prolactin: 20.1,
    thyroid: 21.8, insulin: 22.3, leptin: 23.7, ghrelin: 24.2,
    dhea: 25.5, hcg: 26.1, calcitriol: 27.8,
  };

  // Target functions by key. Systems without active feeders use baseline 50.
  const ntTargetFns = {
    serotonin: serotoninTarget,
    dopamine: dopamineTarget,
    norepinephrine: norepinephrineTarget,
    gaba: gabaTarget,
    cortisol: cortisolTarget,
    melatonin: melatoninTarget,
    ghrelin: ghrelinTarget,
    histamine: histamineTarget,
    testosterone: testosteroneTarget,
  };

  /** Placeholder target for inactive systems — returns baseline with jitter */
  function placeholderTarget() { return 50; }

  // --- Emotional inertia (Layer 2 of DESIGN-EMOTIONS.md) ---
  // Per-character trait: how sticky moods are. Affects only the four mood-primary
  // systems (serotonin, dopamine, NE, GABA). Physiological rhythms (cortisol,
  // melatonin, etc.) are unaffected — personality doesn't change your cortisol cycle.
  //
  // Higher inertia → rate divided by more → slower drift → mood sticks.
  // Range ~0.6 (fluid) to ~1.6 (very sticky).

  // "Worse direction" per mood-primary system — the direction that represents
  // mood degradation. Neuroticism adds extra stickiness in this direction only.
  // true = falling is worse, false = rising is worse.
  const moodWorseWhenFalling = {
    serotonin: true,       // low = depressed
    dopamine: true,        // low = anhedonia
    norepinephrine: false,  // high = agitation
    gaba: true,            // low = anxiety
  };

  /**
   * Compute effective emotional inertia for a mood-primary system.
   * @param {string} _system - system name (unused for now; signature supports per-system formulas)
   * @param {boolean} isNegativeDirection - true if drifting toward "worse" mood
   * @returns {number} inertia multiplier (>1 = stickier, <1 = more fluid)
   */
  function effectiveInertia(_system, isNegativeDirection) {
    // Normalize personality to 0-1
    const n = s.neuroticism / 100;
    const seInv = 1 - (s.self_esteem / 100);  // inverted: low SE → high inertia
    const r = s.rumination / 100;

    // Base inertia: weighted combination of personality traits.
    // Weights derived from Houben et al. 2015 meta-analysis (PMID 25822133) meta-analytic r
    // with NE inertia: rumination r=0.26, neuroticism r=0.21, self-esteem r=0.18.
    // Previous weights (neuroticism 0.5, self-esteem 0.3, rumination 0.2) were empirically
    // backward — rumination is the strongest predictor, not the weakest.
    // At 50/50/50 → n=0.5, seInv=0.5, r=0.5 → weighted=0.5 → base=1.0
    // At 0/100/0 → n=0, seInv=0, r=0 → weighted=0 → base=0.6 (fluid)
    // At 100/0/100 → n=1, seInv=1, r=1 → weighted=1 → base=1.4 (sticky)
    // Approximation debt: exact magnitude of inertia range (0.6–1.4) is chosen. Relative
    // weights are empirically grounded but derived from separate studies aggregated, not
    // a single multi-predictor model. See RESEARCH-CALIBRATION.md §Emotional Inertia Trait Weights.
    const weighted = n * 0.32 + seInv * 0.28 + r * 0.40;
    let inertia = 0.6 + weighted * 0.8;

    // Negative-direction asymmetry: neuroticism and rumination both show stronger associations
    // with NE inertia than PE inertia (Houben 2015). Self-esteem is symmetric (Kuppens 2010,
    // PMID 20424092 — similar inertia effect for both valences).
    // Neuroticism NE/PE ratio: r=0.21/0.13 → ~38% asymmetry.
    // Rumination NE/PE ratio: r=0.26/0.16 → ~38% asymmetry. Similar magnitude.
    if (isNegativeDirection) {
      inertia += n * 0.12 + r * 0.15;
    }

    // State modifiers — current conditions can increase inertia.
    // Approximation debt: all four modifier coefficients (adenosine 0.005, sleep quality 0.3,
    // stress 0.005, debt 0.0003) and thresholds (60, 0.5, 60, 240) are chosen. The McCauley/
    // Rajaraman citation supports the debt effect direction but doesn't derive the coefficient.
    // Sleep deprivation (adenosine > 60): tired brain processes mood slower.
    if (s.adenosine > 60) {
      inertia += (s.adenosine - 60) * 0.005;  // up to +0.2 at adenosine=100
    }
    // Poor sleep quality: emotional processing was impaired.
    if (s.last_sleep_quality < 0.5) {
      inertia += (0.5 - s.last_sleep_quality) * 0.3;  // up to +0.15 at quality=0
    }
    // Chronic stress: sustained stress makes mood changes harder.
    if (s.stress > 60) {
      inertia += (s.stress - 60) * 0.005;  // up to +0.2 at stress=100
    }
    // Sleep debt: accumulated deficit makes the brain sluggish at mood transitions.
    if (s.sleep_debt > 240) {
      inertia += Math.min((s.sleep_debt - 240) * 0.0003, 0.15);  // up to +0.15 at extreme debt
    }

    return inertia;
  }

  // --- Regulation capacity (inverse of inertia for sleep processing) ---
  // Fluid characters (low neuroticism, high self-esteem, low rumination) process
  // emotions more efficiently during sleep. Sticky characters process slower.
  // Range: 0.5 (very sticky + stressed) to 1.3 (very fluid + rested).
  // At 50/50/50 personality → 1.0.

  function regulationCapacity() {
    const n = s.neuroticism / 100;
    const se = s.self_esteem / 100;
    const r = s.rumination / 100;

    // Inverse of inertia weighting: low n, high se, low r → high regulation.
    // Weights match effectiveInertia() — derived from Houben et al. 2015 (PMID 25822133).
    // At 50/50/50 → weighted=0.5 → capacity=1.0
    // At 0/100/0 → weighted=0 → capacity=1.3 (fluid)
    // At 100/0/100 → weighted=1 → capacity=0.5 (sticky)
    // Approximation debt: regulation capacity range (0.5–1.3) and penalty coefficients are chosen.
    const weighted = n * 0.32 + (1 - se) * 0.28 + r * 0.40;
    let capacity = 1.3 - weighted * 0.8;

    // State penalties — current conditions reduce processing capacity
    // Sleep deprivation (adenosine > 60): tired brain processes less
    if (s.adenosine > 60) {
      capacity -= (s.adenosine - 60) * 0.004;  // up to -0.16 at adenosine=100
    }
    // Chronic stress: sustained stress impairs regulation
    if (s.stress > 60) {
      capacity -= (s.stress - 60) * 0.004;  // up to -0.16 at stress=100
    }

    return clamp(capacity, 0.5, 1.3);
  }

  /**
   * Drift all neurochemistry systems toward their targets.
   * Called at end of advanceTime().
   *
   * Mechanic: exponential approach (drift)
   *   target = targetFunction() + biologicalJitter()
   *   rate = (level > target) ? downRate : upRate
   *   decay = exp(-rate * hours)
   *   level = clamp(target + (level - target) * decay, 0, 100)
   *
   * Adenosine is special: saturating exponential accumulation (τ=18h) during wakefulness,
   * cleared proportionally by sleep (handled in content.js sleep interaction).
   *
   * @param {number} hours
   */
  function driftNeurochemistry(hours) {
    if (hours <= 0) return;

    const timeHours = s.time / 60;

    // Adenosine: saturating exponential accumulation (cleared by sleep in content.js).
    // Two-process model: τ=18h, ceiling=100 → 16h from cleared baseline → ~59.
    // Calibrated from Porkka-Heiskanen et al. 2000 (Neuroscience 99:507) and Borbély 2022
    // (J Sleep Research PMC9540767). Linear 4 pts/hr was close in midrange but understated
    // early accumulation (hrs 0–4) and overstated late accumulation (hrs 12–16).
    // Approximation debt: cognitive load modifier absent — high mental demand accelerates
    // adenosine via ATP hydrolysis / gliotransmission (Phillips et al. 2017 PMC5675465).
    s.adenosine = 100 - (100 - s.adenosine) * Math.exp(-hours / 18);

    // All other systems: exponential drift toward target
    for (const key of Object.keys(ntRates)) {
      const targetFn = ntTargetFns[key] || placeholderTarget;
      const jitter = biologicalJitter(timeHours, ntPhaseSeed[key]);
      const target = clamp(targetFn() + jitter, 0, 100);

      const rates = ntRates[key];
      let rate = (s[key] > target) ? rates[1] : rates[0];

      // Emotional inertia: mood-primary systems have personality-dependent rate
      if (key in moodWorseWhenFalling) {
        const falling = s[key] > target;
        const worseWhenFalling = moodWorseWhenFalling[key];
        const isNegative = falling === worseWhenFalling;
        rate = rate / effectiveInertia(key, isNegative);
      }

      const decay = Math.exp(-rate * hours);
      s[key] = clamp(target + (s[key] - target) * decay, 0, 100);
    }
  }

  return {
    init,
    get,
    set,
    getAll,
    loadState,
    restoreSnapshot,
    advanceTime,
    timeOfDay,
    getHour,
    getMinute,
    getTimeString,
    getDay,
    calendarDate,
    dayOfWeek,
    season,
    daysSince,
    isSameDay,
    isWorkHours,
    isLateForWork,
    isWorkday,
    latenessMinutes,
    lateTier,
    wakeUp,
    energyTier,
    stressTier,
    hungerTier,
    thirstTier,
    bladderNeedTier,
    socialTier,
    socialEnergyTier,
    fridgeTier,
    pantryTier,
    jobTier,
    batteryTier,
    moneyTier,
    sleepDebtTier,
    canAfford,
    nextPaycheckDays,
    nextBillDue,
    timePeriod,
    canFocus,
    moodTone,
    adjustEnergy,
    adjustStress,
    adjustHunger,
    adjustThirst,
    addPendingHydration,
    voidBladder,
    fillStomach,
    stomachTier,
    adjustSocial,
    adjustMoney,
    adjustJobStanding,
    adjustBattery,
    adjustNT,
    spendMoney,
    receiveMoney,
    deductBill,
    receiveEbt,
    spendEbt,
    addPhoneMessage,
    addPendingReply,
    getUnreadMessages,
    hasUnreadMessages,
    markMessagesRead,
    observeTime,
    observeMoney,
    glanceTime,
    glanceMoney,
    timeFidelity,
    moneyFidelity,
    perceivedTimeString,
    perceivedMoneyString,
    vagueTimeString,
    lerp01,
    sentimentIntensity,
    adjustSentiment,
    processSleepEmotions,
    processAbsenceEffects,
    regulationCapacity,
    sleepCycleBreakdown,
    // Geo / environment
    hemisphere,
    climateZone,
    isDaytime,
    isSunrise,
    isSunset,
    sunriseHour,
    sunsetHour,
    dayLengthHours,
    // Substances
    caffeineTier,
    consumeCaffeine,
    adenosineBlock,
    caffeineSleepInterference,
    withdrawalTier,
    nauseaTier,
    // Temperature
    seasonalTemperatureBaseline,
    diurnalTemperatureOffset,
    temperatureTier,
    // Health
    hasCondition,
    energyCeiling,
    migraineTier,
    illnessTier,
    dentalTier,
    dentalSpike,
    innerVoiceTier,
  };
}

