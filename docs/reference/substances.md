# SUBSTANCES.md

Design reference for substance mechanics in *existence*. Captures the
dependency model used for caffeine and the template for future substances.

*Citations added 2026-02-20. Key sources listed inline below.*

---

## Core Model

Every substance follows the same arc:

1. **Acute effect** — the substance alters some NT or physiological state
   while present. Varies by substance.
2. **Tolerance** — repeated use causes the brain to compensate
   (receptor upregulation, transporter changes, etc.). The same dose does
   progressively less over time.
3. **Baseline shift** — once tolerance is established, the user's resting
   state *without* the substance is worse than a non-user's baseline.
   They're not getting a lift; they're getting back to what non-users feel
   for free.
4. **Withdrawal** — when the substance is absent, the compensated brain
   is now exposed. The upregulated receptors (or downregulated
   transporters) that were compensating for the substance's presence
   now operate without opposition. The result is the *opposite* of the
   acute effect, often amplified.
5. **Dependency** — the loop closes: you feel bad without it, take it to
   feel normal, feel relief (which isn't pleasure — it's just absence of
   withdrawal). The substance is now load-bearing.

---

## Caffeine — Implemented

### Mechanism
- Blocks adenosine A1/A2A receptors → wakefulness, elevated NE
- Chronic use → receptor upregulation (more receptors, higher sensitivity)
- Removal → adenosine flood on a sensitized receptor population
- GI involvement: adenosine receptors in the gut + brainstem chemoreceptor
  trigger zone (area postrema) + vagus nerve → nausea, vomiting at severe
  withdrawal levels
- Vascular: caffeine is a vasoconstrictor. Removal → cerebral vasodilation
  → the throbbing, positional caffeine headache (distinct from migraine)

### State variables
- `caffeine_level` (0–100): active blood level, half-life ~5h (Statland & Demas 1980, PMID 7361718; range 3–7h per StatPearls PMID 30137774)
- `caffeine_habit` (0–100): tolerance tracker; grows +8/day with daily
  peak ≥ 40 units, fades −5/day without
- `caffeine_withdrawal` (0–100): symptom intensity; builds ~6 pts/hr at
  habit=100 without caffeine; clears ~25 pts/hr when caffeinated
- `caffeine_today_peak`: daily peak for habit tracking; reset at wakeUp
- `nausea` (0–100): shared state, caffeine withdrawal builds this at
  severe levels (withdrawal > 55 + habit > 45)

### Severity arc (habit=100, cold turkey)
- Hours 0–4: mild headache building
- Hours 4–10: moderate withdrawal, meaningful adenosine amplification,
  adenosine sensitivity effect kicks in (extra ~2 pts/hr accumulation)
- Hours 10–18: severe withdrawal, nausea begins, NE elevated, dopamine
  suppressed, cognitive fog worse than non-user baseline
- Hours 18–30: peak. Flu-like. Nausea active. Concentration impossible.
- Days 3–7: gradual resolution as receptor count downregulates back down
  *(Juliano & Griffiths 2004, PMID 15448977 — onset 12–24h, peak 20–51h, duration up to 9 days)*

### Approximation debts
- No tolerance on the *acute* effect: `consumeCaffeine(50)` always gives
  50 units regardless of habit. A high-habit user should get ~70% of the
  caffeine_level boost (fewer "spare" receptors to block). Not yet
  implemented — the withdrawal loop captures the dependency experience
  well enough for now.
- No true receptor count simulation: sensitivity is modeled as a
  multiplier on adenosine accumulation during withdrawal, not as a
  separate receptor upregulation state. Fine for this granularity.

---

## Hunger vs. Stomach Fullness

These are distinct and both matter for substances.

**`hunger`** — the felt signal. Ghrelin-driven, time-accumulating, suppressed by
stomach stretch receptors and nausea. 0 = not hungry, 100 = starving.

**`stomach_fullness`** — physical contents. 0 = empty, 100 = full. Filled by
eating, drained by digestion (~20 pts/hr). Suppresses the hunger accumulation
rate proportionally (empty stomach → hunger builds at full rate; full stomach →
hunger barely rises). Vomiting empties this, not hunger directly.

**Why the split matters for substances:**
- Vomiting on a full stomach: expulsion, `stomach_fullness → ~5`, hunger signal
  unchanged immediately (nausea still suppressing it). Character doesn't feel
  hungry right after vomiting — the nausea is still there.
- Dry heaving (stomach empty): the body goes through the motion but nothing
  comes up. No stomach change, less nausea relief, worse energy cost.
- Eating when nauseated: `stomach_fullness` rises normally, but the hunger
  signal doesn't normalize because nausea is still overriding it. The food
  is in there; the body just isn't registering relief.
- Future: alcohol on an empty vs. full stomach — absorption rate difference
  (food in stomach slows alcohol absorption, delays and blunts the curve).
- Future: medication absorption is also stomach-content-dependent.

---

## Future Substances

### Shared infrastructure

`nausea` (0–100) is already general-purpose — any substance can write to
it. Natural decay ~2 pts/hr.

Each new substance needs:
- `{substance}_level` — active blood/brain level
- `{substance}_habit` — tolerance tracker
- `{substance}_withdrawal` — symptom intensity
- A `{substance}Tier()` function for prose branching
- A `{substance}WithdrawalTier()` function
- Hooks into NT targets or tick NT adjustments

### Template for withdrawal tick
```js
if (s.{substance}_habit > THRESHOLD) {
  if (s.{substance}_level < LOW) {
    // Withdrawal builds
    const rate = (s.{substance}_habit / 100) * MAX_RATE;
    s.{substance}_withdrawal = Math.min(100, s.{substance}_withdrawal + rate * hours);
    // Receptor upregulation effect — amplify the relevant NT
    // NT effects proportional to withdrawal depth × habit
  } else if (s.{substance}_level >= CLEAR_THRESHOLD) {
    s.{substance}_withdrawal = Math.max(0, s.{substance}_withdrawal - CLEAR_RATE * hours);
  }
  // NT effects from withdrawal
}
```

---

## Nicotine

### Mechanism
- Activates nicotinic acetylcholine receptors (nAChR)
- Acute: dopamine release in nucleus accumbens (reward), NE rise (alertness)
- Chronic: nAChR upregulation (more receptors, especially α4β2 subtype)
- Withdrawal: dopamine *below* non-smoker baseline (anhedonia), elevated
  irritability, NE dysregulation, intense craving
- The break isn't relaxation. It's the withdrawal stopping.
- Half-life: nicotine ~2h, cotinine (metabolite) ~16h (Benowitz et al. 2009, PMID 19184645, PMC2953858)

### Withdrawal character
- Irritability is the dominant feature (not headache like caffeine)
- Concentration difficulty
- Increased appetite (orexigenic effect of nicotine withdrawal)
- Craving as a distinct mechanical state — not just "want to smoke"
  but an intrusive, attention-stealing drive

### Social layer
- The smoke break as a workplace ritual — separate from the substance
  effect. Social time, legitimized absence from the floor.
- The smell. Who knows, who doesn't. Who has opinions.
- Outdoor space access — smokers go outside. Non-smokers don't always.

---

## Alcohol — Implemented (2026-02-24)

*State vars: `alcohol_level`, `alcohol_tolerance`, `alcohol_withdrawal`, `alcohol_sleep_flag`, `has_alcohol`.
Home drinking via `drink_alcohol`; corner store purchase via `buy_alcohol`.
See STATUS.md Substances section for full implementation summary.*

### Mechanism
- GABA-A agonist + NMDA antagonist → sedation, disinhibition, analgesia (Valenzuela 1997, PMID 15704351, PMC6826822)
- Acute curve: push (loosening) → plateau (sedation) → cost (impairment)
- Chronic: GABA-A downregulation, NMDA upregulation (excitatory
  compensation)
- Withdrawal (severe): the excitatory compensation is now unopposed.
  This is medically dangerous — unlike caffeine or nicotine, alcohol
  withdrawal can kill (seizures, delirium tremens).
- Nausea/vomiting from acute excess (acetaldehyde buildup)
- Hangover: acetaldehyde, dehydration, sleep architecture disruption

### Severity arc (alcohol-dependent, cold turkey)
*(Jesse et al. 2017, PMID 27586815, PMC6084325; Schuckit 2014, PMID 25427113)*
- Hours 6–24: tremor, sweating, anxiety, insomnia
- Hours 24–48: peak danger. Seizure risk. Hallucinations (alcoholic
  hallucinosis — distinct from DTs).
- Hours 48–72: delirium tremens risk — confusion, autonomic instability,
  fever. Can be fatal without medical intervention.
- This means **cold turkey from severe alcohol dependence is medically
  contraindicated**. The simulation should reflect this — a character
  at high alcohol_habit who goes cold turkey should face severe,
  potentially fatal withdrawal.

### Social/support layer (see below)

---

## Cannabis — Implemented (2026-02-24)

*State vars: `cannabis_level`, `cannabis_tolerance`, `cannabis_withdrawal`, `cannabis_sleep_flag`, `has_cannabis`.
Home smoking via `smoke_cannabis` (bedroom); corner store purchase via `buy_cannabis`.
See STATUS.md Substances section for full implementation summary.*

### Mechanism
- CB1 agonist → indirect mesolimbic dopamine release (distinct from alcohol's direct GABA-A agonism)
- Emotional blunting: key phenomenological effect — reduced amplitude of NT drift toward extremes
- REM suppression with acute use (THC-dominant cannabis); rebound vivid dreams in withdrawal
- Mild GABA modulation via presynaptic CB1 inhibition of GABAergic interneurons
- Ref: Bhattacharyya et al. 2010 (PMID 20231922); Huestis 2007 (PMID 17990166)

### Withdrawal character
- Much milder than nicotine or alcohol; not medically dangerous
- Dominant feature: flat affect, not sharp irritability (contrast with nicotine)
- Sleep disruption (rebound REM — vivid/disturbing dreams)
- Appetite disruption (body recalibrating without CB1 modulation of hunger signaling)
- Ref: Budney 2003 (PMID 12954796); Schlienz 2018 (PMID 29679997)

### Approximation debts
- Emotional blunting implementation: per-tick NT nudge toward midpoint (50) rather than proper
  drift-engine target compression. Functional but architecturally approximate.
- Jurisdiction: `buy_cannabis` assumes legal access; real availability varies enormously.
- All rate values marked `// Approximation debt (cannabis):` at use site.

---

## Recovery Pathways

### Cold turkey
The abrupt-cessation approach. Appropriate for:
- Caffeine (unpleasant, not dangerous)
- Cannabis (uncomfortable, not dangerous)
- **Not appropriate for** alcohol or benzodiazepines at high dependence
  (seizure/death risk)

Mechanics: the withdrawal arc plays out without intervention. The character
white-knuckles it. Prose should carry the specific texture of each substance's
withdrawal — not generic "feels bad."

### Tapering
Gradual dose reduction. Medically recommended for alcohol and
benzodiazepines. Reduces peak withdrawal severity.

Mechanics: player controls intake, but the habit tracker decays slowly.
A taper schedule would mean holding at a lower daily intake than the habit
level would drive, letting habit slowly fall before stepping down again.
This is a future mechanic — requires the player to have explicit awareness
of what they're managing and why.

### Medically supervised withdrawal
A doctor or facility manages the process. For alcohol: benzodiazepines are
used to prevent seizures during withdrawal (cross-tolerance on GABA-A).
For opioids: methadone or buprenorphine maintenance.

Mechanics: requires healthcare access (jurisdiction-dependent, cost-dependent).
Opens interactions like "take medication" that modify the withdrawal arc.
Not implemented yet — requires healthcare access as a first-class system.

### Alcoholics Anonymous / Narcotics Anonymous / support groups
Peer support model. Twelve-step or secular alternatives (SMART Recovery).
Requires attendance (time cost), provides social contact (social tier benefit),
reduces relapse risk through accountability and community.

Mechanics:
- Meeting as an interaction (time, location — church basement, community center)
- Sponsor as a relationship (like friend slots — contact, accountability)
- The working of steps as a slow background process
- Relapse as a real possibility — the model doesn't punish it narratively,
  but the physiological state (habit re-escalation) is honest about what
  happens to tolerance after a break
- The culture: the serenity prayer, the chips, the coffee, the folding
  chairs. The people who are in the same room as you for the same reasons.

### Rehab (inpatient / residential)
Structured, residential withdrawal management and early recovery.
Removes the character from their normal environment (and triggers).
Time-intensive (28 days is the cultural shorthand, but varies).

Mechanics:
- A major time commitment — work, relationships, housing all affected
- Cost: highly variable and often prohibitive (insurance, sliding scale,
  wait lists)
- The character is effectively "paused" in their daily life
- What they come back to: same apartment, same triggers, same people.
  The environment hasn't changed. That's the hard part.
- Not a cure — a start. Relapse rates are what they are.

---

## Opioids (future)

### Mechanism
- Mu-opioid receptor agonists. Prescribed (oxycodone, hydrocodone) or
  not (heroin, fentanyl).
- Acute: profound analgesia, euphoria, sedation, slowed breathing
- Chronic: receptor desensitization and internalization, endogenous opioid
  suppression. The body stops making its own.
- Withdrawal: flu-like but intensely worse. Not dangerous in itself (unlike
  alcohol) but subjectively described as the worst experience of a person's
  life. Vomiting, diarrhea, muscle cramps, insomnia, agitation, cold sweats.
  Lasts 5–7 days acute; months of protracted withdrawal (anhedonia, craving).
  *(Kosten & O'Connor 2003, PMID 12724485; Pergolizzi et al. 2019, PMID 30701615, PMC6590307)*

### Prescription pathway
The doctor who cuts you off. The pharmacy that looks at you a certain way.
The gap between the last prescription and the next one. The moment the
problem stops being about pain management and starts being about something
else — even though the pain is still real.

### Harm reduction
- Naloxone (Narcan) — reversal agent. Requires access and someone nearby.
- Methadone / buprenorphine maintenance — daily clinic visit (methadone) or
  prescription (buprenorphine). Legal substitution. Stigmatized.
- Clean needles — requires access. Whether a character has access is
  jurisdiction-dependent.

---

## Design Notes

**Substances don't create moral weight.** The simulation describes. It
doesn't evaluate. A character who smokes isn't making a bad choice — they're
navigating a dependency that has its own logic and history.

**The relief isn't pleasure.** Once dependent, the substance restoring
baseline doesn't feel good — it feels like the absence of feeling bad.
Prose should capture this distinction. The first cigarette of the day isn't
enjoyable; it's the withdrawal stopping.

**Craving as an attention state.** A high-withdrawal character should have
craving thoughts surface in idle thoughts, intrude during other activities.
Not as moral pressure but as a cognitive/physiological reality — the brain
is solving for the substance.

**Environment matters.** Triggers are real. The same apartment where
someone used is full of cues. Recovery in a familiar environment is harder
than recovery in a new one. The simulation should model this eventually —
location-based craving amplification.

**Social consequences compound the substance.** Job loss, relationship
damage, financial drain — these interact with the neurochemical state.
A character deep in alcohol dependency isn't just dealing with the alcohol;
they're dealing with what the alcohol has done to the rest of their life.
