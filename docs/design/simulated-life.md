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

**The engine asymmetry (SETTLED as a problem, OPEN as a solution).** The present-tense
engine and the past-generating engine are **different shapes**, and conflating them is a
mistake:

- **Present engine** — single-protagonist, player-driven, per-minute integration. Verified
  against the code: **time only advances on player action; there is NO autonomous
  ticking.** Events come from the player plus scheduled/world events fired against `tod` in
  `checkEvents()`. The world does not run on its own clock between player actions.
- **Past generation** — the **inverse shape**: many agents acting from their natures over
  **coarse** time (life-phases, discrete events), with **nobody privileged**. No single
  protagonist; no per-minute integration; no player driving one thread.

So generating a past is **not the present engine on autopilot.** It is a different mode.
**How the two relate concretely is OPEN** — whether the past generator is a separate
coarse simulator that deposits a spine the present engine then continues, whether there is
a shared agent-behavior core both call at different resolutions, or some other
arrangement, was not settled.

---

## 3. Optional-but-endless recursion (the social / ancestral graph)

A person is shaped by other people — their parents — who were themselves shaped by
others — their grandparents — and so on. Conceptually this recursion is **infinite**.

**Do NOT cut the recursion at a fixed depth.** A truncation (e.g. "generate two
generations of ancestry and stop") returns a **thin fabricated stub** at the boundary: the
great-grandparents become props, and any memory or trait that reaches for them lands on
void. Fixed-depth truncation is the §1 "the world is real" failure wearing a
respectable-looking number.

Instead the ancestral / social graph is a **LAZY INFINITE structure.** A node is **forced
only when play demands its depth**:

- a memory surfaces *about the grandmother* → force the grandmother to the resolution that
  memory needs, and no further;
- something in the present depends on *how the father was raised* → force the father's
  upbringing, which may force one of *his* parents, and no further.

Play only ever forces a **tiny finite frontier** of an infinite latent tree. **You pay
only for depth that gets touched.** That is what makes "endless" tractable: the tree is
infinite in principle and finite in every actual playthrough, because the player can only
ever reach finitely far into it.

This is the same move as `memory.md`'s "no pre-built memory bank" — existence is paid for
on demand, not pre-populated.

---

## 4. Believable leaves, not fixpoints

At the frontier where recursion stops, you need a **believable generated input** — a real
person, not a stub. The target is **believability**, and that choice is itself a
correction:

**We explicitly DROPPED an earlier idea of guaranteeing a statistical fixpoint / stationary
distribution** (i.e. that the generative process reproduce its own input distribution,
so the population is self-consistent under the generator). The reason: **the player never
sees the distribution, only prose.** Distributional fidelity is invisible and therefore
not the right target. **Believability is.**

Believability decomposes into three requirements:

- **(a) Conditional plausibility.** The leaf is **typical — or plausibly atypical — for its
  CELL**: its culture, era, class, region, and role. A grandmother in a specific time and
  place draws from what people in that cell were like, including the tails (an atypical
  person is fine; an *impossible-for-the-cell* person is not).
- **(b) Joint coherence.** Traits **cohere as a real person.** They are **NOT independent
  per-trait marginals** — drawing each trait independently produces **Frankenstein agents**
  (a configuration that is marginally plausible on every axis but jointly absurd).
  Coherence must also hold **across the whole web of people**, not just within one agent:
  the relationships between people must cohere too.
- **(c) Consistency with already-committed context.** A leaf forced later must not
  contradict what the simulation has already committed to (a sibling already generated, a
  date already fixed). *(See §6 — this consistency is best-effort, not guaranteed, and §6
  explains why that is acceptable.)*

**Representation.** Decision trees conditioned on culture / upbringing / parentage give the
conditional **JOINT** draw — they capture the dependence structure (b) that independent
marginals destroy. This **reuses the project's existing CART machinery** (the same kind of
tree the habit system uses, `habits.md`) but in a **different regime**: habits learn
*online* from observed play; these trees are **baked offline** as grounded priors. Same
tool, opposite training regime.

**The LLM is sanctioned ONLY AT THE LEAVES, BUILD-TIME ONLY, with output frozen/cached for
determinism.** This is the project's standing rule — *"the LLM is an oracle at the leaves,
never the control loop."* The LLM is used to paint **believable TEXTURE / specifics** onto
the structured nature vector: the dish the grandmother made, the way a parent said your
name, the smell of a childhood house. It never decides behavior-relevant parameters and
never runs in the hot loop; its output is generated once at build time and **frozen** so
replay stays deterministic.

**Hybrid, stated plainly:** grounded priors / trees produce the **behavior-relevant nature
vector** that the simulation math consumes; the LLM produces **frozen texture only** that
the prose reads. The structured part drives the sim; the textural part drives the writing.

---

## 5. The load-bearing primitive — the agent behavior model

The central primitive is the **AGENT BEHAVIOR MODEL**:

> *an agent acts on another, in character, given their nature and the situation.*

**Everything in this document collapses into it:**

- A leaf's conditional distribution (§4) is a **distribution over this primitive's input
  parameters** — over natures and situations.
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

**CONSEQUENCE (accepted):** consistency with already-committed effects (§4c) becomes
**best-effort, not guaranteed.** A later-forced ancestor, drawn as an influenced prior, may
not perfectly explain a descendant already committed to. **This is acceptable — and the
reason it is acceptable is the memory layer.** `memory.md` establishes that memory is
**lossy and reconstructive**; nothing in the system, *not even the prose*, claims exact
access to the past. So the slack between a best-effort prior and an already-committed effect
is **absorbed by memory's own tolerance for distortion.** The two systems fit together:
**memory's lossiness is exactly what licenses the generator to use influence instead of
constraint.** If memory claimed perfect recall, the generator would be forced to
hard-condition, and §6 would be impossible. It doesn't, so it isn't.

**OPEN / TENTATIVE — the exact generation order.** The working reconstruction from the
conversation is:

> never start at the root / origin (intractable and pointless); start **shallow**; draw
> priors; the character **emerges forward** from context; extend **deeper only on demand**,
> still as influenced priors **softly biased toward compatibility** with what's already
> committed.

But the **precise start-depth and the fill-direction were not fully nailed down** and are
**OPEN.** Treat the above as a sketch of the intended shape, not a settled algorithm.

---

## 7. The self-binding author — the meta-principle

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

## Settled vs Open

**SETTLED (direction):**

- The world — other agents + circumstance — is the source of formative events; the player
  authors only responses. (§1)
- There is one continuous simulation; chargen is handing control of an agent already inside
  it, not authoring a character; past and present are the same simulation. (§2)
- The present engine has no autonomous ticking (verified against code). (§2)
- Past generation is the *inverse shape* of the present engine, not the present engine on
  autopilot. (§2)
- The ancestral/social graph is a lazy infinite structure; no fixed-depth truncation; pay
  only for forced depth. (§3)
- The target at the leaves is **believability**, not distributional fixpoint (the fixpoint
  idea was explicitly dropped). (§4)
- Believability = conditional plausibility + joint coherence (not marginals) + consistency
  with committed context. (§4)
- Trees/CART for the joint conditional draw (offline-baked regime); LLM at the leaves,
  build-time only, frozen output, for texture only. (§4)
- The agent behavior model is the load-bearing primitive everything reduces to. (§5)
- Generate **prior, never posterior**; **influence, never hard-condition**; bias not clamp;
  best-effort consistency, licensed by memory's lossiness. (§6)
- **Self-binding by construction**: control surface is causes-only; divergence budget;
  no resample-to-taste; the cost (you don't always get the world you wanted) is accepted.
  (§7)

**OPEN:**

- How the two engines (single-protagonist per-minute present vs. many-agent coarse-time
  past) relate concretely — separate simulators, shared core, or otherwise. (§2)
- The exact generation order: precise start-depth and fill-direction; the "start shallow,
  emerge forward, extend deeper on demand" sketch is tentative. (§6)
- All concrete numeric/representational details (tree feature sets, the divergence-budget
  metric and bound, cell granularity, how forcing is triggered and cached) — none of these
  were settled and none should be invented.

---

## Relationship to existing systems

- **`memory.md` — the primary consumer.** Memory is a read-projection over the latent
  ground-truth life. This substrate is **what produces that latent life.** Memory's lossy,
  reconstructive nature is also what *licenses* §6's influence-not-constraint move — the two
  designs are interlocking, not merely adjacent.
- **Event log** (`events.js`). The continuous simulation (§2) writes the dated, NT-stamped
  event spine memory reads. In the present this is the in-run log; the past-generation mode
  must deposit the same shape for pre-game life (this is `memory.md` Stage 1's dependency).
- **Sentiments** (`emotions.md`). Relationships between agents, and a character's accumulated
  feeling toward people and things, ride the existing sentiment system; the generated history
  is what those sentiments are the residue of.
- **NPC dynamic resolution** (`npc-simulation.md`). §3's lazy forcing **is** dynamic
  resolution applied to the *ancestral/historical* graph: a person is forced to the
  resolution play demands, never to zero, never pre-populated to full depth.
- **CART habits** (`habits.md`). The same decision-tree machinery, reused in the opposite
  training regime — offline-baked grounded priors here vs. online-learned habits there. (§4)
- **The neurochemistry engine** (`nt-baseline.md`). Supplies the encoding stamps on
  generated events exactly as it does for in-run events; a generated childhood's emotional
  coloring is a *consequence* of running this engine over a coarse trajectory, not an
  authored field. (Per `memory.md` §4, marked there as approximation debt.)
- **Chargen.** Reframed: chargen is **the present-slice of this simulation** — the moment
  the world has been run up to and control is handed over — not a separate authoring step.
  Today's `chargen.js` legends-compression is the thin placeholder this direction replaces.

---

## Status / phasing

**This is foundational and large.** It is the substrate beneath the deepest layers of the
character model, and it is a **multi-phase direction**, not a near-term build. None of §1–§7
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
