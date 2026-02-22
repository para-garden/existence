# Influences, Prior Art, and Related Reading

Design reference for existence — games, academic work, and background reading
that inform or relate to what this project is trying to do.

---

## Games

### Closest in spirit

**Disco Elysium** (ZA/UM, 2019)
Inner voice as prose, psychology as gameplay, options gated by hidden skill checks.
The closest thing to "text carries everything" in a commercial game. Key difference:
stats are visible (the skill panel), it's entirely authored rather than procedural,
and the framing is investigation/RPG rather than survival/mundane life. The inner
voice system — multiple competing psychological voices surfacing as intrusive text —
is the strongest prior art for NT-shaded prose.

*Gap:* Stats are visible — the skill panel breaks the fiction, enables optimization.
Harry is fixed and authored; zero emergence. The mundane ordinary day doesn't exist
in it — everything is heightened, baroque, significant. No ongoing simulation: the
game doesn't model Harry's neurochemistry drifting across days, only authored scenes
gated on skill values. The combination of authored-quality prose *with* procedural
simulation underneath is unclaimed. So is the ordinary Wednesday.

**Fallen London** (Failbetter Games, 2009–present)
Quality-based narrative: stats are called "qualities" and prose changes based on
their values. High prose quality, hidden consequence chains, skinner box underneath.
The "StoryNexus" engine they built from it is the closest existing tool to a
quality-gated prose system, though stats remain visible to the player.

*Gap:* Stats visible even when called "qualities" — player optimizes because numbers
are present. Explicitly gamified (grinds, card draws, retention loops) — the opposite
of existence's design values. No simulation underneath: qualities are directly tracked
numbers, not emergent from a running model. All content authored. Existence's specific
contribution to what Fallen London started: qualities that emerge from a simulation
rather than being directly tracked and exposed.

**Depression Quest** (Zoe Quinn, 2013)
Options visibly crossed out by depression severity. Gestures at the same design
space — mental state gates what's available — with very thin tooling and authored
(not simulated) state. The crossing-out mechanic is explicit where existence keeps
it opaque; the effect is different.

*Gap:* The visible crossing-out is a statement: *look at what this takes from you*.
Existence makes the removal invisible — the option just isn't there, no explanation.
Very different emotional register: DQ describes deprivation from outside; existence
attempts to make you live it from inside without knowing what you've lost. No
simulation, no emergence, very short authored arc.

**A Dark Room** (Michael Townsend / Amir Rajan, 2012)
Minimal UI, hidden mechanics, prose as primary readout. No simulation underneath
but shares the instinct that chrome gets in the way. The slow reveal of what the
game actually is has no equivalent here, but the austerity does.

*Gap:* The hidden mechanics are genre mechanics (resource management, base building),
not psychology. No character, no interiority — the game is about a colony, not a
self. Has an arc, a revelation, an end. The austerity instinct is right; what's
underneath it is wrong for existence's purposes.

**Façade** (Michael Mateas & Andrew Stern, 2005)
Drama management + real-time NLP + psychologically simulated characters. Academic
game that actually shipped. The drama manager (which decides what story beats to
surface when) is a different solution to a related problem: how does a simulation
know what to show? Prior art for the idea that generative systems can produce
emotionally coherent experiences.

*Gap:* The player is external — visiting Trip and Grace, trying to affect their
relationship. Observational/therapeutic positioning, not identification. You watch
them fall apart; you don't live it from inside. Single scene, scripted states, no
sustained world. The drama manager concept (what to surface when) remains the most
relevant piece for existence's prose generation problem, even though everything
else differs.

### Related by mechanics or tone

**Galatea** (Emily Short, 2000)
Parser IF, single character interaction, extraordinary depth of character simulation
for its era. Emily Short's work generally is the craft reference for interactive
narrative — her blog is more useful than most academic papers.

*Gap:* External — you're talking to Galatea, not being her. Single conversation,
no sustained daily life. Parser interface. The character depth is the lesson, not
the form.

**Howling Dogs** (Porpentine, 2012)
Twine hypertext, fragmentary prose, dissociation as form. Formally very different
but shares the instinct that psychological state can be rendered through prose
texture rather than UI.

**With Those We Love Alive** (Porpentine, 2014)
The game instructs you to draw sigils on your own skin as ritual markers —
body as literal interface. More developed than Howling Dogs in terms of using
prose texture to render psychological dissociation. The most formally interesting
of her work for existence's purposes. Accompanied by a score by Brenda Neotenomie.

*Gap (both):* Authored hypertext — the dissociation and psychological texture are
achieved through writing, not through a running simulation. Compressed and intense
rather than sustained. The instinct (psychological state rendered in prose texture,
not UI) is exactly right; the mechanism is authorship rather than generation.

**80 Days** (Inkle Studios, 2014)
High prose quality in a branching narrative, consequences that accumulate. The
writing is the benchmark for what good choice-based prose sounds like at scale.

*Gap:* Adventure framing with an external goal (circumnavigate the globe in 80
days). Authored, no psychological simulation. No mundane life — everything is
spectacle and incident. The prose quality is the lesson.

**Dwarf Fortress** (Bay 12 Games, 2006–present)
The ur-example of hidden simulation producing emergent narrative. Neurochemistry
(stress, relationships, personality traits) affects dwarf behavior without the
player ever seeing the numbers directly. The lesson: simulation depth generates
story; the UI doesn't need to expose it.

*Gap:* No prose. DF produces no readable output — the emergent narrative exists
in the player's interpretation of simulation events, not in anything the game
writes. External perspective: you manage a colony, you don't live as a dwarf.
DF is the existence proof that deep simulation generates narrative. Existence is
the attempt to close the gap — to have the simulation write the prose directly,
not just produce events the player narrates to themselves.

**Caves of Qud** (Freehold Games, 2015–present)
Deep simulation, procedurally generated history and character backstory. The
character history system (which generates a meaningful past that affects starting
stats) is prior art for the backstory approach in existence.

*Gap:* Roguelike — combat, death, procedural dungeon, visible stats to optimize.
The backstory generates flavor and narrative color; in existence it generates
emotional parameters (neurochemistry targets, inertia, sentiment baselines). The
past produces feeling, not just lore.

### Adjacent by appetite

Games and platforms that prove there's demand for mundane life as game content —
living a life inside a game rather than completing a challenge — through mechanisms
completely different from existence's.

**The Sims** (Maxis / EA, 2000–present)
The canonical mundane-life-as-game-content example. Needs, relationships, jobs,
domestic objects, the passage of days.

*Gap:* Needs are visible bars the player optimizes. You're managing a character
from outside — isometric god-game, not identification. No prose, no psychological
depth, no inner life. The character is a puppet; the player is the person.

**Corruption of Champions** (Fenoxo, 2011–present) and TF games generally
Text-based RPG centered on transformation — the character's body changes based on
choices, and the prose reflects the body's current state in detail. Closest prior
art for body-state-drives-prose as a live mechanic: the text actively reads based
on what the character's body is doing right now, more foregrounded than almost
anything in the "closest in spirit" list.

*Gap:* Transformation and sexuality are the central axis — everything serves that
dimension. Stats are visible and optimized toward. No psychological simulation
underneath; mood and interiority are thin relative to body state. The body-prose
connection is the transferable lesson; the axis isn't.

**Twine sandboxes** (Degrees of Lewdity, Free Cities, and others)
Day cycles, action economy, stat-driven prose and availability, often with complex
underlying simulation. Structurally the closest ancestors to existence's form.
Free Cities (Shael Riley) is an existence proof that Twine can host genuinely
complex simulation — economic systems, psychology, relationships — and surface
it through prose.

*Gap:* Stats visible, player-facing, and optimized toward. Content axis dominates
structure (the simulation serves the content focus). Degrees of Lewdity and most
others have an implicit goal or pressure driving the experience forward. The form
is right; the values aren't.

**Accidental Woman** (ThaumX, ongoing — https://github.com/ThaumX/Accidental-Woman-Public)
Adult life sim, TypeScript + custom SugarCube variant. Relevant as a *systems
completeness* reference, not for tone or approach: body state (measurements,
grooming, hygiene), NPC schedules (NPCs exist in time, not just when you poke
them), hourly time tracking, itemized finances (rent, utilities, groceries, loans,
bank interest), job scheduling and performance. A useful survey of what a thorough
text-based life sim actually tracks at the model level.

*Gap:* Stats visible and player-facing. Adult content is the central axis —
the simulation serves that focus. Design register is completely different from
existence. Use as a systems checklist (what have we not modeled yet?) rather
than a design reference.

**GTA roleplay, Roblox life sims, VRChat, Second Life, Resonite, Discord**
Platforms and modes where people inhabit a character in a shared world and live
a version of mundane life — jobs, housing, relationships, social status — with no
external goal imposed. GTA RP characters go to work, pay rent, manage friendships.
Roblox life sims have people spending hours at a virtual pizza job. VRChat and
Second Life have people maintaining long-term social lives through avatars.

The appetite these prove is real and large: people *want* to live a life inside
a game, not complete one.

*Gap:* All of these are social platforms first. The content is produced by other
players, not by simulation or authored prose — the texture of the experience
depends on who else is there. More critically: they're designed to be enjoyable
social spaces. The friction, isolation, failure, grinding ordinariness, and
potential downsides of real life are exactly what they design away. A VRChat
world doesn't model the anxiety of a rent payment due with $40 in your account.
A GTA RP server doesn't render the prose of 3am insomnia. These platforms are
for socializing in a fictional skin, not for representing what it actually feels
like to be inside a life.

**Small web / indie web** (Neocities, tilde servers, webrings, personal sites)
The contemporary revival of hand-crafted personal pages — shrines, digital
gardens, link blogs, "about me" pages that accumulate slowly without audience
pressure. The appetite being proven: there is demand for spaces that exist
without a goal, without a funnel, without an arc. A Neocities site isn't trying
to do anything. It just is there. That quality — continuous presence without
purpose — is closer to existence's register than any game on this list.

*Form:* Existence is itself a small web artifact. Plain HTML, no framework, no
build step, a game you find through a link and play in a browser tab. No app
store, no monetization, no retention loop. The form is the argument.

*Character worlds:* A character in the 2020s might have or visit such a space —
a shrine to something they love, a dead forum they still check, a Neocities site
someone stopped updating in 2019. The texture of the small web (things that
persist without maintenance, things that went quiet) is available as world detail.

*Gap:* Small web is public-facing — a curated self, shown to someone. Existence
is interior with no outside implied. The "no goal" quality maps; the presentation
layer doesn't. Also: small web aesthetic is often nostalgic, warm, deliberately
retro. Existence is contemporary and unglamorous. Take the continuous presence;
don't take the warmth as default.

### The unclaimed territory

Taking these games together, existence sits at the intersection of things none
of them do:

**Hidden simulation producing readable prose directly.** Dwarf Fortress has
simulation without prose. Disco Elysium has prose without simulation. Everyone
else has authorship. Existence attempts to close the gap: the simulation writes
the prose, not just produces events for the player to narrate to themselves.

**The mundane ordinary life as the subject.** None of these games take place
in the ordinary weekday. Depression Quest comes closest but is a statement, not
a world. Disco is baroque, 80 Days is spectacle, DF is catastrophe management.
The domestic, the routine, the not-eventful — Tuesday — is unclaimed as subject
matter for this kind of game.

**A procedurally generated specific person.** Every game here either gives you
a fixed authored character (Harry Du Bois, Trip and Grace) or a blank stat-sheet
you optimize (Caves of Qud). Existence generates a specific person — backstory,
personality, neurochemistry — and that specific person then lives their life.
The past produces feeling, not just lore.

**Invisible opacity.** Depression Quest shows you the crossed-out options. Disco
Elysium shows you the skill panel. Existence gives you neither — the option simply
isn't there, no explanation. You don't get a readout of what you've lost.

**No arc, no goal, no win state.** This may be the most radical gap. Every one
of these games has either an external goal pulling the experience forward (solve
the murder, circumnavigate the globe) or an authored arc with an endpoint (the
party in Façade, the reveal in A Dark Room). Depression Quest has an ending.
Existence doesn't. It just continues — which is the point.

---

## Academic Work

**TALE-SPIN** (James Meehan, 1977)
One of the first story generation systems. Characters had goals and simulated
problem-solving; stories emerged from their interactions. Foundational for the
idea that narrative can be generated from simulation rather than authored.

*Gap:* TALE-SPIN's model is goal-directed — characters want things and pursue
them; story is the trace of that pursuit. Existence's model is state-directed:
the character doesn't pursue anything, they simply are. TALE-SPIN produces
summarizable narrative ("Joe Bear wanted honey, went to the tree, found it").
Existence doesn't produce a summary; it produces a texture. The success criterion
is completely different — and the academic tradition inherited TALE-SPIN's framing
without questioning it.

**Expressive Intelligence Studio** (UC Santa Cruz — Michael Mateas, Noah Wardrip-Fruin et al.)
The academic home of most serious interactive narrative research. Work on drama
management, procedural authorship, and the Facade system. Wardrip-Fruin's
*Expressive Processing* (2009) is the closest thing to a theoretical foundation
for this kind of work.

*Gap:* Drama management assumes a library of authored story beats to select and
sequence. The player has goals the drama manager should serve. Existence has
neither beats nor player goals — continuous state generating prose, no authored
units to manage. The core question (how does a simulation decide what to surface
when?) is still unanswered by the EIS tradition for a goalless, beatless system.

**Natural Language Generation (NLG) literature**
The pipeline in existence (observations → realization → surface text) maps onto
classical NLG architecture: content determination → document planning → surface
realization. The realization.js architecture specifically is a stripped-down
surface realizer. Relevant overview: Reiter & Dale, *Building Natural Language
Generation Systems* (2000) — dry but foundational.

*Gap:* Classical NLG is designed for information delivery — weather reports,
financial summaries, medical descriptions. Content determination asks "what facts
need to be communicated?" Existence's content determination asks "what is the
character noticing, and what emotional register does it land in?" — not a
facts-communication problem at all. NLG assumes you know what you want to say and
need help saying it correctly. Existence has to figure out what to say at all.

**Emily Short's blog** (https://emshort.blog)
Practical interactive fiction craft from someone who has thought harder about
these problems than almost anyone. Especially relevant: writing on character
simulation, procedural generation of narrative, and quality-based narrative design.
Not academic but more useful than most papers.

*Gap:* Short's work is in authored systems — her craft is how to write and
structure content that responds to state. Her methods scale with authorship effort.
Existence needs methods that scale with the state space: the simulation must do
more of the work than any human author can. Her principles are right; the
engineering problem at existence's scope is beyond what authorship alone can solve.

**Interactive Storytelling / ICIDS conference proceedings**
Annual conference on interactive digital storytelling. Most directly relevant
work on drama management, player modeling, and procedural narrative tends to
appear here first.

*Gap:* Oriented toward coherent authored narrative with evaluable structure.
Existence produces something the academic tradition doesn't have a good evaluation
framework for: not a narrative, but the texture of experience — continuous,
goalless, without arc. "Did it produce a coherent story?" is the wrong question.
The right question is closer to "did it make you feel like you were there?" and
that's much harder to measure.

### What the academic work doesn't address

The through-line across all of it: this literature is oriented toward *narrative*
— story with coherent structure, beats, arcs, something you could summarize. That
framing goes back to TALE-SPIN and runs through drama management, NLG, and most
ICIDS work.

Existence isn't producing narrative. It's producing *experience* — the texture of
being in a particular state on a particular day, continuous and without arc. A
good session of existence doesn't produce a story you could tell someone. It
produces the feeling of having lived a few hours inside a specific life. Those are
different things, and the academic tradition conflates them.

The second gap: nearly all of this work predates LLM-assisted authorship. The
techniques are rule-based, symbol-manipulation, handcrafted at every level.
Existence's approach — a running simulation selecting and weighting from
human-authored prose pools, developed in collaboration with an LLM — is a hybrid
that doesn't have good academic framing yet. The closest framing is probably
"procedural rhetoric" (Bogost) applied to lived experience rather than argument,
but that's a stretch.

---

## Background Reading — Simulation Systems

**Why We Sleep** (Matthew Walker, 2017)
Pop science but a useful overview of sleep architecture, adenosine mechanics,
REM vs deep sleep function, and sleep debt. Treat specific numbers with caution
(some have been disputed) but the qualitative model is sound. Informed the
sleep architecture in state.js.

*Used / gap:* Walker is orientation — the qualitative model. The actual
calibration work in the codebase cites primary literature (Borbély 2022,
Blume 2023, Van Cauter 2000, Renner 2022, Dijk 1999), not Walker. Walker also
doesn't cover phenomenology: what it actually feels like from inside to be
chronically undersleeping. The neuroscience is here; the texture of living it
has to come from elsewhere (prose reference, personal knowledge, other sources).

**Emotional inertia**
Kuppens et al. have published on emotional inertia (how sticky mood is over time)
as a trait variable. The Houben et al. (2015) study specifically on rumination,
neuroticism, and self-esteem as predictors of inertia is cited in the codebase.
Search: "emotional inertia rumination neuroticism" for the cluster of work.

*Used / gap:* The personality predictors and their weights are implemented and
cited. What remains unused: the literature on situational inertia changes —
how inertia increases during depressive episodes, under chronic stress, with
sleep deprivation. The state modifiers we added (adenosine > 60, stress > 60)
approximate this but aren't grounded in specific effect sizes from the literature.

**Perceptual habituation / orienting response**
The habituation + change-detection model in senses.js maps onto well-established
perceptual psychology. Sokolov's orienting response research (1960s) is the
classical foundation. More accessible: any cognitive psychology textbook chapter
on attention.

*Used / gap:* Short-term within-session habituation and change-detection spike
are implemented. What Sokolov's model distinguishes — and what we haven't yet
built — is long-term stimulus habituation: the brain builds a neural model of
the expected environment, so a familiar apartment is more habituated than a new
one. This distinction supports the long-term habituation TODO: it's not just an
obvious simulation feature, it's what the literature predicts.

**Acoustic physics**
No single reference — the acoustic adjacency model (flooring, openness, voids)
is applied physics more than academic work. Architectural acoustics textbooks
cover reverberation time (RT60), absorption coefficients by material, and sound
transmission between spaces.

*Used / gap:* The conceptual model (flooring type, room openness, voids as
acoustic chimneys) is established but unimplemented. The actual physics —
RT60 calculations, absorption coefficients per material, transmission loss between
spaces — is approximation debt waiting for the system to be designed. When the
acoustic adjacency system is built, this is where to find the numbers.

### Pattern across the background reading

Sleep is the one area where background reading led to specific calibrated
parameters with retrievable citations. Everything else — inertia situational
modifiers, long-term habituation rates, acoustic physics, and all the identity/
plurality/social literature — has been used to establish structure and design
direction, with specific numbers remaining approximation debts.

The pattern is right: use literature to design the model, then calibrate from
primary sources. The calibration work on the non-sleep systems is ongoing debt,
not a failure of the approach.

---

## Further Reading — Identity, Plurality, Attachment

**Parasocial relationships**
Horton & Wohl, "Mass Communication and Para-Social Interaction" (1956) — the
original paper coining the term. Foundational for the concept of one-sided
intimacy with media figures. More recent work on parasocial relationships in
streaming and social media contexts is extensive; specific papers need
verification before citing. The simulation note in player-character.md (social
score partially maintained, connection quality not) would benefit from grounding
in the empirical literature on what parasocial contact does and doesn't substitute
for.

*Used / gap:* Used to establish the concept and design the player-character.md
section. No simulation parameters derived from it yet — none of the parasocial
mechanics are implemented. When they are, the empirical literature on what
parasocial contact actually does to loneliness and wellbeing (does it buffer,
does it displace, does it depend on reciprocity perception?) needs to feed the
model. The "social score partially maintained, connection quality not" note is
a design decision that should eventually be grounded in data.

**Plurality and DID**
Clinical literature on DID is often pathologising by default and should be read
critically. Community resources are more useful for the lived experience:
- The Plural Association (https://www.pluralassociation.org) — community advocacy,
  non-pathologising framing
- More Than One (https://www.more-than-one.com) — plurality resources
- Multiplicity and Me — personal accounts

For DID specifically: the academic literature on misdiagnosis (DID presenting as
schizophrenia) and the effects of antipsychotics on dissociative systems is
relevant but contested — needs careful reading. Search terms: "DID misdiagnosis
antipsychotics", "dissociative identity disorder treatment controversy."

*Used / gap:* Used to design the DID and plurality sections of player-character.md.
No implementation yet — none of this has fed simulation parameters because the
system doesn't exist yet. The literature is ahead of the code. When DID chargen
is built, prevalence data and the constitutional/circumstantial distinction will
need careful grounding. Community resources should take precedence over clinical
literature for design choices about how to render the experience.

**Fan communities and fandom**
The academic field of fan studies has substantial literature. Key entry points:
- Henry Jenkins, *Textual Poachers* (1992) — foundational fan studies text,
  participatory culture, fan labour. Dated in some respects but still the
  standard starting point.
- Abigail De Kosnik, *Rogue Archives* (2016) — fan labour, digital preservation,
  the work fans do that institutions don't.
- Fandom as found family and identity: fan studies journals (Transformative Works
  and Cultures — open access) have extensive recent work on fandom and identity,
  particularly for marginalised communities for whom found-family fandom is primary.
- Creator-fandom rupture: no single canonical text, but well-documented in
  journalism and fan studies. Search: "fan community collapse", "creator fandom
  betrayal", parasocial rupture.
- RPF ethics: no canonical academic treatment. Community norms documented in fan
  studies journals and fan wikis. Central tension: using a real person as fiction
  subject without consent vs. fiction as clearly-framed imaginative construction.
  Search: "real person fiction ethics", "RPF fanfiction". Anne Jamison,
  *Fic: Why Fanfiction is Taking Over the World* (2013) — broad coverage including
  RPF; specific chapters vary in rigour.

*Used / gap:* Design orientation for player-character.md. No implementation.
The specific simulation debt — social score contingent on shared object, rupture
collapsing connection rapidly — needs the empirical literature on how fandom
collapse actually affects social wellbeing before it can be calibrated.

**Tulpas**
The tulpa community has extensive self-documentation. The Tulpa.info guides and
associated Reddit community (r/Tulpas) are primary sources for practice and
experience, written from inside rather than from clinical observation.

*Used / gap:* Design orientation. No implementation. The community literature
would be the primary source for how tulpa relationships affect loneliness, social
need, and identity — relevant when the plurality mechanics are built.

---

## Atmosphere — Music and Lyrics

Tonal references: not templates to copy or over-optimize toward, but useful for
calibrating the emotional register the prose is working in. Survey, don't absorb.

### ROMA (ROMALOID)

ROMA releases under a free-use license — lyrics can be copied directly into the
repo. All sources (stems, lyrics) for all songs:
https://drive.google.com/drive/folders/1w8VHY8J7a_llbiE6TzgtPXetDUyfEBYw

Links:
- YouTube: https://www.youtube.com/@ROMALOID / https://www.youtube.com/channel/UCKpEbWofm25BKX62VL9C--Q
- Spotify: https://open.spotify.com/artist/1GBhDrmf2fvZOEjKLUobEF
- Deezer: https://www.deezer.com/us/artist/240794
- Twitter: https://x.com/Romadoingstuff
- Instagram: https://www.instagram.com/romamakesbanger/
- TikTok: https://www.tiktok.com/@tobeyye

**BURNOUT — ROMA ft. Kasane Teto** (`atmosphere/burnout-roma.txt`)
- https://www.youtube.com/watch?v=J5SbnFwKaHc
- https://open.spotify.com/track/5J7kW6hFnHcUayCv0vg4Iu
Somatic language for stress and exhaustion ("a stone that's crushing me on top
of my chest"), dissociation as fading ("1000 miles an hour I come back home and I
/ fade, fade"), motivational collapse ("I don't wanna try"). Most relevant:
"I take the pain and lock it deeply / cause I deserve it" — the self-suppression
and internalized shame loop that the game's "no judgment" principle is specifically
responding to. The game doesn't tell the character they deserve it; it just shows
what the days look like.

*Register limit:* ROMA is confrontational — "why am I the one getting punished
for it?" It argues with an outside. Existence doesn't. The character isn't angry
at external judgment; they're inside the days, not addressed outward.

**NEURODIVERGENCE — ROMA ft. GUMI** (`atmosphere/neurodivergence-roma.txt`)
- https://www.youtube.com/watch?v=DCyRVr9lcZI
- https://open.spotify.com/album/5ahVGYp6RssaF7GHJ6dFSO

No official English lyrics — reconstructed from phonetic transcription against
Portuguese subtitles (trans. Konny @konnyoung); "your life's so dull" and
"no spirit, no ember" confirmed. The normative daily schedule as
external pressure ("wake up at seven o'clock / this is how it's supposed to be /
keep a radiant smile / so the others see"). Alienation from the performance of
normal: "what you like, what you talk, what you strive / I can't imagine being
like you." The bridge: "every time a smile appears / it only gives me chills / I
don't agree with these styles / but I keep it to myself." The concealment is
involuntary — not a choice but a survival mechanism, which maps onto how the game
renders the character's interior without ever surfacing it as a label.

*Register limit:* Same as BURNOUT — addressed outward, confrontational. The
concealment and alienation are the applicable parts, not the protest.

### Porter Robinson

*nurture* (2021) is the most directly relevant — an album about depression and
creative block rendered with emotional precision rather than spectacle. Small
moments carry disproportionate weight. "Musician" is about being shaped into what
someone else had in mind; "Mirror" is self-criticism as an inescapable loop.
The whole album models the experience of being unable to produce the self you
intended to be — which maps directly onto existence's "power anti-fantasy" framing.

*Register limit:* nurture arcs toward recovery — "look at the sky, I'm still
here." It earns relief and beauty through difficulty. Existence doesn't arc toward
recovery; it just continues. Don't let nurture pull the prose toward resolution
it hasn't earned.

### Mitski

The specific skill: domestic scenes (washing dishes, sitting at a table, lying in
bed) rendered with emotional weight that isn't explained or justified. The mundane
is allowed to be enormous. "Working for the Knife" (*Laurel Hell*, 2022) — labor,
exhaustion, creative suppression. "The Deal" — obligation vs desire with no
resolution offered. "Nobody" — loneliness as absurdist comedy. Her albums
*Puberty 2*, *Be the Cowboy*, and *Laurel Hell* are all relevant to the register
existence works in moment-to-moment.

*Register limit:* The most directly applicable reference. What breaks: Mitski's
songs have a "you" — there's an address to another person, a relationship as
subject. Existence's second-person is interior, not addressed outward. The
emotional weight without the address is what to take.

### Vocaloid / UTAU

**Ghost and Pals** — English-language vocaloid producer. Extremely precise about
self-suppression and the gap between internal and external state. "Alter Ego",
"Theorem of the Heart". The masked/performed self vs the interior one is a
persistent theme.

*Register limit:* Theatrically stylized even at its most precise. Existence aims
for the mundane version of the same territory — the mask you don't notice you're
wearing, not the mask as aesthetic object.

**Kikuo** — dissociation, the body rendered as strange and unreliable. Emotionally
unsettling without being melodramatic. "I'm Sorry, I'm Sorry" is the canonical
reference point.

*Register limit:* Consistently unsettling — useful for specific high-adenosine,
dissociation states, but not the whole texture. Existence also needs the quiet
and ordinary. Kikuo is a mode, not a baseline.

**Maretu** — burnout, perfectionism, self-criticism as a loop. "Coin Locker Baby",
"Magical Doctor". Similar territory to ROMA but more abrasive.

*Register limit:* The abrasion may be too heightened for existence's register.
Useful as a pressure reference; don't let it pull prose toward confrontation or
melodrama.

### Adjacent artists (same register)

**Japanese Breakfast** (Michelle Zauner) — grief and mundane detail woven together,
*Soft Sounds from Another Planet* especially. **Soccer Mommy**, **Big Thief /
Adrianne Lenker** — domestic precision, body, relationships rendered without
sentimentality. All work in the same territory of mundane-rendered-heavy.

*Register limit:* These artists all have a subject — a specific person, a
specific loss. Existence's loneliness is structural, not about a particular absent
person. The domestic precision without sentimentality is the applicable part.

### The shared register and where it ends

What all of these references share: emotional weight carried in ordinary detail,
the interior state rendered without being named or explained, the mundane allowed
to be enormous. That's the target.

What they collectively don't do — and what existence has to do without — is have
a subject or an address. A song is always *about* something and usually addressed
*to* someone. Even the most interior of these has an outside implied: a "you,"
a world being argued with, a specific loss being circled. Existence has neither.
The prose is interior with no outside implied. That's the part none of these
references model directly — not because it's rare in art, but because songs
structurally require address and existence structurally refuses it.

---

## On the LLM Development Model

This project is developed with an LLM (Claude) as a research collaborator —
holding design context, researching real-world mechanics, authoring lexical sets,
and maintaining consistency across a large codebase. This development model doesn't
have good prior art yet. The closest analogies are pair programming and having a
generalist research assistant, but neither captures what it actually is.

Worth noting: most of the simulation fidelity in this project (neurochemistry
calibration, sleep architecture, acoustic physics, emotional inertia weights) was
reached by researching the actual literature and deriving from it, rather than
inventing plausible-sounding numbers. That research capacity — quickly surveying
a domain, finding the relevant findings, and translating them into simulation
parameters — is what makes the LLM collaboration specifically useful here. It
compresses weeks of background reading into hours.

**What it actually does.** Beyond research: holds design context across a large
and growing document set; flags inconsistencies between systems; implements code
from spec; writes design documentation; surfaces connections between things said
in different sessions; notices when a design decision contradicts an earlier
principle. The context-holding capacity is underrated — a human collaborator would
also lose context between sessions, and existence's design space is now large
enough that no single session covers it.

**What it isn't.** Not pair programming — there's no shared persistent context
between sessions; the docs are the mechanism for continuity, not memory. Not a
research assistant — also implements. Not ghostwriting — the human makes all
design decisions; the LLM researches, implements, and surfaces what's been missed.
The "no" is always the human's. A closer description: the human holds the vision
and makes all decisions; the LLM holds the working context, does the research
and implementation work, and flags gaps. The vision is not collaborative; the
execution is.

**The context-persistence problem.** Sessions end and context resets. MEMORY.md,
CLAUDE.md, STATUS.md, and the docs/design/ tree are the continuity mechanism —
they exist so nothing lives only in chat history. This is a structural challenge
that pair programming doesn't have (a human collaborator remembers yesterday) and
that shapes how the project must be documented. Every design decision that matters
must be written down immediately, not because the human will forget but because
the LLM will.

**Known failure modes.** The most dangerous: inventing plausible-sounding
rationales for numbers that were chosen rather than derived. "Adults get 4–5 colds
per year therefore 0.7%" is rationalization if the 0.7% came first. The LLM is
fluent at producing rationale; fluency is not the same as derivation. CLAUDE.md
names this explicitly: approximation debt honestly named is acceptable; a comment
that implies derivation when there was none is not. This failure mode requires
active resistance — the LLM will produce confident-sounding calibration prose
whether or not the number is grounded.

**The authorship question.** Directly addressed in the pteraworld essay "The great
deceit": the ideas came from human conversations; the writing was done by a language
model; the human kept what felt true from their own experience. Whether that
constitutes "AI-written" depends on what you think writing is. The project doesn't
hide the collaboration — this section exists — but also doesn't foreground it as
the thing the game is about. It's a development method, not the subject matter.
