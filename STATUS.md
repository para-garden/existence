# What's Implemented

Current state of the codebase. Keep this up to date — see CLAUDE.md workflow rules.

## Simulation

### State Variables (all hidden)
- **energy** (0–100) — tiers: depleted / exhausted / tired / okay / rested / alert
- **stress** (0–100) — tiers: calm / baseline / tense / strained / overwhelmed
- **hunger** (0–100) — tiers: satisfied / fine / hungry / very_hungry / starving
- **thirst** (ml fluid deficit, uncapped) — tiers: quenched (<100ml) / fine (<350ml) / thirsty (<700ml) / very_thirsty (<1400ml) / parched (≥1400ml). Thirst onset at 700ml = ~1% body water for 70kg adult (Cheuvront & Kenefick 2014 DOI 10.1002/cphy.c130017). Base drain 65ml/hr (insensible ~25ml/hr + minimum urine ~40ml/hr; Popkin et al. 2010 PMC2908954). Caffeine diuresis: up to +15ml/hr at full dose (Armstrong 2002 PMID 12187535). High thirst elevates NE target and lowers serotonin target. Energy drain at thirsty (700ml) and very_thirsty (1400ml) thresholds.
- **pending_hydration** (ml) — fluid consumed but not yet absorbed. Drained into thirst reduction by `advanceTime()` with τ=20 min half-life (water gastric emptying: Shi et al. 2004 PMID 15107010). Drinking calls `addPendingHydration()`, not `adjustThirst()` directly. Excess above deficit routes to `bladder_fill`. Drinking adds: drink_water 250ml, make_coffee/buy_coffee 220ml, get_coffee_work 200ml, eat_at_work 150ml. `thirst_pang` event fires on tier crossings; reset immediately on drinking (suppresses re-fire during absorption lag). Approximation debts: sweat rate not wired (activity/temperature/stress), food water content only partially covered, electrolyte balance absent.
- **bladder_fill** (ml, 0+) — urine in bladder. Fills from: baseline kidney output ~40ml/hr + caffeine diuretic modifier (same as thirst drain) + excess absorbed fluid above hydration deficit. Tiers: empty (<50) / fine (<150) / aware (<300, first urge ~150ml) / urgent (<450, functional capacity) / pressing (≥450, discomfort). `bladder_pang` event fires on tier crossing (aware→urgent→pressing). Voided by `use_toilet_bathroom` / `use_toilet_work` → `voidBladder()`. NE elevated +2 at urgent, +5 at pressing (Chermansky & Gebhart 2009 PMID 19234784). Approximation debts: nighttime ADH antidiuresis not modeled; cold diuresis not wired; stress urgency not wired to fill rate.
- **stomach_fullness** (0–100) — physical stomach contents. Filled by eating. Exponential decay with content-type blending: liquids 25 min half-life, solids 90 min, mixed (soup) 30% liquid fraction. Effective half-life = `liqFrac × 25 + (1−liqFrac) × 90`, then scaled by stress factor. High NE or cortisol slows gastric emptying: `halfLife = baseHalfLife × (1 + 0.5×clamp((NE−50)/50,0,1) + 0.3×clamp((cortisol_gi_slow−50)/50,0,1))` — up to ~2× at max sustained stress. NE uses instant value (fast synaptic pathway); cortisol uses `cortisol_gi_slow` (slow genomic pathway, ~3.5h half-life) — acute cortisol spikes have minimal immediate GI effect. Suppresses hunger signal and accelerates satiety.
- **cortisol_gi_slow** (0–100) — slow-moving filtered cortisol for GI motility effects. Exponential approach toward current cortisol with ~210 min half-life (~3.5h), representing the genomic pathway timescale. Approximation debt: half-life chosen, not derived from GI kinetics literature.
- **stomach_liquid_fraction** (0–1) — fraction of stomach_fullness that is liquid. Updated by `fillStomach(amount, contentType)` via weighted average. Resets to 0 when stomach empties fully.
- **hormonal_satiation** (0–100) — post-prandial hormonal hunger suppression (CCK, GLP-1, PYY, ghrelin suppression composite). Set by `fillStomach()` proportional to amount eaten, decays with half-life 150 min (2.5h — midpoint of 2–4h physiological range). Operates independently of stomach emptying: hunger is suppressed by `Math.max(stomachSuppression, hormonalSuppression)` so whichever signal is stronger dominates. Prevents hunger from rising immediately as the stomach physically empties. Approximation debts: half-life is fixed (real duration varies by meal composition); satiation magnitude is proportional to fill (real hormonal response is partly nutrient-dependent); max-suppression simplifies the multi-hormone interaction.
- **social** (0–100) — tiers: isolated / withdrawn / neutral / connected / warm. Decays asymptotically toward `trait_loneliness * 0.25` (the character's loneliness floor) during isolation, not toward 0. τ=66h, neuroticism scales rate ±35%. Increased by adjustSocial() calls from social interactions.
- **social_energy** (0–100) — tiers: drained / tired / neutral / rested / energized. Depleted by social interaction (0.2–0.8× of the social bonus amount, scaling with `introversion`), recovers at 3×(0.6–1.4×) pts/hr during solitude (introverts recharge faster), fully reset by sleep. Not yet wired to interaction gates — tracked for habit pattern training.
- **connection_depth** (0–100) — tiers: hollow / surface / present / deep. Tracks cumulative genuine reciprocal contact. Decays toward 0 at τ=69h (half-life ≈ 48h, no floor). Raised by: reply_to_friend (+15), message_friend (+12), reading friend messages (+5), talk_to_coworker (+3), coworker_speaks (+2). NOT raised by parasocial consumption (watch_content, social browsing). Modulates serotonin target via depth-dependent coefficient: `(social-50) × (0.06 + 0.09 × depth/100)`. See docs/design/parasocial.md.
- **job_standing** (0–100) — tiers: at_risk / shaky / adequate / solid / valued
- **money** (float) — tiers: broke / scraping / tight / careful / okay / comfortable
- **time** — continuous minutes since game start, never resets

### Neurochemistry (Layer 1 of docs/design/emotions.md)
28 neurochemical systems modeled as hidden state variables (0–100 scale). Each drifts toward a target value via exponential approach with asymmetric up/down rates (biological half-lives). Deterministic biological jitter (incommensurate sine waves, no PRNG consumed) creates "some days are harder" variability.

**Active systems (8)** — have target functions fed by current game state:
- **serotonin** — fed by sleep quality, social, hunger/tryptophan. t½ ~9-11h (ATD behavioral data: PMID 18452034, PMID 3931142). Target floor/ceiling: [20, 82].
- **dopamine** — fed by energy, stress depletion. ~1-2h acute perturbation recovery (NAc microdialysis). Target floor/ceiling: [25, 85].
- **norepinephrine** — fed by stress, sleep quality. ~45-90 min recovery. Target floor/ceiling: [25, 88].
- **gaba** — fed by chronic stress (slow). ~12-24h half-life. Target floor/ceiling: [28, 78].
- **cortisol** — diurnal rhythm (peaks 8AM, nadir midnight) + stress. Fast response.
- **melatonin** — diurnal (rises in darkness, suppressed by light).
- **ghrelin** — maps to hunger state.
- **histamine** — diurnal wakefulness signal.
- **testosterone** — diurnal rhythm (peaks 7AM, nadir evening).

**Accumulation system (1):**
- **adenosine** — saturating exponential accumulation (τ=18h, ceiling=100), cleared proportionally by sleep. At 16h from cleared baseline → ~59. Calibrated to two-process model (Borbély 2022 PMC9540767).

**Placeholder systems (18)** — initialized at baseline 50, drift toward 50 with jitter. Will gain active feeders as their game systems are built:
glutamate, endorphin, acetylcholine, endocannabinoid, dht, estradiol, progesterone, allopregnanolone, lh, fsh, oxytocin, prolactin, thyroid, insulin, leptin, dhea, hcg (default 0), calcitriol.

**Sleep model:**
- **Sleep debt** — cumulative deficit (cap 4800 min). Ideal 480 min/day. Full deficit accumulation, 33% excess repayment. Tiers: none/mild/moderate/severe. Feeds serotonin/dopamine targets (-8/-10 max), emotional inertia (+0.15 max), energy recovery penalty (1/(1+debt/1200)).
- **Sleep architecture** — `sleepCycleBreakdown(minutes)`: variable-length cycles scaled to character's `sleep_cycle_length` (truncated normal: mean=93, SD=12, clipped [70,120], per Blume et al. 2023 PSG data — 1 charRng call via probit). Cycle ratios [0.83, 1.0, 1.11, 1.17] × base. Deep/REM ratio shifts across cycles. Deep-sleep (N3) anchors scale with character age: age≤25 → factor 1.0, age≥50 → 0.2, linear interpolation (Van Cauter et al. 2000, JAMA). `age_stage` stored in state, set by `applyToState()`. Adenosine clearing scales with deep sleep fraction. NE clearing scales with REM fraction × quality. Emotional processing quality = qualityMult × (0.4 + 0.6 × remFrac). Sleep inertia from cycle phase at wake (0–0.6). Legacy saves default to 90 min cycle, age 35.
- **Melatonin behavior** — daylight exposure tracking (outside 1.0, inside 0.15, reset on wake), phone screen suppression (-15 at night), indoor evening suppression (-3), daylight bonus (+10 at night if ≥120 min exposure). Melatonin affects fall-asleep delay (>60 → 0.7x, <20 → 1.4x).
- **Sleep quality** — six multiplicative factors (adenosine crash penalty removed — mechanistically backward): stress (overwhelmed 0.82×, strained 0.91×), hunger (starving 0.88×, very_hungry 0.94×), rain comfort (up to +0.04), melatonin at onset (>60 → 1.03×, <25 → 0.90×), circadian alignment (daytime 0.75×, early morning 0.90×), caffeine interference. Calibrated from PSG literature (Renner 2022 PMC9758584; Dijk & Czeisler 1999 PMC2269279; Ferracioli-Oda 2013 PMC3656905).
- **Neurochemistry** — stores quality, clears adenosine (scaled by deep sleep), nudges serotonin (good +3, poor -2), clears NE (scaled by REM × quality).

### Geography / Environment
Derived from character `latitude` (-90 to 90). Methods on State:
- `hemisphere()` — 'north' | 'south'
- `climateZone()` — 'tropical' | 'temperate' | 'polar'
- `season()` — 'spring' | 'summer' | 'autumn' | 'winter' (temperate), 'wet' | 'dry' (tropical)
- `dayLengthHours()` — hours of daylight, astronomical formula from lat + day of year
- `sunriseHour()`, `sunsetHour()` — fractional hours since midnight
- `isDaytime()`, `isSunrise()`, `isSunset()` — bool queries (sunrise/sunset within 30 min)
- Daylight exposure tracking uses actual astronomical sunrise/sunset window

Temperature:
- `temperature` state var (celsius). Updated continuously in `advanceTime` and on weather shift.
- `seasonalTemperatureBaseline()` — from latitude + season. lat 0 → 30°C, lat 42 → ~9°C mean, with seasonal ±amplitude.
- `diurnalTemperatureOffset()` — ±3°C tropical, ±5°C temperate. Coldest ~6am, warmest ~3pm. Cosine formula from hour.
- Combined: `temperature = seasonalBaseline + weatherOffset + diurnalOffset`. Recalculated every `advanceTime` call.
- `temperatureTier()` — 'bitter' | 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot'
- Used in street, bus_stop descriptions; move:street approaching prose.

Snow:
- Added to weather pool when `season() === 'winter'` and `seasonalTemperatureBaseline() <= 2°C`. Weight 2 (same as drizzle).
- `State.set('rain', ...)` remains false for snow.
- Snow prose in: street description (quiet, muffled), bus_stop (bench clearing), weather_shift event (inside: window light change; outside: street softens), move:street approaching prose.

### Health Conditions
Two health tracks: chronic conditions (permanent, per-character) and acute illness (transient, anyone can get it).

**Chronic condition architecture:**
- `health_conditions: string[]` in state, set by `Character.applyToState()` from `character.conditions`
- `hasCondition(id)` query — all condition-gated behavior uses this
- `energyCeiling()` — returns max achievable energy (100 normally; reduced by migraine, illness, or dental flare)
- `migraineTier()` — 'none' | 'building' | 'active' | 'severe'
- `dentalTier()` — 'none' | 'dull' | 'ache' | 'flare'. Thresholds calibrated to clinical VAS cut-points (PMC5766084): dull [5–44), ache [45–74), flare ≥75.

**Migraines (chronic condition):**
- ~15% prevalence at chargen (+5% for high-neuroticism or precarious career)
- Trigger: probabilistic in `advanceTime`, risk score from adenosine + stress + sleep debt
- Intensity: 30–70 at onset, decays ~8 pts/hr after 2h active phase
- Effects: raises NE + lowers dopamine while active; bedroom description overridden for active/severe
- `take_pain_reliever` interaction at apartment_bathroom: -35 intensity; now shared with dental pain
- `go_for_walk` blocked at 'severe' tier
- Postdrome/aura ○

**Dental pain (chronic condition — simulation ready, chargen assignment pending):**
- `dental_ache` (0–100): continuous pain; spikes from eating +20 (chewing, calibrated Hargreaves biorxiv), hot coffee +25 (thermal, PMC3819160/Allison 2020); decays ~1.5/hr
- **Chargen:** only at-risk for `precarious` economic origin (~35%, grounded in CDC NHANES low-income prevalence data) or `modest` origin with severe financial hardship (starting_money < $200, ~20%). Comfortable/secure origins: probability effectively zero — no roll. Approximation debt: no jurisdiction model yet.
- Morning baseline: `wakeUp()` ensures dental_ache ≥ 8 when condition present (jaw pressure overnight)
- **Tier effects:** 'dull' (8–44) — background noise; 'ache' (45–74) — shapes eating prose; 'flare' (75+) — overrides eating, cuts energyCeiling, suppresses GABA
- **NT per tick:** NE raised proportional to ache; GABA suppressed when ache > 50
- **Food/drink triggers:** eating interactions spike ache +20 (chewing, calibrated); coffee interactions +25 (hot liquid, calibrated)
- `take_pain_reliever` reduces dental_ache by 35 (shared with migraines); dental-specific prose when tooth is dominant
- Bedroom description: deterministic ache/flare suffix appended
- Idle thoughts: 9 entries at 'dull'/'ache'/'flare' tiers

**Acute illness (flu / cold / GI):**
- `illness_severity` (0–1), `illness_type` (null|'flu'|'cold'|'gi'), `illness_day`, `illness_medicated` (boolean, resets each wakeUp)
- `illnessTier()` — 'healthy' | 'unwell' | 'sick' | 'very_sick'
- **Onset:** probabilistic each sleep (base 0.7%, +0.5% stress, +0.5% sleep debt, +0.3% worked → max ~2%). ~2–3 illnesses/year at baseline; chronic stress/deprivation roughly triples it. Always 2 balanced RNG calls per sleep regardless of health state.
- **Arc:** severity 0.2 at onset → grows for 2 days (peak ~0.56 unmedicated) → recovers ~0.12–0.22/day. Working while sick cuts recovery to 40%.
- **NT effects per tick:** adenosine pushed up (illness fatigue), NE elevated (body ache), dopamine suppressed (no motivation). Medicated = 40% impact.
- **Hunger:** appetite suppressed — rate scaled by `max(0.3, 1 - severity * 0.7)`.
- **Sleep quality:** fever degrades architecture — `qualityMult *= max(0.5, 1 - severity * 0.35)`.
- **energyCeiling():** illness > 0.1 cuts ceiling proportionally (max −45 at severity 1.0).
- **Content:** bedroom/kitchen descriptions shade when sick (deterministic modifiers). `callInSick` distinguishes actually-sick vs. not. Idle thoughts pool gains illness-specific entries at 'unwell'/'sick'/'very_sick' tiers.
- **`buy_medicine`** at corner store: ~$9–13, sets `illness_medicated`, slows peak and boosts recovery. Available once per day (resets with wakeUp). 2 RNG calls.

### Finance accessors
- Billing cycle offsets now stored in state (set by `applyToState()`) — content no longer calls `Character.get('..._day_offset')`
- `nextPaycheckDays()` — days until next paycheck (0 = today)
- `nextBillDue()` → `{ name, amount, daysUntil }` — soonest upcoming bill across rent/utilities/phone
- TODO.md: noted paycheck structure + bill amounts as approximation debts that should derive from job type, season, usage, plan

### Substances (caffeine)
- **caffeine_level** (0–100 state var) — one cup ≈ 50 units. Half-life 5h, metabolized in `advanceTime`.
- `caffeineTier()` — 'none' | 'low' | 'active' | 'high'
- `consumeCaffeine(amount)` — updates caffeine_level, small acute NE bump. **Acute tolerance:** scales intake by `1 - 0.3 * (habit/100)` — full dose at habit=0, ~70% at habit=100. NE bump scaled by same factor.
- `adenosineBlock()` — 0–1 receptor block factor. High caffeine = adenosine still accumulates but isn't felt. Crash hits when caffeine clears. **Tolerance-adjusted:** denominator shifts to `100 + 0.20 * habit`, so habituated users (habit=100) need ~20% more caffeine to achieve the same block.
- `caffeineSleepInterference()` — quality multiplier (0.65–1.0) for sleep execute
- `make_coffee` interaction at kitchen — available unless caffeineTier is 'high'. Prose shades on mood + adenosine + caffeine.
- `get_coffee_work` interaction at workplace — available during work hours unless caffeineTier is 'high'. 40 caffeine units (slightly weaker than home coffee). Job-type specific prose (office/retail/food_service).
- `buy_coffee_store` interaction at corner store — costs ~$1.75–3.00. 50 caffeine units. Available if canAfford(2) and not 'high' tier.

### Gambling (corner store)
- **`buy_scratch_ticket`** at corner store — costs $2, 3 min. Outcome via `weightedPick` on `{ amount, nearMiss }` pairs (~75% RTP, weights calibrated to approximate US scratch ticket math). Prize tiers: $0 (loss), $0+nearMiss, $2, $5, $20, $100, $1000, $10000. NT effects scale with prize: large wins spike dopamine + NE; near-miss spikes dopamine (variable-ratio reinforcement, Clark et al. 2009 PMID 19822754); loss depresses dopamine. Prose per-tier via `weightedPick` with NT-weighted variants. **Approximation debt:** prize amounts and weights are placeholders — should eventually derive from the specific games available at the character's corner store by jurisdiction.
- **`adenosineBlock()` propagation** — all ~25 adenosine-fog prose sites (weighted picks + if-branches) now multiply by `adenosineBlock()`, so caffeine actually masks the tiredness texture in prose. Fog variants suppressed when caffeine is active.
- **Tolerance + withdrawal** — `caffeine_habit` (0–100) grows +5/day when peak ≥ 40, fades -4/day without. `caffeine_withdrawal` builds at 1.2 pts/hr (habit=100) when habit > 10 and caffeine_level < 15; clears at 25 pts/hr when caffeinated. Withdrawal raises NE, suppresses dopamine. `withdrawalTier()` — 'none' | 'mild' | 'moderate' | 'severe'. Withdrawal prose at make_coffee / get_coffee_work / buy_coffee_store (relief branch) and idleThoughts (3-tier headache presence).
- **Receptor upregulation + nausea** — at habit > 30, withdrawal amplifies adenosine accumulation (upregulated receptor sensitivity: up to +2 pts/hr at habit=100/withdrawal=100). At severe withdrawal (withdrawal > 55 + habit > 45), `nausea` state builds via GI adenosine A1/A2A flooding (brainstem chemoreceptor trigger zone, vagus nerve). `nausea` (0–100) is general-purpose across systems. `nauseaTier()` — 'none' | 'queasy' | 'sick' | 'severe'. Idle thoughts: 4-tier nausea presence. Nausea decays 2 pts/hr naturally, 8 pts/hr when caffeinated. Nausea suppresses GABA, raises NE; severe nausea adds adenosine (systemic fog).

### Emotional Inertia (Layer 2 of docs/design/emotions.md)
Per-character trait controlling how sticky moods are. Only affects the four mood-primary systems (serotonin, dopamine, NE, GABA) — physiological rhythms are unaffected by personality.

**Personality parameters** (generated at character creation, stored in state):
- **neuroticism** (0–100) — strongest predictor of inertia. Adds extra stickiness in "toward worse mood" direction only.
- **self_esteem** (0–100) — low self-esteem increases inertia in all directions.
- **rumination** (0–100) — high rumination increases inertia in all directions.
- **trait_loneliness** (0–100) — sets the social decay asymptote: `floor = trait_loneliness * 0.25`. h²=48% (Boomsma 2005 PMID 16273322). High-trait-loneliness characters never fully recover to zero loneliness even after contact. Legacy saves default to 30 (floor 7.5).
- **introversion** (0–100) — scales social energy depletion (0.2–0.8×) and solitude recovery (0.6–1.4×). At 50 = neutral (prior behavior). h²=49% (Vukasović & Bratko 2015 PMID 26053889). Approximation debt: coefficient ranges chosen, not literature-derived.

**Inertia formula:** `rate = baseRate / effectiveInertia(system, isNegative)`. Base inertia range 0.6 (fluid) to 1.4 (sticky), plus up to +0.2 from neuroticism negative bonus, plus state modifiers (adenosine > 60, poor sleep quality, stress > 60). At personality 50/50/50 → inertia 1.0.

**"Worse direction" per system:** serotonin falling, dopamine falling, NE rising, GABA falling.

### Basic Sentiments (Layer 2 of docs/design/emotions.md)
Likes and dislikes generated at character creation. Array of `{target, quality, intensity}` objects stored on character and written to state. 8 categories per character:
- **Weather** — liked weather (comfort) and disliked weather (irritation) → serotonin target modifiers
- **Time of day** — morning or evening person → serotonin + dopamine target modifiers
- **Food comfort** — serotonin nudge on eating interactions
- **Rain sound** — serotonin nudge when viewing rain; sleep quality boost during drizzle
- **Quiet** — comfort (serotonin) or irritation (NE) when sitting at kitchen table
- **Being outside** — serotonin nudge on go_for_walk
- **Physical warmth** — extra stress relief on shower
- **Routine** — stored but dormant (no activation hook yet)

All effects scale linearly with intensity. Small background forces (max ±3.4 serotonin target shift from weather, vs ±20 from sleep quality). Sentiment-aware prose variants in eat_food, buy_cheap_meal, shower, sit_at_table, go_for_walk, look_out_window, sleep.

### Sleep Emotional Processing (Layer 2 of docs/design/emotions.md)
During sleep, each sentiment's intensity drifts back toward its character baseline (the chargen-generated value). Processing rate = 0.4 * sleepQuality * clamp(sleepMinutes/420, 0.3, 1.0). Good sleep (quality 1.0, 7+ hours) processes ~40% of deviation per night; poor sleep (quality 0.5, 3 hours) processes ~14%. Accumulated sentiments with no character match attenuate toward intensity 0. Called in the sleep interaction after stress reduction, before wakeUp(). No PRNG consumed.

### Accumulating Sentiments (Layer 2 of docs/design/emotions.md)
Sentiments that build from repeated experience. The first dynamic sentiments — feelings that emerge from daily friction and connection, not character generation.

**Work sentiments:**
- `{target: 'work', quality: 'dread'}` — builds from can't-focus days (+0.02), work breaks when stressed (+0.005). Reduced by focused work (-0.01).
- `{target: 'work', quality: 'satisfaction'}` — builds from focused work (+0.015). Reduced by can't-focus days (-0.005).
- Independent — ambivalence is real. At workplace, dread lowers serotonin (-6) and dopamine (-5) targets; satisfaction raises them (+3, +4).

**Coworker sentiments (per-coworker):**
- `{target: 'coworker1'/'coworker2', quality: 'warmth'}` — builds from good-mood interactions (+0.02) and neutral coworker_speaks events (+0.008). High warmth gives extra social bonus (+2).
- `{target: 'coworker1'/'coworker2', quality: 'irritation'}` — builds from bad-mood interactions (+0.015) and bad-mood coworker_speaks events (+0.01). High irritation turns social stress relief into stress cost (+2 instead of -3).

**Contradictory experience:** Experiences that contradict an existing sentiment gently challenge it. Good coworker interactions cross-reduce irritation (-0.008 talk, -0.003 speaks); bad interactions cross-reduce warmth (-0.005 talk, -0.003 speaks). Relaxed work breaks (stress ≤ 30, existing dread > 0) cross-reduce dread (-0.005). Cross-reductions are 30–40% of primary amounts — they slow sentiment growth without preventing it. Ambivalence emerges naturally from mixed days.

**Feedback loops:** Chronic struggle at work → dread builds → worse NT state at work → harder to focus → more dread. Good sleep partially resets each night (~40% of deviation). If accumulation exceeds processing, sentiments grow over time. Contradictory experience provides a daytime counterforce — good days at work challenge dread from multiple directions (focused work + relaxed breaks).

**Prose:** Sentiment-weighted variants in doWorkProse (dread/satisfaction, 2 per job), coworkerChatter (irritation/warmth, 1-2 per flavor), coworkerInteraction (warmth/irritation, 1-2 per flavor). All follow `weightedPick` pattern.

**`State.adjustSentiment(target, quality, amount)`** — mutation function for accumulating sentiments. Finds-or-creates entry, clamps [0, 1]. No PRNG consumed.

### Sentiment Evolution (Layer 2 of docs/design/emotions.md)
Three mechanics deepening how sentiments change over time:

**Regulation capacity** — `State.regulationCapacity()`. Inverse of emotional inertia, applied during sleep processing. Fluid characters (low neuroticism, high self-esteem, low rumination) process emotions faster; sticky characters process slower. Range 0.5–1.3. At 50/50/50 → 1.0. State penalties for adenosine > 60 and stress > 60.

**Entrenchment + intensity resistance** — rewritten `processSleepEmotions()` applies three multiplicative modifiers: intensity resistance (high-deviation sentiments resist processing, floor 0.3), quality factor (comfort 1.0, satisfaction 0.9, warmth 0.85, dread/irritation 0.6), and regulation capacity. Negative sentiments process 40% slower than comfort. Very strong feelings persist across multiple nights.

**Habituation** — comfort sentiments (eating, rain_sound, outside, warmth, quiet) lose small amounts of intensity each time they activate (-0.002 to -0.003). Sleep restores toward character baseline. Light use stays stable; heavy use fades slightly. Quiet irritation also habituates (-0.001). Weather/time-of-day prefs and work/coworker sentiments are NOT habituated.

### Friend Absence Effects (Layer 2 of docs/design/emotions.md)
Friends who reach out and get silence back generate guilt over time. Per-friend contact timestamps track last message engagement.

**Mechanics:**
- `friend_contact` — map of slot → game time of last engagement (reading a friend's message)
- Grace period: 1.5 days. After that, guilt accumulates each sleep cycle
- Growth rate: ~0.005–0.008 per night, scaling with absence duration (cap 1.6x at 14+ days)
- Unread messages from the ignored friend intensify guilt by 40%
- Seeing unread friend messages on phone screen nudges guilt by `guilt * 0.02` (proportional, only when guilt > 0.03)
- Reading a friend's message: resets contact timer, reduces guilt by 0.02
- **Replying to a friend** (`reply_to_friend` phone interaction): resets contact timer, reduces guilt by 0.06 (3× reading), +3 social. Generates friend's response immediately (RNG, stored in `pending_replies`), delivered after 30–90 min. Prose per flavor + NT-shaded (dopamine/serotonin). 3 RNG calls total.
- **Writing first** (`message_friend` phone interaction): available when a friend has no unread messages and no pending reply queued. Picks the friend with highest guilt (tie-breaks by least recent contact). Resets contact timer, reduces guilt by 0.06, +2 social. Response generated now, delivered after 30–90 min. Prose per flavor + NT-shaded (dopamine/serotonin). 3 RNG calls total. Separate initiation prose tables (`friendInitiateProse`, `friendInitiateMessages`) from reply prose — reaching out first reads differently from responding.

**Effects:**
- Friend guilt lowers serotonin target when at home (max ~6 points at extreme guilt toward both friends)
- Guilt-aware idle thoughts fire based on guilt intensity, independent of social tier (4 thoughts per friend flavor, 16 total)
- Sleep processing factor 0.7 — between comfort (1.0) and dread/irritation (0.6)

**Friend messages tagged with source** — `phone_inbox` entries from friends carry `source: 'friend1'|'friend2'` for contact tracking.

### Life History / Backstory Generation
Characters have compressed life histories generated at chargen. Two-phase: broad strokes (charRng, ~4 calls) then fine-grained simulation (post-finalization, deterministic).

**Generated parameters:**
- `economic_origin` — precarious / modest / comfortable / secure (where you started)
- `career_stability` — 0.0–1.0 (how steady adult life has been)
- `life_events` — 0–2 events with multi-dimensional impacts (medical_crisis, job_loss, family_help, small_inheritance, accident, legal_trouble, relationship_end)

**Financial outputs (from fine-grained simulation):**
- `starting_money` — integral of years working × accumulation rate + event impacts. Range: $0 (22yo precarious) to $40,000+ (48yo secure).
- `pay_rate` — biweekly take-home by job type (food_service $480, retail $520, office $600)
- `rent_amount` — monthly, from origin bracket × stability ($400–950)
- `ebt_monthly_amount` — $204 if enrolled, $0 if not. Enrollment probability by origin (65% precarious / 25% modest / 4% comfortable / 0% secure). `ebt_day_offset` per-character monthly reload day.

**Non-financial outputs:**
- Financial anxiety sentiment (intensity from origin + stability + negative events)
- Personality adjustments (neuroticism, self_esteem nudges from life events)
- Work sentiment from career stability (dread if unstable, satisfaction if stable)
- Job standing from career stability (55–75 range)
- Life event sentiments (health anxiety, authority dread, family guilt)

**Bill day offsets:** paycheck_day_offset, rent_day_offset, utility_day_offset, phone_bill_day_offset — all generated at chargen, stored on character. Each character has their own financial rhythm.

### Financial Cycle
Closed-loop financial system: income, obligations, and the collision between them.

**Income:** Biweekly paycheck = `pay_rate * min(days_worked, 10) / 10`. Missing work reduces pay. Arrives as phone deposit notification. Small anxiety relief when paycheck arrives while broke.

**Bills (4, monthly on character-specific offsets):**
- Rent — from backstory
- Utilities — $65 (approximation)
- Phone — $45 (approximation)
- Auto-deducted. Success → notification with perceived balance. Failure → money → $0, "declined" notification, +8 stress, +0.03 financial anxiety.

**Work attendance tracking:** `days_worked_this_period` increments on workplace arrival (guarded by !at_work_today), resets on payday. Calling in sick reduces next paycheck.

**Money tiers (updated for larger balances):** broke ≤ $0 / scraping < $50 / tight < $200 / careful < $600 / okay < $1500 / comfortable < $5000 / cushioned ≥ $5000.

### Financial Anxiety (NT Integration)
Financial anxiety sentiment connects to neurochemistry:
- At home: `money_anxiety * 4` reduces serotonin target
- At work: `money_anxiety * 2` reduces dopamine target
- Money < $200: serotonin penalty scaling with deficit
- Money < $50: cortisol spike (+3)
- Accumulates from failed bills (+0.03), relief from paycheck when broke (-0.01)
- Sleep processing factor 0.6 (entrenches like dread)
- 5 money-anxiety idle thoughts, weighted by anxiety intensity

### Derived Systems
- **Mood tone** — primarily from neurochemistry (serotonin, dopamine, NE, GABA) with physical state overrides → numb / fraying / heavy / hollow / quiet / clear / present / flat. Same 8 tones, now with inertia instead of instant derivation.
- **Prose-neurochemistry shading** — three-layer pattern: moodTone() as coarse selector, weighted variant selection via `State.lerp01()` + `Timeline.weightedPick()`, deterministic modifiers (adenosine fog, NE+low-GABA restlessness). **All 67 `Timeline.pick` call sites converted.** Covered: idle thoughts, bedroom description, lie_there, sleep prose (23 branches), look_out_window (7 branches), sit_at_table (6 branches), go_for_walk (12 branches), work events (4 branches), ambient events (5 branches), friend messages (4 flavors), coworker chatter (3 flavors), coworker interactions (3 flavors). No `Timeline.pick` calls remain. See docs/design/overview.md "Prose-neurochemistry interface" for the full pattern.
- **Time period** — deep_night / early_morning / morning / late_morning / midday / afternoon / evening / night
- **Observation fidelity** — time and money awareness degrade with distance from last check (exact → rounded → vague → sensory/qualitative). Location descriptions (bedroom alarm clock, kitchen microwave) use perceived strings, not raw time. Sensory tier handled separately (full-sentence vs fragment). Idle thoughts include fidelity-aware variants for rough/qualitative money and vague/sensory time.
- **Season** — derived from latitude + start_timestamp. Tropical: wet/dry. Temperate: four seasons. Hemisphere from sign.
- **Weather** — overcast / clear / grey / drizzle / snow (winter+cold only). 3% shift chance per action. Affects prose, not mechanics.

### Per-Wake-Period State
`wakeUp()` is nearly eliminated: sets `wake_period_start = time`, resets `last_surfaced_late_tier`, `last_surfaced_mess_tier`, `daylight_exposure`, `location_arrival_time`. All "did X happen this wake period?" checks use `events.any(type, wake_period_start)` queries instead of flags. Remaining candidates for migration: `daylight_exposure` (continuous accumulator), `last_surfaced_*` (need timestamp-based event dedup).

### Phone State
Battery (dual-rate drain: 1%/hr standby, 15%/hr screen-on; tiers: dead/critical/low/fine), silent mode, inbox (messages accumulate whether or not you look). Charges at 30%/hr during sleep at home and via charge_phone interaction. Starting battery 80–100% (chargen RNG). Message sources: friends (flavor-driven frequency), work nag (30min late), paycheck deposits (biweekly), bill auto-pay notifications (rent/utilities/phone, monthly).

**Phone UI:** Full HTML5 phone overlay. Three screens: home (large time + date + Messages app badge), messages list (contacts ordered: friends by recency, then supervisor, then bank; unread dots, preview text), thread view (sent/received bubbles, compose row with Reply/Write when applicable). Navigation (home→list→thread→back) is transient state stored in `phone_screen` + `phone_thread_contact`. Opening a friend thread marks messages as read and applies guilt side-effects. Reply and Write actions go through the normal game pipeline (RNG consumed, action recorded, friend response queued). Old `read_messages` interaction kept for replay compat. All phone messages now carry `source` and `direction` fields (auto-stamped in `addPhoneMessage`).

**Phone condition:** `phone_cracked` boolean on character — cosmetic CSS crack overlay (`.phone--cracked::after`, hairline linear-gradient lines) applied to the phone overlay when true. Generated at chargen from `economic_origin`: precarious 55%, modest 30%, comfortable 8%, secure 1%. Exactly 1 charRng call. Condition affects texture, not function.

### Apartment State

**Object systems (coarse_v1):** Mess is now emergent from tracked object states, not a single scalar. Three modules:

- **Dishes** (`js/dishes.js`) — tracks clean/in_sink counts. `eat_food` calls `Dishes.use()` (one dish goes to sink). `do_dishes` calls `Dishes.wash()` (sink cleared). Kitchen description uses `Dishes.sinkDescription()`: specific prose per count ("A dish in the sink." / "A couple of dishes." / "The sink is full."). `do_dishes` available when `Dishes.dirtyCount() > 0`.

- **Linens** (`js/linens.js`) — tracks bed state (`made`/`unmade`/`messy`) and towel state (`clean_hanging`/`damp_hanging`/`on_floor`). `shower` calls `Linens.useTowel()`. `sleep` calls `Linens.noteSlept()` — bed transitions, damp towel → on_floor. Bathroom description driven by towel state. Bedroom adds sentence when bed is made or messy.

- **Clothing** (`js/clothing.js`, `full_v1`) — per-item tracking. Each item has id, type, name, condition, location, wearState, fit, acquisition dimensions. `wear()` auto-selects by type (top/bottom/socks/underwear), prefers better fit + accessible + clean. `undress(dropTo)` moves all on-body items to destination. `outfitDescription()` prose with fit notes. `floorDescription()` names specific items. `startWash()`/`wash()` for laundry cycle. Backwards-compat: coarse_v1 saves synthesized from counts; missing wardrobe falls back to `_buildLegacyItems()`. Character stores `wardrobe` array at chargen; `reset()` deep-copies from it.

- **Body** (`js/body.js`) — minimum viable interface. `chestDimension()` (breast_tissue_score + binding reduction), `abdominalDimension()` (baseline + pregnancy modifier), `isBinding()`, `bindingFit()`, `bindingHours()`, `hasBreastTissue()`, `pregnancyWeek()`, `hasUterus()`, `energyCeilingModifier()`, `chronicallyBound()`. Wired in context.js before clothing. Body params now generated at chargen (ASAB, puberty_history, hrt_history, constitutional_conditions, reproductive_anatomy, breast_tissue_score, abdominal_baseline).

- **Wardrobe generation** (`chargen.js`) — `generateBodyParams()` and `generateWardrobe()` called at the end of `generateRandom()`. Per-item wardrobe sized by economic_origin (precarious: ~8 items, secure: ~24), 3 charRng calls per item (name, condition, location). outfit_* properties kept on character for backward compat with existing get_dressed prose. Fit stored as `comfortable` pending body dimension integration.

**Mess is now fully emergent.** `apartment_mess` scalar removed. `messTier()` moved from State into content.js, computed from Dishes + Linens + Clothing: dishes in sink (9pts each, max 5), bed state (messy=15, unmade=5, made=0), towel on floor (8pts), clothing floor items (8pts/bedroom, 5pts/bathroom). Four tiers: tidy (<20), cluttered (<45), messy (<70), chaotic (≥70).

**fridge_food** (integer) — depletes on eating, restocked by groceries. Still a scalar (appropriate — no item identity needed for food units).

**apartment_notice** — fires deterministically when mess tier worsens (tidy→cluttered→messy→chaotic). Tracked via `last_surfaced_mess_tier` (null on wake, reset to null by cleaning). The 6% ambient chance still fires `apartment_sound` only; notice is separate and RNG-free. NT-shaded: low serotonin reads mess as evidence; high adenosine makes it blur; low dopamine surfaces the knowing-doing gap.

### Location Description NT Shading
Deterministic NT modifiers added to all 7 locations (no RNG — location descriptions called from UI.render). Pattern: NE > 65 → sensory overload / everything too present; adenosine > 65 → fog / dissociation; GABA < 35 → restlessness / can't settle.
- **Kitchen** — adenosine > 65: "The light in here is doing more than its share." NE > 65 in morning: "Everything in here feels very present this early."
- **Bathroom** — adenosine > 70: "The light in here is harsh." NE > 65: "The faucet drip sounds too loud."
- **Corner store** — NE > 65: fluorescent hum + sensory overload. Adenosine > 65: aisles smear.
- **Street** — NE > 70: every car/voice arrives separately. Adenosine > 65: street softens at edges. GABA < 35: openness doesn't help.
- **Bus stop** — NE > 65: other people register louder. Adenosine > 65: the wait stretches thick. GABA < 35: standing still is hard.
- **Office** — NE > 65: keyboard/AC/chair have edge. Adenosine > 65: office blurs, things don't land. GABA < 35: can't settle into chair.
- **Retail** — NE > 65: announcements/dings unfiltered. Adenosine > 65: body knows what to do. GABA < 35: floor too open.
- **Food service** — NE > 65: kitchen sounds already too much. Adenosine > 65: rhythm keeps going, hands follow. GABA < 35: pace feels relentless.

### World Predicates
`World.isHome()` and `World.isWorkplace()` added to world.js (alongside existing `isInside()`). Available for any code that needs semantic location queries without inspecting area strings directly.

### Labor arrangement + work scheduling
Work is modeled as a **labor arrangement** — the character's structural relationship to their employer's time demands. See `docs/design/work-scheduling.md`.

State fields: `labor_arrangement` (`{type, day_pattern, work_days, shift_start, shift_end, reveal_horizon_hours, reveal_tod, work_days_per_week}`) and `known_shifts` (map of absolute game-day → `{start,end}` | null | undefined-absent).

**Arrangement types:** `fixed` (office — always known), `rotating` (established retail/food_service), `on_demand` (precarious — revealed nightly), `gig`/`none` (not yet implemented). Type and parameters generated at chargen from job_type + job_standing + financial_anxiety + career_stability.

**Interface:** `State.shiftFor(day)` → `{start,end}` | null | undefined. `isWorkday()` and `isWorkHours()` derive from arrangement (no longer hardcoded Mon–Fri / flat params). `isScheduledWorkDay(day)`, `isPotentialWorkDay()`, `isPotentialWorkDayFor(day)`, `shiftKnownToday()`, `hoursUntilShift()`, `currentAbsoluteDay()`, `setKnownShift(day, shift)` all exported. `withinShift(tod, start, end)` handles overnight shifts (end < start wrap-around).

**Reveal mechanics:** `schedule_reveal` interrupt fires at `reveal_tod` nightly, populates `known_shifts[day+1]`, reschedules for the next night. At game start, today's shift is pre-populated for on_demand/rotating workers (last night's reveal already happened). Phone inbox notification added on reveal. Approximation debt: probability model always assigns shift — see TODO.md.

**Weekend shape:** bus_stop→workplace connection gated by `isWorkday()` (now schedule-derived, not calendar-hardcoded). Weekend idle thoughts: Saturday morning/afternoon/evening texture; Sunday weight + evening anticipation of the week; mood-shaded variants.

## Locations (8)

```
apartment_bedroom ─── apartment_kitchen ─── street ─── bus_stop ─── workplace [weekdays only]
       │                     │                │                           │
apartment_bathroom ──────────┘          corner_store             workplace_bathroom
```

Travel times: 1min within apartment, 2min apartment↔street, 3min street↔bus_stop, 4min street↔corner_store, 20min bus_stop↔workplace, 2min workplace↔workplace_bathroom.

## Interactions (66)

### Bedroom (18)
sleep, get_dressed, undress_floor, undress_chair, undress_basket, set_alarm, skip_alarm, snooze_alarm, dismiss_alarm, charge_phone, check_phone_bedroom, lie_there, look_out_window, make_bed, tidy_clothes, start_laundry, move_to_dryer, fold_laundry, (alarm event wakes you)

### Kitchen (6)
eat_food, eat_from_pantry (fridge empty + pantry not empty), drink_water, do_dishes, check_phone_kitchen, sit_at_table

### Bathroom (10)
quick_shower (always available, 6 min), shower (not depleted, 15+NT min, warm + compulsive extension), long_shower (not depleted, 25+NT min, deliberate), cold_shower (always available, 8 min, NE/adenosine effects), check_phone_bathroom (post-shower: reach-for-it prose), use_sink, apply_moisturizer (has_moisturizer + skin not healthy), rehang_towel, use_toilet_bathroom, take_pain_reliever (migraines or dental_pain condition; shared with bedroom via phone-less availability)

### Street (4)
check_phone_street, sit_on_step, go_for_walk, find_public_restroom_street (available at aware+; ~55% find something — park/library; ~45% nothing usable).

### Bus Stop (2)
wait_for_bus, find_public_restroom_bus_stop (available at urgent/pressing only; ~20% find something close enough without missing the bus).

### Workplace (5)
do_work, work_break, talk_to_coworker, check_phone_work, eat_at_work (food_service only, once per shift, hunger >= hungry)

### Workplace Bathroom (2)
use_toilet_work (available at aware+; voids bladder, −1 stress), decompress_work (always available; 5 min, −2 stress; refuge prose shaded by NE/GABA/stress)

### Corner Store (6)
buy_groceries, buy_cheap_meal, browse_store, buy_moisturizer (skin not healthy + canAfford(4)), buy_scratch_ticket, use_toilet_corner_store (available at aware+; ~12% unavailable — out of order / key missing; key-on-wooden-plank texture).

### Soup Kitchen / Community Meal (2)
get_meal (weekdays 11am–2pm, once per day). First-visit prose distinct from repeat. Lifetime visit count shapes ongoing descriptions. 8 min from street.
use_toilet_soup_kitchen (available at aware+; prose uses visit count for familiarity).

### Food Bank (2)
receive_bag (weekdays 9am–5pm, once per 7 game days). Stocks fridge +3 and pantry +2. 40 min. First-visit prose distinct. lifetime visits counter. 12 min from street.
use_toilet_food_bank (available at aware+).

### Phone Mode (8, triggered from phone UI)
read_messages (backward-compat replay only), reply_to_friend, message_friend, help_friend (friend sent in-need message + canAfford $10; flavor-deterministic amount $10–15; builds warmth +0.05), ask_for_help (broke/scraping + friend thread + 7-day cooldown; flavor base + warmth + repeat penalty probability; variable amount $10–40 via pending reply effect), toggle_phone_silent (home screen mute + status bar silent indicator), put_phone_away, watch_content (apartment locations only; 45 min; +2 social, no connection_depth; adenosine -3; prose shaded by connectionDepthTier)

### Global (1, available anywhere with phone)
call_in (call in sick — morning only, work hours)

## Events (14 types)

- **alarm** — fires at alarm_time in bedroom
- **late_anxiety** — stress when late for work; fires once per tier crossing (fine→late→very_late); deterministic, no RNG; tracked via `last_surfaced_late_tier`; resets on wakeUp() and on work arrival
- **hunger_pang** — fires once per tier crossing (hungry → very_hungry → starving); deterministic, no RNG; resets on eating
- **thirst_pang** — fires once per tier crossing (thirsty → very_thirsty → parched); deterministic, no RNG; resets on drinking
- **bladder_pang** — fires once per tier crossing (aware → urgent → pressing); deterministic, no RNG; resets on voiding
- **exhaustion_wave** — fires once per tier crossing (exhausted → depleted); deterministic, no RNG; resets on energy recovery
- **weather_shift** — random weather change
- **coworker_speaks** — samples coworker, uses chatter table
- **work_task_appears** — job-specific
- **break_room_noise** — job-specific ambient
- **apartment_sound** — pipes, fridge, footsteps
- **apartment_notice** — mess awareness; fires on tier worsening (tidy→cluttered→messy→chaotic); deterministic, no RNG; resets on cleaning or wake
- **street_ambient** — cars, buses, sirens
- **someone_passes** — people on street
- **vomit** — fires when `pending_vomit` flag is set. Set probabilistically in `advanceTime()` with etiology-split curves: illness (severity > 0.1 + nausea > 40) → rate 0–0.75/hr scaling with nausea and illness_severity (5-HT3 vagal pathway); non-illness (nausea > 75) → rate 0–0.2/hr scaling 75–100. Deterministic fire in `checkEvents()`, no RNG at fire site. Branches: `stomachTier()` empty → dry heave (−8 energy, +6 stress, −8 nausea); else → expulsion (stomach_fullness −75, ate_today cleared, −5 energy, +4 stress, −25 nausea). Location-aware: bathroom vs. not. NT-shaded prose: adenosine (fog/dissociation), NE (crisis sharpness), GABA (loss of control). `wakeUp()` clears stale flag.

## Content

### Jobs (3)
**office** — 9am–5pm, 4 tasks expected, cubicle/open-plan prose
**retail** — 10am–6pm, 5 tasks expected, floor/register/stockroom prose
**food_service** — 7am–3pm, 6 tasks expected, kitchen/counter prose

Each has: workplace description (dynamic), do_work prose (6 variants), work_break prose (3 variants), work_task event text, ambient event text.

### Relationships
**Friends (2 per character, 4 flavors):** sends_things, checks_in, dry_humor, earnest. Each has normal messages, isolated messages, idle thoughts.

**Coworkers (2 per character, 3 flavors):** warm_quiet, mundane_talker, stressed_out. Each has chatter and interaction prose.

**Supervisor (1):** named, referenced in work prose.

### Idle Thoughts
Dynamic generation based on mood (8 categories × ~7 general variants + 2–4 NT-weighted variants each), hunger (starving/very_hungry), energy (depleted), social isolation (friend-specific thoughts), connection depth (surface/hollow: 6 variants, the gap between parasocial warmth and genuine contact), day-of-week (Saturday texture, Sunday weight/dread/evening anticipation). NT values (serotonin, dopamine, NE, GABA, adenosine, cortisol) continuously weight variant selection via `State.lerp01()` and `Timeline.weightedPick()`. Recency tracking avoids repeats.

### Inner Voice
Second text stream that fires alongside idle thoughts when NT state is destabilized. Typographically distinct from narration — rendered as italic with intensity tiers driven by NT conditions.

**Tier function:** `State.innerVoiceTier()` — score-based, pure state read, no RNG. Each condition adds 1: GABA < 40, NE > 65, serotonin < 35, rumination > 65. Score 0 → null (voice absent); 1 → `uneasy`; 2 → `prominent`; 3+ → `tremor`.

**CSS tiers:** `uneasy` — slightly elevated letter-spacing, muted warm; `prominent` — body color, normal weight; `tremor` — bright, subtle horizontal shake animation (collapses to static high-contrast under `prefers-reduced-motion`).

**Content:** `innerVoiceThoughts()` — mood-branched pool with NT-weighted variants, 1 RNG call (same pattern as idleThoughts). Separate `recentInnerVoice` dedup array (last 3). Voice is sparser at `clear`/`present` moods — when things are okay, it goes quiet.

**Rendering:** At `tremor` tier, the inner voice drowns out narration (idle thought suppressed). At `uneasy`/`prominent`, voice appears 800ms after narration. Resume display restores both streams.

**RNG discipline:** idle (1) → inner voice if tier non-null (1, conditional) → sensory fragment if pool > 1 (1, conditional) → advanceTime (1). Order identical in `handleIdle`, `replayIdle`, and `executeActionForReplay`.

### Sensory Prose Compositor
Observation-based procedural prose. Lives in `js/senses.js`. Surfaces ambient observations from idle actions via the realization engine.

**Observation source system (wired to `sense()` via realization engine):**

Foundation of the procedural prose pipeline. Sources are things in the world (or body) with observable properties — not authored text. The realization engine turns observations into sentences.

**`ObservationSource` spec:** `id`, optional `areas`/`locations` filter, `channels`, `available(State, World)` gate, `salience(State)` (0–1 attention weight), `properties` map of channel→{key→fn(State)}.

**Source library (27 sources):** Indoor acoustic (fridge, pipes, electronic_whine, traffic_through_walls), indoor thermal (indoor_temperature), indoor visual (window_light), **indoor smell (stale_air, dishes_smell)**, bathroom acoustic (bathroom_echo), interoceptive (fatigue, hunger_signal, anxiety_signal, stress_signal, caffeine_signal), outdoor acoustic (traffic_outdoor, street_voices), outdoor thermal (outdoor_temperature, wind), outdoor rain (rain), **outdoor smell (petrichor, cold_air_smell, seasonal_outside_smell)**, work acoustic (workplace_hvac, fluorescent_lights, coworker_background), **work smell (office_ambient_smell)**.

**`getAvailableSources()`** — filters sources by location/area and `available()`. No RNG.

**`observe(source)`** — evaluates all property functions, returns `Observation` `{sourceId, channels, salience, properties}`. No RNG.

**`getObservations()`** — runs both, returns all available observations sorted by salience descending. No RNG. Public API consumed by the realization engine.

---

**Realization engine (`js/realization.js`):**

Pure module that turns `Observation[]` + NT hint → prose string. No game imports; fully testable.

**`realize(observations, hint, ntContext, random)`** — main entry point. Realizes all observations passed (caller is responsible for selection/budgeting). RNG consumption is exactly `N × 4` calls (N = observations), always — balanced across all architecture and shape branches.

**Lexical sets** — one per sourceId. Each defines: `subjects`, `predicates`, `modifiers` (with null options for "no modifier"), and optionally `body_subjects`/`body_predicates`, `ambiguity_alts`, `escapes`, `fragments`, `reframe_pairs`, `character_predicates`, `flat_descriptions`, `inversion_conditions`, `appositive_np`. Items are strings or `{ text, w }` objects where `w` may be an `ntCtx => number` function.

**Nine single-observation architectures**, weighted per hint via `ARCH_WEIGHTS`:
- `shortDeclarative` — "The fridge hums." / "The fridge hums, too loud."
- `bareFragment` — "Heavy." / "A hum."
- `bodyAsSubject` — "Cold sits on the back of the neck."
- `sourceAmbiguity` — "Something — the fridge, maybe, or the heat — hums."
- `interpretiveEscape` — "The fridge hums, and the sound was just a sound."
- `reframeDash` — "Not heavy — dissolved."
- `sensationCharacter` — "The tiredness lived in the limbs."
- `flatTautology` — "Still tired." / "The fridge was the fridge." (flat hint only)
- `conditionalInversion` — "Something was tight, but only when she stopped to notice."

**Three passage-level shapes** (multi-observation, selected via `PASSAGE_SHAPE_WEIGHTS` per hint):
- `appositive` — two obs fold into one sentence: "The fridge hums, a weight in the limbs." Requires `appositive_np` pool on obs[1]. 8 sources have pools: fridge, pipes, indoor_temperature, fatigue, hunger_signal, anxiety_signal, rain, window_light.
- `terminal_list` — N obs as comma-separated fragments: "Heavy, the fridge, traffic." Requires 3+ obs with mixed sensory channels.
- `arrival_seq` — full sentences joined with "Then": "The fridge hums. Then the room is cold." Any 2+ obs.
- `independent` — the default; each observation its own sentence (weight 1.0; multi-obs shapes are infrequent, ~20–35% total non-independent weight).

**RNG accounting for passage shapes:** obs[0]'s r1 is drawn upfront as the shape selector. In the independent path it passes through to `realizeOne` as obs[0]'s r1. In multi-obs paths all N×4 calls are consumed in dedicated slots — 4 for obs[0] (r0_1 + 3 more), 4 each for obs[1..N-1].

**`overwhelmed` passage** — polysyndeton: each observation's sentence stripped of punctuation and joined with "and". First phrase capitalized; rest lowercased. Handled before shape selection; always independent of passage shapes.

**NT augmentation** — `augmentNT()` extracts observation property flags (`_temp_cold`, `_quality_gravitational`, `_irritable`, `_char_unsettled`, etc.) from `obs.properties` and merges into a copy of `ntCtx`. Lexical weight functions use these flags to produce state-appropriate word choices.

**Tests:** 54 unit tests in `tests/realization.test.js`. Cover all nine single-obs architectures, all three passage shapes, multi-observation passages, polysyndeton, fixed 4N RNG consumption, NT variation, unknown hint fallback. All passing.

**Selection model** — threshold + habituation + change detection:
- `getSalienceThreshold(hint)` — NT-state-driven perceptual threshold. overwhelmed=0.25, anxious=0.30, heightened=0.40, calm=0.50, flat=0.55, dissociated=0.60. All observations above threshold fire; those below don't register.
- `habituationFactor()` — `0.4 + 0.6 × exp(−minutesAtLocation / 40)`. Starts at 1.0 on arrival, floors at ~0.4 after ~2 hours.
- `getChangeSalience()` — orienting response. `changeTracker` map fingerprints each source's discrete state (string/boolean properties only; numerics excluded). When a source's tier/quality/condition label changes: spike = 0.4, decays with 12-min time constant. First observation establishes baseline (no spike). Effective salience = `(raw_salience × habituationFactor()) + change_spike`. A source below threshold can surface if it just changed state.
- `realize()` takes whatever observations the caller passes and realizes all of them. Selection is the caller's responsibility.

**Wired to game loop** — two contexts:
- **Idle** — `sense()`: filters by `getSalienceThreshold(hint)` after habituation, then realizes all above threshold. 12-min cooldown. Fires in `handleIdle`.
- **Arrival** — `arrivalSense()`: same threshold + habituation, but habituation = 1.0 (just arrived). No cooldown. Fires in `handleMove` after `transitionText`, before events. Arrival text prepended to event display queue so it appears first. RNG consumption matched in `replayMove` and `executeActionForReplay`.

Observation pipeline is the live path. Fragment library and `composeFragments` removed.

### Sleep Prose
Two-phase system: falling-asleep (how sleep came) + waking-up (the gradient back to consciousness). Falling-asleep branches on pre-sleep energy, stress, quality, and duration, with NT shading: adenosine→crash depth, GABA→can't-settle anxiety, NE→hyper-alertness, serotonin→warmth of surrender, melatonin→onset delay (~22 variants). Waking-up branches on post-sleep energy, sleep quality, alarm vs natural wake, time of day (dark/late/morning), mood, sleep debt, and sleep inertia, with NT shading: adenosine→sleep inertia, serotonin→dread-vs-ease, NE→sharp edges, GABA→night dread, debt→cumulative exhaustion (~44 variants). Composed together as a single passage. No numeric hour counts — all qualitative.

### Alarm Negotiation Prose
Snooze and dismiss interactions with escalating prose. Snooze has three tiers: first press (fog, 4 variants), second press (negotiation, 3 variants), third+ (guilt, 4 variants). All NT-shaded (adenosine, serotonin). Dismiss varies by snooze count (0 = immediate, 1-2 = typical, 3+ = running late) and mood/energy. Slept-through-alarm awareness adds to waking prose when alarm fired but didn't wake you.

### Outfit Prose
Generated dynamically by `clothing.js outfitDescription()` — describes currently worn items with fit notes. Driven by the per-item wardrobe; no fixed outfit sets. Sleepwear is an authored 6-option selection from chargen.

## Character Generation

Single-screen UI with:
- Job dropdown (3 options)
- Age input (numeric, default random 22–48)
- Location dropdown (4 options: tropical, NH temperate, NH cold, SH temperate)
- Season dropdown (dynamic based on location's climate zone)
- Sleepwear dropdown (6 options)
- Wardrobe: generated per-item by `generateWardrobe()` (8–24 items, sized by economic_origin; 3 charRng calls per item)
- Friend/coworker/supervisor names (editable, with reroll)
- Player first/last name (editable, with reroll)
- Name sampling from weighted US Census + SSA data (100 first names, 100 surnames)
- Personality parameters: neuroticism, self_esteem, rumination, trait_loneliness, introversion (0–100 each, generated silently, not exposed in UI)
- Sentiments: 8 categories of likes/dislikes (weather, time, food, rain, quiet, outside, warmth, routine), generated silently from charRng
- Life history backstory: economic_origin, career_stability, 0–2 life_events (generated silently from charRng)
- Financial simulation: starting_money, pay_rate, rent_amount, financial_anxiety, personality adjustments, work sentiments, job standing (computed post-finalization)
- Bill day offsets: paycheck, rent, utility, phone bill (generated silently from charRng)

## Infrastructure

### Save System
IndexedDB. RunRecord: `{ id, seed, character, actions, status, createdAt, lastPlayed, version }`. Debounced writes (500ms), flush on beforeunload.

### Multi-Run
Threshold screen lists all runs. Click to resume. "Another life" starts fresh. Step-away link pauses current run and returns to threshold.

### Deterministic Replay
Dual PRNG streams (charRng for chargen, rng for gameplay) derived from master seed via splitmix32. Changing chargen never breaks gameplay replay. Actions logged as `{ type, id/destination, timestamp }`.

### In-Game Look-Back
Replay scrubber with significance heatmap. Scene segmentation (by movement). Snapshot system for fast seeking. Autoplay with variable speed. Keyboard navigation (arrows, ctrl+arrows, space).

### Habit System (Phase 1 + Auto-Advance)
CART decision tree engine learns action patterns from observed play. No RNG consumed — pure state reads + ML. Ephemeral — trained from the action log each session, no save format changes.

**Feature extraction:** ~35 features from current game state — energy/stress/hunger/social/social_energy (continuous), key NT levels (serotonin, dopamine, NE, GABA, adenosine, cortisol), qualitative tiers and mood tone (categorical), daily flags (dressed, showered, ate, etc.), location, weather, sentiments (work dread, routine comfort), money, phone state, time since wake, last action.

**Training:** One-vs-rest binary trees per action. Recency-weighted (exponential decay, half-life ~7 in-game days). Trained after replay on session load, retrained every 10 actions during live play. Minimum 20 total examples + 3 positive per action to build a tree. Max depth 5.

**Prediction tiers:** For each available action (interactions + movement), run its tree on current features. Two thresholds, both modulated by routine sentiment:
- `>= 0.6` (suggested) — subtly brighter text, the player notices one option feels "closer"
- `>= 0.75` (auto) — character acts on their own after a delay

Competing habits (top two within 0.1) → no prediction. Movement predictions now surface in UI alongside interaction predictions.

**Auto-advance:** When prediction reaches auto tier, the system shows approaching prose (deterministic, no RNG — mood-toned text like "Clothes." or "You're reaching for your clothes before you've thought about it."), highlights the predicted action with `action--auto` / `movement-link--auto` CSS class, and starts a 2500ms timer. After the delay, the action fires automatically. The player can click any action at any point to interrupt. Auto-advance chains naturally: each auto-fired action re-renders, re-predicts, and chains if the next prediction is also auto-tier. Morning routines flow: get_dressed → shower → eat_food → move:street without the player clicking.

**Approaching prose:** 32 interaction + 7 movement connection prose functions in `Content.approachingProse`. All deterministic (moodTone + NT conditionals, no RNG consumed). Terse at neutral mood ("Shower."), body-aware when stressed ("Water. You need the water."), colored when low ("The bathroom. Automatic.").

**Continuous brightness:** Predicted action's text color interpolates smoothly with strength — barely above base at 0.6, approaching body text color at 1.0. No discrete CSS classes or threshold snaps. Actions lerp from #8a8078 to #c8c0b8; movement from #605850 to #a09890.

**Character influence:** Routine comfort sentiment lowers both thresholds (habits form easier). Routine irritation raises them (habits resist forming).

**Anti-snowball:** Training examples carry source tags — `'player'` (weight 1.0) when the action didn't match a visible prediction, `'suggested'` (weight 0.5) when it matched a suggestion, `'auto'` (weight 0.1) when auto-advance fired. Prevents the system from training on its own predictions and manufacturing the predictability it's trying to detect. Base prediction threshold is 0.6 (not 0.5) — borderline predictions stay quiet.

**Phone mode:** Auto-advance is suppressed while viewing phone — phone interactions are a focused mode.

**Deferred:** Prose modulation (habit strength → prose density), decision path → prose motivation, routine sentiment activation from habit consistency.

### UI
Fade transitions on all text changes. Awareness bar (time + money, clickable to focus). Idle timer (30s → 60s → 2min → 5min → 20min plateau; stops if no user input for 5 min). Phone buzz on new messages. Tab-visibility-aware.
