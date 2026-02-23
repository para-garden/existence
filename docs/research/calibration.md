# Calibration Research

Empirical literature review findings for replacing approximation-debt constants in the simulation. Each section covers one debt, summarizes what the research supports, and gives calibration targets.

Research conducted 2026-02-20 via web search agents across PubMed, PMC, and published meta-analyses. Citations are provided but not independently verified — treat as directional rather than authoritative until spot-checked.

---

## Adenosine Accumulation Rate

**Applies to:** `tickNeurochemistry()` in `state.js` — the adenosine accumulation line.
**Status:** ✓ IMPLEMENTED 2026-02-20. Replaced linear 4 pts/hr with saturating exponential (τ=18h, ceiling=100). At 16h from cleared baseline → ~59.

**Current debt:** `4 pts/hr` linear accumulation (state.js). Acknowledged approximation debt.

### What the literature says

**Accumulation is a saturating exponential, not linear.**

The two-process model (Borbély/Achermann) describes Process S (the homeostatic sleep pressure signal, strongly tied to adenosine) as a saturating exponential during wakefulness with a time constant of ~18 hours. The decay constant during sleep is ~4 hours. These are fitted to slow-wave activity (SWA) data, not direct adenosine measurements, but Process S is widely understood as the macroscale signature of adenosine accumulation.

Direct microdialysis evidence:
- Porkka-Heiskanen et al. (2000): basal forebrain adenosine rose to ~140% of baseline over 6 hours of sleep deprivation in cats. 15–20% decline during spontaneous sleep episodes.
- Meta-analysis (2018, *J Circadian Rhythms*): pooled estimate ~74.7% above baseline during sleep deprivation across 9 studies (95% CI: 54.1–95.3%).

**Translating to the 0–100 scale:**

Using a saturating exponential with ~18h time constant:
`S(t) = 100 × (1 − exp(−t/18))`

At 16 hours awake: 100 × (1 − exp(−16/18)) ≈ **59**

The current 4 pts/hr linear gives 64 at 16 hours — close in the midrange, but:
- Linear understates early accumulation (hours 0–4)
- Linear overstates late accumulation (hours 12–16)

**The larger debt: cognitive load is ignored.** Adenosine is released in proportion to neuronal energy expenditure (ATP hydrolysis via ectonucleotidases CD39/CD73, plus astrocyte gliotransmission). High cognitive demand builds adenosine faster than passive wakefulness. The flat rate treats cognitive load as constant.

**Sleep clearance:** Depth-dependent. Adenosine kinase (primarily in glia) is the main clearance enzyme. SWA correlates with adenosine clearance. Adenosine deaminase variants that reduce adenosine metabolism specifically enhance deep sleep. The simulation's existing architecture (adenosine clearing faster during deep-sleep cycles) is biologically grounded.

**Sleep clearance time constant:** ~4 hours. After sleep deprivation, basal forebrain adenosine remained elevated throughout 3 hours of recovery sleep — BF clears slower than other regions.

### Calibration targets

Replace: `adenosine += 4` (linear) with:
```
adenosine += (ceiling - adenosine) / 18   // per hour; exponential approach
```
Where ceiling is set so that 16 hours awake → ~60. This is derivable from published data, not chosen.

Secondary debt to name explicitly: cognitive load modifier on accumulation rate (high-demand tasks → faster accumulation). Currently absent.

### Key sources
- Porkka-Heiskanen et al. 1997, *Science* 276:1265 — foundational
- Porkka-Heiskanen, Strecker & McCarley 2000, *Neuroscience* 99:507 — 140% BF, 15–20% spontaneous sleep
- Intracerebral Adenosine Meta-Analysis 2018, *J Circadian Rhythms* — 74.7% pooled increase (PMC6196573)
- Phillips, Klerman & Butler 2017, *PLoS Comput Biol* — full adenosine ODE model (PMC5675465)
- Two-Process Model review, Borbély 2022, *J Sleep Research* — 18h/4h time constants (PMC9540767)

---

## Sleep Quality Multipliers

**Applies to:** Sleep execute in `content.js` — all `qualityMult *=` lines in the `sleep` interaction.
**Status:** ✓ IMPLEMENTED 2026-02-20. All six factors recalibrated: overwhelmed 0.5→0.82×, strained 0.7→0.91×, starving 0.7→0.88×, very_hungry 0.85→0.94×, rain comfort 0.10→0.04, melatonin 1.05/0.85→1.03/0.90×. Circadian values unchanged (already within literature range). Adenosine crash penalty was already removed prior to this pass.

**Current debts:** Six multiplicative factors in `content.js` sleep execute, all chosen. Current code uses `qualityMult *= factor` for each.

### Stress

| Tier | Current | Literature | Confidence |
|---|---|---|---|
| `strained` | 0.70× | 0.90–0.93× | Moderate |
| `overwhelmed` | 0.50× | 0.80–0.85× | Moderate |

**Evidence:** Renner et al. 2022 (*Cerebral Cortex*, PMC9758584) — PSG with pre-sleep stressor: sleep efficiency dropped ~10–13% relative (from ~79% to ~69–71%). SWS reduced ~20–25%. Effect sizes: η² = 0.10–0.22.

The Berset et al. 2007 review of 63 PSG studies found stress effects are real but not universal — 41% showed efficiency decreases, 59% no change. The strongest signal is on awakenings/WASO and latency, not architecture (SWS/REM). The current 0.5× for `overwhelmed` implies pathological sleep degradation not seen in healthy-population PSG.

**Stacking concern:** `overwhelmed (0.5) × starving (0.7) × daytime (0.75) = 0.26×` — implausible. With calibrated values: `0.82 × 0.88 × 0.77 = 0.56×` — very bad but not absurd.

### Hunger

| Tier | Current | Literature | Confidence |
|---|---|---|---|
| `very_hungry` | 0.85× | 0.93–0.95× | Low (thin PSG data) |
| `starving` | 0.70× | 0.87–0.90× | Low |

**Evidence:** Direct PSG data on acute hunger is sparse. Severe caloric restriction (800 kcal/day for 4+ weeks) increases sleep latency and reduces SWS in the limited studies available. Acute single-night hunger is less studied. Important complication: ghrelin (elevated when hungry) *promotes* SWS, partially offsetting the arousal/discomfort effect. The dominant mechanism for single-night hunger is likely increased WASO from discomfort, not SWS/REM suppression. Current values substantially overstate the effect.

### Melatonin

| State | Current | Literature | Confidence |
|---|---|---|---|
| High melatonin bonus | 1.05× | 1.02–1.04× | Moderate |
| Low melatonin penalty | 0.85× | 0.88–0.92× | Moderate |

**Evidence:** Exogenous melatonin meta-analyses (Ferracioli-Oda et al. 2013, *PLoS One*; Brzezinski et al. 2005): sleep efficiency improvement ~2.2 percentage points (95% CI 0.2–4.2). From 85% baseline: 87.2/85 ≈ 1.026×. Melatonin does **not** increase SWS — it affects sleep onset and continuity via temperature/circadian signaling, not homeostatic pressure. The 1.05× bonus is at the high end; the 0.85× penalty is aggressive.

**Important:** Melatonin's primary effect is on sleep latency, not sleep architecture. If `qualityMult` downstream affects SWS-related outcomes, the melatonin factor is mechanistically misrouted.

### Circadian misalignment

| Window | Current | Literature | Confidence |
|---|---|---|---|
| Daytime (10:00–16:00) | 0.75× | 0.75–0.80× | **High** |
| Early morning (06:00–10:00) | 0.90× | 0.88–0.92× | Moderate |

**Evidence:** Forced desynchrony protocol (Dijk & Czeisler 1999, *J Physiology*, PMC2269279) — 482 sleep episodes across all circadian phases. Sleep efficiency: ~92.6% at optimal phase vs. ~73.0% at worst phase (ratio: 73/93 ≈ **0.785**). The current 0.75× is close to the empirically derived value for sleeping at the absolute worst circadian phase.

**These are the best-calibrated of the six factors.** The direction and magnitude both have direct PSG support from controlled protocols.

Important nuance: homeostatic pressure (high adenosine) partially compensates for circadian misalignment on SWS but not on REM. The simulation decouples these via the adenosine and circadian factors separately — structurally correct.

### Rain/sound comfort

| State | Current | Literature | Confidence |
|---|---|---|---|
| Rain comfort max bonus | +0.10 | +0.03–0.05 | Moderate |

**Evidence:** Messineo et al. 2017 (*Frontiers in Neurology*, PMC5742584) — white noise PSG crossover: sleep onset latency 19→13 min (38% reduction), but sleep efficiency 88%→87.5% (not significant, p=0.989). Jiang et al. 2025 meta-analysis (34 RCTs): white noise improved PSQI scores, most clearly for sleep latency in high-noise environments.

**The mechanism is noise masking, not intrinsic soothing.** The benefit is largest in noisy environments (urban, traffic) and absent or negative in already-quiet environments. The current implementation gives this bonus to any rain-liking character regardless of environment. The +0.10 also converts a latency benefit into a quality multiplier inflating it further — the actual efficiency effect is small and often not significant.

Future: condition this on environmental noise tier (urban vs. rural) when environment granularity is added.

### Adenosine crash (high adenosine at sleep onset)

| State | Current | Literature | Confidence |
|---|---|---|---|
| `adenosine > 80` | 0.90× penalty | **Direction is wrong** | **High** |

**Evidence:** High adenosine *drives more SWS*, not less. The adenosine A1 receptor system is the primary mechanism of SWA rebound after sleep deprivation. SWA during SWS after prolonged waking increases to >350% of baseline. Shift worker PSG confirms: daytime sleep after night shifts shows preserved N3 SWS and elevated SWA intensity despite circadian misalignment.

**Recommendation: remove this factor entirely.** The downsides of crash sleep (sleep inertia, missed REM due to short duration) are already modeled in `sleepCycleBreakdown()`. A quality penalty for high adenosine is mechanistically backward and double-counts effects handled elsewhere. If the intent is to capture that crash sleep often occurs at bad times/positions, those effects belong in the circadian and context factors.

### Key sources (sleep quality)
- Renner et al. 2022, *Cerebral Cortex* — PSG with pre-sleep stressor (PMC9758584)
- Berset et al. 2007, *Behavioral Sleep Medicine* — 63-study PSG review (PMC4266573)
- Åkerstedt et al. 2012, *Sleep* — naturalistic stress-sleep (PMC4202771)
- Ferracioli-Oda et al. 2013, *PLoS One* — melatonin meta-analysis (PMID 23691095, PMC3656905)
- Brzezinski et al. 2005, *Sleep Medicine Reviews* — melatonin meta-analysis (PMID 15649737)
- Dijk & Czeisler 1999, *J Physiology* — forced desynchrony PSG (PMC2269279)
- Messineo et al. 2017, *Frontiers in Neurology* — white noise PSG (PMC5742584)
- Reichert et al. 2022, *PMC* — adenosine, caffeine, sleep-wake review (PMC9541543)

---

## Emotional Inertia Trait Weights

**Applies to:** `effectiveInertia()` and `regulationCapacity()` in `state.js`.
**Status:** ✓ IMPLEMENTED 2026-02-20. Weights corrected to `rumination: 0.40, neuroticism: 0.32, self_esteem: 0.28`. Negative-direction asymmetry extended to both neuroticism and rumination.

**Current debt:** Weights `neuroticism: 0.5, self_esteem: 0.3, rumination: 0.2` in `effectiveInertia()` (state.js). Chosen without empirical basis.

### What the literature says

**The current ordering is empirically backwards.** Meta-analytic correlations with negative emotion (NE) inertia from Houben et al. 2015 (*Psychological Bulletin*, PMC4705270):

| Trait | Meta-analytic r (NE inertia) | Meta-analytic r (PE inertia) |
|---|---|---|
| Rumination | **r = 0.26** [0.15–0.36] | r = 0.16 |
| Neuroticism | r = 0.21 [0.04–0.37] | r = 0.13 |
| Self-esteem (low) | r = 0.14–0.20 | r ≈ similar (symmetric) |

Rumination is the strongest predictor of NE inertia, not the weakest.

**From the Houben meta-analysis Study 2** (simultaneous regression on NE inertia including all three):
- Rumination: β = 0.05 (p < 0.001) — largest
- Self-esteem: β = −0.04 (p = 0.011)
- Depressive symptoms (as neuroticism proxy): β = 0.03 (p = 0.029)

**Wenzel et al. 2025 (*JPSP*, N=1,118, N_obs=96,699):** Neuroticism associated with all three components: more frequent/intense negative events, increased NA reactivity, AND decreased recovery from negative events. Poor recovery (not reactivity alone) is what drives mean NA elevation — because reactivity without recovery accumulates. This supports the inertia framing.

**Empirically-derived weights** (scaling meta-analytic r values to sum to 1):
- Rumination r = 0.26 → **weight ≈ 0.40**
- Neuroticism r = 0.21 → **weight ≈ 0.32**
- Self-esteem r = 0.18 (midpoint) → **weight ≈ 0.28**

### Asymmetry findings

**Neuroticism: strong asymmetry toward negative — well supported.**
- NE inertia r = 0.21; PE inertia r = 0.13 (meaningfully weaker)
- NE variability b = 0.10; PE variability b = 0.03–0.04 (near zero)
- The simulation's existing rule (neuroticism adds stickiness only in the "toward worse" direction) is empirically correct.

**Self-esteem: valence-symmetric — differs from neuroticism.**
- Kuppens et al. 2010 found low self-esteem elevated inertia for *both* positive and negative emotions at similar magnitudes (happy β = −0.07, excited β = −0.08, anxious β = −0.14, depressed β = −0.11).
- Self-esteem should affect emotional rigidity generally, not asymmetrically toward negative.

**Rumination: asymmetric toward negative (like neuroticism).**
- Mechanistically: repetitive processing of negative content actively maintains negative cognition.
- Houben meta-analysis: NE inertia r = 0.26 vs. PE inertia r = 0.16.
- Should follow the same asymmetry pattern as neuroticism in `effectiveInertia()`.

### Caveats

- The three traits correlate with each other (neuroticism-rumination r ≈ 0.4–0.6; low SE-rumination r ≈ 0.3–0.5). Their joint contributions involve suppression effects. No published study puts all three into one model predicting ESM-derived affect autocorrelation at sufficient sample size to trust relative betas precisely.
- The weights from meta-analytic r values are derived from separate studies aggregated — not from a single clean multi-predictor model.
- The proposed weight reordering (rumination first) is well-supported directionally; the exact magnitudes remain approximation debts with better grounding than before.

### Key sources
- Houben, Van Den Noortgate & Kuppens 2015, *Psychological Bulletin* — meta-analysis (PMID 25822133; no PMC deposit — note: PMC4705270 is Koval et al. 2016, a different paper)
- Kuppens et al. 2010, *Psychological Science* — self-esteem and affect autocorrelation (PMC2901421)
- Koval et al. 2012, *Psychological Medicine* — getting stuck in depression (PubMed 22671768)
- Wenzel et al. 2025, *JPSP* — neuroticism, reactivity, and recovery (PubMed 41264496)
- Raes & Williams 2010, *Cognition & Emotion* — rumination ESM (PMC2672047)
- Neural predictors of emotional inertia (PMC5629827)
- Dejonckheere et al. 2020, *PNAS* — neuroticism and emotional variability (PMC7196909)

---

## Social Need Model

**Applies to:** Social decay block in `tickNeurochemistry()` in `state.js`, the `social` state variable, and new `social_energy` variable.
**Status:** ✓ IMPLEMENTED 2026-02-20. 10-action threshold removed; linear 2 pts/hr replaced by asymptotic decay (τ=66h, ~7 pts/10h from social=50). Neuroticism scales rate ±35%. `social_energy` variable added: depleted by adjustSocial (0.5× coefficient), recovers at 3 pts/hr during solitude, fully reset by sleep. socialEnergyTier() exported. Habits feature extraction updated. Remaining approximation debts: τ not derived from literature; trait loneliness floor absent (needs chargen param); introversion scaling absent (needs chargen param).

**Current debt:** `social` state variable decays at 2 pts/hr after 10 idle actions without meaningful interaction. Both the rate and threshold are chosen without empirical basis. The model also conflates two distinct systems.

### What the literature says

**The "10 idle actions" threshold has no empirical basis and is the wrong model.** Social need accumulates continuously from first isolation, sub-linearly (fast early, decelerating asymptote). No clean onset point exists.

**The two-process model (empirically supported):**

Two genuinely separate systems the simulation currently conflates:

1. **Social need** — homeostatic drive. Accumulates with isolation, decelerating curve. Reduced by meaningful contact; partially reduced by superficial contact. Quality matters more than quantity.
2. **Social energy** — depleted by any social interaction; recovers during solitude and sleep; introversion amplifies depletion. Peaks 2–3 hours after sociable behavior (Zelenski et al. 2020, PMC7260435).

These can be simultaneously high: the introverted person who desperately wants connection but finds every interaction exhausting. That tension is a real psychological state.

**Onset timescales:**

Tomova et al. 2020 (*Nature Neuroscience*): 10 hours of total social isolation produced midbrain dopaminergic craving responses similar in pattern to 10 hours of food fasting. Self-reported loneliness and social craving measurably elevated. This is the empirical floor — effects detectable at 10 hours.

Ding et al. 2025 (*Nature*): hypothalamic social homeostasis circuit. Social need accumulates continuously during isolation and dissipates gradually during reunion (not instantly). The dose-response to isolation duration was graded and continuous — no threshold effect.

**Accumulation rate:**

No clean "X points per hour of isolation" exists in literature. The relationship is:
- Non-linear (slow build that asymptotes)
- Dominated by perceived quality of last contact, not duration of absence
- Moderated strongly by personality

If meaningful distress starts ~60–70 on a 0–100 scale, a baseline character might accumulate ~5–10 points over a typical 10-hour day without meaningful interaction. The current 2 pts/hr gives 20 points — likely too fast.

**Current 2 pts/hr is too fast by roughly 2–4×.**

**Personality modulation (Buecker et al. 2020 meta-analysis, N=93,668):**
- Neuroticism: r = +0.358 with loneliness → faster accumulation, higher peak sensitivity
- Extraversion: r = −0.370 with loneliness → introversion modulates social *energy* cost more than social *need* rate
- Together: personality should modulate rate by roughly ±30–40%

**Relief:**

- Meaningful contact: immediate onset, persists 2–5 hours post-contact (ESM literature)
- Superficial contact (cashier, neighbor): real but small relief — r ≈ 0.15–0.25 with momentary wellbeing (Sandstrom & Dunn 2014)
- At high chronic loneliness: ambiguous interactions may *increase* need rather than reduce it (Cacioppo hypervigilance mechanism — lonely brains detect social threats at ~116ms vs. 252ms for non-lonely)

**Social fatigue timescales:**

Zelenski et al. 2020 (PMC7260435): sociable behavior predicted fatigue peaking 2–3 hours later. True for everyone, magnitude moderated by introversion. Mood benefit (positive affect during interaction) and fatigue cost (2–3 hours later) are genuinely separate, coexisting effects.

### Design implications

- Split `social` into two variables: `social_need` (homeostatic drive) and `social_energy` (depleted by interaction, recovered by solitude/sleep)
- Remove the 10-action threshold entirely; make accumulation continuous from first isolation
- Use sub-linear (asymptotic) accumulation, not linear
- Superficial contact provides partial relief (~10–20% of meaningful contact)
- Negative/ambiguous contact at high loneliness may increase need — model via quality detection
- Introversion → scales social energy depletion per interaction (not social need accumulation rate)
- Neuroticism → scales social need accumulation rate and peak sensitivity
- Trait loneliness (a character property) should set a floor below which `social_need` doesn't fully return to zero — this is a chargen parameter to add

### Key sources
- Tomova et al. 2020, *Nature Neuroscience* — 10h isolation = midbrain craving response (PMID 33230328)
- Ding et al. 2025, *Nature* — hypothalamic social homeostasis circuit (PMID 40011768)
- Buecker et al. 2020, *European J Personality* — Big Five × loneliness meta-analysis (N=93,668) (DOI 10.1002/per.2229; no PMID — journal not indexed in MEDLINE)
- Zelenski et al. 2020, *J Personality* — sociable behavior and fatigue lag (PMC7260435)
- Sandstrom & Dunn 2014, *Personality and Social Psychology Bulletin* — weak ties and wellbeing (PMID 24769739)
- Cacioppo & Cacioppo 2018 — loneliness and social threat detection
- PMC review — neural circuitry of social homeostasis (PMC8580010)

---

## Stress Creep and HPA Axis Self-Reinforcement

**Applies to:** `tickNeurochemistry()` in `state.js` — the `stress += hours * 1` block (line ~451).
**Status:** ✓ IMPLEMENTED 2026-02-20. Replaced `+1 pt/hr above 50` with exponential decay toward 0; rate 0.46/hr at baseline (t½ ≈ 90 min), halved at max rumination → 0.23/hr (t½ ≈ 3h), matching Zoccola 2020 PMID 30961457.

**Current debt:** `if (s.stress > 50) { s.stress = Math.min(100, s.stress + hours * 1); }` — a linear rate above a scalar threshold. Both the rate (1 pt/hr) and the threshold (50) are chosen. The approximation debt comment at the site correctly names this as the wrong model — confirmed by the research below.

---

### Question 1: Timescales of HPA sensitization

**The mechanisms operate on three distinct timescales, none of which are hours.**

**Acute cortisol response (minutes):**
After a psychological stressor, salivary cortisol peaks 10–20 minutes after stressor *cessation* (i.e., ~25–30 minutes from onset). Return to baseline: 45–60 minutes post-stressor for most participants. Cortisol plasma half-life: 70–120 minutes.

- Peak timing and recovery kinetics: Kirschbaum et al. TSST data, summarized in Kudielka et al. 2009 TSST review (PMC5314443). Absolute recovery at 60 min post-stressor: Strahler et al. 2020 (PMID 31711229, DOI 10.1210/clinem/dgz190).
- Cortisol half-life 70–120 min: Bright et al. 2019 (PMID 31749763, PMC6848065).

**Cross-sensitization (hours to days):**
A single acute stressor can sensitize HPA reactivity to subsequent novel stressors. Onset is within 24 hours (measurable the next day). Duration depends on the triggering stressor's length:
- 5-minute triggering stressor → sensitization present at 2 days, absent at 7 days.
- 2-hour triggering stressor → sensitization persists through 7 days.
- Key determinant of persistence: length of initial stressor, not intensity.

- Source: Belda et al. 2016, *Scientific Reports* (PMID 27511270; PMC4980629). Rodent model (IMO/open-field paradigm). Statistically significant ACTH enhancement: χ²(3)=17.4, p=0.001.

**Gland-mass changes (weeks):**
Structural HPA adaptation — changes in corticotroph and adrenal cortex cell mass — operates on a timescale of weeks. Cell half-lives: corticotrophs ~6 days, adrenal cortex ~12 days. Measurable hormonal dysregulation from gland mass changes appears after "a few weeks or longer" of sustained stress.

- Source: Karin et al. 2020, *Molecular Systems Biology* (PMID 32672906; PMC7364861; DOI 10.15252/msb.20209510). Mathematical modeling incorporating empirical half-life data.

**Chronic VCS recovery (days to weeks):**
After 1 week of twice-daily variable stressors, HPA hypoactivity emerged at 4–7 days post-stress (not immediately), and normalized at 30 days. This reveals a *delayed* hypoactivity phase — the system undershoots after chronic drive is removed before recovering.

- Source: Ostrander et al. 2006, *Endocrinology* (PMID 16396985; PMC1815381). Rodent model.

---

### Question 2: Shape of escalation

**Not linear. Not threshold-gated. Three distinct patterns depending on timescale:**

**Within-acute-episode:** Cortisol response is approximately bell-shaped — rapid rise from HPA activation (minutes), peak 10–30 minutes post-stressor, then exponential decay via glucocorticoid negative feedback. The decay is governed by the plasma half-life (~70–120 min). Rise and fall rates are nearly symmetric at the hormonal level in healthy individuals: reactivity slope β = 0.41; recovery slope β = −0.42 (Lier et al. 2023, PMID 36820051, PMC9937905, DOI 10.1016/j.bbih.2023.100598).

**Important: near-symmetric rise and fall** (not "builds faster than fades") is the healthy-individual pattern for acute cortisol. Impaired recovery (slower fall) is a marker of allostatic load and chronic stress history, not a universal property of the acute response.

**Within-day (hours):** No literature supports a self-reinforcing within-day escalation in the cortisol/HPA signal itself under normal psychological stress. However, **rumination creates functional within-day escalation via a behavioral mechanism**: repeated reactivation of the stress response through ruminative thought re-triggers HPA pulses, maintaining elevated cortisol above what a single acute stressor would produce. Quantified effect: at 1.5 SD above-average rumination combined with above-average stress, next-morning waking cortisol was ~23.6% higher (Zoccola et al. 2020, PMID 30961457, PMC6783329).

This is the mechanistic basis for whatever within-day self-reinforcement exists: **not the HPA axis escalating on its own, but rumination and lack of recovery maintaining repeated re-activation.**

**Cross-day/chronic (days to weeks):** Cross-sensitization shows progressive decline over days (not escalation): strong sensitization the day after, diminishing over 2–7 days. Gland-mass changes (true structural adaptation) show exponential trajectories — not linear, with a time constant measured in weeks.

**Recovery asymmetry (the real asymmetry):**

The most significant recovery asymmetry in the literature is not rise-vs-fall *within* an episode but the *post-chronic-stress* period. After chronic variable stress (1 week), the HPA axis took 30 days to fully normalize. The adaptation required ~4–5× longer to reverse than it took to establish (Ostrander et al. 2006, PMID 16396985). This is allostatic load in its operational sense: the system can't quickly undo structural changes that built over weeks.

**Positive feedback mechanisms (contextual, not universal):**

Under chronic stress conditions specifically, glucocorticoids can *increase* CRH expression in the central amygdala (rather than suppressing it via the usual negative feedback loop). This is a positive feedback arm that operates in chronically stressed states — documented in the Herman et al. 2016 HPA regulation review (PMID 27065163, PMC4867107). The CRH–norepinephrine–CRH loop is also cited as a potential self-reinforcing mechanism in hypercortisolism (directional only — no specific rate cited in the sources reviewed). These are structural changes, not within-hour dynamics.

**Does it saturate?** Yes. Saturation is built into the biology: adrenal cortex has a ceiling on ACTH-stimulated cortisol output; glucocorticoid negative feedback (fast, intermediate, and delayed) limits escalation. The Karin et al. 2020 mathematical model explicitly uses bounded exponentials. In a 0–100 simulation scale, a ceiling at 100 is structurally correct.

---

### Question 3: HPA sensitization vs. allostatic load — which is relevant within a day?

**They are distinct mechanisms and neither is the right model for within-day simulation.**

**HPA sensitization** is the phenomenon where prior stress exposure increases the *reactivity* of the HPA axis to subsequent novel stressors. Timescale: the enhanced reactivity emerges within hours, measurable the next day, and fades over days to weeks depending on initial stressor severity. The mechanism involves synaptic plasticity in PVN CRH neurons (increased excitatory input frequency ~100%, reduced inhibitory input frequency ~50% after 14-day CVS — Flak et al. 2009 cited in PMID 27054552, PMC4891782). This is a days-scale effect on *reactivity to new stressors*, not a within-day self-escalating process.

**Allostatic load** is the McEwen (1998) concept of cumulative physiological wear from repeated or sustained allostatic responses (PMID 9629234, DOI 10.1111/j.1749-6632.1998.tb09546.x). It is a weeks-to-years phenomenon — the chronic recalibration of biological setpoints from sustained stress. It explains why a person who has been stressed for months has different HPA dynamics than someone who is stressed today. It is not a within-day mechanism.

**What actually operates within a day:**
1. The acute HPA response: cortisol spike peaking at ~25 min post-stressor onset, returning to baseline within 60–90 minutes. No self-reinforcement from the HPA axis itself in this window.
2. Behavioral self-reinforcement via rumination: replaying or anticipating stressors re-triggers HPA pulses repeatedly. This *mimics* a self-escalating signal but is mediated by thought pattern, not HPA biology.
3. Sympatho-adrenal (SAM) axis response: faster, via norepinephrine. The HPA axis is the *slower* arm — it is not what drives minute-to-minute subjective stress escalation within a session.

**For a within-day simulation, the correct model is:**
- Stress state should reflect *accumulated unresolved acute activations*, not an autonomous self-escalating HPA rate.
- The self-reinforcing term is better attributed to the `rumination` personality parameter already in the simulation.
- A linear `+1 pt/hr above 50` is wrong in both mechanism and timescale.

---

### Question 4: Practical calibration targets

**The current `+1 pt/hr above 50` is the wrong model shape, not just a miscalibrated rate.**

The within-day mechanism to replace it with is **stress accumulation that decays without active recovery**, combined with **rumination-scaled re-activation resistance**. The self-reinforcing behavior should be:

- **Not a constant rate above a threshold** — no biological mechanism supports this within hours.
- **A resistance to decay** — the real phenomenon is that high stress *prolongs* recovery time (impairs glucocorticoid negative feedback via GR downregulation under chronic conditions) rather than adding a constant increment.
- **The threshold shape is directionally wrong**: HPA sensitization doesn't have a clean threshold at 50; reactivity increases continuously, with greater acceleration at higher chronic burden.

**What the literature supports as a within-day model:**

The appropriate shape is: stress decays toward baseline (via normal HPA negative feedback) at a rate that *decreases* as stress is high and rumination is high. At low stress, decay is fast (cortisol half-life ~80 min). At high stress + high rumination, decay is slower because ruminative re-activation continuously re-triggers the response. This is not self-escalation of a quiescent baseline — it is impaired recovery.

**Magnitude calibration:**
- Cortisol half-life (plasma): 70–120 min. In a 0–100 game-time stress scale at normal/low-stress baseline, stress should halve roughly every 1–2 hours of genuine rest, not faster.
- The rumination effect at 1.5 SD above average: ~23.6% higher next-morning cortisol (Zoccola et al. 2020, PMID 30961457). This is a next-day effect, not within-day, but is the only quantified rumination × stress interaction in the sources reviewed.
- Cross-sensitization after a major stressor: HPA reactivity to subsequent stressors elevated for up to 7 days (Belda et al. 2016, PMID 27511270). This argues for a multi-day "sensitized baseline" state following high-stress days, not a within-day constant.

**Proposed replacement model direction:**

Rather than `stress += hours * 1 when stress > 50`, consider:
1. Remove the self-reinforcing upward creep entirely for within-day.
2. Reduce the decay rate of stress when `rumination` is high — stress falls slower toward baseline for high-rumination characters, capturing the ruminative re-activation mechanism.
3. For the multi-day effect: track a slow-decaying "sensitization" state (separate from instantaneous `stress`) that elevates reactivity for subsequent stressors. This maps correctly to the days-timescale cross-sensitization literature.

The exact replacement coefficients remain approximation debts — the literature provides timescales and direction but not direct 0–100 scale calibration targets. Any replacement should be explicitly marked as derived-from-direction, not derived from a specific quantitative source.

---

### Key sources

- Herman et al. 2016, *Comprehensive Physiology* — HPA regulation review, acute vs. chronic circuitry, positive feedback mechanisms (PMID 27065163, PMC4867107)
- Karin et al. 2020, *Molecular Systems Biology* — mathematical model, corticotroph/adrenal half-lives 6/12 days, weeks-timescale dysregulation (PMID 32672906, PMC7364861, DOI 10.15252/msb.20209510)
- Belda et al. 2016, *Scientific Reports* — cross-sensitization onset/persistence, 2–7 day window (PMID 27511270, PMC4980629)
- Ostrander et al. 2006, *Endocrinology* — 30-day recovery after 1-week CVS, delayed hypoactivity at 4–7 days (PMID 16396985, PMC1815381)
- Lier et al. 2023, *Brain, Behavior and Immunity – Health* — rise/fall symmetry β=0.41/−0.42; CAR predicts impaired recovery (PMID 36820051, PMC9937905, DOI 10.1016/j.bbih.2023.100598)
- Zoccola et al. 2020, *Cognition and Emotion* — rumination × daily stress → 23.6% higher next-morning cortisol (PMID 30961457, PMC6783329)
- McEwen 1998, *Annals of the NY Academy of Sciences* — allostatic load definition, HPA wear-and-tear (PMID 9629234, DOI 10.1111/j.1749-6632.1998.tb09546.x)
- Strahler et al. 2020, *JCEM* — TSST cortisol peak at +10/+20 min post-cessation, baseline by +60 min (PMID 31711229, DOI 10.1210/clinem/dgz190)
- Bright et al. 2019, *PMC* — cortisol half-life 70–120 min (PMID 31749763, PMC6848065)
- Belda et al. 2015, *Stress* — cross-sensitization review, short stressors, behavioral persistence (PMID 26300109)
- Flak et al. 2009 [cited in PMID 27054552, PMC4891782] — synaptic plasticity in PVN CRH neurons after chronic stress (~100% mEPSC increase, ~50% mIPSC decrease)

---

## NT Rate Constants: Mood-Primary Systems

**Applies to:** `ntRates` table in `state.js` — the `[upRate, downRate]` pairs for `serotonin`, `dopamine`, `norepinephrine`, and `gaba`.
**Status:** ✓ IMPLEMENTED 2026-02-20. DA raised from `[0.04, 0.06]` → `[0.35, 0.45]` (acute NAc recovery 1-2h; falls faster, downRate > upRate). NE raised and asymmetry corrected from `[0.08, 0.12]` → `[0.55, 0.45]` (rises fast, LC phasic; recovery 45-90 min per PMID 6727569; upRate > downRate). Serotonin and GABA unchanged.

**Current debts:** All four rate pairs are chosen approximations with a note that "the asymmetries match the qualitative biological direction but magnitudes are uncalibrated." This research validates the directions and provides grounding for the magnitudes.

---

### The core question

The simulation runs at the behavioral/mood timescale — hourly steps, 0–100 scale. The relevant timescale is **tonic/ambient level recovery**: after a sustained perturbation (stress, social event, bad sleep), how many hours does the system take to return to baseline? Synaptic clearance (seconds via reuptake transporters) is the wrong timescale — it is irrelevant at the hourly step granularity. The simulation models ambient extracellular levels and firing rates, not individual synaptic events.

---

### Serotonin

**Current rates:** `[0.015, 0.025]` — described as "days half-life — very slow"

**Tonic/ambient timescale:**

Ambient 5-HT recovery operates on a timescale set by **synthesis rate**, not clearance. SERT synaptic clearance half-life is ~1 second (millisecond range, saturated at physiological concentrations — mathematical model: PMC2942809). This is irrelevant for the simulation timescale.

The rate-limiting factor for ambient level recovery is **tryptophan hydroxylase 2 (TPH2)** activity. TPH2 is only ~50% saturated at normal tryptophan concentrations, making synthesis rate sensitive to substrate availability. When ambient 5-HT has been depleted (e.g., after sustained stress or sleep deprivation), recovery depends on:

1. **Tryptophan availability at raphe neurons** — recovers over hours as plasma tryptophan normalizes.
2. **TPH2 synthesis rate** — 5-HT tissue turnover rate in rat brain: **half-life ~15 hours** (PMID 2474630: Serotonin turnover in rat brain during semistarvation with high-protein and high-carbohydrate diets). This is the rate at which newly synthesized 5-HT replaces the pool.
3. **CSF 5-HIAA nadir** after acute tryptophan depletion: 8–12 hours after the depleting drink; mood effects (at 60%+ depletion) emerge at ~6 hours and dissipate within 24 hours as tryptophan normalizes (PMID 9608574: Tryptophan depletion during continuous CSF sampling; PMC3756112: ATD review).

**Sleep modulation:** Extracellular 5-HT is highest during active wakefulness and lowest during REM sleep — a 2:1 to 3:1 ratio across states measured in dorsal raphe and hippocampus by microdialysis (PMID 7922546: cat DRN microdialysis; PMID 10375707: rat hippocampus). After sleep deprivation, serotonin levels remain elevated during subsequent recovery sleep (PMID 14522011), and 5-HT metabolism increases during REM rebound (PMID 6204343). This means REM sleep facilitates 5-HT turnover and resynthesis — the simulation's existing link between sleep quality and serotonin recovery is mechanistically correct.

**Stress effects:** Uncontrollable stress produces large increases in DRN extracellular 5-HT. Controlled/escapable stress has weaker effects. Region-specific — some regions (BLA, ventral hippocampus, mPFC) show elevated 5-HT 24 hours after inescapable tailshock, indicating that severe stress can produce effects persisting a day or more (source: Serotonin and Stress review, *Neuropsychopharmacology*, PMID not retrieved but cited in search results).

**Asymmetry:** Rises slowly, falls relatively faster — supported by the biology. SERT clearance is fast (seconds) but synthesis through TPH2 is slow (hours). When 5-HT is elevated acutely (e.g., a positive social event), SERT rapidly clears the excess. When depleted, resynthesis is rate-limited by TPH2 and tryptophan availability. This gives a slower-rising, faster-falling profile at the ambient level.

Quantitative: The ATD literature shows plasma tryptophan drops to nadir within 4–6 hours and recovers toward 85% of baseline by 24 hours. CSF 5-HIAA nadir is at 8–12 hours. Behavioral effects detectable at 60%+ depletion, reversing as tryptophan recovers. No specific upRate/downRate measured in ambient level terms — the asymmetry is directional-only from the mechanism.

**Calibration target (updated 2026-02-23):**

The current `downRate: 0.025` implies t½ = ln(2)/0.025 ≈ **28 hours** for falling. The current `upRate: 0.015` implies t½ = ln(2)/0.015 ≈ **46 hours** for rising.

The prior conclusion ("plausible, based on ~15h rat tissue turnover") was based on the wrong timescale. 5-HT pool turnover ≠ mood effect half-life. Pool turnover is the rate at which newly synthesized 5-HT replaces the existing pool — it doesn't directly bound how fast a mood perturbation resolves.

**The directly relevant calibration is the ATD behavioral literature:**

Dougherty et al. 2008 (PMID 18452034): plasma tryptophan nadir at 4–5 hours post-depletion drink (89–96% depletion at nadir). Young 1993 (PMID 3931142) and Moreno et al. 1999 (PMID 10459398): mood depression detectable at 5–6 hours, not detectable at 24 hours. Biochemical recovery after tryptophan re-feeding: <1 hour. Behavioral recovery: within 24 hours.

This gives effective mood perturbation half-life of **~6–12 hours** for a near-total (90%+) depletion. Real-life perturbations are far smaller than ATD → the effective mood half-life for daily events is likely shorter, not longer.

Post-stressor 5-HT recovery (Forster et al. 2008, PMC2474795): extracellular 5-HT in central amygdala returns to baseline ~40–60 minutes after a 40-minute restraint stressor. This grounds the acute perturbation at 1–2 hours.

**Corrected calibration target:**

k ≈ 0.06–0.08/hr → t½ ≈ 9–12 hours. This is **2–3× faster** than current values.

Asymmetry direction (downRate > upRate) remains correct: SERT clears excess rapidly (seconds); resynthesis through TPH2 is rate-limited by tryptophan availability and enzyme kinetics (hours). Falls faster than rises.

Suggested: `[0.06, 0.08]` — upRate 0.06/hr (t½ ~11.5h), downRate 0.08/hr (t½ ~8.7h). More conservative than the 1–2h acute perturbation recovery (appropriate since the simulation conflates acute and sustained mood effects), but grounded in the ATD behavioral timescale rather than rat tissue turnover.

**Status:** Not yet implemented. Current values `[0.015, 0.025]` remain as approximation debt.

Sources: PMID 18452034, PMID 3931142, PMID 10459398, PMC3756112, PMC2474795

---

### Dopamine

**Current rates:** `[0.04, 0.06]` — described as "~12-24h half-life"

**Tonic/ambient timescale:**

DAT synaptic clearance: fast, seconds to sub-second range (comparable to SERT). Region-dependent: PFC has lower DAT density, so extracellular dopamine clears more slowly there than in striatum (Controls of Tonic and Phasic DA Transmission: PMC2713129). Irrelevant at hourly granularity.

**Acute stress perturbation and recovery:**

In vivo microdialysis during acute restraint stress in rats (nucleus accumbens):
- Dopamine elevated to ~120–160% of baseline during early stress.
- **Returns to baseline within 40–60 minutes** while restraint continues — the system habituates mid-stress (PMID 1606494: Repeated stressful experiences and limbic DA; PMID 2018923: DA and ACh during/after stress).
- After stress cessation, a secondary DA increase occurs (liberation response), lasting ~40 minutes, then returns to baseline.

This gives a **total perturb-and-recover cycle of roughly 1–2 hours** for acute stress-induced dopamine elevation in NAc. This is faster than the current `downRate: 0.06` suggests (implied half-life ≈ 11.5 hours).

**Chronic/repeated stress:** With repeated daily restraint:
- Days 1–3: DA still rises during stress.
- Days 4–6: DA response completely abolished during stress (full habituation), but the post-stress liberation increase remains unchanged (PMID 1606494).

This means: acute DA perturbation recovers in **1–2 hours**. Chronic stress suppresses tonic DA capacity over days, not within a session.

**Social defeat:** Dopamine in NAc/mPFC rose to ~130–160% during social threat (PMID 8793094: Social defeat microdialysis). Post-threat recovery: consistent with the ~40–60 min pattern from restraint data, though this paper does not report specific recovery timing.

**Asymmetry:** DA falls faster than it rises under stress conditions — the post-stress liberation is a separate mechanism from the stress-induced elevation. The tonic firing-rate recovery (VTA) after chronic stress operates on days, not hours (stress-induced plasticity changes HCN channel expression, requiring new protein synthesis — timescale: days; PMC9674332: Stressed and Wired review). This means:

- **Acute DA perturbation recovery: 1–2 hours** (NAc, microdialysis)
- **Tonic VTA firing capacity impaired by chronic stress: days to recover** (different mechanism)

The simulation models both by conflating them into one variable. This is a simplification. The acute recovery (1–2h) argues for higher downRate than current. The chronic suppression by sustained stress is handled separately via the `dopamineTarget()` function.

**Calibration target:**

The acute DA recovery evidence (~1–2 hours to return to baseline from stress peak) suggests:
- ln(2)/t½ where t½ ≈ 1–2h → rate ≈ 0.35–0.69 per hour

This is dramatically faster than the current `downRate: 0.06`. However, the simulation's dopamine variable must represent both acute perturbation dynamics and tonic/chronic state. If the chronic state is handled by the target function (which drifts toward a lower target under chronic stress), then the rate constant only needs to model acute recovery speed — suggesting it should be much higher than 0.06.

**Confidence:** Moderate. The 40–60 min recovery figure is from rat restraint stress in NAc (not human, not all regions). The VTA firing rate recovery after chronic stress is a different timescale (days) handled separately. The acute-vs-chronic distinction is the key calibration design question.

---

### Norepinephrine

**Current rates:** `[0.08, 0.12]` — described as "hours half-life — responds quickly"

**Tonic/ambient timescale:**

NET clearance: fast, seconds — removes ~80–90% of synaptically released NE (StatPearls: Noradrenergic Synapse; PMC1518795). Glucocorticoids acutely block glial transporter clearance of NE during stress, prolonging extracellular availability.

**Stress-induced NA turnover recovery:**

The most direct quantitative data:

Noradrenaline turnover (measured by MHPG/NA ratio via uHPLC) during cold swim stress in rat brain:
- MHPG/NA ratio **peaked at 45 minutes** after stress onset.
- **Returned to baseline within 90 minutes** after stress onset (eLife reviewed preprint: Noradrenaline release from locus coeruleus shapes stress-induced hippocampal gene expression, DOI pending).

This means: after a moderate acute stressor, NE turnover recovers to baseline in approximately **45–90 minutes** total (i.e., ~30–45 minutes after the peak, if peak is at 45 min).

Supporting evidence from the aging study (PMID 6727569: Recovery of stress-induced increases in noradrenaline turnover in old vs. young rats):
- Young rats (2 months): MHPG-SO4 returned to control levels in **all brain regions within 6 hours** after 3-hour immobilization stress.
- Old rats (12 months): recovery delayed to >24 hours in hypothalamus, amygdala, pons/medulla, midbrain.
- This provides an upper bound: young-adult NE recovery from a **3-hour immobilization** is complete within 6 hours.

**Sleep modulation:** LC is completely silent during REM sleep — tonic firing rates: waking > NREM > REM (nearly zero). This NE-free environment during REM is the mechanism for NE "clearance" and recovery. The restoration timescale during sleep cycles with the infra-slow LC oscillations (~50-second cycles gating NREM-REM transitions — *Nature Neuroscience* 2024). After sleep deprivation, NE recovery during subsequent sleep took **10–30 minutes of recovery sleep** in normal animals; 1–2 hours in mTOR-disrupted animals (PMC11244971: Restoration of LC NE transmission during sleep).

**Asymmetry:** NE rises faster under stress than it falls — this is supported. The LC responds within seconds to stressors; return to pre-stress baseline takes 45–90 minutes for moderate stressors, up to several hours after prolonged stress. The current `upRate: 0.08, downRate: 0.12` correctly places downRate > upRate (falls faster than rises), but the asymmetry may actually be inverted: **NE rises very fast** (phasic firing response is near-instantaneous) and **falls more slowly** (requires actual clearance and LC re-quiescence). The simulation's convention where `upRate < downRate` means "rises slower than it falls," which may be wrong for NE direction.

**Important clarification on simulation convention:** In the simulation, `upRate` is the rate at which the level approaches a higher target, and `downRate` is the rate at which it approaches a lower target. For NE:
- When stressed (target elevated), NE should rise quickly → `upRate` should be high.
- When calm (target at baseline), NE should return to baseline over ~1–2h → `downRate` should be consistent with that timescale.

The 45–90 minute recovery to baseline for a moderate stressor implies:
- ln(2) / 1–1.5h ≈ **0.46–0.69 per hour** for the downRate (falling after stress)
- NE rises to peak very rapidly (minutes), suggesting upRate should also be high, not lower than downRate.

The current `[0.08, 0.12]` is much too slow for what the literature describes (implied half-life: ~8.7h rising, ~5.8h falling). The actual literature-supported timescale is **2–10× faster**.

**Confidence:** Moderate-to-high. The 45–90 minute recovery is from a published but preprint-status paper; the 6-hour bound from PMID 6727569 is peer-reviewed. Direction is well-established; magnitude needs the preprint to be formally published.

---

### GABA

**Current rates:** `[0.03, 0.05]` — described as "~12-24h, chronic stress mechanism is slow"

**Tonic/ambient timescale:**

GABA dynamics at the behavioral timescale are not well-captured by synaptic kinetics. The relevant mechanisms are:

1. **Acute stress: prefrontal GABA decreases by ~18%** within minutes during psychological threat. Measured by 7T/3T MRS in humans. Recovery within the session: partial — difference between threat and safe conditions was significant during blocks 1–3 (0–24 min) but not block 4 (25–32 min), suggesting partial recovery within ~25–30 minutes (PMID 20634372, PMC3107037: Hasler et al. — prefrontal GABA during threat-of-shock).

A second 7T MRS study (PMID 28180078, PMC5280001: Simkovic & Lamm, 7T after TSST) found **no significant GABA change** 30 minutes after the Trier Social Stress Test. This apparent contradiction is likely explained by stressor type: sustained psychological threat (threat-of-shock) vs. post-stressor recovery measurement (TSST ended, then measured 30 min later). The TSST result suggests that by 30 minutes post-stressor, GABA has substantially recovered.

Together: **GABA acutely drops during sustained threat, recovers within ~20–30 minutes after threat cessation.**

2. **Neurosteroid modulation (allopregnanolone):** Acute stress induces allopregnanolone (ALLO) release in the brain within minutes. ALLO is a potent positive allosteric modulator of GABA-A receptors, acting as a homeostatic compensatory mechanism — it increases GABAergic tone to counter stress-induced GABAergic deficits. This ALLO response peaks acutely and functions as a buffering mechanism, not a sustained elevation. Tolerance develops within 90 minutes at anesthetic ALLO doses (tolerance review PMC3031054).

3. **Chronic stress GABA depletion:** This is the slow mechanism correctly identified in the simulation. Chronic stress progressively reduces cortical GABA concentrations (measured by MRS in MDD: reduced anterior cingulate GABA, PMC3758115). This operates on a weeks timescale, not hours.

**Synthesis and transport:** GAD65 (synaptic GABA synthesis) and GAT-1 (reuptake — handles ~80% of synaptic GABA) are the primary regulators of ambient GABA. De novo synthesis from glutamate via GAD is rapid (not rate-limiting in the way TPH2 limits serotonin synthesis). Ambient GABA levels are efficiently maintained by the GAT system; excess GABA is cleared quickly.

**Asymmetry:** During acute stress, GABA falls fast (within minutes, as shown by the threat-of-shock MRS study). Recovery is relatively fast too — within ~20–30 minutes after threat cessation. This suggests GABA at the acute timescale is more symmetric than serotonin, with fast fall and fast recovery for acute perturbations.

The chronic stress GABA depletion (the "slow mechanism") genuinely operates on weeks, not days, and is handled by `gabaTarget()` in the simulation, which is the right architecture.

**Calibration target:**

The current rates are intended for the chronic mechanism. If GABA in the simulation is also responding to acute stressors (which it should — the `adjustNT('gaba', ...)` calls for pain and nausea suggest it does), then the rate constants may be too slow for acute perturbations.

The acute MRS evidence suggests GABA recovers within 20–30 minutes (rate ≈ ln(2)/0.5h ≈ 1.4/hr) from acute drops during sustained threat. But the simulation step is hourly, and the chronic target mechanism is what primarily drives GABA over hours. The acute drops from `adjustNT` calls in the tick function already bypass the exponential drift. So the `ntRates` GABA values may only need to model the slow return to `gabaTarget()`, not acute within-minute drops.

For that purpose (return to chronic target after slow stress-driven depletion), the current `[0.03, 0.05]` is plausible but uncertain — the chronic depletion literature gives timescales of weeks (too slow for any hourly rate). This is likely correct as a "background correction" rate — the simulation doesn't need to model weeks-long structural GABA changes, just day-level fluctuations around the target.

**Confidence:** Low-to-moderate. The acute MRS evidence is the most directly relevant but is from a specific paradigm (threat-of-shock vs. TSST). The chronic mechanism literature doesn't map cleanly to hourly rate constants. The two mechanisms should ideally be separated (acute acute-drop recovery vs. chronic depletion rate), but combining them in a single rate pair is a structural approximation.

---

### Summary table

| System | Current [up, down] | Implied t½ (up/down) | Literature-supported tonic t½ | Asymmetry direction (lit) | Confidence |
|---|---|---|---|---|---|
| Serotonin | [0.015, 0.025] | 46h / 28h | ~15h tissue turnover (rat); ~24h behavioral effects | Falls faster than rises (synthesis-limited recovery) | Moderate |
| Dopamine | [0.04, 0.06] | 17h / 12h | **1–2h acute** (NAc microdialysis); days for chronic tonic | Falls faster (acute returns in 40–60 min) | Moderate |
| NE | [0.08, 0.12] | 8.7h / 5.8h | **1–2h acute** (NA turnover); 6h upper bound (PMID 6727569) | **Rises fast, falls slower** (LC instantaneous; recovery 45–90 min) | Moderate-high |
| GABA | [0.03, 0.05] | 23h / 14h | Acute: ~20–30 min recovery; Chronic: weeks | Symmetric for acute; chronic is slow directional | Low-moderate |

---

### Key calibration issues

**1. Dopamine and NE rate constants are dramatically too slow for acute perturbations.**

The acute NAc dopamine recovery (40–60 min) and NA turnover recovery (45–90 min after stress) imply per-hour rates of 0.35–0.69, not 0.04–0.12. The current values would place the half-life at 6–17 hours — an order of magnitude too slow for the acute mechanism.

However, there is a design question: if `dopamineTarget()` and `norepinephrineTarget()` already handle the direction of drift (target falls under stress, so DA/NE fall toward a lower target), then the rate constants control **how quickly the level follows the target**, not how quickly a perturbation dissipates on its own. In that framing, the rate constants are asking: given that the target dropped (because stress started), how fast does the level reach the new target? This is the correct framing for the exponential approach architecture.

In that case: if a stressful event lowers the DA target suddenly, the level should reach the new target within 1–2 hours → rate ≈ ln(2)/1h ≈ 0.69. This argues for substantially higher rates than current.

**2. The NE asymmetry direction may be inverted.**

The current convention `upRate < downRate` means "rises slower, falls faster." For NE under stress: it rises nearly instantaneously (LC phasic firing) but requires 45–90 minutes to clear. This is arguably "rises faster, falls slower" — opposite of the current convention. The comment in the code notes NE "responds quickly" but has `upRate: 0.08, downRate: 0.12`. If upRate means "rate toward higher target" and NE rises toward a high target when stressed, the upRate should be the larger of the two numbers. This should be verified against the actual drift loop logic.

**3. Serotonin rates may be approximately correct in absolute magnitude but the asymmetry direction is right.**

The ~15h tissue turnover in rat, combined with the ATD evidence showing mood effects lasting ~24 hours, is consistent with the current implied half-lives of 28–46 hours (somewhat slower than rat data, but humans may differ). The downRate > upRate asymmetry (falls faster) is empirically supported by the synthesis-limited recovery mechanism.

**4. GABA's rate constants serve two different mechanisms conflated in one variable.**

Acute GABA drops (from pain, nausea, stress) should recover in ~20–30 minutes, but the hourly drift rates can't capture this — it happens within a single step. The chronic depletion mechanism (weeks) isn't well-served by per-hour rates either. The `adjustNT` call architecture handles the acute drops; the target-drift architecture handles the chronic trend. The `ntRates` GABA values probably don't matter much for either — they're the correction rate when the level isn't at target, which in practice is governed by the target function returning to normal more than by the rate constant.

---

### What should change

The most important correction is to **dopamine and norepinephrine**, where the current rates are an order of magnitude too slow for the timescales in the literature. Whether to raise them substantially (to match the acute 1–2h recovery) or leave them slower (to model that tonic baseline recovery after chronic suppression takes longer) is a design decision that depends on how `dopamineTarget()` and `norepinephrineTarget()` are structured.

Recommended approach:
- Raise NE rates significantly (toward ~0.3–0.5) to capture the known 1–2h acute recovery.
- Raise dopamine rates similarly for acute perturbations.
- Accept that the target functions handle the chronic direction — the rate constant should model how fast the level follows a changed target, not how long chronic suppression lasts.
- Keep serotonin rates as-is or adjust slightly toward faster (literature supports ~15–24h, current implies 28–46h — possibly 1.5–2× faster would be better grounded).
- GABA rates: low priority given the architectural analysis above.

All changed rate constants should be flagged as `// Grounded in literature timescale; scale factor to 0-100 is still chosen.`

---

### Key sources

- PMID 2474630 — Serotonin turnover (T1/2 ~15h) in rat brain
- PMC2942809 — Serotonin synthesis/release/reuptake mathematical model (SERT clearance seconds)
- PMID 9608574 — ATD continuous CSF sampling: CSF TRP nadir 7–10h, 5-HIAA nadir 8–12h
- PMC3756112 — ATD review: plasma TRP nadir 4–6h, recovery to 85% baseline by 24h; mood effects at 60%+ depletion
- PMID 7922546 — Cat DRN microdialysis: 5-HT waking 100%, SWS 50%, REM 38%
- PMID 10375707 — Rat hippocampus 5-HT levels by sleep-wake state
- PMID 14522011 — Total sleep deprivation increases extracellular 5-HT in rat hippocampus
- PMID 6204343 — Increased brain serotonin metabolism during REM rebound
- PMID 1606494 — Repeated stressful experiences: DA returns to baseline 50–60 min into restraint; liberation response 40 min post-stress
- PMID 2018923 — DA and ACh during/after stress independent of pituitary-adrenocortical axis
- PMID 8793094 — Social defeat stress: selective mesocorticolimbic DA changes (microdialysis)
- PMC2713129 — Controls of tonic and phasic DA in dorsal and ventral striatum
- PMC9674332 — Stressed and Wired: VTA stress response and chronic plasticity
- PMID 6727569 — Recovery of NA turnover: young rats recover within 6h after 3h immobilization; old rats delayed >24h
- Elife preprint DOI pending (Noradrenaline release from LC shapes stress-induced hippocampal gene expression) — MHPG/NA peak at 45 min, baseline within 90 min
- PMC11244971 — Restoration of LC NE transmission during sleep: 10–30 min recovery sleep normal; 1–2h with mTOR disruption
- *Nature Neuroscience* 2024 (Infraslow LC fluctuations gate NREM-REM cycle) — ~50s LC oscillation; LC quiescent during REM
- PMID 20634372 / PMC3107037 — Hasler et al.: prefrontal GABA −18% during threat-of-shock; partial recovery by block 4 (~25–32 min)
- PMID 28180078 / PMC5280001 — 7T MRS after TSST: no significant GABA change 30 min post-stressor
- PMC3031054 — Allopregnanolone tolerance within 90 min at anesthetic doses
- PMC3268361 — The reciprocal regulation of stress hormones and GABA-A receptors
- PMC4303399 — Anxiety disorders and GABA neurotransmission
- PMC3758115 — Decreased GABA in anterior cingulate in panic disorder (chronic depletion evidence)

---

## Energy Drain: Base Rate and Hunger Multipliers

**Applies to:** `tickNeurochemistry()` in `state.js` — `energy -= hours * 3 * hungerDrainMultiplier` (lines ~438–441). Multipliers: 1.3× at `hunger > 40`, 1.8× at `hunger > 70`.
**Status:** ✓ IMPLEMENTED 2026-02-20. Multipliers reduced: 1.8→1.3× (severe hunger), 1.3→1.1× (moderate), per Monk 1996 PMID 8877121 and Gailliot & Baumeister 2007 PMID 17760605. Circadian energy profile remains as approximation debt.

**Current debt:** All three parameters chosen. Direction correct; magnitudes and linearity assumption are wrong.

### Base fatigue rate

The literature does not supply "energy depletion per hour on a 0–100 scale." What is well-characterized is the **two-process model** of alertness: homeostatic sleep pressure (Process S, driven by adenosine) plus circadian alerting signal (Process C, peaking in late morning and evening). Subjective alertness is the net output — not a flat drain.

**Circadian profile shape (well-established):**

- **Morning rise:** Alertness climbs from sleep inertia through the first 1–2 hours after waking. Process C counteracts accumulating adenosine.
- **Afternoon trough (14:00–16:00):** A secondary alertness minimum driven by a 12-hour harmonic of the circadian temperature rhythm. Endogenous and independent of meal ingestion — occurs in fasted subjects who don't know the time of day. Amplitude: ~20–30% reduction on monotonic vigilance tasks relative to morning peak. (Monk et al. 1996, PMID 8877121, Chronobiol Int 13(2):123–133; Monk 2005, PMID 15892914, Clin Sports Med 24(2):e17–34.)
- **Evening wake-maintenance zone (WMZ, ~19:00–21:00):** Process C sends a strong alerting signal opposing rising adenosine; objective performance measurably improves. This is why sleep onset is difficult even when sleep-deprived until this window ends. (PMC3601314, JCSM 2013.)
- **Rapid decline after WMZ:** Homeostatic pressure wins; sleepiness rises sharply.

**Conclusion for the model:** A flat drain rate cannot represent this structure. The correct fix is a time-of-day-modulated rate, not a different scalar. The cortisol and melatonin systems already in state.js carry most of the circadian signal — energy drain should be modulated by them (or by an explicit circadian function tied to `time` and `latitude`) rather than by a flat constant.

**What the flat rate implies vs. literature:** 3 pts/hr × 16h = 48 pts total drain from full battery. Linearity is inconsistent with the non-uniform profile across the day. Dijk, Duffy & Czeisler 1992 (PMID 10607036) showed the relationship is approximately linear across normal waking hours but becomes nonlinear and steeper past 16–18 hours. Van Dongen & Dinges 2003 (PMID 12683469) quantified chronic restriction effects. Neither study provides a direct pts/hr figure for a 0–100 scale.

**Approximation debt: flat 3 pts/hr is the wrong model shape. The correct structure is circadian-modulated, with activity type as a modifier.**

### Hunger multipliers

**Best available data:** Solianik et al. 2016 (PMID 28025637, PMC5153500) — 48-hour fast in 16 amateur weightlifters. Hunger VAS rose from 42.8 to 77.2 (0–100 scale). Hunger correlated with fatigue (r = 0.62, p = 0.008) and inversely with vigor (r = −0.53, p = 0.028). **Important caveat: this is extreme prolonged fasting, not missing a single meal.**

For single-meal skipping: effects on same-day fatigue in healthy adults are smaller and inconsistent. Breakfast omission studies show subjective deterioration primarily in the late-morning window (10:00–12:00), attenuated by lunch. The signal is real but smaller than the 48-hour fasting data suggests.

**Estimated correction:** At moderate hunger (skipped meal, hunger ~40–60), the fatigue multiplier is probably in the 1.1–1.15× range, not 1.3×. At high hunger (hunger > 70, approaching the 48-hour fast context), 1.3× is more defensible than 1.8×. The current 1.8× substantially overstates the single-session effect.

**Complication: the orexin mechanism runs in the opposite direction.** Postprandial glucose rise *inhibits* orexin neurons, producing the food-coma effect after eating. This means the dominant fatigue mechanism for hunger during normal wakefulness is different from what the multiplier implies — hunger is alerting at low levels (ghrelin rises) and fatiguing at high levels (neuroglycopenic). The threshold-and-multiplier model oversimplifies this.

**Approximation debt: hunger multipliers 1.3×/1.8× are chosen and too large. Directionally supported; better values are ~1.1× / 1.3× at the same thresholds, though thresholds themselves also lack derivation.**

### Activity type matters

Walking (mild exercise, ~40% VO2max) produces a **net energy gain** in subjective energy, not a cost. Puetz et al. 2008 RCT (PMID 18277063, Psychother Psychosom 77(3):167–174) — 36 sedentary adults with persistent fatigue: low-intensity exercise → energy +20%, fatigue −65%. Effect independent of fitness changes.

Sustained cognitive work (60+ minutes) produces task-specific mental fatigue that impairs subsequent physical performance (Marcora et al. 2009, PMID 19131473, J Appl Physiol 106(3):857–864) and accumulates detectably via MRS brain perfusion (PMID 19925871, PMC2830749).

Passive wakefulness (monotony) accelerates alertness degradation — doing nothing is more draining per hour than moderate engagement (PVT time-on-task literature).

**For the simulation:** `go_for_walk` should have a net energy bonus for normal-to-moderate states (the current design already intends mood-state-dependent effects). The background wakefulness drain applies primarily to passive/low-engagement time; interaction-specific energy costs/gains sit on top of it.

### Calibration targets

The literature does not supply a clean replacement rate. What it supports:

1. Remove flat 3 pts/hr. Replace with a circadian-modulated base rate — lower in the morning, lower in the evening WMZ, higher in the afternoon trough.
2. Hunger multipliers: reduce to ~1.1× / 1.3× (directional approximation with better grounding than current 1.3×/1.8×). Still approximation debts.
3. Document `go_for_walk` energy effect as mechanistically positive at moderate states (cite Puetz 2008).
4. Add to ../../TODO.md: energy drain needs circadian modulation from time + latitude, not a flat scalar.

### Key sources

- Dijk, Duffy & Czeisler 1992 — circadian/homeostatic separation of alertness (PMID 10607036, J Sleep Res 1(2):112–117)
- Dijk & Czeisler 1995 — forced desynchrony: equal contribution of C and S (PMID 7751928, J Neurosci 15:3526–3538)
- Monk et al. 1996 — circadian determinants of post-lunch dip; 12-hour temperature harmonic (PMID 8877121, Chronobiol Int 13(2):123–133)
- Monk 2005 — post-lunch dip review; 20–30% performance reduction (PMID 15892914, Clin Sports Med 24(2):e17–34)
- PMC3601314 — improved neurobehavioral performance during WMZ (JCSM 2013)
- Van Dongen & Dinges 2003 — chronic restriction dose-response (PMID 12683469, Sleep 26(2):117–126)
- Solianik et al. 2016 — 48-hour fast hunger-fatigue r=0.62 (PMID 28025637, PMC5153500)
- Puetz et al. 2008 — low-intensity exercise: energy +20%, fatigue −65% (PMID 18277063, Psychother Psychosom 77(3):167–174)
- Marcora et al. 2009 — 90 min cognitive work impairs physical endurance (PMID 19131473, J Appl Physiol 106(3):857–864)
- PMC2830749 — ASL perfusion: cognitive fatigue from 60+ min sustained work (PMID 19925871)

---

## Emotional Inertia State Penalties

**Applies to:** `regulationCapacity()` and `effectiveInertia()` in `state.js` — the adenosine > 60 and stress > 60 penalty terms.
**Status:** Research complete 2026-02-20. Not yet implemented.

**Current debt:** Penalty coefficients `(adenosine - 60) * 0.004` and `(stress - 60) * 0.004` applied to `regulationCapacity()` (max −0.16 each). Also `(adenosine - 60) * 0.005` and `(stress - 60) * 0.003` in `effectiveInertia()` (max +0.2 and +0.12). Directions correct; magnitudes chosen.

### Sleep deprivation → regulation impairment

**Mechanism (established):** Sleep deprivation produces prefrontal-amygdala decoupling — impaired top-down regulatory control, not simply heightened emotional reactivity. Yoo et al. 2007 (PMID 17956744, DOI 10.1016/j.cub.2007.08.007) — one night total sleep deprivation produced ~60% increase in amygdala reactivity to negative stimuli AND loss of functional connectivity between amygdala and medial PFC. The pathway is structurally impaired, not merely effortful.

Stenson et al. 2021 (PMID 34473768, PMC8412406, PLOS One) — N=60, randomly assigned: sleep-deprived subjects showed less effective regulation of negative emotion while bottom-up emotional processing was unaffected. The impairment is selectively regulatory.

**Effect size data:**
- Tomaso & Johnson 2021 meta-analysis (PMID 33367799, PMC8193556, Sleep 44(6):zsaa289) — adaptive emotion regulation after sleep restriction: **g = −0.32** (small, statistically significant; 11 effect sizes from 5 studies, youth samples).
- Palmer et al. 2024 meta-analysis (PMID 38127505, DOI 10.1037/bul0000410, Psychol Bull 150(4)) — 1,338 effect sizes across 154 studies: reduced positive affect SMD −0.27 to −1.14; increased anxiety SMD 0.57–0.63. Effects on negative affect **mixed and nonlinear** — not a clean linear relationship.

**Assessment for the model:** The current coefficient (adenosine > 60, capacity -= (aden-60)*0.004, max −0.16) represents moderate-to-large degradation of overnight processing efficiency. Given the Yoo 2007 mechanism finding and the Palmer SMD range, this is in the right order of magnitude. The Palmer nonlinear dose-response finding argues against the current linear scaling above a threshold — the real relationship is probably nonlinear with diminishing marginal impairment at extreme deprivation. **Coefficient is plausible; threshold linearity is an approximation.**

### Chronic stress → regulation impairment

**Mechanism (established):** Acute stress has **biphasic effects** on reappraisal (Langer et al. 2021, PMID 33460986, Psychoneuroendocrinology) — potentially helpful in early phase (0–20 min), impairing in late phase (20–40 min post-stress). The model's `stress` variable represents chronic/accumulated state, not acute arousal, so the biphasic acute effect is less relevant than the chronic structural changes.

Chronic stress: Arnsten 2009 (PMID 19455173, PMC2907136, Nat Rev Neurosci 10:410–422) — even mild uncontrollable stress causes "rapid and dramatic loss of prefrontal cognitive abilities." Prolonged stress causes dendritic atrophy in PFC and dendritic extension in amygdala — structural reorganization shifting the brain from regulatory to reactive processing.

**Quantitative benchmark:** Shields et al. 2016 meta-analysis (PMID 27371161, PMC5003767, Neurosci Biobehav Rev 68:651–668) — N=2,486 across 51 studies: working memory impaired **g = −0.197**, cognitive flexibility impaired **g = −0.300**. Inhibition: response inhibition enhanced (g = +0.296), cognitive inhibition impaired (g = −0.208).

**Assessment for the model:** The current coefficient (stress > 60, capacity -= (stress-60)*0.004, max −0.16) is in the right range for acute stress effects on PFC-mediated function (Shields g ≈ −0.2 to −0.3). Chronic structural effects may warrant a larger or more persistent penalty — the existing stress variable doesn't distinguish chronic structural PFC degradation from acute arousal. **Coefficient is plausible for acute stress; chronic effects are understated. Known structural approximation debt.**

### Interaction: additive or not?

Dutheil et al. 2023 (PMID 38033613, PMC10685043) — N=101, total sleep deprivation + TSST: counter-intuitive finding that acute social stress *improved* some performance metrics in sleep-deprived participants via arousal compensation. The interaction is **not simply additive** — in some respects antagonistic for performance; inflammatory markers showed non-additive patterns.

However, the temporal/dynamic combined state (chronic sleep debt + chronic stress over days) is worse than either alone via feedback loops (sleep deprivation → dysregulation → stress → sleep disruption). The current additive model is a defensible approximation for chronic combined states.

**The recovery lag problem:** Radley et al. 2005 (PMID 16095592, Exp Neurol 196(1):199–203) — after 3 weeks of stress in rats, PFC dendritic atrophy required ~3 weeks of recovery (no stress) to reverse. Hippocampus recovered in ~10 days; PFC recovery is slower. Human timescales are unknown but likely longer. The current model reads `s.stress` instantaneously — when stress resolves, the penalty disappears immediately. Real PFC structural recovery lags behavioral stress resolution by days to weeks. **This is a structural approximation debt: no "stress debt" variable exists to capture the lag.**

### Calibration verdict

The current penalty coefficients (0.003–0.005 range, max −0.12 to −0.20 off capacity) are in the right order of magnitude given the literature. The specific magnitudes remain approximation debts — the literature provides directional support and SMD ranges but not direct 0–1.3 capacity scale mappings. Primary structural gaps:

1. **Linear above threshold is wrong** — both effects are probably nonlinear (Palmer 2024; Shields 2016 high-load finding)
2. **Chronic stress lag absent** — structural PFC recovery takes days to weeks after stress resolves; current model resets instantly
3. **Sex moderation unmodeled** — consistent moderator throughout stress-reappraisal literature; regulation capacity should differ by sex (not yet a character parameter)

### Key sources

- Yoo et al. 2007 — TSD: ~60% amygdala reactivity increase, PFC-amygdala decoupling (PMID 17956744, DOI 10.1016/j.cub.2007.08.007)
- Stenson et al. 2021 — selective top-down regulatory impairment under TSD (PMID 34473768, PMC8412406)
- Tomaso & Johnson 2021 — sleep restriction + emotion regulation meta-analysis: g = −0.32 (PMID 33367799, PMC8193556)
- Palmer et al. 2024 — 154-study meta-analysis; nonlinear dose-response (PMID 38127505, DOI 10.1037/bul0000410)
- Shields et al. 2016 — acute stress + executive function meta-analysis: g = −0.197 to −0.300 (PMID 27371161, PMC5003767)
- Arnsten 2009 — structural PFC impairment under chronic stress (PMID 19455173, PMC2907136)
- Woo et al. 2021 — chronic stress weakens PFC connectivity (PMC8408896)
- Langer et al. 2021 — biphasic acute stress effects on reappraisal (PMID 33460986)
- Dutheil et al. 2023 — sleep deprivation × acute stress interaction; non-additive (PMID 38033613, PMC10685043)
- Radley et al. 2005 — PFC dendritic recovery ~3 weeks after 3-week stress; slower than hippocampus (PMID 16095592)
- Saito et al. 2017 — 9-day sleep extension restores PFC-amygdala regulation (PMID 28713328, PMC5491935)
- Van Dongen et al. 2003 — one 10h recovery night insufficient after chronic restriction (PMID 12683469)

---

## NT Target Clamp Bounds

**Applies to:** `tickNeurochemistry()` targets in `state.js` — floor/ceiling clamps on serotonin, dopamine, NE, GABA targets.
**Status:** Researched 2026-02-23. Not yet implemented.

**Research framing:** Simulation 0–100 scalars represent functional mood-relevant tone, not literal concentrations. The floor is the lowest *sustained* functional level compatible with continued ambulatory life. The ceiling is the highest *sustainable* natural elevation, excluding acute pharmacological states.

### Serotonin

Current bounds: [15, 85]

Acute tryptophan depletion (ATD) reduces brain serotonin synthesis by >85–90% (Young & Leyton 2002, PMC3756112; PET [11C]alpha-methyl-tryptophan). Yet ATD in healthy subjects causes only mild variable mood lowering — not catastrophic depression. Even at ~10–15% of normal synthesis capacity, most people remain functional. In remitted depression or SSRI users, ATD causes temporary relapse.

CSF 5-HIAA in depressed patients: mean group differences vs. controls are typically 20–30%, with wide overlap. Many severely depressed patients have normal or elevated 5-HIAA (Young & Leyton 2002).

SERT PET ([11C]DASB): 8–15% lower binding in depression vs. controls (PMC3398160). State-dependent — normalizes with recovery.

5-HT1A receptor PET: 42% reduction in midbrain raphe, 25–33% in limbic/cortical areas in depression (Drevets et al., PMID 10578452).

Interpretation: Even severe unmedicated depression doesn't push serotonergic function below ~20–25% of healthy baseline. Current floor of 15 is slightly too low. No natural ceiling phenomenon — 85 is reasonable.

**Calibration target:** [20, 82]

Sources: PMC3756112, PMC3398160, PMID 16713589, PMID 10578452

### Dopamine

Current bounds: [10, 90]

Parkinson's disease (structural denervation): postmortem striatal DA in most-affected putamen: <1% of control (PMID 3347226, NEJM 1988). Caudate: 4–40% depending on subdivision. DAT imaging in living PD: putamen ~20–30% of control in early-to-moderate disease (PMC6630131).

Critical distinction: PD is structural neuron death, not mood disorder. Depression involves functional dysregulation with neurons intact. For depression specifically: CSF HVA (DA metabolite) reduced with Hedges g = −0.30 (psychiatryonline.org/doi/10.1176/ajp.143.12.1539). Raclopride PET in anhedonic depression: blunted DA release ~10–15% less than controls during reward processing (PMC10594643).

The worst sustained *depressive* anhedonia probably represents ~30–40% of healthy dopaminergic tone — severe enough for profound anhedonia, but nowhere near PD's near-zero. Current floor of 10 is unrealistically low for any living ambulatory person with a mood disorder.

Ceiling: stimulant-induced transient DA release 4–10× baseline, but natural sustained ceiling (hypomania) is much more modest. Current 90 is slightly high for a natural sustained state.

**Calibration target:** [25, 85]

Sources: PMID 3347226, PMC6630131, psychiatryonline.org 143(12):1539, PMC10594643

### Norepinephrine

Current bounds: [10, 90]

NE in depression is heterogeneous. Low-MHPG depression subtype shows CSF/plasma values ~30–40% below healthy controls (PMID 3415426, Charney 1988). Not near-zero — postmortem studies show compensatory LC upregulation (NBK107205), consistent with reduced but non-zero output.

Ceiling — PTSD hyperarousal: 24h urinary NE significantly elevated in PTSD vs. other psychiatric groups (PMID 3588809, Mason 1988). CSF NE significantly higher in PTSD men vs. healthy controls (psychiatryonline.org AJP 158:1227). Acute physiological stress ~2× plasma NE. PTSD-level chronic hyperarousal represents ~1.5–2× healthy baseline. On a 0–100 scale where 50 = healthy, ceiling 90 implies ~180% of baseline — roughly consistent with chronic hyperarousal.

Floor of 10 is unrealistically low; low-NE depression subtype is perhaps 40–50% below healthy, not 80% below. Ceiling is reasonable.

**Calibration target:** [25, 88]

Sources: PMID 3415426, PMID 3588809, psychiatryonline.org AJP 158(8):1227, NBK107205

### GABA

Current bounds: [20, 80]

GABA has the strongest direct floor data: MRS spectroscopy gives in-vivo measurement.

Sanacora et al. 1999 (PMID 10565505): 52% reduction in occipital cortex GABA in acutely ill unmedicated melancholic depression vs. healthy controls. This is the most cited floor estimate.

Bhagwagar et al. 2008 (PMID 17625025): low GABA in *recovered* medication-free depressed patients — suggesting trait-level reduction, not just acute state.

CSF free GABA: MDD 15.1 ± 7.1 vs. control 18.7 ± 12.3 (PMC4797625). Lower end of MDD distribution ~50–60% of control mean.

MRS meta-analysis: Hedges g = −0.35 for GABA in MDD.

BZ withdrawal: GABA-A alpha-1 subunit downregulated 41% after chronic BZ (PMID 8818332). Acute BZ withdrawal is the functional floor extreme — but it's acute and self-limited.

The 52% Sanacora reduction is the cleanest lower bound: even worst melancholic depression = ~48% of healthy GABA. Current floor of 20 implies ~33% of full function — more extreme than clinical MDD, consistent only with acute BZ withdrawal. Ceiling: no natural chronic high-GABA ambulatory state exists. 80 is slightly generous.

**Calibration target:** [28, 78]

Sources: PMID 10565505, PMID 17625025, PMC4797625, PMID 8818332

### Summary table

| System | Current | Calibrated | Change |
|---|---|---|---|
| Serotonin | [15, 85] | [20, 82] | Floor +5, ceiling -3 |
| Dopamine | [10, 90] | [25, 85] | Floor +15, ceiling -5 |
| NE | [10, 90] | [25, 88] | Floor +15, ceiling -2 |
| GABA | [20, 80] | [28, 78] | Floor +8, ceiling -2 |

Dopamine has the largest change. Current floor of 10 represents a state (near-complete dopaminergic denervation, PD putamen) that doesn't occur in depression. Even profound anhedonia retains substantial dopaminergic tone.

---

## Social Isolation Decay

**Applies to:** `social` decay in `state.js` — τ=66h exponential decay, neuroticism modifier.
**Status:** Researched 2026-02-23. Not yet implemented.

### τ=66h: plausible, not derived

The specific value has no derivation. Literature provides bounds:

Lower bound: Tomova et al. 2020 (PMID 33230328, Nature Neuroscience, n=40): 10 hours of enforced social isolation produced measurable midbrain craving-circuit activation (substantia nigra/VTA), same as 10h fasting on food cues. Self-reported craving for contact also elevated. This is the acute motivational signal onset, not subjective distress. The craving signal is detectable after ~10h.

Lower bound (ESM): Pauly et al. 2022 (PMID 35758315, PMC9535790, n=317, 14 days, 5x/day): social interaction in the preceding 3.5h window predicted lower momentary loneliness; 7h lagged analysis showed no carryover. Social protection does not persist even overnight. This implies an effective half-life of well under a day for the *acute felt* component.

Upper bound: Roberts & Dunbar 2011 (DOI 10.1016/j.evolhumbehav.2010.08.005): 18-month longitudinal study of friendships through life transition. "Being denied the opportunity to meet and interact with friends even for relatively short periods of a few months will inexorably set in motion relationship decay." Monthly contact is the maintenance threshold for the sympathy group (~15 people); weekly for the support clique (~5).

Interpretation: τ=66h (~2.75 days) sits within the plausible range. The acute craving signal is faster (hours); relationship quality decay is slower (months). The `social` score is modeling something between these — felt connection level, a medium-timescale variable. τ=66h is a defensible approximation but is not derived.

**Debt note:** `// Approximation debt: τ=66h chosen for gameplay plausibility. Literature bounds: >10h acute craving onset (Tomova 2020 PMID 33230328) and <months relationship decay (Roberts & Dunbar 2011). No direct empirical derivation.`

### Neuroticism modifier (0.35)

Current: `neuroMod = 1 + (neuroticism-50)/50 * 0.35`

Pauly 2022: neuroticism × social-interaction interaction β = −0.133 (p = .002) on momentary loneliness — higher neuroticism → stronger reactivity in both directions (bigger drop after contact, faster return without it).

Genetic correlation between loneliness and neuroticism: r_g = 0.83 (Van den Berg et al., PMC6231981, n=4,375). Phenotypic correlation large and significant. Most of the reason neurotic people feel lonelier is shared genetic architecture, not independent causes.

Shrestha et al. 2025 (DOI 10.1177/08902070241239834): ESM study (285 participants, 3x/day, 1 week) confirmed more neurotic individuals feel lonelier when alone and show greater intra-personal loneliness fluctuation.

**Verdict:** 0.35 scaling is directionally correct and in the right order of magnitude. The genetic correlation r_g=0.83 supports a large effect but doesn't directly translate to a decay-rate multiplier. Remains an approximation debt; magnitude not derivable from existing literature.

### Introversion — should NOT affect τ

The literature does not support introversion as a modifier of `social` decay rate. What introversion affects:

- **Optimal contact dose** — introverts need less total contact to feel satisfied (not that they decay faster without it)
- **social_energy depletion rate** — social interaction is more cognitively taxing for introverts (Eysenck arousal theory, PMID 8421248); they reach overstimulation threshold sooner
- **Efficiency** — Card & Skakoon-Sparling 2023 (PMC10328046): lower social loneliness and higher social support correlated more strongly with happiness for low-extraversion people. Introverts get more wellbeing per unit of quality contact — more efficient, not less needy.

Margolis & Lyubomirsky 2020 (PMID 31368759): forced extraverted behavior for 1 week increased wellbeing for both introverts and extraverts, contradicting the folk model that introverts deplete faster.

**Action:** Introversion should govern `social_energy` depletion rate during interaction — currently a flat 0.5× coefficient that ignores introversion entirely. The `social` τ should remain neuroticism-modified only.

### Trait loneliness floor — missing, high priority

Trait loneliness is 48% heritable (Boomsma et al. 2005, PMID 16273322, n=8,387, Netherlands twin register). Test-retest stability: r=0.73 at 1 year (Russell 1996, PMID 8576833). Longitudinal genetic analysis: phenotypic stability r=0.51–0.69 across surveys; heritability for "I feel lonely" item 77% for the intercept across 11 years (PMID 17564516).

Cacioppo hypervigilance model (Hawkley & Cacioppo 2010, PMID 20652462): chronically lonely individuals develop implicit threat hypervigilance that makes social contact less satisfying and causes faster return to disconnection. Their `social` drift target is structurally lower.

**Gap:** Currently all characters drift toward the same implicit zero. Trait loneliness should set a character's `social` floor — the baseline disconnection level they drift toward even after contact. High trait loneliness → `social` drifts back toward e.g. 20–30 on a 0–100 scale rather than toward 0. This is a character parameter (generated at chargen on charRng) that should modulate the decay asymptote, not the rate.

This is the largest missing piece in the social model. It explains why some people remain chronically lonely despite regular contact: their set point is simply higher.

**Friend contact grace period (1.5 days)** — appropriate for guilt response (acute, faster-onset process). Friendship quality decay operates on a months timescale. Both are real; the current 1.5-day arc is modeling guilt correctly, not friendship decay.

---

## Emesis Probability

**Applies to:** `advanceTime()` in `state.js` — the vomiting rate function at nausea 75–100.
**Status:** Researched 2026-02-23. Not yet implemented.

**Current value:** 0–0.2 events/hr scaling linearly from nausea=75 to nausea=100.

### Key finding: etiology matters more than severity

Nausea and vomiting are "distinct phenomena without a fixed relationship" (Andrews et al. 2021, PMC8198651). Different causes produce radically different vomiting rates at the same subjective nausea severity. The current single rate curve is correct only for the lowest-emetic-efficiency contexts.

### Vomiting rates by etiology

**Acute gastroenteritis / food poisoning (high emetic efficiency):**

Norovirus human challenge studies (Atmar et al. 2016, PMC4845978): 70–72% of symptomatic subjects vomited; 1–7 episodes over a 4–11 hour window per subject. This yields ~0.2–1.5 events/hr at peak during active illness.

CTCAE grades (validated in CINV, PMC3503672): Grade 1 = 1–2/24hr (0.04–0.08/hr); Grade 2 = 3–5/24hr (0.12–0.21/hr); Grade 3 = ≥6/24hr (≥0.25/hr). Grade 3 corresponds to VAS nausea ~70–90.

Cyclic vomiting syndrome extreme ceiling: 8.5 events/hr mean in acute phase (Fleisher et al. 2005, PMC1326207). Not a normal target.

**Calibrated rate curve for illness:**
- Nausea 0–30: ≈0 (below clinical emetic threshold; VAS <34 = mild)
- Nausea 30–50: 0–0.05/hr (sporadic; CTCAE Grade 1 territory)
- Nausea 50–70: 0.05–0.25/hr (moderate; 1–5 episodes/24hr)
- Nausea 70–85: 0.25–0.75/hr (severe; norovirus 3–7 events over 4–11hr window)
- Nausea 85–100: 0.5–2.0/hr (extreme; upper norovirus range)

**Anxiety / psychogenic (low emetic efficiency):**
Functional vomiting from anxiety: ~2% prevalence reporting monthly or more (Talley 2007, PMID 17885700). Apply 0.10–0.20× multiplier on illness curve. At nausea=80, rate ≈ 0.05–0.15/hr. The current simulation value (0–0.2/hr at nausea 75–100) is in the right range *for this context only*.

**Caffeine withdrawal nausea:** Psychogenic + GI upset mixed. Use 0.2–0.3× illness curve as approximation.

**Migraine:** 73–90% experience nausea; 29–70% vomit (Spierings 2013, PMC3798203). Roughly 0.4–0.6× illness curve.

**Hangover:** 28.2% of hangover sufferers vomit (Verster et al. 2020, doi:10.3390/jcm9030786). Roughly 0.25–0.35× illness curve.

**Motion sickness:** Only ~7% of sea passengers vomit despite high nausea rates (Lawther & Griffin 1988, PMID 3390095). 0.10–0.15× illness curve.

### Emetic threshold

VAS 30–40/100 is the empirical boundary below which vomiting probability is negligible in healthy adults in most etiologies (Meek et al. 2015, PMID 25996342; Boogaerts et al. 2000, PMID 10757584; CTCAE Grade 0 → 0). No single paper gives a precise threshold, but clinical consensus supports treating nausea <30–35/100 as effectively non-emetogenic.

The simulation's `nausea > 75` gate is set too high — based on the VAS literature, the onset of meaningful emesis probability begins around nausea=40–45 for illness, not 75.

### What needs to change

1. **The onset threshold (75) should be lower (~40)** — especially for illness context.
2. **The rate at nausea=100 (0.2/hr) is correct for anxiety but wrong for illness** — should be 0.5–2.0/hr for gastroenteritis.
3. **Etiology tag on nausea source** — the simulation needs to know whether nausea is illness-derived, withdrawal-derived, or anxiety-derived to apply the right multiplier. This requires tagging at the site that sets nausea, not in the emesis rate function itself.
4. **Character susceptibility parameter** — individual emetic susceptibility varies enormously in the population ("10,000 to 1" range for motion sickness, Reason & Brand 1975, cited in PMC4112051). A character-level parameter grounded in the existing GABA/anxiety architecture would be biologically appropriate.

No published study provides a fitted P(vomit | VAS nausea) curve. All numbers above are inferences from combining population-level rates across etiologies with VAS severity thresholds.

---

## Pending Research

The following calibration debts were identified but not yet researched:

- **NT rate constants table** — the four mood-primary systems (serotonin, dopamine, NE, GABA) now have research above. The remaining 23 placeholder systems (glutamate, endorphin, acetylcholine, endocannabinoid, histamine, testosterone, DHT, estradiol, progesterone, allopregnanolone, LH, FSH, oxytocin, prolactin, and the physiological rhythms) remain at chosen approximations.
- **Serotonin/dopamine/NE/GABA target function coefficients** — every coefficient connecting circumstances to NT targets is chosen. No single calibration source — needs ecophysiology literature per system.
- **Event probabilities** (0.03 weather, 0.10 workplace, etc.) — per-action rates, chosen. Hard to calibrate against real sources without converting to per-hour framing.

---

## Approximation Debt Catalog

Full codebase audit 2026-02-23. 106 debts across 4 files. Listed by domain, with line numbers.

### Methodology

Searched for `// Approximation debt:` comments across `js/state.js` (76 debts), `js/content.js` (29 debts), `js/chargen.js` (4 debts), `js/senses.js` (1 debt).

### Priority 1 — Highest impact (affect core loop every action tick)

**Neurochemistry target coefficients (30 debts, state.js ~2022–2259)**

Every coefficient connecting life circumstances to NT targets is chosen. Affects player emotional experience on every action.

Serotonin target (state.js ~2022–2082):
- Sleep quality coeff 20, ref 0.7 — chosen
- Social coeff 0.15 — chosen
- Hunger coeff 0.2, threshold 60 — chosen
- Dehydration coeff 0.009 (→ ~6pt drop at 1400ml deficit) — chosen
- Work dread -6 / satisfaction +3 — chosen
- Friend guilt coeff 3 (max -6) — chosen
- Financial anxiety coeff 4 (max -3.2) — chosen
- Money level coeff 0.019, threshold 200 — chosen
- Sleep debt coeff 0.005, cap 8 — chosen
- Floor 15 / ceiling 85 — chosen

Dopamine target (state.js ~2089–2123):
- Energy coeff 0.25 — chosen
- Stress coeff 0.2, threshold 60 — chosen
- Work dread -5 / satisfaction +4 — chosen
- Financial anxiety at work coeff 2 — chosen
- Sleep debt coeff 0.006, cap 10 — chosen
- Floor 15 / ceiling 85 — chosen

NE target (state.js ~2131–2144):
- Stress coeff 0.3, baseline 30 — chosen
- Sleep quality coeff 15, ref 0.5 — chosen
- Dehydration coeff 0.005 (→ ~3.5pt rise at 1400ml) — chosen
- Floor 10 / ceiling 90 — chosen

GABA target (state.js ~2151–2153):
- Stress coeff 0.15, threshold 50 — chosen
- Floor 20 / ceiling 80 — chosen

Cortisol target (state.js ~2166–2170):
- Diurnal amplitude 20 — chosen (plausible for ±8 µg/dL but uncalibrated)
- Stress coeff 0.3, threshold 40 — chosen
- Money broke penalty +3 — chosen

Melatonin target (state.js ~2188–2209):
- 120 min daylight exposure threshold ignores illuminance (lux) — real melatonin suppression requires intensity
- Phone suppression -15, indoor evening -3 — chosen
- Fall-asleep delay multipliers 0.7× (high) / 1.4× (low) — chosen

Histamine target (state.js ~2232):
- Amplitude 30, circadian peak hour — chosen; real histamine firing is tonic, not sinusoidal

NT rate constants (state.js ~2259):
- Scale mapping real t½ to 0–100 is itself chosen; not all derived from receptor kinetics

**Sleep system (19 debts, content.js ~1436–1593, state.js ~2006–2209)**

Daily recovery is foundational. Sleep quality multipliers affect next-day energy and mood.

content.js:
- Sleep-through-alarm probability 0.3 at depleted energy — chosen
- Sleep quality multipliers: all 6 factors (stress, hunger, rain comfort, melatonin, circadian, illness) — directions from PSG literature, exact magnitudes recalibrated 2026-02-20 but still approximate
- Rain comfort +0.04 should condition on environmental noise tier — currently uniform
- Illness quality penalty 0.35 — chosen
- Energy restoration divisor 5 (0.2 pts/min) — chosen
- Adenosine clearance: max fraction 0.9, baseline 0.4, deep-sleep weight 0.6 — chosen (Xie et al. 2013 glymphatic research cited but magnitudes not derived)
- Serotonin post-sleep adjustments: +3 good / -2 poor, thresholds 0.9/0.6, NE -4 coeff, REM fraction 0.15 — chosen
- Stress reduction divisor 20 (0.05 pts/min) — chosen
- Fridge spoilage rate 15%/sleep — chosen; real depends on food type

state.js:
- Biological jitter frequencies 0.017 (~59h) and 0.0073 (~137h), amplitudes 2.0 and 1.5 — incommensurate by design but chosen; real ultradian/infradian data could ground frequencies
- Serotonin sleep quality target: coeff 20, ref 0.7 — chosen
- NE sleep quality target: coeff 15, ref 0.5 — chosen
- Melatonin: 120 min daylight threshold ignores lux; phone -15, indoor -3, multipliers 0.7×/1.4× — all chosen

**GI & hunger (11 debts, state.js ~379–459, ~1542–1581)**

Used every meal and tick.

- Cortisol GI slow pathway: 210 min (3.5h half-life) — not derived from GI motility kinetics
- GI slowdown coefficients: NE 0.5, cortisol 0.3 — chosen
- Gastric liquid/solid partitioning simplified — real stomach needs two-pool model
- Post-prandial satiation half-life midpoint 150 min (2.5h) — real range 2–4h by meal type
- Hormonal satiation suppression coeff 0.85 — same as stomach fullness; real weights differ
- 70kg reference body weight hardcoded — weight not tracked; activity and temperature absent from drain rate
- Caffeine diuresis: linear scaling, threshold 15 — chosen
- Gastric partitioning mixed=0.3 — simplified
- Ghrelin proportional-to-fill is simplification; real ghrelin has circadian rhythm and meal entrainment (state.js ~2219–2221)

**Energy drain (6 debts, state.js ~486–498)**

Every tick.

- Base rate 3 pts/hr — chosen
- Hunger multipliers 1.1× (40–70) and 1.3× (>70) — calibrated to literature 2026-02-20, still approximate
- Thirst drain magnitudes 0.1 (700–1400ml deficit) and 0.3 (>1400ml) — chosen

### Priority 2 — Medium-high impact

**Stress & emotional inertia (state.js ~2359–2456)**

- Inertia range 0.6–1.4 — magnitude chosen; relative weights from Houben 2015 (PMID 25822133)
- Four modifier coefficients: adenosine 0.005, sleep quality 0.3, +2 others — all chosen
- Regulation capacity range 0.5–1.3, penalty coefficients — structural gaps: linear-above-threshold is wrong; chronic stress PFC lag absent
- Cognitive load modifier absent from rumination model

**Social mechanics (state.js ~33, ~1581; content.js ~3584–5243)**

- Introversion not a chargen parameter — social energy depletion flat 0.5×; should scale with introversion
- Social gains from talk_to_coworker: base 8 + 2 warmth — chosen
- Social gains from message reading/writing/sending: +3/+3/+2 — chosen
- Social decay τ=66h — chosen (not literature-grounded; see Pending Research)

**Hydration & bladder (state.js ~22–23, ~1072, ~1115)**

- Hydration collapses status and signal; body weight not tracked; electrolytes absent
- Onset/hold thresholds — chosen
- Rate estimates directionally correct but magnitudes uncertain

**Caffeine & withdrawal (state.js ~619–679)**

- All rates chosen; not derived from pharmacokinetics
- Receptor upregulation sensitivity bonus formula chosen
- Withdrawal thresholds and rate chosen
- Emesis probability 0.2/hr at nausea=100 — chosen (see Pending Research)

**Illness (content.js ~1575–1593)**

- All incidence magnitudes absent calibration; no seasonal/immunity/exposure variation
- Progression rates all chosen

**Dental pain (state.js ~596–602; content.js ~2483–3904)**

- Decay rate 1.5 pts/hr — chosen; real depends on condition type (caries/abscess/periodontal)
- Chewing spike 15pt — chosen
- Hot beverage spike 25pt — chosen
- Ibuprofen relief -35pt — chosen
- NE and GABA coefficients — chosen

**Work & job standing (content.js ~3511, ~5124)**

- Focused work completion standing gain +1 — chosen
- Calling in sick penalty -8 — chosen

### Priority 3 — Lower impact

**Migraine (state.js ~577–584)** — only characters with condition; rare
- Base rate 0.003/hr, 8× amplification — chosen; episodic migraine ~1–14/month gives plausible but uncalibrated range
- Intensity 30–70, decay 8 pts/hr — duration 3.75–8.75h, within ICD-11 4–72h but uncalibrated

**Financial (chargen.js ~351; state.js ~2074)**
- EBT benefit $204/month flat — should derive from income/household size/state rules
- Money→serotonin coeff 0.019, threshold 200 — chosen

**Sensory (senses.js ~1003–1006)**
- Smell habituation τ=40 min shared with all sources; real olfactory adaptation ~10 min; needs per-source τ

**Health conditions & chargen (chargen.js ~478–537)**
- Probit rational approximation: ~10⁻⁹ max error — negligible
- Dental prevalence 35% flat — no jurisdiction model

**Lottery (content.js ~4075)**
- Scratch ticket prize amounts are placeholders; should derive from actual game structures

---

## Dental Pain — Tier Boundaries and Spike Magnitudes

Research conducted 2026-02-23.

### Clinical VAS cut-points

PMC5766084 (pain measurement in oral/maxillofacial surgery) gives the Jenstrup cut-points used across most postoperative dental studies:
- No pain: 0–4
- Mild: 5–44
- Moderate: 45–74
- Severe: 75–100

**Prior tier boundaries** (none < 5, dull < 25, ache < 60, flare ≥ 60) compress the "ache" tier and trigger "flare" at a clinically-moderate pain level (60 = moderate per Jenstrup). **Corrected boundaries** aligned to clinical cut-points: none < 5, dull < 45, ache < 75, flare ≥ 75.

### Chewing spike

No published within-subject VAS delta for chewing specifically. Best proxy: pulpitis patients in function (biting) report NRS ~7.5/10 (~75 VAS) against spontaneous baseline ~5.2/10 (~52 VAS) → functional-pain premium ~+23 (biorxiv preprint, Hargreaves lab: https://www.biorxiv.org/content/10.1101/262022v1.full). For early caries/reversible pulpitis, spikes are smaller. Literature range: +10–25 depending on severity. **Calibration target: +20** (center of range; prior +15 was conservative for pulpitis).

### Hot/cold liquid spike

Dentinal hypersensitivity (DH): mean evoked VAS from cold stimulus 19.9 (95% CI 15.7–24.1), PMC3819160. Hot stimulus in irreversible pulpitis can reach worst-pain NRS ~8.5 (~85 VAS) vs spontaneous ~52, suggesting +25–33 premium. Game value **+25 is within range** for pulpitis; slightly high for pure DH. Retain.

### Ibuprofen 400 mg relief

Cochrane review PMC4171980 (72 studies, 9,186 participants): NNT 2.3 for ≥50% pain relief in dental impaction model; 54% achieve ≥50% relief vs ~15–20% placebo. Pharmacodynamic model (PMID 21383341): maximum relief 1.8 units on 0–5 scale above placebo ≈ 36 pts on 0–100. Standard tablets onset ~40–45 min (PMID 11697757), peak 1–2h, duration 4–6h. Does not fully resolve active pulpitis — combination ibuprofen+acetaminophen recommended for severe pain (PMID 20685496). **Game value −35 is accurate center-estimate.** Retain.

Behavioral check with corrected boundaries: flare (75) − 35 = 40 → dull. Correct: NSAIDs suppress but don't cure pulpitis. Ache (50) − 35 = 15 → dull. Reasonable: moderate pain well-controlled.

### Baseline pain levels

- DH / early caries background: ~10–30 VAS (clinically mild; PMC3819160)
- Symptomatic pulpitis at emergency: mean ~52–58 VAS (PMC10453127: NRS 5.8±2.8; PMC10507313: SF-MPQ2 mean 67)
- Irreversible pulpitis severe: ~75–92 VAS (doi:10.1016/j.sjbs.2012.01.001: VAS 91.80±10.03)

### Summary of calibrated values

| Parameter | Prior | Calibrated | Source |
|-----------|-------|------------|--------|
| dull threshold | < 25 | < 45 | PMC5766084 mild cut-point 44 |
| ache threshold | < 60 | < 75 | PMC5766084 moderate cut-point 74 |
| flare threshold | ≥ 60 | ≥ 75 | PMC5766084 severe cut-point 75 |
| chewing spike | +15 | +20 | Hargreaves biorxiv +23 for pulpitis; +10–25 range |
| hot liquid spike | +25 | +25 (retain) | PMC3819160 DH evoked ~20; pulpitis thermal +25–33 |
| ibuprofen relief | −35 | −35 (retain) | PMC4171980 Cochrane 30–40pt range; PMID 21383341 |
