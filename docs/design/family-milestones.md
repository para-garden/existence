# Family, Milestones, and Leisure Design

Living design document for several related systems: expanded family structure, life milestone calendar, coworker family texture, and leisure locations. All systems are hidden simulation — nothing surfaces as labels or numbers. Prose carries everything.

---

## Family Structure

### Current state

One family member (parent, both_parents, or sibling), one archetype that maps 1:1 from family type, one name, one contact timestamp, one guilt scalar, one dread scalar. The `out_to_family` array is a flat list — "out to the family" or not.

### Design direction

Family is not a single contact. It is a small set of named people, each with their own texture and weight. A character might be close to their mother and estranged from their father. A sibling might be the only one they still talk to. The family structure object on the character should reflect this.

**Members array.** Replace the single `{ type, archetype, member, name }` object with a `family_members` array. Each member:

```
{
  name: string,
  relationship: 'parent' | 'sibling' | 'other',
  role_label: string,       // "Mom", "Dad", "sister", "brother", "stepmom" — free text for prose
  archetype: 'warm_caring' | 'performance_watching' | 'checked_out' | 'unreachable' | 'critical',
  contact_timestamp: number,    // game minutes — mirrors friend_contact pattern
  guilt_contribution: number,   // 0–1 weight when accumulating family_guilt
  dread_contribution: number,   // 0–1 weight for hostile/critical members
  alive: boolean,               // deceased members affect milestone calendar but not contact
  out_dimensions: string[],     // identity dimensions this member knows about
}
```

**Chargen.** Most characters have 1–3 family members. The current single-member approach works for simple configurations; expansion adds sibling alongside parent, or both parents as separate people with independent archetypes. The generation logic:

- Roll family type (existing logic, unchanged). This sets the overall register.
- Roll `family_members` array based on type:
  - Single parent families (60% current): one parent, archetype from type.
  - Both parents (25% current): two parents, both with archetype from type, with moderate variance — a household can have a warm primary and a performance-watching secondary.
  - Sibling families (15% current): sibling + optionally one parent.
- At chargen, decide member liveness for potential death anniversary entries (older characters: low probability of deceased parent).
- `out_to_family` replaced by `member.out_dimensions` per member. "Out to mom but not dad" is the common real pattern; the flat array can't express it.

**Family type.** The existing `family_type` becomes a derived summary for mechanical convenience (`serotoninTarget`, `guilt` accumulation patterns), computed from the most-influential member's archetype. It doesn't need to be stored separately if the members array fully describes the family. But for backwards compatibility through a version bump, keeping it as a derived cache on the state side is fine — derive it from members at `applyToState()`.

**Per-member contact and guilt.** The current `family_contact` timestamp and `family_guilt` scalar are flat. With multiple members, each member's `contact_timestamp` tracks independently. `family_guilt` becomes the aggregated sum of `guilt_contribution * f(absence_days)` across non-hostile members, capped at 1. This preserves the existing NT target coupling without restructuring. The critical and unreachable members still drive `family_dread`.

**Age-stratified dynamics.** `ageStageTier()` already exists. Family texture genuinely differs across life stages and the simulation should model this, primarily through prose and available interactions but also through soft mechanical changes in contact pressure.

- **young_adult**: Financial entanglement is high — some characters receive help, some are being asked to help siblings, some are still being treated as the child they were. The family contact rate for warm_caring is higher. Identity pressure peaks: who you are versus who they assume you are. The `performance_watching` archetype is sharpest here — every conversation circles back to the next step.

- **adult**: The holiday/milestone calendar weight increases. Power dynamic has begun equalizing — the character is no longer obviously "the young one," but the family hasn't necessarily caught up. The undercurrent of "when are you settling down" runs beneath unrelated conversations. A performance_watching family intensifies this; warm_caring families may start leaning on the character more as they get older, not less.

- **midlife**: Parent health enters as a real variable. Diagnoses, needing help, shifting from "parent" to "person who needs care." Sibling dynamics around who does the caregiving. The character becomes the one with weight — absorbing parental anxiety, managing appointments, navigating the geometry of a family that used to have different roles. The checked_out archetype becomes visible in a new way: the sibling who disappears when the parent gets sick.

- **older**: Parents may be gone. Sibling relationships become the primary remaining family texture. The weight is different — shared history without the vertical structure that shaped it.

Age-stage shading in prose is deterministic (no RNG): the `ageStageTier()` suffix check is a layer-3 modifier, same pattern as the autism layer-3 throughout content.js.

**`out_to_family` per member.** When the character performs a coming-out action (or when their disclosure state changes at chargen), it applies per-member. Prose from family interactions gates on the specific member's `out_dimensions`. A warm_caring mother who knows reads differently from the same woman who doesn't.

---

## Life Milestone Calendar

### Current state

`personal_calendar` on the character is an array of `CalendarEvent { month, day, label, type }` with types `'birthday'` and `'anniversary'`. The scheduled interrupt system fires `calendar_alert` interrupts when a calendar event is approaching. The infrastructure exists; the question is what populates it and what happens when it fires.

### Design direction

**Birthdays.** Three categories:

1. **Character's own birthday.** A day that feels different without being explained. The body remembers. Nobody has to say it. Mechanically: on the character's birthday (derived from `start_timestamp` + character age at chargen → `birth_month` / `birth_day` stored on character), a subtle serotonin target dip and a serotonin recovery spike by evening if acknowledged. The day's idle thoughts are different. Family messages arrive. Whether people say happy birthday or not says something about those relationships. The character's reaction is NT-shaded: high serotonin reads as ease, low serotonin reads as a quiet weight, dissociated states read as the day passing through them.

2. **Family member birthdays.** Soft obligation. A calendar alert fires one day before. The interaction available: call, send a message. Not calling when the alert fired has a different weight than forgetting because you didn't know. For warm_caring family: skipping has guilt weight. For critical family: the birthday is also a contact opportunity that carries its own dread. For unreachable family: the date exists; what you do with it is yours. The interaction should not be forceful — it appears, it can be ignored, it passes.

3. **Deceased family member birthdays.** The date still appears on the internal calendar. The character may or may not consciously track it. The body may know before the mind does — a serotonin target dip that arrives without named source, an idle thought that surfaces obliquely. The `alive: false` member still generates their birthday entry. No interaction available — just the texture of the day.

**Death anniversaries.** For deceased family members, the calendar carries the death date. Not the birthday — the day. A grief spike: serotonin target drops, cortisol target rises slightly, idle thoughts shift. The body's memory is not the mind's. The character doesn't have to consciously acknowledge the date for the system to fire — the prose just reads differently that day. If they do look at the calendar, the date is there. No named label required; the character knows what day it is.

Mechanically: `CalendarEvent.type` gains `'death_anniversary'`. Member records carry `death_date: { month, day } | null`. At chargen, if `alive: false`, add a death_anniversary entry to `personal_calendar`.

**Family marriages and engagements.** This is a life event that can happen during play. A family member texts with news (archetype-shaded — a warm_caring family member calls; a checked_out one mentions it in passing). If it generates a wedding, a `FlightEvent`-style future interrupt fires (same infrastructure as `upcoming_flights`). The character might attend, might not, might not be able to afford the travel. The invitation arrives regardless.

The state needed: `family_events` on the character (similar to `upcoming_flights`) — `[{ type: 'wedding', member_index, date_minutes, attending: boolean }]`. Attending or not is a choice surfaced when the calendar alert fires close to the date.

This is medium-complexity to implement. Chargen probability of a family wedding occurring during a typical playthrough: low but nonzero. Could also generate as a random event mid-play rather than at chargen.

**Relationship anniversaries.** If the character has a partner (future system), the anniversary exists whether or not the character marks it. The date is on the calendar from when the relationship was formalized. What happens on the day depends on the relationship's current state — something warm, or something that notices the gap between what the day used to mean and what it means now. This system gates on the relationship system being built; document it here so the calendar slot is reserved.

**Coworker milestones.** Not tracked on the calendar. These surface conversationally in small talk — coworker chatter already has the mechanism. A coworker with a new baby doesn't generate a calendar entry; they mention it in passing, and the player may or may not engage. The mood modulator (see below) handles the day-to-day texture. No new state needed for this.

**Derived vs. stored.** All milestone proximity checks follow the existing pattern: `f(current_day_of_year, event_month_day)` — never a counter. The `scheduleNextCalendarAlert()` function already does this correctly. Adding new event types is a matter of expanding `CalendarEvent.type` and handling them in the alert prose.

**Alert proximity tiers.** The current system fires once. A richer approach for significant dates:

- 7 days before: idle thought surfaces obliquely (no named date)
- 1 day before: calendar alert fires, interaction available
- Day of: day texture changes, idle thoughts shift
- 1 day after: for missed obligations, guilt or relief depending on whether the character engaged

The 7-day and day-after tiers are deterministic modifiers on existing systems — no new interrupt types needed. Just a check in the idle thought selection and the morning description.

---

## Coworkers Have Families

### Current state

Coworkers have: name, last name, flavor (one of five: warm_quiet, mundane_talker, stressed_out, quietly_competent, oversharer), pronoun set. The flavor drives chatter prose, interaction prose, and the notices-you mechanic. No life outside work exists.

### Design direction

Each coworker gets a **family sketch**: one or two facts generated at chargen, stored on the coworker object, used only by prose. No mechanical tracking. The character doesn't model the coworker's home life — they hear fragments of it.

**Sketch tags.** A small fixed set of mutually-compatible tags:

```
has_young_kids
has_school_age_kids
caring_for_parent
recently_married
going_through_divorce
pregnant          // visible for a period; the news arrives conversationally
new_grandparent
lives_alone
has_partner
```

Generation at chargen: pick 0–2 tags per coworker, weighted by character age stage (young coworker cohorts get fewer caring_for_parent, more pregnant; older cohorts flip). 2 charRng calls per coworker.

**Prose integration.** The tags inform additional chatter fragments in `coworkerChatter` and `coworkerInteraction`. A coworker with `has_young_kids` might say something about daycare in a mundane_talker chatter, or something about a sick night in a stressed_out chatter. The tag gates additional variant options in the weighted pick — same 1 RNG call structure, wider pool when the tag matches.

This is layer-1 prose (weighted variant selection via cosmeticWeightedPick). Not a separate system — just fuller lexical pools.

**Coworker mood family modulator.** On some days, a coworker is visibly off because of a family thing. This affects their warmth/irritation sentiment for the day.

Implementation: during the morning's `checkEvents()` pass, for each coworker, a small probability check using `backgroundRandom()` fires a `coworker_family_day` flag. This flag adjusts the coworker's warmth/irritation sentiment — a coworker who is having a family hard day drifts toward irritation or a flat affect, not hostility. The magnitude is small (−0.05 warmth or +0.03 irritation) and decays normally during sleep.

The flag doesn't name what's happening. Prose acknowledges it without explanation: the coworker is somewhere else today. The character can ask or not.

**The ask interaction.** If the coworker sentiment has `coworker_family_day` and the warmth sentiment is ≥ 0.4 (warm enough relationship to notice and ask), an interaction appears: ask how they're doing. The response adds small warmth (+0.02). The text doesn't name the specific family situation unless the coworker's sketch tag is one that's visible (pregnancy, recently married) — otherwise it's vague, received rather than named.

This interaction only appears if the relationship is already warm. Asking someone you don't know well when they're visibly off is a different social read — it doesn't appear for coworkers with high irritation sentiment.

---

## Leisure Locations and Activities

### Current state

The park exists as a location with rich description (seasonal, time-of-day, NT-shaded) and two interactions: `sit_on_bench` and `walk_in_park`. Both are implemented with full prose tables. `go_for_walk` is available at street and library. No beach. No day-trip mechanic.

### Design direction

#### Park — expansion

The park already has good bones. What's missing is variety of activity and longer-form engagement.

**Bring something.** Reading at the park (`read_at_park`) — a variant of `read_book` in the park location context. The book is from the character's apartment; they need to have something to read. Same prose structure as `read_at_library` but with outdoor sensory layer. Available if the character has a book or library book.

**Longer walks.** A second walk interaction: `walk_a_loop` — explicitly walking a circuit, one more time, or one more. Time cost longer than `walk_in_park`. NT shading differs: the loop is a negotiation with the body, a rhythm, not a wander. Useful for characters with anxiety or high NE — the repetition does something.

**Lie in the grass.** `lie_in_grass` — weather-gated (spring/summer, not raining), a longer sit with the ground under them. Different sensory texture than the bench. Body against the earth. The senses system already tracks grass/ground surfaces; this is a good midSense site.

**People-watching.** `watch_people` — available at park, street, bus stop. The park version has more dwell time. No active doing, but a specific kind of attending. For characters with high NE or autism, this is qualitatively different from `sit_on_bench` — there's someone to watch, which is both more interesting and more demanding.

#### Beach

**Availability.** Latitude-gated: |lat| ≤ 50° (temperate and equatorial regions have accessible beaches; high-latitude characters don't). Also seasonally gated in temperate zones: summer and late spring only. Available as a location in the world graph; travel time from apartment via `bus_to_beach` (30–45 min, costs $2–4) or `walk_to_beach` if the character's latitude + character.coastal_proximity puts it in walking distance. Coastal proximity is a chargen parameter — not all characters live near a beach even in beach-accessible climates.

The beach introduces a new location node: `beach`. Location description varies by season, time of day, weather, and population density. Morning beach reads differently from midday beach. The prose has a longer temporal quality — this is a place where time pools.

**Interactions.**

- `sit_at_beach` — base interaction. Long time cost (1–2 hours). Serotonin and dopamine both shift positively when mood is not heavy. The sound and the scale of the water does something to the nervous system. This is documented in literature for blue space (White et al. 2019 PMID 31133740 — though the dose-response is an approximation debt).

- `swim` — weather and temperature gated (warm_or_hot tier, not raining, not heavy wind). A physical act with body-state consequences: energy cost, cooling effect in hot weather, something that grounds the body. For POTS characters: swimming is one of the few exercises without orthostatic stress (horizontal + water pressure). This is a specific and real distinction — a layer-3 modifier for POTS characters noting this.

- `walk_along_water` — the shoreline walk. Loose structure, longer than `sit_at_beach`, different prose register. Solitary or with background presence of other people. The edge between water and land as a specific sensory space.

- `watch_waves` — a do-nothing interaction at the water's edge. The water keeps moving regardless. For dissociated states: something about the continuity cuts through. For high-serotonin states: an ease that doesn't demand anything.

**Time structure.** The beach is a place where a single visit naturally expands. Multiple interactions chain — arrive, sit, walk, swim, sit again. The habit system may suggest returning to the bench after a walk. The place allows unstructured time in a way the apartment doesn't.

#### Day trips

**The "spent the day" mechanic.** Not granular moment-to-moment. The character leaves; a block of time passes; they return. What happens in between is implied by the return state, not narrated.

This is the right model for:
- Visiting a family member (a day at a parent's place)
- A day trip to somewhere further away (the coast, a city, a park that requires transit)
- A family event (a birthday dinner that turned into the whole day)

**Implementation.** A new interaction type: `day_out`. Takes a destination label and a duration (half-day 4–5 hours, or full-day 7–9 hours). The execute block:

1. Records the action with destination data.
2. Advances time by the duration.
3. Applies state changes reflecting the experience.
4. Returns prose that is the *return*, not the trip: the character is home. The texture is what they brought back.

The before (anticipation, obligation, anxiety) lives in idle thoughts as the trip approaches or is pending. The after (relief, depletion, warmth, complicated feeling) is the execute text.

**Family day trips.** When a family member has scheduled a visit or the character initiates contact for an in-person visit, the `day_out` mechanic is one resolution path. The return prose is archetype-shaded: coming home from a warm_caring parent is different from coming home from a performance_watching one. Energy cost varies — visiting a critical family member is depleting in a specific way.

State effects of a family day trip:
- Resets `family_contact` timestamp for that member (guilt cleared)
- NT impact varies by archetype: warm_caring → serotonin +, NE calmed; performance_watching → cortisol spike during (body knows), serotonin complicated by evening; critical → NE elevated, cortisol spike, recovery hours later
- Energy cost: full day out costs energy regardless of pleasantness
- Social energy: varies by introversion and whether the family member is experienced as social demand

**Non-family day trips.** A character can take a day out without a family anchor — a beach day, a city day, a museum (future location). The return prose is mood-shaded from NT state at the time of return.

**What's not modeled.** The trip itself. The game doesn't try to simulate the granular moments of a family lunch or a day at the coast. The prose implies it; the state reflects it. This is correct — the game lives in the daily texture of the apartment and neighborhood, not in the exceptional moments. Exceptional moments are the before-and-after, not the content.

#### Travel

Rare and significant. A weekend away, a holiday, a trip to a family wedding in another city. Removes the character from their routine location entirely. Uses the existing `upcoming_flights` infrastructure for travel that involves flying.

The mood impact is large — in both directions. Disruption of routine affects characters with anxiety, ADHD, autism. The unfamiliar environment taxes sensory and regulation capacity. But distance from the daily grind of the apartment is real relief for some characters.

This is out of scope for near-term implementation. The architecture (interrupt queue, `upcoming_flights`) is already there. What's needed is a "temporary location override" mechanic where the character is in a different context for some time and then returns. The `day_out` mechanic above is a stepping stone.

---

## State Inventory

New state variables (additions to the `let s = {}` defaults block and types.d.ts):

```js
// Family members — replaces flat family_type/archetype/member
family_members: [],  // FamilyMember[] — see types.d.ts

// Coworker family day modulator — set by checkEvents(), cleared by sleep
coworker1_family_day: false,
coworker2_family_day: false,

// Day-out pending — set before a day trip, cleared on return
day_out_pending: null,  // null | { destination: string, duration_minutes: number, departure_time: number }
```

New character schema fields:

```js
// In FamilyMember interface:
//   name, relationship, role_label, archetype, alive, birth_month, birth_day,
//   death_month, death_day (if alive=false), out_dimensions, guilt_contribution, dread_contribution

// In coworker objects (coworker1, coworker2):
//   family_sketch: string[]  — tags from the set above, 0–2 per coworker
```

New `CalendarEvent` types (extends existing `'birthday' | 'anniversary'`):

```
'death_anniversary'
'family_wedding'
'own_birthday'
```

---

## Prose Principles for These Systems

**Family members feel distinct.** A warm_caring mother and a performance_watching father are not the same person with different weights applied. Their prose should differ in register, not just in outcome. The mother's check-in sounds like genuine curiosity; the father's sounds like inventory.

**The body knows first.** On death anniversaries, birthday griefs, or approaching difficult family contact — the NT shift precedes the prose acknowledgment. Idle thoughts surface obliquely. The character may not have named it yet.

**Coworker family texture is heard, not seen.** The character does not know what the coworker is dealing with. They register that something is different. The sketch tags inform what the coworker might be dealing with, but the prose does not tell the player. A coworker with `caring_for_parent` might mention being tired from the weekend. The player pieces it together or doesn't.

**Day-trip returns are not debriefs.** The prose when the character gets home is not a summary of the day. It is the character arriving, sitting down, the feeling of return. What happened is implied by how they're sitting.

**Age-stage shading is texture, not flag.** Young adult family texture and midlife family texture are layer-3 deterministic modifiers on the existing prose system. They add a phrase. They don't restructure the interaction.

---

## Implementation Priority Notes

These systems are design-ready but not in the near-term build queue. Priority order within this space:

1. **Family members array** — replaces existing flat structure; requires version bump. Unblocks per-member contact tracking, per-member disclosure, and birthday calendar entries.
2. **Own birthday** — low complexity, high texture payoff. A special calendar entry type and a handful of idle thoughts.
3. **Coworker family sketches** — chargen-only change plus prose additions. No mechanical tracking. Low risk.
4. **Park expansion** — additional interactions in an existing location. Straightforward.
5. **Beach location** — new location node, latitude-gated. Requires adding `coastal_proximity` to character if coastal access isn't derivable from existing lat/country.
6. **Day-trip mechanic** — more structurally novel. Requires design for the "return state" encoding.
7. **Death anniversaries** — needs the family members array first; then just a calendar entry and prose.
8. **Coworker mood modulator** — needs the family sketch tags first; then checkEvents() addition.
