# Work Schedule Interface

**Relates to:** `js/state.js`, `js/character.js`, `js/chargen.js`, `js/content.js`
**Approximation debt being replaced:** `work_shift_start` / `work_shift_end` scalar pair in state.js

---

## 1. The Problem, Precisely

The current model stores two integers in state: `work_shift_start` and `work_shift_end` (minutes since midnight). Everything that touches work scheduling reads these directly:

- `isWorkHours()` — `tod >= s.work_shift_start && tod < s.work_shift_end` — breaks for overnight shifts
- `isWorkday()` — Mon–Fri unconditionally — wrong for every service job
- `latenessMinutes()` — reads `s.work_shift_start` directly
- `isLateForWork()` — reads `s.work_shift_start` directly
- `callInSick.available()` — calls `isWorkHours()` and `getHour() < 12`
- The alarm-setting interaction — `shiftStart - 90` hardcoded
- `move:bus_stop` prose — `tod >= shiftStart - 120 && tod < shiftStart + 30`
- `applyToState()` in character.js — sets `work_shift_start`/`work_shift_end` from job type

The problem is not that these functions are buggy for existing characters. It is that the interface cannot express what most real service jobs look like. Designing more work content against the current interface deepens the debt.

---

## 2. Design Principle: Interface for Full Generality, Implementations Vary

Following the precedent in `docs/design/objects.md`: the Schedule interface is designed for the richest possible model. A coarse implementation maps from the current fixed-shift scalars. A full implementation uses per-day schedule objects with revelation timing. Content calls the same interface either way.

The coarse implementation is a legitimate permanent state. A new run created under the full implementation gets per-day scheduling. Old saves keep the coarse implementation.

---

## 3. The Schedule Data Model

### 3.1 A Single Day's Work Entry

The core unit is a `WorkDay` — what the character knows about a given calendar day's work obligations.

```js
/**
 * A WorkDay describes what is known about work obligations on a given day.
 *
 * @typedef {{
 *   type: 'off' | 'fixed' | 'variable' | 'on_demand' | 'split' | 'unknown',
 *
 *   // Present on 'fixed', 'variable', 'split', 'on_demand' (once revealed)
 *   segments?: Array<{ start: number, end: number }>,
 *   // start/end in minutes since midnight of that calendar day's start.
 *   // Overnight: end > 1440 means shift bleeds into next calendar day.
 *   // E.g. 23:00–07:00 = { start: 1380, end: 1870 }
 *
 *   revelation: 'known' | 'morning_of' | 'unrevealed',
 *   // 'known'       — schedule was known when the week posted
 *   // 'morning_of'  — will be revealed during morning_reveal window
 *   // 'unrevealed'  — morning_of hasn't fired yet; player doesn't know
 *
 *   reveal_window?: { from: number, to: number },
 *   // When revelation === 'morning_of': window in which the text/call arrives.
 *   // Minutes since midnight. E.g. { from: 360, to: 480 } = 6–8 AM
 *
 *   hours?: number,
 *   // Expected paid hours (for pay calculation). Absent if unknown before revelation.
 *
 *   cut_early?: boolean,
 *   // Manager sent them home before shift end (lost hours, no choice)
 *
 *   asked_to_stay?: boolean,
 *   // Manager asked to stay past scheduled end. Player choice if available.
 * }} WorkDay
 */
```

### 3.2 Schedule Types

**`off`** — no work obligation. May be a scheduled day off, a weekend, a sick day taken. `segments` absent.

**`fixed`** — one contiguous shift with known start and end. The current model only represents this.

**`variable`** — a shift that is scheduled but where hours may vary (cut early, sent home after it's slow). `segments` gives the scheduled window; actual hours may differ.

**`on_demand`** — whether the character is even working this day is unknown until revelation fires. Pre-revelation: `revelation === 'unrevealed'`, no segments. Post-revelation: type stays `on_demand`, `revelation` becomes `'known'`, segments populated (or type becomes `off` if no shift).

**`split`** — two disconnected segments on the same day (lunch rush + dinner rush). `segments` has two entries. Gap is unscheduled time between them — the character is off-site but can't fully decompress.

**`unknown`** — far-future day, schedule not yet posted. Differs from `on_demand`: `on_demand` is a structural feature of the job (the character expects this is how it works); `unknown` is ordinary calendar fog.

### 3.3 Overnight Shift Representation

Overnight shifts cross midnight. The representation: `end > 1440`.

A shift starting at 23:00 and ending at 07:00 the following morning:
```
{ start: 1380, end: 1870 }  // 1380 = 23*60, 1870 = 31*60 = 1440+430
```

The calendar day anchor is the day the shift *starts*. This is consistent with how workers experience overnight work — "Tuesday night shift" means you leave Tuesday night.

### 3.4 The Schedule Registry

The Schedule interface exposes a rolling window of WorkDays keyed by game day number. Only a forward horizon (configurable by schedule type) is stored. Past days are retained for pay calculation.

---

## 4. Interface

```js
// createSchedule(ctx) → Schedule

// === QUERIES ===

/**
 * Returns the WorkDay for a given game day number.
 * If beyond the known horizon: returns { type: 'unknown', revelation: 'known' }.
 * If game day is in past: returns stored historical entry (for pay calculation).
 */
Schedule.getDay(day)

/**
 * Returns the WorkDay for the current game day.
 */
Schedule.today()

/**
 * Returns whether the character is currently in a work segment.
 * Works correctly for overnight shifts by comparing absolute game time.
 */
Schedule.isWorkHours()

/**
 * Returns whether the character has a work obligation today (scheduled or revealed).
 * Does NOT return true for 'unknown' or 'unrevealed' on_demand days.
 */
Schedule.isWorkday()

/**
 * Returns whether the character has an unrevealed on_demand shift today.
 * True when today is on_demand and revelation === 'unrevealed'.
 * This is the "I don't know if I'm working today" state.
 */
Schedule.isRevealPending()

/**
 * Minutes from now until current shift starts (negative if already started).
 * Returns null if not a workday or shift type has no start time.
 */
Schedule.minutesUntilShiftStart()

/**
 * Minutes past shift start, ignoring grace period.
 * Used by latenessMinutes(). Returns 0 if not late.
 */
Schedule.latenessMinutes()

/**
 * Returns the scheduled end of today's current or upcoming segment.
 * Null if no shift or shift type doesn't have a known end.
 */
Schedule.shiftEnd()

/**
 * Returns today's scheduled paid hours if known, null otherwise.
 */
Schedule.todayScheduledHours()

/**
 * Returns the number of hours worked in the current biweekly pay period.
 * Sum over all 'worked' days in the period. Updated by markWorked().
 */
Schedule.hoursWorkedThisPeriod()

// === MUTATIONS ===

/**
 * Advance the schedule by one game day. Called at wakeUp().
 * - Generates tomorrow's entry if needed (for on_demand, runs PRNG).
 * - Shifts the window forward.
 * - Fires revelation for on_demand if reveal_window has passed.
 */
Schedule.advance()

/**
 * Reveal today's on_demand shift. Called when real-game-time enters reveal_window.
 * Consumes exactly 1 Timeline.random() call (always, whether shift exists or not).
 * Updates today's WorkDay: either populates segments or marks as off.
 * Returns the revealed WorkDay.
 */
Schedule.revealToday()

/**
 * Mark today as worked (character actually showed up and worked).
 * Records hours. Used for pay calculation.
 * @param {number} hoursWorked — actual hours, may differ from scheduled
 */
Schedule.markWorked(hoursWorked)

/**
 * Apply a cut-early: shift ends now instead of at scheduled end.
 * Sets cut_early on today's WorkDay. Updates shiftEnd() accordingly.
 */
Schedule.cutEarly(currentTime)

/**
 * Record that manager asked character to stay late.
 * Sets asked_to_stay. Player interactions can then accept/decline.
 */
Schedule.offerOvertime(newEnd)

/**
 * Accept overtime offer. Updates today's segment end.
 */
Schedule.acceptOvertime()

// === SERIALIZATION ===

/**
 * Coarse: stores { shift_start, shift_end, workdays_per_week, schedule_type }.
 * Full: stores { days: Map<dayNum, WorkDay>, schedule_config, hours_worked_this_period }.
 */
Schedule.serialize()
Schedule.deserialize(data)
```

---

## 5. How `isWorkHours()` and `isWorkday()` Change

### Current

```js
// state.js
function isWorkHours() {
  if (!isWorkday()) return false;
  const tod = timeOfDay();
  return tod >= s.work_shift_start && tod < s.work_shift_end;
}

function isWorkday() {
  const dow = dayOfWeek();
  return dow >= 1 && dow <= 5;
}
```

### Proposed

The state.js functions become thin delegates to `ctx.schedule`:

```js
function isWorkHours() { return ctx.schedule.isWorkHours(); }
function isWorkday()   { return ctx.schedule.isWorkday(); }
function latenessMinutes() { return ctx.schedule.latenessMinutes(); }
```

Overnight detection in the full implementation compares absolute game time:

```js
// Inside Schedule.isWorkHours() — full implementation:
// For each segment of today's WorkDay (and potentially yesterday's if overnight):
//   absoluteStart = dayStart + segment.start
//   absoluteEnd   = dayStart + segment.end   // may exceed dayStart + 1440
// where dayStart = (dayNumber - 1) * 1440 + startTimestampOffset
//
// For yesterday's overnight check:
//   If yesterday has a segment with end > 1440,
//   check if now < yesterdayDayStart + segment.end
```

`isWorkday()` in the full implementation checks `today().type !== 'off' && today().type !== 'unknown'` AND that revelation is not `'unrevealed'`. An unrevealed on_demand day is not a workday yet.

`isLateForWork()` in state.js becomes:
```js
function isLateForWork() {
  if (!isWorkday()) return false;
  return ctx.schedule.latenessMinutes() > 0 && !s.at_work_today && !s.called_in;
}
```

---

## 6. Paycheck Model

### Current Model

```
pay = pay_rate * min(days_worked_this_period, 10) / 10
```

This model cannot express variable hours per shift, on-demand workers with wildly variable periods, overtime pay, or minimum-hours guarantees.

### Proposed Model

Replace `days_worked_this_period` with `hours_worked_this_period` (tracked via `Schedule.markWorked(hoursWorked)`).

Replace `pay_rate` (biweekly lump) with `hourly_rate` + `guaranteed_hours` (for schedule types that have a guarantee).

```js
// At paycheck:
const hours = Schedule.hoursWorkedThisPeriod();
const baseHours = Math.min(hours, schedule_config.max_hours_per_period);
const pay = hourly_rate * baseHours;
```

For fixed-schedule office workers, `hourly_rate * 80` ≈ the current `pay_rate`. Rough mapping:
```
// Approximation debt: hourly_rate derived from job-type bucket, not from
// real minimum wage data for character's location. Should derive from
// character's latitude/region when neighborhood economic tier is implemented.
office:        hourly_rate ≈ pay_rate / 80
retail:        hourly_rate ≈ pay_rate / 80
food_service:  hourly_rate ≈ pay_rate / 80
```

**Backwards compatibility:** Old saves with `pay_rate` but no `hourly_rate` — `applyToState()` converts: `hourly_rate = pay_rate / 80`. `days_worked_this_period` converts to hours: `hours_worked_this_period = days_worked_this_period * 8`.

---

## 7. Revelation-Anxiety Narrative

When `Schedule.isRevealPending()` is true at wakeup, the character does not know if they are working today. This has specific NT signatures.

### State Effect of Unrevealed Status

Applied in `wakeUp()` when schedule type is `on_demand` and unrevealed (deterministic, no PRNG):

- Cortisol target nudged upward (body mobilized before mind knows)
- NE elevated slightly (anticipatory alertness)

The NT state emerges; no explicit anxiety flag.

### Revelation Event

`Schedule.revealToday()` is called when game time enters the `reveal_window`. This is an idle event (recorded as an action for replay). The reveal consumes exactly 1 `Timeline.random()` call regardless of outcome.

```js
// In idle event handler — called when in reveal_window and isRevealPending():
const workDay = ctx.schedule.revealToday();  // consumes 1 RNG
if (workDay.type === 'on_demand' && workDay.segments.length > 0) {
  // Got a shift — phone message from supervisor
  ctx.state.adjustNT('cortisol', 5);
} else {
  // No shift — income anxiety or relief depending on financial state
  const moneyAnx = ctx.state.sentimentIntensity('money', 'anxiety');
  if (moneyAnx > 0.3) {
    ctx.state.adjustNT('serotonin', -3);
    ctx.state.adjustSentiment('money', 'anxiety', 0.02);
  } else {
    ctx.state.adjustNT('gaba', 3);
  }
}
```

### Idle Thought Hooks

When `isRevealPending()`, idle thoughts reflect the uncertainty (deterministic, no RNG):

```
"The supervisor hasn't texted yet."
"Still don't know if you're going in."
"Every time the phone lights up."
```

After a no-shift reveal for high-money-anxiety character:
```
"The math on this week changes."
"That's hours you won't get back."
```

The prose never names the mechanism. The character just knows they're waiting for a text.

### Location Description Hooks

When `isRevealPending()` and character is at home in the morning, location descriptions can reflect the liminal state — not getting dressed because getting dressed means committing to a day you haven't been summoned to.

---

## 8. Character Generation: Schedule Type by Job Category

### `schedule_config` Object

Added to character at chargen, stored verbatim in RunRecord:

```js
/**
 * @typedef {{
 *   type: 'fixed' | 'rotation' | 'on_demand' | 'split',
 *   workdays_per_week: number,
 *   workday_pattern?: number[],       // Days of week (0=Sun), e.g. [1,2,3,4,5]
 *   shifts?: Array<{ start: number, end: number }>,
 *   // For 'on_demand':
 *   on_demand_rate: number,           // Probability of being called in on eligible day
 *   reveal_window: { from: number, to: number },
 *   min_hours_notice: number,         // Typical lead time in hours
 *   // For 'split':
 *   split_shifts?: Array<Array<{ start: number, end: number }>>,
 *   // Pay:
 *   hourly_rate: number,
 *   guaranteed_hours_per_period?: number,
 * }} ScheduleConfig
 */
```

### Schedule Type Derivation

```js
// After jobType is selected, derive schedule_type:
// Approximation debt: probabilities below are not literature-derived.
// BLS Current Population Survey has just-in-time scheduling prevalence
// by industry — should be researched before these rates are finalized.
function deriveScheduleType(jobType, economicOrigin, careerStability) {
  if (jobType === 'office') return 'fixed';

  if (jobType === 'retail') {
    if (economicOrigin === 'precarious' || careerStability < 0.35) {
      return ctx.timeline.charRandom() < 0.5 ? 'on_demand' : 'rotation';
    }
    return 'rotation';
  }

  if (jobType === 'food_service') {
    if (economicOrigin === 'precarious') {
      return ctx.timeline.charRandom() < 0.6 ? 'on_demand' : 'rotation';
    }
    const roll = ctx.timeline.charRandom();
    if (roll < 0.3) return 'on_demand';
    if (roll < 0.55) return 'split';
    return 'rotation';
  }

  return 'fixed';
}
// Note: all code paths must consume the same number of charRng calls
// for RNG balance — add explicit charRandom() calls on branches that
// don't need them if call counts diverge.
```

### Job Type → Schedule Config Defaults

```
office:
  type: 'fixed'
  workdays_per_week: 5
  workday_pattern: [1,2,3,4,5]
  shifts: [{ start: 540, end: 1020 }]  // 9–5; variants 8–4, 10–6
  guaranteed_hours_per_period: 80

retail (rotation):
  type: 'rotation'
  workdays_per_week: 4–5
  workday_pattern: varies, includes weekends
  shifts: [morning, afternoon, closing]  // rotates weekly
  guaranteed_hours_per_period: null  // typically no guarantee

food_service (on_demand):
  type: 'on_demand'
  workdays_per_week: variable (3–5 expected, may be 0)
  on_demand_rate: ~0.6  // Approximation debt — not literature-derived
  reveal_window: { from: 360, to: 480 }  // 6–8 AM
  min_hours_notice: 2
  guaranteed_hours_per_period: null

food_service (split):
  type: 'split'
  split_shifts: [[{ start: 360, end: 660 }, { start: 1020, end: 1260 }]]
  // 6–11 AM + 5–9 PM; gap is uncommitted time, not leisure
```

---

## 9. Backwards Compatibility

### Old Save Detection

Old saves have `work_shift_start`/`work_shift_end` in state, no `schedule_config` on character, no `subsystem_versions.schedule` in RunRecord.

The Schedule subsystem checks for `subsystem_versions.schedule` in the RunRecord (following the objects.md pattern). Missing → load coarse implementation with legacy data.

### Coarse Implementation Behavior

```
Schedule.isWorkHours()            → tod >= work_shift_start && tod < work_shift_end
Schedule.isWorkday()              → dow >= 1 && dow <= 5
Schedule.latenessMinutes()        → existing latenessMinutes() logic
Schedule.today()                  → synthesized WorkDay: { type: 'fixed', segments: [{ start, end }], revelation: 'known' }
Schedule.isRevealPending()        → always false
Schedule.hoursWorkedThisPeriod()  → days_worked_this_period * 8
Schedule.markWorked(h)            → increments days_worked_this_period by 1
```

The coarse implementation does not support overnight shifts, on_demand, split shifts, or revelation. It is permanently frozen at this capability for runs that started under it.

### Migration of `work_shift_start`/`work_shift_end`

These fields remain in state for legacy saves. `applyToState()` keeps setting them for coarse-implementation new runs. When the full implementation is active, `work_shift_start`/`work_shift_end` are no longer authoritative. They can be retired once coarse is no longer used by new runs.

---

## 10. Content.js Touch Points

Sites that must change when Schedule is wired into `ctx`:

1. **Alarm setting** (`content.js:1911`) — replace `ctx.state.get('work_shift_start')` with `ctx.schedule.minutesUntilShiftStart()`. For on_demand days where tomorrow is unrevealed: alarm setting should offer "set for the early side, in case" with text reflecting the uncertainty.

2. **Bus stop commute prose** (`content.js:6770–6771`) — replace `ctx.state.get('work_shift_start')` with `ctx.schedule.minutesUntilShiftStart()`. Returns null when unrevealed; commute-prose branch simply doesn't fire.

3. **Work nag** (`content.js:4942–4943`) — delegates through state.js; changes nothing if state.js is updated to delegate.

4. **`callInSick.available()`** (`content.js:5119`) — add `!Schedule.isRevealPending()` guard: calling in is meaningless before revelation on an on_demand day.

5. **Idle thoughts** — new hooks for `isRevealPending()` state (see §7).

6. **Paycheck calculation** (`content.js:4964–4981`) — replace `days_worked_this_period * pay_rate / 10` with `Schedule.hoursWorkedThisPeriod() * hourly_rate`.

---

## 11. RNG Discipline for Revelation

`Schedule.revealToday()` always consumes exactly 1 `Timeline.random()` call:

```js
const roll = ctx.timeline.random();
const isWorking = roll < config.on_demand_rate;
if (isWorking) {
  // populate segments from config shifts
} else {
  // type = off, segments = []
}
today.revelation = 'known';
return today;
```

The idle event that fires revelation is recorded as an action in the action log (same pattern as existing idle events). Replay re-fires at the same game time, consuming the same RNG call.

Future-day generation for on_demand (when to populate the next day's WorkDay): generate at `advance()` / wakeup using gameplay PRNG. The action is recorded; on replay the recorded action includes the generated WorkDay in its `data` field (following the `replayInteraction(id, data)` pattern).

---

## 12. Approximation Debts

Mark with `// Approximation debt:` at each site and add to TODO.md:

1. **`on_demand_rate` values** — not literature-derived. BLS CPS has just-in-time scheduling prevalence by industry; specific rates for food_service vs retail vs by establishment size should be researched.

2. **`hourly_rate` not location-derived** — maps from job type bucket. Should derive from character's region/city when neighborhood economic tier is implemented.

3. **Schedule-type probability by job category** — structurally correct (office fixed, retail/food_service varied), magnitudes unverified.

4. **No split-shift gap texture** — the gap period needs prose and NT effects before split shifts are worth implementing. Character can't fully decompress; the second segment is approaching. Mechanically there but experientially absent.

5. **Minimum-hours guarantees not modeled** — `guaranteed_hours_per_period` exists in the interface but pay calculation doesn't enforce it: should be `max(actual_hours, guaranteed_hours) * hourly_rate`.

6. **Workday pattern not astronomy-aware** — pattern stored, but generation at chargen is a stub.

---

## 13. Implementation Sequence

1. Define `js/schedule.js` module, export `createSchedule(ctx)` factory, both implementations.
2. **Coarse implementation first.** Wire into `ctx.schedule` in `context.js`. Replace all direct reads of `work_shift_start`/`work_shift_end` in state.js with delegates. Verify all existing behavior identical.
3. Update state.js delegates: `isWorkHours()`, `isWorkday()`, `latenessMinutes()` → thin. Mark `work_shift_start`/`work_shift_end` as legacy.
4. Update content.js call sites (§10).
5. Wire pay calculation to `Schedule.hoursWorkedThisPeriod()`, add `hourly_rate` to character/state.
6. Full implementation: per-day WorkDay registry, `advance()` at wakeup, revelation idle event, on_demand NT effects, idle thought hooks.
7. Chargen: `deriveScheduleType()`, `ScheduleConfig` generation, `schedule_config` on character object.
