# Body System

The body is not a resource to optimize. It is the medium the character exists in — the container through which everything else is filtered. Energy, hunger, pain, cycle state, binding, pregnancy: none of these surface as numbers or meters. They are the texture of waking up, of putting on clothes, of getting through a shift, of lying down and not being able to sleep.

This document specifies the body system: its parameters, how they are generated, how they change, and what they expose to other systems.

---

## Design Principles

### Constitutional conditions emerge, never announce

Clinical patterns arise when parameters land in certain configurations. The simulation never declares: "this character has gigantomastia." It sets the chest dimension to a value that makes button-downs not close, produces chronic back pain, makes heat-related skin irritation a recurring texture in the prose. The player lives inside what that is. The name of the condition is never the point.

Constitutional conditions (genetic) are generated probabilistically at chargen from real prevalence data. Circumstantial conditions (injury, surgical history, hormonal intervention) are derived from life history events. A random roll for a circumstantial condition is the wrong model — it treats a consequence of experience as if it were a fact about genetics. The two must not be conflated.

### The body knows before the mind

Interoceptive signals precede conscious recognition. Anxiety is a tight chest before it's a named emotion. Hunger is a loss of focus before it's a word. Binding-related rib compression is a change in the quality of breath before it's identified as an ache. Pregnancy nausea is aversion to a smell before it's registered as symptom.

Prose renders the body's signal first. Interpretation — when it arrives — arrives late, or not at all.

### Body state is not a meter

Nothing about the body is surfaced as a number. `chest_dimension: 72` never appears in prose. What appears is: the button-down gaps at the chest, the hoodie still fits. The character's body is a fact they live in, not a stat they manage. NT effects, available interactions, prose texture — these are the body's surface in the game.

### Dimensions, not aggregates

The body is not a single scalar. Chest and abdominal dimensions move independently. Early pregnancy: breast changes precede abdominal change significantly. HRT (feminizing): chest development often precedes significant abdominal change. Gigantomastia: chest dimension is extreme regardless of abdominal. Weight gain: both tend to increase, but not in lockstep.

Clothing fit requires both dimensions separately. A garment tolerates one dimension's change while failing at the other. This cannot be recovered from a single body-size aggregate.

### Gradients, not events

HRT is not an event. Pregnancy is not an event. They are ongoing processes with trajectories. A character who started feminizing HRT eight months ago is in a different state than one who started three years ago — physically, emotionally, in terms of what clothing fits and what doesn't. The body system tracks these as continuous states with time-dependent trajectories, not flags that get set once.

### No judgment, no prescription

The body system models what is. It does not shade the prose toward "this is what happens when you don't take care of yourself" or "this is what happens when you make unusual choices." A character who binds has reasons. A character who doesn't bind when they needed to has reasons. The simulation models the physical consequences either way and leaves the moral weight entirely absent.

---

## Chargen Parameters

### Assigned sex at birth (ASAB)

A developmental trajectory parameter, not an outcome. ASAB sets the default template that puberty, hormones, surgery, and constitutional conditions then modify.

Values: `'afab'`, `'amab'`, `'intersex'`

**Prevalence:** Approximately 50/50 AFAB/AMAB for the non-intersex majority. Intersex prevalence depends strongly on definition. Fausto-Sterling 2000 (doi:10.1002/j.1550-8528.2000.tb00019.x) gives ~1.7% using broad criteria. More conservative estimates using classic definitions (congenital adrenal hyperplasia with virilization, complete androgen insensitivity, Turner syndrome, Klinefelter syndrome) run ~0.02–0.05%. For chargen purposes, the broad criteria produce more recognizable variation in parameters; the simulation should use a value in the range of **1–2%** pending further research on what definition best serves the model.

```js
// Approximation debt: intersex prevalence depends on definition.
// Broad criteria (Fausto-Sterling 2000, doi:10.1002/j.1550-8528.2000.tb00019.x) ~1.7%.
// Conservative clinical definitions ~0.02–0.05%.
// Using 1.5% as placeholder pending design decision on scope. See TODO.md.
const asabRoll = ctx.timeline.charRandom();
const asab = asabRoll < 0.4925 ? 'afab'
           : asabRoll < 0.985  ? 'amab'
           : 'intersex';
```

ASAB is never shown to the player. It drives downstream parameters.

### Puberty history

Whether puberty occurred, when, and whether it was medically suppressed.

Fields:
- `puberty_occurred: boolean` — false for certain medical conditions (Turner syndrome, some intersex conditions, hypogonadism)
- `puberty_timing: 'early' | 'typical' | 'late'` — within the occurred=true population
- `puberty_suppressed: boolean` — GnRH analogue use before puberty completed
- `suppression_timing: 'prepubertal' | 'mid_puberty'` — if suppressed; pre-pubertal suppression prevents secondary sex characteristics from developing; mid-puberty suppression halts where it is

```js
// Approximation debt: puberty suppression prevalence in the general population
// is not well-characterized for simulation purposes. The "gender-affirming care"
// conditional modifier requires a prior stage in the life history that doesn't
// yet exist. Until life history generates identity/medical history explicitly,
// suppression is rolled from a flat low base (0.5%) as a placeholder.
```

### HRT history

Whether the character is on hormone replacement therapy, when they started, and what type. This is a life history input — the character's HRT start date is placed in game time relative to their backstory, so the simulation can compute how far along the trajectory they are at game start.

Fields:
- `hrt_type: null | 'feminizing' | 'masculinizing' | 'menopausal'`
- `hrt_start_offset: number | null` — months before game start. Determines how far along trajectory effects have progressed.
- `hrt_dose_tier: 'standard' | 'low' | 'high'` — affects rate and ceiling of effect

```js
// Approximation debt: HRT history should be a derived output of life history
// (gender-affirming care access, menopause, clinical prescription).
// Until that upstream system exists, generated from ~3% base probability for
// feminizing or masculinizing HRT combined. Placeholder.
```

### Constitutional body conditions

Generated probabilistically at chargen from real prevalence data. These are facts about the character's genetics, not choices or outcomes of behavior.

#### Gigantomastia

Disproportionately large breast tissue regardless of weight, pregnancy, or HRT. Fit problems are the baseline, not a deviation from it. Associated effects: chronic back and shoulder pain (feeds the pain system), heat and skin irritation in folds, difficulty finding clothing that fits at all — button-downs may never close, most fitted tops are constrained.

Familial/genetic component documented anecdotally but not precisely quantified.

```js
// Approximation debt: gigantomastia prevalence. Estimates in the 1:28,000–1:100,000
// range have been cited but the specific source for the lower bound is unclear.
// Using 1:50,000 as placeholder. Needs PMID or DOI.
const gigantomastia = ctx.timeline.charRandom() < (1 / 50000);
```

Associated chargen consequence: chronic back/shoulder pain seeded as a low-severity background condition.

#### Micromastia

Minimal breast tissue development regardless of ASAB, hormonal history, or weight.

```js
// Approximation debt: micromastia as an isolated condition is poorly characterized.
// Using 1% as placeholder. Needs literature review.
```

#### Asymmetry

The majority of people with breast tissue have some degree of asymmetry. Clinically significant asymmetry (>1 cup size difference, approximately) is estimated at 15–25% in people with breast tissue development. For the simulation, `breast_asymmetry` is a continuous value 0–1 from a right-skewed distribution — most characters have low values, a minority have significant values.

Asymmetry affects fit computation: items near a constraint boundary may be `comfortable` on one side and `tight` on the other. The fit state for the item is the worse of the two sides.

```js
// Approximation debt: right-skew distribution shape parameters for breast_asymmetry
// need calibration from literature. Currently using exponential distribution with
// mean 0.1, capped at 1.0.
```

#### Poland syndrome

Unilateral underdevelopment of chest, often including pectoral muscle involvement. The affected side has little or no breast tissue development regardless of any other parameters.

```js
// Approximation debt: Poland syndrome prevalence. 1:20,000 used as placeholder.
// Needs PMID or DOI.
const polandSyndrome = ctx.timeline.charRandom() < (1 / 20000);
// If true, also generate: poland_side: 'left' | 'right' (equal probability)
```

Poland syndrome overrides the affected side's `breast_tissue_score` component to near-zero.

#### Post-mastectomy

Surgical removal of breast tissue. This is a **circumstantial** condition — it results from a life event (cancer, prophylactic surgery, gender-affirming surgery), not genetics. Requires the life history system to supply it.

```js
// Approximation debt: post-mastectomy status should be derived from life history.
// Until that upstream exists: rolled from a very low base probability (~0.5%),
// type unspecified. When surgical history is a backstory field, the roll is replaced.
```

Post-mastectomy may include: no reconstruction (flat), reconstruction (implants or flap), breast prosthetics. Prosthetics are **objects** with their own state (worn/not worn, condition, fit) — part of the Clothing object system when implemented. The `chest_dimension` for a post-mastectomy character without reconstruction or prosthetics is at or near zero on the breast-tissue component. Prosthetics add to the effective chest dimension when worn.

#### Gynecomastia

Breast tissue development in people with XY chromosomes. Common and underreported.

**Prevalence:** Transient adolescent gynecomastia is very common: PMID 8074834 (Nydick et al. 1961) — ~65% of adolescent males, most resolving. Persistent adult gynecomastia is less characterized; estimates range widely (~30–40% at some degree in adults — needs better citation). For the simulation, mild gynecomastia producing noticeable chest dimension change affects ~15–20% of AMAB characters as a baseline, with higher rates for specific conditions (obesity, medications, liver disease).

```js
// Approximation debt: adult persistent gynecomastia prevalence.
// PMID 8074834: 65% adolescent males, most transient.
// Adult persistent rate poorly characterized; using 15% placeholder for AMAB
// characters without other risk-elevating conditions.
// When medications and metabolic conditions are modeled, this rate should
// increase conditionally.
```

Gynecomastia contributes to `chest_dimension` in the same pipeline as other breast tissue. Not tagged separately — the simulation does not distinguish gynecomastia from other sources of breast tissue development in its outputs.

### Reproductive anatomy

Private internal field. Never displayed. Gates which experiences are possible (menstrual cycle, pregnancy, certain health conditions).

Fields:
- `has_uterus: boolean`
- `has_ovaries: boolean`
- `has_testes: boolean`

ASAB provides defaults; surgical history modifies them.

```js
// Defaults from ASAB at chargen (before surgical history applied):
// afab:   { has_uterus: true,  has_ovaries: true,  has_testes: false }
// amab:   { has_uterus: false, has_ovaries: false, has_testes: true  }
// intersex: requires individual determination based on specific condition.
//           Not yet modeled. Approximation debt.
```

---

## Breast Tissue Development

Breast tissue development does not happen to all characters. Whether it occurs, to what degree, and through what pathway must emerge from biological parameters and life history. All pathways feed into a single `breast_tissue_score` (0–100) that drives the chest dimension.

### Pathways to development

**Puberty (AFAB default trajectory):**
- `asab === 'afab'` + `puberty_occurred = true` + no suppression → breast development according to genetics and body composition
- Generates a `genetic_breast_ceiling` (constitutional maximum) and a `development_fraction` (how close to ceiling the character reached, based on age and puberty timing)
- Pre-pubertal suppression prevents this entirely; mid-puberty suppression stops it where it is

```js
// Approximation debt: genetic_breast_ceiling distribution has no literature anchor.
// Currently sampled from a truncated normal (mean 55, SD 20, clipped [5, 100]).
// Distribution shape needs research.
```

**Feminizing HRT:**
- Breast development begins within 2–6 months of starting
- Trajectory: approximately `score += ceiling × (1 - exp(-months / 24))` toward an individual ceiling
- Ceiling varies widely; mean trajectory reaches ~50–60% of natal AFAB ceiling at comparable age
- Development continues 2–3 years, then plateaus
- Dose-dependent: `hrt_dose_tier` affects both rate and ceiling

```js
// Approximation debt: feminizing HRT breast development curve.
// Timeline from Hembree et al. 2017 (PMID 28945902): onset 3–6 months,
// progression 2–3 years. Rate and ceiling parameters are approximate.
// Individual variation is large and not fully characterizable.
const hrtMonths = character.hrt_history.start_offset ?? 0;
const hrtCeiling = geneticBreastCeiling * 0.6 * doseFactor;
const hrtContribution = hrtCeiling * (1 - Math.exp(-hrtMonths / 24));
```

**Pregnancy:**
- First trimester: breast tissue increases, often the first visible physical change before abdominal is visible; tenderness, fullness, size change
- Growth follows gestational age; magnitude varies significantly person to person
- Nursing: continued hormonal support keeps breast tissue elevated; partial return toward pre-pregnancy state occurs after weaning
- Multiple pregnancies: additive effect, each contributing some lasting tissue

**Weight:**
- Fatty tissue in the breast area correlates with overall body fat percentage, but the relationship is not linear and varies by genetics
- Weight gain contributes to chest dimension independently of glandular tissue
- Does NOT replace glandular tissue; the two components are additive

**Gynecomastia (AMAB):**
- Glandular tissue development triggered by hormonal imbalance, medications, or genetics
- Contributes to `breast_tissue_score` using the same 0–100 scale

### Constitutional overrides

- **Gigantomastia:** Overrides `breast_tissue_score` to a very high value (80–100) regardless of other parameters
- **Micromastia:** Caps `breast_tissue_score` at a low value (0–15) regardless of development pathway
- **Poland syndrome:** Sets the affected side's component to near-zero; unaffected side proceeds normally
- **Post-mastectomy:** Sets `breast_tissue_score` to near-zero; prosthetics add separately when worn

### Masculinizing HRT does not reduce breast tissue

Masculinizing HRT does **not** significantly reduce glandular breast tissue. It reduces fatty tissue throughout the body, which may slightly reduce breast dimension, but the change is minimal. The chest does not flatten significantly without surgery. A character on testosterone for two years without surgery still has a non-trivial chest dimension. This is a clinically important reality; the simulation must model it correctly.

```js
// No score reduction applied to glandular component from masculinizing HRT.
// Fatty component may decrease ~10–20% over 1–2 years.
// Approximation debt: fatty component fraction of total breast_tissue_score is not
// individually tracked. Total score reduction from testosterone approximated at
// -10 per year for the first 2 years, plateau thereafter, floor at score * 0.8.
```

---

## Body Dimensions

Two dimensions are required for clothing fit. They move independently.

### Chest dimension

A normalized 0–100 value representing the effective chest size that constrains clothing.

**Input factors:**
- `breast_tissue_score` (primary driver for chest-sensitive garments)
- Binding: if actively binding, effective chest dimension is reduced by the binding effect (see §Binding)
- Binding fit: correctly-sized binder produces maximum reduction; too-small binder produces greater reduction but at physical cost; stretched binder produces less reduction

**Stable at rest** between significant body change events. Updates when: HRT trajectory reaches a new point, pregnancy trimester transitions, significant weight change, surgical events.

### Abdominal dimension

A normalized 0–100 value representing the effective abdominal/torso circumference that constrains waistbands, fitted middles, and similar.

**Input factors:**
- Baseline body composition (weight-correlated, derived from backstory)
- Pregnancy: progressive increase by trimester
- Bloating: transient increase (GI system events — gas, IBS-like states, menstrual bloating); can fluctuate within a day
- Weight change over time

Clothing items acquired when abdominal was at a lower value may not close today. This is a meaningful experience for many people; the simulation should produce it naturally from the dimension delta, without announcement.

### Acquisition-time snapshots

Each clothing item stores `chest_at_acquisition` and `abdominal_at_acquisition` — the body state when the item was generated or purchased. Fit is computed as a delta between current dimension and acquisition dimension.

These snapshots persist in the item record. Until the body system is implemented, `clothing-implementation.md` documents the debt: all items store `null` for these fields and fit defaults to `'comfortable'`.

---

## Binding

Binding (chest binding) is a daily practice for some characters. Not an event — an ongoing relationship between the character, their body, and a garment that has its own state.

### The binder as an object

A binder is a clothing item in the Clothing object system with additional properties:

```js
{
  id: 'binder_0',
  type: 'binder',
  name: 'black binder',
  condition: 'good' | 'worn' | 'stretched' | 'degraded',
  location: 'stored' | 'accessible' | 'on_body' | 'floor_bedroom',
  wearState: 'clean' | 'worn_once' | 'worn_out' | 'dirty',
  // Binder-specific:
  fit_size: 'correct' | 'too_small' | 'stretched',
  binder_start_time: number | null,  // game time when put on, for duration tracking
}
```

**Fit size** is determined at chargen from the character's chest dimension and the size they were able to obtain. Economic access matters — a character who couldn't afford a well-fitted binder may have one that's too small.

```js
// Approximation debt: binder fit should depend on economic access, body knowledge,
// and availability. A precarious character has higher probability of too_small or
// stretched binder. Until the wardrobe trajectory model tracks acquisition context,
// fit_size is generated from chest dimension alone with a mild precarious-origin
// penalty.
```

**Condition degradation:** Binders stretch with use. `condition: 'stretched'` produces `fit_size: 'stretched'` — less effective binding with less physical risk than `too_small`.

### Binding effects on chest dimension

When binding, `Body.chestDimension()` returns a reduced value:

```js
// Effective chest dimension reduction from binding:
// correct-size binder: -20 to -30 points
// too-small binder:    -30 to -40 points (more effective, higher physical cost)
// stretched binder:    -10 to -20 points (degraded effectiveness)
// Approximation debt: these ranges are not from literature. Peitzmeier et al. 2017
// (PMID 28002890) covers health outcomes of binding; effectiveness measurements
// are harder to find. Needs calibration.
```

### Binding duration effects

Duration tracked from `binder_start_time`. Effects accumulate:

**0–8 hours:** Normal binding. No physical cost beyond baseline compression.

**8–10 hours:** Extended binding. Elevated risk begins. Prose may notice breath quality, a tightness that wasn't there earlier.

**10–12 hours:** Prolonged. Increasing discomfort. Rib pressure signal begins. Restricted breathing is a real interoceptive observation.

**12+ hours:** Back pain accumulation. Rib pain feeds the pain system. Skin irritation possible.

**Overnight binding:** If the binder is on during sleep (`binder_start_time` crosses a sleep event), compounded effects — restricted breathing during sleep, higher cumulative cost, possible next-day ache.

None of these are announced as "you have been binding too long." The body knows first. Interoceptive signals precede recognition: a different quality of breath at hour 9, a rib ache at hour 11.

NT effects:
- `nausea` from shallow breathing and rib compression at prolonged durations
- `NE` slightly elevated (pain → NE; restricted breathing → mild CO₂ elevation)
- `cortisol` elevated with pain

Medical guidance: binders should not be worn while sleeping or exercising strenuously. Characters who bind while sleeping incur compounded costs; the simulation models the consequences without prescribing.

### Benefits of correct binding

A character whose binding is effective (correct-size binder, within normal wear hours) presents a flatter chest. For characters for whom this matters:
- Gender dysphoria signal is reduced (body-image/self-perception state)
- Social anxiety in relevant contexts is reduced (fewer situations where the character is braced for being misread)
- Prose in those contexts has a different texture — not a relief announcement, just a different quality of presence

### Not binding when needed

When the character has a binder but doesn't wear it in a context where they would typically bind:
- A body-consciousness signal that shades relevant prose
- Avoidance of certain interactions
- The specific texture of navigating public space without the chest presentation the person in the body needs

This is not a mood flag. It is a constellation of: body-consciousness signal, social anxiety elevation in relevant contexts, possible interaction availability changes.

---

## Pregnancy

A continuous trajectory, not a flag. `pregnancy_week` (0–42) is tracked in state; the body system computes current dimensions from it.

### Prerequisite

Requires `has_uterus = true`. Not all characters can become pregnant. This is a private internal fact, never displayed.

### Phase transitions and body effects

**Weeks 1–12 (first trimester):**
- `breast_tissue_score` increases, often before abdominal is visible — tenderness, fullness, size change
- `abdominal_dimension` change minimal early, begins to increase toward end of trimester
- Nausea: existing nausea system applies; pregnancy nausea is more persistent and tied to food triggers
- Fatigue: adenosine-like effect that doesn't clear with normal sleep; the body is doing enormous metabolic work invisibly
- Most change is invisible to others; the character carries it alone

**Weeks 13–26 (second trimester):**
- `abdominal_dimension` increases significantly; waistbands begin to fail
- `breast_tissue_score` continues to increase; bra fit changes
- Center of gravity shift: affects movement descriptions and certain physical interactions
- Most fitted clothing stops fitting mid-trimester

**Weeks 27–40 (third trimester):**
- `abdominal_dimension` at maximum; most fitted clothing non-functional
- Specific physical limitations: leaning over, certain positions, mobility costs increase
- Sleep quality degradation (position constraints, frequent waking)
- Heartburn as an interoceptive signal (acid reflux from uterine pressure on stomach)
- Braxton Hicks contractions: unpredictable, can be mistaken for labor

**Postpartum:**
- Body does not simply revert. Recovery timeline varies enormously.
- Breast changes with nursing: `breast_tissue_score` remains elevated while nursing; partial return after weaning
- NT: postpartum hormonal crash is a real physiological driver of mood instability. Not all people experience postpartum depression, but all experience the hormonal shift.

**Pregnancy as life history:** The backstory system can generate past pregnancy history (pregnancies, outcomes) once that system exists. Current pregnancy as a starting condition defaults to null until the life history system can generate it.

---

## HRT as Ongoing State

### Feminizing HRT effects by duration

| Effect | Onset | Plateau |
|---|---|---|
| Breast development | 3–6 months | 2–3 years |
| Fat redistribution (hips, thighs) | 3–6 months | 2–5 years |
| Skin changes | 1–3 months | 2 years |
| Body hair reduction | 6–12 months | 2–3 years |
| Muscle mass reduction | 3–6 months | 2–3 years |

Source: Hembree et al. 2017 (PMID 28945902).

NT effects: estrogen has documented effects on serotonin synthesis and GABA. Early HRT period may include emotional variability. Dysphoria reduction from body alignment feeds into NT targets, but separating biochemical from psychological effects requires an identity parameter that doesn't exist yet.

```js
// Approximation debt: NT effects of feminizing HRT conflate two mechanisms:
// (1) estrogen's biochemical effects on serotonin/GABA
// (2) psychological effects of body alignment reducing dysphoria signals
// Currently not separable without an identity parameter.
```

### Masculinizing HRT effects by duration

**Irreversible effects:**
- Voice deepening (laryngeal changes, onset within months)
- Clitoral growth (irreversible)
- Body/facial hair distribution and growth

**Reversible/continuing effects:**
- Fat redistribution (more abdominal/visceral, less subcutaneous)
- Muscle mass increase
- Menstrual suppression (usually within 6 months; not always immediate)
- Skin: more oily

**Chest:** As documented — masculinizing HRT does NOT significantly reduce breast tissue. Same approximation debt on NT effects as feminizing.

---

## Interface

What the body system exposes to clothing.js and content.js.

```js
// Factory: createBody(ctx)
// Reads from character object and state. No RNG.

Body.chestDimension()
// Returns: number 0–100
// Current effective chest dimension:
//   - breast_tissue_score base
//   - binding reduction if isBinding() is true
//   - binding fit modifier

Body.abdominalDimension()
// Returns: number 0–100
// Current effective abdominal dimension:
//   - baseline body composition
//   - pregnancy week modifier if active
//   - transient bloating from GI state if active

Body.dimensionAtTime(dim, t)
// Returns: number 0–100
// Historical value of 'chest' or 'abdominal' at game time t (minutes).
// Used for acquisition-time snapshots when clothing items are generated or purchased.
// Returns current value as approximation until historical tracking is implemented.

Body.isBinding()
// Returns: boolean
// True if binder location === 'on_body'.

Body.bindingFit()
// Returns: 'correct' | 'too_small' | 'stretched' | null
// null if not binding.

Body.bindingHours()
// Returns: number
// Hours binder has been worn in current continuous session.

Body.hasBreastTissue()
// Returns: boolean
// True if breast_tissue_score > 15 (post any surgical history).
// Gates bra-relevant interactions and clothing fit prose.

Body.pregnancyWeek()
// Returns: number | null
// null if not pregnant.

Body.hasUterus()
// Returns: boolean
// Private reproductive anatomy. Gates cycle and pregnancy experiences only.
// Never displayed.

Body.energyCeilingModifier()
// Returns: number 0–1 (multiplicative modifier on State.energyCeiling())
// Computes reduction from chronic pain (gigantomastia back pain, binding rib pain),
// pregnancy fatigue, constitutional conditions.

Body.chronicallyBound()
// Returns: boolean
// True if binding hours today > 10.
// Used by interoceptive observation sources.
```

### Character object fields

```js
// Stored verbatim on character, computed at chargen:
{
  asab: 'afab' | 'amab' | 'intersex',
  puberty_history: {
    occurred: boolean,
    timing: 'early' | 'typical' | 'late',
    suppressed: boolean,
    suppression_timing: 'prepubertal' | 'mid_puberty' | null,
  },
  hrt_history: {
    type: null | 'feminizing' | 'masculinizing' | 'menopausal',
    start_offset: number | null,  // months before game start
    dose_tier: 'standard' | 'low' | 'high',
  },
  reproductive_anatomy: {
    has_uterus: boolean,
    has_ovaries: boolean,
    has_testes: boolean,
  },
  constitutional_conditions: {
    gigantomastia: boolean,
    micromastia: boolean,
    breast_asymmetry: number,       // 0–1, right-skewed
    poland_syndrome: boolean,
    poland_side: 'left' | 'right' | null,
    gynecomastia_score: number,     // 0–100, applied only if amab
    post_mastectomy: boolean,
    mastectomy_type: null | 'flat' | 'reconstructed',
  },
  breast_tissue_score: number,      // computed at chargen; snapshot for fit computation
}
```

State fields added:
```js
pregnancy_week: number | null,
binder_start_time: number | null,   // game time in minutes when binder was put on
```

---

## Interoceptive Observation Sources

Proposed body-system observation sources for the senses.js pipeline (not yet implemented):

```js
{
  sourceId: 'binding_compression',
  condition: () => Body.isBinding() && Body.bindingHours() > 8,
  salience_base: 0.3 + (Body.bindingHours() - 8) * 0.05,
  properties: {
    type: 'interoceptive',
    quality: 'pressure',
    location: 'chest',
    breathing_quality: Body.bindingHours() > 10 ? 'restricted' : 'reduced',
  }
}

{
  sourceId: 'pregnancy_first_trimester',
  condition: () => Body.pregnancyWeek() !== null && Body.pregnancyWeek() <= 14,
  salience_base: 0.4,
  properties: { type: 'interoceptive', quality: 'nausea', trigger: 'food_smell' }
}

{
  sourceId: 'pregnancy_fetal_movement',
  condition: () => Body.pregnancyWeek() >= 18,
  salience_base: 0.6,
  properties: { type: 'interoceptive', quality: 'movement', internal: true }
}

{
  sourceId: 'gigantomastia_back_load',
  condition: () => character.constitutional_conditions.gigantomastia,
  salience_base: 0.25,
  properties: { type: 'interoceptive', quality: 'ache', location: 'back_upper', chronic: true }
}
```

---

## Social Consequences

Not flags — emerge from the character's situation in context.

**Binding working correctly:** Reduces misgendering risk. In contexts where this matters for safety and wellbeing, social anxiety in relevant contexts is reduced. Prose has a different texture — not announced, just present differently.

**Ill-fitting clothing from body change:** A character whose body has changed since their wardrobe was acquired wears clothing that doesn't sit right. The prose carries it as body-consciousness; NT effects are an elevation of self-consciousness, not a named flag.

**Gigantomastia social texture:** Staring and unsolicited comment as an observation source (architecture exists; not yet implemented). Medical dismissal when health interactions involve a doctor: back pain attributed to weight rather than condition (a documented pattern — needs citation). Difficulty with formal contexts and job interviews when formal dress is required.

**Visible pregnancy (week 20+):** Changes social interactions in context-dependent ways. In workplace contexts: discrimination is illegal in some jurisdictions and happens anyway. Unsolicited touching, advice, changes in how strangers interact — as prose texture in those contexts, not events.

---

## Approximation Debts

### Not yet modeled at all

1. **Intersex conditions beyond the basics.** Turner syndrome (XO), Klinefelter (XXY), CAH, CAIS, PAIS, AIS spectrum — each has distinct body parameter profiles. Currently: intersex is a single rare chargen outcome with no differentiated downstream effects.

2. **Weight as a tracked body parameter during play.** Abdominal dimension initialized from backstory; modified only by pregnancy and bloating. Weight change during a run (dietary restriction, stress, illness, medication side effects) should modify both dimensions continuously.

3. **Breast cancer / BRCA / prophylactic surgery pathway.** Requires life history system generating health events.

4. **Bra as a clothing item with fit state.** Bras are the clothing item most sensitive to both chest and band dimensions simultaneously. Not in the item type list yet. Adding properly requires body dimensions to be populated first.

5. **Menstrual cycle integration.** Covered in health.md. `has_uterus` is the gate. Not yet implemented in either place.

6. **Exercising while binding.** Compounds binding duration effects. Not designed in detail; architecture should flag the combination when exercise interactions are added.

### Modeled as a scalar that should be dimensional

7. **`breast_tissue_score` is a single scalar.** Glandular vs. fatty composition split responds differently to weight change, age, and HRT. A single scalar is adequate for clothing fit but doesn't support medical prose (breast density, mammogram interpretation).

8. **`breast_asymmetry` is a single continuous value.** Which side is larger, by how much, and whether asymmetry is primarily glandular or fatty — not captured. The scalar enables fit-state divergence between sides but not directional prose.

### Depends on upstream systems not yet built

9. **Life history events → surgical history.** Post-mastectomy, hysterectomy, oophorectomy, orchiectomy — all circumstantial, requiring life history events.

10. **HRT as derived from identity/medical history.** Should be a derived output of transition timeline, menopause, or clinical prescription. Currently a placeholder probability.

11. **Economic access to binders.** Binder fit should be worse for precarious characters. Requires wardrobe acquisition context from the trajectory model.

12. **Jurisdiction → healthcare access → surgical history.** Whether a character has had gender-affirming surgery depends on access, insurance, wait times, economics. None of this is modeled.

### Prevalence data needing citations

13. **Gigantomastia prevalence** — 1:50,000 placeholder. Needs PMID or DOI. Search: "gigantomastia prevalence epidemiology."

14. **Poland syndrome prevalence** — 1:20,000 placeholder. Needs PMID or DOI.

15. **Micromastia prevalence** — 1% placeholder. Needs literature review.

16. **Adult persistent gynecomastia** — 15% placeholder. PMID 8074834 covers adolescent transient; adult persistent rate needs better citation.

17. **Intersex prevalence** — 1.5% placeholder. Fausto-Sterling 2000 doi available; design decision required on which definition to use.

18. **Puberty suppression prevalence** — no citation. Very low; documented as placeholder only.

19. **Genetic breast ceiling distribution** — mean=55, SD=20 has no literature anchor.

20. **Binder effectiveness ranges** — no literature anchor. PMID 28002890 (Peitzmeier et al. 2017) covers health outcomes; effectiveness measurements harder to find.

21. **Gigantomastia medical dismissal** — "back pain attributed to weight rather than condition" pattern documented anecdotally; needs citation.

---

## Implementation Path

This document is a prerequisite for the fit model in `docs/design/clothing-implementation.md`. The clothing system currently defaults all fit to `'comfortable'` pending this system.

### Minimum viable implementation (unblocks clothing fit)

1. Generate body parameters at chargen: `asab`, `breast_tissue_score`, `abdominal_baseline`, `reproductive_anatomy`, constitutional conditions
2. Store on character object
3. Implement `createBody(ctx)` with `chestDimension()`, `abdominalDimension()`, `isBinding()`, `bindingFit()`
4. Wire into `createGameContext()`
5. Populate `chest_at_acquisition` and `abdominal_at_acquisition` in `generateWardrobe()`
6. Activate fit computation in `clothing.js`

This does not require HRT trajectory, pregnancy, or binding duration effects — those are additive on top.

### Full implementation order

1. **Chargen body parameters** — ASAB, puberty history, constitutional conditions, `breast_tissue_score`, reproductive anatomy. On `charRng` stream, placed after existing parameters.
2. **Body module** — `createBody(ctx)`, minimum interface above.
3. **Clothing fit activation** — populate acquisition snapshots, live fit computation.
4. **Binding object** — binder as clothing item type; `isBinding()`, `bindingFit()`, `bindingHours()` go live; duration effects; interoceptive sources.
5. **HRT trajectory** — time-dependent breast development and fat redistribution from `hrt_start_offset`.
6. **Pregnancy body state** — `pregnancy_week` feeds `abdominalDimension()` and `breast_tissue_score` modifier.
7. **Interoceptive observation sources** — body system contributes to the senses.js pipeline.
