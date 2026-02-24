# Hormones and Mood: Research Summary

Research compiled for simulation design. For each finding: what the evidence shows, how strong it is, and what it means for modeling. This is reference material, not a design document.

*Citation status: Complete pass 2026-02-20. All major quantitative claims have PMIDs or source identifiers. Notable accuracy corrections applied: first-trimester estradiol (upper-quartile issue), D-MER "2007" date, Mirena initial serum level, sublingual E2 immunoassay artifact, TC trough range, testosterone enanthate half-life uncertainty, 21.9% mood fluctuation attribution, and others documented inline.*

---

## Part 1: The Menstrual Cycle

### Quantitative Hormone Levels (typical 28-day cycle)

- **Estradiol**: Early follicular ~20–80 pg/mL; pre-ovulatory peak ~200–400 pg/mL (~8-fold rise); mid-luteal ~100–160 pg/mL; premenstrual decline back toward follicular. (Stricker et al. 2006, PMID 16776638; Anckaert et al. 2021, PMID 33869706 — note: exact bounds vary by assay platform)
- **Progesterone**: Follicular <1 ng/mL; mid-luteal peak 11–29 ng/mL (Stricker et al. 2006, PMID 16776638; range varies by assay — Anckaert et al. 2021 reports median ~9 ng/mL, 95th percentile ~15 ng/mL); premenstrual rapid decline.
- **LH**: Low throughout; pre-ovulatory surge lasting 24–48 hours. Estradiol must exceed ~200 pg/mL for ~50 hours to trigger positive feedback LH surge (Hoff, Quigley & Yen 1983, PMID 6411753).

### Phase-by-Phase Mechanisms

**Early follicular (days 1-7):** Both estradiol and progesterone at nadir. The withdrawal from the previous cycle's progesterone/allopregnanolone is mostly complete. Serotonergic tone lower with low estradiol (estradiol upregulates serotonin synthesis, increases 5-HT2A receptor density, reduces serotonin reuptake). Dopamine synthesis also lower. Despite low levels, mood tends to *improve* during this phase as premenstrual withdrawal resolves. "Clean slate" feeling.

**Late follicular (days 8-13):** Estradiol rises steeply toward ~200-400 pg/mL. Highest estradiol-to-progesterone ratio. Estradiol drives serotonin receptor upregulation, dopamine synthesis increase, and prefrontal cortex dopamine system enhancement. Many women report best mood of the cycle. However: a 2025 meta-analysis (102 articles, N=3,943; Jang, Zhang & Elfenbein 2025, PMID 40096188) found "no systematic robust evidence for significant cycle shifts in *cognitive* performance" — mood effects and cognitive effects are separable.

**Ovulation (days 13-15):** Estradiol must exceed ~200 pg/mL for ~50 hours to trigger the positive feedback mechanism. Sustained high estradiol switches hypothalamic signaling, triggering GnRH surge → LH surge → ovulation ~36 hours later. Progesterone begins a small rise even before the LH surge (acts on kisspeptin neurons). Maximum serotonergic and dopaminergic tone.

**Luteal phase (days 15-24):** Progesterone rises to 11-29 ng/mL. Estradiol has secondary smaller peak. The key mechanism:

1. Progesterone → 5-alpha-reductase → 5-alpha-dihydroprogesterone → 3-alpha-HSD → **allopregnanolone (ALLO)**
2. ALLO is a potent positive allosteric modulator of the **GABA-A receptor** (same site as benzodiazepines but different binding location)
3. At sustained high concentrations, ALLO is anxiolytic and sedating
4. ALLO also suppresses CRH, dampening the HPA (stress) axis

For most women, early-to-mid luteal is relatively stable. The GABAergic sedation manifests as subtle calming or mild fatigue.

**Premenstrual phase (days 25-28) — the withdrawal mechanism:**

The DROP matters more than the level. The mechanism is pharmacologically analogous to benzodiazepine withdrawal:

1. During luteal phase, sustained ALLO exposure causes GABA-A receptor adaptation — upregulation of the **alpha-4 subunit**, forming receptors with reduced ALLO sensitivity
2. When ALLO drops rapidly, these adapted receptors haven't reverted — **relative GABAergic deficit**
3. Simultaneous estradiol drop reduces serotonergic and dopaminergic tone
4. Result: irritability, anxiety, emotional reactivity, depressed mood (3-5 days before menstruation)
5. Resolves after menstruation begins as hormone levels stabilize at new low

Women are at low hormone levels during early follicular phase *without* premenstrual symptoms — because there's no withdrawal happening. The rate of change matters, not the absolute level.

**Evidence strength: strong.** ALLO/GABA-A withdrawal mechanism well-replicated. Confirmed by pharmacological studies (blocking ALLO production with 5-alpha-reductase inhibitor reduces PMDD symptoms — Martinez et al. 2016, PMID 26272051).

### PMDD — Altered Receptor Sensitivity, Not Altered Hormones

Prevalence: PMS ~30–40% (Direkvand-Moghadam et al. 2014, PMID 24701496 — pooled 47.8% but CI 32.6–62.9%; strict-criteria studies tend toward 30–40%); PMDD (severe, predominantly mood) ~3.2% (95% CI: 1.7–5.9%) (Reilly et al. 2024, PMID 38199397, n=50,659).

**The key finding: women with PMDD have normal hormone levels.** The difference is at the receptor:

- **Paradoxical ALLO response**: healthy women experience sedation from ALLO in the luteal phase; PMDD women do not. Conversely, PMDD women show sedation to ALLO in the follicular phase. The response is inverted. (Timby et al. 2016, PMID 26960697)
- **Impaired subunit adaptation**: lower delta GABA-A receptor subunit expression during luteal phase. Receptors cannot properly adjust to fluctuating neurosteroid levels. (Gideon et al. 2025, PMID 40701967 — note: this measures peripheral blood mononuclear cells, not CNS tissue; no human CNS delta subunit measurement exists yet)
- **Concentration-dependent inversion**: ALLO may have an inverted U-shaped relationship with symptoms — beneficial at very low and very high concentrations, paradoxically anxiety-promoting at intermediate (endogenous luteal) levels in susceptible women.
- **Genetic component**: ESC/E(Z) gene complex (epigenetic regulation of gene expression in response to sex hormones) implicated. (Dubey et al. 2017, PMID 28044059)

Therapeutic confirmation: brexanolone (synthetic ALLO at pharmacological doses) and zuranolone (oral GABA-A modulator, FDA approved 2023) are effective, working by providing stable high-level GABA-A modulation that overrides dysfunctional receptor response.

**Evidence strength: strong.** Convergent evidence from pharmacological challenge, neuroimaging, receptor expression, treatment outcomes. Leading mechanistic model.

---

## Part 2: Pregnancy

### First Trimester (weeks 1-13)

- hCG rises rapidly in early pregnancy (clinical teaching: "doubles every 48–72 hours" — strictly 48h only in the fastest-rising phase; some primary sources say ~24h for first 8 weeks), peaks weeks 7–12. Peak ~100,000 mIU/mL is within normal range but toward the high end; median peak is ~50,000–80,000 mIU/mL. (Betz & Fane StatPearls, PMID 30422545; more precise distribution: Barnhart et al. 2004, PMID unverified) Has structural similarity to TSH — weakly stimulates thyroid, causing mild gestational thyrotoxicosis (irritability, anxiety, nausea correlating with hCG peak).
- Progesterone rises through first trimester. Soldin et al. 2005 (isotope dilution mass spectrometry, PMID 16169406) reports week-12 mean ~17.5 ng/mL, range 7.4–35 ng/mL. The often-cited "10–44 ng/mL" range appears in aggregated clinical reference compilations (multiple assay methods); 44 ng/mL is the upper bound of the compiled range, not the Soldin primary measurement. ALLO-mediated GABA-A sedation: significant fatigue, somnolence.
- Estradiol rising but modest. Soldin 2005 reports week-12 mean ~870 pg/mL, range 310–3,000 pg/mL. The "~3,000–4,000 pg/mL by end of first trimester" figure represents the upper quartile, not a representative central value. The often-cited "20–30x normal cycle peak" multiplier is overstated for typical values — ~3–10x more accurate for the mean, ~10–20x plausible at the upper end of the distribution.
- Emotional lability from rapid hormonal changes + nausea + exhaustion.

### Second Trimester (weeks 14-27)

Often the "honeymoon trimester." hCG declining, body adapting to progesterone. High stable estradiol provides sustained serotonergic/dopaminergic support. High stable ALLO provides sustained GABAergic tone without withdrawal fluctuations. Brain structural changes begin — widespread gray matter volume reductions (synaptic refinement, not pathological loss). Pritschet et al. 2024 *Nature Neuroscience* (PMID 39284962) demonstrated this via intensive longitudinal single-subject design. The "94% of cortex" figure specifically is from Servin-Barthet et al. 2025 *Nature Communications* (PMID 39820539, n=110), a larger cohort study reporting a U-shaped GM trajectory affecting 94% of the cortex. Cognitive function between first and second trimester actually *improves*.

### Third Trimester (weeks 28-40)

Peak everything. Progesterone ~150 ng/mL near-term (Bloch et al. 2000, PMID 10831472; Soldin 2005 week-32 mean ~70 ng/mL, rising further to term). Estradiol 5,000–15,000+ pg/mL near-term (Soldin 2005 week-32 range 2,170–13,850 pg/mL; Bloch 2000 states ~15,000 pg/mL at delivery). 50–100x normal cycle: at 15,000 pg/mL vs. ~300 pg/mL cycle peak, ~50x — plausible at the high end. Prolactin 10x higher. Cortisol significantly elevated (physiological hypercortisolism). Physical discomfort increasingly dominates.

**Nesting** peaks in third trimester: driven by rising prolactin and increasing estrogen-to-progesterone ratio. Blocking prolactin reduces nesting in animal models. Oxytocin rise correlates with cessation of nesting and onset of labor/caregiving.

### Postpartum Crash

The most dramatic hormone withdrawal in normal human physiology:
- **Estradiol and progesterone drop ~90% within hours to days of delivery** (placenta removal). For estradiol, ~90% drop within 24 hours is supported by measurement data (Yuen et al. 1973, PMID 4720529; Bloch et al. 2000, PMID 10831472). For progesterone, follicular-phase levels are reached in 2–3 days, not strictly 24h (PMID 4720529).
- Fall from 50–100x normal levels to below-normal in hours to days
- ALLO drops in parallel — same GABA-A withdrawal mechanism as premenstrual, but at enormously greater magnitude

**Baby blues**: 50–80% of women, first 1–2 weeks. Note: individual study estimates range 13–76%; the meta-analytic pooled estimate is 39% (Rezaie-Keikhaie et al. 2020, PMID 32035973, n=5,667 across 26 studies). The 50–80% figure reflects the published range of individual studies and appears widely in review articles. Onset typically day 3–5, resolution by day 10–14. Transient tearfulness, mood lability, irritability. Resolves as hormones stabilize.

**Postpartum depression**: 10–19%, typically developing over first 3 months (Gavin et al. 2005, PMID 16260528). Mechanism: massive ALLO withdrawal (same as PMDD but at far greater scale) + serotonergic deficit from estradiol crash + HPA axis dysregulation + neuroinflammation. Confirmed by brexanolone/zuranolone efficacy. Prior depression is strongest predictor (prevalence ratio 4.03 for postpartum depressive symptoms at 9–10 months; Bauman et al. 2023, PMID 37943725 — note: this study measures PDS at 9–10 months postpartum, not clinical PPD diagnosis within standard 4–6 week window; O'Hara & Swain 1996 and Robertson 2004, PMID 15151709, provide broader meta-analytic evidence for prior depression as strongest predictor).

**Evidence strength: strong.** Hormone crash timeline well-quantified. PPD mechanism confirmed by treatment response.

---

## Part 3: Lactation

### Hormonal Profile During Breastfeeding

A unique hormonal state unlike any cycle phase:
- Estrogen and progesterone suppressed below follicular levels (as long as regular suckling continues)
- Prolactin elevated (10x pre-pregnancy baseline) — promotes well-being, calmness, suppresses HPA axis
- Oxytocin released in pulses during suckling — anxiolytic, lowers cortisol, activates reward system (dopaminergic)
- Prolactin inhibits GnRH pulsatility → menstrual cycle suppressed (lactational amenorrhea, typically 6–9 months with sustained exclusive breastfeeding; WHO multinational study, n=4,118, PMID 9757873)

Net effect: low estrogen (reduced serotonergic support) counterbalanced by prolactin/oxytocin mood benefits. Varies by individual.

### D-MER (Dysphoric Milk Ejection Reflex)

Prevalence ~9.1% (Ureño et al. 2019, PMID 31393168 — prospective study of breastfeeding women at 6–8 week postpartum visit). Sudden dysphoria, dread, or anxiety beginning just *before* letdown, lasting <5 minutes.

Mechanism (plausible but unconfirmed): prolactin surge requires dopamine drop; in D-MER, the dopamine drop is more abrupt/deeper than normal, producing brief dopaminergic deficit → dysphoria. Timing matches: symptoms onset just before letdown (dopamine drops to allow prolactin), resolve in minutes (dopamine recovers).

**Evidence strength: plausible mechanism, no direct measurement.** Named by lactation consultant Alia Heise in 2007 (not peer-reviewed); first peer-reviewed publication 2011 (Heise & Wiessinger, *International Breastfeeding Journal*, PMID 21645333).

### Weaning as Withdrawal

- Prolactin drops (losing calming/well-being effects)
- Oxytocin pulses cease (losing anxiolytic and reward activation)
- Estrogen rises as suppression lifts, triggering cycle return
- ALLO may fluctuate with cycle return

Post-weaning depression is clinically recognized. Gradual weaning produces milder symptoms than abrupt.

**Evidence strength: clinically recognized, mechanistically inferred, under-researched.**

---

## Part 4: Male Hormonal Patterns

### Testosterone Diurnal Rhythm

- Peaks 5:30–8:00 AM, nadir ~7–8 PM
- Young men: morning levels ~25–50% higher than evening (Brambilla et al. 2009, PMID 19088162; Diver et al. 2003, PMID 12780747). Some individuals show larger amplitude; a 63% drop has been reported in a single-subject precision neuroimaging study (Grotzinger et al. 2024, PMID 38627091 — n=1, caveat applies).
- Amplitude diminishes with age (older men show blunted/absent rhythm)
- Driven by sleep-entrained pulsatile GnRH/LH secretion

### Mechanism of Emotional Effect

- **Amygdala**: testosterone increases reactivity to threatening social stimuli (angry faces), biases toward social threat approach rather than avoidance
- **Prefrontal cortex**: testosterone reduces prefrontal-amygdala coupling — reduced top-down emotional control
- **Net effect**: heightened emotional reactivity to social challenge with reduced inhibitory control. Context-dependent — increases status-relevant emotional action, not blanket aggression
- Effect sizes moderate (r ~0.14-0.20 for behavioral correlations; neuroimaging effects more robust)

### Dual Hormone Hypothesis (testosterone × cortisol)

High testosterone is associated with status-seeking behavior **only when cortisol is low**. When cortisol is high, testosterone-dominance relationship weakens or reverses. Refined version (2020): testosterone promotes status-seeking under low cortisol, status-loss-avoidance under high cortisol (Knight et al. 2020, PMID 31863735). Interaction effect appears larger in males than females, though this sex difference is a directional trend with limited power, not a robustly established finding (Dekkers et al. 2019 meta-analysis, 33 studies n=8,538, PMID 30529754).

**Evidence strength: moderate.** Well-established conceptually, some inconsistency across studies.

### Age-Related Decline (Andropause)

~1%/year decline starting ~30–40. By 80, total testosterone ~35% lower, free testosterone ~50% lower (SHBG increases). (Harman et al. 2001 Baltimore Longitudinal Study, PMID 11158037; Feldman et al. 2002 Massachusetts Male Aging Study, PMID 11836290 — longitudinal rate ~1.6%/yr total T; cross-sectional ~0.8%/yr.) Mood effects: decreased vitality, depressed mood, irritability, reduced motivation, sleep disturbance, reduced confidence. Testosterone-depression association is moderate and contested — replacement therapy shows inconsistent mood effects in meta-analyses.

### Male Hormonal Cycles Beyond Diurnal

- Ultradian (~90-120 min pulsatile secretion): well-established
- Infradian proposals (~4-day, ~20-day, ~30-day): **weak, inconsistent, unreplicated**
- Seasonal variation: contradictory across studies, not clinically significant even when detected
- Only the diurnal rhythm has robust evidence and plausible mood implications

---

## Part 5: Contraception and Mood

### Combined Oral Contraceptives (COCs)

**Mechanism of suppression**: synthetic estrogen (ethinyl estradiol) + progestin suppress HPO axis. Endogenous estradiol drops to ~20–30 pg/mL (early follicular/near-menopausal range). Endogenous progesterone stays low (no ovulation). Free testosterone decreases substantially (SHBG increases 2–4x; SHBG elevation persists after discontinuation — Panzer et al. 2006, PMID 16409223: SHBG still elevated at >120 days post-cessation vs. never-users).

**Pill-free week**: a monthly withdrawal event with measurable mood effects. A 2023 JAMA Network Open study (n=181; Ramler et al. 2023, PMID 37755829, PMC 10534273) found 12.67% increase in negative affect, 7.42% increase in anxiety, 23.61% increase in mental health symptoms during pill pause vs active phase. More pronounced in women with higher baseline depression (BDI >8: 17.95% increase in negative affect). Continuous use eliminates this.

**Progestin types**: androgenic (levonorgestrel) vs anti-androgenic (drospirenone) — theoretical mood difference is plausible but **not clearly demonstrated** in high-quality trials. Network meta-analysis of RCTs found no difference.

**The Danish registry study (Skovlund et al. 2016, PMID 27680324)**: 1M+ women. COC users RR 1.23 for antidepressant use; progestin-only RR 1.34; patch RR 2.0; ring RR 1.6; LNG-IUD RR 1.4. Adolescents more vulnerable (COC RR 1.8). **However**: observational (not causal), antidepressant prescription as proxy is imperfect, survivorship bias. Swedish replication (Lundin et al. 2022, PMID 34837324, n=739,585) found **no association** for COCs specifically (RR 0.89 after adjustment); non-oral methods (patch, ring, DMPA, implant) showed increased risk.

**RCT vs observational discrepancy**: RCTs generally find no difference between COC and placebo for depression. Possible explanations: RCTs are short, exclude psychiatric history, dilute a vulnerable subpopulation signal.

**Neurobiological mechanism**: COCs suppress endogenous progesterone → suppress allopregnanolone production → reduced GABAergic tone. But ALLO has biphasic effects (moderate levels can *inhibit* GABA-A), so some women feel better on the pill by escaping paradoxical inhibitory effects of their own luteal ALLO.

**Starting/stopping**: 1-3 month adjustment both ways. 80% regain hormonal balance within 3 months of stopping.

### Depo-Provera (DMPA)

150mg IM injection every 12–13 weeks. Completely suppresses HPO axis. Creates **hypoestrogenic state** (~50 pg/mL estradiol mean in long-term users, range 10–92 pg/mL — low enough to cause bone density loss; Mishell 1996, PMID 8725700). Cannot be reversed once injected.

Mood reputation exceeds evidence. FDA lists depression as side effect (1-5%). But prospective studies found depression scores *dropped* among continuing users. Survivorship bias is the likely explanation (mood-affected women discontinue). The irreversibility (3-month duration) is the real risk — if it goes badly, you wait.

**Evidence strength: genuinely mixed.** Strongest evidence for a vulnerable subpopulation, not population-level effect.

### Hormonal Implant (Nexplanon)

Etonogestrel rod, 3 years. Burst-and-taper: peak ~813 pg/mL at day 4, declining to ~200 pg/mL at steady state, ~156 pg/mL by year 3 (~5x higher initially than end-of-life). (Bennink 2000, PMID 11246602 — PK data for Implanon, same active ingredient as Nexplanon.)

**Evidence strength for mood: poor.** Sparse literature, low methodological quality. Critical review concluded it was "impossible to draw firm conclusions."

### Hormonal IUD

Levonorgestrel, local delivery. Mirena (52mg) releases ~20 mcg/day initially, declining to ~11 mcg/day at 5 years, ~7 mcg/day at 8 years (FDA Mirena label NDA 021225). Serum LNG peak ~180 pg/mL within 2 weeks (FDA label; note: a previously cited figure of "260 pg/mL initially" is not supported by FDA prescribing information — flag as inaccurate). At 1 year ~130–150 pg/mL (PMID 22402256). Most users still ovulate (partial cycle preserved).

**Dose-response signal**: higher-dose Mirena associated with significantly higher depression risk than lower-dose Kyleena/Skyla. This dose-response relationship supports a causal interpretation. Danish registry RR 1.4. Swedish cohort found 57% increased depression risk, greatest in adolescents.

**Evidence strength: moderate and growing.** The dose-response is the strongest piece of evidence.

### Emergency Contraception

**Plan B (levonorgestrel 1.5mg)**: massive single progestin dose (~10-20x steady-state mini-pill levels). Peak at 12.3 ng/mL, half-life ~24-32 hours, cleared in ~5-6 days. Mood effects essentially **unstudied** — almost no formal research. Any effects would be transient (days). Context of needing EC is a major confounder.

**Ella (ulipristal acetate)**: selective progesterone receptor modulator — *blocks* progesterone rather than adding it. Peak ~176 ng/mL at 1 hour, half-life ~32 hours. Mood effects unstudied beyond incidence rates in clinical trials (0.1-1% emotional disorder/anxiety). Different mechanism than Plan B.

### Copper IUD (non-hormonal control)

No hormones. Full natural cycle preserved. Not linked to increased depression in any major study. Ideal comparison group for hormonal method mood studies.

### Cross-Cutting Findings

- **Adolescents are more vulnerable** to mood effects (consistent across studies)
- **A vulnerable subpopulation exists** — prior HC-related mood symptoms predict recurrence (replicated in placebo-controlled RCTs)
- **Starting and stopping** any hormonal method: 1-3 month adjustment
- **Individual variation is enormous** — same method improves mood in one person, worsens in another
- **Prior vulnerability** (mood disorders, prior HC mood symptoms, adolescence) is the best predictor

---

## Part 6: HRT Delivery Methods

### Estrogen

#### Oral Estradiol

First-pass liver metabolism — only 2-10% bioavailability. Peak ~6-8 hours. Fluctuation index 3.68 (high). Estrone:estradiol ratio ~3-5:1 (unphysiological — liver sees high load, systemic estradiol modest). Daily peak-trough oscillation. Some patients feel "wearing off" before next dose.

#### Transdermal Patches

Bypasses liver. Fluctuation index 0.65 (remarkably stable). Near-physiological estrone:estradiol ratio (~1:1). Typically twice-weekly changes. Most stable non-implant method. Skin irritation at application site.

#### Estradiol Valerate Injection

Peak ~2.1 days. Half-life ~3.0 days (primary PK data: Oriowo et al. 1980, PMID 7389356; specific peak-day and half-life values are modeled from the ester PK, not directly measured in a single trial). **Most pronounced rollercoaster** of injectable esters. Biweekly schedule: substantial peak-trough. Weekly dosing recommended (trough ~142 pg/mL; Sloan et al. 2024, PMID 39735380, median trough ~146 pg/mL at weekly 4mg dosing).

#### Estradiol Cypionate Injection

Peak ~4.3 days. Half-life ~6.7 days (Oriowo et al. 1980, PMID 7389356 for ester comparison; note: published half-life estimates for estradiol cypionate from primary studies are typically 8–10 days, e.g. Cyclofem data PMID 23265980; the "6.7 days" figure appears to derive from secondary curve-fitting rather than a directly measured primary result). Gentler rise, later peak, slower decline. Weekly dosing trough ~262 pg/mL (modeled estimate; Oriowo 1980 and Cyclofem PK data are the primary references). Significantly smoother than valerate. Patients commonly report less emotional volatility.

#### IM vs SubQ

Minimal pharmacokinetic difference for estradiol esters. SubQ may be slightly more stable (adipose blood flow less variable than muscle). SubQ less painful, smaller needles, easier self-administration.

#### The Injection-Cycle Mood Pattern

"Peak euphoria, trough dysphoria" — pharmacokinetically plausible (2-4x level swings), widely reported in trans communities, acknowledged in UCSF guidelines. Not formally studied in controlled trials. Most pronounced with valerate biweekly, minimal with cypionate weekly. Individual sensitivity varies enormously.

#### Subcutaneous Pellets

Most stable method. After initial 1-2 week peak, sustained plateau for 4-6 months. Near-physiological estrone:estradiol ratio. Cannot adjust dose once implanted. Requires minor procedure.

#### Sublingual/Buccal

Peak ~1 hour (dramatically fast). The often-cited figures of ~450 pg/mL at 1h → ~85 pg/mL by 3h correspond to a **1 mg** sublingual dose (not 0.5 mg). Primary citation: Burnier et al. 1981, PMID 6786097 — established rapid peak ~1–2h and fast decline. Accuracy caveat: Burnier used immunoassay, which overestimates estradiol due to estrone cross-reactivity; modern LC-MS/MS study (Doll et al. 2022, PMID 34781041) measured ~144 pg/mL peak for 1 mg sublingual in transgender women — the 450 pg/mL figure likely reflects assay artifact. Qualitative pattern (fast spike, sawtooth with multiple daily doses) remains accurate. Bypasses first pass partially. Higher bioavailability than oral (~1.8x AUC). Some prefer "feeling it kick in"; others find instability distressing.

### Testosterone

#### Testosterone Cypionate Injection

Peak 4–5 days. Half-life 7–8 days. 200mg biweekly: supraphysiological peak (~1,112 ng/dL; consistent with PK modeling, Pastuszak 2022 PMC9293229 and Bhasin 2018 guideline PMID 29562364 — specific value is modeled), trough typically sub-physiological and often below 300 ng/dL in many patients (PMC5182226; literature describes troughs as "sub-physiologic levels 4–6 days prior to next injection"). The "~400 ng/dL" figure is at the upper bound of the reported range; some PK modeling gives ~350–435 ng/dL (PMC5915615) but real-world studies often find troughs closer to 200–350 ng/dL with significant inter-individual variation. **Weekly dosing increasingly standard** for mood stability. At peak: possible irritability, agitation, anger-hostility. At trough: fatigue, low mood, decreased motivation. Both high and low testosterone produce irritability but different quality — peak = aggressive/short-fused, trough = fatigued/depleted.

#### Testosterone Enanthate Injection

Peak 36–48 hours (earlier than cypionate) — confirmed across sources including Schulte-Beerbuhl & Nieschlag 1980 (*Fertil Steril* 33:201, no PMID) and PMC5182226 (pharmacology review). Half-life 4–5 days per some primary sources (including Schulte-Beerbuhl 1980 data and Pastuszak 2022, PMC9293229: eugonadal 3.8d, hypogonadal 4.2d); other authoritative sources cite 7–9 days — half-life range is contested, 4–5 days is within range but not universal. Sharper peak, faster decline than cypionate. More volatile curve. Often dosed more frequently (every 5–7 days).

#### SubQ vs IM for Testosterone

SubQ produces more stable levels (lower peak-to-trough ratio; Kaminetsky et al. 2019, PMID 30296416; Spratt et al. 2017, PMID 29264562, PMC 5686655). The "39% more stable" figure is a derived calculation from published peak-to-trough CV data, not a directly reported primary result — treat with caution. Increasingly recommended.

#### Testosterone Gel/Cream

Steady state in 48-72 hours. Peak at 16-22 hours. Minimal fluctuation — stable over 180+ days. "Daily testosterone gel produced stable testosterone concentrations and improved quality of life compared with intermittent intramuscular testosterone injections." Transfer risk to contacts is a real concern (documented virilization in partners/children).

#### Testosterone Patches

Peak ~8 hours. Fast clearance after removal. More fluctuation than gel (surprising). **48% application site reaction rate** — skin irritation is the defining limitation (FDA Androderm prescribing information). Adequate levels in only 57% of users (vs 75–80% for gel) — McNicholas et al. 2003, PMID 12614254, Testim vs. Androderm RCT, n=208. Largely superseded by gel.

#### Testosterone Pellets

Peak ~1 month. Half-life ~2.5 months. Duration 4-6 months. Initial supraphysiological phase (may cause temporary irritability), then steady plateau. Eliminates injection-cycle mood rollercoaster. Cannot adjust dose.

### Progesterone in HRT

#### Oral Micronized Progesterone (Prometrium)

The majority of circulating steroid after oral micronized progesterone consists of metabolites — estimated ~80%+ are metabolites, primarily **allopregnanolone** (5α-reduced) and pregnanolone (5β-reduced), with less than ~20% being progesterone itself. This is due to extensive first-pass hepatic and intestinal metabolism. (Sitruk-Ware 1987, PMID 3327648 — foundational review; Bixo et al. 2006, PMID 16406399 — quantified metabolite AUCs: ALLO AUC 196% above baseline, pregnanolone 119%, progesterone 127% — confirming metabolite dominance. Note: the "80/20" split is a reasonable approximation; it is not a precisely measured ratio from a single study.) Functions pharmacologically as a CNS depressant: sedation, anxiolysis, hypnotic effects, mild euphoria in some.

Peak progesterone at 2–3 hours. Peak allopregnanolone at ~2 hours, elevated 5–8 hours. Dramatic supraphysiological ALLO spikes (~15-fold fluctuation per dose). Enhanced absorption with food. Higher peaks in older individuals.

**Taken at bedtime** because sedation is a primary pharmacological action, not a side effect. Morning dosing causes 2-4 hours of cognitive dulling and sleepiness.

#### Synthetic Progestins vs Bioidentical

Bioidentical progesterone converts to allopregnanolone → GABA-A anxiolysis. Synthetic progestins (MPA, norethindrone, levonorgestrel) **do NOT** convert to ALLO — cannot soothe mood the same way. Some progestins cause mood swings/depression attributed to lacking protective neurosteroid metabolites.

**Evidence strength: well-supported** by mechanism (GABA-A pathway) and clinical observation.

#### Progesterone in Trans Feminine HRT

First RCT (2023; Dijkman et al., PMID 38124194, PMC 10734173) found satisfaction with breast development significantly higher (71.4% vs 20.8%, p=0.003). Note: "up to 30% increase in breast volume" was the *defined clinically relevant threshold* for the primary outcome, not the mean observed result — characterizing this as the observed increase is imprecise. The "21.9% reported mood fluctuation" figure does not appear to come from this RCT (which measured different mood outcomes); it likely originates from a separate observational survey of progestogen users and should not be attributed to this trial. Not routinely recommended by Endocrine Society guidelines but widely prescribed off-label.

### Anti-Androgens

#### Spironolactone

Blocks androgen receptor + suppresses testosterone synthesis. Depression incidence <1% in 10-year observational study. "Brain fog" and fatigue reports may relate to diuretic effects (dehydration, electrolyte shifts) rather than direct neuropsychiatric action. Adds physiological burden: frequent urination, hydration needs, potassium monitoring.

#### Cyproterone Acetate (CPA)

Potent anti-androgen + progestogen. Depression risk appears dose-dependent — higher at therapeutic (10-50mg+) vs contraceptive doses. One study found "significant increase in emotional distress" vs GnRH agonist groups. **Meningioma risk**: dose-cumulative, led to EMA restrictions (hazard ratio 11.3 at 36-60g, 21.7 at >60g cumulative). Widespread dose reduction in European trans care.

#### GnRH Agonists (Lupron etc.)

Flare-then-suppress: initial surge (LH 10-fold, testosterone 2-fold) for days 1-3, then receptor desensitization, castrate levels by weeks 2-4. Flare period is pharmacologically chaotic. Suppressed state causes: hot flashes, fatigue, depression risk, mood lability, anxiety. "Substantial evidence suggesting low testosterone may be vulnerability factor for pathological anxiety." In trans context, used alongside estrogen so hypogonadal effects mitigated.

#### Bicalutamide

Pure androgen receptor antagonist — does NOT reduce testosterone. Testosterone may actually increase (compensatory). No hypogonadal mood effects. Best theoretical mood profile of anti-androgens. Rare hepatotoxicity risk requires liver monitoring.

### General HRT Findings

**Delivery stability predicts mood stability:** Converging evidence from PK logic, clinical observation, and dose-frequency comparisons. Patches/gels > injections for mood stability. Weekly > biweekly. Pellets most stable. Caveat: some prefer the dynamic of injection cycles.

**Time to emotional steady state:** Weeks 1-4 initial changes. Months 1-3 stabilization. Months 3-6 "new normal." For trans individuals, pharmacological and psychological effects (gender euphoria) are entangled.

**HRT interruption:** Schmidt et al. (JAMA Psychiatry 2015, PMID 26018333 — note: this study is on perimenopausal depression, not PMDD): 79% of depression-prone women developed symptoms within 3 weeks of estradiol withdrawal (vs 8% continuing). 75% who stopped abruptly experienced vasomotor symptoms within 2 weeks (vs 33% with gradual taper). Higher doses = sharper crash. Pills clear in hours; patches in ~24 hours; pellets taper naturally. For PMDD-specific hormonal challenge evidence, see Schmidt et al. 1998 *NEJM* (PMID 9435325).

**Physiological vs supraphysiological: inverted U.** Subtherapeutic = depression/fatigue. Physiological = optimal. Supraphysiological = paradoxically worsened mood (low mood, anxiety, aggression at truly high levels). Tachyphylaxis (tolerance) documented — dose escalation beyond physiological range makes mood worse.

---

## Pharmacokinetic Reference Table

| Method | Peak (days) | Half-life (days) | Steady state | Fluctuation |
|---|---|---|---|---|
| Estradiol oral | 0.25-0.33 | ~0.5-1 | ~3 days | Moderate (daily) |
| Estradiol patch | 2-3 | ~1 (post-removal) | 2nd patch | Minimal |
| Estradiol sublingual | 0.04 (~1hr) | ~0.1 (~2-3hr) | N/A (sawtooth) | High (hourly) |
| E2 valerate injection | 2.1 | 3.0 | ~2wk weekly | High |
| E2 cypionate injection | 4.3 | 6.7 | ~3-4wk weekly | Low-moderate |
| E2 pellet | ~7 | months | ~2 weeks | Negligible |
| Testosterone cypionate | 4-5 | 7-8 | ~4wk weekly | Moderate-high (biweekly) |
| Testosterone enanthate | 1.5-2 | 4-5 | ~3wk weekly | High |
| Testosterone gel | 0.67-0.92 | ~1 (post-removal) | 2-3 days | Minimal |
| Testosterone patch | 0.34 | 0.05 (post-removal) | ~1 day | Low-moderate |
| Testosterone pellet | ~30 | ~75 | ~1 month | Negligible |
| Oral progesterone | 0.08-0.12 | ~0.5 | daily dosing | Sedation curve |

---

## Evidence Quality Summary

| Finding | Strength |
|---|---|
| ALLO/GABA-A withdrawal → PMS mechanism | Strong |
| PMDD = altered receptor sensitivity, not altered hormones | Strong |
| Pregnancy hormone levels by trimester | Strong |
| Postpartum crash timeline and magnitude | Strong |
| PPD mechanism via ALLO withdrawal (confirmed by treatment) | Strong |
| Sleep emotional reset via REM | Strong |
| Estradiol's serotonergic/dopaminergic effects | Strong |
| Testosterone diurnal rhythm | Strong |
| PK profiles of all HRT delivery methods | Strong |
| Oral progesterone → ALLO → GABA-A sedation | Strong |
| Synthetic progestins lack ALLO pathway | Strong |
| Estradiol withdrawal causes depression in vulnerable women | Strong (Schmidt RCT) |
| Delivery stability predicts mood stability | Moderate-strong |
| Testosterone amygdala/PFC mechanism | Moderate-strong |
| Hormonal IUD dose-response for depression | Moderate |
| Dual hormone hypothesis (T × cortisol) | Moderate |
| Danish registry HC-depression association | Moderate (unreplicated for COCs specifically) |
| DMPA mood effects | Genuinely mixed |
| Injection-cycle mood pattern | Anecdotal + PK plausibility |
| D-MER dopamine mechanism | Plausible, unconfirmed |
| Post-weaning depression mechanism | Clinically recognized, under-researched |
| Progestin type predicting mood | Contested |
| Emergency contraception mood effects | Essentially unstudied |
| Male infradian cycles | Weak/preliminary |
| Menstrual cycle cognitive effects | Weak (2025 meta-analysis negative) |
| Implant mood effects | Poor quality literature |
