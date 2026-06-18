# Candidate: the primitive is the ACT, not the person

**Frame assigned:** *different conceptual primitive.* Don't model "a function that
generates a person." Rebuild the substrate on a different core noun, and show how
forward-caused, full-fidelity people fall out of it.

**Chosen primitive: the ACT — one agent acting on another (or on the world), in
character, at a moment.** This is *not* an invention against the doc; it is §5's
behavior primitive (*"an agent acts on another, in character, given their nature and
the situation"*) taken as the *only* generated object. The move this candidate makes is
to **stop treating "a person" as a thing the generator outputs at all.** A person is
never generated. A person is the **running accumulation of the acts that have touched
their node** — the residue, not the unit. The generator only ever does one thing:
produce the next act.

This dissolves the crux question rather than answering it. "What mechanism produces a
full-fidelity coherent forward-caused *person*?" has no answer because nothing produces
a person. There is no person-generator to validate as genuine-vs-fabrication. There are
only acts, and acts are forward-caused by construction (an act happens *at a moment*,
*from* prior state, *once*). Coherence is not something an evaluator must achieve in one
shot — it is the inevitable consequence of a node having been built by a single causal
stream. You cannot get a Frankenstein person (§4b) because nobody ever *assembles* a
person; a node is only ever *extended* by acts, and an extension that contradicts the
node's accumulated state is causally impossible to emit (the emitter reads that state as
input).

---

## 1. What an Act is (the only generated object)

```
Act = {
  t:        number,        // sim time, monotonic; the act's causal moment
  actor:    NodeId,        // who acts (may be a node, or the WORLD pseudo-node)
  patient:  NodeId | null, // who/what is acted upon
  kind:     ActKind,       // typed verb: speaks-coldly, withholds, strikes,
                           //   feeds, leaves, dies, hires, floods, ... (the
                           //   world's vocabulary — causes, never outcomes)
  params:   {...},         // kind-specific magnitudes (drawn, not set)
  enc:      AffectStamp,   // NT stamp at emission, exactly as events.js already does
  texture:  TextureRef,    // pointer into the frozen texture store (§5); NOT content
}
```

This is **the existing `EventEntry` shape** (`{time, type, data, enc}` in `events.js`),
widened with `actor`/`patient` and a `texture` pointer. The event log is *already* a log
of acts; today only the protagonist's in-run acts are recorded and only the world fires
the rest. The substrate is: **every node emits acts into the same log, from t=0
onward.** Chargen is not a separate generator — it is the log already containing
pre-game acts (exactly §2's "same system," and §730's "deposit the same shape for
pre-game life").

There is no `Person` record that the generator writes. There is a **NodeState**, but it
is *derived* — a left-fold over the act log:

```
NodeState(n, t) = fold(applyAct, seedAxiom(n), acts where (actor=n or patient=n) and t'<t)
```

A node's nature *at time t* is the replay of everything that has acted on it up to t.
This is the project's own deepest pattern — *"How far along is always derived from a
start timestamp, never a stored counter"* and *"event records record events; current
state lives in current state"* — applied to **personhood itself.** A person is `f(acts
- so-far)`, never a stored blob.

---

## 2. Where the nature vector and the texture come from

The doc's required output is *(nature vector for sim math) + (texture for prose)*, and
demands they not diverge into an incoherent person. Under the Act primitive they
**cannot** diverge, because **neither is stored on a person** — both are projections of
the *same* act stream:

- **Nature vector** `N(n,t)` = the structured fold. Each `ActKind` carries a typed
  `apply` rule: `withholds`/`speaks-coldly` from a caregiver during a node's childhood
  window nudges attachment-security and baseline cortisol setpoint; `feeds`/`soothes`
  nudges the other way. These are the same mechanisms the live NT engine already
  uses (`adjustNT`, baseline shifts, sentiment accumulation) — *the past is run through
  the same engine* (§2, §710). The nature vector is literally "what the NT/baseline
  engine computed after replaying this node's acts." No separate person-draw.

- **Texture** = `texture` pointers on the acts, resolved against a **frozen build-time
  store.** The grandmother's dish, the way a parent said your name, the smell of the
  house — each is the *texture of a specific act* (`feeds`, `names`, `enters-house`),
  not a free-floating attribute of a person. Texture is bound to the act that carried
  it, at the act's causal moment.

They cannot diverge because they are two readings of one stream. A texture for "the way
the parent said your name" exists *only* if a `names`/`speaks` act was emitted; and that
same act is what moved the nature vector. There is no surface where a sim-math person and
a prose person are assembled independently and then have to be reconciled. **Coherence is
structural, not achieved.**

---

## 3. How forward-causation holds (and why it's automatic here)

An act has a single `t` and is emitted **from** `NodeState(actor, t)` and
`NodeState(patient, t)` — both of which are folds over acts with `t' < t`. So:

- **Every act is forward-caused by construction.** Its inputs are strictly-earlier
  state. You cannot emit an act from future state — the fold has no access to it.
- **Causation happens once** (§7.1): the act is appended to the log once, at its moment.
  Replay re-folds the same log → identical NodeState → deterministic, but it is not
  *re-causing*; it is recomputing a pure function of a fixed log.
- **t=0 axioms** (§4) are the *seed* of each fold: `seedAxiom(n)` for nodes alive at t=0
  is the one acausal given. Everyone born after t=0 has no seed axiom — their NodeState
  is the fold from empty, meaning **a node literally does not exist until its first act
  (a `born`/`conceived` act emitted by parent nodes).** Birth is an act. This is the
  cleanest possible statement of "everyone after t=0 is forward-caused": a post-t=0 node
  has *no* acausal content at all, not even a seed.

**Prior, never posterior** (§6): the emitter (§4) draws the *next act* as a forward
prior from the actor's nature and situation. It never draws an act *to explain* a future
fact, because at emission time the future does not exist in the log. Posterior-fitting is
not "discouraged" — it is **unsayable**, because the emitter's only inputs are
strictly-past folds. This is §8's self-binding by construction realized at the act level:
the control surface speaks acts-from-causes; it has no token for "make node X turn out
withdrawn."

**Steering** (§8) enters as **bias on the act-emission distribution**, expressed as
*world acts*: the author can make the WORLD pseudo-node more likely to emit
`economic-collapse`, `parent-falls-ill`, `community-rejects` into a region of the graph.
These are causes. Withdrawal may follow from how nodes fold those acts — or may not. The
divergence budget (§8 GUARD 1) bounds total bias on the emission distribution away from
the natural one. No resample-to-taste: the seeded act stream stands.

---

## 4. The emitter — what actually produces the next act (the open frontier, localized)

Everything above is bookkeeping; the live question (§9, §667) is *what produces a
full-fidelity, coherent, forward-caused act.* The Act frame **shrinks** that question
from "generate a whole coherent person" to "generate the next single act of a node whose
entire history you already hold." That is a far smaller, better-posed object.

The emitter is a **typed conditional draw**, in three stages, matching §4's hybrid:

1. **Which kind of act, with what magnitude** — the *behavior-relevant* part. A CART /
   decision tree (§4, reusing habit machinery in the offline-baked regime) conditioned on
   `NodeState(actor,t)` (nature + current NT + sentiments toward patient), `NodeState
   (patient,t)`, and situation (era/class/region/economic state — the cell). Output: a
   **distribution over `(kind, params)`**, sampled with `Timeline.random` (seeded). This
   is the joint conditional draw §4b requires — the tree captures dependence, so acts
   cohere with the node's interiority rather than being marginal draws.

2. **Apply** — the typed `apply` rule folds the act into both nodes' NodeState
   (NT/baseline/sentiment math). Pure, deterministic, no RNG beyond what the draw used.

3. **Texture** — the LLM, **build-time only, frozen** (§4, §243). Given the structured
   act `(kind, params, actor-nature, patient-nature, cell)`, it paints the *specifics*:
   the dish, the phrasing, the smell. Output cached under a key derived from the act's
   structured content + seed, so replay reads the frozen texture, never re-queries.

**Does frozen-LLM-at-leaves survive under this frame? — YES, and more cleanly than under
the person-generator frame.** Here the LLM is provably *not* the control loop, because
the control loop is the emitter's stage-1 tree + the fold, both seeded and structured.
The LLM only ever sees a *single already-decided act* and writes its surface. It cannot
introduce an acausal person (there is no person to introduce — only this act's texture),
cannot move the nature vector (texture is never folded into NodeState), and cannot break
replay (frozen). The crux worry — "is build-time LLM generation the fabrication the
project rejects?" — **dissolves**: the LLM never *generates a person* and never *decides
behavior*, so it is never in the position where fabrication-vs-simulation is even a
question. It is doing exactly the sanctioned §4 job (texture on a structured draw) and
nothing more. The thing the doc feared the LLM might secretly be doing (implying a whole
person as a gestalt — W4) is impossible because the unit handed to it is one act, not a
life.

The genuinely-open residue (honestly): **the stage-1 tree must itself be grounded.** A
tree baked from real behavioral priors is the §4 plan; where that grounding data comes
from for arbitrary cells (eras/cultures) is unsolved and is the same open problem the doc
flags at §667. The Act frame does not *solve* the grounding of the behavior model — but
it isolates it to "draw the next act," the smallest possible locus, and keeps the LLM
strictly out of it.

---

## 5. Why this avoids thinness (W2/W3/W4) — the load-bearing claim

- **No person is ever summarized**, because no person is ever *stored*. There is nothing
  to make thin. A node reached for the first time is not "drawn born-whole" (W4) — it
  either *has an act history in the log* (then it is whole, being the full fold) or it
  *doesn't exist yet* (no acts → not reachable forward; a backward reach for it is the L,
  §7).
- **No resolution dial** (W3): the only economy is **whether a stretch of acts gets
  emitted at all** (coverage, §3). A covered stretch emits *full acts* — each with full
  apply-rules and full texture. There is no "coarse act." Coverage is "did the WORLD/node
  emit acts in this region of the graph during this window," a binary per region, never a
  fidelity knob.
- **Coherence across the web** (§4b "across the whole web of people"): because acts are
  *relational* (actor→patient), an act simultaneously updates both nodes' state and is the
  shared interface between them. This is W6's *true* core (causal influence is mediated
  entirely by interactions = finite acts) used *correctly* — not to license a thin person,
  but as the literal substrate: the relationship between two people **is** the set of acts
  between them, at full fidelity, no summary.
- **Coarse-time ≠ coarse-person** (§9, §501): a coarse time-step just means acts are
  emitted at wider `t` spacing in some window. Each emitted act is still whole; the window
  is sparser in *coverage*, not thinner in *fidelity*. Fully consistent with the doc's one
  legitimate time parameter.

---

## 6. The L under the Act frame (§7)

A backward reach for a node never touched by the forward pass = a present cue points at
"grandmother" but no acts with `actor/patient = grandmother` were ever emitted. There is
no forward moment left to emit them into (the causal `t` window is past — §7). The L is:
**retroactively inserting a consistent act-bundle for that node, flagged.** It concedes
causality (these acts were not emitted at their live moment) but not fidelity (the bundle
is full acts with full texture, drawn consistent with everything committed). It is logged
and counted exactly as §7 demands. Mechanics (how to draw a consistent retro-bundle,
frequency bounds) remain §7-OPEN; the frame does not pretend to close them — but it makes
the L's *shape* precise: it is "emit acts out of causal order, marked," not "fabricate a
person."

---

## 7. Buildability / inputs & outputs summary

| | |
|---|---|
| **Inputs** | master seed; t=0 axiom population (full-fidelity acausal givens, §4); cell context (era/class/region/economy as the situation feed); author bias levers expressed as world-act tilts within a divergence budget (§8). |
| **Unit generated** | one **Act** `{t, actor, patient, kind, params, enc, texture}` — never a person. |
| **Nature vector** | `N(n,t)` = deterministic fold of acts over node n via typed `apply` rules (the existing NT/baseline/sentiment engine). Derived, never stored. |
| **Texture** | frozen build-time LLM output keyed to each act's structured content; resolved by pointer at prose time. |
| **Forward-causation** | automatic: every act emitted from strictly-earlier folds; post-t=0 nodes have no acausal seed; causation once, replay re-folds a fixed log. |
| **LLM locus** | leaves only, one act at a time, texture only, frozen. Survives — and is provably out of the control loop. |
| **Reuses today's code** | `events.js` log (the act log already exists in embryo); NT/baseline/sentiment engine as the fold; CART machinery (`habits.js`) as the stage-1 emitter in offline-baked regime; `Timeline.random` for the seeded draw. |

---

## 8. Single biggest weakness (stated honestly)

**The fold's `apply` rules are a second hidden generator, and the frame can smuggle
thinness into them.** I claimed "a person is just the fold of acts," but the *richness of
the resulting person lives entirely in (a) how many distinct `ActKind`s exist and (b) how
expressive each `apply` rule is.* If the `ActKind` vocabulary is small or the apply-rules
are coarse scalar nudges, then the fold of even a dense act stream produces a **low-
dimensional, generic nature vector** — a thin person reached by the back door, exactly
W3's incoherence ("behaviors that cohere with no single rich interiority") relocated from
the person-draw into the type system. The Act frame guarantees *causal* structure and
*coherence-by-construction*, but it does **not** by itself guarantee *fidelity* — fidelity
now rides on the expressiveness of the act ontology and its apply-semantics, which is
unbounded in principle (a real act space is infinite) and must be finite in code. That
finite ontology is where the doc's "realness is unbounded depth" (§3) collides with
implementation, and this candidate relocates the hard problem there rather than
eliminating it. It is a *better-localized* hard problem (one extensible registry of typed
verbs, vs. an opaque whole-person generator) but it is still the place this design could
quietly become thin if the verb set is impoverished.
