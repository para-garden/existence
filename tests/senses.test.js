// tests/senses.test.js — integration tests for the senses pipeline.
// Exercises createSenses(ctx) → sense() / arrivalSense() / midSense()
// through a real game context so that source evaluation (available(), salience(),
// property functions) runs against live state objects.

import { describe, test, expect, beforeEach } from 'bun:test';
import { createTestContext } from '../js/test-context.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Force a specific location without paying travel-time cost. */
function setLocation(ctx, locationId) {
  ctx.state.set('location', locationId);
  ctx.state.set('location_arrival_time', ctx.state.get('time'));
}

/** Push NT state toward a given hint without calling private functions. */
function setNtAnxious(ctx) {
  // gaba < 40 → 'anxious' hint in getStructureHint()
  ctx.state.set('gaba', 30);
  ctx.state.set('norepinephrine', 65);
}

function setNtDissociated(ctx) {
  // adenosine > 75 && ne < 45 → 'dissociated'
  ctx.state.set('adenosine', 80);
  ctx.state.set('norepinephrine', 40);
  ctx.state.set('gaba', 55);
}

function setNtOverwhelmed(ctx) {
  // gaba < 30 && ne > 70 → 'overwhelmed'
  ctx.state.set('gaba', 25);
  ctx.state.set('norepinephrine', 75);
}

// ---------------------------------------------------------------------------
// Return-type contract
// ---------------------------------------------------------------------------

describe('senses pipeline — return type contract', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('sense() returns string or null, never throws', () => {
    setLocation(ctx, 'apartment_bedroom');
    const result = ctx.senses.sense();
    expect(result === null || typeof result === 'string').toBe(true);
  });

  test('arrivalSense() returns string or null, never throws', () => {
    setLocation(ctx, 'apartment_bedroom');
    const result = ctx.senses.arrivalSense();
    expect(result === null || typeof result === 'string').toBe(true);
  });

  test('midSense() returns string or null, never throws', () => {
    setLocation(ctx, 'apartment_bedroom');
    const result = ctx.senses.midSense('doing');
    expect(result === null || typeof result === 'string').toBe(true);
  });

  test('midSense() with "waiting" hint returns string or null', () => {
    setLocation(ctx, 'apartment_bedroom');
    const result = ctx.senses.midSense('waiting');
    expect(result === null || typeof result === 'string').toBe(true);
  });

  test('midSense() with "moving" hint returns string or null', () => {
    setLocation(ctx, 'street');
    const result = ctx.senses.midSense('moving');
    expect(result === null || typeof result === 'string').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Multiple locations
// ---------------------------------------------------------------------------

describe('senses pipeline — location-specific sources', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('apartment_bedroom: sense() does not throw', () => {
    setLocation(ctx, 'apartment_bedroom');
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('apartment_living: sense() does not throw', () => {
    setLocation(ctx, 'apartment_living');
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('apartment_bathroom: sense() does not throw', () => {
    setLocation(ctx, 'apartment_bathroom');
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('workplace: sense() does not throw', () => {
    setLocation(ctx, 'workplace');
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('street: sense() does not throw', () => {
    setLocation(ctx, 'street');
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('bus_stop: sense() does not throw', () => {
    setLocation(ctx, 'bus_stop');
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('park: sense() does not throw', () => {
    setLocation(ctx, 'park');
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('library: sense() does not throw', () => {
    setLocation(ctx, 'library');
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('friends_apartment: sense() does not throw', () => {
    setLocation(ctx, 'friends_apartment');
    expect(() => ctx.senses.sense()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// NT state variation: anxious, dissociated, overwhelmed, calm
// ---------------------------------------------------------------------------

describe('senses pipeline — NT state variation', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('anxious state at apartment: sense() does not throw', () => {
    setLocation(ctx, 'apartment_bedroom');
    setNtAnxious(ctx);
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('anxious state: getStructureHint() returns "anxious"', () => {
    setNtAnxious(ctx);
    expect(ctx.senses.getStructureHint()).toBe('anxious');
  });

  test('dissociated state at apartment: sense() does not throw', () => {
    setLocation(ctx, 'apartment_bedroom');
    setNtDissociated(ctx);
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('dissociated state: getStructureHint() returns "dissociated"', () => {
    setNtDissociated(ctx);
    expect(ctx.senses.getStructureHint()).toBe('dissociated');
  });

  test('overwhelmed state at workplace: sense() does not throw', () => {
    setLocation(ctx, 'workplace');
    setNtOverwhelmed(ctx);
    expect(() => ctx.senses.sense()).not.toThrow();
  });

  test('overwhelmed state: getStructureHint() returns "overwhelmed"', () => {
    setNtOverwhelmed(ctx);
    expect(ctx.senses.getStructureHint()).toBe('overwhelmed');
  });
});

// ---------------------------------------------------------------------------
// getObservations() — source pipeline
// ---------------------------------------------------------------------------

describe('senses pipeline — getObservations()', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('getObservations() returns an array', () => {
    setLocation(ctx, 'apartment_bedroom');
    const obs = ctx.senses.getObservations();
    expect(Array.isArray(obs)).toBe(true);
  });

  test('getObservations() entries have required fields', () => {
    setLocation(ctx, 'apartment_bedroom');
    const obs = ctx.senses.getObservations();
    for (const o of obs) {
      expect(typeof o.sourceId).toBe('string');
      expect(Array.isArray(o.channels)).toBe(true);
      expect(typeof o.salience).toBe('number');
      expect(typeof o.properties).toBe('object');
    }
  });

  test('getObservations() sorted descending by salience', () => {
    setLocation(ctx, 'apartment_bedroom');
    const obs = ctx.senses.getObservations();
    for (let i = 1; i < obs.length; i++) {
      expect(obs[i - 1].salience).toBeGreaterThanOrEqual(obs[i].salience);
    }
  });

  test('getObservations() at workplace includes work-area sources', () => {
    setLocation(ctx, 'workplace');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    // workplace_hvac is always available in work area
    expect(ids).toContain('workplace_hvac');
  });

  test('getObservations() at apartment does not include outdoor-only sources', () => {
    setLocation(ctx, 'apartment_bedroom');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    // traffic_outdoor is areas: ['outside'] — must not appear in apartment
    expect(ids).not.toContain('traffic_outdoor');
  });

  test('getObservations() at street does not include apartment-only sources', () => {
    setLocation(ctx, 'street');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    // fridge is areas: ['apartment'] — must not appear on street
    expect(ids).not.toContain('fridge');
  });

  test('getObservations() at park includes park_ambient source', () => {
    setLocation(ctx, 'park');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    expect(ids).toContain('park_ambient');
  });

  test('getObservations() at library includes library_ambient source', () => {
    setLocation(ctx, 'library');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    expect(ids).toContain('library_ambient');
  });
});

// ---------------------------------------------------------------------------
// Sources that require specific state to become available
// ---------------------------------------------------------------------------

describe('senses pipeline — state-gated sources', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('fatigue source available when adenosine > 55', () => {
    ctx.state.set('adenosine', 70);
    setLocation(ctx, 'apartment_bedroom');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    expect(ids).toContain('fatigue');
  });

  test('fatigue source absent when adenosine <= 55', () => {
    ctx.state.set('adenosine', 30);
    setLocation(ctx, 'apartment_bedroom');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    expect(ids).not.toContain('fatigue');
  });

  test('hunger_signal source available when hunger > 45', () => {
    ctx.state.set('hunger', 60);
    setLocation(ctx, 'apartment_bedroom');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    expect(ids).toContain('hunger_signal');
  });

  test('rain source available at street when rain is true', () => {
    ctx.state.set('rain', true);
    setLocation(ctx, 'street');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    expect(ids).toContain('rain');
  });

  test('rain source absent at street when rain is false', () => {
    ctx.state.set('rain', false);
    setLocation(ctx, 'street');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    expect(ids).not.toContain('rain');
  });

  test('anxiety_signal source available when gaba < 45', () => {
    ctx.state.set('gaba', 30);
    setLocation(ctx, 'apartment_bedroom');
    const obs = ctx.senses.getObservations();
    const ids = obs.map(o => o.sourceId);
    expect(ids).toContain('anxiety_signal');
  });
});

// ---------------------------------------------------------------------------
// canDisplay() / markDisplayed()
// ---------------------------------------------------------------------------

describe('senses pipeline — cooldown (canDisplay / markDisplayed)', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('canDisplay() returns true before any display', () => {
    expect(ctx.senses.canDisplay()).toBe(true);
  });

  test('canDisplay() returns false immediately after markDisplayed()', () => {
    ctx.senses.markDisplayed();
    expect(ctx.senses.canDisplay()).toBe(false);
  });

  test('canDisplay() returns true after 12+ game minutes have passed', () => {
    ctx.senses.markDisplayed();
    // Advance 13 minutes past the mark
    ctx.state.set('time', ctx.state.get('time') + 13);
    expect(ctx.senses.canDisplay()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// String quality: when a string is returned it should be a valid sentence
// ---------------------------------------------------------------------------

describe('senses pipeline — string quality', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('sense() result (if non-null) ends with a period', () => {
    // High adenosine to force fatigue source above threshold
    ctx.state.set('adenosine', 80);
    setLocation(ctx, 'apartment_bedroom');
    const result = ctx.senses.sense();
    if (result !== null) {
      expect(result).toMatch(/\.$/);
    }
  });

  test('arrivalSense() result (if non-null) starts with a capital letter', () => {
    setLocation(ctx, 'workplace');
    const result = ctx.senses.arrivalSense();
    if (result !== null) {
      expect(result).toMatch(/^[A-Z]/);
    }
  });

  test('midSense() result (if non-null) is a non-empty string', () => {
    setLocation(ctx, 'apartment_bedroom');
    const result = ctx.senses.midSense('doing');
    if (result !== null) {
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Determinism: same seed + same state → same output
// ---------------------------------------------------------------------------

describe('senses pipeline — determinism', () => {
  test('identical seed and state produce identical sense() output', () => {
    const ctx1 = createTestContext(42);
    ctx1.state.init();
    ctx1.state.set('adenosine', 75);
    ctx1.state.set('gaba', 50);
    setLocation(ctx1, 'apartment_bedroom');
    const result1 = ctx1.senses.sense();

    const ctx2 = createTestContext(42);
    ctx2.state.init();
    ctx2.state.set('adenosine', 75);
    ctx2.state.set('gaba', 50);
    setLocation(ctx2, 'apartment_bedroom');
    const result2 = ctx2.senses.sense();

    expect(result1).toBe(result2);
  });

  test('different seeds produce potentially different output (not guaranteed equal)', () => {
    // This is a probabilistic check: different seeds almost certainly differ.
    // If both happen to return null, that's fine — null === null is a valid outcome.
    const ctx1 = createTestContext(1);
    ctx1.state.init();
    ctx1.state.set('adenosine', 80);
    setLocation(ctx1, 'apartment_bedroom');
    const result1 = ctx1.senses.sense();

    const ctx2 = createTestContext(99999);
    ctx2.state.init();
    ctx2.state.set('adenosine', 80);
    setLocation(ctx2, 'apartment_bedroom');
    const result2 = ctx2.senses.sense();

    // Results may differ — what we verify is that both are valid types.
    expect(result1 === null || typeof result1 === 'string').toBe(true);
    expect(result2 === null || typeof result2 === 'string').toBe(true);
  });
});
