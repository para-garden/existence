# CLAUDE.md

Behavioral rules for Claude Code in the existence repository.

## Project Overview

Text-based HTML5 game. "Power anti-fantasy" — constrained agency without judgment. No stats visible. All state hidden. Prose carries everything.

**Prose tone reference:** Porpentine (especially *With Those We Love Alive*, 2014) — fragmentary, body-aware, dissociation rendered through texture rather than description. Not a template to copy; a register to be aware of. See INFLUENCES.md for full prior art and INFLUENCES.md's atmosphere section for music/lyric references.

## Simulation Architecture

See [docs/design/philosophy.md](docs/design/philosophy.md). Every simulation system is an interface designed for maximum fidelity. Implementations vary per-run; granularity is hotswappable between saves, never mid-run. Scalars that stand in for richer structure are approximation debts — name them, plan to pay them.

## Architecture

ES modules. Each module exports a factory function (`createFoo(ctx)`) that receives a context object. `createGameContext()` in `context.js` wires all instances together. No global mutable state — multiple game instances can coexist.

```
js/
  main.js       # Module entry point — creates context, starts game
  context.js    # createGameContext() — wires all module factories together
  names.js      # Generated name frequency data (US Census + SSA). Built by scripts/build-names.js
  runs.js       # IndexedDB storage layer for multi-run support
  timeline.js   # Seeded PRNG (xoshiro128**), dual streams, action log, delegates save to Runs
  events.js     # In-memory event history (record/query semantic events, reconstructed during replay)
  habits.js     # CART decision tree engine, feature extraction, habit training + prediction
  state.js      # Hidden state engine: energy, money, stress, hunger, time, social, job_standing
  character.js  # Character schema, Character.get() accessor, applyToState()
  world.js      # Location graph, movement with time cost, event triggers
  content.js    # All prose, interaction definitions, event text, idle thoughts
  chargen.js    # Random generation, sandbox UI flow, name sampling
  ui.js         # DOM rendering, fade transitions, idle timer
  game.js       # Async init, threshold screen, step-away, look-back, orchestration
css/
  style.css     # Typography, layout, atmosphere
index.html      # Single page, single <script type="module">
serve.js        # Bun static file server
scripts/
  download-names.sh  # Downloads raw Census + SSA data into vendor/
  build-names.js     # Processes raw data into js/names.js
docs/design/overview.md  # Simulation design vision — what the game should become
STATUS.md       # What's actually implemented right now
```

## Development

```bash
nix develop     # Enter dev shell
bun serve.js    # Serve on http://localhost:3000
```

No build step. Plain JS loaded via script tags.

## Core Rules

- **Note things down immediately:** problems, tech debt, or issues spotted MUST be added to TODO.md backlog
- **Capture fundamental principles.** When a design principle is discovered, clarified, or corrected — whether in conversation or during implementation — write it into CLAUDE.md (short rule) and docs/design/overview.md (full explanation) immediately. Principles are more important than code. Don't let them live only in chat history.
- **Serious pushback means a principle is missing.** When the user pushes back hard on a decision — especially if the same class of mistake happens twice — don't just fix the immediate issue. Ask: is the underlying principle actually captured in CLAUDE.md? If not, capture it now. A correction that only fixes the instance and not the rule will repeat.
- **Write it down if it will ever need to be written down — immediately, without asking.** If something is discussed — a real-world mechanic, a design option, a system that should exist, a gap in the simulation, an insight, a correction to previous thinking — and it's the kind of thing that should eventually be built or considered, document it now. Don't wait until it's being implemented. Don't ask whether to write it down — just write it down. This includes corrections: if a previous framing was wrong, write down the right one, not just fix the instance. TODO.md, docs/design/overview.md, and CLAUDE.md exist so nothing lives only in chat history or someone's memory. When in doubt: write it down, right now, without asking first.
- **Write research results down immediately, without asking.** When research is conducted — by subagent or otherwise — persist the results to a document right away. The document can be a DESIGN doc, a RESEARCH doc, or anything else — naming doesn't matter. Include full citations with retrievable identifiers (DOI, PMID, arXiv ID, URL) for every claim so findings are verifiable without re-running the research. Don't let research live only in chat history.
- **Do the work properly.** Don't leave workarounds or hacks undocumented.
- **No shortcuts.** When full fidelity isn't achievable right now, don't implement a lower-fidelity version silently. Either do it properly or add it to TODO.md as an explicit approximation debt with a note on what's being lost. Never paper over a gap with a hardcoded assumption — name the assumption, document what should replace it.
- **Every hardcoded number is a debt until proven otherwise.** When you write a rate, coefficient, threshold, or magnitude in simulation code, ask: is this derived from real-world data, or chosen? If chosen, it is an approximation debt. Mark it with an `// Approximation debt:` comment at the site AND add it to TODO.md. Do not write a comment that sounds like derivation when the number was chosen first — that is the failure mode to avoid. "Needs calibration" is honest. A plausible-sounding rationale invented after the fact is not.
- **Empirical claims need retrievable citations.** When a research document or code comment states a specific number derived from literature (a rate, prevalence, effect size, half-life, timing), it must include a retrievable identifier — PMC ID, PMID, or DOI. Study name alone is not enough; it must be findable without a search. "Uncited" is acceptable as an explicit flag (`// Uncited — needs source`); silently presenting an unverified number as established fact is not. Existing documents (docs/reference/substances.md, docs/research/hormones.md, docs/design/emotions.md) have widespread uncited empirical claims — treat as known debt, add identifiers when research is done.

## Design Principles

**The simulation stays invisible.** The simulation runs many internal variables — NT levels, energy, stress, job standing, drift rates. The player never sees any of them directly. What they see is what those variables produce: prose that reads differently, options that aren't available, moments that cost more. The simulation's own accounting language never surfaces as meters, labels, or system voice.

This is distinct from "no numbers ever appear." The world contains quantities the character would actually know — what things cost, roughly how much money they have, what time it is. Those can surface, in the character's own terms, imprecisely. The bus fare is part of the world; the energy penalty for the journey is not. What stays invisible is the model's internal state, not the world's.

**Player choices that involve quantities need player input.** When the player is deciding how much — how much to send a friend, how many items to buy — that quantity belongs to them. Don't substitute it with a fixed constant or a random draw. Build the input. The simulation models consequences of choices; it doesn't make choices on the player's behalf.

**Opaque constraints.** The player never sees the full action space or why things aren't available. Things just aren't there when they can't be.

**Gradients, not binaries.** State shapes experience continuously. Nothing switches on or off at a threshold. There's always something you can do at every point along every spectrum — it just changes in character, cost, and texture. The simulation never dead-ends at an extreme.

**Agency is on a gradient.** When a stimulus is ambiguous or NT state doesn't clearly determine a response, the player gets a choice. But trauma can override that choice — the response fires regardless of player intent, probability scaling with trauma intensity, resolved by PRNG (deterministic/replayable but not guaranteed). NT state mediates the baseline: high cortisol/NE primes threat response, making involuntary firing more likely even without trauma. Full voluntary control at one end, fully involuntary at the other — NT state and trauma determine where a given moment lands.

**Constitutional conditions shape baseline rendering, not just notable moments.** A character with myopia doesn't just have occasional blur events — their prose about anything at distance is always different. Visual snow is always present. Low interoceptive awareness means hunger signals consistently fail to fire clearly. These conditions are stored at chargen and wired into all prose for that character. They are not modifiers on top of normal prose; they define what normal is for this character.

**The body knows before the mind.** Interoceptive signals precede conscious recognition. Anxiety is a tight chest before it's a named emotion. Hunger is irritability before it's noticed. NE elevation is sharpened edges before "I feel alert." Prose renders the body first — don't name the emotion, render the signal the body is sending. The character's inner world surfaces through physical experience, not through labelling.

**There is no single path.** The same need has different solutions for different characters. Laundry means in-unit machines, or building laundry, or a laundromat trip, or hand-washing when money is tight. Getting food means cooking, or the corner store, or the food bank, or nothing. When designing a mechanic, ask: what does this look like for someone with fewer resources, worse options? That version is as real as the comfortable one — often more real, for more people. Never assume one universal path.

**Model the phenomenon, not a convenient instance of it.** Before designing an interface, ask: what is the actual thing here, in full generality? Work is not "a shift with a start time and end time on weekdays." Work is obligations that may or may not exist on a given day, revealed with varying lead time, at varying times, for varying durations — or no fixed schedule at all. Freelancing, on-demand shifts, graveyard shifts, and overtime are not edge cases of the same thing; they are structurally different relationships to work. An interface that can only express one of them has already made a choice about whose life the simulation can represent — silently, before any content is written. The failure mode: picking a convenient instance (the stable salaried job), implementing it, and then trying to add variation by tweaking numbers within that structure. That never reaches the cases that don't share the structure. Design the vocabulary first, from the full range of the phenomenon, then implement.

**Text carries everything.** Prose tone, word choice, what's mentioned and what isn't = the "UI". The same moment reads differently depending on hidden state.

**Typography is a simulation readout.** Inner voice text is typographically distinct from narration (italics, visual intensity tiers). The tiers — quiet italic → uneasy → prominent → tremor animation — are driven by NT state (GABA, NE, serotonin) and personality (rumination). There is no "spiral" state variable; the experience emerges from NT conditions. `prefers-reduced-motion` collapses motion to static contrast. Rarity is what makes the heavy treatment land.

**Structure serves the moment.** Sometimes choices, sometimes description, sometimes events happening to you. Not locked to one interaction pattern.

**Simulated persistence.** Objects in the world that have state in real life should have state in the simulation. A phone has an inbox — messages arrive whether or not you look, and checking shows what's accumulated. Ignoring things has weight. This isn't UI chrome; it's the simulation being honest.

**One timeline.** No save scumming. Autosave on every action. You live with what happened. Closing and reopening picks up where you left off.

**Deterministic replay.** All RNG through seeded PRNG (`Timeline.random`). No `Math.random`, no `Date.now` in simulation. Given the same seed and action sequence, the game produces the exact same world state.

**The world is real.** The simulation models real-world mechanics. Derive behavior from parameters, don't hardcode assumptions. Geography derives from latitude: sign gives hemisphere, magnitude gives climate zone (tropical < 23.5°, temperate 23.5–66.5°), day length varies accordingly. Seasons depend on hemisphere and climate. Store latitude, derive everything else. The initial focus is surviving in a generic culture, but the simulation's bones should be honest about how the world works.

**Handle absence, don't patch symptoms.** The game runs in a browser tab. If the player walks away, the game shouldn't generate content into nothing. Handle absence properly (step-away, auto-pause, tab detection) and downstream problems like event accumulation dissolve. Deliberate inaction — the player choosing not to act — is a different thing entirely and should be a real, supported experience.

**No text reuse as a bandaid.** Seeing the same text twice is the game breaking the fiction. Text reuse is only acceptable when the repetition is genuinely realistic — a recurring sound, a repeated routine. Never to fill space, never because the pool ran out, never as a substitute for writing more content.

**Effects depend on internal state.** The same action at different moods produces different mechanical outcomes, not just different prose. Going for a walk doesn't always reduce stress. Lying in bed doesn't always help. The simulation is honest about when things help and when they don't — relief requires the internal conditions for relief.

**Neurochemistry has inertia.** Mood emerges from neurochemical levels that drift toward targets, not from instant state derivation. Eating a sandwich doesn't snap your mood — serotonin target shifts, and the actual level follows over hours. Drift uses exponential approach with asymmetric rates (falls faster than rises). Biological jitter uses deterministic sine waves (no PRNG) so adding systems later doesn't break replay. Sleep is the strongest lever on mood — quality affects serotonin synthesis and NE clearance.

**Emotional inertia is personal.** How sticky moods are varies per character. Neuroticism, self-esteem, and rumination are generated at character creation and stored as raw personality values in state. The drift engine computes `effectiveInertia()` from these each tick — no pre-computed inertia value. Only the four mood-primary systems (serotonin, dopamine, NE, GABA) are affected; physiological rhythms (cortisol, melatonin, etc.) ignore personality. Neuroticism adds extra stickiness in the "toward worse mood" direction only. Sleep deprivation, poor sleep quality, and chronic stress temporarily increase inertia for everyone.

**Sentiments are the emotional landscape.** Characters have likes and dislikes stored as `{target, quality, intensity}` objects in a sentiments array. Generated at chargen on charRng, stored on character, written to state via `applyToState()`. Two activation patterns: **target modifiers** (weather/time preferences feed NT target functions continuously) and **discrete nudges** (food, rain, outside, warmth, quiet trigger in interaction execute functions). Effects scale linearly with intensity — small background forces. The array in state is mutable — future steps will add accumulation and trauma sentiments. Use `State.sentimentIntensity(target, quality)` to look up intensities. Routine sentiment is stored but dormant.

**Sleep processes emotions.** During sleep, `State.processSleepEmotions()` attenuates each sentiment's intensity toward its character baseline (the chargen-generated value). Processing rate = 0.4 * sleepQuality * durationFactor. Good sleep (7+ hours, quality 1.0) processes ~40% of deviation per night — a moderate charge fades over 2–3 good nights. Accumulated sentiments with no character baseline attenuate toward 0. No PRNG consumed — fully deterministic.

**Sentiments accumulate from experience.** Repeated interactions build sentiments over time via `State.adjustSentiment(target, quality, amount)`. Work dread builds from can't-focus days, satisfaction from focused work. Coworker warmth builds from good-mood interactions, irritation from bad-mood interactions. Magnitudes are small per event (~0.01–0.02) — meaningful only after days or weeks. Work sentiments feed NT target functions at workplace (dread lowers serotonin/dopamine, satisfaction raises them). Coworker sentiments modify mechanical outcomes (warmth → social bonus, irritation → stress cost). Sleep processing attenuates accumulated sentiments toward 0 each night — chronic bad days + bad sleep create feedback loops, good sleep breaks them.

**Contradictory experience creates tension.** When accumulating a sentiment, apply a smaller cross-reduction (~30–40% of primary magnitude) to the contradictory quality on the same target. A good coworker interaction builds warmth AND gently challenges irritation. A relaxed work break challenges dread. Explicit per-site calls, not a generic helper — different contexts have different magnitudes and conditions. The result is ambivalence: both feelings grow, but contradictory experience slows the dominant one. `do_work` cross-reduces dread/satisfaction; `talk_to_coworker` and `coworker_speaks` cross-reduce warmth/irritation; `work_break` challenges dread when relaxed.

**Comfort habituates, dread entrenches.** Comfort sentiments (eating, warmth, quiet, outside, rain) lose a small amount of intensity each time they activate (-0.002 to -0.003). Sleep restores toward character baseline. Light use stays stable; heavy use fades slightly. Negative sentiments (dread, irritation) are not habituated by use — they have their own accumulation dynamics. During sleep processing, dread and irritation process 40% slower than comfort (entrenchment). Very high-intensity deviations resist processing regardless of quality (intensity resistance). The same sleep processes different feelings at different speeds.

**Absence builds guilt.** Friends who reach out deserve responses. Per-friend contact timestamps (`friend_contact` map, keyed by slot) track the last time the player engaged with each friend's message. After a 1.5-day grace period, guilt accumulates each sleep cycle (~0.005–0.008 per night, scaling gently with absence duration up to 1.6x at 14+ days). Unread messages from the ignored friend intensify guilt growth by 40%. Seeing unread friend messages on the phone screen nudges guilt proportionally (`guilt * 0.02` per check — amplifies existing guilt at ~2%, negligible when small). Reading a friend's message resets the contact timer AND reduces guilt by 0.02. Friend guilt lowers serotonin target when at home (where you could reach out) — max ~6 points at extreme guilt toward both friends. Guilt-aware idle thoughts fire based on intensity, independent of social tier. Guilt's sleep processing factor is 0.7 — between comfort (1.0) and dread (0.6).

**Regulation capacity is personal.** `State.regulationCapacity()` — the inverse of emotional inertia, applied during sleep. Fluid characters (low neuroticism, high self-esteem, low rumination) process emotions more efficiently overnight; sticky characters process slower. Range 0.5–1.3. At 50/50/50 → 1.0. State penalties: adenosine > 60 and stress > 60 each reduce capacity. A chronically stressed, neurotic, sleep-deprived character processes emotions dramatically less effectively — the simulation models why some people can't "just sleep it off."

**Nothing arbitrary.** Every parameter should have a reason — derived from real relationships between systems, not set by formula. Pay rate from job type from career from education from origin. Rent from housing from income from career. Personality from upbringing and events. The backstory system is the mechanism: as it grows, arbitrary parameters become derived ones. When a parameter must be approximated (because upstream systems don't exist yet), document the approximation explicitly and note what should feed it.

The specific failure mode to avoid: inventing a number, discovering it's wrong, inventing a replacement, and writing a comment that sounds like derivation when it isn't. "Adults get 4-5 colds per year therefore 0.7%" is rationalization, not derivation, if the 0.7% was chosen first. If you don't know the real value, say so. "Approximation debt — needs calibration" is honest. A comment that implies derivation when there was none is not.

Also: don't mistake a proxy for a cause. Job type is not the driver of illness exposure — contact intensity is (number of close contacts, duration, ventilation). Job type correlates with contact intensity but isn't the mechanism. Name the real variable, even if it doesn't exist yet in the simulation.

**Emergence over flags.** The simulation doesn't declare qualities — it sets parameters and lets behavior follow. Personality isn't a flag; it's a configuration of continuous values. Mood isn't switched on; it emerges from neurochemistry. Clinical patterns aren't diagnosed; they arise when parameters land in certain configurations. Never announce what the simulation is doing — set conditions and let the rest emerge. See docs/design/philosophy.md.

**Constitutional vs. circumstantial conditions.** Character conditions fall into two categories, and they require different chargen models. *Constitutional* conditions (migraines, genetic deafness, color blindness, sickle cell) are probabilistic — they arise from genetics, not circumstances. A random roll at chargen is appropriate, grounded in real-world prevalence data. *Circumstantial* conditions (dental disease, diabetes, chronic pain from injury, occupational illness) are the result of life history — income, access to care, diet, environment, what happened. These must derive deterministically from backstory, not from a dice roll. "Has dental pain" is not a random property of a person — it is a consequence of whether they had access to dental care. When the backstory doesn't yet have the upstream variables to derive a circumstantial condition properly, the condition is not yet assignable at chargen. Leave it unassigned and document what needs to be built. A random roll with invented percentages is not an acceptable approximation — it is the wrong model, not a crude version of the right one. And don't fix an invented percentage with a different invented percentage — that is the same mistake at a different scale.

**Characters have histories.** Financial position, personality, sentiments, relationships — all are consequences of a generated life history. The chargen backstory produces broad strokes (cheap PRNG); post-finalization simulation produces exact numbers (runs once). As more systems are built (family, health, identity), they feed into the history and replace approximations with derived values.

**Money is derived, not primary.** The checking balance is a surface over economic flows: income from employment, obligations from housing/bills, spending from player choices, starting position from life history. Financial anxiety is a sentiment that connects to the neurochemistry engine. The same dollar amount creates different experiences depending on the character's relationship with money.

**Habits emerge from observed play.** The character develops behavioral momentum — habits are state→action associations learned from player behavior via CART decision trees, not prescribed sequences. Habits are ephemeral (derived from the action log each session, no save format changes) and consume no RNG. Routine comfort/irritation sentiments modulate formation threshold. Two tiers: suggested (≥0.6, subtle highlight) and auto (≥0.75, character acts after delay). Prose modulation is deferred. See docs/design/habits.md for the full design.

**Auto-advance is the character acting.** When habit strength reaches auto tier (≥0.75), approaching prose appears (deterministic, no RNG — moodTone + NT reads only), the predicted action highlights, and after 2500ms the action fires. The player can click any action to interrupt. Auto-advance chains naturally — each auto-fired action re-renders and re-predicts. Suppressed in phone mode. `Content.approachingProse` maps action IDs (and `move:destination` keys) to prose functions.

**Habits don't train on their own predictions.** Each training example carries a source tag: `'player'` (full weight 1.0) when the action didn't match a visible prediction, `'suggested'` (weight 0.5) when it matched a suggestion, `'auto'` (weight 0.1) when auto-advance fired. Without this, the system snowballs — suggesting an action makes the player more likely to pick it, which makes the system more confident, which makes it suggest harder. Source-weighted training keeps habit strength grounded in genuine player preference.

**Sleep debt has high interest.** Ideal 480 min/day. Full deficit accumulates; excess repays at 33%. Cap 4800 min. Effects continuous above 240 min: serotonin/dopamine targets drop, emotional inertia increases, energy recovery degrades via `1/(1+debt/1200)`. One good night after a week of bad ones barely dents the total.

**Sleep has architecture.** 90-min cycles. Early cycles are deep-sleep heavy, later are REM heavy. `State.sleepCycleBreakdown()` — no PRNG. Deep sleep clears adenosine. REM clears NE and processes emotions. Short sleep gets deep sleep but misses REM. Sleep inertia worst when pulled from deep sleep in early cycles.

**Melatonin is behavioral.** Four modifiers on the base cosine curve: daylight exposure bonus (+10 if ≥120 min outside), phone screen suppression (-15 at night), indoor evening delay (-3 at 19:00–21:00), fall-asleep delay multiplier (high melatonin → 0.7x, low → 1.4x). `daylight_exposure` tracked per wake period, reset on wake.

**The alarm is a negotiation.** Sleep sets `just_woke_alarm`. snooze_alarm: 9 min, tiny energy, prose escalates (fog→negotiation→guilt), 2 RNG calls. dismiss_alarm: clears the flag, 1 RNG call. Both are normal recorded actions. Snooze approaching prose: "Your hand is already moving." / "Again."

## Code Conventions

**RNG discipline:**
- ALL randomness goes through `Timeline.random()` and friends
- Event text must be generated synchronously (consuming RNG), then displayed with `setTimeout` delays
- Interaction IDs must be unique across all locations (e.g., `check_phone_bedroom`, not `check_phone`)
- **Balanced RNG consumption:** interactions that branch (help vs. decline, succeed vs. fail) must consume the same number of RNG calls on every path. If one branch doesn't need a call, add `Timeline.random()` as an explicit balance — otherwise replay diverges from any future branch that gets added

**Replay correctness:**
- Replay skips availability checks — always executes recorded actions
- Idle events are recorded as actions so their RNG consumption replays correctly
- RNG consumption order must match exactly between live play and replay
- Parameterized interactions record `data` in the action log (`{ type: 'interact', id, data }`). `replayInteraction(id, data)` passes `action.data` through to `execute(data)`. Player-entered quantities (e.g. transfer amounts) are in the log — replay is exact

**Tier functions, not inline scalars.** When content.js needs to branch on a continuous state variable, use a tier function in state.js that returns a named qualitative label — `messTier()` → `'cluttered'`, `energyTier()` → `'exhausted'`, etc. Content.js branches on those labels, never on `State.get('x') > 47`. Tier thresholds live in one place, carry meaning through their names, and keep raw numbers entirely out of prose logic. Location descriptions, interaction available checks, and event text all follow this rule. The same applies to NT conditionals in deterministic modifiers — use `aden > 65` as a readable threshold, not a magic scalar buried in a chain of comparisons.

**Prose:**
- No simulation variables in player-facing text — no energy values, stress levels, NT readings, job standing scores
- No system voice — the simulation never speaks directly to the player about what it's doing
- State affects prose through qualitative tiers, not numeric thresholds exposed to the player
- The same moment reads differently depending on hidden state
- Prose leads, simulation follows. If the text needs a phone inbox to feel real, build the inbox. Don't hollow out prose to match a thin simulation — deepen the simulation to support the prose.

**Prose-neurochemistry shading:**
- `moodTone()` picks the mood branch (coarse selector). Within branches, NT values shade continuously via three layers:
  1. **Weighted variants** — texts as `{ weight, value }` objects. General texts at weight 1. NT-specific texts weighted by `State.lerp01()`. Use `Timeline.weightedPick()` (same 1 RNG call as `Timeline.pick()`).
  2. **Deterministic modifiers** — short phrases appended via NT conditionals (no RNG consumed). Adenosine fog, NE tension, cortisol body stress.
  3. **Mechanical shading** — same action at different NT states produces different mechanical outcomes (e.g. heavy+lowGABA gets no stress relief from lying down).
- Key dimensions: serotonin (emotional coloring), dopamine (engagement/motivation), NE (alertness/sensory detail), GABA (anxiety undertone), adenosine (perceptual clarity), cortisol (body tension).
- New prose sites use `Timeline.weightedPick([...])` with `{ weight, value }` objects from the start — wrap general texts at weight 1, NT-specific texts weighted by `State.lerp01()`. Same 1 RNG call as a plain pick.

**Sound realization: per-source lexical sets, not acoustic taxonomies.** No finite set of acoustic dimensions (pitch, rhythm, texture) can fully describe sound character — sources that share all dimensions would render identically, and the specific meaning of a given sound (domestic, intrusive, background) can't be captured generically. Sound prose varies along two axes: (1) procedural architecture selection (9 sentence shapes + 3 passage shapes, NT-driven) and (2) authored lexical pools per source (`body_subjects`, `appositive_np`, `ambiguity_alts`, etc.) that feed that machinery. Richer sound prose means fuller pool coverage per source so each architecture has material to work with. Acoustic dimension taxonomies are a third thing that helps with neither axis. Don't add an acoustic property layer.

## Workflow

**Minimize file churn.** When editing a file, read it once, plan all changes, and apply them in one pass. Avoid read-edit-fail-read-fix cycles by thinking through the complete change before starting.

**Always commit when done.** When you finish a task, commit the work. Don't leave changes uncommitted. If a task has multiple logical pieces, commit each piece separately.

**Keep STATUS.md current.** Before every commit, check whether the work changes what's implemented — a new interaction, a new state variable, a new system, a structural change. If it does, update STATUS.md to match. STATUS.md is the ground truth for what the codebase actually does right now.

**Keep docs/design/overview.md and CLAUDE.md current.** When a conversation clarifies design direction, corrects a simplification, or adds nuance to how a system should work — capture it in docs/design/overview.md (full explanation) and CLAUDE.md (short rule) before committing. Design understanding evolves during implementation. Don't let the documents fall behind the thinking.

## Commit Convention

Use conventional commits: `type(scope): message`

Types:
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `docs` - Documentation only
- `chore` - Maintenance (deps, CI, etc.)

Scope is optional (e.g., `state`, `content`, `ui`).

## Negative Constraints

Do not:
- Surface simulation internals as visible numbers, meters, or labels — NT values, energy levels, stress scores, job standing, drift rates
- Use `Math.random()` or `Date.now()` in simulation code
- Force the player through a prescribed sequence — the world responds, it doesn't herd
- Add game chrome, HUD elements, or anything that looks like a "game UI"
- Create save/load UI — the game just continues where you left off
- Announce actions ("I will now...") — just do them
- Use `--no-verify` — fix the issue or fix the hook
