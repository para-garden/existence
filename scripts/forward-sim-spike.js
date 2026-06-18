// forward-sim-spike.js — DIAGNOSTIC compute-cost spike for the simulated-life substrate.
//
// ============================================================================
// WHAT THIS IS
// ============================================================================
// The `existence` design pivots on a claim that has never been measured:
// that forward-simulating a character's life from t=0 (the §11A left-fold of an
// act-stream over a forward-caused population) is computationally tractable.
// docs/design/simulated-life.md §11C names this the open crux, and explicitly
// equates it with the compute-cost question: "the emitter and the cost are the
// same question, two hats."
//
// This script measures the per-act and per-life cost of the forward-sim
// PIPELINE SHAPE, so a CONFIRM / AMBER / FALSIFY verdict can be issued against a
// stated compute budget instead of an unmeasured "it feels intractable" premise
// (the META-TRAP, §10).
//
// ============================================================================
// WHAT IT MEASURES (and what it deliberately does NOT)
// ============================================================================
// MEASURES, faithfully:
//   - FOLD cost: the REAL state.js NT/baseline/sentiment drift loop SHAPE —
//     28 NT systems, each with a target function (~15-40 float ops + several
//     linear scans over a sentiments array), biologicalJitter (2x Math.sin),
//     exp decay, clamp, personality-inertia division. Replicated here, not
//     imported (importing state.js drags the whole GameContext + DOM); the
//     replica matches the system count and per-system work documented at
//     js/state.js:9718 (ntRates, 28 systems) and :10335 (driftNeurochemistry).
//   - AFFORD (menu construction): the CORRECTED cost driver. Enumerates eligible
//     PATIENTS from a co-present population each act, evaluating a cheap gate per
//     candidate. Implemented TWO ways: NAIVE (scan whole population, O(N)) and
//     INDEXED (maintained locale->members index, O(k)). This is the term the
//     original candidate-compute.md spec SKIPPED with constant weights, which is
//     exactly the term that scales with population and can flip the verdict.
//   - WEIGHT / DRAW / COMMIT, each broken out per-stage.
//   - Incremental-fold vs cold-recompute (the §11A quadratic-on-replay risk).
//
// Does NOT measure (honest caveats, see report):
//   - Propensity FIDELITY. Weights are placeholder constants/trivial products.
//     This is fine for COST (weight VALUES don't change op count); it says
//     NOTHING about whether the emitted lives are non-thin. Menu CONSTRUCTION
//     shape and fold cost are what's measured.
//   - The real t=0 joint draw (people are flat random NT vectors here).
//   - Texture/LLM build-time paint (off the control loop by design, §11D).
//   - Real ActKind apply-rules (COMMIT here folds the act via the drift loop +
//     a sentiment nudge — the right SHAPE, not the real rule set).
//
// ============================================================================
// RNG DISCIPLINE
// ============================================================================
// All SIM draws go through a seeded xoshiro128** PRNG (splitmix32-seeded),
// replicated verbatim from js/timeline.js — NO Math.random in simulated logic.
// performance.now() is used for TIMING ONLY (instrumentation is not sim state).
//
// Run: bun scripts/forward-sim-spike.js
// ============================================================================

'use strict';

// ----------------------------------------------------------------------------
// SEEDED PRNG — replicated verbatim from js/timeline.js (xoshiro128** /
// splitmix32). Same algorithm, so sim draws here match the project's discipline.
// ----------------------------------------------------------------------------
function splitmix32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x9e3779b9) | 0;
    let t = seed ^ (seed >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    t ^= t >>> 15;
    return t >>> 0;
  };
}
function xoshiro128ss(a, b, c, d) {
  return function next() {
    const t = b << 9;
    let r = a * 5;
    r = ((r << 7) | (r >>> 25)) * 9;
    c ^= a; d ^= b; b ^= c; a ^= d;
    c ^= t;
    d = (d << 11) | (d >>> 21);
    return (r >>> 0) / 4294967296;
  };
}
function createPRNG(seed) {
  const sm = splitmix32(seed);
  return xoshiro128ss(sm(), sm(), sm(), sm());
}

// ----------------------------------------------------------------------------
// FOLD — faithful replica of the state.js NT drift loop SHAPE.
//
// state.js drives 28 NT systems (js/state.js:9718 ntRates). The drift loop
// (:10335 driftNeurochemistry) iterates every key: per key it calls a target
// function, computes biologicalJitter (2x Math.sin), clamps, picks an
// asymmetric rate, divides mood-primary rates by effectiveInertia, applies
// Math.exp(-rate*hours) decay, clamps again.
//
// The target functions are the heavy realistic part: each does a handful of
// arithmetic couplings PLUS several sentimentIntensity() calls, each a LINEAR
// SCAN over the node's sentiments array (js/state.js:8213). We replicate that:
// each system's target fn here does NT_TARGET_ARITH float ops + a few linear
// sentiment scans. This is the load-bearing realism — the unit cost must be the
// REAL fold shape, not a toy.
// ----------------------------------------------------------------------------

const NT_SYSTEMS = 28; // matches ntRates key count exactly (js/state.js:9718)

// Per-system asymmetric [up,down] rates (representative spread from ntRates).
const NT_RATES = [
  [0.06,0.08],[0.35,0.45],[0.55,0.45],[0.03,0.05],[0.015,0.02],[0.04,0.06],
  [0.05,0.07],[0.04,0.06],[0.08,0.12],[0.1,0.15],[0.12,0.18],[0.06,0.08],
  [0.03,0.04],[0.01,0.015],[0.01,0.015],[0.02,0.03],[0.02,0.03],[0.01,0.015],
  [0.06,0.1],[0.03,0.05],[0.005,0.005],[0.15,0.2],[0.005,0.008],[0.1,0.15],
  [0.008,0.01],[0.001,0.001],[0.005,0.008],[0.03,0.05],
];
const NT_PHASE = NT_RATES.map((_, i) => 1.0 + i * 1.3);
// Mood-primary systems get personality-inertia division (state.js: 4 of them).
const MOOD_PRIMARY = new Set([0, 1, 2, 3]); // serotonin, dopamine, NE, gaba

// biologicalJitter replica (js/state.js:8455) — 2 Math.sin.
function biologicalJitter(timeHours, seed) {
  return Math.sin(timeHours * 0.017 + seed) * 2 +
         Math.sin(timeHours * 0.0073 + seed * 1.7) * 1.5;
}
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// A NodeState: the per-person folded state. Mirrors what the drift loop mutates.
function makeNode(id, rng) {
  const nt = new Float64Array(NT_SYSTEMS);
  for (let i = 0; i < NT_SYSTEMS; i++) nt[i] = 20 + rng() * 60; // flat random t=0
  return {
    id,
    nt,
    baseline: Float64Array.from(nt),
    // sentiments: directed {target, quality, intensity}. Real nodes accrue these
    // toward each co-present patient. We seed a handful and let COMMIT grow them.
    sentiments: [],         // array scanned linearly by target fns (realistic)
    inertia: 0.6 + rng() * 1.6, // effectiveInertia() spread, per-character
    locale: 0,
    lastFoldTime: 0,        // sim-hours of last incremental fold
    actsFolded: 0,
  };
}

// sentimentIntensity replica (js/state.js:8213) — LINEAR SCAN.
function sentimentIntensity(node, target, quality) {
  const ss = node.sentiments;
  for (let i = 0; i < ss.length; i++) {
    if (ss[i].target === target && ss[i].quality === quality) return ss[i].intensity;
  }
  return 0;
}

// Target function replica. Each NT system in state.js does ~15-40 arithmetic
// couplings reading current state + SEVERAL sentimentIntensity scans. We model a
// representative target fn: arithmetic over a few NT readings + 3 sentiment
// scans (serotoninTarget reads weather/time/work/money sentiments — multiple
// scans; js/state.js:8487). This is the dominant per-system cost.
function ntTarget(node, sys, timeHours) {
  const nt = node.nt;
  let t = 50;
  // Arithmetic couplings (representative; reads several other NT levels).
  t += (nt[(sys + 1) % NT_SYSTEMS] - 50) * 0.15;
  t += (nt[(sys + 7) % NT_SYSTEMS] - 30) * 0.08;
  if (nt[(sys + 3) % NT_SYSTEMS] > 75) t -= (nt[(sys + 3) % NT_SYSTEMS] - 75) * 0.2;
  t += (nt[(sys + 11) % NT_SYSTEMS] - 50) * 0.06;
  // Sentiment scans — the realistic linear-scan cost (3 per target fn).
  const c = sentimentIntensity(node, 'time_morning', 'comfort');
  const d = sentimentIntensity(node, 'work', 'dread');
  const w = sentimentIntensity(node, 'partner', 'warmth');
  t += c * 4 - d * 6 + w * 3;
  return clamp(t, 0, 100);
}

// driftNeurochemistry replica (js/state.js:10335). Advances `node` by `hours`.
// This is ONE fold step over the elapsed interval. (state.js folds per-tick;
// here one act carries one fold step over its Δt — the §11A "fold an act".)
function foldStep(node, hours, timeHours) {
  if (hours <= 0) return;
  const nt = node.nt;
  for (let key = 0; key < NT_SYSTEMS; key++) {
    const jitter = biologicalJitter(timeHours, NT_PHASE[key]);
    const target = clamp(ntTarget(node, key, timeHours) + jitter, 0, 100);
    const current = nt[key];
    const rates = NT_RATES[key];
    let rate = current > target ? rates[1] : rates[0];
    if (MOOD_PRIMARY.has(key)) rate = rate / node.inertia; // effectiveInertia()
    const decay = Math.exp(-rate * hours);
    nt[key] = clamp(target + (current - target) * decay, 0, 100);
  }
  node.actsFolded++;
}

// ----------------------------------------------------------------------------
// AFFORD — menu construction. THE COST DRIVER. Enumerate eligible patients from
// the co-present set; evaluate a cheap gate per candidate. Returns the afforded
// (verb, patient) menu. Implemented two ways via `copresent`.
//
// Verb ontology: small fixed alphabet (the alphabet being finite is honest;
// candidate-affordance.md §1.3). m = number of social verbs tried per patient.
// ----------------------------------------------------------------------------
const VERBS = ['feeds','soothes','discloses','withdraws','disciplines','asks','gives','avoids'];
const M_VERBS = VERBS.length; // m in the O(k*m) analysis

// Cheap per-candidate gate (relation/resource reachability predicate).
function gate(actor, patient, verbIdx) {
  // A few field reads + a modulo — mirrors "is there food? is this kin?" checks.
  if (patient.id === actor.id) return false;
  // Cheap deterministic gate using folded state (no RNG; pure predicate).
  return ((actor.id + patient.id + verbIdx) & 3) !== 0; // ~75% pass
}

// NAIVE co-presence: scan the WHOLE population to find who shares actor.locale.
// O(N) per act. This is the blow-up the candidate-affordance.md §6.2 names.
function affordNaive(actor, population, menuOut) {
  let n = 0;
  for (let p = 0; p < population.length; p++) {
    const patient = population[p];
    if (patient.locale !== actor.locale) continue; // co-presence test, scanned
    for (let v = 0; v < M_VERBS; v++) {
      if (gate(actor, patient, v)) { menuOut[n++] = (patient.id << 4) | v; }
    }
  }
  return n;
}

// INDEXED co-presence: a maintained locale->members index. O(k) per act, where
// k = co-presence degree. The members list is handed in directly.
function affordIndexed(actor, members, menuOut) {
  let n = 0;
  for (let i = 0; i < members.length; i++) {
    const patient = members[i];
    // (locale equality is guaranteed by the index; no scan)
    for (let v = 0; v < M_VERBS; v++) {
      if (gate(actor, patient, v)) { menuOut[n++] = (patient.id << 4) | v; }
    }
  }
  return n;
}

// ----------------------------------------------------------------------------
// WEIGHT — placeholder propensity score per afforded (verb,patient). Trivial
// product of a few folded-state reads. Weight VALUES don't matter for cost.
// ----------------------------------------------------------------------------
function weightMenu(actor, menu, count, weightsOut) {
  let total = 0;
  for (let i = 0; i < count; i++) {
    const v = menu[i] & 0xf;
    // Trivial propensity: a couple of NT reads + a verb base. (Placeholder.)
    const w = (actor.nt[v % NT_SYSTEMS] * 0.01 + 0.1) * (1 + (actor.nt[(v + 3) % NT_SYSTEMS] * 0.005));
    weightsOut[i] = w;
    total += w;
  }
  return total;
}

// DRAW — one seeded PRNG draw picks an act from the weighted menu.
function drawAct(menu, weights, count, total, rng) {
  let r = rng() * total;
  for (let i = 0; i < count; i++) {
    r -= weights[i];
    if (r <= 0) return menu[i];
  }
  return menu[count - 1];
}

// COMMIT — fold the chosen act into actor + patient. Fold the act via the drift
// loop (one foldStep on the patient over a small Δt) + a sentiment nudge. This
// is the right SHAPE, not the real apply-rule set.
function commit(actor, patient, verbIdx, timeHours, dtHours) {
  // Sentiment nudge on the patient (grows the sentiments array realistically;
  // bounded so the linear scan cost stays in a realistic band).
  const q = verbIdx % 2 === 0 ? 'warmth' : 'dread';
  let found = null;
  for (let i = 0; i < patient.sentiments.length; i++) {
    if (patient.sentiments[i].target === 'partner' && patient.sentiments[i].quality === q) {
      found = patient.sentiments[i]; break;
    }
  }
  if (found) found.intensity = clamp(found.intensity + 0.01, 0, 1);
  else if (patient.sentiments.length < 12) patient.sentiments.push({ target: 'partner', quality: q, intensity: 0.05 });
  // The act's effect on the patient's fold:
  foldStep(patient, dtHours, timeHours);
}

// ----------------------------------------------------------------------------
// THE FORWARD SIM HARNESS
// ----------------------------------------------------------------------------

// Per-stage timing accumulators (nanoseconds, summed; instrumentation only).
function newTimers() {
  return { fold: 0, afford: 0, weight: 0, draw: 0, commit: 0, acts: 0 };
}
const NOW = () => Number(Bun.nanoseconds());

// Run the forward sim for a given config. Measures per-stage cost.
//   N           : present social-web size (population materialized)
//   totalActs   : acts to simulate (granularity axis)
//   mode        : 'naive' | 'indexed'
//   seed        : PRNG seed
function runForwardSim(N, totalActs, mode, seed) {
  const rng = createPRNG(seed);
  const sm = splitmix32(seed ^ 0x5bd1e995);
  const nodeRng = createPRNG(sm());

  // Materialize N people at t=0 (flat random NT vectors — placeholder t=0 draw).
  const population = new Array(N);
  for (let i = 0; i < N; i++) population[i] = makeNode(i, nodeRng);

  // Assign locales. Co-presence degree k is bounded (Dunbar-ish locale sizes):
  // people cluster into locales of ~LOCALE_SIZE. This makes indexed AFFORD O(k)
  // with k roughly constant, while naive AFFORD stays O(N).
  const LOCALE_SIZE = 12; // ~co-presence degree (dwelling/workplace clusters)
  const numLocales = Math.max(1, Math.ceil(N / LOCALE_SIZE));
  const localeMembers = Array.from({ length: numLocales }, () => []);
  for (let i = 0; i < N; i++) {
    const loc = i % numLocales;
    population[i].locale = loc;
    localeMembers[loc].push(population[i]);
  }

  const t = newTimers();
  // Scratch buffers (avoid per-act allocation — matches a real tight loop).
  const menu = new Int32Array(N * M_VERBS);
  const weights = new Float64Array(N * M_VERBS);

  let simTimeHours = 0;
  const DT = 0.5; // sim-hours per act (Δt) — event-resolution granularity.

  for (let a = 0; a < totalActs; a++) {
    // Pick an acting node (round-robin over the population — every node acts).
    const actor = population[a % N];
    simTimeHours += DT;
    const timeHours = simTimeHours;

    // 1. FOLD — advance actor's NodeState (incremental: one step over elapsed Δt).
    let s0 = NOW();
    foldStep(actor, DT, timeHours);
    t.fold += NOW() - s0;

    // 2. AFFORD — menu construction (the cost driver).
    s0 = NOW();
    let count;
    if (mode === 'naive') count = affordNaive(actor, population, menu);
    else count = affordIndexed(actor, localeMembers[actor.locale], menu);
    t.afford += NOW() - s0;

    if (count === 0) { t.acts++; continue; }

    // 3. WEIGHT
    s0 = NOW();
    const total = weightMenu(actor, menu, count, weights);
    t.weight += NOW() - s0;

    // 4. DRAW
    s0 = NOW();
    const act = drawAct(menu, weights, count, total, rng);
    t.draw += NOW() - s0;

    // 5. COMMIT
    s0 = NOW();
    const patientId = act >> 4;
    const verbIdx = act & 0xf;
    const patient = population[patientId];
    commit(actor, patient, verbIdx, timeHours, DT);
    t.commit += NOW() - s0;

    t.acts++;
  }

  return { timers: t, population, peopleMaterialized: N };
}

// Cold-recompute path: re-fold a node's WHOLE act history from scratch. The
// §11A quadratic-on-replay. We measure cost of re-folding K acts from t=0.
function coldRecompute(actsOnNode, seed) {
  const rng = createPRNG(seed);
  const node = makeNode(0, rng);
  const s0 = NOW();
  let timeHours = 0;
  for (let a = 0; a < actsOnNode; a++) {
    timeHours += 0.5;
    foldStep(node, 0.5, timeHours);
  }
  return Number(NOW() - s0); // ns for the whole replay
}

// ----------------------------------------------------------------------------
// THE STATED BUDGET (declared BEFORE interpretation — no post-hoc goalposts)
// ----------------------------------------------------------------------------
//
// Chargen compute budget T. Rationale:
//   - "One timeline" + autosave means chargen happens ONCE per run, at new-game.
//   - An interactive new-game ideally completes in a few seconds (no dread-the-
//     manual wait); a loading screen with a progress beat can plausibly stretch
//     to ~30-60s without feeling broken (cf. AAA load screens, world-gen in
//     Dwarf Fortress / RimWorld which run minutes and players accept it).
//   - We pick a DEFENSIBLE TIERED budget and judge consistently against it:
//
//   CONFIRM (tractable at runtime / interactive new-game):  one life <= 5 s
//   AMBER   (tractable build-time only / loading screen):   5 s < one life <= 60 s
//   FALSIFY (intractable as currently shaped):              one life > 60 s
//
// Judged at the central plausible case: N=300 web, indexed AFFORD, 10^5 acts;
// with the 10^6-act granularity case reported alongside as the stress test.
const BUDGET = { confirmS: 5, amberS: 60 };

// ----------------------------------------------------------------------------
// RUN THE SWEEP
// ----------------------------------------------------------------------------
function fmt(ns) { // ns/act -> human
  if (ns < 1000) return ns.toFixed(1) + ' ns';
  if (ns < 1e6) return (ns / 1e3).toFixed(2) + ' µs';
  return (ns / 1e6).toFixed(3) + ' ms';
}

const N_SWEEP = [10, 50, 300, 1000, 3000];
const ACTS_PER_RUN = 50000; // acts simulated PER measurement run (timing sample)
const SEED = 0x1234abcd;

console.log('='.repeat(78));
console.log('FORWARD-SIM COMPUTE-COST SPIKE — existence simulated-life substrate');
console.log('='.repeat(78));
console.log(`PRNG: xoshiro128** (splitmix32-seeded), replicated from js/timeline.js`);
console.log(`FOLD: ${NT_SYSTEMS}-system drift loop (replica of state.js driftNeurochemistry)`);
console.log(`AFFORD: ${M_VERBS} verbs x co-present patients; naive O(N) vs indexed O(k)`);
console.log(`Acts per measurement run: ${ACTS_PER_RUN}; Δt = 0.5 sim-hours/act`);
console.log(`BUDGET: CONFIRM <= ${BUDGET.confirmS}s | AMBER <= ${BUDGET.amberS}s | FALSIFY > ${BUDGET.amberS}s (one life, N=300, indexed, 10^5 acts)`);
console.log('');

// Warm up the JIT (one untimed run) so steady-state numbers are representative.
runForwardSim(300, 20000, 'indexed', SEED);
runForwardSim(300, 20000, 'naive', SEED);

const results = {}; // results[mode][N] = per-stage ns/act + total

for (const mode of ['naive', 'indexed']) {
  results[mode] = {};
  console.log(`\n--- AFFORD mode: ${mode.toUpperCase()} ---`);
  console.log(
    'N'.padStart(5),
    'fold'.padStart(10), 'afford'.padStart(11), 'weight'.padStart(10),
    'draw'.padStart(9), 'commit'.padStart(10), 'TOTAL/act'.padStart(11),
    'acts/sec'.padStart(12),
  );
  for (const N of N_SWEEP) {
    const { timers: t } = runForwardSim(N, ACTS_PER_RUN, mode, SEED);
    const per = (x) => x / t.acts; // ns/act
    const totalPerAct = per(t.fold + t.afford + t.weight + t.draw + t.commit);
    const actsPerSec = 1e9 / totalPerAct;
    results[mode][N] = {
      fold: per(t.fold), afford: per(t.afford), weight: per(t.weight),
      draw: per(t.draw), commit: per(t.commit), total: totalPerAct, actsPerSec,
    };
    console.log(
      String(N).padStart(5),
      fmt(per(t.fold)).padStart(10), fmt(per(t.afford)).padStart(11),
      fmt(per(t.weight)).padStart(10), fmt(per(t.draw)).padStart(9),
      fmt(per(t.commit)).padStart(10), fmt(totalPerAct).padStart(11),
      Math.round(actsPerSec).toLocaleString().padStart(12),
    );
  }
}

// --- Naive vs indexed gap ---
console.log('\n--- NAIVE vs INDEXED AFFORD gap (the highest-leverage number) ---');
console.log('N'.padStart(5), 'naive afford'.padStart(14), 'indexed afford'.padStart(16), 'ratio'.padStart(8));
for (const N of N_SWEEP) {
  const na = results.naive[N].afford, ix = results.indexed[N].afford;
  console.log(String(N).padStart(5), fmt(na).padStart(14), fmt(ix).padStart(16), (na / ix).toFixed(1).padStart(8));
}

// --- Projected one-life wall-clock (indexed) ---
console.log('\n--- PROJECTED ONE-LIFE WALL-CLOCK (indexed AFFORD) ---');
console.log('Using central touch-set N and per-act TOTAL at that N.');
for (const N of [300, 1000]) {
  const perAct = results.indexed[N].total; // ns/act
  for (const acts of [1e5, 1e6]) {
    const wallS = (perAct * acts) / 1e9;
    console.log(`  N=${N}, ${acts.toExponential(0)} acts:  ${wallS.toFixed(3)} s  (${(perAct).toFixed(0)} ns/act)`);
  }
}

// --- Naive projection (the falsifying counterfactual) ---
console.log('\n--- PROJECTED ONE-LIFE WALL-CLOCK (NAIVE AFFORD — what the index buys) ---');
for (const N of [300, 1000]) {
  const perAct = results.naive[N].total;
  for (const acts of [1e5, 1e6]) {
    const wallS = (perAct * acts) / 1e9;
    console.log(`  N=${N}, ${acts.toExponential(0)} acts:  ${wallS.toFixed(3)} s  (${(perAct).toFixed(0)} ns/act)`);
  }
}

// --- Incremental vs cold-recompute ---
console.log('\n--- INCREMENTAL FOLD vs COLD-RECOMPUTE (the §11A replay quadratic) ---');
console.log('Cold-recompute re-folds a node\'s ENTIRE history from t=0 each time.');
console.log('Incremental advances one step. The gap is why the live pass must accumulate.');
for (const K of [1000, 5000, 20000]) {
  const coldNs = coldRecompute(K, SEED);
  const perActCold = coldNs / K;
  const incrementalPerAct = results.indexed[300].fold; // one foldStep, amortized O(1)
  console.log(
    `  node history = ${String(K).padStart(6)} acts:` +
    `  cold total ${(coldNs / 1e6).toFixed(2)} ms` +
    `  (${perActCold.toFixed(0)} ns/act-replayed)` +
    `  vs incremental ${incrementalPerAct.toFixed(0)} ns/act`,
  );
}
console.log('  NOTE: cold replaying a full life of A acts costs ~A foldSteps for ONE node,');
console.log('  but if every act re-folds the actor\'s whole past it is Σ(acts_on_node)^2 — the');
console.log('  quadratic. Incremental accumulation (materialize-as-you-go) makes the LIVE pass');
console.log('  linear: ~total_acts foldSteps. Cold-recompute is the determinism-check path only.');

// --- VERDICT ---
console.log('\n' + '='.repeat(78));
console.log('VERDICT');
console.log('='.repeat(78));
const central = results.indexed[300].total;
const lifeAt1e5 = (central * 1e5) / 1e9;
const lifeAt1e6 = (central * 1e6) / 1e9;
const naiveLifeAt1e5_300 = (results.naive[300].total * 1e5) / 1e9;

function verdict(seconds) {
  if (seconds <= BUDGET.confirmS) return 'CONFIRM (tractable at runtime / interactive new-game)';
  if (seconds <= BUDGET.amberS) return 'AMBER (tractable build-time only / loading screen)';
  return 'FALSIFY (intractable as currently shaped)';
}
console.log(`Central case (N=300, indexed, 10^5 acts): ${lifeAt1e5.toFixed(3)} s  ->  ${verdict(lifeAt1e5)}`);
console.log(`Granularity stress (N=300, indexed, 10^6 acts): ${lifeAt1e6.toFixed(3)} s  ->  ${verdict(lifeAt1e6)}`);
console.log(`Counterfactual (N=300, NAIVE, 10^5 acts): ${naiveLifeAt1e5_300.toFixed(3)} s  ->  ${verdict(naiveLifeAt1e5_300)}`);
const affDominant300 = results.indexed[300].afford > Math.max(
  results.indexed[300].fold, results.indexed[300].weight,
  results.indexed[300].draw, results.indexed[300].commit);
console.log(`AFFORD dominant stage @N=300 indexed? ${affDominant300 ? 'YES' : 'NO (fold dominates)'}`);
console.log(`Index mandatory? naive/indexed total ratio @N=1000 = ${(results.naive[1000].total / results.indexed[1000].total).toFixed(1)}x`);

// Emit machine-readable results for the report writer.
const out = {
  budget: BUDGET, ntSystems: NT_SYSTEMS, verbs: M_VERBS,
  actsPerRun: ACTS_PER_RUN, results,
  projections: {
    indexed: { '300': { '1e5': (results.indexed[300].total*1e5)/1e9, '1e6': (results.indexed[300].total*1e6)/1e9 },
               '1000': { '1e5': (results.indexed[1000].total*1e5)/1e9, '1e6': (results.indexed[1000].total*1e6)/1e9 } },
    naive:   { '300': { '1e5': (results.naive[300].total*1e5)/1e9, '1e6': (results.naive[300].total*1e6)/1e9 },
               '1000': { '1e5': (results.naive[1000].total*1e5)/1e9, '1e6': (results.naive[1000].total*1e6)/1e9 } },
  },
};
await Bun.write('scripts/.forward-sim-spike-results.json', JSON.stringify(out, null, 2));
console.log('\n(machine-readable results -> scripts/.forward-sim-spike-results.json)');
