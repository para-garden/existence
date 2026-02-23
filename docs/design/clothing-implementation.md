# Clothing Full Implementation

**Relates to:** `js/clothing.js`, `js/chargen.js`, `js/content.js`, `js/runs.js`
**Supersedes:** outfit_default/outfit_low_mood/outfit_messy on character object
**Implements:** Step 4 of domestic objects path in `docs/design/objects.md`
**Depends on (not yet written):** `docs/design/body.md`

---

## Overview

The `coarse_v1` implementation tracks counts only. The `full_v1` implementation tracks each item individually — specific names, locations, wear states, and fit — enabling prose like "the grey hoodie from the chair" and making floor accumulation legible as a specific history.

The interface contract is defined in `docs/design/objects.md`. This document specifies the implementation.

---

## 1. Wardrobe Generation

### Real Drivers

Wardrobe size and composition depend on several independent axes. The correct model names them all, approximates from what's available, and marks the rest as debts pointing at specific future systems.

**Financial situation** — how much the character could afford to accumulate over time. Captured by `economic_origin` + `pay_rate`. The primary current input.

**Housing situation and stability** — stable housing enables accumulation over time; instability produces gaps, things left behind, whatever fit in bags. Not yet a backstory field.

**Discrete exit events** — the most significant truncations come from specific life history moments, not a continuous stability variable:
- Kicked out / aged out of foster care
- Ran from abuse or unsafe situation
- Left a relationship suddenly
- Ran from family (religious, cultural, safety) — may mean leaving a whole wardrobe context and having nothing appropriate for the new one

These are life history events with a **time dimension**: a character who ran from a situation five years ago has had five years to rebuild. The consequences are `(event type × time since event × financial situation since event)`, not just whether-it-happened. When the backstory system generates exit events as time-indexed entries, wardrobe generation should simulate accumulation from the event forward to the present, not just apply a flat penalty.

**Housing type — assumes housed.** The current location vocabulary (`stored`, `accessible`, `floor_bedroom`, `floor_bathroom`, `laundry_basket`) assumes a stable dwelling. Unhoused characters break this model entirely: everything is on the body, in a bag, or gone; the three-step laundry flow is meaningless; the item ceiling is what you can carry (~5–8 items regardless of income). When `housing_situation` is a backstory parameter, unhoused characters need a different location vocabulary. Until then this is an explicit approximation debt.

**Laundry access** — if you go to a laundromat every two weeks, you need more items to bridge the gap. Captured partially by housing type; fully when laundry access is a derived backstory field.

**Job type and tenure** — work-appropriate items accumulate with tenure. A new office worker may be wearing the same two outfits on rotation. Not yet a backstory field.

**Climate** — cold climates require outerwear; tropical climates don't. Captured now by `character.latitude`. Outerwear count should be zero for |lat| < 23.5°.

**Age and growth** — young characters may have items that were acquired when their body was different. A 19-year-old who grew through adolescence may have clothes from two years ago that no longer fit. This is a wardrobe-trajectory concern: items accumulated before a growth period may be present but non-functional. See §2 (Fit Model).

**Item fit** — items that no longer fit due to body changes still exist in the wardrobe. Whether an item is currently wearable is a dynamic property, not a generation question. Generate the full wardrobe as it exists; fit is computed separately. See §2.

### Wardrobe as Trajectory

The correct model is a **simulated trajectory** — like `simulateFinancialHistory()` — not a snapshot. Start from some point in the character's past, apply accumulation (income over time) and loss events (exit events, disasters) at specific simulated dates, arrive at the present. Items acquired at different times may have different fit states relative to the current body.

This is not yet implemented. The current approximation generates a snapshot from `economic_origin`. The debt is that accumulation-over-time, exit events with recovery time, and age-indexed fit are all collapsed into a single origin-based table. Document this debt clearly; when `simulateLifeHistory()` exists it should feed wardrobe generation directly.

### Current Approximation

Available inputs: `economic_origin`, `pay_rate`, `character.latitude`, `character.age` (if available). Everything else is a debt.

```js
// Approximation debt: wardrobe generation uses economic_origin as a snapshot proxy for
// (financial situation × housing stability × time-indexed exit events × job tenure ×
// laundry access × body trajectory). The correct model is a simulated trajectory —
// accumulation from some historical point forward, loss events applied at specific dates,
// items time-stamped with acquisition context so fit can be computed against body-at-acquisition.
// When simulateLifeHistory() exists, this function should draw from it directly.
```

**Wardrobe size by economic origin (housed, no recent exit event):**
```
precarious:   6–10 items
modest:       10–16 items
comfortable:  15–22 items
secure:       20–28 items
```

One `charRandom()` call maps into the range.

**Category distribution (items per type by origin):**

| type | precarious | modest | comfortable | secure |
|---|---|---|---|---|
| tops | 2–3 | 3–5 | 5–7 | 6–9 |
| bottoms | 1–2 | 2–3 | 3–4 | 4–5 |
| underwear | 2–4 | 4–6 | 6–8 | 7–10 |
| socks | 2–4 | 4–6 | 5–8 | 6–9 |
| shoes | 1 | 1–2 | 2–3 | 2–4 |
| outerwear | 0–1 | 1–2 | 1–3 | 2–4 |
| dress | 0 | 0–1 | 0–2 | 0–3 |

Outerwear overridden to 0 when `|latitude| < 23.5` (tropical).

**Starting condition by origin:**
```
precarious:   50% worn, 30% faded, 15% damaged,  5% good
modest:       30% worn, 40% faded, 10% damaged, 20% good
comfortable:  10% worn, 20% faded,  5% damaged, 65% good
secure:        5% worn, 10% faded,  0% damaged, 85% good
```
One `charRandom()` call per item.

**Starting location:**
```
precarious:   stored: 40%, accessible: 60%
modest:       stored: 60%, accessible: 40%
comfortable:  stored: 80%, accessible: 20%
secure:       stored: 90%, accessible: 10%
```
One `charRandom()` call per item. All items start `clean`. Starting fit derived from body state at chargen — see §2.

### Item Name Pools

Names are short, plain, recognizable. Tone comes from context, not from the name.

**Tops:**
```
grey hoodie, black hoodie, green hoodie, white t-shirt, black t-shirt, grey t-shirt,
striped t-shirt, flannel shirt, plaid flannel, blue button-down, white button-down,
crewneck sweatshirt, grey sweatshirt, tank top, ribbed tank, striped long-sleeve,
black long-sleeve, polo shirt
```

**Bottoms:**
```
dark jeans, black jeans, blue jeans, worn jeans, grey sweatpants, black sweatpants,
khakis, black slacks, shorts, athletic shorts, leggings, black leggings
```

**Dresses:** `black dress, grey dress, floral dress, jersey dress, shift dress`

**Underwear:** `underwear` (kept generic by design)

**Socks:**
```
white socks, black socks, ankle socks, crew socks, no-show socks,
striped socks, mismatched socks
```

**Shoes:**
```
sneakers, white sneakers, black sneakers, beat-up sneakers, canvas shoes,
work boots, ankle boots, boots, flats, sandals, slides
```

**Outerwear:**
```
winter coat, black coat, puffer jacket, denim jacket, rain jacket, grey jacket
```

Selection: `Math.floor(charRandom() * pool.length)` — one `charRng` call per item.

### RNG Call Budget

`generateWardrobe()` must be placed **last** in `generateRandom()`, after all other `charRng` calls. With no downstream calls after it, the count varies freely — a precarious character generates ~8 items, a secure character ~24. Each item consumes 3 calls (pool pick, condition, location); wear state is always `clean`, fit computed deterministically from body state (no RNG call). The stream ends at different lengths for different characters.

---

## 2. Fit Model

### Fit Is Primarily a Prose and Comfort Input

Fit state is **not** a wearability ladder. Most fit variation affects presentation and comfort, not whether the item can be put on. `wearableItems()` only filters items where fit is `too_small` — physically cannot go on. Everything else stays in the wearable pool.

The fit state is read by:
1. **Prose** — `outfitDescription()` and getting-dressed prose notice when something rides up, gaps, or pulls
2. **NT effects** — body-consciousness, self-perception, social anxiety — emerge from wearing ill-fitting clothes, not from a flag
3. **Wearability gate** — only at the extreme (`too_small`)

### Fit States

```
comfortable   — fits properly; no notable effect on prose or comfort
rides_up      — wearable; hem doesn't reach where it should, gap at front or side;
                prose notices; character is aware of it
tight         — wearable; physically uncomfortable; character is conscious of it all day;
                feeds body-awareness and discomfort signals
too_small     — physically cannot be put on; filtered from wearableItems()
too_large     — wearable but sits wrong; donated clothes, clothes from a heavier period
```

### Body Dimensions That Affect Fit

Fit is not computable from a single body-size scalar. Different garment types constrain different dimensions:

**Abdominal/torso dimension** — affected by pregnancy (progressive over trimesters), central weight gain/loss, bloating. Garments that constrain this: jeans, fitted trousers, waistbands, fitted dresses, underwear.

**Chest dimension** — affected by breast tissue development (puberty, pregnancy, HRT, weight change) and constitutional conditions (see below). Garments that constrain this: button-downs, fitted tops, bras, bikini tops, some dresses. **Importantly: this dimension is independent of abdominal.** A crop top or bikini bottom fits through abdominal change but may not fit through chest change. A hoodie tolerates both.

**These two dimensions move independently.** Early pregnancy: abdominal change minimal, breast change significant. Late pregnancy: abdominal change primary. HRT (feminizing): chest development may precede significant abdominal change. General weight gain: both increase together but not at the same rate.

### Garment Tolerance Profiles

Each garment type has a tolerance profile: which dimensions it constrains, and how forgiving:

| type | abdominal constraint | chest constraint | notes |
|---|---|---|---|
| jeans / slacks | high — rigid closure | none | first to stop closing with abdominal change |
| leggings | low — high stretch | none | tolerates wide abdominal range |
| hoodies / sweatshirts | none | none | survives almost all body changes |
| t-shirts | low | moderate | length/hem affected before fit fails |
| fitted tops | moderate | high | chest-sensitive; may pull or gap |
| button-downs | none | high | chest primary failure point; won't close |
| crop tops / bikini tops | none | high | survives abdominal change; chest-sensitive |
| bikini bottoms / underwear | moderate | none | waist and hip sensitive |
| dresses (shift/loose) | low | low | forgiving cut |
| dresses (fitted) | high | high | both dimensions constrained |
| bras | moderate (band) | high (cup) | sized on two dimensions; most sensitive item |
| outerwear | none | none | cut generously; very tolerant |
| shoes | none | none | essentially binary — fits or doesn't |
| socks | none | none | effectively always fit |

### Breast Tissue Simulation

Breast tissue development doesn't happen to all characters. Whether it occurs, and to what degree, must emerge from the character's generated biological parameters and life history — not be assumed. The relevant inputs (assigned sex at birth, puberty history, HRT history, pregnancy history, constitutional conditions) are all part of `docs/design/body.md`, which is not yet written.

**Constitutional conditions affecting chest fit specifically:**
- **Gigantomastia** — disproportionate breast tissue regardless of weight, pregnancy, or HRT. Fit problems are the baseline, not a deviation. Also: chronic back/shoulder pain, heat and skin issues, difficulty finding clothing that fits at all (button-downs may never close). Generated at chargen from real prevalence data — not announced, emerges from downstream effects.
- **Micromastia** — very little development regardless of ASAB or hormonal history.
- **Asymmetry** — common in varying degrees; affects fit differently than overall size; one side may be `comfortable` while the other is `tight`.
- **Poland syndrome** — unilateral underdevelopment, often includes pectoral involvement.
- **Post-mastectomy** — surgical history; may include reconstruction or not; prosthetics as daily objects with their own state.

These belong in `docs/design/body.md`. The clothing system needs body state to expose chest and abdominal dimensions so fit can be computed; how those dimensions are generated and tracked is the body document's concern.

### Fit Computation

```js
// Per item, at chargen and whenever body state changes significantly:
function computeFit(item, bodyState) {
  const profile = GARMENT_PROFILES[item.type];
  if (!profile) return 'comfortable';

  let abdominalFit = 'comfortable';
  let chestFit = 'comfortable';

  if (profile.abdominal_constraint !== 'none') {
    const delta = bodyState.abdominal - (item.abdominal_at_acquisition ?? bodyState.abdominal);
    abdominalFit = abdominalFitFromDelta(delta, profile.abdominal_constraint);
  }

  if (profile.chest_constraint !== 'none') {
    const delta = bodyState.chest - (item.chest_at_acquisition ?? bodyState.chest);
    chestFit = chestFitFromDelta(delta, profile.chest_constraint);
  }

  // Worst of the two dimensions determines overall fit
  return worseFit(abdominalFit, chestFit);
}
```

Items store `abdominal_at_acquisition` and `chest_at_acquisition` from body state at generation time. Fit is recomputed when body state changes. No RNG — purely deterministic from body parameters.

**Approximation debt until body.md is implemented:** body state has no dimensional structure. Fit is stored as `comfortable` for all items at chargen and is a static field until the body system exists to compute against.

---

## 3. Full clothing.js Implementation

### Data Model

```js
{
  id: string,           // 'top_0', 'top_1', 'bottom_0', etc.
  type: string,         // 'top' | 'bottom' | 'dress' | 'socks' | 'underwear' | 'shoes' | 'outerwear'
  name: string,         // 'grey hoodie'
  condition: string,    // 'good' | 'worn' | 'faded' | 'damaged'
  location: string,     // 'stored' | 'accessible' | 'on_body' | 'floor_bedroom' | 'floor_bathroom' | 'laundry_basket' | 'washing'
  wearState: string,    // 'clean' | 'worn_once' | 'worn_out' | 'dirty'
  fit: string,          // 'comfortable' | 'rides_up' | 'tight' | 'too_small' | 'too_large'
  // Stored for future fit recomputation when body.md system exists:
  abdominal_at_acquisition: number | null,
  chest_at_acquisition: number | null,
}
```

The module holds an internal `_items` array. All queries filter this array.

### Method Implementations

**`itemsOnFloor(location)`**
```js
function itemsOnFloor(location) {
  const key = location === 'bedroom' ? 'floor_bedroom' : 'floor_bathroom';
  return _items.filter(item => item.location === key);
}
```

**`wearableItems()`**
```js
function wearableItems() {
  return _items.filter(item =>
    item.fit !== 'too_small' &&
    (item.wearState === 'clean' || item.wearState === 'worn_once') &&
    (item.location === 'stored' || item.location === 'accessible')
  );
}
// Note: only too_small is filtered. rides_up, tight, too_large remain wearable.
// Fit state is picked up in prose, not used as a gate.
```

**`canGetDressed()`**
```js
function canGetDressed() {
  return wearableItems().length > 0
    || itemsOnFloor('bedroom').filter(i => i.fit !== 'too_small').length > 0
    || itemsOnFloor('bathroom').filter(i => i.fit !== 'too_small').length > 0;
}
```

**`dirtyCount()`**
```js
function dirtyCount() {
  return _items.filter(item =>
    item.location === 'floor_bedroom' || item.location === 'floor_bathroom'
    || item.location === 'laundry_basket' || item.wearState === 'dirty'
  ).length;
}
```

**`outfitDescription()`** — deterministic, no RNG; picks up fit state for prose
```js
function outfitDescription() {
  const worn = _items.filter(item => item.location === 'on_body');
  if (worn.length === 0) return '';
  const visible = worn.filter(item =>
    ['top', 'bottom', 'dress', 'outerwear'].includes(item.type)
  );
  if (visible.length === 0) return '';
  // Base description
  let desc;
  if (visible.length === 1) desc = visible[0].name;
  else if (visible.length === 2) desc = visible[0].name + ' and ' + visible[1].name;
  else {
    const last = visible[visible.length - 1];
    desc = visible.slice(0, -1).map(i => i.name).join(', ') + ', and ' + last.name;
  }
  // Fit modifier — appended as deterministic prose note
  const fitNotes = visible
    .filter(i => i.fit !== 'comfortable')
    .map(i => fitNote(i));
  if (fitNotes.length > 0) desc += ' ' + fitNotes[0]; // first notable fit issue
  return desc;
}

function fitNote(item) {
  if (item.fit === 'rides_up') return '(the hem doesn\'t quite reach)';
  if (item.fit === 'tight') return '(tighter than it used to be)';
  if (item.fit === 'too_large') return '(a size too big)';
  return '';
}
```

**`floorDescription(location)`**
```js
function floorDescription(location) {
  const floor = itemsOnFloor(location);
  if (floor.length === 0) return '';
  const visibleTypes = ['top', 'bottom', 'dress', 'outerwear'];
  const named = floor.filter(i => visibleTypes.includes(i.type));
  const misc = floor.filter(i => !visibleTypes.includes(i.type));
  const namedNames = named.map(i => i.name);
  if (namedNames.length === 0) {
    return misc.length === 1 ? 'Something on the floor.'
      : `${misc.length} things on the floor.`;
  }
  if (namedNames.length === 1 && misc.length === 0)
    return 'The ' + namedNames[0] + ' on the floor.';
  if (namedNames.length === 2 && misc.length === 0)
    return 'The ' + namedNames[0] + ' and the ' + namedNames[1] + ' on the floor.';
  const extra = floor.length - Math.min(namedNames.length, 2);
  let desc = 'The ' + namedNames[0];
  if (namedNames.length > 1) desc += ', the ' + namedNames[1];
  if (extra > 0) desc += `, and ${extra} other ${extra === 1 ? 'thing' : 'things'}`;
  return desc + ' on the floor.';
}
```

**`wear(itemId?)`**
```js
function wear(itemId) {
  if (itemId) {
    const item = _items.find(i => i.id === itemId);
    if (item) _markWorn(item);
    return;
  }
  const types = ['top', 'bottom', 'socks', 'underwear'];
  for (const type of types) {
    const candidates = wearableItems().filter(i => i.type === type);
    if (candidates.length === 0) {
      const floorCandidates = itemsOnFloor('bedroom')
        .filter(i => i.type === type && i.fit !== 'too_small');
      if (floorCandidates.length > 0) _markWorn(floorCandidates[0]);
    } else {
      const sorted = [...candidates].sort((a, b) => {
        // Prefer comfortable fit
        const fitScore = f => ({ comfortable: 0, too_large: 1, rides_up: 2, tight: 3 })[f] ?? 4;
        if (fitScore(a.fit) !== fitScore(b.fit)) return fitScore(a.fit) - fitScore(b.fit);
        if (a.location === 'accessible' && b.location !== 'accessible') return -1;
        if (b.location === 'accessible' && a.location !== 'accessible') return 1;
        if (a.wearState === 'clean' && b.wearState !== 'clean') return -1;
        if (b.wearState === 'clean' && a.wearState !== 'clean') return 1;
        return 0;
      });
      _markWorn(sorted[0]);
    }
  }
}

function _markWorn(item) {
  item.location = 'on_body';
  const singleUse = ['socks', 'underwear'];
  item.wearState = singleUse.includes(item.type) ? 'worn_out' : 'worn_once';
}
```

**`undress(dropTo)`**
```js
function undress(dropTo) {
  for (const item of _items) {
    if (item.location !== 'on_body') continue;
    item.location = dropTo;
    if (item.wearState === 'worn_once') item.wearState = 'worn_out';
    else if (item.wearState === 'worn_out') item.wearState = 'dirty';
  }
}
```

**`dropItem(itemId, location)`**
```js
function dropItem(itemId, location) {
  const item = _items.find(i => i.id === itemId);
  if (item) item.location = location;
}
```

**`moveToBasket(itemId?)`**
```js
function moveToBasket(itemId) {
  if (itemId) {
    const item = _items.find(i => i.id === itemId);
    if (item) item.location = 'laundry_basket';
    return;
  }
  for (const item of _items) {
    if (item.location === 'floor_bedroom' || item.location === 'floor_bathroom')
      item.location = 'laundry_basket';
  }
}
```

**`startWash()`** — called by `start_laundry`
```js
function startWash() {
  for (const item of _items) {
    if (item.location === 'laundry_basket') item.location = 'washing';
  }
}
```

**`wash()`** — called by `fold_laundry`
```js
function wash() {
  for (const item of _items) {
    if (item.location === 'laundry_basket' || item.location === 'washing') {
      item.location = 'stored';
      item.wearState = 'clean';
    }
  }
}
```

**`reset()`**
```js
function reset() {
  const wardrobe = ctx.character.get('wardrobe');
  if (wardrobe && Array.isArray(wardrobe)) {
    _items = wardrobe.map(item => ({ ...item }));
  } else {
    _items = _buildLegacyItems();
  }
}
```

---

## 4. Undress Behavior

### Destination

Clothes land on `accessible` (chair back, end of mattress, nearby surface) by default, or `floor_bedroom` when the character is depleted or heavy. No RNG — purely deterministic from state.

```js
const loc = ctx.state.get('location');
const depleted = ['depleted', 'exhausted'].includes(ctx.state.energyTier());
const heavy    = ['numb', 'heavy'].includes(ctx.state.moodTone());
const undressDest = loc === 'apartment_bathroom' ? 'floor_bathroom'
                  : (depleted || heavy)          ? 'floor_bedroom'
                  :                                'accessible';
ctx.clothing.undress(undressDest);
```

`accessible` represents informal placement (chair pile, mattress corner) — not put away, but not on the floor. `floor_bedroom` is dropped/stepped out of. Items in either location contribute to the pile that prose notices; only `floor_bedroom` items count toward mess score.

---

## 5. Getting Dressed Prose Integration

The character currently stores `outfit_default`, `outfit_low_mood`, `outfit_messy` — superseded by `outfitDescription()`.

```js
const grabbingFromFloor = ctx.clothing.wearableItems().length === 0;
ctx.state.set('dressed', true);
ctx.clothing.wear();
ctx.state.advanceTime(5);
ctx.events.record('got_dressed');

const mood = ctx.state.moodTone();
const outfit = ctx.clothing.outfitDescription(); // includes fit note if applicable

if (mood === 'numb' || mood === 'heavy') {
  if (grabbingFromFloor) {
    return `The ${outfit} from the floor. Each piece is a separate decision. You make them all.`;
  }
  return `The ${outfit}. You get dressed. That's the verb for it.`;
}
if (grabbingFromFloor) {
  return `The ${outfit} from the floor. Close enough to clean. Good enough for today.`;
}
return `${outfit}. You get dressed.`;
```

NT shading (adenosine fog, GABA anxiety) added as deterministic modifiers per the standard pattern.

---

## 6. Content Integration Points

| Site | Line | Change |
|---|---|---|
| Bedroom description | ~826 | None — `floorDescription('bedroom')` auto-improves |
| Bathroom description | ~1003 | None — `floorDescription('bathroom')` auto-improves |
| Sleep/undress | ~1617 | Add `resolveUndressDestination()`, update `undress()` call |
| `get_dressed` execute | ~1875 | Replace outfit-set lookup with `outfitDescription()`-based prose |
| `start_laundry` execute | ~2349 | Add `ctx.clothing.startWash()` |
| `tidy_clothes` availability | ~2428 | None needed |

---

## 7. Laundry Integration

### Current flow

`start_laundry` → `move_to_dryer` → `fold_laundry`. Phase tracked via `laundry_phase` in state.

**`start_laundry` execute:**
```js
ctx.state.set('laundry_phase', 'washing');
ctx.state.set('laundry_phase_started', ctx.state.get('time'));
ctx.clothing.startWash();
ctx.state.adjustEnergy(-3);
ctx.state.advanceTime(5);
```

**`move_to_dryer`:** No item-level change. Items remain in `washing` location.

**`fold_laundry`:** `ctx.clothing.wash()` transitions `washing` → `stored` + `clean`. Optional: query before calling to name items in prose.

---

## 8. Backwards Compatibility

### Version detection in `deserialize()`

```js
function deserialize(data) {
  if (!data) { _initLegacy(); return; }
  if (data.version === 'full_v1') {
    _items = data.items.map(item => ({ ...item }));
    return;
  }
  _items = _synthesizeFromCounts(data);
}
```

### Serialization format

```js
// full_v1:
{ version: 'full_v1', items: [{ id, type, name, condition, location, wearState, fit, abdominal_at_acquisition, chest_at_acquisition }, ...] }

// coarse_v1 (no version field):
{ floor_bedroom: N, floor_bathroom: N, in_basket: N, worn: N, total: N }
```

### `subsystem_versions` in RunRecord

```js
subsystem_versions: {
  clothing: CLOTHING_VERSION,
  dishes: 'coarse_v1',
  linens: 'coarse_v1',
}
```

Export: `export const CLOTHING_VERSION = 'full_v1';`. Bump RunRecord `version` to 3.

---

## 9. Approximation Debts

1. **Wardrobe generation is a snapshot, not a trajectory.** Real model: simulate accumulation + loss events forward from a historical start point, with items time-stamped so fit can be computed against body-at-acquisition. When `simulateLifeHistory()` exists, this function draws from it.

2. **Exit events not time-indexed.** A character who ran from a situation five years ago has had five years to rebuild; one who left last month has not. The consequences are `(event type × time since × financial situation since)`. Currently: no exit events in backstory at all.

3. **Housing model assumes housed.** Location vocabulary wrong for unhoused/transitional characters. Requires `housing_situation` backstory parameter.

4. **Fit stored as `comfortable` for all items until `docs/design/body.md` exists.** Body state currently has no dimensional structure. Fit computation requires chest and abdominal dimensions with acquisition-time snapshots per item. All fit is `comfortable` until those inputs exist.

5. **Breast tissue development not yet simulated.** Doesn't happen to all characters. Must emerge from biological parameters + life history (ASAB, puberty history, HRT, pregnancy, constitutional conditions). See `docs/design/body.md`. Constitutional conditions requiring specific handling: gigantomastia (disproportionate tissue, also causes chronic pain; generated at chargen from prevalence data), micromastia, asymmetry, Poland syndrome, post-mastectomy (may include prosthetics as tracked objects).

6. **Tidy preference proxy** — if derived from self_esteem/neuroticism. Real driver: conscientiousness, h²=49%, Bouchard & Loehlin 2001 PMID 11388753.

7. **Washer vs. dryer not distinguished.** Both phases use `washing` location.

8. **Condition does not degrade.** Set at chargen, fixed thereafter.

9. **Seasonal appropriateness** — no item tagged seasonal beyond tropical outerwear override.

10. **Outfit coordination** — auto-pick greedy by type. No work-appropriate filter, no uniform system.

11. **Smell/hygiene differentiation** — `worn_out` doesn't distinguish stained from sweat-soaked.

---

## 10. Implementation Plan

### Step 1: Wardrobe generation in chargen

- Define item name pools in `createChargen`.
- Add `generateWardrobe(backstory, latitude)`: generates items by origin, 3 `charRng` calls per item, placed **last** in `generateRandom()`.
- All items start with `fit: 'comfortable'`, `abdominal_at_acquisition: null`, `chest_at_acquisition: null` — to be populated when body.md system exists.
- Add `wardrobe` to character object. Remove `outfit_default / outfit_low_mood / outfit_messy`.

**Commit:** `feat(chargen): generate per-item wardrobe from economic origin`

### Step 2: Full clothing.js

- Replace coarse implementation. Export `CLOTHING_VERSION = 'full_v1'`.
- `reset()` deep-copies from `ctx.character.get('wardrobe')`.
- `deserialize()` handles all three data shapes.

**Commit:** `feat(clothing): full per-item tracking implementation`

### Step 3: Update content.js

- Replace outfit-set lookup in `get_dressed` with `outfitDescription()`-based prose.
- Add `resolveUndressDestination()`; update sleep/undress call site.
- Add `ctx.clothing.startWash()` to `start_laundry`.

**Commit:** `feat(content): update get_dressed and undress to use full clothing tracking`

### Step 4 (optional): Add conscientiousness to chargen

- One `charRng` call before `generateWardrobe()`.
- Store on character; `applyToState()` reads as `tidy_preference`.

**Commit:** `feat(chargen): add conscientiousness personality parameter`

### Step 5: RunRecord versioning

- Add `subsystem_versions` to `createRun()`. Bump version to 3.

**Commit:** `feat(runs): add subsystem_versions to RunRecord, bump to v3`

### Step 6: Docs

- Mark domestic objects Step 4 done in STATUS.md.
- Add approximation debts to TODO.md.
- Check overview.md for stale clothing/undress descriptions.

**Commit:** `docs: update STATUS, TODO, overview for full clothing implementation`
