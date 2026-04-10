# Body Composition System

Body measurements as tracked state, drifting continuously from mass, hormones, and chronic stress. Replaces the static `abdominal_baseline` chargen roll with live `waist_cm`, `hip_cm`, and `chest_cm` state variables that body.js reads directly. Clothing fit follows automatically from the delta between current and acquisition-time values.

This document covers the drift model, chargen, the two-component architecture, and its interface with the surgical modifications system. For the full body system (binding, HRT trajectory, pregnancy), see `docs/design/body.md`.

---

## The two-component model

Each measurement is the sum of two independent components:

**Drift component** — the current measurement as shaped by body mass, hormones, exercise history, and chronic stress. This is what changes during play: eating or not eating, sustained cortisol, gym visits. Stored as `waist_cm`, `hip_cm`, `chest_cm` in state.

**Structural offset** — discrete anatomical modifications from surgery (mastectomy, implants, other procedures). Written by the surgical modifications system as separate stored offsets. Applied on top of the drift component at read time, never mixed into it. This keeps mass-driven change and surgical change cleanly separate — a character who gains weight after top surgery doesn't have their surgical result confused with the gain.

The interface at the read site in body.js:

```js
// chest_cm stores the drift component only.
// chest_structural_offset is written by surgical-modifications.js and read here.
const effectiveChest = s.chest_cm + (s.chest_structural_offset ?? 0);
```

Surgical offsets live in the surgical modifications system (see `docs/design/surgical-modifications.md`). Body composition doesn't know what caused an offset — it just reads it.

---

## State variables

```js
// Stored in state (drift component):
waist_cm: number,          // current waist circumference in cm; drives abdominalDimension()
hip_cm: number,            // current hip circumference in cm; additional dimension for bottom fit
chest_cm: number,          // drift-component chest circumference in cm; read alongside chest_structural_offset

// Constitutional per-region drift rates (stored on character at chargen):
waist_mass_sensitivity: number,   // cm change per kg of body mass change
hip_mass_sensitivity: number,     // cm change per kg of body mass change; independent of waist

// Mass and caloric state:
body_mass: number,                // current mass in kg
caloric_balance_ema: number,      // 7-day EMA of daily caloric surplus/deficit (kcal/day); drives body_mass drift

// Surgical offsets (written by surgical-modifications.js):
chest_structural_offset: number,  // added to chest_cm at read time; 0 if no surgery
// waist_structural_offset, hip_structural_offset: reserved for future procedures
```

`waist_mass_sensitivity` and `hip_mass_sensitivity` are properties of the character, not mutable state — they don't change during a run (absent HRT modifier, which is a slow multiplier on the constitutional rate, documented below as a debt). Store them on the character object rather than in state.

---

## Drift inputs (per sleep cycle in `processSleepEnd()`)

All measurement drift happens nightly in `processSleepEnd()`. Changes within a day are too small to matter at the hourly resolution of play; the daily sleep boundary is the natural accumulation point.

### Body mass change → measurements

The primary driver. `body_mass` drifts toward an equilibrium set by `caloric_balance_ema`. Each sleep, compute the mass delta from the previous night and apply it to waist and hip:

```js
// Approximation debt (body-composition): mass change → measurement conversion.
// Constitutional sensitivities set the scale. Population data on waist/kg and hip/kg
// exists at the group level but individual-level prediction is poor.
// Direction well-supported; magnitudes are approximation debts.
const massDelta = newMass - s.body_mass;
s.waist_cm += massDelta * char.waist_mass_sensitivity;
s.hip_cm   += massDelta * char.hip_mass_sensitivity;

// Chest drift from mass: breast fatty tissue correlates with overall body fat,
// but at a lower rate than waist or hip, and only for significant mass change.
// Glandular component does not change with mass.
// Approximation debt (body-composition): coefficient 0.3 chosen; no individual-level data.
if (Math.abs(massDelta) > 0.5) {
  s.chest_cm += massDelta * 0.3;
}
```

`caloric_balance_ema` updates each sleep from meals eaten (tracked via the food system). It is a 7-day EMA — short-term swings don't produce immediate mass change, and a sustained deficit or surplus does.

```js
// Approximation debt (body-composition): caloric estimates per meal type are approximate.
// See content.js eat interactions for per-food values.
// EMA decay factor α = 1 - exp(-1/7) ≈ 0.133 per day.
const alpha = 1 - Math.exp(-1 / 7);
s.caloric_balance_ema = s.caloric_balance_ema * (1 - alpha) + todayBalance * alpha;
```

`body_mass` drifts toward equilibrium via exponential approach — not a snap. The equilibrium is the mass at which caloric balance is zero, computed from an estimated maintenance level.

```js
// Approximation debt (body-composition): maintenance kcal/day from body mass is
// derived from Mifflin-St Jeor equation applied to current mass + activity estimate.
// Activity level is approximated from recent action history; not individually derived.
```

### Hormone axis

HRT shifts regional sensitivity over years. Feminizing HRT gradually raises hip sensitivity and lowers waist sensitivity (fat redistribution away from android pattern); masculinizing HRT has the opposite direction. The effect is slow — months to years, not nightly — and multiplies the constitutional sensitivity rates rather than replacing them.

This is not yet implemented. The drift rates use the constitutional baseline only.

```js
// Approximation debt (body-composition): HRT regional sensitivity modifiers.
// Direction: Klaver et al. 2018 (PMID 29847852) documents fat redistribution
// over 12 months of feminizing HRT. Rate and magnitude of sensitivity shift
// are not derivable from that data at the individual level.
// Until implemented: waist_mass_sensitivity and hip_mass_sensitivity are
// treated as fixed constitutional parameters regardless of HRT status.
```

### Exercise (resistance training)

Gym visits that include resistance training add a small muscle component to waist and hip measurements over time. Muscle is denser than fat (approximately 1.1 vs 0.9 g/cm³), so a kilogram of muscle has a smaller volume — but the effect on waist and hip circumference depends on where that muscle is. Abdominal and hip musculature can add to circumference while reducing fat at the same diameter.

This is directionally correct but the magnitude is an approximation debt. Not yet implemented; document the debt.

```js
// Approximation debt (body-composition): exercise muscle component.
// Direction: resistance training adds lean mass; effect on waist/hip circumference
// depends on muscle distribution. In practice the effect on circumference from
// realistic exercise levels is small (2–5 cm over months of training).
// Not yet modeled. Requires exercise tracking to identify resistance sessions.
```

### Chronic cortisol → visceral deposition

Sustained elevated cortisol preferentially drives fat deposition in the visceral (abdominal) compartment, contributing to waist but not hip. This is a documented mechanism (Bjorntorp 2001 PMID 11374850 — confirmed: glucocorticoid excess and central obesity).

Connect to the existing `cortisol` state variable. Only the sustained cortisol level matters — acute spikes don't affect fat distribution. Use a slow exponential average of cortisol (similar to `cortisol_gi_slow`) as the driver.

```js
// Approximation debt (body-composition): cortisol-visceral coupling coefficient.
// Direction: Bjorntorp 2001 (PMID 11374850) — glucocorticoid-driven visceral fat
// deposition is well-established. The daily waist change per unit of chronic cortisol
// elevation has no per-day per-unit data in ambulatory populations.
// Coefficient chosen to produce ~1–2 cm change over several months of sustained
// cortisol elevation. Needs calibration.
if (chronicCortisol > 60) {
  const excess = (chronicCortisol - 60) / 40; // 0–1 above elevated threshold
  s.waist_cm += excess * cortisolWaistCoefficient; // Approximation debt (body-composition)
}
```

---

## Chargen

New charRng calls for this system (added after existing calls to preserve replay alignment):

1. **Height roll** — `height_cm` from an approximate population distribution.
2. **BMI roll** — from a probit transform of the NHANES BMI distribution, giving `body_mass_index`.
3. **`waist_mass_sensitivity` roll** — constitutional rate, independent of BMI roll.
4. **`hip_mass_sensitivity` roll** — constitutional rate, independent of waist roll.

The `abdominal_baseline` charRng call is removed. Net change: +3 charRng calls.

**Version bump: v27 → v28.**

### Height

```js
// Approximation debt (body-composition): height distribution.
// Population distribution is bimodal (sex-stratified); a single normal is a simplification.
// Real ASAB-stratified distributions: AFAB ~162 cm ± 7, AMAB ~177 cm ± 7 (NHANES).
// Simplified to a single distribution (mean 170, SD 10) until ASAB is used to stratify.
// Using a single distribution overstates short men and tall women relative to reality.
const height_cm = 145 + ctx.timeline.charRandom() * 50; // Approximation debt (body-composition): uniform placeholder
```

### Body mass

```js
// BMI from probit of NHANES distribution (US adult; approximation for non-US characters).
// Probit transform approximated from Hamill et al. (NHANES I, PMID not available —
// see CDC NHANES data directly at https://www.cdc.gov/nchs/nhanes/).
// Approximation debt (body-composition): using US distribution for all characters
// regardless of jurisdiction. BMI distributions vary substantially by country.
const bmiRoll = ctx.timeline.charRandom(); // 0–1
const bmi = probitNHANES(bmiRoll);         // approximate probit from US adult BMI CDF
const body_mass = bmi * (height_cm / 100) ** 2;
```

### Regional sensitivities

```js
// Approximation debt (body-composition): waist and hip mass sensitivities.
// These represent constitutional (genetic) variation in how mass distributes regionally.
// No individual-level literature exists for these rates. Ranges chosen to produce
// realistic variation in body shapes — android (high waist sensitivity) to gynoid
// (high hip sensitivity) — but the specific distribution shape and bounds are not
// grounded in data.
const waist_mass_sensitivity = 0.4 + ctx.timeline.charRandom() * 0.8; // ~0.4–1.2 cm/kg
const hip_mass_sensitivity   = 0.4 + ctx.timeline.charRandom() * 0.8; // ~0.4–1.2 cm/kg
```

### Initial measurements

`waist_cm` and `hip_cm` are computed from starting `body_mass` and the constitutional sensitivities. A reference body (50 kg) sets the origin; the character's mass above or below that maps through their sensitivity to a starting measurement.

```js
// Approximation debt (body-composition): reference waist/hip at 50 kg.
// Real population data exists (NHANES waist circumference distributions) but requires
// stratification by height and body composition. Using 70 cm waist / 90 cm hip as
// reference at 50 kg — plausible center of population; not derived.
const WAIST_REFERENCE_CM = 70;
const HIP_REFERENCE_CM   = 90;
const MASS_REFERENCE_KG  = 50;

const massOffset = body_mass - MASS_REFERENCE_KG;
const waist_cm = WAIST_REFERENCE_CM + massOffset * waist_mass_sensitivity;
const hip_cm   = HIP_REFERENCE_CM   + massOffset * hip_mass_sensitivity;
```

### Chest at chargen

`chest_cm` at chargen comes from `breast_tissue_score` and `height_cm` (band size is proportional to torso circumference, which correlates with height). The drift component is initialized from these; the structural offset begins at 0.

```js
// breast_tissue_score → cup size contribution to chest_cm.
// Band size approximated from height (cm).
// Approximation debt (body-composition): band size from height is a rough proxy;
// real band size correlates with under-bust circumference, which correlates with
// both height and body mass. Using height * 0.45 as placeholder.
const band_cm = height_cm * 0.45; // Approximation debt (body-composition)
const cup_cm  = breast_tissue_score * 0.12; // Approximation debt (body-composition)
const chest_cm = band_cm + cup_cm;
```

For future runs: when surgery is part of life history, `chest_structural_offset` is set at chargen to reflect the surgical outcome rather than retroactively modifying `chest_cm`.

---

## What replaces `abdominal_baseline`

`abdominalDimension()` in body.js previously read `character.abdominal_baseline` (a static chargen value on 0–100 scale) and returned it directly. Under this system:

```js
// Old:
function abdominalDimension() {
  const baseline = ctx.character.get('abdominal_baseline') ?? 40;
  // ... pregnancy modifier
}

// New:
function abdominalDimension() {
  // Map waist_cm to 0–100 scale. 60 cm → 0, 130 cm → 100.
  // Approximation debt (body-composition): scale anchors 60/130 cm chosen
  // to cover the realistic range for adult waist circumference without clipping.
  // WHO abdominal obesity threshold: 80 cm (F) / 94 cm (M); these anchors
  // encompass that range with headroom.
  const waist = ctx.state.get('waist_cm') ?? 80;
  const baseline = Math.max(0, Math.min(100, (waist - 60) / 70 * 100));
  // ... pregnancy modifier unchanged
}
```

The `abdominal_baseline` field is removed from the character schema. The single charRng call for it in `generateBodyParams()` is replaced by the four new calls above.

Clothing acquisition snapshots (`abdominal_at_acquisition`, `chest_at_acquisition`) continue to store the 0–100 dimension values — they don't need to know about cm. The snapshot happens through `currentDimension()` which reads the live 0–100 value from `abdominalDimension()` and `chestDimension()`, unchanged.

---

## Interface for surgical system

The surgical modifications system (when implemented; see `docs/design/surgical-modifications.md`) writes to `chest_structural_offset`. body.js reads the combined value:

```js
function chestDimension() {
  const driftChest = ctx.state.get('chest_cm') ?? 80;
  const surgicalOffset = ctx.state.get('chest_structural_offset') ?? 0;
  const effectiveChest = driftChest + surgicalOffset;
  // map to 0–100 scale, then apply binding reduction as before
  // ...
}
```

Body composition does not know what surgery occurred. It reads the offset and applies it. Surgery does not know about drift; it writes a fixed offset and leaves drift to do its work. Neither system imports the other.

This separation also means the offset survives a body_mass change cleanly: mass-driven drift adds to `chest_cm`, the surgical offset is unchanged.

---

## Approximation debts

All sites in code are tagged `// Approximation debt (body-composition):`. Use `grep 'Approximation debt (body-composition)'` to find them.

- **Waist/hip sensitivity values and ranges.** Population distributions exist for waist circumference by BMI, but individual-level sensitivity (cm change per kg change) is not characterized in the literature. The range 0.4–1.2 cm/kg is plausible but invented. Direction of android/gynoid variation is well-supported; the parametric form is not.

- **Height distribution.** Using a single normal rather than ASAB-stratified distributions understates the bimodality of the population. Requires ASAB to stratify correctly.

- **Reference body anchors** (70 cm waist / 90 cm hip at 50 kg). Not derived from population medians stratified by height. Using plausible round numbers.

- **Chest cm from breast_tissue_score.** Band size from height is a rough proxy. Under-bust circumference is the real variable; it correlates with both height and body mass. Not modeled correctly until chest_cm is generated independently.

- **Hormone axis drift rates.** Fat redistribution direction from Klaver et al. 2018 (PMID 29847852). Magnitude of per-day sensitivity shift is not derivable from group-level data. Not yet implemented; debt is structural.

- **Exercise muscle component.** Direction is correct (resistance training adds lean mass). Circumference effect depends on exercise type and muscle distribution. Magnitude is chosen. Not yet implemented.

- **Cortisol-visceral coupling coefficient.** Direction from Bjorntorp 2001 (PMID 11374850). Daily rate per unit of chronic cortisol elevation has no per-day per-unit data in ambulatory populations.

- **Caloric estimates per meal type.** Used to compute `caloric_balance_ema`. Values in content.js eat interactions are approximations; no food-specific calibration from dietary data.

- **NHANES BMI distribution for non-US characters.** BMI distributions differ substantially by country and cohort. Using US adult distribution as universal placeholder until jurisdiction is a chargen parameter.

- **Chest structural offset → cm scale.** When surgical modifications are implemented, the offset will need to be calibrated against real implant/mastectomy chest circumference data. Not yet specified.
