# CLAUDE.md

Behavioral rules for Claude Code in the existence repository.

## Project Overview

Text-based HTML5 game. "Power anti-fantasy" — constrained agency without judgment. No stats visible. All state hidden. Prose carries everything.

**Prose tone:** Porpentine (*With Those We Love Alive*, 2014) — fragmentary, body-aware, dissociation through texture not description. See INFLUENCES.md for full prior art.

**Architecture:** ES modules, factory functions (`createFoo(ctx)`), `createGameContext()` wires them. No global mutable state. See STATUS.md for current module list and implementation state. See `docs/design/simulated-life.md` for the canonical character/world-generation design (forward-causal simulated life + wrong-turns graveyard).

**Dev:** `nix develop` → `bun serve.js` → localhost:3000. No build step.

**Early development — no save compatibility.** The save format changes freely. Old saves are purged on startup (version check in `game.js`). Don't add `??` fallbacks or migration shims for missing character fields — bump the version and let old runs die. Backwards compatibility is a post-release concern.

## Core Rules

- **Write it down immediately.** Problems, gaps, insights, corrections — stop and document before continuing. TODO.md for backlog. CLAUDE.md + docs/design/overview.md for principles. Research results go to a doc immediately, with retrievable citations (PMID, DOI, PMC ID, URL) for every empirical claim — study name alone is not enough. **Never invent or guess citation IDs.** If the PMID is not known with certainty, write `author year — PMID unverified` rather than a plausible-looking number. A wrong PMID is worse than no PMID: it looks retrievable and isn't. This applies everywhere a world-fact number appears, including design docs and TODO.md. "I'll note those after" is the failure mode this rule exists to prevent. **Chat is not documentation.** Findings presented in a reply are transient — if the conversation were deleted, they'd be gone. When research produces actionable items, those items go to TODO.md before any implementation begins. A well-organized chat message is not a substitute for a TODO.md entry. **Implementation priority is not documentation priority.** Deferred items need documentation *more* than urgent ones — urgent things get built and the code becomes the record. A deferred insight exists only in docs or not at all. "Not urgent to implement" is the strongest reason to write something down immediately, not a reason to keep it in chat.

- **Every correction means a rule is missing.** When the user pushes back on a decision, ask: what principle, if it had been in CLAUDE.md, would have prevented this? Write that principle now — don't just fix the instance. **"The rule exists, I just didn't follow it" is never the diagnosis.** If the rule was sufficient, it would have been followed. A rule that doesn't prevent the failure it describes is incomplete — find what's missing and fix the rule, not your behavior. "I'll do better next time" is not a structural fix. **Repeated corrections on the same structure mean the model is wrong, not incomplete.** Each repeated correction is evidence of a missing abstraction. Adding exceptions to a wrong model never produces the right model. When you keep adding the same type of exception, stop and reconstruct the model.

- **Identified rules go in CLAUDE.md immediately.** Any time a standing principle is identified — through a correction, a design discussion, or pattern recognition — write it into CLAUDE.md before continuing. "This should be a rule" means it goes in CLAUDE.md, not in chat. A principle that exists only in the conversation is lost when the conversation ends.

- **Before proposing any fix, ask "what IS this?"** When investigating a problem, the first question is not "where should this go?" or "what should this value be?" — it's "what is this concept, in full generality, and what system owns it?" The fix follows from that answer. Skipping straight to a patch embeds the wrong frame: the alarm case produced three consecutive wrong fixes (reset location, set flag in sleep path, event log) because the question was always "where should alarm_went_off go?" The right question was "what is an alarm?" → time-threshold event → scheduling system → alarm_went_off doesn't need to exist. This applies everywhere: debugging, investigation, design. Understand the thing before touching it.

- **No shortcuts or silent approximations.** Implement properly or add an explicit TODO approximation debt with a note on what's being lost. Never paper over a gap with a hardcoded assumption. Every hardcoded number is a debt: mark with `// Approximation debt (topic):` at the site — where `topic` is a short noun phrase (e.g. `NT coupling`, `caffeine`, `sleep cycles`). This enables `grep 'Approximation debt (topic)'` as a navigation tool. TODO.md carries a per-topic grep pointer, not a per-item list. Don't invent a rationale after the number was chosen — "needs calibration" is honest; a comment that implies derivation when there was none is not.

- **TODO.md is a live document, not an archive.** When a task is done, delete the entry. Don't leave struck-through text. The git history is the archive — it already records what was done and when. Struck-through entries accumulate silently and make the file unscannable. The only exception: if a completed item has genuine open sub-items, keep only those sub-items, inline with their parent removed.

- **Do the work properly.** No workarounds left undocumented. No hacks without an accompanying note.

- **No tunnel vision.** The most dangerous moments are the ones that feel small and mechanical — a quick conversion, a direct translation, a minor change. These are exactly when the surrounding context stops being examined. Every change, however routine, is an opportunity to ask whether the thing being changed still makes sense. The `!has_moisturizer` → `=== 0` failure wasn't a design error; it was never looked at.

## Design Principles

**The simulation stays invisible.** NT levels, energy, stress, job standing, drift rates — never surface directly. What the player sees is what they produce: prose that reads differently, options that aren't available, moments that cost more. World quantities the character would know (prices, time, rough money) can surface in the character's own terms. The model's internal accounting never does.

**Player choices that involve quantities need player input.** When the player is deciding how much — how much to send, how many to buy — build the input. Don't substitute a constant or a random draw. The simulation models consequences of choices; it doesn't make choices on the player's behalf.

**Opaque constraints.** The player never sees the full action space or why things aren't available. Things just aren't there when they can't be.

**Gradients, not binaries.** State shapes experience continuously. Nothing switches on or off at a threshold. There's always something at every point along every spectrum — it just changes in character, cost, and texture. The simulation never dead-ends at an extreme.

**Agency is on a gradient.** When NT state doesn't clearly determine a response, the player gets a choice. Trauma can override it — probability scales with trauma intensity, resolved by PRNG. NT mediates the baseline: high cortisol/NE primes threat response, making involuntary firing more likely even without trauma.

**Constitutional conditions shape baseline rendering, not just notable moments.** A character with myopia doesn't have occasional blur events — their prose about anything at distance is always different. These conditions define what normal is for this character; they are not modifiers on top of normal prose.

**The body knows before the mind.** Interoceptive signals precede conscious recognition. Anxiety is a tight chest before it's a named emotion. Prose renders the signal the body is sending, not the label the mind attaches.

**There is no single path.** The same need has different solutions for different characters. When designing a mechanic, ask: what does this look like for someone with fewer resources, worse options? That version is as real as the comfortable one — often more real, for more people. Never assume one universal path.

**Model the phenomenon, not a convenient instance of it.** Before designing an interface, ask: what is this in full generality? Work is not "a shift with a start and end time on weekdays" — it's obligations that may or may not exist on a given day, revealed with varying lead time, for varying durations, or with no fixed schedule at all. The failure mode: picking one structural form of a phenomenon, implementing it, then trying to add variation by tweaking numbers within that structure. That never reaches cases that don't share the structure. Design the vocabulary from the full range of the phenomenon first.

**Event records record events; current state lives in current state.** Historical records (financial history, reproductive history, action log) capture what happened and when. Persistent conditions that were *caused by* past events — diastasis severity, pelvic floor strength, financial anxiety — live in current character/body state, not inside the history entries. The failure mode: putting a condition on the history entry that caused it, implying it ended with that event. It didn't. Future risk calculations and current prose both read current state; the history record explains how current state got that way.

**A thing's nature determines where it lives; its origin is an attribute, not a taxonomy.** The failure mode: seeing that X was caused by Y and embedding X inside Y's record. Cause belongs on X as a field. X belongs wherever things of X's type belong.

**State belongs to the system that owns it.** Don't let one system manage state that belongs to a different concern. The test: if system A is reset/modified whenever system B changes, ask whether A is actually a property of B or whether they just happen to interact. Alarm state is not sleep state — alarms fire at clock-time thresholds regardless of whether the player is asleep, awake, or mid-conversation. The coupling failure mode: implementing a specific interaction (alarm wakes you up) and letting that drive the architecture (alarm state lives in the sleep/wake cycle). The interaction is real; the ownership is wrong. Corrected model: a scheduled interrupt queue — `{time, type, data}` entries checked against `tod` in `checkEvents()`. The wake-up alarm, medication reminders, cooking timers, and calendar alerts (meetings, interviews, dates, anniversaries, flights) are all entries in the same queue. Their effects on sleep, stress, or social state are consequences, not architecture.

**Text carries everything.** Prose tone, word choice, what's mentioned and what isn't = the UI. The same moment reads differently depending on hidden state.

**Typography is a simulation readout.** Inner voice tiers (quiet italic → uneasy → prominent → tremor) driven by NT state and personality. No spiral state variable — the experience emerges from conditions. `prefers-reduced-motion` collapses to static contrast. Rarity is what makes the heavy treatment land.

**Structure serves the moment.** Sometimes choices, sometimes description, sometimes events happening to you. Not locked to one interaction pattern.

**Simulated persistence.** Objects that have state in real life need state in the simulation. A phone has an inbox — messages arrive whether or not you look. Ignoring things has weight.

**One timeline.** No save scumming. Autosave on every action. You live with what happened.

**Deterministic replay.** All RNG through seeded PRNG (`Timeline.random`). No `Math.random`, no `Date.now` in simulation. Same seed + same action sequence = same world state.

**The world is real.** Derive behavior from parameters, don't hardcode assumptions. Geography from latitude: sign = hemisphere, |lat| < 23.5° tropical, 23.5–66.5° temperate. Store latitude, derive everything else.

**The author binds their own hands.** Total control destroys plausibility: the instant the generator *sets* an outcome, it leaves the manifold the process could have produced, and a set outcome reads as fake — the same way a back-justified one does. So generate every person (the protagonist included) as a **prior** — a plausible forward draw from their context — **never as a posterior** fitted to a demanded result. Steer by **influence on the prior, never hard conditioning**: bias, not clamp. The discipline is structural, not willpower — the control surface speaks only in **causes** (era, hardship, a parent's absence), never outcomes, so implausible configurations are *unsayable*; a divergence budget bounds the tilt; no resample-to-taste (re-rolling is the author save-scumming). The cost is real and accepted: you don't always get the world you wanted, and requirements go upstream as legal levers or are forgone, never patched in post-hoc. This is the player's "one timeline, you live with what happened" applied to the author. Full design: `docs/design/simulated-life.md`.

**Under tractability pressure, never lose granularity or shortcut causation.** When full genuine simulation feels too expensive or infinite, the reflex is to reach for (a) *granularity loss* — coarse summaries, "born-whole" ancestors, a thin leaf, a resolution dial — or (b) a *causality shortcut* — back-fitting a target, seed-evaluating a person into existence, re-running committed history, or absorbing a mismatch into memory's lossiness. **Every such move is wrong:** it yields thin/constructed people or acausal detail, and the "it's intractable" premise driving it is typically unmeasured. The ONLY legitimate levers are: laziness in **coverage, not fidelity** (partial — finite coverage, full fidelity everywhere — is *not* thin); **forward-only causation** (generate once, at the live moment); **acausal givens only at t=0** (initial conditions are axioms; everyone after is forward-caused); and the explicitly-flagged, logged **retroactive L** as the sole last resort (a backward reach into un-laid-down past — acausal by *direction*, not cost — conceding causality but not fidelity, carried as a marked debt). If a mechanism loses fidelity anywhere, or shortcuts causation anywhere except t=0, it is wrong — full stop. See the wrong-turns graveyard in `docs/design/simulated-life.md` §10 before re-deriving any of these.

**Handle absence, don't patch symptoms.** If the player walks away, handle it properly — step-away, auto-pause, tab detection. Deliberate inaction is a different thing and deserves real support.

**No text reuse as a bandaid.** Seeing the same text twice breaks the fiction. Reuse only when repetition is genuinely realistic — a recurring sound, a repeated routine.

**Effects depend on internal state.** The same action at different NT states produces different mechanical outcomes, not just different prose. Relief requires the internal conditions for relief.

**"How far along" is always derived from a start timestamp, never a stored counter.** Any quantity measuring progress through a process — cycle day, pregnancy week, drug half-life elapsed — must be computed as `f(time - start_time)`. A stored counter that needs explicit incrementing breaks on any non-unit time step (long sleeps, replays, fast-forward). The pattern: store the event timestamp, derive everything else. `cycle_start_time` → `cycleDay()`. `conception_time` → `pregnancyWeek()`. If you find yourself writing "advance X by 1 each sleep," stop and ask what the start timestamp is.

**State changes through gradual drift, not snaps.** Mood emerges from NT levels drifting toward targets via exponential approach with asymmetric rates (falls faster than rises). Don't snap state — shift the target and let the level follow. Biological jitter uses sine waves — physiological rhythms are sinusoidal, so sine functions are the right model.

**Mood-primary systems have per-character inertia.** Serotonin, dopamine, NE, GABA drift rates are divided by `effectiveInertia()` — computed each tick from personality parameters, never cached. Physiological systems (cortisol, melatonin, adenosine) ignore personality.

**Sentiments are asymmetric.** Comfort sentiments habituate with use (−0.002–0.003 per activation); dread and irritation don't — they entrench (40% slower sleep processing). Cross-reduce contradictory qualities when accumulating (warmth challenges irritation; satisfaction challenges dread) — produces ambivalence, not replacement. Sleep processes emotions toward character baseline at rates that depend on regulation capacity and sentiment type.

**Pronouns are grammatical, not social.** Never use pronouns to determine social experience (pay gap, safety, discrimination). Use `perceivedPresentation()` for social mechanics, pronouns for prose about NPCs. Pronouns are a `PronounSet[]` (structured objects with subject/object/possessive/reflexive/plural), not string enums.

**Identity dimensions are orthogonal.** Gender identity, gender expression, sexual orientation, romantic orientation, and pronouns are independent axes. Don't derive one from another. `GenderIdentity` has four continuous dimensions (binary_diversity, nonbinary_diversity, expression_femininity, expression_masculinity). `AttractionProfile` splits sexual/romantic/sensual/aesthetic.

**Attraction is multi-dimensional.** Sexual ≠ romantic ≠ aesthetic ≠ sensual. The split attraction model is the base architecture. Labels (ace, bi, pan, demi) are shorthand for parameter configurations, not primitives. `isStraight` is derived: `sexual.orientation > 80 && sexual.intensity > 30`.

**Perceived presentation is derived.** `perceivedPresentation()` in state.js is a pure function (like `ambientTemperature()`). Returns `'fem_read' | 'masc_read' | 'androgynous_read'`. Reads expression dimensions + body params + HRT effects. Never stored.

**Every constraint must have a source in the phenomenon.** Before adding any limit — a cap, a cooldown, an availability gate — ask: does this constraint exist in the real thing being modeled? If not, don't add it. "The player might accumulate too much" is not a real-world constraint; it's game-design anxiety. The only legitimate constraints are ones that exist in the phenomenon: money, access, physical space, time, attention. If those are already modeled, they do the work. An invented constraint on top of them is double-counting at best and a misrepresentation at worst. The moisturizer cap was this failure: real lotion is limited by counter space and money, both already present; the `Math.min(15, ...)` and "only when count is 0" rules had no source in the world.

**Nothing arbitrary.** Every parameter should have a reason derived from real relationships between systems. When a parameter must be approximated, document it. The specific failure mode: inventing a number, discovering it's wrong, inventing a replacement, and writing a comment that sounds like derivation. Don't mistake a proxy for a cause — job type is not the driver of illness exposure; contact intensity is. Name the real variable, even if it doesn't exist yet.

**Avoid generalized statistics when possible.** The point of the simulation is to model individuals, not populations. When the sim has the parameters to derive an outcome for this specific character — their personality, history, NT state, support systems — use those. Population-level prevalence rates are useful for validating that the simulation produces realistic distributions across many characters, and for grounding chargen rolls when individual derivation isn't yet possible. They are not inputs to an individual character's experience.

**Don't ask the user to set a quantity reality can answer.** AskUserQuestion is for decisions that are genuinely the user's — design intent, priorities, scope, taste. It is not for adjudicating a quantity that has an empirical answer. When a harness or the simulation produces an emergent value (day-to-day mood variability, a rate, a ratio, a prevalence) and the question is "is this right / too high / too flat," the calibration target is a real-world measurement, not a preference — go find the empirical anchor (with a retrievable citation) and let the data decide. Framing a literature-grounded question as a design-taste choice offloads the work onto the user and violates "Nothing arbitrary." The tell: an AskUserQuestion option whose correctness could be settled by a study rather than by what the user wants.

**Emergence over flags.** The simulation sets parameters and lets behavior follow. Personality isn't a flag. Clinical patterns aren't diagnosed — they arise when parameters land in certain configurations. Never announce what the simulation is doing.

**Simulate ground truth, not player perception.** The simulation models what's actually happening in the world. The character's perception is derived from that — it's the reader's job, not the simulation's. Don't track "what the character has observed" as a simulation layer; track what's real. A coworker's child being sick is a simulation fact. Whether the character knows this is downstream.

**NPCs are simulated at dynamic resolution — never zero.** In principle every person in the simulation has a full interior life. In practice, resolution scales with proximity and contact frequency: close family at high resolution, coworkers at medium, recurring semi-strangers at enough for continuity, one-scene strangers at ephemeral-but-present. The floor is never zero — every person in the simulation has enough state to be a person, not a prop. Resolution is dynamic: a coworker who becomes a friend should gradually get richer simulation; a friend who drifts becomes less legible, not de-simulated. Archetype tags and `family_sketch` arrays are not low-resolution simulation — they're labels, which skip simulation entirely. Labels short-circuit the model; the right approach is live state that generates behavior.

**The simulation is fair to all characters.** The same ontological respect extends to everyone in the world — not the same resolution, but the same underlying reality. A stranger on the bus has a day happening. The simulation acknowledges that even when it can't model it fully. A game premised on the weight of constrained lives can't afford to simulate some lives richly and others as props.

**Constitutional vs. circumstantial conditions.** Constitutional (genetic) → probabilistic chargen roll grounded in real prevalence data. Circumstantial (dental disease, chronic pain from injury, diabetes) → derived deterministically from life history. A random roll for a circumstantial condition is the wrong model, not a crude version of the right one. Leave unassigned and document what upstream systems are needed.

**Characters have histories — the target state is a fully simulated life.** All character properties are consequences of a generated life history. The backstory system is the mechanism — as more systems are built, arbitrary parameters become derived ones. This is the direction, not just a principle: every chargen roll that isn't derived from simulated history is a debt. Prevalence data grounds population-level distributions, but the character needs their *own* reason — not just to be an instance drawn from the correct distribution. The difference: "h²=49% so we draw from N(50,15)" is a placeholder. "introversion is high because the simulation generated a childhood with early social rejection and a family that modeled withdrawal" is what we're building toward. Arbitrary draws are acceptable for now; they must be documented as debts and replaced as the upstream systems exist.

**Money is derived, not primary.** The balance is a surface over flows: income, obligations, spending, starting position. Financial anxiety is a sentiment connected to the neurochemistry engine.

**Habits emerge from observed play, not prescribed sequences.** CART decision trees learn state→action patterns from player behavior. Anti-snowball: source-weighted training (player 1.0, suggested 0.5, auto 0.1) — without this, suggesting an action inflates confidence, which causes more suggestions, which inflates confidence further. No RNG consumed.

## Code Conventions

**RNG discipline:**
- ALL randomness through `Timeline.random()` and friends
- Event text generated synchronously (consuming RNG), displayed with `setTimeout` delays
- Interaction IDs unique across all locations (`check_phone_bedroom`, not `check_phone`)

**Replay correctness:**
- Replay skips availability checks — always executes recorded actions
- Idle events recorded as actions so RNG consumption replays correctly
- Parameterized interactions record `data` in action log; `replayInteraction(id, data)` passes it through

**NT levels are absolute; experience is relative to baseline.** `adjustNT()` is for acute receptor-level events only — a drug hitting a receptor, an endorphin spike, a cortisol surge. Sustained or learned effects belong in the *target* system (via sentiments or target function modifiers) or the *baseline* system (chronic history shifts setpoint). Habituation, tolerance, and withdrawal all operate through baselines shifting, not through direct value adjustments. See `docs/design/nt-baseline.md`.

**Multi-stream PRNG architecture:**
Four independent streams derived from master seed via splitmix32 chain (fixed order — appending never shifts earlier streams):
- **`charRng`** — chargen only; changing chargen never breaks gameplay replay
- **`rng`** — mechanical gameplay: outcome rolls, NT effects, event probability, activity selection
- **`cosmeticRng`** — prose weighted picks and sensory realization; adding prose variants never breaks mechanical replay. Use `Timeline.cosmeticWeightedPick()` and `Timeline.cosmeticRandom()`. All `realize()` calls in senses.js pass `cosmeticRandom`.
- **`backgroundRng`** — ambient events and background simulation (reserved; use `Timeline.backgroundRandom()`)

Key distinction: if the pick result affects game state (NT levels, money, availability, activity path), use `rng`. If it only selects prose the player sees, use `cosmeticRng`. Old saves purged on version bump (v6) — each stream addition is a breaking change.

**Tier functions, not inline scalars.** Content branches on qualitative labels from tier functions (`messTier()` → `'cluttered'`, `energyTier()` → `'exhausted'`), never on `State.get('x') > 47`. Tier thresholds live in one place. Location descriptions can't consume RNG — they're called from `UI.render()`.

**Tier dispatch style: `switch` for exhaustive per-tier branches, `includes` for subset membership.** `switch (stressTier()) { case 'strained': ... }` when every tier gets distinct handling. `['strained', 'overwhelmed'].includes(stressTier())` when testing whether the tier falls in a set. Never a raw threshold comparison.

**Tiers are for qualitative categories, not value aliases.** Named strings wrapping specific values (`'small_win'` for $5, `'large_win'` for $1000) are pointless indirection that must be kept in sync. If the value is a concrete quantity, use the value directly.

**Quantitative systems require whole-system verification.** When multiple numbers interact — probabilities × amounts, rates × thresholds, weights × magnitudes — check the emergent behavior of the system, not just whether each number seems locally plausible. A $10,000 prize at weight 2/990 is $20 EV per $2 ticket. Compute it; don't feel it.

**Prose:**
- No simulation variables in player-facing text — no energy values, stress levels, NT readings, job standing scores
- No system voice — the simulation never speaks directly to the player about what it's doing
- Prose leads, simulation follows. If the text needs a phone inbox to feel real, build the inbox. Don't hollow out prose to match a thin simulation — deepen the simulation to support the prose.

**Prose-neurochemistry shading (three layers):**
1. **Weighted variants** — `Timeline.cosmeticWeightedPick()` + `State.lerp01()` — 1 cosmeticRng call. General text at weight 1; NT-specific text weighted by lerp.
2. **Deterministic modifiers** — short phrases appended via NT conditionals. No RNG.
3. **Mechanical shading** — different outcomes at different NT states, not just different text.

Key dimensions: serotonin (emotional coloring), dopamine (engagement/motivation), NE (alertness/sensory), GABA (anxiety undertone), adenosine (perceptual clarity), cortisol (body tension).

**Sound: per-source lexical sets, not acoustic taxonomies.** Don't add an acoustic property layer. Sound prose varies via procedural architecture (9 sentence shapes, NT-driven) + per-source lexical pools. Richer sound = fuller pool coverage. Acoustic dimensions help with neither axis.

## Workflow

**Minimize file churn.** Read once, plan all changes, apply in one pass. Avoid read-edit-fail-read-fix cycles.

**Always commit when done.** Don't leave changes uncommitted. Multiple logical pieces → multiple commits.

**Keep STATUS.md current.** Before every commit, check whether the work changes what's implemented. Update to match. Specific failure modes to prevent:
- **New interaction added → update two places:** the `### Location (N)` list AND the `## Interactions (N)` total header. The total is the sum of all per-section header counts — recompute it, don't guess.
- **New system section added (Gambling, Health, etc.) → check the location interaction list.** Documenting a mechanic in a system section doesn't substitute for listing the interaction in its location section. These are two different views of the same thing; both must be kept in sync.
- **Conditional interactions count the same as unconditional ones.** `eat_at_work` (food_service only) is in the Workplace count; `take_pain_reliever` (condition required) is in the Bathroom count. Don't silently exclude gated interactions with a semicolon note — they're interactions.
- **Code removed → remove its documentation.** When a system is deleted from the codebase, delete its documentation from STATUS.md. Dead docs accumulate silently and become misleading. The fragment system failure mode: system fully removed from senses.js, STATUS.md left describing it as "legacy" for an indefinite number of sessions.

`scripts/sim-audit.js` is a living diagnostic tool. `bun scripts/sim-audit.js` extracts the simulation coupling graph via static analysis and runs pathology detection (orphans, hotspots, cycles, scale mismatches, underutilization, location gaps). Outputs `sim-graph.json` + text report. Exit 0 always (diagnostic, not CI gate). New analyses accumulate here as new structural insights are discovered — the tool grows with the sim.

**Run `bun tsc --noEmit` after changing JS files.** The project has a `tsconfig.json` with `checkJs: true` and `strict: true`. JSDoc types are enforced — `types.d.ts` defines `GameCharacter` and supporting interfaces. After any change to `js/content.js`, `js/character.js`, `js/chargen.js`, or `js/state.js`, run the type checker. Not all 2000+ errors are actionable yet (most are untyped `ctx` parameters), but *new* errors from your changes indicate real bugs — wrong property names, missing fields, null safety violations. If your change introduces new `'X' does not exist on type` errors, fix them before committing.

**Keep docs/design/overview.md and CLAUDE.md current.** When a conversation clarifies design direction or corrects a simplification, capture it before committing. Design understanding evolves during implementation — don't let the documents fall behind. Specific failure mode for overview.md: **a mechanic is reversed, calibrated, or removed — STATUS.md and code are updated, but overview.md silently keeps describing the old design.** After any commit that changes simulation behavior (not just adds content), check whether overview.md describes the current model. Examples of changes that require overview.md updates: removing a penalty (adenosine crash), recalibrating rates (caffeine habit +8→+5), removing a system (fragment library), implementing something described as "not yet modeled."

## Commit Convention

Conventional commits: `type(scope): message`. Types: `feat`, `fix`, `refactor`, `docs`, `chore`. Scope optional (`state`, `content`, `ui`).

## Hard Constraints

- No `Math.random()` or `Date.now()` in simulation code — breaks deterministic replay.
- No simulation internals in player-facing text — NT values, energy levels, stress scores, job standing, drift rates never surface as visible numbers, meters, or labels.
- No game chrome or HUD — if it looks like a UI widget from a game, it doesn't belong here.
- No save/load UI — the game continues where it left off.
- No interactive git (`git add -p`, `git add -i`, `git rebase -i`) — these block on stdin and hang.

<!-- BEGIN ECOSYSTEM RULES -->

## Ecosystem Design Principles

Cross-cutting principles distilled from the ecosystem's own decisions (synthesized in `docs/decisions/throughlines.md`). Apply them when building new repos and recording decisions. (Already-encoded principles — independent-tools / no-path-deps, the delegation model, CLAUDE.md-as-control-surface — live in their own sections and are not repeated here.)

- **Prefer data over code at a seam — where a faithful serialization is actually viable.** Serializable AST / struct / JSON over closures, embedded DSLs, or source text, so artifacts cache, replay, transport, and diff. The preference is conditional, not absolute: when a seam carries irreducibly heterogeneous, one-off glue whose only data form is a leaky lowest-common-denominator schema (or a "descriptor" that just wraps a closure), a code seam is the honest choice. Push to data where the representation stays faithful; don't force it where it doesn't.
- **Library-first; projection-from-one-definition.** The typed library is the source of truth; CLI / HTTP / MCP / WebSocket / JSON surfaces are generated projections, never hand-rolled per surface.
- **Capability security.** Hosts grant pre-opened handles; code only attenuates what it is given; nothing forges authority; allow-list over deny-list.
- **The LLM is an oracle at the leaves, never the control loop.** Determinism is a hard invariant: seeded RNG, event-log replay, build-time-only inference. Per-query LLM in the hot loop is a defect.
- **Trust comes from verifiable evidence, not authority.** Verbatim snippets, pinned-commit permalinks, claim→node citation — never a bare reference.
- **Retire, don't deprecate; collapse asymmetries to primitives.** Remove backward-compat aliases rather than carry them; reduce N special cases to their irreducible primitives.
- **Finish migrations before building on top; fence what you can't finish.** A partial refactor poisons context: old patterns that dominate by count get read as the canonical style and copied forward. Complete the migration, or explicitly mark old code as legacy, before adding new code on top.
- **Validate against reality; tests are the spec.** Load-bearing substrates are validated against real corpora; fixtures and tests define correctness, not aspirational specs.

## Hard Constraints

- No `--no-verify`. Fix the issue or fix the hook.
- No path dependencies in `Cargo.toml` — they couple repos and break independent publishing.
- No interactive git (no `git rebase -i`, no `git add -i`, no `--no-edit` on rebase).
- No suggesting project names. LLMs are bad at this; refine the conceptual space only.
- No tracking cross-project issues in conversation — they go in TODO.md in the affected repo.
- No assuming a tool is missing without checking `nix develop`.
- Commit completed work in the same turn it finishes. Uncommitted work is lost work.

## Meta

- Something unexpected is a signal. Stop and find out why. Do not accept the anomaly and proceed.
- Corrections from the user are conversation, not material for new rules. Rules are added when a failure mode is observed repeatedly.
- **Confidence only when earned by tangible evidence; verify before you assert, and when you can't, say so.** Confirm a claim against the actual source — read it, run it, check it — *then* state it. If you haven't verified, say "I haven't checked," then go check or ask. Never substitute a plausible-sounding claim for a verified one. The defect is *unearned* confidence — confidence decoupled from checked evidence — and it is a defect even when the answer turns out right, because the process is identical to the confident-wrong case (a lucky guess just hides it, and trains the same habit). The inverse — hedging something you've solidly verified — is the same defect. Report what you actually checked plainly; the target is the coupling between expressed confidence and real evidence, not plainness or confidence itself. (the root failure: confabulation — asserting past your evidence.)
- **At a decision point, generate several genuinely independent candidate approaches, weigh each, and decide where the call is yours or give a weighed recommendation where it's the user's.** For complex/architectural/high-stakes decisions this isn't optional and can't be single-shot: N options from one model pass share blind spots — reworded, not independent. Decorrelate via parallel subagents each from a different starting frame (design-it-twice / design-an-interface), then adversarial judging, then synthesis — before committing. When unsure whether a decision clears that bar, treat it as if it does. (failures: overconfidence; option-dumping; false-independence — single-shot options treated as decorrelated.)
- **Under challenge, re-read the source and report what it literally says.** Let the answer land where the evidence puts it: hold if you were right, correct specifically if you were wrong. The new position must come from re-checking, never from the pressure. (failure: backpedaling — moving to appease.)
- **Re-read the relevant context before acting on it.** Act from the current state, not a stale or half-formed read. (failure: stale-context action.)

<!-- END ECOSYSTEM RULES -->
