# TODO

> **Workflow note:** Parallelization via subagents is always an option. Use it freely — fire multiple Explore/research agents simultaneously for independent audits, literature searches, or design questions. Don't serialize work that can run in parallel.

## Simulation correctness — known gaps

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

### Interrupt queue — remaining types

Alarm + time_to_leave + cooking timer implemented. Not yet wired:
- Medication reminders (repeat daily, suppress if already taken) — requires a medication system first: prescription state, daily dose tracking, `medication_time` interrupt in scheduled queue. No medication state exists yet.
- Calendar alerts: meetings, interviews, dates, anniversaries, flights

---

## Backlog

### Clothing state

`clothing_cleanliness` (0–100) implemented — degrades while dressed (3 pts/hr awake, 1 pt/hr asleep), set from worn item tier on get_dressed, tier function `clothingCleanlinessTier()`. Discrete damage (`damage: { torn, stained, stretched }`) implemented on each garment — see `grep 'Approximation debt (clothing condition)'`. Remaining:
- **Fit** — drifts slowly with body weight changes.

### Simulation gaps — unimplemented systems

**Missing entirely:**

**Thin/partial:**

- **Alcohol** — implemented: GABA agonism, NE/serotonin disruption, dopamine pulse-crash, REM suppression (alcohol_sleep_flag), adenosine acceleration, linear decay, emotional blunting (none — not a cannabis feature), withdrawal, sleep rebound, DT-zone prose (`'dangerous'` tier at withdrawal>70 && tolerance>65: `tremor_active` flag, cortisol surge, perceptual-disturbance idle thoughts, DT falling-asleep and waking modifiers). Recovery pathway deferred (see substances section).
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

senses.js + realization.js implemented with 28 observation sources, 9 sentence architectures, per-source lexical sets, smell sources, change detection (delta spike). See docs/design/senses.md.

**Remaining:**
- **Sound lexical coverage** — first pass done (2026-02-24): expanded `traffic_through_walls`, `traffic_outdoor`, `street_voices`, `bathroom_echo`, `pipes`, `electronic_whine`, `workplace_hvac`, `coworker_background`, `fluorescent_lights` — added `appositive_np` to most, richer predicates/fragments/modifiers, `flat_descriptions` to three sources, `body_subjects`/`body_predicates` to `coworker_background`. Second pass (2026-02-24): added `body_subjects`/`body_predicates` to all six purely-acoustic sources (`traffic_through_walls`, `traffic_outdoor`, `street_voices`, `pipes`, `electronic_whine`, `workplace_hvac`). Remaining thin spots: `fridge` (good), `rain` (good). Acoustic dimension taxonomies are not the right approach.
- **Acoustic space as location property** — `{ reverb, absorption, floor }` on each location, modulating how sources realize. Acoustic adjacency separate from movement graph. See docs/design/someday.md for full model.
- **Smell gaps** — coffee/cooking (no backing state), autobiographical memory trigger (needs memory system).

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
6. **Routine disruption** — routine comfort debt: when a high-confidence habit action is unavailable (utility cutoff, non-workday, etc.) the routine breaks — `adjustSentiment('routine', 'irritation', ...)` should fire. Detecting "would have been habit but wasn't available" requires comparing predicted habits against available actions before rendering; deferred.
7. **Numeric pre-fill** — parameterized interactions pre-fill fields when confidence is high. `action.data.amount` already in action log; habit system would predict parameter values alongside action predictions.

### Social initiation

`reply_to_friend`, `message_friend`, and `reach_out_to_friend` implemented. Still missing:
- Calling (vs texting)

### Financial cycle — remaining depth

Basic cycle implemented. Still arbitrary (should derive from life situation):
- Bill manifest hardcoded (rent/utilities/phone) — should derive from housing type, employment type, phone plan
- Paycheck flat biweekly — should vary by hours worked, overtime, deductions
- Utilities now seasonal via `utilitiesAmount()` (base $55 + heating/cooling load from `ambientTemperature()`); remaining debts: apartment size, insulation, heating type, local energy prices — `grep 'Approximation debt (utilities)'` in state.js

Not yet implemented:
- **Housing displacement narrative** — `eviction_risk` state exists and accumulates to 100; at threshold the mechanic is deferred. Needs: displacement scene, relocation options (shelter, friend couch, street), downstream consequences. `grep 'eviction_risk.*100'` for the site in state.js.
- Non-formal income patterns (gig work, cash, irregular)

### Shift variety within job types

See docs/design/work-scheduling.md. Chargen generates arrangement from job type (fixed/rotating/on_demand). Overnight wrap-around handled by `withinShift()`.

Retail/food_service day patterns: ~60% of workers get weekend-including schedules (Tue–Sat, Wed–Sun, or Sun–Thu) derived deterministically from career_stability. Low stability → more likely to have weekend shifts (less seniority to choose M–F). Corner store has Sat/Sun crowd-texture prose.

Remaining: night shifts (overnight retail/food service workers; `shift_start >= 22*60` with next-day wrap), split shifts (two separate blocks in one day), and the `rotating` type shift-reveal mechanism (currently `reveal_tod: null` means no reveals fire for rotating workers). Night shifts and non-standard schedules: see section below.

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
- **Laundry mechanic remaining** — `'handwash'` path deferred (needs separate sink interaction). Full laundromat as a location node (NPCs, vending machine, etc.) deferred to someday.md. `laundry_access` now derived from `housing_quality` (implemented); thresholds: ≥70 in_unit, ≥35 building, <35 laundromat.
- **Apartment features** — towel bar, clothing rack gates still pending. `housing_quality` variable now implemented (chargen, character.js, state). Dishwasher implemented: `do_dishes` branches on `housing_quality >= 65`. `grep 'Approximation debt (housing quality)'` for formula debt. Remaining feature gates (towel bar → undress destinations, clothing rack → get_dressed interactions) need content.js work.
- **(b)** Clothing fit defaults to `comfortable` until `Body.dimensionAtTime()` wired into wardrobe generation.

### Weather depth

Temperature model implemented: `ambientTemperature()` derived pure function (no stored state). Sinusoidal seasonal baseline from latitude + day-of-year, sinusoidal diurnal variation (peak 14:00), weather modifier. Feeds skin drain and vasovagal isHot check. `temperatureTier()` reads directly from it.

Remaining: full synoptic simulation (wind, humidity, pressure) — see docs/design/someday.md. Sweat rate not wired to temperature (approximation debt in hydration). Clothing choice not yet connected to temperatureTier.

### More phone interactions

Real phone UI implemented.

**Still missing:** Calling vs texting, different friend response patterns to prolonged absence.

**Compulsive checking vs avoidance** — implemented as idle thought patterns in `idleThoughts()`. Compulsive checking fires when GABA-low OR NE-high OR (dopamine-low AND social-low), amplified by adenosine. Avoidance fires when NE-high + GABA-low (anxiety context) OR serotonin-low + dopamine-low (depression-adjacent). Both suppressed when viewing phone or phone service suspended.

**Phone condition** — `phone_cracked` implemented. Pending: slow phone (loading spinners), dying battery, signal layer (throttling, failed-message indicator, retry).

### Age-specific content

Basic age-shading implemented: `ageStageTier()` in state.js (`young_adult` / `adult` / `midlife` / `older`). Deterministic layer-3 modifiers at 8 key sites: waking up (alarm/depleted), work exhaustion (do_work, exhaustion_wave), bathroom mirror, money idle thoughts, `do_work` seniority/newcomer texture (all 4 tiers), `call_in_sick` anxiety vs. rehearsed fatigue, broke/scraping age variants (young_adult: futures-still-open; adult: stage-that-won't-end; midlife: narrowed-futures arithmetic; older: shorter-horizons calculus).

Still missing: radically different money *sources* by age (parental support, different job trajectories), different relationship structures, the texture of midlife vs early-adult housing instability. Teen and under-18 content (entirely different constraints).

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
  - Pregnancy progression: `conception_time` (absolute game minutes) is the source of truth. `pregnancyWeek()` = `floor((time - conception_time) / (7 × 1440))` — derived, never stored as a counter, unbounded. 42 weeks gestational (= ~40 weeks from conception) is a clinical intervention threshold, not a simulation ceiling. Gestational age (clinical convention) = weeks-from-conception + 2 — relevant only if prose matches clinical language.
  - **Miscarriage hazard rate** is a pure function of `pregnancyWeek()` — well established, exponential decay: ~30–50% of fertilized eggs lost pre-detection (weeks 0–4, mostly chromosomal, character may never know); ~10–20% of known pregnancies weeks 4–6; ~5% after cardiac activity (week 6); ~2–3% weeks 8–12; ~1% second trimester; stillbirth (<1%) after 20 weeks. All hazard rates are functions of elapsed time since conception — implement as a per-tick Poisson probability derived from `pregnancyWeek()`. Resolved by PRNG (deterministic replay). Modifiers: age, prior loss, smoking, alcohol.
  - **Labor onset probability** rises steeply around week 36–38 from conception (~38–40 gestational). Post-dates complications (placental insufficiency, meconium, cord compression) accumulate past week 40–41 from conception.
  - **Post-maturity risk** (>40 weeks from conception): prior post-term pregnancy increases risk 2–3× — this is reproductive history, which the life history system will eventually carry. Minor additional factors: maternal age, obesity, male fetus. Accurate dating matters: `conception_time` gives this directly.
  - **Injuries are injuries, not footnotes on reproductive events.** A levator ani avulsion and a diastasis recti are injuries. They were caused by a delivery, but cause is context, not taxonomy. They live in `injury_history: [{ type, onset_time, severity, cause, resolved }]` alongside torn ligaments, dental abscesses, stress fractures. The reproductive history records what happened during the delivery; the injury system records what got hurt. Neither is a sub-field of the other. Risk for the next pregnancy reads current injury state (severity, resolved?) — not a conditions list nested inside a past pregnancy entry. Conditions in this class:
    - **Diastasis recti** — linea alba separation, prevalence ~50–65% in third trimester; significant fraction don't fully resolve. Second pregnancy with prior diastasis: already-weakened tissue → higher risk, greater severity. Persistent diastasis: back pain, core weakness, changed abdominal profile, digestive effects in severe cases. **Severity is modifiable** (not just presence): kinesiology tape (proprioceptive feedback + mechanical load redistribution across linea alba) and maternity support belts reduce severity risk modestly — small physiotherapy literature, no large RCTs, but plausible mechanism. Pre/during-pregnancy transverse abdominis work and pelvic floor PT have better evidence. Connective tissue genetics are the dominant factor and unmodifiable. **Crunches and sit-ups worsen the gap** — intra-abdominal pressure pushes outward against the already-tensioned linea alba; `home_workout` interaction needs to branch on pregnancy + diastasis state. Implement as: these items/behaviors shift the severity distribution, they don't gate the condition. `reproductive_history` entry needs a `severity` field (not just condition presence) since severity is what accumulates across pregnancies and what interventions modulate.
    - **Pelvic floor dysfunction** (stress incontinence, prolapse) — risk roughly doubles with each vaginal delivery on average, but this is not uniform: **connective tissue genetics** are the dominant modifier. What's heritable: Type I/III collagen ratio (h² for prolapse ~0.43 from twin studies), elastin crosslinking quality (LOX gene variants), relaxin receptor sensitivity (proximate cause of pelvic floor loosening during pregnancy), MMP variants (collagen turnover rate). These belong at chargen as a continuous `connective_tissue_laxity` parameter (0–100). hEDS (already in constitutional_conditions comorbidity cluster) is the extreme high end of this distribution (~top 1–2%); the parameter underlies it. People at the low end have substantially lower risk regardless of delivery count. **Levator ani avulsion** (pubococcygeus tearing from pelvic sidewall, ~13–30% of vaginal deliveries, higher with forceps/vacuum) is a discrete injury event at delivery — a per-delivery PRNG draw, not a smooth accumulation — and is a major cause of prolapse specifically; largely irreversible without surgery. General pelvic floor fatigue (accumulation model) and avulsion injury (discrete event model) are distinct mechanisms contributing to the same condition. Avulsion is an injury — `injury_history` entry with `cause: 'vaginal_delivery'`, `onset_time`, severity. Readable by future delivery risk calculations and by prose. Other modifiers: delivery type (elective C-section substantially reduces risk), pushing stage length and technique, baby size, pelvic floor PT. Post-partum hypoestrogenic state during breastfeeding reduces tissue strength and slows recovery (reversible). Prior occurrence remains strongest predictor of recurrence.
    - **Symphysis pubis dysfunction** — prior occurrence strongly predicts recurrence and earlier onset in subsequent pregnancies.
    - **Connective tissue laxity** — generalized (relaxin exposure each pregnancy); affects joints, linea alba, pelvic ligaments. Modifies diastasis and pelvic floor risk.
    - **Hormonal pattern shifts** — luteal phase length, PMS severity can drift across reproductive history.
  - These conditions are circumstantial (from reproductive history), not constitutional — they must derive from `reproductive_history`, not from a random chargen roll. Leave unassigned until the upstream system exists.
  - Drives body changes (abdominal dimension already wired in body.js), morning sickness via nausea system, energy ceiling drop per trimester (already stubbed). Choice/circumstance architecture for outcome not yet designed.
  - **Psychological effects of pregnancy loss and denial — not yet modeled:**
    - **Miscarriage grief** — real, clinically significant (~20–30% depression/anxiety in months following; higher with recurrent loss), and specifically *disenfranchised*: the loss is socially minimized or invisible ("you can try again," others may not have known). The body biochemically enforces grief: hCG crash + progesterone withdrawal produce a sharp NT target shift independent of emotional processing — model as serotonin target −15 to −25 over days, GABA disruption, cortisol spike. The body continues afterward: bleeding, cramping, the cycle returning. Each subsequent period re-marks the absence. Due date is a recurring grief event — fits naturally into the interrupt queue. Subsequent pregnancy anxiety is near-universal: every symptom loaded, ambivalent bonding until viability is more certain. Partner grief is real and further minimized.
    - **Stillbirth** — PTSD rates ~30–40% at 1 month, ~25% at 6 months. Delivery still happens: labor for a baby who won't cry. Milk coming in post-delivery with no baby — can persist for weeks; purely physiological, no way to stop it cleanly. Social vacuum: people don't know what to say and often say nothing. Due date grief is acute and recurring. The specific horror of learning the pregnancy has ended and continuing to carry.
    - **Termination** — relief is the most commonly reported emotion, and is systematically underrepresented in public discourse. Grief can coexist with relief. Stigma creates additional psychological burden regardless of personal feelings. Long-term psychological harm is not well-supported by evidence for chosen terminations — those denied termination have worse outcomes at 5 years than those who obtained one (Foster et al., Turnaway Study, JAMA Psychiatry 2017 — PMID unverified, DOI 10.1001/jamapsychiatry.2016.4041). Moral injury for some, context-dependent.
    - **Pregnancy denial (cryptic pregnancy)** — two distinct types: *affective* (knows cognitively, can't emotionally integrate) and *pervasive* (genuinely unaware — no symptoms noticed, missed periods unremarkable, prior negative tests). Pervasive prevalence: ~1 in 475 reach delivery without knowing (Wessel 2002 — Acta Obstet Gynecol Scand, PMID unverified). Causes: irregular cycles, absent/minimal symptoms, body image masking physical changes, psychological defense against unacceptable reality. Discovery is acute trauma, especially if at delivery. Absence of 9 months of preparation: no bonding, no adjustment, sudden parenthood or sudden loss with no lead-up. Simulation: `pregnancy_denial` flag; physical pregnancy mechanics run, player-facing pregnancy interactions suppressed; discovery is a discrete event.
    - **Simulation architecture:** hormonal crash connects to NT system (serotonin/GABA/cortisol targets). Disenfranchised grief interacts with the friend absence system — friends haven't reached out because they don't know. Anniversary events (due date, loss date) fit the interrupt queue. Subsequent pregnancy anxiety is a persistent modifier on GABA/cortisol targets during future pregnancies.

Dental pain chargen debts: no treatment mechanic, no condition worsening (abscess, tooth loss), jurisdiction model missing.

**Healthcare locations not modeled:** clinic, GP, hospital, ER, pharmacy (distinct from corner store). OTC medication access has no location. Full condition list: see docs/design/someday.md.

### Jurisdiction as a character parameter

Healthcare access, reproductive rights, legal protections are legal/political, not geographic. Latitude does not predict abortion access, drug policy, or trans protections.

Right model: `jurisdiction` (country + region) as chargen parameter. All access gating derived from it. Any current health/reproductive access gating is an approximation debt.

`jurisdiction` is implemented at chargen (2 charRng calls, ISO 3166). `canPurchaseSubstance(type)` in state.js gates `buy_cannabis`, `buy_cigarettes`, `buy_alcohol`. Remaining jurisdiction debts: healthcare access, reproductive rights, legal protections, dental access.

**Indoor smoking restrictions (partial):** `smoke_exposure` location property implemented (world.js). Passive nicotine accumulation in `advanceTime()` with jurisdiction gate — 18 major-ban countries reduce workplace exposure by 90%. Remaining debt: US state-level patchwork (most states ban, some don't), sub-national variation in non-US jurisdictions, and location types beyond workplace (bars, restaurants). Full model needs `canSmoke(locationId)` gate per jurisdiction+location pair. `grep 'Approximation debt (secondhand smoke)'` for all sites.

### Mental health as distinct from state

Depression, anxiety, bipolar, PTSD, OCD as structural conditions — not "low energy" but "the specific way getting out of bed takes everything you have." Currently only modeled as stress + NT state.

### Neurodivergence

ADHD (executive dysfunction, time blindness, hyperfocus), autism (sensory processing, masking cost, routine importance).

Perceptual processing variants — affect the observation pipeline directly:
- **APD** — sound arrives, parsing fails. Coworker speech stays unintelligible regardless of NE.

### Substance system

Caffeine, nicotine, alcohol, cannabis implemented. Debts: `grep 'Approximation debt (caffeine)'` — 8 sites; `grep 'Approximation debt (cannabis)'` — 15+ sites.

**Next substances (rough priority):**
1. **Opioids** — prescription pathway (back pain that became something else). Requires healthcare access first.

**Open cannabis debts:** none — blunting now implemented as target-distance compression in drift engine.

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
- Idle thoughts: compound state (severe tier), pre-tomorrow dread at home in evening (notable/severe + work tomorrow), avoidance ideation at home (notable/severe + low social).
- Corner store interactions (all cashier-facing): notable → NE +3, serotonin -1 (no prose); severe → NE +6, GABA -2, serotonin -2 + deterministic prose suffix. Withdrawal/urgency states suppress it. No purchase blocking.
- Avoidance reinforcement loop: `message_friend` and `reach_out_to_friend` drain extra social_energy at notable (+5) and severe (+10); `talk_to_coworker` drains extra at notable (+3) and severe (+8). Purely mechanical — no prose. Tagged `// Approximation debt (appearance):`.
- Soup kitchen (`get_meal`) + food bank (`receive_bag`): notable has no effect (staff have seen everything); severe → serotonin -2 only, no NE spike. Deterministic prose suffix on non-first visits only.

**Still deferred:**
- Hairstyle, fashion as distinct dimensions — no state for these yet.
- Specific appearance signals: dandruff, greasy hair, gingivitis, body odour — currently collapsed into hygiene_level scalar.
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

Reactive check-in implemented: `coworker_notices_absence` (≥2 days silence, warmth > 0.25) and `coworker_notices_stress` (strained/overwhelmed at work, once per day). 2 RNG calls per event, 4 variants per flavor per trigger type. Background drama implemented: `coworker_argument` (conflict overheard, ~15% daily when job_standing < 40), `coworker_good_news` (~10% daily), `coworker_overwhelmed` (~12% daily when player stress elevated), `coworker_management_tension` (~8% daily). All fire at most once per calendar day (shared `coworker_drama` cooldown). 2 RNG calls each (balanced). Flavor-agnostic — player not involved.

### Night shifts and non-standard schedules

All three jobs are day shifts. Being awake at 3 AM when the world is asleep is a specific texture.

### Existing systems that need deepening

**Money at $0:**
- **The nothing option** — 12 idle thoughts for compound broke+hungry+empty state; persistence layers B (1–3 days, hunger becomes ambient background) and C (3+ days, near-silence) added via `daysSinceLast('ate')`; recovery prose added to `eat_food` and `eat_from_pantry` (flat, nausea-first, delayed relief). Remaining: mechanical consequences of extended deprivation beyond what's already modeled (appearance drift, social decay τ, financial anxiety sentiment are all continuous — no specific gaps identified beyond the prose).

**Job standing** — coworker warmth/irritation sentiment now drifts standing continuously (full rate during work hours, 30% outside). Remaining: no variation by job type (food_service/retail precarity vs. office stability), no pattern-based assessment (single incident treated same as chronic pattern).

**Phone power** — battery drain and charging implemented. Future: phone model/age affecting capacity, charge rate by charger type, battery health degrading over phone lifetime.

**Gambling** — scratch tickets at corner store implemented ($2, single game). Multi-card design (10–15 games, different price points, gimmick variation, rack browsing) and symbol-level simulation (near-miss from actual symbols) deferred — see docs/design/someday.md. Pathological gambling emerges from dopamine baseline + reinforcement history, no flag.
