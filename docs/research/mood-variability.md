# Mood Variability — Empirical Validation Target

Research conducted 2026-06-05 via web search across PubMed / PMC. Every empirical claim below
carries a retrievable citation (PMID / DOI / PMC ID). Where a PMID could not be confirmed it is
marked `PMID unverified`.

This doc establishes the **empirical magnitude of ordinary day-to-day and within-day mood
variability**, so the NT-trajectory harness (`scripts/nt-trajectory.js`) can validate the sim's
emergent mood swing against a literature-grounded band instead of taste. It does NOT tune any
coefficient — it defines the target the tuning phase aims at.

---

## Empirical day-to-day mood variability (validation target)

### The core question

The harness asks: under current NT couplings, serotonin moves only ~2.5 points over a
representative ordinary day and `moodTone()` never leaves `'present'`. Is that too flat? The
empirical answer comes from the experience-sampling (ESM) / ecological-momentary-assessment (EMA)
and daily-diary literature, which measures within-person affect variability directly.

### Headline number: within-person SD of momentary affect ≈ 13–15 on a 0–100 scale

The cleanest anchor, because it is reported on the **same 0–100 scale the sim's NT space uses**:

> Jones DR, Smyth JM, Engeland CG, Sliwinski MJ, Russell MA, Sin NL, Almeida DM,
> Graham-Engeland JE. **Affect Variability and Inflammatory Markers in Midlife Adults.**
> *Health Psychology* 2020;39(8):655–666. **PMID 32324001**; DOI 10.1037/hea0000868;
> PMC8351733.

- Protocol: 5 semi-random EMA prompts/day for 14 days, N≈230 midlife adults.
- Affect rated **0 (not at all) to 100 (extremely)** — directly comparable to the sim's 0–100.
- **Intraindividual SD (iSD) of positive affect: M = 15.10 (SD 7.17).**
- **Intraindividual SD of negative affect: M = 13.29 (SD 6.83).**

So a *typical* person's momentary affect, sampled through ordinary days, has a within-person
standard deviation of roughly **13–15 points on a 0–100 scale**, absent any major life event
(this is the everyday baseline, not a stressor-driven excursion). The **between-person SD of that
iSD is ~7**, i.e. high-variability vs stable individuals span roughly **iSD ≈ 8 (stable) to ≈ 22
(volatile)** (M ± 1 SD). This is the measured individual-difference range — the sim's
personality-inertia axis should reproduce a spread of this order, not a single value.

### Replication on the PANAS 1–5 scale (well-established, different scale)

> Zheng Y, Plomin R, von Stumm S. **Heritability of Intraindividual Mean and Variability of
> Positive and Negative Affect: Genetic Analysis of Daily Affect Ratings Over a Month.**
> *Psychological Science* 2016;27(12):1611–1619. **PMID 27729566**; DOI 10.1177/0956797616669994;
> PMC5221725.

- Protocol: 10-item short-form PANAS, **1–5 scale**, daily over a month, twin sample.
- **iSD of positive affect: M = 0.48 (SD 0.15); iSD of negative affect: M = 0.34 (SD 0.19).**
- On a 1–5 scale the usable range is 4 points, so iSD 0.48 ≈ **12% of scale range**; iSD 0.34 ≈
  **8.5% of range**. The 0–100 study's iSD 15.1/13.3 is **15.1% / 13.3% of range** — same order
  of magnitude across two independent scales and samples. The variability is a **stable trait**:
  heritability **.34 (PA) / .54 (NA)**, consistent with Eid & Diener (1999)
  (*J Pers Soc Psychol* 76(4):662–676; DOI 10.1037/0022-3514.76.4.662 — PMID unverified) reporting
  test–retest of iSD up to .90 over two months. Variability is therefore a *person parameter*, which
  is exactly what the sim's personality-inertia axis is meant to encode.

### How much of affect's total variance is within-person (not stable trait differences)

> Scott SB, Sliwinski MJ, Zawadzki M, Stawski RS, Kim J, Marcusson-Clavertz D, Lanza ST,
> Conroy DE, Buxton O, Almeida DM, Smyth JM. **A Coordinated Analysis of Variance in Affect in
> Daily Life.** *Assessment* 2020;27(8):1683–1698. **PMID 30198310**; DOI 10.1177/1073191118799460;
> PMC6408986.

- Coordinated analysis of 7 daily-diary/EMA studies, N=2,103 persons, 45,065 observations.
- **Within-person variance is sizeable: NA 45–66%, PA 25–74% of total affect variance.**
- In EMA, more of the within-person variance sits at the **momentary** than the **daily** level —
  i.e. mood swings *within* a day are at least as large as swings *between* days.

This rules out the interpretation that the sim could be flat within a day yet correct across days:
the literature says the within-day component is the larger one. A model that is nearly static
within a day is missing the dominant share of real affect variance.

### Well-established vs uncertain

- **Well-established:** within-person affect iSD ≈ 13–15 on 0–100 (≈13–15% of scale), replicated
  at ≈8–12% on PANAS 1–5; variability is a stable, heritable individual-difference trait;
  within-person variance is a large share of total affect variance and the momentary (within-day)
  component dominates the daily one.
- **Uncertain / not pinned here:** the exact MSSD/RMSSD value in raw scale units (it is study- and
  sampling-interval-dependent — successive-difference metrics scale with the gap between prompts,
  so a raw RMSSD target is not portable). We therefore validate against the **iSD (dispersion)**
  target, which is interval-robust, and report RMSSD only as a secondary descriptive number. The
  Eid & Diener (1999) PMID is **unverified** (used only as corroboration, not as the primary anchor).

---

## Mapping the target onto the sim

### Which sim quantity is "affect"?

`moodTone()` (state.js ~7193) is driven primarily by **serotonin and dopamine relative to
baseline**, with NE/GABA and physical overrides on top. Serotonin is the emotional-coloring axis;
dopamine is engagement. The closest sim analogue to a self-reported momentary-affect rating is a
**valence proxy** built from these. We define:

```
affectProxy = 50 + 0.6*(serotonin - serotonin_baseline) + 0.4*(dopamine - dopamine_baseline)
```

centered at 50, on the same 0–100 frame as the EMA studies. The 0.6/0.4 weighting follows
`moodTone()`'s heavier reliance on serotonin for the positive/heavy distinction (serotonin appears
in more tone gates and at tighter thresholds). This proxy is a **measurement instrument inside the
harness**, not a new sim variable — it never feeds back into state.

### The target band (0–100 scale)

The empirical iSD anchor is **PA ≈ 15, NA ≈ 13** on 0–100. Affect valence is a blend of both, and
the sim's usable serotonin range ([20,82], span 62) is narrower than the full 0–100 the EMA scales
nominally allow (real affect ratings rarely span the full 0–100 either). Taking the more
conservative NA anchor and the PA anchor as the band:

> **Target within-day iSD of affectProxy ≈ 8 – 18 points (0–100), centered ~13.**
> Stable individuals near the low end (~8), volatile individuals near the high end (~18–22).
> A within-day iSD **< 5** is below anything observed in the literature for ordinary life.

The harness flags the model **BELOW** target if measured iSD < 8, **WITHIN** if 8–18, **ABOVE** if
> 18 (using the conservative lower bound; the M±1SD individual range extends to ~22 for the most
volatile people, so values up to ~22 are not implausible for a high-variability archetype).

### moodTone readout vs the underlying continuum

A separate question is whether `moodTone()`'s **thresholds** are themselves the artifact: even with
adequate underlying variability, a coarse readout with wide central deadbands can report a constant
tone. The harness reports BOTH (a) the continuous affectProxy iSD — the thing the literature
constrains — and (b) the moodTone distribution. If (a) is below band, the couplings are too weak.
If (a) is within band but moodTone is still constant, the readout thresholds are the artifact. This
distinguishes the two failure modes from data rather than assertion.
