# Introversion × Social Energy: Literature Review for Calibration

**Purpose:** Calibrate `depletion_scale` and `recovery_scale` in `state.js` for the `social_energy` system.
**Date:** 2026-02-24

## Current Implementation

In `state.js` (lines ~1703–1705, ~562–563):

```js
// Depletion on positive social contact:
const introDepletion = 0.2 + (s.introversion / 100) * 0.6;  // range 0.2–0.8×
s.social_energy = Math.max(0, s.social_energy - amount * introDepletion);

// Recovery during solitude (per-tick, scaled per hour):
const introRecovery = 1 + ((s.introversion - 50) / 50) * 0.4;  // range 0.6–1.4×
s.social_energy = Math.min(100, s.social_energy + hours * 3 * introRecovery);
```

**Marked approximation debt:** "range [0.2, 0.8] and base 0.5 chosen; no single-study source for introversion × social fatigue scaling" and "3 pts/hr base rate and introversion coefficient 0.4 chosen."

---

## Central Question

Is the introversion effect primarily on:
1. **Depletion rate** — how much social contact costs
2. **Recovery rate** — how fast solitude restores
3. **Asymptote** — the ceiling social_energy can reach
4. Some combination

---

## Finding 1: Social behavior produces fatigue in everyone, not just introverts

**Study:** Leikas, S. (2020). Sociable behavior is related to later fatigue: moment-to-moment patterns of behavior and tiredness. *Heliyon*, 6(5), e04033.
- **PMID:** 32490243
- **DOI:** 10.1016/j.heliyon.2020.e04033

**What was measured:** EMA study, 74 participants, 1,046 observations over 4 days, self-report at 4 fixed times/day (11am, 2pm, 5pm, 8pm). Extraverted behavior rated for prior hour; fatigue rated currently.

**Key finding:** Extraverted behavior concurrently predicted lower fatigue (immediate reward), but predicted higher fatigue 2–3 hours later (β = 0.19, 95% CI [0.10, 0.26], p < 0.001). This lagged effect was **not moderated by trait extraversion/introversion** — "no individual differences were found for the relation between extraverted behavior and later fatigue."

**Effect size translation:** β = 0.19 for the lagged effect. For the depletion model this is evidence that *social behavior depletes everyone*, not just introverts. Introversion does not appear to determine *whether* depletion happens, but possibly *how much*.

**Confidence:** High. Replication of Leikas & Ilmarinen (2017) finding (PMID 27281444, DOI 10.1111/jopy.12264), which used N = 48 over 12 days and found the same lagged effect without personality moderation.

**Implication for model:** The current model assumes introverts deplete faster and extraverts barely deplete. Leikas (2020) suggests depletion from social behavior is trait-universal (at the same behavior level). However, this finding concerns *behavior-level* effects — it does not rule out that introverts engage in more demanding social processing per unit of behavior, which would show up as a per-contact cost difference not captured by EMA rated "extraverted behavior."

---

## Finding 2: Counterdispositional (against-trait) extraverted behavior specifically depletes introverts

**Study:** Pickett, J., Hofmans, J., Feldt, T., & De Fruyt, F. (2020). Concurrent and lagged effects of counterdispositional extraversion on vitality. *Journal of Research in Personality*, 87, 103965.
- **DOI:** 10.1016/j.jrp.2020.103965

**What was measured:** EMA study, 67 employees, 1,664 observations. Vitality (a component of well-being, opposite of depletion) rated multiple times/day. State extraversion scored per interval.

**Key finding:** Extraverted behavior was concurrently positively associated with vitality (immediate benefit). However, when the extraverted behavior was *counterdispositional* (above one's trait level — i.e., introverts acting sociably), it predicted **lower vitality 1 hour later**. For extraverts acting at or below their trait level, no such lagged depletion appeared.

**Effect size:** Specific coefficients not available from secondary sources, but the study is reported as finding a significant interaction. The depletion effect was localized to the counterdispositional condition.

**Implication for model:** This is a cleaner decomposition. Depletion is specifically higher for introverts when they engage in social behavior that is above their typical level — not from all social contact universally. Extraverts acting sociably do not show the same lagged depletion. This supports a moderate introversion coefficient on depletion, specifically for the *strain* of social engagement above one's preferred level.

**Confidence:** Medium. Single EMA study in a specific workplace population. The counterdispositional framing is a different construct from the game's continuous introversion trait.

---

## Finding 3: Introverts acting extraverted for 1 week: increased tiredness and negative affect

**Study:** Jacques-Hamilton, R., Sun, J., & Smillie, L. D. (2019). Costs and benefits of acting extraverted: A randomized controlled trial. *Journal of Experimental Psychology: General*, 148(9), 1538–1556.
- **PMID:** 30489119
- **DOI:** 10.1037/xge0000561

**What was measured:** RCT, N = 147, randomly assigned to "act extraverted" or active control for 1 week. Outcomes: positive affect, negative affect, tiredness, authenticity — assessed in-the-moment via EMA and retrospectively.

**Key finding:** The main effect of the intervention was positive (acting extraverted increased well-being on average). However, more introverted participants showed: weaker positive affect increases, increased negative affect and tiredness, decreased authenticity. The moderation by trait introversion was significant.

**Specific introverts' tiredness:** More introverted participants experienced **increased retrospective fatigue** in the acting-extraverted condition. Introverts specifically — not the average participant — showed a costs pattern.

**Effect size:** Full coefficients not available from secondary sources. The moderation was described as significant; Aeon summary of the paper (written by the authors) confirms it.

**Implication for model:** This is consistent with Finding 2 — the cost of social behavior is introversion-moderated when behavior exceeds one's dispositional level. A week-long sustained counterdispositional effort produces measurable depletion for introverts that does not appear for extraverts. Supports keeping a positive coefficient for introversion in the depletion function, but the effect is specifically tied to *sustained above-baseline social engagement*, not all social contact.

**Confidence:** High for existence of introversion-moderated cost; low for magnitude (no accessible coefficients).

---

## Finding 4: Bluetooth-sensed social presence → vigor immediately, fatigue delayed ~3 hours

**Study:** [Authors TBC]. Bluetooth-sensed social presence is associated with immediate vigor and delayed fatigue: A multi-method time series analysis. *iScience* (2025).
- **PMC:** PMC12179627
- **DOI:** 10.1016/j.isci.2025.112726

**What was measured:** EMA + Bluetooth passive sensing, N = 80, ~3,716 assessments over 2 weeks. Multiple analytical methods (LMM, continuous-time SEM, multi-state modeling).

**Key findings:**
- Contemporaneous social presence: β = 0.08 (vigor increase, p < 0.001), β = −0.06 (dejection decrease, p < 0.01)
- Lagged fatigue: β = 0.07 at next assessment (p < 0.01)
- Peak lagged effect for negative mood: 3 hours 7 minutes after social contact
- Social presence half-life: 1 hour 55 minutes
- Negative mood (from social presence) half-life: 2 hours 38 minutes

**Personality moderation:** Not examined. The authors explicitly note this as a limitation and call for future research.

**Implication for model:** Provides the timing structure — fatigue from social contact peaks ~3 hours later and then decays with a ~2.5-hour half-life. This matches the Leikas (2020) 2–3 hour observation window. The small but consistent effect sizes (β = 0.07–0.08) suggest the real-world effect per social interaction episode is modest — depletion accumulates over sustained contact, not as a large discrete hit.

**Confidence:** High for timing and magnitude at the population level; personality moderation unknown.

---

## Finding 5: Introversion does NOT predict enjoyment of or preference for solitude

**Study:** [Authors]. Who enjoys solitude? Autonomous functioning (but not introversion) predicts self-determined motivation for solitude. *PLOS ONE* (2022).
- **PMID:** 35613084
- **PMC:** PMC9132342
- **DOI:** 10.1371/journal.pone.0267185

**What was measured:** Two studies (N not specified), measuring introversion, autonomous functioning, and solitude preference/motivation.

**Key findings:**
- Introversion and self-determined solitude motivation: β = 0.07–0.10 (Study 1 not significant p = 0.220; Study 2 p = 0.033 but effect disappeared after controls)
- Introversion and preference for solitude: β = 0.03–0.08 (both non-significant)
- Autonomous functioning predicted motivation for solitude (β ≈ 0.10–0.18) and solitude was restorative *when autonomously chosen*

**Implication for model:** **This is a key null finding.** Introversion itself does not reliably predict *preferring* or finding solitude restorative in a direct way. What matters is whether solitude is chosen voluntarily. The current model's `recovery_scale` giving introverts faster recovery in solitude may be partially wrong as a *preference* effect. However, the game's solitude recovery is not modeling preference — it is modeling a physiological recharge process (overstimulation recovery). Introversion's effect on recovery may be through a different pathway (arousal regulation), not through preference.

**Confidence:** High for the null finding on preference/motivation; the physiological recovery pathway remains unaddressed.

---

## Finding 6: Social introversion (facet) predicts solitude-seeking more than broad BFI introversion

**Study:** Thomas, V., & Nelson, P. A. (2025). The effects of multifaceted introversion and sensory processing sensitivity on solitude-seeking behavior. *Journal of Personality*, 93(1), 51–66.
- **PMID:** 39152738
- **DOI:** 10.1111/jopy.12970

**What was measured:** N = 301 adults + 99 undergraduates. 10-day daily diary. STAR Introversion Scale (Social, Thinking, Anxious, Restrained facets) + BFI introversion + Sensory Processing Sensitivity. Outcomes: solitude frequency, solitude duration, motivation.

**Key findings:**
- *Social* introversion predicted higher solitude frequency and longer episodes; BFI introversion did *not*
- *Thinking* introversion predicted higher self-determined motivation for solitude
- Anxious and Restrained introversion facets showed null or mixed results
- BFI introversion (standard measure) showed opposite pattern on some outcomes (predicting less voluntary solitude)

**Implication for model:** The broad `introversion` trait in the game collapses facets that have distinct relationships to social fatigue and solitude. Social introversion — essentially, the "socially withdrawn/socially avoidant" facet — is the dimension most directly relevant to depleted-by-contact and recharges-in-solitude. Thinking introversion adds the "prefers quiet reflection" component. The current model's single `introversion` parameter is plausibly picking up a mixture of these. The social facet specifically driving solitude-seeking duration suggests that social introversion does predict *longer needed recovery periods* even if it doesn't predict *enjoying* those periods.

**Confidence:** High for facet differentiation; medium for applying to the game's single introversion scalar.

---

## Finding 7: Extraverts process social stimuli with higher neural attention allocation

**Study:** [Authors]. Do extraverts process social stimuli differently from introverts? *Cognitive, Affective, & Behavioral Neuroscience* (2011).
- **PMC:** PMC3129862

**What was measured:** EEG P300 amplitude response to oddball face stimuli vs. flower stimuli in participants varying in extraversion.

**Key findings:**
- Extraversion correlated with larger P300 amplitude to faces: r = 0.54 (95% CI [0.27, 0.75], p = .006)
- No significant correlation with non-social (flower) stimuli: r = 0.09, p = .32
- No behavioral accuracy differences

**Implication for model:** Extraverts' brains allocate more attentional resources to faces. This does not translate directly to faster depletion for introverts — rather, it suggests introverts' social processing is more effortful (less automatic), which could explain why sustained social contact is more taxing. This supports the *depletion* side of the model: not that extraverts are immune to fatigue, but that the same social interaction requires more effortful processing from introverts.

**Confidence:** Medium — this is neuroimaging correlational data, not a depletion study. The translation from P300 amplitude to a depletion ratio involves inference.

---

## Finding 8: Eysenck arousal theory — mixed empirical support in 2024

**Study:** [Authors]. Revisiting Eysenck: The association between personality and acute stress reactivity. *Behavioral Sciences* (2024).
- **PMC:** PMC11591114

**What was measured:** N = 107, Trier Social Stress Test (TSST), salivary cortisol + galvanic skin response (GSR). Personality via Eysenck's PQ.

**Key findings:**
- No significant Extraversion × Time effect for cortisol (F = 0.988, p = 0.464, η² = 0.021)
- Contrary to Eysenck's prediction, higher extraversion predicted *greater* sympathetic (GSR) reactivity (η² = 0.096 for females specifically)
- No significant neuroticism effects

**Implication for model:** Eysenck's arousal theory — often invoked to explain why introverts deplete faster (they're already closer to their arousal ceiling) — does not find clean empirical support in this 2024 study. The physiological basis for introversion × depletion asymmetry is more contested than popular accounts suggest. This means calibrating the model on arousal theory alone would be grounding it on a contested mechanism.

**Confidence:** High for null result in this study specifically; the broader arousal theory literature remains mixed. The absence of evidence here is not strong evidence of absence across the whole literature.

---

## Synthesis: What the Literature Supports

### 1. Is there a depletion asymmetry? **Yes, conditional.**
Social behavior depletes everyone (Leikas 2020, Bluetooth study 2025). But *counterdispositional* social behavior — introverts acting more sociably than their baseline — shows an additional lagged depletion not seen for extraverts in the same position (Pickett et al. 2020; Jacques-Hamilton et al. 2019). The asymmetry is real but localized to above-baseline engagement.

### 2. Is there a recovery asymmetry? **Unclear — supported by face validity, not clean direct evidence.**
No study directly compared introvert vs. extravert solitude recovery rates on a common outcome. Thomas (2025) shows social introverts seek *longer* solitude episodes, consistent with needing more recovery time. The autonomous-solitude research (PLOS ONE 2022) shows *preference* for solitude is not introversion-driven, but *duration* of solitude-seeking is. This is consistent with introverts needing more recovery time without necessarily enjoying solitude more.

### 3. Is the effect on depletion rate, recovery rate, or both?
**Most evidence is on the depletion side.** The Pickett and Jacques-Hamilton studies measure vitality loss and tiredness during/after social engagement. There is no EMA study comparing recovery rates between introverts and extraverts during periods of solitude. The depletion coefficient is better supported than the recovery coefficient.

### 4. What is the magnitude?
The cleanest quantitative signal is the Leikas (2020) β = 0.19 for lagged sociable-behavior → fatigue. This is a population-level effect with no introversion moderation — it sets a floor on how large personality-moderated depletion can be. The personality-moderated effects (Pickett, Jacques-Hamilton) are on top of this baseline and likely smaller; neither study provides accessible coefficients for the moderation term specifically.

---

## Translation to Game Parameters

### Depletion scale [0.2–0.8×] of `adjustSocial(amount)`

The current range means introverts (100) deplete 4× more than extraverts (0) from the same social event. This is a strong assumption with limited direct empirical support.

**What the literature supports:** A moderate asymmetry on counterdispositional engagement. Since the game's social interactions are presumably all meaningful to the character (not random background social exposure), a moderate-to-strong asymmetry is plausible. However, 4× may be too wide.

**Suggested range:** A 2:1 ratio (introvert:extravert) is more defensible than 4:1. This would shift the range from [0.2–0.8] to something like [0.35–0.65] or keeping the current parameterization but with a note that the 4:1 ratio is not empirically calibrated.

**Approximation debt note:** The current [0.2, 0.8] range produces a 4:1 depletion ratio (introversion=100 vs. introversion=0). No EMA study provides a ratio for depletion specifically. The counterdispositional depletion studies (Pickett 2020; Jacques-Hamilton 2019) show the effect is real but do not give a magnitude. **Retain as approximation debt; range is plausible but unverified.**

### Recovery scale [0.6–1.4×] of `3 pts/hr`

The recovery asymmetry is the less-supported half of the model. Introversion predicts *seeking* longer solitude (Thomas 2025) but autonomous choice, not introversion, predicts solitude being restorative (PLOS ONE 2022). There is no direct evidence that solitude restores social_energy faster in introverts vs. extraverts.

**Alternative interpretation:** Introverts recover to the same *rate* in solitude, but need more recovery because they depleted more. If depletion is introversion-scaled, recovery rate may not need to be. Or: introverts have a lower natural social_energy asymptote, so they fill to a lower ceiling, which appears as "slower" recovery.

**Suggested interpretation:** Keep recovery scaling but treat it as a proxy for lower arousal tolerance, not faster biological restoration. The [0.6–1.4] range is consistent with the Thomas (2025) solitude-duration finding (social introverts seek longer episodes, suggesting their recovery takes longer), but the mechanism is indirect.

**Approximation debt note:** No study directly measures introvert vs. extravert solitude recovery rates. The 0.4 coefficient is unverified. **Retain as approximation debt.**

### Base depletion amount vs. base rate

The Bluetooth study (2025) suggests social presence effects are modest per episode (β ≈ 0.07–0.08) and take ~3 hours to peak. This suggests the depletion model should produce gradual accumulation, not large single-hit costs. The game's `amount × introDepletion` structure ties depletion to the magnitude of social benefit delivered (`adjustSocial` amount), which is reasonable.

---

## Model Architecture Assessment

**Depletion and recovery both scale with introversion: is this consistent?**

The literature is mixed:
- Depletion scaling: supported (conditional on counterdispositional engagement)
- Recovery scaling: indirectly supported (social introverts seek longer solitude, which implies slower or higher-threshold recovery), but no direct rate measurement

The current dual-scaling is not ruled out by the evidence; it may simply not be confirmed. It is more cautious than it looks because both effects are linear and moderate in the chosen parameter range.

**Does the introversion effect operate on asymptote?**
An alternative model: introversion lowers the *ceiling* social_energy can reach, with uniform depletion and recovery rates. No clear empirical support for this formulation over the current one.

---

## Citations

1. Leikas, S. (2020). Sociable behavior is related to later fatigue: moment-to-moment patterns of behavior and tiredness. *Heliyon*, 6(5), e04033. PMID 32490243. DOI 10.1016/j.heliyon.2020.e04033.

2. Leikas, S., & Ilmarinen, V. J. (2017). Happy now, tired later? Extraverted and conscientious behavior are related to immediate mood gains, but to later fatigue. *Journal of Personality*, 85(5), 603–615. PMID 27281444. DOI 10.1111/jopy.12264.

3. Pickett, J., Hofmans, J., Feldt, T., & De Fruyt, F. (2020). Concurrent and lagged effects of counterdispositional extraversion on vitality. *Journal of Research in Personality*, 87, 103965. DOI 10.1016/j.jrp.2020.103965.

4. Jacques-Hamilton, R., Sun, J., & Smillie, L. D. (2019). Costs and benefits of acting extraverted: A randomized controlled trial. *Journal of Experimental Psychology: General*, 148(9), 1538–1556. PMID 30489119. DOI 10.1037/xge0000561.

5. [Authors]. Bluetooth-sensed social presence is associated with immediate vigor and delayed fatigue: A multi-method time series analysis. *iScience* (2025). PMC 12179627. DOI 10.1016/j.isci.2025.112726.

6. [Authors]. Who enjoys solitude? Autonomous functioning (but not introversion) predicts self-determined motivation for solitude. *PLOS ONE* (2022). PMID 35613084. PMC 9132342. DOI 10.1371/journal.pone.0267185.

7. Thomas, V., & Nelson, P. A. (2025). The effects of multifaceted introversion and sensory processing sensitivity on solitude-seeking behavior. *Journal of Personality*, 93(1), 51–66. PMID 39152738. DOI 10.1111/jopy.12970.

8. [Authors]. Do extraverts process social stimuli differently from introverts? *Cognitive, Affective, & Behavioral Neuroscience* (2011). PMC 3129862.

9. [Authors]. Revisiting Eysenck: The association between personality and acute stress reactivity. *Behavioral Sciences* (2024). PMC 11591114. DOI 10.3390/bs14111098.

10. Nguyen, T. T., Ryan, R. M., & Deci, E. L. (2018). Solitude as an approach to affective self-regulation. *Personality and Social Psychology Bulletin*, 44(1), 92–106. DOI 10.1177/0146167217733073.

---

## Actionable Conclusions for state.js

### What to update
The approximation debt comments at both sites should be updated to reference this document:

```js
// Approximation debt: depletion coefficient [0.2–0.8] gives a 4:1 introvert:extravert ratio.
// Literature supports an introversion-moderated depletion asymmetry for counterdispositional
// engagement (Pickett 2020 DOI 10.1016/j.jrp.2020.103965; Jacques-Hamilton 2019 PMID 30489119)
// but no study provides a quantitative ratio. 4:1 is plausible but wider than confirmed.
// See docs/research/introversion-social-energy.md.
```

```js
// Approximation debt: recovery coefficient 0.4 (range 0.6–1.4×) is not literature-derived.
// Social introverts seek longer solitude episodes (Thomas 2025 PMID 39152738), consistent
// with longer recovery needs, but no study directly measures recovery rate asymmetry.
// Autonomous (chosen) solitude is restorative regardless of introversion level
// (Nguyen et al. 2018 DOI 10.1177/0146167217733073; PLOS ONE 2022 PMID 35613084).
// See docs/research/introversion-social-energy.md.
```

### What NOT to change (yet)
The depletion and recovery scaling structure is not ruled out by the literature. Both directions of the effect are qualitatively supported; only the specific coefficients are unverified. Narrowing the range (e.g., [0.35–0.65]) would be a calibration change unsupported by any number in the literature — it would just be replacing one unsupported number with another. Leave the structural parameters and mark them honestly.
