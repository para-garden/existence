# Parasocial Contact Quality

## The Phenomenon

You can not be lonely — your social score is fine, someone's voice is in the room,
you've been in a Discord for three years — and still have a specific low-grade
deficit that doesn't have a name. It's not that no one is there. It's that no one
is *there for you*. The presence is real. The reciprocity is absent.

The current social model doesn't distinguish these. `social` rises whether you
reply to a friend or watch a stream. This is wrong — not because one is illegitimate
but because they do different things to a person. Parasocial consumption buffers
against isolation. It does not nourish the same way.

The gap between those two things is where this system lives.

---

## Architecture

### Why a scalar

Three options were considered: a single scalar, per-relationship tracking, and
sentiment-style.

**Per-relationship tracking** would mean a depth value per friend slot and per
parasocial object. The blocker: parasocial objects don't exist as named entities in
the system — there's no creator state. You'd need to build that first. More
fundamentally, the phenomenon we're modeling isn't "depth with friend1 specifically
is low" — it's the aggregate state of reciprocity across the character's social
life. The hollowness is a whole-person state. The NT coupling (serotonin coefficient)
needs a single number regardless, so per-relationship tracking would just be
bookkeeping that collapses to a scalar anyway. Per-relationship becomes the right
model when named creator entities exist and fan community members are tracked —
at that point you'd aggregate per-relationship qualities. At current complexity,
the aggregation is trivial and the indirection costs more than it provides.

**Sentiment-style** doesn't fit because sentiments are directed feelings toward
specific targets (`work_dread`, `friend1_guilt`). Connection depth isn't *toward*
a target — it's a property of the character's overall social state. Using the
sentiment system would also entangle depth with sleep processing (sentiments
attenuate during sleep; connection depth doesn't — sleep provides no connection,
see below). Forcing depth into a sentiment would require carving out exceptions
to sleep processing that the system wasn't designed for.

**Scalar wins** because the phenomenon is genuinely aggregate at current model
complexity, the NT effect requires an aggregate number, and the system is simpler.
Revisit when creator entities and community membership exist.

### `connection_depth` (0–100)

A new state variable tracking the cumulative weight of recent genuine reciprocal
contact. Not a quality score on a single interaction — a running state of how much
real two-way contact has happened lately.

**Default:** 40 (same neighbourhood as social default)

**Decay:** toward 0, τ = 69h (half-life ≈ 48h — faster than social's τ = 66h).
No floor. You can go all the way to hollow.

```
depth = depth × exp(−hours / 69)
```

No personality modifier on decay rate in the first pass. Approximation debt:
`parasocial_tendency` chargen parameter (see Deferred) would modulate this.

**What raises it — and by how much:**

| Event | Δ |
|-------|---|
| Replying to a friend message | +15 |
| Initiating a message to a friend | +12 |
| Reading a friend message (no reply yet) | +5 |
| Talk to coworker (face-to-face) | +3 |
| Coworker speaks to you (you respond) | +2 |
| Watching content / parasocial consumption | 0 |
| Notifications / social media browse | 0 |

These are approximation debts — magnitudes chosen. Direction is the constraint.

**What does NOT raise it:**
Anything one-directional. Watching someone's stream, reading someone's posts,
following a creator's updates, fan community lurking. Social score may rise;
connection_depth doesn't.

---

## NT Coupling

### Serotonin target

Currently: `t += (s.social − 50) × 0.15`

This gives the full social uplift regardless of whether the social score came from
genuine contact or parasocial buffering. With connection_depth, the coefficient
becomes depth-dependent:

```
connectionDepthCoeff = 0.06 + 0.09 × (connection_depth / 100)
t += (s.social − 50) × connectionDepthCoeff
```

At depth = 100: coeff = 0.15 (unchanged)
At depth = 50:  coeff = 0.105 (70% of full)
At depth = 0:   coeff = 0.06 (40% of full)

The effect: parasocial maintenance produces real but diminished serotonin support.
You're not in the isolation trough — but you're not getting the full nourishment of
genuine connection either. High social, low depth → the numbers look okay; something
feels slightly off.

The floor (0.06) is not zero because even parasocial contact signals non-isolation
to the nervous system. The ceiling (0.15) requires depth to reach.

**Approximation debt:** coefficients 0.06 and 0.09 chosen. Direction and ceiling
matching confirmed (at depth=100, identical to current model). No human
quantitative data distinguishes parasocial vs. genuine social contact effects on
5-HT firing.

---

## Content

### `watch_content` — new phone interaction

**What it is:** consuming a creator's content — stream, video series, podcast,
long read. One-directional presence. Not checking notifications (passive/ambient);
an active choice to spend time with someone's output.

**Mechanics:**
- Available in phone mode, at home (apartment locations)
- Duration: 45 minutes of game time (fixed for now; variable duration deferred)
- Advances `social` by +2 (the presence buffers; it counts for something)
- Does NOT advance `connection_depth`
- Adenosine: slight suppression (screen stimulation keeps you up)
- Serotonin target: no direct effect — the indirect effect comes from the
  depth-modulated social coupling

**Prose shading** — the core of why this interaction exists. Three distinct
experiences depending on `connectionDepthTier()`:

- **Deep/present:** The stream is pleasant, a comfortable presence. The warmth is
  real even if it's one-sided. Not much wistfulness — this supplements something
  that's already there.
- **Surface:** Something slightly hollow at the edges. You're watching someone be
  in their life. You're not in yours.
- **Hollow:** The stream ends and the quiet is specific. The warmth was real while
  it was happening. Now it's gone and it was never actually yours.

The prose at 'hollow' shouldn't be heavy. It should be the small specific silence
after closing a laptop — the gap between warmth-as-presence and warmth-as-connection.

### Tier function: `connectionDepthTier()`

| Range | Label |
|-------|-------|
| ≥ 70 | `'deep'` |
| ≥ 45 | `'present'` |
| ≥ 20 | `'surface'` |
| < 20 | `'hollow'` |

### Idle thoughts

New idle thoughts conditioned on `viewing_phone === false` and low
`connectionDepthTier()`: the specific feeling of having had company but not
connection — the warmth-adjacent state. Not dramatic; just the fact of it.

---

## Prose experience (design constraints)

The player never sees `connection_depth`. They experience:

1. **`watch_content` prose** — the primary site where the gap is legible. The
   reading of the same action changes based on depth tier.

2. **Idle thoughts** — occasional, not frequent. Low depth produces specific
   thought content: the awareness of having been adjacent to a life rather than in
   contact with one.

3. **Serotonin modulation** — no new prose directly; the NT state shades existing
   prose more dimly when depth is low. Experienced as mood coloring, not as a named
   thing.

4. **Transition moment** — the end of `watch_content` at hollow depth. The
   interaction resolves into a specific kind of quiet. This is the moment the
   asymmetry is briefly undeniable before it gets rationalised.

The low-depth experience should never be labeled or moralized. No system voice.
No "you feel lonely." The prose renders what the body and mind are doing; the
player recognises it or doesn't.

---

## Sleep and depth

Connection_depth is not processed during sleep. It's not an emotional residue —
it's a property of the social network state. Sleep doesn't provide connection, so
it doesn't change depth.

**Possible future addition:** low depth affects sleep quality slightly (loneliness
disrupts sleep — Cacioppo et al. 2002 PMID 11915810). Deferred; needs calibration.

---

## Deferred

**Fan community as distinct mechanic.** Community interaction (posting in Discord,
replying to other fans) is genuinely reciprocal — real people engaging back. This
*should* raise connection_depth, but it's social connection mediated through the
parasocial object. Design question: same weight as direct friend contact, or less?
And: what happens when the shared object breaks? Deferred — requires more content
around community membership.

**Creator loss / rupture event.** If the creator stops producing, does something
that breaks the attachment, or dies — grief without socially-acknowledged
relationship. Requires tracking the creator as an entity with continuable state.
Deferred — needs creator state system.

**`parasocial_tendency` chargen parameter.** High tendency: more social buffering
per unit of consumption, slower depth decay (the substitution is more effective,
but also more complete — real contact becomes less urgently sought). Low tendency:
less buffering, normal depth. Would affect depth decay rate and the `+2 social`
from `watch_content`. Deferred — keep first pass simple.

**Variable duration for `watch_content`.** 45 min is fixed. Real consumption
varies: 15-min video vs. 4-hour stream. Player input on duration, or a second
interaction (`keep_watching`). Deferred.

**Fan labour content.** Fanfic, analysis, community work — creative and emotional
investment that runs deeper than passive consumption. Different NT effects
(creative work → dopamine differently from passive watching). Shares parasocial
asymmetry but isn't consumption. Deferred.
