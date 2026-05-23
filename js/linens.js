// linens.js — coarse_v1 linen tracking
// Tracks bed state and towel state.
// Full granularity would track individual towel items, spare sets, etc.
// See DESIGN-OBJECTS.md for the interface contract.

/** @param {GameContext} ctx */
export function createLinens(ctx) {
  // Bed: 'made' | 'unmade' | 'messy'
  // unmade = just slept in but not particularly disordered
  // messy = slept in multiple days without straightening
  /** @type {'made' | 'unmade' | 'messy'} */
  let _bed = 'unmade';

  // Towel: 'clean_hanging' | 'damp_hanging' | 'on_floor'
  // Sleeping resets to clean_hanging (implicitly a fresh towel is available)
  /** @type {'clean_hanging' | 'damp_hanging' | 'on_floor'} */
  let _towel = 'clean_hanging';

  // How many sleeps since the bed was made (drives 'messy' transition)
  let _nights_unmade = 0;

  // --- Queries ---

  /** @returns {'made' | 'unmade' | 'messy'} */
  function bedState() {
    return _bed;
  }

  /** @returns {'clean_hanging' | 'damp_hanging' | 'on_floor'} */
  function towelState() {
    return _towel;
  }

  // --- Mutations ---

  /** Player makes the bed. */
  function makeBed() {
    _bed = 'made';
    _nights_unmade = 0;
  }

  /** Shower uses the hanging towel — it becomes damp. */
  function useTowel() {
    _towel = 'damp_hanging';
  }

  /**
   * Sleep cycle: bed becomes unmade; towel advances state.
   * Called during sleep execute after advanceTime.
   */
  function noteSlept() {
    if (_bed === 'made') {
      _bed = 'unmade';
      _nights_unmade = 1;
    } else {
      _nights_unmade++;
      if (_nights_unmade >= 3) {
        _bed = 'messy';
      }
    }
    // Damp towel left overnight goes to floor (forgotten); floor towel stays
    if (_towel === 'damp_hanging') {
      _towel = 'on_floor';
    }
    // A new clean towel is implicitly available the next day
    // (towel on floor stays there; clean_hanging = fresh one retrieved from storage)
  }

  /** Player picks up / rehang the towel. */
  function rehangTowel() {
    _towel = 'clean_hanging';
  }

  // --- Lifecycle ---

  /** Reset to initial state. Called at the start of each replay. */
  function reset() {
    _bed = 'unmade';
    _towel = 'clean_hanging';
    _nights_unmade = 0;
  }

  // --- Serialization ---

  function serialize() {
    return { bed: _bed, towel: _towel, nights_unmade: _nights_unmade };
  }

  /** @param {{ bed: string, towel: string, nights_unmade: number }} data */
  function deserialize(data) {
    _bed = data.bed ?? 'unmade';
    _towel = data.towel ?? 'clean_hanging';
    _nights_unmade = data.nights_unmade ?? 0;
  }

  return {
    bedState,
    towelState,
    makeBed,
    useTowel,
    noteSlept,
    rehangTowel,
    reset,
    serialize,
    deserialize,
  };
}
