# TODO

> **Workflow note:** Parallelization via subagents is always an option. Use it freely — fire multiple Explore/research agents simultaneously for independent audits, literature searches, or design questions. Don't serialize work that can run in parallel.

## Next

1. **Remove ~50 spurious RNG balance calls** — HIGH, concrete, mechanical. See Code Quality section.
2. **Multi-stream PRNG** — HIGH, architectural. Add `cosmeticRng` and `backgroundRng` streams. See Code Quality section.
3. **Integration tests** — foundational for confidence in all future work. See Backlog section.

---

## Simulation correctness — known gaps

**Personality trait drift** — neuroticism, self_esteem, rumination, trait_loneliness, introversion, sensory_sensitivity are currently static after chargen. Real personality traits drift on month-to-year timescales: rank-order stability ~0.5–0.7 across 6 years (Roberts & DelVecchio 2000 — PMID unverified); mean-level neuroticism decreases through midlife, conscientiousness/agreeableness increase (Roberts et al. 2006 — PMID unverified). Life events (unemployment, relationship changes, health events) produce measurable change (Bleidorn et al. 2018 — PMID unverified). Realistic τ would be months (90–180 days), driven by sustained life patterns not individual events. Current static implementation is a chargen debt — personality should eventually be a consequence of simulated experience, not just an initial draw.

## Persistent audits

Low-priority recurring checks — never fully "done," but each pass catches drift. Run any of these when the codebase feels uncertain.

**Inline scalar guard** — content.js must not compare raw state values directly. `grep -n "State\.get.*[<>!]=\?" js/content.js` should return nothing outside of tier function definitions. Any hit is a tier-function gap — add the tier to state.js, branch on the label.

**NT key name check** — `adjustNT()` accepts only the full NT names. Abbreviated forms silently no-op. `grep -n "adjustNT('" js/content.js js/world.js js/chargen.js | grep -v "'serotonin\|'dopamine\|'norepinephrine\|'gaba\|'adenosine\|'cortisol\|'melatonin\|'oxytocin\|'endorphins\|'anandamide\|'acetylcholine\|'histamine\|'glutamate\|'substance_p'"` should return nothing.

**Math.random / Date.now in simulation** — `grep -rn "Math\.random\|Date\.now" js/` — expected: zero hits in state.js, world.js, content.js, habits.js, chargen.js, senses.js, realization.js. ui.js (idle timer) and main.js are safe. timeline.js uses performance.now() for seeding (intentional).

**RNG in location descriptions** — `grep -n "weightedPick\|Timeline\.pick\|timeline\.pick" js/content.js` — manually verify each hit is inside an `execute:` handler or standalone function, never inside a `locationDescriptions` getter or `approachingProse` entry. Those run from `UI.render()` and must be deterministic.

**Interaction ID uniqueness** — `grep -n "id: '" js/content.js | sed "s/.*id: '//;s/'.*//" | sort | uniq -d` — any output is a duplicate ID; duplicate IDs cause silent collision (one silently shadows the other).

**State var cross-reference** — for any new state var introduced in content.js or world.js, verify it appears in the `let s = {` initial defaults block in state.js. Missing defaults → `undefined` on first read, silently falsy. Also check `applyToState()` in character.js if the var derives from character data.

**Approximation debt coverage** — `grep -n "adjustNT\|adjustStress\|adjustSocial\|adjustSentiment" js/content.js | wc -l` compared against `grep -n "Approximation debt" js/content.js | wc -l` gives a rough under-documentation ratio. Not 1:1 (one debt comment covers a block), but large gaps are a signal. Target: every bare numeric literal passed to these functions has a debt tag on the same or preceding line.

**Balance call creep** — `grep -n "// balance" js/` — should be zero or strictly decreasing. Any new hit is the old wrong rule re-entering.

**Tier switch exhaustiveness** — scan switch statements on tier-function results for missing cases. The canonical failure mode: a new tier value added to a tier function (e.g. `moneyTier()` gaining `'overdrawn'`) without updating all switch statements that dispatch on it. Currently no automated check — manual review after any tier function change.

`bun scripts/sim-audit.js` — living simulation diagnostic. Extracts coupling graph, detects orphaned state, hotspots, feedback loops, timescale mismatches, underutilized systems, location gaps. Re-run after adding state vars, interactions, or target function inputs. Future analyses to add as discovered: sentiment flow tracing, chargen→state coupling completeness, RNG budget per interaction, sleep-path side-effect inventory.

---

## Calibration debt priorities

All approximation debts tagged in code: `// Approximation debt (topic):` — grep by topic.

**High — foundational, visible behavioral effects:**
- **NT coupling coefficients** (21 sites remain) — `grep 'Approximation debt (NT coupling)' js/state.js`. Remaining 21 sites are approximation debts with full literature commentary — magnitudes not derivable from current literature. See docs/research/nt-coupling-*.md and docs/research/gaba-social-decay.md.
- **Sleep quality multipliers** (4 sites) — `grep 'Approximation debt (sleep quality)' js/content.js`. Directions correct; magnitudes may be too aggressive. See docs/research/calibration.md.

**Medium:**
- **GI cortisol slow pathway τ** — `grep 'Approximation debt (gastric emptying)' js/state.js`. τ=210min chosen to represent genomic pathway, not measured GI kinetics.
- **Mindfulness NT nudges** (9 sites) — `grep 'Approximation debt (mindfulness)' js/content.js`. Directions grounded in literature; magnitudes and single-session scale all chosen.
- **Food profile** — `grep 'Approximation debt (cooking_skill)' js/chargen.js js/content.js`. cooking_skill derivation (economic_origin + career_stability; real skill depends on parental modeling, culture, disability, interest). Ethical stance prevalence (US rates; no jurisdiction/age/culture differential). Peanut butter/oil depletion (10 uses per unit; real servings vary). Potato spoilage not modeled (sprout in 2–4 weeks). Snack NT values chosen (no empirical basis). Buy prices from approximate US corner store ranges (no jurisdiction model). cooking_skill gate at 30 for potatoes (arbitrary boundary). Bean cook time 20min (real dried beans 1–3h; treating as canned-bean convenience).

---

## Chargen — known bugs

### Editable fields don't regenerate downstream properties

`generateRandom()` produces a complete character from `charRng` in one pass. The player can then change job, age, latitude, and season on the character screen, but downstream properties generated from the original values are NOT recalculated:

- **Latitude → wardrobe** — switching from temperate to tropical leaves winter coats in the closet. Wardrobe generation uses the original latitude; player-changed latitude only updates `char.latitude`.
- **Age → backstory.life_events** — event count scales with adult years. Changing age from 48→22 keeps the 48-year-old's life events. `simulateFinancialHistory()` IS recalculated in `finishCreation()` with the new age, but `generateBackstory()` is not.
- **Job → backstory** — backstory economic assumptions (career_stability, economic_origin probability weights) were generated for the original job type.
- **Latitude → jurisdiction** — legal substance access, healthcare, etc. generated for original latitude.
- **All derived properties** — food_profile (from backstory), housing_quality (from rent + origin), laundry_access (from housing_quality), conditions (backstory-modulated), substances (backstory-dependent), personality adjustments (from life_events).

`finishCreation()` only regenerates `financial_sim` and `labor_arrangement` with the player's final values. Everything upstream of those stays stale.

**Fix direction:** Either regenerate the full downstream chain when an editable field changes (needs careful charRng management — can't re-consume the stream), or run a deterministic post-pass in `finishCreation()` that patches latitude/age/job-dependent properties without RNG. Wardrobe is the hardest case (variable RNG calls per item).

### Gig worker override silently replaces player's job choice

`finishCreation()` can override `char.job_type` to `gig_worker` based on a backstory probability roll, regardless of what the player selected in the job dropdown. The dropdown already has "An app" for gig_worker. This contradicts the design principle that player choices need player input. Fix: remove the override — if the player picked a job, that's the job.

### `character.get()` called with no args — crashes at runtime

`get(key)` returns `current?.[key]`. With no args, `key` is `undefined`, so `get()` returns `undefined`. Then property access on `undefined` throws TypeError. 6 call sites:

- `content.js:2951, 13921, 14112, 14421` — `.sentiments` (sleep emotional processing)
- `content.js:7872, 7976` — `.rumination` (idle thought selection)

Fix: replace `ctx.character.get()` with `ctx.character.getAll()` at all 6 sites. The `.rumination` sites also need `getAll().personality.rumination` since rumination is nested.

### `character.get('job')` should be `character.get('job_type')`

- `content.js:11073` — gates `eat_at_work` availability. Always `undefined` → food_service workers can never grab food at work.
- `content.js:11490` — `use_work_bathroom` execute path.

### `character.get('economic_origin')` not a top-level property

- `content.js:18245` — free dental clinic access for precarious characters. Always `undefined` → precarious characters charged $120. Should be `character.get('backstory')?.economic_origin`.

### Biome expansion

Currently just latitude → derive everything. Future: richer geography object `{ latitude, humidity, elevation, coastal }` or similar. Specific dimensions:

- **Humidity** (coastal vs continental vs arid) — affects temperature feel, mold risk, hair texture, hydration needs
- **Elevation** — affects temperature, UV, pressure, cooking (boiling point), altitude sickness threshold
- **Coastal proximity** — sea breeze, salt air, marine layer, fog patterns
- **Mountain shadow** — rain shadow, föhn winds, microclimates
- **Biome type** — desert, rainforest, temperate forest, grassland, tundra → flora/fauna observation sources

`grep 'Approximation debt (biome):'` when ready.

### Chargen prose tone variation

The chargen screen currently has one fixed prose voice. Future: the prose tone during character creation should vary — different characters get different chargen narration, reflecting the personality/NT state that's being generated. Uses the three-layer pattern (moodTone → weightedPick → deterministic modifier) applied to the creation screen. Requires chargen prose to read from the character's generated personality, which is available since it's generated before the UI renders.

### Full wardrobe sandbox — remaining debts

- **Flavor pool (NPC count):** friend flavors capped at 4, coworker flavors at 3. Additional NPCs
  cycle flavors — same flavor, different person. Needs prose expansion: additional flavors authored
  for friends 5+, coworkers 4+, and multi-friend prose variants that don't assume exactly 2.

- **Gameplay wardrobe rearrangement:** `rearrange_wardrobe` interaction at apartment_bedroom or
  a dedicated `wardrobe` sub-location. Player drags items — takes time (~5–10 min) and small
  energy. Reorders `clothing.items` array (affects which items are found first during `getWorn()`
  once order-sensitive selection is added). Grep: `rearrange_wardrobe`.

- **Underwear/socks/shoes size labels:** `itemSizeLabel()` returns null for these types. Needs
  separate sizing logic (e.g., EU 36–46 for shoes, numeric waist for underwear).

- **Inseam/pants length:** `bottomSizeLabel()` gives waist only. Inseam requires height, not yet
  on character. See body composition debt (line 204).

- **Clothing `currentFit()` prose read-through:** gameplay rendering should call `currentFit()`
  rather than reading `item.fit` directly. `getWorn()` in clothing.js updated but prose in
  content.js may still read `item.fit` directly — audit needed.

---

## Code quality

### HIGH: Remove ~50 spurious RNG balance calls

The old CLAUDE.md had a "balanced RNG consumption" rule — explicit `Timeline.random()` calls in branches that produce no output, to "prevent replay divergence." This was wrong. Replay is deterministic because same seed + same action sequence → same state → same branch taken every time.

**Scale:** ~50 sites with explicit `// balance` comments:
- `js/content.js` — 40+ sites (interaction execute() blocks)
- `js/world.js` — 4 sites (coworker drama event checks)
- `js/chargen.js` — 3 sites (alcohol/cannabis inventory)

**Grep:** `ctx.timeline.random(); // balance` and `ctx.timeline.charRandom(); // balance`

**Two directions:**
1. **Remove balance calls** — any `Timeline.random()` / `Timeline.charRandom()` whose return value is discarded and which produce no prose or mechanical effect.
2. **Audit avoided-RNG sites** — places where randomness was deliberately omitted to stay "balanced." Ask whether any would benefit from probabilistic variation now that there's no penalty for asymmetry.

**Past session scan:** `git log --oneline | grep -i "balance\|rng\|deterministic"` for relevant commits. Known hits: `2fa9698`, `3fdb87e`, `b73b35f`.

### HIGH: Multi-stream PRNG — add cosmeticRng and backgroundRng streams

All prose `weightedPick` calls and all mechanical RNG draw from the same `rng` stream, meaning adding new prose variants shifts all downstream RNG sequence.

**The fix:** derive two additional streams in timeline.js via sequential splitmix32 steps. Export `Timeline.cosmeticRandom()` and `Timeline.backgroundRandom()`.

**Migration:** Move all `weightedPick` calls used purely for prose selection from `rng` to `cosmeticRng`. Move idle event generation and ambient variation to `backgroundRng`.

**Backcompat note:** Breaking change for existing saves. Do after save format stabilizes or after a deliberate version bump. See CLAUDE.md "Multi-stream PRNG architecture."

### wakeUp() reduction

Target: `wakeUp()` sets `s.wake_period_start = s.time` and nothing else. Remaining: `daylight_exposure` — continuous accumulator; fractional-minute contributions per `advanceTime()` call make event summing expensive. Migrate when a per-tick event approach is cheap.

### Interrupt queue — remaining types

Alarm + time_to_leave + cooking timer + interview implemented. Not yet wired:
- Medication reminders — requires medication system first (prescription state, daily dose tracking)
- Calendar alerts: meetings, dates, anniversaries, flights

### Job search system — remaining

Basic version implemented. Remaining:
- Multiple simultaneous applications
- Different company types / job type change pathway
- Negotiation (accept-with-counter, start date flexibility)
- Reference system (coworker warmth as soft modifier on offer probability)

---

## Backlog

### NT baseline — remaining

Steps 1–5 complete. See `docs/design/nt-baseline.md`. Substance withdrawal now derives from `max(0, baseline - level)` — no separate accumulators. Re-run `bun run scripts/adversarial-eval.js` and verify no new pathologies.

### Adversarial tick evaluation

`scripts/adversarial-eval.js` implemented. See `docs/design/adversarial-eval.md` for design and findings (last run: 2026-02-25).

### Integration and end-to-end tests

Unit tests (`tests/`) cover isolated modules. Two higher levels remain:

**Integration tests** — wire the full sim context and verify cross-module contracts:
- Action sequence → expected state change (sleep → adenosine cleared → wakeUp sets wake_period_start)
- Financial cycle over simulated days (paycheck, bills, overdraft)
- Social decay toward trait_loneliness floor
- Sentiment accumulation and sleep attenuation
- Habit learning convergence
- Coworker drama cooldown
- Interrupt queue firing
- **Senses pipeline** — `createSenses(ctx)` → `sense()` / `arrivalSense()` / `midSense()` actually evaluate observation sources without crashing. This is the gap that let the `State`/`World` bug survive: `realization.test.js` tests `realize()` with pre-built observations, but no test exercises `getObservations()` → `observe()` → source evaluation where `available(s, w)`, `salience(s)`, and property functions receive the state object. Minimum viable test: construct a real `ctx` (or minimal mock with `.get()` and `.world`), call `sense()`, assert it returns `string | null` without throwing.

**End-to-end / smoke tests** — replay a canonical action log from seed, assert key state values match known-good snapshot. Implementation: save fixture in `tests/fixtures/`, replay via `ctx.timeline.replay()`, snapshot-assert.

### Clothing state — remaining

`clothing_cleanliness` and discrete damage implemented. Remaining: **Fit** — drifts slowly with body weight changes.

### Body care rituals — remaining

Stretch, skincare, hair, makeup, bath implemented. Remaining: **Physical therapy exercises** — injury recovery pathway (distinct from stretch_morning; remedial, prescribed, painful before helpful). Needs prescription from clinic appointment, graduated pain/progress, daily streak tracking. `grep 'Approximation debt (stretch)'` (2 sites), `grep 'Approximation debt (self-care)'` (4 sites).

### Simulation gaps

- **Stomach capacity variation** — `fillStomach()` hardcodes capacity at 100 for all characters. Real stomach volume varies: gastric bypass (~30ml pouch vs ~1000ml normal), sleeve gastrectomy (~150ml), naturally smaller/larger stomachs. Per-character `stomach_capacity` derived from life history (bariatric surgery, body composition). Affects portion sizes, eating frequency, fullness duration, nausea threshold. Prose consequences: smaller capacity → can't finish meals, eats more often, specific relationship with food.
- **Body composition** — diet + activity → weight drift; affects clothing fit, self-presentation. See docs/design/someday.md.
- **Multi-scope reputation** — corner store, soup kitchen, food bank, street, bus stop have recognition tiers. Named neighbor implemented. Remaining: additional block characters, longer arcs.

### Sensory system — remaining

33 observation sources implemented. Remaining: **Acoustic space as location property** — `{ reverb, absorption, floor }` on each location. See docs/design/someday.md.

### Financial cycle — remaining

Basic cycle implemented. Remaining debts:
- Housing-type-dependent bill variations (all-inclusive rentals)
- Overtime exemption for salaried/exempt roles; fixed-arrangement guaranteed minimum hours; deductions — `grep 'Approximation debt (paycheck)'`
- Apartment size, insulation, heating type, local energy prices — `grep 'Approximation debt (utilities)'`
- Non-formal income patterns (cash, irregular)
- **Housing displacement** — couch/shelter/street paths implemented. Remaining: shelter NPCs, social dynamics, deeper intake texture. `grep 'displaced'` for all sites.

### Shift variety — remaining

Fixed/rotating/on_demand arrangements implemented. Weekend schedules, night shifts, shift-reveal for rotating workers done. Remaining: split shifts (two separate blocks in one day).

### More employment types

Gig work basic implementation done. Remaining gig debts: `grep 'Approximation debt (gig)'`. Freelance/commissions, informal (cash), unemployed, can't work — not yet modeled. Capital ownership, investment income, etc. — see docs/design/someday.md.

### Ending conditions

Runs never finish. No mechanism for a life ending or the game concluding.

### Leisure and downtime — remaining

Most interactions implemented. Remaining:
- **Gym** — needs membership state + monthly cost + commute
- **Journaling / Notes integration** — design question: are these separate writing modes or should they merge?
- **Journaling NT calibration** — `grep 'Approximation debt (journaling)'`

### Grocery system — design doc complete, not yet implemented

See docs/design/grocery.md. Full design covering:
- **Food profile at chargen** — cultural tradition, ethical stance, health restrictions, cooking skill, comfort foods. Derived from backstory.
- **Character-specific pantry** — expanded vocabulary (grains, proteins, produce, condiments, snacks), 6-10 active slots per character from food profile.
- **Cooking repertoire** — 4-7 meals the character actually makes, derived from profile + pantry contents. Skill gates complexity.
- **Habit-driven shopping** — pantry levels added to habit feature vector. The CART trees learn cooking patterns and suggest restocking. No explicit shopping list.
- **Snacks/impulse layer** — NT-driven, not pantry-driven. Serotonin/dopamine-gated availability.
- **Disordered/dysregulated eating** — stress eating (cortisol-driven), binge eating (restriction + impulsivity + distress), ADHD eating dysregulation (forgetting, dopamine-seeking, executive collapse at cooking step), autism sensory food restriction (safe foods, texture gates), depression appetite (bidirectional).
- **Failure modes by condition** — executive function cascade around food (forgot while cooking, can't start, sensory overwhelm, nothing sounds good, didn't leave apartment, comfort food instead of groceries).
- **Grocery store location** — deferred until food desert mechanic creates genuine access gap.

Supersedes previous "Cooking — remaining" note. Pantry ingredient system and five cook interactions still implemented. Refeeding syndrome integration still deferred (see docs/design/health.md).

### Sleep cycle approximation debts

`grep 'Approximation debt (sleep cycles)'` in state.js + chargen.js — 8 open sites.

### Domestic object systems — remaining

Dishes, Linens, Clothing implemented. Remaining:
- Full laundromat as location node (NPCs, vending machine) — deferred to someday.md
- Clothing fit defaults to `comfortable` until `Body.dimensionAtTime()` wired

### Weather depth — remaining

Temperature model implemented as pure derived function. Remaining: full synoptic simulation (wind, humidity, pressure) — see docs/design/someday.md. Activity-level sweat rate model not yet implemented. `grep 'Approximation debt (hydration)'`.

### Phone — remaining

Real phone UI, Notes, Alarm, Calendar, Timer, battery, signal implemented. Remaining: slow phone (loading spinners), message queue for low-signal, signal variation by weather detail, phone model lifespan variation. `grep 'Approximation debt (phone aging)'`, `grep 'Approximation debt (phone signal)'`.

### Age-specific content — remaining

Basic `ageStageTier()` shading at 8 sites. Missing: different money sources by age, different relationship structures, midlife vs early-adult housing instability texture, teen/under-18 content.

### Family — remaining

Basic family implemented (chargen, messages, guilt, calls, dread, financial support). Remaining:
- Housing contingent on family (emergency housing option; hostile families as housing threat)
- Family member coming to visit (apartment state stakes)
- Fine-grained content warning toggles (domestic violence, sexual content, self-harm)

### Health system — remaining

Migraines, acute illness, dental pain, gastritis, hEDS/POTS/MCAS, vasovagal implemented. Deferred conditions needing upstream: diabetes, Long COVID/ME/CFS, eating disorders, Tourette syndrome. Pregnancy/contraception spec: see docs/design/health.md. Dental remaining: jurisdiction-based access, condition prevalence from life history. Healthcare locations remaining: GP, hospital, ER, pharmacy. `grep 'Approximation debt (dental)'`, `grep 'Approximation debt (MCAS)'`.

### Jurisdiction — remaining

`jurisdiction` implemented at chargen. `canPurchaseSubstance(type)` gates substance purchases. Indoor smoking restrictions partial. Remaining: healthcare access, reproductive rights, legal protections, dental access, US state-level patchwork, sub-national variation.

### Mental health as structural

Depression, anxiety, bipolar, PTSD, OCD as structural conditions — persistent floor that changes what's possible. Currently only modeled as stress + NT state.

### Neurodivergence — remaining

ADHD + autism chargen, idle thoughts, masking cost, special interest, hyperfocus × habit system all implemented. Remaining: deeper camouflaging variations, sensory overload as interaction-level gate.

### Substance system — remaining

Caffeine, nicotine, alcohol, cannabis implemented. Recovery pathway partial (cold turkey, craving, location triggers, NA/AA basic). Remaining:
- **Opioids** — prescription pathway, requires healthcare access
- **Medically supervised tapering** — requires clinic/prescription system
- **Sponsor relationship, chip milestones, recovery community** — deferred
- `grep 'Approximation debt (caffeine)'` (8 sites), `grep 'Approximation debt (cannabis)'` (15+ sites)

### Life history — target state

Every chargen parameter not derived from simulated history is a debt. Current backstory (`generateBackstory`, `simulateFinancialHistory`) is the prototype. Priority: keep replacing placeholder draws with derived ones.

### Narration voice — remaining

Personality shading, neurodivergence attention structure, hypervigilance/startle implemented. Remaining: deeper intrusive phenomenology (smell-as-trigger, flashbulb perception) — needs a memory system to anchor.

### Job standing — remaining

Coworker sentiment drift, job type precarity multiplier, pattern multiplier, work incident tracking all implemented. `work_incident` events recorded with types: late_arrival, poor_performance, missed_shift, called_in_sick. `workIncidentPatternTier()` and `workIncidentMultiplier()` in state.js. 2 incident-aware idle thoughts. Remaining: `grep 'Approximation debt (job standing)'` — 30-day window, 3/5 thresholds, 1.5×/2× multipliers, base penalties all chosen.

### Gambling — remaining

Scratch tickets basic implemented. Multi-card design (10–15 games, symbol-level simulation, near-miss from actual symbols) deferred — see docs/design/someday.md.

---

## Under Consideration

Everything below is drawn from the gap between docs/design/overview.md and what's built. Not committed to — just visible.

### System interfaces

See docs/design/interfaces.md. Remaining: Food, Finance, Job, Weather/Geo, Substances, Health wrapper modules.

### Mood system — remaining layers

Layers 1–5d implemented. Remaining: **Trauma sentiments** — high-intensity, processing-resistant. Needs trauma system (not yet designed). 28 of ~76+ hormones modeled. See docs/reference/hormones.md.

### Habit system — remaining

Phases 1–6 implemented. Remaining: **Numeric pre-fill** — parameterized interactions pre-fill fields when confidence is high.

### Identity — remaining

Structured identity model implemented: `PronounSet[]` (8 common sets + custom + mixed), `GenderIdentity` (4 continuous dimensions), `AttractionProfile` (split sexual/romantic/sensual/aesthetic), `perceivedPresentation()` derived function. Chargen UI shows pronoun/gender/attraction selectors. All mechanical sites rekeyed from pronouns to perceivedPresentation(). See `docs/design/identity.md`.

Remaining:
- **Race/ethnicity effects** — diagnostic gaps, housing discrimination, intersectional pay gap
- **Full pay gap by sector** — currently 82% flat; food_service/retail ~90%, professional ~75%
- **HRT supply management** — refills, pharmacy location, supply running out
- **Custom pronoun input** — chargen "custom" option defaults to they/them; needs subject/object/possessive/reflexive text inputs
- **LaborArrangement generification** — design notes only (separate project)
- **Allonormative/amatonormative pressure mechanics** — ace/aro characters in romance-normative contexts (designed, not yet implemented in content.js)
- **Aesthetic attraction → observation sources** — high aesthetic should feed senses.js people-watching
- **Demi gating mechanics** — `connection_depth` threshold for sexual attraction activation

### Performance and masking cost

Masking (autism/ADHD), code-switching (race/culture), the closet (sexuality), body management. Modeled as ambient energy drain varying by context. Some spaces let you drop it.

### The world outside the routine — remaining

Park, library, shelter, clinic implemented. Remaining: clinic appointment scheduling vs walk-in, insurance/jurisdiction model, specialist referrals, pharmacy location, full condition-specific treatments.

### Testing — example playthroughs

No automated e2e tests yet. Need: example playthroughs (seed + action sequence + expected state snapshots) that can be replayed deterministically to verify simulation correctness. Could double as regression tests for RNG consumption order, replay fidelity, and system coupling. Related: import/export system below.

### Import/export system

Save data is currently IndexedDB-only (opaque to the user). Need: export a run as a portable format (JSON) to clipboard or file, import from clipboard or file. Use cases: sharing specific playthroughs for testing/debugging, backing up saves, transferring between devices, seeding example playthroughs for e2e tests. Both clipboard (`navigator.clipboard`) and real file (`<a download>` / `<input type="file">`) paths.

### Far-future design specs

Detailed specs for the following live in design docs, not here:
- **Pregnancy and contraception** — see docs/design/health.md
- **Refeeding syndrome** — see docs/design/health.md
- **Dietary needs, economic dimensions, trauma system, upbringing, distance/absence, drawn lots** — see docs/design/someday.md
