# docs/design/memory.md

Design exploration for autobiographical / episodic **memory** as a simulated layer.

This is a design-exploration document, not an implementation spec. It reconciles six
expert-lens explorations (memory-science, grief-attachment, systems-ontology,
prose-restraint, simulated-life-generation, minimalist-skeptic) into one model, and
adjudicates the maximalist-vs-minimalist disagreement against the project's hard
constraints (invisible simulation, emergence-not-flags, fully-simulated-life,
deterministic replay, prose-carries-everything, reuse-existing-systems).

Cross-references: `triggers.md` (a memory cue is a kind of trigger),
`senses.md` (Proustian taste/smell cues, the realization pipeline),
`prose-generation.md` (the "Memory intrusion" realization move, flagged there as
"needs thought" — this is that thought), `npc-simulation.md` (a departed/dead
referent is an NPC whose resolution didn't drop to zero), `emotions.md` (the
sentiment system, which is reused wholesale for reconsolidation), `family-milestones.md`
(generated deceased family with `death_date`; death-anniversary grief-spike),
`reactivity-axis.md` (involuntary-intrusion probability), `someday.md` and the
backstory generator (the life-sim that must deposit the latent ground truth),
`clothing-implementation.md` §2 and `body.md` (the clothing-that-no-longer-fits
worked example), `overview.md` line 994 ("Memory intrusions — not explained, just
there"), and TODO.md line 221 (the abstract trauma intrusion this would give content to).

**Citations:** every empirical psych/memory claim below carries a retrievable ID or
is marked `unverified`. Per the repo rule, a plausible-looking but unconfirmed PMID is
worse than none — IDs written here that have not been confirmed against the source in
this session are explicitly marked `PMID … — unverified`.

---

## 0. The one-paragraph model

Memory is **cued reconstruction from a latent, immutable, ground-truth life.** Almost
all of a life is never re-experienced and has no experiential existence; there is **no
pre-built memory bank** to populate or tier. The simulated life deposits a sparse spine
of dated events, each **stamped at deposit-time with the neurochemistry the engine
already computes** — that stamp is the *encoding fingerprint* (how readily it later
surfaces, how vivid, its original coloring). A present-tense *cue* (a dish, a smell, a
song, a place, a date, a face, a worn garment) plus the character's *current* state
occasionally reconstructs one fragment — lossy, decayed, and recolored — and that
recolouring is the *retrieval fingerprint*. **The ache lives in the gap between the
two fingerprints.** The act of recall makes a memory labile (reconsolidation): the
**first** recall births a drifting trace, structurally identical to a sentiment, and
each later recall rewrites it toward whatever state it was recalled in. The whole thing
is a thin read-projection over four systems that already exist (event log,
neurochemistry, sentiments, backstory) plus one new query function, one derived cue
index, and an NT stamp on events. It surfaces only as altered prose in the existing
inner-voice typographic tiers — never as chrome, a number, or a "memory unlocked"
announcement.

---

## 1. What this IS, in full generality

The object is never the point. A garment worn seven years, a parent's dish, a song, a
street — these carry weight not from what they *are* but from a person's accumulated
lived history with them. The general phenomenon is **memory**; the object is one **cue
class**. Decompose any instance:

- **CUE** — a present-tense stimulus that can reconstruct a fragment. Cue classes:
  *objects* (a worn garment, a mug), *foods / recipes* (a dish someone used to cook),
  *music*, *smells*, *places* (a street, a former dwelling), *dates* (anniversaries —
  the existing death-anniversary spike is the `date` cue class already firing),
  *faces / people*, and *people-and-their-things* (a departed person's object). **Taste
  and smell are the strongest cues** — fewer of them, but they hit harder and reach
  older memories (the Proust effect; olfactory–autobiographical-memory linkage,
  Herz line of work — *PMID unverified*). They get a retrieval-probability multiplier.

- **CONTENT** — the episode, period, or relationship the cue is bound to. Content lives
  in the immutable ground-truth life, never copied into the cue.

- **AFFECT** — produced by the **gap between THEN and NOW**: the thing, the person, the
  place, *or the self* has changed. The self-as-changed case (`phase_loss`) is
  first-class: a former self is a referent you can grieve, and the changing body is the
  one cue class where the THEN/NOW gap is internal (a scar's origin, an old weight).

A cue is, architecturally, **a kind of trigger** (see `triggers.md`) whose payload reads
the backstory/event-log rather than the immediate environment. The minimalist framing —
"memory is a trigger whose payload happens to read history" — is the right floor framing
and is adopted below.

---

## 2. The two emotional fingerprints

This is the affective engine. There are **two distinct fingerprints**, and they must be
allowed to **disagree** — collapsing them destroys the whole system.

### (a) ENCODING — stamped from neurochemistry-at-the-event

Emotional arousal at the moment of an event modulates consolidation: a charged event
burns in (flashbulb-like), a flat day barely encodes (amygdala / stress-hormone
modulation of memory consolidation, LaBar & Cabeza 2006 — *PMID 16371950, unverified*;
the broader Cahill & McGaugh arousal-consolidation line — *PMID unverified*). **The
simulation already computes the character's NT state (cortisol, NE, dopamine,
serotonin, GABA) at every event**, so encoding is **derivable, not a new system**:

```
encoding_strength ≈ saturating( arousal )      arousal ≈ normalised(cortisol + NE)
encoding_valence  ≈ sign/scale from serotonin & dopamine
vividness         ≈ saturating function of arousal
```

The stamp is **frozen at deposit-time** because it is a fact true *at the event* — and
the repo rule says facts true at the event live with the event (`overview.md`,
"event records record events"). Skeptic's constraint, adopted: store a **compact**
`{valence, arousal}` (or `{valence, arousal, vividness}`) — *not* a 28-system NT vector
snapshot. No prose path distinguishes more than a handful of colorings; storing the full
vector is inert. (Open question 8.1 reconsiders whether congruence needs more than
valence preserved.)

### (b) RETRIEVAL + RECONSOLIDATION — present-tense, mood-congruent, drifting

A cue plus *current* state reconstructs and **recolors** the memory (mood-congruent
recall, Bower 1981 — *PMID unverified*). And retrieval makes the trace **labile**:
each recall can rewrite it (reconsolidation; the canonical demonstration is
Nader, Schafe & LeDoux 2000 — *PMID 10963596, unverified in this session — confirm
before relying on it*). A memory revisited in grief drifts grief-ward; in anger,
anger-ward; the drift **accumulates across recalls**.

This is **structurally identical to the sentiment system** (asymmetric associations that
drift on each activation, entrench or habituate, and are processed in sleep). Reuse it
verbatim: the reconsolidation trace is a sentiment keyed `mem:<event-id>` (or
`bond:<referent>:<cue>` — see §6 granularity question). **Only recalled memories acquire
a trace; the latent rest stay pristine-but-dormant; the FIRST recall births the trace.**

### The disagreement is the payload

A joy-encoded day re-read years later through loss: encoding-valence says *warmth*,
retrieval-state says *bereaved*. The prose renders the **friction**, not a resolved
average. This single disagreement is the irreducible minimum that produces the ache
(§7). The **registers** the grief lens distinguishes — comfort, nostalgia, longing,
grief, dread/complicated, ambivalence — are not separate feelings bolted on; they are
**different shapes of this gap plus the status of the referent**:

| register     | gap shape                                           | referent status                  |
|--------------|-----------------------------------------------------|----------------------------------|
| comfort      | small gap / intact bond / warm-now                  | reachable, or present            |
| nostalgia    | large gap, integrated, recalled in a stable state   | changed/irreversible but at peace|
| longing      | gap with a **direction** — a door that is shut      | reachable-in-principle (moved away, estranged-but-alive) |
| grief (acute)| rupture, recalled bereaved or recent loss           | **foreclosed** (death / final estrangement) |
| dread/complicated | encoding itself charged-negative               | harmful bond, now lost           |
| ambivalence  | encoding and retrieval **disagree in sign**          | any                              |

Load-bearing distinction: **"moved away" ≠ "passed."** Longing has a direction (reunion
is possible); grief has none (the door is bricked). The `loss_type` field is not flavor.
Disenfranchised grief (an ex, a pet, a miscarriage, an estranged parent, a friendship
that quietly ended) is handled naturally because register is computed from the bond's
**actual weight to this character**, never from social legibility.

---

## 3. Ground truth vs recollection — the data model

### Immutable ground truth (the life)

Two sources, unified by reference; **origin is an attribute, not a taxonomy**:

- **In-run events** — the existing event log (`{time, type, data}`, replay-reconstructed),
  **extended** so each entry carries the compact encoding stamp read from live NT at
  `record()` time. A field addition, not a system.
- **Pre-game life** — the backstory, which today is too thin (see §4). For memory it must
  emit a sparse, *timestamped, NT-stamped* episodic spine.

A memory-reference is `{ source: 'log' | 'backstory', idx }`. Both flow through the same
`recall()`.

### Recollection (derived, never stored)

```
recall(cueKey, now):
  refs   ← cueIndex[cueKey]                    # derived projection, no authority
  pick   ← select ref by encoding_strength × congruence   # may blend siblings
  p      ← g(encoding_strength, decay(now − t), cueModality, currentNTcongruence, reactivity)
  roll on rng (fixed draw count, regardless of outcome)
  if fires:
     fragment ← groundTruth(pick)
                ⊕ gist_decay(now − t, recall_count)   # verbatim → gist
                ⊕ magnitude_drift                      # emotional inflation/deflation
                ⊕ mood_recolor(currentNT)
                ⊕ reconsolidation_trace(pick)          # if one exists
     birth-or-drift sentiment  mem:<pick>
  return prose-shaping payload   # never a number, never stored
```

**Distortions are not bugs; they are where the lived-ness is:**

- **Magnitude drift** — emotional inflation/deflation relative to ground truth.
- **Blending / source-confusion** — two events sharing enough cue-features that current
  state picks the wrong one or a blend. Deterministic-but-wrong, never flagged. (The
  skeptic's caution, §7: this is **inert at the surface** — the player has no second
  look — so its priority is low.)
- **Detail decay** — verbatim → gist (fuzzy-trace direction, Reyna & Brainerd — *PMID
  unverified*; the classic forgetting curve, Ebbinghaus — *PMID/DOI n/a, 1885*). First
  recall is specific; the tenth is atmosphere. **You do not need a per-detail decay timer
  to write vague prose — you write vague prose for old memories.** The decay function's
  job is only to set *how much* survives into the lexical pools.
- **Mood-congruent recoloring** — the current-state tint.

### Stateless vs stateful — resolved as a perf tradeoff

Under strict determinism both compute the **same** recollection, so this is purely a
time/space/complexity decision at implementation time — **not** a behavioral fork.
**Caveat:** a "stateless" implementation must **replay the full recall PATH** to stay
equivalent, because reconsolidation accumulates across recalls. A memoryless "distort by
current mood only" version is a **thinner, different model** that silently drops
reconsolidation accumulation — it is not an optimization of the same model.
**Stateful = deterministic memoization = the sentiment trace already in the codebase**,
which is why storing the trace as a `mem:` sentiment is the recommended default: it makes
the stateful version free.

### What is stored vs derived (summary)

| stored (authority)                                   | derived (rebuildable, no authority)        |
|------------------------------------------------------|--------------------------------------------|
| event log + compact encoding stamp per event         | `encoding_strength(ref)`                   |
| backstory episodic spine (timestamped, NT-stamped)   | the cue index (projection over both sources)|
| reconsolidation traces — `mem:` entries in `s.sentiments`, born on first recall | retrievability / decay |
|                                                      | the recollection fragment (computed on cue)|

**Negative space (load-bearing):** no memory bank, no warm/cold tier, no list of
"memories the character holds." A memory's experiential existence *is* the set of times
`recall()` fired. This is the rejected "keep memories warm like NPCs" framing encoded as
an architectural **absence**.

---

## 4. Generation from a simulated life

The central hard constraint: **you cannot hand-author seven years of wearing.** Memories
must *arise* from a generated life. This is satisfied because the encoding fingerprint is
a **byproduct** of running the same NT engine, not an authored field.

**Today's gap (honest):** the backstory generator is presently Dwarf-Fortress-legends
compression (`chargen.js` `lifeEventDefs`: `economic_origin`, `career_stability`, 0–2
abstract `life_events` with `financial_impact`, ~7 `charRng` calls). It has **no
timestamps, no participants, no places, no cue-keys, no NT stamps** — so a cue lands on
*void*. Abstract `job_loss: financial_impact` can never be a Proustian cue: nothing
concrete binds to it.

**The required move:** grow `generateBackstory()` from legends-compression into an
**epoch walk** on `charRng`. From age ~4 to current age (honoring childhood amnesia —
no episodic anchors before ~3–4, only diffuse texture), walk developmental epochs and
emit a **sparse spine** of **concrete** events derived from already-generated parameters
(economic origin, family members, personality, latitude/culture):

```
event = { t, epoch, kind, participants[], place_id, cue_keys[], encoding:{valence,arousal} }
```

- The encoding stamp comes from running the NT engine over a **coarse** life trajectory:
  **epoch baselines** (a precarious adolescence runs higher chronic cortisol) punctuated
  by the event's own acute arousal — **not** a minute-by-minute replay. So encoding
  strength is a *consequence* of the simulated emotional life, identical in kind to
  in-run stamping. *Approximation debt (memory encoding): the coarse epoch-NT
  reconstruction is a placeholder; replace as the backstory deepens toward a fully
  simulated past.* This is `someday.md`'s direction made load-bearing.
- **Sparse, not dense.** Tens, maybe low hundreds, of dated events across a life — real
  autobiographical memory is sparse; what makes it feel infinite is that *cues
  reconstruct*. Every person who left or died gets an **anchor cluster**; every dwelling
  a sensory signature and a move-out; every long-running food ritual a start and a stop.
  Most of life is flat Tuesdays **never generated at event grain at all** — only as
  epoch-level texture, which catches near-misses as the honest "you can't place it."
- **Durations are attributes, not replayed histories.** "Owned/wore X for ~7 years" is a
  legend-level attribute with an acquisition timestamp; "how far along" is derived
  `now − acquisition_time` per the repo's start-timestamp rule, never a counter. The
  garment's grief is *long-duration, low-charge* → gist-only, all worn-ness and no
  episode. That falls straight out of `(duration, encoding_amplitude)`.

**Lazy / retroactive generation, kept deterministic:** the spine fixes *what / when / the
encoding stamp* up front (cheap, few). Fine sensory detail for a near-miss event can be
generated **at first cue** from a **stable sub-seed** `derive(master_seed, event_id)`, so
the same cue always reconstructs the same detail regardless of *when* first hit. Spine on
`charRng`; lazy detail on the per-event sub-seed; recall picks affecting prose on
`cosmeticRng`; recall picks affecting **state** (which event a blend resolves to,
whether a trace is born) on `rng`.

The departed are not deleted nodes. A person who drifts becomes a **memory** rather than
a contact — "less legible, not de-simulated" (`npc-simulation.md`); the **continuing
bond** is their non-zero residual state (`{ referent_id, loss_type, loss_time,
encoded_fingerprint }`), held in current state, **not** inside the history entry that
caused the loss.

---

## 5. How it surfaces — the prose

Everything upstream exists to produce, *occasionally*, a sentence that does not behave
like the sentences around it. **An involuntary memory is felt first as a wrongness in the
prose.** It rides the existing `senses.js → realization` pipeline: a cue is an
observation source whose salience clears like any other; when bound to a recollection it
occasionally emits a **contaminated** realization instead of a plain one. No parallel
render path, no header, no "you remember," no named affect.

**Devices, all repurposed from moves the prose system already has:**

- **Tense leak** — the baseline register is past tense; a memory intrusion is the one
  place present/pluperfect bleeds in. *"The onions went translucent the way they do in
  the other kitchen, the one before this one."* The grammar carries the THEN/NOW gap.
  Strongest device; use sparingly (overuse reads as a tic).
- **Reframe-dash carrying a wrong detail** (`buildReframeDash`) — source-confusion and
  decay as self-correction that doesn't land: *"Yellow, the bowl was yellow — or it had
  been green, and the green was someone else's."*
- **Body knows first** — the first clause is interoceptive and contentless (amygdala
  reactivation is somatic before narrative): *"Something arrived in the throat before the
  name did."* Many surfacings are **pure affect with content withheld** — the truest and
  cheapest case, and it conveniently hides that there may be no rich content underneath.
- **Self-doubt qualifier** = detail decay (*"his voice did the thing — or hers, it's gone
  now"*).
- **Omission as the closing move** — the final clause does **not** resolve the memory; it
  drops back to the plate, the present, the unremarkable. The drop is the ache.

**Typography is the amplitude knob.** The **gap** between encoding-coloring and current
NT picks the tier: a warmth-encoded memory hit in a low-serotonin present surfaces at a
heavier tier; the same memory in a stable present stays quiet italic. **Magnitude
mismatch** — "a feeling too big for the event" — is rendered precisely by the tier being
*higher than the visible cue warrants*: a coffee mug producing tremor-tier prose is the
point. `prefers-reduced-motion` collapses to static contrast. **Rarity is load-bearing**:
most cue-encounters roll nothing; over-firing converts intrusion into ambient-sadness
wallpaper and the device flattens.

**Register must be syntactic, never labelled** — longing leans forward toward a closed
door (conditional: *"if you called"*); grief sits with present-tense weight and no object
to move toward; nostalgia softens past tense at distance; ambivalence breaks its own
sentence. The first recall is specific; later recalls are vaguer-about-facts but
heavier-in-affect (and genuinely different text, satisfying the no-text-reuse rule
because the memory has *decayed*, not because of a variant pick).

### Worked example: clothing that no longer fits (eating-disorder / body-image)

This is the canonical worked case and ties directly to `clothing-implementation.md` §2
(Fit Model) and `body.md`. A garment is a **worn object cue**, and the recollection is
**gated by body change**:

- The wardrobe holds items acquired when the body was different
  (`clothing-implementation.md` §2: fit is a dynamic property, computed from
  `Body.dimensionAtTime()` — currently stubbed to `comfortable`, TODO.md). The item still
  exists; its `currentFit()` has drifted.
- The cue fires when the character **reaches for** or **puts on** the item and it doesn't
  sit the way the body remembers. The body knows first: the prose registers the
  waistband, the shoulder seam, *before* any thought about weight or time.
- Two fingerprints disagree on a gradient: the garment was *encoding-warm* (bought in a
  good season, worn for years — long-duration low-charge → gist familiarity), and now
  reads through whatever the current state is. In a depleted / high-cortisol present with
  a body-image-loaded character, the gap surfaces as the characteristic ache — **never as
  a number, a weight, a BMI, or "you've gained/lost."** The simulation renders friction
  in the seam and a tier bump; it never states the body fact.
- **No diagnosis, no flag.** Disordered relating to the cue emerges when parameters land
  in a configuration (body-image sentiment + current NT + the fit gap), per
  emergence-not-flags. Eating disorders are a *deferred condition needing upstream
  systems* (TODO.md line 194); this memory cue is one of those upstream surfaces — it
  does **not** require the full ED model to land the clothing ache, but it should compose
  with it once that model exists. *Cross-ref: TODO.md "eating disorders" deferred item;
  `clothing-implementation.md` §2; `body.md`.*

---

## 6. Connection to existing systems — reuse / extend / new

**Reuse, near-total:**

- **Sentiment system** (`emotions.md`, `adjustSentiment` / `processSleepEmotions`) — the
  reconsolidation trace **is** a sentiment: `target = mem:<id>`, asymmetric drift on each
  activation, entrenchment vs habituation, sleep-processed toward baseline. The
  existing rule that negative qualities (dread/grief) process ~40% slower in sleep is
  *exactly* grief integration over time — acute grief resists overnight processing, for
  free. **This is the design's load-bearing claim and the code confirms the shape.**
- **Event log** — immutable ground truth; already `{time, type, data}`, already
  replay-reconstructed. Extended only with the compact encoding stamp.
- **Neurochemistry engine** — supplies *both* fingerprints (encoding = NT-at-event;
  retrieval = NT-now). No separate encoding system.
- **Backstory generator** — extended to emit the episodic spine (§4); reuses its
  `charRng` discipline and the re-slice-on-age-change pattern.
- **NPC dynamic resolution** — a departed/dead referent is an NPC whose resolution didn't
  hit zero; the continuing bond is their residual state.
- **Reactivity axis** — scales involuntary-intrusion probability (high reactivity → more
  unbidden surfacings; PTSD-adjacent intrusion, TODO.md line 221).
- **Inner-voice typographic tiers** — render intensity unchanged.
- **Death-anniversary grief-spike** (`family-milestones.md`) — already the `date` cue
  class firing; this generalizes it to all cues and loss-types.

**Genuinely new (small):**

1. `recall(cue, now)` — one query function on `rng`, fixed draw count per encounter.
2. The **cue index** — a derived projection over both ground-truth sources, rebuildable
   on load, **no authority**.
3. The compact **encoding stamp** added at event `record()` time (a field).
4. The backstory **episodic-spine pass** (the big content investment — see §4).
5. The **decay / retrievability** function (a forgetting curve — does not exist yet).
6. The **register-derivation** pure function (grief vs longing vs nostalgia vs
   ambivalence from gap-geometry + `loss_type`), in the style of `perceivedPresentation()`.

This **fills a known hole**: `overview.md` line 994 and TODO.md line 221 describe exactly
this — the abstract trauma intrusion that currently has no named content.

---

## 7. How rich does it need to be — the floor, the ceiling, the staged scope

The lenses split here. The **maximalist** lenses (memory-science, grief-attachment,
simulated-life-generation) want the full lifecycle. The **minimalist skeptic** insists
the only thing that exists is the ~50 words that surface, and that most of the lifecycle
is **cathedral nobody enters**. **Adjudication, grounded in the constraints:**

**The skeptic is right about the system; the maximalists are right about the content.**
The *mechanism* stays at the floor; richness is a **content problem masquerading as a
systems problem.** Every internal feature must change the surfaced text or it is inert,
because the simulation is invisible by construction and the player has no second
observation to compare against.

### The FLOOR (the least that still aches)

A cue-key resolves to **real bound life-content**, and the fragment reflects a **GAP**
between then-coloring and now-state. Concretely: **cue index + reconstruct-on-cue +
gap-driven typographic tier.** One charged loss + one concrete cue bound to it + the gap
(it's gone now). *"The dish came out of the oven and for a second it was the other oven,
the one in the apartment with the green counters."* Three data points (cue, one retained
detail, a THEN/NOW marker) and the ache lands — the affect is produced entirely by
omission. **No reconsolidation, no forgetting curve, no source-confusion needed for the
first ache.** Below this floor — a recollection that always reads the way it was encoded —
there is no ache at all; it is a flashback, not memory.

### What is SEDUCTIVE BUT INERT (wait or cut)

- **Reconsolidation *graphs*** (memories linking to memories, spreading activation) — the
  prose surfaces one fragment at a time; graph structure is never observable. **Cut.**
- **Fine-grained source-monitoring** — a blended recollection is indistinguishable to a
  player with no ground-truth access. Produces no text difference. **Defer / cut.**
- **Per-detail forgetting curves with decay timers** — you write vague prose for old
  memories directly. A single coarse `decay(Δt, recall_count)` scalar is enough. **Cut
  the timers.**
- **A warm / tiered memory bank** — already rejected; underwritten hard here. Latent and
  "warm" memories produce identical fragments on cue, so warmth is pure cost.
- **Full NT vector stored per memory** — prose distinguishes ~4 colorings; store
  `{valence, arousal}`. **Cut.**
- **Minute-by-minute simulation of the past to "earn" durations** — legend-level
  attributes suffice. **Cut.**

### Recommended staged scope

- **Stage 0 (floor — build first; already lands the ache).** Compact encoding stamp on
  in-run events. A cue index built once at chargen from the existing backstory + NPC
  records via a salience heuristic (duration × relational closeness × |valence|).
  `reconstruct(cue, now)` emitting a one-clause contaminated realization, tier set by the
  gap. The reconsolidation trace as a `mem:` sentiment **born on first recall only** (this
  alone gives reconsolidation accumulation for the handful of repeatedly-hit central cues,
  which is the only place it pays off — so the floor already includes it for free). Accept
  the honest asymmetry: in-run events get true per-event stamps; backstory events get a
  coarse era-baseline stamp (approximation debt).
- **Stage 1 (the content investment — highest emotional yield).** The backstory
  **episodic-spine epoch walk** (§4): concrete dated, participant-bearing, cue-keyed,
  NT-stamped anchors. **This is the single highest-leverage investment** — breadth of
  bound cues is what makes the world feel haunted rather than empty. Without it the
  machinery is fine but never fires on anything that matters.
- **Stage 2 (register + restraint depth).** The `loss_type` distinction and the
  register-derivation function (longing vs grief vs nostalgia vs ambivalence) so losses
  render distinctly instead of as generic sadness. Per-cue prose pools rich enough that
  repeat visits don't repeat verbatim. Tense-leak reserved for higher tiers.
- **Stage 3 (lossiness depth, lowest priority).** Coarse decay scalar; lazy per-event
  detail on a stable sub-seed. **Source-confusion / blending only if** a phenomenological
  case for its surface visibility is found (Open Q 8.6).

The **catastrophic failure to guard against at every stage** is **generic-sadness
collapse**: the moment longing reads like grief reads like nostalgia, the feature has
failed its reason for existing. Distinct registers in prose are the bar.

---

## 8. Open questions for the user

1. **Encoding-stamp width.** Is compact `{valence, arousal}` sufficient, or does the
   mood-congruence computation at retrieval need the full (or partial) NT vector
   preserved? Leaning compact, but the joy/loss-disagreement engine may need at least
   valence kept faithfully. (Affects what gets frozen on every event.)
2. **Backstory NT-reconstruction fidelity.** How cheaply can a life-period's NT context be
   reconstructed for the stamp without a full tick simulation — and does the cheapness
   flatten every past memory to the same coloring (which would make all backstory
   memories feel identically warm/sad)? If it flattens, each anchor needs a per-event
   valence from its own legend-attributes, not just an era baseline.
3. **Trace granularity.** Is the reconsolidation trace keyed per **memory**
   (`mem:<event>` — truer to reconsolidation; one memory of a person can sour while
   another stays warm; cheap because most never recall) or per **referent**
   (`bond:<person>` — cheaper, drives the anniversary/idle path, but loses per-memory
   divergence)? Likely both: per-memory traces born on recall, bonds aggregating for the
   date/idle path. Needs a decision against the sentiment key scheme.
4. **Per-target baseline.** Should `mem:` traces process toward the memory's **original
   encoding coloring** rather than the character baseline `processSleepEmotions` uses? A
   memory's "home" affect may differ from the character's — the current sentiment system
   has no per-target baseline. (Also: does the whole-system interaction of recall-drift
   *up* and sleep-processing *down* oscillate or run away? Needs numeric verification, not
   local plausibility.)
5. **Module boundary.** Is "memory" a named module, or is a memory cue simply a
   **trigger whose payload reads history** (collapsing it into the existing trigger
   system — the most minimal framing)? The skeptic suspects the latter; worth deciding
   before any code.

Three further questions worth flagging but secondary: the cue-salience heuristic that
decides *which* life-threads become cues (determines haunted-vs-empty, needs tuning); the
RNG accounting (does merely *encountering* a cue roll retrieval every time, inflating
draw counts, or only at salience-gated moments — and how is the fixed-draw-count
guarantee held either way); and DID interaction (alters' differential memory access reads
this spine through a per-alter filter — is that a property of `recall()` or of the cue
index? see `did.md`, `parasocial.md`).
