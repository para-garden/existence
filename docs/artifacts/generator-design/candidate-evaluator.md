# Candidate: INVERT THE DEPENDENCY — LLM as Evaluator, never Generator

*Foundational-architecture candidate for the "what produces forward-caused, full-fidelity
people and acts" frontier (§9 OPEN). Frame: flip the LLM from generator to
likelihood-oracle / critic. A cheap seeded stochastic process PROPOSES people and acts
forward from causes; the LLM, build-time and frozen, only SCORES plausibility. The artifact
is never produced by the LLM — only judged by it.*

---

## 0. The one-sentence thesis

> **A generator can fabricate a posterior because it produces the artifact and can be
> conditioned on the demanded outcome. An evaluator cannot — it never produces anything; it
> only reports `p(this person | this context)` for an artifact some *other* process already
> drew. Move all generative authority into a cheap, dumb, seeded sampler whose only input is
> *causes already laid down*, and reduce the LLM to the thing it is actually good at and
> structurally incapable of misusing here: judging whether a draw reads as a genuine forward
> product of its context.**

This directly attacks the crux from the opposite side of the doc's assumption. §4 puts the
LLM at the leaves *as a painter of texture*. This candidate asks: what if the LLM paints
nothing, and the only question we ever ask it is *yes/no/score*?

---

## 1. Where the doc leaves the hole

§4 and §9 settle that:

- Trees/CART produce the **behavior-relevant nature vector** (the joint conditional draw).
- The LLM at the leaves produces **frozen texture only**.
- **OPEN:** what produces *forward-caused, coherent, full-fidelity people and acts* — and
  whether build-time-frozen LLM generation is genuine simulation or the rejected fabrication.

The hole is precisely in the word "produces." Two things are unaccounted for:

1. **Coherence (§4b).** Trees give a joint draw over a *fixed feature schema*. But a real
   person is not a fixed-length vector; the schema itself is the W2/W4 thinness risk. The
   moment you fix "the 40 features a person has," you have decided a person bottoms out in a
   finite spec — which §3 says realness never does. CART cannot tell you its own schema is too
   thin. Nothing in the §4 stack *judges* the result for joint coherence; it only *constructs*
   one and hopes the conditioning was rich enough.

2. **Texture–nature coherence (the prompt's explicit worry).** §4 hands the nature vector to
   trees and the texture to a generator-LLM. Nothing checks that the texture the LLM painted
   is *the texture this nature vector would actually produce*. A generator-LLM, handed a
   nature vector and asked for "the dish the grandmother made," will produce *a* plausible
   dish — but it is free to drift, because its objective is local fluency, not global
   consistency with the vector. The two artifacts can diverge into an incoherent person and
   **nothing in the §4 architecture is positioned to notice**, because the only LLM in the
   loop is the one that caused the drift.

The evaluator inversion is aimed squarely at both holes.

---

## 2. The architecture

Three components, strict role separation. **Build-time** = before any seed is fixed; outputs
hashed and frozen into a cache keyed by `(seed, call-index, context-hash)`. **Sim-time** =
deterministic, seeded, reads frozen cache only, never calls an LLM.

```
                      causes already laid down (context cell C)
                                     │
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  PROPOSER  (cheap, seeded, generative — the ONLY       │
        │  thing with generative authority)                      │
        │  · CART joint draw over nature dims (§4 trees)         │
        │  · seeded combinatorial/grammar draw over texture       │
        │    slots, sampled from cell-conditioned lexical pools  │
        │  · behavior primitive (§5) for acts                    │
        │  INPUT: only C (causes). NEVER a target outcome.        │
        └──────────────────────────────────────────────────────┘
                                     │  candidate person/act P_k
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  EVALUATOR  (LLM, build-time, frozen — ZERO            │
        │  generative authority)                                 │
        │  Returns a SCORE only. Forbidden from emitting any     │
        │  field, text, name, value, or suggestion.              │
        │  Three sub-scores, all framed as likelihood-under-C:   │
        │   (a) conditional plausibility  L_cond(P|C)            │
        │   (b) joint coherence           L_joint(P)             │
        │   (c) texture-nature coherence  L_tex(texture|nature)  │
        │  Output: scalar(s) in [0,1]. Nothing else.             │
        └──────────────────────────────────────────────────────┘
                                     │  score s_k
                                     ▼
        ┌──────────────────────────────────────────────────────┐
        │  ACCEPTOR  (pure, seeded, deterministic — no LLM)      │
        │  Accept/reject P_k by a FIXED rule against s_k and a   │
        │  seeded uniform draw. Budgeted. The rule is the same   │
        │  for every person; it does not see the demanded        │
        │  outcome because there is no demanded outcome.         │
        └──────────────────────────────────────────────────────┘
                                     │
                                     ▼
                       accepted person P*, laid down whole
```

### 2.1 Who produces the nature vector vs the texture

**Both are produced by the PROPOSER, never by the LLM.** This is the central commitment and
the answer to the prompt's "who produces what":

- **Nature vector** — CART joint draw conditioned on C (exactly §4's trees). Cheap, seeded,
  deterministic given seed.
- **Texture** — *also the proposer*, via seeded sampling from **cell-conditioned lexical /
  combinatorial pools** (the grandmother's dish drawn from a seeded weighted pick over a
  cuisine-pool selected by the cell's culture/era/region; the way a parent said your name
  drawn from a seeded grammar over a phonetic/affective pool). This is the same kind of
  seeded weighted-pick machinery `senses.js` / `cosmeticRng` already use, scaled up.

The LLM **never emits texture**. It only scores `L_tex(texture | nature)` — *does this dish,
this phrasing, this house-smell read as the texture THIS nature vector, in THIS cell, would
produce?* The generator-LLM of §4 is **replaced** for the production role and **retained
only as a critic** (see §6 on what survives).

This is the inversion's payoff on the coherence hole: the texture and the nature vector can
no longer silently diverge, because the *only* role the LLM plays is to reject divergence.
The thing that was the source of drift in §4 (a generator optimizing local fluency) is gone;
in its place is a thing whose entire job is to *catch* drift.

### 2.2 What the EVALUATOR is forbidden from doing

This list is the whole safety argument. The evaluator MAY NOT:

- emit any field, value, name, sentence, or fragment that ends up in the person;
- propose a "better" alternative ("this dish is implausible; try X") — that is generation
  wearing a critic's coat, and X would be an LLM-authored field;
- see, or be conditioned on, any *demanded outcome* for the descendant or the protagonist;
- be re-queried with a modified prompt that nudges toward a desired score (that is
  resample-to-taste applied to the critic);
- run at sim-time. It runs once, build-time, output frozen.

The evaluator's entire output surface is **a scalar in [0,1] per sub-score**. It is an
oracle for `L(P|C)`, nothing more. An oracle that can only return a number for an artifact it
did not make cannot fabricate a posterior, because it has no artifact-producing channel to
fabricate *through*.

---

## 3. Forward-causation: how it holds

The proposer's **only input is C = the causes already laid down before this person on the
forward pass**. There is no path for a descendant or a demanded protagonist trait to enter
the proposer's input. Forward-causation therefore holds *in the proposer* by the same
argument the doc already accepts for any prior-forward draw (§6): the draw is a function of
already-materialized causes and the seed, full stop.

The evaluator does **not** participate in causation at all — and this is important. It is not
a cause of P; it is a *filter on the sampler's output distribution*. Causally, the evaluator
sits exactly where a `while (!accepted)` loop sits around any rejection sampler: it changes
*which* prior draws survive, not *what the prior is conditioned on*. The conditioning — the
causal content — is entirely in the proposer's input C. (See §5 for the critical proof that
this filtering is sampling-from-the-prior, not posterior-fitting.)

The behavior primitive (§5) for acts is likewise proposer-side: an agent acts on another from
nature + situation, both already laid down. The evaluator scores "does this act read as in-
character given this nature and situation," never "make the act come out this way."

**t=0 (§4) is unchanged:** the t=0 population is the proposer's acausal axiom draw (legit;
nothing precedes it). The evaluator may score t=0 draws for believability (§4a–c) — that is
its *ideal* use, because at t=0 there is no descendant to leak, so the critic is provably only
judging conditional plausibility, never posterior consistency.

**The L (§7) is unchanged and orthogonal:** a backward reach into un-laid-down past is still
the L, drawn by the proposer (consistent with committed facts), scored by the evaluator,
logged as debt. The inversion neither adds nor removes Ls; it only changes *who writes the
person* (proposer, never the critic).

---

## 4. Thinness (W2/W3/W4): does evaluation escape it?

**This is where the inversion genuinely helps, and it must be argued carefully.**

The thinness traps are all about *the richness of what gets generated*. The doc's worry with
the §4 stack is implicit but real: **CART draws over a fixed feature schema, and a fixed
schema is a finite spec — exactly the thing §3 says a real person never bottoms out in.**
Nothing in the generate-only stack can detect that its own schema is too coarse, because a
generator has no notion of "is this thin"; it just fills the schema it was given.

An **evaluator changes this**, because thinness is *detectable as low joint-coherence /
low conditional-plausibility under a model that has seen real richness*. Concretely:

- A proposer that draws each nature dim independently produces a Frankenstein agent (§4b).
  The CART joint draw mitigates this *within its schema*, but cross-feature absurdities and
  schema-gaps slip through. **`L_joint(P)` catches them**: the LLM critic, trained on
  real human descriptions, scores a jointly-absurd configuration low even when every marginal
  is fine. The proposer is forced (via the acceptor) to keep drawing until it lands a
  *jointly* coherent person.
- A texture drawn from a pool that doesn't fit the nature vector reads thin/generic.
  **`L_tex` catches it.** Generic texture ("a nice meal," "kind words") scores low against a
  critic that knows what *specific, this-person* texture looks like.

So the inversion's thinness defense is: **the proposer can be cheap and even somewhat thin,
because the evaluator is a richness *gate*.** The combined system's fidelity floor is set by
*the critic's discrimination*, not by the proposer's expressiveness. This is the opposite of
W3's thin-then-fill: nothing is filled coarse-then-refined; rather, thin draws are *rejected*
and only rich, coherent draws survive. Coverage stays partial; everything laid down passed a
full-fidelity bar.

**But — the honest limit (this is real).** An evaluator can only *reject* thinness it can
*see*. It cannot manufacture richness the proposer never proposed. If the proposer's schema
has no slot for "the specific way grief sat in this person's posture," the evaluator can
never reward a draw for having it, because no draw has it. **The evaluator raises the floor to
the proposer's ceiling; it cannot raise the ceiling.** So the schema-thinness of W2/W4 is
*mitigated but not eliminated*: a fixed-schema proposer + critic produces people who are
maximally-coherent-within-the-schema, which reads far better than raw CART, but still bottoms
out at the schema. **This candidate does not fully escape W2/W4 — it converts a
*coherence* failure (which the critic fixes) and bounds a *schema-richness* failure (which it
only caps).** To actually reach §3's unbounded depth, the proposer's pools/schema must be
extensible and the critic must be the thing that tells you *when* coverage has reached for a
dimension the schema lacks (a low score with no acceptable draw available is a signal to
*extend the schema for that cell*, build-time — not a license to dial fidelity at sim-time).

---

## 5. The hard question: is "resample until the critic passes" a forbidden posterior-fit?

The prompt demands honesty here, and it is the load-bearing argument. Guard-2 (§8) forbids
resample-to-taste; W8 forbids re-simulation-as-posterior-fit. Does accept/reject on a critic
verdict violate either?

**The answer hinges on one distinction, and the design lives or dies on getting it right:**

> **Rejection sampling against `L(P | C)` — a likelihood that conditions ONLY on upstream
> causes — is a *valid sampler for the prior itself*. Rejection sampling against any criterion
> that conditions on a DEMANDED OUTCOME is posterior-fitting / save-scumming.**

Why the first is legitimate: standard rejection sampling is a textbook way to draw from a
target distribution `π` using a proposal `q` — you accept with probability `∝ π/q`. If the
proposal `q` is the cheap CART+pool draw and the target `π` is *"a believable forward product
of C"* (= the conditional-plausibility × joint-coherence density the critic estimates), then
accept/reject against the critic is **literally sampling from the believable-prior we wanted
all along.** The critic is an estimator of the prior's density; rejection against it
*corrects the cheap proposer toward the true prior*. No outcome is being targeted — the
"target" is the prior distribution conditioned on causes, which is exactly what §6 says we
must draw from. **This is not save-scumming; it is the seeded draw, done correctly.**

Why the second is forbidden: the moment the acceptance criterion can see a demanded
descendant or a demanded protagonist trait — "accept only if this person explains that the
protagonist became withdrawn" — the rejection loop is no longer sampling the prior; it is
sampling the *posterior given the demanded effect*. That is W1 by rejection. The contortion
re-enters not through a generator but through the *filter*.

**So the design's safety reduces to a single enforceable invariant:**

> **The evaluator's prompt and the acceptor's rule are functions of `C` (upstream causes) and
> the candidate `P` ONLY. Neither may take a descendant, a protagonist target, or any
> downstream/demanded outcome as an argument. This is checkable by inspecting the
> evaluator's input signature — it is a *type-level* constraint, not a discipline.**

This is the §8 "implausible configurations are unsayable" principle applied to the critic:
make the critic's input *unable to express* a demanded outcome, and posterior-fit-by-rejection
becomes literally unsayable. Self-binding by construction, not by willpower.

**Three further guards, all required, none sufficient alone:**

1. **Seeded acceptance, bounded retries.** Acceptance uses a seeded uniform (`Timeline`
   stream), so the accept/reject *sequence is deterministic and replayable*. Retries are
   capped at a budget `R`. This makes the loop a deterministic function of the seed — not an
   author re-rolling at will. If `R` is exhausted, you take the **best-scored draw so far**
   (NOT keep going until you like it) — which is "the draw stands" (Guard-2), just with the
   proposer corrected toward the prior. Crucially: *exhausting `R` and taking the best is
   committing to a draw*, the opposite of resample-to-taste.

2. **The divergence budget (§8 Guard-1) bounds the rejection rate, not just the tilt.** A
   high rejection rate means the cheap proposer is far from the critic's prior — fine — *but*
   if acceptance also correlates with any steering influence, the KL-style budget must count
   it. Rejection sampling that systematically favors influenced-region draws is influence
   *laundered through the filter*; the budget must measure post-acceptance divergence from the
   *unsteered* prior, not pre-acceptance. (OPEN: the exact metric — see §8.)

3. **No prompt-nudging the critic.** The critic prompt is fixed build-time and hashed. You may
   not re-query with "be more lenient" to push a draw through. That is resample-to-taste
   aimed at the oracle instead of the artifact, and it is closed off by freezing+hashing the
   prompt.

**Verdict on the hard question:** Resample-on-critic-verdict is **NOT** a posterior-fit *iff*
the critic conditions only on upstream causes and the loop is seeded+bounded. It **IS** a
posterior-fit the instant the critic can see a demanded outcome. The design makes the safe
case structurally enforced (input-signature constraint) and the unsafe case unsayable
(no outcome token in the critic's input). **This is the same trick §8 uses for the author's
control surface, transplanted onto the critic's input surface.**

---

## 6. What survives: generator-at-leaves, evaluator, or both?

**Frozen-LLM-as-generator (§4) does NOT survive as the producer of texture.** Its production
role is removed: the proposer (seeded pools) produces texture, the critic only scores it.
This is a real change to §4, and it is the point of the inversion — a generator's freedom to
drift is exactly the divergence hole in §1.2.

**Frozen-LLM-as-evaluator is the new occupant of the leaf.** It is *still* "the LLM at the
leaves, build-time, frozen" (§4's standing rule) — same position, same freezing, opposite
verb. The rule "LLM is an oracle at the leaves, never the control loop" is honored *more*
faithfully by an evaluator than by a generator: an oracle that returns a likelihood is the
most literal possible reading of "oracle," and a scalar-only output is maximally outside the
control loop.

**Could both coexist?** Yes, and it may be the strongest config: a generator-LLM proposes
texture *as one proposer among several*, and the evaluator-LLM gates it under the *same*
causes-only critic. This recovers the generator's richness (it can paint specifics the seeded
pools lack — addressing the §4 ceiling) while closing the drift hole (the critic rejects
texture that doesn't cohere with the nature vector). **But this reintroduces an LLM with a
production channel**, so it must obey the same input-signature constraint: the generator-LLM,
like the proposer, sees only C, never a demanded outcome. If that holds, generator+evaluator
is a strictly richer proposer feeding the same safe gate. **Recommendation: build evaluator-
only first (provably safe, cheap proposer), and admit a generator-proposer later only behind
the same causes-only type constraint.**

---

## 7. Concrete build (first cut, buildable)

Determinism contract: everything below is a pure function of `(masterSeed, callIndex,
contextHash)`; LLM calls happen at a **build/bake step** and write a frozen cache file
checked into the run. Sim-time reads the cache; a cache miss at sim-time is a hard error
(it would mean an unbaked path — never an on-the-fly LLM call).

1. **Proposer.** Reuse CART (`habits.md` machinery, offline-baked regime per §4) for the
   nature joint draw conditioned on cell C. Reuse `cosmeticRng` weighted-pick over
   cell-conditioned lexical pools for texture slots. Acts via the behavior primitive (§5).
   All seeded via `Timeline.charRng` (chargen stream) so changing this never breaks gameplay
   replay (per the multi-stream rule).

2. **Evaluator bake step.** For each proposed candidate `P_k`, format a fixed prompt:
   `{cell C, candidate P_k}` → ask for three scalars `(L_cond, L_joint, L_tex)`. Input
   signature *literally has no field for a descendant or target* (enforced by the prompt
   builder's type). Cache `(seed, callIndex, contextHash) → (s_k, P_k)`.

3. **Acceptor.** `s_k = w·[L_cond, L_joint, L_tex]` (fixed weights). Accept if
   `seededUniform() < s_k`, else retry up to `R`. On exhaustion, take `argmax_k s_k`. Fully
   seeded → replayable. Log rejection count + final score per person (feeds the divergence
   budget and is a diagnostic for schema-thinness in a cell).

4. **t=0.** Same proposer+evaluator, no descendant exists → critic provably judges only
   §4a–c. This is the cleanest place to validate the whole loop.

5. **Output.** Accepted `P*` laid down whole into the event-log spine (`events.js` shape,
   per §2 / `memory.md` Stage 1). Nature vector → sim math; texture → prose. They are
   coherent *because the critic rejected incoherent pairs*, which is the §1.2 hole closed.

---

## 8. Open / unresolved (honest)

- **The divergence-metric for post-acceptance influence** (§5 guard 2). Measuring KL between
  accepted distribution and unsteered prior requires estimating both — the critic gives a
  density estimate but a usable budget metric is unspecified. OPEN, inherited from §8.
- **Critic calibration.** `L(P|C)` is an LLM's *estimate* of a likelihood, not a true one. A
  miscalibrated critic that systematically over-scores generic draws *reintroduces thinness it
  was meant to gate*. The critic must be validated against held-out real-person descriptions
  (the "validate against reality / tests are the spec" ecosystem principle) — its
  discrimination is the system's fidelity floor and is currently unmeasured.
- **Schema-richness ceiling** (§4 honest limit). The critic caps but does not eliminate W2/W4
  schema-thinness. Reaching §3's unbounded depth needs an extensible proposer schema with the
  critic signaling *when* a cell needs a new dimension — mechanism unspecified.
- **Compute cost** of the bake step (one+ LLM calls per accepted person × rejection budget ×
  coverage). The doc's §9 "measure, don't guess" applies directly here and harder — rejection
  multiplies the call count.

---

## 9. One-line placement against the doc

The inversion **replaces §4's generator-at-leaves with evaluator-at-leaves**, keeps everything
else (§2 same-system, §3 coverage-not-fidelity, §6 prior-forward, §7 the L, §8 self-binding)
**unchanged**, and contributes one new structural safety result: *rejection sampling against a
causes-only critic is sampling-the-prior, not posterior-fitting — provided the critic's input
signature cannot express a demanded outcome.* That type-level constraint is §8's "unsayable"
principle applied to the critic. The biggest thing it does **not** solve is the
schema-richness ceiling: an evaluator raises the fidelity floor to the proposer's ceiling but
cannot lift the ceiling.
