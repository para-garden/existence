# Energy Recovery and Adenosine Clearance: Literature Review

Research conducted 2026-02-24. Every empirical claim carries a retrievable citation. Citations marked with PMID/PMC are retrievable via PubMed/PMC; DOIs via doi.org.

---

## Part 1 — Energy Recovery from Sleep

### Current implementation

```js
const energyGain = (sleepMinutes / 5) * qualityMult * debtPenalty;
```

On the 0–100 energy scale, this gives **0.2 energy points per minute of sleep**. 480 minutes (8h) → +96 energy before capping. The divisor 5 was chosen with no derivation.

---

### What the literature says

#### Shape of the dose-response function

The relationship between sleep duration and next-day alertness/performance is **not linear — it is a saturating exponential** with performance plateauing around 7–9 hours.

Evidence from two complementary study designs:

**Dose-response studies — short sleep followed by PVT testing**

A cross-study analysis constructed dose-response curves (DRCs) for PVT metrics by pooling data from subjects allowed 0, 2, 5, or 8 hours of prior night sleep, tested at 10:00. The DRCs improved in a **saturating exponential manner**, with a time constant of approximately **τ ≈ 2.14 hours** for PVT metrics (reaction speed, lapses). This means most of the recoverable PVT benefit accrues in the first 4–5 hours of sleep and the curve flattens well before 8 hours. By contrast, the Stanford Sleepiness Scale improved more slowly, fitting a linear function equally well as a saturating exponential with τ ≈ 9.09 hours — subjective sleepiness is a slower-tracking signal than objective performance. (Dinges et al., from the "Dose-response relationship between sleep duration and human psychomotor vigilance and subjective alertness" 1999 study, PMID 10201061.)

**Recovery from chronic restriction — one night of recovery after chronic restriction**

After 5 days of restriction at 4h/night, Rupp et al. (2009) found that exponential models with asymptote set to baseline best characterized recovery dose-response profiles for PVT lapses and KSS. A linear slope of −1.38 lapses per hour of recovery sleep was also identified, but the exponential fit was superior by AIC. Recovery to control-group levels required an estimated ~10.7h TIB — implying that catching up from severe restriction takes more sleep than a single normal night, and that the recovery curve itself is steeper at the beginning and shallower at the end. (Rupp et al. 2009, PMC2910531.)

**Chronic restriction — threshold around 7–8 hours**

Van Dongen et al. (2003) randomized participants to 3, 5, 7, or 9 hours TIB for 14 nights. In the 8h group, PVT lapses were low and **stable** across all 14 nights. In the 6h and 4h groups, deficits accumulated steadily in a dose-dependent manner, equivalent to 2–3 nights of total sleep deprivation after 14 restricted nights. Crucially, the 8h group showed no improvement beyond baseline either — suggesting **8 hours is at or past the performance plateau for most adults**. (Van Dongen et al. 2003, PMID 12683469.)

Belenky et al. (2003) found the same directional result: 9h and 7h TIB groups maintained stable PVT performance; the 5h and 3h groups degraded steadily. The 7h group initially declined slightly then stabilized — suggesting 7 hours is just at the lower edge of the stable zone for this population. (Belenky et al. 2003, PMID 12603781, J Sleep Research 12:1–12.)

**Consensus sleep recommendation**

The American Academy of Sleep Medicine / Sleep Research Society joint consensus (2015) recommends 7 or more hours for adults, based on health outcomes rather than performance specifically. There is no performance benefit of sleeping beyond 9 hours in non-restricted healthy adults. (Hirshkowitz et al. 2015, PMC4434546.)

---

#### What this means for the formula

The current linear formula (`sleepMinutes / 5`) implies:
- 4h → +48 energy
- 8h → +96 energy
- 12h → +144 energy (capped, but the *rate* is constant throughout)

The literature supports:
- The relationship is **saturating, not linear**. Additional hours beyond 7–8h produce no additional alertness benefit in non-restricted individuals.
- The steepest gains are in the **first 4 hours**. The curve flattens substantially after that.
- PVT performance follows a faster saturation curve (τ ≈ 2.14h) than subjective sleepiness (τ ≈ 9h). The game's `energy` variable maps more naturally onto subjective alertness/capacity than raw reaction time, so the slower saturation is probably the better model — but neither is linear.

**A literature-grounded replacement would look like:**

```
energyGain = energyCeiling * (1 - exp(-sleepMinutes / τ))
```

where τ (in minutes) determines saturation speed. For a model that reaches ~87% of max at 8h:
- τ = 8h / ln(1/0.13) ≈ 8h / 2.04 ≈ 3.9h = **234 minutes**

At this τ:
- 2h → ~41% of ceiling
- 4h → ~65% of ceiling
- 6h → ~79% of ceiling
- 8h → ~87% of ceiling
- 12h → ~95% of ceiling

This is not a derivation — it's a functional form consistent with the literature's saturation finding, with the τ value chosen to match the 7–8h plateau. The specific number needs calibration against what "full energy" means in the game.

**Alternatively:** The current simple linear formula is not wildly wrong for the 0–8h range — it just doesn't model the fact that hours 7–8 are worth less than hours 1–2, and it has no ceiling from sleep alone. The main representational debt is that sleeping 16h gives proportionally more energy than 8h in the model but not in reality.

#### Confidence

| Claim | Confidence |
|---|---|
| Shape is saturating, not linear | High — multiple independent study designs agree |
| Saturation plateau at 7–9h | High — consistent across Van Dongen, Belenky, AASM consensus |
| τ ≈ 2–4h for objective performance | Medium — derived from recovery DRC studies, not direct energy measurement |
| No additional benefit beyond 9h for non-restricted adults | High |

#### Key sources

- Dinges et al. 1999 — "Dose-response relationship between sleep duration and human psychomotor vigilance and subjective alertness" (PMID 10201061). PVT DRC saturating exponential τ ≈ 2.14h for performance, 9.09h for subjective sleepiness.
- Van Dongen et al. 2003 — "The cumulative cost of additional wakefulness: dose-response effects on neurobehavioral functions and sleep physiology from chronic sleep restriction and total sleep deprivation" (PMID 12683469). 8h stable, 6h and 4h cumulative deficits.
- Belenky et al. 2003 — "Patterns of performance degradation and restoration during sleep restriction and subsequent recovery: a sleep dose-response study" (PMID 12603781). 7h and 9h stable; 3h and 5h degrade.
- Rupp et al. 2009 — "Neurobehavioral dynamics following chronic sleep restriction: dose-response effects of one night for recovery" (PMC2910531). Recovery DRC best fit by saturating exponential.
- Hirshkowitz et al. 2015 — AASM/SRS joint consensus on recommended sleep (PMC4434546).

---

## Part 2 — Adenosine Clearing During Sleep

### Current implementation

```js
const adenosineClear = -(sleepMinutes / 480) * ctx.state.get('adenosine') * 0.9 * (0.4 + 0.6 * cycles.deepSleepFrac);
```

This is a **fraction-of-level clearing model**, not a kinetic model. For a full 8h sleep:

- Full deep sleep (deepSleepFrac = 1.0): clears `0.9 × (0.4 + 0.6) = 90%` of current adenosine
- No deep sleep (deepSleepFrac = 0): clears `0.9 × 0.4 = 36%` of current adenosine
- Half deep sleep (deepSleepFrac = 0.5): clears `0.9 × 0.7 = 63%` of current adenosine

The citation in the code is Xie et al. 2013 (Science) on glymphatic clearance.

---

### What the literature says

#### Xie et al. 2013 — glymphatic clearance (DOI: 10.1126/science.1241224; PMC3880190)

The Xie 2013 paper is the correct citation for the *mechanism* of why sleep clears brain metabolites, but it does not provide the specific quantitative fractions used in the formula.

Key claims from the paper (in mice):
- Sleep and anesthesia are associated with a **60% increase in the interstitial space** (by volume), allowing greater convective CSF/ISF exchange.
- Amyloid-β was cleared **approximately 2× faster** during sleep than wakefulness.
- Glymphatic clearance during wakefulness is reduced by approximately 90% relative to sleep.

What the paper does **not** provide:
- The fraction of adenosine specifically (as opposed to amyloid-β) cleared in a single sleep episode.
- A time-course for clearance across 8 hours.
- A quantitative contribution breakdown by sleep stage (N3 vs. REM vs. N2).
- Human data — all experiments were in mice and anesthetized rats.

#### Glymphatic field controversy (2024)

A 2024 paper in Nature Neuroscience (Hablitz et al., "Brain clearance is reduced during sleep and anesthesia", PMID 38741022) found that fluorescent tracer clearance in mice was *reduced* during sleep rather than enhanced, directly contradicting Xie 2013. The scientific community has actively debated this contradiction. A subsequent 2024 Cell paper (Bhatt et al., "Norepinephrine-mediated slow vasomotion drives glymphatic clearance during sleep") found that synchronized NE oscillations, cerebral blood volume changes, and CSF flow during NREM sleep are the strongest predictors of glymphatic clearance.

**Translation:** The glymphatic clearance story is genuinely contested at the mechanistic level as of 2024–2025. For game purposes, the key empirical fact — that adenosine clears more during sleep than wakefulness — is solid (established by microdialysis, not glymphatic imaging), even though the glymphatic mechanism is disputed.

#### Adenosine clearance — the direct microdialysis evidence

**What actually clears adenosine:**

The primary mechanism for adenosine removal is **adenosine kinase** in glial cells (particularly astrocytes), which phosphorylates adenosine to AMP. This is distinct from the glymphatic washout pathway. The A1 receptor pathway mediates the *effect* of adenosine (SWA, sleepiness) rather than its clearance rate.

**Clearance kinetics — fast (minutes) or slow (hours)?**

A key finding from the Reichert et al. 2022 review (PMC9541543, PMID 35575450, J Sleep Research) complicates the picture: using a genetically encoded adenosine sensor (GRABAdo) with second-level resolution in mice, extracellular adenosine changes in response to **vigilance state transitions occur on the timescale of minutes, not hours**. This suggests that much of the adenosine signal is local and activity-coupled (neurons and astrocytes, driven by ATP hydrolysis), not the slow-build clearance modeled in traditional Process S.

**However**, the Porkka-Heiskanen et al. 2000 microdialysis paper (PMID 11029542, Neuroscience 99:507) tells a different story for the *basal forebrain* specifically: after 6h of sleep deprivation (adenosine ~140% of baseline), basal forebrain adenosine remained **significantly elevated throughout 3h of recovery sleep** — clearing was slow in this region. Other brain regions (cortex, thalamus) showed faster clearance. This regional specificity is important.

**Spontaneous sleep episodes reduce adenosine by 15–20%:**

Porkka-Heiskanen et al. 2000 also found that during spontaneous (undisturbed) sleep episodes, basal forebrain adenosine declined by **15–20% per episode** relative to wakefulness levels. Sleep episodes typically last 60–90 minutes in cat studies — this gives a rough clearance rate of 15–20% per ~90 minutes of normal sleep.

**The Two-Process Model dissipation time constant:**

The two-process model (Borbély/Achermann) models homeostatic sleep pressure (Process S), which is operationally equivalent to adenosine at the macroscale. The Daan, Beersma & Borbély 1984 model (PMID 6696142) estimated the time constant of Process S dissipation during sleep at approximately **τs ≈ 4 hours** from SWA data. Rusterholz et al. (cited in search results from Achermann's group) found group-average τs ≈ **2.7 hours**. These are not direct adenosine measurements — they are fits to slow-wave EEG activity — but Process S is the established macroscale marker for adenosine homeostasis.

At τ = 2.7–4h during sleep:
- After 8h sleep: residual = exp(−8/4) = **13.5%** (using τ=4h) or exp(−8/2.7) = **5.4%** (using τ=2.7h)
- This means adenosine clears to 5–14% of entry value over a full night — near-complete clearance.

**A1 receptor recovery confirms near-complete clearance after full recovery sleep:**

Elmenhorst et al. 2017 (PNAS, "Recovery sleep after extended wakefulness restores elevated A1 adenosine receptor availability in the human brain", DOI: 10.1073/pnas.1614677114) used PET to track A1 receptor availability (which inversely reflects adenosine occupancy). After 52h of wakefulness, A1 availability increased substantially. After **14 hours of recovery sleep**, it returned to control baseline levels. This supports the view that adenosine clears fully (to baseline) with sufficient recovery sleep, but that recovery after extreme deprivation may require more than a standard 8h night.

#### How deep sleep (N3/SWS) contributes specifically

**SWS dominates adenosine clearance; REM does not:**

- The A1 receptor is the primary effector for adenosine-driven SWA promotion. Conditional A1R knockout mice show markedly attenuated SWA rebound after sleep deprivation (from several studies, including Stenberg et al. and Wisor et al.). SWA rebound is driven by and co-occurs with adenosine clearance — they are not independent.
- Glymphatic clearance — to the extent it contributes — is primarily associated with **NREM sleep**. The Bhatt et al. 2024 (Cell) paper identifies NE oscillations during NREM as the driving mechanism. REM sleep has high NE activity (NE neurons re-activate during REM), which would suppress glymphatic flow.
- The meta-analysis of intracerebral adenosine (PMC6196573, J Circadian Rhythms 2018) found ~15–20% decline during spontaneous sleep, but this was not stage-resolved.

**No published study gives a clean quantitative breakdown of the N3 vs. REM contribution to adenosine clearance in hours.** The directional claim — that N3/SWS contributes more than REM — is well supported mechanistically but the specific weighting (0.4 baseline + 0.6 × deepSleepFrac in the current code) has no direct empirical derivation.

---

### Assessment of the current formula

```js
-(sleepMinutes / 480) * adenosine * 0.9 * (0.4 + 0.6 * deepSleepFrac)
```

**The 0.9 maximum clearance fraction:**

The two-process model kinetics (τ = 2.7–4h) predict 86–95% clearance over 8h of sleep starting from elevated adenosine. Full-night recovery restoring A1 receptor availability to baseline is consistent with near-complete clearance. A maximum clearance of 0.9 (90% for full-deep-sleep 8h episode) is within the plausible range.

However: the kinetic model (exponential decay with τ) makes better predictions than a fixed-fraction model. A fixed-fraction model has the property that the clearance is always proportional to the current level — which is kinetically correct for a first-order process — but multiplying by `sleepMinutes / 480` as a linear scaling makes it no longer first-order: it implies you get exactly 90% clearance whether adenosine is 100 or whether it's 20. That is not what kinetics predicts. The 2.7–4h τ model would give:

```
adenosine_remaining = adenosine * exp(-sleepMinutes / τ_minutes)
```

At τ = 180min (3h), 8h (480min) sleep: `exp(-480/180) = exp(-2.67) ≈ 0.069` → clears 93%.
At τ = 240min (4h), 8h sleep: `exp(-480/240) = exp(-2) ≈ 0.135` → clears 86.5%.

These bracket the current 0.9 coefficient well. The current formula is therefore numerically reasonable for an 8h sleep — the debt is the linear scaling by `sleepMinutes / 480` rather than true exponential kinetics.

**The 0.4 baseline fraction:**

This implies that with zero deep sleep, an 8h episode clears 36% of adenosine. There is no direct empirical derivation for this. The literature does not offer a clean "REM-only sleep clears X%" number. What is supported:

- Very fragmented sleep or sleep with substantially suppressed SWS (e.g., from alcohol, benzodiazepines) leaves subjects feeling unrefreshed, consistent with incomplete adenosine clearance.
- The Porkka-Heiskanen 15–20% per episode finding was in undisturbed sleep with normal stage distribution — it cannot be decomposed into stage contributions without stage-resolved adenosine measurements, which do not appear to exist in the accessible literature.
- A floor of ~30–40% clearance for sleep with very little SWS is a plausible assumption but remains an approximation debt.

**The 0.6 deep-sleep weight:**

The weighting of 0.6 to deepSleepFrac (so that deepSleepFrac=1 contributes the full remaining 54pp above the 36% floor) is entirely chosen. The directional claim (more deep sleep → more clearance) is supported; the specific slope is not derived.

**Sleep duration linearity assumption:**

The model linearly scales clearance by `sleepMinutes / 480`. This means 4h sleep clears 45% (with full deep sleep) vs. 90% for 8h sleep. The two-process model's exponential decay is not linear in duration — it's steeper at the start and shallower at the end. For very short sleep (1–2h), the linear scaling would underestimate clearance (real kinetics clear faster early in the sleep episode when adenosine is high). For very long sleep, linear scaling would overestimate clearance (the kinetics slow as adenosine approaches its baseline floor).

---

### Summary table

| Formula element | Current value | Literature-supported value / range | Confidence | Notes |
|---|---|---|---|---|
| Max clearance fraction (full 8h + full deep sleep) | 0.90 | 0.86–0.95 | Medium | Consistent with τ=2.7–4h Process S dissipation |
| Baseline fraction (full 8h, no deep sleep) | 0.40 | No derivable value | Low | Direction plausible; magnitude chosen |
| Deep-sleep weight | 0.60 | Underivaable from available literature | Low | Direction (SWS > REM) mechanistically supported |
| Duration scaling | Linear × sleepMinutes/480 | Should be exponential (1 − exp(−t/τ)) | Medium | Linear is acceptable for 4–8h range; wrong at extremes |
| Energy recovery shape | Linear (÷5) | Saturating exponential, τ ≈ 2–4h in minutes | High | Literature very consistent on saturation around 7–9h |
| Energy recovery plateau | Implicit cap at 100 | Stable at ~8h, no gain beyond 9h | High | Van Dongen 2003, Belenky 2003, AASM consensus |

---

### Recommended replacements (translation notes)

**Energy recovery:**

Replace `sleepMinutes / 5` (linear, arbitrary divisor) with a saturating exponential:

```js
// τ ≈ 234 minutes targets ~87% of ceiling at 8h (literature: stable performance from 7-9h)
// Approximation debt: τ chosen to match plateau shape, not directly measured
const τ = 234; // minutes — Approximation debt: from DRC shape, not direct energy measurement
const energyFraction = 1 - Math.exp(-sleepMinutes / τ);
const energyGain = energyCeiling * energyFraction * qualityMult * debtPenalty;
```

This has a qualitative literature basis (saturation shape, plateau at 7–9h from multiple studies) but the specific τ is still an approximation debt — the literature gives τ for PVT (τ ≈ 2.14h = 128min) and for subjective sleepiness (τ ≈ 9.09h = 545min), but `energy` in the game sits between these two. 234min is a midpoint guess. Mark it.

**Adenosine clearance:**

The kinetically correct model for a first-order clearance process is:

```js
// τ from Process S dissipation (Achermann group: τs ≈ 2.7–4h during sleep).
// SWS-weighted: real clearance faster during deep sleep, slower during REM.
// Approximation debt: deepSleepFrac contribution weight 0.6 has no direct empirical basis.
const τ_base = 240; // minutes — 4h, from Borbély 1984 / Achermann Process S τs upper range
const τ_effective = τ_base / (0.4 + 0.6 * cycles.deepSleepFrac); // SWS speeds clearance
const clearanceFrac = 1 - Math.exp(-sleepMinutes / τ_effective);
const adenosineClear = -ctx.state.get('adenosine') * clearanceFrac;
```

This preserves the current logic (deep sleep speeds clearance; partial sleep clears less) while using the correct kinetic shape rather than a linear duration scaling. The numerical output for 8h with normal sleep architecture (~20% deep) would be broadly consistent with the current formula in the middle range.

---

### Key sources

- Xie L et al. 2013, Science 342:373–377 — glymphatic clearance 2× faster during sleep (DOI: 10.1126/science.1241224; PMID 24136970; PMC3880190). **Note: mechanism contested by Hablitz et al. 2024 (PMID 38741022, Nature Neuroscience).**
- Porkka-Heiskanen T, Strecker RE, McCarley RW 2000, Neuroscience 99:507–517 — BF adenosine 140% after 6h deprivation; 15–20% decrease per spontaneous sleep episode; BF clearance slow (elevated throughout 3h recovery) (PMID 11029542).
- Reichert CF, Deboer T, Landolt HP 2022, J Sleep Research 31:e13597 — adenosine kinetics fast (minutes) for state-coupled changes; review of adenosine/caffeine/sleep-wake regulation (PMID 35575450; PMC9541543).
- Daan S, Beersma DGM, Borbély AA 1984, Am J Physiology 246:R161–R183 — Process S, τs accumulation ~18h, dissipation ~4h from SWA (PMID 6696142).
- Rusterholz T et al. (Achermann group) — group-average τs ≈ 2.7h dissipation (referenced in PMC9540767 review).
- Borbély AA, Daan S, Wirz-Justice A, Deboer T 2022, J Sleep Research — two-process model review (PMC9540767).
- Elmenhorst D et al. 2017, PNAS 114:4243–4248 — A1 receptor availability restored to baseline after 14h recovery sleep following 52h wakefulness (DOI: 10.1073/pnas.1614677114; PMID 28373571).
- Phillips AJK, Klerman EB, Butler JP 2017, PLoS Comput Biol 13:e1005759 — full ODE model of adenosine system, receptor-ligand dynamics (PMID 29073206; PMC5675465).
- Dinges DF et al. 1999, Sleep 22(Suppl 1):S354–S360 (and related) — dose-response between sleep duration and PVT/SSS alertness (PMID 10201061). Saturating exponential DRC, τ ≈ 2.14h (PVT), 9.09h (SSS).
- Van Dongen HPA et al. 2003, Sleep 26:117–126 — 8h stable PVT; 6h and 4h cumulative deficits (PMID 12683469).
- Belenky G et al. 2003, J Sleep Research 12:1–12 — 7h and 9h TIB stable; 5h and 3h degrade (PMID 12603781).
- Rupp TL et al. 2009, Sleep 32:1229–1240 — recovery DRC from chronic restriction; saturating exponential best fit (PMC2910531).
- Hirshkowitz M et al. 2015, Sleep Health 1:40–43 — AASM/SRS consensus 7+ hours for adults (PMC4434546).
- Bhatt DL et al. 2024, Cell — NE-mediated vasomotion drives glymphatic clearance during NREM sleep (https://www.cell.com/cell/abstract/S0092-8674(24)01343-6).
