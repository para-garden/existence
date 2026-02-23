# CLAUDE.md

Behavioral rules for Claude Code in the existence repository.

## Project Overview

Text-based HTML5 game. "Power anti-fantasy" — constrained agency without judgment. No stats visible. All state hidden. Prose carries everything.

**Prose tone:** Porpentine (*With Those We Love Alive*, 2014) — fragmentary, body-aware, dissociation through texture not description. See INFLUENCES.md for full prior art.

**Architecture:** ES modules, factory functions (`createFoo(ctx)`), `createGameContext()` wires them. No global mutable state. See STATUS.md for current module list and implementation state.

**Dev:** `nix develop` → `bun serve.js` → localhost:3000. No build step.

## Core Rules

- **Write it down immediately.** Problems, gaps, insights, corrections — stop and document before continuing. TODO.md for backlog. CLAUDE.md + docs/design/overview.md for principles. Research results go to a doc immediately, with retrievable citations (PMID, DOI, PMC ID, URL) for every empirical claim — study name alone is not enough. This applies everywhere a world-fact number appears, including design docs and TODO.md. "I'll note those after" is the failure mode this rule exists to prevent.

- **Every correction means a rule is missing.** When the user pushes back on a decision, ask: what principle, if it had been in CLAUDE.md, would have prevented this? Write that principle now — don't just fix the instance. **Repeated corrections on the same structure mean the model is wrong, not incomplete.** Each repeated correction is evidence of a missing abstraction. Adding exceptions to a wrong model never produces the right model. When you keep adding the same type of exception, stop and reconstruct the model.

- **No shortcuts or silent approximations.** Implement properly or add an explicit TODO approximation debt with a note on what's being lost. Never paper over a gap with a hardcoded assumption. Every hardcoded number is a debt: mark with `// Approximation debt:` at the site AND add to TODO.md. Don't invent a rationale after the number was chosen — "needs calibration" is honest; a comment that implies derivation when there was none is not.

- **Do the work properly.** No workarounds left undocumented. No hacks without an accompanying note.

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

**Nothing arbitrary.** Every parameter should have a reason derived from real relationships between systems. When a parameter must be approximated, document it. The specific failure mode: inventing a number, discovering it's wrong, inventing a replacement, and writing a comment that sounds like derivation. Don't mistake a proxy for a cause — job type is not the driver of illness exposure; contact intensity is. Name the real variable, even if it doesn't exist yet.

**Emergence over flags.** The simulation sets parameters and lets behavior follow. Personality isn't a flag. Clinical patterns aren't diagnosed — they arise when parameters land in certain configurations. Never announce what the simulation is doing.

**Constitutional vs. circumstantial conditions.** Constitutional (genetic) → probabilistic chargen roll grounded in real prevalence data. Circumstantial (dental disease, chronic pain from injury, diabetes) → derived deterministically from life history. A random roll for a circumstantial condition is the wrong model, not a crude version of the right one. Leave unassigned and document what upstream systems are needed.

**Characters have histories.** All character properties are consequences of a generated life history. The backstory system is the mechanism — as more systems are built, arbitrary parameters become derived ones.

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

**Keep STATUS.md current.** Before every commit, check whether the work changes what's implemented. Update to match.

**Keep docs/design/overview.md and CLAUDE.md current.** When a conversation clarifies design direction or corrects a simplification, capture it before committing. Design understanding evolves during implementation — don't let the documents fall behind.

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
