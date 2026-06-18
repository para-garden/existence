# Candidate: COMPUTE-FIRST — measure the envelope, let the budget choose the emitter

**Frame.** Start from the question the whole doc pivots on and refuses to answer: *is
forward-sim from t=0 tractable AT ALL?* The META-TRAP (§10) names the disease — every wrong
turn was driven by an *unmeasured* "it's intractable" premise. So this candidate does not
begin with an emitter and ask what it costs. It begins with the cost envelope, computes it
in orders of magnitude under explicit assumptions, lets the budget dictate the *cheapest
non-thin emitter form*, and ends with a concrete spike that produces the real number.

Three things below, in order of importance: (1) the cost MODEL (arithmetic), (2) the
emitter the budget implies, (3) the SPIKE SPEC that breaks the deadlock.

All constraints honored: forward-caused prior, outcome unsayable, causes-only conditioning,
no population-CART (W9), no LLM in the control loop (§11D), deterministic seeded PRNG,
no fidelity dial / no LOD (W3) — coverage laziness only (§3, §11).

---

## PART 1 — THE COST MODEL (do the arithmetic, don't feel it)

### 1.1 The unit cost anchor — what one "act fold step" actually costs, measured against shipped code

The fold (§11A) is the **existing NT/baseline/sentiment engine** replaying acts. I read the
shipped engine to anchor the unit cost rather than guess it:

- `js/state.js` `ntRates` has **~28 NT systems** (serotonin … substance_p). The drift loop
  (`state.js` ~line 10414) iterates every key: per key a `biologicalJitter` (one `Math.sin`),
  a target-fn call, a `Math.exp` decay, a clamp. Call it **~5–10 float ops + 2 transcendentals
  per system** → **~28 systems × ~10 ops ≈ 300 ops per NT drift step**, plus sentiment
  cross-reduction and baseline EMA (another few hundred ops). Round **one fold step ≈ 10³
  floating ops, no allocation, no RNG beyond a couple of `Timeline.random` draws.**

A modern JS engine (Bun/V8, JIT, monomorphic) does **~10⁸–10⁹ simple float ops/sec** in a
tight loop. At 10³ ops/step that is a **napkin ceiling of ~10⁵–10⁶ fold-steps/sec**. This
is the anchor every downstream number rides on — and it is the FIRST thing the spike must
confirm, because "act fold step" in the *target* engine is richer than today's player loop
(it adds an emitter call + an event-log append + possibly a texture cache lookup). Assume the
emitter dominates: budget **~10⁴–10⁵ acts/sec** as the conservative planning figure until measured.

> **Key sensitivity.** Everything below scales linearly in (acts) × (cost/act). The act
> count we can bound tightly from coverage. The cost/act is the *unmeasured* term — it is
> set by the emitter (§11C), which is exactly why §11C says the emitter and the compute cost
> are one question. The spike measures cost/act directly.

### 1.2 How many DISTINCT people does one life actually TOUCH? (coverage bound, §3/§11)

Coverage laziness is the load-bearing economy: we generate a person ONLY when the forward
pass touches them, and only the *stretches* of their life that intersect the protagonist's
causal cone. So the population is **not** "everyone alive for 80 years" — it is the
**touch-set**. Bound it explicitly.

Empirical anchor for the *active* social network size: Dunbar's number, ~150 stable
relationships at any time (Dunbar 1992; sympathy group ~50, support clique ~15 — these are
the widely-cited figures, exact PMIDs **unverified**, flagged per repo rule). Over a *whole
life* the cumulative distinct-people-met figure is larger — order **10³–10⁴** acquaintances
across a lifetime (commonly cited "you'll meet ~10,000 people," **unverified folk figure**;
treat as an order-of-magnitude prior, not a citation). But "met" ≠ "causally touches the
protagonist's formation enough to need full-fidelity simulation." Decompose by tier:

| tier | who | distinct count | rationale (coverage, not fidelity) |
|---|---|---|---|
| Inner | parents, siblings, partner, children, closest 2–3 | **~8** | the high-density formative actors; simulated densely over decades |
| Extended kin | grandparents, aunts/uncles, cousins reached for | **~20** | most never *act on* the protagonist; covered only where they touch |
| Ancestry (forward-caused, §3) | each parent is the fold of THEIR acts → their formative actors | **~8 per ancestor × ~6 ancestors deep enough to matter ≈ 50** | recursion is infinite but COVERAGE is finite — only ancestors whose acts reach the protagonist's cone are laid down |
| Peers / friends over life | school, work, recurring social | **~50–150** | most covered thinly-in-TIME (a few acts each), not thinly-in-fidelity |
| Recurring semi-strangers | the regular barista, a neighbor | **~30** | continuity-only; few acts each |
| One-scene strangers | bus, shop | **~hundreds, but ~1 act each** | full-fidelity person, near-zero act-stream — coverage makes these nearly free |

**Distinct fully-touched people for one protagonist life: order 10²–10³.** Take **~300** as
the central estimate (sum of tiers, conservatively rounded up). The infinite ancestral cone
collapses to ~50 because coverage only lays down ancestors whose acts actually propagate
forward into the protagonist's observed life — the rest are never touched and never exist.

> This is the single most important result of the cost model: **coverage turns "infinite"
> into "~300 people."** If the spike shows the touch-set is actually 10⁴+, the whole
> tractability case weakens — so the spike must instrument *people materialized*, not assume it.

### 1.3 How many ACTS per person, over what time granularity?

An act is "an agent acts on another, in character" (§5). NOT every minute of 80 years — that
would be ~4×10⁷ minutes and is the wrong unit. Acts are **events**, laid down at the
granularity the forward pass exercises (coarse time-step in the deep past is a legitimate
parameter, §9 — coarse-TIME, never coarse-PERSON).

Per-person act counts by how densely they're covered:

- **Inner tier**, ~decades of dense formative interaction, say a few formative acts per week
  during overlap years but coverage only lays down the *causally salient* ones: order **10³–10⁴
  acts each** over the relationship lifetime. Take ~3×10³.
- **Extended/peers**: order **10²** acts each.
- **Strangers**: order **1–10** acts each.

Weighted total acts for one life:

```
inner:        8   × 3,000  = 24,000
extended kin: 20  ×   200  =  4,000
ancestry:     50  ×   500  = 25,000   (each ancestor a partial life: formative stretch only)
peers:        100 ×   150  = 15,000
semi-stranger:30  ×    30  =    900
strangers:    300 ×     3  =    900
                              ------
TOTAL ACTS for one full life ≈ 70,000  →  ROUND TO 10^5 (order of magnitude)
```

**Headline envelope: one full life from t=0 ≈ 10⁵ acts across ~300 people.** Even pushing
every assumption pessimistically (inner-tier 10⁴ acts, ancestry depth doubled) lands at
**~3–5×10⁵ acts — still well under 10⁶.**

### 1.4 The fold-cost envelope

Naive fold cost if every act recomputes every node's full history from scratch (§11A:
"replay = cold recompute"):

```
cost_naive ≈ Σ_node (acts_on_node)²  -- each new act on a node re-folds that node's whole past
```

Worst case for the inner tier: (3×10³)² ≈ 10⁷ fold-steps per inner person × 8 ≈ **10⁸
fold-steps**. At 10⁵ steps/sec that is **~1000 sec** — borderline. **This quadratic is the
real risk, not the act count.** But §11A explicitly sanctions an **incremental accumulator**
(materialize NodeState as you go; cold-recompute only on replay). With incremental folding:

```
cost_incremental ≈ total_acts ≈ 10^5 fold-steps for the LIVE forward pass
```

At the conservative **10⁴ acts/sec** budget: **10⁵ / 10⁴ = ~10 seconds of wall-clock for one
full life from t=0.** At the optimistic 10⁵ acts/sec: **~1 second.** Cold-replay (determinism
check) pays the quadratic once: ~10⁸ steps ≈ tens of seconds — acceptable for a verification
path, and amortizable by checkpointing the accumulator into the save.

> **VERDICT OF THE MODEL: TRACTABLE** — *conditional on two things the spike must verify:*
> (1) cost/act stays ≈10³ ops (emitter doesn't blow it up — the live risk), and
> (2) folding is INCREMENTAL, not naive-quadratic, on the live pass.
> One life from t=0 lands at **~10⁵ acts / ~300 people / order-1–10 seconds wall-clock.**
> The "intractable" premise that drove §10's wrong turns is, on this napkin, **false** —
> but it is a napkin until the spike runs. The biggest uncertainty is cost/act (§3.4).

### 1.5 Why "intractable" was plausible-but-wrong

The intuition that drove the META-TRAP conflated **coverage with fidelity**: imagining
"simulate everyone alive for generations at minute resolution" gives ~10⁹⁺ and panics. The
correct unit is **touched acts** (~10⁵), three to four orders of magnitude smaller, because
coverage never touches most people and never time-steps most minutes. The panic was a
units error. That is precisely the META-TRAP's "the premise was never measured."

---

## PART 2 — THE CHEAPEST NON-THIN EMITTER THE BUDGET IMPLIES

The budget (≈10³ ops/act, no LLM, deterministic, ≥10⁴ acts/sec) **forbids** anything heavy
per act: no neural net forward pass, no LLM, no tree-search, no rejection sampling (W11), no
population-CART lookup owning the act (W9). It demands an emitter that is a **closed-form
weighted draw over a small verb ontology, conditioned on the strictly-past fold.** This is
not a retreat — it is what "non-thin at 10³ ops" geometrically forces. Form:

### 2.1 The emitter as a CONDITIONAL INTENSITY over verbs (a marked point process)

Model each node as emitting acts via a **per-verb hazard / intensity** `λ_v(t)` — the
instantaneous propensity to perform verb `v` on some patient — exactly the structure of a
**marked Hawkes-style point process**, but with intensities **derived from the fold**, not
fit to population data:

```
nextAct(actor, situation, t):
  N = NodeState(actor, t)          // §11A left-fold — STRICTLY past, type-guarded (§11E)
  for each candidate (verb v, patient p) reachable in `situation`:
     λ[v,p] = base(v)                                  // verb's intrinsic rate (causes-only constant)
            * dispositionWeight(v, N)                  // actor nature → propensity (e.g. high NE→threat-response verbs)
            * relationWeight(v, N.sentiment[p])        // sentiment fold toward THIS patient
            * situationGate(v, p, situation)           // affordance: is this verb even available here
            * biasLever(v, era/class/region)           // §8 causes-only author tilt, divergence-budgeted
  draw next (verb,patient,Δt) from the competing-hazards distribution via Timeline.random()
  // outcome is NOT chosen — only the ACT (the cause). Effects follow when the act is folded
  // into the patient's NodeState. Posterior-fitting is unsayable: λ reads only past fold.
```

**Why this is the cheapest non-thin form:**

- **Cost** = (#candidate verbs reachable in situation) × (cost of a weight product) ≈ small
  k (situation bounds reachable verbs to ~10s) × ~10 muls ≈ **~10²–10³ ops/act.** Lands
  exactly in budget. No iteration over population, no search.
- **Non-thin** because fidelity rides on **(a) the verb ontology breadth** and **(b) the
  fold's richness** (§11A) — *not* on a coarse summary of the person. Every act is drawn from
  the full ~28-dim NT/sentiment fold; richness = ontology coverage, the legitimate axis.
  (`candidate-primitive.md` §8 names this exact risk — a thin verb ontology re-imports W2 by
  the back door. The compute frame *agrees*: spend the ontology budget, it is nearly free.)
- **Forward-caused / unsayable** because `λ` is a pure function of the **strictly-past fold**
  N and the situation; there is **no argument for a demanded outcome** (§11A, §11E type-guard).
  The author tilts `biasLever` — a *cause* (era/class), never an outcome — within a divergence
  budget on the intensity field (KL between tilted and natural λ, §8 GUARD 1).
- **Not a population-CART (W9):** `base(v)` and `dispositionWeight` are **structural couplings**
  (NT-state → verb propensity), the same *kind* of hand-derived coupling the shipped NT engine
  already uses (e.g. cortisol → guilt). They are **not** leaves of a tree trained on a
  population corpus; there is no posterior. The character's "own reason" is their fold N. The
  weights are physiology→behavior couplings, derived and documented as approximation debt where
  not yet grounded — *not* a smoothed conditional average over people.
- **Deterministic:** single `Timeline.random()` draw from the competing-hazards CDF. Same seed
  + same fold ⇒ same act. Replay-safe by construction.

### 2.2 Where this differs from the rejected reflexes

| reflex | why this isn't it |
|---|---|
| W9 CART emitter | no tree, no population training corpus, no leaf-posterior; weights are structural NT→verb couplings, character's cause is the fold |
| W11 LLM critic gate | no proposal/reject loop; a single forward hazard draw, no scoring against a typicality model |
| §11D LLM in loop | LLM never runs here; it paints texture build-time-frozen AFTER the act is laid down (§11D), off the control loop |
| W3 LOD | every act drawn from full ~28-dim fold; no coarse-person; "coarse" only ever means coarse-TIME-STEP (fewer acts laid down), never coarse-fidelity |

### 2.3 Honest weakness of the emitter

The hazard weights (`dispositionWeight`, `relationWeight`) are **structural couplings that do
not yet exist** — deriving NT-state → verb-propensity for a real verb ontology is genuine
unbuilt design work, and getting it wrong yields plausible-but-flat behavior (acts that are
individually fine but jointly monotone). This is the same fidelity risk `candidate-primitive.md`
flags, relocated to the weight derivation. The compute frame's contribution: it shows the
*budget is not the constraint* — you can afford a rich ontology and rich couplings; the
constraint is **getting the couplings right**, which is design, not compute.

---

## PART 3 — THE SPIKE (the deliverable that breaks the deadlock)

The point of this candidate. A **stripped forward-sim skeleton with a PLACEHOLDER emitter**,
built to produce ONE real number: wall-clock to fold one life from t=0. It does not need the
real emitter — it needs the real *shape* of the loop (fold + emit + log) so the measured
cost/act is representative.

### 3.1 Smallest version that yields a meaningful number

Minimal viable spike — **`scripts/forward-sim-spike.js`**, standalone Bun script, ~200 LOC:

1. **t=0 axiom population:** draw `P₀` people as flat random NT/sentiment vectors (NOT the
   real joint draw — a placeholder; the spike measures the FORWARD pass, not the t=0 draw).
   Parameterize `P₀ ∈ {8, 50, 300}` to sweep the touch-set size.
2. **Fold:** reuse the **actual shipped NT drift loop** from `state.js` (the ~28-system
   exp-drift) as `applyAct` — this is the load-bearing realism: the unit cost must be the
   *real* fold, not a toy. Wrap it so an act = {actor, patient, verb, Δt} mutates patient's
   NodeState via the drift loop + a sentiment nudge.
3. **Placeholder emitter:** the §2.1 hazard form but with **constant weights** (the structural
   couplings don't exist yet). Reachable-verb count `k` parameterized `∈ {5, 20, 50}` to bound
   the cost/act sensitivity to ontology size. Single `Timeline.random()` draw.
4. **Incremental accumulator** for NodeState (the live-pass path); plus a **cold-replay path**
   that recomputes from the log (the quadratic) to measure the determinism-check cost.
5. **Coverage driver:** a simple forward scheduler that runs each touched person's act-stream
   for their overlap window, lazily materializing a person the first time an act names them as
   patient (this exercises the real coverage mechanic and lets us count people materialized).

### 3.2 What to instrument

| metric | how | why |
|---|---|---|
| **acts/sec** | act counter / wall-clock, `performance.now()` | the core throughput — confirms/falsifies the 10⁴ budget |
| **cost/act (ops proxy)** | wall-clock per act × engine ops/sec estimate, OR `--prof` | validates the ~10³-ops anchor (§1.1) |
| **people materialized** | counter on lazy-materialize | confirms/falsifies the ~300 touch-set (§1.2) |
| **total acts / life** | act counter at completion | confirms/falsifies the ~10⁵ envelope (§1.3) |
| **incremental vs cold fold cost** | wall-clock both paths | confirms incremental ≈ linear, cold ≈ quadratic (§1.4) |
| **wall-clock, one full life t=0→present** | total `performance.now()` | THE headline number |
| **memory / accumulator size** | `process.memoryUsage()` | secondary: does the act log + accumulators fit (10⁵ acts × ~small struct ≈ MBs, fine) |

Sweep `(P₀, k, acts/person)` across the order-of-magnitude ranges above; report the grid, not
one point — the model's whole claim is *order of magnitude*, so the spike must show the curve.

### 3.3 Confirm / falsify thresholds (stated in advance — no post-hoc goalposts)

The model says **TRACTABLE**. Pre-registered decision thresholds for one full life from t=0
(central case P₀≈300, k≈20, ~10⁵ acts):

- **CONFIRM tractable** if wall-clock **≤ ~10 seconds** (≥10⁴ acts/sec) AND people
  materialized **≤ ~10³** AND incremental fold scales **~linearly** in act count. A chargen
  that runs a full causal life in under ~10s (even up to ~60s with a progress beat) is shippable.
- **FALSIFY (intractable as currently shaped)** if wall-clock **≥ ~1000 seconds** (minutes→hours)
  at the central case, OR people materialized **≥ 10⁴⁺** (coverage doesn't bound the population —
  the §1.2 assumption is wrong), OR fold cost is **super-linear** even with the incremental
  accumulator (the quadratic isn't tamed).
- **AMBER (re-design, don't abandon)**: 10–1000 s. Tractable for an offline/build-time chargen
  with a loading screen, not for live in-play forward simulation. Tells us *where* the cost
  lives (cost/act vs people vs quadratic) and which §2 knob to cut — coarser time-step in the
  deep past (legitimate, §9), tighter coverage, cheaper per-verb weight product.

The decisive single number: **acts/sec from the real fold.** If it is ≥10⁴, the model holds
and forward-sim from t=0 is tractable. If it is ≤10², the META-TRAP's premise was *right* and
the whole architecture needs the cost re-confronted honestly — but we will then KNOW, not guess.

### 3.4 The single biggest uncertainty

**cost/act under the REAL emitter, not the placeholder.** The spike's placeholder uses
constant weights; the real emitter (§2.1) evaluates `k` weight-products over reachable verbs,
and the real situation/affordance computation (which verbs are even reachable) is unmodeled
in the spike. If reachable-verb enumeration turns out expensive (e.g. requires scanning the
whole present population for valid patients each act), cost/act could be 10×–100× the anchor,
pushing the central case from ~10s toward the AMBER band. The spike's `k`-sweep brackets this,
but only a spike with the *real* affordance/situation model closes it. This is exactly §11C's
point that the emitter and the cost are the same question — the spike measures the cost of the
*shape*; committing the emitter is what fixes the constant.

---

## Summary

The cost model says **TRACTABLE** at **~10⁵ acts / ~300 people / order-1–10 s** for one life
from t=0 — the "infinite/intractable" premise is a units error (coverage confused with
fidelity). The budget that falls out (~10³ ops/act, deterministic, no LLM/CART) forces the
cheapest non-thin emitter to be a **fold-conditioned competing-hazards verb draw** (a marked
point process with structural NT→verb intensities, not a population posterior). The spike is a
~200-LOC standalone script reusing the real shipped NT drift loop as `applyAct` with a
placeholder hazard emitter, instrumented for acts/sec, people materialized, total acts, and
wall-clock, with pre-registered confirm (≤~10s, ≥10⁴ acts/sec) / falsify (≥~1000s or ≥10⁴
people) thresholds. Biggest uncertainty: cost/act under the *real* emitter's situation/affordance
enumeration, which the spike brackets via a `k`-sweep but cannot fully close without the real
emitter — the §11C "same question, two hats" made concrete.
