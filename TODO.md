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

Alarm + time_to_leave + cooking timer + interview implemented. Not yet wired:
- Medication reminders (repeat daily, suppress if already taken) — requires a medication system first: prescription state, daily dose tracking, `medication_time` interrupt in scheduled queue. No medication state exists yet.
- Calendar alerts: meetings, dates, anniversaries, flights

### Job search system — basic version implemented

`job_search` (phone) → interview interrupt → `interview` event → `accept_job_offer` / `decline_job_offer` global interactions. Remaining:
- Multiple simultaneous applications (current model: one at a time, next not possible until interview fires)
- Different company types (currently always 'similar' — same job_type)
- Job type change pathway (apply to a different kind of work)
- Negotiation (accept-with-counter, start date flexibility)
- Reference system (coworker warmth as soft modifier on offer probability)

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
- **Multi-scope reputation** — `job_standing` tracks work. Corner store, soup kitchen, food bank, street, and bus_stop now have recognition tiers (stranger/familiar/regular) via per-location `_visits` counters + `locationVisitTier()`. Street: nod from neighbor at familiar, fixture texture + serotonin +1.5 at regular. Bus stop: same few faces at familiar, travel-mug woman + serotonin +1 at regular. Single named neighbor implemented (chargen, 7 archetypes, unseen→seen→recognized→known, nod/exchange interactions, observation source). Remaining: additional block characters, longer arcs.

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

Phases 1–3 and 6 implemented (CART engine, suggested defaults, auto-advance, routine disruption). Remaining:

4. **Prose modulation** — habit strength modulates prose density. Needs content variants.
5. **Decision path → prose motivation** — tree path tells prose WHY the habit fired.
6. ~~**Routine disruption**~~ — implemented. `getHighConfidenceActions(0.65)` in habits.js; `checkRoutineDisruption()` in game.js fires after each action/move render. `adjustSentiment('routine', 'irritation', conf * 0.005)` capped at 0.008 per disrupted action. Location scoping: fixed-location interactions only disrupt at that location; `location: null` interactions disrupt anywhere their own gate blocks them. Movement habits skipped. Two idle thoughts gate on `routineIrrit > 0.4` with weight `routineIrrit * 8`. Note: movement habit disruption (e.g. habitual commute route blocked) not implemented — would require scoping move: action IDs to expected departure locations.
7. **Numeric pre-fill** — parameterized interactions pre-fill fields when confidence is high. `action.data.amount` already in action log; habit system would predict parameter values alongside action predictions.

### Financial cycle — remaining depth

Basic cycle implemented. Still arbitrary (should derive from life situation):
- Bill manifest partially derived: phone plan now varies ($25/$35/$45) by economic_origin + pay_rate (precarious or <$600 biweekly → $25; modest or <$900 → $35; otherwise $45). Remaining: rent derives from financial sim (done); utilities seasonal (done); housing-type-dependent bill variations (e.g. no separate utilities in all-inclusive rentals) not modeled
- Paycheck hours-based: `pay_rate` (hourly) × `hours_worked_period` (accumulated per shift arrived). Overtime at 1.5× above 80h/period. Remaining debts: overtime exemption for salaried/exempt roles not modeled; fixed-arrangement guaranteed minimum hours not modeled; deductions (taxes, garnishment) not modeled — `grep 'Approximation debt (paycheck)'` in content.js/chargen.js
- Utilities now seasonal via `utilitiesAmount()` (base $55 + heating/cooling load from `ambientTemperature()`); remaining debts: apartment size, insulation, heating type, local energy prices — `grep 'Approximation debt (utilities)'` in state.js

Not yet implemented:
- **Housing displacement deeper texture** — couch path (✓), shelter path (✓), street sleeping (✓) implemented. Remaining: shelter NPCs and social dynamics (other residents, staff), shelter-specific idle thoughts, shelter ambient sensory source, deeper shelter rules/intake texture. `grep 'displaced'` in state.js/world.js/content.js for all sites.
- Non-formal income patterns (gig work, cash, irregular)

### Shift variety within job types

See docs/design/work-scheduling.md. Chargen generates arrangement from job type (fixed/rotating/on_demand). Overnight wrap-around handled by `withinShift()`.

Retail/food_service day patterns: ~60% of workers get weekend-including schedules (Tue–Sat, Wed–Sun, or Sun–Thu) derived deterministically from career_stability. Low stability → more likely to have weekend shifts (less seniority to choose M–F). Corner store has Sat/Sun crowd-texture prose.

Remaining: split shifts (two separate blocks in one day). The `rotating` type shift-reveal mechanism is implemented: `reveal_tod: 6 * 60` (6am morning reveal), probabilistic day-off (~30%) with ±3hr shift-start variation, state vars `upcoming_shift_type` / `upcoming_shift_start` / `upcoming_shift_end`, NT effects on reveal, and idle thoughts for rotating workers.

### More employment types

Freelance/commissions, gig work, informal (cash), unemployed, can't work (disability/caregiving) — all reshape what "work" means. Not yet modeled even conceptually.

Capital ownership, investment income, running a business, startup, inheritance, mortgage — see docs/design/someday.md.

### Ending conditions

Runs never finish. No mechanism for a life ending or the game concluding. What triggers an ending? What does "finished" mean for a game with no win/fail state?

### Leisure and downtime interactions

`lie_there`, `look_out_window`, `sit_at_table`, `go_for_walk`, `breathwork_unguided`, `breathwork_app`, `listen_to_music` (apartment, park, street, bus_stop), `read_book`, `scroll_phone` implemented. Still missing:
- No sitting on the couch (no living room)
- **Exercise beyond walking** — `go_for_run` (street), `home_workout` (bedroom), and `yoga_home` (apartment, parasympathetic) implemented. Deferred: gym (financial gate). Gym needs a membership state variable + monthly cost + commute.

### Refeeding syndrome

After 5+ days severe restriction, eating a large meal triggers refeeding: rapid insulin → electrolyte crash → fatigue, weakness, arrhythmia. Crash arrives before feeling better.

Prerequisites: electrolyte model (see thirst debts), `refeeding_risk` state flag after N days severe restriction.

Don't implement until the starvation arc has enough prose depth to make the moment land.

### Cooking and food variety

Pantry ingredient system implemented: `pantry: { pasta, rice, canned, eggs, bread }` in state defaults. Five cook interactions (cook_pasta, cook_rice, heat_canned, cook_eggs, make_toast) at apartment_kitchen. Three buy interactions (buy_groceries_staples, buy_eggs, buy_bread) at corner_store. Perishable decay for eggs (21-day) and bread (7-day). Initial pantry from chargen backstory (financial_anxiety + economic_origin). Cooking idle thoughts when pantry has food but hasn't cooked in 3+ days. `pantryTotal()` exported.

Still deferred: full meal planning, recipe system, dietary variety (nutrition tracking, condiments, cooking skill), meal texture by time-of-day, refeeding syndrome integration, dietary needs (condition-driven, cultural, religious). See docs/design/someday.md.

### Sleep cycle approximation debts

`grep 'Approximation debt (sleep cycles)'` in state.js + chargen.js — 8 open sites (cycle lengths, SWS/REM fractions, inertia coefficients).

### Domestic object systems — remaining

Dishes, Linens, Clothing implemented (full_v1). Remaining:
- **Laundry mechanic remaining** — Full laundromat as a location node (NPCs, vending machine, etc.) deferred to someday.md. `laundry_access` derived from `housing_quality` (implemented); thresholds: ≥70 in_unit, ≥35 building, <35 laundromat.
- **Apartment features** — `housing_quality` variable implemented (chargen, character.js, state). Dishwasher implemented: `do_dishes` branches on `housing_quality >= 65`. Towel bar implemented: `housing_quality >= 40` → deterministic prose modifier on all four shower completions (no bar → "The towel's on the bed."). Clothing rack implemented: `housing_quality >= 50` → rack prose in `undress_chair` execute. `grep 'Approximation debt (housing quality)'` for formula debt.
- **(b)** Clothing fit defaults to `comfortable` until `Body.dimensionAtTime()` wired into wardrobe generation.

### Weather depth

Temperature model implemented: `ambientTemperature()` derived pure function (no stored state). Sinusoidal seasonal baseline from latitude + day-of-year, sinusoidal diurnal variation (peak 14:00), weather modifier. Feeds skin drain and vasovagal isHot check. `temperatureTier()` reads directly from it.

Remaining: full synoptic simulation (wind, humidity, pressure) — see docs/design/someday.md. Sweat rate wired to temperature for extreme heat + overdressed case only (thirst +50ml/hr in `advanceTime()`); full activity-level and humidity model not yet implemented (approximation debt in hydration).

### More phone interactions

Real phone UI implemented.

**Still missing:** Different friend response patterns to prolonged absence.

**Compulsive checking vs avoidance** — implemented as idle thought patterns in `idleThoughts()`. Compulsive checking fires when GABA-low OR NE-high OR (dopamine-low AND social-low), amplified by adenosine. Avoidance fires when NE-high + GABA-low (anxiety context) OR serotonin-low + dopamine-low (depression-adjacent). Both suppressed when viewing phone or phone service suspended.

**Phone condition** — `phone_cracked` implemented. Pending: slow phone (loading spinners), dying battery, signal layer (throttling, failed-message indicator, retry).

### Age-specific content

Basic age-shading implemented: `ageStageTier()` in state.js (`young_adult` / `adult` / `midlife` / `older`). Deterministic layer-3 modifiers at 8 key sites: waking up (alarm/depleted), work exhaustion (do_work, exhaustion_wave), bathroom mirror, money idle thoughts, `do_work` seniority/newcomer texture (all 4 tiers), `call_in_sick` anxiety vs. rehearsed fatigue, broke/scraping age variants (young_adult: futures-still-open; adult: stage-that-won't-end; midlife: narrowed-futures arithmetic; older: shorter-horizons calculus).

Still missing: radically different money *sources* by age (parental support, different job trajectories), different relationship structures, the texture of midlife vs early-adult housing instability. Teen and under-18 content (entirely different constraints).

### Family relationships

Basic version implemented: chargen generates family (type, archetype, member, name; 3 charRng calls), state has family_type/archetype/member/contact/guilt/unread, `read_family_message` and `reply_to_family` phone interactions, family message generation in generateIncomingMessages(), absence guilt in processAbsenceEffects(), idle thoughts for family guilt and absent-family silence. `call_family` implemented: 3 RNG calls, archetype-gated outcomes, pre-call dread, autism/ADHD modifiers.

Deferred:
- Hostile family avoidance loop: hostile messages building an avoidance pattern (the more you don't read, the heavier it gets, the less you can)
- Financial support pathway: supportive family can send money (occasional, not requested — unlike ask_for_help with friends)
- Housing contingent on family: supportive families as emergency housing option; hostile families as housing threat (don't fail in front of them)
- Family member coming to visit: the stakes of the apartment's state when someone from family sees it

### Content warnings and consent

Binary full/reduced toggle implemented: first-run consent screen, localStorage persistence, settings link on threshold screen. Gated in reduced mode: buy/use substance interactions (cigarettes, alcohol, cannabis), DT idle thoughts, DT pre-sleep and waking prose.

Deferred: fine-grained per-content-type toggles (domestic violence, sexual content, self-harm, etc.).

### Health system

Migraines, acute illness, dental pain, gastritis implemented. See docs/design/health.md.

**Deferred (needs upstream):**
- **Diabetes** — type 1 constitutional, type 2 must derive from backstory (diet/activity/stress history).
- **Long COVID / ME/CFS** — post-exertional malaise; needs prior illness event in backstory.
- **Eating disorders** — needs body image state variable; must derive from personality + life history, not dice roll.
- **POTS / hEDS / MCAS** — hEDS implemented (laxity >= 88 at chargen; chronic pain drift; POTS comorbidity 50% roll; joint/pain idle thoughts). MCAS implemented: 40% comorbidity roll when hEDS (Akin 2021 PMID 34199069); cleaning smell triggers nausea sensitivity (0.5 pt/hr when smell_intensity > 50); 5 idle thoughts (flushing, GI upset, skin awareness, throat itch). Full trigger catalog (heat, cold, stress, foods, exercise) remains — `grep 'Approximation debt (MCAS)'` in state.js.
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
    - **Pelvic floor dysfunction** (stress incontinence, prolapse) — risk roughly doubles with each vaginal delivery on average, but this is not uniform: **connective tissue genetics** are the dominant modifier. What's heritable: Type I/III collagen ratio (h² for prolapse ~0.43 from twin studies), elastin crosslinking quality (LOX gene variants), relaxin receptor sensitivity (proximate cause of pelvic floor loosening during pregnancy), MMP variants (collagen turnover rate). `connective_tissue_laxity` (0–100) is now generated at chargen (3 unconditional charRng calls, triangular-ish distribution centered at 50; Altman 2008 PMID 18374452 for h²). hEDS is implemented at laxity >= 88 with chronic pain and POTS comorbidity. Immediate use: joint idle thoughts fire when laxity > 70 in calm states; hEDS-specific pain thoughts fire from chronic_pain_level. Pelvic floor risk calculation deferred until pregnancy/delivery system exists. People at the low end have substantially lower risk regardless of delivery count. **Levator ani avulsion** (pubococcygeus tearing from pelvic sidewall, ~13–30% of vaginal deliveries, higher with forceps/vacuum) is a discrete injury event at delivery — a per-delivery PRNG draw, not a smooth accumulation — and is a major cause of prolapse specifically; largely irreversible without surgery. General pelvic floor fatigue (accumulation model) and avulsion injury (discrete event model) are distinct mechanisms contributing to the same condition. Avulsion is an injury — `injury_history` entry with `cause: 'vaginal_delivery'`, `onset_time`, severity. Readable by future delivery risk calculations and by prose. Other modifiers: delivery type (elective C-section substantially reduces risk), pushing stage length and technique, baby size, pelvic floor PT. Post-partum hypoestrogenic state during breastfeeding reduces tissue strength and slows recovery (reversible). Prior occurrence remains strongest predictor of recurrence.
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

**ADHD** — chargen parameter implemented (1 charRng call, 5% prevalence, Fayyad 2007 PMID 17668418). Idle thought patterns added: time blindness, initiation resistance, object permanence looping, hyperfocus. Post-selection suffix " Right." / " Still haven't." / " You know." gives reminder-to-self texture distinct from rumination's " Still." NT-shaded: adenosine×adenosineBlock + low dopamine amplify initiation resistance; high dopamine gates hyperfocus thoughts.

**Hyperfocus × habit system** — implemented. `isHyperfocusing(actionId, actionLog, currentTime)` in habits.js detects 3+ repetitions of the same action within a 60-min window. When ADHD + dopamine > 50 + streak detected, auto-advance timer shortens from 2500ms to 600ms. Approaching prose gets a deterministic energy-tier suffix (momentum vs. dissociated continuation). Idle thoughts add three hyperfocus-momentum variants (dop > 60 gate; NE-gated "don't stop" at weight 5). Anti-snowball unchanged — auto-source training weight remains 0.1 so faster firing doesn't inflate confidence. "Current interest" measure is action-streak-based — see `grep 'Approximation debt (ADHD hyperfocus)'` in habits.js.

**Autism** — chargen parameter implemented (1 charRng call, 2.3% prevalence, Lundström 2015 PMID 26185775). Sensory sensitivity floor 0.3 applied at chargen (Baranek 2006 PMID 17130462). Runtime effects: context-graded masking cost (strangers 0.8/hr at stranger locations; workplace 0.5/hr during work hours; home 0 drain + +1.5/hr unmasking recovery bonus on top of base social_energy recovery; Cassidy 2018 PMID 30266004; coefficients approximation debts — `grep 'Approximation debt (autism masking)'`), routine distress (cortisol elevated by routine irritation above 0.3 threshold; Wigham 2015 PMID 25312784). Idle thoughts: sensory overload texture (NE-weighted), masking fatigue (social_energy-weighted), routine disruption (irritation-gated), stimming in private (home locations only), unmasking texture (home + social_energy > 50; 4 thoughts), masking exhaustion (social_energy low/drained; 2 thoughts). Camouflaging prose: `talk_to_coworker` (4-tier social_energy suffix), `hang_out_with_friend` (present/deep connection, 3-tier suffix), `call_friend` (easy + awkward, 3-tier suffix, was fixed string), `visit_friend` (pre-arrival recalibration when social_energy ≥ 40). **Special interest modeling** implemented: `special_interest` chargen param (1 unconditional charRng call; 8 domains: nature/music/fiction/technology/science/craft/history/animals), stored on character + state. Aligned interactions (domain-activity map in `SPECIAL_INTEREST_ACTIVITIES`) get deterministic layer-3 prose suffix + dopamine +3/serotonin +2 via `applySIEffect()`. Idle thoughts: 3 universal + 3 domain-specific per domain (24 domain thoughts total), NT-shaded with social_energy and dopamine weights. NT effects approximation debts: `grep 'Approximation debt (special interest)'`.

Deferred: **Camouflaging with strangers** — corner store, soup kitchen, food bank interactions have no autism-specific prose layer yet (only coworkers and friends currently have camouflaging text).

### Substance system

Caffeine, nicotine, alcohol, cannabis implemented. Debts: `grep 'Approximation debt (caffeine)'` — 8 sites; `grep 'Approximation debt (cannabis)'` — 15+ sites.

**Next substances (rough priority):**
1. **Opioids** — prescription pathway (back pain that became something else). Requires healthcare access first.

**Open cannabis debts:** none — blunting now implemented as target-distance compression in drift engine.

**Recovery pathway** — cold turkey mechanic ✓, craving state ✓, location triggers ✓, NA/AA meetings minimal ✓. Remaining:
- **Medically supervised tapering** — deferred; requires healthcare access system (clinic location, prescription interactions).
- **Sponsor relationship** — deferred; new relationship slot with its own contact/warmth mechanics. `grep 'Approximation debt (recovery)'` for go_to_meeting debt.
- **Chip milestone interactions** — 24-hour chip, 30-day chip, etc. as procedural events; deferred until meeting interaction gains more depth.
- **Recovery community as ongoing social texture** — regular meeting-goers as a social context distinct from friend slots. Deferred.

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

Park added (2026-02-24): sit_on_bench, walk_in_park, leave_park. 7 min from street. Nature serotonin premium, park_ambient sensory source. listen_to_music and go_for_run now also available in park (go_for_run appends deterministic park surface note).

Library added (2026-02-24): use_computer, read_at_library, rest_at_library, leave_library. 10 min from street. Free public space — no purchase required. library_ambient sensory source (pages, AC, distant keyboards; habituationTau 30; GABA-low raises salience as hush separates into components). rest_at_library available when exhausted or stressed — honest about library as refuge. financial-anxiety-aware prose at rest. Appearance wired to rest_at_library: severe → serotonin −1.5 + prose suffix (neutral welcoming space; no NE spike). go_for_walk available from library (location: null, checks street|library). listen_to_music available from library (headphones implied). Approximation debt: library hours, computer wait times not modeled.

Friend's place: visit_friend, hang_out_with_friend, leave_friends, ask_to_stay_over, sleep_on_couch. friends_ambient sensory source.

Shelter: check_in_shelter, sleep_at_shelter, leave_shelter. 10 min from street.

Remaining: clinic. Each new place a specific texture of constrained life.

### Coworker depth

Reactive check-in implemented: `coworker_notices_absence` (≥2 days silence, warmth > 0.25) and `coworker_notices_stress` (strained/overwhelmed at work, once per day). 2 RNG calls per event, 4 variants per flavor per trigger type. Background drama implemented: `coworker_argument` (conflict overheard, ~15% daily when job_standing < 40), `coworker_good_news` (~10% daily), `coworker_overwhelmed` (~12% daily when player stress elevated), `coworker_management_tension` (~8% daily). All fire at most once per calendar day (shared `coworker_drama` cooldown). 2 RNG calls each (balanced). Flavor-agnostic — player not involved.

### Night shifts and non-standard schedules

Night shifts now generated for low-stability retail/food_service workers (`stability < 0.15` → 10pm–6am; `stability < 0.25 && anxiety > 0.60` → 11pm–7am). `withinShift()` handles overnight wrap; `isWorkHours()` checks previous day's shift for the early-morning portion of overnight shifts. Workplace descriptions and `do_work` prose have time-of-day texture for night/deep_night periods. 3am idle thoughts added (1–5am window): two sub-cases — night shift worker (solidarity of the 3am city, other people awake because they have to be) and general late-night awake (the wrongness of it, the silence's specific weight). Both weighted by adenosine (fog) and NE (hypervigilance). Sensory sources added: `night_city_ambient` (1am–6am, street/bus_stop, the city running empty with sound-gaps as texture), `night_transit` (1am–6am, bus_stop, sparse wait, whoever's here has to be), `night_workplace_light` (2am–6am, workplace, fluorescent at full contrast against outside dark). All with full LEX entries, NT-weighted prose, and chromesthesia palettes for the two sound sources. Remaining: the rotating type shift-reveal mechanism (variable-horizon scheduling, e.g. on-call) has no dedicated reveal system; current model only supports fixed-schedule shifts.

### Existing systems that need deepening

**Money at $0:**
- **The nothing option** — 12 idle thoughts for compound broke+hungry+empty state; persistence layers B (1–3 days, hunger becomes ambient background) and C (3+ days, near-silence) added via `daysSinceLast('ate')`; recovery prose added to `eat_food` and `eat_from_pantry` (flat, nausea-first, delayed relief). Remaining: mechanical consequences of extended deprivation beyond what's already modeled (appearance drift, social decay τ, financial anxiety sentiment are all continuous — no specific gaps identified beyond the prose).

**Job standing** — coworker warmth/irritation sentiment now drifts standing continuously (full rate during work hours, 30% outside). Job type precarity multiplier implemented (food_service 1.3×, retail 1.2×, office 1.0× when standing < 50; natural decay rate −0.03/hr). Pattern multiplier implemented: 2+ `work_incident` events in the last 7 days doubles the penalty of the current discrete incident (approximation debt — threshold and multiplier chosen). Currently tracks: `call_in_sick`. Future: add `work_incident` recording to any new late-arrival or poor-performance discrete penalties as they are built.

**Phone power** — battery drain and charging implemented. Future: phone model/age affecting capacity, charge rate by charger type, battery health degrading over phone lifetime.

**Gambling** — scratch tickets at corner store implemented ($2, single game). Multi-card design (10–15 games, different price points, gimmick variation, rack browsing) and symbol-level simulation (near-miss from actual symbols) deferred — see docs/design/someday.md. Pathological gambling emerges from dopamine baseline + reinforcement history, no flag.
