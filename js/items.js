// items.js — inventory and container tracking
// Tracks WHERE items are: apartment spots, on_person, left at work/friends.
// Source of truth for all item quantities. character.js applyToState() populates initial items.

export const ITEMS_VERSION = 'v1';

/**
 * @typedef {{
 *   name: string,
 *   carryClass: 'habitual' | 'explicit' | 'fixed',
 *   defaultSpot: string,
 *   portable: boolean,
 *   counted: boolean,
 * }} ItemDef
 *
 * @typedef {{
 *   location: string,
 *   count: number,
 *   lastAccessed: number,
 * }} ItemStack
 */

/** @type {Record<string, ItemDef>} */
const ITEM_DEFS = {
  phone:           { name: 'your phone',      carryClass: 'habitual', defaultSpot: 'nightstand',       portable: true,  counted: false },
  cigarettes:      { name: 'the pack',         carryClass: 'habitual', defaultSpot: 'nightstand',       portable: true,  counted: true  },
  keys:            { name: 'your keys',        carryClass: 'habitual', defaultSpot: 'by_the_door',      portable: true,  counted: false },
  umbrella:        { name: 'the umbrella',     carryClass: 'explicit', defaultSpot: 'by_the_door',      portable: true,  counted: false },
  pain_reliever:   { name: 'the bottle',       carryClass: 'explicit', defaultSpot: 'bathroom_cabinet', portable: true,  counted: true  },
  moisturizer:     { name: 'the moisturizer',  carryClass: 'fixed',    defaultSpot: 'bathroom_cabinet', portable: false, counted: true  },
  period_supplies: { name: 'the box',          carryClass: 'habitual', defaultSpot: 'bathroom_cabinet', portable: true,  counted: true  },
  alcohol:         { name: 'the bottle',       carryClass: 'fixed',    defaultSpot: 'kitchen_counter',  portable: false, counted: true  },
  cannabis:        { name: 'the stash',        carryClass: 'fixed',    defaultSpot: 'nightstand',       portable: false, counted: true  },
  makeup:          { name: 'the makeup',       carryClass: 'fixed',    defaultSpot: 'bathroom_cabinet', portable: false, counted: true  },
  binder:          { name: 'your binder',      carryClass: 'habitual', defaultSpot: 'bedroom_drawer',   portable: true,  counted: false },
};

/** Map apartment spots to game room IDs */
const SPOT_TO_ROOM = {
  nightstand:       'apartment_bedroom',
  bedroom_drawer:   'apartment_bedroom',
  bathroom_cabinet: 'apartment_bathroom',
  kitchen_counter:  'apartment_kitchen',
  by_the_door:      'apartment_kitchen',
  living_room_table: 'apartment_living_room',
};

/** Map game room IDs to their default spot (for put-down) */
const ROOM_DEFAULT_SPOT = {
  apartment_bedroom:     'nightstand',
  apartment_bathroom:    'bathroom_cabinet',
  apartment_kitchen:     'kitchen_counter',
  apartment_living_room: 'living_room_table',
};

export { ITEM_DEFS, SPOT_TO_ROOM, ROOM_DEFAULT_SPOT };

export function createItems(ctx) {
  /** @type {Map<string, ItemStack[]>} */
  let _stacks = new Map();

  /** @type {Map<string, number>} */
  let _spotDisorder = new Map();

  // --- Queries ---

  /**
   * All item stacks at a given spot.
   * @param {string} spot
   * @returns {Array<{type: string, count: number, lastAccessed: number}>}
   */
  function itemsAtSpot(spot) {
    const result = [];
    for (const [type, stacks] of _stacks) {
      for (const stack of stacks) {
        if (stack.location === spot && stack.count > 0) {
          result.push({ type, count: stack.count, lastAccessed: stack.lastAccessed });
        }
      }
    }
    return result;
  }

  /**
   * All items visible in a game room (across all spots mapped to that room).
   * @param {string} roomId
   * @returns {Array<{type: string, spot: string, count: number, lastAccessed: number}>}
   */
  function itemsInRoom(roomId) {
    const result = [];
    for (const [spot, room] of Object.entries(SPOT_TO_ROOM)) {
      if (room !== roomId) continue;
      for (const item of itemsAtSpot(spot)) {
        result.push({ ...item, spot });
      }
    }
    return result;
  }

  /**
   * All items currently on person.
   * @returns {Array<{type: string, count: number}>}
   */
  function itemsOnPerson() {
    const result = [];
    for (const [type, stacks] of _stacks) {
      for (const stack of stacks) {
        if (stack.location === 'on_person' && stack.count > 0) {
          result.push({ type, count: stack.count });
        }
      }
    }
    return result;
  }

  /**
   * Whether this item type has any count on_person.
   * @param {string} type
   * @returns {boolean}
   */
  function hasOnPerson(type) {
    return countAt(type, 'on_person') > 0;
  }

  /**
   * Whether this item is accessible — on_person OR at a spot in the current room.
   * @param {string} type
   * @returns {boolean}
   */
  function hasAccessible(type) {
    if (hasOnPerson(type)) return true;
    const currentRoom = ctx.world.getLocationId();
    const stacks = _stacks.get(type);
    if (!stacks) return false;
    for (const stack of stacks) {
      if (stack.count <= 0) continue;
      const room = SPOT_TO_ROOM[/** @type {keyof typeof SPOT_TO_ROOM} */ (stack.location)];
      if (room === currentRoom) return true;
    }
    return false;
  }

  /**
   * Total count across all locations.
   * @param {string} type
   * @returns {number}
   */
  function countOf(type) {
    const stacks = _stacks.get(type);
    if (!stacks) return 0;
    let total = 0;
    for (const stack of stacks) total += stack.count;
    return total;
  }

  /**
   * Count at a specific location.
   * @param {string} type
   * @param {string} location
   * @returns {number}
   */
  function countAt(type, location) {
    const stacks = _stacks.get(type);
    if (!stacks) return 0;
    for (const stack of stacks) {
      if (stack.location === location) return stack.count;
    }
    return 0;
  }

  /**
   * Primary location of an item type (for singletons or "where is most of it").
   * Returns the location with the highest count, or null if item doesn't exist.
   * @param {string} type
   * @returns {string | null}
   */
  function locationOf(type) {
    const stacks = _stacks.get(type);
    if (!stacks || stacks.length === 0) return null;
    let best = null;
    let bestCount = -1;
    for (const stack of stacks) {
      if (stack.count > bestCount) {
        bestCount = stack.count;
        best = stack.location;
      }
    }
    return best;
  }

  /**
   * Disorder level of a container spot.
   * @param {string} spot
   * @returns {number}
   */
  function spotDisorder(spot) {
    return _spotDisorder.get(spot) ?? 0;
  }

  /**
   * Accessibility of an item at a spot — how findable it is.
   * Recently accessed items are on top regardless of disorder.
   * High disorder buries items that haven't been touched recently.
   * @param {string} type
   * @param {string} spot
   * @returns {number} 0–1 (1 = fully accessible)
   */
  function accessibility(type, spot) {
    const stacks = _stacks.get(type);
    if (!stacks) return 0;
    const stack = stacks.find(s => s.location === spot);
    if (!stack || stack.count <= 0) return 0;

    const disorder = spotDisorder(spot);
    if (disorder < 0.05) return 1; // tidy spot — everything accessible

    const now = ctx.state.get('time');
    const minutesSinceAccess = Math.max(0, now - stack.lastAccessed);
    // Recently touched items stay on top: full accessibility within 60 min,
    // then decays based on disorder level
    const recencyFactor = Math.exp(-minutesSinceAccess / (120 / (0.5 + disorder)));
    return Math.max(0.1, recencyFactor * (1 - disorder * 0.6) + (1 - disorder) * 0.3);
  }

  // --- Mutations ---

  /**
   * Add count of an item at a location. Creates the stack if needed.
   * @param {string} type
   * @param {string} location
   * @param {number} [count=1]
   */
  function add(type, location, count = 1) {
    if (!_stacks.has(type)) _stacks.set(type, []);
    const stacks = /** @type {ItemStack[]} */ (_stacks.get(type));
    const existing = stacks.find(s => s.location === location);
    const now = ctx.state.get('time');
    if (existing) {
      existing.count += count;
      existing.lastAccessed = now;
    } else {
      stacks.push({ location, count, lastAccessed: now });
    }
  }

  /**
   * Remove count from wherever the item is, preferring on_person.
   * @param {string} type
   * @param {number} [count=1]
   */
  function remove(type, count = 1) {
    const stacks = _stacks.get(type);
    if (!stacks) return;
    let remaining = count;

    // Prefer removing from on_person first
    const onPerson = stacks.find(s => s.location === 'on_person');
    if (onPerson && onPerson.count > 0) {
      const take = Math.min(onPerson.count, remaining);
      onPerson.count -= take;
      remaining -= take;
    }

    // Then from other locations
    if (remaining > 0) {
      for (const stack of stacks) {
        if (stack.location === 'on_person') continue;
        if (stack.count <= 0) continue;
        const take = Math.min(stack.count, remaining);
        stack.count -= take;
        remaining -= take;
        if (remaining <= 0) break;
      }
    }
  }

  /**
   * Remove count from a specific location.
   * @param {string} type
   * @param {string} location
   * @param {number} [count=1]
   */
  function removeFrom(type, location, count = 1) {
    const stacks = _stacks.get(type);
    if (!stacks) return;
    const stack = stacks.find(s => s.location === location);
    if (stack) {
      stack.count = Math.max(0, stack.count - count);
    }
  }

  /**
   * Move all of a type to a new location (merges into existing stack if present).
   * @param {string} type
   * @param {string} toLocation
   */
  function moveTo(type, toLocation) {
    const stacks = _stacks.get(type);
    if (!stacks) return;
    const now = ctx.state.get('time');
    let totalCount = 0;
    for (const stack of stacks) {
      totalCount += stack.count;
      stack.count = 0;
    }
    // Remove empty stacks
    const dest = stacks.find(s => s.location === toLocation);
    if (dest) {
      dest.count = totalCount;
      dest.lastAccessed = now;
    } else {
      stacks.push({ location: toLocation, count: totalCount, lastAccessed: now });
    }
    // Clean up zero-count stacks (except destination)
    _cleanStacks(type);
  }

  /**
   * Update lastAccessed for an item at a location. Call when item is used/touched.
   * @param {string} type
   * @param {string} location
   */
  function touchItem(type, location) {
    const stacks = _stacks.get(type);
    if (!stacks) return;
    const stack = stacks.find(s => s.location === location);
    if (stack) {
      stack.lastAccessed = ctx.state.get('time');
    }
  }

  /**
   * Reset disorder to 0 and refresh accessibility for all items at a spot.
   * @param {string} spot
   */
  function tidySpot(spot) {
    _spotDisorder.set(spot, 0);
    const now = ctx.state.get('time');
    for (const [, stacks] of _stacks) {
      for (const stack of stacks) {
        if (stack.location === spot) {
          stack.lastAccessed = now;
        }
      }
    }
  }

  /**
   * Add disorder to a spot (clamped 0–1).
   * @param {string} spot
   * @param {number} amount
   */
  function addDisorder(spot, amount) {
    const current = _spotDisorder.get(spot) ?? 0;
    _spotDisorder.set(spot, Math.min(1, Math.max(0, current + amount)));
  }

  // --- Carry mechanics ---

  /**
   * Resolve which habitual items are carried when leaving home.
   * NT-driven forget probability — stress and fatigue degrade working memory.
   * Consumes one RNG call per eligible habitual item (deterministic replay safe).
   * @returns {{ carried: string[], forgotten: string[] }}
   */
  function resolveLeaveHome() {
    /** @type {string[]} */
    const carried = [];
    /** @type {string[]} */
    const forgotten = [];

    const stress = ctx.state.get('stress');
    const adenosine = ctx.state.get('adenosine');
    // Rushing: leaving late for work makes forgetting more likely
    const isLate = ctx.state.isWorkHours() && ctx.world.isHome();
    const rushMod = isLate ? 0.5 : 0;

    for (const [type, def] of Object.entries(ITEM_DEFS)) {
      if (def.carryClass !== 'habitual') continue;
      if (!def.portable) continue;
      if (countOf(type) === 0) continue;
      if (hasOnPerson(type)) {
        carried.push(type);
        continue;
      }
      // Check if item is at any apartment spot and find its location
      let homeSpot = /** @type {string | null} */ (null);
      for (const spot of Object.keys(SPOT_TO_ROOM)) {
        if (countAt(type, spot) > 0) {
          homeSpot = spot;
          break;
        }
      }
      if (homeSpot) {
        // Forget probability: base rate degraded by stress, fatigue, rush, and disorder
        // Approximation debt (forget): baseRate=0.03, stress/adenosine coefficients chosen;
        // no empirical data on item-forgetting rates under cognitive load.
        const forgetProb = 0.03
          * (1 + 0.3 * ctx.state.lerp01(stress, 40, 80))
          * (1 + 0.4 * ctx.state.lerp01(adenosine, 50, 90))
          * (1 + rushMod)
          * (2 - accessibility(type, homeSpot));

        // Always consume RNG for replay determinism
        if (ctx.timeline.random() < forgetProb) {
          forgotten.push(type);
        } else {
          moveTo(type, 'on_person');
          carried.push(type);
        }
      }
    }
    return { carried, forgotten };
  }

  /**
   * Move pocket items back to default spots (e.g., going to bed).
   */
  function resolveSleep() {
    for (const [type, def] of Object.entries(ITEM_DEFS)) {
      if (!def.portable) continue;
      const stacks = _stacks.get(type);
      if (!stacks) continue;
      const onPerson = stacks.find(s => s.location === 'on_person');
      if (onPerson && onPerson.count > 0) {
        const now = ctx.state.get('time');
        const dest = stacks.find(s => s.location === def.defaultSpot);
        if (dest) {
          dest.count += onPerson.count;
          dest.lastAccessed = now;
        } else {
          stacks.push({ location: def.defaultSpot, count: onPerson.count, lastAccessed: now });
        }
        onPerson.count = 0;
      }
    }
    // Clean up empty stacks
    for (const type of _stacks.keys()) {
      _cleanStacks(type);
    }
  }

  // --- Lifecycle ---

  /**
   * Clear all item state. Called before applyToState() populates items,
   * and during replay setup to ensure a clean slate.
   */
  function reset() {
    _stacks = new Map();
    _spotDisorder = new Map();
  }

  // --- Serialization ---

  function serialize() {
    /** @type {Record<string, ItemStack[]>} */
    const stacksObj = {};
    for (const [type, stacks] of _stacks) {
      stacksObj[type] = stacks.map(s => ({ ...s }));
    }
    /** @type {Record<string, number>} */
    const disorderObj = {};
    for (const [spot, val] of _spotDisorder) {
      disorderObj[spot] = val;
    }
    return {
      version: ITEMS_VERSION,
      stacks: stacksObj,
      disorder: disorderObj,
    };
  }

  /**
   * @param {any} data
   */
  function deserialize(data) {
    if (data?.version === ITEMS_VERSION) {
      _stacks = new Map();
      for (const [type, stacks] of Object.entries(data.stacks)) {
        _stacks.set(type, /** @type {ItemStack[]} */ (stacks).map(s => ({ ...s })));
      }
      _spotDisorder = new Map();
      if (data.disorder) {
        for (const [spot, val] of Object.entries(data.disorder)) {
          _spotDisorder.set(spot, /** @type {number} */ (val));
        }
      }
    } else {
      // No saved item data — reconstruct from state
      reset();
    }
  }

  // --- Internal helpers ---

  /**
   * Remove zero-count stacks for a type (keep at most one zero-count at the default spot
   * for "empty container" visibility).
   * @param {string} type
   */
  function _cleanStacks(type) {
    const stacks = _stacks.get(type);
    if (!stacks) return;
    const def = ITEM_DEFS[type];
    const cleaned = stacks.filter(s =>
      s.count > 0 || (def && s.location === def.defaultSpot)
    );
    _stacks.set(type, cleaned);
  }

  return {
    // Queries
    itemsAtSpot,
    itemsInRoom,
    itemsOnPerson,
    hasOnPerson,
    hasAccessible,
    countOf,
    countAt,
    locationOf,
    spotDisorder,
    accessibility,

    // Mutations
    add,
    remove,
    removeFrom,
    moveTo,
    touchItem,
    tidySpot,
    addDisorder,

    // Carry mechanics
    resolveLeaveHome,
    resolveSleep,

    // Lifecycle
    reset,
    serialize,
    deserialize,
  };
}
