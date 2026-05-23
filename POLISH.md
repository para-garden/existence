# Polish State

Created: f63c7fe (2026-05-22T18:54:28+10:00)
Last run: 2026-05-23
Round: 1
Project type: Browser game (ES modules, no build step) — text-based simulation

## Lenses

Round 1 ran eight lenses in parallel:

- **adversarial** — strongest case against the code
- **completeness** — silently accepted inputs / edge cases producing wrong outputs
- **overfit** — code tuned to one structural form of a phenomenon
- **consistency** — behavioral uniformity across analogous components
- **direction** — alignment with CLAUDE.md design principles (emergence over labels, derived not stored, etc.)
- **scope** — module ownership / state belongs to its system
- **correctness** — bugs, math, RNG discipline
- **trust-of-research** — citation hygiene, parameter justification

## Scope

`js/` (all modules) plus `docs/` for trust-of-research only.

## Findings — Round 1

Cross-lens duplicates merged. Severity is the highest assigned by any reporting lens. Findings grouped by theme then severity.

### THEME A — Bugs in event/wakeUp coupling (highest priority — these are real wrong behaviors today)

- [APPLIED] `js/state.js:3540-3542` — `s.on_call_checked_today = false` is OUTSIDE the `wakeUp()` closing brace; runs once at module init only. After first on-call check, the flag never resets — `world.js:903` permanently sees it true. (flagged by adversarial + completeness) — moved inside `wakeUp()` _(severity: high)_
- [APPLIED] `js/world.js:362-367` — `if (destId === 'shelter') shelter_visits++` duplicated; counter inflated 2× per arrival. — deleted one copy _(severity: high)_
- [APPLIED] `js/world.js:378 and :405` — `events.record('arrived_at_work')` called twice per arrival (bare + with data). For split shifts (`maxArrivals === 2`), the second arrival hits `count >= 2` and is silently dropped — no clock-in, no hours, no lateness for the second block. — removed bare record at 378 _(severity: high)_
- [APPLIED] `js/content.js:4547 vs :5113` — `slept_through_alarm` is recorded BEFORE `wakeUp()` resets `wake_period_start`; the morning-prose check at 5113 queries against the new wps, so the slept-through prose never fires. — hoisted `prevWps` capture before the missed-shift block; morning query at 5113 now uses `prevWps` _(severity: high)_
- [APPLIED] `js/habits.js:158` — `time_since_wake: lastWakeTime > 0 ? ... : 99999`. First-ever wake has `time === 0`, so feature defaults to 99999 forever, biasing every CART split. — `lastWakeTime` is now `number | null`, init/reset to null, guard uses `!== null` _(severity: high)_
- [APPLIED] `js/content.js:4534-4557` — sleep-alarm scan breaks after first 'alarm' interrupt; subsequent alarms (medication, secondary alarm) stay scheduled and fire post-wake at wrong times. — now collects all in-window alarms, acts on the earliest, reschedules the rest to next day _(severity: medium)_
- [APPLIED] `js/content.js:4800` — `sleepStartDay` heuristic ignores when sleep started; mis-attributes the workday for sleeps that cross midnight in unexpected directions. — replaced with `absoluteDayFromTime(prevWps)`; added helper to state.js _(severity: medium)_

### THEME B — Replay determinism is broken (the project's stated invariant)

- [APPLIED] `js/game.js:711-716` — replay snapshots only `getRngState()` (game stream); cosmetic prose and background NPC simulation diverged from the original session. Bucket 3 generalized the API to multi-stream (`getRngStates`/`setRngStates` covering game/cosmetic/background; `charRng` excluded because chargen never re-runs during play). Save version bumped 34→35. _(severity: high)_
- [PENDING] `js/habits.js` (`trainingData`, `lastWakeTime` closures) — not snapshotted; after replay/reload, suggestions diverge from original session. — persist or document _(severity: medium)_
- [PENDING] `js/senses.js:50, 1703-1708` — `lastSensoryGameTime` is closure-local; post-restore cooldown gate is wrong. — snapshot or move to state _(severity: low)_
- [PENDING] `js/events.js:1-78` vs `js/game.js:715, 844` — header comment says event log is reconstructed; implementation persists it. Decide which contract is real. _(severity: low)_
- [APPLIED] `js/chargen.js:1322-1332, 1381-1391, 1860-1867` — three RNG-padding off-by-one bugs in `generateFriendNPC` / `generateCoworkerNPC` / family generation. Round 1 fix balanced all three branches; re-verification (bucket 3) confirmed each site consumes exactly 4 charRandom calls regardless of `childCount`. _(severity: medium — chargen stream determinism)_
- [PENDING] `js/world.js:789-790` and analogous — chance+pick RNG consumption asymmetric across branches; balance call missing where the file elsewhere maintains it. — preserve always-N-calls discipline _(severity: low)_

### THEME C — Labels masquerading as simulation (direction + overfit convergence)

- [PENDING] `js/chargen.js:2844-2864` + `js/realization.js:2694-2715` — neighbor `archetype` (7 strings) drives prose dispatch directly. CLAUDE.md explicitly forbids this pattern. — replace with per-NPC personality + behavior params (smoking habit, chronotype, dog-owner, sociability); pools weighted by params _(severity: high)_
- [PENDING] `js/chargen.js:2884-2905` + `js/content.js:4031-4042` — shelter-resident archetypes (`quiet_corner`, `loud_laugh`, …); ternary chain in content.js. — same fix _(severity: high)_
- [PENDING] `js/chargen.js:2925-2931` — `sponsor_communication_style: 'direct'|'warm'|'practical'` 3-way roll. — continuous warmth/directness params _(severity: medium)_
- [PENDING] `js/state.js:733-737` + `js/content.js:20569, 25253, 26544, 28499, 29380, 30781, 32534, 32536` + `js/game.js:230` — `family_type` label coexists with continuous `family_warmth`/`openness`/`stability`. Already-noted migration (`familyBehaviorTier()`) is incomplete. — finish migration; remove `family_type` _(severity: high)_
- [PENDING] `js/chargen.js:2032-2040` — `cultural_tradition` is one of 8 strings driving lactose-intolerance rate by national label. — ancestry composition vector _(severity: medium)_
- [PENDING] `js/chargen.js:1427-1434` — personality (neuroticism, self_esteem, rumination, trait_loneliness, introversion) drawn uniform 0-100 BEFORE backstory generation. CLAUDE.md says backstory should shape personality, not the reverse. — restructure or mark explicitly as debt _(severity: high)_
- [PENDING] `js/chargen.js:65-99` — `expressionFromPronounSet()` derives expression from pronoun set for NPCs. Violates "Identity dimensions are orthogonal." — sample independently _(severity: low)_

### THEME D — Stored counters that should be derived from event timestamps

- [PENDING] `js/state.js:779-781` — `couch_days`, `family_stay_days` counters incremented per night. Already have housing situation start time. — derive `time - housing_start / 1440` _(severity: medium)_
- [PENDING] `js/state.js:1031-1033` + 4 content.js sites — `pt_session_count` lifetime counter. PT progress is sensitive to gap structure that a monotone counter discards. — store session events with timestamps; derive progress _(severity: medium)_
- [PENDING] `js/state.js:848, 857` + `js/world.js:351-359` — `neighbor_encounters` / `bus_regular_encounters` are stored increment counters used to tier recognition. Discards recency (yesterday vs year-ago equivalent). — list of timestamped encounters, derive recognition _(severity: medium)_
- [PENDING] `js/state.js:682, 783` — `therapy_sessions` lifetime counter, `shelter_visits` written-but-never-read (also incremented 2× per Theme A). — derive or delete _(severity: low)_
- [PENDING] `js/state.js:818` — `gym_checkins_this_week` + reset gated on `currentAbsoluteDay() % 7 === 0` (skips if wake doesn't land on day 7). — track last reset day _(severity: low)_
- [PENDING] `js/state.js:707-708` — `gastritis_treatment_recent` boolean redundant with existing `gastritis_treatment_time` timestamp. — predicate from timestamp _(severity: low)_
- [PENDING] `js/state.js:670` + `clinic_ready` / `er_ready` — booleans gating availability when timestamps already exist. — derived predicates _(severity: low)_

### THEME E — Booleans that snap state at thresholds (violates "gradients, not binaries")

- [PENDING] `js/state.js:710, 2271, 2283, 2231` — `migraine_quiet_resolved` boolean switches decay 8→16. — per-attack continuous `resolution_speed` _(severity: medium)_
- [PENDING] `js/state.js:376, 394, 2583, 2595` — `needs_period_supplies`, `cramps_active` booleans driven by `cramp_severity > 0.15 && d <= 3`. Redundant with continuous severity. — tier on severity _(severity: medium)_
- [PENDING] `js/state.js:714, 2648-2651, 3530, 9508` — `heds_new_joint_today` boolean adds flat +15 pain, cleared at sleep. Step function. — event with intensity that decays _(severity: medium)_
- [PENDING] `js/state.js:769, 774, 780` — `displaced`, `family_stay_strain`, `couch_strain` flip at `days >= 7` / `days >= 5`. — continuous strain accumulators _(severity: medium)_
- [PENDING] `js/state.js:3918-3933` — `wakeUp()` snaps `sensory_load = 0`, `social_energy = 100`, `masking_fatigue = 0`, `code_switching_fatigue = 0`, `histamine = 35`. CLAUDE.md: don't snap state; shift target. — raise target during sleep _(severity: medium)_
- [PENDING] `js/state.js:257-275, 3977-3999` — `alcohol_sleep_flag` / `cannabis_sleep_flag` re-encode information already in continuous `alcohol_level` / `cannabis_level` at sleep onset. — derive _(severity: low)_

### THEME F — Module scope/ownership violations

- [APPLIED] `js/ui.js` — render-time mutation in `renderPhone()` (msg.read, friend_contact timestamp, guilt sentiment) moved into a new `read_friend_thread` interaction dispatched from the thread-open click handler. Side effects now flow through the action pipeline and replay deterministically _(severity: high)_
- [APPLIED] `js/ui.js` + `js/state.js` — phone screen navigation (`phone_screen`, `phone_thread_contact`, `phone_prev_screen`, `phone_note_index`) moved to UI-local closure state in ui.js; removed from state defaults; all `phone_screen === 'X'` predicates dropped from content.js interactions (UI controls which buttons render). Thread-context interactions (reply_to_friend, message_friend, help_friend, ask_for_help, reach_out_to_friend, call_friend, call_family, read_family_message, reply_to_family) now accept `{ contact }` data instead of reading state. Save version 35 → 36 _(severity: high)_
- [PENDING] `js/content.js:6555-6708` — `laundry_phase` state machine split: clothing.js owns items, content.js owns the phase. — move phase into clothing.js _(severity: medium)_
- [PENDING] `js/game.js:1510-1700` — game.js (dispatcher) holds the routine-comfort/irritation sentiment formula + thresholds. — expose `ctx.habits.recordActionForSentiment(...)` and centralize there _(severity: medium)_
- [APPLIED] `js/content.js` (71 sites) — `ctx.body.hasUterus() && ctx.state.get('cramps_active') && !ctx.state.isCrampRelieved()` duplicated. — added `body.crampsInterfering()` helper; swept all 71 sites _(severity: medium)_
- [PENDING] `js/world.js:533-748` — world.js does cross-domain consequence writes (job termination, sentiment, NT, family visit, calendar alerts) inline in `checkEvents`. — register per-domain interrupt handlers; world becomes a thin dispatcher _(severity: medium)_
- [PENDING] `js/world.js:687-749` + `js/state.js` `last_surfaced_*_tier` — surfacing-cadence (UI presentation) state stored in simulation state. — extract to surfacing helper _(severity: low)_
- [PENDING] `js/state.js:366-369` — `current_calendar_alert` / `current_flight_alert` are render-coupled state in save. — return alongside event id _(severity: low)_

### THEME G — RNG/tier discipline drift

- [PARTIAL] `js/content.js` — `ctx.timeline.weightedPick(...)` used for prose-only output. Converted 25 prose-only sites to `cosmeticWeightedPick`; left 7 mechanical sites on game stream (`const tone`, `const activity` ×2, `const { amount, nearMiss }`, `const callQuality` ×2, `const responseItem` — pick result drives NT/money/social mutations downstream). _(severity: high)_
- [PENDING] Raw NT threshold comparisons → tier functions (defer): no NT tier functions exist; needs design call on thresholds per NT (serotonin/dopamine/NE/GABA/adenosine/cortisol/histamine) before sweeping. Sites: `js/content.js:7815, 8016, 8699, 9113, 9279, 9479, 9670, 11019, 21891, 30133`, `js/senses.js:786, 796`, `js/game.js:116`. _(severity: high)_
- [PENDING] `js/state.js:7319-7323` — `adjustNT(key, amount)` silently no-ops on unknown key; typos invisible. (flagged by completeness + adversarial) — throw or constrain key _(severity: medium)_
- [PENDING] `js/timeline.js:130-209` — `weightedPick` / `cosmeticWeightedPick` / `charWeightedPick` crash on empty array (`items[-1].value`); weight-0 items can still be returned via the `r <= 0` path. — guard empty + `r < weight` style _(severity: medium)_
- [APPLIED] `js/timeline.js` stream API symmetry — added `cosmeticRandomInt`/`cosmeticPick`, `backgroundRandomInt`/`backgroundPick`/`backgroundWeightedPick`. Swept 4 background sites in state.js and 14 game-stream integer-pick sites in content.js to use the new methods (verified per-site that none switched streams). _(severity: medium)_
- [APPLIED] `js/content.js` (9 sites) — chained tier-equality converted to `.includes(tier)`. _(severity: medium)_
- [PENDING] `js/content.js:1594, 20384, 20471, 20609, 25288+` — exhaustive tier if/else-if where CLAUDE.md prescribes `switch`. — convert _(severity: medium)_
- [PARTIAL] `js/state.js:8187` clamp helper — exported on state return object; swept 24 inline `Math.max(0, Math.min(100, …))` sites across state.js (16), body.js (2), character.js (2), chargen.js (5). 2 sites in clothing.js skipped (top-level exported helpers without ctx access). _(severity: low)_

### THEME H — `??` fallbacks on character fields (CLAUDE.md forbids these)

- [PENDING] `js/content.js` (~392 sites) and `js/state.js` (~89 sites) — `?? false`, `?? 0`, `?? []` shims on `autism`, `adhd`, `synesthesia`, `apd`, `has_ptsd`, `heds`, `hrt_active`, `family_unreachable`, etc. — remove fallbacks; bump save version; ensure chargen seeds every field _(severity: high — pervasive, but per CLAUDE.md the rule is unambiguous)_

### THEME I — Code holding live references / mutation hazards

- [PENDING] `js/state.js:1062-1064` — `getAll()` is a shallow spread; nested arrays (`sentiments`, `scheduled_interrupts`, `pantry`, `personal_calendar`, `health_conditions`, etc.) share refs with `s`. Any consumer that iterates and mutates corrupts live state. — return deep clone or freeze _(severity: medium)_
- [PENDING] `js/state.js:4444-4449` — `fireScheduledInterrupts` returns live interrupt refs with mutable `.fired`. — return copies or document _(severity: low)_
- [PENDING] `js/habits.js:258-434` — `findBestSplit`/predict: `undefined <= threshold` always false, so rows missing the split feature deterministically go right (contaminating). — skip or symmetric handling _(severity: medium)_

### THEME J — Long-running leaks

- [APPLIED] `js/state.js:4537+` — `scheduled_interrupts` keeps fired entries forever (no GC); alarm scan walks all of them each tick. — `fireScheduledInterrupts` now sweeps fired entries older than 7 days; safe because `rescheduleInterrupt` only mutates live entries _(severity: low)_
- [APPLIED] `js/state.js:5460` — `setKnownShift` grows `known_shifts` unbounded. — entries older than `currentAbsoluteDay() - 14` are dropped on each write _(severity: low)_
- [APPLIED] `js/state.js:4480` — `scheduleNextCalendarAlert` year-boundary edge: same-day event already past 9 AM never fires that year. — Re-verification (bucket 1+4) found no bug; iteration correctly handles year transitions. _(severity: low)_
- [APPLIED] `js/world.js:1016-1021` — displacement surfacing checks `events.last('displacement_surfaced')` over the entire run; a second displacement (after rehousing) never surfaces. — added `last_displacement_change_time` (set in `failBill` on false→true); world gate now uses `events.any(..., last_displacement_change_time)`. No clear-displaced path exists yet; commented at the set site for when rehousing lands. _(severity: medium)_
- [APPLIED] `js/world.js:660-720` — `last_surfaced_*_tier` for hunger and thirst leak: tier ramps back to none without an eat/drink event leave the stale tier; next ramp up doesn't re-fire. (bladder/energy are covered.) — added per-system reset to current tier on decrease, and to null when out of rank map; applied uniformly to hunger/thirst/bladder/energy _(severity: medium)_

### THEME K — "One structural form of a phenomenon"

- [PENDING] `js/chargen.js:1819-1832` — family generated in fixed slots (idx 0=parent, 1=parent-or-sibling, 2=sibling). Excludes step-parents, in-laws, chosen family, grandparents-as-primary, surviving partners, adopted. — `family_members[]` with open-ended `relationship_type` _(severity: high)_
- [PENDING] `js/chargen.js:1349-1361` + `js/state.js:1432-1435, 3591, 3706` — hardcoded 2 friends + 2 coworkers in named slots. Isolated and socially rich characters collapse equally. — variable-length lists _(severity: high)_
- [PENDING] `js/chargen.js:543-568` — office jobs hardcoded fixed/weekdays/9-to-5; no flex/compressed/part-time/overnight/hybrid. — same arrangement vocabulary as retail/food_service _(severity: medium)_
- [PENDING] `js/chargen.js:4298, 3081` — age locked 18–65. — widen + audit downstream age-derived defaults _(severity: medium)_
- [PENDING] `js/chargen.js:369` — `payRates` is one number per job type; ignores jurisdiction the rest of the codebase already models. — function of `(jobType, jurisdiction, age, stability)` _(severity: medium)_
- [PENDING] `js/chargen.js:1322-1333, 1860-1868` — NPC `has_partner` single boolean. — `partners: PartnerNPC[]` _(severity: medium)_
- [PENDING] `js/character.js:412` — `out_at_work`, `out_to_family` single booleans for trans-status disclosure. Outness is per-person and per-dimension. — per-NPC `known_dimensions` _(severity: medium)_
- [PENDING] `js/world.js:13-237` — one apartment layout for everyone (bedroom + kitchen + bathroom + living_room). Studio/shared/car/hostel all collapse to this. — locations parameterized by `housing_type` _(severity: medium)_
- [PENDING] `js/world.js:74-83` — travel times from `street` to each location hardcoded. `grocery_distance` already parameterized — same approach should generalize. — per-location distance on character _(severity: medium)_
- [PENDING] `js/world.js:317` — bus-stop stress applied only hours 7-9 / 16-18 (office-worker commute). Night-shift workers experience opposite crowding. — derive from population schedule or character shift offset _(severity: low)_
- [PENDING] `js/world.js:349-360` — neighbor / bus-regular encounter windows hardcoded 6am-10pm / 7-9am. Night-shift characters never encounter anyone. — gate on character awake-period _(severity: medium)_
- [PENDING] `js/state.js:4540-4561` — thirst/bladder tier thresholds population-mean; don't scale with `body_mass` or pregnancy/conditions. — derive from body params _(severity: medium)_
- [PENDING] `js/state.js:2566-2598` — period-supply consumption fixed; no flow intensity, no contraception, no condition modifiers; cramp window fixed `d <= 3` ignoring cycle_length variation. — proportional + scale with cycle_length _(severity: medium)_
- [PENDING] `js/state.js:1414-1418` — structural-gender job-standing modifier fires only for `food_service` / `retail` and only `fem_read`. Office discrimination unmodeled. — per-job-type table _(severity: medium)_
- [PENDING] `js/character.js:490-547` — `work_tasks_expected` per job type (office=4, retail=5, food_service=6) has no source in the phenomenon. — derive from shift hours or remove _(severity: medium)_
- [PENDING] `js/character.js:495-522, 552-556` — every character: `last_observed_time = alarmTod - 20`, `travelMinutes = 25`. Identical for all. — scale by personality / derive from housing _(severity: low)_
- [PENDING] `js/character.js:243-254` — opioid prescription gated only on `current.heds`. Any chronic-pain composite should qualify. — derive from composite _(severity: medium)_
- [PENDING] `js/character.js:543-545` — `unemployed_weeks` capped at 24 weeks. Real long-term unemployment is years. — widen distribution _(severity: medium)_
- [PENDING] `js/character.js:267-279` — dental health initial age penalty: three discrete bands. — continuous function _(severity: low)_
- [PENDING] `js/character.js:430-440` — single `neighbor`, `corner_store_clerk`, `bus_regular`. Buildings have many neighbors; clerks rotate. — arrays with weighted appearance _(severity: low)_
- [PENDING] `js/body.js:139-178` — BMI uses defaults `?? 70` / `?? 170` (covers up missing chargen); BMR ignores HRT duration despite comment noting it should not. — assert; include HRT shift _(severity: low)_

### THEME L — Behavioral consistency / inline duplication

- [PENDING] `js/content.js:6798, 19681, 25671, 26855` — bare `adjustMoney(-X)` skips `spendMoney()`'s notifications. — route all debits through `spendMoney` _(severity: high)_
- [PENDING] `js/content.js` (~15 routine-comfort/irritation sites) + `js/game.js:1551, 1698` — sentiment-rate constants `0.002`/`0.003`/`0.004`/`0.005`/`0.006` mixed for structurally identical events. — named strength tiers via helper _(severity: medium)_
- [PENDING] `js/state.js:7165-7181` — surfaced-tier reset strategy differs across analogous `adjust*` methods (`energy` ≥10, `hunger` <0, `thirst` always, `bladder` to null, `stress` has none). — uniform policy _(severity: medium)_
- [APPLIED] `js/content.js` (5 sites) — added `state.phoneUsable()` helper; swept duplicate `has_phone && phone_battery > 0 && !viewing_phone` predicate. _(severity: low)_
- [PARTIAL] `isStraight` centralization — added `state.isStraight()` (uses more-restrictive definition with romantic intensity check). Swept state.js:2090 (behavior change — now includes romantic check) and content.js:11181. Skipped chargen.js:2716 (attraction profile not yet stored in state at that point — uses local vars; helper definition matches). Further sites in content.js (16675, 25549, 26006, 26146, 30856, 30860, 34718, 34832, 34853) discovered but not swept — same predicate inline with mixed structure. _(severity: low)_
- [APPLIED] `js/senses.js:1533`, `js/chargen.js:669` — `Approximation debt (topic)` comments fixed to colon-noun format with notes. _(severity: low)_

### THEME M — Other unrelated bugs / edges

- [PENDING] `js/items.js:582-590, 567` — empty-container salience branch is dead because `s.count > 0` filter excludes it. — drop the filter or remove the branch _(severity: medium)_
- [PENDING] `js/items.js:257-296` — `remove` / `removeFrom` silently succeed when quantity unavailable; consumers can't tell. — return actual amount or assert _(severity: medium)_
- [PENDING] `js/world.js:767` — `weather_shift` chance fires per-`checkEvents`-call (per action), not per game-time delta. Fast-clicking player sees weather chaos. — gate on time delta _(severity: medium)_
- [PENDING] `js/world.js:820-839` — coworker-absence vs coworker-stress wired as `if/else` although documented as independent. — independent branches _(severity: medium)_
- [PENDING] `js/state.js:5337` — bills cycle fixed 30 days; real months are 28-31. _(severity: low)_
- [PENDING] `js/body.js:80-83` + dimension call site — `bindingFit()` hardcoded `'correct'`; documented debt, but the dimension ternary's `'correct'` branch is missing entirely, all binders fall through to the `else 25`. — fix ternary alongside binder migration _(severity: low)_
- [PENDING] `js/body.js:99-103` — `pregnancyWeek()` checks `=== null` only; `undefined` propagates NaN through `abdominalDimension`. — use `== null` _(severity: low)_
- [PENDING] `js/state.js:879-880 vs character.js:51` — `last_observed_money` default `47.50` is a magic constant matching but not derived from `sim.starting_money`. — single source _(severity: low)_
- [PENDING] `js/state.js:1145` — `stomach_capacity` 0/undefined → NaN propagates to hungerRate. — guard _(severity: low)_
- [PENDING] `js/state.js:1183-1196` — pantry expiry gated on `last_*_purchase > 0`; chargen-seeded pantry never expires. — verify chargen sets purchase times _(severity: low)_
- [PENDING] `js/state.js:7993-8025` — `processSleepEmotions` `effectiveQuality` clamped above but not below 0; future negative qualityMult would drift sentiments away from baseline. — `Math.max(0, ...)` _(severity: low)_
- [PENDING] `js/events.js:15` — `record('did_laundry')` vs `record('woke_by_alarm', {})` vs `record('slept', {…})`: implicit/explicit-empty/full styles mixed. — pick one _(severity: low)_
- [PENDING] `js/events.js:53-58` — `any()` relies on chronological insertion order to short-circuit; any future back-dated insert silently breaks. — document or iterate fully _(severity: low)_
- [PENDING] `js/game.js:1350-1357` — `replayInteraction` silently no-ops on missing id. Renaming an interaction without bumping save version causes silent divergence. — throw or log _(severity: low)_

### THEME N — Citation hygiene (TRUST-OF-RESEARCH lens — user must verify PMIDs)

- [PENDING] `js/chargen.js:2635` vs `docs/design/someday.md:184` — McGuffin 2003 bipolar h² cited with TWO different PMIDs (12505794 vs 12742871). One is wrong. — verify on PubMed; align _(severity: high)_
- [PENDING] `js/chargen.js:2527-2533` — hEDS comment claims 1-2% prevalence "consistent with" cited 0.2-0.5%. 2-10× the cited range. — raise threshold or explicitly state oversampling and why _(severity: high)_
- [PENDING] `js/character.js:193` — Schauer 2017 PMID 28329612 cited "for prevalence"; the cited paper is the STAMPEDE diabetes-outcomes RCT, not a prevalence paper. — verify or replace with ASMBS statistics _(severity: high)_
- [PENDING] ~10 sites of `PMID NNNNNNNN — PMID unverified` patterns (`chargen.js:2530, 2825, 2840`, `state.js:2794-2795, 8809-8813`) — concrete-looking PMID + tail qualifier; readers see number before qualifier. — move qualifier adjacent to number, or drop PMID until verified _(severity: medium)_
- [PENDING] `js/chargen.js:1432-1433` — `trait_loneliness` and `introversion` drawn uniform 0-100 with `// h²=48%` and `// h²=49%` annotations. h² has no operational effect on a uniform draw; comment frames invented as derived. — remove annotation or implement ACE decomposition _(severity: medium)_
- [PENDING] `js/state.js:1719` — "20% max reduction at full tolerance ... literature-supported ceiling." No citation. — cite or convert to debt _(severity: medium)_
- [PENDING] `js/chargen.js:2495` — chromesthesia 4% sourced to Cytowic & Eagleman trade book; methodological prevalence range is 0.05–4%. — debt comment with prevalence range; cite Simner 2006 if used _(severity: medium)_
- [PENDING] Concentration-risk PMIDs (user-verify priority): PMID 16273322 (Boomsma 2005) cited 5× across state.js/chargen.js/3 docs; PMID 11481155 (Geracioti 2001) cited 9× with author-noted Bremner confusion; PMID 9256517 (19×); PMID 30489119 (15×). _(severity: medium — concentration risk, not yet a bug)_

## Conflicts

No direct lens-vs-lens conflicts surfaced. Two near-conflicts to note for review:

- **Scope's `crampsInterfering()` helper vs Direction's "remove `cramps_active` boolean":** these are compatible — make the helper a tier function over continuous `cramp_severity`, which both lenses endorse.
- **`??` fallback removal (consistency lens, high severity) vs the existence of saves in active development:** the project explicitly purges old saves on version bump, so removing fallbacks is aligned with stated policy. Confirming this is the intent before doing a sweep of ~480 sites.

## Lens coverage gaps

Significant files / areas every lens flagged as skipped:

- **content.js (38k lines)** — every lens spot-sampled only. The interaction `execute()` paths almost certainly contain more variants of the bugs flagged here (event-query timing, RNG stream choice, `??` fallbacks).
- **realization.js (3.8k lines)** — only the neighbor-archetype site examined by direction lens; other prose-pool dispatching not audited.
- **chargen.js full body-params block** — only the personality/family/social-NPC region audited.
- **calibration.md and docs/research/** — research lens didn't line-by-line scan the densest files.
- **Quantitative whole-system EV checks** (per CLAUDE.md "compute it; don't feel it") — outside lens scope; recommend a dedicated calibration pass.

## Round 1 totals

- High severity: 26
- Medium severity: 56
- Low severity: 45
- Total: ~127 findings across 8 lenses (after dedup)
