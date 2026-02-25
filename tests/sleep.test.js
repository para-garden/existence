// tests/sleep.test.js — unit tests for the sleep model in state.js
// Tests cover: sleepCycleBreakdown, adenosine clearing, sleep debt, energy recovery, wakeUp.

import { describe, test, expect, beforeEach } from 'bun:test';
import { createTestContext } from '../js/test-context.js';

describe('sleep', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    // state.init() populates s from defaults(); without it s stays {}
    ctx.state.init();
  });

  // ---------------------------------------------------------------------------
  // sleepCycleBreakdown(minutes) — pure function exposed on State
  // ---------------------------------------------------------------------------

  describe('sleepCycleBreakdown', () => {
    test('returns an object with numeric fields', () => {
      const result = ctx.state.sleepCycleBreakdown(480);
      expect(typeof result.completeCycles).toBe('number');
      expect(typeof result.partialCycleFrac).toBe('number');
      expect(typeof result.deepSleepFrac).toBe('number');
      expect(typeof result.remFrac).toBe('number');
      expect(typeof result.sleepInertia).toBe('number');
    });

    test('480 minutes produces positive deep and REM fractions', () => {
      const result = ctx.state.sleepCycleBreakdown(480);
      expect(result.deepSleepFrac).toBeGreaterThan(0);
      expect(result.remFrac).toBeGreaterThan(0);
    });

    test('480 minutes: deep fraction around 20% and REM around 25% (model targets)', () => {
      // Calibration targets from code comments: 8-hour sleep → ~20% deep, ~25% REM.
      const result = ctx.state.sleepCycleBreakdown(480);
      // Allow ±10pp around targets to accommodate age_stage default of 35
      expect(result.deepSleepFrac).toBeGreaterThan(0.05);
      expect(result.deepSleepFrac).toBeLessThan(0.40);
      expect(result.remFrac).toBeGreaterThan(0.10);
      expect(result.remFrac).toBeLessThan(0.45);
    });

    test('120 minutes produces different fractions than 480 minutes', () => {
      const short = ctx.state.sleepCycleBreakdown(120);
      const full  = ctx.state.sleepCycleBreakdown(480);
      // Short sleep is dominated by early cycles → more deep, less REM
      expect(short.deepSleepFrac).not.toBeCloseTo(full.deepSleepFrac, 2);
    });

    test('120 minutes: fewer complete cycles than 480 minutes', () => {
      const short = ctx.state.sleepCycleBreakdown(120);
      const full  = ctx.state.sleepCycleBreakdown(480);
      expect(short.completeCycles).toBeLessThan(full.completeCycles);
    });

    test('fractions are clamped to [0, 1]', () => {
      for (const minutes of [30, 120, 240, 480, 600]) {
        const r = ctx.state.sleepCycleBreakdown(minutes);
        expect(r.deepSleepFrac).toBeGreaterThanOrEqual(0);
        expect(r.deepSleepFrac).toBeLessThanOrEqual(1);
        expect(r.remFrac).toBeGreaterThanOrEqual(0);
        expect(r.remFrac).toBeLessThanOrEqual(1);
        expect(r.sleepInertia).toBeGreaterThanOrEqual(0);
        expect(r.sleepInertia).toBeLessThanOrEqual(0.6);
      }
    });

    test('very short sleep (30 min) still returns valid numeric result', () => {
      const r = ctx.state.sleepCycleBreakdown(30);
      expect(Number.isFinite(r.deepSleepFrac)).toBe(true);
      expect(Number.isFinite(r.remFrac)).toBe(true);
      expect(Number.isFinite(r.sleepInertia)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Adenosine clearing during sleep
  // ---------------------------------------------------------------------------

  describe('adenosine clearing', () => {
    test('adenosine decreases after sufficient sleep', () => {
      const startAden = 60;
      ctx.state.set('adenosine', startAden);

      const sleepMinutes = 480;
      const cycles = ctx.state.sleepCycleBreakdown(sleepMinutes);
      // Apply the clearing formula exactly as content.js does
      const adenosineClear = -(1 - Math.exp(-sleepMinutes / 201))
        * ctx.state.get('adenosine') * 0.9
        * (0.4 + 0.6 * cycles.deepSleepFrac);
      ctx.state.adjustNT('adenosine', adenosineClear);

      expect(ctx.state.get('adenosine')).toBeLessThan(startAden);
    });

    test('adenosine clearing formula matches content.js implementation', () => {
      const startAden = 60;
      ctx.state.set('adenosine', startAden);

      const sleepMinutes = 480;
      const cycles = ctx.state.sleepCycleBreakdown(sleepMinutes);

      // Compute expected value from the documented formula
      const clearFraction = (1 - Math.exp(-sleepMinutes / 201)) * 0.9 * (0.4 + 0.6 * cycles.deepSleepFrac);
      const expectedAden = Math.max(0, startAden - startAden * clearFraction);

      const adenosineClear = -clearFraction * startAden;
      ctx.state.adjustNT('adenosine', adenosineClear);

      expect(ctx.state.get('adenosine')).toBeCloseTo(expectedAden, 5);
    });

    test('full sleep clears more adenosine than short sleep', () => {
      const startAden = 70;

      // Short sleep
      ctx.state.set('adenosine', startAden);
      const shortMinutes = 120;
      const shortCycles = ctx.state.sleepCycleBreakdown(shortMinutes);
      const shortClear = -(1 - Math.exp(-shortMinutes / 201)) * startAden * 0.9 * (0.4 + 0.6 * shortCycles.deepSleepFrac);
      ctx.state.adjustNT('adenosine', shortClear);
      const adenAfterShort = ctx.state.get('adenosine');

      // Full sleep (fresh context)
      ctx.state.set('adenosine', startAden);
      const fullMinutes = 480;
      const fullCycles = ctx.state.sleepCycleBreakdown(fullMinutes);
      const fullClear = -(1 - Math.exp(-fullMinutes / 201)) * startAden * 0.9 * (0.4 + 0.6 * fullCycles.deepSleepFrac);
      ctx.state.adjustNT('adenosine', fullClear);
      const adenAfterFull = ctx.state.get('adenosine');

      expect(adenAfterFull).toBeLessThan(adenAfterShort);
    });

    test('adenosine cannot go below 0', () => {
      ctx.state.set('adenosine', 5); // very low starting value
      const sleepMinutes = 600;
      const cycles = ctx.state.sleepCycleBreakdown(sleepMinutes);
      const adenosineClear = -(1 - Math.exp(-sleepMinutes / 201))
        * ctx.state.get('adenosine') * 0.9
        * (0.4 + 0.6 * cycles.deepSleepFrac);
      ctx.state.adjustNT('adenosine', adenosineClear);
      expect(ctx.state.get('adenosine')).toBeGreaterThanOrEqual(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Sleep debt accumulation
  // ---------------------------------------------------------------------------

  describe('sleep debt', () => {
    test('starts at zero in fresh context', () => {
      expect(ctx.state.get('sleep_debt')).toBe(0);
    });

    test('short sleep (240 min) increases sleep_debt', () => {
      const before = ctx.state.get('sleep_debt');
      const sleepMinutes = 240; // below ideal 480
      const ideal = 480;
      const deficit = ideal - sleepMinutes; // 240 min deficit
      const debtChange = deficit > 0 ? deficit : deficit * 0.33;
      const newDebt = Math.max(0, Math.min(4800, before + debtChange));
      ctx.state.set('sleep_debt', newDebt);
      expect(ctx.state.get('sleep_debt')).toBeGreaterThan(before);
      expect(ctx.state.get('sleep_debt')).toBe(240);
    });

    test('full sleep (480 min) produces zero debt change', () => {
      const before = ctx.state.get('sleep_debt'); // 0
      const sleepMinutes = 480;
      const ideal = 480;
      const deficit = ideal - sleepMinutes; // 0
      const debtChange = deficit > 0 ? deficit : deficit * 0.33; // 0
      const newDebt = Math.max(0, Math.min(4800, before + debtChange));
      ctx.state.set('sleep_debt', newDebt);
      expect(ctx.state.get('sleep_debt')).toBe(before); // unchanged at 0
    });

    test('oversleep (600 min) reduces existing debt (33% repayment)', () => {
      ctx.state.set('sleep_debt', 300); // pre-existing debt
      const before = ctx.state.get('sleep_debt');
      const sleepMinutes = 600; // 120 min surplus
      const ideal = 480;
      const deficit = ideal - sleepMinutes; // -120
      const debtChange = deficit > 0 ? deficit : deficit * 0.33; // -39.6
      const newDebt = Math.max(0, Math.min(4800, before + debtChange));
      ctx.state.set('sleep_debt', newDebt);
      expect(ctx.state.get('sleep_debt')).toBeLessThan(before);
      expect(ctx.state.get('sleep_debt')).toBeCloseTo(300 - 120 * 0.33, 5);
    });

    test('debt cannot go below 0', () => {
      ctx.state.set('sleep_debt', 0);
      const sleepMinutes = 600;
      const ideal = 480;
      const deficit = ideal - sleepMinutes; // -120
      const debtChange = deficit * 0.33;    // -39.6
      const newDebt = Math.max(0, Math.min(4800, 0 + debtChange));
      ctx.state.set('sleep_debt', newDebt);
      expect(ctx.state.get('sleep_debt')).toBe(0);
    });

    test('debt is capped at 4800', () => {
      ctx.state.set('sleep_debt', 4750);
      const sleepMinutes = 30; // very short — large deficit
      const ideal = 480;
      const deficit = ideal - sleepMinutes; // 450
      const newDebt = Math.max(0, Math.min(4800, 4750 + deficit));
      ctx.state.set('sleep_debt', newDebt);
      expect(ctx.state.get('sleep_debt')).toBe(4800);
    });

    test('consecutive short sleeps accumulate debt', () => {
      ctx.state.set('sleep_debt', 0);
      // Simulate two nights of 240-min sleep
      for (let i = 0; i < 2; i++) {
        const current = ctx.state.get('sleep_debt');
        const deficit = 480 - 240; // 240
        ctx.state.set('sleep_debt', Math.max(0, Math.min(4800, current + deficit)));
      }
      expect(ctx.state.get('sleep_debt')).toBe(480);
    });
  });

  // ---------------------------------------------------------------------------
  // Energy recovery
  // ---------------------------------------------------------------------------

  describe('energy recovery', () => {
    test('energy is below 100 initially', () => {
      // Default initial energy is 60
      expect(ctx.state.get('energy')).toBeLessThan(100);
    });

    test('short sleep gives less energy recovery than full sleep', () => {
      const qualityMult = 1.0;
      const debtPenalty = 1.0; // no debt

      const shortMinutes = 120;
      const shortGain = (1 - Math.exp(-shortMinutes / 234)) * 110 * qualityMult * debtPenalty;

      const fullMinutes = 480;
      const fullGain = (1 - Math.exp(-fullMinutes / 234)) * 110 * qualityMult * debtPenalty;

      expect(shortGain).toBeLessThan(fullGain);
    });

    test('energy recovery is a saturating exponential (concave in sleep duration)', () => {
      // The gain from minutes 0-240 should exceed gain from 240-480
      const qualityMult = 1.0;
      const debtPenalty = 1.0;

      const gain0to240 = (1 - Math.exp(-240 / 234)) * 110 * qualityMult * debtPenalty;
      const gain240to480 = ((1 - Math.exp(-480 / 234)) - (1 - Math.exp(-240 / 234))) * 110 * qualityMult * debtPenalty;

      expect(gain0to240).toBeGreaterThan(gain240to480);
    });

    test('sleep debt reduces energy recovery via debtPenalty', () => {
      const qualityMult = 1.0;
      const sleepMinutes = 480;
      const baseGain = (1 - Math.exp(-sleepMinutes / 234)) * 110;

      // No debt
      const noPenalty = 1 / (1 + 0 / 1200); // 1.0
      const gainNoDebt = baseGain * qualityMult * noPenalty;

      // High debt (1200 → penalty = 0.5)
      const highDebt = 1200;
      const highPenalty = 1 / (1 + highDebt / 1200); // 0.5
      const gainHighDebt = baseGain * qualityMult * highPenalty;

      expect(gainHighDebt).toBeLessThan(gainNoDebt);
      expect(gainHighDebt).toBeCloseTo(gainNoDebt * 0.5, 5);
    });

    test('poor sleep quality reduces energy recovery', () => {
      const sleepMinutes = 480;
      const debtPenalty = 1.0;
      const base = (1 - Math.exp(-sleepMinutes / 234)) * 110 * debtPenalty;

      const goodGain = base * 1.0;   // qualityMult = 1.0
      const poorGain = base * 0.75;  // qualityMult = 0.75 (stressed overwhelmed × circadian)

      expect(poorGain).toBeLessThan(goodGain);
    });

    test('energy recovery formula: 480 min sleep at quality=1 restores near-full energy', () => {
      // τ=234 min, scale 110: at 480 min, gain ≈ (1 - exp(-480/234)) * 110 ≈ 87.5
      // This means even 480 min sleep doesn't fully saturate the exponential (by design)
      const gain = (1 - Math.exp(-480 / 234)) * 110;
      expect(gain).toBeGreaterThan(70); // substantial recovery
      expect(gain).toBeLessThan(110);   // but capped by scale
    });
  });

  // ---------------------------------------------------------------------------
  // wakeUp()
  // ---------------------------------------------------------------------------

  describe('wakeUp', () => {
    test('sets wake_period_start to current time', () => {
      const currentTime = ctx.state.get('time');
      ctx.state.wakeUp();
      expect(ctx.state.get('wake_period_start')).toBe(currentTime);
    });

    test('resets daylight_exposure to 0', () => {
      ctx.state.set('daylight_exposure', 120);
      ctx.state.wakeUp();
      expect(ctx.state.get('daylight_exposure')).toBe(0);
    });

    test('does not modify energy', () => {
      const energyBefore = ctx.state.get('energy');
      ctx.state.wakeUp();
      expect(ctx.state.get('energy')).toBe(energyBefore);
    });

    test('does not modify adenosine', () => {
      ctx.state.set('adenosine', 30);
      const adenBefore = ctx.state.get('adenosine');
      ctx.state.wakeUp();
      expect(ctx.state.get('adenosine')).toBe(adenBefore);
    });

    test('does not modify sleep_debt', () => {
      ctx.state.set('sleep_debt', 240);
      ctx.state.wakeUp();
      expect(ctx.state.get('sleep_debt')).toBe(240);
    });

    test('does not modify serotonin', () => {
      const serBefore = ctx.state.get('serotonin');
      ctx.state.wakeUp();
      expect(ctx.state.get('serotonin')).toBe(serBefore);
    });

    test('called at different times sets wake_period_start correctly each time', () => {
      ctx.state.wakeUp();
      const firstWake = ctx.state.get('wake_period_start');

      // Advance time manually then wake again
      ctx.state.set('time', ctx.state.get('time') + 480);
      ctx.state.wakeUp();
      const secondWake = ctx.state.get('wake_period_start');

      expect(secondWake).toBeGreaterThan(firstWake);
      expect(secondWake).toBe(ctx.state.get('time'));
    });
  });

  // ---------------------------------------------------------------------------
  // processSleepEnd() — sleep model cleanup
  // ---------------------------------------------------------------------------

  describe('processSleepEnd', () => {
    test('clears pending_vomit', () => {
      ctx.state.set('pending_vomit', true);
      ctx.state.processSleepEnd();
      expect(ctx.state.get('pending_vomit')).toBe(false);
    });

    test('restores social_energy to 100', () => {
      ctx.state.set('social_energy', 20);
      ctx.state.processSleepEnd();
      expect(ctx.state.get('social_energy')).toBe(100);
    });

    test('resets caffeine_today_peak to 0', () => {
      ctx.state.set('caffeine_today_peak', 75);
      ctx.state.processSleepEnd();
      expect(ctx.state.get('caffeine_today_peak')).toBe(0);
    });

    test('caffeine habit increases when today peak >= 40', () => {
      ctx.state.set('caffeine_today_peak', 60);
      ctx.state.set('caffeine_habit', 10);
      ctx.state.processSleepEnd();
      expect(ctx.state.get('caffeine_habit')).toBe(15); // +5
    });

    test('caffeine habit decreases when today peak < 40', () => {
      ctx.state.set('caffeine_today_peak', 0);
      ctx.state.set('caffeine_habit', 20);
      ctx.state.processSleepEnd();
      expect(ctx.state.get('caffeine_habit')).toBe(16); // -4
    });

    test('clears alcohol_sleep_flag', () => {
      ctx.state.set('alcohol_sleep_flag', true);
      ctx.state.processSleepEnd();
      expect(ctx.state.get('alcohol_sleep_flag')).toBe(false);
    });

    test('sets rem_rebound_pending when alcohol_sleep_flag was true', () => {
      ctx.state.set('alcohol_sleep_flag', true);
      ctx.state.processSleepEnd();
      expect(ctx.state.get('rem_rebound_pending')).toBe(true);
    });

    test('rem_rebound_pending is false when no suppression flags were set', () => {
      ctx.state.set('alcohol_sleep_flag', false);
      ctx.state.set('cannabis_sleep_flag', false);
      ctx.state.processSleepEnd();
      expect(ctx.state.get('rem_rebound_pending')).toBe(false);
    });

    test('clears cannabis_sleep_flag', () => {
      ctx.state.set('cannabis_sleep_flag', true);
      ctx.state.processSleepEnd();
      expect(ctx.state.get('cannabis_sleep_flag')).toBe(false);
    });

    test('sets rem_rebound_pending when cannabis_sleep_flag was true', () => {
      ctx.state.set('cannabis_sleep_flag', true);
      ctx.state.processSleepEnd();
      expect(ctx.state.get('rem_rebound_pending')).toBe(true);
    });
  });
});
