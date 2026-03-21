# Serotonin Target Coupling Coefficients — Literature Calibration

Research conducted 2026-02-24 via web search across PubMed, PMC, and published reviews. Citations include PMID, PMC IDs, or DOIs. Every empirical claim has a retrievable citation.

The serotonin target function (`serotoninTarget()` in `state.js`) sets the level toward which serotonin drifts. The function lives on lines ~2141–2205. All inputs are on a 0–100 scale. The output is clamped to [20, 82].

---

## Overview of Coefficients

| Line | Coupling | Current coefficient | Debt comment |
|------|----------|--------------------|----|
| 2145 | `(sq - 0.7) * 20` | ref=0.7, coeff=20 | Yes |
| 2147 | `(social - 50) * 0.15` | 0.15 | Yes |
| 2149 | `(hunger - 60) * 0.2` | threshold=60, coeff=0.2 | Yes |
| 2152 | `(thirst - 700) * 0.009` | threshold=700, coeff=0.009 | Yes |
| 2157 | weather sentiment `wComfort * 4 - wIrritation * 3` | 4, 3 | implicit |
| 2176 | work dread `workDread * 6` | 6 | Yes |
| 2177 | work satisfaction `workSat * 3` | 3 | Yes |
| 2184 | friend guilt `(g1 + g2) * 3` | 3 | Yes |
| 2190 | financial anxiety `moneyAnx * 4` | 4 | Yes |
| 2197 | direct money `(200 - money) * 0.019` | threshold=200, coeff=0.019 | Yes |
| 2202 | sleep debt `(sleep_debt - 240) * 0.005`, cap 8 | threshold=240, coeff=0.005, cap=8 | Yes |

---

## 1. Sleep Quality → Serotonin: `(sq - 0.7) * 20`

**Current code:** `t += (sq - 0.7) * 20`

`sq` = `last_sleep_quality`, range [0,1]. At sq=1.0 (perfect sleep): +6. At sq=0.4: −6. At sq=0.7 (reference): 0.

### What the literature says

The mechanistic link runs through tryptophan availability and 5-HT synthesis. Sleep quality affects serotonergic tone via multiple routes:

1. **Tryptophan pathway during sleep deprivation:** Bhat et al. (2020) review establishes that sleep deprivation activates the kynurenine pathway, shunting tryptophan away from serotonin synthesis. Only ~5% of tryptophan normally goes to serotonin; the kynurenine pathway uses ~95%. Diverting more tryptophan toward kynurenine after poor sleep reduces serotonin synthesis substrate availability.
   - Source: Bhat et al. 2020, *Int J Tryptophan Res* (PMID 33281456; PMC7686593)

2. **Extracellular serotonin and sleep quality:** Bjorvatn et al. found that 8h sleep deprivation does not increase extracellular serotonin in hippocampus or cortex (PMC7686593, citing Bjorvatn et al.). The JMIR EMA study found normalized within-person effect of sleep quality on next-day mood b=0.344 (p<0.001); the reverse direction was b=0.132 (p<0.001) — a 2.6× asymmetry supporting sleep→mood as dominant direction (PMC6456824).
   - Source: Kallestad et al. 2019, *JMIR Mental Health* (PMC6456824)

3. **Sleep loss meta-analysis:** Vandekerckhove & Wang 2018 meta-analysis across 154 studies (N=5,717): all sleep loss forms reduced positive affect (SMD: −0.27 to −1.14) and increased anxiety symptoms (SMD: 0.57–0.63) (PMC8193556).

4. **One night of sleep deprivation and serotonin 2A receptors:** Bhatt et al. found that 24h total sleep deprivation increased 5-HT2A receptor binding by 9.6% in neocortical regions (PET study in humans). Chronic sleep restriction desensitizes the 5-HT1A receptor system gradually (PMID 16408408).

### Translation to the 0–100 scale

The current coefficient of 20 means that moving from reference sleep quality (0.7) to perfect (1.0) adds +6 serotonin target points, and moving to very poor sleep (0.4) subtracts −6. This produces a ±6 point swing across typical sleep quality variation.

The ESM b coefficient of 0.344 (normalized) relates subjective sleep quality to affect, not to serotonin specifically. Translating behavioral mood shifts to serotonin target shifts requires an intermediate assumption about how many serotonin target points correspond to a clinically meaningful mood change — this assumption is not derivable from literature directly.

However, the direction and general magnitude are supported:
- The dominant driver of next-day affect is sleep quality, with a 2.6× larger effect than the reverse (PMC6456824)
- Sleep-quality-induced mood effects are moderate (SMD ~0.5–1.0 in meta-analysis)
- Acute sleep deprivation produces measurable serotonergic receptor changes within 24h

**Calibration assessment:**
- **Reference point 0.7:** Approximation. There is no published sleep quality scale that maps directly to [0,1] with a natural baseline at 0.7. However, average sleep efficiency in healthy adults is approximately 85–90% (PMC8656908), which would correspond to sq ≈ 0.85–0.90 if the scale were pure efficiency. The reference point of 0.7 may be too pessimistic — it implies the simulation's baseline "adequate" sleep quality is 70% efficiency, below the healthy average.
- **Coefficient 20:** The ±6 point range is plausible as a proportion of the 62-point usable serotonin range [20, 82]. Sleep is described as "the strongest lever" in the design notes, and the ESM data supports sleep quality as the dominant daily serotonin influencer.

**Confidence: Low for the specific coefficient; Medium for direction and general dominance.**

**What would be needed to derive this properly:** A direct regression linking PSG-measured sleep quality (efficiency or NREM fraction) to next-morning plasma tryptophan or CSF 5-HIAA. This study design does not appear to exist as of 2026.

### Recommendation

The reference point (0.7) should be reconsidered — the healthy adult baseline is closer to 0.85–0.90. If the reference were raised to 0.85, the same coefficient would produce smaller penalties for merely average sleep and larger penalties for genuinely poor sleep. The coefficient 20 is reasonable for a ±6–9 point swing given sleep's dominant role, but it remains an approximation debt.

---

## 2. Social Connection → Serotonin: `(social - 50) * 0.15`

**Current code:** `t += (s.social - 50) * 0.15`

`social` range [0,100]. At social=100: +7.5. At social=0: −7.5. At social=50: 0.

### What the literature says

The direct human data on social isolation → serotonin is surprisingly sparse. The neurobiology of loneliness review (PMC9029604) found that serotonergic systems are "conspicuously absent from the human findings section" — the dominant human evidence is for cortisol, dopaminergic reward circuits, and amygdala changes, not serotonin directly.

Animal evidence is more robust:

1. **5-HT neuronal excitability in isolation:** Dölen et al. (2016) in mice: chronic social isolation reduces dorsal raphe 5-HT neuron firing via upregulated SK3 calcium-activated potassium channels (PMC5119885, PMID 27874831). The firing frequency of 5-HT neurons was significantly reduced in single-housed vs. group-housed mice (p=0.003). However, the percentage reduction in firing rate is not stated in the abstract — only that it is statistically significant with p values at 0.003 to <0.01 depending on measure.
   - Source: Dölen et al. 2016, *eLife* (PMC5119885; PMID 27874831)

2. **SSRI attenuation by social isolation:** Shemesh et al. 2014 (*Neuropsychopharmacology*, PMID 24981046): Social isolation attenuates SSRI facilitation of serotonin signaling — isolated mice fail to show the serotonin-boosting response to fluoxetine that group-housed mice exhibit.

3. **Sex differences complicate the picture:** Isolation reduces 5-HT excitability in male mice but increases it in female mice (ScienceDirect, Bicks et al. 2020, DOI 10.1016/j.neuropharm.2020.107996). The effect direction is sex-dependent in animals.

4. **Human behavioral effects of social tryptophan supplementation:** Markus et al. (2000) found that alpha-lactalbumin (high-tryptophan protein) increased the plasma Trp:LNAA ratio by 48%, and in "stress-vulnerable" subjects reduced cortisol and improved mood. This is a manipulation of substrate availability, not directly measuring isolation effects. (PMID 10837296)

5. **Social rank and serotonin:** In vervet monkeys, dominant males have ~2× higher whole-blood serotonin than subordinate males, and experimentally raising serotonin (tryptophan supplementation) increased dominant behaviors (summarized in Raleigh et al., cited in Neuropharmacology review). This is a social-status→serotonin effect, not simply connection vs. isolation.

### Translation issues

The social variable in the simulation (0–100) represents connection level/quality, not social rank or mere contact frequency. The literature conflates these. No published study gives a clean "X units of social isolation produces Y% reduction in brain serotonin in humans."

The ±7.5 range from the current coefficient (when social swings between 0 and 100) is plausible as a moderate effect. The social→serotonin pathway is real but indirect: isolation → reduced serotonin neuron excitability (animals) and reduced 5-HT1A sensitivity (animals, chronic).

**Confidence: Low. Direction well-supported; magnitude is ungrounded.**

No literature-derived coefficient is achievable with current data. The animal studies support the direction (isolation reduces 5-HT firing) but do not provide a human quantitative dose-response curve. The coefficient 0.15 remains an approximation debt.

**What would be needed:** Human ESM study regressing daily social contact quality on same-day or next-day mood biomarker correlated with serotonergic activity, or a PET study of 5-HTT binding in lonely vs. non-lonely individuals. Neither appears to exist as of 2026.

---

## 3. Hunger → Serotonin: `if (hunger > 60) t -= (hunger - 60) * 0.2`

**Current code:** `if (s.hunger > 60) t -= (s.hunger - 60) * 0.2`

Threshold 60, coefficient 0.2. At hunger=100: −8. At hunger=80: −4. At hunger=60: 0.

### What the literature says

This coupling has two distinct mechanisms: (A) direct tryptophan availability reduction via fasting, and (B) competition at the blood-brain barrier from other large neutral amino acids (LNAAs).

#### Mechanism A: Food deprivation and brain tryptophan/serotonin

1. **Food deprivation directly reduces brain 5-HT:** Bubenik et al. 1993 (PMID 1373446) measured tissue levels of tryptophan, 5-HT, 5-HIAA, and melatonin in mice at 24h and 48h food deprivation. Key finding: "food deprivation decreased serotonin (5-HT) levels in the brain." Specific values: direction confirmed as brain 5-HT reduction, brain tryptophan levels not significantly changed. The gut shows the opposite pattern (5-HT increases in stomach/intestines during deprivation).
   - Source: Bubenik et al. 1993, *J Pineal Research* (PMID 1373446)

2. **Ramadan fasting paradox:** Zamanian-Azodi et al. 2017 measured plasma serotonin during Ramadan fasting (PMC5505095, PMID 28713531). Counter-intuitively, plasma serotonin *increased* by 33.4% on day 14 and 43.1% on day 29 vs. pre-Ramadan controls. This appears paradoxical but likely reflects the fact that ~95% of body serotonin is peripheral (gut/platelets), not central, and peripheral 5-HT can increase during fasting while brain 5-HT decreases. Plasma serotonin ≠ brain serotonin.

#### Mechanism B: LNAA competition at the BBB

3. **Carbohydrate/protein meal ratios:** Wurtman et al. established that carbohydrate-rich meals cause insulin release, which drives branch-chain amino acids into muscle, reducing competition for tryptophan at the BBB. Carbohydrate-rich vs. protein-rich meals produce a 54% (median) difference in plasma Trp:LNAA ratio (range 36–88%) (PMID 12499331). A protein-rich meal suppresses tryptophan entry into the brain; a carbohydrate-rich meal enhances it. Full fasting eliminates the carbohydrate-triggered insulin effect while also reducing circulating amino acid competition — net effect on tryptophan brain entry is complex and meal-composition-dependent.
   - Source: Wurtman RJ et al. 2003, *Am J Clin Nutr* (PMID 12499331)

4. **Acute tryptophan depletion:** The ATD protocol (amino acid drink excluding tryptophan) produces >85% reduction in brain serotonin synthesis via PET (PMC3756112, PMID from PMCID). A 60% or greater plasma tryptophan reduction is needed to see mood effects in healthy volunteers (PMC3756112). Ordinary food deprivation does not produce this level of depletion — ATD is an extreme experimental intervention. Ordinary hunger produces more modest tryptophan reductions.
   - Source: van Donkelaar et al. 2011, *Neuropsychopharmacology Rev* (PMC3756112)

#### Threshold and coefficient assessment

The threshold at `hunger=60` and coefficient 0.2 producing up to −8 serotonin points at max hunger is plausible in direction. However:
- The mechanism requires hours-long food deprivation to have meaningful brain effects (ATD requires many hours to deplete plasma tryptophan by 60+%)
- Short-term hunger (1–2 hours) has minimal direct tryptophan/serotonin effects
- The simulation's `hunger` variable conflates multiple durations; without knowing if it represents acute or chronic deprivation, the threshold is hard to calibrate
- The maximum effect of −8 points is within the range of what ATD studies show for extreme tryptophan depletion, but ordinary hunger would produce much smaller effects (perhaps −2 to −3 at most)

**Confidence: Low for specific coefficient; Medium for direction and general mechanism; Low for threshold.**

**Better calibration without the right study design:** If `hunger=100` represents ~24–48h without food, a −4 to −6 point reduction in serotonin target is defensible based on brain 5-HT reductions in animal deprivation studies. If `hunger=60` represents only a few hours of missing meals, the threshold onset is too early. The coefficient 0.2 producing −8 at extreme hunger is plausible if hunger=100 represents multi-day starvation.

**What is needed:** A human study measuring plasma or CSF serotonin metrics across graded degrees of ordinary meal deprivation (not ATD). This does not appear to exist in the literature.

---

## 4. Dehydration → Serotonin: `if (thirst > 700) t -= (thirst - 700) * 0.009`

**Current code:** Threshold 700ml (1% deficit), coefficient 0.009. Comment in code: designed to produce ~6pt drop at 1400ml (2% deficit).

### What the literature says

1. **Mood effects of mild dehydration confirmed:** Armstrong et al. 2012 (PMID 22190027) — 25 females, 1.36% body mass loss via exercise. Significantly increased total mood disturbance, fatigue, and headaches on POMS. This is a behavioral finding; serotonin mechanism not measured.
   - Source: Armstrong et al. 2012, *J Nutr* (PMID 22190027)

2. **Gilber et al. 2011 (PMID 26290294):** "Even mild dehydration can alter mood." At <1.5% body mass loss in young women: compromised mood, increased perception of task difficulty. Effect size was significant but modest.

3. **Serotonin mechanism for dehydration:** The proposed mechanism (code comment) is indirect — dehydration may impair tryptophan transport or neurotransmitter synthesis substrate availability. However, no peer-reviewed study directly measures brain serotonin changes under mild dehydration in humans. The serotonin link is biologically plausible (tryptophan needs water for transport; neurotransmitter synthesis is enzyme-dependent with water requirements) but not empirically established for mild dehydration at 1–2%.

4. **Cellular dehydration study:** Brinkworth & Buckley 2010 (PMID 33077017): 24h fluid restriction produced significant increases in fatigue, sleepiness, confusion on mood measures. Serotonin not measured.

### Translation assessment

The existing code's comment is honest: "coefficient 0.009 chosen to produce ~6pt serotonin drop at 1400ml." This is a design choice worked backward from a desired outcome magnitude, not forward from data.

The behavioral data (mood effects at 1–2% dehydration confirmed at p<0.05 in multiple studies) supports a real effect. The serotonin mediation is inferred, not measured.

**Confidence: Medium for behavioral reality of dehydration→mood; Low for serotonin as mechanism vs. other NT systems; Low for specific coefficient.**

**Calibration upper bound:** At 2% body mass loss (severe mild dehydration in most definitions), the mood effect in ESM/POMS studies is moderate but not extreme — a 5–8 point serotonin target reduction is not implausible. The current code produces ~6 points at threshold+700ml, which is in range. This is coincidentally reasonable but not derived.

---

## 5. Work Dread / Satisfaction → Serotonin: `workDread * 6`, `workSat * 3`

**Current code:** `t -= workDread * 6; t += workSat * 3`

Sentiments range [0,1]. Max dread effect: −6. Max satisfaction effect: +3.

### What the literature says

1. **Burnout and serotonin:** Zhong et al. 2018 (PMC6134687) measured neurotransmitter levels (including 5-HT) in Chinese medical workers across exhaustion levels. Low-exhaustion group: 5-HT 2.43±0.64 (log₁₀). Moderate-exhaustion group: 2.05±0.44 (log₁₀). This is a log₁₀ scale; the absolute difference is 10^2.43 vs 10^2.05 = 269 vs 112 ng/mL — a ~58% reduction. However, no healthy control group existed in this study, and exhaustion is broader than dread specifically.
   - Source: Zhong et al. 2018, *Glob Health Res Policy* (PMC6134687; DOI 10.1186/s41256-018-0073-y)

2. **Occupational stress and serotonin general effect:** Chaouloff 1993 (*Neuropsychopharmacology*, Nature) review: "Numerous stressors increase nerve firing and extracellular serotonin at level of serotonergic cell bodies or nerve terminals." This is acute stress (flight/fight) — different from the chronic dread modeled here. Chronic work stress is associated with serotonin depletion, not acute elevation.

3. **Serotonin and moral/social aversion:** Multiple studies confirm serotonin's role in harm-aversion and moral sensitivity (Crockett et al. 2010, PNAS PMC2951447; Crockett et al. 2010, PNAS PMC2951404). Low serotonin increases willingness to cause harm. This is mechanistically related to dread (anticipatory avoidance) but not identical.

4. **Asymmetry of dread vs. satisfaction effects:** The 2:1 ratio (dread 6, satisfaction 3) reflects loss-aversion asymmetry in psychological literature (Kahneman & Tversky). This is well-supported in behavioral economics but not directly measured in serotonin terms.

### Translation assessment

The 58% serotonin reduction associated with burnout-level exhaustion (Zhong et al.) maps to a much larger absolute change than the code's max −6 points. On the [20, 82] scale, 58% of 62 points = 36 points — far beyond the code's maximum. However, burnout is an extreme chronic state, and the code's `workDread` is a continuous sentiment, not a binary burnout flag. The code also has stress and sleep debt applying serotonin pressure through other channels.

The dread coefficient 6 (max −6 at full dread) and satisfaction coefficient 3 (max +3 at full satisfaction) are plausibly sized relative to the other contributors, but the asymmetry (2:1) while directionally supported by loss aversion is not calibrated from serotonin-specific data.

**Confidence: Low for specific coefficients; Medium for asymmetry direction; Medium for the general direction of chronic dread lowering serotonin.**

---

## 6. Friend Guilt → Serotonin: `(g1 + g2) * 3`

**Current code:** `t -= (g1 + g2) * 3`, max −6 at extreme guilt toward both friends.

### What the literature says

1. **Guilt and serotonin:** Crockett et al. 2010 (PMC2951447) showed that serotonin modulates harm aversion — when ATD depletes serotonin, people become less averse to causing harm. The inverse (low serotonin = less guilt inhibition) is implied. Directly, excessive guilt / excessive harm-aversion is associated with high serotonin tone in some models.

2. **Ruminative guilt:** Raes & Williams 2010 (PMC2672047) found that rumination increases emotional inertia. Guilt is a ruminative state and, via the neuroticism/rumination pathway, depresses serotonin indirectly. This is already captured in the emotional inertia model (effectiveInertia), not in the serotonin target function.

3. **Social avoidance and serotonin:** Low serotonin is associated with increased social avoidance and submissive behavior in primates. Guilt-induced avoidance (not responding to friends) could fit this pattern — but it is guilt causing behavior, not guilt directly suppressing serotonin.

4. **No direct human study** measuring serotonin changes specifically in guilt states was found.

### Translation assessment

The guilt→serotonin coupling in the code is mechanistically under-supported. Guilt is a complex emotion whose neurochemistry primarily involves prefrontal-limbic circuits and HPA axis (cortisol), not clearly serotonin targets. The code may be double-counting: guilt is itself a consequence of low serotonin (facilitated by high cortisol), not necessarily a cause.

However, chronic guilt that prevents resolution (not responding to friends → ongoing guilt) could maintain serotonin targets at lower levels via sustained social disconnection and rumination.

**Confidence: Low. The coefficient 3 (max −6 total) is small relative to other contributors, which is appropriate given the uncertainty, but the mechanistic pathway is weak.**

---

## 7. Financial Anxiety → Serotonin: `moneyAnx * 4`

**Current code:** `t -= moneyAnx * 4`, applied at home. Max: ~−3.2 at high anxiety (since sentiment intensity is [0,1]).

### What the literature says

1. **Financial hardship and depression:** A longitudinal French cohort study (PMC12281044) found financial hardship is associated with later depressive symptoms — the association is robust and persists controlling for income level. The mechanism runs through chronic stress → HPA axis → potential serotonin effects.

2. **Scarcity and cognitive bandwidth:** Mani et al. 2013 (*Science*, DOI 10.1126/science.1238041, "Poverty Impedes Cognitive Function") found that inducing financial concerns reduced IQ-equivalent performance by ~13 points, equivalent to losing a full night of sleep. Mechanism: attentional capture and mental bandwidth reduction, not serotonin directly.

3. **Chronic stress → serotonin:** The general stress→serotonin relationship is established (Chaouloff 1993). Financial anxiety is a chronic stressor and would be expected to reduce serotonin targets over time via cortisol-mediated effects. But "financial anxiety" as a sentiment already involves some coupling through the stress variable; this coupling in serotoninTarget() may partially double-count.

4. **No direct study** measuring brain serotonin or 5-HIAA in financially anxious populations was found.

### Translation assessment

The financial anxiety → serotonin coupling is real at a mechanistic level (chronic stress → serotonin reduction) but the specific coefficient of 4 (max −3.2 points at the apartment) is not derivable from literature. The magnitude is small relative to sleep and social effects, which seems appropriate — financial anxiety is chronic background, not acute.

**Confidence: Low for coefficient; Medium for direction.**

**Note on potential double-counting:** The stress variable already captures some financial-anxiety-induced stress, which then affects serotonin through the cortisol and GABA pathways. The additional direct coupling in serotoninTarget() via money anxiety sentiment may partially overlap. Whether this double-counting is appropriate or excessive is a design question rather than a calibration question.

---

## 8. Direct Money Level → Serotonin: `(200 - money) * 0.019`

**Current code:** `if (s.money < 200) t -= (200 - money) * 0.019`. At money=0: −3.8. At money=$50: −2.85. At money=$200: 0.

### What the literature says

1. **Poverty and mood:** The Mani et al. 2013 scarcity study (*Science*, DOI 10.1126/science.1238041) found income-relevant cognitive costs at the "expensive car repair" framing vs. "cheap repair" — a within-person manipulation showing that low-income individuals perform worse when financial concerns are made salient. But this is cognitive performance, not neurochemistry.

2. **Income gradient in depression:** Epidemiological data consistently shows income-depression gradients. However, these are long-term, life-history-level effects, not the day-to-day fluctuations the simulation models.

3. **Money threshold $200:** This threshold (tight/scraping boundary) is already a simulation convention. The literature does not support a specific dollar threshold above which financial stress vanishes.

### Translation assessment

The direct money effect (separate from financial anxiety sentiment) attempts to capture something real: being broke hurts regardless of whether you're consciously anxious about it. The effect magnitude of −3.8 at zero balance is small relative to sleep and social effects, which is appropriate. However, the coefficient 0.019 and threshold $200 are entirely chosen.

**Confidence: Low for specific values. The direction is real; the magnitudes are approximation debt.**

---

## 9. Sleep Debt → Serotonin: `(sleep_debt - 240) * 0.005`, cap 8

**Current code:** `if (s.sleep_debt > 240) t -= Math.min((s.sleep_debt - 240) * 0.005, 8)`

Threshold 240 (minutes of accumulated debt, ~4 hours), max effect −8.

### What the literature says

1. **Chronic partial sleep restriction and 5-HT1A desensitization:** Grassi Zucconi et al. 2006 (PMID 16408408) — rats restricted to 4h sleep/day for multiple days show gradual, persistent desensitization of the 5-HT1A receptor system. One day of restricted sleep had no effect; one week caused blunted pituitary ACTH response to 5-HT1A agonist. This is receptor-level adaptation, not raw serotonin levels.
   - Source: Grassi Zucconi et al. 2006, *Neuroscience* (PMID 16408408)

2. **Chronic restriction → depression-like receptor changes:** Roman et al. 2005 (PMC2579986) — chronic sleep restriction produces 5-HT1A receptor and CRH receptor sensitivity changes resembling depression. Threshold: effects required "more than a week" of restriction.

3. **Acute sleep deprivation 5-HT2A increase:** Elmenhorst et al. 2012 (PMC3490354) — 24h total deprivation increased 5-HT2A binding by 9.6% in humans. This is the upregulation response (compensation), not serotonin level reduction.

4. **Cumulative vs. acute:** The key distinction is: a single poor night (what `last_sleep_quality` already models) affects serotonin via substrate and acute mechanisms. Accumulated sleep debt across many nights (what `sleep_debt` represents) produces slower-onset receptor-level changes. The simulation's separation of these into two coupling terms (sleep quality and sleep debt) is structurally correct.

### Translation assessment

The sleep debt coupling is justified mechanistically — chronic sleep restriction does produce serotonin system changes distinct from single-night effects. The threshold (240 minutes = 4 hours of accumulated debt, ~1 missed night) may be slightly too low given that the receptor-level studies require "more than a week" of restriction to see effects. However, the simulation's `sleep_debt` accumulates from many nights, so 240 minutes of cumulative debt could represent several nights of marginal shortfalls.

The maximum cap of −8 points (at extreme sleep debt) means that chronic sleep deprivation can reduce serotonin target by up to ~13% of the usable range [20, 82]. This is plausible — not extreme, but meaningful.

**Confidence: Low for threshold and coefficient; Medium for direction and justification of having a separate sleep-debt term.**

---

## Summary Table

*Updated 2026-02-24 to reflect implemented state.*

| Coupling | Current coefficient | Literature support | Confidence | Status |
|----------|--------------------|--------------------|------------|--------|
| Sleep quality → serotonin `(sq-0.85)*20` | coeff=20, **ref=0.85** (raised from 0.7) | ESM b=0.344 sleep→mood (PMC6456824); SMD −0.27 to −1.14 meta-analysis (PMC8193556); tryptophan depletion mechanism (PMID 33281456) | Medium (direction), Low (number) | Approximation debt — magnitude not derivable |
| Social → serotonin `(social-50) * (0.06+0.09*depth/100)` | 0.06–0.15 depending on depth | Animal: isolation reduces DRN 5-HT firing (PMC5119885). Human: indirect only | Low | Approximation debt — no human quantitative dose-response |
| Hunger `> 75, coeff 0.2` | **threshold=75** (raised from 60), 0.2 | Brain 5-HT decreases with food deprivation (PMID 1373446); ATD requires >60% Trp reduction for mood effects (PMC3756112) | Low–Medium | Approximation debt — threshold defensible; coefficient chosen |
| Dehydration threshold 700ml, coeff 0.009 | 700, 0.009 | Mood effects confirmed at 1.4% body mass loss (PMID 22190027); serotonin mechanism not measured | Low | Approximation debt — behavioral effect real; 5-HT mechanism inferred |
| Work dread coeff 6 | 6 | Burnout-level 5-HT reduction ~58% (PMC6134687); chronic stress→5-HT supported | Low–Medium | Approximation debt — proportional, not derived from burnout data |
| Work satisfaction coeff 3 | 3 | Asymmetry (2:1 dread:sat) supported by loss aversion; no 5-HT-specific data | Low | Approximation debt |
| Friend guilt coeff 3 | 3 | Guilt→serotonin mechanism weak; serotonin modulates harm-aversion (PMC2951447); potential double-counting via rumination inertia | Low | Approximation debt — retained at small magnitude given uncertainty |
| Financial anxiety coeff 4 | 4 | Financial hardship → depressive symptoms (PMC12281044); potential double-counting with stress | Low | Approximation debt — "ambient dread" dimension not captured by momentary stress |
| Direct money coeff 0.019, threshold $200 | 0.019, $200 | Income-depression gradient (Lorant 2003 PMID 12522017); scarcity bandwidth loss (DOI 10.1126/science.1238041) | Low | Approximation debt — direction real; coefficient chosen |
| Sleep debt **threshold=360**, coeff 0.005, cap 8 | **360** (raised from 240), 0.005, 8 | 5-HT1A desensitisation requires "more than a week" (PMID 16408408, PMC2579986). 360 min = ~6 days at 1h/day — consistent with "more than a week" requirement | Medium (structure), Low (numbers) | Approximation debt — threshold now literature-justified; coefficient chosen |
| Clamp [20, 82] | floor 20, ceiling 82 | ATD floor ~10–15% (PMC3756112); chronic MDD floor ~20–25% (PMC3398160); no natural sustained 5-HT elevation | High | **Calibrated from clinical literature** |

---

## Key Sources

- Bhat et al. 2020, *Int J Tryptophan Res* — sleep deprivation and tryptophan metabolism review (PMID 33281456; PMC7686593)
- Bubenik et al. 1993, *J Pineal Research* — food deprivation and brain 5-HT tissue levels in mice (PMID 1373446)
- Dölen et al. 2016, *eLife* — chronic social isolation reduces DRN 5-HT neuron excitability via SK3 channels (PMC5119885; PMID 27874831)
- Elmenhorst et al. 2012, *Sleep* — 24h total sleep deprivation increases 5-HT2A binding 9.6% by PET (PMC3490354)
- Grassi Zucconi et al. 2006, *Neuroscience* — chronic sleep restriction desensitizes 5-HT1A receptor system (PMID 16408408)
- Kallestad et al. 2019, *JMIR Mental Health* — EMA study: sleep quality → next-day mood b=0.344 (PMC6456824)
- Mani et al. 2013, *Science* — poverty impedes cognitive function; scarcity = lost-night-of-sleep-equivalent (DOI 10.1126/science.1238041)
- Roman et al. 2005, *Biol Psychiatry* — chronic sleep restriction → depression-like 5-HT receptor changes (PMC2579986)
- Shemesh et al. 2014, *Neuropsychopharmacology* — social isolation attenuates SSRI serotonin facilitation (PMID 24981046)
- van Donkelaar et al. 2011, *Neuropsychopharmacology Rev* — ATD review: >85% serotonin synthesis reduction; 60%+ plasma TRP reduction needed for mood effects (PMC3756112)
- Vandekerckhove & Wang 2018, *Psychological Medicine* — meta-analysis 154 studies sleep loss → positive affect reduction (PMC8193556)
- Wurtman RJ et al. 2003, *Am J Clin Nutr* — carbohydrate vs. protein meals: 54% median Trp:LNAA ratio difference (PMID 12499331)
- Zhong et al. 2018, *Glob Health Res Policy* — burnout severity and neurotransmitter levels in medical workers (PMC6134687)
- Armstrong et al. 2012, *J Nutr* — mild dehydration (1.36% body mass) and mood in women (PMID 22190027)
- Berset et al. 2007, *Behav Sleep Med* — 63-study PSG review of stress effects on sleep (referenced in calibration.md; PMC4266573)
- Crockett et al. 2010, *PNAS* — serotonin and harm aversion / moral judgment (PMC2951447; PMC2951404)
