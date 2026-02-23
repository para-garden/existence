// events.js — event history system
// Semantic log parallel to the action log. Not persisted —
// reconstructed during replay (same seed + actions = same events).

export function createEvents(ctx) {
  /** @type {{ time: number, type: string, data: object }[]} */
  let log = [];

  function init() {
    log = [];
  }

  /** @param {string} type @param {object} [data] */
  function record(type, data = {}) {
    log.push({ time: ctx.state.get('time'), type, data });
  }

  /** @param {string} type @returns {{ time: number, type: string, data: object } | null} */
  function last(type) {
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i].type === type) return log[i];
    }
    return null;
  }

  /** @param {string} type @param {number} sinceTime @returns {{ time: number, type: string, data: object }[]} */
  function since(type, sinceTime) {
    const result = [];
    for (const entry of log) {
      if (entry.type === type && entry.time >= sinceTime) {
        result.push(entry);
      }
    }
    return result;
  }

  /** @param {string} type @param {number} [sinceTime] @returns {number} */
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
   * @param {string} type @param {number} sinceTime @returns {boolean}
   */
  function any(type, sinceTime) {
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i].time < sinceTime) break;
      if (log[i].type === type) return true;
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

  /** @param {{ time: number, type: string, data: object }[]} savedLog */
  function restoreLog(savedLog) {
    log = structuredClone(savedLog);
  }

  return { init, record, last, since, any, count, daysSinceLast, all, restoreLog };
}

