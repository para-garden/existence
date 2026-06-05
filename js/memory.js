// memory.js — autobiographical memory as cued reconstruction (Stage 0, the engine).
//
// Stage 0 is the MECHANISM, not the content: a named query surface (recall) over a
// DERIVED, non-persisted cue index. There is no memory bank — a memory's experiential
// existence IS the set of times recall() fired for it (the §3 "negative space"). The
// only persisted trace is a mem:<source>:<idx> SENTIMENT, born on first recall and
// thereafter drifted/sleep-processed by the existing sentiment system.
//
// Determinism: recall() is state-bearing (it can append player-visible prose and births
// a sentiment feeding the NT engine). It consumes EXACTLY ONE `rng` draw per call —
// the fire/no-fire roll — spent whether or not a fragment fires, so the draw count is
// outcome-independent and replay never desyncs (mirrors the momentary-affect injector's
// fixed-draw guarantee). recall() is called ONLY from interaction execute() paths that
// already touch the cue object, never per-tick — so it does not inflate idle draws.
//
// See docs/design/memory.md "Stage 0 — Implementation Spec (reality-checked)".

/**
 * A prose-shaping payload — never stored, never a number shown to the player.
 * @typedef {{ tier: 'uneasy' | 'prominent' | 'tremor', retainedDetail: string | null, thenNowMarker: true, register: string }} MemoryFragment
 */

/** @param {GameContext} ctx */
export function createMemory(ctx) {
  // Derived cue index: cueKey -> ref[], where ref = { source: 'log', idx }.
  // NEVER persisted. Rebuilt lazily when the event-log length changes (the only
  // authority is the replay-reconstructed log itself). Stage 0 has only 'log';
  // 'backstory' refs arrive with the Stage 1 episodic spine.
  /** @type {Map<string, Array<{ source: 'log', idx: number }>> | null} */
  let cueIndex = null;
  let indexedLength = -1;

  // Approximation debt (memory fire-rate): base_p chosen so most cue-encounters roll
  // nothing — rarity is load-bearing (a fragment that fires every time is wallpaper, not
  // an intrusion). Not calibrated against any intrusion-frequency dataset.
  const BASE_FIRE_P = 0.5;

  // Approximation debt (memory reconsolidation-drift): per-recall drift magnitude chosen.
  // Reconsolidation direction (each recall re-writes the trace) is well-supported
  // (Nader, Schafe & LeDoux 2000 — PMID 10963596, unverified in this session; confirm
  // before relying), but the rate is not calibrated.
  const DRIFT = 0.04;

  /**
   * Derive the cue key an event binds, or null if it binds none.
   * Stage 0 cue-bearing events: got_dressed (garment, via data.item_id) and
   * ate (dish, via data.what — already recorded by the eat interactions).
   * @param {EventEntry} e
   * @returns {string | null}
   */
  function cueKeyOf(e) {
    if (e.type === 'got_dressed' && e.data && typeof e.data.item_id === 'string') {
      return 'obj:' + e.data.item_id;
    }
    if (e.type === 'ate' && e.data && typeof e.data.what === 'string') {
      return 'food:' + e.data.what;
    }
    return null;
  }

  /** Rebuild the cue index from the current event log. No PRNG, no state mutation. */
  function buildIndex() {
    /** @type {Map<string, Array<{ source: 'log', idx: number }>>} */
    const idx = new Map();
    const log = ctx.events.all();
    for (let i = 0; i < log.length; i++) {
      const e = log[i];
      if (!e) continue;
      const key = cueKeyOf(e);
      if (!key) continue;
      let refs = idx.get(key);
      if (!refs) { refs = []; idx.set(key, refs); }
      refs.push({ source: 'log', idx: i });
    }
    cueIndex = idx;
    indexedLength = log.length;
  }

  /** Return the cue index, rebuilding if the log changed since last build. */
  function index() {
    const len = ctx.events.all().length;
    if (cueIndex === null || len !== indexedLength) buildIndex();
    return /** @type {Map<string, Array<{ source: 'log', idx: number }>>} */ (cueIndex);
  }

  /** saturating(|v| + a) in [0,1] — encoding strength: how charged the moment was.
   * @param {{ v: number, a: number }} enc */
  function encodingStrength(enc) {
    return Math.min(1, Math.abs(enc.v) + enc.a);
  }

  /**
   * Stage 0 register from gap geometry (coarse: comfort / grief / ambivalence).
   * The longing/nostalgia/dread split needs loss_type (Stage 2) — not built here.
   * @param {number} encV @param {number} nowV
   */
  function registerFloor(encV, nowV) {
    const gap = Math.abs(encV - nowV);
    // Opposite-sign then-vs-now → ambivalence (the warm thing now reads cold, or vice versa).
    if (Math.sign(encV) !== Math.sign(nowV) && encV !== 0 && nowV !== 0) return 'ambivalence';
    // Encoded warm but recalled in a strongly negative present → grief (foreclosed-feeling).
    // Stage 0 has no loss_type, so grief is gated on a strongly negative current valence only.
    if (encV > 0.1 && nowV < -0.4) return 'grief';
    // Both warm and small gap → comfort.
    if (encV > 0 && nowV > 0 && gap < 0.5) return 'comfort';
    // Default for everything else (cold-then-cold, faint signal): ambivalence is the
    // honest coarse label — Stage 0 deliberately under-renders rather than over-claim.
    return 'ambivalence';
  }

  /**
   * Map the then-vs-now valence gap to a typographic inner-voice tier.
   * The tier is driven by the GAP, NOT by the cue's visible size — a coffee mug
   * producing tremor-tier prose is the feature (§5 magnitude-mismatch). Code has
   * three inner-voice tiers (uneasy/prominent/tremor); gap in [0,2] maps across them.
   * @param {number} gap
   * @returns {'uneasy' | 'prominent' | 'tremor'}
   */
  function tierFromGap(gap) {
    if (gap >= 1.2) return 'tremor';
    if (gap >= 0.6) return 'prominent';
    return 'uneasy';
  }

  /**
   * Reconstruct at most ONE memory fragment cued by cueKey against CURRENT state.
   * Consumes exactly 1 `rng` draw (the fire roll), fired or not — outcome-independent.
   *
   * @param {string} cueKey — e.g. 'obj:<item_id>' or 'food:<dish_id>'
   * @param {number} _now — current game time (reserved; Stage 0 has no decay/recency use)
   * @returns {MemoryFragment | null}
   */
  function recall(cueKey, _now) {
    const refs = index().get(cueKey);

    // The fire roll is ALWAYS drawn — even on the empty path — to keep the draw count
    // outcome-independent (1 `rng` draw per recall() call, period). This is the fragile
    // determinism seam: never branch BEFORE the draw on anything that varies at replay.
    const roll = ctx.timeline.random();

    if (!refs || refs.length === 0) return null;

    // Pick the strongest-and-most-congruent ref. No extra draw (deterministic argmax).
    const nowAffect = ctx.state.encodingAffect();
    const nowV = nowAffect.v;
    let pick = /** @type {{ source: 'log', idx: number }} */ (refs[0]);
    if (refs.length > 1) {
      let bestScore = -Infinity;
      for (const ref of refs) {
        const e = ctx.events.all()[ref.idx];
        const enc = (e && e.enc) || { v: 0, a: 0 };
        const congruence = 1 - Math.abs(enc.v - nowV) / 2; // 0..1, closeness then↔now
        const score = encodingStrength(enc) * congruence;
        if (score > bestScore) { bestScore = score; pick = ref; }
      }
    }

    const pickEvent = ctx.events.all()[pick.idx];
    const enc = (pickEvent && pickEvent.enc) || { v: 0, a: 0 };

    // Fire probability scales with how charged the moment was and the character's
    // involuntary-intrusion reactivity. Compared against the already-drawn roll.
    const p = BASE_FIRE_P * encodingStrength(enc) * ctx.state.reactivityFactor();
    if (roll >= p) return null; // did not fire — the draw was already spent

    // --- Fired. Reconstruct the fragment. ---
    const gap = Math.abs(enc.v - nowV); // 0..2 — encoded-then vs recalled-now distance
    const tier = tierFromGap(gap);
    const register = registerFloor(enc.v, nowV);

    // Birth-or-drift the reconsolidation trace. First call CREATES the mem: sentiment
    // (the birth — adjustSentiment finds-or-creates); subsequent recalls drift it.
    adjustSentimentTrace(pick, register);

    // Retained detail: whatever concrete handle the cue already carries. Stage 0 keeps
    // this minimal — the cue key's object portion (garment/dish id). If absent, the
    // fragment is pure-affect (the truest, cheapest case: the body knows, content withheld).
    const colonIdx = cueKey.indexOf(':');
    const retainedDetail = colonIdx >= 0 ? cueKey.slice(colonIdx + 1) : null;

    return { tier, retainedDetail, thenNowMarker: true, register };
  }

  /**
   * @param {{ source: 'log', idx: number }} ref
   * @param {string} register
   */
  function adjustSentimentTrace(ref, register) {
    ctx.state.adjustSentiment('mem:' + ref.source + ':' + ref.idx, register, DRIFT);
  }

  return { recall, cueKeyOf };
}
