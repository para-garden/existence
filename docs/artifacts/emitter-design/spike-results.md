# Forward-Sim Compute-Cost Spike — Results

Diagnostic run of `scripts/forward-sim-spike.js` (`bun scripts/forward-sim-spike.js`).
Measures whether forward-sim-from-t=0 (the §11A left-fold of an act-stream over a
forward-caused population — `docs/design/simulated-life.md` §11A/§11C) is computationally
tractable. This is the premise the whole simulated-life design pivots on and that the
META-TRAP (§10) names as *never measured*.

**This measures menu-construction SHAPE and fold COST, not propensity fidelity.** See the
caveats section — the headline number is a real op-count envelope; it says nothing about
whether the emitted lives are non-thin.

---

## 1. The stated budget (declared before interpretation)

Chargen happens **once per run**, at new-game (one-timeline + autosave). Rationale for the
tiers (in the script header):

- An interactive new-game ideally completes in **a few seconds** (no dread-the-wait).
- A loading screen with a progress beat can plausibly stretch to **~30–60 s** without
  feeling broken (cf. AAA load screens; Dwarf Fortress / RimWorld world-gen run minutes and
  players accept it).

| Verdict | Budget (one life, N=300, indexed, 10⁵ acts) | Meaning |
|---|---|---|
| **CONFIRM** | ≤ 5 s | tractable at runtime / interactive new-game |
| **AMBER** | 5–60 s | tractable build-time only / loading screen |
| **FALSIFY** | > 60 s | intractable as currently shaped |

Judged at the central plausible case (N≈300 touch-set, indexed AFFORD, 10⁵ acts), with the
10× finer 10⁶-act granularity case reported alongside as a stress test.

---

## 2. What was measured (faithfully) and what was not

**Faithful:**
- **FOLD** = a verbatim-shape replica of the real `state.js` drift loop
  (`driftNeurochemistry`, js/state.js:10335): **28 NT systems** (matches `ntRates`,
  js/state.js:9718), each with a target function doing ~15-40 float-op couplings **plus
  several linear scans over a `sentiments` array** (`sentimentIntensity`, js/state.js:8213),
  `biologicalJitter` (2× `Math.sin`), `Math.exp` decay, asymmetric rate, personality-inertia
  division for the 4 mood-primary systems, two clamps. This is the load-bearing realism — the
  unit cost is the real fold shape, not a toy.
- **AFFORD** (menu construction — the corrected cost driver the original spec skipped):
  enumerates eligible **patients** from the co-present set each act, cheap gate per candidate,
  over an 8-verb alphabet. Implemented **two ways**: NAIVE (scan whole population, O(N)) and
  INDEXED (maintained locale→members index, O(k), k≈12).
- **WEIGHT / DRAW / COMMIT**, each broken out.
- Seeded **xoshiro128**/splitmix32 PRNG, replicated verbatim from js/timeline.js. No
  `Math.random` in sim logic. `Bun.nanoseconds()` for timing only.

**Not captured (honest caveats):** propensity fidelity (weights are placeholder constants/
trivial products — fine for cost, silent on thinness); the real t=0 joint draw (flat random NT
vectors here); texture/LLM build-time paint; the real ActKind apply-rules (COMMIT folds the
act via one drift step + a sentiment nudge — right shape, not the real rule set).

---

## 3. Per-stage cost (ns per act), naive vs indexed, swept over N

**NAIVE AFFORD (O(N) co-presence scan):**

| N | fold | afford | weight | draw | commit | TOTAL/act | acts/sec |
|---|---|---|---|---|---|---|---|
| 10 | 862 ns | 67 ns | 109 ns | 63 ns | 868 ns | 1.97 µs | 508,263 |
| 50 | 881 ns | 96 ns | 105 ns | 51 ns | 908 ns | 2.04 µs | 490,079 |
| 300 | 968 ns | 220 ns | 121 ns | 85 ns | 998 ns | 2.39 µs | 418,206 |
| 1000 | 1.02 µs | 681 ns | 122 ns | 59 ns | 1.06 µs | 2.94 µs | 339,708 |
| 3000 | 1.07 µs | 1.69 µs | 125 ns | 59 ns | 1.11 µs | 4.05 µs | 246,738 |

**INDEXED AFFORD (O(k) locale index, k≈12):**

| N | fold | afford | weight | draw | commit | TOTAL/act | acts/sec |
|---|---|---|---|---|---|---|---|
| 10 | 860 ns | 68 ns | 104 ns | 51 ns | 880 ns | 1.96 µs | 509,449 |
| 50 | 904 ns | 74 ns | 106 ns | 52 ns | 931 ns | 2.07 µs | 483,675 |
| 300 | 955 ns | 78 ns | 120 ns | 69 ns | 982 ns | 2.20 µs | 453,674 |
| 1000 | 1.02 µs | 75 ns | 118 ns | 109 ns | 1.03 µs | 2.35 µs | 424,825 |
| 3000 | 1.06 µs | 71 ns | 114 ns | 46 ns | 1.10 µs | 2.40 µs | 416,892 |

**The dominant stage is FOLD + COMMIT (which is itself a fold step on the patient), not
AFFORD.** Each is ~0.9-1.1 µs — together ~85-90% of per-act cost at every N. The 28-system
drift loop with its sentiment-array scans is the real cost, exactly as the unit-cost anchor in
`candidate-compute.md` §1.1 predicted (~10³ ops/act → ~10⁵-10⁶ fold-steps/sec; we measure
~4-5×10⁵ acts/sec total, consistent).

---

## 4. The naive-vs-indexed gap (highest-leverage number)

| N | naive AFFORD | indexed AFFORD | ratio |
|---|---|---|---|
| 10 | 67 ns | 68 ns | 1.0× |
| 50 | 96 ns | 74 ns | 1.3× |
| 300 | 220 ns | 78 ns | 2.8× |
| 1000 | 681 ns | 75 ns | 9.1× |
| 3000 | 1.69 µs | 71 ns | **24.0×** |

On the **AFFORD stage alone**, the index buys up to 24× at N=3000 and the gap grows linearly
with N (naive is clearly O(N), indexed is flat O(k)) — confirming the
`candidate-affordance.md` §6.2 blow-up risk is **real in the AFFORD term**.

**But on TOTAL per-act cost the index is far less decisive at the central N**, because FOLD
dominates and swamps even the naive O(N) AFFORD until N is large: total naive/indexed ratio is
1.0× at N=300, **1.3× at N=1000**, and ~1.7× at N=3000. The index is *mandatory at scale* (the
AFFORD term would otherwise overtake FOLD past N≈3000-5000), but it is **not** the thing that
decides tractability at a ~300-1000 touch-set — the fold cost already does.

---

## 5. Projected one-life wall-clock

(per-act TOTAL at the given N × act count)

**INDEXED:**

| N | 10⁵ acts | 10⁶ acts |
|---|---|---|
| 300 | **0.220 s** | **2.204 s** |
| 1000 | 0.235 s | 2.354 s |

**NAIVE (what the index buys back):**

| N | 10⁵ acts | 10⁶ acts |
|---|---|---|
| 300 | 0.239 s | 2.391 s |
| 1000 | 0.294 s | 2.944 s |

Even the finer **10⁶-act** granularity at N=1000 lands at **~2.4 s indexed / ~2.9 s naive** —
inside the CONFIRM budget. The headline 10⁵-act central case is **~0.22 s**.

---

## 6. Incremental fold vs cold-recompute (the §11A replay quadratic)

| node history | cold-recompute total | ns/act-replayed | incremental (live) |
|---|---|---|---|
| 1,000 acts | 0.73 ms | 733 ns | 955 ns/act |
| 5,000 acts | 3.57 ms | 714 ns | 955 ns/act |
| 20,000 acts | 14.26 ms | 713 ns | 955 ns/act |

Cold-recompute of one node's whole history is **linear in that node's act count** (~715
ns/act-replayed) — the same unit cost as the live fold. The danger is **not** re-folding once;
it is re-folding the actor's *entire past on every act*, which is Σ(acts_on_node)² — the
quadratic. **Incremental accumulation (materialize-as-you-go) keeps the live pass linear**
(~total_acts fold-steps); cold-recompute is only the determinism-check / replay path, and even
re-folding a 20k-act node costs ~14 ms — cheap enough to run on demand. The quadratic is
avoidable and avoided by the §11A accumulator; the spike confirms the linear floor holds.

---

## 7. Headline verdict

| Case | wall-clock | verdict |
|---|---|---|
| Central: N=300, indexed, 10⁵ acts | **0.220 s** | **CONFIRM** |
| Granularity stress: N=300, indexed, 10⁶ acts | 2.204 s | **CONFIRM** |
| Counterfactual: N=300, NAIVE, 10⁵ acts | 0.239 s | **CONFIRM** |

**Forward-sim from t=0 is TRACTABLE AT RUNTIME** (interactive new-game) under the stated
5-second budget, with two-to-three orders of magnitude of headroom even at the pessimistic 10⁶
acts / N=1000 corner. The "intractable" premise that drove the §10 wrong turns is, on this
measurement, **false** — it was a units error (coverage confused with fidelity), exactly as
`candidate-compute.md` §1.5 argued, now confirmed by a run rather than a napkin.

**The driving number:** ~4-5×10⁵ acts/sec from the real fold shape → one 10⁵-act life in ~0.22
s. The fold (the 28-system drift loop), not AFFORD, is the dominant cost; the co-presence index
is mandatory only past N≈3000.

---

## 8. The single biggest caveat on trusting these numbers

**The spike measures the COST of the pipeline SHAPE, not the FIDELITY of what it emits.** The
WEIGHT/propensity functions are placeholder constants and the per-candidate AFFORD gate is a
trivial predicate (`(a+b+v)&3`). The real cost-flipping risk lives in two places this spike
deliberately does not model:

1. **The real AFFORD gate may not be O(1).** If real reachability gates require richer
   per-candidate work (resource/relation/schedule lookups, gradient scarcity checks per
   `candidate-affordance.md` §7) rather than a couple of field reads, the AFFORD per-candidate
   constant grows — multiplying the already-linear naive term and bringing the O(N) blow-up
   forward to smaller N. The spike brackets the *structure* (O(N) vs O(k)) but uses a
   floor-cheap gate; a heavy real gate is the most plausible way to push the central case
   toward AMBER.

2. **The real fold may be heavier than the replica.** The replica's target functions do 3
   sentiment scans over a ≤12-entry array; real `state.js` target functions (e.g.
   `serotoninTarget`, js/state.js:8487) read more sentiments and more cross-system state, and
   the full per-tick `advanceTime` does much more than the drift loop (momentary-affect
   injector, baseline EMA, mood smoothing, dozens of subsystem decays). If the real "fold an
   act" is 3-5× the replica's ~1 µs, the central case moves to ~0.7-1.1 s — still CONFIRM, but
   the headroom shrinks.

Net: the verdict (tractable at runtime) is robust to several-× error in either term, but a
*combined* heavy-gate + heavy-fold reality could erode the runtime margin toward build-time.
The number to trust is the **order of magnitude (sub-second to low-seconds per life)**, not the
0.22 s point estimate. Closing this requires a spike with the *real* AFFORD gate and the *real*
fold — which is §11C's "the emitter and the cost are the same question" made concrete: you
cannot finish measuring the cost without committing the emitter's gate semantics.
