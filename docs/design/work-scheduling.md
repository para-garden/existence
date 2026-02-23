# Work Scheduling Design

## The wrong question

The TODO item described a "per-day schedule object" as the fix. But per-day schedule is still the wrong frame — it imposes calendar-day structure on something more fundamental.

The right question: **what is this character's relationship to their employer's time demands?**

That relationship is a *labor arrangement*. The schedule is the *output* of the arrangement — what the character knows, on a given day, about their upcoming obligations. Designing around the schedule object rather than the arrangement produces the same class of error as the original `work_shift_start`/`work_shift_end` params: it assumes the character always knows their schedule in advance.

---

## What a labor arrangement is

A labor arrangement has five dimensions:

**1. Structure** — how shifts are determined
- `fixed`: same shift every scheduled day, known indefinitely in advance
- `rotating`: shift varies from a pool, posted on a schedule (weekly, biweekly)
- `on_demand`: no advance schedule; employer reveals day-before or day-of
- `gig`: no employer relationship; the character accepts available jobs
- `none`: no employment (unemployed, on leave, etc.)

**2. Day pattern** — which days are potentially work days
- `weekdays`: Mon–Fri (common for office; wrong for most service work)
- `any`: any day of the week is potentially a work day
- `specific`: a fixed set of days (e.g. Tue/Thu/Sat)
- For on_demand/gig: the day pattern is probabilistic, not fixed

**3. Typical shift** — what a normal shift looks like `{start, end}` in minutes-since-midnight
- For overnight shifts: `end < start` is valid (e.g. 11pm–7am = `{start: 1380, end: 420}`)
- For on_demand/gig: this is the *expected* shift shape, not guaranteed
- `duration` = `end >= start ? end - start : (1440 - start) + end`

**4. Reveal horizon** — how far in advance the character learns their shifts
- For `fixed`: infinite (the pattern is known)
- For `rotating`: typically 3–7 days (employer-dependent)
- For `on_demand`: 0–36 hours (often the evening before, sometimes morning-of, sometimes 2 hours before)
- Not a universal constant — it's a property of this employer's practices

**5. Reveal time of day** — what time the reveal happens (for rotating/on_demand)
- Varies: a restaurant might text at 9pm the night before; a warehouse might text at 5am the morning of
- Null for `fixed` (reveals aren't events; shifts are always known)

---

## State representation

Two new state fields replace `work_shift_start` / `work_shift_end`:

```js
// labor_arrangement — the character's structural relationship to their employer
// Set at chargen, can change (job loss, promotion, schedule negotiation)
labor_arrangement: {
  type: 'fixed',           // 'fixed' | 'rotating' | 'on_demand' | 'gig' | 'none'
  day_pattern: 'weekdays', // 'weekdays' | 'any' | 'specific'
  work_days: [1,2,3,4,5],  // for 'specific' day_pattern; 0=Sun ... 6=Sat
  shift_start: 540,        // typical shift start (minutes since midnight)
  shift_end: 1020,         // typical shift end (minutes since midnight)
  reveal_horizon_hours: 0, // null for fixed; hours before shift that reveal fires
  reveal_tod: null,        // time-of-day for reveal events (null for fixed)
  work_days_per_week: 5,   // expected, for income/attendance calculation
}

// known_shifts — what the character currently knows about upcoming shifts
// Map of absolute game-day → {start, end} | null
// null = explicitly not scheduled that day
// key absent = not yet revealed (on_demand/rotating) or irrelevant (fixed)
known_shifts: {}
```

The `work_shift_start` / `work_shift_end` flat params become **approximation debts** immediately and are replaced by the arrangement interface below.

---

## Function interface

These replace the existing `isWorkday()`, `work_shift_start`, `work_shift_end` direct reads:

```js
// Is this an absolute game-day the character is scheduled to work?
// fixed/rotating: derived from day_pattern
// on_demand: true only if known_shifts has a non-null entry for this day
// Returns: true | false | 'unknown' (on_demand, before reveal)
State.isScheduledWorkDay(absoluteDay)

// What is the shift on this absolute game-day?
// Returns: {start, end} | null (not scheduled) | undefined (not yet revealed)
State.shiftFor(absoluteDay)

// Is the character currently within their scheduled shift?
// Handles overnight shifts (end < start)
State.isWorkHours()  // (same name, new implementation)

// Is today a potentially-scheduled day given the day pattern?
// (For fixed: same as isScheduledWorkDay. For on_demand: "could have shift today")
State.isPotentialWorkDay()

// Replaces isWorkday() in availability checks
// true if isWorkHours() is true or character is scheduled to work today
State.isWorkday()    // (same name — now derived from arrangement, not Mon–Fri hardcode)

// Hours until shift start today (or next scheduled day)
// Used for commute autopilot, alarm setting
State.hoursUntilShift()

// Shift known for today? (For on_demand: false until reveal fires)
State.shiftKnownToday()
```

---

## Overnight shift fix

Current `isWorkHours()`:
```js
return tod >= s.work_shift_start && tod < s.work_shift_end;
```

This breaks for any shift where `end < start`. Fix (applies everywhere):
```js
function withinShift(tod, start, end) {
  return end < start
    ? (tod >= start || tod < end)   // overnight: wraps around midnight
    : (tod >= start && tod < end);  // same-day: standard range
}
```

An overnight shift also means the "work day" can start on one calendar day and end on the next. `isScheduledWorkDay` must account for this: if a character has a shift starting at 11pm on Sunday, the sim should treat Sunday evening as a work day even if Sunday isn't in `work_days`.

---

## Reveal mechanics

A schedule reveal is an event that fires when the character learns whether they're working an upcoming shift, and when. This is exactly the scheduled interrupt queue already used for alarms, medication reminders, and calendar events: `{time, type, data}`.

Reveal interrupt type: `'schedule_reveal'`
Data: `{ day: absoluteDay, shift: {start, end} | null }`

When `checkEvents()` fires a `schedule_reveal` interrupt:
1. Populate `known_shifts[day]` with `shift` (or null if not scheduled)
2. If shift is non-null, schedule the corresponding shift-start interrupt
3. Generate in-world notification prose (text message, phone notification, whatever the employer uses)

For `rotating` schedules: reveals fire `reveal_horizon_hours` before the shift for each day in the upcoming rotation window. Seeded from the arrangement params — same seed = same schedule.

For `on_demand`: reveals fire at `reveal_tod` on the day before (or morning-of, per `reveal_horizon_hours`). Whether a shift is assigned is probabilistic, based on employer demand (not yet modeled — approximation debt: always assigns a shift if `type === 'on_demand'` for now).

Reveal events are recorded as actions in the timeline like any other event — deterministic replay works correctly.

---

## Chargen

**Primary determinant: job type**

| job_type | structure | day_pattern | typical shift | reveal horizon |
|---|---|---|---|---|
| office | fixed | weekdays | 9am–5pm (±1hr flex) | ∞ |
| retail | rotating | any | 6hr shift from pool | 3–7 days |
| food_service | rotating or on_demand | any | 5–8hr shift | 0–48hr |

**Modulating factors (applied after job type sets baseline):**

- **job_standing** (0–100): higher standing → better reveal horizon, preferred shifts. A new hire at a restaurant may get on_demand treatment even if the arrangement is technically rotating. Standing ≥ 70 → fixed-like reveal (posted weekly). Standing < 30 → on_demand even for nominally rotating jobs.
- **financial_anxiety** (sentiment intensity): high anxiety character may have accepted worse scheduling terms (fewer guaranteed hours, less notice) because they needed the job and had no negotiating power. `financial_anxiety > 0.6` → reduce reveal horizon by 30%.

**Overnight / weekend shift probability:**

- office: weekdays, daytime only
- retail: 30% chance of primarily weekend shifts (Thu–Sun); 20% chance of closing shift (2pm–10pm)
- food_service: 40% chance of morning shift (6am–2pm), 35% afternoon (2pm–10pm), 25% closing/overnight (5pm–1am or 10pm–6am)

These are rolled at chargen on charRng. The character's specific shift times are a property of their history, not a universal per-job-type constant.

---

## Migration for existing saves

Existing saves have `work_shift_start` / `work_shift_end` as flat state values. On load:
1. Detect absence of `labor_arrangement` in state
2. Synthesize a fixed arrangement from the existing params: `{ type: 'fixed', day_pattern: 'weekdays', shift_start: work_shift_start, shift_end: work_shift_end, reveal_horizon_hours: null }`
3. Pre-populate `known_shifts` for the upcoming 30 days from this arrangement
4. Mark as version-migrated

---

## What stays deferred

- **On-demand probability model**: employer demand, seasonality, hours-throttling. For now: if `type === 'on_demand'`, reveal always assigns a shift. Approximation debt.
- **Split shifts**: two disconnected periods in one day. The `{start, end}` structure doesn't support this. Will need `shift: [{start, end}, {start, end}]`. Note as architectural extension point.
- **Called-in / cut-early events**: the structure supports them (a new interrupt overwrites `known_shifts[today]`), but the trigger logic isn't designed yet.
- **Gig work**: no employer relationship, job-opportunity events instead of shift reveals. Structurally different from the arrangement model. Leave as `type: 'gig'` placeholder.
- **Rotating shift pool generation**: the specific shifts available to a retail/food-service worker, how they're assigned week-to-week, whether the character can request specific days. Design separately when rotating is implemented.

---

## Interface location

These functions live on `State` (same as `isWorkHours`, `isWorkday`, `isLateForWork` today). The `labor_arrangement` and `known_shifts` state fields are owned by `State`. `checkEvents()` in `world.js` fires the reveal interrupts. `content.js` calls only the interface functions — never reads `labor_arrangement` directly.

The existing `isWorkday()` and `isWorkHours()` names are preserved for compatibility — their implementations change.
