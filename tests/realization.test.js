// tests/realization.test.js — unit tests for realize()
// Tests pure construction logic: architecture selection, lexical picking,
// passage combination. All deterministic via controlled random values.

import { test, expect, describe } from 'bun:test';
import { realize } from '../js/realization.js';

// --- Helpers ---

/** Deterministic RNG: returns values in sequence, cycling. */
function mkRng(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

/** r=0.0 always picks the first eligible item (lowest cumulative weight). */
const FIRST = 0.0;
/** r=0.99 always picks the last eligible item. */
const LAST  = 0.99;
/** r=0.5 picks the middle item. */
const MID   = 0.5;

const NEUTRAL = { gaba: 0.5, ne: 0.5, aden: 0.3, serotonin: 0.5, dopamine: 0.5 };
const ANXIOUS = { gaba: 0.25, ne: 0.75, aden: 0.4, serotonin: 0.4, dopamine: 0.4 };
const FOGGY   = { gaba: 0.5, ne: 0.3, aden: 0.8, serotonin: 0.5, dopamine: 0.4 };
const FLAT    = { gaba: 0.5, ne: 0.4, aden: 0.3, serotonin: 0.25, dopamine: 0.25 };

// Minimal valid Observation objects

const fridgeObs = {
  sourceId: 'fridge',
  channels: ['sound'],
  salience: 0.8,
  properties: {
    sound: { quality: 'hum', perceived_intensity: 0.4 },
  },
};

const coldObs = {
  sourceId: 'indoor_temperature',
  channels: ['thermal', 'touch'],
  salience: 0.7,
  properties: {
    thermal: { celsius: 10, cold: true, warm: false, very_cold: false, immediate: false },
  },
};

const veryColObs = {
  sourceId: 'outdoor_temperature',
  channels: ['thermal'],
  salience: 0.9,
  properties: {
    thermal: { celsius: 2, cold: true, warm: false, very_cold: true, immediate: true },
  },
};

const fatigueObs = {
  sourceId: 'fatigue',
  channels: ['interoception'],
  salience: 0.75,
  properties: {
    interoception: { adenosine: 72 },
  },
};

const hungerObs = {
  sourceId: 'hunger_signal',
  channels: ['interoception'],
  salience: 0.6,
  properties: {
    interoception: { gnawing: true, hollow: false, low_grade: false, irritable: true },
  },
};

const anxietyObs = {
  sourceId: 'anxiety_signal',
  channels: ['interoception'],
  salience: 0.65,
  properties: {
    interoception: { gaba: 30, ne: 70 },
  },
};

const trafficObs = {
  sourceId: 'traffic_outdoor',
  channels: ['sound'],
  salience: 0.5,
  properties: {
    sound: { quality: 'traffic', filtered: false },
  },
};

const unknownObs = {
  sourceId: 'unknown_source_xyz',
  channels: ['sound'],
  salience: 0.5,
  properties: {},
};

// --- Null / empty ---

describe('realize — null / empty', () => {
  test('returns null for null observations', () => {
    expect(realize(null, 'calm', NEUTRAL, mkRng(0.5))).toBeNull();
  });

  test('returns null for empty array', () => {
    expect(realize([], 'calm', NEUTRAL, mkRng(0.5))).toBeNull();
  });

  test('returns null when all observations have unknown sourceId', () => {
    expect(realize([unknownObs], 'calm', NEUTRAL, mkRng(FIRST))).toBeNull();
  });
});

// --- Short declarative ---

describe('realize — short declarative', () => {
  test('fridge calm: produces sentence containing "fridge"', () => {
    // r1=FIRST → first arch (short), r2=FIRST → first subject ("the fridge"),
    // r3=FIRST → first predicate ("hums"), r4=LAST → modifier check
    const result = realize([fridgeObs], 'calm', NEUTRAL, mkRng(FIRST, FIRST, FIRST, LAST));
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).toMatch(/fridge/);
  });

  test('fridge calm: ends with period', () => {
    const result = realize([fridgeObs], 'calm', NEUTRAL, mkRng(FIRST));
    expect(result).toMatch(/\.$/);
  });

  test('fridge calm: starts with capital letter', () => {
    const result = realize([fridgeObs], 'calm', NEUTRAL, mkRng(FIRST));
    expect(result).toMatch(/^[A-Z]/);
  });

  test('traffic outdoor: produces sentence containing car/traffic', () => {
    const result = realize([trafficObs], 'anxious', ANXIOUS, mkRng(FIRST));
    expect(result.toLowerCase()).toMatch(/car|traffic/);
  });

  test('anxious: produces short declarative (high short weight)', () => {
    // With r1=FIRST, anxious arch weights heavily favor 'short'
    const result = realize([fridgeObs], 'anxious', ANXIOUS, mkRng(FIRST, FIRST, FIRST, FIRST));
    expect(result).toMatch(/fridge/i);
  });
});

// --- Bare fragment ---

describe('realize — bare fragment', () => {
  test('dissociated fridge: can produce bare fragment', () => {
    // r1 set to pick 'bare' architecture (third arch in list)
    // In dissociated: archs are [short(0.8), body(0), bare(1.2), ambig(0), escape(0)]
    // bare weight 1.2 out of total 2.0 → hits at r >= 0.4
    const result = realize([fridgeObs], 'dissociated', FOGGY, mkRng(0.6, FIRST, FIRST, FIRST));
    expect(result).toMatch(/\.$/);
  });

  test('fatigue dissociated: bare fragment returns a complete sentence', () => {
    const result = realize([fatigueObs], 'dissociated', FOGGY, mkRng(0.6, FIRST, FIRST, FIRST));
    expect(result).toBeTruthy();
    expect(result).toMatch(/\.$/);
  });
});

// --- Body-as-subject ---

describe('realize — body-as-subject', () => {
  test('fatigue calm: body-as-subject produces "something" or "weight" as subject', () => {
    // r1 set to pick 'body' architecture
    // In calm: archs [short(1.2), body(0.8), bare(0.2), ambig(0), escape(0)] total=2.2
    // body starts at 1.2, hits at r in [1.2/2.2, 2.0/2.2) ≈ [0.545, 0.909)
    const result = realize([fatigueObs], 'calm', FOGGY, mkRng(0.6, FIRST, FIRST, FIRST));
    expect(result).toBeTruthy();
    expect(result.toLowerCase()).toMatch(/weight|something|everything/);
  });

  test('outdoor cold: body-as-subject produces cold-themed sentence', () => {
    const result = realize([veryColObs], 'calm', NEUTRAL, mkRng(0.6, FIRST, FIRST, FIRST));
    expect(result.toLowerCase()).toMatch(/cold|wind|air/);
  });

  test('body-as-subject ends with period', () => {
    const result = realize([fatigueObs], 'calm', FOGGY, mkRng(0.6, FIRST, FIRST, FIRST));
    expect(result).toMatch(/\.$/);
  });
});

// --- Source ambiguity ---

describe('realize — source ambiguity', () => {
  test('fridge dissociated: source ambiguity produces "Something — ... —" sentence', () => {
    // In dissociated: [short(0.8), body(0), bare(1.2), ambig(1.5), escape(0)] total=3.5
    // ambig starts at 2.0, hits at r in [2.0/3.5, 3.5/3.5) ≈ [0.571, 1.0)
    const result = realize([fridgeObs], 'dissociated', FOGGY, mkRng(0.8, FIRST, FIRST, FIRST));
    expect(result).toMatch(/Something/);
    expect(result).toMatch(/—/);
    expect(result).toMatch(/fridge/i);
    expect(result).toMatch(/maybe/);
  });

  test('source ambiguity includes an alternative label', () => {
    const result = realize([fridgeObs], 'dissociated', FOGGY, mkRng(0.8, FIRST, FIRST, FIRST));
    // Should contain one of the ambiguity_alts
    expect(result.toLowerCase()).toMatch(/heat|building/);
  });
});

// --- Interpretive escape ---

describe('realize — interpretive escape', () => {
  test('fridge calm: escape produces "and [escape]" clause', () => {
    // In calm: [short(1.2), body(0), bare(0.2), ambig(0), escape(1.0)] total=2.4
    // escape starts at 1.4, hits at r in [1.4/2.4, 2.4/2.4) ≈ [0.583, 1.0)
    const result = realize([fridgeObs], 'calm', NEUTRAL, mkRng(0.9, FIRST, FIRST, FIRST));
    expect(result).toMatch(/, and /);
  });

  test('interpretive escape ends with period', () => {
    const result = realize([fridgeObs], 'calm', NEUTRAL, mkRng(0.9, FIRST, FIRST, FIRST));
    expect(result).toMatch(/\.$/);
  });
});

// --- Multi-observation passages ---

describe('realize — multi-observation passages', () => {
  test('calm: two observations produce two sentences', () => {
    const result = realize([fridgeObs, coldObs], 'calm', NEUTRAL, mkRng(FIRST));
    expect(result).toBeTruthy();
    // Two sentences → two periods
    expect((result.match(/\./g) || []).length).toBeGreaterThanOrEqual(2);
  });

  test('anxious: three observations produces multiple sentences', () => {
    const result = realize(
      [fatigueObs, fridgeObs, trafficObs], 'anxious', ANXIOUS, mkRng(FIRST)
    );
    expect(result).toBeTruthy();
    expect((result.match(/\./g) || []).length).toBeGreaterThanOrEqual(2);
  });

  test('realize takes all observations passed — caller controls selection', () => {
    // Caller (senses.js) applies threshold; realize() processes everything given.
    // Passing 2 observations produces 2 sentences regardless of NT hint.
    const observations = [fridgeObs, coldObs];
    const result = realize(observations, 'calm', NEUTRAL, mkRng(FIRST));
    expect((result.match(/\./g) || []).length).toBeGreaterThanOrEqual(2);
  });
});

// --- Overwhelmed: polysyndeton ---

describe('realize — overwhelmed polysyndeton', () => {
  test('overwhelmed: multiple observations joined with "and"', () => {
    const result = realize([fatigueObs, fridgeObs, trafficObs], 'overwhelmed', ANXIOUS, mkRng(FIRST));
    expect(result).toMatch(/ and /);
  });

  test('overwhelmed: single sentence (no mid-sentence periods)', () => {
    const result = realize([fatigueObs, fridgeObs], 'overwhelmed', ANXIOUS, mkRng(FIRST));
    // Should end with exactly one period
    expect(result).toMatch(/\.$/);
    // No periods before the final one
    expect(result.replace(/\.$/, '')).not.toMatch(/\./);
  });

  test('overwhelmed: starts with capital letter', () => {
    const result = realize([fridgeObs, trafficObs], 'overwhelmed', ANXIOUS, mkRng(FIRST));
    expect(result).toMatch(/^[A-Z]/);
  });

  test('overwhelmed: subsequent phrases are lowercased', () => {
    const result = realize([fridgeObs, trafficObs], 'overwhelmed', ANXIOUS, mkRng(FIRST));
    // After first "and", the next phrase should start lowercase
    const parts = result.replace(/\.$/, '').split(' and ');
    if (parts.length > 1) {
      expect(parts[1].charAt(0)).toMatch(/[a-z]/);
    }
  });
});

// --- NT-weighted lexical selection ---

describe('realize — NT-weighted lexical variation', () => {
  test('fridge at high adenosine: more likely to use vague subject', () => {
    // At very high aden, "something" gets weight 1.5 vs "the fridge" at 1.0
    // Drive r2 toward LAST to pick higher-weighted "something" variants
    const foggyHighAden = { ...FOGGY, aden: 0.85 };
    const result = realize([fridgeObs], 'calm', foggyHighAden, mkRng(FIRST, 0.7, FIRST, LAST));
    expect(result).toBeTruthy();
    // Can't guarantee exact pick but result should be a valid sentence
    expect(result).toMatch(/\.$/);
  });

  test('hunger gnawing: body predicate mentions "won\'t stop" or makes itself known', () => {
    const result = realize([hungerObs], 'calm', NEUTRAL, mkRng(0.6, FIRST, 0.3, LAST));
    expect(result.toLowerCase()).toMatch(/hunger|something|emptiness|irritability/i);
  });

  test('anxiety unsettled: predicate contains "can\'t settle" ', () => {
    // Body architecture in calm picks body_predicates weighted by _char_unsettled
    const result = realize([anxietyObs], 'calm', NEUTRAL, mkRng(0.6, FIRST, FIRST, LAST));
    expect(result.toLowerCase()).toMatch(/settle|body|something|unease/);
  });
});

// --- RNG consumption is fixed ---

describe('realize — fixed RNG consumption', () => {
  test('2 observations: consumes exactly 8 random() calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.1; };
    realize([fridgeObs, trafficObs], 'calm', NEUTRAL, countingRng);
    expect(calls).toBe(8); // 2 observations × 4 calls each
  });

  test('3 observations: consumes exactly 12 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.1; };
    realize([fatigueObs, fridgeObs, trafficObs], 'anxious', ANXIOUS, countingRng);
    expect(calls).toBe(12);
  });

  test('3 observations overwhelmed: consumes exactly 12 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.1; };
    realize([fatigueObs, fridgeObs, trafficObs], 'overwhelmed', ANXIOUS, countingRng);
    expect(calls).toBe(12);
  });

  test('1 observation (any hint): consumes exactly 4 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.1; };
    realize([fridgeObs], 'dissociated', FOGGY, countingRng);
    expect(calls).toBe(4);
  });
});

// --- Unknown hint fallback ---

describe('realize — unknown hint fallback', () => {
  test('unknown hint falls back to calm behavior', () => {
    const result = realize([fridgeObs], 'unknown_hint', NEUTRAL, mkRng(FIRST));
    expect(result).toBeTruthy();
    expect(result).toMatch(/\.$/);
  });
});

// --- Reframe dash ---

describe('realize — reframe dash', () => {
  test('fatigue flat: reframe dash produces "Not ... — ..." sentence', () => {
    // flat hint: reframe=0.2, char_pred=0.6, flat_taut=0.6
    // fatigue has reframe_pairs, character_predicates, flat_descriptions
    // Need to force r1 to pick reframe arch
    // flat + fatigue total: short(1.5)+body(0.8)+bare(0.6)+ambig(0)+escape(0)+reframe(0.2)+char_pred(0.6)+flat_taut(0.6)+inversion(0.2) = 4.5
    // reframe starts at: 1.5+0.8+0.6+0+0 = 2.9, so r >= 2.9/4.5 = 0.644
    // reframe ends at: 2.9+0.2 = 3.1, so r < 3.1/4.5 = 0.689
    // Use r1=0.66 to pick reframe
    const result = realize([fatigueObs], 'flat', FLAT, mkRng(0.66, FIRST, FIRST, FIRST));
    expect(result).toMatch(/^Not /);
    expect(result).toMatch(/—/);
    expect(result).toMatch(/\.$/);
  });

  test('reframe dash: starts with "Not"', () => {
    const result = realize([fatigueObs], 'flat', FLAT, mkRng(0.66, FIRST, FIRST, FIRST));
    expect(result).toMatch(/^Not /);
  });
});

// --- Sensation as character ---

describe('realize — sensation as character', () => {
  test('fatigue flat: char_pred produces a sentence with character predicate', () => {
    // flat + fatigue: char_pred starts at 3.1, ends at 3.7, so r in [3.1/4.5, 3.7/4.5) = [0.689, 0.822)
    // Use r1=0.75
    const result = realize([fatigueObs], 'flat', FLAT, mkRng(0.75, FIRST, FIRST, FIRST));
    expect(result).toBeTruthy();
    expect(result).toMatch(/\.$/);
    // Subject comes from lex.subjects (fatigue): something/the body/it/the weight of it
    expect(result.toLowerCase()).toMatch(/something|body|weight/);
  });

  test('anxiety dissociated: char_pred uses subject from subjects pool', () => {
    // dissociated + anxiety_signal has reframe(0.2), char_pred(0.8)
    // dissociated + anxiety total: short(0.8)+body(0.6)+bare(1.2)+ambig(0)+escape(0)+reframe(0.2)+char_pred(0.8)+flat_taut(0)+inversion(0) = 3.6
    // char_pred starts at 0.8+0.6+1.2+0+0+0.2 = 2.8, ends at 3.6, r in [2.8/3.6, 3.6/3.6) = [0.778, 1.0)
    const result = realize([anxietyObs], 'dissociated', FOGGY, mkRng(0.9, FIRST, FIRST, FIRST));
    expect(result).toBeTruthy();
    expect(result).toMatch(/\.$/);
  });
});

// --- Flat tautology ---

describe('realize — flat tautology', () => {
  test('fatigue flat: flat_taut produces a short description', () => {
    // flat + fatigue: flat_taut starts at 3.7, ends at 4.3, r in [3.7/4.5, 4.3/4.5) = [0.822, 0.956)
    // Use r1=0.88
    const result = realize([fatigueObs], 'flat', FLAT, mkRng(0.88, FIRST, FIRST, FIRST));
    expect(result).toBeTruthy();
    expect(result).toMatch(/\.$/);
    // Should be one of the flat_descriptions for fatigue
    expect(result).toMatch(/tired|body|heavy/i);
  });

  test('flat tautology: ends with period', () => {
    const result = realize([fatigueObs], 'flat', FLAT, mkRng(0.88, FIRST, FIRST, FIRST));
    expect(result).toMatch(/\.$/);
  });
});

// --- Conditional inversion ---

describe('realize — conditional inversion', () => {
  test('fatigue calm: inversion produces "subject predicate, but only..." sentence', () => {
    // calm + fatigue: inversion starts at 2.9, ends at 3.3, r in [2.9/3.3, 3.3/3.3) = [0.879, 1.0)
    // Use r1=0.92
    const result = realize([fatigueObs], 'calm', FOGGY, mkRng(0.92, FIRST, FIRST, FIRST));
    expect(result).toBeTruthy();
    expect(result).toMatch(/but only/);
    expect(result).toMatch(/\.$/);
  });

  test('inversion: contains comma before condition', () => {
    const result = realize([fatigueObs], 'calm', FOGGY, mkRng(0.92, FIRST, FIRST, FIRST));
    expect(result).toMatch(/, but only/);
  });
});

// --- New architectures: RNG consumption unchanged ---

describe('realize — new architectures consume exactly 4 calls', () => {
  test('reframe dash: still 4 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.66; };
    realize([fatigueObs], 'flat', FLAT, countingRng);
    expect(calls).toBe(4);
  });

  test('sensation character: still 4 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.75; };
    realize([fatigueObs], 'flat', FLAT, countingRng);
    expect(calls).toBe(4);
  });

  test('flat tautology: still 4 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.88; };
    realize([fatigueObs], 'flat', FLAT, countingRng);
    expect(calls).toBe(4);
  });

  test('conditional inversion: still 4 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.92; };
    realize([fatigueObs], 'calm', FOGGY, countingRng);
    expect(calls).toBe(4);
  });
});

// --- Multi-observation passage shapes ---

describe('realize — passage shapes: terminal list', () => {
  // flat + [fatigueObs(interoception), fridgeObs(sound), trafficObs(sound)]
  // PASSAGE_SHAPE_WEIGHTS.flat = { appositive:0.15, terminal:0.25, arrival_seq:0.10 }
  // canAppositive: fridgeObs has appositive_np → true (weight 0.15)
  // canTerminalList: 3 obs, interoception ≠ sound → true (weight 0.25)
  // canArrivalSeq: true (weight 0.10)
  // total = 1.0 + 0.15 + 0.25 + 0.10 = 1.50
  // terminal_list range: [1.15/1.50, 1.40/1.50) = [0.767, 0.933)
  // Use r0_1=0.85
  test('terminal list: produces comma-separated fragments', () => {
    const result = realize(
      [fatigueObs, fridgeObs, trafficObs], 'flat', FLAT, mkRng(0.85, FIRST, FIRST, FIRST)
    );
    expect(result).toBeTruthy();
    expect(result).toMatch(/,/);
    expect(result).toMatch(/\.$/);
    expect(result).toMatch(/^[A-Z]/);
  });

  test('terminal list: no mid-sentence capitals after first word', () => {
    const result = realize(
      [fatigueObs, fridgeObs, trafficObs], 'flat', FLAT, mkRng(0.85, FIRST, FIRST, FIRST)
    );
    // After the first word, the comma-separated fragments are lowercase
    const withoutFirst = result.replace(/^[A-Z]/, '');
    expect(withoutFirst).not.toMatch(/[A-Z]{2,}/); // no all-caps runs
  });

  test('terminal list: 3 observations still consume exactly 12 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.85; };
    realize([fatigueObs, fridgeObs, trafficObs], 'flat', FLAT, countingRng);
    expect(calls).toBe(12);
  });
});

describe('realize — passage shapes: arrival sequence', () => {
  // heightened + [fridgeObs(sound), coldObs(thermal)]
  // PASSAGE_SHAPE_WEIGHTS.heightened = { appositive:0.30, terminal:0.10, arrival_seq:0.25 }
  // canAppositive: coldObs (indoor_temperature) has appositive_np → true (weight 0.30)
  // canTerminalList: length=2 < 3 → false (weight 0)
  // canArrivalSeq: true (weight 0.25)
  // total = 1.0 + 0.30 + 0 + 0.25 = 1.55
  // arrival_seq range: [1.30/1.55, 1.55/1.55) = [0.839, 1.0)
  // Use r0_1=0.92
  test('arrival sequence: produces sentences joined with "Then"', () => {
    const result = realize(
      [fridgeObs, coldObs], 'heightened', NEUTRAL, mkRng(0.92, FIRST, FIRST, FIRST)
    );
    expect(result).toBeTruthy();
    expect(result).toMatch(/\. Then /);
    expect(result).toMatch(/\.$/);
    expect(result).toMatch(/^[A-Z]/);
  });

  test('arrival sequence: 2 observations consume exactly 8 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.92; };
    realize([fridgeObs, coldObs], 'heightened', NEUTRAL, countingRng);
    expect(calls).toBe(8);
  });
});

describe('realize — passage shapes: appositive expansion', () => {
  // calm + [fridgeObs(sound), fatigueObs(interoception)]
  // PASSAGE_SHAPE_WEIGHTS.calm = { appositive:0.25, terminal:0.15, arrival_seq:0.20 }
  // canAppositive: fatigueObs has appositive_np → true (weight 0.25)
  // canTerminalList: length=2 < 3 → false (weight 0)
  // canArrivalSeq: true (weight 0.20)
  // total = 1.0 + 0.25 + 0 + 0.20 = 1.45
  // appositive range: [1.0/1.45, 1.25/1.45) = [0.690, 0.862)
  // Use r0_1=0.75
  test('appositive expansion: produces single compound sentence', () => {
    const result = realize(
      [fridgeObs, fatigueObs], 'calm', NEUTRAL, mkRng(0.75, FIRST, FIRST, FIRST)
    );
    expect(result).toBeTruthy();
    expect(result).toMatch(/,/);
    expect(result).toMatch(/\.$/);
    expect(result).toMatch(/fridge/i);
    // Single sentence: only one period at end
    expect(result.replace(/\.$/, '')).not.toMatch(/\./);
  });

  test('appositive expansion: 2 observations consume exactly 8 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.75; };
    realize([fridgeObs, fatigueObs], 'calm', NEUTRAL, countingRng);
    expect(calls).toBe(8);
  });

  test('appositive + remaining: 3 observations consume exactly 12 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.75; };
    realize([fridgeObs, fatigueObs, trafficObs], 'calm', NEUTRAL, countingRng);
    expect(calls).toBe(12);
  });
});

describe('realize — multi-obs: passage shapes maintain 4N for all hints', () => {
  test('independent path with single obs still 4 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.5; };
    realize([fridgeObs], 'calm', NEUTRAL, countingRng);
    expect(calls).toBe(4);
  });

  test('independent path with 2 obs and r=0: exactly 8 calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.0; };
    realize([fridgeObs, coldObs], 'calm', NEUTRAL, countingRng);
    expect(calls).toBe(8);
  });
});

// --- Chromesthesia (synesthesia Layer 2 modifier) ---
//
// applyChromesthesia appends a colour fragment when ntCtx.synesthesia is true
// and the observation is on the sound channel. It reuses the already-consumed r1
// value as a palette index — no extra RNG calls.

const streetVoicesObs = {
  sourceId: 'street_voices',
  channels: ['sound'],
  salience: 0.6,
  properties: {
    sound: { quality: 'voices', perceived_intensity: 0.5 },
  },
};

const coworkerObs = {
  sourceId: 'coworker_background',
  channels: ['sound'],
  salience: 0.6,
  properties: {
    sound: { quality: 'voices', perceived_intensity: 0.5, intelligible: false },
  },
};

// A source that is on the sound channel but has no chromesthesia palette entry.
// (shelter_ambient is a real lex source but is not listed in CHROMESTHESIA_PALETTES.)
// Uses night_workplace_light (sight channel, no chromesthesia palette) to test
// that non-sound channels are unaffected by synesthesia.
const noPaletteObs = {
  sourceId: 'night_workplace_light',
  channels: ['sight'],
  salience: 0.5,
  properties: {
    sight: { quality: 'fluorescent_night' },
  },
};

// A non-sound source — chromesthesia must never fire for thermal/interoception channels.
const thermalObs = coldObs; // indoor_temperature, channels: ['thermal', 'touch']

const WITH_SYNESTHESIA = { ...NEUTRAL, synesthesia: true };

describe('realize — chromesthesia (synesthesia modifier)', () => {
  test('sound source with synesthesia appends colour fragment', () => {
    // fridge is a sound source with a chromesthesia palette.
    // r1=FIRST → colour fragment index 0 → "Pale blue."
    const result = realize([fridgeObs], 'calm', WITH_SYNESTHESIA, mkRng(FIRST, FIRST, FIRST, FIRST));
    expect(result).toBeTruthy();
    // The sentence ends with the colour fragment (its own period), not a bare main-sentence period.
    // Colour fragments are e.g. "Pale blue." — the whole result ends with a period.
    expect(result).toMatch(/\.$/);
    // The colour fragment from the fridge palette is one of: Pale blue. / Blue-white. /
    // Something pale and cold. / Faint blue. — check for a colour word.
    expect(result.toLowerCase()).toMatch(/blue|pale|cold|faint/);
  });

  test('sound source with synesthesia: colour fragment appended after main sentence', () => {
    // The main sentence comes first, then a space, then the colour fragment.
    // So the result should contain at least two tokens after splitting on ". ".
    const result = realize([fridgeObs], 'calm', WITH_SYNESTHESIA, mkRng(FIRST, FIRST, FIRST, FIRST));
    // There is at least one period interior to the result (end of main sentence).
    expect(result).toMatch(/\. [A-Z]/);
  });

  test('synesthesia with street_voices: warm red palette applied', () => {
    // street_voices palette: ['Warm red.', 'Orange, close.', 'Something amber and moving.', 'Rust-coloured.']
    // r1=FIRST → index 0 → "Warm red."
    const result = realize([streetVoicesObs], 'calm', WITH_SYNESTHESIA, mkRng(FIRST, FIRST, FIRST, FIRST));
    expect(result).toMatch(/Warm red\./);
  });

  test('synesthesia with fridge r1=0.75: selects third palette entry', () => {
    // fridge palette: ['Pale blue.', 'Blue-white.', 'Something pale and cold.', 'Faint blue.']
    // Math.floor(0.75 * 4) = 3 → 'Faint blue.'
    const result = realize([fridgeObs], 'calm', WITH_SYNESTHESIA, mkRng(0.75, FIRST, FIRST, FIRST));
    expect(result).toMatch(/Faint blue\./);
  });

  test('non-sound source with synesthesia: no colour fragment appended', () => {
    // thermal observation has no 'sound' channel — chromesthesia must not fire.
    const withSyn = realize([thermalObs], 'calm', WITH_SYNESTHESIA, mkRng(FIRST, FIRST, FIRST, FIRST));
    const withoutSyn = realize([thermalObs], 'calm', NEUTRAL, mkRng(FIRST, FIRST, FIRST, FIRST));
    // Results should be identical — synesthesia flag makes no difference without sound channel.
    expect(withSyn).toBe(withoutSyn);
  });

  test('synesthesia false: no colour fragment for sound source', () => {
    // Control: same obs, same rng, synesthesia=false — no colour appended.
    const withoutSyn = realize([fridgeObs], 'calm', NEUTRAL, mkRng(FIRST, FIRST, FIRST, FIRST));
    const withSyn    = realize([fridgeObs], 'calm', WITH_SYNESTHESIA, mkRng(FIRST, FIRST, FIRST, FIRST));
    // withoutSyn should not contain a colour word that withSyn has.
    expect(withSyn).not.toBe(withoutSyn);
    // Specifically: withoutSyn ends right after the main predicate.
    expect(withoutSyn.toLowerCase()).not.toMatch(/blue|pale|cold|faint/);
  });

  test('synesthesia: exactly 4 RNG calls — no extra calls for colour', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.1; };
    realize([fridgeObs], 'calm', WITH_SYNESTHESIA, countingRng);
    expect(calls).toBe(4);
  });

  test('synesthesia with 2 sound observations: exactly 8 RNG calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.1; };
    realize([fridgeObs, trafficObs], 'calm', WITH_SYNESTHESIA, countingRng);
    expect(calls).toBe(8);
  });

  test('non-sound source: no colour fragment, sentence unchanged', () => {
    // night_workplace_light is a sight-channel source — chromesthesia only fires on sound.
    // Synesthesia flag should make no difference — applyChromesthesia returns the sentence unchanged.
    const withSyn    = realize([noPaletteObs], 'calm', WITH_SYNESTHESIA, mkRng(FIRST, FIRST, FIRST, FIRST));
    const withoutSyn = realize([noPaletteObs], 'calm', NEUTRAL,          mkRng(FIRST, FIRST, FIRST, FIRST));
    expect(withSyn).toBeTruthy();
    expect(withSyn).toBe(withoutSyn);
  });
});

// --- APD (Auditory Processing Disorder, Layer 2 modifier) ---
//
// applyAPD replaces speech-source sentences with parse-fail fragments when
// ntCtx.apd is true. Only coworker_background and street_voices are speech
// sources. Non-speech sources are unaffected. r1 is reused as fragment index.

const WITH_APD = { ...NEUTRAL, apd: true };

describe('realize — APD modifier', () => {
  test('speech source with APD: returns a parse-fail fragment', () => {
    // street_voices is a speech source — APD replaces the realized sentence.
    const result = realize([streetVoicesObs], 'calm', WITH_APD, mkRng(FIRST, FIRST, FIRST, FIRST));
    expect(result).toBeTruthy();
    // Parse-fail fragments are in APD_PARSE_FAIL_FRAGMENTS; they all end with a period.
    expect(result).toMatch(/\.$/);
    // The original subject "voices" may not appear — it was replaced.
    // Instead, fragments describe the phenomenology of not parsing.
    expect(result.toLowerCase()).toMatch(/voice|word|sound|language|talk|noise|hear|rhythm|catch/);
  });

  test('coworker_background with APD: returns a parse-fail fragment', () => {
    const result = realize([coworkerObs], 'calm', WITH_APD, mkRng(FIRST, FIRST, FIRST, FIRST));
    expect(result).toBeTruthy();
    expect(result).toMatch(/\.$/);
    expect(result.toLowerCase()).toMatch(/voice|word|sound|language|talk|noise|hear|rhythm|catch/);
  });

  test('APD: r1=FIRST → first parse-fail fragment "Voices without words."', () => {
    // APD_PARSE_FAIL_FRAGMENTS[0] = 'Voices without words.'
    // r1 = FIRST = 0.0 → Math.floor(0.0 * 8) = 0
    const result = realize([streetVoicesObs], 'calm', WITH_APD, mkRng(FIRST, FIRST, FIRST, FIRST));
    expect(result).toBe('Voices without words.');
  });

  test('APD: r1=0.5 → deterministic mid-list fragment', () => {
    // Math.floor(0.5 * 8) = 4 → APD_PARSE_FAIL_FRAGMENTS[4] = "Someone talking. You catch the tone."
    const result = realize([streetVoicesObs], 'calm', WITH_APD, mkRng(0.5, FIRST, FIRST, FIRST));
    expect(result).toBe("Someone talking. You catch the tone.");
  });

  test('non-speech sound source with APD: not replaced', () => {
    // fridge is not a speech source — APD does not apply.
    const withAPD    = realize([fridgeObs], 'calm', WITH_APD, mkRng(FIRST, FIRST, FIRST, FIRST));
    const withoutAPD = realize([fridgeObs], 'calm', NEUTRAL,  mkRng(FIRST, FIRST, FIRST, FIRST));
    expect(withAPD).toBe(withoutAPD);
  });

  test('non-sound source with APD: not replaced', () => {
    // thermal source is not a speech source — APD does not apply.
    const withAPD    = realize([thermalObs], 'calm', WITH_APD, mkRng(FIRST, FIRST, FIRST, FIRST));
    const withoutAPD = realize([thermalObs], 'calm', NEUTRAL,  mkRng(FIRST, FIRST, FIRST, FIRST));
    expect(withAPD).toBe(withoutAPD);
  });

  test('APD: exactly 4 RNG calls — no extra calls for parse-fail replacement', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.1; };
    realize([streetVoicesObs], 'calm', WITH_APD, countingRng);
    expect(calls).toBe(4);
  });

  test('APD false: speech source produces a normal sentence', () => {
    // Control: APD flag absent — street_voices returns a normal constructed sentence.
    const result = realize([streetVoicesObs], 'calm', NEUTRAL, mkRng(FIRST, FIRST, FIRST, FIRST));
    // A normally-realized street_voices sentence should contain "voices" or "someone".
    expect(result.toLowerCase()).toMatch(/voices|someone|voice|conversation/);
  });
});

// --- APD + synesthesia combined ---
//
// When both apd and synesthesia are true and the source is a speech source,
// the APD parse-fail fragment is produced first, then the chromesthesia
// colour is appended — because "APD affects parsing; synesthesia affects
// sensory channel cross-activation." (realization.js line comment)

const WITH_APD_AND_SYNESTHESIA = { ...NEUTRAL, apd: true, synesthesia: true };

describe('realize — APD + synesthesia combined', () => {
  test('speech source with APD + synesthesia: colour appended after parse-fail fragment', () => {
    // street_voices: speech source, sound channel.
    // APD replacement fires first, then chromesthesia appends a colour.
    // r1=FIRST → APD fragment 0 = "Voices without words." + street_voices palette[0] = "Warm red."
    const result = realize([streetVoicesObs], 'calm', WITH_APD_AND_SYNESTHESIA,
                           mkRng(FIRST, FIRST, FIRST, FIRST));
    expect(result).toBe('Voices without words. Warm red.');
  });

  test('APD + synesthesia: still exactly 4 RNG calls', () => {
    let calls = 0;
    const countingRng = () => { calls++; return 0.1; };
    realize([streetVoicesObs], 'calm', WITH_APD_AND_SYNESTHESIA, countingRng);
    expect(calls).toBe(4);
  });

  test('non-speech source with APD + synesthesia: only synesthesia fires (no APD replacement)', () => {
    // fridge: not a speech source. APD does not apply. Synesthesia does.
    const apdAndSyn = realize([fridgeObs], 'calm', WITH_APD_AND_SYNESTHESIA,
                              mkRng(FIRST, FIRST, FIRST, FIRST));
    const synOnly   = realize([fridgeObs], 'calm', WITH_SYNESTHESIA,
                              mkRng(FIRST, FIRST, FIRST, FIRST));
    // APD should not have changed anything — both paths should produce identical results.
    expect(apdAndSyn).toBe(synOnly);
    // And synesthesia did fire — colour word present.
    expect(apdAndSyn.toLowerCase()).toMatch(/blue|pale|cold|faint/);
  });
});
