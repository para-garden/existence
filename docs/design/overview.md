# Simulation Design

The simulation behind the prose. None of this is visible to the player. Text carries everything.

See [philosophy.md](philosophy.md) for the architectural principles that apply across all systems: the interface model, granularity-per-run, and the treatment of scalars as approximation debts.

## Core Principles

**Prose leads, simulation follows.** If the text needs a phone inbox to feel real, build the inbox. If a character's age changes what financial stress looks like, the simulation models that. Don't hollow out prose to match a thin sim — deepen the sim to support the prose.

**Gradients, not binaries.** Nothing in the simulation switches on or off at a threshold. State shapes experience continuously — what's available, what it costs, how the prose reads. And how a state value *feels* depends on who the character is, not just the number. Someone who grew up hungry flinches at prices the same way at $200 that someone else doesn't at $5 — the scarcity is in the person, not the bank account, and it doesn't leave when the number goes up. The same principle applies everywhere: energy, hunger, stress, social connection, job standing. Current value filtered through history and character. The simulation never runs out of content at an extreme — it finds what life looks like there, and at every point along the gradient there's *something* you can do, even if it's worse, harder, or more desperate than what was there before.

**There is no single path.** The same need has different solutions depending on who the character is and what they have access to. Laundry means in-unit machines for some characters, a building laundry room for others, a trip to the laundromat, hand-washing in the sink when money is tight. Getting to work means a car, or a bus, or walking, or calling in because you can't face it today. Eating means cooking, or takeout, or the corner store, or the food bank, or nothing. When designing any mechanic, the first question is: what does this look like for someone with fewer resources, less time, worse options? That version is as real as the comfortable one — often more real, for more people. The world doesn't give everyone the same options. That's not a detail. It's the point.

**Simulation internals are hidden. Player choices are explicit.** The simulation runs a lot of numbers — NT levels, energy, stress, job standing, drift rates, RNG seeds. The player never sees any of them. What they see is what those numbers produce: prose with a different weight, an option that isn't there today, a cost that feels higher than it should. The model's accounting stays private.

This is different from saying no quantities ever appear. The world has numbers in it — bus fares, grocery prices, a bank balance, the time. The character knows these things, roughly, the way a person does: imprecisely, through experience, not as a readout. Those surface in the character's own terms. What doesn't surface is the simulation's internal state: the serotonin value, the energy integer, the stress scalar, the job standing score. The player lives in the world. They don't have access to the model.

The second half of this: when the player is making a choice that involves a quantity — how much to send a friend, how many items to buy — that quantity belongs to them. Don't substitute it with a game-determined constant or a random draw. Build the input. The simulation models what follows from choices; it doesn't make choices on the player's behalf. The test: is this number a fact of the world the character would know, or a consequence the simulation is computing? Facts of the world surface (in character-appropriate form). Simulation consequences stay hidden. Player decisions need player input.

**Absence and inaction are different things.** The game runs in a browser tab. The player might walk away — to make dinner, to sleep, to forget about it for a week. That's absence, and the game should handle it cleanly: pause, step-away, detect the empty chair. The game should never generate content into nothing — no scrollback of events nobody saw, no time advancing into the void. But the player might also be *there*, staring at the screen, choosing not to act. That's inaction, and it's real. The weight of not starting, the ceiling, the phone you're not picking up. The game should support that as a first-class experience — time passing, the mind wandering, the silence that isn't empty but heavy. These are opposites and the game must distinguish them.

**No false repetition.** Seeing the same text twice breaks the fiction. The game said it; the world doesn't unsay things and say them again. Text reuse is only acceptable when the repetition is genuinely realistic — a sound that recurs, a routine that repeats because routines do. Never to fill space, never because the pool ran out, never because the system fired again and had nothing new to say. If there's nothing new to say, say nothing. Events should surface *new information* — state transitions, things that changed, arrivals. Not re-announcements of ongoing state. You discover you're hungry once. After that, the hunger lives in the prose — shorter sentences, distracted descriptions, what you notice and don't. Not another event telling you what you already know.

**Unfiltered.** The game doesn't protect the player from the experience. It puts them in it. Foster care isn't a backstory tag — it's the garbage bag instead of a suitcase, the bed that smells wrong, the social worker who decides things about your life while you sit in the hall. Poverty isn't a modifier — it's the rice again, the bus that takes 90 minutes, the overdraft fee for being broke. The game fosters understanding by making you live it from inside, not by describing it from a distance. If the game is going to represent a life, it represents the texture of that life honestly — the daily reality, not a summary of it.

This doesn't mean gratuitous depiction — lingering on violence for shock, dramatizing trauma for effect. It means *realistic* depiction at the level the character lives it. If Tuesday includes shouting through the wall, the game includes shouting through the wall. If Tuesday includes the bruise you explain at work, the game includes that. If Tuesday is quiet and heavy and nothing happens but you can't breathe, the game includes that too. The game doesn't linger for shock. It also doesn't look away for comfort. It depicts what's there, at the volume it's actually at, and trusts the player to feel it.

## What the Game Is

A day. Then another day. The experience of being alive inside constraints you didn't choose and can't fully see. You wake up, or you don't. You go to work, or you don't. You eat, or there's nothing in the fridge. The game doesn't tell you what to do. It doesn't tell you what you should have done. It shows you where you are and what's available, and the texture of that changes depending on everything underneath.

No win state. No fail state. No score. No judgment. Just the next moment, and the one after that.

## Time

Time is the core constraint. Everything costs time. Getting dressed, eating, commuting, working, staring at your phone, lying in bed not sleeping. Time doesn't stop. It doesn't wait for you to be ready.

### Continuity

There are no days. There's just time. The simulation tracks minutes since the game started. Hour 25 exists. Hour 40 exists. The world doesn't reset at midnight — midnight is just a time. What most people call "a day" is the stretch between when they woke up and when they stopped, and that stretch doesn't have to be 16 hours, doesn't have to start in the morning, doesn't have to contain anything in particular.

Night shift workers sleep at 8 AM. Insomniacs sleep at 4 AM or not at all. Depressed people sleep at 7 AM and wake at 3 PM. Someone pulling a double doesn't sleep between shifts. A parent with a newborn sleeps in fragments. The simulation doesn't impose a structure. It provides time and lets the character exist in it.

### World rhythms

The world has patterns that aren't yours. Work has shifts. Stores have hours. The sun rises and sets. Friends text during certain hours and go quiet at others. Traffic has peaks. The neighborhood is louder at some times and quieter at others. These rhythms exist whether or not you're aligned with them. Being awake at 3 AM when the world is asleep is a specific texture. Being asleep at 2 PM when the world is moving is another.

The light changes. This is the most basic rhythm. Daylight and dark aren't just atmosphere — they mark the world's expectations. Being up in the dark when you should be sleeping. Being asleep in the light when you should be up. The "should" is the world's, not the game's. The game doesn't judge.

**The week has a shape (implemented).** Weekdays and weekends are distinct. The specific weight of Sunday evening — the week-dread, the week ahead assembling itself — is different from Saturday afternoon. Weekend idle thoughts have their own texture: the morning that's open, the afternoon already half-gone, the evening where things are happening somewhere else. Work schedule derives from the character's labor arrangement — fixed (office: Mon–Fri), rotating (retail/food_service: includes weekends), or on_demand (day-by-day reveal). The bus route to work is gated by `isWorkday()`, which is now schedule-derived — rotating workers can commute on Saturdays.

### The alarm

The alarm is a negotiation between the person who set it and the person who hears it. Those are different people — separated by sleep, by how the night went, by what the body decided overnight. Snooze is always available. Turning it off is always available. Not setting one is available. The alarm doesn't judge. It just makes a sound at the time you told it to, and then you decide.

### Time perception

You don't always know what time it is. Awareness of time degrades with distance from the last time you looked at a clock. The further you drift from a direct observation, the vaguer your sense becomes:
- Just looked: "9:15 AM"
- A while ago: "around 9:15"
- Longer: "sometime in the morning"
- Much longer: "The light has shifted. Morning still, probably."

This isn't a mechanic the player sees. It's how the prose renders time. Checking a clock (phone, microwave, alarm) resets the fidelity. Not checking lets it drift. At extreme fatigue or distraction, even recent observations blur.

## The Body

The body is a constraint, not a resource to manage. Energy, hunger, and stress aren't stats the player optimizes — they're the physical reality that shapes what's possible and how everything feels.

### Energy

You wake up with whatever sleep gave you. Everything costs energy. Some things cost more when other states are bad (hungry and tired together is worse than either alone). Energy isn't a battery with a percentage — it's the difference between "I could do that" and "I can't right now."

Tiers: depleted → exhausted → tired → okay → rested → alert. Most of the game lives in the tired-to-exhausted range. "Alert" is rare and fleeting. "Depleted" means even thinking about doing things takes more than you have.

**Energy ceiling** — not everyone recovers to 100. Chronic conditions, disability, pregnancy, chronic pain — the maximum achievable energy isn't always the same. A migraine or illness flare caps the ceiling; even a full night's sleep doesn't restore past it. Post-vasovagal recovery also cuts the ceiling while the body recalibrates. The ceiling is the body's budget, and some bodies have less to spend. This interacts with everything — fewer interactions available, more things that cost too much, the prose carrying the weight of a body that can't fully fill.

**Passive energy drains** — the current flat `hours × 3` drain doesn't capture what the body is actually doing. Standing all shift (retail, food service) is a different energy cost than sitting at a desk (office). Pregnancy is a constant background drain. Chronic pain. Carrying extra weight. The body taxes you differently depending on what it's dealing with, and those taxes compound with hunger and stress. Not implemented yet — the architecture should expect per-body drain rates rather than a universal constant.

### Hunger

Hunger builds over time. Eating resets it. Not eating makes everything harder — energy drains faster, focus drops, the prose gets shorter and more distracted. The fridge might be empty. The store costs money. Eating might mean standing at the counter shoveling food too fast because your body stopped asking and started insisting.

### Stress

Stress accumulates from obligations, money anxiety, work pressure, being late, the apartment being a mess. It reduces from rest, social contact, small actions (doing the dishes, showering). High stress changes the prose tone — everything is tighter, louder, closer to the edge. Stress decays exponentially toward zero; the rate depends on rumination (high rumination slows recovery, halving the rate at maximum). There is no self-reinforcing threshold — the resistance to recovery IS the real phenomenon.

### Sleep

Sleep is an action, not a phase. You choose to lie down — or the body chooses for you. Time passes. You wake up, or the alarm wakes you, or a sound wakes you, or nothing wakes you for a very long time.

**Falling asleep** — not instant. You lie down and time passes before sleep comes. How long depends on stress, caffeine, substances, the body's state, what you're thinking about. Some nights it takes five minutes. Some nights you stare at the ceiling for two hours and sleep never comes. Insomnia isn't a condition flag — it's what happens when the body won't cooperate, and it can happen to anyone on a bad enough night.

**Duration** — the body has an amount of sleep it needs, and that amount varies by person, age, condition, how depleted you are. The alarm might cut it short. You might sleep through the alarm. You might wake up naturally at 4 AM and not be able to go back. Oversleeping is real — the body taking more than it needs because getting up means starting, and starting is the hard part.

**Quality** — not all sleep is the same. Hours spent aren't hours recovered. Stress degrades sleep quality. Hunger. Substances (alcohol disrupts sleep architecture even when it helps you fall asleep). Pain. Noise. The body's own rhythms. You can sleep eight hours and wake up tired. The simulation models recovery as a function of duration and quality, not duration alone.

**Recovery** — sleep restores energy, but not to full and not linearly. Deep depletion doesn't fix in one night. The body pays back sleep debt slowly, over multiple sleeps, and the interest rate is high. One good night after a week of bad ones doesn't make you rested. It makes you slightly less destroyed.

**Waking up** — the transition from sleep to awake isn't a switch. It's a gradient. The alarm goes off and you're not yet a person. The first minutes are fog. Decisions are harder. The snooze button exists in this fog. Getting out of bed is the first thing you do and some days it's the hardest thing you do.

**Not sleeping** — what happens when you don't. The simulation doesn't hit a wall at 24 hours. It degrades. Focus goes first — interactions take longer, cost more, produce worse results. Then mood drops — everything flattens, then frays. Then the prose changes — shorter, less detailed, the world getting further away. Then options disappear — things you could do, you can't start. Then the body might override you — falling asleep on the couch, at the table, wherever you stopped. This isn't a game over. It's a body doing what bodies do.

**Sleep and substances** — caffeine delays sleep onset. Alcohol makes you fall asleep faster and sleep worse. Cannabis suppresses dreaming, and stopping it brings dreams back with a vengeance. Nicotine withdrawal disrupts sleep. Stimulants can make sleep impossible for a day or more. Each substance has its own relationship with sleep, and the simulation models them specifically.

#### Sleep debt

The body keeps a running ledger. Ideal sleep is 480 min/day. Sleeping less adds the full deficit to the debt. Sleeping more repays at only 33% — you can't bank sleep. Debt caps at 4800 minutes (10 days). The interest rate is high: one good night after a week of bad ones barely dents the total.

Effects are continuous, not threshold-based. Dopamine target drops once debt exceeds 120 minutes (max -10); serotonin target drops past 360 minutes (receptor desensitisation requires sustained restriction — max -8). Emotional inertia increases with debt (moods get stickier), and energy recovery suffers diminishing returns (penalty = 1/(1+debt/1200) — at 2 days deficit, recovery is ~60% effective). Four tiers for prose selection: none/mild/moderate/severe.

#### Sleep architecture

Sleep unfolds in cycles of variable length, averaging ~90 minutes and fixed per character at chargen (truncated normal: mean 93 min, SD 12, range 70–120; Blume et al. 2023 PSG data — 1 charRng call). Early cycles are deep-sleep heavy (50%→35%→20%); later cycles are REM heavy (10%→22%→29%→36%). `State.sleepCycleBreakdown()` models this from duration and the character's `sleep_cycle_length` — no PRNG consumed at sleep time.

Deep sleep is the adenosine clearing mechanism. Short sleep (1–2 cycles) gets plenty of deep sleep but misses the REM-heavy later cycles. Long sleep (5+ cycles) maximizes REM. Adenosine clearing scales with deep sleep fraction. NE clearing scales with REM fraction × quality (REM is the NE-free environment). Emotional processing quality incorporates REM fraction — more REM = better sentiment attenuation during sleep.

Sleep inertia: being pulled out of deep sleep in an early cycle produces the worst waking fog (0–0.6 scale). Used in prose — the alarm that rips you out of something deep feels different from the one that finds you already surfacing.

#### Melatonin and daylight

Melatonin isn't purely cosmetic anymore. Four modifiers on the base circadian curve:

- **Daylight exposure** (+10 at night if ≥120 min of outdoor daytime light). Tracked per wake period. Outside = 1.0 rate, inside = 0.15. Reset on wake.
- **Phone screen** (-15 when viewing phone at 21:00–5:00). Blue light suppresses melatonin.
- **Indoor evening** (-3 when inside at 19:00–21:00). Dim indoor light delays onset.
- **Fall-asleep delay** (melatonin >60 → 0.7x delay, <20 → 1.4x). Applied as a multiplier, no new RNG.

#### Sleep quality

Quality is multiplicative from six factors: stress (overwhelmed 0.82×, strained 0.91×), hunger (starving 0.88×, very_hungry 0.94×), rain comfort (up to +0.04), melatonin at onset (>60 → 1.03×, <25 → 0.90×), circadian alignment (daytime 0.75×, early morning 0.90×), and caffeine interference. Adenosine crash penalty removed — high adenosine drives more deep SWS, not less.

#### The alarm as negotiation

The alarm resolves inside the sleep interaction — when it truncates sleep, the interrupt fires and records a `woke_by_alarm` event. Then two new interactions appear: **snooze** (9 minutes, tiny energy, prose escalates from fog through negotiation to guilt) and **dismiss** (clears the alarm state, prose varies by snooze count). Both are normal recorded actions — replay-safe, deterministic.

Snooze prose layers: first press is pure fog (the hand acting before the person). Second is negotiation (knowing you should, staying anyway). Third+ is guilt (losing time, aware of it, doing it anyway). NT-shaded throughout: adenosine depth, serotonin reluctance.

Auto-advance approaching prose for snooze: "Your hand is already moving." / "Again." For dismiss: "Up." / "Enough. Up."

### The body as prose

None of these are numbers the player sees. They show up as: which interactions are available (can't do dishes if energy is too low), how the prose reads (the same room described differently at different energy levels), what idle thoughts surface (hunger thoughts when starving, exhaustion thoughts when depleted).

## Health

Health is terrain, not a problem to solve. A chronic condition isn't a debuff — it's the ground you walk on. The game models health as constraints that shape daily texture, not as obstacles on a path to "better."

But not all health effects are ambient texture. Some are concrete mechanical changes — hard modifications to what's physically possible.

**Two kinds of effect:**

**Texture** — how things feel. Energy baseline shifts, stress thresholds change, prose reads differently, interactions cost more. Depression doesn't remove "go to work" — it makes getting there feel like dragging yourself through concrete. This is the ambient layer.

**Concrete changes** — what's possible. An amputation removes or fundamentally alters specific interactions. One arm means cooking is different, carrying things is different, getting dressed is different. A wheelchair means stairs don't exist as a path. Blindness means the phone is a different object. An autoimmune flare means today, right now, certain things cannot be done — not "they're harder," they're gone. These are hard simulation changes: interactions appear, disappear, or transform. The game doesn't soften this. The interaction isn't there. That's the reality.

Most conditions have both. Diabetes is mostly texture (the daily management, the anxiety, the cost) until a blood sugar crash makes it concrete (you can't do anything right now). Chronic pain is texture most days (everything costs more) and concrete on bad days (you can't stand long enough to cook). The simulation needs to handle both — the ambient weight and the hard walls.

### Physical health

**Chronic conditions** — diabetes, chronic pain, autoimmune disorders, migraines, asthma, heart conditions, blood pressure. These aren't events. They're daily. You manage them or you don't, and managing them costs time, money, energy, and attention. A good day means the condition is background. A bad day means it's everything.

Each condition has its own texture:
- Diabetes: blood sugar monitoring, insulin, dietary restrictions, the cost of supplies, the fear of episodes, stress making it worse, the way it touches every decision about food.
- Heart conditions: medication that you can't skip, activity limits you didn't used to have, the awareness of your own heartbeat, the doctor appointments that cost money and time.
- Blood pressure: the silent one. The medication that makes you tired. The salt math at every meal. Nothing feels wrong until something is very wrong.
- Chronic pain: the thing that's always there. Good days mean it's quiet. Bad days mean it's everything. The negotiation between pain medication and being present. The things you used to do without thinking.

**The connective tissue triad: hEDS, POTS, MCAS**

Hypermobile Ehlers-Danlos syndrome (hEDS), Postural Orthostatic Tachycardia Syndrome (POTS), and Mast Cell Activation Syndrome (MCAS) frequently co-occur. They are constitutional — arising from underlying connective tissue and immune regulation differences — and their comorbidity structure matters at chargen: generating one raises the probability of the others. This isn't three independent rolls.

*hEDS* — hypermobile joints that sublux (partially dislocate) under ordinary stress. The shoulder clicking out putting on a coat. The wrist that gives out carrying groceries. Chronic pain from joints working harder to stay in place; proprioception that's expensive because the body can't trust where its parts are. The fatigue isn't laziness — it's the cost of doing what everyone else does, done by a body that has to actively maintain what other bodies do passively. Diagnosis comes late because the flexibility looks like a gift. "I'm just double-jointed" for years, then decades. The diagnostic journey — the doctor who finally believes you, after everyone else called it anxiety — is its own texture.

*POTS* — standing up changes everything. The heart rate spikes to compensate for blood pooling away from the brain. Sustained upright posture is the problem: standing in line at the grocery checkout, doing dishes at the sink, waiting for the bus. Sitting or lying down helps. Salt loading, compression garments, fluids are management. Heat worsens it significantly. Often misdiagnosed as anxiety or deconditioning for years ("your heart rate goes up because you're anxious" — condescending and backwards). The standing world isn't designed to notice that standing is a variable.

*MCAS* — mast cells overreact to triggers that differ per person: food, temperature changes, emotion, exercise, smells, medications, stress. Reactions range from flushing and hives to GI distress to anaphylaxis risk. Trigger management is its own part-time job: food diary, preemptive antihistamines, avoidance, pattern recognition over months. Hard to diagnose because there's no definitive test — it's clinical, by pattern, by exclusion. The person who seems to react to everything and gets told it's hypochondria.

**Post-viral conditions: Long COVID, ME/CFS**

*Long COVID* — the infection that doesn't end. Post-exertional malaise (PEM): activity causes a crash that may not arrive until hours later or the next day. Brain fog: word-finding gaps, poor concentration, thinking through cotton. Orthostatic intolerance (often POTS-like). Fatigue that doesn't respond to rest. The disorientation of having been functional and now not being functional, with no clear timeline for improvement. Some people recover in months. Some don't recover. The uncertainty is its own weight. Circumstantial — needs a prior illness event in the character's backstory; not a dice roll.

*ME/CFS* — similar profile to Long COVID, and Long COVID may be a variant of it. Often triggered by viral illness. The defining feature is PEM: push past your envelope and the cost is disproportionate and delayed. The ceiling on function moves depending on recent activity — a better week means you did more, which means a worse week follows. Not depression, not deconditioning — a specific dysfunction of energy metabolism. Usually dismissed for years. Most people with ME/CFS had lives before the illness and know the difference.

**Injury** — temporary or permanent. A broken wrist changes what you can do for weeks. Chronic back pain changes it forever. The simulation adjusts what's available, how long things take, what the prose notices.

**Illness** — getting sick, the days of not being able to do anything, the slow return. Not dramatic — just the reality of being in a body that sometimes stops cooperating.

**Disability** — not a category. A landscape. The world is built for a default body and everyone else negotiates. The game models what that negotiation actually looks like.

#### Sensory

**Blindness** — total blindness transforms every interaction involving sight. The phone is a voice, not a screen. The apartment is spatial memory — furniture doesn't move, and when it does, that's a crisis. The street is sound and surface and the cane finding the edge. Getting dressed means knowing what you put where. The microwave beeps tell you when. The world is designed for eyes, and navigating it without them is work that never stops.

**Legal blindness** — not the same thing. You have some vision — enough to almost pass, not enough to trust. The phone at arm's length, font size maxed, still squinting. The bus number you can't read until it's too close. The person who waved that you didn't see, and now thinks you're rude. Legal blindness lives in the gap between what the world assumes you can see and what you actually can.

**Genetic deafness** — born into a Deaf world. ASL as first language, Deaf culture as community. This isn't loss — it's a different relationship to language and the world. The hearing world is the inaccessible one, designed around sound and impatient with alternatives. School, work, medical appointments — these are navigation problems. The phone is text. Conversation is visual. The richness is real; so is the friction with a hearing world that treats you as broken.

**Acquired deafness / hearing loss** — this *is* loss. The world you knew becoming muffled, then quiet, then gone. The conversation you can't follow. The alarm that doesn't work anymore. The isolation that builds because every interaction now costs more. Hearing aids that help and don't help. The exhaustion of lip-reading. The music you remember but can't hear anymore. Different from genetic deafness the way emigration is different from being born somewhere — you carry the before.

**Cataracts** — the slow dimming. Progressive, usually age-related but not always. The world getting hazier. Driving at night becomes impossible before driving during the day does. Surgery fixes it sometimes. Waiting for surgery is its own thing — the months of not quite seeing.

**Tinnitus** — the sound that's always there. Not silence when it's quiet — a ring, a hum, a tone that doesn't stop. Some days you barely notice it. Some days it's the only thing. It doesn't kill you. It just never leaves.

#### Cognitive

**Dementia** — not one disease. A family of them, each with its own shape.

**Alzheimer's** — the one people know. Memory first — the word that won't come, the name that should be there, the route you've driven a thousand times that suddenly isn't there. Then everything else. The progression is slow enough to watch, which is its own cruelty.

**Vascular dementia** — after strokes, large or small. Stepwise — fine, then worse, then stable at worse, then worse again. The steps down are sudden. The plateaus between them are unpredictable.

**Lewy body** — hallucinations, fluctuation. Good hours and bad hours in the same day. The person is there and then isn't and then is again. Parkinson's-like movement problems. The caregivers learn to track which version of the day they're in.

**Frontotemporal** — personality changes first, not memory. The person becoming someone else. Inhibition dissolving. The things they say now that they never would have said. The cruelty that isn't them but comes from where they used to be. This one is especially hard on families because the person looks the same.

**Early-onset** — under 65. You're 50 and losing yourself. Still working, maybe. Still parenting. The diagnosis that rewrites the future. Late-onset is expected, grieved, accommodated. Early-onset is a theft.

For the character: dementia could be the player character (early-onset, playing inside the fog — the unreliable narration *is* the experience) or someone they're caring for (the caregiving drawn lot with a specific, progressing weight).

#### Genetic and chromosomal conditions

The body's blueprint, and what happens when it varies.

**Chromosomal** — the textbook says XX or XY. The reality is wider. Klinefelter (XXY) — affects hormones, fertility, sometimes height and learning. Turner (X0) — affects growth, heart, fertility. Mosaic karyotypes — different cells, different chromosomes, in the same body. These aren't rare diseases. They're variations, sometimes diagnosed at birth, sometimes at puberty when things don't go as expected, sometimes never. Each one changes the body's baseline in ways the world may or may not see.

**Intersex conditions** — a spectrum of developmental variations where the body doesn't fit neatly into male or female categories. Could be chromosomal, hormonal, anatomical, or some combination. Some are visible at birth. Some aren't discovered until puberty. Some are never discovered. The medical system has historically treated intersex bodies as problems to fix — surgeries on infants, hormones prescribed to normalize. The person living in that body has opinions the doctors didn't ask for. The game models the body having its own reality that may or may not match what the world assumes.

**Colorblindness** — the world uses color to communicate, and you can't see it the way it was designed. Red-green is most common. The traffic light read by position. The chart at work that means nothing. The thing everyone else sees that you don't, and the moment someone realizes, and the way they react — fascination, disbelief, "but what color is THIS?" for the rest of the conversation. It's minor. It's also daily.

**Sickle cell** — pain crises. The daily management. The emergency that comes from nowhere. Disproportionately affects people of African descent — which means the medical system's response is shaped by race in ways that compound the condition. The crisis that gets undertreated because the person in pain is Black and the doctor has assumptions about pain management.

**Cystic fibrosis** — the breathing. The mucus. The treatments that take hours. The shortened timeline that medicine keeps pushing further — people used to die in childhood, now live to 30, 40, longer. But "longer" still means living with a horizon that's closer than most people's. The daily percussion, the pills, the clinic visits. The normalcy built around abnormal lungs.

**Hemophilia** — the bruises. A minor injury that isn't minor. The care around edges, the medication that costs more than rent. The joint damage that accumulates. The thing that makes roughhousing, sports, a kitchen knife, a fall — all different calculations.

### Mental health

**Conditions** — depression, anxiety, bipolar, PTSD, OCD. These aren't moods. They're the lens everything comes through. The game already simulates something like depression through energy/stress/social, but as a health condition it's not "low energy" — it's the specific way getting out of bed takes everything you have for reasons that have nothing to do with sleep.

**Anxiety** — beyond stress. The constant hum, the avoidance, the physical symptoms. The difference between "stressed about work" and "unable to open the email because opening the email means knowing."

**Eating disorders** — the relationship to food is the condition. These aren't in the Dietary needs section because they're not primarily about what the body can eat — they're about what the mind does with eating. They are circumstantial: they emerge from specific personality conditions and sometimes life history events, not from a random roll.

*Anorexia nervosa*: restriction as control. The internal logic that makes not eating feel like the only available power. Fatigue, cold sensitivity, cardiac risk — the physical consequences arrive but feel less real than the compulsion that produced them. Needs upstream: personality parameters (perfectionism, anxiety, need for control, low self-esteem) and possibly life history events. The hunger system already exists; anorexia modifies what the character does with it — the signal is present, the relationship to it is different.

*Bulimia nervosa*: cycles. Eating beyond satiety, then the attempt to undo it — vomiting, laxatives, excessive exercise. Secrecy is a defining feature; harder to detect than anorexia. Different personality profile: more impulsive, more ambivalent about food than averse to it. The vomiting system already exists. Purging disrupts electrolytes, which would interact with NT and energy systems. Dental erosion over time.

*Binge eating disorder*: eating past satiety without purging. The fullness that's present and overridden. Shame, not relief, afterward.

*ARFID* (Avoidant/Restrictive Food Intake Disorder): not about body image — about texture, smell, color, what the food looks like, what it might do. Often autistic or anxiety-adjacent. The safe food list is short. The grocery store has a hundred options and maybe three of them are possible.

All eating disorders interact with body image (not yet a state variable), with food availability, with social eating situations. Recovery is daily and not linear.

### Neurodivergence

**ADHD** — executive dysfunction, time blindness, hyperfocus, the gap between wanting to do something and being able to start. The game's "can't focus at work" already touches this. As a trait, it's not situational — it's structural. Some days the medication works, some days it doesn't, some days you forgot to take it.

**Autism** — sensory processing, social interaction patterns, the importance of routine, the cost of masking. The world is loud and bright and expects a specific kind of social performance. Meeting those expectations is work the game can model. *Echolalia* — the repetition of heard speech, immediate or delayed — is a specific autistic trait with prose implications: the inner voice might echo, a phrase from the morning appearing in the afternoon's narration, a fragment from a TV ad surfacing as self-talk. In a text-based game this is renderable. Masking echolalia costs the same energy as other masking.

**Tourette syndrome** — tics: involuntary, semi-suppressible motor and vocal movements. Blinking, throat-clearing, head movements, sounds. Suppression is possible and exhausting — hold it through a meeting, release it when alone. The suppression economy is the mechanical layer: sustained suppression in social contexts drains energy and stress; private space pays the debt back.

*Coprolalia* — involuntary vocalization of obscene or socially prohibited words or phrases, affecting roughly 10% of people with Tourette syndrome. Not the character choosing to say things. The prose renders it as something that happens: the word in the air, the silence after it, the familiar machinery of explaining that's already forming. The character's inner voice knows what occurred. What the text doesn't do is treat it as chosen. The social consequences — jobs, public situations, relationships — are real and asymmetric: the person managing the condition does all the work of navigating a world that didn't build in accommodation.

These aren't illnesses to treat. They're ways of being that interact with a world not designed for them.

### Medication

Medication is its own system. Taking it costs time and sometimes money. Not taking it has consequences that vary from immediate to slow-building. Running out means a pharmacy trip, which means money and energy and time. Some medication has side effects (drowsiness, appetite changes, emotional blunting). The negotiation between the condition and the treatment is daily and rarely simple.

### Acquired conditions

Not all conditions are there from the start. Some happen to you.

**Workplace injury** — you went to work and came back different. A fall, a repetitive strain injury, a back that gave out. The before and after. The job you can't do anymore. Workers' comp if you're lucky, nothing if you're not. The paperwork alone is exhausting. The coworker who says "at least you get time off."

**Developing illness** — the diagnosis that reframes everything. Diabetes that builds from prediabetes. Heart problems that announce themselves. The first doctor's appointment, the medication, the new daily routine that didn't exist last month. The cost — always the cost.

**Accidents** — outside work, outside anyone's control. A fall, a car, a thing that just happened. The body was one way and now it's another. Recovery if recovery is possible. Adaptation if it isn't.

**Deterioration** — the slow version. Eyesight worsening. Joints getting worse. The thing that wasn't a problem becoming a problem so gradually you didn't notice until you did. Age-related but not only age-related — stress, poverty, poor nutrition, lack of healthcare all accelerate it.

**Gastritis** — inflammation of the stomach lining, usually from H. pylori infection, NSAID overuse, alcohol, or sustained high-cortisol periods. The stomach system already exists; gastritis modifies it: gnawing pain when empty (hunger that also hurts), nausea that food temporarily relieves before making worse, slower emptying, sensitivity to spicy or acidic food. Stress worsens it directly via cortisol and NE suppressing GI motility. H. pylori is bacterial — a drawn lot potentially connected to housing history or travel. NSAID-related gastritis derives from pain management patterns (what do you take for chronic pain?). Stress gastritis derives from sustained high-cortisol periods. All circumstantial paths — each needs its upstream.

These aren't plot twists. They're things that happen to bodies. The game models the transition: the before, the event (if sudden), the after. The after is the new terrain.

### Health as character property

Health conditions are part of who the character is (like age and job type). They're set at creation or develop during play. They modify simulation parameters:
- Energy baseline and recovery rate
- Stress baseline
- What interactions are available
- Time and energy cost of actions
- What the prose notices (pain, fatigue, sensory detail, cognitive fog)
- What objects matter (medication, mobility aids, specific foods)
- What the phone is for (pharmacy notifications, appointment reminders, health tracking)

**Two kinds of condition at chargen:**

*Constitutional* conditions arise from genetics or biology, not circumstances. Migraines, color blindness, sickle cell, genetic deafness — these are probabilistic. A random roll grounded in real-world prevalence is appropriate. The condition isn't predicted by the character's backstory; it's just part of who they are.

*Circumstantial* conditions are consequences of life history — dental disease from lack of care, occupational injury, conditions that develop from sustained poverty or poor nutrition or chronic stress. These are not random. Whether a character has an untreated cavity is not a dice roll — it is the outcome of whether they had access to dental care, which follows from income, insurance, jurisdiction. These conditions must derive deterministically from backstory. When the backstory doesn't yet model the relevant upstream variables, the condition cannot be properly assigned at chargen. The correct response is to leave the condition unassigned (not to approximate with a random roll) and build the backstory mechanism that will eventually derive it.

### Good days and bad days

Chronic conditions aren't constant. They fluctuate. Some days you almost forget. Some days it's the only thing. The simulation should model this variation — not as random good/bad dice rolls, but as the interaction between the condition, sleep, stress, medication adherence, and the specific demands of the day.

### This list is not exhaustive

The conditions above are examples, not a complete catalog. The full range of bodies this game models includes: narcolepsy and cataplexy, fibromyalgia, sleep apnea, endometriosis, PMDD, lupus (SLE), hypothyroidism and hyperthyroidism (Hashimoto's, Graves'), Raynaud's phenomenon, IBS, Crohn's and ulcerative colitis, celiac disease, PCOS, chronic urticaria, prosopagnosia, dyscalculia, dyslexia, PMDD, type 1 diabetes (constitutional) vs. type 2 (more circumstantial), and many others. Each has a texture that's specific to it — specific interactions it removes, specific costs it adds, specific things the prose notices.

The framework is what scales:
- Constitutional vs. circumstantial determines the chargen model (probabilistic roll vs. backstory derivation)
- Comorbidity structure matters — conditions cluster (connective tissue triad, eating disorders + anxiety, Long COVID + POTS)
- Two kinds of effect: texture (ambient weight) and concrete changes (what's gone)
- Good days and bad days are driven by the interaction of the condition with sleep, stress, medication, and current demands
- The diagnosis journey is often part of the experience — having a condition without a name for it, being dismissed, the relief and grief of finally knowing

Individual conditions get added to the simulation as their upstream systems are ready. No approximation debts get papered over with random rolls.

## Biology & the Endocrine System

The body's chemistry doesn't care about categories. It runs on hormones, cycles, and systems that vary from person to person in ways that don't map to a binary.

### Sex isn't gender

Gender is social, performative, chosen or unchosen. Biological sex is what the body is actually doing — chromosomes, hormones, organs, development. These often correlate. They don't have to. A trans man on testosterone has a different endocrine reality than a cis man with Klinefelter. A post-menopausal woman has a different hormonal profile than a woman on birth control. An intersex person's biology might not map to either standard model. The simulation models the body that's actually there, not the category it's assigned to.

### Metabolism

The body's processing layer. How it converts input into output — and why the same input produces different lives in different bodies.

**Metabolic rate** — how fast the body burns. Not just "fast" or "slow" — it's specific. Some people burn through food in two hours. Some carry a meal for six. Thyroid function, body composition, age, activity, genetics — all of it. The player doesn't see a number. They see how soon the hunger comes back.

**Drug metabolism** — CYP enzyme variation. This is pharmacogenomics — your enzymes determine what a substance actually does to you. Some people are ultra-rapid metabolizers: caffeine at 9 PM, asleep by 10. Some are poor metabolizers: half a dose and they're on the floor. This varies by substance, by gene, by ethnicity. A doctor prescribes the standard dose and your body decides what that dose actually does. The same is true for every substance in the Substances section — alcohol, nicotine, medication, everything. Two characters with the same substance intake will feel it differently because their metabolisms process it differently.

**Nutrient processing** — the body's ability to extract what it needs from food varies. Iron absorption rates differ. Lactose processing depends on whether you produce lactase. Celiac disease means gluten is poison. PKU means phenylalanine accumulates. Some bodies run well on a diet that would leave another body deficient. The simulation models this as the body having specific processing characteristics — not as dietary preferences, but as what the body can and can't do with what you give it.

**Metabolic conditions** — diabetes (the body's relationship to insulin), thyroid disorders (the thermostat is broken — hyper runs too hot, hypo too cold), PCOS (insulin resistance feeding hormonal disruption). These aren't separate from metabolism — they *are* metabolism going a different way.

### Dietary needs

The body's requirements aren't generic. What you need to eat — and what you can't eat — is specific to your body, your conditions, your life stage, and your beliefs.

**Condition-driven** — diabetes means carb counting. Celiac means gluten-free everything, which costs three times as much and the corner store doesn't stock it. Kidney disease means potassium and sodium restrictions. PKU means reading every label. Iron deficiency means the fatigue that isn't about sleep, and the supplements that upset your stomach.

**Allergies** — nut-free, shellfish, dairy, the long list that shapes where you can eat and what you can buy. The EpiPen that costs $300 and expires. The restaurant where nothing's safe. The friend's dinner where you bring your own food or don't eat. The label-reading that's automatic now.

**Pregnancy** — more folate, more iron, more calcium, more calories, more water. The prenatal vitamins that cost money. The cravings and aversions that override everything. The nausea that makes eating a negotiation. The foods you're told to avoid, the ones you're told to seek out, the cost of all of it.

**Religious and cultural** — halal, kosher, vegetarian, fasting. Not restrictions to work around — daily structures that shape what eating means. Ramadan changes the entire rhythm of the day. Keeping kosher means the grocery trip is different. These intersect with what's available and what it costs — a halal butcher isn't on every corner.

**Eating disorders** — the relationship to food *is* the condition. Anorexia, bulimia, binge eating, ARFID. The body needs fuel and the mind has a different agenda. The hunger that's present and ignored, or the fullness that's present and overridden. The game models this not as a choice but as a war between need and compulsion. Recovery is daily and not linear.

**Poverty makes all of it worse.** The specialized diet costs more. The gluten-free bread is $7. The diabetic-friendly groceries aren't at the dollar store. The fresh produce is a bus ride away. The dietary requirement that a comfortable person manages easily becomes an impossible equation when money is the binding constraint.

### Hormonal profile

What the body produces, what it receives from medication, what it doesn't produce anymore. This is the body's baseline chemical environment:

- **Endogenous production** — what the gonads and adrenals make on their own. Varies by anatomy, age, conditions, and individual variation.
- **HRT** — exogenous hormones that change the profile. Testosterone, estrogen, progesterone — each with its own timeline and effects.
- **Birth control** — hormonal contraception modifies the cycle or suppresses it. Side effects are real and varied.
- **Menopause** — the transition. Hot flashes, mood shifts, sleep disruption, the body rewriting its own chemistry over months or years.
- **Conditions** — PCOS, thyroid disorders, adrenal conditions. The body over- or under-producing, and the cascade that follows.

### Hormonal cycles

When the body cycles, it affects everything. Menstrual cycles push on mood, energy, pain, appetite, focus. The cycle isn't universal:

- Present in some bodies, absent in others — not determined by gender
- Absent after hysterectomy, oophorectomy, some hormonal treatments
- Irregular with PCOS, stress, malnutrition, extreme exercise
- Modified by birth control (suppressed, regulated, altered)
- Absent or different in various intersex conditions

The cycle, when present, is an autonomous force on mood that the player never sees the mechanism of. Some days the body is just harder to live in. The game doesn't explain why. The character might not know why either.

### Cortisol and stress hormones

The body's stress response has its own rhythm. Cortisol peaks in the morning. Chronic stress flattens the rhythm. The body's chemical response to stress isn't the same as the feeling of stress — they interact but don't map cleanly. You can feel calm and be chemically stressed. You can feel anxious with normal cortisol. The simulation models the chemical layer as an influence on mood, not as the mood itself.

### How this feeds into mood

The endocrine system is one of mood's autonomous forces. Hormonal cycles, cortisol rhythms, thyroid function, medication effects — these push on mood on their own schedule, independent of what the player does. A bad hormonal day doesn't lift because you ate well and socialized. The body has its own opinion about today.

## Substances

Substances are chemical relationships with the body. Not all of them are problems. Most people have at least one.

### The everyday ones

**Caffeine** — the most normalized drug. Morning coffee isn't a choice for most people — it's the baseline. Skip it and the headache arrives by noon. The simulation models caffeine as a mood and energy floor: present, it holds you at functional. Absent, you drop below where you'd be without it. That's dependency, just one nobody calls dependency.

**Nicotine** — the cigarette break isn't relaxation. It's the withdrawal stopping. Nicotine creates its own need and then satisfies it — the calm you feel after smoking is just the absence of the agitation that not smoking caused. The simulation models this as a cycle: withdrawal builds between doses, the dose resets it to baseline, baseline is where a non-smoker already was. Quitting means weeks of the body recalibrating what baseline is. The cost — financial, health, social (the smoke break, the smell, the people who have opinions about it).

**Alcohol** — the social lubricant, the wind-down, the thing that's fine until it isn't. One drink loosens. Two drinks blur. Three drinks override mood entirely — the heavy lifts, the fraying softens, everything is warmer and less precise. Then it leaves, and where it leaves you is worse than where it found you. The simulation models the curve: the push (mood alteration, inhibition reduction), the plateau, the cost (mood drop, energy crash, the next morning). For some people this is occasional. For some it's nightly. For some it's the thing they can't stop. The line between use and dependency isn't where anyone thinks it is.

**Cannabis** — the edges soften. Time moves differently. The anxiety quiets or gets louder, depending on the person and the strain and the day. The simulation models cannabis as mood modulation with high individual variance — for some characters it's the thing that makes the evening survivable, for others it's the thing that makes the morning harder. Dependency is quieter than alcohol but real — the inability to sleep without it, the irritability when you stop, the way "just tonight" became every night.

### Prescription and grey area

**Painkillers** — the prescribed ones that work too well. The opioid that was for the back injury that's now for everything. The negotiation between pain management and dependency — the dose that handles the pain but that you also need for reasons that aren't about pain anymore. The doctor who cuts you off. The pharmacy that looks at you a certain way. The gap between the last prescription and the next one.

**Benzos** — prescribed for anxiety, and they work. Too well. The calm is real and borrowed. Tolerance builds. The original anxiety, when it comes back, is worse than before you started. Withdrawal is dangerous — seizures, not just discomfort. The medical system that prescribes them and then struggles with what it created.

**Stimulants** — ADHD medication that lets you function. Also: the medication that other people want because it lets them function too. The line between treatment and enhancement. The day you skipped your Adderall versus the day someone else took one. The simulation models the gap between prescribed use (restoring a baseline) and recreational use (exceeding it), and the fact that both involve the same molecule.

### The harder ones

The simulation doesn't rank substances morally. It models what they do to the body.

**Opioids** — beyond prescription. Heroin, fentanyl, whatever's available. The warmth that nothing else provides. The nod. The tolerance that means yesterday's dose is today's minimum. The overdose risk that's math, not drama. The withdrawal that's days of the worst flu plus the certainty that one phone call would fix it. The simulation models the chemical reality: the override (mood replaced entirely), the tolerance curve (diminishing push, increasing need), the withdrawal (mood and energy cratering, physical symptoms, duration).

**Stimulants** — meth, cocaine, crack. The energy that isn't real. The confidence that isn't yours. The crash that takes everything the high gave and then some. The binge pattern — days awake, then days of nothing. The damage that accumulates: teeth, weight, paranoia, the cardiovascular strain. The simulation models the spike and the trough, and the way the troughs get deeper.

**Whatever's available** — not everyone chooses their substance. Sometimes it's what's around, what's cheap, what someone offered. The simulation doesn't require a substance backstory. Someone uses what they use.

### How substances interact with mood

Substances don't go through the state layer. They push on mood directly — chemical override. But the push is temporary and the cost is real:

- **Acute effect** — the substance alters mood for its duration. Some override (opioids replace mood entirely). Some modulate (alcohol loosens, cannabis blurs). Some sharpen (stimulants, caffeine).
- **Comedown** — the return, which isn't a return to where you were. It's lower. The body borrowed from tomorrow's mood to pay for tonight's.
- **Tolerance** — repeated use narrows the acute effect. The same dose does less. The body recalibrates around the substance being present.
- **Withdrawal** — the body's demand. An autonomous drag on mood that operates on its own schedule. Severity and duration depend on the substance, the history, the body. Withdrawal doesn't care what else is going on in your life.
- **Baseline shift** — long-term use moves where "normal" is. The mood you had before the substance isn't there anymore. Getting it back — if it comes back — takes longer than the withdrawal.

## Drawn Lots

Constraints life hands you. Not backstory summaries — lived realities the game puts you inside of.

- **Foster care** — the system. New house, new school, new rules, new adults who might be kind or might not be. The garbage bag instead of a suitcase. The social worker who has thirty other cases. The bed that isn't yours. The family that might be temporary. Aging out at 18 into nothing. The game models this as daily texture: where you live isn't stable, the adults in your life rotate, the things other kids take for granted aren't there.

- **Domestic violence** — living inside it. The eggshells. The door. The quiet after. The parent who's different when they drink. The other parent who can't leave, or won't, or tried and came back. For the child: the thing you can't talk about at school. For the adult: the thing you're planning to leave or have left or went back to. The shelter. The phone you had to get rid of. The name you changed.

- **CPS and social services** — the system that's supposed to help. The knock on the door. The home visit. The questions the kid answers carefully. The parent performing normalcy. Sometimes the system helps. Sometimes it makes things worse. Sometimes it takes you away from something bad into something also bad. The loss of agency — adults deciding your life in offices you've never seen.

- **Childbearing** — planned, unplanned, unwanted, forced. Each is a different life. The teen parent whose childhood ended. The adult who wanted this and is still drowning. The pregnancy from assault that you carried because you had no choice, or because you chose to, and both are complicated. The financial cost is real — diapers, formula, doctor visits, the job you can't keep because childcare costs more than you earn. The body that changed. The sleep that ended. The love that's real and the exhaustion that's also real. Some people have support systems: parents, siblings, community. Some people have the opposite of a support system.

- **Fetal alcohol syndrome, neonatal conditions** — the thing that happened before you were born. The cognitive ceiling. The face people read. The diagnosis that explains things or doesn't. The parent who caused it, who might be in your life or might not. The school that doesn't know what to do with you. Not your fault. Never your fault. The world doesn't care whose fault it is.

- **Instability** — bouncing between towns because the parent has to move for work. Or because of eviction. Or because they're running from something. New school, new town, the friend you left, the phone number that's all you kept. The kid who never unpacks all the way. The adult who does the same thing to their own kids because it's all they know, or fights not to.

- **Caregiving** — responsible for someone else. Aging parent, sick family member, child with needs. Your time and energy aren't fully yours. The appointment, the medication schedule, the call from the school, the guilt of needing an hour for yourself.

- **Housing instability** — not everyone has an apartment. Couch surfing, shelter, car, street. The "home base" looks different. The address you can't put on forms. The belongings that fit in a bag.

- **Addiction and recovery** — not a character flaw. A chemical relationship. The body learned something and now it needs it. Alcohol, nicotine, opioids, stimulants, cannabis, benzos, whatever it is — the substance isn't the problem, the dependency is. The daily negotiation: the craving that isn't a thought but a pull, physical, in the chest or the hands or the jaw. The meeting, if you go. The sponsor's number. The day count that means everything and nothing. The relapse that isn't failure but the body winning an argument you thought you'd settled. Recovery isn't linear — it's the same day over and over, each one a decision not to. Some days the decision is easy. Some days it's the only thing.

  The chemical reality matters for the simulation. Withdrawal is a physical event — shaking, nausea, insomnia, mood cratering, the body in open revolt. Different substances, different timelines: alcohol withdrawal can kill you, nicotine withdrawal just makes everything unbearable, opioid withdrawal is days of the worst flu plus the certainty that one phone call would end it. The simulation models the substance's actual interaction with the body — the mood override while using, the tolerance that demands more, the withdrawal that drags mood and energy into a pit, the slow recalibration of baseline if you stop.

  And the world's response: the stigma, the job you can't keep, the friend who stopped calling, the family that's watching. The intersection with pain management — chronic pain patients whose medication is also their dependency, and the medical system that treats both badly. The intersection with poverty — the cost of the substance, the cost of treatment, the cost of not being functional.

- **Legal constraints** — probation, immigration status, criminal record affecting employment. Invisible walls. The check-in. The box on the application. The job you can't get because of something you did or something you are.

- **Grief** — recent loss. The phone contact that's still there. The empty chair. The thing you reach for before remembering. The world that moved on when you didn't.

- **Language barriers** — navigating a world in a language that isn't yours. The form you can't read. The joke you didn't get. The intelligence people don't see because your words come out wrong.

The architecture models all of these the same way: character properties and active situations that modify what's available, what things cost, how the prose reads, where you live, who's in your life. But the game doesn't treat them as modifiers. It treats them as the ground you walk on. You live inside them.

## Identity & Social Landscape

The world isn't neutral. It responds to who you are — your gender, your race, your presentation, your body, your accent, your name. The game models this as ambient texture, not as "discrimination events." It's not a cutscene where someone is rude to you. It's the way a room feels different, the way a conversation has a cost that isn't about the conversation, the way some jobs pay less and nobody says why.

These dimensions don't exist in isolation. A Black trans woman's daily texture isn't "race + gender + trans experience" added together — it's its own thing, with its own specific weight. The game shouldn't model identity as stacking modifiers. Each intersection is a different life.

### Performance

Many of the conditions below share a pattern: the world demands a version of you that isn't the real one, and maintaining that performance costs energy.

- **Masking** (autism, ADHD, mental health) — performing neurotypical. Suppressing stims, forcing eye contact, pretending the fluorescent lights aren't unbearable, acting like you're following the conversation when your brain left ten minutes ago. The effort is invisible to everyone except you.
- **Code-switching** (race, culture) — modulating yourself for the dominant context. Voice, vocabulary, body language, what you mention and what you don't. Professional means performing a specific culture's version of professional.
- **The closet** (sexuality) — performing straight. Editing pronouns, inventing weekend plans, the constant background calculation of who knows and who doesn't.
- **Boymoding / girlmoding** (trans) — presenting as a gender that isn't yours because it's safer, or presenting as the one that is and carrying the cost of visibility. Either way, performance.
- **Body management** (weight, disability, chronic illness) — performing health, performing able-bodiedness, performing a body the world finds acceptable.

The game models all of these as the same thing: ambient energy drain that varies by context. Some spaces require more performance. Some people let you drop it. The relief of a space where you don't have to perform is real and the game should let you feel it — the prose relaxes, the energy cost drops, the narration breathes differently.

The danger of long-term performance: it hollows you out. The mask becomes hard to remove. You forget what the unperformed version feels like. The game can model this as: the longer you've been performing without a break, the more the narration voice flattens, the less the character notices, the smaller the inner life becomes.

### Body

The body you have is a body the world has opinions about.

**Weight** — fat bodies navigate a different world. Chairs that don't fit. Clothes that aren't available. The doctor who attributes everything to weight. The stranger who has thoughts about what you're eating. The friend who "worries about your health." The dating landscape that's crueler. The job interview where you're assessed before you speak. This is ambient, constant, and rarely acknowledged. The game models it as texture — the world being slightly less accommodating, interactions carrying slightly more weight (the irony is not lost), the prose noticing what the body notices.

**Thinness** — its own set of assumptions. The concern that's really surveillance. "You should eat more" from people who don't get to say that. Eating disorders as the invisible thing the world accidentally encourages and then panics about. The body that's praised for being small and punished for being too small.

**Height, build, appearance** — the world reads you before you speak. Assumptions about capability, threat, competence, attractiveness. These aren't dramatic — they're the low hum of being perceived. The game doesn't need to model every physical dimension. But the principle holds: the body is a social object, and the world's response to it is part of daily texture.

**Body and performance** — the work of managing how your body is perceived. Clothing choices that hide or reveal. Posture that compensates. The energy of existing in a body that doesn't match what the world expects or rewards. This is another form of masking, and it carries the same ambient cost.

### Gender

Gender is a character property set at creation. It shapes the social landscape:

**Misogyny** — not always overt. The coworker who explains things. The supervisor who listens less. The pay that's lower for reasons that don't have reasons. The street at night being a different place. These aren't events the game triggers — they're the baseline texture of interactions, weighted by context. Some workplaces are worse. Some people are fine. You can't always predict which.

**Misandry** — rarer, differently shaped. The assumption of threat. The emotional labor you're not expected to need. The loneliness that's not supposed to exist.

Both are ambient. The game doesn't announce them. The prose just reads differently — the same interaction with the same person, but the undertone shifts based on how the world sees your gender.

### Trans experience

Being trans isn't one experience. It's a spectrum of visibility, transition, and social response:

**Pre-transition or early transition** — the gap between who you are and what the world sees. Pronouns that don't fit. A name that isn't yours. The daily negotiation of being perceived wrong. The energy cost of that is real and constant.

**HRT** — changes that are yours but invite commentary. The body becoming more right while the world's response becomes less predictable. Some people adjust. Some don't. Some become hostile in ways they weren't before.

**Post-transition / passing** — different friction. The fear of being clocked. Medical costs. The history that's yours but that you may not want visible. The relationships that survived and the ones that didn't.

**Nonbinary** — existing outside the categories the world insists on. The friction is different — less overt hostility (sometimes), more erasure. The constant low-grade work of being illegible to systems designed for two options.

The game doesn't rank these. Each is a different texture of daily existence. The social response varies by person, by workplace, by stranger on the street. Some people are warm. Some are confused. Some are cruel. Most are just... not thinking about it, which is its own thing.

### Gender and employment

Gender shapes the employment landscape. Not as hard gates — as probability, as texture:
- Profession expectations (nursing, construction, tech — the assumptions baked in)
- Pay gaps that aren't explained and aren't acknowledged
- Hiring bias that's invisible from the outside
- The different flavor of "not being taken seriously" depending on gender

### Gender and relationships

The same friend reads differently depending on gender dynamics. Physical proximity, emotional expectations, who's allowed to be vulnerable, who's expected to perform strength. The game's relationship prose adapts — not because the friend changes, but because the social script around the interaction is different.

### Race and ethnicity

Race is what the world sees. Ethnicity is what you carry. Both shape daily texture.

**The world's response** — ambient, constant, never announced. Being followed in a store. The cab that doesn't stop. The name on a resume that changes callback rates. The coworker who's surprised you're articulate. The cop who's a different kind of presence depending on what you look like. The neighborhood that goes quiet when you walk through it. None of this is an event the game triggers. It's the baseline cost of navigating a world that has assumptions about you before you open your mouth.

**Code-switching** — the energy cost of performing a version of yourself that the context demands. The voice at work versus the voice at home. The way you modulate yourself to be non-threatening, or professional, or palatable. It's work. The game can model it as energy cost — the same interaction is more expensive when you're performing for an audience that doesn't know it's an audience.

**Visibility and invisibility** — sometimes you're too visible (the only one in the room, the one who gets watched, the one who represents). Sometimes you're invisible (overlooked, underestimated, not considered). Both are exhausting in different ways. The game's prose reflects which one is happening without naming it.

**Microaggressions** — the small things that aren't small. "Where are you really from?" The hand in your hair. The compliment that's an othering. The game doesn't label these. They show up as prose that has an edge to it — the interaction that costs slightly more than it should, the moment that's slightly off, the thing someone said that sits in you for the rest of the day.

### Ethnicity and culture

Culture shapes the inner life — not just how the world sees you, but how you see the world.

**Family structure** — the design's family section assumes a model. Culture reshapes it. Multigenerational households. Filial piety. The expectation that you send money home. The cousin who's more like a sibling. The community elder who functions as a parent. "Family" isn't always two parents and maybe siblings — it can be a web of obligation and care that extends further than the game's default.

**Food** — what food means. Comfort food is cultural. What's in the fridge, what you cook, what you crave when you're low — these are shaped by where you come from. The corner store might not have what you need. The grocery trip might require a different store, farther away, more expensive. Missing a food from home is a specific loneliness.

**Language** — thinking in one language, speaking in another. The word that doesn't translate. The accent that marks you. The parent's language that you're losing. This overlaps with the language barrier in Drawn Lots but it's broader — even fluent bilingual people carry the weight of navigating between languages, and the choice of which one to think in shapes the prose itself.

**Religious practice** — daily texture, not belief system. Prayer times that structure the day. Dietary restrictions that shape what eating means. The community that comes with practice, or the isolation of practicing alone, or the loss of a practice you grew up with. The game models this as daily rhythm, not as faith.

**Cultural expectations** — what success looks like, what family expects, what the community considers normal. These can align with or contradict the broader society's expectations. A first-generation college student carries a different weight than a third-generation one. Career choices that honor family versus career choices that honor self — and the guilt or pride that comes with either.

**Belonging and displacement** — the experience of being between cultures. Too much of one thing for this group, not enough for that one. The trip to the country your parents came from where you're not quite from there either. Second-generation, third-generation — the distance grows but the pull doesn't stop.

### Sexuality and sexual orientation

Who you're attracted to — or not attracted to — shapes daily texture in ways the world mostly doesn't acknowledge.

**The closet** — not a place, an energy cost. Performing straightness. Monitoring pronouns when you talk about your weekend. The calculation before every new person: safe or not safe. The closet isn't hiding — it's constant, active work, and the game can model that as the ambient drain it actually is. You might be out in some contexts and not others. The friend who knows. The parent who doesn't. The coworker you're not sure about.

**Being out** — different friction. The assumption that it's your whole personality. The people who are fine with it and need you to know they're fine with it. The people who aren't. The date that's easy in some neighborhoods and surveilled in others. The hand you drop when the wrong person walks by.

**Homophobia** — ambient, same pattern as the rest. The joke that's not a joke. The coworker who's fine with you but votes against you. The family dinner where it's not discussed. The landlord, the employer, the stranger — you can't always tell who's safe. The game doesn't generate "homophobia events." The texture of interactions shifts based on context and who's around.

**Bisexuality** — the specific friction of not fitting neatly. Too gay for some spaces, too straight for others. The erasure — people assuming based on who you're currently with. The having to come out over and over because it's never the default assumption.

**Asexuality** — the world assumes everyone wants the same thing. The romantic subplot that's supposed to be universal. The friend who keeps trying to set you up. The relationship that's expected to include something you don't want or don't feel. The loneliness of not sharing a drive everyone treats as fundamental. Or: being ace and being fine with it, and the world not believing that's possible.

**Orientation and family** — this connects directly to parental judgment. Coming out to a supportive family is one experience. Coming out to a hostile one is another. Not coming out at all — because you already know — is its own weight. Culture and religion shape the stakes: in some families, this is the thing that breaks the relationship. In others, it's absorbed. In others, it was never going to be discussed.

**Orientation and culture** — some cultures have frameworks for non-straight identities. Some don't. Some have frameworks that look like acceptance but aren't. The intersection of sexual orientation with cultural and religious identity can mean choosing between communities, or finding a way to hold both, or losing one.

### Economic position, origin, and social landscape

These are often lumped together as "class." They shouldn't be. They're independent dimensions that interact but don't reduce to one thing. You can have money and no social capital. You can have education and no money. You can have grown up comfortable and be broke now, still carrying the expectations of a life you can't afford.

**Economic position** — what you have right now. Income, savings, debt, safety net. This is the Money section's territory, but it's also an identity dimension: the world reads your economic position and responds to it. The store clerk watches you or doesn't. The landlord wants a bigger deposit or doesn't. The doctor spends more time or less. Being read as poor changes every interaction in ways nobody acknowledges.

**Origin** — where you started. What neighborhood, what household, what was normal. This is deeper than current money — it's the baseline you measure everything against. A kid who grew up hungry flinches at prices differently than a kid who didn't, even if they have the same bank balance now. Origin shapes what you know how to do (cook from nothing, navigate bureaucracy, ask for help, not ask for help), what feels normal, what feels aspirational, what feels impossible. It doesn't go away when your circumstances change.

**Social capital** — who you know. What rooms you're in. The friend who knows someone who's hiring. The parent who can co-sign. The contact list that opens doors. Social capital is invisible infrastructure: if you have it, you don't notice it. If you don't, you notice the absence every time someone else's network solves a problem yours can't.

**Cultural capital** — what you know how to do in context. The right vocabulary, the right references, the right clothes, the right ease. The job interview where you know the unwritten rules because someone taught you, or you don't because nobody did. This is another performance dimension — the accent you flatten, the vacation you can't reference, the fork you're unsure about.

**Educational background** — credentials as gatekeeping. What doors open, what jobs are possible, what assumptions people make about your intelligence based on a piece of paper. But also: the debt that comes with it, or the absence that closes things. The self-taught person who knows more than the credentialed one but can't prove it on paper.

**Geographic reality** — where you live shapes what exists. Food deserts: the corner store has what it has, the grocery store is a bus ride away. Transit deserts: the bus that takes 90 minutes for a 20-minute drive. Healthcare deserts: the clinic that's an hour away. The neighborhood determines what's walkable, what's safe, what's accessible, what the rent costs. Geography is an invisible constraint — you live where you can afford, and where you can afford determines what's possible.

**The daily tax of poverty** — being poor is expensive in time and energy. The bus instead of a car. The laundromat instead of a washer. Cooking from scratch because you can't afford convenience, but also can't afford fresh ingredients. No bulk buying — you pay more per unit because you can't afford the larger size. Overdraft fees for being broke. Late fees for being late because you were at the laundromat. Poverty compounds itself. The game models this as concrete time and energy costs, not as atmosphere.

**The hidden infrastructure of comfort** — what's invisible when you have it. A car. A washer. A primary care doctor. A dentist. A credit score that works. An emergency fund that means a broken phone isn't a crisis. A parent who can lend you money. These aren't luxuries. They're the difference between a bad week and a crisis. The game determines which of these exist in the character's world based on their economic position and origin.

**The gap between origin and position** — when these don't match, the friction is specific. Grew up comfortable, now broke: the expectations you can't meet, the skills you never learned (how to cook cheap, how to navigate assistance programs), the shame that comes from a fall the world thinks is your fault. Grew up poor, now stable: the flinch that doesn't go away, the money you save compulsively, the inability to believe it's real, the family who needs things you can now provide and the guilt of both giving and not giving enough.

## The Space

### The apartment

Three rooms: bedroom, kitchen, bathroom. Small. The mess accumulates by itself — dishes, clothes, general entropy. Cleaning costs energy. Not cleaning costs nothing immediately but changes how the space feels, which changes how the prose reads, which changes how the player feels.

The apartment is the baseline. You wake up here, you come back here. Its state is a mirror: clean apartment when you're managing, messy when you're not, and it can go either way independently of how you're actually doing.

### The world outside

The street. The corner store. The bus stop. Work. The soup kitchen. The food bank. The world is small on purpose. These aren't locations in a game map — they're the places a constrained life actually touches. Going places costs time and energy. The bus ride to work is 20 minutes you spend being a body in transit.

The corner store is where money becomes food. The transaction is straightforward but the math is constant: can you afford this, is it enough, when did you last buy groceries.

**Soup kitchen / community meal (implemented).** A free hot meal, once a day. No means test at the door. The people who go aren't a type — they're whoever needs a meal that day. The interaction is simple: you show up, you eat. What the prose carries is what showing up means for this character on this day: the first time, the twentieth time, the time you ran into someone you know.

**Food bank (implemented).** Bags of shelf-stable food, once a week. You take what's available. This isn't a restaurant — the selection is whatever was donated. You carry it home. What it costs is the trip and the waiting. What it provides is calories for the next few days, or the week, if you're careful.

### Movement

Going from one place to another takes time and has transition prose. The prose reflects your state — walking to the bus stop when exhausted reads differently than walking there when okay. Movement isn't fast travel. It's the effort of going somewhere.

## Work

Work is the thing you have to do whether or not you can. The specific shape depends on employment type.

### The daily grind (formal employment)

You have a shift. You're expected to be there. Being there means doing tasks — the number expected depends on the job. Tasks cost energy and time. Breaks exist. Coworkers exist. The supervisor exists as a presence whether or not they speak.

The experience of work isn't "complete tasks, earn points." It's: you're here, the clock moves, you do what you can, some days you can focus and some days you can't. Inability to focus doesn't mean you chose not to — it means the energy or stress or hunger wouldn't let you. The game doesn't distinguish between "won't" and "can't."

### Standing at work

Standing isn't a score. It's a social reality — the sum of how people at work experience you. It's relational, not mechanical.

**What shapes it:**
- **Showing up** — being there, on time, consistently. But "on time" means different things. Two minutes late at an office where nobody's watching is nothing. Two minutes late at food service when the rush is hitting and someone's been covering your station is a different thing entirely. Whether you called ahead matters. Whether someone saw you come in matters.
- **Patterns, not instances.** One late day is noise. Three late days this week is a story people tell about you. The simulation should track patterns, not punish each event independently.
- **Doing the work** — but also: what "doing the work" means varies by job. Food service cares about presence and speed. Office might care more about output. Retail cares about the floor being covered.
- **The social layer** — being pleasant to be around, talking to people, not causing friction. This isn't separate from standing — it *is* standing, for most jobs. A coworker who likes you covers your late arrival. One who doesn't mentions it to the supervisor.

**What standing isn't:**
- A number that ticks down from lateness and never recovers
- Separate from your relationships with the people you work with
- The same across all job types

Standing should be able to improve — showing up, doing your tasks, being decent to people around you. It should also be able to decline from more than just lateness — being absent socially, not pulling weight, friction with coworkers. The gradient runs in both directions.

### Coworkers

Two coworkers, each with a personality flavor:
- **warm_quiet** — offers coffee, half-smiles, doesn't push. Easy to be near.
- **mundane_talker** — weather, shows, complaints. Background noise that's sometimes comforting.
- **stressed_out** — their own problems, visible and leaking. Sometimes solidarity, sometimes exhausting.

Talking to a coworker is a social interaction. It costs energy but reduces stress and improves social state. The prose varies by their flavor and your mood — the same coworker reads differently when you're fraying versus when you're clear.

But coworker relationships aren't just a stress valve — they have consequences. A coworker you've been warm with is a buffer. One you've ignored is neutral at best. These relationships shape how lateness lands, whether someone covers for you, whether a bad day at work stays quiet or gets noticed.

### Employment types

(See Employment section — formal, freelance, gig, informal, unemployed, can't work. Each reshapes what "work" means in the daily experience.)

## Money

Money is a number the player only vaguely knows. Like time, financial awareness degrades with distance from direct observation. You checked your bank app yesterday and had around $40. Today you bought groceries. How much do you have now? The prose reflects your fidelity:
- Just checked: "$32"
- A while ago: "around thirty dollars"
- Longer: "not much — under forty, maybe"
- Much longer: "enough for now" or "not enough"

### Spending

Every purchase is a decision the player feels. Groceries cost $8-14. A cheap meal costs $3-5. These aren't big numbers but they're most of what you have. The interaction is available if you can afford it; if you can't, it's just not there (opaque constraints — you don't see "insufficient funds," the option is simply absent).

### Life history (implemented)

Financial position at any age is the integral of everything that happened: family origin, career stability, life events. The game generates this backstory — compressed, like Dwarf Fortress legends — and derives financial parameters from it.

**Nothing is arbitrary.** The ideal end state is a simulation where every parameter has a reason. Pay rate from job type. Rent from housing quality from income bracket. Starting money from years of accumulation minus crises. Personality shaped by events. As the backstory system grows, arbitrary chargen parameters become derived ones.

**Two-phase generation:**
1. **Broad strokes** (charRng, ~4 calls) — economic origin, career stability, 0–2 life events. The story the player could see.
2. **Fine-grained simulation** (post-finalization, deterministic) — year-by-year accumulation producing exact starting money, pay rate, rent amount, financial anxiety, personality adjustments, work sentiments, job standing.

**Economic origin** — where you started: precarious (grew up poor), modest (lower-middle), comfortable (middle class), secure (upper-middle). Determines accumulation rate, event pool, rent bracket, and whether life events cause lasting damage or temporary setbacks.

**Career stability** — how steady adult life has been (0.0–1.0). Low = gaps, disruptions, restarts. High = continuity, accumulation. Shapes starting savings, work sentiment, job standing.

**Life events** — 0–2 events that happened along the way. Each affects finances AND other dimensions: medical crisis (money drain + health anxiety), job loss (money drain + work dread + self-esteem damage), family help (money boost + guilt), relationship end (money drain + self-esteem hit). Secure origins cushion impacts (family safety net). Personality adjustments are additive nudges, not overrides.

### Income (implemented)

Paychecks arrive every 14 days on a character-specific offset. Amount = `pay_rate * days_worked / 10`. Pay rate comes from job type (food service $480, retail $520, office $600 biweekly). Missing work reduces the next paycheck proportionally.

### Bills and obligations (implemented)

Four bills on rotating 30-day cycles, each with a character-specific offset:
- **Rent** — from backstory (origin bracket × stability, range $400–950)
- **Utilities** — $65/month (approximation — should eventually derive from season, apartment, usage)
- **Phone** — $45/month (approximation — should eventually depend on plan type)

Auto-deducted. If money is sufficient: deducts, notification with perceived balance. If insufficient: money → $0, bill fails, "declined" notification, +8 stress, +0.03 financial anxiety.

### Financial anxiety (implemented)

A sentiment (`{target: 'money', quality: 'anxiety'}`) that connects to the neurochemistry engine:
- At home: lowers serotonin target (the weight of bills you haven't checked)
- At work: lowers dopamine target (working for money you'll never keep)
- Accumulates from failed bills (+0.03), small relief from paycheck when broke (-0.01)
- Sleep processing factor 0.6 (entrenches like dread)
- Chargen baseline from backstory — precarious origins start with higher financial anxiety

Direct money level also affects NT targets: low balance → serotonin penalty, very low → cortisol spike.

### Financial thresholds

Financial anxiety isn't linear. Crossing thresholds changes the texture:
- Cushioned → comfortable: background awareness, no pressure
- Comfortable → okay: you notice prices
- Okay → careful: you start checking the bank app
- Careful → tight: you start doing math in your head at the store
- Tight → scraping: you know the number without checking. It's always there.
- Scraping → broke: which bill fails this month

## People

### Friends

Two friends, each with a personality flavor that determines how they relate to you. They're not quest-givers or content dispensers. They're people who exist whether or not you engage with them.

**sends_things** — constant low-effort contact. Memes, links, screenshots. Texts often, regardless of your state. The friend who's always there in the background. Doesn't require reciprocation.

**checks_in** — notices your absence. Texts more when you've gone quiet. "Hey, you good?" The frequency increases with your isolation. Can feel caring or suffocating depending on your state.

**dry_humor** — steady, their own rhythm. Texts when they have something. Not affected by your state. The friend who's easy to be around because they don't ask.

**earnest** — less frequent, more weight. Texts when they mean it. A message from an earnest friend lands differently than a meme from a sends_things friend.

### Distance and absence

Not everyone in your life is nearby. Some people exist only on the phone — the friend who moved, the relative across the country, the person you've never met in person but who knows you better than most.

**Online friends** — real relationships that live in text. The friend you met in a forum, a game, a group chat. They've never seen your apartment but they know when you're not okay. The conversation that picks up at 2 AM because they're in a different timezone. The friendship the people around you don't understand because "you've never even met them." The intimacy is real. The distance is real too — you can't call them to help you move, they can't bring you soup, the support they offer is words on a screen and sometimes that's everything and sometimes it's not enough.

**Long-distance relationships** — the partner, the best friend, the sibling who moved. The phone call that's scheduled because spontaneous doesn't work across timezones. The visit that costs money you might not have. The gap between "we'll see each other soon" and the calendar. The relationship that's maintained through effort, and the effort is invisible to everyone except the two people making it. Some long-distance relationships are stronger than what's nearby. Some are slowly dying and neither person says so.

**Sick people, remotely** — the parent with cancer three states away. The friend whose messages changed and you don't know why until they tell you. The grandparent in the hospital and you can't afford the flight. The phone becomes a different object — every notification could be an update, and updates aren't always what you want. The helplessness of caring about someone you can't reach. The guilt of not being there, which is different from choosing not to be there. The call you put off because you don't know what to say, and the longer you wait the harder it gets.

**The phone as bridge** — for distant relationships, the phone isn't a convenience. It's the relationship's entire infrastructure. A dead phone battery isn't an annoyance — it's a severed connection. Not checking messages isn't avoidance — it might be the distance winning. The weight of an unanswered text from someone far away is different from an unanswered text from someone down the street.

### Social decay

Isolation builds over time without interaction. It's not a punishment — it's physics. You don't talk to people, the distance grows, everything feels further away. Friends respond differently to your withdrawal (checks_in escalates, sends_things stays constant, dry_humor doesn't notice, earnest worries silently).

Responding improves things. Ignoring doesn't make it worse immediately — but time does. Neither is judged.

**Quantitative model (implemented).** `social` (0–100) decays exponentially toward a character-specific floor during isolation: `social = floor + (social − floor) × exp(−hours × neuroMod / 66)`. τ=66h (range 48–120h from isolation literature). Neuroticism scales rate ±35% — anxious characters lose connection faster. The floor is `trait_loneliness × 0.25` — a structural baseline set at chargen (h²=48%); high-trait-loneliness characters never fully return to zero loneliness even after contact.

**Social energy** — a separate dimension. `social_energy` (0–100) tracks the felt cost of engagement. Depleted by interaction, scales with `introversion` (0.2–0.8× of the social gain amount — introverts deplete faster). Recovers in solitude at 3 pts/hr × introversion recovery scale (0.6–1.4×). Fully resets with sleep. Introverts don't connect less — they pay more for it and recover more in solitude.

### Friend absence effects (implemented)

Friends who reach out and get silence back generate guilt — the specific weight of knowing someone cared and you didn't respond. This is distinct from social isolation (the general state of not talking to people). You can be socially fine and still guilty about a specific friend you've been ignoring.

**Per-friend contact tracking.** `friend_contact` map (keyed by slot name) records the game time of the last message engagement per friend. Scales to any number of friends. First sleep initializes contact times — no retroactive guilt.

**Guilt accumulation during sleep.** After a 1.5-day grace period, guilt builds each night. Growth rate ~0.005 per night, scaling gently with absence duration (up to 1.6x at 14+ days of silence). Unread messages from the ignored friend intensify growth by 40% — the message sitting there, visible, unanswered, makes it worse.

**Phone screen amplification.** Seeing unread friend messages on the phone screen nudges guilt by `guilt * 0.02` — a consistent ~2% proportional increase. Only fires when guilt is already above 0.03, so it amplifies existing guilt rather than creating it. Each check makes the next check slightly heavier.

**Reading as relief.** Reading a friend's message resets the contact timer and reduces guilt by 0.02. Small per-message, but consistent — engaging with what they sent is the mechanism for recovery.

**Serotonin target penalty at home.** Friend guilt lowers serotonin target when at home (where you could reach out but aren't). Max ~6 points at extreme guilt toward both friends. Small, persistent, and location-specific.

**Guilt-aware idle thoughts.** 16 guilt-specific thoughts (4 per friend flavor), weighted by `guilt * 8`. Fire regardless of social tier. Themes: the gap widening, the asymmetry of reaching out, the difficulty of starting after silence. Distinct from the existing isolated friend thoughts — these are about the specific weight of not responding, not general loneliness.

**Sleep processing.** Guilt's processing factor is 0.7 — between comfort (1.0) and dread/irritation (0.6). Not as entrenched as dread, but not as easily processed as comfort. Good sleep helps, but the fix is engaging with the person, not sleeping it off.

### Family

Family isn't chosen. That's the thing. A friend who hurts you, you can stop calling. A parent who hurts you is still your parent, and the weight of that doesn't go away when you move out.

**The spectrum of parental relationship:**

**Supportive** — they call, they mean well, sometimes they help. The phone lights up with their name and it's fine. Maybe even good. This is the baseline the world assumes everyone has.

**Conditional** — they love you, but. The "but" is where it lives. They love you but they wish you'd chosen a different career. They love you but they don't use your name. They love you but they liked who you were before. The condition is never stated. It's the shape of every conversation — the thing they don't ask about, the compliment that's also a correction, the silence after you tell them something true.

**Hostile** — active rejection. Could be about identity (trans, gay, nonbinary). Could be about life choices (career, partner, religion, dropping out). Could be about nothing you can name. The consequences are material:
- **Financial cutoff** — especially devastating for younger characters. A teen whose parents stop paying for things. A college student cut off. An adult who was counting on help that evaporated.
- **Housing** — being kicked out. For a teen, this is existential. For an adult, it's a crisis that doesn't announce itself as one.
- **Social network damage** — the parent who tells the rest of the family. Holidays that become performances or absences. Siblings who take sides.

**Absent** — not hostile, just gone. The parent who left, who died, who was never there. The absence is its own weight. The contact that doesn't exist in the phone. The form that asks for an emergency contact.

### Upbringing and neglect

Neglect isn't one thing. The empty apartment looks the same from the outside. The kid in it knows why it's empty, and the why is everything.

**Working** — they love you. They're just never here. Double shifts, two jobs, the commute that eats the evening. The microwave dinner isn't neglect to them — it's the best they can do. The guilt is theirs but the loneliness is yours. You learn to take care of yourself early. You learn that love and presence aren't the same thing.

**Indifferent** — they're here but you're not a priority. The fridge is empty because nobody thought about it. Your school thing is today and nobody remembered. Not cruel — just... you're in the background. You learn that needing things is an inconvenience. You stop asking.

**Overwhelmed** — they can't cope with their own life, let alone yours. Depression, substance issues, their own trauma. The parent who's more like a child. You end up parenting them — making sure they eat, cleaning up, managing their moods. Parentification: you're ten and you're the adult in the house. You learn that care flows one direction and it's away from you.

**Resentful** — you look like him. Or you remind her of the life she didn't get to have. Or you're the reason they're stuck. They keep you fed, keep a roof over you, and that's all they can do. The love that should be automatic has something in the way — something that isn't your fault but lives in the space between you. You learn that your existence is a burden. That takes a long time to unlearn, if it ever does.

**Abusive** — active harm. Physical, emotional, sexual. Not the absence of care but the presence of damage. This is trauma at the deepest level — it shapes the body's responses, the relationship to authority, the flinch, the inability to trust care when it's offered. The game doesn't need to depict the abuse. It models what comes after: the adult who carries it.

These aren't exclusive. A parent can be working and resentful. Overwhelmed and loving. Absent and mourned. The upbringing is a character property like origin — it's the soil everything else grew from. It shapes what the character expects from people, what care looks like to them, what they flinch at, what they can't receive even when it's offered.

**Age shapes everything:**
- A child or teen under a hostile parent has almost no agency. The parent controls housing, food, money, mobility. Judgment isn't just emotional — it's material power over your life.
- A young adult might be financially dependent, partially or fully. Cutoff is a cliff.
- An independent adult still carries it. The phone call you dread. The holiday math. The voice in your head that sounds like theirs.

The phone is where this relationship lives for most ages. A message from a supportive parent and a message from a conditional parent look the same on the screen. The difference is in the body — the chest, the jaw, the pause before opening it.

### Coworkers and supervisor

Coworkers are social proximity, not chosen relationships. The supervisor is an authority relationship. These people exist at work. They have patterns. You interact with them or you don't. (See Work section.)

## The Phone

The phone is the surface through which most systems become visible. It's not a UI element — it's a simulated object with real state.

### What the phone is

- An inbox that accumulates messages whether or not you look
- A bank app that shows you a number you wish were different
- A connection to people who care about you in ways you can't always receive
- A source of obligations (work messages, bills, notifications)
- A clock you can check
- Sometimes the only private space you have

### Phone state

- Inbox: messages arrive over time, accumulate as unread, are discovered when you check
- Silent mode: controls whether notifications interrupt you
- Battery: drains over time, dies, needs charging
- The act of checking is itself meaningful — compulsive checking vs avoidance are both expressions of state

### Message sources

Messages come from the simulation, not from dice rolls:
- **Friends**: personality-driven frequency, social-state-modulated
- **Work**: event-triggered (late, deadline, client, supervisor — depends on employment type)
- **Financial**: event-triggered (purchase confirmation, deposit, low balance, bill due)
- **Bills**: scheduled (monthly cycle)

Each message has text generated at arrival time. The phone holds it until you look.

## Objects

The phone is the most complex object, but it's not the only thing in the world with state. Objects that exist in real life have presence in the simulation.

### The alarm clock

State: set or not, what time. The alarm is a relationship — you set it hoping tomorrow-you will obey it. Tomorrow-you might not. Snoozing is always available. Turning it off is always available. The alarm doesn't judge.

### The fridge

State: how much food, slowly degrading. The fridge is the answer to "should I eat" and sometimes the answer is empty. Groceries restock it. Time empties it. An empty fridge at 2 AM is a specific kind of loneliness.

### Clothes

State: what you're wearing, whether you got dressed. Getting dressed is a transition from "not yet participating in the day" to "technically ready." The outfit reflects mood — low mood means the easy clothes, the ones that don't require decisions.

### The shower

Using it costs energy but reduces stress. Not using it costs nothing mechanically but the prose knows. Showering is the thing you know you should do and sometimes can't. Not "won't" — can't. The game doesn't distinguish.

## The Inner Life

### Narration voice

The game's narration isn't neutral. It's colored by who the character is and how they're doing. Mood changes what gets noticed and how. Personality changes sentence rhythm, what matters, what's overlooked. Trauma changes what's loaded — a place, a person, a time of day can carry weight the game never explains. Neurodivergence changes the structure of attention itself.

But the prose is never prescriptive. It doesn't say "you feel sad." It shows you a world through a particular lens, and the feeling is yours. Emotionally loaded, never emotionally labeled. The same apartment, the same morning, the same phone — but the words are different because the person behind the eyes is different.

This is the game's primary expressive tool. Not mechanics, not UI, not numbers — the voice.

### Mood

> Full emotional architecture: see [emotions.md](emotions.md). This section is the high-level vision. That document describes the mechanics — neurochemical baseline, directed sentiments, surface mood emergence, emotional inertia, and how it all connects to substances, endocrine, trauma, and identity.

Mood isn't derived. It isn't a readout of energy plus stress plus hunger. It's its own thing — a state the body is in that moves on its own timeline.

**Mood has inertia.** It doesn't snap to match conditions. You can be rested and fed and still heavy. You can be exhausted and have a moment of clarity. Numb doesn't lift because you ate a sandwich. A good day when you're numb might nudge you toward flat. Not toward clear. Clear is rare and you have to get there the slow way.

**Mood is influenced, not determined:**

- **State pressure** — energy, stress, hunger, social connection push on mood. Low energy pushes toward heavy. High stress pushes toward fraying. Isolation pushes toward hollow. But mood resists. The push takes time.
- **Endocrine rhythms** — hormonal cycles, cortisol patterns, thyroid function. The body's chemistry has its own schedule. Some days are worse for reasons the character can't name.
- **Weather** — the grey day that sits on you. Air pressure dropping before a front. The thing everyone jokes about but that's real.
- **Sleep quality** — not just duration but depth. Determined by six multiplicative factors: stress state, hunger, melatonin at onset, circadian alignment, caffeine, and rain comfort. Deterministic — the same conditions produce the same quality. What varies is the conditions.
- **Autonomous drift** — the body's own noise. Incommensurate sine waves, not PRNG — deterministic biological rhythms that produce "some days are harder" variability without consuming RNG. Invisible forces on their own timescale, opaque to the player.
- **Substances** — chemical mood alteration. Alcohol loosens the fraying, then drops you somewhere worse. Nicotine is a mood floor — the cigarette doesn't improve anything, it stops withdrawal from pulling you down. Caffeine sharpens until it doesn't. Cannabis blurs the edges. Harder things override mood entirely, then leave. Each substance has its own curve: the push, the plateau, the cost after. Tolerance narrows the push. Withdrawal is its own autonomous force — the body demanding what it's used to, dragging mood somewhere ugly until it gets it or gets through it.
- **Actions** — some things push mood directly, not through the state layer. A hot shower when you're heavy — the warm water is a moment of okay that isn't about stress reduction. Eating when starved. A conversation that actually lands, not just social contact but genuine connection. Going outside. Music. These aren't large. They're cracks in whatever the mood is, moments where the body remembers something else is possible. Not every instance works — a shower when you're numb might be nothing. Whether an action reaches mood depends on where mood already is.
- **Inaction** — stagnation has its own weight. Hours of nothing push toward flat, then numb. Not because a state value changed, but because the absence of doing anything is itself a force. The couch, the ceiling, the phone you're not looking at. Inaction doesn't feel like rest. Rest is doing nothing on purpose. Inaction is doing nothing because you can't start.

**Mood states** (not a spectrum — a landscape):

- **numb** — depleted and stressed past the point of feeling. The absence of the energy for feeling.
- **fraying** — high stress. Everything too loud, too close, too much.
- **heavy** — low energy. Gravity is personal today.
- **hollow** — isolated and stressed. The shape where something used to matter.
- **quiet** — isolated but not calm. Used to the silence. The distance isn't painful anymore. It just is.
- **clear** — rested and calm. Rare. You notice it because it's unusual.
- **present** — okay energy, manageable stress. Here, actually here.
- **flat** — default. Getting through it. Not good, not bad. The most common state.

Mood selects prose variants. The same action, the same location, the same moment — described differently depending on where you are inside.

### Prose-neurochemistry interface

`moodTone()` picks which emotional territory — the trunk. But within that territory, neurochemical values shade the prose continuously. Three layers compose the final text:

1. **Coarse selection** — `moodTone()` picks the mood branch (heavy, flat, numb, etc.). Stays as a discrete selector. This is the right tool for "which pool of texts."

2. **Weighted variant selection** — within a mood branch, individual texts carry weights derived from NT values via `State.lerp01()`. A thought about not being able to start anything gets weight from low dopamine. A sensory-overload thought gets weight from high NE. General texts have weight 1 (always in pool). `Timeline.weightedPick()` replaces `Timeline.pick()` — same single RNG call consumed, no replay impact.

3. **Deterministic modifiers** — short phrases appended based on NT checks (adenosine fog, NE+low-GABA restlessness, cortisol body tension). No RNG consumed — pure conditionals. These add undertone that the weighted selection can't: the fog over everything when adenosine is high, the restless vibration under a quiet room when NE is elevated and GABA is depleted.

**NT dimensions and what they shade:**

| System | Low | High | What it does to prose |
|--------|-----|------|----------------------|
| serotonin | darker word choice, hopelessness, the undertow | warmer, more possibility, genuine okayness | overall emotional coloring |
| dopamine | going-through-motions, can't start, behind glass | engagement, wanting, the pull toward doing | whether the character *cares* |
| norepinephrine | calm, things not reaching you | hyperalert, sensory detail, tension, scanning | what they *notice* |
| gaba | unease, things slightly wrong, vibrating underneath | settled, quiet underneath, brakes that work | anxiety undertone |
| adenosine | sharp, clear perception | fog, heaviness, blurred edges, dissolving thoughts | perceptual clarity |
| cortisol | no physical tension | tight shoulders, stomach knot, body-as-fist | body stress |

This pattern applies everywhere prose reads state: location descriptions, interaction results, idle thoughts, events. Each site uses whichever layers are appropriate — a description might use only deterministic modifiers (zero RNG), while idle thoughts use all three layers.

### Sensory compositor (implemented)

What you notice depends on what state you're in. The same room at the same time of day reads differently when you're exhausted, anxious, caffeinated, dissociated. This isn't just word choice — it's what gets noticed at all.

**Observation pipeline.** `senses.js` maintains a set of observation sources (27 sources across apartment, outside, work, and interoceptive channels: acoustic, thermal, visual, olfactory, interoceptive). Each source has a salience value. What surfaces depends on an NT-driven salience threshold: overwhelmed characters notice more (lower threshold = more intrusions); dissociated characters notice less. Salience is modulated by habituation — familiar things fade. Change detection spikes salience when something shifts (rain starting, a tier crossing).

**Realization engine.** `realization.js` turns observations into sentences. Per-source lexical pools (the specific words for *this* fridge hum, *this* rain sound) combined with 9 sentence architectures selected by NT state — calm produces subordination, anxious produces short declaratives, dissociated produces grammatical equality. The same fridge hum reads differently under different NT states, not because the fridge changed but because what the character brings to it changed.

**Habituation.** The fridge hum you've heard every day for two years doesn't surface the way it did when you moved in. `habituationFactor()` decays salience over time since arrival (τ=40 min for moment-to-moment habituation). Long-term location familiarity — accumulated across many sessions — is not yet modeled; the fridge resets to salient on every arrival.

### Observation fidelity

You don't have perfect information about your own life. Time drifts. Money is approximate. This isn't a fog-of-war mechanic — it's the experience of not always knowing exactly what's going on because you're tired and distracted and hungry.

Observation fidelity degrades with distance from direct observation and sharpens when you look. This affects both the awareness display (the peripheral sense of time and money) and the prose.

### Trauma

Trauma isn't a condition or a status effect. It's a lens. It can be part of who the character is from the start, or it can develop during play. It doesn't require a name or a backstory — the game models the residue, not the event.

Trauma manifests as texture, not exposition:

**Absences** — interactions that should be there but aren't. A place that can't be entered easily. A person who can't be called. The game never explains why. The option is simply not available, or it's there but costs more than it should.

**Involuntary reactions** — the body responding before the mind can intervene. An interaction is available, you take it, and the prose contracts — goes flat, goes short, goes somewhere else. Not "you feel triggered" — the words themselves change. Shorter sentences. Loss of detail. The narration pulling away from the moment. Sometimes the character does the thing and the body rebels: the tightness in the chest, the nausea, the sudden need to leave. You chose the interaction. You couldn't choose the reaction.

Triggers can be orthogonal to the actual relationship. A coworker who's genuinely kind, who you'd call a friend — but they're male, or they're loud, or they stand too close, or they remind the body of something the mind has filed away. The relationship is warm. The flinch doesn't care. You like this person and your chest tightens anyway. The game doesn't explain the contradiction. It just lets both be true.

**Loaded moments** — a time of day, a sound, a type of message, a quality of light that carries weight the game never explains. The prose shifts when these are present. The same morning reads differently because of something the game doesn't name.

**Avoidance** — what the character gravitates away from. Not as a visible pattern the game announces, but as the shape of what they do and don't do over time. The player might notice it. Or they might not.

Not all trauma is dramatic. Some is quiet — the friend who stopped calling, the job you lost, the thing you never talk about. Some is structural — the world being built for people who didn't live your life. The game doesn't rank it. It models the weight.

Trauma interacts with everything: it shapes narration voice, it modifies available interactions, it affects how relationships feel, it changes what the phone means, it makes certain moments heavier than others. It's not separate from mood or personality — it's underneath them.

### Inner voice

The character has an internal monologue — the voice that comments, loops, anticipates, justifies, and returns to unresolved things. It's typographically distinct from narration: set in italics, rendered as its own block, visually separate from the third-person prose. The player always knows where they are.

**What the voice says:**

- **Looping** — returns to things not yet resolved. The bill. The message. "You still haven't."
- **Rationalization** — justifying avoidance or inaction. "Just a few more minutes." "You'll do it tomorrow."
- **Anticipatory dread** — knowing how something goes before it happens. The voice that's already at the destination.
- **Flat commentary** — observation without judgment. "Again."
- **Memory intrusions** — something in the environment surfaces a fragment. Not explained. Just there.

**Frequency and intensity are state outputs**, not fixed rates. The voice is quiet when the character is calm. It becomes intrusive when conditions warrant it. The NT cluster that drives high frequency and high intensity: low GABA (anxiety undertone), high NE (hyperalert, scanning), low serotonin (darker coloring), high rumination. These don't produce a named "spiral" state — that's colloquial shorthand for a specific NT configuration. The simulation just knows the values. The experience emerges.

**Visual intensity tiers:**

- *Quiet italic* — baseline. Calm observation, flat commentary. Present but not intrusive.
- *Uneasy* — slightly altered spacing or tracking. Something slightly wrong.
- **Prominent** — heavier weight or displacement. Intrusive. Hard to ignore.
- Tremor animation — the voice won't stop. Reserved for the highest NT thresholds. CSS `animation: shake`.

The visual treatment is itself a simulation readout. The player never sees "you are anxious." The text moves instead.

**Rarity is the mechanism.** The tremor only lands if the player has spent most of their time seeing quiet italics. The threshold for heavy treatment must be high — genuine NT cluster conditions, not mild stress. Overuse collapses meaning.

**`prefers-reduced-motion`:** Tremor animation collapses to static high-contrast styling — same intensity communicated without motion.

### Habits

> Full design: see [habits.md](habits.md).

The character has habits. The character acts. The player interrupts.

Every day: wake, dress, shower, eat, commute, work, commute, eat, sleep. Clicking the same actions in the same order isn't constrained agency — it's data entry. The answer isn't skipping the routine (that removes the experience) or shortcut buttons (that dodges the problem). The answer is that the character is a person who develops habits, and habits are actions that happen without deciding.

A habit isn't a sequence — it's an association: in this context, I do this thing. Each habit is independent. The system discovers which features of the game state matter from observed play patterns, using CART decision trees trained on (state snapshot, action taken) pairs. No configuration, no declaring routines.

Habit strength is a gradient: low (game notices patterns), medium (suggested default action), high (character acts, player interrupts). Routine comfort/irritation sentiments modulate formation rate. The system is ephemeral — derived from the action log each session, consuming no RNG.

## Weather

Weather is atmosphere, not a system. It changes slowly (3% chance per action). It affects prose tone — overcast days read differently than clear ones. Rain changes what the street feels like. Weather doesn't gate actions. Via the character's weather sentiment (liked/disliked weather generated at chargen), it nudges serotonin targets — max ±3.4 points, small compared to sleep quality (±20). The mechanical effect is indirect and character-specific: two characters in the same rain feel it differently.

States: clear, overcast, drizzle, grey, snow (winter + cold only). Subtle gradations, not dramatic events.

## Age

Any age is valid in character creation. No restrictions. The world adapts.

Age doesn't gate — it shapes. A 10-year-old and a 45-year-old both exist in the same simulation, but almost everything about their daily texture is different: what work means, where money comes from, what the phone is for, what "constrained agency" feels like.

### Life stages (rough, not rigid)

**Child (under ~13)**
Work: mowing lawns, pet sitting, odd jobs for neighbors. Not employment — favors, hustle, helping out.
Money: could be pocket change, could be contributing to household survival. Don't assume comfort.
Phone: social (if they have one). Group chats, parents, maybe a game. Or no phone at all.
Constraints: adults decide things. School. Limited mobility. Agency is small and fiercely guarded.

**Teen (~14-17)**
Work: fast food, retail, babysitting, tutoring. Limited hours, limited pay. Maybe under-the-table work.
Money: first taste of earning. Might be spending money, might be rent contribution. Age doesn't determine which.
Phone: social gravity well. Also potentially the only private space they have.
Constraints: almost-adult responsibilities with child-level power. The gap is the thing.

**Young adult (~18-25)**
Work: entry-level, gig economy, freelancing, service industry. High turnover, low leverage.
Money: bills arrive. The learning curve of fixed costs against variable income.
Phone: the anxiety device. Bank app, work messages, bills, social obligations.
Constraints: freedom that turns out to be expensive.

**Adult (~26-50)**
Work: career if lucky, lateral moves if not. Freelance can mean independence or precarity depending on the month.
Money: maybe stable, maybe not. The distance between "fine" and "not fine" might be one bad month.
Phone: obligations.
Constraints: locked in or starting over. Both are hard.

**Older adult (~50+)**
Work: what you have, or what you can find. Age discrimination is real and invisible.
Money: fixed income, or dwindling savings, or still grinding. Health costs.
Phone: lifeline or burden. Friends text less. The contacts list has ghosts in it.
Constraints: body, money, invisibility. Agency narrows in ways that aren't your fault.

These aren't categories to implement as enums. They're lenses for writing prose and tuning parameters. A 30-year-old freelancer and a 30-year-old retail worker live in the same age band but different worlds.

## Employment

Employment isn't one system. It's a landscape shaped by age, circumstances, and luck.

### Types

**Formal employment** — regular schedule, regular pay, a supervisor who notices when you're late. Stable but constraining. Losing it is a cliff.

**Freelance / commissions** — irregular work, irregular pay. You find gigs or they find you. The stress isn't being broke — it's not knowing when the next payment comes.

**Gig work** — apps, deliveries, rides. Available on demand but pays badly and has no floor.

**Informal work** — cash, no records, no protections. Mowing lawns, helping someone move, selling things. Available at any age. Often the only option.

**Unemployed** — looking or not looking. Both are exhausting in different ways.

**Can't work** — disability, caregiving, age, circumstances. Income from assistance, family, nothing. The simulation doesn't judge why.

### Employment affects everything

- What "going to work" means (or that it doesn't exist as a concept)
- What work messages look like (supervisor, client, app notification, neighbor asking for help)
- Income pattern (regular, irregular, absent)
- The flavor of financial anxiety
- What the phone is for

## Income & Financial Insecurity

Money isn't a score. It's a source of anxiety or relief, and the simulation should model what makes it feel that way.

### Irregular income

Freelancing and gig work mean income arrives unpredictably:
- Payments arriving at irregular intervals (not a biweekly paycheck)
- Amounts varying (a good commission vs a small one)
- Gaps between payments (the silence is the stress)
- The emotional difference between "expecting a payment" and "hoping for one"

### Bills and obligations

Bills arrive on schedule whether or not income does. The collision between regular obligations and irregular income is where financial insecurity lives.
- Rent: monthly, non-negotiable, the biggest number
- Utilities: monthly, variable, always a little more than last time
- Phone bill: monthly, you need it, it costs more than it should
- Food: continuous, flexible but non-optional

## Content and Consent

The game depicts difficult realities honestly. The player should choose what they're willing to engage with.

### Before starting

A content warning — not vague, not corporate. Direct: "This game can include domestic violence, abuse, addiction, poverty, mental illness, and other difficult experiences. It depicts them as daily life, not as drama. Nothing is softened."

### Content levels

Broad tiers that shape what the character generator can produce:

- A baseline tier that stays within everyday struggles — financial stress, work pressure, loneliness, family tension, health issues. The daily texture of a constrained life without the darkest material.
- A full tier that opens everything — DV, abuse, foster care, assault aftermath, addiction, forced pregnancy, severe poverty, homelessness. The unfiltered experience.
- Whatever tiers make sense between those extremes.

The tiers aren't "easy mode" and "hard mode." A baseline life can be devastating in its own right. The tiers control the *category* of experience, not the intensity. Within whatever tier the player chooses, the game depicts with full fidelity. No soft versions.

### Fine-grained configuration

Optionally, the player can toggle specific content categories independently. Someone might be ready for poverty and addiction but not DV. Someone might be fine with everything except sexual assault. The configuration is a list of what can appear in their game.

This isn't about judging what's "too much." It's about consent. The player knows what they're ready to sit with. The game respects that. What it doesn't do is lie about what's inside — if DV is enabled, the DV is real.

### Implementation

Content configuration happens before character generation, not during play. The character is generated within the constraints the player set. Once you're in, you're in — the game doesn't interrupt to ask "are you sure?" That would break immersion. The consent happens once, at the door.

The configuration should be revisitable between runs. You might start with baseline and come back later ready for more. Or you might dial something back after a run that hit too close. Neither is judged.

## What the Game Doesn't Have

This is as important as what it does have.

**No objectives.** Nothing tells you what to do today. Nothing evaluates whether you did it right.

**No visible numbers.** The player never sees energy: 23 or money: $14.50. They see prose that reflects those values through qualitative lenses.

**No judgment.** Staying in bed all day isn't failure. Going to work isn't success. Calling in sick isn't giving up. Eating cereal for dinner isn't sad. The game describes. It doesn't evaluate.

**No progression.** There's no skill tree, no leveling up, no unlocks. Day 30 has the same mechanics as day 1. What changes is the state — your money, your relationships, your job standing, the mess in your apartment. Whether that's "better" or "worse" is not for the game to say.

**No tutorial.** The game doesn't explain itself. Interactions appear when they're available and disappear when they're not. The player learns by existing in the space, not by being taught.

**No win state. No fail state.** The game continues. It might end — that's a design question. But it doesn't end because you "won" or "lost." It ends because a life ended, or because you stepped away.
