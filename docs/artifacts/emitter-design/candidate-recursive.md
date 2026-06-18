# Act-emitter candidate — ONE RECURSIVE POLICY

**Frame:** There is exactly ONE behavior architecture. The protagonist's node runs it with a
human in the policy slot. Every other node runs the *same* architecture with a **seeded
autonomous policy** in the same slot. The act-emitter for an NPC is not a separate object —
it is *literally the protagonist's decision pipeline with the human replaced by a seeded
policy*. This is the doc's own §2 commitment ("one engine and a swappable policy slot")
taken to its logical end: the emitter is the slot's default occupant.

This candidate answers §11C's open crux by *refusing to add a new mechanism*. The emitter
already has to exist for the protagonist (the pipeline that turns NT/baseline/sentiment
state + situation into the choices the player is offered, the involuntary firings, the
agency-gradient). The only thing missing for NPCs is *what fills the human's seat*. Design
that, and the emitter is done — uniformly, for all 8 billion latent agents and the one
played one.

---

## 1. What the pipeline IS (shared by human and seeded nodes)

The §5 primitive — *"an agent acts on another, in character, given their nature and the
situation"* — decomposes into a fixed pipeline. This pipeline is the *same code path* for
every node; only step (4) differs between human and seeded.

```
emitAct(node n, time t, situation s):
  1. STATE     = NodeState(n, t)            # §11A left-fold of acts<t. derived, never drawn.
  2. AFFORD    = affordances(n, s, STATE)   # what acts are physically/socially possible here-now
  3. PROPENSITY= propensity(a | STATE, s)   for each a in AFFORD   # a weight per affordance
  4. SELECT    = policy.choose(AFFORD, PROPENSITY, STATE, s, rng)  # <-- THE ONLY SWAP
  5. commit SELECT to act-log at t          # becomes input to future folds (its own + patients')
```

- **STATE (1)** is exactly §11A: `fold(applyAct, seedAxiom(n), acts where actor=n or
  patient=n, t'<t)`. The existing NT / baseline / sentiment engine *is* the fold. No new
  machinery. This is the protagonist's hidden simulation, run for everyone.
- **AFFORD (2)** is the affordance enumerator the protagonist already needs: given location,
  objects, other present agents, money, time-of-day, body capacity, what is even *doable*.
  This is the opaque-constraint / availability logic from CLAUDE.md ("things just aren't
  there when they can't be"). It reads STATE and situation; it consumes no RNG; it is a pure
  function. For the protagonist this becomes the menu of interactions. For an NPC it is the
  same enumeration, unread by any human.
- **PROPENSITY (3)** is the *agency-gradient* made into a weight vector. CLAUDE.md: "When NT
  state doesn't clearly determine a response, the player gets a choice. Trauma can override
  it — probability scales with trauma intensity. NT mediates the baseline: high cortisol/NE
  primes threat response." Propensity is precisely the distribution that gradient already
  implies: how strongly each affordance is pulled-toward by the current NT/baseline/sentiment
  configuration. For the protagonist, propensity *shapes what is offered and how it reads*
  (a high-cortisol node's threat responses are weighted up, sometimes to involuntary
  certainty). For an NPC, propensity *is* the choice distribution.
- **SELECT (4)** — the swap. Human: the player picks (the propensity vector still pre-fires
  involuntary acts when the gradient is steep enough — trauma override resolved by PRNG —
  but the residual free choice is the human's). Seeded: `policy.choose` samples the
  propensity vector with `Timeline.random` (the mechanical `rng` stream — this is game-state,
  not cosmetic). **This is a forward draw conditioned only on STATE (a past-only fold) and
  the situation. There is no field for a demanded outcome. Posterior-fitting is unsayable
  (§11A/§11E) because the policy's *only* inputs are the past-fold and the present
  situation.**

The seeded policy is therefore **not a model of behavior**. It is a *sampler over a
distribution the rest of the pipeline already computes*. The behavioral content lives in
PROPENSITY (derived from the fold); the policy only resolves the residual freedom the
gradient leaves open. This is the load-bearing move and it is what lets this candidate
escape W9 — see §3.

---

## 2. Human-vs-seeded is the ONLY difference (uniformity = fairness)

Steps 1–3 and 5 are byte-identical for every node. The protagonist is **not
engine-privileged** (§2): they are max-coverage + human-in-slot-4. An NPC is whatever-coverage
+ seeded-in-slot-4.

This directly realizes CLAUDE.md's *"the simulation is fair to all characters... the same
underlying reality... not the same resolution, but the same underlying reality."* Fairness
is not a value bolted on; it is the *consequence of there being one pipeline*. A stranger on
the bus runs `emitAct` exactly as the protagonist does. Their day is happening because the
same five steps are producing it. There is no "NPC AI" that is a cheaper sketch of the
real thing — the real thing is all there is.

The swap is also the *only* place determinism could fork, and it doesn't: the human's
choices are recorded as actions in the log (CLAUDE.md replay discipline), so on replay the
human slot is *also* just a deterministic playback of recorded selections. **On replay,
human and seeded nodes are indistinguishable** — both are "read the next committed act."
The live human is the single source of genuine novelty; everything else, including the
human's own past, is deterministic forward replay. This is the cleanest possible statement
of "one timeline."

---

## 3. Does online per-individual learning escape W9? — and where does it bootstrap?

W9 forbids *baking a CART from population data to emit acts* — a frozen population posterior,
a smoothed average with no lived process. The repo's habit-CART is different in kind: it
learns **online** from **this player's own observed play**, source-weighted (player 1.0,
suggested 0.5, auto 0.1), and consumes **no RNG**. The assigned question is whether a
*per-individual online-learned policy* — one CART per NPC, trained on that NPC's own
forward-lived acts — is the seeded policy.

**Verdict: NO. A per-individual online CART is the WRONG answer, and importantly it is wrong
for a *different* reason than W9.** It is not a tool-availability retreat in disguise; it is
a subtler error. Walking it carefully, because it is the most seductive version of this
frame:

### 3a. The per-individual CART is not a population posterior — but it is still wrong.

A CART trained on NPC *n*'s own act-stream is, by construction, *n*'s own lived process. It
carries no population smoothing. So W9's literal objection ("frozen population posterior")
does **not** apply. This much is real and is the genuine insight the habit-system analogy
surfaces: **online per-individual learning genuinely escapes the population-posterior
trap.** Good.

### 3b. But it *duplicates the fold*, and that is W3-incoherence by the back door.

Here is the fatal problem. NodeState (§11A) *already is* the complete, lossless summary of
"who *n* is, given everything that has touched them." It is the left-fold of the entire act
stream through the NT/baseline/sentiment engine. A CART trained on the same act-stream is a
**second, lossy, model of the same thing**. It is a *compression* of the fold into split
thresholds and leaf distributions. The moment you have two representations of a node's
nature — the exact fold and a learned tree approximating it — they **drift**, and a node
whose affordances are weighted by the fold but selected by a tree that *approximates* the
fold is a node whose behavior coheres with *no single interiority*. That is **W3 verbatim**
("a set of behaviors each drawn from coarse summaries may cohere with no single rich
interiority — incoherent, which reads as constructed"). The CART is a fidelity cut on a
representation that was already full-fidelity. **Never compress the fold; the fold is the
person.**

### 3c. So the seeded policy is NOT a learned model at all. It is a stateless sampler.

The correct seeded policy holds **no learned parameters of its own**. All of *n*'s
individuality lives in NodeState (the fold) and flows into PROPENSITY. The policy is the
*tiny, universal, parameter-free* tail end:

```
policy.choose(AFFORD, PROPENSITY, STATE, s, rng):
    # PROPENSITY is already shaped by the full fold. The policy adds nothing learned.
    temperature = decisiveness(STATE)          # NT-derived: low GABA / high NE -> sharper; depression -> flatter
    weights = softmax(PROPENSITY / temperature)
    return weightedPick(AFFORD, weights, rng)   # one rng draw
```

The policy is **the same for every NPC**. The differences between NPCs are *entirely* in
PROPENSITY and `temperature`, which are *entirely* derived from each node's own fold. This
is the only design that keeps "the character has their own cause" (CLAUDE.md, W9) *and*
"never compress the fold" (W3) *and* "human-vs-seeded is the only difference" — because the
human, too, is choosing within affordances shaped by an identical propensity computation;
the human just supplies the residual pick that the seeded node draws from `rng`.

### 3d. Then there is no bootstrap problem — and no t=0 draw is needed for the policy.

Because the policy carries no learned state, **it has nothing to bootstrap.** At a node's
birth, its act-stream is empty, so NodeState = `seedAxiom(n)` — the genetic/constitutional
givens. But `seedAxiom` is only *drawn acausally for t=0 nodes* (§11B); a node *born* on the
forward pass gets its seed axiom as a **forward-caused draw conditioned on its parents'
committed acts** (conception is an act; the child's constitutional givens are the
forward-caused consequence of two parents' genetic states — itself a fold input, not a fresh
population draw). A newborn has thin *affordances* (an infant can cry, root, sleep) and a
propensity dominated by its axiom, and the *same parameter-free policy* samples them. The
policy works identically at age 0 and age 80; only the fold beneath it has grown.

**So: the per-individual online CART was a trap, but a productive one.** It is *not* W9
(it's genuinely individual, not population). It is *W3* (it compresses the already-complete
fold into a lossy learned model, reintroducing the incoherence the fold was built to avoid).
The escape is to drop learning entirely from the policy: the policy is a stateless sampler;
all individuality is the fold; bootstrapping is a non-problem because there is nothing to
bootstrap. The only acausal draw remaining is the t=0 seed-axiom population (§11B) — exactly
where the doc already licenses it — plus forward-caused conception draws thereafter.

---

## 4. How coherence-into-a-self emerges

A "self" is not stored and not learned. It is the **trajectory of the fold under a
consistent sampler**. Because every act *n* emits becomes an input to *n*'s own next fold
(step 5 → step 1), the node's nature is **autocorrelated over time**: today's acts shift NT
baselines and sentiments that shape tomorrow's propensity, which shapes tomorrow's acts.
This positive-feedback-with-inertia (the `effectiveInertia()` per-character drift damping
already in the engine) is what makes a person *recognizably the same person* day to day
while still capable of change. Coherence is **emergent from the recurrence**, not enforced
by a coherence model. This is CLAUDE.md's "emergence over flags" and "state changes through
gradual drift, not snaps" applied to selfhood.

Critically, coherence is *cheaper* and *more real* than any learned-self representation,
because it is the same mechanism that already produces the protagonist's continuity. We get
NPC selfhood for free the moment we run the protagonist's own state engine on other nodes.

---

## 5. Interaction with dynamic NPC resolution (never zero)

The doc forbids zero-resolution NPCs but the GUARD (§2, lines 103–113) is emphatic:
**resolution = COVERAGE, never FIDELITY.** This candidate respects that exactly:

- **Coverage, not fidelity, is the dial.** A close NPC has `emitAct` run *often* (every
  sim step they share with the protagonist or each other). A drifted-away NPC has `emitAct`
  run *rarely* (only at sparse contact moments). Both run the *identical* full-fidelity
  pipeline when they run at all. There is no thin-NPC code path.
- **Lazy coverage via the fold's locality.** NodeState only needs to be recomputed up to the
  moment a node *acts or is acted upon*. Between contacts, a node's fold is not advanced step-
  by-step; it is advanced *lazily* the next time it is touched, by folding the (sparse)
  intervening acts that involved it. Because the fold is "derived from a start timestamp,
  never a stored counter" (CLAUDE.md), a node dormant for ten sim-years costs nothing until
  re-touched, then costs one fold over its few intervening acts. This is the *only*
  legitimate economy (§3: laziness in coverage).
- **Resolution is reversible and continuous.** A coworker who becomes a friend simply gets
  `emitAct` invoked more often (richer coverage of their stream); a friend who drifts gets it
  less. No re-instantiation, no archetype tag, no "promote to high-res." The same node, more
  or less frequently exercised.

The floor is never zero because *even a one-scene stranger runs the full pipeline once* —
their single act is forward-caused from a real (if sparse) fold, not from a prop table.

---

## 6. Confronting the verb/affordance ontology (where thinness re-enters — §11C / candidate-primitive §8)

The fidelity of this whole scheme rides on AFFORD and `applyAct`. If the affordance
enumerator only knows ~50 verbs, every generated person — protagonist included — is thin,
because thinness re-enters "by the back door" (§11C). This is the *real* hard part this
candidate inherits, and the recursive frame neither solves nor worsens it: it is the same
verb ontology for everyone, so improving it improves all agents at once (a virtue — one
surface to deepen, not two). But it must be named as the load-bearing open sub-problem:
**the apply-rule/verb ontology must be rich enough that the act-stream of a fully-simulated
80-year life is not visibly periodic.** This is *not* an emitter question; it is an
ontology-coverage question, and it is where build-time LLM texture (§11D) legitimately
enters — to paint the *particulars* of each committed act (which dish, which words), never
to choose the act.

---

## 7. COMPUTE PROFILE

The doc is explicit (§11A line 718, §11C, Settled-vs-Open) that this cost **must be
measured, not assumed**, and that the emitter and the cost are *one question*. Honest
accounting:

### 7a. Per-agent-per-act cost

`emitAct` = fold-advance (1) + affordance enum (2) + propensity (3) + one weighted pick (4)
+ log append (5).

- The **fold-advance** is not a from-t=0 recompute per act in live play — it is incremental:
  apply the *new* acts since this node was last folded. In steady state that is O(acts since
  last touch), typically O(1)–O(few). **Replay** is cold: O(total acts touching n). So
  per-act live cost ≈ a handful of NT/baseline/sentiment updates (the engine already does
  this for the protagonist each step — call it the unit cost `U`, empirically ~tens of µs in
  the current single-agent loop).
- Affordance enum + propensity: O(|AFFORD|), bounded by the verb ontology and present-agents
  count. Call it ~|AFFORD|·c, |AFFORD| likely 10–100.
- Weighted pick: O(|AFFORD|), one rng draw.

**Estimate: per-act cost ≈ U + |AFFORD|·c ≈ low hundreds of µs**, dominated by the
NT/baseline fold-advance — the same code that already runs per protagonist step. This is a
*falsifiable* claim (§7d).

### 7b. Whole-population forward-sim from t=0 over decades — the honest scaling

This is the number the doc keeps flagging as unmeasured. Be brutal:

- Let `A` = number of agents ever *covered* (NOT the latent population — coverage, §3). For
  one protagonist's life this is the social closure actually touched: family, schools,
  workplaces, neighbors, one-scene strangers. Plausibly `A` ∈ [10³, 10⁵] over a lifetime,
  growing with play.
- Let `r̄` = mean acts-per-agent over the covered span. A *closely-covered* agent
  (protagonist, parents) emits perhaps 10–100 acts/day; a *sparsely-covered* one emits
  acts only at contact, maybe 10⁰–10¹ over the whole game. Coverage weighting means total
  acts `≈ Σ_a r_a` is dominated by the few high-coverage agents, **not** by A. This is the
  crux of tractability: **cost scales with total COVERED acts `T_acts = Σ_a r_a`, not with
  A·decades.**
- **Total forward-sim cost ≈ T_acts · (per-act cost).** If T_acts is dominated by, say, 5–50
  high-coverage agents at 10–100 acts/day over ~30 in-game years of *materialized* history
  (most of which is laid down lazily, not minute-by-minute), T_acts is plausibly 10⁶–10⁸
  acts. At ~hundreds of µs/act → **seconds to hours of build/cover time**, front-loaded at
  chargen (running the world up to the present, §2) and amortized thereafter.

**What dominates:** the high-coverage agents' fold-advances over densely-materialized
stretches (childhood of the protagonist and their parents). The latent 8 billion contribute
*nothing* — they are never covered. The danger number is **how densely the past must be
materialized**: if "running the world up to the present" requires minute-resolution acts for
the protagonist's whole childhood, T_acts explodes; if coarse-time-step (§2: "minutes in the
present, life-phases in the past") keeps past acts sparse-but-whole, it stays bounded. **The
single biggest cost lever is past time-resolution × number of high-coverage agents**, and it
is *not* the emitter mechanism — it is the coverage policy feeding it.

### 7c. Why this candidate is *cheaper* than alternatives at equal fidelity

Because the policy is parameter-free and carries no per-NPC learned model, there is **no
per-NPC training cost, no model storage, no model-update cost** — the dominant cost of a
per-individual-CART design (3b). The only per-NPC state is the fold accumulator (which the
engine already maintains for the protagonist). This frame minimizes the marginal cost of
adding an agent to *exactly* the engine's existing per-agent state. That is the strongest
quantitative argument for the recursive frame.

### 7d. CONCRETE measurement spike (instrument what, falsify what)

**Minimal spike (build, ~1–2 days):** generalize the current single-protagonist tick loop to
take a *list* of nodes, each with a fold accumulator and the parameter-free policy in slot 4
(the human slot stubbed by the same sampler). No new prose, no LLM, no UI. Run N agents in a
shared toy world forward for D simulated days at step size Δ.

**Instrument:**
1. Wall-clock µs **per `emitAct`**, broken out by stage (fold-advance / afford / propensity /
   pick). Confirms 7a and reveals which stage dominates.
2. **T_acts as a function of (N, coverage policy, Δ)** — the act-count is the real cost
   driver (7b), so measure it directly rather than wall-clock alone (wall-clock is
   machine-bound; act-count is portable).
3. **Fold-advance cost vs. acts-since-last-touch** — confirm it is linear in intervening
   acts and ~O(1) in steady close-contact, not O(total history). This is the load-bearing
   incrementality claim.
4. **Determinism check:** run twice with the same master seed; assert identical act-logs
   (byte-equal). Falsifies any hidden Math.random/Date.now leak in the multi-agent path.
5. **Coherence proxy (cheap, automatable):** for one agent over D days, measure
   autocorrelation of the fold's NT vector and the act-distribution's entropy over time. A
   *self* should show high day-to-day autocorrelation (recognizably same person) with
   non-degenerate entropy (not stuck on one act). Flat-or-random falsifies §4's emergence
   claim *before* any human reads prose.

**Falsification numbers (pre-registered, so we don't move the goalposts):**
- If per-`emitAct` > ~1 ms median on commodity hardware, the "fold-advance is cheap" premise
  is wrong → the engine's per-step cost must be profiled and cut before this scales.
- If T_acts grows **super-linearly in N** at fixed coverage policy (i.e. agents interacting
  blows up act-count combinatorially), the coverage model is broken → contact-graph sparsity
  must be enforced, or the close-contact set must be capped by the affordance enumerator
  (only co-present agents can act on each other).
- If materializing the protagonist's childhood at the chosen past-Δ yields T_acts that puts
  chargen wall-clock over ~tens of seconds, past time-resolution must be coarsened (§2
  life-phase steps) until it fits — and we learn the *real* coverage budget empirically.
- If the coherence autocorrelation is indistinguishable from a memoryless sampler, the
  propensity→fold feedback (§4) is too weak → inertia/baseline coupling needs strengthening,
  and selfhood is NOT emerging for free.

This spike measures the exact quantity the doc says is unmeasured (forward-sim cost = emitter
cost) and ties each number to a design claim that it can falsify. It needs no LLM, no prose,
and no chargen — just the generalized tick loop and a toy world.

---

## 8. SINGLE BIGGEST WEAKNESS

The whole candidate stakes everything on **PROPENSITY being rich enough to carry all
behavioral individuality with a parameter-free policy on top.** If the NT/baseline/sentiment
fold does *not* in fact determine a sufficiently expressive distribution over affordances —
if real behavioral variation between people is *not* recoverable from "current NT state +
sentiments + affordances" — then the parameter-free sampler produces interchangeable agents
that differ only in mood, not in *character*, and the whole "human-vs-seeded is the only
difference" claim collapses into "everyone is the same shallow agent at different NT
setpoints." The design *moves* the hard problem out of the emitter (good — it is no longer
W9/CART) and *into the propensity function*, which is the un-designed term here:
`propensity(a | STATE, s)` is asserted, not specified. That function is now the load-bearing
unknown, and it is plausible it cannot be made expressive enough without smuggling back
exactly the learned per-individual structure §3 rejected — at which point W3 (compressing the
fold) re-threatens. The spike's coherence/entropy instrument (7d-5) is the early-warning for
this, but it cannot prove sufficiency, only catch gross failure.
