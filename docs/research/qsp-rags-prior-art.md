# Prior Art: QSP and RAGS Ecosystems as Text-Based Life Simulation References

Research conducted 2026-02-23. Purpose: systems-completeness reference for life simulation model design.

---

## 1. QSP (Quest Soft Player)

### What It Is

QSP is a Russian interactive fiction engine created by Val "Byte" Argunov in 2001, designed for menu-based (choice-driven) text adventures. It displaced earlier Russian IF platforms (URQ, RTADS) because the menu interface bypassed the challenges of Russian-language parsing, lowered author effort, and produced a more active community. By 2007 it had over 100 contributors, with 10-20 actively publishing at any given time. An annual competition (QSP-Compo) ran from 2008 onward with the largest prize pool in Russian IF history.

**Technical capabilities:**
- Scripting language with 32-bit integer and string variables (strings up to 2GB)
- Named arrays (every variable is internally an array)
- Control flow: if/elseif/else, loops with step control
- Regular expression support, enabling custom syntax analyzers
- Dynamic code execution (`DYNAMIC` statement generates code at runtime)
- Timer support for scheduled/delayed events
- Cross-platform: Windows, Android, Linux, macOS, PSP, PocketBook
- Web player: qSpider (HTML5)
- Games are `.qsp` binary packages; source is typically `.txt` files compiled via `txt2gam`

The language is general-purpose enough to support unbounded simulation complexity — there is no architectural constraint on the number or type of state variables. Complexity scales with author effort, not engine limits.

**Community and ecosystem:**
- Primarily Russian-language games, though notable titles have English community ports
- Content skews adult but the engine is content-neutral
- Source: [IFWiki QSP entry](https://www.ifwiki.org/QSP), [QSPFoundation GitHub](https://github.com/QSPFoundation/qsp), [Val Argunov buymeacoffee](https://buymeacoffee.com/varg)

---

### Notable QSP Title: Girl Life (ЭТО / Девичья жизнь)

**Origin:** Based on the Russian game "ЭТО" by DeGross. English Community Version maintained by Kevin Smarts at [gitlab.com/kevinsmartstfg/girl-life](https://gitlab.com/kevinsmartstfg/girl-life). Also mirrored at GitHub under Thekingofsweden/glife and Wexed/glife.

**Genre self-description:** "Life simulation with RPG, strategy, and magical combat elements." The game is an open sandbox — no prescribed sequence. The player starts as a schoolgirl (or cursed schoolgirl, or male-to-female character) in a small Russian town and navigates daily life, earning money, managing social standing, and pursuing various paths.

**What the game tracks at the model level:**

**Primary Attributes (9):**
- Strength, Agility, Endurance, Intelligence, Reaction, Spirit, Charisma, Perception, Magic
- Attributes degrade without regular training; each drives associated skills

**Status Attributes (10 real-time condition variables):**
- Health, Hunger, Thirst, Stamina, Mana, Willpower, Arousal, Pain, Mood, Sleep
- Mood is influenced by addictions, hygiene, and game events; it affects interaction choices and has secondary effects on Health
- Hunger/Thirst are depleted by time, restored by eating/drinking specific items
- Sleep affects stamina recovery and mood

**Derived/Special Attributes:**
- Attractiveness (composite, appearance-driven)
- Inhibition (behavioral gate)
- School Grades (academic track)
- Heel Wearing Ability (specific skill for footwear)

**Physical appearance state:**
- Body weight category (determines which image sets display; weight changes with diet/exercise)
- Muscle amount (`musle`, `trenbuf`)
- Height (`pcs_hgt`)
- Tan level, skin condition, sweatiness, makeup state, hair state
- Apparent age separate from actual age (`vidage`)
- Teeth count (`pcs_teeth`) — tracking dental state

**Clothing and inventory:**
- Durability tracking per worn item (each day of wear decrements durability by 1 in original QSP version)
- Specific bra-wearing state tracked separately
- Handbag with consumables: sandwiches, water bottles, painkillers, mouthwash, contraceptives, shampoo, tampons, vitamins, etc.
- Weapon (gun + bullets)
- Umbrella state

**Reproductive/biological cycle:**
- Menstruation cycle tracking (hours remaining until next period)
- Fertility tracking (unfertilized eggs, fertilized zygotes, implantation status)
- Pregnancy state, progression value, due date, awareness/denial flags
- Birth control shot with days-remaining counter
- Womb damage state

**Substances:**
- Neurobooster, steroids, aphrodisiacs as discrete inventory items
- Smoking/drinking tracked via addiction system affecting Mood

**Reputation system:**
- `GorSlut` — town-level reputation variable; threshold-driven (at 3+, leaving the disco with a man triggers behavior expectations)
- Multiple reputation tracks by location and social group (school reputation vs. town reputation)
- Renown system as separate tracked metric

**Relationship system (per-NPC variables):**
- `npc_love[id]` — affection level per NPC
- `npc_horny[id]` — arousal state per NPC
- `npc_dom[id]` / `npc_sub[id]` — dominance/submissiveness per NPC
- `term_relationship[id]` — duration of relationship in days
- General relationship points threshold (60+ = friend status)
- Social group affiliation (cliques: Cool Kids, Nerds, etc.)
- NPC visit unlock based on friendship depth

**Job system (~25 jobs):**
- Cleaning lady at clinic: 100 rubles/1 hour, daily
- Cleaning at train station: 250 rubles/2 hours, daily
- Hotel maid: 375 rubles + tips/2-3 hours, daily
- Barbershop: 125 rubles/hour, during business hours
- Mail delivery: 450 rubles/up to 3 hours, Saturdays only
- Flyer distribution: 50 rubles/hour, unlimited
- Office secretary: ~6700/week, requires hotcat >= 5 (attractiveness threshold)
- Governess: ~25k/month
- Tour guide: seasonal (June, July, August only)
- Masseuse: requires certification
- Modeling: skill requirement
- Adult work: minimum age / inhibition threshold gates
- Factory seamstress: Mon-Fri schedule
- Plus approximately 15 more categories
- Each job has: pay rate, hours cost, days-available, prerequisite stat checks

**Time and schedule:**
- Game runs on a real calendar with time of day tracked in hours
- Jobs have specific opening hours (e.g., barbershop during business hours)
- Events are time-gated (mushroom/berry truck: 9am-12pm; night hunting: 9pm-4am)
- Weekly patterns (some jobs weekdays only, mail Saturdays)
- Seasonal availability for some jobs
- School schedule runs on weekdays

**Skills system:**
- Each primary attribute drives associated skills
- Sports progression: kickboxing (amateur/professional record, rank 1-5), swimming (local/bronze/silver/gold competition medals, rank 1-6), chess (rank 1-7, world ranking 1-3)
- Teacher credibility stat
- Fight record (Win/Loss)

**Magic system:**
- Separate magic skill tree with unlockable spells (9 base + elemental trees for fire, lightning, earth)
- Element alignment (`stihia`) gates elemental spell access

**Pregnancy system:**
- Full female reproductive cycle simulation: ovulation, fertilization, implantation, gestation tracking to due date
- Separate birth control mechanic with duration tracking

**Research source:** [Girl Life Wiki](https://sites.google.com/view/girllifewiki/home), [Dynamic Input Codes List](https://sites.google.com/view/girllifewiki/game-mechanics-and-guides/cheat-menu/dynamic-input-codes-list), [QOL Mod NPC Wiki](https://github.com/toolkitxx/Girl-life-QOL-quality-of-life-mod/wiki/Relationship-and-NPC), [GitLab source](https://gitlab.com/kevinsmartstfg/girl-life)

**Systems design observation:** Girl Life is one of the most complete text-based daily life simulations known. Its scope is broader than most: it models the female reproductive cycle, clothing durability, per-item inventory, per-NPC emotional state, job schedules with real time-of-day and day-of-week constraints, multiple competitive sports with ranking systems, and a magic system — all simultaneously. The time system is a real 24-hour clock, not abstract turns. The job system uses real pay rates in rubles calibrated to Russian wages. This makes it useful as a systems-completeness reference for what "thorough" actually looks like at the model level.

---

### Other QSP Titles

The ecosystem has over 2,800 games but most are Russian-language with little English documentation. Notable for systems research:

- **Clean Slate** (mugwump): Open-world sandbox. Tracks dom/sub behavioral tendency via buffer accumulation (mc_domBuff, mc_subBuff — sleep resets buffers and converts to permanent stat change). Also tracks traits, jobs, buffs, outfits. Engine: QSP. More focused on transformation mechanics than daily life simulation.
  - Source: [Clean Slate Wiki](https://clean-slate-qsp.fandom.com/wiki/Clean_Slate_(QSP)_Wiki), [Stats page](https://clean-slate-qsp.fandom.com/wiki/Stats)

- The ecosystem also produced numerous smaller games ("over 100 authors") but comprehensive documentation is primarily in Russian and not available through English-language web research.

---

## 2. RAGS (Rapid Adventure Game System)

### What It Is

RAGS was created around April 2006 by "Steve" (developer identity not further documented). Website launched January 2007. It is a Windows-only point-and-click game creation suite — a Designer (authoring tool) + Player (runtime). The game format is binary and encrypted; source code is not inspectable outside the Designer tool.

**Technical capabilities:**
- Visual authoring — no scripting in the traditional sense; logic is configured through a GUI
- Custom character properties/attributes (configurable numeric/string variables per character object)
- Object and room state tracking
- Inventory system
- Timer functionality (named timers)
- Dialogue/choice systems
- Character portrait display
- Compass-based room navigation
- Save system: saves are complete game state snapshots (deltas against original)

**Limitations:**
- Windows-only native player (serious barrier to distribution)
- Game files are encrypted — cannot be inspected or modded without the Designer
- Web export ("Save To Web Format") is marked BETA and only works for very simple games
- "RAGS didn't get much traction as a vehicle for traditional Interactive Fiction and is mostly used these days for pornography" — IFWiki
- Regalia is a third-party browser-based RAGS 2.x player: [github.com/selectivepaperclip/regalia](https://github.com/selectivepaperclip/regalia)
- Rags2Html is another converter: [kassy2048.github.io/rags2html](https://kassy2048.github.io/rags2html/)

**Community and ecosystem:**
- Primary community: TFGames.site (transformation-focused adult game community, ~2,840 games total across all engines)
- RAGS niche within that community: transformation-themed games, particularly TG/feminization narratives
- No significant mainstream or non-adult RAGS game presence

---

### Notable RAGS Titles

**No Haven** (Bedlam Games):
- A fantasy "slaver manager sim" — the player leads a band of slavers on assignments
- What it tracks: gold (primary currency), supplies, enslaved character roster, slaver traits/aspects, assignment outcomes, reputation, random weather events (global bonuses/penalties), "endearment" mechanic (avoidance/advantage purchase), corruption meter, biomancy progression
- Character traits include: personality traits (Cowardly, Greedy, Dominator), physical traits, racial traits, role assignments (slaver/mercenary/slave, fluidly convertible)
- Mercenaries consume gold only; full slavers consume supplies
- Win condition: 10,000 gold (loose — it's primarily a sandbox)
- Note: Not a personal daily-life simulation. It is a group management/resource sim with character-level attribute tracking.
- Source: [No Haven Wiki](https://no-haven.fandom.com/wiki/No_Haven), [Bedlam Games Tumblr](https://bedlamgames.tumblr.com)
- Final RAGS version: 0.991; developer subsequently migrated away from RAGS

**Magical Camp** (HLF):
- Day-based progression (similar to Persona series structure: morning/day/dinner time/night phases)
- Relationship-building mechanic with fellow trainees — generates gameplay buffs
- No traditional stats/leveling system: character attributes derive from equipment worn, transformations undergone, and relationship trust levels
- Combat system with elemental strengths/weaknesses
- Tracks: team composition, transformation progression (physical and psychological), dungeon completion, relationship levels
- Source: [RAWG entry](https://rawg.io/games/magical-camp), [Patreon CE development](https://www.patreon.com/posts/magical-camp-ce-88701227)

**Monline** (Revilo): VR-themed transformation content; transformation-focused rather than life simulation. Little systems documentation available.

**General RAGS design pattern:**
RAGS games tend to track character-level attributes but lack the continuous time system, real-world schedule mechanics, and daily-needs simulation common in QSP life sims. The engine's GUI-based design makes implementing fine-grained simulation difficult relative to a scripting engine. Most RAGS games treat simulation more as RPG stat management (traits, levels, discrete events) than continuous daily-life modeling.

---

## 3. Comparison: QSP vs. RAGS vs. Twine/SugarCube

### Simulation Depth Comparison

| Dimension | QSP | RAGS | Twine/SugarCube |
|-----------|-----|------|-----------------|
| State variable complexity | Unbounded (scripting language) | Moderate (GUI-configured properties) | Unbounded (JavaScript) |
| Time modeling | Real 24-hour clock common in life sims | Discrete turns or events typical | Varies by implementation |
| Needs simulation | Hunger, thirst, fatigue, mood, sleep as standard in top titles | Simple attribute tracking, rarely daily needs | Varies; possible but uncommon |
| Job/schedule systems | Real-world time constraints, day-of-week patterns | Event-based, no real clock | Possible; rare in practice |
| NPC state tracking | Per-NPC emotional state variables (love, arousal, dominance) | NPC attitudes configurable | Possible; variable by game |
| Financial simulation | Realistic pay rates, bill cycles in top titles | Currency tracking; rarely bill cycles | Possible; variable by game |
| Body simulation | Weight, reproductive cycle, clothing durability, dental | Physical appearance attributes | Possible; rare |
| Accessibility | Windows/Android native, qSpider web | Windows-only (Regalia for web) | Web-native, no install |
| Source inspection | Plain text source files (txt2gam) | Binary, encrypted | Plain HTML/JS |
| Moddability | High (plain text source) | None without Designer | High |
| Community | Russian-primary; adult content focus | English; adult content focus | English; broader range |

### Structural difference

QSP's scripting-language model gives it the same theoretical expressiveness as JavaScript/SugarCube. The difference is cultural: the Russian QSP life sim tradition (especially Girl Life) invested heavily in modeling the texture of daily life — time-of-day, day-of-week, seasonal job availability, realistic pay rates calibrated to local wages, per-NPC emotional state — as the core gameplay rather than a supporting layer. This makes QSP life sims unusually complete as systems references even though the content focus is often adult.

RAGS sits in a different design space: it was built for simple point-and-click narratives with character portraits and compass navigation. Its GUI-based logic configuration limits simulation granularity in practice. The most notable RAGS games (No Haven, Magical Camp) use it for group-management or RPG-style mechanics rather than continuous daily-life simulation.

Twine/SugarCube has the same theoretical capability as QSP but the community that uses it for life simulation (primarily on TFGames.site and itch.io) tends toward lighter stat tracking and narrative branching over deep simulation infrastructure. The most simulation-complete Twine life sims (Degrees of Lewdity, Free Cities/Pregmod) achieve QSP-level depth, but this is due to author investment, not engine advantage.

---

## 4. Standout Titles by Systems Completeness (Cross-Ecosystem)

### Degrees of Lewdity (Twine/SugarCube, Vrelnir)
Primary source: [wiki](https://degreesoflewdity.miraheze.org/wiki/Gameplay_Mechanics), [Current Condition page](https://degreesoflewdity.miraheze.org/wiki/Current_Condition), [Statistics page](https://degreesoflewdity.miraheze.org/wiki/Statistics)

**What it tracks:**

Real-time condition variables:
- Pain (0-200; incapacitation at 100+)
- Arousal (0-10,000)
- Fatigue (0-2,000; max doesn't cause fainting — but causes rapid stress/trauma growth)
- Stress (0-10,000; high stress causes blackouts)
- Trauma (0-5,000; long-term psychological damage; triggers traits at thresholds)
- Control (0-1,000; confidence/agency metric; rape reduces it; affects passive stress decay rate)
- Allure (0-8,000; attractiveness/assault-risk; clothing, beauty, transformation-driven)
- Alcohol, Drugs, Hallucinogens (0-1,000 each; distinct behavioral effects)

Characteristics:
- Awareness (-200 to 1,000)
- Purity (0-1,000)
- Physique (0-12,000)
- Willpower (0-1,000)
- Beauty (0-10,000)
- Promiscuity, Exhibitionism, Deviancy, Submissiveness, Masochism, Sadism (various ranges)

Social metrics:
- School grades/status
- Multiple fame tracks: sex fame, combat fame, kindness fame
- Delinquency rating

Transformation tracks (multiple non-human forms, each with progression 30-50 points to completion):
- Wolf, cat, harpy, cow, angel, demon

Statistics (persistent counters):
- Virginities — who took each type (oral, anal, vaginal, penile, handholding, kissing)
- Jobs — work performed at strip club, café, brothel, docks, farms; produce/flower sales
- Violence — molested/raped event counts (trait unlocks at milestones)
- Dates tallied per NPC
- Gambling stats (blackjack performance)
- Misc: passed-out events, arrests

Resources:
- Money (cash excluding sellable goods)
- Time (exact time of day and date)
- Warmth (clothing-dependent)
- Clothing durability, fluid coverage, parasite tracking

**Systems design observation:** DoL's stat system is notable for its trauma/stress/control triad — the game models psychological resilience as a mechanical system, not just flavor text. Control's effect on passive stress decay is a direct simulation of how agency loss makes recovery harder. Fatigue not directly causing harm but accelerating harm accumulation (by raising stress/trauma gain rate) is mechanically sophisticated.

---

### Free Cities / Pregmod (Twine/SugarCube)
Primary source: [gitlab pregmod repo](https://gitgud.io/pregmodfan/fc-pregmod), [slave variables documentation](https://gitgud.io/pregmodfan/fc-pregmod/-/blob/pregmod-master/slave%20variables%20documentation%20-%20Pregmod.txt) (77.3 KB documentation file — the variable list is large enough to require its own document)

**What it tracks (per character, from documentation structure):**
The pregmod "slave variables documentation" file is 77.3 KB of variable descriptions — one of the most extensively documented per-character state systems in text game history. Categories include: physical measurements and body parts (including dozens of per-part modifiers), health conditions, psychological states, skill levels, social history, sexual history, financial valuation, reproductive state, and behavioral programming. The game operates as a colony management sim where each managed character is modeled with this level of granularity.

**Systems design observation:** FC/Pregmod is the densest known per-character state model in text game history. Its utility as a completeness reference is high, but the framing (slave management colony sim) means the systems serve a different power dynamic than a first-person life sim. The data model shows what "all possible human characteristics" look like when enumerated for prose generation.

---

### Girl Life (QSP) — see Section 1 above

Most complete daily-life-as-first-person-experience simulation found. The combination of:
- Real 24-hour clock with time-of-day and day-of-week job scheduling
- 25+ jobs with real pay rates and schedule constraints
- Per-NPC emotional state tracking (love, arousal, dominance, relationship duration)
- Full female reproductive cycle
- Clothing durability per item
- Hunger/thirst/sleep as independent tracked needs
- 9 primary attributes with skill trees
- Multiple competitive sports with ranking ladders
- Reputation at multiple spatial scales (school vs. town vs. group)
- Addiction mechanics affecting Mood

...makes it the clearest reference for what "thorough" looks like in a first-person daily-life text sim.

---

## 5. What These Ecosystems Model That Is Less Common Elsewhere

Items found in QSP/RAGS life sims that are underrepresented in mainstream IF:

1. **Real-time 24-hour clocks with day-of-week patterns.** Girl Life tracks job availability by specific hours AND specific days of the week, not just abstract "day" increments. Tour guide seasonal availability. This models employment reality more accurately than most simulations.

2. **Per-item clothing durability.** Girl Life decrements each worn item's durability daily. Items wear out, need replacement, have condition state.

3. **Full reproductive cycle simulation.** Girl Life tracks ovulation, fertilization, implantation, gestation with due date, plus birth control duration counters. This is a complete female biology model, not just a pregnancy flag.

4. **Per-NPC multi-dimensional emotional state.** Love + arousal + dominance + submissiveness + relationship duration per NPC. Not a single "friendship points" number.

5. **Spatial and social scale reputation.** Multiple reputation tracks at different scopes: one NPC group, one school, one town — not a single global reputation score.

6. **Addiction as mood modifier.** Smoking, drinking tracked as addiction states that affect Mood, not just as inventory items.

7. **Competitive sports progression.** Amateur and professional records, multi-tier ranking systems (local, regional, world) for multiple sports simultaneously.

8. **Dental state.** `pcs_teeth` variable. Dental health is tracked as a separate state. (Unusual in text sims.)

9. **Trauma/stress/control triad with mechanical coupling** (DoL). Psychological resilience modeled as a system where loss of control mechanically impairs recovery, not just narrative flavor.

10. **Regulation capacity during sleep** — in existence's own model, this parallels the DoL insight that recovery isn't uniform and that psychological state affects how well sleep works.

---

## Sources

- [QSP - IFWiki](https://www.ifwiki.org/QSP)
- [QSPFoundation GitHub](https://github.com/QSPFoundation/qsp)
- [Val Argunov (QSP creator) Buymeacoffee](https://buymeacoffee.com/varg)
- [QSP Russian IF history - SPAG Issue #48 (2007)](https://www.spagmag.org/archives/backissues/spag48.html)
- [RAGS - IFWiki](https://www.ifwiki.org/RAGS) (and [R.A.G.S. variant](https://www.ifwiki.org/R.A.G.S.))
- [Regalia RAGS browser player - GitHub](https://github.com/selectivepaperclip/regalia)
- [Girl Life Wiki (main)](https://sites.google.com/view/girllifewiki/home)
- [Girl Life Wiki - Skills and Attributes](https://sites.google.com/view/girllifewiki/game-mechanics-and-guides/skills-and-attributes)
- [Girl Life Wiki - Jobs](https://sites.google.com/view/girllifewiki/game-mechanics-and-guides/making-money/jobs)
- [Girl Life Wiki - Dynamic Input Codes List](https://sites.google.com/view/girllifewiki/game-mechanics-and-guides/cheat-menu/dynamic-input-codes-list)
- [Girl Life QOL Mod NPC/Relationship Wiki](https://github.com/toolkitxx/Girl-life-QOL-quality-of-life-mod/wiki/Relationship-and-NPC)
- [Girl Life GitLab (Kevin Smarts)](https://gitlab.com/kevinsmartstfg/girl-life)
- [Clean Slate (QSP) Wiki](https://clean-slate-qsp.fandom.com/wiki/Clean_Slate_(QSP)_Wiki)
- [No Haven Wiki](https://no-haven.fandom.com/wiki/No_Haven)
- [TFGames.site Notable Games - Transfiction Wiki](https://tgf.miraheze.org/wiki/Notable_Games_on_TFGS)
- [Degrees of Lewdity Wiki - Gameplay Mechanics](https://degreesoflewdity.miraheze.org/wiki/Gameplay_Mechanics)
- [Degrees of Lewdity Wiki - Current Condition](https://degreesoflewdity.miraheze.org/wiki/Current_Condition)
- [Degrees of Lewdity Wiki - Statistics](https://degreesoflewdity.miraheze.org/wiki/Statistics)
- [Free Cities Pregmod GitLab](https://gitgud.io/pregmodfan/fc-pregmod)
- [Free Cities Pregmod slave variables documentation](https://gitgud.io/pregmodfan/fc-pregmod/-/blob/pregmod-master/slave%20variables%20documentation%20-%20Pregmod.txt)
- [Text sim - Wikipedia](https://en.wikipedia.org/wiki/Text_sim)
