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
- **connection_depth** (0–100) — tiers: hollow / surface / present / deep. Tracks cumulative genuine reciprocal contact. Decays toward 0 at τ=69h (half-life ≈ 48h, no floor). Raised by: reply_to_friend (+15), message_friend (+12), reach_out_to_friend (+12), reading friend messages (+5), talk_to_coworker (+3), coworker_speaks (+2). NOT raised by parasocial consumption (watch_content, social browsing). Modulates serotonin target via depth-dependent coefficient: `(social-50) × (0.06 + 0.09 × depth/100)`. See docs/design/parasocial.md.
- **job_standing** (0–100) — tiers: at_risk / shaky / adequate / solid / valued. Continuous appearance penalty during work hours: `appearanceAwareness() === 'notable'` → −0.12 pts/hr; `'severe'` → −0.25 pts/hr. Approximation debt (appearance).
- **money** (float) — can be negative. Tiers: overdrawn (< $0) / broke (= $0) / scraping / tight / careful / okay / comfortable
- **age_stage** (years, set by `applyToState()`) — `ageStageTier()`: young_adult (18–27) / adult (28–39) / midlife (40–55) / older (56+). Drives deterministic prose shading at key sites (waking, work, bathroom mirror, money idle thoughts, exhaustion_wave). Separately used for N3 sleep scaling (sleep architecture).
- **time** — continuous minutes since game start, never resets
- **sensory_load** (0–100) — accumulated sensory stimulation. Tiers: comfortable (<35) / stimulated (35–59) / overloaded (60–84) / shutdown (≥85). Drifts toward a location-and-state-dependent target via exponential approach in `advanceTime()`. Target = `locationStimulationLevel × 100 × (1 + NE×0.5 + sensitivity×0.4 + stress×0.3)`. Accumulation rate 0.12/hr (×1.5 at max sensitivity); recovery rate 0.08/hr (×1.5 at high GABA; ×0.6 for autistic characters). Location stimulation levels: workplace 0.75, corner_store 0.65, street 0.60, apartment_bedroom/bathroom 0.15, library 0.20, park 0.30. Sleep clears to 0. Specific interactions accelerate recovery: lie_there (−8/−12), sit_on_couch (−6/−10). Interaction gating: at 'overloaded', ~30 complex/social interactions blocked (talk_to_coworker, call_friend, cooking, exercise, etc.); at 'shutdown', only ~20 basic survival interactions allowed (lie_there, sleep, sit, drink_water, use_toilet, go home). `getSalienceThreshold()` raised +0.15/+0.30 at overloaded/shutdown — fewer sensory observations surface. Not autism-specific — anyone with high `sensory_sensitivity` (>0.5) reaches higher tiers faster. Autism slows recovery.

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
- **Sleep quality** — eight multiplicative factors (adenosine crash penalty removed — mechanistically backward): stress (overwhelmed 0.82×, strained 0.91×), hunger (starving 0.88×, very_hungry 0.94×), rain comfort (up to +0.04), melatonin at onset (>60 → 1.03×, <25 → 0.90×), circadian alignment (daytime 0.75×, early morning 0.90×), caffeine interference, alcohol interference (0.80× when alcohol_sleep_flag or alcohol_level ≥ 10 — REM suppression despite SWS increase; Ebrahim 2013 PMID 23347102), cannabis interference (0.88× when cannabis_sleep_flag or cannabis_level ≥ 8 — THC REM suppression; Babson 2017 PMID 28349316). Calibrated from PSG literature (Renner 2022 PMC9758584; Dijk & Czeisler 1999 PMC2269279; Ferracioli-Oda 2013 PMC3656905).
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
- `ambientTemperature()` — derived pure function (no stored state). Composed of: seasonal sinusoidal baseline (latitude + day-of-year), diurnal sinusoidal variation (peak 14:00, trough 02:00), + weather modifier.
- `seasonalTemperatureBaseline()` — continuous cosine model: mean = 27 − (|lat|/90)×32; amplitude = 3 + (|lat|/90)×17; peak at doy 172 (N) / 355 (S). All parameters marked approximation debt (temperature).
- Diurnal amplitude: 3°C tropical, 5°C temperate. Weather modifiers: clear +2, grey 0, overcast −1, drizzle −2, snow −6.
- `temperatureTier()` — 'bitter' | 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot'. Calls `ambientTemperature()` directly.
- Used in street, bus_stop descriptions; move:street approaching prose; skin drain (outside + cold); vasovagal isHot check.

Snow:
- Added to weather pool when `season() === 'winter'` and `seasonalTemperatureBaseline() <= 2°C`. Weight 2 (same as drizzle).
- `State.set('rain', ...)` remains false for snow.
- Snow prose in: street description (quiet, muffled), bus_stop (bench clearing), weather_shift event (inside: window light change; outside: street softens), move:street approaching prose.

### Health Conditions
Two health tracks: chronic conditions (permanent, per-character) and acute illness (transient, anyone can get it).

**Chronic condition architecture:**
- `health_conditions: string[]` in state, set by `Character.applyToState()` from `character.conditions`
- `hasCondition(id)` query — all condition-gated behavior uses this
- `energyCeiling()` — returns max achievable energy (100 normally; reduced by migraine, illness, dental flare, or vasovagal recovery)
- `migraineTier()` — 'none' | 'building' | 'active' | 'severe'
- `dentalTier()` — 'none' | 'dull' | 'ache' | 'flare'. Thresholds calibrated to clinical VAS cut-points (PMC5766084): dull [5–44), ache [45–74), flare ≥75.
- `vasovagalTier()` — 'none' | 'building' | 'prodrome' | 'episode' | 'recovery'
- `bloodPressureTier()` — 'normal' | 'low' | 'very_low' — derived from NE + hydration + energy

**Migraines (chronic condition):**
- ~15% prevalence at chargen (+5% for high-neuroticism or precarious career)
- Trigger: probabilistic in `advanceTime`, risk score from adenosine + stress + sleep debt
- Intensity: 30–70 at onset, decays ~8 pts/hr after 2h active phase
- Effects: raises NE + lowers dopamine while active; bedroom description overridden for active/severe
- `take_pain_reliever` interaction at apartment_bathroom: -35 intensity; now shared with dental pain
- `go_for_walk` blocked at 'severe' tier
- Postdrome/aura ○

**Dental pain (chronic condition):**
- `dental_ache` (0–100): continuous pain; spikes from eating +20 (chewing, calibrated Hargreaves biorxiv), hot coffee +25 (thermal, PMC3819160/Allison 2020); decays ~1.5/hr
- **Chargen:** only at-risk for `precarious` economic origin (~35%, grounded in CDC NHANES low-income prevalence data) or `modest` origin with severe financial hardship (starting_money < $200, ~20%). Comfortable/secure origins: probability effectively zero — no roll. Approximation debt: no jurisdiction model yet.
- Morning baseline: `wakeUp()` ensures dental_ache ≥ 8 when condition present (jaw pressure overnight)
- **Tier effects:** 'dull' (8–44) — background noise; 'ache' (45–74) — shapes eating prose; 'flare' (75+) — overrides eating, cuts energyCeiling, suppresses GABA
- **NT per tick:** NE raised proportional to ache; GABA suppressed when ache > 50
- **Food/drink triggers:** eating interactions spike ache +20 (chewing, calibrated); coffee interactions +25 (hot liquid, calibrated)
- `take_pain_reliever` reduces dental_ache by 35 (shared with migraines); dental-specific prose when tooth is dominant
- Bedroom description: deterministic ache/flare suffix appended
- Idle thoughts: 9 entries at 'dull'/'ache'/'flare' tiers; condition-aware thoughts at 'inflamed'/'infected'/'abscess'
- **Condition worsening:** `dental_condition` ('sound'|'inflamed'|'infected'|'abscess') + `dental_last_treated` timestamp + `dental_abscess_onset` timestamp + `teeth_lost` counter. `inflamed`→`infected` after 14 game-days untreated (+20 ache); `infected`→`abscess` after 7 further days (+30 ache, sets `dental_abscess_onset`). Abscess: nausea +0.3/hr, cortisol +0.5/hr (systemic); after 30 game-days at abscess tier, `tooth_extraction` interrupt fires. Approximation debt (dental): all timelines chosen.
- `dentalConditionTier()` exported from state.js. Characters with `dental_pain` start at `'inflamed'` (set by `applyToState()` in character.js).
- **Treatment:** `schedule_dentist` phone interaction — books interrupt 3–7 days out; `dentist_appointment` event fires from interrupt queue — 60 min, $120 base cost (free for precarious economic origin); resolves abscess→inflamed or infected/inflamed→sound; NT relief: serotonin +6, NE −5, cortisol −10. `dental_last_treated` updated on successful treatment.
- `take_pain_reliever` bug fixed: `acheNow` now defined as post-treatment dental_ache value

**Gastritis (chronic condition):**
- `gastritis_pain` (0–100): continuous epigastric pain; rises when stomach empty (→80 target, ~40 pts/hr), eases on eating (−25 pts full meal, −15 pts pantry meal), gentle decay when partially full (~8 pts/hr)
- `gastritisTier()` — 'none' | 'gnaw' | 'ache' | 'burn'. Thresholds: gnaw [8–34), ache [35–64), burn ≥65
- `gastritisEase(amount)` — eases pain from eating; no-op if condition absent
- **Chargen:** two upstream paths (both can trigger independently):
  - H. pylori SES proxy: precarious→60–70% exposure × 12% gastritis conditional; modest→45%; comfortable/secure→27%. Approximation debt (gastritis)
  - Stress history: precarious origin OR (career_stability < 0.3 AND financial_anxiety > 0.25) → 8% additional roll. Approximation debt (gastritis)
  - NSAID overuse (path 3) — deferred: requires game-history data unavailable at chargen
  - Refs: Bytzer 2001 PMID 11389773 (10–15% prevalence); Hooi et al. 2017 DOI 10.1053/j.gastro.2017.04.022 (H. pylori SES gradient — PMID unverified); Jones 2006 PMID 17148741 (stress direction)
- **Morning baseline:** `processSleepEnd()` ensures gastritis_pain ≥ 35 (overnight fasted exposure). Approximation debt (gastritis)
- **Slower gastric emptying:** half-life multiplied 1.3× via `gastritisSlowFactor`. Approximation debt (gastritis); direction: Parkman 2004 PMID 15357949
- **Nausea contribution:** pushes nausea toward 35 at 3 pts/hr when empty; 0.5 pts/hr when not empty (capped at 10). Approximation debt (gastritis)
- **NT per tick:** NE raised proportional to pain (coefficient 1.5); GABA suppressed when pain > 40 (coefficient 1.0). Approximation debt (gastritis)
- **Eating prose:** burn tier → dedicated relief block (food eases it, the absence is notable); ache/gnaw → weighted variants in general eating returns
- **Bedroom description:** morning modifier at 'burn'/'ache'/'gnaw' tiers (deterministic, no RNG)
- **Idle thoughts:** 9 entries at 'burn'/'ache'/'gnaw' tiers; the specific quality of empty-stomach pain that's also something more
- Approximation debts: `grep 'Approximation debt (gastritis)'` — 10 sites

**Vasovagal / orthostatic (continuous risk model — no condition gate):**
- `vasovagal_risk` (0–100): accumulates when BP proxy is low + heat; cleared by sleep (50 pts/hr)
- `vasovagal_recovery` (0–100): post-episode residual fatigue; drains ~15 pts/hr; cuts energyCeiling when > 40
- `autonomic_dysregulation` condition (~4% chargen base rate, elevated to ~50% when hEDS; Grubb 2005 PMID 15996440 / Sheldon 2015 DOI 10.1093/europace/euv014): 2.5× accumulation rate, 0.6× drain rate
- **Accumulation:** 'very_low' BP → 40–50 pts/hr; 'low' → 15–20 pts/hr; normal → −15–30 pts/hr
- **Episode trigger** (risk ≥ 90): resets risk, starts recovery at 80, NE +15, adenosine +20, nausea +30, energy −20
- **Events:** `vasovagal_prodrome` (tier crossing to 'prodrome'), `vasovagal_episode` (tier crossing to 'episode') — both deterministic, no RNG
- **Prose:** bedroom + kitchen description modifiers at 'building'/'prodrome'/'recovery' (deterministic)
- Approximation debts: `grep 'Approximation debt (vasovagal)'` — 3 sites

**hEDS (hypermobile Ehlers-Danlos Syndrome — constitutional condition):**
- Derived from `connective_tissue_laxity >= 88` at chargen (no separate die roll — hEDS IS the extreme of the laxity distribution). Prevalence ~1–2% from the triangular-ish distribution.
- Refs: Hakim & Grahame 2003 PMID 12873383 (prevalence review); Malfait 2017 PMID 28306229 (2017 International Classification). Approximation debt (hEDS): threshold 88 calibrated to distribution, not independently derived.
- `heds: bool` stored on character and state; legacy saves default false.
- `chronic_pain_level` (0–100): continuous diffuse pain. Drifts toward baseline ~25 (mild persistent); post-exertion factor 1.5× when adenosine > 50. Sleep reduces at 8 pts/hr. Approximation debt (hEDS): baseline 25 and all rates chosen; highly variable between individuals.
- **NT effects (via target functions):** serotonin −(pain−10)×0.07 (pain > 10); NE +(pain−15)×0.05 (pain > 15); cortisol +(pain−20)×0.04 (pain > 20). All approximation debts (hEDS); coefficients chosen.
- **POTS comorbidity:** 1 unconditional charRng call at chargen; applies when hEDS=true and roll < 0.50 → adds 'autonomic_dysregulation' (comorbidity ~40–75%; Gazit 2003 PMID 12527542). Approximation debt (comorbidity): 50% chosen as midpoint.
- **Idle thoughts (content.js):** joint instability (subluxation prose, unremarkable character response; weight 2–2.5); pain/fatigue thoughts when chronic_pain_level > 15 (weight scaled by lerp); weather-change pain when weather='rain'/'storm'.
- Approximation debts: `grep 'Approximation debt (hEDS)'` — 9 sites

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

**Constitutional mental health conditions:**
- Structural constraints on NT range — configuration, not state. Once rolled at chargen, persist for the run.
- **Major depression** (`has_depression`, ~7% base, +neuroticism/self_esteem/life_events): serotonin floor 20→30, dopamine ceiling 85→70. 5 idle thoughts.
- **Generalized anxiety** (`has_gad`, ~3.1% base, +neuroticism/precarious origin): GABA ceiling 78→65, cortisol floor 10→30. 5 idle thoughts.
- **PTSD** (`has_ptsd`, ~3.6% base, +trauma life_events): NE +10 baseline, NE floor 25→35, cortisol floor 10→30, sensory_sensitivity +0.15. 5 idle thoughts.
- **Bipolar II** (`has_bipolar`, ~1.1% flat rate): `bipolarPhase()` sinusoidal (28d+46d periods). Depressive pole: serotonin floor raised, dopamine ceiling lowered. Hypomanic pole: dopamine ceiling 95, target +10. 7 idle thoughts.
- Chargen: 4 unconditional charRng calls. Save version 6→7. Approximation debts: `grep 'Approximation debt (mental health)'`

### Finance accessors
- Billing cycle offsets now stored in state (set by `applyToState()`) — content no longer calls `Character.get('..._day_offset')`
- `nextPaycheckDays()` — days until next paycheck (0 = today)
- `nextBillDue()` → `{ name, amount, daysUntil }` — soonest upcoming bill across rent/utilities/phone
- TODO.md: noted paycheck structure + bill amounts as approximation debts that should derive from job type, season, usage, plan

### Substances (caffeine + nicotine + alcohol + cannabis)
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

**Nicotine:**
- **State vars:** `nicotine_level` (0–100, t½=2h), `nicotine_habit` (0–100), `nicotine_withdrawal` (0–100, irritability-dominant), `nicotine_today_peak` (reset at processSleepEnd), `has_cigarettes` (integer count).
- `nicotineTier()` — 'none' | 'low' | 'active' | 'high'
- `isSmoker()` — true when nicotine_habit ≥ 40 (~7 days of daily use). Gates smoker-specific interactions.
- `consumeNicotine(amount)` — updates nicotine_level, NE spike (0.25×), small DA boost (0.10×), weak adenosine antagonism (0.04×). Tolerance-reduced at high habit.
- `nicotineWithdrawalTier()` — 'none' | 'mild' | 'moderate' | 'severe'
- **Withdrawal kinetics:** fast. At habit=100, builds 3.0 pts/hr → mild onset at ~5h, moderate at ~13h, severe at ~23h. Clears at 40 pts/hr when nicotine ≥ 15. Withdrawal character: GABA down (−4 pts/hr at withdrawal=100), NE up (+3), DA below non-smoker baseline (−8 × wFrac × hFrac pts/hr) — the sub-baseline penalty only bites established smokers in withdrawal.
- **Chargen:** `starting_smoker` roll in chargen.js (~17–25% depending on economic origin). Smokers start with habit=80, nicotine_level=10 (morning), `has_cigarettes` 3–18 via `charRandomInt`.
- **Habit update:** in `processSleepEnd()` — +6/day if peak ≥ 25, −3/day otherwise. ~17-day build, ~33-day washout.
- `buy_cigarettes` at corner store — costs ~$8.50–11.00 (CORNER_STORE_CIGARETTES_PRICE constant). Pack of 20. Available if `isSmoker()` and `canAfford()`. Withdrawal-aware prose.
- `smoke_cigarette` — multi-location interaction (location: null, availability checks in available()). Available at any `area === 'outside'` location + `workplace` during work hours. Burns 1 cigarette. 5–10 min. Work breaks get −3 stress (legitimized absence value). First-cigarette-after-withdrawal prose: the relief of the deficit filling. Smoke-break prose: stepping away from context as primary value. Idle thoughts: 3-tier irritability/craving signal with out-of-cigarettes sharpening.
- **Approximation debts:** `grep 'Approximation debt (nicotine)'` — 10 sites.

**Alcohol:**
- **State vars:** `alcohol_level` (0–100 BAC proxy; 1 standard drink ≈ 15 units), `alcohol_tolerance` (0–100), `alcohol_withdrawal` (0–100), `alcohol_sleep_flag` (boolean; set at evening/night drinks, cleared on wakeUp), `has_alcohol` (integer unit count at home).
- **Metabolism:** zero-order kinetics (linear elimination, not exponential). Rate ~15 + tolerance×0.05 BAC-units/hr. Ref: Holford 1987 (PMID 3567296). Approximation debt (alcohol): rate chosen; real rate varies by sex/weight/food/genetics.
- `alcoholTier()` — 'none' | 'low' | 'medium' | 'high'
- `alcoholWithdrawalTier()` — 'none' | 'mild' | 'moderate' | 'severe'
- `consumeAlcohol(drinks)` — adds 15 units/drink (tolerance-reduced 0–20% at tolerance=100).
- `alcoholSleepInterference()` — 0.80× quality when `alcohol_sleep_flag` or alcohol_level ≥ 10 at sleep onset. REM suppression despite SWS increase. Ref: Ebrahim et al. 2013 (PMID 23347102).
- **Acute NT effects (dose-dependent):** Low (<25): GABA ↑, NE mild ↓, DA ↑, 5HT ↑ slight (push/loosening). Medium (25–50): GABA ↑↑, NE ↓, DA plateau. High (>50): GABA max, DA crashing, NE suppressed, adenosine accelerates (+4 pts/hr). Ref: Valenzuela 1997 (PMID 15704351).
- **Post-acute rebound (hangover NT layer):** When alcohol_level=0 and withdrawal>0: GABA below baseline (−4 pts/hr at withdrawal=100), NE rebound (+3.5), serotonin below pre-drink baseline (×wFrac×hFrac −2 pts/hr). This is the hangover's neurological component.
- **Withdrawal:** builds when tolerance > 30 and alcohol_level < 5. Rate 1.5 pts/hr at tolerance=100 → mild at ~10h, moderate at ~27h. At severe (>80) + tolerance > 70: massive NE spike (+12/hr), GABA suppression (−8/hr), nausea (+5/hr), stress (+10/hr) — medically dangerous territory (DTs risk). Clears at 8 pts/hr when alcohol ≥ 20.
- **Tolerance update:** in `processSleepEnd()` — +3/day if `alcohol_sleep_flag` was set, −1/day otherwise.
- **Sleep quality:** `caffeineSleepInterference()` pattern; called in sleep execute alongside caffeine check.
- **Chargen:** `alcohol_tolerance_start` roll. Heavy drinkers (~15–20% by origin): tolerance 60–90. Social drinkers (~50%): 10–40. Non-drinkers (~35%): 0. `has_alcohol_start` inventory proportional to tolerance tier. Approximation debt (alcohol): base rates chosen.
- `drink_alcohol` at apartment_kitchen — 1 standard drink per invocation (like smoke_cigarette). Available if has_alcohol > 0 and tier not 'high'. Prose arcs: withdrawal-relief (the relief of deficit filling, not pleasure), low-dose push (warmth/loosening), medium-dose plateau (blunted/slower), high-dose dissociation. Evening/night sets `alcohol_sleep_flag`.
- `buy_alcohol` at corner store — $4–8 per unit. Available if canAfford(4). Withdrawal-aware prose. Approximation debt (alcohol): price range chosen.
- **Idle thoughts:** 3-tier withdrawal signal (mild/moderate/severe). Distinct from caffeine/nicotine: no headache, no edge — a specific wrongness, GABA rebound anxiety, shaking at severe. Prose doesn't name the condition.
- **Approximation debts:** `grep 'Approximation debt (alcohol)'` — 18+ sites.

**Cannabis:**
- **State vars:** `cannabis_level` (0–100; one unit ≈ 60; t½ ~90min exponential), `cannabis_tolerance` (0–100), `cannabis_withdrawal` (0–100; mild), `cannabis_sleep_flag` (boolean; set when consumed before sleep), `has_cannabis` (integer unit count at home).
- **Mechanism:** CB1 agonism → indirect mesolimbic DA release, mild GABA modulation (presynaptic CB1 inhibition of GABAergic interneurons — distinct from alcohol's direct GABA-A agonism). Ref: Bhattacharyya et al. 2010 (PMID 20231922).
- `cannabisTier()` — 'none' | 'low' | 'active' | 'high'
- `isCannabisUser()` — true when cannabis_tolerance ≥ 30. Gates user-specific interactions.
- `consumeCannabis(amount)` — updates cannabis_level (tolerance-reduced, 30% max blunting), mild adenosine accumulation (0.03×).
- `cannabisSleepInterference()` — 0.88× quality when `cannabis_sleep_flag` or cannabis_level ≥ 8 at sleep onset. THC-dominant REM suppression. Ref: Babson et al. 2017 (PMID 28349316).
- `cannabisWithdrawalTier()` — 'none' | 'mild' | 'moderate' | 'severe'
- **Acute NT effects (dose-dependent):** DA ↑ (mesolimbic, 4 pts/unit/hr at full dose), GABA ↑ mild (2.5 pts/unit/hr). Low dose (<40 effective): NE mild ↓, serotonin mild ↑, adenosine mild accumulation. High dose (≥40 effective): NE ↑ (anxiety induction), more adenosine. Ref: Bhattacharyya 2010 (PMID 20231922), Volkow 2014 (PMID 24944302).
- **Emotional blunting:** Key phenomenological feature. Implemented as compression of mood-primary NT distance from 50 (neutral midpoint) each tick — both positive and negative amplitude reduced. Active at high `cannabis_level`; also active during withdrawal at high `cannabis_tolerance` (persistent flat affect / tolerance to euphoria). Approximation debt (cannabis): implemented as direct NT nudge toward 50 rather than as drift-engine target compression — the cleaner architecture is a blunting hook in the drift engine.
- **Withdrawal kinetics:** slow onset (24–72h real). At tolerance=100: 0.6 pts/hr → mild at ~25h, moderate at ~67h. Clears at 15 pts/hr when cannabis ≥ 15. Withdrawal character: NE ↑ (mild, +1.5 pts/hr), GABA ↓ (mild, −1.5 pts/hr), DA below baseline only at tolerance > 60 (−2 × wFrac × hFrac pts/hr). Ref: Budney 2003 (PMID 12954796), Schlienz 2018 (PMID 29679997).
- **Tolerance update:** in `processSleepEnd()` — +2/day if `cannabis_sleep_flag` was set, −1/day otherwise. ~50-day build, 100-day washout at max. Approximation debt (cannabis): rates chosen; real CB1 recovery ~4 weeks (Hirvonen 2012 PMID 22170954).
- **Chargen:** `cannabis_tolerance_start` roll. Regular users (~18–21% by origin): tolerance 40–80. Light users (~20%): 5–25. Non-users (~60%): 0. `has_cannabis_start` inventory proportional to use tier. Approximation debt (cannabis): base rates jurisdiction-agnostic — starting tolerance/inventory drawn from same pool regardless of jurisdiction; legal-access rates are higher in practice.
- `smoke_cannabis` at `apartment_bedroom` — consumes 1 unit. 10–20 min. Evening/night sets `cannabis_sleep_flag`. Prose arcs: withdrawal-relief (heavy tolerance: flat baseline, not euphoria), low-dose softening, active-dose (thought dissolution, time quality), high-dose dissociation + possible anxiety at NE.
- `buy_cannabis` at corner store — $8–18 per unit. Gated by `canPurchaseSubstance('cannabis')` (jurisdiction) + canAfford(8). Withdrawal-aware prose. Approximation debt (cannabis): price range chosen; no neighborhood cost-of-living derivation.
- **Idle thoughts:** 3-tier withdrawal signal (mild/moderate/severe). Character: flat, appetite odd, dreams busy/vivid — distinct from all other withdrawal textures.
- **Approximation debts:** `grep 'Approximation debt (cannabis)'` — 15+ sites.

**Recovery (quit mechanic):**
- **State vars:** `quit_attempt` (null | 'nicotine' | 'alcohol' | 'cannabis'), `quit_attempt_start` (absolute game-minutes; 0 = no attempt), `craving_intensity` (0–100 composite), `days_clean` (longest streak for milestones), `meeting_last_attended` (game-time guard for go_to_meeting).
- `quitDays()` — `(time - quit_attempt_start) / 1440`. Never a stored counter.
- `cravingTier()` — 'none' | 'background' | 'intrusive' | 'consuming'. Gates idle thought selection.
- **Craving calc (advanceTime):** composite from all active withdrawals (nicotine×0.6, alcohol×0.8, cannabis×0.5). Location amplification: corner_store (nicotine×1.3, alcohol×1.2), street (nicotine×1.15). Approximation debt (recovery): coefficients chosen.
- **Relapse detection:** smoke_cigarette, drink_alcohol, smoke_cannabis check `quit_attempt` at start of execute(). Relapse → `quit_attempt=null`, cortisol +8, serotonin −4, relapse prose. RNG balanced: 2 calls on relapse path, 2 calls on normal path.
- **Idle thoughts (craving):** gated on `quit_attempt !== null`. background tier: per-substance hands/thoughts cues (10 total). intrusive tier: 5 thoughts; NE-high physical visceral weight, GABA-low urgency. consuming tier: 3 thoughts. Milestone suffixes (deterministic, no RNG): 3 days, 7 days, 30 days.

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
- `{target: 'coworker1'/'coworker2', quality: 'irritation'}` — builds from bad-mood interactions (+0.015) and bad-mood coworker_speaks events (+0.01). Also builds when appearance is notable (+0.012 talk, +0.01 speaks) or severe (+0.018 talk) — poor presentation reads as social withdrawal to the coworker. High irritation turns social stress relief into stress cost (+2 instead of -3).

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
- **Writing first, guilt/obligation context** (`message_friend` phone interaction): available when a friend has no unread messages, no pending reply, AND (guilt >= 0.06 OR social is connected/warm OR social_energy is drained). Picks the friend with highest guilt (tie-breaks by least recent contact). Resets contact timer, reduces guilt by 0.06, +2 social. Response generated now, delivered after 30–90 min. Prose per flavor + NT-shaded (dopamine/serotonin). 3 RNG calls total. Separate initiation prose tables (`friendInitiateProse`, `friendInitiateMessages`) from reply prose.
- **Writing first, affection/longing context** (`reach_out_to_friend` phone interaction): available when guilt < 0.06 AND social is isolated/withdrawn/neutral AND social_energy is not drained AND no unread messages AND no pending reply. The "I just want to talk to you" impulse. Warmer, tentative prose. Same mechanics as `message_friend`: resets contact timer, reduces guilt by 0.06, +2 social, +12 connection_depth, 3 RNG calls. Separate prose tables (`friendProactiveReachProse` / `friendProactiveReachMessages`) with out-of-the-blue acknowledgment per flavor.

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
- `pay_rate` — hourly take-home rate by job type (food_service $6.00/hr, retail $6.50/hr, office $7.50/hr)
- `rent_amount` — monthly, from origin bracket × stability ($400–950)
- `ebt_monthly_amount` — $204 if enrolled, $0 if not. Enrollment probability by origin (65% precarious / 25% modest / 4% comfortable / 0% secure). `ebt_day_offset` per-character monthly reload day.

**Non-financial outputs:**
- Financial anxiety sentiment (intensity from origin + stability + negative events)
- Personality adjustments (neuroticism, self_esteem nudges from life events)
- Work sentiment from career stability (dread if unstable, satisfaction if stable)
- Job standing from career stability (55–75 range)
- Life event sentiments (health anxiety, authority dread, family guilt)

**Bill day offsets:** paycheck_day_offset, rent_day_offset, utility_day_offset, phone_bill_day_offset — all generated at chargen, stored on character. Each character has their own financial rhythm.

**Jurisdiction:** `character.jurisdiction = { country, region }` — ISO 3166-1 alpha-2 + optional ISO 3166-2 subdivision (US states, AU states). Generated at chargen (2 charRng calls). Used by `canPurchaseSubstance(type)` in state.js to gate `buy_cannabis`, `buy_alcohol`, `buy_cigarettes`. Modeled countries: US (24 rec-legal states), CA, GB, AU (ACT legal), DE, NL, FR, XX. Legacy saves without jurisdiction default to { country: 'US', region: 'CA' }.

### Financial Cycle
Closed-loop financial system: income, obligations, and the collision between them.

**Income:** Biweekly paycheck = `pay_rate (hourly) × hours_worked_period`. Standard period = 80h (8h/day × 10 days). Overtime at 1.5× above 80h. Missing shifts reduces pay directly — no guaranteed minimum modeled. "Less than usual" notification when hours < 72. Arrives as phone deposit notification. Small anxiety relief when paycheck arrives while broke.

**Bills (4, monthly on character-specific offsets):**
- Rent — from backstory
- Utilities — $65 (approximation)
- Phone — $45 (approximation)
- Auto-deducted. Success → notification with perceived balance; also resets failure counter and restores service if suspended. Failure → "declined" notification, +8 stress, +0.03 financial anxiety. If money was ≥ $0 when the bill failed, a one-time overdraft fee of $30 is charged (Approximation debt (debt)) and money goes negative. Subsequent skips while already overdrawn: no additional fee.

**Repeated bill failure consequences** (state defaults safe for legacy saves):
- `phone_bills_failed` (int) — increments on each failed/skipped phone bill; resets to 0 on successful payment. At ≥ 2: `phone_service = false`; messaging and calling interactions unavailable; "No service." on phone home screen; phone note/alarm/timer still work. Service restored on next successful payment (phone message sent on both suspension and restoration). Approximation debt (bill consequences): threshold of 2 chosen.
- `utilities_bills_failed` (int) — same model for utilities. At ≥ 2: `utilities_on = false`; `make_coffee` unavailable; apartment location descriptions note dark/cold; shower still works (cold water only); sleep quality penalty 0.92× when sleeping cold at home (evening/night). Approximation debt (bill consequences): threshold of 2, penalty 0.92× chosen.
- `eviction_risk` (0–100) — grows with each failed rent payment: +25 first failure, +35 second, +40 third+. Reduced −20 on each successful rent payment (auto or manual). At ≥ 50: idle thoughts note the notice on the counter; at ≥ 75: waking prose includes brief awareness of the notice; at 100: capped — sets `displaced=true`, fires displacement event with routing awareness text. Three paths: friend couch (`ask_to_stay_over`), shelter (`check_in_shelter`), street (`sleep_outside`). Approximation debt (eviction risk): all increments/decrements chosen; real timeline depends on jurisdiction.

**Work attendance tracking:** `hours_worked_period` accumulates the scheduled shift duration (shift_end − shift_start, in hours) on each workplace arrival (guarded by !at_work_today), resets on payday. Calling in sick means no shift hours are added — reduces next paycheck proportionally.

**Money tiers:** overdrawn < $0 / broke = $0 / scraping < $50 / tight < $200 / careful < $600 / okay < $1500 / comfortable < $5000 / cushioned ≥ $5000. Money can be negative — no floor. Recovery is natural: paycheck or received money brings balance positive again.

### Financial Anxiety (NT Integration)
Financial anxiety sentiment connects to neurochemistry:
- At home: `money_anxiety * 4` reduces serotonin target
- At work: `money_anxiety * 2` reduces dopamine target
- Money < $200: serotonin penalty scaling with deficit
- Money < $50: cortisol spike (+3)
- Accumulates from failed bills (+0.03, +additional 0.05 on overdraft fee event), relief from paycheck when broke/overdrawn (-0.01)
- Sleep processing factor 0.6 (entrenches like dread)
- 5 money-anxiety idle thoughts, weighted by anxiety intensity; 4 additional overdrawn-specific thoughts active when `moneyTier() === 'overdrawn'`

### Derived Systems
- **Mood tone** — primarily from neurochemistry (serotonin, dopamine, NE, GABA) with physical state overrides → numb / fraying / heavy / hollow / quiet / clear / present / flat. Same 8 tones, now with inertia instead of instant derivation.
- **Prose-neurochemistry shading** — three-layer pattern: moodTone() as coarse selector, weighted variant selection via `State.lerp01()` + `Timeline.weightedPick()`, deterministic modifiers (adenosine fog, cortisol tension, time-of-day texture, NE+low-GABA restlessness). **All 67 `Timeline.pick` call sites converted.** Covered: idle thoughts, bedroom description, lie_there (deepened: cortisol, adenosine fog, time-of-day, serotonin+adenosine compound), sleep prose (23 branches), look_out_window (deepened: time-of-day, adenosine unreality, quiet mood branch, NE hyperattentiveness), sit_at_table (6 branches), go_for_walk (deepened: social isolation variants, adenosine fog-clearing arc, serotonin recovery note), work events (4 branches), ambient events (5 branches), friend messages (4 flavors), coworker chatter (3 flavors), coworker interactions (3 flavors). No `Timeline.pick` calls remain. See docs/design/overview.md "Prose-neurochemistry interface" for the full pattern.
- **Time period** — deep_night / early_morning / morning / late_morning / midday / afternoon / evening / night
- **Observation fidelity** — time and money awareness degrade with distance from last check (exact → rounded → vague → sensory/qualitative), now also compressed by NT state: adenosine + energy + sleep inertia shrink time-fidelity thresholds; stress blurs money fidelity; financial desperation (high anxiety + low balance) sharpens it in the opposite direction. Location descriptions (bedroom alarm clock, kitchen microwave) use perceived strings, not raw time. Sensory tier handled separately (full-sentence vs fragment). Idle thoughts include fidelity-aware variants for rough/qualitative money and vague/sensory/rounded time, with `perceivedMoneyString()` and `perceivedTimeString()` surfacing the actual fuzzy values in prose.
- **Season** — derived from latitude + start_timestamp. Tropical: wet/dry. Temperate: four seasons. Hemisphere from sign.
- **Weather** — overcast / clear / grey / drizzle / snow (winter+cold only). 3% shift chance per action. Affects prose, not mechanics.

### Per-Wake-Period State
`wakeUp()` is nearly eliminated: sets `wake_period_start = time`, resets `daylight_exposure`, `location_arrival_time`. All "did X happen this wake period?" checks use `events.any(type, wake_period_start)` queries instead of flags. `last_surfaced_late_tier` and `last_surfaced_mess_tier` migrated to event-log queries (`late_anxiety_noticed`, `apartment_notice_surfaced`, `apartment_cleaned` events). Remaining candidate: `daylight_exposure` (continuous fractional accumulator — event summing not cheap).

### Phone State
Battery (dual-rate drain: 1%/hr standby, 15%/hr screen-on; tiers: dead/critical/low/fine), silent mode, inbox (messages accumulate whether or not you look). Charges at 30%/hr during sleep at home and via charge_phone interaction. Starting battery 80–100% (chargen RNG). Message sources: friends (flavor-driven frequency), work nag (30min late), paycheck deposits (biweekly), bill auto-pay notifications (rent/utilities/phone, monthly — when affordable). Bills the player cannot afford are queued in `pending_bills` state and surface as `pay_bill_*` / `skip_bill_*` interactions rather than auto-failing. **Service suspension:** `phone_service` boolean (default true); set false after 2+ consecutive failed phone bill cycles. When false: `reply_to_friend`, `message_friend`, `reach_out_to_friend`, `help_friend` unavailable; "No service." shown on phone home screen. Note/alarm/timer still function. Restored on next successful payment.

**Phone UI:** Full HTML5 phone overlay. Home screen (large time + date + Messages badge + app grid: Messages, Notes, Alarm, Calendar, Timer). Apps: messages list (contacts ordered: friends by recency, then supervisor, then bank; unread dots, preview text), thread view (sent/received bubbles, compose row with Reply/Write when applicable), Notes (list + compose + view), Alarm (time picker, set/cancel), Calendar (7-day schedule), Timer (preset durations 5/10/20/30 min, countdown display, cancel). Navigation is transient state in `phone_screen`. Opening a friend thread marks messages as read and applies guilt side-effects. Reply and Write actions go through the normal game pipeline (RNG consumed, action recorded, friend response queued). Old `read_messages` interaction kept for replay compat. All phone messages now carry `source` and `direction` fields (auto-stamped in `addPhoneMessage`). Timer state: `timer_end_time` (game-time minutes when fires, null = idle), `timer_duration` (minutes set). Timer fires as `timer_fired` event in `checkEvents()` — surfaces as inline prose when game time passes threshold.

**Phone condition:** `phone_cracked` boolean on character — cosmetic CSS crack overlay (`.phone--cracked::after`, hairline linear-gradient lines) applied to the phone overlay when true. Generated at chargen from `economic_origin`: precarious 55%, modest 30%, comfortable 8%, secure 1%. Exactly 1 charRng call. Condition affects texture, not function.

**Laundry access:** `laundry_access` on character and state — `'in_unit'` | `'building'` | `'laundromat'`. Generated at chargen from `economic_origin` (1 charRng call). Thresholds: precarious 50% laundromat / 35% building / 15% in_unit; modest 25%/40%/35%; comfortable 10%/25%/65%; secure 5%/10%/85%. `grep 'Approximation debt (laundry access)'` for sites. Legacy saves default to `'in_unit'`. `'handwash'` deferred — needs separate sink interaction. In-unit interactions gated on `laundry_access === 'in_unit'`; building interactions (`start_laundry_building`, `move_to_dryer_building`, `fold_laundry_building`) at apartment_bedroom with 5–15 min extra time; laundromat interaction (`do_laundry_laundromat`) at street, 90 min full session, $5–8 cost.

### Apartment State

**Object systems (coarse_v1):** Mess is now emergent from tracked object states, not a single scalar. Three modules:

- **Dishes** (`js/dishes.js`) — tracks clean/in_sink counts. `eat_food` calls `Dishes.use()` (one dish goes to sink). `do_dishes` calls `Dishes.wash()` (sink cleared). Kitchen description uses `Dishes.sinkDescription()`: specific prose per count ("A dish in the sink." / "A couple of dishes." / "The sink is full."). `do_dishes` available when `Dishes.dirtyCount() > 0`.

- **Linens** (`js/linens.js`) — tracks bed state (`made`/`unmade`/`messy`) and towel state (`clean_hanging`/`damp_hanging`/`on_floor`). `shower` calls `Linens.useTowel()`. `sleep` calls `Linens.noteSlept()` — bed transitions, damp towel → on_floor. Bathroom description driven by towel state. Bedroom adds sentence when bed is made or messy.

- **Clothing** (`js/clothing.js`, `full_v1`) — per-item tracking. Each item has id, type, name, condition, location, wearState, fit, acquisition dimensions, `damage: { torn, stained, stretched }` (boolean flags), `wearCount` (integer). `wear()` auto-selects by type (top/bottom/socks/underwear), prefers better fit + accessible + clean; increments `wearCount`. `undress(dropTo)` moves all on-body items to destination. `outfitDescription()` prose with fit notes and damage notes. `floorDescription()` names specific items. `startWash()`/`wash()` for laundry cycle. `applyDamage(itemId, type)` sets a damage flag. `wornItemOfType(types)` returns worn candidate for damage rolls. `damagedWornItems()` and `damagedItems()` for queries. Backwards-compat: coarse_v1 saves synthesized from counts; missing wardrobe falls back to `_buildLegacyItems()`; missing `damage`/`wearCount` defaulted in `reset()`, `deserialize()`. Character stores `wardrobe` array at chargen; `reset()` deep-copies from it. `wornCleanlinessValue()` estimates starting cleanliness of outfit about to be worn (call before `wear()`).

- **Clothing cleanliness** — `clothing_cleanliness` (0–100) in state.js. Degrades in `advanceTime()` only while `dressed`: 3 pts/hr awake, 1 pt/hr sleeping. Set on `get_dressed` from `clothing.wornCleanlinessValue()`: clean items → ~90, chair-pile (worn_once) → ~60, floor/worn_out → ~30. `clothingCleanlinessTier()` in state.js: `fresh` (>80), `worn` (60–80), `stale` (35–60), `dirty` (<35). Prose: `get_dressed` reads cleanliness tier for fresh/dirty texture; idle thoughts surface worn/dirty awareness in social and work contexts.

- **Clothing damage** — discrete boolean flags per garment: `torn`, `stained`, `stretched`. Not a health bar; no daily decrement. Torn: rolls at `go_for_run` (6%) and `home_workout` (4%). Stained: rolls at `eat_food` and `eat_from_pantry` (2% each). Bleach stain: rolls at `fold_laundry` when energy depleted/exhausted (3%). Stretched: triggers at `get_dressed` after ≥30 wears (15% per wear beyond threshold). All probabilities marked `// Approximation debt (clothing condition):`. `outfitDescription()` appends first damage note deterministically. `clothing_visible_damage` state flag set when a worn outer garment has torn/stained; cleared on undress. Idle thoughts fire for worn-damaged garments at work and at home. **Appearance feedback loop:** `appearanceAwareness()` composite tier (presentable/slipping/notable/severe) derived from hygieneTier + clothingCleanlinessTier + clothing_visible_damage — drives social/depth penalties in `talk_to_coworker`/`coworker_speaks`, NE/GABA self-consciousness signal, job_standing drift, and compound idle thoughts.

- **Body** (`js/body.js`) — minimum viable interface. `chestDimension()` (breast_tissue_score + binding reduction), `abdominalDimension()` (baseline + pregnancy modifier), `isBinding()`, `bindingFit()`, `bindingHours()`, `hasBreastTissue()`, `pregnancyWeek()`, `hasUterus()`, `energyCeilingModifier()`, `chronicallyBound()`. Wired in context.js before clothing. Body params now generated at chargen (ASAB, puberty_history, hrt_history, constitutional_conditions, reproductive_anatomy, breast_tissue_score, abdominal_baseline).

- **Wardrobe generation** (`chargen.js`) — `generateBodyParams()` and `generateWardrobe()` called at the end of `generateRandom()`. Per-item wardrobe sized by economic_origin (precarious: ~8 items, secure: ~24), 3 charRng calls per item (name, condition, location). outfit_* properties kept on character for backward compat with existing get_dressed prose. Fit stored as `comfortable` pending body dimension integration.

**Mess is now fully emergent.** `apartment_mess` scalar removed. `messTier()` moved from State into content.js, computed from Dishes + Linens + Clothing: dishes in sink (9pts each, max 5), bed state (messy=15, unmade=5, made=0), towel on floor (8pts), clothing floor items (8pts/bedroom, 5pts/bathroom). Four tiers: tidy (<20), cluttered (<45), messy (<70), chaotic (≥70).

**fridge_food** (integer) — depletes on eating, restocked by groceries. Still a scalar (appropriate — no item identity needed for food units).

**Consumable / durable inventory:** All item quantities tracked by `items.js` — no flat state vars. `needs_period_supplies` (boolean) — set when supplies run out during menstrual phase; cleared on restock or when out of flow.

- **Items** (`js/items.js`, `v1`) — inventory and container tracking, source of truth for all item quantities. Typed `ITEM_DEFS` registry: phone, cigarettes, keys, umbrella, pain_reliever, moisturizer, period_supplies, alcohol, cannabis, makeup, binder. Each has `carryClass` (habitual/explicit/fixed), `defaultSpot`, `portable`, `counted`. Runtime state: `Map<type, ItemStack[]>` where each stack has `{ location, count, lastAccessed }`. Apartment spots: nightstand, bedroom_drawer, bathroom_cabinet, kitchen_counter, by_the_door, living_room_table — mapped to game rooms via `SPOT_TO_ROOM`. Special locations: `on_person`, `at_work`, `at_friends`. Per-spot `disorder` (0–1) with `accessibility()` function (recency × disorder). Queries: `itemsAtSpot()`, `itemsInRoom()`, `itemsOnPerson()`, `hasOnPerson()`, `hasAccessible()`, `countOf()`, `countAt()`, `locationOf()`, `spotDisorder()`, `accessibility()`, `totalDisorder()`. Mutations: `add()`, `remove()`, `removeFrom()`, `moveTo()`, `touchItem()`, `tidySpot()`, `addDisorder()`. **Carry mechanics:** `resolveLeaveHome()` — NT-driven forget probability per habitual item (stress × fatigue × rush × accessibility); 1 RNG per eligible item. `resolveSleep()` — pocket items → default spots with disorder accumulation. **Dynamic interactions:** `getItemInteractions()` generates `grab_[type]` and `put_down_[type]` based on item location vs current room — 7 portable item types × 2 directions = up to 14 dynamic interactions. **Observation sources:** `getItemSources(roomId)` generates per-item observation sources for the senses pipeline — salience varies by displacement from default spot, empty containers, and craving state. 11 item-type LEX entries in `realization.js`. **Disorder drift:** `advanceDisorder(hours)` in `advanceTime()` — personality-driven equilibrium (conscientiousness proxy from neuroticism + self_esteem). Disorder accumulates on `add()` (+0.02), `resolveSleep()` (0.03–0.08, NT-scaled), and `put_down` (+0.01). `totalDisorder()` feeds into `mess.js score()`. `character.js applyToState()` populates items via `ctx.items.add()`; `reset()` called before `applyToState()` in all game.js start paths. Serializable: `serialize()`/`deserialize()` with version tag. Wired in `context.js` after clothing.

**Menstrual cycle** (characters with a uterus only): `cycle_day` (1–`cycle_length`, 0 = not applicable), `cycle_length` (24–35, chargen), `cramp_severity` (0–1, chargen), `cramps_active` (boolean), `period_supply_last_consumed` (game time), `cramp_relief_until` (game time, 0 = no relief). Phases: menstrual (1–5), follicular (6–12), ovulatory (13–15), luteal (16–end), late_luteal (last 6 days). `cyclePhaseTier()` + `isCrampRelieved()` exported from state.js. NT effects: serotonin +4–5 follicular/ovulatory, −6 late_luteal; GABA −4 late_luteal, −2 menstrual; NE +3 late_luteal, +2 menstrual. Adenosine +1.5/hr during menstrual phase. Supply consumption: 1 unit per ~7h of waking flow; depleted supply sets `needs_period_supplies` + stress +5. `advanceCycleDay()` called from `processSleepEnd()`. **Ibuprofen cramp relief:** `take_pain_reliever` available for cramps (severity >0.25); sets `cramp_relief_until = time + 240` (4-hr duration); `isCrampRelieved()` suppresses all cramp modifiers. Cochrane NNT~2.1 (Allen & O'Brien 2009 PMID 19169158). **Cramps texture pass complete (layer-3 deterministic modifiers):** do_work, lie_there, take_bath, shower, long_shower, quick_shower, wait_for_bus, sit_on_couch, go_for_walk, work_break, go_for_run, home_workout, yoga_home, breathwork_unguided, breathwork_app, do_dishes, call_in_sick, listen_to_music, read_book, write_in_journal, talk_to_coworker, hang_out_with_friend, call_friend, call_family, sleep, visit_friend, sleep_on_couch (qualityMult + borrowed-space prose), sleep_at_shelter (qualityMult + cot prose), slow_period, take_lunch_break, watch_content, decompress_work, rest_at_library, get_dressed, do_laundry_laundromat, look_out_window, cook_pasta, cook_rice, heat_canned, cook_eggs, make_toast, scroll_phone, sit_on_step, sit_on_bench, sleep_outside (no warmth, no floor, nowhere to pace), handwash_clothes, buy_pain_reliever ("This is what it's for."), buy_medicine, walk_in_park, brief_exchange, do_gig (the money doesn't know that), use_computer, read_at_library, snooze_alarm ("The cramps hit when you tried to move. Nine more minutes was not a choice."), make_coffee (standing at the counter through the cramps with something to wait for), drink_alcohol (low/medium tiers only — self-medication angle; withdrawal/high tiers unaffected). Quality penalties (0.88/0.94) on all sleep paths. All guards: `hasUterus() && cramps_active && !isCrampRelieved()`. Ovulatory mittelschmerz idle thoughts (cramp_severity > 0.4 proxy for ~20% pain-sensitive). Idle thoughts: menstrual cramping (5 thoughts + 2 NT-shaded), cramp-relief/absence (3 thoughts), menstrual without cramps (2 thoughts), supply logistics (4 thoughts); late_luteal irritability/mood (6 thoughts + NT shading), late_luteal physical symptoms (4 thoughts: breast tenderness ×2, bloating ×2). Waking prose: day-1 signal woven into sleep text; needs-supplies notice on waking. All coefficients marked `// Approximation debt (menstrual):`.

**apartment_notice** — fires deterministically when mess tier worsens (tidy→cluttered→messy→chaotic). Tracked via event log: records `apartment_notice_surfaced { tier }` on fire; cleaning interactions record `apartment_cleaned`; dedup query uses `wake_period_start` + last `apartment_cleaned` as effective floor. The 6% ambient chance still fires `apartment_sound` only; notice is separate and RNG-free. NT-shaded: low serotonin reads mess as evidence; high adenosine makes it blur; low dopamine surfaces the knowing-doing gap.

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

**Arrangement types:** `fixed` (office — always known), `rotating` (established retail/food_service), `on_demand` (precarious — revealed nightly), `gig` (implemented — see Gig Work section below), `none` (not yet implemented). Type and parameters generated at chargen from job_type + job_standing + financial_anxiety + career_stability.

**Day patterns:** Office → `'weekdays'` (M–F). Retail/food_service → determined by `career_stability`: stability ≥ 0.60 → `'weekdays'` (M–F); stability < 0.20 → `'specific'` Tue–Sat; stability 0.20–0.40 → `'specific'` Wed–Sun; stability 0.40–0.60 → `'specific'` Sun–Thu. ~60% of retail/food_service workers have weekend-including schedules. `isPotentialWorkDayFor()` reads `day_pattern` and `work_days` — `'specific'` uses `work_days.includes(dow)`. Approximation debt (work-scheduling): distribution from stability proxy, not charRng or employer data.

**Interface:** `State.shiftFor(day)` → `{start,end}` | null | undefined. `isWorkday()` and `isWorkHours()` derive from arrangement (no longer hardcoded Mon–Fri / flat params). `isScheduledWorkDay(day)`, `isPotentialWorkDay()`, `isPotentialWorkDayFor(day)`, `shiftKnownToday()`, `hoursUntilShift()`, `currentAbsoluteDay()`, `setKnownShift(day, shift)` all exported. `withinShift(tod, start, end)` handles overnight shifts (end < start wrap-around).

**Reveal mechanics:** `schedule_reveal` interrupt fires at `reveal_tod` nightly, populates `known_shifts[day+1]`, reschedules for the next night. At game start, today's shift is pre-populated for on_demand/rotating workers (last night's reveal already happened). Phone inbox notification added on reveal. Approximation debt: probability model always assigns shift — see TODO.md.

**Weekend shape:** bus_stop→workplace connection gated by `isWorkday()` (now schedule-derived, not calendar-hardcoded). Weekend idle thoughts: Saturday morning/afternoon/evening texture; Sunday weight + evening anticipation of the week; mood-shaded variants. Corner store: Saturday crowd texture (more people, leisure errands), Sunday texture (quieter, end-of-week restocking). Both deterministic, no RNG.

### Gig work

Chargen: `gig_worker` job type with 25% probability for precarious/high-anxiety characters, 8% otherwise. One unconditional `gigTypeRoll` charRng call in `generateRandom()` for stream balance. `finishCreation()` uses roll + backstory to decide gig arrangement. Subtype (delivery/tasks/mixed) derived from same roll via normalized position.

State: `available_gigs` (array), `gig_active` (null or gig object), `gig_earnings_today`, `gig_hours_today`, `gig_deliveries_completed`, `last_gig_check`. `isGigWorker()` exported. Gig generation in `advanceTime()`: midnight reset, 30-min window guard via `currentWindow > lastWindow`, 8am–10pm only, `available_gigs.length < 3`. 2 RNG calls per window (gigRoll + paramRoll). Generated gig: `{id, type, distance, pay, duration_min, expires_at: s.time + 20}`. Stale gigs filtered on each advance. Job_standing decay, appearance penalty, and coworker mechanics skip gig workers.

Phone flow: `open_gig_app` (home screen) → gigs screen listing `available_gigs` with pay/duration/distance → `accept_gig` (sets gig_active, clears available_gigs) or `decline_gig` (clears available_gigs). `do_gig` interaction at street or park executes gig: `receiveMoney()`, adjusts earnings/hours/deliveries, clears gig_active. `callInSick` returns false for gig workers. Idle thoughts: 11 gig-specific thoughts gated on `isGigWorker()`.

Approximation debt (gig): pay_rate $11/hr — no jurisdiction, platform, or subtype variation. Remaining work: platform ratings system, multiple simultaneous gig acceptance, gig-specific health effects (repetitive strain, weather exposure), platform deactivation risk, gig subtype-specific prose.

## Locations (16)

```
apartment_bedroom ─── apartment_kitchen ─── street ─── bus_stop ─── workplace [weekdays only]
       │             │       │                │                           │
apartment_bathroom ──┘  apartment_living_room │          ┌────────workplace_bathroom
                             │           ┌────┼────┐
                             └─(bedroom) │    │    │
                                    corner_store  park
                                         │        library (10 min)
                                soup_kitchen (8 min)
                                food_bank   (12 min)
                            friends_apartment (15 min)
                                shelter     (10 min)
                                clinic      (15 min)
```

Travel times: 1min within apartment, 2min apartment↔street, 3min street↔bus_stop, 4min street↔corner_store, 7min street↔park, 8min street↔soup_kitchen, 10min street↔library, 10min street↔shelter, 12min street↔food_bank, 15min street↔friends_apartment, 15min street↔clinic, 20min bus_stop↔workplace, 2min workplace↔workplace_bathroom.

## Interactions (227 + dynamic item interactions)

### Bedroom (25)
sleep, get_dressed, undress_floor, undress_chair, undress_basket, set_alarm, skip_alarm, snooze_alarm, dismiss_alarm, charge_phone, check_phone_bedroom, smoke_cannabis (has_cannabis > 0), lie_there, look_out_window, make_bed, tidy_clothes, start_laundry (in_unit), move_to_dryer (in_unit), fold_laundry (in_unit), start_laundry_building (building), move_to_dryer_building (building), fold_laundry_building (building), home_workout (not depleted/exhausted/overwhelmed/severe-migraine), stretch_morning (not depleted; 10 min; cortisol −6, NE −4, energy +5; hEDS: chronic_pain −8, laxity>75 → GABA +3; routine comfort sentiment; last_stretched timestamp), give_up (always available; voluntary run end; deterministic mood-shaded final text; no RNG; transitions to replay after 3.5s), (alarm event wakes you)

### Kitchen (22)
eat_food, eat_from_pantry (fridge empty + pantry not empty), cook_pasta (pantry.pasta > 0 + utilities_on), cook_rice (pantry.rice > 0 + utilities_on), heat_canned (pantry.canned > 0 + utilities_on), cook_eggs (pantry.eggs > 0 + utilities_on), make_toast (pantry.bread > 0), cook_beans (pantry.beans > 0 + utilities_on), make_oatmeal (pantry.oats > 0 + utilities_on), make_ramen (pantry.ramen > 0 + utilities_on), make_pb_toast (pantry.bread > 0 + peanut_butter available; no utilities needed), cook_potatoes (pantry.potatoes > 0 + utilities_on + cooking_skill ≥ 30), cook_stir_fry (pantry.vegetables > 0 + pantry.oil > 0 + protein available + utilities_on + cooking_skill ≥ 30; exec-function failure paths: can't-start + burn), cook_soup (pantry.canned > 0 + body ingredient available + utilities_on; exec-function failure paths: can't-start + boil-over; serotonin bonus scales with ser level), cook_baked_goods (pantry.flour > 0 + binder/fat + utilities_on + cooking_skill ≥ 60; exec-function failure paths: can't-start + burn; big serotonin + dopamine), eat_snack (location: null, gates kitchen+living room; pantry.snacks > 0; no utilities; serotonin +2 × guilt reduction, dopamine +4, cortisol −2; hunger −15; comfort sentiment habituation −0.002; eating guilt cross-reduces serotonin benefit; high cortisol → urgent prose; low serotonin → self-medication prose; comfort_foods[0] name in prose), drink_water, make_coffee (caffeine not high), do_dishes, check_phone_kitchen, sit_at_table, drink_alcohol (has_alcohol > 0, tier not 'high')

### Bathroom (15)
quick_shower (always available, 6 min), shower (not depleted, 15+NT min, warm + compulsive extension), long_shower (not depleted, 25+NT min, deliberate), cold_shower (always available, 8 min, NE/adenosine effects), take_bath (housing_quality ≥ 50 + not depleted; 30 min; GABA +7, cortisol −8, NE −3, adenosine +5, serotonin +3, stress −12; hEDS warmth suffix; autism full-immersion suffix; ADHD layer-3; midSense('waiting'); approaching prose mood-shaded), check_phone_bathroom (post-shower: reach-for-it prose), use_sink, apply_moisturizer (has_moisturizer + skin not healthy), rehang_towel, use_toilet_bathroom, take_pain_reliever (migraines or dental_pain condition + pain_reliever_count > 0; depletable; restock via buy_pain_reliever at corner store), handwash_clothes (smallItemsInBasket > 0 + not depleted; 25 min; washes underwear/socks from basket; label varies by laundry_access; ADHD layer-3), apply_skincare (always available; 5 min; serotonin +3, GABA +2; routine comfort sentiment; last_skincare timestamp; autism+high sensory: deterministic texture suffix), do_hair (always available; 8 min; serotonin +2, NE −2; hygiene_level +5; ADHD/autism layer-3), apply_makeup (wears_makeup + makeup_count > 0; 12 min; serotonin +4, NE −3, GABA +2, hygiene +8; 3 RNG calls; trans/appearance/GABA layer-2 suffix; ADHD/autism layer-3; 2 idle thoughts: lapse + out-of-stock)

### Living Room (1)
sit_on_couch (always available; 12–20 min; adenosine +2, GABA +3, NE −2, stress −3; 3 unconditional RNG calls; NT-weighted prose pool; autism home unmasking layer-3 suffix; high adenosine layer-3 note; midSense 'waiting' appended)
Connected to: apartment_bedroom (1 min), apartment_kitchen (1 min). watch_content available here (location: null, gates on startsWith('apartment')). eat_snack also available here (location: null, gates kitchen+living room).

### Street (10)
check_phone_street, sit_on_step, go_for_walk (location: null, gates to street or library; walking outside from either), find_public_restroom_street (available at aware+; ~55% find something — park/library; ~45% nothing usable), do_laundry_laundromat (laundromat access + dirtyCount > 5 + canAfford(5); 90 min full session), visit_friend (connectionDepthTier not hollow + social_energy ≥ 20 + not displaced; 15 min walk; moves to friends_apartment; social_energy −5 on arrival; 2 RNG calls), nod_at_neighbor (seen/recognized tier + neighbor exists; 1 min; encounters +2; serotonin +1, social +2; 1 RNG call), brief_exchange (known tier + neighbor exists; 3 min; encounters +1; serotonin +2, social +5, connection_depth +1; 2 RNG calls), do_gig (isGigWorker() + gig_active !== null; at street or park; duration_min time cost; receiveMoney(gig.pay); adjusts gig_earnings_today, gig_hours_today, gig_deliveries_completed; clears gig_active; veteran-conditional second RNG call balanced with balance call; approaching prose mood-shaded delivery vs. task), join_gym (!gym_membership + canAfford(membership_cost + signup_fee); 20 min; sets gym_membership=true; 1 RNG call).
Also available here via global gate: go_for_run, listen_to_music (deterministic layer-3 modifier: "The city exists at the right distance with this on."), sleep_outside (see Park section — also fires at street).
Connected to: apartment_kitchen (2 min), bus_stop (3 min), corner_store (4 min), park (7 min), soup_kitchen (8 min), library (10 min), shelter (10 min), food_bank (12 min), friends_apartment (15 min), clinic (15 min), pharmacy (10 min), er (25 min), gym (20 min, gym_membership gate).
Recognition tiers: `street_visits` tracked on each arrival in world.js. `locationVisitTier('street')` → stranger (<5) / familiar (5–20) / regular (>20). Familiar: a face without a name. Regular: neighbor nod + serotonin +1.5. Deterministic (no RNG) in location description.
Named neighbor: generated at chargen (3 charRng calls: archetype roll, first name, pronoun). 7 archetypes (always_smoking, dog_walker, early_commuter, night_shift, front_stoop, music_person, quiet_one). `neighbor_encounters` incremented on daytime street arrival in world.js. `neighborTier()` → unseen/seen/recognized/known (thresholds 1/5/15). Observation source `neighbor_presence` in senses.js (visual channel, salience 0.55, habituationTau 45). Lexical set in realization.js — archetype-specific subjects/predicates at recognized tier, name-aware at known tier. Visual channel — no chromesthesia.

### Park (3)
sit_on_bench (20 min; adenosine −4, serotonin +2, stress −3; nature exposure — Bratman 2015 PMID 26124266 direction supported, magnitude chosen), walk_in_park (20–35 min; serotonin +2 nature premium; mood-branched prose analogous to go_for_walk; adenosine fog-clearing note; deterministic modifiers), leave_park (1 min; returns to street via world connection).
Also available here via global gate: go_for_run (location: null, gates to street or park; park surface note appended — deterministic), listen_to_music (location: null, gates to apartment area, park, street, or bus_stop; street/bus_stop get deterministic layer-3 modifier), sleep_outside (location: null, displaced + no staying_with + no shelter_bed + at park or street; 6h; quality 0.55× base; stress +20, NE +15, serotonin −8; temperature penalty 0.7× at cold/freezing; 2 RNG calls).

### Library (4)
use_computer (30 min; dopamine +2, NE −2, stress −2; public computers — no cost; mood-branched prose; deterministic modifier at high NE; approximation debt: wait times + availability hours not modeled), read_at_library (45 min; stress −4, NE −2, serotonin +1.5; public focused silence — different from read_book; weather-aware; mood-branched prose), rest_at_library (20 min; adenosine −3, stress −2, serotonin +1; available when exhausted/depleted energy or strained/overwhelmed stress; the library as refuge — free warmth, no purchase required; financial-anxiety-aware prose; appearance wired: severe → serotonin −1.5 + prose suffix, notable → no effect — library accepts everyone), leave_library (1 min; returns to street via world connection).
Also available here via global gate: go_for_walk (location: null, gates to street or library; walking outside from the library goes to street), listen_to_music (location: null; headphones implied — same effects, library quiet captures the context).
Connected to: street (10 min). Sensory source: library_ambient (sound; salience 0.30; habituationTau 30; busy 10am–6pm; GABA-low raises salience as hush breaks into components; lexical set in realization.js; chromesthesia palette: pale blues).

### Bus Stop (3)
wait_for_bus, find_public_restroom_bus_stop (available at urgent/pressing only; ~20% find something close enough without missing the bus), check_phone_bus.
Also available here via global gate: listen_to_music (deterministic layer-3 modifier: "Tinny sound through earbuds. The wait becomes bearable.").
Recognition tiers: `bus_stop_visits` tracked on each arrival in world.js. `locationVisitTier('bus_stop')` → stranger (<5) / familiar (5–20) / regular (>20). Familiar: same few people register. Regular: travel-mug woman, unspoken acknowledgment + serotonin +1. Deterministic (no RNG) in location description.

### Workplace (9)
do_work, work_break, talk_to_coworker, check_phone_work, eat_at_work (food_service only, once per shift, hunger >= hungry), graze_break_room (office only, once per shift), get_coffee_work (caffeine not high, work hours), slow_period (isWorkHours() + not gig; 20 min; 4 activities: fill_tasks/phone_break/zone_out/daydream — weighted by NT state; job-type prose branches; ADHD/autism layer-3 modifiers), take_lunch_break (isWorkHours() + not gig + once per wake period; 30 min; 3 activities: eat_alone/eat_with_coworker/step_outside — weighted by social_energy/serotonin; job-type prose branches; autism/ADHD/social-energy-drained layer-3 modifiers)

### Workplace Bathroom (2)
use_toilet_work (available at aware+; voids bladder, −1 stress), decompress_work (always available; 5 min, −2 stress; refuge prose shaded by NE/GABA/stress)

### Corner Store (39)
buy_groceries (parameterized pantry restocking: enters browsing_store mode showing per-item buy interactions; accepts data.items string[] for replay; gates on pantry_slots having low items + can afford cheapest; EBT fallback; recognition/appearance/autism suffixes), done_shopping (exits browsing_store mode), buy_cheap_meal, buy_groceries_staples (browsing_store mode; canAfford(8); adds +1 of first 3 character staples from food_profile; $8 col-scaled), buy_eggs (browsing_store + pantry_slots; canAfford(2.50); adds eggs+2; sets last_egg_purchase), buy_bread (browsing_store + pantry_slots; canAfford(2.00); adds bread+3; sets last_bread_purchase), buy_beans (browsing_store + pantry_slots; canAfford(1.50); adds beans+2; vegan-aware prose), buy_oats (browsing_store + pantry_slots; canAfford(3.00); adds oats+3), buy_potatoes (browsing_store + pantry_slots; canAfford(3.50); adds potatoes+2), buy_peanut_butter (browsing_store + pantry_slots; canAfford(3.50); adds peanut_butter+1, resets uses to 10), buy_ramen (browsing_store + pantry_slots; canAfford(1.00); adds ramen+3; money-tier-aware prose), buy_pasta (browsing_store + pantry_slots; canAfford(2.50); adds pasta+2), buy_rice (browsing_store + pantry_slots; canAfford(3.00); adds rice+2), buy_canned (browsing_store + pantry_slots; canAfford(2.00); adds canned+2), buy_vegetables (browsing_store + pantry_slots; canAfford(3.00); adds vegetables+2), buy_flour (browsing_store + pantry_slots; canAfford(3.00); adds flour+2), buy_tortillas (browsing_store + pantry_slots; canAfford(2.50); adds tortillas+3), buy_noodles (browsing_store + pantry_slots; canAfford(2.50); adds noodles+2), buy_tofu (browsing_store + pantry_slots; canAfford(3.50); adds tofu+2), buy_canned_tuna (browsing_store + pantry_slots; canAfford(2.00); adds canned_tuna+2), buy_oil (browsing_store + pantry_slots; canAfford(4.00); adds oil+1, resets oil_uses to 10), buy_soy_sauce (browsing_store + pantry_slots; canAfford(3.00); adds soy_sauce+1), buy_hot_sauce (browsing_store + pantry_slots; canAfford(2.50); adds hot_sauce+1), buy_spices (browsing_store + pantry_slots; canAfford(3.50); adds spices+1), buy_snacks (impulse buy; !browsing_store; canAfford(2.00); $2–4 col-scaled; eaten immediately — hunger -15, stomach +20, dopamine +5; habituates eating comfort sentiment; NT-aware: low serotonin → body-steered prose), buy_snacks_for_later (!browsing_store; canAfford(3.00); $3–5 col-scaled; restocks pantry.snacks +2; capped at snacks<4; money-tier-aware prose), browse_store (!browsing_store), buy_medicine (illness not healthy + canAfford(9), once per wake period), buy_coffee_store (caffeine not high + canAfford), buy_scratch_ticket, buy_moisturizer (skin not healthy + canAfford(4)), buy_pain_reliever (canAfford(5); refills pain_reliever_count 24–50 tablets), buy_umbrella (!has_umbrella + canAfford(10); durable item; gates richer rain prose), buy_period_supplies (hasUterus() + canAfford(8); refills period_supply_count 10–20 units; clears needs_period_supplies flag if set), buy_cigarettes (isSmoker() + canAfford; pack of 20; withdrawal-aware prose), buy_alcohol (canAfford(4); 1 unit/purchase; $4–8; withdrawal-aware prose), buy_cannabis (canAfford(8); 1 unit/purchase; $8–18; withdrawal-aware prose; approximation debt on jurisdiction), buy_makeup (wears_makeup + canAfford(12); +30 uses; $12 col-scaled; 1 RNG call), use_toilet_corner_store (available at aware+; ~12% unavailable — out of order / key missing; key-on-wooden-plank texture).
Browsing store mode: `buy_groceries` sets `browsing_store` flag. While active, only `buy_*` and `done_shopping` interactions appear at corner_store (filtered in `getAvailableInteractions`). Non-shopping interactions suppressed. Moving away from corner_store clears the flag (world.js).
CORNER_STORE_ITEMS price table in content.js: 20 items with base prices ($1.00–$4.00) scaled by `cornerStorePrice()` cost-of-living multiplier. All prices tagged as approximation debt (grocery prices).
Recognition tiers: `corner_store_visits` tracked on each arrival in world.js. `locationVisitTier('corner_store')` → stranger (<5) / familiar (5–20) / regular (>20). Familiar/regular add deterministic cashier-recognition prose in location description + buy_groceries + buy_cheap_meal. Regular tier: serotonin +2 on purchase. Thresholds are approximation debt (reputation).

### Soup Kitchen / Community Meal (2)
get_meal (weekdays 11am–2pm, once per day). First-visit prose distinct from repeat. Lifetime visit count shapes ongoing descriptions. 8 min from street.
Recognition tiers: `soup_kitchen_visits` / `locationVisitTier('soup_kitchen')`. Familiar: volunteer recognizes face, no warmth implied. Regular: nothing needs explaining. Tone: having needed it repeatedly, not a comfort. Deterministic suffix in get_meal (layer 3).
use_toilet_soup_kitchen (available at aware+; prose uses visit count for familiarity).

### Food Bank (2)
receive_bag (weekdays 9am–5pm, once per 7 game days). Stocks fridge +3 and pantry +2. 40 min. First-visit prose distinct. lifetime visits counter. 12 min from street.
Recognition tiers: `food_bank_visits` / `locationVisitTier('food_bank')`. Familiar: volunteer reaches for clipboard. Regular: paperwork goes faster. No sentimentality. Deterministic suffix in receive_bag (layer 3).
use_toilet_food_bank (available at aware+).

### Gym (5)
cardio (!depleted; 30–60 min; 1 RNG call for duration; serotonin +4, dopamine +3, endorphin +5, cortisol −4, NE +2; stress −6; gym_checkins_this_week++; 1 RNG call prose), lift_weights (!depleted; 45–60 min; 1 RNG call for duration; endorphin +8, dopamine +2, NE +3, cortisol −2; stress −4; gym_checkins_this_week++; 1 RNG call prose), use_gym_shower (always; 12 min; hygiene→95; GABA +2, cortisol −4, NE −2; stress −5; 1 RNG call), cancel_gym_membership (always; 10 min; sets gym_membership=false; 1 RNG call). All NT adjustments tagged `// Approximation debt (exercise)`.
State: `gym_membership` (bool; set by join_gym / applyToState), `gym_membership_cost` ($/month; derived from economic_origin at chargen), `gym_checkins_this_week` (counter; resets at wakeUp when day % 7 === 0), `gym_bill_day_offset` (monthly billing offset), `last_gym_bill_day` (guard).
Chargen: 1 charRng call (membership probability by origin: precarious 8%, modest 20%, comfortable 38%, secure 52%). Cost derived deterministically from origin: precarious $15, modest $30, comfortable $45, secure $65. 1 charRng call for billing offset.
Financial cycle: gym bill deducted monthly via deductBill('gym', gym_membership_cost) in generateIncomingMessages when gym_membership=true.
Connected to: street (20 min).

### Friend's Apartment (4)
hang_out_with_friend (always available; 45 min; social +12, connection_depth +4, social_energy cost varies by introversion Math.max(8, 20 − introversion × 0.15); serotonin +3, dopamine +2; updates friend_contact timer for primaryFriendSlot, reduces guilt −0.04; flavor-aware prose for all 6 flavors; layer-3 deterministic deep-tier suffix at connection_depth > 70; 3 RNG calls), leave_friends (always available; 15 min; moves to street; 1 RNG call), ask_to_stay_over (displaced + couch_available + connectionDepthTier not hollow + !staying_with; 5 min; sets staying_with='friend', couch_days=0; connection_depth −5, serotonin +5, stress −15; flavor-aware prose all 6 flavors; 2 RNG calls), sleep_on_couch (staying_with='friend' + displaced; 8h; quality 0.90× base; stress −12; increments couch_days; couch_strain at day 5; ejected at day 10 with connection_depth −15 + couch_available=false; strain suffix deterministic; 2 RNG calls).
Sensory source: friends_ambient (sound; salience 0.40; habituationTau 20 — slower than home, still novel; GABA-low raises salience; lexical set in realization.js; chromesthesia palette: pale amber).
Connected to: street (15 min).

### Family Visit (3, apartment, while family_visit_active)
talk_to_family_visit (family_visit_active + apartment area; 30 min; archetype-branched: warm_caring social +10, serotonin +4, cortisol −2, −10 social_energy; performance_watching social +4, cortisol +3, GABA −2, −18 social_energy; checked_out social +2, serotonin −1, −8 social_energy; 1 RNG call), make_tea_for_visit (family_visit_active + kitchen; 10 min; warmth sentiment +0.02, serotonin +2, social +3; archetype-branched prose; 1 RNG call), endure_visit (family_visit_active + apartment area + family_dread > 0.3 OR performance_watching OR socialEnergyTier=drained; 30 min; stress +5, cortisol +4, GABA −3, −12 social_energy; dread/archetype/energy-branched prose; 1 RNG call).

### Family Housing (3, emergency displacement)
ask_to_stay_with_family (displaced + !staying_with + family_type not absent/hostile + family_dread ≤ 0.7 + phone_service; 10 min; sets staying_with='family', family_stay_days=0; serotonin +3, stress −12, family_guilt +0.06; archetype-branched prose: warm_caring/performance_watching/checked_out; 1 RNG call), sleep_at_family (staying_with='family' + displaced; quality 0.93× base; stress −10 + constant +3 autonomy stress; family_stay_days++; strain at day 7; ejected at day 14 with guilt +0.15 + stress +10; archetype-branched ejection prose; 2 RNG calls), leave_family_housing (staying_with='family' + displaced; 5 min; clears staying_with; 1 RNG call).
State: `family_visit_pending` (bool), `family_visit_active` (bool), `family_stay_days` (int), `family_stay_strain` (bool). Visit scheduling: ~1 per 14–30 game-days modulated by family closeness (supportive 14d, conditional 21d, distant 30d). Announced via phone message 3–7 days ahead. Visit lasts 4–8 hours (interrupt-scheduled). Visit ends on time expiry or player leaving apartment. Housing displacement gates: absent/hostile family → no option; family_dread > 0.7 → no option. Displacement prose acknowledges family safety net presence/absence.

### Shelter (3)
check_in_shelter (!shelter_bed + displaced; 20 min; 60% bed success — stress −8 + shelter_bed=true + staying_with='shelter'; 40% turned away — stress +5, NE +6, serotonin −3; 2 RNG calls), sleep_at_shelter (shelter_bed + displaced; 8h; quality 0.85× base; stress −10; clears shelter_bed after sleep — must check in again each night; 2 RNG calls), leave_shelter (always available; 5 min; moves to street; 1 RNG call).
Connected to: street (10 min).

### Clinic (4)
check_in_clinic (not checked in + not clinic_ready; 5 min; cortisol +3, serotonin −1; schedules clinic_ready interrupt 45–89 min out; 2 RNG calls), wait_at_clinic (checked in + not clinic_ready; 10 min; energy −2; adjustSentiment routine/irritation +0.005; 2 RNG calls), see_doctor_clinic (checked in + clinic_ready OR 45+ min elapsed; 20 min; branches on health state — dental referral + dentist scheduled + dental_ache −25; antacid prescription for gastritis; HRT script for trans+hrt_active; pain_management note for chronic_pain > 40; illness prescription for illness_severity > 0.2; hEDS referral for heds=true; general serotonin +5 cortisol −8; 3 RNG calls unconditional), leave_clinic (always available; 15 min; clears check-in state, moves to street; 1 RNG call).
State: `clinic_last_visit` (game-minutes), `clinic_checkin_time` (null or game-minutes), `clinic_ready` (bool), `clinic_prescriptions` (string[]: 'antacid' | 'hrt' | 'dental_referral' | 'pain_management' | 'illness' | 'heds_referral').
Prescription effects: 'antacid' → gastritis_pain decays 0.1/hr faster in advanceTime(). 'hrt' → enables take_hrt (gated on medication_supply['hrt'] > 0) and fill_hrt_prescription interactions; fill sets medication_supply['hrt'] = 30; supply depletes in advanceTime at 1/day. 'dental_referral' → dentist appointment scheduled on interrupt queue. 'illness' → sets illness_medicated=true when filled at pharmacy (0.4× NT effect factor). 'heds_referral' → specialist referral documented.
Idle thoughts: dental + no dentist booked → "You keep meaning to do something about that tooth." (w5), + dental_ache > 40 → "You know where the free clinic is." (w6). Gastritis + no antacid → "The stomach thing has been going on long enough." (w4, pain > 40), "There's a clinic on Meridian. Maybe this week." (w5, pain > 50).
Connected to: street (15 min).

### Pharmacy (6)
browse_pharmacy (open 8am–9pm; 5 min; 1 cosmeticRng call), fill_prescription (open hours + has fillable prescription with no supply; 15–30 min; $15 per med fill; sets medication_supply 30 days; illness fill → illness_medicated=true; 2 RNG calls), fill_hrt_prescription (open hours + has HRT prescription; 10–20 min; $25; sets medication_supply['hrt'] = 30; 2 RNG calls), buy_otc_pharmacy (open hours; 5 min; $6 ibuprofen + $8 antacid as needed; OTC antacid adds to clinic_prescriptions; 2 RNG calls), pick_up_refill (open hours + medication_supply ≤ 5 for any rx; 10–20 min; $15 per refill; 2 RNG calls), leave_pharmacy (always available; 10 min; moves to street).
State: `pharmacy_last_fill` (game-minutes), `medication_supply` (Record<string, number> — days remaining per med; depletes 1/day in advanceTime), `illness_medicated` (bool — 0.4× illness NT effects when true; clears when illness supply runs out), `last_medication_time` (game-minutes — tracks last take_medication interaction; 0 = never). fill_prescription, pick_up_refill, and buy_otc_pharmacy (antacid) schedule `medication_reminder` interrupt at 9 AM daily.
Connected to: street (10 min). Open 8 AM – 9 PM daily.
Approximation debts: $15/fill, $30 HRT, $6 ibuprofen, $8 antacid — all healthcare costs are placeholders pending jurisdiction/insurance model.

### Emergency Room (4)
er_check_in (not checked in + not er_ready + illness_severity > 0.5 OR chronic_pain > 70 OR vasovagal_recovery > 50 OR dental abscess OR migraine_intensity > 70; 10 min; cortisol +8, NE +5, serotonin −2; schedules er_ready interrupt 60–179 min out; 2 RNG calls), wait_at_er (checked in + not er_ready; 15 min; energy −3, stress +2, routine irritation +0.008; 1 cosmeticRng call), er_treatment (checked in + er_ready OR 60+ min elapsed; 45 min; $200 — charges even if can't pay, financial anxiety +0.08 if can't; branches: illness → severity ×0.4 + medicated + nausea −40 + adenosine −15 + cortisol −10; dental abscess → ache ×0.3 + antibiotics + referral; chronic pain → level ×0.5 + NE −10 + cortisol −5 + energy +10; vasovagal → recovery ×0.3 + NE −5 + energy +15; migraine → intensity ×0.25 + NE −12 + cortisol −8; general → cortisol −8 + serotonin +3; 2 RNG calls unconditional), leave_er (always available; 25 min; clears check-in state, moves to street).
State: `er_checkin_time` (null or game-minutes), `er_ready` (bool), `er_last_visit` (game-minutes).
Connected to: street (25 min). Always open. ER ambient events (7% per tick).
Approximation debt (healthcare costs): $200 flat ER visit; real US ER costs $150–$3000+.

### Phone Mode (28, triggered from phone UI)
job_search (home screen only + phone_service + no interview scheduled + seeking OR at_risk/shaky job standing + not during work hours; 20 min; 2 RNG calls always; success probability by job tier: at_risk 90%, shaky 75%, adequate 60%, higher 40%; on success: schedules interview interrupt 2–4 days out via scheduleInterrupt('interview', ...) + cortisol +3 + dopamine +5; on failure: serotonin −1 + cortisol +1), read_family_message (family thread + family_unread > 0; NT effects by archetype: warm_caring serotonin +3 cortisol −1; performance_watching cortisol +4 GABA −3 NE +2; checked_out serotonin −1; critical NE +6 serotonin −4 cortisol +5; 2 RNG calls always; resets family_contact, family_unread=0, guilt −0.04), reply_to_family (family thread + no unread + has_messages + not critical/unreachable; NT by archetype: warm_caring serotonin +2 −6 social_energy; performance_watching cortisol −2 −15 social_energy; checked_out serotonin −1 −8 social_energy; +5 social; 8 min; 2 RNG calls always; guilt −0.05), call_family (family thread + phone_service + family_type not absent + archetype not unreachable + social_energy ≥ 20; 3 RNG calls always: answer probability, call quality by serotonin lerp01, balance; pre-call dread deterministic: cortisol >50 pause + spike for performance_watching/critical; no-answer outcomes: warm_caring guilt −0.01 serotonin −1; performance_watching/critical serotonin +2 cortisol −3 relief; checked_out flat; answered outcomes by archetype × quality: warm_caring+easy +18 social +10 connection_depth serotonin +6 cortisol −5 guilt −0.10; warm_caring+awkward +8 social +5 connection_depth serotonin +2 NE +3 guilt −0.04; performance_watching+easy +5 social cortisol −4 serotonin +2 guilt −0.06; performance_watching+awkward −3 social cortisol +8 NE +5 serotonin −3 guilt +0.02; checked_out+easy +4 social serotonin +1 guilt −0.03; checked_out+awkward −2 social serotonin −1; critical always: −5 social cortisol +10 NE +8 serotonin −4 guilt +0.05 −30 social_energy; NE >60 layer-3 replay suffix; autism surcharge −6 social_energy when answered + 3-tier deterministic suffix; ADHD suffix when performance_watching/critical + awkward; family_contact updated on warm_caring+easy, performance_watching+easy, checked_out both; NOT on critical or performance_watching+awkward), read_messages (backward-compat replay only), reply_to_friend, message_friend, reach_out_to_friend (low guilt + social not connected/warm + social_energy not drained; proactive affection reach-out, distinct from guilt-driven message_friend; same mechanics: 3 RNG, +2 social, +12 connection_depth, resets contact timer; separate prose tables `friendProactiveReachProse` / `friendProactiveReachMessages`), call_friend (phone_service + social_energy ≥ 15 + connectionDepthTier not hollow; 3 RNG calls: answer probability × depthTier + absenceTier penalty, call quality by serotonin lerp01, balance; outcomes: answered+easy → +22 social +14 connection_depth, 12 min, serotonin +5 dopamine +3, guilt −0.06; answered+awkward → +10 social +6 connection_depth, 12 min, serotonin +1 NE +4, guilt −0.03; voicemail → −4 social, 3 min, serotonin −2; no-answer → −6 social, 1 min, serotonin −3; autism surcharge −8 social_energy when answered + deterministic suffix; ADHD initiation friction −3 social_energy pre-call + awkward suffix; appearance avoidance same pattern as message_friend; flavor-deterministic prose: 6 archetypes × 4 outcomes), help_friend (friend sent in-need message + canAfford $10; flavor-deterministic amount $10–15; builds warmth +0.05), ask_for_help (broke/scraping + friend thread + 7-day cooldown; flavor base + warmth + repeat penalty probability; variable amount $10–40 via pending reply effect), toggle_phone_silent (home screen mute + status bar silent indicator), put_phone_away, watch_content (apartment locations only; 45 min; +2 social, no connection_depth; dopamine +5, adenosine −3; evening screen penalty −3 daylight_exposure; NT-shaded prose by connectionDepthTier + serotonin/dopamine/adenosine), open_notes_app (home screen only; switches to notes list), write_note (notes screen; parameterized — text recorded in action data; 0 RNG; +2 min), read_note (note_view screen; parameterized — index in action data; deterministic NT-shaded prose; 0 RNG), breathwork_app (apartment area only while on phone; 7–12 min; state-dependent GABA/cortisol/NE/serotonin NT nudges; app guidance provides scaffolding at high-NE/low-GABA states; puts phone away after; midSense('waiting')), open_alarm_app (home screen only; switches to alarm screen), cancel_alarm_app (alarm screen + alarm set; cancels interrupt; 0 RNG; +1 min), open_calendar_app (home screen only; switches to calendar screen; 7-day work schedule view with shift times or "off"; unknown shifts for on_demand/rotating shown as "—"), open_timer_app (home screen only; switches to timer screen), start_timer (timer screen + no timer running; parameterized — duration in action data; preset buttons: 5/10/20/30 min; sets timer_end_time; 0 RNG; +1 min), cancel_timer (timer screen + timer running; clears timer_end_time; 0 RNG; +1 min), schedule_dentist (home screen + phone_service + dental_pain condition + condition not sound + no dentist interrupt already booked; 5 min; 2 RNG calls; schedules dentist interrupt 3–7 days out; cortisol +5, serotonin +2; prose shaded by condition severity), open_gig_app (isGigWorker() + home screen only; 2 min; 1 RNG call; switches to gigs screen; lists available_gigs with pay/duration/distance; earningsSummary shows today's earnings and deliveries), accept_gig (isGigWorker() + gigs screen + available_gigs not empty + no gig_active; 1 min; 1 RNG call; sets gig_active to first available gig; clears available_gigs; cortisol +2, dopamine +3; acceptance prose), decline_gig (isGigWorker() + gigs screen + available_gigs not empty; 1 min; 1 RNG balance call; clears available_gigs; serotonin −1; low-money guilt prose when broke/scraping)

### Global (27, available outside phone mode based on own availability check)
wear_binder (binder_count > 0 + not wearing + apartment_bedroom/bathroom; 2 min; 3 RNG calls; sets binder_start_time; serotonin target +3 while wearing via serotoninTarget(); mood-shaded prose: low-ser anchor variant, clear-mood satisfaction variant), remove_binder (binder_start_time !== null + any apartment location; 1 min; 1 RNG call; clears binder_start_time; duration-shaded prose: >6h relief variant, <3h early variant, normal), take_hrt (trans + hrt_active + medication_supply['hrt'] > 0 + time since last dose ≥ 22h or never taken; 1 min; 1 RNG call; sets hrt_last_taken; NT effects via serotoninTarget/gabaTarget/norepinephrineTarget based on recency of dose — transfem: +5 ser/+3 GABA targets, transmasc: +3 NE target; missed doses −3 serotonin/−2 GABA per day capped at 9/6; mood-shaded prose 6 variants; low-serotonin variants surfacing what the dose does), take_medication (has non-HRT/non-referral prescription + supply > 0 + time since last dose ≥ 22h or never taken; 1 min; 1 cosmeticRng call; sets last_medication_time; per-medication-type prose: pain_management NE −2 cortisol −1, antacid serotonin +1, illness reinforces illness_medicated; NT-shaded 4 variants per type; medication_reminder interrupt fires daily at 9 AM when supply exists), accept_job_offer (interview_outcome === 'offer'; 5 min; 1 RNG call; job_standing reset to 50, job_seeking=false, interview_outcome=null; dopamine +8, serotonin +6, cortisol −8; mood-shaded prose; available anywhere), decline_job_offer (interview_outcome === 'offer'; 2 min; 1 RNG call; interview_outcome=null, job_seeking=true; serotonin +2, cortisol +3; available anywhere), call_in (call in sick — morning only, work hours), smoke_cigarette (isSmoker() + has_cigarettes > 0; available at any area=outside location + workplace during work hours; 5–10 min; burns 1 cigarette; work break gets −3 stress; withdrawal-relief prose vs. legitimized-absence prose; relapse detection: if quit_attempt=nicotine → quit_attempt=null, cortisol +8, serotonin −4, relapse prose), breathwork_unguided (area=apartment only, not in phone mode; 5–10 min; state-dependent GABA/cortisol/NE/serotonin NT nudges; effectiveness reduced 30% at high NE or low GABA, 50% when depleted/adenosine-heavy; ADHD/autism layer-3; midSense('waiting')), yoga_home (area=apartment only, not in phone mode, not depleted; 20–30 min; parasympathetic: GABA +8, cortisol −10, NE −6, serotonin +5; no adenosine accumulation; effectMult reduced at high NE/low GABA or depleted/adenosine-heavy; Streeter 2010 PMID 20834562), listen_to_music (area=apartment or location=park/street/bus_stop, not in phone mode; 20 min; serotonin +3×freshness, dopamine +4×freshness, NE +2×freshness upbeat / −1 background by energy tier; music satiation sentiment (+0.08 per listen, sleep-recoverable) scales NT effects via freshness=(1−satiation); quiet-comfort sentiment habituates; NT-shaded prose; street/bus_stop: deterministic layer-3 modifier appended; Salimpoor 2011 PMID 21270915 direction), go_for_run (location=street or park, not depleted/exhausted/overwhelmed/severe-migraine; eCB + NE spike + GABA/serotonin afterglow; park: deterministic surface note appended), read_book (bedroom or kitchen only, not in phone mode; 30 min; NE −2, stress −3, adenosine −5 when absorbed / −2 when glazing; absorption gated on dopamine ≥ 40 + adenosine < 70; NT-shaded prose: adenosine-high glazing, dopamine-low going through motions, NE-balanced absorption), write_in_journal (bedroom, kitchen, friends_apartment, library; not in phone mode; adenosine ≤ 75; 25 min; 3 RNG calls always; NT-aware tone selection: venting/processing/dreaming/observing weighted by cortisol/serotonin/dopamine; sets last_journaled timestamp; per-tone NT effects — venting: cortisol −10 NE −5 serotonin +3; processing: serotonin +6 cortisol −6; dreaming: dopamine +5 serotonin +4; observing: NE −3 adenosine −5 serotonin +2; all tones: routine comfort sentiment +0.003; deterministic layer-3 modifiers for autism/adhd/trans; journal content never shown — act is visible, content isn't; Pennebaker 1997 PMID 9109876 direction supported, magnitudes chosen; state: last_journaled; idle thoughts: 4 variants gated on last_journaled + cortisol + dopamine), scroll_phone (bedroom or kitchen only; has_phone + not dead battery + phone_service; 15 min; dopamine +3 then −4 net negative; adenosine −2; social +1 hollow; connection_depth NOT raised; evening screen penalty; NT-shaded prose: dopamine-low seeking, GABA-low can't-put-it-down, adenosine-high fog; Twenge 2018 PMID 29279200 direction), pay_bill_rent (pending_bills has rent entry + canAfford rent; no RNG; pays bill and clears queue), skip_bill_rent (pending_bills has rent entry; no RNG; applies failure consequences: +8 stress, +0.03 financial_anxiety, phone notification), pay_bill_utilities (pending_bills has utilities entry + canAfford utilities; no RNG), skip_bill_utilities (pending_bills has utilities entry; no RNG), pay_bill_phone (pending_bills has phone entry + canAfford phone bill; no RNG), skip_bill_phone (pending_bills has phone entry; no RNG), decide_to_quit_smoking (isSmoker() || nicotine_habit > 0.2; not already quit_attempt=nicotine; not mid-severe-withdrawal; 2 min; 1 RNG call; sets quit_attempt=nicotine + quit_attempt_start; cortisol +5, dopamine +4; NT-shaded quit prose), decide_to_quit_drinking (alcohol_tolerance > 0.2 + withdrawal > 10; not already quit_attempt=alcohol; not dangerous withdrawal tier; 2 min; 1 RNG call; DT risk note when tolerance > 60 — deterministic; cortisol +5, dopamine +4), decide_to_quit_cannabis (cannabis_tolerance > 0.3; not already quit_attempt=cannabis; 2 min; 1 RNG call; cortisol +5, dopamine +4), go_to_meeting (quit_attempt !== null + any withdrawal > 20; once per 23 hours; 90 min; 2 RNG calls; serotonin +5, cortisol −8, craving_intensity −20, social +8, connection_depth +2; folding-chairs/community prose; ADHD/autism layer-3), pay_bill_gym (pending_bills has gym entry + canAfford; no RNG; pays bill and retains membership), skip_bill_gym (pending_bills has gym entry; no RNG; gym_membership=false — auto-cancelled via failBill('gym'))

### Dynamic item interactions (up to 14, generated by items.js)
`grab_[type]` — pick up a portable item from a spot in the current apartment room → on_person. Available when item is at a spot in the room and not already on_person. Low accessibility → 2–3 min search time. Types: phone, cigarettes, keys, umbrella, pain_reliever, period_supplies, binder.
`put_down_[type]` — set a carried portable item at the room's default spot. Available when item is on_person and player is in an apartment room. +0.01 disorder. Same 7 types.

## Events (24 types)

- **dentist_appointment** — fires from scheduled interrupt queue when dentist interrupt triggerAt passes. Scheduled by `schedule_dentist` 3–7 game-days out. 3 RNG calls (unconditional). Checks affordability ($120 base; free for precarious economic origin). Can't afford path: stress +5, cortisol +8, serotonin −3, condition continues. Treatment path: condition resolves (abscess→inflamed, others→sound); dental_last_treated updated; serotonin +6, NE −5, cortisol −10. `cancelInterrupt('dentist')` called inside event so `schedule_dentist` becomes available again. Time cost 60 min. Approximation debt (dental): $120 cost, free-clinic path — no jurisdiction or insurance model.
- **tooth_extraction** — fires from interrupt queue after 30 game-days at `abscess` tier untreated. `dental_abscess_onset` tracks when abscess was established (set on `infected→abscess` transition); extraction scheduled 30 min in future. 2 RNG calls (prose + balance). State: `dental_condition→'sound'`, `teeth_lost++`, `dental_ache→75`, `dental_abscess_onset→0`, injury record `('tooth_extraction', 0.4, 'untreated_abscess')`. NT: serotonin −4, cortisol −8, NE +5. Time cost 90 min. Approximation debt (dental): 30-day threshold and severity chosen.
- **interview** — fires from scheduled interrupt queue when `triggerAt` passes. Scheduled by `job_search` 2–4 game-days out. 3 RNG calls (unconditional). Performance multiplier from `appearanceAwareness()` + `energyTier()` + `stressTier()`. Outcome: `offer` (35% × perf), `callback` (additional 25%), `rejection` (remainder). Sets `interview_outcome` for `accept_job_offer` / `decline_job_offer` interactions. `job_seeking` cleared. Time cost 45 min. NT effects: offer → dopamine +12, serotonin +8, cortisol −10; callback → dopamine +4, cortisol −3; rejection → cortisol +8, serotonin −5.
- **alarm** — fires at alarm_time in bedroom
- **medication_reminder** — fires from scheduled interrupt queue daily at 9 AM when character has active prescriptions with supply > 0 and hasn't taken medication in 22+ hours. Deterministic: no RNG. Scheduled by fill_prescription, pick_up_refill, buy_otc_pharmacy (antacid), see_doctor_clinic (illness), er_treatment (illness). Reschedules daily; cancels when all supply runs out. Gentle prose nudge; does not force action. State: `last_medication_time` (game-minutes).
- **late_anxiety** — stress when late for work; fires once per tier crossing (fine→late→very_late); deterministic, no RNG; tracked via `late_anxiety_noticed { tier }` event log entries scoped to `wake_period_start`
- **hunger_pang** — fires once per tier crossing (hungry → very_hungry → starving); deterministic, no RNG; resets on eating
- **thirst_pang** — fires once per tier crossing (thirsty → very_thirsty → parched); deterministic, no RNG; resets on drinking
- **bladder_pang** — fires once per tier crossing (aware → urgent → pressing); deterministic, no RNG; resets on voiding
- **exhaustion_wave** — fires once per tier crossing (exhausted → depleted); deterministic, no RNG; resets on energy recovery
- **weather_shift** — random weather change
- **coworker_speaks** — samples coworker, uses chatter table
- **coworker_notices_absence** — fires when ≥2 calendar days since last coworker interaction, warmth > 0.25 on at least one coworker, and ≥3 days since last `coworker_notices` event. Deterministic: no RNG in trigger; 2 RNG calls in event handler (slot pick + prose pick). +2 social, +1 connection_depth, +3 serotonin, +0.01 warmth sentiment.
- **coworker_notices_stress** — fires when player is strained/overwhelmed at work, warmth > 0.25, and ≥1 day since last `coworker_notices` event. Independent from absence trigger. Same NT effects. Mutually exclusive with absence on the same `checkEvents()` call (absence takes priority).
- **coworker_argument** — two coworkers in conflict, player overhears. Fires at most once per calendar day (shared `coworker_drama` cooldown), gated on `job_standing < 40`. ~15% daily probability. 2 RNG calls (chance + prose). Effects: NE +3, cortisol +2. Flavor-agnostic — player not involved.
- **coworker_good_news** — someone celebrating something. Fires at most once per calendar day (shared drama cooldown), unconditional. ~10% daily probability. 2 RNG calls. Effect: serotonin +1.5.
- **coworker_overwhelmed** — a coworker visibly struggling. Fires at most once per calendar day (shared drama cooldown), gated on player stress tier being strained/overwhelmed. ~12% daily probability. 2 RNG calls. Effects: serotonin −1.5, NE +2.
- **coworker_management_tension** — management visible in the space. Fires at most once per calendar day (shared drama cooldown), unconditional. ~8% daily probability. 2 RNG calls. Effects: cortisol +3, GABA −2.
- **clock_in** — fires from checkEvents() on first checkEvents() call after `arrived_at_work` is recorded for this wake period, for non-gig workers. Deterministic trigger (no RNG in world.js). 1 RNG call in eventText handler. Job-type-specific action (clock/badge/log in); late branch, depleted branch, normal branch. Clock-out texture added as deterministic prefix to the workplace→bus_stop transition prose.
- **work_task_appears** — job-specific
- **break_room_noise** — job-specific ambient
- **apartment_sound** — pipes, fridge, footsteps
- **apartment_notice** — mess awareness; fires on tier worsening (tidy→cluttered→messy→chaotic); deterministic, no RNG; tracked via `apartment_notice_surfaced { tier }` + `apartment_cleaned` event log entries scoped to `wake_period_start`
- **street_ambient** — cars, buses, sirens
- **er_ambient** — ER waiting room ambient: machines beeping, other patients, intercom pages, fluorescent lights. 7% chance per checkEvents when at ER location. 1 RNG call. NT-shaded by NE (intercom sharpness) and adenosine (time-distortion).
- **someone_passes** — people on street
- **bill_due_rent / bill_due_utilities / bill_due_phone** — fires once per bill when a bill is due and insufficient funds prevent auto-payment. Deterministic, no RNG. Sets `notified: true` on the `pending_bills` entry to prevent re-fire. Event text surfaces the situation ("Rent is due. You have $X. Not enough.") with mood-shaded suffix; `observeMoney()` called. Corresponding `pay_bill_*` / `skip_bill_*` interactions remain in the action list until resolved.
- **vomit** — fires when `pending_vomit` flag is set. Set probabilistically in `advanceTime()` with etiology-split curves: illness (severity > 0.1 + nausea > 40) → rate 0–0.75/hr scaling with nausea and illness_severity (5-HT3 vagal pathway); non-illness (nausea > 75) → rate 0–0.2/hr scaling 75–100. Deterministic fire in `checkEvents()`, no RNG at fire site. Branches: `stomachTier()` empty → dry heave (−8 energy, +6 stress, −8 nausea); else → expulsion (stomach_fullness −75, ate_today cleared, −5 energy, +4 stress, −25 nausea). Location-aware: bathroom vs. not. NT-shaded prose: adenosine (fog/dissociation), NE (crisis sharpness), GABA (loss of control). `wakeUp()` clears stale flag.
- **displacement** — fires once when `eviction_risk` reaches 100 and `displaced` flag is set. `failBill('rent')` in state.js sets `displaced: true`; `checkEvents()` in world.js detects first occurrence (gated on no prior `displacement_surfaced` log entry), records `displacement_surfaced {}`, and pushes event. Deterministic, no RNG. Effects: stress +20, serotonin −8, dopamine −6, NE +10, money anxiety +0.15. Prose: the notice, the lock change, the fact of it. Routing awareness varies by family type: supportive/conditional → names family member as option; hostile/high-dread → "Not them"; distant/absent → "The list isn't long."
- **family_visit** — fires from scheduled interrupt queue when `family_visit` interrupt triggerAt passes. Scheduled by `generateIncomingMessages()` 3–7 game-days out when family closeness triggers. Deterministic, no RNG consumed. Sets `family_visit_active=true`, `family_visit_pending=false`. Mess tier shapes visit texture: messy/filthy → family dread +0.03, cortisol +5; tidy → family warmth +0.02. Archetype-branched prose. Resets family_contact, reduces family_guilt −0.08.
- **family_visit_end** — fires deterministically when `family_visit_end` interrupt triggerAt passes OR player leaves apartment area while visit is active. Sets `family_visit_active=false`, cancels interrupt. Archetype-branched post-visit effects: warm_caring social +8, serotonin +4, cortisol −3; performance_watching social +3, cortisol −4; checked_out social +2, serotonin −1. Records `family_visit_ended` event.

## Content

### Jobs (3)
**office** — 9am–5pm, 4 tasks expected, cubicle/open-plan prose
**retail** — 10am–6pm, 5 tasks expected, floor/register/stockroom prose
**food_service** — 7am–3pm, 6 tasks expected, kitchen/counter prose

Each has: workplace description (dynamic), do_work prose (6 variants), work_break prose (3 variants), work_task event text, ambient event text.

### Relationships
**Friends (2 per character, 4 flavors):** sends_things, checks_in, dry_humor, earnest. Each has normal messages, isolated messages, idle thoughts.

**Coworkers (2 per character, 3 flavors):** warm_quiet, mundane_talker, stressed_out. Each has chatter, interaction, notices-absence, and notices-stress prose. Notices events fire from `checkEvents()` based on silence duration (absence) or stress tier (stress-noticing); warmth threshold gates both.

**Supervisor (1):** named, referenced in work prose.

### Idle Thoughts
Dynamic generation based on mood (8 categories × ~7 general variants + 2–4 NT-weighted variants each), hunger (starving/very_hungry), energy (depleted), social isolation (friend-specific thoughts), connection depth (surface/hollow: 6 variants, the gap between parasocial warmth and genuine contact), day-of-week (Saturday texture, Sunday weight/dread/evening anticipation), hygiene (grimy/stale), clothing cleanliness (dirty/stale), appearance composite (severe: compound grimy+dirty awareness; notable+severe at home evening with work tomorrow: anticipatory dread), HRT supply (out: w10/w8 pharmacy nudge; low ≤5 days: w6/w5 refill awareness). NT values (serotonin, dopamine, NE, GABA, adenosine, cortisol) continuously weight variant selection via `State.lerp01()` and `Timeline.weightedPick()`. Recency tracking avoids repeats.

**Personality shading (Layer 3 — deterministic, no RNG):** Three modifiers applied in `idleThoughts()` from personality params in state. (1) Neuroticism: at neuroticism > 65 + NE > 55, adds anxious ambient-interpretation pool entries (4 variants, weighted by `lerp01(neuroticism,65,90) × lerp01(NE,55,80)`). Background threat-appraisal hum. (2) Rumination: at rumination > 60, adds looping-theme pool entries for active money anxiety, work dread, or social isolation (weighted by `lerp01(rumination,60,90)`). Post-selection: appends deterministic " Still." / " Again." / " You've been here before." to ~1/3 of recurring-theme thoughts (picked.length % 3 === 0). (3) Self-esteem: at self_esteem < 35, appends self-referential suffix to ~half of work/isolation thoughts (picked.length % 2 === 1). At most one post-selection modifier per thought.

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

**Source library (38 sources):** Indoor acoustic (fridge, pipes, electronic_whine, traffic_through_walls), indoor thermal (indoor_temperature), indoor visual (window_light), **indoor smell (stale_air, dishes_smell, cleaning_smell, coffee_smell, food_smell)**, bathroom acoustic (bathroom_echo), interoceptive (fatigue, hunger_signal, anxiety_signal, stress_signal, caffeine_signal), outdoor acoustic (traffic_outdoor, street_voices), **park acoustic (park_ambient — birds, leaves, distant children, dogs; location-specific to 'park'; season/time-aware)**, outdoor thermal (outdoor_temperature, wind), outdoor rain (rain), **outdoor smell (petrichor, cold_air_smell, seasonal_outside_smell)**, work acoustic (workplace_hvac, fluorescent_lights, coworker_background), **work smell (office_ambient_smell)**, **block characters (neighbor_presence)**, **shelter (shelter_ambient — shared space sound, NE-driven hypervigilance; shelter_smell — institutional cleaning + bodies, habituationTau 10; shelter_social — people-sounds, coughing, shifting, careful shared-space choreography, NE/social-energy driven)**, **gym (gym_ambient — equipment clangs, music, mirrors, peak-hour busy flag; gym_exertion_body — interoceptive, available when endorphin elevated; gym_smell — rubber, cleaning products, sweat, habituationTau 10)**.

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
- `getSalienceThreshold(hint)` — NT-state-driven perceptual threshold. overwhelmed=0.25, anxious=0.30, heightened=0.40, calm=0.50, flat=0.55, dissociated=0.60. Sensory overload raises threshold: overloaded +0.15, shutdown +0.30 (protective perceptual narrowing). All observations above threshold fire; those below don't register.
- `habituationFactor()` — `floor + (1−floor) × exp(−minutesAtLocation / 40)`. Starts at 1.0 on arrival. Floor is familiarity-derived: `0.15 + 0.25 × (1−familiarity)`. Unfamiliar places floor at 0.40; deeply familiar places (apartment after long play) floor toward 0.15. Per-location familiarity accumulates in `state.location_familiarity` via saturating exponential (τ=4320 min, ~50h cumulative → familiarity≈0.5) in `advanceTime()`; persists across sessions within the same run. Legacy saves default to empty map (all locations start unfamiliar).
- `getChangeSalience()` — orienting response. `changeTracker` map fingerprints each source's discrete state (string/boolean properties only; numerics excluded). When a source's tier/quality/condition label changes: spike = 0.4, decays with 12-min time constant. First observation establishes baseline (no spike). Effective salience = `(raw_salience × habituationFactor()) + change_spike`. A source below threshold can surface if it just changed state.
- `realize()` takes whatever observations the caller passes and realizes all of them. Selection is the caller's responsibility.

**Wired to game loop** — three contexts:
- **Idle** — `sense()`: filters by `getSalienceThreshold(hint)` after habituation, then realizes all above threshold. 12-min cooldown. Fires in `handleIdle`.
- **Arrival** — `arrivalSense()`: same threshold + habituation, but habituation = 1.0 (just arrived). No cooldown. Fires in `handleMove` after `transitionText`, before events. Arrival text prepended to event display queue so it appears first. RNG consumption matched in `replayMove` and `executeActionForReplay`.
- **Mid-interaction** — `midSense(hint)`: same pipeline as `sense()`, slightly higher threshold for 'doing' (+0.08, capped at 0.75) to reflect attention being partially occupied. 'waiting' and 'moving' keep the base threshold. No cooldown — called unconditionally from interaction execute handlers (not UI-gated). Called in 13 atmospheric interactions: `lie_there` (waiting), `look_out_window` (waiting), `sit_on_couch` (waiting), `make_coffee` (waiting), `cook_pasta` (waiting), `cook_rice` (waiting), `do_dishes` (doing), `sit_at_table` (waiting), `yoga_home` (doing), `wait_for_bus` (waiting), `take_bath` (waiting), `breathwork_unguided` (waiting), `breathwork_app` (waiting). Returns string or null; non-null result appended to interaction prose with `\n\n` separator. RNG automatically replayed because execute() is called during replay.

Observation pipeline is the live path. Fragment library and `composeFragments` removed.

### Sleep Prose
Two-phase system: falling-asleep (how sleep came) + waking-up (the gradient back to consciousness). Falling-asleep branches on pre-sleep energy, stress, quality, duration, and fall-asleep delay, with NT shading: adenosine→crash depth / heavy-dissociated insomnia, GABA→can't-settle anxiety, NE→hyper-alertness / scanning insomnia, serotonin→warmth of surrender / 3am-dread insomnia, cortisol→body-tension insomnia, melatonin→onset delay (~30 variants). Insomnia branch fires when fall-asleep delay ≥20 min (stress-driven prolonged onset) — 8 variants covering lying-awake textures without labeling the condition. Waking-up branches on post-sleep energy, sleep quality, alarm vs natural wake, time of day (dark/late/morning), mood, sleep debt, and sleep inertia, with NT shading: adenosine→sleep inertia, serotonin→dread-vs-ease, NE→sharp edges, GABA→night dread, debt→cumulative exhaustion (~44 variants). Composed together as a single passage. No numeric hour counts — all qualitative.

Dream fragments appended to waking prose when `remFrac` > 0.10 and quality is not poor. 1 RNG call (weightedPick); falls through to null on most wakes — irregularity is authentic. NT-shaded: serotonin→warm dissolving vs dread-toned residue, NE→fragments more accessible but anxious-textured, adenosine→deep-blank (so much slow-wave recovery nothing surfaced). REM rebound pool (vivid, disorienting, harder to shake) fires when `rem_rebound_pending` is set — last night had cannabis or alcohol REM suppression, brain over-corrects on recovery sleep. `rem_rebound_pending` set in `processSleepEnd()`, read by content.js before it is overwritten for the next cycle (~19 variants total across all pools).

### Alarm Negotiation Prose
Snooze and dismiss interactions with escalating prose. Snooze has three tiers: first press (fog, 4 variants), second press (negotiation, 3 variants), third+ (guilt, 4 variants). All NT-shaded (adenosine, serotonin). Dismiss varies by snooze count (0 = immediate, 1-2 = typical, 3+ = running late) and mood/energy. Slept-through-alarm awareness adds to waking prose when alarm fired but didn't wake you.

### Outfit Prose
Generated dynamically by `clothing.js outfitDescription()` — describes currently worn items with fit notes. Driven by the per-item wardrobe; no fixed outfit sets. Sleepwear is an authored 6-option selection from chargen.

## Character Generation

Single-screen UI with:
- Job dropdown (3 options)
- Age input (numeric, default random 22–48)
- Location dropdown (6 options: tropical NH/SH, temperate NH/SH, cold NH/SH)
- Season dropdown (dynamic based on location's climate zone)
- Sleepwear dropdown (6 options)
- Wardrobe aesthetic dropdown (7 options: comfy, dark_academia, streetwear, alt, pastel, classic, workwear) — changing aesthetic swaps item names deterministically (no RNG consumed)
- Wardrobe: generated per-item by `generateWardrobe()` (8–24 items, sized by economic_origin; 3 charRng calls per item), item names from per-aesthetic pools
- Friend/coworker/supervisor names: first + last name inputs with independent reroll buttons each. NPCs have `last_name` and `pronoun_set` (PronounSet) generated at chargen
- Player first/last name: independent reroll buttons for first and last name separately
- Name sampling from weighted US Census + SSA data (gendered pools: 6672 female first names, 4240 male first names, 24889 surnames). Gendered pool selection based on expression dimensions (85/15 split when expression leans one way, 50/50 when balanced). NPC names use pronoun-derived expression weighting
- Personality parameters: neuroticism, self_esteem, rumination, trait_loneliness, introversion (0–100 each, generated silently, not exposed in UI)
- Sentiments: 8 categories of likes/dislikes (weather, time, food, rain, quiet, outside, warmth, routine), generated silently from charRng
- Life history backstory: economic_origin, career_stability, 0–2 life_events (generated silently from charRng)
- Financial simulation: starting_money, pay_rate, rent_amount, financial_anxiety, personality adjustments, work sentiments, job standing (computed post-finalization)
- Food profile: `food_profile` on character — `{ cooking_skill, ethical, staples, comfort_snack }`. cooking_skill (0–100) deterministic from economic_origin + career_stability. ethical (null | 'vegetarian' | 'vegan') — ~5% / ~3% (Gallup 2023 US), personality-modulated. staples (string[]) — universal base ['rice', 'canned', 'bread'] + charPick from protein and starch pools. comfort_snack — charPick from ['chips', 'cookies', 'candy', 'crackers', 'instant_ramen']. 5 charRng calls total. Initial pantry derived from staples + economic_origin + financial_anxiety — expanded to 12-key vocabulary (pasta, rice, canned, eggs, bread, beans, oats, potatoes, peanut_butter, ramen, oil, snacks).
- Bill day offsets: paycheck, rent, utility, phone bill (generated silently from charRng)
- Identity dimensions: `pronoun_sets` (PronounSet[]), `gender` (GenderIdentity: binary_diversity, nonbinary_diversity, expression_femininity, expression_masculinity), `attraction` (AttractionProfile: sexual/romantic AttractionPattern + sensual/aesthetic), `hrt_active`, `hrt_type`, `out_at_work` (string[]), `out_to_family` (string[]) — 8 unconditional charRng calls. `applyToState()`: when `hrt_active`, adds 'hrt' to `clinic_prescriptions` and sets `medication_supply['hrt'] = 15` (mid-cycle starting supply).

**Identity system (structured model):** Pronoun sets are structured objects (`PronounSet` with subject/object/possessive/reflexive/plural/label). 8 common sets in lookup table (she/her, he/him, they/them, xe/xem, ze/zir, fae/faer, it/its, ey/em) + mixed pronoun support (array of 2 sets). Gender identity as continuous dimensions: `binary_diversity` (0-100, cross-gender identification), `nonbinary_diversity` (0-100, outside binary), `expression_femininity/masculinity` (0-100 each, independent). Split attraction model: `AttractionPattern` (intensity 0-100, orientation 0-100, gating none/bond/rare) for sexual and romantic independently + sensual + aesthetic. `perceivedPresentation()` derived function (fem_read/masc_read/androgynous_read) from expression + body + HRT. `isTrans()` derived from identity dimensions (binary_diversity > 60 or nonbinary_diversity > 40). `identityCongruence()` derived from identity vs. perception gap. Out status is per-dimension: arrays of disclosed dimensions ('sexuality', 'gender', 'attraction'). Chargen UI: pronoun dropdown (8 sets + she/they + he/they + custom), gender dropdown (woman/man/trans woman/trans man/nonbinary/genderqueer/agender), attraction dropdown (straight/gay-lesbian/bisexual/asexual/aromantic/demisexual/aroace). See `docs/design/identity.md`.

**Structural discrimination (first-order, rekeyed from pronouns to perceivedPresentation):** Ambient effects only — no discrete discrimination events. All sites marked `// Approximation debt (structural discrimination)`.
- **Gender pay gap** — fem_read characters (expression_femininity > expression_masculinity + 15): `pay_rate × 0.82` applied in `finishCreation()`. US median 82¢ (BLS 2023). Sector variation not modeled.
- **Job standing ceiling** — fem_read characters in food_service/retail: natural decay ×1.15. In `advanceTime()` after precarity multiplier.
- **Street safety NE** — at street/bus_stop/park after 9pm: fem_read +0.4 pts/hr NE, androgynous_read +0.2 pts/hr NE. Background hypervigilance, not a danger event.
- **Identity concealment cortisol** — in `cortisolTarget()`: +2 pts when isTrans() + at workplace + gender not in out_at_work. +0.8 pts when isTrans() + location_familiarity < 0.2.
- **Closet energy cost** — per-dimension: sexuality concealment 0.4 pts/hr, gender concealment 0.3 pts/hr, attraction-pattern concealment 0.15 pts/hr. All at workplace during work hours.
- **Prose texture** — street description keyed on perceivedPresentation(). Workplace idle thoughts keyed on perceived presentation (fem_read gets gendered dynamics), pronoun structure (mixed pronouns get invisibility, plural pronouns get misgendering), and neopronoun non-recognition.
- **Still deferred:** race/ethnicity (code-switching, microaggressions, intersectional compounding), diagnostic gaps (healthcare system needed), housing discrimination, full pay gap by sector, age discrimination.

## Infrastructure

### Save System
IndexedDB. RunRecord: `{ id, seed, character, actions, status, createdAt, lastPlayed, version }`. Debounced writes (500ms), flush on beforeunload.

### Multi-Run
Threshold screen lists all runs. Click to resume. "Another life" starts fresh. Step-away link pauses current run and returns to threshold. Content settings link on threshold screen (revisitable).

### Content Settings
First-run consent screen (before any game content loads). Binary `full` / `reduced` preference stored in localStorage (player-level, not per-run). Gated in reduced mode: substance purchase/use interactions (buy_cigarettes, smoke_cigarette, buy_alcohol, drink_alcohol, buy_cannabis, smoke_cannabis), DT idle thoughts (dangerous alcohol withdrawal tier), DT pre-sleep prose, DT waking prose. Quit-attempt interactions (decide_to_quit_*) remain available in reduced mode. Fine-grained per-type toggles deferred.

### Deterministic Replay
Four PRNG streams derived from master seed via splitmix32 chain: `charRng` (chargen), `rng` (mechanical gameplay — outcomes, NT effects, event rolls), `cosmeticRng` (prose weighted picks with no mechanical consequence — all `Timeline.cosmeticWeightedPick()` and `realize()` calls), `backgroundRng` (ambient events and background simulation, reserved). Adding prose variants never shifts mechanical replay; adding chargen calls never shifts gameplay. Actions logged as `{ type, id/destination, timestamp }`.

### In-Game Look-Back
Replay scrubber with significance heatmap. Scene segmentation (by movement). Snapshot system for fast seeking. Autoplay with variable speed. Keyboard navigation (arrows, ctrl+arrows, space).

### Habit System (Phase 1 + Auto-Advance)
CART decision tree engine learns action patterns from observed play. No RNG consumed — pure state reads + ML. Ephemeral — trained from the action log each session, no save format changes.

**Feature extraction:** ~39 features from current game state — energy/stress/hunger/social/social_energy (continuous), key NT levels (serotonin, dopamine, NE, GABA, adenosine, cortisol), qualitative tiers and mood tone (categorical), daily flags (dressed, showered, ate, etc.), location, weather, sentiments (work dread, routine comfort), money, phone state, time since wake, last action, pantry_total (aggregate food availability), snacks (snack availability), has_peanut_butter (binary condiment), cooking_skill (stable character trait).

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
