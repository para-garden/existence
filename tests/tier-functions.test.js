// tests/tier-functions.test.js — boundary tests for all exported tier functions in state.js
// Tests every tier label with values just below, at, and just above each threshold.
// The tier() helper uses `value <= max`, so the boundary value itself belongs to the
// lower tier (e.g. energy=10 → 'depleted', energy=11 → 'exhausted').

import { describe, test, expect, beforeEach } from 'bun:test';
import { createTestContext } from '../js/test-context.js';

// ---------------------------------------------------------------------------
// energyTier: [10→depleted, 25→exhausted, 45→tired, 65→okay, 85→rested, 100→alert]
// ---------------------------------------------------------------------------
describe('energyTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('depleted at 0', () => { ctx.state.set('energy', 0); expect(ctx.state.energyTier()).toBe('depleted'); });
  test('depleted at 10', () => { ctx.state.set('energy', 10); expect(ctx.state.energyTier()).toBe('depleted'); });
  test('exhausted at 11', () => { ctx.state.set('energy', 11); expect(ctx.state.energyTier()).toBe('exhausted'); });
  test('exhausted at 25', () => { ctx.state.set('energy', 25); expect(ctx.state.energyTier()).toBe('exhausted'); });
  test('tired at 26', () => { ctx.state.set('energy', 26); expect(ctx.state.energyTier()).toBe('tired'); });
  test('tired at 45', () => { ctx.state.set('energy', 45); expect(ctx.state.energyTier()).toBe('tired'); });
  test('okay at 46', () => { ctx.state.set('energy', 46); expect(ctx.state.energyTier()).toBe('okay'); });
  test('okay at 65', () => { ctx.state.set('energy', 65); expect(ctx.state.energyTier()).toBe('okay'); });
  test('rested at 66', () => { ctx.state.set('energy', 66); expect(ctx.state.energyTier()).toBe('rested'); });
  test('rested at 85', () => { ctx.state.set('energy', 85); expect(ctx.state.energyTier()).toBe('rested'); });
  test('alert at 86', () => { ctx.state.set('energy', 86); expect(ctx.state.energyTier()).toBe('alert'); });
  test('alert at 100', () => { ctx.state.set('energy', 100); expect(ctx.state.energyTier()).toBe('alert'); });
});

// ---------------------------------------------------------------------------
// stressTier: [15→calm, 35→baseline, 55→tense, 75→strained, 100→overwhelmed]
// ---------------------------------------------------------------------------
describe('stressTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('calm at 0', () => { ctx.state.set('stress', 0); expect(ctx.state.stressTier()).toBe('calm'); });
  test('calm at 15', () => { ctx.state.set('stress', 15); expect(ctx.state.stressTier()).toBe('calm'); });
  test('baseline at 16', () => { ctx.state.set('stress', 16); expect(ctx.state.stressTier()).toBe('baseline'); });
  test('baseline at 35', () => { ctx.state.set('stress', 35); expect(ctx.state.stressTier()).toBe('baseline'); });
  test('tense at 36', () => { ctx.state.set('stress', 36); expect(ctx.state.stressTier()).toBe('tense'); });
  test('tense at 55', () => { ctx.state.set('stress', 55); expect(ctx.state.stressTier()).toBe('tense'); });
  test('strained at 56', () => { ctx.state.set('stress', 56); expect(ctx.state.stressTier()).toBe('strained'); });
  test('strained at 75', () => { ctx.state.set('stress', 75); expect(ctx.state.stressTier()).toBe('strained'); });
  test('overwhelmed at 76', () => { ctx.state.set('stress', 76); expect(ctx.state.stressTier()).toBe('overwhelmed'); });
  test('overwhelmed at 100', () => { ctx.state.set('stress', 100); expect(ctx.state.stressTier()).toBe('overwhelmed'); });
});

// ---------------------------------------------------------------------------
// hungerTier: [15→satisfied, 35→fine, 55→hungry, 75→very_hungry, 100→starving]
// ---------------------------------------------------------------------------
describe('hungerTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('satisfied at 0', () => { ctx.state.set('hunger', 0); expect(ctx.state.hungerTier()).toBe('satisfied'); });
  test('satisfied at 15', () => { ctx.state.set('hunger', 15); expect(ctx.state.hungerTier()).toBe('satisfied'); });
  test('fine at 16', () => { ctx.state.set('hunger', 16); expect(ctx.state.hungerTier()).toBe('fine'); });
  test('fine at 35', () => { ctx.state.set('hunger', 35); expect(ctx.state.hungerTier()).toBe('fine'); });
  test('hungry at 36', () => { ctx.state.set('hunger', 36); expect(ctx.state.hungerTier()).toBe('hungry'); });
  test('hungry at 55', () => { ctx.state.set('hunger', 55); expect(ctx.state.hungerTier()).toBe('hungry'); });
  test('very_hungry at 56', () => { ctx.state.set('hunger', 56); expect(ctx.state.hungerTier()).toBe('very_hungry'); });
  test('very_hungry at 75', () => { ctx.state.set('hunger', 75); expect(ctx.state.hungerTier()).toBe('very_hungry'); });
  test('starving at 76', () => { ctx.state.set('hunger', 76); expect(ctx.state.hungerTier()).toBe('starving'); });
  test('starving at 100', () => { ctx.state.set('hunger', 100); expect(ctx.state.hungerTier()).toBe('starving'); });
});

// ---------------------------------------------------------------------------
// socialTier: [15→isolated, 35→withdrawn, 55→neutral, 75→connected, 100→warm]
// ---------------------------------------------------------------------------
describe('socialTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('isolated at 0', () => { ctx.state.set('social', 0); expect(ctx.state.socialTier()).toBe('isolated'); });
  test('isolated at 15', () => { ctx.state.set('social', 15); expect(ctx.state.socialTier()).toBe('isolated'); });
  test('withdrawn at 16', () => { ctx.state.set('social', 16); expect(ctx.state.socialTier()).toBe('withdrawn'); });
  test('withdrawn at 35', () => { ctx.state.set('social', 35); expect(ctx.state.socialTier()).toBe('withdrawn'); });
  test('neutral at 36', () => { ctx.state.set('social', 36); expect(ctx.state.socialTier()).toBe('neutral'); });
  test('neutral at 55', () => { ctx.state.set('social', 55); expect(ctx.state.socialTier()).toBe('neutral'); });
  test('connected at 56', () => { ctx.state.set('social', 56); expect(ctx.state.socialTier()).toBe('connected'); });
  test('connected at 75', () => { ctx.state.set('social', 75); expect(ctx.state.socialTier()).toBe('connected'); });
  test('warm at 76', () => { ctx.state.set('social', 76); expect(ctx.state.socialTier()).toBe('warm'); });
  test('warm at 100', () => { ctx.state.set('social', 100); expect(ctx.state.socialTier()).toBe('warm'); });
});

// ---------------------------------------------------------------------------
// moneyTier: overdrawn(<0), broke(0), scraping(<50), tight(<200), careful(<600),
//            okay(<1500), comfortable(<5000), cushioned(>=5000)
// ---------------------------------------------------------------------------
describe('moneyTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('overdrawn at -1', () => { ctx.state.set('money', -1); expect(ctx.state.moneyTier()).toBe('overdrawn'); });
  test('overdrawn at -100', () => { ctx.state.set('money', -100); expect(ctx.state.moneyTier()).toBe('overdrawn'); });
  test('broke at 0', () => { ctx.state.set('money', 0); expect(ctx.state.moneyTier()).toBe('broke'); });
  test('scraping at 1', () => { ctx.state.set('money', 1); expect(ctx.state.moneyTier()).toBe('scraping'); });
  test('scraping at 49', () => { ctx.state.set('money', 49); expect(ctx.state.moneyTier()).toBe('scraping'); });
  test('tight at 50', () => { ctx.state.set('money', 50); expect(ctx.state.moneyTier()).toBe('tight'); });
  test('tight at 199', () => { ctx.state.set('money', 199); expect(ctx.state.moneyTier()).toBe('tight'); });
  test('careful at 200', () => { ctx.state.set('money', 200); expect(ctx.state.moneyTier()).toBe('careful'); });
  test('careful at 599', () => { ctx.state.set('money', 599); expect(ctx.state.moneyTier()).toBe('careful'); });
  test('okay at 600', () => { ctx.state.set('money', 600); expect(ctx.state.moneyTier()).toBe('okay'); });
  test('okay at 1499', () => { ctx.state.set('money', 1499); expect(ctx.state.moneyTier()).toBe('okay'); });
  test('comfortable at 1500', () => { ctx.state.set('money', 1500); expect(ctx.state.moneyTier()).toBe('comfortable'); });
  test('comfortable at 4999', () => { ctx.state.set('money', 4999); expect(ctx.state.moneyTier()).toBe('comfortable'); });
  test('cushioned at 5000', () => { ctx.state.set('money', 5000); expect(ctx.state.moneyTier()).toBe('cushioned'); });
  test('cushioned at 10000', () => { ctx.state.set('money', 10000); expect(ctx.state.moneyTier()).toBe('cushioned'); });
});

// ---------------------------------------------------------------------------
// jobTier: [20→at_risk, 40→shaky, 55→adequate, 75→solid, 100→valued]
// ---------------------------------------------------------------------------
describe('jobTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('at_risk at 0', () => { ctx.state.set('job_standing', 0); expect(ctx.state.jobTier()).toBe('at_risk'); });
  test('at_risk at 20', () => { ctx.state.set('job_standing', 20); expect(ctx.state.jobTier()).toBe('at_risk'); });
  test('shaky at 21', () => { ctx.state.set('job_standing', 21); expect(ctx.state.jobTier()).toBe('shaky'); });
  test('shaky at 40', () => { ctx.state.set('job_standing', 40); expect(ctx.state.jobTier()).toBe('shaky'); });
  test('adequate at 41', () => { ctx.state.set('job_standing', 41); expect(ctx.state.jobTier()).toBe('adequate'); });
  test('adequate at 55', () => { ctx.state.set('job_standing', 55); expect(ctx.state.jobTier()).toBe('adequate'); });
  test('solid at 56', () => { ctx.state.set('job_standing', 56); expect(ctx.state.jobTier()).toBe('solid'); });
  test('solid at 75', () => { ctx.state.set('job_standing', 75); expect(ctx.state.jobTier()).toBe('solid'); });
  test('valued at 76', () => { ctx.state.set('job_standing', 76); expect(ctx.state.jobTier()).toBe('valued'); });
  test('valued at 100', () => { ctx.state.set('job_standing', 100); expect(ctx.state.jobTier()).toBe('valued'); });
});

// ---------------------------------------------------------------------------
// batteryTier: dead(<=0), critical(<=5), low(<=15), good(<=50), full(>50)
// Note: uses strict inequalities, not the tier() helper.
// ---------------------------------------------------------------------------
describe('batteryTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('dead at 0', () => { ctx.state.set('phone_battery', 0); expect(ctx.state.batteryTier()).toBe('dead'); });
  test('dead at -1', () => { ctx.state.set('phone_battery', -1); expect(ctx.state.batteryTier()).toBe('dead'); });
  test('critical at 1', () => { ctx.state.set('phone_battery', 1); expect(ctx.state.batteryTier()).toBe('critical'); });
  test('critical at 5', () => { ctx.state.set('phone_battery', 5); expect(ctx.state.batteryTier()).toBe('critical'); });
  test('low at 6', () => { ctx.state.set('phone_battery', 6); expect(ctx.state.batteryTier()).toBe('low'); });
  test('low at 15', () => { ctx.state.set('phone_battery', 15); expect(ctx.state.batteryTier()).toBe('low'); });
  test('good at 16', () => { ctx.state.set('phone_battery', 16); expect(ctx.state.batteryTier()).toBe('good'); });
  test('good at 50', () => { ctx.state.set('phone_battery', 50); expect(ctx.state.batteryTier()).toBe('good'); });
  test('full at 51', () => { ctx.state.set('phone_battery', 51); expect(ctx.state.batteryTier()).toBe('full'); });
  test('full at 100', () => { ctx.state.set('phone_battery', 100); expect(ctx.state.batteryTier()).toBe('full'); });
});

// ---------------------------------------------------------------------------
// sleepDebtTier: none(<=60), mild(<=240), moderate(<=720), severe(>720)
// ---------------------------------------------------------------------------
describe('sleepDebtTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => { ctx.state.set('sleep_debt', 0); expect(ctx.state.sleepDebtTier()).toBe('none'); });
  test('none at 60', () => { ctx.state.set('sleep_debt', 60); expect(ctx.state.sleepDebtTier()).toBe('none'); });
  test('mild at 61', () => { ctx.state.set('sleep_debt', 61); expect(ctx.state.sleepDebtTier()).toBe('mild'); });
  test('mild at 240', () => { ctx.state.set('sleep_debt', 240); expect(ctx.state.sleepDebtTier()).toBe('mild'); });
  test('moderate at 241', () => { ctx.state.set('sleep_debt', 241); expect(ctx.state.sleepDebtTier()).toBe('moderate'); });
  test('moderate at 720', () => { ctx.state.set('sleep_debt', 720); expect(ctx.state.sleepDebtTier()).toBe('moderate'); });
  test('severe at 721', () => { ctx.state.set('sleep_debt', 721); expect(ctx.state.sleepDebtTier()).toBe('severe'); });
  test('severe at 4800', () => { ctx.state.set('sleep_debt', 4800); expect(ctx.state.sleepDebtTier()).toBe('severe'); });
});

// ---------------------------------------------------------------------------
// moodTone — composite; tests physical overrides first, then NT-driven paths.
// Sets NT state directly using State.set(). All 8 tones: fraying, numb, heavy,
// hollow, quiet, clear, present, flat.
// ---------------------------------------------------------------------------
describe('moodTone', () => {
  let ctx;

  // Helper: set all NT values to a neutral baseline first, then override specific ones.
  function setNeutral(state) {
    state.set('stress', 30);
    state.set('energy', 70);
    state.set('serotonin', 55);
    state.set('dopamine', 55);
    state.set('norepinephrine', 45);
    state.set('gaba', 55);
    state.set('social', 50);
  }

  beforeEach(() => {
    ctx = createTestContext();
    setNeutral(ctx.state);
  });

  test('fraying: stress > 75 (physical override)', () => {
    ctx.state.set('stress', 76);
    expect(ctx.state.moodTone()).toBe('fraying');
  });

  test('fraying: stress exactly 75 does NOT trigger fraying override', () => {
    ctx.state.set('stress', 75);
    // stress=75 is not > 75, so this override doesn't fire
    expect(ctx.state.moodTone()).not.toBe('fraying');
  });

  test('numb: energy <= 15 AND stress > 60', () => {
    ctx.state.set('energy', 15);
    ctx.state.set('stress', 61);
    expect(ctx.state.moodTone()).toBe('numb');
  });

  test('numb: energy=16 with stress=65 does NOT trigger numb override', () => {
    ctx.state.set('energy', 16);
    ctx.state.set('stress', 65);
    expect(ctx.state.moodTone()).not.toBe('numb');
  });

  test('fraying: NE > 65 AND GABA < 35 (neurochemical)', () => {
    ctx.state.set('norepinephrine', 66);
    ctx.state.set('gaba', 34);
    expect(ctx.state.moodTone()).toBe('fraying');
  });

  test('numb: serotonin < 25 AND dopamine < 25 (neurochemical)', () => {
    ctx.state.set('serotonin', 24);
    ctx.state.set('dopamine', 24);
    expect(ctx.state.moodTone()).toBe('numb');
  });

  test('heavy: energy <= 25 AND serotonin < 40', () => {
    ctx.state.set('energy', 25);
    ctx.state.set('serotonin', 39);
    expect(ctx.state.moodTone()).toBe('heavy');
  });

  test('heavy: serotonin < 35 AND dopamine < 35', () => {
    ctx.state.set('serotonin', 34);
    ctx.state.set('dopamine', 34);
    expect(ctx.state.moodTone()).toBe('heavy');
  });

  test('hollow: serotonin < 40 AND social <= 20', () => {
    ctx.state.set('serotonin', 39);
    ctx.state.set('social', 20);
    expect(ctx.state.moodTone()).toBe('hollow');
  });

  test('quiet: social <= 20 AND NE > 35', () => {
    ctx.state.set('social', 20);
    ctx.state.set('norepinephrine', 36);
    // Set serotonin above hollow threshold so hollow doesn't fire
    ctx.state.set('serotonin', 50);
    expect(ctx.state.moodTone()).toBe('quiet');
  });

  test('clear: serotonin>65, dopamine>65, NE 30<ne<60, GABA>45', () => {
    ctx.state.set('serotonin', 66);
    ctx.state.set('dopamine', 66);
    ctx.state.set('norepinephrine', 45);
    ctx.state.set('gaba', 46);
    ctx.state.set('social', 60);
    expect(ctx.state.moodTone()).toBe('clear');
  });

  test('clear: NE at boundary 60 does NOT qualify (requires ne < 60)', () => {
    ctx.state.set('serotonin', 70);
    ctx.state.set('dopamine', 70);
    ctx.state.set('norepinephrine', 60);
    ctx.state.set('gaba', 50);
    ctx.state.set('social', 60);
    expect(ctx.state.moodTone()).not.toBe('clear');
  });

  test('present: serotonin > 45 AND dopamine > 42', () => {
    ctx.state.set('serotonin', 46);
    ctx.state.set('dopamine', 43);
    ctx.state.set('norepinephrine', 45);
    ctx.state.set('gaba', 55);
    ctx.state.set('social', 60);
    // Not high enough for clear (serotonin not >65)
    expect(ctx.state.moodTone()).toBe('present');
  });

  test('flat: moderate NT, nothing special triggered', () => {
    // Neutral NT in mid ranges — no override conditions fire
    ctx.state.set('serotonin', 45);
    ctx.state.set('dopamine', 42);
    ctx.state.set('norepinephrine', 45);
    ctx.state.set('gaba', 55);
    ctx.state.set('social', 50);
    // serotonin=45 not >45, dopamine=42 not >42 → present doesn't fire → flat
    expect(ctx.state.moodTone()).toBe('flat');
  });
});

// ---------------------------------------------------------------------------
// alcoholTier: none(<5), low(<25), medium(<50), high(>=50)
// ---------------------------------------------------------------------------
describe('alcoholTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => { ctx.state.set('alcohol_level', 0); expect(ctx.state.alcoholTier()).toBe('none'); });
  test('none at 4', () => { ctx.state.set('alcohol_level', 4); expect(ctx.state.alcoholTier()).toBe('none'); });
  test('low at 5', () => { ctx.state.set('alcohol_level', 5); expect(ctx.state.alcoholTier()).toBe('low'); });
  test('low at 24', () => { ctx.state.set('alcohol_level', 24); expect(ctx.state.alcoholTier()).toBe('low'); });
  test('medium at 25', () => { ctx.state.set('alcohol_level', 25); expect(ctx.state.alcoholTier()).toBe('medium'); });
  test('medium at 49', () => { ctx.state.set('alcohol_level', 49); expect(ctx.state.alcoholTier()).toBe('medium'); });
  test('high at 50', () => { ctx.state.set('alcohol_level', 50); expect(ctx.state.alcoholTier()).toBe('high'); });
  test('high at 100', () => { ctx.state.set('alcohol_level', 100); expect(ctx.state.alcoholTier()).toBe('high'); });
});

// ---------------------------------------------------------------------------
// nicotineTier: none(<8), low(<25), active(<60), high(>=60)
// ---------------------------------------------------------------------------
describe('nicotineTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => { ctx.state.set('nicotine_level', 0); expect(ctx.state.nicotineTier()).toBe('none'); });
  test('none at 7', () => { ctx.state.set('nicotine_level', 7); expect(ctx.state.nicotineTier()).toBe('none'); });
  test('low at 8', () => { ctx.state.set('nicotine_level', 8); expect(ctx.state.nicotineTier()).toBe('low'); });
  test('low at 24', () => { ctx.state.set('nicotine_level', 24); expect(ctx.state.nicotineTier()).toBe('low'); });
  test('active at 25', () => { ctx.state.set('nicotine_level', 25); expect(ctx.state.nicotineTier()).toBe('active'); });
  test('active at 59', () => { ctx.state.set('nicotine_level', 59); expect(ctx.state.nicotineTier()).toBe('active'); });
  test('high at 60', () => { ctx.state.set('nicotine_level', 60); expect(ctx.state.nicotineTier()).toBe('high'); });
  test('high at 100', () => { ctx.state.set('nicotine_level', 100); expect(ctx.state.nicotineTier()).toBe('high'); });
});

// ---------------------------------------------------------------------------
// cannabisTier: none(<8), low(<30), active(<60), high(>=60)
// ---------------------------------------------------------------------------
describe('cannabisTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => { ctx.state.set('cannabis_level', 0); expect(ctx.state.cannabisTier()).toBe('none'); });
  test('none at 7', () => { ctx.state.set('cannabis_level', 7); expect(ctx.state.cannabisTier()).toBe('none'); });
  test('low at 8', () => { ctx.state.set('cannabis_level', 8); expect(ctx.state.cannabisTier()).toBe('low'); });
  test('low at 29', () => { ctx.state.set('cannabis_level', 29); expect(ctx.state.cannabisTier()).toBe('low'); });
  test('active at 30', () => { ctx.state.set('cannabis_level', 30); expect(ctx.state.cannabisTier()).toBe('active'); });
  test('active at 59', () => { ctx.state.set('cannabis_level', 59); expect(ctx.state.cannabisTier()).toBe('active'); });
  test('high at 60', () => { ctx.state.set('cannabis_level', 60); expect(ctx.state.cannabisTier()).toBe('high'); });
  test('high at 100', () => { ctx.state.set('cannabis_level', 100); expect(ctx.state.cannabisTier()).toBe('high'); });
});

// ---------------------------------------------------------------------------
// clothingCleanlinessTier: [35→dirty, 60→stale, 80→worn, 100→fresh]
// ---------------------------------------------------------------------------
describe('clothingCleanlinessTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('dirty at 0', () => { ctx.state.set('clothing_cleanliness', 0); expect(ctx.state.clothingCleanlinessTier()).toBe('dirty'); });
  test('dirty at 35', () => { ctx.state.set('clothing_cleanliness', 35); expect(ctx.state.clothingCleanlinessTier()).toBe('dirty'); });
  test('stale at 36', () => { ctx.state.set('clothing_cleanliness', 36); expect(ctx.state.clothingCleanlinessTier()).toBe('stale'); });
  test('stale at 60', () => { ctx.state.set('clothing_cleanliness', 60); expect(ctx.state.clothingCleanlinessTier()).toBe('stale'); });
  test('worn at 61', () => { ctx.state.set('clothing_cleanliness', 61); expect(ctx.state.clothingCleanlinessTier()).toBe('worn'); });
  test('worn at 80', () => { ctx.state.set('clothing_cleanliness', 80); expect(ctx.state.clothingCleanlinessTier()).toBe('worn'); });
  test('fresh at 81', () => { ctx.state.set('clothing_cleanliness', 81); expect(ctx.state.clothingCleanlinessTier()).toBe('fresh'); });
  test('fresh at 100', () => { ctx.state.set('clothing_cleanliness', 100); expect(ctx.state.clothingCleanlinessTier()).toBe('fresh'); });
});

// ---------------------------------------------------------------------------
// caffeineTier: none(<10), low(<35), active(<70), high(>=70)
// ---------------------------------------------------------------------------
describe('caffeineTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => { ctx.state.set('caffeine_level', 0); expect(ctx.state.caffeineTier()).toBe('none'); });
  test('none at 9', () => { ctx.state.set('caffeine_level', 9); expect(ctx.state.caffeineTier()).toBe('none'); });
  test('low at 10', () => { ctx.state.set('caffeine_level', 10); expect(ctx.state.caffeineTier()).toBe('low'); });
  test('low at 34', () => { ctx.state.set('caffeine_level', 34); expect(ctx.state.caffeineTier()).toBe('low'); });
  test('active at 35', () => { ctx.state.set('caffeine_level', 35); expect(ctx.state.caffeineTier()).toBe('active'); });
  test('active at 69', () => { ctx.state.set('caffeine_level', 69); expect(ctx.state.caffeineTier()).toBe('active'); });
  test('high at 70', () => { ctx.state.set('caffeine_level', 70); expect(ctx.state.caffeineTier()).toBe('high'); });
  test('high at 100', () => { ctx.state.set('caffeine_level', 100); expect(ctx.state.caffeineTier()).toBe('high'); });
});

// ---------------------------------------------------------------------------
// withdrawalTier (caffeine withdrawal): none(<15), mild(<40), moderate(<70), severe(>=70)
// ---------------------------------------------------------------------------
describe('withdrawalTier (caffeine)', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => { ctx.state.set('caffeine_withdrawal', 0); expect(ctx.state.withdrawalTier()).toBe('none'); });
  test('none at 14', () => { ctx.state.set('caffeine_withdrawal', 14); expect(ctx.state.withdrawalTier()).toBe('none'); });
  test('mild at 15', () => { ctx.state.set('caffeine_withdrawal', 15); expect(ctx.state.withdrawalTier()).toBe('mild'); });
  test('mild at 39', () => { ctx.state.set('caffeine_withdrawal', 39); expect(ctx.state.withdrawalTier()).toBe('mild'); });
  test('moderate at 40', () => { ctx.state.set('caffeine_withdrawal', 40); expect(ctx.state.withdrawalTier()).toBe('moderate'); });
  test('moderate at 69', () => { ctx.state.set('caffeine_withdrawal', 69); expect(ctx.state.withdrawalTier()).toBe('moderate'); });
  test('severe at 70', () => { ctx.state.set('caffeine_withdrawal', 70); expect(ctx.state.withdrawalTier()).toBe('severe'); });
  test('severe at 100', () => { ctx.state.set('caffeine_withdrawal', 100); expect(ctx.state.withdrawalTier()).toBe('severe'); });
});

// ---------------------------------------------------------------------------
// nicotineWithdrawalTier: none(<15), mild(<40), moderate(<70), severe(>=70)
// ---------------------------------------------------------------------------
describe('nicotineWithdrawalTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => { ctx.state.set('nicotine_withdrawal', 0); expect(ctx.state.nicotineWithdrawalTier()).toBe('none'); });
  test('none at 14', () => { ctx.state.set('nicotine_withdrawal', 14); expect(ctx.state.nicotineWithdrawalTier()).toBe('none'); });
  test('mild at 15', () => { ctx.state.set('nicotine_withdrawal', 15); expect(ctx.state.nicotineWithdrawalTier()).toBe('mild'); });
  test('mild at 39', () => { ctx.state.set('nicotine_withdrawal', 39); expect(ctx.state.nicotineWithdrawalTier()).toBe('mild'); });
  test('moderate at 40', () => { ctx.state.set('nicotine_withdrawal', 40); expect(ctx.state.nicotineWithdrawalTier()).toBe('moderate'); });
  test('moderate at 69', () => { ctx.state.set('nicotine_withdrawal', 69); expect(ctx.state.nicotineWithdrawalTier()).toBe('moderate'); });
  test('severe at 70', () => { ctx.state.set('nicotine_withdrawal', 70); expect(ctx.state.nicotineWithdrawalTier()).toBe('severe'); });
  test('severe at 100', () => { ctx.state.set('nicotine_withdrawal', 100); expect(ctx.state.nicotineWithdrawalTier()).toBe('severe'); });
});

// ---------------------------------------------------------------------------
// alcoholWithdrawalTier: none(<15), mild(<40), moderate(<70), then at >=70:
//   dangerous if tolerance>65, else severe
// ---------------------------------------------------------------------------
describe('alcoholWithdrawalTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => {
    ctx.state.set('alcohol_withdrawal', 0);
    ctx.state.set('alcohol_tolerance', 0);
    expect(ctx.state.alcoholWithdrawalTier()).toBe('none');
  });
  test('none at 14', () => {
    ctx.state.set('alcohol_withdrawal', 14);
    expect(ctx.state.alcoholWithdrawalTier()).toBe('none');
  });
  test('mild at 15', () => {
    ctx.state.set('alcohol_withdrawal', 15);
    expect(ctx.state.alcoholWithdrawalTier()).toBe('mild');
  });
  test('mild at 39', () => {
    ctx.state.set('alcohol_withdrawal', 39);
    expect(ctx.state.alcoholWithdrawalTier()).toBe('mild');
  });
  test('moderate at 40', () => {
    ctx.state.set('alcohol_withdrawal', 40);
    expect(ctx.state.alcoholWithdrawalTier()).toBe('moderate');
  });
  test('moderate at 69', () => {
    ctx.state.set('alcohol_withdrawal', 69);
    expect(ctx.state.alcoholWithdrawalTier()).toBe('moderate');
  });
  test('severe at 70 with tolerance <= 65', () => {
    ctx.state.set('alcohol_withdrawal', 70);
    ctx.state.set('alcohol_tolerance', 65);
    expect(ctx.state.alcoholWithdrawalTier()).toBe('severe');
  });
  test('dangerous at 70 with tolerance > 65', () => {
    ctx.state.set('alcohol_withdrawal', 70);
    ctx.state.set('alcohol_tolerance', 66);
    expect(ctx.state.alcoholWithdrawalTier()).toBe('dangerous');
  });
  test('dangerous at 100 with high tolerance', () => {
    ctx.state.set('alcohol_withdrawal', 100);
    ctx.state.set('alcohol_tolerance', 100);
    expect(ctx.state.alcoholWithdrawalTier()).toBe('dangerous');
  });
  test('severe at 100 with tolerance exactly 65', () => {
    ctx.state.set('alcohol_withdrawal', 100);
    ctx.state.set('alcohol_tolerance', 65);
    expect(ctx.state.alcoholWithdrawalTier()).toBe('severe');
  });
});

// ---------------------------------------------------------------------------
// cannabisWithdrawalTier: none(<10), mild(<30), moderate(<60), severe(>=60)
// ---------------------------------------------------------------------------
describe('cannabisWithdrawalTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => { ctx.state.set('cannabis_withdrawal', 0); expect(ctx.state.cannabisWithdrawalTier()).toBe('none'); });
  test('none at 9', () => { ctx.state.set('cannabis_withdrawal', 9); expect(ctx.state.cannabisWithdrawalTier()).toBe('none'); });
  test('mild at 10', () => { ctx.state.set('cannabis_withdrawal', 10); expect(ctx.state.cannabisWithdrawalTier()).toBe('mild'); });
  test('mild at 29', () => { ctx.state.set('cannabis_withdrawal', 29); expect(ctx.state.cannabisWithdrawalTier()).toBe('mild'); });
  test('moderate at 30', () => { ctx.state.set('cannabis_withdrawal', 30); expect(ctx.state.cannabisWithdrawalTier()).toBe('moderate'); });
  test('moderate at 59', () => { ctx.state.set('cannabis_withdrawal', 59); expect(ctx.state.cannabisWithdrawalTier()).toBe('moderate'); });
  test('severe at 60', () => { ctx.state.set('cannabis_withdrawal', 60); expect(ctx.state.cannabisWithdrawalTier()).toBe('severe'); });
  test('severe at 100', () => { ctx.state.set('cannabis_withdrawal', 100); expect(ctx.state.cannabisWithdrawalTier()).toBe('severe'); });
});

// ---------------------------------------------------------------------------
// nauseaTier: none(<15), queasy(<40), sick(<70), severe(>=70)
// ---------------------------------------------------------------------------
describe('nauseaTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => { ctx.state.set('nausea', 0); expect(ctx.state.nauseaTier()).toBe('none'); });
  test('none at 14', () => { ctx.state.set('nausea', 14); expect(ctx.state.nauseaTier()).toBe('none'); });
  test('queasy at 15', () => { ctx.state.set('nausea', 15); expect(ctx.state.nauseaTier()).toBe('queasy'); });
  test('queasy at 39', () => { ctx.state.set('nausea', 39); expect(ctx.state.nauseaTier()).toBe('queasy'); });
  test('sick at 40', () => { ctx.state.set('nausea', 40); expect(ctx.state.nauseaTier()).toBe('sick'); });
  test('sick at 69', () => { ctx.state.set('nausea', 69); expect(ctx.state.nauseaTier()).toBe('sick'); });
  test('severe at 70', () => { ctx.state.set('nausea', 70); expect(ctx.state.nauseaTier()).toBe('severe'); });
  test('severe at 100', () => { ctx.state.set('nausea', 100); expect(ctx.state.nauseaTier()).toBe('severe'); });
});

// ---------------------------------------------------------------------------
// hygieneTier: [30→grimy, 55→stale, 80→okay, 100→fresh]
// ---------------------------------------------------------------------------
describe('hygieneTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('grimy at 0', () => { ctx.state.set('hygiene_level', 0); expect(ctx.state.hygieneTier()).toBe('grimy'); });
  test('grimy at 30', () => { ctx.state.set('hygiene_level', 30); expect(ctx.state.hygieneTier()).toBe('grimy'); });
  test('stale at 31', () => { ctx.state.set('hygiene_level', 31); expect(ctx.state.hygieneTier()).toBe('stale'); });
  test('stale at 55', () => { ctx.state.set('hygiene_level', 55); expect(ctx.state.hygieneTier()).toBe('stale'); });
  test('okay at 56', () => { ctx.state.set('hygiene_level', 56); expect(ctx.state.hygieneTier()).toBe('okay'); });
  test('okay at 80', () => { ctx.state.set('hygiene_level', 80); expect(ctx.state.hygieneTier()).toBe('okay'); });
  test('fresh at 81', () => { ctx.state.set('hygiene_level', 81); expect(ctx.state.hygieneTier()).toBe('fresh'); });
  test('fresh at 100', () => { ctx.state.set('hygiene_level', 100); expect(ctx.state.hygieneTier()).toBe('fresh'); });
});

// ---------------------------------------------------------------------------
// socialEnergyTier: [20→drained, 40→tired, 65→neutral, 85→rested, 100→energized]
// ---------------------------------------------------------------------------
describe('socialEnergyTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('drained at 0', () => { ctx.state.set('social_energy', 0); expect(ctx.state.socialEnergyTier()).toBe('drained'); });
  test('drained at 20', () => { ctx.state.set('social_energy', 20); expect(ctx.state.socialEnergyTier()).toBe('drained'); });
  test('tired at 21', () => { ctx.state.set('social_energy', 21); expect(ctx.state.socialEnergyTier()).toBe('tired'); });
  test('tired at 40', () => { ctx.state.set('social_energy', 40); expect(ctx.state.socialEnergyTier()).toBe('tired'); });
  test('neutral at 41', () => { ctx.state.set('social_energy', 41); expect(ctx.state.socialEnergyTier()).toBe('neutral'); });
  test('neutral at 65', () => { ctx.state.set('social_energy', 65); expect(ctx.state.socialEnergyTier()).toBe('neutral'); });
  test('rested at 66', () => { ctx.state.set('social_energy', 66); expect(ctx.state.socialEnergyTier()).toBe('rested'); });
  test('rested at 85', () => { ctx.state.set('social_energy', 85); expect(ctx.state.socialEnergyTier()).toBe('rested'); });
  test('energized at 86', () => { ctx.state.set('social_energy', 86); expect(ctx.state.socialEnergyTier()).toBe('energized'); });
  test('energized at 100', () => { ctx.state.set('social_energy', 100); expect(ctx.state.socialEnergyTier()).toBe('energized'); });
});

// ---------------------------------------------------------------------------
// connectionDepthTier: hollow(<20), surface(<45), present(<70), deep(>=70)
// Uses direct if-chain (not the tier() helper).
// ---------------------------------------------------------------------------
describe('connectionDepthTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('hollow at 0', () => { ctx.state.set('connection_depth', 0); expect(ctx.state.connectionDepthTier()).toBe('hollow'); });
  test('hollow at 19', () => { ctx.state.set('connection_depth', 19); expect(ctx.state.connectionDepthTier()).toBe('hollow'); });
  test('surface at 20', () => { ctx.state.set('connection_depth', 20); expect(ctx.state.connectionDepthTier()).toBe('surface'); });
  test('surface at 44', () => { ctx.state.set('connection_depth', 44); expect(ctx.state.connectionDepthTier()).toBe('surface'); });
  test('present at 45', () => { ctx.state.set('connection_depth', 45); expect(ctx.state.connectionDepthTier()).toBe('present'); });
  test('present at 69', () => { ctx.state.set('connection_depth', 69); expect(ctx.state.connectionDepthTier()).toBe('present'); });
  test('deep at 70', () => { ctx.state.set('connection_depth', 70); expect(ctx.state.connectionDepthTier()).toBe('deep'); });
  test('deep at 100', () => { ctx.state.set('connection_depth', 100); expect(ctx.state.connectionDepthTier()).toBe('deep'); });
});

// ---------------------------------------------------------------------------
// sleepInertiaTier: none(<0.05), mild(<0.2), moderate(<0.4), heavy(>=0.4)
// Uses reverse inequalities (>=) — higher values are heavier.
// ---------------------------------------------------------------------------
describe('sleepInertiaTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at 0', () => { ctx.state.set('sleep_inertia', 0); expect(ctx.state.sleepInertiaTier()).toBe('none'); });
  test('none at 0.04', () => { ctx.state.set('sleep_inertia', 0.04); expect(ctx.state.sleepInertiaTier()).toBe('none'); });
  test('mild at 0.05', () => { ctx.state.set('sleep_inertia', 0.05); expect(ctx.state.sleepInertiaTier()).toBe('mild'); });
  test('mild at 0.19', () => { ctx.state.set('sleep_inertia', 0.19); expect(ctx.state.sleepInertiaTier()).toBe('mild'); });
  test('moderate at 0.2', () => { ctx.state.set('sleep_inertia', 0.2); expect(ctx.state.sleepInertiaTier()).toBe('moderate'); });
  test('moderate at 0.39', () => { ctx.state.set('sleep_inertia', 0.39); expect(ctx.state.sleepInertiaTier()).toBe('moderate'); });
  test('heavy at 0.4', () => { ctx.state.set('sleep_inertia', 0.4); expect(ctx.state.sleepInertiaTier()).toBe('heavy'); });
  test('heavy at 0.6', () => { ctx.state.set('sleep_inertia', 0.6); expect(ctx.state.sleepInertiaTier()).toBe('heavy'); });
});

// ---------------------------------------------------------------------------
// ageStageTier: young_adult(<28), adult(<40), midlife(<56), older(>=56)
// Reads age_stage state variable; defaults to 35 when null.
// ---------------------------------------------------------------------------
describe('ageStageTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('young_adult at 18', () => { ctx.state.set('age_stage', 18); expect(ctx.state.ageStageTier()).toBe('young_adult'); });
  test('young_adult at 27', () => { ctx.state.set('age_stage', 27); expect(ctx.state.ageStageTier()).toBe('young_adult'); });
  test('adult at 28', () => { ctx.state.set('age_stage', 28); expect(ctx.state.ageStageTier()).toBe('adult'); });
  test('adult at 39', () => { ctx.state.set('age_stage', 39); expect(ctx.state.ageStageTier()).toBe('adult'); });
  test('midlife at 40', () => { ctx.state.set('age_stage', 40); expect(ctx.state.ageStageTier()).toBe('midlife'); });
  test('midlife at 55', () => { ctx.state.set('age_stage', 55); expect(ctx.state.ageStageTier()).toBe('midlife'); });
  test('older at 56', () => { ctx.state.set('age_stage', 56); expect(ctx.state.ageStageTier()).toBe('older'); });
  test('older at 80', () => { ctx.state.set('age_stage', 80); expect(ctx.state.ageStageTier()).toBe('older'); });
  test('defaults to adult when age_stage is null', () => {
    ctx.state.set('age_stage', null);
    // Default is 35 → adult
    expect(ctx.state.ageStageTier()).toBe('adult');
  });
});

// ---------------------------------------------------------------------------
// migraineTier: none (inactive or <5), building(<30), active(<65), severe(>=65)
// ---------------------------------------------------------------------------
describe('migraineTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none when migraine_active is false', () => {
    ctx.state.set('migraine_active', false);
    ctx.state.set('migraine_intensity', 80);
    expect(ctx.state.migraineTier()).toBe('none');
  });
  test('none when intensity < 5', () => {
    ctx.state.set('migraine_active', true);
    ctx.state.set('migraine_intensity', 4);
    expect(ctx.state.migraineTier()).toBe('none');
  });
  test('building at intensity 5', () => {
    ctx.state.set('migraine_active', true);
    ctx.state.set('migraine_intensity', 5);
    expect(ctx.state.migraineTier()).toBe('building');
  });
  test('building at intensity 29', () => {
    ctx.state.set('migraine_active', true);
    ctx.state.set('migraine_intensity', 29);
    expect(ctx.state.migraineTier()).toBe('building');
  });
  test('active at intensity 30', () => {
    ctx.state.set('migraine_active', true);
    ctx.state.set('migraine_intensity', 30);
    expect(ctx.state.migraineTier()).toBe('active');
  });
  test('active at intensity 64', () => {
    ctx.state.set('migraine_active', true);
    ctx.state.set('migraine_intensity', 64);
    expect(ctx.state.migraineTier()).toBe('active');
  });
  test('severe at intensity 65', () => {
    ctx.state.set('migraine_active', true);
    ctx.state.set('migraine_intensity', 65);
    expect(ctx.state.migraineTier()).toBe('severe');
  });
  test('severe at intensity 100', () => {
    ctx.state.set('migraine_active', true);
    ctx.state.set('migraine_intensity', 100);
    expect(ctx.state.migraineTier()).toBe('severe');
  });
});

// ---------------------------------------------------------------------------
// illnessTier: healthy(<0.05), unwell(<0.3), sick(<0.65), very_sick(>=0.65)
// ---------------------------------------------------------------------------
describe('illnessTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('healthy at 0', () => { ctx.state.set('illness_severity', 0); expect(ctx.state.illnessTier()).toBe('healthy'); });
  test('healthy at 0.04', () => { ctx.state.set('illness_severity', 0.04); expect(ctx.state.illnessTier()).toBe('healthy'); });
  test('unwell at 0.05', () => { ctx.state.set('illness_severity', 0.05); expect(ctx.state.illnessTier()).toBe('unwell'); });
  test('unwell at 0.29', () => { ctx.state.set('illness_severity', 0.29); expect(ctx.state.illnessTier()).toBe('unwell'); });
  test('sick at 0.3', () => { ctx.state.set('illness_severity', 0.3); expect(ctx.state.illnessTier()).toBe('sick'); });
  test('sick at 0.64', () => { ctx.state.set('illness_severity', 0.64); expect(ctx.state.illnessTier()).toBe('sick'); });
  test('very_sick at 0.65', () => { ctx.state.set('illness_severity', 0.65); expect(ctx.state.illnessTier()).toBe('very_sick'); });
  test('very_sick at 1.0', () => { ctx.state.set('illness_severity', 1.0); expect(ctx.state.illnessTier()).toBe('very_sick'); });
});

// ---------------------------------------------------------------------------
// vasovagalTier: none(<35), building(<65), prodrome(<90), episode(>=90), recovery(>20 recovery)
// recovery takes priority over all others.
// ---------------------------------------------------------------------------
describe('vasovagalTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('none at risk 0, recovery 0', () => {
    ctx.state.set('vasovagal_risk', 0);
    ctx.state.set('vasovagal_recovery', 0);
    expect(ctx.state.vasovagalTier()).toBe('none');
  });
  test('none at risk 34', () => {
    ctx.state.set('vasovagal_risk', 34);
    ctx.state.set('vasovagal_recovery', 0);
    expect(ctx.state.vasovagalTier()).toBe('none');
  });
  test('building at risk 35', () => {
    ctx.state.set('vasovagal_risk', 35);
    ctx.state.set('vasovagal_recovery', 0);
    expect(ctx.state.vasovagalTier()).toBe('building');
  });
  test('building at risk 64', () => {
    ctx.state.set('vasovagal_risk', 64);
    ctx.state.set('vasovagal_recovery', 0);
    expect(ctx.state.vasovagalTier()).toBe('building');
  });
  test('prodrome at risk 65', () => {
    ctx.state.set('vasovagal_risk', 65);
    ctx.state.set('vasovagal_recovery', 0);
    expect(ctx.state.vasovagalTier()).toBe('prodrome');
  });
  test('prodrome at risk 89', () => {
    ctx.state.set('vasovagal_risk', 89);
    ctx.state.set('vasovagal_recovery', 0);
    expect(ctx.state.vasovagalTier()).toBe('prodrome');
  });
  test('episode at risk 90', () => {
    ctx.state.set('vasovagal_risk', 90);
    ctx.state.set('vasovagal_recovery', 0);
    expect(ctx.state.vasovagalTier()).toBe('episode');
  });
  test('recovery overrides episode when recovery > 20', () => {
    ctx.state.set('vasovagal_risk', 90);
    ctx.state.set('vasovagal_recovery', 21);
    expect(ctx.state.vasovagalTier()).toBe('recovery');
  });
  test('recovery does NOT override at recovery exactly 20', () => {
    ctx.state.set('vasovagal_risk', 90);
    ctx.state.set('vasovagal_recovery', 20);
    // recovery=20 is not > 20, so episode fires
    expect(ctx.state.vasovagalTier()).toBe('episode');
  });
});

// ---------------------------------------------------------------------------
// locationVisitTier: stranger(<5 visits), familiar(<20), regular(>=20)
// Uses state key pattern: `${locationId}_visits`
// ---------------------------------------------------------------------------
describe('locationVisitTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('stranger at 0 visits', () => {
    ctx.state.set('corner_store_visits', 0);
    expect(ctx.state.locationVisitTier('corner_store')).toBe('stranger');
  });
  test('stranger at 4 visits', () => {
    ctx.state.set('corner_store_visits', 4);
    expect(ctx.state.locationVisitTier('corner_store')).toBe('stranger');
  });
  test('familiar at 5 visits', () => {
    ctx.state.set('corner_store_visits', 5);
    expect(ctx.state.locationVisitTier('corner_store')).toBe('familiar');
  });
  test('familiar at 19 visits', () => {
    ctx.state.set('corner_store_visits', 19);
    expect(ctx.state.locationVisitTier('corner_store')).toBe('familiar');
  });
  test('regular at 20 visits', () => {
    ctx.state.set('corner_store_visits', 20);
    expect(ctx.state.locationVisitTier('corner_store')).toBe('regular');
  });
  test('regular at 50 visits', () => {
    ctx.state.set('corner_store_visits', 50);
    expect(ctx.state.locationVisitTier('corner_store')).toBe('regular');
  });
  test('stranger by default (undefined key)', () => {
    // Never been set — should default to 0 visits → stranger
    expect(ctx.state.locationVisitTier('soup_kitchen')).toBe('stranger');
  });
});

// ---------------------------------------------------------------------------
// neighborTier: unseen(0), seen(<5), recognized(<15), known(>=15)
// ---------------------------------------------------------------------------
describe('neighborTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('unseen at 0', () => {
    ctx.state.set('neighbor_encounters', 0);
    expect(ctx.state.neighborTier()).toBe('unseen');
  });
  test('seen at 1', () => {
    ctx.state.set('neighbor_encounters', 1);
    expect(ctx.state.neighborTier()).toBe('seen');
  });
  test('seen at 4', () => {
    ctx.state.set('neighbor_encounters', 4);
    expect(ctx.state.neighborTier()).toBe('seen');
  });
  test('recognized at 5', () => {
    ctx.state.set('neighbor_encounters', 5);
    expect(ctx.state.neighborTier()).toBe('recognized');
  });
  test('recognized at 14', () => {
    ctx.state.set('neighbor_encounters', 14);
    expect(ctx.state.neighborTier()).toBe('recognized');
  });
  test('known at 15', () => {
    ctx.state.set('neighbor_encounters', 15);
    expect(ctx.state.neighborTier()).toBe('known');
  });
  test('known at 50', () => {
    ctx.state.set('neighbor_encounters', 50);
    expect(ctx.state.neighborTier()).toBe('known');
  });
});

// ---------------------------------------------------------------------------
// innerVoiceTier: null(score=0), uneasy(1), prominent(2), tremor(3+)
// Score += 1 per condition: gaba<40, ne>65, serotonin<35, rumination>65
// ---------------------------------------------------------------------------
describe('innerVoiceTier', () => {
  let ctx;

  function setCalm(state) {
    state.set('gaba', 50);
    state.set('norepinephrine', 50);
    state.set('serotonin', 50);
    state.set('rumination', 50);
  }

  beforeEach(() => {
    ctx = createTestContext();
    setCalm(ctx.state);
  });

  test('null when all NT calm', () => {
    expect(ctx.state.innerVoiceTier()).toBeNull();
  });

  test('uneasy with one condition (gaba < 40)', () => {
    ctx.state.set('gaba', 39);
    expect(ctx.state.innerVoiceTier()).toBe('uneasy');
  });

  test('uneasy with one condition (ne > 65)', () => {
    ctx.state.set('norepinephrine', 66);
    expect(ctx.state.innerVoiceTier()).toBe('uneasy');
  });

  test('uneasy with one condition (serotonin < 35)', () => {
    ctx.state.set('serotonin', 34);
    expect(ctx.state.innerVoiceTier()).toBe('uneasy');
  });

  test('uneasy with one condition (rumination > 65)', () => {
    ctx.state.set('rumination', 66);
    expect(ctx.state.innerVoiceTier()).toBe('uneasy');
  });

  test('prominent with two conditions', () => {
    ctx.state.set('gaba', 39);
    ctx.state.set('norepinephrine', 66);
    expect(ctx.state.innerVoiceTier()).toBe('prominent');
  });

  test('tremor with three conditions', () => {
    ctx.state.set('gaba', 39);
    ctx.state.set('norepinephrine', 66);
    ctx.state.set('serotonin', 34);
    expect(ctx.state.innerVoiceTier()).toBe('tremor');
  });

  test('tremor with all four conditions', () => {
    ctx.state.set('gaba', 39);
    ctx.state.set('norepinephrine', 66);
    ctx.state.set('serotonin', 34);
    ctx.state.set('rumination', 66);
    expect(ctx.state.innerVoiceTier()).toBe('tremor');
  });

  test('gaba exactly 40 does NOT trigger (requires < 40)', () => {
    ctx.state.set('gaba', 40);
    expect(ctx.state.innerVoiceTier()).toBeNull();
  });

  test('ne exactly 65 does NOT trigger (requires > 65)', () => {
    ctx.state.set('norepinephrine', 65);
    expect(ctx.state.innerVoiceTier()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fridgeTier: empty(0), sparse(<=2), stocked(<=4), well_stocked(>4)
// ---------------------------------------------------------------------------
describe('fridgeTier', () => {
  let ctx;
  beforeEach(() => { ctx = createTestContext(); });

  test('empty at 0', () => { ctx.state.set('fridge_food', 0); expect(ctx.state.fridgeTier()).toBe('empty'); });
  test('sparse at 1', () => { ctx.state.set('fridge_food', 1); expect(ctx.state.fridgeTier()).toBe('sparse'); });
  test('sparse at 2', () => { ctx.state.set('fridge_food', 2); expect(ctx.state.fridgeTier()).toBe('sparse'); });
  test('stocked at 3', () => { ctx.state.set('fridge_food', 3); expect(ctx.state.fridgeTier()).toBe('stocked'); });
  test('stocked at 4', () => { ctx.state.set('fridge_food', 4); expect(ctx.state.fridgeTier()).toBe('stocked'); });
  test('well_stocked at 5', () => { ctx.state.set('fridge_food', 5); expect(ctx.state.fridgeTier()).toBe('well_stocked'); });
  test('well_stocked at 10', () => { ctx.state.set('fridge_food', 10); expect(ctx.state.fridgeTier()).toBe('well_stocked'); });
});

// ---------------------------------------------------------------------------
// gastritisTier: requires 'gastritis' in health_conditions.
// none (absent or pain<8), gnaw(<35), ache(<65), burn(>=65)
// ---------------------------------------------------------------------------
describe('gastritisTier', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.set('health_conditions', ['gastritis']);
  });

  test('none when gastritis condition absent', () => {
    ctx.state.set('health_conditions', []);
    ctx.state.set('gastritis_pain', 50);
    expect(ctx.state.gastritisTier()).toBe('none');
  });
  test('none when pain < 8', () => {
    ctx.state.set('gastritis_pain', 7);
    expect(ctx.state.gastritisTier()).toBe('none');
  });
  test('gnaw at pain 8', () => {
    ctx.state.set('gastritis_pain', 8);
    expect(ctx.state.gastritisTier()).toBe('gnaw');
  });
  test('gnaw at pain 34', () => {
    ctx.state.set('gastritis_pain', 34);
    expect(ctx.state.gastritisTier()).toBe('gnaw');
  });
  test('ache at pain 35', () => {
    ctx.state.set('gastritis_pain', 35);
    expect(ctx.state.gastritisTier()).toBe('ache');
  });
  test('ache at pain 64', () => {
    ctx.state.set('gastritis_pain', 64);
    expect(ctx.state.gastritisTier()).toBe('ache');
  });
  test('burn at pain 65', () => {
    ctx.state.set('gastritis_pain', 65);
    expect(ctx.state.gastritisTier()).toBe('burn');
  });
  test('burn at pain 100', () => {
    ctx.state.set('gastritis_pain', 100);
    expect(ctx.state.gastritisTier()).toBe('burn');
  });
});

// ---------------------------------------------------------------------------
// binderTier: not_worn (null start or count=0), fresh(<4h), worn(<8h), overdue(>=8h)
// time is in minutes; binder_start_time compared against s.time
// ---------------------------------------------------------------------------
describe('binderTier', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    // init() populates defaults including s.time (390 = game start offset),
    // which binderTier needs to compute elapsed hours from binder_start_time.
    ctx.state.init();
  });

  test('not_worn when binder_start_time is null', () => {
    ctx.state.set('binder_start_time', null);
    ctx.state.set('binder_count', 1);
    expect(ctx.state.binderTier()).toBe('not_worn');
  });
  test('not_worn when binder_count is 0', () => {
    ctx.state.set('binder_start_time', 0);
    ctx.state.set('binder_count', 0);
    expect(ctx.state.binderTier()).toBe('not_worn');
  });
  test('fresh when worn < 4 hours', () => {
    const currentTime = ctx.state.get('time');
    ctx.state.set('binder_start_time', currentTime - 60); // 1 hour ago
    ctx.state.set('binder_count', 1);
    expect(ctx.state.binderTier()).toBe('fresh');
  });
  test('fresh at exactly 3h59m (just under 4h boundary)', () => {
    const currentTime = ctx.state.get('time');
    ctx.state.set('binder_start_time', currentTime - 239); // 239 min = 3h59m
    ctx.state.set('binder_count', 1);
    expect(ctx.state.binderTier()).toBe('fresh');
  });
  test('worn at exactly 4 hours', () => {
    const currentTime = ctx.state.get('time');
    ctx.state.set('binder_start_time', currentTime - 240); // 240 min = 4h exactly
    ctx.state.set('binder_count', 1);
    expect(ctx.state.binderTier()).toBe('worn');
  });
  test('worn at 7h59m', () => {
    const currentTime = ctx.state.get('time');
    ctx.state.set('binder_start_time', currentTime - 479); // 479 min = 7h59m
    ctx.state.set('binder_count', 1);
    expect(ctx.state.binderTier()).toBe('worn');
  });
  test('overdue at exactly 8 hours', () => {
    const currentTime = ctx.state.get('time');
    ctx.state.set('binder_start_time', currentTime - 480); // 480 min = 8h exactly
    ctx.state.set('binder_count', 1);
    expect(ctx.state.binderTier()).toBe('overdue');
  });
  test('overdue at 12 hours', () => {
    const currentTime = ctx.state.get('time');
    ctx.state.set('binder_start_time', currentTime - 720); // 720 min = 12h
    ctx.state.set('binder_count', 1);
    expect(ctx.state.binderTier()).toBe('overdue');
  });
});
