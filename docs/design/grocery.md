# Grocery System

## The Phenomenon

You go to the store. You already know what you're getting — not because you made a list, but because you always get this. Eggs, bread, rice, the canned thing. Your hands know the route through the aisles. You don't think about it. You just restock what's low.

Except today you grab chips. Or chocolate. Or the thing you saw last time and didn't buy. You're not out of it — you don't *need* it. But your serotonin is in the basement and your body is steering toward something that might produce a small good feeling. That's a different kind of purchase. The eggs are infrastructure. The chips are self-medication.

And *what* the eggs are depends on who you are. Someone who grew up cooking dal doesn't restock the same kitchen as someone who grew up on casseroles. A vegan's protein staple is beans or tofu, not eggs. Someone with celiac doesn't buy pasta — or buys the $4 gluten-free kind that doesn't taste right. The pantry is a portrait of a person. What's in it says who lives here.

The current system has a pantry, has cooking, has hunger — but it's generic. Everyone has the same five ingredients (pasta, rice, canned, eggs, bread). Everyone restocks the same way. The kitchen doesn't belong to anyone yet.

---

## What Needs to Change

### 1. Dietary identity

Not a label. A character doesn't *declare* "I'm vegan" — they have a set of things they eat and things they don't, derived from backstory. The categories overlap but aren't taxonomic:

**Upstream sources (generated at chargen on charRng):**
- **Cultural food tradition** — what they grew up eating. Shapes comfort foods, default staples, cooking knowledge. A Mexican-American character's pantry has beans, rice, tortillas, chili. A Korean-American character's has rice, gochujang, kimchi. A Southern character's has grits, canned greens, hot sauce. This is the deepest layer — even someone who's changed everything else about their diet still has the foods that mean home.
- **Ethical/philosophical restrictions** — vegetarian, vegan, pescatarian, or none. Derived from personality and backstory (not a random roll — people become vegan for reasons: animal empathy, environmental anxiety, a friend who introduced them to it, a health scare). This gates ingredient categories.
- **Health restrictions** — celiac (no gluten), lactose intolerance, allergies, diabetes (carb awareness). These come from health condition chargen. They don't change what you *want* — they change what you can have without consequences. The gluten-free person who misses real bread is a real experience.
- **Economic constraints** — what you can afford shapes what you buy, which shapes what you know how to cook, which shapes what you buy. The feedback loop is the phenomenon. Cheap protein is eggs for some people, dried beans for others, canned tuna for others. The corner store doesn't carry tofu.
- **Cooking knowledge** — how much they know. Someone raised by a parent who cooked has different skills than someone who grew up on microwave meals. This isn't a skill tree — it's a chargen parameter (0-100) that gates cooking complexity and determines the starting repertoire.

**Output: `food_profile` on character object.** Not a label — a structure:
```
food_profile: {
  tradition: 'mexican_american',    // cultural baseline
  restrictions: ['lactose'],        // hard gates
  ethical: null,                    // or 'vegetarian', 'vegan'
  cooking_skill: 62,                // what complexity they can manage
  comfort_foods: ['rice_beans', 'pan_dulce'],  // backstory-derived
  staples: ['rice', 'beans', 'tortillas', 'eggs', 'canned'],  // what they actually keep
}
```

### 2. Expanded pantry vocabulary

The current pantry has five slots: `{ pasta, rice, canned, eggs, bread }`. This needs to become a larger vocabulary that characters draw from selectively:

**Potential ingredient categories:**
- **Grains/starches:** pasta, rice, bread, tortillas, oats, potatoes, noodles, grits
- **Proteins:** eggs, canned beans, dried beans, tofu, canned tuna/chicken, deli meat, ground meat
- **Produce:** (perishable, short shelf life) — onions, garlic, peppers, greens, tomatoes, bananas, apples
- **Dairy alternatives:** milk/oat milk, cheese, yogurt, butter
- **Canned/shelf-stable:** soups, tomato sauce, coconut milk, broth, peanut butter
- **Condiments/staples:** oil, salt, hot sauce, soy sauce, spices (these don't deplete meaningfully — they're binary: have/don't have)
- **Snacks:** chips, cookies, candy, crackers, instant ramen (comfort/impulse category)
- **Drinks:** coffee, tea, juice (some already tracked — caffeine system)

**Not all of these exist for every character.** A character's `food_profile.staples` list determines which 6-10 ingredient slots are active in *their* pantry. The pantry object only contains what this person actually keeps in their kitchen.

**Approximation note:** Full nutritional modeling (macros, vitamins, caloric density) is out of scope. The system cares about *what* you eat (identity, texture, choice) not *how many calories* it contains. Hunger reduction per meal varies by food type but doesn't model nutrition.

### 3. Cooking repertoire

A character doesn't have access to every recipe. They have 4-7 things they *actually make*, derived from:
- Cultural tradition (what they grew up eating)
- Cooking skill (how complex a meal they can pull off)
- Current pantry (you cook what you have)
- What they've been cooking lately (habit reinforcement)

**Repertoire is not a fixed list.** It's a function of `food_profile` + pantry contents. If you have rice and beans, "rice and beans" is available. If you have pasta and canned tomato sauce, "pasta with sauce" is available. The *style* of the meal comes from the food profile — the same rice and beans are arroz con frijoles for one character and a plain bowl of rice with canned beans for another. Different prose, same mechanical outcome (roughly), because the repertoire shapes the text.

**Skill gates complexity, not access.** Low cooking skill: toast, instant ramen, canned soup heated up, scrambled eggs. Medium: pasta with sauce, rice with something, stir-fry, basic soup. High: meals with multiple components, things that take planning, things that can go wrong. The boundary isn't sharp — it's a gradient where lower skill means longer time, more energy, and worse outcomes (burned, underseasoned, the pasta that's slightly wrong).

### 4. Habit-driven shopping

This is the core insight. **The habit system already learns what the character cooks.** If the CART trees know "this character cooks eggs frequently," and the feature extraction includes pantry state, then when the character is at the corner store with low eggs, "buy eggs" naturally gets high confidence.

**What this requires:**
- Pantry item levels added to habit feature extraction (~35 features → ~45 features, one per active pantry slot)
- Buy interactions for each purchasable ingredient (many already exist: buy_eggs, buy_bread)
- The habit system does the rest — no explicit shopping list, no "low supplies" notification. The suggestion just appears because the pattern is there.

**The texture this creates:** After a few game-days of cooking eggs every morning, the character walks into the corner store and "buy eggs" is highlighted. Not because the game said "you're low on eggs" — because that's what you do here. The habit is the shopping list. If you stop cooking eggs (maybe you switched to toast this week), eggs stop being suggested. The cart follows behavior, not inventory.

**Impulse purchases are different.** Snacks, treats, comfort food — these aren't habit-driven (or shouldn't be, mostly). They're NT-driven. When serotonin is low, "buy snacks" should be available and possibly suggested, weighted by the character's comfort-food relationship. The habit system might learn this too (if you always buy chips when you're depleted, it'll start suggesting chips when you're depleted), but the initial availability is state-driven, not pantry-driven.

### 5. The grocery trip

The corner store already exists as a location. What changes is the *experience* of being there.

**Currently:** You go to the corner store. You buy groceries (generic +3 fridge, +1 pantry). Or you buy a specific thing (eggs, bread, staples). Discrete transactions.

**What it should feel like:** You're at the store. You're here because you need things, or because it's on the way, or because you're avoiding going home. What you buy depends on what's low (habit-driven), what you can afford (money-gated), what your body is asking for (NT-driven), and what catches your eye (impulse/RNG).

**The budget anxiety layer.** The current system has money-gating (can't buy if you can't afford it). But the *experience* of grocery shopping on a tight budget is different from shopping with a cushion. The cart fills differently. You put things back. You do the math in your head. The $8 bag of staples vs. the $3 cheap meal — that choice has weight. Prose should carry this: the corner store description already branches on money tier, but the shopping interactions themselves should feel different at different money tiers.

**What the corner store doesn't carry.** This is the food desert mechanic already described in overview.md. Tofu probably isn't at the corner store. Fresh produce is limited. The specialized dietary item (gluten-free bread, oat milk) requires a different store — the grocery store, which is farther away and costs a bus ride. Characters with mainstream diets can get everything at the corner store. Characters with restrictions face an access tax.

### 6. The grocery store (new location?)

The corner store works for staples. But a full grocery trip — the once-a-week stock-up, the place with produce and options — might warrant a separate location. This is the bus-ride-away store that has what the corner store doesn't.

**Arguments for:** Different prose texture (aisles, fluorescent lights, the overwhelming choice, the self-checkout). Different inventory (fresh produce, specialty items, bulk options). The time investment (30-45 min there, shopping, back). The budget experience is different (a full cart at checkout is a different anxiety than $4 at the corner store).

**Arguments against:** Another location is more complexity. The corner store could expand to cover it with "buy groceries" being the big-trip interaction. The game is deliberately small — the constraint is the point.

**Resolution:** Defer. The corner store can expand first. A grocery-store location is a future question, relevant when the food desert mechanic exists and dietary restrictions create a genuine need gap.

### 7. Snacks and impulse food

Separate from groceries. Snacks are:
- Available at the corner store (always)
- Cheap ($1-3)
- Small hunger reduction (-10 to -15) but with a serotonin/dopamine nudge
- NT-gated: availability or suggestion weight increases when serotonin/dopamine are low
- Comfort food sentiment interaction: the snack provides a small hit, habituates with repetition
- Character-specific: what the snack *is* comes from the food profile (chips for one person, pan dulce for another, pocky for another)

**The distinction:** Groceries are infrastructure — you buy them so you can eat later. Snacks are intervention — you buy them because right now is hard. The habit system will learn both, but the initial impulse is different. Someone who always buys chips isn't making a grocery decision. They're doing something about how they feel.

---

## Interaction with Existing Systems

**Habit system** — the primary mechanism. Learns cooking patterns, infers grocery needs. Feature extraction expands to include pantry levels. Anti-snowball weights still apply (auto-purchased groceries train at 0.1, suggested at 0.5, player-chosen at 1.0).

**Financial system** — all purchases cost money. EBT already exists for corner store. Budget tier shapes prose. Poverty makes the whole system harder — fewer choices, worse options, the math that never stops.

**Sentiments** — food comfort sentiment already exists. Expands to track comfort-food-specific responses. Habituation already works (-0.002 to -0.003 per activation).

**Hunger/stomach** — mechanical outcomes of eating remain similar. Different foods might have different stomach content types (solid vs. mixed), different hunger reduction amounts, different dental impact.

**Gastritis** — already interacts with eating. Different foods have different acid-buffering properties. An empty stomach hurts. This constrains food choices for gastritis characters.

**Menstrual cycle** — cravings during luteal/late_luteal phase. Specific food desires that don't normally appear. The chocolate that isn't about chocolate.

**Substances** — alcohol munchies, cannabis munchies (already modeled as hunger increase). These drive eating and possibly impulse purchases.

**Cultural identity** — the food profile is one of the strongest expressions of cultural background. Missing a food from home is a specific feeling. The store that doesn't carry it is a specific absence.

---

## Disordered and Dysregulated Eating

Eating too much is not one thing. Several distinct phenomena share "ate past fullness" as a surface behavior but have different upstream causes, different NT signatures, and different mechanical patterns. The existing stomach system supports all of them — `fillStomach()` tracks fullness, hormonal satiation is a separate signal, you *can* eat past full. The simulation just doesn't have reasons to yet.

### Stress eating

Not a disorder. A thing bodies do. Cortisol drives appetite toward calorie-dense food — the hypothalamic-pituitary-adrenal axis upregulates appetite when stress is sustained (not acute; acute stress suppresses appetite via CRH). The food doesn't taste like anything after the third handful. It's not about hunger. It's about the chewing, the fullness, the sensory occupation that temporarily displaces the cortisol signal.

**Mechanical signature:** High cortisol (sustained, not spike) + available food → eating interaction available past satiety. Small stress reduction per bite (real effect, not placebo — oral sensory stimulation activates parasympathetic). Diminishing returns. Shame/regret sentiment accumulation afterward scales with self-awareness of the pattern. Not everyone stress-eats — it's personality-gated (some people lose appetite under stress; that's the acute CRH pathway dominating).

### Binge eating

Loss of control is the defining feature. Not "I chose to eat more" but "I couldn't stop." The dissociation between wanting to stop and continuing is the experience. The fullness signal is present and overridden. The shame is immediate and intense. Often follows restriction — the rebound from deprivation, where the body's scarcity response overwhelms executive control.

**Mechanical signature:** Trigger conditions: restriction history (recent caloric deficit) + emotional distress (low serotonin, high cortisol) + impulsivity (personality parameter) + available food. During episode: repeated eat actions with reduced agency (auto-advance at lower threshold? or just very high habit confidence?). Stomach fills past comfort. Serotonin/dopamine spike then crash. Afterward: shame sentiment, possible nausea from overfullness, cortisol spike from the shame. The cycle is self-reinforcing.

**Bulimia adds purge.** Same binge trigger, followed by compensatory behavior — vomiting (emesis system already exists), excessive exercise, restriction. The purge provides temporary relief (cortisol drop) that reinforces the cycle. Secrecy is mechanical: these interactions don't surface in shared spaces or when others are present. Dental erosion, electrolyte disruption over time.

### ADHD eating dysregulation

Not disordered eating — dysregulated eating. Several distinct patterns:

- **Forgetting to eat.** Hyperfocus suppresses interoceptive awareness. Hunger signal is present but not attended to. You look up and it's been 9 hours. This is already partially modeled (hunger accumulates regardless), but the *awareness* gap matters: the character doesn't notice they're hungry until the hunger is extreme, then eats everything available at once. Not a binge — a catch-up. Different prose, different shame profile (frustration at self, not body-shame).

- **Dopamine-seeking eating.** Food is the most available reward. When dopamine is low and nothing else is producing stimulation, the fridge becomes the dopamine button. Not hunger-driven. The food doesn't need to be good — it needs to be *there* and *easy*. Snacking loop: eat something small, brief dopamine, crash, eat again. The pantry empties faster than it should.

- **Executive function collapse at the cooking step.** You have food. You're hungry. The idea of all those steps (get out the pan, turn on the stove, wait for water, watch the timing) is too many sequential decisions. So you eat crackers, or nothing, or the thing that requires zero steps. This isn't laziness — it's a genuine resource limitation. The cooking interaction is available but the executive function cost exceeds current capacity.

### Autism and sensory food restriction

Not ARFID (which is its own condition, described in overview.md), but the broader phenomenon: texture sensitivity, temperature sensitivity, the food that was fine yesterday but today the *mouthfeel* is wrong and it's not happening. Safe foods are a real and necessary concept — the foods that are always okay, that never surprise you. The safe food list is short and when those items aren't available, eating becomes a problem.

**Mechanical signature:** Character has a `safe_foods` subset of their food profile. When sensory threshold is depleted (high NE, sensory overload state), only safe foods are available for cooking/eating without a stress/nausea cost. When the pantry doesn't contain safe foods: eating still happens (hunger is relentless), but with aversive prose and a stress/nausea penalty. This isn't a choice the character is making — it's a body that won't cooperate.

### Anorexia nervosa

The hunger is there and you're not eating. This is not appetite suppression — the appetite is present, sometimes screaming. The override is cognitive: body image distortion, fear of consequences, the control that restriction provides when everything else is uncontrollable. Restriction *feels like* agency. That's what makes it so hard to treat and so hard to model without reducing it to "won't eat."

**What it is not:** Depression appetite loss (no desire to eat). ARFID (can't eat specific things due to sensory response). Poverty-driven food insecurity (can't eat because it's not there). Anorexia is: food is available, hunger is present, and the person is choosing not to eat — except "choosing" understates the compulsive architecture driving the decision. It's a choice the way OCD rituals are a choice.

**Mechanical signature:** Body image disturbance (not yet a state variable — noted in overview.md as needed for all eating disorders) + control-seeking personality configuration (high conscientiousness, high anxiety, perfectionism — these are real risk factors, not stereotypes; Cassin & von Ranson 2005). Restriction manifests as: eating interactions available but with an internal aversion cost. The character *can* eat — the interaction is there. But eating triggers anxiety (cortisol spike, GABA drop), guilt sentiment, body image distress. Not eating also has a cost (hunger builds, energy drains, cognitive function degrades), but the restriction provides a competing reward: control sentiment, brief anxiety reduction, the satisfaction of endurance.

**The cascade:** Restriction → caloric deficit → metabolic slowdown → cognitive narrowing (the world gets smaller, food becomes the only thing you think about while being the thing you won't do) → social withdrawal (eating with others is impossible) → physical consequences (hair, skin, temperature regulation, bone density, cardiac). The simulation already models most of the downstream: hunger accumulates, energy drains with hunger, stress compounds. What's missing is the *reason* for sustained voluntary restriction and the body image system that drives it.

**Restriction-binge cycle.** Anorexia and binge eating are not opposites — they're phases of the same system for many people. Sustained restriction triggers the binge rebound (the body's scarcity response overwhelms the cognitive override). Then restriction resumes, harder, to compensate. The cycle is self-reinforcing. This connects to the binge eating section above.

**Not a chargen flag.** Like all eating disorders in this simulation, anorexia emerges from personality configuration + life history + current NT state. It's circumstantial, not constitutional. The conditions that produce it (perfectionism, anxiety, control-seeking, body image disturbance, possibly a triggering event) are what get generated. The disorder is the behavior that follows.

### Depression and appetite

Bidirectional. Some people stop eating (appetite suppression from low serotonin — the food has no appeal, nothing sounds good, the effort of eating is too much). Others eat more (comfort-seeking, the only available dopamine source, the ritual of eating as the one thing you can still do). Which direction depends on personality, serotonin subtype, and history. Both are real. Both are already partially supported by the NT system — low serotonin reduces food comfort sentiment, low dopamine reduces motivation to cook. What's missing is the prose carrying the *experience* of each pattern and the mechanical divergence (appetite suppression vs. comfort-seeking as distinct responses to the same NT state).

---

## Failure Modes by Condition

Not just cooking failure — the full executive function cascade around food:

- **Went to make pasta, checked phone, water boiled over.** Working memory load (ADHD). The stove doesn't wait for your attention to come back.
- **Bought groceries but forgot the one thing you needed.** Working memory again. The list was in your head and your head dropped it.
- **Was going to cook but the steps are too much right now.** Executive function depletion (ADHD, depression, extreme fatigue). You eat whatever requires zero decisions.
- **Started cooking, oil started spitting, smoke alarm went off, now you can't.** Sensory overwhelm (autism, PTSD). The kitchen is hostile. You leave.
- **Food is there but nothing sounds good.** Appetite suppression (depression, nausea, grief). The hunger is real and the eating isn't happening.
- **Meant to go shopping, didn't leave the apartment.** Agoraphobia, social anxiety, depression, executive function. The pantry empties. The hunger builds. The trip doesn't happen.
- **Bought comfort food instead of groceries.** NT-driven prioritization override. The chips felt more urgent than the rice. Tomorrow's meals sacrificed for today's serotonin.

These aren't random events. Each has a specific upstream cause that the simulation can check. The question is whether they fire as involuntary overrides (agency removed, action redirected) or as availability changes (the "good" option is gone, only worse options remain). Probably the latter for most — the game doesn't take actions for you, it shapes what's possible.

---

## Eating Past Fullness (Non-Pathological)

Not every instance of eating past full is disordered. Sometimes the burrito was just big. Several situational patterns that don't belong in the disordered eating section:

- **Portion inertia.** The food is in front of you. Stopping requires a decision. Continuing doesn't. The path of least resistance is another bite. Hormonal satiation lags 15-20 minutes behind intake (CCK/GLP-1 peak delay) — the plate can be empty before the stop signal arrives. This is the default state of eating at a restaurant or someone else's home, where the portion was decided for you.
- **Social eating.** Everyone else is still eating. Stopping means sitting there with an empty plate or announcing you're done. The social pressure isn't dramatic — it's just easier to keep going. Pace-matching is unconscious.
- **Takeout avoidance.** The food is still there and getting it boxed up is a chore. Especially at the soup kitchen or a community meal where takeout isn't an option — you eat what you can because the rest is gone when you leave.
- **Scarcity response.** When food has been unreliable, eating everything available is rational. The body doesn't trust that there will be more later. This isn't binge eating (no loss of control, no shame) — it's a learned survival pattern. Characters with food insecurity history eat more when food is present. The "clean your plate" reflex.
- **It's just good.** Dopamine from a meal that hits right. The comfort food that keeps giving. Not seeking dopamine from a deficit — receiving it from a genuinely satisfying meal and not wanting to stop. Rare in this simulation (most meals are functional, not transcendent), but real.

Mechanically, the stomach system already supports all of this — `fillStomach()` doesn't cap, hormonal satiation is a separate signal with its own decay. What would be needed: contextual modifiers on eating interactions that allow continued eating past the first satiation signal (a "keep eating" or "finish the plate" follow-up interaction that appears when stomach is getting full but food is still available). Prose carries the experience — the fullness arriving, the decision to keep going or stop, the different reasons why.

---

## Appetite vs. Hunger

Hunger and appetite are different things. The simulation currently treats them as one — `hunger` accumulates, eating reduces it. But the gap between "the body is sending hunger signals" and "the character wants to eat" is where a lot of the interesting food behavior lives.

**Hunger** is physiological. Ghrelin rises, blood glucose drops, the stomach is empty. The body wants fuel. This is what the current `hunger` state variable models.

**Appetite** is psychological. The *desire* to eat — which food appeals, whether eating sounds good at all, the motivation to start the process. Appetite can be present without hunger (comfort eating, boredom eating, social eating) and absent despite hunger (depression, grief, anxiety, sensory overload, medication side effects).

**What suppresses appetite (hunger present, desire absent):**
- **Depression** — nothing sounds good. No food appeals. The effort of deciding exceeds the motivation. The low-serotonin flatness where eating is mechanical if it happens at all.
- **Grief** — acute grief can suppress appetite for days. The signal goes quiet under the weight of something else. Not nausea — just absence of want.
- **Acute anxiety** — CRH pathway. The same cortisol system that drives stress eating when *sustained* suppresses appetite when *acute*. The knot in the stomach. The meal you can't start because the body is in threat mode.
- **Sensory overload** — for autism/sensory-sensitive characters. When the sensory environment is too much, adding food-sensory-input (texture, temperature, chewing) is aversive. Not the same as ARFID texture restriction — this is a state-dependent gate, not a trait-dependent one.
- **Pain** — severe pain suppresses appetite. Gastritis is already modeled (eating eases it), but other pain (cramps, migraine, injury) suppresses desire to eat even when the stomach is empty.
- **Heat** — hot weather suppresses appetite. `ambientTemperature()` already exists as a pure derived function. Simple coupling.
- **Nicotine** — appetite suppression is a known effect. Already a substance in the sim. Appetite *increase* on withdrawal is part of why quitting is hard.
- **Stimulant medication** — ADHD meds suppress appetite hard. The "forgot to eat all day because the medication killed the signal" pattern. Rebound hunger when it wears off. (Medication system not yet built.)
- **Cannabis withdrawal** — appetite loss already noted in withdrawal profile.
- **Pregnancy nausea** — covered by the nausea→hunger suppression pathway physically, but the specific experience (aversions to the *idea* of a food, not its physical properties) is distinct.

**What produces appetite without hunger (desire present, body doesn't need fuel):**
- **Low dopamine** — food as the most available reward. The fridge-as-dopamine-button pattern from the ADHD section.
- **Comfort-seeking** — low serotonin driving toward foods associated with safety/warmth. The comfort food sentiment.
- **Habit/routine** — "it's lunchtime" even though you ate late. The clock says eat, the body doesn't.
- **Social context** — someone else is eating. Food is present. The smell triggers desire.
- **Cannabis** — munchies. Already modeled as hunger increase, but it's really appetite increase (desire, not depletion).
- **Boredom** — nothing else to do. Food is stimulation. Related to dopamine but not identical.

**Implementation sketch:** An `appetite` modifier (0.0–1.0, default 1.0) that scales eating interaction availability or attractiveness. At low appetite, eating interactions are still available (you *can* eat) but carry a reluctance cost — slower, worse prose, possible nausea if forced. At high appetite without hunger, snack/impulse interactions surface more readily. The habit system would learn appetite patterns too — if you always eat at noon regardless of hunger, the habit fires at noon.

This is the bridge between the hunger system (body) and the eating system (behavior). Currently missing. Not blocking anything immediate but shapes the entire disordered eating design.

---

## Implementation Order

1. **Food profile at chargen** — generate dietary identity from backstory. Store on character.
2. **Expand pantry vocabulary** — more ingredient categories, character-specific active set.
3. **Expand cooking interactions** — repertoire-based, skill-gated, profile-aware prose.
4. **Expand buy interactions** — per-ingredient purchasing at corner store.
5. **Habit feature extraction** — add pantry levels to the ~35-feature vector.
6. **Snack/impulse layer** — NT-driven availability and suggestion weighting.
7. **Prose passes** — shopping experience by money tier, cooking by skill and tradition, the pantry description that says who lives here.
8. **Dietary restrictions** — health-condition gates, substitution logic, access gaps.
9. **Grocery store location** — deferred until food desert mechanic exists.

---

## Open Questions

- **Pantry description in kitchen location prose.** The kitchen description should reflect what's in the pantry — not as inventory ("you have 3 eggs") but as texture ("the shelf with the rice and the beans and the hot sauce that's almost empty"). This is a location-description problem: it can't consume RNG (called from UI.render). Tier-based, like everything else.
- **Spoilage model scope.** Eggs (21-day) and bread (7-day) already have decay timers. Fresh produce would need similar tracking. How much spoilage modeling is worth the complexity? A wilting banana is good prose. A full freshness-tracking system is a lot of state. Probably: produce has a coarse freshness tier (fresh/wilting/bad), decays on a per-item timer. Bad food is thrown away or eaten with consequences.
- **Cooking failure.** Low skill + complex meal = longer time + possible failure? Or just worse prose? Burning something is realistic and funny and sad. But it means the hunger wasn't addressed and the ingredients were consumed. That's a meaningful consequence — probably worth modeling.
- **Meal sharing.** Cooking for someone else (a friend who visits, a neighbor) is a social interaction that's deeply tied to food identity. Deferred but worth noting.
- **Leftovers.** Cook once, eat twice. A realistic pattern that reduces cooking frequency. Requires tracking "prepared food" as a fridge item distinct from groceries. Adds complexity but is a strong texture detail — the tupperware in the fridge, the thing you made yesterday that you're eating cold.
