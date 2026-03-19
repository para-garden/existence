// runs.js — IndexedDB storage layer for multi-run support
// Falls back to an in-memory Map backend when IndexedDB is unavailable (e.g. bun/Node.js tests).

/** @param {GameContext} ctx */
export function createRuns(ctx) {
  const DB_NAME = 'existence';
  const DB_VERSION = 1;

  const useIDB = typeof indexedDB !== 'undefined';

  // --- Helpers ---

  /** @param {RunRecord} record @returns {RunSummary} */
  function recordToSummary(record) {
    return {
      id: record.id,
      status: record.status,
      createdAt: record.createdAt,
      lastPlayed: record.lastPlayed,
      actionCount: record.actions ? record.actions.length : 0,
      characterName: record.character
        ? record.character.first_name + ' ' + record.character.last_name
        : 'Unknown',
      jobType: record.character ? record.character.job_type : '',
      ageStage: record.character ? record.character.age_stage : '',
      version: record.version,
    };
  }

  // --- In-memory backend (headless / test mode) ---

  /** @type {Map<string, RunRecord>} */
  const memRuns = new Map();
  /** @type {string | null} */
  let memActiveRunId = null;

  const memBackend = {
    /** @returns {Promise<void>} */
    open() { return Promise.resolve(); },

    /** @param {number} seed @param {GameCharacter} character @returns {Promise<string>} */
    createRun(seed, character) {
      const id = crypto.randomUUID();
      const now = Date.now();
      /** @type {RunRecord} */
      const record = { id, seed, character, actions: [], status: 'active', createdAt: now, lastPlayed: now, version: 6 };
      memRuns.set(id, record);
      memActiveRunId = id;
      return Promise.resolve(id);
    },

    /** @param {string} id @returns {Promise<RunRecord | null>} */
    loadRun(id) { return Promise.resolve(memRuns.get(id) ?? null); },

    /** @returns {Promise<string | null>} */
    getActiveRunId() { return Promise.resolve(memActiveRunId); },

    /** @param {string | null} id @returns {Promise<void>} */
    setActiveRunId(id) { memActiveRunId = id; return Promise.resolve(); },

    /** @param {string} id @param {ActionEntry[]} actions */
    saveActions(id, actions) {
      const record = memRuns.get(id);
      if (record) {
        record.actions = actions;
        record.lastPlayed = Date.now();
      }
    },

    flush() {},

    /** @returns {Promise<RunSummary[]>} */
    listRuns() {
      const summaries = [...memRuns.values()]
        .sort((a, b) => b.lastPlayed - a.lastPlayed)
        .map(record => recordToSummary(record));
      return Promise.resolve(summaries);
    },

    /** @param {string} id @returns {Promise<void>} */
    deleteRun(id) { memRuns.delete(id); return Promise.resolve(); },

    /**
     * Store an externally-provided RunRecord verbatim, assigning it a fresh local ID.
     * @param {RunRecord} record
     * @returns {Promise<string>} the new local ID
     */
    importRun(record) {
      const id = crypto.randomUUID();
      /** @type {RunRecord} */
      const stored = { ...record, id };
      memRuns.set(id, stored);
      return Promise.resolve(id);
    },

    dispose() {},
  };

  // --- IDB backend ---

  /** @type {IDBDatabase | null} */
  let db = null;

  // Debounced save state
  /** @type {ReturnType<typeof setTimeout> | null} */
  let saveTimer = null;
  /** @type {{ id: string, actions: ActionEntry[] } | null} */
  let pendingSave = null;

  const SAVE_DEBOUNCE_MS = 500;

  // Store the bound flush handler so we can remove it on dispose
  const boundFlush = () => idbBackend.flush();

  function writePendingSave() {
    if (!pendingSave || !db) return;

    const { id, actions } = pendingSave;
    pendingSave = null;
    saveTimer = null;

    const tx = db.transaction('runs', 'readwrite');
    const store = tx.objectStore('runs');
    const request = store.get(id);

    request.onsuccess = () => {
      const record = request.result;
      if (record) {
        record.actions = actions;
        record.lastPlayed = Date.now();
        store.put(record);
      }
    };
  }

  const idbBackend = {
    /** @returns {Promise<void>} */
    open() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const database = /** @type {IDBOpenDBRequest} */ (event.target).result;

          // Runs store
          const runsStore = database.createObjectStore('runs', { keyPath: 'id' });
          runsStore.createIndex('status', 'status', { unique: false });
          runsStore.createIndex('lastPlayed', 'lastPlayed', { unique: false });

          // Meta store (key-value)
          database.createObjectStore('meta', { keyPath: 'key' });
        };

        request.onsuccess = (event) => {
          db = /** @type {IDBOpenDBRequest} */ (event.target).result;

          // Flush pending writes on unload
          if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', boundFlush);
          }

          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    },

    /** @param {number} seed @param {GameCharacter} character @returns {Promise<string>} */
    createRun(seed, character) {
      return new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        const now = Date.now();

        /** @type {RunRecord} */
        const record = {
          id,
          seed,
          character,
          actions: [],
          status: 'active',
          createdAt: now,
          lastPlayed: now,
          version: 6,
        };

        const tx = /** @type {IDBDatabase} */ (db).transaction(['runs', 'meta'], 'readwrite');
        tx.objectStore('runs').put(record);
        tx.objectStore('meta').put({ key: 'activeRunId', value: id });

        tx.oncomplete = () => resolve(id);
        tx.onerror = () => reject(tx.error);
      });
    },

    /** @param {string} id @returns {Promise<RunRecord | null>} */
    loadRun(id) {
      return new Promise((resolve, reject) => {
        const tx = /** @type {IDBDatabase} */ (db).transaction('runs', 'readonly');
        const request = tx.objectStore('runs').get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    },

    /** @returns {Promise<string | null>} */
    getActiveRunId() {
      return new Promise((resolve, reject) => {
        const tx = /** @type {IDBDatabase} */ (db).transaction('meta', 'readonly');
        const request = tx.objectStore('meta').get('activeRunId');

        request.onsuccess = () => {
          const record = request.result;
          resolve(record ? record.value : null);
        };
        request.onerror = () => reject(request.error);
      });
    },

    /** @param {string | null} id @returns {Promise<void>} */
    setActiveRunId(id) {
      return new Promise((resolve, reject) => {
        const tx = /** @type {IDBDatabase} */ (db).transaction('meta', 'readwrite');
        tx.objectStore('meta').put({ key: 'activeRunId', value: id });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },

    /** @param {string} id @param {ActionEntry[]} actions */
    saveActions(id, actions) {
      pendingSave = { id, actions };

      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        writePendingSave();
      }, SAVE_DEBOUNCE_MS);
    },

    flush() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      if (pendingSave && db) {
        const { id, actions } = pendingSave;
        pendingSave = null;

        try {
          const tx = db.transaction('runs', 'readwrite');
          const store = tx.objectStore('runs');
          const request = store.get(id);

          request.onsuccess = () => {
            const record = request.result;
            if (record) {
              record.actions = actions;
              record.lastPlayed = Date.now();
              store.put(record);
            }
          };
        } catch (e) {
          // Best effort on unload
        }
      }
    },

    /** @returns {Promise<RunSummary[]>} */
    listRuns() {
      return new Promise((resolve, reject) => {
        const tx = /** @type {IDBDatabase} */ (db).transaction('runs', 'readonly');
        const store = tx.objectStore('runs');
        const index = store.index('lastPlayed');
        const request = index.openCursor(null, 'prev');

        /** @type {RunSummary[]} */
        const summaries = [];

        request.onsuccess = (event) => {
          const cursor = /** @type {IDBCursorWithValue | null} */ (/** @type {IDBRequest} */ (event.target).result);
          if (cursor) {
            const record = cursor.value;
            summaries.push(recordToSummary(record));
            cursor.continue();
          } else {
            resolve(summaries);
          }
        };

        request.onerror = () => reject(request.error);
      });
    },

    /** @param {string} id @returns {Promise<void>} */
    deleteRun(id) {
      return new Promise((resolve, reject) => {
        const tx = /** @type {IDBDatabase} */ (db).transaction('runs', 'readwrite');
        tx.objectStore('runs').delete(id);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },

    /**
     * Store an externally-provided RunRecord verbatim, assigning it a fresh local ID.
     * Does NOT set it as the active run.
     * @param {RunRecord} record
     * @returns {Promise<string>} the new local ID
     */
    importRun(record) {
      return new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        /** @type {RunRecord} */
        const stored = { ...record, id };

        const tx = /** @type {IDBDatabase} */ (db).transaction('runs', 'readwrite');
        tx.objectStore('runs').put(stored);

        tx.oncomplete = () => resolve(id);
        tx.onerror = () => reject(tx.error);
      });
    },

    dispose() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', boundFlush);
      }
      idbBackend.flush();
    },
  };

  // Select backend based on environment
  const backend = useIDB ? idbBackend : memBackend;

  // --- Public interface (delegates to selected backend) ---

  function open() { return backend.open(); }
  function createRun(seed, character) { return backend.createRun(seed, character); }
  function loadRun(id) { return backend.loadRun(id); }
  function getActiveRunId() { return backend.getActiveRunId(); }
  function setActiveRunId(id) { return backend.setActiveRunId(id); }
  function saveActions(id, actions) { return backend.saveActions(id, actions); }
  function flush() { return backend.flush(); }
  function listRuns() { return backend.listRuns(); }
  function deleteRun(id) { return backend.deleteRun(id); }
  /** @param {RunRecord} record @returns {Promise<string>} */
  function importRun(record) { return backend.importRun(record); }
  function dispose() { return backend.dispose(); }

  return {
    open,
    createRun,
    loadRun,
    getActiveRunId,
    setActiveRunId,
    saveActions,
    flush,
    listRuns,
    deleteRun,
    importRun,
    dispose,
  };
}

