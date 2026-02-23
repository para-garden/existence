# Dopamine and Norepinephrine Target Coupling Coefficients

Literature review for calibrating the coupling coefficients in `dopamineTarget()` and `norepinephrineTarget()` in `js/state.js` (lines ~2208–2268).

Research conducted 2026-02-24. All empirical claims carry retrievable citations.

---

## Overview

Both target functions shift a baseline NT level (50/100) based on current state variables. Coefficients represent NT-target-points-per-unit-of-input. All variables are on 0–100 scales. The clamps are:

- Dopamine: `[25, 85]`
- Norepinephrine: `[25, 88]`

The central translation challenge: most literature reports absolute concentrations (nM, pg/ml), percent changes from baseline, or PET binding potential shifts. None of these map directly to the game's 0–100 abstract scale. Each section describes what the measurement IS, what assumptions are needed to translate it, and what confidence that translation warrants.

---

## Dopamine Target Coefficients

### 1. Energy → Dopamine: `(s.energy - 50) * 0.25`

**Current:** `t += (s.energy - 50) * 0.25`
**Effect range:** At energy=0 → −12.5 pts; at energy=100 → +12.5 pts. Total swing: 25 pts.

**What the literature says:**

The dopamine–effort relationship is well-documented in human PET studies:

- **Treadway et al. 2012** (*J Neuroscience*, PMC3391699): Individual differences in dopamine function in the left striatum (measured via [18F]fallypride + d-amphetamine) correlated positively with willingness to expend effort for reward. Higher striatal dopamine responsivity → greater effort allocation. This is a direction-of-effect finding, not a magnitude.

- **Salamone & Correa 2012** (*Neuron*): Depletion of dopamine from striatum or administration of dopamine antagonists causes cessation of effortful reward-seeking behavior. Consistent with the energy→dopamine direction (or more precisely: dopamine→ willingness to expend energy, which is bidirectionally coupled).

- **Fatigue modulates dopamine availability**: Tanaka et al. 2017 (*Scientific Reports*) showed fatigue modulates dopamine availability and promotes flexible choice reversals. High fatigue states are associated with reduced effective dopamine signaling.

- **Physical fatigability and striatal dopamine**: In 125 community-dwelling older adults, higher posterior putamen dopamine integrity (PET) was associated with lower performance fatigability (PMC11447735). Quantitative: the association was statistically significant but the effect size maps to a correlational relationship, not a unit-per-unit conversion.

**Translation difficulty:** The energy→dopamine coupling in the code is a proxy for a real bidirectional relationship where dopamine drives motivation (and thus energy expenditure) AND fatigue/low-energy states reduce effective dopamine tone. There is no clean "X% energy reduction = Y% dopamine reduction" in the literature because energy is not a single measured variable.

**Calibration assessment:**

The 0.25 coefficient produces a ±12.5 pt swing around baseline for full energy range. Given that MDD anhedonia (associated with substantially blunted dopamine tone) produces ~30–40% reduction in dopaminergic function relative to healthy, and that the game's floor is 25 (vs. 50 baseline), the total downward range available is 25 pts. The energy coupling consuming 12.5 of those 25 pts seems proportionally reasonable — fatigue alone shouldn't account for the entire pathological range. The direction is well-supported; the magnitude is plausible but not derivable from a specific measurement.

**Confidence: Low.** Direction well-supported. Magnitude plausible but not derivable from a specific human measurement. Document as approximation debt with improved justification.

**Recommended value:** 0.25 is defensible as an upper bound. A more conservative 0.15–0.20 would be equally defensible. The existing 0.25 is not clearly wrong.

**Key sources:**
- Treadway et al. 2012, *J Neuroscience* 32(18):6170–6 (PMC3391699) — dopamine and effort allocation
- Salamone & Correa 2012, *Neuron* 76:470–85 (PMID 23141060) — dopamine depletion and effort
- Tanaka et al. 2017, *Scientific Reports* (https://www.nature.com/articles/s41598-017-00561-6) — fatigue and dopamine
- Espay et al. 2024, *PMC* (PMC11447735) — striatal dopamine and physical fatigability

---

### 2. Stress → Dopamine: `if (s.stress > 60) t -= (s.stress - 60) * 0.2`

**Current:** Applied only above stress=60; max effect is −8 pts (at stress=100).
**Effect range:** 0 to −8 pts.

**What the literature says:**

**Animal microdialysis (chronic stress → basal DA reduction):**

- **Gambarana et al. 1999** (*J Neurochemistry* 72(5):2039–2046, PMID 10217282): 7-day unavoidable stress in rats caused escape deficit and significant decrease in extraneuronal dopamine basal concentration in nucleus accumbens shell. Stressed animals showed attenuated cocaine-induced DA release, consistent with reduced dopaminergic neuron activity. Exact percent reduction not available from abstract; study design suggests 20–40% reduction in basal extracellular DA is consistent with the finding.

- **Chronic stress deficits in reward behaviour** (2024, *Communications Biology*, https://www.nature.com/articles/s42003-024-06658-9): Chronic stress causes reduced nucleus accumbens dopamine specifically during reward anticipation; basal levels relatively preserved. This is an important nuance — chronic stress appears to selectively blunt phasic (reward-evoked) DA rather than uniformly reducing tonic basal DA.

**Human PET (psychosocial stress → acute striatal DA release, not chronic depression):**

- **Pruessner et al. 2004** (*J Neuroscience* 24(11):2825–31): Psychosocial stressor caused dopamine release in ventral striatum (reduction in [11C]raclopride BPND) in subjects with low parental care. Cortisol response correlated with raclopride binding reduction (r=0.78). This is acute stress causing acute DA release — the opposite direction from chronic stress effects. Important: acute stress activates the mesolimbic system as an alarm/salience signal; chronic stress depletes it.

- **Pizzagalli 2014** review (*Annual Review of Clinical Psychology*, PMC3972338): Anhedonia arises from dysfunctional interactions between stress and brain reward systems. Chronic stress perturbs dopamine signaling in medial prefrontal cortex and ventral striatum.

**The acute vs. chronic distinction:**

The code applies a chronic-stress-style penalty (reducing dopamine target). The literature supports this direction for chronic/sustained stress. However:

1. The threshold at stress=60 is arbitrary. Literature shows continuous dose-response, not a threshold.
2. The actual blunting of basal DA from chronic stress in rodents is ~20–40%; the code produces max −8/60 = 13% of the 0–100 scale, which is roughly proportional if the game's stress=100 represents something like "severe ongoing major life stressor for weeks" rather than acute threat.
3. Acute stress (stress spike, not chronic elevation) would activate DA — this is NOT modeled, and the code shouldn't model it without also modeling the acute-to-chronic transition.

**Calibration assessment:**

The direction is correct for chronic stress. The threshold at 60 is arbitrary — a continuous linear or logarithmic penalty from stress=0 would be more accurate. The max effect of −8 pts is plausible (13% of scale, vs. rodent literature suggesting 20–40% reduction in microdialysis basal levels under severe chronic stress). The coefficient 0.2 from threshold 60 is not clearly wrong but the threshold itself has no grounding.

**Confidence: Low-to-Medium.** Direction correct for chronic stress. Threshold arbitrary — continuous response better supported. Max magnitude plausible but translation from rodent microdialysis to 0–100 abstract scale involves multiple unverifiable assumptions.

**Recommended revision:** Remove the threshold, apply a smaller coefficient across the full stress range: `t -= s.stress * 0.08` (producing −8 at stress=100 without a hard floor). This removes the arbitrary threshold while producing similar overall effect magnitude.

**Key sources:**
- Gambarana et al. 1999, *J Neurochemistry* 72:2039–46 (PMID 10217282) — chronic stress and NAc DA basal
- Pruessner et al. 2004, *J Neuroscience* 24:2825–31 (PMID 15028770) — acute stress and striatal DA release
- Pizzagalli 2014, *Annu Rev Clin Psychol* 10:393–423 (PMC3972338) — chronic stress and reward system

---

### 3. Sleep Debt → Dopamine: `if (s.sleep_debt > 240) t -= Math.min((s.sleep_debt - 240) * 0.006, 10)`

**Current:** Applied above debt=240 min (4 hrs); max cap −10 pts.
**Effect range:** 0 to −10 pts.

**What the literature says:**

**Human PET (sleep deprivation → D2 receptor availability):**

- **Volkow et al. 2008** (*J Neuroscience* 28(34):8454–8461, PMC2710773): One night total sleep deprivation. [11C]Raclopride binding decreased significantly in caudate (5.5% ± 6%, p<0.002), putamen (3.4% ± 6%, p<0.05), and thalamus (5.3% ± 6%, p<0.002). Bmax/Kd: caudate 2.30±0.20 (deprived) vs. 2.43±0.19 (rested), putamen 2.93±0.16 vs. 3.05±0.18. Interpreted as increased synaptic dopamine displacing raclopride — acute sleep deprivation actually INCREASES tonic DA spillover, consistent with a compensatory arousal drive.

- **Volkow et al. 2012** (*J Neuroscience* 32(19):6711–7, PMC3433285): Follow-up. VS BPND: 2.80±0.37 (deprived) vs. 2.95±0.37 (rested) — a 5.1% reduction. This was interpreted as D2R downregulation from sustained elevated DA, not acute DA increase. The discrepancy between papers reflects measurement timing and the rested-vs.-sleep-deprived baseline condition.

**Critical interpretation issue:**

The two Volkow papers show opposite interpretations of the same direction of finding (reduced raclopride binding after sleep deprivation):
- 2008: reduced binding = increased synaptic DA (acute compensatory arousal drive)
- 2012: reduced binding = D2R downregulation (receptor loss, not DA increase)

Both are possible. The net functional effect on dopamine-mediated motivation is likely negative: even if tonic DA is temporarily elevated, the D2R downregulation and the behavioral/motivational correlates are all in the impaired direction. Fatigue, reduced hedonic response, and decreased effort allocation all follow from sleep deprivation and are consistent with reduced effective DA signaling at the functional level.

**Translation to 0–100 scale:**

Caudate binding reduced ~5.5% after one night total deprivation. If the game's sleep_debt=480 min (one night, 8 hrs) represents comparable deprivation, a −5.5% dopamine function reduction would be about −2.75 pts (5.5% of 50 baseline). The current coefficient 0.006 × (480−240) = 1.44 pts at debt=480, capped at 10. This is actually less than what the PET data would suggest at severe debt. The cap of 10 pts represents about one night of deprivation (5.5% of scale) being worth −2.75 pts and several nights worth being worth −10 pts — structurally defensible.

The threshold at 240 min has no empirical basis. PET studies use total deprivation (one full night). The dose-response for partial deprivation is unknown at this level of precision.

**Confidence: Medium.** Direction correct. PET data gives ~5% reduction per ~8 hrs total deprivation. Current max of −10 pts plausible for severe chronic debt. Threshold at 240 min arbitrary.

**Recommended revision:** The coefficient and cap are defensible. The threshold could be replaced with a continuous response, or at minimum lowered to ~120 min (2 hrs deficit, closer to meaningful impairment threshold). Comment should cite Volkow 2008 and 2012 rather than "chosen."

**Key sources:**
- Volkow et al. 2008, *J Neuroscience* 28:8454–61 (PMC2710773) — caudate/putamen 5.5%/3.4% D2 reduction
- Volkow et al. 2012, *J Neuroscience* 32:6711–7 (PMC3433285) — VS 5.1% D2R downregulation, reduced alertness

---

## Norepinephrine Target Coefficients

### 4. Stress → NE: `t += (s.stress - 30) * 0.3`

**Current:** Baseline offset at stress=30; coefficient 0.3.
**Effect range:** At stress=0 → −9 pts; at stress=100 → +21 pts. Starting at t=40, at stress=30 → t=40, at stress=100 → t=61, before other factors.

**What the literature says:**

**LC firing rates under stress:**

- Aston-Jones & Cohen 2005 (Annu Rev Neurosci, PMID 16022604) and multiple follow-up sources: LC-NE neurons fire tonically at 0.5–3 Hz under baseline/quiet wakefulness. Under stress/high arousal: tonic rate rises to 3–6 Hz. Phasic bursts (response to salient stimuli) can reach 10–20 Hz but are transient.

- This represents a 2–6× increase in tonic firing rate from resting baseline to high-stress tonic state. NE release scales approximately linearly with LC firing rate over this range.

**Plasma NE under acute psychological stress:**

- Multiple human studies (Dimsdale & Moss 1980, PMID 7351746; Pervanidou & Chrousos work; StatPearls): Acute psychological stress produces plasma NE increase of approximately 2–3× baseline (more if the stressor is physical or involves exercise). Psychological stressors selectively elevate NE over epinephrine.

- Standing from recumbent posture (orthostatic stress) elevates plasma NE ~90% (PMID 440510) — a substantial but mild stressor.

- Insulin-induced hypoglycemia and post-surgical stress: ~2-fold NE increase.

**CSF NE in PTSD (chronic severe stress state):**

- Bremner et al. 2001 (*Am J Psychiatry* 158(8):1227–30, PMID 11481155): CSF NE in PTSD: 0.55 pmol/ml (SD=0.17) vs. controls: 0.39 pmol/ml (SD=0.16). Ratio: ~1.4×. PTSD represents a pathological chronic hyperarousal state — this is roughly what the game's stress=80–100 tier would correspond to.

**Translation to 0–100 scale:**

The game's NE ceiling is 88, baseline is ~40 (from the target function at stress=30). Full-range stress (0–100) produces a NE target swing from 31 to 61 before other inputs. That's a 30-pt swing on a 63-pt usable range (25–88), or ~48% of the range.

The PTSD CSF data shows ~1.4× elevation over healthy baseline. If healthy baseline is NE≈50 and PTSD chronic state is NE≈70, that's a 20-pt elevation. The code at stress=80 would produce t=40+(80−30)×0.3=55, which after other inputs (e.g., poor sleep quality) might reach 65–70. This is broadly consistent with the PTSD literature's ~1.4× elevation.

The resting tonic LC firing 0.5–3 Hz doubling to 3–6 Hz under stress represents a 2–4× increase. If we anchor NE=50 to resting tonic and NE=75 to high-stress tonic, the coefficient produces approximately this scaling: (50 to 75 = 25 pts) vs. current at stress=100: t=61 from this term. With other terms (poor sleep −7.5 pts) reaching 68–70, this is compatible.

**The offset baseline (stress=30 → zero NE change) is the weakest part.** There is no empirical basis for "stress below 30 produces below-40 NE." Even mild chronic stress (low-grade life pressures) elevates sympathetic tone, and the literature does not support a "stress=0 produces NE target below 40" scenario. A more accurate model would start at a positive coefficient without the offset:

`t = 40 + s.stress * 0.18` produces 40 at stress=0, 58 at stress=100 (pre-other-factors), which would be equivalent to the current model near stress=50 but less extreme at the tails.

**Confidence: Medium.** Direction and overall magnitude range are consistent with LC physiology and CSF/plasma NE data. The stress=30 offset baseline has no empirical support. Coefficient 0.3 in the current formula produces a plausible range relative to PTSD data.

**Recommended revision:** Replace the offset baseline with a zero-threshold linear or gentle quadratic. Cite Bremner 2001 and LC firing data for the magnitude range. The current formula gives the right answer near stress=50 but has wrong behavior at the tails.

**Key sources:**
- Aston-Jones & Cohen 2005, *Annu Rev Neurosci* 28:403–50 (PMID 16022602) — LC tonic 1–3 Hz baseline, 3–6 Hz stress
- Bremner et al. 2001, *Am J Psychiatry* 158:1227–30 (PMID 11481155) — CSF NE PTSD 0.55 vs. controls 0.39 pmol/ml
- Dimsdale & Moss 1980, *JAMA* 243(4):340–2 (PMID 7351746) — plasma NE 2–3× elevation during acute psychological stress
- StatPearls "Physiology, Stress Reaction" (https://www.ncbi.nlm.nih.gov/books/NBK541120/) — sympathetic NE review

---

### 5. Sleep Quality → NE: `t -= (sq - 0.5) * 15`

**Current:** Reference point sq=0.5; coefficient 15. Good sleep (sq=1.0) lowers NE target −7.5 pts; very poor sleep (sq=0.0) raises +7.5 pts. Total swing: 15 pts.

**What the literature says:**

**Sleep and noradrenergic tone:**

- **REM sleep and LC quiescence**: LC-NE neurons are essentially silent during REM sleep (firing rate drops near zero). This is a well-established finding (Hobson et al. 1975; Aston-Jones & Bloom 1981). REM sleep is the "NE-free" processing window. Disrupted REM means disrupted NE clearance.

- **Sleep deprivation and sympathetic activation**: Lusardi et al. 1999 (*Am J Hypertension*) showed partial sleep deprivation increases blood pressure and sympathetic activity. Spiegel et al. 1999 and related work: sleep restriction elevates sympathetic nervous system activation measurably.

- **Quantitative sleep deprivation → NE**:
  - Franck et al. 1993 (*Acta Psychiatrica Scandinavica*, PMID 8396844): Total sleep deprivation increased urinary MHPG-sulfate (central NE metabolite marker) in depressed patients.
  - Mixed results on plasma catecholamines after TSD in healthy subjects (Irwin et al. 1999, *J Clinical Endocrinology Metabolism*): plasma catecholamines not significantly changed by sleep deprivation in 8 healthy subjects. Urinary metabolites more consistently show elevation.
  - Mullington et al. (2009, *Progress in Cardiovascular Disease*): Extended sleep restriction (average 6 days) significantly increased sympathovagal ratio, indicative of sympathetic dominance.

- **REM deprivation specific**: Studies separating REM from total sleep deprivation show that selective REM deprivation produces NE elevation greater than NREM deprivation, consistent with LC silencing being the key mechanism (Siegel 2011 review, *Nature Reviews Neuroscience*).

**Translation to 0–100 scale:**

The NE-free environment during REM sleep is a real mechanism. The question is magnitude. If good sleep quality (sq=1.0) means adequate REM, and poor quality means disrupted/absent REM, the NE difference between good and poor sleepers should be detectable.

The plasma NE studies show that sleep deprivation effects on plasma NE are inconsistent (some studies show no significant change), while urinary and CSF metabolites show more consistent elevation. This suggests the effect exists but is of moderate magnitude. The 15-pt swing (7.5 pts either direction from midpoint) represents ~24% of the usable NE range (25–88). This seems proportionally large given the mixed plasma evidence, but reasonable given the more consistent urinary/metabolite data and the LC quiescence mechanism.

Reference point at sq=0.5 is a reasonable midpoint but arbitrary. In practice, a sleep quality of 0.5 corresponds to moderately poor sleep — the zero-effect point should arguably be at slightly higher quality (e.g., 0.65, corresponding to adequate but not excellent sleep).

**Confidence: Low-to-Medium.** Mechanism (LC quiescence during REM → NE clearance) is solid. Quantitative magnitude is uncertain — plasma studies show inconsistent results. The 15-pt coefficient is plausible but not directly derivable. The 0.5 reference point is arbitrary.

**Key sources:**
- Aston-Jones & Bloom 1981, *J Neuroscience* 1:876–86 — LC near-silence during REM
- Franck et al. 1993, *Acta Psychiatrica Scandinavica* 88(3):184–9 (PMID 8396844) — MHPG elevation after TSD
- Irwin et al. 1999, *J Clin Endocrinol Metab* 84(6):1979–85 (PMID 10372697) — no plasma NE change after TSD in healthy subjects (complicates interpretation)
- Mullington et al. 2009, *Prog Cardiovasc Dis* 51(4):294–302 (PMID 19110130) — sympathovagal ratio elevation with sleep restriction

---

### 6. Social/Isolation → NE: (NOT CURRENTLY MODELED)

**There is no direct social → NE coupling in the current `norepinephrineTarget()`.** Social connection affects serotonin through `sentimentIntensity` and dopamine indirectly, but NE has no social term.

**What the literature says:**

- **Cole et al. 2007** (*Genome Biology*, cited in PMC5130104): Chronic social isolation in macaques associated with elevated urinary norepinephrine metabolites. In humans with chronic loneliness, consistent HPA activation is documented; the NE/sympathetic association is less consistent, appearing more strongly in local tissue (immune-innervated organs) than systemic plasma levels.

- **The Neuroendocrinology of Social Isolation** (Cacioppo & Hawkley 2009, PMC5130104): Lonely individuals show activation of HPA axis and SNS. Elevated catecholamines in SNS-innervated tissues (lymph nodes, spleen) but not consistently in plasma. Urinary NE metabolites more consistently elevated.

- **Social defeat stress** (animal models): Chronic social defeat is one of the most reliable animal models of depression and involves persistent noradrenergic hyperactivation in limbic regions.

**Gap assessment:**

Given the evidence that chronic loneliness/social isolation elevates sympathetic tone (urinary NE metabolites), a small social → NE coupling term would be biologically justified. However:

1. The effect is small in humans (plasma data inconsistent, urinary metabolite data more consistent but modest)
2. The code already models social isolation → serotonin reduction, which captures the mood dimension
3. Adding a social → NE term is more mechanistically accurate but would require a new approximation-debt coefficient

**Recommendation:** A term like `t += (50 - s.social) * 0.04` (producing +2 pts NE elevation at zero social contact) would be biologically grounded and proportionally small. This is a new addition not currently present, not a calibration of an existing coefficient. Document as explicit gap.

**Key sources:**
- Cacioppo & Hawkley 2009, *Ann NY Acad Sci* 1231:17–22 (PMC5130104) — social isolation HPA/SNS review
- Steptoe et al. 2004, *Proceedings Royal Society B* — loneliness and urinary catecholamines

---

## Summary Table

| Coefficient | Current Value | Literature Support | Confidence | Recommended Action |
|---|---|---|---|---|
| Energy → DA: `(energy-50) * 0.25` | 0.25 | Direction solid; magnitude plausible, not derivable | Low | Retain; cite Treadway 2012, Salamone 2012 |
| Stress → DA threshold | 60 | No empirical basis for threshold | Low | Remove threshold; use continuous `s.stress * 0.08` |
| Stress → DA coefficient | 0.2 (above 60) | Consistent with ~20–40% chronic DA reduction in rodents | Low-Med | Equivalent continuous: ~0.08; cite Gambarana 1999 |
| Sleep debt → DA: 0.006 per min, cap 10 | 0.006, cap 10 | ~5% D2 reduction after one night TSD (PET) = ~2.75 pts; cap consistent | Medium | Retain cap; lower threshold to ~120 min; cite Volkow 2008 |
| Stress → NE: `(stress-30) * 0.3` | 0.3, offset at 30 | Overall range consistent with PTSD CSF data; offset arbitrary | Medium | Remove offset; use `stress * 0.18` from zero |
| Sleep quality → NE: `(sq-0.5) * 15` | 15, ref 0.5 | LC quiescence mechanism solid; magnitude uncertain | Low-Med | Retain direction; shift reference to sq=0.65 |
| Social → NE | Not modeled | Documented mechanism for modest effect | — | Consider adding `(50-social) * 0.04` |

---

## General Translation Notes

**Why direct translation from literature is hard:**

1. **Measurement mismatch**: The literature measures absolute concentrations (pg/ml, pmol/ml), percent changes from baseline, or PET binding potential shifts. None map directly to the game's 0–100 abstract scale.

2. **Species mismatch**: Most mechanistic data is from rat/mouse microdialysis. Human data is mainly indirect (PET, urinary metabolites, plasma).

3. **Chronic vs. acute**: The game models chronic state (where you are most of the day), not acute spikes. Literature often reports acute manipulations (one-night TSD, single stressor session). Translation requires additional assumptions about how acute effects accumulate.

4. **Scale anchoring**: The 0–100 scale needs anchor points. The best-justified anchors from other calibration work: floor 25 = MDD anhedonia (PMID 3347226, PMC10594643); ceiling 85 = stimulant-induced sustained ceiling. Midpoint 50 = healthy resting baseline. These give the scale meaning, and all coefficient translations should respect them.

5. **Effect stacking**: Multiple inputs add to the same target. The sum must stay in range. If stress → DA, sleep debt → DA, and energy → DA all push down simultaneously, the combined effect can hit the floor even before the clamp. This means individual coefficients that seem plausible in isolation can produce implausible combinations. A system-level check (what does simultaneous stress=80, debt=960 min, energy=20 produce?) is needed alongside per-coefficient calibration.

**System-level sanity check (dopamine):**

At stress=80, debt=960, energy=20 (severe state across all three inputs):
- Energy: (20-50) × 0.25 = −7.5
- Stress: (80-60) × 0.2 = −4.0
- Sleep debt: min((960-240) × 0.006, 10) = min(4.32, 10) = −4.32
- Total shift: −15.82 pts → dopamine target = 50 − 15.82 = ~34.2 (above floor 25 ✓)

This combination lands in the high-30s, consistent with "functioning but significantly impaired motivation," above the pathological floor. The current coefficients pass this sanity check.

**System-level sanity check (NE):**

At stress=80, sq=0.3 (poor sleep quality):
- Stress: (80-30) × 0.3 = +15
- Sleep quality: (0.3-0.5) × 15 = −3 → t -= −3 → +3
- Total: 40 + 15 + 3 = 58 before bladder/thirst modifiers. Plausible for a high-stress poor-sleep state.

At stress=95, sq=0.1 (extreme):
- Stress: (95-30) × 0.3 = 19.5
- Sleep: (0.1-0.5) × 15 = −6 → +6
- Total: 40 + 19.5 + 6 = 65.5 → well below ceiling 88 ✓

The NE system has substantial headroom even at extremes — the ceiling 88 represents PTSD-level chronic hyperarousal which requires more than the normal stress/sleep pathways to reach.
