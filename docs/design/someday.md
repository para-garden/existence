# Someday / Maybe

Long-horizon speculative design. Not committed to. Collected here so TODO.md stays actionable.

---

## Polyphasic and segmented sleep

The current sleep model assumes one consolidated block per day. That's monophasic sleep — one cultural and historical norm among several, and not always the dominant one.

**Segmented sleep** (biphasic with a nocturnal wake period): pre-industrial Europeans commonly slept in two blocks of ~3–4h each, separated by 1–2h of wakeful activity — reading, sex, prayer, visiting neighbors. Ekirch's historical research documents this extensively. The "first sleep / second sleep" pattern may be closer to human baseline than consolidated sleep; consolidated monophasic sleep correlates with artificial light extending the evening, compressing the natural sleep window. Some people revert to this pattern spontaneously when removed from artificial light schedules.

**Biphasic with afternoon nap**: a long nocturnal anchor + a short afternoon nap. Common in Mediterranean and Latin American cultures (siesta), parts of East Asia, and throughout most of human history in warm climates. Has legitimate biological support — there's a natural circadian dip in alertness in early afternoon that is distinct from sleep deprivation. Not a cultural quirk; probably a suppressed default.

**Nap mechanics** as a distinct sleep event type — shorter than a full sleep, different restoration profile:
- *10–20 min (stage 2 nap):* improves alertness and performance without entering deep sleep, minimal sleep inertia. Partially clears adenosine. Small energy recovery.
- *30–60 min:* may enter slow-wave sleep; more restoration but produces sleep inertia on waking (~20–30 min of grogginess). Adenosine clearing more significant.
- *90 min (full cycle nap):* completes one sleep cycle including REM; restoration comparable to proportional fraction of full sleep. Inertia lower than 30–60 min because you exit from lighter stage.

The existing `sleepCycleBreakdown()` model already has the right structure — a shorter sleep just produces fewer cycles. Nap support is mostly about: allowing sleep events at any time of day, handling the circadian timing correctly (afternoon nap doesn't suppress nighttime sleep the way an evening nap does), and implementing the inertia curve for short wakes from deep sleep.

**Forced polyphasic patterns**: new parents are driven into fragmented sleep regardless of preference — not a lifestyle choice. Shift workers develop irregular patterns. The simulation should handle these as circumstances, not character choices.

**Extreme schedules** (Uberman: 6×20min, Dymaxion: 4×30min): almost no long-term safety data, sustained primarily by internet communities. Likely involve chronic sleep deprivation in most people. Not worth modeling as a stable pattern — but a character who believes in and attempts one is a real possibility, with predictable deterioration.

**Neurodivergence and sleep:** no explicit new affordances needed — it routes through existing systems — but the model's assumptions should be documented. ADHD is heavily comorbid with Delayed Sleep Phase Syndrome (DSPS): the circadian rhythm is constitutionally shifted later, so falling asleep at socially-expected times is a genuine physiological difficulty, not a discipline failure. This is the melatonin phase parameter — a character with ADHD would have a later natural onset, modeled as a shifted melatonin curve. Sleep onset insomnia is also characteristic — the ADHD brain doesn't quiet at bedtime. Hyperfocus overrides sleep signals: time blindness means not noticing it's 3am. Autistic people have documented melatonin dysregulation (timing and quantity) and sensory sensitivities that affect sleep onset — specific sounds, textures, temperature, light conditions that require management before sleep is possible. Anxiety comorbidities (high in both) compound everything. The cycle is self-reinforcing: poor sleep worsens executive function and sensory tolerance; worse baseline makes sleep harder. "Revenge bedtime procrastination" — staying up late as the only autonomous time in a heavily-constrained day — is a behavioral pattern common in both, as well as in people with chronic illness and demanding caregiving situations. The habit system might learn it; the question is whether the simulation eventually models the loss of unstructured time that drives it.

---

## Weather simulation — full model

Current model is a Markov chain over categorical states with no physical basis.

A real model would have: synoptic-scale pressure systems (highs/lows with realistic lifetimes, fronts with distinct textures — the hour before a cold front, the clearing after), diurnal cycle (temperature daily swing, afternoon convective storms in summer), ENSO as multi-year background forcing (El Niño shifts jet stream, alters where storms track — a character has systematically different winters in El Niño vs La Niña years), blocking patterns and atmospheric rivers.

For tropical characters (|lat| < 23.5°): wet/dry seasons, tropical cyclones, monsoon. Not four-season.

Implementation note: GCMs solve a different problem (predicting real atmospheric states from real observations). Here we're always generating. A simplified synoptic model — pressure gradient states, frontal lifetimes, ENSO phase as background forcing — can produce sequences within margin of error of real weather statistics at 1% of the engineering cost.

---

## Raising children

Far out — requires multiple upstream systems and a timescale the game doesn't currently model. Noted here because it's one of the largest structural constraints on adult life and the "there is no single path" principle demands it eventually.

**What children structurally change:**
- **Scheduling constraints** — drop-off, pickup, sick days, school events, nap windows. These are hard interrupts on the player's action space, not soft pressures. A sick child means you can't go to work; that's a job standing event, which is a financial event.
- **Sleep** — infant sleep disruption is severe and well-documented. Not just less sleep but fragmented sleep, which is metabolically and cognitively worse than equivalent hours of reduction. The character may be technically awake during a "rest" period without any recovery.
- **Expenses** — childcare is the dominant cost. At lower incomes, can exceed rent. Food, clothing, school supplies, medical, activities layer on. Financial pressure scales with number of children and absence of support.
- **Attention** — even "free" time is not free. The mental load (tracking appointments, developmental concerns, logistics) runs continuously in background. This is invisible labor — it costs without appearing in the action log.
- **Personal time** — the action space narrows significantly. Actions that require uninterrupted time or leaving the apartment become gated on childcare availability.

**The child as a person, not just a constraint:** the child has their own state — hunger, sleep, mood, health, developmental stage. Their temperament (easy vs. difficult) was partially generated at birth and affects everything. A difficult infant is genuinely harder; this isn't the character's failure. The child's state interrupts the player's; a crying baby at 3am is not optional to address.

**Developmental stages change the texture completely:**
- *Infant:* total dependency, sleep disruption dominant, no communication, everything physical
- *Toddler:* constant supervision, physical exhaustion, emerging will (conflict), beginning of personality
- *School age:* scheduling constraints, social complexity enters (other parents, school politics), the child starts to have an interior life you can only partially see
- *Teenager:* negotiating autonomy, the relationship becomes explicitly relational rather than caregiving — more like a difficult friendship with power asymmetry
- *Adult child:* the relationship continues at a different register; the obligation shape changes but doesn't end

The game's current timescale (days/weeks) doesn't span this without time compression. Backstory-present children (teen parent, children from a prior relationship) enter with the player already mid-arc — that's the easier implementation path.

**Single vs. co-parenting:**
- Solo parenting: all constraints apply without backup. No one to call when you're sick. Financial pressure much higher. Sleep disruption unrelieved.
- Co-parenting with partner: coordination overhead, relationship strain from parenting stress. Gottman research consistently finds relationship satisfaction drops sharply after first child, particularly for couples without strong pre-existing foundations.
- Co-parenting after separation: custody schedule structures the week externally. Communication with an ex as a recurring low-grade stressor. Child as emotional conduit.
- Support network: family nearby vs. geographically isolated — structurally different experiences of the same parenting situation.

**Intergenerational pattern:** the character's own childhood — the backstory — shapes how they parent. Consciously reacting against what was modeled is still shaped by it. The warmth/control dimensions of parenting style correlate moderately with how the character was raised, mediated by their own attachment style and insight. This connects back to the genetic inheritance section: the character is simultaneously the child of their history and the origin point of someone else's.

**Emotional texture:**
- Ambivalence is normal and almost universal — loving the child and mourning the pre-child life simultaneously. The simulation never judges this.
- Postnatal depression affects ~10–15% of birthing parents and a meaningful proportion of non-birthing parents (often unrecognized). Routes through the NT engine — not a separate flag.
- The gap between expected and actual experience. The imagined version of parenting and the lived one are almost never the same shape.

**Upstream prerequisites:** child NPC state model, scheduling interrupt system (already partially built as the interrupt queue), multi-week/month timescale or time compression, childcare as a trackable resource/cost.

---

## Employment types — capital / ownership range

Current model: office, retail, food_service (wage labor, fixed paycheck). Missing structural cases:

- **Running a business** — you are the employer. Revenue and costs as primary money relationship, not a paycheck. Decisions about others' labor.
- **Startup / burn rate** — work whose output is not yet income. Investor relationships. Runway anxiety is structurally distinct from paycheck-to-paycheck.
- **Capital income** — dividends, rental income, equity. Income without work events. Time structured around decisions, not obligations.
- **Stock/equity compensation** — RSUs, options. Income on paper before cash. Vesting schedules.
- **Stock market speculation** — income from price movement. Time structured around market hours, positions, news.
- **Mortgage** — monthly payment, equity, risk of losing the home. Structurally different from rent.
- **Inheritance** — money (or debt, or property) from death. Discontinuous economic position change. May carry family obligation, conflict. Backstory-derived.
- **Comfortable-income struggles** — mortgage anxiety, childcare costs, lifestyle inflation. Children add expenses (childcare, school supplies, food, healthcare) and hard scheduling constraints (drop-off/pickup, sick days). Maternity/paternity leave as employment interruption — unpaid leave is financial crisis for low-income workers.
- **Services at higher incomes** — hiring cleaners, laundry service, childcare. Changes what "home" and "work" mean.
- **Leisure at different income levels** — theme parks, spa, concerts, travel. Even free leisure (parks, libraries) is underrepresented. Different income tiers have different leisure landscapes.

---

## Medical procedures

- **Surgery** — recovery time, anaesthesia fog, wound care interactions. Recovery arc.
- **Gender-affirming surgery** — requires trans identity parameter, jurisdiction, financial planning, waiting lists, pre-op requirements. Post-surgical relationship to body is categorically different.
- **Medical tourism** — procedure not accessible/affordable locally. Different jurisdiction, different safety context. Cost + travel + recovery far from home.
- **Cosmetic / aesthetic procedures** — botox, fillers, rhinoplasty. Different income levels and cultural contexts. Complications: asymmetry, migration, infection, results not matching expectations, revision surgery, chronic pain from implants. Can become backstory conditions.
- **Plastic surgery complications as backstory conditions** — nerve damage, healing problems, chronic implant pain.
- **Chiropractic** — worth its own note because it sits at an unusual intersection. The evidence base is genuinely mixed: spinal manipulation for acute low back pain has moderate support (comparable to other manual therapies and NSAIDs for short-term relief; Rubinstein et al. 2012 PMID 22972127 Cochrane review); treatment claims extending beyond musculoskeletal complaints lack evidence; cervical manipulation carries a small but real risk of vertebral artery dissection and stroke (Cassidy et al. 2008 PMID 18204390 — estimate ~1/1M cervical manipulations, though attribution is contested). In practice, people use it because it's often cheaper and more accessible than orthopedics, sometimes covered by insurance when physical therapy isn't, and produces immediate tactile feedback that feels like something happened. The experience varies enormously by practitioner — from evidence-adjacent manual therapists to practitioners making broad wellness claims. For the simulation: a character with chronic back pain, work-related postural issues, or pregnancy-related musculoskeletal strain might plausibly seek it; the financial cost vs. perceived relief vs. actual evidence calculation is a real player decision; and the condition that drove them there (back pain) should be modeled upstream, with chiropractic as one possible response among several (physio, NSAIDs, rest, ignoring it).

---

## OTC medications — recreational / off-label profiles

Several legal shelf-available medications are used recreationally or off-label. Not a fringe case:

- **DXM** (dextromethorphan, cough syrup) — NMDA antagonism at high doses, dissociative, four plateaus. Nausea barrier. Tolerance builds fast. Not pleasant for everyone.
- **Codeine + promethazine ("lean")** — opioid + antihistamine sedation. Requires prescription-strength codeine (OTC in some jurisdictions). Highly habit-forming. Embedded in specific cultural contexts.
- **Diphenhydramine** (Benadryl, ZzzQuil) — used as cheap sleep aid despite rapid tolerance and rebound insomnia. Anticholinergic; delirious at high doses (dysphoric, not enjoyable).
- **Gabapentin** — prescription in US but widely diverted. Euphoric at high doses, especially with opioids. α2δ calcium channel blocker (not GABA agonist despite name, but similar subjective effect).
- **Pseudoephedrine** — decongestant, stimulant at high doses. Behind-the-counter in US (meth precursor). Available without restriction in many jurisdictions.

Each: character acquires labeled product for one reason, uses for another, or crosses a dose threshold. Model actual pharmacology.

---

## Health conditions — full list (deferred)

Conditions requiring upstream systems before chargen assignment:

- **Narcolepsy / cataplexy** — sudden muscle weakness triggered by emotion; sleep attacks. Orexin deficiency. Sleep system would need interrupt-style intrusion.
- **Fibromyalgia** — widespread chronic pain, fatigue, cognitive fog. Central sensitization. Needs chronic pain system and stress/sleep coupling.
- **Sleep apnea** — non-restorative sleep mechanic; cycle disruption model. Not assignable until upstream sleep architecture is deeper.
- **Endometriosis / PMDD** — menstrual cycle system prerequisite.
- **Lupus (SLE)** — flares, joint pain, fatigue, photosensitivity. Immune system prerequisite.
- **Rheumatoid arthritis** — joint inflammation, morning stiffness. Activity modifier.
- **Thyroid disorders** — hypothyroidism mimics depression closely; hyperthyroidism mimics anxiety.
- **Raynaud's** — cold triggers circulation cutoff in extremities. Temperature system prerequisite.
- **IBS** — stress-triggered GI symptoms; shares stomach system. Stress + gut coupling.
- **Crohn's / UC** — inflammatory bowel; distinct from IBS.
- **Celiac** — gluten triggers immune response. Dietary system + food tracking prerequisite.
- **PCOS** — hormonal imbalance, menstrual irregularity. Menstrual cycle prerequisite.
- **Chronic urticaria** — unexplained hives; mast cell adjacent.
- **Prosopagnosia** — face blindness. Affects NPC recognition.
- **Dyscalculia / dyslexia** — affects specific interaction types (reading, financial math).

**Fetal Alcohol Spectrum Disorders (FASD):** prenatal alcohol exposure → a range of outcomes depending on timing, amount, and genetic susceptibility. Not a single condition — the spectrum runs from subtle (learning difficulties, impulse control, executive function gaps) through partial FAS to full FAS (characteristic facial features, growth deficits, CNS damage). Prevalence estimates vary widely by population and method, but FASD as a whole is among the most common preventable developmental conditions. Importantly: it is underdiagnosed, frequently misdiagnosed as ADHD or conduct disorder, and the character may never have a label for what shapes their cognition. The circumstantial derivation chain: backstory generates parent(s) → alcohol use during pregnancy (itself derived from financial stress, social context, awareness, addiction history) → exposure timing and amount → FASD severity on the spectrum. The character doesn't need to know the cause. Effects route through existing systems: executive function → habit formation rates, impulse control, task-switching; attention → saliency thresholds; social cognition → relationship modeling. These are parameter shifts, not a flag.

Constitutional: genetic, probabilistic chargen with real prevalence data. Circumstantial: derive from life history (stress, diet, injury, prior illness).

---

## Immune disorders and allergies

**Autoimmune conditions** — body fighting itself. Flares are unpredictable. Chronic inflammation directly suppresses serotonin and dopamine synthesis (not just metaphorically). Most should derive from stress history and genetics, not dice rolls.

**Immunodeficiency** — HIV/AIDS (modern treatment = chronic manageable condition), CVID, post-chemotherapy. Immune system underactive; different texture from autoimmune but same unpredictability.

**Allergies as dynamic system** — adult-onset food allergies (safe for 30 years, then reaction). Desensitization / immunotherapy. Severity spectrum: intolerance → hives → anaphylaxis. MCAS: mast cells dysregulated, reactions to many stimuli (food, temperature, stress, exercise, smell). Related to allergies but broader.

---

## Scratch ticket — symbol-level simulation

Current: outcome collapsed to `{ amount, nearMiss }`. Full design:

- 9–15 panels per card; symbols determined at purchase (one RNG draw per panel), not at scratch time.
- Scratching uncovers pre-determined state — near-miss arises from seeing two matches before a non-match.
- Rendering: grid of panel elements, player reveals one by one.
- Multiple simultaneous games at corner store (10–15 games, varying price points $1–$20, different prize structures, gimmick variation — match-3, crossword, bingo, countdown multiplier).
- Available games rotate deterministically (lottery product cycles, specific games retire when top prizes claimed).
- Prize tiers per price point: research real jurisdiction data, don't invent.

Symbol simulation and rendering are coupled — with symbol state, rendering is emergent. Text-only prose fallback always present.

---

## Genetic inheritance — the parameter family tree

The backstory system already moves toward deriving character parameters from simulated history. Genetics is one upstream input into that derivation — the other being environment/experience. This section is about modeling the genetic side properly.

**The simulation already has heritability values** for personality parameters: neuroticism h²≈48%, introversion h²≈49%, trait_loneliness h²≈48%. These were used to ground the *population-level* distributions at chargen. What they haven't been used for is *individual-level* inheritance — the character's parents had parameters, and the character's parameters are partially derived from those, not drawn fresh from the population distribution.

**Proper model:** generate parent parameters first (or infer them from backstory inputs), then derive child parameters as: `child = h² × midparent + (1 - h²) × population_mean + environmental_component + noise`. The environmental component is what the backstory simulation provides — the experiences that pushed the character toward or away from their genetic baseline. This is the ACE model (additive genetic, shared environment, non-shared environment) applied per-parameter.

**Why it matters:** two siblings raised in the same home will share both genetic and shared-environment components — they'll be correlated in personality, not identical. A character's child (generated in backstory, or born during play and appearing as a future run) would inherit from the character's parameter distribution, not from the population. The family tree is a parameter tree.

**Constitutional conditions** follow the same model. If the character has a first-degree relative with bipolar disorder (h²≈85%, McGuffin et al. 2003 PMID 12742871), their own risk is ~10× population base rate. These multipliers should be generated for the parent generation and flow forward — not looked up as flat rates. The character's conditions inform their children's risk profiles.

**Passing on:** if a character has a child (backstory or in-play), that child's eventual parameters are partially fixed at conception. The child doesn't know this. The character may or may not be aware of what they're passing on — which is its own texture (genetic testing, family history conversations, noticing resemblances, worrying about inheritance).

**Ancestor depth:** for rare conditions with high h² (Huntington's, certain cardiac conditions), knowing a grandparent had it changes the picture. The simulation doesn't need to generate full pedigrees — but the backstory system noting "grandparent had X" is sufficient upstream input.

**Ancestry-stratified prevalences:** "population mean" isn't one number — it varies by ancestry. Some conditions have dramatically different carrier rates depending on ancestral origin, due to selection pressure, founder effects, or drift:

- *Sickle cell trait:* ~8% carrier in West African populations (malaria selective pressure), ~3% African-American, much lower in European populations.
- *Tay-Sachs:* ~1/30 carrier in Ashkenazi Jewish, ~1/300 general population (Kaback et al. 1993 PMID 8230592).
- *BRCA1/2 founder variants:* elevated in Ashkenazi Jewish (~1/40), Icelandic, Dutch, Norwegian — same variants appearing independently or from shared ancestors.
- *Cystic fibrosis:* ~1/25 carrier in Northern European (highest in Celtic-ancestry populations), much lower in East Asian.
- *G6PD deficiency:* common across the malaria belt — West/East Africa, Mediterranean, Middle East, South/Southeast Asia. Typically X-linked; males express fully, females can be intermediate.
- *Hemochromatosis (HFE C282Y):* concentrated in Northern European, especially Irish/Celtic descent.
- *Finnish Disease Heritage:* ~35 conditions found at elevated rates almost exclusively in Finnish-ancestry individuals — lysosomal storage, neuronal, metabolic. Classic founder effect from population isolation + bottleneck.
- *Familial hypercholesterolemia:* elevated in Afrikaner (South Africa), French-Canadian, Lebanese populations — independent founder events, same gene.

- *Mongolian spot (congenital dermal melanocytosis):* bluish-gray birthmark, typically on lower back/buttocks, present at birth and usually fading by age 5. Prevalence ~90%+ in East Asian, Native American, and some Central Asian populations; common in South Asian and African ancestry; rare (~10%) in European. Entirely benign — but has been misidentified as bruising, with documented cases of wrongful child abuse reports. If the backstory generates childhood details (medical visits, school records), this is a derivable detail with real downstream texture: the character may carry a memory of adults treating it as injury, or not — depending on who was around and whether anyone knew.

The character's ancestral origin (partially implied by latitude + cultural context in backstory) should set the `population_mean` for the relevant parameters when generating parent genetic profiles. This is not an optional refinement — using a uniform global rate for a condition with 30× variation by ancestry produces a wrong prior.

**Founder effects and small populations:** when a population descends from a small founding group, rare recessive alleles can reach high carrier frequency by chance. Iceland (deCODE genetics has mapped this extensively), Ashkenazi communities, Amish/Mennonite settlements, isolated island populations, and certain Indigenous groups all show this pattern. The same mechanism: small founding group → allele frequency drift → high carrier rates for conditions that would be vanishingly rare elsewhere. For a character from such a background, the prior on being a carrier of specific recessive conditions is substantially higher.

**Consanguinity:** first-cousin marriage roughly doubles the risk of autosomal recessive conditions relative to unrelated parents (coefficient of relationship 1/8 → inbreeding coefficient 1/16 for offspring). Some regions historically practice cousin marriage at rates of 20–50% (parts of MENA, some South Asian communities). For a character whose backstory includes a consanguineous family history — either their own parents, or prior generations — this shifts the prior on recessive conditions appearing. Not a special case: it's just a coefficient of relatedness input to the same inheritance model.

**Epigenetic complications:** trauma and chronic stress alter gene expression in ways that can be partially heritable (intergenerational trauma, glucocorticoid receptor methylation). Not a first-priority model, but worth noting: the clean separation of genetic vs environmental is somewhat fictitious. The backstory's stress history can leave marks that influence parameter generation beyond what h² predicts.

---

## Life history — alternate creation modes

The three modes (random / lived-in / sandbox) share the same simulation machinery:

- **Random:** runs unconstrained, player gets whoever it produces.
- **Lived-in:** player authors the history at pivotal forks. Fragmentary memory or question presentation (*"Did you leave when you had the chance?"*). Parameters emerge from choices.
- **Sandbox:** player specifies desired current-state outputs; simulation reverse-engineers a plausible history. **Inverse simulation**, not history bypass — given desired outputs, find backstory inputs that produce them. Approximate (simulation has noise), but coherent.

As forward simulation deepens, modes converge: "random" produces someone you feel you've met before; "sandbox" produces someone who genuinely had the life that made them this way.

---

## Acoustic space as location property

Full model: per-location `acoustic_space: { reverb, absorption, floor, ceiling_height }`.

Floor type (carpet vs hardwood vs tile) modulates perceived intensity of impulsive sounds. Acoustic adjacency is a separate graph from the movement graph — determines which sources bleed into which locations. Open-plan threshold: high adjacency. Closed door: near-zero. Solid floor: very low. Open stairwell: moderate (acoustic chimney). Double-height hall: very high.

Acoustic texture is a class marker: specific combination of floor, openness, void geometry derives from housing type → income → backstory. Don't author separately.

`acoustic_space` as observation source contributing modifiers to other sounds rather than generating standalone sentences.

---

## Phone OS flavor

iOS vs Android generated from economic origin (flagship → comfortable+, mid-range → careful, prepaid/old → tight/broke). Stored on character. CSS class applied to phone overlay.

Further flavor: older iOS (skeuomorphic textures), Android manufacturer skins (Samsung One UI density, older HTC Sense warmth). Each has different typography weight, bubble alignment, status bar layout, notification shade vs control center, app icon grid vs app drawer.

---

## Body composition

Diet + activity over time → weight drift; affects clothing fit, self-presentation, self-perception. Far out — requires food tracking, exercise tracking, timescales of weeks/months.

Body image as a state variable (does not yet exist): prerequisite for eating disorders mechanic.

---

## Pregnancy

Requires: menstrual cycle system (prerequisite for detection/tracking), body state system, multi-month timeline.

**Discovery curve** — the spread from early detection to cryptic pregnancy is a continuous spectrum, not two categories. Factors that compress visible change: strong abdominal muscle tone, first pregnancy (uterus less stretched), tall stature / long torso (more space before outward displacement), small frame (smaller baby), genetics (family patterns in how much one shows), retroverted uterus (tilts backward rather than forward — corrects itself during or near birth, but delays anterior protrusion). Any combination can produce a character who reaches late second or third trimester without visible bump, or without recognizing the cause of symptoms. Cryptic pregnancy (full-term without knowing) is the extreme end of this distribution, not a separate phenomenon.

The psychological dimension is real and runs from mundane to clinical. At the ordinary end: motivated reasoning, delayed testing, interpreting symptoms charitably. *We used protection. I've been stressed. It's probably nothing.* This isn't pathological — it's normal risk-aversion in the face of a frightening possibility. The person knows testing would resolve it; they don't test. This delay is itself a variable: how long before the character stops explaining symptoms away? Depends on the stakes (wanted vs unwanted, stable vs precarious situation), personality (neuroticism affects both anxiety-driven early testing and avoidance), and whether symptoms are ambiguous enough to support the easier interpretation.

Further along: **denied pregnancy** as a recognized clinical phenomenon — symptoms present but persistently attributed elsewhere, or genuinely not registered. This can be unconscious (affective denial — the mind doesn't form the perception even as the body changes) rather than conscious concealment. Dissociation is a plausible mechanism in cases involving unwanted pregnancy from trauma, or in people with pre-existing dissociative patterns or reduced interoceptive awareness. Pre-existing conditions act as cover: PCOS already produces irregular or absent periods (so amenorrhea explains itself), IBS explains abdominal cramping and bloating, anxiety explains fatigue and nausea, an eating disorder already distorts body perception. Fetal movement is routinely misattributed to gas or digestive cramping, especially in early or weak movement. The physical and psychological components compound — a character who carries small AND has PCOS AND has a history of dissociation has more paths to late or absent discovery than any one factor alone. Cryptic pregnancy at term is the overlap of all of them.

Multiples (twins, triplets) invert the carrying-small logic — they expand the uterus faster and larger, typically produce earlier and more visible changes, and shift due dates earlier (average twin delivery ~36 weeks, triplets ~32 weeks). They also sharply raise complication risk: preterm labor, gestational diabetes, preeclampsia, TTTS (twin-to-twin transfusion syndrome), higher C-section rate. Multiples are backstory-derivable: family history of fraternal twins (hereditary via hyperovulation), prior fertility treatment, maternal age.

Mechanically, "how much you show" is a derived parameter from these factors, and changes when/whether NPCs comment, whether the character notices, and what social responses look like.

**Hormonal cascade** — hCG, progesterone, estrogen, relaxin, prolactin each have distinct NT effects. Progesterone is GABAergic (calming early, then flat affect for some); estrogen modulates serotonin reuptake. Nausea from hCG is worst weeks 6–12, typically clears second trimester. Fatigue from progesterone. These are system prerequisites, not prose add-ons — they need to route through the NT engine.

**Complications** — genetics is a real upstream variable here. Family history of preeclampsia, gestational diabetes, preterm labor, hyperemesis gravidarum each raise individual risk. Prior pregnancy history also accumulates: each prior loss or complication shifts probabilities for subsequent pregnancies (both risk and protective directions — e.g. prior term birth lowers some risks). Complications shouldn't be random rolls against a flat population rate; they should derive from the character's family history, prior history, current state (stress, nutrition, age, pre-existing conditions). The population rate sets the distribution; the character's history determines where they land.

**Diastasis recti** — separation of the rectus abdominis along the linea alba from uterine expansion. Occurs to some degree in most pregnancies; degree varies by abdominal tone, number of pregnancies, fetal size, carrying pattern. Can persist postpartum — affects core function (lower back pain, pelvic floor instability, specific movement limitations), body perception, clothing fit. Not cosmetic: a large gap affects real capacity. Recovery is possible with targeted exercise but incomplete resolution is common. Backstory-derivable: prior pregnancies in history → prior diastasis → current severity.

**Other postpartum conditions** — pelvic floor dysfunction (incontinence, prolapse), symphysis pubis dysfunction (pelvic girdle pain during pregnancy), perineal trauma. These are chronic conditions that derive from birth history, not chargen rolls.

**Pregnancy and employment** — maternity leave (paid/unpaid by jurisdiction), job protection (varies enormously), returning-to-work arc, breastfeeding at work. Already noted under Employment types. Both connect: the body is not done with pregnancy when employment restarts.
