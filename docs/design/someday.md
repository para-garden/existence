# Someday / Maybe

Long-horizon speculative design. Not committed to. Collected here so TODO.md stays actionable.

---

## Weather simulation — full model

Current model is a Markov chain over categorical states with no physical basis.

A real model would have: synoptic-scale pressure systems (highs/lows with realistic lifetimes, fronts with distinct textures — the hour before a cold front, the clearing after), diurnal cycle (temperature daily swing, afternoon convective storms in summer), ENSO as multi-year background forcing (El Niño shifts jet stream, alters where storms track — a character has systematically different winters in El Niño vs La Niña years), blocking patterns and atmospheric rivers.

For tropical characters (|lat| < 23.5°): wet/dry seasons, tropical cyclones, monsoon. Not four-season.

Implementation note: GCMs solve a different problem (predicting real atmospheric states from real observations). Here we're always generating. A simplified synoptic model — pressure gradient states, frontal lifetimes, ENSO phase as background forcing — can produce sequences within margin of error of real weather statistics at 1% of the engineering cost.

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
