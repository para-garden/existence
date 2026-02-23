# CLAUDE.md

Behavioral rules for Claude Code in the existence repository.

## Project Overview

Text-based HTML5 game. "Power anti-fantasy" — constrained agency without judgment. No stats visible. All state hidden. Prose carries everything.

**Prose tone:** Porpentine (*With Those We Love Alive*, 2014) — fragmentary, body-aware, dissociation through texture not description. See INFLUENCES.md for full prior art.

**Architecture:** ES modules, factory functions (`createFoo(ctx)`), `createGameContext()` wires them. No global mutable state. See STATUS.md for current module list and implementation state.

**Dev:** `nix develop` → `bun serve.js` → localhost:3000. No build step.

## Core Rules

- **Write it down immediately.** Problems, gaps, insights, corrections — stop and document before continuing. TODO.md for backlog. CLAUDE.md + docs/design/overview.md for principles. Research results go to a doc immediately, with retrievable citations (PMID, DOI, PMC ID, URL) for every empirical claim — study name alone is not enough. **Never invent or guess citation IDs.** If the PMID is not known with certainty, write `author year — PMID unverified` rather than a plausible-looking number. A wrong PMID is worse than no PMID: it looks retrievable and isn't. This applies everywhere a world-fact number appears, including design docs and TODO.md. "I'll note those after" is the failure mode this rule exists to prevent. **Chat is not documentation.** Findings presented in a reply are transient — if the conversation were deleted, they'd be gone. When research produces actionable items, those items go to TODO.md before any implementation begins. A well-organized chat message is not a substitute for a TODO.md entry.

- **Every correction means a rule is missing.** When the user pushes back on a decision, ask: what principle, if it had been in CLAUDE.md, would have prevented this? Write that principle now — don't just fix the instance. **Repeated corrections on the same structure mean the model is wrong, not incomplete.** Each repeated correction is evidence of a missing abstraction. Adding exceptions to a wrong model never produces the right model. When you keep adding the same type of exception, stop and reconstruct the model.

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

**State belongs to the system that owns it.** Don't let one system manage state that belongs to a different concern. The test: if system A is reset/modified whenever system B changes, ask whether A is actually a property of B or whether they just happen to interact. Alarm state is not sleep state — alarms fire at clock-time thresholds regardless of whether the player is asleep, awake, or mid-conversation. The coupling failure mode: implementing a specific interaction (alarm wakes you up) and letting that drive the architecture (alarm state lives in the sleep/wake cycle). The interaction is real; the ownership is wrong. Corrected model: a scheduled interrupt queue — `{time, type, data}` entries checked against `tod` in `checkEvents()`. The wake-up alarm, medication reminders, cooking timers, and calendar alerts (meetings, interviews, dates, anniversaries, flights) are all entries in the same queue. Their effects on sleep, stress, or social state are consequences, not architecture.

**Text carries everything.** Prose tone, word choice, what's mentioned and what isn't = the UI. The same moment reads differently depending on hidden state.

**Typography is a simulation readout.** Inner voice tiers (quiet italic → uneasy → prominent → tremor) driven by NT state and personality. No spiral state variable — the experience emerges from conditions. `prefers-reduced-motion` collapses to static contrast. Rarity is what makes the heavy treatment land.

**Structure serves the moment.** Sometimes choices, sometimes description, sometimes events happening to you. Not locked to one interaction pattern.

**Simulated persistence.** Objects that have state in real life need state in the simulation. A phone has an inbox — messages arrive whether or not you look. Ignoring things has weight.

**One timeline.** No save scumming. Autosave on every action. You live with what happened.

**Deterministic replay.** All RNG through seeded PRNG (`Timeline.random`). No `Math.random`, no `Date.now` in simulation. Same seed + same action sequence = same world state.

**The world is real.** Derive behavior from parameters, don't hardcode assumptions. Geography from latitude: sign = hemisphere, |lat| < 23.5° tropical, 23.5–66.5° temperate. Store latitude, derive everything else.

**Handle absence, don't patch symptoms.** If the player walks away, handle it properly — step-away, auto-pause, tab detection. Deliberate inaction is a different thing and deserves real support.

**No text reuse as a bandaid.** Seeing the same text twice breaks the fiction. Reuse only when repetition is genuinely realistic — a recurring sound, a repeated routine.

**Effects depend on internal state.** The same action at different NT states produces different mechanical outcomes, not just different prose. Relief requires the internal conditions for relief.

**State changes through gradual drift, not snaps.** Mood emerges from NT levels drifting toward targets via exponential approach with asymmetric rates (falls faster than rises). Don't snap state — shift the target and let the level follow. Biological jitter uses sine waves — physiological rhythms are sinusoidal, so sine functions are the right model.

**Mood-primary systems have per-character inertia.** Serotonin, dopamine, NE, GABA drift rates are divided by `effectiveInertia()` — computed each tick from personality parameters, never cached. Physiological systems (cortisol, melatonin, adenosine) ignore personality.

**Sentiments are asymmetric.** Comfort sentiments habituate with use (−0.002–0.003 per activation); dread and irritation don't — they entrench (40% slower sleep processing). Cross-reduce contradictory qualities when accumulating (warmth challenges irritation; satisfaction challenges dread) — produces ambivalence, not replacement. Sleep processes emotions toward character baseline at rates that depend on regulation capacity and sentiment type.

**Every constraint must have a source in the phenomenon.** Before adding any limit — a cap, a cooldown, an availability gate — ask: does this constraint exist in the real thing being modeled? If not, don't add it. "The player might accumulate too much" is not a real-world constraint; it's game-design anxiety. The only legitimate constraints are ones that exist in the phenomenon: money, access, physical space, time, attention. If those are already modeled, they do the work. An invented constraint on top of them is double-counting at best and a misrepresentation at worst. The moisturizer cap was this failure: real lotion is limited by counter space and money, both already present; the `Math.min(15, ...)` and "only when count is 0" rules had no source in the world.

**Nothing arbitrary.** Every parameter should have a reason derived from real relationships between systems. When a parameter must be approximated, document it. The specific failure mode: inventing a number, discovering it's wrong, inventing a replacement, and writing a comment that sounds like derivation. Don't mistake a proxy for a cause — job type is not the driver of illness exposure; contact intensity is. Name the real variable, even if it doesn't exist yet.

**Emergence over flags.** The simulation sets parameters and lets behavior follow. Personality isn't a flag. Clinical patterns aren't diagnosed — they arise when parameters land in certain configurations. Never announce what the simulation is doing.

**Constitutional vs. circumstantial conditions.** Constitutional (genetic) → probabilistic chargen roll grounded in real prevalence data. Circumstantial (dental disease, chronic pain from injury, diabetes) → derived deterministically from life history. A random roll for a circumstantial condition is the wrong model, not a crude version of the right one. Leave unassigned and document what upstream systems are needed.

**Characters have histories — the target state is a fully simulated life.** All character properties are consequences of a generated life history. The backstory system is the mechanism — as more systems are built, arbitrary parameters become derived ones. This is the direction, not just a principle: every chargen roll that isn't derived from simulated history is a debt. Prevalence data grounds population-level distributions, but the character needs their *own* reason — not just to be an instance drawn from the correct distribution. The difference: "h²=49% so we draw from N(50,15)" is a placeholder. "introversion is high because the simulation generated a childhood with early social rejection and a family that modeled withdrawal" is what we're building toward. Arbitrary draws are acceptable for now; they must be documented as debts and replaced as the upstream systems exist.

**Money is derived, not primary.** The balance is a surface over flows: income, obligations, spending, starting position. Financial anxiety is a sentiment connected to the neurochemistry engine.

**Habits emerge from observed play, not prescribed sequences.** CART decision trees learn state→action patterns from player behavior. Anti-snowball: source-weighted training (player 1.0, suggested 0.5, auto 0.1) — without this, suggesting an action inflates confidence, which causes more suggestions, which inflates confidence further. No RNG consumed.

## Code Conventions

**RNG discipline:**
- ALL randomness through `Timeline.random()` and friends
- Event text generated synchronously (consuming RNG), displayed with `setTimeout` delays
- Interaction IDs unique across all locations (`check_phone_bedroom`, not `check_phone`)
- **Balanced RNG consumption:** same number of calls on every branch. If a branch doesn't need a call, add `Timeline.random()` as an explicit balance — otherwise replay diverges from any future branch that gets added

**Replay correctness:**
- Replay skips availability checks — always executes recorded actions
- Idle events recorded as actions so RNG consumption replays correctly
- Parameterized interactions record `data` in action log; `replayInteraction(id, data)` passes it through

**Tier functions, not inline scalars.** Content branches on qualitative labels from tier functions (`messTier()` → `'cluttered'`, `energyTier()` → `'exhausted'`), never on `State.get('x') > 47`. Tier thresholds live in one place. Location descriptions can't consume RNG — they're called from `UI.render()`.

**Tier dispatch style: `switch` for exhaustive per-tier branches, `includes` for subset membership.** `switch (stressTier()) { case 'strained': ... }` when every tier gets distinct handling. `['strained', 'overwhelmed'].includes(stressTier())` when testing whether the tier falls in a set. Never a raw threshold comparison.

**Tiers are for qualitative categories, not value aliases.** Named strings wrapping specific values (`'small_win'` for $5, `'large_win'` for $1000) are pointless indirection that must be kept in sync. If the value is a concrete quantity, use the value directly.

**Quantitative systems require whole-system verification.** When multiple numbers interact — probabilities × amounts, rates × thresholds, weights × magnitudes — check the emergent behavior of the system, not just whether each number seems locally plausible. A $10,000 prize at weight 2/990 is $20 EV per $2 ticket. Compute it; don't feel it.

**Prose:**
- No simulation variables in player-facing text — no energy values, stress levels, NT readings, job standing scores
- No system voice — the simulation never speaks directly to the player about what it's doing
- Prose leads, simulation follows. If the text needs a phone inbox to feel real, build the inbox. Don't hollow out prose to match a thin simulation — deepen the simulation to support the prose.

**Prose-neurochemistry shading (three layers):**
1. **Weighted variants** — `Timeline.weightedPick()` + `State.lerp01()` — 1 RNG call. General text at weight 1; NT-specific text weighted by lerp.
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

**Keep docs/design/overview.md and CLAUDE.md current.** When a conversation clarifies design direction or corrects a simplification, capture it before committing. Design understanding evolves during implementation — don't let the documents fall behind. Specific failure mode for overview.md: **a mechanic is reversed, calibrated, or removed — STATUS.md and code are updated, but overview.md silently keeps describing the old design.** After any commit that changes simulation behavior (not just adds content), check whether overview.md describes the current model. Examples of changes that require overview.md updates: removing a penalty (adenosine crash), recalibrating rates (caffeine habit +8→+5), removing a system (fragment library), implementing something described as "not yet modeled."

## Commit Convention

Conventional commits: `type(scope): message`. Types: `feat`, `fix`, `refactor`, `docs`, `chore`. Scope optional (`state`, `content`, `ui`).

## Negative Constraints

Do not:
- Surface simulation internals as visible numbers, meters, or labels — NT values, energy levels, stress scores, job standing, drift rates
- Use `Math.random()` or `Date.now()` in simulation code
- Force the player through a prescribed sequence — the world responds, it doesn't herd
- Add game chrome, HUD elements, or anything that looks like a "game UI"
- Create save/load UI — the game just continues where you left off
- Announce actions ("I will now...") — just do them
- Use `--no-verify` — fix the issue or fix the hook
