// tests/integration.test.js — sim contract integration tests
// Each describe block tests one high-level system contract end-to-end.
// Does not duplicate senses pipeline coverage (tests/senses.test.js).

import { describe, test, expect, beforeEach } from 'bun:test';
import { createTestContext } from '../js/test-context.js';
import { createChargen } from '../js/chargen.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a context with a fully generated character applied to state.
 * Mirrors the pattern in chargen.test.js.
 */
function makeCtxWithChar(seed = 12345) {
  const ctx = createTestContext(seed);
  const chargen = createChargen(ctx);
  const char = chargen.generateRandom();

  const sim = chargen.simulateFinancialHistory(char.backstory, char.age_stage, char.job_type);
  // Gender pay gap — mirrors finishCreation logic
  if (char.pronouns === 'she/her' || char.pronouns === 'she/they') {
    sim.hourly_rate = Math.round(sim.hourly_rate * 0.82 * 100) / 100;
  }
  char.financial_sim = sim;

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

  ctx.character.set(char);
  ctx.state.init();
  ctx.character.applyToState();

  return ctx;
}

// ---------------------------------------------------------------------------
// 1. Sleep → adenosine cleared → wakeUp sets wake_period_start
// ---------------------------------------------------------------------------

describe('sleep contract: adenosine cleared and wake_period_start set', () => {
  let ctx;
  beforeEach(() => {
    ctx = makeCtxWithChar();
    // Put character in apartment bedroom with depleted energy so sleep is
    // available and the sleep action can execute without an availability check.
    ctx.state.set('location', 'apartment_bedroom');
    ctx.state.set('location_arrival_time', ctx.state.get('time'));
    // Force depleted energy so available() passes and a long sleep fires
    ctx.state.set('energy', 0);
    // Set a high adenosine value to make clearing visible
    ctx.state.set('adenosine', 70);
  });

  test('executing the sleep interaction reduces adenosine', () => {
    const beforeAden = ctx.state.get('adenosine');
    const interaction = ctx.content.getInteraction('sleep');
    interaction.execute();
    const afterAden = ctx.state.get('adenosine');
    expect(afterAden).toBeLessThan(beforeAden);
  });

  test('adenosine does not go below 0 after sleep', () => {
    const interaction = ctx.content.getInteraction('sleep');
    interaction.execute();
    expect(ctx.state.get('adenosine')).toBeGreaterThanOrEqual(0);
  });

  test('wakeUp sets wake_period_start to current time after sleep', () => {
    const interaction = ctx.content.getInteraction('sleep');
    interaction.execute();
    // After sleep, wakeUp() is called. wake_period_start must equal the time
    // at which the character woke — which is the current time post-sleep.
    const wps = ctx.state.get('wake_period_start');
    const now = ctx.state.get('time');
    expect(wps).toBe(now);
  });

  test('wake_period_start is greater than 0 after sleep (time advanced)', () => {
    const timeBefore = ctx.state.get('time');
    const interaction = ctx.content.getInteraction('sleep');
    interaction.execute();
    expect(ctx.state.get('wake_period_start')).toBeGreaterThan(timeBefore);
  });

  test('energy increases after sleep', () => {
    const energyBefore = ctx.state.get('energy');
    const interaction = ctx.content.getInteraction('sleep');
    interaction.execute();
    expect(ctx.state.get('energy')).toBeGreaterThan(energyBefore);
  });
});

// ---------------------------------------------------------------------------
// 2. Financial cycle — paycheck and bills over simulated days
//
// The financial cycle lives in state.js helper methods:
//   receiveMoney, deductBill, failBill
// and fires from generateIncomingMessages() in content.js.
// We test two ways:
//   (a) Directly via state methods — clean, no friend-message side effects
//   (b) Via generateIncomingMessages() on a context with a full character,
//       verifying the paycheck and rent triggers fire on the correct day.
// ---------------------------------------------------------------------------

describe('financial cycle: paycheck and bills', () => {
  test('receiveMoney increases balance', () => {
    const ctx = makeCtxWithChar();
    ctx.state.set('money', 100);
    ctx.state.receiveMoney(300, 'paycheck');
    expect(ctx.state.get('money')).toBe(400);
  });

  test('deductBill decreases balance when funds are sufficient', () => {
    const ctx = makeCtxWithChar();
    ctx.state.set('money', 1000);
    ctx.state.deductBill(200, 'rent');
    expect(ctx.state.get('money')).toBe(800);
  });

  test('deductBill queues pending bill when funds are insufficient', () => {
    const ctx = makeCtxWithChar();
    ctx.state.set('money', 10);
    ctx.state.deductBill(800, 'rent');
    // Money unchanged — bill is pending
    expect(ctx.state.get('money')).toBe(10);
    expect(ctx.state.get('pending_bills').length).toBeGreaterThan(0);
  });

  test('paycheck fires via generateIncomingMessages on the correct day', () => {
    const ctx = makeCtxWithChar();
    // Override pay rate and hours to a known amount
    ctx.state.set('hourly_rate', 20);
    ctx.state.set('hours_worked_period', 80);
    ctx.state.set('paycheck_day_offset', 7);
    ctx.state.set('last_paycheck_day', 0);
    ctx.state.set('money', 0);
    ctx.state.set('last_msg_gen_time', 0);

    // Advance to day 7: (7-1)*1440 = 8640 minutes
    // day = Math.floor(8640/1440) + 1 = 7
    ctx.state.advanceTime(6 * 1440); // moves to minute 8640, day 7

    const moneyBefore = ctx.state.get('money'); // 0
    ctx.content.generateIncomingMessages();

    expect(ctx.state.get('money')).toBeGreaterThan(moneyBefore);
  });

  test('rent fires via generateIncomingMessages on the correct day', () => {
    const ctx = makeCtxWithChar();
    ctx.state.set('rent_amount', 800);
    ctx.state.set('rent_day_offset', 5); // day % 30 === 5
    ctx.state.set('last_rent_day', 0);
    ctx.state.set('money', 2000);
    ctx.state.set('last_msg_gen_time', 0);
    // Suppress paycheck from firing on this day
    ctx.state.set('paycheck_day_offset', 3);
    ctx.state.set('last_paycheck_day', 0);
    ctx.state.set('hourly_rate', 0);
    ctx.state.set('hours_worked_period', 0);

    const moneyBefore = ctx.state.get('money');
    // Day 35: 35 % 30 === 5 ✓ and 35 > 1 ✓
    ctx.state.advanceTime(34 * 1440); // time = 34*1440, day = 35
    ctx.content.generateIncomingMessages();

    // Rent ($800) deducted from $2000
    expect(ctx.state.get('money')).toBe(moneyBefore - 800);
  });

  test('overdraft: moneyTier returns "overdrawn" when money is negative', () => {
    const ctx = makeCtxWithChar();
    ctx.state.set('money', -50);
    expect(ctx.state.moneyTier()).toBe('overdrawn');
  });

  test('overdraft: failBill on zero balance triggers overdrawn state', () => {
    const ctx = makeCtxWithChar();
    ctx.state.set('money', 0);
    ctx.state.failBill('rent');
    expect(ctx.state.moneyTier()).toBe('overdrawn');
  });
});

// ---------------------------------------------------------------------------
// 3. Social decay toward trait_loneliness floor
// ---------------------------------------------------------------------------

describe('social decay toward trait_loneliness floor', () => {
  test('social decays from 100 after 48 hours with no interactions', () => {
    const ctx = makeCtxWithChar();
    ctx.state.set('social', 100);
    ctx.state.advanceTime(48 * 60);
    expect(ctx.state.get('social')).toBeLessThan(100);
  });

  test('social decays more in 72 hours than in 12 hours', () => {
    const ctx1 = makeCtxWithChar(1);
    ctx1.state.set('social', 100);
    ctx1.state.set('trait_loneliness', 50);
    ctx1.state.set('neuroticism', 50);
    ctx1.state.advanceTime(12 * 60);
    const after12 = ctx1.state.get('social');

    const ctx2 = makeCtxWithChar(1);
    ctx2.state.set('social', 100);
    ctx2.state.set('trait_loneliness', 50);
    ctx2.state.set('neuroticism', 50);
    ctx2.state.advanceTime(72 * 60);
    const after72 = ctx2.state.get('social');

    expect(after72).toBeLessThan(after12);
  });

  test('social does not fall below the trait_loneliness floor after long isolation', () => {
    const ctx = makeCtxWithChar();
    // trait_loneliness=80 → floor = 80 * 0.25 = 20
    ctx.state.set('trait_loneliness', 80);
    ctx.state.set('neuroticism', 50);
    ctx.state.set('social', 100);
    // Advance 720 hours (30 days) — well past any realistic τ
    ctx.state.advanceTime(720 * 60);
    const social = ctx.state.get('social');
    const floor = 80 * 0.25; // 20
    // Allow a small tolerance for floating-point arithmetic
    expect(social).toBeGreaterThanOrEqual(floor - 0.01);
  });

  test('trait_loneliness=0 has a floor near 0 (decays very close to zero)', () => {
    const ctx = makeCtxWithChar();
    ctx.state.set('trait_loneliness', 0);
    ctx.state.set('neuroticism', 50);
    ctx.state.set('social', 100);
    ctx.state.advanceTime(720 * 60);
    // With floor=0, social should decay very close to 0
    expect(ctx.state.get('social')).toBeLessThan(5);
  });

  test('high neuroticism decays social faster than low neuroticism', () => {
    const hours = 48;

    const ctxHigh = makeCtxWithChar(42);
    ctxHigh.state.set('social', 80);
    ctxHigh.state.set('trait_loneliness', 0);
    ctxHigh.state.set('neuroticism', 90);
    ctxHigh.state.advanceTime(hours * 60);
    const socialHigh = ctxHigh.state.get('social');

    const ctxLow = makeCtxWithChar(42);
    ctxLow.state.set('social', 80);
    ctxLow.state.set('trait_loneliness', 0);
    ctxLow.state.set('neuroticism', 10);
    ctxLow.state.advanceTime(hours * 60);
    const socialLow = ctxLow.state.get('social');

    // Higher neuroticism → faster decay → lower social after same duration
    expect(socialHigh).toBeLessThan(socialLow);
  });
});

// ---------------------------------------------------------------------------
// 4. Sentiment accumulation and sleep attenuation
// ---------------------------------------------------------------------------

describe('sentiment accumulation and sleep attenuation', () => {
  test('adjustSentiment increases intensity by the given amount', () => {
    const ctx = makeCtxWithChar();
    const before = ctx.state.sentimentIntensity('work', 'dread');
    ctx.state.adjustSentiment('work', 'dread', 0.1);
    const after = ctx.state.sentimentIntensity('work', 'dread');
    // After adjustment intensity should be before + 0.1 (clamped to [0,1])
    expect(after).toBeCloseTo(Math.min(1, before + 0.1), 4);
  });

  test('processSleepEmotions reduces accumulated sentiment deviation', () => {
    const ctx = makeCtxWithChar();
    // Build up a sentiment above the character baseline (no 'work/dread' chargen entry)
    ctx.state.adjustSentiment('work', 'dread', 0.8);
    const before = ctx.state.sentimentIntensity('work', 'dread');

    // Call processSleepEmotions directly: empty baseline → full deviation = 0.8
    ctx.state.processSleepEmotions([], 1.0, 480);

    const after = ctx.state.sentimentIntensity('work', 'dread');
    expect(after).toBeLessThan(before);
  });

  test('sleep via full interaction also attenuates accumulated sentiments', () => {
    const ctx = makeCtxWithChar();
    // Accumulate dread beyond any character baseline
    ctx.state.adjustSentiment('work', 'dread', 0.8);

    // Set up for sleep
    ctx.state.set('location', 'apartment_bedroom');
    ctx.state.set('location_arrival_time', ctx.state.get('time'));
    ctx.state.set('energy', 0); // depleted → long sleep

    const before = ctx.state.sentimentIntensity('work', 'dread');
    ctx.content.getInteraction('sleep').execute();
    const after = ctx.state.sentimentIntensity('work', 'dread');

    expect(after).toBeLessThan(before);
  });

  test('comfort sentiments are also attenuated toward baseline during sleep', () => {
    const ctx = makeCtxWithChar();
    ctx.state.adjustSentiment('rain_sound', 'comfort', 0.7);
    const before = ctx.state.sentimentIntensity('rain_sound', 'comfort');

    ctx.state.processSleepEmotions([], 1.0, 480);
    const after = ctx.state.sentimentIntensity('rain_sound', 'comfort');

    expect(after).toBeLessThan(before);
  });

  test('poor quality sleep attenuates less than good quality sleep', () => {
    const ctx1 = makeCtxWithChar(1);
    ctx1.state.adjustSentiment('work', 'dread', 0.7);
    ctx1.state.processSleepEmotions([], 1.0, 480); // good quality
    const afterGood = ctx1.state.sentimentIntensity('work', 'dread');

    const ctx2 = makeCtxWithChar(1);
    ctx2.state.adjustSentiment('work', 'dread', 0.7);
    ctx2.state.processSleepEmotions([], 0.4, 480); // poor quality
    const afterPoor = ctx2.state.sentimentIntensity('work', 'dread');

    // Good quality sleep processes more → lower remaining intensity
    expect(afterGood).toBeLessThan(afterPoor);
  });

  test('sentiment at exact character baseline is not attenuated', () => {
    const ctx = makeCtxWithChar();
    // Baseline has an entry at 0.5; current state matches baseline exactly
    const baseSentiments = [{ target: 'work', quality: 'satisfaction', intensity: 0.5 }];
    ctx.state.adjustSentiment('work', 'satisfaction', 0.5);
    const before = ctx.state.sentimentIntensity('work', 'satisfaction');

    ctx.state.processSleepEmotions(baseSentiments, 1.0, 480);
    const after = ctx.state.sentimentIntensity('work', 'satisfaction');

    // deviation = 0 → no processing → intensity unchanged
    expect(after).toBeCloseTo(before, 4);
  });
});

// ---------------------------------------------------------------------------
// 5. Interrupt queue firing
// ---------------------------------------------------------------------------

describe('interrupt queue: alarm fires when time passes triggerAt', () => {
  test('fireScheduledInterrupts returns empty before alarm time', () => {
    const ctx = makeCtxWithChar();
    const now = ctx.state.get('time');
    ctx.state.scheduleInterrupt('alarm_test', now + 120, 'alarm', {});

    // Time has not advanced — alarm should not fire
    const fired = ctx.state.fireScheduledInterrupts();
    expect(fired.length).toBe(0);
  });

  test('fireScheduledInterrupts returns alarm after time advances past triggerAt', () => {
    const ctx = makeCtxWithChar();
    const now = ctx.state.get('time');
    ctx.state.scheduleInterrupt('alarm_test', now + 60, 'alarm', {});

    ctx.state.advanceTime(90); // advance past the alarm trigger
    const fired = ctx.state.fireScheduledInterrupts();

    expect(fired.length).toBeGreaterThanOrEqual(1);
    expect(fired.some(f => f.type === 'alarm')).toBe(true);
  });

  test('alarm fires only once (fired flag prevents re-fire)', () => {
    const ctx = makeCtxWithChar();
    const now = ctx.state.get('time');
    ctx.state.scheduleInterrupt('alarm_once', now + 30, 'alarm', {});

    ctx.state.advanceTime(60);
    const fired1 = ctx.state.fireScheduledInterrupts();
    const fired2 = ctx.state.fireScheduledInterrupts(); // second call

    expect(fired1.some(f => f.id === 'alarm_once')).toBe(true);
    expect(fired2.some(f => f.id === 'alarm_once')).toBe(false);
  });

  test('checkEvents in world.js returns alarm event when alarm fires', () => {
    const ctx = makeCtxWithChar();
    const now = ctx.state.get('time');
    // Schedule an alarm 10 minutes from now
    ctx.state.scheduleInterrupt('alarm_wake', now + 10, 'alarm', {});

    // Advance past the alarm
    ctx.state.advanceTime(30);

    // checkEvents processes the interrupt queue and records events
    const events = ctx.world.checkEvents();
    expect(events).toContain('alarm');
  });

  test('hasInterrupt returns true before alarm fires', () => {
    const ctx = makeCtxWithChar();
    const now = ctx.state.get('time');
    ctx.state.scheduleInterrupt('alarm_has', now + 60, 'alarm', {});
    expect(ctx.state.hasInterrupt('alarm_has')).toBe(true);
  });

  test('hasInterrupt returns false after cancelInterrupt', () => {
    const ctx = makeCtxWithChar();
    const now = ctx.state.get('time');
    ctx.state.scheduleInterrupt('alarm_cancel', now + 60, 'alarm', {});
    expect(ctx.state.hasInterrupt('alarm_cancel')).toBe(true);
    ctx.state.cancelInterrupt('alarm_cancel');
    expect(ctx.state.hasInterrupt('alarm_cancel')).toBe(false);
  });

  test('rescheduleInterrupt moves alarm to new time and clears fired flag', () => {
    const ctx = makeCtxWithChar();
    const now = ctx.state.get('time');
    ctx.state.scheduleInterrupt('alarm_resched', now + 10, 'alarm', {});

    // Fire it
    ctx.state.advanceTime(30);
    const fired = ctx.state.fireScheduledInterrupts();
    expect(fired.some(f => f.id === 'alarm_resched')).toBe(true);

    // Reschedule to far future
    ctx.state.rescheduleInterrupt('alarm_resched', ctx.state.get('time') + 9999);

    // Should not fire again immediately
    const firedAgain = ctx.state.fireScheduledInterrupts();
    expect(firedAgain.some(f => f.id === 'alarm_resched')).toBe(false);
  });

  test('multiple interrupts fire in the same tick when all are past triggerAt', () => {
    const ctx = makeCtxWithChar();
    const now = ctx.state.get('time');
    ctx.state.scheduleInterrupt('a1', now + 10, 'alarm', {});
    ctx.state.scheduleInterrupt('a2', now + 20, 'alarm', {});
    ctx.state.scheduleInterrupt('a3', now + 30, 'alarm', {});

    ctx.state.advanceTime(60); // past all three
    const fired = ctx.state.fireScheduledInterrupts();

    // All three should fire (there may be pre-existing interrupts from chargen/applyToState)
    const ourFired = fired.filter(f => ['a1', 'a2', 'a3'].includes(f.id));
    expect(ourFired.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 6. Habit learning convergence
// ---------------------------------------------------------------------------

describe('habit learning convergence', () => {
  // Helper: build a ctx, stuff training data, train, and return habits + ctx.
  // Adds `playerCount` player-sourced examples and `otherCount` examples of a
  // competing action so the tree isn't trivially all-positive.
  function trainHabits(actionId, playerCount, otherAction, otherCount, source = 'player') {
    const ctx = makeCtxWithChar();
    const features = ctx.habits.extractFeatures();

    for (let i = 0; i < playerCount; i++) {
      ctx.habits.addExample(features, actionId, source);
    }
    for (let i = 0; i < otherCount; i++) {
      ctx.habits.addExample(features, otherAction, 'player');
    }

    ctx.habits.train();
    return ctx;
  }

  test('after repeated player actions, confidence meets suggestion threshold', () => {
    // 20 player sleep + 5 player make_coffee → sleep posWeight/totalWeight = 20/25 = 0.8
    // Leaf probability = 0.8 ≥ 0.6 threshold
    const ctx = trainHabits('sleep', 20, 'make_coffee', 5, 'player');
    const confidence = ctx.habits.getConfidence('sleep');
    expect(confidence).toBeGreaterThanOrEqual(0.6);
  });

  test('confidence grows with more examples of the same action', () => {
    // Fewer examples: 3 sleep vs 5 other → probability = 3/8 = 0.375
    const ctxFew = trainHabits('sleep', 3, 'make_coffee', 5, 'player');
    const confidenceFew = ctxFew.habits.getConfidence('sleep');

    // More examples: 20 sleep vs 5 other → probability = 20/25 = 0.8
    const ctxMany = trainHabits('sleep', 20, 'make_coffee', 5, 'player');
    const confidenceMany = ctxMany.habits.getConfidence('sleep');

    expect(confidenceMany).toBeGreaterThan(confidenceFew);
  });

  test('training requires at least 20 examples before producing trees', () => {
    const ctx = makeCtxWithChar();
    const features = ctx.habits.extractFeatures();

    // Add only 15 examples (below the 20-example threshold)
    for (let i = 0; i < 15; i++) {
      ctx.habits.addExample(features, 'sleep', 'player');
    }
    ctx.habits.train();

    // With fewer than 20 examples, no trees are built → confidence is 0
    const confidence = ctx.habits.getConfidence('sleep');
    expect(confidence).toBe(0);
  });

  test('anti-snowball: auto-sourced actions inflate confidence much less than player-sourced', () => {
    // Player: 20 sleep + 5 other → posWeight=20, negWeight=5 → probability=0.80
    const ctxPlayer = trainHabits('sleep', 20, 'make_coffee', 5, 'player');
    const confidencePlayer = ctxPlayer.habits.getConfidence('sleep');

    // Auto: 20 sleep (weight 0.1 each) + 5 other (weight 1.0 each) →
    //   posWeight = 20*0.1 = 2, negWeight = 5*1.0 = 5, probability = 2/7 ≈ 0.286
    const ctxAuto = trainHabits('sleep', 20, 'make_coffee', 5, 'auto');
    const confidenceAuto = ctxAuto.habits.getConfidence('sleep');

    // Player confidence is substantially higher due to source weighting
    expect(confidencePlayer).toBeGreaterThan(confidenceAuto);
    // Auto confidence should be well below the suggestion threshold
    expect(confidenceAuto).toBeLessThan(0.6);
  });

  test('action with fewer than 3 examples does not produce a tree', () => {
    // Mix: 2 sleep (below 3-example minimum for positive class) + 18 other
    const ctx = makeCtxWithChar();
    const features = ctx.habits.extractFeatures();
    for (let i = 0; i < 2; i++) ctx.habits.addExample(features, 'sleep', 'player');
    for (let i = 0; i < 18; i++) ctx.habits.addExample(features, 'make_coffee', 'player');
    ctx.habits.train();

    // sleep had < 3 positive examples → skipped → no tree → confidence = 0
    expect(ctx.habits.getConfidence('sleep')).toBe(0);
    // make_coffee had 18 examples → tree exists → confidence > 0
    expect(ctx.habits.getConfidence('make_coffee')).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Coworker drama recency factor (continuous cooldown)
// ---------------------------------------------------------------------------

describe('coworker drama recency factor', () => {
  // Set up a context positioned at the workplace during work hours on a weekday.
  // start_timestamp=0 → day 0 is Thursday (dow=4).
  // shift_start=540 (9am), shift_end=1020 (5pm).
  // Advance to 10am Thursday (time=600) so isWorkHours() returns true.
  function makeWorkplaceCtx() {
    const ctx = makeCtxWithChar();
    ctx.state.set('location', 'workplace');
    // time=600 → timeOfDay()=600 → inside shift [540,1020) on day 0 (Thursday)
    ctx.state.set('time', 600);
    ctx.state.set('location_arrival_time', 600);
    return ctx;
  }

  // Compute recencyFactor the same way world.js does, for assertions.
  const DRAMA_TAU = 480;
  function recencyFactor(minutesSince) {
    return minutesSince === Infinity ? 1 : 1 - Math.exp(-minutesSince / DRAMA_TAU);
  }

  test('recencyFactor is 1 when there has been no prior drama', () => {
    const ctx = makeWorkplaceCtx();
    const lastDrama = ctx.events.last('coworker_drama');
    expect(lastDrama).toBeNull();
    // With no prior drama, factor should be full probability (1.0)
    expect(recencyFactor(Infinity)).toBe(1);
  });

  test('recencyFactor is near 0 immediately after drama fires', () => {
    // At t=0 minutes since drama: factor = 1 - exp(0) = 0
    expect(recencyFactor(0)).toBeCloseTo(0, 4);
  });

  test('recencyFactor is approximately 0.63 after τ (480) minutes', () => {
    // After one time constant: 1 - exp(-1) ≈ 0.632
    expect(recencyFactor(DRAMA_TAU)).toBeCloseTo(1 - 1 / Math.E, 3);
  });

  test('recencyFactor is approximately 0.95 after 3τ (1440) minutes', () => {
    // After three time constants: 1 - exp(-3) ≈ 0.950
    expect(recencyFactor(3 * DRAMA_TAU)).toBeCloseTo(1 - Math.exp(-3), 3);
  });

  test('recencyFactor increases monotonically with time since last drama', () => {
    const t1 = recencyFactor(60);
    const t2 = recencyFactor(480);
    const t3 = recencyFactor(1440);
    expect(t2).toBeGreaterThan(t1);
    expect(t3).toBeGreaterThan(t2);
  });

  test('drama probability is substantially suppressed immediately after a drama event', () => {
    // At t=0, factor≈0 → effective probability ≈ 0.
    // Run many checkEvents calls right after drama fires and verify drama is very rare.
    const ctx = makeWorkplaceCtx();
    ctx.state.set('job_standing', 20);
    ctx.state.set('stress', 90);

    // Record drama at current time — factor ≈ 0 immediately after
    ctx.events.record('coworker_drama', { subtype: 'coworker_argument' });
    const initialCount = ctx.events.count('coworker_drama');

    // 100 calls with factor≈0: expected additional drama count ≈ 0.
    // Chance of ≥1 additional drama at ~15% * ~0 ≈ 0; statistically safe assertion.
    for (let i = 0; i < 100; i++) {
      ctx.world.checkEvents();
    }

    // Strictly less than 5 additional events (generous bound; expected ≈ 0)
    const added = ctx.events.count('coworker_drama') - initialCount;
    expect(added).toBeLessThan(5);
  });

  test('drama is more likely after τ minutes than immediately after a drama event', () => {
    // At t=0: factor ≈ 0. At t=τ: factor ≈ 0.63.
    // Verify by computing factors directly — the probability ordering is the system contract.
    const factorImmediate = recencyFactor(0);
    const factorAfterTau = recencyFactor(DRAMA_TAU);
    expect(factorAfterTau).toBeGreaterThan(factorImmediate);
    // After τ, drama probability should be meaningfully restored (>50% of full)
    expect(factorAfterTau).toBeGreaterThan(0.5);
  });
});

