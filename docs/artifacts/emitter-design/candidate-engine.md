# Act-Emitter Candidate — "The Dynamical Engine IS the Emitter"

**Frame:** minimize new machinery. The repo already ships a per-individual mechanistic
dynamical engine (NT levels, baselines, sentiments, personality, trauma, tier functions,
seeded multi-stream PRNG). That engine *already* governs how the protagonist's hidden state
shapes which options exist and how they resolve. The act-emitter is **that same engine run
forward on every node** — not a new model. The emitter's only novel obligation is to turn
the agent's folded state + situation into a **propensity distribution over the acts the
situation affords**, then take one seeded draw.

This document answers §11C ("what is the act-emitter?") under that frame, and supplies the
COMPUTE PROFILE + a concrete measurement spike, as required.

---

## 0. One-paragraph statement

For a node `n` at time `t`, the emitter (1) folds the act-stream into `NodeState(n,t)` via
the existing engine (§11A — already the engine's job), (2) computes the **afforded act-set**
`A(n,t)` from the situation by evaluating the same `available()`-style affordance predicates
the present engine already uses, (3) scores each afforded act with a **propensity function**
`π` that reads ONLY `NodeState(n,t)` + the situation context-cell `C` (both strictly folded
from acts dated `< t`), producing an unnormalized weight per act, and (4) draws one act with
`Timeline.random()` over the normalized weights. The drawn act is appended to the log;
folding it (and its effect on the patient) is the next tick. No separate learned model. The
propensity function is the *forward dynamics of this specific person*, evaluated at `t`.

---

## 1. The propensity function `π` — what it is, exactly

`π(act | NodeState(n,t), C) → ℝ⁺` is an **unnormalized weight** assigned to each act in the
afforded set. It is assembled from the engine's existing scalar readouts — nothing new is
invented to make it work; it is a *re-use* of the quantities the engine already maintains.

### 1.1 Inputs (all strictly-past folds)

- `NodeState(n,t)`: NT levels (serotonin, dopamine, NE, GABA, adenosine, cortisol, melatonin),
  the per-system **baselines** (chronic setpoints — `nt-baseline.md`), **sentiments** toward
  every target the act could involve (the patient, the place, the activity), the **personality
  vector** (neuroticism, self-esteem, rumination, extraversion, …), **trauma** entries with
  their intensities, and the **physiological** stack (hunger, thirst, fatigue, pain, illness).
  All of these are *already* the fold of the act-stream (§11A) — `π` does not draw them.
- `C`: the context-cell — the situation as assembled by the **UNSAYABLE context-assembler**
  (§11E): filtered to facts dated `< t` and strictly-upstream in the DAG. `C` carries who is
  present, where, the time-of-day/clock state, ambient pressures (an obligation due, a person
  speaking, a threat), and the affordances those imply. **`C` has no field for a demanded
  outcome.** Posterior-fitting is a type error.

### 1.2 The weight is a product of factors, each a function the engine already exposes

For each afforded act `a`, its propensity decomposes multiplicatively over orthogonal drives,
mirroring how the engine already shades behavior:

```
π(a) = need(a) · drive(a) · sentiment(a) · disposition(a) · arousal_gate(a) · trauma_override(a)
```

- **`need(a)`** — physiological pull. The drives the engine already computes (hunger/thirst/
  fatigue tiers, bladder, pain). An act that relieves a high need gets a high factor. This is
  literally `hungerTier()`, `energyTier()`, etc. mapped to a weight. Reused, not new.
- **`drive(a)`** — dopaminergic engagement / motivation. Dopamine relative to baseline scales
  approach acts up, anhedonic withdrawal acts down. Already the engine's dopamine readout.
- **`sentiment(a)`** — the agent's accumulated feeling toward the act's target/patient/place,
  read from `sentimentIntensity(target, quality)`. Warmth toward a person raises affiliative
  acts toward them; entrenched dread toward a place lowers acts that go there. Already there.
- **`disposition(a)`** — personality shaping. Extraversion raises social-initiation acts;
  high neuroticism raises avoidance/checking acts; conscientiousness raises obligation acts.
  A small fixed map from each act's **tags** (see §3) to personality axes. The only genuinely
  new table, and it is tiny and qualitative (act-tag → which axis, sign), not population-fitted.
- **`arousal_gate(a)`** — NE/cortisol gating. High NE/cortisol (threat priming) sharpens the
  distribution toward defensive/reactive acts and suppresses deliberative/exploratory ones —
  this is the *temperature* of the draw, not a per-act factor: `softmax` temperature `τ`
  falls as arousal rises (high arousal → peakier → more compelled, less chosen). This is the
  engine's existing "agency is on a gradient / NT mediates involuntary firing" principle made
  into the distribution's sharpness. **No new state.**
- **`trauma_override(a)`** — the engine's existing trauma mechanic: a matching trauma cue can,
  with probability scaling in trauma intensity (resolved by `Timeline.random()`), collapse
  the distribution onto the trauma response act, overriding `π`. Already a documented engine
  behavior ("trauma can override... probability scales with trauma intensity").

### 1.3 The draw

```
weights = A(n,t).map(a => π(a, NodeState(n,t), C))
chosen  = Timeline.weightedPick(A(n,t), weights, temperature τ(arousal))
```

`Timeline.weightedPick` is the `rng` stream (this is mechanical — it affects world state).
One RNG call per emitted act. Determinism preserved. The factorized form means **no
parameter exists through which a demanded future could enter**: every factor reads a
strictly-past fold or a tag-map constant. The future is unsayable because there is no input
slot for it (§11A's structural unsayability, here at the act level).

---

## 2. Why this is NOT W9 (a frozen population posterior)

This is the load-bearing argument the frame requires.

**W9 is:** bake a CART/decision-tree from *population data* — fit `P(act | features)` across
many people, freeze the leaves, and read acts off the frozen tree. The objection (W4 verbatim):
a smoothed conditional average carries **no lived process** — it gives the character a draw
from the correct distribution, never their own cause.

**This emitter is the opposite on every axis that makes W9 wrong:**

1. **No fitting across people.** `π` is never trained on a population. It is *assembled* from
   the engine's mechanistic readouts of **this node's own folded state**. There is no corpus,
   no leaves, no `argmax over fitted splits`. The "parameters" of `π` are the per-act-tag →
   personality-axis map (§1.2) — qualitative coupling constants of the *mechanism* (like "NE
   gates threat response"), not estimated conditional frequencies. They are the same kind of
   constant as `effectiveInertia()`'s weights: a stated mechanism with a citation or a flagged
   approximation debt, not a population posterior.

2. **The cause is the fold, not the distribution.** A CART's leaf says "people like this tend
   to do X." This emitter says "*this* person, whose dopamine baseline is depressed because
   acts `a₁…aₖ` (dated, in the log) eroded it, and who carries entrenched dread toward this
   place because of act `aⱼ`, has low approach-propensity *here, now, for this reason*." The
   character has their **own reason** — it is literally the act-stream behind the fold. That
   is the standing rule "the character needs their own reason," satisfied structurally.

3. **No frozen leaves; live recomputation.** W9 freezes a smoothed average. Here `π` is
   recomputed every tick from a state that itself changed because of the last act. There is
   nothing frozen to be a posterior *of*. Replay is cold-recompute from the log (§11A), so the
   "model" is regenerated, not stored.

4. **Emergence, not flags.** The same machinery already forbidden from being a flag-based
   personality model (CLAUDE.md "emergence over flags") is what drives the emitter. Clinical
   patterns, withdrawal, compulsion — they arise when the folded parameters land in certain
   configurations, exactly as the present engine already does for the protagonist. A CART would
   *diagnose*; this engine *lets the pattern arise*.

5. **Not a tool-availability retreat.** W9 is flagged as a retreat because the repo ships habit
   CART machinery and the tree is reached for *because it's there*. This candidate reaches for
   the **NT/baseline/sentiment engine** — also already shipped — but the engine is reached for
   because it is *already the per-individual causal model of behavior*; using it forward on
   other nodes is the literal content of §2 ("present = past continued; same engine"). The
   distinction: the CART is a *generic learner* applied where a causal model belongs; the
   dynamical engine *is* the causal model. (Honest caveat: §6 weakness.)

**The crisp statement:** a CART asks *"what do people in this cell do?"* and has no `n`. This
emitter asks *"what does the dynamical system that IS person `n`, in state `NodeState(n,t)`,
do when the situation affords `A`?"* The `n`-specific fold is the entire input. It is this
person's causal dynamics, not a tree baked across many people.

---

## 3. The ActKind ontology and apply-rules — where they sit

This is where fidelity can re-enter by the back door (§11C / `candidate-primitive.md` §8),
so it is specified concretely.

### 3.1 ActKind

An **Act** is the §5 primitive instance: `{ kind, actor, patient, place, t, data, tags }`.

- `kind` ∈ a **verb ontology** of ActKinds: `speak_to`, `withhold_from`, `comfort`, `strike`,
  `provide`, `neglect`, `praise`, `criticize`, `leave`, `return_to`, `work`, `rest`, `consume`,
  `tend`, `flee`, `seek`, … The ontology is **generative, not enumerated-per-location**: a
  small set of relational/physical verbs that compose with arbitrary patients/places. (Contrast
  the present engine's location-bound interaction IDs like `check_phone_bedroom` — those are
  the *protagonist's UI projection* of ActKinds onto a furnished present scene. The general
  emitter works in ActKinds; the present-day protagonist UI is one rendering of them.)
- `tags`: qualitative labels (`affiliative`, `aggressive`, `avoidant`, `obligation`,
  `consummatory`, `caregiving`, `self-soothing`, …). Tags are the join key to `disposition(a)`
  in §1.2. The tag set is small and human-authored once — it is **mechanism vocabulary**, not
  per-person data.

### 3.2 Affordance: how `A(n,t)` is determined

`A(n,t)` = the ActKinds the situation `C` makes available. This **reuses the existing
`available()` predicate pattern verbatim**: each ActKind has an affordance predicate over
`(NodeState, C)` — present iff the situation supports it (a person is present to be spoken to;
food exists to be consumed; an obligation exists to be met or shirked). This is exactly
`interactions[id].available: () => …` generalized to take `(state, context)` instead of closing
over the singleton game state. **No new mechanism** — the present engine already computes the
afforded set this way every render; the emitter calls the same predicates for any node.

Opaque-constraint and gradient principles carry over: an act simply isn't in `A` when the
situation can't support it; nothing is gated by an invented cap.

### 3.3 Apply-rules

Each ActKind has an **apply-rule**: how it mutates the patient's (and actor's) state when
folded. This is the fold's transition function `applyAct` (§11A). It is built from the
engine's existing primitives:

- emits a **dated event** to the log (`events.js` shape) with the NT encoding stamp;
- calls `adjustNT(...)` on the **patient** for acute receptor-level effects (a strike spikes
  the patient's cortisol/NE; comfort raises GABA/serotonin) — the same `adjustNT` contract,
  used for acute events only;
- shifts **sentiments** (`adjustSentiment`) on both actor and patient toward the act's quality
  (repeated neglect entrenches the child's dread; repeated provision builds warmth);
- chronic repetition shifts **baselines** (the engine's existing chronic-history→setpoint path),
  not direct values — so a childhood of a given act-pattern *becomes* the adult's setpoint.

The apply-rule library is the one place richness must be invested: thin verbs → thin people.
The mitigation is that apply-rules route through the *already-rich* NT/baseline/sentiment
engine, so a single `strike` act produces the full cascade (acute NE spike → cortisol →
sentiment entrenchment → baseline drift if chronic → downstream change in *that node's* future
`π`). Fidelity rides on the engine's existing depth, not on enumerating outcomes.

### 3.4 Where coherence-into-a-self comes from

W3's failure: a left-fold of locally-plausible reactions that sum to **no unifying self**.

This candidate is **structurally immune** to W3, and this is the frame's strongest claim:
**every factor of `π` reads the same single `NodeState(n,t)`.** There is no separate model
per act, no independent per-decision draw of "what would a person do here." All acts the node
ever emits are scored by one propensity function reading one rich, continuously-evolving state
vector. Coherence is not assembled or checked after the fact — it is **guaranteed by shared
state**: the same depressed dopamine baseline that makes this node withdraw from a friend also
flattens their engagement at work and dampens their approach to food, *because all three reads
hit the same baseline*. A unifying self is not an emergent accident to be hoped for; it is the
**single fold every reaction is a function of**. The self IS `NodeState(n,t)`; the acts cohere
because they are all `π(·)` over it. (This is precisely why the frame is attractive: the engine
already enforces this for the protagonist — the protagonist's behavior already coheres because
it all reads one hidden state. Running the same engine on other nodes gives them the same
coherence for free.)

---

## 4. COMPUTE PROFILE — and how to MEASURE tractability

The doc's meta-trap: the intractability premise was **never measured**. This section makes it
measurable, with concrete numbers to confirm/falsify.

### 4.1 Per-act cost

One emitted act costs:

- **Fold read** of `NodeState(n,t)`: if state is incrementally materialized (the engine's live
  mode — accumulator updated by each `applyAct`), this is **O(1)** — read current fields. Cold
  recompute (replay) is O(acts touching `n`). Live forward generation uses the accumulator, so
  per-act fold read is O(1).
- **Affordance eval**: evaluate `|K|` ActKind predicates against `C`, where `|K|` is the verb
  ontology size (tens, not thousands). O(|K|) cheap boolean/arithmetic predicates.
- **Propensity eval**: for each act in `A` (subset of `K`), evaluate the `π` product — a handful
  of multiplies over already-computed scalars. O(|A|).
- **Draw**: one `Timeline.weightedPick` over `|A|` weights. O(|A|), one RNG call.
- **Apply**: `applyAct` on actor + patient — a fixed handful of `adjustNT`/`adjustSentiment`
  calls + one event-log append. O(1) amortized.

So **per-act cost ≈ O(|K|)**, dominated by affordance + propensity eval over the verb ontology
— a small constant. Call it `c_act` (a few microseconds in JS, to be measured).

### 4.2 Cost of folding from t=0 across a social network over decades

Total cost = `c_act × (total acts emitted across all covered nodes over the covered timespan)`.

The act count is the real variable. It is **NOT** "every person who ever existed simulated at
minute resolution for decades." Two existing levers bound it hard:

- **Coverage, not population** (§3): only nodes the forward pass *touches* are folded at all.
  A protagonist's life touches O(hundreds) of people meaningfully, most at low *coverage*
  (few acts), a handful (parents, partner) at high coverage.
- **Time-step is a parameter** (§2/§9): the past runs at coarse steps (life-phases), not
  minutes. A coarse step emits **few acts per node per step** (the formative ones), not a
  minute-by-minute act stream. Coarse-time ≠ coarse-person: the people are whole; the *act
  density per unit time* is low in the deep past and high near the present.

Rough envelope to be validated: if a generated life covers ~200 people, and the act-stream
that *matters* (formative, log-worthy acts) is ~10²–10³ acts per high-coverage node and ~10⁰–10¹
per low-coverage node, total covered acts ≈ 10⁴–10⁵. At `c_act` ~ microseconds, that is **tens
of milliseconds to a few seconds** of generation for an entire ancestral/social life. **If that
envelope holds, the intractability premise is FALSE.** The point is that nobody measured it.

### 4.3 What dominates

Not the per-act arithmetic (trivial). The two things that can dominate:

1. **Act-count blowup** from over-fine time-stepping or over-broad coverage — i.e. emitting far
   more acts than are formative. This is a *coverage-policy* cost (the open §3/§9 frontier),
   not an emitter cost.
2. **The patient-side cascade in `applyAct`**: if every act folds into a chain of NT/baseline/
   sentiment updates on the patient that themselves trigger re-evaluation, cost could amplify.
   In the present engine these are O(1) field updates, so this stays bounded — but it must be
   measured, because chronic-baseline-drift recomputation across many nodes is the plausible
   hot path.

### 4.4 THE MEASUREMENT SPIKE (concrete; this is the deliverable the meta-trap demands)

**Minimal spike:** generalize the existing engine's tick to run on a small synthetic node set,
emit acts via the §1 emitter, and instrument. Do NOT build the full substrate first — measure
the kernel.

Build:
1. A `Node` = `{ id, accumulator: NodeState, actLog: [] }`. Seed 5–10 nodes as t=0 axioms
   (hand-set NodeStates — measurement only, not the real t=0 draw).
2. The §1 emitter loop: pick the active node, assemble `C` (who's co-present), eval affordances
   over a **~30-ActKind** starter ontology, score `π`, draw, `applyAct`.
3. Run forward for a simulated **30 years at life-phase time-steps** (say weekly-ish coarse in
   childhood, denser near present) across the node set.

Instrument (the numbers that confirm/falsify "intractable"):
- **`c_act`** — wall-clock per emitted act (microseconds). `performance.now()` deltas / act count.
- **`N_acts`** — total acts emitted to cover the 30-year, 5–10-node run. This is the dominant term.
- **acts-per-node-per-sim-year** distribution — confirms act density is low in deep past
  (coarse-time working) and not exploding.
- **`applyAct` cost share** — fraction of wall-clock in fold/cascade vs. affordance/propensity.
  Confirms/refutes §4.3(2) (the cascade hot path).
- **scaling**: run at 10, 50, 200 nodes; fit `total_time ≈ c_act × N_acts`. Confirm linearity in
  covered acts (not super-linear — super-linearity would flag a cascade or all-pairs `C`-assembly
  bug).
- **memory**: bytes per node (accumulator + actLog). Confirms the log-as-truth store is bounded.

**Decision rule (pre-registered, so it can't be rationalized after):**
- If a full 200-node, 30-year covered life generates in **< ~2 s wall-clock** and **< ~few hundred
  MB**, the premise "forward-sim from t=0 is intractable" is **FALSIFIED** — build it.
- If `N_acts` or `c_act` blows past that by an order of magnitude, locate which term dominated
  (act-count → coverage policy; cascade → `applyAct`) and attack *that*, having *measured* it —
  never retreat to granularity loss or a causality shortcut (the meta-trap forbids both).

This makes the never-measured premise a one-spike experiment with numbers, exactly as §9/§11C
demand.

---

## 5. How this satisfies every hard constraint (checklist)

- **Forward-caused prior, outcome unsayable**: `π` reads only strictly-past folds + a tag-map
  constant; the context-assembler (§11E) has no demanded-outcome field. No input slot for the
  future. ✓
- **Not W9 (CART/population posterior)**: §2 — `π` is the per-node dynamical engine, not a tree
  fit across people; the cause is the fold, recomputed live, never frozen leaves. ✓
- **No LLM in the control loop**: the emitter is pure engine arithmetic + seeded draw. LLM is
  texture-only, build-time, frozen (§11D), untouched here. ✓
- **Deterministic**: one `Timeline.random()`-family call per act (`rng` stream); replay =
  cold-recompute fold from the log. No `Math.random`/`Date.now`. ✓
- **No W3 incoherence**: §3.4 — every act scored by one shared `NodeState`; the self IS the
  fold; coherence is structural, not checked. ✓
- **Full fidelity, no granularity loss**: nodes are whole (fold = full engine state);
  coarse-time reduces act *density*, never person fidelity (§4.2). ✓

---

## 6. The single biggest weakness (stated honestly)

**The `disposition(a)` tag→axis map and the apply-rule library are hand-authored mechanism
tables, and their *richness ceiling* is exactly the present engine's richness ceiling.** Two
linked risks:

1. **Verb-ontology / tag-map thinness is W9 wearing a different coat.** If the act-tag →
   personality-axis couplings are tuned to make populations come out "right," I have smuggled a
   population posterior into the coupling constants — the very W9 I claim to avoid. The defense
   ("these are mechanism constants like `effectiveInertia`'s weights, with citations or flagged
   debts") is only as good as the discipline behind each constant. A lazily-tuned table *is* a
   diffuse CART. This must be policed exactly like every other engine constant (CLAUDE.md
   "nothing arbitrary"; each coupling cites or is marked approximation debt).

2. **The present engine was built for ONE protagonist in a furnished modern scene.** Running it
   as a general multi-agent emitter across eras and relationships requires apply-rules and
   affordances for relational/historical acts the engine never modeled (a parent withholding
   affection over years; a death; emigration). The frame *minimizes new machinery*, but the
   apply-rule library for the full ActKind ontology is genuinely new work, and if it is shallow,
   fidelity dies at the apply-rule (§11C's explicit warning). "Reuse the engine" understates how
   much of that engine, for non-protagonist relational life, **does not yet exist** — it is the
   §2 honest gap ("today's engine is a degenerate special case") landing squarely on this design.

The measurement spike (§4.4) addresses *tractability*; it does **not** address this fidelity
ceiling. That is the real open risk this candidate carries forward.
