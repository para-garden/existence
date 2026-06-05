// tests/nt-drift.test.js — unit tests for NT adjustment and drift
// Covers: adjustNT, advanceTime (drift), NT target properties, moodTone.

import { describe, test, expect, beforeEach } from 'bun:test';
import { createTestContext } from '../js/test-context.js';

// --- Helpers ---

/** Advance time by `hours` game-hours (converts to minutes for advanceTime). */
function advanceHours(ctx, hours) {
  ctx.state.advanceTime(hours * 60);
}

// ============================================================
// adjustNT
// ============================================================

describe('adjustNT — raises values', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('raises serotonin by 10', () => {
    const before = ctx.state.get('serotonin');
    ctx.state.adjustNT('serotonin', 10);
    expect(ctx.state.get('serotonin')).toBeCloseTo(before + 10, 1);
  });

  test('raises dopamine by 15', () => {
    const before = ctx.state.get('dopamine');
    ctx.state.adjustNT('dopamine', 15);
    expect(ctx.state.get('dopamine')).toBeCloseTo(before + 15, 1);
  });

  test('raises norepinephrine by 20', () => {
    const before = ctx.state.get('norepinephrine');
    ctx.state.adjustNT('norepinephrine', 20);
    expect(ctx.state.get('norepinephrine')).toBeCloseTo(before + 20, 1);
  });

  test('raises gaba by 8', () => {
    const before = ctx.state.get('gaba');
    ctx.state.adjustNT('gaba', 8);
    expect(ctx.state.get('gaba')).toBeCloseTo(before + 8, 1);
  });
});

describe('adjustNT — lowers values', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('lowers serotonin by 10', () => {
    const before = ctx.state.get('serotonin');
    ctx.state.adjustNT('serotonin', -10);
    expect(ctx.state.get('serotonin')).toBeCloseTo(before - 10, 1);
  });

  test('lowers dopamine by 5', () => {
    const before = ctx.state.get('dopamine');
    ctx.state.adjustNT('dopamine', -5);
    expect(ctx.state.get('dopamine')).toBeCloseTo(before - 5, 1);
  });
});

describe('adjustNT — clamping at 100', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('serotonin does not exceed 100', () => {
    ctx.state.set('serotonin', 95);
    ctx.state.adjustNT('serotonin', 20);
    expect(ctx.state.get('serotonin')).toBe(100);
  });

  test('dopamine does not exceed 100', () => {
    ctx.state.set('dopamine', 99);
    ctx.state.adjustNT('dopamine', 50);
    expect(ctx.state.get('dopamine')).toBe(100);
  });

  test('norepinephrine does not exceed 100', () => {
    ctx.state.set('norepinephrine', 98);
    ctx.state.adjustNT('norepinephrine', 10);
    expect(ctx.state.get('norepinephrine')).toBe(100);
  });
});

describe('adjustNT — clamping at 0', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('serotonin does not go below 0', () => {
    ctx.state.set('serotonin', 5);
    ctx.state.adjustNT('serotonin', -20);
    expect(ctx.state.get('serotonin')).toBe(0);
  });

  test('gaba does not go below 0', () => {
    ctx.state.set('gaba', 3);
    ctx.state.adjustNT('gaba', -10);
    expect(ctx.state.get('gaba')).toBe(0);
  });

  test('norepinephrine does not go below 0', () => {
    ctx.state.set('norepinephrine', 2);
    ctx.state.adjustNT('norepinephrine', -50);
    expect(ctx.state.get('norepinephrine')).toBe(0);
  });
});

describe('adjustNT — key name validation', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('wrong key "NE" throws', () => {
    expect(() => ctx.state.adjustNT('NE', 30)).toThrow();
  });

  test('wrong key "Serotonin" (capitalized) throws', () => {
    expect(() => ctx.state.adjustNT('Serotonin', 20)).toThrow();
  });

  test('correct key "serotonin" (lowercase) does modify serotonin', () => {
    const before = ctx.state.get('serotonin');
    ctx.state.adjustNT('serotonin', 5);
    expect(ctx.state.get('serotonin')).toBeGreaterThan(before);
  });

  test('correct key "norepinephrine" (full name) does modify it', () => {
    const before = ctx.state.get('norepinephrine');
    ctx.state.adjustNT('norepinephrine', 10);
    expect(ctx.state.get('norepinephrine')).toBeGreaterThan(before);
  });

  test('wrong key "dopamin" (typo) throws', () => {
    expect(() => ctx.state.adjustNT('dopamin', 30)).toThrow();
  });
});

// ============================================================
// advanceTime — NT drift toward target
// ============================================================

describe('advanceTime — NTs drift toward their targets (not away)', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('serotonin drifts toward target after 6 hours when pushed low', () => {
    // Push serotonin well below target (default target ~50) and let it drift up.
    ctx.state.set('serotonin', 20);
    const before = ctx.state.get('serotonin');
    advanceHours(ctx, 6);
    const after = ctx.state.get('serotonin');
    // Serotonin should have moved toward ~50 (up from 20), so it should increase.
    // upRate=0.06/hr → after 6h: decay = exp(-0.06*6) ≈ 0.698
    // Δ from target: (20-50)*0.698 ≈ -20.9 → new value ≈ 50-20.9 = 29.1 (ignoring jitter ±3.5)
    expect(after).toBeGreaterThan(before);
  });

  test('serotonin drifts toward target after 6 hours when pushed high', () => {
    // Push serotonin above target; it should come down.
    ctx.state.set('serotonin', 80);
    const before = ctx.state.get('serotonin');
    advanceHours(ctx, 6);
    const after = ctx.state.get('serotonin');
    // downRate=0.08/hr → after 6h: decay = exp(-0.08*6) ≈ 0.619
    // Serotonin target at default state ~50; 80 should drift down.
    expect(after).toBeLessThan(before);
  });

  test('dopamine drifts toward target after 2 hours when pushed low', () => {
    ctx.state.set('dopamine', 25);
    const before = ctx.state.get('dopamine');
    advanceHours(ctx, 2);
    const after = ctx.state.get('dopamine');
    // upRate=0.35/hr → decay = exp(-0.35*2) ≈ 0.497 — significant rise expected
    expect(after).toBeGreaterThan(before);
  });

  test('dopamine drifts toward target after 2 hours when pushed high', () => {
    ctx.state.set('dopamine', 85);
    const before = ctx.state.get('dopamine');
    advanceHours(ctx, 2);
    const after = ctx.state.get('dopamine');
    expect(after).toBeLessThan(before);
  });

  test('norepinephrine drifts toward target after 1 hour when pushed high', () => {
    // Default NE = 40, target at neutral state ≈ 40+stress*0.18 ≈ 40+30*0.18 ≈ 45.4
    // Push NE to 80 — well above target, it should fall.
    ctx.state.set('norepinephrine', 80);
    const before = ctx.state.get('norepinephrine');
    advanceHours(ctx, 1);
    const after = ctx.state.get('norepinephrine');
    expect(after).toBeLessThan(before);
  });

  test('gaba drifts toward target after 12 hours when pushed low', () => {
    // GABA upRate=0.03/hr, very slow. Use 12h for meaningful movement.
    // Default stress=30 → gabaTarget ≈ 55 - 30*0.12 = 51.4; GABA default=55 is above that.
    // Push GABA to 28 (below target) so it drifts up.
    ctx.state.set('gaba', 28);
    const before = ctx.state.get('gaba');
    advanceHours(ctx, 12);
    const after = ctx.state.get('gaba');
    expect(after).toBeGreaterThan(before);
  });
});

describe('advanceTime — adenosine accumulates when awake', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('adenosine increases after 4 hours when awake (not sleeping)', () => {
    ctx.state.set('is_sleeping', false);
    const before = ctx.state.get('adenosine');
    advanceHours(ctx, 4);
    const after = ctx.state.get('adenosine');
    // Saturating exponential: 100 - (100-20)*exp(-4/18) ≈ 100 - 80*0.799 ≈ 36.1
    // Should be higher than initial 20.
    expect(after).toBeGreaterThan(before);
  });

  test('adenosine increases after 8 hours when awake', () => {
    ctx.state.set('adenosine', 20);
    ctx.state.set('is_sleeping', false);
    advanceHours(ctx, 8);
    const after = ctx.state.get('adenosine');
    // After 8h: 100 - (100-20)*exp(-8/18) ≈ 100 - 80*0.641 ≈ 48.7
    expect(after).toBeGreaterThan(40);
  });

  test('adenosine stays below 100 after a very long awake period', () => {
    ctx.state.set('adenosine', 20);
    ctx.state.set('is_sleeping', false);
    advanceHours(ctx, 48);
    const after = ctx.state.get('adenosine');
    // Saturating: approaches 100 but never exceeds it
    expect(after).toBeLessThanOrEqual(100);
  });
});

describe('advanceTime — values stay within [0, 100] after large time advance', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('serotonin stays within [0, 100] after 72 hours', () => {
    advanceHours(ctx, 72);
    const val = ctx.state.get('serotonin');
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(100);
  });

  test('dopamine stays within [0, 100] after 72 hours', () => {
    advanceHours(ctx, 72);
    const val = ctx.state.get('dopamine');
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(100);
  });

  test('norepinephrine stays within [0, 100] after 72 hours', () => {
    advanceHours(ctx, 72);
    const val = ctx.state.get('norepinephrine');
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(100);
  });

  test('gaba stays within [0, 100] after 72 hours', () => {
    advanceHours(ctx, 72);
    const val = ctx.state.get('gaba');
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(100);
  });

  test('adenosine stays within [0, 100] after 72 hours', () => {
    advanceHours(ctx, 72);
    const val = ctx.state.get('adenosine');
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(100);
  });

  test('all NT keys stay within [0, 100] after a large time step', () => {
    const ntKeys = [
      'serotonin', 'dopamine', 'norepinephrine', 'gaba', 'glutamate',
      'endorphin', 'acetylcholine', 'endocannabinoid', 'histamine',
      'cortisol', 'melatonin', 'adenosine', 'testosterone',
    ];
    advanceHours(ctx, 24);
    for (const key of ntKeys) {
      const val = ctx.state.get(key);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });
});

// ============================================================
// NT targets — stress affects DA/NE/GABA but NOT serotonin
// ============================================================

describe('NT targets — stress coupling design contract', () => {
  let ctx;

  // Run two scenarios: zero stress vs high stress. Compare NT drift direction.
  // Because we can't call target functions directly, we pin NTs at 50 and observe
  // which way they drift after 1 hour under each stress level.

  test('high stress causes serotonin to drift differently from low stress only via non-stress paths', () => {
    // The design rule: serotoninTarget() does NOT include stress. So setting stress
    // high should not cause serotonin to drift lower compared to low-stress baseline
    // (when all other state is held equal).
    // We verify this by comparing the direction and approximate magnitude of drift.

    // Context A: low stress
    const ctxA = createTestContext(100);
    ctxA.state.init();
    ctxA.state.set('serotonin', 50);
    ctxA.state.set('stress', 5);
    advanceHours(ctxA, 6);
    const serA = ctxA.state.get('serotonin');

    // Context B: high stress
    const ctxB = createTestContext(100);
    ctxB.state.init();
    ctxB.state.set('serotonin', 50);
    ctxB.state.set('stress', 90);
    advanceHours(ctxB, 6);
    const serB = ctxB.state.get('serotonin');

    // Both should drift toward roughly the same target (which does not include stress).
    // The difference between them should be small — jitter ±3.5 is the noise floor.
    // If stress were in serotoninTarget, high-stress context would drift much lower.
    // We check the gap is within ±10 points (generous for jitter + indirect effects).
    expect(Math.abs(serA - serB)).toBeLessThan(10);
  });

  test('high stress pushes dopamine target lower (stress is in dopamineTarget)', () => {
    // dopamineTarget subtracts stress*0.08 — at stress=90 that's -7.2 pts from baseline.
    // With dopamine at 50, high-stress target is ~50-7.2 = 42.8 → dopamine drifts down.
    const ctxLow = createTestContext(200);
    ctxLow.state.init();
    ctxLow.state.set('dopamine', 50);
    ctxLow.state.set('stress', 5);
    advanceHours(ctxLow, 4);
    const daLow = ctxLow.state.get('dopamine');

    const ctxHigh = createTestContext(200);
    ctxHigh.state.init();
    ctxHigh.state.set('dopamine', 50);
    ctxHigh.state.set('stress', 90);
    advanceHours(ctxHigh, 4);
    const daHigh = ctxHigh.state.get('dopamine');

    // High stress → lower dopamine target → dopamine drifts lower
    expect(daHigh).toBeLessThan(daLow);
  });

  test('high stress raises norepinephrine target (stress is in norepinephrineTarget)', () => {
    // norepinephrineTarget: t = 40 + stress*0.18
    // At stress=90: target ≈ 40 + 16.2 = 56.2; NE at 40 should drift up.
    // At stress=5: target ≈ 40 + 0.9 = 40.9; NE at 40 barely moves.

    const ctxLow = createTestContext(300);
    ctxLow.state.init();
    ctxLow.state.set('norepinephrine', 40);
    ctxLow.state.set('stress', 5);
    advanceHours(ctxLow, 2);
    const neLow = ctxLow.state.get('norepinephrine');

    const ctxHigh = createTestContext(300);
    ctxHigh.state.init();
    ctxHigh.state.set('norepinephrine', 40);
    ctxHigh.state.set('stress', 90);
    advanceHours(ctxHigh, 2);
    const neHigh = ctxHigh.state.get('norepinephrine');

    // High stress → higher NE target → NE drifts higher
    expect(neHigh).toBeGreaterThan(neLow);
  });

  test('high stress lowers gaba target (stress is in gabaTarget)', () => {
    // gabaTarget: t = 55 - stress*0.12
    // At stress=90: target ≈ 55 - 10.8 = 44.2; GABA at 55 should drift down.
    // At stress=5: target ≈ 55 - 0.6 = 54.4; GABA barely moves.

    const ctxLow = createTestContext(400);
    ctxLow.state.init();
    ctxLow.state.set('gaba', 55);
    ctxLow.state.set('stress', 5);
    advanceHours(ctxLow, 12);
    const gabaLow = ctxLow.state.get('gaba');

    const ctxHigh = createTestContext(400);
    ctxHigh.state.init();
    ctxHigh.state.set('gaba', 55);
    ctxHigh.state.set('stress', 90);
    advanceHours(ctxHigh, 12);
    const gabaHigh = ctxHigh.state.get('gaba');

    // High stress → lower GABA target → GABA drifts lower
    expect(gabaHigh).toBeLessThan(gabaLow);
  });

  test('NT targets return values that keep NTs in plausible [0, 100] range', () => {
    // Run for a long time with extreme stress; NTs should stabilize in range.
    const ctxEx = createTestContext(500);
    ctxEx.state.init();
    ctxEx.state.set('stress', 100);
    advanceHours(ctxEx, 48);
    const keys = ['serotonin', 'dopamine', 'norepinephrine', 'gaba'];
    for (const k of keys) {
      const v = ctxEx.state.get(k);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

// ============================================================
// moodTone
// ============================================================

describe('moodTone — low serotonin + dopamine', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
    // Ensure physical overrides don't fire: stress < 75, energy > 15
    ctx.state.set('stress', 20);
    ctx.state.set('energy', 60);
  });

  test('very low serotonin + very low dopamine → "numb"', () => {
    // moodTone: if (ser < 25 && dop < 25) return 'numb'
    ctx.state.set('serotonin', 20);
    ctx.state.set('dopamine', 20);
    expect(ctx.state.moodTone()).toBe('numb');
  });

  test('low serotonin + low dopamine → "heavy"', () => {
    // moodTone: (ser < 35 && dop < 35) return 'heavy'
    ctx.state.set('serotonin', 30);
    ctx.state.set('dopamine', 30);
    // Also need energy > 25 to avoid energy override
    ctx.state.set('energy', 60);
    expect(ctx.state.moodTone()).toBe('heavy');
  });
});

describe('moodTone — high serotonin + dopamine', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
    ctx.state.set('stress', 10);
    ctx.state.set('energy', 80);
  });

  test('high serotonin + high dopamine + moderate NE + adequate GABA → "clear"', () => {
    // moodTone: ser > 65 && dop > 65 && ne > 30 && ne < 60 && ga > 45 → 'clear'
    ctx.state.set('serotonin', 70);
    ctx.state.set('dopamine', 70);
    ctx.state.set('norepinephrine', 45);
    ctx.state.set('gaba', 55);
    expect(ctx.state.moodTone()).toBe('clear');
  });

  test('serotonin and dopamine above moderate threshold → "present"', () => {
    // moodTone: ser > 45 && dop > 42 → 'present' (when 'clear' conditions not met)
    ctx.state.set('serotonin', 50);
    ctx.state.set('dopamine', 50);
    // NE out of 'clear' range to ensure we get 'present' not 'clear'
    ctx.state.set('norepinephrine', 65);
    ctx.state.set('gaba', 50);
    expect(ctx.state.moodTone()).toBe('present');
  });
});

describe('moodTone — physical overrides', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('very high stress → "fraying" regardless of NT levels', () => {
    // moodTone: if (st > 75) return 'fraying'
    ctx.state.set('stress', 80);
    ctx.state.set('serotonin', 70);
    ctx.state.set('dopamine', 70);
    expect(ctx.state.moodTone()).toBe('fraying');
  });

  test('low energy + high stress → "numb" (physical shutdown override)', () => {
    // moodTone: if (e <= 15 && st > 60) return 'numb'
    ctx.state.set('energy', 10);
    ctx.state.set('stress', 65);
    ctx.state.set('serotonin', 60);
    ctx.state.set('dopamine', 60);
    expect(ctx.state.moodTone()).toBe('numb');
  });

  test('high NE + low GABA → "fraying" (neurochemical override)', () => {
    // moodTone: if (ne > 65 && ga < 35) return 'fraying'
    ctx.state.set('stress', 20);
    ctx.state.set('energy', 60);
    ctx.state.set('norepinephrine', 70);
    ctx.state.set('gaba', 30);
    ctx.state.set('serotonin', 60);
    ctx.state.set('dopamine', 60);
    expect(ctx.state.moodTone()).toBe('fraying');
  });
});

describe('moodTone — default / neutral state', () => {
  let ctx;
  beforeEach(() => {
    ctx = createTestContext();
    ctx.state.init();
  });

  test('moodTone returns a non-empty string in default state', () => {
    const tone = ctx.state.moodTone();
    expect(typeof tone).toBe('string');
    expect(tone.length).toBeGreaterThan(0);
  });

  test('moodTone returns one of the eight known tones', () => {
    const validTones = ['fraying', 'numb', 'heavy', 'hollow', 'quiet', 'clear', 'present', 'flat'];
    const tone = ctx.state.moodTone();
    expect(validTones).toContain(tone);
  });
});

// ============================================================
// MOMENTARY-AFFECT PERTURBATION — deterministic-replay regression.
// The injector inside advanceTime() is a new `rng` consumer (CURRENT_VERSION 38). These tests
// are the load-bearing regression for the FIXED PER-QUANTUM DRAW-COUNT guarantee: the same
// advanceTime(m) must consume exactly floor(m) `rng` draws regardless of outcome, so that the
// same seed + same action sequence reproduces identical NT state and identical rng position.
// (docs/design/reactivity-axis.md §3.) Without this, replay would desync.
// ============================================================
describe('momentary-affect perturbations — deterministic replay', () => {
  /** Count `rng` draws consumed during a fn() by wrapping timeline.random. */
  function countDraws(ctx, fn) {
    let n = 0;
    const orig = ctx.timeline.random.bind(ctx.timeline);
    ctx.timeline.random = () => { n++; return orig(); };
    fn();
    ctx.timeline.random = orig;
    return n;
  }

  test('awake advanceTime(m) consumes exactly floor(m) injector draws (fixed count)', () => {
    for (const m of [1, 5, 30, 60, 137]) {
      const ctx = createTestContext(0xABCDEF);
      ctx.state.init();
      ctx.state.set('is_sleeping', false);
      const draws = countDraws(ctx, () => ctx.state.advanceTime(m));
      // The injector is the only `rng` consumer in advanceTime for a freshly-init awake character
      // with no gig work / no triggered events; it draws exactly once per whole minute.
      expect(draws).toBe(Math.floor(m));
    }
  });

  test('draw count is OUTCOME-INDEPENDENT — same count whether blips land near a wall or mid-range', () => {
    // Position the fast systems at very different levels (one near floor, one mid). Blip occurrence
    // and the soft-clip change the EFFECT, but never the number of draws.
    const ctxLow = createTestContext(0xABCDEF); ctxLow.state.init();
    ctxLow.state.set('is_sleeping', false);
    ctxLow.state.set('dopamine', 2); ctxLow.state.set('norepinephrine', 2);
    const ctxMid = createTestContext(0xABCDEF); ctxMid.state.init();
    ctxMid.state.set('is_sleeping', false);
    ctxMid.state.set('dopamine', 50); ctxMid.state.set('norepinephrine', 50);
    const dLow = countDraws(ctxLow, () => ctxLow.state.advanceTime(60));
    const dMid = countDraws(ctxMid, () => ctxMid.state.advanceTime(60));
    expect(dLow).toBe(60);
    expect(dMid).toBe(60);
  });

  test('sleeping suppresses the injector — zero injector draws while asleep', () => {
    const ctx = createTestContext(0xABCDEF);
    ctx.state.init();
    ctx.state.set('is_sleeping', true);
    const draws = countDraws(ctx, () => ctx.state.advanceTime(60));
    expect(draws).toBe(0);
  });

  test('same seed + same action sequence → bit-identical NT trajectory (replay determinism)', () => {
    function run() {
      const ctx = createTestContext(0x5EED42);
      ctx.state.init();
      ctx.state.set('is_sleeping', false);
      ctx.state.set('neuroticism', 70); ctx.state.set('self_esteem', 30); ctx.state.set('rumination', 65);
      const traj = [];
      for (let i = 0; i < 24; i++) {
        ctx.state.advanceTime(13); // odd quantum exercises floor() + the injector across a day
        traj.push([
          ctx.state.get('dopamine'),
          ctx.state.get('norepinephrine'),
          ctx.state.get('serotonin'),
        ]);
      }
      return traj;
    }
    const a = run();
    const b = run();
    expect(b).toEqual(a); // identical seed + identical sequence ⇒ identical state, with the new consumer
    // Sanity: the perturbations actually moved the fast systems (the trajectory is not static).
    const daVals = a.map(t => t[0]);
    expect(Math.max(...daVals) - Math.min(...daVals)).toBeGreaterThan(0);
  });

  test('momentary noise never pins a fast system at a hard clamp (0/100) over a long awake run', () => {
    const ctx = createTestContext(0xC0FFEE);
    ctx.state.init();
    ctx.state.set('is_sleeping', false);
    ctx.state.set('neuroticism', 80); ctx.state.set('self_esteem', 20); ctx.state.set('rumination', 80);
    let hard = 0, n = 0;
    for (let i = 0; i < 48; i++) {
      ctx.state.advanceTime(30);
      for (const k of ['dopamine', 'norepinephrine']) {
        const v = ctx.state.get(k); n++;
        if (v <= 0.0001 || v >= 99.9999) hard++;
      }
    }
    // The live soft-clip drives a blip's effect to 0 as the level meets the wall it pushes toward,
    // so noise cannot pin a hard clamp. Allow none.
    expect(hard).toBe(0);
  });
});
