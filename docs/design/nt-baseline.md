# NT Baseline / Relative Neurochemistry

**Status:** architectural direction — not yet implemented
**Priority:** high (affects substance dependency, habituation, depression, exercise tolerance)

---

## The core insight

Physiological state is experienced *relative to baseline*, not at absolute NT levels. The same serotonin=45 feels like deficit to someone whose body has adapted to living at 65, and fine to someone adapted to 30. The lived experience is the gap, not the number.

This is allostasis: the body doesn't maintain a fixed setpoint (homeostasis) — it maintains stability around a *shifting* setpoint that tracks chronic history. The setpoint is the baseline.

---

## Why this matters for the sim

**Substance dependency** — alcohol chronically elevates GABA → brain downregulates GABA receptors → baseline rises → alcohol is now needed to reach neutral, not to feel good. Withdrawal is level falling below the elevated baseline, not below some absolute threshold. Currently modeled crudely via `alcohol_tolerance` and `alcohol_withdrawal` as separate variables. These should emerge from the same mechanism as everything else.

**Exercise tolerance** — endocannabinoids spike during a run → repeated over weeks → eCB baseline rises → same run produces less relative elevation → need to run to feel normal, not elevated. The runner who "has to exercise or feels terrible" is this mechanism.

**Depression** — baseline stuck low for sustained reasons (chronic stress history, chronic social isolation, chronic sleep debt). Absolute NT levels may look unremarkable; relative to baseline, the person is in permanent deficit. This is why "just cheer up" fails — the baseline isn't responding to circumstance.

**Antidepressant tachyphylaxis** — SSRIs raise effective serotonin → over months, baseline rises to compensate → subjective effect diminishes → dose escalation follows the same logic as tolerance. Not in scope to model the medication fully, but the mechanism should be the same one.

**Habituation generally** — any chronically elevated NT causes baseline rise. Any chronically depressed NT causes baseline fall. This is why the same action feels less good the 10th time: not because the action does less, but because the baseline has risen toward the level the action produces.

---

## Architecture

### New state variables

One slow-drifting baseline per mood-primary NT:

```js
serotonin_baseline: 50,   // τ ≈ 3-6 weeks
dopamine_baseline: 50,
norepinephrine_baseline: 50,
gaba_baseline: 50,
```

These start at 50 (neutral) for all characters. Over chronic history they drift toward the recent average NT level.

**Drift rule:**
```js
// In advanceTime(), after NT level drift:
const tau = 60 * 24 * 21; // 3-week time constant (minutes)
s.serotonin_baseline += (s.serotonin - s.serotonin_baseline) * (1 - Math.exp(-minutes / tau));
```

Tau is the key calibration variable. Too fast (days): baseline responds to mood episodes, not chronic state. Too slow (months): dependency doesn't model realistic timescales. ~3 weeks matches literature on receptor downregulation kinetics.

### Tier functions read relative level

Current:
```js
function moodTone() {
  const ser = s.serotonin; // absolute
  if (ser < 25 && dop < 25) return 'numb';
  // ...
}
```

Target architecture:
```js
function moodTone() {
  const ser = s.serotonin - s.serotonin_baseline; // relative
  if (ser < -25 && dop < -25) return 'numb';
  // ...
}
```

The thresholds shift from absolute positions to deviations from baseline. "Numb" is no longer "serotonin below 25" — it's "serotonin 25 points below where this person's body expects to live."

### Withdrawal falls out naturally

```js
function serotoninWithdrawal() {
  return Math.max(0, s.serotonin_baseline - s.serotonin);
}
```

No separate withdrawal variable needed. Positive gap = deficit relative to baseline = withdrawal-like symptoms. Applies to every substance and every chronic pattern simultaneously.

### Existing tolerance variables become derived

`alcohol_tolerance` currently proxies baseline elevation from alcohol use. Once `gaba_baseline` and `serotonin_baseline` are tracking chronic history, `alcohol_tolerance` can be derived from the gap between current baseline and fresh-character baseline rather than maintained separately.

---

## Interaction with existing systems

**Emotional inertia** (`effectiveInertia()`) — this models *rate* of level drift, not baseline position. Stays unchanged. High inertia means slow drift toward target; baseline separately tracks where the target has been living long-term.

**Target functions** (`serotoninTarget()` etc.) — these compute where circumstances are pushing right now. They're circumstantial and can shift in hours. Baseline is historical and shifts in weeks. Both are valid simultaneously:
- Target: "this situation calls for this NT level"
- Baseline: "this body expects to live at this NT level"
- Level: where the NT actually is, drifting toward target

**Sentiments** — the sentiment → target coupling is unaffected. Sentiments shift targets; baselines shift via chronic level history. These are orthogonal.

**Substances** — `adjustNT('gaba', 8)` (alcohol effect) is correct: it's an acute receptor-level event. The baseline response to chronic alcohol use is then handled automatically by the baseline drift engine, not by special-case tolerance code.

---

## Migration path

This is a significant change to tier function semantics. Thresholds currently calibrated against absolute 0-100 scale need recalibration against ±N relative scale.

**Suggested order:**
1. Add `{nt}_baseline` variables to state defaults — starts at 50, drifts toward recent level
2. Add baseline drift to `advanceTime()` — passive, no visible effect yet
3. Audit tier function thresholds against relative scale — probably ±25 for extremes (heavy/numb/clear)
4. Migrate `moodTone()` first — most central, most tested
5. Migrate substance withdrawal to use derived deficit — remove separate withdrawal accumulators
6. Migrate other tier functions
7. Re-run adversarial eval to verify habituation emerges naturally

**Tests:** the existing `nt-drift.test.js` and `tier-functions.test.js` suites will catch regressions. Thresholds will need updating after migration.

---

## Biological utilities that follow from this

Once the baseline/relative architecture is in, these systems get simpler or become free:

- **Opponent process** — schedule a slow baseline rise after a large positive acute adjustment; level eventually returns to old baseline, but now has to fight back to previous setpoint → natural post-high down
- **Allostatic load** — chronic high stress → cortisol baseline rises → raised floor on arousal even in objectively calm situations
- **Circadian modulation** — targets vary with time-of-day; baselines are what they are; the interplay is what makes "morning person vs night person" a real difference in experience
- **Seasonal baseline shift** — low photoperiod → serotonin baseline slowly falls → everything works correctly; no special SAD flag needed
- **Exercise adaptation** — repeated eCB spikes → eCB baseline rises → sedentary periods feel worse than before training began (correct)
