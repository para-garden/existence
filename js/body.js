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
   * Driven by chest_cm (drift component) + chest_structural_offset + binding reduction.
   * When binding: reduction depends on binder fit.
   */
  function chestDimension() {
    const score = ctx.character.get('breast_tissue_score') ?? 30;
    // Apply surgical structural offset (mastectomy negative, augmentation positive)
    const structuralOffset = ctx.state.get('chest_structural_offset') ?? 0;
    // For now: treat chest_structural_offset as a 0-100 scale offset directly.
    const baseDim = ctx.state.clamp(score + structuralOffset, 0, 100);

    if (!isBinding()) return baseDim;

    // Approximation debt (body chargen): binding reduction ranges not from literature.
    // Peitzmeier et al. 2017 (PMID 28002890) covers health outcomes; effectiveness
    // measurements harder to find. Ranges approximate.
    const fit = bindingFit();
    const reduction = fit === 'too_small' ? 35
                    : fit === 'stretched' ? 15
                    : 25; // 'correct' or unknown
    return Math.max(0, baseDim - reduction);
  }

  /**
   * Current effective abdominal dimension (0–100).
   * Driven by waist_cm state variable + pregnancy modifier.
   */
  function abdominalDimension() {
    const waist = ctx.state.get('waist_cm') ?? 80;
    // Map waist_cm → 0–100 scale. 60 cm → 0, 130 cm → 100.
    // Approximation debt (body-composition): scale anchors chosen to cover adult waist range.
    const dim = ctx.state.clamp((waist - 60) / 70 * 100, 0, 100);

    // Pregnancy modifier — unchanged
    const pregWeek = pregnancyWeek();
    if (pregWeek === null) return dim;

    // Progressive abdominal increase by trimester.
    // Approximation debt (body chargen): these rates are not calibrated from obstetric data.
    const mod = pregWeek <= 12  ? pregWeek * 0.5
              : pregWeek <= 26  ? 6  + (pregWeek - 12) * 1.5
              :                   27 + (pregWeek - 26) * 1.0;
    return Math.min(100, dim + mod);
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
    if (startTime == null) return 0;
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
    if (t == null) return null;
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
   * Whether menstrual cramps are currently interfering with the character —
   * cramps active and not relieved by pain reliever.
   */
  function crampsInterfering() {
    return hasUterus()
      && ctx.state.get('cramps_active')
      && !ctx.state.isCrampRelieved();
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

  /** Body mass index derived from current body_mass and height_cm. */
  function bmi() {
    const mass = ctx.state.get('body_mass') ?? 70;
    const height = ctx.character.get('height_cm') ?? 170;
    const h_m = height / 100;
    return mass / (h_m * h_m);
  }

  /**
   * Basal Metabolic Rate in kcal/day.
   * Mifflin-St Jeor equation (Mifflin 1990 PMID 2305711, validated Frankenfield 2005 PMID 16215749).
   * AFAB constant: -161; AMAB constant: +5.
   * Approximation debt (body-composition): uses ASAB as proxy for sex factor.
   * HRT shifts BMR over time but is not yet modeled here.
   */
  function bmr() {
    const mass   = ctx.state.get('body_mass') ?? 70;
    const height = ctx.character.get('height_cm') ?? 170;
    const age    = ctx.state.get('age_stage') ?? 30;
    const asab   = ctx.character.get('asab') ?? 'afab';
    const sexFactor = asab === 'amab' ? 5 : -161;
    const mifflinResult = 10 * mass + 6.25 * height - 5 * age + sexFactor;

    // Muscle mass correction: skeletal muscle burns more at rest than the average tissue
    // Mifflin-St Jeor implicitly assumes. Gallagher 1998 (PMID 9822524): skeletal muscle REE
    // ~13 kcal/kg/day; fat ~4.5. Reference assumes 35% of body_mass is skeletal muscle.
    // Correction = deviation from reference × 6 kcal/kg/day.
    // Approximation debt (muscle-fitness): reference lean fraction and coefficient chosen;
    // full correction requires lean mass split (body-composition debt).
    const bodyMass = ctx.state.get('body_mass') ?? 70;
    const referenceMuscle = bodyMass * 0.35;
    const actualMuscle = ctx.state.get('skeletal_muscle_mass') ?? referenceMuscle;
    const muscleCorrection = (actualMuscle - referenceMuscle) * 6;

    // Thyroid modulates BMR: hypothyroid lowers metabolic rate, hyperthyroid raises it.
    // Danforth 1983 (PMID 6403576) — T3 as primary metabolic regulator.
    // Approximation debt (thyroid): ±20% at extreme values (thyroid=22 → 0.82×, thyroid=78 → 1.11×);
    // real effect varies with T3/T4 ratio and tissue sensitivity.
    const thyroid = ctx.state.get('thyroid') ?? 50;
    const thyroidMultiplier = 1 + (thyroid - 50) / 50 * 0.2; // 0.8× to 1.2×
    return (mifflinResult + muscleCorrection) * thyroidMultiplier;
  }

  /**
   * Burst power index — short-duration high-intensity effort capacity.
   * Derived from skeletal muscle mass × fast-twitch fiber ratio.
   * Approximation debt (muscle-fitness): no individual-level burst power formula.
   * Direction correct: fast-twitch ratio × muscle mass determines anaerobic power.
   * @returns {number} dimensionless power index
   */
  function burstPower() {
    const muscle = ctx.state.get('skeletal_muscle_mass') ?? 25;
    const fastTwitch = ctx.character.get('fast_twitch_ratio') ?? 0.5;
    return muscle * fastTwitch;
  }

  /**
   * Sustained strength factor — 0–1 multiplier reducing energy cost of sustained physical work.
   * Approximation debt (muscle-fitness): blended index; no literature for this exact combination.
   * @returns {number} 0–1
   */
  function sustainedStrengthFactor() {
    const aerobic = ctx.state.get('aerobic_capacity') ?? 40;
    const muscle = ctx.state.get('skeletal_muscle_mass') ?? 25;
    const index = (aerobic * 0.6 + muscle * 0.4) / 100;
    return Math.max(0, Math.min(1, index));
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
    crampsInterfering,
    energyCeilingModifier,
    chronicallyBound,
    bmi,
    bmr,
    burstPower,
    sustainedStrengthFactor,
  };
}
