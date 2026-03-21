# TODO

> **Workflow note:** Parallelization via subagents is always an option. Use it freely — fire multiple Explore/research agents simultaneously for independent audits, literature searches, or design questions. Don't serialize work that can run in parallel.

## Next

_(Cleared — see backlog for remaining items.)_

---

## Simulation correctness — known gaps

**Personality trait drift remaining debts** — all six traits now drift (neuroticism, self_esteem, rumination, trait_loneliness, introversion, sensory_sensitivity). Directions grounded in longitudinal research where available; magnitudes are approximation debts with no individual-level empirical basis. `grep 'Approximation debt (personality drift)' js/state.js`. Long-run target: traits should be consequences of fully simulated life history, not just initial draws with slow drift. Introversion drift direction: Roberts et al. 2006 PMID 16435954 (social vitality decrease with age). Sensory sensitivity drift direction: burnout/hypervigilance — no PMID; individual-level longitudinal SPS data does not yet exist in the literature.

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

- **Age → backstory.life_events** — event count scales with adult years. Changing age from 48→22 keeps the 48-year-old's life events. `simulateFinancialHistory()` IS recalculated in `finishCreation()` with the new age, but `generateBackstory()` is not.
- **Job → backstory** — backstory economic assumptions (career_stability, economic_origin probability weights) were generated for the original job type.
- **All derived properties** — food_profile (from backstory), housing_quality (from rent + origin), laundry_access (from housing_quality), conditions (backstory-modulated), substances (backstory-dependent), personality adjustments (from life_events).

Fixed: `patchCharacterForFinalValues()` now handles latitude → wardrobe (removes outerwear for tropical chars) and jurisdiction 'XX' → 'FR' remapping in `finishCreation()`.

`finishCreation()` regenerates `financial_sim` and `labor_arrangement` with the player's final values. Everything upstream of those stays stale for age/job changes.


### Biome expansion

Currently just latitude → derive everything. Future: richer geography object `{ latitude, humidity, elevation, coastal }` or similar. Specific dimensions:

- **Humidity** (coastal vs continental vs arid) — affects temperature feel, mold risk, hair texture, hydration needs
- **Elevation** — affects temperature, UV, pressure, cooking (boiling point), altitude sickness threshold
- **Coastal proximity** — sea breeze, salt air, marine layer, fog patterns
- **Mountain shadow** — rain shadow, föhn winds, microclimates
- **Biome type** — desert, rainforest, temperate forest, grassland, tundra → flora/fauna observation sources

`grep 'Approximation debt (biome):'` when ready.

### Chargen prose tone variation

Implemented — 4 personality-shaded interstitials (work/body/place/self) in `showCharacterScreen()`. Deterministic from personality params (neuroticism, self_esteem, introversion, sensory_sensitivity, rumination). No RNG consumed.

### Full wardrobe sandbox — remaining debts


- **Underwear/socks/shoes size labels:** `itemSizeLabel()` returns null for these types. Needs
  separate sizing logic (e.g., EU 36–46 for shoes, numeric waist for underwear).

- **Inseam/pants length:** `bottomSizeLabel()` gives waist only. Inseam requires height, not yet
  on character. See body composition debt (line 204).

- **Clothing fit** — `currentFit()` audit complete. Internal `_fit(item)` helper added to clothing.js; all 7 internal sites use it. content.js already used the module API. Remaining: `currentFit()` returns 'comfortable' fallback until `Body.dimensionAtTime()` wired.

---

## Code quality

### wakeUp() reduction

Target: `wakeUp()` sets `s.wake_period_start = s.time` and nothing else. Remaining: `daylight_exposure` — continuous accumulator; fractional-minute contributions per `advanceTime()` call make event summing expensive. Migrate when a per-tick event approach is cheap.

---

## Backlog

### NT baseline — remaining

Steps 1–5 complete. See `docs/design/nt-baseline.md`. Substance withdrawal now derives from `max(0, baseline - level)` — no separate accumulators. Re-run `bun run scripts/adversarial-eval.js` and verify no new pathologies.

### Adversarial tick evaluation

`scripts/adversarial-eval.js` implemented and updated (2026-03-20). `breathwork_unguided` flagged at 40.5% under composite stress objective — habit system over-recommends it. Calibration debt, not a bug. See `docs/design/adversarial-eval.md`.

### Integration and end-to-end tests

Unit tests (`tests/`) cover isolated modules. Two higher levels remain:

**Integration tests** — all contracts done (`tests/integration.test.js`, 40 tests): sleep, financial cycle, social decay, sentiment attenuation, interrupt queue, habit convergence, coworker drama cooldown.

**End-to-end / smoke tests** — done (`tests/e2e.test.js`, 9 tests, seed 42 fixture, snapshot + determinism + correctness).

### Clothing state — remaining

`clothing_cleanliness` and discrete damage implemented. Remaining: **Fit** — drifts slowly with body weight changes.

### Body care rituals — remaining

Stretch, skincare, hair, makeup, bath, physical therapy implemented. Body care debts calibrated: stretch grounded (Wong & Figueroa 2021 PMID 30789584, Arahata 2020 PMID 33239943), self-care grounded (Ekers 2014 PMID 24936656, Mueller 2022 PMID 35757667), PT grounded (Rice 2019 PMID 30625201, Young 2007 PMID 18043762). Values unchanged — directions confirmed, magnitudes remain chosen. `grep 'Approximation debt (stretch)\|Approximation debt (self-care)\|Approximation debt (PT)'`.

### Simulation gaps

- **Stomach capacity variation** — `stomach_capacity` parameterized in state.js (default 100). `fillStomach()` uses `s.stomach_capacity`. Bariatric surgery implemented: `has_bariatric_surgery` chargen roll (1% prevalence proxy, 1 charRng call), `applyToState()` sets capacity to 15 (sleeve gastrectomy ~150ml), 3 idle thoughts + eating prose modifier on all cooking interactions. Remaining: full derivation from simulated BMI history + insurance coverage. `grep 'Approximation debt (stomach capacity)'`.
- **Body composition** — diet + activity → weight drift; affects clothing fit, self-presentation. See docs/design/someday.md.
- **Multi-scope reputation** — corner store, soup kitchen, food bank, street, bus stop have recognition tiers. Named neighbor with arc (talk_to_neighbor at recognized, neighbor_favor at known, 5 idle thoughts). Corner store clerk (talk_to_clerk at familiar+, named at regular, usual-item reference, 2 idle thoughts). Bus stop regular (nod_to_regular at recognized+, named at recognized, brief exchange at familiar, 2 idle thoughts). Shelter residents (3 named NPCs, nod_to_shelter_resident at familiar+, talk_to_shelter_resident at regular, 4 idle thoughts). All recognition NPC arcs complete.

### Sensory system — remaining

40 observation sources implemented (gym: 3, shelter: 3 added). Acoustic space properties fully wired: `applyAcousticModulation()` handles reverb suffixes (>0.4), absorption suffixes (>0.6), and floor-type suffixes (10 types: carpet, tile, linoleum, wood, hardwood, concrete, rubber, asphalt, grass, gravel) — all deterministic, no RNG.

### Financial cycle — remaining

Basic cycle implemented. Remaining debts:
- Paycheck deduction fidelity — progressive tax + FICA + state tax + employer insurance implemented. `grep 'Approximation debt (paycheck)'` for remaining calibration debts.
- Utilities modeled: `apartment_size` + `insulation_quality` + `heating_type` + seasonal temperature → variable `utilitiesAmount()` ($45–$155). Remaining: local energy prices. `grep 'Approximation debt (utilities)'`
- Non-formal income patterns (cash, irregular) — basic find_day_work/do_day_work + freelance completion prose implemented. Remaining: `grep 'Approximation debt (informal work)'`, `grep 'Approximation debt (freelance)'`.
- **Housing displacement** — couch/shelter/street paths implemented. Shelter social dynamics added (staff interaction, meal, intake texture with time/weather/recognition, night idle thoughts, named recurring residents with 5 archetypes and recognition-gated prose). Family-contingent housing implemented: hostile/critical families available with higher NT costs (doubled cortisol, faster strain day 5, ejection day 10, sleep quality 0.85x), displacement event prose acknowledges family safety net availability, idle thoughts for displaced+family-dread states. `grep 'displaced'` for all sites. `grep 'Approximation debt (hostile family housing)'` for family housing debts.

### More employment types

Gig work basic implementation done. Remaining gig debts: `grep 'Approximation debt (gig)'`. Freelance and informal (cash) scaffolded: `do_freelance_work` (apartment/library, project-based, pay on completion), `find_day_work` + `do_day_work` (street, immediate cash, time-gated availability, weather-gated: blocks on heavy_rain/storm/temp<-5°C, 25% not-found outcome). `isFreelancer()`, `isInformalWorker()`, `hasEmployer()`, `isUnemployed()`, `cantWork()` in state.js. `'unemployed'`/`'cant_work'` job types implemented: chargen labels, applyToState() branches, 12 idle thoughts (6 each type). Capital ownership, investment income — see docs/design/someday.md.

### Leisure and downtime — remaining

Most interactions implemented. Journal and Notes are separate: Notes (phone app) for quick capturing; Journal (write_in_journal / read_journal) for reflective practice with NT effects. Journaling calibrated: values reduced from breathwork/yoga level to cognitive-pathway level (Pennebaker 1988 PMID 3372832, Smyth 1998 PMID 9489272, DiMenichi 2018 PMID 29628878); adenosine clearing removed (adenosine is sleep-cleared, not cognition-cleared); streak grounded (Frattaroli 2006 PMID 17073523). `grep 'Approximation debt (journaling)'` for remaining debts (magnitude ratios, lerp ranges).

### Grocery system — partial

Food profile, pantry state, cooking repertoire, parameterized shopping, disordered eating, snack impulse layer all done. Remaining:
- **Grocery store location** — deferred until food desert mechanic creates genuine access gap
- Refeeding syndrome integration deferred (see docs/design/health.md)

### Sleep cycle approximation debts

Sleep cycle debts resolved: inertia τ grounded at 40 min (Jewett 1999 PMID 10188130), cycle duration/N3/REM fractions validated (Carskadon & Dement, Ohayon 2004, Blume 2023), chargen probit precision reclassified, alarm response reclassified. Zero remaining `Approximation debt (sleep cycles)` sites.

### Domestic object systems — remaining

Dishes, Linens, Clothing implemented. Remaining:
- Full laundromat as location node (NPCs, vending machine) — deferred to someday.md
- Clothing fit defaults to `comfortable` until `Body.dimensionAtTime()` wired

### Weather depth — remaining

Temperature model implemented as pure derived function. Remaining: full synoptic simulation (wind, humidity, pressure) — see docs/design/someday.md. Activity-level sweat rate model not yet implemented. `grep 'Approximation debt (hydration)'`.

### Phone — remaining

Real phone UI, Notes, Alarm, Calendar, Timer, battery, signal, slow phone (loading prose + battery drain scaling + idle thoughts), message queue for low-signal implemented. Messages queue in `pending_messages` when `phone_service=false` or `phone_signal≤1`, delivered with distinct prose when signal returns. Signal variation by weather implemented: `phoneSignal()` derived function (base by location type + weather modifier + building modifier, range 0-5), `phoneSignalTier()` for prose, weak-signal texture on calls/messaging. Phone model lifespan variation implemented: `phoneSlownessTier()` ('fast'/'fine'/'slow'/'sluggish'), chargen ranges by economic origin, loading prose + crash mechanic (2% per open on sluggish). Remaining: `grep 'Approximation debt (phone signal)'`.

### Age-specific content — remaining

`ageStageTier()` shading at 28+ sites. Money by age (10 idle thoughts + paycheck/bill modifiers), relationship texture by age (12 idle thoughts + friend interaction modifiers), housing instability by age (9 idle thoughts for displaced characters). Missing: teen/under-18 content.

### Family — remaining

Basic family implemented (chargen, messages, guilt, calls, dread, financial support, emergency housing for hostile/critical families). Remaining:
- Fine-grained content warning toggles: `content_self_harm`, `content_substance_detail`, `content_family_abuse` implemented (v18). Per-character, stored on character object, checkboxes in chargen. `content_self_harm` is infrastructure — no self-harm prose exists yet; toggle gates future content. Remaining: domestic violence toggle, sexual content toggle when those systems are built

### Health system — remaining

Migraines, acute illness, dental pain, gastritis, hEDS/POTS/MCAS, vasovagal implemented. GP clinic (extended see_doctor_clinic with illness prescription and hEDS referral), pharmacy (6 interactions: browse, fill_prescription, fill_hrt, buy_otc, pick_up_refill, leave), ER (4 interactions: er_check_in, er_wait, er_treatment, er_leave) implemented. medication_supply state with depletion in advanceTime(). Dental insurance, dental_health decay, condition prevalence from life history (age/smoking/SES), visit_dentist_clinic interaction implemented. Annual dental insurance cap mechanic implemented (`dental_insurance_used`, `dental_insurance_cap`, `dental_insurance_plan_start`; `dentalInsuranceCoveredCost()` in state.js; 365-game-day reset in financial cycle). Deferred conditions needing upstream: diabetes, Long COVID/ME/CFS, eating disorders, Tourette syndrome. Pregnancy/contraception spec: see docs/design/health.md. Jurisdiction dental model implemented (`dentalCostMultiplier()` in state.js: GB NHS bands, CA CDCP, AU extras insurance, DE GKV, NL supplementary, FR 100% Santé); `has_dental_insurance` reused as NHS access proxy for GB and NL/AU supplementary insurance proxy. `grep 'Approximation debt (dental)'`, `grep 'Approximation debt (MCAS)'`.

### Jurisdiction — remaining

`jurisdiction` implemented at chargen. `canPurchaseSubstance(type)` gates substance purchases. Indoor smoking restrictions partial. Basic insurance model implemented (`insurance_type` at chargen, `healthcareCostMultiplier()`, monthly premium bill, coverage lapse on missed payment). Dental insurance modeled for US (job_type + economic_origin); non-US dental costs now jurisdiction-specific via `dentalCostMultiplier()` (GB/CA/AU/DE/NL/FR). Non-US public healthcare partially implemented: GB (NHS, 0.1× multiplier), CA (provincial Medicare, 0.15×), AU (Medicare/PBS, 0.2×), EU Western DE/NL/FR (0.15×); non-US characters set `insurance_type='public'` at chargen (no premium bill). Pharmacy covered-cost prose fires deterministically when multiplier < 0.25 and cost < $5. Trans healthcare jurisdiction gating implemented: `transHealthcareAccess()` in state.js returns accessible/restricted/hostile/banned; `fill_hrt_prescription` gated and gets cost uplift + prose suffix in restricted/hostile jurisdictions (FL SB 254 → hostile; GB NHS wait times → restricted); 1 idle thought per tier. `grep 'Approximation debt (trans healthcare jurisdiction)'` for debts. Remaining: reproductive rights, abortion access, legal name change barriers, US state-level Medicaid trans exclusions (TX, GA — affect low-income characters only, not modeled), prescription coverage variation within non-US systems, sub-national variation. `grep 'Approximation debt (insurance)'` for all insurance-related debts.

### Mental health as structural

Depression, GAD, PTSD, bipolar II implemented as NT target floor/ceiling modifiers with prevalence-grounded chargen rolls and 27 idle thoughts. Medication treatment pathways implemented: antidepressant (SSRI, 21-day onset), anxiolytic (buspirone, 7-day onset), mood stabilizer (14-day onset). All effects via NT target modifiers, onset ramp via `psych_med_start` tracking. `grep 'Approximation debt (psych medication)'` for calibration debts. Therapy implemented: weekly appointments via interrupt queue, `therapyRapportTier()` (none/tentative/building/established/strong), attend_therapy/skip_therapy/cancel_therapy/choose_therapy_modality interactions, serotonin target modifier at rapport > 50, 10 idle thoughts (6 base + 4 modality-specific). Three modalities: CBT (cortisol target, cognitive restructuring prose), DBT (GABA/serotonin targets, neuroticism bonus, distress tolerance prose — Linehan 2006 PMID 16816451), EMDR (cortisol/NE targets, PTSD bonus, bilateral stimulation prose — Chen 2015 PMID 25527872). Player selects modality via `choose_therapy_modality` after referral. `grep 'Approximation debt (therapy modality)'` for calibration debts.

### Neurodivergence — remaining

ADHD + autism chargen, idle thoughts, masking cost, special interest, hyperfocus × habit system, sensory overload (`sensoryLoadTier()` with 4-tier gating + recovery), deeper camouflaging (`masking_fatigue` state, context-dependent intensity, post-masking crash, mask slippage, `unmask_home` interaction, 6 idle thoughts) all implemented. `grep 'Approximation debt (autism masking)'` for calibration debts.

### Substance system — remaining

Caffeine, nicotine, alcohol, cannabis implemented. Recovery pathway partial (cold turkey, craving, location triggers, NA/AA basic). Chip milestones + meeting recognition arc implemented. Remaining:
- **Opioids** — implemented: prescription pathway via clinic, `opioid_level`/`opioid_tolerance`, `take_pain_medication` interaction, `opioidTier()`/`opioidWithdrawalTier()`, hEDS characters start with prescription. `grep 'Approximation debt (opioids):'`
- **Sponsor relationship** — named sponsor NPC at 10 meetings (rng-generated), call_sponsor/text_sponsor/meet_with_sponsor interactions, craving reduction, relapse-aware prose, 11 idle thoughts. Step work progression implemented: `recovery_step` (0–12), `recoveryStepTier()`, step-specific meet_with_sponsor prose, step advancement every 3–5 meetings, step-aware craving modifiers. Sponsor backstory: `sponsor_years_sober`, `sponsor_substance`, `sponsor_communication_style` at chargen; style-aware call_sponsor/text_sponsor prose; 4 backstory idle thoughts keyed on rapport/step.
- `grep 'Approximation debt (caffeine)'` (8 sites), `grep 'Approximation debt (cannabis)'` (15+ sites), `grep 'Approximation debt (recovery)'`, `grep 'Approximation debt (tapering)'`

### Life history — target state

Every chargen parameter not derived from simulated history is a debt. Current backstory (`generateBackstory`, `simulateFinancialHistory`) is the prototype. Priority: keep replacing placeholder draws with derived ones.

### Narration voice — remaining

Personality shading, neurodivergence attention structure, hypervigilance/startle implemented. Sensory trigger intrusion (trauma_echo observation source), flashbulb perception (hyperspecific detail modifier), and PTSD idle thoughts implemented. Remaining: a full memory system would enable specific trigger-to-memory anchoring (currently the intrusion is abstract — the body's response without named content).

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

Phases 1–6 + numeric pre-fill implemented. `suggestedData(interactionId)` in habits.js returns the most frequent data value from recent action history when CART confidence ≥ 0.75. Pre-fills: alarm time (set_alarm), timer duration (start_timer), help amount (help_friend). Player still confirms — no auto-submit.

### Identity — remaining

Structured identity model implemented: `PronounSet[]` (8 common sets + custom + mixed), `GenderIdentity` (4 continuous dimensions), `AttractionProfile` (split sexual/romantic/sensual/aesthetic), `perceivedPresentation()` derived function. Chargen UI shows pronoun/gender/attraction selectors. All mechanical sites rekeyed from pronouns to perceivedPresentation(). See `docs/design/identity.md`.

Remaining:
- **Race/ethnicity effects** — implemented: intersectional pay gap (racial wage multiplier × gender pay gap), code-switching fatigue, diagnostic disparities (pain undertreatment modifier in `see_doctor_clinic` and `er_treatment`; direction from Hoffman 2016 PMID 26951674), housing discrimination (callback gap in `apply_for_apartment`; Pager & Shepherd 2008 DOI 10.1146/annurev.soc.34.040507.134833), 8 idle thoughts (4 Black, 4 non-white). `grep 'Approximation debt (race/ethnicity)'`, `grep 'Approximation debt (racial pay gap)'`
- **LaborArrangement generification** — design notes only (separate project)
- **Allonormative/amatonormative pressure** — fully implemented: `isAce()`/`isAro()` in state.js, 21+ idle thoughts (workplace plus-one, holiday/seasonal, friend-context, media-residue), friend dating conversation modifiers (hang_out/call_friend), watch_content media reaction, coworker_speaks + family call/message layer-3 modifiers. `grep 'Approximation debt (allonormative pressure)'`, `grep 'Approximation debt (amatonormative pressure)'`, `grep 'Approximation debt (ace threshold)'`, `grep 'Approximation debt (aro threshold)'`

### Performance and masking cost

Masking (autism/ADHD): `masking_fatigue` state var, context-dependent intensity (workplace > stranger > friend scaled by connection depth > home), post-masking crash on returning home, involuntary mask slippage at high fatigue, `unmask_home` interaction, 6 idle thoughts. Code-switching (race/culture): `code_switching_fatigue` state var (0-100), context-dependent accumulation (workplace 3.5/hr, stranger 1.5/hr, friend scaled by depth, home recovery 2.0/hr), cleared by sleep, feeds cortisol (+0.06×) and serotonin (−0.04×) targets, 6 idle thoughts. The closet (sexuality), body management also modeled as ambient energy drain varying by context. Some spaces let you drop it.

### The world outside the routine — remaining

Park, library, shelter, clinic, pharmacy, ER implemented. Basic insurance model implemented (cost multiplier at all pharmacy/ER/clinic/dental sites). Specialist referrals and condition-specific treatments implemented (`see_specialist` for physio/allergist/cardiology/gi/neurology). Treatment state vars wired into triggers: `migraine_threshold` scales base chance via `thresholdMult`, `mcas_flare_risk` multiplies all MCAS nausea rates (`mcasRate = flareRisk/40`), `pots_standing_tolerance` applies `potsRateMult` to vasovagal accumulation for POTS characters. Remaining: non-US jurisdiction model.

### Import/export system

Done — export as JSON file download + clipboard copy; import from file or clipboard paste. Version mismatch rejected with message.

### Far-future design specs

Detailed specs for the following live in design docs, not here:
- **Pregnancy and contraception** — see docs/design/health.md
- **Refeeding syndrome** — see docs/design/health.md
- **Dietary needs, economic dimensions, trauma system, upbringing, distance/absence, drawn lots** — see docs/design/someday.md
