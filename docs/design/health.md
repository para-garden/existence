# DESIGN-HEALTH.md

Health as lived experience, not a stat. The player never sees "sick=true" — they see fatigue that doesn't lift, interactions that aren't there, prose that reads differently. The simulation models real biological and social mechanics. The player lives inside them.

---

## Core principle

Two kinds of health effect:

1. **Texture** — how things feel. The walk feels longer. Getting up takes longer. Prose shades toward exhaustion or pain. The same actions cost more subjectively.
2. **Concrete** — what's physically possible. Work becomes `callInSick`. Certain movements aren't available. Food choices narrow. Appointments appear.

Both matter. The simulation shouldn't reduce health to just texture (hollow) or just concrete limitations (brittle). A bad back flare is both the ache that's there when you wake up AND the interaction that isn't available today.

---

## Jurisdiction first

Healthcare access, reproductive rights, medication costs, disability support — none of these are geographic variables. They're **legal and political variables**.

Latitude does not predict abortion access. A character at 59°N in Sweden has near-universal access. One at 52°N in Poland (historically) near-total prohibition. Nordic countries have universal healthcare and high latitude. The US has fragmented, market-based coverage and lower average latitude. These are uncorrelated.

**The correct model:** `jurisdiction` is a character parameter generated at chargen — country, and where relevant, region/state within it. Healthcare access, reproductive rights, legal protections are derived attributes from jurisdiction. Drug policy, insurance system type, disability recognition, mental health coverage — all derived.

Until jurisdiction exists as a first-class chargen parameter, health access gating is an explicit approximation debt. Don't use latitude as a proxy. Don't assume the US. Name the assumption.

---

## Acute illness

### Flu / bad cold

Maps cleanly to existing systems:
- Adenosine-analog spike — fatigue that won't clear with normal rest
- NE disruption — sensory processing dulled, not sharpened
- Hunger suppression — food becomes effortful or aversive
- Sleep quality degraded even with more sleep
- Work becomes `callInSick` — job standing pressure applies

Resolves over days if you rest. Lingers if you don't. The brutal version: gig work, no sick days, can't afford to stop regardless.

**Treatment path:** over-the-counter meds (accessible, small cost), doctor visit (cost, time off, insurance gap, whether you even have a doctor). The friction of getting care is part of the simulation.

### Fever

Special case of illness. Fever sleep is not restful sleep — adenosine doesn't clear properly, REM cycles disrupted. The sleep architecture model already handles this conceptually; fever would be a multiplier on sleep quality degradation regardless of duration.

### GI illness

Faster arc than flu. Hunger/eating system disrupted — not just suppressed, actively aversive. Can't leave home easily. Resolves in 24–48 hours usually. The forced pause, the inability to do anything but wait.

### Injury

- Mobility limitations: movement options restricted or more costly in time/energy
- Work injury: job standing implications, workers' comp or not, whether the job acknowledges it
- Healing time: days to weeks. Being home doesn't mean resting — rent doesn't pause.
- Chronic pain as long tail: an injury that doesn't fully resolve, becoming a permanent background condition

---

## Dental

Specifically worth designing because it's so class-stratified and so commonly neglected. Dental care sits outside most insurance coverage; many people go years without it not from laziness but from cost.

**The arc:**
- Toothache as a state: constant low-level pain. NE elevation (hyperalgesia), stress increase, focus disruption. The kind of thing you learn to live around until you can't.
- "I've been putting this off" is a real, common experience. The simulation should model the delay, not just the resolution.
- Treatment: expensive. Requires time off. May require multiple appointments spread over weeks. Possible need for referral (specialist, oral surgeon).
- The split: emergency extraction vs. proper restoration. The poor person's version vs. the comfortable one. Both are real.
- Neglect arc: minor ache → persistent pain → abscess → emergency room. What starts as a $200 problem becomes a $2000 one plus an ER visit because the ER is the only option at 11pm on a Saturday.
- Dental insurance (separate from health, often not included, always has caps) — if the character has it, limits what it covers per year, which runs out.

**Prose:** The toothache is always there in the background. It shades narration via deterministic modifier — an ache on NE-adjacent tissue. It doesn't announce itself; it's just part of how the day goes.

---

## Chronic conditions

Generated at chargen from family history, demographic risk factors, life events — or developing during play from accumulated stress/poor sleep/lifestyle. The backstory system is the upstream mechanism; as it deepens, conditions become derived rather than random.

### Type 2 diabetes / prediabetes

- Hunger/energy interaction changes: glucose dysregulation means harder crashes after carbs, need for more consistent eating rhythm
- Medication (metformin common): daily routine, cost, refill scheduling, side effects (GI effects early on)
- Management effects: skipping medication → symptoms worsen over days not hours (models the real delayed consequence)
- Long-term: peripheral fatigue, focus issues — map to existing NT model
- Food access becomes more complex: the cheap food options are often the ones that cause the worst crashes

### Hypertension

Largely invisible until it isn't — suits the hidden-state philosophy perfectly. The player doesn't see a blood pressure reading. They see medication they take every morning, the interaction that reminds them to refill, prose that acknowledges the quiet management of a permanent condition.

- Medication: daily, costs vary, side effects (fatigue, dizziness, some people stop because of how it makes them feel)
- Stress amplifies it. The simulation already models stress as a continuous variable — hypertension could be a threshold mechanism: chronic high stress + poor management → event (not death, but a wake-up moment, a trip to urgent care, a conversation)

### Chronic pain

Back pain, fibromyalgia, migraines, nerve damage. Common, poorly understood, poorly treated, disproportionately disbelieved.

- Constant background NE elevation (hyperalgesia)
- Sleep quality degraded continuously
- Good days and bad days: flare as an event type — not random, triggered by stress + sleep debt + physical overexertion
- Complicates everything: work attendance (standing for a retail shift with a bad back), mobility (can't do laundry today), even rest (lying down doesn't always help)
- The medications: OTC (limited, ceiling effect), prescription (access, cost, stigma around pain medication, especially opioids), none at all

---

## Mental health as structural, not fluctuation

The NT model already simulates mood fluctuation naturally. Clinical depression and anxiety are different — not "in a low mood" but a persistent floor that changes what's possible. Structural, not situational.

### Depression

- Persistent dopamine/serotonin targets capped low — not a bad day, a bad baseline
- Anhedonia: things that used to matter don't register
- Executive dysfunction layer: not that you don't want to, but that the gap between intending and starting is enormous
- Treatment-seeking: cost, access, waitlists, the energy required to seek help when you have none

**Medication (SSRIs):** Takes weeks to shift. Early side effects (nausea, sleep disruption, anorgasmia) before benefit appears. Some people stop early because of the early phase. Interesting interaction with the NT model — medication would shift targets and drift rates, not snap levels. The slow turn of a large ship.

**Therapy:** Requires time (session + travel), money, energy to show up, and often a long wait. Some therapy enhances emotional processing — sleep processing rate improved, or a new mechanism. Cognitive approaches might affect rumination parameter over time.

**Crisis states:** The interaction list contracts. Only a few options remain. Gradients-not-binaries means this is still navigable, not a dead end — but the path is very narrow. This is one of the most important things to get right. The experience of having almost no moves is real and deserves honest prose.

### Anxiety disorders

- GABA targets suppressed — resting anxiety floor elevated
- Certain interactions require overcoming an availability-modulated barrier (social interactions cost more, some may not appear at very high anxiety)
- Physical symptoms: tension, NE elevation, cortisol chronically elevated
- Avoidance as a real mechanic: the interaction is there, but not taking it is also a choice the system supports

---

## Reproductive health

Requires knowing what body the character has. This is not the same as gender — they're separate dimensions. The relevant variable is reproductive anatomy, stored as a private internal field, never displayed, that gates which experiences are possible.

Chargen adds this to the schema. It's not a choice the player makes consciously — it's part of who the character is, like height or the neighborhood they grew up in.

### Menstruation

- Cycle tracking as state: `cycle_day`, `cycle_length`. Irregular vs. regular. Stress disrupts cycles (very real — delayed ovulation under stress, irregular intervals).
- PMS/PMDD: mood instability window, physical symptoms (cramping, fatigue, headache). A window of several days where the NT drift targets shift toward worse.
- Period supplies: cost (low but real), availability, the interaction of being out of supplies and broke.
- Heavy/painful periods → adenosine spike, NE elevation, work implications. "I just need to get through today."

### PCOS / endometriosis

- Chronic: pain, fatigue, irregular cycles, mood effects
- Often undiagnosed for years — could be a chargen flag that starts unresolved. The character has symptoms; they don't have a name for them yet.
- Treatment: hormonal BC, pain management, surgery for endo (longer arc)

### Contraception

If sexual activity is modeled (not yet):
- Access: OTC options now exist in the US, prescription required for others, cost, insurance coverage
- Adherence: easy to forget; schedule disruption (illness, travel) creates gaps
- Each type has a different side effect profile (hormonal changes, weight, mood, libido) — these interact directly with the NT model
- The choice of method is a character parameter, possibly modifiable during play

### STIs

Requires sexual activity to be modeled. Could be seeded in backstory (chargen generates a history).
- Often asymptomatic — detection requires testing, which requires access and choice
- Testing access: cost, availability (Planned Parenthood, free clinic, primary care), anonymity concerns
- Treatment: bacterial (antibiotics + partner notification, which has its own social cost), viral (management, disclosure as ongoing)

---

## Pregnancy

The most complex, the most important to get right. No editorializing. The simulation presents what's available given the character's actual situation. The player makes the choice.

### Detection arc

- Late period → noticing → uncertainty window. The character might track their cycle or might not.
- Pharmacy test: $10–15, requires a trip, results are private. The trip to buy it is its own moment.
- Symptoms before confirmation: nausea, fatigue, breast tenderness. Prose changes before the player knows why — the simulation is honest.
- Confirmation: home test, or clinic (cost, access, scheduling)

### First trimester experience

- Nausea: hunger system disrupted. Food aversion. "Morning sickness" is misnamed — it's all day, unpredictably.
- Fatigue: adenosine-like, doesn't clear with normal sleep. The body is doing enormous work invisibly.
- Mood instability: NT targets shifting due to hormonal changes — not character-driven, biologically driven.
- Mostly invisible to others — the character carries it alone during the period of highest loss risk.

### The decision

Three paths. The simulation presents what's accessible given the character's situation — jurisdiction, money, support, timing. No path is editorially favored. The prose doesn't shade one toward "right answer."

**Termination:**
- Access is a jurisdiction variable, not a latitude variable
- Cost: varies widely by jurisdiction, method, gestational age. In the US, medication abortion ~$150–600, procedural more.
- Wait times: some jurisdictions have mandatory waiting periods. Some have none.
- Possible need to travel: cost of travel, logistics, time off work, whether anyone knows.
- Medication abortion: can often be done at home. Involves physical discomfort over several hours. Private, but not painless.
- Procedural: clinic appointment, possibly multiple visits, recovery time.
- Emotional aftermath: varies enormously per person. The NT model handles it without prescribing a response. No guilt mechanic. No relief mechanic. The simulation is honest about the range.

**Continuing — prenatal care:**
- Cost: significant without insurance, still significant with. OB appointments, bloodwork, imaging.
- Appointments: time off work, scheduling, transportation.
- Nutrition requirements change.
- Job implications: nausea at work, eventual visible pregnancy, legal protections that vary by jurisdiction, discrimination that happens anyway.
- Partner or support person or alone — radically different experiences.

**Continuing — later pregnancy:**
- Physical limitations that grow: fatigue intensifies, mobility changes, sleep quality degrades (position constraints, frequent waking).
- Nesting behaviors (real psychological phenomenon) — could surface as habit-system behaviors.
- Financial pressure: preparation, supplies, potential childcare costs start looming.
- Maternity leave: jurisdiction variable. Some places: paid, protected. Others: none.

**Birth:**
- An event, not a long interactive sequence.
- Sleep debt explodes. This is the sleep debt model at its extreme — a newborn feeds every 2–3 hours.
- Postpartum: NT model shifts. Postpartum depression is a real phenomenon (hormone crash + sleep deprivation + enormous life change). Not all people get it. The simulation shouldn't assume either.
- The decision about feeding method (breastfeeding vs formula) is the character's — each has its own logistics, cost, and physical demands. Formula costs money; breastfeeding costs time and bodily autonomy.

**Ongoing:**
- Childcare: cost (enormous — in the US often more than rent), availability, quality.
- Schedule: everything reorganizes around the child's needs.
- The simulation becomes about navigating work + child survival simultaneously.
- Single parent vs. partner present: radically different resource profiles.
- This is a genuinely different game mode — the texture of daily life restructures around another person's needs.

---

## Architecture implications

### New state variables

- `health_conditions`: array of active conditions, each with `{ type, severity, onset, managed }`. Severity is continuous 0–1.
- `cycle_day`, `cycle_length`: for characters with cycles. `cycle_length` varies with stress (real).
- `pregnancy_week`: null, or 0–42
- `pregnancy_status`: null / suspected / confirmed / terminated / continuing
- `chronic_pain_level`: 0–1 continuous, underlying floor with flare events on top
- `dental_pain`: 0–1 continuous

### Chargen additions

- Reproductive anatomy: private internal field, never displayed. Gates which experiences are possible.
- Chronic condition seeds: family history flags, demographic risk weights. Some conditions generated at chargen, some emerging during play.
- Baseline health: affects how much energy/NE recovery is possible from a given sleep duration.
- Jurisdiction: country + region. Healthcare access, reproductive rights, drug policy all derived.

### Content

- Each active condition shades narration continuously via deterministic modifier — not announced, just present.
- Interactions appear/disappear based on health state: can't do laundry during a bad flare, certain food options unavailable during nausea, `callInSick` costs more job standing when it's already been used recently.
- Dental pain shades background prose via NE-adjacent modifier — it's always there at the relevant intensity, doesn't need to announce itself.

### Condition lifecycle

Different from sentiment accumulation — needs its own structure:
- **Onset**: gradual (chronic) or event (acute/injury)
- **Severity arc**: acute conditions peak and resolve; chronic conditions have a baseline with flares
- **Treatment effects**: medication shifts severity and/or symptom profile; no treatment → possible progression
- **Resolution**: acute conditions resolve; chronic conditions are managed, not cured

---

## Metabolism and pharmacogenomics

The same substance produces different effects in different bodies. This is not RNG — it is deterministic biology derived from genetic variation. The character doesn't know why things hit them the way they do. The body is the experiment.

This layer sits under the substance system: identical inputs → different outputs per character.

*Note: this section has no citations yet. The design direction is sound but specific prevalence numbers (e.g. ALDH2 frequency) need literature before being used in chargen.*

### CYP enzyme variation

**CYP1A2** metabolizes caffeine. Ultra-rapid metabolizers clear it in ~2–3 hours. Poor metabolizers retain it for 8–12 hours. Same dose, completely different evening. This is the most common pharmacogenomic variable a character would encounter without knowing it — the person who drinks coffee at 9pm and sleeps fine vs. the one who has a cup at noon and feels it until midnight.

Prevalence varies by ancestry. CYP1A2 ultra-rapid activity is more common in some populations; poor metabolism in others. Until ancestry is a chargen variable with this granularity, this is an approximation debt.

**CYP2D6** metabolizes codeine (converting it to morphine), many antidepressants, some antihistamines. Poor metabolizers get no pain relief from codeine. Ultra-rapid metabolizers may get dangerously high morphine concentrations. This will matter when opioid and medication systems are built.

**CYP2C19** affects PPIs (proton pump inhibitors), some SSRIs, clopidogrel. Poor metabolizers may need different doses of commonly prescribed medications.

### ALDH2 deficiency

Alcohol metabolism goes: ethanol → acetaldehyde (ALDH1) → acetic acid (ALDH2). ALDH2 deficiency means acetaldehyde accumulates. The result: flushing, nausea, rapid heart rate, headache — from the same number of drinks that produce only mild effects in ALDH2-sufficient individuals. Very common in East Asian populations (~35–40% carry at least one deficient allele).

This is invisible to the character as a named condition. They know alcohol makes them feel bad; they may not know why. The same drinks = a completely different night.

When alcohol is implemented: ALDH2 status should be a chargen variable (probabilistic given ancestry, when ancestry is a parameter). Its effect is on the acetaldehyde accumulation rate, not on BAC or subjective intoxication directly.

### Implications for chargen

Pharmacogenomic parameters are **constitutional**, not circumstantial — they arise from genetics, not life history. Random rolls at chargen are appropriate (unlike dental disease or chronic pain, which are circumstantial). Prevalence data exists per ancestry group, though ancestry as a chargen parameter doesn't exist yet.

Until ancestry is built: CYP variant status and ALDH2 status can be rolled from population-average prevalence rates, noted as approximation debts pending ancestry integration.

The player never learns these parameter names. They just notice that coffee hits differently, or that alcohol makes them feel sick fast. The simulation models the mechanism; the character lives with the effect.

---

## Implementation order

1. ~~Acute illness~~ — **implemented.** Maps to existing systems. Single state variable per episode.
2. ~~Dental pain~~ — **implemented.** Class-stratified arc, chargen gated to low-income economic origins.
3. ~~Vasovagal / orthostatic pre-syncope~~ — **implemented.** Continuous risk model; `bloodPressureTier()` proxy drives `vasovagal_risk` accumulation. `autonomic_dysregulation` constitutional condition (~4% chargen). Episode fires once at risk ≥ 90; `vasovagal_recovery` cuts energyCeiling.
4. **Menstrual cycle** — requires anatomy flag in chargen, meaningful texture for many players.
5. **Chronic conditions** — one condition to establish the pattern (chronic pain, probably). Then others follow.
6. **Mental health (structural)** — hardest to get right. Needs careful design of what "persistent floor" means mechanically without creating a dead end.
7. **Pregnancy** — most complex. Needs jurisdiction system first for access gating.

Jurisdiction as a character parameter is a prerequisite for honest pregnancy and reproductive health modeling. Build it before building those systems.

---

## Refeeding syndrome

After 5+ days severe restriction, eating a large meal triggers refeeding: rapid insulin → electrolyte crash → fatigue, weakness, arrhythmia. Crash arrives before feeling better.

Prerequisites: electrolyte model (see thirst debts), `refeeding_risk` state flag after N days severe restriction.

Don't implement until the starvation arc has enough prose depth to make the moment land.

---

## Pregnancy and contraception — detailed spec

*Moved from TODO.md — this is a design reference, not an active task.*

`pregnancy_week` state var and body.js modifiers stubbed. Full model needs:
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

### Pregnancy-related injuries

**Injuries are injuries, not footnotes on reproductive events.** A levator ani avulsion and a diastasis recti are injuries. They were caused by a delivery, but cause is context, not taxonomy. They live in `injury_history: [{ type, onset_time, severity, cause, resolved }]` alongside torn ligaments, dental abscesses, stress fractures. The reproductive history records what happened during the delivery; the injury system records what got hurt. Neither is a sub-field of the other. Risk for the next pregnancy reads current injury state (severity, resolved?) — not a conditions list nested inside a past pregnancy entry. Conditions in this class:
- **Diastasis recti** — linea alba separation, prevalence ~50–65% in third trimester; significant fraction don't fully resolve. Second pregnancy with prior diastasis: already-weakened tissue → higher risk, greater severity. Persistent diastasis: back pain, core weakness, changed abdominal profile, digestive effects in severe cases. **Severity is modifiable** (not just presence): kinesiology tape and maternity support belts reduce severity risk modestly. Pre/during-pregnancy transverse abdominis work and pelvic floor PT have better evidence. Connective tissue genetics are the dominant factor and unmodifiable. **Crunches and sit-ups worsen the gap** — `home_workout` interaction needs to branch on pregnancy + diastasis state.
- **Pelvic floor dysfunction** (stress incontinence, prolapse) — risk roughly doubles with each vaginal delivery on average, but **connective tissue genetics** are the dominant modifier. `connective_tissue_laxity` (0–100) generated at chargen. General pelvic floor fatigue (accumulation model) and **levator ani avulsion** (discrete injury event, ~13–30% of vaginal deliveries, higher with forceps/vacuum) are distinct mechanisms. Other modifiers: delivery type, pushing stage, baby size, pelvic floor PT. Post-partum hypoestrogenic state during breastfeeding reduces tissue strength (reversible).
- **Symphysis pubis dysfunction** — prior occurrence strongly predicts recurrence and earlier onset in subsequent pregnancies.
- **Connective tissue laxity** — generalized (relaxin exposure each pregnancy); affects joints, linea alba, pelvic ligaments.
- **Hormonal pattern shifts** — luteal phase length, PMS severity can drift across reproductive history.

These conditions are circumstantial (from reproductive history), not constitutional — they must derive from `reproductive_history`, not from a random chargen roll. Leave unassigned until the upstream system exists.

### Psychological effects of pregnancy loss

- **Miscarriage grief** — clinically significant (~20–30% depression/anxiety in months following; higher with recurrent loss), and specifically *disenfranchised*. hCG crash + progesterone withdrawal produce a sharp NT target shift. Due date is a recurring grief event — fits the interrupt queue. Subsequent pregnancy anxiety is near-universal.
- **Stillbirth** — PTSD rates ~30–40% at 1 month, ~25% at 6 months (PMID unverified — commonly cited but source not confirmed). Delivery still happens: labor for a baby who won't cry. Milk coming in post-delivery with no baby — can persist for weeks; purely physiological, no way to stop it cleanly. Social vacuum: people don't know what to say and often say nothing. Due date grief is acute and recurring. The specific horror of learning the pregnancy has ended and continuing to carry.
- **Termination** — relief is the most commonly reported emotion. Grief can coexist with relief. Long-term psychological harm not well-supported for chosen terminations (Foster et al., Turnaway Study, JAMA Psychiatry 2017 — PMID unverified, DOI 10.1001/jamapsychiatry.2016.4041).
- **Pregnancy denial (cryptic pregnancy)** — two types: affective (knows cognitively, can't integrate) and pervasive (genuinely unaware, ~1 in 475 reach delivery without knowing; Wessel 2002 — PMID unverified). `pregnancy_denial` flag; physical mechanics run, player-facing interactions suppressed; discovery is a discrete event.
- **Simulation architecture:** hormonal crash → NT system (serotonin/GABA/cortisol targets). Disenfranchised grief interacts with friend absence system. Anniversary events fit the interrupt queue. Subsequent pregnancy anxiety is a persistent modifier on GABA/cortisol targets.
