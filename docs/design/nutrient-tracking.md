# Nutrient Tracking System

Macronutrient and micronutrient tracking as the next layer of the food simulation. Currently the food system approximates all meals at ~600 kcal with no per-food caloric data and no macronutrient or micronutrient breakdown. This document specifies the architecture for per-nutrient tracking and the deficiency conditions it enables.

---

## Why nutrients, not just calories

The caloric intake in `processDailyBodyMass()` is an explicit approximation debt:

```js
// Approximation debt (body-composition): 600 kcal/meal estimate; no per-food values.
const todayIntake = eatEvents.length * 600;
```

This debt has downstream consequences beyond body composition. Three current systems assume things that nutrient tracking would make accurate:

**The muscle-fitness system assumes adequate protein.** From `docs/design/muscle-fitness.md`:
> *Protein intake assumption — muscle synthesis is protein-limited; this model assumes adequate protein intake throughout. Full model deferred to nutrient tracking system.*

Without protein tracking, a character who subsists on ramen and toast accumulates muscle at the same rate as one who regularly cooks eggs, beans, and stir-fry. That's wrong in a way that matters for the simulation.

**Several health conditions require nutrient-specific data** to model correctly rather than as random rolls:

- **Iron deficiency anemia** — develops from sustained low iron intake; affects energy, cognition, NT synthesis. Vegetarian and menstruating characters are structurally at higher risk.
- **B12 deficiency** — neurological effects (fatigue, cognitive fog, peripheral symptoms); vegan characters at structural risk with no supplementation.
- **Folate deficiency** — especially relevant during pregnancy arc; affects cell division.
- **Vitamin D deficiency** — affects mood and bone density; prevalent in high-latitude, low-sun climates where this character may live.

**The ethical stance variable already exists and tracks vegan/vegetarian.** Not using it to modulate B12 and iron risk means the model knows a character is vegan but treats their nutritional profile identically to an omnivore. That's a gap in the simulation's own premises.

---

## Architecture

### Per-food nutrient profiles

Each `eat` event currently records `{ what: 'food_id' }`. The eat interaction executes call `fillStomach(amount, contentType)` — the stomach-fill units (0–100 scale) are simulation units, not calories or grams. Nutrient profiles are separate from stomach fill.

The change: each eat interaction's `execute` block calls `ctx.state.addNutrients(profile)` in addition to `fillStomach()`. The profile is a plain object:

```js
// Nutrient profile schema — values per serving, as eaten.
// All values approximate. Reference: USDA FoodData Central (https://fdc.nal.usda.gov/).
// Approximation debt (nutrient-tracking): values from USDA FoodData Central where available;
// estimated for mixed dishes and composite meals. Per-food values are debts until
// individually verified against FoodData Central entries.
{
  kcal: number,         // kilocalories
  protein_g: number,   // grams of protein
  iron_mg: number,     // milligrams of iron
  b12_mcg: number,     // micrograms of vitamin B12 (0 for all plant foods)
  folate_mcg: number,  // micrograms of dietary folate equivalents
  vitamin_d_iu: number // IU of vitamin D (rare in food; mostly synthesized from sunlight)
}
```

`State.addNutrients(profile)` — a new method that increments today's intake accumulators. The method also replaces the current per-event 600 kcal approximation: `kcal` from the profile is what gets added to the caloric accounting.

---

### State variables

Daily accumulators reset each wake period (in `wakeUp()`):

```js
// Daily intake accumulators — reset in wakeUp()
kcal_today: 0,            // replaces the eatEvents.length * 600 estimate
protein_today_g: 0,
iron_today_mg: 0,
b12_today_mcg: 0,
folate_today_mcg: 0,
vitamin_d_today_iu: 0,
```

Slow EMAs — track chronic intake (7-day, same α as `caloric_balance_ema`):

```js
// 7-day EMAs of daily intake — updated in processSleepEnd()
protein_ema_g: 50,        // starting default: marginal adequacy
iron_ema_mg: 12,          // starting default: marginal
b12_ema_mcg: 2.0,         // starting default: near RDA
folate_ema_mcg: 300,      // starting default: slightly below RDA
vitamin_d_ema_iu: 200,    // starting default: deficient (realistic at low-sun latitudes)
```

Deficiency state — accumulates from chronic EMAs crossing thresholds:

```js
// Deficiency state — 0-100; accumulates slowly with chronic deficit; cleared slowly on adequate intake
iron_deficiency: 0,       // drives anemia effects
b12_deficiency: 0,        // drives neurological effects
```

Folate and vitamin D deficiency are not tracked as separate state variables at this stage. Folate matters primarily during pregnancy (where it would be added to the pregnancy arc state). Vitamin D deficiency is directionally modeled via `daylight_exposure` already; the food contribution is small relative to sunlight and is deferred — see the Vitamin D section below.

---

### DRI reference values

```js
// Dietary Reference Intakes — from NIH Office of Dietary Supplements
// (https://ods.od.nih.gov/). These are population RDAs used as thresholds.
// Approximation debt (nutrient-tracking): using population DRIs for all characters
// regardless of age, ASAB, or pregnancy status. Pregnancy raises iron from ~15 to 27 mg/day
// and folate from 400 to 600 mcg DFE/day (NIH ODS). Menstruation raises iron needs
// significantly. Not individually derived — structurally wrong for pregnant and menstruating
// characters. Correct when those arcs have per-character iron modeling.
const DRI = {
  protein_g: 50,          // 0.8 g/kg × ~62 kg placeholder; Approximation debt (nutrient-tracking): should derive from body_mass
  iron_mg: 15,            // RDA: 8 mg (post-menopausal/AMAB) to 27 mg (pregnant); 15 mg midpoint
  b12_mcg: 2.4,           // RDA: 2.4 mcg/day (NIH ODS)
  folate_mcg: 400,        // RDA: 400 mcg DFE/day (NIH ODS)
  vitamin_d_iu: 600,      // RDA: 600 IU/day (NIH ODS)
};
```

The protein DRI should eventually derive from `body_mass * 0.8` — the standard 0.8 g/kg guideline — since body mass is already tracked state. That's a debt until implemented.

---

### EMA update (in `processSleepEnd()`)

After `processDailyBodyMass()` runs (which will read `kcal_today` instead of the event-count approximation):

```js
// Update nutrient EMAs — same α as caloric EMA
const alpha = 1 - Math.exp(-1 / 7);
s.protein_ema_g  = s.protein_ema_g  * (1 - alpha) + (s.protein_today_g  ?? 0) * alpha;
s.iron_ema_mg    = s.iron_ema_mg    * (1 - alpha) + (s.iron_today_mg    ?? 0) * alpha;
s.b12_ema_mcg    = s.b12_ema_mcg    * (1 - alpha) + (s.b12_today_mcg    ?? 0) * alpha;
s.folate_ema_mcg = s.folate_ema_mcg * (1 - alpha) + (s.folate_today_mcg ?? 0) * alpha;
s.vitamin_d_ema_iu = s.vitamin_d_ema_iu * (1 - alpha) + (s.vitamin_d_today_iu ?? 0) * alpha;
```

---

### Deficiency accumulation (in `processSleepEnd()`)

**Iron deficiency:**

Iron stores (ferritin) deplete over weeks to months of inadequate intake. The WHO defines iron deficiency anemia as developing after sustained low intake depletes stores (WHO Technical Report 2001; no per-day depletion rate available — rate below is an approximation debt).

```js
// Iron deficiency: builds when EMA falls below 8 mg/day (WHO threshold for depletion risk).
// Rate chosen to produce symptomatic anemia (iron_deficiency > 50) after ~4-6 weeks of severe deficit.
// Approximation debt (nutrient-tracking): accumulation rate 0.5/day per unit deficit fraction.
// WHO 2001 Technical Report Series 889 — sustained low iron intake depletes stores;
// per-day quantification at individual level does not exist in the cited literature.
if (s.iron_ema_mg < 8) {
  const deficit = (8 - s.iron_ema_mg) / 8; // 0-1 severity
  s.iron_deficiency = Math.min(100, (s.iron_deficiency ?? 0) + deficit * 0.5);
} else {
  // Recovery: iron stores rebuild on adequate intake, slower than depletion.
  // Approximation debt (nutrient-tracking): recovery rate 0.2/day; real recovery
  // depends on ferritin stores, supplementation, and absorption efficiency. Direction correct.
  s.iron_deficiency = Math.max(0, (s.iron_deficiency ?? 0) - 0.2);
}
```

**B12 deficiency:**

Body stores (primarily hepatic) can sustain adequate levels for months to years. Symptomatic deficiency develops slowly. Stabler 2013 (PMID 24152442 — confirmed: "Vitamin B12 Deficiency", NEJM 368:149-160) documents that deficiency develops over months of depletion.

```js
// B12 deficiency: body stores last months; symptomatic deficiency after ~3 months of near-zero B12.
// Approximation debt (nutrient-tracking): accumulation rate 0.15/day per unit deficit.
// Rate chosen to produce deficiency (b12_deficiency > 50) after ~3 months of 0 intake.
// Direction: Stabler 2013 (PMID 24152442) — hepatic B12 stores deplete over months.
// Per-day rate at individual level is not derivable from available literature.
if (s.b12_ema_mcg < 1.0) {
  const deficit = (1.0 - s.b12_ema_mcg); // 0-1
  s.b12_deficiency = Math.min(100, (s.b12_deficiency ?? 0) + deficit * 0.15);
} else {
  // Recovery: B12 replenishment with adequate intake.
  // Approximation debt (nutrient-tracking): recovery rate 0.05/day chosen.
  s.b12_deficiency = Math.max(0, (s.b12_deficiency ?? 0) - 0.05);
}
```

---

### NT and energy effects of deficiency

These effects hook into the existing NT target function architecture — they modify targets, not levels directly. They are active above moderate deficiency thresholds.

**Iron deficiency anemia** (`iron_deficiency > 30`):

Iron is a cofactor in both serotonin and dopamine synthesis. Lozoff 2006 (PMID 16950973 — confirmed: "Iron deficiency and child development", Food and Nutrition Bulletin 27(4 Suppl Iron Deficiency Anemia)) documents cognitive and mood effects of iron deficiency. Beard 2003 (PMID 12730399 — confirmed: "Iron deficiency alters brain development and functioning", Journal of Nutrition 133(5 Suppl 1)) documents iron as rate-limiting for dopamine synthesis.

- Serotonin target reduced (iron is a cofactor in 5-HT synthesis)
- Dopamine target reduced (iron is rate-limiting for dopamine synthesis)
- Energy floor reduced (reduced oxygen-carrying capacity reduces functional energy)
- Adenosine accumulates faster (functional fatigue)

```js
// Approximation debt (nutrient-tracking): magnitude of NT effects from iron deficiency.
// Direction from Lozoff 2006 (PMID 16950973) and Beard 2003 (PMID 12730399).
// Individual-level dose-response (how much target reduction per unit iron_deficiency) is not
// characterized in the literature — magnitudes are chosen to produce noticeable but
// not catastrophic effects at moderate deficiency.
```

**B12 deficiency** (`b12_deficiency > 40`):

B12 is required for myelin maintenance and is a cofactor in NE and DA synthesis pathways. The primary mechanism is demyelination and impaired neurological function — Stabler 2013 (PMID 24152442).

- NE target reduced
- Cognitive fog — modeled as an adenosine floor increase. This is a poor proxy for demyelination (demyelination reduces nerve conduction velocity, not adenosine specifically), but produces experientially similar output (fog, fatigue, slowed processing). The mechanism is wrong; the phenomenology is directionally correct.
- Eventually: tingling/proprioceptive noise as an interoceptive observation source (new observation source, deferred)

```js
// Approximation debt (nutrient-tracking): B12 neurological effect model.
// Real mechanism is demyelination (Stabler 2013 PMID 24152442); adenosine floor proxy
// is directionally wrong in mechanism but produces similar experiential output (fog, fatigue).
// Note the debt explicitly — this is a known-wrong proxy, not a calibration gap.
```

---

### Protein adequacy for muscle synthesis

In `processDailyFitness()`, the muscle growth rate is multiplied by a protein adequacy factor:

```js
// Protein adequacy: linear multiplier on growth rate.
// Approximation debt (nutrient-tracking): protein adequacy as linear multiplier.
// Real muscle protein synthesis is threshold-gated — the leucine threshold determines
// whether an anabolic signal fires at all (Churchward-Venne 2012 PMID 22215165 — confirmed:
// "Supplementation of a suboptimal protein dose with leucine or essential amino acids",
// British Journal of Nutrition 107(9):1366-75). A linear model smooths over this
// threshold effect. Direction correct; functional form is an approximation.
const proteinAdequacy = Math.min(1, s.protein_ema_g / DRI.protein_g);
// In muscle growth line:
s.skeletal_muscle_mass += growthRate * hypertrophy * headroom * proteinAdequacy;
```

---

### Tier functions

```js
ironDeficiencyTier()  // → 'none' | 'mild' | 'moderate' | 'severe'
// Thresholds: none <20, mild <40, moderate <70, severe ≥70

b12DeficiencyTier()   // → 'none' | 'low' | 'deficient' | 'severe'
// Thresholds: none <20, low <40, deficient <70, severe ≥70

proteinAdequacyTier() // → 'adequate' | 'marginal' | 'low'
// Thresholds: adequate ≥0.8, marginal ≥0.5, low <0.5
// (relative to DRI.protein_g)
```

---

### Per-food nutrient profiles (schema and sample)

The full implementation requires reading all eat interactions in content.js and looking up values against USDA FoodData Central (https://fdc.nal.usda.gov/). Below is the schema and a sample table covering the existing food interactions. Values marked `~` are estimates pending FDC verification.

All values per serving as cooked/consumed. Approximation debt (nutrient-tracking) applies to every row until individually verified against FoodData Central.

| Interaction | Food | kcal | protein_g | iron_mg | b12_mcg | folate_mcg | vit_d_iu |
|---|---|---|---|---|---|---|---|
| `cook_pasta` | cooked pasta (~200g) | ~300 | ~10 | ~1.5 | 0 | ~20 | 0 |
| `cook_rice` | cooked rice (~200g) | ~260 | ~5 | ~0.5 | 0 | ~8 | 0 |
| `heat_canned` | canned soup/beans (~400g) | ~200 | ~9 | ~3.0 | 0 | ~60 | 0 |
| `cook_eggs` | 2 scrambled eggs | ~180 | ~14 | ~1.8 | ~1.1 | ~50 | ~90 |
| `make_toast` | 2 slices toast | ~180 | ~6 | ~2.0 | 0 | ~30 | 0 |
| `cook_beans` | cooked beans (~200g) | ~230 | ~14 | ~3.5 | 0 | ~130 | 0 |
| `make_oatmeal` | oatmeal (~200g cooked) | ~150 | ~5 | ~1.7 | 0 | ~15 | 0 |
| `make_ramen` | instant ramen (1 packet) | ~380 | ~8 | ~1.5 | 0 | ~15 | 0 |
| `make_pb_toast` | PB toast (2 slices + 2 tbsp PB) | ~380 | ~14 | ~1.5 | 0 | ~55 | 0 |
| `cook_potatoes` | roasted potatoes (~250g) | ~210 | ~5 | ~1.5 | 0 | ~30 | 0 |
| `cook_stir_fry` | stir-fry (~300g with eggs or beans) | ~350 | ~16 | ~2.5 | ~0.5 | ~60 | ~30 |
| `cook_soup` | homemade soup (~400g) | ~250 | ~12 | ~2.5 | ~0.3 | ~50 | 0 |
| `cook_baked_goods` | baked goods (cookies/muffins, ~100g) | ~350 | ~5 | ~1.2 | ~0.1 | ~20 | 0 |
| `eat_snack` | snack (crackers, fruit, etc.) | ~150 | ~3 | ~0.8 | 0 | ~20 | 0 |
| `eat_food` | generic fridge meal (~400g) | ~500 | ~20 | ~2.5 | ~0.5 | ~50 | ~20 |
| `eat_from_pantry` | pantry meal (~300g) | ~350 | ~10 | ~2.0 | 0 | ~40 | 0 |
| `eat_outside` / `carry_food` | packed meal (~300g) | ~400 | ~15 | ~2.0 | ~0.3 | ~40 | ~10 |
| `eat_at_work` | staff meal (~350g) | ~450 | ~18 | ~2.5 | ~0.5 | ~40 | ~15 |
| `took_lunch` (eat_alone) | lunch (~300g) | ~500 | ~18 | ~2.5 | ~0.5 | ~50 | ~15 |
| `cheap_meal` (corner store) | cheap prepared meal | ~500 | ~15 | ~2.0 | ~0.3 | ~30 | 0 |
| `soup_kitchen` | soup kitchen meal | ~600 | ~20 | ~3.0 | ~0.3 | ~60 | 0 |
| `shelter_meal` | shelter meal | ~550 | ~18 | ~2.5 | ~0.2 | ~50 | 0 |

Note: `b12_mcg` is 0 for all plant-based foods without fortification. This is not an approximation — B12 is not synthesized by plants. Some fortified foods (nutritional yeast, certain plant milks) contain B12, but the current pantry system doesn't model fortified ingredients separately.

---

### Foods that matter for deficiency risk

**B12:** Only animal products contain B12 (meat, fish, eggs, dairy). Vegan characters eating from the current pantry system consume almost no B12 from food. `ethical_stance === 'vegan'` → structural B12 risk unless supplementing. The character's diet is already being modeled by `ethical_stance`; not connecting it to B12 status is a simulation gap.

**Iron:** Red meat has the highest bioavailability (heme iron, ~25% absorbed). Plant sources (beans, legumes, leafy greens, fortified grains) contain non-heme iron at lower bioavailability (~5–12%). The sim doesn't yet model bioavailability differences — beans and beef would both record `iron_mg` but beans would need ~2× the mg to achieve the same absorbed dose. This is a known debt: the `iron_mg` field tracks total intake, not absorbed iron. Absorption efficiency modeling is deferred.

```js
// Approximation debt (nutrient-tracking): iron bioavailability.
// Heme iron (meat) absorbs at ~25%; non-heme (plant, egg) at ~5–12%.
// All iron tracked as total mg, not absorbed mg. Iron deficiency risk for plant-based
// characters is therefore underestimated relative to reality. Direction of the debt:
// vegetarian/vegan characters are structurally more iron-deficient than the EMA suggests.
```

**Protein:** Available from meat, eggs, dairy, and legumes. Skipping meals drives protein deficit. The current pantry covers eggs, beans, and occasional meat (via `fridge_food`). Characters at the margins (street, shelter) may eat but eat poorly — soup kitchen/shelter meals include enough protein to sustain; snack-only patterns don't.

**Vitamin D:** Primarily from sunlight. Food sources are few: fatty fish (not yet in pantry), fortified milk, eggs (small amount). Most food-source vitamin D in this sim will come from eggs and the occasional fridge_food protein. The sunlight pathway is the dominant source.

---

### Vitamin D and sunlight

`daylight_exposure` already accumulates during outdoor time and is consumed by the sleep cycle. Vitamin D synthesis from UVB is the primary source for most people — dietary intake is secondary for all characters except those consuming fortified foods or supplements regularly.

Both pathways feed `vitamin_d_today_iu`, which is included in the 7-day EMA updated each sleep:

- Food contributes `vitamin_d_today_iu` via `addNutrients()`.
- Sunlight synthesis is computed at the start of `processNutrientEMAs()` (called from `processSleepEnd()`) as `daylight_exposure × 20 × latitudeUVFactor` and added to `vitamin_d_today_iu` before the EMA update. Latitude factor: tropical (<23.5°) → 1.2×, temperate (23.5–50°) → 0.8×, high (>50°) → 0.4×.

The sunlight contribution is an approximation — see debts below. At 50 `daylight_exposure` (moderate day) with lat 40: 50 × 20 × 0.8 = 800 IU, which is plausible for a partially outdoors day at mid-latitude.

Remaining debts on the sunlight pathway: skin pigmentation factor (higher melanin → lower synthesis), seasonal UV variation within latitude band, cloud cover, sunscreen, and time-of-day UV angle. These are not yet modeled.

---

### `addNutrients()` implementation

```js
/**
 * Accumulate nutrient intake from a single eating event.
 * Called in eat interaction execute blocks.
 * @param {{ kcal?: number, protein_g?: number, iron_mg?: number, b12_mcg?: number, folate_mcg?: number, vitamin_d_iu?: number }} profile
 */
function addNutrients(profile) {
  if (profile.kcal)         s.kcal_today        = (s.kcal_today        ?? 0) + profile.kcal;
  if (profile.protein_g)    s.protein_today_g   = (s.protein_today_g   ?? 0) + profile.protein_g;
  if (profile.iron_mg)      s.iron_today_mg     = (s.iron_today_mg     ?? 0) + profile.iron_mg;
  if (profile.b12_mcg)      s.b12_today_mcg     = (s.b12_today_mcg     ?? 0) + profile.b12_mcg;
  if (profile.folate_mcg)   s.folate_today_mcg  = (s.folate_today_mcg  ?? 0) + profile.folate_mcg;
  if (profile.vitamin_d_iu) s.vitamin_d_today_iu = (s.vitamin_d_today_iu ?? 0) + profile.vitamin_d_iu;
}
```

The `kcal` field replaces the `eatEvents.length * 600` estimate in `processDailyBodyMass()`. Once `addNutrients()` is called from every eat interaction, `processDailyBodyMass()` reads `s.kcal_today` directly instead of counting eat events.

---

### `wakeUp()` resets

```js
// Daily nutrient accumulators reset each wake period
s.kcal_today        = 0;
s.protein_today_g   = 0;
s.iron_today_mg     = 0;
s.b12_today_mcg     = 0;
s.folate_today_mcg  = 0;
s.vitamin_d_today_iu = 0;
```

---

## Implementation status

Steps 1–5 complete (as of 2026-06-05):

1. **State variables** — daily accumulators, 7-day EMAs, deficiency state (`iron_deficiency`, `b12_deficiency`) in `js/state.js`.
2. **EMA and deficiency accumulation** — `processNutrientEMAs()` and deficiency logic wired into `processSleepEnd()` in `js/state.js`.
3. **NT target effects** — iron and B12 deficiency effects registered in `ntTargetFns`; protein adequacy multiplier wired into `processDailyFitness()` in `js/state.js`.
4. **Tier functions** — `ironDeficiencyTier()`, `b12DeficiencyTier()`, `proteinAdequacyTier()` implemented in `js/state.js`.
5. **Per-food profiles** — `addNutrients(profile)` called in every eat interaction execute block in `js/content.js` (28 calls across 22 eat interaction IDs). Types added to `GameState` in `js/types.d.ts`.

---

## Approximation debts

All sites tagged `// Approximation debt (nutrient-tracking):`. Use `grep 'Approximation debt (nutrient-tracking)'` to find them.

- **Per-food kcal and nutrient values.** Every value in the sample table above is an estimate. Reference: USDA FoodData Central (https://fdc.nal.usda.gov/). Each row should eventually be verified against a specific FDC entry for a representative portion.

- **Population DRIs applied to all characters.** Iron needs vary from 8 mg/day (post-menopausal, AMAB) to 27 mg/day (pregnant). Folate needs rise from 400 to 600 mcg DFE during pregnancy. Protein needs scale with body mass (0.8 g/kg). Until these are individualized, the model systematically under-flags deficiency in high-need characters.

- **Iron bioavailability not modeled.** All iron tracked as total mg. Heme iron (meat, ~25% absorbed) vs non-heme (plant, ~5–12%) differences are not captured. Plant-based characters are at higher deficiency risk than the EMA suggests. Direction of the debt: iron_deficiency will be lower than reality for vegetarians/vegans.

- **Iron deficiency accumulation rate** (0.5/day per unit deficit fraction at <8 mg EMA). WHO Technical Report 889 — direction correct; rate is a debt. No per-day per-unit data in the cited literature.

- **B12 deficiency accumulation rate** (0.15/day per unit deficit). Stabler 2013 (PMID 24152442) — direction correct; rate chosen to produce symptomatic deficiency after ~3 months of 0 intake. Individual-level rate not derivable from the source.

- **B12 neurological effect proxy.** Adenosine floor as a proxy for demyelination is mechanistically wrong. The experiential outputs (cognitive fog, fatigue) are directionally correct; the mechanism is not. This is a known-wrong proxy explicitly documented at the implementation site.

- **Iron and B12 NT effect magnitudes.** Direction from Lozoff 2006 (PMID 16950973) and Beard 2003 (PMID 12730399) for iron; Stabler 2013 for B12. Individual-level dose-response not characterized; magnitudes are chosen.

- **Protein adequacy as linear multiplier on muscle growth.** Real muscle protein synthesis is leucine-threshold-gated (Churchward-Venne 2012 PMID 22215165). A linear model smooths over this threshold. Direction correct; functional form is an approximation.

- **Protein DRI as fixed 50g.** Should derive from `body_mass * 0.8`. The 50g placeholder is too low for heavier characters and slightly high for lighter ones.

- **Vitamin D sunlight synthesis (implemented, approximation debts remain).** `vitamin_d_today_iu` now includes a sunlight contribution: `daylight_exposure × 20 × latitudeUVFactor`. Remaining debts: skin pigmentation (melanin reduces synthesis — not yet a character parameter), seasonal UV variation within latitude band (latitude factor is static across seasons), cloud cover, sunscreen, and body surface area exposed. Direction and order of magnitude correct; individual factors are coarse. Holick 2007 (PMID 17634462).
