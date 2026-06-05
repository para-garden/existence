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

---

## TUNING-PHASE OUTCOME (2026-06-05)

The tuning phase ran the harness as arbiter and reached a structural conclusion: **the 8–18
within-day affect iSD band is NOT reachable by scaling the SER/DA coupling magnitudes**, and the
initial "couplings too weak" hypothesis is incomplete. The binding constraint is the
**level-drift time constant**, not coupling magnitude.

### Measured before/after

| archetype | before iSD (ordinary day) | after iSD |
|-----------|---------------------------|-----------|
| resilient | 1.11 | 1.11 (unchanged — no affect-coupling change shipped) |
| baseline  | 1.06 | 1.06 |
| ruminator | 1.00 | 1.00 |

Cortisol diurnal peak:trough ratio was fixed independently: **2.6:1 → 6:1** (in the empirical
5:1–8:1 band), via the diurnal midpoint/amplitude, not an affect coupling. See
`cortisolTarget()` and `nt-coupling-dopamine-ne.md`.

### Why magnitudes alone cannot reach the band (the architectural finding)

The affect signal is `0.6·(SER−base) + 0.4·(DA−base)`. Decomposing the within-day ceiling
(measured, see `scripts/nt-trajectory.js` low-pass probe):

1. **Serotonin's drift rate is a 9–11 h low-pass filter.** `ntRates.serotonin = [0.06, 0.08]`
   is literature-anchored (ATD mood onset 5–6 h, recovery <24 h — PMID 18452034, PMID 3931142;
   SERT clearance + TPH2-rate-limited resynthesis). Feeding the serotonin *target* a ±20-point
   24 h oscillation yields only a **±3.6-point level** oscillation; a 4 h-period oscillation
   yields ±0.7. Serotonin physically cannot carry within-day momentary variance — and
   biologically should not: tonic 5-HT is the slow emotional-coloring axis, not the
   moment-to-moment signal.
2. **Dopamine (`[0.35, 0.45]`, fast) tracks within-day oscillation** — a ±20 target swing at
   24 h period → ~±11.8 level. But the realistic within-day drivers only move the DA target ~12
   points total (energy is monotonic decay, not oscillatory), and the energy→DA coefficient is
   already at its literature ceiling (0.25; Treadway 2012). There is no headroom.
3. **Ceiling computation:** even with *both* targets oscillating ±20 at 24 h period
   (coupling magnitudes far past any literature value, extremes destroyed), affect iSD caps at
   **~5.2** — still below the band's lower bound of 8. The drift-rate low-pass alone caps it.

The remaining gap to 8–18 is therefore **event-driven momentary variance** that the harness's
smooth representative drivers explicitly remove (the harness re-pins smooth hourly inputs to
create a controlled load). Real EMA iSD-13 comes from prompts catching the person at genuinely
different moments — a frustrating email, a good coffee, a worry intrusion — which in this sim are
discrete interactions/events consuming gameplay RNG, not the smooth drivers. **The smooth-driver
harness measures the tonic/structural floor (~1, correctly low); it cannot measure the
event-driven component that dominates real within-day affect variance.**

### The mapping error in this doc's affectProxy rationale

The 0.6/0.4 SER/DA weighting was derived above from `moodTone()`'s serotonin-heavy gating. That
is a **category error for a *momentary* affect metric**: `moodTone()` reports *sustained tone*
(a slow quality), whereas EMA momentary affect is dominated by the *fast* systems (dopamine
engagement, NE arousal). A momentary-affect proxy should weight the fast systems more heavily.
This was NOT changed (changing the instrument to pass its own test is circular), but it explains
why the serotonin-weighted proxy is structurally pinned near zero within a day.

### The archetype-spread direction is backward (second finding)

Objective: resilient/baseline/ruminator should span ~8→22 iSD (heritable individual difference;
Zheng 2016 PMID 27729566; between-person SD of iSD ≈7). The model produces them at 1.11 / 1.06 /
1.00 — clustered AND in the wrong order. The sim's only personality→variability mechanism is
`effectiveInertia()` (drift *rate*): high neuroticism/rumination → higher inertia → *slower*
tracking → *less* within-day swing. But the literature is the opposite: **neuroticism is
associated with GREATER variability in negative affect** (Mader et al. 2023, PNAS
120(23):e2212154120, PMID 37253012, PMC10266024 — "Emotional (in)stability"), *simultaneously* with greater
negative-affect inertia (the "stability–instability paradox"). Inertia (autocorrelation/persistence)
and variability (dispersion) are **distinct constructs that high neuroticism elevates together**.

The sim models only inertia, which monotonically *reduces* variability — so it can never produce
the empirical spread. The missing abstraction is a **reactivity/amplitude axis**: high
neuroticism / low self-esteem / high rumination should *amplify* the perturbation a given input
produces (larger target excursions per unit input, less efficient down-regulation), independent
of the drift rate. This is the mechanism by which a ruminator is *more* volatile, not less.

### Fix SHIPPED (2026-06-05) — reactivity axis + event-driven momentary affect

All three architectural fixes shipped together (they are co-dependent — perturbations with no
reactivity = wrong archetype spread; reactivity with no perturbations = nothing to amplify). See
`docs/design/reactivity-axis.md` for the full design and final calibrated values.

1. **Event-driven affect perturbations** — implemented inside `advanceTime()`: per-minute
   Poisson-thinned micro-events (λ=0.40/min) apply acute `adjustNT` blips on the fast systems
   (dopamine 2/3, norepinephrine 1/3), right-skewed magnitude (raw span [5.5, 55.5]), slight
   negativity bias (1.1×), sleep-suppressed, with a live headroom soft-clip so noise never pins a
   clamp. Scaled per-character by `reactivityFactor()`. Fixed per-quantum draw count (one `rng`
   draw per whole minute) preserves deterministic replay; new consumer → `CURRENT_VERSION` 38.
2. **Reactivity/amplitude axis** — `reactivityFactor()` in state.js, neuroticism-led
   `{n 0.45, r 0.35, seInv 0.20}`, range base 0.45 / span 1.4 (→ [0.45, 1.85]). Resolves the
   stability–instability paradox: high neuroticism now raises variability (this axis) AND inertia
   (`effectiveInertia()`) together.
3. **Corrected momentary-affect metric** — harness `affectProxyMomentary = 50 + 0.45·DA + 0.30·NE
   + 0.25·SER` (fast-systems-led), measured on a free-running gameplay trajectory at EMA-prompt
   cadence (the smooth-driver runs retained as a tonic reference).

**Before → after (within-day iSD of momentary affect, free-running EMA test):**

| archetype | before (no perturbations) | after | verdict |
|-----------|---------------------------|-------|---------|
| resilient | ~0.34 | **8.02** | WITHIN band, low end (expected) |
| baseline  | ~0.35 | **11.42** | WITHIN band, ~center |
| ruminator | ~0.34 | **14.77** | WITHIN band, high end (expected) |

Direction corrected: resilient < baseline < ruminator (the paradox), where before all three were
clustered at ~1 and slightly *backward*. Guardrails: 5/5 stacking checks pass (raw targets
untouched — perturbations don't enter `_ntTargetRaw`); crisis control stays 88.9% heavy with no
clamp pinning; cortisol diurnal 6:1 unchanged; `ntRates` drift rates and `*Target()` couplings
not modified (reactivity enters only as a perturbation-magnitude multiplier).

Generator params (frozen, marked `// Approximation debt (momentary affect):` / `(NT coupling):`):
λ=0.40/min, raw magnitude `5.5 + skew²·50.0`, negativity bias 1.1×, DA:NE = 2:1, live linear
headroom soft-clip; reactivity weights/range as above.

**Post-ship adversarial-review corrections (2026-06-05).** Four defects fixed (full detail in
`docs/design/reactivity-axis.md` § Adversarial-review corrections):
1. **DA/NE split was inverted** — keyed on the intra-call loop index `m % 3`, which under
   `advanceTime(1)`-per-action play is always 0 → always NE, never DA. Re-keyed on the absolute
   game-minute `(baseMinute + m) % 3`: now exactly 2:1 DA:NE under both small and large calls, no
   extra rng, replay-safe.
2. **moodTone strobe + CART feature noise** — `moodTone()` and the CART NT features read raw
   jittered DA/NE; now read short-τ (45 min) EMA-smoothed levels (`*_smoothed`). Prose-tone flips
   drop to ~2/waking-day in the harness while still tracking genuine hour-scale swings. The
   underlying momentary proxy iSD is unchanged (variance stays in the level). CART still no-rng.
3. **Chronic setpoint coupling** — the baseline EMA read the post-injection level (~1 pt/week leak,
   NE +0.37 soft-clip asymmetry). Now cleanly decoupled: the blip is a transient offset decayed in
   lockstep, baseline reads `level − transient`; momentary stream contributes ≈0 to the setpoint
   (EMA-input moves ≤0.014 pt/min vs multi-point raw jumps).
4. **Version purge guard** `< 37` → `< 38` (v37 saves were errored-on at load instead of purged).

Per CLAUDE.md ("model the phenomenon, not a convenient instance"), forcing the band by inflating
the literature-anchored couplings — which would still cap at ~5 and would peg the extremes — was
explicitly rejected; the variance is event-sourced, which is where the real within-day component
lives.
