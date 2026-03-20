# TODO

> **Workflow note:** Parallelization via subagents is always an option. Use it freely — fire multiple Explore/research agents simultaneously for independent audits, literature searches, or design questions. Don't serialize work that can run in parallel.

## Next

_(Cleared — see backlog for remaining items.)_

---

## Simulation correctness — known gaps

**Coworker drama modulation** — currently a τ=480min exponential recency curve (`grep 'Approximation debt (coworker drama)' js/world.js`). Ideally emergent from coworker sentiment + stress/NE levels rather than a timer: high NE + low coworker warmth → shorter effective τ; post-conflict resolution → faster recovery. Replace when interpersonal sentiment systems are calibrated enough to produce realistic spacing on their own.

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

### wakeUp() reduction

Target: `wakeUp()` sets `s.wake_period_start = s.time` and nothing else. Remaining: `daylight_exposure` — continuous accumulator; fractional-minute contributions per `advanceTime()` call make event summing expensive. Migrate when a per-tick event approach is cheap.

### Interrupt queue — remaining types

Alarm + time_to_leave + cooking timer + interview + medication reminder + work meetings implemented. Not yet wired:
- Calendar alerts: dates, anniversaries, flights

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

**Integration tests** — all contracts done (`tests/integration.test.js`, 40 tests): sleep, financial cycle, social decay, sentiment attenuation, interrupt queue, habit convergence, coworker drama cooldown.

**End-to-end / smoke tests** — done (`tests/e2e.test.js`, 9 tests, seed 42 fixture, snapshot + determinism + correctness).

### Clothing state — remaining

`clothing_cleanliness` and discrete damage implemented. Remaining: **Fit** — drifts slowly with body weight changes.

### Body care rituals — remaining

Stretch, skincare, hair, makeup, bath, physical therapy implemented. `grep 'Approximation debt (stretch)'` (2 sites), `grep 'Approximation debt (self-care)'` (4 sites), `grep 'Approximation debt (PT)'` (4 sites).

### Simulation gaps

- **Stomach capacity variation** — `fillStomach()` hardcodes capacity at 100 for all characters. Real stomach volume varies: gastric bypass (~30ml pouch vs ~1000ml normal), sleeve gastrectomy (~150ml), naturally smaller/larger stomachs. Per-character `stomach_capacity` derived from life history (bariatric surgery, body composition). Affects portion sizes, eating frequency, fullness duration, nausea threshold. Prose consequences: smaller capacity → can't finish meals, eats more often, specific relationship with food.
- **Body composition** — diet + activity → weight drift; affects clothing fit, self-presentation. See docs/design/someday.md.
- **Multi-scope reputation** — corner store, soup kitchen, food bank, street, bus stop have recognition tiers. Named neighbor with arc (talk_to_neighbor at recognized, neighbor_favor at known, 5 idle thoughts). Remaining: additional block characters.

### Sensory system — remaining

38 observation sources implemented (gym: 3, shelter: 3 added). Remaining: **Acoustic space as location property** — `{ reverb, absorption, floor }` on each location. See docs/design/someday.md.

### Financial cycle — remaining

Basic cycle implemented. Remaining debts:
- Overtime exemption for salaried/exempt roles; fixed-arrangement guaranteed minimum hours; deductions — `grep 'Approximation debt (paycheck)'`
- Apartment size, insulation, heating type, local energy prices — `grep 'Approximation debt (utilities)'`
- Non-formal income patterns (cash, irregular)
- **Housing displacement** — couch/shelter/street paths implemented. Shelter social dynamics added (staff interaction, meal, intake texture with time/weather/recognition, night idle thoughts). Remaining: shelter NPCs (named recurring residents), family-contingent housing (emergency housing option; hostile families as housing threat). `grep 'displaced'` for all sites.

### Shift variety — remaining

Fixed/rotating/on_demand/split/on-call arrangements implemented. Weekend schedules, night shifts, shift-reveal for rotating workers, split shifts (two blocks per day), on-call shifts (office workers, ~30%, post-shift window, 15% call-in probability, accept/decline interactions), voluntary extra shifts (phone interaction, schedules tomorrow's shift via setKnownShift) done. Remaining: shift swaps with coworkers.

### More employment types

Gig work basic implementation done. Remaining gig debts: `grep 'Approximation debt (gig)'`. Freelance/commissions, informal (cash), unemployed, can't work — not yet modeled. Capital ownership, investment income, etc. — see docs/design/someday.md.

### Leisure and downtime — remaining

Most interactions implemented. Journal and Notes are separate: Notes (phone app) for quick capturing; Journal (write_in_journal / read_journal) for reflective practice with NT effects. Remaining:
- **Journaling NT calibration** — `grep 'Approximation debt (journaling)'`

### Grocery system — partial

Food profile, pantry state, cooking repertoire, parameterized shopping, disordered eating, snack impulse layer all done. Remaining:
- **Grocery store location** — deferred until food desert mechanic creates genuine access gap
- Refeeding syndrome integration deferred (see docs/design/health.md)

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

`ageStageTier()` shading at 13 sites (8 original + 5 new: age-specific idle thoughts, coworker age-stage modifier, bathroom body awareness, waking body awareness). Missing: different money sources by age, different relationship structures, midlife vs early-adult housing instability texture, teen/under-18 content.

### Family — remaining

Basic family implemented (chargen, messages, guilt, calls, dread, financial support). Remaining:
- Housing contingent on family (emergency housing option; hostile families as housing threat)
- Family member coming to visit (apartment state stakes)
- Fine-grained content warning toggles (domestic violence, sexual content, self-harm)

### Health system — remaining

Migraines, acute illness, dental pain, gastritis, hEDS/POTS/MCAS, vasovagal implemented. GP clinic (extended see_doctor_clinic with illness prescription and hEDS referral), pharmacy (6 interactions: browse, fill_prescription, fill_hrt, buy_otc, pick_up_refill, leave), ER (4 interactions: er_check_in, er_wait, er_treatment, er_leave) implemented. medication_supply state with depletion in advanceTime(). Deferred conditions needing upstream: diabetes, Long COVID/ME/CFS, eating disorders, Tourette syndrome. Pregnancy/contraception spec: see docs/design/health.md. Dental remaining: jurisdiction-based access, condition prevalence from life history. `grep 'Approximation debt (dental)'`, `grep 'Approximation debt (MCAS)'`.

### Jurisdiction — remaining

`jurisdiction` implemented at chargen. `canPurchaseSubstance(type)` gates substance purchases. Indoor smoking restrictions partial. Remaining: healthcare access, reproductive rights, legal protections, dental access, US state-level patchwork, sub-national variation.

### Mental health as structural

Depression, GAD, PTSD, bipolar II, OCD implemented as NT target floor/ceiling modifiers with prevalence-grounded chargen rolls and 27 idle thoughts. OCD adds compulsion mechanic (check_lock, wash_hands_compulsive) with habituation cycle. Remaining: treatment pathways (medication, therapy — requires healthcare/pharmacy system).

### Neurodivergence — remaining

ADHD + autism chargen, idle thoughts, masking cost, special interest, hyperfocus × habit system, sensory overload (`sensoryLoadTier()` with 4-tier gating + recovery) all implemented. Remaining: deeper camouflaging variations.

### Substance system — remaining

Caffeine, nicotine, alcohol, cannabis implemented. Recovery pathway partial (cold turkey, craving, location triggers, NA/AA basic). Chip milestones + meeting recognition arc implemented. Remaining:
- **Opioids** — prescription pathway, requires healthcare access
- **Full sponsor relationship** — current: sponsor offer at 10 meetings (prose + social bonus). Deferred: ongoing sponsor interactions, step work, sponsor as named NPC
- `grep 'Approximation debt (caffeine)'` (8 sites), `grep 'Approximation debt (cannabis)'` (15+ sites), `grep 'Approximation debt (recovery)'`, `grep 'Approximation debt (tapering)'`

### Life history — target state

Every chargen parameter not derived from simulated history is a debt. Current backstory (`generateBackstory`, `simulateFinancialHistory`) is the prototype. Priority: keep replacing placeholder draws with derived ones.

### Narration voice — remaining

Personality shading, neurodivergence attention structure, hypervigilance/startle implemented. Remaining: deeper intrusive phenomenology (smell-as-trigger, flashbulb perception) — needs a memory system to anchor.

### Job standing — remaining

Coworker sentiment drift, job type precarity multiplier, pattern multiplier implemented. Remaining: `work_incident` recording for future late-arrival / poor-performance penalties. Pattern multiplier threshold and multiplier are approximation debts.

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
- **LaborArrangement generification** — design notes only (separate project)
- **Allonormative/amatonormative pressure — remaining depth** — basic layer implemented (`isAce()`/`isAro()` in state.js, 6 idle thoughts, coworker_speaks + family call/message layer-3 modifiers). Remaining: friend conversations about dating, media consumption reactions, holiday/seasonal pressure, workplace event invitations (plus-one assumptions). `grep 'Approximation debt (allonormative pressure)'`, `grep 'Approximation debt (amatonormative pressure)'`, `grep 'Approximation debt (ace threshold)'`, `grep 'Approximation debt (aro threshold)'`

### Performance and masking cost

Masking (autism/ADHD), code-switching (race/culture), the closet (sexuality), body management. Modeled as ambient energy drain varying by context. Some spaces let you drop it.

### The world outside the routine — remaining

Park, library, shelter, clinic, pharmacy, ER implemented. Remaining: insurance/jurisdiction model, specialist referrals, full condition-specific treatments.

### Import/export system

Done — export as JSON file download + clipboard copy; import from file or clipboard paste. Version mismatch rejected with message.

### Far-future design specs

Detailed specs for the following live in design docs, not here:
- **Pregnancy and contraception** — see docs/design/health.md
- **Refeeding syndrome** — see docs/design/health.md
- **Dietary needs, economic dimensions, trauma system, upbringing, distance/absence, drawn lots** — see docs/design/someday.md
