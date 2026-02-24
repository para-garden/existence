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

  /** Prose for proactive reach-out: low guilt, moderate-to-low social, from affection/longing not obligation.
   *  3 NT-shaded variants + 1 weighted by low-social-energy (you do it anyway). */
  const friendProactiveReachProse = {
    sends_things: (name) => {
      const ser = ctx.state.get('serotonin');
      const dopa = ctx.state.get('dopamine');
      const socEnergy = ctx.state.get('social_energy');
      return ctx.timeline.weightedPick([
        // Neutral base — you open the thread, nothing new, start typing
        { weight: 1, value: `You open ${name}'s thread. Nothing new. You start typing anyway. Something small. It goes.` },
        // Low serotonin — the ache of missing, warm but heavy
        { weight: ctx.state.lerp01(ser, 50, 25), value: `You've been thinking about her. Not in the worried way. Just — she exists, and you wanted to say something. You find a thing and send it before you think about it.` },
        // High dopamine — spontaneous, no second-guessing
        { weight: ctx.state.lerp01(dopa, 60, 90), value: `You scroll until something catches. You send it. No caption. She'll get it.` },
        // Low social energy — slight cost, you do it anyway
        { weight: ctx.state.lerp01(socEnergy, 50, 20), value: `It takes a little more than it should. You open the thread. Nothing new. You start something small, send it before you close the app.` },
      ]);
    },
    checks_in: (name) => {
      const ser = ctx.state.get('serotonin');
      const dopa = ctx.state.get('dopamine');
      const socEnergy = ctx.state.get('social_energy');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You open ${name}'s thread. Nothing new. You type "hey" and almost delete it, then don't. It sends.` },
        { weight: ctx.state.lerp01(ser, 50, 25), value: `You've been thinking about her. Just — the fact of her, somewhere out there going about her day. You send something small. Nothing that requires anything back.` },
        { weight: ctx.state.lerp01(dopa, 60, 90), value: `You just want to say something. You open her thread and type it. Not much. Just something.` },
        { weight: ctx.state.lerp01(socEnergy, 50, 20), value: `You open the thread. You don't know what you want to say but you start anyway, and what you send is short enough to not feel like much, which is how it gets sent.` },
      ]);
    },
    dry_humor: (_name) => {
      const ser = ctx.state.get('serotonin');
      const dopa = ctx.state.get('dopamine');
      const socEnergy = ctx.state.get('social_energy');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You open the thread. Nothing new. You send something stupid. He'll understand.` },
        // Low serotonin — missing him, warmer than usual
        { weight: ctx.state.lerp01(ser, 50, 25), value: `You've been thinking about him. Not in any particular way — just that he exists and you wanted to say something dumb. You do.` },
        { weight: ctx.state.lerp01(dopa, 60, 90), value: `Something catches your eye and you send it immediately. No thought. Just sent.` },
        { weight: ctx.state.lerp01(socEnergy, 50, 20), value: `The thread is right there. You open it. Nothing new. You type something and send it anyway. Small enough to not require energy you don't have.` },
      ]);
    },
    earnest: (name) => {
      const ser = ctx.state.get('serotonin');
      const dopa = ctx.state.get('dopamine');
      const socEnergy = ctx.state.get('social_energy');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `You open ${name}'s thread. Nothing new. You start typing anyway. You don't know exactly what you want to say, but you say something, and send it before you revise it into nothing.` },
        // Low serotonin — the ache of wanting to connect
        { weight: ctx.state.lerp01(ser, 50, 25), value: `You've been thinking about ${name}. Not in the worried way. Just — you miss her. The word fits. You open the thread and write something small and honest and send it.` },
        { weight: ctx.state.lerp01(dopa, 60, 90), value: `You just want to talk to her. You open the thread and write something and it's done before you second-guess it.` },
        { weight: ctx.state.lerp01(socEnergy, 50, 20), value: `It costs a little more than you expected. But you open ${name}'s thread and write something anyway — short, true — and you send it.` },
      ]);
    },
  };

  /** Friend's response to an out-of-the-blue message — acknowledges the unexpected contact. */
  const friendProactiveReachMessages = {
    sends_things: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `${name} responds immediately. She had something saved. Of course she did. The thread is alive now.` },
      { weight: 1, value: `A reaction from ${name}, then something else. She'd been waiting for an opening.` },
      { weight: 1, value: `${name} sends something back — she had it ready. "saw this and now you too," basically. The exchange has started.` },
    ]),
    checks_in: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `${name}: "Hey! Wasn't expecting this but glad you reached out." Warm. Means it.` },
      { weight: 1, value: `A quick reply from ${name}. "I was just thinking about you actually." Could be true. Probably is.` },
      { weight: 1, value: `${name} responds fast. Just a few words, light. Like it costs her nothing to be that way.` },
    ]),
    dry_humor: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `${name} sends something back immediately. Like nothing's happened. Which is fine. That's how this works.` },
      { weight: 1, value: `His response: immediate, dry, brief. The whole exchange is symmetrical.` },
      { weight: 1, value: `"lmao" from ${name}, and then something else. He was waiting.` },
    ]),
    earnest: (name) => ctx.timeline.weightedPick([
      { weight: 1, value: `A reply from ${name}. "I'm really glad you reached out." She means it, no performance in it.` },
      { weight: 1, value: `${name} responds warmly. She asks how you've been — gentle, no pressure. You could answer or not.` },
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

  // Prose tables for the coworker-notices-you mechanic.
  // Two variants per flavor: 'absence' (haven't talked in a while) and 'stress' (you seem off).
  // Each function returns a string and consumes exactly 1 RNG call (weightedPick).
  /** @type {Record<string, (name: string) => string>} */
  const coworkerNoticesAbsenceProse = {
    warm_quiet: (name) => {
      const ser = ctx.state.get('serotonin');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `${name} sets something on the edge of your desk — a wrapped piece of candy, a paper clip shaped into a small loop, nothing. Looks at you for a second. Doesn't say anything. Goes back to their screen.` },
        { weight: 1, value: `${name} glances over. "Haven't talked in a bit." Not an accusation. Just a fact, offered and let go.` },
        // Low serotonin — the small gesture just barely reaches through
        { weight: ctx.state.lerp01(ser, 40, 20), value: `${name} walks past, slows, doesn't stop. Just: "Hey." And then they're past. You notice you're still looking at the space where they were.` },
        // Higher serotonin — the noticing lands warmly
        { weight: ctx.state.lerp01(ser, 50, 70), value: `${name} catches your eye from across the room, gives a small nod. The kind of nod that says: I see you there. Nothing else required.` },
      ]);
    },
    mundane_talker: (name) => {
      const ne = ctx.state.get('norepinephrine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `"You've been quiet this week." ${name}, by the coffee machine. Then, filling a cup: "No offense." Then, walking away: "I just noticed."` },
        { weight: 1, value: `${name} swings their chair partway around. "You doing okay? You've barely said anything for like two days." Genuine, underneath the usual noise.` },
        // High NE — the directness lands sharp
        { weight: ctx.state.lerp01(ne, 55, 75), value: `"Hey." ${name}, close enough that you have to turn. "Where've you been?" Not going anywhere. Waiting. You say something. So does ${name}. The ritual picks up again.` },
        // Low NE — the observation just washes past
        { weight: ctx.state.lerp01(ne, 45, 25), value: `${name} says something about you being quiet lately. You're not sure if it was a question. Either way it needed an answer and you gave one. What you said, you're not sure.` },
      ]);
    },
    stressed_out: (name) => {
      const gaba = ctx.state.get('gaba');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `${name} stops at your desk — surprising, because ${name} doesn't usually stop. "You've been quiet." Then, already half-turned back to their screen: "That's allowed." Brief. Almost gentle.` },
        { weight: 1, value: `"You haven't complained once this week." ${name}, without looking up. "Which means either things are good or things are bad." A beat. "Which is it?"` },
        // Low GABA — their observation tightens something in you
        { weight: ctx.state.lerp01(gaba, 40, 20), value: `${name} glances over with the expression they get when they're about to say something they've been holding. "You've been somewhere else all week." You don't answer. ${name} doesn't push.` },
        // Higher GABA — the noticing settles rather than spikes
        { weight: ctx.state.lerp01(gaba, 50, 70), value: `${name} exhales — not the usual tense exhale. "Hey, you okay? You've kind of disappeared." The question sits. You answer it somehow. ${name} nods and goes back to work.` },
      ]);
    },
  };

  /** @type {Record<string, (name: string) => string>} */
  const coworkerNoticesStressProse = {
    warm_quiet: (name) => {
      const ser = ctx.state.get('serotonin');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `${name} puts a cup of tea on your desk without being asked. No explanation. Just: "Looked like you needed it." And then they're back at their screen.` },
        { weight: 1, value: `${name} stops near you. Quiet for a second. Then: "Rough day?" Not pressing. Just opening a door.` },
        // Low serotonin — even the small gesture barely lands
        { weight: ctx.state.lerp01(ser, 40, 20), value: `${name} is just standing there for a second. Then, quietly: "You okay?" You say yes. Something in their face says they're not sure they believe you. They don't push.` },
        // Higher serotonin — being seen feels like relief
        { weight: ctx.state.lerp01(ser, 50, 70), value: `${name} catches your eye and holds it for a moment. Doesn't say anything. Gives a small nod — the kind that means: I see it. You're allowed.` },
      ]);
    },
    mundane_talker: (name) => {
      const ne = ctx.state.get('norepinephrine');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `"Okay, what's going on." ${name}, turned fully toward you. Not a question, exactly. "You look like I look when my internet goes out for three days. What happened?"` },
        { weight: 1, value: `${name} leans over. "You doing okay? You've got that look." A pause. "You know the look." You do.` },
        // High NE — the attention is too much right now
        { weight: ctx.state.lerp01(ne, 55, 75), value: `"Hey." ${name}, right at your elbow, closer than expected. "Something's off with you today." You make a sound that passes for fine. ${name} doesn't look convinced but lets it go.` },
        // Lower NE — the question lands more softly
        { weight: ctx.state.lerp01(ne, 45, 25), value: `${name} asks if you're okay. The voice is gentler than usual, underneath the usual volume. You answer. It goes somewhere.` },
      ]);
    },
    stressed_out: (name) => {
      const gaba = ctx.state.get('gaba');
      return ctx.timeline.weightedPick([
        { weight: 1, value: `${name} looks up from their screen. Looks at you. "You know what, same." A pause. Then back to the screen. Something in having that acknowledged — even badly — settles slightly.` },
        { weight: 1, value: `"Hey." ${name}, quieter than usual. "You look how I feel. Which — I know that's not helpful. But." A shrug. "I see it."` },
        // Low GABA — their stress recognition just adds to the frequency
        { weight: ctx.state.lerp01(gaba, 40, 20), value: `${name} glances over. "Rough one?" You nod. ${name} makes a sound that might be agreement or solidarity or both. It doesn't help, exactly. But someone saw.` },
        // Higher GABA — being recognized steadies something
        { weight: ctx.state.lerp01(gaba, 50, 70), value: `${name} stops midway through something, looks at you. "How are you actually doing." Not the version of the question that expects fine. You consider it. You answer something true.` },
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
      const tasksDone = ctx.events.count('work_task_done', ctx.state.get('wake_period_start'));
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

      // Hygiene self-awareness at work
      const hyg = ctx.state.hygieneTier();
      if (hyg === 'grimy') {
        desc += ' You\'re aware of yourself in a specific way — the kind of aware that makes you keep your distance.';
      } else if (hyg === 'stale') {
        desc += ' You should have showered. You know.';
      }

      // Skin condition — hands at keyboard
      const skinO = ctx.state.skinConditionTier();
      if (skinO === 'cracked') {
        desc += ' Your knuckles snag on the keyboard. The skin is cracked enough to catch.';
      } else if (skinO === 'tight') {
        desc += ' Your hands are dry. The keyboard feels different because of it.';
      }

      return desc;
    },

    retail: () => {
      const mood = ctx.state.moodTone();
      const job = ctx.state.jobTier();
      const energy = ctx.state.energyTier();
      const stress = ctx.state.stressTier();
      const tasksDone = ctx.events.count('work_task_done', ctx.state.get('wake_period_start'));
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

      // Hygiene self-awareness at work
      const hyg = ctx.state.hygieneTier();
      if (hyg === 'grimy') {
        desc += ' You\'re conscious of yourself in a way that makes you want to face the shelves.';
      } else if (hyg === 'stale') {
        desc += ' You should have found time for a shower.';
      }

      return desc;
    },

    food_service: () => {
      const mood = ctx.state.moodTone();
      const job = ctx.state.jobTier();
      const energy = ctx.state.energyTier();
      const stress = ctx.state.stressTier();
      const tasksDone = ctx.events.count('work_task_done', ctx.state.get('wake_period_start'));
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

      // Hygiene in food service — this matters more here
      const hyg = ctx.state.hygieneTier();
      if (hyg === 'grimy') {
        desc += ' You\'re thinking about it. The kind of thinking you can\'t stop once it starts.';
      } else if (hyg === 'stale') {
        desc += ' You notice it. You hope no one else does.';
      }

      // Skin condition — hands in water at food service
      const skinF = ctx.state.skinConditionTier();
      if (skinF === 'cracked') {
        desc += ' The dishwater finds the cracks in your hands. The ones around the knuckles.';
      } else if (skinF === 'tight') {
        desc += ' Your hands are tight and dry. The work doesn\'t help.';
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

      // Gastritis — the morning ache is usually the worst: stomach empty all night (deterministic, no RNG)
      const gastritisT = ctx.state.gastritisTier();
      if (gastritisT === 'burn') {
        desc += ' Something below your ribs is already going. It started before you were fully awake.';
      } else if (gastritisT === 'ache') {
        desc += ' A gnawing, somewhere in your middle. The body asking for something before you\'ve even processed what day it is.';
      } else if (gastritisT === 'gnaw') {
        desc += ' Low-level, below the ribs. That particular empty-stomach feeling that\'s also something more than empty.';
      }

      // Vasovagal — body-awareness override (deterministic, no RNG)
      const vvTierBed = ctx.state.vasovagalTier();
      if (vvTierBed === 'prodrome') {
        desc += ' Something is wrong. Light at the edge of your vision grays out for a moment and then comes back.';
      } else if (vvTierBed === 'building') {
        desc += ' Light-headed. You notice it, then stop noticing it, then notice it again.';
      } else if (vvTierBed === 'recovery') {
        desc += ' You\'re still shaky. The room has a quality of recently having been unstable.';
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
      if (ctx.state.hasInterrupt('wake_alarm')
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

      // Vasovagal modifier (deterministic, no RNG)
      const vvTierKitch = ctx.state.vasovagalTier();
      if (vvTierKitch === 'prodrome') {
        desc += ' You grip the counter. Something in your ears has changed.';
      } else if (vvTierKitch === 'building') {
        desc += ' A light-headedness you keep almost noticing.';
      } else if (vvTierKitch === 'recovery') {
        desc += ' You stay near the counter. Just in case.';
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
      const hygiene = ctx.state.hygieneTier();
      const mess = ctx.mess.tier();

      let desc = 'The bathroom. Mirror, sink, shower.';

      if (mood === 'numb' || mood === 'hollow') {
        desc = 'The bathroom. The mirror is there. You don\'t have to look.';
      } else if (mood === 'fraying') {
        desc = 'Tile walls. The faucet drips on its own schedule.';
      }

      if (hygiene === 'stale' || hygiene === 'grimy') {
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

      // Age-stage shading — deterministic modifier (layer 3, no RNG).
      // Relationship to the mirror and the face in it changes over time.
      // Only fires when mood allows looking.
      if (mood !== 'numb' && mood !== 'hollow') {
        const ageStage = ctx.state.ageStageTier();
        if (ageStage === 'midlife') {
          desc += ' The face in the mirror is fine. You just need a second sometimes.';
        } else if (ageStage === 'older') {
          desc += ' You\'ve made your peace with the mirror. Mostly.';
        }
      }

      // Post-shower phone awareness — just showered, something waiting
      if (ctx.events.any('showered', ctx.state.get('wake_period_start'))) {
        const hasUnread = ctx.state.hasUnreadMessages();
        const bg1 = ctx.state.sentimentIntensity('friend1', 'guilt');
        const bg2 = ctx.state.sentimentIntensity('friend2', 'guilt');
        const bguilt = Math.max(bg1, bg2);
        if (ctx.state.get('phone_inbox').some(m => !m.read && m.subtype === 'in_need')) {
          desc += ' Your phone is wherever you left it. You keep thinking about it.';
        } else if (hasUnread && bguilt > 0.08) {
          desc += ' Your phone is in the other room. You know.';
        } else if (hasUnread) {
          desc += ' Something waiting on your phone. It was there before. It\'ll still be there.';
        }
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
        const hasUmbrella = ctx.state.get('has_umbrella');
        desc += hasUmbrella
          ? ' Rain coming down. The umbrella is in your bag.'
          : ' The shelter doesn\'t quite cover the bench.';
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

    workplace_bathroom: () => {
      const stress = ctx.state.stressTier();
      const ne = ctx.state.get('norepinephrine');
      const aden = ctx.state.get('adenosine');
      const gaba = ctx.state.get('gaba');
      let desc = 'The restroom. Fluorescent light, the low hum of ventilation. A door that locks.';
      if (ne > 65) {
        desc += ' The quiet in here is specific. Nothing has a request.';
      } else if (gaba < 32) {
        desc += ' Even the quiet has a texture. You\'re still in your body.';
      } else if (aden > 65) {
        desc += ' The fluorescent light flattens everything a little.';
      } else if (stress === 'overwhelmed' || stress === 'strained') {
        desc += ' Nobody can see you in here.';
      }
      return desc;
    },

    corner_store: () => {
      const money = ctx.state.moneyTier();
      const hunger = ctx.state.hungerTier();
      const mood = ctx.state.moodTone();
      const recog = ctx.state.locationVisitTier('corner_store');

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

      // Recognition tier — deterministic (no RNG)
      if (recog === 'regular') {
        // A fixture: nothing needs explaining
        desc += ' The same cashier. She doesn\'t look up but there\'s nothing strange about you being here.';
      } else if (recog === 'familiar') {
        desc += ' The cashier glances up, then back down. Something in the transaction is already assumed.';
      } else if (mood === 'hollow') {
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

      // Hygiene — a small public space where it registers
      const hyg = ctx.state.hygieneTier();
      if (hyg === 'grimy') {
        desc += ' You move through quickly. The fluorescent light is too much.';
      }

      return desc;
    },

    soup_kitchen: () => {
      const mood = ctx.state.moodTone();
      const hunger = ctx.state.hungerTier();
      const visits = ctx.state.get('soup_kitchen_visits');
      const recog = ctx.state.locationVisitTier('soup_kitchen');
      const hour = ctx.state.getHour();

      let desc;
      if (visits === 0) {
        // First time here — the specifics land harder
        if (mood === 'hollow' || mood === 'numb') {
          desc = 'Long tables. Folding chairs. Someone at the door hands you a tray. You take it.';
        } else {
          desc = 'Long tables, folding chairs, the smell of large-quantity cooking. More people than you expected.';
        }
      } else if (recog === 'regular') {
        // A fixture here. That's not comfortable. It's just true.
        if (mood === 'hollow' || mood === 'numb') {
          desc = 'The community meal. You know where to go, and they know you\'re going there.';
        } else {
          desc = 'The hall. You\'ve been here enough that you know which table gets the most light, which seat is furthest from the door. It\'s just knowledge. It doesn\'t mean anything.';
        }
      } else {
        // Familiar now (familiar tier or any subsequent visit before regular)
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
      const recog = ctx.state.locationVisitTier('food_bank');

      let desc;
      if (visits === 0) {
        if (mood === 'hollow' || mood === 'numb') {
          desc = 'A waiting area. Chairs along the wall. A folding table with a sign-in sheet.';
        } else {
          desc = 'A waiting area with chairs along the wall. Other people. A folding table, a sign-in sheet, a volunteer who smiles at everyone equally.';
        }
      } else if (recog === 'regular') {
        // Staff knows your face. Nothing more than that.
        if (mood === 'hollow' || mood === 'numb') {
          desc = 'The food bank. The staff know you here.';
        } else {
          desc = 'The waiting area. The staff member at the desk glances up and reaches for the clipboard before you\'ve said anything. You\'re in the system. That\'s all it means.';
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
  // Approximation debts (corner store prices): these should eventually derive from character neighborhood /
  // local cost of living. For now, single named constants so the duplication is in
  // one place and the debt is visible.
  const CORNER_STORE_COFFEE_PRICE = 2.25; // TODO: derive from neighborhood cost-of-living
  const CORNER_STORE_CIGARETTES_PRICE = 9.50; // Pack of 20. Approximation debt (nicotine): price chosen; real cigarette prices vary enormously by jurisdiction ($5–$15+). TODO: derive from neighborhood cost-of-living.

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
        const preSleepCort = ctx.state.get('cortisol');

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

        // Alarm interruption — check if any scheduled alarm fires during this sleep
        let wokeByAlarm = false;
        const sleepNow = ctx.state.get('time');
        for (const interrupt of ctx.state.get('scheduled_interrupts')) {
          if (interrupt.type === 'alarm' && !interrupt.fired) {
            const minutesToInterrupt = interrupt.triggerAt - sleepNow;
            if (minutesToInterrupt > fallAsleepDelay && minutesToInterrupt < fallAsleepDelay + sleepMinutes) {
              // Alarm fires during sleep — chance to sleep through if depleted
              // Approximation debt (sleep cycles): 0.3 probability of sleeping through alarm at depleted energy chosen
              if (energy === 'depleted' && ctx.timeline.chance(0.3)) {
                // Sleep through — reschedule to next day so checkEvents doesn't re-fire post-wake
                ctx.state.rescheduleInterrupt(interrupt.id, interrupt.triggerAt + 1440);
                ctx.events.record('slept_through_alarm', {});
              } else {
                // Alarm truncates sleep; reschedule to next day so checkEvents doesn't re-fire
                sleepMinutes = Math.max(30, minutesToInterrupt - fallAsleepDelay);
                wokeByAlarm = true;
                ctx.state.rescheduleInterrupt(interrupt.id, interrupt.triggerAt + 1440);
              }
              break;
            }
          }
        }

        // Quality factor — stress and hunger degrade recovery
        // Approximation debt (sleep quality): all sleep quality multipliers below are chosen, not derived from
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
        // Approximation debt (sleep quality): should condition on environmental noise tier when that exists.
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

        // Alcohol interference — REM suppression despite apparent sedation
        // Ebrahim et al. 2013 (PMID 23347102): alcohol increases SWS, reduces REM.
        // Net quality is poor — emotional processing impaired; hangover worse with more sleep.
        qualityMult *= ctx.state.alcoholSleepInterference();

        // Cannabis interference — THC suppresses REM sleep.
        // Babson et al. 2017 (PMID 28349316): THC reduces REM latency and total REM time.
        // REM suppression during use; rebound vivid/disturbing dreams during withdrawal.
        qualityMult *= ctx.state.cannabisSleepInterference();

        // Illness — fever and immune activation degrade sleep architecture
        if (ctx.state.illnessTier() !== 'healthy') {
          const sev = ctx.state.get('illness_severity');
          qualityMult *= Math.max(0.5, 1 - sev * 0.35); // Approximation debt (illness): illness quality penalty coefficient 0.35 chosen
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
        // Saturating exponential: dose-response is concave, not linear (Dinges 1999 PMID 10201061;
        // Rupp 2009 PMC2910531). τ=234 min calibrated to midpoint between objective performance
        // τ≈128 min and subjective sleepiness τ≈545 min. Scaling 110 preserves ~96 gain at 8h
        // (matching prior linear formula at the plateau). Approximation debt (sleep quality): τ and scaling chosen.
        const energyGain = (1 - Math.exp(-sleepMinutes / 234)) * 110 * qualityMult * debtPenalty;

        // Sleep cycle breakdown — determines deep sleep / REM architecture
        const cycles = ctx.state.sleepCycleBreakdown(sleepMinutes);

        // Neurochemistry: sleep effects
        // Store sleep quality for serotonin/NE target functions
        ctx.state.set('last_sleep_quality', qualityMult);
        // Adenosine: cleared by deep sleep. Exponential kinetics: clearance is faster early in sleep
        // when pressure is high, slower later (Process S two-process model, Borbély 1984 PMID 6696142;
        // τ 2.7–4h from SWA dissipation data → τ=201 min midpoint). Elmenhorst 2017 (PMID 28373571)
        // shows near-complete A1 receptor restoration after full recovery sleep, supporting max ~0.9.
        // Xie 2013 citation retained for glymphatic mechanism but does not derive stage-specific
        // fractions. Approximation debts (sleep cycles): max fraction (0.9), baseline (0.4), deep-sleep weight (0.6).
        const adenosineClear = -(1 - Math.exp(-sleepMinutes / 201)) * ctx.state.get('adenosine') * 0.9 * (0.4 + 0.6 * cycles.deepSleepFrac);
        ctx.state.adjustNT('adenosine', adenosineClear);
        // Serotonin: good sleep promotes synthesis, poor sleep impairs
        // Approximation debt (NT coupling): serotonin sleep adjustments (+3 good sleep / -2 poor sleep) and
        // thresholds (0.9 / 0.6) chosen. NE clearing coefficient -4 and remFrac threshold 0.15
        // are chosen. These are direct NT kicks outside the drift system.
        ctx.state.adjustNT('serotonin', qualityMult >= 0.9 ? 3 : qualityMult < 0.6 ? -2 : 0);
        // Norepinephrine: REM sleep is the NE-free environment — more REM = better NE clearing
        const neClear = cycles.remFrac * qualityMult;
        ctx.state.adjustNT('norepinephrine', neClear > 0.15 ? -4 * neClear : qualityMult < 0.6 ? 3 : 0);

        ctx.state.set('is_sleeping', true);
        ctx.state.advanceTime(fallAsleepDelay + sleepMinutes);
        ctx.state.set('is_sleeping', false);

        // Phone charges overnight if sleeping at home
        if (ctx.state.get('location') === 'apartment_bedroom') {
          const chargeHours = (fallAsleepDelay + sleepMinutes) / 60;
          ctx.state.adjustBattery(chargeHours * 30);
        }

        ctx.state.adjustEnergy(energyGain);
        // Approximation debt (sleep quality): divisor 20 (= 0.05 stress reduction per minute of sleep) chosen.
        ctx.state.adjustStress(-sleepMinutes / 20);
        ctx.state.set('actions_since_rest', 0);

        // Sleep emotional processing — REM quality determines processing effectiveness
        const emotionalQuality = qualityMult * (0.4 + 0.6 * cycles.remFrac);
        ctx.state.processSleepEmotions(ctx.character.get().sentiments, emotionalQuality, sleepMinutes);

        // Friend absence — guilt accumulates per night of silence
        ctx.state.processAbsenceEffects();

        // Fridge food slowly goes bad overnight
        // Approximation debt (food spoilage): 15%/sleep spoilage rate chosen; real rate depends on food type, temperature, storage
        if (ctx.state.fridgeTier() !== 'empty' && ctx.timeline.chance(0.15)) {
          ctx.state.set('fridge_food', Math.max(0, ctx.state.get('fridge_food') - 1));
        }

        // Illness onset / progression — always 2 balanced RNG calls per sleep
        const illnessRoll1 = ctx.timeline.random();
        const illnessRoll2 = ctx.timeline.randomInt(0, 3);
        if (ctx.state.illnessTier() === 'healthy') {
          // Approximation debt (illness): all magnitudes need calibration against real incidence data.
          // No seasonal variation, no recent-illness immunity, no job-type exposure rates.
          // Should eventually derive from: immune function state, job type (food service
          // vs remote), season/climate, recent illness history.
          const stressRisk  = ['strained', 'overwhelmed'].includes(ctx.state.stressTier())  ? 0.005 : 0;
          const debtRisk    = ['moderate', 'severe'].includes(ctx.state.sleepDebtTier())    ? 0.005 : 0;
          const workedRisk  = ctx.events.any('arrived_at_work', ctx.state.get('wake_period_start')) ? 0.003 : 0;
          const baseChance  = 0.007 + stressRisk + debtRisk + workedRisk;
          if (illnessRoll1 < baseChance) {
            const types = ['flu', 'cold', 'cold', 'gi']; // cold more common
            ctx.state.set('illness_severity', 0.2);
            ctx.state.set('illness_type', types[illnessRoll2]);
            ctx.state.set('illness_day', 0);
          }
        } else {
          // Deterministic progression — RNG already consumed above
          // Approximation debt (illness): illness progression rates (0.18/night unmedicated, 0.07 medicated),
          // base recovery (0.12 + quality×0.10), work recovery penalty (40%), medicine bonus (0.05)
          // all chosen. Real illness arc depends heavily on pathogen, immune status, treatment type.
          const illDay    = ctx.state.get('illness_day');
          const sev       = ctx.state.get('illness_severity');
          const medicated = ctx.events.any('took_medicine', ctx.state.get('wake_period_start'));
          ctx.state.set('illness_day', illDay + 1);
          if (illDay < 2) {
            // Peak phase — severity builds, medicine slows it
            const increase = medicated ? 0.07 : 0.18;
            ctx.state.set('illness_severity', Math.min(1.0, sev + increase));
          } else {
            // Recovery — rest helps, working delays it, medicine speeds it
            const baseRecovery  = 0.12 + qualityMult * 0.1;
            const recoveryRate  = ctx.events.any('arrived_at_work', ctx.state.get('wake_period_start')) ? baseRecovery * 0.4 : baseRecovery;
            const medBonus      = medicated ? 0.05 : 0;
            const newSev        = Math.max(0, sev - recoveryRate - medBonus);
            ctx.state.set('illness_severity', newSev);
            if (newSev < 0.05) {
              ctx.state.set('illness_type', null);
              ctx.state.set('illness_day', 0);
            }
          }
        }

        // Clothing state carries through sleep unchanged.
        // The player may have explicitly undressed before sleeping, or not — both are valid.
        // Sleeping in clothes is real: exhaustion, depression, cultural norm, just collapsed.
        // wearState progression (worn_once → worn_out → dirty) only happens on explicit undress.

        // Skin condition recovers during sleep — cell renewal, barrier repair.
        // Approximation debt (job standing): base 3 + quality bonus 2 chosen; no literature derivation.
        ctx.state.adjustSkinCondition(3 + qualityMult * 2);

        // Capture rem_rebound_pending BEFORE processSleepEnd() — it holds last night's value.
        // processSleepEnd() will overwrite it with THIS night's suppression state (for next sleep).
        const remReboundPending = ctx.state.get('rem_rebound_pending');

        // Sleep-model cleanup: nausea, social energy, caffeine habit, dental floor.
        ctx.state.processSleepEnd();

        // Reset wake-period flags
        ctx.state.wakeUp();
        ctx.linens.noteSlept();
        // Record alarm wake AFTER wakeUp() sets wake_period_start — so event falls in this period
        if (wokeByAlarm) {
          ctx.events.record('woke_by_alarm', {});
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
        // Persist sleep inertia so it decays over time during the wake period
        ctx.state.set('sleep_inertia', sleepInertia);

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
          } else if (fallAsleepDelay >= 20) {
            // Insomnia / prolonged onset — lying awake before sleep finally comes
            asleep = ctx.timeline.weightedPick([
              { weight: 1, value: 'You lie in the dark and wait. Sleep is somewhere nearby — you can feel the edge of it — but you can\'t get there. An hour passes. Maybe more. Eventually something in you gives up trying and that\'s when it happens.' },
              { weight: 1, value: 'The ceiling. The dark. Your own breathing. You shift positions. Shift again. Your body is tired but won\'t go quiet, like an engine that keeps turning over without catching.' },
              { weight: 1, value: 'Thirty minutes of the same four thoughts. An hour. You lose track. Sleep arrives eventually, the way it always does — when you\'ve stopped watching for it.' },
              // High NE — the body is scanning, can't stand down
              { weight: ctx.state.lerp01(preSleepNE, 55, 80), value: 'Every sound registers. The building. A car. Something in the kitchen settling. Your body refuses to accept that none of it matters, that you can stop tracking it now. You can\'t stop tracking it.' },
              // Low GABA — the wire that won't stop
              { weight: ctx.state.lerp01(preSleepGaba, 40, 15), value: 'Your body is exhausted but your chest stays tight. Every time you get close — the soft edge of sleep right there — something tightens and you\'re back in the room, back behind your eyes, back to counting minutes.' },
              // High cortisol — stomach and body tension
              { weight: ctx.state.lerp01(preSleepCort, 55, 80), value: 'You lie still and your stomach is a knot. Your shoulders won\'t drop. You tell your hands to open and they do but something behind your ribs won\'t. The minutes accumulate.' },
              // Low serotonin — 3am quality, even if it\'s 11pm
              { weight: ctx.state.lerp01(preSleepSer, 40, 15), value: 'The dark has a specific texture when you\'re awake in it too long. Not frightening, just present. Heavy. The thoughts that come aren\'t dramatic — just the ordinary inventory of what\'s wrong, played on low, on repeat, while you wait.' },
              // High adenosine — heavy and dissociated, still can\'t cross over
              { weight: ctx.state.lerp01(preSleepAden, 60, 85), value: 'You\'re exhausted enough that your thoughts have gone soft and disconnected, but sleep keeps slipping away just before it arrives. Heavy. Foggy. Right there. Not there. You drift in the space between for a long time.' },
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
        if (ctx.events.any('slept_through_alarm', ctx.state.get('wake_period_start'))) {
          waking += ' Your phone is quiet. The alarm went off, earlier. You think.';
        }

        // Age-stage shading — deterministic modifier (layer 3, no RNG).
        // Age doesn't announce itself; it's just the specific quality of the tiredness.
        {
          const ageStage = ctx.state.ageStageTier();
          if (ageStage === 'young_adult' && (postEnergy === 'depleted' || postEnergy === 'exhausted')) {
            waking += ' You\'re still surprised, a little. That the body does this. That this is what tired actually means.';
          } else if (ageStage === 'midlife' && (postEnergy === 'depleted' || postEnergy === 'exhausted')) {
            waking += ' This is just what mornings are now. You stopped waiting for them to be different.';
          } else if (ageStage === 'older' && (postEnergy === 'depleted' || postEnergy === 'exhausted')) {
            waking += ' Every morning is a renegotiation. You lie there and let the body make its case.';
          }
        }

        // Menstrual first-day signal — woven into waking prose, not announced.
        // cycle_day is already advanced by processSleepEnd() before wakeUp() runs.
        // Day 1 = first morning of flow. Body knows before the mind names it.
        if (ctx.body.hasUterus() && ctx.state.get('cycle_day') === 1) {
          const crampSev = ctx.state.get('cramp_severity') || 0;
          if (crampSev > 0.3) {
            // Cramping is already there on waking
            waking += ' Something in your lower abdomen — a dull pull, familiar in the specific way things are familiar before you\'ve thought about them.';
          } else {
            // Lighter — a subtle body awareness
            waking += ' There\'s something faintly different about your body this morning. Not wrong. Just — different. Your body doing what it does.';
          }
        }

        // Ran out of supplies during flow — register on next waking if needs_period_supplies is set
        if (ctx.body.hasUterus() && ctx.state.get('needs_period_supplies') && ctx.state.cyclePhaseTier() === 'menstrual') {
          waking += ' You\'ll need supplies today.';
        }

        // --- Dream fragments ---
        // Liminal residue of REM sleep — not narrative, just the already-dissolving edge of something.
        // 1 RNG call (weightedPick). Falls through to null if quality is too poor for recall.
        // remReboundPending = last night had REM suppression (cannabis/alcohol) → rebound vivid dreams.
        {
          const dreamsEnabled = quality !== 'poor' && cycles.remFrac > 0.10;
          const remWeight = dreamsEnabled ? cycles.remFrac : 0; // scales recall probability with REM
          // High adenosine on waking = deep slow-wave recovery sleep → no dream recall, just depth sense
          const deepBlank = dreamsEnabled ? ctx.state.lerp01(postAden, 50, 75) : 0;
          // NT shading weights
          const warmSer   = dreamsEnabled ? ctx.state.lerp01(postSer, 55, 80) : 0;  // high serotonin: warm, dissolving
          const dreadSer  = dreamsEnabled ? ctx.state.lerp01(postSer, 40, 15) : 0;  // low serotonin: wrong-toned
          const sharpNE   = dreamsEnabled ? ctx.state.lerp01(postNE, 50, 70)  : 0;  // high NE: accessible but anxious
          // Rebound pool: vivid, disorienting (last night had REM suppression)
          const reboundWeight = remReboundPending && dreamsEnabled ? remWeight * 1.5 : 0;

          const fragment = ctx.timeline.weightedPick([
            // Null: dreams present but not retained — the most common outcome
            { weight: 1.8, value: null },

            // Deep-blank: so much slow-wave recovery, nothing surfaced
            { weight: deepBlank, value: '\n\nYou slept deep. No images. Just the sense of having been somewhere a long way down.' },
            { weight: deepBlank * 0.7, value: '\n\nNothing came up. The sleep was all the way under.' },

            // Standard dissolution — warm/neutral, already gone
            { weight: remWeight * 0.9, value: '\n\nThere was a dream. You can\'t find it now.' },
            { weight: remWeight * 0.8, value: '\n\nSomething warm. Gone.' },
            { weight: remWeight * 0.7, value: '\n\nYou were somewhere. A room you don\'t recognize. Someone was with you, someone who made sense in the dream but doesn\'t now. Both already dissolving.' },
            { weight: remWeight * 0.7, value: '\n\nYour hands were doing something repetitive. You knew the motion. You don\'t know what it was for.' },
            { weight: remWeight * 0.6, value: '\n\nThe wrong geography. A place that was two places at once, and that seemed fine at the time.' },
            { weight: remWeight * 0.6, value: '\n\nYou were late for something. You always are, in dreams.' },

            // High serotonin: warmth before the forgetting
            { weight: warmSer * 0.9, value: '\n\nSomething good was happening. You\'re not sure what. The feeling is still here for a second, the way warmth stays in a room after the heat goes off.' },
            { weight: warmSer * 0.8, value: '\n\nYou were with someone. It felt easy in the way things rarely feel easy. You\'re already losing the face, losing the reason it mattered.' },

            // Low serotonin: dread-toned without cause
            { weight: dreadSer * 0.9, value: '\n\nThe dream wasn\'t good. You can\'t say why. Something about the light in it, or the way nothing had exits.' },
            { weight: dreadSer * 0.8, value: '\n\nThere was a feeling — not an event, just a feeling — that followed you out of sleep. Already fading. Still there.' },
            { weight: dreadSer * 0.7, value: '\n\nSomebody said something. You don\'t have the words anymore, just the shape they left.' },

            // High NE: fragments more accessible but anxious-textured
            { weight: sharpNE * 0.9, value: '\n\nYou were running, or trying to. Something about the terrain — it wouldn\'t cooperate. You remember the effort more than the place.' },
            { weight: sharpNE * 0.8, value: '\n\nA door. You kept coming back to it. It was fine. It was wrong. Both things were true and you couldn\'t pick which.' },

            // Rebound: vivid, disorienting, harder to shake
            { weight: reboundWeight, value: '\n\nThe dream is still here — more than it should be. Edges too sharp, colors a bit off. You were in a building that kept changing rooms. It made complete sense the whole time. Now it doesn\'t. Now it\'s just wrong.' },
            { weight: reboundWeight * 0.9, value: '\n\nYou remember too much. Fragments that don\'t belong to anything, lit too brightly, already losing coherence but refusing to disappear. Something about a long corridor. Someone calling from one end, and you going the other way, and not being able to stop going the other way.' },
            { weight: reboundWeight * 0.8, value: '\n\nThe dream had a logic to it. A whole internal logic. Now you\'re awake and the logic is gone and what\'s left is just a pile of images that don\'t fit together — a window, a specific quality of afternoon light, someone\'s shoes.' },
          ]);

          if (fragment !== null) {
            waking += fragment;
          }
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
        // Read cleanliness of about-to-be-worn outfit before wear() changes state
        const startingCleanliness = ctx.clothing.wornCleanlinessValue();
        ctx.state.set('dressed', true);
        ctx.state.set('clothing_cleanliness', startingCleanliness);
        ctx.clothing.wear();
        ctx.state.advanceTime(5);
        ctx.events.record('got_dressed');

        // Set visible damage flag: torn or stained on outer layer
        const visibleDamage = ctx.clothing.damagedWornItems()
          .some(d => ['top', 'bottom', 'dress', 'outerwear'].includes(d.item.type)
            && (d.types.includes('torn') || d.types.includes('stained')));
        ctx.state.set('clothing_visible_damage', visibleDamage);

        // Stretched damage — silent accumulation; triggers after wear threshold + small probability
        // 1 RNG call, balanced on all branches
        // Approximation debt (clothing condition): threshold 30 wears; trigger probability 15% per wear beyond threshold; no empirical basis
        {
          const roll = ctx.timeline.random();
          const candidate = ctx.clothing.wornItemOfType(['bottom', 'top']);
          if (candidate && !candidate.damage?.stretched) {
            const wears = candidate.wearCount ?? 0;
            if (wears >= 30 && roll < 0.15) { // Approximation debt (clothing condition):
              ctx.clothing.applyDamage(candidate.id, 'stretched');
            }
          }
        }

        const mood = ctx.state.moodTone();
        const outfit = ctx.clothing.outfitDescription() || 'something';
        const cleanTier = ctx.state.clothingCleanlinessTier();

        if (mood === 'numb' || mood === 'heavy') {
          if (cleanTier === 'dirty') {
            return `${outfit}. They've been worn before. You put them on anyway.`;
          }
          return `${outfit}. Each piece is a separate decision. You make them all, eventually.`;
        }
        if (grabbingFromFloor) {
          if (cleanTier === 'dirty') {
            return `${outfit}, from the floor. The collar's gone stiff. It'll do.`;
          }
          return `${outfit}, from the floor. It'll do.`;
        }
        // Deterministic cleanliness texture — no RNG
        if (cleanTier === 'fresh') {
          return `${outfit}. Something about fresh laundry.`;
        }
        // Default — deterministic texture via energy/stress, no RNG
        const energy = ctx.state.energyTier();
        if (energy === 'depleted' || energy === 'exhausted') {
          return `${outfit}. You're dressed. That's the bar.`;
        }
        if (ctx.state.stressTier() === 'strained' || ctx.state.stressTier() === 'overwhelmed') {
          return `${outfit}. Good enough.`;
        }
        return `${outfit}. You get dressed.`;
      },
    },

    undress_floor: {
      id: 'undress_floor',
      label: 'Leave them on the floor',
      location: 'apartment_bedroom',
      available: () => ctx.state.get('dressed'),
      execute: () => {
        ctx.state.set('dressed', false);
        ctx.state.set('clothing_visible_damage', false);
        ctx.clothing.undress('floor_bedroom');
        ctx.state.advanceTime(3);
        const aden = ctx.state.get('adenosine');
        const ser  = ctx.state.get('serotonin');
        // 1 RNG call: NT-shaded variant
        const pool = [
          { weight: 1, value: 'Your clothes land on the floor. You step out of them.' },
          { weight: ctx.state.lerp01(aden, 60, 90), value: 'The floor. You don\'t have the angle for anything else right now.' },
          { weight: ctx.state.lerp01(ser, 30, 5), value: 'The clothes go down. Something about that feels true.' },
        ];
        return ctx.timeline.weightedPick(pool);
      },
    },

    undress_chair: {
      id: 'undress_chair',
      label: 'Drape them over the chair',
      location: 'apartment_bedroom',
      available: () => ctx.state.get('dressed'),
      execute: () => {
        ctx.state.set('dressed', false);
        ctx.state.set('clothing_visible_damage', false);
        ctx.clothing.undress('accessible');
        ctx.state.advanceTime(3);
        const ser  = ctx.state.get('serotonin');
        const aden = ctx.state.get('adenosine');
        // 1 RNG call: NT-shaded variant
        const pool = [
          { weight: 1, value: 'You fold your clothes loosely over the back of the chair.' },
          { weight: ctx.state.lerp01(ser, 65, 90), value: 'You shake them out a little before you drape them. Habit.' },
          { weight: ctx.state.lerp01(aden, 55, 80), value: 'The chair. Good enough.' },
        ];
        return ctx.timeline.weightedPick(pool);
      },
    },

    undress_basket: {
      id: 'undress_basket',
      label: 'Put them in the laundry',
      location: 'apartment_bedroom',
      available: () => ctx.state.get('dressed'),
      execute: () => {
        ctx.state.set('dressed', false);
        ctx.state.set('clothing_visible_damage', false);
        ctx.clothing.undress('laundry_basket');
        ctx.state.advanceTime(3);
        const dopa = ctx.state.get('dopamine');
        const ser  = ctx.state.get('serotonin');
        // 1 RNG call: NT-shaded variant
        const pool = [
          { weight: 1, value: 'You put your clothes in the laundry basket.' },
          { weight: ctx.state.lerp01(dopa, 50, 75), value: 'Straight into the basket. One thing done right.' },
          { weight: ctx.state.lerp01(ser, 25, 5), value: 'Into the basket. Small, but something.' },
        ];
        return ctx.timeline.weightedPick(pool);
      },
    },

    set_alarm: {
      id: 'set_alarm',
      label: 'Set your alarm',
      // Available from bedroom (evening/night) or from phone alarm app (any time)
      location: null,
      available: () => {
        if (!ctx.state.get('has_phone') || ctx.state.get('phone_battery') <= 0) return false;
        // From phone alarm app
        if (ctx.state.get('viewing_phone') && ctx.state.get('phone_screen') === 'alarms') return true;
        // From bedroom at night
        const time = ctx.state.timePeriod();
        return ctx.world.getLocationId() === 'apartment_bedroom'
          && (time === 'evening' || time === 'night' || time === 'deep_night');
      },
      execute: (data = {}) => {
        // If data.alarmTod is provided (from phone app), use it.
        // Otherwise fall back to shift-relative auto-calculation (bedroom interaction).
        let alarmTod;
        if (data.alarmTod !== undefined) {
          alarmTod = data.alarmTod;
        } else {
          // Set alarm relative to next shift — enough time to get ready and commute
          const tomorrow = ctx.state.currentAbsoluteDay() + 1;
          const shiftStart = ctx.state.shiftFor(tomorrow)?.start ?? ctx.state.get('labor_arrangement').shift_start;
          alarmTod = shiftStart - 90; // 90 min before shift
        }
        const triggerAt = ctx.state.nextAbsoluteForTod(alarmTod);
        ctx.state.scheduleInterrupt('wake_alarm', triggerAt, 'alarm', { alarmTod });
        ctx.state.advanceTime(1);

        const h = Math.floor(alarmTod / 60);
        const m = alarmTod % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const timeStr = displayH + ':' + m.toString().padStart(2, '0') + ' ' + period;

        // If called from phone alarm app, return empty (phone UI re-renders)
        if (ctx.state.get('viewing_phone')) return '';
        return 'You set the alarm. ' + timeStr + '. The phone screen dims.';
      },
    },

    skip_alarm: {
      id: 'skip_alarm',
      label: 'Turn off your alarm',
      location: 'apartment_bedroom',
      available: () => {
        const time = ctx.state.timePeriod();
        return ctx.state.hasInterrupt('wake_alarm')
          && (time === 'evening' || time === 'night' || time === 'deep_night');
      },
      execute: () => {
        ctx.state.cancelInterrupt('wake_alarm');
        ctx.state.advanceTime(1);
        return 'You turn off the alarm. Tomorrow is tomorrow\'s problem.';
      },
    },

    snooze_alarm: {
      id: 'snooze_alarm',
      label: 'Snooze',
      location: 'apartment_bedroom',
      available: () => ctx.events.any('woke_by_alarm', ctx.state.get('wake_period_start')) && !ctx.events.any('dismissed_alarm', ctx.state.get('wake_period_start')),
      execute: () => {
        // Count previous snoozes before recording this one (0 = first snooze, 1 = second, etc.)
        const count = ctx.events.count('snoozed', ctx.state.get('wake_period_start'));
        // Reschedule alarm to re-fire in 9 minutes so checkEvents triggers it again
        ctx.state.rescheduleInterrupt('wake_alarm', ctx.state.get('time') + 9);
        ctx.state.advanceTime(9);
        const energyGain = ctx.timeline.randomInt(1, 3);
        ctx.state.adjustEnergy(energyGain);
        ctx.state.adjustNT('adenosine', -1);
        // Phone charges a tiny bit during snooze
        if (ctx.state.get('location') === 'apartment_bedroom') {
          ctx.state.adjustBattery(4);
        }

        ctx.events.record('snoozed', {});

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
      available: () => ctx.events.any('woke_by_alarm', ctx.state.get('wake_period_start')) && !ctx.events.any('dismissed_alarm', ctx.state.get('wake_period_start')),
      execute: () => {
        // Reschedule alarm for next occurrence (alarm was advanced to +1440 in sleep execute;
        // this re-anchors it precisely to the alarm's tod in case of snooze drift)
        const alarm = ctx.state.getInterrupt('wake_alarm');
        if (alarm) {
          ctx.state.rescheduleInterrupt('wake_alarm',
            ctx.state.nextAbsoluteForTod(alarm.data.alarmTod));
        }
        ctx.state.advanceTime(1);

        const count = ctx.events.count('snoozed', ctx.state.get('wake_period_start'));
        ctx.events.record('dismissed_alarm', { snoozeCount: count });
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

    smoke_cannabis: {
      id: 'smoke_cannabis',
      label: 'Smoke',
      // Home only — bedroom or kitchen (wherever feels natural to be). Distinct from
      // smoke_cigarette which is outdoors. Home smoking in one's own space is the
      // dominant pattern where legal; no outdoor/public cannabis smoking modeled.
      // Approximation debt (jurisdiction): legal/practical context for home smoking varies.
      location: 'apartment_bedroom',
      available: () => ctx.state.get('has_cannabis') > 0,
      execute: () => {
        ctx.state.set('has_cannabis', ctx.state.get('has_cannabis') - 1);
        ctx.state.consumeCannabis(60); // one unit ≈ 60 cannabis_level units
        ctx.state.advanceTime(ctx.timeline.randomInt(10, 20));

        // Evening or night — likely before sleep. Set sleep flag.
        const tod = ctx.state.timeOfDay();
        if (tod >= 18 * 60 || tod < 4 * 60) {
          ctx.state.set('cannabis_sleep_flag', true);
        }

        const tier = ctx.state.cannabisTier();
        const wd = ctx.state.cannabisWithdrawalTier();
        const mood = ctx.state.moodTone();
        const gaba = ctx.state.get('gaba');
        const da = ctx.state.get('dopamine');
        const tol = ctx.state.get('cannabis_tolerance');

        // Withdrawal relief — smoking just to get to normal (heavy tolerance case).
        // Heavy users: tolerance to euphoria, smoking to reach flat baseline.
        if (wd === 'moderate' || wd === 'severe') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You smoke. The flatness that\'s been there since morning doesn\'t lift exactly — it just becomes a different kind of flat. That\'s what you were reaching for.' },
            { weight: wd === 'severe' ? 2 : 1, value: 'You light up. The irritability had been sitting just under everything. After a few minutes it doesn\'t go away — it just stops being sharp.' },
            { weight: ctx.state.lerp01(tol, 60, 100), value: 'The thing you were trying to feel — you don\'t quite feel it. Your tolerance has been building for a while now. You finish it anyway.' },
          ]);
        }

        // Low dose / coming up — things slightly softer.
        if (tier === 'low') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Things get a little softer at the edges. Nothing dramatic. A slight warmth behind the sternum.' },
            { weight: 1, value: 'You smoke and wait. After a few minutes the room is the same room but it\'s a little further away. In a good way.' },
            { weight: ctx.state.lerp01(gaba, 50, 30), value: 'The thing that had been tight in your chest — it loosens, slightly. You hadn\'t realized how tight you\'d been.' },
            { weight: mood === 'heavy' || mood === 'fraying' ? 1.5 : 0.4, value: 'The edges of the day stop being edges. They\'re still there. Just not cutting the same way.' },
          ]);
        }

        // Active — harder to hold a thought, time moving strangely.
        if (tier === 'active') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Thoughts arrive and then leave before you\'ve finished with them. You follow one for a while and then you\'re somewhere else.' },
            { weight: 1, value: 'Time is doing something. You\'re aware of it in a way you normally aren\'t — each moment having more texture than usual, or less. Hard to tell.' },
            { weight: ctx.state.lerp01(da, 40, 65), value: 'The room has a pleasant quality. Things seem interesting in a low-key way — not urgent, just worth noticing.' },
            { weight: mood === 'numb' || mood === 'hollow' ? 1.5 : 0.3, value: 'You\'re not sure if this is helping exactly but you\'re more present in the room than you were. That\'s something.' },
          ]);
        }

        // High — dissociation, anxiety possible.
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Thoughts aren\'t quite connecting the way they usually do. You know this, distantly. The room is happening around you.' },
          { weight: 1, value: 'There\'s a gap between what you mean to do and what your hands do. You sit down. The ceiling is very much a ceiling.' },
          { weight: ctx.state.lerp01(ctx.state.get('norepinephrine'), 50, 75), value: 'Something is pulling tight underneath the high. Your heart is doing something you don\'t like. You breathe and try to stay with where you are.' },
        ]);
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

        // Background sensory prose — lying still, attention open and receptive
        const mid = ctx.senses.midSense('waiting');
        if (mid) text += '\n\n' + mid;
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

        let text;
        if (mood === 'numb') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You look out the window. The street is there. People, cars, the sky. You see all of it. None of it registers.' },
            { weight: 1, value: 'The window. The world on the other side of the glass. You watch it like it\'s on a screen — present, visible, not quite real.' },
            { weight: 1, value: 'Outside exists. You can see it. Knowing that doesn\'t do anything, but you look anyway.' },
            // Low dopamine — nothing catches
            { weight: ctx.state.lerp01(dopa, 40, 15), value: 'You look out. Things move — a person, a car, a bird. Your eyes follow without your permission. None of it reaches the part of you that would care.' },
            // Snow — white and still out there
            { weight: weather === 'snow' ? 1.5 : 0, value: 'Snow on the street, on the rooftops. White and quiet out there. You see all of it. None of it reaches you.' },
          ]);
        } else if (mood === 'heavy') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'The world outside. People going places. You\'re in here. The glass between you and that is thin but it might as well be a wall.' },
            { weight: 1, value: 'You look out. Trees, if there are trees. Sky. The distance between you and all of it feels wider than the window.' },
            { weight: 1, value: 'Outside is happening. You watch it from the bed. The effort of being out there — even thinking about it is a lot.' },
            // Low serotonin — the distance is heavier
            { weight: ctx.state.lerp01(ser, 35, 15), value: 'You look out and the world is right there, close enough to touch if you opened the window. You won\'t. The distance isn\'t the glass. It\'s everything between you and being a person who goes outside.' },
            // Snow — the white world feels like more pressure
            { weight: weather === 'snow' ? 1.5 : 0, value: 'Snow outside. The world white and quiet. The stillness of it doesn\'t help — it just makes the inside feel louder.' },
          ]);
        } else if (mood === 'fraying') {
          if (weather === 'clear') {
            ctx.state.adjustStress(-2);
            text = ctx.timeline.weightedPick([
              { weight: 1, value: 'You look out. Clear sky. The light is doing something good today — something open. Your shoulders drop half an inch. It helps.' },
              { weight: 1, value: 'The window. Blue out there, or close to it. Your eyes rest on the sky because it\'s the only thing not asking anything of you.' },
              { weight: 1, value: 'Clear outside. The light comes in and touches the floor. You stand in it for a minute. Something loosens, slightly.' },
              // Higher serotonin — the light actually reaches you
              { weight: ctx.state.lerp01(ser, 40, 60), value: 'The sky is clear and the light comes in and for a second it\'s just light — not an accusation, not a reminder. Just warmth on your face. Your shoulders come down. Your breath comes easier.' },
            ]);
          } else {
            text = ctx.timeline.weightedPick([
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
        } else if (mood === 'hollow') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You look out. Someone\'s walking a dog. Someone else is carrying groceries. People with destinations. You watch.' },
            { weight: 1, value: 'The window shows the usual. The street, the building opposite. A life-sized diorama of people going somewhere.' },
            { weight: 1, value: 'Outside. People. Movement. The glass keeps the sound out. You watch like it\'s an aquarium.' },
            // Low dopamine — watching without any pull to join
            { weight: ctx.state.lerp01(dopa, 40, 20), value: 'Someone crosses the street. Someone else waits at the corner. You watch them the way you\'d watch a screensaver — movement without meaning, pattern without pull.' },
            // Snow — the muted street fits
            { weight: weather === 'snow' ? 1.5 : 0, value: 'Snow out there. The street is slower, the usual movement muted under white. You watch from the glass. The stillness suits you, or you suit it. Hard to say.' },
          ]);
        } else if (mood === 'clear' || mood === 'present') {
          ctx.state.adjustStress(-3);
          text = ctx.timeline.weightedPick([
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
        } else {
          // flat
          ctx.state.adjustStress(-1);
          text = ctx.timeline.weightedPick([
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
        }

        // Background sensory prose — attention directed outward, room slightly receding
        const mid = ctx.senses.midSense('waiting');
        if (mid) text += '\n\n' + mid;
        return text;
      },
    },

    make_bed: {
      id: 'make_bed',
      label: 'Make the bed',
      location: 'apartment_bedroom',
      available: () => ctx.linens.bedState() !== 'made' && ctx.state.energyTier() !== 'depleted',
      execute: () => {
        ctx.linens.makeBed();
        ctx.events.record('apartment_cleaned');  // resets mess-notice dedup
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
        ctx.clothing.startWash();
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

        // Bleach stain roll — only when very tired (depleted/exhausted); very rare
        // Approximation debt (clothing condition): 3% stain probability when exhausted/depleted during laundry; no empirical basis
        {
          const roll = ctx.timeline.random();
          const energy = ctx.state.energyTier();
          const tiredEnough = energy === 'exhausted' || energy === 'depleted';
          const candidate = ctx.clothing.wornItemOfType(['top', 'bottom']);
          // Note: fold_laundry happens while not necessarily dressed — pick from stored items instead
          const laundryItems = ctx.clothing.wearableItems().filter(i =>
            ['top', 'bottom'].includes(i.type) && !i.damage?.stained
          );
          const target = laundryItems.length > 0 ? laundryItems[0] : null;
          if (target && tiredEnough && roll < 0.03) { // Approximation debt (clothing condition):
            ctx.clothing.applyDamage(target.id, 'stained');
            // Not on body, so visible_damage flag not updated here
          }
        }

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
        ctx.events.record('apartment_cleaned');  // resets mess-notice dedup
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

    home_workout: {
      id: 'home_workout',
      label: 'Work out at home',
      location: 'apartment_bedroom',
      available: () => {
        const et = ctx.state.energyTier();
        const st = ctx.state.stressTier();
        return et !== 'depleted' && et !== 'exhausted' && st !== 'overwhelmed' && ctx.state.migraineTier() !== 'severe';
      },
      execute: () => {
        const mood = ctx.state.moodTone();
        const minutes = 20; // Approximation debt (exercise): fixed 20-min home workout; real duration varies 15–30

        ctx.state.advanceTime(minutes);
        ctx.state.adjustEnergy(-12); // Approximation debt (exercise): energy cost 12; ~60% of running
        ctx.state.adjustHunger(9);   // Approximation debt (exercise): hunger +9; ~60% of running metabolic demand

        // Acute NE spike — sympathoadrenal activation, attenuated indoors vs. running
        ctx.state.adjustNT('norepinephrine', 8); // Approximation debt (exercise): NE +8; ~60% of running spike

        // Adenosine accumulation — same mechanism as running, proportional to effort
        ctx.state.adjustNT('adenosine', 5); // Approximation debt (exercise): +5 adenosine; proportional to effort

        // Endocannabinoid effect — present but smaller than running (intensity and duration matter)
        // Fuss 2015 (PMID 26453158): eCB-mediated euphoria requires sustained moderate-intensity effort
        ctx.state.adjustNT('endocannabinoid', 7); // Approximation debt (exercise): eCB +7; ~60% of running
        ctx.state.adjustNT('dopamine', 6);         // Approximation debt (exercise): DA +6 via eCB; attenuated
        ctx.state.adjustNT('gaba', 5);             // Approximation debt (exercise): GABA +5; attenuated

        // Post-exercise serotonin
        ctx.state.adjustNT('serotonin', 4); // Approximation debt (exercise): serotonin +4; attenuated afterglow

        // Clothing tear roll — 1 RNG call, balanced on all branches
        // Approximation debt (clothing condition): 4% torn probability per home workout; no empirical basis
        {
          const roll = ctx.timeline.random();
          const candidate = ctx.clothing.wornItemOfType(['top', 'bottom']);
          if (candidate && roll < 0.04 && !candidate.damage?.torn) { // Approximation debt (clothing condition):
            ctx.clothing.applyDamage(candidate.id, 'torn');
            if (['top', 'bottom', 'dress', 'outerwear'].includes(candidate.type)) {
              ctx.state.set('clothing_visible_damage', true);
            }
          }
        }

        // NT values for prose shading
        const ser = ctx.state.get('serotonin');
        const ne = ctx.state.get('norepinephrine');
        const dopa = ctx.state.get('dopamine');
        const gaba = ctx.state.get('gaba');
        const aden = ctx.state.get('adenosine');

        if (mood === 'fraying') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You work out. The floor, your body, counting. It helps in the specific way that using yourself up helps. The thoughts were still there but they had to wait their turn. Fifteen minutes. Enough.' },
            { weight: 1, value: 'Push-ups, sit-ups, whatever gets the body moving. The ceiling above you. Your breath. The thoughts quieted enough to get through it. You stop when you need to stop.' },
            // Low GABA — the exercise burns some of the edge off
            { weight: ctx.state.lerp01(gaba, 40, 20), value: 'The floor is cold through your socks. You do it anyway. Push-ups until your arms give, then rest, then again. The tight thing in your chest doesn\'t go away but it gets smaller. Something burned off.' },
          ]);
        }

        if (mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You work out. Your body goes through it. The floor, the count, the effort. You stop when you stop. Something is slightly different after. Not feeling — just the numbness is warmer.' },
            { weight: 1, value: 'Exercises on the bedroom floor. You did them. The body cooperated. The ceiling looked the same throughout. You finished.' },
            // Low dopamine — mechanical but it still counts
            { weight: ctx.state.lerp01(dopa, 40, 20), value: 'You go through the motions because the motions are the point. Push-up. Rest. Push-up. The body does what it does. Nothing sparks, but the blood is moving, which is different from not moving.' },
          ]);
        }

        if (mood === 'heavy') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You work out in the bedroom. The floor, your own counting, the walls. It\'s not transcendent. Fifteen minutes. Enough. You get up from the floor slightly more assembled than when you got down.' },
            { weight: 1, value: 'The floor. Push-ups. The familiar burn. You counted and lost count and kept going anyway. You stop when the effort becomes the whole thing. The bedroom looks the same but you feel like you\'ve used yourself.' },
            // Serotonin nudging up — the afterward is the thing
            { weight: ctx.state.lerp01(ser, 40, 60), value: 'You do it. The floor, the effort, the stopping. And after — something about the after. Not fixed, not transformed. Just slightly lighter in a way you can\'t name but you\'re glad for.' },
          ]);
        }

        if (mood === 'flat') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You work out. Push-ups, squats, whatever the apartment allows. The counting helps more than you expected. Fifteen minutes. Enough. The blood is going.' },
            { weight: 1, value: 'Bedroom floor workout. Your socks on the hardwood. The effort is real. You stop when you need to. Something in your chest is less stationary than it was.' },
            // NE kick — a bit more present afterward
            { weight: ctx.state.lerp01(ne, 45, 65), value: 'By the end of it your body is very present to you. The particular burn in your arms, your breath, the floor under your hands. It gets you into the room with yourself. That\'s the thing it does.' },
          ]);
        }

        // clear / present
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You work out in the bedroom. Push-ups, sit-ups, a few things you half-remember from before. Twenty minutes. You stop and the effort is in your muscles and the blood is in your blood and you\'re glad you did it.' },
          { weight: 1, value: 'Bedroom workout. No equipment, just your body and the floor. Sweat on your forehead by the end. The apartment walls watched. You\'re done. It was enough.' },
          // High GABA — the quiet lands
          { weight: ctx.state.lerp01(gaba, 55, 75), value: 'By the last set something had settled. The effort took up all the available space in you and left less room for the other things. You sit on the floor after, catching your breath, and it\'s quiet in a good way.' },
          // High dopamine — the engagement was real
          { weight: ctx.state.lerp01(dopa, 55, 75), value: 'The workout was good. Not just done — good. The rhythm of it, your body responding, the specific satisfaction of stopping because you actually finished. You\'re tired and present and it counts.' },
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
        // Capture pre-eating state before any mutations — needed for recovery prose.
        const preEatHunger = ctx.state.hungerTier();
        const daysSinceLastMealRaw = ctx.events.daysSinceLast('ate');
        const hoursSinceLastMeal = daysSinceLastMealRaw !== null ? daysSinceLastMealRaw * 24 : null;

        ctx.state.set('fridge_food', ctx.state.get('fridge_food') - 1);
        ctx.dishes.use();
        ctx.state.adjustHunger(-35);
        ctx.state.fillStomach(60, 'solid');

        ctx.state.set('consecutive_meals_skipped', 0);
        ctx.state.advanceTime(15);
        ctx.events.record('ate', { what: 'fridge_food' });

        // Dental — chewing spikes the ache
        ctx.state.dentalSpike(20); // Calibrated: center of +10–25 range for pulpitis functional pain (Hargreaves biorxiv)
        // Gastritis — eating eases epigastric pain (food buffers acid)
        ctx.state.gastritisEase(25); // Approximation debt (gastritis): 25 pt relief from a full meal; no kinetic data
        // Food comfort sentiment — small serotonin nudge + habituation
        const fc = ctx.state.sentimentIntensity('eating', 'comfort');
        if (fc > 0) {
          ctx.state.adjustNT('serotonin', fc * 3);
          ctx.state.adjustSentiment('eating', 'comfort', -0.003);
        }

        // Clothing stain roll — 1 RNG call, balanced on all branches
        // Approximation debt (clothing condition): 2% stain probability per meal; no empirical basis
        {
          const roll = ctx.timeline.random();
          const candidate = ctx.clothing.wornItemOfType(['top', 'bottom']);
          if (candidate && roll < 0.02 && !candidate.damage?.stained) { // Approximation debt (clothing condition):
            ctx.clothing.applyDamage(candidate.id, 'stained');
            if (['top', 'bottom', 'dress', 'outerwear'].includes(candidate.type)) {
              ctx.state.set('clothing_visible_damage', true);
            }
          }
        }

        const hunger = ctx.state.hungerTier();
        const mood = ctx.state.moodTone();
        const ser = ctx.state.get('serotonin');
        const aden = ctx.state.get('adenosine');
        const dopa = ctx.state.get('dopamine');
        const fridgeNow = ctx.state.fridgeTier(); // checked AFTER decrement
        const dentalAche = ctx.state.get('dental_ache');
        const dentalW = ctx.state.lerp01(dentalAche, 20, 65); // 0 at dull, 1 at flare
        const gastritisT = ctx.state.gastritisTier();
        const gastritisW = ctx.state.lerp01(ctx.state.get('gastritis_pain'), 30, 70); // 0 at baseline, 1 at burn

        // Gastritis — significant burn before eating; food brings notable relief
        if (gastritisT === 'burn') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You eat. The thing below your ribs quiets. Not all at once — gradually, as the food goes in, the gnawing backs off. You stand there a moment after, just noticing the absence of it.' },
            { weight: 1, value: 'Before eating, that tight ache. After: it recedes. You put the fork down and the quiet where the pain was feels almost good.' },
            { weight: ctx.state.lerp01(ser, 50, 20), value: 'The burning had been there since you woke up. The food helps. That\'s the whole story. You\'re relieved in a way that feels disproportionate until you remember how long the ache had been going.' },
          ]);
        }

        // Dental flare — the tooth competes with eating
        if (dentalAche >= 60) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You eat carefully, keeping to one side. It still hurts. The food is fine but the tooth has opinions about all of it.' },
            { weight: 1, value: 'You eat. Slowly, on one side, watching yourself. It helps a little. The tooth registers the effort regardless.' },
            { weight: ctx.state.lerp01(ser, 50, 20), value: 'You eat carefully and the tooth makes its presence known anyway. At some point you\'re going to have to deal with it. You know that. You know that.' },
          ]);
        }

        // Recovery prose — eating after extended starvation (8+ hours at starving tier).
        // The body's adaptation means relief doesn't arrive cleanly. Sometimes nausea first.
        // Sometimes just flatness. The warmth comes later, if at all.
        const isLongFast = preEatHunger === 'starving' && (hoursSinceLastMeal === null || hoursSinceLastMeal >= 8);
        if (isLongFast) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You eat. Your stomach doesn\'t know what to do with it at first. There\'s a moment of almost-nausea. Then it settles. The relief comes, but slowly, like the body had to remember how.' },
            { weight: 1, value: 'You eat. It doesn\'t feel like relief right away. Your stomach tightens. You keep going. The food goes in and your body processes it somewhere behind where you can feel.' },
            { weight: 1, value: 'You eat carefully, slowly, though you want to eat fast. Your stomach is clenched around the food, not sure what to do with it. You wait. It starts to work eventually.' },
            // Low serotonin — the relief that doesn\'t come
            { weight: ctx.state.lerp01(ser, 45, 20), value: 'You eat. You expected something — relief, warmth, the body saying thank you. It doesn\'t come. The food goes in and there\'s just more of you, that\'s all. That\'s what eating is right now.' },
            // Low dopamine — the reward system too flat to register
            { weight: ctx.state.lerp01(dopa, 40, 18), value: 'You eat. Your body accepts it and doesn\'t make a production of it. The hunger was there, and now it\'s less there, and that\'s the whole transaction.' },
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
          // Gastritis ache — the specific relief of a gnawing stomach getting something
          { weight: gastritisW, value: 'You eat. The thing below your ribs settles a little. You hadn\'t realized how much of your attention it had been taking.' },
          { weight: gastritisW * 0.8, value: 'Something in your stomach loosens when the food hits. There\'s relief in eating that has nothing to do with hunger.' },
        ]);
      },
    },

    eat_from_pantry: {
      id: 'eat_from_pantry',
      label: 'Find something in the cupboard',
      location: 'apartment_kitchen',
      available: () => ctx.state.fridgeTier() === 'empty' && ctx.state.pantryTier() !== 'empty',
      execute: () => {
        // Capture pre-eating state before any mutations — needed for recovery prose.
        const preEatHunger = ctx.state.hungerTier();
        const daysSinceLastMealRaw = ctx.events.daysSinceLast('ate');
        const hoursSinceLastMeal = daysSinceLastMealRaw !== null ? daysSinceLastMealRaw * 24 : null;

        ctx.state.set('pantry_food', ctx.state.get('pantry_food') - 1);
        ctx.dishes.use();
        ctx.state.adjustHunger(-20);
        ctx.state.fillStomach(35, 'solid');

        ctx.state.set('consecutive_meals_skipped', 0);
        ctx.state.advanceTime(10);
        ctx.events.record('ate', { what: 'pantry_food' });

        // Dental — chewing spikes the ache
        ctx.state.dentalSpike(20); // Calibrated: center of +10–25 range for pulpitis functional pain (Hargreaves biorxiv)
        // Gastritis — eating eases epigastric pain (smaller portion than fridge meal)
        ctx.state.gastritisEase(15); // Approximation debt (gastritis): 15 pt relief from a smaller pantry meal

        // Clothing stain roll — 1 RNG call, balanced on all branches
        // Approximation debt (clothing condition): 2% stain probability per meal; no empirical basis
        {
          const roll = ctx.timeline.random();
          const candidate = ctx.clothing.wornItemOfType(['top', 'bottom']);
          if (candidate && roll < 0.02 && !candidate.damage?.stained) { // Approximation debt (clothing condition):
            ctx.clothing.applyDamage(candidate.id, 'stained');
            if (['top', 'bottom', 'dress', 'outerwear'].includes(candidate.type)) {
              ctx.state.set('clothing_visible_damage', true);
            }
          }
        }

        const mood = ctx.state.moodTone();
        const hunger = ctx.state.hungerTier();
        const pantryNow = ctx.state.pantryTier();
        const ser = ctx.state.get('serotonin');
        const aden = ctx.state.get('adenosine');
        const dentalW = ctx.state.lerp01(ctx.state.get('dental_ache'), 20, 65);
        const gastritisW = ctx.state.lerp01(ctx.state.get('gastritis_pain'), 30, 70);

        const lastLine = pantryNow === 'empty'
          ? ' That\'s the last of it.'
          : '';

        // Recovery prose — eating after extended starvation (8+ hours at starving tier).
        // Pantry food is less than a real meal; the body's response is correspondingly muted.
        const isLongFast = preEatHunger === 'starving' && (hoursSinceLastMeal === null || hoursSinceLastMeal >= 8);
        if (isLongFast) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: `You find something and eat it. Your stomach contracts around it. There\'s a moment where you\'re not sure it\'s going to stay down. It does. The hunger doesn\'t go away — it just changes shape.${lastLine}` },
            { weight: 1, value: `Whatever\'s in the cupboard. You eat it slowly because your body isn\'t ready for fast. The food goes in and something settles, a little. Not relief exactly. Just — less.${lastLine}` },
            { weight: ctx.state.lerp01(ser, 45, 20), value: `You eat. Your body takes it in and does what bodies do. You expected something to shift. Nothing shifts. The hunger was there and now there\'s less of it and that\'s all that\'s happened.${lastLine}` },
          ]);
        }

        if (hunger === 'starving' || hunger === 'very_hungry') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: `You find something at the back of the cupboard and eat it fast. It's not much.${lastLine}` },
            { weight: ctx.state.lerp01(ser, 50, 20), value: `Ramen, or crackers, or whatever was back there. You eat it standing up. Your body stops making its case, a little.${lastLine}` },
            { weight: dentalW, value: `You find something and eat it carefully. The tooth makes it harder. The hunger doesn't care.${lastLine}` },
            { weight: gastritisW, value: `Whatever's in the cupboard — you need it. The ache below your ribs has been going since you woke up. Even this helps.${lastLine}` },
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
          // Gastritis — pantry food still brings that specific relief
          { weight: gastritisW * 0.8, value: `Crackers, or whatever. Something. The gnawing behind your sternum backs off as soon as the food hits.${lastLine}` },
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
        ctx.state.dentalSpike(25); // Calibrated: within +20–33 range for pulpitis thermal trigger (PMC3819160, Allison 2020)

        const mood = ctx.state.moodTone();
        const aden = ctx.state.get('adenosine');
        const caffeine = ctx.state.caffeineTier();
        const withdrawal = ctx.state.withdrawalTier();
        const dentalAche = ctx.state.get('dental_ache');
        const dentalW = ctx.state.lerp01(dentalAche, 25, 70);

        let text;

        // Dental flare from hot coffee
        if (dentalAche >= 60) {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'The coffee is too hot for the tooth. You knew it would be. You hold it to the other side anyway. This is your life now.' },
            { weight: 1, value: 'First sip hits the tooth and the tooth objects loudly. You breathe through it. Drink on the left side. Or the right side. Whichever one isn\'t the problem.' },
            { weight: ctx.state.lerp01(ctx.state.get('serotonin'), 50, 20), value: 'You make coffee and the coffee does what it always does to the tooth. You drink it anyway. It\'s not like there\'s a better option.' },
          ]);
        } else if (caffeine === 'active') {
          // Second cup — already caffeinated
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'The second one. The first one wore off faster than it should have.' },
            { weight: ctx.state.lerp01(aden, 40, 80), value: 'You weren\'t done needing it yet. The second cup goes down the same way as the first.' },
          ]);
        } else if (withdrawal === 'moderate' || withdrawal === 'severe') {
          // Withdrawal relief — the headache was building
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You make coffee. The headache has been sitting behind your eyes all morning. You wait for it to start clearing. It takes a few minutes. Then it does.' },
            { weight: 1, value: 'The coffee is ready. You drink it standing at the counter. The pressure behind your eyes starts to ease — you hadn\'t realized how much it was there until it wasn\'t.' },
            { weight: withdrawal === 'severe' ? 2 : 1, value: 'You needed this an hour ago. The headache has been building since you woke up — not loud enough to stop you, just loud enough to make everything harder. First sip. Second. Something shifts.' },
          ]);
        } else if (mood === 'numb' || mood === 'hollow') {
          // First cup of the day
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You make coffee. Something to do with your hands. The smell is better than it usually is.' },
            { weight: ctx.state.lerp01(aden, 40, 80), value: 'Coffee. Your brain needs something to hold onto. The warmth helps, a little.' },
          ]);
        } else if (mood === 'heavy' || mood === 'fraying') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'Coffee. You need the ritual as much as the caffeine. The kettle, the wait, the first sip.' },
            { weight: ctx.state.lerp01(aden, 50, 85) * ctx.state.adenosineBlock(), value: 'You\'re dragging. The coffee is supposed to help with that.' },
            // Dental ache from hot coffee
            { weight: dentalW, value: 'You make coffee and drink it carefully on one side. The tooth is already watching. The caffeine is worth the negotiation.' },
          ]);
        } else {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You make coffee. The machine goes through its routine. You go through yours.' },
            { weight: ctx.state.lerp01(aden, 30, 70) * ctx.state.adenosineBlock(), value: 'You make coffee. It\'s early enough that it feels necessary.' },
            { weight: ctx.state.lerp01(ctx.state.get('serotonin'), 50, 80), value: 'Coffee. The smell fills the kitchen before it\'s even done.' },
            // Dental — hot coffee wakes the tooth up
            { weight: dentalW * 0.8, value: 'You make coffee. The first sip touches the tooth. You wait a moment, then continue. It\'s just a thing that happens now.' },
          ]);
        }

        // Background sensory prose — brief pause at the counter while it brews
        const mid = ctx.senses.midSense('waiting');
        if (mid) text += '\n\n' + mid;
        return text;
      },
    },

    drink_alcohol: {
      id: 'drink_alcohol',
      label: 'Have a drink',
      location: 'apartment_kitchen',
      // One standard drink per invocation. Player can invoke repeatedly.
      // Analogous to smoke_cigarette (1 cigarette per call).
      available: () => ctx.state.get('has_alcohol') > 0 && ctx.state.alcoholTier() !== 'high',
      execute: () => {
        ctx.state.set('has_alcohol', ctx.state.get('has_alcohol') - 1);
        ctx.state.consumeAlcohol(1);
        ctx.state.advanceTime(ctx.timeline.randomInt(5, 12));

        // Evening or night — likely a bedtime drink. Set sleep flag.
        const tod = ctx.state.timeOfDay();
        if (tod >= 18 * 60 || tod < 4 * 60) {
          ctx.state.set('alcohol_sleep_flag', true);
        }

        const alc = ctx.state.alcoholTier();
        const mood = ctx.state.moodTone();
        const gaba = ctx.state.get('gaba');
        const wd = ctx.state.alcoholWithdrawalTier();
        const stress = ctx.state.stressTier();

        // Withdrawal relief — drinking to stop feeling bad, not to feel good.
        // The specific texture: the relief of the deficit filling, not pleasure.
        if (wd === 'moderate' || wd === 'severe') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You drink. Not because you wanted to. The trembling in your hands settles. That\'s all.' },
            { weight: wd === 'severe' ? 2 : 1, value: 'The first sip and something stops. Not pleasure — just the absence of what was happening. Your hands are steadier. You don\'t think about that.' },
          ]);
        }

        // Low dose: the push — warmth, loosening, chest unclenching
        if (alc === 'low') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You pour one. The first swallow and something in the chest unclenches. Not much. Enough.' },
            { weight: 1, value: 'One drink. The evening gets a little softer around the edges.' },
            { weight: ctx.state.lerp01(gaba, 20, 50), value: 'Something in the chest eases. Everything had a pleasant distance. You hadn\'t realized how tight you\'d been holding it.' },
            { weight: ['strained', 'overwhelmed'].includes(stress) ? 1.5 : 0.3, value: 'You pour a drink. The day starts to feel like it happened to someone else, slightly. That\'s fine.' },
          ]);
        }

        // Medium dose: plateau, processing slower, blunted
        if (alc === 'medium') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Processing is slower now. The drink sits in your chest and that\'s where it stays.' },
            { weight: 1, value: 'Another one. Things are reaching you through something thick.' },
            { weight: mood === 'numb' || mood === 'hollow' ? 1.5 : 0.3, value: 'The flatness has a different texture now. Less sharp. You\'re not sure if that\'s better.' },
          ]);
        }

        // High: dissociation, things not quite landing
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Things aren\'t quite landing. The room is here and you\'re in it but there\'s a gap you can\'t measure.' },
          { weight: 1, value: 'You\'re past the point where it\'s doing anything good. That hasn\'t made you stop.' },
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
        ctx.events.record('apartment_cleaned');  // resets mess-notice dedup
        ctx.state.adjustEnergy(-8);
        ctx.state.adjustStress(-5);
        ctx.state.advanceTime(15);

        const mood = ctx.state.moodTone();
        const sinkClear = ctx.dishes.dirtyCount() === 0;
        const aden = ctx.state.get('adenosine');

        let text;
        if (sinkClear) {
          // Sink is now empty
          if (mood === 'heavy' || mood === 'numb') {
            text = 'You wash dishes. The warm water helps more than it should. When you dry your hands, the sink is empty. The counter has its surface back. One thing, at least, dealt with.';
          } else {
            text = 'Warm water, soap, the rhythm of it. When you\'re done the sink is empty, the counter clear. The kitchen looks like someone lives here on purpose.';
          }
        } else if (mood === 'heavy' || mood === 'numb') {
          text = 'You wash dishes. The warm water is the closest thing to comfort available right now. One thing, at least, is done.';
        } else if (aden > 65 && ctx.state.adenosineBlock() > 0.4) {
          text = 'Your hands know what to do without you deciding anything. Hot water, soap, the stack going down. When it\'s over you\'re not sure how long it took.';
        } else {
          text = 'You wash the dishes. Warm water, soap, the repetition of it. The kitchen looks a little more like someone lives here on purpose.';
        }

        // Background sensory prose — hands busy, attention diffuse
        const mid = ctx.senses.midSense('doing');
        if (mid) text += '\n\n' + mid;
        return text;
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

        let text;
        if (mood === 'numb') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit at the table. The surface is cool under your hands. You sit there. That\'s it.' },
            { weight: 1, value: 'The kitchen table. You\'re at it. The fridge hums. Minutes pass. You don\'t move.' },
            { weight: 1, value: 'Sitting. The table, the chair, the quiet kitchen. You\'re here. That\'s the whole event.' },
            // Low dopamine — nothing to reach for
            { weight: ctx.state.lerp01(dopa, 40, 15), value: 'You sit at the table. Your hands are on the surface. You could get up. You could do something. The thought arrives and lies there, flat, like everything else.' },
          ]);
        } else if (mood === 'heavy') {
          ctx.state.adjustEnergy(1);
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit. The chair takes your weight. Not standing is something. Not much, but something.' },
            { weight: 1, value: 'The kitchen table. You put your arms on it and lean forward. The not-standing helps. Your body is grateful for small mercies.' },
            { weight: 1, value: 'You sit down. The effort of being upright transfers to the chair. Your back says thank you in its own way.' },
            // Low serotonin — sitting doesn't ease the weight
            { weight: ctx.state.lerp01(ser, 35, 15), value: 'You sit. The chair holds you. You put your head on the table and the cool surface is the only good thing. You stay like that for a while, folded over, not resting.' },
          ]);
        } else if (mood === 'fraying') {
          ctx.state.adjustStress(-1);
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit at the table. The kitchen is quieter than the rest of your head. Barely, but it\'s something.' },
            { weight: 1, value: 'The table. Your hands on it. The solidity of a flat surface. The fridge hum. For a minute the noise inside dims, slightly.' },
            { weight: 1, value: 'You sit. The kitchen has a specific quiet — the fridge, the clock, the tap. It\'s not peaceful. But it\'s not loud.' },
            // Low GABA — can't settle even sitting
            { weight: ctx.state.lerp01(gaba, 40, 20), value: 'You sit but your leg bounces. Your fingers drum the table. The kitchen is quiet and the quiet makes room for the thing that won\'t stop running in your chest.' },
            // Quiet irritation — the silence is wrong
            { weight: qi > 0 ? qi * 0.8 : 0, value: 'You sit at the table and the quiet presses in. The fridge hum. The clock. The specific silence of a room with nobody in it. Your skin prickles. You need noise, or movement, or something.' },
          ]);
        } else if (mood === 'hollow') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit at the kitchen table. The chair. The surface. The quiet. You\'re sitting because you walked in here and this is what\'s here.' },
            { weight: 1, value: 'The table. You sit at it. Not eating, not doing anything. Just occupying a chair in a room where chairs exist.' },
            { weight: 1, value: 'You sit. The kitchen is empty in the way it always is. You\'re in it. The clock ticks, or doesn\'t. Hard to tell.' },
            // High adenosine — the sitting is heavy
            { weight: ctx.state.lerp01(aden, 50, 75) * ctx.state.adenosineBlock(), value: 'You sit down and your body thanks you by getting heavier. The table is a surface to put your arms on. Your eyelids are interested in closing. The kitchen hums around you, distant.' },
          ]);
        } else if (mood === 'clear' || mood === 'present') {
          ctx.state.adjustStress(-2);
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit at the table. The kitchen is quiet. Your hands are warm. Something close to comfort — the kind you don\'t notice until you\'re in it.' },
            { weight: 1, value: 'The kitchen table. The light from the window. You sit and it\'s fine — actually fine, not the word you say when nothing is. Just sitting, in a room, and it\'s okay.' },
            { weight: 1, value: 'You sit. The apartment is still. The fridge hums its one note. For a few minutes, that\'s all there is, and that\'s enough.' },
            // Higher serotonin — warmth settles in
            { weight: ctx.state.lerp01(ser, 55, 75), value: 'You sit at the table and the kitchen holds you. The light, the quiet, the smell of the place you live. Your hands are warm. Your chest is easy. You stay because staying feels like the right thing.' },
            // Quiet comfort — the silence is the point
            { weight: qc > 0 ? qc : 0, value: 'You sit at the table and the quiet is perfect. Not empty — full of small things. The fridge, the light, the particular stillness of a room you\'re alone in. Something in you expands into the silence. You needed this.' },
          ]);
        } else {
          // flat / quiet
          ctx.state.adjustStress(-1);
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You sit at the table for a while. Not doing anything. The kitchen is the kitchen. Time passes.' },
            { weight: 1, value: 'The table. You sit at it. The microwave clock changes. That\'s the most interesting thing that happens.' },
            { weight: 1, value: 'You sit. It\'s not productive, it\'s not restful, it\'s just sitting in a kitchen. Sometimes that\'s what there is.' },
            // High NE — aware of every small sound
            { weight: ctx.state.lerp01(ne, 45, 65), value: 'You sit at the table. The fridge cycles on. A pipe ticks somewhere in the wall. Your body is still but your ears are busy — cataloguing the kitchen\'s small noises like they matter.' },
            // Quiet irritation — the stillness is wrong
            { weight: qi > 0 ? qi * 0.5 : 0, value: 'You sit at the table. The quiet is too much. You tap your fingers, shift in the chair. The kitchen hums its one note and you wish it would hum a different one.' },
          ]);
        }

        // Background sensory prose — still, attention diffuse, the kitchen settles around you
        const mid = ctx.senses.midSense('waiting');
        if (mid) text += '\n\n' + mid;
        return text;
      },
    },

    // === HOME QUIET (multi-location) ===
    breathwork_unguided: {
      id: 'breathwork_unguided',
      label: 'Breathe',
      location: null, // available anywhere at home; availability gate below
      available: () => {
        if (ctx.state.get('viewing_phone')) return false;
        const area = ctx.world.getCurrentLocation()?.area;
        return area === 'apartment';
      },
      execute: () => {
        const ne = ctx.state.get('norepinephrine');
        const gaba = ctx.state.get('gaba');
        const aden = ctx.state.get('adenosine');
        const energy = ctx.state.energyTier();

        const minutes = ctx.timeline.randomInt(5, 10);
        ctx.state.advanceTime(minutes);

        // State-dependent NT effects — targets shift, levels follow over the drift period
        // High NE + low GABA: resistance at the start means slower settling; model as reduced effect
        const resistant = ne > 70 || gaba < 30;
        // Depleted energy/high adenosine: practice slides toward float rather than focus; effect halved
        const drifting = ['depleted', 'exhausted'].includes(energy) || (aden > 70 && ctx.state.adenosineBlock() > 0.4);

        let effectMult = 1.0;
        if (resistant) effectMult *= 0.7; // Approximation debt (mindfulness): 0.7 reduction at high NE / low GABA; direction from Jha 2010 PMID 20163425 but magnitude chosen
        if (drifting) effectMult *= 0.5;  // Approximation debt (mindfulness): 0.5 reduction at depleted state; no direct citation

        // Mindfulness GABA: prefrontal-mediated GABA upregulation. Refs: Streeter 2010 PMID 20834562 (+27% GABA
        // yoga vs. walking); Hölzel 2011 PMID 21071182 (mechanism: increased PFC→amygdala inhibitory tone).
        // Single session effect is a fraction of repeated-practice gains; +6–10 as instantaneous target nudge.
        // Approximation debt (mindfulness): +8 base GABA target nudge chosen
        ctx.state.adjustNT('gaba', 8 * effectMult);

        // Mindfulness cortisol: HPA axis downregulation via PFC inhibition of amygdala→CRH pathway.
        // Ref: Pascoe 2017 PMID 28863392 (meta-analysis: significant cortisol reduction in acute sessions).
        // Single session: −8–12 as instantaneous target nudge.
        // Approximation debt (mindfulness): −10 base cortisol target nudge chosen
        ctx.state.adjustNT('cortisol', -10 * effectMult);

        // Mindfulness NE: reduced LC tonic firing via prefrontal top-down regulation.
        // Ref: Tang 2015 PMID 26242681 (brief mindfulness training reduces urinary NE metabolites).
        // Approximation debt (mindfulness): −5 base NE nudge chosen; single-session vs. training effect conflated
        ctx.state.adjustNT('norepinephrine', -5 * effectMult);

        // Serotonin: modest upregulation via raphe activation during parasympathetic dominance.
        // Ref: Jacobs 2004 PMID 14699316 (5-HT firing linked to tonic motor/respiratory regulation).
        // Approximation debt (mindfulness): +3 base serotonin nudge chosen; effect is speculative at single-session timescale
        ctx.state.adjustNT('serotonin', 3 * effectMult);

        // Stress — genuine but modest; effect depends on ability to settle
        if (!resistant) {
          ctx.state.adjustStress(-2);
        }

        // Prose — 1 RNG call, always. State-conditional weighting per three-layer pattern.
        const ser = ctx.state.get('serotonin');
        const cort = ctx.state.get('cortisol');
        return ctx.timeline.weightedPick([
          // Baseline — moderate state, something shifts
          { weight: 1, value: 'You sit with it. The breath as anchor — in, out, again. Somewhere around the third or fourth cycle something in your chest unclenches, slightly. Not fixed. Just a degree less held.' },
          { weight: 1, value: 'Eyes closed. Breath. The thoughts are still there but they stop having opinions for a minute. Your shoulders drop without you asking them to.' },
          { weight: 1, value: 'You breathe deliberately. The chest rises, falls. Somewhere around the sternum, something loosens. It doesn\'t last. But it\'s real while it\'s happening.' },
          // High NE / low GABA — resistance first
          { weight: ctx.state.lerp01(ne, 60, 80), value: 'The usual pull toward the next thing. You breathe anyway. It takes longer to get anywhere. The thoughts have opinions. You keep coming back.' },
          { weight: ctx.state.lerp01(gaba, 38, 20), value: 'You try to sit with it. The thing underneath doesn\'t settle — it shifts, finds another shape. The breath still happens. That counts for something.' },
          { weight: (ne > 70 && gaba < 30) ? 1.5 : 0, value: 'You breathe. The surface doesn\'t cooperate — too much going on underneath, running without your permission. You keep returning to the breath anyway. It\'s not calm. It\'s practice.' },
          // Depleted / adenosine drift — floating
          { weight: ctx.state.lerp01(aden, 55, 80) * ctx.state.adenosineBlock(), value: 'You mostly just float. The breath happens on its own. Something softens at the edges. That\'s something.' },
          { weight: drifting ? 1 : 0, value: 'The breathing slows down. So does everything else. You\'re not meditating, not quite — more like hovering at the surface of sleep. The quiet is real even if the practice isn\'t.' },
          // Clear / moderate — genuine settling
          { weight: ctx.state.lerp01(ser, 50, 70), value: 'A few minutes of just the breath. The ceiling, your hands, the particular quiet of the apartment. It\'s enough for right now. You\'re glad you did it.' },
          // High cortisol — body tension noticeable and easing
          { weight: ctx.state.lerp01(cort, 60, 85), value: 'Your jaw was clenched. You didn\'t notice until it wasn\'t. Your shoulders too, somewhere around the second minute. The breath works on things you didn\'t know were held.' },
        ]);
      },
    },

    yoga_home: {
      id: 'yoga_home',
      label: 'Do some yoga',
      location: null, // available anywhere at home; availability gate below
      available: () => {
        if (ctx.state.get('viewing_phone')) return false;
        const area = ctx.world.getCurrentLocation()?.area;
        if (area !== 'apartment') return false;
        return ctx.state.energyTier() !== 'depleted';
      },
      execute: () => {
        const ne = ctx.state.get('norepinephrine');
        const gaba = ctx.state.get('gaba');
        const aden = ctx.state.get('adenosine');
        const energy = ctx.state.energyTier();

        const minutes = ctx.timeline.randomInt(20, 30); // Approximation debt (yoga): 20–30 min; real sessions 20–60
        ctx.state.advanceTime(minutes);
        ctx.state.adjustEnergy(-6); // Approximation debt (yoga): −6 energy; mild exertion, ~half of home_workout

        // Parasympathetic activation — distinct from breathwork (movement + breath) and running (sympathetic spike)
        // Streeter 2010 (PMID 20834562): yoga increased GABA +27% vs. walking in a single session
        // Approximation debt (yoga): GABA +8 chosen as single-session instantaneous nudge; full +27% is cumulative
        const resistant = ne > 70 || gaba < 30;
        // Depleted/high-adenosine: floor practice still happens but settling takes longer; effect halved
        const drifting = energy === 'exhausted' || (aden > 70 && ctx.state.adenosineBlock() > 0.4);

        let effectMult = 1.0;
        if (resistant) effectMult *= 0.7; // Approximation debt (yoga): 0.7 at high NE / low GABA — harder to settle into poses; direction from parasympathetic activation literature
        if (drifting) effectMult *= 0.5;  // Approximation debt (yoga): 0.5 when depleted/adenosine-heavy; practice happens but gravity wins

        // Parasympathetic GABA: vagal tone increase during slow movement + breath; Streeter 2010 PMID 20834562
        ctx.state.adjustNT('gaba', 8 * effectMult); // Approximation debt (yoga):

        // HPA axis downregulation via slow rhythmic movement; Pascoe 2017 PMID 28863392 covers yoga specifically
        ctx.state.adjustNT('cortisol', -10 * effectMult); // Approximation debt (yoga):

        // NE reduction — parasympathetic shift, opposite of running's sympathoadrenal spike
        // Approximation debt (yoga): −6 NE; yoga is not high-intensity, no sympathetic activation expected
        ctx.state.adjustNT('norepinephrine', -6 * effectMult); // Approximation debt (yoga):

        // Serotonin: modest upregulation via postural + respiratory regulation, same mechanism as breathwork
        // Jacobs 2004 PMID 14699316; effect slightly larger than breathwork due to sustained movement
        ctx.state.adjustNT('serotonin', 5 * effectMult); // Approximation debt (yoga):

        // No adenosine accumulation — yoga is not high-intensity aerobic exercise
        // (contrast: go_for_run +8, home_workout +5; yoga exertion below threshold for significant ATP→adenosine conversion)

        // Hunger — mild metabolic demand
        ctx.state.adjustHunger(4); // Approximation debt (yoga): +4 hunger; mild, much less than home_workout's +9

        // Prose — 1 RNG call, always. State-conditional weighting per three-layer pattern.
        const ser = ctx.state.get('serotonin');
        const cort = ctx.state.get('cortisol');
        return ctx.timeline.weightedPick([
          // Baseline — something loosens. Not transcendence.
          { weight: 1, value: 'The floor against your palms. Your weight distributed into it, specific — heel, hip, wrist. Pose to pose. Nothing resolved. Something in the chest just a degree less clenched by the end.' },
          { weight: 1, value: 'You move through it. The body folding and unfolding. Some places resist; you stay there anyway, breathing into the resistance. It\'s not spiritual. It\'s just the floor and your weight and the breath finding its way around the tight spots.' },
          { weight: 1, value: 'Twenty minutes on the floor. Your body doing things it can do, remembering what those are. You finish and stay there a moment, on your back, ceiling above you. Less tight than before. That\'s enough.' },
          // High NE / low GABA — poses just ahead of the thoughts
          { weight: ctx.state.lerp01(ne, 60, 80), value: 'The poses come before your thoughts can catch up and ruin them. You move before you think. There\'s a rhythm to getting into position that doesn\'t leave room for the other stuff. You lose a little of it by the end. You hold the rest.' },
          { weight: ctx.state.lerp01(gaba, 38, 20), value: 'You try the floor. The restlessness doesn\'t stop — it just changes what it\'s doing while your body goes through the shapes. The breath slows it, slightly. By the end it\'s running at a different frequency. Manageable.' },
          // Depleted / high adenosine — gravity-heavy, still worth it
          { weight: drifting ? 1 : 0, value: 'Everything is slow and heavy. You stay low — floor poses, nothing that requires you to be vertical for long. The weight of your limbs is something you work around. By the end you\'re still tired but the tired is different. Less stuck.' },
          { weight: ctx.state.lerp01(aden, 55, 80) * ctx.state.adenosineBlock(), value: 'The floor comes up to meet you. You move through what you can. Your arms shake in places they shouldn\'t. The tiredness is very present, weight-wise. You stay with it. Something in the joints loosens anyway.' },
          // Clear / moderate — the settling is real
          { weight: ctx.state.lerp01(ser, 50, 70), value: 'The practice finds its rhythm partway through. The body remembers how to do this — one thing at a time, breath by breath. By the end the floor is warm under your palms and the apartment is quiet in a way it wasn\'t before.' },
          // High cortisol — body tension visible and easing
          { weight: ctx.state.lerp01(cort, 60, 85), value: 'Your shoulders were up near your ears. You noticed halfway through, tried to put them down. Kept having to notice. By the last few poses they stayed. The work the body was doing without permission had somewhere to go.' },
        ]);
      },
    },

    // === BATHROOM ===
    quick_shower: {
      id: 'quick_shower',
      label: 'Quick rinse',
      location: 'apartment_bathroom',
      available: () => true,
      execute: () => {
        ctx.state.set('hygiene_level', 95);
        ctx.state.adjustSkinCondition(-1);
        ctx.linens.useTowel();
        ctx.state.adjustEnergy(-1);
        ctx.state.adjustStress(-4);
        ctx.state.adjustNT('gaba', 1);
        ctx.state.adjustNT('cortisol', -2);
        ctx.state.adjustNT('norepinephrine', -1);
        ctx.state.advanceTime(6);
        ctx.events.record('showered');

        const mood = ctx.state.moodTone();
        const aden = ctx.state.get('adenosine');

        const unread = ctx.state.hasUnreadMessages();
        const g1 = ctx.state.sentimentIntensity('friend1', 'guilt');
        const g2 = ctx.state.sentimentIntensity('friend2', 'guilt');
        const guilt = Math.max(g1, g2);

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'In and out. The water is warm. You\'re cleaner than you were.' },
          { weight: 1, value: 'Quick. Rinse, lather, rinse. The steam barely builds before you\'re done.' },
          { weight: 1, value: 'A rinse. It counts.' },
          // Numb/heavy — even this is an effort
          { weight: (mood === 'numb' || mood === 'heavy') ? 0.6 : 0, value: 'You stand under the water just long enough to call it a shower. That\'s enough. It has to be.' },
          // High adenosine — the warm water is a kindness but can\'t touch the fog
          { weight: ctx.state.lerp01(aden, 50, 75), value: 'The warm water helps for exactly as long as you\'re under it. You step out and the tired is still there, waiting.' },
          // Phone waiting — even a quick shower is a forced gap
          { weight: unread ? 1 : 0, value: 'Six minutes. Whatever\'s on your phone is still there when you step out.' },
          { weight: (unread && guilt > 0.08) ? 1 : 0, value: 'You\'re already thinking about the phone before the water\'s off.' },
        ]);
      },
    },

    shower: {
      id: 'shower',
      label: 'Take a shower',
      location: 'apartment_bathroom',
      available: () => ctx.state.energyTier() !== 'depleted',
      execute: () => {
        // Deterministic extension: high NE + low GABA + rumination = can't stop
        // Approximation debt (shower): coefficients (0.5, 0.3, 0.2) and thresholds (NE=55, GABA=35) chosen.
        const ne = ctx.state.get('norepinephrine');
        const gaba = ctx.state.get('gaba');
        const rumination = ctx.character.get().rumination ?? 50;
        const neMod   = Math.max(0, Math.min(1, (ne - 55) / 45));
        const gabaMod = Math.max(0, Math.min(1, (35 - gaba) / 35));
        const rumMod  = rumination / 100;
        const extensionFactor = neMod * 0.5 + gabaMod * 0.3 + rumMod * 0.2;
        const extension = Math.round(extensionFactor * 10); // 0–10 min extra
        const minutes = 15 + extension;

        ctx.state.set('hygiene_level', 95);
        ctx.state.adjustSkinCondition(-5);
        ctx.linens.useTowel();
        ctx.state.adjustEnergy(-3);
        ctx.state.adjustStress(-8);
        ctx.state.adjustNT('gaba', 3);
        ctx.state.adjustNT('cortisol', -5);
        ctx.state.adjustNT('norepinephrine', -2);
        ctx.state.advanceTime(minutes);
        ctx.events.record('showered');

        // Warmth comfort sentiment — extra stress relief + habituation
        const wc = ctx.state.sentimentIntensity('warmth', 'comfort');
        if (wc > 0) {
          ctx.state.adjustStress(-wc * 3);
          ctx.state.adjustSentiment('warmth', 'comfort', -0.002);
        }

        const mood = ctx.state.moodTone();
        const energy = ctx.state.energyTier();

        const unread = ctx.state.hasUnreadMessages();
        const g1 = ctx.state.sentimentIntensity('friend1', 'guilt');
        const g2 = ctx.state.sentimentIntensity('friend2', 'guilt');
        const guilt = Math.max(g1, g2);
        const inNeed = ctx.state.get('phone_inbox').some(m => !m.read && m.subtype === 'in_need');

        let prose;
        if (mood === 'numb' || mood === 'heavy') {
          prose = ctx.timeline.weightedPick([
            { weight: 1, value: 'The water is warm. You stand in it longer than you need to. The world outside the shower curtain can wait.' },
            { weight: 1, value: 'Hot water. You stand under it. The steam fills the small room. For a few minutes, the world is just this.' },
            { weight: wc > 0 ? wc : 0, value: 'The water is hot and you stand in it and the heat is the only good thing. It seeps through the skin to wherever the cold lives.' },
            // Phone waiting — the shower curtain between you and it
            { weight: inNeed ? 1.2 : 0, value: 'The water runs and the phone is in the other room and you know there\'s a message you haven\'t read. The shower is the gap. You let the gap exist.' },
            { weight: (unread && !inNeed) ? 0.8 : 0, value: 'Something is waiting. You stand in the hot water and let it wait.' },
          ]);
        } else if (energy === 'tired' || energy === 'exhausted') {
          prose = ctx.timeline.weightedPick([
            { weight: 1, value: 'Hot water. It doesn\'t fix anything but it makes the surface of things bearable. You get out when it starts going cold.' },
            { weight: 1, value: 'The shower runs hot and you lean into it. Your body is tired enough to just stand there and let the water do something.' },
            { weight: wc > 0 ? wc : 0, value: 'The hot water hits your shoulders and something lets go. Not everything — but the layer closest to the surface. The warmth finds the tired places.' },
            // Phone waiting — too tired to think about it
            { weight: unread ? 0.7 : 0, value: 'You stand there too tired to think about the phone. The water is warm. That\'s the whole thought.' },
          ]);
        } else {
          prose = ctx.timeline.weightedPick([
            { weight: 1, value: 'A shower. Hot water, steam, the sound of it. You feel more like a person when you step out.' },
            { weight: 1, value: 'You shower. The water is hot, the bathroom fills with steam. When you step out, you\'re clean. That\'s something.' },
            { weight: wc > 0 ? wc : 0, value: 'The hot water is an old comfort. You stand in it past the point of clean, just for the heat, just for the sound. When you step out the mirror is fogged and your skin is flushed.' },
            // Phone waiting — the deliberate gap
            { weight: (unread && guilt > 0.08) ? 1 : 0, value: 'Ten minutes where you\'re not going to check it. You know there\'s a message. The shower is the pause before whatever it says.' },
            { weight: (unread && guilt <= 0.08) ? 0.8 : 0, value: 'The shower is the gap between knowing something\'s waiting and seeing what it is. You stay in the gap for the full fifteen minutes.' },
          ]);
        }
        // Compulsive extension — deterministic acknowledgment, no RNG
        if (extension >= 5) {
          prose += ' You were going to be quick. You weren\'t.';
        } else if (extension >= 3) {
          prose += ' Longer than you planned.';
        }
        return prose;
      },
    },

    long_shower: {
      id: 'long_shower',
      label: 'Take your time',
      location: 'apartment_bathroom',
      available: () => ctx.state.energyTier() !== 'depleted',
      execute: () => {
        // Extension scaled up for deliberate long showers
        const ne = ctx.state.get('norepinephrine');
        const gaba = ctx.state.get('gaba');
        const rumination = ctx.character.get().rumination ?? 50;
        const neMod   = Math.max(0, Math.min(1, (ne - 55) / 45));
        const gabaMod = Math.max(0, Math.min(1, (35 - gaba) / 35));
        const rumMod  = rumination / 100;
        const extensionFactor = neMod * 0.5 + gabaMod * 0.3 + rumMod * 0.2;
        const extension = Math.round(extensionFactor * 15); // 0–15 min extra
        const minutes = 25 + extension;

        ctx.state.set('hygiene_level', 95);
        ctx.state.adjustSkinCondition(-8);
        ctx.linens.useTowel();
        ctx.state.adjustEnergy(-5);
        ctx.state.adjustStress(-12);
        ctx.state.adjustNT('gaba', 5);
        ctx.state.adjustNT('cortisol', -8);
        ctx.state.adjustNT('norepinephrine', -3);
        ctx.state.advanceTime(minutes);
        ctx.events.record('showered');

        // Warmth comfort sentiment — stronger effect for long shower + habituation
        const wc = ctx.state.sentimentIntensity('warmth', 'comfort');
        if (wc > 0) {
          ctx.state.adjustStress(-wc * 5);
          ctx.state.adjustSentiment('warmth', 'comfort', -0.003);
        }

        const mood = ctx.state.moodTone();
        const ne2 = ctx.state.get('norepinephrine'); // post-shower

        const unread = ctx.state.hasUnreadMessages();
        const g1 = ctx.state.sentimentIntensity('friend1', 'guilt');
        const g2 = ctx.state.sentimentIntensity('friend2', 'guilt');
        const guilt = Math.max(g1, g2);
        const inNeed = ctx.state.get('phone_inbox').some(m => !m.read && m.subtype === 'in_need');

        let prose;
        if (mood === 'numb' || mood === 'heavy' || mood === 'hollow') {
          prose = ctx.timeline.weightedPick([
            { weight: 1, value: 'The water runs hot until it doesn\'t. You stay the whole time. You come out wrinkled, steamed, a little emptied. The kind of clean that isn\'t just clean.' },
            { weight: 1, value: 'You stand there long after there\'s any reason to. The hot water, the sound, the closed door. The world doesn\'t stop but for a while you don\'t have to be in it.' },
            { weight: wc > 0 ? wc : 0, value: 'The heat is the whole thing. You stand in it past the point of clean, past the point of purpose, until your skin is flushed and your fingers are wrinkled and the bathroom is all steam. When you step out the cold air hits hard.' },
            // Phone waiting — the closed door is the whole point
            { weight: inNeed ? 1.5 : 0, value: 'The water runs and somewhere outside this room there\'s a message you haven\'t opened. You know it\'s there. You stand in the steam and let it be there without you for a while.' },
            { weight: (unread && guilt > 0.1 && !inNeed) ? 1 : 0, value: 'Twenty minutes where the phone is somewhere else and you don\'t have to decide anything about it. You need those twenty minutes.' },
          ]);
        } else if (mood === 'fraying') {
          prose = ctx.timeline.weightedPick([
            { weight: 1, value: 'You needed this. The hot water, the closed door, the way the steam fills the room and softens everything. You stay until you feel less like you\'re about to come apart.' },
            { weight: 1, value: 'The shower is hot and long and you lean into the wall and let it run. It helps. Not everything — but the tight places, the ones that have been holding all day. Those let go a little.' },
            // Phone waiting — the gap is intentional
            { weight: unread ? 1 : 0, value: 'The hot water and the closed door and no phone. Whatever\'s waiting can keep waiting. You need this more than you need to know.' },
          ]);
        } else {
          prose = ctx.timeline.weightedPick([
            { weight: 1, value: 'A long shower. You let the water run hot, stay until the steam is thick, until the muscles in your back give up whatever they were holding. You step out feeling like a person again.' },
            { weight: 1, value: 'You take your time. Hot water, no rush. The kind of shower you usually don\'t allow yourself. When you step out the bathroom is thick with steam and something has shifted.' },
            { weight: wc > 0 ? wc : 0, value: 'The hot water and the closed door and nowhere to be for twenty minutes. You stay in it. You give yourself this.' },
            // Phone waiting — using the shower as deliberate distance
            { weight: (unread && guilt > 0.08) ? 1 : 0, value: 'Twenty-five minutes without checking it. You know something\'s there. The shower is the reason you haven\'t looked yet. You let it be the reason.' },
          ]);
        }
        if (extension >= 8) {
          prose += ' You lost track of time in there.';
        } else if (extension >= 4) {
          prose += ' Longer than intended.';
        }
        return prose;
      },
    },

    cold_shower: {
      id: 'cold_shower',
      label: 'Cold shower',
      location: 'apartment_bathroom',
      available: () => true,
      execute: () => {
        ctx.state.set('hygiene_level', 95);
        ctx.state.adjustSkinCondition(1); // cold water gentler on skin oils
        ctx.linens.useTowel();
        ctx.state.adjustEnergy(5);
        ctx.state.adjustStress(2); // cortisol spike
        ctx.state.adjustNT('norepinephrine', 6);
        ctx.state.adjustNT('cortisol', 3);
        ctx.state.adjustNT('adenosine', -10);
        ctx.state.adjustNT('gaba', -1);
        ctx.state.advanceTime(8);
        ctx.events.record('showered');

        const aden = ctx.state.get('adenosine');
        const gaba = ctx.state.get('gaba');
        const skin = ctx.state.skinConditionTier();

        const unread = ctx.state.hasUnreadMessages();

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Cold. The shock of it hits before you\'re ready. Your breath goes short and then comes back, sharp. When you step out the world is in focus in a way it wasn\'t before.' },
          { weight: 1, value: 'You turn it cold and make yourself stay. Every second is a small act of will. When it\'s over your skin is buzzing and you\'re awake — actually awake.' },
          { weight: 1, value: 'Cold water, fast. Your body protests loudly and then goes quiet. You step out gasping, flushed, something in your chest knocked loose and reset.' },
          // High adenosine — cutting through the fog is the point
          { weight: ctx.state.lerp01(aden, 45, 70), value: 'The cold is the point. It cuts through everything — the fog, the heavy, the half-asleep. Your body stops doing whatever it was doing and starts doing this instead. You step out blinking, sharp at the edges.' },
          // Low GABA — cold is too much right now
          { weight: ctx.state.lerp01(gaba, 40, 20), value: 'The cold hits your nervous system and it doesn\'t settle. Your heart is going too fast and the adrenaline of it is indistinguishable from the thing you were already feeling. You get through it. You step out still buzzing.' },
          // Phone waiting — cold empties the head of it, briefly
          { weight: unread ? 0.9 : 0, value: 'The cold empties your head of whatever was in there — the message, the thing you\'ve been not-checking. For eight minutes: just this. Then you step out and the phone is still there.' },
          // Dry/cracked skin — the cold doesn't make it worse; small comfort
          { weight: ['dry', 'tight', 'cracked'].includes(skin) ? 0.8 : 0, value: 'You turn it cold. Your skin isn\'t happy but the cold water doesn\'t strip it the way the hot does. Small mercy. You step out sharp and awake and your hands don\'t feel worse than before.' },
        ]);
      },
    },

    check_phone_bathroom: {
      id: 'check_phone_bathroom',
      label: 'Check your phone',
      location: 'apartment_bathroom',
      available: () => ctx.state.get('has_phone') && ctx.state.batteryTier() !== 'dead' && !ctx.state.get('viewing_phone'),
      execute: () => {
        ctx.state.set('viewing_phone', true);
        ctx.state.advanceTime(1);
        ctx.events.record('checked_phone');

        // Post-shower: capture the immediate-reach-for-it gesture
        const justShowered = ctx.events.any('showered', ctx.state.get('wake_period_start'));
        if (justShowered) {
          const hasUnread = ctx.state.hasUnreadMessages();
          const cg1 = ctx.state.sentimentIntensity('friend1', 'guilt');
          const cg2 = ctx.state.sentimentIntensity('friend2', 'guilt');
          const cguilt = Math.max(cg1, cg2);
          const inNeed = ctx.state.get('phone_inbox').some(m => !m.read && m.subtype === 'in_need');

          let prefix;
          if (inNeed) {
            prefix = 'You reach for it before you\'ve dried off. ';
          } else if (hasUnread && cguilt > 0.1) {
            prefix = 'You check before you\'ve put the towel down. ';
          } else if (hasUnread) {
            prefix = 'Still there, still waiting. ';
          } else {
            prefix = 'Nothing new. You checked anyway. ';
          }
          return prefix + phoneScreenDescription();
        }

        return phoneScreenDescription();
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

        // Skin condition — cracked/tight gets a deterministic observational suffix
        const skin = ctx.state.skinConditionTier();
        const skinSuffix = skin === 'cracked'
          ? ' Your skin is tight and raw around your mouth.'
          : skin === 'tight'
          ? ' The skin around your knuckles is tight.'
          : '';

        if (mood === 'numb' || mood === 'hollow') {
          return 'Cold water. You go through the motions. The face in the mirror is yours. You don\'t stay to look.' + skinSuffix;
        }
        if (aden > 70 && ctx.state.adenosineBlock() > 0.4) {
          return 'Cold water on your face. The shock of it is the point. You stand there dripping for a second, waiting to feel more awake.' + skinSuffix;
        }
        if (ne > 65) {
          return 'Water on your face. The cold is immediate, distinct. Your hands on the edges of the sink, grounded.' + skinSuffix;
        }
        if (ser < 35) {
          return 'Cold water. You look at yourself in the mirror. You look away before the looking becomes something.' + skinSuffix;
        }
        return 'Cold water on your face. You look at yourself in the mirror, briefly. You look away.' + skinSuffix;
      },
    },

    apply_moisturizer: {
      id: 'apply_moisturizer',
      label: 'Put on some lotion',
      location: 'apartment_bathroom',
      available: () => ctx.state.get('moisturizer_count') > 0
                    && !['healthy'].includes(ctx.state.skinConditionTier()),
      execute: () => {
        const skinBefore = ctx.state.skinConditionTier(); // read before adjustment
        const remaining = ctx.state.get('moisturizer_count') - 1;
        ctx.state.set('moisturizer_count', remaining);
        ctx.state.adjustSkinCondition(20);
        ctx.state.adjustNT('gaba', 1); // small self-care effect
        ctx.state.advanceTime(2);

        const mood = ctx.state.moodTone();
        const ser = ctx.state.get('serotonin');

        // Nearly empty — deterministic suffix, no RNG
        const nearlySuffix = remaining === 0
          ? ' The tube is empty.'
          : remaining === 1
          ? ' One use left in the tube.'
          : '';

        if (mood === 'numb' || mood === 'heavy') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You put some on. You go through the motions. The skin is less bad than it was.' },
            { weight: 1, value: 'The lotion. You rub it in. Your hands feel different. That\'s something you did.' },
            // Low serotonin — even small self-care lands flat
            { weight: ctx.state.lerp01(ser, 35, 15), value: 'You put some on your hands because they hurt. That\'s the whole thought. You do it anyway.' },
          ]) + nearlySuffix;
        }
        if (skinBefore === 'cracked' || skinBefore === 'tight') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You rub it in. Your hands stop catching on things. The relief is specific and quiet.' },
            { weight: 1, value: 'The lotion. The smell of it. Your skin takes it in. The tight feeling softens.' },
            { weight: 1, value: 'A small act. Lotion on your hands. The cracked places feel less raw.' },
          ]) + nearlySuffix;
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Lotion on your hands, worked in. Your skin feels better than it did.' },
          { weight: 1, value: 'You put some on. It smells like the tube says it will. Your hands absorb it.' },
        ]) + nearlySuffix;
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
      available: () => ctx.state.get('pain_reliever_count') > 0
                    && ((ctx.state.hasCondition('migraines') && ctx.state.migraineTier() !== 'none')
                    || (ctx.state.hasCondition('dental_pain') && ctx.state.dentalTier() !== 'none')),
      execute: () => {
        const dentalTier = ctx.state.dentalTier();
        const migraineTier = ctx.state.migraineTier();

        ctx.state.set('pain_reliever_count', ctx.state.get('pain_reliever_count') - 1);

        // Dental — ibuprofen cuts ache by ~35 points; doesn't fix the underlying tooth
        if (dentalTier !== 'none') {
          ctx.state.dentalSpike(-35); // Calibrated: center of 30–40pt range (Cochrane PMC4171980, NNT 2.3; PMID 21383341)
        }
        // Migraine — pain reliever cuts intensity by ~35 points
        if (migraineTier !== 'none') {
          ctx.state.set('migraine_intensity', Math.max(0, ctx.state.get('migraine_intensity') - 35));
        }
        ctx.state.advanceTime(ctx.timeline.randomInt(3, 6));

        const mood = ctx.state.moodTone();

        // Dental-primary prose (when tooth is worse than or instead of migraine)
        if (dentalTier !== 'none' && (migraineTier === 'none' || ctx.state.get('dental_ache') > ctx.state.get('migraine_intensity'))) {
          if (['none', 'dull'].includes(ctx.state.dentalTier())) {
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
        if (migraineTierNow === 'building') {
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

    go_for_run: {
      id: 'go_for_run',
      label: 'Run for a while',
      location: 'street',
      available: () => {
        const et = ctx.state.energyTier();
        const st = ctx.state.stressTier();
        return et !== 'depleted' && et !== 'exhausted' && st !== 'overwhelmed' && ctx.state.migraineTier() !== 'severe';
      },
      execute: () => {
        const mood = ctx.state.moodTone();
        const weather = ctx.state.get('weather');
        const minutes = 30; // Approximation debt (exercise): fixed 30-min run; real duration varies 20–45 by fitness and intent

        ctx.state.advanceTime(minutes);
        ctx.state.adjustEnergy(-18); // Approximation debt (exercise): energy cost 18; running ~3× walking effort
        ctx.state.adjustHunger(14);  // Approximation debt (exercise): hunger +14; metabolic demand of 30-min moderate run

        // Acute NE spike — sympathoadrenal activation during effort
        // Zouhal 2008 (PMID 18034690): plasma NE 2–6× resting during aerobic exercise
        ctx.state.adjustNT('norepinephrine', 13); // Approximation debt (exercise): NE +13 acute spike; coefficient chosen

        // Adenosine accumulation — exercise raises sleep pressure (muscle ATP → AMP → adenosine)
        // Dworak 2007 (PMID 17538002): basal ganglia adenosine rises with treadmill exercise
        ctx.state.adjustNT('adenosine', 8); // Approximation debt (exercise): +8 adenosine; models "tired but better"

        // Endocannabinoid / runner's high — peaks 20–30 min into moderate-intensity aerobic exercise
        // Fuss 2015 (PMID 26453158): eCB-mediated euphoria in mice at 60–80% VO2max; crosses blood-brain barrier
        // Dopamine +10, GABA +8 — eCB disinhibition of mesolimbic DA + anxiolysis via CB1 on GABAergic interneurons
        ctx.state.adjustNT('endocannabinoid', 12); // Approximation debt (exercise): eCB +12; indirect proxy for anandamide elevation
        ctx.state.adjustNT('dopamine', 10);         // Approximation debt (exercise): DA +10 via eCB mesolimbic disinhibition
        ctx.state.adjustNT('gaba', 8);              // Approximation debt (exercise): GABA +8 via CB1 anxiolysis

        // Post-run serotonin — synthesis upregulated by exercise; effect outlasts acute phase
        // Jacobs & Fornal 1999 (PMID 10327951): tonic 5-HT neuron firing increases with locomotion
        ctx.state.adjustNT('serotonin', 6); // Approximation debt (exercise): serotonin +6 post-run afterglow

        // Weather modifier
        if (weather === 'drizzle') {
          ctx.state.adjustStress(1);
        } else if (weather === 'snow') {
          ctx.state.adjustStress(2);
        }

        // Clothing tear roll — 1 RNG call, balanced on all branches
        // Running has slightly higher torn risk than home workout (pavement, stride, wet fabric)
        // Approximation debt (clothing condition): 6% torn probability per run; no empirical basis
        {
          const roll = ctx.timeline.random();
          const candidate = ctx.clothing.wornItemOfType(['top', 'bottom']);
          if (candidate && roll < 0.06 && !candidate.damage?.torn) { // Approximation debt (clothing condition):
            ctx.clothing.applyDamage(candidate.id, 'torn');
            if (['top', 'bottom', 'dress', 'outerwear'].includes(candidate.type)) {
              ctx.state.set('clothing_visible_damage', true);
            }
          }
        }

        // NT values for prose shading
        const ser = ctx.state.get('serotonin');
        const ne = ctx.state.get('norepinephrine');
        const dopa = ctx.state.get('dopamine');
        const gaba = ctx.state.get('gaba');
        const aden = ctx.state.get('adenosine');

        // Running when very stressed — the run as escape valve
        if (mood === 'fraying') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You run. It doesn\'t solve anything. But the running burned through something — the thought-loop thinned, the air kept coming in. You come back wrecked in a way that feels better than the other kind of wrecked.' },
            { weight: 1, value: 'The running helped. Not much, and then more than you expected. By the second block the thoughts were still there but they had to work to keep up. By the end they\'d lost some ground.' },
            // High NE still — body charging hard even into the run
            { weight: ctx.state.lerp01(ne, 60, 80), value: 'You run fast. Too fast to be strategic about it. The legs are already going and the rest of you follows. By the halfway point something has burned off — not gone, but thinner. The body chose this. The body was right.' },
          ]);
        }

        if (mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You run. Your legs work. Your lungs work. You come back. Something is different — not feeling, exactly, but the edges of things are slightly more there.' },
            { weight: 1, value: 'A run. Your body did it without requiring much from you. You went, you came back. The hollow is still hollow but it\'s slightly warmer in it.' },
            // High adenosine — the run was heavy, mechanical
            { weight: ctx.state.lerp01(aden, 55, 75), value: 'You run and the weight of your body is very present. Each block costs. The rhythm keeps you going more than anything else does. You come back with the good kind of tired on top of the bad kind.' },
          ]);
        }

        if (mood === 'heavy') {
          if (weather === 'drizzle') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You run in the rain. The first five minutes feel wrong. Body arguing. Then the breath found a pattern and the rain was just a fact. You come back wet and spent and somehow less heavy than you went out.' },
              { weight: 1, value: 'Rain and running. The wet makes it harder to care whether you keep going, which means you keep going. Something rinsed through. You\'re not sure what.' },
            ]);
          }
          if (weather === 'snow') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You run in the snow. Your breath comes out white. The cold has a quality to it — present, specific, requiring something. Your legs find the dry patches. By the end you\'re in it, not just moving through it.' },
              { weight: 1, value: 'Snow run. The world muffled, your footsteps loud. Each breath a small plume. The heaviness lifted partway — not gone, but up. You come back red-faced and lighter than you left.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The first five minutes feel wrong. Body arguing. Then the rhythm found you and the arguments stopped. Something rinsed through. You don\'t have a name for what it was.' },
            { weight: 1, value: 'You run until the apartment is far enough away. By the end your legs are done and something else is quieter. You come back slow, breathing hard, and slightly less whatever you were.' },
            // Serotonin nudge taking hold — the "more than expected" moment
            { weight: ctx.state.lerp01(ser, 45, 65), value: 'You didn\'t expect it to help this much. The first blocks were effort and only effort. Then something shifted — not suddenly, just gradually the air tasted different, the movement had its own logic, and the weight you started with got lighter. You come back carrying less.' },
          ]);
        }

        if (mood === 'flat') {
          if (weather === 'drizzle') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'You run in the drizzle. Cold on your face, wet at the shoulders. The effort is real. You come back damp and with your blood moving in a way that makes inside feel like a different inside.' },
              { weight: 1, value: 'Rain run. Not ideal. The effort was there and the wet was there and you did it anyway. The body feels used in the right way.' },
            ]);
          }
          if (weather === 'snow') {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'Running in the snow costs more. Your legs know. But the cold is sharp and the sharpness registers as something, which is better than the alternative.' },
              { weight: 1, value: 'You run. Snow. Cold air in, white breath out. The body doing the one thing it knows how to do without being asked too much.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You run. Your body knows the rhythm before your head catches up. By the end something has moved — not a lot, but in the right direction. The blood is going. That\'s real.' },
            { weight: 1, value: 'A run. The air, the legs, the particular burn in your chest near the end. You come back with the feeling that you\'ve used yourself on purpose. It helps, some.' },
            // High dopamine from eCB lift — the engagement is real
            { weight: ctx.state.lerp01(dopa, 55, 75), value: 'Something kicked in around the second block. Not dramatic — just the run becoming its own thing rather than an effort you were making. Your legs found it. You followed. You come back different in some small specific way.' },
          ]);
        }

        // clear / present
        if (weather === 'drizzle') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You run in the drizzle and the cold rain on your face is a specific good thing. The breath, the rain, the legs — all of it doing its job. You come back soaked and cleaner than you left.' },
            // High NE — every drop is vivid
            { weight: ctx.state.lerp01(ne, 50, 70), value: 'Rain on your face while running. Cold and present. Every drop distinct. Your breath in and out, the slap of wet pavement, the smell of it. The world at full volume. You\'re in it.' },
          ]);
        }
        if (weather === 'snow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Running in snow — the world quiet and your breathing loud in it. White ahead, your footsteps behind you. The cold does something good to the effort. You come back pink-faced and glad.' },
            // High NE — the cold is electric
            { weight: ctx.state.lerp01(ne, 50, 70), value: 'The cold hits your face and it\'s immediate and specific. Your breath comes out white. Each footfall in the snow has a sound. You\'re very here. The run has you.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You run. Your legs find it quickly — that rhythm that doesn\'t require thinking. The air moves through you. Something rinsed through. You come back spent and cleaner.' },
          { weight: 1, value: 'A run. The street, the breath, the particular quality of effort that turns into something else partway through. You don\'t know exactly when it stopped being work and started being the thing itself.' },
          // High NE — sensory immersion at peak
          { weight: ctx.state.lerp01(ne, 50, 70), value: 'The run has a texture to it. The air moving past your face, the sound of your own breathing, the specific weight of your legs at the end. All of it landing. You come back with the world very present.' },
          // High GABA from eCB — the quieted-out feeling
          { weight: ctx.state.lerp01(gaba, 55, 75), value: 'About halfway through something went quiet. Not silent — just the noise thinned out. The run took up all the available space and there wasn\'t room for the rest of it. You come back and it\'s still a little quieter in there.' },
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

        let text;
        if (weather === 'snow') {
          const hasUmbrella = ctx.state.get('has_umbrella');
          text = ctx.timeline.weightedPick([
            { weight: hasUmbrella ? 0.4 : 1, value: long ? 'Snow on your shoulders. The bus takes a long time. There\'s nowhere warmer within reach.' : 'Snow while you wait. The bus comes.' },
            { weight: 1, value: 'The shelter doesn\'t help much with cold. You stand in it anyway. Snow on everything. The bus arrives eventually.' },
            // With umbrella — blocks accumulation but cold is still cold
            { weight: hasUmbrella ? 1.0 : 0, value: 'You hold the umbrella up against the snow. It keeps the accumulation off. The cold comes from everywhere else.' + (long ? ' A long wait.' : ' The bus comes.') },
            // High adenosine (unblocked) — cold and tired compound
            { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: 'The cold gets into your feet first, then your hands. You shift your weight. Snow on your shoulders.' + (long ? ' The bus takes a long time.' : ' The bus comes.') },
            // Low serotonin — the wait has more weight than it should
            { weight: ctx.state.lerp01(ser, 40, 20), value: 'Snow, cold, waiting. ' + (long ? 'The bus doesn\'t come and doesn\'t come.' : 'The bus comes.') + ' You get on. That\'s all.' },
          ]);
        } else if (weather === 'drizzle') {
          const hasUmbrella = ctx.state.get('has_umbrella');
          text = ctx.timeline.weightedPick([
            { weight: hasUmbrella ? 0 : 1, value: 'Rain collects on the shelter roof and drips from the edge in a line.' + (long ? ' The bus takes its time.' : '') },
            { weight: hasUmbrella ? 0 : 1, value: 'The shelter covers most of it. You stand in the dry part and wait.' + (long ? ' A long wait.' : '') },
            // With umbrella — different texture, out from under the shelter
            { weight: hasUmbrella ? 1.2 : 0, value: 'You open the umbrella and step out from under the shelter. Rain on nylon.' + (long ? ' The bus takes its time.' : ' The bus comes.') },
            { weight: hasUmbrella ? 1.0 : 0, value: 'The umbrella keeps most of it off. Your shoes are another matter.' + (long ? ' A long wait in the wet.' : '') },
            // Low GABA — exposed even under cover (applies regardless of umbrella)
            { weight: ctx.state.lerp01(gaba, 42, 22), value: 'The shelter helps with the rain. It doesn\'t help with the feeling of standing in the open.' + (long ? ' The bus is a long time.' : ' The bus comes.') },
            // High NE — rain sounds are amplified
            { weight: ctx.state.lerp01(ne, 55, 75), value: hasUmbrella
              ? 'Rain on the umbrella — loud and close. The wet street below, headlights. ' + (long ? 'You wait a long time in it.' : 'The bus comes.')
              : 'Rain on the shelter roof. Loud in a specific way. The wet street. Headlights. ' + (long ? 'You wait a long time in it.' : 'The bus comes before it gets worse.') },
          ]);
        } else if (mood === 'clear' || mood === 'present') {
          // Clear / overcast / grey — mood is the texture
          text = ctx.timeline.weightedPick([
            { weight: 1, value: long ? 'The bus takes its time. You wait, and the waiting is just waiting — the street, the sounds, the air.' : 'A few minutes at the stop. The air is decent. The bus arrives.' },
            { weight: 1, value: 'You stand at the stop. A couple of people drift up. Someone checks their phone. The bus comes.' },
            // High NE — the stop is vivid
            { weight: ctx.state.lerp01(ne, 45, 65), value: 'The stop is its own small world — the sounds, the movement. A car passes. A pigeon. Someone checks their watch. The bus comes when it comes.' },
            // High dopamine — small interest in the scene
            { weight: ctx.state.lerp01(dopa, 50, 70), value: 'You watch the intersection while you wait. Things happen there. The bus turns the corner. You board.' },
          ]);
        } else if (mood === 'fraying') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You check the direction it comes from too many times. It comes when it comes.' },
            { weight: 1, value: 'The wait is hard. You can\'t stand still. The bus arrives before you\'ve decided what to do with yourself.' },
            // Low GABA — standing in the open is difficult
            { weight: ctx.state.lerp01(gaba, 42, 22), value: 'You keep looking up the street. You can\'t stop yourself. The openness of the stop doesn\'t help — nowhere to put your back. The bus comes.' },
            // High NE — everything at the stop registers
            { weight: ctx.state.lerp01(ne, 55, 75), value: 'Every car that rounds the corner gets your attention before you can stop it.' + (long ? ' The bus takes a long time. You are extremely ready to be on it.' : ' The bus comes and you move toward it before it stops.') },
          ]);
        } else if (mood === 'heavy') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: long ? 'The bus takes its time. You wait in the cold.' : 'You wait at the stop. The bus arrives.' },
            { weight: 1, value: 'Your bag. Your shoes. Your body wanting to lean on something.' + (long ? ' The bus is a long time coming.' : ' The bus comes.') },
            // High adenosine (unblocked) — legs want to sit
            { weight: ctx.state.lerp01(aden, 45, 68) * ctx.state.adenosineBlock(), value: 'Your legs are tired and you\'ve only been standing for a few minutes.' + (long ? ' The bus takes forever.' : '') + ' You get on when it comes.' },
          ]);
        } else if (mood === 'hollow') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You stand there. People come and go. The bus doesn\'t, and then it does.' },
            { weight: 1, value: 'The stop is exposed. You wait in it. Other people, their lives, the bus.' },
            // High adenosine (unblocked) — standing hollow and tired
            { weight: ctx.state.lerp01(aden, 45, 65) * ctx.state.adenosineBlock(), value: 'Standing is its own kind of tired. You shift your weight from foot to foot. The bus eventually comes.' },
          ]);
        } else if (mood === 'numb') {
          text = ctx.timeline.weightedPick([
            { weight: 1, value: 'You stand there. The bus will come. It does.' },
            { weight: 1, value: 'The stop. Other people waiting. The bus.' },
            // Low serotonin — time doesn't behave
            { weight: ctx.state.lerp01(ser, 35, 15), value: 'You stand at the stop and time doesn\'t do what it\'s supposed to.' + (long ? ' The bus is a long time.' : ' The bus comes.') + ' You get on.' },
          ]);
        } else {
          // flat / default
          text = ctx.timeline.weightedPick([
            { weight: 1, value: long ? 'The bus takes its time. You wait.' : 'A few minutes. Buses arrive when they arrive.' },
            { weight: 1, value: 'You stand at the stop. Time passes at the speed it passes. The bus comes.' },
            // High adenosine (unblocked) — legs want to sit
            { weight: ctx.state.lerp01(aden, 45, 65) * ctx.state.adenosineBlock(), value: 'Your legs want you to sit. The bench is full. You stand.' + (long ? ' The bus takes a while.' : ' The bus comes.') },
          ]);
        }

        // Background sensory prose — body stopped, attention loose at the stop
        const mid = ctx.senses.midSense('waiting');
        if (mid) text += '\n\n' + mid;
        return text;
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

    check_phone_bus: {
      id: 'check_phone_bus',
      label: 'Check your phone',
      location: 'bus_stop',
      available: () => ctx.state.get('has_phone') && ctx.state.get('phone_battery') > 0 && !ctx.state.get('viewing_phone'),
      execute: () => {
        ctx.state.set('viewing_phone', true);
        ctx.state.advanceTime(1);
        ctx.events.record('checked_phone');

        // The particular quality of reaching for the phone while waiting for the bus
        const mood = ctx.state.moodTone();
        const hasUnread = ctx.state.hasUnreadMessages();
        const ne = ctx.state.get('norepinephrine');
        const gaba = ctx.state.get('gaba');

        let prefix;
        if (hasUnread) {
          if (mood === 'fraying' || mood === 'heavy') {
            prefix = 'Something to do with your hands. ';
          } else if (ne > 62) {
            prefix = 'Out of your pocket before you decide to. ';
          } else {
            prefix = 'You pull it out at the stop. ';
          }
        } else if (gaba < 38) {
          prefix = 'You reach for it. There\'s nothing, but you had to check. ';
        } else if (mood === 'numb' || mood === 'hollow') {
          prefix = 'Habit. The screen. ';
        } else {
          prefix = 'You check while you wait. ';
        }

        return prefix + phoneScreenDescription();
      },
    },

    // === WORKPLACE ===
    do_work: {
      id: 'do_work',
      label: 'Work on what\'s in front of you',
      location: 'workplace',
      available: () => ctx.events.count('work_task_done', ctx.state.get('wake_period_start')) < ctx.state.get('work_tasks_expected'),
      execute: () => {
        const canFocus = ctx.state.canFocus();
        const energy = ctx.state.energyTier();
        const stress = ctx.state.stressTier();

        let timeCost, energyCost, stressEffect;

        if (canFocus) {
          timeCost = ctx.timeline.randomInt(30, 60);
          energyCost = -10;
          stressEffect = -3;
          ctx.events.record('work_task_done');
          ctx.state.adjustJobStanding(1); // focused work builds standing — Approximation debt (job standing): +1 for focused work completion chosen
        } else {
          timeCost = ctx.timeline.randomInt(45, 90);
          energyCost = -15;
          stressEffect = 5;
          if (ctx.timeline.chance(0.6)) {
            ctx.events.record('work_task_done');
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
        let workText = proseFn(canFocus, energy, stress);

        // Age-stage shading — deterministic modifier (layer 3, no RNG).
        // Only fires when the contrast is real: young adult surprised by exhaustion;
        // adult and midlife have different relationships to the same grind.
        {
          const ageStage = ctx.state.ageStageTier();
          if (ageStage === 'young_adult' && !canFocus && (energy === 'depleted' || energy === 'exhausted')) {
            workText += ' You didn\'t think it would feel like this. Nobody said it would feel like this.';
          } else if (ageStage === 'adult' && !canFocus) {
            workText += ' You know this feeling now. You just keep going.';
          } else if (ageStage === 'midlife' && energy === 'tired') {
            workText += ' You\'ve gotten good at working tired. That\'s not something you would have said at twenty-five.';
          } else if (ageStage === 'midlife' && !canFocus) {
            workText += ' The tired is different now. Not sharper or softer. Just more expected.';
          }
        }

        return workText;
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
        const appearance = ctx.state.appearanceAwareness();

        // Base social/stress effects, modified by accumulated sentiment and appearance
        // Approximation debt (social depth): base of 8 social (+ 2 for warmth) for talk_to_coworker chosen
        // Appearance penalty: notable -3 social / slipping -1; notable+ adds irritation and dims connection
        let socialBonus = 8 + (warmth > 0.3 ? 2 : 0);
        if (appearance === 'severe')      { socialBonus -= 4; }
        else if (appearance === 'notable') { socialBonus -= 3; }
        else if (appearance === 'slipping') { socialBonus -= 1; }
        const stressEffect = irritation > 0.4 ? 2 : -3;
        ctx.state.adjustSocial(socialBonus);
        // Appearance reduces connection_depth gain — you can't land fully in the interaction
        // Approximation debt (appearance): depth penalty -1 at notable, -2 at severe chosen
        const depthGain = appearance === 'severe' ? 1 : appearance === 'notable' ? 2 : 3;
        ctx.state.adjustConnectionDepth(depthGain); // Approximation debt (social depth): +3 baseline chosen
        ctx.state.adjustStress(stressEffect);

        // Poor appearance causes coworker irritation drift — physical distance and self-monitoring
        // read as social withdrawal, which registers as coolness on the coworker's side
        if (appearance === 'severe') {
          ctx.state.adjustSentiment(slot, 'irritation', 0.018);
        } else if (appearance === 'notable') {
          ctx.state.adjustSentiment(slot, 'irritation', 0.012);
        }

        // Self-consciousness signal — body registers the exposure before the mind labels it.
        // NE spike (hypervigilance to being seen) + GABA drop (can't settle) at notable/severe.
        // Deterministic, proportional to appearance tier.
        // Approximation debt (appearance): NE +4/+7, GABA -2/-4 magnitudes chosen.
        if (appearance === 'severe') {
          ctx.state.adjustNT('norepinephrine', 7);  // Approximation debt (appearance):
          ctx.state.adjustNT('gaba', -4);           // Approximation debt (appearance):
        } else if (appearance === 'notable') {
          ctx.state.adjustNT('norepinephrine', 4);  // Approximation debt (appearance):
          ctx.state.adjustNT('gaba', -2);           // Approximation debt (appearance):
        }

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

        // Prose — 1 RNG call from the coworker function, then deterministic appearance suffix
        let prose;
        if (social === 'isolated' || social === 'withdrawn' || mood === 'present' || mood === 'clear') {
          prose = /** @type {(name: string) => string} */ (coworkerInteraction[coworker.flavor])(coworker.name);
        } else {
          prose = /** @type {(name: string) => string} */ (coworkerChatter[coworker.flavor])(coworker.name);
        }

        // Deterministic appearance self-consciousness suffix — no RNG.
        // Severe: both hygiene and clothing are off — compound awareness.
        // Notable: one dimension clearly off — body-level tightening.
        // Slipping: mild background awareness, no suffix (not worth surfacing at this tier).
        if (appearance === 'severe') {
          prose += mood === 'numb' || mood === 'heavy'
            ? ' You keep your distance without deciding to. Something tightens and doesn\'t release.'
            : ' Something in your chest pulls tight the whole time. You keep it short. You keep your distance.';
        } else if (appearance === 'notable') {
          const isHygieneSource = ctx.state.hygieneTier() === 'grimy';
          if (isHygieneSource) {
            prose += mood === 'numb' || mood === 'heavy'
              ? ' You keep your distance without deciding to.'
              : ' You\'re aware of yourself the whole time. You keep it short.';
          } else {
            // Clothing is the source
            prose += mood === 'numb' || mood === 'heavy'
              ? ' Something tightens in your chest, low and unexamined.'
              : ' You become aware of what you\'re wearing. The conversation is fine. You don\'t quite land in it.';
          }
        }
        return prose;
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
          && !ctx.events.any('ate_at_work', ctx.state.get('wake_period_start'))
          && ['hungry', 'very_hungry', 'starving'].includes(ctx.state.hungerTier());
      },
      execute: () => {
        ctx.state.adjustHunger(-40);
        ctx.state.addPendingHydration(150); // ~150ml water content in solid meal — absorbs over ~20 min (Popkin et al. 2010 PMC2908954)
        ctx.state.fillStomach(70, 'solid');
        ctx.events.record('ate_at_work');
        ctx.state.advanceTime(10);

        // Dental — eating spikes the ache
        ctx.state.dentalSpike(20); // Calibrated: center of +10–25 range for pulpitis functional pain (Hargreaves biorxiv)

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
          && !ctx.events.any('grazed_break_room', ctx.state.get('wake_period_start'))
          && ctx.state.isWorkHours();
      },
      execute: () => {
        ctx.state.adjustHunger(-12);
        ctx.state.fillStomach(20, 'solid');
        ctx.events.record('grazed_break_room');
        ctx.state.advanceTime(8);

        // Dental — sugar/acidity from candy and cake.
        // Approximation debt (hunger): 10 pts chosen (less than full meals at 15) on the
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
        ctx.state.dentalSpike(25); // Calibrated: within +20–33 range for pulpitis thermal trigger (PMC3819160, Allison 2020)

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
      location: 'workplace_bathroom',
      available: () => ['aware', 'urgent', 'pressing'].includes(ctx.state.bladderNeedTier()),
      execute: () => {
        const need = ctx.state.bladderNeedTier();
        const jobType = ctx.character.get('job');
        ctx.state.voidBladder();
        ctx.state.adjustStress(-1);

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

    decompress_work: {
      id: 'decompress_work',
      label: 'Take a minute',
      location: 'workplace_bathroom',
      available: () => true,
      execute: () => {
        ctx.state.advanceTime(5);
        ctx.state.adjustStress(-2);
        const stress = ctx.state.stressTier();
        const gaba = ctx.state.get('gaba');
        const ne = ctx.state.get('norepinephrine');
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Five minutes. The fluorescent hum. Nobody needing anything.' },
          { weight: (stress === 'overwhelmed' || stress === 'strained') ? 1.2 : 0, value: 'You lean against the wall. The thing that\'s been pressing — it doesn\'t go away. But it doesn\'t have your full attention for a minute.' },
          { weight: ctx.state.lerp01(gaba, 40, 22), value: 'A locked stall. The only door in the building that\'s yours right now. Five minutes of not performing being fine.' },
          { weight: ctx.state.lerp01(ne, 50, 70), value: 'The ventilation hum. The slow drip somewhere. Your heart rate is doing something. A few minutes, then back.' },
        ]);
      },
    },

    // === NICOTINE — SMOKE BREAK ===
    // Available at outside locations and workplace (smoke break as legitimized absence).
    // No workplace_exterior exists — workplace smoke break modeled as a brief step outside
    // during work hours, available at the workplace location itself.
    // TODO: when workplace_exterior is added, move the workplace availability there and
    // reduce the time cost (currently 8 min accounts for the implied walk outside and back).
    smoke_cigarette: {
      id: 'smoke_cigarette',
      label: 'Smoke',
      location: null, // multi-location; availability function gates it
      available: () => {
        if (ctx.state.get('has_cigarettes') < 1) return false;
        if (!ctx.state.isSmoker()) return false;
        const loc = ctx.state.get('location');
        const area = ctx.world.getCurrentLocation()?.area;
        // Outside locations: any time
        if (area === 'outside') return true;
        // Workplace: during work hours only — the legitimized absence
        if (loc === 'workplace' && ctx.state.isWorkHours()) return true;
        return false;
      },
      execute: () => {
        const loc = ctx.state.get('location');
        const isWorkBreak = (loc === 'workplace');
        const time = isWorkBreak
          ? ctx.timeline.randomInt(7, 10)  // step outside, smoke, step back
          : ctx.timeline.randomInt(5, 8);  // just the smoke
        ctx.state.advanceTime(time);
        ctx.state.set('has_cigarettes', ctx.state.get('has_cigarettes') - 1);
        ctx.state.consumeNicotine(30); // one cigarette ≈ 30 units
        // Work break stress relief — the step away from the context matters independent of nicotine
        if (isWorkBreak) {
          ctx.state.adjustStress(-3);
        }

        const mood = ctx.state.moodTone();
        const wd = ctx.state.nicotineWithdrawalTier();
        const ne = ctx.state.get('norepinephrine');
        const gaba = ctx.state.get('gaba');

        // First cigarette after withdrawal — the specific relief of the deficit filling
        if (wd === 'moderate' || wd === 'severe') {
          if (isWorkBreak) {
            return ctx.timeline.weightedPick([
              { weight: 1, value: 'Outside. The door swings shut behind you. You light up and the edge in your chest starts to dull. The thing that\'s been making every small thing worse — it retreats a little. You finish it, drop it, go back in.' },
              { weight: wd === 'severe' ? 2 : 1, value: 'You step out on the excuse of it. The lighter. The first drag. Your shoulders drop somewhere around the second. Something that was sharp becomes merely present. You have to go back in but you\'re a slightly different version of yourself.' },
            ]);
          }
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You light one. The first drag hits and the edge that\'s been sitting in your chest all morning starts to dull. It\'s not pleasant, exactly. It\'s the absence of the unpleasant thing.' },
            { weight: 1, value: 'You\'ve been needing this since you woke up. The irritability was a specific kind — the one that has a solution. You smoke and the solution happens.' },
            { weight: wd === 'severe' ? 2 : 1, value: 'You light up. Inhale. The thing that made every minor friction feel like an attack — it loosens. You exhale and stand there a moment, just existing without the edge.' },
          ]);
        }

        // Work break without withdrawal — legitimized absence as primary value
        if (isWorkBreak) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'The door closes. You\'re outside. You light up and stand there — the building at your back, the street a few feet away, not really belonging to either. The smoke gives you something to do with your hands.' },
            { weight: 1, value: 'A reason to be somewhere else for a few minutes. That\'s what the cigarette is today. You smoke it slowly.' },
            { weight: ctx.state.lerp01(gaba, 50, 30), value: 'Outside. The door shut. The noise in your head doesn\'t stop but it gets less load-bearing while you smoke.' },
            { weight: ctx.state.lerp01(ne, 55, 75), value: 'You step out. The edge you\'ve been carrying since mid-morning — outside it\'s slightly easier to hold. You smoke. Then you go back.' },
          ]);
        }

        // Regular smoke — no particular withdrawal signal
        if (mood === 'numb' || mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You smoke. Something to do. The ritual of it — lighter, first drag, the wait. It occupies the part of you that needed occupying.' },
            { weight: 1, value: 'A cigarette. You stand and smoke and watch nothing in particular.' },
          ]);
        }

        if (mood === 'heavy' || mood === 'fraying') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You light up. There\'s a version of yourself that doesn\'t do this and you can\'t access it right now. The smoke helps, the way smoke helps.' },
            { weight: ctx.state.lerp01(gaba, 45, 25), value: 'You needed to be outside anyway. The cigarette gives you a reason. You smoke it slowly and don\'t move until it\'s done.' },
          ]);
        }

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You smoke. The rhythm of it — light, inhale, exhale, wait. Whatever you were thinking about recedes a little.' },
          { weight: 1, value: 'Outside. You light one. The smoke rises and goes wherever smoke goes.' },
          { weight: ctx.state.lerp01(ne, 45, 65), value: 'A cigarette. Your hands stop doing the thing they do when they have nothing to do.' },
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
        const recog = ctx.state.locationVisitTier('corner_store');

        // Recognition — deterministic modifier (layer 3, no RNG)
        // Being recognized at a corner store is not profound. It's just the texture of a life with habits.
        if (recog === 'regular') {
          ctx.state.adjustNT('serotonin', 2); // Being a fixture matters even at low stakes
        }
        const recognitionSuffix = recog === 'regular'
          ? ' The cashier scans it through without looking up. You\'ve been coming here long enough that the transaction just happens.'
          : recog === 'familiar'
            ? ' The cashier doesn\'t have to think about it. Neither do you.'
            : '';

        if (usingEbt) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You swipe your EBT card. The machine beeps. You take your bags.' },
            { weight: 1, value: 'Bread. Rice. A can of beans. You pay with EBT. The cashier doesn\'t react.' },
            { weight: ctx.state.lerp01('serotonin', 50, 25), value: 'You use your EBT. The transaction goes through. You carry the bags out without looking back.' },
          ]) + recognitionSuffix;
        }
        if (money === 'scraping' || money === 'tight') {
          return 'Bread. Rice. A can of beans. You count it out at the register.' + recognitionSuffix;
        }
        if (money === 'broke') {
          return 'The basics. Just the basics. The receipt is a small piece of bad news.';
        }
        return 'You pick up what you need. Bread, some produce, a couple of cans. The cashier rings it up.' + recognitionSuffix;
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

        ctx.state.set('consecutive_meals_skipped', 0);
        ctx.state.advanceTime(5);
        ctx.state.glanceMoney();
        ctx.events.record('ate', { what: 'cheap_meal' });

        // Dental — eating anything spikes the ache
        ctx.state.dentalSpike(20); // Calibrated: center of +10–25 range for pulpitis functional pain (Hargreaves biorxiv)

        // Food comfort sentiment — weaker than home food + habituation
        const fc = ctx.state.sentimentIntensity('eating', 'comfort');
        if (fc > 0) {
          ctx.state.adjustNT('serotonin', fc * 2);
          ctx.state.adjustSentiment('eating', 'comfort', -0.002);
        }

        const mood = ctx.state.moodTone();
        const dentalW = ctx.state.lerp01(ctx.state.get('dental_ache'), 20, 65);
        const recog = ctx.state.locationVisitTier('corner_store');

        // Recognition — deterministic modifier (layer 3, no RNG)
        if (recog === 'regular') {
          ctx.state.adjustNT('serotonin', 2); // Being a fixture matters even at low stakes
        }
        const recognitionSuffix = recog === 'regular'
          ? ' You\'ve been coming here long enough that the nod feels like something.'
          : recog === 'familiar'
            ? ' The same cashier. She doesn\'t have to think about what you\'re doing here.'
            : '';

        if (mood === 'numb' || mood === 'heavy') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You eat it on the way out. Something wrapped in plastic from a warmer. It\'s food. It does what food does.' },
            { weight: 1, value: 'You eat standing by the door. Cheap food in a plastic wrapper. Your body accepts it. That\'s about all.' },
            // High food comfort — even cheap food can be something
            { weight: fc > 0 ? fc * 0.7 : 0, value: 'You eat it on the way out. It\'s cheap and wrapped in plastic and warm, and the warmth is something. Not much. But something your body reaches for.' },
          ]) + recognitionSuffix;
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A sandwich from the cooler. You eat it standing outside the store. It\'s fine. It\'s enough.' },
          { weight: 1, value: 'You grab something from the counter and eat it outside. Corner store food. It does the job.' },
          // High food comfort — small pleasure in cheap food
          { weight: fc > 0 ? fc * 0.7 : 0, value: 'You eat it outside the store. Cheap food, nothing to it, but the taste is good and the eating is a comfort in the simple way it always is.' },
          // Dental — eating outside with a bad tooth
          { weight: dentalW, value: 'You eat carefully on one side. Even out here it\'s a whole thing. You finish it anyway.' },
        ]) + recognitionSuffix;
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
      available: () => ctx.state.illnessTier() !== 'healthy' && ctx.state.canAfford(9) && !ctx.events.any('took_medicine', ctx.state.get('wake_period_start')),
      execute: () => {
        const cost = ctx.timeline.randomFloat(9, 13);
        const roundedCost = Math.round(cost * 100) / 100;
        if (!ctx.state.spendMoney(roundedCost)) return 'Not enough. You put it back.';
        ctx.events.record('took_medicine');
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
        ctx.state.dentalSpike(25); // Calibrated: within +20–33 range for pulpitis thermal trigger (PMC3819160, Allison 2020)

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

    buy_cigarettes: {
      id: 'buy_cigarettes',
      label: 'Pack of cigarettes',
      location: 'corner_store',
      available: () => ctx.state.isSmoker() && ctx.state.canAfford(CORNER_STORE_CIGARETTES_PRICE),
      execute: () => {
        const cost = ctx.timeline.randomFloat(CORNER_STORE_CIGARETTES_PRICE - 1, CORNER_STORE_CIGARETTES_PRICE + 1.50);

        if (!ctx.state.spendMoney(cost)) {
          return 'Not enough. You put it back.';
        }

        ctx.state.set('has_cigarettes', ctx.state.get('has_cigarettes') + 20);
        ctx.state.advanceTime(ctx.timeline.randomInt(2, 4));
        ctx.state.glanceMoney();

        const mood = ctx.state.moodTone();
        const money = ctx.state.moneyTier();
        const wd = ctx.state.nicotineWithdrawalTier();

        // Withdrawal driving the purchase
        if (wd === 'moderate' || wd === 'severe') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You pay. The pack goes in your pocket. You\'re already planning the first one.' },
            { weight: wd === 'severe' ? 2 : 1, value: 'You\'ve been grinding your teeth since this morning. The pack goes in your pocket and something in your chest unclenches just from having it there.' },
          ]);
        }

        if (money === 'broke' || money === 'scraping') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You buy the pack. The math wasn\'t comfortable but you did it anyway.' },
            { weight: 1, value: 'The money you didn\'t have for other things. The pack is in your pocket now.' },
          ]);
        }

        if (mood === 'numb' || mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You buy a pack. Something in the transaction feels automatic.' },
            { weight: 1, value: 'Pack of cigarettes. You pay without counting the change.' },
          ]);
        }

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A pack. You pay and pocket it.' },
          { weight: 1, value: 'You get a pack. The clerk doesn\'t look up. Neither do you.' },
        ]);
      },
    },

    buy_alcohol: {
      id: 'buy_alcohol',
      label: 'Beer or wine',
      location: 'corner_store',
      // Approximation debt (alcohol): price range $4–8 chosen; real prices vary by
      // jurisdiction, product, and retailer. No neighborhood cost-of-living derivation yet.
      available: () => ctx.state.canAfford(4),
      execute: () => {
        const cost = ctx.timeline.randomFloat(4, 8);
        const roundedCost = Math.round(cost * 100) / 100;

        if (!ctx.state.spendMoney(roundedCost)) {
          return 'Not enough. You put it back.';
        }

        // One unit (can/bottle) = 1 standard drink in this model.
        ctx.state.set('has_alcohol', ctx.state.get('has_alcohol') + 1);
        ctx.state.advanceTime(ctx.timeline.randomInt(2, 4));
        ctx.state.glanceMoney();

        const mood = ctx.state.moodTone();
        const money = ctx.state.moneyTier();
        const wd = ctx.state.alcoholWithdrawalTier();

        // Withdrawal driving the purchase
        if (wd === 'moderate' || wd === 'severe') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You pay for it. The moment the bottle is in your hand something settles.' },
            { weight: wd === 'severe' ? 2 : 1, value: 'You\'ve been feeling it since you woke up. You pay and put it in your bag and try not to think about why you needed to do that.' },
          ]);
        }

        if (money === 'broke' || money === 'scraping') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You buy it. The math was already bad. You do the rest of it at home.' },
            { weight: 1, value: 'The money wasn\'t for this. You buy it anyway.' },
          ]);
        }

        if (mood === 'numb' || mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Beer. You pay. Something to do with your hands later.' },
            { weight: 1, value: 'You buy it without really deciding to.' },
          ]);
        }

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A beer. A bottle of wine. Whatever was closest to the door.' },
          { weight: 1, value: 'You grab something. Pay. The transaction takes about thirty seconds.' },
        ]);
      },
    },

    buy_cannabis: {
      id: 'buy_cannabis',
      label: 'Pick something up',
      location: 'corner_store',
      // Approximation debt (jurisdiction): legal retail cannabis access varies enormously —
      // legal in many US states, Canada, Netherlands; illegal in many other countries.
      // This interaction assumes legal or quasi-legal access without modeling jurisdictional barriers.
      // Approximation debt (cannabis): price range $8–18 chosen; real prices vary by jurisdiction,
      // product, and market (legal markets $10–20/unit, legacy market $5–15). No derivation.
      available: () => ctx.state.canAfford(8),
      execute: () => {
        const cost = ctx.timeline.randomFloat(8, 18);
        const roundedCost = Math.round(cost * 100) / 100;

        if (!ctx.state.spendMoney(roundedCost)) {
          return 'Not enough. You put it back.';
        }

        ctx.state.set('has_cannabis', ctx.state.get('has_cannabis') + 1);
        ctx.state.advanceTime(ctx.timeline.randomInt(2, 4));
        ctx.state.glanceMoney();

        const mood = ctx.state.moodTone();
        const money = ctx.state.moneyTier();
        const wd = ctx.state.cannabisWithdrawalTier();

        // Withdrawal driving the purchase
        if (wd === 'moderate' || wd === 'severe') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You pay. It\'s in your pocket. You\'re already thinking about later.' },
            { weight: wd === 'severe' ? 2 : 1, value: 'You pay for it. The low-grade wrongness of the last few days has a solution now. You don\'t think too hard about that.' },
          ]);
        }

        if (money === 'broke' || money === 'scraping') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You buy it. The math was already tight. You\'ll figure the rest out.' },
            { weight: 1, value: 'The money wasn\'t really there for this. You buy it anyway.' },
          ]);
        }

        if (mood === 'numb' || mood === 'hollow') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You pay. Something to look forward to, sort of.' },
            { weight: 1, value: 'You buy it without a lot of internal debate. That\'s what today needs.' },
          ]);
        }

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You pick something up. Pay. Pocket it.' },
          { weight: 1, value: 'Quick transaction. It\'s in your pocket now.' },
        ]);
      },
    },

    buy_scratch_ticket: {
      id: 'buy_scratch_ticket',
      label: 'Scratch ticket',
      location: 'corner_store',
      available: () => ctx.state.canAfford(2),
      execute: () => {
        // Approximation debt (gambling): weights calibrated for ~75% RTP on a $2 ticket.
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

    buy_moisturizer: {
      id: 'buy_moisturizer',
      label: 'Lotion for your hands',
      location: 'corner_store',
      available: () => !['healthy'].includes(ctx.state.skinConditionTier())
                    && ctx.state.canAfford(4),
      execute: () => {
        const cost = ctx.timeline.randomFloat(3.50, 5.50);
        const roundedCost = Math.round(cost * 100) / 100;
        if (!ctx.state.spendMoney(roundedCost)) return 'Not enough. You put it back.';
        // Approximation debt (hygiene): tube size 8–14 uses. Real small tubes ~30ml → ~10 uses at
        // a normal squeeze; range covers different sizes stocked at corner stores.
        ctx.state.set('moisturizer_count', ctx.state.get('moisturizer_count') + ctx.timeline.randomInt(8, 14));
        ctx.state.advanceTime(ctx.timeline.randomInt(3, 5));
        ctx.state.glanceMoney();

        const skin = ctx.state.skinConditionTier();
        const money = ctx.state.moneyTier();

        if (skin === 'cracked') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'A small tube from the personal care aisle. Generic. You read the back of it for a second. You pay.' },
            { weight: 1, value: 'The cheapest one. You carry it to the register. The cashier scans it without comment.' },
            { weight: (money === 'scraping' || money === 'tight') ? 1.2 : 0, value: 'You look at the price twice before picking it up. Your hands are cracked. You get it.' },
          ]);
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A small tube of hand lotion. The kind of thing you kept meaning to pick up.' },
          { weight: 1, value: 'Generic hand lotion. A couple of dollars. You pay and go.' },
          { weight: (money === 'scraping' || money === 'tight') ? 0.8 : 0, value: 'Not a lot of money but it\'s not nothing. Your hands needed it.' },
        ]);
      },
    },

    buy_pain_reliever: {
      id: 'buy_pain_reliever',
      label: 'Ibuprofen',
      location: 'corner_store',
      available: () => ctx.state.canAfford(5),
      execute: () => {
        const cost = ctx.timeline.randomFloat(4, 6);
        const roundedCost = Math.round(cost * 100) / 100;
        if (!ctx.state.spendMoney(roundedCost)) return 'Not enough. You put it back.';
        // Approximation debt (consumables): tablet count per bottle. Generic ibuprofen 50-ct is typical
        // corner-store stock; 24-ct is also common. Randomizing captures both.
        ctx.state.set('pain_reliever_count', ctx.state.get('pain_reliever_count') + ctx.timeline.randomInt(24, 50));
        ctx.state.advanceTime(ctx.timeline.randomInt(3, 5));
        ctx.state.glanceMoney();

        const money = ctx.state.moneyTier();

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Generic ibuprofen from the health aisle. You put it in your bag.' },
          { weight: 1, value: 'A small bottle from the shelf. You pay and leave.' },
          { weight: (money === 'scraping' || money === 'tight') ? 1.0 : 0, value: 'You check the price before picking it up. You need it. You pay.' },
        ]);
      },
    },

    buy_umbrella: {
      id: 'buy_umbrella',
      label: 'Umbrella',
      location: 'corner_store',
      available: () => !ctx.state.get('has_umbrella') && ctx.state.canAfford(10),
      execute: () => {
        const cost = ctx.timeline.randomFloat(8, 12);
        const roundedCost = Math.round(cost * 100) / 100;
        if (!ctx.state.spendMoney(roundedCost)) return 'Not enough. You put it back.';
        ctx.state.set('has_umbrella', true);
        ctx.state.advanceTime(ctx.timeline.randomInt(3, 5));
        ctx.state.glanceMoney();

        const money = ctx.state.moneyTier();
        const weather = ctx.state.get('weather');

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'A compact one, folds down small. You put it in your bag.' },
          { weight: 1, value: 'You find one near the register. Nylon, folding. You pay.' },
          { weight: weather === 'drizzle' ? 1.2 : 0, value: 'You open it before you\'re even out the door. The rain on nylon — a different kind of outside.' },
          { weight: (money === 'scraping' || money === 'tight') ? 0.8 : 0, value: 'You check the price twice. You need it more than you don\'t.' },
        ]);
      },
    },

    buy_period_supplies: {
      id: 'buy_period_supplies',
      label: 'Period supplies',
      location: 'corner_store',
      // Only visible for characters with a uterus.
      // needs_period_supplies is set when supplies run out during menstrual phase.
      available: () => ctx.body.hasUterus() && ctx.state.canAfford(8),
      execute: () => {
        const cost = ctx.timeline.randomFloat(6, 10);
        const roundedCost = Math.round(cost * 100) / 100;
        if (!ctx.state.spendMoney(roundedCost)) return 'Not enough. You put it back.';
        // Approximation debt (consumables): pack size 20 for a typical corner-store pack.
        // Some stores carry smaller travel packs (~10); randomizing covers both.
        ctx.state.set('period_supply_count', ctx.state.get('period_supply_count') + ctx.timeline.randomInt(10, 20));
        if (ctx.state.get('needs_period_supplies')) {
          ctx.state.set('needs_period_supplies', false);
          ctx.state.adjustStress(-4);
        }
        ctx.state.advanceTime(ctx.timeline.randomInt(3, 5));
        ctx.state.glanceMoney();

        const money = ctx.state.moneyTier();

        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You find them in the health aisle. You pay and put the pack in your bag.' },
          { weight: 1, value: 'The pack is overpriced for what it is. You buy it anyway.' },
          { weight: (money === 'scraping' || money === 'tight') ? 1.0 : 0, value: 'Not cheap. Not an option to skip. You pay.' },
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
        if (ctx.events.any('ate_at_soup_kitchen', ctx.state.get('wake_period_start'))) return false;
        const hour = ctx.state.getHour();
        return hour >= 11 && hour < 14 && ctx.state.isWorkday();
      },
      execute: () => {
        ctx.state.adjustHunger(-45);
        ctx.state.fillStomach(80, 'mixed');

        ctx.state.set('consecutive_meals_skipped', 0);
        ctx.state.set('soup_kitchen_visits', ctx.state.get('soup_kitchen_visits') + 1);
        ctx.state.advanceTime(25);
        ctx.events.record('ate', { what: 'soup_kitchen' });
        ctx.events.record('ate_at_soup_kitchen');

        const visits = ctx.state.get('soup_kitchen_visits'); // already incremented
        const mood = ctx.state.moodTone();
        const hunger = ctx.state.hungerTier();
        const ser = ctx.state.get('serotonin');
        const recog = ctx.state.locationVisitTier('soup_kitchen');

        // First visit
        if (visits === 1) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You go through the line. Someone hands you a plate. You sit down and you eat. Nobody looks at you twice. The food is hot and there is enough of it.' },
            { weight: 1, value: 'A plate. A seat at a long table. The food is simple, institutional, warm. You eat all of it.' },
            { weight: ctx.state.lerp01(ser, 50, 20), value: 'You take a tray and sit and eat. Around you people do the same. The food is fine. You don\'t have to think about anything except eating.' },
          ]);
        }

        // Subsequent visits — deterministic recognition suffix (layer 3, no RNG)
        // At a soup kitchen, being a regular is different. It's not comfortable. It's just the truth.
        const recognitionSuffix = recog === 'regular'
          ? ' The volunteer who ladles the soup doesn\'t say anything. She just hands you the bowl. You\'ve been here enough that nothing needs explaining.'
          : recog === 'familiar'
            ? ' The volunteer looks up when you come in. A small recognition. Not warmth, exactly — just that she\'s seen your face.'
            : '';

        if (mood === 'hollow' || mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'Through the line. A plate. You eat. Same as before.' },
            { weight: ctx.state.lerp01(ser, 50, 25), value: 'You know the routine now. Tray, line, table. You eat without tasting much. Your body gets what it needed.' },
          ]) + recognitionSuffix;
        }
        if (hunger === 'starving' || hunger === 'very_hungry') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You\'ve been here before. You go through the line, you sit, and you eat faster than you mean to. The food is hot. That\'s enough.' },
            { weight: ctx.state.lerp01('adenosine', 50, 75) * ctx.state.adenosineBlock(), value: 'Through the line, a seat, and then you eat. Your hands settle once there\'s a plate in front of them.' },
          ]) + recognitionSuffix;
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'The usual. A plate, a seat, a meal. You know the rhythm now. You eat and watch the room and then you leave.' },
          { weight: 1, value: 'You go through the line. Eat. A plate of whatever they have today. It\'s enough.' },
          { weight: ctx.state.lerp01(ser, 60, 35), value: 'A plate of food and a seat. You eat it. There\'s something almost comfortable about the routine of it now, if you don\'t examine it too closely.' },
        ]) + recognitionSuffix;
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

        // Personal care items — ~40% chance the bag includes hygiene supplies.
        // Approximation debt (corner store): 0.4 probability chosen; real availability varies by
        // location, week, and donation flow. 5 uses: donated/sample sizes, not full tubes.
        // RNG call is always consumed to preserve replay balance.
        const gotHygiene = ctx.timeline.chance(0.4);
        if (gotHygiene) {
          ctx.state.set('moisturizer_count', ctx.state.get('moisturizer_count') + 5);
        }

        const visits = ctx.state.get('food_bank_visits');
        const mood = ctx.state.moodTone();
        const ser = ctx.state.get('serotonin');
        const skinNeedsMoisturizer = !['healthy'].includes(ctx.state.skinConditionTier());
        const recog = ctx.state.locationVisitTier('food_bank');

        // Deterministic hygiene suffix — noted when included, more prominent when skin is bad
        const hygieneSuffix = gotHygiene
          ? (skinNeedsMoisturizer ? ' There\'s a small tube of lotion in there too. You notice it.' : ' A few personal care items tucked in.')
          : '';

        // Recognition suffix — deterministic (layer 3, no RNG)
        // Staff knows your face. The paperwork goes faster. That's it.
        const recognitionSuffix = recog === 'regular'
          ? ' The staff member at the desk finds your record without asking. The wait is shorter.'
          : recog === 'familiar'
            ? ' The volunteer glances at you and reaches for the sign-in sheet before you ask.'
            : '';

        if (visits === 1) {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You wait. A volunteer calls your name, or a number, and hands you a bag. Canned goods, bread, whatever they have this week. You carry it home.' },
            { weight: 1, value: 'You sign in and you wait and eventually someone brings a bag out. It\'s heavier than you expected. You take it and go.' },
            { weight: ctx.state.lerp01(ser, 50, 25), value: 'You wait in a plastic chair until they call you. A bag: bread, a few cans, some pasta. Enough. You walk out carrying it and you don\'t look at anyone.' },
          ]) + hygieneSuffix;
        }

        if (mood === 'hollow' || mood === 'numb') {
          return ctx.timeline.weightedPick([
            { weight: 1, value: 'You wait, you get the bag, you leave. Same as before.' },
            { weight: ctx.state.lerp01(ser, 50, 20), value: 'The wait. The bag. You carry it home. It has what it has.' },
          ]) + recognitionSuffix + hygieneSuffix;
        }
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You know the wait by now. When your name comes, you go up and take the bag. Bread, cans, whatever they had. You carry it home.' },
          { weight: 1, value: 'The usual wait, the usual bag. Heavier some weeks than others. This week it\'s decent.' },
          { weight: ctx.state.lerp01(ser, 60, 35), value: 'You sit and wait and get the bag. There\'s a rhythm to it now — not comfortable exactly, but known. You carry it home.' },
        ]) + recognitionSuffix + hygieneSuffix;
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
        if (ctx.state.batteryTier() === 'dead') {
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
            ctx.state.adjustSocial(3); // Approximation debt (social depth): +3 social chosen
            ctx.state.adjustConnectionDepth(5); // Approximation debt (social depth): +5 chosen; reading without replying is weaker reciprocal signal
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
        if (ctx.state.batteryTier() === 'dead') {
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
        ctx.state.set('phone_note_index', null);
        const location = ctx.world.getLocationId();
        const descFn = /** @type {Record<string, (() => string) | undefined>} */ (locationDescriptions)[location];
        return descFn ? descFn() : '';
      },
    },

    // --- Notes app ---

    open_notes_app: {
      id: 'open_notes_app',
      label: 'Notes',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        // Only show on home screen — navigation within notes is handled by phone UI
        return ctx.state.get('phone_screen') === 'home';
      },
      execute: () => {
        if (ctx.state.batteryTier() === 'dead') {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        ctx.state.set('phone_screen', 'notes');
        ctx.state.adjustBattery(-1);
        return '';
      },
    },

    // --- Calendar app ---

    open_calendar_app: {
      id: 'open_calendar_app',
      label: 'Calendar',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        // Only show on home screen — navigation within calendar is handled by phone UI
        return ctx.state.get('phone_screen') === 'home';
      },
      execute: () => {
        if (ctx.state.batteryTier() === 'dead') {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        ctx.state.set('phone_screen', 'calendar');
        ctx.state.adjustBattery(-1);
        return '';
      },
    },

    // --- Alarm app ---

    open_alarm_app: {
      id: 'open_alarm_app',
      label: 'Alarm',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        // Only show on home screen — navigation within alarm app is handled by phone UI
        return ctx.state.get('phone_screen') === 'home';
      },
      execute: () => {
        if (ctx.state.batteryTier() === 'dead') {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        ctx.state.set('phone_screen', 'alarms');
        ctx.state.adjustBattery(-1);
        return '';
      },
    },

    cancel_alarm_app: {
      id: 'cancel_alarm_app',
      label: 'Cancel alarm',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        return ctx.state.get('phone_screen') === 'alarms' && ctx.state.hasInterrupt('wake_alarm');
      },
      execute: () => {
        if (ctx.state.batteryTier() === 'dead') {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        ctx.state.cancelInterrupt('wake_alarm');
        ctx.state.advanceTime(1);
        ctx.state.adjustBattery(-1);
        return '';
      },
    },

    write_note: {
      id: 'write_note',
      label: 'New note',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        return ctx.state.get('phone_screen') === 'notes';
      },
      execute: (data = {}) => {
        if (ctx.state.batteryTier() === 'dead') {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        const text = (data.text || '').trim();
        if (!text) return '';
        const notes = ctx.state.get('notes');
        notes.push({ text, timestamp: ctx.state.get('time') });
        ctx.state.advanceTime(2);
        ctx.state.adjustBattery(-1);
        // Deterministic reading — 0 RNG consumed
        return '';
      },
    },

    read_note: {
      id: 'read_note',
      label: 'Note',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        const screen = ctx.state.get('phone_screen');
        if (screen !== 'note_view') return false;
        const idx = ctx.state.get('phone_note_index');
        if (idx === null || idx === undefined) return false;
        const notes = ctx.state.get('notes');
        return idx >= 0 && idx < notes.length;
      },
      execute: (data = {}) => {
        if (ctx.state.batteryTier() === 'dead') {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        const notes = ctx.state.get('notes');
        const idx = data.index !== undefined ? data.index : ctx.state.get('phone_note_index');
        if (idx === null || idx === undefined || idx < 0 || idx >= notes.length) return '';
        ctx.state.set('phone_note_index', idx);
        ctx.state.set('phone_screen', 'note_view');
        ctx.state.adjustBattery(-1);

        // NT-shaded reading prose — deterministic (no RNG), appended below the note
        const aden = ctx.state.get('adenosine');
        const ser = ctx.state.get('serotonin');
        const note = notes[idx];
        const age = ctx.state.get('time') - note.timestamp; // minutes since written
        const isOld = age > 60 * 24; // older than a day

        let shade = '';
        if (aden > 65 && ctx.state.adenosineBlock() > 0.5) {
          shade = isOld
            ? 'The words take a second to land. Like reading through water.'
            : 'You wrote this. You remember writing it. Barely.';
        } else if (ser < 30 && isOld) {
          shade = 'The handwriting — the voice of it — sits heavier than it should.';
        } else if (ser < 45 && isOld) {
          shade = 'You read it. The person who wrote it was you, which makes sense and also doesn\'t.';
        }

        return shade ? `\n\n${shade}` : '';
      },
    },

    watch_content: {
      id: 'watch_content',
      label: 'Watch something',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        // Only at home — consuming content is a home activity
        return ctx.world.getLocationId().startsWith('apartment');
      },
      execute: () => {
        if (ctx.state.batteryTier() === 'dead') {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }

        const depthTier = ctx.state.connectionDepthTier();

        // 1 RNG call: prose selection per connection depth tier
        /** @type {{ weight: number, value: string }[]} */
        const prosePool = depthTier === 'hollow' ? [
          { weight: 1, value: 'The stream ends. The room goes back to being the room. The warmth was real while it was happening — you know that. It just wasn\'t yours.' },
          { weight: 1, value: 'You close the app. The quiet is specific. For a while there was something adjacent to company. Now it\'s just after.' },
          { weight: 1, value: 'Forty-five minutes of someone\'s voice. It was good. Then it was over and you were back.' },
        ] : depthTier === 'surface' ? [
          { weight: 1, value: 'You watch someone be in their day. Yours is here too, still. The two things are separate in a way you don\'t dwell on.' },
          { weight: 1, value: 'It was fine. There was a pleasant quality to having a voice in the room. A slight gap at the end when it stopped, but not a large one.' },
          { weight: 1, value: 'You were somewhere else for a while, in the way of watching. It was enough for now.' },
        ] : [
          // deep or present
          { weight: 1, value: 'You watch for a while. The presence is comfortable — one-sided in a way that doesn\'t need fixing right now.' },
          { weight: 1, value: 'Forty-five minutes of someone else\'s voice. It was good. That\'s the whole thing.' },
          { weight: 1, value: 'You weren\'t alone in the usual way. That counts for something.' },
        ];
        const prose = ctx.timeline.weightedPick(prosePool);

        // Slight social buffer — parasocial presence registers as non-isolation
        ctx.state.adjustSocial(2); // Approximation debt (social depth): +2 chosen; parasocial buffers, doesn't nourish
        // Does NOT call adjustConnectionDepth — one-directional contact doesn't build reciprocal depth

        // Screen stimulation slight alerting effect — suppresses sleepiness briefly
        // Approximation debt (melatonin): primary mechanism is melatonin suppression (blue light), not adenosine reduction.
        // Modeled as small adenosine reduction for simplicity; -3 chosen.
        ctx.state.adjustNT('adenosine', -3);

        ctx.state.advanceTime(45);
        ctx.state.adjustBattery(-8); // Approximation debt (phone battery): -8 for 45 min screen time; rate chosen

        return prose || '';
      },
    },

    reply_to_friend: {
      id: 'reply_to_friend',
      label: 'Reply',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        const thread = ctx.state.get('phone_thread_contact');
        if (!thread || !['friend1', 'friend2'].includes(thread)) return false;
        const inbox = ctx.state.get('phone_inbox');
        if (!inbox.some(m => m.source === thread && !m.read)) return false;
        const pending = ctx.state.get('pending_replies') || [];
        if (pending.some(r => r.slot === thread)) return false;
        return true;
      },
      execute: () => {
        if (ctx.state.batteryTier() === 'dead') {
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
        ctx.state.adjustSocial(3); // Approximation debt (social depth): +3 social chosen
        ctx.state.adjustConnectionDepth(15); // Approximation debt (social depth): +15 chosen; replying is the strongest reciprocal signal

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
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        const thread = ctx.state.get('phone_thread_contact');
        if (!thread || !['friend1', 'friend2'].includes(thread)) return false;
        const inbox = ctx.state.get('phone_inbox');
        if (inbox.some(m => m.source === thread && !m.read)) return false; // has unread → use reply
        const pending = ctx.state.get('pending_replies') || [];
        if (pending.some(r => r.slot === thread)) return false;
        // Low-guilt + longing case → reach_out_to_friend handles it with different prose
        const guilt = ctx.state.sentimentIntensity(thread, 'guilt');
        const social = ctx.state.socialTier();
        if (guilt < 0.06 && ['isolated', 'withdrawn', 'neutral'].includes(social)
            && ctx.state.socialEnergyTier() !== 'drained') return false;
        return true;
      },
      execute: () => {
        if (ctx.state.batteryTier() === 'dead') {
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
        ctx.state.adjustSocial(2); // Approximation debt (social depth): +2 social chosen
        ctx.state.adjustConnectionDepth(12); // Approximation debt (social depth): +12 chosen; initiating is strong reciprocal signal, slightly less than replying

        ctx.state.advanceTime(5);
        ctx.state.adjustBattery(-1);

        return initiateText;
      },
    },

    reach_out_to_friend: {
      id: 'reach_out_to_friend',
      label: 'Write',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        const thread = ctx.state.get('phone_thread_contact');
        if (!thread || !['friend1', 'friend2'].includes(thread)) return false;
        const inbox = ctx.state.get('phone_inbox');
        if (inbox.some(m => m.source === thread && !m.read)) return false; // has unread → use reply
        const pending = ctx.state.get('pending_replies') || [];
        if (pending.some(r => r.slot === thread)) return false;
        // Only in the low-guilt, longing-not-desperate range — this is affection, not obligation
        const guilt = ctx.state.sentimentIntensity(thread, 'guilt');
        if (guilt >= 0.06) return false;
        const social = ctx.state.socialTier();
        if (!['isolated', 'withdrawn', 'neutral'].includes(social)) return false;
        if (ctx.state.socialEnergyTier() === 'drained') return false;
        return true;
      },
      execute: () => {
        if (ctx.state.batteryTier() === 'dead') {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }
        const target = getInitiateTarget();
        if (!target) return '';
        const { slot, friend } = target;

        // 1 RNG call: proactive reach-out prose
        const reachText = friendProactiveReachProse[friend.flavor](friend.name);
        // 1 RNG call: friend's response (generated now, delivered later)
        const responseText = friendProactiveReachMessages[friend.flavor](friend.name);
        // 1 RNG call: arrival delay
        const delay = ctx.timeline.randomInt(30, 90);
        ctx.state.addPendingReply({ slot, arrivesAt: ctx.state.get('time') + delay, text: responseText });

        // Store sent message in inbox for thread view
        ctx.state.addPhoneMessage({ type: 'sent', source: slot, text: reachText, read: true, direction: 'sent' });

        // Reset contact timer, reduce guilt (even low guilt clears on contact)
        const fc = ctx.state.get('friend_contact');
        fc[slot] = ctx.state.get('time');
        ctx.state.adjustSentiment(slot, 'guilt', -0.06);
        ctx.state.adjustSocial(2); // Approximation debt (social depth): +2 social chosen
        ctx.state.adjustConnectionDepth(12); // Approximation debt (social depth): +12 chosen; proactive reach-out is strong reciprocal signal

        ctx.state.advanceTime(5);
        ctx.state.adjustBattery(-1);

        return reachText;
      },
    },

    help_friend: {
      id: 'help_friend',
      label: 'Help',
      location: null,
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
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
        if (ctx.state.batteryTier() === 'dead') {
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
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
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
        if (ctx.state.batteryTier() === 'dead') {
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

    // --- Bill choice interactions ---
    // Surface when a bill is due and money is insufficient. The player chooses to pay or skip.
    // location: null — available anywhere; availability gate checks pending_bills.
    // No RNG consumed — these are decisions, not draws.

    pay_bill_rent: {
      id: 'pay_bill_rent',
      label: 'Pay rent',
      location: null,
      available: () => {
        if (ctx.state.get('viewing_phone')) return false;
        const pending = ctx.state.get('pending_bills') || [];
        const bill = pending.find(b => b.name === 'rent');
        // Only show the pay option when the player can actually afford it
        return !!(bill && ctx.state.get('money') >= bill.amount);
      },
      execute: () => {
        const pending = ctx.state.get('pending_bills') || [];
        const bill = pending.find(b => b.name === 'rent');
        if (!bill) return '';
        ctx.state.payBill('rent', bill.amount);
        const money = ctx.state.get('money');
        const balText = money < 10
          ? 'Almost nothing left.'
          : money < 50
            ? 'Under fifty dollars left.'
            : 'What\u2019s left goes back into the account.';
        return 'Rent goes through. ' + balText;
      },
    },

    skip_bill_rent: {
      id: 'skip_bill_rent',
      label: 'Skip rent this month',
      location: null,
      available: () => {
        if (ctx.state.get('viewing_phone')) return false;
        const pending = ctx.state.get('pending_bills') || [];
        return pending.some(b => b.name === 'rent');
      },
      execute: () => {
        ctx.state.failBill('rent');
        return 'The due date passes. Rent doesn\u2019t go through.';
      },
    },

    pay_bill_utilities: {
      id: 'pay_bill_utilities',
      label: 'Pay utilities',
      location: null,
      available: () => {
        if (ctx.state.get('viewing_phone')) return false;
        const pending = ctx.state.get('pending_bills') || [];
        const bill = pending.find(b => b.name === 'utilities');
        return !!(bill && ctx.state.get('money') >= bill.amount);
      },
      execute: () => {
        const pending = ctx.state.get('pending_bills') || [];
        const bill = pending.find(b => b.name === 'utilities');
        if (!bill) return '';
        ctx.state.payBill('utilities', bill.amount);
        return 'Utilities paid. The lights stay on.';
      },
    },

    skip_bill_utilities: {
      id: 'skip_bill_utilities',
      label: 'Skip utilities this month',
      location: null,
      available: () => {
        if (ctx.state.get('viewing_phone')) return false;
        const pending = ctx.state.get('pending_bills') || [];
        return pending.some(b => b.name === 'utilities');
      },
      execute: () => {
        ctx.state.failBill('utilities');
        return 'The bill goes unpaid.';
      },
    },

    pay_bill_phone: {
      id: 'pay_bill_phone',
      label: 'Pay phone bill',
      location: null,
      available: () => {
        if (ctx.state.get('viewing_phone')) return false;
        const pending = ctx.state.get('pending_bills') || [];
        const bill = pending.find(b => b.name === 'phone');
        return !!(bill && ctx.state.get('money') >= bill.amount);
      },
      execute: () => {
        const pending = ctx.state.get('pending_bills') || [];
        const bill = pending.find(b => b.name === 'phone');
        if (!bill) return '';
        ctx.state.payBill('phone', bill.amount);
        return 'Phone bill paid. Still connected.';
      },
    },

    skip_bill_phone: {
      id: 'skip_bill_phone',
      label: 'Skip phone bill this month',
      location: null,
      available: () => {
        if (ctx.state.get('viewing_phone')) return false;
        const pending = ctx.state.get('pending_bills') || [];
        return pending.some(b => b.name === 'phone');
      },
      execute: () => {
        ctx.state.failBill('phone');
        return 'The bill goes unpaid.';
      },
    },

    breathwork_app: {
      id: 'breathwork_app',
      label: 'Breathwork',
      location: null, // phone mode; availability gate below
      available: () => {
        if (!ctx.state.get('viewing_phone') || ctx.state.batteryTier() === 'dead') return false;
        // App-guided: only makes sense at home (apartment area)
        const area = ctx.world.getCurrentLocation()?.area;
        return area === 'apartment';
      },
      execute: () => {
        if (ctx.state.batteryTier() === 'dead') {
          ctx.state.set('viewing_phone', false);
          return 'The screen goes dark. Dead.';
        }

        const ne = ctx.state.get('norepinephrine');
        const gaba = ctx.state.get('gaba');
        const aden = ctx.state.get('adenosine');
        const energy = ctx.state.energyTier();

        // +2 min vs. unguided: setup overhead, following prompts
        const minutes = ctx.timeline.randomInt(7, 12);
        ctx.state.advanceTime(minutes);
        ctx.state.adjustBattery(-2); // Approximation debt (phone battery): -2 for ~10 min guided; rate chosen

        // Same state-dependent modulation as unguided
        const resistant = ne > 70 || gaba < 30;
        const drifting = ['depleted', 'exhausted'].includes(energy) || (aden > 70 && ctx.state.adenosineBlock() > 0.4);

        let effectMult = 1.0;
        if (resistant) effectMult *= 0.7; // Approximation debt (mindfulness): same 0.7 as unguided; app scaffolding doesn't overcome physiological resistance
        if (drifting) effectMult *= 0.5;  // Approximation debt (mindfulness): same 0.5 drift penalty

        // NT effects: same as unguided — app guidance doesn't substantially change single-session magnitude.
        // Refs: Streeter 2010 PMID 20834562, Hölzel 2011 PMID 21071182, Pascoe 2017 PMID 28863392,
        // Tang 2015 PMID 26242681, Jacobs 2004 PMID 14699316.
        // Approximation debt (mindfulness): +8/−10/−5/+3 nudges same as unguided; guidance vs. unguided difference unquantified at single-session scale
        ctx.state.adjustNT('gaba', 8 * effectMult);
        ctx.state.adjustNT('cortisol', -10 * effectMult);
        ctx.state.adjustNT('norepinephrine', -5 * effectMult);
        ctx.state.adjustNT('serotonin', 3 * effectMult);

        if (!resistant) {
          ctx.state.adjustStress(-2);
        }

        // Put phone down after practice — phone was the tool, not the destination
        ctx.state.set('viewing_phone', false);
        ctx.state.set('phone_screen', 'home');
        ctx.state.set('phone_thread_contact', null);
        ctx.state.set('phone_note_index', null);

        // Prose — 1 RNG call, always. App-guided variant acknowledges the prompt/screen texture.
        const ser = ctx.state.get('serotonin');
        const cort = ctx.state.get('cortisol');
        return ctx.timeline.weightedPick([
          // Baseline — guidance helps you stay with it
          { weight: 1, value: 'The app counts. Breathe in, hold, out. You follow the numbers. Somewhere in the second minute the counting stops being the point and you\'re just breathing. Your shoulders drop. Something loosens.' },
          { weight: 1, value: 'You follow the prompts — the visual, the timer. It gives you something to hold onto while the breath does the actual work. Around the third cycle, something behind your chest softens.' },
          { weight: 1, value: 'Guided breath. You let the app lead. The inhale, the hold, the release. A few minutes of being told what to do with your body, which turns out to be restful in its own way.' },
          // High NE / low GABA — resistance, but guidance provides scaffolding
          { weight: ctx.state.lerp01(ne, 60, 80), value: 'The usual pull toward the next thing. The app keeps counting. You breathe anyway — it takes longer to get anywhere, but the structure helps. You have something to return to when you drift.' },
          { weight: ctx.state.lerp01(gaba, 38, 20), value: 'The thing underneath doesn\'t want to settle. The guided count helps more than silence would — gives you a handrail. You follow it back, again, again.' },
          // Depleted / adenosine drift
          { weight: ctx.state.lerp01(aden, 55, 80) * ctx.state.adenosineBlock(), value: 'The prompts come. Inhale. You mostly just float along with them. The practice becomes something softer than practice. That\'s fine too.' },
          { weight: drifting ? 1 : 0, value: 'You follow the numbers until you don\'t. The phone does its thing. You\'re somewhere between breathing and drifting. The quiet is real even if the practice is approximate.' },
          // Clear state — genuine settledness
          { weight: ctx.state.lerp01(ser, 50, 70), value: 'The app leads, you follow. A few minutes of being somewhere specific — not scrolling, not waiting. Just the count. You put the phone down and the room is a little more itself.' },
          // High cortisol — body tension released
          { weight: ctx.state.lerp01(cort, 60, 85), value: 'The guidance catches things you weren\'t attending to. The breath slows. Your jaw. Your hands. Each release takes something with it. You put the phone down feeling slightly more assembled.' },
        ]);
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
    const wps = ctx.state.get('wake_period_start');
    if (minutesLate >= 30 && !ctx.events.any('arrived_at_work', wps) && !ctx.events.any('called_in_sick', wps) && !ctx.events.any('work_nagged', wps)) {
      ctx.events.record('work_nagged');
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
      const wps = ctx.state.get('wake_period_start');
      return ctx.state.get('has_phone') && ctx.state.batteryTier() !== 'dead' && ctx.state.batteryTier() !== 'critical'
        && !ctx.events.any('arrived_at_work', wps) && !ctx.events.any('called_in_sick', wps)
        && ctx.state.isWorkHours() && ctx.state.getHour() < 12;
    },
    execute: () => {
      ctx.state.adjustJobStanding(-8); // Approximation debt (job standing): -8 for calling in chosen
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
      const noticed = ctx.events.last('late_anxiety_noticed');
      const tier = noticed?.data?.tier ?? null;
      if (tier === 'very_late') {
        return 'The time. It\'s still there, pressing against the inside of your ribs. You know. You already know.';
      }
      return 'You\'re aware of the time. The kind of awareness that sits in your chest.';
    },

    time_to_leave: () => {
      const energy = ctx.state.energyTier();
      const stress = ctx.state.stressTier();
      const aden = ctx.state.get('adenosine');
      const ser = ctx.state.get('serotonin');
      if (energy === 'depleted' || energy === 'exhausted') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'You should go. You know you should go. Your body hasn\'t gotten the message yet.' },
          { weight: 1, value: 'Time to leave. The words form slowly. Your feet aren\'t convinced.' },
          { weight: ctx.state.lerp01(aden, 40, 75), value: 'You have to go. The thought arrives through cotton. You have to go.' },
        ]);
      }
      if (stress === 'strained' || stress === 'overwhelmed') {
        return ctx.timeline.weightedPick([
          { weight: 1, value: 'Time. You need to leave now. The thought tightens something in your chest.' },
          { weight: 1, value: 'You should be moving. The clock says so. Your body knows.' },
          { weight: ctx.state.lerp01(ser, 50, 25), value: 'You have to go. The day hasn\'t started and already you\'re running.' },
        ]);
      }
      return ctx.timeline.weightedPick([
        { weight: 1, value: 'Time to go. You register it the way you register weather — just a fact.' },
        { weight: 1, value: 'You should be leaving. The thought arrives cleanly. Okay.' },
        { weight: ctx.state.lerp01(ser, 50, 70), value: 'Time to head out. There\'s something almost fine about it this morning — the routine, the motion. You get up.' },
      ]);
    },

    schedule_reveal: () => {
      // Fired when a schedule_reveal interrupt populates tomorrow's shift.
      // Adds a phone notification — player sees it when they check their phone.
      // Approximation debt (work scheduling): always a shift (probability model not yet implemented).
      ctx.state.get('phone_inbox').push({
        type: 'notification',
        read: false,
        source: 'supervisor',
        text: `You're on tomorrow.`,
        timestamp: ctx.state.get('time'),
      });
      return '';  // No inline prose — player finds out when they check their phone.
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
      const ageStage = ctx.state.ageStageTier();

      if (tier === 'depleted') {
        // Age-stage shading — deterministic modifier (layer 3, no RNG).
        if (ageStage === 'young_adult') {
          return 'Your body is making its case. You weren\'t ready for this. You keep not being ready for this.';
        }
        if (ageStage === 'midlife') {
          return 'Your body is making its case. It\'s been making it for years. You negotiate.';
        }
        if (ageStage === 'older') {
          return 'Your body is making its case. You\'ve stopped arguing with it.';
        }
        return 'Your body is making its case. The argument is getting harder to ignore.';
      }
      // exhausted
      if (ageStage === 'young_adult') {
        return 'For a second everything feels heavy. Not just your body — the air, the light, the idea of doing the next thing. Like being tired is something that\'s happening to someone else and you\'re watching.';
      }
      if (ageStage === 'midlife') {
        return 'For a second everything feels heavy. The body doing what it does. You push through because you know how.';
      }
      return 'For a second everything feels heavy. Not just your body — the air, the light, the idea of doing the next thing.';
    },

    vasovagal_prodrome: () => {
      const location = ctx.world.getLocationId();
      if (location === 'workplace') {
        return 'The fluorescent hum is louder for a second, or you\'re hearing it differently. The edges of your vision pull inward. You find something solid to put your hand on.';
      }
      return 'The floor stays where it is. The air around it doesn\'t, for a moment. Light at the edges of your vision grays out and comes back. You reach for something.';
    },

    vasovagal_episode: () => {
      const location = ctx.world.getLocationId();
      if (location === 'workplace') {
        return 'Then the floor comes up. You didn\'t decide to sit. A coworker is saying something but the words are arriving from somewhere else. Your heart, which nearly stopped a moment ago, is now going too fast — which is the wrong response, which your body knows, which it does anyway.';
      }
      return 'Then the floor. You don\'t remember the going-down. The ceiling is different from here. Your hands are on tile or carpet and your heart is going very fast, which is wrong — a moment ago it had almost stopped.';
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
      const appearance = ctx.state.appearanceAwareness();
      // Appearance reduces social gain — being addressed when you feel off reduces how much the
      // contact lands. Approximation debt (appearance): -1 social at notable, -2 at severe chosen.
      const socialGain = appearance === 'severe' ? 1 : appearance === 'notable' ? 2 : 3;
      ctx.state.adjustSocial(socialGain); // Approximation debt (social depth): +3 social baseline chosen
      // Connection depth also diminished — being seen when you feel unseen-in-the-wrong-way
      // is not nourishing. Approximation debt (appearance): depth 0 at severe, 1 at notable chosen.
      const depthGain = appearance === 'severe' ? 0 : appearance === 'notable' ? 1 : 2;
      ctx.state.adjustConnectionDepth(depthGain); // Approximation debt (social depth): +2 baseline chosen

      const isFirst = ctx.timeline.chance(0.5);
      const slot = isFirst ? 'coworker1' : 'coworker2';
      const coworker = ctx.character.get(slot);

      // Involuntary exposure builds smaller sentiment than chosen interaction
      // Cross-reduction: even involuntary good moments gently challenge irritation, and vice versa
      // At notable/severe appearance the involuntary contact tips toward irritation regardless of mood —
      // the discomfort of being addressed when you're already self-conscious.
      const mood = ctx.state.moodTone();
      if (appearance === 'severe' || appearance === 'notable') {
        ctx.state.adjustSentiment(slot, 'irritation', 0.01);
        ctx.state.adjustSentiment(slot, 'warmth', -0.003);
        // Self-consciousness on being addressed — smaller NE signal than initiated contact,
        // but still present. Approximation debt (appearance): NE +2 chosen.
        ctx.state.adjustNT('norepinephrine', 2); // Approximation debt (appearance):
      } else if (mood === 'fraying' || mood === 'numb' || mood === 'heavy') {
        ctx.state.adjustSentiment(slot, 'irritation', 0.01);
        ctx.state.adjustSentiment(slot, 'warmth', -0.003);
      } else {
        ctx.state.adjustSentiment(slot, 'warmth', 0.008);
        ctx.state.adjustSentiment(slot, 'irritation', -0.003);
      }

      return /** @type {(name: string) => string | undefined} */ (coworkerChatter[coworker.flavor])(coworker.name);
    },

    // Coworker checks in after absence — fires when warmth is above neutral and no coworker
    // interaction has happened for ≥2 work days. 2 RNG calls (slot pick + prose pick).
    coworker_notices_absence: () => {
      // Social gain: being noticed by someone who cares. Small but real.
      ctx.state.adjustSocial(2);
      ctx.state.adjustConnectionDepth(1); // Approximation debt (social depth): +1 baseline chosen
      // Being seen nudges serotonin — brief warmth signal
      ctx.state.adjustNT('serotonin', 3); // Approximation debt (NT coupling): +3 serotonin for being noticed chosen
      const isFirst = ctx.timeline.chance(0.5); // RNG call 1: slot selection (balanced)
      const slot = isFirst ? 'coworker1' : 'coworker2';
      const coworker = ctx.character.get(slot);
      // Warmth grows slightly — they reached out
      ctx.state.adjustSentiment(slot, 'warmth', 0.01);
      ctx.events.record('coworker_notices', { slot, variant: 'absence' });
      const proseFn = coworkerNoticesAbsenceProse[coworker.flavor] || coworkerNoticesAbsenceProse.warm_quiet;
      return proseFn(coworker.name); // RNG call 2: prose pick (inside proseFn)
    },

    // Coworker notices player is struggling — fires when stress is strained/overwhelmed at work.
    // Separate from absence trigger. 2 RNG calls (slot pick + prose pick).
    coworker_notices_stress: () => {
      // Being seen when struggling — serotonin nudge, whether it helps depends on state
      ctx.state.adjustSocial(2);
      ctx.state.adjustConnectionDepth(1); // Approximation debt (social depth): +1 baseline chosen
      ctx.state.adjustNT('serotonin', 3); // Approximation debt (NT coupling): +3 serotonin for being seen chosen
      const isFirst = ctx.timeline.chance(0.5); // RNG call 1: slot selection (balanced)
      const slot = isFirst ? 'coworker1' : 'coworker2';
      const coworker = ctx.character.get(slot);
      ctx.state.adjustSentiment(slot, 'warmth', 0.008);
      ctx.events.record('coworker_notices', { slot, variant: 'stress' });
      const proseFn = coworkerNoticesStressProse[coworker.flavor] || coworkerNoticesStressProse.warm_quiet;
      return proseFn(coworker.name); // RNG call 2: prose pick (inside proseFn)
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
        // stomach_fullness already reduced above — no separate ate_today flag needed
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

    bill_due_rent: () => {
      // No RNG consumed — deterministic. Money is world state the character knows precisely.
      const pending = ctx.state.get('pending_bills') || [];
      const bill = pending.find(b => b.name === 'rent');
      if (!bill) return '';
      ctx.state.observeMoney(); // checking the bank account is a full observation
      const money = ctx.state.get('money');
      const moneyStr = ctx.state.perceivedMoneyString();
      const mood = ctx.state.moodTone();
      const moodSuffix = (mood === 'heavy' || mood === 'hollow')
        ? ' The number sits there.'
        : mood === 'fraying'
          ? ' Your chest does something when you see it.'
          : '';
      const notEnough = money < bill.amount * 0.5
        ? ' Not close.'
        : money < bill.amount
          ? ' Not enough.'
          : '';
      return 'Rent is due. You have ' + moneyStr + '.' + notEnough + moodSuffix;
    },

    bill_due_utilities: () => {
      // No RNG consumed — deterministic.
      const pending = ctx.state.get('pending_bills') || [];
      const bill = pending.find(b => b.name === 'utilities');
      if (!bill) return '';
      ctx.state.observeMoney();
      const money = ctx.state.get('money');
      const moneyStr = ctx.state.perceivedMoneyString();
      const notEnough = money < bill.amount * 0.5
        ? ' Not close.'
        : money < bill.amount
          ? ' Not enough.'
          : '';
      return 'Utilities are due. You have ' + moneyStr + '.' + notEnough;
    },

    bill_due_phone: () => {
      // No RNG consumed — deterministic.
      const pending = ctx.state.get('pending_bills') || [];
      const bill = pending.find(b => b.name === 'phone');
      if (!bill) return '';
      ctx.state.observeMoney();
      const money = ctx.state.get('money');
      const moneyStr = ctx.state.perceivedMoneyString();
      const notEnough = money < bill.amount * 0.5
        ? ' Not close.'
        : money < bill.amount
          ? ' Not enough.'
          : '';
      return 'Phone bill is due. You have ' + moneyStr + '.' + notEnough;
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

        // Duration-based persistence layers — how the state changes over time.
        // Uses days since last 'ate' event. Null means no recorded meal (start of run).
        const daysSinceAte = ctx.events.daysSinceLast('ate');
        const hoursWithout = daysSinceAte !== null ? daysSinceAte * 24 : null;

        // Layer B — Persisting (roughly 1–3 days without eating).
        // The body stops signaling normally. Hunger becomes background, constant.
        // Prose flattens. Quieter. The signal has been running so long it's just there.
        if (hoursWithout !== null && hoursWithout >= 24 && hoursWithout < 72) {
          thoughts.push(
            // The hunger has changed character — less acute, more ambient
            { weight: 9, value: 'The hunger doesn\'t announce itself anymore. It\'s just there. Part of the baseline.' },
            { weight: 8, value: 'You\'ve stopped thinking about it as hunger specifically. It\'s more like a condition. The weather of your body.' },
            { weight: 8, value: 'A while ago it was sharp. It isn\'t sharp now. It\'s wider than that.' },
            // The body adapts but the adaptation isn't neutral
            { weight: 7, value: 'Your body has gotten quieter about it. That\'s not reassurance. That\'s just what happens.' },
            { weight: 7, value: 'The signal has been running for so long it\'s started to feel like background noise. You don\'t trust that.' },
            // Social withdrawal — nothing to say, nowhere to be
            { weight: 6, value: 'You have no reason to go anywhere. You have no reason to contact anyone. The math just doesn\'t add up to it.' },
            { weight: 6, value: 'There\'s nothing to update anyone on. Nothing has changed. You\'re still here. That\'s the whole update.' },
            // Low serotonin deepens the flatness
            { weight: ctx.state.lerp01(ser, 40, 20) * 5, value: 'The flatness has been getting flatter. You\'re not sure there\'s a floor.' },
            { weight: ctx.state.lerp01(dop, 40, 20) * 4, value: 'You keep thinking about doing something. The thought doesn\'t develop from there.' },
          );
        }

        // Layer C — Extended (3+ days without eating).
        // Conservation mode. The body has adapted. There isn't much to think about.
        // Very sparse. Very still. Prose almost stops.
        if (hoursWithout !== null && hoursWithout >= 72) {
          thoughts.push(
            // Almost nothing
            { weight: 10, value: 'Nothing.' },
            { weight: 9, value: 'The window. The wall. The window again.' },
            // The body is very quiet now
            { weight: 9, value: 'You\'re not hungry, exactly. That word stopped fitting a while ago.' },
            { weight: 8, value: 'There\'s something still in you that used to be urgency. It\'s used itself up.' },
            // The specific stillness of extended deprivation
            { weight: 7, value: 'Your hands are very still. You look at them. They look like hands.' },
            { weight: ctx.state.lerp01(dop, 35, 15) * 6, value: 'Lying down. That\'s the thing. That\'s all there is for now.' },
          );
        }
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

    // Connection depth — the gap between parasocial warmth and genuine reciprocal contact
    // Fires when depth is low and not currently on the phone (phone use handles its own prose)
    if (!ctx.state.get('viewing_phone') && ['surface', 'hollow'].includes(ctx.state.connectionDepthTier())) {
      const depth = ctx.state.get('connection_depth');
      const deepHollow = ctx.state.lerp01(depth, 20, 0); // 0 at depth=20, 1 at depth=0
      thoughts.push(
        { weight: 1, value: 'You can have a voice in the room for hours and still feel the specific silence when it stops.' },
        { weight: 1, value: 'There is a kind of not-alone that isn\'t the same as company. You know the difference by now.' },
        { weight: 1 + deepHollow * 2, value: 'You think about who you\'d call if you were going to call someone.' },
        { weight: 1 + deepHollow * 2, value: 'The warmth was real. It just didn\'t know your name.' },
        { weight: deepHollow * 3, value: 'You\'ve been in company all day in the way that doesn\'t count. You know the way.' },
        { weight: deepHollow * 3, value: 'The gap between adjacent-to-a-life and in-contact-with-one. You\'ve been sitting in it.' },
      );
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

    // Notes — thoughts about things written or unwritten
    {
      const notes = ctx.state.get('notes') || [];
      if (notes.length > 0) {
        const lastNote = notes[notes.length - 1];
        const age = ctx.state.get('time') - lastNote.timestamp;
        const isRecent = age < 60 * 6; // within 6 hours
        const firstLine = lastNote.text.split('\n')[0].substring(0, 40);

        // Older notes — the gap between who wrote it and who's reading it
        if (!isRecent) {
          thoughts.push(
            { weight: 1.5, value: 'There are notes on your phone. You\'ve been adding to them. You don\'t remember what most of them were for.' },
            { weight: 1.5, value: 'You wrote something down so you wouldn\'t forget it. You have not thought about it since.' },
            { weight: ctx.state.lerp01(ser, 45, 25), value: 'There\'s a note from a few days ago. You almost know what it meant.' },
          );
        }
        // Recent note — the act of having just written something
        if (isRecent) {
          thoughts.push(
            { weight: 2, value: `You wrote: "${firstLine}${firstLine.length >= 40 ? '\u2026' : ''}". You're not sure it helped.` },
            { weight: 1.5, value: 'You put something down. That counts for something, even if you can\'t say what.' },
          );
        }
        // Note count accumulation — the weight of accumulated fragments
        if (notes.length >= 5) {
          thoughts.push(
            { weight: 1, value: 'Your notes app has gotten dense. You scroll it sometimes without reading.' },
          );
        }
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
      // Money fidelity — the experience of knowing-but-not-quite when finances are anxious.
      // perceivedMoneyString() returns a fidelity-appropriate string (exact, approximate, rough,
      // or qualitative) shaped by both observation distance and NT state (stress, desperation).
      if (moneyAnx > 0.1) {
        const mf = ctx.state.moneyFidelity();
        if (mf === 'rough' || mf === 'qualitative') {
          thoughts.push(
            { weight: moneyAnx * 5, value: 'You try to picture the account balance. You get a shape, not a number. Something in the vicinity of not enough.' },
            { weight: moneyAnx * 4, value: 'You haven\'t checked in a while. You know roughly. Roughly is what you have right now.' },
          );
        } else if (mf === 'approximate') {
          const approxStr = ctx.state.perceivedMoneyString();
          thoughts.push(
            { weight: moneyAnx * 3, value: 'Around something. The number is in your head but it\'s soft at the edges.' },
            { weight: moneyAnx * 2, value: `${approxStr}. Give or take. You haven\'t looked in a while.` },
          );
        } else if (mf === 'exact') {
          // Desperation sharpens: you know exactly because you've been counting.
          const exactStr = ctx.state.perceivedMoneyString();
          thoughts.push(
            { weight: moneyAnx * 4, value: `${exactStr}. You know without checking. You've been keeping track.` },
          );
        }
      }

      // Age-stage shading — how financial anxiety sits differently at different life stages.
      // The 22-year-old hasn't decided this is permanent. The 38-year-old knows better.
      if (moneyAnx > 0.1) {
        const ageStage = ctx.state.ageStageTier();
        if (ageStage === 'young_adult') {
          thoughts.push(
            { weight: moneyAnx * 3, value: 'You\'re not supposed to be here yet. This is a temporary thing. That\'s what you tell yourself.' },
            { weight: moneyAnx * 2, value: 'You didn\'t think money would be this much of the time. This much of everything.' },
          );
        } else if (ageStage === 'adult') {
          thoughts.push(
            { weight: moneyAnx * 3, value: 'You thought it would have shifted by now. It hasn\'t shifted.' },
            { weight: moneyAnx * 2, value: 'The timeline you had for this — the imagined one — doesn\'t match the actual one. It hasn\'t for a while.' },
          );
        } else if (ageStage === 'midlife') {
          thoughts.push(
            { weight: moneyAnx * 3, value: 'This is the number at this point in your life. You try not to compare it to what you expected.' },
          );
        }
      }
    }

    // Time fidelity — the experience of not quite knowing when it is.
    // perceivedTimeString() returns a fidelity-appropriate string shaped by
    // observation distance and NT state (adenosine, energy, sleep inertia).
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
        const vagueStr = ctx.state.perceivedTimeString();
        thoughts.push(
          { weight: 1 + adWeight * 2, value: 'It\'s been a while since you\'ve checked the time. You have a rough idea. Rough is fine.' },
          { weight: adWeight * 2, value: `${vagueStr.charAt(0).toUpperCase() + vagueStr.slice(1)}. Somewhere in there.` },
        );
      } else if (tf === 'rounded') {
        const roundedStr = ctx.state.perceivedTimeString();
        thoughts.push(
          { weight: adWeight * 1.5, value: `${roundedStr}, you think. You haven\'t looked recently.` },
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

    // Gastritis — the specific quality of an empty-stomach ache that's also something else
    {
      const gTier = ctx.state.gastritisTier();
      if (gTier === 'burn') {
        thoughts.push(
          { weight: 8, value: 'Below your ribs — not hunger exactly. Something underneath hunger. Sharper, and older.' },
          { weight: 7, value: 'The ache has been there since before you were awake enough to notice it. That kind of ache.' },
          { weight: 6, value: 'Your stomach is doing something that food would fix but you haven\'t eaten yet and you can feel the not-having-eaten in a specific place.' },
          { weight: 5, value: 'A burning that isn\'t hunger. A gnawing that isn\'t hunger. The two coexist and make each other louder.' },
        );
      } else if (gTier === 'ache') {
        thoughts.push(
          { weight: 5, value: 'Something below your ribs. Not loud. Just there.' },
          { weight: 4, value: 'The stomach thing. It\'s been worse. Right now it\'s just present.' },
          { weight: 3, value: 'There\'s a specific kind of ache that means your stomach is empty and unhappy about it in a way that goes beyond just being hungry.' },
        );
      } else if (gTier === 'gnaw') {
        thoughts.push(
          { weight: 2, value: 'Low-level. Somewhere around your stomach. The background version of the thing.' },
          { weight: 2, value: 'There\'s a small persistent complaint from somewhere in your midsection. You\'ve learned to mostly tune it out.' },
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

    // Nicotine withdrawal — irritability signal, craving, out-of-cigarettes sharpness
    // Distinct from caffeine withdrawal: no headache. Instead: an edge, a baseline meanness,
    // every small thing costing more than it should.
    {
      const nwdTier = ctx.state.nicotineWithdrawalTier();
      const noCigs = ctx.state.isSmoker() && ctx.state.get('has_cigarettes') < 1;
      if (nwdTier === 'severe') {
        thoughts.push(
          { weight: 10, value: 'There\'s an edge to everything. Not a mood — a physical thing, like a sound that\'s just slightly too high. It\'s been there since this morning.' },
          { weight: 9, value: 'Every minor friction is costing you more than it should. The slowness of things. The way people take up space. You know what the problem is.' },
          { weight: 8, value: 'Your jaw is set. You keep noticing it and releasing it and a few minutes later it\'s set again.' },
          ...(noCigs ? [
            { weight: 12, value: 'Out of cigarettes. The irritability has an answer and the answer isn\'t available.' },
            { weight: 10, value: 'You think about where you could get a pack. You\'ve done this calculation three times already.' },
          ] : []),
        );
      } else if (nwdTier === 'moderate') {
        thoughts.push(
          { weight: 6, value: 'Something in your chest keeps wanting to tighten. You keep breathing through it.' },
          { weight: 5, value: 'A restlessness. Not anxiety exactly. More like an itch you can\'t locate.' },
          { weight: 4, value: 'You could use a cigarette. The thought is persistent without being dramatic.' },
          ...(noCigs ? [
            { weight: 7, value: 'No cigarettes. The wanting is sharpening slowly.' },
          ] : []),
        );
      } else if (nwdTier === 'mild') {
        thoughts.push(
          { weight: 3, value: 'A low-grade restlessness. Probably nothing. You know what it is.' },
          ...(noCigs ? [
            { weight: 4, value: 'Out of cigarettes. You haven\'t gotten to the point of it yet but you\'re aware you will.' },
          ] : []),
        );
      }
    }

    // Alcohol withdrawal — the hangover's neurological texture; GABA rebound as anxiety
    // Distinct from caffeine or nicotine: not a headache, not an edge — a specific wrongness.
    // The morning-after dread before you've had time to remember what you did.
    // At severe withdrawal (high-tolerance users): shaking, the body turning on itself.
    {
      const awdTier = ctx.state.alcoholWithdrawalTier();
      if (awdTier === 'severe') {
        thoughts.push(
          { weight: 10, value: 'Your hands are doing something. A fine trembling you can pretend not to notice if you hold something.' },
          { weight: 10, value: 'Everything has a wrong frequency. Like the world is vibrating just past the comfortable range.' },
          { weight: 9, value: 'The anxiety is the kind that doesn\'t have an object. Just a raw broadcast of wrongness. Your body knows before you do.' },
          { weight: 9, value: 'You keep starting things and stopping them. The thought of continuing anything doesn\'t finish.' },
        );
      } else if (awdTier === 'moderate') {
        thoughts.push(
          { weight: 7, value: 'Something is off in your chest. Not your heart — under it. A kind of thrumming that won\'t settle.' },
          { weight: 6, value: 'The morning-after feeling isn\'t just tiredness. There\'s a specific flatness underneath everything.' },
          { weight: 5, value: 'Your sleep felt like something was happening just outside of it. You woke up already tired.' },
        );
      } else if (awdTier === 'mild') {
        thoughts.push(
          { weight: 4, value: 'A slight hollowness. The day before is taxing you a little. You\'ll be okay by afternoon.' },
          { weight: 3, value: 'Your body is doing the quiet accounting of last night. Nothing dramatic.' },
        );
      }
    }

    // Cannabis withdrawal — flat, slightly raw, appetite weird, sleep disturbed.
    // Distinct from all others: not a headache, not an edge — a flattening.
    // The absence of the thing that was softening everything. Nothing dramatic.
    // Sleep rebound (vivid/disturbing dreams) is a known feature of cannabis withdrawal.
    {
      const cwdTier = ctx.state.cannabisWithdrawalTier();
      const noCannabiS = ctx.state.isCannabisUser() && ctx.state.get('has_cannabis') < 1;
      if (cwdTier === 'severe') {
        thoughts.push(
          { weight: 8, value: 'Everything has the quality of being slightly unfinished. Like a room where someone forgot to turn on all the lights.' },
          { weight: 7, value: 'You slept badly. The dreams were vivid in a way that wasn\'t restful — not nightmares exactly, just too much happening.' },
          { weight: 7, value: 'The irritability doesn\'t have a clear object. Things just cost a little more than they should today.' },
          { weight: 6, value: 'Your appetite is doing something odd. You\'re hungry but nothing sounds right. The body is recalibrating.' },
          ...(noCannabiS ? [
            { weight: 9, value: 'Nothing at home. The flatness has a specific quality today — you know what was making the edges softer, and it\'s not there.' },
          ] : []),
        );
      } else if (cwdTier === 'moderate') {
        thoughts.push(
          { weight: 5, value: 'A low flatness underneath the day. Nothing sharp. Just — less color than usual.' },
          { weight: 4, value: 'You slept but woke up more tired than when you went down. The dreams were busy.' },
          { weight: 4, value: 'Mildly irritable in a way that doesn\'t point anywhere. You\'re aware of it.' },
          ...(noCannabiS ? [
            { weight: 5, value: 'Out. You notice it the way you notice bad weather — not catastrophic, just a thing that changes the texture of the day.' },
          ] : []),
        );
      } else if (cwdTier === 'mild') {
        thoughts.push(
          { weight: 2, value: 'A flatness. Nothing troubling. Just the day without its usual softening.' },
          ...(noCannabiS ? [
            { weight: 3, value: 'Nothing left at home. You\'re aware of this in a mild, persistent way.' },
          ] : []),
        );
      }
    }

    // Hygiene awareness — when stale/grimy, especially in social contexts
    {
      const hygTier = ctx.state.hygieneTier();
      const atWork = ['workplace'].includes(location);
      const inPublic = ['corner_store', 'street', 'bus_stop', 'soup_kitchen', 'food_bank'].includes(location);
      if (hygTier === 'grimy') {
        // Strong signal at work or in public; lower signal at home
        const hygieneWeight = atWork ? 7 : inPublic ? 5 : 2;
        thoughts.push(
          { weight: hygieneWeight, value: 'You haven\'t showered. You\'re aware of this in a way that doesn\'t go quiet.' },
          { weight: hygieneWeight, value: 'The not-showered feeling is a specific thing. A layer of the day you can\'t quite get past.' },
          { weight: atWork ? 6 : 3, value: 'You keep track of how close you\'re standing to people. Not dramatically. Just — you notice.' },
          // At work — the social stakes sharpen it
          { weight: atWork ? 5 : 0, value: 'You wonder if anyone can tell. You can tell. You\'ve been aware of it since you got here.' },
          // Low serotonin makes it worse
          { weight: ctx.state.lerp01(ser, 45, 25) * (atWork ? 5 : 2), value: 'The not-showering is one thing. The knowing-you-haven\'t-showered is another, and it sits on everything.' },
        );
      } else if (hygTier === 'stale') {
        const hygieneWeight = atWork ? 3 : inPublic ? 2 : 0;
        if (hygieneWeight > 0) {
          thoughts.push(
            { weight: hygieneWeight, value: 'You should have showered before leaving. You know.' },
            { weight: hygieneWeight - 1, value: 'Not terrible. Just — you\'ve been better.' },
          );
        }
      }
    }

    // Clothing cleanliness awareness — when stale/dirty, especially in social or work contexts
    if (ctx.state.get('dressed')) {
      const clothingTier = ctx.state.clothingCleanlinessTier();
      const atWork = location === 'workplace';
      const inPublic = ['corner_store', 'street', 'bus_stop', 'soup_kitchen', 'food_bank'].includes(location);
      if (clothingTier === 'dirty') {
        const clothingWeight = atWork ? 6 : inPublic ? 4 : 2;
        thoughts.push(
          { weight: clothingWeight, value: 'The shirt has been on since yesterday. You can tell without looking.' },
          { weight: clothingWeight, value: 'These clothes have been worn. The fabric knows.' },
          { weight: atWork ? 5 : 2, value: 'You pull the collar away from your neck. It doesn\'t help much.' },
          // Low serotonin — it layers onto the self-presentation
          { weight: ctx.state.lerp01(ser, 45, 25) * (atWork ? 4 : 2), value: 'The same clothes as yesterday. You\'re not sure anyone notices. You notice.' },
        );
      } else if (clothingTier === 'stale') {
        const clothingWeight = atWork ? 3 : inPublic ? 2 : 0;
        if (clothingWeight > 0) {
          thoughts.push(
            { weight: clothingWeight, value: 'The jeans have been worn a few days now. Nothing dramatic. Just — known.' },
            { weight: clothingWeight - 1, value: 'Something about the fabric today. It\'s been a while since laundry.' },
          );
        }
      }
    }

    // Clothing damage awareness — torn, stained, stretched items on body or in wardrobe
    {
      const damaged = ctx.clothing.damagedItems();
      const wornDamaged = ctx.clothing.damagedWornItems();
      const atWork = location === 'workplace';

      // Currently wearing something damaged — the awareness of it
      if (wornDamaged.length > 0) {
        const first = wornDamaged[0];
        const isTorn = first.types.includes('torn');
        const isStained = first.types.includes('stained');
        if (isTorn) {
          const base = atWork ? 5 : 3;
          thoughts.push(
            { weight: base, value: `The tear is still there. You know where it is without looking.` },
            { weight: base, value: `You keep catching the edge of the tear with your thumb. You stop yourself.` },
            { weight: atWork ? 4 : 0, value: `You keep the tear on the inside if you can. It doesn't always work.` },
          );
        }
        if (isStained) {
          const base = atWork ? 5 : 2;
          thoughts.push(
            { weight: base, value: `The stain is there. You're aware of it. You put it on anyway.` },
            { weight: base, value: `The stain set in. That's just what it is now.` },
            { weight: atWork ? 3 : 1, value: `You orient yourself so it's less visible. A small, constant adjustment.` },
          );
        }
      }

      // Damaged items in wardrobe — the thing you haven't fixed, the thing you keep putting on anyway
      if (!ctx.state.get('dressed') && damaged.length > 0) {
        const item = damaged[0];
        const isTorn = item.damage.torn;
        const isStained = item.damage.stained;
        const isStretched = item.damage.stretched;
        if (isTorn) {
          thoughts.push(
            { weight: 2, value: `The ${item.name} with the tear. You keep meaning to do something about it.` },
            { weight: 2, value: `You think about the ${item.name}. The seam that went. You haven't thrown it out.` },
          );
        } else if (isStained) {
          thoughts.push(
            { weight: 2, value: `The ${item.name}. The stain's not coming out. You know it's not coming out.` },
            { weight: 2, value: `The stain on the ${item.name}. It's in the fabric now. It's just part of it.` },
          );
        } else if (isStretched) {
          thoughts.push(
            { weight: 1, value: `The ${item.name} fits differently now. You noticed and then you kept wearing it.` },
            { weight: 1, value: `The ${item.name}. The waistband gave up somewhere. You've adapted.` },
          );
        }
      }
    }

    // Appearance composite — compound state and pre-tomorrow dread
    // These fire on top of the per-dimension thoughts above, covering situations
    // the individual hygiene and clothing checks don't address:
    // (1) Both dimensions off together — the compound self-consciousness.
    // (2) At home, work tomorrow, still not dealt with — the low anticipatory dread.
    {
      const appTier = ctx.state.appearanceAwareness();
      const atHome = ['apartment_bedroom', 'apartment_kitchen', 'apartment_bathroom'].includes(location);
      // workTomorrow: true if the next absolute day has a known shift.
      // This is what drives the anticipatory dread — tomorrow, not today.
      const workTomorrow = (() => {
        const tomorrow = ctx.state.currentAbsoluteDay() + 1;
        return ctx.state.isScheduledWorkDay(tomorrow) === true;
      })();

      // Compound state — grimy AND dirty at the same time. A different quality from either alone.
      if (appTier === 'severe') {
        const severeBase = atHome ? 4 : 7;
        thoughts.push(
          { weight: severeBase, value: 'Everything you\'re wearing. The state of you. You don\'t look in the mirror but you don\'t need to.' },
          { weight: severeBase, value: 'You\'ve let it go. You know you\'ve let it go. The knowing doesn\'t do anything.' },
          // Low serotonin deepens the flatness of the recognition
          { weight: ctx.state.lerp01(ser, 45, 25) * severeBase, value: 'You\'re aware of how you\'d appear to someone looking at you right now. You don\'t examine that thought for long.' },
          // Low dopamine — can't connect it to action
          { weight: ctx.state.lerp01(dop, 42, 22) * (severeBase - 1), value: 'You should shower. Change. The thought exists. The path from thought to doing is very long.' },
        );
        // At work — compound exposure is sharper
        if (location === 'workplace') {
          thoughts.push(
            { weight: 8, value: 'You take up less space in the room than usual. Not literally. Just — the way you hold yourself.' },
            { weight: 7, value: 'The distance between you and everyone else has a specific texture today.' },
          );
        }
      }

      // Pre-tomorrow dread — at home, work coming up, and you haven't dealt with the hygiene/clothes
      // Only fires in the evening or night (anticipatory, not immediate)
      if (atHome && workTomorrow && ['notable', 'severe'].includes(appTier)) {
        const tp = ctx.state.timePeriod();
        const isEvening = tp === 'evening' || tp === 'night' || tp === 'deep_night';
        if (isEvening) {
          thoughts.push(
            { weight: 5, value: 'Work tomorrow. You think about that in the context of — everything else.' },
            { weight: 5, value: 'You should shower before bed. You know. You\'re noting it and not doing it yet.' },
            // Low serotonin — the prospect of tomorrow feels heavier
            { weight: ctx.state.lerp01(ser, 45, 25) * 5, value: 'There\'s a thing you need to do before tomorrow and you\'re aware of it in the low background way of something you haven\'t dealt with.' },
            // Low GABA — the pre-tomorrow feeling has an edge
            { weight: ctx.state.lerp01(gaba, 45, 25) * 4, value: 'The thought of walking in there tomorrow. You don\'t finish the thought. You park it somewhere.' },
          );
        }
      }
    }

    // Skin condition awareness — cracked/tight surfaces in downtime or after washing
    {
      const skinTier = ctx.state.skinConditionTier();
      const inBathroom = location === 'apartment_bathroom';
      if (skinTier === 'cracked') {
        thoughts.push(
          { weight: 4, value: 'Your hands are dry. Not just dry — the knuckles are cracked and the skin catches on everything.' },
          { weight: 4, value: 'The skin around your mouth is tight when you open it. You\'ve been ignoring it.' },
          { weight: inBathroom ? 4 : 2, value: 'You look at your hands. The back of them is starting to flake. Peeling at the edges of the knuckles.' },
          // Low serotonin — it becomes another thing wrong
          { weight: ctx.state.lerp01(ser, 40, 20) * 3, value: 'Your skin hurts. A small hurt. The kind you notice more when everything else is already a lot.' },
        );
      } else if (skinTier === 'tight') {
        thoughts.push(
          { weight: 2, value: 'Your skin is dry. The backs of your hands feel tighter than they should.' },
          { weight: inBathroom ? 3 : 1, value: 'You should put something on your hands. You don\'t have anything. Or you have it and can\'t be bothered to find it.' },
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

    // Menstrual phase — cramping and flow logistics
    // Only fires for characters with a uterus (cycle_day > 0) in the menstrual phase.
    // No condition names in prose. Body-level signals only.
    if (ctx.body.hasUterus() && ctx.state.cyclePhaseTier() === 'menstrual') {
      const crampActive = ctx.state.get('cramps_active');
      const noSupplies = ctx.state.get('needs_period_supplies');
      const suppCount = ctx.state.get('period_supply_count');
      // Cramping thoughts
      if (crampActive) {
        thoughts.push(
          { weight: 8, value: 'Something in your lower abdomen. It\'s been there since morning. Background noise that keeps reasserting itself.' },
          { weight: 7, value: 'You shift in the chair and it gets worse for a second. Then it settles back to what it was. You don\'t move again.' },
          { weight: 6, value: 'The ache below your navel is not sharp. It doesn\'t need to be sharp to be there constantly.' },
          { weight: 6, value: 'You breathe through something in your lower body. Not an event — just the ongoing fact of it.' },
          { weight: 5, value: 'It comes in slow waves. You notice the ebb more than the peak. The ebb means it\'ll crest again.' },
        );
        // Low serotonin makes the cramping harder to hold
        thoughts.push(
          { weight: ctx.state.lerp01(ser, 40, 22) * 4, value: 'The ache is not the worst thing. The worst thing is having to carry it while everything else also needs carrying.' },
        );
        // Low GABA — the cramping adds to an already-frayed baseline
        thoughts.push(
          { weight: ctx.state.lerp01(gaba, 42, 25) * 4, value: 'Something below your ribs tightens and releases and tightens. You\'ve stopped trying to predict the rhythm.' },
        );
      } else {
        // Menstrual phase without active cramps — still present, lower weight
        thoughts.push(
          { weight: 4, value: 'A dull awareness below your waist. Nothing acute. Just present in the way these things are present.' },
          { weight: 3, value: 'Your body is doing a thing it does. You\'re operating around it.' },
        );
      }
      // Running out of supplies — the logistics
      if (noSupplies) {
        thoughts.push(
          { weight: 12, value: 'You\'re out. You\'ve been calculating how long you can wait since you noticed.' },
          { weight: 10, value: 'The thing you need isn\'t here. You\'ve been making do and it\'s almost not working anymore.' },
          { weight: 9, value: 'At some point today you need to deal with the supply situation. You\'ve been noting this for a while now.' },
        );
      } else if (suppCount !== null && suppCount <= 3 && suppCount > 0) {
        // Running low — a logistics awareness before it becomes urgent
        thoughts.push(
          { weight: 5, value: 'You\'re getting low on supplies. Not out. But the not-out has an expiration.' },
        );
      }
    }

    // Late luteal (PMS window) — irritability signals and mood instability
    // Fires for characters with a uterus in the late_luteal phase.
    // No naming of what this is — just the texture of the experience.
    if (ctx.body.hasUterus() && ctx.state.cyclePhaseTier() === 'late_luteal') {
      thoughts.push(
        { weight: 5, value: 'Everything is costing more than it should. Small things. A sound. A word someone used. You notice yourself noticing.' },
        { weight: 5, value: 'There\'s an edge today that isn\'t about anything in particular. You\'ve checked. Nothing is different. The edge is still there.' },
        { weight: 4, value: 'Your patience is at a specific level. You know the level. You\'re managing it.' },
        { weight: 4, value: 'The irritation doesn\'t have a source. That\'s what makes it hard to argue with.' },
        { weight: 3, value: 'You\'re a degree or two off from yourself. Not unmanageable. Just — off.' },
        { weight: 3, value: 'Something in your chest that isn\'t grief, isn\'t anger. The body\'s version of overcast.' },
      );
      // Low serotonin amplifies the late-luteal mood depth
      thoughts.push(
        { weight: ctx.state.lerp01(ser, 42, 25) * 5, value: 'There are feelings and then there are the feelings underneath them, and lately the distance between the two has been very small.' },
        { weight: ctx.state.lerp01(ser, 42, 25) * 4, value: 'You keep having emotions that are slightly too large for what caused them. You know this. It doesn\'t make them smaller.' },
      );
      // Low GABA — anxiety edge on the irritability
      thoughts.push(
        { weight: ctx.state.lerp01(gaba, 42, 25) * 4, value: 'The tightness in your chest is familiar. It comes and it goes. Right now it\'s here.' },
      );
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

    // Within work area
    if (ctx.world.getLocation(from)?.area === 'work' && ctx.world.getLocation(to)?.area === 'work') {
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

      let rideText;
      if (hour >= 7 && hour <= 9) {
        // Rush hour
        if (mood === 'numb' || mood === 'heavy' || mood === 'hollow') {
          rideText = ctx.timeline.weightedPick([
            { weight: 1, value: 'The bus is full. Bodies pressed together going the same direction. You find a spot to stand and not be. Twenty minutes of that.' },
            { weight: 1, value: 'Standing room. You press in and find a hold bar. The bus moves. You move with it. Twenty minutes.' },
            // High adenosine (unblocked) — the bus sway is almost restful
            { weight: ctx.state.lerp01(aden, 50, 70) * ctx.state.adenosineBlock(), value: 'The bus is packed and warm. You close your eyes for most of the ride. The sway. Twenty minutes you barely noticed.' },
            // Low serotonin — the press of bodies is nothing
            { weight: ctx.state.lerp01(ser, 35, 18), value: 'The bus is full. You find a grip and hold it. Bodies around you, sounds, movement. None of it reaches you. Twenty minutes.' },
          ]);
        } else {
          rideText = ctx.timeline.weightedPick([
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
      } else {
        // Off-peak
        rideText = ctx.timeline.weightedPick([
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

      // Ambient event — one call on every path (null = nothing additional)
      // High NE raises chance of registering; low energy lowers it
      const neModifier = ctx.state.lerp01(ne, 40, 65);
      const adenModifier = 1 - ctx.state.lerp01(aden, 55, 80) * ctx.state.adenosineBlock();
      const ambientWeight = 0.55 * neModifier * adenModifier;
      const ambientToWork = ctx.timeline.weightedPick([
        // Overheard conversation — fragments that arrive whether you want them or not
        { weight: ambientWeight * 0.9, value: 'Two stops in, someone behind you is on the phone. Not a fight. Not clearly a fight. You catch: "— I just need you to tell me that before I—" and then the bus goes over a rough patch and you lose the thread.' },
        { weight: ambientWeight * 0.7, value: 'A man two seats up, to no one: "I know, I know." His phone is in his lap. He says it again. You look away.' },
        { weight: ambientWeight * (mood === 'fraying' ? 1.2 : 0.6), value: 'You are standing close enough to hear part of a conversation you don\'t want. Something about a lease. Something about a name said with a particular flatness. You stare at the window.' },
        { weight: ambientWeight * 0.8, value: 'Snippets from nearby — a word, a laugh, the back half of something. Nothing that assembles into meaning. The ride is like that.' },
        // Someone's music — not quite contained
        { weight: ambientWeight * 1.0, value: 'Someone\'s headphones. The specific texture of sound that wasn\'t meant for you: the treble of it, the rhythm without the melody. You can\'t tell what song. You can tell it\'s a sad one.' },
        { weight: ambientWeight * 0.85, value: 'Music from someone\'s earbuds, too loud, something with drums. The percussion comes through even when nothing else does. The person looks asleep.' },
        { weight: ambientWeight * (ne > 58 ? 1.1 : 0.5), value: 'The tinny leak from headphones across the aisle. Bass you can feel more than hear. You are aware of every second of it.' },
        // Route landmark
        { weight: ambientWeight * (weather === 'drizzle' ? 1.1 : 0.7), value: 'The corner where the bus makes the wide left. You always see the laundromat sign from here. It\'s still there. Same sign, same hand-lettered hours. Something about that.' },
        { weight: ambientWeight * (weather === 'snow' ? 1.2 : 0.6), value: 'Through the window: the block with the old church. The one with the chain-link fence around the side lot. The city just goes on, on every side of it.' },
        { weight: ambientWeight * 0.7, value: 'The part of the route where you can see the highway overpass from the window. You\'ve never been on that road. You clock it the same way every time.' },
        // Null — no ambient event this ride
        { weight: 1.0, value: null },
      ]);
      return rideText + (ambientToWork ? '\n\n' + ambientToWork : '');
    }

    // Bus ride from work
    if (from === 'workplace' && to === 'bus_stop') {
      const aden = ctx.state.get('adenosine');
      const ne = ctx.state.get('norepinephrine');
      const gaba = ctx.state.get('gaba');
      const ser = ctx.state.get('serotonin');
      const weather = ctx.state.get('weather');

      let rideText;
      if (energy === 'depleted' || energy === 'exhausted') {
        rideText = ctx.timeline.weightedPick([
          { weight: 1, value: 'The bus ride back. You sit and close your eyes and exist in the motion of it.' },
          { weight: 1, value: 'A seat. You take it and don\'t move. The city in reverse outside the window. You\'re barely there.' },
          // High adenosine (unblocked) — the ride is surrender
          { weight: ctx.state.lerp01(aden, 58, 78) * ctx.state.adenosineBlock(), value: 'The bus seat holds you. That\'s the job. You close your eyes and the motion of it is the only thing that\'s asking anything of you.' },
          // Low serotonin — the day comes in pieces
          { weight: ctx.state.lerp01(ser, 38, 18), value: 'You sit down hard. The day sits with you. Eyes closed, the bus brings you home through it.' },
        ]);
      } else {
        rideText = ctx.timeline.weightedPick([
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

      // Ambient event — one call on every path (null = nothing additional)
      // Depleted energy lowers awareness; NE raises it; seat gives more chance to notice
      const neModifier = ctx.state.lerp01(ne, 40, 65);
      const adenModifier = 1 - ctx.state.lerp01(aden, 55, 80) * ctx.state.adenosineBlock();
      const seatedBonus = (energy !== 'depleted' && energy !== 'exhausted') ? 0.2 : 0;
      const ambientWeight = (0.5 + seatedBonus) * neModifier * adenModifier;
      const ambientFromWork = ctx.timeline.weightedPick([
        // Overheard conversation — you're not shielded anymore
        { weight: ambientWeight * 0.9, value: 'Across the aisle a woman is texting while she talks. You catch: "I told him that already." Pause. "I told him." The city slides past both of you.' },
        { weight: ambientWeight * 0.7, value: 'Someone near the back laughing at their phone. Full, unguarded. You don\'t know why. It lands somewhere you didn\'t expect it to.' },
        { weight: ambientWeight * (mood === 'heavy' || mood === 'hollow' ? 1.1 : 0.5), value: 'Two people who know each other, seats apart, talking over the bus noise. You catch every third word. Something about someone who didn\'t come through. You look out the window.' },
        // Someone's music
        { weight: ambientWeight * 1.0, value: 'Someone has headphones in but the volume is doing what volume does. You can\'t quite make it out — a melody your brain keeps trying to resolve. You don\'t resolve it.' },
        { weight: ambientWeight * (ne > 55 ? 1.1 : 0.6), value: 'The earbuds on the person beside you. Low and persistent. R&B or something like it. You close your eyes and your brain tries to finish the song. It can\'t.' },
        // Seat interaction — someone sits, or doesn\'t
        { weight: ambientWeight * 0.8, value: 'The seat beside you stays empty all the way home. You notice when you get off.' },
        { weight: ambientWeight * (gaba < 40 ? 0.3 : 0.85), value: 'Someone takes the seat next to you two stops in. Their bag on their lap. They smell like the outside. You look forward.' },
        // Route — the specific backward direction
        { weight: ambientWeight * 0.75, value: 'The laundromat corner in reverse. The church lot. The overpass. You know this route so well you\'ve stopped seeing it — then for a second you do: a city that is the same every day whether or not you are.' },
        { weight: ambientWeight * (weather === 'drizzle' || weather === 'snow' ? 1.2 : 0.6), value: 'Through the window: ' + (weather === 'snow' ? 'the snow softer now, the light changed since this morning.' : weather === 'drizzle' ? 'the rain the same as when you left. Still going.' : 'the light different than this morning. Later and longer.') + ' Twenty minutes home.' },
        // Null — no ambient event this ride
        { weight: 1.0, value: null },
      ]);
      return rideText + (ambientFromWork ? '\n\n' + ambientFromWork : '');
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
      // location: null means the interaction manages its own location check in available()
      if ((interaction.location === null || interaction.location === location) && interaction.available()) {
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
      const count = ctx.events.count('snoozed', ctx.state.get('wake_period_start'));
      const aden = ctx.state.get('adenosine');
      if (count > 1) return 'Again.';
      if (aden > 50) return 'Your hand is already moving.';
      return 'Snooze.';
    },

    dismiss_alarm: () => {
      const count = ctx.events.count('snoozed', ctx.state.get('wake_period_start'));
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

    home_workout: () => {
      const mood = ctx.state.moodTone();
      const et = ctx.state.energyTier();
      if (et === 'tired') return 'Work out. Use what\'s left.';
      if (mood === 'fraying') return 'Move. Use it up.';
      if (mood === 'heavy') return 'Work out. The floor.';
      return 'Work out.';
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

    breathwork_unguided: () => {
      const mood = ctx.state.moodTone();
      const ne = ctx.state.get('norepinephrine');
      const gaba = ctx.state.get('gaba');
      if (ne > 70 && gaba < 35) return 'You breathe. Somewhere to put the restlessness.';
      if (mood === 'fraying') return 'Just breathing. You need something to hold onto.';
      if (mood === 'heavy' || mood === 'numb') return 'Breathing. It doesn\'t cost anything.';
      return 'Breathe.';
    },

    breathwork_app: () => {
      const mood = ctx.state.moodTone();
      const ne = ctx.state.get('norepinephrine');
      if (ne > 70) return 'The app. A number to follow.';
      if (mood === 'fraying') return 'Something guided. You need the scaffolding.';
      return 'Guided breathing.';
    },

    yoga_home: () => {
      const mood = ctx.state.moodTone();
      const ne = ctx.state.get('norepinephrine');
      const gaba = ctx.state.get('gaba');
      if (ne > 70 && gaba < 35) return 'The floor. Move through it.';
      if (mood === 'fraying') return 'Something slow. The floor.';
      if (mood === 'heavy' || mood === 'numb') return 'The floor. Yoga, or something like it.';
      return 'Yoga.';
    },

    // === BATHROOM ===

    quick_shower: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'numb' || mood === 'heavy') return 'Quick. Just a rinse.';
      return 'Quick rinse.';
    },

    shower: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'numb') return 'The bathroom. Automatic.';
      if (mood === 'fraying') return 'Water. You need the water.';
      if (mood === 'heavy') return 'Shower. Going through the motions.';
      return 'Shower.';
    },

    long_shower: () => {
      const mood = ctx.state.moodTone();
      const ne = ctx.state.get('norepinephrine');
      const gaba = ctx.state.get('gaba');
      if (mood === 'fraying' || (ne > 65 && gaba < 35)) return 'You need the water. All of it.';
      if (mood === 'heavy' || mood === 'numb') return 'The shower. You\'re going to stay in it.';
      return 'Take your time in the shower.';
    },

    cold_shower: () => {
      const aden = ctx.state.get('adenosine');
      if (aden > 60) return 'Cold water. The only thing that\'ll work.';
      return 'Cold shower.';
    },

    check_phone_bathroom: () => {
      const justShowered = ctx.events.any('showered', ctx.state.get('wake_period_start'));
      if (justShowered && ctx.state.hasUnreadMessages()) return 'The phone.';
      return 'Check your phone.';
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

    go_for_run: () => {
      const mood = ctx.state.moodTone();
      const ne = ctx.state.get('norepinephrine');
      if (ne > 65) return 'Running. You need to run.';
      if (mood === 'fraying') return 'Running. Use it up.';
      if (mood === 'heavy') return 'Going out to run.';
      return 'A run.';
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

    check_phone_bus: () => {
      return 'Your phone, while you wait.';
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

    decompress_work: () => {
      const stress = ctx.state.stressTier();
      if (stress === 'overwhelmed') return 'You\'re not going back yet.';
      return 'A few more minutes.';
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

    buy_cigarettes: () => {
      const wd = ctx.state.nicotineWithdrawalTier();
      const noCigs = ctx.state.get('has_cigarettes') < 1;
      if (wd === 'severe' || wd === 'moderate') return 'A pack.';
      if (noCigs) return 'You\'re out. Get more.';
      return 'Cigarettes.';
    },

    buy_alcohol: () => {
      const wd = ctx.state.alcoholWithdrawalTier();
      if (wd === 'severe' || wd === 'moderate') return 'You need something.';
      const money = ctx.state.moneyTier();
      if (money === 'broke' || money === 'scraping') return 'Beer. Wine. Whatever.';
      return 'Beer or wine.';
    },

    drink_alcohol: () => {
      const wd = ctx.state.alcoholWithdrawalTier();
      const alc = ctx.state.alcoholTier();
      if (wd === 'severe') return 'You need to.';
      if (wd === 'moderate') return 'Something to take the edge off.';
      if (alc === 'medium') return 'Another one.';
      return 'Have a drink.';
    },

    smoke_cigarette: () => {
      const wd = ctx.state.nicotineWithdrawalTier();
      const loc = ctx.state.get('location');
      const isWork = loc === 'workplace';
      if (wd === 'severe') return isWork ? 'Outside. A minute.' : 'You need one.';
      if (wd === 'moderate') return 'A smoke.';
      if (isWork) return 'Step outside a minute.';
      return 'Smoke.';
    },

    smoke_cannabis: () => {
      const wd = ctx.state.cannabisWithdrawalTier();
      const tier = ctx.state.cannabisTier();
      if (wd === 'moderate' || wd === 'severe') return 'You need it right now.';
      if (tier === 'active') return 'More.';
      return 'Smoke.';
    },

    buy_cannabis: () => {
      const wd = ctx.state.cannabisWithdrawalTier();
      if (wd === 'moderate' || wd === 'severe') return 'You need to pick something up.';
      const noneLeft = ctx.state.get('has_cannabis') < 1;
      if (noneLeft) return 'Pick something up.';
      return 'Pick something up.';
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

    buy_pain_reliever: () => {
      return 'Ibuprofen.';
    },

    buy_umbrella: () => {
      const weather = ctx.state.get('weather');
      if (weather === 'drizzle') return 'An umbrella. You could use one.';
      return 'Umbrella.';
    },

    buy_period_supplies: () => {
      if (ctx.state.get('needs_period_supplies')) return 'You need supplies. They\'re here.';
      return 'Period supplies.';
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

    reach_out_to_friend: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'hollow') return 'Write. Just to say something.';
      if (mood === 'flat') return 'Write something.';
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

    open_alarm_app: () => {
      return 'Alarm.';
    },

    open_calendar_app: () => {
      return 'Schedule.';
    },

    cancel_alarm_app: () => {
      return 'No alarm.';
    },

    open_notes_app: () => {
      return 'Notes.';
    },

    write_note: () => {
      const mood = ctx.state.moodTone();
      if (mood === 'heavy' || mood === 'hollow') return 'Putting something down.';
      return 'New note.';
    },

    read_note: () => {
      return 'Reading it.';
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
      const todayShift = ctx.state.shiftFor(ctx.state.currentAbsoluteDay());
      const shiftStart = todayShift?.start ?? ctx.state.get('labor_arrangement').shift_start;
      const commutingToWork = ctx.state.isWorkday() && !ctx.events.any('arrived_at_work', ctx.state.get('wake_period_start')) && tod >= shiftStart - 120 && tod < shiftStart + 30;
      if (commutingToWork && (mood === 'numb' || mood === 'heavy')) return 'The bus stop. Your feet know the way.';
      return 'Bus stop.';
    },

    'move:workplace': () => {
      if (ctx.world.getLocationId() === 'workplace_bathroom') return 'Back to the floor.';
      const mood = ctx.state.moodTone();
      if (mood === 'heavy') return 'Work. The bus, the building, the desk. All of it coming.';
      return 'Bus.';
    },

    'move:workplace_bathroom': () => {
      const need = ctx.state.bladderNeedTier();
      if (need === 'pressing') return 'You\'re already moving.';
      if (need === 'urgent') return 'The restroom.';
      const stress = ctx.state.stressTier();
      if (stress === 'overwhelmed') return 'A minute. The restroom.';
      return 'A minute.';
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

