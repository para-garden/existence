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
// AFFECT PROXY — the harness's measurement instrument for mood variability.
// See docs/research/mood-variability.md ("Mapping the target onto the sim").
// A 0–100 valence proxy comparable to EMA self-reported momentary affect, built from
// serotonin + dopamine RELATIVE TO BASELINE (the same quantities moodTone() reads).
// This never feeds back into state — it is read-only instrumentation.
// ============================================================
function affectProxy(state) {
  const ser = state.get('serotonin') - state.get('serotonin_baseline');
  const dop = state.get('dopamine') - state.get('dopamine_baseline');
  return 50 + 0.6 * ser + 0.4 * dop;
}

// CORRECTED MOMENTARY-AFFECT PROXY — see docs/design/reactivity-axis.md §4.
// EMA momentary affect is dominated by the FAST systems (dopamine engagement, NE arousal),
// not tonic serotonin (which structurally cannot carry within-day variance — its 9–11h drift
// low-pass attenuates any within-day target swing to ~0 at the level; see mood-variability.md
// § TUNING-PHASE OUTCOME). The old serotonin-weighted proxy is a category error for a *momentary*
// metric. Weights are fixed a priori from the fast-vs-slow architecture and FROZEN before
// generator calibration (calibrating the instrument to pass would be the circular move; the
// generators — perturbation magnitude/λ and reactivity range — are what get tuned to the band).
function affectProxyMomentary(state) {
  const dop = state.get('dopamine') - state.get('dopamine_baseline');
  const ne = state.get('norepinephrine') - state.get('norepinephrine_baseline');
  const ser = state.get('serotonin') - state.get('serotonin_baseline');
  return 50 + 0.45 * dop + 0.30 * ne + 0.25 * ser;
}

// Within-person dispersion (iSD) — population SD of a sample series. This is the
// interval-robust metric the literature constrains (Jones 2020, PMID 32324001: iSD of
// momentary affect ≈ 13–15 on 0–100).
function iSD(series) {
  const n = series.length;
  if (n < 2) return 0;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  const v = series.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return Math.sqrt(v);
}

// Root mean square successive difference — reported as a secondary descriptive number only
// (RMSSD scales with the inter-sample interval, so it is not a portable target; see doc).
function rmssd(series) {
  if (series.length < 2) return 0;
  let s = 0;
  for (let i = 1; i < series.length; i++) s += (series[i] - series[i - 1]) ** 2;
  return Math.sqrt(s / (series.length - 1));
}

// EMPIRICAL TARGET BAND for within-day iSD of affectProxy on the 0–100 scale.
// Source: Jones 2020 (PMID 32324001) iSD PA 15.1 / NA 13.3 on 0–100; between-person SD ~7
// gives a stable→volatile individual range of ~8–22. Replicated at ~8–12% of range on
// PANAS 1–5 by Zheng 2016 (PMID 27729566). Lower bound 8 = conservative NA anchor; below 5
// is below anything observed in ordinary life. See docs/research/mood-variability.md.
const MOOD_VAR_TARGET = { lo: 8, hi: 18, center: 13, floorOfLife: 5, volatileMax: 22 };

// ============================================================
// TRAJECTORY RUNNER — steps hour by hour, re-pinning inputs, advancing the real sim,
// sampling NT levels + moodTone after each step.
//
// Two sampling regimes (see docs/design/reactivity-axis.md §4–5):
//   - SMOOTH-DRIVER (default): re-pins smooth representative inputs every game-hour and
//     advances in 60-min quanta. This is the TONIC-FLOOR CONTROL — it deliberately removes
//     the event-driven momentary component, so its iSD reads the structural/coupling floor
//     (~1, correctly low). The within-day iSD reported uses the OLD serotonin-weighted proxy
//     for continuity with the tuning-phase baseline.
//   - FREE-RUNNING (freeRunning=true): sets the day's inputs once at wake and advances through
//     the day in FINE quanta (the real action cadence) WITHOUT re-pinning smooth drivers, so
//     the momentary-perturbation generator inside advanceTime() actually fires across lived
//     time. Samples the CORRECTED momentary-affect proxy at EMA-like prompts (5 spread moments
//     per waking day, matching Jones 2020's protocol). This is what the empirical band measures.
// ============================================================
function runTrajectory(archetype, days, driverFor, opts = {}) {
  const freeRunning = !!opts.freeRunning;
  const ctx = createTestContext(SEED);
  ctx.state.init();
  const st = ctx.state;
  // Personality (affects drift rate via effectiveInertia AND amplitude via reactivityFactor)
  st.set('neuroticism', archetype.neuroticism);
  st.set('self_esteem', archetype.self_esteem);
  st.set('rumination', archetype.rumination);

  const samples = [];   // { day, hour, levels, tone }
  const toneCounts = {};
  const ranges = {};
  for (const nt of NTS) ranges[nt] = { min: Infinity, max: -Infinity };
  const saturation = {};
  for (const nt of NTS) saturation[nt] = { atFloor: 0, atCeil: 0, hardLow: 0, hardHigh: 0 };

  // Mood-variability instrumentation: collect affectProxy per day (for within-day iSD)
  // and the per-day mean (for day-to-day iSD across the run).
  const affectByDay = [];   // affectByDay[d] = [EMA-prompt affect samples]

  // EMA prompt hours within the waking day (semi-spread, matching ~5 prompts/day protocol).
  const PROMPT_HOURS = [9, 12, 15, 18, 21];

  // moodTone flip-rate instrumentation (FIX 2). The EMA prompts above are too sparse to see the
  // strobe; sample moodTone at EVERY quantum and count tone changes per waking day. The strobe
  // bug flipped ~27%/action; a healthy debounced readout changes a handful of times per day.
  let toneFlipsTotal = 0;     // tone changes between consecutive quanta
  let toneStepsTotal = 0;     // consecutive-quantum comparisons
  let prevTone = null;

  for (let d = 0; d < days; d++) {
    affectByDay[d] = [];
    // Weekday/restday alternation: treat day index 5,6 (mod 7) as rest days in the week run.
    const dow = d % 7;
    const driver = (driverFor === 'crisis')
      ? crisisInputs
      : (driverFor === 'mixed')
        ? (dow >= 5 ? restdayInputs : weekdayInputs)
        : weekdayInputs;

    if (freeRunning) {
      // FREE-RUNNING: set inputs once at the start of the day's representative load, then
      // advance through the day in 5-min quanta (the action-cadence the perturbation generator
      // rides on). Sample the momentary proxy at the EMA prompt hours.
      applyInputs(st, driver(9)); // representative mid-morning load, held for the day
      const QUANTUM = 5; // game-minutes per step — the fine action cadence
      let nextPrompt = 0;
      for (let minute = 0; minute < 24 * 60; minute += QUANTUM) {
        const hour = minute / 60;
        st.advanceTime(QUANTUM);
        // Flip-rate: sample tone every quantum during waking hours (7–23) and count changes.
        if (hour >= 7 && hour < 23) {
          const t = st.moodTone();
          if (prevTone !== null) { toneStepsTotal++; if (t !== prevTone) toneFlipsTotal++; }
          prevTone = t;
        }
        if (nextPrompt < PROMPT_HOURS.length && hour >= PROMPT_HOURS[nextPrompt]) {
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
          affectByDay[d].push(affectProxyMomentary(st));
          samples.push({ day: d, hour: Math.floor(hour), levels, tone });
          nextPrompt++;
        }
      }
    } else {
      for (let h = 0; h < 24; h++) {
        applyInputs(st, driver(h));
        // Advance in 5-min sub-steps (the real gameplay action cadence) rather than one
        // monolithic advanceTime(60), so the momentary-perturbation injector fires at a
        // representative cadence (gameplay advances minutes-scale while awake — interactions are
        // short). Inputs are re-pinned at the top of the hour (the smooth-driver control's design).
        for (let q = 0; q < 12; q++) st.advanceTime(5);
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
        affectByDay[d].push(affectProxy(st));
        samples.push({ day: d, hour: h, levels, tone });
      }
    }
  }

  // Within-day iSD: dispersion of the within-day affectProxy samples within each day,
  // averaged across days — the metric directly comparable to the EMA within-person iSD.
  const withinDayISDs = affectByDay.map(iSD);
  const withinDayRMSSDs = affectByDay.map(rmssd);
  const meanWithinDayISD = withinDayISDs.reduce((a, b) => a + b, 0) / withinDayISDs.length;
  const meanWithinDayRMSSD = withinDayRMSSDs.reduce((a, b) => a + b, 0) / withinDayRMSSDs.length;
  // Day-to-day iSD: dispersion of the per-day MEAN affectProxy across the run (the
  // between-consecutive-days component; only meaningful for multi-day runs).
  const dailyMeans = affectByDay.map(day => day.reduce((a, b) => a + b, 0) / day.length);
  const dayToDayISD = dailyMeans.length > 1 ? iSD(dailyMeans) : null;

  // moodTone flips per waking day (FIX 2): total tone changes / number of days. The strobe bug
  // produced tens per day (≈27% of ~190 waking quanta); a debounced readout is a handful.
  const toneFlipsPerDay = freeRunning && days > 0 ? toneFlipsTotal / days : null;
  const toneFlipRate = freeRunning && toneStepsTotal > 0 ? toneFlipsTotal / toneStepsTotal : null;

  const moodVar = {
    meanWithinDayISD: round2(meanWithinDayISD),
    meanWithinDayRMSSD: round2(meanWithinDayRMSSD),
    dayToDayISD: dayToDayISD == null ? null : round2(dayToDayISD),
    perDayISD: withinDayISDs.map(round2),
    toneFlipsPerDay: toneFlipsPerDay == null ? null : round2(toneFlipsPerDay),
    toneFlipRate: toneFlipRate == null ? null : round2(toneFlipRate),
  };

  return { archetype: archetype.id, days, freeRunning, samples, toneCounts, ranges, saturation, moodVar };
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
    note: 'Modeled ratio vs biological 5:1–8:1 (salivary cortisol ~14–25 nmol/L at 8AM vs ~1–5 nmol/L midnight; Debono 2009, PMID 19223520).',
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

// Verdict for a within-day iSD against the empirical band.
function moodVarVerdict(isd) {
  const T = MOOD_VAR_TARGET;
  if (isd < T.lo) return { verdict: 'BELOW', flag: true };
  if (isd > T.volatileMax) return { verdict: 'ABOVE', flag: true };
  if (isd > T.hi) return { verdict: 'ABOVE (within volatile-individual range)', flag: false };
  return { verdict: 'WITHIN', flag: false };
}

function formatMoodVar(report) {
  const T = MOOD_VAR_TARGET;
  let out = '── MOOD VARIABILITY vs EMPIRICAL TARGET ──\n';
  out += '  Metric: within-day iSD of affectProxy = 50 + 0.6·(SER−base) + 0.4·(DA−base), 0–100 scale.\n';
  out += `  Empirical target band (within-person iSD of momentary affect, 0–100):\n`;
  out += `    ${T.lo} – ${T.hi}  (center ~${T.center}; stable→volatile individuals ~${T.lo}–${T.volatileMax}; <${T.floorOfLife} below anything in ordinary life)\n`;
  out += `    Source: Jones 2020 PMID 32324001 (iSD PA 15.1 / NA 13.3 on 0–100); Zheng 2016 PMID 27729566 (PANAS replication);\n`;
  out += `            Scott 2020 PMID 30198310 (within-day component dominates). See docs/research/mood-variability.md.\n\n`;
  out += '  ── FREE-RUNNING gameplay (corrected momentary proxy = 50 + 0.45·DA + 0.30·NE + 0.25·SER) ──\n';
  out += '  This is the EMPIRICAL TEST: real lived-time cadence, perturbation generator firing,\n';
  out += '  EMA-prompt sampling. Spread should be resilient < baseline < ruminator (stability–\n';
  out += '  instability paradox: higher neuroticism → higher variability, NOT lower).\n';
  for (const run of report.freeRunning) {
    const mv = run.moodVar;
    const v = moodVarVerdict(mv.meanWithinDayISD);
    const d2d = mv.dayToDayISD == null ? '   n/a' : mv.dayToDayISD.toFixed(2).padStart(6);
    const flips = mv.toneFlipsPerDay == null ? ' n/a' : mv.toneFlipsPerDay.toFixed(1).padStart(4);
    out += `  [free |${run.archetype.padEnd(9)}] within-day iSD ${mv.meanWithinDayISD.toFixed(2).padStart(6)}` +
      `  | day-to-day iSD ${d2d}  | RMSSD ${mv.meanWithinDayRMSSD.toFixed(2).padStart(6)}` +
      `  | moodTone flips/day ${flips}` +
      `   → ${v.flag ? 'FLAG ' : 'PASS '}${v.verdict}\n`;
  }
  out += '  (moodTone flips/day: prose-tone changes per waking day — debounced readout = a handful;\n';
  out += '   the pre-FIX-2 strobe was tens/day. The LEVEL keeps its full within-day iSD above.)\n';
  out += '\n  ── SMOOTH-DRIVER reference (old serotonin-weighted proxy = 50 + 0.6·SER + 0.4·DA) ──\n';
  out += '  Re-pin smooth tonic drivers but advance at the real action cadence, so the momentary\n';
  out += '  injector still fires. The OLD proxy is serotonin-heavy, so most of the within-day\n';
  out += '  variance here is the SER/DA tonic component (the injector hits DA/NE, weighted low in\n';
  out += '  the old proxy); reported for continuity with the tuning-phase baseline, not the band test.\n';
  const rows = [];
  for (const run of report.day)   rows.push(['day  ', run]);
  for (const run of report.week)  rows.push(['week ', run]);
  for (const run of report.crisis) rows.push(['crisis', run]);
  for (const [scope, run] of rows) {
    const mv = run.moodVar;
    const v = moodVarVerdict(mv.meanWithinDayISD);
    const d2d = mv.dayToDayISD == null ? '   n/a' : mv.dayToDayISD.toFixed(2).padStart(6);
    out += `  [${scope}|${run.archetype.padEnd(9)}] within-day iSD ${mv.meanWithinDayISD.toFixed(2).padStart(6)}` +
      `  | day-to-day iSD ${d2d}  | RMSSD ${mv.meanWithinDayRMSSD.toFixed(2).padStart(6)}` +
      `   → ${v.flag ? 'FLAG ' : 'PASS '}${v.verdict}\n`;
  }
  out += '\n  Reading: the FREE-RUNNING rows are the band test; the smooth-driver rows are the floor control.\n';
  out += '  If free-running iSD is below band, the perturbation generator/reactivity range are too weak.\n';
  out += '  If iSD is within band but moodTone stays constant, the moodTone thresholds are the artifact.\n';
  out += '  (Crisis row is NOT an ordinary day — it is a sustained-load control; its iSD measures\n';
  out += '   settling toward a held extreme, not day-to-day swing, so it is reported but not the test.)\n\n';
  return out;
}

function formatReport(report) {
  let out = '';
  out += '═══════════════════════════════════════════════════════════════\n';
  out += '  NT-COUPLING TRAJECTORY HARNESS\n';
  out += '  Measures emergent mood dynamics incl. the reactivity axis + momentary-affect injector.\n';
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

  out += formatMoodVar(report);

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
  // FREE-RUNNING: the empirical band test. 7 days of real lived-time cadence per archetype,
  // averaging the within-day iSD across days to reduce sampling noise.
  const freeRunning = ARCHETYPES.map(a => runTrajectory(a, 7, 'mixed', { freeRunning: true }));
  const stacking = stackingChecks();
  const cortisol = cortisolDiurnal();

  const report = { seed: SEED, day, week, crisis, freeRunning, stacking, cortisol };

  // Trim per-sample arrays out of the JSON artifact summary (keep aggregates), but retain
  // full samples under a separate key for deeper offline analysis.
  const summary = {
    seed: SEED,
    generated: 'deterministic',
    day: day.map(r => ({ archetype: r.archetype, days: r.days, toneCounts: r.toneCounts, ranges: r.ranges, saturation: r.saturation, moodVar: r.moodVar })),
    week: week.map(r => ({ archetype: r.archetype, days: r.days, toneCounts: r.toneCounts, ranges: r.ranges, saturation: r.saturation, moodVar: r.moodVar })),
    crisis: crisis.map(r => ({ archetype: r.archetype, days: r.days, toneCounts: r.toneCounts, ranges: r.ranges, saturation: r.saturation, moodVar: r.moodVar })),
    freeRunning: freeRunning.map(r => ({ archetype: r.archetype, days: r.days, toneCounts: r.toneCounts, ranges: r.ranges, saturation: r.saturation, moodVar: r.moodVar })),
    stacking,
    cortisol,
    moodVarTarget: MOOD_VAR_TARGET,
  };

  const jsonPath = join(ROOT, 'nt-trajectory.json');
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  console.log(formatReport(report));
  console.log(`Artifact written to: nt-trajectory.json`);
}

main();
