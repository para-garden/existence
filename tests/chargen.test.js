// tests/chargen.test.js — unit tests for character generation
// Tests generateRandom() (pure charRng-driven), simulateFinancialHistory() (deterministic),
// and applyToState() integration via ctx.character.

import { describe, test, expect } from 'bun:test';
import { createTestContext } from '../js/test-context.js';
import { createChargen } from '../js/chargen.js';

// Helper: create a context, wire chargen, and generate a character.
// financial_sim is attached by calling simulateFinancialHistory() (as finishCreation does).
function generateChar(seed) {
  const ctx = createTestContext(seed);
  const chargen = createChargen(ctx);
  const char = chargen.generateRandom();

  // finishCreation() attaches financial_sim and labor_arrangement deterministically.
  // Replicate just enough to make the character usable for applyToState().
  const sim = chargen.simulateFinancialHistory(char.backstory, char.age_stage, char.job_type, char.housing_type);
  // Gender pay gap (mirrors finishCreation logic)
  if (char.pronouns === 'she/her' || char.pronouns === 'she/they') {
    sim.hourly_rate = Math.round(sim.hourly_rate * 0.82 * 100) / 100;
  }
  char.financial_sim = sim;

  // Minimal labor arrangement for applyToState() — mirrors generateLaborArrangement() for office.
  if (!char.labor_arrangement) {
    char.labor_arrangement = {
      type: 'fixed',
      day_pattern: 'weekdays',
      work_days: [1, 2, 3, 4, 5],
      shift_start: 540,
      shift_end: 1020,
      reveal_horizon_hours: null,
      reveal_tod: null,
      work_days_per_week: 5,
    };
  }

  return { ctx, chargen, char };
}

// ─────────────────────────────────────────────────────────
// 1. Determinism — same seed → same character
// ─────────────────────────────────────────────────────────
describe('chargen determinism', () => {
  test('same seed produces identical characters', () => {
    const { char: char1 } = generateChar(12345);
    const { char: char2 } = generateChar(12345);

    expect(char1.first_name).toBe(char2.first_name);
    expect(char1.last_name).toBe(char2.last_name);
    expect(char1.job_type).toBe(char2.job_type);
    expect(char1.age_stage).toBe(char2.age_stage);
    expect(char1.pronouns).toBe(char2.pronouns);
    expect(char1.latitude).toBe(char2.latitude);
    expect(char1.personality.neuroticism).toBe(char2.personality.neuroticism);
    expect(char1.personality.self_esteem).toBe(char2.personality.self_esteem);
    expect(char1.personality.rumination).toBe(char2.personality.rumination);
    expect(char1.personality.trait_loneliness).toBe(char2.personality.trait_loneliness);
    expect(char1.personality.introversion).toBe(char2.personality.introversion);
    expect(char1.backstory.economic_origin).toBe(char2.backstory.economic_origin);
    expect(char1.backstory.career_stability).toBe(char2.backstory.career_stability);
    expect(char1.financial_sim.hourly_rate).toBe(char2.financial_sim.hourly_rate);
    expect(char1.financial_sim.starting_money).toBe(char2.financial_sim.starting_money);
    expect(char1.financial_sim.rent_amount).toBe(char2.financial_sim.rent_amount);
  });

  test('same seed produces identical wardrobe', () => {
    const { char: char1 } = generateChar(12345);
    const { char: char2 } = generateChar(12345);

    expect(char1.wardrobe.length).toBe(char2.wardrobe.length);
    for (let i = 0; i < char1.wardrobe.length; i++) {
      expect(char1.wardrobe[i].id).toBe(char2.wardrobe[i].id);
      expect(char1.wardrobe[i].name).toBe(char2.wardrobe[i].name);
    }
  });
});

// ─────────────────────────────────────────────────────────
// 2. Required fields present
// ─────────────────────────────────────────────────────────
describe('chargen required fields', () => {
  test('name fields are non-empty strings', () => {
    const { char } = generateChar(12345);
    expect(typeof char.first_name).toBe('string');
    expect(char.first_name.length).toBeGreaterThan(0);
    expect(typeof char.last_name).toBe('string');
    expect(char.last_name.length).toBeGreaterThan(0);
  });

  test('pronoun_sets is a non-empty array of PronounSet objects', () => {
    const { char } = generateChar(12345);
    expect(Array.isArray(char.pronoun_sets)).toBe(true);
    expect(char.pronoun_sets.length).toBeGreaterThan(0);
    for (const ps of char.pronoun_sets) {
      expect(ps).toHaveProperty('subject');
      expect(ps).toHaveProperty('object');
      expect(ps).toHaveProperty('possessive');
      expect(ps).toHaveProperty('reflexive');
      expect(typeof ps.plural).toBe('boolean');
    }
  });

  test('job_type field is a recognized value', () => {
    const { char } = generateChar(12345);
    const validJobs = ['office', 'retail', 'food_service', 'gig_worker'];
    expect(validJobs).toContain(char.job_type);
  });

  test('economic_origin field is a recognized value', () => {
    const { char } = generateChar(12345);
    const validOrigins = ['precarious', 'modest', 'comfortable', 'secure'];
    expect(validOrigins).toContain(char.backstory.economic_origin);
  });

  test('personality params are all present', () => {
    const { char } = generateChar(12345);
    expect(char.personality).toBeDefined();
    expect(typeof char.personality.neuroticism).toBe('number');
    expect(typeof char.personality.self_esteem).toBe('number');
    expect(typeof char.personality.rumination).toBe('number');
    expect(typeof char.personality.trait_loneliness).toBe('number');
    expect(typeof char.personality.introversion).toBe('number');
  });

  test('financial_sim has required fields', () => {
    const { char } = generateChar(12345);
    expect(char.financial_sim).toBeDefined();
    expect(typeof char.financial_sim.hourly_rate).toBe('number');
    expect(typeof char.financial_sim.starting_money).toBe('number');
    expect(typeof char.financial_sim.rent_amount).toBe('number');
  });

  test('friends and coworkers are present', () => {
    const { char } = generateChar(12345);
    expect(char.friend1).toBeDefined();
    expect(typeof char.friend1.name).toBe('string');
    expect(char.friend1.name.length).toBeGreaterThan(0);
    expect(char.friend2).toBeDefined();
    expect(typeof char.friend2.name).toBe('string');
    expect(char.coworker1).toBeDefined();
    expect(char.coworker2).toBeDefined();
    expect(char.supervisor).toBeDefined();
  });

  test('wardrobe is a non-empty array', () => {
    const { char } = generateChar(12345);
    expect(Array.isArray(char.wardrobe)).toBe(true);
    expect(char.wardrobe.length).toBeGreaterThan(0);
  });

  test('backstory is present with expected shape', () => {
    const { char } = generateChar(12345);
    expect(char.backstory).toBeDefined();
    expect(typeof char.backstory.economic_origin).toBe('string');
    expect(typeof char.backstory.career_stability).toBe('number');
    expect(Array.isArray(char.backstory.life_events)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
// 3. Field value ranges
// ─────────────────────────────────────────────────────────
describe('chargen field ranges', () => {
  // Run a batch of characters to check ranges across varied seeds
  const seeds = [12345, 99999, 1, 54321, 777777, 42, 2024, 31337, 500, 13];

  test('personality params are all in [0, 100]', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      const p = char.personality;
      for (const [key, val] of Object.entries(p)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      }
    }
  });

  test('hourly_rate is positive', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      expect(char.financial_sim.hourly_rate).toBeGreaterThan(0);
    }
  });

  test('starting_money is a finite number', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      expect(Number.isFinite(char.financial_sim.starting_money)).toBe(true);
    }
  });

  test('rent_amount is positive', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      expect(char.financial_sim.rent_amount).toBeGreaterThan(0);
    }
  });

  test('age_stage is in adult range [22, 48]', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      expect(char.age_stage).toBeGreaterThanOrEqual(22);
      expect(char.age_stage).toBeLessThanOrEqual(48);
    }
  });

  test('sleep_cycle_length is in physiological range [70, 120]', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      expect(char.sleep_cycle_length).toBeGreaterThanOrEqual(70);
      expect(char.sleep_cycle_length).toBeLessThanOrEqual(120);
    }
  });

  test('latitude is a valid geographic latitude', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      expect(char.latitude).toBeGreaterThanOrEqual(-90);
      expect(char.latitude).toBeLessThanOrEqual(90);
    }
  });

  test('financial_anxiety is in [0, 0.8]', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      expect(char.financial_sim.financial_anxiety).toBeGreaterThanOrEqual(0);
      expect(char.financial_sim.financial_anxiety).toBeLessThanOrEqual(0.8);
    }
  });

  test('sensory_sensitivity is in [-1, 1]', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      expect(char.sensory_sensitivity).toBeGreaterThanOrEqual(-1.0);
      expect(char.sensory_sensitivity).toBeLessThanOrEqual(1.0);
    }
  });

  test('connective_tissue_laxity is in [0, 100]', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      expect(char.connective_tissue_laxity).toBeGreaterThanOrEqual(0);
      expect(char.connective_tissue_laxity).toBeLessThanOrEqual(100);
    }
  });

  test('heds is true only when connective_tissue_laxity >= 88', () => {
    for (const seed of seeds) {
      const { char } = generateChar(seed);
      if (char.heds) {
        expect(char.connective_tissue_laxity).toBeGreaterThanOrEqual(88);
      } else {
        expect(char.connective_tissue_laxity).toBeLessThan(88);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────
// 4. Different seeds produce different characters
// ─────────────────────────────────────────────────────────
describe('chargen seed variation', () => {
  test('seed 12345 and seed 99999 produce different characters', () => {
    const { char: charA } = generateChar(12345);
    const { char: charB } = generateChar(99999);

    // At least one of name, job, or personality should differ
    const same = charA.first_name === charB.first_name
      && charA.last_name === charB.last_name
      && charA.job_type === charB.job_type
      && charA.personality.neuroticism === charB.personality.neuroticism
      && charA.personality.self_esteem === charB.personality.self_esteem;

    expect(same).toBe(false);
  });

  test('a range of seeds all produce valid job types', () => {
    const seenJobs = new Set();
    // Run enough seeds to expect all job types to appear
    for (let seed = 0; seed < 200; seed++) {
      const { char } = generateChar(seed);
      seenJobs.add(char.job_type);
    }
    // At minimum we should see at least 2 distinct job types across 200 seeds
    expect(seenJobs.size).toBeGreaterThanOrEqual(2);
  });

  test('a range of seeds produces varied economic origins', () => {
    const seenOrigins = new Set();
    for (let seed = 0; seed < 200; seed++) {
      const { char } = generateChar(seed);
      seenOrigins.add(char.backstory.economic_origin);
    }
    // Should see at least 2 distinct origins across 200 seeds
    expect(seenOrigins.size).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────
// 5. applyToState — character values flow into state
// ─────────────────────────────────────────────────────────
describe('applyToState', () => {
  // Helper that fully wires the character into state (mirrors game.js new-game startup sequence).
  // Order: state.init() → character.set() → timeline.setCharacter() → character.applyToState()
  function applyChar(seed) {
    const { ctx, char } = generateChar(seed);
    ctx.state.init();
    ctx.timeline.setCharacter(char);
    ctx.character.set(char);
    ctx.items.reset();
    ctx.character.applyToState();
    return { ctx, char };
  }

  test('hourly_rate flows from financial_sim into state', () => {
    const { ctx, char } = applyChar(12345);
    expect(ctx.state.get('hourly_rate')).toBe(char.financial_sim.hourly_rate);
  });

  test('rent_amount flows from financial_sim into state', () => {
    const { ctx, char } = applyChar(12345);
    expect(ctx.state.get('rent_amount')).toBe(char.financial_sim.rent_amount);
  });

  test('starting money flows from financial_sim into state', () => {
    const { ctx, char } = applyChar(12345);
    expect(ctx.state.get('money')).toBe(char.financial_sim.starting_money);
  });

  test('neuroticism flows from personality into state (with possible backstory adj)', () => {
    const { ctx, char } = applyChar(12345);
    const stateVal = ctx.state.get('neuroticism');
    // applyToState applies personality then additive backstory adjustments — result may differ
    // from raw personality.neuroticism by the adjustment amount.
    const adj = char.financial_sim.personality_adjustments?.neuroticism ?? 0;
    const expected = Math.max(0, Math.min(100, char.personality.neuroticism + adj));
    expect(stateVal).toBe(expected);
  });

  test('self_esteem flows from personality into state (with possible backstory adj)', () => {
    const { ctx, char } = applyChar(12345);
    const stateVal = ctx.state.get('self_esteem');
    const adj = char.financial_sim.personality_adjustments?.self_esteem ?? 0;
    const expected = Math.max(0, Math.min(100, char.personality.self_esteem + adj));
    expect(stateVal).toBe(expected);
  });

  test('rumination flows from personality into state', () => {
    const { ctx, char } = applyChar(12345);
    expect(ctx.state.get('rumination')).toBe(char.personality.rumination);
  });

  test('trait_loneliness flows from personality into state', () => {
    const { ctx, char } = applyChar(12345);
    expect(ctx.state.get('trait_loneliness')).toBe(char.personality.trait_loneliness);
  });

  test('introversion flows from personality into state', () => {
    const { ctx, char } = applyChar(12345);
    expect(ctx.state.get('introversion')).toBe(char.personality.introversion);
  });

  test('pronouns flows into state', () => {
    const { ctx, char } = applyChar(12345);
    expect(ctx.state.get('pronouns')).toBe(char.pronouns);
  });

  test('latitude flows into state', () => {
    const { ctx, char } = applyChar(12345);
    expect(ctx.state.get('latitude')).toBe(char.latitude);
  });

  test('housing_quality flows into state', () => {
    const { ctx, char } = applyChar(12345);
    expect(ctx.state.get('housing_quality')).toBe(char.housing_quality);
  });

  test('laundry_access flows into state', () => {
    const { ctx, char } = applyChar(12345);
    const validAccess = ['in_unit', 'building', 'laundromat'];
    expect(validAccess).toContain(ctx.state.get('laundry_access'));
    expect(ctx.state.get('laundry_access')).toBe(char.laundry_access);
  });

  test('adhd and autism constitutional traits flow into state', () => {
    const { ctx, char } = applyChar(12345);
    expect(ctx.state.get('adhd')).toBe(char.adhd);
    expect(ctx.state.get('autism')).toBe(char.autism);
  });

  test('state has a valid time value after applyToState', () => {
    const { ctx } = applyChar(12345);
    const time = ctx.state.get('time');
    expect(typeof time).toBe('number');
    // time is in minutes-of-day, roughly matching an alarm time (e.g. 330–540 for 5:30–9:00am)
    expect(time).toBeGreaterThanOrEqual(0);
    expect(time).toBeLessThan(24 * 60);
  });
});

// ─────────────────────────────────────────────────────────
// 6. simulateFinancialHistory — deterministic from inputs
// ─────────────────────────────────────────────────────────
describe('simulateFinancialHistory', () => {
  test('same backstory + job always produces same result', () => {
    const ctx = createTestContext(12345);
    const chargen = createChargen(ctx);

    const backstory = {
      economic_origin: 'modest',
      career_stability: 0.6,
      life_events: [],
      ebt_enrolled: false,
    };

    const sim1 = chargen.simulateFinancialHistory(backstory, 30, 'office');
    const sim2 = chargen.simulateFinancialHistory(backstory, 30, 'office');

    expect(sim1.hourly_rate).toBe(sim2.hourly_rate);
    expect(sim1.starting_money).toBe(sim2.starting_money);
    expect(sim1.rent_amount).toBe(sim2.rent_amount);
    expect(sim1.financial_anxiety).toBe(sim2.financial_anxiety);
  });

  test('precarious origin has higher financial anxiety than secure', () => {
    const ctx = createTestContext(12345);
    const chargen = createChargen(ctx);

    const backstoryBase = { career_stability: 0.5, life_events: [], ebt_enrolled: false };

    const simPrecarious = chargen.simulateFinancialHistory(
      { ...backstoryBase, economic_origin: 'precarious' }, 30, 'retail'
    );
    const simSecure = chargen.simulateFinancialHistory(
      { ...backstoryBase, economic_origin: 'secure' }, 30, 'retail'
    );

    expect(simPrecarious.financial_anxiety).toBeGreaterThan(simSecure.financial_anxiety);
  });

  test('negative life events reduce starting_money', () => {
    const ctx = createTestContext(12345);
    const chargen = createChargen(ctx);

    const backstoryBase = { economic_origin: 'modest', career_stability: 0.5, ebt_enrolled: false };

    const simClean = chargen.simulateFinancialHistory(
      { ...backstoryBase, life_events: [] }, 30, 'office'
    );
    const simWithCrisis = chargen.simulateFinancialHistory(
      { ...backstoryBase, life_events: [{ type: 'medical_crisis', financial_impact: -5000 }] },
      30, 'office'
    );

    expect(simWithCrisis.starting_money).toBeLessThan(simClean.starting_money);
  });

  test('office job has higher hourly_rate than food_service', () => {
    const ctx = createTestContext(12345);
    const chargen = createChargen(ctx);

    const backstory = { economic_origin: 'modest', career_stability: 0.5, life_events: [], ebt_enrolled: false };

    const simOffice = chargen.simulateFinancialHistory(backstory, 30, 'office');
    const simFood = chargen.simulateFinancialHistory(backstory, 30, 'food_service');

    expect(simOffice.hourly_rate).toBeGreaterThan(simFood.hourly_rate);
  });
});
