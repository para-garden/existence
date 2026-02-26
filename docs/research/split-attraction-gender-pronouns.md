# Split Attraction Model, Gender Identity, and Pronoun Systems

Research for implementation in the existence simulation. Focus: mechanically relevant behavioral patterns, social energy costs, daily cognitive load -- not categorization taxonomies.

---

## 1. Attraction Dimensions

### The Split Attraction Model (SAM)

The SAM posits that different forms of attraction operate independently. A person can be heterosexual and aromantic, or asexual and biromantic, etc. The core academic research is thin -- the first peer-reviewed study specifically on the SAM was Winer 2025 (Social Currents), drawing on 77 interviews with ace-spectrum individuals.

Sources: [Winer 2025 — Social Currents](https://journals.sagepub.com/eprint/VQASFIBDZNKEV5QXJTJC/full), [AUREA attraction terms](https://www.aromanticism.org/en/attraction-relationship-terms), [Nordic Larp SAM application](https://www.nordiclarp.org/2021/02/22/sex-romance-and-attraction-applying-the-split-attraction-model-to-larps/)

### Dimensions and Their Simulation Relevance

**Tier 1 — Mechanically impactful on daily life:**

| Dimension | Definition | Daily-life simulation impact |
|-----------|-----------|------------------------------|
| **Sexual** | Desire for sexual contact with specific person(s) | Drives relationship formation patterns, response to sexual content in media/culture, social scripts around dating. Absence (ace) → navigating allonormative assumptions as cognitive load. |
| **Romantic** | Desire for romantic contact/partnership | Shapes response to amatonormativity (cultural pressure that romantic love is universal/necessary). Absence (aro) → distinct social navigation costs. Presence → attachment patterns, jealousy dynamics, NPC relationship seeking. |
| **Sensual/tactile** | Desire for non-sexual physical closeness (hugging, cuddling, leaning against) | Affects comfort with physical proximity, touch-hunger dynamics, what physical contact costs vs. restores socially. Independent of sexual attraction — an ace person may deeply crave or be averse to touch. |
| **Aesthetic** | Appreciation for someone's appearance/beauty | Affects perceptual prose — what the character notices about people. Distinct from wanting contact. An ace person with strong aesthetic attraction notices beauty constantly; it just doesn't route to desire. Shapes idle observations, people-watching quality. |

**Tier 2 — Relationship-texture relevant (matters when relationships exist):**

| Dimension | Definition | Simulation relevance |
|-----------|-----------|---------------------|
| **Platonic** | Drawn to someone as a friend | Drives friendship-seeking intensity, social need fulfillment paths. Low platonic attraction → smaller social world, more self-sufficient. |
| **Alterous** | Emotional closeness that is neither clearly platonic nor romantic — a "nonbinary form of attraction" | Models ambiguous attachment — the character wants closeness but the closeness doesn't fit romance or friendship categories. Creates navigational friction in a world that demands you pick one. |
| **Queerplatonic** | Committed non-romantic partnership at "partner status" | A relationship structure, not an attraction type per se. Relevant when modeling relationship forms: cohabitation, life-planning, financial entanglement, next-of-kin — without romance. |

### What Matters for the Simulation

Not all seven dimensions need separate parameters. The mechanically significant split is:

1. **Sexual orientation** (who, if anyone, triggers sexual desire) — already partially modeled as `sexuality`
2. **Romantic orientation** (who, if anyone, triggers romantic desire) — NOT currently modeled; defaults to matching sexual orientation
3. **Touch comfort** (sensual attraction/aversion spectrum) — affects physical proximity costs, social energy recovery from contact
4. **Aesthetic sensitivity** (strength of beauty-noticing) — affects perceptual prose, idle observations about people

Alterous and queerplatonic are relationship-structure outcomes that emerge from the first four parameters rather than needing their own dimensions. A character who is aro but has strong platonic attraction and high touch comfort naturally produces the conditions for QPR-like relationships.

---

## 2. Orientation Labels as Behavioral Patterns

### Sexual Orientation Spectrum (Ace Spectrum)

The key research distinguishing behavioral patterns: Bogaert 2004 (PMID 15497056 — foundational asexuality study), Zheng & Su 2018 (PMID 29542105 — desire/behavior differences), and the Ace Community Surveys.

| Label | Behavioral pattern | Simulation mapping |
|-------|-------------------|-------------------|
| **Asexual** | No sexual attraction to anyone. May still have sex (for partner, curiosity, sensory) but not driven by attraction. "Disinterest-Disgust" most frequent motivation framing. | `sexual_attraction: 0`. Social scripts around sex are navigated as obligation/performance/curiosity, not desire. Allonormative pressure is a constant background cognitive cost. |
| **Demisexual** | Sexual attraction only after strong emotional bond forms. NOT "prefers to know someone first" — it's a qualitative absence→presence switch. 69.3% cite emotional connection as primary driver. | `sexual_attraction_mode: 'bonded'`. Attraction is gated by `connection_depth` threshold with specific person. Before bond: functionally ace. After: attraction to that person specifically. |
| **Graysexual** | Rare, weak, or conditional sexual attraction. Highly variable — some experience it a few times in life, others in specific circumstances. ~40% cite emotional connection as reason. | `sexual_attraction: low` + stochastic. Attraction events are rare and unpredictable. The character may go months/years without experiencing it. |
| **Allosexual** | Regular sexual attraction (the cultural "default"). | `sexual_attraction: normal`. Current `sexuality` field already covers the gender-direction component. |

Source: [Bogaert & Brotto — Ace spectrum distinctions](https://pubmed.ncbi.nlm.nih.gov/34919461/), [Cranney 2020 — sex and the ace spectrum](https://pubmed.ncbi.nlm.nih.gov/31799860/), [PMC10920473 — desire/fantasy across ace spectrum](https://pmc.ncbi.nlm.nih.gov/articles/PMC10920473/)

### Romantic Orientation Spectrum (Aro Spectrum)

| Label | Behavioral pattern | Simulation mapping |
|-------|-------------------|-------------------|
| **Aromantic** | No romantic attraction. May form deep committed partnerships (QPRs) but they don't feel "romantic." Cultural romance scripts feel alien or performative. | `romantic_attraction: 0`. Amatonormativity navigation as cognitive/social cost. Valentine's Day, wedding talk, "when are you settling down" — each is a microaggression the character must process. |
| **Demiromantic** | Romantic attraction only after deep emotional bond. Similar switch mechanism to demisexual. | `romantic_attraction_mode: 'bonded'`. |
| **Grayromantic** | Rare or conditional romantic attraction. | `romantic_attraction: low`. |
| **Alloromantic** | Regular romantic attraction (cultural default). | `romantic_attraction: normal`. |

Source: [PMC10903686 — Exploring Aromanticism qualitative study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10903686/), [AUREA research overview](https://www.aromanticism.org/en/research)

### Cross-Cutting: The Split Matters

The simulation significance: sexual and romantic orientation can diverge. Common combinations with distinct behavioral signatures:

- **Ace + alloromantic**: Seeks romantic partnership without sexual desire. Navigates partners' expectations. Romance without sex is the desired mode.
- **Allosexual + aro**: Experiences sexual attraction without romantic attachment. Navigates a culture that links sex to love. "Just sex" is stigmatized.
- **Ace + aro**: Neither sexual nor romantic attraction. Full independence from coupled-life scripts. Deepest navigation of amatonormativity + allonormativity simultaneously.
- **Demi + demi**: Both attractions gated by bond depth. Slow relationship formation. Long periods appearing ace/aro before bond threshold.

---

## 3. Daily Life Texture

### Asexuality — Daily Simulation Effects

**Allonormative cognitive load:**
Allonormativity (the assumption that sexual attraction is universal) creates a constant background navigation cost. Sources: [Springer — Affective Injustice](https://link.springer.com/article/10.1007/s11406-025-00939-1), [Chasin 2023 — Allonormativity and Compulsory Sexuality](https://www.researchgate.net/publication/370717427_Allonormativity_and_Compulsory_Sexuality)

Concrete manifestations:
- **Media consumption**: Sexual content in TV/film/ads registers differently — not as titillating but as noise, confusion, or alienation. Prose about watching content should shade differently.
- **Social conversation**: When colleagues/friends discuss attraction, crushes, dating — the ace character is navigating whether to disclose, fake engagement, redirect, or sit silently. This is social energy expenditure with no social reward.
- **Workplace**: Sexual jokes, "hot take" culture, discussions of attractiveness — each is a small friction. Not traumatic, but cumulative.
- **Internal processing**: For ace characters who haven't fully self-accepted, there may be self-questioning ("am I broken?"). For self-accepted ace characters, there's still the gap between internal experience and cultural narrative.

**Social energy effects:**
- Ace characters don't have *more* social energy — they spend it on different things. The energy that allosexual characters spend on attraction-pursuit gets redirected to other social activities or simply doesn't get spent.
- Social situations heavy on sexual content (parties, bars, dating-culture conversations) cost *more* social energy for ace characters because the navigation is active rather than passive.

**Mental health:**
Higher rates of depression in ace populations (Pitcher et al. 2023 — outness study). Not intrinsic to asexuality but to minority stress from allonormativity. Outness is protective (higher self-esteem when more out). Source: [Pitcher et al. 2023](https://shine.lab.uconn.edu/wp-content/uploads/sites/3321/2023/07/Pitcher-et-al.-2023.pdf)

### Aromanticism — Daily Simulation Effects

**Amatonormative pressure:**
Amatonormativity (the assumption that romantic love is universal and necessary for fulfillment) is the aro equivalent of allonormativity but arguably more pervasive — romance structures legal systems (marriage), housing norms (couples/families), social milestones ("settling down"), holidays (Valentine's Day), and casual conversation ("are you seeing anyone?").

Source: [PMC10903686 — aromantic qualitative study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10903686/)

Concrete manifestations:
- **Holiday texture**: Valentine's Day, wedding season, anniversary culture — each carries a specific micro-cost for aro characters. Not grief (they don't want what they're "missing") but irritation or alienation at the assumption they should want it.
- **Social scripts**: "When are you getting married?" "You just haven't met the right person." "You'll change your mind." — each is a small aggression that costs social energy to navigate. Qualitative research describes these as making aro people feel "less human."
- **Media**: Romance plotlines in all media — the aro character notices the saturation. Prose about consuming media should shade toward awareness of the romantic frame rather than investment in it.
- **Friendship valuation**: Aro people often describe friendships as their primary relationships. The simulation should allow friendships to fill the emotional/social role that romance fills for alloromantic characters — same depth of connection, same grief at loss.
- **Relief/freedom axis**: Discovering aro identity described as "a sigh of relief" — the realization that the pressure was external, not a personal failing. Characters who have found this frame have lower baseline stress from amatonormativity than those still questioning.

### Aesthetic Attraction — Perceptual Texture

Aesthetic attraction shapes what the character *notices* about people. It is not desire — it's perception.

- **High aesthetic attraction**: The character's idle observations about people are richer. They notice how light catches someone's hair, the geometry of a face, the way someone moves. This is a perceptual channel, like being more sensitive to sound or color. It feeds into prose about people-watching, being in public, seeing a new person.
- **Low aesthetic attraction**: People's appearances don't register as notable. Prose about crowds is about movement, sound, density — not individual faces.
- **Aesthetic attraction without sexual attraction** (common in ace people): The character notices beauty without it routing to desire. "She's beautiful" is complete — it doesn't imply "and I want..." This is a distinctive perceptual mode that shapes prose naturally.

Source: [AZE Journal — What is Aesthetic Attraction](https://azejournal.com/article/2022/8/18/what-is-aesthetic-attraction), [Archer Magazine — aesthetic attraction and asexual spectrum](https://archermagazine.com.au/2017/04/aesthetic-attraction/)

### Touch/Sensual — Physical Proximity Texture

Independent of sexual attraction. Shapes:
- **Touch-seeking**: Character seeks hugs, physical closeness, leaning against people. Touch is restorative (reduces stress, feeds social connection). Physical isolation is a specific deprivation distinct from social isolation.
- **Touch-averse**: Physical contact costs energy rather than restoring it. Crowded spaces have a tactile dimension of discomfort. Personal space violations are more salient.
- **Touch-neutral**: Physical contact is neither sought nor avoided. Doesn't register as notable.

This is already partially modeled by the social/sensory system but isn't separated from sexual/romantic contact.

---

## 4. Pronoun System Architecture

### Current State

The codebase has 5 pronoun values: `she/her`, `he/him`, `they/them`, `she/they`, `he/they`. These are stored as strings and used in prose via `Character.get('pronouns')`.

### Common Neopronoun Sets

From the [2025 Gender Census](https://en.wikipedia.org/wiki/Neopronoun) (43,096 non-binary respondents):
- **xe/xem** — 8.8% of respondents (most popular neopronoun)
- **fae/faer** — 6.2%
- **ze/zir** — 5.7%
- **it/its** — used by some nonbinary people (contentious; some find it dehumanizing, others reclaim it)
- **ey/em** — Elverson pronouns
- **ve/ver**, **per/per**, **thon/thon** — less common

32.9% of surveyed non-binary people used neopronouns (self-selected survey of gender-diverse individuals).

### Full Declension Paradigms

Source: [Nonbinary Wiki — English neutral pronouns](https://nonbinary.wiki/wiki/English_neutral_pronouns)

The pronoun system needs 5 grammatical slots per set:

| Set | Subject | Object | Poss. Det. | Poss. Pro. | Reflexive |
|-----|---------|--------|------------|------------|-----------|
| she/her | she | her | her | hers | herself |
| he/him | he | him | his | his | himself |
| they/them | they | them | their | theirs | themselves |
| xe/xem | xe | xem | xyr | xyrs | xyrself |
| ze/hir | ze | hir | hir | hirs | hirself |
| ze/zir | ze | zir | zir | zirs | zirself |
| ey/em | ey | em | eir | eirs | emself |
| fae/faer | fae | faer | faer | faers | faerself |
| ve/ver | ve | ver | vis | vis | verself |
| per/per | per | per | per | pers | perself |
| it/its | it | it | its | its | itself |

### Recommended Architecture

Replace the string-based pronoun system with a pronoun object:

```js
// Pronoun set as structured object
const PRONOUN_SETS = {
  'she/her':   { subject: 'she',  object: 'her',  det: 'her',  pos: 'hers',  ref: 'herself',   plural: false },
  'he/him':    { subject: 'he',   object: 'him',  det: 'his',  pos: 'his',   ref: 'himself',   plural: false },
  'they/them': { subject: 'they', object: 'them', det: 'their',pos: 'theirs',ref: 'themselves', plural: true },
  'xe/xem':    { subject: 'xe',   object: 'xem',  det: 'xyr',  pos: 'xyrs',  ref: 'xyrself',   plural: false },
  'ze/hir':    { subject: 'ze',   object: 'hir',  det: 'hir',  pos: 'hirs',  ref: 'hirself',   plural: false },
  'ey/em':     { subject: 'ey',   object: 'em',   det: 'eir',  pos: 'eirs',  ref: 'emself',    plural: false },
  'fae/faer':  { subject: 'fae',  object: 'faer', det: 'faer', pos: 'faers', ref: 'faerself',  plural: false },
  'it/its':    { subject: 'it',   object: 'it',   det: 'its',  pos: 'its',   ref: 'itself',    plural: false },
};
```

Key design decisions:
- **`plural` flag**: `they/them` conjugates differently ("they are" vs "she is"). Neopronouns are singular ("xe is").
- **Mixed sets** (`she/they`, `he/they`): Store as array of two set keys. Prose randomly alternates (on cosmetic RNG when implemented, deterministic rotation for now).
- **Verb conjugation**: `plural` determines "is/are", "has/have", "does/do", "was/were", "-s" suffix.
- **Accessor API**: `Character.pronoun('subject')`, `Character.pronoun('det')`, etc. — returns the correct form. For mixed sets, returns one of the two options (alternation strategy TBD).

---

## 5. Gender as a Continuous/Multi-Dimensional Space

### Research Basis

The Gender Self-Report (GSR) — McGuire et al. 2023 (PMID 36716136, [PMC10697610](https://pmc.ncbi.nlm.nih.gov/articles/PMC10697610/)) — is the most methodologically rigorous tool. Administered to 1,654 individuals across gender-diverse, cisgender sexual minority, and cisgender heterosexual populations.

**Two stable factors emerged from factor analysis:**
1. **Female-Male Continuum (FMC)** → transformed to **Binary Gender Diversity**: degree of identification with the gender opposite that implied by sex designated at birth. High = strong cross-gender identification.
2. **Nonbinary Gender Diversity**: degree of identification with a gender that is neither male nor female. High = strong nonbinary identification.

These are orthogonal — a person can score high on both (bigender, genderfluid), low on both (agender), or high on one.

### Complementary Dimensions for Simulation

Beyond identity, a simulation needs:

**A. Internal felt sense (identity)** — the GSR's two dimensions:
- `gender_binary` — position on female-male axis (0 = fully aligned with ASAB, 100 = fully cross-identified)
- `gender_nonbinary` — strength of nonbinary identification (0 = none, 100 = strong)

**B. Expression/presentation** — how the character presents externally:
- `expression_femininity` — degree of feminine-coded presentation (clothing, grooming, mannerisms)
- `expression_masculinity` — degree of masculine-coded presentation
- These are independent (androgynous = both moderate-to-high; agender presentation = both low)

**C. Congruence** — alignment between felt sense and presentation/perception:
- `gender_congruence` — derived, not stored. Computed from distance between identity dimensions and expression dimensions + social perception. Low congruence → dysphoria potential. High congruence → euphoria/relief.
- This is the mechanically critical dimension — it drives daily cognitive load, social energy costs, and emotional texture.

**D. Social perception** — how others read the character:
- Derived from expression + body + voice + clothing. Not stored as state — computed when needed.
- The gap between social perception and internal identity is where dysphoria/euphoria lives.

Source: [PMC6911960 — neurobiological model of gender dysphoria](https://pmc.ncbi.nlm.nih.gov/articles/PMC6911960/), [PMC8363999 — nonbinary dysphoria experience](https://pmc.ncbi.nlm.nih.gov/articles/PMC8363999/)

### Gender Dysphoria and Euphoria as Simulation Mechanics

**Dysphoria** is not a binary — it's a continuous distress signal from incongruence. For nonbinary/genderfluid individuals, it fluctuates with felt gender. Source: [PMC8363999](https://pmc.ncbi.nlm.nih.gov/articles/PMC8363999/)

Simulation-relevant manifestations:
- **Body dysphoria**: Triggered by body-awareness moments (showering, dressing, mirrors). Intensity modulated by `gender_congruence`. Shapes prose about the body.
- **Social dysphoria**: Triggered by misgendering, gendered language, gendered spaces (bathrooms). Each instance is a discrete stressor with NT impact (cortisol spike, serotonin dip).
- **Clothing dysphoria**: Certain clothing items interact with body features to create or relieve dysphoria. Binder already partially modeled.

**Euphoria** is the positive counterpart — not just absence of dysphoria. Source: [PMC9255216](https://pmc.ncbi.nlm.nih.gov/articles/PMC9255216/)

Simulation-relevant manifestations:
- **Recognition euphoria**: Being gendered correctly, hearing correct name/pronouns. Discrete positive event — serotonin/dopamine nudge.
- **Expression euphoria**: Wearing clothes that feel right, presenting in a way that matches felt sense. Continuous positive modifier while dressed/presented that way.
- **Congruence euphoria**: Broader sense of "this is right" — lower baseline stress, better social energy recovery.

For genderfluid characters, felt gender shifts over time, and the same presentation can produce euphoria one day and dysphoria another. This is the simulation's most demanding case.

### Mapping to Existing Categories

| Identity | gender_binary | gender_nonbinary | Expression pattern |
|----------|--------------|-----------------|-------------------|
| Cis woman | ~0 (aligned with AFAB) | ~0 | Varies freely |
| Cis man | ~0 (aligned with AMAB) | ~0 | Varies freely |
| Trans woman | ~90-100 (cross from AMAB) | ~0-20 | Feminine, with variation |
| Trans man | ~90-100 (cross from AFAB) | ~0-20 | Masculine, with variation |
| Nonbinary | 20-80 (variable) | 60-100 | Androgynous/variable |
| Agender | 0-20 | 20-60 (absent-gender) | Variable, often minimal |
| Genderfluid | Oscillates | Variable | Shifts with felt gender |
| Bigender | High | High | May alternate or blend |
| Demigender | 30-60 | 30-60 | Partial alignment |

### Current Codebase Gap

The current system stores `pronouns` (5 options), `trans` (boolean), `trans_presentation` (transmasc/transfem/nonbinary/null), and `hrt_active` (boolean). This is a categorical system. The gap:

- No continuous gender dimensions — identity is collapsed into pronouns + trans flag
- No expression/presentation dimensions separate from identity
- No congruence tracking → no dysphoria/euphoria mechanics
- No romantic orientation separate from sexual orientation
- No attraction dimensions beyond `sexuality` (straight/gay/bisexual)
- Pronouns stored as string, not structured object

---

## 6. Implementation Priorities for the Simulation

### What to add (ordered by impact on daily-life texture):

**High impact — changes prose/experience constantly:**
1. **Romantic orientation** separate from sexual orientation — unlocks aro/ace-split characters whose daily texture differs fundamentally
2. **Pronoun object system** — structured pronoun data replacing string matching, supporting neopronouns and mixed sets
3. **Gender congruence** as derived metric — the dysphoria/euphoria axis that shapes body-awareness prose, clothing interactions, social encounters

**Medium impact — shapes specific interactions:**
4. **Touch comfort spectrum** — affects physical proximity costs, social energy from contact vs. solitude
5. **Aesthetic sensitivity** — shapes perceptual prose about people (idle observations, crowd descriptions)
6. **Allonormative/amatonormative stress** — background cognitive cost for ace/aro characters in romance/sex-saturated social contexts

**Lower priority — relationship mechanics (not yet relevant):**
7. **Demisexual/graysexual bonding gate** — attraction conditioned on connection_depth
8. **QPR/alterous relationship structures** — emerge from other parameters when relationship system exists

### Chargen Parameter Sketch

```
// Attraction dimensions
sexual_attraction:      0-100 (0=ace, 100=strong allosexual)
sexual_attraction_mode: 'default' | 'bonded' (demisexual gate)
romantic_attraction:    0-100 (0=aro, 100=strong alloromantic)
romantic_attraction_mode: 'default' | 'bonded' (demiromantic gate)
touch_comfort:          0-100 (0=averse, 50=neutral, 100=seeking)
aesthetic_sensitivity:  0-100 (how strongly beauty registers)

// Gender dimensions
gender_binary:          0-100 (alignment with vs. cross from ASAB)
gender_nonbinary:       0-100 (nonbinary identification strength)
expression_femininity:  0-100 (current feminine presentation)
expression_masculinity: 0-100 (current masculine presentation)
// gender_congruence: derived from above + social perception

// Existing (extend)
pronouns:               structured object (see section 4)
sexuality:              direction of attraction (straight/gay/bi/pan)
```

### Prevalence Data for Chargen Rolls

- **Asexual spectrum**: ~1% strictly asexual (Bogaert 2004 PMID 15497056), ~4% ace-spectrum including gray/demi (community surveys — prevalence rates variable, no consensus PMID)
- **Aromantic spectrum**: ~1% strictly aromantic (community surveys — no rigorous population prevalence study with confirmed PMID exists yet)
- **Demisexual**: Subset of ace-spectrum; ratio within ace community ~25-30% (Ace Community Survey — PMID unverified)
- **Graysexual**: Subset of ace-spectrum; ratio within ace community ~15-20% (Ace Community Survey — PMID unverified)
- **Trans/nonbinary**: ~0.8% trans (already in chargen); nonbinary identification within trans population ~30-40% (community surveys — PMID unverified)
- **Neopronoun usage**: ~1% of general LGBTQ+ youth; ~33% of nonbinary people (Gender Census 2025 — self-selected, not population-representative)

---

## 7. Key Citations

### Peer-reviewed (PMID verified where noted):
- Bogaert 2004 — PMID 15497056 (asexuality prevalence)
- Brotto & Yule 2017 — asexuality review (in Bogaert & Brotto 2021 PMID 34919461 — ace spectrum distinctions)
- McGuire et al. 2023 — PMID 36716136 (Gender Self-Report)
- Pitcher et al. 2023 — outness and adjustment in ace individuals
- PMC8115827 — cognitive processing in asexual individuals
- PMC8363999 — nonbinary dysphoria experiences
- PMC9255216 — gender euphoria community understandings
- PMC6911960 — neurobiological gender dysphoria model
- PMC10903686 — aromantic lived experience qualitative study
- PMC10920473 — desire/fantasy across ace spectrum

### Community surveys and grey literature (no PMID):
- Gender Census 2025 (43,096 respondents) — pronoun/neopronoun usage rates
- Ace Community Survey (annual) — ace/gray/demi proportions
- AUREA 2019 survey — aromantic stigmatization
- AUREA 2018 survey — allosexual aromantic daily life
- Nonbinary Wiki — pronoun declension tables

### Terms:
- **Allonormativity**: assumption that sexual attraction is universal (analogous to heteronormativity but about presence/absence of attraction, not direction)
- **Amatonormativity**: assumption that romantic love is universal and necessary for fulfillment (coined by Elizabeth Brake, 2012)
- **ASAB**: assigned sex at birth
