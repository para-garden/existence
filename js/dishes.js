// dishes.js — coarse_v1 dish tracking
// Tracks counts: clean dishes available vs dirty dishes in the sink.
// Full granularity would track individual items by id and type.
// See DESIGN-OBJECTS.md for the interface contract.

/** @param {GameContext} ctx */
export function createDishes(ctx) {
  // Coarse state — counts only, no item identity.
  let _clean = 5;   // dishes available to use
  let _in_sink = 0; // dirty dishes in the sink
  let _total = 5;   // total dish set size (set at reset)

  // --- Queries ---

  function dirtyCount() {
    return _in_sink;
  }

  function inSinkCount() {
    return _in_sink;
  }

  function availableCount() {
    return _clean;
  }

  function canEat() {
    return _clean > 0;
  }

  /** Returns a prose sentence describing the sink state. Always non-empty. */
  function sinkDescription() {
    if (_in_sink === 0) return 'The sink is empty.';
    if (_in_sink === 1) return 'A dish in the sink.';
    if (_in_sink === 2) return 'A couple of dishes in the sink.';
    if (_in_sink <= 4) return 'Dishes in the sink. They\'ve been there.';
    return 'The sink is full. Has been for a while.';
  }

  // --- Mutations ---

  /** Eating uses a clean dish; it ends up in the sink. */
  function use() {
    if (_clean > 0) {
      _clean--;
      _in_sink++;
    } else {
      // No clean dishes — eating over the sink or from the pot.
      // Track it as an additional sink item so doing dishes later clears it.
      _in_sink++;
    }
  }

  /**
   * Washing dishes. Cleans `count` items from the sink (all if omitted).
   * @param {number} [count]
   */
  function wash(count) {
    const n = count !== undefined ? count : _in_sink;
    const washed = Math.min(n, _in_sink);
    _in_sink -= washed;
    _clean += washed;
  }

  // --- Lifecycle ---

  /**
   * Reset to initial state. Called at the start of each replay.
   * @param {GameCharacter} character
   */
  function reset(character) {
    // Economic origin could affect dish set size — defaults to 5 for now.
    _total = 5;
    _clean = _total;
    _in_sink = 0;
  }

  // --- Serialization (for future save-state if needed) ---

  function serialize() {
    return { clean: _clean, in_sink: _in_sink, total: _total };
  }

  /** @param {{ clean: number, in_sink: number, total: number }} data */
  function deserialize(data) {
    _clean = data.clean ?? _total;
    _in_sink = data.in_sink ?? 0;
    _total = data.total ?? 5;
  }

  return {
    dirtyCount,
    inSinkCount,
    availableCount,
    canEat,
    sinkDescription,
    use,
    wash,
    reset,
    serialize,
    deserialize,
  };
}
