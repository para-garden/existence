# Candidate: Frozen-LLM-at-the-Leaves as the Forward Generator

**Frame:** maximize expressiveness; rigorously defend the LLM-at-leaves as genuine
forward-caused generation. Build the most expressive forward generator possible where the
LLM *is* the leaf oracle, and make the argument that build-time-frozen LLM calls are
forward causation (memoized), not W2/W4/W7 thinness in disguise.

This candidate takes `simulated-life.md` §4 ("LLM at the leaves, build-time only, frozen,
texture only") at face value and pushes it as far as it will go — then tests whether it
breaks. **Verdict is stated up front in §0 and defended through §1–§7.**

---

## 0. Verdict (stated first, defended below)

**Frozen-LLM-at-leaves SURVIVES — but only under a sharp partition it does not get for free,
and only for the textural half. It does NOT, by itself, answer the OPEN question of what
produces the behavior-relevant nature vector.** The honest result:

- For **texture** (the prose-read specifics: the dish, the cadence of a name, the smell of a
  house) — frozen-LLM-at-leaves is **legitimate forward generation**, and the memoization
  argument (§3) holds.
- For the **behavior-relevant nature vector** (what the sim math consumes) — the LLM is
  **not** the right oracle, and trying to make it so is where W4/W7 reappear. The nature
  vector must come from the grounded joint draw (CART/trees, §2). The doc's §4 partition is
  not a stylistic preference; it is **the load-bearing firewall** that keeps the LLM
  legitimate. Erase the partition and the candidate fails.

So the answer to the crux question — *"does build-time-frozen LLM generation count as
genuine forward-caused simulation?"* — is: **yes for texture, no for behavior, and the line
between them must be enforced structurally, not by intention.** This candidate's whole value
is making that line precise and buildable.

---

## 1. What the leaf actually is

The leaf is the bottom of §5's primitive: *an agent, in character, given their nature and
situation.* When the forward pass touches a person (lays them down whole, §3), two things
must be produced:

1. **The nature vector** `N` — a structured, behavior-relevant parameter bundle the sim math
   reads: the personality axes, NT setpoints/inertia, identity dimensions, attraction
   profile, constitutional conditions, capacities, dispositions. This is what every existing
   system (`state.js`, `emotions.js`, `chargen.js` rolls) already consumes. It is **numbers
   and structured enums**, not prose.
2. **The texture** `T` — the lived specifics that prose reads: the grandmother's dish, the
   exact phrasing of a parent's contempt, the smell of the childhood stairwell, the song
   that was always on. This is **language**, irreducibly. No vector captures "the way she
   said your name." Texture is where the LLM is unmatched and where no tree can substitute.

The candidate's core claim: **these are different kinds of object and must be produced by
different oracles.** `N` is a draw from a conditional joint distribution (trees, §2). `T` is
a draw from a language model conditioned on `N` and the forward context (LLM, §3). The LLM
**reads `N` as a fixed input** and paints onto it; it never produces or perturbs `N`.

---

## 2. The nature vector: grounded joint draw (NOT the LLM)

`N` comes from the project's CART machinery in the offline-baked regime (§4 of the doc).
Conditioned on the forward context (§4 below), the tree gives a **joint** draw over `N` —
capturing the dependence structure that independent per-trait marginals destroy (the
Frankenstein-agent failure, §4b of the doc). The tree's output is the structured vector; it
is grounded in real conditional distributions per cell (culture/era/class/region/role).

**Why not the LLM for `N`?** This is the heart of the honest concession (§6). An LLM asked
for personality numbers is doing one of two illegitimate things:

- producing an **implied gestalt** with no represented joint distribution behind it (W4 —
  "LLM-implied gestalt is the very fabrication the project rejects"); or
- silently reproducing **population posteriors** baked into its weights — it knows what
  "a working-class woman born 1962 in a mill town" tends to be, and that knowledge is a
  smoothed average, not a forward draw from *this* person's specific committed antecedents.

The tree, by contrast, is an **explicit, inspectable, seedable** conditional distribution.
You can audit it, bound its divergence (§8 budget), and draw from it with the seeded PRNG.
The LLM cannot be audited this way and cannot be made to honor the divergence budget,
because its prior is opaque. **So `N` is the tree's job, full stop.** The LLM never touches
the behavior axis.

This is also what keeps **coherence between `N` and `T`** (the crux's "can these diverge into
an incoherent person?"): `T` is conditioned on `N`, so it cannot contradict it — the texture
is *generated to fit* the nature, not drawn beside it. The firewall is one-directional: `N →
T`, never `T → N`, never co-drawn. A person whose texture and nature disagree is structurally
unsayable, because the texture pass *reads* the nature as a constraint. (See §5 for the
schema that enforces this.)

---

## 3. The texture leaf: frozen LLM — and why the freeze is forward causation

### 3.1 What is fed in (causal context — forward-only, by construction)

When the forward pass lays down person `p` at simulation time `t`, the texture call receives
a **context packet** assembled *only* from facts already committed *before* `t`:

```
TextureContext = {
  seed:            u32,            // derived: splitmix32(masterSeed, "texture", p.id, t)
  nature:          N,              // the tree's joint draw for p (already committed)
  cell:            { culture, era, class, region, role },   // p's t=0-rooted context
  antecedents:     [ {relation, p_other.id, p_other.nature_summary, committed_events} ],
                                   // ONLY ancestors/prior actors already laid down before t
  situation:       { place, time-of-life, economic_context, what-just-happened },
  committed_facts: [ ...event-log entries dated < t involving p or p's context ]
}
```

**The hard rule on this packet — the forward-only enforcement (§4 of crux):** the assembler
is a pure function over the event log filtered to `date < t` and over the ancestral graph
*upstream* of `p`. It is **physically incapable of including any descendant of `p`, any
not-yet-committed fact, or any demanded outcome about `p`.** There is no field in
`TextureContext` for "the protagonist should turn out withdrawn" — the schema has **no token
for an outcome** (§8's primary mechanism, applied to the leaf). The context surface speaks
only in causes: cell, antecedents, situation. This is the §8 self-binding principle realized
at the leaf — implausible/posterior conditioning is *unsayable* because the context schema
cannot express it.

The assembler is the enforcement point. It is small, pure, testable, and the single place
where forward-only conditioning lives. A test asserts: for every texture call, every fact in
the packet has `date < t` and lies upstream of `p` in the ancestral DAG. If that test
passes, the LLM **cannot** be doing posterior generation, because it never sees a posterior.

### 3.2 What comes out (texture schema)

The LLM returns **structured texture slots**, not freeform prose — so the prose layer reads
fields, and so the output is diffable/cacheable:

```
Texture = {
  sensory:   { childhood_home_smell, recurring_sound, signature_food, ... },
  voices:    { [antecedent.id]: { name_cadence, characteristic_phrase, tone } },
  motifs:    [ short lived-detail strings, each tagged to a committed event ],
  objects:   [ specifics of significant objects: the chipped mug, the radio ],
}
```

Every texture slot is **tagged to a committed antecedent or event** in the input packet —
the LLM is painting detail *onto* committed structure, never inventing new structure. A motif
that referenced an uncommitted event would be a schema violation (caught: every `motifs[].tag`
must resolve to an event-log id present in the input). This keeps texture from smuggling in
behavior-relevant facts.

### 3.3 The memoization = forward-causation argument (the central move)

**Claim:** freezing/caching the LLM output is *mere memoization of a call that conceptually
happens at the live forward moment*. Determinism is not acausality. Here is the argument in
full, because this is the candidate's load-bearing burden.

A call `texture(seed, N, context)` is a **pure function**: same inputs → same output. The
inputs are *exactly* the forward causal state at time `t` — the seed (derived from the master
seed and `p`/`t`, the same way every other PRNG draw in the sim is), the committed nature,
and the committed-before-`t` context. **The cause of the texture is the forward state at
`t`.** That is genuine forward causation: the texture is produced *from* `p`'s already-laid-
down antecedents and situation, at the moment the forward pass reaches `p`, exactly as §6
demands ("generate once, at the live moment, from already-materialized causes").

Now: *when* the bytes of that pure function get computed is **irrelevant to the causal
structure.** Computing them at build time and storing them, versus computing them live, are
the same function evaluated at the same point — memoization. The cache key *is* the causal
context. Reading from the cache on replay is not "fetching a pre-authored fact"; it is
**replaying a forward-caused computation**, identical in kind to how the seeded PRNG replays
every mechanical roll. The project already accepts this for `Timeline.random()`: the dice are
"frozen" in the sense that the seed determines them, yet we call the outcomes genuinely
generated, not authored. **The frozen LLM call is the same: the seed+context is the cause;
the freeze is just replay.** Determinism ≠ acausality — the entire deterministic-replay
architecture rests on exactly this equivalence.

**Why this is NOT W7 (seed-evaluated infinite object).** W7 fails because detail "comes out
because the PRNG says so *when you look*" — the detail is keyed to the *act of looking*, not
to a lived forward moment, and co-drawn slices are consistent without being caused. The
texture leaf is different on the one axis that matters: it is keyed to **`t`, the forward
moment the person was laid down**, not to a later look. The context packet is the forward
state at `t`; the call happens (conceptually) at `t`; the cache merely stores that one
forward evaluation. A W7 violation would be calling `texture` at *recall time* with a
*recall-time* context to fill a grandmother nobody laid down — that is a backward reach, and
this candidate routes it to the L (§7 of the doc), never to a fresh leaf call. The
discriminator is direction-of-time of the *conditioning context*, exactly as the doc's W7/W8
distinction insists.

**Why this is NOT W2 (thin summary leaf).** W2 fails by reducing a person to low-detail. The
texture leaf does the opposite: it *adds* unbounded lived specificity onto a person whose
nature is already a full joint draw. Texture is not a summary of a person; it is the lived
surface of one. The person is `N` (full nature) + `T` (full texture) — neither is a sketch.
Coverage is partial (only laid-down people get textured) but fidelity is full (a textured
person is whole, §3 partial≠thin). The LLM is not *truncating* the recursion; it is *painting
the leaf the tree already drew whole*.

---

## 4. The exact causal context, end to end

Assembling the full picture of what conditions a forward-laid-down person `p` at time `t`:

1. **Cell** — `p`'s `{culture, era, class, region, role}`, rooted in the t=0 axioms and
   inherited forward from already-committed antecedents. (Acausal only at t=0; for everyone
   after, the cell is itself a forward consequence.)
2. **Antecedents** — the already-laid-down people upstream of `p` (parents, prior actors),
   each contributing their *committed* nature and their *committed* acts toward `p`'s context.
   Strictly upstream in the DAG, strictly dated before `t`.
3. **Situation** — the committed economic/geographic/temporal state at `t`.
4. **Seed** — `splitmix32(masterSeed, stream, p.id, t)` on a dedicated **`genRng` stream**
   (added to the four existing streams; stream additions are breaking version bumps per the
   PRNG discipline). The nature draw and the texture draw take sub-seeds so changing texture
   never shifts the nature draw (same firewall, applied to RNG ordering).

`N = tree.drawJoint(seed_N, cell, antecedents, situation, influence_within_budget)`
`T = llm.texture(seed_T, N, cell, antecedents, situation, committed_facts)` — **cached**.

Both are forward draws from (1)–(3). Influence (§8) enters **only** as a bias on the tree's
prior, expressed as causes, within the divergence budget — it never reaches the LLM as a
demanded outcome, because the LLM only ever sees `N` (already drawn) plus causes.

---

## 5. Coherence: can `N` and `T` diverge into an incoherent person?

The crux explicitly asks this. Answer: **no, by construction of the dependency direction.**

- `T` is conditioned on `N`. The texture is generated *to fit* the nature. A withdrawn,
  high-NE nature produces texture of a particular character because `N` is in the prompt as a
  constraint; the LLM cannot paint gregarious-warm texture onto a withdrawn nature without
  contradicting its input, and the schema/validation rejects texture whose tagged events
  don't match committed facts.
- The reverse arrow is forbidden: `T` never feeds back into `N`. There is no path by which
  texture perturbs behavior. So the sim math reads a coherent `N`; the prose reads a `T` that
  was built to fit that `N`. They are the same person seen at two distances (§5 of the doc).

The one residual incoherence risk is **intra-`T` contradiction** (the LLM contradicts itself
across slots) — handled by single-call generation (all slots in one completion, so the model
sees its own prior slots) plus a validation pass at build time. This is a quality-of-output
concern, not a causal-structure concern.

---

## 6. The strongest objection, steelmanned — and the honest answer

**Objection (the strongest):** *The LLM secretly encodes population posteriors. Even for
texture, when you ask it for "the dish a working-class grandmother born 1934 in [region]
made," it returns the modal answer — a smoothed population average — not a forward draw from
this specific person's specific committed life. It is a gestalt with no lived process behind
it (W4). Worse, the "forward context" you feed it is sparse, so the LLM fills the gap from
its training prior, which is exactly a population posterior. So the leaf is W4-fabrication
wearing a forward-context costume.*

**This objection is partly correct and I concede the part that is.** Two honest concessions:

1. **For the nature vector `N`, the objection is decisive** — which is *why this candidate
   does not use the LLM for `N`* (§2). An LLM personality draw *would* be a population
   posterior with no auditable joint distribution. Conceded fully; the tree owns `N`.

2. **For texture `T`, the objection is real but bounded, and the bound is the defense.** The
   LLM's prior *is* a population posterior over language. But texture is **only** the
   prose-read surface — by the project's own §4 partition, texture **never** decides
   behavior. A modal grandmother-dish does not bend any cause, does not move any NT value,
   does not change any availability or outcome. It is, definitionally, the layer where "the
   smoothed average" does the *least* harm, because nothing causal reads it. And the harm it
   *can* do — blandness, sameyness — is a **believability** problem (§4 of the doc), the
   right target, addressed by (a) conditioning richly on the specific committed antecedents
   so the modal answer is pushed off-mode by *this* person's specifics, and (b) the
   no-text-reuse discipline catching cross-character repetition.

**Where I do not get to hide:** the objection's deepest form is that **texture-without-lived-
process is still a gestalt** — the LLM did not *live* the grandmother's life to know her dish;
it pattern-matched. That is true. The defense is the §3.3 memoization argument plus the
partition: the *causal structure* of the world lives entirely in `N` and the event log (both
forward-caused, tree-drawn, auditable); `T` is a **rendering** of that structure into lived
language, conditioned forward, behavior-inert. A rendering of forward-caused structure into
prose is not a causal claim about the world — it is the prose layer doing its job. The world
is real in its `N`/event-log skeleton; the LLM clothes it. **If you accept that the prose
layer may use an LLM at all (which §4 already grants), then the frozen forward-conditioned
texture call is the disciplined form of exactly that grant.**

---

## 7. Single biggest weakness (the most honest thing in this doc)

**The candidate does not produce the behavior-relevant nature vector — it punts it to the
tree, and the tree is itself unbuilt and underspecified.** The crux question's hardest half
("what produces full-fidelity, *coherent, forward-caused* people *and their acts*") is the
**acts**, and acts are behavior — `N` running the §5 primitive forward through a generated
history. The LLM-at-leaves cleanly handles *texture* and cleanly *refuses* behavior, which is
correct discipline, but it means **this candidate, alone, answers only the texture half of
the OPEN frontier.** The behavior generator (the tree in the offline regime, running the
primitive forward to lay down a history of acts) is assumed here and not designed.

There is a second, sharper weakness hiding inside that: even granting the tree owns `N`, **a
generated *history of acts* is not obviously a tree draw** — it is a forward run of the
behavior primitive over time, and whether *that* engine is a tree, a hand-written policy, or
itself an LLM-in-the-control-loop (forbidden, §9 / the "LLM is an oracle at the leaves, never
the control loop" rule) is unresolved. The frozen-LLM-at-leaves design is **silent on the
control loop**, which is exactly where the project's hardest invariant lives. So the candidate
is *correct where it speaks and silent where the problem is hardest*. That silence is its
honest limit.

---

## 8. Summary table

| Concern | This candidate's answer |
|---|---|
| Behavior-relevant nature `N` | **Tree (CART), not LLM.** Auditable joint draw, honors divergence budget. |
| Texture `T` | **Frozen LLM**, conditioned on `N` + forward context only. |
| Forward-only conditioning | Pure context-assembler over event-log `date<t` + upstream DAG; **no outcome token in schema** → posterior unsayable. |
| Memoization vs. causation | Cache key = causal context; freeze = replay of a forward evaluation. Determinism ≠ acausality (same logic as seeded PRNG). |
| W7 (seed-eval) avoided? | Yes — conditioned on `t` (forward moment), not on the act of looking; recall-time backward reach goes to the L, not a fresh call. |
| W2/W4 (thin/gestalt) avoided? | For `N`: avoided by *not using the LLM*. For `T`: bounded because texture is behavior-inert; deepest gestalt objection conceded as a rendering, not a causal claim. |
| `N`/`T` incoherence | Impossible: `N → T` one-directional; `T` validated against committed facts. |
| Does it survive? | **Yes for texture; refuses behavior (correctly); silent on the control loop (its limit).** |

**Bottom line:** frozen-LLM-at-leaves is genuine forward generation *for the textural layer*,
and the memoization argument defends it rigorously. It is *not* a complete answer to the OPEN
generator question, because it deliberately and correctly declines to produce behavior — and
the hardest part of the frontier is behavior. The candidate's contribution is a precise,
buildable, enforceable firewall (`N` from trees, `T` from frozen LLM, one-way `N→T`,
causes-only context schema) that makes the LLM's use legitimate exactly where it is
legitimate and forbids it exactly where it would become fabrication.
