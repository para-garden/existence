# TODO

> **Workflow note:** Parallelization via subagents is always an option. Use it freely — fire multiple Explore/research agents simultaneously for independent audits, literature searches, or design questions. Don't serialize work that can run in parallel.

## Simulation correctness — known gaps

### Menstrual cycle day derivation

`cycle_day` is an integer incremented once per `processSleepEnd()`. A 48-hour sleep still only advances by 1 day. This is wrong — the cycle is a biological clock, not a sleep counter.

**Root cause:** day is separate from time. `cycle_day` should be derived from elapsed time since cycle start, not incremented discretely per sleep.

**Fix:** Replace `cycle_day` with `cycle_start_time` (absolute game minutes when day 1 began). Derive current cycle day as `Math.floor((s.time - s.cycle_start_time) / (24 * 60)) % s.cycle_length`. Remove `advanceCycleDay()`. Update all callers. Also fixes the long-sleep edge case for free. Store `cycle_start_time` in chargen based on `cycle_start_day` (already generated).

Cramp activation and phase tier are pure functions of cycle day — both automatically correct once the derivation is.

### Secondhand smoke / passive nicotine exposure

Characters in smoke-filled environments (bars, certain workplaces, homes of smokers) should accumulate nicotine even if they're non-smokers. Currently absent entirely.

**What's needed:** (1) location property `smoke_exposure: 0–1` (static or event-driven), (2) nicotine accumulation in `advanceTime()` proportional to `smoke_exposure × hours`, bypassing the `isSmoker()` check. Rates much lower than active smoking (10–20% passive dose). Secondhand smoke also raises cortisol slightly, reduces GABA target (irritant), contributes to nausea at high exposure. Long-term: passive habit accumulation at very low rate (`nicotine_habit` drift from repeated low-dose exposure).

---

## Calibration debt priorities

All approximation debts tagged in code: `// Approximation debt (topic):` — grep by topic.

**High — foundational, visible behavioral effects:**
- **NT coupling coefficients** (21 sites remain) — `grep 'Approximation debt (NT coupling)' js/state.js`. Literature review complete 2026-02-24. Changes made: (1) sleep quality ref raised 0.7→0.85; (2) hunger threshold raised 60→75; (3) sleep-debt 5-HT threshold raised 240→360 min (matches "more than a week" receptor-change requirement); (4) stress→DA made continuous (threshold removed); (5) DA sleep-debt threshold lowered 240→120; (6) stress→NE made continuous (offset removed); (7) NE sleep-quality ref raised 0.5→0.65; (8) social→NE term added. GABA stress coefficient 0.12 **calibrated** from Hasler 2010 (PMID 20634372) + MRS meta-analysis [15–30% chronic range]; all four NT clamp bounds upgraded from approximation to calibrated-from-literature status. Remaining 21 sites are approximation debts with full literature commentary — magnitudes not derivable from current literature. See docs/research/nt-coupling-*.md and docs/research/gaba-social-decay.md.
- **Sleep quality multipliers** (4 sites) — `grep 'Approximation debt (sleep quality)' js/content.js`. Directions correct; magnitudes may be too aggressive. See docs/research/calibration.md.

**Medium:**
- **GI cortisol slow pathway τ** — `grep 'Approximation debt (gastric emptying)' js/state.js`. τ=210min chosen to represent genomic pathway, not measured GI kinetics.
- **Mindfulness NT nudges** (9 sites) — `grep 'Approximation debt (mindfulness)' js/content.js`. Directions grounded in literature (Streeter 2010, Pascoe 2017, Tang 2015, Jacobs 2004); magnitudes and single-session scale all chosen. Resistance and drift multipliers (0.7×, 0.5×) have directional support but no quantitative basis. Unguided vs. app-guided difference not modeled at single-session scale.

**Negligible / close as-is:**
- Sleep cycle probit approximation error < 1.15×10⁻⁹ — no practical effect. Closed.

---

## Code quality

### wakeUp() reduction

Target: `wakeUp()` sets `s.wake_period_start = s.time` and nothing else.

**Still pending:**
- `daylight_exposure` — continuous accumulator; fractional-minute contributions per `advanceTime()` call make event summing expensive. Migrate when a per-tick event approach is cheap (requires event summing that doesn't bloat the log).

**Also needed:** Ambient events (pipes, street noise) should habituate — you stop noticing after time in the same place. Still using old count-cap pattern.

### Interrupt queue — remaining types

Alarm + time_to_leave implemented. Not yet wired:
- Medication reminders (repeat daily, suppress if already taken)
- Oven/cooking timers (one-shot, fires wherever you are)
- Calendar alerts: meetings, interviews, dates, anniversaries, flights

---

## Backlog

### Clothing state

`clothing_cleanliness` (0–100) implemented — degrades while dressed (3 pts/hr awake, 1 pt/hr asleep), set from worn item tier on get_dressed, tier function `clothingCleanlinessTier()`. Discrete damage (`damage: { torn, stained, stretched }`) implemented on each garment — see `grep 'Approximation debt (clothing condition)'`. Remaining:
- **Fit** — drifts slowly with body weight changes.

### Simulation gaps — unimplemented systems

**Missing entirely:**

- **Non-standard schedules** — retail/food_service always M–F. Wrong. Weekend prose for corner store missing. See shift variety section.
- **Secondhand smoke / passive nicotine** — non-smokers in smoky environments should accumulate nicotine at low rates. Needs `smoke_exposure` location property, passive accumulation path in `advanceTime()`, separate from `isSmoker()` gate. NT effects: cortisol +, GABA target -, nausea at high exposure. Long-term: slow `nicotine_habit` drift from chronic passive exposure. Jurisdiction affects which indoor spaces are smoke-free.

**Thin/partial:**

- **Alcohol** — implemented: GABA agonism, NE/serotonin disruption, dopamine pulse-crash, REM suppression (alcohol_sleep_flag), adenosine acceleration, linear decay, emotional blunting (none — not a cannabis feature), withdrawal, sleep rebound. Missing: medically-dangerous cold-turkey prose at very high tolerance (delirium tremens territory). Recovery pathway deferred (see substances section).
- **Body composition** — diet + activity → weight drift; affects clothing fit, self-presentation. Far out — see docs/design/someday.md.
- **Multi-scope reputation** — `job_standing` tracks work. Corner store, soup kitchen, and food bank now have recognition tiers (stranger/familiar/regular) via `corner_store_visits` + existing `soup_kitchen_visits` / `food_bank_visits` + `locationVisitTier()`. Remaining: neighborhood / street presence, block-level relationships.

### Bathroom / toilet simulation — coverage

| Location | Toilet | Notes |
|---|---|---|
| apartment_bathroom | ✓ | Home base |
| workplace | ✓ | workplace_bathroom location node |
| soup_kitchen | ✓ | flat interaction |
| food_bank | ✓ | flat interaction |
| corner_store | ✓ | flat interaction; ~12% unavailable |
| street | ✓ | ~55% find something |
| bus_stop | ✓ | urgent/pressing only; ~20% find something |

**Corner store bathroom** — implemented flat. Could upgrade to dedicated location node (decompress/mirror/stay) per established pattern. Not urgent.

### Prose compositor and sensory fragments

senses.js + realization.js implemented with 27 observation sources, 9 sentence architectures, per-source lexical sets, smell sources, change detection (delta spike). See docs/design/senses.md.

**Remaining:**
- **Sound lexical coverage** — first pass done (2026-02-24): expanded `traffic_through_walls`, `traffic_outdoor`, `street_voices`, `bathroom_echo`, `pipes`, `electronic_whine`, `workplace_hvac`, `coworker_background`, `fluorescent_lights` — added `appositive_np` to most, richer predicates/fragments/modifiers, `flat_descriptions` to three sources, `body_subjects`/`body_predicates` to `coworker_background`. Remaining thin spots: `fridge` (good), `rain` (good). Still missing: `body_subjects`/`body_predicates` for purely-acoustic sources (`traffic_through_walls`, `traffic_outdoor`, `street_voices`, `pipes`, `electronic_whine`, `workplace_hvac`). Acoustic dimension taxonomies are not the right approach.
- **Acoustic space as location property** — `{ reverb, absorption, floor }` on each location, modulating how sources realize. Acoustic adjacency separate from movement graph. See docs/design/someday.md for full model.
- **Smell gaps** — coffee/cooking (no backing state), cleaning product smell (needs transient post-shower/dishes state), autobiographical memory trigger (needs memory system).

---

## Under Consideration

Everything below is drawn from the gap between docs/design/overview.md and what's built. Not committed to — just visible.

### System interfaces

See docs/design/interfaces.md. Implementation order:
1. Domestic objects — done (Dishes, Linens, Clothing).
2. **Food** — `Food.fridgeTier()`, `Food.canEat()` wrappers.
3. **Finance** — `Finance.canAfford()`, `Finance.nextBillDue()`.
4. **Job** — `Job.isWorkday()`, `Job.isLate()`, `Job.latenessMinutes()`.
5. **Weather/Geo** — temperature, season, day length from latitude + date.
6. **Substances** — caffeine first.
7. **Health** — one condition to establish the pattern.

### Mood system — remaining

Layers 1–5d implemented. Remaining:

6. **Trauma sentiments** — high-intensity, processing-resistant. Needs trauma system (not yet designed).

28 of ~76+ hormones modeled. See docs/reference/hormones.md. Missing systems activate as relevant game areas are built.

### Habit system — remaining

Phases 1–3 implemented (CART engine, suggested defaults, auto-advance). Remaining:

4. **Prose modulation** — habit strength modulates prose density. Needs content variants.
5. **Decision path → prose motivation** — tree path tells prose WHY the habit fired.
6. **Routine sentiment activation** — habit consistency feeds routine comfort/irritation NT targets.
7. **Numeric pre-fill** — parameterized interactions pre-fill fields when confidence is high. `action.data.amount` already in action log; habit system would predict parameter values alongside action predictions.

### Social initiation

`reply_to_friend`, `message_friend`, and `reach_out_to_friend` implemented. Still missing:
- Calling (vs texting)
- Different response patterns per friend flavor after prolonged vs brief absence

### Financial cycle — remaining depth

Basic cycle implemented. Still arbitrary (should derive from life situation):
- Bill manifest hardcoded (rent/utilities/phone) — should derive from housing type, employment type, phone plan
- Paycheck flat biweekly — should vary by hours worked, overtime, deductions
- Utilities $65 flat — should derive from season, apartment size
- Corner store prices constant — should derive from neighborhood cost-of-living (`grep 'Approximation debt (corner store prices)'`)

Not yet implemented:
- **Housing displacement narrative** — `eviction_risk` state exists and accumulates to 100; at threshold the mechanic is deferred. Needs: displacement scene, relocation options (shelter, friend couch, street), downstream consequences. `grep 'eviction_risk.*100'` for the site in state.js.
- Interest / compounding on negative balance — `grep 'Approximation debt (debt)'` for the overdraft fee site; interest rate not implemented
- Non-formal income patterns (gig work, cash, irregular)

### Shift variety within job types

See docs/design/work-scheduling.md. Chargen generates arrangement from job type (fixed/rotating/on_demand). Overnight wrap-around handled by `withinShift()`.

Split shifts and multiple jobs: see docs/design/work-scheduling.md. Multiple jobs requires multi-employer world graph nodes.

### More employment types

Freelance/commissions, gig work, informal (cash), unemployed, can't work (disability/caregiving) — all reshape what "work" means. Not yet modeled even conceptually.

Capital ownership, investment income, running a business, startup, inheritance, mortgage — see docs/design/someday.md.

### Ending conditions

Runs never finish. No mechanism for a life ending or the game concluding. What triggers an ending? What does "finished" mean for a game with no win/fail state?

### Leisure and downtime interactions

`lie_there`, `look_out_window`, `sit_at_table`, `go_for_walk`, `breathwork_unguided`, `breathwork_app` implemented. Still missing:
- TV, music, reading, mindless phone scrolling — the media/distraction layer
- No sitting on the couch (no living room)
- **Exercise beyond walking** — `go_for_run` (street), `home_workout` (bedroom), and `yoga_home` (apartment, parasympathetic) implemented. Deferred: gym (financial gate). Gym needs a membership state variable + monthly cost + commute.

### Refeeding syndrome

After 5+ days severe restriction, eating a large meal triggers refeeding: rapid insulin → electrolyte crash → fatigue, weakness, arrhythmia. Crash arrives before feeling better.

Prerequisites: electrolyte model (see thirst debts), `refeeding_risk` state flag after N days severe restriction.

Don't implement until the starvation arc has enough prose depth to make the moment land.

### Cooking and food variety

Only "eat from fridge" and "buy cheap meal." No cooking (time + energy + ingredients), no meals that feel different, no dietary texture.

### Sleep cycle approximation debts

`grep 'Approximation debt (sleep cycles)'` in state.js + chargen.js — 8 open sites (cycle lengths, SWS/REM fractions, inertia coefficients).

### Domestic object systems — remaining

Dishes, Linens, Clothing implemented (full_v1). Remaining:
- **Laundry mechanic remaining** — `'handwash'` path deferred (needs separate sink interaction). Full laundromat as a location node (NPCs, vending machine, etc.) deferred to someday.md. `housing_quality` variable not yet added — laundry access uses `economic_origin` as proxy via `laundry_access` chargen property. `grep 'Approximation debt (laundry access)'` for thresholds.
- **Apartment features** — towel bar, clothing rack, in-unit laundry, dishwasher. Gates undress destinations and interaction availability. Cannot derive from rent alone — needs separate `housing_quality` variable from backstory.
- **(b)** Clothing fit defaults to `comfortable` until `Body.dimensionAtTime()` wired into wardrobe generation.
- **(f)** `wearState` doesn't age during sleep — items worn to bed don't progress until next undress.

### Weather depth

Temperature model implemented: `ambientTemperature()` derived pure function (no stored state). Sinusoidal seasonal baseline from latitude + day-of-year, sinusoidal diurnal variation (peak 14:00), weather modifier. Feeds skin drain and vasovagal isHot check. `temperatureTier()` reads directly from it.

Remaining: full synoptic simulation (wind, humidity, pressure) — see docs/design/someday.md. Sweat rate not wired to temperature (approximation debt in hydration). Clothing choice not yet connected to temperatureTier.

### More phone interactions

Real phone UI implemented.

**Still missing:** Calling vs texting, different friend response patterns to prolonged absence, compulsive checking vs avoidance as distinct behavioral patterns.

**Phone condition** — `phone_cracked` implemented. Pending: slow phone (loading spinners), dying battery, signal layer (throttling, failed-message indicator, retry).

### Age-specific content

Basic age-shading implemented: `ageStageTier()` in state.js (`young_adult` / `adult` / `midlife` / `older`). Deterministic layer-3 modifiers at 5 key sites: waking up (alarm/depleted), work exhaustion (do_work, exhaustion_wave), bathroom mirror, money idle thoughts.

Still missing: radically different money *sources* by age (parental support, different job trajectories), different relationship structures, the texture of midlife vs early-adult housing instability. Deeper work-related age texture — why you're at this job, seniority vs newcomer dynamics. Teen and under-18 content (entirely different constraints).

### Family relationships

No family in simulation. Supportive / conditional / hostile / absent parents. Financial cutoff. Housing contingent on family. The phone call you dread.

### Content warnings and consent

No content level configuration. Baseline / full / fine-grained toggles. Configuration before character generation, revisitable between runs.

### Health system

Migraines, acute illness, dental pain, gastritis implemented. See docs/design/health.md.

**Deferred (needs upstream):**
- **Diabetes** — type 1 constitutional, type 2 must derive from backstory (diet/activity/stress history).
- **Long COVID / ME/CFS** — post-exertional malaise; needs prior illness event in backstory.
- **Eating disorders** — needs body image state variable; must derive from personality + life history, not dice roll.
- **POTS / hEDS / MCAS** — comorbidity structure; conditional probability table at chargen.
- **Tourette syndrome** — suppression economy, coprolalia as prose event (involuntary speech, not player choice).
- **Pregnancy and contraception** — `pregnancy_week` state var and body.js modifiers stubbed. Full model needs:
  - Sexual activity as a recordable event (parameterized, player-controlled)
  - Fertility window derived from `cyclePhaseTier() === 'ovulatory'` (and adjacent days — sperm viability window ~5 days prior)
  - Conception probability = fertility_base × (1 − contraception_efficacy) per event, resolved by PRNG
  - Contraception as character state: `contraception_method` (none/condom/pill/patch/ring/iud_copper/iud_hormonal/implant/injection/barrier) + `contraception_active` (tracks consistent use vs. gaps)
  - **All methods have real-world failure rates** (typical use, not perfect use — what the simulation should model): condom 13%/yr, pill 7%/yr, patch 7%/yr, IUD copper <1%/yr, IUD hormonal <1%/yr, implant <1%/yr, injection 4%/yr, none ~85%/yr. Convert to per-event probabilities from annual rates via Poisson assumption (acts/yr ≈ 52–100).
  - **Plan B (levonorgestrel / ulipristal):** mechanism is ovulation delay/inhibition, NOT post-implantation. Works by suppressing LH surge. Effectiveness depends on cycle timing — most effective pre-ovulation; minimal effect after ovulation (no evidence of interfering with implantation, Cleland 2012 Contraception 86:479). Implement as: if `cyclePhaseTier() === 'follicular'` or early ovulatory → advance `cycle_start_time` forward by 3–5 days (delays next ovulatory window). If already post-ovulation → no mechanical effect. Time-sensitive: effectiveness degrades over 72h (>80% within 24h → ~52% at 72h, WHO 1998 Lancet 352:428).
  - Pregnancy progression: `pregnancy_week` advances automatically, drives body changes (abdominal dimension already wired in body.js), morning sickness via nausea system, energy ceiling drop per trimester (already stubbed). Choice/circumstance architecture for outcome not yet designed.

Dental pain chargen debts: no treatment mechanic, no condition worsening (abscess, tooth loss), jurisdiction model missing.

**Healthcare locations not modeled:** clinic, GP, hospital, ER, pharmacy (distinct from corner store). OTC medication access has no location. Full condition list: see docs/design/someday.md.

### Jurisdiction as a character parameter

Healthcare access, reproductive rights, legal protections are legal/political, not geographic. Latitude does not predict abortion access, drug policy, or trans protections.

Right model: `jurisdiction` (country + region) as chargen parameter. All access gating derived from it. Any current health/reproductive access gating is an approximation debt.

**Nearest priority — substance purchase gates.** `buy_cannabis`, `buy_cigarettes`, `buy_alcohol` in content.js have no jurisdiction check. `buy_cannabis` already has `// Approximation debt (jurisdiction):` comment. Minimal model (researched 2026-02-24): add `{ country, region }` to character at chargen (ISO 3166 country code + optional state/province code for federal systems — US, CA, AU). 1–2 charRng calls. `canPurchaseSubstance(type)` lookup in state.js. Only purchase gates need checking — consumption is gated by inventory. Secondhand smoke also needs jurisdiction for indoor smoking restrictions.

### Mental health as distinct from state

Depression, anxiety, bipolar, PTSD, OCD as structural conditions — not "low energy" but "the specific way getting out of bed takes everything you have." Currently only modeled as stress + NT state.

### Neurodivergence

ADHD (executive dysfunction, time blindness, hyperfocus), autism (sensory processing, masking cost, routine importance).

Perceptual processing variants — affect the observation pipeline directly:
- **APD** — sound arrives, parsing fails. Coworker speech stays unintelligible regardless of NE.
- **Sensory processing differences** — globally raised/lowered salience thresholds.
- **Synesthesia** (chromesthesia) — sound → visual observations in realization.js. Rare (4%), opt-in at chargen.

### Substance system

Caffeine, nicotine, alcohol, cannabis implemented. Debts: `grep 'Approximation debt (caffeine)'` — 8 sites; `grep 'Approximation debt (cannabis)'` — 15+ sites.

**Next substances (rough priority):**
1. **Opioids** — prescription pathway (back pain that became something else). Requires healthcare access first.

**Open cannabis debts:**
- Emotional blunting is currently a per-tick NT nudge toward 50 (midpoint). Proper implementation: a blunting hook in the drift engine that compresses target distance. Medium priority.
- Jurisdiction modeling: `buy_cannabis` assumes legal access. Approximation debt (jurisdiction) marked at call site.

**Recovery pathway** (cut from first implementation): cold turkey mechanic, medically supervised tapering, AA/NA meetings as interactions, sponsor as relationship slot, craving as attention state with location-based trigger amplification. See docs/reference/substances.md.

### Life history simulation — target state

Every chargen parameter not derived from simulated history is a debt. Current backstory system (`generateBackstory`, `simulateFinancialHistory`) is the prototype — correct structure, thin coverage.

Current priority: keep replacing placeholder draws with derived ones.

Alternate creation modes (lived-in chargen, sandbox as inverse simulation): see docs/design/someday.md.

### Drawn lots

No drawn lots. Foster care, domestic violence, CPS, childbearing, FAS, housing instability, addiction/recovery, legal constraints, grief, language barriers. Each as daily texture, not backstory tags.

### Appearance as a social object

**Implemented (2026-02-24):**
- `appearanceAwareness()` composite tier (`presentable` / `slipping` / `notable` / `severe`) derived from hygieneTier + clothingCleanlinessTier. No new state.
- `talk_to_coworker`: graduated social/connection_depth penalties by appearance tier; NE spike + GABA drop self-consciousness signal at notable/severe; coworker irritation drift; compound prose suffix distinguishing hygiene vs clothing source.
- `coworker_speaks`: social/depth gain reduced at notable/severe; irritation drift and small NE signal on being addressed when self-conscious.
- `advanceTime`: continuous job_standing penalty at workplace during work hours — 0.12 pts/hr notable, 0.25 pts/hr severe. Tagged `// Approximation debt (appearance):`.
- Idle thoughts: compound state (severe tier), pre-tomorrow dread at home in evening (notable/severe + work tomorrow).

**Still deferred:**
- Hairstyle, fashion as distinct dimensions — no state for these yet.
- Specific appearance signals: dandruff, greasy hair, gingivitis, body odour — currently collapsed into hygiene_level scalar.
- Social responses outside work: neighbor, soup kitchen, food bank, corner store staff — appearance not yet wired there.
- The loop self-reinforces through NT already (NE/GABA spike → stress → less energy for hygiene), but no explicit awareness-→-avoidance mechanic yet.
- Hair washing frequency varies by hair type and culture — "unwashed" is not a universal signal. Would need a hair_type parameter at chargen.

Hygiene degradation has many causes: depression, executive dysfunction, low interoceptive awareness, deliberate deprioritization, poverty, physical inability. Prose notices state, not cause.

### Identity and social landscape

No identity dimensions affect simulation. Gender (misogyny as ambient texture), trans experience (visibility, HRT, passing), race/ethnicity (code-switching cost, microaggressions), sexuality (the closet as energy cost), body as social object.

### Performance and masking cost

Masking (autism/ADHD), code-switching (race/culture), the closet (sexuality), body management. Modeled as ambient energy drain varying by context. Some spaces let you drop it.

### Nostalgia and NT effects

Genuine neurochemical response — serotonin + dopamine, buffers against loneliness. Bittersweet: warmth and loss simultaneous. Triggered by sensory cues. Needs research before implementation.

### Structural discrimination

Same action → different outcomes by gender, race, age, disability. Pay gap, diagnostic gaps, street safety, housing screening. Currently simulation produces identical outcomes regardless of identity. Each system that ignores this is an approximation debt.

### Dietary needs

Condition-driven (diabetes, celiac, allergies), pregnancy, religious/cultural (halal, kosher, fasting), eating disorders. Poverty making all of it worse.

### Economic dimensions beyond money

Origin vs current position, social capital, cultural capital, educational background, geographic reality (food deserts, transit deserts, the daily tax of poverty).

### Trauma system

Not a condition — a lens. Loaded moments, avoidance, involuntary reactions, absences (interactions that should exist but don't). Prose contracting, going flat, pulling away.

### Upbringing

Working / indifferent / overwhelmed / resentful / abusive. Shapes what the character expects from people, what care looks like, what they flinch at.

### Distance and absence in relationships

Online friends, long-distance, sick people remotely. The phone as the relationship's entire infrastructure.

### Narration voice variation

Basic personality shading in idle thoughts is done: neuroticism adds anxious ambient interpretation pool entries (weighted by neuroticism × NE); high rumination adds looping-theme pool entries and a deterministic " Still." / " Again." / " You've been here before." suffix (~1/3 of recurring-theme thoughts); low self-esteem adds self-referential suffix at work/isolation contexts (~half the time). All deterministic, no RNG. Remaining: neurodivergence changing attention structure (ADHD hyperfocus/object permanence, autism sensory weight), trauma changing what's loaded (intrusive memory surfacing, startle sensitivity).

### The world outside the routine

Only 7 locations. No park, library, friend's place, laundromat, clinic, shelter. Each new place a specific texture of constrained life.

### Coworker depth

Reactive check-in implemented: `coworker_notices_absence` (≥2 days silence, warmth > 0.25) and `coworker_notices_stress` (strained/overwhelmed at work, once per day). 2 RNG calls per event, 4 variants per flavor per trigger type. Remaining: coworker drama that exists whether or not you engage — events in the background, shifts in atmosphere that aren't about the player.

### Night shifts and non-standard schedules

All three jobs are day shifts. Being awake at 3 AM when the world is asleep is a specific texture.

### Existing systems that need deepening

**Money at $0:**
- **The nothing option** — 12 idle thoughts for compound broke+hungry+empty state; persistence layers B (1–3 days, hunger becomes ambient background) and C (3+ days, near-silence) added via `daysSinceLast('ate')`; recovery prose added to `eat_food` and `eat_from_pantry` (flat, nausea-first, delayed relief). Remaining: mechanical consequences of extended deprivation beyond what's already modeled (appearance drift, social decay τ, financial anxiety sentiment are all continuous — no specific gaps identified beyond the prose).

**Job standing** — mechanical, not social. No coworker influence on standing, no variation by job type, no pattern-based assessment (single incident treated same as chronic pattern). Standing should be relational.

**Phone power** — battery drain and charging implemented. Future: phone model/age affecting capacity, charge rate by charger type, battery health degrading over phone lifetime.

**Gambling** — scratch tickets at corner store implemented ($2, single game). Multi-card design (10–15 games, different price points, gimmick variation, rack browsing) and symbol-level simulation (near-miss from actual symbols) deferred — see docs/design/someday.md. Pathological gambling emerges from dopamine baseline + reinforcement history, no flag.
