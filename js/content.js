// content.js — all text content, variants, events
// A world, not a script. Text carries everything.

export function createContent(ctx) {

  // --- Relationship prose tables ---
  // Keyed on flavor archetype. Name is the only dynamic part.

  /** @type {Record<string, (name: string) => string | undefined>} */
  const friendMessages = {
    sends_things: (name) => {
      const dopa = ctx.state.get('dopamine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `${name} sent a picture of a cat sitting in a shopping bag. No caption. None needed.` },
        { weight: 1, value: `A message from ${name} — a screenshot of a tweet, no context. The kind of thing that means she was thinking of you.` },
        { weight: 1, value: `${name} sent a voice memo. Fifteen seconds of background noise and half a laugh. That's it.` },
        { weight: 1, value: `A link from ${name}. No message, just the link. You tap it, skim two sentences, close it.` },
        // Low dopamine — the gesture doesn't land
        { weight: ctx.state.lerp01(dopa, 40, 15), value: `${name} sent something. A picture, a link — you see the notification. You don't open it. It sits there, proof that someone thought of you, and that proof does nothing.` },
      ]);
    },
    checks_in: (name) => {
      const ser = ctx.state.get('serotonin');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `A message from ${name}. "Hey, you good?" You stare at it. You don't type anything back yet.` },
        { weight: 1, value: `${name} texted. "Haven't heard from you." Simple. Not pushy. That makes it harder to ignore.` },
        { weight: 1, value: `A text from ${name}: "Just checking in." Three words that sit there, waiting.` },
        { weight: 1, value: `${name} sent a thumbs up emoji, then "thinking of you." Nothing else. Nothing else needed.` },
        // Low serotonin — the check-in is a weight
        { weight: ctx.state.lerp01(ser, 35, 15), value: `A message from ${name}. "Hey, you good?" The question lands like something you have to carry. You're not good. The lie you'd have to type is heavier than not answering.` },
      ]);
    },
    dry_humor: (name) => {
      const dopa = ctx.state.get('dopamine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `${name} linked a video with "lmao this is you." You don't watch it yet but you save it.` },
        { weight: 1, value: `${name} in the group chat, complaining about his landlord again. The usual.` },
        { weight: 1, value: `A text from ${name}: "life update: still alive." You almost smile.` },
        { weight: 1, value: `${name} sent a meme. It's not funny, but that's the joke. You get it.` },
        // Low dopamine — the humor slides off
        { weight: ctx.state.lerp01(dopa, 40, 15), value: `${name} sent something meant to be funny. You read it. You understand that it's funny. The understanding and the feeling are in different rooms.` },
      ]);
    },
    earnest: (name) => {
      const ser = ctx.state.get('serotonin');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `A message from ${name}. Something about a sunset. Genuine in a way you can't match right now.` },
        { weight: 1, value: `${name} texted a long paragraph about their week. You read it twice. You don't reply yet.` },
        { weight: 1, value: `A text from ${name}: "Saw something that reminded me of you today." It lands somewhere soft.` },
        { weight: 1, value: `${name} asks how you're really doing. The "really" is doing a lot of work in that sentence.` },
        // Low serotonin — sincerity is unbearable
        { weight: ctx.state.lerp01(ser, 35, 15), value: `A long message from ${name}. Genuine. Open. The kind that would need you to be honest back, and that's the one thing you can't do right now. You read it and close the phone.` },
      ]);
    },
  };

  /** @type {Record<string, (name: string) => string>} */
  const friendIsolatedMessages = {
    sends_things: (name) => `Your phone buzzes. ${name}. You look at the name on the screen. You don't open it yet.`,
    checks_in: (name) => `A message from ${name}. "Hey, you good?" You stare at it. You don't type anything back yet.`,
    dry_humor: (name) => `${name} texted something. The notification sits there. You'll read it later.`,
    earnest: (name) => `Your phone buzzes. ${name}. You look at the name on the screen for a while.`,
  };

  /** @type {Record<string, (name: string) => string>} */
  const friendReplyProse = {
    sends_things: (name) => {
      const dopa = ctx.state.get('dopamine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You tap back a reaction. Quick. ${name} will know you saw it.` },
        { weight: 1, value: `You send something small — two characters, an emoji. The effort is almost nothing, which is the only way it could have happened.` },
        { weight: ctx.state.lerp01(dopa, 40, 15), value: `You send a single character back. The effort it takes is out of proportion to how small it is.` },
      ]);
    },
    checks_in: (name) => {
      const ser = ctx.state.get('serotonin');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You type "yeah, I'm good." You're not sure if it's true. You hit send before you can second-guess it.` },
        { weight: 1, value: `"Been busy." Not a lie, exactly. You send it.` },
        { weight: ctx.state.lerp01(ser, 35, 15), value: `You stare at the text field for a moment. "Sorry, been a lot going on." Vague enough to be true. You send it before you can revise it into nothing.` },
      ]);
    },
    dry_humor: (_name) => {
      const dopa = ctx.state.get('dopamine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You type something brief. He'll understand what it means.` },
        { weight: 1, value: `You send a meme back, or one word, or not much. He doesn't need more than that.` },
        { weight: ctx.state.lerp01(dopa, 40, 15), value: `You send something back. It comes out flat, but that's fine — he doesn't require anything more.` },
      ]);
    },
    earnest: (name) => {
      const ser = ctx.state.get('serotonin');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You write back. It takes a minute — ${name} put thought into hers, and you want to give it some.` },
        { weight: 1, value: `You compose a reply. Not long, but honest. You send it.` },
        { weight: ctx.state.lerp01(ser, 35, 15), value: `You write something short. It doesn't feel like enough. You send it anyway.` },
      ]);
    },
  };

  /** @type {Record<string, (name: string) => string>} */
  const friendReplyMessages = {
    sends_things: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `${name} responds immediately. A follow-up — she had it ready. The thread continues on its own terms.` },
      { weight: 1, value: `${name} sends a thumbs up, then a voice note. Three seconds. The sound of her laughing at something off-screen.` },
      { weight: 1, value: `Another thing from ${name}. She had this one saved. The conversation is alive again.` },
    ]),
    checks_in: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `${name}: "Good. Just wanted to make sure." Then, a beat later: "Let me know if you need anything."` },
      { weight: 1, value: `A response from ${name}. "Okay good. Miss you." Short. Means what it says.` },
      { weight: 1, value: `${name} replies quickly. "okay good :)" And then nothing, which is exactly right.` },
    ]),
    dry_humor: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `${name} sends a meme back. Different one. No explanation needed.` },
      { weight: 1, value: `His response: two words. The whole exchange is complete.` },
      { weight: 1, value: `"lmao" from ${name}. That's it. Conversation finished.` },
    ]),
    earnest: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `A longer reply from ${name}. She's glad you reached out. She asks a follow-up question — gentle, not pushy. You could answer it or leave it there.` },
      { weight: 1, value: `${name} responds warmly. The kind of message that doesn't ask for anything. You feel slightly less alone.` },
      { weight: 1, value: `${name}: "I've been thinking about you." Two more sentences. Genuine. No pressure in it.` },
    ]),
  };

  /** @type {Record<string, (name: string) => string>} */
  const friendInitiateProse = {
    sends_things: (name) => {
      const dopa = ctx.state.get('dopamine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You scroll until something stands out. You forward it without a caption. ${name} will know what it means.` },
        { weight: 1, value: `You find a thing — something she'd like, probably — and send it before you think about it too hard.` },
        { weight: 1, value: `You share something. A picture, a link. The sending takes a second. Small, but it goes out.` },
        // Low dopamine — the gesture feels hollow
        { weight: ctx.state.lerp01(dopa, 40, 15), value: `You find a thing and forward it. The act is flatter than you want it to be, but it goes out.` },
      ]);
    },
    checks_in: (_name) => {
      const ser = ctx.state.get('serotonin');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You type "hey." You delete the rest. The "hey" is enough.` },
        { weight: 1, value: `You open the thread. Two words. Something small. You send it.` },
        { weight: 1, value: `You check in. Brief. Just enough to say you're still here.` },
        // Low serotonin — even small words are hard
        { weight: ctx.state.lerp01(ser, 35, 15), value: `You open the thread. The cursor blinks. You draft three things and delete them. What you finally send is the smallest version of what you meant. You hit send before you can take it back.` },
      ]);
    },
    dry_humor: (name) => {
      const dopa = ctx.state.get('dopamine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You send the thing you've had sitting in another tab for two days. ${name} will get it.` },
        { weight: 1, value: `You type something stupid and send it before you can second-guess yourself.` },
        { weight: 1, value: `A meme, or a link, or just a line. Something dumb and specific enough to count. Sent.` },
        // Low dopamine — sending without feeling
        { weight: ctx.state.lerp01(dopa, 40, 15), value: `You send something. It goes out. You watch the delivered receipt appear and feel nothing particular about it. But it's sent.` },
      ]);
    },
    earnest: (name) => {
      const ser = ctx.state.get('serotonin');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You open ${name}'s thread. You write something — not everything, just enough. You send it.` },
        { weight: 1, value: `You type. Delete half of it. What you send is shorter but truer for it.` },
        { weight: 1, value: `You start writing and don't stop until it's done. You read it once and send it before you revise it into nothing.` },
        // Low serotonin — the words don't want to come
        { weight: ctx.state.lerp01(ser, 35, 15), value: `You open the thread and stare at it for a while. The things you want to say are too big. You write something small and true and send it before you change your mind.` },
      ]);
    },
  };

  /** @type {Record<string, (name: string) => string>} */
  const friendInitiateMessages = {
    sends_things: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `${name} responds immediately. She had something saved, ready. The thread is alive now.` },
      { weight: 1, value: `A reaction from ${name}, then a follow-up. She's been keeping things to send you.` },
      { weight: 1, value: `${name} sends something back — a picture, a voice note. The exchange has started.` },
    ]),
    checks_in: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `${name}: "Hey! So good to hear from you." You can feel the genuineness of it.` },
      { weight: 1, value: `A quick reply from ${name}. "I was just thinking about you." Probably true.` },
      { weight: 1, value: `${name} responds fast. "Hi! How are you?" Like she'd been waiting for an opening.` },
    ]),
    dry_humor: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `${name} sends something back immediately. Two words. The whole exchange is symmetrical.` },
      { weight: 1, value: `He responds. Something brief and dry. He understood.` },
      { weight: 1, value: `"lmao" from ${name}, and then something else. He was waiting for you to say something first.` },
    ]),
    earnest: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `A longer reply from ${name}. She's glad you reached out — she says so plainly, which is her way.` },
      { weight: 1, value: `${name} responds warmly. She asks a follow-up question. Gentle, not demanding.` },
      { weight: 1, value: `${name}: "I've been thinking about you." And then more. She had things to say.` },
    ]),
  };

  /** @type {Record<string, (name: string) => string[]>} */
  const friendIdleThoughts = {
    sends_things: (name) => [
      `You think about messaging ${name}. You don't pick up the phone.`,
      `You try to remember the last time you talked to ${name}. Actually talked, not just reacted to something sent.`,
      `${name} would send you something if she knew. But she doesn't know, because you haven't said anything.`,
      `There's probably something from ${name} you haven't opened yet.`,
    ],
    checks_in: (name) => [
      `${name} would want to know how you're doing. That's the problem.`,
      `You could text ${name} back. The thought comes and goes.`,
      `${name} asked how you were. You said fine. That was days ago. The word just sits there.`,
      `Somewhere ${name} is going about the day, not knowing you're here, doing this. Nothing.`,
    ],
    dry_humor: (name) => [
      `Your phone is right there. ${name} texted two days ago. You still haven't answered.`,
      `You think about ${name}'s last message. You almost type something back.`,
      `${name} would have something to say about this. Something dry. You almost smile, almost.`,
      `You draft a message to ${name} in your head. It stays there.`,
    ],
    earnest: (name) => [
      `${name} would listen, if you called. You know that. It doesn't help as much as it should.`,
      `You think about ${name}. About reaching out. The thought weighs more than it should.`,
      `${name} said to call anytime. Anytime is a big word. It includes now. You don't call.`,
      `You wonder what ${name} is doing. Not enough to find out.`,
    ],
  };

  /** @type {Record<string, (name: string) => string[]>} */
  const friendGuiltThoughts = {
    sends_things: (name) => [
      `${name} sent you something. Days ago. You still haven't opened it. The notification just sits there, getting heavier.`,
      `You think about how easy it would be to just reply to ${name}. One line. Anything. But the gap has its own weight now.`,
      `${name} keeps reaching out. You keep not answering. The asymmetry of it — she hasn't stopped, and you haven't started.`,
      `You could open what ${name} sent. You almost do. Then the thought of all the ones before it, unanswered, stops your hand.`,
    ],
    checks_in: (name) => [
      `${name} asked how you were. That was — how long ago? The silence since then is its own answer.`,
      `You think about ${name}. About the message you haven't replied to. The one before that. The gap is becoming a thing with edges.`,
      `${name} checks in because that's what ${name} does. You don't reply because that's what you do. The pattern is settling into something permanent.`,
      `The longer you don't answer ${name}, the harder the answering gets. You know this. It doesn't help.`,
    ],
    dry_humor: (name) => [
      `${name} texted. You read it, almost laughed, almost replied. Almost is doing a lot of work in that sentence.`,
      `You owe ${name} a reply. Several, actually. They're stacking up in a way that makes each one harder to send than the last.`,
      `${name} would make a joke about how long it's been. That's the problem — you can already hear it, and it's easier to avoid than to face.`,
      `The draft you keep composing to ${name} in your head never makes it to your hands. Something about putting it in writing makes the silence before it too visible.`,
    ],
    earnest: (name) => [
      `${name} said to reach out anytime. The word "anytime" has a shelf life, and you're testing it.`,
      `You think about ${name} waiting. Not dramatically — just the small background fact of someone who cared and got nothing back.`,
      `${name} would understand if you explained. But explaining means starting, and starting means acknowledging how long it's been.`,
      `The thing about ${name} is that the kindness makes it worse. It would be easier to ignore someone who didn't mean it.`,
    ],
  };

  // --- Coworker prose tables ---

  /** @type {Record<string, (name: string) => string | undefined>} */
  // Coworker sentiment lookup — called from chatter/interaction functions.
  // Requires the slot ('coworker1'/'coworker2') to be passed, but the chatter
  // tables are keyed by flavor and only receive name. So we read both slots and
  // match by name — imperfect but correct since names are unique per character.
  function coworkerSlotByName(name) {
    const c1 = ctx.character.get('coworker1');
    if (c1 && c1.name === name) return 'coworker1';
    return 'coworker2';
  }

  const coworkerChatter = {
    warm_quiet: (name) => {
      const ser = ctx.state.get('serotonin');
      const slot = coworkerSlotByName(name);
      const irr = ctx.state.sentimentIntensity(slot, 'irritation');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `"Long day, huh?" ${name}, not really expecting an answer. Never does.` },
        { weight: 1, value: `"You want coffee?" ${name}, already walking to the machine, asking over a shoulder.` },
        { weight: 1, value: `${name} glances over and half-smiles. Doesn't say anything. Doesn't need to.` },
        { weight: 1, value: `${name} sets a cup of water near you without a word. Small.` },
        // Higher serotonin — the small gesture lands
        { weight: ctx.state.lerp01(ser, 45, 65), value: `${name} looks over. Half-smile. Something about it — the lack of expectation, the ease — actually reaches you. A small warm thing that doesn't ask anything back.` },
        // Accumulated irritation — even quiet warmth grates
        { weight: irr * 1.5, value: `${name} glances over. The half-smile. The quiet gesture. It shouldn't bother you — it's kind, you know it's kind — but something about the ease of it lands wrong today.` },
      ]);
    },
    mundane_talker: (name) => {
      const ne = ctx.state.get('norepinephrine');
      const slot = coworkerSlotByName(name);
      const irr = ctx.state.sentimentIntensity(slot, 'irritation');
      const wrm = ctx.state.sentimentIntensity(slot, 'warmth');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `${name} mentions something about the weather. You say something back. The ritual of it.` },
        { weight: 1, value: `${name} is talking about a show from last night. You nod in the right places.` },
        { weight: 1, value: `${name} sighs loudly at the screen. Does this about once an hour.` },
        { weight: 1, value: `${name} says something about traffic this morning. You make a sound of agreement.` },
        // High NE — the chatter grates
        { weight: ctx.state.lerp01(ne, 55, 75), value: `${name} is talking. About what, you've lost track — the words arrive one at a time, each one landing on the last nerve you have. You nod. You can't stop nodding.` },
        // Accumulated irritation — the voice itself is the problem
        { weight: irr * 1.5, value: `${name} starts talking and you feel your jaw tighten before the first sentence lands. The voice. The cadence. You've heard it so many times that the sound itself carries weight.` },
        // Accumulated warmth — the ritual has ease
        { weight: wrm * 1.2, value: `${name} says something about nothing in particular. You say something back. There's a shorthand to it now — the rhythm of two people who've had this exchange enough times that it doesn't need to mean anything to matter.` },
      ]);
    },
    stressed_out: (name) => {
      const gaba = ctx.state.get('gaba');
      const slot = coworkerSlotByName(name);
      const irr = ctx.state.sentimentIntensity(slot, 'irritation');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `${name} mutters something under their breath. Screen-related, probably.` },
        { weight: 1, value: `${name} is on the phone again, voice tighter than it needs to be.` },
        { weight: 1, value: `"Can you believe this?" ${name}, to no one in particular. The screen is the problem today.` },
        { weight: 1, value: `${name} exhales through teeth. Something happened. Something always happens.` },
        // Low GABA — their stress is contagious
        { weight: ctx.state.lerp01(gaba, 40, 20), value: `${name} is tense — you can feel it from here. The tight voice, the sharp movements. Your own shoulders climb in response. Other people's stress is a frequency and you're tuned to it.` },
        // Accumulated irritation — their stress is a personal offense now
        { weight: irr * 1.5, value: `${name} is stressed again. Of course ${name} is stressed. ${name} is always stressed, and somehow it always becomes your problem — the sighing, the muttering, the tight little sounds that land in your space like they own it.` },
      ]);
    },
  };

  /** @type {Record<string, (name: string) => string | undefined>} */
  const coworkerInteraction = {
    warm_quiet: (name) => {
      const ser = ctx.state.get('serotonin');
      const slot = coworkerSlotByName(name);
      const wrm = ctx.state.sentimentIntensity(slot, 'warmth');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `"Hey." ${name} looks up. "Hey." That's it. That's the whole exchange. But it happened.` },
        { weight: 1, value: `${name}'s talking about a restaurant from the weekend. You ask which one. An almost-smile while describing it.` },
        { weight: 1, value: `You say something to ${name}. Something small. The response is warm and brief. Enough.` },
        // Higher serotonin — the exchange has warmth
        { weight: ctx.state.lerp01(ser, 45, 65), value: `You and ${name} exchange a few words. Nothing important. But the rhythm of it — the easy back and forth, the pauses that aren't awkward — is like a small door opening.` },
        // Accumulated warmth — there's history in the ease
        { weight: wrm * 1.5, value: `You and ${name} talk for a minute. The ease of it — knowing what they'll say, knowing they won't ask too much — has the texture of something built from a lot of small moments. Recognition, not performance.` },
      ]);
    },
    mundane_talker: (name) => {
      const aden = ctx.state.get('adenosine');
      const slot = coworkerSlotByName(name);
      const wrm = ctx.state.sentimentIntensity(slot, 'warmth');
      const irr = ctx.state.sentimentIntensity(slot, 'irritation');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You ask ${name} about the coffee. Same as yesterday. You nod. It's small. It's something.` },
        { weight: 1, value: `${name} tells you about a sale somewhere. You listen. It's easier than not listening.` },
        { weight: 1, value: `You mention the weather to ${name}. The conversation goes exactly where you'd expect. It's fine.` },
        // High adenosine (unblocked by caffeine) — you drift through the interaction
        { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: `${name} is saying something. You catch every third word — enough to nod, enough to make the right face. The rest dissolves. You're here but the fog is doing most of the work.` },
        // Accumulated irritation — everything they say costs you
        { weight: irr * 1.5, value: `You say something to ${name}. They respond at length. You knew they would. You always know they will. Every word takes something from you that you can't name.` },
        // Accumulated warmth — the mundane has become familiar
        { weight: wrm * 1.2, value: `${name} tells you something you've heard before. But there's something in the telling — the unselfconsciousness of it, the assumption that you're listening — that's become its own kind of comfort.` },
      ]);
    },
    stressed_out: (name) => {
      const ne = ctx.state.get('norepinephrine');
      const slot = coworkerSlotByName(name);
      const irr = ctx.state.sentimentIntensity(slot, 'irritation');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You ask ${name} how it's going. The answer involves a deadline. It always involves a deadline.` },
        { weight: 1, value: `${name} vents for thirty seconds about something that happened. You listen. That's what's needed.` },
        { weight: 1, value: `"Don't even ask," ${name} says, before you ask. So you don't.` },
        // High NE — the tension is catching
        { weight: ctx.state.lerp01(ne, 50, 70), value: `${name} starts talking and the tension in their voice does something to yours. By the time they finish, your jaw has been clenched the whole time. Their stress is a frequency and you're receiving it.` },
        // Accumulated irritation — you brace before they even speak
        { weight: irr * 1.5, value: `You approach ${name} and feel yourself brace. The venting will come — it always comes — and you'll absorb it because that's what you do. What you've always done. You're tired of doing it.` },
      ]);
    },
  };

  // --- Job-specific workplace descriptions ---

  /** @type {Record<string, () => string>} */
  const workplaceDescriptions = {
    office: () => {
      const mood = ctx.state.moodTone();
      const job = ctx.state.jobTier();
      const energy = ctx.state.energyTier();
      const stress = ctx.state.stressTier();
      const tasksDone = ctx.state.get('work_tasks_done');
      const tasksExpected = ctx.state.get('work_tasks_expected');
      const time = ctx.state.timePeriod();

      let desc = '';

      if (mood === 'numb' || mood === 'heavy') {
        desc = 'The office. Fluorescent lights that make everything the same temperature of visible.';
      } else if (mood === 'fraying') {
        desc = 'The office. The sound of keyboards and the smell of someone\'s microwave lunch.';
      } else {
        desc = 'The workplace. Your desk, your screen, the sounds of other people working.';
      }

      if (job === 'at_risk') {
        desc += ' You can feel people noticing when you arrive. When you leave. What you do in between.';
      } else if (job === 'shaky') {
        desc += ' Nobody has said anything directly. That might be worse.';
      }

      if (tasksDone < tasksExpected) {
        if (energy === 'depleted' || energy === 'exhausted') {
          desc += ' There are things to do. The screen is right there. Your eyes keep sliding off it.';
        } else if (stress === 'overwhelmed') {
          desc += ' The task list exists. Looking at it feels like swallowing something solid.';
        } else {
          desc += ' Things to do on the screen. The usual.';
        }
      } else {
        desc += ' You\'ve gotten through what was expected today. The time still needs to pass.';
      }

      if (time === 'afternoon') {
        desc += ' The afternoon stretches.';
      }

      // NT deterministic modifiers
      const ne = ctx.state.get('norepinephrine');
      const aden = ctx.state.get('adenosine');
      const gaba = ctx.state.get('gaba');
      if (ne > 65) {
        desc += ' Everything in here has an edge today. Keyboard clicks, AC hum, the chair.';
      } else if (aden > 65) {
        desc += ' The office blurs slightly. You know what\'s around you without it quite landing.';
      } else if (gaba < 35) {
        desc += ' You can\'t settle into the chair.';
      }

      return desc;
    },

    retail: () => {
      const mood = ctx.state.moodTone();
      const job = ctx.state.jobTier();
      const energy = ctx.state.energyTier();
      const stress = ctx.state.stressTier();
      const tasksDone = ctx.state.get('work_tasks_done');
      const tasksExpected = ctx.state.get('work_tasks_expected');
      const time = ctx.state.timePeriod();

      let desc = '';

      if (mood === 'numb' || mood === 'heavy') {
        desc = 'The store. Overhead music you stopped hearing weeks ago. Fluorescent everything.';
      } else if (mood === 'fraying') {
        desc = 'The store. The music is always the same playlist. Someone is always looking for something.';
      } else {
        desc = 'The store floor. Registers, shelves, the quiet hum of the place being open.';
      }

      if (job === 'at_risk') {
        desc += ' You feel the cameras more than usual. Or maybe that\'s just you.';
      } else if (job === 'shaky') {
        desc += ' The schedule has been shorter lately. Nobody explains why.';
      }

      if (tasksDone < tasksExpected) {
        if (energy === 'depleted' || energy === 'exhausted') {
          desc += ' There\'s stock to move. Your legs already know how long you\'ve been standing.';
        } else if (stress === 'overwhelmed') {
          desc += ' The returns pile. The reshelf cart. The customer at register two who\'s been waiting.';
        } else {
          desc += ' Things to restock. The usual.';
        }
      } else {
        desc += ' The tasks are done. The shift isn\'t. You find something to look busy with.';
      }

      if (time === 'afternoon') {
        desc += ' The afternoon lull. Fewer customers, more standing.';
      }

      // NT deterministic modifiers
      const ne = ctx.state.get('norepinephrine');
      const aden = ctx.state.get('adenosine');
      const gaba = ctx.state.get('gaba');
      if (ne > 65) {
        desc += ' Every loudspeaker announcement, every overhead ding, every aisle transaction. You can\'t filter any of it.';
      } else if (aden > 65) {
        desc += ' The store is running and you\'re somewhere inside it. Your body knows what to do.';
      } else if (gaba < 35) {
        desc += ' The floor is too open to stand in one place.';
      }

      return desc;
    },

    food_service: () => {
      const mood = ctx.state.moodTone();
      const job = ctx.state.jobTier();
      const energy = ctx.state.energyTier();
      const stress = ctx.state.stressTier();
      const tasksDone = ctx.state.get('work_tasks_done');
      const tasksExpected = ctx.state.get('work_tasks_expected');
      const time = ctx.state.timePeriod();

      let desc = '';

      if (mood === 'numb' || mood === 'heavy') {
        desc = 'The kitchen. Grease smell baked into everything. The floor mats are the only mercy.';
      } else if (mood === 'fraying') {
        desc = 'The line. Ticket printer going. Someone calls an order. Timer beeps. All of it at once.';
      } else {
        desc = 'Behind the counter. The kitchen hum, the fryer, the steady rhythm of orders.';
      }

      if (job === 'at_risk') {
        desc += ' The manager has been watching more. Counting things. Making notes.';
      } else if (job === 'shaky') {
        desc += ' Your hours got cut last week. Nobody said why. You didn\'t ask.';
      }

      if (tasksDone < tasksExpected) {
        if (energy === 'depleted' || energy === 'exhausted') {
          desc += ' Tickets keep coming. Your hands know the work but the rest of you is somewhere else.';
        } else if (stress === 'overwhelmed') {
          desc += ' Three tickets deep and the printer isn\'t stopping. The lunch rush doesn\'t care how you feel.';
        } else {
          desc += ' Orders on the rail. The usual flow.';
        }
      } else {
        desc += ' The rush is over. Cleaning. Prep for next round. The quieter kind of work.';
      }

      if (time === 'morning' || time === 'early_morning') {
        desc += ' Morning prep. The opening routine your body does without you.';
      }

      // NT deterministic modifiers
      const ne = ctx.state.get('norepinephrine');
      const aden = ctx.state.get('adenosine');
      const gaba = ctx.state.get('gaba');
      if (ne > 65) {
        desc += ' The kitchen sounds are already too much — oil snap, timer beep, metal on metal.';
      } else if (aden > 65) {
        desc += ' The rhythm keeps going without you fully inside it. Your hands follow.';
      } else if (gaba < 35) {
        desc += ' The pace feels relentless even when it isn\'t.';
      }

      return desc;
    },
  };

  // --- Job-specific do_work prose ---

  /** @type {Record<string, (canFocus: boolean, energy: string, stress: string) => string>} */
  const doWorkProse = {
    office: (canFocus, energy, stress) => {
      const dread = ctx.state.sentimentIntensity('work', 'dread');
      const sat = ctx.state.sentimentIntensity('work', 'satisfaction');
      if (!canFocus && energy === 'depleted') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You stare at the screen. Words move but they don\'t mean anything. Time passes anyway. You\'re not sure what you accomplished.' },
          { weight: dread * 2, value: 'The task list. The same task list. You open it like opening a wound. The screen swims. Nothing sticks. Nothing has stuck for a while.' },
        ]);
      }
      if (!canFocus) {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You try to focus. It\'s like pushing through water. Things get done, maybe, but you couldn\'t say what exactly.' },
          { weight: dread * 2, value: 'You try. The screen is right there. The work is right there. But there\'s something between you and it now — a heaviness that wasn\'t always this heavy.' },
        ]);
      }
      if (stress === 'overwhelmed') {
        return 'You work through it. Each task is a small wall you have to climb. You climb them because that\'s what\'s there.';
      }
      if (energy === 'tired') {
        return 'You work. Slowly, but it happens. One thing, then the next. The clock moves.';
      }
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'You settle into it. The work is the work — it\'s not interesting, but your hands know what to do. Something gets finished.' },
        { weight: sat * 2, value: 'You settle into it and the work cooperates. There\'s a rhythm here — not exciting, but competent. Something gets done, and you know it got done right.' },
      ]);
    },

    retail: (canFocus, energy, stress) => {
      const dread = ctx.state.sentimentIntensity('work', 'dread');
      const sat = ctx.state.sentimentIntensity('work', 'satisfaction');
      if (!canFocus && energy === 'depleted') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You stand at the register. Scan, bag, repeat. Your body does it. Your mind is somewhere behind glass.' },
          { weight: dread * 2, value: 'Scan. Bag. The beep of the register is a sound you hear in your sleep now. Your body does the job. The rest of you left a while ago.' },
        ]);
      }
      if (!canFocus) {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Restock, face the shelves, help someone find something. The motions happen. Whether you\'re in them is another question.' },
          { weight: dread * 2, value: 'Shelves need facing. Customers need helping. You do it because the alternative is standing still, and standing still here is worse.' },
        ]);
      }
      if (stress === 'overwhelmed') {
        return '"Excuse me, do you work here?" You do. You help them. Another one. Another one after that.';
      }
      if (energy === 'tired') {
        return 'Shelves. Register. Customer. Shelves again. Your feet have their own opinion about all of this.';
      }
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'You work the floor. Straighten things, ring people up, answer the same three questions. It fills the time.' },
        { weight: sat * 2, value: 'You work the floor. Someone can\'t find what they need and you know exactly where it is. Small competence. It\'s something.' },
      ]);
    },

    food_service: (canFocus, energy, stress) => {
      const dread = ctx.state.sentimentIntensity('work', 'dread');
      const sat = ctx.state.sentimentIntensity('work', 'satisfaction');
      if (!canFocus && energy === 'depleted') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'The ticket says what to do. Your hands do it. There\'s a gap between you and the work that\'s getting wider.' },
          { weight: dread * 2, value: 'Ticket after ticket. The kitchen is too hot and too loud and the gap between you and the work is a chasm now. Your hands keep going. They don\'t need you for this.' },
        ]);
      }
      if (!canFocus) {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Orders come in. You make them. The fryer beeps and you pull the basket. It\'s not focus, it\'s muscle memory.' },
          { weight: dread * 2, value: 'More orders. The fryer beeps. You pull the basket. Every shift is the same shift and your body knows it before you walk in the door.' },
        ]);
      }
      if (stress === 'overwhelmed') {
        return 'Three tickets at once. The timer. Someone needs more fries. You work through it because stopping isn\'t one of the options.';
      }
      if (energy === 'tired') {
        return 'You work the line. Plate, garnish, slide. Your back has a suggestion about when to stop. You ignore it.';
      }
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'The rhythm of it. Ticket comes, you make it, it goes out. When it\'s flowing like this, the time actually moves.' },
        { weight: sat * 2, value: 'The rhythm catches and holds. Ticket, prep, plate — your hands know the sequence and the sequence knows your hands. When it flows like this, you almost don\'t mind being here.' },
      ]);
    },
  };

  // --- Job-specific work_break prose ---

  /** @type {Record<string, (mood: string) => string>} */
  const workBreakProse = {
    office: (mood) => {
      if (mood === 'numb' || mood === 'hollow') {
        return 'You stand in the hallway near the water fountain. Not getting water. Just standing somewhere that isn\'t your desk.';
      }
      if (mood === 'fraying') {
        return 'You go to the bathroom and stand there. Breathe. The tiles are cool. Nobody needs anything from you for sixty seconds.';
      }
      return 'Break room. Stale coffee smell. You stand by the window and look at nothing in particular. It helps more than it should.';
    },

    retail: (mood) => {
      if (mood === 'numb' || mood === 'hollow') {
        return 'The stockroom. You lean against a shelf of product and close your eyes for a minute. Nobody comes looking.';
      }
      if (mood === 'fraying') {
        return 'You go to the back. Stand by the loading dock door. The air is different back here. Colder. Better.';
      }
      return 'You step into the break room. Plastic chair, vending machine hum. You sit. Your feet thank you silently.';
    },

    food_service: (mood) => {
      if (mood === 'numb' || mood === 'hollow') {
        return 'You step outside the back door. Concrete, dumpster, sky. It\'s not pretty but it\'s not the kitchen.';
      }
      if (mood === 'fraying') {
        return 'You lean against the walk-in cooler door. The cold on your back. Thirty seconds of something like relief.';
      }
      return 'You drink water from the plastic cup you\'ve been refilling all shift. Lean against the wall. Breathe air that isn\'t fryer grease.';
    },
  };

  // --- Job-specific work_task_appears event ---

  /** @type {Record<string, () => string | undefined>} */
  const workTaskEvent = {
    office: () => {
      ctx.state.adjustStress(3);
      return 'An email. Another thing that needs doing. It goes on the list, which is the same as all the other lists.';
    },
    retail: () => {
      ctx.state.adjustStress(3);
      const ne = ctx.state.get('norepinephrine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'The walkie crackles. Someone needs help in aisle six.' },
        { weight: 1, value: 'A customer is waiting at the counter. Has been for a while, apparently.' },
        { weight: 1, value: 'A delivery showed up. Boxes in the back that need to be somewhere else.' },
        // High NE — the demand cuts sharper
        { weight: ctx.state.lerp01(ne, 55, 75), value: 'The walkie crackles and the sound goes through you. Another voice, another task, another thing that needs you now. Your jaw tightens before you can stop it.' },
      ]);
    },
    food_service: () => {
      ctx.state.adjustStress(3);
      const ne = ctx.state.get('norepinephrine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'The ticket printer rattles. Another order. The paper curls off the end.' },
        { weight: 1, value: 'Someone calls out an order correction. You adjust. Again.' },
        { weight: 1, value: 'The timer beeps. Something needs to come out of the fryer now.' },
        // High NE — sounds compound
        { weight: ctx.state.lerp01(ne, 55, 75), value: 'The ticket printer, the timer, someone shouting behind you — all at once, all urgent, all aimed at you. The kitchen is a machine and you\'re a part that\'s running hot.' },
      ]);
    },
  };

  // --- Job-specific break_room_noise / ambient ---

  /** @type {Record<string, () => string | undefined>} */
  const workAmbientEvent = {
    office: () => {
      return 'Laughter from the break room. You\'re not sure about what. It drifts and fades.';
    },
    retail: () => {
      const aden = ctx.state.get('adenosine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'The overhead music changes to a song you know. You wish it hadn\'t.' },
        { weight: 1, value: 'The automatic doors open and close. Open and close.' },
        { weight: 1, value: 'A child is crying somewhere in the store. The sound carries.' },
        // High adenosine (unblocked) — everything blurs together
        { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: 'The store sounds blur into a single hum — registers, music, voices, the hiss of the HVAC. You\'re standing in it. It\'s hard to pick anything apart.' },
      ]);
    },
    food_service: () => {
      const aden = ctx.state.get('adenosine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'The exhaust fan changes pitch for a second, then settles.' },
        { weight: 1, value: 'Someone drops a pan in the back. The clatter hangs in the air.' },
        { weight: 1, value: 'The drive-through speaker crackles with a voice you can\'t quite make out.' },
        // High adenosine (unblocked) — the kitchen noise is a wall
        { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: 'The kitchen noise is a wall of sound and you\'re behind it. Hood fans, fryer, someone talking — it\'s all one texture. You move through it without separating the parts.' },
      ]);
    },
  };

  // --- Location descriptions ---
  // Each returns prose based on current state. No labels, no meters.

  const locationDescriptions = {
    apartment_bedroom: () => {
      const energy = ctx.state.energyTier();
      const time = ctx.state.timePeriod();
      const mess = ctx.mess.tier();
      const mood = ctx.state.moodTone();

      // NT values for continuous shading (no RNG consumed)
      const ser = ctx.state.get('serotonin');
      const ne = ctx.state.get('norepinephrine');
      const gaba = ctx.state.get('gaba');
      const aden = ctx.state.get('adenosine');

      let desc = '';

      // Time-based opening — NT values shade within mood branches
      if (time === 'early_morning' || time === 'morning') {
        if (energy === 'depleted' || energy === 'exhausted') {
          if (ser < 30) {
            desc = 'The room is too bright. The light is an accusation. Everything about getting up feels impossible in a way you can\'t argue with.';
          } else {
            desc = 'The room is too bright. Everything about getting up feels like a negotiation with your own body.';
          }
        } else if (energy === 'tired') {
          desc = 'Morning light pushes through the blinds. You\'re awake, technically.';
        } else {
          if (ser > 55 && gaba > 50) {
            desc = 'Morning. The blinds let in pale light. The day is there, and for once it\'s not demanding anything yet.';
          } else {
            desc = 'Morning. The blinds let in pale light. The day is there, waiting.';
          }
        }
      } else if (time === 'deep_night' || time === 'night') {
        if (mood === 'numb' || mood === 'hollow') {
          if (ser < 30) {
            desc = 'The ceiling. It doesn\'t change. You\'ve been watching it not change for a while now. It\'s the most honest thing in the room.';
          } else {
            desc = 'The ceiling is there. It\'s been there. You\'ve been looking at it.';
          }
        } else if (energy === 'depleted') {
          desc = 'The bed has you. Not in a restful way — more like gravity won.';
        } else {
          if (ne > 55) {
            desc = 'Your room in the dark. Every small sound is louder than it should be. You know what\'s there. Your body keeps checking anyway.';
          } else {
            desc = 'Your room in the dark. The shapes of things you know are there.';
          }
        }
      } else if (time === 'evening') {
        if (mood === 'heavy' || mood === 'numb') {
          if (ser < 35) {
            desc = 'The room feels smaller in the evening. The walls are close. The light is leaving and you\'re not sure you want it to.';
          } else {
            desc = 'The room feels smaller in the evening. The walls are close.';
          }
        } else {
          if (ne > 50 && gaba < 40) {
            desc = 'Evening light makes the room almost warm. Almost. There\'s a tension you can\'t place — the day winding down but something in you not winding down with it.';
          } else {
            desc = 'Evening light makes the room almost warm. Almost.';
          }
        }
      } else {
        // Daytime
        if (mood === 'clear') {
          desc = 'Your bedroom. Familiar, small, yours.';
        } else if (mood === 'hollow' || mood === 'quiet') {
          if (ser < 35) {
            desc = 'Your room. The quiet is the loudest thing in it. The walls know something about you that you don\'t say out loud.';
          } else {
            desc = 'Your room. The quiet is the loudest thing in it.';
          }
        } else {
          desc = 'Your bedroom. The bed, the dresser, the window.';
        }
      }

      // Migraine — overrides mood tone with physical reality (deterministic, no RNG)
      const migraineTier = ctx.state.migraineTier();
      if (migraineTier === 'severe') {
        desc = 'The room is too bright. Everything is. Light from the window is a problem. Sound from outside is a problem. The headache has its own gravity.';
      } else if (migraineTier === 'active') {
        desc += ' The headache is here. A specific, one-sided pressure that makes you aware of the exact dimensions of your skull.';
      } else if (migraineTier === 'building') {
        desc += ' Something is starting behind your left eye. Or your right. The kind of pressure that you know, by now, what it means.';
      }

      // Illness — physical reality layered over mood (deterministic, no RNG)
      const illTier = ctx.state.illnessTier();
      if (illTier === 'very_sick') {
        desc = 'The bed is the whole world right now. Moving anywhere feels like a decision that requires more from you than you have.';
      } else if (illTier === 'sick') {
        desc += ' Your body has an opinion about everything you\'re considering doing. The opinion is no.';
      } else if (illTier === 'unwell') {
        desc += ' Something\'s off. Not enough to stop you, just enough to be there.';
      }

      // Dental — background ache present on wake or when flaring (deterministic, no RNG)
      const dentalT = ctx.state.dentalTier();
      if (dentalT === 'flare') {
        desc += ' The tooth is going. It does this sometimes — starts up and just keeps going.';
      } else if (dentalT === 'ache') {
        desc += ' The tooth is there. Not bad, exactly. Just there.';
      }

      // Floor clothes — from Clothing module
      const floorClothes = ctx.clothing.floorDescription('bedroom');
      if (floorClothes) {
        desc += ' ' + floorClothes;
      }

      // General mess tier — computed from Dishes + Linens + Clothing
      if (!floorClothes && mess === 'tidy') {
        desc += ' It\'s relatively in order in here. The surfaces have their surfaces back.';
      } else if (mess === 'chaotic') {
        desc += ' Things that migrated from where they lived and didn\'t go back. The room has a layer to it now.';
      }

      // Bed state — from Linens
      const bed = ctx.linens.bedState();
      if (bed === 'messy') {
        desc += ' The bed is a wreck — sheets pulled loose, pillow somewhere it shouldn\'t be.';
      } else if (bed === 'made') {
        desc += ' The bed is made.';
      }
      // 'unmade' is the default, already implied — no additional sentence

      // Alarm detail — perceived, not exact (location description, not a direct check)
      if (ctx.state.get('alarm_set') && !ctx.state.get('alarm_went_off')
          && (time === 'early_morning' || time === 'deep_night' || time === 'morning')) {
        const tf = ctx.state.timeFidelity();
        if (tf === 'exact' || tf === 'rounded') {
          desc += ' The alarm clock on the nightstand shows ' + ctx.state.perceivedTimeString() + '.';
        } else if (tf === 'vague') {
          desc += ' The alarm clock is set. The number on it hasn\'t registered yet.';
        }
        // sensory: the character isn't reading details — omit
      }

      if (!ctx.state.get('dressed') && time !== 'deep_night' && time !== 'night') {
        desc += ' You\'re still in ' + ctx.character.get('sleepwear') + '.';
      }

      // Deterministic NT modifiers — no RNG consumed, appended as undertones
      if (aden > 65 && ctx.state.adenosineBlock() > 0.4) {
        desc += ' The edges of things are soft. Not blurry — just not quite sharp.';
      }
      if (ne > 60 && gaba < 35) {
        desc += ' Something restless underneath the stillness. You can\'t sit with it and you can\'t name it.';
      }

      return desc;
    },

    apartment_kitchen: () => {
      const hunger = ctx.state.hungerTier();
      const fridge = ctx.state.fridgeTier();
      const mess = ctx.mess.tier();
      const mood = ctx.state.moodTone();
      const time = ctx.state.timePeriod();

      let desc = '';

      if (mood === 'numb' || mood === 'heavy') {
        desc = 'The kitchen. Fluorescent light. Linoleum.';
      } else if (mood === 'clear') {
        desc = 'The kitchen. Small but functional.';
      } else {
        desc = 'The kitchen.';
      }

      // Fridge + pantry
      const pantry = ctx.state.pantryTier();
      if (fridge === 'empty') {
        if (hunger === 'starving' || hunger === 'very_hungry') {
          desc += pantry !== 'empty'
            ? ' The fridge is empty. There\'s still something in the cupboard.'
            : ' The fridge is empty. You checked already, but you check again.';
        } else {
          desc += pantry !== 'empty'
            ? ' The fridge has nothing in it. There\'s something in the cupboard.'
            : ' The fridge has nothing in it worth mentioning.';
        }
      } else if (fridge === 'sparse') {
        desc += ' There\'s something in the fridge. Not much.';
      } else if (fridge === 'stocked') {
        desc += ' A few things in the fridge. Enough for now.';
      } else {
        desc += ' The fridge is reasonably stocked.';
      }

      // Hunger
      if (hunger === 'starving') {
        desc += ' Your stomach has moved past complaining into something quieter and worse.';
      } else if (hunger === 'very_hungry') {
        desc += ' Standing in here makes the hunger sharper.';
      }

      // Dishes — sink state from object system
      desc += ' ' + ctx.dishes.sinkDescription();

      // Counter clutter — mess tier from object systems (general disorder beyond dishes)
      if (mess === 'chaotic' || mess === 'messy') {
        desc += ' The counter has its own layer — things set down and left, the kind that stops registering once it\'s been there long enough.';
      }

      // Microwave clock — perceived, not exact (location description, not a direct check)
      {
        const tf = ctx.state.timeFidelity();
        if (tf === 'exact' || tf === 'rounded') {
          desc += ' The microwave clock reads ' + ctx.state.perceivedTimeString() + '.';
        } else if (tf === 'vague') {
          const v = ctx.state.vagueTimeString();
          desc += ' The microwave clock. ' + v.charAt(0).toUpperCase() + v.slice(1) + '.';
        } else {
          // sensory — character is barely registering the clock face
          desc += ' The microwave clock is there. You\'re not reading it.';
        }
      }

      // NT deterministic modifiers (no RNG — location descriptions called from UI.render)
      const aden = ctx.state.get('adenosine');
      const ne = ctx.state.get('norepinephrine');
      if (aden > 65 && ctx.state.adenosineBlock() > 0.4) {
        desc += ' The light in here is doing more than its share.';
      } else if (ne > 65 && (time === 'morning' || time === 'early_morning')) {
        desc += ' Everything in here feels very present this early.';
      }

      // Illness modifier (deterministic, no RNG)
      const illTierK = ctx.state.illnessTier();
      if (illTierK === 'very_sick') {
        desc += ' Getting here took something out of you.';
      } else if (illTierK === 'sick') {
        desc += ' Your body keeps reminding you it would prefer to be horizontal.';
      } else if (illTierK === 'unwell') {
        desc += ' Something about the light in here isn\'t helping.';
      }

      // Time of day flavor
      if (time === 'morning' || time === 'early_morning') {
        desc += ' The window shows grey morning outside.';
      }

      // The door out
      desc += ' The front door is through here.';

      return desc;
    },

    apartment_bathroom: () => {
      const energy = ctx.state.energyTier();
      const mood = ctx.state.moodTone();
      const showered = ctx.state.get('showered');
      const mess = ctx.mess.tier();

      let desc = 'The bathroom. Mirror, sink, shower.';

      if (mood === 'numb' || mood === 'hollow') {
        desc = 'The bathroom. The mirror is there. You don\'t have to look.';
      } else if (mood === 'fraying') {
        desc = 'Tile walls. The faucet drips on its own schedule.';
      }

      if (!showered) {
        if (energy === 'depleted' || energy === 'exhausted') {
          desc += ' A shower would take something you\'re not sure you have.';
        } else if (energy === 'tired') {
          desc += ' A shower might help. Or it might just be one more thing.';
        } else {
          desc += ' The shower is right there.';
        }
      }

      // Towel — from Linens
      const towel = ctx.linens.towelState();
      if (towel === 'on_floor') {
        desc += ' The towel\'s on the floor. Been there a while.';
      } else if (towel === 'damp_hanging') {
        desc += ' The towel from earlier still hanging damp.';
      }

      // Clothes on bathroom floor — from Clothing
      const bathClothes = ctx.clothing.floorDescription('bathroom');
      if (bathClothes) {
        desc += ' ' + bathClothes;
      }

      // NT deterministic modifiers
      const aden = ctx.state.get('adenosine');
      const ne = ctx.state.get('norepinephrine');
      if (aden > 70 && ctx.state.adenosineBlock() > 0.4) {
        desc += ' The light in here is harsh.';
      } else if (ne > 65) {
        desc += ' The faucet drip sounds too loud.';
      }

      return desc;
    },

    street: () => {
      const weather = ctx.state.get('weather');
      const time = ctx.state.timePeriod();
      const energy = ctx.state.energyTier();
      const mood = ctx.state.moodTone();
      const temp = ctx.state.temperatureTier();

      let desc = '';

      // Weather + time
      if (weather === 'drizzle') {
        if (mood === 'heavy' || mood === 'numb') {
          desc = 'Rain. Not hard enough to be dramatic. Just enough to be one more thing.';
        } else {
          desc = 'A light drizzle. The sidewalk darkens in patches.';
        }
      } else if (weather === 'snow') {
        if (mood === 'heavy' || mood === 'numb') {
          desc = 'Snow. White on everything, muffled. The kind that makes the world feel smaller and quieter than you need it to be.';
        } else {
          desc = 'Snow coming down. The street is quiet in that way it only gets when it snows.';
        }
      } else if (weather === 'overcast') {
        desc = 'The sky is flat and grey. The kind of sky that doesn\'t commit.';
      } else if (weather === 'clear') {
        if (mood === 'clear' || mood === 'present') {
          desc = 'Clear sky. The light is honest today.';
        } else {
          desc = 'The sky is clear. It doesn\'t help as much as it should.';
        }
      } else {
        desc = 'Grey. Everything out here is some shade of grey today.';
      }

      // Temperature
      if (temp === 'bitter')   desc += ' Bitter cold. Each breath is a small shock.';
      else if (temp === 'freezing') desc += ' The cold cuts through whatever you\'re wearing.';
      else if (temp === 'cold')     desc += ' Cold out. You feel it.';
      else if (temp === 'hot')      desc += ' Warm out. The air has weight.';

      // Time — weekday and weekend have different rhythms
      const isWeekend = !ctx.state.isWorkday();
      const dow = ctx.state.calendarDate().weekday; // 0=Sun, 6=Sat
      if (time === 'early_morning' || time === 'morning') {
        if (isWeekend && dow === 0) {
          desc += ' Sunday morning. Almost nobody out. The street has the particular quiet of a day that hasn\'t started yet.';
        } else if (isWeekend) {
          desc += ' Saturday morning. A few people — unhurried. Nobody is going to work.';
        } else {
          desc += ' A few people heading somewhere. Everyone is heading somewhere.';
        }
      } else if (time === 'late_morning' || time === 'midday') {
        if (isWeekend) {
          desc += ' More people out than usual. Weekend errands, or just being outside. A different kind of crowd.';
        }
      } else if (time === 'afternoon') {
        if (isWeekend && dow === 0) {
          desc += ' Sunday afternoon quiet. Less traffic than Saturday. The week sitting at the edge of the day.';
        } else if (isWeekend) {
          desc += ' Saturday afternoon. People with places to be that aren\'t work.';
        }
      } else if (time === 'deep_night') {
        desc += ' Empty street. Streetlights. The occasional car.';
      } else if (time === 'evening') {
        if (isWeekend) {
          desc += ' The light is going. Different people than the weekday evening crowd — no one coming from the same kind of day.';
        } else {
          desc += ' The light is going. People walk faster in the evening.';
        }
      }

      // Energy
      if (energy === 'depleted' || energy === 'exhausted') {
        desc += ' The sidewalk feels longer than it is.';
      }

      desc += ' Your apartment building is behind you. The bus stop is down the block. There\'s a corner store across the way.';

      // NT deterministic modifiers
      const ne = ctx.state.get('norepinephrine');
      const aden = ctx.state.get('adenosine');
      const gaba = ctx.state.get('gaba');
      if (ne > 70) {
        desc += ' Every car, every voice arrives separately. Too much input for a street.';
      } else if (aden > 65 && ctx.state.adenosineBlock() > 0.4) {
        desc += ' The street softens at the edges. You\'re moving through it but not quite in it.';
      } else if (gaba < 35) {
        desc += ' The openness doesn\'t help as much as it should.';
      }

      return desc;
    },

    bus_stop: () => {
      const time = ctx.state.timePeriod();
      const weather = ctx.state.get('weather');
      const energy = ctx.state.energyTier();
      const mood = ctx.state.moodTone();

      const isWeekend = !ctx.state.isWorkday();
      const dow = ctx.state.calendarDate().weekday; // 0=Sun, 6=Sat
      let desc = isWeekend
        ? 'The bus stop. The weekend schedule runs less often. The sign still says what it says.'
        : 'The bus stop. A bench, a sign, a schedule nobody trusts.';

      if (time === 'morning' || time === 'late_morning') {
        if (isWeekend && dow === 0) {
          desc += ' Almost empty. One other person, looking at their phone.';
        } else if (isWeekend) {
          desc += ' A few people waiting — not commuters. No particular urgency.';
        } else {
          desc += ' Other people waiting. Nobody makes eye contact.';
        }
      } else if (time === 'deep_night') {
        desc = 'The bus stop at night. The schedule says buses run until midnight. It\'s vague about what "run" means.';
      } else if (time === 'evening') {
        if (isWeekend) {
          desc += ' A different mix than the weekday evening. People coming from wherever people go on weekends.';
        } else {
          desc += ' Fewer people now. The ones here look like they\'re coming from the same kind of day.';
        }
      }

      if (weather === 'drizzle') {
        desc += ' The shelter doesn\'t quite cover the bench.';
      } else if (weather === 'snow') {
        desc += ' Snow on the bench. You brush a corner clear.';
      }

      const temp = ctx.state.temperatureTier();
      if (temp === 'bitter')   desc += ' Your feet are already numb.';
      else if (temp === 'freezing') desc += ' The cold makes standing here miserable.';
      else if (temp === 'cold')     desc += ' Cold. You pull your jacket tighter.';
      else if (temp === 'hot')      desc += ' No shade worth speaking of.';

      if (energy === 'depleted') {
        desc += ' The bench is the best thing here.';
      }

      if (mood === 'hollow' || mood === 'quiet') {
        desc += ' Waiting. That\'s what this place is for.';
      }

      // NT deterministic modifiers
      const ne = ctx.state.get('norepinephrine');
      const aden = ctx.state.get('adenosine');
      const gaba = ctx.state.get('gaba');
      if (ne > 65) {
        desc += ' The other people waiting register louder than they should.';
      } else if (aden > 65 && ctx.state.adenosineBlock() > 0.4) {
        desc += ' The wait stretches in that thick, slow way. Time doing what it does when you\'re tired.';
      } else if (gaba < 35) {
        desc += ' Standing still is hard.';
      }

      return desc;
    },

    workplace: () => {
      const jobType = ctx.character.get('job_type');
      const descFn = /** @type {() => string} */ (workplaceDescriptions[jobType] || workplaceDescriptions.office);
      return descFn();
    },

    corner_store: () => {
      const money = ctx.state.moneyTier();
      const hunger = ctx.state.hungerTier();
      const mood = ctx.state.moodTone();

      let desc = 'The corner store. Bright inside, that chemical-clean smell.';

      if (money === 'broke') {
        desc += ' You look at things. Looking is free.';
      } else if (money === 'scraping' || money === 'tight') {
        if (hunger === 'starving' || hunger === 'very_hungry') {
          desc += ' Everything has a price tag. You do the math without wanting to.';
        } else {
          desc += ' Shelves of things. You know what things cost here.';
        }
      } else {
        desc += ' Shelves of the usual. Bread, canned stuff, drinks.';
      }

      if (mood === 'hollow') {
        desc += ' The cashier doesn\'t look up.';
      } else {
        desc += ' The person at the register is watching something on their phone.';
      }

      // NT deterministic modifiers
      const ne = ctx.state.get('norepinephrine');
      const aden = ctx.state.get('adenosine');
      if (ne > 65) {
        desc += ' The fluorescent hum, the fridge doors rattling — too much input for a corner store.';
      } else if (aden > 65 && ctx.state.adenosineBlock() > 0.4) {
        desc += ' The aisles smear a little. You know what you need.';
      }

      return desc;
    },

    soup_kitchen: () => {
      const mood = ctx.state.moodTone();
      const hunger = ctx.state.hungerTier();
      const visits = ctx.state.get('soup_kitchen_visits');
      const hour = ctx.state.getHour();

      let desc;
      if (visits === 0) {
        // First time here — the specifics land harder
        if (mood === 'hollow' || mood === 'numb') {
          desc = 'Long tables. Folding chairs. Someone at the door hands you a tray. You take it.';
        } else {
          desc = 'Long tables, folding chairs, the smell of large-quantity cooking. More people than you expected.';
        }
      } else {
        // Familiar now
        if (mood === 'hollow' || mood === 'numb') {
          desc = 'The community meal. You know where to go.';
        } else {
          desc = 'The hall. Long tables, the same institutional smell. Familiar enough now to be just a place.';
        }
      }

      if (hour >= 12 && hour < 13) {
        desc += ' It\'s busy — the lunch rush, if you can call it that.';
      }

      if (hunger === 'starving') {
        desc += ' Your body knows you\'re here. It\'s ahead of you already.';
      }

      // NT modifiers
      const ne = ctx.state.get('norepinephrine');
      const gaba = ctx.state.get('gaba');
      if (ne > 65) {
        desc += ' The noise of the room — chairs, voices, trays — comes in sharp.';
      } else if (gaba < 40) {
        desc += ' There are a lot of people in here. You find a seat toward the edge.';
      }

      return desc;
    },

    food_bank: () => {
      const mood = ctx.state.moodTone();
      const visits = ctx.state.get('food_bank_visits');

      let desc;
      if (visits === 0) {
        if (mood === 'hollow' || mood === 'numb') {
          desc = 'A waiting area. Chairs along the wall. A folding table with a sign-in sheet.';
        } else {
          desc = 'A waiting area with chairs along the wall. Other people. A folding table, a sign-in sheet, a volunteer who smiles at everyone equally.';
        }
      } else {
        if (mood === 'hollow' || mood === 'numb') {
          desc = 'The food bank. You know the routine.';
        } else {
          desc = 'The waiting area. Familiar now — the chairs, the table, the way the light comes in.';
        }
      }

      // NT modifiers
      const gaba = ctx.state.get('gaba');
      const ne = ctx.state.get('norepinephrine');
      if (gaba < 40) {
        desc += ' Something about waiting rooms.';
      } else if (ne > 65) {
        desc += ' The sounds of the room are sharper than they need to be.';
      }

      return desc;
    },
  };

  // --- Helpers ---

  /** Returns the friend slot + character to reply to, or null if nothing to reply to.
   *  When phone_thread_contact is set (live play with thread open), uses that slot.
   *  Falls back to guilt-based selection for replay compat when thread contact isn't set. */
  function getReplyTarget() {
    const inbox = ctx.state.get('phone_inbox');
    const pending = ctx.state.get('pending_replies') || [];
    const threadContact = ctx.state.get('phone_thread_contact');

    // Live play — use the active thread
    if (threadContact && ['friend1', 'friend2'].includes(threadContact)) {
      if (pending.some(r => r.slot === threadContact)) return null;
      return { slot: threadContact, friend: ctx.character.get(threadContact) };
    }

    // Fallback — old guilt-based logic for replay compat
    const candidates = ['friend1', 'friend2'].filter(
      slot => inbox.some(m => m.source === slot) && !pending.some(r => r.slot === slot)
    );
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return { slot: candidates[0], friend: ctx.character.get(candidates[0]) };
    const g0 = ctx.state.sentimentIntensity(candidates[0], 'guilt');
    const g1 = ctx.state.sentimentIntensity(candidates[1], 'guilt');
    let slot;
    if (g0 > g1 + 0.05) slot = candidates[0];
    else if (g1 > g0 + 0.05) slot = candidates[1];
    else {
      slot = candidates[0];
      for (const m of inbox) {
        if (m.source && candidates.includes(m.source)) slot = m.source;
      }
    }
    return { slot, friend: ctx.character.get(slot) };
  }

  /** Returns the friend slot + character to initiate contact with, or null if no valid target.
   *  When phone_thread_contact is set (live play with thread open), uses that slot.
   *  Falls back to guilt-based selection for replay compat when thread contact isn't set. */
  function getInitiateTarget() {
    const pending = ctx.state.get('pending_replies') || [];
    const inbox = ctx.state.get('phone_inbox');
    const threadContact = ctx.state.get('phone_thread_contact');

    // Live play — use the active thread
    if (threadContact && ['friend1', 'friend2'].includes(threadContact)) {
      if (pending.some(r => r.slot === threadContact)) return null;
      if (inbox.some(m => m.source === threadContact && !m.read)) return null; // has unread → use reply
      return { slot: threadContact, friend: ctx.character.get(threadContact) };
    }

    // Fallback — old logic for replay compat
    const candidates = ['friend1', 'friend2'].filter(slot => {
      if (pending.some(r => r.slot === slot)) return false;
      if (inbox.some(m => m.source === slot && !m.read)) return false;
      return true;
    });
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return { slot: candidates[0], friend: ctx.character.get(candidates[0]) };
    const g0 = ctx.state.sentimentIntensity(candidates[0], 'guilt');
    const g1 = ctx.state.sentimentIntensity(candidates[1], 'guilt');
    if (g0 > g1 + 0.05) return { slot: candidates[0], friend: ctx.character.get(candidates[0]) };
    if (g1 > g0 + 0.05) return { slot: candidates[1], friend: ctx.character.get(candidates[1]) };
    const fc = ctx.state.get('friend_contact');
    const t0 = fc[candidates[0]] || 0;
    const t1 = fc[candidates[1]] || 0;
    const slot = t0 <= t1 ? candidates[0] : candidates[1];
    return { slot, friend: ctx.character.get(slot) };
  }

  // --- Interaction price constants ---
  // Approximation debts: these should eventually derive from character neighborhood /
  // local cost of living. For now, single named constants so the duplication is in
  // one place and the debt is visible.
  const CORNER_STORE_COFFEE_PRICE = 2.25; // TODO: derive from neighborhood cost-of-living

  // --- Interactions ---

  const interactions = {
    // === BEDROOM ===
    sleep: {
      id: 'sleep',
      label: 'Lie down',
      location: 'apartment_bedroom',
      available: () => {
        const energy = ctx.state.energyTier();
        const time = ctx.state.timePeriod();
        return energy === 'depleted' || energy === 'exhausted' || energy === 'tired'
          || time === 'night' || time === 'deep_night' || time === 'evening';
      },
      execute: () => {
        const energy = ctx.state.energyTier();
        const stress = ctx.state.stressTier();
        const hunger = ctx.state.hungerTier();

        // Pre-sleep NT values for falling-asleep prose shading
        const preSleepAden = ctx.state.get('adenosine');
        const preSleepGaba = ctx.state.get('gaba');
        const preSleepNE = ctx.state.get('norepinephrine');
        const preSleepSer = ctx.state.get('serotonin');

        // Falling-asleep delay — stress and racing thoughts keep you up
        let fallAsleepDelay;
        if (energy === 'depleted') {
          fallAsleepDelay = ctx.timeline.randomInt(2, 8);
        } else if (stress === 'overwhelmed' || stress === 'strained') {
          fallAsleepDelay = ctx.timeline.randomInt(15, 45);
        } else if (stress === 'tense') {
          fallAsleepDelay = ctx.timeline.randomInt(8, 25);
        } else {
          fallAsleepDelay = ctx.timeline.randomInt(3, 15);
        }

        // Melatonin modifier — high melatonin eases onset, low delays it
        const melatoninAtOnset = ctx.state.get('melatonin');
        if (melatoninAtOnset > 60) {
          fallAsleepDelay = Math.max(1, Math.round(fallAsleepDelay * 0.7));
        } else if (melatoninAtOnset < 20) {
          fallAsleepDelay = Math.round(fallAsleepDelay * 1.4);
        }

        // Natural sleep duration
        let sleepMinutes;
        if (energy === 'depleted') {
          sleepMinutes = ctx.timeline.randomInt(300, 540);
        } else if (energy === 'exhausted') {
          sleepMinutes = ctx.timeline.randomInt(240, 480);
        } else {
          sleepMinutes = ctx.timeline.randomInt(120, 360);
        }

        // Alarm interruption — check if alarm fires during sleep
        let wokeByAlarm = false;
        if (ctx.state.get('alarm_set') && !ctx.state.get('alarm_went_off')) {
          const alarmTime = ctx.state.get('alarm_time');
          const tod = ctx.state.timeOfDay();
          // Time from now until alarm (wrapping across midnight)
          const minutesToAlarm = ((alarmTime - tod) % 1440 + 1440) % 1440;
          if (minutesToAlarm > 0 && minutesToAlarm < fallAsleepDelay + sleepMinutes) {
            // Alarm fires during sleep — chance to sleep through if depleted
            // Approximation debt: 0.3 probability of sleeping through alarm at depleted energy chosen
            if (energy === 'depleted' && ctx.timeline.chance(0.3)) {
              // Sleep through the alarm
              ctx.state.set('alarm_went_off', true);
            } else {
              // Alarm truncates sleep
              sleepMinutes = Math.max(30, minutesToAlarm - fallAsleepDelay);
              wokeByAlarm = true;
              ctx.state.set('alarm_went_off', true);
            }
          }
        }

        // Quality factor — stress and hunger degrade recovery
        // Approximation debt: all sleep quality multipliers below are chosen, not derived from
        // polysomnographic data. Directions are physiologically correct; magnitudes are uncalibrated
        // and likely too aggressive. See RESEARCH-CALIBRATION.md §Sleep Quality Multipliers for
        // PSG-derived targets (Renner 2022 PMC9758584; Dijk & Czeisler 1999 PMC2269279).
        // Literature targets: stressed overwhelmed ~0.80-0.85×, strained ~0.90-0.93×;
        // starving ~0.87-0.90×, very_hungry ~0.93-0.95×.
        let qualityMult = 1.0;
        // Stress: ~10-13% relative efficiency drop under laboratory stressor (Renner 2022 PMC9758584).
        // Previous 0.5×/0.7× implied pathological degradation not seen in healthy-population PSG.
        if (stress === 'overwhelmed') qualityMult *= 0.82; // PSG midpoint 0.80-0.85×
        else if (stress === 'strained') qualityMult *= 0.91; // PSG midpoint 0.90-0.93×
        // Hunger: direct PSG data sparse; ghrelin (elevated when hungry) partially promotes SWS.
        // Dominant acute-night mechanism is WASO from discomfort, not SWS/REM suppression.
        // Previous 0.7×/0.85× substantially overstated the effect.
        if (hunger === 'starving') qualityMult *= 0.88; // PSG estimate midpoint 0.87-0.90×
        else if (hunger === 'very_hungry') qualityMult *= 0.94; // PSG estimate midpoint 0.93-0.95×

        // Rain sound comfort — noise-masking benefit, primarily sleep latency not efficiency.
        // Messineo 2017 PMC5742584: efficiency change 88%→87.5% (not significant). Effect is
        // largest in noisy environments; absent/negative in already-quiet settings.
        // Previous +0.10 inflated a latency benefit into a quality multiplier.
        // Approximation debt: should condition on environmental noise tier when that exists.
        const rainComfort = ctx.state.sentimentIntensity('rain_sound', 'comfort');
        if (ctx.state.get('weather') === 'drizzle' && rainComfort > 0) {
          qualityMult += rainComfort * 0.04; // Messineo 2017: ~2-4pp efficiency; PMC5742584
        }

        // Melatonin at sleep onset — affects sleep onset and continuity; does NOT increase SWS.
        // Meta-analysis (Ferracioli-Oda 2013 PMC3656905): ~2.2pp efficiency improvement.
        // From 85% baseline: 87.2/85 ≈ 1.026×. Previous 1.05×/0.85× were too aggressive.
        if (melatoninAtOnset > 60) qualityMult *= 1.03; // Ferracioli-Oda 2013 midpoint 1.02-1.04×
        else if (melatoninAtOnset < 25) qualityMult *= 0.90; // penalty midpoint 0.88-0.92×

        // Circadian alignment — sleeping at the wrong time degrades quality.
        // Dijk & Czeisler 1999 forced desynchrony PSG (PMC2269279): efficiency 92.6% at optimal
        // vs 73.0% at worst phase → ratio 0.785. Daytime 10-16h is the absolute worst phase.
        const sleepHour = Math.floor(ctx.state.timeOfDay() / 60);
        if (sleepHour >= 10 && sleepHour <= 16) {
          qualityMult *= 0.75;  // Dijk & Czeisler 1999: worst-phase ratio ≈ 0.785; within range
        } else if (sleepHour >= 6 && sleepHour < 10) {
          qualityMult *= 0.90;  // early-morning misalignment midpoint 0.88-0.92×
        }

        // Note: high adenosine at sleep onset was previously penalized (0.9×) but that is
        // mechanistically backward. High adenosine drives more SWS and stronger SWA rebound —
        // it is the homeostatic signal *for* deep sleep. The downsides of crash sleep (sleep
        // inertia, missed REM from short duration) are already modeled in sleepCycleBreakdown().
        // Adenosine crash penalty removed per RESEARCH-CALIBRATION.md (Reichert et al. 2022,
        // PMC9541543; Porkka-Heiskanen et al. 2000, PMID: see calibration doc).

        // Caffeine interference — caffeine at bedtime degrades sleep architecture
        qualityMult *= ctx.state.caffeineSleepInterference();

        // Illness — fever and immune activation degrade sleep architecture
        if (ctx.state.get('illness_severity') > 0) {
          const sev = ctx.state.get('illness_severity');
          qualityMult *= Math.max(0.5, 1 - sev * 0.35); // Approximation debt: illness quality penalty coefficient 0.35 chosen
        }

        // Sleep debt: ideal 480 min/day. Deficit accumulates fully, excess repays at 33%.
        const ideal = 480;
        const deficit = ideal - sleepMinutes;
        const debtChange = deficit > 0 ? deficit : deficit * 0.33;
        const oldDebt = ctx.state.get('sleep_debt');
        ctx.state.set('sleep_debt', Math.max(0, Math.min(4800, oldDebt + debtChange)));

        // Debt penalty on energy recovery: chronic deficit impairs restoration
        const currentDebt = ctx.state.get('sleep_debt');
        const debtPenalty = 1 / (1 + currentDebt / 1200);
        // Approximation debt: divisor 5 (= 0.2 energy per minute of sleep) is chosen.
        // No derivation for the mapping between sleep duration and energy restoration.
        const energyGain = (sleepMinutes / 5) * qualityMult * debtPenalty;

        // Sleep cycle breakdown — determines deep sleep / REM architecture
        const cycles = ctx.state.sleepCycleBreakdown(sleepMinutes);

        // Neurochemistry: sleep effects
        // Store sleep quality for serotonin/NE target functions
        ctx.state.set('last_sleep_quality', qualityMult);
        // Adenosine: cleared by deep sleep (the clearing mechanism)
        // Approximation debt: max clearance fraction (0.9), baseline fraction (0.4), deep-sleep
        // contribution weight (0.6) all chosen. Real adenosine clearance kinetics involve the
        // glymphatic system and are not simple fractions of current level.
        // Calibration: Xie et al. 2013 (Science) on glymphatic clearance during sleep.
        const adenosineClear = -(sleepMinutes / 480) * ctx.state.get('adenosine') * 0.9 * (0.4 + 0.6 * cycles.deepSleepFrac);
        ctx.state.adjustNT('adenosine', adenosineClear);
        // Serotonin: good sleep promotes synthesis, poor sleep impairs
        // Approximation debt: serotonin sleep adjustments (+3 good sleep / -2 poor sleep) and
        // thresholds (0.9 / 0.6) chosen. NE clearing coefficient -4 and remFrac threshold 0.15
        // are chosen. These are direct NT kicks outside the drift system.
        ctx.state.adjustNT('serotonin', qualityMult >= 0.9 ? 3 : qualityMult < 0.6 ? -2 : 0);
        // Norepinephrine: REM sleep is the NE-free environment — more REM = better NE clearing
        const neClear = cycles.remFrac * qualityMult;
        ctx.state.adjustNT('norepinephrine', neClear > 0.15 ? -4 * neClear : qualityMult < 0.6 ? 3 : 0);

        ctx.state.advanceTime(fallAsleepDelay + sleepMinutes);

        // Phone charges overnight if sleeping at home
        if (ctx.state.get('location') === 'apartment_bedroom') {
          const chargeHours = (fallAsleepDelay + sleepMinutes) / 60;
          ctx.state.adjustBattery(chargeHours * 30);
        }

        ctx.state.adjustEnergy(energyGain);
        // Approximation debt: divisor 20 (= 0.05 stress reduction per minute of sleep) chosen.
        ctx.state.adjustStress(-sleepMinutes / 20);
        ctx.state.set('actions_since_rest', 0);

        // Sleep emotional processing — REM quality determines processing effectiveness
        const emotionalQuality = qualityMult * (0.4 + 0.6 * cycles.remFrac);
        ctx.state.processSleepEmotions(ctx.character.get().sentiments, emotionalQuality, sleepMinutes);

        // Friend absence — guilt accumulates per night of silence
        ctx.state.processAbsenceEffects();

        // Fridge food slowly goes bad overnight
        // Approximation debt: 15%/sleep spoilage rate chosen; real rate depends on food type, temperature, storage
        if (ctx.state.fridgeTier() !== 'empty' && ctx.timeline.chance(0.15)) {
          ctx.state.set('fridge_food', Math.max(0, ctx.state.get('fridge_food') - 1));
        }

        // Illness onset / progression — always 2 balanced RNG calls per sleep
        const illnessRoll1 = ctx.timeline.random();
        const illnessRoll2 = ctx.timeline.randomInt(0, 3);
        if (ctx.state.illnessTier() === 'healthy') {
          // Approximation debt: all magnitudes need calibration against real incidence data.
          // No seasonal variation, no recent-illness immunity, no job-type exposure rates.
          // Should eventually derive from: immune function state, job type (food service
          // vs remote), season/climate, recent illness history.
          const stressRisk  = ctx.state.get('stress') > 60      ? 0.005 : 0;
          const debtRisk    = ctx.state.get('sleep_debt') > 480 ? 0.005 : 0;
          const workedRisk  = ctx.state.get('at_work_today')    ? 0.003 : 0;
          const baseChance  = 0.007 + stressRisk + debtRisk + workedRisk;
          if (illnessRoll1 < baseChance) {
            const types = ['flu', 'cold', 'cold', 'gi']; // cold more common
            ctx.state.set('illness_severity', 0.2);
            ctx.state.set('illness_type', types[illnessRoll2]);
            ctx.state.set('illness_day', 0);
          }
        } else {
          // Deterministic progression — RNG already consumed above
          // Approximation debt: illness progression rates (0.18/night unmedicated, 0.07 medicated),
          // base recovery (0.12 + quality×0.10), work recovery penalty (40%), medicine bonus (0.05)
          // all chosen. Real illness arc depends heavily on pathogen, immune status, treatment type.
          const illDay    = ctx.state.get('illness_day');
          const sev       = ctx.state.get('illness_severity');
          const medicated = ctx.state.get('illness_medicated');
          ctx.state.set('illness_day', illDay + 1);
          if (illDay < 2) {
            // Peak phase — severity builds, medicine slows it
            const increase = medicated ? 0.07 : 0.18;
            ctx.state.set('illness_severity', Math.min(1.0, sev + increase));
          } else {
            // Recovery — rest helps, working delays it, medicine speeds it
            const baseRecovery  = 0.12 + qualityMult * 0.1;
            const recoveryRate  = ctx.state.get('at_work_today') ? baseRecovery * 0.4 : baseRecovery;
            const medBonus      = medicated ? 0.05 : 0;
            const newSev        = Math.max(0, sev - recoveryRate - medBonus);
            ctx.state.set('illness_severity', newSev);
            if (newSev < 0.05) {
              ctx.state.set('illness_type', null);
              ctx.state.set('illness_day', 0);
            }
          }
        }

        // Undress — destination depends on energy + mood
        ctx.clothing.undress(ctx.state.energyTier(), ctx.state.moodTone(), ctx.state.get('location'));

        // Reset wake-period flags
        ctx.state.wakeUp();
        ctx.linens.noteSlept();
        // Set just_woke_alarm AFTER wakeUp() clears it — enables snooze/dismiss
        if (wokeByAlarm) {
          ctx.state.set('just_woke_alarm', true);
        }
        ctx.habits.noteWake();

        // Record events
        const quality = qualityMult >= 0.9 ? 'good' : qualityMult >= 0.6 ? 'restless' : 'poor';
        ctx.events.record('slept', { duration: sleepMinutes, wokeByAlarm, quality });
        ctx.events.record('woke_up', {});

        // Post-sleep state — how you actually are on waking
        const postEnergy = ctx.state.energyTier();
        const postMood = ctx.state.moodTone();
        const wakeTime = ctx.state.timePeriod();

        // Post-sleep NT values for waking prose shading
        const postSer = ctx.state.get('serotonin');
        const postNE = ctx.state.get('norepinephrine');
        const postGaba = ctx.state.get('gaba');
        const postAden = ctx.state.get('adenosine');
        const sleepInertia = cycles.sleepInertia;

        // --- Falling asleep ---
        let asleep;
        if (wokeByAlarm) {
          if (energy === 'depleted') {
            asleep = ctx.timeline.weightedPick([
              { weight: 1, value: 'You\'re gone before your head settles. The kind of sleep that takes you — no transition, no drift, just off.' },
              { weight: 1, value: 'Your body gives out. Not falling asleep so much as shutting down. One breath you\'re lying there, the next you\'re nowhere.' },
              // High adenosine — consciousness collapses
              { weight: ctx.state.lerp01(preSleepAden, 60, 90), value: 'You don\'t fall asleep. You drop. Like someone pulled a plug — one moment the ceiling, the next nothing, not even the nothing.' },
            ]);
          } else if (stress === 'overwhelmed' || stress === 'strained') {
            asleep = ctx.timeline.weightedPick([
              { weight: 1, value: 'Sleep comes late. You lie there turning the same thoughts over, the same knots, until exhaustion wins. It\'s not rest. It\'s surrender.' },
              { weight: 1, value: 'You stare at the dark for a long time. The thoughts don\'t stop — they just blur, eventually, into something close enough to unconsciousness.' },
              { weight: 1, value: 'It takes a while. You lie still and your head won\'t stop. Eventually the gap between thoughts gets wide enough and you slip through.' },
              // Low GABA — the mind won't release
              { weight: ctx.state.lerp01(preSleepGaba, 40, 15), value: 'Your body is exhausted but your head won\'t let go. Every time you get close to the edge, something yanks you back — a thought, a fear, your own pulse. Sleep has to fight for it.' },
              // High NE — hyper-alert in the dark
              { weight: ctx.state.lerp01(preSleepNE, 55, 80), value: 'Every sound is too loud. The building settling, the fridge, your own breathing. You lie rigid in the dark, listening to everything, and the listening is what keeps you awake.' },
            ]);
          } else {
            asleep = ctx.timeline.weightedPick([
              { weight: 1, value: 'You close your eyes and the day lets go of you. Sleep comes — not instantly, but without a fight.' },
              { weight: 1, value: 'The pillow, the dark, the quiet. You drift. Somewhere between one thought and the next you stop being awake.' },
              { weight: 1, value: 'You settle in. A few minutes of the ceiling, then nothing. Actual sleep.' },
              // Higher serotonin — settling in feels warm
              { weight: ctx.state.lerp01(preSleepSer, 50, 70), value: 'Your eyes close and there\'s a warmth to it — the sheets, the dark, your body letting go without being asked. You\'re asleep before you notice.' },
              // Rain lover during drizzle — the sound helps
              { weight: ctx.state.get('weather') === 'drizzle' && rainComfort > 0 ? rainComfort * 0.8 : 0, value: 'The rain taps the window and your eyes close. The sound fills the dark — steady, patient, asking nothing. Sleep comes with the rain.' },
            ]);
          }
        } else {
          if (energy === 'depleted' && quality === 'poor') {
            asleep = ctx.timeline.weightedPick([
              { weight: 1, value: 'You lie down and something gives way. Not quite sleep. More like your body collecting a debt it\'s owed.' },
              { weight: 1, value: 'Your body folds into the mattress. Sleep takes you, but roughly — dragging you under before you\'re ready.' },
              // High NE — body won't unclench even in exhaustion
              { weight: ctx.state.lerp01(preSleepNE, 50, 75), value: 'You collapse more than lie down. Sleep takes you but your jaw stays clenched, your shoulders stay locked. Even unconscious, something in you is bracing.' },
            ]);
          } else if (energy === 'depleted') {
            asleep = ctx.timeline.weightedPick([
              { weight: 1, value: 'You\'re asleep before you finish lying down. Gone. The kind of unconsciousness that doesn\'t feel like rest because you weren\'t awake enough to notice the transition.' },
              { weight: 1, value: 'Your body doesn\'t ask. It takes. You\'re horizontal and then you\'re nowhere, instantly, like a switch thrown.' },
              // Very high adenosine — past crash, into oblivion
              { weight: ctx.state.lerp01(preSleepAden, 70, 95), value: 'You don\'t remember lying down. Between standing and unconscious there was nothing — no transition, no last thought, just the world switching off.' },
            ]);
          } else if (quality === 'poor') {
            asleep = ctx.timeline.weightedPick([
              { weight: 1, value: 'Sleep comes in pieces. You\'re awake, then you\'re not, then you are again and the ceiling is the same.' },
              { weight: 1, value: 'You drift, surface, drift again. Every time you almost get there, something pulls you back — a thought, a sound, your own body shifting.' },
              { weight: 1, value: 'Not really sleeping. More like visiting unconsciousness in short trips and coming back each time with less to show for it.' },
              // Low GABA — anxiety keeps breaking through
              { weight: ctx.state.lerp01(preSleepGaba, 40, 15), value: 'You sink, then your chest tightens and you\'re back. Sink again. Tighten. Back. Your body wants sleep but something underneath keeps tripping the wire.' },
              // High NE — startling awake
              { weight: ctx.state.lerp01(preSleepNE, 50, 75), value: 'You jolt awake. You were asleep — you think — but now you\'re staring at the ceiling with your heart going. Nothing happened. You lie there until it slows, then try again.' },
            ]);
          } else if (sleepMinutes >= 240) {
            asleep = ctx.timeline.weightedPick([
              { weight: 1, value: 'You sleep. Actually sleep. The kind that takes you somewhere and brings you back changed.' },
              { weight: 1, value: 'You close your eyes and the world does the decent thing and goes away for a while.' },
              { weight: 1, value: 'Sleep comes, and it\'s the real kind. Deep, blank, generous.' },
              // Higher serotonin — sleep with warmth
              { weight: ctx.state.lerp01(preSleepSer, 50, 70), value: 'Sleep gathers you up. No resistance, no negotiation — just warmth and dark and the easy surrender of a body that\'s been allowed to rest.' },
              // Rain lover during drizzle — rain carries you under
              { weight: ctx.state.get('weather') === 'drizzle' && rainComfort > 0 ? rainComfort : 0, value: 'Rain on the window. The sound of it — steady, close, the whole room softened. Your eyes close and the rain is the last thing you hear, tapping its patient rhythm on the glass. Sleep takes you gently.' },
            ]);
          } else {
            asleep = ctx.timeline.weightedPick([
              { weight: 1, value: 'You close your eyes. Something between sleep and not — the body resting even if the mind doesn\'t fully let go.' },
              { weight: 1, value: 'You drift. Not deep, not long, but your body takes what it can get.' },
              // High adenosine — drift is heavier than expected
              { weight: ctx.state.lerp01(preSleepAden, 55, 75), value: 'You meant to just close your eyes. The tiredness was deeper than you realized — you\'re under before you can reconsider.' },
            ]);
          }
        }

        // --- Waking up ---
        let waking;
        if (wokeByAlarm) {
          // Alarm waking — the specific fog of being pulled out
          if (postEnergy === 'depleted' || postEnergy === 'exhausted') {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'The alarm. It comes from far away and then it\'s right there, inside your skull. Your hand finds it somehow. The silence after is worse — now you have to be a person. Your body says no. Every part of you says no.' },
              { weight: 1, value: 'Sound. Your arm moves before you\'re awake. The alarm stops. You lie in the sudden quiet and your eyelids weigh more than anything has ever weighed. Not enough. It wasn\'t enough.' },
              { weight: 1, value: 'The alarm drags you up from somewhere deep. You kill it and lie there in the aftermath, not yet a person, not yet anything. The room is dark, or bright, or something. You can\'t make it matter yet.' },
              // High adenosine — can barely surface
              { weight: ctx.state.lerp01(postAden, 30, 55), value: 'The alarm is somewhere. Far away and getting closer, or maybe it was always close and you\'re the one who was far. Your hand moves through something thick. Finds the phone. Silence. Your eyes won\'t open. They genuinely won\'t open.' },
              // Low serotonin — waking into dread
              { weight: ctx.state.lerp01(postSer, 35, 15), value: 'The alarm, and before you\'re even awake, the feeling is already there — not a thought, not yet, just weight. The day waiting on the other side of your eyelids, and you already know what it\'s going to be.' },
            ]);
          } else if (quality === 'poor') {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'The alarm. You were already half-awake anyway, floating in that grey zone between sleep and not. The sound just makes it official. Your eyes feel like they\'ve been open for days.' },
              { weight: 1, value: 'Sound cuts through the thin sleep you had. You turn it off. The room comes back — same room, same light, same you. Except grittier, like something\'s been rubbed raw.' },
              // High NE — edges too sharp
              { weight: ctx.state.lerp01(postNE, 50, 70), value: 'The alarm is an assault. Not loud — it\'s always this loud — but every frequency is a needle. You slap it quiet and the silence rings. Your skin feels too thin for the morning.' },
            ]);
          } else if (postEnergy === 'tired' || postEnergy === 'okay') {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'The alarm. You were actually sleeping — deeply enough that the sound takes a second to become a sound and not just part of whatever you were dreaming. You reach for the phone. The room assembles itself around you: walls, ceiling, the light saying morning.' },
              { weight: 1, value: 'The alarm goes off and you\'re not yet a person. A hand hits the phone. Silence. You lie there while the fog lifts in layers — first you know where you are, then when, then why it matters. A minute passes before any of it feels real.' },
              { weight: 1, value: 'Noise. Then not noise. Then the slow work of becoming someone who is awake. The pillow is warm. The air is not. You\'re somewhere between the two.' },
              // High adenosine residual — thicker fog
              { weight: ctx.state.lerp01(postAden, 25, 45), value: 'The alarm. You hear it for a long time before it becomes an alarm — just sound, formless, part of something you were already in. Your hand knows what to do before you do. The silence after is cotton. You float in it, not yet here.' },
              // Sleep inertia — pulled out of deep sleep
              { weight: sleepInertia, value: 'The alarm rips you out of something. Deep, whatever it was — the sound is wrong, the room is wrong, everything is a foreign country for a few bad seconds. Your hand kills the noise and you lie there while the world slowly becomes a place you recognize.' },
            ]);
          } else {
            // rested/alert alarm wake
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'The alarm and you\'re awake — actually awake, not the usual drag. Your eyes open and the room is just a room. Morning. Your body cooperates for once.' },
              { weight: 1, value: 'The alarm. But you were already surfacing, already close to the edge of waking. The sound just tips you over. You open your eyes and the day is right there, ready. So are you, more or less.' },
              // Higher serotonin — morning feels possible
              { weight: ctx.state.lerp01(postSer, 55, 75), value: 'The alarm, and you\'re already there. Eyes open, body present, the room making sense on the first try. Something in you cooperated overnight. The morning is just morning.' },
            ]);
          }
        } else if (wakeTime === 'deep_night' || wakeTime === 'night') {
          // Waking in the dark — the wrong kind of awake
          if (postEnergy === 'depleted' || postEnergy === 'exhausted') {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'You surface in the dark. Not morning — not close. The room is black and quiet and your body is a thing that is awake when it shouldn\'t be. Nowhere to go with it. Nothing to do with it.' },
              { weight: 1, value: 'Dark. You\'re awake. That\'s wrong — it should be later, should be light. But here you are, eyes open in a room that gives you nothing to look at. Too tired to get up. Too awake to go back.' },
              // Low GABA — night anxiety, the 3am dread
              { weight: ctx.state.lerp01(postGaba, 40, 15), value: 'You\'re awake and it\'s dark and the first thing that arrives is the dread. Not of anything specific — just the particular terror of being conscious at the wrong hour with a body too tired to do anything about it.' },
            ]);
          } else {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'You come back to yourself in the dark. The room is silent except for the building being a building — pipes, settling, the hum you only notice at night. It\'s the wrong time to be awake. You know this the way you know your own name.' },
              { weight: 1, value: 'Dark. Still. You\'re awake and the world isn\'t. The silence has that particular quality — the one that means everyone else is asleep and you\'re on the wrong side of it.' },
              { weight: 1, value: 'Your eyes open to nothing. Dark room, dark window. The kind of awake that comes without a reason, just you suddenly here in the middle of the night with no idea what to do about it.' },
              // High NE — hyper-aware in the dark
              { weight: ctx.state.lerp01(postNE, 45, 70), value: 'You\'re awake, and every sound is a fact. The pipes. A car outside. Someone\'s footsteps above you, or below. The dark is full of information you didn\'t ask for, and you can\'t stop receiving it.' },
            ]);
          }
        } else if (wakeTime === 'afternoon' || wakeTime === 'evening') {
          // Late waking — the disorientation of lost time
          if (postMood === 'numb' || postMood === 'heavy') {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'You open your eyes and the light is wrong. Afternoon light — low, coming in at an angle that means the day happened without you. You lie there with that. The weight of it.' },
              { weight: 1, value: 'The room is bright in the wrong way. You slept through the morning, through whatever the morning was going to be. The day is mostly over. You\'re mostly not surprised.' },
              // Low serotonin — the lost time has gravity
              { weight: ctx.state.lerp01(postSer, 35, 15), value: 'Afternoon. The day already gone. Some part of you chose this, the long sleep, the missed hours. It doesn\'t feel like a choice. It feels like the only thing that was going to happen.' },
            ]);
          } else {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'You surface and the light says afternoon. The day is already half-gone, already somewhere you\'ll never catch. The room has that overslept feeling — stale air, warm sheets, time you didn\'t spend.' },
              { weight: 1, value: 'You come back. The light through the window is angled low and golden, which means it\'s later than it should be. Much later. The morning happened without you. It\'s gone.' },
              { weight: 1, value: 'Your eyes open and the sun is wrong — past the middle of the sky, past the part of the day when waking up feels like waking up. This feels like something else. Surfacing.' },
              // High adenosine residual — sluggish re-entry
              { weight: ctx.state.lerp01(postAden, 25, 45), value: 'The light is wrong and so is your head. Thick, slow, like waking up underwater. Afternoon. The day has been happening without you, and getting back to it feels like swimming through something.' },
            ]);
          }
        } else if (postEnergy === 'depleted' || postEnergy === 'exhausted') {
          // Still exhausted despite sleeping — not enough
          waking = ctx.timeline.weightedPick([
            { weight: 1, value: 'You surface. That\'s the only word for it — coming up from somewhere that wasn\'t deep enough, breaking the surface and finding the air no different. Your body is heavy. Your eyes are heavy. Everything is heavy and the room is asking you to be a person in it.' },
            { weight: 1, value: 'You wake up, and the first thing you know is that it wasn\'t enough. The sleep, the hours, whatever your body did in the dark — not enough. You\'re here, eyes open, and the distance between this and rested is a distance you can feel.' },
            { weight: 1, value: 'Morning, probably. You\'re awake, technically. Your body is a sandbag version of itself — present but dense, uncooperative. The ceiling is up there. You\'re down here. The gap between is everything.' },
            // Low serotonin — the not-enough has a color
            { weight: ctx.state.lerp01(postSer, 35, 15), value: 'You surface and the first thing waiting is the knowledge that this is it. This is all the rest you\'re getting. Your body is heavy. Your thoughts are heavy. The room is the same room, and you\'re worse for having opened your eyes.' },
            // Moderate+ sleep debt — not just last night, it's cumulative
            { weight: ctx.state.lerp01(currentDebt, 300, 720), value: 'You wake up and it\'s not just last night. It\'s the night before, and the one before that. The tiredness has layers — each one a sleep that wasn\'t enough, stacked up, compounding. One good night won\'t fix this. You can feel that in your bones.' },
            // Severe sleep debt — the body running on empty
            { weight: ctx.state.lerp01(currentDebt, 720, 2400), value: 'You\'re awake. You think. The line between sleeping and not has worn so thin you can\'t always tell which side you\'re on. Your body has been running a tab it can\'t pay, and this morning it\'s not even pretending to try. Everything is far away.' },
          ]);
        } else if (quality === 'poor') {
          // Slept but poorly — the gritty surface feeling
          waking = ctx.timeline.weightedPick([
            { weight: 1, value: 'You wake up feeling like you didn\'t sleep. You did — you must have, because time passed — but your body didn\'t get the memo. Your eyes are gritty, your neck is wrong, everything is slightly off in a way you can\'t fix by stretching.' },
            { weight: 1, value: 'You come back. The room. The light. You. Something\'s wrong, or not wrong exactly — just not right. Sleep happened but it didn\'t take. You feel like a rough draft of a person.' },
            { weight: 1, value: 'Awake. Or some version of it. Your body did the hours but skipped the rest — you can feel it in your eyes, your joints, the dull headache that isn\'t quite a headache. The room is the same room. You\'re a worse version of who lay down in it.' },
            // High NE — sleep didn't clear the charge
            { weight: ctx.state.lerp01(postNE, 50, 70), value: 'You wake up tight. Your jaw, your shoulders, your hands — clenched around something that wasn\'t there when you went to sleep, or was and didn\'t leave. The sleep didn\'t clear it. You can feel the charge in your teeth.' },
            // Moderate sleep debt — the poor quality is catching up
            { weight: ctx.state.lerp01(currentDebt, 300, 720), value: 'You slept, but your body isn\'t buying it. This isn\'t one bad night — it\'s a string of them, the deficit compounding, each morning a little worse than the last. The ceiling looks the same but you\'re seeing it from deeper down.' },
          ]);
        } else if (postEnergy === 'rested' || postEnergy === 'alert') {
          // Actually rested — rare clarity
          if (postMood === 'clear' || postMood === 'present') {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'You open your eyes and the room is just a room. Not a problem, not a weight — just walls and light and air. Your body is yours. It works. The morning is outside the window doing morning things, and you\'re in here, and that\'s fine. Actually fine.' },
              { weight: 1, value: 'You wake up and something is different. It takes a second to place it — the absence of dread. The room is light, the bed is warm, your body cooperated. You\'re just awake. Just here. It feels rare because it is.' },
              { weight: 1, value: 'Light through the curtain. Your eyes open and your body doesn\'t argue. No fog, no weight, no negotiation with your own limbs. The room, the morning, you — all present, all accounted for. This is what it\'s supposed to feel like.' },
              // High serotonin — actually warm
              { weight: ctx.state.lerp01(postSer, 60, 80), value: 'You wake up and the world is gentle. That\'s the word — gentle. The light, the air, the fact of being alive in a bed. Your body is easy in itself. You lie there for a moment just because you can, and the moment is good.' },
            ]);
          } else {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'You wake up and your body is there — present, functional, not fighting you. The room comes into focus: the light, the shapes, the ordinary evidence of morning. You don\'t feel good, exactly. But you feel like yourself.' },
              { weight: 1, value: 'Your eyes open. The ceiling, the light, the quiet. Your body did the thing it was supposed to do for once — slept, recovered, came back to you more or less intact. The day is out there. You can probably meet it.' },
              // Low GABA despite rest — body rested but mind already running
              { weight: ctx.state.lerp01(postGaba, 45, 25), value: 'Your body is rested — you can feel that, the energy is there. But your mind is already going, already making lists, already three steps into a day that hasn\'t started. You\'re functional. Just not calm.' },
            ]);
          }
        } else {
          // Tired but functional — the middle ground
          if (postMood === 'heavy' || postMood === 'numb') {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'You\'re awake. The room, the light. Your body moves when you tell it to, just slowly, just with the particular reluctance of something that would rather not. The day is there, outside the window. It doesn\'t care if you\'re ready.' },
              { weight: 1, value: 'You surface slowly. The fog doesn\'t lift so much as thin — you can see through it, but it\'s still there, clinging. The room is a room again. Your body is a body again. Neither feels like a gift.' },
              // Low serotonin — the heaviness has weight
              { weight: ctx.state.lerp01(postSer, 35, 15), value: 'You\'re awake, and the first thing you feel is the cost of it. Being conscious takes something from you, some toll paid at the door. The room is there. The day is there. That\'s already too much.' },
            ]);
          } else if (wakeTime === 'early_morning' || wakeTime === 'morning') {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'You wake up. Not sharply, not gently — just the slow fade from not-here to here. The room materializes: the light through the curtain, the shapes of things, the particular silence of early morning. You\'re somewhere between fog and awake. The body moves, but it takes a minute.' },
              { weight: 1, value: 'Morning. You know this before you open your eyes — the light, the feel of it. Your body is still negotiating the transition from asleep to not. The room is there when you\'re ready for it. You\'re almost ready for it.' },
              { weight: 1, value: 'You surface into morning. The light is thin and pale — early, or early enough. Your body does an inventory without your permission: stiff, slow, but functional. The day hasn\'t started demanding things yet. Give it a minute.' },
              // High NE — sharper morning than expected
              { weight: ctx.state.lerp01(postNE, 45, 65), value: 'You wake up and the room is immediately all there — every edge, every sound, the light too precise for how early it is. Your body is already cataloguing: the temperature, the stiffness in your back, the air. Too awake for how tired you are.' },
            ]);
          } else {
            waking = ctx.timeline.weightedPick([
              { weight: 1, value: 'You wake up. The room, the light, the fact of being conscious again. Your body comes back to you in pieces — hands first, then weight, then the specific feeling of a head that was recently asleep. You\'re here.' },
              { weight: 1, value: 'Eyes open. The room. You. The slow assembly of a person from the raw material of someone who was just unconscious. It takes a minute. Things come back — where you are, what day it is, what you\'re supposed to be doing. You\'re not sure about the last one.' },
              // High adenosine residual — foggy edges
              { weight: ctx.state.lerp01(postAden, 25, 40), value: 'You come back slowly. The room is there but soft, like looking through gauze. Your thoughts are shapes, not words yet. It takes a while for the edges to sharpen — for the room to become a room and not just light and surfaces.' },
            ]);
          }
        }

        // Slept-through-alarm awareness — alarm fired but didn't wake you
        if (ctx.state.get('alarm_went_off') && !wokeByAlarm) {
          waking += ' Your phone is quiet. The alarm went off, earlier. You think.';
        }

        return asleep + ' ' + waking;
      },
    },

    get_dressed: {
      id: 'get_dressed',
      label: 'Get dressed',
      location: 'apartment_bedroom',
      available: () => !ctx.state.get('dressed'),
      execute: () => {
        // Check before wear() — no wearable items means grabbing from the floor
        const grabbingFromFloor = ctx.clothing.wearableItems().length === 0;
        ctx.state.set('dressed', true);
        ctx.clothing.wear();
        ctx.state.advanceTime(5);
        ctx.events.record('got_dressed');

        const mood = ctx.state.moodTone();

        if (mood === 'numb' || mood === 'heavy') {
          return ctx.character.get('outfit_low_mood');
        }
        if (grabbingFromFloor) {
          return ctx.character.get('outfit_messy');
        }
        return ctx.character.get('outfit_default');
      },
    },

    set_alarm: {
      id: 'set_alarm',
      label: 'Set your alarm',
      location: 'apartment_bedroom',
      available: () => {
        const time = ctx.state.timePeriod();
        return (time === 'evening' || time === 'night' || time === 'deep_night')
          && ctx.state.get('has_phone') && ctx.state.get('phone_battery') > 0;
      },
      execute: () => {
        // Set alarm relative to work shift — enough time to get ready and commute
        const shiftStart = ctx.state.get('work_shift_start');
        const alarmTime = shiftStart - 90; // 90 min before shift
        ctx.state.set('alarm_time', alarmTime);
        ctx.state.set('alarm_set', true);
        ctx.state.set('alarm_went_off', false);
        ctx.state.advanceTime(1);

        const h = Math.floor(alarmTime / 60);
        const m = alarmTime % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const timeStr = displayH + ':' + m.toString().padStart(2, '0') + ' ' + period;

        return 'You set the alarm. ' + timeStr + '. The phone screen dims.';
      },
    },

    skip_alarm: {
      id: 'skip_alarm',
      label: 'Turn off your alarm',
      location: 'apartment_bedroom',
      available: () => {
        const time = ctx.state.timePeriod();
        return ctx.state.get('alarm_set') && !ctx.state.get('alarm_went_off')
          && (time === 'evening' || time === 'night' || time === 'deep_night');
      },
      execute: () => {
        ctx.state.set('alarm_set', false);
        ctx.state.advanceTime(1);
        return 'You turn off the alarm. Tomorrow is tomorrow\'s problem.';
      },
    },

    snooze_alarm: {
      id: 'snooze_alarm',
      label: 'Snooze',
      location: 'apartment_bedroom',
      available: () => ctx.state.get('just_woke_alarm'),
      execute: () => {
        const count = ctx.state.get('snooze_count');
        ctx.state.set('snooze_count', count + 1);
        ctx.state.advanceTime(9);
        const energyGain = ctx.timeline.randomInt(1, 3);
        ctx.state.adjustEnergy(energyGain);
        ctx.state.adjustNT('adenosine', -1);
        // Phone charges a tiny bit during snooze
        if (ctx.state.get('location') === 'apartment_bedroom') {
          ctx.state.adjustBattery(4);
        }

        ctx.events.record('snoozed', { count: count + 1 });

        const mood = ctx.state.moodTone();
        const aden = ctx.state.get('adenosine');
        const ser = ctx.state.get('serotonin');

        if (count === 0) {
          // First snooze — pure fog
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Your hand finds the button before the rest of you wakes up. Nine minutes. The pillow takes you back. The room dissolves.' },
            { weight: 1, value: 'Snooze. The sound stops. The silence rushes in and you sink back into it, the warm dark, the not-yet. Nine minutes of borrowed time.' },
            { weight: 1, value: 'You hit snooze the way you breathe — without deciding. The alarm goes quiet. The mattress has you. Nine more minutes of not being a person.' },
            // High adenosine — barely surfaced
            { weight: ctx.state.lerp01(aden, 40, 70), value: 'The sound. Your hand. Silence. You were never really awake — just close enough to the surface for your arm to know what to do. You\'re already gone again.' },
          ]);
        } else if (count === 1) {
          // Second snooze — negotiation
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Again. The alarm, the hand, the silence. You know you should get up. You know exactly what you should do. Nine minutes. Just nine more.' },
            { weight: 1, value: 'The alarm comes back and part of you expected it, and part of you is furious. You hit snooze. Your body makes a convincing argument for staying. You listen to it.' },
            // Low serotonin — the negotiation has weight
            { weight: ctx.state.lerp01(ser, 40, 20), value: 'Again. And this time there\'s something behind it — not just tired, but the specific reluctance of knowing what\'s on the other side of getting up. The alarm goes quiet. You stay.' },
          ]);
        } else {
          // Third+ snooze — guilt building
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You hit snooze again and the guilt is there now, thin but present, accumulating with each press. You know. You know. Nine minutes won\'t fix anything. You press it anyway.' },
            { weight: 1, value: 'Snooze. Again. The ritual of it — sound, hand, silence, sinking. You\'re losing time you\'ll pay for later. You can feel that and you do it anyway because the alternative is now and now is too much.' },
            // High adenosine — guilt can't compete with the fog
            { weight: ctx.state.lerp01(aden, 40, 65), value: 'You should feel bad about this. You will, later. Right now the fog is thicker than the guilt and nine minutes is nine minutes is nine minutes.' },
            // Low serotonin — each snooze is a small defeat
            { weight: ctx.state.lerp01(ser, 40, 20), value: 'Again. And each time it\'s less about being tired and more about the thing you can\'t name — the weight of it, the knowing that getting up means starting and starting is the part you can\'t do. Nine more minutes of not starting.' },
          ]);
        }
      },
    },

    dismiss_alarm: {
      id: 'dismiss_alarm',
      label: 'Get up',
      location: 'apartment_bedroom',
      available: () => ctx.state.get('just_woke_alarm'),
      execute: () => {
        ctx.state.set('just_woke_alarm', false);
        ctx.state.advanceTime(1);

        ctx.events.record('dismissed_alarm', { snoozeCount: ctx.state.get('snooze_count') });

        const count = ctx.state.get('snooze_count');
        const mood = ctx.state.moodTone();
        const energy = ctx.state.energyTier();

        if (count === 0) {
          // Dismissed immediately — no snoozes
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You turn off the alarm and sit up. Just like that. Some mornings you can do it. This is one of them.' },
            { weight: 1, value: 'Alarm off. Feet on the floor. The air is cold and the bed is warm and you leave it anyway, the way you leave a conversation — just turning away before you can change your mind.' },
            // Good energy — body cooperates
            { weight: (energy === 'rested' || energy === 'alert') ? 0.8 : 0, value: 'The alarm, and you\'re up. Actually up, not the negotiation, not the bargaining — just a body that slept and is now vertical and mostly willing to be.' },
            // Heavy mood — up, but at cost
            { weight: (mood === 'heavy' || mood === 'numb') ? 0.6 : 0, value: 'You turn off the alarm and sit up because that\'s what happens next. Not because you want to. Because the alternative is lying here and you already know what lying here becomes.' },
          ]);
        } else if (count <= 2) {
          // A few snoozes — the typical morning
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You turn off the alarm this time. Actually turn it off. Your body protests — loudly, in the language of heavy limbs and warm sheets — but you\'re up. You\'re up.' },
            { weight: 1, value: 'Enough. You sit up before you can hit snooze again. The room tilts slightly, then settles. The morning is waiting. It\'s been waiting.' },
            // Heavy mood — getting up is the hard part
            { weight: (mood === 'heavy') ? 0.5 : 0, value: 'You force yourself up and it takes everything the word "force" implies. The hardest part of the day is over. It\'s also the first part.' },
          ]);
        } else {
          // Many snoozes — running late, aware of it
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You finally get up and the clock tells you what you already know — you\'re late, or close to it, and every snoozed minute is a minute you don\'t have. The day started without you.' },
            { weight: 1, value: 'Up. Finally. Your body moves like it\'s doing you a personal favor. The time — you don\'t want to look at the time, but you do, and it\'s exactly as bad as you thought.' },
          ]);
        }
      },
    },

    charge_phone: {
      id: 'charge_phone',
      label: 'Plug your phone in',
      location: 'apartment_bedroom',
      available: () => ctx.state.get('has_phone') && ctx.state.get('phone_battery') < 80 && !ctx.state.get('viewing_phone'),
      execute: () => {
        const minutes = ctx.timeline.randomInt(15, 30);
        const chargeGain = (minutes / 60) * 30;
        ctx.state.advanceTime(minutes);
        ctx.state.adjustBattery(chargeGain);

        const mood = ctx.state.moodTone();
        const battery = ctx.state.batteryTier();

        if (battery === 'dead' || battery === 'critical') {
          if (mood === 'numb' || mood === 'heavy') {
            return 'You plug it in and wait. The screen stays dark for a while, then the charging icon appears. You watch it like it matters.';
          }
          return 'You plug it in. Dead phones take a minute to show signs of life. Eventually the screen lights up with the charging symbol.';
        }
        if (mood === 'numb' || mood === 'heavy') {
          return 'You plug the phone in and sit on the bed while it charges. Time passes. The cable isn\'t long enough to go anywhere.';
        }
        if (mood === 'fraying') {
          return 'You plug it in. Stand there for a minute watching the screen, then make yourself stop.';
        }
        return 'You plug the phone in and do nothing for a few minutes while it charges. The cable reaches the nightstand and that\'s about it.';
      },
    },

    check_phone_bedroom: {
      id: 'check_phone_bedroom',
      label: 'Check your phone',
      location: 'apartment_bedroom',
      available: () => ctx.state.get('has_phone') && ctx.state.get('phone_battery') > 0 && !ctx.state.get('viewing_phone'),
      execute: () => {
        ctx.state.set('viewing_phone', true);
        ctx.state.advanceTime(1);
        ctx.events.record('checked_phone');
        return phoneScreenDescription();
      },
    },

    lie_there: {
      id: 'lie_there',
      label: 'Stay in bed',
      location: 'apartment_bedroom',
      available: () => true,
      execute: () => {
        const mood = ctx.state.moodTone();
        const minutes = ctx.timeline.randomInt(10, 20);
        ctx.state.advanceTime(minutes);

        // NT values for continuous prose and mechanical shading
        const ser = ctx.state.get('serotonin');
        const ne = ctx.state.get('norepinephrine');
        const gaba = ctx.state.get('gaba');
        const aden = ctx.state.get('adenosine');

        let text;

        if (mood === 'fraying') {
          ctx.state.adjustStress(2);
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You lie there. The thoughts don\'t stop. They circle — the same three things, faster, tighter. You\'re not resting. You\'re trapped horizontally.' },
            { weight: 1, value: 'The ceiling. Your jaw is clenched. You notice it, unclench, and it\'s back thirty seconds later. The bed isn\'t helping.' },
            { weight: 1, value: 'You stay in bed. The quiet makes it worse — nothing to drown out what\'s in your head. Your body is still but nothing else is.' },
            // High NE — sensory overload even horizontal
            { weight: ctx.state.lerp01(ne, 60, 85), value: 'You lie down but the sheets are wrong. The texture. The temperature. Your skin is reading everything at twice the volume.' },
            // Low GABA — no way to settle
            { weight: ctx.state.lerp01(gaba, 35, 15), value: 'The bed should help. Lying down should help. Nothing is helping. Your body is still but everything underneath is running.' },
          ]);
        } else if (mood === 'numb') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You lie there. Time passes. You know this because the light changes slightly. That\'s the only evidence.' },
            { weight: 1, value: 'The bed. The ceiling. The space between them, with you in it. Nothing moves. Nothing needs to.' },
            { weight: 1, value: 'You stay. It\'s not rest and it\'s not not-rest. It\'s just the absence of getting up.' },
            // Very low serotonin — numb is deep
            { weight: ctx.state.lerp01(ser, 30, 10), value: 'You lie there. You could be anyone. You could be no one. It wouldn\'t change what the ceiling looks like.' },
          ]);
        } else if (mood === 'heavy') {
          // Mechanical shading: low GABA means anxiety under the heaviness — no relief from lying down
          if (gaba < 35) {
            // Heavy + anxious: bed doesn't help, stress stays
            ctx.state.adjustStress(0);
          } else {
            ctx.state.adjustStress(-1);
          }
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You stay in bed. The pressure to be somewhere, do something — it\'s still there, but quieter when you\'re lying down. Barely.' },
            { weight: 1, value: 'The pillow is warm from your head. You turn it over. The cool side. Small.' },
            { weight: 1, value: 'You don\'t get up. Nobody is asking you to. That helps, a little, in a way that also doesn\'t help.' },
            // Low serotonin — heavy and sinking
            { weight: ctx.state.lerp01(ser, 35, 15), value: 'You lie there. The mattress takes your shape and you let it. Getting back out of this shape seems like a problem for someone else.' },
            // Low GABA — heavy but can't rest
            { weight: ctx.state.lerp01(gaba, 40, 20), value: 'You stay in bed. It doesn\'t help. There\'s a hum underneath the heaviness, a vibration that won\'t let the weight settle into rest.' },
          ]);
        } else if (mood === 'hollow' || mood === 'quiet') {
          ctx.state.adjustStress(-1);
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You lie there. The room is quiet. You\'re quiet. The two of you have an understanding.' },
            { weight: 1, value: 'Just being. The bed, the air, the sound of nothing in particular. It\'s not peace. But it\'s not war.' },
            { weight: 1, value: 'You stay. The quiet settles. Not comfortable exactly — but not uncomfortable either. Just still.' },
            // Higher serotonin — quiet tips toward gentle
            { weight: ctx.state.lerp01(ser, 45, 65), value: 'You lie there. The quiet isn\'t asking anything. Neither are you. Something about that is almost okay.' },
            // High NE — quiet but wired
            { weight: ctx.state.lerp01(ne, 45, 70), value: 'You stay still. The quiet should be restful but you\'re listening for something. You don\'t know what. The listening doesn\'t stop.' },
          ]);
        } else if (mood === 'clear' || mood === 'present') {
          ctx.state.adjustStress(-2);
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You lie still. Actually still — not the holding-still of trying to sleep, just the stillness of not needing to move. Your breath slows. Something loosens.' },
            { weight: 1, value: 'The sheets, the light, the quiet. You\'re lying here because you can. That\'s the whole reason. It\'s enough.' },
            { weight: 1, value: 'You stay in bed. Not sleeping, not trying to. Just being horizontal in a room that asks nothing of you. Something settles.' },
            // High serotonin — genuinely warm
            { weight: ctx.state.lerp01(ser, 60, 80), value: 'You lie there and your body is quiet. Not tired-quiet. Just — at ease. The kind of still that\'s chosen, not collapsed into.' },
          ]);
        } else {
          // flat
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You lie there for a while. The ceiling doesn\'t change. Neither do you. Eventually you shift, but that\'s about it.' },
            { weight: 1, value: 'Time passes. You\'re in bed. These are the facts. Nothing else happens.' },
            { weight: 1, value: 'You stay. Not resting, not thinking, not anything in particular. Just lying there because you\'re already lying there.' },
            // Low serotonin — flat has an undertow
            { weight: ctx.state.lerp01(ser, 42, 25), value: 'You lie there. It should be nothing. It is nothing. But the nothing has a color to it and the color isn\'t good.' },
            // High NE — flat but restless
            { weight: ctx.state.lerp01(ne, 45, 65), value: 'You lie there. Your foot moves. Your hand adjusts the sheet. Small things that aren\'t rest and aren\'t decisions. Just the body fidgeting with itself.' },
          ]);
        }

        // Deterministic modifiers — no RNG consumed
        if (aden > 70 && ctx.state.adenosineBlock() > 0.4) {
          text += ' Everything is soft at the edges. The kind of tired that blurs.';
        }

        return text;
      },
    },

    look_out_window: {
      id: 'look_out_window',
      label: 'Look out the window',
      location: 'apartment_bedroom',
      available: () => true,
      execute: () => {
        const mood = ctx.state.moodTone();
        const weather = ctx.state.get('weather');
        const minutes = ctx.timeline.randomInt(5, 10);
        ctx.state.advanceTime(minutes);

        // Rain sound sentiment — serotonin nudge during drizzle + habituation
        const rc = ctx.state.sentimentIntensity('rain_sound', 'comfort');
        if (weather === 'drizzle' && rc > 0) {
          ctx.state.adjustNT('serotonin', rc * 2);
          ctx.state.adjustSentiment('rain_sound', 'comfort', -0.002);
        }

        // NT values for continuous prose shading
        const ser = ctx.state.get('serotonin');
        const ne = ctx.state.get('norepinephrine');
        const dopa = ctx.state.get('dopamine');
        const gaba = ctx.state.get('gaba');
        const aden = ctx.state.get('adenosine');

        // Weather sentiment
        const weatherComfort = ctx.state.sentimentIntensity('weather_' + weather, 'comfort');

        if (mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You look out the window. The street is there. People, cars, the sky. You see all of it. None of it registers.' },
            { weight: 1, value: 'The window. The world on the other side of the glass. You watch it like it\'s on a screen — present, visible, not quite real.' },
            { weight: 1, value: 'Outside exists. You can see it. Knowing that doesn\'t do anything, but you look anyway.' },
            // Low dopamine — nothing catches
            { weight: ctx.state.lerp01(dopa, 40, 15), value: 'You look out. Things move — a person, a car, a bird. Your eyes follow without your permission. None of it reaches the part of you that would care.' },
            // Snow — white and still out there
            { weight: weather === 'snow' ? 1.5 : 0, value: 'Snow on the street, on the rooftops. White and quiet out there. You see all of it. None of it reaches you.' },
          ]);
        }
        if (mood === 'heavy') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The world outside. People going places. You\'re in here. The glass between you and that is thin but it might as well be a wall.' },
            { weight: 1, value: 'You look out. Trees, if there are trees. Sky. The distance between you and all of it feels wider than the window.' },
            { weight: 1, value: 'Outside is happening. You watch it from the bed. The effort of being out there — even thinking about it is a lot.' },
            // Low serotonin — the distance is heavier
            { weight: ctx.state.lerp01(ser, 35, 15), value: 'You look out and the world is right there, close enough to touch if you opened the window. You won\'t. The distance isn\'t the glass. It\'s everything between you and being a person who goes outside.' },
            // Snow — the white world feels like more pressure
            { weight: weather === 'snow' ? 1.5 : 0, value: 'Snow outside. The world white and quiet. The stillness of it doesn\'t help — it just makes the inside feel louder.' },
          ]);
        }
        if (mood === 'fraying') {
          if (weather === 'clear') {
            ctx.state.adjustStress(-2);
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You look out. Clear sky. The light is doing something good today — something open. Your shoulders drop half an inch. It helps.' },
              { weight: 1, value: 'The window. Blue out there, or close to it. Your eyes rest on the sky because it\'s the only thing not asking anything of you.' },
              { weight: 1, value: 'Clear outside. The light comes in and touches the floor. You stand in it for a minute. Something loosens, slightly.' },
              // Higher serotonin — the light actually reaches you
              { weight: ctx.state.lerp01(ser, 40, 60), value: 'The sky is clear and the light comes in and for a second it\'s just light — not an accusation, not a reminder. Just warmth on your face. Your shoulders come down. Your breath comes easier.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You look out the window. Grey. The same grey as the inside of your head. It doesn\'t help.' },
            { weight: 1, value: 'Outside is flat and overcast. You were hoping for something — you\'re not sure what. This isn\'t it.' },
            { weight: 1, value: 'The window. Rain, or the threat of it. The world out there looks exactly like you feel.' },
            // Low GABA — the grey presses in
            { weight: ctx.state.lerp01(gaba, 40, 20), value: 'You look out and the grey is everywhere — the sky, the buildings, the flat light on the street. It presses against the glass. You step back without deciding to.' },
            // Rain lover during drizzle — the sound helps even when fraying
            { weight: weather === 'drizzle' && rc > 0 ? rc * 0.6 : 0, value: 'You look out. Grey, drizzle, the streaked glass. But the sound of the rain — that steady tapping — is doing something. Somewhere beneath the noise in your head, the rain is a rhythm you can hold onto.' },
            // Snow — the quiet doesn't match what's inside
            { weight: weather === 'snow' ? 1.5 : 0, value: 'You look out. Snow. The world gone quiet and white, like someone turned down all the noise. Your insides didn\'t get the memo.' },
          ]);
        }
        if (mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You look out. Someone\'s walking a dog. Someone else is carrying groceries. People with destinations. You watch.' },
            { weight: 1, value: 'The window shows the usual. The street, the building opposite. A life-sized diorama of people going somewhere.' },
            { weight: 1, value: 'Outside. People. Movement. The glass keeps the sound out. You watch like it\'s an aquarium.' },
            // Low dopamine — watching without any pull to join
            { weight: ctx.state.lerp01(dopa, 40, 20), value: 'Someone crosses the street. Someone else waits at the corner. You watch them the way you\'d watch a screensaver — movement without meaning, pattern without pull.' },
            // Snow — the muted street fits
            { weight: weather === 'snow' ? 1.5 : 0, value: 'Snow out there. The street is slower, the usual movement muted under white. You watch from the glass. The stillness suits you, or you suit it. Hard to say.' },
          ]);
        }
        if (mood === 'clear' || mood === 'present') {
          ctx.state.adjustStress(-3);
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You look out the window. The light, the sky, the ordinary scene below — it\'s actually nice. The kind of nice you can feel today.' },
            { weight: 1, value: 'The view. Nothing special — rooftops, sky, a tree if you lean. But you\'re seeing it. Actually seeing it. That\'s different.' },
            { weight: 1, value: 'You stand at the window. The world is out there, doing its thing. For a minute you\'re part of it, watching from the inside. Something close to peace.' },
            // High serotonin + NE — vivid and warm
            { weight: ctx.state.lerp01(ser, 55, 75) * ctx.state.lerp01(ne, 40, 60), value: 'The light is good today. You notice the color of the sky, the way shadows fall on the building opposite, a bird sitting on a wire. Small things, all of them clear, all of them enough. You stay at the window longer than you meant to.' },
            // Rain lover during drizzle — rain on glass
            { weight: weather === 'drizzle' && rc > 0 ? rc : 0, value: 'Rain on the glass. You stand at the window and watch it run in lines down the pane. The sound of it — steady, close, the whole world softened by water. Something in you settles. You stay.' },
            // Weather comfort — the weather itself lands
            { weight: weatherComfort > 0 ? weatherComfort * 0.7 : 0, value: 'You look out and the weather is right. Not dramatically — just quietly right, the way only your kind of weather can be. The sky, the light, the feel of the air through the cracked window. You stand there and let it reach you.' },
            // Snow — the light is different, everything cleaner
            { weight: weather === 'snow' ? 1.5 : 0, value: 'Snow out there, and the light is different — whiter, cleaner, the world lit from below. You press close to the glass to see more of it. Something about the particular quiet of snow feels like a gift today.' },
          ]);
        }
        // flat
        ctx.state.adjustStress(-1);
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You look out. The usual view. It\'s something to look at that isn\'t the room.' },
          { weight: 1, value: 'The window. Outside. Not much happening, but you look for a while anyway.' },
          { weight: 1, value: 'You watch the street for a few minutes. Nothing in particular. It passes the time.' },
          // High adenosine — the view is soft
          { weight: ctx.state.lerp01(aden, 50, 75) * ctx.state.adenosineBlock(), value: 'You look out. The view is there but soft — edges blurred, details optional. You watch without really watching. The tiredness makes it all a little far away.' },
          // Rain lover during drizzle — rain on glass
          { weight: weather === 'drizzle' && rc > 0 ? rc * 0.7 : 0, value: 'You look out. The rain runs down the glass in slow lines. The sound of it is something you don\'t have a word for, just a feeling. You watch.' },
          // Snow — the view is the same but different
          { weight: weather === 'snow' ? 1.5 : 0, value: 'Snow. The view is the same — same street, same buildings — but everything\'s white now, quieter. You look at it for a while. It\'s something.' },
        ]);
      },
    },

    make_bed: {
      id: 'make_bed',
      label: 'Make the bed',
      location: 'apartment_bedroom',
      available: () => ctx.linens.bedState() !== 'made' && ctx.state.energyTier() !== 'depleted',
      execute: () => {
        ctx.linens.makeBed();
        ctx.state.set('last_surfaced_mess_tier', null);  // reset so next tier change is noticed
        ctx.state.adjustEnergy(-3);
        ctx.state.adjustStress(-2);
        ctx.state.advanceTime(5);

        const mood = ctx.state.moodTone();
        const ser = ctx.state.get('serotonin');
        const dopa = ctx.state.get('dopamine');

        if (mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You pull the sheets straight. Tuck the corners. Smooth the surface. The bed is made. You don\'t feel any different.' },
            { weight: 1, value: 'The motions of making a bed. You do them. It\'s done.' },
            { weight: ctx.state.lerp01(dopa, 40, 20), value: 'Sheets. Pillow. Done. You stand there looking at it. Nothing catches.' },
          ]);
        }
        if (mood === 'heavy') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You straighten the sheets, tuck the pillow back where it belongs. The room looks a little more like someone lives here intentionally. You\'re not sure that\'s a comfort.' },
            { weight: 1, value: 'You make the bed. One thing done. One thing that will stay done until you sleep in it again.' },
            { weight: ctx.state.lerp01(ser, 35, 20), value: 'You make the bed without knowing why. The bed doesn\'t care. The room doesn\'t look better, not really. But you made it.' },
          ]);
        }
        if (mood === 'fraying') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You make the bed. Smooth the cover, straighten the pillow. One small thing you can actually do. It helps, a little.' },
            { weight: 1, value: 'The bed. You pull it straight. One corner, then the next. The room looks slightly less like evidence. That\'s something.' },
            { weight: ctx.state.lerp01(ser, 40, 55), value: 'You make the bed. It takes three minutes and when you\'re done the room feels fractionally more like a place you meant to be in.' },
          ]);
        }
        if (mood === 'clear' || mood === 'present') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You make the bed — sheets pulled taut, pillow back where it belongs. The room settles. Small but real.' },
            { weight: 1, value: 'Quick and deliberate. Sheets, blanket, pillow. The bed is made. Something in the day clicks slightly into place.' },
            { weight: ctx.state.lerp01(ser, 55, 75), value: 'You make the bed without thinking too hard about it. When you\'re done the room looks right, the kind of right that carries.' },
          ]);
        }
        // flat / hollow / quiet
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You make the bed. Straighten the sheets, fix the pillow. The room looks more like a room now.' },
          { weight: 1, value: 'Sheets pulled straight, cover smoothed. The bed\'s made. You move on.' },
          { weight: ctx.state.lerp01(dopa, 50, 30), value: 'The bed. You straighten it. The kind of small thing that\'s easy to skip and easy to do and makes no large difference either way.' },
        ]);
      },
    },

    start_laundry: {
      id: 'start_laundry',
      label: 'Start a load of laundry',
      location: 'apartment_bedroom',
      available: () => ctx.clothing.dirtyCount() > 5
        && ctx.state.get('laundry_phase') === 'none'
        && ctx.state.energyTier() !== 'depleted',
      execute: () => {
        ctx.state.set('laundry_phase', 'washing');
        ctx.state.set('laundry_phase_started', ctx.state.get('time'));
        ctx.state.adjustEnergy(-3);
        ctx.state.advanceTime(5);

        const mood = ctx.state.moodTone();
        if (mood === 'numb' || mood === 'heavy') {
          return 'You gather the dirty clothes and load the washer. It starts up. You have about half an hour before you need to think about it again.';
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You load the washer and start it. Thirty-five minutes and you\'ll need to move it to the dryer. Until then it\'s not your problem.' },
          { weight: 1, value: 'Laundry in, machine started. The pile is someone else\'s problem for the next half hour.' },
        ]);
      },
    },

    move_to_dryer: {
      id: 'move_to_dryer',
      label: 'Move laundry to dryer',
      location: 'apartment_bedroom',
      available: () => ctx.state.get('laundry_phase') === 'washing'
        && (ctx.state.get('time') - ctx.state.get('laundry_phase_started')) >= 35,
      execute: () => {
        ctx.state.set('laundry_phase', 'drying');
        ctx.state.set('laundry_phase_started', ctx.state.get('time'));
        ctx.state.adjustEnergy(-2);
        ctx.state.advanceTime(5);

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You move the wet clothes to the dryer, start it. Forty-five minutes. Go.' },
          { weight: 1, value: 'Washer done, dryer started. Now you wait again.' },
          { weight: 1, value: 'Wet clothes into the dryer. It starts its tumble. Another forty-five minutes.' },
        ]);
      },
    },

    fold_laundry: {
      id: 'fold_laundry',
      label: 'Fold and put away laundry',
      location: 'apartment_bedroom',
      available: () => ctx.state.get('laundry_phase') === 'drying'
        && (ctx.state.get('time') - ctx.state.get('laundry_phase_started')) >= 45,
      execute: () => {
        ctx.clothing.wash();
        ctx.state.set('laundry_phase', 'none');
        ctx.state.adjustEnergy(-5);
        ctx.state.adjustStress(-3);
        ctx.state.advanceTime(10);
        ctx.events.record('did_laundry');

        const mood = ctx.state.moodTone();
        const ser = ctx.state.get('serotonin');

        if (mood === 'numb' || mood === 'heavy') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You fold everything and put it away. The drawer isn\'t empty anymore. That\'s something.' },
            { weight: 1, value: 'Folded, stacked, put away. The pile is gone. It\'ll be back. For now it\'s gone.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You fold and put everything away. Clean clothes in the drawer, the pile gone. One less thing.' },
          { weight: 1, value: 'Laundry folded and away. The room looks intentional again. Small thing, but real.' },
          { weight: ctx.state.lerp01(ser, 50, 70), value: 'You fold everything — actually fold it, put it away in the right places. The drawer is full again. Something in you settles when you close it.' },
        ]);
      },
    },

    tidy_clothes: {
      id: 'tidy_clothes',
      label: 'Pick up the clothes',
      location: 'apartment_bedroom',
      available: () => ctx.clothing.itemsOnFloor('bedroom').length > 0 && ctx.state.energyTier() !== 'depleted',
      execute: () => {
        ctx.clothing.moveToBasket('bedroom');
        ctx.state.set('last_surfaced_mess_tier', null);  // reset so next tier change is noticed
        ctx.state.adjustEnergy(-4);
        ctx.state.advanceTime(5);

        const mood = ctx.state.moodTone();
        const ser = ctx.state.get('serotonin');

        if (mood === 'numb' || mood === 'heavy') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You pick the clothes up off the floor. Move them to the basket. The floor is a floor again. You don\'t feel anything about it.' },
            { weight: 1, value: 'The clothes from the floor into the basket. One task. Done.' },
            { weight: ctx.state.lerp01(ser, 35, 20), value: 'You gather the clothes from the floor. It takes less time than you thought it would. The room looks different after. You\'re not sure what to do with that.' },
          ]);
        }
        if (mood === 'fraying') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You gather the clothes from the floor. Something about the physical task steadies you — the motion of it, the before and after. One small thing actually done.' },
            { weight: 1, value: 'The floor clothes into the basket. The room looks less accidental. You needed something to be less accidental.' },
          ]);
        }
        if (mood === 'clear' || mood === 'present') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You scoop the clothes off the floor and drop them in the basket. Takes thirty seconds. The bedroom is a room you meant to live in again.' },
            { weight: 1, value: 'Floor to basket. The room is visibly better. Thirty seconds of actual improvement.' },
          ]);
        }
        // flat / hollow / quiet
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You pick the clothes up. Floor to basket. The room looks a little less like something gave up in here.' },
          { weight: 1, value: 'You deal with the clothes on the floor. It\'s a thing to do. Now it\'s done.' },
          { weight: ctx.state.lerp01(ser, 40, 60), value: 'Clothes off the floor, into the basket. The room has its floor back. Small thing, but the small things count.' },
        ]);
      },
    },

    // === KITCHEN ===
    eat_food: {
      id: 'eat_food',
      label: 'Eat something',
      location: 'apartment_kitchen',
      available: () => ctx.state.fridgeTier() !== 'empty',
      execute: () => {
        ctx.state.set('fridge_food', ctx.state.get('fridge_food') - 1);
        ctx.dishes.use();
        ctx.state.adjustHunger(-35);
        ctx.state.fillStomach(60, 'solid');
        ctx.state.set('ate_today', true);
        ctx.state.set('consecutive_meals_skipped', 0);
        ctx.state.advanceTime(15);
        ctx.events.record('ate', { what: 'fridge_food' });

        // Dental — chewing spikes the ache
        ctx.state.dentalSpike(15); // Approximation debt: 15pt chewing spike chosen
        // Food comfort sentiment — small serotonin nudge + habituation
        const fc = ctx.state.sentimentIntensity('eating', 'comfort');
        if (fc > 0) {
          ctx.state.adjustNT('serotonin', fc * 3);
          ctx.state.adjustSentiment('eating', 'comfort', -0.003);
        }

        const hunger = ctx.state.hungerTier();
        const mood = ctx.state.moodTone();
        const ser = ctx.state.get('serotonin');
        const aden = ctx.state.get('adenosine');
        const dopa = ctx.state.get('dopamine');
        const fridgeNow = ctx.state.fridgeTier(); // checked AFTER decrement
        const dentalAche = ctx.state.get('dental_ache');
        const dentalW = ctx.state.lerp01(dentalAche, 20, 65); // 0 at dull, 1 at flare

        // Dental flare — the tooth competes with eating
        if (dentalAche >= 60) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You eat carefully, keeping to one side. It still hurts. The food is fine but the tooth has opinions about all of it.' },
            { weight: 1, value: 'You eat. Slowly, on one side, watching yourself. It helps a little. The tooth registers the effort regardless.' },
            { weight: ctx.state.lerp01(ser, 50, 20), value: 'You eat carefully and the tooth makes its presence known anyway. At some point you\'re going to have to deal with it. You know that. You know that.' },
          ]);
        }

        if (mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You eat. It goes in. You don\'t taste much of it, but your body takes it without complaint.' },
            { weight: 1, value: 'Food. You put it together, put it in. The motions of eating without the experience of it.' },
            // Low dopamine — eating is mechanical
            { weight: ctx.state.lerp01(dopa, 40, 15), value: 'You eat because the body requires it. Fork to mouth, chew, swallow. The flavors are there, technically. They don\'t reach you.' },
          ]);
        }
        if (hunger === 'starving' || hunger === 'very_hungry') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You eat too fast. Standing at the counter, not even sitting down. It helps. It helps a lot, actually.' },
            { weight: 1, value: 'You eat standing up, barely tasting it. Your body was louder than you realized. The relief is immediate and physical.' },
            // High food comfort — the eating itself is a release
            { weight: fc > 0 ? fc : 0, value: 'You eat too fast and it doesn\'t matter — the warmth of it, the taste, the simple animal fact of being fed. Something unwinds. Your body thanks you the only way it knows how.' },
            // Dental — eating when hungry and tooth hurts
            { weight: dentalW * 1.5, value: 'You eat too fast and the tooth makes you pay for it. You slow down. The hunger is still there, insistent. You eat carefully the rest of the way.' },
          ]);
        }
        // Last item eaten — fridge is now empty
        if (fridgeNow === 'empty') {
          const hasPantry = ctx.state.pantryTier() !== 'empty';
          if (hasPantry) {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You eat the last thing in the fridge. The fridge is empty now. There\'s still something in the cupboard.' },
              { weight: ctx.state.lerp01(ser, 40, 20), value: 'You eat what was left. The fridge is empty now. At least there\'s still something in the cupboard.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You eat the last thing in the fridge. Standing at the counter. The shelf is empty now. That\'s a thing you\'ll have to deal with.' },
            { weight: 1, value: 'The last of it. You eat quickly, not because you\'re hurrying but because now you\'re aware of it being the last. The fridge is empty after this.' },
            // Low serotonin — the empty fridge lands heavier
            { weight: ctx.state.lerp01(ser, 40, 20), value: 'You eat what was left. It was the last of it. The fridge is empty now. One more thing added to the list of what needs doing, when you have the capacity to do it.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You put something together from what\'s there and eat it. Nothing special. It\'s enough.' },
          { weight: 1, value: 'Something from the fridge. You eat it at the counter. It\'s food. It does the job.' },
          // High food comfort — eating is a small pleasure
          { weight: fc > 0 ? fc : 0, value: 'You make something simple from what\'s there and eat it slowly. The warmth of it, the familiar taste. A small comfort, but a real one.' },
          // High adenosine (unblocked) — eating through fog
          { weight: ctx.state.lerp01(aden, 55, 75) * ctx.state.adenosineBlock(), value: 'You eat something. Standing at the counter, half-awake, chewing without really tasting. The food goes in. Your body processes it somewhere behind the fog.' },
          // Dental ache — eating carefully
          { weight: dentalW, value: 'You eat on one side, the way you\'ve been doing. The food is fine. The tooth is not fine. Those are separate problems.' },
        ]);
      },
    },

    eat_from_pantry: {
      id: 'eat_from_pantry',
      label: 'Find something in the cupboard',
      location: 'apartment_kitchen',
      available: () => ctx.state.fridgeTier() === 'empty' && ctx.state.pantryTier() !== 'empty',
      execute: () => {
        ctx.state.set('pantry_food', ctx.state.get('pantry_food') - 1);
        ctx.dishes.use();
        ctx.state.adjustHunger(-20);
        ctx.state.fillStomach(35, 'solid');
        ctx.state.set('ate_today', true);
        ctx.state.set('consecutive_meals_skipped', 0);
        ctx.state.advanceTime(10);
        ctx.events.record('ate', { what: 'pantry_food' });

        // Dental — chewing spikes the ache
        ctx.state.dentalSpike(15); // Approximation debt: 15pt chewing spike chosen

        const mood = ctx.state.moodTone();
        const hunger = ctx.state.hungerTier();
        const pantryNow = ctx.state.pantryTier();
        const ser = ctx.state.get('serotonin');
        const aden = ctx.state.get('adenosine');
        const dentalW = ctx.state.lerp01(ctx.state.get('dental_ache'), 20, 65);

        const lastLine = pantryNow === 'empty'
          ? ' That\'s the last of it.'
          : '';

        if (hunger === 'starving' || hunger === 'very_hungry') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: `You find something at the back of the cupboard and eat it fast. It's not much.${lastLine}` },
            { weight: ctx.state.lerp01(ser, 50, 20), value: `Ramen, or crackers, or whatever was back there. You eat it standing up. Your body stops making its case, a little.${lastLine}` },
            { weight: dentalW, value: `You find something and eat it carefully. The tooth makes it harder. The hunger doesn't care.${lastLine}` },
          ]);
        }
        if (mood === 'numb' || mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: `You find something in the cupboard. You eat it without much thought. It goes in.${lastLine}` },
            { weight: ctx.state.lerp01(aden, 50, 75) * ctx.state.adenosineBlock(), value: `Something from the back of the cupboard. You make it and eat it and that's about all there is to say about it.${lastLine}` },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: `You go through the cupboard and find something. Not exciting, but it's food.${lastLine}` },
          { weight: 1, value: `There's something at the back of the cupboard. Shelf-stable, sitting there for exactly this kind of day.${lastLine}` },
          { weight: ctx.state.lerp01(ser, 60, 35), value: `You eat whatever was in the cupboard. It's the kind of meal you don't mention to anyone.${lastLine}` },
          // Dental — eating carefully from the cupboard
          { weight: dentalW * 0.8, value: `You find something soft enough in the cupboard. That's the criteria now. Soft enough.${lastLine}` },
        ]);
      },
    },

    drink_water: {
      id: 'drink_water',
      label: 'Glass of water',
      location: 'apartment_kitchen',
      available: () => true,
      execute: () => {
        ctx.state.adjustEnergy(2);
        ctx.state.adjustHunger(-3);
        ctx.state.addPendingHydration(250); // ~250ml glass — absorbs over ~20 min
        ctx.state.fillStomach(8, 'liquid');
        ctx.state.advanceTime(2);

        // NT deterministic variants (no RNG — replay-safe)
        const energy = ctx.state.energyTier();
        const aden = ctx.state.get('adenosine');
        const mood = ctx.state.moodTone();
        const hunger = ctx.state.hungerTier();
        const thirst = ctx.state.thirstTier();
        const fridge = ctx.state.fridgeTier();

        // Very thirsty — the body notice is the point
        if (thirst === 'quenched' && (mood === 'numb' || mood === 'heavy')) {
          return 'You drink a glass of water. You didn\'t realize how much you needed it until it was gone.';
        }

        // Drinking water because there's nothing to eat — specific texture
        if (fridge === 'empty' && (hunger === 'very_hungry' || hunger === 'starving')) {
          return 'You drink a glass of water. It isn\'t what your body wants. It takes the edge off, slightly, for now.';
        }
        if (fridge === 'empty' && hunger === 'hungry') {
          return 'You fill a glass and drink it. There\'s nothing in the fridge. This will have to do for now.';
        }

        if (energy === 'depleted' || energy === 'exhausted') {
          return 'Water from the tap. You drink it standing at the sink. Your body wanted it more than you realized.';
        }
        if (aden > 60 && ctx.state.adenosineBlock() > 0.4 && (mood === 'numb' || mood === 'heavy')) {
          return 'Water. Something your body can process without much thought from you.';
        }
        return 'You fill a glass and drink it. Tap water. It\'s fine.';
      },
    },

    make_coffee: {
      id: 'make_coffee',
      label: 'Make coffee',
      location: 'apartment_kitchen',
      available: () => ctx.state.caffeineTier() !== 'high',
      execute: () => {
        ctx.state.consumeCaffeine(50);
        ctx.state.addPendingHydration(220); // ~240ml mug — absorbs over ~20 min; net positive despite mild diuresis (Armstrong 2002 PMID 12187535)
        ctx.state.advanceTime(ctx.timeline.randomInt(5, 8));

        // Dental — hot liquid is a significant trigger
        ctx.state.dentalSpike(25); // Approximation debt: 25pt hot liquid spike chosen

        const mood = ctx.state.moodTone();
        const aden = ctx.state.get('adenosine');
        const caffeine = ctx.state.caffeineTier();
        const withdrawal = ctx.state.withdrawalTier();
        const dentalAche = ctx.state.get('dental_ache');
        const dentalW = ctx.state.lerp01(dentalAche, 25, 70);

        // Dental flare from hot coffee
        if (dentalAche >= 60) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The coffee is too hot for the tooth. You knew it would be. You hold it to the other side anyway. This is your life now.' },
            { weight: 1, value: 'First sip hits the tooth and the tooth objects loudly. You breathe through it. Drink on the left side. Or the right side. Whichever one isn\'t the problem.' },
            { weight: ctx.state.lerp01(ctx.state.get('serotonin'), 50, 20), value: 'You make coffee and the coffee does what it always does to the tooth. You drink it anyway. It\'s not like there\'s a better option.' },
          ]);
        }

        // Second cup — already caffeinated
        if (caffeine === 'active') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The second one. The first one wore off faster than it should have.' },
            { weight: ctx.state.lerp01(aden, 40, 80), value: 'You weren\'t done needing it yet. The second cup goes down the same way as the first.' },
          ]);
        }

        // Withdrawal relief — the headache was building
        if (withdrawal === 'moderate' || withdrawal === 'severe') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You make coffee. The headache has been sitting behind your eyes all morning. You wait for it to start clearing. It takes a few minutes. Then it does.' },
            { weight: 1, value: 'The coffee is ready. You drink it standing at the counter. The pressure behind your eyes starts to ease — you hadn\'t realized how much it was there until it wasn\'t.' },
            { weight: withdrawal === 'severe' ? 2 : 1, value: 'You needed this an hour ago. The headache has been building since you woke up — not loud enough to stop you, just loud enough to make everything harder. First sip. Second. Something shifts.' },
          ]);
        }

        // First cup of the day
        if (mood === 'numb' || mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You make coffee. Something to do with your hands. The smell is better than it usually is.' },
            { weight: ctx.state.lerp01(aden, 40, 80), value: 'Coffee. Your brain needs something to hold onto. The warmth helps, a little.' },
          ]);
        }
        if (mood === 'heavy' || mood === 'fraying') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Coffee. You need the ritual as much as the caffeine. The kettle, the wait, the first sip.' },
            { weight: ctx.state.lerp01(aden, 50, 85) * ctx.state.adenosineBlock(), value: 'You\'re dragging. The coffee is supposed to help with that.' },
            // Dental ache from hot coffee
            { weight: dentalW, value: 'You make coffee and drink it carefully on one side. The tooth is already watching. The caffeine is worth the negotiation.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You make coffee. The machine goes through its routine. You go through yours.' },
          { weight: ctx.state.lerp01(aden, 30, 70) * ctx.state.adenosineBlock(), value: 'You make coffee. It\'s early enough that it feels necessary.' },
          { weight: ctx.state.lerp01(ctx.state.get('serotonin'), 50, 80), value: 'Coffee. The smell fills the kitchen before it\'s even done.' },
          // Dental — hot coffee wakes the tooth up
          { weight: dentalW * 0.8, value: 'You make coffee. The first sip touches the tooth. You wait a moment, then continue. It\'s just a thing that happens now.' },
        ]);
      },
    },

    do_dishes: {
      id: 'do_dishes',
      label: 'Deal with the dishes',
      location: 'apartment_kitchen',
      available: () => ctx.dishes.dirtyCount() > 0 && ctx.state.energyTier() !== 'depleted',
      execute: () => {
        ctx.dishes.wash();
        ctx.state.set('last_surfaced_mess_tier', null);  // reset so next tier change is noticed
        ctx.state.adjustEnergy(-8);
        ctx.state.adjustStress(-5);
        ctx.state.advanceTime(15);

        const mood = ctx.state.moodTone();
        const sinkClear = ctx.dishes.dirtyCount() === 0;
        const aden = ctx.state.get('adenosine');

        if (sinkClear) {
          // Sink is now empty
          if (mood === 'heavy' || mood === 'numb') {
            return 'You wash dishes. The warm water helps more than it should. When you dry your hands, the sink is empty. The counter has its surface back. One thing, at least, dealt with.';
          }
          return 'Warm water, soap, the rhythm of it. When you\'re done the sink is empty, the counter clear. The kitchen looks like someone lives here on purpose.';
        }
        if (mood === 'heavy' || mood === 'numb') {
          return 'You wash dishes. The warm water is the closest thing to comfort available right now. One thing, at least, is done.';
        }
        if (aden > 65 && ctx.state.adenosineBlock() > 0.4) {
          return 'Your hands know what to do without you deciding anything. Hot water, soap, the stack going down. When it\'s over you\'re not sure how long it took.';
        }
        return 'You wash the dishes. Warm water, soap, the repetition of it. The kitchen looks a little more like someone lives here on purpose.';
      },
    },

    check_phone_kitchen: {
      id: 'check_phone_kitchen',
      label: 'Check your phone',
      location: 'apartment_kitchen',
      available: () => ctx.state.get('has_phone') && ctx.state.get('phone_battery') > 0 && !ctx.state.get('viewing_phone'),
      execute: () => {
        ctx.state.set('viewing_phone', true);
        ctx.state.advanceTime(1);
        ctx.events.record('checked_phone');
        return phoneScreenDescription();
      },
    },

    sit_at_table: {
      id: 'sit_at_table',
      label: 'Sit at the table',
      location: 'apartment_kitchen',
      available: () => true,
      execute: () => {
        const mood = ctx.state.moodTone();
        const minutes = ctx.timeline.randomInt(5, 15);
        ctx.state.advanceTime(minutes);

        // Quiet sentiment — the kitchen is a quiet space + habituation
        const qc = ctx.state.sentimentIntensity('quiet', 'comfort');
        const qi = ctx.state.sentimentIntensity('quiet', 'irritation');
        if (qc > 0) {
          ctx.state.adjustNT('serotonin', qc * 2);
          ctx.state.adjustSentiment('quiet', 'comfort', -0.002);
        }
        if (qi > 0) {
          ctx.state.adjustNT('norepinephrine', qi * 2);
          ctx.state.adjustSentiment('quiet', 'irritation', -0.001);
        }

        // NT values for continuous prose shading
        const ser = ctx.state.get('serotonin');
        const ne = ctx.state.get('norepinephrine');
        const dopa = ctx.state.get('dopamine');
        const gaba = ctx.state.get('gaba');
        const aden = ctx.state.get('adenosine');

        if (mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit at the table. The surface is cool under your hands. You sit there. That\'s it.' },
            { weight: 1, value: 'The kitchen table. You\'re at it. The fridge hums. Minutes pass. You don\'t move.' },
            { weight: 1, value: 'Sitting. The table, the chair, the quiet kitchen. You\'re here. That\'s the whole event.' },
            // Low dopamine — nothing to reach for
            { weight: ctx.state.lerp01(dopa, 40, 15), value: 'You sit at the table. Your hands are on the surface. You could get up. You could do something. The thought arrives and lies there, flat, like everything else.' },
          ]);
        }
        if (mood === 'heavy') {
          ctx.state.adjustEnergy(1);
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit. The chair takes your weight. Not standing is something. Not much, but something.' },
            { weight: 1, value: 'The kitchen table. You put your arms on it and lean forward. The not-standing helps. Your body is grateful for small mercies.' },
            { weight: 1, value: 'You sit down. The effort of being upright transfers to the chair. Your back says thank you in its own way.' },
            // Low serotonin — sitting doesn't ease the weight
            { weight: ctx.state.lerp01(ser, 35, 15), value: 'You sit. The chair holds you. You put your head on the table and the cool surface is the only good thing. You stay like that for a while, folded over, not resting.' },
          ]);
        }
        if (mood === 'fraying') {
          ctx.state.adjustStress(-1);
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit at the table. The kitchen is quieter than the rest of your head. Barely, but it\'s something.' },
            { weight: 1, value: 'The table. Your hands on it. The solidity of a flat surface. The fridge hum. For a minute the noise inside dims, slightly.' },
            { weight: 1, value: 'You sit. The kitchen has a specific quiet — the fridge, the clock, the tap. It\'s not peaceful. But it\'s not loud.' },
            // Low GABA — can't settle even sitting
            { weight: ctx.state.lerp01(gaba, 40, 20), value: 'You sit but your leg bounces. Your fingers drum the table. The kitchen is quiet and the quiet makes room for the thing that won\'t stop running in your chest.' },
            // Quiet irritation — the silence is wrong
            { weight: qi > 0 ? qi * 0.8 : 0, value: 'You sit at the table and the quiet presses in. The fridge hum. The clock. The specific silence of a room with nobody in it. Your skin prickles. You need noise, or movement, or something.' },
          ]);
        }
        if (mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit at the kitchen table. The chair. The surface. The quiet. You\'re sitting because you walked in here and this is what\'s here.' },
            { weight: 1, value: 'The table. You sit at it. Not eating, not doing anything. Just occupying a chair in a room where chairs exist.' },
            { weight: 1, value: 'You sit. The kitchen is empty in the way it always is. You\'re in it. The clock ticks, or doesn\'t. Hard to tell.' },
            // High adenosine — the sitting is heavy
            { weight: ctx.state.lerp01(aden, 50, 75) * ctx.state.adenosineBlock(), value: 'You sit down and your body thanks you by getting heavier. The table is a surface to put your arms on. Your eyelids are interested in closing. The kitchen hums around you, distant.' },
          ]);
        }
        if (mood === 'clear' || mood === 'present') {
          ctx.state.adjustStress(-2);
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit at the table. The kitchen is quiet. Your hands are warm. Something close to comfort — the kind you don\'t notice until you\'re in it.' },
            { weight: 1, value: 'The kitchen table. The light from the window. You sit and it\'s fine — actually fine, not the word you say when nothing is. Just sitting, in a room, and it\'s okay.' },
            { weight: 1, value: 'You sit. The apartment is still. The fridge hums its one note. For a few minutes, that\'s all there is, and that\'s enough.' },
            // Higher serotonin — warmth settles in
            { weight: ctx.state.lerp01(ser, 55, 75), value: 'You sit at the table and the kitchen holds you. The light, the quiet, the smell of the place you live. Your hands are warm. Your chest is easy. You stay because staying feels like the right thing.' },
            // Quiet comfort — the silence is the point
            { weight: qc > 0 ? qc : 0, value: 'You sit at the table and the quiet is perfect. Not empty — full of small things. The fridge, the light, the particular stillness of a room you\'re alone in. Something in you expands into the silence. You needed this.' },
          ]);
        }
        // flat / quiet
        ctx.state.adjustStress(-1);
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You sit at the table for a while. Not doing anything. The kitchen is the kitchen. Time passes.' },
          { weight: 1, value: 'The table. You sit at it. The microwave clock changes. That\'s the most interesting thing that happens.' },
          { weight: 1, value: 'You sit. It\'s not productive, it\'s not restful, it\'s just sitting in a kitchen. Sometimes that\'s what there is.' },
          // High NE — aware of every small sound
          { weight: ctx.state.lerp01(ne, 45, 65), value: 'You sit at the table. The fridge cycles on. A pipe ticks somewhere in the wall. Your body is still but your ears are busy — cataloguing the kitchen\'s small noises like they matter.' },
          // Quiet irritation — the stillness is wrong
          { weight: qi > 0 ? qi * 0.5 : 0, value: 'You sit at the table. The quiet is too much. You tap your fingers, shift in the chair. The kitchen hums its one note and you wish it would hum a different one.' },
        ]);
      },
    },

    // === BATHROOM ===
    shower: {
      id: 'shower',
      label: 'Take a shower',
      location: 'apartment_bathroom',
      available: () => !ctx.state.get('showered') && ctx.state.energyTier() !== 'depleted',
      execute: () => {
        ctx.state.set('showered', true);
        ctx.linens.useTowel();
        ctx.state.adjustEnergy(-3);
        ctx.state.adjustStress(-8);
        ctx.state.advanceTime(15);
        ctx.events.record('showered');

        // Warmth comfort sentiment — extra stress relief + habituation
        const wc = ctx.state.sentimentIntensity('warmth', 'comfort');
        if (wc > 0) {
          ctx.state.adjustStress(-wc * 3);
          ctx.state.adjustSentiment('warmth', 'comfort', -0.002);
        }

        const mood = ctx.state.moodTone();
        const energy = ctx.state.energyTier();

        if (mood === 'numb' || mood === 'heavy') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The water is warm. You stand in it longer than you need to. The world outside the shower curtain can wait.' },
            { weight: 1, value: 'Hot water. You stand under it. The steam fills the small room. For a few minutes, the world is just this.' },
            // High warmth comfort — the heat is an anchor
            { weight: wc > 0 ? wc : 0, value: 'The water is hot and you stand in it and the heat is the only good thing. It seeps through the skin to wherever the cold lives. You stay until the room is all steam and your fingers are wrinkled and the world outside is someone else\'s problem.' },
          ]);
        }
        if (energy === 'tired' || energy === 'exhausted') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Hot water. It doesn\'t fix anything but it makes the surface of things bearable. You get out when it starts going cold.' },
            { weight: 1, value: 'The shower runs hot and you lean into it. Your body is tired enough to just stand there and let the water do something.' },
            // High warmth comfort — the heat reaches the exhaustion
            { weight: wc > 0 ? wc : 0, value: 'The hot water hits your shoulders and something lets go. Not everything — but the layer closest to the surface. The warmth finds the tired places. You stay longer than you should.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A shower. Hot water, steam, the sound of it. You feel more like a person when you step out.' },
          { weight: 1, value: 'You shower. The water is hot, the bathroom fills with steam. When you step out, you\'re clean. That\'s something.' },
          // High warmth comfort — the hot water is an old friend
          { weight: wc > 0 ? wc : 0, value: 'The hot water is an old comfort. You stand in it past the point of clean, just for the heat, just for the sound. When you step out the mirror is fogged and your skin is flushed and something is a little easier than it was.' },
        ]);
      },
    },

    use_sink: {
      id: 'use_sink',
      label: 'Wash your face',
      location: 'apartment_bathroom',
      available: () => true,
      execute: () => {
        ctx.state.adjustEnergy(2);
        ctx.state.adjustStress(-2);
        ctx.state.advanceTime(3);

        // NT deterministic variants (no RNG — replay-safe)
        const mood = ctx.state.moodTone();
        const aden = ctx.state.get('adenosine');
        const ne = ctx.state.get('norepinephrine');
        const ser = ctx.state.get('serotonin');

        if (mood === 'numb' || mood === 'hollow') {
          return 'Cold water. You go through the motions. The face in the mirror is yours. You don\'t stay to look.';
        }
        if (aden > 70 && ctx.state.adenosineBlock() > 0.4) {
          return 'Cold water on your face. The shock of it is the point. You stand there dripping for a second, waiting to feel more awake.';
        }
        if (ne > 65) {
          return 'Water on your face. The cold is immediate, distinct. Your hands on the edges of the sink, grounded.';
        }
        if (ser < 35) {
          return 'Cold water. You look at yourself in the mirror. You look away before the looking becomes something.';
        }
        return 'Cold water on your face. You look at yourself in the mirror, briefly. You look away.';
      },
    },

    rehang_towel: {
      id: 'rehang_towel',
      label: 'Pick up the towel',
      location: 'apartment_bathroom',
      available: () => ctx.linens.towelState() === 'on_floor',
      execute: () => {
        ctx.linens.rehangTowel();
        ctx.state.advanceTime(1);

        const mood = ctx.state.moodTone();
        if (mood === 'numb' || mood === 'heavy') {
          return 'You pick up the towel. Hang it back up. One thing off the floor.';
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You pick up the towel and hang it back where it goes. The floor looks like a floor again.' },
          { weight: 1, value: 'The towel from the floor. You rehang it. Twenty seconds, done.' },
        ]);
      },
    },

    take_pain_reliever: {
      id: 'take_pain_reliever',
      label: 'Take something for the pain',
      location: 'apartment_bathroom',
      available: () => (ctx.state.hasCondition('migraines') && ctx.state.migraineTier() !== 'none')
                    || (ctx.state.hasCondition('dental_pain') && ctx.state.dentalTier() !== 'none'),
      execute: () => {
        const dentalTier = ctx.state.dentalTier();
        const migraineTier = ctx.state.migraineTier();

        // Dental — ibuprofen cuts ache by ~35 points; doesn't fix the underlying tooth
        if (dentalTier !== 'none') {
          ctx.state.dentalSpike(-35); // Approximation debt: -35pt relief chosen
        }
        // Migraine — pain reliever cuts intensity by ~35 points
        if (migraineTier !== 'none') {
          ctx.state.set('migraine_intensity', Math.max(0, ctx.state.get('migraine_intensity') - 35));
        }
        ctx.state.advanceTime(ctx.timeline.randomInt(3, 6));

        const mood = ctx.state.moodTone();

        // Dental-primary prose (when tooth is worse than or instead of migraine)
        if (dentalTier !== 'none' && (migraineTier === 'none' || ctx.state.get('dental_ache') > ctx.state.get('migraine_intensity'))) {
          const acheNow = ctx.state.get('dental_ache');
          if (acheNow < 20) {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You take ibuprofen and wait at the sink. The tooth quiets down — not gone, but livable. You know it\'ll be back.' },
              { weight: 1, value: 'The pill. You wash it down and run your tongue along the side of your mouth carefully. It\'ll help. For now.' },
            ]);
          }
          if (acheNow < 45) {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You take something for it and stand there waiting for it to work. The tooth is still there, doing its thing. The medication will argue with it, eventually.' },
              { weight: ctx.state.lerp01(mood === 'heavy' ? 80 : 40, 40, 20), value: 'Two pills and the tap. You probe the tooth with your tongue by instinct and immediately regret it. You wait for the ibuprofen to work.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You take ibuprofen with both hands on the sink and wait. The tooth is insistent. The pill will help. You just have to be still for a while.' },
            { weight: 1, value: 'Pills, water, the tile under your feet. The tooth is still going. It will keep going until the medication gets there. You wait.' },
            { weight: ctx.state.lerp01(ctx.state.get('serotonin'), 40, 20), value: 'You take the medication and lean against the sink. The tooth doesn\'t know it\'s supposed to stop. You know from experience that it will. You\'re not sure when.' },
          ]);
        }

        // Migraine-primary prose (original)
        const migraineTierNow = ctx.state.migraineTier();
        if (migraineTierNow === 'none') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The pill. You wash it down and wait. By the time you leave the bathroom the worst of it is already lifting.' },
            { weight: 1, value: 'You take two. The headache recedes — not gone, but manageable. You can think again.' },
          ]);
        }
        if (ctx.state.get('migraine_intensity') <= 20) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The medication is doing something. The throb is still there but the edge has come off it. You can tolerate light now.' },
            { weight: ctx.state.lerp01(ctx.state.get('migraine_intensity'), 20, 5), value: 'The headache is quieting. Not gone — never quite gone — but livable. You hold still for a minute, waiting to be sure.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You swallow it and stand at the sink. The headache doesn\'t respond immediately. It will. You\'ve done this before.' },
          { weight: 1, value: 'Two tablets and the tap. You lean against the sink and wait. The pill will work. You just have to be still for a while.' },
          { weight: ctx.state.lerp01(ctx.state.get('serotonin'), 40, 20), value: 'You take the medication in the dark. Light makes it worse. You close your eyes and wait for the pills to do something. They usually do. Eventually.' },
        ]);
      },
    },

    use_toilet_bathroom: {
      id: 'use_toilet_bathroom',
      label: 'Use toilet',
      location: 'apartment_bathroom',
      available: () => ['aware', 'urgent', 'pressing'].includes(ctx.state.bladderNeedTier()),
      execute: () => {
        const need = ctx.state.bladderNeedTier();
        ctx.state.voidBladder();
        ctx.state.adjustStress(-2);
        ctx.state.advanceTime(3);

        const aden = ctx.state.get('adenosine');
        const mood = ctx.state.moodTone();

        if (need === 'pressing') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The relief is physical and complete. Your body unclenching from something it had been holding without your full attention.' },
            { weight: ctx.state.lerp01('adenosine', 50, 80), value: 'Your body led you here. You stand at the sink afterward, hands under cool water.' },
            { weight: ctx.state.lerp01('serotonin', 40, 20), value: 'Something releases all at once. The relief is real in a way that feels disproportionate until it doesn\'t.' },
          ]);
        }
        if (need === 'urgent') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The relief is notable. A small thing sorted.' },
            { weight: ctx.state.lerp01('adenosine', 50, 80), value: 'You go. Your body gets what it needed. You wash your hands.' },
            { weight: (mood === 'heavy' || mood === 'hollow') ? 0.8 : 0, value: 'The brief pause of it. Your body doing the one thing it needed. Then back.' },
          ]);
        }
        // aware
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You go. The kind of thing you don\'t notice until it\'s done.' },
          { weight: ctx.state.lerp01('adenosine', 60, 90), value: 'Automatic. Hands under the water, then done.' },
          { weight: ctx.state.lerp01('serotonin', 40, 20), value: 'A small interruption. Your body asking for something, getting it.' },
        ]);
      },
    },

    // === STREET ===
    check_phone_street: {
      id: 'check_phone_street',
      label: 'Check your phone',
      location: 'street',
      available: () => ctx.state.get('has_phone') && ctx.state.get('phone_battery') > 0 && !ctx.state.get('viewing_phone'),
      execute: () => {
        ctx.state.set('viewing_phone', true);
        ctx.state.advanceTime(1);
        ctx.events.record('checked_phone');
        return phoneScreenDescription();
      },
    },

    sit_on_step: {
      id: 'sit_on_step',
      label: 'Sit on the step for a minute',
      location: 'street',
      available: () => ['depleted', 'exhausted', 'tired'].includes(ctx.state.energyTier()),
      execute: () => {
        ctx.state.adjustEnergy(3);
        ctx.state.advanceTime(ctx.timeline.randomInt(5, 12));

        const mood = ctx.state.moodTone();
        const weather = ctx.state.get('weather');

        if (weather === 'snow') {
          return 'You sit on the step. Cold through your clothes immediately. The street is muffled, quieted. You stay a minute anyway.';
        }
        if (weather === 'drizzle') {
          return 'You sit on the step under the awning. Rain taps the concrete. A few minutes. No one bothers you about it.';
        }
        if (mood === 'hollow' || mood === 'quiet') {
          return 'You sit. Watch people. They\'re all going places. You\'re sitting. Both of these things are fine.';
        }

        // NT deterministic shading (no RNG — replay-safe)
        const aden = ctx.state.get('adenosine');
        const ne = ctx.state.get('norepinephrine');
        if (aden > 65 && ctx.state.adenosineBlock() > 0.4) {
          return 'You sit down. Your body asked for this before the rest of you decided.';
        }
        if (ne > 65) {
          return 'You sit on the step. The street goes on around you — cars, footsteps, someone\'s music. A lot for a step.';
        }
        return 'You sit on the step. Just for a minute. The air is better than inside.';
      },
    },

    go_for_walk: {
      id: 'go_for_walk',
      label: 'Walk for a while',
      location: 'street',
      available: () => ctx.state.energyTier() !== 'depleted' && ctx.state.migraineTier() !== 'severe',
      execute: () => {
        const mood = ctx.state.moodTone();
        const weather = ctx.state.get('weather');
        const minutes = ctx.timeline.randomInt(15, 30);
        const energyCost = ctx.timeline.randomInt(5, 8);

        ctx.state.advanceTime(minutes);
        ctx.state.adjustEnergy(-energyCost);

        // Outside comfort sentiment — serotonin nudge + habituation
        const oc = ctx.state.sentimentIntensity('outside', 'comfort');
        if (oc > 0) {
          ctx.state.adjustNT('serotonin', oc * 2);
          ctx.state.adjustSentiment('outside', 'comfort', -0.002);
        }

        // NT values for continuous prose shading
        const ser = ctx.state.get('serotonin');
        const ne = ctx.state.get('norepinephrine');
        const dopa = ctx.state.get('dopamine');
        const gaba = ctx.state.get('gaba');
        const aden = ctx.state.get('adenosine');

        // Rain sound sentiment (for drizzle prose)
        const rc = ctx.state.sentimentIntensity('rain_sound', 'comfort');
        // Weather sentiment
        const weatherComfort = ctx.state.sentimentIntensity('weather_' + weather, 'comfort');

        // Weather modifier — drizzle and snow add discomfort
        if (weather === 'drizzle') {
          ctx.state.adjustStress(2);
        } else if (weather === 'snow') {
          ctx.state.adjustStress(3); // cold + wet + effort
        }

        // Stress effect depends on mood
        if (mood === 'clear' || mood === 'present') {
          ctx.state.adjustStress(-8);
          if (weather === 'drizzle') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You walk. The drizzle is cold on your face but the air is good. Your legs find a rhythm. The wet doesn\'t ruin it — just changes the texture.' },
              { weight: 1, value: 'Rain on your jacket. Your shoes get damp. But the walking helps — the movement, the air, the world being bigger than a room. It\'s worth it.' },
              // High NE — the rain is vivid
              { weight: ctx.state.lerp01(ne, 45, 65), value: 'The rain is on your face and you can feel every drop — distinct, cold, alive. Your feet on the wet pavement. The smell of it. The world in the rain is a specific, sharp thing, and you\'re in it.' },
              // Rain lover — the drizzle is welcome
              { weight: rc > 0 ? rc : 0, value: 'You walk in the rain and it\'s good. The sound of it on your jacket, the wet air, the way the street smells different. Something about rain has always been yours. You walk slower than you need to.' },
            ]);
          }
          if (weather === 'snow') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You walk in the snow. The street is quiet in a specific way. Your footprints behind you, new ones forming ahead. The cold is real but the air is clean and the world feels big and still.' },
              { weight: 1, value: 'Snow. Your feet find the cleared patches. The air has a bite to it but you\'re moving and the moving is good. The world under snow looks like a version of itself worth looking at.' },
              // High NE — the cold is vivid
              { weight: ctx.state.lerp01(ne, 45, 65), value: 'The cold is on your face and your breath comes out white. The snow muffles everything. Your footsteps, your breathing, the sound of the world. You\'re walking in a particular kind of quiet.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You walk. No destination, just movement. The air is different from inside — wider, cooler, real. Your thoughts spread out. Something loosens in your chest.' },
            { weight: 1, value: 'A walk. Around the block, then further because it feels good to keep going. Your legs know what to do. Your head quiets down. The world passes at a human speed.' },
            { weight: 1, value: 'You walk until the apartment feels far away. The sky, the street, the sound of your own footsteps. This is what outside is for.' },
            // High serotonin + dopamine — the walk is actually good
            { weight: ctx.state.lerp01(ser, 55, 75) * ctx.state.lerp01(dopa, 50, 70), value: 'You walk, and the walking is good. Not because anything is happening — just the rhythm, the air, the way your body knows how to do this. The street unfolds. The sky is big. You feel like a person in the world, and it\'s enough.' },
            // Outside lover — being out is the point
            { weight: oc > 0 ? oc : 0, value: 'You walk and the outside is enough. The air, the space, the sky that goes on without you. Your body knows this — the way it loosens, the way your breath comes easier. You needed out. This is out.' },
          ]);
        }
        if (mood === 'flat') {
          ctx.state.adjustStress(-4);
          if (weather === 'drizzle') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You walk in the drizzle. Your jacket darkens at the shoulders. The movement helps some — not a lot, but some. You come back damp.' },
              { weight: 1, value: 'Rain. You walk through it because you\'re already out. It\'s not pleasant but the walking itself does something. Slightly.' },
              // High adenosine (unblocked) — the walk is a slog
              { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: 'You walk in the rain and your legs are heavy. The dampness seeps into your shoes. Each block takes more than the last. The air helps, barely. You come back tired and wet.' },
              // Rain lover — the drizzle is okay
              { weight: rc > 0 ? rc * 0.7 : 0, value: 'You walk in the drizzle and it\'s fine, actually. The sound of rain on your hood. The wet streets. Not everyone likes this. You don\'t mind it.' },
            ]);
          }
          if (weather === 'snow') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You walk in the snow. It\'s an effort. Your shoes are damp by the third block. But the movement does something — something small — and the world under snow is at least a different version of itself.' },
              { weight: 1, value: 'Snow. You walk through it because walking is the thing you\'re doing. Each step leaves a mark. The cold is a fact you move through. You come back wetter than you went out.' },
              // High adenosine (unblocked) — the cold and the drag compound
              { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: 'You walk in the snow and your body is doing its best. Heavy legs, cold feet, the kind of tired that makes snow feel like sand. You do it anyway. That\'s the whole story.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You walk. It\'s not transformative. But the air is different and your legs are moving and that\'s better than not.' },
            { weight: 1, value: 'A walk. The neighborhood. You\'ve seen it before. But moving through it is different from being inside looking at walls. It helps, some.' },
            { weight: 1, value: 'You walk for a while. It doesn\'t fix anything. But the blood moves and the air gets in and when you stop you feel slightly less like you were cemented to the floor.' },
            // Higher NE — details register more than usual
            { weight: ctx.state.lerp01(ne, 40, 60), value: 'You walk. You notice things — the crack in the sidewalk, the color of someone\'s door, a sound from a window. Details that don\'t matter but your brain collects them anyway, like it needed something to do.' },
          ]);
        }
        if (mood === 'heavy') {
          ctx.state.adjustStress(-2);
          if (weather === 'drizzle') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You walk in the rain. Every step costs something. The wet gets into your shoes. But the air — the air is different from inside. That\'s something.' },
              { weight: 1, value: 'Drizzle. You walk through it slowly. The world is grey and wet and you\'re in it. The effort is real. So is the fact that you went outside.' },
              // Low serotonin — the effort is almost too much
              { weight: ctx.state.lerp01(ser, 35, 15), value: 'You walk in the rain and every step asks why. The wet, the cold, the weight of your own legs. You did this to yourself. You chose outside. It\'s unclear what it was supposed to fix.' },
            ]);
          }
          if (weather === 'snow') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You walk in the snow. Everything is muffled — the world, the sounds, the sharp edges of things. Your footsteps are the loudest thing. You keep going because turning back is a different kind of effort.' },
              { weight: 1, value: 'Snow. You walk through it slowly. The cold cuts in. Each step is deliberate. You went outside. The snow makes that feel more true than usual.' },
              // Low serotonin + snow = weight of the world
              { weight: ctx.state.lerp01(ser, 35, 15), value: 'You walk in the snow and the cold and the weight of it all compound. Your legs are doing the work while the rest of you follows. It doesn\'t help. But you\'re outside, which is different from not being outside.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You walk. Slowly. The effort of being outside is real — the bodies, the noise, the fact of being vertical and moving. But the air changes things, slightly.' },
            { weight: 1, value: 'A walk. Your body does it reluctantly. The street, the sounds, the sky that\'s bigger than any ceiling. By the end something has shifted — not much, but it\'s there.' },
            { weight: 1, value: 'You make yourself walk. Each block is a small negotiation. But the air is different out here and by the time you turn back, something in your chest is a fraction looser.' },
            // High adenosine (unblocked) — the body drags
            { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: 'You walk. Your body is a heavy thing you\'re carrying through space. The legs work but they want you to know they\'re working. By the second block you\'re wondering if this was a mistake. By the third, you don\'t care. You just walk.' },
          ]);
        }
        if (mood === 'fraying') {
          // No stress relief — the thoughts follow you
          if (weather === 'drizzle') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You walk. The rain gets in your collar. Your thoughts are exactly as loud out here as they were inside, plus now you\'re wet.' },
              { weight: 1, value: 'Drizzle. You walk through it fast, shoulders hunched. The thoughts don\'t care about the scenery. They came with you. Now you\'re tired and damp.' },
              // High NE — every drop is an irritant
              { weight: ctx.state.lerp01(ne, 55, 75), value: 'The rain is on your neck and you can feel every drop. Your jacket isn\'t enough. The cold, the wet, the sound of cars on wet road — every sensation is a needle. You walk faster. It doesn\'t help.' },
            ]);
          }
          if (weather === 'snow') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You walk in the snow. The cold sharpens every sensation — the thoughts, the ache in your hands, the sound of your own breathing. The world is quiet. You are not.' },
              { weight: 1, value: 'Snow. You walk through it. The thoughts came with you. The cold doesn\'t help and doesn\'t hurt, it just adds to the pile. You come back cold and no different.' },
              // High NE + cold — everything is too much
              { weight: ctx.state.lerp01(ne, 55, 75), value: 'The cold is immediate — face, hands, ears. Each breath is a small shock. Your thoughts are already loud and the cold just adds a new register to the noise. You walk fast. You come back faster.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You walk. Fast, tight, shoulders up. The thoughts come with you — they don\'t care about the change of scenery. You burn energy. That\'s what you accomplish.' },
            { weight: 1, value: 'A walk. You thought it would help. The air is fine. The sky is there. The thing in your chest is exactly the same, just outside now instead of inside.' },
            { weight: 1, value: 'You walk until your legs notice. The thoughts follow you the whole way — across the street, around the block, back again. Walking didn\'t help. But you walked.' },
            // Low GABA — the anxiety walks with you
            { weight: ctx.state.lerp01(gaba, 40, 20), value: 'You walk fast. Too fast. Your breath is shallow and your hands are fists in your pockets. The movement should help. It doesn\'t. The thing inside you has legs too, and it keeps up easily.' },
          ]);
        }
        if (mood === 'numb') {
          // No stress relief — nothing registers
          if (weather === 'drizzle') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You walk in the rain. You get wet. You walk back. The rain happened to you. That\'s about all you can say about it.' },
              { weight: 1, value: 'Drizzle. You walk through it. Your body moves through space. You come back damp. Nothing changed except your socks.' },
              // Low serotonin — numb even to discomfort
              { weight: ctx.state.lerp01(ser, 30, 10), value: 'You walk in the rain. It\'s cold. You know it\'s cold because your hands are wet, but the cold doesn\'t bother you the way it should. Nothing does. You walk until walking stops, then you turn around.' },
            ]);
          }
          if (weather === 'snow') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You walk in the snow. The world is white and muffled. You move through it. Your feet get cold. You walk back. None of it reached you.' },
              { weight: 1, value: 'Snow. Your body walks through it. Your footprints are in the snow and that\'s the only evidence anything happened. You come back and you\'re cold. That\'s everything.' },
              // Low dopamine — snow's beauty is just information
              { weight: ctx.state.lerp01(dopa, 40, 15), value: 'Snow on the street, on the parked cars, on the awnings. You know this is a particular kind of beautiful. You don\'t feel it. The information is there; the feeling isn\'t.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You walk. The street, the air, the people. You move through all of it like water through a pipe. You were out. Now you\'re back. That happened.' },
            { weight: 1, value: 'A walk. You went, you returned. The scenery was there. You were there. The two of you didn\'t really connect.' },
            { weight: 1, value: 'You walk. Your legs do it. The air touches your face. People pass. None of it reaches whatever part of you would need to be reached. You come back.' },
            // Low dopamine — no engagement with the world
            { weight: ctx.state.lerp01(dopa, 40, 15), value: 'You walk. Trees, buildings, people — the world scrolls past like a feed you\'re not interested in. Your legs carry you through it. At no point do you feel like you\'re in it.' },
          ]);
        }
        // hollow
        ctx.state.adjustStress(-1);
        if (weather === 'drizzle') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You walk in the drizzle. The world exists. You were in it, briefly, getting rained on. It\'s something.' },
            { weight: 1, value: 'Rain on the street. You walk through it. Cars pass. People with umbrellas. You\'re out here. That\'s a fact about your life right now.' },
            // High NE — the rain is oddly present
            { weight: ctx.state.lerp01(ne, 40, 60), value: 'You walk in the drizzle and the rain is on your face, each drop a small fact. Cars hiss past on wet road. Someone\'s umbrella is red. You notice things. You don\'t know what to do with any of them.' },
          ]);
        }
        if (weather === 'snow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You walk in the snow. The street is quiet. Your footprints in the white behind you. The world feels like it\'s holding still, which is something.' },
            { weight: 1, value: 'Snow on the street, on the cars, on you. You walk through it. The quiet of it is real. You were in the world for a little while. The world was muffled and still.' },
            // Higher NE — the muffled world notices you
            { weight: ctx.state.lerp01(ne, 40, 60), value: 'You walk in the snow and the quiet is very present. Each footstep. Your breath white in the air. The world pulled back and left this version — white and specific and only slightly demanding.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You walk. The world exists and you\'re in it, briefly. People going places. Cars. The sky. You were part of the scene for a few minutes. Then you came back.' },
          { weight: 1, value: 'A walk. The street, the air, the feeling of being a body among other bodies. It doesn\'t fill the hollow, but it proves the world is still out there.' },
          { weight: 1, value: 'You walk for a while. Past the store, past the bus stop, past people you\'ll never see again. The world is there. You were in it.' },
          // Higher serotonin — the hollow lets some light in
          { weight: ctx.state.lerp01(ser, 40, 55), value: 'You walk. The hollow is still there, but the air moves through it. A tree. A stranger\'s dog. The light on the pavement. Small things that don\'t fix anything but prove the world is wider than the inside of your head.' },
        ]);
      },
    },

    find_public_restroom_street: {
      id: 'find_public_restroom_street',
      label: 'Find a bathroom',
      location: 'street',
      available: () => {
        const need = ctx.state.bladderNeedTier();
        return need === 'aware' || need === 'urgent' || need === 'pressing';
      },
      execute: () => {
        // ~55% chance of finding an accessible public restroom nearby
        // Both branches consume exactly 2 RNG calls.
        const found = ctx.timeline.random() < 0.55;

        if (!found) {
          ctx.state.advanceTime(10);
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The park restroom has a lock on it. The fast food place near the corner has a sign — customers only — and you\'re not buying. You spend ten minutes confirming what you suspected.' },
            { weight: 1, value: 'Nothing usable nearby. The library is closed. The coffee shop wants an order first. You come back the same way you left.' },
            { weight: 1, value: 'You check the park — locked. You ask at a storefront — they shake their head. Nothing. You come back.' },
          ]);
        }

        ctx.state.voidBladder();
        ctx.state.adjustStress(-1);
        ctx.state.advanceTime(10);

        const ser = ctx.state.get('serotonin');

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A park restroom, unlocked. You use it, wash your hands. Ten minutes total. You\'re back on the street.' },
          { weight: 1, value: 'The library lets you in for the bathroom. The floor is clean. You\'re out in a few minutes.' },
          { weight: ctx.state.lerp01(ser, 35, 55), value: 'A public restroom in the park. Not great, but there. You use it quickly and come back.' },
        ]);
      },
    },

    // === BUS STOP ===
    wait_for_bus: {
      id: 'wait_for_bus',
      label: 'Wait',
      location: 'bus_stop',
      available: () => true,
      execute: () => {
        const waitTime = ctx.timeline.randomInt(3, 15);
        ctx.state.advanceTime(waitTime);

        const mood = ctx.state.moodTone();
        const weather = ctx.state.get('weather');
        const long = waitTime > 10;
        const aden = ctx.state.get('adenosine');
        const ne = ctx.state.get('norepinephrine');
        const gaba = ctx.state.get('gaba');
        const ser = ctx.state.get('serotonin');
        const dopa = ctx.state.get('dopamine');

        if (weather === 'snow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: long ? 'Snow on your shoulders. The bus takes a long time. There\'s nowhere warmer within reach.' : 'Snow while you wait. The bus comes.' },
            { weight: 1, value: 'The shelter doesn\'t help much with cold. You stand in it anyway. Snow on everything. The bus arrives eventually.' },
            // High adenosine (unblocked) — cold and tired compound
            { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: 'The cold gets into your feet first, then your hands. You shift your weight. Snow on your shoulders.' + (long ? ' The bus takes a long time.' : ' The bus comes.') },
            // Low serotonin — the wait has more weight than it should
            { weight: ctx.state.lerp01(ser, 40, 20), value: 'Snow, cold, waiting. ' + (long ? 'The bus doesn\'t come and doesn\'t come.' : 'The bus comes.') + ' You get on. That\'s all.' },
          ]);
        }

        if (weather === 'drizzle') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Rain collects on the shelter roof and drips from the edge in a line.' + (long ? ' The bus takes its time.' : '') },
            { weight: 1, value: 'The shelter covers most of it. You stand in the dry part and wait.' + (long ? ' A long wait.' : '') },
            // Low GABA — exposed even under cover
            { weight: ctx.state.lerp01(gaba, 42, 22), value: 'The shelter helps with the rain. It doesn\'t help with the feeling of standing in the open.' + (long ? ' The bus is a long time.' : ' The bus comes.') },
            // High NE — rain sounds are amplified
            { weight: ctx.state.lerp01(ne, 55, 75), value: 'Rain on the shelter roof. Loud in a specific way. The wet street. Headlights. ' + (long ? 'You wait a long time in it.' : 'The bus comes before it gets worse.') },
          ]);
        }

        // Clear / overcast / grey — mood is the texture
        if (mood === 'clear' || mood === 'present') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: long ? 'The bus takes its time. You wait, and the waiting is just waiting — the street, the sounds, the air.' : 'A few minutes at the stop. The air is decent. The bus arrives.' },
            { weight: 1, value: 'You stand at the stop. A couple of people drift up. Someone checks their phone. The bus comes.' },
            // High NE — the stop is vivid
            { weight: ctx.state.lerp01(ne, 45, 65), value: 'The stop is its own small world — the sounds, the movement. A car passes. A pigeon. Someone checks their watch. The bus comes when it comes.' },
            // High dopamine — small interest in the scene
            { weight: ctx.state.lerp01(dopa, 50, 70), value: 'You watch the intersection while you wait. Things happen there. The bus turns the corner. You board.' },
          ]);
        }

        if (mood === 'fraying') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You check the direction it comes from too many times. It comes when it comes.' },
            { weight: 1, value: 'The wait is hard. You can\'t stand still. The bus arrives before you\'ve decided what to do with yourself.' },
            // Low GABA — standing in the open is difficult
            { weight: ctx.state.lerp01(gaba, 42, 22), value: 'You keep looking up the street. You can\'t stop yourself. The openness of the stop doesn\'t help — nowhere to put your back. The bus comes.' },
            // High NE — everything at the stop registers
            { weight: ctx.state.lerp01(ne, 55, 75), value: 'Every car that rounds the corner gets your attention before you can stop it.' + (long ? ' The bus takes a long time. You are extremely ready to be on it.' : ' The bus comes and you move toward it before it stops.') },
          ]);
        }

        if (mood === 'heavy') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: long ? 'The bus takes its time. You wait in the cold.' : 'You wait at the stop. The bus arrives.' },
            { weight: 1, value: 'Your bag. Your shoes. Your body wanting to lean on something.' + (long ? ' The bus is a long time coming.' : ' The bus comes.') },
            // High adenosine (unblocked) — legs want to sit
            { weight: ctx.state.lerp01(aden, 45, 68) * ctx.state.adenosineBlock(), value: 'Your legs are tired and you\'ve only been standing for a few minutes.' + (long ? ' The bus takes forever.' : '') + ' You get on when it comes.' },
          ]);
        }

        if (mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You stand there. People come and go. The bus doesn\'t, and then it does.' },
            { weight: 1, value: 'The stop is exposed. You wait in it. Other people, their lives, the bus.' },
            // High adenosine (unblocked) — standing hollow and tired
            { weight: ctx.state.lerp01(aden, 45, 65) * ctx.state.adenosineBlock(), value: 'Standing is its own kind of tired. You shift your weight from foot to foot. The bus eventually comes.' },
          ]);
        }

        if (mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You stand there. The bus will come. It does.' },
            { weight: 1, value: 'The stop. Other people waiting. The bus.' },
            // Low serotonin — time doesn't behave
            { weight: ctx.state.lerp01(ser, 35, 15), value: 'You stand at the stop and time doesn\'t do what it\'s supposed to.' + (long ? ' The bus is a long time.' : ' The bus comes.') + ' You get on.' },
          ]);
        }

        // flat / default
        return ctx.timeline.weightedPick([
          { weight: 1, value: long ? 'The bus takes its time. You wait.' : 'A few minutes. Buses arrive when they arrive.' },
          { weight: 1, value: 'You stand at the stop. Time passes at the speed it passes. The bus comes.' },
          // High adenosine (unblocked) — legs want to sit
          { weight: ctx.state.lerp01(aden, 45, 65) * ctx.state.adenosineBlock(), value: 'Your legs want you to sit. The bench is full. You stand.' + (long ? ' The bus takes a while.' : ' The bus comes.') },
        ]);
      },
    },

    find_public_restroom_bus_stop: {
      id: 'find_public_restroom_bus_stop',
      label: 'Find a bathroom',
      location: 'bus_stop',
      available: () => {
        const need = ctx.state.bladderNeedTier();
        return need === 'urgent' || need === 'pressing';
      },
      execute: () => {
        // ~20% chance there's something close enough to use without missing the bus
        // Both branches consume exactly 2 RNG calls.
        const found = ctx.timeline.random() < 0.20;

        if (!found) {
          ctx.state.advanceTime(5);
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Nothing within range of the stop without missing the bus. You look up the street and stay.' },
            { weight: 1, value: 'A gas station two blocks up, but leaving means missing the bus. You stay.' },
            { weight: 1, value: 'You scan the street. Nothing close enough. The bus will come. You wait.' },
          ]);
        }

        ctx.state.voidBladder();
        ctx.state.advanceTime(12);

        const ne = ctx.state.get('norepinephrine');

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A fast food place within two minutes of the stop. You go, use it, half-jog back. The bus isn\'t there yet.' },
          { weight: 1, value: 'Gas station bathroom just up the street. You make it, use it, walk back quickly. The stop is still there. The bus isn\'t yet.' },
          { weight: ctx.state.lerp01(ne, 50, 70), value: 'You run to the gas station and back. Made it. The bus isn\'t there. You stand there breathing a little fast.' },
        ]);
      },
    },

    // === WORKPLACE ===
    do_work: {
      id: 'do_work',
      label: 'Work on what\'s in front of you',
      location: 'workplace',
      available: () => ctx.state.get('work_tasks_done') < ctx.state.get('work_tasks_expected'),
      execute: () => {
        const canFocus = ctx.state.canFocus();
        const energy = ctx.state.energyTier();
        const stress = ctx.state.stressTier();

        let timeCost, energyCost, stressEffect;

        if (canFocus) {
          timeCost = ctx.timeline.randomInt(30, 60);
          energyCost = -10;
          stressEffect = -3;
          ctx.state.set('work_tasks_done', ctx.state.get('work_tasks_done') + 1);
          ctx.state.adjustJobStanding(1); // focused work builds standing — Approximation debt: +1 for focused work completion chosen
        } else {
          timeCost = ctx.timeline.randomInt(45, 90);
          energyCost = -15;
          stressEffect = 5;
          if (ctx.timeline.chance(0.6)) {
            ctx.state.set('work_tasks_done', ctx.state.get('work_tasks_done') + 1);
          }
        }

        ctx.state.adjustEnergy(energyCost);
        ctx.state.adjustStress(stressEffect);

        // Accumulating sentiments: work builds dread or satisfaction
        if (canFocus) {
          ctx.state.adjustSentiment('work', 'satisfaction', 0.015);
          ctx.state.adjustSentiment('work', 'dread', -0.01);
        } else {
          ctx.state.adjustSentiment('work', 'dread', 0.02);
          ctx.state.adjustSentiment('work', 'satisfaction', -0.005);
        }

        ctx.state.advanceTime(timeCost);

        const jobType = ctx.character.get('job_type');
        const proseFn = /** @type {(canFocus: boolean, energy: string, stress: string) => string} */ (doWorkProse[jobType] || doWorkProse.office);
        return proseFn(canFocus, energy, stress);
      },
    },

    work_break: {
      id: 'work_break',
      label: 'Step away for a minute',
      location: 'workplace',
      available: () => !['okay', 'rested', 'alert'].includes(ctx.state.energyTier()) || !['calm', 'baseline'].includes(ctx.state.stressTier()),
      execute: () => {
        ctx.state.adjustEnergy(5);
        ctx.state.adjustStress(-5);

        // The need to escape is itself a signal
        if (['tense', 'strained', 'overwhelmed'].includes(ctx.state.stressTier())) {
          ctx.state.adjustSentiment('work', 'dread', 0.005);
        } else if (ctx.state.sentimentIntensity('work', 'dread') > 0 && ['calm', 'baseline'].includes(ctx.state.stressTier())) {
          // A relaxed break at work gently challenges dread
          ctx.state.adjustSentiment('work', 'dread', -0.005);
        }

        ctx.state.advanceTime(10);

        const mood = ctx.state.moodTone();
        const jobType = ctx.character.get('job_type');
        const proseFn = /** @type {(mood: string) => string} */ (workBreakProse[jobType] || workBreakProse.office);
        return proseFn(mood);
      },
    },

    talk_to_coworker: {
      id: 'talk_to_coworker',
      label: 'Say something to someone nearby',
      location: 'workplace',
      available: () => ctx.state.socialTier() !== 'warm' && ctx.state.energyTier() !== 'depleted' && ctx.state.isWorkHours(),
      execute: () => {
        const mood = ctx.state.moodTone();

        // Coworker sentiment affects mechanical outcomes
        const isFirst = ctx.timeline.chance(0.5);
        const slot = isFirst ? 'coworker1' : 'coworker2';
        const coworker = ctx.character.get(slot);

        const warmth = ctx.state.sentimentIntensity(slot, 'warmth');
        const irritation = ctx.state.sentimentIntensity(slot, 'irritation');

        // Base social/stress effects, modified by accumulated sentiment
        // Approximation debt: base of 8 social (+ 2 for warmth) for talk_to_coworker chosen
        const socialBonus = 8 + (warmth > 0.3 ? 2 : 0);
        const stressEffect = irritation > 0.4 ? 2 : -3;
        ctx.state.adjustSocial(socialBonus);
        ctx.state.adjustStress(stressEffect);

        // Accumulate coworker sentiments based on mood
        // Cross-reduction: good interactions gently challenge irritation, bad ones challenge warmth
        if (mood === 'present' || mood === 'clear' || ['calm', 'baseline'].includes(ctx.state.stressTier())) {
          ctx.state.adjustSentiment(slot, 'warmth', 0.02);
          ctx.state.adjustSentiment(slot, 'irritation', -0.008);
        } else if (mood === 'fraying' || mood === 'heavy' || mood === 'numb' || ['strained', 'overwhelmed'].includes(ctx.state.stressTier())) {
          ctx.state.adjustSentiment(slot, 'irritation', 0.015);
          ctx.state.adjustSentiment(slot, 'warmth', -0.005);
        }

        ctx.state.advanceTime(5);

        const social = ctx.state.socialTier();

        ctx.events.record('talked_to_coworker', { name: coworker.name, flavor: coworker.flavor });

        if (social === 'isolated' || social === 'withdrawn') {
          return /** @type {(name: string) => string | undefined} */ (coworkerInteraction[coworker.flavor])(coworker.name);
        }
        if (mood === 'present' || mood === 'clear') {
          return /** @type {(name: string) => string | undefined} */ (coworkerInteraction[coworker.flavor])(coworker.name);
        }
        return /** @type {(name: string) => string | undefined} */ (coworkerChatter[coworker.flavor])(coworker.name);
      },
    },

    check_phone_work: {
      id: 'check_phone_work',
      label: 'Check your phone',
      location: 'workplace',
      available: () => ctx.state.get('has_phone') && ctx.state.get('phone_battery') > 0 && !ctx.state.get('viewing_phone'),
      execute: () => {
        ctx.state.set('viewing_phone', true);
        ctx.state.advanceTime(1);
        ctx.events.record('checked_phone');
        return phoneScreenDescription();
      },
    },

    eat_at_work: {
      id: 'eat_at_work',
      label: 'Grab something to eat',
      location: 'workplace',
      available: () => {
        const job = ctx.character.get('job');
        return job === 'food_service'
          && !ctx.state.get('ate_at_work_today')
          && ['hungry', 'very_hungry', 'starving'].includes(ctx.state.hungerTier());
      },
      execute: () => {
        ctx.state.adjustHunger(-40);
        ctx.state.addPendingHydration(150); // ~150ml water content in solid meal — absorbs over ~20 min (Popkin et al. 2010 PMC2908954)
        ctx.state.fillStomach(70, 'solid');
        ctx.state.set('ate_at_work_today', true);
        ctx.state.advanceTime(10);

        // Dental — eating spikes the ache
        ctx.state.dentalSpike(15); // Approximation debt: 15pt chewing spike chosen

        const mood = ctx.state.moodTone();
        const hunger = ctx.state.hungerTier();

        if (mood === 'hollow' || mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You eat standing up by the prep counter. Staff meal. You\'re allowed it. You barely taste it.' },
            { weight: ctx.state.lerp01('serotonin', 0, 35), value: 'You eat because your body needs it, not because you wanted to. The food is fine. It doesn\'t matter.' },
          ]);
        }
        if (hunger === 'starving' || hunger === 'very_hungry') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You take your break early and eat. Staff meal — you\'re entitled to it. You eat faster than you meant to.' },
            { weight: ctx.state.lerp01('adenosine', 50, 80) * ctx.state.adenosineBlock(), value: 'You eat on your feet, between tasks, barely sitting. The food disappears. You feel more human than you have all shift.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Staff meal. You eat in the back, standing at the counter. It\'s not a moment to savor but it\'s real food and you needed it.' },
          { weight: ctx.state.lerp01('dopamine', 0, 40), value: 'You take your meal break. The kitchen smells like work but you eat it anyway. Something about eating what you made.' },
        ]);
      },
    },

    graze_break_room: {
      id: 'graze_break_room',
      label: 'See what\'s in the break room',
      location: 'workplace',
      available: () => {
        const jobType = ctx.character.get('job_type');
        return jobType === 'office'
          && !ctx.state.get('grazed_break_room_today')
          && ctx.state.isWorkHours();
      },
      execute: () => {
        ctx.state.adjustHunger(-12);
        ctx.state.fillStomach(20, 'solid');
        ctx.state.set('grazed_break_room_today', true);
        ctx.state.advanceTime(8);

        // Dental — sugar/acidity from candy and cake.
        // Approximation debt: 10 pts chosen (less than full meals at 15) on the
        // reasoning that this is small amounts, less mastication. Uncalibrated.
        ctx.state.dentalSpike(10);

        const mood = ctx.state.moodTone();
        const aden = ctx.state.get('adenosine');
        const ne = ctx.state.get('norepinephrine');
        const ser = ctx.state.get('serotonin');
        const dopa = ctx.state.get('dopamine');
        const hunger = ctx.state.hungerTier();

        let prose;

        if (mood === 'hollow' || mood === 'numb') {
          prose = ctx.timeline.weightedPick([
            { weight: 1, value: 'You walk to the break room without deciding to. There\'s a quarter of a birthday cake on the counter, three days old, the frosting dried at the edges. You take a slice and eat it standing up. It doesn\'t taste like much. You go back.' },
            { weight: ctx.state.lerp01(ser, 0, 35), value: 'The candy dish is on the counter. You take a few pieces and eat them on the walk back. You weren\'t hungry. You\'re not sure why you went.' },
            { weight: ctx.state.lerp01(dopa, 0, 30), value: 'You get up and walk to the break room because sitting there wasn\'t working anymore. There\'s nothing appealing but you eat a piece of someone\'s leftover cake anyway. The gesture of eating something.' },
          ]);
        } else if (mood === 'fraying' || mood === 'heavy') {
          prose = ctx.timeline.weightedPick([
            { weight: 1, value: 'Break room. The candy dish. You take a handful and stand there for a moment, which is the real reason you came — not the candy, just the standing somewhere else for a minute. Then you go back.' },
            { weight: ctx.state.lerp01(aden, 50, 80) * ctx.state.adenosineBlock(), value: 'Mid-afternoon. You get up and walk to the break room on pure instinct. There\'s birthday cake — a few slices left from someone\'s thing yesterday. You eat a piece. It\'s very sweet. It helps a little.' },
            { weight: ctx.state.lerp01(ser, 20, 55), value: 'The break room has that communal-space smell: old coffee, someone\'s lunch, the particular silence of a room nobody uses for long. You eat a few pieces of candy from the dish and don\'t run into anyone. That part is fine.' },
          ]);
        } else {
          prose = ctx.timeline.weightedPick([
            { weight: 1, value: 'You walk to the break room and find the candy dish, which is always there. You take a few pieces and eat them on the way back. This is the shape of the afternoon.' },
            { weight: ctx.state.lerp01(dopa, 30, 65), value: 'There\'s birthday cake on the counter — leftover from yesterday, maybe the day before. You take the least-sad-looking slice. It\'s fine. Sweet, at least.' },
            { weight: hunger === 'hungry' ? 1 : 0, value: 'You\'re hungry enough that the candy dish is actually useful. You take a handful and eat them at your desk. Not a solution, but something.' },
            { weight: ctx.state.lerp01(ser, 45, 75), value: 'Break room run. The coffee\'s been sitting for two hours and the cake is going dry at the corners but you take a slice anyway, mostly just to have a reason to stand up and walk somewhere.' },
          ]);
        }

        // Deterministic modifiers — no RNG
        if (ne > 65) {
          prose += ' Your shoulders haven\'t dropped the whole time.';
        } else if (aden > 60 && ctx.state.adenosineBlock() > 0.3) {
          prose += ' The walk helped more than the food.';
        }

        return prose;
      },
    },

    get_coffee_work: {
      id: 'get_coffee_work',
      label: 'Get coffee',
      location: 'workplace',
      available: () => ctx.state.caffeineTier() !== 'high' && ctx.state.isWorkHours(),
      execute: () => {
        ctx.state.consumeCaffeine(40);
        ctx.state.addPendingHydration(200); // ~200ml work mug — absorbs over ~20 min; net positive despite mild diuresis (Armstrong 2002 PMID 12187535)
        ctx.state.advanceTime(ctx.timeline.randomInt(4, 7));

        // Dental — hot coffee is a significant trigger
        ctx.state.dentalSpike(25); // Approximation debt: 25pt hot liquid spike chosen

        const mood = ctx.state.moodTone();
        const aden = ctx.state.get('adenosine');
        const caffeine = ctx.state.caffeineTier();
        const withdrawal = ctx.state.withdrawalTier();
        const jobType = ctx.character.get('job_type');

        if (caffeine === 'active') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You go back for another. The machine goes through its routine. You go through yours.' },
            { weight: ctx.state.lerp01(aden, 40, 75) * ctx.state.adenosineBlock(), value: 'The second one. You weren\'t done needing it.' },
          ]);
        }

        // Withdrawal relief — made it to work with a headache
        if (withdrawal === 'moderate' || withdrawal === 'severe') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Break room. You pour coffee and drink it standing up. The headache starts to retreat. You give it a minute, then go back.' },
            { weight: 1, value: 'You\'ve had a headache since you got here. The coffee starts to address that. Not immediately — it takes a few minutes. But the pressure behind your eyes starts to ease and the shift gets a little more navigable.' },
          ]);
        }

        if (jobType === 'office') {
          if (mood === 'numb' || mood === 'hollow') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You fill a mug in the break room. Something warm to hold. The smell is stale but present.' },
              { weight: ctx.state.lerp01(aden, 40, 70) * ctx.state.adenosineBlock(), value: 'Break room. Coffee. Your brain needed something to hold onto.' },
            ]);
          }
          if (mood === 'fraying' || mood === 'heavy') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'Break room. Stale coffee but you pour it anyway. The walk over was the real thing.' },
              { weight: ctx.state.lerp01(aden, 40, 70) * ctx.state.adenosineBlock(), value: 'You needed the break as much as the coffee. A minute away from your desk.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You grab coffee from the break room. The machine\'s been running all morning.' },
            { weight: ctx.state.lerp01(aden, 30, 65) * ctx.state.adenosineBlock(), value: 'Coffee from the break room. You needed it more than you realized.' },
          ]);
        }

        if (jobType === 'retail') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The break room machine. You fill a cup and drink it in the thirty seconds you have.' },
            { weight: 1, value: 'Coffee from the back. Burnt, vending-machine quality. You drink it anyway.' },
            { weight: ctx.state.lerp01(aden, 40, 70) * ctx.state.adenosineBlock(), value: 'You get coffee in the back. It\'s bad. Your body doesn\'t care.' },
          ]);
        }

        // food_service
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Staff coffee, poured fast, drunk faster. It tastes like the rest of the shift.' },
          { weight: ctx.state.lerp01(aden, 40, 70) * ctx.state.adenosineBlock(), value: 'You pour coffee before the next rush. The mug is warm. That\'s enough.' },
        ]);
      },
    },

    use_toilet_work: {
      id: 'use_toilet_work',
      label: 'Use restroom',
      location: 'workplace',
      available: () => ['aware', 'urgent', 'pressing'].includes(ctx.state.bladderNeedTier()),
      execute: () => {
        const need = ctx.state.bladderNeedTier();
        const jobType = ctx.character.get('job');
        ctx.state.voidBladder();
        ctx.state.adjustStress(-1);
        ctx.state.advanceTime(4);

        const aden = ctx.state.get('adenosine');
        const mood = ctx.state.moodTone();

        if (need === 'pressing') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You step away. The relief is significant — you had been holding it longer than you realized.' },
            { weight: jobType === 'food_service' ? 1 : 0, value: 'Someone covers for you. You step off the line. The relief comes the moment you\'re through the door.' },
            { weight: ctx.state.lerp01('adenosine', 50, 80), value: 'You needed this. A minute alone with your own body. You wash your hands and head back.' },
          ]);
        }
        if (need === 'urgent') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'A few minutes away from the floor. The relief is real.' },
            { weight: ctx.state.lerp01('adenosine', 60, 90), value: 'Your body said now. You go. You wash your hands and come back.' },
            { weight: ctx.state.lerp01('stress', 50, 80), value: 'The brief quiet of the restroom. Not comfortable, exactly, but away.' },
          ]);
        }
        // aware
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A quick break. Done in a few minutes.' },
          { weight: ctx.state.lerp01('adenosine', 60, 90), value: 'You go. Your body had been asking. You answered.' },
          { weight: (mood === 'fraying' || mood === 'heavy') ? 0.7 : 0, value: 'A pause. A small one. You wash your hands and return.' },
        ]);
      },
    },

    // === CORNER STORE ===
    buy_groceries: {
      id: 'buy_groceries',
      label: 'Get a few things',
      location: 'corner_store',
      available: () => ctx.state.canAfford(8) || ctx.state.get('ebt_balance') >= 8,
      execute: () => {
        const cost = ctx.timeline.randomFloat(8, 14);
        const roundedCost = Math.round(cost * 100) / 100;

        const usingEbt = !ctx.state.canAfford(roundedCost) && ctx.state.get('ebt_balance') >= roundedCost;
        if (usingEbt) {
          ctx.state.spendEbt(roundedCost);
        } else if (!ctx.state.spendMoney(roundedCost)) {
          return 'You pick things up and put them back. The math doesn\'t work today.';
        }

        ctx.state.set('fridge_food', Math.min(6, ctx.state.get('fridge_food') + 3));
        ctx.state.set('pantry_food', Math.min(3, ctx.state.get('pantry_food') + 1));
        ctx.state.advanceTime(10);
        ctx.state.glanceMoney();
        ctx.events.record('bought_groceries', { cost: roundedCost });

        const money = ctx.state.moneyTier();

        if (usingEbt) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You swipe your EBT card. The machine beeps. You take your bags.' },
            { weight: 1, value: 'Bread. Rice. A can of beans. You pay with EBT. The cashier doesn\'t react.' },
            { weight: ctx.state.lerp01('serotonin', 50, 25), value: 'You use your EBT. The transaction goes through. You carry the bags out without looking back.' },
          ]);
        }
        if (money === 'scraping' || money === 'tight') {
          return 'Bread. Rice. A can of beans. You count it out at the register.';
        }
        if (money === 'broke') {
          return 'The basics. Just the basics. The receipt is a small piece of bad news.';
        }
        return 'You pick up what you need. Bread, some produce, a couple of cans. The cashier rings it up.';
      },
    },

    buy_cheap_meal: {
      id: 'buy_cheap_meal',
      label: 'Grab something to eat now',
      location: 'corner_store',
      available: () => ctx.state.canAfford(3),
      execute: () => {
        const cost = ctx.timeline.randomFloat(3, 5.50);
        const roundedCost = Math.round(cost * 100) / 100;

        if (!ctx.state.spendMoney(roundedCost)) {
          return 'Not enough. You put it back.';
        }

        ctx.state.adjustHunger(-30);
        ctx.state.fillStomach(50, 'solid');
        ctx.state.set('ate_today', true);
        ctx.state.set('consecutive_meals_skipped', 0);
        ctx.state.advanceTime(5);
        ctx.state.glanceMoney();
        ctx.events.record('ate', { what: 'cheap_meal' });

        // Dental — eating anything spikes the ache
        ctx.state.dentalSpike(15); // Approximation debt: 15pt chewing spike chosen

        // Food comfort sentiment — weaker than home food + habituation
        const fc = ctx.state.sentimentIntensity('eating', 'comfort');
        if (fc > 0) {
          ctx.state.adjustNT('serotonin', fc * 2);
          ctx.state.adjustSentiment('eating', 'comfort', -0.002);
        }

        const mood = ctx.state.moodTone();
        const dentalW = ctx.state.lerp01(ctx.state.get('dental_ache'), 20, 65);

        if (mood === 'numb' || mood === 'heavy') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You eat it on the way out. Something wrapped in plastic from a warmer. It\'s food. It does what food does.' },
            { weight: 1, value: 'You eat standing by the door. Cheap food in a plastic wrapper. Your body accepts it. That\'s about all.' },
            // High food comfort — even cheap food can be something
            { weight: fc > 0 ? fc * 0.7 : 0, value: 'You eat it on the way out. It\'s cheap and wrapped in plastic and warm, and the warmth is something. Not much. But something your body reaches for.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A sandwich from the cooler. You eat it standing outside the store. It\'s fine. It\'s enough.' },
          { weight: 1, value: 'You grab something from the counter and eat it outside. Corner store food. It does the job.' },
          // High food comfort — small pleasure in cheap food
          { weight: fc > 0 ? fc * 0.7 : 0, value: 'You eat it outside the store. Cheap food, nothing to it, but the taste is good and the eating is a comfort in the simple way it always is.' },
          // Dental — eating outside with a bad tooth
          { weight: dentalW, value: 'You eat carefully on one side. Even out here it\'s a whole thing. You finish it anyway.' },
        ]);
      },
    },

    browse_store: {
      id: 'browse_store',
      label: 'Look around',
      location: 'corner_store',
      available: () => true,
      execute: () => {
        ctx.state.advanceTime(5);

        const money = ctx.state.moneyTier();
        const hunger = ctx.state.hungerTier();

        let text;
        if (money === 'broke') {
          text = 'You walk the aisles. Everything has a number attached and the numbers all say no.';
        } else if (hunger === 'starving' && (money === 'scraping' || money === 'tight')) {
          text = 'You look at things you want and things you can afford and the overlap is very small.';
        } else if (money === 'scraping') {
          text = 'You look at the prices. You know most of them already. They haven\'t gotten better.';
        } else {
          text = 'You walk through. The fluorescent aisles. Same stuff as always. You don\'t need anything specific, but you look.';
        }

        // NT deterministic modifiers (no RNG — replay-safe)
        const dopa = ctx.state.get('dopamine');
        const aden = ctx.state.get('adenosine');
        if (money !== 'broke' && dopa < 35) {
          text += ' Nothing in here catches you. The things are just things.';
        } else if (aden > 65 && ctx.state.adenosineBlock() > 0.4) {
          text += ' You move through the aisles without fully seeing them.';
        }

        return text;
      },
    },

    buy_medicine: {
      id: 'buy_medicine',
      label: 'Get something for it',
      location: 'corner_store',
      available: () => ctx.state.illnessTier() !== 'healthy' && ctx.state.canAfford(9) && !ctx.state.get('illness_medicated'),
      execute: () => {
        const cost = ctx.timeline.randomFloat(9, 13);
        const roundedCost = Math.round(cost * 100) / 100;
        if (!ctx.state.spendMoney(roundedCost)) return 'Not enough. You put it back.';
        ctx.state.set('illness_medicated', true);
        ctx.state.advanceTime(ctx.timeline.randomInt(5, 8));
        ctx.state.glanceMoney();

        const illTier = ctx.state.illnessTier();
        const aden = ctx.state.get('adenosine');
        if (illTier === 'very_sick') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You find what you need and bring it to the register. The cashier doesn\'t comment. You get home and take it. It won\'t fix anything, but it will make it possible to exist in your body for a while.' },
            { weight: 1, value: 'Cold medicine. You take it in the store parking lot because you can\'t wait. The chemical taste is almost comforting — something doing something.' },
          ]);
        }
        if (illTier === 'sick') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'DayQuil or NyQuil or whatever the generic version is. You take the recommended dose, which feels insufficient. You take it anyway.' },
            { weight: 1, value: 'You find the right aisle, pick something up, pay. You already feel slightly better just from the act of doing something about it.' },
            // High adenosine — the shopping itself was an effort
            { weight: ctx.state.lerp01(aden, 50, 80) * ctx.state.adenosineBlock(), value: 'The walk here took most of what you had. You get the medicine, get out. That\'s enough for now.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Something to head it off before it gets worse. Or just help. Either way.' },
          { weight: 1, value: 'You grab cold medicine, the generic kind. Probably the same thing in the box. You pay and go.' },
        ]);
      },
    },

    buy_coffee_store: {
      id: 'buy_coffee_store',
      label: 'Get a coffee',
      location: 'corner_store',
      available: () => ctx.state.canAfford(CORNER_STORE_COFFEE_PRICE) && ctx.state.caffeineTier() !== 'high',
      execute: () => {
        const cost = CORNER_STORE_COFFEE_PRICE;

        if (!ctx.state.spendMoney(cost)) {
          return 'Not enough. You put it back.';
        }

        ctx.state.consumeCaffeine(50);
        ctx.state.addPendingHydration(220); // ~240ml cup — absorbs over ~20 min; net positive despite mild diuresis (Armstrong 2002 PMID 12187535)
        ctx.state.advanceTime(ctx.timeline.randomInt(3, 5));
        ctx.state.glanceMoney();

        // Dental — hot coffee is a trigger
        ctx.state.dentalSpike(25); // Approximation debt: 25pt hot liquid spike chosen

        const mood = ctx.state.moodTone();
        const aden = ctx.state.get('adenosine');
        const caffeine = ctx.state.caffeineTier();
        const withdrawal = ctx.state.withdrawalTier();
        const money = ctx.state.moneyTier();

        if (caffeine === 'active') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The second one. You buy it because the first one didn\'t finish the job.' },
            { weight: ctx.state.lerp01(aden, 40, 75) * ctx.state.adenosineBlock(), value: 'You\'re already on one. You buy another. Your body is making its case.' },
          ]);
        }

        // Withdrawal relief — the headache finally has an answer
        if (withdrawal === 'moderate' || withdrawal === 'severe') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The headache has been sitting behind your eyes. You buy the coffee, take it outside, drink it faster than you should. The pressure starts to ease. You stand there a moment letting that happen.' },
            { weight: withdrawal === 'severe' ? 2 : 1, value: 'Two dollars for the headache to stop. You\'ve been carrying it since you woke up. You pay and stand outside with the cup and wait. It takes a few minutes. Then: less.' },
          ]);
        }

        if (mood === 'numb' || mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Coffee from the register. You pay and carry it out. The cup is warm in your hand.' },
            { weight: ctx.state.lerp01(aden, 40, 70) * ctx.state.adenosineBlock(), value: 'You buy coffee. Something your body wanted. The warmth of the cup is the best part.' },
          ]);
        }

        if (money === 'broke' || money === 'scraping') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'A small coffee. You pocket your change.' },
            { weight: ctx.state.lerp01(aden, 30, 65) * ctx.state.adenosineBlock(), value: 'A coffee because you needed it more than the two dollars. The math feels simple right now.' },
          ]);
        }

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Corner store coffee. It\'s not good but it\'s something. You drink it on the street.' },
          { weight: 1, value: 'Coffee from the register. The cup is warm. You take it outside.' },
          { weight: ctx.state.lerp01(aden, 30, 60) * ctx.state.adenosineBlock(), value: 'You buy coffee. You needed it before you realized. The first sip confirms it.' },
        ]);
      },
    },

    buy_scratch_ticket: {
      id: 'buy_scratch_ticket',
      label: 'Scratch ticket',
      location: 'corner_store',
      available: () => ctx.state.canAfford(2),
      execute: () => {
        // Approximation debt: weights calibrated for ~75% RTP on a $2 ticket.
        // Chosen to approximate real US state lottery math — not derived from real data.
        // Prize amounts are placeholders; should eventually derive from the actual games
        // available at this character's corner store (which depend on jurisdiction and
        // the specific retailer's current stock). Large weights necessary: at $10,000 jackpot,
        // even 1-in-100k probability contributes $0.10 EV on a $2 ticket.
        // Near-miss is a designed feature of real tickets (Clark et al. 2009, PMID 19822754):
        // partial matches spike dopamine almost as much as wins.
        // Outcome is { amount, nearMiss } — amount is the prize in dollars (0 = nothing),
        // nearMiss flags the special near-miss mechanic.
        // 2 RNG calls always: 1 for outcome (weightedPick), 1 for prose (weightedPick).
        const TICKET_COST = 2;
        ctx.state.spendMoney(TICKET_COST);
        ctx.state.glanceMoney();
        ctx.state.advanceTime(3);

        const { amount, nearMiss } = ctx.timeline.weightedPick([
          { weight: 170000, value: { amount: 0,     nearMiss: false } },
          { weight: 50000,  value: { amount: 0,     nearMiss: true  } },
          { weight: 30000,  value: { amount: 2,     nearMiss: false } },
          { weight: 25000,  value: { amount: 5,     nearMiss: false } },
          { weight: 6000,   value: { amount: 20,    nearMiss: false } },
          { weight: 600,    value: { amount: 100,   nearMiss: false } },
          { weight: 50,     value: { amount: 1000,  nearMiss: false } },
          { weight: 1,      value: { amount: 10000, nearMiss: false } },
        ]);

        const dop = ctx.state.get('dopamine');
        const ser = ctx.state.get('serotonin');

        // Apply prize and NT effects before prose pick (which may read NT).
        if (amount > 0) ctx.state.spendMoney(-amount);

        if (amount >= 10000) {
          ctx.state.adjustNT('dopamine', 20);
          ctx.state.adjustNT('NE', 8);
        } else if (amount >= 1000) {
          ctx.state.adjustNT('dopamine', 12);
          ctx.state.adjustNT('NE', 5);
        } else if (amount >= 100) {
          ctx.state.adjustNT('dopamine', 8);
        } else if (amount >= 20) {
          ctx.state.adjustNT('dopamine', 4);
        } else if (amount >= 5) {
          ctx.state.adjustNT('dopamine', 2);
        } else if (amount >= 2) {
          ctx.state.adjustNT('dopamine', 1);
        } else if (nearMiss) {
          ctx.state.adjustNT('dopamine', 1); // near-miss fires the same circuits
        } else {
          ctx.state.adjustNT('dopamine', -1);
        }

        // Prose — 1 RNG call always.
        if (amount >= 10000) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: `You scratch it three times to make sure. The number is there each time. $${amount.toLocaleString()}. You stand at the counter for a moment, unable to move. The cashier looks at you. You show them. They look at it for a long moment. "You'll need to take that to the lottery office," they say. "Not here."` },
            { weight: 1, value: `$${amount.toLocaleString()}. You read the number four times. You flip the ticket over and read the back. You flip it again. You are standing in the corner store holding a piece of paper that says $${amount.toLocaleString()} and you cannot tell if your legs are working.` },
            { weight: ctx.state.lerp01(dop, 40, 60), value: `The number matches. All of them. You double-check the prize key. You triple-check. $${amount.toLocaleString()}. You don't know what your face is doing. You ask the cashier to look at it. They do. They hand it back without comment. "Lottery office," they say.` },
          ]);
        }

        if (amount >= 1000) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: `$${amount.toLocaleString()}. You check it twice, slowly. The cashier confirms it — you'll need to take this to a lottery agent, they say. They write down an address. You fold the ticket very carefully and put it in your pocket.` },
            { weight: 1, value: `You scratch to the last panel. The numbers line up. $${amount.toLocaleString()}. You stand there for a second, just holding it. The cashier is watching. You ask them to look. They look. "Lottery agent," they say. You nod.` },
            { weight: ctx.state.lerp01(dop, 35, 55), value: `$${amount.toLocaleString()}. The amount takes a moment to land. You're aware of your heartbeat. The cashier says you'll have to claim it at a lottery agent. You say okay. You put the ticket in your wallet like it might vanish.` },
          ]);
        }

        if (amount >= 100) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: `$${amount}. You check it twice, then bring it to the register. The cashier counts out the bills without expression. You pocket them and stand there for a second, recalibrating.` },
            { weight: 1, value: `The numbers match. $${amount}. You hold the ticket for a moment — that's a real amount. The cashier cashes it out. The bills feel heavier than they should.` },
            { weight: ctx.state.lerp01(dop, 35, 55), value: `$${amount}. The number sits in your chest for a second before it moves. You bring it to the register. You try to look normal.` },
          ]);
        }

        if (amount >= 20) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: `$${amount}. You check it twice, then bring it to the register. The cashier nods without looking up.` },
            { weight: 1, value: `You scratch and there it is. $${amount}. More than the ticket cost. More than you were expecting. You hold it for a moment before going back to the register.` },
            { weight: ctx.state.lerp01(ser, 40, 60), value: `$${amount}. It won't solve anything. It's still $${amount} more than you had.` },
          ]);
        }

        if (amount >= 5) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: `$${amount}. You check the numbers again. You bring it back to the register and exchange it. $${amount - TICKET_COST} up.` },
            { weight: 1, value: `A match. $${amount}. The cashier peels off bills without comment. That's $${amount - TICKET_COST} you didn't have.` },
            { weight: ctx.state.lerp01(dop, 35, 55), value: `$${amount}. Your brain is doing something with that. It shouldn't feel like much but it kind of does.` },
          ]);
        }

        if (amount >= 2) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Free ticket. Which means two dollars back, if you want to read it that way. You take the cash.' },
            { weight: 1, value: 'You break even. The ticket was right about itself, at least.' },
            { weight: ctx.state.lerp01(dop, 35, 55), value: 'Two dollars back. Technically not a loss. You cash it in.' },
          ]);
        }

        if (nearMiss) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Two matching symbols. You look for the third. It\'s one off. You hold the ticket for a second longer than makes sense.' },
            { weight: 1, value: 'Almost. The first two match. The third doesn\'t. You look at it twice to make sure. It doesn\'t change.' },
            { weight: ctx.state.lerp01(dop, 30, 50), value: 'Two out of three. You knew before you finished scratching. Still checked. Still held it up to the light.' },
          ]);
        }

        // loss
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Nothing. You scratch the last panel and there\'s nothing. You fold the ticket and put it down on the counter.' },
          { weight: 1, value: 'You scratch through to the end. The numbers don\'t match. You knew they probably wouldn\'t.' },
          { weight: ctx.state.lerp01(dop, 50, 30), value: 'Nothing. The ticket cost two dollars. That\'s what happened.' },
          { weight: ctx.state.lerp01(ser, 40, 20), value: 'Nothing. You drop it in the bin by the door on your way out.' },
        ]);
      },
    },

    use_toilet_corner_store: {
      id: 'use_toilet_corner_store',
      label: 'Use bathroom',
      location: 'corner_store',
      available: () => {
        const need = ctx.state.bladderNeedTier();
        return need === 'aware' || need === 'urgent' || need === 'pressing';
      },
      execute: () => {
        // ~12% chance the bathroom is out of order / key unavailable
        // Both branches consume exactly 2 RNG calls for replay balance.
        const accessible = ctx.timeline.random() < 0.88;

        if (!accessible) {
          ctx.state.advanceTime(2);
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Out of order. You nod and walk back out.' },
            { weight: 1, value: 'The cashier shakes their head before you finish asking.' },
            { weight: 1, value: 'No key available, they say. Or the key is somewhere and finding it isn\'t being offered.' },
          ]);
        }

        ctx.state.voidBladder();
        ctx.state.adjustStress(-2);
        ctx.state.advanceTime(6);

        const ser = ctx.state.get('serotonin');

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'The key is on a block of wood the size of a small book. You take it to the back, lock the door. Single stall. Someone taped a print to the back of the door, small and faded. You wash your hands and return the key.' },
          { weight: 1, value: 'The key comes attached to a wooden plank. You take it to the back. The light is a pull-cord. The lock is slow. You use the toilet and come back out.' },
          { weight: ctx.state.lerp01(ser, 30, 55), value: 'A small room at the back. The key is on a plank. The door locks properly, which you notice. It\'s quiet here.' },
        ]);
      },
    },

    // === SOUP KITCHEN ===
    get_meal: {
      id: 'get_meal',
      label: 'Get a meal',
      location: 'soup_kitchen',
      available: () => {
        if (ctx.state.get('ate_at_soup_kitchen_today')) return false;
        const hour = ctx.state.getHour();
        return hour >= 11 && hour < 14 && ctx.state.isWorkday();
      },
      execute: () => {
        ctx.state.adjustHunger(-45);
        ctx.state.fillStomach(80, 'mixed');
        ctx.state.set('ate_today', true);
        ctx.state.set('consecutive_meals_skipped', 0);
        ctx.state.set('ate_at_soup_kitchen_today', true);
        ctx.state.set('soup_kitchen_visits', ctx.state.get('soup_kitchen_visits') + 1);
        ctx.state.advanceTime(25);
        ctx.events.record('ate', { what: 'soup_kitchen' });

        const visits = ctx.state.get('soup_kitchen_visits'); // already incremented
        const mood = ctx.state.moodTone();
        const hunger = ctx.state.hungerTier();
        const ser = ctx.state.get('serotonin');

        // First visit
        if (visits === 1) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You go through the line. Someone hands you a plate. You sit down and you eat. Nobody looks at you twice. The food is hot and there is enough of it.' },
            { weight: 1, value: 'A plate. A seat at a long table. The food is simple, institutional, warm. You eat all of it.' },
            { weight: ctx.state.lerp01(ser, 50, 20), value: 'You take a tray and sit and eat. Around you people do the same. The food is fine. You don\'t have to think about anything except eating.' },
          ]);
        }

        // Subsequent visits
        if (mood === 'hollow' || mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Through the line. A plate. You eat. Same as before.' },
            { weight: ctx.state.lerp01(ser, 50, 25), value: 'You know the routine now. Tray, line, table. You eat without tasting much. Your body gets what it needed.' },
          ]);
        }
        if (hunger === 'starving' || hunger === 'very_hungry') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You\'ve been here before. You go through the line, you sit, and you eat faster than you mean to. The food is hot. That\'s enough.' },
            { weight: ctx.state.lerp01('adenosine', 50, 75) * ctx.state.adenosineBlock(), value: 'Through the line, a seat, and then you eat. Your hands settle once there\'s a plate in front of them.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'The usual. A plate, a seat, a meal. You know the rhythm now. You eat and watch the room and then you leave.' },
          { weight: 1, value: 'You go through the line. Eat. The woman who ladles the soup nods at you — you\'ve been here enough that she recognizes you. You nod back.' },
          { weight: ctx.state.lerp01(ser, 60, 35), value: 'A plate of food and a seat. You eat it. There\'s something almost comfortable about the routine of it now, if you don\'t examine it too closely.' },
        ]);
      },
    },

    use_toilet_soup_kitchen: {
      id: 'use_toilet_soup_kitchen',
      label: 'Use bathroom',
      location: 'soup_kitchen',
      available: () => ['aware', 'urgent', 'pressing'].includes(ctx.state.bladderNeedTier()),
      execute: () => {
        const need = ctx.state.bladderNeedTier();
        const visits = ctx.state.get('soup_kitchen_visits');
        ctx.state.voidBladder();
        ctx.state.adjustStress(-2);
        ctx.state.advanceTime(4);

        const aden = ctx.state.get('adenosine');
        const mood = ctx.state.moodTone();

        if (need === 'pressing') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The bathroom is through the back. You find it, take a minute. The relief is real.' },
            { weight: visits > 2 ? 1 : 0, value: 'You know where the bathroom is by now. You go. The relief is significant.' },
            { weight: ctx.state.lerp01('adenosine', 50, 80), value: 'Through the kitchen corridor. The bathroom is small and well-used. You don\'t care. The relief is physical and total.' },
          ]);
        }
        if (need === 'urgent') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'A minute away from the dining room. The relief is real.' },
            { weight: ctx.state.lerp01('adenosine', 60, 90), value: 'The bathroom in the back. Basic, clean enough. You go and come back.' },
            { weight: (mood === 'heavy' || mood === 'hollow') ? 0.8 : 0, value: 'A few minutes alone. The bathroom is plain. You wash your hands and return.' },
          ]);
        }
        // aware
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You use the bathroom. Done in a few minutes.' },
          { weight: ctx.state.lerp01('adenosine', 60, 90), value: 'Through the back. Quick. Done.' },
          { weight: visits > 0 ? 0.7 : 0, value: 'You know the way. A brief detour, then back.' },
        ]);
      },
    },

    // === FOOD BANK ===
    receive_bag: {
      id: 'receive_bag',
      label: 'Wait for a bag',
      location: 'food_bank',
      available: () => {
        const hour = ctx.state.getHour();
        const day = ctx.state.getDay();
        const lastDay = ctx.state.get('last_food_bank_day');
        return hour >= 9 && hour < 17
          && ctx.state.isWorkday()
          && (lastDay === 0 || day - lastDay >= 7);
      },
      execute: () => {
        ctx.state.set('fridge_food', Math.min(6, ctx.state.get('fridge_food') + 3));
        ctx.state.set('pantry_food', Math.min(3, ctx.state.get('pantry_food') + 2));
        ctx.state.set('last_food_bank_day', ctx.state.getDay());
        ctx.state.set('food_bank_visits', ctx.state.get('food_bank_visits') + 1);
        ctx.state.advanceTime(40);
        ctx.events.record('received_food_bank_bag');

        const visits = ctx.state.get('food_bank_visits');
        const mood = ctx.state.moodTone();
        const ser = ctx.state.get('serotonin');

        if (visits === 1) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You wait. A volunteer calls your name, or a number, and hands you a bag. Canned goods, bread, whatever they have this week. You carry it home.' },
            { weight: 1, value: 'You sign in and you wait and eventually someone brings a bag out. It\'s heavier than you expected. You take it and go.' },
            { weight: ctx.state.lerp01(ser, 50, 25), value: 'You wait in a plastic chair until they call you. A bag: bread, a few cans, some pasta. Enough. You walk out carrying it and you don\'t look at anyone.' },
          ]);
        }

        if (mood === 'hollow' || mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You wait, you get the bag, you leave. Same as before.' },
            { weight: ctx.state.lerp01(ser, 50, 20), value: 'The wait. The bag. You carry it home. It has what it has.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You know the wait by now. When your name comes, you go up and take the bag. Bread, cans, whatever they had. You carry it home.' },
          { weight: 1, value: 'The usual wait, the usual bag. Heavier some weeks than others. This week it\'s decent.' },
          { weight: ctx.state.lerp01(ser, 60, 35), value: 'You sit and wait and get the bag. There\'s a rhythm to it now — not comfortable exactly, but known. You carry it home.' },
        ]);
      },
    },

    use_toilet_food_bank: {
      id: 'use_toilet_food_bank',
      label: 'Use bathroom',
      location: 'food_bank',
      available: () => ['aware', 'urgent', 'pressing'].includes(ctx.state.bladderNeedTier()),
      execute: () => {
        const need = ctx.state.bladderNeedTier();
        ctx.state.voidBladder();
        ctx.state.adjustStress(-2);
        ctx.state.advanceTime(4);

        const aden = ctx.state.get('adenosine');
        const mood = ctx.state.moodTone();

        if (need === 'pressing') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You ask one of the volunteers. They point you down the hall. The relief is significant.' },
            { weight: ctx.state.lerp01('adenosine', 50, 80), value: 'The bathroom is down a short corridor. Single stall. You go. The relief comes all at once.' },
            { weight: ctx.state.lerp01('serotonin', 40, 20), value: 'A small, necessary detour. The bathroom is plain and clean. The relief is real in proportion to how long you were holding it.' },
          ]);
        }
        if (need === 'urgent') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You use the bathroom down the hall. A few minutes. Done.' },
            { weight: ctx.state.lerp01('adenosine', 60, 90), value: 'The single-stall bathroom. Clean, institutional. You go and come back.' },
            { weight: (mood === 'heavy' || mood === 'hollow') ? 0.8 : 0, value: 'A brief pause. The bathroom is quiet. You wash your hands and return to your place in line.' },
          ]);
        }
        // aware
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You use the bathroom. Back in a few minutes.' },
          { weight: ctx.state.lerp01('adenosine', 60, 90), value: 'A quick detour. Done.' },
          { weight: 0.6, value: 'The bathroom down the hall. Small, plain. Your body gets what it needed.' },
        ]);
      },
    },

    // === PHONE MODE ===
    read_messages: {
      id: 'read_messages',
      label: 'Messages',
      location: null,
      available: () => ctx.state.get('viewing_phone') && ctx.state.hasUnreadMessages(),
      execute: () => {
        // Battery death check
        if (ctx.state.get('phone_battery') <= 0) {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }

        const unread = ctx.state.getUnreadMessages();
        ctx.state.markMessagesRead();
        ctx.state.advanceTime(2);

        const parts = [];
        for (const msg of unread) {
          parts.push(msg.text);
          // Apply per-type effects
          if (msg.type === 'friend') {
            ctx.state.adjustSocial(3); // Approximation debt: +3 social chosen
            // Reading a friend's message = contact. Reset timer, reduce guilt.
            if (msg.source) {
              const fc = ctx.state.get('friend_contact');
              fc[msg.source] = ctx.state.get('time');
              ctx.state.adjustSentiment(msg.source, 'guilt', -0.02);
            }
          }
          else if (msg.type === 'paycheck') {
            ctx.state.adjustStress(-3);
            ctx.state.glanceMoney();
          }
          else if (msg.type === 'bill') {
            if (msg.paid === false) {
              ctx.state.adjustStress(8);
            } else {
              ctx.state.adjustStress(3);
            }
            ctx.state.glanceMoney();
          }
          else if (msg.type === 'bank') ctx.state.glanceMoney();
          else if (msg.type === 'work') ctx.state.adjustStress(3);
        }

        return parts.join('\n\n');
      },
    },

    toggle_phone_silent: {
      id: 'toggle_phone_silent',
      label: 'Silence it',
      location: null,
      available: () => ctx.state.get('viewing_phone'),
      execute: () => {
        // Battery death check
        if (ctx.state.get('phone_battery') <= 0) {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }

        const wasSilent = ctx.state.get('phone_silent');
        ctx.state.set('phone_silent', !wasSilent);
        if (wasSilent) {
          return 'Sound on. You\'ll hear it now.';
        }
        return 'Silent. Whatever comes, it comes quietly.';
      },
    },

    put_phone_away: {
      id: 'put_phone_away',
      label: 'Put it away',
      location: null,
      available: () => ctx.state.get('viewing_phone'),
      execute: () => {
        ctx.state.set('viewing_phone', false);
        ctx.state.set('phone_screen', 'home');
        ctx.state.set('phone_thread_contact', null);
        const location = ctx.world.getLocationId();
        const descFn = /** @type {Record<string, (() => string) | undefined>} */ (locationDescriptions)[location];
        return descFn ? descFn() : '';
      },
    },

    reply_to_friend: {
      id: 'reply_to_friend',
      label: 'Reply',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.get('phone_battery') <= 0) return false;
        const thread = ctx.state.get('phone_thread_contact');
        if (!thread || !['friend1', 'friend2'].includes(thread)) return false;
        const inbox = ctx.state.get('phone_inbox');
        if (!inbox.some(m => m.source === thread && !m.read)) return false;
        const pending = ctx.state.get('pending_replies') || [];
        if (pending.some(r => r.slot === thread)) return false;
        return true;
      },
      execute: () => {
        if (ctx.state.get('phone_battery') <= 0) {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        const target = getReplyTarget();
        if (!target) return '';
        const { slot, friend } = target;

        // 1 RNG call: reply prose
        const replyText = friendReplyProse[friend.flavor](friend.name);
        // 1 RNG call: friend's response text (generated now, delivered later)
        const responseText = friendReplyMessages[friend.flavor](friend.name);
        // 1 RNG call: arrival delay
        const delay = ctx.timeline.randomInt(30, 90);
        ctx.state.addPendingReply({ slot, arrivesAt: ctx.state.get('time') + delay, text: responseText });

        // Store sent message in inbox for thread view
        ctx.state.addPhoneMessage({ type: 'sent', source: slot, text: replyText, read: true, direction: 'sent' });

        // Reset contact timer, reduce guilt more than just reading does
        const fc = ctx.state.get('friend_contact');
        fc[slot] = ctx.state.get('time');
        ctx.state.adjustSentiment(slot, 'guilt', -0.06);
        ctx.state.adjustSocial(3); // Approximation debt: +3 social chosen

        ctx.state.advanceTime(5);
        ctx.state.adjustBattery(-1);

        return replyText;
      },
    },

    message_friend: {
      id: 'message_friend',
      label: 'Write',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.get('phone_battery') <= 0) return false;
        const thread = ctx.state.get('phone_thread_contact');
        if (!thread || !['friend1', 'friend2'].includes(thread)) return false;
        const inbox = ctx.state.get('phone_inbox');
        if (inbox.some(m => m.source === thread && !m.read)) return false; // has unread → use reply
        const pending = ctx.state.get('pending_replies') || [];
        if (pending.some(r => r.slot === thread)) return false;
        return true;
      },
      execute: () => {
        if (ctx.state.get('phone_battery') <= 0) {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        const target = getInitiateTarget();
        if (!target) return '';
        const { slot, friend } = target;

        // 1 RNG call: initiation prose
        const initiateText = friendInitiateProse[friend.flavor](friend.name);
        // 1 RNG call: friend's response (generated now, delivered later)
        const responseText = friendInitiateMessages[friend.flavor](friend.name);
        // 1 RNG call: arrival delay
        const delay = ctx.timeline.randomInt(30, 90);
        ctx.state.addPendingReply({ slot, arrivesAt: ctx.state.get('time') + delay, text: responseText });

        // Store sent message in inbox for thread view
        ctx.state.addPhoneMessage({ type: 'sent', source: slot, text: initiateText, read: true, direction: 'sent' });

        // Reset contact timer, reduce guilt
        const fc = ctx.state.get('friend_contact');
        fc[slot] = ctx.state.get('time');
        ctx.state.adjustSentiment(slot, 'guilt', -0.06);
        ctx.state.adjustSocial(2); // Approximation debt: +2 social chosen

        ctx.state.advanceTime(5);
        ctx.state.adjustBattery(-1);

        return initiateText;
      },
    },

    help_friend: {
      id: 'help_friend',
      label: 'Help',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.get('phone_battery') <= 0) return false;
        const thread = ctx.state.get('phone_thread_contact');
        if (!thread || !['friend1', 'friend2'].includes(thread)) return false;
        const inbox = ctx.state.get('phone_inbox');
        if (!inbox.some(m => m.source === thread && !m.read && m.subtype === 'in_need')) return false;
        const pending = ctx.state.get('pending_replies') || [];
        if (pending.some(r => r.slot === thread)) return false;
        if (!ctx.state.canAfford(1)) return false;
        return true;
      },
      execute: (data = {}) => {
        if (ctx.state.get('phone_battery') <= 0) {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        const thread = ctx.state.get('phone_thread_contact');
        if (!thread) return '';
        const friend = ctx.character.get(thread);
        if (!friend) return '';
        const slot = thread;
        const mood = ctx.state.moodTone();
        const flavor = friend.flavor || 'warm_quiet';

        // Amount is player-entered (live play via phone UI input) or recorded in action data (replay)
        const amount = Math.min(Math.round(data.amount || 0), Math.floor(ctx.state.get('money')));
        if (amount <= 0) return '';

        // 1 RNG call: player's reply
        const playerPools = {
          heavy:   [
            { weight: 1, value: 'of course. just sent.' },
            { weight: 1, value: 'sent. don\'t worry about it.' },
          ],
          hollow:  [
            { weight: 1, value: 'sent. i hope it helps.' },
            { weight: 1, value: 'just sent it.' },
          ],
          fraying: [
            { weight: 1, value: 'of course. sent.' },
            { weight: 1, value: 'yeah. sent.' },
          ],
          flat:    [
            { weight: 1, value: 'yeah, of course. just sent it.' },
            { weight: 1, value: 'sent. let me know if you need more.' },
          ],
          okay:    [
            { weight: 1, value: 'of course! just sent.' },
            { weight: 1, value: 'yeah, sent! hope it helps.' },
          ],
        };
        const playerText = ctx.timeline.weightedPick(playerPools[mood] || playerPools.flat);

        // 1 RNG call: friend's thanks (quick — they were waiting)
        const thanksPools = {
          sends_things: [
            { weight: 1, value: 'thank you so much. you\'re a lifesaver.' },
            { weight: 1, value: 'i can\'t thank you enough. seriously.' },
          ],
          dry_humor: [
            { weight: 1, value: 'you\'re better than i deserve. thank you.' },
            { weight: 1, value: 'okay i owe you one. thank you.' },
          ],
          warm_quiet: [
            { weight: 1, value: 'thank you. i really mean it.' },
            { weight: 1, value: 'you didn\'t have to do that. thank you.' },
          ],
          checking_in: [
            { weight: 1, value: 'thank you so much. are you doing okay?' },
            { weight: 1, value: 'i really appreciate it. how are you holding up?' },
          ],
        };
        const thanksText = ctx.timeline.weightedPick(thanksPools[flavor] || thanksPools.warm_quiet);

        // 1 RNG call: delay (short — they respond fast when they're the one waiting)
        const delay = ctx.timeline.randomInt(5, 20);

        ctx.state.adjustMoney(-amount);
        ctx.state.addPendingReply({ slot, arrivesAt: ctx.state.get('time') + delay, text: thanksText });
        ctx.state.addPhoneMessage({ type: 'sent', source: slot, text: playerText, read: true, direction: 'sent' });
        ctx.state.markMessagesRead();

        // Build warmth, reset contact timer, reduce guilt
        ctx.state.adjustSentiment(slot, 'warmth', 0.05);
        const fc = ctx.state.get('friend_contact');
        fc[slot] = ctx.state.get('time');
        ctx.state.adjustSentiment(slot, 'guilt', -0.04);

        ctx.state.advanceTime(3);
        ctx.state.adjustBattery(-1);

        return playerText;
      },
    },

    ask_for_help: {
      id: 'ask_for_help',
      label: 'Ask for help',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.get('phone_battery') <= 0) return false;
        const thread = ctx.state.get('phone_thread_contact');
        if (!thread || !['friend1', 'friend2'].includes(thread)) return false;
        const mt = ctx.state.moneyTier();
        if (mt !== 'broke' && mt !== 'scraping') return false;
        const pending = ctx.state.get('pending_replies') || [];
        if (pending.some(r => r.slot === thread)) return false;
        // 7-day cooldown — asking for money puts a real cost on the friendship
        const lastAsked = ctx.state.get('last_asked_for_help_time');
        if (lastAsked > 0 && ctx.state.get('time') - lastAsked < 7 * 24 * 60) return false;
        return true;
      },
      execute: () => {
        if (ctx.state.get('phone_battery') <= 0) {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        const thread = ctx.state.get('phone_thread_contact');
        if (!thread) return '';
        const friend = ctx.character.get(thread);
        if (!friend) return '';
        const slot = thread;
        const mood = ctx.state.moodTone();

        // 1 RNG call: player's sent message
        const sentPools = {
          heavy:  [
            { weight: 1, value: 'hey. sorry to ask. i\'m struggling right now. any chance you could help?' },
            { weight: 1, value: 'i hate to bother you. things are really hard. could you maybe send a little?' },
          ],
          hollow: [
            { weight: 1, value: 'hey. i\'m kind of stuck. sorry to ask but i need help.' },
            { weight: 1, value: 'hey. it\'s bad right now. any chance?' },
          ],
          fraying: [
            { weight: 1, value: 'things got kind of bad. any chance you could send a little money?' },
            { weight: 1, value: 'hey, not sure if you can, but i could really use some help right now.' },
          ],
          flat:   [
            { weight: 1, value: 'hey, any chance you could float me some money? kind of short right now.' },
            { weight: 1, value: 'hey. i hate to ask, but i\'m pretty stuck financially.' },
          ],
          okay:   [
            { weight: 1, value: 'hey, kind of embarrassing, but i need some help. any chance?' },
            { weight: 1, value: 'hey, not sure if you have it, but things are tight. could you help me out?' },
          ],
        };
        const sentText = ctx.timeline.weightedPick(sentPools[mood] || sentPools.flat);

        // Help probability: flavor base + warmth bonus - repeat penalty + broke urgency
        const flavor = friend.flavor || 'warm_quiet';
        const flavorBase = { sends_things: 0.70, warm_quiet: 0.65, checking_in: 0.60, dry_humor: 0.55 };
        const warmth = ctx.state.sentimentIntensity(slot, 'warmth');
        const askCounts = ctx.state.get('asked_for_help_count');
        const askCount = (askCounts[slot] ?? 0);
        const brokeBonus = ctx.state.moneyTier() === 'broke' ? 0.05 : 0;
        const helpProb = Math.max(0.10, Math.min(0.92,
          (flavorBase[flavor] ?? 0.60) + warmth * 0.25 - askCount * 0.10 + brokeBonus));
        const helpWeight = Math.max(1, Math.round(helpProb * 10));
        const declineWeight = Math.max(1, 10 - helpWeight);

        const helpResponses = {
          sends_things: [
            'oh no, of course — just sent it. let me know if you need more.',
            'yeah i\'ve got you. sending you something right now.',
          ],
          dry_humor: [
            'you\'re lucky i like you. sent.',
            'don\'t make a habit of this. sent.',
          ],
          warm_quiet: [
            'of course. just sent. please don\'t hesitate to ask.',
            'sent. i\'ve been there. it\'s okay.',
          ],
          checking_in: [
            'oh! yes of course, sending it now. are you okay?',
            'already sent — and call me if you need anything, okay?',
          ],
        };
        const declineResponses = {
          sends_things: [
            'ugh, i\'m so sorry, i\'m really tight this month too :(',
            'i wish i could, i really do. it\'s just not a good month.',
          ],
          dry_humor: [
            'you picked the wrong week. i\'m broke too, weirdly.',
            'i genuinely don\'t have it right now. sorry.',
          ],
          warm_quiet: [
            'i\'m sorry, i really am. i can\'t right now. i\'m thinking of you though.',
            'i don\'t have it to spare right now. i\'m so sorry.',
          ],
          checking_in: [
            'i would if i could. i\'m kind of in the same boat right now. are you okay?',
            'i\'m so sorry, i can\'t right now. please tell me if there\'s anything else i can do.',
          ],
        };

        // 1 RNG call: friend's response (outcome + text combined in weighted pool)
        const responsePool = [
          ...(helpResponses[flavor] || helpResponses.warm_quiet).map(text => ({ weight: helpWeight, value: { text, helps: true } })),
          ...(declineResponses[flavor] || declineResponses.warm_quiet).map(text => ({ weight: declineWeight, value: { text, helps: false } })),
        ];
        const responseItem = ctx.timeline.weightedPick(responsePool);

        // 1 RNG call: arrival delay
        const delay = ctx.timeline.randomInt(30, 90);

        // 1 RNG call: variable amount if helping (flavor-based range), balance otherwise
        let amount = 0;
        if (responseItem.helps) {
          const flavorRange = { sends_things: [15, 40], warm_quiet: [15, 30], checking_in: [10, 25], dry_humor: [10, 20] };
          const [amtMin, amtMax] = flavorRange[flavor] ?? [10, 25];
          amount = ctx.timeline.randomInt(amtMin, amtMax);
        } else {
          ctx.timeline.random(); // balance: always 4 RNG calls total
        }

        /** @type {{ slot: string, arrivesAt: number, text: string, effect?: { type: 'receiveMoney', amount: number } }} */
        const pendingReply = { slot, arrivesAt: ctx.state.get('time') + delay, text: responseItem.text };
        if (responseItem.helps) {
          pendingReply.effect = { type: 'receiveMoney', amount };
        }
        ctx.state.addPendingReply(pendingReply);

        // Store sent message in inbox
        ctx.state.addPhoneMessage({ type: 'sent', source: slot, text: sentText, read: true, direction: 'sent' });

        // Reset contact timer, reduce guilt, track ask, set cooldown
        const fc = ctx.state.get('friend_contact');
        fc[slot] = ctx.state.get('time');
        ctx.state.adjustSentiment(slot, 'guilt', -0.04);
        askCounts[slot] = askCount + 1;
        ctx.state.set('last_asked_for_help_time', ctx.state.get('time'));

        ctx.state.advanceTime(5);
        ctx.state.adjustBattery(-1);

        return sentText;
      },
    },
  };

  // --- Phone mode ---

  /**
   * Generate incoming messages based on elapsed time since last check.
   * Called once per action/move, after event checks.
   * Returns true if any new message arrived (for buzz notification).
   * @returns {boolean}
   */
  function generateIncomingMessages() {
    const now = ctx.state.get('time');
    const last = ctx.state.get('last_msg_gen_time');
    const elapsed = Math.max(0, now - last);
    ctx.state.set('last_msg_gen_time', now);

    if (elapsed <= 0) return false;

    let added = false;

    // --- Friend messages (RNG-consuming) ---
    const friend1 = ctx.character.get('friend1');
    const friend2 = ctx.character.get('friend2');
    const socialT = ctx.state.socialTier();
    const socialLow = socialT === 'withdrawn' || socialT === 'isolated';

    const friendSlots = [
      { friend: friend1, slot: 'friend1' },
      { friend: friend2, slot: 'friend2' },
    ];
    for (const { friend, slot } of friendSlots) {
      let multiplier;
      switch (friend.flavor) {
        case 'sends_things': multiplier = 0.007; break;
        case 'checks_in':    multiplier = socialLow ? 0.008 : 0.004; break;
        case 'dry_humor':    multiplier = 0.004; break;
        case 'earnest':      multiplier = 0.003; break;
        default:             multiplier = 0.004;
      }
      const prob = elapsed * multiplier;
      // Two RNG calls per friend: chance + text pick
      if (ctx.timeline.chance(prob)) {
        // friendMessages uses ctx.timeline.pick internally (1 RNG call)
        // friendIsolatedMessages does not — consume RNG to stay consistent
        if (socialLow) {
          ctx.timeline.random(); // balance RNG consumption
          const msgFn = friendIsolatedMessages[friend.flavor];
          const text = /** @type {(name: string) => string} */ (msgFn)(friend.name);
          if (text) {
            ctx.state.addPhoneMessage({ type: 'friend', text, read: false, source: slot });
            added = true;
          }
        } else {
          const msgFn = friendMessages[friend.flavor];
          const text = /** @type {(name: string) => string} */ (msgFn)(friend.name);
          if (text) {
            ctx.state.addPhoneMessage({ type: 'friend', text, read: false, source: slot });
            added = true;
          }
        }
      } else {
        // Consume matching RNG even on miss (text pick uses 1 call)
        ctx.timeline.random();
      }
    }

    // --- Friend in-need messages (RNG-consuming, rare, 14-day minimum gap per friend) ---
    // A friend who needs help reaches out. Player can respond with help_friend.
    // Always 2 RNG calls per friend (chance + text or balance) regardless of outcome.
    const inNeedLast = ctx.state.get('friend_in_need_last');
    for (const { friend: inNeedFriend, slot: inNeedSlot } of friendSlots) {
      const lastInNeed = inNeedLast[inNeedSlot] ?? 0;
      const eligible = (now - lastInNeed) >= 14 * 24 * 60;
      if (ctx.timeline.chance(eligible ? 0.003 : 0)) {
        // Only generate if no unread in-need message already exists from this friend
        const inbox = ctx.state.get('phone_inbox');
        const alreadyPending = inbox.some(m => m.source === inNeedSlot && !m.read && m.subtype === 'in_need');
        if (!alreadyPending) {
          const inNeedPools = {
            sends_things: [
              { weight: 1, value: 'hey, any chance you can help? things are kind of rough right now.' },
              { weight: 1, value: 'this is embarrassing but i\'m really short this month. any chance?' },
            ],
            dry_humor: [
              { weight: 1, value: 'okay so, slightly embarrassing. do you have like $10-15 you could send?' },
              { weight: 1, value: 'you\'re going to make fun of me but i\'m kind of broke. can you help?' },
            ],
            warm_quiet: [
              { weight: 1, value: 'hey... i hate to ask. things are really hard right now. any chance?' },
              { weight: 1, value: 'i wouldn\'t ask if i wasn\'t stuck. any chance you could help me out?' },
            ],
            checking_in: [
              { weight: 1, value: 'i don\'t know who else to ask. i\'m kind of stuck. can you help me out?' },
              { weight: 1, value: 'hey, i hate asking this. things got rough. any chance you can spare something?' },
            ],
          };
          const pool = inNeedPools[inNeedFriend.flavor] || inNeedPools.warm_quiet;
          const text = ctx.timeline.weightedPick(pool); // 2nd RNG call (fire path)
          ctx.state.addPhoneMessage({ type: 'friend', source: inNeedSlot, text, read: false, subtype: 'in_need' });
          inNeedLast[inNeedSlot] = now;
          added = true;
        } else {
          ctx.timeline.random(); // balance: 2nd RNG call (fire path, already pending)
        }
      } else {
        ctx.timeline.random(); // balance: 2nd RNG call (miss path)
      }
    }

    // --- Work nag (deterministic trigger, no RNG) ---
    const minutesLate = ctx.state.latenessMinutes();
    if (minutesLate >= 30 && !ctx.state.get('at_work_today') && !ctx.state.get('called_in') && !ctx.state.get('work_nagged_today')) {
      ctx.state.set('work_nagged_today', true);
      const supervisor = ctx.character.get('supervisor');
      ctx.state.addPhoneMessage({
        type: 'work',
        source: 'supervisor',
        text: `A message from ${supervisor.name}. "Everything okay?" Which means: where are you.`,
        read: false,
      });
      added = true;
    }

    // --- Financial cycle triggers (deterministic, no RNG) ---
    // Paycheck, rent, utilities, phone bill — all on character-specific schedules.
    // Amounts and offsets derive from character backstory.
    const day = ctx.state.getDay();

    // Paycheck — every 14 days, offset stored in state from character
    const paycheckOffset = ctx.state.get('paycheck_day_offset');
    if (day > 1 && day % 14 === paycheckOffset % 14 && ctx.state.get('last_paycheck_day') !== day) {
      ctx.state.set('last_paycheck_day', day);
      const payRate = ctx.state.get('pay_rate');
      const daysWorked = ctx.state.get('days_worked_this_period');
      const pay = Math.round(payRate * Math.min(daysWorked, 10) / 10 * 100) / 100;
      const wasBroke = ctx.state.moneyTier() === 'broke' || ctx.state.moneyTier() === 'scraping';

      if (pay > 0) {
        const shortPay = daysWorked < 10;
        const text = shortPay
          ? 'Direct deposit. Less than usual.'
          : 'Direct deposit.';
        ctx.state.receiveMoney(pay, 'paycheck', text);
        added = true;
        // Paycheck when broke gives tiny anxiety relief
        if (wasBroke) {
          ctx.state.adjustSentiment('money', 'anxiety', -0.01);
        }
      }
      ctx.state.set('days_worked_this_period', 0);
    }

    // Rent — every 30 days, offset stored in state from character
    const rentOffset = ctx.state.get('rent_day_offset');
    if (day > 1 && day % 30 === rentOffset % 30 && ctx.state.get('last_rent_day') !== day) {
      ctx.state.set('last_rent_day', day);
      ctx.state.deductBill(ctx.state.get('rent_amount'), 'rent');
      added = true;
    }

    // Utilities — every 30 days
    const utilityOffset = ctx.state.get('utility_day_offset');
    if (day > 1 && day % 30 === utilityOffset % 30 && ctx.state.get('last_utility_day') !== day) {
      ctx.state.set('last_utility_day', day);
      ctx.state.deductBill(65, 'utilities');
      added = true;
    }

    // Phone bill — every 30 days
    const phoneOffset = ctx.state.get('phone_bill_day_offset');
    if (day > 1 && day % 30 === phoneOffset % 30 && ctx.state.get('last_phone_bill_day') !== day) {
      ctx.state.set('last_phone_bill_day', day);
      ctx.state.deductBill(45, 'phone');
      added = true;
    }

    // EBT/SNAP — monthly benefit reload
    const ebtMonthly = ctx.state.get('ebt_monthly_amount');
    const ebtOffset = ctx.state.get('ebt_day_offset');
    if (ebtMonthly > 0 && day > 1 && day % 30 === ebtOffset % 30 && ctx.state.get('last_ebt_day') !== day) {
      ctx.state.set('last_ebt_day', day);
      ctx.state.receiveEbt(ebtMonthly);
      added = true;
    }

    // --- Pending friend replies (deterministic, no RNG) ---
    const pendingReplies = ctx.state.get('pending_replies');
    if (pendingReplies && pendingReplies.length > 0) {
      const remaining = [];
      for (const reply of pendingReplies) {
        if (reply.arrivesAt <= now) {
          // Apply any effects before delivering the message
          if (reply.effect?.type === 'receiveMoney') {
            ctx.state.receiveMoney(reply.effect.amount);
          }
          ctx.state.addPhoneMessage({ type: 'friend', text: reply.text, read: false, source: reply.slot });
          added = true;
        } else {
          remaining.push(reply);
        }
      }
      ctx.state.set('pending_replies', remaining);
    }

    return added;
  }

  /**
   * Build prose for the phone screen when in phone mode.
   * @returns {string}
   */
  function phoneScreenDescription() {
    const unread = ctx.state.getUnreadMessages();
    const mood = ctx.state.moodTone();

    let desc = '';

    // Time — glance when looking at phone
    ctx.state.glanceTime();
    const timeStr = ctx.state.perceivedTimeString();
    // Sensory tier returns full sentences (already punctuated); others are fragments
    desc += timeStr.endsWith('.') ? timeStr : timeStr + '.';

    // Messages
    if (unread.length > 0) {
      const senders = [];
      // Track which friend slots have unread messages for guilt nudge
      const seenFriendSlots = new Set();
      for (const msg of unread) {
        if (msg.type === 'friend') {
          senders.push('a message');
          // Seeing an unread friend message nudges guilt proportionally
          if (msg.source) {
            if (!seenFriendSlots.has(msg.source)) {
              seenFriendSlots.add(msg.source);
              const guilt = ctx.state.sentimentIntensity(msg.source, 'guilt');
              if (guilt > 0.03) {
                ctx.state.adjustSentiment(msg.source, 'guilt', guilt * 0.02);
              }
            }
          }
        } else if (msg.type === 'work') {
          senders.push('something from work');
        } else if (msg.type === 'bank') {
          senders.push('a bank notification');
        } else if (msg.type === 'paycheck') {
          senders.push('a bank deposit');
        } else if (msg.type === 'bill') {
          senders.push('a bill notification');
        }
      }
      if (senders.length === 1) {
        desc += ' ' + senders[0].charAt(0).toUpperCase() + senders[0].slice(1) + '.';
      } else if (senders.length === 2) {
        desc += ' ' + senders[0].charAt(0).toUpperCase() + senders[0].slice(1) + ', and ' + senders[1] + '.';
      } else {
        desc += ' Notifications. Several of them.';
      }
    } else {
      if (mood === 'hollow' || mood === 'quiet') {
        desc += ' Nothing new. The screen looks at you back.';
      } else if (mood === 'numb') {
        desc += ' Nothing. The screen glows.';
      } else {
        desc += ' Nothing new.';
      }
    }

    // Battery — you notice when it's low, not when it's fine
    const bt = ctx.state.batteryTier();
    if (bt === 'critical') {
      desc += ' Battery\'s red.';
    } else if (bt === 'low') {
      desc += ' Low battery.';
    }

    return desc;
  }

  // --- Call in sick ---
  const callInSick = {
    id: 'call_in',
    label: 'Call in to work',
    location: null,
    available: () => {
      return ctx.state.get('has_phone') && ctx.state.get('phone_battery') > 5
        && !ctx.state.get('at_work_today') && !ctx.state.get('called_in')
        && ctx.state.isWorkHours() && ctx.state.getHour() < 12;
    },
    execute: () => {
      ctx.state.set('called_in', true);
      ctx.state.adjustJobStanding(-8); // Approximation debt: -8 for calling in chosen
      ctx.state.adjustStress(-10);
      ctx.state.advanceTime(5);
      ctx.events.record('called_in_sick');

      const job = ctx.state.jobTier();
      const sick = ctx.state.illnessTier() !== 'healthy';

      if (job === 'at_risk' || job === 'shaky') {
        if (sick) {
          return 'You call. You tell them you\'re sick. The pause on the other end carries more weight than you have energy for right now.';
        }
        return 'You call. The phone rings twice. You say you\'re not coming in. The pause on the other end says more than the words that follow.';
      }
      if (sick) {
        return 'You call in sick. You actually are. They say okay. For once the words are true and you\'re too tired to feel anything about that.';
      }
      return 'You call in. They say okay. It\'s fine. It\'s always fine, until it isn\'t.';
    },
  };

  // --- Events ---

  const eventText = {
    alarm: () => {
      ctx.state.observeTime();  // The alarm clock IS the clock — this is a full observation
      const timeStr = ctx.state.getTimeString();
      const energy = ctx.state.energyTier();
      if (energy === 'depleted' || energy === 'exhausted') {
        return 'The alarm. ' + timeStr + '. That sound. It exists only to tell you that lying here isn\'t an option. Except it is. The snooze button is right there.';
      }
      return 'The alarm goes off. ' + timeStr + '. That sound you picked because you thought you wouldn\'t hate it. You were wrong.';
    },

    late_anxiety: () => {
      ctx.state.adjustStress(5);
      const tier = ctx.state.get('last_surfaced_late_tier');
      if (tier === 'very_late') {
        return 'The time. It\'s still there, pressing against the inside of your ribs. You know. You already know.';
      }
      return 'You\'re aware of the time. The kind of awareness that sits in your chest.';
    },

    hunger_pang: () => {
      const tier = ctx.state.get('last_surfaced_hunger_tier');
      if (tier === 'starving') {
        return 'Your hands feel slow. The thinking narrows. Just the one thing.';
      }
      if (tier === 'very_hungry') {
        return 'The hunger again. Sharper this time. Your body is done being polite about it.';
      }
      // hungry
      const location = ctx.world.getLocationId();
      if (location === 'workplace') {
        return 'Your stomach makes a sound. You glance around to see if anyone heard.';
      }
      return 'A wave of hunger. Not dramatic. Just your body reminding you it\'s there and it needs things.';
    },

    thirst_pang: () => {
      const tier = ctx.state.get('last_surfaced_thirst_tier');
      if (tier === 'parched') {
        return 'Your mouth is dry. The kind of dry that has been building for a while without you noticing.';
      }
      if (tier === 'very_thirsty') {
        return 'There\'s a dryness at the back of your throat. Your body is asking for something.';
      }
      // thirsty
      const location = ctx.world.getLocationId();
      if (location === 'workplace') {
        return 'Your mouth is a little dry. You\'ve been at this a while without stopping.';
      }
      return 'Thirsty. You\'ve been forgetting to drink water again.';
    },

    bladder_pang: () => {
      const tier = ctx.state.get('last_surfaced_bladder_tier');
      if (tier === 'pressing') return 'It\'s become insistent. You need a bathroom.';
      if (tier === 'urgent') return 'Your body is firmer about it now.';
      // aware
      const location = ctx.world.getLocationId();
      if (location === 'workplace') return 'Something to take care of at some point. Not yet urgent.';
      return 'Something to take care of.';
    },

    exhaustion_wave: () => {
      const tier = ctx.state.get('last_surfaced_energy_tier');
      if (tier === 'depleted') {
        return 'Your body is making its case. The argument is getting harder to ignore.';
      }
      // exhausted
      return 'For a second everything feels heavy. Not just your body — the air, the light, the idea of doing the next thing.';
    },

    weather_shift: () => {
      ctx.world.updateWeather();
      const weather = ctx.state.get('weather');
      if (ctx.world.isInside()) {
        if (weather === 'drizzle') {
          return 'Rain starts outside. You hear it on the window.';
        }
        if (weather === 'snow') {
          return 'Snow starts outside. The light through the window changes — that particular white.';
        }
        return '';
      }
      if (weather === 'drizzle') {
        return 'It starts to rain. Not hard. Just enough to matter.';
      }
      if (weather === 'snow') {
        return 'It starts snowing. The noise of the street softens.';
      }
      if (weather === 'clear') {
        return 'The clouds thin. Actual light comes through. It changes the look of everything.';
      }
      return 'The sky shifts. Still grey, but a different grey.';
    },

    coworker_speaks: () => {
      ctx.state.adjustSocial(3); // Approximation debt: +3 social chosen
      const isFirst = ctx.timeline.chance(0.5);
      const slot = isFirst ? 'coworker1' : 'coworker2';
      const coworker = ctx.character.get(slot);

      // Involuntary exposure builds smaller sentiment than chosen interaction
      // Cross-reduction: even involuntary good moments gently challenge irritation, and vice versa
      const mood = ctx.state.moodTone();
      if (mood === 'fraying' || mood === 'numb' || mood === 'heavy') {
        ctx.state.adjustSentiment(slot, 'irritation', 0.01);
        ctx.state.adjustSentiment(slot, 'warmth', -0.003);
      } else {
        ctx.state.adjustSentiment(slot, 'warmth', 0.008);
        ctx.state.adjustSentiment(slot, 'irritation', -0.003);
      }

      return /** @type {(name: string) => string | undefined} */ (coworkerChatter[coworker.flavor])(coworker.name);
    },

    work_task_appears: () => {
      const jobType = ctx.character.get('job_type');
      const fn = /** @type {() => string | undefined} */ (workTaskEvent[jobType] || workTaskEvent.office);
      return fn();
    },

    break_room_noise: () => {
      const jobType = ctx.character.get('job_type');
      const fn = /** @type {() => string | undefined} */ (workAmbientEvent[jobType] || workAmbientEvent.office);
      return fn();
    },

    apartment_sound: () => {
      const time = ctx.state.timePeriod();
      const ne = ctx.state.get('norepinephrine');
      if (time === 'deep_night' || time === 'night') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A pipe knocks somewhere in the wall. The building talking to itself.' },
          { weight: 1, value: 'The fridge hums louder for a moment, then settles.' },
          { weight: 1, value: 'Footsteps above you. Someone else awake.' },
          // High NE at night — sounds are louder, more present
          { weight: ctx.state.lerp01(ne, 45, 70), value: 'A sound. You freeze. The building settles — a creak, a tick, something in the walls. It\'s nothing. You know it\'s nothing. You\'re still listening.' },
        ]);
      }
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'A door shuts somewhere else in the building.' },
        { weight: 1, value: 'Muffled TV from next door. Voices that aren\'t talking to you.' },
        { weight: 1, value: 'The radiator clicks.' },
        // High NE during day — hyper-aware of building sounds
        { weight: ctx.state.lerp01(ne, 50, 70), value: 'Water running through the pipes — upstairs, you think. You track the sound through the wall without meaning to. Your building full of people, all of them doing things.' },
      ]);
    },

    apartment_notice: () => {
      const mess = ctx.mess.tier();
      // Record the tier at which this surfaced — world.js won't fire again until it worsens.
      ctx.state.set('last_surfaced_mess_tier', mess);
      const ser = ctx.state.get('serotonin');
      const aden = ctx.state.get('adenosine');
      const dop = ctx.state.get('dopamine');
      if (mess === 'chaotic' || mess === 'messy') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You notice how cluttered things have gotten. When did that happen.' },
          { weight: 1, value: 'The apartment. You see it for a second the way a visitor would. Then you stop seeing it that way.' },
          { weight: 1, value: 'Everything\'s been here long enough to stop being mess and start just being how it is.' },
          // Low serotonin — it reads as evidence
          { weight: ctx.state.lerp01(ser, 40, 20), value: 'The apartment looks like what it is. A place someone\'s been barely keeping up with. You know because you\'re that person.' },
          // High adenosine (unblocked) — it blurs, then unregisters
          { weight: ctx.state.lerp01(aden, 55, 75) * ctx.state.adenosineBlock(), value: 'You look at the state of things for a second. Then the moment passes and you\'ve stopped registering it.' },
          // Low dopamine — nothing moves toward fixing it
          { weight: ctx.state.lerp01(dop, 40, 20), value: 'You know it needs dealing with. Knowing and doing are in different rooms right now.' },
        ]);
      }
      if (mess === 'cluttered') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A few things out of place. The kind of mess that builds without you deciding to let it.' },
          { weight: 1, value: 'Things where they fell. Things moved somewhere temporary and then stayed.' },
          { weight: 1, value: 'The mess hasn\'t moved. You knew it wouldn\'t.' },
          // Low serotonin — minor disorder registers as more than it is
          { weight: ctx.state.lerp01(ser, 40, 20), value: 'The small disorder of the place catches your eye. It shouldn\'t bother you this much.' },
          // High adenosine (unblocked) — registers then blurs
          { weight: ctx.state.lerp01(aden, 55, 75) * ctx.state.adenosineBlock(), value: 'The mess registers and then doesn\'t. You don\'t have the bandwidth to hold it.' },
        ]);
      }
      return '';
    },

    street_ambient: () => {
      const time = ctx.state.timePeriod();
      const weather = ctx.state.get('weather');
      const ne = ctx.state.get('norepinephrine');
      if (weather === 'snow') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'The snow takes the edge off everything. Muffled street, muffled city.' },
          { weight: 1, value: 'Footsteps in snow — someone else\'s, nearby, then gone.' },
          // High NE — the muffled world still registers
          { weight: ctx.state.lerp01(ne, 45, 65), value: 'The snow quiets most things. Not everything. A car somewhere, a shovel on concrete, your own breath. Quieter, but still there.' },
        ]);
      }
      if (weather === 'drizzle') {
        return 'Car tires on wet road. That specific hiss.';
      }
      if (time === 'morning') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A bus goes past, full of people who look like they\'re still waking up.' },
          { weight: 1, value: 'Someone walks a dog. The dog is more enthusiastic about it than they are.' },
          // High NE — the morning is sharp
          { weight: ctx.state.lerp01(ne, 45, 65), value: 'The morning traffic is louder than it should be. Brakes, engines, a horn somewhere. Each sound is a separate thing hitting you.' },
        ]);
      }
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'Traffic. The city sound that stops being a sound if you live here long enough.' },
        { weight: 1, value: 'A siren, far off. Moving away from you.' },
        // High NE — street sounds register individually
        { weight: ctx.state.lerp01(ne, 45, 65), value: 'A car door. Footsteps. Someone\'s bass through a window. The street is a catalog of sounds and you\'re taking inventory whether you want to or not.' },
      ]);
    },

    someone_passes: () => {
      const social = ctx.state.socialTier();
      const weather = ctx.state.get('weather');
      if (social === 'isolated') {
        return 'Someone walks past. They don\'t see you. You\'re part of the scenery.';
      }
      const ser = ctx.state.get('serotonin');
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'Someone passes, talking on their phone. Fragments of someone else\'s life.' },
        { weight: 1, value: 'A person walks by quickly, somewhere to be.' },
        { weight: 1, value: 'An older woman passes and nods. You nod back. That\'s enough.' },
        // Low serotonin — other people feel far away
        { weight: ctx.state.lerp01(ser, 40, 20), value: 'Someone passes. You watch them go. They have a life — somewhere to be, someone to see. The distance between you and that is a thing you can feel.' },
        // Snow — people are bundled, moving differently
        { weight: weather === 'snow' ? 1.5 : 0, value: 'Someone goes past in a big coat, head down against the cold. Everyone out here looks like they\'re getting somewhere fast.' },
      ]);
    },

    vomit: () => {
      const stomach = ctx.state.stomachTier();
      const location = ctx.world.getLocationId();
      const inBathroom = location === 'apartment_bathroom';
      const aden = ctx.state.get('adenosine');
      const ne = ctx.state.get('norepinephrine');
      const gaba = ctx.state.get('gaba');

      if (stomach === 'empty') {
        // Dry heave — nothing to bring up
        ctx.state.adjustEnergy(-8);
        ctx.state.adjustStress(6);
        ctx.state.set('nausea', Math.max(0, ctx.state.get('nausea') - 8));

        if (inBathroom) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Your body tries to expel something that isn\'t there. You\'re hunched over the toilet, hands braced on the seat, and nothing comes. The heaving is its own particular indignity — all the effort, none of the relief.' },
            { weight: 1, value: 'Dry heaves. Your stomach clenches hard on empty and your throat burns anyway. You wait for it to stop. Eventually it does.' },
            { weight: 1, value: 'You make it to the bathroom. You lean over the toilet and your body goes through the motions with nothing to show for it. The muscles ache after. The nausea doesn\'t really let up.' },
            // High NE — adrenaline sharpness, body crisis registering acutely
            { weight: ctx.state.lerp01(ne, 50, 75), value: 'Everything is very immediate and sharp. Your knuckles are white on the rim of the toilet. Your body is doing something it needs to do and you are along for it, helpless, hyperaware of every muscle.' },
            // High adenosine — dissociation, foggy distance from the body
            { weight: ctx.state.lerp01(aden, 55, 80) * ctx.state.adenosineBlock(), value: 'You\'re in the bathroom somehow. The heaving happens and there\'s a delay between the sensation and registering it — your body running ahead of you, your mind catching up.' },
          ]);
        } else {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The nausea crests and then your body decides — here, now, wherever you are. Dry heaves. Nothing comes up. Your eyes water. You wait until it\'s over.' },
            { weight: 1, value: 'There\'s no time to go anywhere. You bend forward and your stomach clenches on empty, twice, three times. The sounds you make are humiliating. Nothing comes.' },
            { weight: 1, value: 'It hits fast. You go still and breathe through it and your body heaves anyway, on its own timeline. Nothing comes up. The nausea barely shifts.' },
            // Low GABA — loss of control feeling, helplessness
            { weight: ctx.state.lerp01(gaba, 45, 25), value: 'Your body stops being yours for a moment. You can\'t do anything but go with it — the heave, the nothing, the slow return. You had no control over that and it shows.' },
            // High NE — the body crisis as sharp, sensory-acute experience
            { weight: ctx.state.lerp01(ne, 50, 75), value: 'Sudden, total, and there\'s no part of you that isn\'t involved. Dry heaves — your whole body braces and produces nothing. It leaves you shaking.' },
          ]);
        }
      } else {
        // Expulsion — stomach has contents
        const newFullness = Math.max(0, ctx.state.get('stomach_fullness') - 75);
        ctx.state.set('stomach_fullness', newFullness);
        ctx.state.set('ate_today', false);  // food didn't stay down
        ctx.state.set('nausea', Math.max(0, ctx.state.get('nausea') - 25));
        ctx.state.adjustEnergy(-5);
        ctx.state.adjustStress(4);

        if (inBathroom) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You make it to the bathroom in time. You lean over the toilet and your body takes care of the rest. Afterward you sit on the floor for a while with your back against the tub. The nausea has backed off a little. Not gone. Just less.' },
            { weight: 1, value: 'The nausea peaks and then everything comes up, fast and hard. When it\'s over you rinse your mouth at the sink and look at yourself in the mirror for a moment before you look away.' },
            { weight: 1, value: 'It happens quickly. There\'s almost nothing to decide — your body decides for you, and then it\'s over, and you\'re sitting on the bathroom floor, washed out, lighter in a bad way.' },
            // High NE — adrenaline, the body crisis as hyper-acute physical experience
            { weight: ctx.state.lerp01(ne, 50, 75), value: 'Your hands are cold and you\'re sweating slightly and everything comes up at once. The bathroom tiles are very specific while you\'re down there. Afterward your body feels wrong in a new way, hollowed out.' },
            // High adenosine — fog-wrapped, processing delayed
            { weight: ctx.state.lerp01(aden, 55, 80) * ctx.state.adenosineBlock(), value: 'The event happens — bathroom, toilet, the whole of it — and there\'s a layer of fog over it even as it\'s happening. You know what\'s going on. You just can\'t quite be present for it. Afterward you\'re empty and tired.' },
          ]);
        } else {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You don\'t make it anywhere. You bend forward and everything comes up right where you are. When it\'s done you stay still for a moment, hands on your knees, and then you deal with it.' },
            { weight: 1, value: 'There\'s no warning that isn\'t also already happening. It\'s fast and it\'s there and then it\'s over and you\'re standing in a mess of your own making, shaking slightly, stomach clenched around nothing.' },
            { weight: 1, value: 'The nausea spills over all at once. Not here, not like this — but here, like this. You clean up as best you can. You don\'t feel better. You feel emptied out.' },
            // Low GABA — the loss of control landing hard
            { weight: ctx.state.lerp01(gaba, 45, 25), value: 'Your body does what it does and you have no say. Afterward — the shame of the mess, the fact of the location, the way you couldn\'t stop it — you file that away and clean up without thinking about it too hard.' },
            // High NE — the body crisis raw, un-muffled
            { weight: ctx.state.lerp01(ne, 50, 75), value: 'Fast and total and you\'re not in the bathroom. It\'s just — out, all of it, and you\'re left shaking with the after-adrenaline of it, hyper-present in the worst way.' },
          ]);
        }
      }
    },
  };

  // --- Idle thoughts ---

  /** @type {string[]} */
  const recentIdle = [];

  const idleThoughts = () => {
    const mood = ctx.state.moodTone();
    const hunger = ctx.state.hungerTier();
    const energy = ctx.state.energyTier();
    const social = ctx.state.socialTier();
    const location = ctx.world.getLocationId();

    // NT values for continuous prose shading
    const ser = ctx.state.get('serotonin');
    const dop = ctx.state.get('dopamine');
    const ne = ctx.state.get('norepinephrine');
    const gaba = ctx.state.get('gaba');
    const aden = ctx.state.get('adenosine');

    // Helper: wrap a plain string as a weight-1 item
    const w1 = (/** @type {string} */ s) => ({ weight: 1, value: s });

    /** @type {{ weight: number, value: string }[]} */
    const thoughts = [];

    // Mood-based — general texts at weight 1, NT-shaded variants with continuous weights
    if (mood === 'numb') {
      thoughts.push(
        w1('You\'re here. That\'s the whole thought.'),
        w1('Time is passing. You know this because things are slightly different than before.'),
        w1('There\'s a blankness that isn\'t peace and isn\'t pain. Just absence of the energy for either.'),
        w1('You look at your hands. They\'re your hands. That\'s all you\'ve got.'),
        w1('Something should be happening. Nothing is. That\'s the thing about nothing — it keeps going.'),
        w1('Your eyes are open. That counts as being awake, technically.'),
        w1('You\'re aware of the room. The room is not aware of you. Fair enough.'),
        // Low serotonin deepens the numbness toward despair
        { weight: ctx.state.lerp01(ser, 35, 15), value: 'There was a feeling here once. You can\'t remember what it was shaped like.' },
        { weight: ctx.state.lerp01(ser, 35, 15), value: 'You try to care about something. Anything. The effort folds in on itself.' },
        // High adenosine (unblocked) — the numbness is also fog
        { weight: ctx.state.lerp01(aden, 50, 80) * ctx.state.adenosineBlock(), value: 'Your thoughts don\'t finish. They start and then they\'re somewhere else. Or nowhere.' },
        { weight: ctx.state.lerp01(aden, 50, 80) * ctx.state.adenosineBlock(), value: 'The edges of the room are soft. Not comforting. Just indistinct.' },
      );
    } else if (mood === 'hollow') {
      const friend1 = ctx.character.get('friend1');
      thoughts.push(
        w1(`You think about calling ${friend1.name}. You don't pick up the phone.`),
        w1('What would you do if you could do anything. The question doesn\'t even finish forming.'),
        w1('The silence has texture. You\'re learning its patterns.'),
        w1('You had a thought a minute ago. It\'s gone now. It wasn\'t important. Probably.'),
        w1('There\'s a shape where something used to matter. You can feel the outline of it.'),
        w1('You open your mouth to say something, then realize there\'s no one to say it to. And nothing to say.'),
        w1('A memory tries to surface. You let it sink back down.'),
        // Low serotonin — hollow tips toward hopeless
        { weight: ctx.state.lerp01(ser, 40, 20), value: 'The distance between you and everyone else isn\'t measured in miles. It\'s measured in something you can\'t close.' },
        // Low dopamine — can't even want connection
        { weight: ctx.state.lerp01(dop, 40, 20), value: 'You could reach out. The thought is there. It doesn\'t connect to anything that would make your hand move.' },
        // High NE — hollow but wired
        { weight: ctx.state.lerp01(ne, 45, 70), value: 'The quiet isn\'t peaceful. There\'s something underneath it, humming. You can\'t name it but your body knows.' },
      );
    } else if (mood === 'heavy') {
      thoughts.push(
        w1('Everything takes more than it should. Even thinking about doing things.'),
        w1('You stand still for a moment, not deciding. Just not moving yet.'),
        w1('Gravity is personal today. It\'s working harder on you specifically.'),
        w1('You breathe. That\'s happening. You notice it like you notice weather.'),
        w1('The next thing. There\'s always a next thing. You look at it from a distance.'),
        w1('Your body wants to be horizontal. Your life requires you to be vertical. The negotiation continues.'),
        w1('You shift your weight from one foot to the other. That\'s the most you\'ve done in a while.'),
        w1('The thought of doing something and the doing of it — there\'s a gap there. It\'s wider than usual.'),
        // Low serotonin — heavy tilts darker
        { weight: ctx.state.lerp01(ser, 40, 20), value: 'It\'s not that you can\'t. It\'s that the part of you that would want to is somewhere you can\'t reach.' },
        { weight: ctx.state.lerp01(ser, 40, 20), value: 'Your hands are in your lap. They could do things. They don\'t feel like your hands.' },
        // Low GABA — heavy with anxiety underneath
        { weight: ctx.state.lerp01(gaba, 45, 25), value: 'The heaviness has a tremor in it. Not visible. Internal. The weight is there and something under it is vibrating.' },
        // Low dopamine — can't start anything
        { weight: ctx.state.lerp01(dop, 40, 20), value: 'You look at the room. There are things you could do. The list exists somewhere outside you, behind glass.' },
      );
    } else if (mood === 'fraying') {
      thoughts.push(
        w1('Your jaw is clenched. When did that start.'),
        w1('There\'s a tightness behind your eyes. Not a headache. Just proximity to one.'),
        w1('Something small would set you off. You can feel the edge of it.'),
        w1('You catch yourself holding your breath. You let it out. It doesn\'t help much.'),
        w1('Everything is a little too loud. A little too close.'),
        w1('Your shoulders are up near your ears. You force them down. They\'ll be back.'),
        w1('A sound from somewhere. You flinch. It was nothing.'),
        w1('The inside of your skin feels too small for what\'s in there.'),
        // High NE — sensory overload
        { weight: ctx.state.lerp01(ne, 55, 80), value: 'You can hear the light. The hum of whatever makes electricity work. It\'s in the walls and it won\'t stop.' },
        { weight: ctx.state.lerp01(ne, 55, 80), value: 'The texture of your clothes. You can feel every fiber. When did fabric get this loud.' },
        // Low GABA — no brakes
        { weight: ctx.state.lerp01(gaba, 40, 20), value: 'The thing about being wound this tight is there\'s nothing to wind down into. No floor. Just tighter.' },
        // High cortisol — body stress
        { weight: ctx.state.lerp01(ctx.state.get('cortisol'), 60, 85), value: 'Your stomach is a fist. It\'s been a fist. You keep forgetting and then noticing again.' },
      );
    } else if (mood === 'quiet') {
      thoughts.push(
        w1('It\'s quiet. It\'s been quiet. You\'re used to it, which is different from liking it.'),
        w1('You exist in the room. The room exists around you. That\'s the arrangement.'),
        w1('The sound of nothing. It has a frequency, if you listen long enough.'),
        w1('You\'re here. Not going anywhere. Not coming from anywhere. Just here.'),
        w1('A thought starts to form and doesn\'t finish. That\'s fine. It wasn\'t going anywhere.'),
        w1('Somewhere a pipe ticks. Or a wall settles. Something structural, doing what it does.'),
        w1('You notice yourself noticing the quiet. That\'s a layer you didn\'t need.'),
        w1('The stillness has a weight to it. Not heavy. Just present.'),
        // Higher serotonin — quiet edges toward something almost peaceful
        { weight: ctx.state.lerp01(ser, 45, 60), value: 'The quiet doesn\'t need filling. You notice that without reaching for a reason.' },
        // High NE — quiet but watchful
        { weight: ctx.state.lerp01(ne, 45, 65), value: 'Quiet on the outside. Something scanning, underneath. Not anxious exactly. Just — listening for what isn\'t there.' },
        // Low dopamine — quiet bleeds into apathy
        { weight: ctx.state.lerp01(dop, 40, 20), value: 'The quiet is the loudest thing, and you don\'t mind, because minding takes something you don\'t have.' },
      );
    } else if (mood === 'clear' || mood === 'present') {
      thoughts.push(
        w1('Nothing to do. Not in a bad way. Just — nothing.'),
        w1('The light coming through the window is doing something interesting on the wall. You watch it.'),
        w1('A breath that feels like it belongs to you. Not many of those today.'),
        w1('You\'re here. Actually here. Not thinking about being somewhere else.'),
        w1('Your hands are warm. When did that happen.'),
        w1('Something close to okay. You don\'t examine it too closely. Just let it be there.'),
        w1('The ordinary is ordinary. That\'s enough. That\'s more than enough.'),
        // High serotonin — present tips toward genuine warmth
        { weight: ctx.state.lerp01(ser, 55, 75), value: 'For a second the room is just a room and you\'re just in it and that\'s fine. Actually fine.' },
        // Moderate NE — present and noticing
        { weight: ctx.state.lerp01(ne, 35, 55), value: 'You notice the dust in the light. The way it moves. Slow, undirected. Like it has time.' },
        // High dopamine — spark of engagement
        { weight: ctx.state.lerp01(dop, 55, 75), value: 'Something in you wants to do something. Not urgent. Just — the idea of doing has a small pull to it.' },
      );
    } else {
      // flat
      thoughts.push(
        w1('A moment. Nothing happening. Just a moment.'),
        w1('You wait, though you\'re not sure for what.'),
        w1('The day has a shape. You\'re somewhere in the middle of it.'),
        w1('Nothing urgent. Nothing pulling. Just the hum of being somewhere.'),
        w1('You\'re between things. Not in a hurry to get to the next one.'),
        w1('The light is different than it was a while ago. Things shift without you deciding.'),
        w1('You look around. Everything is where you left it.'),
        // Low serotonin — flat is darker than it looks
        { weight: ctx.state.lerp01(ser, 45, 25), value: 'Nothing is wrong. You keep checking. Still nothing wrong. The checking is the closest thing to a feeling.' },
        { weight: ctx.state.lerp01(ser, 45, 25), value: 'You\'re fine. That\'s what you\'d say if someone asked. Fine covers a lot of territory.' },
        // High NE — flat with restless edge
        { weight: ctx.state.lerp01(ne, 45, 65), value: 'You\'re not doing anything but your foot is bouncing. When did it start. You stop it. It starts again.' },
        // Low dopamine — flat and going through motions
        { weight: ctx.state.lerp01(dop, 42, 25), value: 'The day is happening. You\'re technically in it. Participation is a strong word.' },
        // High adenosine (unblocked) — flat is also foggy
        { weight: ctx.state.lerp01(aden, 50, 75) * ctx.state.adenosineBlock(), value: 'Your thoughts keep softening at the edges. Not drifting. Dissolving. Like sugar in water.' },
      );
    }

    // Hunger
    if (hunger === 'starving') {
      thoughts.push(
        w1('Your stomach has stopped asking and started insisting.'),
        w1('The hunger is a dull weight now. Less sharp, more permanent.'),
        w1('You think about food. Then you think about something else. Then food again.'),
        w1('Everything you look at, you evaluate whether it\'s food. Nothing is.'),
        w1('The emptiness in your stomach has its own gravity.'),
      );
    } else if (hunger === 'very_hungry') {
      thoughts.push(
        w1('Food. The thought comes and goes and comes back.'),
        w1('You could eat. The thought has an edge to it.'),
        w1('There\'s a hollowness below your ribs. Not painful. Just insistent.'),
        w1('You swallow. Your body notices there\'s nothing there.'),
      );
    }

    // The nothing option — hungry + broke + no food at home + no EBT
    // Fires when very hungry or starving, money is broke or scraping,
    // fridge is empty, pantry is empty, and EBT balance is also depleted.
    // The compound state of having no available path to food right now.
    {
      const nothingMoney = ctx.state.moneyTier();
      const nothingFridge = ctx.state.fridgeTier();
      const nothingPantry = ctx.state.pantryTier();
      if (
        (hunger === 'very_hungry' || hunger === 'starving') &&
        (nothingMoney === 'broke' || nothingMoney === 'scraping') &&
        nothingFridge === 'empty' &&
        nothingPantry === 'empty' &&
        ctx.state.get('ebt_balance') < 5  // EBT must also be depleted — $5 minimum for buy_groceries
      ) {
        const tp = ctx.state.timePeriod();
        // Late = evening/night when food bank and most stores are closed.
        // Daytime = morning through afternoon when resources are still accessible.
        const isLate = tp === 'evening' || tp === 'night' || tp === 'deep_night';
        const isDaytime = tp === 'morning' || tp === 'late_morning' || tp === 'midday' || tp === 'afternoon';

        // Core thoughts — the body continuing its bureaucratic routines,
        // the specific texture of knowing there is nothing until later.
        thoughts.push(
          { weight: 8, value: 'Your stomach makes a sound. It\'s been doing that.' },
          { weight: 8, value: 'Your body keeps sending the signal. You keep receiving it. Nothing changes.' },
          { weight: 8, value: 'You think about opening the fridge. You already know what\'s in it. You think about it anyway.' },
          { weight: 7, value: 'The math is simple. There is no food. There is no money for food. That\'s the whole equation.' },
          { weight: 7, value: 'There\'s nothing to do about it right now. That\'s the thing. Nothing to do.' },
          // Mind going somewhere else as coping
          { weight: 6, value: 'You find yourself thinking about a specific meal from a long time ago. The thought has no use. You have it anyway.' },
          { weight: 6, value: 'You try to remember the last time you weren\'t thinking about this. You can\'t place it.' },
          // Almost mundane — the settled-in quality
          { weight: 5, value: 'The hunger is just there. Not urgent anymore. Just settled in.' },
        );

        // Time-of-day shading
        if (isLate) {
          thoughts.push(
            { weight: 9, value: 'Everything that could have been done today is done or not. The answer is the same until morning.' },
            { weight: 8, value: 'The food bank opens at nine. That\'s — you do the math. That\'s a long time from now.' },
            { weight: 7, value: 'You could try to sleep through part of it. That\'s the plan. Sleep through some of it.' },
            // Low serotonin makes the late-night wait heavier
            { weight: ctx.state.lerp01(ser, 40, 20) * 7, value: 'The night has a specific quality when you\'re hungry and there\'s nothing to do about it. You\'re in it.' },
          );
        } else if (isDaytime) {
          thoughts.push(
            { weight: 8, value: 'You\'re aware of what time it is and whether the food bank is open and whether you\'ve already been this week.' },
            { weight: 7, value: 'There are places you could go. You\'re running through whether any of them are options right now.' },
          );
        }

        // Mood shading — different registers for the same flat fact
        if (mood === 'heavy' || mood === 'hollow' || mood === 'numb') {
          thoughts.push(
            { weight: 9, value: 'It\'s not dramatic. That\'s the thing. It\'s just — this is what today is.' },
            // Low dopamine — can't even generate the energy to feel bad about it
            { weight: ctx.state.lerp01(dop, 40, 20) * 7, value: 'You don\'t have the bandwidth to feel bad about this right now. That\'s its own kind of mercy.' },
          );
        } else if (mood === 'fraying' || mood === 'flat') {
          thoughts.push(
            { weight: 8, value: 'There\'s nothing to negotiate with. You can\'t work harder at this. There\'s just the waiting.' },
            { weight: 6, value: 'You\'ve been hungry before. Your body knows what to do with it. Neither of you has to like it.' },
          );
        }

        // Cortisol — body registering scarcity as emergency; mind has no action to give it
        thoughts.push(
          { weight: ctx.state.lerp01(ctx.state.get('cortisol'), 55, 80) * 6, value: 'Your body is treating this like a problem that requires action. There is no action. The body doesn\'t adjust for that.' },
        );
      }
    }

    // Energy
    if (energy === 'depleted') {
      thoughts.push(
        w1('Your eyelids are heavy. Everything is heavy.'),
        w1('Sitting down sounds like the best idea anyone ever had.'),
        w1('The distance between you and lying down is a math problem you keep solving.'),
        w1('You blink and it takes longer than it should. Each one a negotiation to reopen.'),
        w1('Your thoughts are moving through something thick. They get there. Eventually.'),
      );
    }

    // Social
    if (social === 'isolated') {
      const friend1 = ctx.character.get('friend1');
      const friend2 = ctx.character.get('friend2');
      const f1thoughts = /** @type {(name: string) => string[]} */ (friendIdleThoughts[friend1.flavor])(friend1.name);
      const f2thoughts = /** @type {(name: string) => string[]} */ (friendIdleThoughts[friend2.flavor])(friend2.name);
      thoughts.push(...f1thoughts.map(w1), ...f2thoughts.map(w1));
    }

    // Friend guilt — fires regardless of social tier
    {
      const f1 = ctx.character.get('friend1');
      const f2 = ctx.character.get('friend2');
      const g1 = ctx.state.sentimentIntensity('friend1', 'guilt');
      const g2 = ctx.state.sentimentIntensity('friend2', 'guilt');
      if (g1 > 0.03) {
        const gThoughts = /** @type {(name: string) => string[]} */ (friendGuiltThoughts[f1.flavor])(f1.name);
        thoughts.push(...gThoughts.map(t => ({ weight: g1 * 8, value: t })));
      }
      if (g2 > 0.03) {
        const gThoughts = /** @type {(name: string) => string[]} */ (friendGuiltThoughts[f2.flavor])(f2.name);
        thoughts.push(...gThoughts.map(t => ({ weight: g2 * 8, value: t })));
      }
    }

    // Financial anxiety
    {
      const moneyAnx = ctx.state.sentimentIntensity('money', 'anxiety');
      if (moneyAnx > 0.05) {
        thoughts.push(
          { weight: moneyAnx * 6, value: 'The bills. You don\'t do the math. You already know the math.' },
          { weight: moneyAnx * 6, value: 'There\'s a number in your head. It\'s not the right number, but it\'s close enough to make your stomach tighten.' },
          { weight: moneyAnx * 4, value: 'Rent is due. Or was due. Or will be. The due dates blur together after a while.' },
        );
        // Upcoming bill awareness
        const bill = ctx.state.nextBillDue();
        if (bill && bill.daysUntil <= 3) {
          const timing = bill.daysUntil === 0 ? 'today' : bill.daysUntil === 1 ? 'tomorrow' : 'in a couple days';
          const label = bill.name === 'rent' ? 'Rent' : 'A bill';
          thoughts.push({ weight: moneyAnx * 8, value: `${label} is due ${timing}. You know the amount. You don\'t say it.` });
        }
        // Upcoming paycheck awareness when tight
        const mt = ctx.state.moneyTier();
        if (mt === 'broke' || mt === 'scraping' || mt === 'tight') {
          const paycheckDays = ctx.state.nextPaycheckDays();
          if (paycheckDays <= 4) {
            const timing = paycheckDays === 0 ? 'today' : paycheckDays === 1 ? 'tomorrow' : `in ${paycheckDays} days`;
            thoughts.push({ weight: moneyAnx * 7, value: `Paycheck ${timing}. The math between now and then is the only math that matters right now.` });
          }
        }
      }
      if (moneyAnx > 0.2) {
        thoughts.push(
          { weight: moneyAnx * 5, value: 'You think about the account balance without checking. The not-checking is its own kind of checking.' },
          { weight: moneyAnx * 5, value: 'Every purchase is a small negotiation. Not with anyone. Just with the feeling in your chest.' },
        );
      }
      // Money fidelity — the experience of knowing-but-not-quite when finances are anxious
      if (moneyAnx > 0.1) {
        const mf = ctx.state.moneyFidelity();
        if (mf === 'rough' || mf === 'qualitative') {
          thoughts.push(
            { weight: moneyAnx * 5, value: 'You try to picture the account balance. You get a shape, not a number. Something in the vicinity of not enough.' },
            { weight: moneyAnx * 4, value: 'You haven\'t checked in a while. You know roughly. Roughly is what you have right now.' },
          );
        } else if (mf === 'approximate') {
          thoughts.push(
            { weight: moneyAnx * 3, value: 'Around something. The number is in your head but it\'s soft at the edges.' },
          );
        }
      }
    }

    // Time fidelity — the experience of not quite knowing when it is
    {
      const tf = ctx.state.timeFidelity();
      const aden = ctx.state.get('adenosine');
      const adWeight = ctx.state.lerp01(aden, 45, 70) * ctx.state.adenosineBlock();
      if (tf === 'sensory') {
        thoughts.push(
          { weight: 3 + adWeight * 4, value: 'You\'ve lost track of the time. Not dramatically. Just — lost it somewhere.' },
          { weight: 2 + adWeight * 3, value: 'You could find out what time it is. You haven\'t needed to yet.' },
          { weight: adWeight * 4, value: 'The light says something. You\'re not translating it into a number.' },
        );
      } else if (tf === 'vague') {
        thoughts.push(
          { weight: 1 + adWeight * 2, value: 'It\'s been a while since you\'ve checked the time. You have a rough idea. Rough is fine.' },
        );
      }
    }

    // Illness — intrusive physical presence when sick
    {
      const illTier = ctx.state.illnessTier();
      if (illTier === 'very_sick') {
        thoughts.push(
          { weight: 10, value: 'You feel bad in the specific, consuming way that makes everything else feel far away.' },
          { weight: 10, value: 'Your body is doing something it shouldn\'t and it wants you to know about it.' },
          { weight: 10, value: 'Being sick alone in your apartment is its own specific texture of bad.' },
          { weight: 8, value: 'The floor looks very far away. You\'re not planning on going there. Just noting it.' },
          { weight: 8, value: 'You try to remember if this is the worst you\'ve felt recently. It might be.' },
        );
      } else if (illTier === 'sick') {
        thoughts.push(
          { weight: 7, value: 'Your body is staging a slow protest. The banners say: lie down.' },
          { weight: 7, value: 'You feel like the physical version of a bad day.' },
          { weight: 6, value: 'Everything takes slightly more than you have right now.' },
          { weight: 5, value: 'Not dramatically sick. Just relentlessly, continuously sick.' },
          { weight: 5, value: 'You try to assess whether you\'re getting better or worse. It\'s hard to tell from inside it.' },
        );
      } else if (illTier === 'unwell') {
        thoughts.push(
          { weight: 4, value: 'Something\'s starting. Or finishing. You can\'t tell yet.' },
          { weight: 4, value: 'You feel like the day before sick.' },
          { weight: 3, value: 'Not quite right. Not quite sick. Somewhere in between.' },
        );
      }
    }

    // Dental pain — persistent background awareness
    {
      const dentalT = ctx.state.dentalTier();
      if (dentalT === 'flare') {
        thoughts.push(
          { weight: 8, value: 'The tooth. Still. Always.' },
          { weight: 7, value: 'You try not to touch it with your tongue. You touch it with your tongue.' },
          { weight: 6, value: 'There is a tooth in your mouth that is having a very bad time.' },
          { weight: 5, value: 'You\'ve been ignoring this for a while now. The tooth is done being ignored.' },
        );
      } else if (dentalT === 'ache') {
        thoughts.push(
          { weight: 5, value: 'The tooth is there. It\'s been there. It\'ll keep being there.' },
          { weight: 4, value: 'You should do something about the tooth. You know what you should do. You know why you haven\'t.' },
          { weight: 3, value: 'The ache is manageable. You\'ve been managing it for a while.' },
        );
      } else if (dentalT === 'dull') {
        thoughts.push(
          { weight: 2, value: 'Somewhere in the back of your mouth, a low dull note.' },
          { weight: 2, value: 'The tooth again. Not bad right now. Just reminding you it\'s there.' },
        );
      }
    }

    // Nausea — physical misery regardless of source
    {
      const nTier = ctx.state.nauseaTier();
      if (nTier === 'severe') {
        thoughts.push(
          { weight: 12, value: 'Your stomach is making its feelings known. Loud. Sustained. You stay very still.' },
          { weight: 10, value: 'The room is fine. Your body is not fine. The two things are happening at the same time.' },
          { weight: 9, value: 'You breathe through your nose slowly. You have a system now. The system helps.' },
          { weight: 8, value: 'If you move too fast you\'ll regret it. You\'ve already established this. You stay still.' },
        );
      } else if (nTier === 'sick') {
        thoughts.push(
          { weight: 7, value: 'Your stomach is unhappy. Not emergency-level unhappy. Just persistently, pointedly unhappy.' },
          { weight: 6, value: 'Something in your gut is lodging a complaint. You acknowledge it. Move slowly.' },
          { weight: 5, value: 'Not great. Your body is doing a thing. You\'re trying not to encourage it.' },
        );
      } else if (nTier === 'queasy') {
        thoughts.push(
          { weight: 3, value: 'Your stomach is doing a thing. Mild. Manageable. Annoying.' },
          { weight: 2, value: 'A low-grade wrongness in your gut. You note it and move on.' },
        );
      }
    }

    // Caffeine withdrawal — background headache pressing in
    {
      const wdTier = ctx.state.withdrawalTier();
      if (wdTier === 'severe') {
        thoughts.push(
          { weight: 10, value: 'The headache is a fact. It\'s been a fact since you woke up. It sits behind your eyes and does not move.' },
          { weight: 8, value: 'You keep registering the headache like it\'s new information. It\'s not new.' },
          { weight: 7, value: 'Everything is slightly worse than it needs to be. The headache is why.' },
        );
      } else if (wdTier === 'moderate') {
        thoughts.push(
          { weight: 6, value: 'There\'s a pressure behind your eyes. Not bad yet. Building.' },
          { weight: 5, value: 'You could use a coffee. More than usual.' },
          { weight: 4, value: 'Something\'s off about the light. Too sharp. Or your head is too tender.' },
        );
      } else if (wdTier === 'mild') {
        thoughts.push(
          { weight: 3, value: 'A mild awareness somewhere behind your eyes. Could be nothing. Probably isn\'t nothing.' },
        );
      }
    }

    // Weekend — the week has a shape; weekends feel different
    if (!ctx.state.isWorkday()) {
      const dow = ctx.state.calendarDate().weekday; // 0=Sun, 6=Sat
      const isSaturday = dow === 6;
      const isSunday = dow === 0;
      const tp = ctx.state.timePeriod();
      const isEarly = tp === 'morning' || tp === 'late_morning';
      const isAfternoon = tp === 'midday' || tp === 'afternoon';
      const isEvening = tp === 'evening' || tp === 'night';

      if (isSaturday) {
        thoughts.push(
          { weight: 3, value: 'Saturday. The word is different in your body than the other days.' },
          { weight: 3, value: 'No alarm. The day just started on its own.' },
          { weight: 3, value: 'The whole day is still there. You haven\'t done anything to it yet.' },
        );
        if (isEarly) {
          thoughts.push(
            { weight: 4, value: 'Saturday morning. There\'s a specific quality to it. The light agrees.' },
            { weight: 3, value: 'You woke up without an alarm. Your body did this on its own. Noted.' },
          );
        } else if (isAfternoon) {
          thoughts.push(
            { weight: 4, value: 'Half the weekend gone. The other half still open. You\'re somewhere in the middle.' },
            { weight: 3, value: 'Saturday afternoon. Technically free. You\'re doing this with it.' },
          );
        } else if (isEvening) {
          thoughts.push(
            { weight: 3, value: 'Saturday night. You\'re aware of it without having plans about it.' },
            { weight: 2, value: 'The evening happening elsewhere, probably. Not here.' },
          );
        }
      } else if (isSunday) {
        thoughts.push(
          { weight: 3, value: 'Sunday has a specific weight. Not quite the week yet. Almost.' },
          { weight: 3, value: 'The last day of the weekend. The math of that is doing something in the back of your head.' },
        );
        if (isEarly) {
          thoughts.push(
            { weight: 4, value: 'Sunday morning. Still a little open. The rest of the day is there.' },
          );
        } else if (isAfternoon) {
          thoughts.push(
            { weight: 4, value: 'Sunday afternoon. The week is right there. You can feel it from here.' },
            { weight: 3, value: 'You think about tomorrow. Then you try not to. Then you think about it again.' },
            // Low serotonin — Sunday dread
            { weight: ctx.state.lerp01(ser, 45, 25) * 5, value: 'Sunday afternoon has a specific texture when things aren\'t good. You\'ve learned it by heart.' },
            { weight: ctx.state.lerp01(ser, 45, 25) * 4, value: 'Tomorrow is going to be whatever it\'s going to be. You already know this. You think about it anyway.' },
          );
        } else if (isEvening) {
          thoughts.push(
            { weight: 5, value: 'Sunday evening. The door to the week is right there.' },
            { weight: 4, value: 'You\'re aware of tomorrow the way you\'re aware of a sound you can\'t quite hear.' },
            // High NE — Sunday evening anxiety
            { weight: ctx.state.lerp01(ne, 45, 70) * 5, value: 'There\'s a particular quality to Sunday night. Your nervous system has its own opinion about Monday.' },
            { weight: ctx.state.lerp01(gaba, 45, 25) * 4, value: 'The week is coming. Your body is already bracing.' },
          );
        }
      }

      // Weekend + heavy mood — nothing to fill the time with
      if (mood === 'heavy' || mood === 'hollow' || mood === 'numb') {
        thoughts.push(
          { weight: 2, value: 'Free day. Free is the wrong word but it\'s the available one.' },
          { weight: 2, value: 'Nothing to do, in the specific way that means nothing is possible.' },
        );
      }
    }

    // Filter out recently shown thoughts (compare .value)
    const fresh = thoughts.filter(t => !recentIdle.includes(t.value));
    const pool = fresh.length > 0 ? fresh : thoughts;
    const picked = ctx.timeline.weightedPick(pool);

    // Track recency — avoid repeats across consecutive idle periods
    if (picked) {
      recentIdle.push(picked);
      while (recentIdle.length > 4) recentIdle.shift();
    }

    return picked;
  };

  // --- Inner voice ---

  /** @type {string[]} */
  const recentInnerVoice = [];

  /**
   * Returns a single inner voice string (the character's self-talk).
   * Called only when innerVoiceTier() !== null.
   * Consumes 1 RNG call via ctx.timeline.weightedPick().
   */
  const innerVoiceThoughts = () => {
    const mood = ctx.state.moodTone();

    const ser = ctx.state.get('serotonin');
    const ne = ctx.state.get('norepinephrine');
    const gaba = ctx.state.get('gaba');
    const aden = ctx.state.get('adenosine');

    const w1 = (/** @type {string} */ s) => ({ weight: 1, value: s });

    /** @type {{ weight: number, value: string }[]} */
    const thoughts = [];

    if (mood === 'numb') {
      thoughts.push(
        w1('You\'re still here.'),
        w1('Nothing\'s coming.'),
        w1('You had something to do. You can\'t remember what.'),
        w1('It doesn\'t matter. That\'s not comforting, it\'s just true.'),
        // Low serotonin deepens the silence
        { weight: ctx.state.lerp01(ser, 35, 15), value: 'You keep waiting to feel something about this. Nothing shows up.' },
        { weight: ctx.state.lerp01(ser, 35, 15), value: 'There\'s no version of this that helps.' },
        // High adenosine (unblocked) — fog as static
        { weight: ctx.state.lerp01(aden, 55, 80) * ctx.state.adenosineBlock(), value: 'The thought was right there.' },
        { weight: ctx.state.lerp01(aden, 55, 80) * ctx.state.adenosineBlock(), value: 'What were you—' },
      );
    } else if (mood === 'hollow') {
      thoughts.push(
        w1('You could text them. You\'re not going to.'),
        w1('There\'s a message you should send.'),
        w1('You used to have more to say to yourself.'),
        w1('Quiet. It\'s been quiet a long time.'),
        // Low serotonin — hollow with weight
        { weight: ctx.state.lerp01(ser, 40, 20), value: 'You don\'t know what you\'d say even if you tried.' },
        { weight: ctx.state.lerp01(ser, 40, 20), value: 'They\'re fine without you. Everyone is fine.' },
        // Low NE — hollow and flat
        { weight: ctx.state.lerp01(ne, 45, 25), value: 'Nothing needs you right now. Nothing.' },
      );
    } else if (mood === 'heavy') {
      thoughts.push(
        w1('You keep meaning to.'),
        w1('It\'ll be easier tomorrow.'),
        w1('You could start small. You haven\'t.'),
        w1('Later. You\'ll deal with it later.'),
        // Low serotonin — heavy tips into defeat
        { weight: ctx.state.lerp01(ser, 40, 20), value: 'You know what you should be doing.' },
        { weight: ctx.state.lerp01(ser, 40, 20), value: 'You\'re not doing it.' },
        // Low NE — nothing reaching through
        { weight: ctx.state.lerp01(ne, 45, 25), value: 'Nothing\'s reaching you right now.' },
        { weight: ctx.state.lerp01(ne, 45, 25), value: 'You\'re in here somewhere.' },
        // Low GABA — heavy with tremor underneath
        { weight: ctx.state.lerp01(gaba, 40, 20), value: 'There\'s something under the tiredness. You don\'t look at it.' },
      );
    } else if (mood === 'fraying') {
      thoughts.push(
        w1('You know how this goes.'),
        w1('Something\'s wrong. Nothing\'s wrong.'),
        w1('Stop.'),
        w1('Don\'t.'),
        w1('You\'re doing it again.'),
        w1('Okay. Okay.'),
        // High NE — tight loop
        { weight: ctx.state.lerp01(ne, 60, 80), value: 'Your heart is going too fast for what you\'re doing.' },
        { weight: ctx.state.lerp01(ne, 60, 80), value: 'Every sound has a reason. You don\'t know the reason.' },
        // Low GABA — no floor
        { weight: ctx.state.lerp01(gaba, 40, 20), value: 'You try to calm down. You don\'t calm down.' },
        { weight: ctx.state.lerp01(gaba, 40, 20), value: 'The thing about trying to relax is you can\'t make yourself relax.' },
        // Low serotonin — fraying with hopeless undertow
        { weight: ctx.state.lerp01(ser, 40, 20), value: 'You can\'t keep doing this. You\'re doing it.' },
      );
    } else if (mood === 'quiet') {
      thoughts.push(
        w1('Quiet.'),
        w1('Nothing right now.'),
        w1('You\'re not going anywhere.'),
        // Lower serotonin — quiet with an edge
        { weight: ctx.state.lerp01(ser, 45, 25), value: 'Something you were going to do. It can wait.' },
        { weight: ctx.state.lerp01(ser, 45, 25), value: 'This is fine. This is exactly fine.' },
        // High NE — quiet but not still
        { weight: ctx.state.lerp01(ne, 50, 70), value: 'Everything\'s fine. You know it\'s fine. Your body hasn\'t gotten the message.' },
      );
    } else if (mood === 'clear' || mood === 'present') {
      thoughts.push(
        // Sparse — the voice is quieter when things are okay. Lower weights.
        { weight: 0.5, value: 'This is okay.' },
        { weight: 0.5, value: 'You\'re here.' },
        { weight: 0.4, value: 'Yeah.' },
        // Slight NE presence — noticing without worry
        { weight: ctx.state.lerp01(ne, 35, 55) * 0.5, value: 'Something you noticed. Nothing to do with it.' },
      );
    } else {
      // flat
      thoughts.push(
        w1('Again.'),
        w1('You could start.'),
        w1('You\'ve been here a while.'),
        w1('Still here.'),
        // Low serotonin — flat is darker
        { weight: ctx.state.lerp01(ser, 45, 25), value: 'Fine. It\'s fine.' },
        // High adenosine (unblocked) — flat and foggy
        { weight: ctx.state.lerp01(aden, 55, 75) * ctx.state.adenosineBlock(), value: 'Something. There was something.' },
        { weight: ctx.state.lerp01(aden, 55, 75) * ctx.state.adenosineBlock(), value: 'Never mind.' },
      );
    }

    const fresh = thoughts.filter(t => !recentInnerVoice.includes(t.value));
    const pool = fresh.length > 0 ? fresh : thoughts;
    const picked = ctx.timeline.weightedPick(pool);

    if (picked) {
      recentInnerVoice.push(picked);
      while (recentInnerVoice.length > 3) recentInnerVoice.shift();
    }

    return picked;
  };

  // --- Transition text ---

  /** @param {string} from @param {string} to */
  const transitionText = (from, to) => {
    const mood = ctx.state.moodTone();
    const energy = ctx.state.energyTier();

    // Kitchen has a visible clock — glance on arrival
    if (to === 'apartment_kitchen') {
      ctx.state.glanceTime();
    }

    // Within apartment
    if (ctx.world.getLocation(from)?.area === 'apartment' && ctx.world.getLocation(to)?.area === 'apartment') {
      return '';
    }

    // Leaving apartment
    if (ctx.world.getLocation(from)?.area === 'apartment' && to === 'street') {
      if (energy === 'depleted' || energy === 'exhausted') {
        return 'Getting out the door takes more than it should. But you\'re out.';
      }
      if (mood === 'heavy') {
        if (!ctx.state.isWorkday()) {
          return 'You lock the door. No particular place to be. You go anyway.';
        }
        return 'You lock the door. The hallway, the stairs, the outside. Each one a small decision you make by making it.';
      }
      if (!ctx.state.get('dressed')) {
        return 'You step outside in ' + ctx.character.get('sleepwear') + '. The air reminds you immediately. You don\'t go back in.';
      }
      if (!ctx.state.isWorkday()) {
        return 'You lock up. The day is outside.';
      }
      return 'You lock up and head out.';
    }

    // Going home
    if (from === 'street' && ctx.world.getLocation(to)?.area === 'apartment') {
      if (energy === 'depleted') {
        return 'The stairs up to your apartment are the last obstacle. You clear them.';
      }
      return 'Back inside. The apartment is the same as you left it.';
    }

    // To bus stop
    if (from === 'street' && to === 'bus_stop') {
      return 'You walk to the bus stop. It\'s not far.';
    }

    // Bus ride to work
    if (from === 'bus_stop' && to === 'workplace') {
      const hour = ctx.state.getHour();
      const aden = ctx.state.get('adenosine');
      const ne = ctx.state.get('norepinephrine');
      const gaba = ctx.state.get('gaba');
      const ser = ctx.state.get('serotonin');
      const weather = ctx.state.get('weather');
      if (hour >= 7 && hour <= 9) {
        // Rush hour
        if (mood === 'numb' || mood === 'heavy' || mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The bus is full. Bodies pressed together going the same direction. You find a spot to stand and not be. Twenty minutes of that.' },
            { weight: 1, value: 'Standing room. You press in and find a hold bar. The bus moves. You move with it. Twenty minutes.' },
            // High adenosine (unblocked) — the bus sway is almost restful
            { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: 'The bus is packed and warm. You close your eyes for most of the ride. The sway. Twenty minutes you barely noticed.' },
            // Low serotonin — the press of bodies is nothing
            { weight: ctx.state.lerp01(ser, 35, 18), value: 'The bus is full. You find a grip and hold it. Bodies around you, sounds, movement. None of it reaches you. Twenty minutes.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'The morning bus. Standing room only. You wedge in and stare at the back of someone\'s jacket for twenty minutes.' },
          { weight: 1, value: 'The bus is packed. You find a hold bar, settle your weight, let it carry you.' },
          // High NE — the sounds of a packed bus are a lot
          { weight: ctx.state.lerp01(ne, 50, 70), value: 'The morning bus. Brakes, announcements, someone\'s music leaking from headphones, the sound of the city outside. You hold on and get through the twenty minutes.' },
          // Low GABA — the press of bodies is hard
          { weight: ctx.state.lerp01(gaba, 40, 22), value: 'The bus is packed and you find the least crowded spot and try not to think about it. Twenty minutes of other people\'s proximity.' },
          // Weather — window texture
          { weight: weather === 'drizzle' || weather === 'snow' ? 0.8 : 0, value: 'The morning bus. Standing room. You watch the ' + (weather === 'snow' ? 'snow' : 'rain') + ' on the windows for twenty minutes. The city blurs past.' },
        ]);
      }
      // Off-peak
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'The bus comes. It\'s quieter this time of day. You find a seat and watch the city slide past the window.' },
        { weight: 1, value: 'Off-peak. Seats to choose from. You sit and the route unfolds.' },
        // High adenosine (unblocked) — the seat and the motion
        { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: 'A seat to yourself. The city goes past the window. Your head finds the glass. Twenty minutes that feel almost like a pause.' },
        // Low serotonin — the ride has weight
        { weight: ctx.state.lerp01(ser, 40, 22), value: 'A seat. You take it. The route you know well enough to not watch. The bus carries you forward anyway.' },
        // High NE — the quiet bus is still a lot
        { weight: ctx.state.lerp01(ne, 50, 68), value: 'The bus is quiet. You notice the sounds of it anyway — the engine, the doors at each stop, someone shifting in their seat. The city slides past.' },
      ]);
    }

    // Bus ride from work
    if (from === 'workplace' && to === 'bus_stop') {
      const aden = ctx.state.get('adenosine');
      const ne = ctx.state.get('norepinephrine');
      const ser = ctx.state.get('serotonin');
      if (energy === 'depleted' || energy === 'exhausted') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'The bus ride back. You sit and close your eyes and exist in the motion of it.' },
          { weight: 1, value: 'A seat. You take it and don\'t move. The city in reverse outside the window. You\'re barely there.' },
          // High adenosine (unblocked) — the ride is surrender
          { weight: ctx.state.lerp01(aden, 58, 78) * ctx.state.adenosineBlock(), value: 'The bus seat holds you. That\'s the job. You close your eyes and the motion of it is the only thing that\'s asking anything of you.' },
          // Low serotonin — the day comes in pieces
          { weight: ctx.state.lerp01(ser, 38, 18), value: 'You sit down hard. The day sits with you. Eyes closed, the bus brings you home through it.' },
        ]);
      }
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'The ride back. The city in reverse. You\'re not thinking about work anymore, mostly.' },
        { weight: 1, value: 'The commute home. The same route, the other direction. People getting on, getting off. The city doing its thing.' },
        // Clear or present — the ride is decompression
        { weight: (mood === 'clear' || mood === 'present') ? 1.2 : 0, value: 'The ride back is its own kind of decompression. The city slides past. You sit with what the day was and let the bus carry you out of it.' },
        // High NE — noticing the route
        { weight: ctx.state.lerp01(ne, 45, 65), value: 'The bus home. Stops, announcements, the sounds of the city through the windows. You watch. You\'re almost off the clock.' },
        // Heavy or hollow — the ride doesn't erase it
        { weight: (mood === 'heavy' || mood === 'hollow') ? ctx.state.lerp01(ser, 40, 20) : 0, value: 'The bus. The slow passage out of the part of the day that\'s done. You sit with it. It comes with you anyway.' },
      ]);
    }

    // To corner store
    if (from === 'street' && to === 'corner_store') {
      return 'The corner store\'s door chimes when you push it open.';
    }

    // From corner store
    if (from === 'corner_store' && to === 'street') {
      return 'Back outside.';
    }

    // To soup kitchen
    if (from === 'street' && to === 'soup_kitchen') {
      const visits = ctx.state.get('soup_kitchen_visits');
      if (visits === 0) {
        if (mood === 'heavy' || mood === 'hollow') {
          return 'You find the place. Door, sign, the smell of food from inside.';
        }
        return 'You walk over. A building you\'ve passed before, a sign you may have noticed. You go in.';
      }
      return 'You walk over. You know where it is now.';
    }

    // From soup kitchen
    if (from === 'soup_kitchen' && to === 'street') {
      return 'Back outside. Less hungry than you were.';
    }

    // To food bank
    if (from === 'street' && to === 'food_bank') {
      const visits = ctx.state.get('food_bank_visits');
      if (visits === 0) {
        return 'You walk over. It takes longer than you thought. You find it.';
      }
      return 'You walk to the food bank.';
    }

    // From food bank
    if (from === 'food_bank' && to === 'street') {
      return 'Back outside, carrying the bag.';
    }

    // From bus stop back to street
    if (from === 'bus_stop' && to === 'street') {
      return 'You walk back from the bus stop.';
    }

    return '';
  };

  // --- Get available interactions for current location ---

  /** @returns {Interaction[]} */
  function getAvailableInteractions() {
    /** @type {Interaction[]} */
    const available = [];

    // Phone mode — phone UI renders its own action buttons, #actions stays empty
    if (ctx.state.get('viewing_phone')) {
      return available;
    }

    const location = ctx.world.getLocationId();

    for (const interaction of Object.values(interactions)) {
      if (interaction.location === location && interaction.available()) {
        available.push(/** @type {Interaction} */ (interaction));
      }
    }

    // Call in sick — available anywhere
    if (callInSick.available()) {
      available.push(/** @type {Interaction} */ (callInSick));
    }

    return available;
  }

  /** @param {string} id */
  function getInteraction(id) {
    for (const interaction of Object.values(interactions)) {
      if (interaction.id === id) return interaction;
    }
    if (callInSick.id === id) return callInSick;
    return null;
  }

  // --- Awareness source functions ---

  /** @type {Record<string, () => string>} */
  const timeSources = {
    apartment_bedroom: () => 'The alarm clock on the nightstand. ' + ctx.state.getTimeString() + '.',
    apartment_kitchen: () => 'The microwave clock. ' + ctx.state.getTimeString() + '.',
    workplace: () => 'The clock on your screen. ' + ctx.state.getTimeString() + '.',
    corner_store: () => 'The clock behind the register. ' + ctx.state.getTimeString() + '.',
  };

  function getTimeSource() {
    const loc = ctx.world.getLocationId();
    const fn = timeSources[loc];
    if (fn) return fn();
    if (ctx.state.get('has_phone') && ctx.state.get('phone_battery') > 0)
      return 'You check your phone. ' + ctx.state.getTimeString() + '.';
    return null;
  }

  function getMoneySource() {
    if (ctx.state.get('has_phone') && ctx.state.get('phone_battery') > 0)
      return 'You open the banking app. $' + Math.round(ctx.state.get('money')) + '.';
    return null;
  }

  function resetIdleTracking() {
    recentIdle.length = 0;
    recentInnerVoice.length = 0;
  }

  // --- Approaching prose ---
  // Shown during auto-advance: the character is about to act on habit.
  // CRITICAL: No RNG consumed. All selection is deterministic — moodTone()
  // and NT conditionals only. This fires before handleAction/handleMove,
  // so consuming RNG would desync replay.

  /** @type {Record<string, () => string>} */
  const approachingProse = {

    // === BEDROOM ===

    sleep: () => {
      const mood = ctx.state.moodTone();
      const aden = ctx.state.get('adenosine');
      if (aden > 80) return 'Your body is already deciding.';
      if (mood === 'numb' || mood === 'heavy') return 'The bed. You\'re moving toward it before you\'ve thought about it.';
      if (mood === 'fraying') return 'You need to lie down. You need to stop.';
      return 'Bed.';
    },

    get_dressed: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'numb' || mood === 'heavy') return 'You\'re reaching for your clothes before you\'ve thought about it.';
      if (mood === 'fraying') return 'Your hands find your clothes.';
      return 'Clothes.';
    },

    set_alarm: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'heavy' || mood === 'numb') return 'The alarm. A number for tomorrow.';
      return 'Alarm.';
    },

    skip_alarm: () => {
      return 'No alarm.';
    },

    snooze_alarm: () => {
      const count = ctx.state.get('snooze_count');
      const aden = ctx.state.get('adenosine');
      if (count > 1) return 'Again.';
      if (aden > 50) return 'Your hand is already moving.';
      return 'Snooze.';
    },

    dismiss_alarm: () => {
      const count = ctx.state.get('snooze_count');
      if (count > 2) return 'Enough. Up.';
      return 'Up.';
    },

    charge_phone: () => {
      return 'The charger.';
    },

    check_phone_bedroom: () => {
      const mood = ctx.state.moodTone();
      const cortisol = ctx.state.get('cortisol');
      if (cortisol > 60) return 'Your hand is already on your phone.';
      if (mood === 'numb') return 'Phone. Screen. Light in the dark.';
      return 'Your phone.';
    },

    lie_there: () => {
      const mood = ctx.state.moodTone();
      const aden = ctx.state.get('adenosine');
      if (aden > 60) return 'You\'re not getting up yet.';
      if (mood === 'heavy') return 'You stay. The ceiling stays.';
      if (mood === 'numb') return 'Nothing to get up for. Not yet.';
      return 'A few more minutes.';
    },

    look_out_window: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'hollow') return 'The window. Something outside.';
      return 'The window.';
    },

    make_bed: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'numb' || mood === 'heavy') return 'The bed. You pull the sheets straight.';
      if (mood === 'fraying') return 'The bed. One small thing.';
      return 'Make the bed.';
    },

    start_laundry: () => {
      return 'Start the laundry.';
    },

    move_to_dryer: () => {
      return 'Move to the dryer.';
    },

    fold_laundry: () => {
      return 'Fold the laundry.';
    },

    tidy_clothes: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'fraying') return 'The clothes. Off the floor.';
      return 'The clothes on the floor.';
    },

    // === KITCHEN ===

    eat_food: () => {
      const mood = ctx.state.moodTone();
      if (['very_hungry', 'starving'].includes(ctx.state.hungerTier())) return 'You need to eat something.';
      if (mood === 'numb') return 'You open the fridge. Standing there.';
      if (mood === 'heavy') return 'Something from the fridge. Whatever\'s there.';
      return 'Something from the fridge.';
    },

    eat_from_pantry: () => {
      const hunger = ctx.state.hungerTier();
      if (hunger === 'starving' || hunger === 'very_hungry') return 'There\'s something in the cupboard.';
      return 'The cupboard.';
    },

    drink_water: () => {
      const thirst = ctx.state.thirstTier();
      if (thirst === 'parched' || thirst === 'very_thirsty') return 'Water. Your mouth is dry.';
      const aden = ctx.state.get('adenosine');
      if (aden > 60) return 'Water. Your mouth is dry.';
      return 'Water.';
    },

    make_coffee: () => {
      const aden = ctx.state.get('adenosine');
      const caffeine = ctx.state.caffeineTier();
      if (caffeine === 'active') return 'The second cup.';
      if (aden > 65 && ctx.state.adenosineBlock() > 0.5) return 'Coffee. You need it.';
      return 'Coffee.';
    },

    do_dishes: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'heavy') return 'The dishes. They\'re still there.';
      return 'The dishes.';
    },

    check_phone_kitchen: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'fraying') return 'Your hand finds your phone again.';
      return 'Your phone.';
    },

    sit_at_table: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'numb' || mood === 'heavy') return 'The chair. You\'re sitting down before you meant to.';
      if (mood === 'fraying') return 'You sit. Your body made the decision.';
      return 'The table.';
    },

    // === BATHROOM ===

    shower: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'numb') return 'The bathroom. Automatic.';
      if (mood === 'fraying') return 'Water. You need the water.';
      if (mood === 'heavy') return 'Shower. Going through the motions.';
      return 'Shower.';
    },

    use_sink: () => {
      return 'The sink.';
    },

    rehang_towel: () => {
      return 'The towel.';
    },

    take_pain_reliever: () => {
      const migraineTier = ctx.state.migraineTier();
      const dentalTier = ctx.state.dentalTier();
      if (migraineTier === 'severe') return 'The medication. You need it.';
      if (migraineTier === 'active') return 'Something for the headache.';
      if (dentalTier === 'flare') return 'Something for the tooth. Please.';
      if (dentalTier === 'ache') return 'Something for the tooth.';
      return 'Pain reliever.';
    },

    use_toilet_bathroom: () => {
      const need = ctx.state.bladderNeedTier();
      if (need === 'pressing') return 'The bathroom. Now.';
      if (need === 'urgent') return 'You need to go.';
      return 'The toilet.';
    },

    // === STREET ===

    check_phone_street: () => {
      return 'Your phone, out of your pocket.';
    },

    sit_on_step: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'heavy' || mood === 'numb') return 'You\'re stopping. Sitting.';
      return 'The step.';
    },

    go_for_walk: () => {
      const mood = ctx.state.moodTone();
      const ne = ctx.state.get('norepinephrine');
      if (ne > 60) return 'Moving. You need to be moving.';
      if (mood === 'heavy') return 'Walking. Not going anywhere, just walking.';
      return 'A walk.';
    },

    find_public_restroom_street: () => {
      const need = ctx.state.bladderNeedTier();
      if (need === 'pressing') return 'There has to be something nearby.';
      if (need === 'urgent') return 'Find a bathroom somewhere.';
      return 'Find a bathroom.';
    },

    // === BUS STOP ===

    wait_for_bus: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'numb') return 'You stand there. The bus will come.';
      return 'Waiting.';
    },

    find_public_restroom_bus_stop: () => {
      const need = ctx.state.bladderNeedTier();
      if (need === 'pressing') return 'There has to be something close enough.';
      return 'Find a bathroom before the bus comes.';
    },

    // === WORKPLACE ===

    do_work: () => {
      const mood = ctx.state.moodTone();
      const dopa = ctx.state.get('dopamine');
      if (dopa < 30) return 'The screen. The work. You\'re starting before you\'re ready.';
      if (mood === 'flat') return 'Work.';
      return 'Back to it.';
    },

    work_break: () => {
      const mood = ctx.state.moodTone();
      const cortisol = ctx.state.get('cortisol');
      if (cortisol > 55) return 'You need a minute. You\'re taking a minute.';
      if (mood === 'heavy') return 'A break. Whether it helps or not.';
      return 'A break.';
    },

    talk_to_coworker: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'hollow' || mood === 'numb') return 'Someone\'s there. You\'re turning toward them.';
      return 'A word with someone.';
    },

    check_phone_work: () => {
      return 'Your phone, under the desk.';
    },

    eat_at_work: () => {
      const hunger = ctx.state.hungerTier();
      if (hunger === 'starving' || hunger === 'very_hungry') return 'You need to eat. The kitchen is right there.';
      return 'Staff meal.';
    },

    graze_break_room: () => {
      const aden = ctx.state.get('adenosine');
      const hunger = ctx.state.hungerTier();
      if (hunger === 'hungry' || hunger === 'very_hungry') return 'The break room. There might be something.';
      if (aden > 60 && ctx.state.adenosineBlock() > 0.3) return 'Break room. You need to move.';
      return 'See what\'s in the break room.';
    },

    get_coffee_work: () => {
      const aden = ctx.state.get('adenosine');
      const caffeine = ctx.state.caffeineTier();
      if (caffeine === 'active') return 'The second one.';
      if (aden > 65 && ctx.state.adenosineBlock() > 0.4) return 'Coffee. You need it.';
      return 'Coffee.';
    },

    use_toilet_work: () => {
      const need = ctx.state.bladderNeedTier();
      if (need === 'pressing') return 'The restroom. Now.';
      if (need === 'urgent') return 'You need a minute.';
      return 'The restroom.';
    },

    use_toilet_soup_kitchen: () => {
      const need = ctx.state.bladderNeedTier();
      if (need === 'pressing') return 'The bathroom. Now.';
      if (need === 'urgent') return 'You need to go.';
      return 'The bathroom.';
    },

    use_toilet_food_bank: () => {
      const need = ctx.state.bladderNeedTier();
      if (need === 'pressing') return 'The bathroom. Now.';
      if (need === 'urgent') return 'You need to go.';
      return 'The bathroom.';
    },

    // === CORNER STORE ===

    buy_groceries: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'heavy') return 'Groceries. Whatever\'s cheap.';
      return 'Groceries.';
    },

    buy_cheap_meal: () => {
      if (['very_hungry', 'starving'].includes(ctx.state.hungerTier())) return 'Something quick. You\'re hungry.';
      return 'Something to eat.';
    },

    buy_coffee_store: () => {
      const aden = ctx.state.get('adenosine');
      const caffeine = ctx.state.caffeineTier();
      if (caffeine === 'active') return 'The second one.';
      if (aden > 65 && ctx.state.adenosineBlock() > 0.4) return 'Coffee. You want it.';
      return 'Coffee.';
    },

    browse_store: () => {
      return 'Looking around.';
    },

    buy_scratch_ticket: () => {
      const dop = ctx.state.get('dopamine');
      // Low dopamine makes the pull stronger — variable-ratio reinforcement
      if (dop < 35) return 'The ticket display by the register.';
      return 'Scratch ticket.';
    },

    buy_medicine: () => {
      const illTier = ctx.state.illnessTier();
      if (illTier === 'very_sick') return 'Medicine. You need it.';
      return 'Something for it.';
    },

    use_toilet_corner_store: () => {
      const need = ctx.state.bladderNeedTier();
      if (need === 'pressing') return 'The bathroom. Now.';
      if (need === 'urgent') return 'You need to go. Ask.';
      return 'The bathroom.';
    },

    // === PHONE MODE ===

    read_messages: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'hollow') return 'The messages. Someone wrote to you.';
      return 'Messages.';
    },

    toggle_phone_silent: () => {
      return ctx.state.get('phone_silent') ? 'Sound on.' : 'Silent.';
    },

    put_phone_away: () => {
      return 'Phone away.';
    },

    reply_to_friend: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'hollow' || mood === 'heavy') return 'Reply. Just a few words.';
      if (mood === 'fraying') return 'Send something back.';
      return 'Reply.';
    },

    message_friend: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'hollow' || mood === 'heavy') return 'Write. Just something.';
      if (mood === 'fraying') return 'Send something. Anything.';
      return 'Write.';
    },

    help_friend: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'hollow') return 'At least there\'s this.';
      if (mood === 'heavy') return 'You can do this for them.';
      return 'Helping.';
    },

    ask_for_help: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'hollow' || mood === 'heavy') return 'You\'re typing. You hate that you\'re doing this.';
      if (mood === 'fraying') return 'You\'re asking. You don\'t want to but you are.';
      return 'Asking.';
    },

    // === ANYWHERE ===

    call_in: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'heavy' || mood === 'numb') return 'You\'re not going in. You\'re already not going in.';
      if (mood === 'fraying') return 'You can\'t do it today. You\'re reaching for the phone.';
      return 'Calling in.';
    },

    // === MOVEMENT ===

    'move:apartment_kitchen': () => {
      const mood = ctx.state.moodTone();
      if (mood === 'heavy') return 'Kitchen. The steps happen.';
      return 'Kitchen.';
    },

    'move:apartment_bathroom': () => {
      return 'Bathroom.';
    },

    'move:apartment_bedroom': () => {
      const mood = ctx.state.moodTone();
      const aden = ctx.state.get('adenosine');
      if (aden > 60) return 'Back to the bedroom. Back to the bed.';
      if (mood === 'heavy') return 'The bedroom.';
      return 'Bedroom.';
    },

    'move:street': () => {
      const mood = ctx.state.moodTone();
      const temp = ctx.state.temperatureTier();
      const weather = ctx.state.get('weather');
      const cold = temp === 'bitter' || temp === 'freezing';
      if (weather === 'snow') return mood === 'heavy' ? 'Out. Into the snow.' : 'Out. Snow.';
      if (mood === 'heavy') return cold ? 'Out. It\'s cold.' : 'Out. You\'re heading out.';
      if (mood === 'fraying') return 'Door. Air. Outside.';
      if (cold && temp === 'bitter') return 'Door. Brace for the cold.';
      if (!ctx.state.isWorkday()) return 'Out.';
      return 'Door.';
    },

    'move:bus_stop': () => {
      const mood = ctx.state.moodTone();
      // "Your feet know the way" = commute autopilot — within 2h of shift start, not yet at work
      const tod = ctx.state.timeOfDay();
      const shiftStart = ctx.state.get('work_shift_start');
      const commutingToWork = ctx.state.isWorkday() && !ctx.state.get('at_work_today') && tod >= shiftStart - 120 && tod < shiftStart + 30;
      if (commutingToWork && (mood === 'numb' || mood === 'heavy')) return 'The bus stop. Your feet know the way.';
      return 'Bus stop.';
    },

    'move:workplace': () => {
      const mood = ctx.state.moodTone();
      if (mood === 'heavy') return 'Work. The bus, the building, the desk. All of it coming.';
      return 'Bus.';
    },

    'move:corner_store': () => {
      const mood = ctx.state.moodTone();
      if (mood === 'heavy') return 'The store. Walking there.';
      return 'The store.';
    },

    'move:soup_kitchen': () => {
      const hunger = ctx.state.hungerTier();
      const visits = ctx.state.get('soup_kitchen_visits');
      if (hunger === 'starving') return 'The community meal. You know it\'s there.';
      if (visits === 0) return 'The community meal is open.';
      return 'The community meal.';
    },

    'move:food_bank': () => {
      const visits = ctx.state.get('food_bank_visits');
      const day = ctx.state.getDay();
      const lastDay = ctx.state.get('last_food_bank_day');
      const daysUntilNext = lastDay > 0 ? Math.max(0, 7 - (day - lastDay)) : 0;
      if (daysUntilNext > 0) return null; // shouldn't be reachable (gated by availability)
      if (visits === 0) return 'The food bank. It\'s open today.';
      return 'The food bank.';
    },

    receive_bag: () => {
      return 'Wait for a bag.';
    },

    get_meal: () => {
      const hunger = ctx.state.hungerTier();
      if (hunger === 'starving' || hunger === 'very_hungry') return 'Through the line.';
      return 'A plate.';
    },
  };

  return {
    locationDescriptions,
    interactions,
    eventText,
    idleThoughts,
    innerVoiceThoughts,
    transitionText,
    getAvailableInteractions,
    getInteraction,
    generateIncomingMessages,
    phoneScreenDescription,
    getTimeSource,
    getMoneySource,
    resetIdleTracking,
    approachingProse,
  };
}

