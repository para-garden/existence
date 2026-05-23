// events.js — event history system
// Semantic log parallel to the action log. Not persisted —
// reconstructed during replay (same seed + actions = same events).

/** @param {GameContext} ctx */
export function createEvents(ctx) {
  /** @type {EventEntry[]} */
  let log = [];

  function init() {
    log = [];
  }

  /**
   * @template {string} T
   * @param {T} type
   * @param {EventDataFor<T>} [data]
   */
  function record(type, data) {
    log.push(/** @type {EventEntry} */ ({
      time: ctx.state.get('time'),
      type,
      data: data ?? /** @type {EventDataFor<T>} */ ({}),
    }));
  }

  /**
   * @template {string} T
   * @param {T} type
   * @returns {EventEntry<T> | null}
   */
  function last(type) {
    for (let i = log.length - 1; i >= 0; i--) {
      const e = log[i];
      if (e && e.type === type) return /** @type {EventEntry<T>} */ (/** @type {unknown} */ (e));
    }
    return null;
  }

  /**
   * @template {string} T
   * @param {T} type
   * @param {number} sinceTime
   * @returns {EventEntry<T>[]}
   */
  function since(type, sinceTime) {
    /** @type {EventEntry<T>[]} */
    const result = [];
    for (const entry of log) {
      if (entry.type === type && entry.time >= sinceTime) {
        result.push(/** @type {EventEntry<T>} */ (/** @type {unknown} */ (entry)));
      }
    }
    return result;
  }

  /**
   * @param {string} type
   * @param {number} [sinceTime]
   * @returns {number}
   */
  function count(type, sinceTime) {
    let n = 0;
    for (const entry of log) {
      if (entry.type === type && (sinceTime === undefined || entry.time >= sinceTime)) {
        n++;
      }
    }
    return n;
  }

  /**
   * True if any event of this type was recorded at or after sinceTime.
   * @param {string} type
   * @param {number} sinceTime
   * @returns {boolean}
   */
  function any(type, sinceTime) {
    for (let i = log.length - 1; i >= 0; i--) {
      const e = log[i];
      if (!e) continue;
      if (e.time < sinceTime) break;
      if (e.type === type) return true;
    }
    return false;
  }

  /** @param {string} type @returns {number | null} */
  function daysSinceLast(type) {
    const entry = last(type);
    if (!entry) return null;
    return (ctx.state.get('time') - entry.time) / 1440;
  }

  function all() {
    return log.slice();
  }

  /** @param {EventEntry[]} savedLog */
  function restoreLog(savedLog) {
    log = structuredClone(savedLog);
  }

  return { init, record, last, since, any, count, daysSinceLast, all, restoreLog };
}
