# Act-Emitter candidate — THE WORLD OWNS THE ACT-SPACE; THE PERSON ONLY SELECTS

**Frame:** invert who generates. Don't make the agent's internal model synthesize acts ex
nihilo from its nature. Instead the **world state at time `t` presents AFFORDANCES** — the
acts physically/socially available *in this situation* — and the agent's folded nature
(§11A) only **weights and selects** among them via a seeded draw. The generative richness
lives in the world's affordance structure, which is itself forward-caused from t=0. This is
the existing repo pattern made primitive: the present engine already does exactly this —
`UI.render()` enumerates the interactions available *given world state* (who's present, what
objects exist, time of day, money, location), and the player selects one. This candidate
says the past generator is the *same* machine with the selecting policy swapped from
"player" to "the agent's folded state" (§831's "same system, who-drives-the-node is a
parameter").

This document answers §11C: *what mechanism chooses an agent's next act forward, as a
prior?* It is deliberately NOT a CART baked from population data (W9) — the population never
enters the selection at all; selection reads only the actor's own fold and the live world.

---

## 0. The shape of the loop

```
STEP(t):                                   # one forward tick of the multi-agent engine
  for each node n with pending agency at t (resolution-gated, §9 coverage):
    A  = AFFORD(WorldState(t), n)          # the world enumerates afforded acts FOR n
    if A is empty: continue                # no act this tick (most ticks, for most nodes)
    w  = WEIGHT(NodeState(n,t), A)         # the actor's fold scores each afforded act
    a  = seededDraw(w, rng_for(n,t))       # ONE seeded prior draw over the weighted set
    APPLY(a)                               # append act to log; mutate WorldState
  advance t
```

Three named pieces. **AFFORD is owned by the world. WEIGHT is owned by the actor's fold.
APPLY is the ActKind ontology.** The crux §11C names ("what chooses the next act") is split
into a *world half* (what is even possible here) and a *person half* (which of the possible,
this person). Neither half is a population posterior; see §3, §4.

---

## 1. AFFORD — affordances computed from world state (world owns the act-space)

`AFFORD(W, n)` returns the set of acts node `n` *could* perform right now, each as a
**partially-bound act template**: `(kind, patient-slot-or-bound, param-ranges)`. It is a
**pure function of committed world state** — never of `n`'s desires, never of any outcome.

### 1.1 What it reads

The world state `W(t)` is itself a fold of prior acts (every act in APPLY mutates it), so
AFFORD's inputs are all strictly-`<t` — forward-causation is preserved into the affordance
layer, not just the selection layer (this is the key strengthening over a person-generates
emitter: the *option set* is also unsayable-as-posterior because it is a fold over the past).
AFFORD reads:

- **Co-presence.** Which nodes are in `n`'s `locale(t)` (same dwelling, workplace, street,
  bus). Co-presence is itself a world fact produced by prior `moves-to`, `is-born-into`,
  `commutes`, `hospitalized` acts. Most social ActKinds require a patient who is co-present.
- **Relations.** The relational graph (kin, employment, debt, tenancy, friendship) — each
  edge is the residue of prior acts (`marries`, `hires`, `lends-to`, `befriends`). An edge
  *enables* a class of acts (`a parent can discipline; an employer can dismiss; a creditor
  can call the debt`) and *gates* others (you cannot `dismiss` someone you don't employ).
- **Resources & objects.** Money, food, shelter, tools, a phone, a car, medicine — world
  inventories. `feeds` requires food on hand; `pays-rent` requires money ≥ rent; `drives`
  requires a vehicle. This is precisely the present engine's interaction-gating
  (`take_pain_reliever` requires the bottle; `eat_at_work` requires food_service locale).
- **Obligations & schedule.** The scheduled-interrupt queue (CLAUDE.md's alarm/calendar
  model): a shift due, rent due, a court date, a season turning. An obligation *afforded now*
  is "the rent is due today" → affords `pays-rent | misses-rent | asks-extension | flees`.
- **Standing world processes.** Macro acts the WORLD pseudo-node affords *to itself*:
  `economy-contracts`, `epidemic-arrives`, `flood`, `winter-comes`. These are afforded by
  era/geography/economic-cell state (latitude → seasons, §"the world is real"). The WORLD is
  a node whose AFFORD is the menu of circumstance.

### 1.2 Why this is NOT a hidden population posterior in disguise (the central defense)

The W9 trap is a mechanism that has *digested population statistics into a frozen
conditional `P(act | cell)`* and replays the average. AFFORD does none of that:

- AFFORD carries **no probabilities and no statistics at all.** It is a *possibility*
  predicate, not a distribution: "is there food in the house? then `feeds` is afforded."
  There is nothing fitted, nothing learned, nothing averaged. A frozen posterior answers
  *"how likely is this act for this kind of person"*; AFFORD answers *"is this act physically
  reachable from this world state"* — a different type of object (boolean reachability vs.
  fitted likelihood). You cannot extract a population frequency from AFFORD because it never
  saw a population; it saw *this* dwelling's pantry.
- Its inputs are **this one world's committed facts**, a fold over the realized act log —
  not a corpus of many lives. Change the pantry (a prior act emptied it) and the afforded set
  changes deterministically. A CART's leaves do not change when *this* world's pantry empties;
  AFFORD's output does. That responsiveness-to-the-single-realized-history is exactly what a
  frozen posterior lacks and what makes this causal rather than statistical.
- The cell (era/class/region) enters AFFORD **only as physical/legal constraint, never as a
  behavior rate**: in 1890 there is no `texts` afford (no phones exist); under coverture a
  wife has no `signs-contract` afford (legal capacity absent); a day-laborer cell affords
  `seeks-work-at-gate` but not `reviews-quarterly-report`. The cell shapes *what is possible*,
  which is a fact about the world, not a smoothed average of what people did. This is the
  legitimate use of the cell (§4a conditional *plausibility of the situation*) without the
  illegitimate use (a fitted `P(act|cell)`).

The slogan: **AFFORD is a reachability relation over the realized world; a posterior is a
fitted distribution over a population. They are not the same object wearing two hats.**

### 1.3 Why the affordance space is RICH and not a thin hardcoded list (the W3 trap relocated)

The honest danger this frame introduces: if `AFFORD` enumerates from a small hardcoded
menu of ActKinds, the W3 incoherence trap simply moves from the person into the affordance
generator — a thin list of options can never sum to a rich life. Four structural sources of
richness, none of which is "add more enum entries by hand":

1. **Affordances are COMBINATORIAL, not enumerated.** An afforded act is a *template* with a
   patient slot and param ranges, instantiated against the live world: `feeds(patient ∈
   co-present-dependents, amount ∈ [scraps … plenty] bounded by inventory)`. The realized
   option set is `kinds × eligible-patients × param-ranges × relational-modes`. With co-presence,
   the relational graph, inventories and the schedule all varying continuously, the *realized*
   affordance set at any tick is large and never twice identical even from a modest ActKind
   vocabulary. Richness comes from the **cross product against a live world**, not from list
   length. (Compare: the present engine has ~dozens of interaction IDs but the *situated*
   option set the player faces is never the same twice, because money/locale/time/inventory move.)

2. **The ActKind vocabulary is the project's existing verb ontology, extended along
   PHENOMENON axes, not patched per-instance** (CLAUDE.md "model the phenomenon, not a
   convenient instance"). ActKinds are organized by the *interaction dimensions* the sim
   already models — care/harm, give/withhold, approach/withdraw, bind/release, speak/silence,
   labor/rest, acquire/lose — each a gradient (CLAUDE.md "gradients not binaries"), so a kind
   is `(axis, magnitude, target)` not a leaf string. New richness is added by deepening an
   axis's apply-rule and param space, which automatically enriches *every* situation that
   axis can occur in, rather than by appending a one-off `kind`. Thinness is detected and
   fought at the ontology level (§6's audit), exactly where §11C says fidelity rides.

3. **The world keeps moving, so the afforded set is non-stationary** (see §5). Yesterday's
   afford set and today's differ because prior acts changed the world (someone left, money
   ran out, winter came, a child was born → a whole new patient slot exists). The space is
   not a fixed menu re-shown; it is regenerated against a world that the acts themselves keep
   altering. A thin list is static; AFFORD's *output* is dynamic even if the *kind alphabet*
   is finite.

4. **The WORLD pseudo-node affords circumstance**, so formative events that no individual
   chose (a flood, a layoff, a death nearby — §1 "the world is the loom") enter the same way.
   The richest, least-authored events come from the world half of AFFORD, which is the entire
   point of the inversion: the person is a thread; the loom supplies most of the texture of
   what happens *to* them.

**Finiteness is honest and bounded, not hidden.** The ActKind alphabet is finite in code (a
real act space is infinite — `candidate-primitive.md` §245). We do not pretend otherwise.
The claim is that finiteness of the *alphabet* does not imply thinness of the *realized
stream*, because the stream is `alphabet × live-world`, and the live world is itself
full-fidelity and unbounded-in-coverage. The falsifiable version of this claim is in §6
(distinct-situated-option-set count, act-stream entropy).

---

## 2. WEIGHT — how the agent's folded state biases selection (person owns selection only)

`WEIGHT(NodeState(n,t), A)` assigns each afforded act `a ∈ A` a non-negative weight. This is
the *only* place the person enters, and it enters as a **bias over an externally-given
option set**, never as a generator of options. NodeState is the §11A left-fold (NT levels,
baselines, sentiments toward each co-present patient, personality params) — derived, never
drawn, no LLM.

### 2.1 The weighting is a readout of existing sim quantities, not a fitted model

Crucially, WEIGHT does **not** need a learned/baked function. The repo already computes,
for the live protagonist, how appealing/available an action feels given NT state — this is
the "agency on a gradient" and "effects depend on internal state" machinery. WEIGHT
generalizes that to every node:

- **Approach/withdraw axis** weighted by serotonin/NE/cortisol fold: high cortisol/NE
  (threat-primed) up-weights `withdraws`, `lashes-out`, `placates`; down-weights
  `approaches`, `discloses`. This is CLAUDE.md's "high cortisol/NE primes threat response."
- **Care/harm toward a specific patient** weighted by the *sentiment toward that patient*
  (the fold's per-relationship sentiment): entrenched dread toward a parent up-weights
  `avoids`; habituated warmth up-weights `feeds`, `soothes`. Sentiments are asymmetric exactly
  as CLAUDE.md specifies; that asymmetry is inherited free.
- **Engagement/effort** weighted by dopamine/energy fold: exhaustion down-weights
  high-effort afforded acts (the gradient, not a gate — an exhausted parent *can* still
  `disciplines`, just at lower weight and, per APPLY, higher cost).
- **Personality inertia** divides drift exactly as `effectiveInertia()` already does; no new
  parameter.

So WEIGHT is a **pure function of quantities the NT/baseline/sentiment engine already
produces from the fold.** No CART, no population data, no training. It is the same scoring
the present engine implicitly does when it decides which options to surface and how they
read — lifted to a probability weight and applied to every node.

### 2.2 The seeded draw, and why it is a PRIOR not a posterior

`a = seededDraw(softmax(w / temperature), rng_for(n,t))`. One `Timeline.random`-stream draw
(the `rng` mechanical stream — selection affects world state, so it is mechanical, not
cosmetic). Temperature is a per-node trait from the fold (impulsivity ↑ temperature →
flatter, more surprising draws; rigidity ↓ temperature → near-argmax habit). Determinism:
same seed + same log ⇒ same draw on replay (cold-recompute, §11A).

This is a **prior** in the precise §6 sense: WEIGHT's inputs are `NodeState(n,t)` (fold over
acts `<t`) and `A` (fold over world acts `<t`). **There is no field for a demanded outcome
anywhere in the signature** — this is the §11E "UNSAYABLE type guard" applied to selection:
`WEIGHT: (PastFold, AffordedSet) → Weights`, no descendant, no future fact, no target. You
cannot weight `withdraws` *because the protagonist must turn out withdrawn*, because the
type carries no slot for "must turn out." Posterior-fitting is a type error, not a
forbidden practice. Steering (§8) enters only by biasing the **WORLD node's** affordances
(make `economy-contracts` afforded/weighted more often in a region) and/or a global
temperature/axis bias bounded by the divergence budget — *expressed as causes, in the world
half*, never as a clamp on a person's outcome.

### 2.3 Why selection-only avoids the W3 incoherence trap (coherence emerges — §3)

A person-generates-acts emitter risks W3: each act drawn locally-plausibly, but the stream
summing to no unifying self. Selection-from-a-shared-world structurally resists this for
two reasons developed in §3.

---

## 3. How coherence emerges (no coherence is *imposed*; it is structural)

Coherence is the property §11C/W3 most threaten. Three structural sources, none of which is
a global consistency check (a check would be a posterior gate, W11):

1. **One fold, one body, one situation.** Every weight at tick `t` is read from the *same*
   `NodeState(n,t)` — a single integrated fold, not per-axis independent draws. A person
   cannot weight `lashes-out` from one sub-self and `soothes` from another in the same tick,
   because both weights come from the one fold's current NT/sentiment vector. This is the §4b
   "joint coherence / not independent marginals" requirement satisfied *dynamically*: the
   fold IS the joint state, so every selection is automatically jointly-conditioned. W3's
   "behaviors cohere with no single interiority" is impossible when all behaviors are read
   off one interiority.

2. **Acts feed back into the fold (the loop closes).** APPLY appends the chosen act; that act
   is in the patient's *and* the actor's future fold. A node that `withdraws` today shifts its
   own baseline/sentiment slightly, which up-weights `withdraws` tomorrow (habituation) — a
   self-reinforcing trajectory, i.e. *character*. Coherence-over-time emerges as path
   dependence in the fold, exactly the way a real disposition consolidates. This is the
   project's own "habits emerge from observed play" (CART learns state→action from a node's
   own realized acts) — but note: that habit-learning is *online from this node's own stream*,
   not baked from population data, so it is NOT W9. (If we later add a per-node online habit
   tree it learns from *this node's* acts only; it is a memoized fold, not a population
   posterior. We do not need it for v1 — WEIGHT alone suffices.)

3. **The world constrains the option set continuously**, so a person's stream stays coherent
   with their *circumstances* (you cannot `dismisses-employee` if you were never afforded
   `hires` because you're a tenant farmer) — coherence between a life and its world, the §4b
   "coherence across the whole web" requirement, comes free because everyone selects from the
   same shared committed world.

Coherence is therefore **emergent and structural** (one fold + feedback + shared world), not
achieved by a validator. There is no place where an incoherent person could be assembled and
need reconciling — the same property the primitive candidate claims, but here additionally
the *option set* is shared-world-constrained, tightening web-level coherence.

---

## 4. Where ActKind and apply-rules sit

- **ActKind ontology** is shared by AFFORD and APPLY (one alphabet, organized by phenomenon
  axes — §1.3 point 2). AFFORD decides *which kinds are reachable*; APPLY decides *what each
  kind does to the world and the fold*.
- **APPLY(a)** does two things, both already in the engine: (i) **mutate WorldState** —
  `feeds` decrements food inventory and updates the patient's nourishment; `moves-to` changes
  co-presence; `dies` removes a node and its affordances, opens grief affordances in others;
  `gives-birth` instantiates a new node (its fold starts empty — §11A "a node does not exist
  until its first act"). (ii) **stamp the affect/NT delta** (`enc`), which is what makes the
  act show up in the patient's and actor's future fold — the `adjustNT`/baseline/sentiment
  mechanisms (`candidate-primitive.md` §2). Apply-rules are where fidelity rides
  (`candidate-primitive.md` §237); thinness is fought here and in the AFFORD alphabet, audited
  per §6.
- **Texture** is the §11D independent forward draw conditioned on the laid-down act — a
  `texture` pointer on the act, resolved against the frozen build-time store, "must not
  contradict N." Unchanged by this candidate; orthogonal to the emitter.
- **The L** (§7, §11E) is untouched: a distinct backward operator, not part of STEP/AFFORD.

---

## 5. How novelty / non-repetition arise

CLAUDE.md "no text reuse as a bandaid" and "there is no single path" demand non-repetition
without an anti-repeat hack. It comes free:

- **The world keeps changing** (§1.3 point 3). AFFORD's output is a fold over an
  ever-mutating world; the same *kind* recurs but its situated instance (patient, params,
  co-present others, resource level, season) differs, so the realized act differs. Repetition
  in the *kind* alphabet is legitimate (a recurring routine, a repeated sound — the sanctioned
  case); repetition in the *situated act* is vanishingly unlikely because the world state that
  AFFORD reads is essentially never identical twice.
- **Path dependence** (§3 point 2) means the weighting drifts, so even identical afforded
  sets get drawn differently over time as the fold evolves.
- **The seeded draw** supplies genuine stochastic variation within the weighted set, so two
  nodes in identical situations with identical folds still diverge (different `rng_for(n,t)`
  substreams), giving the "there is no single path" property — same need, different solution
  per character, without authoring the branches.

---

## 6. COMPUTE PROFILE and how to MEASURE tractability

### 6.1 Per-act cost (one node, one act-emission)

| stage | work | dominant term |
|---|---|---|
| `NodeState(n,t)` fold | incremental accumulator in steady state; cold-recompute on replay = O(acts touching n) | **replay cost; live cost O(1) amortized** |
| `AFFORD(W,n)` | scan co-present nodes (k) × applicable ActKinds (m), check resource/relation/schedule gates | **O(k·m)**, k = co-presence degree (small, ~1–20), m = alphabet (~10²) |
| `WEIGHT(·,A)` | read fold quantities, score |A| afforded templates | O(|A|), |A| = afforded-set size (tens–hundreds) |
| `seededDraw` | one softmax + one PRNG call | O(|A|) |
| `APPLY(a)` | mutate world fields + stamp NT delta | O(1) per affected node |

**Per-act cost is dominated by AFFORD's `O(k·m)` co-presence×alphabet scan** and is small
and bounded. The expensive thing is NOT a single act — it is the **forward maintenance of
WorldState across the whole population over decades** (§11C: "the same open question wearing
two hats").

### 6.2 Forward-maintenance cost across a population over decades

The genuine cost driver. Let:
- `N` = live node count under coverage (NOT the whole population — only nodes the run
  actually exercises, §3 lazy coverage). For a single protagonist's reachable social web over
  a lifetime this is plausibly 10²–10⁴, not 10⁹.
- `T` = ticks over the simulated span. At adaptive resolution (most ticks emit no act for
  most nodes — §0 "empty AFFORD: continue"), the *active* tick count per node is far below
  wall-clock granularity. Decades at, say, event-resolution (a handful of meaningful acts per
  node per day, most nodes mostly idle) gives `acts_total ≈ N · ā` where `ā` = lifetime acts
  per node (10³–10⁵).
- **Total forward cost ≈ `acts_total · (cost of AFFORD+WEIGHT+APPLY per act)` = O(N · ā ·
  k · m).**

**What dominates:** (a) the **co-presence query** `k` — if `locale(t)` membership is
recomputed by scanning all nodes it becomes O(N) per act → O(N²·ā) total, the blow-up risk;
fix with a maintained spatial/locale index so co-presence is O(k). (b) **affordance
re-enumeration** every tick even when nothing changed — fix with **dirty-flagging**: cache a
node's afforded set, invalidate only when a relevant world fact it depends on changes
(co-presence in/out, inventory crosses a gate, schedule fires). With both, total cost is
roughly **O(acts_total · k · m)** — linear in realized acts, which is the irreducible floor
(you must at least touch every act you generate).

### 6.3 The minimal spike (concrete, falsifiable)

Goal: falsify the "forward-sim is intractable" premise (§9/§11C "never measured"). Build the
**smallest real version** and instrument it.

**Spike:** a headless harness — extend `serve.js`/the engine — that runs STEP (§0) over a
**closed dwelling of 5 nodes** (two parents, two children, one grandparent) for **30
simulated years** at event resolution, ActKind alphabet ≈ 20 kinds across the core axes,
AFFORD reading only co-presence + a 5-item resource inventory + a simple schedule, WEIGHT
reading the existing NT/sentiment fold, no texture/LLM. No player. Pure forward sim from a
hand-set t=0 axiom for the 5 nodes.

**Instrument (emit as structured counters, write to an artifact, do not eyeball):**
1. **acts_total** and **acts/node/simyear** — is the stream the right *density* (target band
   from real life: a few formative + many mundane acts/day; falsify if it emits ~0 or
   explodes to thousands/day).
2. **wall-time per simyear** and **wall-time per act** — the tractability number. Project to
   N=10³ web × 80 yr: `proj = (wall/act) · N_proj · ā`. **Falsification:** if `proj` exceeds
   the budget for a chargen/backfill pass (say > a few seconds for a single protagonist's web,
   or > minutes for the deepest coverage), the linear-cost claim is refuted and AFFORD/WEIGHT
   must be cheapened or coverage tightened.
3. **distinct-situated-option-sets** = count of unique `AFFORD` outputs over the run ÷
   total AFFORD calls. **Falsification of the "not a thin list" claim (§1.3):** if this ratio
   is near 1/(small constant) — i.e. the same handful of option sets recur — the affordance
   space IS thin and the W3 trap has relocated here. Target: high diversity that grows with
   world-state churn.
4. **act-stream entropy** per node (Shannon over realized `(kind,patient)` pairs) and
   **kind-coverage** (fraction of the alphabet ever afforded/selected). **Falsification:** if
   entropy collapses (one node spams one kind) or coverage is tiny (most kinds never
   reachable), either WEIGHT temperature or AFFORD richness is broken.
5. **fold-coherence probe:** spot-check that a node's NT/sentiment trajectory is *monotone-ish
   under repeated same-valence acts* (no oscillation/incoherence) — cheap proxy for "coheres
   as one self."
6. **co-presence query cost** specifically (calls × avg scan size) to confirm it is O(k) not
   O(N) — the §6.2 blow-up guard. **Falsification:** if it scales with N, the index is missing.

**Decision rule:** the candidate is *tractable* iff (2) projects within budget under the
maintained-index + dirty-flag implementation AND (3)/(4) clear the thinness bars. If (2)
fails but (3)/(4) pass, the mechanism is *right but too slow* → optimize coverage/indexing,
not fidelity (W3 forbidden). If (3)/(4) fail, the **ActKind alphabet / apply-rule expressiveness**
is the culprit (`candidate-primitive.md` §237), not the selection mechanism.

---

## 7. The single biggest weakness

**AFFORD's reachability gates and the ActKind alphabet must be authored, and that authoring
is where thinness can silently re-enter** — §1.3 argues richness comes from `alphabet ×
live-world`, but if the alphabet is small or the gates are crude (binary "food present?"
rather than the full gradient of scarcity), the cross-product is rich in *count* yet flat in
*kind*, and a flat kind-space produces lives that vary in incident but not in texture — W3
diluted rather than defeated. The defense (phenomenon-axis organization + the §6.3 entropy/
distinct-option-set instrumentation) detects this but does not by itself supply the
expressiveness; the alphabet and apply-rules remain hand-built, full-fidelity authoring work
whose adequacy is an empirical question the spike must keep re-checking as the world grows.
This is the same fidelity-rides-on-the-ontology caveat §11C names, now located precisely at
the AFFORD/APPLY alphabet rather than dissolved.
