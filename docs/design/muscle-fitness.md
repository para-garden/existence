# Muscle & Fitness System

Three-variable fitness model: skeletal muscle mass, aerobic capacity, and fast-twitch ratio. Muscle mass and aerobic capacity are mutable state that drift from training stimulus and detraining. Fast-twitch ratio is a constitutional parameter (genetic, chargen-only). Burst power is a derived quantity from muscle × fast-twitch ratio.

The system hooks into existing interactions: `lift_weights` and `home_workout` are resistance stimuli; `cardio` and `home_workout` are aerobic stimuli. The effects land in physical task energy costs, BMR, and capability gates (running to catch a bus, heavy lifting).

---

## State variables

- `skeletal_muscle_mass` (kg): trainable lean muscle. Grows from resistance stimulus; decays ~0.3%/day without stimulus (Coyle 1984 PMID 6736980 — detraining data from athletes; applying to general population is an approximation debt).
- `aerobic_capacity` (0–100, VO2max percentile): grows from cardio stimulus; decays faster than muscle (~0.5%/day; VO2max drops 5–10% in first 2 weeks of detraining, Coyle 1984 PMID 6736980).
- `last_resistance_session` (timestamp): time of most recent resistance training session. Used to determine whether stimulus is recent enough to drive growth.
- `last_cardio_session` (timestamp): same for aerobic stimulus.

---

## Constitutional parameters (chargen)

Three charRng calls (net +3 from v28; version bump v28 → v29):

```js
// 1. Fast-twitch fiber ratio
// h² ~45% (Simoneau & Bouchard 1995 PMID 7559515 — confirmed; heritability of muscle fiber type ratio in humans)
// Approximation debt (muscle-fitness): parametric form and range are not characterized at individual level.
// Population mean ~50% fast-twitch; range 30–70%.
const fast_twitch_ratio = 0.3 + ctx.timeline.charRandom() * 0.4; // 0.30–0.70

// 2. Hypertrophic response — how well the character responds to resistance training
// Genetic variation in training response well-documented (Hubal 2005 PMID 16280066 — 200-fold variation in response).
// Approximation debt (muscle-fitness): individual-level prediction not possible from available literature.
const hypertrophic_response = 0.4 + ctx.timeline.charRandom() * 0.6; // 0.40–1.00

// 3. Aerobic trainability — VO2max response per unit training
// h² ~47% (Bouchard 1999 PMID 10484580 — HERITAGE Family Study)
// Approximation debt (muscle-fitness): parametric form not characterized at individual level.
const aerobic_trainability = 0.4 + ctx.timeline.charRandom() * 0.6; // 0.40–1.00
```

Starting values at chargen:
```js
// skeletal_muscle_mass at chargen: derived from body_mass and a reference lean fraction.
// Approximation debt (muscle-fitness): lean fraction at chargen from backstory activity level
// not yet modeled. Using 35% of body_mass as placeholder (plausible for average adult).
const skeletal_muscle_mass = body_mass * 0.35;

// aerobic_capacity at chargen: from backstory activity level (not yet modeled).
// Approximation debt (muscle-fitness): using 40 (average adult) as placeholder.
const aerobic_capacity = 40;
```

Both are debts to be resolved when the backstory system generates exercise history.

---

## Derived quantities

`burstPower()` — instantaneous power for short-duration high-intensity effort:
```js
function burstPower() {
  const muscle = ctx.state.get('skeletal_muscle_mass') ?? 25;
  const fastTwitch = ctx.character.get('fast_twitch_ratio') ?? 0.5;
  // Approximation debt (muscle-fitness): no individual-level burst power formula.
  // Direction correct: fast-twitch ratio × muscle mass determines anaerobic power.
  return muscle * fastTwitch; // units: kg·ratio → dimensionless power index
}
```

`sustainedStrengthFactor()` — 0–1 multiplier reducing energy cost of sustained physical work:
```js
function sustainedStrengthFactor() {
  const aerobic = ctx.state.get('aerobic_capacity') ?? 40;
  const muscle = ctx.state.get('skeletal_muscle_mass') ?? 25;
  // Approximation debt (muscle-fitness): blended index; no literature for this exact combination.
  const index = (aerobic * 0.6 + muscle * 0.4) / 100;
  return Math.max(0, Math.min(1, index));
}
```

---

## Tier functions (in state.js)

```js
muscleTier()    // → 'atrophied' | 'low' | 'average' | 'trained' | 'athletic'
aerobicTier()   // → 'sedentary' | 'low' | 'moderate' | 'fit' | 'athletic'
```

Thresholds for `muscleTier()` (in kg):
- atrophied: < 15
- low: 15–22
- average: 22–30
- trained: 30–38
- athletic: ≥ 38

These are rough population anchors; see approximation debts below.

Thresholds for `aerobicTier()` (percentile):
- sedentary: < 20
- low: 20–40
- moderate: 40–60
- fit: 60–80
- athletic: ≥ 80

---

## Training mechanics

Called in `processSleepEnd()` as `processDailyFitness()`:

```js
function processDailyFitness() {
  const now = ctx.state.get('time');
  const lastResistance = ctx.state.get('last_resistance_session') ?? 0;
  const lastCardio = ctx.state.get('last_cardio_session') ?? 0;
  const hoursSinceResistance = (now - lastResistance) / 60;
  const hoursSinceCardio = (now - lastCardio) / 60;

  // Muscle growth: stimulus within 48h drives synthesis
  const hypertrophy = ctx.character.get('hypertrophic_response') ?? 0.7;
  if (hoursSinceResistance < 48) {
    // Approximation debt (muscle-fitness): growth rate 0.007 kg/day.
    // Beginner gains: ~0.5–1 kg/month. Trained: ~0.1–0.25 kg/month.
    // Using 0.007 × hypertrophic_response as base; diminishing returns from ceiling.
    const muscleMax = ctx.character.get('skeletal_muscle_mass_max') ?? 45;
    const current = ctx.state.get('skeletal_muscle_mass') ?? 25;
    const headroom = Math.max(0, 1 - current / muscleMax);
    s.skeletal_muscle_mass = current + 0.007 * hypertrophy * headroom;
  } else if (hoursSinceResistance > 168) { // 7 days without stimulus
    // Detraining: ~0.3%/day
    // Approximation debt (muscle-fitness): Coyle 1984 (PMID 6736980) — athlete data extrapolated.
    s.skeletal_muscle_mass = (s.skeletal_muscle_mass ?? 25) * (1 - 0.003);
  }

  // Aerobic growth: stimulus within 48h drives adaptation
  const trainability = ctx.character.get('aerobic_trainability') ?? 0.7;
  if (hoursSinceCardio < 48) {
    const aerobicCurrent = s.aerobic_capacity ?? 40;
    const aerobicHeadroom = Math.max(0, 1 - aerobicCurrent / 100);
    // Approximation debt (muscle-fitness): aerobic gain 0.3 capacity/day with trainability.
    s.aerobic_capacity = aerobicCurrent + 0.3 * trainability * aerobicHeadroom;
  } else if (hoursSinceCardio > 72) {
    // Aerobic detraining faster than muscle: ~0.5%/day
    s.aerobic_capacity = Math.max(0, (s.aerobic_capacity ?? 40) * (1 - 0.005));
  }
}
```

Training stimulus is recorded in the execute block of `lift_weights`, `cardio`, and `home_workout`:
```js
// In lift_weights execute:
ctx.state.set('last_resistance_session', ctx.state.get('time'));

// In cardio execute:
ctx.state.set('last_cardio_session', ctx.state.get('time'));

// In home_workout execute (mixed stimulus — resistance + some aerobic):
ctx.state.set('last_resistance_session', ctx.state.get('time'));
ctx.state.set('last_cardio_session', ctx.state.get('time')); // weaker aerobic stimulus (treated equally in this model; approximation debt)
```

---

## BMR correction

The current Mifflin-St Jeor formula in `body.js` uses total body_mass. Skeletal muscle is metabolically more active than the average tissue the formula assumes (~13 kcal/kg/day at rest vs ~4.5 for fat; Gallagher 1998 PMID 9822524).

A correction term is added to `bmr()`:
```js
// Approximation debt (muscle-fitness): reference muscle mass implicit in Mifflin-St Jeor
// not characterized. Using 35% of body_mass as reference lean fraction (same as chargen).
// Correction: deviation from reference muscle mass × 6 kcal/kg/day.
// Approximation debt (muscle-fitness): coefficient 6 chosen as partial delta between
// Mifflin-St Jeor implicit value and measured resting metabolic rate per kg muscle.
// Full derivation requires lean mass split (body-composition debt).
const referenceMuscle = (ctx.state.get('body_mass') ?? 70) * 0.35;
const actualMuscle = ctx.state.get('skeletal_muscle_mass') ?? referenceMuscle;
const muscleCorrection = (actualMuscle - referenceMuscle) * 6;
return mifflinResult + muscleCorrection;
```

---

## Effects on physical tasks

### Energy cost scaling (sustained work)

Physical tasks that would drain energy proportionally less for fitter characters:
```js
// In carrying groceries, standing shifts, physical labor:
// Approximation debt (muscle-fitness): energy cost reduction factor; direction correct.
const factor = 1 - ctx.body.sustainedStrengthFactor() * 0.3; // up to 30% reduction
ctx.state.adjustEnergy(-baseCost * factor);
```

### Burst power gates

Situations requiring short intense effort (running for a bus, emergency physical response):
```js
// burstPower() > threshold → can do it; below → costs more or fails
// Approximation debt (muscle-fitness): power threshold values not derived.
const power = ctx.body.burstPower();
const catches = power > 10; // dimensionless index threshold; approximation debt
```

Current interactions that would use these: any bus-catching mechanic, heavy lifting at physical job, emergency physical effort. Gates and cost modifiers to be added when those interactions are written.

---

## Approximation debts

All sites tagged `// Approximation debt (muscle-fitness):`.

- **Detraining rate** (0.3%/day muscle, 0.5%/day aerobic). Coyle 1984 (PMID 6736980) documents athlete detraining; extrapolation to untrained individuals and to the daily-resolution model is an approximation.
- **Muscle growth rate** (0.007 kg/day). Beginner gains well-documented at population level; per-session per-day conversion at this resolution not individually characterized.
- **Hypertrophic response variation** (Hubal 2005 PMID 16280066 documents 200-fold response variation). Parametric form and individual-level prediction not possible.
- **Fast-twitch ratio** (Simoneau & Bouchard 1995 PMID 7559515 — h²~45% confirmed). Distribution range 0.3–0.7 plausible; parametric form not characterized.
- **Aerobic trainability** (Bouchard 1999 PMID 10484580 — HERITAGE Family Study, h²~47%). Same limitation.
- **Muscle mass thresholds** for tier function. Population data (NHANES body composition by method) exists but not stratified usefully for this scale.
- **Starting muscle mass** (35% of body_mass placeholder). Should derive from backstory activity level.
- **BMR muscle correction coefficient** (6 kcal/kg/day delta). Gallagher 1998 (PMID 9822524) — skeletal muscle REE ~13 kcal/kg/day; fat ~4.5. Mifflin-St Jeor implicit reference fraction not published.
- **Burst power threshold values** — dimensionless index; not derived from biomechanics literature.
- **Protein intake assumption** — muscle synthesis is protein-limited; this model assumes adequate protein intake throughout. Full model deferred to nutrient tracking system.
