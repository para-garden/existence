#!/usr/bin/env bun
// nt-trajectory.js — NT-coupling whole-system verification harness (phase 1: baseline reading).
//
// Usage: bun scripts/nt-trajectory.js
// Outputs: nt-trajectory.json (machine-readable artifact) + human-readable report to stdout.
// Exit 0 always (diagnostic, not CI gate) — matches scripts/sim-audit.js conventions.
//
// WHY THIS EXISTS
// ---------------
// The four NT target functions (serotoninTarget/dopamineTarget/norepinephrineTarget/cortisolTarget)
// in js/state.js carry ~24 `Approximation debt (NT coupling)` sites: coefficients whose DIRECTION
// is research-supported but whose MAGNITUDE is a design choice. They cannot be responsibly tuned
// without observing the EMERGENT mood behavior they produce over a representative trajectory.
//
// This harness is the measuring instrument. It does NOT change any coefficient. It:
//   1. Runs the real simulation forward (createTestContext + advanceTime — NOT a re-implementation
//      of the math) through a representative DAY and WEEK, driving realistic input patterns.
//   2. Codifies the dopamine-ne research doc's hand-done "system-level sanity check" stacking
//      computations as executable assertions against the CURRENT code (via the _ntTargetRaw hook).
//   3. Reports the emergent readout: moodTone distribution, per-NT min/max/range, clamp saturation.
//   4. Sweeps the cortisol diurnal rhythm across 24h and reports the modeled peak:trough ratio,
//      so the inline comment's claim ("amplitude 20 understates the biological 5:1–8:1 ratio")
//      becomes observable.
//
// The stacking-check target predictions are recomputed for the CURRENT coefficients (the research
// doc's worked examples used older threshold-form coefficients; see comments at each check).

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createTestContext } from '../js/test-context.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const NTS = ['serotonin', 'dopamine', 'norepinephrine', 'gaba', 'cortisol'];
const SEED = 0xC0FFEE; // fixed seed → deterministic run

// Clamp ranges per NT (from the target functions / research docs) — used to detect saturation.
// These are the *usable* target ranges; the raw [0,100] level clamp is the hard wall.
const CLAMP = {
  serotonin: [20, 82],
  dopamine: [25, 85],
  norepinephrine: [25, 88],
  gaba: [0, 100],     // gabaTarget has no internal clamp documented; uses level clamp
  cortisol: [0, 100], // diurnal+stress; no internal clamp
};

// ============================================================
// ARCHETYPES — personality changes drift *rate* (effectiveInertia), so it changes
// trajectory shape (how fast level reaches target) even though the target is identical.
// We run the day/week across three to see whether inertia materially changes the emergent
// mood distribution. Inertia weights: rumination 0.40, neuroticism 0.32, (1-self_esteem) 0.28.
// ============================================================
const ARCHETYPES = [
  { id: 'resilient', neuroticism: 20, self_esteem: 80, rumination: 20 }, // fluid: base inertia ~0.6
  { id: 'baseline',  neuroticism: 50, self_esteem: 50, rumination: 50 }, // neutral: base inertia 1.0
  { id: 'ruminator', neuroticism: 80, self_esteem: 20, rumination: 80 }, // sticky: base inertia ~1.4
];

// ============================================================
// INPUT DRIVERS — representative coupling-input patterns over a day.
// All inputs are functions of game-hour-of-day (0..24). These drive the *coupling inputs*
// the target functions read. advanceTime also evolves them, but we re-pin each step so the
// scenario is a controlled, representative load rather than free-running drift.
// ============================================================

// A representative WEEKDAY: wake tired, work stress builds midday, eat at intervals,
// hunger/thirst/bladder fluctuate, energy decays into evening, wind down.
function weekdayInputs(hour) {
  // hour ∈ [0,24)
  const working = hour >= 9 && hour < 17;
  return {
    stress: working ? 45 + (hour - 9) * 4 : (hour < 9 ? 30 : Math.max(25, 60 - (hour - 17) * 6)),
    energy: hour < 7 ? 35 : Math.max(20, 85 - (hour - 7) * 4), // wakes mid, decays through day
    hunger: ((hour + 2) % 5) * 14,         // sawtooth: meals roughly every ~5h reset
    thirst: 200 + ((hour * 60) % 600),     // climbs between drinks
    social: working ? 50 : (hour >= 18 ? 55 : 35), // some contact at work / evening
    money: 47.5,
    last_sleep_quality: 0.72,              // a mediocre night
    sleep_debt: 180,                       // mild standing debt
    bladder_fill: ((hour * 60) % 240) * 1.2, // fills, voided periodically
    connection_depth: 40,
  };
}

// A representative WEEKEND/low-demand day for variety within the week.
function restdayInputs(hour) {
  return {
    stress: hour < 9 ? 25 : 28,
    energy: hour < 8 ? 45 : Math.max(35, 80 - (hour - 8) * 2),
    hunger: ((hour + 1) % 5) * 12,
    thirst: 200 + ((hour * 60) % 500),
    social: hour >= 12 && hour <= 20 ? 65 : 45,
    money: 47.5,
    last_sleep_quality: 0.85,
    sleep_debt: 60,
    bladder_fill: ((hour * 60) % 240) * 1.2,
    connection_depth: 55,
  };
}

// A sustained CRISIS day — maximal negative inputs held constant. This is the control:
// if the emergent mood stays "present"/"flat" even here, the coupling is too flat (the level
// can't reach the dark tones); if it produces heavy/numb/hollow, then the day/week distribution
// being mood-flat is a property of the (mild) representative load, not the coupling.
function crisisInputs(_hour) {
  return {
    stress: 70,                 // sustained high (note: >75 triggers the 'fraying' physical override)
    energy: 18,
    hunger: 95,
    thirst: 1300,
    social: 5,
    money: 0,
    last_sleep_quality: 0.25,
    sleep_debt: 1400,
    bladder_fill: 200,
    connection_depth: 10,
  };
}

/** Apply a driver's inputs to state at the start of a step. */
function applyInputs(state, inputs) {
  for (const [k, v] of Object.entries(inputs)) state.set(k, v);
  state.set('is_sleeping', false);
}

/** Read the current NT levels. */
function readLevels(state) {
  const out = {};
  for (const nt of NTS) out[nt] = state.get(nt);
  return out;
}

// ============================================================
// TRAJECTORY RUNNER — steps hour by hour, re-pinning inputs, advancing the real sim,
// sampling NT levels + moodTone after each step.
// ============================================================
function runTrajectory(archetype, days, driverFor) {
  const ctx = createTestContext(SEED);
  ctx.state.init();
  const st = ctx.state;
  // Personality (affects drift rate via effectiveInertia)
  st.set('neuroticism', archetype.neuroticism);
  st.set('self_esteem', archetype.self_esteem);
  st.set('rumination', archetype.rumination);

  const samples = [];   // { day, hour, levels, tone }
  const toneCounts = {};
  const ranges = {};
  for (const nt of NTS) ranges[nt] = { min: Infinity, max: -Infinity };
  const saturation = {};
  for (const nt of NTS) saturation[nt] = { atFloor: 0, atCeil: 0, hardLow: 0, hardHigh: 0 };

  for (let d = 0; d < days; d++) {
    // Weekday/restday alternation: treat day index 5,6 (mod 7) as rest days in the week run.
    const dow = d % 7;
    const driver = (driverFor === 'crisis')
      ? crisisInputs
      : (driverFor === 'mixed')
        ? (dow >= 5 ? restdayInputs : weekdayInputs)
        : weekdayInputs;
    for (let h = 0; h < 24; h++) {
      applyInputs(st, driver(h));
      st.advanceTime(60); // advance one game-hour
      const levels = readLevels(st);
      const tone = st.moodTone();
      toneCounts[tone] = (toneCounts[tone] ?? 0) + 1;
      for (const nt of NTS) {
        const v = levels[nt];
        if (v < ranges[nt].min) ranges[nt].min = v;
        if (v > ranges[nt].max) ranges[nt].max = v;
        const [lo, hi] = CLAMP[nt];
        if (v <= lo + 0.5) saturation[nt].atFloor++;
        if (v >= hi - 0.5) saturation[nt].atCeil++;
        if (v <= 0.5) saturation[nt].hardLow++;
        if (v >= 99.5) saturation[nt].hardHigh++;
      }
      samples.push({ day: d, hour: h, levels, tone });
    }
  }
  return { archetype: archetype.id, days, samples, toneCounts, ranges, saturation };
}

// ============================================================
// STACKING CHECKS — codify the dopamine-ne research doc's hand-done "System-level sanity
// check" computations as executable assertions, recomputed for the CURRENT coefficients.
// We read the raw target via _ntTargetRaw (pre-drift, pre-jitter) so the assertion tests
// the coupling math exactly, not a settled/noisy level.
// ============================================================
function stackingChecks() {
  const ctx = createTestContext(SEED);
  ctx.state.init();
  const st = ctx.state;
  const checks = [];

  // Helper: pin a clean baseline (neutral modifiers), set the named inputs, read the raw target.
  function targetUnder(nt, inputs) {
    ctx.state.init();
    st.set('location', 'apartment_bedroom'); // not workplace (no work sentiment terms)
    st.set('neuroticism', 50); st.set('self_esteem', 50); st.set('rumination', 50);
    // neutralize secondary modifiers that the doc's hand-check ignored:
    st.set('oxytocin', 50); st.set('acetylcholine', 50);
    for (const [k, v] of Object.entries(inputs)) st.set(k, v);
    return st._ntTargetRaw(nt);
  }

  // --- DOPAMINE severe-state stack ---
  // Research doc "System-level sanity check (dopamine)": stress=80, debt=960, energy=20.
  // Doc used OLD coefficients (energy*0.25, stress threshold (s-60)*0.2, debt threshold 240):
  //   energy −7.5, stress −4.0, debt −4.32 → total −15.82 → DA target ≈ 34.2.
  // CURRENT coefficients (energy*0.20, stress*0.08 continuous, debt threshold 120 *0.006 cap10):
  //   energy (20−50)*0.20 = −6.0
  //   stress 80*0.08         = −6.4
  //   debt min((960−120)*0.006,10) = min(5.04,10) = −5.04
  //   total −17.44 → DA target = 50 − 17.44 = 32.56
  {
    const expected = 32.56;
    const got = targetUnder('dopamine', { stress: 80, sleep_debt: 960, energy: 20 });
    checks.push({
      name: 'DA severe stack (stress=80, debt=960, energy=20)',
      doc_old_coeff_expected: 34.2,
      current_coeff_expected: expected,
      got: round2(got),
      pass: Math.abs(got - expected) < 0.5,
      note: 'Lands high-30s/low-30s "functioning but impaired motivation", above floor 25. ✓ if within 0.5 of current-coeff prediction.',
      above_floor: got > 25,
    });
  }

  // --- DOPAMINE mild-state (energy high, no stress/debt) — sanity upper anchor ---
  {
    // energy (90-50)*0.20 = +8 → DA = 58
    const expected = 58;
    const got = targetUnder('dopamine', { stress: 0, sleep_debt: 0, energy: 90 });
    checks.push({
      name: 'DA rested-engaged (energy=90, stress=0, debt=0)',
      current_coeff_expected: expected,
      got: round2(got),
      pass: Math.abs(got - expected) < 0.5,
      note: 'High energy lifts DA above baseline; well below ceiling 85.',
    });
  }

  // --- NOREPINEPHRINE high-stress poor-sleep stack ---
  // Research doc "System-level sanity check (NE)": stress=80, sq=0.3.
  // Doc used OLD coefficients (stress offset (s-30)*0.3, sleep (sq-0.5)*15):
  //   stress +15, sleep +3 → t = 40+15+3 = 58.
  // CURRENT coefficients (stress*0.18 continuous, sleep (sq-0.65)*15, social (50-social)*0.04):
  //   base 40
  //   stress 80*0.18 = +14.4
  //   sleep  -(0.3-0.65)*15 = +5.25
  //   social default 40 → (50-40)*0.04 = +0.4   (we pin social=50 to match doc → +0)
  //   → with social=50: t = 40+14.4+5.25 = 59.65
  {
    const expected = 59.65;
    const got = targetUnder('norepinephrine', { stress: 80, last_sleep_quality: 0.3, social: 50, thirst: 200, bladder_fill: 0 });
    checks.push({
      name: 'NE high-stress poor-sleep (stress=80, sq=0.3, social=50)',
      doc_old_coeff_expected: 58,
      current_coeff_expected: expected,
      got: round2(got),
      pass: Math.abs(got - expected) < 0.5,
      note: 'Plausible high-stress poor-sleep state; well below ceiling 88. ✓ if within 0.5 of current-coeff prediction.',
      below_ceiling: got < 88,
    });
  }

  // --- NOREPINEPHRINE extreme stack ---
  // Doc: stress=95, sq=0.1 → OLD: 40+19.5+6 = 65.5.
  // CURRENT (social=50, thirst<700, bladder<300): 40 + 95*0.18 + -(0.1-0.65)*15
  //   = 40 + 17.1 + 8.25 = 65.35
  {
    const expected = 65.35;
    const got = targetUnder('norepinephrine', { stress: 95, last_sleep_quality: 0.1, social: 50, thirst: 200, bladder_fill: 0 });
    checks.push({
      name: 'NE extreme (stress=95, sq=0.1, social=50)',
      doc_old_coeff_expected: 65.5,
      current_coeff_expected: expected,
      got: round2(got),
      pass: Math.abs(got - expected) < 0.5,
      note: 'Substantial headroom below ceiling 88 even at extremes (doc claim). ✓ confirms headroom.',
      below_ceiling: got < 88,
    });
  }

  // --- SEROTONIN: stacked daily-life pressure (no single-term doc check exists; we construct one) ---
  // Inputs that the serotonin coupling reads at home: poor sleep, isolation, hunger, money.
  //   base 50
  //   sleep (0.4-0.85)*20 = -9.0
  //   social: connectionCoeff at depth=40 = 0.06+0.09*0.4 = 0.096; (10-50)*0.096 = -3.84
  //   hunger>75: (85-75)*0.2 = -2.0
  //   money<200: (200-47.5)*0.019 = -2.8975   (at apartment_* the moneyAnx term needs a sentiment; 0 here)
  //   sleep_debt 180 < 360 → 0
  //   → 50 -9 -3.84 -2.0 -2.8975 ≈ 32.26
  {
    const expected = 32.26;
    const got = targetUnder('serotonin', {
      last_sleep_quality: 0.4, social: 10, connection_depth: 40, hunger: 85,
      money: 47.5, thirst: 200, sleep_debt: 180,
    });
    checks.push({
      name: 'SER stacked daily pressure (sq=0.4, social=10, hunger=85, money=47.5)',
      current_coeff_expected: expected,
      got: round2(got),
      pass: Math.abs(got - expected) < 0.6,
      note: 'Constructed check (no doc worked-example for serotonin). Stays above floor 20.',
      above_floor: got > 20,
    });
  }

  return checks;
}

// ============================================================
// CORTISOL DIURNAL SWEEP — vary time-of-day across 24h with stress/money pinned to baseline,
// read the raw cortisol target. Report the peak:trough ratio so the inline comment's claim
// (amplitude 20 → ~2.6:1, understating biological 5:1–8:1) is observable.
// ============================================================
function cortisolDiurnal() {
  const ctx = createTestContext(SEED);
  ctx.state.init();
  const st = ctx.state;
  st.set('stress', 0);    // isolate the diurnal term
  st.set('money', 500);   // > $200 → no money term
  st.set('location', 'apartment_bedroom');
  st.set('autism', false);

  const curve = [];
  // timeOfDay() reads s.time (minutes). Set time to each hour of day 0.
  for (let h = 0; h < 24; h++) {
    st.set('time', h * 60);
    const t = st._ntTargetRaw('cortisol');
    curve.push({ hour: h, target: round2(t) });
  }
  let peak = -Infinity, trough = Infinity, peakHour = -1, troughHour = -1;
  for (const p of curve) {
    if (p.target > peak) { peak = p.target; peakHour = p.hour; }
    if (p.target < trough) { trough = p.target; troughHour = p.hour; }
  }
  return {
    curve,
    peak, peakHour, trough, troughHour,
    ratio: round2(peak / trough),
    amplitude: round2((peak - trough) / 2),
    note: 'Modeled ratio vs biological 5:1–8:1 (salivary cortisol ~14–25 nmol/L at 8AM vs ~1–5 nmol/L midnight; Debono 2009).',
  };
}

// ============================================================
// REPORT FORMATTING
// ============================================================
function round2(x) { return x == null ? null : Math.round(x * 100) / 100; }

function pct(n, total) { return total ? `${((n / total) * 100).toFixed(1)}%` : '0%'; }

function formatToneDist(toneCounts, total) {
  const order = ['fraying', 'numb', 'heavy', 'hollow', 'quiet', 'clear', 'present', 'flat'];
  return order
    .filter(t => toneCounts[t])
    .sort((a, b) => toneCounts[b] - toneCounts[a])
    .map(t => `      ${t.padEnd(8)} ${String(toneCounts[t]).padStart(4)}  ${pct(toneCounts[t], total)}`)
    .join('\n');
}

function formatTrajectory(run) {
  const total = run.samples.length;
  let out = `  [${run.archetype}] ${run.days}d / ${total} hourly samples\n`;
  out += `    mood tone distribution:\n${formatToneDist(run.toneCounts, total)}\n`;
  out += `    NT ranges (min → max):\n`;
  for (const nt of NTS) {
    const r = run.ranges[nt];
    const sat = run.saturation[nt];
    const flags = [];
    if (sat.atFloor > total * 0.2) flags.push(`FLOOR-PINNED ${pct(sat.atFloor, total)}`);
    if (sat.atCeil > total * 0.2) flags.push(`CEIL-PINNED ${pct(sat.atCeil, total)}`);
    if (r.max - r.min < 3) flags.push('NEARLY-STATIC');
    if (sat.hardLow > 0) flags.push(`HARD-0 ×${sat.hardLow}`);
    if (sat.hardHigh > 0) flags.push(`HARD-100 ×${sat.hardHigh}`);
    out += `      ${nt.padEnd(15)} ${r.min.toFixed(1).padStart(6)} → ${r.max.toFixed(1).padStart(6)}  (span ${(r.max - r.min).toFixed(1)})` +
      (flags.length ? `  ⚠ ${flags.join(', ')}` : '') + '\n';
  }
  return out;
}

function formatReport(report) {
  let out = '';
  out += '═══════════════════════════════════════════════════════════════\n';
  out += '  NT-COUPLING TRAJECTORY HARNESS — BASELINE READING\n';
  out += '  Phase 1: measuring instrument. Coefficients UNCHANGED.\n';
  out += `  Seed: 0x${SEED.toString(16).toUpperCase()}  (deterministic)\n`;
  out += '═══════════════════════════════════════════════════════════════\n\n';

  out += '── REPRESENTATIVE DAY (weekday load) ──\n';
  for (const run of report.day) out += formatTrajectory(run) + '\n';

  out += '── REPRESENTATIVE WEEK (5 weekdays + 2 rest days) ──\n';
  for (const run of report.week) out += formatTrajectory(run) + '\n';

  out += '── CRISIS CONTROL (3d sustained maximal-negative load, baseline archetype) ──\n';
  out += '  Tests whether the coupling CAN drive dark mood tones. If this stays present/flat,\n';
  out += '  the coupling is too flat; if it reaches heavy/numb/hollow, the day/week flatness is\n';
  out += '  a property of the representative load, not the coupling.\n';
  for (const run of report.crisis) out += formatTrajectory(run) + '\n';

  out += '── STACKING CHECKS (raw target vs documented hand-computed values) ──\n';
  let passN = 0;
  for (const c of report.stacking) {
    if (c.pass) passN++;
    out += `  [${c.pass ? 'PASS' : 'FAIL'}] ${c.name}\n`;
    if (c.doc_old_coeff_expected != null) out += `         doc (old coeff): ${c.doc_old_coeff_expected}\n`;
    out += `         current-coeff expected: ${c.current_coeff_expected}   got: ${c.got}\n`;
    if (c.above_floor === false) out += `         ⚠ AT/BELOW FLOOR\n`;
    if (c.below_ceiling === false) out += `         ⚠ AT/ABOVE CEILING\n`;
    out += `         ${c.note}\n`;
  }
  out += `  → ${passN}/${report.stacking.length} stacking checks pass against current code.\n\n`;

  out += '── CORTISOL DIURNAL RHYTHM (24h sweep, stress=0, money>$200) ──\n';
  const c = report.cortisol;
  out += `  peak   ${c.peak.toFixed(1)} @ ${String(c.peakHour).padStart(2, '0')}:00\n`;
  out += `  trough ${c.trough.toFixed(1)} @ ${String(c.troughHour).padStart(2, '0')}:00\n`;
  out += `  modeled peak:trough ratio = ${c.ratio}:1   (amplitude ${c.amplitude})\n`;
  out += `  ${c.note}\n`;
  out += `  curve: ${c.curve.map(p => p.target).join(' ')}\n`;
  if (c.ratio < 4) out += `  ⚠ modeled ratio ${c.ratio}:1 is well below biological 5:1–8:1 — cort:diurnal amplitude likely too low.\n`;
  out += '\n';

  return out;
}

// ============================================================
// MAIN
// ============================================================
function main() {
  const day = ARCHETYPES.map(a => runTrajectory(a, 1, 'weekday'));
  const week = ARCHETYPES.map(a => runTrajectory(a, 7, 'mixed'));
  // Crisis control: 3-day sustained maximal-negative load (baseline archetype only).
  const crisis = [runTrajectory(ARCHETYPES[1], 3, 'crisis')];
  const stacking = stackingChecks();
  const cortisol = cortisolDiurnal();

  const report = { seed: SEED, day, week, crisis, stacking, cortisol };

  // Trim per-sample arrays out of the JSON artifact summary (keep aggregates), but retain
  // full samples under a separate key for deeper offline analysis.
  const summary = {
    seed: SEED,
    generated: 'deterministic',
    day: day.map(r => ({ archetype: r.archetype, days: r.days, toneCounts: r.toneCounts, ranges: r.ranges, saturation: r.saturation })),
    week: week.map(r => ({ archetype: r.archetype, days: r.days, toneCounts: r.toneCounts, ranges: r.ranges, saturation: r.saturation })),
    crisis: crisis.map(r => ({ archetype: r.archetype, days: r.days, toneCounts: r.toneCounts, ranges: r.ranges, saturation: r.saturation })),
    stacking,
    cortisol,
  };

  const jsonPath = join(ROOT, 'nt-trajectory.json');
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  console.log(formatReport(report));
  console.log(`Artifact written to: nt-trajectory.json`);
}

main();
