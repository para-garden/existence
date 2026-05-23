// js/realization.js — procedural sentence construction from Observation data.
// Pure module: no game imports, no side effects. Testable in isolation.
//
// realize(observations, hint, ntCtx, random) → string | null
//
//   observations  Observation[] from senses.getObservations()
//   hint          'calm' | 'anxious' | 'dissociated' | 'overwhelmed' | 'flat' | 'heightened'
//   ntCtx         { gaba, ne, aden, serotonin, dopamine, synesthesia, apd } — NT values normalized 0–1;
//                 synesthesia boolean (chromesthesia: sounds evoke automatic colour percepts);
//                 apd boolean (auditory processing disorder: speech sources parse-fail)
//   random        () => number in [0, 1) — caller provides seeded RNG
//
// RNG consumption: exactly 4 calls per selected observation, always.
// A passage of N observations consumes exactly N × 4 calls regardless of shape.
// Multi-observation shapes (appositive, terminal_list, arrival_seq) maintain this
// by drawing obs[0]'s r1 upfront as the passage-shape selector, then treating
// obs[0]'s remaining 3 slots and all subsequent obs' 4 slots normally.
//
// Chromesthesia (Layer 2 deterministic modifier): when ntCtx.synesthesia is true and the
// observation is a sound-channel source, a colour fragment is appended to the realized sentence.
// No extra RNG calls — colour index derived from already-consumed r1 value. RNG invariant preserved.
//
// APD (Layer 2 deterministic modifier): when ntCtx.apd is true and the source is a speech source
// (coworker_background, street_voices), the sentence is replaced with a parse-fail fragment.
// No extra RNG calls — fragment index derived from already-consumed r1 value. RNG invariant preserved.
// APD affects parsing, not detection — salience thresholds are unchanged.

// --- Types ---

/**
 * @typedef {import('./senses.js').Observation} Observation
 */

/**
 * Weight function. Inputs: NT snapshot (normalized 0–1) + the current Observation.
 * Returns a non-negative number. Higher = more likely to be picked.
 * @typedef {(nt: NTSnapshot, obs: Observation) => number} WeightFn
 */

/**
 * Structure hint — emerged NT state category, drives shape/architecture weights.
 * @typedef {'calm' | 'anxious' | 'dissociated' | 'overwhelmed' | 'flat' | 'heightened'} Hint
 */

/** @typedef {() => number} RandomFn */

/**
 * Pool item — either a bare string (weight 1) or a tagged object with optional weight.
 * `text: null` means "no modifier" (the pool emits an empty slot).
 * @typedef {string | { text: string | null, w?: number | WeightFn }} PoolItem
 */

/**
 * Reframe pair: { rough, precise, w }.
 * @typedef {{ rough: string, precise: string, w?: number | WeightFn }} ReframePair
 */

/**
 * LEX entry: per-source lexical set used by buildX shape functions.
 * All fields optional — different sources support different shapes.
 * @typedef {{
 *   subjects?: PoolItem[],
 *   predicates?: PoolItem[],
 *   modifiers?: PoolItem[],
 *   body_subjects?: PoolItem[],
 *   body_predicates?: PoolItem[],
 *   character_predicates?: PoolItem[],
 *   character_subjects?: PoolItem[],
 *   appositive_np?: PoolItem[],
 *   ambiguity_alts?: PoolItem[],
 *   escapes?: PoolItem[],
 *   fragments?: PoolItem[],
 *   flat_descriptions?: PoolItem[],
 *   reframe?: PoolItem[],
 *   reframe_pairs?: ReframePair[],
 *   short?: PoolItem[],
 *   inversion_conditions?: PoolItem[],
 *   default?: PoolItem[],
 * }} LexEntry
 */

// --- Utilities ---

/** @param {string | null | undefined} s */
function cap(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Weighted pick using a single pre-rolled value r in [0, 1).
 * @template T
 * @param {Array<{ weight: number, value: T }>} items
 * @param {number} r
 * @returns {T | null}
 */
function wpick(items, r) {
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (total <= 0) return items[0]?.value ?? null;
  let cursor = r * total;
  for (const item of items) {
    cursor -= Math.max(0, item.weight);
    if (cursor <= 0) return item.value;
  }
  return items[items.length - 1]?.value ?? null;
}

/**
 * Pick text from a pool using NT-weighted items.
 * Each pool item: string | { text: string|null, w: number | (nt, obs) => number }
 * Returns string or null (null items represent "no modifier").
 * @param {PoolItem[] | undefined} pool
 * @param {NTSnapshot} nt
 * @param {Observation} obs
 * @param {number} r
 */
function pickText(pool, nt, obs, r) {
  if (!pool || pool.length === 0) return null;
  const items = pool.map(item => {
    if (typeof item === 'string') return { weight: 1, value: item };
    const w = typeof item.w === 'function' ? item.w(nt, obs) : (item.w ?? 1);
    return { weight: Math.max(0, w), value: item.text };
  });
  return wpick(items, r);
}

// --- Lexical sets ---
//
// One entry per sourceId. Each entry defines how to realize that source.
// Body sources (interoception, thermal) include body_subjects + body_predicates
// for the body-as-subject architecture.
// Modifier pools include { text: null, w: N } options for "no modifier."
// ambiguity_alts: alternatives for the source-ambiguity architecture.
// escapes: interpretive-escape suffixes ("and [escape].").
// fragments: short NP forms used in bare-fragment architecture.

/** @type {Record<string, LexEntry>} */
const LEX = {

  fridge: {
    // Only subjects that can take any predicate — "a hum" can't "run" or "sit there"
    subjects: [
      'the fridge',
      { text: 'something', w: nt => nt.aden > 0.6 ? 1.5 : 0.2 },
      { text: 'the refrigerator', w: 0.3 },
    ],
    predicates: [
      'hums',
      { text: 'has been going', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'sits there', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.1 },
      { text: 'kicks on', w: 0.6 },
      { text: 'clicks off', w: 0.5 },
      { text: 'settles', w: nt => nt.gaba > 0.5 ? 0.8 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 1.2 },
      { text: 'too loud', w: nt => nt.gaba < 0.4 ? 1.5 : 0.1 },
      { text: 'at the wrong frequency', w: nt => nt.ne > 0.6 ? 1.0 : 0.05 },
      { text: 'steadily', w: nt => nt.gaba > 0.5 ? 0.8 : 0.1 },
      { text: 'in the background', w: nt => nt.gaba > 0.6 ? 0.7 : 0.1 },
      { text: 'as always', w: nt => nt.serotonin < 0.45 ? 0.8 : 0.2 },
    ],
    ambiguity_alts: ['the heat', 'the building'],
    escapes: [
      { text: 'the sound was just a sound', w: 1.0 },
      { text: 'it had been going the whole time', w: nt => nt.aden > 0.5 ? 1.0 : 0.5 },
      { text: 'the fridge was just the fridge', w: nt => nt.serotonin < 0.4 ? 1.5 : 0.3 },
      { text: 'it would keep going', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.2 },
    ],
    fragments: [
      'the fridge',
      'a hum',
      { text: 'a hum from somewhere', w: nt => nt.aden > 0.5 ? 1.2 : 0.4 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.5 : 0.4 },
      { text: 'the hum', w: 0.5 },
    ],
    flat_descriptions: [
      { text: 'The fridge hummed.', w: nt => nt.serotonin < 0.4 && nt.dopamine < 0.4 ? 1.2 : 0.2 },
      'It had been going the whole time.',
      { text: 'The fridge was the fridge.', w: nt => nt.serotonin < 0.35 ? 1.0 : 0.1 },
    ],
    appositive_np: [
      'a hum in the background',
      { text: 'the fridge, still going',          w: nt => nt.serotonin < 0.4 ? 1.2 : 0.5 },
      { text: "something she'd stopped hearing",  w: nt => nt.aden > 0.5  ? 1.2 : 0.3 },
      { text: 'the fridge cycling through it',    w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
      { text: 'a hum that had been there',        w: nt => nt.serotonin < 0.4 ? 0.9 : 0.3 },
    ],
  },

  pipes: {
    subjects: [
      'something in the pipes',
      { text: 'the pipes', w: nt => nt.aden < 0.5 ? 1.0 : 0.4 },
      { text: 'something in the walls', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'something', w: nt => nt.aden > 0.65 ? 0.8 : 0.2 },
      { text: 'the building', w: nt => nt.aden > 0.5 ? 0.6 : 0.2 },
    ],
    predicates: [
      'ticks',
      'clicks',
      { text: 'settles', w: 0.7 },
      { text: 'knocks once', w: 0.5 },
      { text: 'pops', w: 0.4 },
      { text: 'goes quiet', w: nt => nt.gaba > 0.5 ? 0.6 : 0.1 },
      { text: 'groans once', w: nt => nt.ne > 0.6 ? 0.7 : 0.2 },
      { text: 'runs then stops', w: 0.5 },
      { text: 'knocks in the wall', w: nt => nt.gaba < 0.4 ? 0.8 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 1.5 },
      { text: 'and then again', w: 0.5 },
      { text: 'somewhere in the walls', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'then nothing', w: nt => nt.ne > 0.55 ? 0.8 : 0.2 },
      { text: 'once', w: 0.4 },
      { text: 'in the ceiling maybe', w: nt => nt.aden > 0.5 ? 0.6 : 0.15 },
    ],
    body_subjects: [
      { text: 'the walls', w: nt => nt.aden > 0.5 ? 1.2 : 0.4 },
      { text: 'something in the building', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'the building', w: 0.6 },
      { text: 'the ceiling', w: nt => nt.ne > 0.55 ? 0.8 : 0.2 },
      { text: 'something', w: 0.5 },
    ],
    body_predicates: [
      { text: 'does this sometimes', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'settles around you', w: nt => nt.gaba > 0.5 ? 1.0 : 0.3 },
      { text: 'is alive in the way buildings are', w: nt => nt.aden > 0.6 ? 1.0 : 0.2 },
      { text: 'knocks once and stops', w: nt => nt.ne > 0.55 ? 1.2 : 0.4 },
      { text: 'registers somewhere in the chest', w: nt => nt.gaba < 0.4 ? 1.0 : 0.2 },
      { text: 'is just the building', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
    ],
    fragments: [
      'something in the pipes',
      { text: 'a tick from somewhere', w: 0.7 },
      { text: 'something settling', w: 0.6 },
      { text: 'a knock', w: 0.5 },
      { text: 'the walls', w: nt => nt.aden > 0.5 ? 0.6 : 0.2 },
      { text: 'a groan from somewhere above', w: nt => nt.ne > 0.6 ? 0.6 : 0.15 },
    ],
    flat_descriptions: [
      { text: 'Something in the pipes.', w: nt => nt.aden > 0.5 ? 1.2 : 0.3 },
      { text: 'The building settles.', w: nt => nt.gaba > 0.5 ? 1.0 : 0.2 },
      { text: 'A knock, then nothing.', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.2 },
    ],
    appositive_np: [
      'something in the walls',
      { text: 'the building settling',    w: nt => nt.gaba > 0.5  ? 1.0 : 0.4 },
      { text: 'a tick from somewhere',    w: 0.8 },
      { text: 'a knock in the wall',      w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
      { text: 'pipes doing what they do', w: nt => nt.aden > 0.5 ? 0.7 : 0.2 },
    ],
  },

  electronic_whine: {
    subjects: [
      'a thin whine',
      { text: 'a frequency', w: nt => nt.ne > 0.6 ? 1.5 : 0.5 },
      'something electronic',
      { text: 'a pitch', w: nt => nt.ne > 0.5 ? 1.0 : 0.4 },
      { text: 'something in the wall', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
      { text: 'something electrical', w: nt => nt.gaba < 0.4 ? 0.8 : 0.3 },
      { text: 'a faint screech', w: nt => nt.ne > 0.7 ? 0.6 : 0.1 },
    ],
    predicates: [
      'from somewhere',
      { text: 'from the outlet, maybe', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: "that isn't quite a sound", w: nt => nt.aden > 0.6 ? 1.2 : 0.3 },
      { text: 'sits above the other sounds', w: nt => nt.ne > 0.6 ? 1.5 : 0.3 },
      { text: "doesn't stop", w: nt => nt.gaba < 0.4 ? 1.5 : 0.3 },
      { text: 'is barely there', w: nt => nt.gaba > 0.5 ? 0.8 : 0.2 },
      { text: 'lives at the edge of it', w: nt => nt.ne > 0.6 ? 1.0 : 0.2 },
      { text: "won't resolve into a source", w: nt => nt.ne > 0.65 ? 0.8 : 0.1 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'persistent', w: nt => nt.gaba < 0.4 ? 1.0 : 0.1 },
      { text: 'just above hearing', w: nt => nt.ne > 0.6 ? 0.8 : 0.1 },
      { text: 'thin', w: nt => nt.ne > 0.55 ? 0.6 : 0.1 },
      { text: 'unplaceable', w: nt => nt.aden > 0.5 ? 0.5 : 0.1 },
    ],
    body_subjects: [
      { text: 'the back of the skull', w: nt => nt.ne > 0.6 ? 1.5 : 0.3 },
      { text: 'something behind the ears', w: nt => nt.ne > 0.55 ? 1.2 : 0.4 },
      { text: 'attention', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
      { text: 'the ears', w: 0.6 },
      { text: 'something', w: nt => nt.gaba < 0.4 ? 1.0 : 0.4 },
    ],
    body_predicates: [
      { text: "keeps finding it", w: nt => nt.ne > 0.6 ? 2.0 : 0.4 },
      { text: "can't let it go", w: nt => nt.gaba < 0.4 ? 1.8 : 0.3 },
      { text: 'registers it even when you stop listening', w: nt => nt.ne > 0.55 ? 1.5 : 0.3 },
      { text: 'has been tracking this the whole time', w: nt => nt.ne > 0.6 ? 1.2 : 0.2 },
      { text: 'catches on it and stays', w: nt => nt.gaba < 0.4 ? 1.0 : 0.2 },
      { text: 'tightens slightly', w: nt => nt.ne > 0.65 ? 0.8 : 0.1 },
    ],
    fragments: [
      'a thin whine',
      { text: "a frequency that doesn't belong", w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
      { text: 'a pitch from somewhere', w: nt => nt.ne > 0.5 ? 0.8 : 0.3 },
      { text: 'something barely there', w: nt => nt.gaba > 0.5 ? 0.8 : 0.2 },
      { text: 'a whine in the walls', w: nt => nt.gaba < 0.4 ? 0.8 : 0.2 },
      { text: 'a frequency, unlocatable', w: nt => nt.ne > 0.65 ? 0.7 : 0.1 },
    ],
    flat_descriptions: [
      { text: 'A thin whine from somewhere.', w: nt => nt.ne > 0.6 ? 1.2 : 0.3 },
      { text: "Something electronic, unlocatable.", w: nt => nt.aden > 0.5 ? 1.0 : 0.2 },
      { text: "The pitch doesn't stop.", w: nt => nt.gaba < 0.4 ? 1.2 : 0.1 },
    ],
    appositive_np: [
      'a thin whine from the walls',
      { text: 'a frequency that has no source',    w: nt => nt.ne > 0.6 ? 1.2 : 0.4 },
      { text: 'something electronic, persistent',  w: nt => nt.gaba < 0.4 ? 1.0 : 0.3 },
      { text: 'a pitch, barely there',             w: nt => nt.gaba > 0.5 ? 0.8 : 0.2 },
    ],
  },

  traffic_through_walls: {
    subjects: [
      'traffic outside',
      { text: 'the street', w: nt => nt.aden < 0.5 ? 1.0 : 0.3 },
      { text: 'cars outside', w: nt => nt.ne > 0.6 ? 1.0 : 0.4 },
      { text: 'something outside', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
      { text: 'the world outside', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.2 },
      { text: 'a truck', w: nt => nt.ne > 0.6 ? 0.7 : 0.2 },
      { text: 'the road', w: nt => nt.aden > 0.5 ? 0.5 : 0.2 },
    ],
    predicates: [
      'bleeds through the walls',
      'makes it through anyway',
      { text: 'is still going', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'keeps on', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
      { text: 'comes through the floor', w: 0.5 },
      { text: 'is still there', w: nt => nt.serotonin < 0.35 ? 1.0 : 0.2 },
      { text: 'pushes through the window frame', w: nt => nt.gaba < 0.4 ? 1.0 : 0.3 },
      { text: "doesn't stop for the walls", w: nt => nt.ne > 0.6 ? 1.0 : 0.2 },
      { text: 'sits under everything', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'low', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
      { text: 'muffled', w: nt => nt.gaba > 0.5 ? 0.7 : 0.2 },
      { text: 'constant', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.15 },
      { text: 'somewhere below', w: nt => nt.aden > 0.5 ? 0.6 : 0.1 },
      { text: 'even now', w: nt => nt.serotonin < 0.35 ? 0.7 : 0.1 },
    ],
    body_subjects: [
      { text: 'something in you', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'the body', w: 0.6 },
      { text: 'the chest', w: nt => nt.gaba < 0.4 ? 1.0 : 0.2 },
      { text: 'your attention', w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
      { text: 'something', w: 0.5 },
    ],
    body_predicates: [
      { text: 'has been hearing this the whole time', w: nt => nt.aden > 0.5 ? 1.5 : 0.4 },
      { text: 'registers the weight of it', w: nt => nt.ne > 0.55 ? 1.2 : 0.4 },
      { text: 'knows the world kept going', w: nt => nt.serotonin < 0.4 ? 1.5 : 0.3 },
      { text: 'absorbs the low frequency of it', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'feels the road through the floor', w: nt => nt.ne > 0.6 ? 1.0 : 0.2 },
      { text: 'settles into it', w: nt => nt.gaba > 0.5 ? 0.8 : 0.2 },
    ],
    fragments: [
      'traffic outside',
      { text: 'the street, muffled', w: 0.8 },
      { text: 'traffic', w: 0.5 },
      { text: 'something outside', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
      { text: 'the road', w: nt => nt.aden > 0.5 ? 0.6 : 0.2 },
      { text: 'a low hum of street', w: nt => nt.aden > 0.6 ? 0.7 : 0.2 },
    ],
    flat_descriptions: [
      { text: 'The street kept going.', w: nt => nt.serotonin < 0.4 ? 1.5 : 0.2 },
      'Traffic, through the walls.',
      { text: 'Still the road.', w: nt => nt.serotonin < 0.35 ? 1.0 : 0.1 },
    ],
    appositive_np: [
      'traffic coming through anyway',
      { text: 'the road, muffled but there', w: nt => nt.gaba > 0.5 ? 1.0 : 0.4 },
      { text: 'the street still going',       w: nt => nt.serotonin < 0.4 ? 1.2 : 0.4 },
      { text: 'something low from outside',   w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
    ],
  },

  indoor_temperature: {
    subjects: [
      { text: 'the room', w: 1.0 },
      { text: 'the apartment', w: 0.6 },
      { text: 'the air', w: 0.8 },
      { text: 'the floor', w: (nt, obs) => obs.properties.thermal?.cold ? 0.7 : 0.2 },
      { text: 'the window', w: (nt, obs) => obs.properties.thermal?.cold ? 0.5 : 0.2 },
    ],
    predicates: [
      { text: 'is cold', w: (nt, obs) => obs.properties.thermal?.cold ? 1.0 : 0 },
      { text: "hasn't warmed up", w: (nt, obs) => obs.properties.thermal?.cold ? 0.7 : 0 },
      { text: 'holds the cold', w: (nt, obs) => obs.properties.thermal?.cold ? 0.8 : 0 },
      { text: 'is cold in the morning way', w: (nt, obs) => obs.properties.thermal?.cold ? 0.6 : 0 },
      { text: 'is warm', w: (nt, obs) => obs.properties.thermal?.warm ? 1.0 : 0 },
      { text: 'holds the heat', w: (nt, obs) => obs.properties.thermal?.warm ? 0.8 : 0 },
      { text: 'is close', w: (nt, obs) => obs.properties.thermal?.warm ? 0.7 : 0 },
      { text: 'is stuffy', w: (nt, obs) => obs.properties.thermal?.warm && nt.gaba < 0.4 ? 1.0 : 0 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'still', w: (nt, obs) => obs.properties.thermal?.cold ? 0.7 : 0 },
      { text: 'through the blanket', w: (nt, obs) => obs.properties.thermal?.cold ? 0.5 : 0 },
    ],
    body_subjects: [
      { text: 'the cold', w: (nt, obs) => obs.properties.thermal?.cold ? 1.5 : 0.1 },
      { text: 'cold', w: (nt, obs) => obs.properties.thermal?.cold && nt.aden > 0.6 ? 1.2 : 0.4 },
      { text: 'the warmth', w: (nt, obs) => obs.properties.thermal?.warm ? 1.5 : 0.1 },
      { text: 'heat', w: (nt, obs) => obs.properties.thermal?.warm && nt.gaba < 0.4 ? 1.2 : 0.2 },
    ],
    body_predicates: [
      { text: 'sits in the room', w: 1.0 },
      { text: 'has settled in', w: 0.8 },
      { text: 'finds its way through', w: nt => nt.ne > 0.5 ? 1.0 : 0.4 },
      { text: 'finds the face first', w: (nt, obs) => obs.properties.thermal?.cold ? 0.8 : 0.2 },
      { text: 'comes from the floor', w: (nt, obs) => obs.properties.thermal?.cold ? 0.7 : 0.1 },
      { text: 'is everywhere at once', w: (nt, obs) => obs.properties.thermal?.warm && nt.gaba < 0.4 ? 1.5 : 0.1 },
      { text: 'presses in', w: (nt, obs) => obs.properties.thermal?.warm && nt.gaba < 0.4 ? 1.0 : 0.1 },
    ],
    fragments: [
      { text: 'cold', w: (nt, obs) => obs.properties.thermal?.cold ? 2.5 : 0 },
      { text: 'warm in here', w: (nt, obs) => obs.properties.thermal?.warm ? 2.5 : 0 },
      { text: 'the room', w: 0.3 },
      { text: 'cold floor', w: (nt, obs) => obs.properties.thermal?.cold ? 0.8 : 0 },
      { text: 'stuffy', w: (nt, obs) => obs.properties.thermal?.warm && nt.gaba < 0.4 ? 1.0 : 0 },
    ],
    character_predicates: [
      { text: 'lived in the floor',        w: (nt, obs) => obs.properties.thermal?.cold ? 1.5 : 0.1 },
      { text: 'came from the window',      w: (nt, obs) => obs.properties.thermal?.cold ? 1.2 : 0.1 },
      { text: 'had been there all night',  w: (nt, obs) => obs.properties.thermal?.cold ? 1.0 : 0.1 },
      { text: 'sat in the room',           w: nt => nt.gaba > 0.5 ? 0.8 : 0.2 },
    ],
    flat_descriptions: [
      { text: 'The room was cold.',  w: (nt, obs) => obs.properties.thermal?.cold && nt.serotonin < 0.4  ? 1.5 : 0.1 },
      { text: 'Still cold.',         w: (nt, obs) => obs.properties.thermal?.cold && nt.serotonin < 0.35 ? 1.2 : 0.1 },
    ],
    appositive_np: [
      { text: 'cold through the floor',   w: (nt, obs) => obs.properties.thermal?.cold ? 1.5 : 0 },
      { text: 'a chill from the window',  w: (nt, obs) => obs.properties.thermal?.cold ? 1.2 : 0 },
      { text: 'the cold of the room',     w: (nt, obs) => obs.properties.thermal?.cold ? 1.0 : 0 },
      { text: 'warmth pressed in',        w: (nt, obs) => obs.properties.thermal?.warm ? 1.5 : 0 },
    ],
  },

  fatigue: {
    subjects: [
      { text: 'something', w: nt => nt.aden > 0.7 ? 1.5 : 0.5 },
      { text: 'the body', w: 0.6 },
      { text: 'it', w: nt => nt.aden > 0.7 ? 0.8 : 0.2 },
      { text: 'the weight of it', w: nt => nt.aden > 0.80 ? 1.0 : 0.1 },
    ],
    predicates: [
      { text: 'has weight to it', w: 1.0 },
      { text: "doesn't lift", w: nt => nt.aden > 0.7 ? 1.0 : 0.3 },
      { text: 'is there', w: nt => nt.aden > 0.6 ? 0.8 : 0.3 },
      { text: 'sits in the limbs', w: nt => nt.aden > 0.65 ? 1.2 : 0.3 },
      { text: "hasn't cleared", w: nt => nt.aden > 0.65 ? 1.0 : 0.3 },
      { text: 'stays', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'still', w: nt => nt.aden > 0.7 ? 0.8 : 0.2 },
      { text: 'a specific kind', w: nt => nt.aden > 0.6 ? 0.6 : 0.1 },
    ],
    body_subjects: [
      { text: 'something', w: nt => nt.aden > 0.7 ? 1.5 : 0.8 },
      { text: 'weight', w: nt => nt.aden > 0.65 ? 1.5 : 0.5 },
      { text: 'everything', w: nt => nt.aden > 0.85 ? 1.2 : 0.2 },
      { text: 'the arms', w: nt => nt.aden > 0.65 ? 0.8 : 0.2 },
      { text: 'the body', w: 0.5 },
    ],
    body_predicates: [
      { text: 'pulls toward horizontal', w: nt => nt.aden > 0.80 ? 2.0 : 0.3 },
      { text: 'has the density of something real', w: nt => nt.aden > 0.80 ? 1.5 : 0.1 },
      { text: 'settles into the shoulders', w: nt => nt.aden > 0.65 ? 2.0 : 0.4 },
      { text: 'sits in the chest', w: nt => nt.aden > 0.65 ? 1.0 : 0.3 },
      { text: 'is just there', w: 0.8 },
      { text: 'makes itself heavy', w: nt => nt.aden > 0.6 ? 1.0 : 0.3 },
      { text: 'refuses to lift', w: nt => nt.aden > 0.75 ? 1.5 : 0.2 },
      { text: 'wants to lie down', w: nt => nt.aden > 0.80 ? 1.5 : 0.3 },
    ],
    fragments: [
      { text: 'heavy', w: nt => nt.aden > 0.65 ? 1.5 : 0.7 },
      { text: 'something', w: nt => nt.aden > 0.7 ? 1.0 : 0.3 },
      { text: 'the body, heavy', w: nt => nt.aden > 0.80 ? 1.0 : 0.1 },
      { text: 'still tired', w: nt => nt.aden > 0.65 ? 0.8 : 0.1 },
    ],
    reframe_pairs: [
      { rough: 'tired',  precise: 'somewhere past it',          w: nt => nt.aden > 0.7  ? 1.5 : 0.5 },
      { rough: 'heavy',  precise: 'dissolved',                  w: nt => nt.aden > 0.8  ? 1.5 : 0.3 },
      { rough: 'sleepy', precise: 'something further along',    w: nt => nt.aden > 0.65 ? 1.0 : 0.3 },
      { rough: 'tired',  precise: 'just behind everything',     w: nt => nt.aden > 0.6  ? 0.8 : 0.2 },
    ],
    character_predicates: [
      { text: 'lived in the limbs',                    w: nt => nt.aden > 0.65 ? 1.5 : 0.5 },
      { text: 'had settled into the shoulders',        w: nt => nt.aden > 0.6  ? 1.2 : 0.4 },
      { text: 'had been there since before she woke',  w: nt => nt.aden > 0.7  ? 1.0 : 0.2 },
      { text: 'had its own weight',                    w: nt => nt.aden > 0.65 ? 1.0 : 0.3 },
      { text: "wasn't going anywhere",                 w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
      { text: 'was there when she checked',            w: 0.5 },
    ],
    flat_descriptions: [
      { text: 'Still tired.',             w: nt => nt.aden > 0.65 ? 1.5 : 0.3 },
      { text: 'The body was what it was.', w: nt => nt.serotonin < 0.35 ? 1.2 : 0.2 },
      { text: 'Heavy in the same way.',   w: nt => nt.aden > 0.7  ? 1.0 : 0.2 },
    ],
    inversion_conditions: [
      { text: 'but only when she stopped moving',          w: nt => nt.aden > 0.65 ? 1.5 : 0.3 },
      { text: 'but only when she had a second to notice',  w: 0.7 },
      { text: 'but only when she sat down',                w: nt => nt.aden > 0.6  ? 1.0 : 0.3 },
    ],
    appositive_np: [
      { text: 'a weight in the limbs',              w: nt => nt.aden > 0.65 ? 1.5 : 0.5 },
      { text: 'something settled in the shoulders', w: nt => nt.aden > 0.6  ? 1.2 : 0.3 },
      { text: 'the usual heaviness',                w: 0.8 },
      { text: 'the familiar kind',                  w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
    ],
  },

  hunger_signal: {
    subjects: [
      { text: 'something', w: (nt, obs) => obs.properties.interoception?.low_grade ? 1.5 : 0.5 },
      { text: 'hunger', w: (nt, obs) => (obs.properties.interoception?.gnawing || obs.properties.interoception?.hollow) ? 1.5 : 0.7 },
      { text: 'an emptiness', w: (nt, obs) => obs.properties.interoception?.hollow ? 2.0 : 0.2 },
      { text: 'an irritability', w: (nt, obs) => obs.properties.interoception?.irritable ? 1.5 : 0.1 },
      { text: 'the stomach', w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.2 : 0.4 },
      { text: 'it', w: (nt, obs) => obs.properties.interoception?.low_grade ? 0.8 : 0.2 },
    ],
    predicates: [
      { text: 'is there', w: 0.8 },
      { text: 'makes itself known', w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.5 : 0.5 },
      { text: 'is going', w: (nt, obs) => obs.properties.interoception?.low_grade ? 1.5 : 0.5 },
      { text: 'is starting', w: (nt, obs) => obs.properties.interoception?.low_grade ? 1.0 : 0.2 },
      { text: 'is audible', w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.2 : 0.2 },
      { text: 'is specific', w: (nt, obs) => obs.properties.interoception?.hollow ? 1.0 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
    ],
    body_subjects: [
      { text: 'hunger', w: (nt, obs) => (obs.properties.interoception?.gnawing || obs.properties.interoception?.hollow) ? 1.5 : 0.7 },
      { text: 'something', w: 0.8 },
      { text: 'an emptiness', w: (nt, obs) => obs.properties.interoception?.hollow ? 1.5 : 0.2 },
      { text: 'the stomach', w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.2 : 0.3 },
    ],
    body_predicates: [
      { text: "hasn't found a target yet", w: (nt, obs) => obs.properties.interoception?.irritable ? 1.5 : 0.3 },
      { text: "won't stop", w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.5 : 0.3 },
      { text: 'makes itself specific', w: (nt, obs) => obs.properties.interoception?.hollow ? 1.0 : 0.3 },
      { text: 'is in the background', w: (nt, obs) => obs.properties.interoception?.low_grade ? 1.5 : 0.3 },
      { text: 'is starting', w: (nt, obs) => obs.properties.interoception?.low_grade ? 1.0 : 0.2 },
      { text: 'is audible now', w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.2 : 0.2 },
      { text: 'has been going for a while', w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.0 : 0.2 },
      { text: 'presents itself', w: (nt, obs) => obs.properties.interoception?.hollow ? 0.8 : 0.2 },
    ],
    fragments: [
      { text: 'hungry', w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.5 : 0.8 },
      { text: 'something', w: (nt, obs) => obs.properties.interoception?.low_grade ? 1.5 : 0.5 },
      { text: 'hollow', w: (nt, obs) => obs.properties.interoception?.hollow ? 1.5 : 0.1 },
      { text: 'the stomach', w: (nt, obs) => obs.properties.interoception?.gnawing ? 0.8 : 0.2 },
    ],
    reframe_pairs: [
      { rough: 'hungry',      precise: 'empty in a specific way',       w: (nt, obs) => obs.properties.interoception?.hollow  ? 1.5 : 0.5 },
      { rough: 'hungry',      precise: 'past it and into something else', w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.2 : 0.2 },
      { rough: 'just hungry', precise: 'running on nothing',            w: 0.6 },
    ],
    character_predicates: [
      { text: 'had its own schedule',              w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.5 : 0.5 },
      { text: "wasn't going anywhere",             w: 1.0 },
      { text: 'made itself specific',              w: (nt, obs) => obs.properties.interoception?.hollow  ? 1.2 : 0.3 },
      { text: 'had been making its case for a while', w: (nt, obs) => obs.properties.interoception?.gnawing ? 1.0 : 0.2 },
      { text: 'lived somewhere below the ribs',   w: (nt, obs) => obs.properties.interoception?.hollow  ? 1.0 : 0.3 },
    ],
    flat_descriptions: [
      { text: 'Still hungry.',     w: nt => nt.serotonin < 0.4 ? 1.5 : 0.3 },
      'Hunger was hunger.',
    ],
    inversion_conditions: [
      { text: 'but only when she thought about food',  w: (nt, obs) => obs.properties.interoception?.low_grade ? 1.5 : 0.3 },
      { text: 'but only when she stopped to notice',   w: 0.8 },
    ],
    appositive_np: [
      { text: 'something starting',               w: (nt, obs) => obs.properties.interoception?.low_grade ? 1.5 : 0.5 },
      { text: 'the stomach making itself known',  w: (nt, obs) => obs.properties.interoception?.gnawing  ? 1.5 : 0.3 },
      { text: 'hunger making its case',           w: (nt, obs) => obs.properties.interoception?.gnawing  ? 1.0 : 0.3 },
    ],
  },

  anxiety_signal: {
    subjects: [
      { text: 'something', w: 1.2 },
      { text: 'the body', w: nt => nt.ne > 0.65 ? 1.0 : 0.4 },
      { text: 'an unease', w: nt => nt.gaba < 0.35 ? 1.0 : 0.3 },
      { text: 'a tightness', w: nt => nt.gaba < 0.35 || nt.ne > 0.65 ? 0.8 : 0.2 },
      { text: 'the chest', w: nt => nt.gaba < 0.35 ? 0.8 : 0.1 },
    ],
    predicates: [
      { text: "can't settle", w: nt => nt.gaba < 0.35 ? 2.0 : 0.3 },
      { text: 'is running faster than it should', w: nt => nt.ne > 0.65 ? 2.0 : 0.2 },
      { text: 'is ahead of wherever this is going', w: nt => nt.ne > 0.65 ? 1.0 : 0.2 },
      { text: 'needs something to fix on', w: nt => nt.ne > 0.52 && nt.gaba < 0.45 ? 1.5 : 0.3 },
      { text: 'is there and unreasonable', w: nt => nt.gaba < 0.4 ? 1.0 : 0.2 },
      { text: 'has no object', w: nt => nt.gaba < 0.35 ? 0.8 : 0.1 },
      { text: 'braces', w: nt => nt.ne > 0.65 ? 0.8 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
    ],
    body_subjects: [
      { text: 'something', w: 1.5 },
      { text: 'the body', w: 0.8 },
      { text: 'a tightness', w: nt => nt.gaba < 0.4 ? 1.0 : 0.3 },
    ],
    body_predicates: [
      { text: "can't settle", w: nt => nt.gaba < 0.35 ? 2.0 : 0.5 },
      { text: 'is already ahead of this', w: nt => nt.ne > 0.65 ? 1.5 : 0.3 },
      { text: 'keeps looking for the thing', w: nt => nt.ne > 0.52 && nt.gaba < 0.45 ? 1.5 : 0.3 },
      { text: 'is running without direction', w: 0.7 },
      { text: 'is somewhere in the chest', w: nt => nt.gaba < 0.4 ? 1.0 : 0.3 },
      { text: 'has no object for this', w: nt => nt.gaba < 0.35 ? 0.8 : 0.2 },
      { text: 'is bracing against something', w: nt => nt.ne > 0.65 ? 0.8 : 0.2 },
    ],
    fragments: [
      { text: "can't settle", w: nt => nt.gaba < 0.35 ? 1.5 : 0.8 },
      { text: 'something', w: 0.6 },
      { text: 'braced', w: nt => nt.ne > 0.65 ? 1.0 : 0.2 },
      { text: 'the chest, tight', w: nt => nt.gaba < 0.35 ? 1.0 : 0.1 },
    ],
    reframe_pairs: [
      { rough: 'anxious',   precise: 'running ahead of itself',        w: nt => nt.ne > 0.65  ? 1.5 : 0.4 },
      { rough: 'nervous',   precise: 'already past the thing',         w: nt => nt.ne > 0.6   ? 1.2 : 0.3 },
      { rough: 'anxious',   precise: 'looking for something to fix on', w: nt => nt.gaba < 0.35 ? 1.0 : 0.3 },
      { rough: 'unsettled', precise: 'in a way that had no object',    w: nt => nt.gaba < 0.4  ? 0.8 : 0.2 },
    ],
    character_predicates: [
      { text: 'had been running before this',        w: nt => nt.ne > 0.65   ? 2.0 : 0.3 },
      { text: 'had no object for any of this',       w: nt => nt.gaba < 0.35 ? 1.5 : 0.3 },
      { text: 'lived somewhere in the chest',        w: nt => nt.gaba < 0.4  ? 1.2 : 0.3 },
      { text: 'was ahead of wherever this was going', w: nt => nt.ne > 0.6   ? 1.2 : 0.2 },
      { text: "wouldn't settle",                     w: nt => nt.gaba < 0.4  ? 1.0 : 0.3 },
    ],
    inversion_conditions: [
      { text: "but only when she stopped thinking about it", w: nt => nt.gaba < 0.4 ? 1.2 : 0.4 },
      { text: "but only when she wasn't paying attention",   w: nt => nt.ne > 0.6   ? 1.0 : 0.3 },
    ],
    appositive_np: [
      { text: 'something already in the chest', w: nt => nt.gaba < 0.4  ? 1.5 : 0.3 },
      { text: 'a tightness that had been there', w: nt => nt.ne > 0.6   ? 1.2 : 0.4 },
      { text: 'the body already running',        w: nt => nt.ne > 0.65  ? 1.0 : 0.2 },
    ],
  },

  traffic_outdoor: {
    subjects: [
      'a car',
      { text: 'traffic', w: 0.7 },
      { text: "someone's car", w: 0.6 },
      { text: 'a bus', w: 0.4 },
      { text: 'something on the road', w: nt => nt.aden > 0.5 ? 0.7 : 0.2 },
      { text: 'a truck', w: nt => nt.ne > 0.55 ? 0.6 : 0.2 },
      { text: 'the intersection', w: nt => nt.ne > 0.6 ? 0.5 : 0.15 },
    ],
    predicates: [
      'goes past',
      'passes',
      { text: 'slows and accelerates', w: 0.7 },
      { text: 'rumbles past', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'goes by without stopping', w: 0.5 },
      { text: 'scrapes past', w: nt => nt.ne > 0.6 ? 0.8 : 0.2 },
      { text: 'idles at the light', w: 0.5 },
      { text: 'accelerates away', w: nt => nt.ne > 0.55 ? 0.7 : 0.2 },
      { text: 'turns somewhere', w: nt => nt.aden > 0.5 ? 0.6 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 1.0 },
      { text: 'without stopping', w: 0.8 },
      { text: 'with its headlights still on', w: 0.6 },
      { text: 'somewhere to be', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.2 },
      { text: 'at the corner', w: 0.4 },
      { text: 'not slowing', w: nt => nt.ne > 0.6 ? 0.7 : 0.1 },
      { text: 'going wherever', w: nt => nt.aden > 0.5 ? 0.5 : 0.1 },
    ],
    body_subjects: [
      { text: 'your ears', w: nt => nt.ne > 0.55 ? 1.5 : 0.5 },
      { text: 'something in you', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'attention', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
      { text: 'the body', w: 0.5 },
      { text: 'the back of the neck', w: nt => nt.ne > 0.65 ? 0.8 : 0.1 },
    ],
    body_predicates: [
      { text: 'catches each one passing', w: nt => nt.ne > 0.6 ? 1.5 : 0.4 },
      { text: 'tracks the sound until it goes', w: nt => nt.ne > 0.55 ? 1.2 : 0.4 },
      { text: 'registers something going somewhere', w: nt => nt.serotonin < 0.4 ? 1.2 : 0.5 },
      { text: 'notes each one, unbidden', w: nt => nt.ne > 0.6 ? 1.0 : 0.2 },
      { text: 'lets them go', w: nt => nt.gaba > 0.5 ? 1.0 : 0.3 },
      { text: 'lifts slightly at each pass', w: nt => nt.ne > 0.55 ? 0.8 : 0.2 },
    ],
    fragments: [
      'traffic',
      { text: 'a car going past', w: 0.7 },
      { text: 'a bus', w: 0.4 },
      { text: 'the street', w: 0.4 },
      { text: 'the intersection', w: nt => nt.ne > 0.6 ? 0.6 : 0.2 },
      { text: 'a truck going past', w: nt => nt.ne > 0.55 ? 0.6 : 0.2 },
    ],
    appositive_np: [
      'the street doing what it does',
      { text: 'a car going past without stopping', w: 0.8 },
      { text: 'traffic, just traffic',              w: nt => nt.serotonin < 0.4 ? 1.2 : 0.4 },
      { text: 'the road still going',               w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
    ],
  },

  street_voices: {
    subjects: [
      'voices',
      { text: 'someone', w: 0.7 },
      { text: 'two people', w: 0.6 },
      { text: 'a voice', w: 0.5 },
      { text: 'someone out there', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
      { text: 'someone laughing', w: nt => nt.serotonin < 0.4 ? 0.5 : 0.2 },
      { text: 'a conversation', w: nt => nt.ne > 0.55 ? 0.6 : 0.2 },
    ],
    predicates: [
      'from across the street',
      'passing',
      { text: 'going past without stopping', w: 0.5 },
      { text: 'going somewhere', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.3 },
      { text: 'out there', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'nearby', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'carrying on below', w: nt => nt.gaba > 0.5 ? 0.7 : 0.2 },
      { text: 'going by, words not quite landing', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
      { text: 'outside, unintelligible', w: nt => nt.aden > 0.55 ? 0.7 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'not stopping', w: 0.5 },
      { text: 'going on about something', w: nt => nt.ne > 0.55 ? 0.7 : 0.1 },
      { text: 'at a distance', w: nt => nt.aden > 0.5 ? 0.6 : 0.2 },
      { text: 'words not landing', w: nt => nt.aden > 0.55 ? 0.6 : 0.1 },
    ],
    ambiguity_alts: ['the building', 'the apartment above'],
    escapes: [
      { text: 'it was just people', w: 1.0 },
      { text: 'they were just out there', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'people had somewhere to go', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
    ],
    body_subjects: [
      { text: 'something in you', w: nt => nt.serotonin < 0.4 ? 1.5 : 0.5 },
      { text: 'your ears', w: nt => nt.ne > 0.55 ? 1.2 : 0.4 },
      { text: 'the space behind your eyes', w: nt => nt.aden > 0.55 ? 1.0 : 0.2 },
      { text: 'attention', w: nt => nt.ne > 0.6 ? 0.8 : 0.3 },
      { text: 'something', w: 0.5 },
    ],
    body_predicates: [
      { text: 'reaches for the words and finds none', w: nt => nt.aden > 0.55 ? 1.5 : 0.3 },
      { text: 'goes toward it without deciding to', w: nt => nt.ne > 0.6 ? 1.5 : 0.3 },
      { text: 'registers people, specifically', w: nt => nt.serotonin < 0.4 ? 1.2 : 0.4 },
      { text: "can't resolve it into meaning", w: nt => nt.aden > 0.5 ? 1.2 : 0.3 },
      { text: 'catches the tone, not the words', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'lets it pass', w: nt => nt.gaba > 0.5 ? 1.0 : 0.2 },
    ],
    fragments: [
      'voices',
      { text: 'someone outside', w: 0.6 },
      { text: 'someone going by', w: 0.5 },
      { text: 'out there', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
      { text: 'people', w: 0.5 },
      { text: 'a conversation outside', w: nt => nt.ne > 0.55 ? 0.6 : 0.2 },
    ],
    appositive_np: [
      'people outside',
      { text: 'voices not stopping',           w: nt => nt.ne > 0.55 ? 1.0 : 0.4 },
      { text: 'someone going somewhere',        w: nt => nt.serotonin < 0.4 ? 1.0 : 0.4 },
      { text: 'words that never quite arrive',  w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
    ],
  },

  park_ambient: {
    // The acoustic texture of a park: birds, wind in leaves, distant children, dogs.
    // Season-aware via obs.properties.sound.season and birds/children booleans.
    subjects: [
      'a bird',
      { text: 'birds', w: 0.7 },
      { text: 'something in the trees', w: 0.8 },
      { text: 'the trees', w: (nt, obs) => obs.properties.sound?.birds === false ? 0.8 : 0.3 },
      { text: 'a dog somewhere', w: 0.5 },
      { text: 'children', w: (nt, obs) => obs.properties.sound?.children === true ? 0.7 : 0 },
      { text: 'wind in the leaves', w: (nt, obs) => obs.properties.sound?.birds === true ? 0.4 : 0.8 },
      { text: 'leaves', w: nt => nt.aden > 0.5 ? 0.7 : 0.3 },
    ],
    predicates: [
      'somewhere nearby',
      { text: 'in the branches', w: (nt, obs) => obs.properties.sound?.birds ? 1.2 : 0.2 },
      { text: 'across the grass', w: 0.7 },
      { text: 'far enough away', w: nt => nt.gaba > 0.5 ? 0.9 : 0.3 },
      { text: 'in a tree above the path', w: (nt, obs) => obs.properties.sound?.birds ? 0.9 : 0.1 },
      { text: 'moving through the canopy', w: (nt, obs) => obs.properties.sound?.birds === false ? 1.2 : 0.3 }, // winter: wind, no birds
      { text: 'in the distance', w: (nt, obs) => obs.properties.sound?.children === true ? 0.8 : 0.2 },
      { text: 'at the far end of the park', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'not coming closer', w: nt => nt.gaba < 0.45 ? 0.5 : 0.1 },
      { text: 'doing whatever it does', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
      { text: 'undisturbed', w: nt => nt.serotonin > 0.5 ? 0.7 : 0.2 },
      { text: 'at the edge of what you can hear', w: nt => nt.ne < 0.5 ? 0.6 : 0.1 },
    ],
    body_subjects: [
      { text: 'something in you', w: nt => nt.serotonin > 0.5 ? 1.2 : 0.4 },
      { text: 'your ears', w: nt => nt.ne > 0.6 ? 1.5 : 0.5 },
      { text: 'attention', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'the body', w: 0.5 },
    ],
    body_predicates: [
      { text: 'catches the bird without trying', w: (nt, obs) => obs.properties.sound?.birds && nt.ne > 0.55 ? 1.2 : 0.3 },
      { text: 'relaxes slightly at the sound', w: nt => nt.serotonin > 0.5 ? 1.0 : 0.2 },
      { text: 'tracks it until it goes quiet', w: nt => nt.ne > 0.55 ? 0.9 : 0.2 },
      { text: 'lets it pass', w: nt => nt.gaba > 0.5 ? 1.0 : 0.3 },
      { text: 'doesn\'t brace at it', w: nt => nt.gaba > 0.55 ? 0.8 : 0.1 },
    ],
    escapes: [
      { text: 'it was just a bird', w: 1.0 },
      { text: 'it was just the trees', w: (nt, obs) => obs.properties.sound?.birds === false ? 1.2 : 0.5 },
      { text: 'it was the park doing what parks do', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
    ],
    fragments: [
      'a bird',
      { text: 'the trees', w: 0.7 },
      { text: 'wind in leaves', w: (nt, obs) => obs.properties.sound?.birds === false ? 1.2 : 0.4 },
      { text: 'something in a tree', w: (nt, obs) => obs.properties.sound?.birds ? 0.9 : 0.2 },
      { text: 'a dog somewhere', w: 0.4 },
      { text: 'the park', w: nt => nt.aden > 0.5 ? 0.7 : 0.3 },
    ],
    appositive_np: [
      'a bird in the branches',
      { text: 'the park doing its thing', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'something in the trees',  w: 0.8 },
      { text: 'wind through leaves',     w: (nt, obs) => obs.properties.sound?.birds === false ? 1.2 : 0.4 },
    ],
  },

  library_ambient: {
    // The acoustic texture of a library: pages, distant keyboards, AC, deliberate quiet.
    // busy boolean (10am–6pm) modulates how many sources of sound are present.
    subjects: [
      { text: 'someone', w: (nt, obs) => obs.properties.sound?.busy ? 0.8 : 0.3 },
      { text: 'the AC', w: nt => nt.gaba < 0.4 ? 1.2 : 0.6 },
      { text: 'a keyboard', w: (nt, obs) => obs.properties.sound?.busy ? 0.9 : 0.3 },
      { text: 'the building', w: nt => nt.aden > 0.55 ? 0.8 : 0.3 },
      { text: 'a page', w: 1.0 },
      { text: 'the hush', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.4 },
      { text: 'a chair', w: (nt, obs) => obs.properties.sound?.busy ? 0.6 : 0.2 },
    ],
    predicates: [
      'turns a page somewhere',
      { text: 'clicks through screens at the terminal', w: (nt, obs) => obs.properties.sound?.busy ? 1.0 : 0.2 },
      { text: 'runs overhead', w: nt => nt.gaba < 0.4 ? 1.2 : 0.5 },
      { text: 'shifts in its chair', w: (nt, obs) => obs.properties.sound?.busy ? 0.8 : 0.15 },
      { text: 'settles under the hush', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'coughs once, quietly', w: (nt, obs) => obs.properties.sound?.busy ? 0.7 : 0.2 },
      { text: 'holds everything at the same distance', w: nt => nt.aden > 0.6 ? 1.2 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'somewhere in the stacks', w: nt => nt.aden > 0.5 ? 0.9 : 0.3 },
      { text: 'and nothing answers it', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.1 },
      { text: 'at the right volume for the room', w: nt => nt.gaba > 0.5 ? 0.7 : 0.1 },
      { text: 'then nothing', w: nt => nt.ne > 0.55 ? 0.6 : 0.2 },
    ],
    body_subjects: [
      { text: 'attention', w: nt => nt.ne > 0.55 ? 1.5 : 0.5 },
      { text: 'your ears', w: nt => nt.gaba < 0.4 ? 1.2 : 0.4 },
      { text: 'something', w: nt => nt.aden > 0.55 ? 1.0 : 0.3 },
      { text: 'the body', w: 0.5 },
    ],
    body_predicates: [
      { text: 'drifts toward it, then away', w: nt => nt.aden > 0.55 ? 1.5 : 0.5 },
      { text: 'catches on it', w: nt => nt.ne > 0.6 ? 1.5 : 0.3 },
      { text: 'registers it and releases it', w: nt => nt.gaba > 0.5 ? 1.2 : 0.3 },
      { text: 'parses it as background and files it away', w: nt => nt.aden < 0.5 ? 1.0 : 0.2 },
      { text: 'can\'t not notice', w: nt => nt.gaba < 0.4 ? 1.2 : 0.1 },
    ],
    escapes: [
      { text: 'just the library', w: 1.0 },
      { text: 'just the building being what it is', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'the room doing what rooms do when people try to be quiet in them', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
    ],
    fragments: [
      'a page turning',
      { text: 'the AC', w: nt => nt.gaba < 0.4 ? 1.2 : 0.5 },
      { text: 'someone at a terminal', w: (nt, obs) => obs.properties.sound?.busy ? 0.9 : 0.2 },
      { text: 'the hush', w: nt => nt.aden > 0.5 ? 0.9 : 0.4 },
      { text: 'a cough, covered', w: 0.5 },
      { text: 'the library', w: nt => nt.aden > 0.55 ? 0.7 : 0.3 },
    ],
    flat_descriptions: [
      'Someone turns a page somewhere.',
      { text: 'The AC.', w: nt => nt.gaba < 0.4 ? 1.2 : 0.5 },
      { text: 'Your attention drifts toward it, then away.', w: nt => nt.aden > 0.5 ? 1.0 : 0.2 },
      { text: 'The hush.', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.2 },
    ],
    appositive_np: [
      'a page turning somewhere',
      { text: 'the building\'s quiet working against itself', w: nt => nt.gaba < 0.4 ? 1.2 : 0.4 },
      { text: 'someone at a computer', w: (nt, obs) => obs.properties.sound?.busy ? 1.0 : 0.2 },
      { text: 'the specific hush of the library',           w: nt => nt.aden > 0.5 ? 0.9 : 0.3 },
    ],
  },

  friends_ambient: {
    // The acoustic texture of someone else's home: upstairs neighbors, their heater,
    // a different building's pipes, the specific quiet of a space that isn't yours.
    // familiar boolean (deep connection tier) modulates whether the sounds are settling or still new.
    subjects: [
      'their upstairs neighbor',
      { text: 'something in the walls',                w: nt => nt.aden > 0.55 ? 1.0 : 0.4 },
      { text: 'a different building\'s pipes',         w: nt => nt.gaba < 0.4 ? 1.2 : 0.6 },
      { text: 'their heater',                          w: 0.9 },
      { text: 'another floor',                         w: 0.8 },
      { text: 'the specific quiet of someone else\'s home', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'something', w: nt => nt.aden > 0.6 ? 0.8 : 0.2 },
    ],
    predicates: [
      'moves across the floor above',
      { text: 'settles', w: (nt, obs) => obs.properties.sound?.familiar ? 1.2 : 0.5 },
      { text: 'comes on', w: 0.7 },
      { text: 'creaks once, then quiet', w: nt => nt.ne > 0.55 ? 0.9 : 0.4 },
      { text: 'registers from somewhere above', w: nt => nt.aden > 0.5 ? 0.9 : 0.3 },
      { text: 'ticks in the wall', w: nt => nt.gaba < 0.4 ? 1.0 : 0.3 },
      { text: 'creaks with habitual weight', w: (nt, obs) => obs.properties.sound?.familiar ? 1.2 : 0.4 },
      { text: 'goes quiet again', w: nt => nt.gaba > 0.5 ? 0.8 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'not yours', w: nt => nt.ne > 0.55 ? 0.7 : 0.2 },
      { text: 'above somewhere', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
      { text: 'and then not', w: nt => nt.gaba > 0.5 ? 0.6 : 0.1 },
      { text: 'at a familiar distance', w: (nt, obs) => obs.properties.sound?.familiar ? 0.9 : 0 },
    ],
    body_subjects: [
      { text: 'attention', w: nt => nt.ne > 0.55 ? 1.5 : 0.5 },
      { text: 'something in you', w: nt => nt.serotonin > 0.5 ? 1.0 : 0.4 },
      { text: 'your ears', w: nt => nt.gaba < 0.4 ? 1.3 : 0.4 },
      { text: 'the body', w: 0.4 },
    ],
    body_predicates: [
      { text: 'catches it, maps it as not-home', w: nt => nt.ne > 0.6 ? 1.5 : 0.4 },
      { text: 'relaxes slightly into the unfamiliarity', w: nt => nt.serotonin > 0.5 ? 1.2 : 0.2 },
      { text: 'notices it arriving from further away than usual', w: nt => nt.aden > 0.55 ? 1.3 : 0.3 },
      { text: 'tracks it without alarm', w: (nt, obs) => obs.properties.sound?.familiar ? 1.3 : 0.4 },
      { text: 'catalogs it as belonging to this space', w: (nt, obs) => obs.properties.sound?.familiar ? 1.0 : 0.2 },
    ],
    escapes: [
      { text: 'just a different building', w: 1.0 },
      { text: 'just the place doing what it does', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'just their apartment, being an apartment', w: (nt, obs) => obs.properties.sound?.familiar ? 1.2 : 0.4 },
    ],
    fragments: [
      'their upstairs neighbor',
      { text: 'another building\'s pipes', w: nt => nt.gaba < 0.4 ? 1.2 : 0.5 },
      { text: 'their heater', w: 0.8 },
      { text: 'the not-home quiet', w: nt => nt.aden > 0.5 ? 0.9 : 0.4 },
      { text: 'someone above', w: 0.6 },
      { text: 'their place', w: (nt, obs) => obs.properties.sound?.familiar ? 0.8 : 0.3 },
    ],
    flat_descriptions: [
      'Their upstairs neighbor moves across the floor.',
      { text: 'The building does its thing.', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: "Someone above. Not yours to know.", w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
      { text: 'Their heater comes on.', w: 0.7 },
    ],
    appositive_np: [
      'their upstairs neighbor, moving',
      { text: 'a different building\'s pipes', w: nt => nt.gaba < 0.4 ? 1.2 : 0.5 },
      { text: 'the specific quiet of someone else\'s home', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'another floor creaking with habitual weight', w: (nt, obs) => obs.properties.sound?.familiar ? 1.3 : 0.4 },
    ],
  },

  friends_apartment_smell: {
    // Someone else's home smell: their soap, their laundry detergent, cooking residue,
    // the specific olfactory signature of another person's space.
    // familiar boolean modulates whether the smell is still being catalogued or already known.
    subjects: [
      'their place',
      { text: 'the air here', w: 0.8 },
      { text: 'something', w: nt => nt.aden > 0.55 ? 1.0 : 0.3 },
      { text: 'their soap', w: 0.6 },
      { text: "someone else's laundry detergent", w: nt => nt.ne > 0.55 ? 0.9 : 0.4 },
      { text: 'the apartment', w: 0.5 },
    ],
    predicates: [
      'smells like them',
      { text: 'smells specific', w: nt => nt.ne > 0.55 ? 1.2 : 0.5 },
      { text: 'has a smell', w: nt => nt.aden > 0.5 ? 0.9 : 0.4 },
      { text: 'smells like a different life', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.2 },
      { text: 'carries it', w: 0.6 },
      { text: 'smells the way it always does', w: (nt, obs) => obs.properties.smell?.familiar ? 1.3 : 0 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'not yours', w: nt => nt.ne > 0.55 ? 0.7 : 0.2 },
      { text: 'underneath everything', w: nt => nt.ne > 0.5 ? 0.5 : 0.1 },
      { text: 'already', w: (nt, obs) => obs.properties.smell?.familiar ? 0.8 : 0 },
    ],
    body_subjects: [
      { text: 'something', w: 1.0 },
      { text: 'the nose', w: nt => nt.ne > 0.6 ? 1.2 : 0.3 },
      { text: 'the back of the throat', w: nt => nt.ne > 0.55 ? 0.7 : 0.2 },
    ],
    body_predicates: [
      { text: 'catalogues it without meaning to', w: nt => nt.ne > 0.55 ? 1.2 : 0.4 },
      { text: 'knows this smell', w: (nt, obs) => obs.properties.smell?.familiar ? 1.5 : 0.2 },
      { text: 'registers it as not-home', w: (nt, obs) => obs.properties.smell?.familiar ? 0 : 1.2 },
      { text: 'has stopped noticing', w: (nt, obs) => obs.properties.smell?.familiar && nt.aden > 0.5 ? 1.0 : 0.2 },
    ],
    fragments: [
      'their soap',
      { text: "someone else's home", w: 0.8 },
      { text: 'a different detergent', w: nt => nt.ne > 0.55 ? 0.9 : 0.3 },
      { text: 'the specific smell of here', w: nt => nt.ne > 0.5 ? 0.7 : 0.3 },
      { text: 'something familiar', w: (nt, obs) => obs.properties.smell?.familiar ? 1.0 : 0 },
    ],
    appositive_np: [
      "someone else's soap",
      { text: 'the specific smell of their place', w: nt => nt.ne > 0.55 ? 1.0 : 0.4 },
      { text: 'a familiar smell', w: (nt, obs) => obs.properties.smell?.familiar ? 1.3 : 0 },
      { text: 'a different home', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.3 },
    ],
  },

  friends_apartment_social: {
    // The interoceptive awareness of being in someone else's space.
    // Where things go, what's okay to touch, the slight recalibration of how you hold your body.
    // guest: true when connection is not deep. drained: social energy depleted.
    // comfortable: deep connection + not drained.
    subjects: [
      { text: 'something', w: 1.2 },
      { text: 'the body', w: nt => nt.ne > 0.6 ? 1.0 : 0.4 },
      { text: 'an awareness', w: nt => nt.ne > 0.55 ? 0.9 : 0.3 },
      { text: 'the edges of the room', w: nt => nt.gaba < 0.4 ? 0.8 : 0.2 },
    ],
    predicates: [
      { text: "knows where things go and it isn't here", w: (nt, obs) => obs.properties.interoception?.guest ? 1.5 : 0 },
      { text: 'is recalibrating', w: (nt, obs) => obs.properties.interoception?.guest ? 1.2 : 0.2 },
      { text: 'is careful about what to touch', w: (nt, obs) => obs.properties.interoception?.guest ? 1.0 : 0 },
      { text: 'settles into it', w: (nt, obs) => obs.properties.interoception?.comfortable ? 1.5 : 0.1 },
      { text: 'is tired of performing guest', w: (nt, obs) => obs.properties.interoception?.drained ? 1.5 : 0 },
      { text: 'needs to be somewhere with less choreography', w: (nt, obs) => obs.properties.interoception?.drained ? 1.2 : 0 },
      { text: 'has stopped tracking the rules', w: (nt, obs) => obs.properties.interoception?.comfortable ? 1.0 : 0.1 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'in someone else\'s space', w: (nt, obs) => obs.properties.interoception?.guest ? 0.7 : 0 },
      { text: 'already', w: (nt, obs) => obs.properties.interoception?.comfortable ? 0.6 : 0 },
    ],
    body_subjects: [
      { text: 'something', w: 1.2 },
      { text: 'the body', w: 0.8 },
      { text: 'posture', w: nt => nt.ne > 0.55 ? 0.9 : 0.3 },
      { text: 'the hands', w: nt => nt.gaba < 0.4 ? 0.8 : 0.2 },
    ],
    body_predicates: [
      { text: 'holds itself slightly differently here', w: (nt, obs) => obs.properties.interoception?.guest ? 1.5 : 0.2 },
      { text: 'knows which surfaces are okay', w: (nt, obs) => obs.properties.interoception?.comfortable ? 1.3 : 0.2 },
      { text: "doesn't know where to put itself", w: (nt, obs) => obs.properties.interoception?.drained ? 1.5 : 0 },
      { text: 'is mapping the room without meaning to', w: (nt, obs) => obs.properties.interoception?.guest && nt.ne > 0.55 ? 1.2 : 0.2 },
      { text: 'has stopped being careful', w: (nt, obs) => obs.properties.interoception?.comfortable ? 1.0 : 0 },
    ],
    fragments: [
      { text: "someone else's space", w: (nt, obs) => obs.properties.interoception?.guest ? 1.5 : 0.3 },
      { text: 'the choreography of guest', w: (nt, obs) => obs.properties.interoception?.guest ? 1.0 : 0 },
      { text: 'allowed', w: (nt, obs) => obs.properties.interoception?.comfortable ? 1.2 : 0 },
      { text: 'too much room', w: (nt, obs) => obs.properties.interoception?.drained ? 0.9 : 0 },
      { text: 'the edges', w: nt => nt.gaba < 0.4 ? 0.7 : 0.2 },
    ],
    reframe_pairs: [
      { rough: 'guest', precise: 'someone holding the shape of themselves slightly wrong', w: (nt, obs) => obs.properties.interoception?.guest ? 1.5 : 0 },
      { rough: 'comfortable', precise: 'allowed to take up space', w: (nt, obs) => obs.properties.interoception?.comfortable ? 1.2 : 0 },
    ],
    character_predicates: [
      { text: 'had never quite learned the choreography of other people\'s homes', w: (nt, obs) => obs.properties.interoception?.guest ? 1.5 : 0 },
      { text: 'could sit here without performing it', w: (nt, obs) => obs.properties.interoception?.comfortable ? 1.3 : 0.1 },
      { text: 'was too tired to hold the shape of guest', w: (nt, obs) => obs.properties.interoception?.drained ? 1.5 : 0 },
    ],
    appositive_np: [
      { text: 'the body holding itself slightly wrong', w: (nt, obs) => obs.properties.interoception?.guest ? 1.5 : 0.2 },
      { text: 'the awareness of where things go', w: (nt, obs) => obs.properties.interoception?.guest ? 1.0 : 0.2 },
      { text: 'the ease of a place that allows her', w: (nt, obs) => obs.properties.interoception?.comfortable ? 1.3 : 0 },
      { text: 'too much choreography', w: (nt, obs) => obs.properties.interoception?.drained ? 1.2 : 0 },
    ],
  },

  // === APARTMENT: LIVING ROOM ===

  living_room_ambient: {
    // The living room's acoustic texture — closer to the front door, more street bleed,
    // the kitchen on the other side. Not the closed cocoon of the bedroom.
    // daytime: more outside bleed. night: interior sounds amplified.
    subjects: [
      { text: 'the street', w: (nt, obs) => obs.properties.sound?.daytime ? 1.5 : 0.3 },
      { text: 'something outside', w: (nt, obs) => obs.properties.sound?.daytime ? 1.0 : 0.2 },
      { text: 'the door', w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
      { text: 'the kitchen', w: 0.5 },
      { text: 'something', w: nt => nt.aden > 0.55 ? 0.9 : 0.3 },
      { text: 'the hallway', w: nt => nt.ne > 0.6 ? 0.7 : 0.2 },
      { text: 'the room', w: (nt, obs) => obs.properties.sound?.night ? 0.9 : 0.3 },
    ],
    predicates: [
      { text: 'bleeds through', w: (nt, obs) => obs.properties.sound?.daytime ? 1.5 : 0.3 },
      { text: 'is closer here', w: (nt, obs) => obs.properties.sound?.daytime ? 1.0 : 0.2 },
      { text: 'carries in from outside', w: (nt, obs) => obs.properties.sound?.daytime ? 0.8 : 0.1 },
      { text: 'settles', w: (nt, obs) => obs.properties.sound?.night ? 1.0 : 0.3 },
      { text: 'ticks', w: (nt, obs) => obs.properties.sound?.night ? 0.8 : 0.2 },
      { text: 'is audible from here', w: 0.5 },
      { text: 'goes on', w: 0.4 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'closer than in the bedroom', w: (nt, obs) => obs.properties.sound?.daytime ? 0.6 : 0 },
      { text: 'through the door', w: (nt, obs) => obs.properties.sound?.daytime ? 0.5 : 0.1 },
      { text: 'from the other room', w: 0.4 },
      { text: 'in here', w: (nt, obs) => obs.properties.sound?.night ? 0.5 : 0.1 },
    ],
    body_subjects: [
      { text: 'your ears', w: nt => nt.ne > 0.6 ? 1.2 : 0.4 },
      { text: 'attention', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'something', w: 0.6 },
    ],
    body_predicates: [
      { text: 'notices the street is closer from here', w: (nt, obs) => obs.properties.sound?.daytime ? 1.5 : 0.2 },
      { text: 'catches it from the kitchen', w: 0.6 },
      { text: 'tracks the door', w: nt => nt.ne > 0.6 ? 1.0 : 0.2 },
      { text: 'picks up more from out here', w: (nt, obs) => obs.properties.sound?.daytime ? 0.8 : 0.2 },
    ],
    escapes: [
      { text: 'just the apartment', w: 1.0 },
      { text: 'just the street, closer from here', w: (nt, obs) => obs.properties.sound?.daytime ? 1.2 : 0.3 },
      { text: 'the living room being a living room', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.3 },
    ],
    fragments: [
      { text: 'the street, closer', w: (nt, obs) => obs.properties.sound?.daytime ? 1.5 : 0.2 },
      { text: 'the door', w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
      { text: 'the kitchen', w: 0.5 },
      { text: 'something from outside', w: (nt, obs) => obs.properties.sound?.daytime ? 0.7 : 0.1 },
      { text: 'the room settling', w: (nt, obs) => obs.properties.sound?.night ? 0.8 : 0.2 },
    ],
    flat_descriptions: [
      { text: 'The street was closer from here.', w: (nt, obs) => obs.properties.sound?.daytime ? 1.5 : 0.2 },
      { text: 'The room did its thing.', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'The kitchen was on the other side of the wall.', w: 0.5 },
    ],
    appositive_np: [
      { text: 'the street bleeding through', w: (nt, obs) => obs.properties.sound?.daytime ? 1.5 : 0.2 },
      { text: 'the room settling around her', w: (nt, obs) => obs.properties.sound?.night ? 1.0 : 0.3 },
      { text: 'sounds from closer than the bedroom', w: (nt, obs) => obs.properties.sound?.daytime ? 0.8 : 0.1 },
    ],
  },

  living_room_light: {
    // Window light from the living room — a different view than the bedroom window.
    // The living room window faces outward more openly. Streetlight quality at night.
    // Weather and time-of-day drive properties (same dimensions as window_light but different text).
    subjects: [
      { text: 'the window', w: 0.8 },
      { text: 'grey light', w: (nt, obs) => obs.properties.sight?.grey ? 2.0 : 0 },
      { text: 'morning', w: (nt, obs) => obs.properties.sight?.early_light ? 1.5 : 0 },
      { text: 'the light', w: (nt, obs) => !obs.properties.sight?.dark ? 1.0 : 0.1 },
      { text: 'streetlight', w: (nt, obs) => obs.properties.sight?.streetlight ? 1.5 : 0 },
      { text: 'the room', w: 0.4 },
    ],
    predicates: [
      { text: 'is still dark', w: (nt, obs) => obs.properties.sight?.dark ? 3.0 : 0 },
      { text: 'is grey', w: (nt, obs) => obs.properties.sight?.grey ? 2.0 : 0 },
      { text: 'comes in from the street', w: (nt, obs) => obs.properties.sight?.streetlight ? 1.5 : 0 },
      { text: 'has arrived', w: (nt, obs) => obs.properties.sight?.early_light ? 2.0 : 0 },
      { text: 'is going', w: (nt, obs) => obs.properties.sight?.dimming ? 2.0 : 0 },
      { text: 'fills the room', w: (nt, obs) => !obs.properties.sight?.dark && !obs.properties.sight?.grey ? 0.8 : 0 },
      { text: 'sits on everything', w: (nt, obs) => !obs.properties.sight?.dark ? 0.6 : 0 },
      { text: 'is sodium-coloured', w: (nt, obs) => obs.properties.sight?.streetlight ? 1.0 : 0 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'flat', w: (nt, obs) => nt.serotonin < 0.4 && obs.properties.sight?.grey ? 1.5 : 0 },
      { text: 'through the window', w: (nt, obs) => !obs.properties.sight?.dark ? 0.5 : 0 },
      { text: 'from outside', w: (nt, obs) => obs.properties.sight?.streetlight ? 0.7 : 0 },
      { text: 'already', w: (nt, obs) => obs.properties.sight?.early_light && nt.aden > 0.5 ? 1.0 : 0 },
      { text: 'without warmth', w: (nt, obs) => obs.properties.sight?.grey && nt.serotonin < 0.45 ? 0.9 : 0 },
    ],
    escapes: [
      { text: 'it was morning', w: (nt, obs) => obs.properties.sight?.early_light ? 1.5 : 0.3 },
      { text: 'the day had started without announcement', w: (nt, obs) => obs.properties.sight?.early_light ? 0.8 : 0.2 },
      { text: 'it was just the light', w: 1.0 },
      { text: 'it was getting dark', w: (nt, obs) => obs.properties.sight?.dimming ? 1.5 : 0.3 },
    ],
    fragments: [
      { text: 'grey', w: (nt, obs) => obs.properties.sight?.grey ? 2.5 : 0 },
      { text: 'dark', w: (nt, obs) => obs.properties.sight?.dark ? 2.5 : 0 },
      { text: 'morning', w: (nt, obs) => obs.properties.sight?.early_light ? 2.0 : 0 },
      { text: 'light', w: (nt, obs) => !obs.properties.sight?.dark ? 0.8 : 0 },
      { text: 'the window', w: 0.5 },
      { text: 'streetlight', w: (nt, obs) => obs.properties.sight?.streetlight ? 1.5 : 0 },
      { text: 'going dark', w: (nt, obs) => obs.properties.sight?.dimming ? 1.2 : 0 },
    ],
    flat_descriptions: [
      { text: 'The light was the light.', w: (nt, obs) => obs.properties.sight?.grey && nt.serotonin < 0.4 ? 1.5 : 0.1 },
      { text: 'Streetlight on the ceiling.', w: (nt, obs) => obs.properties.sight?.streetlight ? 1.5 : 0 },
      { text: 'Grey, from outside.', w: (nt, obs) => obs.properties.sight?.grey ? 1.2 : 0 },
    ],
    body_subjects: [
      { text: 'the eyes', w: 1.0 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'vision', w: (nt, obs) => obs.properties.sight?.dark ? 0.7 : 0.2 },
    ],
    body_predicates: [
      { text: 'adjusts', w: (nt, obs) => obs.properties.sight?.early_light || obs.properties.sight?.dark ? 1.5 : 0.4 },
      { text: 'registers the grey', w: (nt, obs) => obs.properties.sight?.grey ? 1.5 : 0 },
      { text: 'catches the streetlight', w: (nt, obs) => obs.properties.sight?.streetlight ? 1.3 : 0 },
      { text: 'knows it\'s morning', w: (nt, obs) => obs.properties.sight?.early_light ? 1.0 : 0 },
    ],
    appositive_np: [
      { text: 'grey from outside', w: (nt, obs) => obs.properties.sight?.grey ? 2.0 : 0 },
      { text: 'morning come in', w: (nt, obs) => obs.properties.sight?.early_light ? 2.0 : 0 },
      { text: 'dark still', w: (nt, obs) => obs.properties.sight?.dark ? 2.0 : 0 },
      { text: 'streetlight on the ceiling', w: (nt, obs) => obs.properties.sight?.streetlight ? 1.5 : 0 },
      { text: 'the light doing what it does', w: 0.5 },
    ],
  },

  outdoor_temperature: {
    subjects: [
      { text: 'the air', w: 0.8 },
      { text: 'the cold', w: (nt, obs) => obs.properties.thermal?.cold ? 1.5 : 0 },
      { text: 'the warmth', w: (nt, obs) => obs.properties.thermal?.warm ? 1.5 : 0 },
    ],
    predicates: [
      { text: 'hits immediately', w: (nt, obs) => obs.properties.thermal?.immediate ? 1.5 : 0.2 },
      { text: 'is cold', w: (nt, obs) => obs.properties.thermal?.cold ? 1.0 : 0 },
      { text: 'is warm', w: (nt, obs) => obs.properties.thermal?.warm ? 1.0 : 0 },
      { text: 'has stayed warm', w: (nt, obs) => obs.properties.thermal?.warm ? 0.7 : 0 },
      { text: "doesn't let up", w: (nt, obs) => obs.properties.thermal?.warm && nt.ne > 0.55 ? 0.8 : 0 },
      { text: 'is colder than expected', w: (nt, obs) => obs.properties.thermal?.cold && nt.gaba > 0.5 ? 0.6 : 0 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'already', w: (nt, obs) => obs.properties.thermal?.immediate ? 0.9 : 0 },
      { text: 'this time of year', w: 0.4 },
      { text: 'from the pavement', w: (nt, obs) => obs.properties.thermal?.warm ? 0.7 : 0 },
      { text: 'through everything', w: (nt, obs) => obs.properties.thermal?.very_cold ? 1.0 : 0 },
      { text: 'still', w: (nt, obs) => obs.properties.thermal?.warm ? 0.6 : 0 },
      { text: 'in the face', w: (nt, obs) => obs.properties.thermal?.cold ? 0.5 : 0 },
    ],
    body_subjects: [
      { text: 'the cold', w: (nt, obs) => obs.properties.thermal?.cold ? 1.5 : 0.1 },
      { text: 'cold', w: (nt, obs) => obs.properties.thermal?.cold && nt.aden > 0.6 ? 1.2 : 0.3 },
      { text: 'the warmth', w: (nt, obs) => obs.properties.thermal?.warm ? 1.5 : 0.1 },
      { text: 'heat', w: (nt, obs) => obs.properties.thermal?.warm && nt.ne > 0.5 ? 0.8 : 0.1 },
    ],
    body_predicates: [
      { text: 'hits immediately', w: (nt, obs) => obs.properties.thermal?.immediate ? 2.0 : 0.3 },
      { text: 'sits on the back of the neck', w: 1.0 },
      { text: 'finds the face first', w: 0.8 },
      { text: 'goes through the coat', w: (nt, obs) => obs.properties.thermal?.very_cold ? 1.5 : 0.3 },
      { text: 'sits on the arms', w: (nt, obs) => obs.properties.thermal?.warm ? 1.2 : 0.1 },
      { text: 'comes from the pavement', w: (nt, obs) => obs.properties.thermal?.warm ? 0.7 : 0.1 },
    ],
    fragments: [
      { text: 'cold', w: (nt, obs) => obs.properties.thermal?.cold ? 1.5 : 0 },
      { text: 'warm out', w: (nt, obs) => obs.properties.thermal?.warm ? 1.5 : 0 },
      { text: 'the air', w: 0.5 },
      { text: 'heat', w: (nt, obs) => obs.properties.thermal?.warm ? 0.7 : 0 },
    ],
    reframe_pairs: [
      { rough: 'cold', precise: "sharp, the kind that lands before you're ready", w: (nt, obs) => obs.properties.thermal?.cold      ? 1.5 : 0 },
      { rough: 'cold', precise: 'committed to it',                               w: (nt, obs) => obs.properties.thermal?.very_cold  ? 1.2 : 0 },
    ],
    character_predicates: [
      { text: 'arrived before anything else',  w: (nt, obs) => obs.properties.thermal?.cold ? 1.5 : 0.3 },
      { text: 'found the face first',          w: (nt, obs) => obs.properties.thermal?.cold ? 1.2 : 0.2 },
      { text: 'sat on the back of the neck',   w: (nt, obs) => obs.properties.thermal?.cold ? 1.0 : 0.2 },
      { text: 'lived in the hands',            w: (nt, obs) => obs.properties.thermal?.cold ? 0.8 : 0.1 },
    ],
  },

  wind: {
    subjects: [
      'a wind',
      { text: 'the wind', w: 0.8 },
      { text: 'something cold', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'it', w: nt => nt.aden > 0.6 ? 0.6 : 0.1 },
    ],
    predicates: [
      'cuts',
      { text: 'actually cuts', w: nt => nt.ne > 0.5 ? 1.5 : 0.7 },
      'goes through the coat',
      { text: 'hits in gusts', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: "doesn't let up", w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'at an angle', w: nt => nt.ne > 0.55 ? 0.7 : 0.2 },
      { text: 'from nowhere', w: nt => nt.aden > 0.5 ? 0.6 : 0.2 },
    ],
    body_subjects: [
      'the wind',
      { text: 'something cutting', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'cold', w: nt => nt.aden > 0.5 ? 0.7 : 0.2 },
    ],
    body_predicates: [
      'finds the collar',
      'goes through rather than around',
      { text: 'actually cuts', w: nt => nt.ne > 0.5 ? 1.5 : 0.7 },
      { text: 'gets in through the collar', w: 0.6 },
      { text: 'is sharp today', w: nt => nt.ne > 0.6 ? 0.8 : 0.2 },
    ],
    fragments: [
      'wind',
      { text: 'cold wind', w: 0.8 },
      { text: 'the cold', w: nt => nt.aden > 0.5 ? 0.7 : 0.3 },
      { text: 'gusts', w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
    ],
  },

  rain: {
    subjects: [
      'rain',
      { text: 'it', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'the rain', w: 0.8 },
      { text: 'water', w: nt => nt.ne > 0.55 ? 0.7 : 0.3 },
    ],
    predicates: [
      'is coming down',
      { text: 'has already been going for a while', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      'covers everything',
      { text: 'taps against the window', w: nt => nt.gaba > 0.5 ? 1.0 : 0.3 },
      { text: "hasn't stopped", w: nt => nt.serotonin < 0.4 ? 1.2 : 0.3 },
      { text: 'comes down hard', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 1.5 },
      { text: 'and everything is wet', w: 0.7 },
      { text: 'steady', w: nt => nt.gaba > 0.5 ? 1.0 : 0.2 },
      { text: 'still', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.2 },
      { text: 'hard', w: nt => nt.ne > 0.6 ? 0.8 : 0.2 },
    ],
    body_subjects: [
      { text: 'something', w: 0.7 },
      { text: 'the wet', w: nt => nt.ne > 0.55 ? 1.2 : 0.4 },
      { text: 'cold', w: (nt, obs) => obs.properties.touch?.cold ? 1.0 : 0.2 },
    ],
    body_predicates: [
      { text: 'finds the back of the neck', w: 0.8 },
      { text: 'soaks through', w: nt => nt.ne > 0.55 ? 1.5 : 0.3 },
      { text: 'is everywhere', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'gets in', w: 0.7 },
    ],
    ambiguity_alts: ['the cold', 'the street'],
    escapes: [
      { text: 'it was just rain', w: 1.0 },
      { text: 'it had been raining the whole time', w: nt => nt.aden > 0.5 ? 1.5 : 0.3 },
    ],
    fragments: [
      'rain',
      { text: 'everything wet', w: 0.6 },
      { text: 'wet', w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
      { text: 'still raining', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.2 },
    ],
    flat_descriptions: [
      'The rain was still the rain.',
      { text: "It hadn't stopped.", w: nt => nt.serotonin < 0.4 ? 1.5 : 0.3 },
      { text: 'Rain.',              w: nt => nt.serotonin < 0.35 ? 1.0 : 0.1 },
    ],
    appositive_np: [
      'the sound of it through the window',
      { text: 'steady and still there',      w: nt => nt.gaba > 0.5  ? 1.2 : 0.4 },
      { text: 'rain doing what it does',     w: nt => nt.serotonin < 0.4 ? 1.2 : 0.4 },
      { text: 'not stopping',                w: nt => nt.serotonin < 0.4 ? 1.0 : 0.2 },
    ],
  },

  // === APARTMENT: VISUAL ===

  window_light: {
    subjects: [
      { text: 'the window', w: 0.8 },
      { text: 'grey light', w: (nt, obs) => obs.properties.sight?.grey ? 2.0 : 0 },
      { text: 'morning light', w: (nt, obs) => obs.properties.sight?.early_light ? 2.0 : 0 },
      { text: 'afternoon light', w: (nt, obs) => obs.properties.sight?.dimming ? 0.8 : 0 },
      { text: 'daylight', w: (nt, obs) => !obs.properties.sight?.dark && !obs.properties.sight?.grey ? 0.7 : 0 },
      { text: 'the light', w: (nt, obs) => !obs.properties.sight?.dark ? 1.0 : 0.1 },
    ],
    predicates: [
      { text: 'is still dark', w: (nt, obs) => obs.properties.sight?.dark ? 3.0 : 0 },
      { text: 'is grey', w: (nt, obs) => obs.properties.sight?.grey ? 2.0 : 0 },
      { text: 'is flat', w: (nt, obs) => obs.properties.sight?.grey ? 1.5 : 0 },
      { text: 'has arrived', w: (nt, obs) => obs.properties.sight?.early_light ? 2.0 : 0 },
      { text: 'is going', w: (nt, obs) => obs.properties.sight?.dimming ? 2.0 : 0 },
      { text: 'comes through', w: (nt, obs) => !obs.properties.sight?.dark ? 1.0 : 0 },
      { text: 'sits in the room', w: (nt, obs) => !obs.properties.sight?.dark && nt.gaba > 0.5 ? 0.7 : 0 },
      { text: 'is outside', w: 0.3 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'flat', w: (nt, obs) => nt.serotonin < 0.4 && obs.properties.sight?.grey ? 1.5 : 0 },
      { text: 'without warmth', w: (nt, obs) => obs.properties.sight?.grey && nt.serotonin < 0.45 ? 1.0 : 0 },
      { text: 'through the blinds', w: (nt, obs) => !obs.properties.sight?.dark ? 0.5 : 0 },
      { text: 'already', w: (nt, obs) => obs.properties.sight?.early_light && nt.aden > 0.5 ? 1.0 : 0 },
    ],
    escapes: [
      { text: 'it was morning', w: (nt, obs) => obs.properties.sight?.early_light ? 1.5 : 0.3 },
      { text: 'the day had started', w: (nt, obs) => obs.properties.sight?.early_light ? 1.0 : 0.3 },
      { text: 'it was just the light', w: 1.0 },
      { text: 'it was getting dark', w: (nt, obs) => obs.properties.sight?.dimming ? 1.5 : 0.3 },
    ],
    fragments: [
      { text: 'grey', w: (nt, obs) => obs.properties.sight?.grey ? 2.5 : 0 },
      { text: 'dark', w: (nt, obs) => obs.properties.sight?.dark ? 2.5 : 0 },
      { text: 'morning', w: (nt, obs) => obs.properties.sight?.early_light ? 2.0 : 0 },
      { text: 'light', w: (nt, obs) => !obs.properties.sight?.dark ? 0.8 : 0 },
      { text: 'the window', w: 0.5 },
      { text: 'going dark', w: (nt, obs) => obs.properties.sight?.dimming ? 1.2 : 0 },
    ],
    flat_descriptions: [
      { text: 'The light was the light.',   w: (nt, obs) => obs.properties.sight?.grey && nt.serotonin < 0.4 ? 1.5 : 0.1 },
      { text: 'Same light.',                w: nt => nt.serotonin < 0.35 ? 1.0 : 0.2 },
      { text: 'Grey, the committed kind.',  w: (nt, obs) => obs.properties.sight?.grey && nt.serotonin < 0.45 ? 1.2 : 0 },
    ],
    body_subjects: [
      { text: 'the eyes', w: 1.0 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'the body', w: (nt, obs) => obs.properties.sight?.early_light ? 0.8 : 0.2 },
      { text: 'vision', w: (nt, obs) => obs.properties.sight?.dark ? 0.7 : 0.2 },
    ],
    body_predicates: [
      { text: 'adjusts', w: (nt, obs) => obs.properties.sight?.early_light || obs.properties.sight?.dark ? 1.5 : 0.4 },
      { text: 'registers the grey', w: (nt, obs) => obs.properties.sight?.grey ? 1.5 : 0 },
      { text: 'takes a second', w: (nt, obs) => obs.properties.sight?.dark ? 1.0 : 0.3 },
      { text: 'knows it\'s morning before the brain does', w: (nt, obs) => obs.properties.sight?.early_light ? 1.2 : 0 },
      { text: 'picks it up anyway', w: nt => nt.aden > 0.55 ? 0.8 : 0.2 },
    ],
    appositive_np: [
      { text: 'grey through the blinds',  w: (nt, obs) => obs.properties.sight?.grey         ? 2.0 : 0 },
      { text: 'morning come in',          w: (nt, obs) => obs.properties.sight?.early_light  ? 2.0 : 0 },
      { text: 'dark still',               w: (nt, obs) => obs.properties.sight?.dark         ? 2.0 : 0 },
      { text: 'the light doing what it does', w: 0.5 },
    ],
  },

  // === APARTMENT: BATHROOM ===

  bathroom_echo: {
    subjects: [
      { text: 'everything', w: 0.5 },
      { text: 'the tile', w: nt => nt.ne > 0.6 ? 1.0 : 0.5 },
      { text: 'small sounds', w: nt => nt.ne > 0.5 ? 1.2 : 0.5 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'the silence', w: nt => nt.gaba > 0.5 ? 0.7 : 0.2 },
      { text: 'the room', w: 0.4 },
    ],
    predicates: [
      { text: 'echo in here', w: 1.0 },
      { text: 'carry in here', w: 0.7 },
      { text: 'have that quality', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'are clearer than they should be', w: nt => nt.ne > 0.5 ? 1.2 : 0.3 },
      { text: 'is a specific kind of quiet', w: nt => nt.gaba > 0.5 ? 0.8 : 0.1 },
      { text: 'bounces', w: nt => nt.ne > 0.55 ? 0.8 : 0.2 },
      { text: 'is too loud in here', w: nt => nt.ne > 0.6 ? 1.0 : 0.1 },
      { text: 'reverberates', w: nt => nt.ne > 0.55 ? 0.8 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'off the tile', w: 0.8 },
      { text: 'in here', w: nt => nt.ne > 0.6 ? 0.5 : 0.1 },
      { text: 'wrong', w: nt => nt.ne > 0.65 ? 0.6 : 0.1 },
    ],
    ambiguity_alts: ['the pipes', 'the building'],
    body_subjects: [
      { text: 'your own breathing', w: nt => nt.ne > 0.55 ? 1.5 : 0.5 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'everything', w: 0.5 },
      { text: 'the sound of it', w: nt => nt.ne > 0.6 ? 0.8 : 0.2 },
    ],
    body_predicates: [
      { text: 'carries in here', w: 1.0 },
      { text: 'comes back differently', w: nt => nt.ne > 0.55 ? 1.2 : 0.4 },
      { text: 'is louder than it should be', w: nt => nt.ne > 0.6 ? 1.5 : 0.3 },
      { text: 'fills the space', w: 0.6 },
      { text: 'bounces back off the tile', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'has nowhere to go', w: nt => nt.gaba < 0.4 ? 1.0 : 0.2 },
      { text: 'sounds like more than it is', w: nt => nt.ne > 0.65 ? 0.8 : 0.2 },
    ],
    fragments: [
      { text: 'echo', w: 1.0 },
      { text: 'tile', w: 0.8 },
      { text: 'the small room', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'quiet in here', w: nt => nt.gaba > 0.5 ? 0.7 : 0.2 },
      { text: 'too loud in here', w: nt => nt.ne > 0.65 ? 1.0 : 0.1 },
      { text: 'the bathroom', w: 0.4 },
    ],
    flat_descriptions: [
      { text: 'The tile carried everything.', w: nt => nt.ne > 0.6 ? 1.2 : 0.2 },
      { text: 'Small sounds, too present.',   w: nt => nt.ne > 0.55 ? 1.0 : 0.1 },
    ],
    appositive_np: [
      'the tile echoing back',
      { text: 'sounds coming back wrong',        w: nt => nt.ne > 0.6 ? 1.5 : 0.4 },
      { text: 'the tile giving everything back',  w: nt => nt.ne > 0.55 ? 1.0 : 0.4 },
      { text: 'quiet, but the wrong kind',        w: nt => nt.gaba > 0.5 ? 0.8 : 0.2 },
    ],
  },

  // === INTEROCEPTIVE: STRESS ===

  stress_signal: {
    subjects: [
      { text: 'something', w: 0.8 },
      { text: 'the shoulders', w: nt => nt.ne <= 0.65 && nt.gaba >= 0.35 ? 2.0 : 0.1 },
      { text: 'the jaw', w: nt => nt.ne > 0.65 ? 2.0 : 0.1 },
      { text: 'the chest', w: nt => nt.gaba < 0.35 ? 2.0 : 0.1 },
      { text: 'the neck', w: nt => nt.ne <= 0.65 && nt.gaba >= 0.35 ? 1.2 : 0.1 },
      { text: 'a tension', w: (nt, obs) => obs.properties.interoception?.high ? 0.8 : 0.3 },
    ],
    predicates: [
      { text: 'is carrying something', w: nt => nt.ne <= 0.65 && nt.gaba >= 0.35 ? 1.5 : 0.3 },
      { text: 'is braced', w: nt => nt.ne > 0.65 ? 1.5 : 0.3 },
      { text: 'is tight', w: nt => nt.gaba < 0.35 ? 1.5 : 0.5 },
      { text: "won't let go", w: (nt, obs) => obs.properties.interoception?.high ? 1.5 : 0.3 },
      { text: 'is holding', w: 0.8 },
      { text: 'is specific', w: 0.5 },
      { text: 'has been there', w: (nt, obs) => obs.properties.interoception?.high ? 1.0 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'all the way up', w: nt => nt.ne <= 0.65 && nt.gaba >= 0.35 ? 0.8 : 0 },
      { text: 'without reason', w: nt => nt.serotonin < 0.4 ? 0.6 : 0.1 },
      { text: 'without letting go', w: (nt, obs) => obs.properties.interoception?.high ? 0.7 : 0.1 },
      { text: 'since this morning', w: (nt, obs) => obs.properties.interoception?.high ? 0.5 : 0.1 },
    ],
    body_subjects: [
      { text: 'the shoulders', w: nt => nt.ne <= 0.65 && nt.gaba >= 0.35 ? 2.0 : 0.3 },
      { text: 'the jaw', w: nt => nt.ne > 0.65 ? 2.0 : 0.1 },
      { text: 'the neck', w: nt => nt.ne <= 0.65 || nt.ne > 0.65 ? 1.2 : 0.1 },
      { text: 'the chest', w: nt => nt.gaba < 0.35 ? 1.8 : 0.2 },
      { text: 'something', w: 0.8 },
    ],
    body_predicates: [
      { text: 'has been holding this whole time', w: (nt, obs) => obs.properties.interoception?.high ? 1.5 : 0.5 },
      { text: "won't release", w: 1.0 },
      { text: 'is braced against something', w: nt => nt.ne > 0.65 ? 1.5 : 0.3 },
      { text: 'goes up around the ears', w: nt => nt.ne <= 0.65 && nt.gaba >= 0.35 ? 1.2 : 0.1 },
      { text: 'is tight in a specific way', w: nt => nt.gaba < 0.35 ? 1.0 : 0.2 },
      { text: 'runs up the back of the neck', w: nt => nt.ne <= 0.65 || nt.ne > 0.6 ? 1.3 : 0.2 },
      { text: 'never quite unclips', w: (nt, obs) => obs.properties.interoception?.high ? 1.2 : 0.3 },
      { text: 'has been like this since morning', w: (nt, obs) => obs.properties.interoception?.high ? 0.9 : 0.1 },
    ],
    fragments: [
      { text: 'tight', w: (nt, obs) => obs.properties.interoception?.high ? 1.5 : 0.8 },
      { text: 'holding', w: 0.7 },
      { text: 'braced', w: nt => nt.ne > 0.65 ? 1.2 : 0.4 },
      { text: 'the neck', w: nt => nt.ne <= 0.65 && nt.gaba >= 0.35 ? 0.9 : 0.2 },
      { text: 'the shoulders', w: nt => nt.ne <= 0.65 && nt.gaba >= 0.35 ? 1.0 : 0.2 },
      { text: 'something', w: 0.5 },
    ],
    reframe_pairs: [
      { rough: 'tense',    precise: 'held',                                             w: nt => nt.ne <= 0.65 && nt.gaba >= 0.35 ? 1.5 : 0.4 },
      { rough: 'stressed', precise: "carrying something that wouldn't put itself down",  w: (nt, obs) => obs.properties.interoception?.high ? 1.2 : 0.3 },
      { rough: 'tight',    precise: 'braced against something that had already passed',  w: nt => nt.ne > 0.65 ? 1.0 : 0.2 },
    ],
    character_predicates: [
      { text: 'had been holding since this morning',       w: (nt, obs) => obs.properties.interoception?.high ? 1.5 : 0.3 },
      { text: "wouldn't let go",                           w: 1.2 },
      { text: 'had patience',                              w: (nt, obs) => obs.properties.interoception?.high ? 1.0 : 0.3 },
      { text: 'lived in the shoulders',                    w: nt => nt.ne <= 0.65 && nt.gaba >= 0.35 ? 1.5 : 0.3 },
      { text: 'would outlast the day',                     w: (nt, obs) => obs.properties.interoception?.high ? 0.8 : 0.1 },
    ],
    inversion_conditions: [
      { text: "but only when she stopped to feel it",           w: 1.0 },
      { text: "but only when the other things weren't louder",  w: (nt, obs) => obs.properties.interoception?.high ? 1.2 : 0.4 },
    ],
  },

  // === INTEROCEPTIVE: CAFFEINE ===

  caffeine_signal: {
    subjects: [
      { text: 'something', w: (nt, obs) => obs.properties.interoception?.jitter ? 1.0 : 0.5 },
      { text: 'the body', w: (nt, obs) => obs.properties.interoception?.jitter ? 1.5 : 0.4 },
      { text: 'everything', w: (nt, obs) => obs.properties.interoception?.sharp ? 1.2 : 0.2 },
      { text: 'a sharpness', w: (nt, obs) => obs.properties.interoception?.sharp || obs.properties.interoception?.edge ? 1.2 : 0.2 },
      { text: 'the edges', w: (nt, obs) => obs.properties.interoception?.sharp ? 1.0 : 0.2 },
    ],
    predicates: [
      { text: 'is running a little fast', w: (nt, obs) => obs.properties.interoception?.sharp ? 1.5 : 0.4 },
      { text: "won't quite settle", w: (nt, obs) => obs.properties.interoception?.jitter ? 1.5 : 0.3 },
      { text: 'has an edge to it', w: (nt, obs) => obs.properties.interoception?.edge ? 1.5 : 0.4 },
      { text: 'is a little sharper than usual', w: (nt, obs) => obs.properties.interoception?.sharp ? 1.0 : 0.2 },
      { text: 'is clearer than usual', w: (nt, obs) => obs.properties.interoception?.sharp && !obs.properties.interoception?.jitter ? 1.3 : 0.2 },
      { text: 'comes in', w: (nt, obs) => obs.properties.interoception?.edge ? 0.8 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'today', w: (nt, obs) => obs.properties.interoception?.sharp ? 0.5 : 0.1 },
      { text: 'in a way', w: (nt, obs) => obs.properties.interoception?.edge ? 0.4 : 0.1 },
    ],
    body_subjects: [
      { text: 'something', w: 1.0 },
      { text: 'the hands', w: (nt, obs) => obs.properties.interoception?.jitter ? 1.5 : 0.1 },
      { text: 'the mind', w: (nt, obs) => obs.properties.interoception?.sharp ? 1.3 : 0.2 },
      { text: 'the eyes', w: (nt, obs) => obs.properties.interoception?.sharp || obs.properties.interoception?.edge ? 0.8 : 0.2 },
    ],
    body_predicates: [
      { text: "won't quite stop moving", w: (nt, obs) => obs.properties.interoception?.jitter ? 2.0 : 0.2 },
      { text: 'is running at a slightly different frequency', w: (nt, obs) => obs.properties.interoception?.sharp ? 1.5 : 0.3 },
      { text: 'is running just a little fast', w: 0.8 },
      { text: 'is running clean', w: (nt, obs) => obs.properties.interoception?.sharp && !obs.properties.interoception?.jitter ? 1.4 : 0.2 },
      { text: 'takes note of everything', w: (nt, obs) => obs.properties.interoception?.sharp ? 1.0 : 0.2 },
      { text: 'is sharp today', w: (nt, obs) => obs.properties.interoception?.sharp ? 1.2 : 0.2 },
    ],
    fragments: [
      { text: 'running fast', w: (nt, obs) => obs.properties.interoception?.sharp || obs.properties.interoception?.jitter ? 1.5 : 0.4 },
      { text: 'sharp', w: (nt, obs) => obs.properties.interoception?.sharp ? 1.5 : 0.3 },
      { text: 'alert', w: (nt, obs) => obs.properties.interoception?.sharp && !obs.properties.interoception?.jitter ? 1.2 : 0.2 },
      { text: 'clear', w: (nt, obs) => obs.properties.interoception?.sharp && !obs.properties.interoception?.jitter ? 1.0 : 0.2 },
      { text: 'something', w: 0.5 },
    ],
    reframe_pairs: [
      { rough: 'shaking', precise: 'vibrating, like a tuning fork struck too many times', w: (nt, obs) => obs.properties.interoception?.jitter ? 2.0 : 0.2 },
      { rough: 'wired',   precise: 'just faster than usual, but committed to it',         w: (nt, obs) => obs.properties.interoception?.sharp  ? 1.5 : 0.4 },
      { rough: 'edgy',    precise: 'running a little ahead of itself',                    w: (nt, obs) => obs.properties.interoception?.edge   ? 1.2 : 0.3 },
    ],
    character_predicates: [
      { text: 'had its own momentum',    w: (nt, obs) => obs.properties.interoception?.sharp  ? 1.5 : 0.5 },
      { text: 'was running a little fast', w: (nt, obs) => obs.properties.interoception?.jitter ? 1.5 : 0.4 },
      { text: "wouldn't quite settle",   w: (nt, obs) => obs.properties.interoception?.jitter ? 1.2 : 0.3 },
      { text: 'had a quality to it',     w: (nt, obs) => obs.properties.interoception?.edge   ? 1.0 : 0.3 },
    ],
    inversion_conditions: [
      { text: 'but only when she held still',             w: (nt, obs) => obs.properties.interoception?.jitter ? 2.0 : 0.3 },
      { text: 'but only when there was nothing to focus on', w: (nt, obs) => obs.properties.interoception?.edge ? 1.0 : 0.3 },
    ],
  },

  // === WORK: ACOUSTIC ===

  workplace_hvac: {
    subjects: [
      { text: 'the ventilation', w: nt => nt.aden < 0.5 ? 1.0 : 0.4 },
      { text: 'something overhead', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'the building', w: 0.5 },
      { text: 'the air', w: 0.4 },
      { text: 'the ducts', w: nt => nt.ne > 0.6 ? 0.7 : 0.2 },
    ],
    predicates: [
      'runs',
      { text: 'cycles', w: 0.7 },
      { text: 'breathes', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'keeps going', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
      { text: 'hums', w: 0.6 },
      { text: 'kicks on', w: 0.5 },
      { text: 'pushes air around', w: nt => nt.aden > 0.5 ? 0.7 : 0.2 },
      { text: 'settles into a lower register', w: nt => nt.aden > 0.6 ? 0.6 : 0.15 },
      { text: "doesn't notice you noticing", w: nt => nt.serotonin < 0.4 ? 0.6 : 0.1 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'overhead', w: nt => nt.ne > 0.6 ? 0.7 : 0.2 },
      { text: 'without stopping', w: nt => nt.serotonin < 0.4 ? 0.6 : 0.1 },
      { text: 'like it always does', w: nt => nt.aden > 0.5 ? 0.5 : 0.15 },
      { text: 'regardless', w: nt => nt.serotonin < 0.4 ? 0.5 : 0.1 },
    ],
    ambiguity_alts: ['the building', 'something in the ceiling'],
    escapes: [
      { text: 'the building had always breathed like this', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'it was just the air', w: 1.0 },
      { text: 'buildings did this', w: nt => nt.aden > 0.5 ? 0.6 : 0.3 },
    ],
    body_subjects: [
      { text: 'the back of the skull', w: nt => nt.aden > 0.5 ? 1.2 : 0.3 },
      { text: 'something in you', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'your attention', w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
      { text: 'the body', w: 0.5 },
      { text: 'your shoulders', w: nt => nt.ne > 0.6 ? 0.7 : 0.2 },
    ],
    body_predicates: [
      { text: 'registers it as neutral and lets it go', w: nt => nt.gaba > 0.5 ? 1.5 : 0.4 },
      { text: 'has been tuning this out for hours', w: nt => nt.aden > 0.5 ? 1.5 : 0.4 },
      { text: 'holds it as background', w: nt => nt.aden > 0.5 ? 1.2 : 0.4 },
      { text: 'barely registers it', w: nt => nt.aden > 0.6 ? 1.0 : 0.3 },
      { text: 'knows this hum the way you know a clock', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
      { text: 'surfaces it only when there is nothing else', w: nt => nt.aden > 0.55 ? 0.8 : 0.2 },
    ],
    fragments: [
      { text: 'the ventilation', w: nt => nt.aden < 0.5 ? 1.0 : 0.3 },
      { text: 'something overhead', w: nt => nt.aden > 0.5 ? 1.2 : 0.4 },
      { text: 'the building', w: 0.5 },
      { text: 'background hum', w: nt => nt.aden > 0.4 ? 0.7 : 0.2 },
      { text: 'the ducts', w: nt => nt.ne > 0.6 ? 0.6 : 0.2 },
      { text: 'climate control', w: nt => nt.aden > 0.5 ? 0.5 : 0.1 },
    ],
    appositive_np: [
      'the ventilation still running',
      { text: 'the building breathing itself',       w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'something overhead, not stopping',    w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
      { text: 'the hum of the building',             w: 0.6 },
    ],
  },

  fluorescent_lights: {
    subjects: [
      { text: 'the lights', w: 1.0 },
      { text: 'the fluorescents', w: nt => nt.ne > 0.6 ? 1.2 : 0.4 },
      { text: 'something overhead', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'the ceiling', w: 0.4 },
      { text: 'something about the light', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
    ],
    predicates: [
      'hum',
      { text: 'flicker slightly', w: (nt, obs) => obs.properties.sight?.flicker === true ? 2.0 : 0 },
      { text: 'have a quality', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'are going', w: 0.4 },
      { text: 'wash everything out', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
      { text: 'cast everything evenly', w: nt => nt.aden < 0.4 ? 0.7 : 0.2 },
      { text: 'hum at a specific pitch', w: nt => nt.ne > 0.65 ? 0.8 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 1.5 },
      { text: 'high and thin', w: nt => nt.ne > 0.6 ? 1.5 : 0.2 },
      { text: 'overhead', w: 0.4 },
      { text: 'all day', w: nt => nt.aden > 0.6 ? 0.8 : 0.1 },
      { text: 'everywhere', w: nt => nt.aden > 0.5 ? 0.5 : 0.1 },
    ],
    ambiguity_alts: ['the projector', 'the ventilation'],
    escapes: [
      { text: 'the lights were just lights', w: 1.0 },
      { text: 'it had always been like this', w: nt => nt.aden > 0.5 ? 1.0 : 0.5 },
    ],
    body_subjects: [
      { text: 'the back of the eyes', w: nt => nt.ne > 0.6 || nt.aden > 0.6 ? 1.5 : 0.2 },
      { text: 'something behind the eyes', w: nt => nt.ne > 0.6 ? 1.2 : 0.2 },
      { text: 'the eyes', w: (nt, obs) => obs.properties.sight?.flicker === true ? 1.3 : 0.4 },
      { text: 'a pressure', w: nt => nt.ne > 0.65 || nt.aden > 0.6 ? 0.9 : 0.2 },
      { text: 'the forehead', w: nt => nt.ne > 0.65 ? 0.7 : 0.1 },
    ],
    body_predicates: [
      { text: 'registers it', w: nt => nt.ne > 0.6 ? 1.5 : 0.4 },
      { text: 'tightens', w: (nt, obs) => nt.ne > 0.6 || obs.properties.sight?.flicker === true ? 1.5 : 0.3 },
      { text: 'has been doing this all day', w: nt => nt.aden > 0.6 ? 1.2 : 0.2 },
      { text: 'is going slightly', w: (nt, obs) => obs.properties.sight?.flicker === true || nt.aden > 0.5 ? 1.0 : 0.2 },
      { text: 'feels the hum before hearing it', w: nt => nt.ne > 0.65 ? 1.0 : 0.2 },
      { text: 'knows the frequency by now', w: nt => nt.aden > 0.55 ? 0.8 : 0.2 },
      { text: 'is tired of this', w: nt => nt.ne > 0.6 || nt.aden > 0.6 ? 0.7 : 0.1 },
    ],
    fragments: [
      { text: 'the lights', w: 1.0 },
      { text: 'a hum', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'fluorescent', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
      { text: 'the ceiling', w: 0.4 },
      { text: 'everywhere', w: nt => nt.aden > 0.5 ? 0.6 : 0.2 },
      { text: 'a hum from overhead', w: nt => nt.ne > 0.6 ? 0.7 : 0.2 },
    ],
    appositive_np: [
      { text: 'the lights humming overhead',           w: 1.0 },
      { text: 'a thin hum from the ceiling',            w: nt => nt.ne > 0.6 ? 1.2 : 0.5 },
      { text: 'fluorescents doing what they always do', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
      { text: 'the flicker, barely visible',            w: (nt, obs) => obs.properties.sight?.flicker === true ? 2.0 : 0 },
    ],
  },

  coworker_background: {
    subjects: [
      'voices',
      { text: 'keyboards', w: 0.6 },
      { text: 'the office', w: 0.5 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'a conversation', w: (nt, obs) => obs.properties.sound?.intelligible === true ? 1.5 : 0.3 },
      { text: 'someone', w: (nt, obs) => obs.properties.sound?.intelligible === true ? 1.2 : 0.3 },
      { text: 'the whole room', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
      { text: 'someone across the floor', w: (nt, obs) => obs.properties.sound?.intelligible === true ? 1.0 : 0.2 },
      { text: 'the noise of it', w: nt => nt.ne > 0.65 ? 0.8 : 0.2 },
    ],
    predicates: [
      'in the background',
      { text: 'at a remove', w: nt => nt.aden > 0.5 ? 1.2 : 0.4 },
      { text: 'carrying on', w: nt => nt.serotonin > 0.5 ? 1.0 : 0.3 },
      { text: 'keep going', w: (nt, obs) => obs.properties.sound?.intelligible === true ? 1.0 : 0.2 },
      { text: 'nearby', w: (nt, obs) => obs.properties.sound?.intelligible === true || nt.ne > 0.6 ? 1.2 : 0.3 },
      { text: 'going on across the room', w: (nt, obs) => obs.properties.sound?.intelligible === true ? 1.0 : 0.2 },
      { text: 'not stopping', w: nt => nt.ne > 0.6 || nt.aden > 0.5 ? 1.0 : 0.2 },
      { text: 'fills the floor', w: nt => nt.ne > 0.65 ? 1.0 : 0.2 },
      { text: 'bleeds in', w: nt => nt.gaba < 0.4 ? 1.0 : 0.2 },
      { text: 'land and dissolve', w: nt => nt.aden > 0.55 ? 0.7 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'from across the room', w: (nt, obs) => obs.properties.sound?.intelligible === true ? 0.8 : 0.1 },
      { text: 'not stopping', w: nt => nt.ne > 0.6 ? 0.7 : 0.1 },
      { text: 'without pause', w: nt => nt.ne > 0.6 || nt.aden > 0.5 ? 0.5 : 0.1 },
      { text: 'without landing', w: nt => nt.aden > 0.55 ? 0.5 : 0.1 },
    ],
    ambiguity_alts: [
      { text: 'the hallway', w: 0.8 },
      { text: 'someone on the phone', w: (nt, obs) => obs.properties.sound?.intelligible === true ? 1.2 : 0.4 },
    ],
    body_subjects: [
      { text: 'something', w: 1.0 },
      { text: 'the noise', w: nt => nt.ne > 0.6 ? 1.5 : 0.3 },
      { text: 'voices', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'the ears', w: nt => nt.ne > 0.65 ? 0.9 : 0.2 },
      { text: 'attention', w: nt => nt.gaba < 0.4 ? 0.8 : 0.2 },
    ],
    body_predicates: [
      { text: 'lands without meaning anything', w: nt => nt.aden > 0.55 ? 1.5 : 0.3 },
      { text: 'comes in from everywhere', w: nt => nt.ne > 0.65 ? 1.5 : 0.3 },
      { text: 'is there whether you follow it or not', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: "can't be screened out", w: nt => nt.gaba < 0.4 ? 1.5 : 0.2 },
      { text: "registers but doesn't parse", w: nt => nt.aden > 0.6 ? 1.2 : 0.3 },
      { text: 'keeps lifting', w: nt => nt.gaba < 0.4 || nt.ne > 0.65 ? 1.0 : 0.2 },
      { text: 'is there without being invited', w: nt => nt.ne > 0.6 ? 0.8 : 0.2 },
    ],
    fragments: [
      'voices',
      { text: 'keyboards', w: 0.5 },
      { text: 'the office', w: 0.6 },
      { text: 'someone talking', w: (nt, obs) => obs.properties.sound?.intelligible === true ? 1.5 : 0.2 },
      { text: 'a conversation somewhere', w: (nt, obs) => obs.properties.sound?.intelligible === true ? 1.2 : 0.3 },
      { text: 'laughter', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.3 },
      { text: 'someone talking nearby', w: (nt, obs) => obs.properties.sound?.intelligible === true && nt.ne > 0.6 ? 1.5 : 0.2 },
      { text: 'the floor noise', w: nt => nt.ne > 0.65 ? 0.7 : 0.2 },
      { text: 'phones', w: 0.4 },
    ],
    appositive_np: [
      'the office carrying on',
      { text: 'voices going in the background',     w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'a conversation somewhere nearby',    w: (nt, obs) => obs.properties.sound?.intelligible === true ? 1.2 : 0.3 },
      { text: 'keyboards and voices, not stopping', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
    ],
  },

  shelter_ambient: {
    subjects: [
      'the room',
      { text: 'the floor', w: 0.8 },
      { text: 'someone nearby', w: nt => nt.ne > 0.55 ? 1.5 : 0.4 },
      { text: 'breathing', w: nt => nt.ne > 0.60 ? 1.2 : 0.4 },
      { text: 'coughing', w: nt => nt.ne > 0.60 ? 1.0 : 0.3 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'the dark', w: nt => nt.serotonin < 0.4 ? 0.9 : 0.2 },
    ],
    predicates: [
      'goes on',
      { text: "doesn't stop", w: nt => nt.ne > 0.55 ? 1.5 : 0.4 },
      { text: 'is everywhere', w: nt => nt.ne > 0.65 ? 1.2 : 0.3 },
      { text: 'is close', w: nt => nt.gaba < 0.40 ? 1.2 : 0.3 },
      { text: 'makes itself known', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'lands and recedes', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'from everywhere', w: nt => nt.ne > 0.65 ? 0.8 : 0.1 },
      { text: 'in the dark', w: nt => nt.serotonin < 0.4 ? 0.6 : 0.1 },
      { text: 'all night', w: nt => nt.aden > 0.55 ? 0.5 : 0.1 },
    ],
    body_subjects: [
      { text: 'your ears', w: nt => nt.ne > 0.6 ? 1.5 : 0.4 },
      { text: 'something', w: 1.0 },
      { text: 'your jaw', w: nt => nt.gaba < 0.40 ? 1.2 : 0.2 },
    ],
    body_predicates: [
      { text: 'keeps tracking it', w: nt => nt.ne > 0.60 ? 1.5 : 0.3 },
      { text: 'registers everything', w: nt => nt.ne > 0.65 ? 1.5 : 0.2 },
      { text: "doesn't rest", w: nt => nt.ne > 0.55 || nt.gaba < 0.40 ? 1.2 : 0.3 },
      { text: 'is tighter than it needs to be', w: nt => nt.gaba < 0.40 ? 1.2 : 0.2 },
    ],
    fragments: [
      'coughing',
      { text: 'breathing', w: 0.7 },
      { text: 'a cot creaking', w: 0.8 },
      { text: 'someone shifting', w: nt => nt.ne > 0.55 ? 1.2 : 0.5 },
      { text: 'the room going on', w: 0.5 },
      { text: 'not sleep', w: nt => nt.ne > 0.65 ? 0.8 : 0.2 },
      { text: "other people's sounds", w: nt => nt.ne > 0.60 ? 1.0 : 0.3 },
    ],
    appositive_np: [
      'the room breathing around you',
      { text: 'the sounds of people trying to sleep', w: nt => nt.serotonin < 0.45 ? 1.2 : 0.5 },
      { text: 'everyone and no one', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
    ],
  },

  shelter_smell: {
    subjects: [
      'the building',
      { text: 'the air', w: 0.8 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'the floor', w: 0.5 },
    ],
    predicates: [
      'smells like a shelter',
      { text: 'has that smell', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'carries it', w: 0.6 },
      { text: 'is disinfectant and something else', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'is what institutions smell like', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'pine-sol and bodies', w: 0.6 },
      { text: 'underneath everything', w: nt => nt.ne > 0.55 ? 0.7 : 0.1 },
      { text: 'always', w: nt => nt.serotonin < 0.4 ? 0.5 : 0.1 },
    ],
    body_subjects: [
      { text: 'something', w: 1.0 },
      { text: 'the nose', w: nt => nt.ne > 0.6 ? 1.2 : 0.3 },
      { text: 'the back of the throat', w: nt => nt.ne > 0.55 ? 0.8 : 0.2 },
    ],
    body_predicates: [
      { text: 'registers it before anything else', w: 1.0 },
      { text: 'has stopped noticing', w: nt => nt.aden > 0.5 ? 1.2 : 0.3 },
      { text: 'knows this smell', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.4 },
      { text: 'catalogues it without trying', w: nt => nt.ne > 0.6 ? 1.0 : 0.2 },
    ],
    fragments: [
      'disinfectant',
      { text: 'the building', w: 0.8 },
      { text: 'pine-sol', w: 0.6 },
      { text: 'something institutional', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.3 },
      { text: 'other people', w: nt => nt.ne > 0.55 ? 0.7 : 0.2 },
    ],
  },

  shelter_social: {
    subjects: [
      'someone',
      { text: 'a cough', w: nt => nt.ne > 0.55 ? 1.2 : 0.5 },
      { text: 'movement', w: 0.7 },
      { text: 'a voice', w: nt => nt.ne > 0.6 ? 1.0 : 0.4 },
      { text: 'a conversation', w: (nt, obs) => obs.properties.sound?.night ? 0.3 : 0.8 },
      { text: 'footsteps', w: 0.6 },
      { text: 'someone nearby', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
    ],
    predicates: [
      'moves',
      { text: 'coughs', w: nt => nt.ne > 0.55 ? 1.2 : 0.5 },
      { text: 'shifts on a cot', w: (nt, obs) => obs.properties.sound?.night ? 1.5 : 0.4 },
      { text: 'is talking', w: (nt, obs) => obs.properties.sound?.night ? 0.2 : 0.8 },
      { text: 'turns over', w: (nt, obs) => obs.properties.sound?.night ? 1.2 : 0.3 },
      { text: 'walks past', w: 0.6 },
      { text: 'exists nearby', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'close', w: nt => nt.ne > 0.6 ? 0.8 : 0.2 },
      { text: 'carefully', w: (nt, obs) => obs.properties.sound?.night ? 1.0 : 0.3 },
      { text: 'on the other side of the room', w: 0.5 },
      { text: 'without looking at anyone', w: nt => nt.serotonin < 0.4 ? 0.6 : 0.1 },
    ],
    body_subjects: [
      { text: 'your attention', w: nt => nt.ne > 0.55 ? 1.5 : 0.5 },
      { text: 'something in you', w: nt => nt.ne > 0.6 ? 1.2 : 0.4 },
      { text: 'the body', w: 0.5 },
    ],
    body_predicates: [
      { text: 'tracks every person', w: nt => nt.ne > 0.65 ? 2.0 : 0.3 },
      { text: 'maps the room without meaning to', w: nt => nt.ne > 0.6 ? 1.5 : 0.3 },
      { text: 'knows where everyone is', w: nt => nt.gaba < 0.4 ? 1.5 : 0.3 },
      { text: 'tries to ignore it', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
    ],
    escapes: [
      { text: 'they were just people', w: 1.0 },
      { text: 'everyone was trying to sleep', w: (nt, obs) => obs.properties.sound?.night ? 1.5 : 0.3 },
      { text: 'this was how shared space worked', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.3 },
    ],
    fragments: [
      'a cough',
      { text: 'someone shifting', w: nt => nt.ne > 0.55 ? 1.0 : 0.4 },
      { text: 'footsteps', w: 0.6 },
      { text: 'a voice', w: (nt, obs) => obs.properties.sound?.night ? 0.3 : 0.7 },
      { text: 'breathing', w: (nt, obs) => obs.properties.sound?.night ? 1.0 : 0.3 },
      { text: 'people', w: 0.5 },
    ],
    appositive_np: [
      'someone coughing nearby',
      { text: 'the careful sounds of shared space', w: (nt, obs) => obs.properties.sound?.night ? 1.2 : 0.5 },
      { text: 'other people being quiet', w: (nt, obs) => obs.properties.sound?.night ? 1.5 : 0.4 },
      { text: 'a conversation through the wall', w: (nt, obs) => obs.properties.sound?.night ? 0.2 : 0.8 },
    ],
  },

  // === GYM ===

  gym_ambient: {
    subjects: [
      'the equipment',
      { text: 'a machine', w: 0.7 },
      { text: 'weights', w: 0.8 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'the room', w: 0.5 },
      { text: 'music', w: 0.6 },
    ],
    predicates: [
      'clangs',
      { text: 'drops', w: 0.8 },
      { text: 'plays', w: 0.6 },
      { text: 'keeps going', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'hums', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
      { text: 'rattles', w: nt => nt.ne > 0.6 ? 0.8 : 0.3 },
      { text: 'is in use', w: (nt, obs) => obs.properties.sound?.busy ? 1.2 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 1.5 },
      { text: 'somewhere across the floor', w: 0.6 },
      { text: 'too loud', w: nt => nt.gaba < 0.4 ? 1.0 : 0.1 },
      { text: 'in the mirrors', w: 0.4 },
      { text: 'steadily', w: nt => nt.aden > 0.5 ? 0.6 : 0.1 },
    ],
    ambiguity_alts: ['something metal', 'the building'],
    escapes: [
      { text: 'it was just the gym doing its thing', w: 1.0 },
      { text: 'gyms sounded like this', w: nt => nt.aden > 0.5 ? 0.8 : 0.4 },
    ],
    body_subjects: [
      { text: 'your ears', w: nt => nt.ne > 0.6 ? 1.5 : 0.3 },
      { text: 'the skull', w: nt => nt.ne > 0.65 ? 0.8 : 0.1 },
      { text: 'something', w: 0.5 },
    ],
    body_predicates: [
      { text: 'registers each impact separately', w: nt => nt.ne > 0.6 ? 1.5 : 0.3 },
      { text: 'has been filtering it', w: nt => nt.aden > 0.5 ? 1.2 : 0.4 },
      { text: "tunes it out and then doesn't", w: nt => nt.gaba < 0.4 ? 1.0 : 0.2 },
      { text: 'lets it sit there', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
    ],
    fragments: [
      'weights',
      { text: 'a clang', w: 0.8 },
      { text: 'music', w: 0.6 },
      { text: 'a machine', w: 0.5 },
      { text: 'rubber and metal', w: 0.7 },
      { text: 'the floor', w: 0.4 },
    ],
    appositive_np: [
      'weights dropping somewhere',
      { text: 'music over the speakers', w: 0.7 },
      { text: 'the gym going on around you', w: nt => nt.aden > 0.5 ? 0.8 : 0.4 },
      { text: 'machines and mirrors', w: 0.5 },
    ],
  },

  gym_exertion_body: {
    // Interoceptive: the body's awareness of its own exertion state.
    // Not motivation — just the fact of a body that has been working.
    body_subjects: [
      'the heartbeat',
      { text: 'your breathing', w: 1.0 },
      { text: 'sweat', w: 0.8 },
      { text: 'the muscles', w: nt => nt.ne > 0.55 ? 1.0 : 0.4 },
      { text: 'something in the chest', w: nt => nt.ne > 0.6 ? 1.2 : 0.3 },
      { text: 'the body', w: 0.6 },
    ],
    body_predicates: [
      'is still going',
      { text: 'is louder than before', w: (nt, obs) => obs.properties.interoception?.high ? 1.5 : 0.3 },
      { text: 'keeps coming', w: 0.7 },
      { text: 'has settled into something', w: (nt, obs) => obs.properties.interoception?.elevated && !obs.properties.interoception?.high ? 1.2 : 0.3 },
      { text: 'is warm', w: 0.6 },
      { text: 'runs', w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
      { text: 'is doing its thing', w: nt => nt.aden > 0.5 ? 0.7 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'everywhere', w: (nt, obs) => obs.properties.interoception?.high ? 0.8 : 0.1 },
      { text: 'still', w: 0.5 },
      { text: 'underneath', w: nt => nt.aden > 0.5 ? 0.5 : 0.1 },
    ],
    fragments: [
      'the heartbeat',
      { text: 'breathing', w: 0.8 },
      { text: 'sweat', w: 0.7 },
      { text: 'warmth', w: 0.5 },
      { text: 'the muscles', w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
    ],
    appositive_np: [
      'the heartbeat still loud',
      { text: 'sweat cooling', w: 0.7 },
      { text: 'the body still working', w: 0.6 },
      { text: 'breathing that has not slowed', w: (nt, obs) => obs.properties.interoception?.high ? 1.2 : 0.3 },
    ],
  },

  gym_smell: {
    subjects: [
      'the gym',
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'the floor', w: 0.6 },
      { text: 'the mats', w: 0.7 },
    ],
    predicates: [
      'smells like rubber',
      { text: 'has that gym smell', w: 0.8 },
      { text: 'smells like cleaning products', w: 0.6 },
      { text: 'carries sweat and disinfectant', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'is rubber and something else', w: 0.5 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'under the cleaning products', w: 0.5 },
      { text: 'everywhere', w: nt => nt.ne > 0.55 ? 0.6 : 0.1 },
    ],
    body_subjects: [
      { text: 'something', w: 1.0 },
      { text: 'the nose', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
    ],
    body_predicates: [
      { text: 'registers rubber first', w: 1.0 },
      { text: 'has stopped noticing', w: nt => nt.aden > 0.5 ? 1.2 : 0.3 },
      { text: 'separates sweat from cleaning product', w: nt => nt.ne > 0.6 ? 1.2 : 0.2 },
    ],
    fragments: [
      'rubber',
      { text: 'the mats', w: 0.7 },
      { text: 'disinfectant', w: 0.6 },
      { text: 'sweat', w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
    ],
  },

  // === SMELL ===
  //
  // Smell prose leans heavily on body_subjects + body_predicates (nose registers before
  // mind names) and bare fragments. Short declarative works for outdoor smells that
  // arrive as weather-events. Escapes suit petrichor (it was just rain).

  stale_air: {
    subjects: [
      'the air',
      { text: 'something in the air', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.5 : 0.5 },
      { text: 'the room', w: 0.5 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
    ],
    predicates: [
      "hasn't moved",
      { text: 'has been sitting', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.5 : 0.5 },
      { text: 'is close', w: nt => nt.gaba < 0.4 ? 1.0 : 0.4 },
      { text: "hasn't changed", w: nt => nt.serotonin < 0.4 ? 1.0 : 0.2 },
      { text: 'is stuffy', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.2 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'still', w: nt => nt.aden > 0.5 ? 0.7 : 0.2 },
      { text: 'a little', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) <= 0.60 ? 0.8 : 0 },
    ],
    body_subjects: [
      { text: 'something', w: 1.2 },
      { text: 'the air', w: 0.7 },
      { text: 'the nose', w: 0.5 },
    ],
    body_predicates: [
      { text: 'registers the closed-in quality', w: 1.0 },
      { text: 'recognizes this particular staleness', w: nt => nt.aden > 0.5 ? 1.2 : 0.4 },
      { text: "hasn't moved in here", w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.5 : 0.4 },
      { text: 'is the same as yesterday', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
      { text: 'has a particular density', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.0 : 0.2 },
    ],
    fragments: [
      'stale',
      { text: 'close', w: nt => nt.gaba < 0.4 ? 1.5 : 0.5 },
      { text: 'the same air', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.2 },
      { text: 'stuffy', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.2 : 0.2 },
      { text: 'the room', w: 0.3 },
    ],
  },

  dishes_smell: {
    subjects: [
      'something in the kitchen',
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'the kitchen', w: 0.7 },
      { text: 'the sink', w: 0.5 },
    ],
    predicates: [
      'is there',
      { text: 'has been there', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.5 : 0.4 },
      { text: 'is specific', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.2 : 0.3 },
      { text: "won't leave", w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.0 : 0.2 },
      { text: 'has settled in', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 0.8 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'sour', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 0.8 : 0.15 },
      { text: 'from yesterday', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.50 ? 0.7 : 0.1 },
      { text: 'specific', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 0.5 : 0.1 },
      { text: 'sweet-sour', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.40 && (obs.properties.smell?.intensity ?? 0) <= 0.70 ? 0.6 : 0 },
      { text: 'not going anywhere', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.65 && nt.ne > 0.55 ? 0.7 : 0.1 },
      { text: 'everywhere by now', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.70 ? 0.6 : 0 },
    ],
    body_subjects: [
      { text: 'something', w: 1.5 },
      { text: 'it', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'the kitchen', w: 0.6 },
    ],
    body_predicates: [
      { text: 'reaches before you register it', w: 1.2 },
      { text: 'lands', w: 0.8 },
      { text: 'is specific in the bad way', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.5 : 0.3 },
      { text: "doesn't leave", w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.0 : 0.2 },
      { text: 'registers', w: nt => nt.aden > 0.5 ? 1.0 : 0.5 },
    ],
    fragments: [
      'the dishes',
      { text: 'the sink', w: 0.7 },
      { text: 'something sour', w: (nt, obs) => (obs.properties.smell?.intensity ?? 0) > 0.60 ? 1.0 : 0.1 },
      { text: 'something in the kitchen', w: 0.7 },
    ],
  },

  petrichor: {
    subjects: [
      'the smell of rain',
      { text: 'rain', w: 0.7 },
      { text: 'something in the air', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
      { text: 'petrichor', w: 0.3 },
    ],
    predicates: [
      'is everywhere',
      { text: 'has come through', w: 0.8 },
      { text: 'rises from the pavement', w: 0.7 },
      { text: 'fills everything', w: nt => nt.gaba > 0.5 ? 0.7 : 0.2 },
      { text: 'is in everything now', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 1.5 },
      { text: 'the specific smell of rain on concrete', w: 0.8 },
      { text: 'familiar', w: nt => nt.serotonin > 0.5 ? 0.8 : 0.2 },
    ],
    escapes: [
      { text: 'it was just rain', w: 1.0 },
      { text: 'it had been raining', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'rain had that smell', w: 0.6 },
    ],
    body_subjects: [
      { text: 'the nose', w: 1.0 },
      { text: 'the breath', w: nt => nt.gaba > 0.5 ? 1.0 : 0.4 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'the lungs', w: nt => nt.gaba > 0.55 ? 0.8 : 0.2 },
    ],
    body_predicates: [
      { text: 'finds it before anything else', w: 1.0 },
      { text: 'registers it on the way in', w: 0.9 },
      { text: 'takes it in without a reason', w: nt => nt.gaba > 0.5 ? 1.0 : 0.3 },
      { text: 'opens a little to it', w: nt => nt.serotonin > 0.5 ? 0.8 : 0.2 },
      { text: 'catches it', w: nt => nt.aden > 0.5 ? 0.7 : 0.3 },
    ],
    fragments: [
      'the smell of rain',
      { text: 'petrichor', w: 0.4 },
      { text: 'rain', w: 0.7 },
      { text: 'the wet', w: 0.5 },
    ],
  },

  cold_air_smell: {
    subjects: [
      'the air',
      { text: 'cold air', w: (nt, obs) => obs.properties.smell?.sharp === true ? 1.5 : 0.8 },
      { text: 'something sharp', w: (nt, obs) => obs.properties.smell?.sharp === true ? 1.2 : 0.3 },
      { text: 'something clean', w: (nt, obs) => obs.properties.smell?.sharp !== true ? 1.0 : 0.2 },
    ],
    predicates: [
      'is clean',
      { text: 'is sharp', w: (nt, obs) => obs.properties.smell?.sharp === true ? 2.0 : 0.2 },
      { text: 'is almost nothing', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
      { text: 'is empty in a specific way', w: nt => nt.aden > 0.5 ? 0.7 : 0.2 },
      { text: 'is cold', w: 0.7 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'sharp', w: (nt, obs) => obs.properties.smell?.sharp === true ? 1.0 : 0 },
      { text: 'before anything else', w: (nt, obs) => obs.properties.smell?.sharp === true ? 0.7 : 0.1 },
      { text: 'clean', w: (nt, obs) => obs.properties.smell?.sharp !== true ? 0.8 : 0.1 },
      { text: 'in the back of the throat', w: 0.4 },
      { text: 'cold and empty', w: (nt, obs) => obs.properties.smell?.sharp !== true && nt.aden > 0.5 ? 0.6 : 0 },
    ],
    body_subjects: [
      { text: 'cold', w: 1.5 },
      { text: 'something sharp', w: (nt, obs) => obs.properties.smell?.sharp === true ? 1.5 : 0.3 },
      { text: 'the air', w: 0.5 },
    ],
    body_predicates: [
      { text: 'finds the nose first', w: 1.0 },
      { text: 'registers before anything else', w: (nt, obs) => obs.properties.smell?.sharp === true ? 1.2 : 0.5 },
      { text: 'is clean in the back of the throat', w: 1.0 },
      { text: 'hits sharp', w: (nt, obs) => obs.properties.smell?.sharp === true ? 1.5 : 0.3 },
    ],
    fragments: [
      'cold air',
      { text: 'sharp', w: (nt, obs) => obs.properties.smell?.sharp === true ? 1.5 : 0.3 },
      { text: 'clean', w: (nt, obs) => obs.properties.smell?.sharp !== true ? 1.0 : 0.2 },
      { text: 'the cold', w: 0.5 },
    ],
  },

  seasonal_outside_smell: {
    subjects: [
      { text: 'something', w: 1.5 },
      { text: 'the smell of cut grass', w: (nt, obs) => obs.properties.smell?.season_type === 'cut_grass' ? 1.8 : 0 },
      { text: 'something in the air', w: nt => nt.aden > 0.5 ? 0.6 : 0.3 },
      { text: 'something blooming', w: (nt, obs) => obs.properties.smell?.season_type === 'bloom' ? 1.5 : 0 },
      { text: 'the smell of leaves', w: (nt, obs) => obs.properties.smell?.season_type === 'leaf_decay' ? 1.5 : 0 },
      { text: 'a smell', w: 0.5 },
    ],
    predicates: [
      { text: 'is out', w: (nt, obs) => obs.properties.smell?.season_type === 'cut_grass' ? 1.5 : 0.3 },
      { text: 'carries', w: 0.8 },
      { text: 'is turning', w: (nt, obs) => obs.properties.smell?.season_type === 'leaf_decay' ? 1.5 : 0.2 },
      { text: 'is decaying somewhere', w: (nt, obs) => obs.properties.smell?.season_type === 'leaf_decay' ? 1.2 : 0 },
      { text: 'is coming through', w: (nt, obs) => obs.properties.smell?.season_type === 'bloom' ? 1.0 : 0.3 },
      { text: 'comes through', w: 0.5 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'everywhere', w: (nt, obs) => obs.properties.smell?.season_type === 'cut_grass' ? 0.8 : 0.1 },
      { text: 'nearby', w: (nt, obs) => obs.properties.smell?.season_type === 'bloom' ? 0.7 : 0.1 },
    ],
    body_subjects: [
      { text: 'something', w: 1.0 },
      { text: 'the air', w: 0.6 },
      { text: 'autumn', w: (nt, obs) => obs.properties.smell?.season_type === 'leaf_decay' ? 1.5 : 0 },
      { text: 'spring', w: (nt, obs) => obs.properties.smell?.season_type === 'bloom' ? 1.2 : 0 },
      { text: 'summer', w: (nt, obs) => obs.properties.smell?.season_type === 'cut_grass' ? 1.2 : 0 },
    ],
    body_predicates: [
      { text: 'is in the air now', w: 1.0 },
      { text: 'is here already', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'registers', w: 0.7 },
      { text: 'has arrived', w: (nt, obs) => (obs.properties.smell?.season_type === 'bloom' || obs.properties.smell?.season_type === 'cut_grass') ? 1.0 : 0.2 },
      { text: 'is going', w: (nt, obs) => obs.properties.smell?.season_type === 'leaf_decay' ? 1.2 : 0.2 },
    ],
    escapes: [
      { text: 'it was autumn', w: (nt, obs) => obs.properties.smell?.season_type === 'leaf_decay' ? 2.0 : 0 },
      { text: 'it was summer', w: (nt, obs) => obs.properties.smell?.season_type === 'cut_grass' ? 2.0 : 0 },
      { text: 'spring was here', w: (nt, obs) => obs.properties.smell?.season_type === 'bloom' ? 2.0 : 0 },
      { text: 'it was just the air', w: 0.5 },
    ],
    fragments: [
      { text: 'cut grass', w: (nt, obs) => obs.properties.smell?.season_type === 'cut_grass' ? 2.5 : 0 },
      { text: 'leaves', w: (nt, obs) => obs.properties.smell?.season_type === 'leaf_decay' ? 2.0 : 0 },
      { text: 'something blooming', w: (nt, obs) => obs.properties.smell?.season_type === 'bloom' ? 2.0 : 0 },
      { text: 'autumn', w: (nt, obs) => obs.properties.smell?.season_type === 'leaf_decay' ? 1.5 : 0 },
      { text: 'spring', w: (nt, obs) => obs.properties.smell?.season_type === 'bloom' ? 1.2 : 0 },
      { text: 'summer', w: (nt, obs) => obs.properties.smell?.season_type === 'cut_grass' ? 1.2 : 0 },
      { text: 'the air', w: 0.3 },
    ],
  },

  office_ambient_smell: {
    subjects: [
      'the office',
      { text: 'something about the building', w: nt => nt.aden > 0.5 ? 1.2 : 0.4 },
      { text: 'the carpet', w: 0.6 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
    ],
    predicates: [
      'smells like an office',
      { text: 'has a particular smell', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'is the same as every office', w: nt => nt.serotonin < 0.4 ? 1.2 : 0.3 },
      { text: 'carries that smell', w: 0.6 },
      { text: 'is unmistakably an office', w: 0.5 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'carpet and plastic and something else', w: 0.8 },
      { text: 'the same as every office', w: nt => nt.serotonin < 0.4 ? 0.7 : 0.1 },
      { text: 'neutral, institutional', w: nt => nt.aden > 0.5 ? 0.6 : 0.1 },
      { text: 'climate-controlled, sealed', w: nt => nt.aden > 0.55 ? 0.7 : 0.1 },
      { text: 'every office', w: nt => nt.serotonin < 0.35 ? 0.8 : 0.1 },
      { text: 'just like this', w: nt => nt.aden > 0.6 ? 0.5 : 0.1 },
    ],
    body_subjects: [
      { text: 'something', w: 1.0 },
      { text: 'the building', w: 0.6 },
      { text: 'offices', w: 0.5 },
    ],
    body_predicates: [
      { text: 'registers first', w: 1.0 },
      { text: 'is familiar in the wrong way', w: nt => nt.serotonin < 0.4 ? 1.5 : 0.3 },
      { text: 'has always smelled like this', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'is carpet, plastic, paper', w: 0.8 },
    ],
    fragments: [
      { text: 'the office', w: 1.0 },
      { text: 'carpet', w: 0.8 },
      { text: 'an office', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.4 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
    ],
  },

  // === NIGHT SOURCES ===

  night_city_ambient: {
    // The 3am city. Traffic that actually moves — no stop-and-go.
    // The silence between sounds is the main texture.
    // deep_night property (2am–4am) shifts to sparser predicates.
    subjects: [
      'the city',
      { text: 'a truck', w: nt => nt.ne > 0.55 ? 1.0 : 0.4 },
      { text: "someone's car", w: 0.7 },
      { text: 'traffic', w: 0.6 },
      { text: 'the street', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
    ],
    predicates: [
      'runs empty',
      { text: 'moves without stopping', w: 0.9 },
      { text: 'is different at this hour', w: (nt, obs) => obs.properties.sound?.deep_night ? 1.0 : 0.4 },
      { text: 'sounds like a different place', w: nt => nt.ne > 0.55 ? 0.8 : 0.2 },
      // deep_night predicates — sparser, further away
      { text: 'is almost not there', w: (nt, obs) => obs.properties.sound?.deep_night ? 1.2 : 0 },
      { text: 'sounds like a recording', w: (nt, obs) => obs.properties.sound?.deep_night && nt.aden > 0.5 ? 1.2 : 0 },
      { text: 'is very far away', w: (nt, obs) => obs.properties.sound?.deep_night ? 0.9 : 0 },
    ],
    modifiers: [
      { text: null, w: 1.5 },
      { text: 'without stopping', w: 0.7 },
      { text: 'somewhere out there', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
      { text: 'going wherever it was going', w: nt => nt.serotonin < 0.45 ? 0.7 : 0.2 },
      { text: 'muffled, or maybe just far', w: nt => nt.aden > 0.6 ? 0.9 : 0.1 },
    ],
    body_subjects: [
      { text: 'something in you', w: nt => nt.ne > 0.55 ? 1.5 : 0.5 },
      { text: 'attention', w: nt => nt.ne > 0.6 ? 1.2 : 0.4 },
      { text: 'the body', w: 0.5 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
    ],
    body_predicates: [
      { text: 'tracks each sound separately', w: nt => nt.ne > 0.6 ? 2.0 : 0.4 },
      { text: 'is still listening for threat', w: nt => nt.gaba < 0.4 ? 2.0 : nt.ne > 0.6 ? 1.2 : 0.3 },
      { text: 'counts the cars without meaning to', w: nt => nt.ne > 0.55 ? 1.0 : 0.3 },
      { text: 'registers something going somewhere', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'notices the spaces between', w: nt => nt.aden > 0.6 ? 1.0 : 0.3 },
    ],
    escapes: [
      { text: 'it was just the city doing what it does at 3am', w: 1.0 },
      { text: 'just a truck, somewhere', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'the city keeps going whether you do or not', w: nt => nt.serotonin < 0.4 ? 1.2 : 0.4 },
    ],
    fragments: [
      'the city',
      { text: 'a truck somewhere', w: nt => nt.ne > 0.55 ? 1.0 : 0.4 },
      { text: 'traffic, moving', w: 0.7 },
      { text: 'the street at this hour', w: (nt, obs) => obs.properties.sound?.deep_night ? 1.0 : 0.4 },
      { text: "someone's car", w: 0.5 },
      { text: 'something, far off', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
    ],
    flat_descriptions: [
      { text: 'The city moves differently when it thinks no one is watching.', w: (nt, obs) => obs.properties.sound?.deep_night ? 1.5 : 0.3 },
      'A sound that means something at noon, nothing at 3am.',
      { text: 'Whatever this hour is.', w: nt => nt.aden > 0.6 ? 1.0 : 0.2 },
      { text: 'The city, still going.', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.2 },
    ],
    appositive_np: [
      'the city running empty',
      { text: 'the street at this hour', w: (nt, obs) => obs.properties.sound?.deep_night ? 1.2 : 0.5 },
      { text: 'traffic, moving without stopping', w: 0.8 },
      { text: 'a truck somewhere out there', w: nt => nt.ne > 0.55 ? 1.0 : 0.4 },
    ],
  },

  night_transit: {
    // The bus stop at 3am. Sparse. Different people.
    // Whoever's here is here because they have to be.
    subjects: [
      'the bus stop',
      { text: 'the shelter', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
      { text: 'someone else waiting', w: 0.7 },
      { text: 'the road', w: 0.5 },
      { text: 'the stop', w: nt => nt.aden > 0.6 ? 0.9 : 0.3 },
    ],
    predicates: [
      'is quieter than it should be',
      { text: 'holds different people at this hour', w: 0.8 },
      { text: 'is empty in a particular way', w: (nt, obs) => obs.properties.sound?.sparse ? 1.2 : 0.4 },
      { text: 'is its own kind of waiting', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
      { text: 'sits under a light', w: nt => nt.ne > 0.55 ? 0.7 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 1.5 },
      { text: 'at this hour', w: 0.7 },
      { text: 'in the cold', w: nt => nt.gaba < 0.4 ? 0.8 : 0.2 },
      { text: 'without anyone talking', w: (nt, obs) => obs.properties.sound?.sparse ? 0.9 : 0.2 },
    ],
    body_subjects: [
      { text: 'something in you', w: nt => nt.serotonin < 0.4 ? 1.5 : 0.5 },
      { text: 'attention', w: nt => nt.ne > 0.55 ? 1.2 : 0.4 },
      { text: 'the body', w: 0.5 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
    ],
    body_predicates: [
      { text: 'registers whoever else is here', w: nt => nt.ne > 0.6 ? 1.5 : 0.5 },
      { text: 'knows this is not the hour for choice', w: nt => nt.serotonin < 0.4 ? 1.5 : 0.3 },
      { text: 'tracks the road for headlights', w: nt => nt.ne > 0.55 ? 1.2 : 0.3 },
      { text: 'counts the time differently than usual', w: nt => nt.aden > 0.6 ? 1.0 : 0.3 },
      { text: 'is just here', w: nt => nt.aden > 0.5 ? 0.9 : 0.3 },
    ],
    escapes: [
      { text: 'the bus will come', w: 1.0 },
      { text: 'everyone here has somewhere to be', w: nt => nt.serotonin < 0.4 ? 1.2 : 0.5 },
      { text: 'this is just what the bus stop is at 3am', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
    ],
    fragments: [
      'the stop',
      { text: 'the shelter', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
      { text: 'whoever else is waiting', w: 0.7 },
      { text: 'the road, empty', w: (nt, obs) => obs.properties.sound?.sparse ? 1.0 : 0.3 },
      { text: 'the waiting', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
      { text: 'the hour', w: (nt, obs) => obs.properties.sound?.sparse ? 0.7 : 0.2 },
    ],
    flat_descriptions: [
      { text: 'Whoever\'s up at 3am is up for a reason.', w: (nt, obs) => obs.properties.sound?.sparse ? 1.5 : 0.3 },
      'The bus will come. It always does.',
      { text: 'The stop. The waiting. The hour.', w: nt => nt.aden > 0.5 ? 1.0 : 0.2 },
      { text: 'You and whoever else.', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.2 },
    ],
    appositive_np: [
      'the stop at this hour',
      { text: 'whoever else is waiting', w: nt => nt.ne > 0.55 ? 1.0 : 0.4 },
      { text: 'the road, still empty', w: (nt, obs) => obs.properties.sound?.sparse ? 1.2 : 0.3 },
      { text: 'the particular quiet of 3am transit', w: nt => nt.aden > 0.5 ? 0.9 : 0.3 },
    ],
  },

  night_workplace_light: {
    // Fluorescent at night. Not the same as daytime fluorescent.
    // The contrast with outside dark is total. Visual source — no chromesthesia.
    subjects: [
      'the light',
      { text: 'the ceiling lights', w: nt => nt.ne > 0.6 ? 1.2 : 0.4 },
      { text: 'overhead', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'the fluorescents', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
      { text: 'something about the light', w: nt => nt.aden > 0.5 ? 0.8 : 0.2 },
    ],
    predicates: [
      'has a specific quality at this hour',
      { text: 'buzzes faintly, or seems to', w: nt => nt.ne > 0.6 ? 1.5 : 0.3 },
      { text: 'is the only thing awake besides you', w: 0.9 },
      { text: 'holds the room flat', w: nt => nt.aden > 0.5 ? 1.2 : 0.3 },
      { text: 'is wrong in a way that takes a moment to name', w: nt => nt.serotonin < 0.4 ? 1.2 : 0.2 },
      { text: 'is unchanged from 7am', w: nt => nt.aden > 0.6 ? 1.0 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 1.5 },
      { text: 'overhead', w: 0.5 },
      { text: 'the same as always', w: nt => nt.aden > 0.6 ? 0.8 : 0.1 },
      { text: 'and the window behind it is dark', w: nt => nt.ne > 0.55 ? 0.7 : 0.1 },
    ],
    body_subjects: [
      { text: 'your eyes', w: nt => nt.aden > 0.55 || nt.ne > 0.6 ? 1.5 : 0.5 },
      { text: 'something behind your eyes', w: nt => nt.ne > 0.6 ? 1.2 : 0.3 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
    ],
    body_predicates: [
      { text: 'have adjusted to it', w: nt => nt.aden > 0.5 ? 1.5 : 0.4 },
      { text: 'want something warmer', w: nt => nt.serotonin < 0.4 ? 1.5 : 0.3 },
      { text: 'are tired of the spectrum', w: nt => nt.aden > 0.6 ? 1.5 : 0.2 },
      { text: 'register the flicker that probably isn\'t there', w: nt => nt.ne > 0.65 ? 1.5 : 0.2 },
      { text: 'feel the difference between this and daylight', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
    ],
    escapes: [
      { text: 'the lights existed before you arrived and will exist after', w: 1.0 },
      { text: "it's the same light it was at 7am. That's the wrong part.", w: nt => nt.aden > 0.5 ? 1.2 : 0.4 },
      { text: 'just lights', w: nt => nt.aden > 0.6 ? 1.0 : 0.3 },
    ],
    fragments: [
      { text: 'the light', w: 1.0 },
      { text: 'overhead', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'fluorescent', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
      { text: 'daylight minus the sun', w: (nt) => nt.serotonin < 0.4 ? 1.0 : 0.2 },
      { text: 'the ceiling at 3am', w: nt => nt.aden > 0.6 ? 0.8 : 0.2 },
    ],
    flat_descriptions: [
      { text: 'The kind of light that existed before you arrived and will exist after.', w: nt => nt.aden > 0.5 ? 1.5 : 0.3 },
      { text: "Daylight minus the sun.", w: nt => nt.serotonin < 0.4 ? 1.2 : 0.3 },
      { text: "It's the same light it was at 7am. That's the wrong part.", w: nt => nt.aden > 0.5 ? 1.0 : 0.2 },
    ],
    appositive_np: [
      'the lights at this hour',
      { text: 'fluorescents doing what they always do',          w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'the light, unchanged from any other hour',        w: nt => nt.aden > 0.6 ? 1.0 : 0.3 },
      { text: 'a hum overhead that might be weariness instead', w: nt => nt.aden > 0.5 ? 0.9 : 0.2 },
    ],
  },

  cleaning_smell: {
    subjects: [
      'the soap smell',
      { text: 'the air', w: 0.8 },
      { text: 'the shampoo', w: (nt, obs) => obs.properties.smell?.strong === true ? 1.2 : 0.4 },
      { text: 'something clean', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
      { text: 'that particular clean-smell', w: 0.5 },
    ],
    predicates: [
      "hasn't faded yet",
      { text: 'is still there', w: 1.0 },
      { text: 'lingers', w: 0.9 },
      { text: 'is still in the room', w: (nt, obs) => obs.properties.smell?.strong === true ? 1.2 : 0.4 },
      // Serotonin-high: warmth in noticing it
      { text: 'is a specific kind of clean', w: nt => nt.serotonin > 0.55 ? 1.2 : 0.2 },
      // Adenosine-high: barely registering
      { text: 'is there if you notice it', w: nt => nt.aden > 0.5 ? 1.0 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'faint', w: (nt, obs) => obs.properties.smell?.strong !== true ? 1.0 : 0.1 },
      { text: 'still', w: nt => nt.serotonin > 0.55 ? 0.8 : 0.2 },
    ],
    body_subjects: [
      { text: 'you', w: 1.5 },
      { text: 'your skin', w: (nt, obs) => obs.properties.smell?.strong === true ? 1.4 : 0.6 },
      { text: 'the air around you', w: 0.7 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
    ],
    body_predicates: [
      { text: 'still smell like soap', w: 1.5 },
      { text: 'still smell like the shower', w: (nt, obs) => obs.properties.smell?.strong === true ? 1.4 : 0.3 },
      { text: 'carries the smell of it', w: 0.9 },
      { text: 'still has that clean-smell', w: 0.7 },
      // Serotonin-high: comfort in the smell
      { text: 'is clean in a way that registers', w: nt => nt.serotonin > 0.55 ? 1.2 : 0.2 },
      // Adenosine-high: barely registering it
      { text: 'notices it at the edges', w: nt => nt.aden > 0.5 ? 1.0 : 0.2 },
    ],
    flat_descriptions: [
      "The soap smell hasn't faded yet.",
      { text: 'You still smell like shampoo.', w: (nt, obs) => obs.properties.smell?.strong === true ? 1.4 : 0.5 },
      { text: 'The clean smell is still here.', w: nt => nt.serotonin > 0.55 ? 1.2 : 0.4 },
      // Adenosine-high: noticing it distantly
      { text: 'Soap smell. Faint.', w: nt => nt.aden > 0.5 ? 1.2 : 0.2 },
    ],
    fragments: [
      'soap',
      { text: 'shampoo', w: (nt, obs) => obs.properties.smell?.strong === true ? 1.4 : 0.5 },
      { text: 'the chemical edge of clean', w: 0.7 },
      { text: 'faint soap', w: (nt, obs) => obs.properties.smell?.strong !== true ? 1.0 : 0.2 },
      { text: 'something clean', w: nt => nt.serotonin > 0.55 ? 0.9 : 0.3 },
    ],
  },

  coffee_smell: {
    subjects: [
      'the coffee',
      { text: 'the smell of coffee', w: 1.2 },
      { text: 'the kitchen', w: 0.7 },
      { text: 'something warm', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
    ],
    predicates: [
      'is still in the room',
      { text: 'is still there', w: 1.0 },
      { text: 'fills the kitchen', w: (nt, obs) => obs.properties.smell?.fresh === true ? 1.3 : 0.4 },
      { text: 'hasn\'t cleared yet', w: (nt, obs) => obs.properties.smell?.fresh !== true ? 1.2 : 0.2 },
      // Serotonin-high: comfort in the smell
      { text: 'is a good smell', w: nt => nt.serotonin > 0.55 ? 1.2 : 0.2 },
      // Adenosine-high: barely noticing it
      { text: 'is somewhere at the back of your awareness', w: nt => nt.aden > 0.5 ? 1.0 : 0.2 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'faint', w: (nt, obs) => obs.properties.smell?.fresh !== true ? 1.2 : 0.1 },
      { text: 'warm', w: nt => nt.serotonin > 0.55 ? 0.9 : 0.3 },
    ],
    body_subjects: [
      { text: 'you', w: 1.3 },
      { text: 'something in the air', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'the room', w: 0.7 },
    ],
    body_predicates: [
      { text: 'can still smell the coffee', w: 1.4 },
      { text: 'notice the coffee smell', w: 0.9 },
      { text: 'still smells like coffee was just made', w: (nt, obs) => obs.properties.smell?.fresh === true ? 1.3 : 0.3 },
      // Serotonin-high: warmth in noticing it
      { text: 'holds the smell of it', w: nt => nt.serotonin > 0.55 ? 1.0 : 0.2 },
      // Adenosine-high: barely reaching
      { text: 'catches the tail end of it', w: nt => nt.aden > 0.5 ? 1.0 : 0.2 },
    ],
    flat_descriptions: [
      'The coffee smell is still in here.',
      { text: 'The kitchen still smells like coffee.', w: (nt, obs) => obs.properties.smell?.fresh === true ? 1.4 : 0.5 },
      { text: 'Coffee smell, faint now.', w: (nt, obs) => obs.properties.smell?.fresh !== true ? 1.2 : 0.2 },
      { text: 'Something warm in the air.', w: nt => nt.aden > 0.5 ? 1.2 : 0.3 },
    ],
    fragments: [
      'coffee',
      { text: 'the smell of coffee', w: 0.9 },
      { text: 'something warm', w: nt => nt.serotonin > 0.55 ? 0.8 : 0.3 },
      { text: 'faint coffee', w: (nt, obs) => obs.properties.smell?.fresh !== true ? 1.0 : 0.2 },
    ],
  },

  food_smell: {
    subjects: [
      'the kitchen',
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.2 : 0.5 },
      { text: 'the smell of food', w: 0.9 },
      { text: 'the apartment', w: 0.7 },
    ],
    predicates: [
      'still smells like you cooked',
      { text: 'smells like something was made here', w: 1.1 },
      { text: 'holds it', w: nt => nt.aden > 0.5 ? 1.0 : 0.4 },
      { text: 'still has the warmth of it', w: nt => nt.serotonin > 0.55 ? 1.2 : 0.3 },
      { text: 'carries it', w: (nt, obs) => obs.properties.smell?.strong === true ? 1.0 : 0.3 },
      // Hunger amplifies the presence of the smell
      { text: 'notices it more than it should', w: nt => nt.serotonin < 0.40 ? 0.9 : 0.1 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'faint', w: (nt, obs) => obs.properties.smell?.strong !== true ? 1.2 : 0.1 },
    ],
    body_subjects: [
      { text: 'you', w: 1.3 },
      { text: 'the air', w: 0.9 },
      { text: 'something', w: nt => nt.aden > 0.5 ? 1.2 : 0.4 },
    ],
    body_predicates: [
      { text: 'can still smell whatever you made', w: 1.3 },
      { text: 'catches the food smell', w: 0.9 },
      { text: 'still smells like the kitchen was used', w: (nt, obs) => obs.properties.smell?.strong === true ? 1.2 : 0.4 },
      // Serotonin-high: warmth in the domestic smell
      { text: 'finds it comfortable, the smell of a meal made', w: nt => nt.serotonin > 0.60 ? 1.2 : 0.1 },
      // Adenosine-high: distantly registering
      { text: 'registers it at the edges', w: nt => nt.aden > 0.5 ? 1.0 : 0.2 },
    ],
    flat_descriptions: [
      'The kitchen still smells like cooking.',
      { text: 'Food smell, still in here.', w: (nt, obs) => obs.properties.smell?.strong !== true ? 1.2 : 0.3 },
      { text: 'The apartment smells like something warm was made.', w: nt => nt.serotonin > 0.55 ? 1.2 : 0.4 },
      { text: 'It still smells like the kitchen.', w: nt => nt.aden > 0.5 ? 1.0 : 0.3 },
    ],
    fragments: [
      'food smell',
      { text: 'cooking', w: 0.9 },
      { text: 'whatever you made', w: 0.7 },
      { text: 'something warm', w: nt => nt.serotonin > 0.55 ? 0.9 : 0.3 },
    ],
  },

  neighbor_presence: {
    // The recurring person on the block. Visual channel — a recognized presence.
    // Prose varies by recognition tier (seen / recognized / known) and archetype.
    // seen tier: generic — a familiar stranger, not yet placed.
    // recognized tier: archetype-specific — the type is known, not the person.
    // known tier: named — comfortable familiarity.
    // Architecture: short declarative + body-as-subject + bare fragment.
    // No ambiguity_alts, no escape — this source doesn't create threat.
    subjects: [
      // seen tier subjects
      { text: 'someone from the building across the way', w: (nt, obs) => obs.properties.visual?.tier === 'seen' ? 1.2 : 0 },
      { text: 'someone you\'ve seen before', w: (nt, obs) => obs.properties.visual?.tier === 'seen' ? 1.0 : 0 },
      { text: 'a familiar stranger', w: (nt, obs) => obs.properties.visual?.tier === 'seen' ? 0.8 : 0 },
      // recognized tier subjects — archetype-specific
      { text: 'the neighbor who\'s always out here', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'always_smoking' ? 1.5 : 0 },
      { text: 'the dog-walker', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'dog_walker' ? 1.5 : 0 },
      { text: 'the person who leaves before you', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'early_commuter' ? 1.5 : 0 },
      { text: 'the one coming off night shift', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'night_shift' ? 1.5 : 0 },
      { text: 'the one who sits out front', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'front_stoop' ? 1.5 : 0 },
      { text: 'the one always in headphones', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'music_person' ? 1.5 : 0 },
      { text: 'the quiet one from the building', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'quiet_one' ? 1.5 : 0 },
      // known tier subjects
      { text: 'your neighbor', w: (nt, obs) => obs.properties.visual?.tier === 'known' ? 1.5 : 0 },
    ],
    predicates: [
      // seen tier
      { text: 'out again', w: (nt, obs) => obs.properties.visual?.tier === 'seen' ? 1.0 : 0 },
      { text: 'from somewhere in the building', w: (nt, obs) => obs.properties.visual?.tier === 'seen' ? 0.8 : 0 },
      // recognized tier — archetype-specific
      { text: 'same spot, same cigarette', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'always_smoking' ? 1.5 : 0 },
      { text: 'with the dog — the small one that pulls ahead', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'dog_walker' ? 1.5 : 0 },
      { text: 'already ahead of you', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'early_commuter' ? 1.5 : 0 },
      { text: 'heading in as you head out', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'night_shift' ? 1.5 : 0 },
      { text: 'out on the steps, cup in hand', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'front_stoop' ? 1.5 : 0 },
      { text: 'headphones on, already somewhere else', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'music_person' ? 1.5 : 0 },
      { text: 'there without words, as always', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' && obs.properties.visual?.archetype === 'quiet_one' ? 1.5 : 0 },
      // known tier
      { text: 'heading somewhere', w: (nt, obs) => obs.properties.visual?.tier === 'known' ? 1.2 : 0 },
      { text: 'out front', w: (nt, obs) => obs.properties.visual?.tier === 'known' ? 0.8 : 0 },
      // fallback for any tier if archetype-specific doesn't match
      { text: 'on the block', w: 0.3 },
    ],
    modifiers: [
      { text: null, w: 2.5 },
      { text: 'as usual', w: (nt, obs) => ['recognized', 'known'].includes(obs.properties.visual?.tier ?? '') ? 0.8 : 0 },
      { text: 'out early', w: 0.3 },
    ],
    body_subjects: [
      { text: 'something', w: nt => nt.ne > 0.55 ? 1.0 : 0.4 },
      { text: 'your eyes', w: nt => nt.ne > 0.6 ? 1.2 : 0.5 },
      { text: 'attention', w: nt => nt.ne > 0.55 ? 0.8 : 0.3 },
    ],
    body_predicates: [
      { text: 'catches the face', w: (nt, obs) => obs.properties.visual?.tier === 'seen' ? 1.2 : 0.3 },
      { text: 'clocks them out of habit', w: (nt, obs) => ['recognized', 'known'].includes(obs.properties.visual?.tier ?? '') ? 1.2 : 0.2 },
      { text: 'registers the familiar shape of it', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' ? 1.0 : 0.2 },
      { text: 'lands on them and moves on', w: (nt, obs) => obs.properties.visual?.tier === 'known' ? 1.0 : 0.3 },
      { text: 'places the silhouette before you decide to look', w: (nt, obs) => ['recognized', 'known'].includes(obs.properties.visual?.tier ?? '') ? 0.8 : 0 },
    ],
    fragments: [
      { text: 'the neighbor', w: (nt, obs) => obs.properties.visual?.tier !== 'seen' ? 1.0 : 0 },
      { text: 'a familiar face', w: 0.8 },
      { text: 'someone you know by sight', w: (nt, obs) => obs.properties.visual?.tier === 'recognized' ? 1.0 : 0.3 },
      { text: 'them', w: (nt, obs) => obs.properties.visual?.tier === 'known' ? 1.0 : 0 },
      { text: 'someone from the building', w: (nt, obs) => obs.properties.visual?.tier === 'seen' ? 1.0 : 0.2 },
    ],
    flat_descriptions: [
      { text: 'The neighbor. Out again.', w: (nt, obs) => obs.properties.visual?.tier !== 'seen' ? 1.5 : 0 },
      'A familiar face.',
      { text: 'You\'ve seen them before. Here they are again.', w: (nt, obs) => obs.properties.visual?.tier === 'seen' ? 1.2 : 0 },
    ],
    appositive_np: [
      'the neighbor out front',
      { text: 'the same face again', w: (nt, obs) => obs.properties.visual?.tier === 'seen' ? 1.2 : 0.4 },
      { text: 'the neighbor, as usual', w: (nt, obs) => ['recognized', 'known'].includes(obs.properties.visual?.tier ?? '') ? 1.0 : 0.2 },
      { text: 'them, just there', w: (nt, obs) => obs.properties.visual?.tier === 'known' ? 0.9 : 0.1 },
    ],
  },

  people_aesthetic: {
    // Aesthetic attraction people-watching. Visual channel — strangers as visual phenomena.
    // Not sexual, not romantic. Beauty-focused: light, line, movement, texture.
    // Porpentine tone: fragmentary, body-aware, sensation-first.
    subjects: [
      'someone',
      { text: 'a stranger', w: nt => nt.serotonin > 0.5 ? 0.8 : 0.4 },
      { text: 'a face in the crowd', w: (nt, obs) => obs.properties.sight?.crowded ? 1.2 : 0.2 },
      { text: 'a person passing', w: 0.7 },
      { text: 'the shape of someone', w: nt => nt.aden > 0.55 ? 1.0 : 0.3 },
    ],
    predicates: [
      { text: 'catches the light', w: (nt, obs) => obs.properties.sight?.light_on_skin ? 1.5 : 0.3 },
      { text: 'moves through the space', w: (nt, obs) => obs.properties.sight?.movement ? 1.2 : 0.5 },
      { text: 'has a jaw like architecture', w: nt => nt.dopamine > 0.55 ? 0.8 : 0.2 },
      { text: 'wears something that fits exactly right', w: 0.6 },
      { text: 'exists briefly in your periphery', w: nt => nt.aden > 0.5 ? 0.9 : 0.4 },
      { text: 'turns a corner and the coat follows', w: nt => nt.ne > 0.5 ? 0.7 : 0.3 },
      { text: 'stands there', w: nt => nt.serotonin < 0.4 ? 0.8 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'and you look without meaning to', w: nt => nt.dopamine > 0.5 ? 0.9 : 0.2 },
      { text: 'just for a second', w: 0.6 },
      { text: 'beautifully', w: nt => nt.serotonin > 0.55 ? 0.7 : 0.1 },
      { text: 'and it registers somewhere behind the eyes', w: nt => nt.ne > 0.55 ? 0.6 : 0.15 },
    ],
    body_subjects: [
      { text: 'your eyes', w: nt => nt.dopamine > 0.5 ? 1.2 : 0.5 },
      { text: 'attention', w: 0.7 },
      { text: 'something in the looking', w: nt => nt.serotonin > 0.5 ? 0.9 : 0.3 },
    ],
    body_predicates: [
      'land on someone and stay',
      { text: 'follow the line of a shoulder', w: nt => nt.ne > 0.5 ? 1.0 : 0.4 },
      { text: 'catch on the way a hand moves', w: nt => nt.dopamine > 0.5 ? 0.9 : 0.3 },
      { text: 'find the geometry of a face', w: nt => nt.dopamine > 0.55 ? 0.8 : 0.2 },
      { text: 'snag on someone for no reason', w: nt => nt.aden > 0.5 ? 0.7 : 0.4 },
    ],
    fragments: [
      'a face',
      'the line of a coat',
      { text: 'someone beautiful', w: nt => nt.serotonin > 0.5 ? 1.0 : 0.3 },
      { text: 'a stranger\'s hands', w: nt => nt.ne > 0.5 ? 0.8 : 0.3 },
      { text: 'the shape of someone passing', w: 0.6 },
    ],
    flat_descriptions: [
      { text: 'Someone had a good face.', w: nt => nt.serotonin < 0.45 && nt.dopamine < 0.45 ? 1.2 : 0.3 },
      { text: 'You looked. That was all.', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.2 },
      { text: 'A stranger\'s coat caught the light and then they were gone.', w: (nt, obs) => obs.properties.sight?.light_on_skin ? 1.0 : 0.3 },
    ],
    appositive_np: [
      'a stranger who catches the light',
      { text: 'someone with a face you\'d draw if you could draw', w: nt => nt.dopamine > 0.5 ? 0.9 : 0.2 },
      { text: 'the shape of someone moving well', w: (nt, obs) => obs.properties.sight?.movement ? 1.0 : 0.3 },
      { text: 'a coat, a jaw, a way of standing', w: 0.5 },
    ],
  },

  // --- Item observation sources ---
  // Keyed by item_[type]; realizeOne() strips the _[spot] suffix for dynamic sourceIds.

  item_phone: {
    subjects: ['your phone', 'the phone', { text: 'the screen', w: 0.6 }],
    predicates: [
      'sits there',
      { text: 'is where you left it', w: 0.8 },
      { text: 'catches the light', w: 0.5 },
    ],
    modifiers: [
      { text: null, w: 1.5 },
      { text: 'face down', w: 0.6 },
      { text: 'dark', w: (nt) => nt.serotonin < 0.4 ? 0.8 : 0.3 },
    ],
    fragments: ['your phone', 'the screen', 'the phone on the nightstand'],
  },

  item_cigarettes: {
    subjects: ['the pack', 'the cigarettes', { text: 'the box', w: 0.4 }],
    predicates: [
      'sits there',
      { text: 'is on the nightstand', w: 0.5 },
      { text: 'is almost empty', w: (nt, obs) => (obs.properties.sight?.count ?? 20) < 5 ? 1.5 : 0 },
    ],
    modifiers: [
      { text: null, w: 1.2 },
      { text: 'half-crushed', w: 0.4 },
    ],
    fragments: ['the pack', 'cigarettes', 'the box'],
  },

  item_keys: {
    subjects: ['your keys', 'the keys'],
    predicates: ['sit there', { text: 'are where they always are', w: 0.8 }],
    modifiers: [{ text: null, w: 1.5 }],
    fragments: ['your keys', 'the keys by the door'],
  },

  item_umbrella: {
    subjects: ['the umbrella', { text: 'the cheap umbrella', w: 0.4 }],
    predicates: ['leans against the wall', 'is by the door'],
    modifiers: [{ text: null, w: 1.5 }],
    fragments: ['the umbrella', 'the umbrella by the door'],
  },

  item_pain_reliever: {
    subjects: ['the bottle', 'the ibuprofen'],
    predicates: [
      'sits in the cabinet',
      { text: 'is nearly empty', w: (nt, obs) => (obs.properties.sight?.count ?? 10) < 3 ? 1.5 : 0 },
    ],
    modifiers: [{ text: null, w: 1.5 }],
    fragments: ['the bottle', 'ibuprofen'],
  },

  item_moisturizer: {
    subjects: ['the tube', 'the lotion'],
    predicates: ['sits there', { text: 'is almost empty', w: (nt, obs) => (obs.properties.sight?.count ?? 5) < 2 ? 1.2 : 0 }],
    modifiers: [{ text: null, w: 1.5 }],
    fragments: ['the tube', 'the moisturizer'],
  },

  item_alcohol: {
    subjects: ['the bottle', { text: 'what\'s left', w: (nt, obs) => (obs.properties.sight?.count ?? 3) < 2 ? 1.0 : 0.2 }],
    predicates: ['sits on the counter', { text: 'is there', w: 0.8 }],
    modifiers: [{ text: null, w: 1.5 }],
    fragments: ['the bottle', 'the bottle on the counter'],
  },

  item_cannabis: {
    subjects: ['the stash', { text: 'what\'s left of it', w: (nt, obs) => (obs.properties.sight?.count ?? 3) < 2 ? 1.0 : 0.2 }],
    predicates: ['is there', 'sits on the nightstand'],
    modifiers: [{ text: null, w: 1.5 }],
    fragments: ['the stash', 'the stash on the nightstand'],
  },

  item_makeup: {
    subjects: ['the makeup', 'the bag'],
    predicates: ['sits in the cabinet', { text: 'is running low', w: (nt, obs) => (obs.properties.sight?.count ?? 15) < 5 ? 1.2 : 0 }],
    modifiers: [{ text: null, w: 1.5 }],
    fragments: ['the makeup', 'the bag'],
  },

  item_period_supplies: {
    subjects: ['the box', 'supplies'],
    predicates: ['sits in the cabinet', { text: 'is running low', w: (nt, obs) => (obs.properties.sight?.count ?? 10) < 3 ? 1.5 : 0 }],
    modifiers: [{ text: null, w: 1.5 }],
    fragments: ['the box', 'the supplies'],
  },

  item_binder: {
    subjects: ['your binder', 'the binder'],
    predicates: ['is in the drawer', { text: 'is folded there', w: 0.6 }],
    modifiers: [{ text: null, w: 1.5 }],
    fragments: ['your binder', 'the binder'],
  },

  // --- TRAUMA ECHO ---
  // PTSD sensory trigger intrusion. NOT the content of the trauma — the EXPERIENCE
  // of involuntary memory. Body-first, meaning-later. We never know what happened.
  // Porpentine tone: fragmentary, dissociation through texture not description.
  trauma_echo: {
    subjects: [
      'something',
      { text: 'a thing you can\'t name', w: nt => nt.ne > 0.7 ? 1.2 : 0.4 },
      { text: 'the light', w: nt => nt.ne > 0.65 ? 0.8 : 0.2 },
      { text: 'a sound', w: nt => nt.ne > 0.6 ? 1.0 : 0.3 },
      { text: 'the smell', w: nt => nt.cortisol > 0.6 ? 0.9 : 0.2 },
    ],
    predicates: [
      { text: 'reaches somewhere older than language', w: nt => nt.ne > 0.7 ? 1.5 : 0.5 },
      { text: 'lands wrong', w: 1.0 },
      { text: 'catches', w: nt => nt.cortisol > 0.55 ? 1.2 : 0.6 },
      'finds you',
      { text: 'arrives before you can stop it', w: nt => nt.gaba < 0.4 ? 1.5 : 0.3 },
      { text: 'was already there', w: nt => nt.aden > 0.5 ? 0.8 : 0.3 },
    ],
    modifiers: [
      { text: null, w: 1.5 },
      { text: 'and your body knows before you do', w: nt => nt.ne > 0.65 ? 1.8 : 0.1 },
      { text: 'and you\'re somewhere else for a second', w: nt => nt.cortisol > 0.6 ? 1.2 : 0.2 },
      { text: 'and the room changes shape', w: nt => nt.gaba < 0.35 ? 1.0 : 0.1 },
    ],
    // Body-as-subject: the intrusion as somatic event
    body_subjects: [
      'your hands',
      'your chest',
      { text: 'the back of your neck', w: nt => nt.ne > 0.7 ? 1.5 : 0.5 },
      { text: 'your stomach', w: nt => nt.cortisol > 0.6 ? 1.2 : 0.4 },
    ],
    body_predicates: [
      'know something you don\'t',
      { text: 'went cold', w: nt => nt.ne > 0.65 ? 1.2 : 0.5 },
      { text: 'tightened before you understood why', w: nt => nt.cortisol > 0.55 ? 1.5 : 0.4 },
      'are doing the thing again',
      { text: 'remembered', w: nt => nt.serotonin < 0.4 ? 1.0 : 0.3 },
    ],
    fragments: [
      'something about the light',
      { text: 'the specific frequency of it', w: nt => nt.ne > 0.7 ? 1.5 : 0.3 },
      'a smell that isn\'t here',
      { text: 'the sound, from before', w: nt => nt.ne > 0.65 ? 1.0 : 0.3 },
      'your body, deciding for you',
    ],
    escapes: [
      'and then it passes',
      { text: 'and the room comes back', w: nt => nt.gaba > 0.45 ? 1.2 : 0.3 },
      { text: 'and you don\'t follow it', w: nt => nt.serotonin > 0.45 ? 0.8 : 0.2 },
      'and you\'re still here',
    ],
    // Reframe dash: the precision of the intrusion vs. the vagueness of the cause
    reframe_pairs: [
      { rough: 'a memory', precise: 'a place your body goes', w: nt => nt.ne > 0.65 ? 1.2 : 0.5 },
      { rough: 'remembering', precise: 'something the body kept', w: nt => nt.cortisol > 0.55 ? 1.0 : 0.4 },
      { rough: 'a thought', precise: 'a reflex', w: 1.0 },
    ],
    character_predicates: [
      'had a specific weight',
      { text: 'was older than the room', w: nt => nt.ne > 0.7 ? 1.2 : 0.3 },
      'didn\'t belong to now',
    ],
    appositive_np: [
      'a recognition without a name',
      { text: 'the body\'s own archaeology', w: nt => nt.ne > 0.7 ? 1.0 : 0.3 },
      'something from before',
    ],
  },

  // === MCAS interoceptive ===
  // Mast cell activation signals: warmth in the wrong direction, gut unease, throat
  // awareness, skin prickling. The body flagging something before the mind categorises it.
  // Properties: gut_signal, throat_signal, skin_signal, warmth_signal (booleans) — which
  // axis is most active right now. Salience is low-to-moderate; high habituation.
  mcas_interoceptive: {
    subjects: [
      { text: 'something', w: 1.2 },
      { text: 'the gut', w: (nt, obs) => obs.properties.interoception?.gut_signal ? 1.5 : 0.2 },
      { text: 'the throat', w: (nt, obs) => obs.properties.interoception?.throat_signal ? 1.5 : 0.1 },
      { text: 'the skin', w: (nt, obs) => obs.properties.interoception?.skin_signal ? 1.5 : 0.1 },
      { text: 'a warmth', w: (nt, obs) => obs.properties.interoception?.warmth_signal ? 1.5 : 0.3 },
    ],
    predicates: [
      { text: 'is doing something', w: 1.0 },
      { text: 'registers', w: 0.9 },
      { text: 'is present', w: (nt, obs) => obs.properties.interoception?.gut_signal ? 1.2 : 0.4 },
      { text: 'moves', w: (nt, obs) => obs.properties.interoception?.warmth_signal ? 1.3 : 0.3 },
      { text: 'tightens', w: (nt, obs) => obs.properties.interoception?.throat_signal ? 1.5 : 0.2 },
      { text: 'prickles', w: (nt, obs) => obs.properties.interoception?.skin_signal ? 2.0 : 0.1 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'in the way it sometimes does', w: 0.8 },
      { text: 'without a clear cause', w: nt => nt.cortisol > 0.55 ? 0.7 : 0.3 },
    ],
    body_subjects: [
      { text: 'something', w: 1.2 },
      { text: 'the gut', w: (nt, obs) => obs.properties.interoception?.gut_signal ? 1.5 : 0.3 },
      { text: 'the throat', w: (nt, obs) => obs.properties.interoception?.throat_signal ? 1.5 : 0.2 },
      { text: 'the skin', w: (nt, obs) => obs.properties.interoception?.skin_signal ? 1.5 : 0.2 },
      { text: 'the body', w: 0.5 },
    ],
    body_predicates: [
      { text: 'is tracking something', w: 1.0 },
      { text: 'has a note about this', w: 0.8 },
      { text: 'files it', w: 0.7 },
      { text: 'goes slightly alert', w: nt => nt.cortisol > 0.5 ? 1.2 : 0.4 },
      { text: 'is running its own check', w: 0.6 },
    ],
    fragments: [
      'something',
      { text: 'a warmth that isn\'t comfortable', w: (nt, obs) => obs.properties.interoception?.warmth_signal ? 2.0 : 0.3 },
      { text: 'the gut, noting something', w: (nt, obs) => obs.properties.interoception?.gut_signal ? 1.5 : 0.2 },
      { text: 'the throat, aware', w: (nt, obs) => obs.properties.interoception?.throat_signal ? 1.5 : 0.1 },
      { text: 'the skin, alive to something', w: (nt, obs) => obs.properties.interoception?.skin_signal ? 1.5 : 0.1 },
    ],
    escapes: [
      'and then the body moves on',
      { text: 'and you keep going', w: 1.0 },
      { text: 'and it doesn\'t become anything', w: 0.9 },
      { text: 'and you note it', w: 0.7 },
    ],
    reframe_pairs: [
      { rough: 'wrong', precise: 'something the body is running in the background', w: 1.0 },
      { rough: 'uncomfortable', precise: 'data, not meaning', w: 0.8 },
    ],
    appositive_np: [
      'a gut signal',
      { text: 'something the body noted', w: 0.9 },
      { text: 'a warmth in the wrong direction', w: (nt, obs) => obs.properties.interoception?.warmth_signal ? 1.5 : 0.3 },
      { text: 'something in the throat', w: (nt, obs) => obs.properties.interoception?.throat_signal ? 1.2 : 0.2 },
    ],
  },

  // === POTS interoceptive ===
  // Postural tachycardia signals: the body's pressure-management being legible.
  // Standing is a negotiation. The heart rate answering a question the body asked.
  // Properties: standing (boolean) — whether currently upright; risk_level ('low'|'moderate'|'high').
  pots_interoceptive: {
    subjects: [
      'something',
      { text: 'the blood', w: (nt, obs) => obs.properties.interoception?.risk_level === 'high' ? 1.2 : 0.3 },
      { text: 'the heart', w: (nt, obs) => obs.properties.interoception?.risk_level !== 'low' ? 1.0 : 0.3 },
      { text: 'a pressure', w: 0.7 },
      { text: 'the body', w: 0.5 },
    ],
    predicates: [
      { text: 'recalibrates', w: 1.2 },
      { text: 'catches up', w: (nt, obs) => obs.properties.interoception?.risk_level !== 'low' ? 1.5 : 0.5 },
      { text: 'is doing the math', w: 0.8 },
      { text: 'has questions', w: nt => nt.ne > 0.5 ? 1.0 : 0.3 },
      { text: 'adjusts', w: 0.7 },
    ],
    modifiers: [
      { text: null, w: 2.0 },
      { text: 'briefly', w: (nt, obs) => obs.properties.interoception?.risk_level === 'low' ? 1.0 : 0.2 },
      { text: 'taking a moment', w: (nt, obs) => obs.properties.interoception?.risk_level === 'moderate' ? 0.8 : 0.2 },
    ],
    body_subjects: [
      { text: 'something', w: 1.2 },
      { text: 'the blood', w: (nt, obs) => obs.properties.interoception?.risk_level !== 'low' ? 1.2 : 0.4 },
      { text: 'the heart', w: 0.7 },
      { text: 'the head', w: (nt, obs) => obs.properties.interoception?.risk_level === 'high' ? 1.0 : 0.3 },
    ],
    body_predicates: [
      { text: 'takes a moment to settle', w: 1.5 },
      { text: 'runs its check', w: 0.9 },
      { text: 'is working harder than the moment asks for', w: (nt, obs) => obs.properties.interoception?.risk_level !== 'low' ? 1.5 : 0.2 },
      { text: 'catches up with where you are', w: 1.0 },
      { text: 'does this', w: 0.7 },
    ],
    fragments: [
      'something settling',
      { text: 'the body, recalibrating', w: 0.9 },
      { text: 'a brief adjustment', w: (nt, obs) => obs.properties.interoception?.risk_level === 'low' ? 1.2 : 0.4 },
      { text: 'the pressure, catching up', w: (nt, obs) => obs.properties.interoception?.risk_level !== 'low' ? 1.5 : 0.3 },
    ],
    escapes: [
      'and then it settles',
      { text: 'and the room comes back to level', w: (nt, obs) => obs.properties.interoception?.risk_level !== 'low' ? 1.2 : 0.5 },
      { text: 'and you wait it out', w: 0.8 },
      { text: 'and the body does what it does', w: 0.7 },
    ],
    reframe_pairs: [
      { rough: 'dizzy', precise: 'the pressure not having caught up yet', w: (nt, obs) => obs.properties.interoception?.risk_level !== 'low' ? 1.5 : 0.3 },
      { rough: 'off-balance', precise: 'the body negotiating gravity', w: 0.8 },
    ],
    appositive_np: [
      'a moment of recalibration',
      { text: 'the usual adjustment', w: 0.9 },
      { text: 'the blood pressure doing its thing', w: (nt, obs) => obs.properties.interoception?.risk_level !== 'low' ? 1.2 : 0.4 },
    ],
  },

};

// --- Chromesthesia ---
//
// --- Acoustic modulation (Layer 2 deterministic modifier) ---
//
// Sound-channel observations carry acoustic context from the current location:
//   { reverb: 0–1, absorption: 0–1, floor: string }
// These modulate sentence prose deterministically — no RNG consumed.
//
// High reverb (>0.4): sounds carry, echo, ring. The space adds to them.
// High absorption (>0.6): sounds are dampened, close, contained.
// Floor types colour movement/step sounds: carpet softens, tile sharpens, concrete flattens.
//
// Applied as a suffix clause when conditions are met. Index derived from r1 (already consumed).
// Only fires on sound-channel observations that carry acoustic data.
// Sources like bathroom_echo already have reverb baked into their lexical sets —
// acoustic modulation adds spatial character to sources that don't (fridge, traffic, hvac, etc.).

// Sources that already encode their own acoustic character — skip acoustic suffix for these.
const ACOUSTIC_SELF_DESCRIBING = new Set([
  'bathroom_echo',   // LEX already has "off the tile", "echo in here", "reverberates"
]);

// Reverb suffixes — the space adds to the sound. Selected by Math.floor(r1 * pool.length).
const REVERB_SUFFIXES = [
  ', carrying',
  ', ringing faintly',
  ' — the room holds it',
  ', not quite fading',
  ', the walls giving it back',
];

// Absorption suffixes — the space swallows the sound. Selected by Math.floor(r1 * pool.length).
const ABSORPTION_SUFFIXES = [
  ', muffled',
  ', close and flat',
  ', dampened by the room',
  ', swallowed almost immediately',
  ', not carrying',
];

// Floor-type suffixes — how the surface under you shapes what you hear.
// Fires when neither reverb nor absorption dominate. Deterministic, no RNG.
// Selected by Math.floor(r1 * pool.length).
const FLOOR_SUFFIXES = {
  carpet:   [', softened underfoot', ', muted by the carpet', ', half-absorbed'],
  tile:     [', with an edge off the tile', ', sharp against the floor', ', clean and hard'],
  linoleum: [', flat against the floor', ', with a faint edge', ', thin underfoot'],
  wood:     [', carrying across the floor', ', ringing off the boards', ', the floor holding it'],
  hardwood: [', carrying across the floor', ', ringing off the boards', ', the floor holding it'],
  concrete: [', flat and hard', ', hitting the floor and stopping', ', blunt against concrete'],
  rubber:   [', deadened underfoot', ', flat and close', ', caught by the floor'],
  asphalt:  [', open and flat', ', scattering', ', loose against the ground'],
  grass:    [', open', ', dissolving outward', ', nothing holding it'],
  gravel:   [', scattering', ', open and gritty', ', loose underfoot'],
};

/**
 * Apply acoustic modulation to a realized sentence.
 * Layer 2 deterministic modifier — no RNG consumed.
 * r1 reused as suffix index (same as chromesthesia/APD pattern).
 *
 * @param {string} sentence — the realized sentence
 * @param {{ reverb: number, absorption: number, floor: string } | undefined} acoustic
 * @param {string} sourceId
 * @param {number} r1 — already-consumed r1 value
 * @returns {string}
 */
/**
 * @param {string | null} sentence
 * @param {{ reverb: number, absorption: number, floor: string } | undefined} acoustic
 * @param {string} sourceId
 * @param {number} r1
 * @returns {string | null}
 */
function applyAcousticModulation(sentence, acoustic, sourceId, r1) {
  if (!sentence || !acoustic) return sentence;
  if (ACOUSTIC_SELF_DESCRIBING.has(sourceId)) return sentence;

  // Strip terminal period for suffix attachment, then re-add.
  const hasPeriod = sentence.endsWith('.');
  const base = hasPeriod ? sentence.slice(0, -1) : sentence;

  // High reverb dominates — if a space is reverberant, that's what you hear.
  // Threshold 0.4: bathroom (0.6), gym (0.45), community meal (0.5), food bank (0.45),
  // shelter (0.5) all qualify. Bedroom (0.2), street (0.1), park (0.05) don't.
  if (acoustic.reverb > 0.4) {
    const idx = Math.floor(r1 * REVERB_SUFFIXES.length);
    return `${base}${REVERB_SUFFIXES[idx]}.`;
  }

  // High absorption — the space eats sound. Threshold 0.6: bedroom (0.7), library (0.8),
  // friend's place (0.65) qualify. Kitchen (0.35), street (0.3) don't.
  if (acoustic.absorption > 0.6) {
    const idx = Math.floor(r1 * ABSORPTION_SUFFIXES.length);
    return `${base}${ABSORPTION_SUFFIXES[idx]}.`;
  }

  // Neither reverb nor absorption dominant — floor type shapes the sound.
  const floorPool = acoustic.floor ? FLOOR_SUFFIXES[acoustic.floor] : null;
  if (floorPool) {
    const idx = Math.floor(r1 * floorPool.length);
    return `${base}${floorPool[idx]}.`;
  }

  // No acoustic character at all — return unchanged.
  return sentence;
}

// Sound-colour synesthesia (chromesthesia): automatic visual percepts triggered by sound.
// Prevalence ~4%; Cytowic & Eagleman 2011 (ISBN 978-0-262-01542-3).
//
// Colour palettes per source — informed by typical synesthete associations:
//   Low/sustained sounds → desaturated greys, browns, deep blues
//   High/sharp sounds → yellows, whites, sharp greens
//   Speech-frequency sounds → warm reds, oranges, ambers
//   Hollow/resonant sounds → greens, browns
//   Steady hums → pale blues, greys
//   Rainfall → silvers, moving greys
//
// Fragment selection: `Math.floor(r1 * palette.length)` — reuses the already-consumed
// r1 value (arch selector). No extra RNG calls. RNG invariant preserved.
// Fragment format: Porpentine tone — the colour is just there. "Yellow, briefly." Not "you see yellow."

const CHROMESTHESIA_PALETTES = {
  traffic_through_walls: ['Muted blue.', 'Dull grey, moving.', 'Slate, low.', 'Something blue-grey.'],
  traffic_outdoor:       ['Yellow, briefly.', 'Orange flash.', 'Bright amber.', 'Yellow-white, gone.'],
  street_voices:         ['Warm red.', 'Orange, close.', 'Something amber and moving.', 'Rust-coloured.'],
  pipes:                 ['Brown, hollow.', 'Dark green.', 'Something brown shifts.', 'Dull green-grey.'],
  electronic_whine:      ['Sharp yellow.', 'White, thin.', 'Pale yellow at the edge.', 'Almost white.'],
  workplace_hvac:        ['Dusty grey.', 'Grey, constant.', 'Flat grey-brown.', 'Colourless, almost.'],
  fridge:                ['Pale blue.', 'Blue-white.', 'Something pale and cold.', 'Faint blue.'],
  rain:                  ['Silver.', 'Grey, moving.', 'Something silver shifts.', 'Cold grey-blue.'],
  coworker_background:   ['Warm amber.', 'Orange-brown.', 'Something amber and diffuse.', 'Rust.'],
  fluorescent_lights:    ['Yellow-green, flickering.', 'Pale green.', 'Harsh yellow.', 'Green-white.'],
  bathroom_echo:         ['Light blue.', 'White, reflected.', 'Pale blue, brief.', 'Cold white.'],
  park_ambient:          ['Pale green.', 'Yellow-green, shifting.', 'Something warm and green.', 'Soft yellow.'],
  library_ambient:       ['Pale blue.', 'Cool grey-blue.', 'Something thin and cool.', 'Blue-white, still.'],
  friends_ambient:       ['Pale amber.', 'Warm amber, settling.', 'Something amber and close.', 'Soft amber.'],
  night_city_ambient:    ['Dark indigo.', 'A specific dark blue.', 'Near-black with indigo.', 'Somewhere between blue and nothing.'],
  night_transit:         ['Fluorescent pale.', 'Yellow-white, tired.', 'A flat sodium glow.', 'Pale yellow.'],
  shelter_ambient:       ['Grey-brown.', 'Dull brown, close.', 'Something grey and warm.', 'Tan, muffled.'],
  shelter_social:        ['Warm brown.', 'Amber, shifting.', 'Something warm and close.', 'Dull amber.'],
  gym_ambient:           ['Metallic grey.', 'Grey, sharp.', 'Something silver and hard.', 'Flat silver.'],
  living_room_ambient:   ['Warm grey.', 'Brown, close.', 'Something grey-amber.', 'Dull brown-grey.'],
};

/**
 * Append a chromesthesia colour fragment to a sentence if conditions are met.
 * Layer-2 deterministic modifier — no RNG consumed; r1 reused as index.
 * @param {string} sentence
 * @param {string} sourceId
 * @param {string[]} channels
 * @param {boolean} synesthesia
 * @param {number} r1 — already-consumed r1 value from this observation's 4-call slot
 * @returns {string}
 */
/**
 * @param {string | null} sentence
 * @param {string} sourceId
 * @param {string[]} channels
 * @param {boolean} synesthesia
 * @param {number} r1
 * @returns {string | null}
 */
function applyChromesthesia(sentence, sourceId, channels, synesthesia, r1) {
  if (!synesthesia) return sentence;
  if (!channels || !channels.includes('sound')) return sentence;
  const palette = CHROMESTHESIA_PALETTES[sourceId];
  if (!palette) return sentence;
  const fragment = palette[Math.floor(r1 * palette.length)];
  if (!fragment) return sentence;
  return `${sentence} ${fragment}`;
}

// --- APD (Auditory Processing Disorder) ---
//
// Speech sources where parse-fail applies: coworker_background, street_voices.
// Detection is intact — salience is unaffected. Comprehension fails.
// Replacement is unconditional for APD characters: NE alertness cannot compensate
// for a structural processing deficit. (In the real phenomenon NE provides partial
// benefit; this is approximated here — Bamiou 2001, PMID 11581479.)
//
// Fragment index derived from already-consumed r1. No extra RNG calls.
// Fragments convey the rhythm of speech without semantic content.

const APD_SPEECH_SOURCES = new Set(['coworker_background', 'street_voices']);

const APD_PARSE_FAIL_FRAGMENTS = [
  'Voices without words.',
  'The shape of talking.',
  'Sound that has the rhythm of language.',
  'Speech that doesn\'t land.',
  'Someone talking. You catch the tone.',
  'You can hear them. The words don\'t come through.',
  'The noise of conversation.',
  'Talking. You get none of it.',
];

/**
 * Replace a speech-source sentence with an APD parse-fail fragment.
 * Layer-2 deterministic modifier — no RNG consumed; r1 reused as index.
 * @param {string} sourceId
 * @param {boolean} apd
 * @param {number} r1 — already-consumed r1 value from this observation's 4-call slot
 * @returns {string | null} replacement sentence, or null if APD doesn't apply
 */
/**
 * @param {string} sourceId
 * @param {boolean} apd
 * @param {number} r1
 * @returns {string | null}
 */
function applyAPD(sourceId, apd, r1) {
  if (!apd) return null;
  if (!APD_SPEECH_SOURCES.has(sourceId)) return null;
  const idx = Math.floor(r1 * APD_PARSE_FAIL_FRAGMENTS.length);
  return APD_PARSE_FAIL_FRAGMENTS[idx] ?? APD_PARSE_FAIL_FRAGMENTS[0];
}

// --- Architecture builders ---
//
// Each builder consumes the pre-rolled values r2, r3, r4 (r1 is for
// architecture selection, consumed by the caller). If an architecture
// doesn't need all three, it uses them in order and discards the rest
// — this keeps total RNG consumption fixed at 4 per observation.

/**
 * "The fridge hums." / "The fridge hums, too loud."
 * @param {Observation} obs
 * @param {NTSnapshot} nt
 * @param {number} r2
 * @param {number} r3
 * @param {number} r4
 * @returns {string | null}
 */
function buildShortDeclarative(obs, nt, r2, r3, r4) {
  const lex = LEX[obs.sourceId];
  if (!lex?.subjects || !lex?.predicates) return null;
  const subject   = pickText(lex.subjects,   nt, obs, r2);
  const predicate = pickText(lex.predicates, nt, obs, r3);
  if (!subject || !predicate) return null;
  const modifier = lex.modifiers ? pickText(lex.modifiers, nt, obs, r4) : null;
  if (modifier) return `${cap(subject)} ${predicate}, ${modifier}.`;
  return `${cap(subject)} ${predicate}.`;
}

/**
 * "Heavy." / "The fridge." — uses r2, discards r3/r4
 * @param {Observation} obs
 * @param {NTSnapshot} nt
 * @param {number} r2
 * @param {number} _r3
 * @param {number} _r4
 * @returns {string | null}
 */
function buildBareFragment(obs, nt, r2, _r3, _r4) {
  const lex = LEX[obs.sourceId];
  if (!lex) return null;
  const pool = lex.fragments ?? lex.subjects;
  const text = pickText(pool, nt, obs, r2);
  return text ? `${cap(text)}.` : null;
}

/**
 * "Cold sits on the back of the neck." — uses r2, r3, discards r4
 * @param {Observation} obs
 * @param {NTSnapshot} nt
 * @param {number} r2
 * @param {number} r3
 * @param {number} _r4
 * @returns {string | null}
 */
function buildBodyAsSubject(obs, nt, r2, r3, _r4) {
  const lex = LEX[obs.sourceId];
  if (!lex?.body_subjects || !lex?.body_predicates) return null;
  const subject   = pickText(lex.body_subjects,   nt, obs, r2);
  const predicate = pickText(lex.body_predicates, nt, obs, r3);
  if (!subject || !predicate) return null;
  return `${cap(subject)} ${predicate}.`;
}

/**
 * "Something — the fridge, maybe, or the heat — hums." — uses r2, r3, discards r4
 * @param {Observation} obs
 * @param {NTSnapshot} nt
 * @param {number} r2
 * @param {number} r3
 * @param {number} _r4
 * @returns {string | null}
 */
function buildSourceAmbiguity(obs, nt, r2, r3, _r4) {
  const lex = LEX[obs.sourceId];
  if (!lex?.ambiguity_alts || !lex?.predicates) return null;
  const altIdx    = Math.floor(r2 * lex.ambiguity_alts.length);
  const alt       = lex.ambiguity_alts[altIdx];
  const primary   = typeof lex.subjects[0] === 'string'
    ? lex.subjects[0]
    : lex.subjects[0].text;
  const predicate = pickText(lex.predicates, nt, obs, r3);
  if (!predicate) return null;
  return `Something — ${primary}, maybe, or ${alt} — ${predicate}.`;
}

/**
 * "The fridge hums, and the sound was just a sound." — uses r2, r3, r4
 * @param {Observation} obs
 * @param {NTSnapshot} nt
 * @param {number} r2
 * @param {number} r3
 * @param {number} r4
 * @returns {string | null}
 */
function buildInterpretiveEscape(obs, nt, r2, r3, r4) {
  const lex = LEX[obs.sourceId];
  if (!lex?.escapes) return buildShortDeclarative(obs, nt, r2, r3, r4);
  const subject   = pickText(lex.subjects,   nt, obs, r2);
  const predicate = pickText(lex.predicates, nt, obs, r3);
  const escape    = pickText(lex.escapes,    nt, obs, r4);
  if (!subject || !predicate || !escape) return null;
  return `${cap(subject)} ${predicate}, and ${escape}.`;
}

/**
 * "Not heavy — dissolved." — uses r2, discards r3/r4
 * @param {Observation} obs
 * @param {NTSnapshot} nt
 * @param {number} r2
 * @param {number} _r3
 * @param {number} _r4
 * @returns {string | null}
 */
function buildReframeDash(obs, nt, r2, _r3, _r4) {
  const lex = LEX[obs.sourceId];
  if (!lex?.reframe_pairs) return null;
  const items = lex.reframe_pairs.map(p => ({
    weight: typeof p.w === 'function' ? Math.max(0, p.w(nt, obs)) : (p.w ?? 1),
    value: p,
  }));
  const pair = wpick(items, r2);
  if (!pair) return null;
  return `Not ${pair.rough} — ${pair.precise}.`;
}

/**
 * "The tiredness lived in the limbs." — uses r2, r3, discards r4
 * @param {Observation} obs
 * @param {NTSnapshot} nt
 * @param {number} r2
 * @param {number} r3
 * @param {number} _r4
 * @returns {string | null}
 */
function buildSensationCharacter(obs, nt, r2, r3, _r4) {
  const lex = LEX[obs.sourceId];
  if (!lex?.character_predicates) return null;
  const subject   = pickText(lex.character_subjects ?? lex.subjects, nt, obs, r2);
  const predicate = pickText(lex.character_predicates, nt, obs, r3);
  if (!subject || !predicate) return null;
  return `${cap(subject)} ${predicate}.`;
}

/**
 * "The rain was still the rain." — uses r2, discards r3/r4
 * @param {Observation} obs
 * @param {NTSnapshot} nt
 * @param {number} r2
 * @param {number} _r3
 * @param {number} _r4
 * @returns {string | null}
 */
function buildFlatTautology(obs, nt, r2, _r3, _r4) {
  const lex = LEX[obs.sourceId];
  if (!lex?.flat_descriptions) return null;
  return pickText(lex.flat_descriptions, nt, obs, r2);
}

/**
 * "Something was tight, but only when she stopped noticing." — uses r2, r3, r4
 * @param {Observation} obs
 * @param {NTSnapshot} nt
 * @param {number} r2
 * @param {number} r3
 * @param {number} r4
 * @returns {string | null}
 */
function buildConditionalInversion(obs, nt, r2, r3, r4) {
  const lex = LEX[obs.sourceId];
  if (!lex?.inversion_conditions || !lex?.subjects || !lex?.predicates) return null;
  const subject   = pickText(lex.subjects,            nt, obs, r2);
  const predicate = pickText(lex.predicates,          nt, obs, r3);
  const condition = pickText(lex.inversion_conditions, nt, obs, r4);
  if (!subject || !predicate || !condition) return null;
  return `${cap(subject)} ${predicate}, ${condition}.`;
}


// --- Passage-level shape selection ---
//
// When 2+ observations are present, a passage shape is selected using
// obs[0]'s r1 slot. The shape determines how observations are combined
// into prose. 'independent' (the default) produces one sentence per obs.
// Multi-obs shapes fold observations into compound or sequential forms.
//
// RNG accounting: obs[0]'s r1 = shape selector. Obs[0]'s r2/r3/r4 and
// all subsequent obs' r1/r2/r3/r4 are consumed normally. Total = 4N.

const PASSAGE_SHAPE_WEIGHTS = {
  calm:        { appositive: 0.25, terminal: 0.15, arrival_seq: 0.20 },
  heightened:  { appositive: 0.30, terminal: 0.10, arrival_seq: 0.25 },
  anxious:     { appositive: 0.15, terminal: 0.25, arrival_seq: 0.08 },
  dissociated: { appositive: 0.10, terminal: 0.30, arrival_seq: 0.12 },
  flat:        { appositive: 0.15, terminal: 0.25, arrival_seq: 0.10 },
};

/**
 * Select a passage shape using pre-rolled r (obs[0]'s r1 slot).
 * Returns: 'independent' | 'appositive' | 'terminal_list' | 'arrival_seq'
 */
/**
 * @param {Observation[]} observations
 * @param {Hint} hint
 * @param {NTSnapshot} ntCtx
 * @param {number} r
 * @returns {'independent' | 'appositive' | 'terminal_list' | 'arrival_seq'}
 */
function selectPassageShape(observations, hint, ntCtx, r) {
  if (!observations || observations.length < 2) return 'independent';

  const w = PASSAGE_SHAPE_WEIGHTS[hint] ?? PASSAGE_SHAPE_WEIGHTS.calm;

  // Eligibility checks
  const canAppositive = !!LEX[observations[1]?.sourceId]?.appositive_np;
  const canTerminalList = observations.length >= 3
    && observations[0].channels[0] !== observations[observations.length - 1].channels[0];
  const canArrivalSeq = observations.length >= 2;

  const items = [
    { weight: 1.0,                                              value: 'independent'   },
    { weight: w.appositive  * (canAppositive   ? 1 : 0),       value: 'appositive'    },
    { weight: w.terminal    * (canTerminalList ? 1 : 0),       value: 'terminal_list' },
    { weight: w.arrival_seq * (canArrivalSeq   ? 1 : 0),       value: 'arrival_seq'   },
  ];

  return wpick(items, r);
}

/**
 * Appositive fold: two obs → one sentence.
 * "The fridge hums, a weight in the limbs."
 * Obs[0] builds the main clause (short declarative using r2/r3/r4).
 * Obs[1]'s r1 picks the appositive NP; r2/r3/r4 consumed but unused.
 * Obs[2..N-1] realized independently.
 * Total RNG: 4N.
 */
/**
 * @param {Observation} obs0
 * @param {Observation} obs1
 * @param {Hint} hint
 * @param {NTSnapshot} ntCtx
 * @param {number} r0_1
 * @param {RandomFn} random
 * @param {Observation[]} remaining
 * @returns {string | null}
 */
function buildAppositiveExpansion(obs0, obs1, hint, ntCtx, r0_1, random, remaining) {
  // Draw all calls upfront to guarantee RNG invariant regardless of fallback path
  const r2_0 = random(), r3_0 = random(), r4_0 = random();                           // obs0 remaining
  const r1_1 = random(), r2_1 = random(), r3_1 = random(), r4_1 = random();           // obs1 all 4
  const remainingRng = remaining.map(() => [random(), random(), random(), random()]); // rest all 4

  const lex0 = LEX[obs0.sourceId];
  const lex1 = LEX[obs1.sourceId];

  let mainSentence = null;
  if (lex0?.subjects && lex0?.predicates && lex1?.appositive_np) {
    const subj = pickText(lex0.subjects,    ntCtx, obs0, r2_0);
    const pred = pickText(lex0.predicates,  ntCtx, obs0, r3_0);
    const mod  = lex0.modifiers ? pickText(lex0.modifiers, ntCtx, obs0, r4_0) : null;
    const np   = pickText(lex1.appositive_np, ntCtx, obs1, r1_1);
    if (subj && pred && np) {
      const main = mod ? `${cap(subj)} ${pred}, ${mod}` : `${cap(subj)} ${pred}`;
      mainSentence = `${main}, ${np}.`;
    }
  }

  // Process remaining observations
  const restSentences = remaining.map((obs, i) => {
    const [r1, r2, r3, r4] = remainingRng[i];
    return realizeOne(obs, hint, ntCtx, r1, r2, r3, r4);
  }).filter(Boolean);

  if (mainSentence) {
    return restSentences.length > 0
      ? mainSentence + ' ' + restSentences.join(' ')
      : mainSentence;
  }

  // Fallback: independent sentences using already-consumed RNG values
  const s0 = realizeOne(obs0, hint, ntCtx, r0_1, r2_0, r3_0, r4_0);
  const s1 = realizeOne(obs1, hint, ntCtx, r1_1, r2_1, r3_1, r4_1);
  return [s0, s1, ...restSentences].filter(Boolean).join(' ') || null;
}

/**
 * Terminal list: N obs as comma-separated fragments.
 * "Heavy, the fridge, traffic."
 * Each obs: r2 picks fragment, r3/r4 consumed unused. Total: 4N.
 */
/**
 * @param {Observation[]} obsList
 * @param {Hint} hint
 * @param {NTSnapshot} ntCtx
 * @param {number} r0_1
 * @param {RandomFn} random
 * @returns {string | null}
 */
function buildTerminalListPassage(obsList, hint, ntCtx, r0_1, random) {
  // obs[0]: r0_1 consumed; draw 3 more
  const r2_0 = random(), r3_0 = random(), r4_0 = random();
  // obs[1..N-1]: 4 calls each
  const restRng = obsList.slice(1).map(() => [random(), random(), random(), random()]);

  const frags = [];

  // obs[0] fragment: use r2_0
  const lex0 = LEX[obsList[0].sourceId];
  const pool0 = lex0?.fragments ?? lex0?.subjects;
  const frag0 = pool0 ? pickText(pool0, ntCtx, obsList[0], r2_0) : null;
  if (frag0) frags.push(frag0.toLowerCase());

  // obs[1..N-1]: use r2 (index 1 of their 4 calls) for fragment
  obsList.slice(1).forEach((obs, i) => {
    const [_r1, r2] = restRng[i];
    const lex = LEX[obs.sourceId];
    const pool = lex?.fragments ?? lex?.subjects;
    const frag = pool ? pickText(pool, ntCtx, obs, r2) : null;
    if (frag) frags.push(frag.toLowerCase());
  });

  if (frags.length === 0) {
    // Fallback: independent sentences using already-consumed calls
    const s0 = realizeOne(obsList[0], hint, ntCtx, r0_1, r2_0, r3_0, r4_0);
    const rest = obsList.slice(1).map((obs, i) => {
      const [r1, r2, r3, r4] = restRng[i];
      return realizeOne(obs, hint, ntCtx, r1, r2, r3, r4);
    });
    return [s0, ...rest].filter(Boolean).join(' ') || null;
  }

  frags[0] = cap(frags[0]);
  return frags.join(', ') + '.';
}

/**
 * Arrival sequence: obs as sentences joined with "Then".
 * "The fridge hums. Then the room is cold."
 * Each obs: r2/r3 pick subject/predicate, r4 picks modifier. Total: 4N.
 */
/**
 * @param {Observation[]} obsList
 * @param {Hint} hint
 * @param {NTSnapshot} ntCtx
 * @param {number} r0_1
 * @param {RandomFn} random
 * @returns {string | null}
 */
function buildArrivalSeqPassage(obsList, hint, ntCtx, r0_1, random) {
  // obs[0]: r0_1 consumed; draw 3 more
  const r2_0 = random(), r3_0 = random(), r4_0 = random();
  // obs[1..N-1]: 4 calls each
  const restRng = obsList.slice(1).map(() => [random(), random(), random(), random()]);

  const parts = [];

  // obs[0]
  const lex0 = LEX[obsList[0].sourceId];
  if (lex0?.subjects && lex0?.predicates) {
    const subj = pickText(lex0.subjects,   ntCtx, obsList[0], r2_0);
    const pred = pickText(lex0.predicates, ntCtx, obsList[0], r3_0);
    const mod  = lex0.modifiers ? pickText(lex0.modifiers, ntCtx, obsList[0], r4_0) : null;
    if (subj && pred) {
      parts.push({ text: mod ? `${cap(subj)} ${pred}, ${mod}` : `${cap(subj)} ${pred}`, first: true });
    }
  }

  // obs[1..N-1]
  obsList.slice(1).forEach((obs, i) => {
    const [_r1, r2, r3, r4] = restRng[i];
    const lex = LEX[obs.sourceId];
    if (!lex?.subjects || !lex?.predicates) return;
    const subj = pickText(lex.subjects,   ntCtx, obs, r2);
    const pred = pickText(lex.predicates, ntCtx, obs, r3);
    const mod  = lex.modifiers ? pickText(lex.modifiers, ntCtx, obs, r4) : null;
    if (!subj || !pred) return;
    parts.push({ text: mod ? `${subj} ${pred}, ${mod}` : `${subj} ${pred}`, first: false });
  });

  if (parts.length === 0) return null;
  if (parts.length === 1) return `${parts[0].text}.`;

  const segments = parts.map((p, i) => i === 0 ? p.text : `Then ${p.text}`);
  return segments.join('. ') + '.';
}


// --- Architecture weights per hint ---
//
// Relative weights — normalized inside wpick. 0 = never selected.
// body and ambig eligibility are further gated by lex availability.

const ARCH_WEIGHTS = {
  calm: {
    short: 1.2, body: 0.8, bare: 0.2, ambig: 0.0, escape: 1.0,
    reframe: 0.3, char_pred: 0.4, flat_taut: 0.0, inversion: 0.4,
  },
  heightened: {
    short: 1.0, body: 0.7, bare: 0.1, ambig: 0.0, escape: 1.2,
    reframe: 0.8, char_pred: 0.3, flat_taut: 0.0, inversion: 0.6,
  },
  anxious: {
    short: 2.5, body: 0.5, bare: 0.3, ambig: 0.0, escape: 0.0,
    reframe: 0.6, char_pred: 0.3, flat_taut: 0.0, inversion: 0.0,
  },
  dissociated: {
    short: 0.8, body: 0.6, bare: 1.2, ambig: 1.5, escape: 0.0,
    reframe: 0.2, char_pred: 0.8, flat_taut: 0.0, inversion: 0.0,
  },
  overwhelmed: {
    short: 1.5, body: 0.8, bare: 0.8, ambig: 0.0, escape: 0.0,
    reframe: 0.2, char_pred: 0.3, flat_taut: 0.0, inversion: 0.0,
  },
  flat: {
    short: 1.5, body: 0.8, bare: 0.6, ambig: 0.0, escape: 0.1,
    reframe: 0.2, char_pred: 0.6, flat_taut: 0.6, inversion: 0.2,
  },
};

// --- Single-observation realization ---
//
// Consumes exactly r1..r4 (4 pre-rolled values from the caller).

/**
 * @param {Observation} obs
 * @param {Hint} hint
 * @param {NTSnapshot} ntCtx
 * @param {number} r1
 * @param {number} r2
 * @param {number} r3
 * @param {number} r4
 * @returns {string | null}
 */
function realizeOne(obs, hint, ntCtx, r1, r2, r3, r4) {
  // Direct lookup first; fallback for dynamic item sources (item_phone_nightstand → item_phone)
  let lex = LEX[obs.sourceId];
  if (!lex && obs.sourceId.startsWith('item_')) {
    const parts = obs.sourceId.split('_');
    // item_[type]_[spot] → item_[type]
    const itemType = parts.slice(1, -1).join('_');
    lex = LEX['item_' + itemType];
  }
  if (!lex) return null;

  const w      = ARCH_WEIGHTS[hint] ?? ARCH_WEIGHTS.calm;

  // Build eligible architecture list; gate body/ambig on lex availability
  const archs = [
    { weight: w.short,                                            value: 'short'    },
    { weight: w.body      * (lex.body_subjects ? 1 : 0),         value: 'body'     },
    { weight: w.bare,                                             value: 'bare'     },
    { weight: w.ambig     * (lex.ambiguity_alts ? 1 : 0),        value: 'ambig'    },
    { weight: w.escape    * (lex.escapes ? 1 : 0),               value: 'escape'   },
    { weight: w.reframe   * (lex.reframe_pairs ? 1 : 0),         value: 'reframe'  },
    { weight: w.char_pred * (lex.character_predicates ? 1 : 0),  value: 'char_pred'},
    { weight: w.flat_taut * (lex.flat_descriptions ? 1 : 0),     value: 'flat_taut'},
    { weight: w.inversion * (lex.inversion_conditions ? 1 : 0),  value: 'inversion'},
  ];

  const arch = wpick(archs, r1);

  let result;
  switch (arch) {
    case 'short':  result = buildShortDeclarative(obs, ntCtx, r2, r3, r4);  break;
    case 'body':   result = buildBodyAsSubject(obs, ntCtx, r2, r3, r4);    break;
    case 'bare':   result = buildBareFragment(obs, ntCtx, r2, r3, r4);     break;
    case 'ambig':  result = buildSourceAmbiguity(obs, ntCtx, r2, r3, r4);  break;
    case 'escape': result = buildInterpretiveEscape(obs, ntCtx, r2, r3, r4); break;
    case 'reframe':    result = buildReframeDash(obs, ntCtx, r2, r3, r4);           break;
    case 'char_pred':  result = buildSensationCharacter(obs, ntCtx, r2, r3, r4);    break;
    case 'flat_taut':  result = buildFlatTautology(obs, ntCtx, r2, r3, r4);         break;
    case 'inversion':  result = buildConditionalInversion(obs, ntCtx, r2, r3, r4);  break;
    default:       result = buildShortDeclarative(obs, ntCtx, r2, r3, r4); break;
  }

  // Fallback: if chosen architecture couldn't build (missing lex fields), use short declarative
  const rawSentence = result ?? buildShortDeclarative(obs, ntCtx, r2, r3, r4);

  // Acoustic modulation (Layer 2 deterministic modifier): append spatial quality suffix
  // for sound-channel observations in reverberant or absorptive spaces.
  // Fires before APD/chromesthesia — modifies the base sentence's spatial character.
  // No extra RNG calls — r1 reused as suffix index.
  const sentence = (rawSentence && obs.channels?.includes('sound') && obs.acoustic)
    ? applyAcousticModulation(rawSentence, obs.acoustic, obs.sourceId, r1)
    : rawSentence;

  // APD (Layer 2 deterministic modifier): replace speech-source sentences with parse-fail fragments.
  // Fires before chromesthesia — APD replaces the whole sentence; synesthesia appends to whatever lands.
  // r1 already consumed as arch selector — reused here as fragment index. No extra RNG calls.
  const apdReplacement = applyAPD(obs.sourceId, ntCtx.apd ?? false, r1);
  if (apdReplacement) {
    // Chromesthesia still applies to APD replacements — the sound colour arrives even when the
    // words don't. APD affects parsing; synesthesia affects sensory channel cross-activation.
    if (ntCtx.synesthesia && obs.channels?.includes('sound')) {
      return applyChromesthesia(apdReplacement, obs.sourceId, obs.channels, ntCtx.synesthesia, r1);
    }
    return apdReplacement;
  }

  // Chromesthesia (Layer 2 deterministic modifier): append colour fragment for sound sources.
  // r1 already consumed as arch selector — reused here as palette index. No extra RNG calls.
  if (sentence && ntCtx.synesthesia && obs.channels?.includes('sound')) {
    return applyChromesthesia(sentence, obs.sourceId, obs.channels, ntCtx.synesthesia, r1);
  }

  // Flashbulb perception (Layer 2 deterministic modifier): PTSD + NE > 0.70 makes
  // sensory detail hyperspecific on non-trauma observations. The nervous system is
  // recording everything with too much resolution. No extra RNG calls — fragment
  // index derived from r1. Only fires on environmental sources (not interoception,
  // not the trauma_echo itself).
  if (sentence && ntCtx.has_ptsd && ntCtx.ne > 0.70 && obs.sourceId !== 'trauma_echo') {
    const isEnvironmental = obs.channels?.some(c => c === 'sound' || c === 'sight' || c === 'smell' || c === 'thermal');
    if (isEnvironmental) {
      const flashbulbFragments = [
        'The specific frequency of it.',
        'Every detail too clear.',
        'You\'ll remember this exactly.',
        'The precision is the problem.',
      ];
      const idx = Math.floor(r1 * flashbulbFragments.length);
      return `${sentence} ${flashbulbFragments[idx]}`;
    }
  }

  return sentence;
}

// --- Main entry point ---

/**
 * Construct a prose passage from the given observations.
 *
 * Realizes every observation passed — the caller decides what to include
 * (salience threshold, habituation, budget). Sorted highest-salience first.
 *
 * RNG consumption: exactly observations.length × 4 calls.
 *
 * @param {Observation[]} observations
 * @param {Hint} hint
 * @param {NTSnapshot} ntCtx
 * @param {RandomFn} random
 * @returns {string | null}
 */
export function realize(observations, hint, ntCtx, random) {
  if (!observations || observations.length === 0) return null;

  // Overwhelmed: polysyndeton — combine all observations into one sentence
  if (hint === 'overwhelmed') {
    const phrases = observations.map((obs, idx) => {
      const r1 = random(), r2 = random(), r3 = random(), r4 = random();
      const sentence = realizeOne(obs, hint, ntCtx, r1, r2, r3, r4);
      if (!sentence) return null;
      // Strip terminal punctuation; lowercase all but the first phrase
      const phrase = sentence.replace(/[.!?]+$/, '');
      return idx === 0 ? phrase : phrase.charAt(0).toLowerCase() + phrase.slice(1);
    }).filter(Boolean);

    if (phrases.length === 0) return null;
    return phrases.join(' and ') + '.';
  }

  // Single observation: no passage shape needed
  if (observations.length === 1) {
    const r1 = random(), r2 = random(), r3 = random(), r4 = random();
    return realizeOne(observations[0], hint, ntCtx, r1, r2, r3, r4);
  }

  // Multiple observations: draw obs[0]'s r1 upfront for passage-shape selection.
  // Shape selection uses this value; the independent path passes it through to realizeOne
  // as obs[0]'s r1. All paths consume exactly 4N calls total.
  const r0_1 = random();
  const shape = selectPassageShape(observations, hint, ntCtx, r0_1);

  if (shape === 'appositive') {
    return buildAppositiveExpansion(
      observations[0], observations[1], hint, ntCtx, r0_1, random, observations.slice(2)
    );
  }
  if (shape === 'terminal_list') {
    return buildTerminalListPassage(observations, hint, ntCtx, r0_1, random);
  }
  if (shape === 'arrival_seq') {
    return buildArrivalSeqPassage(observations, hint, ntCtx, r0_1, random);
  }

  // Independent: each observation is its own sentence.
  // Obs[0] uses r0_1 as its r1 (arch selector); draw its remaining 3 slots.
  const r2 = random(), r3 = random(), r4 = random();
  const s0 = realizeOne(observations[0], hint, ntCtx, r0_1, r2, r3, r4);
  const rest = observations.slice(1).map(obs => {
    const r1 = random(), r2 = random(), r3 = random(), r4 = random();
    return realizeOne(obs, hint, ntCtx, r1, r2, r3, r4);
  }).filter(Boolean);
  const sentences = [s0, ...rest].filter(Boolean);
  return sentences.length > 0 ? sentences.join(' ') : null;
}
