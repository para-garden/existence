# DESIGN-SURGICAL-MODIFICATIONS.md

> **PARTIAL SPEC** — design space captured, not implementation-ready. Complication model and recovery state need further design before implementation can begin. Measurement offset storage is the immediate prerequisite; everything else follows from that.

Surgical modifications that directly change body measurements, anatomy, or hormone production. Distinct from mass-driven drift (see `docs/design/body.md`) and from hormone therapy (see HRT section in `body.md`). Two primary domains: measurement offsets and complication state.

---

## Purpose

Some body changes don't emerge from biological drift — they happen at a specific time, through a specific intervention, with specific properties that persist. A mastectomy is not "breast tissue score trending toward zero." It is a discrete event with a type, a date, a set of permanent consequences, and a set of possible complications. The simulation needs to represent that correctly.

This system writes structural offsets that the body system reads. Body composition drift and the surgical system are unaware of each other's internals. Clean separation.

---

## Core principle

**A thing's nature determines where it lives; its origin is an attribute, not a taxonomy.** (See CLAUDE.md.)

Post-mastectomy state is not "a note inside the cancer history entry." It is a present fact about the chest that shapes every prose interaction involving the chest. Past events explain how the character got here; the current state is the character's reality now. Where surgical history records *what happened*, the surgical offset system records *what is*.

---

## Measurement modifications

### Chest structural offset

Surgery that removes or adds chest tissue creates an offset independent of `breast_tissue_score` drift.

```js
// State field:
chest_structural_offset: number,  // signed, 0–100 scale, default 0
```

`Body.chestDimension()` reads it as:
```js
effective_chest = breast_tissue_score + (chest_structural_offset ?? 0)
// Clamped [0, 100] after applying offset.
```

Body composition drift is unaware of surgery. The offset is static once set; only another surgical event changes it.

#### Mastectomy

Surgical removal of breast tissue. A large immediate reduction to `chest_structural_offset` (negative). The magnitude depends on type:

- **Unilateral:** roughly half the character's breast_tissue_score removed; asymmetry consequences.
- **Bilateral:** near-complete removal. Flat chest when unaffected by implants.

Type matters beyond the number. Unilateral mastectomy produces a persistent asymmetry that bilateral does not. Clothing fit on the affected side behaves differently. If the character has prosthetics, they wear them on one side only — different from bilateral augmentation or bilateral flat.

**Cause** is an attribute on the surgical record, not a taxonomy:
- Oncological (cancer treatment or prophylactic after BRCA/high-risk detection)
- Gender-affirming (top surgery)
- Other (gynecomastia reduction, phyllodes tumor, etc.)

The cause shapes the backstory and the prose texture, but the mechanical state is the same: an offset applied to the affected side(s). Flat chest prose for a trans man and flat chest prose for a breast cancer survivor are different — same mechanical fact, different character, different weight. Prose functions read the character; not a separate state variable.

**Sensation changes:** Permanent. Nerve disruption is common; full sensation rarely returns completely. Degree varies by surgical technique. This is an interoceptive fact — the chest is there, the weight is different, and sensation in the area is changed. Not a flag. Prose renders the difference when the chest is touched, when clothing presses against it, when temperature changes.

**What's not modeled yet:** sensation state (which would require a per-zone sensation map). Approximation debt.

#### Breast augmentation (implants)

Adds to `chest_structural_offset` (positive). The offset represents added volume/projection.

Augmentation has properties that matter beyond the scalar; see **Implant properties** below.

#### Breast reconstruction

Follows mastectomy. Mechanically: restores some chest dimension — offset moves back toward zero or positive. But reconstruction is not equivalent to primary augmentation. Properties differ:

- Tissue flap reconstruction (TRAM, DIEP, latissimus dorsi) uses the character's own tissue, relocated. Different feel, different sensation profile, different complication set, scars elsewhere on the body.
- Implant reconstruction uses an expander first, then implant — a two-stage process. The character may spend months with a tissue expander before the final implant.
- Reconstruction after mastectomy often produces less natural sensation return than primary augmentation. The area may feel permanently different.

The simulation must not treat reconstruction as "add implant properties to mastectomy character." It is a distinct surgical history entry with distinct properties.

#### Other measurement-affecting procedures

**Body contouring / liposuction:**
- Affects `abdominal_dimension` and regional body composition
- Reduces the fat component of body dimensions in treated areas
- Body composition drift still applies post-procedure — the baseline shifts, but drift continues
- Approximation debt: regional fat distribution is currently a single scalar, not a map of treated zones

**Fat grafting:**
- Transfers fat from one region to another
- Can affect breast dimension (common supplementary procedure in reconstruction)
- Different properties from implants: the material is the character's own tissue; it integrates differently, may partially resorb over months

---

## Implant properties

Implants are not just a size offset. Properties that persist, affect daily experience, and change the complication profile.

```js
// Character field — surgical_history entry for augmentation or reconstruction:
{
  type: 'breast_implant',
  side: 'bilateral' | 'left' | 'right',
  placed_at: number,          // game time (minutes) — for monitoring/follow-up scheduling
  fill_type: 'saline' | 'silicone',
  profile: 'low' | 'moderate' | 'high',
  placement: 'subglandular' | 'submuscular',
  shape: 'round' | 'anatomical',
  surface_texture: 'smooth' | 'textured',  // relevant for BIA-ALCL risk
  size_offset: number,        // contribution to chest_structural_offset, 0–100 scale
  condition: 'intact' | 'ruptured' | 'suspected_rupture',
}
```

**Fill type:**
- *Saline:* sterile salt water. If rupture occurs: immediate visible deflation over hours. Easily detected; body absorbs the saline. Monitoring: no special imaging required — rupture is obvious.
- *Silicone:* gel. Ruptured silicone may stay in the capsule (intracapsular) and be asymptomatic for years. Detected only on MRI. The FDA recommends MRI screening at year 3 post-placement, then every 2 years. A character with silicone implants has an ongoing monitoring obligation that saline implants don't.

**Profile:**
- Low/moderate/high refers to projection relative to base width — how much the implant pushes forward vs. how wide it sits.
- Affects chest shape in prose, not just size. High profile: more projection, narrower base. Low profile: wider, less projecting.
- Same `size_offset` can feel very different depending on profile. The simulation can distinguish in prose without surfacing the label.

**Placement:**
- *Subglandular* (over the muscle): easier surgery, faster recovery, more pronounced animation (implant movement visible with arm movement), higher rate of capsular contracture in some literature.
- *Submuscular* (under the pectoral muscle): more natural movement, less animation distortion, longer recovery, more painful in the first weeks, different complication profile.
- Placement affects binding viability if the character later wants to bind.

**Shape:**
- *Round:* symmetric. No orientation concern. Most common.
- *Anatomical (teardrop):* more fullness at bottom, mimics natural tissue. If it rotates, shape distortion is visible and may require revision.

**Surface texture:**
- *Smooth:* most common in the US post-2019.
- *Textured:* associated with BIA-ALCL (see complications below). Many textured implant types recalled or restricted.

---

## Complication model

*Not yet implemented. Needs recovery state system first.*

Each surgical procedure produces a complication profile. Complications are not random events bolted on afterward — they are consequences of the procedure's properties and the character's biology.

### General surgical risks (all procedures)

**Wound infection:**
- Interacts with the existing illness system. `illness_severity` increases during an infected wound.
- Risk elevated by: immunocompromise, smoking (nicotine_habit), malnutrition (when nutrient tracking exists), diabetes (when implemented), time to treatment before the infection was addressed.
- Arc: fever + site pain + possible systemic symptoms over days. Antibiotics (prescription, cost, access) required. Untreated: escalation to sepsis in extreme cases.

**Wound healing:**
- Recovery period with activity restrictions. Some interactions unavailable. Wound care interactions appear.
- Duration varies by procedure. Mastectomy: 2–4 weeks before most activity. Augmentation: 4–6 weeks before strenuous activity.
- Not yet designed: interaction restriction system by recovery state. This is the primary blocker for implementing this feature.

**Scarring:**
- Permanent. Keloid risk is constitutional — generated at chargen. A character prone to keloids has more visible, raised scarring after any surgery. Keloid formation is significantly more common in people of African, Asian, and Hispanic descent; approximation debt when ancestry is not a chargen parameter.
- Affects: clothing feel, interoceptive signals, situations where the scar area is exposed (locker rooms, intimacy, etc.)
- Approximation debt: keloid prevalence and ancestry correlation needs PMID or DOI.

**Anesthesia complications:**
- Rare general surgical risk. Elevated by certain conditions (malignant hyperthermia susceptibility — constitutional, very rare). Not yet designed in detail. Placeholder.

### Implant-specific complications

**Capsular contracture:**
- The body forms a fibrous capsule around any foreign implant (normal). Contracture is when that capsule hardens and tightens, distorting the implant and causing pain or stiffness.
- Four grades (Baker scale I–IV): I = normal softness, IV = hard, painful, distorted.
- Rate varies by: fill type (saline vs. silicone — conflicting evidence), placement (submuscular may reduce rate in some literature), surface texture, infection history, hematoma post-op.
- Can develop slowly over years, not just in the immediate post-op period. Not an acute event — an arc.
- May require revision surgery.
- Approximation debt: Baker scale grade probabilities per property combination need literature.

**Rupture:**
- Saline: immediate deflation. Character notices change in chest appearance. Replacement needed.
- Silicone: may be asymptomatic. Requires MRI to confirm. A character who misses monitoring screenings may have an undetected rupture for years.
- The simulation can model silicone rupture as a scheduled event at a low probability per year, with detection only when MRI is performed.
- Rate: older implants have higher rupture rates. Silicone implant rupture at 10 years: estimated 10–20% in some studies (PMID unverified — needs citation).

**Positional complications:**
- *Bottoming out:* implant migrates inferiorly. Scar tissue doesn't hold the implant in position. Visible: nipple position changes relative to implant. Revision surgery.
- *Rippling:* visible ripple of the implant through the skin. More common: thin tissue coverage, subglandular placement, saline implants.
- *Displacement:* implant shifts laterally or medially.

**BIA-ALCL (Breast Implant-Associated Anaplastic Large Cell Lymphoma):**
- Rare lymphoma in the scar capsule around implants. Associated specifically with textured implants.
- FDA warning issued 2019. Worldwide incidence estimate ~1 in 2,000–86,000 textured implant recipients; wide range due to surveillance limitations (FDA 2020 advisory).
- The character would not know about this without medical attention. Presents as swelling, fluid, or mass around the implant, typically months to years post-placement.
- For the simulation: if `surface_texture === 'textured'`, a very low probability event becomes schedulable. Detected only if medical contact occurs for that symptom.
- Approximation debt: precise rate estimate needs current FDA data.

### Mastectomy-specific complications

**Seroma:**
- Fluid accumulation in the surgical space. Very common after mastectomy (~25–50% in some series — PMID unverified).
- Managed with drains (the character may go home with surgical drains for 1–2 weeks, changing drain output daily — this is a wound care interaction).
- May require aspiration at follow-up appointments.

**Lymphedema (oncological mastectomy only):**
- If lymph nodes are removed (sentinel node biopsy or full axillary dissection), lymphatic drainage is disrupted.
- Lymphedema: chronic swelling in the arm on the affected side. Lifelong management.
- Requires distinguishing oncological mastectomy (nodes may be removed) from gender-affirming mastectomy (lymph nodes are not involved).
- Not yet designed. Requires lymph node removal as a surgical attribute.

---

## Recovery state

*Not yet implemented. Needs design before surgical modifications can be fully built.*

Each procedure generates a recovery period. Recovery is not a timer that counts down invisibly — it is a present state that shapes what's possible.

What recovery state needs:
- **Duration range** by procedure. Roughly: augmentation 6 weeks activity restriction, mastectomy 4–6 weeks, flap reconstruction 6–8 weeks. Surgeon guidance varies.
- **Activity restrictions** by phase. Days 1–7: almost nothing strenuous. Days 7–21: light activity. Weeks 3–6: graduated return. Each phase has different interaction availability.
- **Wound care interactions.** Checking drains (post-mastectomy), cleaning incision sites, dressing changes. These should appear as scheduled interactions, not random events.
- **Integration with sleep quality.** Surgical pain degrades sleep quality. Analgesic-assisted sleep has its own texture (drowsy, not restful).
- **Integration with job capability.** Physical jobs: may require extended leave. Desk jobs: may return in 2–3 weeks. The simulation's work system needs to know recovery restrictions.
- **Integration with social energy.** Recovery is isolating. Visitors who mean well. The character's capacity for normal social navigation is reduced while in acute recovery.

Recovery state architecture (proposed, not decided):
```js
// State field:
recovery_state: {
  type: string,              // e.g. 'post_mastectomy', 'post_augmentation'
  started_at: number,        // game time (minutes)
  phase: 'acute' | 'intermediate' | 'late',
  wound_care_due_at: number | null,   // next wound care required
} | null
```

Phase derived from `(time - started_at)` — never stored as a counter. (See CLAUDE.md: "How far along is always derived from a start timestamp.")

---

## Hormone production effects

Some surgeries eliminate or severely reduce endogenous hormone production. These are not measurement changes — they are changes to the character's internal hormonal environment, with slow downstream effects.

**Orchiectomy:**
- Surgical removal of one or both testes.
- Bilateral orchiectomy removes ~95% of testosterone production.
- Effects downstream: fat redistribution (more subcutaneous, less visceral), muscle mass changes, potential mood effects — all operating through the same drift channels as exogenous HRT. The direction is the same as feminizing HRT's body composition effects, because the mechanism is the same: reduced androgens.
- Relevant for: gender-affirming care (some trans women prefer orchiectomy over ongoing testosterone suppression), cancer treatment (testicular cancer, prostate cancer hormone management).
- After orchiectomy: `has_testes` on `reproductive_anatomy` is updated accordingly. If the character was on testosterone suppression, that medication becomes unnecessary for that pathway.

**Oophorectomy:**
- Surgical removal of one or both ovaries.
- Bilateral oophorectomy: abrupt menopause (if premenopausal). Not a gradual transition — acute loss of estrogen and progesterone.
- Symptoms: vasomotor (hot flashes), sleep disruption, mood instability, vaginal atrophy over time. The NT model already handles estrogen pathway via HRT; oophorectomy-induced menopause would engage the same targets with a sudden shift in the wrong direction unless HRT is started.
- Relevant for: cancer treatment (ovarian cancer, BRCA), prophylactic surgery (high familial risk), endometriosis treatment, gender-affirming care.
- After oophorectomy: `has_ovaries` updated. Menstrual cycle ends (no ovarian hormones to drive it). If character has uterus, uterus remains but cycle stops.
- Approximation debt: surgical menopause NT target shift magnitudes need literature. Direction is clear; coefficients are not.

**Connect to HRT architecture:**
The drift architecture in `state.js` already models hormones through target functions. Surgical hormone production changes feed into those same targets — they are not a separate system. An oophorectomized character without HRT has low estrogen targets suppressing serotonin/GABA, similar to postmenopausal targets but more abrupt.

---

## What's already implemented

- `has_bariatric_surgery` character field: sets `stomach_capacity` to 15 (sleeve gastrectomy equivalent). Approximation debt note in state.js at line ~914.
- Binding system in `body.md` / `js/state.js`: `binder_start_time`, `binderTier()`. Not surgical, but related — affects chest presentation and is the closest existing system.
- HRT system (`hrt_active`, `hrt_type`, `hrt_last_taken` in state.js; drift effects in NT target functions). The hormone production effects of orchiectomy and oophorectomy connect here.
- `constitutional_conditions.post_mastectomy` and `mastectomy_type` on the character schema (in `body.md` spec; not yet implemented in chargen).
- `reproductive_anatomy` schema (`has_uterus`, `has_ovaries`, `has_testes`) — orchiectomy and oophorectomy update these fields.

---

## Interface with body composition

Surgical system writes offsets; body.js reads them:

```js
// Body.chestDimension() with surgical offset:
effective_chest_cm = breast_tissue_score + (chest_structural_offset ?? 0)
// Clamped [0, 100].
```

Body composition drift (`breast_tissue_score` changing from HRT trajectory, weight change, pregnancy) is unaware of the surgical offset. The surgical system is unaware of body composition drift rates. Neither needs to know the other's internals. Clean separation.

Similarly for `abdominal_dimension`:
```js
effective_abdominal = abdominal_baseline + abdominal_structural_offset + pregnancy_modifier + bloat_modifier
```

Liposuction / body contouring would write `abdominal_structural_offset`. Fat grafting to the chest would contribute a small positive `chest_structural_offset`.

---

## Surgical history record

Each procedure stores a record. These live in the character object (chargen-seeded) or as game events (during play).

```js
// Character field:
surgical_history: [
  {
    type: 'mastectomy' | 'augmentation' | 'reconstruction' | 'orchiectomy' | 'oophorectomy'
         | 'body_contouring' | 'fat_grafting' | 'other',
    cause: 'oncological' | 'gender_affirming' | 'cosmetic' | 'reconstructive' | 'therapeutic',
    side: 'bilateral' | 'left' | 'right' | 'unilateral' | null,  // null if not applicable
    performed_at: number,    // game time (minutes) — null if chargen-seeded (predates game)
    implant_properties: ImplantProperties | null,
    complications: [],       // grows as complications develop during play
  }
]
```

---

## Implementation priority / what's missing

### Immediate prerequisite (unblocks body.md)

- **`chest_structural_offset` in state** — a single number in the state object, default 0. Needed by `body.md`'s `Body.chestDimension()` before anything else. This is the minimal change.

### Second tier (needs chest offset first)

- **Chargen: mastectomy seeding** — replace the `constitutional_conditions.post_mastectomy` placeholder roll with a proper surgical history entry that writes `chest_structural_offset`. Until life history exists: low base probability, bilateral/unilateral weighted.
- **Implant properties storage** — character schema additions. Needed before any augmentation interaction is written.
- **`abdominal_structural_offset`** — parallel to chest offset. Needed for body contouring / liposuction modeling.

### Third tier (needs recovery state design)

- **Complication model** — needs the recovery state system to exist as a target. Complications feed into recovery arcs, wound care interactions, and the illness system. Cannot be built in isolation.
- **Recovery state** — core design needed first (see Recovery state section above). This is a significant design piece on its own.

### Fourth tier (depends on upstream systems)

- **Lymphedema** — needs lymph node removal as a surgical attribute; needs a chronic condition model for swelling.
- **Surgical menopause NT shift** — needs coefficient calibration against literature. Direction is clear.
- **Silicone implant monitoring** — needs the scheduled interrupt queue (see state.js architecture). The MRI reminder is a `{ time, type: 'implant_mri_due', data }` entry.
- **BIA-ALCL** — extremely rare; low priority. Needs interrupt queue.
- **Life history → surgical history** — full derivation of pre-game surgical events from backstory. Requires the backstory system to generate health events in general.

---

## Approximation debts

- `chest_structural_offset` contribution per procedure type (mastectomy magnitude, augmentation offset from implant size) — not calibrated. Direction is right; numbers need anchoring.
- Keloid prevalence and ancestry correlation — needs PMID or DOI.
- Capsular contracture rate by implant properties — conflicting evidence; needs literature review per property combination.
- Silicone implant rupture rate over time — 10-year rate cited as 10–20% (PMID unverified).
- Seroma incidence post-mastectomy — 25–50% cited (PMID unverified).
- BIA-ALCL rate for textured implants — FDA 2020 advisory cited, precise figure range wide.
- Surgical menopause NT target shift magnitudes — direction clear from estrogen/progesterone mechanism; coefficients approximation debts.
- Oophorectomy vs. orchiectomy long-term body composition drift rates vs. exogenous HRT rates — individual-level literature sparse.

---

## What this document does not cover

- **Orthopaedic surgery** (joint replacement, fracture repair) — under injury/chronic pain system
- **Facial gender-affirming surgery** (FFS, jaw, brow, tracheal shave) — not yet designed; affects appearance/social perception but not currently modeled measurements
- **Genital surgeries** (vaginoplasty, phalloplasty, metoidioplasty) — separate design needed; affect reproductive anatomy fields but require significant prose investment for intimate contexts not yet built
- **Bariatric surgery** — already implemented (see `has_bariatric_surgery`)
- **Dental surgery** — under the dental arc in `docs/design/health.md`
