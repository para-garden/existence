# Identity System Design

## Principles

### Pronouns are grammatical, not social

The pronoun system is for prose generation — how NPC dialogue and narrative text refer to characters. Pronouns carry no mechanical weight. Social mechanics (pay gap, street safety, workplace discrimination) read `perceivedPresentation()`, not pronouns.

### Identity dimensions are orthogonal

Gender identity, gender expression, sexual orientation, romantic orientation, and pronouns are independent axes. A character's pronouns don't determine their gender identity; their expression doesn't determine their orientation. Don't derive one from another except where the character's own choices create a link (e.g., expression choices reflect identity).

### Attraction is multi-dimensional

Sexual ≠ romantic ≠ aesthetic ≠ sensual. The split attraction model is the base architecture. Labels (ace, bi, pan, demi) are shorthand for parameter configurations, not primitives. A character who is asexual but romantically attracted to people has a different experience than one who is aromantic but sexually active.

---

## Pronoun Architecture

### PronounSet

A structured object replacing the old string enum:

```
{
  subject: "she",       // "she", "he", "they", "xe", "ze", "fae", "it", "ey"
  object: "her",        // "her", "him", "them", "xem", "zir", "faer", "it", "em"
  possessive: "her",    // "her", "his", "their", "xyr", "zir", "faer", "its", "eir"
  reflexive: "herself", // "herself", "himself", "themself", "xemself", "zirself", "faerself", "itself", "emself"
  plural: false,        // verb conjugation: "they are" vs "xe is"
  label: "she/her"      // display string
}
```

Common sets provided as a lookup table: she/her, he/him, they/them, xe/xem, ze/zir, fae/faer, it/its, ey/em.

### Mixed pronouns

Stored as an array of 1–2 PronounSet objects. When the array has 2 entries, prose alternates between them. The first entry is used slightly more often (not 50/50 — matches common real usage where one set is primary).

In practice, the game uses `resolvePronouns(pronounSets, rng?)` which picks one set for the current prose passage. For deterministic contexts (location descriptions), it uses the first set.

### Neighbor pronouns

The neighbor's pronoun is stored as a PronounSet on the neighbor object (not a bare string). Prose generation reads from it directly: `pronoun.subject` instead of manual if/else chains.

### Chargen

Pronoun selector on the character screen. Dropdown with common sets + "custom" option that expands to show subject/object/possessive/reflexive text inputs + a plural toggle. Mixed pronouns: a "add second set" button that shows a second dropdown.

---

## Gender Model

### Continuous dimensions, not categories

Gender identity and expression are represented as continuous dimensions (0–100), not categories. This captures the full range of gender experience including nonbinary, genderfluid, agender, and culturally specific genders — without forcing every character into a named box.

### Identity dimensions

- **binary_diversity** (0–100) — cross-gender identification relative to ASAB. 0 = strong identification with ASAB, 100 = strong identification with "opposite" binary gender. Cis characters cluster near 0; binary trans characters cluster near 100.
- **nonbinary_diversity** (0–100) — identification outside the male/female binary. 0 = firmly within binary; 100 = strong nonbinary identity. Independent of binary_diversity — a character can have both high binary_diversity and high nonbinary_diversity (e.g., transfeminine nonbinary).

### Expression dimensions

- **expression_femininity** (0–100) — how much femininity the character expresses (clothing, grooming, mannerisms, voice).
- **expression_masculinity** (0–100) — how much masculinity the character expresses.

These are independent, not a single axis. A character can be high on both (androgynous), low on both (neutral presentation), or high on one.

### Perceived presentation — derived function

`perceivedPresentation()` in state.js is a **pure derived function** (like `ambientTemperature()`). It is NOT stored state. It reads:

- Expression femininity and masculinity
- Body parameters (breast_tissue_score, etc.)
- Current clothing
- HRT effects (if active)

Returns a tier: `'fem_read'` / `'masc_read'` / `'androgynous_read'`. This is what the social world responds to — pay gap, street safety, workplace dynamics.

The gap between perceived_presentation and identity dimensions is where dysphoria/euphoria lives. Not modeled as a flag — it emerges from the mismatch.

### Trans as emergent

The stored `trans` boolean is removed. "Trans" as a concept emerges from:
- `binary_diversity > 60` (binary trans)
- `nonbinary_diversity > 40` (nonbinary/genderqueer)
- The combination of ASAB + identity dimensions creating a gap

A derived function `isTrans()` computes this. The character doesn't carry a trans label — the experience of being trans is the experience of identity/presentation/perception gaps.

### HRT gating

HRT remains gated on `hrt_active` (boolean) + `hrt_type` ('estradiol' | 'testosterone'). These are independent of pronouns. A character on estradiol HRT might use he/him pronouns. The HRT type is derived from the character's desired direction (identity vs. ASAB), not from pronouns.

### Chargen

Gender appears as a qualitative selector on the character screen. Not the raw numbers. Options like:
- "woman" → binary_diversity 0, nonbinary_diversity 0, expression_femininity 70, expression_masculinity 15 (if AFAB)
- "man" → similar for AMAB
- "nonbinary" → nonbinary_diversity 60+, expression varies
- "trans woman" → binary_diversity 90+, expression_femininity 65+
- "trans man" → binary_diversity 90+, expression_masculinity 65+
- "genderqueer" → various configurations
- "agender" → low on all dimensions

Plus a "customize" option that exposes the continuous sliders.

---

## Split Attraction Model

### AttractionProfile

```
{
  sexual: { intensity, orientation, gating },
  romantic: { intensity, orientation, gating },
  sensual: number,    // 0-100
  aesthetic: number    // 0-100
}
```

### AttractionPattern

```
{
  intensity: number,    // 0-100: 0 = ace/aro, 100 = strong
  orientation: number,  // 0-100: 0 = exclusively same-gender, 50 = bi/pan, 100 = exclusively different-gender
  gating: 'none' | 'bond' | 'rare'  // none = allosexual, bond = demi, rare = gray
}
```

### Label mapping

Common identity labels map to parameter configurations:
- **Asexual** — `sexual.intensity < 10`, romantic varies
- **Aromantic** — `romantic.intensity < 10`, sexual varies
- **Demisexual** — `sexual.gating = 'bond'`, intensity normal
- **Bisexual** — `sexual.orientation ≈ 50`
- **Gay/lesbian** — `sexual.orientation < 15`
- **Straight** — `sexual.orientation > 85`
- **Pansexual** — like bi but less influenced by gender presentation in target (prose distinction, not mechanical)
- **Aroace** — both intensities < 10

### Mechanical effects

These shape daily texture, not a dating sim:

**Allonormative cognitive load** — When `sexual.intensity` is low, sex-saturated social contexts (coworker conversations about hookups, media, cultural assumptions) cost more social_energy. Small drain, cumulative.

**Amatonormative pressure** — When `romantic.intensity` is low, romance-normative contexts (holidays, family questions, cultural scripts about partners) produce stress/alienation. Family idle thoughts branch differently.

**Sensual/touch** — Modulates how restorative physical contact is. High sensual + no available contact = specific longing. Low sensual = touch-averse prose in crowded spaces.

**Aesthetic** — Shapes perceptual prose. High aesthetic means people-watching registers beauty without routing to desire. Feeds observation sources.

**Closet complexity** — Concealment energy drain scales with how many dimensions are non-normative and being concealed. `out_at_work` and `out_to_family` expand from single booleans to sets of disclosed dimensions — you might be out as gay but closeted about being ace.

### Chargen

Attraction appears as a qualitative selector. Common identity labels as dropdown options, each mapping to the underlying parameter configuration. Plus "customize" for fine control.

---

## Interaction with Existing Systems

### Backstory visibility modes (from player-character.md)

Identity dimensions interact with the three backstory modes:
- **Never shown** — identity is generated, affects mechanics, player discovers through prose texture
- **Shown + sealed** — identity revealed during backstory exposition, not editable
- **Shown + kept** — identity shown on chargen screen, player can modify

Current implementation is "shown + kept" (chargen displays and allows editing).

### Congruence as NT-shading dimension

The gap between identity and perception is an NT-shading source, not a flag:
- High congruence (identity matches perception) → serotonin support, reduced cortisol
- Low congruence → cortisol elevation, social_energy drain from managing the gap
- HRT gradually shifts perceived_presentation, changing congruence over time

This replaces the old `trans` boolean checks in cortisol target — the same mechanic now applies to any character with an identity/perception gap, trans or not.

### Closet energy cost — generalized

The old system had separate drains for "sexuality concealment" and "trans stealth". The new system computes concealment load from all non-disclosed identity dimensions:
- Non-normative sexuality (not straight) + not disclosed → drain
- Non-normative gender (identity doesn't match ASAB expectations) + not disclosed → drain
- Non-normative attraction pattern (ace, aro, demi) + not disclosed → drain

Drains scale with how much active concealment is required in the current context (work vs. family vs. public).
