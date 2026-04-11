# NPC Simulation Design

Living design document for the NPC simulation system. Supersedes the tag/archetype/flavor model currently used for friends, coworkers, and family members.

---

## The Problem

The current NPC model uses labels to generate behavior:

- Friends have **flavors** (`sends_things`, `dry_humor`, `warm_quiet`, `anxious_peer`, etc.) that select from prose tables
- Coworkers have **flavors** (`warm_quiet`, `mundane_talker`, `stressed_out`, `quietly_competent`, `oversharer`) that select from chatter/interaction tables
- Family members have **archetypes** (`warm_caring`, `performance_watching`, `critical`, `checked_out`, `unreachable`) that determine prose register
- Coworkers have **`family_sketch` tag arrays** (`has_young_kids`, `caring_for_parent`, etc.) that gate additional prose variants

All of these skip simulation. A label selects prose from a lookup table. The NPC's behavior on Tuesday is the same as on Thursday because the label didn't change. A "stressed_out" coworker is always stressed. A "warm_quiet" friend is always warm and quiet. Nothing is actually happening in their life that would generate the stress or the warmth.

This violates three principles established in CLAUDE.md:

1. **Simulate ground truth, not player perception.** The simulation models what's actually happening. A coworker's child being sick is a simulation fact. Whether the character knows is downstream. Labels don't simulate anything — they're shorthand for "behaves like a person who..." without modeling what makes a person behave that way.

2. **NPCs are simulated at dynamic resolution — never zero.** Every person in the simulation has enough state to be a person, not a prop. Resolution scales with proximity and contact frequency. Archetype tags and `family_sketch` arrays are not low-resolution simulation — they're labels, which skip simulation entirely.

3. **The simulation is fair to all characters.** A game premised on the weight of constrained lives can't afford to simulate some lives richly and others as props. The same ontological respect extends to everyone in the world.

---

## What IS an NPC in This Simulation?

A person with their own life happening. Not a prop that exists to affect the player. Not a type selected from a menu.

Their behavior on any given day is generated from their current state — stress level, active life events, personality, relationship with the player character. The simulation models what's actually happening to them. What the player character perceives — fragments overheard, mood shifts noticed, things mentioned or not mentioned — is the output of that simulation, filtered through the character's attention and relationship.

What the character notices, infers, or misunderstands is the reader's job. The simulation doesn't track "what the character has observed" as a layer. It tracks what's real.

---

## Resolution Tiers

Not prescriptive categories with hard boundaries. A continuous parameter. But for design purposes, here's what different resolution levels look like in practice.

### High resolution — close family, close friends

These NPCs have enough state to generate surprise. Their behavior changes across days and weeks because things are happening to them.

State tracked:
- **Personality** — 3 continuous parameters (warmth, openness, stability) replacing archetype labels
- **Current stress** — single 0-100 number, drifts toward a target set by active events and personality stability
- **Active life events** — `{ type, severity, start_time, expected_duration }` — illness, job trouble, relationship strain, good news, bereavement, financial pressure, pregnancy progression, moving, new relationship
- **Ongoing situation** — employment status, living situation, health trajectory (declining parent, chronic condition, pregnancy), financial pressure
- **Relationship with the player character** — trust (0-100, how much they open up), contact recency (timestamp of last interaction), accumulated warmth/distance. Evolves based on interaction patterns — not fixed by a label

What high resolution produces: a family member who was warm last month is distracted this month because their partner left. A friend who usually initiates contact goes quiet for two weeks because they're dealing with a health scare. The player character doesn't know why — they notice the silence, or the tone shift, or the cancelled plan. The simulation knows why.

### Medium resolution — coworkers, regular contacts

These NPCs have enough state to have bad days and good days, and for the reason to be grounded in something real.

State tracked:
- **Personality** — same 3 parameters as high resolution
- **Current stress** — single number, drifts
- **Active life events** — same event system, fewer types, less depth
- **Life facts** — children (with ages), partner status, parent health status. These aren't tags — they're simulation inputs that drive the event generator. A coworker with a three-year-old has a probability of `child_sick` events. A coworker with a declining parent has a probability of `health_crisis` events. The fact generates the event; the event changes the stress; the stress changes the behavior.
- **Relationship with player** — simpler than high resolution. Contact frequency and warmth/distance sentiment.

What medium resolution produces: a coworker who's been fine all week is short-tempered on Thursday because their kid was up all night sick. Another coworker mentions something about a hospital visit — not explained, just present. The player character can ask or not.

### Low resolution — recurring semi-strangers

The bus stop regular. The corner store cashier. The neighbor whose name you maybe know. These NPCs have enough state for presence and absence to be meaningful, and for continuity across encounters.

State tracked:
- **Schedule** — why they're at this place at this time. Generated at first encounter, stable.
- **Current situation** — ephemeral. Generated per day or per encounter via `backgroundRng`. Not stored long-term. Enough to give the encounter a texture: tired today, cheerful today, limping, carrying groceries, on the phone.
- **Recognition** — the existing `locationVisitTier` system (stranger/familiar/regular) already handles this. What changes with the NPC simulation model: the recognition is mutual. The cashier who sees you every day also has a day happening.

What low resolution produces: the bus stop regular who's usually there on Tuesday mornings isn't there for two weeks, then reappears. The corner store cashier looks tired. These aren't scripted events — they're the output of minimal simulation (a schedule + a daily situation roll).

### Ephemeral — one-scene strangers

Generated for the scene with enough coherence to feel like a person mid-day. Not stored. But generated with care.

An ephemeral NPC isn't a random adjective ("a tired woman," "a loud man"). It's a moment in a life: someone carrying too many bags because the bus only comes once an hour. Someone on the phone, voice tight, turned away. Someone eating lunch on a bench because there's nowhere else.

The prose carries this. The simulation provides a seed — a couple of `backgroundRng` calls that determine the encounter's texture. No state persists.

---

## NPC State Model

### Core structure (high and medium resolution)

```js
{
  // Identity (set at chargen, stable)
  name: string,
  relationship_to_player: string,  // 'parent', 'sibling', 'coworker', 'friend', etc.
  pronoun_set: PronounSet,

  // Personality (set at chargen, stable — NOT an archetype label)
  warmth: number,          // 0-100, how readily they express care
  openness: number,        // 0-100, how much they share about their life
  stability: number,       // 0-100, emotional baseline stability

  // Current state (drifts)
  stress: number,          // 0-100, drifts toward target set by events + stability

  // Life facts (set at chargen, can change via events)
  children: [{ age: number }],           // empty array if none
  has_partner: boolean,
  parent_health: 'healthy' | 'declining' | 'critical' | 'deceased',
  employment_stable: boolean,

  // Active events (generated, expire)
  active_events: [
    { type: string, severity: number, start_time: number, duration: number }
  ],

  // Relationship with player (evolves)
  trust: number,           // 0-100, how much they open up
  contact_recency: number, // timestamp of last interaction
}
```

### What personality parameters replace

Personality parameters (warmth, openness, stability) replace archetypes and flavors. The mapping is not 1:1 — it's generative rather than categorical.

**Family archetypes → personality parameters:**
- `warm_caring` → high warmth, high openness, high stability
- `performance_watching` → moderate warmth, low openness, high stability (the care is real; it expresses as pressure)
- `critical` → low warmth, moderate openness, low stability (reactive, judgmental)
- `checked_out` → low warmth, low openness, moderate stability (absent, not hostile)
- `unreachable` → any warmth, any openness, any stability — the distinguishing feature is contact unavailability, not personality

**Friend flavors → personality parameters + current state:**
- `sends_things` → high warmth, moderate openness (expresses care through action rather than words)
- `dry_humor` → moderate warmth, moderate openness, high stability (warmth expressed through deflection)
- `warm_quiet` → high warmth, low openness (present but not verbose)
- `anxious_peer` → moderate warmth, high openness, low stability (shares because they can't contain it)

**Coworker flavors → personality parameters + current state:**
- `warm_quiet` → high warmth, low openness, high stability
- `mundane_talker` → moderate warmth, high openness, high stability (shares freely, not about heavy things)
- `stressed_out` → any warmth, moderate openness, low stability + currently elevated stress
- `quietly_competent` → low warmth, low openness, high stability
- `oversharer` → moderate warmth, very high openness, low stability

The difference: with labels, a "stressed_out" coworker is always stressed. With parameters + state, a coworker with low stability and young children is stressed *this week* because their kid is sick. Next week, they might be fine. A different coworker with high stability might be stressed for the first time because their parent was hospitalized. The behavior emerges from what's happening, not from a fixed assignment.

### Life facts replace `family_sketch` tags

The current `family_sketch` system (`has_young_kids`, `caring_for_parent`, `recently_married`, etc.) stores tags that gate prose variants. The NPC simulation model replaces these with actual life facts:

- `has_young_kids` → `children: [{ age: 2 }]` — the child has an age, can get sick, can start school, can have a birthday
- `caring_for_parent` → `parent_health: 'declining'` — the parent's health can worsen, stabilize, or resolve
- `recently_married` → `has_partner: true` + a `new_relationship` event with a recent start time
- `going_through_divorce` → `has_partner: true` + a `relationship_strain` event (or `has_partner` transitions to `false` when the event resolves)

The facts are simulation inputs. They drive the event generator. A tag just sits there.

---

## Life Event Generation

Each sleep cycle, for each NPC above low resolution, the simulation rolls for life events using `backgroundRng`.

### Event probability tables

Events are drawn from probability tables conditioned on the NPC's life facts and current state.

**Child-related events** (requires `children.length > 0`):
- `child_sick` — ~3%/day winter, ~1%/day summer (seasonal respiratory illness base rates; magnitudes are approximation debts). Duration: 1-5 days. Stress: +15-30 depending on severity and childcare arrangements.
- `child_school_trouble` — ~1%/week for school-age children. Duration: 3-14 days. Stress: +10-20.
- `child_milestone` — ~2%/week for children under 5. Duration: 1-3 days. Stress: -10 (positive event). Openness determines whether they mention it.

**Parent-health events** (requires `parent_health !== 'deceased'`):
- `parent_health_crisis` — ~2%/week when `parent_health === 'declining'`, ~0.3%/week when `'healthy'`. Duration: 3-21 days. Stress: +20-40. Can transition `parent_health` from `'healthy'` to `'declining'` or from `'declining'` to `'critical'`.
- `parent_hospitalization` — ~0.5%/week when `'declining'`, ~2%/week when `'critical'`. Duration: 3-14 days. Stress: +30-50.
- `parent_death` — ~0.2%/week when `'critical'`. Permanent. Transitions `parent_health` to `'deceased'`. Stress baseline permanently elevated by +15 (grief).

**Relationship events** (requires `has_partner`):
- `relationship_strain` — ~1%/week, higher if NPC stress is high. Duration: 1-8 weeks. Stress: +10-25.
- `relationship_good_period` — ~2%/week when stress is low. Duration: 1-4 weeks. Stress: -5.

**Work events** (requires `employment_stable`):
- `work_pressure` — ~5%/week. Duration: 3-10 days. Stress: +10-20.
- `job_threat` — ~0.5%/week. Duration: 2-8 weeks. Stress: +25-40. Can transition `employment_stable` to `false`.

**General events** (any NPC):
- `illness` — ~2%/week. Duration: 2-7 days. Stress: +5-15.
- `good_news` — ~3%/week. Duration: 1-5 days. Stress: -10-20.

All probabilities are approximation debts — chosen for plausible pacing, not derived from epidemiological data. `grep 'Approximation debt (NPC event probability)'` when these are implemented.

### Event mechanics

Events have duration. When `time > start_time + duration`, the event expires and is removed from `active_events`. Some events have permanent consequences (parent death, job loss) — these modify life facts rather than just adding a temporary stress bump.

Active events modify the NPC's stress target. Stress drifts toward `baseline_stress + sum(event_stress_contributions)` at a rate determined by the NPC's stability parameter. High stability → faster recovery after an event ends. Low stability → stress lingers longer.

Multiple concurrent events compound. A coworker with a sick kid and work pressure is having a different week than one with just work pressure. The simulation generates this naturally — no special "compound stress" flag needed.

### RNG discipline

All event generation uses `backgroundRng`. Event rolls happen during the sleep cycle's `processSleepEnd()` pass, alongside the existing `processAbsenceEffects()` and `processSleepEmotions()` calls. This means NPC events advance on the player character's sleep schedule — which is correct: the player character's contact with NPCs is gated by their own waking hours.

Event text generation (what the NPC says, how they seem) uses `cosmeticRng` — same pattern as all other prose selection.

---

## How NPC State Generates Behavior

The NPC's current state determines what the player character encounters. This replaces the current pattern of `switch (flavor) { ... }` or `archetype`-keyed prose tables.

### Conversation content

What an NPC talks about depends on:

1. **Openness + trust** — high openness and high trust → they mention what's going on. Low openness → they're quieter or deflect. Low trust → surface-level regardless of openness.
2. **Active events** — if something is happening, it colors what they say. A coworker with a sick child might mention being tired. A friend going through a breakup might be quieter than usual. The severity and the NPC's openness determine how much surfaces.
3. **Stress level** — high stress makes conversation shorter, more distracted, less warm (modified by warmth parameter — high warmth + high stress reads as trying-to-hold-it-together, not cold).

The prose system reads these parameters directly rather than dispatching on a label. Instead of:

```js
// Current pattern
const prose = coworkerChatter[coworker.flavor](name, ps);
```

The replacement generates from state:

```js
// NPC simulation pattern
const prose = generateCoworkerBehavior(coworker, ctx);
// reads coworker.stress, coworker.active_events, coworker.warmth, etc.
```

### Warmth and withdrawal

Whether an NPC is warm or withdrawn on a given day is not a fixed trait. It's a function of:
- **Warmth parameter** — the baseline tendency
- **Current stress** — high stress reduces available warmth regardless of personality
- **Relationship trust** — low trust suppresses warmth expression
- **Active events** — some events (bereavement, relationship strain) produce withdrawal even in high-warmth NPCs

A "warm_caring" family member in the current model is always warm. In the NPC simulation model, a family member with high warmth who just lost their partner might be unreachable for weeks — not because they stopped caring, but because they're somewhere else right now. The warmth comes back. The label never went anywhere because it was never dynamic.

### What they mention

Whether an NPC mentions something from their life depends on:
- **Openness** — baseline tendency to share
- **Trust** — relationship-specific gate
- **Event severity** — severe events surface more regardless of openness (hard to hide)
- **Event type** — visible events (pregnancy, injury) surface to anyone; internal events (financial anxiety, relationship trouble) require openness + trust

This replaces the current system where `family_sketch` tags gate additional prose variants. Instead of a tag saying "this coworker has young kids" and that tag adding daycare-related chatter to the pool, the simulation generates a `child_sick` event, the event raises the coworker's stress, the stress changes their behavior, and if their openness and the relationship trust are high enough, they mention being tired or preoccupied. The mention is a consequence of the simulation, not a direct output of a tag.

### Response to the player character

How an NPC responds to the player character's actions depends on:
- **Relationship quality** (trust + warmth/distance sentiment) — accumulated from interaction history
- **The NPC's current state** — a stressed NPC responds differently than a calm one, regardless of personality
- **The action itself** — asking about someone's life when they're visibly struggling has different weight than the same question on a normal day

---

## Dynamic Resolution Scaling

Resolution increases as the player character interacts with someone more, and decreases as contact fades. This is not a discrete upgrade/downgrade — it's a continuous process.

### Upward scaling

A coworker the player character talks to every day accumulates relationship state (trust, warmth sentiment). As trust rises, the NPC's simulation becomes more consequential to the player character's experience: they share more, their events surface more in conversation, their mood affects the player character's workplace experience more.

A recurring semi-stranger (bus stop regular, corner store cashier) who the player character acknowledges repeatedly can gradually accumulate enough state to become a low-resolution NPC: a name, a schedule pattern, a minimal life fact. The existing `locationVisitTier()` system already tracks recognition progression. What changes: recognition can be bidirectional. The cashier starts remembering you.

### Downward scaling

A friend the player character hasn't contacted in months doesn't get de-simulated — their life keeps happening. But the resolution of what's tracked simplifies:
- Event generation continues (their life doesn't stop), but fewer event types are rolled
- Stress drifts toward a stable default more quickly (without contact, the simulation has less to differentiate)
- Trust decays — less trust means less sharing when contact resumes, which means less state is relevant to the player character's experience

The mechanism: resolution is proportional to `contact_frequency * trust`. NPCs below a contact threshold get simplified simulation: fewer event rolls per sleep cycle, stress resets more aggressively. NPCs above the threshold get the full event table.

This means a friend who drifts away doesn't suddenly become a stranger. They become someone whose life you know less about — not because it stopped, but because you stopped being close enough to hear about it. When you call them after months, they have things to tell you. But you missed the daily texture.

### Resolution floor

The floor is never zero. Every NPC with a name has at minimum:
- A stress value that drifts
- A single event slot that can be occupied or empty
- A relationship state with the player character

This minimum is enough to generate the difference between "they seem okay" and "something's off." It's not enough to know what. That's the point of low resolution — the player character can tell something is different, but not what.

---

## What This Replaces

### Friend flavors → personality + state

Current: `friend.flavor` (`sends_things`, `dry_humor`, `warm_quiet`, `anxious_peer`, `caring_practical`) selects from `friendReplyProse`, `friendInitiateProse`, `friendProactiveReachProse`, and in-line `flavorProse` tables.

Replacement: `friend.warmth`, `friend.openness`, `friend.stability`, `friend.stress`, `friend.active_events`, `friend.trust` generate behavior. A friend who "sends things" is one with high warmth and moderate-to-low openness — they express care through action. Their behavior can change: when they're stressed, they stop sending things. When they're okay, they resume. The trait is a tendency, not a rule.

### Coworker flavors → personality + state

Current: `coworker.flavor` (`warm_quiet`, `mundane_talker`, `stressed_out`, `quietly_competent`, `oversharer`) selects from `coworkerChatter` and `coworkerInteraction` tables.

Replacement: same personality parameters + stress + active events. The `coworkerChatter` and `coworkerInteraction` dispatch changes from `switch (flavor)` to reading the NPC's current state. A coworker who is usually a mundane talker (high openness, high stability) becomes quieter when their parent is hospitalized. A coworker who is usually quietly competent (low openness, high stability) might surprise you by mentioning something personal after months of working together — because trust accumulated.

### Family archetypes → personality + state + relationship dynamics

Previous: `family_archetype` (`warm_caring`, `performance_watching`, `critical`, `checked_out`, `unreachable`) drove family message prose, call prose, guilt accumulation patterns, and NT target coupling. **Replaced in v34.**

Now: personality parameters + life facts + relationship dynamics. A family member with high warmth and low stability is not "warm_caring" — they're warm, but their warmth fluctuates with their own stress. A family member with low warmth and high stability is not "critical" — they're consistently distant, which reads as critical but might shift if the relationship changes. The prose generation reads warmth, stress, active events, and trust rather than dispatching on a label.

The NT target coupling currently keyed to archetype (`performance_watching` → cortisol, `warm_caring` → serotonin) needs re-grounding: the coupling should read the NPC's personality parameters and current state, not a category. A warm family member who's currently stressed produces a different NT effect than the same person at baseline.

### `family_sketch` tags → life facts driving the event generator

Current: `family_sketch: ['has_young_kids', 'caring_for_parent']` gates additional chatter prose.

Replacement: `children: [{ age: 3 }]`, `parent_health: 'declining'` — actual life facts that drive event generation. The child can get sick. The parent's health can worsen. These events change the NPC's stress, which changes their behavior. The prose arises from the NPC's current state, not from a tag.

---

## Approximation Debts

This section documents what's approximated in this design. All debts should be tagged with `// Approximation debt (NPC simulation):` at implementation sites.

### NPC stress drift rates

The NPC stress model (drift toward target, rate determined by stability) parallels the player character's NT system but is far simpler. The drift rate is an approximation debt — there is no individual-level data for how quickly a given person's stress rises or falls. The stability parameter modulates this, but the base rate and the stability-to-rate mapping are chosen values.

### Life event probabilities

All per-day and per-week event probabilities in the event generation tables are chosen for plausible pacing — frequent enough that NPCs have things happening, rare enough that not every coworker is in crisis every week. These are not derived from epidemiological data, though they should be sanity-checked against population rates where possible (e.g., childhood illness frequency has established seasonal rates).

### Personality parameter ranges and behavioral effects

The mapping from personality parameters (warmth, openness, stability) to behavioral output is designed, not empirically grounded. The Big Five provides the conceptual framework (warmth ≈ agreeableness, openness ≈ openness to experience, stability ≈ emotional stability / inverse neuroticism), but the specific thresholds at which behavioral changes occur are chosen.

### Resolution-scaling mechanism

The thresholds for upgrading and downgrading NPC resolution (contact frequency × trust breakpoints) are approximation debts. There is no empirical basis for "how many interactions before a coworker's simulation gets richer" — these will need tuning against playtest experience.

### Event duration and severity

Event durations (child_sick: 1-5 days, relationship_strain: 1-8 weeks) and stress contributions are chosen for plausible feel. Real-world illness durations, grief timelines, and relationship dynamics have established ranges, but individual variation is enormous.

---

## Implementation Status

The refactor is largely complete. Three of four NPC categories have been migrated:

1. **Coworkers** (v33) — live personality params, life facts, stress, active_events, trust. `processCoworkerEvents()` on backgroundRng each sleep cycle. State-driven prose generation. Old flavor dispatch removed.
2. **Friends** (v34) — same model. `processFriendEvents()` on backgroundRng. Old flavor-keyed tables (`friendMessages`, `friendReplyProse`, `friendInitiateProse`, etc.) replaced by `generateFriend*()` functions. Absence-tier variants removed.
3. **Family** (v34) — continuous personality params (warmth/openness/stability) replace archetype strings. `familyBehaviorTier(member)` maps params to behavioral categories (`warm`/`evaluative`/`distant`/`hostile`). `processFamilyEvents()` on backgroundRng. Old archetype-keyed tables (`familyMessages`, `familyCallAnsweredEasy/Awkward`, `familyCallNoAnswer`, `familyGuiltThoughts`) replaced by `generateFamily*()` functions. `unreachable` is now a boolean on the member, not an archetype value.

**Remaining:**
- Coworker flavors still exist as a parallel system — the v33 refactor replaced them with NPC state for prose generation, but some coworker interactions may still reference flavor indirectly.
- `family_sketch` tags on coworkers are superseded by the life facts model but haven't been fully removed yet.
- Dynamic resolution scaling (upgrading/downgrading NPC simulation detail based on contact frequency) is designed but not implemented.
- Stranger simulation (ephemeral NPCs for one-scene encounters) is not yet designed.

### Save format

NPC state must be stored in the run record. Active events have timestamps, so replay correctness requires the event log to be deterministic — all event generation through `backgroundRng`, same seed = same events. NPC state is not regenerated from the action log; it's persisted alongside the player character's state.

### Performance

The event generation pass iterates over all NPCs above low resolution (likely 5-10 for most characters: 1-3 family members, 2 coworkers, 2-3 friends). Rolling events for each is a handful of `backgroundRng` calls per NPC per sleep cycle. This is negligible.

The stress drift calculation for NPCs is similarly lightweight — one exponential approach per NPC per `advanceTime()` call. No performance concern.
