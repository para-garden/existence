# Reactivity / Amplitude Axis + Event-Driven Momentary Affect

**Status:** IMPLEMENTED (2026-06-05, `CURRENT_VERSION` 38). `reactivityFactor()` and the
momentary-affect injector live in `js/state.js`; the corrected metric + free-running mode live in
`scripts/nt-trajectory.js`; replay regression in `tests/nt-drift.test.js`. Final calibrated values
in the box below. The design rationale that follows is retained as the record of *why*.

## Final calibrated values (frozen — approximation debt)

| knob | value | site |
|------|-------|------|
| reactivity weights | `{n 0.45, r 0.35, seInv 0.20}` (neuroticism-led) | `reactivityFactor()` |
| reactivity range | base 0.45 / span 1.4 → **[0.45, 1.85]** (neutral 1.15) | `reactivityFactor()` |
| micro-event rate λ | **0.40 / game-minute** (~24/waking-hr) | injector in `advanceTime()` |
| raw magnitude | **`5.5 + skew²·50.0`** (right-skewed, span [5.5, 55.5]) | injector |
| negativity bias | **1.1×** on negative blips | injector |
| systems / split | DA : NE = **2 : 1** (keyed on absolute game-minute `(baseMinute+m) % 3`); SER/GABA excluded | injector |
| saturation guard | **live linear headroom soft-clip** (`effect → 0` at the wall) | injector |

**Emergent result (free-running EMA harness test):** resilient **8.02** / baseline **11.42** /
ruminator **14.77** — all WITHIN the empirical 8–18 band (PMID 32324001), correct paradox
direction. 5/5 stacking checks pass; crisis stays 88.9% heavy with no clamp pinning; cortisol 6:1
unchanged; `ntRates` / `*Target()` couplings untouched. The reactivity range came out slightly
wider than the originally-proposed [0.6, 1.6] (jointly tuned against the clamp-bounded fast
systems to reach the spread); the magnitude/λ are the calibrated generator.

**Adversarial-review corrections (2026-06-05, post-ship).** Four defects were found and fixed:

1. **DA/NE split was a call-chunking artifact.** The system selector was keyed on the intra-call
   loop index `m % 3`, which under the dominant `advanceTime(1)`-per-action gameplay pattern is
   always `m=0` → **always NE, never DA**, inverting the intended DA-primary 2:1 ratio. The
   selector is now keyed on the **absolute game-minute** `(baseMinute + m) % 3` where
   `baseMinute = floor(s.time) − wholeMinutes`. This holds the 2:1 DA:NE ratio under BOTH
   `advanceTime(1)`-heavy play (verified: selector exactly 2.000:1; level-delta detection 1.72:1)
   and large single calls, consumes no extra `rng`, and is deterministic/replay-safe.

2. **moodTone readout debounced; CART trains on smoothed affect.** `moodTone()` read the raw
   jittered DA/NE against hard thresholds; `habits.js` snapshotted raw DA/NE/GABA + moodTone as
   CART features. Both now read short-τ (45 min) EMA-smoothed NT levels
   (`{serotonin,dopamine,norepinephrine,gaba}_smoothed`, updated each `advanceTime`, no rng).
   The smoothing debounces the minute-scale strobe (~3–4 → ~2 tone flips per waking day in the
   harness) while still tracking genuine hour-scale swings (a bad afternoon → good evening still
   changes tone — verified). The momentary variance stays in the underlying LEVEL: the harness
   momentary proxy iSD is unchanged and in-band.

3. **Chronic setpoint decoupled from the momentary stream.** The baseline-adaptation EMA read the
   post-injection (jittered) level, leaking the transient stream — including its negativity bias —
   into the chronic setpoint. Now the DA/NE momentary blip is tracked as a **transient offset**
   (`dopamine_transient`/`norepinephrine_transient`), accumulated at injection and decayed in
   lockstep with the level inside `driftNeurochemistry()`. The baseline EMA reads
   `level − transient`, so the momentary stream contributes ≈0 to the setpoint. Verified: the
   quantity the baseline EMA reads changes ≤0.014 pt/min (mean 0.0026) versus multi-point raw blip
   jumps — the momentary stream is excluded to within ~0.01 pt. The chronic setpoint is owned
   exclusively by the baseline/history system, as the design intends; the slight negativity bias
   no longer pulls the setpoint at all (any chronic erosion of mood from "a life of small
   frustrations" must be modeled in the baseline/history system, not leaked from this stream).

One implementation deviation from the original sketch: the injector applies blips **per-minute with
a live headroom soft-clip** (not via target excursions and not netted at end-of-call). This
guarantees noise can never pin a hard clamp — which reconciles the empirical band (full variance at
mid-range) with the crisis no-saturation guardrail (the held extreme jitters without pinning).

**On call-size independence (corrected claim).** What is GUARANTEED is **draw-count call-size
independence**: `advanceTime(m)` consumes exactly `floor(m)` injector `rng` draws regardless of how
the call is chunked, so the `rng` stream position — and therefore deterministic replay — does not
depend on call granularity. This is the load-bearing replay property and it holds exactly.

It is NOT true that `advanceTime(120)` produces the same emergent state as 120×`advanceTime(1)`.
`driftNeurochemistry(hours)` runs **once per call** with the full `hours`, BEFORE the per-minute
injector loop — so a single `advanceTime(120)` drifts the level over 2 h once and then applies 120
minute-blips against the already-drifted level, whereas 120×`advanceTime(1)` interleaves drift and
blip every minute. The two produce different trajectories. The original "≡" claim conflated
draw-count equivalence (true) with trajectory equivalence (false). Replay determinism does not
depend on trajectory equivalence — only on the same recorded `advanceTime(m)` arguments replaying
in the same order, which they do.

---

**Prerequisite reading:** `docs/research/mood-variability.md` (§ TUNING-PHASE OUTCOME),
`docs/research/nt-coupling-serotonin.md`, `docs/research/nt-coupling-dopamine-ne.md`,
`docs/design/nt-baseline.md`.

**Why this exists.** The NT-coupling tuning phase (2026-06-05) established two architectural
facts through the *real* engine, not by taste:

1. **Within-day affect variability is ~8–13× too flat.** Model within-day iSD ≈ 1.0 on a 0–100
   scale; empirical iSD is 8–18 (Jones 2020, PMID 32324001). This is *not* a coefficient problem:
   even both SER and DA targets oscillating ±20/day (far past any literature magnitude) caps the
   affect-proxy iSD at ~5.2, because serotonin's drift rate (`ntRates.serotonin = [0.06, 0.08]`,
   t½ 9–11 h) is a literature-anchored low-pass filter that attenuates any within-day
   serotonin-*target* swing to near-zero at the *level*. Tonic 5-HT cannot and should not carry
   within-day variance. **The variance must come from event-driven momentary perturbations on the
   fast systems (dopamine, NE)** — which the harness's smooth representative drivers deliberately
   remove.

2. **The sim is missing the reactivity axis entirely.** The only personality→variability lever is
   `effectiveInertia()` (drift *rate*): higher neuroticism → more inertia → *slower* tracking →
   *less* within-day swing. Reality is the opposite — the **stability–instability paradox**:
   neuroticism raises affective *variability* AND *inertia* simultaneously (Mader 2023, PNAS,
   PMID 37253012, PMC10266024). Variability (dispersion), instability (consecutive-change
   magnitude), and inertia (autocorrelation) are **distinct emotion dynamics** that
   meta-analysis treats separately (Houben, Van den Noortgate & Kuppens 2015, *Psychological
   Bulletin* 141(4):901–930, PMID 25822133). The sim models only inertia, which monotonically
   *reduces* variability, so it can never reproduce the empirical spread — and produces it in the
   wrong direction (ruminator *less* volatile than resilient).

---

## 1. What IS reactivity, in full generality?

**Reactivity is the amplitude of the affective excursion a given input produces — the gain on the
input→affect transfer function.** It is a property of the *response magnitude per unit of
perturbation*, evaluated at the moment a perturbation lands.

### Reactivity vs. inertia: the autocorrelation-vs-amplitude distinction

The affect-dynamics literature decomposes the time series of momentary affect into structurally
independent quantities (Houben 2015, PMID 25822133):

| Construct       | Definition (time series)                              | Sim analogue                          |
|-----------------|-------------------------------------------------------|----------------------------------------|
| **Mean / intensity** | central tendency of affect                       | NT baseline + target central tendency  |
| **Inertia**     | first-order autocorrelation; carry-over from t−1 to t | `effectiveInertia()` → drift *rate*    |
| **Reactivity**  | amplitude of response to a discrete input/stressor    | **MISSING** — this axis                |
| **Variability** | within-person SD (dispersion) — an *emergent* outcome | the harness iSD metric                 |
| **Instability** | RMSSD; magnitude of consecutive changes — emergent    | harness RMSSD (secondary)              |

Inertia and reactivity are orthogonal generators; variability and instability are emergent
*outcomes* of both acting on a stream of inputs. Concretely, in a discrete-time linear system
driven by perturbations `pₜ`:

```
xₜ = a · xₜ₋₁ + (gain · pₜ)          # a = autocorrelation (inertia), gain = reactivity
Var(x)  ≈  gain² · Var(p) / (1 − a²)   # stationary variance of an AR(1)
```

Both `a` (inertia) and `gain` (reactivity) raise `Var(x)`. This is the *formal* statement of the
stability–instability paradox: a trait can elevate variability through the gain term even while it
also elevates the autocorrelation term. The sim currently models only `a` (via `effectiveInertia`)
and has no `gain` term — and crucially, the sim's perturbation stream `Var(p)` from smooth drivers
is itself ~0 within a day. **Both the perturbation stream (§3) and the gain (this section) are
missing.** Adding inertia alone, with no perturbations, cannot produce variability — there is
nothing to autocorrelate.

> Note the AR(1) intuition has a sign subtlety the sim must respect: in the literature, higher
> inertia (`a→1`) *raises* stationary variance. In the current engine, raising `effectiveInertia`
> *lowers* the per-tick drift rate, which under a *smooth* target makes the level track a slow
> input more sluggishly (less swing). The resolution is that the literature's variance formula
> assumes a *stochastic perturbation* input (`pₜ`), not a smooth deterministic target. Once
> event-driven perturbations exist (§3), higher inertia will correctly make those perturbations
> *persist longer* (decay more slowly), raising variability — restoring the literature's sign.
> This is why the two fixes are co-dependent and must ship together (§ Implementation).

### Minimal correct parameterization: per-NT-system reactivity, derived from one trait-scalar

Two candidate parameterizations:

- **(A) Single reactivity scalar per character.** One `reactivity ∈ [~0.6, ~1.6]` multiplier on all
  perturbation magnitudes. Simplest; one save field.
- **(B) Per-NT-system reactivity.** A `reactivity` factor per mood-primary system
  (DA-reactivity, NE-reactivity, …).

**Decision: a single per-character trait scalar `affective_reactivity`, projected onto per-system
*application*, not stored per-system.** Rationale:

- The empirical construct is measured at the level of *affect* (a person is "emotionally
  reactive"), not per-neurotransmitter. There is no human data assigning different reactivity to
  DA vs. NE within an individual. Storing four independent reactivity fields would be inventing
  structure the phenomenon doesn't have (violates "model the phenomenon, not a convenient
  instance" and "nothing arbitrary").
- But reactivity should *not* be applied uniformly to every system. Physiological systems
  (cortisol diurnal, melatonin, adenosine) must **not** be scaled — personality does not change
  the gain of your circadian cortisol rhythm, exactly as `effectiveInertia()` already excludes
  them. Reactivity applies only to the **mood-primary set** `{serotonin, dopamine, norepinephrine,
  gaba}`, and in practice the *perturbations* (§3) only target the fast subset `{dopamine,
  norepinephrine}` — so reactivity is read at perturbation time and multiplies the perturbation
  for those systems.

So: **one scalar trait, applied as a multiplier only where momentary perturbations are injected.**
This is the minimal parameterization that is faithful to the construct.

### Trait mapping and its empirical basis

`affective_reactivity` is derived from personality, centered so the neutral character (50/50/50)
gets `1.0`:

```
reactivity = 0.6 + reactWeighted · 1.0          # range ~0.6 (low) to ~1.6 (high)
reactWeighted = n · wN + r · wR + seInv · wSE    # n,r,seInv ∈ [0,1], weights sum to 1
```

with provisional weights **wN = 0.45 (neuroticism), wR = 0.35 (rumination), wSE = 0.20
(low self-esteem)**. Empirical basis:

- **Neuroticism → affective reactivity is the primary, best-supported link.** Neuroticism predicts
  increased *reactivity of negative affect to stressors* and increased *variability* of negative
  affect (Hisler, Krizan, DeHart & Wright 2020, *J Res Personality* 87:103964,
  DOI 10.1016/j.jrp.2020.103964 — **PMID unverified**; this journal article has no clean PubMed
  index confirmed by search). Independently, Mader 2023 (PMID 37253012, PMC10266024) resolves the
  paradox: with correct (censored Bayesian location-scale) modeling, neuroticism *is* associated
  with increased within-person variability in negative emotion. This is the load-bearing citation
  for "neuroticism raises reactivity, not just inertia."
- **Rumination → reactivity/recovery.** Rumination prolongs and amplifies the affective response
  to events (it is the failure-to-recover dynamic). In the inertia meta-analysis it is the
  strongest predictor of inertia (Houben 2015, PMID 25822133), and it is mechanistically a
  reactivity-amplifier as well (it keeps re-igniting the perturbation). Weighted second.
- **Low self-esteem → reactivity.** Self-esteem is the weaker, more symmetric contributor (its
  inertia association is valence-symmetric per Kuppens 2010, PMID 20424092, as already cited in
  `effectiveInertia()`); included at low weight.

**Crucial cross-check against `effectiveInertia()`.** The same three traits drive *both* axes —
this is required by the paradox, not a bug. `effectiveInertia()` weights are
`{n 0.32, seInv 0.28, r 0.40}` (rumination-led, from Houben 2015 inertia r-values). The reactivity
weights here are **neuroticism-led** `{n 0.45, r 0.35, seInv 0.20}` because the reactivity/
variability literature (Mader 2023; Hisler 2020) puts neuroticism first for *amplitude*, whereas
the inertia literature puts rumination first for *persistence*. The two axes share inputs but
differ in emphasis — which is exactly the empirically grounded statement of the paradox.

**Approximation-debt status:** the *direction* and *ordering* of all three weights are
literature-grounded; the *magnitudes* (0.45/0.35/0.20) and the *range* (0.6–1.6) are chosen and
must be marked `// Approximation debt (reactivity):` at the implementation site. The range mirrors
`effectiveInertia()`'s 0.6–1.6 deliberately so the two axes are comparable in leverage.

---

## 2. Where reactivity lives and how it composes with the engine

### It is a multiplier on perturbation magnitude, read at perturbation time

Reactivity is **not** a new term inside the `*Target()` functions, and **not** a modifier on the
drift rate. It is a multiplier applied at the moment a momentary perturbation is injected via
`adjustNT()`. Concretely, a micro-event that would inject `+Δ` into dopamine becomes:

```
adjustNT('dopamine', Δ · reactivity())        # reactivity() ∈ ~[0.6, 1.6]
```

This keeps the construct exactly where the literature locates it — gain on the input→affect
transfer — and keeps it surgically separate from:

- **The literature-anchored drift rates (`ntRates`)** — untouched. Reactivity scales the *size* of
  the kick, not how fast the system relaxes afterward. The 9–11 h serotonin low-pass and the
  fast DA/NE rates are preserved exactly.
- **The `*Target()` couplings** — untouched. Those compute where *circumstances* push the slow
  setpoint; reactivity governs *momentary kicks*, a different channel. No coupling coefficient
  changes.
- **`effectiveInertia()`** — untouched and retained. After a perturbation lands, the level relaxes
  toward target at the inertia-modulated rate. High inertia → the kick *persists longer* (slower
  decay), so high-inertia + high-reactivity characters get both a bigger kick AND a longer-lived
  one → maximal variability. This is the paradox falling out of the composition automatically.

### How a perturbation propagates through the current math

A perturbation enters as an acute `adjustNT('dopamine', k)` (clamped to [0,100]). On the next
`driftNeurochemistry(hours)` tick, that displaced level relaxes back toward `target` via the
existing exponential approach:

```
level = clamp(target + (level − target) · exp(−rate · hours), 0, 100)
```

For dopamine, `rate ≈ 0.35–0.45/h` (divided by `effectiveInertia`), so a kick decays with
t½ ≈ 1.5–2 h × inertia — i.e. a micro-event blip is mostly gone within a couple of game-hours,
which matches phasic-DA recovery timescales (acute NAc DA recovery 1–2 h, PMID 1606494, already
cited at `ntRates.dopamine`). NE recovers faster (45–90 min, PMID 6727569). **The decay machinery
already exists and is correct; reactivity only sizes the input.** Nothing new is needed in the
drift loop itself.

This is the correct use of `adjustNT()` per CLAUDE.md: *"acute receptor-level events only — a drug
hitting a receptor, an endorphin spike, a cortisol surge."* A micro-event affect blip is exactly
such an acute receptor-level event. It must **not** go through the target or baseline systems —
those carry sustained/learned effects, not moments.

### Storage

`affective_reactivity` is stored like `neuroticism` etc.: set from `personality` at character
init (`character.js`), with a `base_affective_reactivity` companion (mirroring the existing
`base_*` trait pattern). Alternatively it is computed on demand from the three traits via a
`reactivityFactor()` function (parallel to `effectiveInertia()`), reading `s.neuroticism`,
`s.rumination`, `s.self_esteem` live. **Decision: compute on demand** (a `reactivityFactor()`
function), to match `effectiveInertia()` exactly and avoid a stored field that must be kept in
sync. No new save field is needed for reactivity itself — it derives from existing trait fields.
(The perturbation *generator* in §3 does force a save-version bump for a different reason — a new
RNG consumer.)

---

## 3. The event-driven momentary perturbations

### What real phenomenon they model

The micro-events of an ordinary day: a good bite of food, a small frustration, a notification, a
stranger's expression, a song that lands, a near-miss, a flicker of worry. Each produces a
**transient phasic dopamine / NE blip** — at the neuronal level these are sub-second bursts
(phasic DA latency <100 ms, duration <200 ms; Schultz, reward-prediction-error literature), but at
the simulation's *minute-resolution affective* level the relevant quantity is the **summed
extracellular/affective consequence** of the micro-event: a small step in DA/NE that then decays
over minutes-to-hours via the existing drift. We are modeling the affective footprint of the
event, not a single action potential.

This is the dominant missing share of within-day variance: real EMA iSD ≈ 13 comes from prompts
catching the person at genuinely different *moments* — moments shaped by these micro-events — not
from the slow tonic drivers.

### Sourcing: piggyback on the existing action cadence, do NOT build a parallel generator

Two candidate sources:

- **(A) New ambient micro-event generator** — a standalone system that, every N minutes of game
  time, rolls whether a micro-event occurs and applies a blip.
- **(B) Piggyback on the existing interaction / idle cadence** — every player action and every
  idle tick already advances time and is already an RNG-consuming, replay-recorded event. Attach a
  small affect perturbation to the *time advance itself*, scaled to elapsed minutes.

**Decision: (B), with the perturbation injected from inside `advanceTime()` (or
`driftNeurochemistry`), proportional to elapsed game-minutes.** Rationale:

- It matches the phenomenon: micro-events accrue with *lived time*, and the player's action cadence
  *is* the lived-time cadence. A free hour of gameplay (several interactions + idles) should
  accumulate more micro-event variance than thirty seconds.
- It reuses the existing replay spine. `advanceTime()` is already called from every replayed
  action in deterministic order; a perturbation drawn there replays correctly for free, with no
  new action-log entries and no changes to `replayInteraction`/`replayIdle` RNG-order contracts.
- A parallel generator (A) would be a second scheduler that must itself be made replay-safe and
  would duplicate the cadence machinery — rejected (collapse-asymmetries-to-primitives; the time
  advance already *is* the cadence primitive).

So the rule is: **in `advanceTime(minutes)`, after the deterministic state updates and before/within
`driftNeurochemistry`, draw zero-or-more momentary perturbations whose expected count scales with
`minutes`, and apply each as `adjustNT(system, signedMagnitude · reactivityFactor())` on a fast
system.**

### Magnitude distribution, frequency, decay — grounded

- **Frequency.** Expected micro-events per waking hour: a handful. ESM samples ~5×/day catch
  meaningfully different moments, implying the underlying micro-event rate is at least several per
  hour (each prompt lands somewhere in a stream of them). Provisional: **Poisson-like, mean ~3–6
  events/waking-hour**, i.e. `λ ≈ 0.05–0.10 per minute`. Suppressed during sleep (`is_sleeping`) —
  the waking world is what generates micro-events.
- **Sign.** Roughly **symmetric but slightly negativity-biased** at the population level (bad
  micro-events register a touch larger/stickier — consistent with negativity bias and with the
  asymmetric down-rate already in `ntRates`). Provisional split ~50/50 in *count*, with negative
  blips ~1.1–1.2× the magnitude of positive ones.
- **Magnitude per event.** Each blip is **small** — order **±2 to ±6 raw NT points** before
  reactivity scaling, drawn from a right-skewed distribution (many tiny, few larger). The target
  is that the *integrated* effect across a day reproduces iSD ≈ 8–18 on the affect proxy. This is
  a **calibration target, not a free knob**: the per-event magnitude and λ are fit so that a
  neutral (reactivity 1.0) character lands mid-band (~13), and the reactivity range 0.6–1.6 then
  spreads archetypes across ~8–22 (§5). The fit is done empirically against the harness, then
  frozen and marked `// Approximation debt (momentary affect):` — phasic-DA literature constrains
  the *timescale and transient nature*, not the abstract 0–100 magnitude.
- **Decay.** Not a new mechanism — the existing drift relaxes each blip toward target at the fast
  DA/NE rate, modulated by inertia (t½ ~1–2 h). This is why the variance is genuinely *within-day*
  and not cumulative: blips wash out over hours.
- **Systems hit.** **Dopamine and norepinephrine only** (the fast/momentary systems). Serotonin is
  excluded — it is the slow tonic axis and (per the architectural finding) physically cannot carry
  this; GABA is excluded as a slow inhibitory-tone system. This matches the corrected affect metric
  (§4) weighting the fast systems.

### PRNG stream: `rng`, not `backgroundRng` — and why

Per CLAUDE.md: *"if the pick result affects game state (NT levels, money, availability, activity
path), use `rng`. If it only selects prose the player sees, use `cosmeticRng`."* Momentary
perturbations **change NT levels** — which feed moodTone, prose shading, option availability,
habit-learning inputs, sentiment processing. They are unambiguously game-state-affecting.
Therefore **`rng`** (`Timeline.random()` / `Timeline.randomInt()`), the mechanical-gameplay stream.

`backgroundRng` is "ambient events and background simulation (reserved)" — a tempting label, but it
is for *background-world* simulation (NPC offscreen life, ambient occurrences that aren't about the
player's own neurochemistry). The player's own affect blips are foreground mechanical state, not
background world simulation. Using `backgroundRng` would also risk the perturbation stream
desynchronizing from the action/replay spine that lives on `rng`. **`rng` is correct.**

### RNG-discipline / replay implications (a breaking save-version change)

Adding a new `rng` consumer inside `advanceTime()` **shifts the `rng` stream for every subsequent
draw in a run** — it is a breaking change to deterministic replay. Per CLAUDE.md ("Old saves
purged on version bump") this **requires a save-version bump** (`CURRENT_VERSION` in `js/game.js`,
currently 37 → 38) and purges old runs. This is acceptable and expected ("Early development — no
save compatibility").

Determinism is preserved *going forward* because:
- the perturbation draws come from the seeded `rng` stream in a fixed call position within
  `advanceTime()`, which is itself called in deterministic order during replay;
- `advanceTime(minutes)` is replayed with the *same* `minutes` argument it was recorded with, so
  the expected-event-count (a function of `minutes`) is identical on replay;
- no `Math.random`/`Date.now`; no wall-clock dependence.

**One subtlety to settle at implementation:** the number of `rng` draws inside `advanceTime` must
be a deterministic function of `minutes` (e.g. one draw per whole game-minute, or a fixed small
number of draws with a Poisson-thinning), so that the *same* `advanceTime(m)` consumes the *same
number* of `rng` values every time — otherwise a variable draw count would make the stream
position depend on outcomes and desync. Recommended: **iterate a fixed quantum (e.g. per game-
minute, or per fixed 5-min block), drawing exactly one `rng` value per quantum to decide
occurrence + magnitude+sign in a fixed sub-sequence.** Fixed draw count per unit time = replay-safe.

---

## 4. Correcting the harness metric

The current affect proxy is serotonin-weighted: `affectProxy = 50 + 0.6·(SER−base) +
0.4·(DA−base)`. Since SER structurally cannot carry within-day variance, and EMA *momentary* affect
is dominated by the fast systems, the within-day metric must weight the fast systems. Note the
current proxy omits NE entirely — yet NE (arousal) is a major component of momentary affect and is
a primary perturbation target.

### Corrected momentary-affect proxy

```
affectProxyMomentary = 50
                     + 0.45·(DA − DA_base)        # engagement/positive activation
                     + 0.30·(NE − NE_base)        # arousal (toward "activated" pole)
                     + 0.25·(SER − SER_base)      # residual tonic emotional coloring
```

- **Fast systems lead (DA 0.45, NE 0.30 = 0.75 combined)**, matching that momentary affect ≈
  activation/arousal, the phasic axes.
- **Serotonin retained at low weight (0.25)** — it still colors momentary self-report
  (a depressed tonic background shifts every momentary rating down), but it is no longer the
  dominant term. Keeping it nonzero avoids over-correcting into a pure-arousal metric.
- **NE enters with positive sign as activation**, consistent with circumplex models where momentary
  positive affect loads on activation; the proxy measures valence-arousal blended affect, the same
  blend EMA PA/NA scales capture.

### Avoiding circularity

The metric must measure *real emergent state*, not be rigged to pass. Guards:

- **The proxy reads NT *levels*, the genuine simulated state** — the same levels moodTone, prose,
  and every downstream system read. It is a read-only instrument; it never feeds back.
- **The weights are fixed from the construct (fast-systems-dominant momentary affect), not fit to
  hit 13.** The number that gets *calibrated* against the band is the **perturbation magnitude/λ
  (§3)** and the **reactivity range** — the *generators* — not the *measurement*. Calibrating the
  generator to a fixed, construct-justified instrument is legitimate; calibrating the instrument to
  pass would be the circular move (and is exactly the error the tuning phase flagged for the old
  0.6/0.4 weighting). The weights here are justified *a priori* by the fast-vs-slow architecture,
  then frozen before generator calibration.
- **The band itself is external** (Jones 2020 PMID 32324001), unchanged.

The harness keeps reporting BOTH the continuous proxy iSD and the moodTone distribution, so the
two failure modes (couplings/perturbations too weak vs. moodTone thresholds too coarse) stay
distinguishable from data.

---

## 5. Verification plan

The harness (`scripts/nt-trajectory.js`) is the arbiter. Success criteria, all simultaneously:

1. **Free-running gameplay trajectory, not only re-pinned smooth drivers.** Add a run mode that
   advances the real sim through a representative day via the *actual action cadence* (interactions
   + idles calling `advanceTime`), so the perturbation generator actually fires. The smooth-driver
   runs are retained as the *tonic-floor* control (they should still read ~1, confirming the floor
   is correctly low and the new variance is event-sourced, not coupling-inflated).

2. **Typical individual within-day iSD in 8–18.** The neutral/baseline archetype (reactivity 1.0)
   lands ~13 (band center) on `affectProxyMomentary`.

3. **Archetype spread ~8–22 reproducing the heritable individual difference.**
   resilient (low reactivity ~0.6–0.8) near ~8; baseline ~13; ruminator (high reactivity ~1.4–1.6)
   near ~18–22. **Direction corrected** — ruminator now *more* volatile than resilient (Mader 2023
   PMID 37253012; between-person SD of iSD ≈ 7, Zheng 2016 PMID 27729566; heritability PA .34 /
   NA .54). The harness's `ARCHETYPES` already span the trait range; verify the iSD ordering flips
   to resilient < baseline < ruminator.

4. **All 5 stacking checks + crisis control + no-saturation guardrails stay green.** The
   perturbation kicks must not push the fast systems into sustained clamp saturation (the harness
   already flags FLOOR-PINNED/CEIL-PINNED > 20% and NEARLY-STATIC). Because blips are small and
   decay, the *settled* levels stay in range; verify the DA/NE saturation counters do not rise.
   The 6 stacking checks read the *raw target* (`_ntTargetRaw`, pre-drift, pre-perturbation) so
   they are unaffected by perturbations by construction — confirm they still pass unchanged.

5. **Crisis control still reaches dark tones.** Sustained maximal-negative load still drives
   heavy/numb/hollow (perturbations add jitter on top of, not instead of, the held extreme).

6. **Deterministic replay intact.** Add/extend a replay test: run a fixed action sequence twice
   under the same seed; assert identical NT trajectories and identical `rng` stream position. This
   is the load-bearing regression for the new `rng` consumer.

7. **moodTone now leaves 'present' within an ordinary day** at least occasionally for the volatile
   archetype — evidence the variance reaches the readout, not just the proxy.

---

## 6. Risks and ripple effects

This touches `advanceTime()`/`driftNeurochemistry`, which *every* system reads downstream.

- **Coupling stability.** Perturbations are small (±2–6 pre-scaling) and decay fast; they ride on
  top of the target-seeking drift, which is a contraction (always pulls back toward target). They
  cannot destabilize the couplings (no positive feedback; the drift is strictly stabilizing). The
  main risk is *saturation* if magnitude/λ are set too high — guarded by harness check #4. **Risk:
  low, monitored.**

- **Habit-learning CART (`habits.js`).** The CART learns state→action patterns from observed play
  and explicitly *consumes no RNG*. **Corrected (post-ship review):** the CART's NT features were
  in fact the **raw** `serotonin/dopamine/norepinephrine/gaba` levels to full precision (the prior
  "reads tier functions / aggregated state" mitigation claim was false — those continuous NT
  features sat alongside the tier features and carried the full minute-scale injector noise). The
  CART now reads the **smoothed** levels (`*_smoothed`, the same short-τ EMAs `moodTone()` reads),
  so habit features are debounced and a single micro-event blip no longer flips a feature. Still
  consumes no RNG (a plain state read). **Risk: resolved.**

- **Sentiment system.** Sentiments shift *targets* and are processed during sleep toward baseline;
  they are slow and do not read instantaneous NT blips directly. Perturbations operate on *levels*,
  a different channel. **Risk: minimal.** Confirm no sentiment path reads instantaneous DA/NE level
  as an accumulator.

- **NT-baseline drift (`nt-baseline.md`).** Baselines track the *recent average* level (τ ≈ 3
  weeks). **Corrected (post-ship review):** the baseline EMA originally read the post-injection
  (jittered) level, so the negativity-biased stream leaked ~1 pt/week into the chronic setpoint
  (measured), with an NE asymmetry near the soft-clip wall (+0.37). This violated the state-ownership
  rule (chronic setpoint is owned exclusively by the baseline/history system; the momentary stream
  is transient-only). It is now **cleanly decoupled** (FIX 3): the DA/NE blip is tracked as a
  transient offset, decayed in lockstep with the level, and the baseline EMA reads
  `level − transient`. The momentary stream now contributes ≈0 to the setpoint (the EMA-input
  quantity moves ≤0.014 pt/min versus multi-point raw blip jumps — verified in the harness).
  **Design consequence:** the earlier "a life of small frustrations erodes setpoint" interpretation
  was a *consequence of the bug*, not a designed channel. If chronic mood erosion from accumulated
  daily stress is wanted, it must be modeled deliberately in the baseline/history system, not
  smuggled in via the transient stream's negativity bias. **Risk: resolved.**

- **Existing tests/fixtures.** `nt-drift.test.js`, `tier-functions.test.js`, and any
  fixed-trajectory snapshot tests will change outputs once `advanceTime` consumes new `rng` and
  perturbs levels. **All NT-trajectory fixtures must be regenerated.** Tests asserting exact NT
  values after `advanceTime` will need updating to tolerances or regenerated golden values. **This
  is real churn — budget for it.**

- **Save-version / migration.** New `rng` consumer → **`CURRENT_VERSION` 37 → 38**, old runs
  purged. No migration shim (per CLAUDE.md). `affective_reactivity` derives from existing trait
  fields (no new save field). **Impact: one version bump, accepted.**

- **`prefers-reduced-motion` / typography.** More within-day affect movement → inner-voice tiers
  and prose shading shift more often. This is the *intended* effect (rarity makes heavy treatment
  land; more movement = more texture), but verify it doesn't make the heavy typographic treatments
  *too* frequent (rarity erosion). **Risk: aesthetic, monitor in playtest.**

### Decisions that need the user's input before implementation

1. **Negativity bias of the perturbation stream + its baseline interaction.** Should the micro-event
   stream be exactly zero-mean (blips pure jitter, baselines untouched), or slightly
   negativity-biased (small frustrations slowly erode setpoint over chronic time)? The latter is
   more realistic and couples elegantly to `nt-baseline.md`, but introduces a slow chronic
   drift that must be deliberate, not accidental. **Recommendation: slight negativity bias
   (~1.1–1.2× negative magnitude), explicitly designed and harness-verified to be negligible
   within-week and only chronic over weeks.** Flagging because it's a phenomenology choice with
   long-horizon consequences.

   > **RESOLVED (post-ship review, FIX 3).** The negativity bias (1.1×) is retained on the
   > *magnitude* of negative blips (real momentary asymmetry), but the stream is now **fully
   > decoupled from the chronic setpoint**: the baseline EMA reads `level − transient`, excluding
   > the blip residual, so the bias contributes ≈0 to the setpoint rather than the ~1 pt/week it
   > leaked before. The "small frustrations slowly erode setpoint" channel is therefore NOT carried
   > by this stream. The momentary negativity bias is now purely a *within-day* phenomenon (negative
   > moments register a touch larger/stickier in the moment); chronic setpoint erosion, if desired,
   > belongs in the baseline/history system as a deliberate channel.

2. **Reactivity trait weights `{n 0.45, r 0.35, seInv 0.20}` and range `[0.6, 1.6]`.** Direction/
   ordering are literature-grounded (neuroticism-led for amplitude); the magnitudes are chosen.
   Settle-able by the author as approximation debt, but worth a confirmation since it sets how
   wide the archetype spread comes out.

Everything else (stream = `rng`; perturbation lives in `advanceTime`; reactivity = on-demand
multiplier at `adjustNT`-injection; fast-systems-only; corrected proxy weights; version bump) is a
settled design call I can implement without further input.

---

## Implementation plan (ordered; no production code written yet)

The two fixes are **co-dependent and must ship together** (perturbations with no reactivity =
wrong archetype spread; reactivity with no perturbations = nothing to amplify). Order within the
single landing:

1. **`scripts/nt-trajectory.js` — correct the metric first (measurement before mechanism).**
   Add `affectProxyMomentary` (DA 0.45 / NE 0.30 / SER 0.25) alongside the existing proxy; report
   both. Add a **free-running gameplay** trajectory mode. Keep the smooth-driver runs as the
   tonic-floor control. *No engine change yet — observe the floor under the corrected metric.*

2. **`js/state.js` — add `reactivityFactor()`** (parallel to `effectiveInertia()`), reading
   `neuroticism / rumination / self_esteem` live. Mark weights/range `// Approximation debt
   (reactivity):`. Pure function, no RNG, no state mutation. Excludes physiological systems by
   construction (only called from the perturbation injector).

3. **`js/state.js` — add the momentary-perturbation injector inside `advanceTime()`** (or a helper
   called from it), drawing from `Timeline.random()` (the `rng` stream) with a **fixed draw count
   per unit time** (per-game-minute or per-5-min quantum), suppressed during `is_sleeping`,
   applying `adjustNT('dopamine'|'norepinephrine', signedMagnitude · reactivityFactor())`.
   Mark magnitude/λ/sign-bias `// Approximation debt (momentary affect):`.

4. **`js/game.js` — bump `CURRENT_VERSION` 37 → 38**; old runs purged on load (existing machinery).

5. **Calibrate against the harness.** With the metric frozen (step 1), tune *only* the generator
   (perturbation magnitude, λ, sign-bias) and the reactivity range so: baseline iSD ~13;
   resilient→ruminator spread ~8→22 in the corrected order; no saturation; crisis still dark;
   stacking checks unchanged. Freeze the chosen numbers as approximation debt.

6. **Regenerate/repair tests.** Update `nt-drift.test.js`, `tier-functions.test.js`, and any
   exact-value trajectory fixtures to the new behavior; add a **deterministic-replay regression**
   (same seed + same action sequence → identical NT trajectory + identical `rng` position).

7. **Update docs to match shipped behavior.** Update `mood-variability.md` § TUNING-PHASE OUTCOME
   (mark the fix shipped), `docs/design/overview.md` (per CLAUDE.md: any change to simulation
   *behavior* requires an overview.md check — this adds a whole affect-dynamics axis), `STATUS.md`,
   and remove the corresponding TODO.md entry once done.

**Files touched:** `scripts/nt-trajectory.js`, `js/state.js`, `js/game.js`, plus `character.js`
only if `reactivityFactor()` needs a `base_*` companion (it does not, since it derives from
existing traits), test files, and the docs above. **RNG-stream decision: `rng`. Save-version: 37 →
38. Determinism: preserved via fixed per-quantum draw count.**

---

## Citations

All empirical IDs below were verified via web search on 2026-06-05 except where marked unverified.

- **Jones DR et al. 2020.** Affect Variability and Inflammatory Markers in Midlife Adults.
  *Health Psychology* 39(8):655–666. **PMID 32324001**; DOI 10.1037/hea0000868; PMC8351733.
  *(within-person iSD of momentary affect ≈ 13–15 on 0–100 — the target band)*
- **Mader N et al. 2023.** Emotional (in)stability: Neuroticism is associated with increased
  variability in negative emotion after all. *PNAS* 120(23):e2212154120. **PMID 37253012**;
  DOI 10.1073/pnas.2212154120; PMC10266024. *(neuroticism raises variability AND inertia — the
  stability–instability paradox; load-bearing for the reactivity axis)*
- **Houben M, Van den Noortgate W, Kuppens P. 2015.** The relation between short-term emotion
  dynamics and psychological well-being: A meta-analysis. *Psychological Bulletin* 141(4):901–930.
  **PMID 25822133**. *(variability, instability, and inertia as DISTINCT dynamics; inertia
  r-values grounding effectiveInertia weights)*
- **Hisler GC, Krizan Z, DeHart T, Wright AGC. 2020.** Neuroticism as the intensity, reactivity,
  and variability in day-to-day affect. *Journal of Research in Personality* 87:103964.
  DOI 10.1016/j.jrp.2020.103964. **PMID unverified** (journal not cleanly PubMed-indexed per
  2026-06-05 search; cite by DOI). *(neuroticism → reactivity of NA to stressors + variability)*
- **Kuppens P et al. 2010.** *(emotional inertia, valence-symmetric self-esteem association)*
  **PMID 20424092** (as already cited in `effectiveInertia()`).
- **Zheng Y, Plomin R, von Stumm S. 2016.** Heritability of Intraindividual Mean and Variability of
  Positive and Negative Affect. *Psychological Science* 27(12):1611–1619. **PMID 27729566**;
  DOI 10.1177/0956797616669994; PMC5221725. *(variability is heritable/trait; between-person SD of
  iSD ≈ 7 → archetype spread target)*
- **Scott SB et al. 2020.** A Coordinated Analysis of Variance in Affect in Daily Life.
  *Assessment* 27(8):1683–1698. **PMID 30198310**; DOI 10.1177/1073191118799460; PMC6408986.
  *(within-day/momentary component dominates day-to-day)*
- **Phasic dopamine timescale** — reward-prediction-error literature (Schultz and successors):
  phasic DA latency <100 ms, duration <200 ms; the sim models the minute-scale affective footprint,
  not the neuronal burst. Acute NAc DA recovery 1–2 h (**PMID 1606494**, cited at `ntRates.dopamine`);
  NE recovery 45–90 min (**PMID 6727569**, cited at `ntRates.norepinephrine`).
