// body.js — body state system
// Reads character body params and current state to expose body interface.
// Minimum viable implementation: unblocks clothing fit computation.
// Full implementation (HRT trajectory, pregnancy body changes, binding duration
// effects, interoceptive sources) is additive on top — see docs/design/body.md.

/** @param {GameContext} ctx */
export function createBody(ctx) {

  // --- Primary interface ---

  /**
   * Current effective chest dimension (0–100).
   * Driven by breast_tissue_score + binding reduction.
   * When binding: reduction depends on binder fit.
   */
  function chestDimension() {
    const score = ctx.character.get('breast_tissue_score') ?? 30;
    if (!isBinding()) return score;

    // Approximation debt (body chargen): binding reduction ranges not from literature.
    // Peitzmeier et al. 2017 (PMID 28002890) covers health outcomes; effectiveness
    // measurements harder to find. Ranges approximate.
    const fit = bindingFit();
    const reduction = fit === 'too_small' ? 35
                    : fit === 'stretched' ? 15
                    : 25; // 'correct' or unknown
    return Math.max(0, score - reduction);
  }

  /**
   * Current effective abdominal dimension (0–100).
   * Driven by abdominal_baseline + pregnancy modifier.
   */
  function abdominalDimension() {
    const baseline = ctx.character.get('abdominal_baseline') ?? 40;
    const pregWeek = pregnancyWeek();
    if (pregWeek === null) return baseline;

    // Progressive abdominal increase by trimester.
    // Approximation debt (body chargen): these rates are not calibrated from obstetric data.
    const mod = pregWeek <= 12  ? pregWeek * 0.5
              : pregWeek <= 26  ? 6  + (pregWeek - 12) * 1.5
              :                   27 + (pregWeek - 26) * 1.0;
    return Math.min(100, baseline + mod);
  }

  /**
   * Current dimension value for the given axis.
   * Used for acquisition-time snapshots in generateWardrobe().
   * Approximation debt (body chargen): returns current value — historical tracking not yet implemented.
   * @param {'chest' | 'abdominal'} dim
   */
  function currentDimension(dim) {
    return dim === 'chest' ? chestDimension() : abdominalDimension();
  }

  /** True if a binder is currently on the body. */
  function isBinding() {
    const t = ctx.state.get('binder_start_time');
    return t !== null && t !== undefined;
  }

  /**
   * Fit quality of the binder currently worn.
   * Approximation debt (clothing): binder not yet in clothing item system.
   * Returns 'correct' as placeholder until binder is a tracked clothing item.
   * @returns {'correct' | 'too_small' | 'stretched' | null}
   */
  function bindingFit() {
    if (!isBinding()) return null;
    return 'correct'; // Approximation debt (clothing): placeholder until binder item exists
  }

  /** Hours binder has been worn in current continuous session. */
  function bindingHours() {
    if (!isBinding()) return 0;
    const startTime = ctx.state.get('binder_start_time');
    const now = ctx.state.get('time');
    return (now - startTime) / 60;
  }

  /** True if breast_tissue_score > 15 (post any surgical history). */
  function hasBreastTissue() {
    return (ctx.character.get('breast_tissue_score') ?? 30) > 15;
  }

  /** Weeks since conception, or null if not pregnant. Unbounded — 42 is a clinical threshold, not a ceiling. */
  function pregnancyWeek() {
    const t = ctx.state.get('conception_time');
    if (t === null) return null;
    return Math.floor((ctx.state.get('time') - t) / (7 * 1440));
  }

  /**
   * Whether the character has a uterus.
   * Private internal fact — gates cycle and pregnancy experiences only.
   * Never displayed.
   */
  function hasUterus() {
    const anatomy = ctx.character.get('reproductive_anatomy');
    return anatomy ? anatomy.has_uterus : false;
  }

  /**
   * Multiplicative modifier on energy ceiling (0–1).
   * Reduction from chronic pain (gigantomastia), binding fatigue, pregnancy.
   */
  function energyCeilingModifier() {
    let mod = 1.0;
    const conditions = ctx.character.get('constitutional_conditions');
    if (conditions?.gigantomastia) mod *= 0.90; // chronic back/shoulder load
    if (isBinding() && bindingHours() > 10) mod *= 0.95;
    const pregWeek = pregnancyWeek();
    if (pregWeek !== null) {
      // Progressive fatigue through pregnancy
      mod *= pregWeek > 26 ? 0.75 : pregWeek > 12 ? 0.85 : 0.90;
    }
    return mod;
  }

  /** True if binding hours today exceed 10. Used by interoceptive observation sources. */
  function chronicallyBound() {
    return isBinding() && bindingHours() > 10;
  }

  return {
    chestDimension,
    abdominalDimension,
    currentDimension,
    isBinding,
    bindingFit,
    bindingHours,
    hasBreastTissue,
    pregnancyWeek,
    hasUterus,
    energyCeilingModifier,
    chronicallyBound,
  };
}
