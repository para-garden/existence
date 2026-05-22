// timeline.js — seeded PRNG, action log, autosave/restore, deterministic replay

/** @param {GameContext} ctx */
export function createTimeline(ctx) {

  // --- xoshiro128** PRNG ---
  // 128-bit state, excellent statistical quality, deterministic

  /** @param {number} a @param {number} b @param {number} c @param {number} d */
  function xoshiro128ss(a, b, c, d) {
    function next() {
      const t = b << 9;
      let r = a * 5;
      r = ((r << 7) | (r >>> 25)) * 9;

      c ^= a;
      d ^= b;
      b ^= c;
      a ^= d;

      c ^= t;
      d = (d << 11) | (d >>> 21);

      return (r >>> 0) / 4294967296;
    }
    return {
      next,
      getState() { return [a, b, c, d]; },
      setState(/** @type {number[]} */ s) { [a, b, c, d] = s; },
    };
  }

  // Seed splitmix32 to initialize xoshiro state from a single integer
  /** @param {number} seed */
  function splitmix32(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x9e3779b9) | 0;
      let t = seed ^ (seed >>> 16);
      t = Math.imul(t, 0x21f0aaad);
      t ^= t >>> 15;
      t = Math.imul(t, 0x735a2d97);
      t ^= t >>> 15;
      return t >>> 0;
    };
  }

  /** @param {number} seed */
  function createPRNG(seed) {
    const sm = splitmix32(seed);
    return xoshiro128ss(sm(), sm(), sm(), sm());
  }

  // --- Timeline state ---
  let seed = 0;
  /** @type {ActionEntry[]} */
  let actions = [];
  /** @type {{ next: () => number, getState: () => number[], setState: (s: number[]) => void } | null} */
  let rng = null;           // game PRNG stream
  /** @type {{ next: () => number, getState: () => number[], setState: (s: number[]) => void } | null} */
  let charRng = null;       // character generation PRNG stream (separate)
  /** @type {{ next: () => number, getState: () => number[], setState: (s: number[]) => void } | null} */
  let cosmeticRng = null;   // prose weighted picks — cosmetic only, never mechanical
  /** @type {{ next: () => number, getState: () => number[], setState: (s: number[]) => void } | null} */
  let backgroundRng = null; // ambient events and background simulation
  /** @type {GameCharacter | null} */
  let character = null;  // stored character data

  // Track how many RNG calls have been made (for replay)
  let rngCallCount = 0;

  // Active run tracking
  /** @type {string | null} */
  let activeRunId = null;

  /** @param {number} [existingSeed] */
  function init(existingSeed) {
    seed = /** @type {number} */ (existingSeed !== undefined ? existingSeed : generateSeed());
    actions = [];

    // Derive four independent sub-seeds from master seed via splitmix32 chain.
    // Order is fixed — inserting a new stream at the end never shifts existing ones.
    //   seed0 → charRng  (chargen, separate so chargen changes don't break gameplay replay)
    //   seed1 → rng      (gameplay, events, mechanical prose)
    //   seed2 → cosmeticRng   (prose weighted picks with no mechanical consequence)
    //   seed3 → backgroundRng (ambient events and background simulation)
    const sm = splitmix32(seed);
    const charSeed = sm();
    const gameSeed = sm();
    const cosmeticSeed = sm();
    const backgroundSeed = sm();

    charRng = createPRNG(charSeed);
    rng = createPRNG(gameSeed);
    cosmeticRng = createPRNG(cosmeticSeed);
    backgroundRng = createPRNG(backgroundSeed);
    rngCallCount = 0;
    character = null;
  }

  function generateSeed() {
    // Use crypto for initial seed — this is the ONE place we use non-deterministic randomness
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0];
  }

  // --- Game PRNG (gameplay, events, prose) ---

  // Get next random number [0, 1)
  function random() {
    rngCallCount++;
    return /** @type {{ next: () => number }} */ (rng).next();
  }

  // Random integer in [min, max] inclusive
  /** @param {number} min @param {number} max */
  function randomInt(min, max) {
    return min + Math.floor(random() * (max - min + 1));
  }

  // Random float in [min, max)
  /** @param {number} min @param {number} max */
  function randomFloat(min, max) {
    return min + random() * (max - min);
  }

  // Weighted random pick from array of { weight, value } objects
  /** @template T @param {WeightedItem<T>[]} items @returns {T} */
  function weightedPick(items) {
    if (items.length === 0) return /** @type {T} */ (/** @type {unknown} */ (undefined));
    let total = 0;
    for (const item of items) total += item.weight;
    let r = random() * total;
    for (const item of items) {
      r -= item.weight;
      if (r < 0) return item.value;
    }
    return /** @type {WeightedItem<T>} */ (items[items.length - 1]).value;
  }

  // Random boolean with given probability
  /** @param {number} probability */
  function chance(probability) {
    return random() < probability;
  }

  // Pick random element from array
  /** @template T @param {T[]} arr @returns {T | undefined} */
  function pick(arr) {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(random() * arr.length)];
  }

  // --- Character PRNG (chargen only, separate stream) ---

  function charRandom() {
    return /** @type {{ next: () => number }} */ (charRng).next();
  }

  /** @param {number} min @param {number} max */
  function charRandomInt(min, max) {
    return min + Math.floor(charRandom() * (max - min + 1));
  }

  /** @template T @param {T[]} arr @returns {T | undefined} */
  function charPick(arr) {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(charRandom() * arr.length)];
  }

  // Weighted pick using character stream — for name sampling
  // Takes array of [value, weight] pairs (compact format from names.js)
  /** @param {NamePair[]} pairs */
  function charWeightedPick(pairs) {
    if (pairs.length === 0) return undefined;
    let total = 0;
    for (const pair of pairs) total += pair[1];
    let r = charRandom() * total;
    for (const pair of pairs) {
      r -= pair[1];
      if (r < 0) return pair[0];
    }
    return /** @type {NamePair} */ (pairs[pairs.length - 1])[0];
  }

  // --- Cosmetic PRNG (prose weighted picks, no mechanical consequence) ---

  function cosmeticRandom() {
    return /** @type {{ next: () => number }} */ (cosmeticRng).next();
  }

  // Weighted pick using cosmetic stream — for prose variants that don't affect mechanical outcomes
  /** @template T @param {WeightedItem<T>[]} items @returns {T} */
  function cosmeticWeightedPick(items) {
    if (items.length === 0) return /** @type {T} */ (/** @type {unknown} */ (undefined));
    let total = 0;
    for (const item of items) total += item.weight;
    let r = cosmeticRandom() * total;
    for (const item of items) {
      r -= item.weight;
      if (r < 0) return item.value;
    }
    return /** @type {WeightedItem<T>} */ (items[items.length - 1]).value;
  }

  /** @param {number} min @param {number} max */
  function cosmeticRandomInt(min, max) {
    return min + Math.floor(cosmeticRandom() * (max - min + 1));
  }

  /** @template T @param {T[]} arr @returns {T | undefined} */
  function cosmeticPick(arr) {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(cosmeticRandom() * arr.length)];
  }

  // --- Background PRNG (ambient events and background simulation) ---

  function backgroundRandom() {
    return /** @type {{ next: () => number }} */ (backgroundRng).next();
  }

  /** @param {number} min @param {number} max */
  function backgroundRandomInt(min, max) {
    return min + Math.floor(backgroundRandom() * (max - min + 1));
  }

  /** @template T @param {T[]} arr @returns {T | undefined} */
  function backgroundPick(arr) {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(backgroundRandom() * arr.length)];
  }

  /** @template T @param {WeightedItem<T>[]} items @returns {T} */
  function backgroundWeightedPick(items) {
    if (items.length === 0) return /** @type {T} */ (/** @type {unknown} */ (undefined));
    let total = 0;
    for (const item of items) total += item.weight;
    let r = backgroundRandom() * total;
    for (const item of items) {
      r -= item.weight;
      if (r < 0) return item.value;
    }
    return /** @type {WeightedItem<T>} */ (items[items.length - 1]).value;
  }

  // --- Action log ---

  /** @param {{ type: string; id?: string; destination?: string; data?: Record<string, any> }} action */
  function recordAction(action) {
    actions.push({ action, timestamp: ctx.state.get('time') });
    save();
  }

  function getActions() {
    return actions.slice();
  }

  function getActionCount() {
    return actions.length;
  }

  // --- Character ---

  /** @param {GameCharacter} char */
  function setCharacter(char) {
    character = char;
  }

  function getCharacter() {
    return character;
  }

  // --- Save / Restore via Runs (IndexedDB) ---

  /** @param {string} id */
  function setActiveRunId(id) {
    activeRunId = id;
  }

  function getActiveRunId() {
    return activeRunId;
  }

  function save() {
    if (activeRunId) {
      ctx.runs.saveActions(activeRunId, actions);
    }
  }

  /**
   * Restore from a loaded run record. Initializes seed, character, actions, and PRNG.
   * @param {RunRecord} runData
   * @returns {{ seed: number, character: GameCharacter | null, actions: ActionEntry[] }}
   */
  function restoreFrom(runData) {
    seed = runData.seed;
    actions = runData.actions;
    character = runData.character || null;

    // Re-derive the same sub-seeds (must match init() chain order exactly)
    const sm = splitmix32(seed);
    const charSeed = sm();
    const gameSeed = sm();
    const cosmeticSeed = sm();
    const backgroundSeed = sm();

    charRng = createPRNG(charSeed);
    rng = createPRNG(gameSeed);
    cosmeticRng = createPRNG(cosmeticSeed);
    backgroundRng = createPRNG(backgroundSeed);
    rngCallCount = 0;

    return { seed, character, actions: runData.actions };
  }

  function getSeed() {
    return seed;
  }

  function getRngStates() {
    return {
      game: /** @type {{ getState: () => number[] }} */ (rng).getState(),
      cosmetic: /** @type {{ getState: () => number[] }} */ (cosmeticRng).getState(),
      background: /** @type {{ getState: () => number[] }} */ (backgroundRng).getState(),
    };
  }

  /** @param {{ game: number[], cosmetic: number[], background: number[] }} states */
  function setRngStates(states) {
    /** @type {{ setState: (s: number[]) => void }} */ (rng).setState(states.game);
    /** @type {{ setState: (s: number[]) => void }} */ (cosmeticRng).setState(states.cosmetic);
    /** @type {{ setState: (s: number[]) => void }} */ (backgroundRng).setState(states.background);
  }

  return {
    init,
    random,
    randomInt,
    randomFloat,
    weightedPick,
    chance,
    pick,
    charRandom,
    charRandomInt,
    charPick,
    charWeightedPick,
    cosmeticRandom,
    cosmeticRandomInt,
    cosmeticPick,
    cosmeticWeightedPick,
    backgroundRandom,
    backgroundRandomInt,
    backgroundPick,
    backgroundWeightedPick,
    setCharacter,
    getCharacter,
    recordAction,
    getActions,
    getActionCount,
    save,
    setActiveRunId,
    getActiveRunId,
    restoreFrom,
    getSeed,
    getRngStates,
    setRngStates,
  };
}

