# docs/design/simulated-life.md

Design **direction** for the generative simulated-life / world substrate — the layer
that produces a character's past, their ancestry, and the people around them as outputs
of a real social simulation rather than authored backstory.

**This is a vision/direction document, not an implementation spec, and almost none of it
is built.** Today the only piece of this substrate that exists is **memory Stage 0** (the
in-run encoding/recall mechanism — see `memory.md`, "Stage 0 — Implementation Spec"). The
backstory generator is still legends-compression (`chargen.js` `lifeEventDefs`, ~7
`charRng` calls of abstract `financial_impact`). Everything below describes the
aspirational architecture this repo is building *toward*: a large, multi-phase direction,
not an imminent build. Where a question was left open in the design conversation, it is
marked **OPEN** below and must be read as open — do not implement past what is settled.

This doc captures not just the conclusions but the **reasoning** and the **corrections**
that produced them. The corrections are load-bearing: the system degrades to fabrication
the moment any of them is dropped.

Cross-references: `memory.md` (the primary consumer — memory reads the event log this
simulation writes), `npc-simulation.md` (NPCs as dynamic-resolution agents),
`emotions.md` (the sentiment system), `someday.md` and the backstory generator (the thin
present state of the life-sim that this direction grows), `nt-baseline.md` (the
neurochemistry engine that supplies encoding stamps), `habits.md` (the CART machinery
reused here in a different regime). `overview.md` for the project's "the world is real /
emergence not flags / nothing arbitrary" cluster, which this doc sits underneath.

**Citations:** the claims here are almost entirely *architectural*, not empirical, so
there is little to cite. Where an empirical claim appears it follows the repo rule — a
retrievable ID or an explicit `unverified` mark. Never invent or guess an ID.

---

## 1. The core reframe — the world is the event source

The events that matter in a life are **not** under the character's (or the player's)
control. A parent's coldness. A relative's death. How a teacher, a sibling, a stranger
behaved toward you. None of these are things the protagonist authored. What a person
authors is only their own **responses** — and even those are constrained (this is the
project's whole premise: power anti-fantasy, constrained agency without judgment).

Therefore a life's **formative events come from the world**: other people, simulated as
agents with their own natures, behaving autonomously, plus circumstance (economy,
geography, era, luck). **A life is what the surrounding world did to and around the
character.** The character is the thread; the world is the loom.

This is not a new principle — it is the existing ones taken seriously:

- *"The world is real."* Behavior is derived from parameters; the world is not a backdrop
  arranged for the protagonist.
- *"NPCs are simulated at dynamic resolution — never zero."* Every person has an interior
  life and acts from it. If the people around a character are real agents, then the
  character's past is **whatever those agents did** — which is exactly what "formative
  events come from the world" means.

The protagonist is not the cause of their own formation. The world is.

---

## 2. No separate backstory system — one continuous simulation

There is **no "backstory generator" distinct from the game.** That framing is the error
this section corrects. There is **ONE continuous multi-agent simulation of a social
world**, and the character's life is one thread running through it.

"Chargen" is therefore not *authoring a character*. It is **running that world up to the
present and handing the player control of one agent already inside it.** Past and present
are the **same simulation**; the only thing that changes at game-start is **who controls
the protagonist**. Before the handoff, the protagonist's agent was driven by the same
nature-driven process as everyone else; after it, a human drives that one agent.

Memory (see `memory.md`) does not need its own private history store. It just **reads the
event log this simulation has been writing the whole time.** The "latent ground-truth
life" that `memory.md` §3 depends on *is* this simulation's output. Memory is a
read-projection; this substrate is what it reads.

**The engine relationship (DECIDED: same system).** The apparent asymmetry between the
present-tense engine and the past-generating engine is **not** two engines — it is **one
engine run at different settings.** This is **forced** by the one-timeline / no-seam
commitment: if game-start has no seam, the present cannot be a *different engine* from the
past, because a seam between engines *is* a seam in the timeline. The unification:

> **One multi-agent engine; every agent driven by the behavior primitive (§5); the PLAYER
> is a policy injected into exactly one node, from game-start onward.**

The "differences" people reach for are all **parameters of the one engine**, not separate
engines:

- **Time resolution** (minutes in the present, life-phases in the past) — a **parameter.**
  `advanceTime` already takes any step, and a long sleep is already one coarse jump with
  reduced per-step detail. Coarse past time is the same dial turned further.
- **Agent resolution** (protagonist maxed, others dynamic) — already the **NPC
  dynamic-resolution principle.** The protagonist is **not engine-privileged**; it is just
  max-resolution + player-controlled. In childhood the protagonist may be the
  **low-resolution** node while the parents are the high-resolution actors.
- **Who drives the protagonist** (behavior primitive vs. human) — the **single irreducible
  swap**: one slot. Before game-start the protagonist's node runs the behavior primitive;
  from game-start a human policy is bolted onto that one node.

So **present = past continued with a human policy bolted onto one node.** There is no second
engine; there is one engine and a swappable policy slot.

> **GUARD (added on retraction — read with §3, §9, §10).** The word *"resolution"* above is
> load-bearing and easy to misread. Two of these "resolutions" are legitimate parameters;
> one phrase is **refuted.** *Time resolution* (step size) is a real parameter — but a coarse
> time-step still lays down **whole people** where it touches them (coarse-time ≠
> coarse-person). *"Agent resolution → the protagonist may be a **low-resolution node**"* is
> **WRONG** if read as a *fidelity* dial (that is W3, §10): there is **no low-fidelity
> person.** The legitimate reading is **COVERAGE** (§3): in childhood the parents are the
> *covered, acting* nodes and the protagonist is mostly *acted upon* — but everyone who is
> generated is generated **whole.** "Dynamic resolution / never to zero" survives as a
> coverage statement; "thin background agent" does not. The **swappable policy slot** is the
> only genuinely irreducible swap and it survives unchanged.

**WEIGHING (the decision and the rejected alternative).** Chosen: **same system** — for
conceptual integrity, no seam, one behavior primitive, one event log, uniform determinism.
Rejected: **two systems sharing only the event-log schema** — more tractable near-term and
each independently optimizable, **but** it maintains two behavior models that **drift** out
of agreement and **reintroduces the very seam the one-timeline philosophy exists to kill.**
The near-term tractability is real; it is not worth a permanent seam.

**COST (stated plainly, not softened).** Today's engine is a **degenerate special case** of
this target: a single protagonist fully simulated, NPCs largely sketches/tags, **no general
agent-behavior model**, and only a thin trickle of autonomous world events — consistent
with the verified fact that **the present engine has no autonomous ticking** (time advances
only on player action; events come from the player plus scheduled/world events fired
against `tod` in `checkEvents()`). So "same system" is a **TARGET**, not a description of
what exists. Reaching it requires **generalizing / rebuilding the live engine itself into
the multi-agent one**, of which the current single-protagonist loop becomes **one
configuration.** The substrate is a **generalization of the game engine, not a
side-generator bolted onto it.** This is the honest gap between the decided architecture
and the shipped code.

---

## 3. The recursion is endless; you economize in COVERAGE, never in FIDELITY

A person is shaped by other people — their parents — who were themselves shaped by
others — their grandparents — and so on. Conceptually this recursion is **infinite**.

**Do NOT cut the recursion at a fixed depth.** A truncation (e.g. "generate two
generations of ancestry and stop") returns a **thin fabricated stub** at the boundary: the
great-grandparents become props, and any memory or trait that reaches for them lands on
void. Fixed-depth truncation is the §1 "the world is real" failure wearing a
respectable-looking number.

**The tractability question is real, but the obvious answer is a trap.** Full genuine
simulation of an infinite ancestral cone feels too expensive, and the reflex is to make the
people *cheaper* — coarse summaries, statistical sketches, born-whole ancestors, a
resolution dial turned down for the background. **Every one of those moves is wrong** (the
whole graveyard, §10, is that reflex failing eight different ways). The correct economy is
not in how *richly* each person is made; it is in *how many* are made at all.

> **Granularity is not a quantity you choose.** "How much detail does this person get" is a
> **category error**. Realness is **unbounded depth** — a real person never bottoms out in a
> finite spec. You never materialize that infinity, but what you *do* materialize, you
> materialize at **FULL FIDELITY**. The economy is **COVERAGE** (what gets touched at all),
> never **FIDELITY** (everything that exists, exists fully).

The load-bearing distinction, stated so it cannot be blurred:

> **PARTIAL ≠ THIN.**
> **Partial** = finite *coverage*, full fidelity everywhere it exists. You generated some of
> the people; the ones you generated are whole.
> **Thin** = reduced *fidelity*. You generated a sketch of a person — and a sketch reads as
> constructed, every time.
> Partial is correct. Thin is the failure mode the entire design is built to avoid.

So the ancestral / social graph is **lazily covered, never thinly rendered.** A person is
**generated only when the forward pass actually touches them** — but when touched, they are
generated **whole**, forward-caused from their own context (§6), not as a summary of the
recursion behind them:

- the forward pass runs through a stretch of the father's upbringing → the people who acted
  in it are generated, whole, at that moment;
- a present cue reaches for the grandmother → if she was laid down on the forward pass, she
  is already whole and you read her; if she was **not** laid down, you have a backward reach
  into un-generated past, and that is the **L** (§7), not a "resolution" to dial up.

Play only ever **covers** a finite slice of an infinite latent world. **You pay for
coverage, not for depth-per-person.** That is what makes "endless" tractable: the world is
infinite in principle and finitely *covered* in every actual playthrough — and what is
covered is never cheapened.

This is the same move as `memory.md`'s "no pre-built memory bank" — existence is paid for
on demand, not pre-populated — but with the sharpened rule that *paid-for means
full-fidelity*, never a discount sketch.

---

## 4. Initial conditions at t=0 — the one legitimate acausal layer

The recursion cannot recurse forever in practice, but you may **not** stop it with a thin
leaf (that is W2/W4 — see §10). There is exactly one place a person may legitimately come
into being **without being forward-caused**, and it is **t=0: the initial conditions of the
world.**

> **You choose where the world STARTS.** The people alive at t=0 are **full-fidelity
> acausal GIVENS** — axioms. Causation *begins* at t=0, so drawing the t=0 population
> acausally is not a violation; there is no earlier state for them to be caused by. They are
> the boundary condition, not an effect.

**Everyone after t=0 must be forward-caused** (§6). This is the clean line that the old
"frontier where recursion stops" framing blurred: the bottom of the recursion is not a
configurable depth you pick per-cone, it is **the single global t=0 you chose for the whole
world.** A t=0 axiom is full-fidelity (a whole person), but its acausality is *legitimate*
because nothing came before it. A person reached-for in the middle of history who was never
laid down is a different thing entirely — drawing *them* acausally is a violation, and the
only sanctioned response is the marked **L** (§7), not a quiet "leaf."

The t=0 population must still be **believable** — and believability, not distributional
fixpoint, is the target. **We explicitly DROPPED an earlier idea of guaranteeing a
statistical fixpoint / stationary distribution** (that the generative process reproduce its
own input distribution, so the population is self-consistent under the generator). The
reason: **the player never sees the distribution, only prose.** Distributional fidelity is
invisible and therefore not the right target. **Believability is.**

Believability decomposes into three requirements (these apply to the **t=0 axiom draw** and,
in the forward sense, to every forward-caused person after it):

- **(a) Conditional plausibility.** The person is **typical — or plausibly atypical — for
  their CELL**: their culture, era, class, region, and role. A person in a specific time and
  place draws from what people in that cell were like, including the tails (an atypical
  person is fine; an *impossible-for-the-cell* person is not).
- **(b) Joint coherence.** Traits **cohere as a real person.** They are **NOT independent
  per-trait marginals** — drawing each trait independently produces **Frankenstein agents**
  (a configuration that is marginally plausible on every axis but jointly absurd).
  Coherence must also hold **across the whole web of people**, not just within one agent:
  the relationships between people must cohere too.
- **(c) Consistency with already-committed context.** A person generated *later on the
  forward pass* must not contradict what the simulation has already committed to (a sibling
  already generated, a date already fixed). *(See §6 — this consistency is best-effort, not
  guaranteed. A backward reach into past that was never laid down is NOT covered by this
  best-effort consistency; it is the **L**, §7.)*

**Representation — at the t=0 boundary ONLY.** Decision trees conditioned on culture /
upbringing / parentage give the conditional **JOINT** draw — they capture the dependence
structure (b) that independent marginals destroy. This **reuses the project's existing CART
machinery** (the same kind of tree the habit system uses, `habits.md`) but in a **different
regime**: habits learn *online* from observed play; these trees are **baked offline** as
grounded priors. Same tool, opposite training regime. *(Scope superseded by §11A/§11B: this
cell-conditioned joint draw is legitimate **only for the t=0 axiom population**. For everyone
forward-caused after t=0 the nature vector is the **left-fold of their act-stream**, derived,
never drawn — §11A. A CART baked from population data to **own** a per-person nature, or to
emit acts, is now **W9**: a frozen population posterior.)*

**The LLM is sanctioned ONLY AT THE LEAVES, BUILD-TIME ONLY, with output frozen/cached for
determinism.** This is the project's standing rule — *"the LLM is an oracle at the leaves,
never the control loop."* The LLM is used to paint **believable TEXTURE / specifics** onto
the structured nature vector: the dish the grandmother made, the way a parent said your
name, the smell of a childhood house. It never decides behavior-relevant parameters and
never runs in the hot loop; its output is generated once at build time and **frozen** so
replay stays deterministic.

**Hybrid, stated plainly (scope: t=0 boundary):** at t=0, grounded priors / trees produce
the **behavior-relevant nature vector** that the simulation math consumes; the LLM produces
**frozen texture only** that the prose reads. The structured part drives the sim; the
textural part drives the writing. *(For post-t=0 people the structured part is **not drawn**
— the nature vector is the fold of the act-stream, §11A — but the structured-drives-sim /
texture-drives-writing split still holds. Texture is **not a projection of the nature
vector**: it is an independent draw conditioned on the act + committed world, "must not
contradict N", not "must be a function of N" — §11D, W10.)*

---

## 5. The load-bearing primitive — the agent behavior model

The central primitive is the **AGENT BEHAVIOR MODEL**:

> *an agent acts on another, in character, given their nature and the situation.*

**Everything in this document collapses into it:**

- A leaf's conditional distribution (§4) is a **distribution over this primitive's input
  parameters** — over natures and situations. *(This leaf draw over natures is the **t=0
  boundary** case — §11B. After t=0 a node's nature is not drawn from a leaf but is the
  left-fold of its act-stream — §11A; the primitive then consumes that **derived** nature as
  its input parameter, not a freshly-drawn one.)*
- The recursion (§3) is **generating a history constrained to a nature** — i.e. repeatedly
  running the primitive to produce the acts that shaped a person.
- The behavior model, the leaf distribution, and the deep generator are **the same object
  viewed at different distances**: up close, one act; further out, a distribution over the
  natures that act; further still, a whole generated history of acts.

**Pin this primitive and the rest follows. Leave it vague and the system degrades to
fabrication** — because without a real behavior model, "what the world did to the
character" has nothing to generate it, and you fall back to authoring outcomes (which §6
and §7 show is fatal).

---

## 6. Prior, never posterior — the generation direction (a CORRECTION captured explicitly)

This is the sharpest correction in the design and must not be softened.

**Do NOT fix a character and reverse-engineer ancestry to justify them.** The tempting move
— decide the protagonist should be X, then generate parents/grandparents *so that* X is
explained — produces **implausible people.** The reason is causal: **real people are
outputs of their causes, not targets reverse-engineered from them.** Hard-conditioning on a
demanded outcome **bends the cause** into whatever shape fits the demanded effect, and
**bent causes read as fake.** A back-justified ancestry is an ancestry contorted to hit a
target; that contortion is legible as fabrication.

So the rule is: **every person is generated ONLY as a PRIOR** — a plausible **forward draw**
from their context — **never as a posterior fitted to descendants.** This includes the
protagonist: the protagonist is **drawn as the plausible product of a context**, and is
therefore **plausible by construction**, never authored-then-justified.

Steering is allowed — but only as **INFLUENCE on the prior** (a soft bias toward a region of
outcome space), **never hard conditioning to a fixed outcome.** **Bias, not clamp.**

**CONSEQUENCE (accepted, but bounded — do not over-read it):** consistency with
already-committed effects (§4c) becomes **best-effort, not guaranteed**, *for forward
generation*. A person generated later on the forward pass, drawn as an influenced prior, may
not perfectly explain a descendant already committed to, and a small forward-direction
mismatch is tolerable.

**This tolerance does NOT come from memory's lossiness — that conflation is WRONG (W5,
§10).** Memory's lossiness governs the **character's RECOLLECTION** — their access to the
past. It says nothing about the **GROUND TRUTH**, which must be **causally consistent,
always, no exceptions.** You may never let the generated world be causally incoherent and
then hide behind "they wouldn't remember exactly anyway." Recollection is the only lossy
thing; the world it reconstructs from is not. The forward best-effort slack above is small,
forward, and within the world's own causal logic — it is *not* a license to absorb
contradictions into unreliable memory.

**The generation order — two distinct orders, separated cleanly.** The earlier confusion
was **conflating two different orders.** Once separated they don't conflict:

- **Causal order = forward, ALWAYS, and causation happens ONCE.** Causes → effects,
  ancestor → descendant. This **defines the distribution**: everyone is a **prior draw from
  their causes**. The causal arrows never reverse. **Genuine causation happens only on the
  forward pass, at the live moment, once** — it is not a relation you can re-establish after
  the fact by re-running or by drawing a consistent-looking slice (those are W7/W8, §10).
- **Materialization order = the forward pass itself, with LAZY COVERAGE.** The world runs
  forward from t=0; people are laid down *as the forward pass reaches them*, and only to the
  coverage the run actually exercises (§3). What is laid down is whole (§3: partial ≠ thin).

**The key correction.** The old framing here recursed *backward* from the present character
— "materialize the causal cone toward causes, bottoming at believable-leaf priors at a
chosen frontier, then fill forward." **That backward-then-fill move is W4 (§10): it
reintroduces the thin leaf in disguise** (a "believable-leaf prior that summarizes the
deeper recursion" is a fidelity cut), and it inverts causation (you cannot draw a cause
*because* you already have the effect without posterior-fitting). The corrected picture:
generation is **forward from t=0**, period. The present character is not the seed of a
backward recursion; the character is **whatever the forward pass produced by the time it
reached the present.** The t=0 population (§4) is the only acausal layer; everyone between
t=0 and now is a forward prior-draw from already-materialized causes.

> **Lazy decides COVERAGE** — which stretches of the forward pass get exercised (§3).
> **Prior-forward decides each value** — drawn from causes already laid down before it.

Influence (§6, §7) enters as **bias on any prior on the forward pass** (the t=0 draw
included), within the divergence budget, **expressed only as causes.** The character is
**never fixed**; it is the **forward draw the world arrived at.**

**A demand that reaches BACKWARD into un-laid-down past is the exception — and its name is
the L (§7), not "resolution to fill in."** If a present cue points at a grandmother the
forward pass never covered, there is no forward causal moment left to generate her *into* —
that moment is gone. You cannot recurse back to it (re-running committed history is itself a
violation, W8). So the backward reach is **inherently acausal**, allowed only as the
explicitly-flagged last resort. See §7.

---

## 7. Forward-only causation, and the L (the retroactive last resort)

Two facts from §6 set up the whole tractability fallback:

1. **Genuine causation happens only on the forward pass, at the live moment, once.** A
   person or event is *caused* exactly when the forward simulation produces it from its
   already-existing causes. There is no other way to cause something.
2. **You economize in coverage, not fidelity (§3), and the only acausal givens are t=0
   (§4).** Everything materialized between t=0 and the present was forward-caused, whole.

Put together: a demand that reaches **backward into past that was never laid down on the
forward pass** has a problem with no clean solution. The causal moment for that
person/event is **gone** — it was a specific point in the forward run, and the run is past
it. You cannot manufacture genuine causation after the fact:

- You cannot **re-run** the relevant stretch of history to "generate them properly." Re-running
  committed history is **itself a causality violation** (W8, §10): it either reproduces the
  already-committed result (generating nothing new) or, steered to produce the now-demanded
  person, **posterior-fits** — exactly the W1 sin. There is no "expensive but valid causal
  path" to the past; the path does not exist at any price.
- You cannot treat the person as a **seed-specified slice lazily evaluated on demand** (W7,
  §10): detail that appears because the PRNG says so when you look is **acausal** — consistency
  between co-drawn slices is not causation.

So any backward reach into un-laid-down past is **inherently acausal — defined by its
DIRECTION, not by its cost.**

> **The L.** Such a reach is **ALLOWED** — the system must never dead-end — but **only as an
> explicitly flagged, logged LAST RESORT.** We cop to it: *we take the L.* It is a retrofit:
> a person/event drawn now, consistent with committed facts, to satisfy a demand the forward
> pass failed to cover.

**What the L concedes, and what it does NOT.** The L concedes **CAUSALITY**, not
**FIDELITY.** The retrofit is **still full-detail** — a whole person, drawn believably
(§4a–c), consistent with everything committed. What it lacks is the one thing it cannot
have: **genuine forward-causation.** It was not produced by the lived forward moment; it was
back-filled. (This is why the L is *not* a granularity move — it does not make a thin
person; it makes a whole person who simply wasn't there to be caused.)

**Two acausal sources, cleanly distinguished — keep them apart:**

| source | acausal because | status |
|---|---|---|
| **t=0 axioms** (§4) | causation starts at t=0; nothing precedes them | **legitimately acausal** — a clean given |
| **L retrofits** (§7) | causation was *owed* (the moment existed) but is gone | **acausal-where-causation-was-owed** — a visible, marked DEBT |

The L is **gated and stigmatized on purpose.** It connects to three standing principles:

- *"No shortcuts or silent approximations — mark the debt."* The L is logged, flagged, and
  counted; it is never silent.
- *"The author binds their own hands"* (§8). The escape exists so the system never dead-ends,
  but it is made costly/visible precisely so the **forward pass stays primary** — the L is
  the worst option, not a convenient one.
- *"Handle absence, don't patch symptoms."* The L is the *honest* handling of a real absence
  (un-covered past), carried as a marked debt — not a quiet patch that pretends the past was
  there all along.

**OPEN — the concrete mechanics of the L** are unsettled: how a retrofit is drawn
consistent with committed facts, how it is logged, and how its frequency is bounded (you
want as few Ls as possible, which pushes back on how the forward pass decides coverage —
also open, §3/§9).

---

## 8. The self-binding author — the meta-principle

This is the deepest point in the design. It also goes into CLAUDE.md as a standing
principle.

Because we control the entire simulation, **we CAN influence anything arbitrarily — and
that is exactly the danger.** **TOTAL CONTROL DESTROYS PLAUSIBILITY.** The instant you reach
in and **SET** an outcome, you **leave the manifold of things the process could have
produced** — the same contorted-cause disease as §6, but now coming from the *author's*
hand rather than from a back-justified ancestry. An outcome the process could never have
produced reads as fake no matter how carefully it is placed.

**The fix is NOT careful restraint.** "We'll be disciplined about not overriding the draw"
fails the moment overriding is inconvenient — willpower is not an architecture. The fix is
**SELF-BINDING BY CONSTRUCTION: build the system so that implausible configurations are
UNSAYABLE.** Not "we choose not to say them" — *there is no way to say them.*

This is **the same principle the project already holds for the PLAYER** — *"one timeline,
no save-scumming, you live with what happened"* — now **applied to the AUTHOR / generator.**
The world is real precisely because **not even its author can override the draw after the
fact.** Stated as the load-bearing distinction:

> A world the author can set arbitrarily is a **STORY.**
> A world the author can only seed and must then accept is a **SIMULATION.**

This is the meta-principle underneath the existing *"the world is real / emergence over
flags / nothing arbitrary"* cluster: those rules are all instances of *the author binding
their own hands.*

**Mechanisms, ranked:**

- **(PRIMARY) The control surface is CAUSES ONLY, expressed in the world's own vocabulary —
  never OUTCOMES.** You tilt **context** (era, hardship, a parent's absence, an economic
  collapse), and the **process produces the results.** You do not set "this character is
  withdrawn"; you set "a childhood with early social rejection," and withdrawal may follow.
  This makes implausible outputs **literally unsayable**, because the control language has
  **no token for an outcome** — only tokens for causes. You cannot demand an effect the
  causes wouldn't produce, because you can only speak in causes.
- **(GUARD 1) A DIVERGENCE BUDGET.** Bound how far the influenced prior may sit from the
  natural prior (a KL-style limit). This prevents stacking many rare-but-individually-possible
  tilts into a configuration that is **impossible in aggregate.** Each tilt is legal; the
  budget stops the sum from leaving the manifold.
- **(GUARD 2) NO RESAMPLE-TO-TASTE.** Take the seeded draw. **Re-rolling until you like the
  result is posterior-by-rejection** — it is **save-scumming the generator**, the author
  committing exactly the sin the player is forbidden. The draw stands.

**COST (stated honestly):** **you do not always get the world you wanted.** Concrete case:
the game may *need* the protagonist to be in a city for urban content to exist. That
requirement **must be expressed UPSTREAM as a legal lever** (a contextual cause that biases
toward urban settings) **or forgone** — it can **never be patched in post-hoc** by setting
the protagonist's location after the draw. **The price of realness is that the author gives
up the ability to guarantee specific outcomes.** That price is the point, not a defect.

---

## 9. Synthesis — one forward simulation; coverage is the only dial

> **RETRACTION.** An earlier version of this section (and the §3/§6 framing it rested on)
> claimed the open questions collapse into *"a **variable-resolution** multi-agent
> simulation with a swappable policy slot,"* with a **resolution dial** running coarse↔fine
> over agents and time. **That framing is REFUTED and withdrawn.** Variable *fidelity* is
> the wrong axis entirely (this is W3, §10). "Coarse-background vs. fine-foreground
> simulation" is exactly the thin-then-fill move that produces bland, incoherent,
> constructed-reading people. There is no resolution dial. Keep the **same-system** result
> (§2) and the **swappable policy slot** — those survive; discard "variable resolution."

The terminal model, assembled from the pieces above:

- **One continuous forward simulation** from t=0 (§4) to the present, every agent on the
  behavior primitive (§5), a **swappable policy slot** on one node (the protagonist, from
  game-start). This is the §2 same-system result, intact.
- **The only dial is COVERAGE** (§3): which stretches of the forward pass get exercised.
  Everything exercised is **full fidelity** (partial ≠ thin). There is **no fidelity dial.**
- **Causation is forward-only and happens once** (§6, §7). The t=0 population are the only
  legitimate acausal givens (§4). Steering is causes-only influence within a divergence
  budget (§8).
- **The L** (§7) is the sole, flagged, last-resort fallback for a backward reach into
  un-covered past — conceding causality, never fidelity.

The old "past-vs-present resolution dial over time" and "coarse-skeleton-vs-fine-detail
resolution dial over a stretch" both dissolve: time-step *granularity* (minutes vs. coarse
jumps) is a real parameter of advancing the forward pass, but it is **not a fidelity
reduction on people** — a coarsely-time-stepped stretch still lays down whole people where it
touches them, or doesn't touch them at all. Coarse-time ≠ coarse-person.

**The live open frontiers** (honestly unresolved — do not pretend otherwise):

- **What the GENERATOR/EVALUATOR actually is — RESOLVED into §11.** The crux split three
  ways: the **nature vector is the left-fold of the act-stream** (derived, no LLM, no
  per-person draw — §11A); the **only legitimate joint draw is at t=0** (§11B); **texture is
  an independent forward draw conditioned on the act + world**, where frozen-LLM-at-leaves
  survives under a changed justification (believability bar, weights-hash pinned to the save
  version — §11D). The remaining genuine crux is the **act-emitter** (next bullet).
- **The ACT-EMITTER (§11C) — and it IS the never-measured COMPUTE question.** What chooses
  each agent's next act forward, given the full fold of their state, is the §5 primitive run
  forward — **not dissolved, localized.** It must be **designed, not retreated-to-CART** (a
  baked tree is a frozen population posterior — W9). And **the act-emitter and the
  never-measured forward-sim-from-t=0 compute cost are the SAME open question**: what the
  emitter *is* determines what folding from t=0 across a social network over decades costs,
  and that cost was *assumed* intractable, never measured (§11A, §11C). **Measure it; don't
  guess it** — the unverified premise drove every wrong turn in §10.
- **How the forward pass decides COVERAGE.** You cannot pre-pick "an amount," and backward
  reaches later land unpredictably (each is a potential L). How to lay down coverage so as to
  **minimize future Ls** is open.
- **The concrete mechanics of the L** (§7, §11E) — DECIDED that the L is a **distinct
  backward operator**, never "STEP + a flag" (§11E); still open: logging, drawing a retrofit
  consistent with committed facts, bounding its frequency.

---

## 10. Wrong turns (and why each fails) — READ THIS BEFORE RE-DERIVING

**This section is the point of the document.** The model above was reached through a long,
error-strewn process. A future agent — or a fresh session — under the same tractability
pressure **will be pulled into these exact traps** and will re-derive each one as if it were
a fresh insight. It is not. Each was tried and **failed.** Read the refutation before
reaching for the frame.

Every entry states a **tempting frame** and then why it is **WRONG.** These are not
"considerations" or "tradeoffs." They are dead ends with specific failure mechanisms.

**W1 — Fix the character, then back-generate ancestry to justify them (posterior
generation).** WRONG. A pinned target reverse-engineered yields **implausible people**:
causes get **bent** to fit the demanded outcome, and bent causes **read as fake** (the
back-justification is legible). Generate every person as a **PRIOR** — forward from causes —
never a posterior fitted to descendants. (See §6.)

**W2 — Cut the infinite ancestral recursion with a thin "summary" / "believable-leaf" /
"fixpoint" of an ancestor.** WRONG *as a fidelity cut.* Any truncation of a person into a
finite **low-detail representation is THIN**, and thin **reads as constructed.** (The
sub-insight that *believability beats distributional fidelity* was correct — §4 keeps it —
but the "summary leaf" packaging was the trap. Believable ≠ summarized.)

**W3 — Variable RESOLUTION / coarse LOD: generate coarse, then fill detail on demand
("thin-then-fill").** WRONG, and this is **the framing that was previously committed to this
doc and is now retracted** (§9). Thin-then-fill **loses exactly the nuance that makes a
person real**; an event generated from a coarse-conditioned person is **bland/generic**; and
worse, a set of behaviors each drawn from coarse summaries may cohere with **NO single rich
interiority** — i.e. it is **incoherent**, which reads as constructed. **Variable *fidelity*
is the wrong axis entirely.** The right axis is **COVERAGE at uniform full fidelity** (§3).

**W4 — "You need the parents coherent and present, not their backstories" / draw an ancestor
'born whole' at a recent horizon.** WRONG. A coherent rich person **IS the residue of their
history** — you cannot have the rich coherent *output* without the *process* that produced
it. "Whole without history" is either a **statistical sketch** (thin, → W2) or an
**LLM-implied gestalt** (the very fabrication the project rejects). And it does not stay
contained: a thin parent **ACTS in the protagonist's observed childhood**, so the thinness
**PROPAGATES DOWN** into the region you were trying to make real. A recent horizon of
"born-whole" ancestors is just the thin leaf in disguise. (The legitimate version of "start
somewhere" is **t=0 axioms**, §4 — a *global* boundary condition, not a per-cone recent
horizon, and full-fidelity, not born-whole-from-nothing.)

**W5 — Absorb causal mismatch via memory's lossiness ("the recollection is unreliable
anyway, so a small inconsistency is fine").** WRONG. This **conflates GROUND TRUTH** (must be
causally consistent, **always, no exceptions**) **with RECOLLECTION** (the only lossy thing —
the character's *access*). Lossiness is **never a license** for the generated world to be
causally incoherent. There is no "absorb the mismatch" option. (See §6's corrected
consequence paragraph.)

**W6 — "A causally-sufficient bounded summary of a person exists — it's the shared
event-history."** **PARTLY TRUE** but dangerously over-extended. *True:* causal influence
between two people is **mediated entirely by their interactions**, which are finite recorded
events — so the **causally-relevant interface IS bounded.** *But it does NOT rescue
deferral/LOD*, because the failure in W3/W4 is about the **richness/coherence of what gets
generated**, not merely causal sufficiency. A bounded causal interface does not license a
thin person on either side of it. Do not stretch W6 into a justification for thin generation.

**W7 — The person is an infinite object specified by a SEED, lazily evaluated into
full-fidelity slices on demand.** WRONG — this is **ACAUSAL.** The detail comes out because
**the PRNG says so when you look**, not because any lived event produced it. **Consistency
between co-drawn slices is NOT causation**; seed-specification ≠ causal derivation. (Acausal
seed-evaluation is legitimate **only at t=0**, §4 — there, nothing precedes the draw.
Applying it to a mid-stream person like "grandma at 35" violates causality, → the L, §7.)

**W8 — The L is triggered when forward-generation would be too EXPENSIVE ("re-simulating an
intractable cone").** WRONG on two counts. **(a)** "Re-simulation" is itself a **causality
violation** — you cannot re-run committed history; it either **reproduces** the committed
result (fills nothing) or **posterior-fits** it (→ W1). **(b)** So the L's trigger is **NOT
cost** — there is **no expensive-but-valid causal path for the past.** The L is triggered by
**DIRECTION**: any backward reach into past that was not laid down on the forward pass is
inherently acausal → the L (§7).

**W9 — Bake a CART / decision-tree from population data to OWN the nature vector or to
EMIT the next act.** WRONG. A tree baked from population data is a **frozen population
posterior** — it carries no lived process, only a smoothed conditional average. **W4's
objection applies verbatim:** "a smoothed average with no lived process behind it" is the
same fabrication whether the smoother is an LLM's weights or a CART's leaves; the
representation is irrelevant. It also violates the standing rule *"avoid generalized
statistics; the character needs their **own** reason"* — a tree gives the character a draw
from the correct distribution, never their own cause. The convergence on "bake a CART for
the emitter" is a **TOOL-AVAILABILITY RETREAT** (the repo already ships habit-tree
machinery — `habits.md` — so the tree is *reached for* because it's there), **not a derived
answer.** The act-emitter (§11C) must be **designed**, not retreated-to-CART. The **one**
legitimate joint *draw* from a population distribution is **t=0-only** (§11B): at t=0 there
is no individual cause to derive from, so a cell-conditioned joint draw is sanctioned;
everywhere after t=0, the character is grown by acts and has their own cause.

**W10 — Texture is a pure PROJECTION / function of the nature vector (so structure and
texture *can't* diverge).** WRONG **as stated.** The motive is right — `N` and `T` must
not contradict — but "make `T` a function of `N`" buys that coherence by **throwing away
information texture legitimately carries.** Texture holds **contingent particulars the
nature vector does not and cannot encode**: the grandmother's specific dish, the song
always on the radio, the exact phrasing of a name. These are not derivable from NT
setpoints or personality axes — and they **later become causal** (a memory cue, a sentiment
anchor). A pure projection `T = f(N)` discards exactly this information, flattening the
person to what their parameters imply. The real requirement is **`T` must not CONTRADICT
`N`**, never **`T` must be a FUNCTION of `N`**. Texture is an **independent forward draw
conditioned on the act + committed world** (§11D), coherent *by conditioning*, not by being
a readout.

**W11 — Gate forward generation with an LLM likelihood-CRITIC (rejection-sample proposals
until the critic passes).** WRONG. Accepting a proposal in proportion to a plausibility
score is **not** sampling the prior — it is a **variance-contracting soft posterior toward
the critic's mode.** It systematically deletes the legitimate tail that §4a requires (the
plausibly-atypical person), because tail draws score lower and are rejected more often;
what survives is concentrated near what the critic finds typical. The "take the
best-scored draw on exhaustion" fallback is literally **argmax = the critic's mode = author
save-scumming** (§8 Guard 2). The one salvageable idea — the *unsayable* causes-only input
signature — is kept (§11E), but the **gate itself is rejected** (§11F).

### The META-TRAP (the one thing a future agent most needs to see)

Across **all** of W1–W8 the recurring failure is the same. Under **TRACTABILITY PRESSURE** —
full genuine simulation feels too expensive or infinite — the reflex is to reach for one of:

- **(a) GRANULARITY LOSS** — coarse, summary, born-whole, thin leaf, resolution dial; or
- **(b) a CAUSALITY SHORTCUT** — back-fit, seed-eval, re-simulate, absorb-via-lossiness.

**Every such move is wrong.** It produces **thin/constructed people** or **acausal detail.**
The pressure is real but the assumption under it (that forward-sim is intractable) **was never
measured** (§9) — it is exactly the unverified premise that drives the reflex.

W9–W11 add a **third reflex shape** the generator/evaluator exercise surfaced:

- **(c) the TOOL-AVAILABILITY RETREAT** — reach for the mechanism the repo already ships
  (a CART, an LLM critic) and call its availability a derivation. W9 is this for the
  emitter; W11 for the gate. A tool being on hand is not an argument that it is the right
  primitive. The act-emitter (§11C) must be **designed**, not retreated-to.

The **ONLY** legitimate levers are:

1. **Laziness in COVERAGE, not fidelity** — partial ≠ thin (§3).
2. **FORWARD-ONLY causation** — generate once, at the live moment (§6, §7).
3. **Acausal givens ONLY at t=0** (§4).
4. **The explicitly-flagged retroactive L** as the sole last-resort fallback (§7).

> **If a proposed mechanism loses fidelity anywhere, or shortcuts causation anywhere except
> t=0, it is WRONG — full stop.** Do not soften this into "it depends." It does not.

---

## 11. The Generator/Evaluator — resolved

§9 left open *"what the GENERATOR/EVALUATOR actually is"* — the thing rich enough to
produce full-fidelity, coherent, forward-caused people and acts, and whether
build-time-frozen LLM generation counts as genuine simulation or is the fabrication the
project rejects. This section resolves it. The crux *"does frozen-LLM-at-leaves count as
genuine simulation?"* was never a single question — it splits cleanly three ways depending
on **which thing** is being generated. Splitting it dissolves most of the apparent
difficulty and **localizes the one genuinely hard part** that remains.

The four design artifacts behind this are in `docs/artifacts/generator-design/`
(`candidate-subtract.md`, `candidate-primitive.md`, `candidate-evaluator.md`,
`candidate-llm-leaves.md`); they carry the worked-out detail. The synthesis:

### 11A. The behavior-relevant nature vector is the LEFT-FOLD of the act-stream — DERIVED, never drawn, no LLM

There is **no per-person draw** of the nature vector and **no LLM** anywhere near it. A
person's nature *at time t* is the **left-fold of every act that has touched them** up to
`t` — computed by the **existing NT / baseline / sentiment engine** replaying those acts:

> `NodeState(n, t) = fold(applyAct, seedAxiom(n), acts where (actor=n or patient=n) and t' < t)`

The nature vector is **derived, never stored** (incrementally materialized as an
accumulator for live performance, but conceptually a pure fold; **replay = cold recompute**
from the act log, for determinism). This is the project's own deepest pattern — *"how far
along is always derived from a start timestamp, never a stored counter"* and *"event
records record events; current state lives in current state"* — **applied to personhood
itself.** A person is `f(acts-so-far)`, not a blob.

The decisive consequence: this makes **forward-causation STRUCTURAL / unsayable rather
than enforced.** An emitter that draws a node's next act reads `NodeState(actor, t)`, which
is a fold over acts dated `< t`. The fold **physically has no access to acts dated ≥ t** —
there is no future state to read, no descendant to be conditioned on. Posterior-fitting is
not *discouraged*; it is **impossible to express**, because the only input an emitter has is
a strictly-past fold. This is §8's *"the author binds their own hands / implausible
configurations are unsayable"* made architectural rather than disciplinary. (See `candidate-primitive.md` §1–§3.)

The **compute cost of folding from t=0 across a social network over decades MUST be
measured, not assumed** — this is the same never-measured forward-sim cost §9 flags, now
named precisely (see §11C: it is the *same* open question as the emitter).

### 11B. The ONLY legitimate joint DRAW is at t=0 — the axiom population

A joint draw from cell distributions — where population statistics are sanctioned and
acausality is legitimate (§4: acausal givens are legal *only* at t=0) — happens **once, at
t=0, for the boundary population.** Everyone after t=0 is **grown entirely by acts** (§11A),
never drawn. This **shrinks** the hard joint-prior expressiveness problem — *"draw a
coherent person from a cell"* — from **every person who ever existed** down to **the t=0
boundary population only.** It does not relocate the hard problem; it **confines** it to the
one place the doc already licenses acausality. The Frankenstein-agent worry (§4b) and the
cell-conditioned joint draw (§4) both live here, at t=0, and **only** here.

### 11C. The GENUINE, LOCALIZED open crux is the ACT-EMITTER

What chooses each agent's **next act forward**, given the full fold of their state plus
their situation, is the §5 behavior primitive **run forward** — and it is **NOT dissolved
by this synthesis.** It is **localized and named.** Fidelity rides here: the richness and
coherence of every generated person is exactly the richness of the act-stream the emitter
produces (`candidate-primitive.md` §8 — the apply-rule/verb ontology is where thinness can
re-enter by the back door).

> **CRITICAL WARNING (and the reason W9 exists).** The reflex answer — *bake a CART /
> decision-tree from population data to emit acts* — is **WRONG.** A tree baked from
> population data is **itself a frozen population posterior**: W4's *"a smoothed average with
> no lived process behind it"* objection applies to it **verbatim**, and it collides with
> the repo's *"avoid generalized statistics; the character needs their own reason."*
> Converging on "bake a CART for the emitter" is a **tool-availability retreat** (the repo
> ships habit-tree machinery, so the tree is reached for because it's there), **not a
> derived answer.** The emitter must be **designed**, not retreated-to-CART.

**The act-emitter and the never-measured forward-sim compute cost are the SAME open
question wearing two hats.** What the emitter *is* determines what it costs to run forward
from t=0; you cannot measure the cost without committing to the mechanism, and you cannot
validate the mechanism without measuring whether it runs. Both stay **OPEN** together.

### 11D. Texture is an INDEPENDENT forward draw conditioned on the act + committed world

Texture (the grandmother's dish, the song always on the radio, the exact phrasing of a
name) is an **independent draw conditioned on the laid-down act and the committed world** —
coherent **by conditioning**, committed to the act-log **when laid down** (NOT authored at
read-time; read-time authoring of an un-laid-down particular is the **L** / W8, §7).

**Correction to a framing §4 invites:** texture is **NOT a pure projection / function of
the nature vector.** That framing (W10) buys coherence by **throwing away information
texture legitimately carries** — **contingent particulars the nature vector does not and
cannot encode**: the specific dish, the specific song, the specific phrasing. These are not
derivable from NT setpoints, and they **later become causal** (memory cues, sentiment
anchors). The real requirement is **"must not CONTRADICT N"** — never **"must be a FUNCTION
of N"**, which discards exactly this information. (See `candidate-primitive.md` §2,
`candidate-llm-leaves.md` §5.)

**Here FROZEN-LLM-AT-LEAVES SURVIVES.** The memoization = forward-causation argument is
**sound**: a texture call is a pure function of `(seed, committed-before-t context)`; the
**cache key IS the causal context**; freezing is **replay**, identical in kind to the seeded
PRNG — *determinism ≠ acausality* (`candidate-llm-leaves.md` §3.3). **But its justification
must change.** Texture is **NOT "low-stakes because behavior-inert."** In a game where
**prose is everything**, texture is the **entire player-facing surface** — so it must meet
the **believability bar**, not get a pass for being inert. Two consequences:

- **Determinism requires PINNING THE MODEL-WEIGHTS HASH into the save version.** A model or
  version change = a version bump = a purge — matching the repo's existing
  purge-on-version-bump policy (`game.js`). A frozen texture cache is only deterministic
  relative to the weights that produced it.
- Texture is **build-time, frozen, conditioned ONLY on forward context** (event-log facts
  dated `< t`, plus the strictly-upstream DAG — see §11E).

### 11E. Adopted enforcement grafts

Two structural guards, salvaged from the candidates, are **adopted**:

- **The "UNSAYABLE" type-level guard.** Whatever assembles causal context takes the
  context-cell `C` as its **only non-seed argument**, via a **pure context-assembler** that
  filters the event log to `date < t` plus the strictly-upstream DAG, with **NO FIELD for a
  demanded outcome.** Posterior-fitting becomes a **TYPE ERROR**, not a discipline. This is
  §8's *"the author binds their own hands / unsayable"* made architectural **and testable**:
  a test asserts that every fact in every context packet is **dated-before** `t` and
  **upstream** of the node in the DAG. (`candidate-evaluator.md` §5,
  `candidate-llm-leaves.md` §3.1 — the one good idea salvaged from the rejected
  evaluator-gate.)
- **The L is a DISTINCT BACKWARD OPERATOR, never "STEP + a flag."** STEP is **forward by
  signature**; the L is **backward by direction.** A flag cannot convert a forward operator
  into a backward one — the two differ in *kind*, not in bookkeeping. The L **shares the
  prior-draw subroutine** with STEP but is **its own operation**, carrying a debt log. (This
  corrects `candidate-subtract.md` §4 / `candidate-primitive.md` §6, both of which framed the
  L as STEP-plus-a-flag.) Concrete L mechanics remain **OPEN** (§7).

### 11F. Rejected: LLM-as-evaluator / gate

The *"rejection-sample proposals against an LLM likelihood-critic"* approach
(`candidate-evaluator.md`) is **REJECTED.** Its acceptance rule — accept a proposal in
proportion to a plausibility score — is **mathematically a variance-contracting SOFT
POSTERIOR toward the critic's mode**: accepting `∝ score` does **not** sample the prior; it
**deletes the legitimate tail** §4a requires (the plausibly-atypical person draws lower and
is rejected more, so survivors concentrate near the critic's typical). Its *"take
best-so-far on exhaustion"* fallback is literally **argmax = the critic's mode = author
save-scumming** (§8 Guard 2). Its **one good idea** — the unsayable, causes-only input
signature — is **salvaged in §11E**; the gate itself is not. (See W11.)

---

## Settled vs Open

**SETTLED (direction):**

- The world — other agents + circumstance — is the source of formative events; the player
  authors only responses. (§1)
- There is one continuous simulation; chargen is handing control of an agent already inside
  it, not authoring a character; past and present are the same simulation. (§2)
- The present engine has no autonomous ticking (verified against code). (§2)
- **The present engine and the past generator are the SAME SYSTEM** — one multi-agent engine,
  every agent on the behavior primitive, the player a policy injected into one node; time
  resolution, agent resolution, and who-drives-the-protagonist are all *parameters*, not
  separate engines. Chosen over "two systems sharing the event-log schema" (which would let
  two behavior models drift and reintroduce the seam). **Cost accepted:** today's
  single-protagonist loop is a *degenerate special case*; "same system" is a target that
  requires generalizing/rebuilding the live engine into the multi-agent one, not a side-generator. (§2)
- The recursion is endless; **no fixed-depth truncation.** You economize in **COVERAGE**
  (what the forward pass touches), **never in FIDELITY.** **Partial ≠ thin:** what is
  materialized is whole. Granularity is not a quantity you choose. (§3)
- **Initial conditions at t=0 are the ONE legitimate acausal layer:** the t=0 population are
  **full-fidelity acausal GIVENS** (axioms — causation starts there). Everyone after t=0 is
  forward-caused. (§4)
- The target is **believability**, not distributional fixpoint (the fixpoint idea was
  dropped) = conditional plausibility + joint coherence (not marginals) + consistency with
  committed context. (§4)
- A cell-conditioned **joint draw** (population statistics sanctioned) is legitimate **only
  at t=0**, for the boundary population; everyone after t=0 is grown by acts, not drawn
  (§11B). **The behavior-relevant nature vector is the LEFT-FOLD of a node's act-stream**
  (the existing NT/baseline/sentiment engine), **derived, never drawn, no LLM** — this makes
  forward-causation structural/unsayable (§11A). The §4 "trees/CART for the joint draw"
  framing is **narrowed to t=0**; a CART baked to own the nature vector or emit acts is **W9**
  (a frozen population posterior — a tool-availability retreat). (§4, §11A, §11B)
- **LLM at the leaves survives — for TEXTURE only**, build-time, frozen, conditioned only on
  forward context. But texture is **NOT a projection of the nature vector** (that discards
  contingent particulars — W10); it is an **independent draw conditioned on the act + world**,
  "must not CONTRADICT N", not "must be a FUNCTION of N". Justification changed: texture is the
  **entire player-facing surface**, so it meets the **believability bar** (not a behavior-inert
  pass); determinism requires **pinning the model-weights hash into the save version**. (§4, §11D)
- The agent behavior model is the load-bearing primitive everything reduces to. (§5)
- Generate **prior, never posterior**; **influence, never hard-condition**; bias not clamp.
  Forward best-effort consistency only; **NOT licensed by memory's lossiness** (that
  conflation, W5, is refuted — ground truth is always causally consistent; only recollection
  is lossy). (§6)
- **Causation is FORWARD-ONLY and happens ONCE**, on the live forward pass. Generation runs
  forward from t=0; the present character is whatever the forward pass arrived at — **not**
  the seed of a backward recursion (the old backward-cone / believable-leaf-frontier framing
  is **retracted**, W4). *Lazy decides COVERAGE; prior-forward decides each value.* (§6, §7)
- **The L** — a backward reach into un-laid-down past is **inherently acausal** (defined by
  DIRECTION, not cost), **allowed only as a flagged, logged LAST RESORT.** It concedes
  **causality, not fidelity** (the retrofit is still full-detail). Two distinct acausal
  sources: **t=0 axioms (legitimate)** vs **L retrofits (marked debt).** (§7)
- **Self-binding by construction**: control surface is causes-only; divergence budget;
  no resample-to-taste; the cost (you don't always get the world you wanted) is accepted.
  (§8)
- **One forward simulation; COVERAGE is the only dial.** Same-system result and swappable
  policy slot survive; **"variable resolution / resolution dial" is REFUTED and retracted**
  (W3). (§9)
- **The generator/evaluator crux is RESOLVED into §11**, splitting three ways: nature vector
  = act-stream fold (§11A); only joint draw is t=0 (§11B); texture = independent
  forward-conditioned draw, frozen-LLM-at-leaves surviving on a believability justification
  (§11D). (§11)
- **Two enforcement grafts adopted:** (1) the **UNSAYABLE type-level guard** — the
  context-assembler takes the context-cell as its only non-seed argument, filtered to
  `date < t` + strictly-upstream DAG, no field for a demanded outcome → posterior-fitting is a
  **type error**, testably (§11E); (2) **the L is a distinct backward operator**, never "STEP
  + a flag" (forward-by-signature vs. backward-by-direction; shares the prior-draw subroutine,
  own debt log) (§11E).
- **LLM-as-evaluator/gate REJECTED** (§11F, W11): score-proportional acceptance is a
  variance-contracting soft posterior toward the critic's mode (deletes the §4a tail);
  best-so-far-on-exhaustion is argmax = author save-scumming. Only its causes-only input
  signature is salvaged (§11E). (§11F)

**OPEN (the live frontier — genuinely unresolved; do not pretend otherwise):**

- **The ACT-EMITTER** — what chooses each agent's next act forward, given the full fold of
  their state + situation (the §5 primitive run forward). **This is the genuine open crux**:
  the generator/evaluator question (now resolved, §11) localized fidelity here and did **not**
  dissolve it. It must be **designed, not retreated-to-CART** (a baked tree is a frozen
  population posterior — W9). (§11C)
- **The COMPUTE COST of forward-sim from t=0 — same question as the act-emitter.** Folding
  from t=0 across a social network over decades was *assumed* intractable, never measured;
  what the emitter *is* determines what it costs. The two are one open question wearing two
  hats. **Measure it, don't guess it** — the unverified premise drove every wrong turn (§10).
  (§11A, §11C)
- **How the forward pass decides COVERAGE** — you cannot pre-pick an amount, and backward
  reaches later land unpredictably; the goal is to lay down coverage so as to **minimize
  future Ls.** (§3, §9)
- **The concrete mechanics of the L** — how it is logged, how a retrofit is drawn consistent
  with committed facts, how its frequency is bounded. (DECIDED: it is a distinct backward
  operator, §11E; the rest is open.) (§7, §11E)
- All concrete numeric/representational details (tree feature sets, the divergence-budget
  metric and bound, cell granularity, how the t=0 boundary is drawn) — none were settled and
  none should be invented.

---

## Relationship to existing systems

- **`memory.md` — the primary consumer.** Memory is a read-projection over the latent
  ground-truth life. This substrate is **what produces that latent life.** Memory's lossy,
  reconstructive nature governs the character's **RECOLLECTION** (their access) — it does
  **NOT** license causal incoherence in the **ground truth** this substrate produces (that
  conflation is W5, §10, refuted). The two systems are interlocking on the access axis, not
  on the consistency axis: ground truth is always causally consistent; only recall is lossy.
- **Event log** (`events.js`). The continuous simulation (§2) writes the dated, NT-stamped
  event spine memory reads. In the present this is the in-run log; the past-generation mode
  must deposit the same shape for pre-game life (this is `memory.md` Stage 1's dependency).
- **Sentiments** (`emotions.md`). Relationships between agents, and a character's accumulated
  feeling toward people and things, ride the existing sentiment system; the generated history
  is what those sentiments are the residue of.
- **NPC dynamic resolution** (`npc-simulation.md`). §3's lazy **coverage** is the
  *historical/ancestral* analogue of dynamic resolution — but note the sharpened rule: the
  economy is in **coverage (who is touched), never fidelity (how richly).** A person who is
  generated is generated **whole**; un-touched people are simply not generated (or, if reached
  backward, the L, §7). "Never to zero, never pre-populated" still holds; "low-resolution
  background person" does **not** (that is the refuted W3 dial).
- **CART habits** (`habits.md`). The decision-tree machinery is reusable as the offline-baked
  **t=0 joint draw** (§11B) — and **only there.** Reaching for it to own the post-t=0 nature
  vector or to emit acts is **W9** (a frozen population posterior; a tool-availability
  retreat). The nature vector after t=0 is the **act-stream fold**, not a tree draw (§11A);
  the act-emitter is open and must not default to CART (§11C). (§4, §11)
- **The neurochemistry engine** (`nt-baseline.md`). Supplies the encoding stamps on
  generated events exactly as it does for in-run events; a generated childhood's emotional
  coloring is a *consequence* of running this engine over a coarse trajectory, not an
  authored field. (Per `memory.md` §4, marked there as approximation debt.) **It is also the
  fold** (§11A): the behavior-relevant nature vector at time `t` is what this engine computed
  after replaying a node's acts up to `t` — derived, never stored.
- **Chargen.** Reframed: chargen is **the present-slice of this simulation** — the moment
  the world has been run up to and control is handed over — not a separate authoring step.
  Today's `chargen.js` legends-compression is the thin placeholder this direction replaces.

---

## Status / phasing

**This is foundational and large.** It is the substrate beneath the deepest layers of the
character model, and it is a **multi-phase direction**, not a near-term build. None of §1–§9
is implemented; the only shipped piece adjacent to it is **memory Stage 0** (the in-run
encoding/recall mechanism), which fires only on in-run events because the generated past
this doc describes does not yet exist.

**`memory.md` Stage 1 — the backstory episodic spine — is downstream of this substrate
existing.** Stage 1 needs a genuinely generated past (timestamped, participant-bearing,
cue-keyed, NT-stamped) for cues to land on something real. That generated past is *exactly
the output of the world simulation described here.* Until this substrate (even in a coarse
first form) deposits a real spine, Stage 1 cues would land on fabrication — which is the
failure §1, §4, §6, and §7 all exist to prevent. Build order therefore runs: this
substrate (at least a coarse, prior-only, causes-only first cut) → memory Stage 1 → the
richer register/lossiness stages.

Do not treat any part of this as a ticket. It is the direction the character model is
being built toward, recorded so the reasoning and the corrections survive the conversation
that produced them.
