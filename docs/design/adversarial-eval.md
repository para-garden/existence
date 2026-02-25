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

### 2026-02-25 — not yet run

Initial design. No runs performed yet.

---

## Connection to sim variable structure

The adversarial agent reveals which state variables have "free paths" to high values — variables whose targets can be moved without addressing the underlying real-world states they're supposed to model. A serotonin target that can be raised without genuine social connection, without sleep quality, without financial stability, is a free variable: the sim lets you cheat it.

Every time the adversary finds an exploit, the diagnosis is: some variable's target or drift rate isn't coupled tightly enough to the things that should modulate it. The fix isn't a cooldown or cap — it's identifying the missing real-world constraint and modeling it.
