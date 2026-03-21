// state.js — hidden state engine
// The player never sees these numbers. Ever.

/** @typedef {ReturnType<typeof State.getAll>} GameState */

/** @param {GameContext} ctx */
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
      stomach_capacity: 100, // Max stomach volume. Default 100 (normal ~1000ml). Gastric bypass ~3, sleeve ~15.
      stomach_fullness: 0,  // 0-stomach_capacity. Physical stomach contents. Filled by eating, drained by digestion (~20 pts/hr).
                            // Suppresses hunger signal accumulation. Vomiting empties this, not hunger directly.
      stomach_liquid_fraction: 0, // 0-1. Fraction of stomach_fullness that is liquid. Liquids empty faster (~25 min half-life).
      thirst: 200,          // ml fluid deficit. 0 = fully hydrated; thirst onset ~700ml (1% body water for 70kg adult).
                            // Unit grounded in physiology: Cheuvront & Kenefick 2014 (Compr Physiol, DOI 10.1002/cphy.c130017).
                            // Approximation debt (thirst): single scalar collapses hydration status and thirst signal.
                            // Body weight not tracked — 70kg reference used throughout. Electrolytes absent — see TODO.md.
      pending_hydration: 0, // ml of fluid consumed but not yet absorbed. Drained into thirst reduction
                            // by advanceTime() with τ=20 min half-life (water gastric emptying: Shi et al. 2004 PMID 15107010).
                            // Drinking adds here; excess above deficit routes to bladder_fill.
      bladder_fill: 0,      // ml of urine in bladder. Fills from: baseline kidney output (~40ml/hr awake,
                            // ~15ml/hr asleep via ADH antidiuresis) + caffeine diuresis + excess absorbed fluid.
                            // Voided by use_toilet. Functional capacity ~300-400ml; first urge ~150ml (Weiss 2012 PMID 23140552).
      is_sleeping: false,   // True during advanceTime() within sleep execute. Gates ADH antidiuresis.
      time: 6 * 60 + 30, // Minutes since game start. Keeps incrementing, never resets.
      social: 40,         // 0-100. 0 = deeply isolated, 100 = connected.
      social_energy: 100, // 0-100. Depleted by social interaction, recovered by solitude and sleep.
                          // Depletion scales with introversion (0.2–0.8×); recovery scales inversely (0.8–1.4×).
      connection_depth: 40, // 0-100. Cumulative weight of genuine reciprocal contact lately. Decays τ=69h (half-life ~48h).
                             // No floor — can go all the way to hollow. Raised by friend messaging (+12-15), coworker interaction (+2-3).
                             // NOT raised by parasocial consumption (streams, social media browsing).
                             // Modulates the social coefficient in serotoninTarget(): genuine contact nourishes more than parasocial buffering.
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
      // NT baselines — physiological setpoints that drift toward recent NT history.
      // Experience is relative to baseline: level - baseline. Starts at 50 (neutral).
      serotonin_baseline: 50,
      dopamine_baseline: 50,
      norepinephrine_baseline: 50,
      gaba_baseline: 50,
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
      // Approximation debt (gastric emptying): time constant (~210 min, ~3.5h half-life) is chosen to represent
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

      // Personality drift — slow month-scale changes from sustained life patterns.
      // base_* values are chargen anchors; traits are clamped to [base − 20, base + 20].
      // Set once by Character.applyToState() after all personality adjustments are applied; never updated.
      base_neuroticism: 50,
      base_self_esteem: 50,
      base_rumination: 50,
      base_trait_loneliness: 50,
      base_introversion: 50,
      base_sensory_sensitivity: 0,  // mirrors sensory_sensitivity scale: −1.0 to +1.0
      // Week counter for personality drift: Math.floor(s.time / (168*60)).
      // Drift only runs when the week counter advances — avoids per-tick overhead.
      personality_drift_week: 0,

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
      // Withdrawal is derived: max(0, norepinephrine_baseline - norepinephrine) when caffeine_level < 15.
      // No stored accumulator — the NT deficit IS withdrawal.
      caffeine_today_peak: 0,  // highest caffeine_level this wake period; reset at wakeUp

      // Nicotine: 0-100. t½ ~2h (120 min) — much faster kinetics than caffeine.
      // One cigarette ≈ 30 units. Smokers have suppressed baseline dopamine;
      // cigarette raises DA to their "normal", not above. Absence feels worse than
      // non-smoker baseline.
      nicotine_level: 0,
      // Tolerance tracking: grows when daily peak ≥ 25, fades without.
      nicotine_habit: 0,       // 0-100; habitual use level. Above ~40 = established smoker.
      // Withdrawal is derived: max(0, dopamine_baseline - dopamine) when nicotine_level < 10.
      // No stored accumulator — the DA deficit IS withdrawal. Fast kinetics (t½ 2h) mean baseline
      // elevation surfaces quickly when the drug clears.
      nicotine_today_peak: 0,  // highest nicotine_level this wake period; reset at processSleepEnd
      // Cigarette inventory — now tracked by items.js

      // Alcohol: GABA-A positive allosteric modulator + NMDA antagonist.
      // BAC proxy: 1 standard drink ≈ 15 units. Zero-order kinetics (linear elimination).
      // Acute curve: low dose → GABA ↑, NE ↓, DA ↑, 5HT ↑ (push/loosening).
      // High dose → GABA ↑↑↑, DA crash, adenosine accelerates (sedation), NE suppressed.
      // Post-acute: GABA rebound (anxiety), NE rebound ↑, 5HT below baseline (hangover).
      // Ref: Valenzuela 1997 (PMID 15704351, PMC6826822).
      alcohol_level: 0,        // 0–100 BAC proxy. ~100 = severely impaired.
      alcohol_tolerance: 0,    // 0–100; chronic use shifts effective dose curve. Proxy for gaba_baseline elevation.
      // Withdrawal is derived: max(0, gaba_baseline - gaba) when alcohol_level < 5.
      // No stored accumulator — the GABA deficit IS withdrawal.
      alcohol_sleep_flag: false, // set when alcohol consumed before sleep; cleared on wakeUp
      tremor_active: false,    // true when in DT-territory (withdrawal>70 && tolerance>65); cleared below 50
      // Alcohol inventory — now tracked by items.js

      // Cannabis: indirect dopamine release (mesolimbic) + mild GABA modulation.
      // Distinct from alcohol GABA agonism — cannabis CB1 agonism is indirect (presynaptic inhibition
      // of inhibitory interneurons, not direct GABA-A allosteric modulation).
      // Key phenomenological feature: emotional blunting (reduced amplitude of NT drift toward extremes).
      // t½ ~90min for acute psychoactive THC (plasma Cmax at 10–30min, active phase 2–4h).
      // Ref: Huestis 2007 (PMID 17990166) — THC pharmacokinetics.
      // cannabis_level: 0–100. One unit (bowl/blunt) ≈ 60 units.
      cannabis_level: 0,
      // Tolerance: builds with daily use, washes out over ~2 weeks.
      // Emotional blunting persists at high tolerance even after acute effects clear (flat affect).
      cannabis_tolerance: 0,   // 0–100; habitual use level
      // Withdrawal is derived: max(0, dopamine_baseline - dopamine) when cannabis_level < 10.
      // No stored accumulator — the DA deficit IS withdrawal. Mild relative to nicotine/alcohol.
      // Sleep flag: cannabis before sleep suppresses REM (THC-dominant street cannabis).
      cannabis_sleep_flag: false, // set when cannabis consumed before sleep; cleared on wakeUp
      // REM rebound: set by processSleepEnd() when suppression flag was active THIS sleep;
      // content.js reads it BEFORE processSleepEnd() runs on the NEXT sleep → true = last night
      // had REM suppression → brain over-corrects with vivid/disturbing dreams this recovery night.
      rem_rebound_pending: false,
      // Cannabis inventory — now tracked by items.js

      // Opioids: mu-opioid receptor agonist. Prescription pathway only.
      // Mechanism: endorphin system activation (mu-opioid → G-protein → adenylyl cyclase inhibition),
      // indirect dopamine release (VTA disinhibition via GABA interneuron suppression),
      // mild GABA modulation, mild serotonin modulation.
      // t½ ~4h for short-acting formulations (hydrocodone/oxycodone immediate release).
      // One dose ≈ 40 units. Tolerance builds faster than any other modeled substance.
      // Ref: Trescot et al. 2008 (PMID 18443637 — opioid pharmacology review).
      opioid_level: 0,           // 0–100 mu-opioid receptor occupancy proxy
      opioid_tolerance: 0,       // 0–100; builds with repeated use, fades slowly
      // Withdrawal is derived: endorphin deficit relative to baseline when opioid_level < 10.
      // Opioid withdrawal is more severe than other modeled substances — flu-like symptoms,
      // pain amplification (hyperalgesia), severe anxiety, GI distress.
      // No stored accumulator — the endorphin deficit IS withdrawal.
      opioid_today_peak: 0,      // highest opioid_level this wake period; reset at processSleepEnd
      opioid_doses_remaining: 0, // prescription doses left; decremented on use
      opioid_prescription: false, // true when character has active prescription
      // Opioid inventory — tracked via items.js ('prescription_opioid')

      // Recovery / quit attempts
      // quit_attempt: the substance being quit, or null if no active attempt.
      // quit_attempt_start: absolute game-time (minutes) when the attempt began.
      // quitDays() derives days elapsed — never store a counter.
      // craving_intensity: 0–100 composite craving signal updated each advanceTime().
      // days_clean: longest contiguous streak (minutes since last use / 1440).
      //   Tracked as longest quit streak so milestone thoughts survive relapse.
      quit_attempt: /** @type {'nicotine'|'alcohol'|'cannabis'|null} */ (null),
      quit_attempt_start: 0,   // absolute game-minutes; 0 = not in an attempt
      craving_intensity: 0,    // 0–100; composite signal across all active withdrawals
      days_clean: 0,           // longest completed clean streak in days (milestone tracker)
      meeting_last_attended: 0, // game-time of most recent NA/AA meeting (0 = never)
      meeting_count: 0,         // total meetings attended (drives recognition arc + sponsor)
      sponsor_name: /** @type {string|null} */ (null), // generated at meeting 10; picked from pool via rng
      sponsor_active: false,    // true once sponsor relationship is established
      sponsor_contact_time: 0,  // game-time of last sponsor contact (0 = never)
      sponsor_calls: 0,         // total sponsor contacts (calls + texts + in-person)
      sponsor_meetings: 0,      // in-person meet_with_sponsor count (drives step progression)
      recovery_step: 0,         // 0–12; which step the character is working on (0 = pre-step-work)
      step_meetings: 0,         // meetings at current step; resets on step advance

      // Sponsor relationship — active only when quit_attempt !== null.
      // sponsor_rapport: 0–100 accumulated relational weight (rises with each contact interaction).
      // sponsor_meetings: lifetime count of call/text/meet interactions with sponsor.
      // recovery_step: current 12-step working step (1–12, or 0 = not yet started step work).
      // sponsor_last_contact: absolute game-time of last call/text/meet (0 = never).
      // sponsor_last_meetup: absolute game-time of last in-person meeting (0 = never).
      sponsor_rapport: 0,
      sponsor_meetings: 0,
      recovery_step: 0,
      sponsor_last_contact: 0,
      sponsor_last_meetup: 0,

      // General nausea — shared across systems (withdrawal, illness, alcohol).
      // Decays naturally; some sources clear faster with treatment.
      nausea: 0,               // 0-100
      // Vomiting — set in advanceTime() when nausea > 75, cleared in checkEvents() on fire.
      pending_vomit: false,

      // Gastritis — only relevant if health_conditions includes 'gastritis'
      gastritis_pain: 0,    // 0-100 continuous epigastric pain; rises when stomach empty, eases on eating

      // Sleep inertia — waking grogginess. Set from sleepCycleBreakdown() on wake; decays
      // with a debt-dependent time constant in advanceTime(). 0 when fully alert.
      sleep_inertia: 0,

      // Cleaning smell — transient soap/shampoo smell after showering or washing dishes.
      // Set by shower interactions (~90) and do_dishes (~70); decays with τ≈90 min (half-life ~62 min).
      // The sharp chemical-clean smell of soap and shampoo fades within 1–2 hours.
      // Zeroed out below 1 to avoid perpetual tail.
      cleaning_smell_intensity: 0,

      // Coffee smell — set to 80 by make_coffee; decays with τ≈60 min (half-life ~42 min).
      // Coffee aroma is volatile and fades within ~1.5 hours after brewing.
      coffee_smell_intensity: 0,

      // Food smell — set by cooking interactions (70) and make_toast (45); decays with τ≈120 min.
      // Cooking odors linger longer than coffee or cleaning products.
      food_smell_intensity: 0,

      // Scheduled interrupt queue — time-threshold events independent of the sleep/wake cycle.
      // Each entry: { id, triggerAt (absolute game-time), type, data, fired? }
      // fired=true means it has fired and is awaiting reschedule (prevents re-fire).
      // The wake-up alarm is one entry type; medication reminders, timers, calendar alerts are others.
      scheduled_interrupts: /** @type {{ id: string, triggerAt: number, type: string, data: any, fired?: boolean }[]} */ ([]),

      // Personal calendar — recurring dates (birthdays, anniversaries). Copied from character at applyToState().
      personal_calendar: /** @type {CalendarEvent[]} */ ([]),
      // Current calendar alert data — set by world.js checkEvents when calendar_alert interrupt fires.
      current_calendar_alert: /** @type {any} */ (null),
      // Current flight alert data — set by world.js checkEvents when time_to_leave_flight / flight_departure fires.
      current_flight_alert: /** @type {import('./types.d.ts').FlightEvent | null} */ (null),

      // Flags and soft state
      wake_period_start: 0,  // game time when the player last woke; reference point for event log queries
      hygiene_level: 95,   // 0-100; decays ~3 pts/hr awake; shower restores to 95
      skin_condition: 85,  // 0-100; hot showers strip oils; cold gentle; recovers overnight
      // Consumable inventories (moisturizer, pain reliever, umbrella, period supplies) — now tracked by items.js
      needs_period_supplies: false, // set when supplies run out during menstruation; stress pathway

      // Menstrual cycle — only relevant if character has a uterus. null = not applicable.
      // cycle_start_time: absolute game-minutes when day 1 of current cycle began.
      //   Derived: cycleDay() = floor((time - cycle_start_time) / 1440) % cycle_length + 1.
      //   Correctly handles long sleeps and any time advance — day is never a separate counter.
      // Phases (Approximation debt (menstrual): all boundary days chosen from textbook averages;
      //   individual variation is substantial. Reed & Carr 2018 (PMID 25905282): luteal ~14 days
      //   constant; follicular 10–16 days variable. Bleeding duration: ~5 days median (Mao 2021
      //   PMID 33879662). Ovulation timing modeled as days 13–15 (LH surge window).):
      //   Menstrual   1–5:   flow, cramping, fatigue
      //   Follicular  6–13:  energy recovering, estradiol rising
      //   Ovulatory  13–15:  peak estradiol, energy/social peak
      //   Luteal     16–end: progesterone dominant; days 23–end = late luteal / PMS window
      cycle_start_time: /** @type {number|null} */ (null), // null = not applicable
      cycle_length: 28,   // Approximation debt (menstrual): 24–35 day range; FIGO normal is 24–38
      // (Thiyagarajan 2022 PMID 29763196); 24–35 is slightly narrower than consensus. Set from character.
      cramp_severity: 0,  // 0–1; constitutional cramping tendency; set from character (0 = none)
      cramps_active: false,        // true when cramping is actively interfering right now
      cramp_relief_until: 0,       // game time (minutes) when NSAID cramp relief expires; 0 = no relief
      period_supply_last_consumed: 0, // game time of last supply unit consumed
      dressed: false,
      // Cleanliness of currently-worn clothes. 0 = noticeably dirty/smelly, 100 = freshly washed.
      // Degrades while dressed; pauses when undressed. Restored to ~95 by laundry.
      // Set to ~85 on get_dressed (clean items) or ~30 on get_dressed (dirty/floor items).
      clothing_cleanliness: 85,
      // True when a visible outer garment (top/bottom/dress/outerwear) currently worn has torn or stained damage.
      // Set by content.js after applyDamage. Cleared on undress (damage persists on item, but you're not wearing it).
      // Stretched damage is visible but less legible to others — not counted here.
      clothing_visible_damage: false,
      has_phone: true,
      phone_battery: 70,     // 0-100
      battery_health: 100,   // 0-100; how much charge the battery can hold (capacity, not current level)
      phone_age_days: 0,     // game-days since phone was "new"; drives health degradation
      phone_model_age_years: 0, // initial age of the phone at chargen (years); drives slowness tier
      // phone_signal removed — now derived via phoneSignal(). No stored state.
      fridge_food: 2,        // Rough units. 0 = empty.
      pantry_food: 1,        // Shelf-stable. Doesn't spoil. 0 = empty.

      // --- Pantry ingredients (cooking system) ---
      // Each key is a count of distinct ingredient units available for cooking.
      // pasta: ~3 servings/unit, 25 min cook. rice: ~4 servings/unit, 30 min.
      // canned: ready-to-heat (soup/beans/etc), 5 min. eggs: 2 servings/unit, 10 min.
      // bread: 2 servings/unit, 5 min toast. Non-perishables (pasta/rice/canned) don't decay.
      pantry: /** @type {{ pasta: number, rice: number, canned: number, eggs: number, bread: number, beans: number, oats: number, potatoes: number, peanut_butter: number, ramen: number, oil: number, snacks: number, vegetables: number, flour: number, tortillas: number, noodles: number, tofu: number, canned_tuna: number, soy_sauce: number, hot_sauce: number, spices: number }} */ ({
        pasta: 0, rice: 0, canned: 0, eggs: 0, bread: 0,
        beans: 0, oats: 0, potatoes: 0, peanut_butter: 0, ramen: 0,
        oil: 0, snacks: 0, vegetables: 0, flour: 0,
        // Expanded vocabulary from food profile cultural traditions
        tortillas: 0, noodles: 0, tofu: 0, canned_tuna: 0,
        soy_sauce: 0, hot_sauce: 0, spices: 0,
      }),
      peanut_butter_uses: 0,    // uses remaining in current peanut_butter unit (10 per jar)
      oil_uses: 0,              // uses remaining in current oil unit (10 per bottle)
      cooking_skill: 30,        // 0–100, set by applyToState from food_profile
      ethical_stance: /** @type {'omnivore'|'flexitarian'|'vegetarian'|'vegan'|'pescatarian'} */ ('omnivore'),
      cultural_tradition: /** @type {string} */ ('western'), // 'western'|'latin'|'east_asian'|'south_asian'|'west_african'|'middle_eastern'|'eastern_european'|'mixed'
      health_restrictions: /** @type {string[]} */ ([]),     // e.g. ['lactose_intolerant', 'gluten_free', 'low_gluten']
      comfort_foods: /** @type {string[]} */ ([]),           // 2-3 specific items from cultural tradition
      pantry_slots: /** @type {string[]} */ ([]),            // active ingredient slots for this character
      browsing_store: false,                                  // true when player is shopping for pantry items at corner store
      last_cooked: 0,           // game time of most recent cook interaction (0 = never)
      last_egg_purchase: 0,     // game time of last egg purchase — used for 21-day decay
      last_bread_purchase: 0,   // game time of last bread purchase — used for 7-day decay

      weather: 'overcast',   // Set by events
      rain: false,

      // Location
      location: 'apartment_bedroom',
      previous_location: /** @type {string | null} */ (null),
      location_arrival_time: 0,   // game-time (minutes) when character last arrived at current location

      // Work specifics
      work_tasks_expected: 4,

      // Labor arrangement — the character's structural relationship to employer time demands.
      // Approximation debt (work scheduling): all characters currently get fixed/weekdays derived from job type.
      // Task 4 (chargen) will generate proper arrangements. See docs/design/work-scheduling.md.
      labor_arrangement: /** @type {LaborArrangement} */ ({
        type: 'fixed',
        day_pattern: 'weekdays',
        work_days: [1, 2, 3, 4, 5],  // 0=Sun … 6=Sat
        shift_start: 9 * 60,
        shift_end: 17 * 60,
        split_shift: false,
        shift_start_2: null,
        shift_end_2: null,
        reveal_horizon_hours: null,   // null = always known (fixed)
        reveal_tod: null,
        work_days_per_week: 5,
        on_call: false,
        on_call_start: null,
        on_call_end: null,
      }),
      // known_shifts — what character currently knows about upcoming shifts.
      // Map of absolute game-day → {start, end, blocks?} | null (null = explicitly not scheduled).
      // Key absent = not yet revealed (on_demand/rotating) or irrelevant (fixed, derived on demand).
      // blocks is present for split shifts — array of {start, end} for each work block.
      known_shifts: /** @type {Record<number, {start: number, end: number, blocks?: Array<{start: number, end: number}>} | null>} */ ({}),

      // Rotating schedule reveal — most recent reveal result for tomorrow's shift.
      // Set by world.js checkEvents() when a schedule_reveal interrupt fires for rotating workers.
      // Cleared to null each morning when the new day's reveal fires (rotating workers learn one day at a time).
      upcoming_shift_type: /** @type {'work' | 'off' | null} */ (null),   // null = not yet revealed today
      upcoming_shift_start: /** @type {number | null} */ (null),          // minutes from midnight, or null if off/unrevealed
      upcoming_shift_end: /** @type {number | null} */ (null),

      // On-call state
      on_call_checked_today: false,
      on_call_pending: false,

      // Shift swap tracking
      last_shift_swap_time: 0,   // game-minutes timestamp of most recent successful swap

      // Shift cover tracking — coworker covers your shift (cover_my_shift interaction)
      shift_cover_last_used: 0,  // game-minutes timestamp of last successful shift cover; 0 = never

      // Unemployment state — only meaningful when job_type === 'unemployed' or 'cant_work'
      unemployed_weeks: 0,       // how many weeks since last employment; drives financial anxiety and social effects

      // Job termination — set when hasEmployer() + job_standing reaches 0 during play.
      // terminated overrides hasEmployer() → false and isUnemployed() → true mid-run.
      // Cleared when a new job is accepted (accept_job_offer / accept_job_offer_N).
      terminated: false,
      termination_date: 0,       // game-time when termination fired; 0 = not terminated this run
      unemployment_benefit_active: false,
      unemployment_benefit_amount: 0,   // weekly benefit amount in dollars
      unemployment_applied_day: 0,      // guard: game day of application (prevents duplicate)
      last_unemployment_benefit_day: 0, // guard: day of last benefit payment

      // Phone inbox and mode
      phone_inbox: /** @type {{ type: string, text: string, read: boolean, source?: string, direction?: string, timestamp?: number, paid?: boolean }[]} */ ([]),
      pending_messages: /** @type {{ type: string, text: string, read: boolean, source?: string, direction?: string, timestamp?: number, paid?: boolean, subtype?: string }[]} */ ([]),
      phone_silent: false,
      viewing_phone: false,
      // Phone navigation — transient, reset on put_phone_away, not meaningful in save
      phone_screen: 'home',            // 'home' | 'messages' | 'thread' | 'notifications' | 'notes' | 'note_view'
      phone_thread_contact: /** @type {string | null} */ (null), // 'friendN' | 'supervisor' | 'bank' | 'family'
      phone_prev_screen: /** @type {string | null} */ (null),  // screen to return to from notifications
      phone_note_index: /** @type {number | null} */ (null),   // index of note currently being viewed
      last_msg_gen_time: 0,     // game time of last generateIncomingMessages call
      // Notes app — persisted, each note: { text: string, timestamp: number }
      notes: /** @type {{ text: string, timestamp: number }[]} */ ([]),
      // Timer app — game-time minutes when timer fires (null = no active timer)
      timer_end_time: /** @type {number | null} */ (null),
      timer_duration: 0,        // minutes set for current/last timer (for display)
      // Journaling
      last_journaled: 0,        // game-minutes timestamp of most recent journaling session; 0 = never
      // Each entry: { tone: 'venting'|'processing'|'dreaming'|'observing', timestamp: number }
      journal_entries: /** @type {{ tone: string, timestamp: number }[]} */ ([]),
      // Body care rituals
      last_stretched: 0,        // game-minutes timestamp of most recent stretch session; 0 = never
      last_skincare: 0,         // game-minutes timestamp of most recent skincare session; 0 = never
      last_makeup: 0,           // game-minutes timestamp of most recent makeup application; 0 = never
      // Makeup inventory — now tracked by items.js
      // Financial cycle
      housing_type: 'standard', // 'all_inclusive' | 'room_share' | 'standard'; set from character
      apartment_size: '1br',    // 'studio' | 'small_1br' | '1br' | '2br' | '3br'; set from character
      heating_type: 'gas',      // 'electric_radiator' | 'gas' | 'heat_pump'; set from character
      insulation_quality: 'fair', // 'poor' | 'fair' | 'good'; set from character
      hourly_rate: 0,           // hourly take-home rate, set from character backstory
      rent_amount: 0,           // monthly rent, from character backstory
      hours_worked_period: 0,   // hours worked since last paycheck (accumulates per shift)
      last_paycheck_gross: 0,   // last paycheck gross amount (for prose access)
      last_paycheck_net: 0,     // last paycheck net amount (for prose access)
      last_paycheck_deductions: 0, // last paycheck total deductions (for prose access)
      last_paycheck_day: 0,     // guard: game day of last paycheck
      last_rent_day: 0,         // guard: game day of last rent deduction
      last_utility_day: 0,      // guard: game day of last utility deduction
      last_phone_bill_day: 0,   // guard: game day of last phone bill deduction
      last_ebt_day: 0,          // guard: game day of last EBT load
      last_interest_day: 0,     // guard: game day of last overdraft interest charge
      // Billing cycle offsets — set from character by applyToState()
      paycheck_day_offset: 7,   // day % 14 === this → paycheck fires
      rent_day_offset: 1,       // day % 30 === this → rent fires
      utility_day_offset: 15,   // day % 30 === this → utilities fire
      phone_bill_day_offset: 20, // day % 30 === this → phone bill fires
      phone_bill_amount: 45,    // monthly phone plan cost; set from character by applyToState()
      ebt_day_offset: 5,        // day % 30 === this → EBT reloads

      // SNAP/EBT food benefit
      ebt_balance: 0,           // current spendable EBT balance
      ebt_monthly_amount: 0,    // monthly load amount (0 = not enrolled)

      // Sleep cycle length — personal biology, set by applyToState(). 90 = population mean.
      sleep_cycle_length: 90,  // minutes (70–120); set by applyToState() from character
      // Character age — drives age-dependent physiology (e.g. N3 deep sleep scaling).
      age_stage: 35,            // years; set by applyToState() from character

      // Body system — set at chargen, modified during play
      conception_time: /** @type {number | null} */ (null),   // null = not pregnant; absolute game-minutes of conception
      // pregnancyWeek() = floor((time - conception_time) / (7 * 1440)) — unbounded.
      // 42 weeks is a clinical intervention threshold, not a biological ceiling.
      // Note: gestational age (clinical convention) = weeks-from-conception + 2.
      // Labor/delivery are probabilistic events emerging from the simulation, not a hard stop.
      binder_start_time: /** @type {number | null} */ (null), // game-time (minutes) when binder was put on
      // Binder inventory — now tracked by items.js

      // Health conditions
      health_conditions: /** @type {string[]} */ ([]),  // set by applyToState()
      // Migraines — only relevant if health_conditions includes 'migraines'
      migraine_active: false,
      migraine_intensity: 0,    // 0-100 pain level; decays ~8 pts/hr during active phase
      migraine_hours_active: 0, // hours since onset; used to pace decay

      // Dental pain — only relevant if health_conditions includes 'dental_pain'
      dental_ache: 0,   // 0-100 continuous pain; spikes from eating/hot-cold, decays ~1.5/hr
      // Dental condition — underlying disease state driving the ache.
      // 'sound': no active disease (or not applicable). 'inflamed': pulpitis / early caries.
      // 'infected': periapical abscess beginning. 'abscess': established abscess — systemic effects.
      // Worsening timeline: inflamed→infected after 14 game-days untreated; infected→abscess after 7 further.
      // dental_last_treated: game timestamp of last professional treatment (0 = never).
      // Approximation debt (dental): worsening timeline approximated; real progression varies widely.
      // Periodontal disease: Sri Lanka 15yr study (PMID 3487557) — 8% rapid, 81% moderate, 11% no
      // progression. Caries progression: 0.07–1.77 DMFS/yr (PMID 31070943 systematic review).
      // Pulpitis→abscess timeline: no published prospective data; weeks to months in clinical reports.
      dental_condition: /** @type {'sound'|'inflamed'|'infected'|'abscess'} */ ('sound'),
      dental_last_treated: 0,  // game-time (minutes) of last dentist treatment; 0 = never
      dental_abscess_onset: 0, // game-time (minutes) when abscess first established; 0 = not yet
      teeth_lost: 0,           // count of teeth lost to extraction or decay
      // Dental health — overall oral health independent of acute condition.
      // 100 = healthy mouth, 0 = severe neglect. Decays slowly without professional visits.
      // Low dental_health increases probability of dental_ache flares and condition worsening.
      // Approximation debt (dental): decay rate 0.15/day chosen; real oral health deterioration
      // depends on diet, brushing habits, genetics, fluoride access — none individually modeled.
      dental_health: 70, // 0-100; set by applyToState() from backstory-derived initial value
      has_dental_insurance: false, // derived from job_type + economic_origin at chargen
      // Annual dental insurance cap (US PPO plans only).
      // dental_insurance_used: dollars billed to insurance this plan year.
      // dental_insurance_cap: annual maximum; set by applyToState() from insurance type.
      //   Typical US PPO: $1,000–$2,500; median ~$1,500 (NADP/ADA survey data, no single PMID;
      //   ADA Dental Benefits: An Introduction PDF, 2021, ada.org).
      //   DHMO plans typically have no annual cap — cap of 0 signals no cap applies.
      // dental_insurance_plan_start: game day when current plan year started (0 = game start).
      // Approximation debt (dental): US PPO cap modeled; DHMO no-cap not fully realized (DHMO
      //   copay structure differs from PPO coinsurance — the whole cost model is a PPO proxy).
      dental_insurance_used: 0,   // dollars used against annual cap this plan year
      dental_insurance_cap: 0,    // annual maximum in dollars; 0 = no cap (DHMO) or no insurance
      dental_insurance_plan_start: 0, // game day when plan year started; reset annually

      // Clinic — walk-in free clinic access and prescriptions
      clinic_last_visit: 0,          // game-time (minutes) of last clinic visit; 0 = never
      clinic_checkin_time: /** @type {number | null} */ (null),  // game-time when checked in; null = not checked in
      clinic_ready: false,           // true when clinic_ready interrupt has fired (see_doctor_clinic available)
      clinic_has_appointment: false, // true when a scheduled clinic appointment is pending
      clinic_appointment_time: 0,    // game-time (minutes) of scheduled appointment; 0 = none
      clinic_prescriptions: /** @type {string[]} */ ([]),  // active prescription types: 'antacid' | 'hrt' | 'dental_referral' | 'pain_management' | 'illness' | 'antidepressant' | 'anxiolytic' | 'mood_stabilizer'

      // Pharmacy — prescription fill state
      pharmacy_last_fill: 0,  // game-time (minutes) of last prescription fill; 0 = never
      // Medication supply — map of medication type → remaining doses (days for daily meds, doses for PRN)
      medication_supply: /** @type {Record<string, number>} */ ({}),
      last_medication_time: 0,  // game-time (minutes) of last take_medication; 0 = never taken

      // Psychiatric medication onset tracking — game-time (minutes) when first dose was taken.
      // Used to compute onset ramp: antidepressant 21 days, anxiolytic 7 days, mood_stabilizer 14 days.
      // 0 = never started. Resets if supply runs out completely (missed doses restart the ramp).
      psych_med_start: /** @type {Record<string, number>} */ ({}),

      // ER — emergency room state
      er_checkin_time: /** @type {number | null} */ (null),  // game-time when checked in; null = not checked in
      er_ready: false,          // true when er_ready interrupt has fired (er_treatment available)
      er_last_visit: 0,         // game-time (minutes) of last ER visit; 0 = never

      // Illness — medication flag (set by pharmacy fill or ER treatment)
      illness_medicated: false, // true when illness-specific meds are active; 0.4× NT effect factor

      // Pharmacy — prescription fill state
      pharmacy_last_fill: 0,
      medication_supply: /** @type {Record<string, number>} */ ({}),
      last_medication_time: 0,
      psych_med_start: /** @type {Record<string, number>} */ ({}),

      // ER — emergency room state
      er_checkin_time: /** @type {number | null} */ (null),
      er_ready: false,
      er_last_visit: 0,

      // Illness — medication flag
      illness_medicated: false,

      // Therapy — talk therapy with a therapist, separate from clinic visits.
      // Referred by clinic doctor when mental health conditions present.
      therapy_active: false,          // true when attending therapy (has ongoing appointments)
      therapy_sessions: 0,           // count of attended sessions (lifetime)
      therapy_rapport: 0,            // 0-100; therapeutic alliance strength; grows with attendance, decays with skipping
      therapy_appointment_day: 3,    // 0-6 (Sun=0); day of week for recurring appointment. Default Wed.
      therapy_last_session: 0,       // game-time (minutes) of most recent attended session; 0 = never
      // Therapy modality — determines session prose flavor and minor NT coefficient variation.
      // 'cbt' (Cognitive Behavioral Therapy) — thought pattern restructuring, most evidence-based.
      // Future modalities: 'dbt' (Dialectical Behavior Therapy — distress tolerance, emotion regulation),
      // 'emdr' (Eye Movement Desensitization — trauma reprocessing).
      // Approximation debt (therapy modality): modality selection is currently automatic based on
      // conditions at referral time; real modality choice involves patient preference, therapist
      // availability, and insurance coverage. Player-chosen modality deferred.
      therapy_modality: /** @type {string | null} */ (null), // set at referral; null = no therapy yet
      // Approximation debt (therapy): $150/session base cost is US average; no sliding scale,
      // insurance tiers, or community mental health center path modeled yet.
      therapy_cost: 150,             // per-session cost in dollars; modified by economic factors

      // Specialist referral system — set when see_doctor_clinic issues a referral.
      specialist_referral_pending: false,           // true when a referral has been issued
      specialist_referral_type: /** @type {string} */ (''),  // 'physio' | 'allergist' | 'cardiology' | 'gi' | 'neurology'
      seen_specialist_recently: false,              // true for 3 game-days after see_specialist
      seen_specialist_time: 0,                      // game-time (minutes) of last specialist visit; 0 = never

      // Condition-specific treatment parameters — set at chargen or by specialist visit.
      // Approximation debt (specialist treatment): all initial values chosen without individual calibration.
      mcas_flare_risk: 0,            // 0-100; risk of MCAS flare per hour; set to 40 at chargen if has_mcas
      pots_standing_tolerance: 70,   // 0-100; tolerance to orthostatic stress; POTS chargen sets to 30
      gastritis_treatment_recent: false,  // true for 7 game-days after GI specialist visit
      gastritis_treatment_time: 0,   // game-time of GI specialist treatment; 0 = never
      migraine_threshold: 50,        // 0-100; higher = harder to trigger migraine; neurology visit +10
      migraine_quiet_resolved: false, // true for current wake period if a migraine resolved faster than expected

      // hEDS new-joint tracking — flags a novel joint location announcing itself.
      // Cleared each sleep. Fires with low probability when chronic_pain_level > 60.
      heds_new_joint_today: false,   // true = prose can note an unfamiliar location; cleared by sleep

      // Vasovagal / orthostatic — continuous risk model; no condition gate (anyone can faint).
      // 'autonomic_dysregulation' condition accelerates accumulation and slows recovery.
      vasovagal_risk: 0,      // 0-100; accumulates when BP proxy is low; cleared by sleep
      vasovagal_recovery: 0,  // 0-100; post-episode residual fatigue; drains ~15 pts/hr

      // Acute illness — transient, anyone can get it. Separate from chronic health_conditions.
      illness_severity: 0,                             // 0-1 continuous (0 = healthy)
      illness_type: /** @type {string|null} */ (null), // 'flu' | 'cold' | 'gi'
      illness_day: 0,                                  // days since onset; drives severity arc

      // Internal counters the player never sees
      actions_since_rest: 0,
      times_late_this_week: 0,
      consecutive_meals_skipped: 0,
      last_social_interaction: 0, // action count at last interaction
      friend_contact: /** @type {Record<string, number>} */ ({}), // slot → game time of last engagement
      // Family relationship state — set by applyToState() from character.family
      family_type: 'distant',           // 'supportive' | 'conditional' | 'distant' | 'absent' | 'hostile'
      family_archetype: 'checked_out',  // 'warm_caring' | 'performance_watching' | 'checked_out' | 'unreachable' | 'critical'
      family_member: 'parent',          // 'parent' | 'both_parents' | 'sibling'
      family_contact: 0,                // game time of last family contact (0 = never)
      family_guilt: 0,                  // 0–1; accumulates during sleep after grace period
      family_dread: 0,                  // 0–1; hostile/critical family only — accumulates when unread msgs waiting; distinct from guilt
      family_unread: 0,                 // count of unread family messages in inbox
      family_support_pending: 0,        // amount > 0 when a financial support message is awaiting read; cleared on read
      last_family_support_time: 0,      // game time of last family financial support event (prevents stacking)
      pending_replies: /** @type {{ slot: string, arrivesAt: number, text: string, effect?: { type: 'receiveMoney', amount: number } }[]} */ ([]),
      // Bills the player cannot fully afford and must decide whether to pay or skip.
      // Each entry: { name: 'rent'|'utilities'|'phone', amount: number, notified: boolean }
      // Added by deductBill() when money < amount. notified set true when bill_due event fires.
      // Cleared when pay_bill_* or skip_bill_* fires.
      pending_bills: /** @type {{ name: string, amount: number, notified: boolean }[]} */ ([]),

      // Service continuity — defaults true; cut when consecutive failures hit threshold.
      // Approximation debt (bill consequences): failure thresholds (2 cycles for phone/utilities)
      // chosen; real carriers vary by contract and state regulation.
      phone_service: true,          // false = account suspended; messaging/calls unavailable
      phone_bills_failed: 0,        // consecutive unpaid phone bill cycles
      utilities_on: true,           // false = power cut; electric appliances/lighting unavailable
      utilities_bills_failed: 0,    // consecutive unpaid utility bill cycles

      // Eviction risk — accumulates with each failed rent payment; reduces with each paid cycle.
      // At ≥ 100: sets displaced=true; displacement event fires via world.js checkEvents().
      // Routing to shelter/friend/street deferred — see TODO.md.
      // Approximation debt (eviction risk): accumulation increments (25/35/40) and reduction (20)
      // chosen; real timelines depend on jurisdiction and landlord.
      eviction_risk: 0,         // 0-100; 0 = no risk; ≥ 100 = eviction threshold reached
      rent_bills_failed: 0,     // consecutive unpaid rent cycles; drives escalating notice increments
      displaced: false,         // true once eviction_risk reaches 100 and displacement event fires

      // Housing displacement routing — current situation when displaced
      staying_with: /** @type {string|null} */ (null), // null | 'friend' | 'shelter' | 'family' — current housing when displaced
      family_stay_days: 0,            // consecutive nights at family's place; pressure builds after 7
      family_stay_strain: false,      // true after 7 family_stay_days — loss of autonomy visible in prose

      // Family visit state — announced by phone message, fires as interrupt
      family_visit_pending: false,    // true when a visit has been scheduled
      family_visit_active: false,     // true while family member is present in the apartment
      couch_days: 0,            // consecutive nights slept at friend's place
      couch_strain: false,      // true after 5 couch days — friction visible in prose
      couch_available: true,    // false after friend asks them to leave (10 days)
      shelter_bed: false,       // whether they got a shelter bed tonight (resets each sleep; must check in again)
      shelter_visits: 0,        // lifetime check-in count — shapes recognition prose and resident familiarity
      carry_food: 0,            // units of portable food carried when displaced (set by soup kitchen / food bank receive paths; consumed by eat_outside)

      // Habit disruption guard — prevents double-firing the disruption check in one time-step.
      last_disruption_check: 0, // game time of last checkRoutineDisruption() call

      // Event surfacing — tracks last tier at which body-state events fired.
      // Events fire once per tier crossing (hungry→very_hungry→starving, exhausted→depleted).
      // Reset when the condition resolves (eating, resting).
      last_surfaced_hunger_tier: /** @type {string|null} */ (null),
      last_surfaced_thirst_tier: /** @type {string|null} */ (null),
      last_surfaced_bladder_tier: /** @type {string|null} */ (null),
      last_surfaced_energy_tier: /** @type {string|null} */ (null),
      last_surfaced_vasovagal_tier: /** @type {string|null} */ (null),

      // Gym membership
      gym_membership: false,           // true when character has an active gym membership
      gym_membership_cost: 0,          // monthly fee; set from character by applyToState()
      gym_bill_day_offset: 10,         // day % 30 === this → gym bill fires
      last_gym_bill_day: 0,            // guard: game day of last gym bill deduction
      gym_checkins_this_week: 0,       // reset each week; habit system input

      // Insurance — set from character by applyToState()
      // Approximation debt (insurance): US-centric model; non-US jurisdictions ignored.
      insurance_type: /** @type {InsuranceType} */ ('uninsured'),
      insurance_premium: 0,            // monthly premium amount
      insurance_bill_day_offset: 15,   // day % 30 === this → insurance premium fires
      last_insurance_bill_day: 0,      // guard: game day of last insurance bill deduction

      // Corner store
      corner_store_visits: 0,    // lifetime arrival count — shapes recognition prose

      // Soup kitchen
      soup_kitchen_visits: 0,    // lifetime visit count — shapes prose

      // Food bank
      last_food_bank_day: 0,     // game day of last visit (0 = never)
      food_bank_visits: 0,       // lifetime visit count — shapes prose

      // Street and bus stop — block-level recognition
      street_visits: 0,          // lifetime arrivals — shapes neighborhood recognition prose
      bus_stop_visits: 0,        // lifetime arrivals — shapes commuter micro-community prose

      // Named neighbor — recurring person on the block. Set by applyToState() from character.
      neighbor_name: /** @type {string|null} */ (null),
      neighbor_archetype: /** @type {string|null} */ (null),
      neighbor_pronoun_set: /** @type {PronounSet|null} */ (null),
      neighbor_encounters: 0,    // times seen at street or bus_stop (daytime)

      // Corner store clerk — name revealed at familiar tier. Set by applyToState() from character.
      clerk_name: /** @type {string|null} */ (null),
      clerk_pronoun_set: /** @type {PronounSet|null} */ (null),

      // Bus stop regular — commuter seen during morning hours. Set by applyToState() from character.
      bus_regular_name: /** @type {string|null} */ (null),
      bus_regular_pronoun_set: /** @type {PronounSet|null} */ (null),
      bus_regular_encounters: 0, // times arrived at bus_stop during morning commute hours (7-9 AM)

      // Shelter residents — named recurring people encountered during displacement.
      // Set by applyToState() from character.shelter_residents.
      shelter_residents: /** @type {ShelterResident[]} */ ([]),

      // Asking a friend for money — cooldown and repeat tracking
      last_asked_for_help_time: 0, // game time of last ask (0 = never)
      asked_for_help_count: /** @type {Record<string, number>} */ ({}), // slot → times asked

      // Friend in-need messages — per-slot cooldown (14-day minimum gap)
      friend_in_need_last: /** @type {Record<string, number>} */ ({}), // slot → game time of last in-need msg

      // Laundry async state
      laundry_phase: 'none',    // 'none' | 'washing' | 'drying' | 'done'
      laundry_phase_started: 0, // State.get('time') when current phase began
      laundry_access: 'in_unit', // 'in_unit' | 'building' | 'laundromat' — derived from housing_quality at chargen.

      // Observation tracking — fidelity degrades with distance from last observation
      last_observed_time: 6 * 60 + 30,   // alarm time
      last_observed_money: 47.50,         // matches default starting money

      // Per-location familiarity — accumulated time at each location, expressed as
      // a 0–1 value via saturating exponential. 0 = never visited, 1 = deeply familiar.
      // Asymptotic τ chosen so 50 hours of total time → familiarity ≈ 0.5.
      // Approximation debt (habituation): τ=4320 min (72h) is conservative; no empirical
      // literature directly measures habituation floor as a function of cumulative exposure
      // across sessions. Direction from Groves & Thompson 1970 (habituation theory).
      location_familiarity: /** @type {Record<string, number>} */ ({}),

      // Job seeking
      job_seeking: false,   // true when actively searching for a new position
      interview_outcome: /** @type {'offer' | 'rejection' | 'callback' | null} */ (null), // clears after prose fires
      callback_pending: false,      // true between callback outcome and follow-up interview firing
      interview_is_followup: false, // set by world.js when firing a follow-up interview interrupt
      // Multiple simultaneous applications — up to 3 concurrent.
      // Each entry: { id, job_type, company_type, applied_at, status, offer? }
      // status: 'pending' | 'offer' | 'rejection'
      // company_type: 'small' | 'mid' | 'large'
      // offer (when status='offer'): { pay_rate, start_date }
      applications: /** @type {{ id: string, job_type: string, company_type: string, applied_at: number, status: string, offer?: { pay_rate: number, start_date: number } }[]} */ ([]),

      // Gig work — only relevant when labor_arrangement.type === 'gig'
      // available_gigs: jobs visible on the platform right now.
      // gig_active: accepted gig being carried out, or null.
      // gig_earnings_today / gig_hours_today: reset each midnight.
      // gig_deliveries_completed: lifetime counter for flavor prose.
      // last_gig_check: absolute game-time of last gig availability window check.
      available_gigs: /** @type {{ id: string, type: string, distance: number, pay: number, duration_min: number, expires_at: number }[]} */ ([]),
      gig_active: /** @type {{ id: string, type: string, distance: number, pay: number, duration_min: number, expires_at: number } | null} */ (null),
      gig_earnings_today: 0,
      gig_hours_today: 0,
      gig_deliveries_completed: 0,
      last_gig_check: 0,

      // Freelance work — only relevant when job_type === 'freelance'
      // Approximation debt (freelance): project complexity, client relationships, portfolio quality,
      // feast/famine income cycles, scope creep, revision rounds not modeled. Simplified to binary
      // project flag with linear progress.
      freelance_project_active: false,
      freelance_project_progress: 0,
      freelance_deadline: 0,
      freelance_projects_completed: 0,
      last_freelance_check: 0,

      // Informal/cash work — only relevant when job_type === 'informal'
      // Approximation debt (informal work): work type variation, employer relationships, seasonal
      // availability, word-of-mouth networks not modeled.
      day_work_available: false,
      day_work_completed_today: 0,
      day_work_last_reset: 0,

      // Constitutional perceptual traits
      // sensory_sensitivity: −1.0 (hyposensitive) to +1.0 (hypersensitive). 0 = typical.
      sensory_sensitivity: 0,
      // synesthesia: chromesthesia (sound → colour percepts).
      synesthesia: false,
      // apd: auditory processing disorder — parsing fails, detection intact.
      apd: false,

      // Sensory load — accumulated sensory stimulation (0–100).
      // Rises with NE, environmental noise, and sensory_sensitivity.
      // Falls in quiet environments and with high GABA.
      // Drives sensoryLoadTier() → interaction gating at overloaded/shutdown.
      sensory_load: 0,

      // connective_tissue_laxity: heritable continuous parameter (0–100) underlying pelvic floor dysfunction,
      // joint hypermobility, diastasis risk. h²=0.43 for prolapse (twin studies). Population distribution
      // approximated: triangular-ish centered at 50, SD ~18. hEDS is the extreme high end (laxity >= 88,
      // ~top 1–2%).
      connective_tissue_laxity: 50,
      // adhd: attention-deficit/hyperactivity disorder — executive dysfunction, time blindness, hyperfocus.
      // Affects initiation and attention structure; not capability.
      adhd: false,
      // autism: autism spectrum — sensory processing differences, masking cost, routine importance.
      autism: false,
      // special_interest: domain-specific high-dopamine focus, present only for autistic characters.
      // One of: 'nature', 'music', 'fiction', 'technology', 'science', 'craft', 'history', 'animals'.
      // null for non-autistic characters (no effect when null).
      special_interest: null,

      // masking_fatigue: accumulated cognitive cost of neurotypical performance (0–100).
      // Rises during social interactions at non-home locations for autistic/ADHD characters.
      // Rate scales with masking intensity (workplace > stranger > friend w/ deep connection).
      // Cleared by sleep. At high levels (>70), involuntary mask slippage in prose.
      // Hull 2017 DOI 10.1177/1362361316671012 (camouflaging as effortful, exhausting);
      // Cassidy 2018 PMID 30266004 (camouflaging and suicidality in autism).
      masking_fatigue: 0,

      // Constitutional mental health conditions — structural constraints on NT range.
      // These are configuration, not state. Once set at chargen, they persist for the run.
      // has_depression: major depression — serotonin floor raised, dopamine ceiling lowered.
      has_depression: false,
      // has_gad: generalized anxiety disorder — GABA ceiling lowered, cortisol floor raised.
      has_gad: false,
      // has_ptsd: post-traumatic stress disorder — NE baseline elevated, cortisol floor raised.
      has_ptsd: false,
      // has_bipolar: bipolar II — serotonin/dopamine targets oscillate on multi-week cycle.
      has_bipolar: false,
      // has_bariatric_surgery: reduces stomach_capacity to 15 (sleeve gastrectomy ~150ml).
      // Set via applyToState() from character.has_bariatric_surgery.
      has_bariatric_surgery: false,

      // Identity dimensions — structured pronoun sets, gender model, attraction profile.
      // pronoun_sets: PronounSet[] — structured pronoun objects (1 or 2 sets for mixed pronouns)
      pronoun_sets: null,
      // gender: GenderIdentity — continuous identity/expression dimensions
      gender: null,
      // attraction: AttractionProfile — split attraction model
      attraction: null,
      // hrt_active: boolean — whether currently on hormone replacement therapy
      hrt_active: false,
      // hrt_type: 'estradiol' | 'testosterone' | null — which HRT pathway
      hrt_type: null,
      // hrt_last_taken: game-time minutes of most recent HRT dose. 0 = never taken this run.
      hrt_last_taken: 0,
      // out_at_work: string[] — disclosed identity dimensions at workplace
      out_at_work: [],
      // out_to_family: string[] — disclosed identity dimensions to family
      out_to_family: [],
      // closet_energy_cost: pts/hr social_energy drain from identity concealment (computed each tick in advanceTime)
      closet_energy_cost: 0,
      // legal_name_changed: whether the character has completed a legal name change.
      // Defaults to false; set at chargen based on jurisdiction difficulty + age + economic_origin.
      // Set to true by file_name_change interaction. Does not affect displayed name (always chosen name).
      // Tracks the administrative weight of the legal gap — documents, official contexts, exposure.
      legal_name_changed: false,

      // race_ethnicity: character's racial/ethnic identity, set from chargen.
      // Used to drive code-switching fatigue for racial/ethnic minorities navigating white-dominant spaces.
      race_ethnicity: '',

      // code_switching_fatigue: 0–100. Cognitive/emotional cost of modulating speech, affect, and
      // self-presentation to fit white-dominant professional/social norms. Accumulates context-dependently
      // for non-white characters; 0 for white characters (no switching required in dominant-culture spaces).
      // Cleared by sleep. Feeds cortisol (hypervigilance) and serotonin (identity strain).
      // McCluney et al. 2021 — PMID unverified (code-switching as chronic stressor in Black professionals).
      // Approximation debt (code-switching): no ambulatory study provides pts/hr estimates.
      code_switching_fatigue: 0,

      // heds: hypermobile Ehlers-Danlos Syndrome — extreme high end of connective_tissue_laxity (~top 1–2%
      // of population; laxity >= 88 at chargen). Causes chronic diffuse pain, joint instability, fatigue.
      heds: false,
      // mcas: mast cell activation syndrome — comorbid with hEDS (~30–70%); inappropriate mast cell
      // activation causing allergic-type reactions (flushing, GI upset, itch) from varied triggers.
      mcas: false,
      // chronic_pain_level: 0–100 continuous diffuse pain; relevant when heds=true (hEDS baseline ~25),
      // but the variable exists for any future chronic pain source. 0 = no pain; 100 = severe.
      // Drifts toward hEDS baseline in advanceTime(); physical activity accelerates return.
      chronic_pain_level: 0,

      // Physical therapy — prescribed exercise for chronic pain / hEDS.
      // pt_session_count: total sessions completed (drives graduated pain/progress mechanic).
      // pt_last_session: game-time minutes of most recent PT session (0 = never done).
      pt_session_count: 0,
      pt_last_session: 0,

      // Injury history — injuries are first-class events with cause context.
      // Schema: { type: string, onset_time: number, severity: number, cause: string, resolved: boolean }
      // 'type' examples: 'dental_abscess', 'stress_fracture', 'levator_ani_avulsion', 'diastasis_recti',
      //   'sprained_ankle', 'back_strain', 'torn_ligament', 'concussion'
      // 'severity' 0–1: 0.2 mild, 0.5 moderate, 0.8 severe
      // 'cause' examples: 'vaginal_delivery', 'repetitive_strain', 'fall', 'overexertion'
      // 'resolved': false until the condition clears; healing over time is NOT stored here —
      //   use current character/body state for ongoing severity. This is the event record.
      injury_history: /** @type {Array<{ type: string, onset_time: number, severity: number, cause: string, resolved: boolean }>} */ ([]),
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
    // Approximation debt (gastric emptying): the 210 min half-life is chosen to represent the genomic pathway
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
    // Approximation debt (gastric emptying): the scaling coefficients (0.5 for NE, 0.3 for cortisol_gi_slow)
    // and baseline threshold (50) are chosen. At NE=100, cortisol_gi_slow=100 the factor
    // is 1.8× (not 2× — the coefficients sum to 0.8, giving 1.0+0.8=1.8 max). Not derived
    // from real GI physiology data. See TODO.md.
    // Approximation debt (gastric emptying): blending by stomach_liquid_fraction is a simplified linear mix.
    // Real stomachs partition contents heterogeneously; liquids float above solids and
    // drain through the pylorus preferentially. A full two-pool model would track separate
    // liquid and solid compartments, each with its own emptying curve. See TODO.md.
    const ne = s.norepinephrine;
    const cortGiSlow = s.cortisol_gi_slow;
    // Gastritis slows emptying: inflamed mucosa → impaired antral motility and pyloric delay.
    // Real: delayed gastric emptying (gastroparesis-spectrum) in ~30-40% of gastritis patients.
    // Ref: Approximation debt (gastritis): 1.3× multiplier chosen; no population-mean kinetic data for
    //   gastritis-associated delay. Direction from Parkman et al. 2004 AGA technical review on
    //   gastroparesis (PMID 15521026); 1.3× magnitude has no quantitative basis.
    const gastritisSlowFactor = s.health_conditions.includes('gastritis') ? 1.3 : 1.0; // Approximation debt (gastritis)
    const gastricSlowFactor = gastritisSlowFactor * (1
      + 0.5 * Math.max(0, Math.min(1, (ne - 50) / 50))
      + 0.3 * Math.max(0, Math.min(1, (cortGiSlow - 50) / 50)));
    const liqFrac = s.stomach_liquid_fraction || 0;
    const baseHalfLife = liqFrac * 25 + (1 - liqFrac) * 90;
    const gastricHalfLife = baseHalfLife * gastricSlowFactor;
    s.stomach_fullness = Math.max(0, s.stomach_fullness * Math.exp(-Math.LN2 / gastricHalfLife * minutes));
    // When stomach empties fully, reset liquid fraction
    if (s.stomach_fullness <= 0) s.stomach_liquid_fraction = 0;

    // Post-prandial hormonal satiation — exponential decay independent of stomach emptying.
    // Represents CCK, GLP-1, PYY persistence and ghrelin suppression after a meal.
    // Approximation debt (hormonal satiation): half-life 150 min (2.5h) is the midpoint of the physiological
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
    const stomachSuppression = s.stomach_fullness > 10 ? (s.stomach_fullness / s.stomach_capacity) * 0.85 : 0;
    // Hormonal satiation suppresses hunger independently of stomach volume (CCK, GLP-1, PYY)
    // Approximation debt (hormonal satiation): same 0.85 coefficient applied to hormonal_satiation as to stomach
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

    // Pantry perishable decay — eggs and bread expire if left too long.
    // Eggs: 21-day shelf life (30240 min). Real hard-boiled eggs spoil faster but
    // raw eggs in fridge last 3–5 weeks (FDA); 21 days conservative for unrefrigerated-adjacent model.
    // Approximation debt (pantry decay): 21-day threshold chosen; real shelf life depends on
    // storage conditions (fridge vs counter), egg age at purchase, and temperature.
    if (s.pantry && s.pantry.eggs > 0 && s.last_egg_purchase > 0) {
      if (s.time - s.last_egg_purchase > 30240) { // 21 days × 1440 min/day
        s.pantry = { ...s.pantry, eggs: 0 };
      }
    }
    // Bread: 7-day shelf life (10080 min). Real sliced bread lasts ~5–7 days at room temp.
    // Approximation debt (pantry decay): 7-day threshold chosen; 5–7 days is the standard
    // room-temperature range for sliced bread (FDA food safety guidance). Model does not
    // track refrigeration — cold storage extends life to ~2 weeks but causes staling.
    if (s.pantry && s.pantry.bread > 0 && s.last_bread_purchase > 0) {
      if (s.time - s.last_bread_purchase > 10080) { // 7 days × 1440 min/day
        s.pantry = { ...s.pantry, bread: 0 };
      }
    }

    // Fluid deficit accumulation — ml/hr.
    // Derived: resting insensible loss (skin + respiration) ~25ml/hr + minimum urine output ~40ml/hr
    // = ~65ml/hr total at rest. (Popkin et al. 2010, Nutr Rev, PMC2908954; Cheuvront & Kenefick 2014
    // DOI 10.1002/cphy.c130017). Approximation debt (bladder): body weight not tracked (70kg reference);
    // activity level and temperature not wired to rate — see TODO.md.
    let thirstRate = 65; // ml/hr
    // Caffeine mild diuresis: ~20–30% increase in urine output at typical doses, adding ~8–15ml/hr.
    // (Armstrong 2002 PMID 12187535: net negative fluid balance only at very high doses ≥250mg.)
    // Approximation debt (caffeine): linear scaling with caffeine_level; threshold 15 chosen.
    // At caffeine_level=15 (~15 mg model units), diuretic effect begins; at 100, adds +15 ml/hr.
    // Armstrong 2002 (PMID 12187535) reports net negative balance only at ≥250 mg/day;
    // threshold and scaling are model-internal, not derived from dose-response data.
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
    // Baseline ~40ml/hr awake = urine component of total 65ml/hr fluid loss (insensible ~25ml/hr not included).
    // (Popkin et al. 2010 PMC2908954; van Kerrebroeck et al. 2002 BJU Int 90:4)
    // During sleep: ADH (vasopressin) reduces output to ~10–20ml/hr (Rittig et al. 1989 PMID 2650290;
    // Asplund 1995 PMID 7627545). Using 15ml/hr (midpoint). Caffeine diuresis suppressed during sleep —
    // sleep architecture overrides pharmacological diuresis at normal doses. (Armstrong 2002 PMID 12187535)
    // Approximation debts (bladder): ADH concentration not modeled (real ADH depends on osmolarity/circadian phase);
    // fall-asleep delay also runs at sleep rate (minor — max 45min * 25ml/hr diff = ~19ml error);
    // cold diuresis not wired to temperature; stress-induced urgency not wired to fill rate.
    let urineRate;
    if (s.is_sleeping) {
      urineRate = 15; // ml/hr — ADH antidiuresis
    } else {
      urineRate = 40; // ml/hr — awake baseline
      if (s.caffeine_level > 15) urineRate += (s.caffeine_level - 15) / 85 * 15;
    }
    s.bladder_fill = s.bladder_fill + hours * urineRate + excessAbsorbed;

    // Energy drain — accelerated by hunger and dehydration
    // Approximation debt (energy drain): 3 pts/hr base energy drain is chosen. Real fatigue rate depends on
    // task load, circadian phase, physical demands — not a simple linear rate.
    // Hunger multipliers calibrated to sleep deprivation / caloric restriction literature:
    // moderate hunger (40-70): 1.1× — small, consistent with mild cognitive impairment only at
    // extreme restriction (Monk 1996 PMID 8877121); severe hunger (>70): 1.3× — moderate impairment
    // with glucose depletion (Gailliot & Baumeister 2007 PMID 17760605).
    const hungerDrainMultiplier = s.hunger > 70 ? 1.3 : s.hunger > 40 ? 1.1 : 1.0;
    // Mild dehydration accelerates fatigue. Effect smaller than hunger — dehydration at 1–2% body
    // water primarily impairs mood and cognition before energy (Ganio 2011 PMID 21736786).
    // Thresholds: 700ml = 1% deficit (thirst onset); 1400ml = 2% (cognitive/energy effects).
    // Approximation debt (energy drain): magnitudes 0.3/0.1 chosen; direction from Ganio 2011
    // (PMID 21736786) but individual dose-response coefficients not available from that source.
    // 0.3 pts/hr at severe dehydration is ~10% of the 3 pts/hr base drain — small, as intended.
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

    // Sensory load — drifts toward an environmental target based on location stimulation,
    // NE (sympathetic arousal amplifies sensory input), and sensory_sensitivity.
    // Recovery: GABA (inhibitory) and quiet environments pull load down.
    // Autism slows recovery (masking fatigue compounds load; real phenomenon per
    // Raymaker 2020 DOI 10.1177/1362361320925095 — autistic burnout from sustained masking).
    //
    // Model: load drifts toward a target via exponential approach.
    //   target = locationStim × (1 + NE_contribution + sensitivity_contribution)
    //   scaled to 0–100. Quiet locations with low NE → target near 0. Workplace with
    //   high NE and high sensitivity → target can exceed 100 (clamped).
    // Recovery rate modulated by GABA (higher GABA = faster decay) and autism (slower decay).
    //
    // Approximation debt (sensory load): drift rate 0.12/hr base chosen; no direct literature
    // for sensory load accumulation rates. Direction from SPD literature (Miller 2007
    // PMID 17715474 — sensory modulation disorder). Recovery rate 0.08/hr base chosen.
    // Autism recovery penalty 0.6× chosen; Raymaker 2020 documents recovery difficulty
    // but provides no quantitative time-course.
    {
      const stim = locationStimulationLevel();
      const neNorm = (s.norepinephrine - 25) / 63; // 0–1 across NE clamp range [25, 88]
      const sensSens = s.sensory_sensitivity; // −1 to +1
      const stressContrib = Math.max(0, (s.stress - 30) / 70) * 0.3; // stress above 30 adds up to 0.3

      // Target: environmental stimulation amplified by arousal and sensitivity
      const target = Math.min(100, stim * 100 * (1 + neNorm * 0.5 + sensSens * 0.4 + stressContrib));

      // Rate: asymmetric — accumulation is faster than recovery (same pattern as mood inertia)
      let rate;
      if (s.sensory_load < target) {
        // Accumulating — sensitive characters accumulate faster
        rate = 0.12 * (1 + Math.max(0, sensSens) * 0.5); // Approximation debt (sensory load): accumulation coefficient
      } else {
        // Recovering — GABA helps, autism hinders
        const gabaHelp = 1 + Math.max(0, (s.gaba - 40) / 60) * 0.5; // GABA above 40 aids recovery up to 1.5×
        const autismPenalty = s.autism ? 0.6 : 1.0; // Approximation debt (sensory load): autism recovery penalty
        rate = 0.08 * gabaHelp * autismPenalty; // Approximation debt (sensory load): recovery rate
      }

      // Exponential approach: load += (target - load) * (1 - exp(-rate * hours))
      s.sensory_load = clamp(
        s.sensory_load + (target - s.sensory_load) * (1 - Math.exp(-rate * hours)),
        0, 100
      );
    }

    // Sleep inertia clears exponentially; τ scales with sleep debt.
    // Jewett et al. 1999 (PMID 10188130): τ = 0.67h (40 min) for subjective alertness,
    // 1.17h (70 min) for cognitive performance; 2–4h to asymptote. We use the alertness
    // τ (40 min) since the game models felt grogginess, not test performance.
    // McCauley/Rajaraman (PMC6519907): chronic restriction extends inertia duration;
    // ~10% worse performance + prolonged dissipation. Debt scaling factor 1.5 gives
    // max τ = 40 × 2.5 = 100 min at extreme debt (4800), producing ~5h clearance at
    // worst case — conservative vs. McCauley’s observed extension.
    if (s.sleep_inertia > 0 && !s.is_sleeping) {
      const tau = 40 * (1 + 1.5 * (s.sleep_debt / 4800));
      s.sleep_inertia = s.sleep_inertia * Math.exp(-minutes / tau);
      if (s.sleep_inertia < 0.005) s.sleep_inertia = 0;
    }

    // Phone age and battery health degradation.
    // Exponential decay: health(t) = 100·exp(-t/τ), τ=10 years (see character.js).
    // Continuous update: health *= exp(-dt/τ). This is exact for the exponential model
    // regardless of time step size. Rate is proportional to current health — newer phones
    // lose capacity faster in absolute terms, matching real Li-ion combined aging.
    // Floor at 20 for extreme in-game aging (chargen floors at 50).
    // Approximation debt (phone aging): τ=10yr; see character.js for full debt note.
    s.phone_age_days += hours / 24;
    const tau = 10 * 365 * 24; // τ in hours (10 years)
    s.battery_health = Math.max(20, s.battery_health * Math.exp(-hours / tau));

    // Phone battery drains — screen-on vs standby. Cap at battery_health (degraded capacity).
    // Older phones drain faster: scale by 1 + age_years * 0.1 (5-year-old phone = 1.5×).
    // This captures the aggregate effect of OS bloat, background processes, and less efficient
    // radios on older hardware. The 0.1/year factor is a rough proxy — real drain increase
    // is discontinuous (jumps after major OS updates) and app-dependent.
    // Approximation debt (phone aging): drain scaling 0.1/year chosen; real driver is software
    // bloat relative to hardware capability, not calendar age per se.
    const phoneAgeYears = s.phone_age_days / 365;
    const ageDrainScale = 1 + phoneAgeYears * 0.1;
    const batteryDrain = (s.viewing_phone ? 15 : 1) * ageDrainScale;
    s.phone_battery = Math.max(0, Math.min(s.battery_health, s.phone_battery - hours * batteryDrain));

    // Daylight exposure — accumulates during astronomical daytime; faster when outside
    if (isDaytime()) {
      const area = ctx.world.getCurrentLocation()?.area;
      const outsideRate = (area === 'outside') ? 1.0 : 0.15;
      s.daylight_exposure = Math.min(300, s.daylight_exposure + minutes * outsideRate);
    }

    // Hygiene — decays 3 pts/hr. Approximation debt (hygiene): rate chosen; no literature basis.
    s.hygiene_level = Math.max(0, s.hygiene_level - hours * 3);

    // Clothing cleanliness — degrades only while dressed. Slower during sleep (less activity/sweat).
    // Approximation debt (clothing cleanliness): awake rate 3 pts/hr, sleep rate 1 pt/hr chosen.
    // Real-world accumulation depends on activity level, sweat, and fabric type; not modeled here.
    if (s.dressed) {
      const cleanRate = s.is_sleeping ? 1 : 3; // Approximation debt (clothing cleanliness):
      s.clothing_cleanliness = Math.max(0, s.clothing_cleanliness - hours * cleanRate);
    }

    // Appearance → job_standing drift during work hours.
    // Poor presentation at work accumulates slowly — a continuous background pressure,
    // not a single incident. Rate chosen as approximation; real literature on appearance
    // discrimination in workplaces exists but is population-level, not individual-rate.
    // Approximation debt (appearance): penalty rates (-0.12/hr notable, -0.25/hr severe) chosen.
    // Gig workers have no employer relationship → no job_standing mechanic applies.
    if (hasEmployer() && s.location === 'workplace' && isWorkHours()) {
      const app = appearanceAwareness();
      if (app === 'notable') {
        s.job_standing = Math.max(0, s.job_standing - hours * 0.12); // Approximation debt (appearance):
      } else if (app === 'severe') {
        s.job_standing = Math.max(0, s.job_standing - hours * 0.25); // Approximation debt (appearance):
      }
    }

    // Natural job_standing decay — precarity by job type.
    // Food service and retail have higher turnover and lower managerial tolerance than office work.
    // Decay only applies below 50 (precarity bites hardest when standing is already low).
    // Approximation debt (job standing): job type precarity multiplier chosen; food_service highest
    // turnover (BLS JOLTS ~75%/yr), retail moderate (~50%/yr), office lower (~20%/yr).
    // Base rate -0.03/hr chosen to produce ~half-point/day ambient drift — a background presence over weeks.
    // Gig workers have no job_standing — skip.
    if (hasEmployer() && s.job_standing < 50) {
      const jobType = ctx.character.get('job_type');
      const precarityMult = jobType === 'food_service' ? 1.3
                          : jobType === 'retail'        ? 1.2
                          :                              1.0;
      // Structural gender modifier — fem-read workers in food_service/retail face
      // a ceiling that masc-read workers don't. Same effort, slower advancement, faster
      // erosion. Keyed on perceivedPresentation(), not pronouns.
      // Approximation debt (structural discrimination): direction grounded in gender-based promotion
      // gaps in hourly service work (Blau & Kahn 2017 JEL DOI 10.1257/jel.20160995); 15%
      // multiplier is illustrative — no per-hour individual standing rate in the literature.
      let genderModifier = 1.0;
      if (perceivedPresentation() === 'fem_read' && (jobType === 'food_service' || jobType === 'retail')) {
        genderModifier = 1.15;
      }
      s.job_standing = Math.max(0, s.job_standing - hours * 0.03 * precarityMult * genderModifier);
    }

    // Coworker social influence → job_standing drift.
    // Warmth > irritation: coworkers informally cover for you, signal positively to management.
    // Irritation > warmth: coworkers undermine, withdraw support, signal negatively.
    // Aggregates across both coworker slots — average of available sentiment pairs.
    // Fires at full rate during work hours, 30% rate outside — social relationships
    // have ambient effects that persist beyond the shift itself.
    // Approximation debt (job standing): coworker social influence coefficient chosen; social dynamics
    // research doesn't directly yield numerical rates for informal advocacy effects on standing.
    // Approximation debt (job standing): coworker influence applies at reduced rate outside work hours.
    // Gig workers have no persistent coworkers → no job_standing influence.
    if (hasEmployer()) {
      const w1 = sentimentIntensity('coworker1', 'warmth');
      const i1 = sentimentIntensity('coworker1', 'irritation');
      const w2 = sentimentIntensity('coworker2', 'warmth');
      const i2 = sentimentIntensity('coworker2', 'irritation');
      const coworkerNetSentiment = ((w1 - i1) + (w2 - i2)) / 2;
      const atWorkRate = isWorkHours() ? 1.0 : 0.3;
      const socialInfluence = coworkerNetSentiment * 0.008 * hours * atWorkRate;
      s.job_standing = Math.max(0, Math.min(100, s.job_standing + socialInfluence));
    }

    // Skin condition — cold/dry outdoor air strips moisture. Only outdoors; only when cold.
    // Approximation debt (skin condition): threshold 10°C and rate -1.5/hr chosen. No humidity model.
    const area = ctx.world.getCurrentLocation()?.area;
    if (area === 'outside' && ambientTemperature() < 10) {
      s.skin_condition = Math.max(0, s.skin_condition - hours * 1.5);
    }

    // Extreme outdoor temperature — energy and NE effects when poorly dressed.
    // Freezing (<-5°C) and very hot (>35°C) apply continuous drain when outdoors with inadequate clothing.
    // These are small — texture effects for extended outdoor stays, not gameplay walls.
    // Approximation debt (temperature): cold exposure rates 0.5 energy/hr and 1 NE/hr chosen;
    // direction supported (thermoregulation increases sympathetic tone and energy expenditure),
    // magnitude is minimal to avoid penalizing exploration.
    if (area === 'outside') {
      const tempC = ambientTemperature();
      const warmth = ctx.clothing ? ctx.clothing.clothingWarmthLevel('cold') : 'light';
      const warmthHot = ctx.clothing ? ctx.clothing.clothingWarmthLevel('hot') : 'breathable';
      if (tempC < -5 && (warmth === 'minimal' || warmth === 'light')) {
        // Bitter cold — body thermoregulates hard; sympathetic activation + energy cost.
        // NE direction: Srámek et al. 2000 (PMID 10751106) measured 530% plasma NE rise during
        // cold water immersion (14°C), confirming cold → sympathetic activation pathway.
        // Magnitudes (0.5 energy/hr, 1 NE/hr) are model-internal; no published continuous-
        // exposure rate for ambulatory cold — kept minimal to avoid penalizing exploration.
        // Approximation debt (temperature): bitter cold energy drain 0.5/hr, NE 1/hr chosen;
        // direction from Srámek 2000 (PMID 10751106), magnitudes model-internal.
        s.energy = Math.max(0, s.energy - hours * 0.5);
        adjustNT('norepinephrine', hours * 1);
      } else if (tempC >= -5 && tempC < 5 && warmth === 'minimal') {
        // Freezing without outerwear or full coverage — meaningful cold exposure, milder tier.
        // Same direction as above (sympathetic activation, thermoregulatory energy cost);
        // 0.3/hr chosen as roughly half the bitter-cold rate — model-internal scaling.
        // Approximation debt (temperature): freezing without coverage energy drain 0.3/hr chosen;
        // direction from Srámek 2000 (PMID 10751106), magnitude model-internal.
        s.energy = Math.max(0, s.energy - hours * 0.3);
      } else if (tempC > 35 && warmthHot === 'heavy') {
        // Very hot and overdressed — extra fluid loss and energy cost.
        // Thermoregulatory sweating increases fluid loss; exercise-heat physiology documents
        // >1 L/hr at high work rate in heat (González-Alonso 2008, J Physiol) — passive
        // overdressed exposure is far less; 50 ml/hr is well below that ceiling.
        // Approximation debt (temperature): overdressed in heat thirst +50ml/hr, energy 0.3/hr chosen;
        // direction from thermoregulation physiology, magnitudes model-internal (no PMID for passive rate).
        s.thirst = s.thirst + hours * 50;
        s.energy = Math.max(0, s.energy - hours * 0.3);
      }
    }

    // Caffeine metabolism — half-life ~5 hours (300 min).
    // Confirmed: Grzegorzewski et al. 2022 systematic analysis of 141 studies reports
    // mean t½ ~5h (range 1.5–9.5h) in healthy adults (PMID 35280254, PMC8914174).
    // Arnaud 1993 review cites similar range. 300 min is a reasonable population mean.
    if (s.caffeine_level > 0) {
      s.caffeine_level = Math.max(0, s.caffeine_level * Math.exp(-Math.LN2 / 300 * minutes));
    }

    // Nicotine metabolism — half-life ~2 hours (120 min)
    // (Benowitz 2010 PMID 19948210: mean plasma t½ 2h; cotinine t½ ~16h not modeled here —
    // nicotine_level tracks the pharmacologically active fraction only.)
    if (s.nicotine_level > 0) {
      s.nicotine_level = Math.max(0, s.nicotine_level * Math.exp(-Math.LN2 / 120 * minutes));
    }

    // Cleaning smell decay — τ=90 min (half-life ~62 min).
    // Soap and shampoo smell is sharp at first and fades within 1–2 hours.
    // No empirical citation — perceptual half-life of fragrance persistence.
    // Zero out below 1 to avoid an indefinite tail.
    if (s.cleaning_smell_intensity > 0) {
      s.cleaning_smell_intensity = s.cleaning_smell_intensity * Math.exp(-minutes / 90);
      if (s.cleaning_smell_intensity < 1) s.cleaning_smell_intensity = 0;
    }

    // Coffee smell decay — τ=60 min (half-life ~42 min).
    // Coffee aroma is volatile; fades within ~1.5 hours after brewing.
    if (s.coffee_smell_intensity > 0) {
      s.coffee_smell_intensity = s.coffee_smell_intensity * Math.exp(-minutes / 60);
      if (s.coffee_smell_intensity < 1) s.coffee_smell_intensity = 0;
    }

    // Food smell decay — τ=120 min (half-life ~83 min).
    // Cooking odors linger longer than coffee or soap — hours in a small space.
    if (s.food_smell_intensity > 0) {
      s.food_smell_intensity = s.food_smell_intensity * Math.exp(-minutes / 120);
      if (s.food_smell_intensity < 1) s.food_smell_intensity = 0;
    }

    // Alcohol metabolism — zero-order kinetics (linear, not exponential).
    // BAC declines at a flat rate regardless of current level (ADH enzyme saturation).
    // Approximation debt (alcohol): ~15 BAC-units/hr corresponds to ~1 standard drink/hr.
    // Real rate varies 10–20 mg%/hr for social drinkers; 25–35 mg%/hr in alcoholics (CYP2E1 induction).
    // Jones review (Alcohol Alcohol 1993) reports average ~15 mg%/hr for moderate drinkers.
    // Ref: Holford 1987 (PMID 3319346) zero-order elimination model.
    if (s.alcohol_level > 0) {
      // Tolerance slightly speeds metabolism (enzyme induction).
      // Approximation debt (alcohol): 15 + tolerance*0.05 chosen; real CYP2E1 induction increases elimination
      // 2–10× enzyme activity (Oneta et al. 2002 PMID 11804663); alcoholics may reach 25–35 mg%/hr.
      // At tolerance=100 this formula gives 20 units/hr (~33% increase) — within the observed range but
      // underpredicts the upper end for severely alcohol-dependent individuals.
      const elimRate = 15 + s.alcohol_tolerance * 0.05;
      s.alcohol_level = Math.max(0, s.alcohol_level - elimRate * hours);
    }

    // Alcohol acute NT effects — dose-dependent, driven by alcohol_level.
    // These are direct adjustNT calls (bypassing drift), representing acute pharmacological action.
    if (s.alcohol_level > 0) {
      const al = s.alcohol_level;
      const tolFrac = s.alcohol_tolerance / 100;
      // Effective level is tolerance-reduced — chronic users need more for same effect.
      // Approximation debt (alcohol): tolerance reduction 0.35× at full tolerance chosen.
      // Tolerance is primarily functional (neuroadaptation), not pharmacokinetic — experienced drinkers
      // feel less impaired at the same BAC. No published dose-response curve maps tolerance to
      // felt-effect reduction magnitude; individual-level data does not exist.
      const effectiveAl = al * (1 - 0.35 * tolFrac);

      if (effectiveAl < 25) {
        // Low dose: the push — GABA up, NE mild down, DA up, 5HT up slight.
        // Approximation debt (alcohol): all coefficients below chosen; direction from Valenzuela 1997 (PMID 15704351
        // — confirmed: "Alcohol and neurotransmitter interactions," Alcohol Health Res World 21(2):144-8).
        // No individual-level dose-response curves map NT unit changes to BAC for these coefficients.
        adjustNT('gaba', effectiveAl / 25 * hours * 3.0);
        adjustNT('norepinephrine', -(effectiveAl / 25) * hours * 1.5);
        adjustNT('dopamine', effectiveAl / 25 * hours * 2.5);
        adjustNT('serotonin', effectiveAl / 25 * hours * 1.0);
      } else if (effectiveAl < 50) {
        // Medium dose: plateau — GABA up further, DA stalls, NE suppressed.
        // Approximation debt (alcohol): coefficients chosen; no published per-unit dose-response
        // curves for NT changes at medium-dose alcohol; direction from Valenzuela 1997 (PMID 15704351).
        adjustNT('gaba', hours * 3.5);
        adjustNT('norepinephrine', -hours * 2.0);
        adjustNT('dopamine', hours * 0.5);
        adjustNT('serotonin', hours * 0.5);
      } else {
        // High dose: cost — GABA maxed, DA crashing, NE suppressed, adenosine floods.
        // The sedation mechanism: adenosine accumulation accelerates.
        // Approximation debt (alcohol): coefficients chosen; adenosine acceleration at +4/hr chosen.
        // High-dose dopamine crash and NE suppression are direction-confirmed (Valenzuela 1997 PMID 15704351);
        // magnitudes have no individual-level empirical basis.
        adjustNT('gaba', hours * 2.0);   // still high but leveling off
        adjustNT('norepinephrine', -hours * 3.0);
        adjustNT('dopamine', -hours * 3.5);  // crash
        adjustNT('serotonin', -hours * 1.5); // disruption
        s.adenosine = clamp(s.adenosine + hours * 4.0, 0, 100);
      }
    }

    // Alcohol post-acute rebound — after alcohol clears, compensated brain is exposed.
    // GABA-A downregulation + NMDA upregulation = hyper-excitability. NE rebound.
    // Hangover neurological component: worse anxiety than pre-drink baseline.
    // Withdrawal is derived from GABA baseline deficit: the elevated gaba_baseline (set by
    // chronic use via tolerance-tracking) leaves GABA below its adapted setpoint after clearance.
    // Ref: Jesse et al. 2017 (PMID 27586815); Schuckit 2014 (PMID 25427113).
    {
      // Derived withdrawal depth: GABA deficit relative to baseline.
      // Normalize by 50 (realistic max deficit) → fraction in [0,1].
      // Approximation debt (nt-baseline): deficit normalization ceiling 50 chosen; this is an
      // internal model parameter (gaba_baseline starts at 50 and the maximum physiologically
      // plausible elevation is ~50 pts = tolerance at severe dependence). No external literature
      // grounds this ceiling — it follows from the model's own scale, not from published data.
      const gabaDeficit = Math.max(0, s.gaba_baseline - s.gaba);
      const wFrac = Math.min(1, gabaDeficit / 50);
      // Dependence depth: how far gaba_baseline has risen above the fresh-character value of 50.
      // This replaces alcohol_tolerance / 100 for NT-effect scaling purposes — chronic use that
      // raises gaba_baseline IS the physiological adaptation that makes withdrawal dangerous.
      // Approximation debt (nt-baseline): fresh-character gaba_baseline reference 50 chosen;
      // this is an internal model constant (baseline starts at 50 for a non-dependent character).
      const gabaBaselineElevation = Math.max(0, s.gaba_baseline - 50); // 0-50 range
      const hFrac = gabaBaselineElevation / 50; // normalize to [0,1]
      const alcTaper = taperingFactor('alcohol');

      if (s.alcohol_level === 0 && wFrac > 0 && gabaBaselineElevation > 0) {
        // Post-acute rebound NT effects — scale with GABA deficit depth.
        // Gate requires gabaBaselineElevation > 0: rebound only applies to characters whose
        // GABA baseline has actually risen from chronic alcohol use. A character who has never
        // drunk alcohol has baseline=50 (elevation=0) — their GABA deficit (from stress, illness,
        // etc.) has a different cause and should not trigger alcohol-specific rebound effects.
        // Approximation debt (alcohol): coefficients chosen; direction from Jesse et al. 2017 (PMID 27586815
        // — confirmed: "Alcohol withdrawal syndrome: mechanisms, manifestations, and management,"
        // Acta Neurol Scand 135(1):4-16). No per-unit dose-response curves for post-acute rebound NT effects.
        adjustNT('gaba', -(wFrac * hours * 4.0) * alcTaper);        // GABA rebound — below pre-drink baseline
        adjustNT('norepinephrine', wFrac * hours * 3.5 * alcTaper); // NE rebound — anxiety, hyperarousal
        adjustNT('serotonin', -(wFrac * hFrac * hours * 2.0) * alcTaper); // 5HT below baseline (hangover misery)
      }

      // Alcohol withdrawal effects — fires when gaba_baseline shows meaningful elevation
      // (physiological dependence has developed) and alcohol is absent.
      // Approximation debt (nt-baseline): gaba_baseline elevation threshold 15pts chosen;
      // corresponds to old alcohol_tolerance > 30 gate via proxy relationship. Clinical
      // literature (Jesse 2017 PMID 27586815; Schuckit 2014 PMID 25427113) establishes that
      // withdrawal requiring medical management occurs at significant physiological dependence,
      // but no published data maps GABA baseline elevation to an alcohol dependence severity
      // score. Threshold 15 is a model-internal choice.
      if (gabaBaselineElevation > 15) {
        if (s.alcohol_level < 5) {
          // Nausea at moderate+ withdrawal (acetaldehyde residue + GI GABA receptors).
          // Approximation debt (alcohol): deficit threshold (wFrac > 0.4) and rate 3 pts/hr chosen.
          // Approximation debt (nt-baseline): nausea gate gaba_baseline elevation > 25 chosen;
          // corresponds to old alcohol_tolerance > 50. Clinical observation is that nausea and
          // vomiting appear at moderate-to-severe withdrawal (CIWA-Ar nausea item present at
          // clinical withdrawal; Jesse 2017 PMID 27586815), but no published data maps a GABA
          // elevation value to onset of nausea. Threshold 25 is a model-internal choice.
          if (wFrac > 0.4 && gabaBaselineElevation > 25) {
            const nauseaRate = ((wFrac - 0.4) / 0.6) * hFrac * 3 * alcTaper;
            s.nausea = Math.min(100, s.nausea + nauseaRate * hours);
          }

          // Dangerous withdrawal territory (DT-zone) — high GABA deficit + high baseline elevation.
          // wFrac > 0.7 (~35pt GABA deficit) + gaba_baseline > 82.5 = delirium tremens territory.
          // (gaba_baseline > 82.5 corresponds to the prior alcohol_tolerance > 65 gate:
          // gabaBaselineElevation > 32.5 → gaba_baseline > 82.5.)
          // Seizure risk, autonomic instability, perceptual disturbance. Modeled via NT state;
          // no discrete seizure mechanic yet. Do not suppress this pathway.
          // Ref: Jesse et al. 2017 (PMID 27586815); Schuckit 2014 (PMID 25427113).
          // Approximation debt (nt-baseline): DT threshold wFrac > 0.7 and baseline elevation > 32.5
          // chosen; no published data maps GABA deficit fractions to delirium tremens onset risk.
          // Clinical literature (Jesse 2017 PMID 27586815; Schuckit 2014 PMID 25427113) identifies
          // DT risk factors (chronic heavy use, prior withdrawal seizures, CIWA-Ar > 15), but these
          // do not translate to model-internal GABA values. Both thresholds are model-internal choices
          // calibrated so that DT-zone is hard to reach for casual drinkers.
          if (wFrac > 0.7 && gabaBaselineElevation > 32.5) {
            // Massive NE spike — autonomic instability
            // Approximation debt (alcohol): DT neurological effects — direction correct, magnitudes approximate
            adjustNT('norepinephrine', hours * 12 * alcTaper);
            adjustNT('gaba', -hours * 8 * alcTaper);   // GABA severely suppressed
            adjustNT('cortisol', hours * 10 * alcTaper); // cortisol surge — physiological stress response
            s.nausea = Math.min(100, s.nausea + hours * 5 * alcTaper);
            s.stress = clamp(s.stress + hours * 10 * alcTaper, 0, 100);
            s.tremor_active = true;
          } else if (wFrac > 0.8 && gabaBaselineElevation > 25) {
            // Severe withdrawal below DT threshold — still bad, but below seizure territory
            // Approximation debt (alcohol): DT neurological effects — direction correct, magnitudes approximate
            adjustNT('norepinephrine', hours * 6 * alcTaper);
            adjustNT('gaba', -hours * 4 * alcTaper);
            s.nausea = Math.min(100, s.nausea + hours * 3 * alcTaper);
            s.stress = clamp(s.stress + hours * 5 * alcTaper, 0, 100);
          }

          // Clear tremor when deficit drops back below threshold
          // Approximation debt (nt-baseline): tremor-clear threshold wFrac < 0.5 chosen;
          // no published data maps a GABA deficit fraction to tremor onset or resolution in
          // alcohol withdrawal. Clinical literature notes tremor among the first withdrawal
          // symptoms and one of the last to resolve (Jesse 2017 PMID 27586815), but this does
          // not translate to a model-internal GABA threshold. Value is a model-internal choice.
          if (s.tremor_active && wFrac < 0.5) {
            s.tremor_active = false;
          }
        } else if (s.alcohol_level >= 20) {
          // Alcohol present — suppresses tremor (the relief of continued drinking).
          // GABA deficit naturally closes as alcohol raises GABA via acute effects above.
          if (s.tremor_active) {
            s.tremor_active = false;
          }
        }
      }
    }

    // Cannabis metabolism — exponential (first-order), decay constant set to produce ~2-3h subjective window.
    // Ref: Huestis 2007 (PMID 17712819 — confirmed: "Human cannabinoid pharmacokinetics," Chem Biodivers 4:1770-1804).
    // Approximation debt (cannabis): t½ 90min chosen as a model parameter, not a pharmacokinetic t½.
    // Real THC plasma t½ is 20–30 min (rapid redistribution phase) or 1–3 days (terminal elimination from fat).
    // Subjective effects last 2–4h after smoking (peak at 10–30 min, declining through 2h). The 90min
    // parameter fits the rate at which the felt high declines from peak toward baseline in the simulation.
    if (s.cannabis_level > 0) {
      s.cannabis_level = Math.max(0, s.cannabis_level * Math.exp(-Math.LN2 / 90 * minutes));
    }

    // Cannabis acute NT effects — dose-dependent, driven by cannabis_level.
    // Mechanism: CB1 agonism at mesolimbic synapses → indirect dopamine release (reward circuit).
    // GABA: mild modulation via presynaptic CB1 inhibition of inhibitory interneurons (indirect,
    // distinct from alcohol's direct GABA-A allosteric modulation).
    // Emotional blunting: the key phenomenological effect. Modeled by compressing drift toward
    // extremes — cannabis_level reduces the effective distance between current NT level and target.
    // High dose: anxiety induction (NE ↑, GABA overwhelmed), dissociation quality.
    // Ref: Bhattacharyya et al. 2010 (PMID 20231922 — CB1 and DA/5HT interactions).
    if (s.cannabis_level > 0) {
      const cl = s.cannabis_level;
      const tolFrac = s.cannabis_tolerance / 100;
      // Tolerance reduces acute effect — chronic users need more for same subjective high.
      // CB1 receptor downregulation in chronic daily users: 15–20% reduction in receptor
      // availability (Hirvonen 2012 PMID 21747398 — PET study, N=30 daily smokers).
      // 20% max reduction at full tolerance (tolerance=100) is the literature-supported ceiling.
      // Previously 30% — corrected downward to match Hirvonen's measured receptor reduction.
      const effectiveCl = cl * (1 - 0.20 * tolFrac);

      // Dopamine: mesolimbic release — moderate boost. THC stimulates mesolimbic DA neuron
      // firing and elevates striatal DA; effect is modest (~15% BP reduction in PET studies)
      // and weaker than stimulants.
      // Approximation debt (cannabis): coefficient 4.0 pts/unit/hr chosen; direction from
      // Bhattacharyya 2010 (PMID 19924114 — confirmed: "Opposite effects of Δ-9-THC and CBD on human
      // brain function," Neuropsychopharmacology 35:764-74). Acute THC DA release in humans is modest —
      // ~3-5% striatal displacement in PET (Volkow 2014 PMID 25024177 — confirmed: "Decreased dopamine
      // brain reactivity in marijuana abusers," PNAS 111(30):E3149-56). Magnitude has no
      // individual-level empirical basis; no per-unit dose-response curve exists.
      adjustNT('dopamine', effectiveCl / 100 * hours * 4.0);

      // GABA: complex dose-dependent effect — presynaptic CB1 on GABAergic terminals is
      // inhibitory (disinhibition → less GABA → more NE/DA at low dose), but CB1 on
      // excitatory terminals also inhibits glutamate. Net low-dose effect: mild anxiolytic
      // (GABA-like feel) via reduction of cortical overactivation. GABA deficits worsen
      // THC psychotomimetic effects (Bhattacharyya 2010 PMID 19924114). Direction: mild
      // net GABA-like softening at low dose is supported; mechanism is indirect.
      // Approximation debt (cannabis): coefficient 2.5 pts/unit/hr chosen; indirect mechanism
      // means effect is weaker and more variable than alcohol. Direction from Bhattacharyya 2010
      // (PMID 19924114). No published per-unit dose-response curves for GABA changes with acute THC.
      adjustNT('gaba', effectiveCl / 100 * hours * 2.5);

      if (effectiveCl < 40) {
        // Low dose: NE mild decrease (anxiolytic sympathetic dampening), serotonin mild modulation.
        // THC acutely reduces amygdala reactivity to threat signals via CB1 in basolateral
        // amygdala — consistent with NE dampening at low doses. Direction from
        // Bhattacharyya 2010 (PMID 19924114). 5HT1A involvement is via CBD, not THC — "Stringer 2013
        // PMID 24273617" was an incorrect citation (that PMID is a dental occlusion paper).
        // THC serotonin effects are indirect and variable; no verified per-unit dose-response exists.
        // NE release via disinhibition is documented (local CB1 administration increases
        // NE efflux — PMC2701365), but net systemic low-dose effect is mild dampening.
        // Approximation debt (cannabis): all low-dose coefficients chosen; direction from
        // Bhattacharyya 2010 (PMID 19924114). NE coefficient −1.0, serotonin +0.5 pts/unit/hr chosen;
        // direction supported but magnitude unconstrained at individual level.
        adjustNT('norepinephrine', -(effectiveCl / 40) * hours * 1.0);
        adjustNT('serotonin', effectiveCl / 40 * hours * 0.5);
        // Adenosine: mild accumulation (increases sleepiness at low dose).
        // Approximation debt (cannabis): coefficient 0.5 pts/hr at full low dose chosen;
        // CB1-adenosine crosstalk documented (Martire 2011 PMID 21062287 — confirmed: "Pre-synaptic
        // adenosine A2A receptors control cannabinoid CB1 receptor-mediated inhibition of striatal
        // glutamatergic neurotransmission," J Neurochem 116(2):273-80) but no per-unit magnitude
        // data exists at physiological THC doses.
        s.adenosine = clamp(s.adenosine + (effectiveCl / 40) * hours * 0.5, 0, 100);
      } else {
        // High dose (effectiveCl ≥ 40): anxiety induction — NE ↑, GABA effect overwhelmed.
        // Approximation debt (cannabis): high-dose NE threshold 40 and coefficient 1.5 chosen.
        // Anxiogenic shift at high THC doses is dose-dependent and direction-confirmed (Bhattacharyya
        // 2010 PMID 19924114); threshold (40 of 100 cannabis units) and coefficient have no empirical
        // per-unit basis. No published dose-response curve maps cannabis_level to NE change rate.
        adjustNT('norepinephrine', ((effectiveCl - 40) / 60) * hours * 1.5);
        // Adenosine: more accumulation at high dose (sedation/dissociation quality).
        // Approximation debt (cannabis): coefficient 1.0 pts/hr chosen; CB1-adenosine crosstalk
        // confirmed (Martire 2011 PMID 21062287) but no per-unit dose-response data exists at
        // physiological THC doses. High-dose value larger than low-dose (1.0 vs 0.5) is qualitative.
        s.adenosine = clamp(s.adenosine + ((effectiveCl - 40) / 60) * hours * 1.0, 0, 100);
      }
    }

    // Cannabis emotional blunting is handled in driftNeurochemistry() via target compression.
    // See the bluntingFactor computation in that function.

    // Cannabis withdrawal — derived from DA baseline deficit when cannabis is absent.
    // No accumulator: the NT deficit IS withdrawal. Mild relative to nicotine/alcohol —
    // no medical danger. Character: irritability (less sharp than nicotine), appetite disruption,
    // sleep disruption (rebound REM — vivid dreams). The slow kinetics of cannabis (t½ 90min
    // but CB1 downregulation persists for weeks) mean baseline elevation is modest but real.
    // Real onset: 1–3 days of abstinence. Real peak: days 2–6. Duration: 4–14 days.
    // Ref: Budney et al. 2003 (PMID 12943018 — confirmed: "The time course and significance of
    // cannabis withdrawal," J Abnorm Psychol 112(3):393-402); Schlienz et al. 2017 (PMID 29057200 —
    // confirmed: "Cannabis Withdrawal: A Review of Neurobiological Mechanisms and Sex Differences,"
    // Curr Addict Rep 4(2):75-81).
    if (s.cannabis_tolerance > 20 && s.cannabis_level < 10) {
      // Derived withdrawal depth: DA deficit relative to baseline.
      // Normalize by 50 (realistic max deficit) → fraction in [0,1].
      // Approximation debt (nt-baseline): deficit normalization ceiling 50 chosen; internal model
      // parameter (dopamine_baseline starts at 50 and maximum plausible elevation is ~50 pts
      // at severe cannabis dependence). No external literature grounds this ceiling.
      const daDeficit = Math.max(0, s.dopamine_baseline - s.dopamine);
      const wFrac = Math.min(1, daDeficit / 50);

      if (wFrac > 0) {
        // Withdrawal NT effects — mild irritability, flat affect, mild NE elevation.
        // Approximation debt (cannabis): all coefficients chosen; direction from Budney 2003
        // (PMID 12943018 — confirmed: irritability, GABA/NE shifts implied by symptom profile) and
        // Schlienz 2017 (PMID 29057200 — confirmed: CB1 downregulation → reduced mesolimbic tone).
        // No per-unit dose-response curves for NT changes during cannabis withdrawal exist.
        adjustNT('norepinephrine', wFrac * hours * 1.5);
        adjustNT('gaba', -(wFrac * hours * 1.5));
        // Dopamine below baseline in heavy users (CB1 downregulation → reduced mesolimbic tone).
        // Only bites at high tolerance — mirrors nicotine sub-baseline DA. Reduced DA reactivity
        // in heavy users confirmed (Volkow 2014 PMID 25024177 — blunted DA response to challenge).
        // Approximation debt (cannabis): DA penalty threshold tolerance=60, coefficient −2 chosen.
        // Heavy cannabis users show lower striatal dopamine synthesis/release capacity vs controls
        // (Volkow 2014 PMID 25024177; direction-confirmed in human PET). Per-unit magnitude has no empirical basis.
        if (s.cannabis_tolerance > 60) {
          const hFrac = s.cannabis_tolerance / 100;
          adjustNT('dopamine', -(wFrac * hFrac) * hours * 2.0);
        }
      }
    }

    // Opioid metabolism — first-order elimination, t½ ~4h (240 min) for short-acting formulations.
    // Ref: Trescot et al. 2008 (PMID 18443637 — opioid pharmacology review, pharmacokinetics).
    // Approximation debt (opioids): t½ 240min; published range from FDA prescribing labels:
    // hydrocodone t½ ~3.8h, oxycodone t½ ~3.2–4.5h, codeine t½ ~2.9h.
    // 240min (4h) is a defensible population-average for short-acting mu-agonists.
    if (s.opioid_level > 0) {
      s.opioid_level = Math.max(0, s.opioid_level * Math.exp(-Math.LN2 / 240 * minutes));
    }

    // Opioid acute NT effects — dose-dependent, driven by opioid_level.
    // Primary: endorphin system activation (mu-opioid receptor agonism).
    // Secondary: indirect dopamine release via VTA GABA interneuron suppression.
    // Tertiary: mild GABA modulation (anxiolysis), mild serotonin (mood).
    // Pain suppression: modeled via chronic_pain_level reduction.
    // Ref: Trescot et al. 2008 (PMID 18443637 — opioid pharmacology); Kosten & George 2002 (PMID 18567959).
    if (s.opioid_level > 0) {
      const ol = s.opioid_level;
      const tolFrac = s.opioid_tolerance / 100;
      // Tolerance reduces acute effect — mu-opioid receptor desensitization.
      // Approximation debt (opioids): tolerance reduction 0.45× at full tolerance chosen;
      // real desensitization requires >80% loss of functional MOR to account for tolerance
      // (Williams et al. 2013 PMID 23321159 — mu-opioid receptor desensitization mechanisms).
      // Magnitude 0.45 is conservative; no individual-level coefficient data exists.
      const effectiveOl = ol * (1 - 0.45 * tolFrac);

      // Endorphin: primary target — massive endogenous opioid system activation.
      // Approximation debt (opioids): coefficient 0.08 pts/unit/hr chosen; direction well-supported
      // (exogenous opioids displace/supplement endogenous mu-opioid system); no individual-level
      // magnitude data exists for simulation-unit coefficients.
      adjustNT('endorphin', effectiveOl / 100 * hours * 8.0);
      // Dopamine: indirect release via VTA disinhibition. Strong reward signal.
      // Approximation debt (opioids): coefficient 0.05 pts/unit/hr chosen;
      // direction from Di Chiara & Imperato 1988 (PMID 2899326 — DA release in nucleus accumbens);
      // no individual-level magnitude data exists for simulation-unit coefficients.
      adjustNT('dopamine', effectiveOl / 100 * hours * 5.0);
      // GABA: mild anxiolytic effect via indirect modulation.
      // Approximation debt (opioids): coefficient 0.02 pts/unit/hr chosen; direction well-supported
      // (opioids produce anxiolysis clinically); no individual-level magnitude data exists.
      adjustNT('gaba', effectiveOl / 100 * hours * 2.0);
      // Serotonin: mild mood elevation.
      // Approximation debt (opioids): coefficient 0.015 pts/unit/hr chosen; direction plausible
      // (opioids produce euphoria/mood elevation clinically); no individual-level magnitude data exists.
      adjustNT('serotonin', effectiveOl / 100 * hours * 1.5);
      // NE suppression: opioids depress locus coeruleus firing → reduced NE.
      // This is the mechanism behind the "calm" — and the NE rebound in withdrawal.
      // Approximation debt (opioids): coefficient -0.03 pts/unit/hr chosen;
      // direction from Aghajanian 1978 (PMID 216919 — LC tolerance to morphine, clonidine suppression);
      // no individual-level magnitude data exists.
      adjustNT('norepinephrine', -(effectiveOl / 100) * hours * 3.0);
      // Adenosine: mild sedation signal.
      // Approximation debt (opioids): coefficient 0.01 chosen; sedation is clinically observed
      // but no data links opioids to adenosine accumulation specifically; mechanistic basis uncertain.
      s.adenosine = clamp(s.adenosine + effectiveOl / 100 * hours * 1.0, 0, 100);

      // Pain suppression: opioid level reduces chronic_pain_level.
      // Only relevant for characters with chronic pain.
      // Approximation debt (opioids): pain reduction rate 0.06 pts/unit/hr chosen; direction
      // well-supported (opioids are first-line for moderate-severe pain); no individual-level
      // simulation-unit magnitude data exists.
      if (s.chronic_pain_level > 0) {
        s.chronic_pain_level = Math.max(0,
          s.chronic_pain_level - effectiveOl / 100 * hours * 6.0);
      }
      // Also suppresses dental ache and gastritis pain.
      if (s.dental_ache > 0) {
        s.dental_ache = Math.max(0, s.dental_ache - effectiveOl / 100 * hours * 5.0);
      }
      if (s.gastritis_pain > 0) {
        s.gastritis_pain = Math.max(0, s.gastritis_pain - effectiveOl / 100 * hours * 3.0);
      }
      // Nausea — opioids cause nausea especially in opioid-naive patients.
      // Mediated via chemoreceptor trigger zone (CTZ) mu-opioid receptors.
      // Tolerance develops to this side effect, so naive users get more nausea.
      // Approximation debt (opioids): nausea coefficient chosen; direction from
      // Nicholson 2016 (PMID 27690715 — CTZ mu-opioid receptor activation in OINV);
      // tolerance-to-nausea direction supported clinically; no magnitude data exists.
      if (tolFrac < 0.3 && effectiveOl > 20) {
        const nauseaRate = (1 - tolFrac / 0.3) * (effectiveOl - 20) / 80 * 2.0;
        s.nausea = Math.min(100, s.nausea + nauseaRate * hours);
      }
    }

    // Opioid withdrawal — derived from endorphin deficit when opioid is absent.
    // Opioid withdrawal is more severe than nicotine or cannabis — flu-like syndrome,
    // pain amplification (opioid-induced hyperalgesia), severe anxiety/dysphoria,
    // GI distress, insomnia. Not medically dangerous (unlike alcohol) but extremely aversive.
    // Onset: 8–12h after last short-acting dose. Peak: 36–72h. Duration: 5–10 days.
    // Ref: Kosten & George 2002 (PMID 18567959 — neurobiology of opioid dependence).
    if (s.opioid_tolerance > 15 && s.opioid_level < 10) {
      // Derived withdrawal depth: endorphin deficit relative to baseline.
      // Normalize by 50 (realistic max deficit) → fraction in [0,1].
      // Approximation debt (nt-baseline): deficit normalization ceiling 50 chosen; internal model
      // parameter (endorphin_baseline placeholder is 45 and max plausible elevation under chronic
      // opioid use is ~50 pts). No external literature grounds this ceiling — it follows from the
      // model's own scale, parallel to the GABA ceiling used in alcohol withdrawal above.
      const endoDeficit = Math.max(0, 45 - s.endorphin); // 45 = endorphin init value (placeholder baseline)
      const wFrac = Math.min(1, endoDeficit / 50);
      const hFrac = s.opioid_tolerance / 100;

      if (wFrac > 0) {
        // NE rebound — locus coeruleus hyperactivity. This is the primary withdrawal mechanism.
        // The LC was suppressed by opioids; now it fires unchecked (glutamate disinhibition
        // mechanism: Van Bockstaele et al. 2001 PMID 11817217; Aghajanian 1978 PMID 216919).
        // Approximation debt (opioids): NE rebound coefficient 5.0 chosen; more severe than
        // nicotine (1.5) or cannabis (1.5), reflecting intensity of LC rebound; no magnitude data.
        adjustNT('norepinephrine', wFrac * hFrac * hours * 5.0);
        // Cortisol surge — HPA axis disinhibition.
        // Approximation debt (opioids): cortisol coefficient 4.0 chosen; direction well-supported
        // (HPA axis hyperactivation in opioid withdrawal is established); no magnitude data.
        adjustNT('cortisol', wFrac * hFrac * hours * 4.0);
        // GABA suppression — anxiety, restlessness.
        // Approximation debt (opioids): GABA coefficient -3.0 chosen; direction from reduced
        // GABAergic inhibition during LC rebound; no individual-level magnitude data exists.
        adjustNT('gaba', -(wFrac * hFrac * hours * 3.0));
        // Dopamine below baseline — dysphoria, anhedonia.
        // Approximation debt (opioids): DA coefficient -3.5 chosen; direction well-supported
        // (opioid withdrawal produces profound dysphoria/anhedonia via DA deficit);
        // no individual-level magnitude data exists.
        adjustNT('dopamine', -(wFrac * hFrac * hours * 3.5));
        // Serotonin depression — mood collapse.
        // Approximation debt (opioids): serotonin coefficient -2.0 chosen; direction consistent
        // with dysphoric/depressive withdrawal syndrome; no individual-level magnitude data exists.
        adjustNT('serotonin', -(wFrac * hFrac * hours * 2.0));
        // Pain amplification (opioid-induced hyperalgesia) — pain perception
        // increases above pre-opioid baseline during withdrawal.
        // Approximation debt (opioids): hyperalgesia rate 3.0 chosen; direction from
        // Lee et al. 2011 (PMID 21412369 — OIH review); "clinical prevalence not available"
        // per that review; no individual-level magnitude data exists.
        if (s.heds || s.health_conditions.includes('dental_pain')) {
          s.chronic_pain_level = Math.min(100, s.chronic_pain_level + wFrac * hFrac * hours * 3.0);
        }
        // GI distress — nausea, cramping.
        // Approximation debt (opioids): nausea rate 2.5 chosen; lower peak than alcohol DTs
        // but sustained over days; direction well-supported (GI symptoms prominent in COWS);
        // no magnitude data exists.
        if (wFrac > 0.3) {
          s.nausea = Math.min(100, s.nausea + (wFrac - 0.3) / 0.7 * hFrac * hours * 2.5);
        }
        // Stress accumulation from withdrawal distress.
        // Approximation debt (opioids): stress rate 3.0 chosen; direction obvious (opioid
        // withdrawal is an extreme stressor); no individual-level magnitude data exists.
        s.stress = clamp(s.stress + wFrac * hFrac * hours * 3.0, 0, 100);
      }
    }

    // Social connection decays asymptotically toward 0 during isolation.
    // τ=66h gives ~7 pts decline over 10h from social=50 (vs old linear 2 pts/hr = 20 pts, 2-4× too fast).
    // Threshold-based onset removed — accumulation is continuous from first isolation
    // (Tomova 2020 PMID 33230328; Ding et al. 2025 PMID 40011768).
    // Neuroticism scales rate ±35% (Buecker et al. 2020 meta-analysis N=93,668, DOI 10.1002/per.2229).
    // τ=66h: best-supported range 48–120h (Tomova 2020 PMID 33230328 lower bound; Buecker 2024
    // high day-to-day inertia upper bound). 80–100h may fit better but 66h is inside range.
    // Trait loneliness floor: high-trait-loneliness individuals have a structurally lower social asymptote —
    // even after contact, connection decays back toward a non-zero baseline rather than toward 0.
    // Cacioppo hypervigilance model (Hawkley & Cacioppo 2010 PMID 20652462). h²=48% (Boomsma 2005 PMID 16273322).
    // Scale 0.25: trait_loneliness=100 → floor=25; trait_loneliness=50 → floor=12.5.
    // Approximation debt (social decay): scale 0.25 chosen; literature says high-trait floor ~20-30 on this scale.
    const neuroMod = 1 + (s.neuroticism - 50) / 50 * 0.35;
    const lonelinessFl = s.trait_loneliness * 0.25;
    s.social = lonelinessFl + (s.social - lonelinessFl) * Math.exp(-hours * neuroMod / 66);
    // Social energy recovers during solitude — background recharge between interactions.
    // Introverts recharge faster in solitude; extroverts slower.
    // Full recovery from sleep via processSleepEnd().
    // Recovery direction: introversion does not predict finding solitude restorative (PLOS ONE 2022
    // PMID 35613084) but social-introversion facet predicts longer voluntary solitude (Thomas 2025
    // PMID 39152738). Approximation debt (social decay): 3 pts/hr base rate and coefficient 0.4 chosen.
    const introRecovery = 1 + ((s.introversion - 50) / 50) * 0.4; // 0.6–1.4×
    s.social_energy = Math.min(100, s.social_energy + hours * 3 * introRecovery);

    // Autism masking cost — context-graded continuous drain.
    // Performing neurotypical social presentation is cognitively costly regardless of discrete interactions.
    // Cost varies by social context: strangers require the most active performance; familiar workplace
    // requires sustained but lower-grade masking; home locations allow full unmasking (recovery instead).
    // Cassidy 2018 PMID 30266004 gives direction (camouflaging as significant energy cost);
    // no ambulatory study provides pts/hr estimates — coefficients chosen.
    if (s.autism ?? false) {
      const HOME_LOCATIONS = ['apartment_bedroom', 'apartment_bathroom', 'apartment_kitchen', 'apartment_living_room'];
      // Stranger locations: corner store, street, bus stop, library, soup kitchen, food bank.
      // friends_apartment varies by connection depth — deep connection allows partial unmasking.
      const STRANGER_LOCATIONS = ['corner_store', 'street', 'bus_stop', 'library', 'soup_kitchen', 'food_bank'];
      const isHome = HOME_LOCATIONS.includes(s.location);
      const isStranger = STRANGER_LOCATIONS.includes(s.location);
      const isWork = s.location === 'workplace' || s.location === 'workplace_bathroom';
      const isFriend = s.location === 'friends_apartment';
      // Friend's apartment: deep connection → reduced masking; otherwise full stranger cost.
      const friendDepth = connectionDepthTier();
      const friendMaskReduction = isFriend && friendDepth === 'deep' ? 0.6 : (isFriend && friendDepth === 'present' ? 0.8 : 1.0);
      // Approximation debt (autism masking): friend connection depth → masking reduction factors 0.6/0.8 chosen.
      // Direction: Hull et al. 2017 (PMID 28527095) establishes that familiarity and trust reduce
      // camouflaging demands; Raymaker 2020 (PMID 32851204) notes unmasking with trusted people as a
      // burnout-recovery pathway. No study quantifies a reduction factor by relationship depth tier;
      // 0.6/0.8 are internal model choices with no individual-level empirical basis.

      // Masking intensity for fatigue accumulation (0 = unmasked, 1 = maximum masking).
      let maskingIntensity = 0;

      if (isHome) {
        // Unmasking recovery — bonus social_energy replenishment when fully unmasked at home.
        // Stacks with the base 3 pts/hr introversion-scaled recovery above.
        // Approximation debt (autism masking): unmasking recovery +1.5 pts/hr chosen.
        // Direction: Hull et al. 2017 (PMID 28527095) qualitatively documents exhaustion as a
        // primary consequence of camouflaging, implying recovery occurs when unmasked. No study
        // provides pts/hr quantification of recovery rate vs. masking cost ratio.
        s.social_energy = Math.min(100, s.social_energy + hours * 1.5);
        // Home: masking_fatigue decays passively (mask is off).
        // Approximation debt (autism masking): home fatigue decay 4 pts/hr chosen.
        // Raymaker 2020 (PMID 32851204) identifies "time off/reduced expectations" and "doing things
        // in an autistic way/unmasking" as burnout-recovery pathways; no study provides hourly
        // kinetic data for masking fatigue dissipation. Rate chosen to clear fully within ~25h at home.
        s.masking_fatigue = Math.max(0, s.masking_fatigue - hours * 4);
      } else if (isWork && isWorkHours()) {
        // Workplace during work hours: highest sustained masking cost — professional norms.
        // Approximation debt (autism masking): workplace masking cost 0.5 pts/hr chosen.
        // Direction: Hull 2017 (PMID 28527095) — camouflaging produces exhaustion; workplace is
        // a sustained-demand context. No quantitative calibration available.
        s.social_energy = Math.max(0, s.social_energy - hours * 0.5);
        maskingIntensity = 1.0;
      } else if (isFriend) {
        // Friend's apartment: masking cost scaled by connection depth.
        // Approximation debt (autism masking): friend base masking cost 0.8 pts/hr × friendMaskReduction chosen.
        // Lai et al. 2017 (PMID 27899710) shows camouflaging is effortful and associated with stress;
        // no study provides pts/hr social-energy costs by relationship type. 0.8 base matches stranger
        // cost (same floor as unfamiliar other); depth reduction is model-internal with no empirical basis.
        s.social_energy = Math.max(0, s.social_energy - hours * 0.8 * friendMaskReduction);
        maskingIntensity = friendMaskReduction;
      } else if (isStranger) {
        // Stranger context: moderate masking demand — social scripts with unpredictable others.
        // Approximation debt (autism masking): stranger masking cost 0.8 pts/hr chosen.
        // Direction: Hull 2017 (PMID 28527095) documents exhaustion from camouflaging; DuBois 2024
        // (PMID 38190769) shows blunted cortisol awakening response under high enacted stigma —
        // consistent with sustained vigilance burden. No pts/hr quantification available.
        s.social_energy = Math.max(0, s.social_energy - hours * 0.8);
        maskingIntensity = 0.7;
      }

      // Masking fatigue accumulation — proportional to masking intensity.
      // Approximation debt (autism masking): fatigue accumulation 5 pts/hr at full intensity chosen.
      // Lai et al. 2017 (PMID 27899710, DOI 10.1177/1362361316671012) quantifies camouflaging as effortful
      // with mental health consequences; Arnold et al. 2023 (PMID 36637292) links masking to burnout.
      // No study provides pts/hr kinetic data for masking fatigue accumulation; no individual-level data.
      if (maskingIntensity > 0) {
        s.masking_fatigue = Math.min(100, s.masking_fatigue + hours * 5 * maskingIntensity);
      }

      // High masking fatigue depletes social_energy faster (compounding cost).
      // Approximation debt (autism masking): fatigue→social_energy drain 0.3 pts/hr at fatigue=100 chosen.
      // Direction: Raymaker 2020 (PMID 32851204) characterizes autistic burnout as compounding —
      // accumulated stress reduces capacity to function, which itself increases effort required.
      // No study quantifies a second-order drain coefficient; 0.3 is an internal model choice.
      if (s.masking_fatigue > 30 && maskingIntensity > 0) {
        const fatigueExtra = (s.masking_fatigue / 100) * 0.3 * hours;
        s.social_energy = Math.max(0, s.social_energy - fatigueExtra);
      }
    }

    // Closet energy cost — social_energy drain from identity concealment at work.
    // Scales with how many non-normative dimensions are undisclosed.
    // Approximation debt (identity): closet energy cost magnitude approximated; no ambulatory study
    // provides pts/hr for identity concealment specifically; modeled analogous to autism masking cost.
    {
      const isWork = s.location === 'workplace' || s.location === 'workplace_bathroom';
      let closetDrain = 0;
      if (isWork && isWorkHours()) {
        const outWork = s.out_at_work || [];
        // Sexuality concealment: non-straight + not disclosed
        const attr = s.attraction;
        const isStraight = attr && attr.sexual.orientation > 80 && attr.sexual.intensity > 30;
        if (!isStraight && !outWork.includes('sexuality')) {
          // Approximation debt (identity): 0.4 pts/hr chosen for sexuality concealment at work.
          // Direction: Pachankis 2007 (PMID 17338603) — concealing a stigmatized identity produces
          // chronic cognitive-affective-behavioral burden; Ragins, Singh & Cornwell 2007
          // (PMID 17638468) — fear of disclosure predicts psychological strain in LGB employees.
          // Meyer 2003 (PMID 12956539) minority stress framework: concealment is a proximal
          // stressor. No study measures depletion rate in pts/hr; 0.4 is design-proportional.
          closetDrain += 0.4;
        }
        // Gender concealment: trans/NB + not disclosed
        if (isTrans() && !outWork.includes('gender')) {
          // Approximation debt (identity): additional 0.3 pts/hr for gender identity concealment at work.
          closetDrain += 0.3;
        }
        // Attraction pattern concealment: ace/aro/demi + not disclosed
        if (attr && (attr.sexual.intensity < 20 || attr.sexual.gating !== 'none' || attr.romantic.intensity < 20) && !outWork.includes('attraction')) {
          // Approximation debt (identity): 0.15 pts/hr chosen for attraction-pattern concealment.
          // Same directional grounding as sexuality concealment (Pachankis 2007 PMID 17338603;
          // Ragins et al. 2007 PMID 17638468). Lower rate than sexuality (0.4) reflects that
          // attraction pattern is less legible to coworkers — lower ambient threat of discovery.
          // No literature measures this distinction; ratio is a design choice.
          closetDrain += 0.15;
        }
      }
      s.closet_energy_cost = closetDrain;
      if (closetDrain > 0) {
        s.social_energy = Math.max(0, s.social_energy - closetDrain * hours);
      }
    }

    // Code-switching fatigue — context-graded continuous accumulation for racial/ethnic minorities.
    // Navigating white-dominant spaces requires ongoing linguistic, affective, and behavioral modulation.
    // The cost is highest in professional settings (formal code-switching), moderate with strangers
    // (ambient vigilance), and scales with connection depth for friends (deeper friends = less switching).
    // Home is a full reprieve. White characters do not accumulate (dominant culture = no switching cost).
    // Approximation debt (code-switching): all rates chosen; no ambulatory study quantifies this.
    // Direction: Meyer 2003 minority stress model (PMID 12956539); Paradies 2015 meta-analysis
    // (PMID 26398658) links discrimination to depression/anxiety. McCluney et al. 2019 (organizational
    // psychology, not indexed in PubMed) documents Black workers' code-switching costs in white-dominant
    // workplaces via qualitative/survey methods. No study provides ambulatory pts/hr estimates for
    // fatigue accumulation from code-switching; all rates are internal model choices.
    if (s.race_ethnicity && s.race_ethnicity !== 'white') {
      const HOME_LOCATIONS_CS = ['apartment_bedroom', 'apartment_bathroom', 'apartment_kitchen'];
      const STRANGER_LOCATIONS_CS = ['corner_store', 'street', 'bus_stop', 'library', 'soup_kitchen', 'food_bank'];
      const isHomeCS = HOME_LOCATIONS_CS.includes(s.location);
      const isStrangerCS = STRANGER_LOCATIONS_CS.includes(s.location);
      const isWorkCS = s.location === 'workplace' || s.location === 'workplace_bathroom';

      if (isHomeCS) {
        // Home recovery — code-switching fatigue dissipates in own space.
        // Approximation debt (code-switching): home recovery rate 2.0 pts/hr chosen.
        // Direction: recovery in own cultural space is qualitatively documented (McCluney et al. 2019,
        // organizational psych; no PubMed ID). No study provides kinetic recovery rate data;
        // 2.0 pts/hr chosen to clear a full day of workplace switching (~3.5 hrs work × 3.5) within ~2 days.
        s.code_switching_fatigue = Math.max(0, s.code_switching_fatigue - hours * 2.0);
      } else if (isWorkCS && isWorkHours()) {
        // Workplace during work hours: highest code-switching demand — professional register,
        // affect management, linguistic self-monitoring.
        // Approximation debt (code-switching): workplace rate 3.5 pts/hr chosen.
        // McCluney et al. 2019 (organizational psych, no PubMed ID) documents professional code-switching
        // as most demanding; Meyer 2003 (PMID 12956539) establishes chronic vigilance as a minority
        // stress mechanism. No ambulatory cortisol or cognitive-load study maps this to pts/hr.
        s.code_switching_fatigue = Math.min(100, s.code_switching_fatigue + hours * 3.5);
      } else if (isStrangerCS) {
        // Stranger/public spaces: ambient vigilance, modified self-presentation.
        // Approximation debt (code-switching): stranger rate 1.5 pts/hr chosen.
        // Direction: Paradies 2015 (PMID 26398658) links ambient discrimination to psychological stress;
        // Meyer 2003 (PMID 12956539) models hypervigilance in public as a minority stress component.
        // Lower than workplace (1.5 vs 3.5) — ambient vigilance, not formal performance. No individual-level data.
        s.code_switching_fatigue = Math.min(100, s.code_switching_fatigue + hours * 1.5);
      }
      // friends_apartment: scales with connection_depth — deeper connection = less performance required.
      if (s.location === 'friends_apartment') {
        // Approximation debt (code-switching): friend base rate 1.0 pts/hr, depth scaling chosen.
        // Qualitative literature (McCluney et al. 2019, organizational psych, no PubMed ID) suggests
        // closer relationships require less code-switching; no study quantifies the reduction curve
        // by connection depth. 1.0 base and 0.8 scaling are internal model choices; no individual-level data.
        const depthReduction = s.connection_depth / 100; // 0 (strangers) to 1 (deep)
        const friendRate = 1.0 * (1 - depthReduction * 0.8); // 1.0 at hollow → 0.2 at deep
        s.code_switching_fatigue = Math.min(100, s.code_switching_fatigue + hours * friendRate);
      }
    }

    // Connection depth decays toward 0. τ=69h (half-life ~48h — slightly faster than social τ=66h).
    // No floor: genuine isolation can reach all the way to hollow.
    // Approximation debt (social depth): τ=69h chosen; direction (separate from social) from qualitative literature
    // on parasocial vs. genuine social contact (docs/design/parasocial.md).
    s.connection_depth = s.connection_depth * Math.exp(-hours / 69);

    // Housing displacement — effects while at friend's place or under couch strain.
    // Couch strain: extra connection_depth decay when at friends_apartment — both parties are feeling it.
    // Approximation debt (couch strain): +0.02/hr extra decay coefficient chosen.
    if (s.couch_strain && s.location === 'friends_apartment') {
      s.connection_depth = Math.max(0, s.connection_depth - hours * 0.02);
    }
    // Guest NE elevation — being in someone else's space raises background alertness.
    // Approximation debt (couch NE): +0.5 pts/hr chosen; no literature baseline for guest-state arousal.
    if (s.staying_with === 'friend' && s.location === 'friends_apartment') {
      const neTarget = s.norepinephrine + hours * 0.5;
      s.norepinephrine = Math.min(100, neTarget);
    }

    // Street safety — ambient NE from hypervigilance at night based on perceived presentation.
    // This is not a danger event. It is the background cost of navigating public space
    // at night when your body reads as a target. NE is already elevated; this adds to it.
    // Fires at street, bus_stop, and park — locations where you are exposed, in transit, or waiting.
    // Keyed on perceivedPresentation(), not pronouns.
    // Approximation debt (structural discrimination): direction grounded in street harassment literature
    // (Fileborn 2016; Kearl 2010 "Stop Street Harassment"); differential by gender presentation is
    // well-documented. fem_read: +0.4/hr. androgynous_read: +0.2/hr (less predictable targeting;
    // different profile of risk). Rates are illustrative — no ambulatory NE measurement during
    // nighttime street transit by perceived gender exists.
    {
      const outsideNightLocs = ['street', 'bus_stop', 'park'];
      const tod = timeOfDay();
      const isNight = tod > 1260 || tod < 360; // after 9pm or before 6am
      if (isNight && outsideNightLocs.includes(s.location)) {
        const pres = perceivedPresentation();
        if (pres === 'fem_read') {
          s.norepinephrine = Math.min(100, s.norepinephrine + hours * 0.4);
        } else if (pres === 'androgynous_read') {
          s.norepinephrine = Math.min(100, s.norepinephrine + hours * 0.2);
        }
      }
    }

    // Actions since rest
    s.actions_since_rest++;

    // Migraine mechanics (only for characters with the condition)
    if (s.health_conditions.includes('migraines')) {
      if (s.migraine_active) {
        // Decay: slow ramp to peak in first 2h, then decay ~8 pts/hr
        // Approximation debt (migraine): 8 pts/hr decay rate chosen.
        // ICHD-3 defines migraine attack duration 4–72h; at initial intensity 30–70,
        // 8 pts/hr after a 2h ramp yields attack duration ~3.75–8.75h — within range
        // but weighted to the shorter end. No published pharmacokinetic decay model for
        // untreated migraine intensity; rate is model-internal.
        s.migraine_hours_active += hours;
        // Quiet migraines decay at 2× speed — the body resolving faster than expected.
        const decayRate = s.migraine_quiet_resolved ? 16 : 8;
        if (s.migraine_hours_active > 2) {
          s.migraine_intensity = Math.max(0, s.migraine_intensity - hours * decayRate);
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
        // Approximation debt (migraine): 0.003/hr base rate and 8× risk multiplier chosen.
        // 0.003/hr ≈ 0.072/day ≈ ~2.2/month at baseline — within the episodic range (1–14/month;
        // Lipton et al. 2007 PMID 17261680 found 31.3% of migraineurs have ≥3/month).
        // The 8× maximum amplification from combined risk factors (adenosine, stress, sleep debt)
        // is not derived from triggering threshold data — it scales model-internally to keep
        // high-risk states meaningfully more dangerous without overwhelming play.
        const baseChancePerHour = 0.003; // ~3 per 1000 play-hours at baseline
        const threshold = s.migraine_threshold ?? 50;
        // Approximation debt (migraine): threshold-to-probability mapping linear, not calibrated.
        // Direction: higher threshold = harder to trigger (represents protective factors, treatment
        // effect); neurology visit raises threshold +10 → ~10% reduction in base rate at median.
        // A non-linear (sigmoidal) mapping would be more physiologically realistic but adds no
        // behavioral resolution at the current scale. Model-internal.
        const thresholdMult = 1 - Math.max(-0.3, Math.min(0.5, (threshold - 50) / 100));
        const triggerChance = baseChancePerHour * thresholdMult * (1 + riskScore * 8) * hours;
        if (ctx.timeline.chance(triggerChance)) {
          s.migraine_active = true;
          // Approximation debt (migraine): initial intensity range 30–70 and 8 pts/hr decay rate chosen.
          // ICHD-3 attack duration criterion is 4–72h; at 8 pts/hr after 2h ramp, intensity 30
          // clears in ~5.75h and intensity 70 in ~10.75h — within the typical episodic range
          // but not calibrated to an empirical duration distribution. Model-internal.
          s.migraine_intensity = 30 + riskScore * 40; // 30-70 depending on risk
          s.migraine_hours_active = 0;
          s.migraine_quiet_resolved = false;
          // Record migraine onset event — count used for first/familiar prose distinction.
          ctx.events.record('migraine_onset', { intensity: s.migraine_intensity });
          // Quiet migraine: ~12% chance when threshold is well-managed (>60) — resolves faster.
          // The body surprising you in the better direction. No published rate for this phenomenon;
          // Approximation debt (migraine): 0.12 probability and threshold >60 are model-internal.
          const quietChance = s.migraine_threshold > 60
            ? 0.12 * ((s.migraine_threshold - 60) / 40 + 1)
            : 0;
          if (quietChance > 0 && ctx.timeline.chance(quietChance)) {
            // Quiet migraine — intensity starts lower, decay rate doubled.
            s.migraine_intensity = Math.max(10, s.migraine_intensity * 0.5);
            s.migraine_quiet_resolved = true; // prose flag: resolved faster than expected
          }
        }
      }
    }

    // Dental pain — condition worsening and NT effects per tick
    if (s.health_conditions.includes('dental_pain')) {
      // Condition worsening — only when untreated (dental_last_treated hasn't been updated recently).
      // Approximation debt (dental): worsening timeline approximated — 14 days inflamed→infected,
      // 7 further days infected→abscess. No published prospective human data on pulpitis→abscess
      // timeline exists; these values are clinical approximations. Real progression varies by lesion
      // type, bacterial load, patient immunity, and diet. Weeks is plausible; exact thresholds chosen.
      if (s.dental_condition === 'inflamed') {
        const daysSinceTreated = (s.time - s.dental_last_treated) / (24 * 60);
        if (daysSinceTreated > 14) {
          s.dental_condition = 'infected';
          s.dental_ache = Math.min(100, s.dental_ache + 20); // Approximation debt (dental): +20 on inflamed→infected transition chosen; no quantitative basis in literature
        }
      } else if (s.dental_condition === 'infected') {
        const daysSinceTreated = (s.time - s.dental_last_treated) / (24 * 60);
        if (daysSinceTreated > 21) { // 14 days inflamed + 7 days infected = 21 days total
          s.dental_condition = 'abscess';
          s.dental_abscess_onset = s.time; // record when abscess was established
          s.dental_ache = Math.min(100, s.dental_ache + 30); // Approximation debt (dental): +30 on infected→abscess transition chosen; no quantitative basis in literature
        }
      }

      // Abscess systemic effects — untreated abscess produces nausea and sustained cortisol elevation.
      // Dental abscess can spread; systemic inflammation raises stress hormones and disrupts GI.
      // Approximation debt (dental): nausea 0.3/hr and cortisol 0.5/hr at abscess chosen;
      // no population-level kinetic data for these rates. Odontogenic abscesses cause systemic
      // inflammation (CRP/AISI elevation documented: PMID 39410567), but quantitative nausea or
      // cortisol rates in ambulatory patients are not in the literature. Direction is supported;
      // magnitudes are arbitrary.
      if (s.dental_condition === 'abscess') {
        if (s.nausea < 40) {
          s.nausea = Math.min(40, s.nausea + hours * 0.3); // Approximation debt (dental):
        }
        adjustNT('cortisol', hours * 0.5); // Approximation debt (dental):

        // Tooth loss end-state — after 30 game-days at abscess tier untreated, the tooth
        // is lost. The pain forces emergency action regardless of financial situation.
        // Approximation debt (dental): 30-day threshold chosen; no published data on untreated
        // abscess duration before tooth loss. Weeks to months is clinically plausible; exact
        // threshold is a design choice, not derived from literature.
        if (s.dental_abscess_onset > 0 && !hasInterrupt('tooth_extraction')) {
          const daysSinceAbscess = (s.time - s.dental_abscess_onset) / (24 * 60);
          if (daysSinceAbscess >= 30) {
            scheduleInterrupt('tooth_extraction', s.time + 30, 'tooth_extraction', {});
          }
        }
      }

      if (s.dental_ache > 0) {
        // Passive decay — ache fades slowly (~1.5 pts/hr); lingers for hours after a spike
        // Approximation debt (dental pain): 1.5 pts/hr decay rate chosen; real decay depends on underlying condition (caries, abscess, periodontal).
        s.dental_ache = Math.max(0, s.dental_ache - hours * 1.5);
        // Pain signal: low NE raise when aching, stronger when flaring
        // Pain signal: chronic/acute pain raises NE via sympathoadrenal axis.
        // Direction: pain activates sympathetic system is well-established clinically (acute pain
        // → catecholamine release); no PMID verified for a specific autonomic-pain coupling review.
        // Coefficient 2 at ache=100 (+2 NE/hr max) is model-internal — no dental-specific NE
        // kinetic data in literature.
        // Approximation debt (dental pain): NE coefficient 2 chosen; direction from pain-
        // autonomic coupling (general clinical knowledge, PMID unverified), magnitude model-internal.
        adjustNT('norepinephrine', hours * 2 * (s.dental_ache / 100));
        // Acute flare prevents settling — suppresses GABA
        if (s.dental_ache > 50) {
          // Acute flare suppresses GABA: central sensitization in persistent pain reduces
          // GABAergic inhibitory tone (direction from spinal dorsal horn sensitization
          // literature; Bhave & Bhave 2002 — PMID unverified). Coefficient 1.5 and threshold
          // 50 are model-internal — no dental-specific GABA kinetic data exists.
          // Approximation debt (dental pain): GABA coefficient -1.5 and threshold 50 chosen;
          // direction from central sensitization literature, magnitudes model-internal.
          adjustNT('gaba', -hours * 1.5);
        }
      }
    }

    // Dental health decay — everyone's oral health degrades without professional maintenance.
    // Rate accelerated by smoking (periodontal disease risk) and existing dental condition.
    // Approximation debt (dental): base decay 0.15/day chosen; real rate depends on diet, brushing,
    // genetics, fluoride access. Smoking multiplier 1.5x from CDC periodontal disease data (direction
    // from Bergström 2004 — PMID unverified; magnitude approximated). Dental visits restore health.
    {
      const days = hours / 24;
      let decayRate = 0.15; // Approximation debt (dental): pts/day base decay
      if (isSmoker()) decayRate *= 1.5; // Approximation debt (dental): smoking multiplier
      if (s.dental_condition !== 'sound') decayRate *= 1.3; // active disease accelerates decline
      s.dental_health = Math.max(0, s.dental_health - days * decayRate);

      // Spontaneous dental flare — low dental_health increases probability of ache spikes
      // even for characters without 'dental_pain' condition. The condition means established
      // pathology; low dental_health means accumulating neglect that occasionally surfaces.
      // Approximation debt (dental): flare probability formula chosen; no published continuous
      // function relating oral health index to spontaneous pain incidence.
      if (s.dental_health < 40 && s.dental_ache < 20) {
        // Probability per hour: scales with how low dental_health is. At health=0, ~3%/hr; at 40, 0.
        // Approximation debt (dental): 0.03 max hourly flare rate chosen.
        // At dental_health=0, probability ~0.03/hr ~0.72/day — roughly one spontaneous ache
        // per day at severe neglect. No published function relates oral health index to
        // spontaneous pain incidence; 0.03 is calibrated to feel narratively plausible
        // (occasional, not constant) at the worst tier. Model-internal.
        const flareProb = (1 - s.dental_health / 40) * 0.03 * hours;
        if (ctx.timeline.random() < flareProb) {
          // Spontaneous ache spike — the kind that comes from nowhere
          const spikeAmount = 15 + Math.round((1 - s.dental_health / 40) * 25); // 15–40
          s.dental_ache = Math.min(100, s.dental_ache + spikeAmount);
        }
      }
    }

    // Gastritis — epigastric pain driven by empty stomach, with nausea contribution.
    // Gastritis inflames the stomach lining; an empty stomach means acid contacts the raw mucosa
    // directly (no food buffer), producing the characteristic empty-stomach gnawing.
    // Pain-when-empty: rises as stomach empties, eases after eating.
    // Nausea cycles: elevated baseline nausea push during empty/low-fullness states.
    // Slower emptying: gastric half-life multiplied (applied in gastric emptying block above via
    //   gastricHalfLife × gastritisSlowFactor; computed before this block — see gastric emptying section).
    if (s.health_conditions.includes('gastritis')) {
      // Pain target: high when stomach empty, low when full.
      // Real gastric mucosal pain: worst at trough (fasted), relieved by eating.
      // Ref: Approximation debt (gastritis): 40 pt/hr accumulation and 25 pt/hr decay rates chosen;
      //   no published continuous-rate pain kinetics for chronic gastritis. Directional basis from
      //   symptom report literature (Talley & Vakil 2005 dyspepsia guidelines PMID 16181387;
      //   Ford et al. 2015 functional dyspepsia meta-analysis PMID 26567029); magnitudes arbitrary.
      const stomachEmpty = s.stomach_fullness < 15;
      const stomachFull  = s.stomach_fullness > 50;
      // GI specialist treatment — reduces accumulation rate for 7 game-days after visit.
      // Approximation debt (specialist treatment): 0.5× rate reduction and 7-day window chosen.
      const gastritisTreatActive = s.gastritis_treatment_time > 0 &&
        s.time - s.gastritis_treatment_time < 7 * 24 * 60;
      const gastritisTreatMult = gastritisTreatActive ? 0.5 : 1.0;
      s.gastritis_treatment_recent = gastritisTreatActive;
      if (stomachEmpty) {
        // Stomach empty — pain builds toward 80 (characteristic gnawing ache, not maximum pain)
        const target = 80;
        s.gastritis_pain = Math.min(target, s.gastritis_pain + hours * 40 * gastritisTreatMult); // Approximation debt (gastritis): 40 pt/hr
      } else if (stomachFull) {
        // Stomach full — food buffers acid; pain drains
        s.gastritis_pain = Math.max(0, s.gastritis_pain - hours * 25); // Approximation debt (gastritis): 25 pt/hr
      } else {
        // Partial fill — gentle decay
        s.gastritis_pain = Math.max(0, s.gastritis_pain - hours * 8); // Approximation debt (gastritis): 8 pt/hr
      }
      // Pain signal: low-grade NE when gnawing; GABA suppressed when pain is significant
      // (discomfort prevents settling, same mechanism as dental pain)
      adjustNT('norepinephrine', hours * 1.5 * (s.gastritis_pain / 100)); // Approximation debt (gastritis): coefficient 1.5 chosen; no per-unit gastric-pain→NE data in literature
      if (s.gastritis_pain > 40) {
        adjustNT('gaba', -hours * 1.0); // Approximation debt (gastritis): coefficient 1.0 and threshold 40 chosen; no per-unit gastric-pain→GABA data exists; threshold and rate are design choices
      }
      // Antacid prescription — accelerates gastritis_pain decay when prescribed.
      // Approximation debt (healthcare): antacid effect magnitude approximated; real PPI/antacid
      // effects reduce acid secretion (PPIs) or buffer it (antacids), reducing mucosal pain signal.
      // Direction: gastritis_pain decays 0.1/hr faster when antacid is active.
      if ((s.clinic_prescriptions ?? []).includes('antacid')) {
        s.gastritis_pain = Math.max(0, s.gastritis_pain - hours * 0.1); // Approximation debt (healthcare)
      }
      // Nausea contribution — inflamed mucosa produces chronic low-level nausea.
      // Worse when empty. This is a rate addition to the shared nausea pool.
      // Real: H. pylori + gastritis produces nausea distinct from mechanical fullness nausea.
      // Approximation debt (gastritis): 3 pt/hr empty contribution and 0.5 pt/hr full chosen;
      // H. pylori nausea is clinically recognized (Marshall & Warren 1984 — Nobel work, no PMID)
      // but no kinetic rate data for continuous nausea accumulation in gastritis exists.
      if (stomachEmpty && s.nausea < 35) {
        s.nausea = Math.min(35, s.nausea + hours * 3); // Approximation debt (gastritis): capped at 35 (queasy, not sick)
      } else if (!stomachEmpty && s.nausea < 10) {
        s.nausea = Math.min(10, s.nausea + hours * 0.5);
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

    // Medication supply depletion — daily medications consumed over time.
    // 1 unit per 24h of game time (1440 min). Tracked fractionally via hours.
    {
      const supply = s.medication_supply;
      if (supply && typeof supply === 'object') {
        for (const med of Object.keys(supply)) {
          if (supply[med] > 0) {
            supply[med] = Math.max(0, supply[med] - hours / 24);
          }
        }
        // Clear illness_medicated when illness meds run out
        if (s.illness_medicated && (supply['illness'] ?? 0) <= 0) {
          s.illness_medicated = false;
        }
        // Reset psych medication onset when supply runs out — missed doses restart the ramp.
        const psychMeds = ['antidepressant', 'anxiolytic', 'mood_stabilizer'];
        const starts = s.psych_med_start ?? {};
        for (const pm of psychMeds) {
          if (starts[pm] && (supply[pm] ?? 0) <= 0) {
            starts[pm] = 0;
          }
        }
      }
    }

    // Vasovagal / orthostatic risk — accumulates when blood pressure proxy is low.
    // Lying down (sleeping) restores cerebral perfusion and drains risk rapidly.
    // Approximation debt (vasovagal): accumulation and drain rates chosen; no tilt-table calibration data.
    // Rates (very_low: 40-50/hr, low: 15-20/hr, normal drain: 15-30/hr, sleep drain: 50/hr) are
    // model-internal. Pre-syncope typically develops over minutes in head-up tilt studies; episode
    // threshold of 90 pts at 40/hr implies ~2.25h — longer than clinical tilt provocation (~20-45 min),
    // but ambulatory daily exposure is intermittent, not continuous. Magnitudes model-internal.
    {
      const bpTier = bloodPressureTier();
      const isHot = ambientTemperature() > 25; // 'warm' tier and above
      const constitutional = s.health_conditions.includes('autonomic_dysregulation') ? 2.5 : 1.0;
      const potsTolerance = s.pots_standing_tolerance ?? 70;
      // Approximation debt (pots): tolerance-to-rate mapping chosen; direction from orthostatic tolerance literature.
      // At tolerance=30 (POTS default): factor=1.0; at tolerance=70 (healthy): factor=0.43; at tolerance=45 (post-treatment): factor~0.79.
      const potsRateMult = s.health_conditions.includes('pots')
        ? (1 - (potsTolerance - 30) / 70)
        : 1.0;
      if (s.is_sleeping) {
        s.vasovagal_risk = Math.max(0, s.vasovagal_risk - 50 * hours);
      } else if (bpTier === 'very_low') {
        s.vasovagal_risk = Math.min(100, s.vasovagal_risk + (isHot ? 50 : 40) * constitutional * potsRateMult * hours);
      } else if (bpTier === 'low') {
        s.vasovagal_risk = Math.min(100, s.vasovagal_risk + (isHot ? 20 : 15) * constitutional * potsRateMult * hours);
      } else {
        // Normal BP — drain risk; constitutionally predisposed drain more slowly
        s.vasovagal_risk = Math.max(0, s.vasovagal_risk - (constitutional > 1 ? 15 : 30) * hours);
      }
      if (s.vasovagal_recovery > 0) {
        s.vasovagal_recovery = Math.max(0, s.vasovagal_recovery - 15 * hours);
      }
    }

    // Menstrual cycle — period supply consumption during flow.
    // Only active on cycle days 1–5 (menstrual phase). One supply unit consumed per ~7h of flow.
    // Approximation debt (menstrual): 7h consumption interval chosen; real rate varies by product
    // (tampon safe 4–8h, pad 4–6h, cup 8–12h) and flow intensity. 7h is a rough midpoint.
    // No population-level data on average change frequency across product types exists in
    // the peer-reviewed literature; manufacturer guidance and clinical recommendations only.
    if (s.cycle_start_time !== null) {
      const phase = cyclePhaseTier();
      if (phase === 'menstrual') {
        // Supply consumption — one unit per ~7h of waking flow.
        // Approximation debt (menstrual): 7h interval chosen; real rate varies by product.
        if (!s.is_sleeping) {
          const timeSinceLast = s.time - (s.period_supply_last_consumed || 0);
          if (timeSinceLast >= 7 * 60) {
            s.period_supply_last_consumed = s.time;
            if (ctx.items.countOf('period_supplies') > 0) {
              ctx.items.remove('period_supplies', 1);
              if (ctx.items.countOf('period_supplies') === 0) {
                s.needs_period_supplies = true;
                // Approximation debt (menstrual): +5 stress on running out of supplies chosen;
                // no published psychophysiological data on acute stress response to period supply
                // depletion. Direction (aversive event → stress) is obvious; magnitude arbitrary.
                s.stress = Math.min(100, s.stress + 5);
              }
            }
          }
        }
        // Cramping — derived from current cycle day, updated every tick.
        // Approximation debt (menstrual): cramps_active fires on days 1–3 above threshold.
        const d = cycleDay();
        s.cramps_active = (s.cramp_severity > 0.15 && d <= 3) || s.cramp_severity > 0.5;
      } else {
        // Outside menstrual phase — clear flow-dependent state.
        if (s.cramps_active) s.cramps_active = false;
        if (s.needs_period_supplies) s.needs_period_supplies = false;
      }
    }

    // hEDS chronic pain — diffuse connective tissue pain drifting toward a nonzero baseline.
    // hEDS causes persistent low-grade pain from joint laxity, soft tissue strain, and central
    // sensitization. Baseline ~25 (mild persistent), rising faster after physical exertion.
    // Approximation debt (hEDS): chronic pain baseline chosen; highly variable between individuals.
    // Bénistan & Martinez 2019 (PMID 31075184) documents 97% severe chronic pain but gives
    // no normative resting NRS scores; baseline 25/100 (≈ NRS 2.5) is a conservative estimate.
    // Literature: 97% of hEDS patients have severe chronic pain (Bénistan & Martinez 2019
    // PMID 31075184); pain gradually worsened in 75% over time. No normative NRS/VAS scores
    // for ambulatory daily pain in hEDS exist — only cross-sectional severity classifications.
    // Pain drives NE (low-grade sympathetic arousal), slightly suppresses serotonin, raises cortisol.
    // These are routed through NT target functions below, not direct adjustNT calls, to preserve
    // the gradient pattern used elsewhere.
    if (s.heds) {
      // Activity proxy: adenosine as a fatigue signal from physical exertion.
      // High adenosine → post-exertion myalgia worsens; pain rises faster, baseline creeps up.
      // Direction: post-exertional pain worsening is a recognized hEDS feature (Hakim GeneReviews
      // PMID 20301456), but no published kinetic rates (pt/hr rise) exist for this phenomenon.
      // Approximation debt (hEDS): adenosine threshold 50 and rate multiplier 1.5 chosen without
      // quantitative basis; no ambulatory pain-kinetics data for hEDS post-exertional flare.
      const postExertionFactor = s.adenosine > 50 ? 1.5 : 1.0;
      const painBaseline = 25; // Approximation debt (hEDS): baseline 25/100 chosen; Bénistan &
      // Martinez 2019 (PMID 31075184) documents severe chronic pain (97% of hEDS), but "severe"
      // on NRS typically means ≥7/10. Our 0–100 scale maps roughly to 0–10 NRS × 10, so baseline
      // 25 ≈ mild-moderate (NRS 2.5). Plausibly lower than real hEDS experience; no normative
      // daily resting-pain data exists for ambulatory hEDS populations.
      if (s.chronic_pain_level < painBaseline) {
        // Drift toward baseline
        s.chronic_pain_level = Math.min(painBaseline,
          s.chronic_pain_level + hours * 4 * postExertionFactor); // Approximation debt (hEDS): 4 pt/hr rise rate chosen; no kinetic data
      } else if (s.chronic_pain_level > painBaseline * 1.5) {
        // When pain has spiked (above 37), drift back down slowly
        s.chronic_pain_level = Math.max(painBaseline,
          s.chronic_pain_level - hours * 3); // Approximation debt (hEDS): 3 pt/hr decay rate chosen; no kinetic data
      }
      // Sleep reduces pain via reduced mechanical load and restorative processes.
      // Approximation debt (hEDS): sleep reduces by 8 pt/hr; direction from sleep-pain literature
      // (Finan 2013 PMID 24045557: sleep and pain are bidirectionally coupled).
      if (s.is_sleeping) {
        s.chronic_pain_level = Math.max(0, s.chronic_pain_level - hours * 8);
      }
      s.chronic_pain_level = Math.min(100, Math.max(0, s.chronic_pain_level));

      // New-joint announcement — low probability when pain is elevated and not sleeping.
      // A familiar body, but occasionally an unfamiliar location asks for attention.
      // Approximation debt (hEDS): 0.02/hr base rate at pain_level > 60 chosen; no clinical data.
      if (!s.is_sleeping && !s.heds_new_joint_today && s.chronic_pain_level > 60) {
        const newJointChance = 0.02 * hours;
        if (ctx.timeline.chance(newJointChance)) {
          s.heds_new_joint_today = true;
        }
      }
    }

    // MCAS — mast cell activation syndrome baseline nausea sensitivity.
    // Mast cells degranulate inappropriately in response to chemical/olfactory/thermal triggers.
    // Documented trigger categories: fragrances/cleaning agents, food odors, caffeine.
    // Modeled as a low-level nausea drift when a smell trigger is active and not sleeping.
    // Approximation debt (MCAS): nausea sensitivity from smell triggers; full model needs trigger
    // catalog (heat, cold, stress, fragrances, food odors, exercise); rate 0.5 pt/hr chosen.
    // No published quantitative data on nausea rates from specific MCAS triggers exist in the
    // literature. Trigger categories (heat, cold, stress, chemical exposure) are documented
    // clinically (Theoharides et al. 2019 PMID 30884251; Frieri 2018 PMID 25944644 [note: pub
    // year 2018 despite 2015 DOI]; Valent et al. 2020 PMID 33261124), but nausea accumulation
    // rates per hour are not quantified in any population study — all rate values below are chosen.
    if (s.mcas && !s.is_sleeping) {
      const flareRisk = s.mcas ? (s.mcas_flare_risk ?? 40) : 0;
      // Approximation debt (MCAS): flare risk scales rates linearly; 1.0 at default risk=40, lower after treatment.
      const mcasRate = flareRisk / 40; // 1.0 at default, lower after allergist treatment
      // Cleaning products / fragrances as MCAS trigger — strong chemical smell intensity.
      // Direction: chemical/fragrance exposure is a recognized environmental MCAS trigger
      // (Frieri 2018 PMID 25944644; Theoharides 2019 PMID 30884251 lists environmental exposures).
      // No peer-reviewed literature quantifies olfactory-triggered nausea rate in MCAS patients.
      if (s.cleaning_smell_intensity > 50) {
        s.nausea = Math.min(100, s.nausea + 0.5 * mcasRate * hours); // Approximation debt (MCAS): 0.5 pt/hr chosen; no quantitative basis
      }
      // Food odors as MCAS trigger — strong cooking smells at high intensity.
      // Direction: food odors are listed as a trigger category (Frieri 2018 PMID 25944644).
      // Approximation debt (MCAS): threshold 60 and rate 0.3/hr chosen; no quantitative basis.
      if (s.food_smell_intensity > 60) {
        s.nausea = Math.min(100, s.nausea + 0.3 * mcasRate * hours); // Approximation debt (MCAS)
      }
      // Coffee/caffeine smell as MCAS trigger (stimulant + olfactory compound).
      // Direction: caffeine and aromatic compounds are documented environmental triggers.
      // Approximation debt (MCAS): threshold 55 and rate 0.25/hr chosen; no quantitative basis.
      if (s.coffee_smell_intensity > 55) {
        s.nausea = Math.min(100, s.nausea + 0.25 * mcasRate * hours); // Approximation debt (MCAS)
      }
      // Temperature triggers — heat and cold both documented MCAS triggers.
      // Mechanism: thermal stimulus → mast cell surface thermoreceptors (TRPV1/TRPA1) → degranulation.
      // Ref: Theoharides et al. 2019 (PMID 30884251) Table 3 explicitly lists "Cold" and "Heat"
      // as physical conditions triggering mast cell degranulation. Note: PMID 34199069 previously
      // cited here was wrong (unrelated paper); corrected to Theoharides 2019.
      // Approximation debt (MCAS): temperature thresholds 28°C (heat) and 13°C (cold) and rates 0.4/0.3
      // chosen without quantitative basis; no human MCAS data maps temperature to nausea rate.
      const mcasTemp = ambientTemperature();
      if (mcasTemp > 28) {
        // Heat trigger — rate scales mildly with temperature excess
        const heatExcess = Math.min(mcasTemp - 28, 14); // cap 14°C above threshold
        s.nausea = Math.min(100, s.nausea + (0.2 + heatExcess * 0.02) * mcasRate * hours); // Approximation debt (MCAS)
      } else if (mcasTemp < 13) {
        s.nausea = Math.min(100, s.nausea + 0.3 * mcasRate * hours); // Approximation debt (MCAS)
      }
      // Psychological stress trigger — cortisol-mediated CRH stimulates mast cell degranulation.
      // Theoharides 2004 (PMID 15271457): CRH directly activates mast cells in brain and periphery.
      // Approximation debt (MCAS): cortisol threshold 65, rate 0.35/hr chosen; no quantitative basis.
      if (s.cortisol > 65) {
        const stressExcess = (s.cortisol - 65) / 35; // 0–1 above threshold
        s.nausea = Math.min(100, s.nausea + 0.35 * stressExcess * mcasRate * hours); // Approximation debt (MCAS)
      }
      // Exercise/sympathoadrenal trigger — exercise-induced anaphylaxis is a distinct MCAS phenotype.
      // NE > 70 as proxy for post-exercise/high-exertion sympathoadrenal state.
      // Approximation debt (MCAS): NE proxy and threshold 70, rate 0.4/hr chosen; conflates exercise with
      // pure anxiety state. Better model: track exertion directly as a state var.
      if ((s.norepinephrine - s.norepinephrine_baseline) > 20) { // relative to baseline
        s.nausea = Math.min(100, s.nausea + 0.4 * mcasRate * hours); // Approximation debt (MCAS)
      }
    }

    // Caffeine withdrawal — derived from NE baseline deficit when caffeine is absent.
    // No accumulator: the NT deficit IS withdrawal. Kinetics are still present because the
    // baseline drifts slowly (τ=3 weeks) — a habitual user has an elevated NE baseline, and
    // when caffeine is cleared, NE drops below that baseline, producing the felt deficit.
    // Ref onset: Juliano & Griffiths 2004 (PMID 15448977): 12–24h onset, 20–51h peak.
    if (s.caffeine_habit > 10 && s.caffeine_level < 15) {
      // Derived withdrawal depth: NE deficit relative to baseline.
      // Approximation debt (nt-baseline): deficit-to-tier thresholds (3/10/20) chosen; no
      // empirical per-unit NE data maps to caffeine withdrawal severity ratings. Juliano &
      // Griffiths 2004 (PMID 15448977) characterizes symptom onset, duration, and dose-dependence
      // but does not provide a graded severity scale translatable to NE deficit units.
      const neDeficit = Math.max(0, s.norepinephrine_baseline - s.norepinephrine);
      // Normalize by 50 (realistic max deficit) → fraction in [0,1] for NT effect scaling.
      const wFrac = Math.min(1, neDeficit / 50);

      // Receptor upregulation effect: habitual caffeine → more adenosine receptors.
      // When caffeine removed, same adenosine hits a larger/more sensitive receptor population.
      // Gate on non-trivial deficit (wFrac > 0.06 ~ tier 'mild').
      // Human platelet A2A data (Circulation 2000, DOI 10.1161/01.CIR.102.3.285):
      // upregulation after ≥14 days at 400 mg/day or ≥7 days at 600 mg/day. Recovery
      // takes 7–14 days of abstinence. A1 upregulation in human brain less well-established
      // than in animal models (Bhagwat 1993 PMC3437321 — animal; human brain data sparse).
      // Approximation debt (caffeine): sensitivity bonus formula (habit/100 * 0.5 * wFrac)
      // is chosen, not derived from receptor density data.
      if (s.caffeine_habit > 30 && wFrac > 0.06) {
        const sensitivityBonus = (s.caffeine_habit / 100) * 0.5 * wFrac;
        s.adenosine = clamp(s.adenosine + sensitivityBonus * hours * 4, 0, 100);
      }

      // Nausea — severe withdrawal + high habit triggers GI symptoms.
      // Mechanism: adenosine A1/A2A receptors in gut + brainstem area postrema flood.
      // Approximation debt (caffeine): deficit threshold (wFrac > 0.55) and rate *5 chosen.
      // Nausea is a recognized caffeine withdrawal symptom (Juliano & Griffiths 2004, PMID 15448977)
      // but no dose-response kinetic data exist for nausea onset vs. withdrawal fraction. Threshold
      // 0.55 and rate multiplier ×5 are model-internal; direction is supported.
      if (wFrac > 0.55 && s.caffeine_habit > 45) {
        const nauseaRate = ((wFrac - 0.55) / 0.45) * (s.caffeine_habit / 100) * 5;
        s.nausea = Math.min(100, s.nausea + nauseaRate * hours);
      }

      if (wFrac > 0) {
        // NE elevation during caffeine withdrawal: adenosine A1 receptors on noradrenergic
        // terminals normally inhibit NE release. When caffeine clears and accumulated
        // adenosine floods unblocked receptors, this inhibition briefly over-corrects.
        // Caffeine withdrawal also activates stress axis (PMID 12140349: catecholamine/cortisol
        // elevation at work during withdrawal). Direction is supported; magnitude uncertain.
        // Approximation debt (caffeine): NE +2.5 and dopamine −2 pts/hr at wFrac=1 chosen.
        // NE direction: adenosine A1 receptors on noradrenergic terminals normally inhibit NE
        // release; caffeine blockade lifts that inhibition chronically; acute withdrawal floods
        // unblocked receptors → brief over-inhibition. Lane et al. 2002 (PMID 12140349) shows
        // caffeine raises epinephrine +32% acutely (not withdrawal), supporting sympathoadrenal
        // coupling, but withdrawal direction (NE up or down) is uncertain — no verified human
        // withdrawal NE kinetics found in literature. DA direction: consistent with adenosine→DA
        // pathway; magnitude model-internal. Both magnitudes are approximation debts.
        adjustNT('norepinephrine', wFrac * hours * 2.5);
        adjustNT('dopamine', -(wFrac * hours * 2));
      }
    } else if (s.caffeine_level >= 25) {
      // Caffeine present above relief threshold — adenosine receptor blockade restores feel.
      // Nausea from withdrawal clears when caffeine is present above relief threshold.
      // Approximation debt (caffeine): nausea clear rate 8 pts/hr chosen; no kinetic data for
      // how quickly caffeine re-administration resolves GI withdrawal symptoms. The 8 pts/hr
      // rate implies ~12 min to clear 1.6 pts — fast enough to feel like relief without
      // being instantaneous. Model-internal.
      s.nausea = Math.max(0, s.nausea - hours * 8);
    }

    // Nicotine withdrawal — derived from DA baseline deficit when nicotine is absent.
    // No accumulator: the NT deficit IS withdrawal. Fast kinetics (t½ 2h) mean nicotine_level
    // drops within hours, exposing the elevated DA baseline set by chronic use.
    // Withdrawal is irritability-dominant, not headache. Mechanism: nAChR desensitization/upregulation;
    // dopamine falls BELOW non-smoker baseline (smokers' mesolimbic DA is chronically suppressed;
    // cigarette brings it to normal, not above — removal drops it to sub-baseline).
    // Ref: Balfour 2004 PMID 15163980 — PMID unverified (nAChR upregulation); Dani & Balfour 2011
    // PMID 21824661 — PMID unverified (DA sub-baseline during withdrawal).
    if (s.nicotine_habit > 10 && s.nicotine_level < 10) {
      // Derived withdrawal depth: DA deficit relative to baseline.
      // Normalize by 50 (realistic max deficit) → fraction in [0,1].
      // Approximation debt (nt-baseline): deficit-to-tier thresholds and normalization ceiling 50
      // chosen; both are internal model parameters. No published data maps DA deficit magnitude to
      // nicotine withdrawal severity ratings. DSM-5 nicotine withdrawal criteria are categorical
      // (present/absent), not graded by deficit size.
      const daDeficit = Math.max(0, s.dopamine_baseline - s.dopamine);
      const wFrac = Math.min(1, daDeficit / 50);
      const hFrac = s.nicotine_habit / 100;

      if (wFrac > 0) {
        // Irritability signal: GABA down (can't settle), NE up (on edge), DA below non-smoker baseline.
        // DA sub-baseline: scales with both habit (baseline suppression depth) and withdrawal depth.
        // At hFrac=1, wFrac=1: DA -8 pts/hr, GABA -4 pts/hr, NE +3 pts/hr.
        // NE elevation direction confirmed: acute nicotine withdrawal triggers sympathetic
        // hyperactivity (locus coeruleus activation); clonidine (alpha-2 agonist, suppresses
        // NE release) reduces withdrawal severity — direct evidence NE is elevated.
        // See: Koob & Volkow 2010 PMC3134821; Wills et al. 2021 (doi 10.1111/jnc.15356).
        // Long-term (weeks post-cessation) urinary NE eventually declines (PMID 1816580),
        // but that is distinct from the acute sympathetic hyperactivity modeled here (days 1–3).
        // Approximation debt (nicotine): all three coefficient magnitudes chosen; direction
        // from Dani & Balfour 2011 PMID 21824661, Koob 1992 PMID 1352383.
        const nicTaper = taperingFactor('nicotine');
        adjustNT('gaba', -wFrac * hours * 4 * nicTaper);
        adjustNT('norepinephrine', wFrac * hours * 3 * nicTaper);
        // Sub-baseline DA: scales with habit depth — the more entrenched the habit, the
        // deeper the DA suppression during withdrawal.
        adjustNT('dopamine', -(wFrac * hFrac) * hours * 8 * nicTaper);
      }
    }

    // Passive nicotine accumulation from secondhand smoke.
    // Fires regardless of isSmoker() — non-smokers are exposed too.
    // No PRNG consumed — deterministic, proportional to location smoke_exposure × time.
    // Approximation debt (secondhand smoke): passive dose 10–20% of active smoking per unit
    // exposure; 0.15 coefficient is the midpoint. No published per-minute dose-response
    // curve for ambient nicotine absorption exists at room-air concentrations.
    {
      const locDef = ctx.world.getLocation(s.location);
      let smokeExp = locDef?.smoke_exposure ?? 0;

      if (smokeExp > 0) {
        // Jurisdiction gate: comprehensive indoor bans (EU, UK, AU) reduce residual exposure.
        // Countries with complete workplace bans → 90% reduction. US: patchwork state laws → no
        // blanket reduction applied here (most but not all US states ban indoor workplace smoking;
        // approximation debt accepts marginal over-exposure for minority of US jurisdictions).
        // Approximation debt (jurisdiction): indoor smoking bans vary by jurisdiction; full model
        // needs canSmoke(locationId) gate. Current check covers major-ban jurisdictions only.
        const jur = ctx.character.get('jurisdiction') ?? { country: 'US', region: 'CA' };
        const country = jur.country ?? 'US';
        const INDOOR_BAN_COUNTRIES = ['GB', 'FR', 'DE', 'IE', 'NL', 'BE', 'IT', 'ES', 'PT',
          'SE', 'NO', 'DK', 'FI', 'AT', 'CH', 'NZ', 'AU', 'JP'];
        if (INDOOR_BAN_COUNTRIES.includes(country)) {
          smokeExp *= 0.10; // 90% reduction — comprehensive ban
        }
      }

      if (smokeExp > 0) {
        // Nicotine absorption: passive dose is ~15% of active-smoking absorption per unit exposure.
        // One cigarette yields ~30 nicotine_level units actively; passive yields ~4.5 per full
        // unit hour of exposure. At workplace smoke_exposure=0.07: ~0.315 units/hr — trace level,
        // accumulates over an 8h shift to ~2.5 units total (below withdrawal-clear threshold of 8).
        // Approximation debt (secondhand smoke): 0.15 scaling and 30-unit cigarette equivalent chosen.
        // Passive smokers absorb far less nicotine than active smokers — direction is well-established
        // (serum cotinine in passive-exposed non-smokers is typically <5% of active smoker levels in
        // normal indoor environments; Benowitz 1996 — PMID unverified). The 15% figure applies here
        // because smoke_exposure=1.0 models direct side-stream exposure (not room air dilution); the
        // ratio is a design choice with directional support but no per-unit quantitative anchor.
        const passiveRate = smokeExp * 30 * 0.15; // nicotine_level units/hr
        s.nicotine_level = Math.min(100, s.nicotine_level + passiveRate * hours);
        s.nicotine_today_peak = Math.max(s.nicotine_today_peak, s.nicotine_level);

        // Cortisol: irritant/stress response — smoke is a mild physiological stressor.
        // Approximation debt (secondhand smoke): 1.5 pts/hr per unit exposure chosen;
        // direction from Flouris et al. 2010 (PMID 20448124 — cortisol increase in passive
        // smoke exposed non-smokers after 1h in smoking-permitted bar).
        adjustNT('cortisol', smokeExp * 1.5 * hours);

        // GABA: irritant reduces GABA target — airway irritation, mild discomfort signal.
        // Approximation debt (secondhand smoke): −0.8 pts/hr per unit exposure chosen;
        // mechanism is indirect (irritant-driven NE/sympathetic activation suppressing GABA tone),
        // no direct quantitative reference at room-air concentrations.
        adjustNT('gaba', -(smokeExp * 0.8 * hours));

        // Nausea: only at high exposure (smoke_exposure > 0.3 — e.g. a smoke-filled bar).
        // At current workplace level (0.07) this does not fire.
        if (smokeExp > 0.3) {
          // Approximation debt (secondhand smoke): nausea threshold 0.3 and rate 2 pts/hr chosen.
          // Heavy smoke exposure (smoky bar, enclosed space) causes nausea in sensitive individuals;
          // direction is clinically recognised. Threshold (0.3) and rate (2 pts/hr) are model-internal;
          // no quantitative dose-response literature exists for nausea at specific environmental
          // nicotine/smoke concentrations in non-smokers.
          s.nausea = Math.min(100, s.nausea + smokeExp * 2 * hours);
        }

        // Slow habit drift: chronic low-dose passive exposure very slowly builds nicotine_habit.
        // Rate is 1% of the active-smoking build path × exposure.
        // At workplace level (0.07): ~0.004 pts/hr → 0.032 pts/8h shift → ~0.23 pts/week.
        // Compare active smoker: +6 pts/day → ~42 pts/week. Passive is ~200× slower.
        // Over years of daily workplace exposure: habit could reach 10–15 (sub-threshold for
        // withdrawal, but raises baseline nicotine sensitivity). Meaningful on decade timescales.
        // Approximation debt (secondhand smoke): 1% scaling chosen; no epidemiological dose-response
        // for habit formation from passive exposure exists at these concentrations.
        s.nicotine_habit = Math.min(100, s.nicotine_habit + smokeExp * 0.01 * 6 * hours);
      }
    }

    // Nausea — NT effects and natural decay.
    // Approximation debt (nausea): decay 2 pts/hr, NT magnitudes (GABA −1.5, NE +1.0, adenosine +2)
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
        // Approximation debt (nausea): piecewise linear; no published P(vomit|VAS) curve exists.
        const n = s.nausea;
        if (n > 70)      vomitRate = 0.25 + ((n - 70) / 30) * 0.5;  // 0.25–0.75/hr (CTCAE grade 3+)
        else if (n > 50) vomitRate = 0.05 + ((n - 50) / 20) * 0.2;  // 0.05–0.25/hr (grade 2)
        else             vomitRate = ((n - 40) / 10) * 0.05;         // 0–0.05/hr (grade 1 onset)
        vomitRate *= Math.min(1, s.illness_severity * 3); // mild illness damps rate
      } else if (s.nausea > 75) {
        // Non-illness (caffeine withdrawal, psychogenic): low emetic efficiency.
        // Approximation debt (nausea): rate 0.2/hr at nausea=100 chosen; functional vomiting ~2% monthly (Talley 2007 PMID 17885700).
        vomitRate = ((s.nausea - 75) / 25) * 0.2;
      }
      if (vomitRate > 0 && ctx.timeline.chance(vomitRate * hours)) {
        s.pending_vomit = true;
      }
    }

    // Craving intensity — composite signal from all active withdrawal deficits.
    // Derived from NT baseline gaps rather than stored accumulators.
    // Scale: deficit / 50 → [0,1] fraction, then × 100 to produce 0-100 craving units.
    // Relative severity ordering (alcohol > nicotine > cannabis) is consistent with clinical
    // literature: alcohol withdrawal is medically dangerous (GABA hypofunction, seizure risk;
    // StatPearls NBK441882); nicotine craving is intense and relapse-predictive within days
    // (Lagrue et al. 2015, doi 10.2217/pgs.15.149); cannabis craving peaks days 2–6
    // (Chung et al. 2008 PMC4015312). Comparison study (Copeland et al. 2015 PMC4345250)
    // shows cannabis and tobacco withdrawal have similar symptom severity profiles in
    // real-world settings, suggesting the 0.5 vs 0.6 gap may be slightly wider than real.
    // Approximation debt (recovery): craving weighting coefficients (0.6, 0.8, 0.5)
    // chosen to reflect relative severity. No published multi-substance composite
    // craving scale exists at these NT-deficit units.
    {
      let craving = 0;
      if (s.quit_attempt === 'nicotine' || (s.nicotine_habit > 30 && s.nicotine_level < 20)) {
        const daDeficit = Math.max(0, s.dopamine_baseline - s.dopamine);
        craving += (daDeficit / 50) * 100 * 0.6 * taperingFactor('nicotine');
      }
      if (s.quit_attempt === 'alcohol' || (Math.max(0, s.gaba_baseline - 50) > 15 && s.alcohol_level < 10)) {
        const gabaDeficit = Math.max(0, s.gaba_baseline - s.gaba);
        craving += (gabaDeficit / 50) * 100 * 0.8 * taperingFactor('alcohol');
      }
      if (s.quit_attempt === 'cannabis' || (s.cannabis_tolerance > 20 && s.cannabis_level < 10)) {
        const daDeficit = Math.max(0, s.dopamine_baseline - s.dopamine);
        craving += (daDeficit / 50) * 100 * 0.5;
      }
      // Opioid craving — derived from endorphin deficit. Highest weight: opioid withdrawal
      // is the most aversive modeled substance withdrawal.
      // Approximation debt (opioids): craving weight 0.9 chosen; opioid craving is the most
      // severe among common substances of dependence (Kosten & George 2002 PMID 18567959);
      // no published multi-substance composite craving scale exists at simulation units.
      if (s.opioid_tolerance > 15 && s.opioid_level < 10) {
        const endoDeficit = Math.max(0, 45 - s.endorphin); // 45 = endorphin init/placeholder baseline
        craving += (endoDeficit / 50) * 100 * 0.9;
      }
      s.craving_intensity = Math.min(100, craving);

      // Location trigger amplification — certain locations amplify craving via
      // environmental cue exposure (sight of products, social context, habit-context links).
      // Only fires when craving is already present; amplification doesn't generate craving from zero.
      // General cue-reactivity literature supports location-based amplification (Niaura 2000,
      // cue-exposure review; O'Brien 1993 PMID 8235609 — conditioned cues increase craving).
      // Approximation debt (recovery): trigger multipliers chosen; no published
      // location-specific cue-reactivity data at fine-grained location resolution.
      const loc = s.location;
      if (s.craving_intensity > 5 && s.quit_attempt !== null) {
        const triggerLocations = {
          corner_store: { nicotine: 1.3, alcohol: 1.2 },  // sells both; visible shelf placement
          street:       { nicotine: 1.15 },                 // seeing others smoke
          // bar: { alcohol: 1.5 } — deferred until bar location exists
        };
        const triggers = triggerLocations[loc];
        if (triggers) {
          const mult = triggers[s.quit_attempt] ?? 1.0;
          if (mult > 1.0) {
            s.craving_intensity = Math.min(100, s.craving_intensity * mult);
          }
        }
      }
    }

    // Per-location familiarity — saturating exponential approach toward 1.0.
    // Each advanceTime call contributes minutes at the current location.
    // τ=4320 min (72h cumulative) → familiarity ≈ 0.5 after ~50h of total time spent.
    // Approximation debt (habituation): τ=4320 min chosen conservatively; no empirical
    // data directly quantifies multi-session habituation floor vs. cumulative exposure.
    // No PRNG consumed — purely time-based accumulation.
    {
      const loc = s.location;
      if (loc) {
        const prev = s.location_familiarity[loc] ?? 0;
        s.location_familiarity[loc] = 1 - (1 - prev) * Math.exp(-minutes / 4320);
      }
    }

    // Gig work — new gig availability + expiry + midnight reset.
    // Only runs for gig workers. Uses ctx.timeline.random() for generation.
    // 30-min window guard prevents multiple gigs from spawning in a single time step.
    if (isGigWorker()) {
      // Midnight reset — gig_earnings_today and gig_hours_today reset each calendar day.
      // Guard: floor(time/1440) > floor((time - minutes)/1440) means a midnight was crossed.
      if (Math.floor(s.time / 1440) > Math.floor((s.time - minutes) / 1440)) {
        s.gig_earnings_today = 0;
        s.gig_hours_today = 0;
      }

      // Expire stale gigs — remove any whose expires_at has passed.
      s.available_gigs = s.available_gigs.filter(g => g.expires_at > s.time);

      // New gig generation — once per 30-min window, 6am–11pm only.
      // Guard: last_gig_check tracks the last window boundary we processed.
      const windowSize = 30;
      const currentWindow = Math.floor(s.time / windowSize);
      const lastWindow = Math.floor(s.last_gig_check / windowSize);
      const hour = getHour();
      const isAppHours = hour >= 6 && hour < 23;
      if (currentWindow > lastWindow && isAppHours && s.available_gigs.length < 3) {
        s.last_gig_check = s.time;
        // Time-of-day demand curve — meal rushes and commute windows produce more gigs.
        // Approximation debt (gig): demand curve shape approximated; real platform supply
        // varies by city density, day of week, and competing worker count.
        // Peak windows confirmed: morning commute 7–9, lunch 11–14, dinner 17–21
        // (DoorDash help.doordash.com/dashers/s/article/Peak-Pay; Gridwise 2024 fleet data).
        // Base 25%, peaks up to 60%.
        const demandBase = 0.25;
        const lunchPeak = Math.exp(-0.5 * Math.pow((hour - 12) / 1.2, 2)) * 0.30;
        const dinnerPeak = Math.exp(-0.5 * Math.pow((hour - 18.5) / 1.5, 2)) * 0.35;
        const morningPeak = Math.exp(-0.5 * Math.pow((hour - 8) / 1.0, 2)) * 0.15;
        // Bad weather increases delivery demand (people don't want to go out).
        const weatherDemand = (s.weather === 'drizzle' || s.weather === 'snow') ? 0.10 : 0;
        const demandProb = Math.min(0.70, demandBase + lunchPeak + dinnerPeak + morningPeak + weatherDemand);
        // 1 RNG call per window check (appearance roll).
        const gigRoll = ctx.timeline.random();
        if (gigRoll < demandProb) {
          // 2 RNG calls for gig parameters — decoupled so pay and duration vary independently.
          const payRoll = ctx.timeline.random();
          const durationRoll = ctx.timeline.random();
          const gigType = ctx.character.get('gig_type') ?? 'delivery';
          // Pay: $6–18 base range. Rush hours pay more (surge pricing).
          // Approximation debt (gig): surge multiplier 1.0–1.4x approximated;
          // real surge pricing varies by platform algorithm and local demand.
          // DoorDash uses flat "Peak Pay" bonuses ($1–$4/delivery); Uber Eats uses
          // multiplicative surge. This code models a continuous multiplier as an abstraction
          // across both patterns. Academic evidence: Chen et al. 2019 (JPE) shows elastic
          // driver supply response to surge; Chen & Sheldon 2016 (Anderson.ucla.edu working paper)
          // documents surge-hour patterns. Individual multiplier magnitudes are platform-proprietary.
          const surgeMult = 1.0 + (lunchPeak + dinnerPeak) / 0.35 * 0.4;
          const clampedSurge = Math.min(1.4, surgeMult);
          const rawPay = (6 + payRoll * 12) * clampedSurge;
          // Round to nearest $0.50
          const pay = Math.round(rawPay * 2) / 2;
          const duration_min = 15 + Math.floor(durationRoll * 50);
          const distance = 0.5 + durationRoll * 4; // km, loosely correlated with duration
          const id = 'gig_' + Math.floor(s.time) + '_' + s.available_gigs.length;
          s.available_gigs = [...s.available_gigs, {
            id,
            type: gigType,
            distance,
            pay,
            duration_min,
            expires_at: s.time + 20,
          }];
        }
      }
    }

    // Freelance project generation — new projects appear periodically when none active.
    // Approximation debt (freelance): project arrival modeled as one per ~2 day window;
    // real freelance work has feast/famine cycles, client pipelines, and portfolio effects.
    if (isFreelancer() && !s.freelance_project_active) {
      const freelanceWindowSize = 120; // 2-hour check windows
      const currentFreelanceWindow = Math.floor(s.time / freelanceWindowSize);
      const lastFreelanceWindow = Math.floor(s.last_freelance_check / freelanceWindowSize);
      if (currentFreelanceWindow > lastFreelanceWindow) {
        s.last_freelance_check = s.time;
        const hour = Math.floor(timeOfDay() / 60);
        const isWakingHours = hour >= 8 && hour < 22;
        if (isWakingHours) {
          // 1 RNG call per window check
          const projectRoll = ctx.timeline.random();
          if (projectRoll < 0.35) {
            s.freelance_project_active = true;
            s.freelance_project_progress = 0;
            // Deadline: 3-7 days from now. Not yet enforced — scaffolding for future pressure mechanic.
            s.freelance_deadline = s.time + (3 * 1440) + (projectRoll / 0.35) * (4 * 1440);
          }
        }
      }
    }

    // Informal/day work availability — time and weather gated.
    // Approximation debt (informal work): weather threshold and daily cap chosen; real day labor
    // depends on location (hiring corners, temp agencies), season, local demand, and work type.
    // Heavy rain and heavy snow suppress outdoor day labor; extreme cold (< -5°C) does the same.
    // Indoor work types (cleaning, loading) would be less affected — not yet modeled.
    if (isInformalWorker()) {
      if (Math.floor(s.time / 1440) > Math.floor(s.day_work_last_reset / 1440)) {
        s.day_work_completed_today = 0;
        s.day_work_last_reset = s.time;
      }
      const hour = Math.floor(timeOfDay() / 60);
      const weatherBlocked = s.weather === 'heavy_rain' || s.weather === 'storm';
      // Approximation debt (informal work): bitter cold threshold; real suppression starts ~0°C
      // for outdoor tasks, varies by task type and employer. Using -5°C as a proxy.
      const coldBlocked = ambientTemperature() < -5;
      s.day_work_available = hour >= 6 && hour < 11
        && s.day_work_completed_today < 2
        && !weatherBlocked
        && !coldBlocked;
    }

    // Neurochemistry drift — levels approach targets with inertia
    driftNeurochemistry(hours);

    // Baseline adaptation — chronic NT history shifts the physiological setpoint
    // τ = 30240 min (3 weeks). Approximation debt (nt-baseline): τ chosen from receptor
    // downregulation literature direction (D2/D3 downregulation develops over days-to-weeks;
    // 5-HT1A desensitisation after ~8 days restriction per Roman et al. 2005 PMC2579986);
    // 3 weeks is in the middle of reported ranges but no study gives an exponential τ for
    // chronic NT baseline adaptation in ambulatory humans — exact value not established.
    const baselineTau = 30240;
    const baselineFactor = 1 - Math.exp(-minutes / baselineTau);
    s.serotonin_baseline += (s.serotonin - s.serotonin_baseline) * baselineFactor;
    s.dopamine_baseline += (s.dopamine - s.dopamine_baseline) * baselineFactor;
    s.norepinephrine_baseline += (s.norepinephrine - s.norepinephrine_baseline) * baselineFactor;
    s.gaba_baseline += (s.gaba - s.gaba_baseline) * baselineFactor;

    // Personality trait drift — slow month-scale changes from sustained life patterns.
    // Approximation debt (personality drift): drift rates and targets chosen; direction from
    // longitudinal personality research (Roberts & DelVecchio 2000, PMID 10668348 — rank-order
    // consistency increases with age; Roberts et al. 2006 — PMID unverified); magnitudes have
    // no empirical basis at individual level. Population-level rank-order stability data cannot
    // be directly translated to individual within-person change rates.
    // Check only once per game-week (168h = 10080 min) to avoid per-tick overhead.
    {
      const currentWeek = Math.floor(s.time / 10080);
      if (currentWeek > s.personality_drift_week) {
        const weeksElapsed = currentWeek - s.personality_drift_week;
        s.personality_drift_week = currentWeek;

        // Maximum drift per week (0.2 pts). τ_effective ≈ 180 days for a 10-point shift.
        // Approximation debt (personality drift): 0.2 pts/week max rate chosen; model-internal
        // parameter calibrated to produce plausible year-scale shifts (~10 pts/year at sustained
        // pressure). No within-person longitudinal rate data available at this granularity.
        const maxDriftPerWeek = 0.2;

        // --- neuroticism ---
        // Pulled up by sustained overwhelming or strained stress.
        // Pulled down by sustained social connection and by age (maturation effect).
        {
          let neuroTarget = s.neuroticism;
          const stress = stressTier();
          if (stress === 'overwhelmed') neuroTarget += 0.01 * weeksElapsed;
          else if (stress === 'strained') neuroTarget += 0.005 * weeksElapsed;
          if (s.social > 60) neuroTarget -= 0.003 * weeksElapsed;
          const ageS = ageStageTier();
          if (ageS === 'adult' || ageS === 'midlife') neuroTarget -= 0.001 * weeksElapsed;
          const neuroClampLo = Math.max(0,   s.base_neuroticism - 20);
          const neuroClampHi = Math.min(100, s.base_neuroticism + 20);
          const neuroMaxStep = maxDriftPerWeek * weeksElapsed;
          const neuroDelta = Math.max(-neuroMaxStep, Math.min(neuroMaxStep, neuroTarget - s.neuroticism));
          s.neuroticism = Math.max(neuroClampLo, Math.min(neuroClampHi, s.neuroticism + neuroDelta));
        }

        // --- self_esteem ---
        // Pulled up by solid or valued job standing.
        // Pulled down by at_risk job standing and sustained overwhelming stress.
        {
          let seTarget = s.self_esteem;
          const job = jobTier();
          if (job === 'solid' || job === 'valued') seTarget += 0.003 * weeksElapsed;
          else if (job === 'at_risk') seTarget -= 0.005 * weeksElapsed;
          if (stressTier() === 'overwhelmed') seTarget -= 0.003 * weeksElapsed;
          const seClampLo = Math.max(0,   s.base_self_esteem - 20);
          const seClampHi = Math.min(100, s.base_self_esteem + 20);
          const seMaxStep = maxDriftPerWeek * weeksElapsed;
          const seDelta = Math.max(-seMaxStep, Math.min(seMaxStep, seTarget - s.self_esteem));
          s.self_esteem = Math.max(seClampLo, Math.min(seClampHi, s.self_esteem + seDelta));
        }

        // --- rumination ---
        // Pulled up by sustained negative mood (moodTone() low or heavy).
        // Pulled down by high social connection.
        {
          let rumTarget = s.rumination;
          const mood = moodTone();
          // 'heavy', 'hollow', 'numb', 'fraying' represent sustained negative mood states.
          // 'low' is not a valid moodTone() return value; 'heavy' and 'hollow' are the
          // equivalents (low serotonin/dopamine with/without social isolation component).
          if (['heavy', 'hollow', 'numb', 'fraying'].includes(mood)) rumTarget += 0.004 * weeksElapsed;
          if (s.social > 70) rumTarget -= 0.002 * weeksElapsed;
          const rumClampLo = Math.max(0,   s.base_rumination - 20);
          const rumClampHi = Math.min(100, s.base_rumination + 20);
          const rumMaxStep = maxDriftPerWeek * weeksElapsed;
          const rumDelta = Math.max(-rumMaxStep, Math.min(rumMaxStep, rumTarget - s.rumination));
          s.rumination = Math.max(rumClampLo, Math.min(rumClampHi, s.rumination + rumDelta));
        }

        // --- trait_loneliness ---
        // Pulled up by sustained low social (< 20) over many days.
        // Pulled down by sustained high connection_depth (> 60).
        // Note: social < 20 for 7+ days is a strong signal; we approximate by checking
        // current social at the week boundary. Extended low social produces the effect over
        // multiple weekly checks rather than requiring a continuous-window accumulator.
        {
          let tlTarget = s.trait_loneliness;
          if (s.social < 20) tlTarget += 0.003 * weeksElapsed;
          if (s.connection_depth > 60) tlTarget -= 0.002 * weeksElapsed;
          const tlClampLo = Math.max(0,   s.base_trait_loneliness - 20);
          const tlClampHi = Math.min(100, s.base_trait_loneliness + 20);
          const tlMaxStep = maxDriftPerWeek * weeksElapsed;
          const tlDelta = Math.max(-tlMaxStep, Math.min(tlMaxStep, tlTarget - s.trait_loneliness));
          s.trait_loneliness = Math.max(tlClampLo, Math.min(tlClampHi, s.trait_loneliness + tlDelta));
        }

        // --- introversion ---
        // Extraversion (inverse of introversion) shows modest mean-level decline in social vitality
        // across adulthood; Roberts, Walton & Viechtbauer 2006 meta-analysis (PMID 16435954) found
        // social vitality increases in young adulthood then slowly decreases in older age.
        // Social burnout (sustained social_energy depletion) nudges introversion up — withdrawal
        // becomes the path of least resistance. Sustained high social engagement nudges it slightly
        // down. Age effect: mild upward drift in adult/midlife (approximates the population-level
        // decrease in social vitality found in Roberts et al. 2006).
        // Approximation debt (personality drift): 0.002 pts/week rate chosen; no individual-level
        // empirical basis. Direction from Roberts et al. 2006 PMID 16435954.
        // Clamp ±15 from chargen baseline (introversion more stable than neuroticism).
        {
          // Approximation debt (personality drift): social_energy < 20 as burnout proxy; threshold
          // and magnitude not empirically calibrated at individual level.
          let introTarget = s.introversion;
          const introMaxStep = 0.002 * weeksElapsed;  // ~0.1 pts/month max
          if (s.social_energy < 20) introTarget += 0.002 * weeksElapsed;
          else if (s.social_energy > 70 && s.social > 60) introTarget -= 0.001 * weeksElapsed;
          const ageStageI = ageStageTier();
          if (ageStageI === 'adult' || ageStageI === 'midlife') introTarget += 0.001 * weeksElapsed;
          const introClampLo = Math.max(0,   s.base_introversion - 15);
          const introClampHi = Math.min(100, s.base_introversion + 15);
          const introDelta = Math.max(-introMaxStep, Math.min(introMaxStep, introTarget - s.introversion));
          s.introversion = Math.max(introClampLo, Math.min(introClampHi, s.introversion + introDelta));
        }

        // --- sensory_sensitivity ---
        // Sensory Processing Sensitivity (SPS) is highly stable — Aron & Aron 1997 (PMID 9248053)
        // frame it as a constitutional trait with genetic/neurobiological underpinnings. No
        // longitudinal change data available at the individual level. However, burnout and chronic
        // high-stress states are associated clinically with heightened hypervigilance and sensory
        // overload. Extended low-stress periods allow very slow drift back toward baseline.
        // Approximation debt (personality drift): 0.001/week rate chosen; SPS longitudinal stability
        // data not available. Direction from clinical burnout/hypervigilance literature (no PMID —
        // mechanism is NE hyperactivation under chronic stress). Scale is −1.0 to +1.0, so
        // 0.001/week ≈ 0.052/year — much slower than the 0-100 trait rates above.
        // Clamp ±0.10 from chargen baseline (tighter than introversion — SPS is more stable).
        {
          let ssTarget = s.sensory_sensitivity;
          const ssMaxStep = 0.001 * weeksElapsed;  // ~0.05/year max
          if (['strained', 'overwhelmed'].includes(stressTier())) ssTarget += 0.001 * weeksElapsed;
          else if (stressTier() === 'calm') ssTarget -= 0.0005 * weeksElapsed;
          const ssClampLo = s.base_sensory_sensitivity - 0.10;
          const ssClampHi = s.base_sensory_sensitivity + 0.10;
          const ssDelta = Math.max(-ssMaxStep, Math.min(ssMaxStep, ssTarget - s.sensory_sensitivity));
          s.sensory_sensitivity = Math.max(ssClampLo, Math.min(ssClampHi, s.sensory_sensitivity + ssDelta));
        }
      }
    }

    // Item disorder drift — apartment spots drift toward personality-driven equilibrium.
    ctx.items.advanceDisorder(hours);
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

  /** True if tod falls within [start, end), handling overnight shifts (end < start). */
  function withinShift(tod, start, end) {
    return end < start
      ? (tod >= start || tod < end)   // overnight: wraps midnight
      : (tod >= start && tod < end);  // same-day: standard range
  }

  /** True when the character's labor arrangement is gig work (no fixed shifts, no employer). */
  function isGigWorker() {
    return s.labor_arrangement?.type === 'gig';
  }

  /** True when the character is a freelancer (self-directed project work). */
  function isFreelancer() {
    return s.labor_arrangement?.type === 'flexible';
  }

  /** True when the character does informal/cash work (no employer, no platform). */
  function isInformalWorker() {
    return ctx.character.get('job_type') === 'informal';
  }

  /** True when the character is unemployed (no income source, looking or not looking).
   *  Also true when terminated mid-run (terminated state flag overrides job_type). */
  function isUnemployed() {
    if (s.terminated) return true;
    return ctx.character.get('job_type') === 'unemployed';
  }

  /** True when the character cannot work due to disability or chronic illness. */
  function cantWork() {
    return ctx.character.get('job_type') === 'cant_work';
  }

  /** True when the character has an employer relationship (job_standing applies).
   *  Returns false when terminated mid-run. */
  function hasEmployer() {
    if (s.terminated) return false;
    return !isGigWorker() && !isFreelancer() && !isInformalWorker() && !isUnemployed() && !cantWork();
  }

  /** True when the character was terminated during this run (not starting unemployed). */
  function isTerminated() {
    return s.terminated === true;
  }

  /**
   * Freelance project progress tier.
   * @returns {'no_project' | 'early' | 'midway' | 'almost_done' | 'complete'}
   */
  function freelanceProgressTier() {
    if (!s.freelance_project_active) return 'no_project';
    const p = s.freelance_project_progress;
    if (p >= 100) return 'complete';
    if (p >= 70) return 'almost_done';
    if (p >= 30) return 'midway';
    return 'early';
  }

  function isWorkHours() {
    const tod = timeOfDay();
    const today = currentAbsoluteDay();
    const shift = shiftFor(today);
    if (shift && withinShift(tod, shift.start, shift.end)) return true;
    // For overnight shifts that started yesterday: check previous day's shift.
    // An overnight shift (end < start, e.g. 22:00–06:00) started on day N spans into day N+1.
    // At 3am on day N+1, today's shift returns null but yesterday's shift covers this tod.
    const prevShift = shiftFor(today - 1);
    if (prevShift && prevShift.end < prevShift.start) {
      // Only applicable when tod is in the early-morning wrap portion (tod < end)
      if (withinShift(tod, prevShift.start, prevShift.end)) return true;
    }
    return false;
  }

  /**
   * True when the character is currently in their on-call window.
   * On-call windows may wrap midnight; withinShift handles that.
   */
  function isOnCallPeriod() {
    const arr = s.labor_arrangement;
    if (!arr.on_call || arr.on_call_start == null || arr.on_call_end == null) return false;
    if (isWorkHours()) return false;
    const tod = timeOfDay();
    return withinShift(tod, arr.on_call_start, arr.on_call_end);
  }

  function isLateForWork() {
    if (!isWorkday()) return false;
    const shift = shiftFor(currentAbsoluteDay());
    if (!shift) return false;
    const tod = timeOfDay();
    const wps = s.wake_period_start;
    return tod > shift.start + 15
      && !ctx.events.any('arrived_at_work', wps)
      && !ctx.events.any('called_in_sick', wps);
  }

  /** Called when the player wakes from sleep. Resets per-wake-period state. */
  function wakeUp() {
    // Continuous state that persists through sleep: dressed, hygiene_level.
    // Per-wake-period dedup state eliminated — use event log queries against wake_period_start instead.
    // Sleep-model items (nausea, social energy, caffeine habit, dental floor, daylight_exposure)
    // live in processSleepEnd().
    s.wake_period_start = s.time;
    s.location_arrival_time = s.time; // sleep resets bedroom familiarity

    // Gym check-ins — reset weekly (day % 7 === 0).
    // Approximation debt (gym): weekly boundary uses absolute game-day modulo 7; not calendar-week-aligned.
    if (currentAbsoluteDay() % 7 === 0) {
      s.gym_checkins_this_week = 0;
    }

    // Health trajectory — per-wake-period flags cleared on waking.
    s.heds_new_joint_today = false;
    s.migraine_quiet_resolved = false;
  }
    // On-call — reset per wake period
    s.on_call_checked_today = false;

  /**
   * Called at the end of sleep processing, before wakeUp(). Handles state changes that
   * belong to the sleep model — things that happen *during* sleep rather than upon waking.
   */
  function processSleepEnd() {
    // Daylight exposure — reset each sleep so the new wake period starts from zero.
    // Kept as a stored accumulator (not derived) because content interactions apply discrete
    // adjustments (+30 outdoor light therapy, -3 evening phone use) that are not tick-based
    // and cannot be cheaply reconstructed from event records.
    s.daylight_exposure = 0;
    // Clear pending vomit — sleep resolves nausea
    s.pending_vomit = false;
    // Sensory load — sleep fully clears accumulated stimulation.
    // Real phenomenon: sleep is the primary recovery mechanism for sensory overload
    // (Raymaker 2020 DOI 10.1177/1362361320925095). Bedroom during sleep has
    // near-zero stimulation; advanceTime already drifts load toward ~0, but
    // explicit clear ensures no residual tail from rounding.
    s.sensory_load = 0;
    // Social energy — sleep fully restores (advanceTime recovers at 3 pts/hr during sleep;
    // this clamps to 100 to model sleep as a complete social-depletion reset)
    s.social_energy = 100;
    // Masking fatigue — sleep fully clears accumulated masking cost.
    // Hull 2017 DOI 10.1177/1362361316671012 (need for recovery after camouflaging).
    s.masking_fatigue = 0;
    // Code-switching fatigue — sleep fully clears. The cognitive load of navigating
    // dominant-culture spaces resets overnight, same as social energy.
    s.code_switching_fatigue = 0;
    // Caffeine habit — update from previous wake period's peak, then reset for next period.
    // Build: +5/day → habit reaches 100 in ~20 days of daily use, matching the real
    // 2-week tolerance development timeline (Beaumont et al. 2017 PMID 27762662;
    // PLOS ONE 2019 PMC6343867).
    // Fade: -4/day → 25-day washout from habit=100, consistent with 7–14 day adenosine
    // receptor density normalization (Circulation 2000, doi 10.1161/01.CIR.102.3.285)
    // and up to 25 days for heavy users.
    // Previous rates (+8/−5) compressed real timelines by ~35%.
    if (s.caffeine_today_peak >= 40) {
      s.caffeine_habit = Math.min(100, s.caffeine_habit + 5);
    } else {
      s.caffeine_habit = Math.max(0, s.caffeine_habit - 4);
    }
    s.caffeine_today_peak = 0;
    // Nicotine habit — update from wake period peak, then reset.
    // Build: +6/day when peak ≥ 25 → habit reaches 100 in ~17 days of daily use.
    // Fade: -3/day → ~33-day washout from habit=100.
    // Real nicotine tolerance develops within days; full dependence ~2 weeks (DSM-5).
    // Approximation debt (nicotine): build +6, fade -3 chosen to fit 2-week onset window;
    // not derived from nAChR receptor density data. DSM-5 full dependence develops in ~2 weeks
    // of daily use. nAChR upregulation begins within hours of first exposure and saturates over
    // days (Govind et al. 2009 PMC2728164 — confirmed: "Nicotine-induced upregulation of nicotinic
    // receptors," Biochem Pharmacol 78(7):756-65). No per-cigarette receptor density curve exists.
    if (s.nicotine_today_peak >= 25) {
      s.nicotine_habit = Math.min(100, s.nicotine_habit + 6);
    } else {
      s.nicotine_habit = Math.max(0, s.nicotine_habit - 3);
    }
    s.nicotine_today_peak = 0;
    // Alcohol tolerance — builds with heavy use, fades slowly.
    // Defined as "heavy use" = alcohol_sleep_flag was set (drank before sleeping this session).
    // Approximation debt (alcohol): +3/day heavy use, −1/day abstinent chosen.
    // Real tolerance develops over weeks-months of heavy daily drinking.
    // GABA-A downregulation timeline: days to weeks (Valenzuela 1997 PMID 15704351).
    if (s.alcohol_sleep_flag) {
      s.alcohol_tolerance = Math.min(100, s.alcohol_tolerance + 3);
    } else if (s.alcohol_level < 5) {
      s.alcohol_tolerance = Math.max(0, s.alcohol_tolerance - 1);
    }
    // REM rebound flag — set when THIS sleep had REM suppression (alcohol or cannabis).
    // Must capture before clearing either flag. Content.js reads rem_rebound_pending BEFORE
    // processSleepEnd() on the NEXT sleep → true = last night had suppression → recovery night:
    // brain over-corrects with vivid, wrong-toned dreams.
    s.rem_rebound_pending = !!(s.cannabis_sleep_flag || s.alcohol_sleep_flag);
    s.alcohol_sleep_flag = false;
    // Alcohol withdrawal — during sleep, withdrawal continues to build if tolerance is high
    // and alcohol is cleared. Sleep doesn't reset withdrawal — the body doesn't know you're sleeping.
    // This is already handled by advanceTime during the sleep period.
    // On wake: if withdrawal is building, clear residual rebound effects will continue into waking.
    // (No special sleep reset needed — advanceTime runs during sleep and handles this correctly.)
    // Cannabis tolerance — builds with daily use, washes out over ~4 weeks of abstinence.
    // "Daily use" = cannabis_sleep_flag was set (used before sleeping this session).
    // CB1 receptor downregulation in daily smokers: 15–20% reduction, reversible in ~4 weeks
    // of monitored abstinence (Hirvonen 2012 PMID 21747398 — PET, N=30). Rapid partial recovery
    // begins within 2 days (D'Souza et al. 2016 PMC4742341). Tolerance scale 0–100:
    // +3/day → saturation in ~33 days of daily use (matches 2–4 week heavy-use tolerance onset).
    // −1.5/day → full washout in ~67 days at high tolerance (within the 4-week observed +
    // longer hippocampal recovery tail from Hirvonen).
    // Approximation debt (cannabis): exact per-session CB1 downregulation rate not derivable
    // from PET data; rates calibrated to match observed population-level tolerance timelines.
    if (s.cannabis_sleep_flag) {
      s.cannabis_tolerance = Math.min(100, s.cannabis_tolerance + 3);
    } else if (s.cannabis_level < 5) {
      s.cannabis_tolerance = Math.max(0, s.cannabis_tolerance - 1.5);
    }
    s.cannabis_sleep_flag = false;
    // Cannabis withdrawal — continues building during sleep if tolerance is high and cannabis cleared.
    // Opioid tolerance — builds faster than other substances (rapid mu-opioid receptor desensitization).
    // Build: +4/day when peak ≥ 20 → tolerance reaches 100 in ~25 days of daily use.
    // Fade: −1/day → ~100-day washout. Slow reversal: mu-opioid resensitization takes months.
    // Approximation debt (opioids): build +4, fade −1 chosen; direction from rapid mu-opioid
    // receptor desensitization (Williams et al. 2013 PMID 23321159) and clinical observation
    // that tolerance develops within days of regular use (Trescot et al. 2008 PMID 18443637);
    // resensitization takes months in chronic users; no per-day rate data exists.
    if (s.opioid_today_peak >= 20) {
      s.opioid_tolerance = Math.min(100, s.opioid_tolerance + 4);
    } else {
      s.opioid_tolerance = Math.max(0, s.opioid_tolerance - 1);
    }
    s.opioid_today_peak = 0;
    // Dental — underlying condition means you always wake with at least a dull ache
    if (s.health_conditions.includes('dental_pain')) {
      s.dental_ache = Math.max(s.dental_ache, 8);
    }
    // Gastritis — wake with baseline epigastric pain: stomach has been empty through the night.
    // The characteristic gastritis pattern: worst in the morning before eating.
    // Approximation debt (gastritis): morning baseline 35 chosen; fasted gastric acid exposure
    //   overnight produces notable but not severe pain before first meal. Direction is standard
    //   clinical knowledge (Talley & Vakil 2005 dyspepsia guidelines PMID 16181387); no
    //   quantitative morning-pain-level data for chronic gastritis patients exists.
    if (s.health_conditions.includes('gastritis')) {
      s.gastritis_pain = Math.max(s.gastritis_pain, 35);
    }
    // Menstrual cycle — cycle day is now derived from (time - cycle_start_time) / 1440,
    // so no per-sleep advancement is needed. Cramps and supply state update continuously
    // in advanceTime(). Reset the supply consumption timer so rate starts fresh on waking.
    if (s.cycle_start_time !== null) {
      s.period_supply_last_consumed = s.time;
    }
  }

  // --- Scheduled interrupt queue ---

  /**
   * Returns the next absolute game-time when the given time-of-day (minutes since midnight)
   * will occur, at or after the current time. If already at that tod, schedules for tomorrow.
   * @param {number} tod
   */
  function nextAbsoluteForTod(tod) {
    const currentTod = s.time % 1440;
    const minutesUntil = ((tod - currentTod) + 1440) % 1440;
    return s.time + (minutesUntil === 0 ? 1440 : minutesUntil);
  }

  /**
   * Schedule an interrupt. Replaces any existing interrupt with the same id.
   * @param {string} id
   * @param {number} triggerAt Absolute game-time when this fires
   * @param {string} type
   * @param {any} [data]
   */
  function scheduleInterrupt(id, triggerAt, type, data) {
    s.scheduled_interrupts = s.scheduled_interrupts.filter(i => i.id !== id);
    s.scheduled_interrupts.push({ id, triggerAt, type, data: data ?? {}, fired: false });
  }

  /** @param {string} id */
  function cancelInterrupt(id) {
    s.scheduled_interrupts = s.scheduled_interrupts.filter(i => i.id !== id);
  }

  /**
   * Move an interrupt to a new trigger time and clear its fired flag.
   * @param {string} id @param {number} newTriggerAt
   */
  function rescheduleInterrupt(id, newTriggerAt) {
    const entry = s.scheduled_interrupts.find(i => i.id === id);
    if (entry) { entry.triggerAt = newTriggerAt; entry.fired = false; }
  }

  /** @param {string} id @returns {{ id: string, triggerAt: number, type: string, data: any, fired?: boolean } | null} */
  function getInterrupt(id) {
    return s.scheduled_interrupts.find(i => i.id === id) ?? null;
  }

  /** @param {string} id */
  function hasInterrupt(id) {
    return s.scheduled_interrupts.some(i => i.id === id);
  }

  /**
   * Fire all interrupts whose triggerAt <= current time and haven't already fired.
   * Marks them fired=true to prevent re-fire. Returns the list.
   * Callers are responsible for rescheduling or cancelling via rescheduleInterrupt/cancelInterrupt.
   * @returns {{ id: string, triggerAt: number, type: string, data: any }[]}
   */
  function fireScheduledInterrupts() {
    const fired = [];
    for (const interrupt of s.scheduled_interrupts) {
      if (!interrupt.fired && interrupt.triggerAt <= s.time) {
        interrupt.fired = true;
        fired.push(interrupt);
      }
    }
    return fired;
  }

  /**
   * Schedule the next upcoming personal calendar alert interrupt.
   * Fires at 9:00 AM on the day of the event (morning reminder).
   * Only one calendar_alert interrupt is active at a time — fires, then the next is scheduled.
   */
  function scheduleNextCalendarAlert() {
    const events = s.personal_calendar;
    if (!events || events.length === 0) return;

    const cd = calendarDate();
    const currentYear = cd.year;
    const now = s.time;

    // Find the next event by computing absolute trigger time for each event
    // in the current year and next year, then picking the soonest one after now.
    let bestTrigger = Infinity;
    let bestIdx = -1;

    for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
      const year = currentYear + yearOffset;
      for (let i = 0; i < events.length; i++) {
        const evt = events[i];
        // Compute absolute game-time for 9:00 AM on the event day
        const eventDate = new Date(Date.UTC(year, evt.month, evt.day, 9, 0));
        const eventAbsMinutes = Math.floor(eventDate.getTime() / 60000) - s.start_timestamp;
        if (eventAbsMinutes > now && eventAbsMinutes < bestTrigger) {
          bestTrigger = eventAbsMinutes;
          bestIdx = i;
        }
      }
    }

    if (bestIdx >= 0) {
      scheduleInterrupt('calendar_alert', bestTrigger, 'calendar_alert', {
        eventIndex: bestIdx,
        label: events[bestIdx].label,
        type: events[bestIdx].type,
        month: events[bestIdx].month,
        day: events[bestIdx].day,
      });
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

  function hygieneTier() {
    return tier(s.hygiene_level, [
      [30, 'grimy'],
      [55, 'stale'],
      [80, 'okay'],
      [100, 'fresh'],
    ]);
  }

  function clothingCleanlinessTier() {
    return tier(s.clothing_cleanliness, [
      [35, 'dirty'],
      [60, 'stale'],
      [80, 'worn'],
      [100, 'fresh'],
    ]);
  }

  /**
   * Composite appearance tier — combines hygiene, clothing cleanliness, and visible clothing
   * damage into a single social-legibility signal. Driven by whichever dimension is worst.
   *
   * Tiers:
   *   'presentable' — hygiene okay/fresh AND clothing worn/fresh AND no visible damage
   *   'slipping'    — hygiene stale OR clothing stale
   *   'notable'     — hygiene grimy OR clothing dirty OR visible damage (one dimension clearly off)
   *   'severe'      — hygiene grimy AND (clothing dirty OR visible damage)
   *
   * Used by talk_to_coworker, coworker_speaks, advanceTime job_standing drift, and
   * idle thoughts for appearance self-consciousness.
   * clothing_visible_damage: set by content.js after applyDamage on a worn outer garment.
   */
  function appearanceAwareness() {
    const h = hygieneTier();
    const c = clothingCleanlinessTier();
    const hasVisibleDamage = s.clothing_visible_damage && s.dressed;
    const hygieneGrimy  = h === 'grimy';
    const hygieneLow    = hygieneGrimy || h === 'stale';
    const clothingDirty = c === 'dirty' || hasVisibleDamage;
    const clothingLow   = clothingDirty || c === 'stale';
    if (hygieneGrimy && clothingDirty) return 'severe';
    if (hygieneGrimy || clothingDirty)  return 'notable';
    if (hygieneLow   || clothingLow)    return 'slipping';
    return 'presentable';
  }

  function skinConditionTier() {
    return tier(s.skin_condition, [
      [20, 'cracked'],
      [45, 'tight'],
      [70, 'dry'],
      [100, 'healthy'],
    ]);
  }

  // Approximation debt (skin condition): skin_condition recovery (+3–4/night) and shower costs (-1/-5/-8/+1) chosen.
  // No literature basis; real skin barrier recovery depends on trans-epidermal water loss, sleep
  // duration, and stratum corneum lipid synthesis, none of which are modeled explicitly.
  function adjustSkinCondition(delta) {
    s.skin_condition = Math.max(0, Math.min(100, s.skin_condition + delta));
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

  /**
   * Masking fatigue tier — qualitative level of accumulated camouflaging cost.
   * Only meaningful for autistic/ADHD characters; returns 'none' otherwise.
   * @returns {'none'|'low'|'moderate'|'high'|'critical'}
   */
  function maskingFatigueTier() {
    if (!(s.autism ?? false) && !(s.adhd ?? false)) return 'none';
    return tier(s.masking_fatigue, [
      [15, 'none'],
      [35, 'low'],
      [55, 'moderate'],
      [75, 'high'],
      [100, 'critical']
    ]);
  }

  /** @returns {'rested' | 'aware' | 'strained' | 'depleted'} */
  function codeSwitchingFatigueTier() {
    return /** @type {'rested' | 'aware' | 'strained' | 'depleted'} */ (tier(s.code_switching_fatigue, [
      [20, 'rested'],
      [45, 'aware'],
      [70, 'strained'],
      [100, 'depleted']
    ]));
  }

  function connectionDepthTier() {
    if (s.connection_depth < 20) return 'hollow';
    if (s.connection_depth < 45) return 'surface';
    if (s.connection_depth < 70) return 'present';
    return 'deep';
  }

  /**
   * Recognition tier for a named location based on lifetime visit count.
   * Three tiers: stranger / familiar / regular.
   * @param {'corner_store'|'soup_kitchen'|'food_bank'|'street'|'bus_stop'|'shelter'} locationId
   * @returns {'stranger'|'familiar'|'regular'}
   */
  function locationVisitTier(locationId) {
    const key = locationId + '_visits';
    const visits = s[key] ?? 0;
    // Approximation debt (reputation): thresholds 5 and 20 chosen to place
    // ~1 week of daily visits at familiar, ~1 month at regular. No empirical
    // data on face-recognition thresholds in low-stakes commercial encounters.
    if (visits < 5) return 'stranger';
    if (visits < 20) return 'familiar';
    return 'regular';
  }

  /**
   * How well the character knows their recurring block neighbor.
   * Based on encounter count — times seen at street during daytime hours.
   * @returns {'unseen'|'seen'|'recognized'|'known'}
   */
  function neighborTier() {
    const enc = s.neighbor_encounters ?? 0;
    if (enc === 0) return 'unseen';
    if (enc < 5)  return 'seen';
    if (enc < 15) return 'recognized';
    return 'known';
  }

  /**
   * How well the character knows the bus stop regular.
   * Based on morning commute encounters (7-9 AM arrivals at bus_stop).
   * @returns {'unknown'|'recognized'|'familiar'}
   */
  function busRegularTier() {
    const enc = s.bus_regular_encounters ?? 0;
    // Approximation debt (reputation): thresholds 5 and 15 chosen; no empirical data
    // on commuter micro-community recognition thresholds.
    if (enc < 5)  return 'unknown';
    if (enc < 15) return 'recognized';
    return 'familiar';
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

  /**
   * Pattern tier for work incidents in the last 30 game-days.
   * Looks at all work_incident events (late_arrival, poor_performance, missed_shift, called_in_sick).
   * Returns 'none' (0-2), 'pattern' (3-4), or 'severe_pattern' (5+).
   * Used as a multiplier on job_standing penalties: pattern → 1.5×, severe_pattern → 2×.
   * Approximation debt (job standing): 30-day window, 3/5 incident thresholds, and 1.5×/2× multipliers chosen.
   * Real workplace pattern detection varies by employer, industry, and union status.
   * @returns {'none' | 'pattern' | 'severe_pattern'}
   */
  function workIncidentPatternTier() {
    if (!hasEmployer()) return 'none';
    const thirtyDaysAgo = s.time - 30 * 24 * 60;
    const count = ctx.events.count('work_incident', thirtyDaysAgo);
    if (count >= 5) return 'severe_pattern';
    if (count >= 3) return 'pattern';
    return 'none';
  }

  /**
   * Multiplier for job_standing penalties based on work incident pattern.
   * @returns {number}
   */
  function workIncidentMultiplier() {
    const pattern = workIncidentPatternTier();
    if (pattern === 'severe_pattern') return 2;
    if (pattern === 'pattern') return 1.5;
    return 1;
  }

  /** Phone age tier — drives loading prose and idle thought eligibility.
   *  @returns {'new' | 'recent' | 'aging' | 'old' | 'ancient'} */
  function phoneAgeTier() {
    const years = s.phone_age_days / 365;
    if (years < 1) return 'new';
    if (years < 2) return 'recent';
    if (years < 3) return 'aging';
    if (years < 4) return 'old';
    return 'ancient';
  }

  /** Phone slowness tier — derived from model's initial age plus a slow in-game aging rate.
   *  Performance degrades more slowly than battery (software / hardware bottleneck builds
   *  over years of OS updates rather than per-day charge cycles).
   *  effective_age = phone_model_age_years + (game_days_played / 30) * 0.1
   *  Thresholds: fast <2yr, fine 2–3yr, slow 3–5yr, sluggish >5yr.
   *  Approximation debt (phone aging): aging rate 0.1yr/30 days chosen; real performance
   *  degradation depends on OS update frequency, storage fragmentation, and app bloat
   *  relative to hardware capability — not modeled individually.
   *  @returns {'fast' | 'fine' | 'slow' | 'sluggish'} */
  function phoneSlownessTier() {
    const gameDaysPlayed = s.time / 1440;
    const effectiveAge = s.phone_model_age_years + (gameDaysPlayed / 30) * 0.1;
    if (effectiveAge < 2) return 'fast';
    if (effectiveAge < 3) return 'fine';
    if (effectiveAge < 5) return 'slow';
    return 'sluggish';
  }

  function batteryTier() {
    if (s.phone_battery <= 0) return 'dead';
    if (s.phone_battery <= 5) return 'critical';
    if (s.phone_battery <= 15) return 'low';
    if (s.phone_battery <= 50) return 'good';
    return 'full';
  }

  /** Maximum charge the battery can currently hold — equals battery_health. */
  function effectiveBatteryMax() {
    return s.battery_health;
  }

  /**
   * Signal bars at current location.
   * Returns integer 0 (no signal) through 5 (full bars).
   * Pure derived function — reads location, weather, building type. Never stored.
   *
   * Base signal by location type:
   *   4 — indoor residential (apartment rooms, friend's place)
   *   4 — indoor commercial (workplace main floor, corner store, library, clinic, soup kitchen, food bank)
   *   3 — outdoor urban (street, bus stop)
   *   2 — outdoor peripheral (park — farther from towers)
   *   2 — deep interior / shielded (workplace bathroom, shelter — concrete/basement)
   *
   * Weather modifier (outdoor and lightly shielded locations only):
   *   clear/grey: +0, overcast: +0, drizzle: -1, snow: -2
   *   Rain attenuation is real — water absorbs RF energy; snow is worse due to
   *   combined absorption and scattering (especially at higher frequency bands).
   *   Approximation debt (phone signal): attenuation magnitude depends on frequency band
   *   and precipitation rate — not modeled at that resolution.
   *
   * Building modifier:
   *   Concrete/steel structures (workplace, shelter): -1
   *   Residential (apartment, friend's): -0 (lighter construction)
   *   Approximation debt (phone signal): building construction material not modeled per-location;
   *   workplace and shelter assumed concrete, apartment assumed frame/drywall.
   */
  function phoneSignal() {
    const loc = s.location;
    const weather = s.weather;

    // Base signal by location.
    // Measured outdoor-to-indoor attenuation 6–27 dB depending on building construction
    // (Liangh et al. 2015, ResearchGate 273061971; Alejos et al. 2008 IEEE TAP NIST pub_id=33178).
    // Concrete/masonry gives ~10–20 dB loss; typical residential (drywall/wood) ~3–10 dB.
    // Approximation debt (phone signal): location tiers chosen; real signal depends on carrier,
    // building construction, and distance to tower — not modeled at this level.
    let base;
    const deepInterior = ['workplace_bathroom', 'shelter'];
    const outdoorPeripheral = ['park'];
    const outdoorUrban = ['street', 'bus_stop'];
    if (deepInterior.includes(loc)) {
      base = 2;
    } else if (outdoorPeripheral.includes(loc)) {
      base = 3;
    } else if (outdoorUrban.includes(loc)) {
      base = 4;
    } else {
      // Indoor residential/commercial: apartment rooms, workplace, corner store, library, etc.
      base = 4;
    }

    // Weather modifier — precipitation degrades signal at exposed and lightly shielded locations.
    // Rain fade at sub-6 GHz (LTE/4G) is negligible per path (<0.1 dB/km; ITU-R P.838).
    // The penalty models perception rather than physics: users report worse connections in rain
    // because of atmospheric multipath and wet antenna effects, not bulk rain attenuation.
    // At 28 GHz (5G mmWave) rain fade is ~5 dB/km (Nandi 2018); effect is real for mmWave
    // but overstated for LTE; frequency band not tracked.
    // Deep interior already at 2; weather doesn't make it worse (already shielded from sky).
    const weatherExposed = !['apartment_bedroom', 'apartment_bathroom', 'apartment_kitchen',
      'apartment_living_room'].includes(loc);
    if (weatherExposed) {
      if (weather === 'snow') base -= 2;
      else if (weather === 'drizzle') base -= 1;
    }

    // Concrete building penalty — workplace main floor and shelter have heavier construction
    const concrete = ['workplace', 'shelter'];
    if (concrete.includes(loc)) base -= 1;

    return Math.max(0, Math.min(5, base));
  }

  /**
   * Qualitative signal tier for prose branching.
   * 'none' (0), 'poor' (1), 'weak' (2), 'fair' (3), 'good' (4), 'full' (5).
   * @returns {'none'|'poor'|'weak'|'fair'|'good'|'full'}
   */
  function phoneSignalTier() {
    const sig = phoneSignal();
    if (sig === 0) return 'none';
    if (sig === 1) return 'poor';
    if (sig === 2) return 'weak';
    if (sig === 3) return 'fair';
    if (sig === 4) return 'good';
    return 'full';
  }

  function moneyTier() {
    if (s.money < 0) return 'overdrawn';
    if (s.money === 0) return 'broke';
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

  function sleepInertiaTier() {
    const i = s.sleep_inertia;
    if (i >= 0.4) return 'heavy';
    if (i >= 0.2) return 'moderate';
    if (i >= 0.05) return 'mild';
    return 'none';
  }

  // --- Journal streak ---

  /**
   * Count consecutive days with journal entries, working backward from now.
   * A "day" has a journal entry if any entry falls within that calendar day
   * (midnight-to-midnight in game time). Returns 0 if no entries or last
   * entry was not today or yesterday.
   */
  function journalStreakDays() {
    const entries = s.journal_entries;
    if (entries.length === 0) return 0;
    const now = s.time;
    const dayLen = 24 * 60; // minutes per day
    const currentDay = Math.floor(now / dayLen);
    // Build set of days that have entries
    /** @type {Set<number>} */
    const daysWithEntries = new Set();
    for (const e of entries) {
      daysWithEntries.add(Math.floor(e.timestamp / dayLen));
    }
    // Start from current day; if no entry today, try yesterday
    let startDay = currentDay;
    if (!daysWithEntries.has(startDay)) {
      startDay = currentDay - 1;
      if (!daysWithEntries.has(startDay)) return 0;
    }
    // Count consecutive days backward
    let streak = 0;
    for (let d = startDay; daysWithEntries.has(d); d--) {
      streak++;
    }
    return streak;
  }

  // --- Sensory load ---

  /**
   * Stimulation level for a location — how much sensory input the environment generates.
   * Workplace: crowded, fluorescent, social noise. Street: traffic, people, weather.
   * Apartment: controlled, quiet. Bathroom: enclosed, minimal stimulation.
   * Park/library: moderate-to-low — natural or intentionally quiet spaces.
   *
   * Returns 0–1 scale. Not stored — pure derived function.
   * Approximation debt (sensory load): per-location stimulation levels chosen; real environmental
   * noise depends on time of day, occupancy, weather, and building construction.
   * @param {string} [locationId]
   * @returns {number}
   */
  function locationStimulationLevel(locationId) {
    const loc = locationId ?? s.location;
    switch (loc) {
      case 'workplace':          return 0.75; // fluorescent lights, ambient chatter, task demands
      case 'corner_store':       return 0.65; // bright lights, beeping registers, strangers
      case 'street':             return 0.60; // traffic, pedestrians, weather
      case 'bus_stop':           return 0.55; // idling buses, wind, strangers nearby
      case 'soup_kitchen':       return 0.60; // crowded, clattering, social
      case 'food_bank':          return 0.50; // waiting, overhead lights, strangers
      case 'shelter':            return 0.55; // crowded, unpredictable sounds, strangers
      case 'gym':                return 0.60; // music, clanging, mirrors, other people
      case 'clinic':             return 0.50; // waiting room, bright, antiseptic
      case 'friends_apartment':  return 0.35; // familiar but not yours
      case 'apartment_kitchen':  return 0.30; // fridge hum, dishes, cooking sounds — yours
      case 'apartment_living_room': return 0.25; // familiar, controlled
      case 'apartment_bedroom':  return 0.15; // quiet, dark, yours
      case 'apartment_bathroom': return 0.15; // enclosed, minimal, yours
      case 'workplace_bathroom': return 0.25; // enclosed but not yours; fluorescent
      case 'park':               return 0.30; // natural sounds — generally soothing not aggravating
      case 'library':            return 0.20; // intentionally quiet, controlled
      default:                   return 0.40;
    }
  }

  /**
   * Sensory load tier — qualitative overload state.
   * Derived from sensory_load (0–100), which accumulates in advanceTime().
   *
   *   'comfortable' — sensory input is manageable
   *   'stimulated'  — awareness of the input; mild avoidance impulse
   *   'overloaded'  — too much; complex/social interactions unavailable
   *   'shutdown'    — protective shutdown; only basic survival actions remain
   *
   * @returns {'comfortable' | 'stimulated' | 'overloaded' | 'shutdown'}
   */
  function sensoryLoadTier() {
    const load = s.sensory_load;
    if (load >= 85) return 'shutdown';
    if (load >= 60) return 'overloaded';
    if (load >= 35) return 'stimulated';
    return 'comfortable';
  }

  /**
   * Age-stage tier — qualitative life-stage category derived from age_stage (years).
   * Used for deterministic prose shading at key sites. Never surfaces to player directly.
   *
   *   'young_adult' — 18–27: adulthood is still new; tiredness is surprising
   *   'adult'       — 28–39: familiar weight; no longer a mistake
   *   'midlife'     — 40–55: tiredness as permanent background, worked around
   *   'older'       — 56+  : the body sets the terms
   */
  function ageStageTier() {
    const age = s.age_stage ?? 35;
    if (age < 28) return 'young_adult';
    if (age < 40) return 'adult';
    if (age < 56) return 'midlife';
    return 'older';
  }

  /** Derived: is this character trans? Emergent from identity dimensions.
   *  binary_diversity > 60 (binary trans) or nonbinary_diversity > 40 (nonbinary/genderqueer).
   *  @returns {boolean} */
  function isTrans() {
    const g = s.gender;
    if (!g) return false;
    return g.binary_diversity > 60 || g.nonbinary_diversity > 40;
  }

  /** Derived: how the social world reads this character's gender presentation.
   *  Pure function — NOT stored state. Reads expression + body params + HRT.
   *  @returns {PerceivedPresentation} */
  function perceivedPresentation() {
    const g = s.gender;
    if (!g) return 'androgynous_read';
    let femSignal = g.expression_femininity;
    let mascSignal = g.expression_masculinity;

    // Body params shift perception: breast tissue, facial structure etc.
    // Approximation debt (identity): body→presentation mapping is a gross simplification.
    const breastScore = s.breast_tissue_score ?? 0;
    femSignal += breastScore * 0.2;

    // HRT shifts over time — estradiol increases fem read, testosterone increases masc read.
    // Approximation debt (identity): HRT perception shift magnitude not literature-derived.
    if (s.hrt_active && s.hrt_type === 'estradiol') {
      femSignal += 10;
    } else if (s.hrt_active && s.hrt_type === 'testosterone') {
      mascSignal += 10;
    }

    if (femSignal > mascSignal + 15) return 'fem_read';
    if (mascSignal > femSignal + 15) return 'masc_read';
    return 'androgynous_read';
  }

  /** Identity congruence — how well perceived presentation matches identity.
   *  High congruence = low distress. Low congruence = dysphoria territory.
   *  Returns 0-1 where 1 = perfect congruence.
   *  @returns {number} */
  function identityCongruence() {
    const g = s.gender;
    if (!g) return 1;
    const pres = perceivedPresentation();
    // For someone with high binary_diversity (trans), congruence depends on whether
    // perception aligns with their cross-gender identification.
    if (g.binary_diversity > 60) {
      // Binary trans: want to be read as opposite of ASAB.
      // If expression_femininity > expression_masculinity, they want fem_read.
      const wantsFem = g.expression_femininity > g.expression_masculinity;
      if (wantsFem && pres === 'fem_read') return 0.9;
      if (!wantsFem && pres === 'masc_read') return 0.9;
      if (pres === 'androgynous_read') return 0.5;
      return 0.2; // read as opposite of desired
    }
    if (g.nonbinary_diversity > 40) {
      // Nonbinary: androgynous_read is best; strongly gendered reads are less congruent.
      if (pres === 'androgynous_read') return 0.85;
      return 0.45;
    }
    // Cis: presentation usually matches ASAB, high congruence by default.
    return 0.95;
  }

  /**
   * Effective sexual attraction intensity, accounting for demisexual gating.
   * Returns 0-100. For allo characters, returns raw intensity unchanged.
   * For demi (gating === 'bond'), attraction activates only at connection_depth
   * 'present' or 'deep' — returns 0 otherwise. For gray (gating === 'rare'),
   * attraction is halved unless depth is 'present'/'deep'.
   * Pure derived function — reads attraction profile + connection_depth.
   * @returns {number} 0-100
   */
  function effectiveSexualAttraction() {
    const attr = s.attraction;
    if (!attr) return 50; // no profile yet — neutral default
    const gating = attr.sexual.gating;
    const intensity = attr.sexual.intensity;
    if (gating === 'none') return intensity;
    // Approximation debt (demi gating): 'present'/'deep' threshold is structural —
    // real demisexual activation is bond-specific, not global connection_depth.
    // connection_depth is a single aggregate; per-person bonds don't exist yet.
    const depthTier = connectionDepthTier();
    const bonded = depthTier === 'present' || depthTier === 'deep';
    if (gating === 'bond') {
      return bonded ? intensity : 0;
    }
    // gating === 'rare': gray-ace — reduced unless bonded
    // Approximation debt (gray-ace gating): 0.5 multiplier is arbitrary.
    return bonded ? intensity : Math.round(intensity * 0.5);
  }

  /** Derived: character experiences little to no sexual attraction.
   *  Threshold 15 matches chargen asexual archetype (intensity 5) and includes
   *  gray-ace range. Reads attraction profile.
   *  @returns {boolean} */
  // Approximation debt (ace threshold): intensity < 15 chosen to match chargen archetypes;
  // real ace spectrum is self-identified, not threshold-derived.
  function isAce() {
    const attr = s.attraction;
    if (!attr) return false;
    return attr.sexual.intensity < 15;
  }

  /** Derived: character experiences little to no romantic attraction.
   *  Threshold 15 matches chargen aromantic archetype (intensity 5).
   *  @returns {boolean} */
  // Approximation debt (aro threshold): intensity < 15 chosen to match chargen archetypes;
  // real aro spectrum is self-identified, not threshold-derived.
  function isAro() {
    const attr = s.attraction;
    if (!attr) return false;
    return attr.romantic.intensity < 15;
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

  /** Total number of cooking ingredient units across all pantry types. */
  function pantryTotal() {
    return Object.values(s.pantry).reduce((a, b) => a + b, 0);
  }

  /**
   * Qualitative level tier for a single pantry ingredient.
   * Maps integer unit count to a named tier:
   *   0        → 'empty'  (unavailable for cooking)
   *   1        → 'low'    (one use left — will be gone soon)
   *   2        → 'stocked' (a few uses, comfortable)
   *   3+       → 'full'   (well-supplied)
   * @param {string} ingredient
   * @returns {'full' | 'stocked' | 'low' | 'empty'}
   */
  function pantryLevel(ingredient) {
    const count = (s.pantry && s.pantry[ingredient]) || 0;
    if (count <= 0) return 'empty';
    if (count === 1) return 'low';
    if (count === 2) return 'stocked';
    return 'full';
  }

  /**
   * Reduce a pantry ingredient by the given number of units. Floors at 0.
   * @param {string} ingredient
   * @param {number} [amount=1]
   */
  function consumePantry(ingredient, amount = 1) {
    const current = (s.pantry && s.pantry[ingredient]) || 0;
    s.pantry = { ...s.pantry, [ingredient]: Math.max(0, current - amount) };
  }

  /**
   * Increase a pantry ingredient by the given number of units. Caps at 5.
   * @param {string} ingredient
   * @param {number} [amount=1]
   */
  function restockPantry(ingredient, amount = 1) {
    const current = (s.pantry && s.pantry[ingredient]) || 0;
    s.pantry = { ...s.pantry, [ingredient]: Math.min(5, current + amount) };
  }

  /** Snack availability tier for impulse eating. */
  function snackTier() {
    const count = s.pantry?.snacks || 0;
    if (count === 0) return 'none';
    if (count <= 2) return 'some';
    return 'stocked';
  }

  /**
   * Typographic intensity tier for inner voice rendering.
   * Returns null when NT state is calm — no inner voice surfaces.
   * Score-based: each destabilizing condition adds 1 point.
   * @returns {null | 'uneasy' | 'prominent' | 'tremor'}
   */
  function innerVoiceTier() {
    const gaRel  = s.gaba - s.gaba_baseline;                     // relative to baseline
    const neRel  = s.norepinephrine - s.norepinephrine_baseline;  // relative to baseline
    const serRel = s.serotonin - s.serotonin_baseline;            // relative to baseline
    let score = 0;
    if (gaRel < -10) score++;   // relative to baseline
    if (neRel > 15) score++;    // relative to baseline
    if (serRel < -15) score++;  // relative to baseline
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
      { name: 'phone',     amount: s.phone_bill_amount, offset: s.phone_bill_day_offset % 30, cycle: 30, last: s.last_phone_bill_day },
    ];
    // all_inclusive housing: no separate utility bill (bundled into rent)
    if (s.housing_type !== 'all_inclusive') {
      bills.push({ name: 'utilities', amount: utilitiesAmount(), offset: s.utility_day_offset % 30, cycle: 30, last: s.last_utility_day });
    }
    // Insurance premium — only for employer and marketplace (medicaid/uninsured have no premium)
    if (s.insurance_premium > 0) {
      bills.push({ name: 'insurance', amount: s.insurance_premium, offset: s.insurance_bill_day_offset % 30, cycle: 30, last: s.last_insurance_bill_day });
    }
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
    const shift = shiftFor(currentAbsoluteDay());
    if (!shift) return 0;
    return Math.max(0, Math.round(timeOfDay() - (shift.start + 15)));
  }

  /**
   * Qualitative tier for how late the character is.
   * Returns 'fine' when not late. Used for transition-based event firing.
   * Approximation debt (job standing): thresholds (0 min, 20 min) are chosen — not derived from
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

  // --- Labor arrangement interface ---

  /** Absolute game-day counter (0-indexed from game start). */
  function currentAbsoluteDay() {
    return Math.floor(s.time / 1440);
  }

  /** Day-of-week (0=Sun … 6=Sat) for any absolute game-day. */
  function dowForDay(absoluteDay) {
    return new Date((s.start_timestamp + absoluteDay * 1440) * 60000).getUTCDay();
  }

  /**
   * True if this absolute game-day is a potentially-scheduled work day per arrangement day_pattern.
   * Does not check whether a shift is actually assigned (use shiftFor for that).
   */
  function isPotentialWorkDayFor(absoluteDay) {
    const arr = s.labor_arrangement;
    if (arr.type === 'none' || arr.type === 'gig') return false;
    const dow = dowForDay(absoluteDay);
    if (arr.day_pattern === 'weekdays') return dow >= 1 && dow <= 5;
    if (arr.day_pattern === 'any') return true;
    if (arr.day_pattern === 'specific') return arr.work_days.includes(dow);
    return false;
  }

  /**
   * The shift on this absolute game-day.
   * Returns {start, end} if scheduled, null if not scheduled, undefined if not yet revealed.
   * Fixed arrangements derive deterministically; on_demand/rotating read from known_shifts.
   */
  function shiftFor(absoluteDay) {
    const arr = s.labor_arrangement;
    // known_shifts takes precedence (populated by reveal events for rotating/on_demand)
    if (absoluteDay in s.known_shifts) return s.known_shifts[absoluteDay];
    // Fixed: derive deterministically
    if (arr.type === 'fixed') {
      return isPotentialWorkDayFor(absoluteDay)
        ? { start: arr.shift_start, end: arr.shift_end }
        : null;
    }
    // Rotating/on_demand: not yet revealed
    return undefined;
  }

  /** True if today is a potentially-scheduled work day (shift may or may not be assigned). */
  function isPotentialWorkDay() {
    return isPotentialWorkDayFor(currentAbsoluteDay());
  }

  /** True if the character knows whether they're working today (always true for fixed). */
  function shiftKnownToday() {
    return shiftFor(currentAbsoluteDay()) !== undefined;
  }

  /**
   * Is this absolute game-day a scheduled work day?
   * Returns true (shift assigned), false (not scheduled), or 'unknown' (not yet revealed).
   */
  function isScheduledWorkDay(absoluteDay) {
    const shift = shiftFor(absoluteDay);
    if (shift === undefined) return 'unknown';
    return shift !== null;
  }

  /**
   * Hours until the next shift start (today if shift hasn't started, otherwise upcoming days).
   * Returns null if no shift found within 7 days.
   */
  function hoursUntilShift() {
    const tod = timeOfDay();
    const today = currentAbsoluteDay();
    const todayShift = shiftFor(today);
    if (todayShift) {
      const diff = todayShift.start - tod;
      if (diff > 0) return diff / 60;
    }
    for (let d = 1; d <= 7; d++) {
      const shift = shiftFor(today + d);
      if (shift) return (d * 1440 + shift.start - tod) / 60;
    }
    return null;
  }

  /**
   * Days until next day off (0 = today, 1 = tomorrow, etc.).
   * A "day off" is a day with no shift scheduled (shiftFor returns null).
   * For fixed workers, this is deterministic; for rotating/on_demand, only checks revealed days.
   * Returns null if no day off found within 7 days.
   */
  function nextDayOff() {
    const today = currentAbsoluteDay();
    for (let d = 0; d <= 7; d++) {
      const shift = shiftFor(today + d);
      if (shift === null) return d;
    }
    return null;
  }

  /** True if the character is currently scheduled to work today (shift assigned). */
  function isWorkday() {
    return isScheduledWorkDay(currentAbsoluteDay()) === true;
  }

  /**
   * Record what the character knows about a shift for a given absolute game-day.
   * Pass null to mark a day as explicitly not scheduled.
   * Called by checkEvents() when a schedule_reveal interrupt fires.
   * @param {number} absoluteDay
   * @param {{ start: number, end: number } | null} shift
   */
  function setKnownShift(absoluteDay, shift) {
    s.known_shifts = { ...s.known_shifts, [absoluteDay]: shift };
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
    // non-habitual consumers. Longitudinal controlled studies (Beaumont 2017, PMID 27762662;
    // PLOS ONE 2019, PMC6343867) show blunting of ~20–30% after weeks of daily use.
    // The 0.3 represents the upper end of longitudinal estimates.
    // Approximation debt (caffeine): direction is right, magnitude uncertain.
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
   * Approximation debt (caffeine): animal data applied to a human model; direct human receptor
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

  /**
   * Qualitative caffeine withdrawal tier. Content branches on these labels.
   * Derived from NE deficit relative to baseline when caffeine_level < 15.
   * Gate: no withdrawal symptoms while caffeine is pharmacologically active.
   */
  function withdrawalTier() {
    if (s.caffeine_level >= 15) return 'none';
    const deficit = Math.max(0, s.norepinephrine_baseline - s.norepinephrine);
    // Approximation debt (nt-baseline): tier thresholds (3/10/20 pts deficit) chosen;
    // no empirical data maps NE deficit magnitude to caffeine withdrawal severity ratings.
    // Juliano & Griffiths 2004 (PMID 15448977) characterizes symptoms qualitatively (mild /
    // moderate / severe / extreme) but does not define them by a neurochemical index.
    if (deficit < 3)  return 'none';
    if (deficit < 10) return 'mild';
    if (deficit < 20) return 'moderate';
    return 'severe';
  }

  // --- Alcohol ---

  /** Qualitative alcohol level. Content branches on these labels. */
  function alcoholTier() {
    const a = s.alcohol_level;
    if (a < 5)  return 'none';
    if (a < 25) return 'low';    // the push — warmth, loosening
    if (a < 50) return 'medium'; // plateau — slower, blunted
    return 'high';               // cost — dissociation, impaired
  }

  /**
   * Consume alcohol. amount = standard drinks (1, 2, or 3).
   * Each standard drink ≈ 15 BAC-units on this scale.
   * Sets alcohol_sleep_flag if consuming this session contributed to sleeping drunk.
   * (sleep flag is set by content.js execute, not here — it requires knowing sleep intent.)
   *
   * Tolerance: reduces effective BAC peak.
   * Approximation debt (alcohol): 15 units/standard drink chosen; real BAC depends on
   * sex, body weight, food intake. This is a population-average proxy.
   * Ref: Holford 1987 (PMID 3319346 — confirmed: "Clinical pharmacokinetics of ethanol,"
   * Clin Pharmacokinet 13(5):273-92).
   */
  function consumeAlcohol(drinks) {
    const unitsPerDrink = 15; // Approximation debt (alcohol): 15 units/drink chosen; Holford 1987 PMID 3319346
    const raw = drinks * unitsPerDrink;
    // Tolerance slightly blunts peak BAC — partial tolerance (experienced drinkers absorb similarly
    // but feel less). Approximation debt (alcohol): 0.20 reduction at tolerance=100 chosen.
    // Tolerance at this site models acute pharmacokinetic tolerance (slightly lower peak); functional
    // tolerance (feeling less impaired at same BAC) is modeled via effectiveAl reduction in advanceTime().
    // No published dose-response maps tolerance to BAC-peak reduction specifically.
    const effectiveAmount = raw * (1 - 0.20 * (s.alcohol_tolerance / 100));
    s.alcohol_level = clamp(s.alcohol_level + effectiveAmount, 0, 100);
    // Mark sleep flag — caller (content.js) sets this; not set here since we don't know
    // if this is a bedtime drink. See drink_alcohol execute in content.js.
  }

  /**
   * Sleep quality multiplier from alcohol. Alcohol paradoxically increases deep sleep
   * but suppresses REM — net effect is poor quality despite apparent sedation.
   * Returns 1.0 when no alcohol effect is present.
   * Called from sleep execute in content.js, same as caffeineSleepInterference().
   */
  function alcoholSleepInterference() {
    if (!s.alcohol_sleep_flag && s.alcohol_level < 10) return 1.0;
    // REM suppression: alcohol at sleep onset reduces REM by ~20–40%.
    // Net quality penalty despite increased SWS — emotional processing impaired.
    // Approximation debt (alcohol): 0.80 multiplier chosen; real effect ~0.75–0.85.
    // Ref: Ebrahim et al. 2013 (PMID 23347102) meta-analysis of alcohol and sleep architecture.
    return 0.80;
  }

  /**
   * Qualitative alcohol withdrawal tier. Content branches on these labels.
   * Derived from GABA deficit relative to baseline when alcohol_level < 5.
   * Gate: no withdrawal symptoms while alcohol is pharmacologically active.
   */
  function alcoholWithdrawalTier() {
    if (s.alcohol_level >= 5) return 'none';
    const deficit = Math.max(0, s.gaba_baseline - s.gaba);
    // DT-zone: gaba_baseline elevation > 32.5 means severe physiological dependence.
    // gaba_baseline > 82.5 (50 + 32.5) mirrors the old alcohol_tolerance > 65 gate.
    const gabaBaselineElevation = Math.max(0, s.gaba_baseline - 50);
    // Approximation debt (nt-baseline): tier thresholds (3/10/20/35 pts deficit) chosen;
    // no empirical data maps GABA deficit magnitude to alcohol withdrawal severity ratings.
    // CIWA-Ar (Clinical Institute Withdrawal Assessment) grades withdrawal by 10 symptom
    // items (Jesse 2017 PMID 27586815; Schuckit 2014 PMID 25427113), but CIWA scores cannot
    // be translated to model-internal GABA deficit values. Thresholds are model-internal choices.
    if (deficit < 3)  return 'none';
    if (deficit < 10) return 'mild';
    if (deficit < 20) return 'moderate';
    // DT-zone: high GABA deficit + high baseline elevation = delirium tremens territory.
    // Threshold mirrors the NT-effect gate in advanceTime(): deficit >= 35 && elevation > 32.5.
    if (deficit >= 35 && gabaBaselineElevation > 32.5) return 'dangerous';
    return 'severe';
  }

  // --- Nicotine ---

  /** Qualitative nicotine level. Content branches on these labels. */
  function nicotineTier() {
    const n = s.nicotine_level;
    if (n < 8)  return 'none';
    if (n < 25) return 'low';
    if (n < 60) return 'active';
    return 'high';
  }

  /**
   * True when the character is an established smoker (habit above meaningful threshold).
   * Content uses this to gate smoker-specific prose and interactions.
   * Approximation debt (nicotine): threshold 40 chosen; real "established dependence" onset ~2 weeks
   * of daily use (DSM-5). At build rate +6/day, habit=40 reached after ~7 days — slightly fast.
   * nAChR upregulation that mediates dependence begins within hours-to-days and is substantial
   * after 1–2 weeks (Govind et al. 2009 PMC2728164). No discrete "dependence onset" threshold exists.
   */
  function isSmoker() {
    return s.nicotine_habit >= 40;
  }

  /**
   * Consume nicotine (one cigarette ≈ 30 units).
   * Acute: NE spike (alertness/arousal), small DA boost toward smoker's suppressed baseline,
   * weak adenosine antagonism, mild GABA suppression (acute nAChR activation at GABAergic synapses
   * is complex — net acute effect is mild DA/NE predominance).
   *
   * Tolerance: at high habit, fewer spare nAChRs are sensitized. Diminished acute effect.
   * Approximation debt (nicotine): tolerance scaling 0.25 at habit=100 chosen;
   * real nAChR upregulation increases receptor number (paradoxically), which reduces
   * per-dose effect via rapid desensitization after each dose. Magnitude uncertain at
   * human level. Direction from Balfour 2004 PMID 15801566 — confirmed: "The neurobiology of
   * tobacco dependence: a preclinical perspective on the role of the dopamine projections to
   * the nucleus accumbens," Nicotine Tob Res 6(6):899-912.
   */
  function consumeNicotine(amount) {
    // Tolerance-reduced effective dose
    // Approximation debt (nicotine): 25% maximum blunting at habit=100 chosen; no per-dose
    // pharmacodynamic tolerance curve for nicotine exists at the individual level.
    const effectiveAmount = amount * (1 - 0.25 * (s.nicotine_habit / 100));
    s.nicotine_level = clamp(s.nicotine_level + effectiveAmount, 0, 100);
    s.nicotine_today_peak = Math.max(s.nicotine_today_peak, s.nicotine_level);
    // Acute NE spike — primary arousal signal. Tolerance-scaled.
    // Approximation debt (nicotine): NE boost coefficient 0.25 chosen; direction from
    // Svensson et al. locus coeruleus studies (nicotine markedly increases LC firing rate
    // via peripheral→glutamatergic relay; PMID 3110818 — confirmed: Svensson 1986/1987 LC work).
    // No per-unit NE dose-response curve at human level exists.
    adjustNT('norepinephrine', effectiveAmount * 0.25);
    // Small DA boost — smokers' mesolimbic DA is suppressed at baseline; cigarette
    // partially normalizes it, not a DA spike above normal. Non-smokers get a real DA push;
    // smokers get relief-to-normal. Modeled as the same call; the sub-baseline DA from
    // withdrawal means the net effect is correction not elevation for established smokers.
    // Approximation debt (nicotine): DA coefficient 0.10 chosen; direction from
    // Dani & Balfour 2011 PMID 21824661 (confirmed: "Historical and current perspective on
    // tobacco use and nicotine addiction," Trends Neurosci 34(7):383-92). No per-unit DA
    // dose-response curve from human data exists; animal VTA studies show ~25-40% DA increase.
    adjustNT('dopamine', effectiveAmount * 0.10);
    // Weak adenosine antagonism — much weaker than caffeine but present.
    // Approximation debt (nicotine): 0.04 coefficient chosen; limited mechanistic data
    // at the A1/A2A receptor level for nicotine specifically (Barraco 1994 PMID 8025278 —
    // unverified; adenosine-nicotine interactions, indirect evidence only). No published
    // human dose-response for nicotine adenosine antagonism magnitude.
    s.adenosine = Math.max(0, s.adenosine - effectiveAmount * 0.04);
  }

  /**
   * Qualitative nicotine withdrawal tier. Content branches on these labels.
   * Derived from DA deficit relative to baseline when nicotine_level < 10.
   * Gate: no withdrawal symptoms while nicotine is pharmacologically active.
   */
  function nicotineWithdrawalTier() {
    if (s.nicotine_level >= 10) return 'none';
    const deficit = Math.max(0, s.dopamine_baseline - s.dopamine);
    // Approximation debt (nt-baseline): tier thresholds (3/10/20 pts deficit) chosen;
    // no empirical data maps DA deficit magnitude to nicotine withdrawal severity ratings.
    // DSM-5 nicotine withdrawal criteria are categorical (present/absent) and do not provide
    // a severity scale translatable to model-internal DA deficit units.
    if (deficit < 3)  return 'none';
    if (deficit < 10) return 'mild';
    if (deficit < 20) return 'moderate';
    return 'severe';
  }

  // --- Cannabis ---

  /** Qualitative cannabis level. Content branches on these labels. */
  function cannabisTier() {
    const c = s.cannabis_level;
    if (c < 8)  return 'none';
    if (c < 30) return 'low';   // warmth, slight loosening, things softer
    if (c < 60) return 'active'; // edges dissolving, harder to hold thought
    return 'high';               // dissociation, time moving strangely
  }

  /**
   * True when the character is an established cannabis user (tolerance above meaningful threshold).
   * Content uses this to gate user-specific interactions.
   * At +3/day, tolerance=30 corresponds to ~10 days of daily use — consistent with
   * measurable CB1 downregulation appearing within days of heavy use
   * (Hirvonen 2012 PMID 21747398; D'Souza et al. 2016 PMC4742341).
   * Approximation debt (cannabis): threshold 30 chosen; precise onset of "established use"
   * phenomenology is not quantified in the literature.
   */
  function isCannabisUser() {
    return s.cannabis_tolerance >= 30;
  }

  /**
   * Consume cannabis (one unit ≈ 60 units of cannabis_level).
   * Acute: indirect DA release (mesolimbic), mild GABA modulation, emotional blunting.
   * High-dose: anxiety induction (NE ↑), dissociation quality.
   *
   * Sets cannabis_sleep_flag when consumed before sleep — caller (content.js) handles this.
   *
   * Tolerance: at high tolerance, fewer available CB1 receptors. Diminished acute effect.
   * CB1 downregulation in chronic daily users: 15–20% reduction in receptor availability
   * (Hirvonen 2012 PMID 21747398 — PET study). 20% max reduction at tolerance=100.
   * This matches the measured receptor-level reduction; the subjective tolerance is larger
   * because tolerance also involves functional desensitization beyond receptor count alone.
   * Approximation debt (cannabis): 20% max reduction uses receptor availability data only;
   * functional desensitization component is not separately modeled.
   */
  function consumeCannabis(amount) {
    // Tolerance-reduced effective dose — 20% max reduction at full tolerance
    // (Hirvonen 2012 PMID 21747398: 15–20% CB1R availability reduction in chronic users).
    const effectiveAmount = amount * (1 - 0.20 * (s.cannabis_tolerance / 100));
    s.cannabis_level = clamp(s.cannabis_level + effectiveAmount, 0, 100);
    // Mild adenosine accumulation at dose time (acute effect).
    // CB1-adenosine crosstalk documented (Martire 2011 PMID 21062287 — confirmed: A2A/CB1
    // interaction in striatum, J Neurochem 116(2):273-80).
    // Approximation debt (cannabis): 0.03 coefficient chosen; acute sedation signal at dose
    // time is weak and separate from the per-tick accumulation in advanceTime().
    s.adenosine = clamp(s.adenosine + effectiveAmount * 0.03, 0, 100);
  }

  /**
   * Sleep quality multiplier from cannabis. THC suppresses REM sleep acutely.
   * CBD (absent in most street cannabis) does not suppress REM — not modeled separately.
   * Returns 1.0 when no cannabis sleep effect is present.
   * Called from sleep execute in content.js alongside caffeine/alcohol checks.
   * Ref: Babson et al. 2017 (PMID 28349316 — review of cannabis and sleep architecture).
   * Note: a 2025 meta-analysis (PMID 40967124) found mixed/null REM suppression at lower
   * therapeutic doses; high-dose or heavy-use suppression is better supported. This function
   * only fires when cannabis_sleep_flag is set (used before sleep), modeling high-enough-dose use.
   */
  function cannabisSleepInterference() {
    if (!s.cannabis_sleep_flag && s.cannabis_level < 8) return 1.0;
    // REM suppression: THC at sleep onset suppresses REM.
    // Babson 2017 (PMID 28349316) reports THC decreases sleep latency but may impair sleep
    // quality long-term; high-dose studies show ~0.80–0.93 range.
    // 0.88 chosen as mid-range for dose-dependent suppression when cannabis is used before sleep.
    // Less severe than alcohol (0.80): cannabis REM suppression is acute-dose-dependent and
    // the anxiolytic effect at low dose can offset quality loss for some users.
    // Approximation debt (cannabis): 0.88 multiplier is within literature range but the
    // dose-response curve for sleep quality is not well-modeled at individual level.
    return 0.88;
  }

  /**
   * Days elapsed since the current quit attempt started.
   * Derived from (time - quit_attempt_start) / 1440 — never a stored counter.
   * Returns 0 when no quit attempt is active.
   */
  function quitDays() {
    if (!s.quit_attempt || s.quit_attempt_start === 0) return 0;
    return (s.time - s.quit_attempt_start) / 1440;
  }

  /**
   * Current sobriety milestone, if any.
   * Returns the milestone name if quitDays is within ±0.5 days of a milestone,
   * or null otherwise. Milestones: 1 day, 7 days (1 week), 30 days, 60 days, 90 days.
   * Also returns 'approaching' info for idle thought gating.
   * @returns {{ current: string|null, approaching: string|null, days: number }}
   */
  function sobrietyMilestone() {
    const days = quitDays();
    const milestones = [
      { days: 1, label: '1 day' },
      { days: 7, label: '1 week' },
      { days: 30, label: '30 days' },
      { days: 60, label: '60 days' },
      { days: 90, label: '90 days' },
    ];
    let current = null;
    let approaching = null;
    for (const m of milestones) {
      const diff = m.days - days;
      // Current: within half a day past the milestone, not yet past
      if (diff <= 0 && diff > -0.5) current = m.label;
      // Approaching: 1-2 days before
      if (diff > 0 && diff <= 2) approaching = m.label;
    }
    return { current, approaching, days };
  }

  /**
   * Qualitative step-work range. Content branches on these labels for prose shading.
   * 0 = pre-step-work, 1–3 = early (admission), 4–7 = middle (inventory/action),
   * 8–9 = amends, 10–12 = maintenance/service.
   * @returns {'none'|'early'|'middle'|'amends'|'maintenance'}
   */
  function recoveryStepTier() {
    const step = s.recovery_step;
    if (step <= 0) return 'none';
    if (step <= 3) return 'early';
    if (step <= 7) return 'middle';
    if (step <= 9) return 'amends';
    return 'maintenance';
  }

  /**
   * Qualitative craving tier. Content branches on these labels.
   * Only meaningful during a quit attempt; withdrawal-without-attempt uses substance tiers.
   */
  function cravingTier() {
    const c = s.craving_intensity;
    if (c < 10) return 'none';
    if (c < 30) return 'background';
    if (c < 60) return 'intrusive';
    return 'consuming';
  }

  /**
   * Qualitative cannabis withdrawal tier. Content branches on these labels.
   * Derived from DA deficit relative to baseline when cannabis_level < 10.
   * Gate: no withdrawal symptoms while cannabis is pharmacologically active.
   * Cannabis withdrawal is milder and slower than nicotine — thresholds reflect this.
   */
  function cannabisWithdrawalTier() {
    if (s.cannabis_level >= 10) return 'none';
    const deficit = Math.max(0, s.dopamine_baseline - s.dopamine);
    // Approximation debt (nt-baseline): tier thresholds (2/8/16 pts deficit) chosen slightly
    // lower than nicotine to reflect milder phenomenology. Direction: cannabis withdrawal is
    // milder than nicotine (Budney 2003 — PMID 12954796 unverified for this citation; confirmed
    // study at different PMID; Schlienz et al. 2018 — PMID 29679997 unverified for this
    // citation). No empirical data maps DA deficit magnitude to cannabis withdrawal severity.
    if (deficit < 2)  return 'none';
    if (deficit < 8)  return 'mild';
    if (deficit < 16) return 'moderate';
    return 'severe';
  }

  // --- Opioids ---

  /** Qualitative opioid level. Content branches on these labels. */
  function opioidTier() {
    const o = s.opioid_level;
    if (o < 8)  return 'none';
    if (o < 25) return 'mild';     // the warmth — pain receding, edges softening
    if (o < 55) return 'moderate'; // the relief — pain gone, body loosening, heavy calm
    return 'heavy';                // nod — drowsy, slowed, everything far away
  }

  /**
   * Consume opioid (one prescription dose ≈ 40 units).
   * Acute: endorphin +++ (primary), dopamine ++ (reward), GABA + (anxiolysis),
   * serotonin + (mild), NE suppression (calm).
   *
   * Tolerance: at high tolerance, mu-opioid desensitization reduces acute effect substantially.
   * Approximation debt (opioids): 40 units/dose chosen; real potency varies by formulation
   * (5mg oxycodone vs 5mg hydrocodone vs 30mg codeine). This is an abstract dose unit.
   * Ref: Trescot et al. 2008 (PMID 18443637 — opioid pharmacology); no simulation-unit
   * equivalence exists for mapping clinical doses to this scale.
   */
  function consumeOpioid(amount) {
    // Tolerance-reduced effective dose
    // Approximation debt (opioids): 45% maximum blunting at tolerance=100 chosen;
    // real desensitization requires >80% loss of functional MOR (Williams et al. 2013
    // PMID 23321159); 45% is conservative; no per-dose blunting fraction data exists.
    const effectiveAmount = amount * (1 - 0.45 * (s.opioid_tolerance / 100));
    s.opioid_level = clamp(s.opioid_level + effectiveAmount, 0, 100);
    s.opioid_today_peak = Math.max(s.opioid_today_peak, s.opioid_level);
    // Acute endorphin spike — primary mu-opioid agonism.
    // Approximation debt (opioids): endorphin boost coefficient 0.30 chosen; direction
    // well-supported (exogenous opioids act directly on mu-opioid receptors);
    // no individual-level simulation-unit magnitude data exists.
    adjustNT('endorphin', effectiveAmount * 0.30);
    // Dopamine boost — VTA disinhibition.
    // Approximation debt (opioids): DA coefficient 0.15 chosen; direction from
    // Di Chiara & Imperato 1988 (PMID 2899326); no simulation-unit magnitude data exists.
    adjustNT('dopamine', effectiveAmount * 0.15);
    // NE suppression — LC inhibition.
    // Approximation debt (opioids): NE coefficient -0.10 chosen; direction from
    // Aghajanian 1978 (PMID 216919 — LC tolerance to morphine); no magnitude data exists.
    adjustNT('norepinephrine', -(effectiveAmount * 0.10));
    // GABA mild boost.
    // Approximation debt (opioids): GABA coefficient 0.05 chosen; direction from observed
    // anxiolytic effect of opioids clinically; no simulation-unit magnitude data exists.
    adjustNT('gaba', effectiveAmount * 0.05);
  }

  /**
   * Qualitative opioid withdrawal tier. Content branches on these labels.
   * Derived from endorphin deficit when opioid_level < 10.
   * Gate: no withdrawal symptoms while opioid is pharmacologically active.
   * Opioid withdrawal is more severe than nicotine or cannabis — thresholds reflect this.
   * Tier 'severe' maps to full flu-like syndrome with hyperalgesia.
   */
  function opioidWithdrawalTier() {
    if (s.opioid_level >= 10) return 'none';
    if (s.opioid_tolerance < 15) return 'none';
    // Endorphin deficit — using 45 as placeholder baseline (endorphin init value).
    const deficit = Math.max(0, 45 - s.endorphin);
    // Approximation debt (opioids): tier thresholds (2/8/15 pts deficit) chosen to reflect
    // faster onset and greater severity than nicotine/cannabis; COWS scale (Wesson & Ling 2003
    // PMID 12924748) provides 11-symptom severity structure but maps to clinical scoring, not
    // simulation units; no individual-level threshold data exists.
    if (deficit < 2)  return 'none';
    if (deficit < 8)  return 'early';    // restlessness, yawning, lacrimation, rhinorrhea
    if (deficit < 15) return 'acute';    // myalgia, GI distress, anxiety, insomnia
    return 'severe';                     // full syndrome — everything at once
  }

  /**
   * Sleep quality multiplier from opioids. Opioids suppress REM and reduce sleep efficiency.
   * Returns 1.0 when no opioid sleep effect is present.
   * Ref: Dimsdale et al. 2007 (PMID 17557450 — opioids reduce slow-wave sleep, increase stage 2).
   */
  function opioidSleepInterference() {
    if (s.opioid_level < 8) return 1.0;
    // Opioids reduce deep sleep (slow-wave) and fragment architecture.
    // Approximation debt (opioids): 0.82 multiplier chosen; Dimsdale et al. 2007 (PMID 17557450)
    // confirms significant slow-wave reduction; exact efficiency multiplier not published;
    // 0.82 comparable to alcohol (0.80) — both significantly degrade sleep quality.
    return 0.82;
  }

  /**
   * Returns true if the character's jurisdiction allows legal purchase of the given substance.
   * Reads character.jurisdiction ({ country, region }) set at chargen.
   *
   * Types: 'cannabis', 'alcohol', 'cigarettes'
   *
   * Cannabis legal jurisdictions (recreational, as of 2024):
   *   - Canada (all provinces/territories)
   *   - Germany (Cannabisgesetz, April 2024)
   *   - Netherlands (tolerated purchase via coffeeshop system)
   *   - US states: CO, CA, OR, WA, AK, NV, MI, IL, MA, ME, VT, AZ, NJ, NY, CT, NM, MT, VA,
   *                MO, MD, MN, RI, DE, OH (recreational as of 2024)
   *   - Australia: ACT (legalized 2020 for personal use)
   *
   * Alcohol prohibited jurisdictions modeled (Approximation debt (jurisdiction): covers major
   * alcohol-prohibition countries only; no provincial/regional dry laws within legal countries):
   *   - None in the current jurisdiction set — all modeled jurisdictions allow alcohol.
   *   - Future: add IR, SA, KW, AE (federal dry), BD (dry) if those jurisdictions are added.
   *
   * Cigarettes: legal in all currently modeled jurisdictions.
   *
   * @param {'cannabis'|'alcohol'|'cigarettes'} type
   * @returns {boolean}
   */
  function canPurchaseSubstance(type) {
    const jur = ctx.character.get('jurisdiction');
    const country = jur.country;
    const region  = jur.region;

    if (type === 'cigarettes') {
      // Legal in all modeled jurisdictions.
      return true;
    }

    if (type === 'alcohol') {
      // All currently modeled jurisdictions allow alcohol purchase.
      // Approximation debt (jurisdiction): dry countries (Iran, Saudi Arabia, Kuwait, etc.)
      // not in the chargen jurisdiction set — no prohibition cases to model yet.
      return true;
    }

    if (type === 'cannabis') {
      if (country === 'CA') return true;   // Canada: federally legal
      if (country === 'DE') return true;   // Germany: legal since April 2024
      if (country === 'NL') return true;   // Netherlands: tolerated coffeeshop purchase

      if (country === 'US') {
        // Recreational legal states as of 2024
        const legalUSStates = new Set([
          'CO','CA','OR','WA','AK','NV','MI','IL','MA','ME','VT','AZ',
          'NJ','NY','CT','NM','MT','VA','MO','MD','MN','RI','DE','OH',
        ]);
        return region !== null && legalUSStates.has(region);
      }

      if (country === 'AU') {
        // ACT legalized for personal use 2020; other states/territories still illegal or decrim only
        return region === 'ACT';
      }

      // GB, FR, XX — illegal
      return false;
    }

    // Unknown type — conservative
    return false;
  }

  /**
   * Returns the trans healthcare access level for a given character's jurisdiction.
   *
   * 'accessible' — HRT available through normal channels at normal difficulty.
   * 'restricted' — HRT legal but access is materially constrained (long waits, higher cost,
   *               limited providers). UK NHS adult pathway is the primary case: legal but
   *               wait times of 5–25+ years at adult GICs as of 2024–2026.
   * 'hostile'    — No explicit statutory ban on adult HRT, but enacted laws create hostile
   *               practical environment severely limiting access. Florida SB 254 (2023, signed
   *               May 17 2023) is the primary US case: restricts adult care to in-person
   *               physician-only prescribing, eliminating most telehealth and NP providers.
   *               Law was enjoined by district court but 11th Circuit stayed the injunction
   *               (August 2024) — enforcement ongoing as of 2024.
   * 'banned'     — Legal prohibition on adult HRT. No currently modeled jurisdictions
   *               (US, CA, GB, AU, DE, NL, FR) fall here. XX (other) assigned 'hostile'
   *               as a conservative approximation; real-world bans exist (Russia, Hungary,
   *               Nigeria, several MENA countries) but these aren't in the chargen set.
   *
   * Sources:
   * - Florida SB 254 (2023): https://www.gladlaw.org/federal-court-permanently-blocks-florida-law-restricting-health-care-for-transgender-adults-adolescents
   * - UK NHS GIC wait times (2024–2026): genderkit.org.uk/resources/wait-times/ — avg estimated
   *   wait 25 years in some regions; CNTW reports 81 months at top of list as of Nov 2025.
   * - TGEU Trans Health Map 2024: https://www.tgeu.org/trans-health-map-2024-as-who-guidelines-approach-healthcare-for-trans-people-in-the-eu-still-hindered-by-stigma-and-long-delays/
   *   Hungary: no access to T or E. Russia: banned. Nigeria: illegal.
   * - Equaldex gender-affirming care by country: https://www.equaldex.com/issue/gender-affirming-care
   *
   * Approximation debt (trans healthcare jurisdiction): Florida is the only US state with an
   * enacted adult-specific HRT restriction as of 2024. Other states (TX, GA, etc.) have
   * proposed or enacted Medicaid funding restrictions only — not statutory access bans.
   * This may change; the state list here reflects the 2024 enacted law landscape, not proposals.
   *
   * @returns {'accessible'|'restricted'|'hostile'|'banned'}
   */
  function transHealthcareAccess() {
    const jur = ctx.character.get('jurisdiction') ?? { country: 'US', region: null };
    const country = jur.country ?? 'US';
    const region  = jur.region ?? null;

    // Non-US jurisdictions in the modeled set
    if (country === 'GB') {
      // NHS adult gender dysphoria clinic pathway: legal but wait times 5–25+ years.
      // Bridging prescriptions via GP exist in some ICBs but are not universal.
      // Approximation debt (trans healthcare jurisdiction): UK private pathway (GenderGP,
      // private GICs) is accessible if affordable; character's economic position not
      // checked here. Model treats NHS route (accessible to all) as 'restricted'.
      return 'restricted';
    }

    if (country === 'CA' || country === 'AU' || country === 'DE' ||
        country === 'NL' || country === 'FR') {
      // All modeled EU/Commonwealth jurisdictions: adult HRT accessible through
      // standard prescribing pathways. France: endocrinologist route; Germany: statutory
      // insurance covers; NL: accessible; AU: GP-prescribable.
      // Approximation debt (trans healthcare jurisdiction): wait times vary within these
      // systems (AU rural access, FR administrative burden) — not modeled.
      return 'accessible';
    }

    if (country === 'XX') {
      // 'Other' jurisdiction: conservative approximation. Real-world bans exist in
      // Russia, Hungary, Nigeria, and several MENA countries — not in chargen set.
      // 'hostile' rather than 'banned' because XX covers a wide range.
      // Approximation debt (trans healthcare jurisdiction): XX covers both permissive
      // and prohibitive jurisdictions; 'hostile' is a rough median.
      return 'hostile';
    }

    // US: state-level gating
    if (country === 'US') {
      // States with enacted laws that actively restrict adult trans healthcare access
      // (physician-only prescribing eliminating most telehealth/NP providers, or
      // enforced practical barriers beyond Medicaid funding restrictions alone):
      //
      // 'hostile' — enacted laws creating material access barriers for adults:
      //   FL: SB 254 (signed May 17 2023) — physician-only, in-person informed consent,
      //       eliminates most telehealth and NP providers. Enjoined by district court;
      //       11th Circuit stayed injunction August 2024, enforcement resumed.
      //
      // Approximation debt (trans healthcare jurisdiction): Texas, Georgia, and others
      // have enacted Medicaid/public-funding restrictions only. These affect low-income
      // characters (Medicaid) but not private-pay access — not modeled as 'hostile' here.
      // If that distinction becomes mechanically relevant, add an insurance_type check.
      const hostileUSStates = new Set(['FL']);

      if (region !== null && hostileUSStates.has(region)) return 'hostile';

      // All other US states: accessible (including states with only Medicaid restrictions,
      // which are approximation debts noted above).
      return 'accessible';
    }

    // Unknown country — conservative
    return 'accessible';
  }

  /**
   * Healthcare cost multiplier based on jurisdiction (non-US) or insurance type (US).
   * Non-US universal healthcare systems are handled first; US insurance logic follows.
   *
   * Approximation debt (insurance): multipliers are heavily simplified. Real copay structures
   * vary by plan tier, deductible status, in-network vs out-of-network, medication formulary
   * tier, and procedure type. Employer plans range 10-30% cost share; marketplace plans
   * 20-50%; medicaid has nominal copays ($1-$4) in some states. OTC items are typically
   * not covered by any insurance — multiplier still applied for simplicity.
   * @returns {number}
   */
  function healthcareCostMultiplier() {
    const country = ctx.character.get('jurisdiction')?.country ?? 'US';

    if (country === 'GB') {
      // NHS: GP visits free, A&E (ER) free, prescriptions flat £9.90/item (~$12 USD).
      // Approximation debt (insurance): NHS prescription charge used as USD approximation;
      // dental and optical not covered by NHS — not yet modeled.
      // Residual 0.1 approximates prescription charges on a $15–25 sticker price basis.
      return 0.1;
    }
    if (country === 'CA') {
      // Provincial Medicare: GP and ER free; prescriptions not universally covered
      // (coverage varies by province — Quebec, BC, ON have partial formularies).
      // Approximation debt (insurance): prescription coverage uses median provincial estimate;
      // dental not covered under provincial Medicare.
      return 0.15;
    }
    if (country === 'AU') {
      // Medicare: GP bulk-billed (free) or $30–50 gap payment; PBS subsidizes prescriptions
      // to ~$30 AUD max per item (~$20 USD).
      // Approximation debt (insurance): gap payment and PBS rates approximate; dental not
      // covered under Medicare (Child Dental Benefit Schedule excluded).
      return 0.2;
    }
    if (country === 'DE' || country === 'NL' || country === 'FR') {
      // Western EU statutory health insurance covers 70–90% of costs; small co-payments apply.
      // Approximation debt (insurance): EU-western is a wide category — Germany (GKV/PKV),
      // Netherlands (basisverzekering), France (Sécurité Sociale) differ significantly.
      // Using 0.15 as a median residual across these systems.
      return 0.15;
    }

    // US: insurance-based logic.
    // Approximation debt (insurance): US-centric model; 'public' type covers non-US characters
    // reassigned at chargen — they route through the jurisdiction check above, not here.
    switch (s.insurance_type) {
      case 'employer':    return 0.2;
      case 'marketplace': return 0.4;
      case 'medicaid':    return 0.0;
      case 'public':      return 0.0; // safety fallback — non-US should route via country check
      case 'uninsured':   return 1.0;
      default:            return 1.0;
    }
  }

  /**
   * Dental cost multiplier based on jurisdiction.
   * Separate from healthcareCostMultiplier() because dental systems diverge sharply from
   * general medical insurance — many universal healthcare countries exclude adult dental
   * entirely, while the UK NHS covers it at subsidised flat rates.
   *
   * Sources:
   * - GB NHS bands (England, April 2024): Band 1 £26.80, Band 2 £73.50, Band 3 £326.70.
   *   NHS BSA press release: https://media.nhsbsa.nhs.uk/press-releases/b4bfcce4-34e9-4391-8e94-efaa48faac3b/nhs-dental-charges-from-1-april-2024
   * - CA Canadian Dental Care Plan (2023–): uninsured adults, family net income < $90k;
   *   full coverage below $70k, 60% at $70–79k, 40% at $80–89k.
   *   Canada.ca: https://www.canada.ca/en/services/benefits/dental/dental-care-plan/qualify.html
   * - AU: Medicare does not cover adult dental. Public dental through state systems with
   *   long wait lists (up to 2 years). Private extras insurance covers partial costs.
   *   healthdirect.gov.au: https://www.healthdirect.gov.au/cost-of-dental-care
   * - DE GKV: covers checkups, fillings, extractions. Fixed subsidy 60–75% for prostheses
   *   (bonus booklet raises to 75%). Patients pay remainder.
   *   gesund.bund.de: https://gesund.bund.de/en/dental-services
   * - NL: Basic health package excludes most adult dental (removed 2012). Adults pay
   *   out-of-pocket or via supplementary insurance.
   *   dutchreview.com: https://dutchreview.com/expat/health/dental-costs-and-dental-insurance-in-the-netherlands-5-questions/
   * - FR 100% Santé reform (2019–2021): dental prostheses fully reimbursed (SHI + VHI).
   *   Basic fillings/extractions: ~70% social security reimbursement.
   *   service-public.fr: https://www.service-public.gouv.fr/particuliers/vosdroits/F33956?lang=en
   *
   * @returns {number}
   */
  function dentalCostMultiplier() {
    const country = ctx.character.get('jurisdiction')?.country ?? 'US';

    if (country === 'GB') {
      // NHS dental: heavily subsidised flat bands. Most patients pay Band 2 rate (£73.50 ~$92 USD)
      // for routine fillings, vs $200–400 uninsured US. ~85% of population can access an NHS dentist.
      // ~15% cannot find an NHS dentist and pay private rates (full cost).
      // has_dental_insurance used as proxy for NHS access (true = has access, false = private only).
      // Approximation debt (dental jurisdiction): NHS access rate (85%) is a population estimate;
      // individual derivation would require modelling NHS dentist availability by postcode.
      const hasNHSAccess = ctx.state.get('has_dental_insurance');
      return hasNHSAccess ? 0.15 : 0.85;
    }

    if (country === 'CA') {
      // Employer dental plans cover many workers (like US). CDCP (2023+) covers uninsured
      // adults with family net income < $90k — 100% below $70k, 60% at $70–79k, 40% at $80–89k.
      // Approximation debt (dental jurisdiction): CDCP income-tier mapping uses medicaid income
      // proxy (low-income = below $70k threshold → 0 cost); mid-income uses 0.4× (40% coverage
      // tier); has_dental_insurance = employer plan.
      const hasEmployerDental = ctx.state.get('has_dental_insurance');
      if (hasEmployerDental) return 0.2; // employer dental plan: copay ~20%
      // Check for CDCP eligibility via medicaid/low-income proxy
      const insType = s.insurance_type;
      if (insType === 'medicaid') return 0.0; // CDCP full coverage for lowest income bracket
      // Mid income without employer dental — CDCP 40% coverage tier or uninsured
      // Approximation debt (dental jurisdiction): no fine-grained income tracking; using 0.6 as
      // average for uninsured mid-income Canadians (partial CDCP or no coverage).
      return 0.6;
    }

    if (country === 'AU') {
      // Medicare excludes adult dental. Public dental: state programs with 1–2 year wait lists,
      // accessible to concession card holders. Private extras insurance covers partial costs.
      // Approximation debt (dental jurisdiction): AU private insurance coverage rate ~55% of adults;
      // has_dental_insurance used as proxy for extras insurance.
      const hasExtras = ctx.state.get('has_dental_insurance');
      return hasExtras ? 0.4 : 0.9; // extras: ~40% of cost covered; uninsured: near full price
    }

    if (country === 'DE') {
      // GKV statutory insurance covers checkups, fillings, extractions; 60–75% of prostheses.
      // Nearly all residents (88%) are in GKV. Effective dental coverage better than the
      // 0.15 medical multiplier — basic dental work is well covered.
      // Approximation debt (dental jurisdiction): 0.2 represents the residual patient share
      // after GKV subsidy for a typical filling/cleaning visit.
      return 0.2;
    }

    if (country === 'NL') {
      // Basic health package excludes most adult dental since 2012. Supplementary insurance
      // (tandartsverzekering) covers some — typically 75–80% up to an annual cap (€250–€1500).
      // Without supplementary: full out-of-pocket. has_dental_insurance = supplementary plan.
      // Approximation debt (dental jurisdiction): supplementary plan coverage varies widely;
      // 0.25 used as residual for insured (plan + cap), 0.9 for uninsured (near full price).
      const hasSupplementary = ctx.state.get('has_dental_insurance');
      return hasSupplementary ? 0.25 : 0.9;
    }

    if (country === 'FR') {
      // 100% Santé reform (2019–2021): dental prostheses (crowns, bridges, dentures) fully
      // reimbursed via SHI + compulsory VHI. Basic fillings/extractions: ~70% SHI reimbursement.
      // Nearly all residents have compulsory mutuelle (VHI), so the 70% base is the floor.
      // Approximation debt (dental jurisdiction): 0.15 represents residual patient share for
      // basic dental work under 100% Santé + standard mutuelle; prosthetic work is effectively 0.
      return 0.15;
    }

    // US: insurance-based logic (mirrors healthcareCostMultiplier() but dental-specific).
    // has_dental_insurance is a separate benefit from medical insurance in the US.
    // Approximation debt (dental jurisdiction): US dental copay and uninsured costs simplified.
    // Insured: typical copay after insurance ~$0–100 for cleaning/basic; using 0.25 (copay fraction).
    // Uninsured: full sticker price; base cost in dentist_appointment is the uninsured benchmark.
    if (ctx.state.get('has_dental_insurance')) return 0.25;
    // Precarious economic origin → free/sliding-scale clinic path handled in caller.
    switch (s.insurance_type) {
      case 'medicaid': return 0.05; // Medicaid dental: covered in most states, minimal copay
      default:         return 1.0;  // uninsured: full cost
    }
  }

  /**
   * How much insurance actually covers for a given base cost, accounting for the annual cap.
   * US PPO only — non-US characters and DHMO (cap === 0) return 0 (caller uses dentalCostMultiplier instead).
   *
   * Coverage rate: US PPO pays 80% of in-network charges after deductible for basic/major work.
   * Approximation debt (dental): 80% coverage rate is the common PPO in-network rate for basic
   * restorative care; preventive is typically 100%, major restorative 50%. Single rate simplifies.
   *
   * @param {number} baseCost — uninsured benchmark cost for this visit
   * @returns {number} dollars insurance covers (0 if cap exhausted or no cap applies)
   */
  function dentalInsuranceCoveredCost(baseCost) {
    const cap = s.dental_insurance_cap;
    if (cap === 0) return 0; // no annual cap mechanic (DHMO or no insurance)
    const country = ctx.character.get('jurisdiction')?.country ?? 'US';
    if (country !== 'US') return 0; // non-US uses dentalCostMultiplier() instead
    if (!s.has_dental_insurance) return 0;
    // Approximation debt (dental): 80% coverage rate chosen for PPO in-network basic/restorative.
    const coverageRate = 0.80;
    const remaining = Math.max(0, cap - s.dental_insurance_used);
    return Math.min(remaining, baseCost * coverageRate);
  }

  /**
   * Reset the dental insurance plan year if 365 game days have elapsed.
   * Called from the financial cycle check in content.js generateFinancialCycle().
   * Annual reset: most employer PPO plans reset on calendar year (January 1).
   * Approximation debt (dental): calendar-year reset approximated as 365-game-day cycle from
   * plan start; real plans reset on Jan 1 (or anniversary date) independent of game start day.
   */
  function checkDentalInsuranceReset() {
    if (s.dental_insurance_cap === 0) return; // no cap to reset
    const today = getDay();
    if ((today - s.dental_insurance_plan_start) >= 365) {
      s.dental_insurance_used = 0;
      s.dental_insurance_plan_start = today;
    }
  }

  /**
   * Returns the difficulty tier for a legal name change in the character's jurisdiction.
   *
   * Sources:
   *   - Germany SBGG self-ID act, effective 1 November 2024:
   *     Library of Congress https://www.loc.gov/item/global-legal-monitor/2024-07-09/ (accessed 2026-03)
   *     3-month waiting declaration at registry office; no expert review, no court petition.
   *   - Netherlands self-ID since 2014:
   *     Council of Europe https://www.coe.int/en/web/sogi/netherlands (accessed 2026-03)
   *   - UK deed poll: inexpensive, no prerequisites; GRC (legal gender recognition) requires 2-year
   *     lived-experience + doctor report + £5 fee (GRA 2004). Moderate reflects the split: name change
   *     easy, legal gender recognition hard.
   *     gov.uk https://www.gov.uk/apply-gender-recognition-certificate (accessed 2026-03)
   *   - France: court process simplified 2022, no surgery requirement.
   *   - US: court petition, filing fees typically $100–$400; some states require newspaper publication
   *     (Kansas, Louisiana, Nebraska, Ohio, Pennsylvania, Wisconsin and others).
   *     Rosenblum Law https://rosenblumlaw.com/transgender-name-change/ (accessed 2026-03)
   *     Movement Advancement Project https://www.lgbtmap.org/equality-maps/identity_documents (accessed 2026-03)
   *   - Restrictive US states (publication required + stricter enforcement climate):
   *     FL (publication), TN (hostile climate), ID (legal sex definition changed 2023), GA, AL, WV.
   *     Campaign for Southern Equality https://southernequality.org/anti-trans-id-laws/ (accessed 2026-03)
   *   - Canada, Australia: generally accessible with court petition or statutory declaration;
   *     some provinces/territories have self-ID (BC, MB, NL, NS, ON, QC, SK, YT).
   *     Approximation debt (legal name change): CA/AU province-level variation collapsed to 'moderate';
   *     self-ID provinces not individually modeled.
   *
   * @returns {'easy'|'moderate'|'difficult'|'very_difficult'}
   */
  function nameChangeDifficulty() {
    const jur = ctx.character.get('jurisdiction');
    if (!jur) return 'moderate'; // Approximation debt (legal name change): missing jurisdiction falls back to moderate
    const country = jur.country;
    const region = jur.region;

    // Self-ID jurisdictions — declaration at registry office, minimal process
    if (country === 'DE') return 'easy'; // SBGG, effective November 2024
    if (country === 'NL') return 'easy'; // self-ID since 2014

    // Canada and Australia — generally accessible but court/statutory process in most provinces
    // Approximation debt (legal name change): self-ID provinces (BC, MB, etc.) not individually modeled
    if (country === 'CA') return 'moderate';
    if (country === 'AU') return 'moderate';

    // France — court process, no surgery requirement (post-2016 reform)
    if (country === 'FR') return 'moderate';

    // UK — deed poll is easy; GRC is hard. Moderate reflects the split.
    if (country === 'GB') return 'moderate';

    if (country === 'US') {
      // Restrictive US states: publication requirements, hostile enforcement climate, or
      // legal definitions of sex that complicate gender-marker alignment.
      // FL: requires newspaper publication
      // TN, GA, AL, WV: hostile legislative/enforcement climate as of 2025-2026
      // ID: 2023 law redefines sex to biological, complicating alignment
      // KS, LA, NE, OH, PA, WI: publication required (MAP 2024)
      const restrictiveStates = new Set(['FL', 'TN', 'ID', 'GA', 'AL', 'WV', 'KS', 'LA', 'NE', 'OH', 'PA', 'WI']);
      if (region !== null && restrictiveStates.has(region)) return 'difficult';
      // All other US states — court petition, $100–$400 fee, several months
      return 'moderate';
    }

    // Unknown/other jurisdiction
    if (country === 'XX') return 'very_difficult';

    // Fallback
    return 'moderate'; // Approximation debt (legal name change): unmodeled jurisdictions fall to moderate
  }

  /**
   * Returns a cost multiplier for specialist visit out-of-pocket costs, by jurisdiction.
   *
   * Specialist costs differ from general primary care because referral pathways, coverage tiers,
   * and co-payment structures vary more dramatically for specialist care:
   *
   *   GB  — NHS specialist referral is free at point of use (GP refers, patient waits on NHS list).
   *          Private specialist exists (~£150–300/session) but is the minority route.
   *          0.05× reflects the small minority accessing private specialist care.
   *          Approximation debt (specialist cost): NHS is the dominant specialist route; 0.05×
   *          approximates the weighted average across NHS (free) and private (~20% take private).
   *   CA  — Specialist visits for medically necessary care covered under provincial Medicare;
   *          no direct patient billing for insured services. 0.05× for uninsured extras.
   *          Approximation debt (specialist cost): coverage basis is Canada Health Act (RSC 1985
   *          c C-6) — medically necessary specialist visits are provincially insured; 0.05×
   *          captures incidental uninsured costs (travel, uninsured extras). Exact proportion chosen.
   *   AU  — Medicare covers 85% of the MBS specialist fee schedule; patient co-payment on gap.
   *          Typical out-of-pocket gap $50–150. 0.15× reflects this gap relative to US specialist costs.
   *          Approximation debt (specialist cost): 85% rate is from the MBS schedule (Australian
   *          Dept. of Health, MBS Online); gap magnitude chosen — actual gap varies by specialist
   *          and whether the practice bulk-bills.
   *   DE/NL/FR — Statutory insurance covers specialist care at low co-pay (€10–20 range in DE;
   *          similar in NL/FR). 0.1× relative to US specialist costs.
   *          Approximation debt (specialist cost): DE Zuzahlung is statutory (§28 SGB V) but
   *          waived for many groups; NL and FR structures are similar. Exact co-pay magnitudes
   *          chosen — vary by plan, service, and income exemption status.
   *   US  — Delegates to healthcareCostMultiplier() — insurance-dependent (see that function).
   *   XX  — Conservative 0.4×.
   *          Approximation debt (specialist cost): XX fallback chosen conservatively; intended to
   *          represent partial public coverage typical of middle-income jurisdictions.
   *
   * @param {{ get: (key: string) => any }} character — character module
   * @returns {number}
   */
  function specialistCostMultiplier(character) {
    const jur = character.get('jurisdiction') ?? { country: 'US', region: null };
    const country = jur.country ?? 'US';

    if (country === 'GB') return 0.05;  // Approximation debt (specialist cost): NHS referral dominant; private ~20%
    if (country === 'CA') return 0.05;  // Approximation debt (specialist cost): provincial Medicare covers specialists
    if (country === 'AU') return 0.15;  // Approximation debt (specialist cost): MBS 85% coverage; gap fee
    if (country === 'DE') return 0.1;   // Approximation debt (specialist cost): GKV specialist co-pay
    if (country === 'NL') return 0.1;   // Approximation debt (specialist cost): zorgverzekering specialist
    if (country === 'FR') return 0.1;   // Approximation debt (specialist cost): Assurance Maladie specialist

    if (country === 'US') {
      // US specialist costs follow the same insurance-proxy logic as general healthcare.
      return healthcareCostMultiplier(character);
    }

    // XX and any unlisted country — conservative approximation.
    return 0.4; // Approximation debt (specialist cost): XX fallback chosen conservatively.
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
   * Seasonal temperature baseline in celsius from latitude + day of year.
   * Continuous sinusoidal model: T_season = mean + amplitude × cos(2π(doy − peak_doy)/365).
   *
   * Parameters calibrated to real-world climate means; all are approximations.
   * Approximation debt (temperature): mean and amplitude formulas below are simple linear
   * fits to representative city data. A proper climate model would use Köppen zones,
   * continentality, altitude, and proximity to ocean. None of those are modeled here.
   */
  function seasonalTemperatureBaseline() {
    const absLat = Math.abs(s.latitude);
    // Annual mean: ~27°C at equator, ~10°C at lat 45, ~-5°C at lat 65
    // Approximation debt (temperature): linear formula; real means vary by continent and ocean proximity.
    const mean = 27 - (absLat / 90) * 32;
    // Seasonal amplitude: ~3°C at equator, ~12°C at lat 45, ~20°C at lat 65
    // Approximation debt (temperature): amplitude formula; real amplitudes vary widely by continentality.
    const amplitude = 3 + (absLat / 90) * 17;
    // Peak day-of-year: June 21 (doy≈172) for N hemisphere; Dec 21 (doy≈355) for S hemisphere
    // Approximation debt (temperature): peak_doy is climatological average; real peak lags ~30 days.
    const peakDoy = s.latitude >= 0 ? 172 : 355;
    const cd = calendarDate();
    const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const doy = monthDays[cd.month] + cd.day;
    return mean + amplitude * Math.cos(2 * Math.PI * (doy - peakDoy) / 365);
  }

  /**
   * Ambient temperature in celsius — derived pure function.
   * Composed of: seasonal baseline (latitude + day-of-year sinusoid)
   *            + diurnal variation (time-of-day sinusoid, peak ~14:00)
   *            + weather modifier.
   * No state written. Call at any time for current ambient temperature.
   */
  function ambientTemperature() {
    const hour = timeOfDay() / 60; // fractional hours 0–24
    const absLat = Math.abs(s.latitude);
    // Diurnal amplitude: ~3°C tropical, ~5°C temperate.
    // Approximation debt (temperature): amplitude values chosen; real diurnal range varies with
    // humidity, cloud cover, season, and continentality (observed range 3–16°C).
    const diurnalAmplitude = absLat < 23.5 ? 3 : 5;
    // Peak at 14:00; trough at 02:00. sin formula: peak when sin=1 → hour=14.
    // Approximation debt (temperature): peak hour 14:00 is a climatological average; real peak
    // varies by cloud cover and season (range: 13:00–16:00).
    const diurnal = diurnalAmplitude * Math.sin(2 * Math.PI * (hour - 14) / 24);
    // Weather modifier: precipitation and cloud cover cool the surface.
    // Approximation debt (temperature): modifier values chosen; real effects vary with season,
    // humidity, and storm intensity. Snow -6 reflects surface cooling and albedo; drizzle -2
    // reflects evaporative cooling; overcast/grey break up solar gain differently.
    const weather = s.weather;
    const weatherMod = weather === 'clear'    ?  2
      : weather === 'grey'     ?  0
      : weather === 'overcast' ? -1
      : weather === 'drizzle'  ? -2
      : weather === 'snow'     ? -6
      : 0;
    return seasonalTemperatureBaseline() + diurnal + weatherMod;
  }

  /** Qualitative temperature label. Content branches on these. */
  function temperatureTier() {
    const t = ambientTemperature();
    if (t < -5)  return 'bitter';
    if (t < 5)   return 'freezing';
    if (t < 10)  return 'cold';
    if (t < 16)  return 'cool';
    if (t < 22)  return 'mild';
    if (t < 28)  return 'warm';
    return 'hot';
  }

  /**
   * Utilities bill amount for the current billing period, in dollars.
   * Base from apartment size, plus seasonal heating/cooling load from ambient temperature.
   * Modifiers: insulation quality, heating type (winter only).
   * Returns 0 for all_inclusive housing (utilities bundled into rent).
   * Returns 50% for room_share housing (split with roommates).
   */
  function utilitiesAmount() {
    // all_inclusive: no separate utility bill — cost is bundled into higher rent
    if (s.housing_type === 'all_inclusive') return 0;
    const temp = ambientTemperature();

    // Base from apartment size — larger units cost more (lighting, water heating, baseline draw).
    const sizeBase = { studio: 45, small_1br: 55, '1br': 65, '2br': 90, '3br': 120 };
    const base = sizeBase[s.apartment_size] ?? 65;

    // Seasonal load — heating below 15°C, cooling above 28°C.
    const heating = Math.max(0, (15 - temp) * 1.2);
    const cooling = Math.max(0, (temp - 28) * 0.8);

    // Insulation modifier — poor insulation leaks heat/cool, increasing seasonal cost.
    // Applies to the seasonal component only (base load is independent of insulation).
    const insulationMult = { poor: 1.25, fair: 1.0, good: 0.85 };
    const seasonalCost = (heating + cooling) * (insulationMult[s.insulation_quality] ?? 1.0);

    // Heating type modifier — affects winter heating cost only (not cooling).
    // Electric radiators are resistive heating (least efficient). Gas is mid-range.
    // Heat pumps move heat rather than generating it (COP ~3), most efficient.
    // Approximation debt (utilities): heating efficiency ratios are rough proxies;
    // real costs depend on local electricity/gas prices and equipment age.
    const heatingTypeMult = { electric_radiator: 1.15, gas: 1.05, heat_pump: 0.90 };
    const heatingMult = heating > 0 ? (heatingTypeMult[s.heating_type] ?? 1.0) : 1.0;

    // Combine: base + insulation-adjusted seasonal load, with heating type on the heating portion.
    // When heating is active, heating type multiplier applies to the full seasonal cost
    // (since heating dominates the seasonal component in cold weather).
    const full = Math.round(base + seasonalCost * heatingMult);

    // room_share: utilities split with roommates (50%)
    // Approximation debt (housing type): 50% split assumes one roommate; real splits vary
    // by number of occupants and usage patterns.
    if (s.housing_type === 'room_share') return Math.round(full * 0.50);
    return full;
  }

  // --- Health ---

  function hasCondition(id) {
    return s.health_conditions.includes(id);
  }

  /**
   * Record a new injury. Injuries are events; use current character/body state for ongoing severity.
   * @param {string} type - injury type (e.g. 'sprained_ankle', 'levator_ani_avulsion')
   * @param {number} severity - 0–1 (0.2 mild, 0.5 moderate, 0.8 severe)
   * @param {string} cause - cause context (e.g. 'overexertion', 'vaginal_delivery', 'fall')
   */
  function addInjury(type, severity, cause) {
    const history = s.injury_history ?? [];
    history.push({ type, onset_time: s.time, severity, cause, resolved: false });
    s.injury_history = history;
  }

  /**
   * Mark injuries of the given type as resolved (most recent first if multiple).
   * @param {string} type
   */
  function resolveInjury(type) {
    const history = s.injury_history ?? [];
    // Resolve the most recent unresolved injury of this type
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].type === type && !history[i].resolved) {
        history[i] = { ...history[i], resolved: true };
        break;
      }
    }
    s.injury_history = history;
  }

  /**
   * Return all currently unresolved injuries.
   * @returns {Array<{ type: string, onset_time: number, severity: number, cause: string, resolved: boolean }>}
   */
  function currentInjuries() {
    return (s.injury_history ?? []).filter(inj => !inj.resolved);
  }

  /**
   * Check whether the character has an unresolved injury of the given type.
   * @param {string} type
   * @returns {boolean}
   */
  function hasInjury(type) {
    return (s.injury_history ?? []).some(inj => inj.type === type && !inj.resolved);
  }

  /** Check whether the character has an active prescription of the given type. */
  function hasPrescription(type) {
    return (s.clinic_prescriptions ?? []).includes(type);
  }

  /**
   * Check whether the character has tapering medication supply for a substance.
   * @param {'nicotine'|'alcohol'|'cannabis'} substance
   */
  function isOnTaperingMedication(substance) {
    if (substance === 'cannabis') return false; // No tapering pharmacotherapy for cannabis
    const supply = s.medication_supply ?? {};
    return (supply[`tapering_${substance}`] ?? 0) > 0;
  }

  /**
   * Tapering factor for withdrawal NT effects. 0.5 when on medication, 1.0 otherwise.
   * Cannabis always returns 1.0 — no tapering pharmacotherapy exists.
   * @param {'nicotine'|'alcohol'|'cannabis'} substance
   * @returns {number}
   */
  // Approximation debt (tapering): 0.5 reduction factor chosen; real NRT/benzodiazepine
  // withdrawal attenuation varies by dose, duration, and individual pharmacokinetics.
  function taperingFactor(substance) {
    return isOnTaperingMedication(substance) ? 0.5 : 1.0;
  }

  /**
   * Psychiatric medication onset ramp factor (0–1).
   * Returns 0 if the medication has never been taken or supply has run out.
   * Returns a linear ramp from 0 to 1 over the onset period:
   *   antidepressant: 21 days (3 weeks — SSRI therapeutic onset)
   *   anxiolytic: 7 days (buspirone onset)
   *   mood_stabilizer: 14 days (lithium/lamotrigine onset)
   * Approximation debt (psych medication): onset ramps are linear; real SSRI response curves
   * are sigmoidal with individual variation. 21-day full onset is conservative — clinical
   * guidelines cite 2–6 weeks for SSRIs (APA 2010 Practice Guidelines). Buspirone 1–2 weeks
   * (Bristol-Myers Squibb prescribing information). Lithium 1–3 weeks for acute mania
   * (Grandjean & Aubry 2009 — PMID unverified); lamotrigine requires slow titration (4–6 weeks
   * to therapeutic dose, but mood effects begin before full dose).
   * @param {'antidepressant'|'anxiolytic'|'mood_stabilizer'} medType
   * @returns {number} 0–1 onset factor
   */
  function psychMedOnsetFactor(medType) {
    const supply = s.medication_supply ?? {};
    if ((supply[medType] ?? 0) <= 0) return 0;
    const starts = s.psych_med_start ?? {};
    const startTime = starts[medType] ?? 0;
    if (startTime === 0) return 0;
    const onsetDays = { antidepressant: 21, anxiolytic: 7, mood_stabilizer: 14 };
    const days = (s.time - startTime) / 1440; // minutes → days
    return clamp(days / (onsetDays[medType] ?? 21), 0, 1);
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
    // Post-vasovagal recovery — body recalibrating; ceiling scales with remaining recovery load
    // Approximation debt (vasovagal): 0.5 coefficient chosen; no clinical recovery data.
    // Post-vasovagal recovery (lying down, brief rest) subjectively takes minutes to hours;
    // at 0.5 coeff and recovery=80, energy ceiling = max(50, 100-40) = 60. As recovery drains
    // (sleep clears at 50/hr), ceiling rises back toward 100 in ~1.6h. Model-internal.
    if (s.vasovagal_recovery > 40) {
      return Math.max(50, 100 - s.vasovagal_recovery * 0.5);
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

  /** Qualitative dental pain state. 'none' when quiescent.
   *  Reports pain from both 'dental_pain' condition and spontaneous flares from low dental_health. */
  function dentalTier() {
    if (s.dental_ache < 5) return 'none';
    if (s.dental_ache < 45) return 'dull';   // clinically mild (VAS 5–44, PMC5766084); background ache, easy to push through
    if (s.dental_ache < 75) return 'ache';   // clinically moderate (VAS 45–74); noticeably painful, affects eating choices
    return 'flare';                          // clinically severe (VAS ≥75); acute, hard to ignore, affects everything
  }

  /**
   * Underlying dental condition tier — independent of the immediate pain level.
   * 'sound': no active disease (or condition not present).
   * 'inflamed': pulpitis / early untreated caries — ache-generating, reversible with treatment.
   * 'infected': periapical infection beginning — pain becoming constant.
   * 'abscess': established abscess — systemic involvement, nausea, cortisol.
   */
  function dentalConditionTier() {
    if (!s.health_conditions.includes('dental_pain')) return 'sound';
    return s.dental_condition;
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

  /**
   * Overall oral health tier — independent of acute pain or specific condition.
   * Drives spontaneous flare probability and prose about dental neglect.
   * 'healthy': well-maintained (>70). 'fair': some neglect (40–70). 'poor': significant neglect (15–40). 'severe': serious deterioration (<15).
   */
  function dentalHealthTier() {
    if (s.dental_health > 70) return 'healthy';
    if (s.dental_health > 40) return 'fair';
    if (s.dental_health > 15) return 'poor';
    return 'severe';
  }

  /** Qualitative gastritis pain state. 'none' when condition absent or pain is minimal. */
  function gastritisTier() {
    if (!s.health_conditions.includes('gastritis') || s.gastritis_pain < 8) return 'none';
    if (s.gastritis_pain < 35) return 'gnaw';    // low-level ache; background presence
    if (s.gastritis_pain < 65) return 'ache';    // moderate; affects attention and eating desire
    return 'burn';                               // significant; hard to ignore
  }

  /**
   * Ease gastritis pain by amount (from eating — food buffers acid, provides relief).
   * Eating does NOT spike gastritis pain (unlike dental); it eases it.
   * No-op if gastritis condition is absent.
   * @param {number} amount
   */
  function gastritisEase(amount) {
    if (!s.health_conditions.includes('gastritis')) return;
    s.gastritis_pain = Math.max(0, s.gastritis_pain - amount);
  }

  /**
   * Qualitative endorphin tier.
   *
   * Beta-endorphin baseline is ~45. Acute exercise raises it by 5–13 units depending on
   * intensity (see adjustNT calls in go_for_run, lift_weights, do_cardio). Half-life ~12-24h
   * means the glow persists for hours after a workout but decays well before the next day.
   *
   * 'baseline' — resting level; no notable opioid tone. Most of the time.
   * 'elevated' — moderate post-exercise glow; pain is slightly distant, small discomforts muted.
   *   Rough threshold: ~55 (10 above resting). Attainable after moderate exercise.
   * 'high'     — peak exertion or very recent intense exercise; distinct warmth-and-looseness quality.
   *   Rough threshold: ~65 (20 above resting). Attainable after running or heavy lifting.
   *
   * Thresholds are approximation debts — no quantitative human plasma β-endorphin to prose
   * mapping exists; direction is from Harber & Sutton 1984 (exercise and endorphins, PMID 6239812)
   * and Boecker 2008 (runner's high fMRI, PMID 18296435).
   */
  function endorphinTier() {
    const e = s.endorphin;
    if (e >= 65) return 'high';
    if (e >= 55) return 'elevated';
    return 'baseline';
  }

  /**
   * Therapeutic alliance tier — qualitative label for therapy_rapport.
   * @returns {'none' | 'tentative' | 'building' | 'established' | 'strong'}
   */
  function therapyRapportTier() {
    if (!s.therapy_active || s.therapy_rapport < 5) return 'none';
    if (s.therapy_rapport < 25) return 'tentative';   // still awkward; not sure this helps
    if (s.therapy_rapport < 50) return 'building';     // starting to trust the process
    if (s.therapy_rapport < 75) return 'established';  // real work happening
    return 'strong';                                   // internalized coping; the relationship holds
  }

  /**
   * Proxy blood pressure tier derived from NE (vasomotor tone), hydration, and energy.

   * Not a direct BP reading — a simulation proxy that drives vasovagal risk accumulation.
   * 'normal': adequate regulation. 'low': depleted at ≥1 input. 'very_low': multiple depletions.
   * Approximation debt (vasovagal): weights (0.5/0.3/0.2) and thresholds (0.55/0.30) chosen;
   * no real BP calibration data. NE is the primary driver (vasoconstriction + HR).
   */
  function bloodPressureTier() {
    const neScore = (s.norepinephrine - 25) / 63;        // 0–1 across NE clamp range [25, 88]
    const hydScore = 1 - Math.min(1, s.thirst / 1400);   // 1 = fully hydrated, 0 = severe deficit
    const engScore = s.energy / 100;
    const bp = neScore * 0.5 + hydScore * 0.3 + engScore * 0.2;
    if (bp > 0.55) return 'normal';
    if (bp > 0.30) return 'low';
    return 'very_low';
  }

  /** Qualitative vasovagal state. 'none' at baseline. 'episode' triggers once then resets. */
  function vasovagalTier() {
    if (s.vasovagal_recovery > 20) return 'recovery';
    if (s.vasovagal_risk >= 90) return 'episode';
    if (s.vasovagal_risk >= 65) return 'prodrome';
    if (s.vasovagal_risk >= 35) return 'building';
    return 'none';
  }

  // --- Menstrual cycle ---

  /**
   * Current day within the menstrual cycle, derived from elapsed time.
   * Returns 0 when cycle_start_time is null (character has no uterus).
   * Range: 1–cycle_length, wrapping continuously.
   * Correctly handles any amount of time advance, including long sleeps.
   */
  function cycleDay() {
    if (s.cycle_start_time === null) return 0;
    const len = s.cycle_length || 28;
    return (Math.floor((s.time - s.cycle_start_time) / 1440) % len) + 1;
  }

  /**
   * Qualitative menstrual cycle phase.
   * Returns 'none' when cycle_start_time is null (character has no uterus).
   * Phases (Approximation debt (menstrual): all boundary days chosen from textbook averages;
   *   individual variation is substantial. Reed & Carr 2018 (PMID 25905282): luteal ~14 days
   *   constant; follicular 10–16 days variable. Bleeding ~5 days median. LH surge days 13–15.
   *   ACOG: PMS defined as symptoms in final 5 days of luteal phase. No per-day NT unit data.):
   *   'menstrual'   — days 1–5
   *   'follicular'  — days 6–13
   *   'ovulatory'   — days 13–15 (overlap intentional: LH surge spans 13–15)
   *   'luteal'      — days 16 to (cycle_length - 6)
   *   'late_luteal' — last 6 days of cycle (PMS window)
   * @returns {'none'|'menstrual'|'follicular'|'ovulatory'|'luteal'|'late_luteal'}
   */
  /** Returns true if NSAID cramp relief is currently active (dose still in effect). */
  function isCrampRelieved() {
    return (s.cramp_relief_until || 0) > s.time;
  }

  function cyclePhaseTier() {
    if (s.cycle_start_time === null) return 'none';
    const d = cycleDay();
    const len = s.cycle_length || 28;
    // Approximation debt (menstrual): phase boundary days chosen from textbook menstrual physiology.
    // Reed & Carr 2018 (PMID 25905282): luteal phase ~14 days constant; follicular 10–16 days.
    // Bleeding duration: ~5 days median (PMID 33879662). Ovulation: LH surge days 13–15 typical.
    // Real cycle-length variation shifts all boundaries proportionally — this simplified model
    // keeps menstrual at 1-5 fixed and scales only the luteal/late-luteal boundary.
    if (d >= 1 && d <= 5) return 'menstrual';
    if (d >= 6 && d <= 12) return 'follicular';
    if (d >= 13 && d <= 15) return 'ovulatory';
    const pmsDayStart = len - 5; // Approximation debt (menstrual): PMS window = last 6 days chosen;
    // ACOG defines PMS as symptoms in final 5 days of luteal phase, consistent with this model.
    if (d >= pmsDayStart) return 'late_luteal';
    return 'luteal';
  }

  /**
   * Binder wear tier. Content and idle thoughts branch on these labels.
   * not_worn: no binder on (either none owned or chose not to wear today).
   * fresh: wearing, < 4h (comfortable, not yet thinking about it).
   * worn: wearing, 4–8h (present but manageable; approaching the advisory limit).
   * overdue: wearing, > 8h (past the 8h health advisory — body is signaling it).
   * Advisory limit: 8h recommended maximum for most commercial binders (Underworks/gc2b guidance).
   */
  function binderTier() {
    if (s.binder_start_time === null || ctx.items.countOf('binder') === 0) return 'not_worn';
    const hours = (s.time - s.binder_start_time) / 60;
    if (hours < 4) return 'fresh';
    if (hours < 8) return 'worn';
    return 'overdue';
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
   * Ratios: [0.83, 1.0, 1.11, 1.17] — first cycle shorter, later cycles lengthen.
   * Carskadon & Dement (Principles and Practice of Sleep Medicine, 6th ed.): first cycle
   * 70–100 min, later cycles 90–120 min. Blume et al. 2023 (PMID 37914631, n=6,064
   * PSG cycles): median 96 min overall, first cycle consistently shorter. Our ratios
   * (0.83/1.0/1.11/1.17 of base) produce 77/93/103/109 at base=93, consistent with
   * both sources. Per-character base drawn from truncated normal (mean=93, SD=12,
   * [70,120]) per Blume et al. 2023.
   * Accepted approximation: ratio variation across individuals is not modeled — only
   * total cycle length varies per character. Real per-cycle ratio variation is unknown.
   * @param {number} i
   * @returns {number} minutes
   */
  function cycleDuration(i) {
    const base = s.sleep_cycle_length ?? 90;
    // Accepted approximation: per-character cycle shape variation (not just length) is not
    // modeled — only total cycle duration varies. Ratio variation data unavailable.
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
    // 8-hour sleep → ~13–20% N3, ~20–25% REM (StatPearls NBK526132; Ohayon 2004 PMID 15325213).
    // Parameters: cycle-0 deep=0.50, k=0.57 (deep decay per cycle), cycle-0 REM=0.10,
    // slope=0.07 (REM growth per cycle), cap=0.55 (REM max).
    // Validation: at base=93, 5 cycles (480 min): deep~16%, REM~24% — within normal range.
    // Carskadon & Dement: N3 lasts 20–40 min in early cycles, disappears by cycle 4–5;
    // REM starts ~10 min in cycle 1, extends to 45–60 min by cycle 4–5.
    // Our model: cycle 0 deep = 0.50*77min = 39min, cycle 0 REM = 0.10*77min = 8min;
    //            cycle 4 deep = 0.05*109min = 5min, cycle 4 REM = 0.38*109min = 41min.
    // These match the Carskadon & Dement ranges. Parameters are curve-fitted, not
    // independently derived from mechanistic data, but produce realistic staging.
    //
    // Age-dependent N3 scaling: Van Cauter et al. 2000 (JAMA, PMID 10938176, n=149) found
    // N3 falls from ~19% at age 16–25 to ~3–8% at age 36–50 — roughly 80% reduction by midlife.
    // We linearly interpolate: age ≤ 25 → factor 1.0, age ≥ 50 → factor 0.2.
    // Accepted approximation: real N3-vs-age is non-linear (steep drop in 3rd decade,
    // plateau by 5th). Linear interpolation from 25→50 is a simplification but captures
    // the dominant trend for the game’s 18–48 age range.
    // REM trajectory is not age-adjusted — REM% is minimally affected by age in young/
    // middle adults (Ohayon 2004 PMID 15325213: −0.6% per decade from 20–60).
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

    const ser = s.serotonin - s.serotonin_baseline;         // relative to baseline
    const dop = s.dopamine - s.dopamine_baseline;           // relative to baseline
    const ne  = s.norepinephrine - s.norepinephrine_baseline; // relative to baseline
    const ga  = s.gaba - s.gaba_baseline;                   // relative to baseline
    const e = s.energy;    // absolute (not an NT)
    const st = s.stress;   // absolute (not an NT)
    const so = s.social;   // absolute (not an NT)

    // Physical overrides — the body breaking through neurochemistry
    if (st > 75) return 'fraying';        // acute stress overwhelms everything
    if (e <= 15 && st > 60) return 'numb'; // depleted + stressed = shutdown

    // Neurochemical fraying — NE high + GABA low = system overloaded
    if (ne > 15 && ga < -15) return 'fraying'; // relative to baseline

    // Neurochemical numb — serotonin + dopamine both very low = emotional shutdown
    if (ser < -25 && dop < -25) return 'numb'; // relative to baseline

    // Heavy — low energy + lowered serotonin, or sustained low serotonin + dopamine
    if ((e <= 25 && ser < -10) || (ser < -15 && dop < -15)) return 'heavy'; // relative to baseline

    // Hollow — low serotonin + social isolation
    if (ser < -10 && so <= 20) return 'hollow'; // relative to baseline

    // Quiet — low social engagement + moderate NE (withdrawn but not in pain)
    if (so <= 20 && ne > -15) return 'quiet'; // relative to baseline

    // Clear — serotonin high + dopamine high + NE moderate + GABA adequate (rare, earned)
    if (ser > 15 && dop > 15 && ne > -20 && ne < 10 && ga > -5) return 'clear'; // relative to baseline

    // Present — serotonin and dopamine above baseline
    if (ser > -5 && dop > -8) return 'present'; // relative to baseline

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
    const newFull = Math.min(s.stomach_capacity, prevFull + amount);
    const added = newFull - prevFull;

    // Liquid fraction of the added portion
    // Approximation debt (gastric emptying): mixed=0.3 is chosen. Real gastric partitioning for mixed meals
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
    // Approximation debt (hormonal satiation): proportional-to-stomach-fill is a simplification. Real ghrelin
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
      // Depletion asymmetry: direction confirmed (Jacques-Hamilton 2019 PMID 30489119 RCT;
      // Pickett 2020 DOI 10.1016/j.jrp.2020.103965: above-baseline engagement depletes introverts).
      // Magnitude [0.2, 0.8] not derivable — no study gives a ratio. Approximation debt (social decay).
      const introDepletion = 0.2 + (s.introversion / 100) * 0.6;
      s.social_energy = Math.max(0, s.social_energy - amount * introDepletion);
    }
  }

  /** @param {number} amount */
  function adjustConnectionDepth(amount) {
    s.connection_depth = Math.max(0, Math.min(100, s.connection_depth + amount));
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
    // Charging is capped at battery_health (degraded capacity). Draining can go to 0.
    s.phone_battery = Math.max(0, Math.min(s.battery_health, s.phone_battery + amount));
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
   * Calculate paycheck deductions: FICA + progressive federal income tax + state income tax
   * + employer insurance premium (pre-tax payroll deduction).
   *
   * Returns a breakdown object with gross, net, and each deduction component.
   * All rates are simplified approximations of the real US tax system.
   *
   * @param {number} grossPay — biweekly gross pay
   * @param {{ jurisdiction?: { country: string, region: string | null }, insurance_type?: string }} character
   * @returns {{ gross: number, net: number, fica: number, federal: number, state: number, insurance: number, totalDeductions: number }}
   */
  function calculatePaycheckDeductions(grossPay, character) {
    // Approximation debt (paycheck): FICA rate 7.65% is employee share only (SS 6.2% + Medicare 1.45%);
    // confirmed for 2025 — IRS Topic 751, SSA wage base $176,100 for 2025.
    // Does not model Social Security wage base cap or Additional Medicare Tax (0.9% above $200k).
    // Irrelevant for these characters.
    const ficaRate = 0.0765;
    const fica = grossPay * ficaRate;

    // Approximation debt (paycheck): federal brackets are 2025 single-filer thresholds
    // (IRS Rev. Proc. 2024-40; Tax Foundation 2025 brackets). Standard deduction $15,750
    // (2025, post-OBBB signed 2025-07-04) not applied — effective rates slightly overstated.
    // Real withholding depends on W-4 elections, filing status, and adjustments. Using
    // effective rate on annualized income rather than true marginal calculation for simplicity.
    const annualized = grossPay * 26; // 26 biweekly periods per year
    let federalRate;
    if (annualized <= 11925) {
      // Approximation debt (paycheck): 10% bracket ($0–$11,925 single filer 2025)
      federalRate = 0.10;
    } else if (annualized <= 48475) {
      // Approximation debt (paycheck): 12% bracket ($11,926–$48,475 single filer 2025)
      federalRate = 0.12;
    } else if (annualized <= 103350) {
      // Approximation debt (paycheck): 22% bracket ($48,476–$103,350 single filer 2025)
      federalRate = 0.22;
    } else {
      // Approximation debt (paycheck): capped at 24% ($103,351+ single filer 2025).
      // Higher brackets (32%, 35%, 37%) omitted — unlikely for these characters.
      federalRate = 0.24;
    }
    const federal = grossPay * federalRate;

    // Approximation debt (paycheck): state income tax is a rough approximation.
    // US states vary 0%–13.3%. No-income-tax states: AK, FL, NV, NH, SD, TN, TX, WA, WY.
    // Non-US jurisdictions use country-level approximations that don't reflect actual
    // payroll tax structures (PAYE, social contributions, etc.).
    let stateRate = 0;
    const country = character.jurisdiction?.country ?? 'US';
    const region = character.jurisdiction?.region ?? null;
    if (country === 'US') {
      const noIncomeTaxStates = ['AK', 'FL', 'NV', 'SD', 'TN', 'TX', 'WA', 'WY'];
      // NH taxes only interest/dividends, not wage income — effectively 0% for paychecks
      if (region && noIncomeTaxStates.includes(region)) {
        stateRate = 0;
      } else {
        // Approximation debt (paycheck): flat 4.5% for all other US states; real rates
        // range from 1% (ND) to 13.3% (CA top bracket). No progressive state brackets modeled.
        stateRate = 0.045;
      }
    } else if (country === 'CA') {
      // Approximation debt (paycheck): Canadian provincial tax ~5–8%; using 5% as rough average.
      // Federal tax handled separately in real system but merged here.
      stateRate = 0.05;
    } else if (country === 'GB') {
      // Approximation debt (paycheck): UK has no "state" tax. Class 1 NI employee rate is 8%
      // on earnings £12,571–£50,270 (2024/25 and 2025/26; GOV.UK rates-and-allowances-national-insurance-contributions).
      // Most of the 8% is already approximated in the federal slot (20% income tax);
      // 3% here represents the residual NI not captured there.
      stateRate = 0.03;
    } else if (country === 'AU') {
      // Approximation debt (paycheck): Australia has no state income tax; Medicare levy ~2%.
      stateRate = 0.02;
    } else if (country === 'DE' || country === 'FR') {
      // Approximation debt (paycheck): German/French social contributions ~20% employee side;
      // using 5% as a state-equivalent residual. Most is already approximated in the federal slot.
      stateRate = 0.05;
    } else if (country === 'NL') {
      // Approximation debt (paycheck): Dutch social premiums ~4% state-equivalent.
      stateRate = 0.04;
    } else {
      // Approximation debt (paycheck): unknown jurisdiction — 4% average.
      stateRate = 0.04;
    }
    const stateTax = grossPay * stateRate;

    // Employer insurance premium — pre-tax payroll deduction (biweekly portion of annual premium).
    // Only deducted for employer-sponsored plans; marketplace/medicaid/uninsured pay separately.
    // Approximation debt (paycheck): $55/biweekly (~$1,430/yr employee share) is the 2024 average
    // for single/individual coverage from the KFF Employer Health Benefits Survey 2024
    // (https://www.kff.org/health-costs/2024-employer-health-benefits-survey/):
    // average annual premium $8,951; employee share ~16% → ~$1,432/yr ÷ 26 = ~$55/biweekly.
    // Real premiums vary by plan tier, employer contribution %, region, and age.
    // Family coverage averages ~$6,296/yr employee share (~$242/biweekly; KFF 2024).
    let insurance = 0;
    if (character.insurance_type === 'employer') {
      insurance = 55;
    }

    const totalDeductions = fica + federal + stateTax + insurance;
    const net = Math.round((grossPay - totalDeductions) * 100) / 100;

    return {
      gross: grossPay,
      net: Math.max(0, net), // can't go negative from deductions
      fica: Math.round(fica * 100) / 100,
      federal: Math.round(federal * 100) / 100,
      state: Math.round(stateTax * 100) / 100,
      insurance: Math.round(insurance * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
    };
  }

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
   * Attempt to deduct a bill. If the player can afford it, pays automatically.
   * If not, queues a pending_bill entry for the player to choose pay or skip.
   * @param {number} amount
   * @param {string} billName — 'rent', 'utilities', 'phone'
   * @returns {boolean} true if paid immediately, false if queued for player choice
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
      // Successful payment resets failure counters and restores service if suspended.
      if (billName === 'phone') {
        s.phone_bills_failed = 0;
        if (s.phone_service === false) {
          s.phone_service = true;
          addPhoneMessage({ type: 'system', source: null, text: 'Service restored.', read: false });
        }
      } else if (billName === 'utilities') {
        s.utilities_bills_failed = 0;
        if (s.utilities_on === false) {
          s.utilities_on = true;
          addPhoneMessage({ type: 'system', source: null, text: 'Utility service has been restored.', read: false });
        }
      } else if (billName === 'rent') {
        s.rent_bills_failed = 0;
        s.eviction_risk = Math.max(0, (s.eviction_risk || 0) - 20);
      }
      return true;
    }
    // Insufficient funds — queue for player choice instead of auto-failing.
    // The player will see pay_bill_* / skip_bill_* interactions until resolved.
    if (!s.pending_bills) s.pending_bills = [];
    // Deduplicate: don't queue the same bill twice if generateIncomingMessages fires more than once
    if (!s.pending_bills.some(b => b.name === billName)) {
      s.pending_bills.push({ name: billName, amount, notified: false });
    }
    return false;
  }

  /**
   * Execute a skipped bill: apply failure consequences without payment.
   * Called by skip_bill_* interactions.
   * @param {string} billName — 'rent', 'utilities', 'phone'
   */
  function failBill(billName) {
    addPhoneMessage({
      type: 'bill',
      source: 'bank',
      text: 'Payment declined \u2014 ' + billName + '. Insufficient funds.',
      read: false,
      paid: false,
    });
    adjustStress(8);
    adjustSentiment('money', 'anxiety', 0.03);

    // Overdraft fee — charged once when crossing from ≥$0 into negative territory.
    // Not charged if already overdrawn (would compound indefinitely).
    if (s.money >= 0) {
      const overdraftFee = 30; // Approximation debt (debt): $30 chosen; real overdraft fees range $25–$35 depending on institution
      adjustMoney(-overdraftFee);
      addPhoneMessage({
        type: 'bank',
        source: 'bank',
        text: 'Overdraft fee — $' + overdraftFee + '. Your account balance is now negative.',
        read: false,
      });
      adjustSentiment('money', 'anxiety', 0.05);
    }

    // Per-bill consequence tracking
    if (billName === 'gym') {
      // Failed gym bill — membership suspended (gym auto-cancels non-payment).
      s.gym_membership = false;
      addPhoneMessage({
        type: 'system',
        source: null,
        text: 'Gym membership cancelled — payment failed.',
        read: false,
      });
    } else if (billName === 'phone') {
      if (!s.phone_bills_failed) s.phone_bills_failed = 0;
      s.phone_bills_failed++;
      // Approximation debt (bill consequences): threshold of 2 consecutive failures chosen;
      // real carriers vary by contract and jurisdiction (some suspend after 1 missed payment,
      // others after 30–60 days; 2 billing cycles is a common grace period in practice).
      if (s.phone_bills_failed >= 2 && s.phone_service !== false) {
        s.phone_service = false;
        addPhoneMessage({
          type: 'system',
          source: null,
          text: 'Your account has been suspended for non-payment. Service unavailable.',
          read: false,
        });
      }
    } else if (billName === 'utilities') {
      if (!s.utilities_bills_failed) s.utilities_bills_failed = 0;
      s.utilities_bills_failed++;
      // Approximation debt (bill consequences): threshold of 2 consecutive failures chosen;
      // utility shutoff timelines vary by state/province and provider — typically 30–60 days
      // past due before disconnection notice; 2 billing cycles approximates common practice.
      if (s.utilities_bills_failed >= 2 && s.utilities_on !== false) {
        s.utilities_on = false;
        addPhoneMessage({
          type: 'system',
          source: null,
          text: 'Your utility service has been disconnected. Contact the provider to restore service.',
          read: false,
        });
      }
    } else if (billName === 'insurance') {
      // Failed insurance premium — coverage lapses after 1 missed payment.
      // Approximation debt (insurance): real grace periods vary (30–90 days for marketplace,
      // employer plans may have payroll catch-up). Simplified to immediate lapse.
      s.insurance_type = 'uninsured';
      s.insurance_premium = 0;
      addPhoneMessage({
        type: 'system',
        source: null,
        text: 'Health insurance coverage lapsed — premium payment failed.',
        read: false,
      });
    } else if (billName === 'rent') {
      if (!s.rent_bills_failed) s.rent_bills_failed = 0;
      s.rent_bills_failed++;
      if (!s.eviction_risk) s.eviction_risk = 0;
      // Escalating notices: each successive failure triggers a more serious notice
      // Approximation debt (eviction risk): increments 25/35/40 chosen; real timeline depends on jurisdiction
      const increment = s.rent_bills_failed === 1 ? 25 : s.rent_bills_failed === 2 ? 35 : 40;
      s.eviction_risk = Math.min(100, s.eviction_risk + increment);
      if (s.eviction_risk >= 100 && !s.displaced) {
        s.eviction_risk = 100;
        s.displaced = true;
        // displaced flag set; checkEvents() in world.js will detect this and push 'displacement' event
        // for eventText to render. Routing to shelter/friend/street deferred — see TODO.md.
      }
    }

    // Remove from pending queue
    if (s.pending_bills) {
      s.pending_bills = s.pending_bills.filter(b => b.name !== billName);
    }
  }

  /**
   * Execute a paid bill when the player chooses to pay despite low funds.
   * Called by pay_bill_* interactions.
   * @param {string} billName — 'rent', 'utilities', 'phone'
   * @param {number} amount
   */
  function payBill(billName, amount) {
    adjustMoney(-amount);
    const balStr = perceivedMoneyString();
    addPhoneMessage({
      type: 'bill',
      source: 'bank',
      text: 'Autopay \u2014 ' + billName + '. ' + balStr + ' remaining.',
      read: false,
      paid: true,
    });
    // Per-bill restoration
    if (billName === 'phone') {
      s.phone_bills_failed = 0;
      if (s.phone_service === false) {
        s.phone_service = true;
        addPhoneMessage({
          type: 'system',
          source: null,
          text: 'Service restored.',
          read: false,
        });
      }
    } else if (billName === 'utilities') {
      s.utilities_bills_failed = 0;
      if (s.utilities_on === false) {
        s.utilities_on = true;
        addPhoneMessage({
          type: 'system',
          source: null,
          text: 'Utility service has been restored.',
          read: false,
        });
      }
    } else if (billName === 'rent') {
      s.rent_bills_failed = 0;
      s.eviction_risk = Math.max(0, (s.eviction_risk || 0) - 20);
    }

    // Remove from pending queue
    if (s.pending_bills) {
      s.pending_bills = s.pending_bills.filter(b => b.name !== billName);
    }
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
    // Queue externally-sourced messages when signal is inadequate or service is off.
    // Sent messages (player's own) and system messages (phone-local) bypass the queue.
    if (msg.direction !== 'sent' && msg.type !== 'system'
        && (s.phone_service === false || s.phone_signal <= 1)) {
      s.pending_messages.push(msg);
      return;
    }
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

  /**
   * Deliver queued messages when signal returns to adequate levels.
   * Called from advanceTime() after phone_signal is updated.
   * Returns the number of messages delivered (0 if none).
   * No RNG consumed — deterministic delivery.
   * @returns {number}
   */
  function deliverPendingMessages() {
    if (s.phone_service === false || s.phone_signal <= 1) return 0;
    const count = s.pending_messages.length;
    if (count === 0) return 0;
    for (const msg of s.pending_messages) {
      s.phone_inbox.push(msg);
    }
    s.pending_messages = [];
    return count;
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

    // NT fog compresses the time-since-observation thresholds.
    // Adenosine (primary, 0-100): perceptual clarity — high = foggier baseline.
    // Energy (secondary, 0-100): depleted energy amplifies fog.
    // Formula: fogLevel ∈ [0, 1]. At 0 → no compression. At 1 → thresholds shrink ~80%.
    // Approximation debt (observation fidelity): fog compression coefficients (0.55 adenosine,
    // 0.30 energy, 0.15 sleep inertia) and multipliers chosen; no direct empirical source.
    const adenosineContrib = Math.max(0, s.adenosine - 30) / 70;     // 0 below 30, full at 100
    const energyContrib    = Math.max(0, 60 - s.energy) / 60;        // 0 above 60, full at 0
    const inertiaContrib   = s.sleep_inertia ?? 0;                    // 0–0.6
    const fogLevel = Math.min(1,
      adenosineContrib * 0.55 + energyContrib * 0.30 + inertiaContrib * 0.25
    );

    // At fogLevel 1, thresholds shrink to ~20% of their clear values.
    const compressionFactor = 1 - fogLevel * 0.80;
    const exactCutoff   = 15  * compressionFactor;   // 15 min → 3 min at max fog
    const roundedCutoff = 45  * compressionFactor;   // 45 min → 9 min
    const vagueCutoff   = 120 * compressionFactor;   // 120 min → 24 min

    if (elapsed < exactCutoff)   return 'exact';
    if (elapsed < roundedCutoff) return 'rounded';
    if (elapsed < vagueCutoff)   return 'vague';
    return 'sensory';
  }

  function moneyFidelity() {
    const change = Math.abs(s.money - s.last_observed_money);

    // High financial anxiety + low balance sharpens money fidelity:
    // when you're desperate, you know exactly what you have.
    // Approximation debt (observation fidelity): anxiety × balance interaction coefficients chosen;
    // model-internal design parameter. Direction grounded in hypervigilance literature (anxious
    // attention narrows to threat-relevant stimuli), but specific thresholds (0.4 desperation gate,
    // 3× sharpFactor, $200 balance reference) have no empirical source.
    const moneyAnxiety = sentimentIntensity('money', 'anxiety'); // 0–1
    const desperationLevel = moneyAnxiety * Math.max(0, 1 - s.money / 200);
    if (desperationLevel > 0.4) {
      // Counting mode: anxiety compresses thresholds toward exact
      const sharpFactor = 1 + desperationLevel * 3;
      if (change < 2 * sharpFactor) return 'exact';
      if (change < 10 * sharpFactor) return 'approximate';
      if (change < 25 * sharpFactor) return 'rough';
      return 'qualitative';
    }

    // Stress/overwhelm compresses money-delta thresholds in the fuzzier direction.
    // Under high stress, you lose track of your balance faster.
    // Approximation debt (observation fidelity): stress compression coefficient chosen;
    // model-internal. Direction from attentional load / cognitive bandwidth literature
    // (stress narrows working memory for peripheral tracking), but 0.60 blur factor and
    // stress threshold (40) have no empirical source.
    const stressContrib = Math.max(0, s.stress - 40) / 60;           // 0 below 40, full at 100
    const blurFactor = 1 - stressContrib * 0.60;                      // at max: thresholds shrink 60%

    if (change < 2  * blurFactor) return 'exact';
    if (change < 10 * blurFactor) return 'approximate';
    if (change < 25 * blurFactor) return 'rough';
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
    if (fidelity === 'exact') {
      const rounded = Math.round(s.money);
      return rounded < 0 ? '-$' + Math.abs(rounded) : '$' + rounded;
    }
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
    if (m < 0) return 'negative — around -$' + Math.round(Math.abs(m) / 5) * 5;
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
    if (m < 0) return 'negative — the balance is in the hole';
    if (m < 10) return 'not much — under ten dollars, maybe';
    if (m < 100) return 'maybe $' + (Math.floor(m / 10) * 10) + '-something';
    if (m < 1000) return 'a few hundred, maybe';
    if (m < 5000) return 'a few thousand';
    return 'several thousand';
  }

  function qualitativeMoneyString() {
    const mt = moneyTier();
    if (mt === 'overdrawn') return 'less than nothing';
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
    satiation: 1.0,     // hedonic adaptation resets fully during sleep
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

    const charAll = ctx.character.getAll();
    const activeFriendSlots = charAll ? Object.keys(charAll).filter(k => /^friend\d+$/.test(k) && charAll[k] != null).sort() : ['friend1', 'friend2'];
    for (const slot of activeFriendSlots) {
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

    // --- Family absence effects ---
    // Absent and hostile family: no guilt mechanic (contact with hostile family costs more than it relieves).
    // Conditional: guilt accumulates after 10 days (heavier, less frequent).
    // Supportive and distant: similar to friend guilt, accumulates after 7 days.
    const familyType = s.family_type ?? 'distant';
    const familyArchetype = s.family_archetype ?? 'checked_out';
    const isHostileFamily = familyType === 'hostile' || familyArchetype === 'critical';

    // Hostile family dread — unread messages from hostile/critical family accumulate ambient dread.
    // This is distinct from guilt (longing to reconnect) — it's the weight of knowing something
    // hostile is sitting unread. More unread messages → faster accumulation.
    // Mechanism: anticipatory threat from known-hostile social source activates LC-NE vigilance;
    // the avoidance loop is psychologically documented (Winch 2014 for emotional wounds → avoidance).
    // Approximation debt (hostile family): accumulation rate and unread boost chosen.
    // Direction: anticipatory stress from known hostile social sources activates HPA and LC-NE;
    // minority stress literature establishes this pathway (DuBois 2024 PMID 38190769 — high
    // enacted stigma → blunted CAR + elevated bedtime cortisol; Huebner 2021 PMID 34152785 —
    // experimental minority stress → elevated salivary cortisol). No study measures dread
    // accumulation rate per unread hostile message; all magnitudes (baseRate, unreadBoost,
    // decay) are design choices with direction-only grounding.
    if (isHostileFamily) {
      if (s.family_unread > 0) {
        const baseRate = 0.006; // Approximation debt (hostile family): per-sleep accumulation — direction supported, magnitude chosen
        const unreadBoost = Math.min(s.family_unread * 0.004, 0.010); // Approximation debt (hostile family): per-message boost — model-internal, no literature rate
        s.family_dread = Math.min(1, (s.family_dread ?? 0) + baseRate + unreadBoost);
      } else {
        // No unread messages: dread decays slowly during sleep (absence of threat → relief)
        s.family_dread = Math.max(0, (s.family_dread ?? 0) - 0.005); // Approximation debt (hostile family): decay rate chosen; relief-from-threat direction plausible, no literature rate
      }
    }

    if (familyType !== 'absent' && familyType !== 'hostile') {
      const lastFamilyContact = s.family_contact ?? 0;

      // First sleep: initialize contact time, skip guilt
      if (lastFamilyContact === 0) {
        s.family_contact = now;
      } else {
        const familyAbsenceDays = (now - lastFamilyContact) / 1440;
        const graceDays = familyType === 'conditional' ? 10 : 7;

        if (familyAbsenceDays > graceDays) {
          // Growth rate: slower than friend guilt (family contact less frequent baseline)
          // Conditional: grows faster after grace (heavier quality of obligation)
          const baseRate = familyType === 'conditional' ? 0.006 : 0.004;
          const growth = baseRate * Math.min(1 + familyAbsenceDays / 20, 1.5);
          s.family_guilt = Math.min(1, (s.family_guilt ?? 0) + growth);
        }
      }
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
    // Approximation debt (biological jitter): frequencies (0.017 ≈ 59h period, 0.0073 ≈ 137h period) chosen to be
    // incommensurate, preventing period-locking. Amplitudes (2.0 and 1.5) chosen. Real biological
    // rhythms include documented ultradian (~90min) and infradian periods that could ground these choices.
    return Math.sin(timeHours * 0.017 + seed) * 2 +
           Math.sin(timeHours * 0.0073 + seed * 1.7) * 1.5;
  }

  // --- Bipolar II phase ---
  // Slow sinusoidal oscillation on a multi-week cycle. Phase derived from game time,
  // never stored. Period ~28 days (40320 min) — consistent with rapid-cycling lower
  // bound; most bipolar II cycles are longer (weeks to months). This is the simulation's
  // compressed representation.
  // Returns value in [-1, 1]: -1 = depressive pole, +1 = hypomanic pole, 0 = euthymic.
  // Approximation debt (bipolar): cycle period 28 days chosen. Real bipolar II cycling
  // is irregular and event-triggered, not sinusoidal (Kupka 2003 PMID 14728111 —
  // rapid cycling defined as ≥4 episodes/year; individual cycle length ranges weeks to
  // months). Sinusoidal is a first-order approximation of cycling tendency only. 28-day
  // period is simulation's compressed lower-bound; no published data maps cycle phase
  // to NT target offsets at this resolution.
  function bipolarPhase() {
    if (!s.has_bipolar) return 0;
    const timeHours = s.time / 60;
    // 28-day period = 672 hours. Two incommensurate frequencies to avoid perfect regularity.
    return Math.sin(timeHours * (2 * Math.PI / 672)) * 0.7
         + Math.sin(timeHours * (2 * Math.PI / 1109)) * 0.3; // ~46 day secondary
  }

  // --- Target functions ---
  // Active systems have target functions fed by current state.
  // Placeholder systems return baseline 50 (will gain feeders as systems are built).

  /** Serotonin target: sleep quality, social connection, hunger (tryptophan availability), sentiments */
  function serotoninTarget() {
    let t = 50;
    // Sleep quality is the strongest lever (DESIGN-EMOTIONS.md)
    const sq = s.last_sleep_quality;
    // Sleep quality reference 0.85: healthy adult sleep efficiency averages 85-90% (Ohayon et al. 2004
    // PMID 15325213). 0.70 penalised everyone with normal sleep. Coefficient 20 still chosen.
    t += (sq - 0.85) * 20;  // good sleep pushes up, poor sleep pushes down
    // Approximation debt (NT coupling): coefficient 20 chosen; no individual-level data maps PSG
    // quality to 5-HT target units directly. Direction and dominance: ESM b=0.344 for sleep
    // quality→next-day affect, 2.6× larger than reverse direction (Kallestad 2019 PMC6456824).
    // Meta-analysis: sleep loss → positive affect SMD −0.27 to −1.14 (Vandekerckhove & Wang 2018
    // PMC8193556). Mechanism: kynurenine shunting depletes tryptophan substrate (Bhat 2020
    // PMID 33281456). Magnitude (±6 pts at full range from ref) remains a design choice.
    // Social connection — modulated by connection_depth.
    // High depth (genuine reciprocal contact): full 0.15 coefficient.
    // Low depth (parasocial buffering only): reduced to 0.06.
    // The floor (0.06) is not zero because even parasocial contact signals non-isolation.
    // At depth=100: coeff=0.15 (unchanged). At depth=0: coeff=0.06 (40% of full).
    // Approximation debt (NT coupling): coefficients 0.06 and 0.09 chosen; no individual-level
    // data maps social connection to 5-HT target units. Direction from Dölen et al. 2016
    // (PMID 27874831 / PMC5119885): chronic social isolation reduces DRN 5-HT neuron excitability
    // via SK3 Ca²⁺-activated K⁺ channels in mice; sex-dependent reversal in females (Bicks et al.
    // 2020 DOI 10.1016/j.neuropharm.2020.107996). Human data indirect only. Parasocial vs
    // genuine contact split (0.06/0.09) has no direct empirical support.
    const connectionCoeff = 0.06 + 0.09 * (s.connection_depth / 100);
    t += (s.social - 50) * connectionCoeff;
    // Hunger reduces tryptophan availability (competes for blood-brain transport)
    // Threshold 75: ATD protocol requires >60% plasma Trp reduction for mood effects (PMC3756112);
    // ordinary hunger at tier 'hungry' (60) does not reach that level. very_hungry (75) is closer.
    if (s.hunger > 75) t -= (s.hunger - 75) * 0.2;
    // Approximation debt (NT coupling): coefficient 0.2 chosen; no individual-level data maps
    // hunger magnitude to 5-HT target units. Direction from Bubenik 1993 (PMID 1373446 —
    // PMID unverified): food deprivation decreases brain 5-HT tissue levels in mice. Mechanism:
    // BBB tryptophan competition — carbohydrate vs. protein meals produce 54% Trp:LNAA ratio
    // difference (Wurtman 2003 PMID 12499331); ATD requires >60% plasma Trp reduction for mood
    // effects (van Donkelaar 2011 PMC3756112). Threshold 75 (very_hungry) reflects that
    // ordinary hunger (tier hungry/60) does not approach ATD-level depletion. Max effect −5 pts
    // at hunger=100; acute short-term hunger probably produces far less (2–3 pts).
    // Dehydration lowers mood. Threshold 700ml = 1% deficit; max meaningful effect ~1400ml (2%).
    // Approximation debt (NT coupling): coefficient 0.009 chosen to produce ~6pt serotonin drop at
    // 1400ml; no published data directly measures 5-HT or tryptophan availability under mild
    // dehydration in humans. Behavioral anchor: 1.36% body mass loss → significant mood disturbance
    // in women (Armstrong 2012 PMID 22190027). Serotonin as mechanism is plausible (tryptophan
    // transport enzyme-dependent on water volume) but not directly measured. Effect size is
    // coincidentally in behavioral range; derivation is not forward.
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
      t -= workDread * 6;    // dread lowers serotonin target at work
      t += workSat * 3;      // satisfaction gives a small lift
      // Approximation debt (NT coupling): dread −6 and satisfaction +3 chosen; no individual-level
      // data maps work sentiment to 5-HT target units. Direction: burnout-level exhaustion in
      // medical workers associated with ~58% plasma 5-HT reduction (Zhong 2018 PMC6134687); but
      // burnout is extreme and aggregate — dread is a continuous sentiment [0,1] so max −6 is far
      // below burnout magnitude. Asymmetry (2:1 dread:sat) directionally supported by loss-aversion
      // literature (Kahneman & Tversky) but not calibrated from serotonin-specific data.
    }

    // Friend guilt at home — the weight of not responding
    if (s.location && s.location.startsWith('apartment')) {
      const charAll = ctx.character.getAll();
      const friendSlotKeys = charAll ? Object.keys(charAll).filter(k => /^friend\d+$/.test(k) && charAll[k] != null) : ['friend1', 'friend2'];
      const totalFriendGuilt = friendSlotKeys.reduce((sum, slot) => sum + sentimentIntensity(slot, 'guilt'), 0);
      t -= totalFriendGuilt * 3;   // max ~3 per friend at extreme guilt
      // Approximation debt (NT coupling): coefficient 3 (max −6 total) chosen; no published data
      // maps guilt intensity to 5-HT target units. Mechanistic basis is weak: guilt's neurochemistry
      // runs primarily through prefrontal-limbic and HPA (cortisol) circuits, not clearly through
      // serotonin targets. Serotonin modulates harm aversion (Crockett 2010 PMC2951447) — guilt
      // may engage this pathway, but direction is ambiguous (guilt = high serotonin harm-aversion
      // OR low serotonin disinhibition?). Coefficient is small relative to other 5-HT inputs.
      // Chronic unresolved guilt could reduce serotonin indirectly via sustained rumination
      // (already partly captured by effectiveInertia). Potential double-counting unresolved.
    }

    // Financial anxiety at home — the weight of bills you haven't checked
    if (s.location && s.location.startsWith('apartment')) {
      const moneyAnx = sentimentIntensity('money', 'anxiety');
      t -= moneyAnx * 4;    // max ~3.2 at high anxiety
      // Approximation debt (NT coupling): coefficient 4 chosen; no individual-level data maps
      // financial anxiety sentiment to 5-HT target units. Direction: financial hardship associated
      // with subsequent depressive symptoms in French longitudinal cohort (PMC12281044). Mechanism:
      // chronic stress → HPA → eventual serotonergic deficit. Note potential double-counting:
      // financial stress already contributes to the general stress variable (affects DA/NE/GABA);
      // this additional 5-HT path captures the chronic "ambient dread" dimension not in momentary
      // stress. Max effect −3.2 is small relative to sleep/social — proportionally appropriate.
    }

    // Direct money level effects — being broke hurts regardless of anxiety
    // 'overdrawn' included: negative balance extends the penalty naturally via the continuous formula.
    const mt = moneyTier();
    if (mt === 'tight' || mt === 'scraping' || mt === 'broke' || mt === 'overdrawn') {
      // Scale: tight → -1, scraping → -2.5, broke → -3.75, overdrawn → -3.75 + |debt|*0.019
      if (s.money < 200) t -= (200 - s.money) * 0.019;
      // Approximation debt (NT coupling): coefficient 0.019 and threshold $200 chosen; no
      // individual-level data maps a dollar amount to a 5-HT target change. Direction: the
      // income-depression gradient is epidemiologically real (Lorant 2003 PMID 12522017 —
      // confirmed: "Socioeconomic inequalities in depression: a meta-analysis," Am J Epidemiol
      // 157(2):98-112). Scarcity impairs cognition equivalent to ~one night TSD
      // (Mani 2013 DOI 10.1126/science.1238041). Threshold $200 is the tight/scraping boundary,
      // also a design convention. Max effect −3.8 at zero balance; separates "objectively broke"
      // from the financial_anxiety sentiment above.
    }

    // Sleep debt — cumulative deficit erodes serotonin baseline
    // Mechanism: chronic sleep restriction (4h/night × multiple days) desensitises 5-HT1A
    // receptor system — blunted pituitary ACTH response to 5-HT1A agonist (Grassi Zucconi 2006
    // PMID 16408408: "more than a week" of restriction for receptor-level effects). Produces
    // depression-like 5-HT1A and CRH receptor changes (Roman 2005 PMC2579986). Separate from
    // acute single-night effects (modeled via last_sleep_quality above).
    // Threshold 360 min = ~6 days at 1h/day shortfall, consistent with "more than a week"
    // requirement for receptor changes. This is the best-supported threshold in the literature.
    if (s.sleep_debt > 360) {
      t -= Math.min((s.sleep_debt - 360) * 0.005, 8);  // max -8 at extreme debt
      // Approximation debt (NT coupling): coefficient 0.005 and cap 8 chosen; no individual-level
      // data maps sleep debt minutes to 5-HT target units. Direction: receptor desensitisation
      // literature establishes direction and multi-day requirement (Roman et al. 2005 PMC2579986:
      // 8 days restriction → 5-HT1A desensitisation; PMID 16408408 — PMID unverified, refers to
      // a different paper; use PMC2579986 for this finding). Max −8 pts (~13% of usable range
      // [20,82]) is structurally reasonable for chronic severe restriction.
    }

    // Menstrual cycle — estradiol upregulates serotonin synthesis and receptor density.
    // Follicular/ovulatory: rising estradiol → serotonin boost. Late luteal: estradiol falls,
    // progesterone metabolite (ALLO) withdrawal → serotonin deficit. Mechanism: McEwen & Alves 1999
    // (PMID 10567432); Schmidt et al. 1998 (PMID 9694283) — PMDD from hormone fluctuation not levels.
    // Approximation debt (menstrual): coefficients 4 (follicular), 5 (ovulatory), -6 (late_luteal)
    // chosen. Mechanism is established (McEwen & Alves 1999 PMID 10567432; Schmidt et al. 1998
    // PMID 9694283), but no published data maps estradiol serum levels to 5-HT target units in
    // ambulatory models. Direction is well-supported; magnitudes are arbitrary.
    {
      const phase = cyclePhaseTier();
      if (phase === 'follicular') t += 4;       // Approximation debt (menstrual)
      else if (phase === 'ovulatory') t += 5;   // Approximation debt (menstrual): estradiol peak
      else if (phase === 'late_luteal') t -= 6; // Approximation debt (menstrual): ALLO withdrawal
    }

    // Chronic pain — hEDS persistent pain reduces serotonin target.
    // Mechanism: chronic pain and serotonin are bidirectionally linked; low 5-HT increases
    // pain sensitivity (descending serotonergic inhibition of pain; Millan 2002 PMID 12034378 —
    // "Descending control of pain", Prog Neurobiol 66:355-474).
    // Modeled as: chronic_pain_level > 10 → graded serotonin reduction.
    // Approximation debt (hEDS): coefficient 0.07 chosen; no quantitative mapping from
    // chronic musculoskeletal pain intensity to 5-HT target units exists in the literature.
    // Riva et al. 2012 (PMID 21764519) shows elevated cortisol in localized musculoskeletal pain
    // vs. fibromyalgia, direction applies by analogy; no hEDS-specific or per-NRS-unit data exists.
    if (s.heds && s.chronic_pain_level > 10) {
      t -= (s.chronic_pain_level - 10) * 0.07; // Approximation debt (hEDS)
    }

    // HRT — estradiol pathway raises serotonin target when taken regularly; missed doses lower it.
    // Gated on hrt_type, not trans_presentation.
    // Approximation debt (HRT): hormone effects vary by type, dose, preparation, and individual.
    // This is a gross simplification. Mechanism: estradiol upregulates SERT and 5-HT2A receptor
    // expression (Wei & Chiu 2025 PMID 40264347 review); McEwen & Alves 1999 review on estrogen
    // and serotonin receptor density (PMID 10567432 — verified in code but resolves to unrelated
    // article in current PubMed; original: McEwen & Alves 1999 Endocrine Reviews 20:279-307,
    // DOI 10.1210/er.20.3.279). Direction well-established. Clinical outcome: gender-affirming HRT
    // associated with 60% lower odds of depression (Tordoff 2022 PMID 35212746); systematic review
    // found decreased depression and anxiety across gender identities (Baker 2021 PMID 33644622).
    // Neither provides a 5-HT target unit conversion; +5 pts and missed-dose penalty are chosen.
    if (s.hrt_active && s.hrt_type === 'estradiol') {
      const timeSinceDose = s.hrt_last_taken > 0 ? s.time - s.hrt_last_taken : Infinity;
      const missedDays = timeSinceDose === Infinity ? 0 : Math.floor(timeSinceDose / (24 * 60));
      if (missedDays === 0 && timeSinceDose < 24 * 60) {
        // Taken today — small positive lift on serotonin target.
        // Approximation debt (HRT): +5 pts serotonin target bonus when taken regularly chosen.
        // No study maps daily estradiol dose to a serotonin target unit change.
        t += 5;
      } else if (missedDays >= 1) {
        // Missed day(s) — mood instability reduces serotonin target.
        // Approximation debt (HRT): −3 per missed day, capped at −9 chosen.
        // Direction: estradiol fluctuation (not just level) drives mood instability (Schmidt 1998
        // PMID 9694283 — PMDD from hormonal fluctuation); dose-response not literature-derived.
        t -= Math.min(missedDays * 3, 9);
      }
    }

    // Therapy rapport — internalized coping skills from established therapeutic alliance.
    // Approximation debt (therapy): +3 pts max serotonin target bonus chosen; direction supported
    // by meta-analyses showing CBT/talk therapy produces lasting 5-HT-mediated mood improvement
    // (Linden 2006 DOI 10.1016/j.neubiorev.2005.12.007 — PMID unverified), but magnitude not
    // derivable from any study mapping therapy hours to 5-HT target units. Effect scales linearly
    // with rapport above 50 (established alliance); below 50 the relationship is too new to produce
    // lasting neurochemical change.
    if (s.therapy_active && s.therapy_rapport > 50) {
      t += (s.therapy_rapport - 50) * 0.06; // max +3 at rapport=100
    }
    // DBT emotional regulation — DBT explicitly targets emotion identification and modulation;
    // meta-analyses show DBT produces serotonin-mediated mood stabilization in BPD and high-
    // neuroticism populations (Linehan 2006 PMID 16816451). Effect gated at rapport >= 40
    // (DBT skills require more therapeutic trust than CBT cognitive reframing).
    // Approximation debt (therapy modality): +0.5 serotonin target chosen; direction supported,
    // magnitude not derivable from dose-response data. Neuroticism bonus: DBT was designed for
    // emotional dysregulation — high-neuroticism characters benefit more.
    if (s.therapy_active && s.therapy_modality === 'dbt' && s.therapy_rapport >= 40) {
      const neuroBonus = s.neuroticism > 65 ? 1.5 : 1.0;
      t += 0.5 * neuroBonus;
    }

    // Binder — chest dysphoria relief when binding. Serotonin target +3 when wearing.
    // Approximation debt (binder): +3 pts chosen; direction supported by self-report data
    // showing majority report decreased dysphoria while binding (Barker 2021 Transgender Health
    // 6:50, PMID 33816752). Magnitude unquantified at NT level; consistent with other
    // dysphoria-relief pathways modeled here.
    if (s.binder_start_time !== null && ctx.items.countOf('binder') > 0) {
      t += 3;
    }

    // Code-switching fatigue → serotonin. The identity strain of sustained self-modification
    // in dominant-culture spaces erodes mood baseline. Continuous from 0.
    // Approximation debt (code-switching): coefficient 0.04 chosen; no study maps code-switching
    // load to 5-HT target units. Direction: racial discrimination is associated with depressive
    // symptoms (Paradies 2015 PMID 26398658 meta-analysis); chronic self-monitoring is a
    // plausible intermediate mechanism via sustained cognitive load and identity conflict.
    if (s.code_switching_fatigue > 0) {
      t -= s.code_switching_fatigue * 0.04; // Approximation debt (code-switching): serotonin coefficient 0.04
    }

    // --- Constitutional mental health condition modifiers ---
    // Depression: raised floor — serotonin never fully recovers to healthy baseline.
    // Mechanism: MDD involves chronic 5-HT1A receptor desensitization and reduced TPH2
    // expression (Savitz 2009 PMID 19272524), producing a structural floor on serotonin
    // target independent of acute state. Floor 30 (vs normal 20): the worst moments are
    // closer to baseline, but the best moments are also constrained (see ceiling below).
    // Approximation debt (mental health): floor 30 chosen; MDD literature establishes
    // reduced 5-HT function (Savitz 2009 PMID 19272524 — TPH2 and 5-HT1A desensitization)
    // but does not map to simulation target units. Direction well-supported; magnitude chosen.
    let serFloor = 20;
    let serCeiling = 82;
    if (s.has_depression) {
      serFloor = 30; // the floor is higher — you can't fall as far, but can't rise as high either
    }
    // Bipolar depressive pole raises floor (same as depression); hypomanic pole has no
    // serotonin effect (mania is dopaminergic, not serotonergic).
    const bPhase = bipolarPhase();
    if (s.has_bipolar && bPhase < -0.3) {
      // Depressive pole: lerp floor from 20 to 30 as phase goes from -0.3 to -1.0
      const depressiveStrength = clamp((-bPhase - 0.3) / 0.7, 0, 1);
      serFloor = Math.max(serFloor, 20 + depressiveStrength * 10);
    }

    // --- Psychiatric medication modifiers ---
    // Antidepressant (SSRI): lowers the serotonin floor by up to 15 pts (partially reversing
    // the depression/PTSD-elevated floor back toward healthy baseline). SSRIs block SERT
    // reuptake, increasing synaptic 5-HT availability.
    // Approximation debt (psych medication): -15 floor modifier chosen. Real SSRI efficacy
    // is ~50-60% response rate (Cipriani 2018 Lancet — PMID 29477251); individual variation
    // not modeled. Floor reduction rather than target boost matches the sustained mechanism.
    {
      const ssriOnset = psychMedOnsetFactor('antidepressant');
      if (ssriOnset > 0) {
        serFloor = Math.max(15, serFloor - 15 * ssriOnset);
      }
    }
    // Mood stabilizer: narrows bipolar depressive serotonin floor deviation by 50%.
    {
      const msOnset = psychMedOnsetFactor('mood_stabilizer');
      if (msOnset > 0 && s.has_bipolar && serFloor > 20) {
        serFloor = serFloor - (serFloor - 20) * 0.5 * msOnset;
      }
    }

    return clamp(t, serFloor, serCeiling);
    // Bounds from clinical literature (not approximation debt):
    // Floor 20: ATD leaves ~10–15% serotonin synthesis function (PMC3756112); chronic MDD
    // floor ~20–25% (PMC3756112, PMC3398160). Ceiling 82: no natural sustained 5-HT elevation
    // above healthy baseline in ambulatory humans — above-baseline states are transient (acute
    // meal, MDMA), not stable targets. 82 represents the empirical ceiling for chronic daily life.
    // Depression floor 30: structural constraint — the serotonergic system cannot reach healthy
    // lows because the baseline is already compromised.
  }

  /** Dopamine target: energy, general vitality, sentiments */
  function dopamineTarget() {
    let t = 50;
    // Energy reflects capacity for engagement
    t += (s.energy - 50) * 0.25;
    // Approximation debt (NT coupling): coefficient 0.25 chosen; no individual-level data gives a
    // unit-per-unit energy→DA conversion. Direction well-supported: striatal dopamine integrity
    // correlates with effort allocation (Treadway 2012 PMC3391699); dopamine depletion from
    // striatum → cessation of effortful reward-seeking (Salamone & Correa 2012 PMID 23141060);
    // fatigue modulates DA availability (Tanaka 2017 DOI 10.1038/s41598-017-00561-6); physical
    // fatigability inversely associated with posterior putamen DA integrity (Espay 2024
    // PMC11447735). The 0.25 coefficient (±12.5 pts at full range) is an upper-bound estimate;
    // 0.15–0.20 would be equally defensible.
    // Chronic stress depletes dopamine — continuous from 0 (no empirical onset threshold).
    // Equivalent peak: at stress=100 → -8 (same as old (100-60)*0.2=8).
    // Gambarana 1999 PMID 10217282; acute stress activates mesolimbic (Pruessner 2004 PMID 15028770 — PMID unverified)
    // but chronic suppresses basal DA — this term models the chronic direction only.
    t -= s.stress * 0.08;
    // Approximation debt (NT coupling): coefficient 0.08 chosen; no individual-level data maps
    // stress magnitude to DA target units. Direction: chronic stress reduces extraneuronal DA
    // basal concentration in nucleus accumbens (Gambarana 1999 PMID 10217282: 7-day unavoidable
    // stress, ~20–40% reduction in microdialysis basal DA). Chronic stress selectively blunts
    // phasic reward-evoked DA; basal relatively preserved (Communications Biology 2024
    // DOI 10.1038/s42003-024-06658-9). Acute stress activates mesolimbic DA (Pruessner 2004
    // — PMID 15028770 unverified for this citation; confirmed study at different PMID). Pizzagalli
    // 2014 review: anhedonia from dysfunctional stress × reward interactions (PMC3972338). Max
    // −8 pts at stress=100 = 13% of scale; rodent data suggests 20–40% reduction — may be low.

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
      t -= workDread * 5;    // dread kills motivation
      t += workSat * 4;      // satisfaction supports engagement
      // Approximation debt (NT coupling): dread −5 and satisfaction +4 chosen; no individual-level
      // data maps work sentiment to DA target units in occupational contexts. Direction: dopamine's
      // role in reward motivation is well-established (Schultz 1997 reward prediction error
      // framework). Work dread (anticipatory avoidance) should suppress dopaminergic motivation;
      // satisfaction (positive feedback prediction) should sustain it. Asymmetry reversed vs.
      // serotonin (DA: sat 4 > dread 5; 5-HT: dread dominates 2:1) — reflects dopamine's
      // prediction-error function where both positive and negative signals are strongly processed.
      // Magnitudes are design-proportional across all DA inputs.

      // Financial anxiety at work — working for money you'll never keep
      const moneyAnx = sentimentIntensity('money', 'anxiety');
      t -= moneyAnx * 2;
      // Approximation debt (NT coupling): coefficient 2 chosen; no individual-level data maps
      // financial anxiety at work to DA target units. Direction: scarcity captures attentional
      // bandwidth (Mani 2013 DOI 10.1126/science.1238041) and chronic financial stress attenuates
      // reward system function (Pizzagalli 2014 PMC3972338). Smaller than the home financial_anxiety
      // effect (4) because monetary anxiety at work partially competes with work-engagement signals
      // already in workDread/workSat.
    }

    // Sleep debt — cumulative deficit kills motivation
    // Mechanism: sleep deprivation reduces D2/D3 receptor availability in caudate/putamen/thalamus.
    // Volkow 2008 (PMC2710773): one night TSD → caudate binding −5.5% (p<0.002), putamen −3.4%
    // (p<0.05), thalamus −5.3% (p<0.002). Interpreted as DA spillover or D2R downregulation.
    // Volkow 2012 (PMC3433285): VS BPND −5.1% after TSD, correlating with impaired alertness.
    // Functional outcome regardless of mechanism: blunted reward processing, reduced motivation.
    // PET anchor: ~5% D2 reduction ≈ −2.75 pts (5% of 50 baseline). Current threshold 120 min
    // = ~2 days at 1h/day shortfall; Volkow studies used full one-night deprivation (~480 min
    // debt). Threshold 120 is conservative — debt this small may not yet produce measurable
    // receptor changes. Dose-response for partial sleep loss is not established at this precision.
    if (s.sleep_debt > 120) {
      t -= Math.min((s.sleep_debt - 120) * 0.006, 10);  // max -10 at extreme debt
      // Approximation debt (NT coupling): coefficient 0.006 and cap 10 chosen; no dose-response
      // curve for partial sleep loss → DA target units exists. PET anchor: at debt=480 (one full
      // night missed): (480−120)×0.006 = 2.16 pts, consistent with Volkow 2008 data (~2.75 pts
      // for 5% D2 reduction; PMC2710773). Cap 10 = effect at ~1900 min (30+ hrs missed sleep).
    }

    // --- Constitutional mental health condition modifiers ---
    // Depression: lowered ceiling — the good moments genuinely can't reach as high.
    // Anhedonia is the signature: reward system structurally dampened.
    // Mechanism: reduced D2/D3 receptor availability and blunted VTA phasic firing
    // (Pizzagalli 2014 PMC3972338). Ceiling 70 (vs normal 85): engagement caps out lower.
    // Approximation debt (mental health): ceiling 70 chosen; anhedonia literature establishes
    // direction (blunted reward — Pizzagalli 2014 PMC3972338) but not a mapping to
    // simulation ceiling units. 70 vs normal 85 is a 17% reduction; literature shows
    // blunted reward response but no unit-compatible calibration exists.
    let dopFloor = 25;
    let dopCeiling = 85;
    if (s.has_depression) {
      dopCeiling = 70; // the ceiling is lower — genuine anhedonia
    }
    // Bipolar: depressive pole = same as depression; hypomanic pole = ceiling elevated.
    const bPhaseDop = bipolarPhase();
    if (s.has_bipolar) {
      if (bPhaseDop < -0.3) {
        // Depressive pole: lower ceiling
        const depStr = clamp((-bPhaseDop - 0.3) / 0.7, 0, 1);
        dopCeiling = Math.min(dopCeiling, 85 - depStr * 15); // down to 70
      } else if (bPhaseDop > 0.3) {
        // Hypomanic pole: raised ceiling, boosted target
        const hypoStr = clamp((bPhaseDop - 0.3) / 0.7, 0, 1);
        dopCeiling = Math.min(95, dopCeiling + hypoStr * 15); // up to 100 (capped at 95)
        t += hypoStr * 10; // direct target boost — everything feels possible
        // Approximation debt (bipolar): hypomanic dopamine boost +10 and ceiling +15 chosen.
        // Direction: hypomania involves increased dopaminergic activity — Berk 2007
        // (PMID 17688462) dopamine dysregulation hypothesis; Cousins 2009 (PMID 19922550)
        // reviews multiple lines of evidence for dopaminergic hyperactivation in mania.
        // Magnitude (+10 target, +15 ceiling) is design-proportional; no individual-level
        // calibration data exists for simulation units.
      }
    }

    // --- Psychiatric medication modifiers ---
    // Antidepressant (SSRI) side effect: slight emotional blunting — dopamine ceiling -5.
    // Mechanism: SSRIs increase 5-HT in raphe -> 5-HT2C activation in VTA -> tonic inhibition
    // of mesolimbic DA neurons (Di Giovanni, Di Matteo et al. 2002 PMID 12974395 — 5-HT2C
    // receptors and dopamine modulation; PMID 18612854 is unverified and should not be cited).
    // Approximation debt (psych medication): -5 ceiling chosen. Modest blunting; no individual-
    // level DA ceiling data from SSRI use exists.
    {
      const ssriOnset = psychMedOnsetFactor('antidepressant');
      if (ssriOnset > 0) {
        dopCeiling -= 5 * ssriOnset;
      }
    }
    // Mood stabilizer: narrows bipolar phase amplitude by 50%.
    // Approximation debt (psych medication): 50% amplitude reduction chosen. Lithium reduces
    // bipolar relapse risk (Geddes et al. 2004 AJP meta-analysis PMID 14754766); lamotrigine
    // attenuates depressive phases (Calabrese et al. 1999 PMID 10084633). No published per-patient
    // dopaminergic amplitude coefficient exists; 50% is a design choice.
    {
      const msOnset = psychMedOnsetFactor('mood_stabilizer');
      if (msOnset > 0 && s.has_bipolar) {
        const euthymicCeiling = 85;
        dopCeiling = dopCeiling + (euthymicCeiling - dopCeiling) * 0.5 * msOnset;
        if (bPhaseDop > 0.3) {
          const hypoStr = clamp((bPhaseDop - 0.3) / 0.7, 0, 1);
          t -= hypoStr * 10 * 0.5 * msOnset;
        }
      }
    }

    return clamp(t, dopFloor, dopCeiling);
    // Bounds from clinical literature (not approximation debt):
    // Floor 25: MDD anhedonia = 30–40% below healthy dopaminergic tone (PMID 3347226,
    // PMC10594643). Near-zero would be Parkinson's (structural denervation), not depression.
    // 25 = ~50% of baseline is defensible for severe anhedonia in the simulation's chronic-
    // state framing. Ceiling 85: sustained high-DA state above baseline is pharmacological
    // (amphetamine) — no chronic ambulatory state exceeds it. 85 leaves room for energized
    // engagement states without implying drug-level dopaminergic activation.
    // Depression ceiling 70: structural anhedonia — reward system cannot reach healthy peaks.
    // Bipolar hypomanic ceiling 95: elevated but not pharmacological.
  }

  /** Norepinephrine target: stress, sleep quality.
   *  REM sleep occurs in NE-free environment — good sleep lowers NE. */
  function norepinephrineTarget() {
    let t = 40;
    // Stress is the primary driver — continuous from 0 (no empirical zero-effect baseline).
    // LC tonic firing: baseline 1–3 Hz, stress 3–6 Hz (Aston-Jones & Cohen 2005 PMID 16022602).
    // PTSD CSF NE ~1.4× elevation (Geracioti et al. 2001 PMID 11481155). At stress=100 → t=58.
    t += s.stress * 0.18;
    // Approximation debt (NT coupling): coefficient 0.18 chosen; no individual-level data maps
    // stress magnitude to NE target units continuously. Direction and range well-supported: LC
    // tonic firing baseline 1–3 Hz, stress 3–6 Hz (Aston-Jones & Cohen 2005 PMID 16022602).
    // PTSD CSF NE ~1.4× elevation over controls (Geracioti et al. 2001 PMID 11481155 — note: this
    // is Geracioti, not Bremner; Bremner 2001 is a different paper — PMID unverified). Plasma NE
    // 2–3× elevation under acute psychological stress (Dimsdale & Moss 1980 PMID 7351746 —
    // PMID unverified). Formula produces NE target 58 at stress=100; with sleep penalty moderate
    // stress reaches 60–65 — consistent with PTSD ~1.4× elevation. This coefficient has the
    // strongest directional support of all NT coupling coefficients given direct CSF/LC data.
    // Poor sleep elevates NE (unprocessed emotional charge)
    // Mechanism: LC-NE neurons are near-silent during REM sleep (Aston-Jones & Bloom 1981
    // J Neuroscience 1:876–86; Hobson et al. 1975). REM is the NE-free processing window —
    // disrupted REM impairs NE clearance. Sleep restriction elevates sympathovagal ratio
    // (sympathetic dominance; Mullington 2009 PMID 19110130 — 6 days restriction). Urinary
    // MHPG-sulfate (central NE metabolite) elevated after total sleep deprivation (Franck
    // 1993 PMID 8396844). Plasma NE: inconsistent results in healthy subjects (Irwin 1999
    // PMID 10372697 — no significant change) — urinary metabolites more consistent than plasma.
    // Reference 0.65: "adequate but not excellent" — healthier reference point than 0.5 given
    // healthy adult mean sleep efficiency 85–90% (Ohayon 2004 PMID 15325213).
    const sq = s.last_sleep_quality;
    t -= (sq - 0.65) * 15;  // good sleep lowers, poor sleep raises
    // Approximation debt (NT coupling): coefficient 15 chosen; no individual-level data maps
    // sleep quality to NE target units. Mechanism solid (REM/LC quiescence; Aston-Jones &
    // Bloom 1981; Hobson et al. 1975); magnitude uncertain — plasma NE studies inconsistent
    // (urinary NE metabolites more consistent than plasma; Franck 1993 PMID 8396844 — PMID
    // unverified). Total swing ±5.25 pts across typical range [0.65±0.35]; ~24% of usable NE
    // range may overstate effect.
    // Social isolation elevates NE — chronically lonely people show elevated urinary NE metabolites
    // (Cacioppo & Hawkley 2009 PMC5130104; Cole 2007 Genome Biology cited therein). Effect is
    // consistent in urinary metabolites and SNS-innervated tissues; inconsistent in plasma.
    // Max +2 pts at zero social contact — small, proportional to mixed human evidence.
    if (s.social < 50) t += (50 - s.social) * 0.04;
    // Mild dehydration activates sympathetic nervous system — NE elevation at ~1% body water deficit.
    // Ganio 2011 (PMID 21736786): mood/fatigue/cognitive effects at 1.36% dehydration in women.
    // Armstrong 2012 (PMID 22190027): significant mood disturbance at 1.36% body mass loss.
    // The behavioral effects are real; NE as the specific mediator is inferred from general
    // sympathetic activation physiology (dehydration → volume depletion → baroreceptor-mediated
    // SNS activation → NE release). No published study directly measures plasma/urinary NE
    // as a function of mild dehydration at 1–2% body mass loss.
    // Threshold 700ml = 1% deficit. Approximation debt (NT coupling): coefficient 0.005 chosen
    // to produce ~3.5pt NE rise at 1400ml (2% deficit); no published study directly measures
    // plasma or urinary NE as a function of mild dehydration at 1–2% body mass loss.
    if (s.thirst > 700) t += (s.thirst - 700) * 0.005;
    // Bladder urgency — autonomic arousal from detrusor distension activates sympathetic axis
    // via pudendal/pelvic nerve circuitry (Chermansky & Gebhart 2009 PMID 19234784 — PMID unverified).
    // Urgency → cortical-limbic arousal → noradrenergic activation. Mechanism established;
    // Approximation debt (NT coupling): magnitudes 2/5 chosen; no quantitative human NE
    // measurement during bladder urgency states at these fill thresholds. Direction from
    // Chermansky & Gebhart 2009 (PMID 19234784 — PMID unverified): detrusor distension activates
    // sympathetic axis via pudendal/pelvic nerve circuitry → cortical-limbic arousal → NE.
    if (s.bladder_fill > 450) t += 5;
    else if (s.bladder_fill > 300) t += 2;
    // Menstrual cycle — late luteal irritability has a noradrenergic component; prostaglandin
    // sensitization during menstruation raises pain-related sympathetic tone.
    // Approximation debt (menstrual): +3 late_luteal (PMS irritability/SNS activation), +2 menstrual
    // (cramping → pain-mediated sympathetic activation) chosen. No published ambulatory NE measurements
    // across menstrual phases exist; direction is physiologically plausible but magnitudes are arbitrary.
    {
      const phase = cyclePhaseTier();
      if (phase === 'late_luteal') t += 3; // Approximation debt (menstrual): PMS SNS component
      else if (phase === 'menstrual') t += 2; // Approximation debt (menstrual): pain/cramp SNS activation
    }
    // Chronic pain — hEDS persistent pain activates sympathetic axis (pain → LC-NE pathway).
    // Chronic musculoskeletal pain elevates SNS tone via nociceptive afferent signaling to LC.
    // Mechanism: pain → dorsal horn → locus coeruleus → elevated NE tonic firing. The LC-NE
    // role in pain modulation is well-established (Millan 2002 PMID 12034378); PMID 12927216
    // previously cited here is wrong (unrelated sleep paper) — PMID unverified for Nakagawa 2003.
    // Approximation debt (hEDS): coefficient 0.05 chosen; no ambulatory study maps chronic
    // musculoskeletal pain intensity to NE target units in hEDS or any comparable population.
    // Direction is mechanistically grounded; magnitude arbitrary.
    if (s.heds && s.chronic_pain_level > 15) {
      t += (s.chronic_pain_level - 15) * 0.05; // Approximation debt (hEDS)
    }

    // Hostile family dread — unread hostile messages create anticipatory vigilance.
    // Mechanism: anticipatory threat activates LC tonic NE firing (Aston-Jones & Cohen 2005
    // PMID 16022602). Minority stress experimental paradigm elevated salivary cortisol in
    // the hostile condition (Huebner 2021 PMID 34152785) — cortisol and NE co-activate under
    // psychosocial threat. High enacted stigma (transgender adults) associated with blunted
    // cortisol awakening response + elevated bedtime cortisol (DuBois 2024 PMID 38190769),
    // consistent with chronic sympathoadrenal dysregulation. No study measures NE specifically
    // from anticipatory hostile-family contact; magnitude is a design choice.
    // Approximation debt (hostile family): coefficient 3 chosen; max +3 pts NE at full dread.
    // Direction supported (see block comment above). No individual-level NE measurement
    // under hostile-family anticipatory stress; coefficient is a design choice.
    if ((s.family_dread ?? 0) > 0) {
      t += (s.family_dread ?? 0) * 3; // Approximation debt (hostile family)
    }

    // HRT — testosterone pathway raises NE target modestly when taken regularly.
    // Gated on hrt_type, not trans_presentation.
    // Approximation debt (HRT): testosterone → sympathoadrenal activation → NE elevation.
    // Direction and quantitative anchor: testosterone replacement in Klinefelter's syndrome
    // increased urinary NE from 120.78 ± 58.33 to 154.08 ± 61.35 nmol/day (~28% increase,
    // p<0.001; Foresta 2001 PMID 11158039). In hypogonadal men, basal NE was lower than healthy
    // controls and restored to normal by testosterone (Del Rio 1995 PMID 8719299). These are
    // clinical hypogonadism studies — the magnitude in people with baseline testosterone may differ.
    // +3 pts on a 0-100 scale is a conservative design choice; no direct unit conversion available.
    if (s.hrt_active && s.hrt_type === 'testosterone') {
      const timeSinceDose = s.hrt_last_taken > 0 ? s.time - s.hrt_last_taken : Infinity;
      const missedDays = timeSinceDose === Infinity ? 0 : Math.floor(timeSinceDose / (24 * 60));
      if (missedDays === 0 && timeSinceDose < 24 * 60) {
        // Approximation debt (HRT): +3 pts NE target when testosterone taken regularly chosen.
        // Direction from mechanism in block above (testosterone → sympathoadrenal activation).
        // +3 pts is model-internal; no study maps exogenous testosterone dose to NE target units.
        // Missed-dose penalty not modeled for testosterone NE path — HRT-naive baseline
        // is assumed when not on testosterone, so no active penalty on missed days.
        t += 3;
      }
    }

    // EMDR — bilateral stimulation facilitates reconsolidation of threat memories, reducing
    // tonic NE arousal. Meta-analyses: Chen 2015 (PMID 25527872) — EMDR reduces PTSD symptoms
    // with effect sizes comparable to trauma-focused CBT. NE reduction pathway: desensitization
    // of amygdalar threat response lowers tonic LC firing.
    // Approximation debt (therapy modality): -0.5 NE target chosen; direction supported,
    // magnitude not derivable. PTSD bonus: EMDR was designed for trauma processing — PTSD
    // characters benefit more (wider reduction reflects stronger treatment indication).
    if (s.therapy_active && s.therapy_modality === 'emdr' && s.therapy_rapport >= 35) {
      const ptsdBonus = s.has_ptsd ? 2.0 : 1.0;
      t -= 0.5 * ptsdBonus;
    }

    // --- Constitutional mental health condition modifiers ---
    // PTSD: elevated NE baseline — chronic hyperarousal. The nervous system is calibrated
    // to a threat level that no longer exists. Floor raised to 35 (vs normal 25): NE never
    // drops to calm baseline. Direct target boost +10: tonic LC firing is elevated.
    // Mechanism: Geracioti 2001 (PMID 11481155) CSF NE ~1.4× elevation in PTSD combat
    // veterans. Southwick 1999 (PMID 10560025): review of NE role in PTSD pathophysiology,
    // including elevated 24-hour urinary catecholamine excretion. The +10 offset represents
    // chronic LC tonic firing elevation, not acute startle response.
    // Approximation debt (mental health): +10 NE baseline and floor 35 chosen; Geracioti's
    // 1.4× CSF elevation maps to ~20 pts on 0-100 scale (50→70), but tonic target elevation
    // is smaller than CSF peak measurement. +10 is conservative.
    if (s.has_ptsd) {
      t += 10;
    }

    return clamp(t, s.has_ptsd ? 35 : 25, 88);
    // Bounds from clinical literature (not approximation debt):
    // Floor 25: low-NE depression subtype shows ~40–50% reduction below healthy NE tone
    // (PMID 3415426). Floor 10 would require pharmacological NE blockade — not an ambulatory
    // state. PTSD floor 35: chronic hyperarousal prevents NE from dropping to healthy calm.
    // Ceiling 88: PTSD chronic hyperarousal ~1.5–2× healthy NE (PMID 3588809); Bremner
    // 2001 (PMID 11481155) CSF NE data gives ~1.4× in PTSD. 88 is ~1.76× baseline 50 —
    // consistent with the upper range of pathological chronic hyperarousal states.
  }

  /** GABA target: chronic stress slowly erodes. ALLO crosslink (placeholder). */
  function gabaTarget() {
    let t = 55;
    // Chronic stress depletes GABA — continuous from 0 (no empirical onset threshold).
    // Coefficient 0.12 calibrated to literature:
    // - Acute: Hasler 2010 (PMID 20634372 / PMC3107037): threat-of-shock → ~18% prefrontal
    //   GABA reduction in healthy subjects (F=19.02, df=1,67, p<0.0001). 18% of baseline 55
    //   = ~10 pts. At stress=85 (severe acute stressor), coefficient produces ~10 pts ≈ 18%.
    // - Chronic: MRS meta-analysis (Kühn & Gallinat ~2013, cited in Sanacora reviews):
    //   depressed patients vs. controls Hedges' g ~−0.35, representing ~15–30% GABA reduction.
    //   Fogaça & Bhattacharya 2019 review (PMC6422907): chronic unpredictable stress reduces
    //   GAD67, VGAT, GAT3 in PFC — structural effects requiring weeks, consistent with the
    //   slow chronic stress direction. At stress=100: 100×0.12=12 pts = 21.8% reduction from
    //   baseline 55. Falls within the empirically supported 15–30% chronic range.
    // - Null result caveat: Bhattacharya 2017 (PMID 28180078 / PMC5280001) found no significant
    //   GABA change with TSST at 7T — social stress paradigm, different from physical threat.
    //   Effect may be stressor-modality-dependent.
    // Old threshold at stress=50 had no empirical basis and was removed.
    t -= s.stress * 0.12; // Calibrated: 21.8% reduction at stress=100 ∈ [15%, 30%] chronic range
    // Menstrual cycle — ALLO (allopregnanolone, progesterone metabolite) is a GABA-A PAM.
    // Late luteal: ALLO falls → GABAergic deficit. Mechanism: Backstrom et al. 2003 (PMID 12568989);
    // Majewska et al. 1986 (PMID 2875070) — ALLO as endogenous benzodiazepine-like modulator.
    // Approximation debt (menstrual): -4 late_luteal, -2 menstrual (progesterone still dropping) chosen.
    // ALLO withdrawal mechanism well-established (Backstrom et al. 2003 PMID 12568989; Majewska 1986
    // PMID 2875070), but no published data maps ALLO decline magnitude to GABA target units. Arbitrary.
    {
      const phase = cyclePhaseTier();
      if (phase === 'late_luteal') t -= 4;  // Approximation debt (menstrual): ALLO withdrawal deficit
      else if (phase === 'menstrual') t -= 2; // Approximation debt (menstrual): progesterone still clearing
    }
    // Routine comfort reduces anxiety baseline — predictability supports GABAergic tone.
    // Mechanism: habitual behavior reduces decision fatigue and uncertainty, lowering tonic
    // anxiety. Reviews: Wood & Rünger 2016 (DOI 10.1146/annurev-psych-122414-033417) — habits
    // offload deliberative control; Lally & Gardner 2013 (DOI 10.1080/08870446.2012.700867)
    // — routine and automaticity reduce experienced stress. No direct GABA MRS data for
    // routine behavior; coefficient is an approximation.
    // Approximation debt (habit sentiment): routine comfort coefficient +2 chosen.
    // Direction: Wood & Rünger 2016 (DOI 10.1146/annurev-psych-122414-033417) and
    // Lally & Gardner 2013 (DOI 10.1080/08870446.2012.700867) establish habit→reduced
    // stress/uncertainty; no GABA MRS data for routine behavior exists. +2 coefficient
    // is design-proportional relative to other GABA drivers; magnitude not calibrated.
    t += sentimentIntensity('routine', 'comfort') * 2;

    // Hostile family dread — anticipatory threat erodes GABAergic tone.
    // Same mechanism as chronic stress (anticipatory anxiety → HPA → GABA deficit), but
    // sourced from a specific interpersonal threat rather than general stress load.
    // Direction: minority stress elevates cortisol (Huebner 2021 PMID 34152785; DuBois 2024
    // PMID 38190769); chronic HPA activation depletes GABA via the stress→GABA pathway modeled
    // in the stress coefficient above. No study directly measures GABA under hostile-family
    // anticipatory stress — mechanism inferred from the general stress→GABA path.
    // Approximation debt (hostile family): coefficient 2 chosen; max −2 pts GABA at full dread.
    // Direction inferred from stress→GABA pathway (see block comment above); no direct
    // literature measures GABA under hostile-family anticipatory stress. Coefficient 2
    // (vs NE coefficient 3) reflects that GABA effect is secondary (mediated by HPA),
    // not primary. Note: family_dread also raises stress indirectly via NE, which
    // independently depletes GABA — the direct path here captures the anticipatory
    // threat-specific component.
    if ((s.family_dread ?? 0) > 0) {
      t -= (s.family_dread ?? 0) * 2; // Approximation debt (hostile family)
    }

    // HRT — estradiol pathway supports GABAergic tone (ALLO precursor pathway).
    // Gated on hrt_type, not trans_presentation.
    // Approximation debt (HRT): estradiol → neurosteroid ALLO → GABA-A PAM.
    // Mechanism: allopregnanolone (ALLO) is a positive allosteric modulator of GABA-A receptors;
    // estradiol drives ALLO synthesis (Backstrom 2003 PMID 12568989 — citation in code but
    // resolves to unrelated article in current PubMed; original: Backstrom et al. 2003 Steroids
    // 68:669-89, DOI 10.1016/S0039-128X(03)00089-0; Majewska 1986 PMID 2875070 also not verified
    // in current PubMed — original Majewska et al. 1986 Science 232:1004-7). Direction well-
    // established in neuroendocrinology. Magnitude (+3/−2 per day) not literature-derived; no
    // study maps exogenous estradiol dose to GABA-A receptor activity in pts/hr units.
    // Clinical outcome: Baker 2021 (PMID 33644622) found decreased anxiety with HRT, consistent
    // with GABA-A anxiolytic pathway but not isolating the mechanism.
    if (s.hrt_active && s.hrt_type === 'estradiol') {
      const timeSinceDose = s.hrt_last_taken > 0 ? s.time - s.hrt_last_taken : Infinity;
      const missedDays = timeSinceDose === Infinity ? 0 : Math.floor(timeSinceDose / (24 * 60));
      if (missedDays === 0 && timeSinceDose < 24 * 60) {
        // Taken today — small GABA support.
        // Approximation debt (HRT): +3 pts GABA target bonus when taken regularly chosen.
        // Direction from block above (estradiol → ALLO → GABA-A PAM). +3 is model-internal;
        // no study maps daily estradiol dose to GABA-A receptor activity in target units.
        t += 3;
      } else if (missedDays >= 1) {
        // Missed day(s) — GABA deficit from disrupted ALLO signaling.
        // Approximation debt (HRT): −2 per missed day, capped at −6 chosen.
        // Direction: disrupting estradiol → lower ALLO → reduced GABA-A support. Magnitude
        // arbitrary; no dose-interruption NT literature maps missed estradiol days to
        // GABA target unit change.
        t -= Math.min(missedDays * 2, 6);
      }
    }

    // DBT distress tolerance — DBT skills (TIPP, radical acceptance, distress tolerance)
    // directly support GABAergic calming. Linehan 2006 (PMID 16816451): DBT reduces self-harm
    // and emotional dysregulation in BPD; mechanism consistent with improved inhibitory control
    // (prefrontal GABA). Gated at rapport >= 30 (basic skills teachable earlier than emotion
    // regulation). Neuroticism bonus: DBT's distress tolerance module is specifically designed
    // for emotional dysregulation — high-neuroticism characters internalize more.
    // Approximation debt (therapy modality): +1 GABA target chosen; direction supported,
    // magnitude not derivable from any study mapping DBT hours to GABA MRS units.
    if (s.therapy_active && s.therapy_modality === 'dbt' && s.therapy_rapport >= 30) {
      const neuroBonus = s.neuroticism > 65 ? 1.5 : 1.0;
      t += 1 * neuroBonus;
    }

    // --- Constitutional mental health condition modifiers ---
    // GAD: lowered ceiling — GABA tone cannot reach full relaxation.
    // Mechanism: GAD involves chronic prefrontal GABA deficit; MRS studies show reduced
    // occipital/prefrontal GABA in GAD (Goddard 2001 PMID 11729018). The structural
    // deficit means even at rest, GABA cannot reach healthy peak.
    // Ceiling 65 (vs normal 78): calm moments still have an undertone.
    // Approximation debt (mental health): ceiling 65 chosen; Goddard 2001 (PMID 11729018)
    // shows ~10-15% GABA reduction in GAD vs controls, which on a 0-100 scale maps to
    // roughly max ~47-50 for typical values. Ceiling 65 is generous (range constraint,
    // not typical value); no simulation-unit calibration available.
    let gabaCeiling = 78;
    if (s.has_gad) {
      gabaCeiling = 65;
    }

    // --- Psychiatric medication modifiers ---
    // Anxiolytic (buspirone): raises GABA ceiling by up to 10 pts.
    // Buspirone is a 5-HT1A partial agonist and D2 partial agonist; it has limited direct
    // GABAergic action (unlike benzodiazepines), but anxiolytic effect reduces HPA-driven
    // GABA suppression indirectly. Mechanism is indirect; ceiling +10 is a design choice.
    // Approximation debt (psych medication): +10 ceiling chosen; no per-patient GABA target
    // unit data for buspirone exists in the literature.
    {
      const anxOnset = psychMedOnsetFactor('anxiolytic');
      if (anxOnset > 0) {
        gabaCeiling += 10 * anxOnset;
      }
    }

    return clamp(t, 28, gabaCeiling);
    // Bounds from clinical literature (not approximation debt):
    // Floor 28: Sanacora 1999 (PMID 10565505): ~52% GABA reduction in melancholic depression
    // vs. healthy controls (occipital cortex MRS). 55 × 0.48 ≈ 26, rounded to 28.
    // Note: meta-analytic pooled g ~−0.35 for MDD vs. controls suggests typical MDD floor
    // is closer to 40–47; the 52% is specific to the melancholic subsample and represents the
    // worst-case lower bound. Floor 28 is defensible as the simulation's severe-case floor.
    // Ceiling 78: no natural chronic high-GABA ambulatory state documented. Benzodiazepines
    // produce pharmacologically elevated GABA-A activity but are modeled separately.
    // GAD ceiling 65: structural anxiolytic deficit — even calm is not fully calm.
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
    let t = 45 + diurnal * 20;
    // Approximation debt (NT coupling): diurnal amplitude 20 chosen; a larger amplitude (30–35)
    // would better reflect biological ratio but narrows headroom for stress inputs. Literature
    // anchor: salivary cortisol peak ~14–25 nmol/L at 8AM, nadir ~1–5 nmol/L near midnight
    // (Debono 2009 Endocrine Reviews DOI 10.1210/er.2009-0009; Kirschbaum & Hellhammer 1989
    // review — PMID unverified for K&H 1989). Ratio peak:nadir ≈ 5:1 to 8:1; on 0–100 scale
    // with amplitude 20: peak=65, nadir=25, ratio=2.6:1 — understates biological ratio.
    // Amplitude 20 is a practical compromise; no individual-level data grounds this choice.
    // Stress pushes cortisol above rhythm
    if (s.stress > 40) t += (s.stress - 40) * 0.3;
    // Approximation debt (NT coupling): stress coefficient 0.3 and threshold 40 chosen;
    // no dose-response curve maps perceived stress scale (PSS) scores to salivary/plasma
    // cortisol in ambulatory humans continuously. Direction: virtual-TSST produces small-to-medium
    // cortisol response (ESsg=0.65; Veling et al. 2019 meta-analysis PMID 31536942 — confirmed:
    // "A meta-analysis of cortisol reactivity to the Trier Social Stress Test in virtual
    // environments," Psychoneuroendocrinology). V-TSST response is smaller than standard TSST;
    // standard TSST meta-analyses (Allen et al. 2014 DOI 10.1016/j.psyneuen.2013.10.010) report
    // larger cortisol increases. Max effect (100−40)×0.3=18 pts above diurnal → consistent with
    // severe sustained stress pathology. Threshold 40 is arbitrary — other NT systems use
    // continuous coupling from 0. Retained here because cortisol has a "threshold" quality
    // (below mild stress, no measurable HPA activation), but exact value at 40 is uncalibrated.
    // Very low money — financial stress adds cortisol
    if (s.money < 50) t += 3;
    // Approximation debt (NT coupling): +3 chosen; no published study maps a specific
    // dollar-threshold to a salivary cortisol change. Direction: financial hardship is a
    // well-documented chronic stressor (income-depression gradient epidemiologically real;
    // Lorant 2003 PMID 12522017 — confirmed: "Socioeconomic inequalities in depression: a
    // meta-analysis," Am J Epidemiol 157(2):98-112; Mani 2013 DOI 10.1126/science.1238041).
    // The +3 flat bonus below $50 is design-pragmatic. A continuous coefficient would avoid
    // a hard threshold but would require independent calibration.
    // Routine comfort lowers cortisol baseline — predictability reduces HPA activation.
    // Same mechanistic rationale as GABA: habits offload deliberative control, reducing
    // the uncertainty signals that drive HPA/sympathetic activation (Wood & Rünger 2016,
    // DOI 10.1146/annurev-psych-122414-033417). No cortisol MRS anchor for this coupling.
    // Approximation debt (habit sentiment): routine comfort coefficient -3 chosen.
    // Direction: Wood & Rünger 2016 (DOI 10.1146/annurev-psych-122414-033417) — habits
    // offload deliberative control, reducing uncertainty-driven HPA activation. No cortisol
    // MRS anchor for routine behavior; -3 is design-proportional. Larger than GABA +2
    // reflects cortisol being the more direct HPA output measure.
    t -= sentimentIntensity('routine', 'comfort') * 3;
    // Autism routine importance — disrupted routines are more aversive; cortisol is elevated
    // proportionally to how much routine irritation has accumulated above a low threshold.
    // The threshold 0.3 separates ambient irritation from meaningful disruption.
    // Approximation debt (routine): autism routine importance → cortisol; Wigham 2015
    // PMID 25312784 (repetitive behaviours and anxiety in autism); coefficient 3 chosen.
    if (s.autism ?? false) {
      const routineIrrit = sentimentIntensity('routine', 'irritation');
      if (routineIrrit > 0.3) t += (routineIrrit - 0.3) * 3;
    }
    // Chronic pain elevates cortisol via HPA axis activation.
    // Chronic pain → hypothalamic CRH release → pituitary ACTH → adrenal cortisol.
    // Direction: localized chronic musculoskeletal pain associated with elevated cortisol
    // awakening response vs. controls (Riva et al. 2012 PMID 21764519 — cortisol awakening
    // response in shoulder/neck pain vs. fibromyalgia; fibromyalgia shows blunted cortisol,
    // localized pain shows mild elevation). hEDS maps closer to localized pain end of spectrum.
    // Approximation debt (hEDS): coefficient 0.04 chosen; Riva 2012 (PMID 21764519) shows
    // directional trend but no per-NRS-unit cortisol mapping exists; magnitude is arbitrary.
    if (s.heds && s.chronic_pain_level > 20) {
      t += (s.chronic_pain_level - 20) * 0.04; // Approximation debt (hEDS)
    }
    // Identity concealment anxiety — the sustained low-level cortisol cost of managing perception.
    // Generalized from trans-only to any identity incongruence. At workplace when gender not disclosed:
    // the constant monitoring of how you're reading. At unfamiliar locations: heightened scrutiny.
    // Scales with identity congruence — low congruence = more to manage = more cortisol.
    // Approximation debt (structural discrimination): identity concealment → cortisol; direction
    // grounded in minority stress theory (Meyer 2003 Psych Bull PMID 12956539) and trans-specific
    // hypervigilance literature (Hendricks & Testa 2012 Professional Psych DOI 10.1037/a0029597).
    // Magnitude (+2 at work, +0.8 at unfamiliar location) is arbitrary — no ambulatory cortisol
    // study maps identity concealment intensity to cortisol units.
    if (isTrans()) {
      const outWork = s.out_at_work || [];
      const isWorkLoc = s.location === 'workplace' || s.location === 'workplace_bathroom';
      if (isWorkLoc && !outWork.includes('gender')) {
        // Approximation debt (structural discrimination): +2 cortisol target for gender concealment at work
        t += 2;
      }
      const locFamiliarity = s.location_familiarity[s.location] ?? 0;
      if (locFamiliarity < 0.2) {
        // Approximation debt (structural discrimination): +0.8 at unfamiliar location (passing unknown)
        t += 0.8;
      }
    }
    // Code-switching fatigue → cortisol. Sustained self-monitoring in dominant-culture spaces
    // produces chronic hypervigilance — a well-documented HPA axis activation pathway in minority
    // stress literature. Continuous from 0 (no threshold — any switching is a stressor).
    // Approximation debt (code-switching): coefficient 0.06 chosen; no ambulatory cortisol study
    // maps code-switching intensity to salivary cortisol units. Direction grounded in minority
    // stress model (Meyer 2003 Psych Bull PMID 12956539).
    if (s.code_switching_fatigue > 0) {
      t += s.code_switching_fatigue * 0.06; // Approximation debt (code-switching): cortisol coefficient 0.06
    }

    // EMDR — trauma reprocessing reduces chronic HPA activation. The bilateral stimulation
    // protocol facilitates memory reconsolidation, lowering the cortisol floor set by
    // unresolved threat memories. Chen 2015 (PMID 25527872): EMDR reduces PTSD symptom
    // severity; cortisol normalization is a downstream marker of successful trauma processing.
    // Faster onset than CBT (rapport >= 25 vs CBT's >= 30) — EMDR's structured protocol
    // requires less verbal disclosure, lowering the therapeutic trust threshold.
    // Approximation debt (therapy modality): -1.5 cortisol target chosen; direction supported,
    // magnitude not derivable. PTSD bonus: EMDR has strongest evidence for trauma-spectrum
    // conditions — PTSD characters get enhanced effect.
    if (s.therapy_active && s.therapy_modality === 'emdr' && s.therapy_rapport >= 25) {
      const ptsdBonus = s.has_ptsd ? 2.0 : 1.0;
      t -= 1.5 * ptsdBonus;
    }

    // --- Constitutional mental health condition modifiers ---
    // GAD: raised cortisol floor — HPA axis chronically activated.
    // Mechanism: GAD involves tonic HPA overactivation; elevated basal cortisol documented
    // in GAD patients (Mantella 2008 PMID 18606952). Floor 30 (vs normal 10): even at
    // nighttime nadir, cortisol doesn't fully drop.
    // Approximation debt (mental health): floor 30 chosen; Mantella 2008 (PMID 18606952)
    // shows ~15-20% cortisol elevation in older adults with GAD; floor 30 on a 10-95
    // scale (~24% above minimum) is conservative relative to this finding.
    // PTSD: also raises cortisol floor — HPA dysregulation with elevated basal cortisol.
    // Mechanism: Meewisse 2007 PMID 17606817 meta-analysis shows elevated cortisol in
    // trauma-exposed with PTSD vs without. Uses same floor as GAD.
    // Approximation debt (mental health): PTSD cortisol is complex — some studies show
    // blunted cortisol (hypocortisolism in chronic PTSD; Yehuda 2002). Floor 30 is a
    // deliberate simplification: it models the hyperarousal pathway only.
    let cortFloor = 10;
    let cortCeiling = 95;
    if (s.has_gad || s.has_ptsd) {
      cortFloor = 30;
    }

    // --- Psychiatric medication modifiers ---
    // Anxiolytic (buspirone): lowers cortisol ceiling by up to 5 pts.
    // Approximation debt (psych medication): -5 ceiling chosen; buspirone reduces anxiety
    // symptoms (Rickels et al. 1982 — well-established clinical trials; no PMID needed for
    // basic efficacy) which indirectly reduces HPA drive, but no per-patient cortisol ceiling
    // unit data from buspirone use exists. Magnitude is a design choice.
    {
      const anxOnset = psychMedOnsetFactor('anxiolytic');
      if (anxOnset > 0) {
        cortCeiling -= 5 * anxOnset;
      }
    }

    return clamp(t, cortFloor, cortCeiling);
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
    // Approximation debt (melatonin): 120 min saturation threshold chosen (ignores illuminance — real melatonin
    // phase effects require lux, not just minutes).
    const daylightBonus = Math.min(s.daylight_exposure / 120, 1.0) * 10;
    if (hourFrac >= 20 || hourFrac <= 6) {
      t += daylightBonus;  // up to +10 at night if you got enough light
    }

    // Phone screen suppression at night — blue light blocks melatonin
    // Approximation debt (melatonin): phone suppression -15, indoor delay -3 chosen.
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

    // Approximation debt (melatonin): fall-asleep delay multipliers (0.7× high melatonin, 1.4× low) chosen.
    // Applied in content.js sleep interaction, derived from this target. Not calibrated to
    // measured sleep-onset latency data.
    return clamp(t, 5, 90);
  }

  /** Ghrelin target: maps directly to hunger state.
   *  Stomach produces ghrelin when empty, suppressed after eating. */
  function ghrelinTarget() {
    // Hunger 0-100 maps to ghrelin 15-85
    // Approximation debt (hormonal satiation): linear mapping of hunger→ghrelin (range 15-85) chosen. In reality
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
    // Approximation debt (histamine): amplitude 30 and peak hour chosen. Real histaminergic firing is tonic
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
  // Approximation debt (NT rates): scale mapping real t½ to simulation 0-100 scale is itself chosen.
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
    // Approximation debt (emotional inertia): exact magnitude of inertia range (0.6–1.4) is chosen. Relative
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
    // Approximation debt (emotional inertia): all four modifier coefficients (adenosine 0.005, sleep quality 0.3,
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
    // Approximation debt (emotional inertia): regulation capacity range (0.5–1.3) and penalty coefficients are chosen.
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
    // Approximation debt (adenosine): cognitive load modifier absent — high mental demand accelerates
    // adenosine via ATP hydrolysis / gliotransmission (Phillips et al. 2017 PMC5675465).
    s.adenosine = 100 - (100 - s.adenosine) * Math.exp(-hours / 18);
    // Menstrual phase — inflammatory prostaglandins and disrupted sleep architecture accelerate
    // adenosine accumulation, producing characteristic menstrual fatigue.
    // Approximation debt (menstrual): +1.5/hr during menstrual phase chosen; no direct adenosine
    // measurement during menstruation. Direction: subjective sleep quality is lowest around menses
    // (Baker & Driver 2007 PMID 17383933 — circadian rhythms, sleep, and menstrual cycle; note:
    // PMID 17716466 previously cited here was wrong — unrelated entomology paper). Prostaglandin-
    // mediated inflammation and cramping-related sleep disruption support increased sleep pressure,
    // but the +1.5/hr rate has no quantitative literature basis.
    if (s.cycle_start_time !== null && cyclePhaseTier() === 'menstrual') {
      s.adenosine = Math.min(100, s.adenosine + hours * 1.5); // Approximation debt (menstrual)
    }

    // Anxiolytic (buspirone) side effect: mild sedation — slightly faster adenosine accumulation.
    // Approximation debt (psych medication): +0.125/hr chosen. Drowsiness incidence ~9-10%
    // in clinical trials (Newton et al. 1986 PMID 2870641 — buspirone side-effect profile vs.
    // placebo); rate-to-adenosine translation has no quantitative basis.
    {
      const anxOnset = psychMedOnsetFactor('anxiolytic');
      if (anxOnset > 0) {
        s.adenosine = Math.min(100, s.adenosine + hours * 0.125 * anxOnset);
      }
    }

    // Cannabis emotional blunting — target distance compression.
    // Rather than nudging NT levels directly, we compress how far the drift engine tries to move
    // each mood-primary system from its current level. At full blunting, effectiveTarget = level
    // (no drift at all). At no blunting, effectiveTarget = target (normal drift).
    // Applies to serotonin (affective flattening), dopamine (reduced motivational salience),
    // and NE (emotional arousal blunting). GABA excluded — its anxiolytic effect is separate
    // from blunting and is modeled via acute NT adjustments above.
    //
    // Active blunting: tier-based factor from current cannabis_level.
    // THC acutely reduces amygdala reactivity (Bhattacharyya 2010 PMID 20231922); chronic heavy
    // use is associated with blunted emotional reactivity (CB1 downregulation in amygdala,
    // Hirvonen 2012 PMID 21747398). Acute blunting (on-drug) vs. persistent blunting (off-drug
    // in heavy user) are distinct phenomena modeled here and in toleranceBlunt below.
    // Approximation debt (cannabis): tier-blunting values (0.15/0.30/0.45) chosen to represent
    // mild→moderate→strong acute affect flattening; literature describes the phenomenon
    // qualitatively (reduced threat reactivity, flattened affect) but does not provide
    // standardized magnitude estimates that map to this 0–1 compression scale.
    const tier = cannabisTier();
    const acuteBlunt = tier === 'high'   ? 0.45
                     : tier === 'active' ? 0.30
                     : tier === 'low'    ? 0.15
                     : 0;
    // Tolerance blunting: persistent flat affect in heavy users even off-drug (during withdrawal).
    // Derived from DA deficit relative to baseline (the withdrawal signal) rather than a stored var.
    // CB1 downregulation → reduced mesolimbic tone → anhedonia/flat affect in abstinence.
    // Approximation debt (cannabis): toleranceBlunt coefficient 0.08 chosen; off-drug emotional
    // blunting in heavy users is documented qualitatively but not quantified in a way that
    // maps to this compression scale. 8% max at full tolerance + full DA deficit is conservative.
    const daDeficitForBlunt = s.cannabis_level < 10
      ? Math.max(0, s.dopamine_baseline - s.dopamine)
      : 0;
    const toleranceBlunt = daDeficitForBlunt > 0
      ? (s.cannabis_tolerance / 100) * 0.08 * Math.min(1, daDeficitForBlunt / 50)
      : 0;
    // Use the larger of active and tolerance blunting — they represent the same phenomenon
    // (CB1 downregulation) at different points in the use/abstinence cycle.
    const bluntingFactor = Math.max(acuteBlunt, toleranceBlunt);

    // Systems that receive blunting — serotonin, dopamine, norepinephrine only.
    const bluntedSystems = new Set(['serotonin', 'dopamine', 'norepinephrine']);

    // All other systems: exponential drift toward target
    for (const key of Object.keys(ntRates)) {
      const targetFn = ntTargetFns[key] || placeholderTarget;
      const jitter = biologicalJitter(timeHours, ntPhaseSeed[key]);
      let target = clamp(targetFn() + jitter, 0, 100);

      // Cannabis blunting: compress target distance for affected mood-primary systems.
      // effectiveTarget = level + (target - level) * (1 - b)
      // b=0 → normal drift; b=1 → no drift (target collapses to current level).
      if (bluntingFactor > 0 && bluntedSystems.has(key)) {
        target = s[key] + (target - s[key]) * (1 - bluntingFactor);
      }

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

  // --- Location familiarity ---

  /**
   * Returns the familiarity value (0–1) for a given location ID.
   * 0 = never visited, approaching 1 = deeply familiar.
   * Used by senses.js to lower the habituation floor in well-known places.
   * @param {string} locationId
   * @returns {number}
   */
  function getLocationFamiliarity(locationId) {
    return s.location_familiarity[locationId] ?? 0;
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
    isGigWorker,
    isFreelancer,
    isInformalWorker,
    isUnemployed,
    isTerminated,
    cantWork,
    hasEmployer,
    freelanceProgressTier,
    isWorkHours,
    isOnCallPeriod,
    isLateForWork,
    isWorkday,
    latenessMinutes,
    lateTier,
    currentAbsoluteDay,
    shiftFor,
    setKnownShift,
    isScheduledWorkDay,
    isPotentialWorkDay,
    isPotentialWorkDayFor,
    shiftKnownToday,
    hoursUntilShift,
    nextDayOff,
    wakeUp,
    processSleepEnd,
    nextAbsoluteForTod,
    scheduleInterrupt,
    cancelInterrupt,
    rescheduleInterrupt,
    getInterrupt,
    hasInterrupt,
    fireScheduledInterrupts,
    scheduleNextCalendarAlert,
    energyTier,
    stressTier,
    hungerTier,
    thirstTier,
    bladderNeedTier,
    hygieneTier,
    clothingCleanlinessTier,
    appearanceAwareness,
    skinConditionTier,
    adjustSkinCondition,
    socialTier,
    socialEnergyTier,
    maskingFatigueTier,
    codeSwitchingFatigueTier,
    connectionDepthTier,
    locationVisitTier,
    neighborTier,
    busRegularTier,
    fridgeTier,
    pantryTier,
    pantryTotal,
    pantryLevel,
    consumePantry,
    restockPantry,
    snackTier,
    jobTier,
    workIncidentPatternTier,
    workIncidentMultiplier,
    batteryTier,
    phoneAgeTier,
    phoneSlownessTier,
    effectiveBatteryMax,
    phoneSignal,
    phoneSignalTier,
    moneyTier,
    sleepDebtTier,
    journalStreakDays,
    sensoryLoadTier,
    locationStimulationLevel,
    sleepInertiaTier,
    ageStageTier,
    isTrans,
    bipolarPhase,
    perceivedPresentation,
    identityCongruence,
    effectiveSexualAttraction,
    isAce,
    isAro,
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
    adjustConnectionDepth,
    adjustMoney,
    adjustJobStanding,
    adjustBattery,
    adjustNT,
    spendMoney,
    calculatePaycheckDeductions,
    receiveMoney,
    deductBill,
    receiveEbt,
    spendEbt,
    failBill,
    payBill,
    addPhoneMessage,
    addPendingReply,
    deliverPendingMessages,
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
    nicotineTier,
    isSmoker,
    consumeNicotine,
    nicotineWithdrawalTier,
    alcoholTier,
    consumeAlcohol,
    alcoholSleepInterference,
    alcoholWithdrawalTier,
    cannabisTier,
    isCannabisUser,
    consumeCannabis,
    cannabisSleepInterference,
    cannabisWithdrawalTier,
    opioidTier,
    consumeOpioid,
    opioidWithdrawalTier,
    opioidSleepInterference,
    quitDays,
    sobrietyMilestone,
    cravingTier,
    recoveryStepTier,
    canPurchaseSubstance,
    transHealthcareAccess,
    nameChangeDifficulty,
    healthcareCostMultiplier,
    specialistCostMultiplier,
    dentalCostMultiplier,
    dentalInsuranceCoveredCost,
    checkDentalInsuranceReset,
    nauseaTier,
    // Temperature
    seasonalTemperatureBaseline,
    ambientTemperature,
    temperatureTier,
    utilitiesAmount,
    // Health
    hasCondition,
    hasPrescription,
    psychMedOnsetFactor,
    isOnTaperingMedication,
    taperingFactor,
    addInjury,
    resolveInjury,
    currentInjuries,
    hasInjury,
    energyCeiling,
    migraineTier,
    illnessTier,
    dentalTier,
    dentalConditionTier,
    dentalSpike,
    dentalHealthTier,
    gastritisTier,
    therapyRapportTier,
    gastritisEase,
    endorphinTier,
    bloodPressureTier,
    vasovagalTier,
    cycleDay,
    isCrampRelieved,
    cyclePhaseTier,
    binderTier,
    innerVoiceTier,
    getLocationFamiliarity,
    // NT baseline accessors
    serotoninBaseline: () => s.serotonin_baseline,
    dopamineBaseline: () => s.dopamine_baseline,
    norepinephrineBaseline: () => s.norepinephrine_baseline,
    gabaBaseline: () => s.gaba_baseline,
    // Returns level relative to baseline. Positive = above adapted setpoint; negative = below.
    ntRelative: (key) => s[key] - s[`${key}_baseline`],
  };
}

