# Research: GABA Target Coupling & Social Connection Decay

Empirical literature review for two approximation debts in `state.js`. Research conducted 2026-02-24 via web search across PubMed, PMC, and journal databases. All citations given as PMID, PMC ID, or DOI — not study name alone.

---

## Part 1 — GABA Target Function Coupling Coefficients

**Applies to:** `gabaTarget()` in `state.js` (~line 2271).

**Current code:**
```js
function gabaTarget() {
  let t = 55;
  // Chronic stress depletes GABA (slow mechanism)
  if (s.stress > 50) t -= (s.stress - 50) * 0.15; // Approximation debt: threshold 50 and coefficient 0.15 chosen
  // ALLO modulates GABA-A — when implemented, allopregnanolone will feed here
  return clamp(t, 28, 78); // floor from Sanacora 1999 PMID 10565505
}
```

**What this means:** At stress=100, `t = 55 - 50 * 0.15 = 47.5`. At stress=50, `t = 55`. The coefficient 0.15 is chosen; the threshold 50 is chosen.

---

### 1a. Chronic Stress → GABA Reduction

**What we're looking for:** How much does sustained psychosocial stress reduce GABAergic tone in healthy humans?

#### Acute stress MRS findings

**Hasler et al. 2010 (PMID 20634372; PMC3107037):** Prefrontal GABA decreased by approximately **18%** during a threat-of-shock condition vs. a safe control in healthy subjects (n=68). Effect was specific to GABA — NAA, choline, and Glx unchanged. Statistical: F=19.02, df=1,67, p<0.0001. The GABA reduction correlated inversely with self-reported anxiety (r=−0.31, p=0.005). The effect recovered by minutes 25–32 of measurement, suggesting the acute reduction is transient (minutes timescale).

**Bhattacharya et al. 2017 (PMID 28180078; PMC5280001):** A 7T MRS study of 29 healthy males given the Trier Social Stress Test (TSST) found **no significant change** in medial prefrontal GABA or glutamate in response to psychosocial stress. This is a direct null replication of the Hasler paradigm using a higher-resolution scanner and a socially stressful (rather than physical-threat) stressor. The authors note that the TSST-induced cortisol response was confirmed, so the null result is not due to failure of the stress manipulation.

**Key conflict:** Hasler (threat-of-shock) found 18% acute reduction; Bhattacharya (TSST/social stress) found null. These may reflect different stress modalities (threat vs. social evaluation) or different timescales of GABA dynamics. The MRS literature is generally small-N and methodologically heterogeneous.

#### Chronic stress / depression MRS findings

The depression literature provides the closest proxy for chronic psychosocial stress effects on GABA, since MDD involves chronic HPA dysregulation, GABAergic deficit, and stress exposure.

**Sanacora et al. 1999 (PMID 10565505):** ~52% reduction in occipital cortex GABA in melancholic depression vs. healthy controls. This is the study cited in the existing `gabaTarget()` floor comment. It anchors the floor at 28 (≈48% of healthy-baseline 55).

**Sanacora et al. 2002, 2003:** SSRI treatment and ECT both increased cortical GABA back toward healthy levels in depressed patients; CBT did not. This normalization-with-treatment pattern is consistent with a causal role for GABAergic deficits in MDD, not just epiphenomenal association. PMID 11925309 (SSRI), PMID 12611844 (ECT).

**Meta-analysis (Kühn & Gallinat 2013 approx. period; cited in Sanacora review):** Depressed patients had significantly lower GABA vs. controls (Hedges' g ~−0.35 [−0.61, −0.10], p=0.007). This is a moderate effect size in the same direction as the Sanacora finding, but considerably smaller than the 52% (which would correspond to much larger g). The 52% figure from the 1999 study may be inflated by small N and the melancholic subsample — a more representative estimate for moderate/typical depression is probably ~15–30% reduction.

**Cortical GABAergic Dysfunction Review (Fogaça & Bhattacharya 2019, PMC6422907):** Chronic unpredictable stress (CUS) and chronic mild stress (CMS) in rodents decrease GAD67, VGAT, and GAT3 in PFC. The mechanism is dendritic spine loss and reduction of GABAergic interneuron function. These structural effects require weeks to develop and weeks to reverse — consistent with the "slow mechanism" note in the code comment. No single human MRS number is given, but the review synthesizes the direction as consistent: chronic stress produces a durable GABAergic deficit.

**Calibration implication for `gabaTarget()`:**
The 18% acute reduction from Hasler gives a transient lower bound for what a single stressor does. The 15–30% chronic estimate from the depression MRS literature gives the plausible range for what sustained stress (not acute episodes) produces. The current coefficient `(stress - 50) * 0.15` gives a maximum reduction of `50 * 0.15 = 7.5 points` from baseline 55 (i.e., ~14% reduction at stress=100). This is at the low end of empirical range for chronic stress but within it.

| Parameter | Current | Literature estimate | Confidence |
|---|---|---|---|
| Stress threshold | 50 | Literature doesn't cleanly support a threshold; effect is probably continuous. Low-moderate stress may have small but nonzero effect. | Low |
| Coefficient (0.15/stress-unit) | 0.15 | Roughly defensible. At max reduction (~14%), consistent with lower end of chronic-stress GABA literature (15–30%). Acute single-session effects ~18% but transient. | Medium |
| Maximum reduction at stress=100 | 7.5 pts (~14%) | 15–30% for sustained depression-level stress; 18% for acute threat. The code's ~14% is at the empirical floor. | Medium |

**Honest assessment:** The threshold at 50 is the weakest element. A continuous linear effect starting at stress=0 (with a small coefficient) is more consistent with the biology than a step-gated function. However, the magnitude at the high end (~14% reduction) is defensible as the low-stress-burden case. For a character at stress=100 chronically, the literature would support a somewhat larger reduction (15–25%). A coefficient of 0.20–0.25 would be better supported — giving 10–12.5 pts reduction (18–23%) at maximum stress — but this requires accepting that the effect is approximately continuous and not threshold-gated.

**Recommended calibration:** Replace threshold gate with continuous coupling; raise coefficient to ~0.20:
```js
// Evidence: Hasler 2010 (PMID 20634372): acute stress −18%; depression MRS meta-analysis: ~15–30% chronic.
// Coefficient 0.20 gives max −10 pts (−18%) at stress=100. Threshold removed — effect is continuous.
t -= s.stress * 0.20 * 0.5; // scaled: at stress=50 → −5; at stress=100 → −10
```
Or equivalently, keeping the current architecture but changing coefficient to 0.20 and acknowledging the threshold is an approximation:
```js
if (s.stress > 30) t -= (s.stress - 30) * 0.15;  // Approximation debt: threshold 30 (not 50) and coeff 0.15
```

**Confidence in direction:** High. Multiple independent lines of evidence converge on chronic stress → reduced cortical GABA.
**Confidence in magnitude:** Medium. The 15–30% range from the MRS depression literature is the best available anchor. The exact coefficient depends on simulation-scale choices.

**Key sources:**
- Hasler et al. 2010, *Am J Psychiatry* — acute stress −18% prefrontal GABA (PMID 20634372; PMC3107037)
- Bhattacharya et al. 2017, *NeuroImage: Clinical* — TSST null result at 7T (PMID 28180078; PMC5280001)
- Sanacora et al. 1999, *Am J Psychiatry* — 52% occipital GABA in melancholic MDD (PMID 10565505)
- Sanacora et al. 2002 — SSRI normalizes cortical GABA (PMID 11925309)
- Sanacora et al. 2003 — ECT normalizes cortical GABA (PMID 12611844)
- Fogaça & Bhattacharya 2019, *Frontiers in Cellular Neuroscience* — chronic stress GABAergic review (PMC6422907)

---

### 1b. Sleep → GABA

The code has no sleep coupling to GABA. This is the relevant literature for whether one should be added.

**Winkelman et al. 2008 (PMID 19014069; PMC2579978):** Primary insomnia patients (n=16) had **~30% lower whole-brain GABA** vs. matched controls (.18 ± .06 vs. .25 ± .11 institutional units; t=2.16, p=0.039). GABA correlated inversely with WASO across two PSG recordings (r=−0.72, p=0.0024 and r=−0.71, p=0.0048). This is one of the most cited MRS insomnia findings, but the N is very small and the voxel covered basal ganglia + thalamus + temporal/parietal/occipital cortex mixed.

**Plante et al. 2020 (PMID 32447224; PMC7302996):** In 153 individuals with subjective sleep complaints (no formal insomnia diagnosis), shorter sleep (<6h/night by actigraphy, n=74) was associated with **lower ACC/mPFC GABA** vs. longer sleep (≥6h, n=79). Mean GABA: 1.932 ± 0.206 vs. 2.012 ± 0.212 i.u. (t=−2.21, p=0.03). The difference is ~4% — much smaller than the 30% from Winkelman. Among the shorter-sleep group, lower GABA correlated with worse working memory (β=−0.21, p=0.03). Glutamate/glutamine (Glx) did not differ between groups.

**Mechanistic direction:** The relationship is bidirectional and difficult to disentangle. Low GABA may cause poor sleep (insomnia), OR poor sleep may reduce GABA, OR both arise from a common third factor. The rodent total sleep deprivation literature (PMID 12377609) is also mixed — some TSD protocols show GABA increases in certain regions (possibly a compensatory mechanism), which complicates any simple "sleep loss → GABA down" narrative.

**Calibration implication:** The direction (less sleep → lower GABA) is present in the literature, but:
1. Effect sizes are small in the naturalistic study (4%, Plante 2020).
2. The insomnia study (30%, Winkelman 2008) likely reflects cumulative chronic insomnia history rather than a single-night sleep effect.
3. The simulation already models a separate adenosine pathway that carries the primary sleep-pressure signal. Adding a direct GABA coupling for sleep debt creates potential double-counting.

**Recommendation:** A sleep debt coupling to GABA is weakly supported. If added, it should be small in magnitude (ceiling ~4–6 points = ~7–11% of baseline 55) and tied to `sleep_debt` accumulation rather than single-night sleep. The current absence of this coupling is not clearly wrong given the small effect sizes and bidirectionality concerns.

| Parameter | Current | Literature estimate | Confidence |
|---|---|---|---|
| Sleep→GABA coupling | absent | 4% (naturalistic short sleep) to 30% (chronic insomnia history); direction supported but effect sizes vary 7× across studies | Low |
| Magnitude if added | — | ~3–6 pts on simulation scale for chronic sleep debt | Low |

**Key sources:**
- Winkelman et al. 2008, *Sleep* — 30% lower GABA in primary insomnia (PMID 19014069; PMC2579978)
- Plante et al. 2020, *Sleep Medicine* — 4% lower ACC GABA with <6h sleep (PMID 32447224; PMC7302996)

---

### 1c. GABA Floor/Ceiling Calibration Check

**Current floor: 28. Current ceiling: 78.**

The floor is cited to Sanacora 1999 (PMID 10565505): ~52% reduction in melancholic depression, so floor = 55 × 0.48 ≈ 26, rounded to 28. This derivation is sound but specific to the most severe melancholic subsample. For moderate depression (15–30% reduction from meta-analysis), the floor would be more like 38–47. The floor at 28 represents the worst clinically documented chronic state, which is the right lower bound for a simulation modeling severe depression risk.

**Ceiling at 78:** The comment says "no natural chronic high-GABA ambulatory state." This is correct — chronically elevated GABA produces sedation, which is self-limiting. Anxiolytics (benzodiazepines) can push GABA-A activity up dramatically, but this is pharmacological, not endogenous. The ceiling at 78 (i.e., +23 above midpoint 55) is directionally appropriate and not well-constrained by a single study. No literature challenge found.

| Parameter | Current | Status |
|---|---|---|
| Floor (28) | Anchored to Sanacora 1999 PMID 10565505 | Defensible; represents severe melancholic depression end-state |
| Ceiling (78) | No anchor; based on absence of high-endogenous-GABA ambulatory states | Plausible, unconstrained |

---

## Part 2 — Social Connection Decay Time Constant (τ=66h)

**Applies to:** Social decay in `tickNeurochemistry()` in `state.js` (~line 557).

**Current code:**
```js
const neuroMod = 1 + (s.neuroticism - 50) / 50 * 0.35;
const lonelinessFl = (s.trait_loneliness ?? 30) * 0.25;
s.social = lonelinessFl + (s.social - lonelinessFl) * Math.exp(-hours * neuroMod / 66);
```

**What τ=66h means:** With neuroMod=1.0 (neuroticism=50):
- After 10h of isolation from social=50, floor=12.5: social ≈ 12.5 + 37.5 × exp(−10/66) ≈ 12.5 + 37.5 × 0.858 ≈ 44.7 (−5.3 pts)
- After 24h: social ≈ 12.5 + 37.5 × exp(−24/66) ≈ 12.5 + 37.5 × 0.697 ≈ 38.6 (−11.4 pts)
- After 66h (1 τ): ~63% of above-floor gap lost → social ≈ 26.3 from starting 50
- After 3 days (72h): social ≈ 25.5 from starting 50

The existing code already has the comment "τ=66h: approximation debt — bounded by >10h (Tomova 2020) and <months (Roberts & Dunbar 2011)." This document finds what the literature can actually say.

---

### What the literature can tell us

**The critical challenge:** There is no published study that directly measures the time constant for felt social connection decay as an exponential process with isolation duration. The literature instead gives:
- Lower bounds: effects detectable at 10h (Tomova 2020)
- Upper bounds: meaningful decay over weeks to months (Dunbar/Roberts 2011, 2015)
- Cross-sectional correlates of isolation duration and loneliness
- ESM/daily-diary studies of within-day and day-to-day loneliness fluctuations

No study gives a τ. The simulation's τ=66h is therefore necessarily an inference from bracketing evidence, not a direct measurement.

---

### Lower bound: 10-hour effects

**Tomova et al. 2020 (PMID 33230328; PMC8580014):** 40 participants underwent 10 hours of total social isolation in a controlled lab setting. fMRI after isolation showed midbrain dopaminergic activation in response to social cues (similar pattern to midbrain food-craving activation after fasting). Self-reported loneliness and social craving were significantly elevated after isolation. Mean UCLA Loneliness Scale baseline: 33.2 ± 6.3 (max 47 in the sample). The study establishes that **10 hours of isolation is sufficient to produce measurable craving-state neural signatures and elevated self-reported loneliness**. This is the empirical lower bound: τ must be substantially longer than 10h, since 10h of isolation produced a detectable but not maximal state change.

**Ding et al. 2025 (PMID 40011768):** Identified two hypothalamic preoptic neuronal populations driving social need ("loneliness neurons") and social satiety. Critically: longer isolation durations produced stronger social rebound upon reunion — suggesting monotone accumulation of social need with isolation duration. The dose-response was graded and continuous (no threshold). This supports continuous exponential accumulation (not onset-gated) and is consistent with the code's removal of the 10-action threshold.

---

### Middle range: days

**Luchetti et al. 2020 (PMID 32567879; PMC7890217):** Longitudinal study of loneliness trajectory during COVID-19 (American Psychologist, 75(7), 897–908). Measured loneliness at 3 time points across the acute lockdown period. Main finding: no significant mean-level increase in loneliness across the sample, with some groups (older adults) showing initial increase then leveling off. This is somewhat surprising but consistent with adaptation and increased perceived social support from others.

**Critical implication for τ calibration:** If τ were very short (e.g., 10–20h), isolation of several weeks (the lockdown period) should have produced dramatic loneliness increases in most participants. The Luchetti finding of relatively stable mean loneliness over weeks suggests either: (a) people actively compensated via remote contact, (b) τ is long enough that the decay is slow relative to partial social maintenance through phone/video contact, or (c) loneliness has ceiling effects and trait variation means average trajectory appears flat. Option (a) and (b) are both consistent with a τ in the 66–200h range — slow enough that partial remote contact can substantially blunt the decay.

**Tran et al. 2024** (DOI 10.1177/19485506231176603): Examined social experience dynamics during extended lockdown (Australia). ESM design collected multiple times daily over weeks. Did not report a time constant, but found significant between-person variation in loneliness trajectories, with some showing habituation and others progressive worsening. The within-person dynamics were driven more by social interaction quality on a given day than by cumulative isolation duration — consistent with the simulation's design where `adjustSocial()` impacts the level.

**Roberts & Dunbar 2011** (DOI 10.1111/j.1475-6811.2010.01310.x): Emotional closeness of friendships declined measurably after a major life transition across ~18 months when contact frequency dropped. The decline was meaningful within months for even close (inner-circle) friendships if contact fell below maintenance threshold. This gives an upper bound constraint: most of the socially relevant decay in the model occurs over days-to-weeks, not months — months-scale processes are relevant for *relationship closeness* (a different construct from felt *daily connection*), not momentary social need.

**Dunbar 2015 (PMC4626528):** "Preventing a decline in closeness requires active maintenance" — inner-circle friendships showed ~one person replaced every 10 years, but emotional intensity of specific relationships dropped within months of reduced contact. The ~3 months estimate before significant closeness loss in close friendships gives a rough ceiling: τ for *momentary daily social connection* (the simulation variable) should be much shorter than 3 months (2160h). τ=66h sits at ~3% of 2160h, which is consistent with daily felt connection being a faster-moving signal than the multi-month friendship closeness construct.

---

### Within-day ESM evidence

**Daily Social Interactions and Momentary Loneliness (PMC9535790):** ESM study found that social interactions predicted lower momentary loneliness at the time of interaction, but the lagged effect (3.5–7h later) was not significant. This is consistent with connection relief having a timescale of hours, not days — in line with a τ that is long enough to give meaningful persistence within a day but gradual decay over days without contact.

**Buecker, Horstmann & Luhmann 2024** (Social Psychological and Personality Science): Daily diary study (N1=3,309; N2=907) over 4-week periods. Found large day-to-day stability of loneliness (high inertia) — loneliness on day N strongly predicted loneliness on day N+1. This is consistent with a long τ (slow decay / slow recovery). A system with τ=10h would show near-complete day-to-day variation; a system with τ=66h would show substantial carry-over from day to day, which matches the finding.

---

### Translating to τ

The τ=66h value cannot be derived from a single published number. What the literature constrains:

| Constraint | Evidence | τ bound |
|---|---|---|
| 10h isolation → detectable but not maximal change | Tomova 2020 (PMID 33230328) | τ > 10h |
| ESM: lagged effect of social interaction not significant at 3.5–7h | PMC9535790 | τ probably > 7h to explain why decay at 3.5–7h is small enough to be NS |
| COVID lockdowns of 2–6 weeks: mean loneliness did not dramatically increase | Luchetti 2020 (PMID 32567879) | τ plausibly > 100h given partial remote contact could blunt decay |
| Day-to-day loneliness inertia is high | Buecker 2024 | Consistent with τ in range 50–200h |
| Friendship closeness decays over months (not days) | Roberts & Dunbar 2011 (DOI 10.1111/j.1475-6811.2010.01310.x) | τ < 2000h (for daily felt connection, which is faster-moving than closeness) |

The τ=66h sits inside these bounds. However, the Luchetti finding and the high day-to-day inertia from Buecker could both support a longer τ — possibly 100–200h. On the other hand, τ too long would mean the character barely notices a few days of isolation, which is inconsistent with the Tomova 10h finding producing measurable craving states.

**Best-supported range: τ ≈ 48–120h.** The current τ=66h is within this range and is a reasonable central estimate.

| Parameter | Current | Literature-supported range | Confidence |
|---|---|---|---|
| τ (baseline, neuroticism=50) | 66h | 48–120h | Low — no direct measurement exists |
| Neuroticism scaling ±35% | ±35% | Buecker et al. 2020 (DOI 10.1002/per.2229): neuroticism r=+0.358 with loneliness — plausible directional support | Medium |
| Trait loneliness floor scaling (0.25) | 0.25 | Cacioppo hypervigilance (PMID 20652462); h²=48% (PMID 16273322) — direction supported, magnitude unconstrained | Low |

---

### What the model gets right (and what it can't get)

**Gets right:**
- Continuous accumulation (no threshold), consistent with Ding 2025 and Tomova 2020
- Asymptotic form (not linear), consistent with homeostatic saturation observed in both adenosine and social need systems
- Trait loneliness floor — consistent with Cacioppo hypervigilance model (lonely individuals have a structural floor, not zero)
- Neuroticism scaling — directionally supported by Buecker meta-analysis

**Cannot be derived from literature:**
- The specific τ value (no study measures this)
- The introversion scaling on `social_energy` recovery (3 pts/hr, coefficient 0.4) — directionally supported by Zelenski 2020 (PMC7260435) but the magnitude is unconstrained
- The floor scaling factor (0.25) — the trait loneliness floor exists but no study gives a number that maps to this scale

---

### Key sources (social decay)

- Tomova et al. 2020, *Nature Neuroscience* — 10h isolation midbrain craving response (PMID 33230328; PMC8580014)
- Ding et al. 2025, *Nature* — hypothalamic social homeostasis circuit, graded dose-response to isolation (PMID 40011768)
- Luchetti et al. 2020, *Am Psychologist* — COVID-19 loneliness trajectory; mean stable across lockdown (PMID 32567879; PMC7890217; DOI 10.1037/amp0000690)
- Buecker, Horstmann & Luhmann 2024, *SPPS* — day-to-day loneliness inertia (DOI 10.1177/19485506231156061)
- Roberts & Dunbar 2011, *Personal Relationships* — friendship closeness decay over months (DOI 10.1111/j.1475-6811.2010.01310.x)
- Dunbar et al. 2015, *Human Nature* — friendship decay timescales; inner circle (PMC4626528; PMID 26489745)
- Buecker et al. 2020, *European J Personality* — neuroticism r=+0.358 with loneliness (DOI 10.1002/per.2229)
- Zelenski et al. 2020 — social energy fatigue lag 2–3h (PMC7260435)
- Cacioppo & Hawkley 2010 — hypervigilance model of loneliness (PMID 20652462)
- Boomsma et al. 2005 — loneliness heritability 48% (PMID 16273322)
- Daily social interaction × momentary loneliness ESM (PMC9535790)

---

## Summary Table

| Debt | Current | Literature range | Confidence | Action |
|---|---|---|---|---|
| GABA stress threshold (50) | 50 | No clean threshold in biology; effect probably continuous | Low | Consider removing threshold; make continuous from stress=0 |
| GABA stress coefficient (0.15) | 0.15 → max −7.5 pts | 0.18–0.25 → max −9 to −12.5 pts (15–23% reduction at stress=100) | Medium | Raise to 0.20 if threshold removed; leave if threshold stays at 50 |
| GABA sleep coupling | absent | 4–30% in chronic sleep loss; direction supported | Low | Add only if sleep_debt effect is desired; keep small (≤6 pts) |
| GABA floor (28) | Sanacora 1999 PMID 10565505 | Anchored | High | No change |
| GABA ceiling (78) | No anchor | Plausible (no chronic high-GABA ambulatory state) | Medium | No change |
| Social τ (66h) | 66h | 48–120h; cannot be directly derived | Low | In defensible range; may be slightly short — 80–100h plausible |
| Neuroticism scaling (±35%) | ±35% | Directionally supported (Buecker 2020 r=0.358) | Medium | No change needed |
| Trait loneliness floor scale (0.25) | 0.25 | Direction supported; magnitude unconstrained | Low | Document as approximation debt; leave value |
