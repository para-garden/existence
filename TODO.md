# TODO

> **Workflow note:** Parallelization via subagents is always an option. Use it freely — fire multiple Explore/research agents simultaneously for independent audits, literature searches, or design questions. Don't serialize work that can run in parallel.

## Calibration debt priorities

All approximation debts tagged in code: `// Approximation debt (topic):` — grep by topic.

**High — foundational, visible behavioral effects:**
- **NT coupling coefficients** (27 sites) — `grep 'Approximation debt (NT coupling)' js/state.js`. Bounds calibrated 2026-02-23; individual interaction magnitudes uncalibrated. See docs/research/nt-coupling-*.md for what literature supports.
- **Sleep quality multipliers** (4 sites) — `grep 'Approximation debt (sleep quality)' js/content.js`. Directions correct; magnitudes may be too aggressive. See docs/research/calibration.md.

**Medium:**
- **GI cortisol slow pathway τ** — `grep 'Approximation debt (gastric emptying)' js/state.js`. τ=210min chosen to represent genomic pathway, not measured GI kinetics.

**Negligible / close as-is:**
- Sleep cycle probit approximation error < 1.15×10⁻⁹ — no practical effect. Closed.

---

## Code quality

### wakeUp() reduction

Target: `wakeUp()` sets `s.wake_period_start = s.time` and nothing else.

**Still pending:**
- `last_surfaced_late_tier`, `last_surfaced_mess_tier` — event dedup; needs timestamp-based dedup first
- `daylight_exposure` — continuous accumulator; migrate when event summing is cheap

Prerequisite: events.js timestamp-indexed querying (`events.since(T)`) — data is there, query interface needs exposing.

**Also needed:** Ambient events (pipes, street noise) should habituate — you stop noticing after time in the same place. Still using old count-cap pattern.

### Interrupt queue — remaining types

Alarm + time_to_leave implemented. Not yet wired:
- Medication reminders (repeat daily, suppress if already taken)
- Oven/cooking timers (one-shot, fires wherever you are)
- Calendar alerts: meetings, interviews, dates, anniversaries, flights

---

## Backlog

### Clothing state

Not yet modeled. Three distinct things:
- **Cleanliness/smell** — continuous, degrades with wear, restores with washing. Primary daily variable.
- **Condition** — mostly stable; discrete damage events (torn seam, permanent stain, elastic gone). Not a health bar.
- **Fit** — drifts slowly with body weight changes.

Daily-decrement-per-wear is the wrong model. Clothes fail from accumulation and discrete events, not constant attrition. Prose consequence: laundry matters, the shirt that got bleach on it, the jeans that fit differently now.

### Simulation gaps — unimplemented systems

**Missing entirely:**

- **Alcohol** — GABA-A agonist. Most common self-medication for anxiety. NT effects: GABA agonism (acute), NE/serotonin disruption (later), dopamine pulse-crash, REM suppression, adenosine acceleration. Cold turkey from high dependence is medically dangerous. Currently invisible to simulation.
- **Nicotine** — NE/dopamine pulse, fast tolerance, withdrawal that reads as anxiety (GABA-adjacent). Social layer: the smoke break as legitimized absence.
- **Menstrual cycle** — estradiol/progesterone/LH/FSH placeholder systems exist. ~28-day cycle with real mood/energy/pain effects. Period supplies as logistics; cramps as a pain state; absence of supplies as stress.
- **Non-standard schedules** — retail/food_service always M–F. Wrong. Weekend prose for corner store missing. See shift variety section.

**Thin/partial:**

- **Body composition** — diet + activity → weight drift; affects clothing fit, self-presentation. Far out — see docs/design/someday.md.
- **Multi-scope reputation** — `job_standing` tracks work. No neighborhood/community presence. Regulars at corner store, soup kitchen, food bank are recognized differently.
- **Specific consumable inventory** — umbrella (gates rain interaction texture), period supplies (logistics + absence stress), pain reliever (should be depletable). Not all items need inventory; these specific ones matter.

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

senses.js + realization.js implemented with 21 observation sources, 9 sentence architectures, per-source lexical sets, smell sources, change detection (delta spike). See docs/design/senses.md.

**Remaining:**
- **Widen scope** — engine currently idle-only. Should run on arrival (first-impression salience) and mid-interaction background. Each context has different salience dynamics.
- **Long-term habituation** — current model resets on every arrival. Needs per-location familiarity value persisting across sessions. Floor of 0.4 should be dynamically lower for deeply familiar places.
- **Sound lexical coverage** — richer sound prose = fuller pool coverage per source (`body_subjects`, `appositive_np`, `ambiguity_alts`, etc.). Acoustic dimension taxonomies are not the right approach.
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

`reply_to_friend` and `message_friend` implemented. Still missing:
- Calling (vs texting)
- Different response patterns per friend flavor after prolonged vs brief absence
- Reaching out with no guilt — purely wanting to connect

### Financial cycle — remaining depth

Basic cycle implemented. Still arbitrary (should derive from life situation):
- Bill manifest hardcoded (rent/utilities/phone) — should derive from housing type, employment type, phone plan
- Paycheck flat biweekly — should vary by hours worked, overtime, deductions
- Utilities $65 flat — should derive from season, apartment size
- Corner store prices constant — should derive from neighborhood cost-of-living (`grep 'Approximation debt (corner store prices)'`)

Not yet implemented:
- Debt mechanics (negative balance, overdraft fees)
- "Choose which bill to skip" interaction
- Eviction / disconnection consequences for repeated failed bills
- Non-formal income patterns (gig work, cash, irregular)

### Shift variety within job types

See docs/design/work-scheduling.md. All characters currently run `fixed/weekdays`. Wrong for retail and food_service.

**Implementation tasks (in order):**
1. **Overnight shift fix** — `isWorkHours()` wrap-around check. Low risk.
2. **Add `labor_arrangement` + `known_shifts` to state** — defaults + legacy save migration.
3. **Implement interface functions** — `isScheduledWorkDay()`, `shiftFor()`, `isPotentialWorkDay()`, `shiftKnownToday()`, `hoursUntilShift()`.
4. **Chargen: generate arrangement from job type** — per-job-type defaults; standing + anxiety modulate reveal horizon.
5. **Reveal events for rotating/on_demand** — `schedule_reveal` interrupt wired; on_demand always-assigns is approximation debt.

Split shifts and multiple jobs: see docs/design/work-scheduling.md. Multiple jobs requires multi-employer world graph nodes.

### More employment types

Freelance/commissions, gig work, informal (cash), unemployed, can't work (disability/caregiving) — all reshape what "work" means. Not yet modeled even conceptually.

Capital ownership, investment income, running a business, startup, inheritance, mortgage — see docs/design/someday.md.

### Ending conditions

Runs never finish. No mechanism for a life ending or the game concluding. What triggers an ending? What does "finished" mean for a game with no win/fail state?

### Leisure and downtime interactions

`lie_there`, `look_out_window`, `sit_at_table`, `go_for_walk` implemented. Still missing:
- TV, music, reading, mindless phone scrolling — the media/distraction layer
- No sitting on the couch (no living room)
- **Mindfulness/breathwork** — GABA upregulation, cortisol reduction. Effectiveness depends on state — at high NE/low GABA, sitting with thoughts can make things worse first. App-guided (phone) vs unguided.
- **Exercise beyond walking** — running (endocannabinoids + NE spike + post-exercise GABA/serotonin), gym (financial gate), yoga (parasympathetic), home workout. Each has different access model by income.

### Refeeding syndrome

After 5+ days severe restriction, eating a large meal triggers refeeding: rapid insulin → electrolyte crash → fatigue, weakness, arrhythmia. Crash arrives before feeling better.

Prerequisites: electrolyte model (see thirst debts), `refeeding_risk` state flag after N days severe restriction.

Don't implement until the starvation arc has enough prose depth to make the moment land.

### Cooking and food variety

Only "eat from fridge" and "buy cheap meal." No cooking (time + energy + ingredients), no meals that feel different, no dietary texture.

### Sleep prose — remaining

Largely implemented. Still missing:
- Insomnia / not-sleeping as a distinct experience
- Dreaming

Sleep cycle debts: `grep 'Approximation debt (sleep cycles)'` in state.js + chargen.js.

### Domestic object systems — remaining

Dishes, Linens, Clothing implemented (full_v1). Remaining:
- **Laundry mechanic** — currently assumes in-unit machines. Path should derive from housing: building laundry room → separate location; laundromat → travel + location; hand-wash → sink.
- **Apartment features** — towel bar, clothing rack, in-unit laundry, dishwasher. Gates undress destinations and interaction availability. Cannot derive from rent alone — needs separate `housing_quality` variable from backstory.
- **(b)** Clothing fit defaults to `comfortable` until `Body.dimensionAtTime()` wired into wardrobe generation.
- **(f)** `wearState` doesn't age during sleep — items worn to bed don't progress until next undress.

### Weather depth

Current model: Markov chain over categorical states. No temperature model, no dynamics.

Minimal near-term improvement: temperature as a continuous state (seasonal baseline + daily curve + weather modifier). Feeds existing cold-air skin drain, outdoor comfort, and clothing choice.

Full synoptic simulation: see docs/design/someday.md.

### More phone interactions

Real phone UI implemented. Future apps:
- **Notes** — write/read; recorded actions
- **Alarm** — in-phone UI replacing interaction-based flow
- **Calendar** — view work schedule, upcoming events
- **Timer** — could feed timed tasks; start/stop recorded if game effect

**Still missing:** Calling vs texting, different friend response patterns to prolonged absence, compulsive checking vs avoidance as distinct behavioral patterns.

**Phone condition** — `phone_cracked` implemented. Pending: slow phone (loading spinners), dying battery, signal layer (throttling, failed-message indicator, retry).

### Age-specific content

`age_stage` in state but no prose varies by age. Radically different daily textures for different life stages — different work, money sources, constraints.

### Family relationships

No family in simulation. Supportive / conditional / hostile / absent parents. Financial cutoff. Housing contingent on family. The phone call you dread.

### Content warnings and consent

No content level configuration. Baseline / full / fine-grained toggles. Configuration before character generation, revisitable between runs.

### Health system

Migraines, acute illness, dental pain implemented. See docs/design/health.md.

**Nearest-term (prerequisites mostly met):**
- **Vasovagal syncope / orthostatic hypotension** — prodrome prose (tunnel vision, nausea, pallor), brief episode, recovery. Risk amplifiers already modeled (dehydration, low sleep, heat). Needs `bloodPressureTier()` derived from NE/hydration/cortisol/energy. Constitutional component (autonomic dysregulation) + circumstantial (dehydration/heat) — model as continuous risk, not binary condition.
- **Gastritis** — stomach system exists; modifies it (pain-when-empty, nausea cycles, slower emptying). Three upstream paths: H. pylori, NSAID overuse, stress history.

**Deferred (needs upstream):**
- **Diabetes** — type 1 constitutional, type 2 must derive from backstory (diet/activity/stress history).
- **Long COVID / ME/CFS** — post-exertional malaise; needs prior illness event in backstory.
- **Eating disorders** — needs body image state variable; must derive from personality + life history, not dice roll.
- **POTS / hEDS / MCAS** — comorbidity structure; conditional probability table at chargen.
- **Tourette syndrome** — suppression economy, coprolalia as prose event (involuntary speech, not player choice).
- **Pregnancy** — morning sickness uses existing nausea system; HG is severe form.

Dental pain chargen debts: no treatment mechanic, no condition worsening (abscess, tooth loss), jurisdiction model missing.

**Healthcare locations not modeled:** clinic, GP, hospital, ER, pharmacy (distinct from corner store). OTC medication access has no location. Full condition list: see docs/design/someday.md.

### Jurisdiction as a character parameter

Healthcare access, reproductive rights, legal protections are legal/political, not geographic. Latitude does not predict abortion access, drug policy, or trans protections.

Right model: `jurisdiction` (country + region) as chargen parameter. All access gating derived from it. Any current health/reproductive access gating is an approximation debt.

### Mental health as distinct from state

Depression, anxiety, bipolar, PTSD, OCD as structural conditions — not "low energy" but "the specific way getting out of bed takes everything you have." Currently only modeled as stress + NT state.

### Neurodivergence

ADHD (executive dysfunction, time blindness, hyperfocus), autism (sensory processing, masking cost, routine importance).

Perceptual processing variants — affect the observation pipeline directly:
- **APD** — sound arrives, parsing fails. Coworker speech stays unintelligible regardless of NE.
- **Sensory processing differences** — globally raised/lowered salience thresholds.
- **Synesthesia** (chromesthesia) — sound → visual observations in realization.js. Rare (4%), opt-in at chargen.

### Substance system

Caffeine implemented. Debts: `grep 'Approximation debt (caffeine)'` — 8 sites.

**Next substances (rough priority):**
1. **Nicotine** — irritability-dominant withdrawal (distinct from caffeine's headache). Dopamine below non-smoker baseline during withdrawal. Smoke break as legitimized absence.
2. **Alcohol** — GABA-A agonist. Curve (push → plateau → cost). REM suppression despite sedation. Dangerous withdrawal. See docs/reference/substances.md.
3. **Cannabis** — blunts emotional extremes, disrupts REM. Withdrawal milder than nicotine/alcohol.
4. **Opioids** — prescription pathway (back pain that became something else). Requires healthcare access first.

**Recovery pathway** (cut from first implementation): cold turkey mechanic, medically supervised tapering, AA/NA meetings as interactions, sponsor as relationship slot, craving as attention state with location-based trigger amplification. See docs/reference/substances.md.

### Life history simulation — target state

Every chargen parameter not derived from simulated history is a debt. Current backstory system (`generateBackstory`, `simulateFinancialHistory`) is the prototype — correct structure, thin coverage.

Current priority: keep replacing placeholder draws with derived ones.

Alternate creation modes (lived-in chargen, sandbox as inverse simulation): see docs/design/someday.md.

### Drawn lots

No drawn lots. Foster care, domestic violence, CPS, childbearing, FAS, housing instability, addiction/recovery, legal constraints, grief, language barriers. Each as daily texture, not backstory tags.

### Appearance as a social object

Hygiene state (dandruff, greasy hair, unkempt, gingivitis, body odour), hairstyle, fashion — feed into others' responses → NT state → character's relationship to their own appearance. Loop runs both ways.

Hygiene degradation has many causes: depression, executive dysfunction, low interoceptive awareness, deliberate deprioritization, poverty, physical inability. Prose notices state, not cause.

Hair washing frequency varies by hair type and culture — "unwashed" is not a universal signal.

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

### Observation fidelity in prose

"Around thirty dollars" vs "$32." "Sometime in the morning" vs "9:15 AM." The experience of not always knowing exactly — tired, distracted, checked out.

### Narration voice variation

Narration itself changes by character — personality affecting sentence rhythm, neurodivergence changing attention structure, trauma changing what's loaded.

### The world outside the routine

Only 7 locations. No park, library, friend's place, laundromat, clinic, shelter. Each new place a specific texture of constrained life.

### Coworker depth

Flavor-driven chatter but no ongoing relationship state. No coworker who notices you've been off. No coworker drama that exists whether or not you engage.

### Bus ride as experience

Wait and both ride directions have full mood-branched NT-shaded prose. Still missing: ambient events (overheard conversation, someone's music, the specific route), in-ride phone checking.

### Night shifts and non-standard schedules

All three jobs are day shifts. Being awake at 3 AM when the world is asleep is a specific texture.

### Existing systems that need deepening

**Money at $0:**
- **The nothing option** — 12 idle thoughts added for compound broke+hungry+empty state. Still pending: narration changes as state persists (body signals flattening), mechanical consequences accumulating, what recovery from this state actually feels like.

**Job standing** — mechanical, not social. No coworker influence on standing, no variation by job type, no pattern-based assessment (single incident treated same as chronic pattern). Standing should be relational.

**Phone power** — battery drain and charging implemented. Future: phone model/age affecting capacity, charge rate by charger type, battery health degrading over phone lifetime.

**Gambling** — scratch tickets at corner store implemented ($2, single game). Multi-card design (10–15 games, different price points, gimmick variation, rack browsing) and symbol-level simulation (near-miss from actual symbols) deferred — see docs/design/someday.md. Pathological gambling emerges from dopamine baseline + reinforcement history, no flag.
