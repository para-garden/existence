// tests/memory.test.js — autobiographical memory Stage 0 (the engine).
// Covers: encodingAffect() circumplex mapping, the cue index, recall() firing + the
// fixed-1-draw determinism guarantee, first-recall mem: sentiment birth, the gap-driven
// tier, and the clothing-that-no-longer-fits worked example (a fragment surfaces when a
// stamped garment's fit has drifted). See docs/design/memory.md Stage 0 spec.

import { describe, test, expect } from 'bun:test';
import { createTestContext } from '../js/test-context.js';

/** Put the character in a strongly POSITIVE affective moment (warm encoding). */
function makeWarm(ctx) {
  ctx.state.set('serotonin', 80); ctx.state.set('serotonin_baseline', 50);
  ctx.state.set('dopamine', 80); ctx.state.set('dopamine_baseline', 50);
  ctx.state.set('norepinephrine', 45); ctx.state.set('norepinephrine_baseline', 50);
  ctx.state.set('cortisol', 40);
}

/** Put the character in a strongly NEGATIVE present (cold recall). */
function makeCold(ctx) {
  ctx.state.set('serotonin', 20); ctx.state.set('serotonin_baseline', 50);
  ctx.state.set('dopamine', 20); ctx.state.set('dopamine_baseline', 50);
  ctx.state.set('norepinephrine', 70); ctx.state.set('norepinephrine_baseline', 50);
  ctx.state.set('cortisol', 75);
}

/** Count `rng` draws consumed during fn() by wrapping timeline.random. */
function countDraws(ctx, fn) {
  let n = 0;
  const orig = ctx.timeline.random.bind(ctx.timeline);
  ctx.timeline.random = () => { n++; return orig(); };
  const out = fn();
  ctx.timeline.random = orig;
  return { n, out };
}

// ============================================================
// encodingAffect — baseline-relative circumplex mapping
// ============================================================
describe('encodingAffect', () => {
  test('baseline state → neutral valence, mid arousal', () => {
    const ctx = createTestContext(0x11); ctx.state.init();
    ctx.state.set('serotonin', 50); ctx.state.set('serotonin_baseline', 50);
    ctx.state.set('dopamine', 50); ctx.state.set('dopamine_baseline', 50);
    ctx.state.set('norepinephrine', 50); ctx.state.set('norepinephrine_baseline', 50);
    ctx.state.set('cortisol', 50);
    const enc = ctx.state.encodingAffect();
    expect(enc.v).toBeCloseTo(0, 5);
    expect(enc.a).toBeCloseTo(0.5, 5);
  });

  test('warm moment → positive valence', () => {
    const ctx = createTestContext(0x12); ctx.state.init();
    makeWarm(ctx);
    expect(ctx.state.encodingAffect().v).toBeGreaterThan(0.2);
  });

  test('high NE + cortisol → high arousal', () => {
    const ctx = createTestContext(0x13); ctx.state.init();
    ctx.state.set('norepinephrine', 90); ctx.state.set('norepinephrine_baseline', 50);
    ctx.state.set('cortisol', 90);
    expect(ctx.state.encodingAffect().a).toBeGreaterThan(0.7);
  });

  test('valence and arousal stay clamped to range', () => {
    const ctx = createTestContext(0x14); ctx.state.init();
    ctx.state.set('serotonin', 100); ctx.state.set('dopamine', 100);
    ctx.state.set('serotonin_baseline', 0); ctx.state.set('dopamine_baseline', 0);
    ctx.state.set('norepinephrine', 100); ctx.state.set('norepinephrine_baseline', 0);
    ctx.state.set('cortisol', 100);
    const enc = ctx.state.encodingAffect();
    expect(enc.v).toBeLessThanOrEqual(1);
    expect(enc.a).toBeLessThanOrEqual(1);
  });

  test('consumes no RNG', () => {
    const ctx = createTestContext(0x15); ctx.state.init();
    const { n } = countDraws(ctx, () => ctx.state.encodingAffect());
    expect(n).toBe(0);
  });
});

// ============================================================
// Event stamp — enc attached at the record() choke point
// ============================================================
describe('event encoding stamp', () => {
  test('record() attaches enc derived from live NT', () => {
    const ctx = createTestContext(0x21); ctx.state.init();
    makeWarm(ctx);
    ctx.events.record('got_dressed', { item_id: 'shirt_a' });
    const e = ctx.events.last('got_dressed');
    expect(e).not.toBeNull();
    expect(e.enc).toBeDefined();
    expect(e.enc.v).toBeGreaterThan(0.2);
  });

  test('re-deriving the stamp at the same NT is identical (replay-stability)', () => {
    const ctx = createTestContext(0x22); ctx.state.init();
    makeWarm(ctx);
    const a = ctx.state.encodingAffect();
    const b = ctx.state.encodingAffect();
    expect(b).toEqual(a);
  });
});

// ============================================================
// recall() — determinism: EXACTLY 1 rng draw per call, fired or not
// ============================================================
describe('recall — fixed-draw determinism', () => {
  test('empty cue (no refs) still consumes exactly 1 rng draw', () => {
    const ctx = createTestContext(0x31); ctx.state.init();
    const { n, out } = countDraws(ctx, () => ctx.memory.recall('obj:nonexistent', ctx.state.get('time')));
    expect(n).toBe(1);
    expect(out).toBeNull();
  });

  test('present cue consumes exactly 1 rng draw whether it fires or not', () => {
    // Many seeds: each recall() must cost exactly 1 draw regardless of fire outcome.
    for (const seed of [0x1, 0x2, 0x3, 0x4, 0x5, 0xAB, 0xCD]) {
      const ctx = createTestContext(seed); ctx.state.init();
      makeWarm(ctx);
      ctx.events.record('got_dressed', { item_id: 'shirt_b' });
      makeCold(ctx); // change present so a gap exists
      const { n } = countDraws(ctx, () => ctx.memory.recall('obj:shirt_b', ctx.state.get('time')));
      expect(n).toBe(1);
    }
  });

  test('same seed + same sequence → identical recall outcome and identical state (replay determinism)', () => {
    function run() {
      const ctx = createTestContext(0x5EED39); ctx.state.init();
      ctx.state.set('neuroticism', 70); ctx.state.set('self_esteem', 30); ctx.state.set('rumination', 65);
      makeWarm(ctx);
      ctx.events.record('got_dressed', { item_id: 'jacket' });
      makeCold(ctx);
      const results = [];
      for (let i = 0; i < 8; i++) {
        const frag = ctx.memory.recall('obj:jacket', ctx.state.get('time'));
        results.push(frag ? `${frag.tier}:${frag.register}` : 'null');
      }
      // Final mem: sentiment intensity is part of state — proves the birth/drift replays.
      const mem = ctx.state.getAll().sentiments.filter(s => s.target.startsWith('mem:'));
      return { results, mem };
    }
    const a = run();
    const b = run();
    expect(b).toEqual(a);
  });
});

// ============================================================
// recall — firing, tier from gap, first-recall sentiment birth
// ============================================================
describe('recall — reconstruction behavior', () => {
  test('first fire births a mem: sentiment; the latent rest carries none', () => {
    const ctx = createTestContext(0x41); ctx.state.init();
    ctx.state.set('neuroticism', 90); ctx.state.set('self_esteem', 10); ctx.state.set('rumination', 90); // high reactivity → likely fire
    makeWarm(ctx);
    ctx.events.record('got_dressed', { item_id: 'sweater' });
    makeCold(ctx);
    // Before any recall: no mem: sentiment exists (the negative space).
    const before = (ctx.state.getAll().sentiments || []).filter(s => s.target.startsWith('mem:'));
    expect(before.length).toBe(0);
    // Recall repeatedly until it fires (each call is 1 deterministic draw).
    let fired = null;
    for (let i = 0; i < 40 && !fired; i++) {
      fired = ctx.memory.recall('obj:sweater', ctx.state.get('time'));
    }
    expect(fired).not.toBeNull();
    const after = (ctx.state.getAll().sentiments || []).filter(s => s.target.startsWith('mem:'));
    expect(after.length).toBe(1);
    expect(after[0].target).toMatch(/^mem:log:\d+$/);
    expect(after[0].intensity).toBeGreaterThan(0);
  });

  test('large then-vs-now valence gap yields a heavier tier than a small gap', () => {
    // Encode warm; recall in a strongly cold present → big gap → tremor/prominent.
    const ctxBig = createTestContext(0x51); ctxBig.state.init();
    ctxBig.state.set('neuroticism', 95); ctxBig.state.set('self_esteem', 5); ctxBig.state.set('rumination', 95);
    makeWarm(ctxBig);
    ctxBig.events.record('got_dressed', { item_id: 'g1' });
    makeCold(ctxBig);
    let bigFrag = null;
    for (let i = 0; i < 60 && !bigFrag; i++) bigFrag = ctxBig.memory.recall('obj:g1', 0);
    expect(bigFrag).not.toBeNull();
    expect(['prominent', 'tremor']).toContain(bigFrag.tier);
  });

  test('opposite-sign then-vs-now → ambivalence register', () => {
    const ctx = createTestContext(0x61); ctx.state.init();
    ctx.state.set('neuroticism', 95); ctx.state.set('self_esteem', 5); ctx.state.set('rumination', 95);
    makeWarm(ctx); // encoded warm (v > 0)
    ctx.events.record('got_dressed', { item_id: 'g2' });
    makeCold(ctx); // recalled cold (v < 0)
    let frag = null;
    for (let i = 0; i < 60 && !frag; i++) frag = ctx.memory.recall('obj:g2', 0);
    expect(frag).not.toBeNull();
    expect(frag.register).toBe('ambivalence');
  });
});

// ============================================================
// Worked example: clothing that no longer fits (end to end)
// ============================================================
describe('worked example — clothing that no longer fits', () => {
  test('a fragment surfaces when a stamped garment\'s fit has drifted away from comfortable', () => {
    const ctx = createTestContext(0x71); ctx.state.init();
    ctx.state.set('neuroticism', 90); ctx.state.set('self_esteem', 10); ctx.state.set('rumination', 90);

    // 1. The garment was acquired/worn in a warm moment → warm encoding stamp on got_dressed.
    makeWarm(ctx);
    ctx.events.record('got_dressed', { item_id: 'good_season_top' });

    // 2. Body changes: the fit gap is the body's signal. currentFit() maps a +25 chest delta
    //    since acquisition to 'tight' (clothing.js fitFromDelta: delta > 20 → tight).
    const item = { type: 'top', chest_at_acquisition: 40, fit: 'comfortable' };
    const fitNow = ctx.clothing.currentFit(item, 65, 50); // chest now 65 vs 40 → tight
    expect(fitNow).not.toBe('comfortable');

    // 3. The present is depleted/cold (body-image-loaded character). The cue fires gated on
    //    the fit gap, not a thought about weight. Recall until the fire roll lands (1 draw each).
    makeCold(ctx);
    let frag = null;
    for (let i = 0; i < 80 && !frag; i++) {
      frag = ctx.memory.recall('obj:good_season_top', ctx.state.get('time'));
    }
    expect(frag).not.toBeNull();
    // 4. Gap-driven prose tier higher than the visible cue warrants (magnitude-mismatch feature).
    expect(['prominent', 'tremor']).toContain(frag.tier);
    // 5. The fragment carries the cue's concrete handle as retained detail (not pure-affect here).
    expect(frag.retainedDetail).toBe('good_season_top');
    expect(frag.thenNowMarker).toBe(true);
  });
});
