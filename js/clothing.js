// clothing.js — full_v1 clothing tracking
// Tracks each item individually: id, name, type, condition, location, wearState, fit, damage, wearCount.
// See docs/design/clothing-implementation.md for design rationale.
//
// damage: { torn, stained, stretched } — boolean flags per garment.
//   torn     — seam gone, hole, rip. Visible on outer layers.
//   stained  — permanent stain (bleach, grease, coffee). Visible on outer layers.
//   stretched — elastic gone, waistband given up. Functional but altered. Discovered silently.
// These are discrete events, not a continuous condition bar. No daily decrement.
// wearCount: integer, incremented each time the item is marked worn. Drives stretched threshold.

export const CLOTHING_VERSION = 'full_v1';

/** @param {GameContext} ctx */
export function createClothing(ctx) {
  /** @type {Array<ClothingItem>} */
  let _items = [];

  // --- Queries ---

  /**
   * Items physically on the floor of a location.
   * @param {'bedroom' | 'bathroom'} location
   * @returns {ClothingItem[]}
   */
  function itemsOnFloor(location) {
    const key = location === 'bedroom' ? 'floor_bedroom' : 'floor_bathroom';
    return _items.filter(item => item.location === key);
  }

  /**
   * Items that can be worn right now: stored or accessible, not dirty, not too_small.
   * worn_out items are still wearable — they're the "chair pile," worn a day or two ago
   * but not visibly dirty. Only 'dirty' truly needs laundry first.
   * @returns {ClothingItem[]}
   */
  function wearableItems() {
    return _items.filter(item =>
      item.fit !== 'too_small' &&
      item.wearState !== 'dirty' &&
      (item.location === 'stored' || item.location === 'accessible')
    );
  }

  /**
   * Can the character get dressed? True if there's anything wearable (including floor items).
   * Floor items of acceptable fit count — grabbing from the pile is still getting dressed.
   */
  function canGetDressed() {
    return wearableItems().length > 0
      || itemsOnFloor('bedroom').filter(i => i.fit !== 'too_small').length > 0
      || itemsOnFloor('bathroom').filter(i => i.fit !== 'too_small').length > 0;
  }

  /**
   * Items currently on the body with at least one damage flag set.
   * Used for prose modifiers in get_dressed.
   * @returns {Array<{item: ClothingItem, types: string[]}>}
   */
  function damagedWornItems() {
    return _items
      .filter(i => i.location === 'on_body' && i.damage && (i.damage.torn || i.damage.stained || i.damage.stretched))
      .map(i => ({
        item: i,
        types: [
          ...(i.damage.torn     ? ['torn']     : []),
          ...(i.damage.stained  ? ['stained']  : []),
          ...(i.damage.stretched ? ['stretched'] : []),
        ],
      }));
  }

  /**
   * Items in the wardrobe (any location) with at least one damage flag.
   * Used for idle thoughts.
   * @returns {ClothingItem[]}
   */
  function damagedItems() {
    return _items.filter(i => i.damage && (i.damage.torn || i.damage.stained || i.damage.stretched));
  }

  /** Total count of dirty items (floor + basket + currently washing). */
  function dirtyCount() {
    return _items.filter(item =>
      item.location === 'floor_bedroom' ||
      item.location === 'floor_bathroom' ||
      item.location === 'laundry_basket' ||
      item.location === 'washing' ||
      item.wearState === 'dirty'
    ).length;
  }

  /**
   * Prose fragment describing clothes on the floor of a location.
   * Returns '' if the floor is clear. Deterministic — no RNG.
   * @param {'bedroom' | 'bathroom'} location
   * @returns {string}
   */
  function floorDescription(location) {
    const floor = itemsOnFloor(location);
    if (floor.length === 0) return '';
    const visible = ['top', 'bottom', 'dress', 'outerwear'];
    const named = floor.filter(i => visible.includes(i.type)).map(i => i.name);
    const misc = floor.length - named.length;
    if (named.length === 0) {
      return misc === 1 ? 'Something on the floor.' : `${misc} things on the floor.`;
    }
    if (named.length === 1 && misc === 0) return `The ${named[0]} on the floor.`;
    if (named.length === 2 && misc === 0) return `The ${named[0]} and the ${named[1]} on the floor.`;
    const extra = floor.length - Math.min(named.length, 2);
    let desc = `The ${named[0]}`;
    if (named.length > 1) desc += `, the ${named[1]}`;
    if (extra > 0) desc += `, and ${extra} other ${extra === 1 ? 'thing' : 'things'}`;
    return desc + ' on the floor.';
  }

  /**
   * Prose description of the current outfit. Deterministic — no RNG.
   * Picks up fit state as deterministic prose note.
   * Returns '' if nothing is on the body.
   */
  function outfitDescription() {
    const worn = _items.filter(i => i.location === 'on_body');
    if (worn.length === 0) return '';
    const visible = worn.filter(i => ['top', 'bottom', 'dress', 'outerwear'].includes(i.type));
    if (visible.length === 0) return '';
    let desc;
    if (visible.length === 1) desc = visible[0].name;
    else if (visible.length === 2) desc = `${visible[0].name} and ${visible[1].name}`;
    else {
      const last = visible[visible.length - 1];
      desc = visible.slice(0, -1).map(i => i.name).join(', ') + ', and ' + last.name;
    }
    // First notable fit issue appended as deterministic modifier — no RNG
    const fitIssue = visible.find(i => i.fit !== 'comfortable');
    if (fitIssue) desc += ' ' + _fitNote(fitIssue);
    // First notable damage on a visible item — deterministic modifier, no RNG
    const damageNote = _damageNote(visible);
    if (damageNote) desc += ' ' + damageNote;
    return desc;
  }

  /**
   * Estimate cleanliness value (0–100) for the outfit about to be selected by wear().
   * Call this BEFORE wear() to read the pre-wear state of candidate items.
   * Returns a value representing how clean the about-to-be-worn outfit will be:
   *   - clean items from stored/accessible → ~85–95
   *   - worn_once items (the chair pile) → ~55–65
   *   - floor items or worn_out → ~25–35
   * Approximation debt (clothing cleanliness): starting values 90/60/30 chosen;
   * no empirical basis for these specific numbers — represent clean/worn/dirty qualitative tiers.
   * @returns {number}
   */
  function wornCleanlinessValue() {
    const types = ['top', 'bottom'];  // outer visible layers drive the felt cleanliness
    const fitRank = { comfortable: 0, too_large: 1, rides_up: 2, tight: 3 };
    let total = 0;
    let count = 0;
    for (const type of types) {
      const candidates = wearableItems().filter(i => i.type === type);
      if (candidates.length > 0) {
        // Mirror the sort from wear() so we score the same item wear() will pick
        const sorted = [...candidates].sort((a, b) => {
          const fa = fitRank[a.fit] ?? 4;
          const fb = fitRank[b.fit] ?? 4;
          if (fa !== fb) return fa - fb;
          if (a.location === 'accessible' && b.location !== 'accessible') return -1;
          if (b.location === 'accessible' && a.location !== 'accessible') return 1;
          if (a.wearState === 'clean' && b.wearState !== 'clean') return -1;
          if (b.wearState === 'clean' && a.wearState !== 'clean') return 1;
          return 0;
        });
        const best = sorted[0];
        const val = best.wearState === 'clean' ? 90
          : best.wearState === 'worn_once' ? 60
          : 30; // worn_out
        total += val;
        count++;
      } else {
        // Fall back to floor — floor items are always worn_out or worse
        const floor = itemsOnFloor('bedroom').filter(i => i.type === type && i.fit !== 'too_small');
        if (floor.length > 0) {
          total += 30;
          count++;
        }
      }
    }
    return count > 0 ? Math.round(total / count) : 85;
  }

  // --- Mutations ---

  /**
   * Auto-select and wear an outfit (top, bottom, socks, underwear).
   * Prefers clean + accessible + better fit. Falls back to floor items.
   * @param {string} [itemId] — if provided, wear this specific item only
   */
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
        // Fall back to floor items
        const floor = itemsOnFloor('bedroom').filter(i => i.type === type && i.fit !== 'too_small');
        if (floor.length > 0) _markWorn(floor[0]);
      } else {
        const fitRank = { comfortable: 0, too_large: 1, rides_up: 2, tight: 3 };
        const sorted = [...candidates].sort((a, b) => {
          const fa = fitRank[a.fit] ?? 4;
          const fb = fitRank[b.fit] ?? 4;
          if (fa !== fb) return fa - fb;
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

  /**
   * Undress — all on-body items move to the specified destination.
   * Destination resolved in content.js via resolveUndressDestination().
   * @param {'floor_bedroom' | 'floor_bathroom' | 'laundry_basket' | 'accessible'} dropTo
   */
  function undress(dropTo) {
    for (const item of _items) {
      if (item.location !== 'on_body') continue;
      item.location = dropTo;
      if (item.wearState === 'worn_once') item.wearState = 'worn_out';
      else if (item.wearState === 'worn_out') item.wearState = 'dirty';
    }
  }

  /**
   * Drop a specific item to a location (e.g. bathroom floor while changing).
   * @param {string} itemId
   * @param {string} location
   */
  function dropItem(itemId, location) {
    const item = _items.find(i => i.id === itemId);
    if (item) item.location = location;
  }

  /**
   * Apply a damage flag to an item. No-op if item not found or already damaged that way.
   * @param {string} itemId
   * @param {'torn' | 'stained' | 'stretched'} type
   */
  function applyDamage(itemId, type) {
    const item = _items.find(i => i.id === itemId);
    if (!item) return;
    if (!item.damage) item.damage = { torn: false, stained: false, stretched: false };
    item.damage[type] = true;
  }

  /**
   * Randomly select a currently-worn item of the given type(s) for a damage roll.
   * Returns the item or null if none worn of those types.
   * Caller is responsible for the RNG roll; this returns the candidate.
   * @param {string[]} types — e.g. ['top', 'bottom']
   * @returns {ClothingItem | null}
   */
  function wornItemOfType(types) {
    const worn = _items.filter(i => i.location === 'on_body' && types.includes(i.type));
    if (worn.length === 0) return null;
    // Prefer outer visible types: top/bottom over underwear/socks
    const outer = worn.filter(i => ['top', 'bottom', 'dress', 'outerwear'].includes(i.type));
    return outer.length > 0 ? outer[0] : worn[0];
  }

  /**
   * Move floor items to laundry basket.
   * @param {string | undefined} itemId — if provided, move only that item; otherwise all floor items
   */
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

  /**
   * Accumulate wear on items currently on the body during a sleep period.
   * Items worn to bed still age — less than active wear, but not zero.
   * Does NOT advance wearState (worn_once → worn_out → dirty) — that only happens at undress.
   * @param {number} sleepHours
   */
  function ageWornDuringSleep(sleepHours) {
    // Approximation debt (clothing condition): sleep-wear fraction 0.3× active wear per hour chosen.
    // Active wear increments wearCount by 1 per wear event (roughly one day of use).
    // Sleep is less demanding: less movement, no outdoor exposure, no food/drink contact.
    const sleepWearFraction = 0.3; // Approximation debt (clothing condition):
    const increment = sleepHours * sleepWearFraction;
    for (const item of _items) {
      if (item.location !== 'on_body') continue;
      if (!item.wearCount) item.wearCount = 0;
      item.wearCount += increment;
    }
  }

  /** Start wash cycle — move basket items to washing. Called by start_laundry. */
  function startWash() {
    for (const item of _items) {
      if (item.location === 'laundry_basket') item.location = 'washing';
    }
  }

  /** Complete wash cycle — washing items return to stored + clean. Called by fold_laundry. */
  function wash() {
    for (const item of _items) {
      if (item.location === 'laundry_basket' || item.location === 'washing') {
        item.location = 'stored';
        item.wearState = 'clean';
      }
    }
  }

  /**
   * Handwash small items from the basket (underwear + socks only).
   * These don't need a dryer — they go back to stored + clean, air-dry implied.
   * Returns the count of items washed.
   * Called by handwash_clothes interaction in apartment_bathroom.
   */
  function washSmallItems() {
    const smallTypes = ['underwear', 'socks'];
    let count = 0;
    for (const item of _items) {
      if (item.location === 'laundry_basket' && smallTypes.includes(item.type)) {
        item.location = 'stored';
        item.wearState = 'clean';
        count++;
      }
    }
    return count;
  }

  /**
   * Count of small items (underwear + socks) currently in the laundry basket.
   * Used by handwash_clothes availability check.
   */
  function smallItemsInBasket() {
    const smallTypes = ['underwear', 'socks'];
    return _items.filter(i => i.location === 'laundry_basket' && smallTypes.includes(i.type)).length;
  }

  /**
   * Assess thermal protection of the current outfit.
   * Returns qualitative label for cold conditions: 'adequate' | 'light' | 'minimal'
   * Returns qualitative label for hot conditions: 'breathable' | 'heavy'
   * Used by outdoor interactions to apply temperature-clothing effects.
   *
   * Cold assessment: outerwear worn → adequate; top + bottom → light; missing top or bottom → minimal.
   * Hot assessment: outerwear worn on a hot day → heavy; otherwise → breathable.
   *
   * Approximation debt (clothing): thermal assessment from item types is approximate;
   * full model needs explicit thermal rating per item (e.g. 'winter_coat' vs 'rain_jacket').
   *
   * @param {'cold' | 'hot'} context
   * @returns {'adequate' | 'light' | 'minimal' | 'breathable' | 'heavy'}
   */
  function clothingWarmthLevel(context) {
    const worn = _items.filter(i => i.location === 'on_body');
    if (context === 'hot') {
      const hasOuterwear = worn.some(i => i.type === 'outerwear');
      return hasOuterwear ? 'heavy' : 'breathable';
    }
    // cold context
    const hasOuterwear = worn.some(i => i.type === 'outerwear');
    if (hasOuterwear) return 'adequate';
    const hasTop = worn.some(i => i.type === 'top' || i.type === 'dress');
    const hasBottom = worn.some(i => i.type === 'bottom' || i.type === 'dress');
    if (hasTop && hasBottom) return 'light';
    return 'minimal';
  }

  // --- Lifecycle ---

  /**
   * Reset to character's starting wardrobe. Called at replay start.
   */
  function reset() {
    const wardrobe = ctx.character.get('wardrobe');
    _items = wardrobe.map(item => ({ ...item }));
  }

  // --- Serialization ---

  function serialize() {
    return { version: 'full_v1', items: _items.map(item => ({ ...item })) };
  }

  function deserialize(data) {
    if (data?.version === 'full_v1') {
      _items = data.items.map(item => ({ ...item }));
    } else {
      reset();
    }
  }

  // --- Fit derivation ---

  /**
   * Derive current fit from acquisition body dimensions vs current body dimensions.
   * Returns the stored `item.fit` if no acquisition dims are set (legacy / non-wired items).
   * @param {ClothingItem} item
   * @param {number} currentChest  — current breast_tissue_score (0-100)
   * @param {number} currentAbdominal — current abdominal_baseline (0-100)
   * @returns {'comfortable' | 'too_large' | 'rides_up' | 'tight'}
   */
  function currentFit(item, currentChest, currentAbdominal) {
    // Approximation debt (clothing size): delta thresholds not literature-derived.
    // Maps body dimension delta since acquisition to qualitative fit label.
    const fitFromDelta = (/** @type {number} */ delta) => {
      if (delta > 20) return 'tight';
      if (delta > 8)  return 'rides_up';
      if (delta < -20) return 'too_large';
      return 'comfortable';
    };
    if (['top', 'dress'].includes(item.type) && item.chest_at_acquisition != null) {
      return fitFromDelta(currentChest - item.chest_at_acquisition);
    }
    if (item.type === 'bottom' && item.abdominal_at_acquisition != null) {
      return fitFromDelta(currentAbdominal - item.abdominal_at_acquisition);
    }
    return /** @type {'comfortable' | 'too_large' | 'rides_up' | 'tight'} */ (item.fit);
  }

  // --- Internal helpers ---

  function _markWorn(item) {
    item.location = 'on_body';
    const singleUse = ['socks', 'underwear'];
    item.wearState = singleUse.includes(item.type) ? 'worn_out' : 'worn_once';
    if (!item.wearCount) item.wearCount = 0;
    item.wearCount++;
  }

  /** @param {ClothingItem} item */
  function _fitNote(item) {
    if (item.fit === 'rides_up') return "(the hem doesn't quite reach)";
    if (item.fit === 'tight') return '(tighter than it used to be)';
    if (item.fit === 'too_large') return '(a size too big)';
    return '';
  }

  /**
   * Deterministic damage note for the first visibly damaged outer garment.
   * No RNG. Returns '' if nothing is damaged.
   * @param {ClothingItem[]} visible — outer-layer items currently being described
   * @returns {string}
   */
  function _damageNote(visible) {
    for (const item of visible) {
      if (!item.damage) continue;
      if (item.damage.torn) return '(the tear is still there)';
      if (item.damage.stained) return '(the stain set in)';
      if (item.damage.stretched) return '(the waistband sits differently now)';
    }
    return '';
  }

  return {
    itemsOnFloor,
    wearableItems,
    canGetDressed,
    dirtyCount,
    damagedWornItems,
    damagedItems,
    floorDescription,
    outfitDescription,
    wornCleanlinessValue,
    wear,
    undress,
    dropItem,
    applyDamage,
    wornItemOfType,
    ageWornDuringSleep,
    moveToBasket,
    startWash,
    wash,
    washSmallItems,
    smallItemsInBasket,
    clothingWarmthLevel,
    currentFit,
    reset,
    serialize,
    deserialize,
  };
}

// --- Standalone size label utilities ---
// Used by chargen sandbox and any UI showing clothing size labels.

/**
 * Map a country code to a clothing size convention.
 * @param {string} country — ISO 3166-1 alpha-2
 * @returns {'US' | 'UK' | 'EU' | 'INT'}
 */
export function sizeConventionFor(country) {
  if (country === 'US' || country === 'CA') return 'US';
  if (country === 'GB' || country === 'AU') return 'UK';
  if (['DE', 'NL', 'FR'].includes(country)) return 'EU';
  return 'INT';
}

/**
 * Top size label from chest dimension.
 * @param {number} chestDim — breast_tissue_score (0-100)
 * @param {'US' | 'UK' | 'EU' | 'INT'} convention
 * @returns {string}
 */
export function topSizeLabel(chestDim, convention) {
  // Approximation debt (clothing size): thresholds not literature-derived.
  // chest/abdominalDim is 0-100 abstract body dimension.
  const tier = chestDim < 18 ? 0 : chestDim < 32 ? 1 : chestDim < 50 ? 2
             : chestDim < 65 ? 3 : chestDim < 80 ? 4 : 5;
  return (/** @type {Record<string, string[]>} */ ({
    US:  ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    UK:  ['6', '8', '10', '12', '14', '16'],
    EU:  ['32', '34', '36', '38', '40', '42'],
    INT: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  })[convention] ?? ['XS', 'S', 'M', 'L', 'XL', 'XXL'])[tier] ?? 'M';
}

/**
 * Bottom size label from abdominal dimension.
 * @param {number} abdominalDim — abdominal_baseline (0-100)
 * @param {'US' | 'UK' | 'EU' | 'INT'} convention
 * @returns {string}
 */
export function bottomSizeLabel(abdominalDim, convention) {
  // Approximation debt (clothing size): thresholds not literature-derived.
  const tier = abdominalDim < 18 ? 0 : abdominalDim < 32 ? 1 : abdominalDim < 50 ? 2
             : abdominalDim < 65 ? 3 : abdominalDim < 80 ? 4 : 5;
  return (/** @type {Record<string, string[]>} */ ({
    US:  ['24"', '26"', '28"', '30"', '32"', '34"'],
    UK:  ['6', '8', '10', '12', '14', '16'],
    EU:  ['32', '34', '36', '38', '40', '42'],
    INT: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  })[convention] ?? ['24"', '26"', '28"', '30"', '32"', '34"'])[tier] ?? '28"';
}

/**
 * Size label for a wardrobe item given a country.
 * Returns null for types without a size model (underwear, socks, shoes).
 * @param {ClothingItem} item
 * @param {string} country — ISO 3166-1 alpha-2
 * @returns {string | null}
 */
export function itemSizeLabel(item, country) {
  const conv = sizeConventionFor(country);
  if (['top', 'dress'].includes(item.type) && item.chest_at_acquisition != null)
    return topSizeLabel(item.chest_at_acquisition, conv);
  if (item.type === 'bottom' && item.abdominal_at_acquisition != null)
    return bottomSizeLabel(item.abdominal_at_acquisition, conv);
  return null; // underwear/socks/shoes — TODO (see TODO.md: Underwear/socks/shoes size labels)
}

/**
 * @typedef {{
 *   id: string,
 *   type: string,
 *   name: string,
 *   condition: string,
 *   location: string,
 *   wearState: string,
 *   fit: string,
 *   abdominal_at_acquisition: number | null,
 *   chest_at_acquisition: number | null,
 *   damage: { torn: boolean, stained: boolean, stretched: boolean },
 *   wearCount: number,
 * }} ClothingItem
 */
