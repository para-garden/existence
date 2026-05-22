#!/usr/bin/env bun
// adversarial-eval.js — headless greedy agent that drives the sim to find exploitable action loops.
//
// For each tick: enumerate available apartment interactions, try each on a cloned state,
// measure objective delta, pick the best, commit. If no beneficial action, advance time 30 min.
//
// Run: bun run scripts/adversarial-eval.js

import { createTestContext } from '../js/test-context.js';

// ---------------------------------------------------------------------------
// Minimal character fixture — enough for apartment interactions not to crash.
// Mirrors the shape that chargen.js produces and character.js.applyToState() reads.
// ---------------------------------------------------------------------------
function buildMinimalCharacter() {
  /** @type {PronounSet} */
  const sheHer = { subject: 'she', object: 'her', possessive: 'her', reflexive: 'herself', plural: false, label: 'she/her' };
  /** @type {PronounSet} */
  const theyThem = { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themself', plural: true, label: 'they/them' };

  return {
    first_name: 'Alex',
    last_name: 'Rivera',
    job_type: 'office',
    age_stage: 30,
    sleepwear: 'an oversized t-shirt',
    latitude: 42,
    // start_timestamp: 2024-03-15 00:00 UTC in minutes since epoch
    start_timestamp: 28401120 + (74 * 1440),
    personality: {
      neuroticism: 50,
      self_esteem: 50,
      rumination: 50,
      trait_loneliness: 30,
      introversion: 50,
    },
    sentiments: [
      { target: 'weather_clear', quality: 'comfort', intensity: 0.4 },
      { target: 'weather_grey', quality: 'irritation', intensity: 0.3 },
      { target: 'time_morning', quality: 'comfort', intensity: 0.4 },
      { target: 'eating', quality: 'comfort', intensity: 0.5 },
      { target: 'rain_sound', quality: 'comfort', intensity: 0.6 },
      { target: 'quiet', quality: 'comfort', intensity: 0.4 },
      { target: 'outside', quality: 'comfort', intensity: 0.3 },
      { target: 'warmth', quality: 'comfort', intensity: 0.5 },
      { target: 'routine', quality: 'comfort', intensity: 0.3 },
    ],
    financial_sim: {
      starting_money: 200,
      hourly_rate: 15,
      rent_amount: 800,
      job_standing_start: 65,
      financial_anxiety: 0.3,
      ebt_monthly_amount: 0,
      phone_bill_amount: 45,
      work_sentiment: { quality: 'neutral', intensity: 0 },
      personality_adjustments: {},
    },
    backstory: {
      life_events: [],
      economic_origin: 'modest',
      career_stability: 0.5,
    },
    labor_arrangement: {
      type: 'fixed',
      day_pattern: 'weekdays',
      work_days: [1, 2, 3, 4, 5],
      shift_start: 9 * 60,
      shift_end: 17 * 60,
      reveal_horizon_hours: null,
      reveal_tod: null,
      work_days_per_week: 5,
    },
    conditions: [],
    sleep_cycle_length: 90,
    // Bill offsets
    paycheck_day_offset: 7,
    rent_day_offset: 1,
    utility_day_offset: 15,
    phone_bill_day_offset: 20,
    ebt_day_offset: 5,
    // Wardrobe — minimal set so get_dressed works
    wardrobe: [
      { type: 'top', name: 'a grey t-shirt', clean: true, damage: { torn: false, stained: false, stretched: false }, wearCount: 0 },
      { type: 'bottom', name: 'jeans', clean: true, damage: { torn: false, stained: false, stretched: false }, wearCount: 0 },
      { type: 'underwear', name: 'underwear', clean: true, damage: { torn: false, stained: false, stretched: false }, wearCount: 0 },
      { type: 'socks', name: 'socks', clean: true, damage: { torn: false, stained: false, stretched: false }, wearCount: 0 },
    ],
    laundry_access: 'in_unit',
    has_umbrella: false,
    // Food profile — dietary identity
    food_profile: {
      cooking_skill: 40,
      ethical_stance: 'omnivore',
      cultural_tradition: 'western',
      health_restrictions: [],
      comfort_foods: ['pasta', 'bread'],
      pantry_slots: ['bread', 'pasta', 'rice', 'canned', 'eggs'],
    },
    initial_pantry: {
      pasta: 2, rice: 2, canned: 3, eggs: 1, bread: 1,
      beans: 0, oats: 0, potatoes: 0, peanut_butter: 0, ramen: 0,
      oil: 0, snacks: 0, tortillas: 0, noodles: 0, tofu: 0,
      canned_tuna: 0, soy_sauce: 0, hot_sauce: 0, spices: 0,
    },
    // NPC slots — must include pronoun_set and last_name to match chargen output
    friend1: { name: 'Jordan', last_name: 'Chen', flavor: 'checks_in', pronoun_set: theyThem, contact_timestamp: 0, guilt: 0 },
    friend2: { name: 'Sam', last_name: 'Park', flavor: 'dry_humor', pronoun_set: sheHer, contact_timestamp: 0, guilt: 0 },
    coworker1: { name: 'Riley', last_name: 'Kim', flavor: 'warm_quiet', pronoun_set: theyThem },
    coworker2: { name: 'Morgan', last_name: 'Lee', flavor: 'mundane_talker', pronoun_set: sheHer },
    supervisor: { name: 'Taylor', last_name: 'Brown', pronoun_set: sheHer },
    // Neighbor
    neighbor: { name: 'Pat', archetype: 'front_stoop', pronoun_set: theyThem },
    // Family
    family: { type: 'supportive', archetype: 'encouraging', member: 'parent', name: 'Dana' },
    // Housing quality — 0–100 composite
    housing_quality: 55,
    // Gym
    gym_membership: false,
    gym_membership_cost: 0,
    gym_bill_day_offset: 15,
    // Identity dimensions
    pronoun_sets: [sheHer],
    gender: { binary_diversity: 5, nonbinary_diversity: 5, expression_femininity: 65, expression_masculinity: 15 },
    attraction: {
      sexual: { intensity: 75, orientation: 90, gating: 'none' },
      romantic: { intensity: 75, orientation: 90, gating: 'none' },
      sensual: 60,
      aesthetic: 50,
    },
    hrt_active: false,
    hrt_type: null,
    out_at_work: [],
    out_to_family: [],
    // Makeup and binder
    wears_makeup: false,
    makeup_count: 0,
    wears_binder: false,
    binder_count: 0,
    // Mental health conditions
    has_depression: false,
    has_gad: false,
    has_ptsd: false,
    has_bipolar: false,
    // Physical params
    reproductive_anatomy: { has_uterus: false, has_ovaries: false },
    breast_tissue_score: 30,
    abdominal_baseline: 40,
    has_uterus: false,
    synesthesia: false,
    sensory_sensitivity: 0,
    apd: false,
    connective_tissue_laxity: 50,
    heds: false,
    mcas: false,
    adhd: false,
    autism: false,
    special_interest: null,
    // Substances
    starting_smoker: false,
    // Period supplies — not applicable for non-uterus character
    period_supply_count: 0,
    cycle_length: null,
    cramp_severity: null,
    cycle_start_day: null,
    // Phone
    phone_cracked: false,
    phone_age: 2,
    // Housing type
    housing_type: 'solo',
    // Insurance
    insurance_type: 'uninsured',
    insurance_bill_day_offset: 15,
    // Dental insurance
    has_dental_insurance: false,
    // Race/ethnicity
    race_ethnicity: 'white',
    // Corner store clerk
    corner_store_clerk: { name: 'Pat', pronoun_set: theyThem },
    // Bus stop regular
    bus_regular: { name: 'Casey', pronoun_set: theyThem },
    // Shelter residents
    shelter_residents: [],
    // Personal calendar
    personal_calendar: [],
    // Substance starting state
    alcohol_tolerance_start: 0,
    has_alcohol_start: 0,
    cannabis_tolerance_start: 0,
    has_cannabis_start: 0,
  };
}

// ---------------------------------------------------------------------------
// Snapshot helpers — capture and restore the full sim state for candidate eval.
// We need to snapshot: state (s), events log, dishes, linens, clothing, and RNG.
// ---------------------------------------------------------------------------

/** @param {ReturnType<typeof createTestContext>} ctx */
function takeSnapshot(ctx) {
  return {
    state: structuredClone(ctx.state.getAll()),
    events: ctx.events.all(),
    dishes: ctx.dishes.serialize(),
    linens: ctx.linens.serialize(),
    clothing: ctx.clothing.serialize(),
    rngStates: ctx.timeline.getRngStates(),
  };
}

/** @param {ReturnType<typeof createTestContext>} ctx */
function restoreSnapshot(ctx, snap) {
  ctx.state.restoreSnapshot(snap.state);
  ctx.events.restoreLog(snap.events);
  ctx.dishes.deserialize(snap.dishes);
  ctx.linens.deserialize(snap.linens);
  ctx.clothing.deserialize(snap.clothing);
  ctx.timeline.setRngStates(snap.rngStates);
}

// ---------------------------------------------------------------------------
// Objective functions
// ---------------------------------------------------------------------------
const objectives = {
  serotoninMax: ctx => ctx.state.get('serotonin'),
  stressMin: ctx => -ctx.state.get('stress'),
  composite: ctx =>
    ctx.state.get('serotonin') * 0.3 +
    ctx.state.get('dopamine') * 0.2 +
    ctx.state.get('gaba') * 0.2 -
    ctx.state.get('stress') * 0.2 +
    ctx.state.get('energy') * 0.1,
};

// ---------------------------------------------------------------------------
// Loop detection — find sequences of 2–5 actions that cycle >3 times
// ---------------------------------------------------------------------------

/** @param {string[]} history @param {number} minLen @param {number} maxLen @returns {Map<string, number>} */
function findRepeatingLoops(history, minLen = 2, maxLen = 5) {
  const loopCounts = new Map();
  for (let len = minLen; len <= maxLen; len++) {
    for (let i = 0; i <= history.length - len * 4; i++) {
      const pattern = history.slice(i, i + len).join(',');
      // Check if this pattern repeats ≥4 times consecutively from position i
      let reps = 1;
      let j = i + len;
      while (j + len <= history.length && history.slice(j, j + len).join(',') === pattern) {
        reps++;
        j += len;
      }
      if (reps >= 4) {
        const existing = loopCounts.get(pattern) ?? 0;
        if (reps > existing) loopCounts.set(pattern, reps);
        // Jump past the repetitions to avoid double-counting
        i = j - 1;
      }
    }
  }
  return loopCounts;
}

// ---------------------------------------------------------------------------
// Single adversarial run
// ---------------------------------------------------------------------------

/**
 * @param {number} seed
 * @param {string} objectiveName
 * @param {(ctx: ReturnType<typeof createTestContext>) => number} objective
 * @param {number} ticks
 */
function adversarialRun(seed, objectiveName, objective, ticks = 200) {
  const ctx = createTestContext(seed);
  ctx.state.init();

  // Set up character
  const char = buildMinimalCharacter();
  ctx.character.set(char);
  ctx.character.applyToState();

  // Start in bedroom, morning, dressed
  ctx.state.set('location', 'apartment_bedroom');
  ctx.state.set('dressed', false);  // will get dressed when that interaction fires
  ctx.state.set('energy', 70);
  ctx.state.set('stress', 25);
  ctx.state.set('hunger', 20);
  ctx.state.set('fridge_food', 3);
  ctx.state.set('pantry_food', 2);
  // Time: 8:00 AM (game start = minute 390 from 0:00, since time starts at 6:30 = 390)
  // Default is already 6*60+30 = 390, which is fine.

  const initialObjective = objective(ctx);
  const initialState = {
    serotonin: ctx.state.get('serotonin'),
    dopamine: ctx.state.get('dopamine'),
    gaba: ctx.state.get('gaba'),
    stress: ctx.state.get('stress'),
    energy: ctx.state.get('energy'),
  };

  /** @type {string[]} */
  const actionHistory = [];
  /** @type {Map<string, number>} */
  const actionCounts = new Map();

  let timePassed = 0;
  let noActionTicks = 0;

  for (let tick = 0; tick < ticks; tick++) {
    // Get available interactions at current location only
    const available = ctx.content.getAvailableInteractions();

    // Filter to apartment interactions only (skip work, street, etc.)
    // We stay in the apartment for this evaluation pass.
    const apartmentIds = new Set([
      'apartment_bedroom', 'apartment_bathroom', 'apartment_kitchen',
      'apartment_living_room', 'apartment_laundry',
    ]);
    const currentLocation = ctx.state.get('location');

    // If we've drifted out of the apartment somehow, snap back
    if (!apartmentIds.has(currentLocation)) {
      ctx.state.set('location', 'apartment_bedroom');
    }

    if (available.length === 0) {
      // No actions available — advance time
      ctx.state.advanceTime(30);
      timePassed += 30;
      noActionTicks++;
      continue;
    }

    const baselineSnap = takeSnapshot(ctx);
    const baselineScore = objective(ctx);

    let bestId = null;
    let bestScore = baselineScore;
    let bestSnap = null;

    for (const interaction of available) {
      // Skip sleep — it advances time significantly and distorts the loop search
      if (interaction.id === 'sleep') continue;
      // Skip give_up — ends the run; ctx.game.endRun not available in test context
      if (interaction.id === 'give_up') continue;
      // Skip movement interactions (go_to_*)
      if (interaction.id.startsWith('go_to_')) continue;
      // Skip interactions that require data input (parameterized)
      // These typically have a `data` parameter in execute signature
      // We check by trying to call with empty data and catching

      const candidateSnap = takeSnapshot(ctx);
      try {
        interaction.execute({});
        // Also advance time 1 min to let any immediate NT effects register
        // (don't advance — it complicates the objective measurement)
      } catch (_e) {
        restoreSnapshot(ctx, candidateSnap);
        continue;
      }

      const candidateScore = objective(ctx);
      if (candidateScore > bestScore || (bestId === null && candidateScore >= baselineScore)) {
        bestScore = candidateScore;
        bestId = interaction.id;
        bestSnap = takeSnapshot(ctx);
      }
      restoreSnapshot(ctx, candidateSnap);
    }

    if (bestId !== null && bestSnap !== null) {
      // Commit the best action
      restoreSnapshot(ctx, bestSnap);
      actionHistory.push(bestId);
      actionCounts.set(bestId, (actionCounts.get(bestId) ?? 0) + 1);
      noActionTicks = 0;

      // Advance a small amount of time after each action (interactions typically include time cost)
      // Most interactions call advanceTime internally; don't double-count.
      // Just fire world events.
      ctx.world.checkEvents();
    } else {
      // No beneficial action found — advance time 30 min
      restoreSnapshot(ctx, baselineSnap);
      ctx.state.advanceTime(30);
      timePassed += 30;
      noActionTicks++;
    }
  }

  const finalState = {
    serotonin: ctx.state.get('serotonin'),
    dopamine: ctx.state.get('dopamine'),
    gaba: ctx.state.get('gaba'),
    stress: ctx.state.get('stress'),
    energy: ctx.state.get('energy'),
  };
  const finalObjective = objective(ctx);

  // Top-10 most-used interactions
  const sorted = [...actionCounts.entries()].sort((a, b) => b[1] - a[1]);
  const top10 = sorted.slice(0, 10);

  // Flag interactions used in >30% of ticks
  const flagged = sorted.filter(([_, count]) => count / ticks > 0.30);

  // Loop detection
  const loops = findRepeatingLoops(actionHistory);

  return {
    objectiveName,
    actionHistory,
    actionCounts,
    top10,
    flagged,
    loops,
    initialState,
    finalState,
    initialObjective,
    finalObjective,
    ticks,
    noActionTicks,
  };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

function formatReport(result) {
  const lines = [];
  lines.push(`\n${'='.repeat(60)}`);
  lines.push(`Objective: ${result.objectiveName}`);
  lines.push(`Ticks: ${result.ticks} (${result.noActionTicks} idle time-advances)`);
  lines.push(`Objective value: ${result.initialObjective.toFixed(2)} → ${result.finalObjective.toFixed(2)} (delta: ${(result.finalObjective - result.initialObjective).toFixed(2)})`);

  lines.push(`\nNT levels (initial → final):`);
  for (const [k, v] of Object.entries(result.initialState)) {
    const fin = result.finalState[k];
    const arrow = fin > v ? '↑' : fin < v ? '↓' : '→';
    lines.push(`  ${k.padEnd(14)} ${v.toFixed(1)} → ${fin.toFixed(1)} ${arrow}`);
  }

  lines.push(`\nTop-10 most-used interactions:`);
  for (const [id, count] of result.top10) {
    const pct = ((count / result.ticks) * 100).toFixed(1);
    const flag = count / result.ticks > 0.30 ? ' *** FLAGGED (>30%)' : '';
    lines.push(`  ${String(count).padStart(4)}x  ${(pct + '%').padEnd(7)} ${id}${flag}`);
  }

  if (result.flagged.length > 0) {
    lines.push(`\nFLAGGED interactions (>30% of ticks):`);
    for (const [id, count] of result.flagged) {
      lines.push(`  ${id}: ${count}/${result.ticks} (${((count / result.ticks) * 100).toFixed(1)}%)`);
    }
  } else {
    lines.push(`\nNo interactions flagged at >30% threshold.`);
  }

  if (result.loops.size > 0) {
    lines.push(`\nRepeating action loops detected:`);
    const sortedLoops = [...result.loops.entries()].sort((a, b) => b[1] - a[1]);
    for (const [pattern, reps] of sortedLoops.slice(0, 10)) {
      lines.push(`  [${pattern}]  x${reps} repetitions`);
    }
  } else {
    lines.push(`\nNo repeating loops detected.`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const SEED = 42;
const TICKS = 200;

console.log('existence adversarial-eval');
console.log(`Seed: ${SEED}, Ticks: ${TICKS}`);
console.log('Running three objective variants...\n');

for (const [name, fn] of Object.entries(objectives)) {
  process.stdout.write(`Running ${name}...`);
  try {
    const result = adversarialRun(SEED, name, fn, TICKS);
    process.stdout.write(' done.\n');
    console.log(formatReport(result));
  } catch (err) {
    process.stdout.write(' ERROR.\n');
    console.error(`  ${err.message}`);
    if (err.stack) {
      const lines = err.stack.split('\n').slice(1, 4);
      for (const l of lines) console.error(`  ${l.trim()}`);
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log('Done.');
