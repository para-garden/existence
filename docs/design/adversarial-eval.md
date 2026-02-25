# Adversarial Tick Evaluation

**Status:** design / not yet implemented
**Type:** living document — append findings as runs are performed

A methodology for discovering exploitable sim structure before players do. Not a correctness test — a design signal. The adversary reveals local minima that don't resemble realistic human behavior.

---

## The problem

Even with invisible stats, players can discover through experience that certain action sequences produce consistently better outcomes (more energy, fewer bad events, more emotional relief). If the sim has any interaction with net-positive NT effects and no per-use cost beyond time, that interaction becomes a loop target. "Shower every 30 minutes" or "read book forever" are the failure mode: unrealistic in real life, but locally optimal in the sim.

The deeper issue: a well-modeled sim should have its optimal strategy *be* realistic behavior. If the adversary finds a degenerate strategy, that strategy points directly at the missing constraint.

---

## Structural mechanisms that already prevent minmaxing

**Exponential approach** — NT drift toward targets means diminishing returns near the target. You can't keep pushing serotonin up if it's already close to its target; the gain per action shrinks toward zero.

**Adenosine as hard floor** — accumulates while awake regardless of actions. Sleep is mandatory. No strategy optimizes around it.

**NT target coupling** — serotonin target reads social, hunger, financial anxiety, friend guilt, sentiment stack. You can't act on serotonin directly; you have to address the states that set the target. Fixing one while neglecting others hits a ceiling fast.

**Sentiment habituation (partial)** — comfort sentiments lose intensity with repeated activation (−0.002–0.003/use). Applied at ~6 sites. The mechanism is correct; coverage is incomplete.

**Time as universal cost** — everything takes time. Action opportunity cost is real.

---

## What's structurally missing

**Habituation should generalize.** Any interaction that produces comfort/relief should carry diminishing returns when repeated in a short window — not a cooldown (a constraint from nowhere) but a sentiment or tolerance that models what's real: the 10th shower doesn't feel like the first. Currently only substances (tolerance) and a handful of comfort sentiments have this.

**Candidate interactions for habituation gaps** (not yet verified):
- `take_bath` / `shower` — GABA/cortisol effects with no per-use cost
- `breathwork_*` — GABA benefits, no tolerance
- `read_book` — adenosine and stress effects, no fatigue-of-repetition
- `go_for_walk` / `go_for_run` — physical benefits, no overtraining signal
- `listen_to_music` — serotonin/dopamine, no saturation

These are hypotheses. The adversarial agent should confirm or falsify them by finding whether these interactions actually appear in optimal loops in practice.

---

## Design: the adversarial agent

### Harness

`createTestContext(seed)` — headless, no DOM, bun-runnable. The adversary drives it directly.

### Core loop

```js
function adversarialRun(ctx, objective, ticks = 200) {
  ctx.state.init();
  // optionally: apply a character

  const history = [];
  for (let i = 0; i < ticks; i++) {
    const available = getAvailableInteractions(ctx);
    let bestAction = null, bestDelta = -Infinity;

    for (const action of available) {
      const snapshot = cloneState(ctx);
      action.execute();
      const delta = objective(ctx) - objective(snapshot);
      restoreState(ctx, snapshot);
      if (delta > bestDelta) { bestDelta = delta; bestAction = action; }
    }

    if (bestAction) {
      bestAction.execute();
      history.push(bestAction.id);
    } else {
      // no beneficial action — advance time
      ctx.state.advanceTime(30);
    }
  }
  return history;
}
```

State cloning needs care: `s` is a plain object, so `JSON.parse(JSON.stringify(s))` works for pure state, but world location also changes. Either clone both or only test apartment-local interactions in the first pass.

### Objectives

**Single-NT maximizer** (run once per NT):
```js
const serotoninMax = ctx => ctx.state.get('serotonin');
```
Reveals which interactions have uncosted net-positive effects on each NT.

**Stress minimizer:**
```js
const stressMin = ctx => -ctx.state.get('stress');
```
If optimal strategy is "never go to work," the job standing + financial anxiety coupling isn't strong enough.

**Composite quality** (approximate):
```js
const composite = ctx => {
  const s = ctx.state;
  return s.get('serotonin') * 0.3
       + s.get('dopamine') * 0.2
       + s.get('gaba') * 0.2
       - s.get('stress') * 0.2
       + s.get('energy') * 0.1;
};
```
Weights are a starting point — adjust based on what "feels like quality of life."

### Output to inspect

- Top-10 most-used interactions per run
- Repeating loops: any 2–5 action sequence cycling > 3 times
- NT levels at tick 200 vs. initial baseline
- **Flag:** any interaction appearing in >30% of adversarial ticks

### Location handling (first pass)

Fix the character to the apartment. This misses outdoor/workplace interactions but gives clean results for the densest interaction set. Later: include movement and run the adversary over the full world graph.

---

## Running findings

*Append here after each run. Format: date, objective, top interactions found, design gaps identified, changes made.*

### 2026-02-25 — manual audit (by sight)

**Method:** skimmed all execute() blocks for positive adjustNT calls, checked for sentiment habituation, cooldowns, or resource costs. No adversarial agent run yet — this is the baseline before implementation.

**Already habituated (good):** shower (warmth sentiment), take_bath (warmth), look_out_window (rain_sound), listen_to_music (quiet), breathwork_* (effectMult reduction), yoga_home (effectMult), go_for_walk (outside sentiment), sit_on_bench (outside), write_in_journal (routine), apply_skincare (routine), talk_to_coworker (warmth/irritation), visit_friend, message_friend (guilt).

**Critical gaps — no habituation, repeatable indefinitely:**

| Interaction | NT boost | Time | Concern |
|---|---|---|---|
| `go_for_run` | NE+13, DA+10, GABA+8, ser+6, eCB+12 | 30m | Largest compound boost in codebase. eCB (runner's high) habituates within weeks of regular training. |
| `home_workout` | NE+8, DA+6, GABA+5, ser+4, eCB+7 | 20m | Same as go_for_run, slightly smaller. Both need exercise tolerance modeled. |
| `sit_on_couch` | ser+3, GABA+3, NE-2 | 12–20m | Pure passive rest with no diminishing return. |
| `lie_there` | stress−1/−2 (mood-var.) | 10–20m | Same as couch — stillness loops indefinitely. |
| `apply_makeup` | ser+4, GABA+2, NE-3 | 12m | Resource-gated by makeup_count but no habituation on the effect itself. |
| `do_hair` | ser+2, NE-2 | 8m | Fast, no cost, no habituation. |
| `brief_exchange` | ser+2, social+5 | 3m | Neighbor interaction with no familiarity fatigue. |
| `nod_at_neighbor` | ser+1, social+2 | 1m | Fastest loop — 60 nods/hour for steady serotonin. |
| `read_book` | NE-2, stress-3 | 30m | Soft-gated by engagement state but no explicit habituation. |

**Suggested fix pattern for all:** `adjustSentiment(target, 'comfort', -0.002)` in execute() with an appropriate target name. This models the real diminishing return without adding an invented cooldown. Magnitude guidance:
- Exercise (go_for_run, home_workout): −0.003 on an `exercise_routine` or `outdoor_exercise` target; additionally, eCB specifically should habituate faster than other NTs
- Passive rest (sit_on_couch, lie_there): −0.001 to −0.002 on a `stillness` or `rest_comfort` target
- Grooming (do_hair, apply_makeup): −0.002 on `grooming_routine` or `appearance`
- Neighbor contact (brief_exchange, nod_at_neighbor): −0.001 on `neighbor_familiarity` target; serotonin gain should also scale with `neighborTier()` — first nod is warmer than the 50th

**Changes made from this audit:** habituation sentiments added 2026-02-25 to all 8 interactions above: `go_for_run` and `home_workout` (exercise_routine, −0.003), `sit_on_couch` and `lie_there` (rest_comfort, −0.002), `apply_makeup` and `do_hair` (grooming_routine, −0.002), `nod_at_neighbor` and `brief_exchange` (neighbor_familiarity, −0.001). `read_book` deferred — already soft-gated by engagement state; revisit after adversarial agent confirms it's actually exploited.

---

### 2026-02-25 — first adversarial agent run

**Method:** `scripts/adversarial-eval.js` — headless greedy agent, 200 ticks, seed 42, apartment-fixed, three objective variants. State cloning via getAll/restoreSnapshot + PRNG state save/restore.

**serotoninMax — `listen_to_music` at 94% of ticks.** Serotonin reached 100 cap. GABA crashed to 15.8 (from 55) — music raises serotonin/dopamine with no GABA cost and no habituation on the music experience itself. Only had a `quiet` sentiment habituation (breaks quiet-comfort) which doesn't fire if the character doesn't particularly value quiet.

**composite — `listen_to_music` at 85% of ticks.** Same mechanism.

**stressMin — `get_dressed`/`undress_floor` toggle at 98% of ticks (98 alternations).** Not a genuine exploit: neither interaction adjusts stress. The adversary is using them as efficient time-passing actions (8 min/cycle × 200 ticks = 1600 min elapsed). Stress drifts toward target naturally; any action that passes time without raising stress is "optimal" under this objective. Verdict: expected behavior, not a code gap.

**Gaps identified:** `listen_to_music` — no habituation on music comfort itself. Fixed immediately: `adjustSentiment('music', 'comfort', -0.002)` added.

**Previously audited gaps now covered:** all 8 interactions from 2026-02-25 manual audit have habituation sentiments. Adversarial agent confirms `listen_to_music` was also missing.

**Remaining concerns not yet verified by agent:**
- `read_book` — soft-gated but may still dominate in certain objective runs
- Substance use interactions — no tolerance-based habituation yet (deferred to NT baseline withdrawal migration)

---

## Connection to sim variable structure

The adversarial agent reveals which state variables have "free paths" to high values — variables whose targets can be moved without addressing the underlying real-world states they're supposed to model. A serotonin target that can be raised without genuine social connection, without sleep quality, without financial stability, is a free variable: the sim lets you cheat it.

Every time the adversary finds an exploit, the diagnosis is: some variable's target or drift rate isn't coupled tightly enough to the things that should modulate it. The fix isn't a cooldown or cap — it's identifying the missing real-world constraint and modeling it.
