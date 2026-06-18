# Candidate: SUBTRACT — one primitive, no LLM in the causal layer

**Frame:** Minimize. Find the single primitive that dissolves the special cases. Fewest
moving parts. Push hard on eliminating the LLM from the causal (behavior-relevant) layer.

**Verdict up front:** The generator is **one function applied once per act, in forward
time, seeded.** Everything in the doc — the t=0 draw, the recursion, the leaf distribution,
the whole "deep generator" — is *the same function viewed at different distances* (§5 says
this; I take it literally and refuse to add anything on top of it). The **LLM is eliminated
from the causal layer entirely** and survives only as a build-time, frozen, read-only paint
pass over already-determined structure — and even there it is *optional*, not load-bearing.
The nature vector is produced by the primitive; texture is a deterministic projection of the
nature vector that the LLM may *decorate* but never *author*.

---

## 0. The elimination argument (why one primitive is enough)

The doc enumerates many apparent objects: a t=0 axiom draw, a CART joint-prior tree, an
agent behavior model, a recursion, an L retrofit, a divergence budget, a coverage dial. Under
the SUBTRACT frame the question is: **which of these are genuinely distinct mechanisms, and
which are the same mechanism wearing different clothes?**

§5 already answers most of it: *"the behavior model, the leaf distribution, and the deep
generator are the same object viewed at different distances."* I treat that as the load-
bearing claim and collapse everything to it. The result:

- **The recursion** is not a separate thing — it is the primitive run repeatedly.
- **The "leaf distribution" / CART tree** is not a separate generator — it is the *input
  distribution* to the primitive, i.e. part of the primitive's signature.
- **The t=0 draw** is not a separate generator — it is the *same primitive* with an empty
  causal context (no prior acts to condition on). t=0 is not a different mechanism; it is
  the base case of the one recursion, where the "situation" argument is the bare world axioms
  rather than prior acts.
- **The L** is not a generator at all — it is the *same primitive* invoked with a flag set
  and a consistency constraint added (see §6). It produces a person identically; only its
  *bookkeeping* differs.

So the irreducible core is exactly one function. The special cases stop being special when
you stop modeling them as cases.

---

## 1. The one primitive

```
act = STEP(actor_nature, situation, rng) -> (act_effects, newly_revealed_natures)
```

Read it as: **a nature, placed in a situation, does one thing, seeded.** This is §5's
behavior model, with one deliberate addition that lets it carry the *whole* design: STEP may
**reveal** natures it needed but that were not yet laid down.

- `actor_nature` — the behavior-relevant vector of whoever is acting (§4's "nature vector").
- `situation` — the local causal context: who/what is present, the world state at this
  time-step, the era/cell parameters. This is the *only* place causes enter.
- `rng` — a child of the seeded PRNG, keyed by `(actor_id, time, act_index)` so the draw is
  reproducible and order-stable (the splitmix32 stream discipline already in the repo;
  reserve a fifth stream `lifeRng` derived from the master seed, appended last so existing
  streams don't shift).
- `act_effects` — the dated, participant-bearing, NT-stampable event the act produces. This
  is what gets written to the event log (`events.js` shape) and is what memory reads.
- `newly_revealed_natures` — when STEP needs an actor that the forward pass has not yet laid
  down (a parent who must act in the protagonist's childhood but was never generated), STEP
  **draws that nature now, forward, from the situation it is being introduced into.** This is
  not a second mechanism; it is STEP calling itself with an empty act-history for the new
  actor (the t=0 base case, but at t>0 — and that distinction is exactly what §4/§7 police;
  see §3 and §6 below).

**That is the entire generator.** No separate ancestry generator, no separate chargen, no
separate evaluator. The whole world is `STEP` iterated forward from t=0.

### The nature vector

A nature is a **fixed-width vector of behavior-relevant parameters the existing sim already
consumes**: the NT baselines and drift rates, the personality parameters that feed
`effectiveInertia()`, the GenderIdentity / AttractionProfile axes, constitutional condition
flags, and the sentiment-capacity parameters. **Crucially, a nature has no free-floating
"backstory" slots.** It is *only* the numbers the simulation math reads. Everything else
about a person (what their house smelled like, the dish they made) is **texture**, produced
downstream (§2), never stored in the nature vector. This is the single biggest subtraction:
*there is no "rich person" object distinct from the nature vector plus the act log.*

This directly answers the doc's coherence worry (§4b, W3): a nature is drawn as **one joint
vector**, never as independent marginals, so it cannot be a Frankenstein. And it answers W4
("rich coherent person IS the residue of their history"): the person's *richness* is not in
the vector — it is in **the act log STEP produced**, which IS their history. A nature vector
+ its forward act log *is* the whole person, at full fidelity, with no summary anywhere.

---

## 2. Where the nature vector comes from, and where texture comes from

### Nature vector: the conditional joint prior (CART, baked offline)

A nature is drawn from `P(nature | cell, parent_natures, situation)`. This is the doc's §4
CART tree, reused from the habit machinery in the offline-baked regime. It is a **part of
STEP's signature, not a separate generator** — STEP, when it must introduce an actor, calls
the prior to draw that actor's nature jointly (capturing the dependence structure that
defends against Frankensteins).

The prior is **baked at build time** from grounded population data (the only legitimate use
of statistics per CLAUDE.md: grounding the *cell-conditional joint*, not setting an
individual's experience). At runtime it is a frozen, pure lookup consuming `lifeRng` — **no
inference, no Math.random, deterministic.** This is what survives of "LLM at leaves" on the
*behavior* side: **nothing.** The behavior-relevant draw is a seeded lookup against a baked
tree. No LLM touches a number the sim math reads.

### Texture: a deterministic projection, optionally LLM-decorated

Texture (the smell of the house, the way a name was said) is produced by:

```
texture = REALIZE(act_effects, actor_nature, cell, cosmeticRng)
```

`REALIZE` is the *same kind of function as the existing `senses.js realize()`* — a
deterministic, `cosmeticRng`-driven projection from already-determined structure to prose
specifics. It consumes the **already-drawn** nature vector and act; it adds **no new
behavior-relevant information.** Texture is therefore *causally downstream of and fully
determined by* the nature + act + cell, exactly as `perceivedPresentation()` is derived, not
stored.

**This is the elimination of the divergence problem the prompt asks about.** The nature
vector and the texture *cannot diverge into an incoherent person*, because texture is a pure
function of the nature vector — it is a *readout*, not a parallel draw. There is no second
generative process to fall out of sync. (Contrast a design where the LLM independently
generates texture: there, texture and structure are two draws that can contradict. By making
texture a projection, the contradiction is unsayable.)

**Where, if anywhere, the LLM sits.** The LLM is allowed *only* as an offline, frozen
expansion of `REALIZE`'s output — turning the structured texture token ("comfort dish,
working-class, coastal, 1970s") into a specific frozen string ("fish stew, too much pepper,
the pot she never washed"). It is build-time, cached, deterministic on replay, and **strictly
downstream of the structured texture token.** It authors *no* token the projection didn't
already determine; it only renders a determined slot into prose. Under the SUBTRACT frame
this LLM use is **optional** — a frozen hand-authored or template-expanded lexical pool fills
the same slot. The architecture does not depend on it. So:

> **Frozen-LLM-at-leaves SURVIVES, but demoted: it is a non-load-bearing prose-rendering
> nicety over a fully-determined texture slot, eliminable without changing the simulation.
> It is removed from the causal layer entirely.**

---

## 3. How it stays forward-caused (and avoids thinness with minimal machinery)

- **Forward-only:** STEP only ever reads `situation` (causes already laid down before this
  time-step) and writes `act_effects` (an effect at this time-step). It has no access to the
  future and no "target" argument. There is no posterior anywhere because **STEP's signature
  has no slot for a demanded outcome.** This is self-binding by construction (§8): the control
  surface is `situation` (causes) only; the type system has no token for an effect. Steering =
  biasing the `cell` / `situation` parameters fed to the prior, bounded by a divergence budget
  applied to the prior draw. You cannot clamp because there is no clamp argument.

- **t=0 as the base case, not a special generator:** the t=0 population is `STEP`'s prior
  drawn with empty act-history and the bare world axioms as `situation`. Acausal *only*
  because nothing precedes it — the base case of the one recursion.

- **No thinness, minimal machinery:** thinness is impossible because **there is no thin
  representation in the type system.** A person is `nature_vector + act_log`. The nature
  vector is full-width always (you can't draw "half a nature"). The act log is however long
  the forward pass made it. A person the forward pass barely touched has a *short act log* —
  that is **partial coverage, not thin fidelity** (§3's partial≠thin, enforced structurally:
  shortness of history ≠ summary of a person). There is no LOD field, no resolution dial, no
  summary object to even express W2/W3/W4. The wrong turns are unsayable because the data
  model has no slot for them.

- **Coverage is laziness in *calling* STEP, nothing more:** the forward pass calls STEP for
  the actors and time-steps the run actually exercises. Coverage is "which STEP calls happen,"
  full stop. There is no fidelity knob to also tune. One dial, and it is just call-or-not.

---

## 4. The L, with the same primitive

A backward reach into un-laid-down past (a present cue names a grandmother the forward pass
never covered) is handled by **the same STEP**, invoked with:

1. the `situation` reconstructed from committed facts (who she must be consistent with), and
2. an added **consistency constraint** on the prior draw (reject-free: condition the joint
   prior on the committed facts, do *not* resample-to-taste), and
3. a **flag** written to the event/debt log marking the produced person as an L retrofit.

She comes out full-fidelity (nature vector + a back-filled act log) — identical machinery,
identical width. What differs is *only* the flag and the fact that her acausality is a marked
debt rather than a t=0 given. **The L is not a fifth mechanism; it is STEP + a flag + a
consistency-conditioned prior.** This is the maximal subtraction: even the "last resort" is
the one primitive.

(Open, per §7: the consistency-conditioning must not slide into posterior-fitting. The guard
is that L conditions only on *already-committed external facts* about the retrofit's
interface — the recorded interactions, W6's bounded causal interface — never on a demanded
outcome for the retrofit herself. Her interior is still a forward-style prior draw; only her
*interface* to committed people is constrained.)

---

## 5. What this buys, concretely (buildable path)

1. Reserve `lifeRng` as the fifth splitmix32 stream (append last). Bump save version.
2. Define `Nature` = the existing behavior-relevant parameter set (NT baselines/drifts,
   personality, identity axes, constitutional flags, sentiment capacities) as one fixed
   struct in `types.d.ts`. **No backstory fields.**
3. Bake the conditional joint prior as a CART tree (reuse habit machinery, offline regime)
   over grounded cell data → `drawNature(cell, parents, situation, lifeRng)`.
4. Implement `STEP(actor, situation, rng)` → writes an `events.js`-shaped act; calls
   `drawNature` when it must introduce an unlaid actor.
5. Run STEP forward from a t=0 boundary. The existing single-protagonist loop becomes the
   degenerate config: one node, player policy, present time-resolution (§2's "same system").
6. `REALIZE(act, nature, cell, cosmeticRng)` → texture token → (optional, frozen) LLM/pool
   expansion → prose. Mirrors `senses.js`.
7. The L = `STEP` with a consistency-conditioned prior + a debt-log flag.

Everything reuses an existing repo mechanism (CART, the stream discipline, `realize()`, the
event log, the NT engine for stamps). **No new subsystem is introduced — the generator is
the existing engine generalized, plus one tree.**

---

## 6. Does build-time-frozen LLM generation count as genuine simulation? (the crux)

**Under the SUBTRACT frame: it does not need to, because the LLM is not in the causal layer
at all.** The crux question dissolves rather than gets answered, which is the point of the
frame. Restated:

- The behavior-relevant nature vector is produced by a **seeded draw from a baked joint
  prior** — a deterministic stochastic forward process. That *is* genuine forward causation
  in the doc's sense: a value drawn at the live moment from causes already laid down, once,
  never reversed. No LLM.
- Texture is a **deterministic projection** of that vector. Whether an LLM renders the final
  prose string is a *display* concern, frozen and replay-safe, and removable. A frozen LLM
  string is no more "fabrication" than a frozen hand-written prose pool is — both are paint on
  a determined skeleton, neither authors a behavior-relevant fact.

So the dangerous reading the project fears — *the LLM gestalt-implies a whole person* (W4's
"LLM-implied gestalt") — is **structurally prevented**: the LLM is never asked to produce a
person, a nature, or an act. It is handed a fully-determined texture slot and asked only to
phrase it. **If the LLM were deleted, every behavior-relevant fact and every causal relation
in the world would be unchanged.** That is the test of whether it's in the causal layer, and
it passes: it is not.

---

## 7. Single biggest weakness (stated honestly)

**The entire design rests on `STEP` being a *real, rich* behavior model — and SUBTRACT does
not tell you how to build that; it only tells you everything else is the same thing as it.**
The frame's strength (collapse all special cases into one primitive) is also its exposure: I
have pushed *all* the difficulty into a single function and the baked joint prior behind it.
If `drawNature` + `STEP` are not genuinely rich enough to produce coherent forward-caused
people, the minimalism becomes a *liability* — there is no second mechanism to lean on, no
LLM in the loop to paper over a thin prior, no resolution dial to "fill in later." A weak
prior produces bland people and the design has deliberately removed every escape hatch that
W1–W8 reach for. So the SUBTRACT design is **only as good as the baked CART joint prior and
the STEP transition** — and whether a CART tree over grounded cells is expressive enough to
draw genuinely coherent joint natures (vs. degrading toward sophisticated marginals at the
leaves) is **unverified and is the real open risk.** The compute-cost question (§9, never
measured) lands here too: a rich enough STEP run forward from t=0 may be expensive, and I have
removed the cheap-summary fallbacks on purpose. This frame bets that fidelity is non-
negotiable and tractability must be solved honestly (measure it; §9) — it does not hedge.
