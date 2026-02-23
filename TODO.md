# TODO

> **Workflow note:** Parallelization via subagents is always an option. Use it freely — fire multiple Explore/research agents simultaneously for independent audits, literature searches, or design questions. Don't serialize work that can run in parallel.

## Calibration debt priorities

Audit (2026-02-23): 100 `// Approximation debt:` sites across state.js (57), content.js (16+dental), chargen.js (4), senses.js (1).

**High — foundational, visible behavioral effects:**
- NT target coupling coefficients (26 sites in state.js) — stress→serotonin, energy→dopamine, etc. all magnitude-chosen. Bounds calibrated; interaction weights aren't. Key sites: lines 2041–2098 (serotonin), 2108–2142 (dopamine), 2150–2163 (NE), 2170–2172 (GABA).
- Sleep quality multipliers — content.js:1450–1453. Directions correct, magnitudes likely too aggressive; RESEARCH-CALIBRATION.md has the cited literature already.
- GI cortisol slow pathway τ — state.js:93, 380. 210min chosen to represent genomic pathway, not measured GI kinetics.

**~~Structural debt~~** — **FIXED 2026-02-23:**
- ~~Introversion scaling~~ — `introversion` chargen param implemented. Depletion scales 0.2–0.8×, recovery scales 0.6–1.4×. At 50 = prior behavior. Approximation debt: coefficient ranges chosen, awaiting literature on introversion × social fatigue.

~~**Batch-calibratable:**~~ — **FIXED 2026-02-23:**
- ~~Dental pain magnitudes~~ — calibrated from PMC5766084, PMC4171980, PMC3819160, PMID 21383341, Hargreaves biorxiv. Tier boundaries shifted to clinical VAS cut-points (dull < 45, ache < 75, flare ≥ 75). Chewing spike +15 → +20. Hot liquid +25 and ibuprofen −35 retained as within calibrated range. See docs/research/calibration.md §Dental Pain.

**Negligible / close as-is:**
- Sleep cycle probit approximation error < 1.15×10⁻⁹ (chargen.js:479–492) — no practical effect. Mark closed.

## Code quality

### ~~content.js: raw State.get() scalar coupling~~ — FIXED 2026-02-23

Audit found and fixed content.js branching on raw numeric values instead of tier functions:
- `phone_battery <= 0` (10 sites) → `batteryTier() === 'dead'`
- `phone_battery > 5` (call_in_sick available) → `batteryTier() !== 'dead' && batteryTier() !== 'critical'`
- `illness_severity > 0` → `illnessTier() !== 'healthy'`
- `stress > 60` → `['strained', 'overwhelmed'].includes(stressTier())`
- `sleep_debt > 480` → `['moderate', 'severe'].includes(sleepDebtTier())`
- `migraine_intensity <= 20` → `migraineTierNow === 'building'`
- `dental_ache < 20` → `['none', 'dull'].includes(dentalTier())`

Left as-is (legitimate): cross-system pain comparison `dental_ache > migraine_intensity` (raw comparison between two same-scale values, not a magic constant); nausea/stomach arithmetic in `State.set()` mutations.

## Backlog

### Clothing state

Not yet modeled. The correct model is three distinct things:

- **Cleanliness/smell** — continuous state that degrades with wear, restores with washing. The primary daily-life variable.
- **Condition** — mostly stable, with rare discrete damage events (torn seam, permanent stain, elastic gone). Not a health bar that decrements daily.
- **Fit** — drifts slowly with body weight changes.

The daily-decrement-per-wear model (as in Girl Life) treats clothing like a health bar — not how wear actually works. Clothes fail from accumulation and discrete events, not constant attrition.

Prose consequence: laundry matters, smell matters, the specific state of specific items matters (the shirt that got bleach on it, the jeans that fit differently now). Clothing state feeds into self-presentation, social situations, and work interactions.

### Simulation gaps vs. daily-life completeness (Girl Life comparison)

The following are systems present in Girl Life (see docs/research/qsp-rags-prior-art.md) and absent or thin in existence. Filtered for existence's design — RPG stats, competitive rankings, magic excluded.

**Missing entirely:**

- ~~**Thirst**~~ — **IMPLEMENTED (first pass).** See STATUS.md. Fuller model approximation debts noted below.

  **First-pass approximation debts:**
  - ~~**Instant absorption**~~ — **IMPLEMENTED.** `pending_hydration` buffer with τ=20 min half-life (Shi et al. 2004 PMID 15107010). Drinking calls `addPendingHydration()`, not `adjustThirst()` directly. Excess above deficit implicitly excreted (bladder not yet modeled).
  - **Sweat rate** — thirst drain is accelerated by temperature and activity (go_for_walk), but sweat rate should also scale with stress (emotional sweating via NE/cortisol), illness fever, and humidity. Currently stress is not wired to thirst drain.
  - **Diuretics** — caffeine is a mild diuretic (already modeled as caffeine_level); accelerating thirst drain when caffeine is active is a natural coupling that isn't built yet. Alcohol, once modeled, is a stronger diuretic.
  - **Hydration content of food** — soup, fruit, and other water-rich foods partially restore thirst. Currently not modeled; all food interactions are thirst-neutral.
  - **Thirst as lagging indicator** — like hunger/hormonal satiation, thirst lags actual hydration status. Mild dehydration (NE elevation, early cognitive effects) can precede the thirst signal. Not currently modeled — thirst tier and hydration state are the same variable.

  **Fuller model (not yet relevant — note for when upstream systems exist):**
  - **Electrolytes.** Heavy sweating + drinking only plain water → hyponatremia risk (dilutional low sodium): nausea, headache, confusion, in extremis seizures. Most relevant during prolonged exercise in heat. Heavy caffeine/alcohol + heavy sweating → hypokalemia (low potassium from diuretic effect): muscle weakness, cramps, fatigue, mood effects (anxiety, irritability). These are edge-case states that would only appear under sustained bad conditions, but they're real consequences of real behaviors.
  - **Hyponatremia vs. hypernatremia** — drinking too much water vs. not drinking enough produce symptomatically different states. Currently collapsed into a single thirst scalar. Would need electrolyte tracking to distinguish.
  - **ADH (vasopressin)** — released in response to dehydration to conserve water; already exists as a placeholder NT system. When thirst/electrolyte modeling deepens, this is the hormone to wire in.

- ~~**Bladder**~~ — **IMPLEMENTED (first pass).** See STATUS.md. Pipeline: drink → `pending_hydration` → absorbed → reduces deficit OR routes to `bladder_fill` as excess. Baseline urine 40ml/hr + caffeine modifier. `use_toilet_bathroom` and `use_toilet_work`. `bladder_pang` event. NE elevated at urgent/pressing.

  **Remaining approximation debts:**
  - **Nighttime ADH antidiuresis** — during sleep, ADH (vasopressin) reduces urine production to ~10–20ml/hr. Not currently modeled; bladder fills at full 40ml/hr during sleep, so characters wake needing to urinate more urgently than is accurate on average.
  - **Cold diuresis** — ambient cold → peripheral vasoconstriction → cardiac preload → natriuretic peptide → increased urine production. Temperature not wired to urine rate (Stocks et al. 2004 PMID 14984184).
  - **Stress urgency** — NE-mediated detrusor instability increases frequency/urgency perception. NE is now in the target function but fills rate itself is not modulated by stress (Chermansky & Gebhart 2009 PMID 19234784).
  - **Attention fragmentation** — holding beyond functional capacity measurably impairs cognition. Not wired to focus/canFocus() (Tail et al. 2011, Neurourology and Urodynamics).
  - ~~**Toilet at soup_kitchen / food_bank**~~ — **DONE.** `use_toilet_soup_kitchen` and `use_toilet_food_bank` added.

### Bathroom / toilet simulation — location coverage and depth

**Current toilet coverage by location:**
| Location | Toilet | Notes |
|---|---|---|
| apartment_bathroom | ✓ `use_toilet_bathroom` | Home base. Fully accessible. |
| workplace | ✓ `use_toilet_work` | Available at aware+. |
| soup_kitchen | ✓ `use_toilet_soup_kitchen` | Available at aware+. |
| food_bank | ✓ `use_toilet_food_bank` | Available at aware+. |
| corner_store | ✓ `use_toilet_corner_store` | Available at aware+; ~12% unavailable (out of order / key missing); key-on-wooden-plank texture. |
| street | ✓ `find_public_restroom_street` | Available at aware+; ~55% find something (park/library); ~45% nothing usable. |
| bus_stop | ✓ `find_public_restroom_bus_stop` | Available at urgent/pressing only; ~20% find something nearby without missing the bus. |
| apartment_bedroom | — | Correct — bathroom is a separate location. |
| apartment_kitchen | — | Correct — bathroom is a separate location. |

**Architectural question: flat interaction vs. bathroom-as-location**

The current model treats toilets as interactions within existing locations. An alternative is dedicated bathroom sub-locations (like `apartment_bathroom`), which would support:
- **Sensory description** — each bathroom has a specific texture (the workplace bathroom's buzzing fluorescent, the soup kitchen's well-worn tiles, the corner store's locked single-stall)
- **Staying a while** — bathrooms are a common refuge. Sitting on a closed lid when overwhelmed. Crying. Privacy you can't get anywhere else in a public space. A character who needs to decompress at work but can't leave has exactly one option.
- **Mirror interaction** — checking your appearance, which exists for the apartment already and makes sense everywhere
- **Per-stall dirtiness** — a continuous state per bathroom affecting prose and potentially other interactions (reluctance to use, sensory aversion at low GABA)
- **Access gating** — corner store bathrooms are often locked (ask for key). Some food service bathrooms are staff-only. Access itself becomes a small drama.
- **Multiple occupancy** — multi-stall bathrooms (workplace, soup kitchen) create ambient social presence (other people, sounds through walls)

**Design question not yet resolved:** Should the toilet interactions remain flat (current), or should some/all upgrade to dedicated location nodes? The apartment_bathroom precedent suggests location nodes are warranted when:
1. The space supports multiple distinct interactions
2. You might want to *stay* there for a moment (not just transit through)
3. The sensory character of the space is meaningfully distinct

By that test: workplace bathroom qualifies (stay/decompress/mirror). Corner store bathroom qualifies if added (the specific grossness is the whole texture). Soup kitchen and food bank are borderline — probably fine as flat interactions.

**Corner store bathroom** — DONE. `use_toilet_corner_store` at corner_store. Available at bladder 'aware'+. ~12% unavailable (out of order / key missing). 2 RNG calls always: 1 availability check + 1 weightedPick. Key-on-wooden-plank texture prose. advanceTime(6), voidBladder(), adjustStress(-2). Remaining: upgrade to dedicated location node (decompress/mirror/stay) — see design question above.

- **Alcohol** — caffeine has full model (tolerance, withdrawal, adenosine block, habit). Alcohol is a GABA agonist — the single most common self-medication for anxiety. NT effects: GABA agonism (acute), NE/serotonin disruption (later), dopamine pulse then crash, REM suppression (sleep architecture hit), adenosine accumulation acceleration. Withdrawal is medically significant at high dependence. Would interact with existing GABA/sleep/inertia systems directly. Approximation debt until built: alcohol consumption is invisible to the simulation.

- **Nicotine/smoking** — NE and dopamine pulse, fast tolerance, withdrawal that looks like anxiety (GABA-adjacent). Very common. Like caffeine, affects what "normal" feels like and what "not having it" feels like. Would feed the existing NT systems once modeled.

- ~~**Day-of-week scheduling**~~ — **DONE (first pass).** Workplace travel gated to weekdays via `available()` on the bus_stop→workplace connection. `isWorkHours()` and `isLateForWork()` both now imply `isWorkday()`. `late_anxiety` event gated to workdays. Weekend idle thoughts added: Saturday (morning open, afternoon half-gone, evening happening elsewhere), Sunday (specific weight, afternoon week-dread, evening NE/GABA-shaded anticipation of Monday). Remaining: the corner store doesn't have weekend prose variants; non-standard schedules (weekend retail, hospitality) not yet modeled (character always has M–F schedule).

- **Menstrual cycle** — estradiol, progesterone, LH, FSH are placeholder NT systems. For characters who menstruate, these cycle over ~28 days with real mood/energy/pain effects: follicular phase (rising estradiol → elevated mood/energy), luteal phase (progesterone → fatigue, mood instability), menstruation (cramping, fatigue, prostaglandin pain signal). The NT infrastructure is there; the feeder system and associated prose (period supplies as logistics, cramps as a pain state, the cycle as calendar texture) is not. Constitutional vs. circumstantial framing: the cycle itself is constitutional (chargen); endometriosis/PMDD would be conditions.

**Thin/partial:**

- **Hygiene and shower modeling** — `showered` is a daily binary flag, which is too thin in several ways:
  - **Duration is a player variable** (like money transfers — how long is the player's choice). A 4-minute rinse and a 40-minute dissociative stand under hot water are categorically different: different time cost, different NT output, different what-it-means. Duration should be an input, not assumed.
  - **Temperature is a player variable.** Warm: GABA nudge, cortisol drop, mild NE decrease. Cold: NE spike, acute cortisol. Scalding: pain signal, skin damage over time (dryness, inflammation, broken capillaries). Player choice with mechanical consequences.
  - **Compulsive/behavioral dimension.** Long showers, scrubbing too hard — these emerge from NT state (high NE/low GABA, high rumination, withdrawal states) rather than being deliberate choices. Scratching/picking behaviors (BFRBs) can be driven by withdrawal or anxiety discharge and don't require a shower context. These should emerge from conditions, not be modeled as explicit interactions.
  - **Skin condition** is a continuous state affected by shower temperature, frequency, scrubbing intensity, humidity, diet. Separate from cleanliness. Affects prose, self-perception, social context. Scalding + over-scrubbing as a chronic pattern → visible skin damage.
  - **Frequency.** Multiple showers per day is real: post-exercise, post-distressing-event, OCD hygiene patterns, sensory seeking. The daily flag doesn't model any of this.
  - **Continuous hygiene** (`body_hygiene`, ~0–100) degrading over days (body odor, hair, skin feel) would be more honest than the binary. Restores on showering; rate/degree depends on duration and temperature. Social consequences at low tiers.
  - **Design question unresolved:** whether duration/temperature are player inputs at the interaction level (like money amounts), or whether the game infers them from NT state (compulsive behavior — you didn't choose to spend 45 minutes in there). Probably both: player can choose, but high rumination/NE state can extend a shower beyond what was intended. Same interaction, different mechanical read depending on state.

- **Body composition** — Girl Life tracks weight category, muscle, height. Existence doesn't model body composition at all. Diet + activity over time → weight drift; this affects how clothing fits (see clothing state TODO), self-presentation, and self-perception. Far out — requires food tracking, exercise tracking, and time scales of weeks/months. Note for when those systems exist.

- **Multi-scope reputation** — `job_standing` tracks work reputation. No neighborhood or community presence modeled. A character who gets food bank bags, eats at the soup kitchen, shops at the same corner store regularly, lives in the same building — they accumulate a kind of social presence in their immediate geography that is distinct from work standing. Regulars are recognized, treated differently. This doesn't need explicit tracking right now but is a gap in the eventual social model.

- **Specific consumable inventory** — existence has abstract food units and implicit painkillers. Some specific items have real logistics: umbrella (changes rain interaction availability and texture), period supplies (a logistics concern, and their absence is a stress), pain reliever (currently unlimited, should be depletable). Not all items need full inventory tracking — but a few specific ones matter enough to be real.

### NT prose shading — remaining unconverted call sites
Three-layer prose shading pattern established (see docs/design/overview.md "Prose-neurochemistry interface"): moodTone() as coarse selector, weighted variant selection via NT values, deterministic modifiers. Converted: `idleThoughts()`, `apartment_bedroom` description, `lie_there` interaction, sleep prose (23 sites), `look_out_window` (7 sites). All `Timeline.pick()` call sites converted to `Timeline.weightedPick()` with NT shading. **67/67 complete.** Priority order:

**High impact (frequent / atmospheric):**
- ~~Sleep prose (falling-asleep + waking-up, ~23 pick sites)~~ — **DONE.** Pre-sleep NTs (adenosine, GABA, NE, serotonin) shade falling-asleep; post-sleep NTs (serotonin, NE, GABA, adenosine) shade waking. Key dimensions: adenosine→sleep inertia/crash, GABA→night anxiety/can't-settle, NE→hyper-alertness/sharp edges, serotonin→dread-vs-warmth.
- ~~`look_out_window`~~ — **DONE.** Dopamine→engagement with the scene, serotonin→emotional distance, GABA→oppressive weather, NE→sensory vividness, adenosine→soft focus.
- ~~`sit_at_table`~~ — **DONE.** Dopamine→nothing to reach for, serotonin→weight-vs-warmth, GABA→can't-settle, adenosine→heavy sitting, NE→sound awareness.
- ~~`go_for_walk`~~ — **DONE.** 12 branches (6 mood × 2 weather). Serotonin/dopamine→engagement, NE→sensory vividness/irritation, GABA→anxiety-walks-with-you, adenosine→body drag.
- ~~Other location descriptions (kitchen, bathroom, street, bus stop, workplace, corner store)~~ — **DONE.** All 7 locations have NE/adenosine/GABA deterministic modifiers.

**Medium impact (periodic):**
- ~~Work event text (work_task_appears, break_room_noise)~~ — **DONE.** NE→demand sharpness, adenosine→sound blur.
- ~~Event text generators (street_ambient, apartment_sound, someone_passes)~~ — **DONE.** NE→sensory detail/hyper-awareness, serotonin→social distance.
- Work interactions (do_work, work_break, talk_to_coworker) — no Timeline.pick sites, already single-string
- Phone interactions (check_phone, read_messages) — no Timeline.pick sites

**Low priority (infrequent / already thin):**
- ~~Friend/coworker message generators~~ — **DONE.** Friend messages: dopamine→gesture-doesn't-land, serotonin→check-in-as-weight/sincerity-unbearable. Coworker chatter: serotonin→warmth-lands, NE→chatter-grates, GABA→stress-contagion. Coworker interaction: serotonin→exchange-warmth, adenosine→drift-through, NE→tension-catching.
- Shopping interactions (buy_groceries, buy_cheap_meal, browse_store) — no Timeline.pick sites
- Utility interactions (shower, eat_food, drink_water, do_dishes) — no Timeline.pick sites

### Prose compositor and sensory fragments system

A system for combining authored prose fragments into natural sentences, and a library of sensory fragments covering all sensory channels. Two connected pieces:

**1. Prose compositor** — combines typed, rhetorically-tagged fragments into grammatically coherent sentences. NT state selects the combination pattern (calm → subordination; anxious → short declaratives; dissociated → grammatical equality; overwhelmed → polysyndeton). Ordering follows attention order (involuntary body → deliberate visual → ambient). Sentence length is a pacing lever. See docs/research/prose-construction.md for the full design foundation.

**2. Sensory fragment library** — authored fragments covering all sensory channels (smell, sound, sight, taste, touch, thermoception, proprioception, interoception, nociception, vestibular). Each fragment tagged with: grammatical type, rhetorical role, trigger conditions (state thresholds, location, time, transition, co-occurrence — see docs/design/triggers.md), NT conditions for availability and weighting. See docs/design/senses.md for what each channel produces.

**Key design decisions already made:**
- Noticeability not intensity — salience is relational between stimulus and character state
- Triggers are just conditions — no fixed taxonomy (see docs/design/triggers.md)
- Fragment authoring is the quality ceiling — the compositor only combines what's there
- NT state → sentence structure (not just word choice) — same fragments, different joins

**Not yet designed:**
- Where sensory fragments live in the codebase (content.js alongside other prose, or own module)
- Whether fragments encode their own conditions or compositor queries state independently
- How compositor handles no available fragments (silent is fine; forced ill-fitting combination is not)
- Integration with existing idle thoughts system — are sensory fragments a new category or an extension?

**Sound realization uses per-source lexical sets — not acoustic dimension taxonomies.** Sound sources currently declare `quality: 'hum'` (a single label ignored by `augmentNT()`), and the realization engine routes around this by authoring lexical sets per sourceId. That is the right architecture, not a bug. No finite set of acoustic dimensions (pitch, rhythm, texture) can fully describe sound character — the fridge hum carries domestic familiarity that "low-pitch, steady, mechanical" doesn't capture, and different sources that happen to share all three dimensions would render identically. What makes sound prose vary is: (1) the procedural architecture selection — 9 sentence architectures + 3 passage shapes, all NT-driven — and (2) the authored lexical pools per source that feed that machinery. Richer sound prose comes from fuller pool coverage per source: `body_subjects`, `appositive_np`, `ambiguity_alts`, etc. so each architecture has material to work with. Acoustic dimension taxonomies would be a third thing that helps with neither. Contrast with interoceptive properties which do correctly encode dynamic state (`quality: 'gravitational'` is state-dependent, not a fixed label).

**Acoustic space as location property:**
Each location has an acoustic character — reverb, absorption, echo — that modulates how sound sources realize. `bathroom_echo` implements this as a standalone source (the tile reverb is itself the observation). But the fuller design is a per-location `acoustic_space` property (`{ reverb, absorption, ceiling_height }`) that the realization engine can use to shade sound outputs: "The fridge hums, flat." in a carpeted bedroom vs. "The fridge hums, bouncing off the walls." in a bare kitchen. This would be an observation source that always fires but contributes modifiers to other sounds rather than generating standalone sentences — or a property that `augmentNT` picks up to weight modifiers. Needs a design pass before implementation.

**Flooring and openness affect perceived sound loudness and reach:** Hard floors (tile, hardwood) reflect sound rather than absorbing it, noticeably increasing perceived intensity — especially for impulsive sounds (pipes, dropped objects, footsteps). Carpet absorbs and deadens. In an open-plan space this compounds: sound carries across multiple rooms because there are no soft surfaces or doorways to break it up. Mechanically: `acoustic_space` should include a `floor` property ('carpet'/'hardwood'/'tile') and acoustic adjacency between specific locations (not a single apartment-wide openness value). Open-plan typically connects kitchen + dining + lounge on the ground floor only; bedrooms upstairs are separated by the floor/ceiling structure as well as walls and doors — but stairwell voids are acoustic chimneys. Sound travels up an open staircase much more freely than through a solid floor, especially low-frequency content (TV, voices, the front door). A house with an open stairwell effectively has partial acoustic adjacency between ground floor and upstairs landing. Higher-end housing takes this further: double- or triple-height entrance halls where the entire lobby occupies multiple storeys — hard floors, plaster walls, high ceilings all reflecting. These act as reverb chambers connecting every room that opens onto the void, including upstairs landings and gallery corridors. Even modest versions (staircase open to the hall rather than behind a door) make the hall an acoustic hub that everything radiates from. This is another argument for adjacency being a graph with weighted edges rather than binary connections — a closed door is near-zero, a solid floor is very low, an open stairwell is moderate, an open-plan threshold is high, a double-height hall is very high. Acoustic character is a class marker: the specific combination of floor type, openness, and void geometry derives from housing type, which derives from income, which derives from backstory. A rented flat has none of this complexity. A shared house might have an open stairwell. A double-height entrance hall is a very specific income bracket. The acoustic texture of where you live should emerge from the same parameters that determine everything else about the character's circumstances — not be authored separately. Acoustic adjacency is a separate graph from the movement graph — it determines which sources bleed into which locations. The fridge hum reaches the lounge in an open-plan apartment; it doesn't reach the bedroom. Floor type modulates `perceived_intensity` within a location; acoustic adjacency determines whether remote sources appear at all. This is a real perceptual difference people notice strongly when moving between homes.

**~~Smell:~~** **DONE (first pass).** 6 sources added: `stale_air` (apartment, scales with adenosine + daylight_exposure), `dishes_smell` (apartment, mess-gated), `petrichor` (outside, rain), `cold_air_smell` (outside, temp < 4°C), `seasonal_outside_smell` (outside, temperate spring/summer/autumn), `office_ambient_smell` (work). Smell `augmentNT` flags added to realization.js. LEX entries for all 6. **Approximation debt: smell habituation is too slow.** Real olfactory habituation is ~10 min; the shared `habituationFactor()` uses τ=40 min. Smell sources linger in salience between arrivals longer than in real life. Correct fix: per-channel or per-source `habituationTau` in the observation pipeline. Remaining gaps: coffee/cooking smell (no backing state), cleaning product smell (shower/dishes aftermath — needs transient state variable), autobiographical memory trigger on specific smells (needs memory system that doesn't exist yet).

**Widen realization scope:** The engine currently only runs during idle (via `sense()`). The same pipeline could generate sensory texture in other moments: first-impression observations on location arrival (what hits you when you walk in), background observations mid-interaction (sensory grounding during do_work, commute, shower), and could replace parts of location description that are currently authored deterministic strings. Each context has different salience dynamics — arrival favors involuntary-attention sources, background favors ambient low-salience.

**Long-term habituation (location familiarity):** The current habituation model resets on every arrival — `location_arrival_time` is set in `travelTo()`, so the fridge salience is back to 1.0 every time you walk into the kitchen. That's right for a hotel room, wrong for an apartment you've lived in for two years. There's a slower timescale: accumulated familiarity with the location itself that lowers the arrival floor. Needs a per-location familiarity value (visits or total time) that persists across sessions and sets the baseline habituation on arrival. The habituationFactor floor (currently 0.4) should be dynamically lower for deeply familiar places.

**~~Change detection (delta spike):~~** **DONE.** `effective_salience = habituated_salience + change_spike`. `changeTracker` map in senses.js fingerprints each source's discrete state (string/boolean properties only — numerics excluded). On discrete state change: spike = 0.4, decays with 12-min time constant. First observation establishes baseline (no spike). Orienting response: a fridge kicking on, rain starting, a temperature tier crossing would spike above habituated floor and surface. Sources whose continuous properties drift (temperature in celsius) don't generate false positives — only tier/quality/condition label jumps trigger.

**Retire legacy fragment system:** The observation pipeline now supersedes the authored fragment library (`senses.js` fragment array + `composeFragments`). Both paths coexist at the moment. Long-term: migrate any fragments that aren't covered by observation sources, then remove the legacy path. The fragment library currently runs as dead code — `sense()` delegates to `getObservations() → realize()` and never calls `composeFragments` directly.

**Parasocial contact doesn't fill the social need:** The social decay model currently treats all contact as equivalent. Parasocial consumption — watching streams, following creators, reading someone's posts — probably partially buffers against isolation without genuinely filling the connection need. Social score partially maintained; connection quality not. The gap between those two is where the low-grade deficit lives and it's not currently modelled. Needs: a contact-quality dimension alongside contact-quantity in the social model, and a source for parasocial consumption as a distinct activity with distinct social mechanics. See docs/design/player-character.md and INFLUENCES.md further reading.

## Under Consideration

Everything below is drawn from the gap between docs/design/overview.md and what's built. Not committed to — just visible.

### Core simulation calibration debts

The numbers below are marked with `// Approximation debt:` at their code sites (state.js and content.js). They're collected here so calibration is visible as a class of work, not just scattered inline comments. Each needs real-world literature to replace the chosen value with a derived one.

**High priority — affects core pacing and emotional dynamics:**
- ~~**Adenosine accumulation: 4 pts/hr**~~ — **FIXED 2026-02-20.** Replaced linear 4 pts/hr with saturating exponential (τ=18h, ceiling=100), per two-process model. Remaining debt: cognitive load modifier absent.
- ~~**Energy drain: hunger multipliers 1.3×/1.8×**~~ — **FIXED 2026-02-20.** Reduced to 1.1×/1.3× (moderate/severe hunger), per Monk 1996 PMID 8877121 and Gailliot & Baumeister 2007 PMID 17760605. Remaining debt: flat 3 pts/hr base rate is wrong shape (circadian profile); walking should give net energy bonus. Correct fix: circadian-modulated drain + activity-type modifiers.
- ~~**NT rate constants: dopamine and NE**~~ — **FIXED 2026-02-20.** DA raised `[0.04, 0.06]` → `[0.35, 0.45]`; NE raised and asymmetry corrected `[0.08, 0.12]` → `[0.55, 0.45]`, per PMID 1606494 / PMID 6727569. ~~Remaining debt: serotonin ~1.5-2× too slow (uncalibrated)~~ — **FIXED 2026-02-23.** Raised to `[0.06, 0.08]`/hr (t½ ~9–11h), calibrated from ATD behavioral data (PMID 18452034, PMID 3931142). GABA low priority; 23 placeholder systems unresearched.
- **Serotonin/dopamine/NE/GABA target function coefficients** — every coefficient connecting circumstances (sleep quality, social, hunger, stress, work sentiment, money, guilt) to NT targets is chosen. These weights determine how strongly each life circumstance affects mood. No single calibration source — needs ecophysiology literature per system.
- ~~**Sleep quality multipliers** (all six in the sleep execute)~~ — **FIXED 2026-02-20.** Recalibrated to PSG-derived targets: overwhelmed 0.5→0.82×, strained 0.7→0.91×, starving 0.7→0.88×, very_hungry 0.85→0.94×, rain comfort 0.10→0.04, melatonin 1.05/0.85→1.03/0.90×. Circadian values unchanged (already in range).
- **Energy recovery: `sleepMinutes / 5`** — divisor 5 (= 0.2 energy per sleep minute) chosen. No derivation for the mapping between sleep duration and functional energy restoration.
- **Adenosine clearing: `0.9 × (0.4 + 0.6 × deepFrac)`** — max clearance fraction, baseline fraction, and deep-sleep weighting all chosen. Calibration: Xie et al. 2013 (Science) on glymphatic clearance during sleep.

**Medium priority — persistent background effects:**
- ~~**Stress creep: 1 pt/hr above 50**~~ — **FIXED 2026-02-20.** Replaced with exponential decay toward 0; rate 0.46/hr at baseline (t½ ≈ 90 min), halved at max rumination → 0.23/hr (t½ ≈ 3h), per Zoccola 2020 PMID 30961457. The self-escalating model had no biological basis; resistance to recovery IS the real phenomenon.
- ~~**Social decay: 2 pts/hr after 10 idle actions**~~ — **FIXED 2026-02-20.** Threshold removed; asymptotic decay τ=66h (~7 pts/10h from social=50); neuroticism ±35% scaling. `social_energy` variable added (depleted by interaction, recovered by solitude/sleep). ~~trait loneliness floor absent~~ — **FIXED 2026-02-23.** `trait_loneliness` chargen param (h²=48%, Boomsma 2005 PMID 16273322), asymptotic floor = `trait_loneliness × 0.25`. Remaining debts: τ not literature-derived.
- ~~**Emotional inertia weights: 0.5/0.3/0.2 (neuroticism/low-SE/rumination)**~~ — **FIXED 2026-02-20.** Corrected to `rumination: 0.40, neuroticism: 0.32, self_esteem: 0.28` per Houben et al. 2015 meta-analysis (PMID 25822133). Asymmetry extended to both neuroticism and rumination.
- ~~**NT target clamp bounds**~~ — **FIXED 2026-02-23.** Calibrated from clinical literature: serotonin [20,82] (ATD floor: PMC3756112, PMC3398160), dopamine [25,85] (MDD anhedonia), NE [25,88] (depression/PTSD: PMID 3415426, PMID 3588809), GABA [28,78] (Sanacora 1999 PMID 10565505). Prior floor of 10 = end-stage Parkinson's, not mood disorder.
- **Regulation capacity range [0.5–1.3] and state penalty coefficients** — **RESEARCHED 2026-02-20** (see docs/research/calibration.md §Emotional Inertia State Penalties). Current coefficients in right order of magnitude (Shields 2016: g=−0.197 to −0.300 for stress; Palmer 2024 meta-analysis for sleep loss). Structural gaps: (1) linear-above-threshold is wrong (nonlinear relationship); (2) chronic stress PFC lag absent — structural recovery takes days-weeks but model resets instantly with stress. Not yet implemented.
- **Biological jitter frequencies (0.017, 0.0073) and amplitudes (2.0, 1.5)** — chosen to be incommensurate. Real ultradian/infradian rhythms (90 min, ~28 days) could ground the frequencies; amplitudes are arbitrary.
- **Event probabilities (0.03 weather, 0.10 workplace, 0.06 apartment, 0.08 street)** — per-action rates, chosen. Per-action (not per-hour) framing makes these hard to calibrate against any real source.
- **Migraine trigger rate (0.003/hr) and 8× risk amplification** — trigger rate is directionally plausible (episodic migraine: 1–14/month) but not derived from triggering threshold data.

### System interfaces — all systems

Stable JS method signatures for every simulation system, following the model in [docs/design/objects.md](docs/design/objects.md). See **[docs/design/interfaces.md](docs/design/interfaces.md)** for the full catalog.

Currently, content.js reaches into `State.get('x')` raw scalars for most systems. Each system should expose a clean interface that hides implementation details from prose. When content reads `State.get('apartment_mess')` directly, it's coupled to the implementation. When it calls `Mess.tier()` or `Dishes.inSinkCount()`, it talks to the contract.

Interfaces are catalogued in order of implementation readiness:
1. **Domestic objects** — already in docs/design/objects.md. Clothing, Dishes, Linens replace `apartment_mess`.
2. **Food** — `Food.fridgeTier()`, `Food.canEat()` wrappers over the current scalar.
3. **Finance** — `Finance.canAfford()`, `Finance.nextBillDue()`.
4. **Job** — `Job.isWorkday()`, `Job.isLate()`, `Job.latenessMinutes()`.
5. **Weather/Geo** — temperature, season, day length from latitude + date.
6. **Substances** — caffeine first.
7. **Health** — one condition to establish the pattern.

### Mood as its own system
Full emotional architecture designed in [docs/design/emotions.md](docs/design/emotions.md). Three layers: neurochemical baseline (ambient mood with inertia), directed sentiments (emotions attached to specific targets — people, concepts, objects, traits), surface mood (emergent from both + physical state + context). Implementation path:
1. ~~**Neurochemical baseline with inertia**~~ — **IMPLEMENTED.** 28 neurochemical systems with exponential drift, asymmetric rates, biological jitter. moodTone() now reads from serotonin/dopamine/NE/GABA. Sleep, stress, hunger, social feed active systems. Mood has inertia — no more instant-snap.
2. ~~**Emotional inertia as character trait**~~ — **IMPLEMENTED.** Personality params (neuroticism, self_esteem, rumination) generated at chargen, stored in state. `effectiveInertia()` modifies drift rate for mood-primary systems only. Neuroticism adds asymmetric negative stickiness. State modifiers (sleep deprivation, poor sleep, chronic stress) increase inertia for everyone.
3. ~~**Basic sentiments**~~ — **IMPLEMENTED.** 8 categories of likes/dislikes generated at chargen (weather, time, food, rain, quiet, outside, warmth, routine). Stored as `{target, quality, intensity}` array on character. Weather/time feed serotonin/dopamine targets continuously. Food, rain, outside, warmth, quiet produce discrete nudges in interactions. Sentiment-aware prose variants in 7 interactions. Routine stored but dormant.
4. ~~**Sleep emotional processing**~~ — **IMPLEMENTED.** `State.processSleepEmotions()` attenuates sentiment deviations from character baseline each night. Rate scales with sleep quality and duration (~40% per good night). No PRNG consumed. Activated by step 5 pushing intensities above baseline.
5. ~~**Accumulating sentiments**~~ — **IMPLEMENTED.** Work dread/satisfaction from do_work focus outcomes; coworker warmth/irritation from talk_to_coworker and coworker_speaks in different moods. `State.adjustSentiment()` mutation function. Work sentiments feed serotonin/dopamine targets at workplace. Coworker sentiments modify social/stress mechanical outcomes. Sleep processing attenuates toward 0. Prose variants in doWorkProse, coworkerChatter, coworkerInteraction.
5b. ~~**Sentiment evolution mechanics**~~ — **IMPLEMENTED.** Three mechanics deepening sentiment dynamics before trauma: regulation capacity (personality-dependent sleep processing efficiency, 0.5–1.3), entrenchment + intensity resistance (dread/irritation process 40% slower, high-intensity deviations resist processing), habituation of comfort sentiments (small decay on each activation, restored by sleep).
5c. ~~**Contradictory experience**~~ — **IMPLEMENTED.** Experiences that contradict existing sentiments gently challenge them. Coworker interactions cross-reduce warmth/irritation (30–40% of primary). Relaxed work breaks cross-reduce dread. Ambivalence emerges from mixed days.
5d. ~~**Friend absence effects**~~ — **IMPLEMENTED.** Per-friend contact timestamps track last message engagement. After 1.5-day grace period, guilt accumulates each sleep cycle (~0.005–0.008/night, scaling with duration). Unread messages intensify guilt. Phone screen guilt nudge. Reading resets timer and reduces guilt. Serotonin target penalty at home. Guilt-aware idle thoughts (16 new). Sleep processing factor 0.7.
6. **Trauma sentiments** — high-intensity, processing-resistant. Connected to trauma system.

**Neurochemistry incompleteness:** 28 of ~76+ human hormones modeled. See [docs/reference/hormones.md](docs/reference/hormones.md). Missing: CRH, ACTH, GnRH, aldosterone, estrone, estriol, androstenedione, NPY, substance P, orexins, CCK, enkephalin, adrenaline, and others. Add as their relevant game systems are built.

### Habit system
Full design in [docs/design/habits.md](docs/design/habits.md). The character develops behavioral momentum from observed play patterns. Implementation path:
1. ~~**Decision tree engine + feature extraction + training + prediction**~~ — **IMPLEMENTED.** CART decision trees learn action patterns from ~34 features. One-vs-rest binary trees per action. Recency-weighted training. Trained after replay, retrained every 10 actions.
2. ~~**Suggested defaults**~~ — **IMPLEMENTED.** Medium-strength habit predictions (>0.5, modulated by routine sentiment) surface as subtle visual distinction on action buttons. Competing habits suppress suggestion.
3. ~~**Auto-advance**~~ — **IMPLEMENTED.** Predictions at ≥0.75 confidence trigger auto-advance: approaching prose (deterministic, no RNG) + highlighted action + 2500ms delay + auto-fire. Player clicks any action to interrupt. Chains naturally (morning routine flows automatically). Source-weighted training (auto=0.1). Phone mode suppressed. 30 interaction + 7 movement approaching prose functions.
4. **Prose modulation** — habit strength modulates prose density (high habit → terse, low habit → full). Needs content variants.
5. **Decision path → prose motivation** — tree path tells prose system WHY the habit fired (morning routine vs hygiene need). Needs auto-advance prose system.
6. **Routine sentiment activation** — overall habit consistency feeds routine comfort/irritation NT targets.
7. **Numeric field pre-fill from history** — parameterized interactions (e.g. `help_friend` amount) can pre-fill input fields when habit confidence is high enough. The action log already carries `action.data.amount`; the habit system would need to track predicted parameter values alongside action predictions. Input stays editable — prediction just saves typing when behavior is consistent.

### Social initiation
~~Friends only send messages to you~~ — **MOSTLY IMPLEMENTED.** `reply_to_friend` phone interaction: player replies, friend responds after 30–90 min. `message_friend` phone interaction: player reaches out first when no unread messages from that friend, picks friend by guilt/contact recency. Both reduce guilt 0.06, reset contact timer, queue response. NT-shaded prose per flavor (separate prose tables for initiating vs replying).

**Still missing:** Calling (vs texting), the different way each friend responds to prolonged vs brief absence, reaching out when no guilt exists (purely wanting to connect).

### Financial cycle — remaining depth
~~Basic financial cycle (paycheck, rent, utilities, phone)~~ — **IMPLEMENTED.** Life history backstory generates starting money, pay rate, rent. Bills auto-deduct monthly. Paycheck varies with attendance.

**Still arbitrary (should become derived):**
- **Bill types are hardcoded.** The simulation assumes everyone has the same three bills (rent/utilities/phone) plus a biweekly paycheck. This should derive from life situation: someone on gig work gets irregular payments not a biweekly; someone in shared housing has different rent + possibly no utility bill; someone on prepaid has no phone contract. The `nextBillDue()` / `nextPaycheckDays()` interfaces are right, but their backing data is hardcoded instead of being derived from character situation. Future: bill manifest generated from housing type, employment type, phone plan, etc. at chargen.
- Paycheck: flat biweekly amount. Should vary by hours worked, overtime, deductions (taxes, insurance).
- Utilities ($65 flat) — should derive from season (heating/cooling), apartment size, actual usage
- Phone bill ($45 flat) — should derive from plan type (prepaid vs contract), data usage
- Rent bracket — should derive from housing type (apartment/room/family), not just origin
- **Item prices at corner store** — `CORNER_STORE_COFFEE_PRICE` is a hardcoded constant. Should derive from character's neighborhood/local cost-of-living. A character in a high-rent area pays more for the same coffee. Same applies to buy_cheap_meal and buy_groceries ranges. Future: neighborhood economic tier generated at chargen from origin + housing.
- Personality parameters — currently random 0–100, should partially derive from upbringing events
- Friend flavors — currently random, should connect to backstory (who stays after life events?)

**Not yet implemented:**
- Debt mechanics (negative balance, overdraft fees)
- "Choose which bill to skip" interaction
- Eviction / disconnection consequences for repeated failed bills
- Spending habits shaped by personality/origin (automatic spending)
- Variable pay rates by age/experience
- Non-formal income patterns (gig work, cash, irregular)

### Shift variety within job types
Every character works the same fixed shift every day. The real landscape of work schedules is much wider:

- **Fixed shifts but varied times** — office always 9–5 is wrong even for office workers; flex schedules, early/late starters exist. Retail and food service have morning/afternoon/closing rotations, not one fixed shift.
- **Graveyard/overnight shifts** — a shift from 11pm–7am crosses midnight. `isWorkHours()` (`tod >= start && tod < end`) breaks entirely for these. `isWorkday()` (Mon–Fri) is also wrong — a night-shift worker's "work day" starts Sunday night. The whole time model assumes shifts fit within a calendar day.
- **On-demand / just-in-time scheduling** — a large portion of service workers don't have a fixed schedule at all. They get a text the night before or morning of telling them whether they have a shift, how many hours, and when. Some weeks are 25 hours, some are 12, some are nothing. The anxiety of not knowing if you're working tomorrow — and therefore if you'll have income — is a defining feature of precarious employment. The current model (fixed shift every workday) doesn't model this at all.
- **Split shifts** — two disconnected work periods in one day (e.g. restaurant lunch + dinner rush with a gap between). Not modeled.
- **Day-of-week scheduling** — retail and hospitality workers frequently work weekends and get midweek days off. `isWorkday()` is currently Mon–Fri for everyone, which is wrong for most service jobs.

**Optional overtime:** Being asked to stay late — or choosing to — is a real decision with real tradeoffs. More hours = more pay, but energy cost, personal time lost, relationship to the job. Mandatory overtime (especially in food service/warehousing) removes even the choice. Not modeled.

The fundamental problem: `work_shift_start`/`work_shift_end` is the wrong abstraction. It encodes an office-worker relationship to time — predictable, fixed, known in advance. The majority of low-income service work doesn't work this way. The right interface is something like a per-day schedule object that can express: known-in-advance fixed shift / known-in-advance variable / revealed-morning-of / not-scheduled / asked-to-come-in-last-minute / cut-early / asked-to-stay-late. The current model should be renamed an approximation debt and the interface should be designed before adding more content that depends on it.

**Freelance / commission work:** No fixed schedule, no guaranteed income. Work when you can get it. The anxiety of the empty pipeline — not knowing where next month's rent comes from — is structurally different from "will I have enough in my account." The whole relationship to time is different: no shift, no workday, no employer. Currently not modeled even conceptually.

### More employment types
Only formal employment exists (office, retail, food_service). docs/design/overview.md describes: freelance/commissions (irregular work, irregular pay), gig work (apps, deliveries), informal work (cash, no records), unemployed (looking or not), can't work (disability, caregiving, age). Each reshapes what "work" means.

The full range of economic activity the simulation currently cannot represent — not edge cases, structurally different relationships to work and capital:
- **Running a business** — you are the employer. No shift, no job standing with a boss. Decisions about others' labor. Revenue and costs as the primary relationship to money, not a paycheck.
- **Startup / raising capital** — work whose output is not yet income. Investor relationships. The specific anxiety of burn rate and runway. Time horizon entirely different from wage labor.
- **Angel investing / capital ownership** — income from ownership, not labor. Time structured around decisions, not obligations. Work as optional rather than survival-linked.

- **Stock/equity compensation** — RSUs, options, equity stakes. Income that exists on paper before it exists in cash. Vesting schedules. The relationship to a company's value distinct from your labor's value.
- **Dividends and passive income** — income that arrives without work events attached. Relationship to money structurally different from paycheck-to-paycheck.
- **Stock market speculation** — income (or loss) from price movement. Time structured around market hours, news, positions. Anxiety of a different kind.
- **Arbitrage** — exploiting price differentials across markets or contexts. Could be financial, could be reselling, could be information asymmetry. Not a job, not a business in the conventional sense.

- **Inheritance** — money (or debt, or property) that arrives from someone's death. One-time or structured. Changes the character's economic position discontinuously. May come with emotional weight, family obligation, or conflict that has nothing to do with the amount. For characters from wealthy backgrounds this is a known future; for others it's either absent or a source of family tension. Backstory-derived.
- **Gambling** — a distinct relationship to money and risk with its own NT profile. Dopamine: the near-miss effect, variable-ratio reinforcement schedules, anticipation spikes that exceed the reward itself. The house edge means it's a slow drain on average, but the variance produces wins that feel like evidence of skill or luck. Compulsive gambling emerges from NT states (low dopamine baseline → seeking strong stimulation) and reinforcement history, not a separate "gambler" flag. The specific texture: scratch tickets at the corner store, Powerball/lotto as a poverty tax, video gambling terminals (state-dependent — legal in Illinois bars/gas stations etc.), sports betting via phone apps, casino/pokies as a separate location, greyhound/thoroughbred racing, prediction markets. Each has different accessibility, different social meaning, different NT profile. Interaction with financial anxiety: gambling when broke is irrational by expected value but rational as a dopamine response to hopelessness. Gacha mechanics (in-game purchases, randomized rewards) use the same NT mechanism under a different name. **Scratch tickets at corner store: partly implemented (single $2 ticket).**

  **Scratch ticket system (multi-card design, deferred):** Real scratch ticket retailers carry 10–15+ different games simultaneously — varying price points ($1, $2, $5, $10, $20), different prize structures, different gimmicks (match-3, crossword grid, bingo card, countdown multiplier). Multiple games at the same price point is normal. The full design:
  - Each game has a name, cost, prize tier table, and RTP calibrated to that price point (higher-price games have better RTPs but still house-edge).
  - Prize tiers scale with ticket cost — actual top prizes vary widely by game and jurisdiction but typical US ranges: $1 ticket tops at $500–$2,000; $2 ticket tops at $10,000–$50,000; $5 ticket tops at $50,000–$250,000; $10 ticket tops at $250,000–$1M; $20 ticket tops at $500k–$2M+. These should be researched and derived per jurisdiction and per specific game (different games at the same price have different structures) — the current placeholder prizes in the implementation are approximation debts.
  - Gimmick variation affects prose and the "reveal" mechanic — a crossword ticket has a different texture than a match-3; a bingo card builds suspense differently.
  - **Available games rotate** — not every game is always available. New games replace retiring ones. A game you relied on may be sold out or discontinued. Changes in availability should be deterministic / simulated (lottery companies have real product cycles, specific games retire when top prizes are claimed), not arbitrary random — modeling the lottery company properly is low priority but the principle holds: changes should derive from world state.
  - **Two access modes:** (1) "Scratch ticket" — quick buy, character grabs whatever's in front, no deliberation; (2) "Look at the rack" — shows all current games. Player sees the full rack; it's a real rack with real variety. The "don't overwhelm" concern is a UI problem, not a design constraint — the full catalog should be accessible to players who want to deliberate. Habit system could learn whether this character always looks or never looks.
  - **Symbol-level simulation + rendering (deferred):** Real scratch cards have 9–15 panels, each hiding a symbol or number. The outcome emerges from which symbols are under which panels — the near-miss effect arises from seeing two matching symbols before a non-match. Currently the implementation collapses to an aggregate `{ amount, nearMiss }`. Full symbol-level state: panels and symbols are determined at ticket purchase (one RNG draw per panel), not revealed — scratching is just uncovering pre-determined state. Rendering: a grid of panel elements the player reveals one by one. Both symbol simulation and rendering are coupled — with symbol state, rendering is emergent; without it, rendering is staged. Own design pass. Text-only prose fallback always present.
  - **Pathological gambling:** compulsive play emerges from dopamine baseline + reinforcement history. No "problem gambler" flag — it emerges from the system. The simulation notices patterns (buying a ticket every visit, amount spent accumulating) without labeling them.

- **Mortgage** — a debt obligation that changes the character's relationship to housing entirely. Monthly payment, equity, the risk of losing the home. Structurally different from rent: you own something, you can lose it, the payment doesn't go up with the market but the equity does. Not modeled. Requires homeownership as a housing type.

- **Work-life balance** — the felt tension between work obligations and personal time. Currently absent: work is a fixed block, personal time is everything else. Real work bleeds into personal time (answering messages after hours, worrying about tomorrow's shift, the psychological cost of always being on-call). For salaried workers, overtime without extra pay. For precarious workers, the inability to say no to hours. The specific texture of not being able to be fully present in your personal time because work is always in the background.

- **Services that change domestic life at higher incomes** — hiring someone to clean, do laundry, care for children or elderly relatives. These don't just save time — they change what "home" means and what "work" means. The character's relationship to their own space, their own labor. Not modeled. Requires: income tiers where this becomes realistic, NPC service relationships, the specific texture of having your home managed by someone else.

- **Leisure at different income levels** — theme parks, golf, spa days, concerts, travel. These are leisure activities that require discretionary income and free time simultaneously. The simulation models almost no leisure. Even free leisure (parks, libraries) is underrepresented. Different income tiers have different leisure landscapes — this shapes what "a day off" can mean. Not modeled.

- **Comfortable-income struggles** — the simulation centers precarious working-class life, but "comfortable" income has its own texture: mortgage anxiety, childcare costs, career anxiety, lifestyle inflation, the feeling that everything is fine and there's still no room. These aren't the same struggles as broke, but they're real. The game should eventually be able to represent the full population, which includes people who aren't broke but aren't okay. Children add expenses (childcare, school supplies, food, healthcare) that restructure the entire budget — a character with kids has different breakeven points, different stresses, different relationship to every money decision. Children also restructure time: school drop-off and pickup create hard scheduling constraints, sick days require someone to stay home, childcare hours gate whether you can work at all. A parent's free time is categorically different from a childless person's free time — it's what's left after the child's needs are met, and it may be very little. Maternity/paternity leave: a period where work pauses or reduces — paid or unpaid depending on employer, jurisdiction, and job type. Unpaid leave is a financial crisis for low-income workers. The simulation has no concept of life events that interrupt employment.

These aren't aspirational features — they're part of the complete model of what "income" and "work" mean across the full population. The current model treats money as: paycheck in, expenses out. That's one configuration of economic life, not the general case.

### Ending conditions
Runs never finish. No mechanism for a life ending or the game concluding. What triggers an ending? What does "finished" mean for a game with no win/fail state?

### Leisure and downtime interactions
**Partially implemented.** Four interactions added: lie_there (stay in bed, bedroom), look_out_window (bedroom), sit_at_table (kitchen), go_for_walk (street). All have mood-dependent effects — the same action produces different mechanical outcomes depending on internal state. Still missing: TV, music, reading, mindless phone scrolling — the media/distraction layer. Also no sitting on the couch (no living room), no aimless browsing, no "do nothing" as a distinct street/bus-stop option.

**Mindfulness and breathwork:** meditation, guided breathing, body scans. NT profile: GABA upregulation (reduces anxiety), cortisol reduction (with consistent practice), serotonin effect debated. The key simulation mechanic: effectiveness depends heavily on current state — at high NE/low GABA, sitting still with your thoughts can make things worse before they get better; at moderate stress, it helps; at very low energy, it's hard to maintain attention. Consistency over days matters more than a single session — a character who meditates regularly has different baseline GABA than one who doesn't. Free to access (no cost), but requires uninterrupted time and a certain minimum cognitive capacity. App-guided (phone) vs. unguided. The trap: guided meditation apps are themselves apps on a phone that's full of other things.

**Exercise:** go_for_walk exists as basic movement. Missing the wider exercise landscape: running/jogging (different energy cost, different NT output — endocannabinoids + NE spike + endorphins, post-exercise GABA/serotonin lift), gym (requires membership = financial gate, different social context, different equipment-based interactions), yoga/pilates (different NT profile — parasympathetic, GABA-agonist effect, mindfulness component), swimming (sensory and social context distinct), home workout (no equipment cost, different limitations). Each has a different access model by income, different NT output, different social texture. A character who can't afford a gym membership has different options than one who can. Exercise is also mood-dependent in its effects: sometimes it helps, sometimes (low energy, high NE) it makes things worse. The simulation's "walking doesn't always help" principle applies to all exercise.

### Refeeding syndrome

When someone has been severely food-restricted for days, eating a large meal can trigger refeeding syndrome: reintroducing carbohydrates causes rapid insulin release, which drives phosphate, potassium, and magnesium from blood into cells. The resulting electrolyte crash causes fatigue, muscle weakness, confusion, cardiac arrhythmia — in severe cases, fatal. Clinically significant after ~5+ days of very low intake or prolonged severe restriction.

Simulation relevance: a character who has been at `starving` tier for multiple consecutive days and then eats a full meal shouldn't just feel better. The immediate aftermath should feel worse before it feels better — energy drop, NE spike, nausea, muscle weakness. This is the body's chemistry being surprised by food after absence.

Prerequisites before this is implementable:
- `consecutive_meals_skipped` already exists in state — could track days at severe restriction instead
- Electrolyte model doesn't exist yet (see thirst TODO — hypokalemia, hyponatremia)
- A `refeeding_risk` state flag (set after N days severe restriction, cleared once eating normalizes) would gate the mechanic without requiring full electrolyte simulation

This is a low-probability, high-fidelity mechanic — only relevant for characters in genuine food insecurity spirals, which the game does model. Don't implement until the starvation arc has enough prose depth to make the refeeding moment land.

### Cooking and food variety
Only "eat from fridge" and "buy cheap meal." No cooking (time + energy + ingredients), no meals that feel different, no dietary texture. docs/design/overview.md describes food as deeply personal — comfort food, cultural food, what's in the fridge vs what you need.

### ~~Alarm negotiation~~
~~The alarm fires as an event but there's no snooze, no "turn it off and go back to sleep," no choosing not to set one. docs/design/overview.md describes the alarm as a negotiation between the person who set it and the person who hears it.~~ — **IMPLEMENTED.** snooze_alarm and dismiss_alarm interactions. Snooze escalates (fog → negotiation → guilt), dismiss varies by snooze count. Sleep debt, melatonin, circadian alignment, REM cycle model all integrated into sleep. See "Deep sleep model" in STATUS.md.

### Sleep prose
**Largely implemented.** Sleep prose now has two phases: falling-asleep (how sleep came) and waking-up (the gradient back to consciousness). Waking prose branches on post-sleep energy, sleep quality, alarm vs natural, time of day, mood, sleep debt, and sleep inertia — ~44 waking + ~22 falling-asleep variants. Alarm negotiation implemented (snooze/dismiss). Slept-through-alarm awareness. Still missing: insomnia/not-sleeping as a distinct experience, dreaming.

**Sleep cycle approximation debts:**
- ~~`sleep_cycle_length` is drawn uniformly from 70–120 min.~~ **FIXED.** Now uses truncated normal (mean=93, SD=12, clipped [70,120]) via Peter Acklam's probit rational approximation — exactly 1 RNG call, per Blume et al. 2023 (Sleep Health, n=6,064 PSG). Remaining approximation debt: rational probit introduces small tail error (~10⁻⁹ max); negligible in practice.
- Cycle shape ratios `[0.83, 1.0, 1.11, 1.17]` are derived from the population-mean structure (75/90/100/105 min ÷ 90). PSG confirms the qualitative direction (first cycle shorter, later longer driven by REM growth, not NREM growth). No universal quantitative ratios exist in PSG literature — per-character variation is high.
- `cycleFracs()` coefficients — `k=0.57` (deep decay), slope=`0.07` (REM growth), cap=`0.55` (REM max), cycle-0 anchors (`deep=0.50`, `rem=0.10`) — produce correct overall staging targets (20% N3, 25% REM for 8h sleep, matching meta-analytic consensus). Per-cycle distribution has known mismatches vs PSG: cycles 2–3 have too much N3 (model: 16%/9%, PSG: 0–10%/0–5%). Steeper k (e.g. 0.47) would fix per-cycle distribution but would push overall N3 below the validated 20% target — a fundamental tension that requires adjusting the cycle-0 anchor to compensate.
- ~~**Age-dependent N3 scaling not modeled.**~~ **FIXED.** `cycleFracs()` now scales deep-sleep anchors by an age factor: linear interpolation from 1.0 at age≤25 to 0.2 at age≥50 (Van Cauter et al. 2000, JAMA, n=149). `age_stage` stored in state, set by `applyToState()`. Remaining approximation debts: (1) linear interpolation from two anchor points — real relationship is non-linear (steep drop in 3rd decade, plateau later); (2) only deep-sleep anchors scaled, not full cycle shape; (3) REM not age-adjusted (negligible per Joffe et al.).
- **Sleep inertia duration extension not modeled.** CSR research (McCauley/Rajaraman, PMC6519907) shows chronic restriction produces ~7× longer inertia duration (10 min → 70 min recovery time). Currently only magnitude is amplified via `debtAmp`; full cognitive recovery timecourse is collapsed into the single `sleepInertia` scalar. A separate `inertia_clearance_rate` variable would be needed to model duration extension.
- Sleep apnea (non-restorative sleep mechanic) would require its own cycle disruption model — not assignable at chargen until upstream exists.

### Domestic object systems
Full design in [docs/design/objects.md](docs/design/objects.md). Mess is not a scalar — it's emergent from the states of real objects. The current `apartment_mess` variable is an acknowledged approximation debt. See [docs/design/philosophy.md](docs/design/philosophy.md) for the interface/granularity model that applies here.

**Current state (approximation debt):** `apartment_mess` scalar shapes prose at 4 tiers in bedroom, kitchen, bathroom. `messTier()` in state.js. `apartment_notice` event is NT-shaded. Prose works but is fundamentally limited — "dishes in the sink" comes from a number, not dishes.

**Implementation path (from docs/design/objects.md):**
1. ~~**Define interfaces**~~ — **DONE.** See [docs/design/interfaces.md](docs/design/interfaces.md).
2. ~~**Coarse implementations**~~ — **DONE.** `js/dishes.js`, `js/linens.js`, `js/clothing.js` — count-based backends. Wired in context.js + game.js. content.js updated throughout.
3. ~~**Remove `apartment_mess`**~~ — **DONE.** `apartment_mess` scalar removed from state.js. `messTier()` moved into content.js, computed from Dishes + Linens + Clothing. Bedroom, kitchen, apartment_notice all use local `messTier()`. Four tiers: tidy / cluttered / messy / chaotic. **Maintenance debt:** `messScore()` and `messTier()` are now duplicated verbatim in both `content.js` and `world.js` (world.js needs them for transition-based apartment_notice). If tier thresholds change, both must be updated. Long-term fix: expose via a shared `Mess` context object or pass a `getMessTier` callback from context.js. See note in world.js.
4. **Full implementations** — per-item tracking, one system at a time. Clothing first (wardrobe generated at chargen, items with location/wear states, undressing shaped by mood/energy).
5. **Laundry mechanic** — currently stubbed as 3 interactions (start_laundry / move_to_dryer / fold_laundry) in apartment_bedroom, assuming in-unit machines. This is an approximation debt: laundry path should derive from housing situation (in-unit machines → current flow; building laundry room → separate location; laundromat → travel + location; hand-wash → sink interaction). Multiple paths, not one universal. Housing type not yet a backstory parameter.

**Prose that becomes possible at full granularity:** "the shirt you've worn three days running," "three plates and a mug since Tuesday," specific items on specific surfaces, eating without a clean dish to use.

### Weather depth
Only 4 weather states (overcast/clear/grey/drizzle + snow), no real temperature model, no dynamics. docs/design/overview.md describes weather as atmosphere — the grey day that sits on you, rain changing what the street feels like.

**Proper weather simulation (backlog):** The current model is a Markov chain over categorical states with no physical basis. A real weather model would have layers:

- **Synoptic scale (weather systems):** High and low pressure systems with realistic lifetimes (days to weeks), movement direction, and associated weather. Fronts — cold, warm, occluded — have distinct textures: the hour before a cold front arrives, the clearing after passage. A low pressure system is days of grey before it matters; a cold front is an afternoon that changes. These are the timescales of real weather experience.

- **Tropical weather:** Characters at |lat| < 23.5° have wet/dry seasons, not four-season. Tropical cyclones (typhoons, hurricanes) — rare but catastrophic. Monsoon patterns, heat with humidity distinct from heat without.

- **ENSO (El Niño/La Niña):** A multi-year background forcing that shifts precipitation and temperature patterns globally. El Niño warms the eastern Pacific, shifts the jet stream, alters where storms track. A character in the same location has systematically different winters in El Niño vs La Niña years. This is a multi-year state the simulation could carry — relevant for runs that span years, and for backstory generation.

- **The jet stream and mid-latitude dynamics:** Blocking patterns (high pressure ridges that stall), omega blocks, cut-off lows. The "atmospheric river" that dumps a week of rain. Weather in the 30–60° band is fundamentally about wave patterns in the jet stream. These produce the persistent anomalies (the unusually warm winter, the brutally cold snap) that are memorable.

- **Diurnal cycle:** Temperature has a daily cycle (already partially modeled), humidity peaks near sunrise, afternoon convective thunderstorms in summer. These don't require synoptic-scale simulation — they can be parameterized from season and location.

- **Implementation note:** GCMs solve a fundamentally different problem: they predict real atmospheric states forward from real observations, with real ground truth to validate against. We have no ground truth — we're generating a fictional world. "Prediction" as a concept is meaningless here; we're always generating. The question is just whether the generation is physically grounded (consistent with how weather actually behaves). A simplified synoptic model — pressure gradient states, frontal system lifetimes and movement, ENSO phase as a background forcing — can produce sequences within margin of error of real weather statistics at the timescales that matter, at a small fraction of the complexity. 99% of the perceptual fidelity at well under 1% of the engineering cost. The current random walk over categorical states has no physical structure and produces only plausible-looking noise.

### Clothing and getting dressed
Currently: outfit sets selected at chargen, 3 prose variants each (default/low_mood/messy). No item tracking, no laundry, no choosing what to wear. This is superseded by the domestic object systems design — see above and [docs/design/objects.md](docs/design/objects.md). Getting dressed becomes: `Clothing.canGetDressed()` gates availability, `Clothing.wear()` picks and marks an item, outfit prose derives from what was actually put on.

### More phone interactions
~~Phone is check-only.~~ **Real phone UI incoming.** Phone now renders as a full HTML5 overlay: home screen (time, battery, Messages badge), messages list (per-contact rows, unread dots), threaded conversation view (bubble layout, sent/received), in-thread compose. Navigation (home→list→thread→back) is transient state, not recorded. Only actions with game effect (reply, message_friend, put_phone_away) go through the normal action pipeline.

**Future phone apps (not yet implemented):**
- **Notes** — player can write/read notes; each note saved as a state object; writing/deleting are recorded actions; pure navigation within the app is not
- **Alarm** — in-phone alarm clock UI replacing the current interaction-based set/skip flow; multiple alarms, snooze management; setting/cancelling alarms are recorded actions
- **Calendar** — view upcoming events, work schedule; possibly editable reminders; editing entries is a recorded action
- **Timer / Stopwatch** — utility app; could feed game mechanics (timed tasks, pomodoro-style focus); start/stop recorded only if they have game effect
- **General principle**: each in-phone app manipulation that has game effect is a recorded action. Pure navigation within an app is not.

**Personalization layer (not yet implemented):** Phone background (wallpaper image or color), lock screen photo, ringtone/notification sounds — cosmetic player choices that make the phone feel owned. Set via a Settings app. Each change is a recorded action (it changes persistent state, the replay should show it). The right wallpaper is a tiny assertion of selfhood.

~~**`toggle_phone_silent` temporarily inaccessible**~~ — **FIXED.** Silence toggle on home screen (tap to mute); "silent" indicator in status bar on all screens (tap to unmute).

**Face-down DND** — some phones (and some people) use placing the phone face-down as a temporary "don't interrupt me" gesture. Could be a location-specific interaction (put_phone_facedown at kitchen table, desk, bedside, bathroom counter before shower) that suppresses notifications until the player picks it back up. Different texture from full silent mode — not a setting, just a posture. The phone is still there, still accumulating messages; you're just choosing not to see them right now.

**Shower as a phone-free moment** — the shower is one of the few natural pauses from the phone. Some people bring it in anyway (waterproof case, propped on the shelf, half-watching something). Most don't. Either way there's a texture here: the 10 minutes where you can't check it even if you want to, and what that feels like depending on whether there's something you're waiting for or avoiding. Could feed into compulsive-checking patterns — coming out of the shower and immediately reaching for the phone is a specific gesture worth capturing.

**Still missing:** Calling (vs texting), the different way each friend responds to prolonged vs brief absence, reaching out when no guilt exists (purely wanting to connect). Compulsive checking vs avoidance as distinct behavioral patterns.

**Phone OS flavor** — the UI currently has no platform identity. Characters could have iOS or Android phones (generated at chargen), and the UI would reflect that: different typography weight, bubble alignment conventions, status bar layout, notification shade vs control center, app icon grid vs app drawer. Further flavor: older iOS versions (skeuomorphic textures, different type scale), Android manufacturer skins (Samsung One UI density, older HTC Sense warmth). Platform should be generated from economic origin and backstory (flagship → comfortable+, mid-range → careful, prepaid/old → tight/broke), stored on character, and drive the CSS class applied to the phone overlay.

**Phone condition** — ~~cracked screen basic overlay~~ **IMPLEMENTED.** `phone_cracked` boolean on character, generated at chargen from `economic_origin` (precarious 55%, modest 30%, comfortable 8%, secure 1%), 1 charRng call. CSS overlay (`.phone--cracked::after`) — hairline linear-gradient crack lines on the phone element. Condition affects texture, not function. Still pending: screen protector as a middle layer (cheaper than repair, still broken), slow phone (loading spinners between screens), dying battery that won't hold charge past noon, signal layer (bad wifi at home, weak 4G dead spots, prepaid throttling, failed-message indicator with retry). Each a small daily friction that accumulates.

### Age-specific content
age_stage is a number (22–48 default range) but no prose varies by age. docs/design/overview.md describes radically different daily textures for children, teens, young adults, adults, older adults — different work, different money sources, different phone use, different constraints.

### Family relationships
No family exists in the simulation. docs/design/overview.md describes: supportive / conditional / hostile / absent parents. Financial cutoff. Housing contingent on family. The phone call you dread. Siblings. The weight of family as unchosen.

### Content warnings and consent
No content level configuration. docs/design/overview.md describes: baseline tier (everyday struggles), full tier (DV, abuse, addiction, etc.), fine-grained toggles per category. Configuration before character generation, revisitable between runs.

### Health system
~~No health conditions exist.~~ Migraines (chronic), acute illness (flu/cold/GI), and dental pain (chronic) implemented. Remaining: chronic conditions (diabetes, chronic pain), mental health as structural, pregnancy.

**Diabetes (type 1 and 2):** blood sugar regulation impaired; produces recurring felt interoceptive experiences — hypoglycaemia (shakiness, sweating, racing heart, urgent hunger, cognitive degradation; symptoms overlap heavily with anxiety — the game doesn't need to disambiguate) and hyperglycaemia (thirst/urination loop, fatigue, specific brain fog distinct from adenosine fog, blurred vision). Post-meal spike and crash relevant even for non-diabetic characters (simple carbs → brief good feeling → drop — the afternoon slump). Type 1 is constitutional (autoimmune destruction of beta cells, onset usually childhood/young adult); type 2 is circumstantial (metabolic, develops over years, strongly correlated with diet/activity/stress history — must derive from backstory, not a dice roll).

~~**Vomiting event — implement next:**~~ **FIXED.**
`pending_vomit` flag in state. Chance roll in `advanceTime()` when `nausea > 75` (rate 0–0.2/hr, scaling with nausea 75–100). `checkEvents()` in world.js fires and clears the flag — deterministic, no RNG at fire site. `eventText.vomit` in content.js: branches on `stomachTier()` (empty → dry heave, else → expulsion) and location (bathroom vs. not). Prose: `Timeline.weightedPick()` with NT shading (adenosine fog, NE adrenaline sharpness, GABA loss-of-control). `wakeUp()` clears stale flag.

**Remaining approximation debts:**
- ~~Vomiting rate (0.2/hr at nausea=100) — chosen~~ — **FIXED 2026-02-23.** Split by etiology: illness pathway (severity>0.1 + nausea>40) 0–0.75/hr via 5-HT3 vagal mechanism; non-illness (nausea>75) 0–0.2/hr. Single curve was mechanistically wrong — illness vomiting is a distinct pathway.

**Dental pain — chargen approximation debts:**
- Currently assigned from `economic_origin` — jurisdiction/insurance model would make this more accurate (dental access varies enormously by country)
- No treatment mechanic — can't fix the tooth (dentist visit with cost, appointment system)
- No condition worsening — untreated cavities progress (abscess, tooth loss)

**Acute illness approximation debts:**
- Onset probability magnitudes not derived from real incidence data — need calibration
- No seasonal variation (flu season, winter colds)
- No recent-illness immunity (just recovered → lower susceptibility)
- **Contact intensity, not job type, is the real exposure variable.** The driver of illness exposure is how many people you're in close contact with, for how long, in what ventilation. Job type correlates with this but isn't the mechanism — a remote office worker and an in-person office worker are very different; a retail cashier and a food service worker are similar. The right model: daily close contacts derived from (job type + housing situation + social behavior). Not a parameter that exists yet.
- No immune function model — stress/sleep suppression of immunity is real but current magnitudes are guesses

**Vasovagal syncope / orthostatic hypotension** — not yet implemented. Vasovagal syncope affects ~1–3% of the population with recurring episodes; isolated orthostatic hypotension is far more common and subclinical. The mechanism: standing too fast (or prolonged standing, heat, pain, emotional shock) triggers parasympathetic surge + sympathetic withdrawal → bradycardia + peripheral vasodilation → cerebral hypoperfusion → loss of consciousness.

Simulation relevance: the prodrome is the most interesting part — tunnel vision, nausea, pallor, sweating, leg weakness. The body signals the coming event before it arrives; the player could react or not. The episode itself is brief (seconds to a minute); recovery lying flat takes 1–2 minutes. Aftermath: NE dysregulation, fatigue, sometimes nausea.

Risk amplifiers already modeled: dehydration (thirst state), low sleep (adenosine/energy), heat (temperature — seasonal, not yet wired to orthostatic risk). High NE/cortisol states (anxiety, acute stress) paradoxically protect against vasovagal by sustaining sympathetic tone.

Prerequisites before implementing:
- **Blood pressure as a derived state** — not stored directly; would be computed from NE (sympathetic tone), hydration status (blood volume), cortisol (vascular resistance), and energy/rest state. A `bloodPressureTier()` function derived from these, not a tracked variable.
- **Orthostatic challenge modeling** — standing actions (get_up_from_bed, stand_from_sitting) could trigger an orthostatic check at low BP states. The check consumes 1 RNG call; most of the time nothing happens; at elevated risk it produces the prodrome sequence.
- Prose: prodrome as interoceptive observation (senses.js source — body already has this channel), episode as an event, recovery as a distinct post-event state.

Constitutional vs. circumstantial: recurrent vasovagal syncope has a constitutional component (autonomic dysregulation, familial clustering — up to 21% first-degree relative risk). Isolated episodes from dehydration/heat/prolonged standing are circumstantial and affect anyone. Don't model as a binary condition flag — model as a continuous risk that spikes under the right circumstances, with high-trait characters having a lower trigger threshold.

Related: POTS (below) is a more severe persistent form of orthostatic intolerance; vasovagal is episodic.

**Connective tissue triad: hEDS, POTS, MCAS** — not yet implemented. Constitutional; comorbidity structure means they're not independent rolls — generating one raises probability of others. Chargen model needs: real prevalence data per condition, conditional probability table, and separate mechanical implementations per condition. hEDS: joint subluxation events, proprioception cost on physical actions, chronic pain baseline. POTS: sustained-upright-posture cost (standing in line, doing dishes), heart rate spike prose, heat sensitivity modifier, salt/fluid management interactions. MCAS: trigger tracking, reaction events, antihistamine as a maintenance interaction.

**Long COVID / ME/CFS** — not yet implemented. Circumstantial — needs prior illness event in backstory (which doesn't exist yet as a tracked event). The defining mechanic is post-exertional malaise (PEM): activity beyond a soft ceiling triggers a delayed crash. The ceiling moves with recent activity history. Not the same as exhaustion — the crash can arrive hours or the next day. Brain fog as a distinct cognitive state (separate from adenosine fog). Energy recovery doesn't respond to rest the way normal exhaustion does.

**Eating disorders (anorexia, bulimia, BED, ARFID)** — not yet implemented. Circumstantial — must derive from personality parameters (perfectionism, anxiety, self-esteem) and possibly life history events. Not a dice roll. Prerequisites: body image as a state variable (does not yet exist). Mechanical needs: hunger signal present but behaviorally overridden (anorexia), binge trigger state + vomiting system already exists (bulimia), compulsive eating trigger (BED), safe food list with aversion responses (ARFID). Eating disorders interact with social eating situations, with food availability prose, with getting dressed (body image + clothing fit).

**Gastritis** — not yet implemented. Circumstantial. Stomach system exists; gastritis modifies it: pain-when-empty, nausea cycles, slower emptying. Three upstream paths: (1) H. pylori — needs prior infection as a drawn lot from housing/travel history; (2) NSAID overuse — needs pain management behavior tracked; (3) stress gastritis — could derive from sustained high-stress periods in backstory. Don't implement without at least one upstream path resolved.

**Tourette syndrome / coprolalia** — not yet implemented. Constitutional (neurological genetic basis). Suppression economy: sustained tic suppression costs energy and stress; private space recovers it. Coprolalia (involuntary vocalization, ~10% of Tourette's cases): needs prose rendering of involuntary speech — "something that happens," not a player choice. Social consequence mechanics (job standing cost in public episodes, public location modifier). Needs: suppression state variable, public/private context modifier, coprolalia as a separate condition flag with its own chargen probability conditional on Tourette's.

**Echolalia (autism trait)** — when autism is implemented as a chargen condition, echolalia is a specific trait within it. Prose mechanic: inner voice echoes heard phrases with a delay. Masking echolalia costs energy in social contexts (same suppression economy as Tourette's tic suppression).

**Still unaddressed: pregnancy system** — prerequisite for morning sickness, stretch marks, and prenatal nutrition needs. Morning sickness would use the existing nausea system; HG (hyperemesis gravidarum) is the severe form requiring hospitalization. Stretch marks are a physical character property (narrative prose on getting dressed, body description) with no mechanical effect.

**Other conditions in the full framework (not yet scheduled):** narcolepsy/cataplexy, fibromyalgia, sleep apnea (non-restorative sleep mechanic), endometriosis, PMDD, lupus (SLE), thyroid disorders (hypothyroidism mimics depression), Raynaud's (cold → circulation cutoff), IBS (stress-triggered GI, shares stomach system), Crohn's/UC, celiac, PCOS, chronic urticaria, prosopagnosia, dyscalculia/dyslexia. Each needs its upstream before chargen assignment. See docs/design/overview.md "This list is not exhaustive."

**Healthcare locations not yet modeled:** clinic, GP office, hospital, emergency room, pharmacy as distinct from corner store. Each has a different access model (appointment vs walk-in vs emergency), different cost structure by jurisdiction, different wait time, different social texture. Hospital and ER in particular are high-stakes locations — the specific experience of being in an ER, the wait, the triage, the uncertainty — is a major life event the simulation currently can't represent at all.

**Pharmacy / drugstore (distinct from corner store):** A dedicated pharmacy interaction layer doesn't exist. OTC medications currently have no location — there's nowhere to buy them. The pharmacy is distinct from the corner store: pharmacists are present, the layout is medical, you can ask questions or avoid questions, there's a separate prescription counter. Items by access tier: (1) fully OTC — pain relievers, antacids, cold/flu medication, allergy meds, sleep aids (diphenhydramine), laxatives, bandages; (2) behind-the-counter OTC (pharmacist-gated) — pseudoephedrine, emergency contraception in some jurisdictions; (3) prescription-required — antibiotics, controlled substances, most psychiatric medication. Corner store carries some OTC basics (pain relievers, basic cold meds) but not the full range. The distinction matters: a character managing chronic pain, anxiety, or insomnia navigates this access tier system as part of daily life. Cost varies significantly by jurisdiction (free in universal healthcare systems, expensive in US without insurance).

**OTC medications with recreational/off-label use profiles:** Several legal, shelf-available medications are used recreationally or for purposes other than their labeled indication. This is a real and documented part of the OTC drug landscape — not a fringe case. Each has a distinct NT profile and risk structure:
- **DXM (dextromethorphan)** — found in cough syrup (Robitussin, NyQuil). At labeled dose: mild cough suppression. At high doses: dissociative effects (NMDA antagonism), depersonalization, hallucinations. Four "plateaus" of increasing dose. Nausea is a real barrier. Tolerance builds quickly. Not pleasant for everyone; dysphoria is common. Available OTC, cheap.
- **Codeine + promethazine ("lean", "purple drank")** — requires prescription-strength codeine (OTC in some jurisdictions, not in US). Opioid + antihistamine sedation. Slow, dissociative high. Highly habit-forming. Deeply embedded in specific musical/cultural contexts. The name "lean" comes from what it does to your posture.
- **Diphenhydramine (Benadryl, ZzzQuil)** — antihistamine. At therapeutic dose: sleepy, dry mouth. At high doses: delirious hallucinations (not enjoyable — dysphoric, confusing). Used as a cheap sleep aid chronically despite rapid tolerance and rebound insomnia. Anticholinergic, which means very unpleasant at overdose.
- **Gabapentin** — prescription in US but OTC in some jurisdictions; widely diverted. Euphoric at high doses especially combined with opioids. Increasingly recognized as a substance of misuse. GABA-agonist-adjacent (actually α2δ calcium channel blocker — different mechanism, similar subjective effect).
- **Pseudoephedrine** — decongestant. Stimulant at high doses (weaker than amphetamine). Restricted in US (behind-the-counter, ID + quantity limits) due to methamphetamine precursor use. Available in many other jurisdictions without restriction.
- These are mechanically distinct from each other and from the primary substance roadmap (alcohol, nicotine, cannabis, opioids). They share a common structural feature: the character acquires a labeled product for one reason and uses it for another, or crosses a dose threshold. The simulation should not simplify these to "drug use = bad" — model the actual pharmacology.

**Medical procedures not yet modeled:**
- **Surgery** — recovery time, post-surgical state, anaesthesia fog, wound care as interactions. Adds a recovery arc to any run that includes it.
- **Gender-affirming surgery (SRS/GCS, top surgery, etc.)** — requires: trans identity as a character parameter, jurisdiction (surgical access varies enormously), financial planning (often not covered by insurance in many jurisdictions), waiting lists, pre-op requirements, recovery. The post-surgical state changes the character's relationship to their body — prose about getting dressed, showering, looking in the mirror is categorically different.
- **Medical procedures abroad (medical tourism)** — for rare conditions, cosmetic surgery, gender-affirming care that isn't accessible or affordable locally. Different jurisdiction = different legal and safety context. Cost + travel + recovery far from home. A specific kind of experience.
- **Cosmetic/aesthetic procedures** — botox, fillers, rhinoplasty, other elective surgery. Different income levels, different cultural contexts, different relationship to appearance. Complications exist: botox asymmetry, filler migration, surgical complications (infection, healing problems, results not matching expectations). The decision to pursue these, the recovery, the relationship to the outcome — all have emotional/NT texture. Aging-related treatments specifically: the cultural pressure, the financial cost, the specific texture of trying to slow something that doesn't stop.
- **Plastic surgery complications** — infection, nerve damage, aesthetic outcomes that don't match expectations, revision surgery, chronic pain from implants. These can become chronic conditions derived from a past procedure in the character's backstory.

### Jurisdiction as a character parameter
Healthcare access, reproductive rights, and legal protections are **legal/political variables**, not geographic ones. Latitude does not predict abortion access, healthcare coverage, drug policy, or trans protections — a character at 59°N in Sweden has near-universal access; one at 52°N in Poland (historically) near-total prohibition. Using latitude as a proxy for US-style regional variation is a US-centric assumption that doesn't survive leaving the country.

The right model: **jurisdiction** (country + region/state) is a character parameter generated at chargen. Healthcare access, reproductive rights access, legal protections are derived attributes from jurisdiction. Until jurisdiction exists as a first-class parameter, any location-based access gating is an explicit approximation debt — not laundered through latitude as though it were a derived geographic relationship.

**Approximation debt:** Any health/reproductive access gating currently present should be documented as hardcoded, not derived.

### Mental health as distinct from state
Stress and energy model some of this but docs/design/overview.md describes depression, anxiety, bipolar, PTSD, OCD as structural conditions — not "low energy" but "the specific way getting out of bed takes everything you have."

### Neurodivergence
ADHD (executive dysfunction, time blindness, hyperfocus), autism (sensory processing, masking cost, routine importance). Not illnesses — ways of being that interact with a world not designed for them.

**Perceptual processing variants** — constitutional traits that change how the sensory observation pipeline works, not just what's salient:
- **Auditory processing disorder (APD):** sounds arrive but parsing fails. `coworker_background.intelligible` would stay false regardless of NE level; speech remains sound rather than language. Affects how close relationships feel at a distance — you hear people, not words.
- **Sensory processing differences (autism/SPD):** globally raised or lowered sensory thresholds. High sensory sensitivity means fluorescent hum, electronic whine, and fabric texture are all at high-salience tiers simultaneously — the observation budget fills with ordinarily-screened inputs. Low sensitivity is rarer in prose but real.
- **Synesthesia:** cross-modal bleeding. Sound → color is the most common form (chromesthesia). A character with chromesthesia would have visual observations generated by strong sound sources — traffic becoming color bands, the fridge hum a persistent tint. Purely a prose/realization concern; no simulation state changes, but the realization engine would need to know to emit visual language for sound sources. Rare enough (4% population) to be opt-in at chargen.
- **Visual processing differences:** visual crowding (letters/objects cluster), contrast sensitivity loss, visual stress from patterns (scotopic sensitivity / Meares-Irlen). Affects workplace fluorescents and screens harder than open-field sources. Manifests as observation salience permanently elevated for certain visual sources.

### Substance system
~~No substances exist.~~ Caffeine implemented (level, habit, withdrawal, receptor upregulation, nausea). See [docs/reference/substances.md](docs/reference/substances.md) for the full dependency model and design reference.

**Caffeine remaining debts:**
- ~~Acute tolerance: `consumeCaffeine(50)` gives same boost regardless of habit.~~ — **FIXED.** `consumeCaffeine` now scales intake by `1 - 0.3 * (habit/100)`: full dose at habit=0, ~70% at habit=100. `adenosineBlock()` shifts denominator by `0.4 * habit`, so habituated users need more caffeine to achieve the same receptor block. Both coefficients (0.3 and 0.4) are approximation debts — chosen, not derived from receptor density data.
- Habit tracking: `+8 / −5 per day` — chosen, not derived from real caffeine tolerance build/fade timescales (real tolerance develops over ~1–2 weeks, fades over similar). Magnitude is an approximation.
- ~~Withdrawal build rate: `(habit/100) * 6 pts/hr`~~ — **FIXED.** Now `(habit/100) * 1.5 pts/hr`, derived from real onset timing: mild symptoms at ~10h, peak at ~47h, matching the documented 12–24h onset / 20–51h peak range.
- Withdrawal clear rate: `25 pts/hr` — chosen. Real caffeine relief is noticeable within 30–45 min of dosing; needs calibration against `caffeine_level` half-life.
- Adenosine sensitivity bonus formula: `(habit/100) * 0.5 * (withdrawal/100)` — chosen, not derived from receptor density data.
- `consumeCaffeine` tolerance coefficients: 0.3 (intake scaling) and 0.4 (adenosineBlock denominator shift) — chosen, not derived from A1/A2A receptor density or pharmacokinetic data. Needs calibration.
- Nausea build threshold and rate: `withdrawal > 55, habit > 45, rate * 5 pts/hr` — chosen. Real GI symptoms appear at severe withdrawal in heavy users; thresholds are plausible but uncalibrated.
- Nausea NT effects: GABA `−1.5 pts/hr`, NE `+1.0 pts/hr` at nausea=100 — chosen magnitudes.
- Nausea natural decay: `2 pts/hr` — chosen. Caffeine-assisted decay: `8 pts/hr` — chosen. No real-world anchor.

**Hunger/stomach approximation debts:**
- ~~Gastric emptying is **linear**~~ — **FIXED.** Now exponential, half-life 90 min, derived from real gastric emptying data for solid food.
- ~~Hunger base rate: `4 pts/hr`~~ — **FIXED.** Now 8 pts/hr, derived from real hunger return (~3–5h after a normal meal working back through stomach suppression).
- ~~No stress modifier on gastric emptying~~ — **FIXED.** NE and cortisol now slow gastric emptying via `gastricSlowFactor`. Approximation debt: coefficients (0.5 NE, 0.3 cortisol) and threshold (50) are chosen to give ~2× half-life at max stress, not derived from real GI physiology data. Needs calibration against measured GI motility studies.
- ~~No content-type variation~~ — **FIXED.** `fillStomach(amount, contentType)` now takes `'solid'` (90 min half-life), `'liquid'` (25 min), or `'mixed'` (30% liquid fraction, ~74 min effective). Remaining approximation debts:
  - **Fraction model is simplified** — blending by `stomach_liquid_fraction` is a linear weighted average. Real stomachs partition contents heterogeneously: liquids float above solids and drain through the pylorus preferentially. A proper two-pool model would track separate liquid and solid compartments, each with its own independent emptying curve. `stomach_liquid_fraction` is an approximation of that structure.
  - **No fat/protein differentiation** — fatty/protein-dense foods empty more slowly (~3–4h half-life) than simple carbs. Currently all solid food uses the same 90 min half-life. The `contentType` parameter could be extended with `'fatty'` etc. when diet composition tracking is added.
- Stomach → hunger suppression coefficient: `0.85` — chosen. Represents the weight of stretch receptor + hormonal feedback; uncalibrated.
- ~~**Post-prandial hormonal satiation phase missing.**~~ — **IMPLEMENTED.** `hormonal_satiation` state variable (0–100). Set in `fillStomach()` proportional to amount eaten (clamped at 100). Decays in `advanceTime()` with half-life 150 min (2.5h — midpoint of 2–4h physiological range). Applied to hunger suppression via `Math.max(stomachSuppression, hormonalSuppression)` so whichever signal is stronger dominates. Remaining approximation debts: (1) half-life is fixed — real duration varies by meal composition (protein/fat extend it, simple carbs shorten it); (2) satiation magnitude is proportional to stomach fill — real hormonal response is partly nutrient-dependent; (3) max-rather-than-multiply suppression oversimplifies the multi-hormone interaction. See TODO.md approximation debt comments in state.js.
- **`gastricSlowFactor` 1.8× max is slightly generous.** Controlled human studies show acute psychological stress delays gastric emptying by ~25% (1.25×); severe stress upper range ~1.5–1.6×. The current 1.8× max (NE=100, cortisol=100) is at the outer edge of physiological plausibility. The direction (NE dominant over cortisol) is physiologically correct; the maximum is modestly overstated.
- ~~**Cortisol temporal filtering missing.**~~ — **FIXED.** `cortisol_gi_slow` state variable (0–100) tracks a slow exponential average of cortisol (half-life ~210 min, ~3.5h). Updated in `advanceTime()` each tick. `gastricSlowFactor` now uses `cortisol_gi_slow` for the cortisol term (slow genomic pathway) and instant NE for the NE term (fast synaptic pathway). Remaining approximation debt: the 210 min half-life is chosen to represent the genomic timescale, not derived from measured cortisol GI kinetics literature.
- **Water vs. caloric liquid T1/2 distinction.** Water empties with T1/2 ~13 min (vs. ~25 min for caloric liquids like juice). The current `'liquid'` content type is calibrated for caloric liquids. A character drinking plain water is overestimated on retention. Defer until food/drink tracking distinguishes water from beverages.

**Next substances to implement (in rough priority order):**

1. **Nicotine** — the break that isn't relaxation, it's withdrawal stopping. Irritability-dominant withdrawal (distinct from caffeine's headache). Dopamine below non-smoker baseline during withdrawal. Social layer: the smoke break as legitimized absence. Smell. Who knows. See docs/reference/substances.md.

2. **Alcohol** — GABA-A agonist. The curve (push → plateau → cost). Sleep disruption despite sedation (suppresses REM). Hangover. Chronic: dangerous withdrawal (seizures, DTs) — **cold turkey from high dependency is medically contraindicated, not just unpleasant.** Nausea already implemented as shared state. See docs/reference/substances.md.

3. **Cannabis** — blunts emotional extremes, disrupts REM, mild tolerance. Withdrawal: irritability, insomnia, appetite change — real but less severe than nicotine or alcohol.

4. **Opioids** — prescription pathway (the back pain that became something else), the flu-like withdrawal, harm reduction access. Requires healthcare access system first. See docs/reference/substances.md.

5. **Inhalants** — paint thinner, glue, spray paint, air duster, whiteout, nitrous oxide. Mechanically distinct from other substances: fast onset (seconds), short duration (minutes), CNS depressant via multiple mechanisms (glutamate antagonism, GABA-A agonism, membrane disruption depending on substance). The texture: cheap or free, accessible without age verification, short-lived enough to repeat. Acute toxicity is real — cardiac arrhythmia ("sudden sniffing death" — SSD), hypoxia from displacing oxygen, aspiration. Chronic use: white matter damage, significant cognitive deficits. Not a gateway-drug narrative framing — a distinct poverty/access story. More prevalent among adolescents and in communities with limited access to other substances; not absent in adults. The specific items are household/hardware: accessible without a trip to a dealer, without money, without age verification. Nitrous (laughing gas) has a distinct profile — NMDA antagonist, not the same as solvent huffing — and is also used medically and recreationally in different contexts (nangs/whippets).

   Implementation note: inhalants require items that exist in the world (spray paint, cleaning products) and have secondary uses. This connects to the household items / world-object simulation that doesn't fully exist yet. A can of spray paint bought for a purpose can become something else.

**Recovery pathway tasks (cut from first implementation, design in docs/reference/substances.md):**
- **Cold turkey mechanic** — explicit choice interaction. Prose carries the arc specific to each substance.
- **Medically supervised tapering** — requires healthcare access system (jurisdiction-dependent). Benzodiazepines for alcohol withdrawal, buprenorphine for opioids.
- **AA / NA / SMART Recovery** — meeting as an interaction (time, location), sponsor as relationship slot, step-work as slow background process, relapse as physiologically honest (habit re-escalation).
- **Rehab (inpatient)** — 28+ days, cost-gated, removes character from environment and triggers. Character returns to same apartment. That's the hard part.
- **Craving as attention state** — high withdrawal pushes craving thoughts into idle thought pool, intrudes during other activities. Location-based trigger amplification (the apartment where it happened).
- **Social consequences compound** — job standing, relationship damage, financial drain all interact with the substance state.

### Drawn lots
No drawn lots exist. docs/design/overview.md describes: foster care, domestic violence, CPS, childbearing, fetal alcohol syndrome, instability, caregiving, housing instability, addiction/recovery, legal constraints, grief, language barriers. Each as daily texture, not backstory tags.

### Appearance as a social object
Hygiene state (dandruff, greasy hair, unkempt, gingivitis, body odour), hairstyle (dreads, shaved, natural, dyed, unkempt), fashion choices (alternative, crossdressing, skimpy, formal, worn-out) — all feed into how others respond to the character, which feeds NT state, which feeds how the character feels about their appearance. The loop runs both ways.

Two layers: (1) the character's own relationship to their appearance — pride, indifference, shame, effort, identity expression; (2) the world's response — which varies by context (dreads read differently in a corporate office vs. a festival; alternative fashion reads differently at work vs. among friends). Hygiene degradation has many causes — depression (nothing has weight), executive dysfunction (ADHD — you meant to, the day didn't happen that way), low interoceptive awareness (don't notice you're uncomfortable, don't register your own body signals — correlated with autism and ADHD), deliberate deprioritization (three hours of sleep, a deadline, hair lost), poverty (water/products/laundry cost money), physical inability (chronic pain, disability). The game shouldn't assume cause from symptom — the prose notices the state, what produced it is the character's history. Also: hair washing frequency varies enormously by hair type and culture; washing coily or curly hair daily is actively harmful, so "unwashed" is not a universal signal. Appearance as identity expression connects to the identity system. Context-dependent social response connects to the ambient social texture system.

### Identity and social landscape
No identity dimensions affect the simulation. docs/design/overview.md describes: gender (misogyny as ambient texture, not events), trans experience (visibility, HRT, passing, nonbinary), race/ethnicity (ambient response, code-switching, microaggressions), sexuality (the closet as energy cost, being out), body (weight, height, appearance as social objects).

### Performance and masking cost
docs/design/overview.md describes a shared pattern across identity dimensions: masking (autism/ADHD), code-switching (race/culture), the closet (sexuality), boymoding/girlmoding (trans), body management. All modeled as ambient energy drain that varies by context. Some spaces let you drop it.

### Nostalgia and its NT effects
Nostalgia produces genuine neurochemical responses — serotonin and dopamine — not just mood coloring. It buffers against loneliness and low social connection (relevant to the social system). Bittersweet by nature: warmth and loss are simultaneous, which is mechanically interesting — serotonin rises while something else sits underneath. Triggered by sensory cues (smell, taste, sound especially) — connects to the sensory prose system. Needs research before implementation.

### Endocrine and biological systems
Hormonal profile, menstrual cycles, cortisol rhythms, metabolism, drug metabolism (CYP enzyme variation), nutrient processing. Autonomous forces on mood that operate on their own schedule.

### Dietary needs
Condition-driven (diabetes, celiac, allergies), pregnancy, religious/cultural (halal, kosher, fasting), eating disorders. Poverty making all of it worse — the specialized diet costs more.

### Immune disorders
Autoimmune conditions (lupus/SLE, rheumatoid arthritis, MS, type 1 diabetes, Hashimoto's thyroiditis, psoriasis, IBD — Crohn's/UC already listed elsewhere) — the body fighting itself. Flares are unpredictable and not scheduled. Chronic inflammation has direct NT consequences: genuinely suppresses serotonin and dopamine synthesis, not just metaphorically. Many autoimmune conditions should derive from stress history and genetics via backstory rather than pure dice rolls (circumstantial in the CLAUDE.md sense). Immunodeficiency (HIV/AIDS, CVID, post-chemotherapy states) — immune system underactive rather than overactive; different daily texture but same unpredictability. Chronic inflammation as a background state: not a discrete condition but a physiological environment that affects mood, energy, and cognition. Pregnancy involves transient partial immune suppression (to prevent rejection of the genetically foreign fetus) — not a disorder but mechanically in the same territory; some autoimmune conditions improve during pregnancy, others worsen.

### Allergies and immune reactivity
Allergies as a dynamic system, not a fixed flag. Adult-onset food allergies (someone who ate peanuts safely for 30 years develops a reaction). Allergy desensitisation/immunotherapy. Severity spectrum: mild intolerance → hives → anaphylaxis. MCAS (Mast Cell Activation Syndrome) — mast cells dysregulated, triggering reactions to many stimuli (food, temperature, stress, exercise, smell); related to allergies but broader and harder to pin down. Needs to interact with the dietary, stress, and health systems.

### Economic dimensions beyond money
Origin (where you started vs where you are), social capital (who you know), cultural capital (what you know how to do in context), educational background, geographic reality (food deserts, transit deserts). The daily tax of poverty — being poor is expensive in time and energy.

**Structural discrimination:** The world treats people differently based on gender, race, age, disability, appearance, pregnancy status, and more — in hiring, pay, treatment at work, interactions with institutions, access to services, safety on the street. Currently the simulation produces identical outcomes regardless of the character's identity — same pay rates, same job standing dynamics, same street interactions, same institutional responses. That's not what the world does. Discrimination is structural and ongoing, not a discrete event — it should emerge from character parameters as a modifier on outcomes across many systems, not be announced or flagged. The character may or may not perceive it accurately. This applies across: employment (pay gap, glass ceiling, shift allocation), housing (screening discrimination), healthcare (pain dismissal, diagnostic gaps by gender/race), street safety (harassment, police interactions), social texture (microaggressions, code-switching cost). Each system that ignores this is an approximation debt.

### Trauma system
Not a condition — a lens. Loaded moments, avoidance, involuntary reactions, absences (interactions that should be there but aren't). Triggers orthogonal to relationships. The prose contracting, going flat, pulling away.

### Upbringing
Working / indifferent / overwhelmed / resentful / abusive. Shapes what the character expects from people, what care looks like to them, what they flinch at.

### Distance and absence in relationships
Online friends, long-distance relationships, sick people remotely. The phone as the relationship's entire infrastructure. Not all relationships are local.

### Observation fidelity in prose
The system exists mechanically but could shape prose more. "Around thirty dollars" vs "$32." "Sometime in the morning" vs "9:15 AM." The experience of not always knowing exactly what's going on because you're tired and distracted.

### Narration voice variation
docs/design/overview.md describes the narration itself changing based on character — personality affecting sentence rhythm, neurodivergence changing attention structure, trauma changing what's loaded. Not just mood-variant prose but character-variant prose.

### The world outside the routine
Only 7 locations. No park, no library, no friend's place, no laundromat, no clinic, no shelter. The world is small on purpose but could be slightly larger — each new place being a specific texture of constrained life.

### Coworker depth
Coworkers have flavor-driven chatter but no ongoing relationship state. No coworker who notices you've been off. No coworker drama that exists whether or not you engage.

### Bus ride as experience
~~The bus ride is 20 minutes of transition text.~~ — **Improved.** `wait_for_bus` and both bus ride directions (`bus_stop→workplace`, `workplace→bus_stop`) now use full mood-branched `Timeline.weightedPick()` prose with NT shading (adenosine, NE, GABA, serotonin). Wait covers all 6 moods × snow/drizzle/clear. Rides vary by rush hour vs off-peak, energy level, weather through the window, what the day was.

**Still missing:** Ambient events during the ride (someone's music, overheard conversation, the specific route), in-ride interactions (checking phone on the bus, noticing something out the window).

### Night shifts and non-standard schedules
All three jobs are day shifts. docs/design/overview.md doesn't prescribe this. Being awake at 3 AM when the world is asleep is a specific texture.

### Existing systems that need deepening

~~**Money is a one-way drain.**~~ — **FIXED.** Financial cycle implemented: paychecks (biweekly, attendance-based), rent/utilities/phone (monthly auto-deduct), life history backstory. Partial fix: food_service workers can now eat at work once per shift (`eat_at_work`). `drink_water` gives -3 hunger and now has prose that acknowledges when the fridge is empty. **Gradient at $0 — what actually exists when broke:**

- ~~**SNAP / food stamps / EBT**~~ — **IMPLEMENTED.** `ebt_balance` + `ebt_monthly_amount` in state. Enrollment determined at chargen from economic origin (65% precarious, 25% modest, 4% comfortable, 0% secure). Monthly $204 benefit reloads on a per-character day offset, fires a phone notification. `buy_groceries` now available if cash >= $8 OR EBT >= $8; EBT-purchase prose is distinct but unremarkable. `buy_cheap_meal` stays cash-only (prepared hot food). Approximation debt: benefit amount is flat $204 — should derive from income, household size, state rules. Non-enrollment rate in eligible people (real ~35%) is modeled.
- ~~**Soup kitchen / community meal**~~ — **IMPLEMENTED.** `soup_kitchen` location, 8 min from street. `get_meal` interaction: weekdays 11am–2pm, once/day, -45 hunger, 25 min. `soup_kitchen_visits` lifetime counter — first visit prose is different from regular. NT-shaded throughout. Transition text acknowledges familiarity. Approximation debt: schedule is M–F only (real soup kitchens vary widely — some are weekends-only, some daily, some appointment-based). Doesn't vary by character backstory (some characters would know about it, others wouldn't). No awareness mechanic yet — character just always knows it exists.
- ~~**Food bank**~~ — **IMPLEMENTED.** `food_bank` location, 12 min from street. `receive_bag` interaction: weekdays 9am–5pm, once per 7 game days. Stocks fridge +3 and pantry +2, 40 min. First-visit prose distinct from routine. Approximation debts: schedule is M–F only; character always knows it exists; real food banks are often appointment-based or have intake processes.
- ~~**Dry pantry / shelf-stable**~~ — **IMPLEMENTED.** `pantry_food` state var (starts at 1, capped at 3). `pantryTier()`. `eat_from_pantry` interaction (fridge empty + pantry not empty): -20 hunger, uses a dish, 10 min. Stocked +1 when buying groceries. No overnight decay. Kitchen description and last-fridge-item prose both acknowledge pantry state.
- ~~**Eating at work — office break room done.**~~ `graze_break_room` interaction: office job type only, once per shift (`grazed_break_room_today`), 8 min, -12 hunger, small stomach fill. Mood-branched prose with NT shading (serotonin, dopamine, adenosine). Deterministic modifiers: NE tension, adenosine fog. Retail: still pending — depends on the store, no communal food culture equivalent.
- ~~**Asking someone**~~ — **IMPLEMENTED + REVISED.** `ask_for_help`: 7-day cooldown, broke/scraping tier. Probability now flavor-based (sends_things 70%, warm_quiet 65%, checking_in 60%, dry_humor 55%) + warmth bonus (up to +25%) − repeat penalty (−10%/ask) + broke urgency (+5%). Variable amount: $10–40 by flavor range. 4 balanced RNG calls. Prose no longer mentions dollar amounts. Reverse direction: friends occasionally send in-need messages (subtype `'in_need'`, 14-day cooldown, ~0.3%/step, 2 balanced RNG calls). `help_friend` interaction: flavor-deterministic amount ($10–15), builds warmth +0.05, 3 RNG calls. Approximation debts: friend's financial situation not modeled; physical delivery not implemented.
- **The nothing option** — *prose partially addressed.* 12 idle thoughts added for the compound state: very_hungry/starving + broke/scraping + fridge empty + pantry empty. Time-of-day shading (late night vs. daytime), mood shading (heavy/hollow/numb vs. fraying/flat), NT shading (serotonin for late-night weight, dopamine for bandwidth exhaustion, cortisol for body-vs-situation mismatch). Still pending: narration changes as the state persists (the body's signals flattening over hours), mechanical consequences that accumulate (things getting harder, not just thought-differently-about), and what recovery from this state actually feels like.

**Job standing is mechanical, not social.** Decay: late > 15min = -5, calling in = -8. Recovery added: on-time arrival +2, focused task completion +1. Still no social dynamics (coworker relationships don't affect standing), no variation by job type, no pattern-based assessment (single incident treated same as chronic pattern). Standing should be relational — shaped by what the specific job values, whether someone saw you, whether someone covered for you. See the expanded Work section in docs/design/overview.md.

**Phone power system could deepen.** Battery now drains by screen time and charges during sleep / via charge_phone interaction. Future: phone model/age affecting battery capacity and drain rate, charge rate varying by charger type (wall vs USB vs car), battery health degrading over the life of the phone. Doesn't meaningfully affect gameplay but deepens the simulation — an old phone with a bad battery is a different daily texture than a new one.

~~**Idle timer goes silent after 2 thoughts.**~~ — **FIXED.** Delays now escalate (30s → 60s → 2min → 5min → 20min plateau) and continue indefinitely. AFK protection: if no user input (mouse/key/click) for 5 minutes, the timer drops silently without rescheduling. Tab-hidden protection was already in place. Result: deliberate inaction gets continuing thoughts with natural spacing; walking away gets 2–3 thoughts then silence.

**Event accumulation and the idle/absence problem.** The event caps (2 per type, then silence) were a bandaid for events piling up during unattended play. The real fix is upstream: handle player absence properly. If nobody's at the screen, the game shouldn't be generating content into nothing — step-away, auto-pause, tab detection. If absence is handled, the accumulation problem dissolves. Deliberate inaction (the player choosing not to act, the weight of not starting) is a different thing entirely and should be supported as a real experience.

~~Separately, body-state events (hunger, exhaustion) should fire on state *transitions* — you discover you're hungry once, when it crosses into a new tier.~~ — **FIXED.** `hunger_pang` and `exhaustion_wave` now fire deterministically on tier crossings: hungry→very_hungry→starving, exhausted→depleted. No RNG consumed (removed two `Timeline.chance()` calls from the hot event path). Resets when eating/resting. ~~**Still needs:** late_anxiety and apartment_notice use the old count-cap pattern (`surfaced_late`, `surfaced_mess`) — those should also become transition-based.~~ `apartment_notice` is now transition-based: fires when mess tier worsens (tidy→cluttered→messy→chaotic), tracked via `last_surfaced_mess_tier`. Cleaning resets tracking; each morning resets on wake. Ambient 6% chance still fires `apartment_sound` only; notice is deterministic. ~~**Still needs:** late_anxiety transition-based.~~ `late_anxiety` is now transition-based: fires on tier crossings (fine→late→very_late) via `last_surfaced_late_tier`, tracked in state. `lateTier()` in state.js maps latenessMinutes to named tiers (fine/late/very_late). Resets each morning in `wakeUp()` and on work arrival. Prose branches on tier. **Still needs:** Ambient events (pipes, street noise) should habituate — you stop noticing after time in the same place.

Event text should never be reused as a bandaid for not having enough content. Seeing the same text twice is the game breaking the fiction. Reuse is only appropriate when the repetition is genuinely realistic — a sound that recurs, a routine that repeats. Never to fill space.
