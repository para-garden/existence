// game.js — initialization, game loop, orchestration

export function createGame(ctx) {

  let isReplaying = false;

  // --- Auto-advance state ---
  /** @type {ReturnType<typeof setTimeout> | null} */
  let autoAdvanceTimer = null;
  /** @type {{ type: 'interact' | 'move', id: string, interaction?: Interaction } | null} */
  let autoAdvanceTarget = null;
  /** @type {string | null} */
  let nextActionSource = null;

  const AUTO_DELAY = 2500; // ms before auto-advance fires

  function cancelAutoAdvance() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
      autoAdvanceTarget = null;
    }
  }

  /**
   * Attempt auto-advance based on habit prediction.
   * Shows approaching prose, highlights the predicted action, and starts a timer.
   * @param {{ actionId: string, strength: number, tier: string, path: string[] } | null} prediction
   * @param {Interaction[]} interactions
   * @param {ConnectionInfo[]} connections
   */
  function tryAutoAdvance(prediction, interactions, connections) {
    if (!prediction || prediction.tier !== 'auto') return;
    if (ctx.state.get('viewing_phone')) return;

    const actionId = prediction.actionId;

    // Look up approaching prose
    const proseFn = ctx.content.approachingProse[actionId];
    if (!proseFn) return;

    const prose = proseFn();
    if (prose) {
      ctx.ui.appendEventText(prose);
    }

    if (actionId.startsWith('move:')) {
      const destId = actionId.slice(5);
      autoAdvanceTarget = { type: 'move', id: destId };
      autoAdvanceTimer = setTimeout(() => {
        autoAdvanceTimer = null;
        autoAdvanceTarget = null;
        nextActionSource = 'auto';
        handleMove(destId);
      }, AUTO_DELAY);
    } else {
      const interaction = interactions.find(i => i.id === actionId);
      if (!interaction) return;
      autoAdvanceTarget = { type: 'interact', id: actionId, interaction };
      autoAdvanceTimer = setTimeout(() => {
        autoAdvanceTimer = null;
        autoAdvanceTarget = null;
        nextActionSource = 'auto';
        handleAction(interaction);
      }, AUTO_DELAY);
    }
  }

  /** @param {string[]} events @param {string[]} eventTexts */
  function generateEventTexts(events, eventTexts) {
    for (const eventId of events) {
      const eventFn = /** @type {Record<string, (() => string) | undefined>} */ (ctx.content.eventText)[eventId];
      if (eventFn) {
        const text = eventFn();
        if (text && text.trim()) eventTexts.push(text);
      }
    }
  }

  async function init() {
    // Open IndexedDB
    await ctx.runs.open();

    const activeRunId = await ctx.runs.getActiveRunId();

    if (activeRunId) {
      const runData = await ctx.runs.loadRun(activeRunId);
      if (runData) {
        await resumeRun(runData);
        return;
      }
    }

    // No active run — check for past runs
    const runs = await ctx.runs.listRuns();
    if (runs.length > 0) {
      showThreshold(runs);
    } else {
      startFresh();
    }
  }

  /** @param {RunRecord} runData */
  async function resumeRun(runData) {
    const saved = ctx.timeline.restoreFrom(runData);
    ctx.timeline.setActiveRunId(runData.id);

    // Restore character from save
    if (saved.character) {
      ctx.character.set(saved.character);
    }

    // Replay all actions to reconstruct state
    ctx.state.init();
    ctx.character.applyToState();
    ctx.events.init();
    ctx.habits.reset();
    ctx.dishes.reset();
    ctx.linens.reset();
    ctx.clothing.reset();

    // Consume same initial RNG as fresh start (opening events + messages)
    const initEvents = ctx.world.checkEvents();
    for (const eventId of initEvents) {
      const eventFn = /** @type {Record<string, (() => string) | undefined>} */ (ctx.content.eventText)[eventId];
      if (eventFn) eventFn();
    }
    ctx.content.generateIncomingMessages();
    const { lastIdleThought, lastInnerVoice, lastInnerVoiceTier, lastSensoryText } = replayActions(saved.actions);

    // Initialize UI
    ctx.ui.init({
      onAction: handleAction,
      onMove: handleMove,
      onIdle: handleIdle,
      onFocusTime: handleFocusTime,
      onFocusMoney: handleFocusMoney,
      onStepAway: handleStepAway,
    });

    ctx.ui.render();
    ctx.ui.showAwareness();
    ctx.ui.updateAwareness();
    showStepAway();
    showLookBack();

    // Restore last idle thought, inner voice, and sensory text so they don't vanish on refresh
    if (lastIdleThought && lastInnerVoiceTier !== 'tremor') {
      setTimeout(() => ctx.ui.appendEventText(lastIdleThought), 500);
    }
    if (lastSensoryText) {
      setTimeout(() => ctx.ui.appendEventText(lastSensoryText), 800);
    }
    if (lastInnerVoice && lastInnerVoiceTier) {
      const ivDelay = lastInnerVoiceTier === 'tremor' ? 500 : 1200;
      setTimeout(() => ctx.ui.appendInnerVoice(lastInnerVoice, lastInnerVoiceTier), ivDelay);
    }
  }

  function startFresh() {
    ctx.timeline.init();
    ctx.habits.reset();

    // Initialize UI early (chargen uses the same DOM)
    ctx.ui.init({
      onAction: handleAction,
      onMove: handleMove,
      onIdle: handleIdle,
      onFocusTime: handleFocusTime,
      onFocusMoney: handleFocusMoney,
      onStepAway: handleStepAway,
    });

    // Pause idle timer during chargen, hide awareness
    ctx.ui.stopIdleTimer();
    ctx.ui.hideAwareness();
    hideStepAway();
    hideLookBack();

    ctx.chargen.startCreation().then(character => {
      // Character is set and saved by chargen.
      // Now start the game.
      ctx.state.init();
      ctx.character.applyToState();
      ctx.events.init();
      ctx.dishes.reset();
      ctx.linens.reset();
    ctx.clothing.reset();

      // Opening — check for initial events (consumes RNG)
      const events = ctx.world.checkEvents();
      /** @type {string[]} */
      const eventTexts = [];
      generateEventTexts(events, eventTexts);
      ctx.content.generateIncomingMessages();

      ctx.ui.render();
      ctx.ui.showAwareness();
      ctx.ui.updateAwareness();
      showStepAway();
      showLookBack();

      if (eventTexts.length > 0) {
        const firstText = /** @type {string} */ (eventTexts[0]);
        setTimeout(() => ctx.ui.showEventText(firstText), 1200);
      }
    });
  }

  // --- Threshold screen (run management) ---

  /** @param {RunSummary[]} runs */
  function showThreshold(runs) {
    // Initialize UI if not already done
    ctx.ui.init({
      onAction: handleAction,
      onMove: handleMove,
      onIdle: handleIdle,
      onFocusTime: handleFocusTime,
      onFocusMoney: handleFocusMoney,
      onStepAway: handleStepAway,
    });

    ctx.ui.stopIdleTimer();
    ctx.ui.hideAwareness();
    hideStepAway();
    hideLookBack();

    const passageEl = /** @type {HTMLElement} */ (document.getElementById('passage'));
    const actionsEl = /** @type {HTMLElement} */ (document.getElementById('actions'));
    const movementEl = /** @type {HTMLElement} */ (document.getElementById('movement'));
    const eventTextEl = /** @type {HTMLElement} */ (document.getElementById('event-text'));

    // Clear
    passageEl.classList.remove('visible');
    actionsEl.innerHTML = '';
    actionsEl.classList.remove('visible');
    movementEl.innerHTML = '';
    movementEl.classList.remove('visible');
    eventTextEl.innerHTML = '';
    eventTextEl.classList.remove('visible');

    setTimeout(() => {
      passageEl.innerHTML = '<p>Lives you\'ve lived. Or are living. Or will.</p>';
      passageEl.classList.add('visible');

      setTimeout(() => {
        for (const run of runs) {
          const btn = document.createElement('button');
          btn.className = 'action';
          btn.textContent = thresholdLabel(run);
          btn.addEventListener('click', () => pickRun(run.id));
          actionsEl.appendChild(btn);
        }

        // New life option
        const newBtn = document.createElement('button');
        newBtn.className = 'action';
        newBtn.textContent = 'Another life.';
        newBtn.addEventListener('click', () => startFresh());
        actionsEl.appendChild(newBtn);

        actionsEl.classList.add('visible');
      }, 400);
    }, 150);
  }

  /** @param {RunSummary} run */
  function thresholdLabel(run) {
    const name = run.characterName || 'Someone';
    const age = run.ageStage || '';
    return `${name}, ${age}.`;
  }

  /** @param {string} id */
  async function pickRun(id) {
    const runData = await ctx.runs.loadRun(id);
    if (!runData) return;
    await ctx.runs.setActiveRunId(id);
    await resumeRun(runData);
  }

  // --- Replay with scrubber ---

  // Replay state — persists across scrubber interactions
  /** @type {{ actions: ActionEntry[], scenes: { startIndex: number, endIndex: number, location: string }[], snapshots: { actionIndex: number, rngState: number[], state: any, eventLog: any[] }[], significance: number[], proseCache: Map<number, { text: string, eventTexts: string[] }>, autoplayTimer: ReturnType<typeof setTimeout> | null, runData: RunRecord | null } | null} */
  let replay = null;

  /**
   * Segment action list into scenes. A new scene begins after each move action.
   * The move action is the last action of its scene (departure text belongs to it).
   * @param {ActionEntry[]} actions
   * @returns {{ startIndex: number, endIndex: number, location: string }[]}
   */
  function segmentScenes(actions) {
    if (actions.length === 0) return [];
    /** @type {{ startIndex: number, endIndex: number, location: string }[]} */
    const scenes = [];
    let sceneStart = 0;
    let location = 'apartment_bedroom'; // default start location

    for (let i = 0; i < actions.length; i++) {
      if (actions[i].action.type === 'move') {
        // Move is the last action of the current scene
        scenes.push({ startIndex: sceneStart, endIndex: i, location });
        location = actions[i].action.destination || location;
        sceneStart = i + 1;
      }
    }
    // Final scene (from last move to end)
    if (sceneStart <= actions.length - 1) {
      scenes.push({ startIndex: sceneStart, endIndex: actions.length - 1, location });
    }
    return scenes;
  }

  /**
   * Replay all actions, generating snapshots at scene boundaries and
   * computing per-action significance for the heatmap.
   * Must be called after State/Events/Character/PRNG are initialized and
   * initial events + messages have been consumed (same as resumeRun).
   * @param {ActionEntry[]} actions
   * @param {{ startIndex: number, endIndex: number, location: string }[]} scenes
   * @returns {{ snapshots: { actionIndex: number, rngState: number[], state: any, eventLog: any[] }[], significance: number[] }}
   */
  function replayWithSnapshots(actions, scenes) {
    /** @type {{ actionIndex: number, rngState: number[], state: any, eventLog: any[] }[]} */
    const snapshots = [];
    /** @type {number[]} */
    const significance = [];

    let sceneIdx = 0;

    for (let i = 0; i < actions.length; i++) {
      // Take snapshot at scene boundaries
      if (sceneIdx < scenes.length && i === scenes[sceneIdx].startIndex) {
        snapshots.push({
          actionIndex: i,
          rngState: ctx.timeline.getRngState(),
          state: structuredClone(ctx.state.getAll()),
          eventLog: structuredClone(ctx.events.all()),
        });
        sceneIdx++;
      }

      // Capture state before
      const before = ctx.state.getAll();
      const eventCountBefore = ctx.events.all().length;

      // Execute action (same as existing replayActions logic)
      const action = actions[i].action;
      if (action.type === 'interact') {
        replayInteraction(action.id, action.data);
        consumeEvents();
      } else if (action.type === 'move') {
        replayMove(action.destination);
        consumeEvents();
      } else if (action.type === 'idle') {
        replayIdle();
      } else if (action.type === 'observe_time') {
        ctx.state.observeTime();
      } else if (action.type === 'observe_money') {
        ctx.state.observeMoney();
      }

      // Capture state after and compute significance
      const after = ctx.state.getAll();
      const eventCountAfter = ctx.events.all().length;
      let sig = 0;
      sig += Math.abs(after.energy - before.energy);
      sig += Math.abs(after.stress - before.stress);
      sig += Math.abs(after.hunger - before.hunger);
      sig += Math.abs(after.money - before.money) / 10;
      sig += Math.abs(after.social - before.social);
      sig += Math.abs(after.job_standing - before.job_standing);
      sig += (eventCountAfter - eventCountBefore) * 5;
      significance.push(sig);
    }

    // Normalize significance to [0, 1]
    const maxSig = Math.max(...significance, 1);
    for (let i = 0; i < significance.length; i++) {
      significance[i] /= maxSig;
    }

    return { snapshots, significance };
  }

  /**
   * Execute a single action during scrubber replay, collecting prose.
   * Returns the response text and event texts for display.
   * @param {ActionEntry} entry
   * @returns {{ text: string, eventTexts: string[] }}
   */
  function executeActionForReplay(entry) {
    const action = entry.action;
    let responseText = '';
    /** @type {string[]} */
    const eventTexts = [];

    if (action.type === 'interact' && action.id) {
      const interaction = findInteraction(action.id);
      if (interaction) {
        responseText = /** @type {string} */ (interaction.execute());
      }
      const events = ctx.world.checkEvents();
      generateEventTexts(events, eventTexts);
      ctx.content.generateIncomingMessages();
    } else if (action.type === 'move') {
      if (action.destination) {
        const fromId = ctx.world.getLocationId();
        ctx.world.travelTo(action.destination);
        responseText = ctx.content.transitionText(fromId, action.destination);
        const arrivalText = ctx.senses.arrivalSense(); // match live RNG order
        if (arrivalText) eventTexts.push(arrivalText);
        const events = ctx.world.checkEvents();
        generateEventTexts(events, eventTexts);
        ctx.content.generateIncomingMessages();
      }
    } else if (action.type === 'idle') {
      const thought = ctx.content.idleThoughts();
      if (thought) responseText = thought;
      const ivTier = ctx.state.innerVoiceTier();
      if (ivTier) ctx.content.innerVoiceThoughts(); // consume RNG to keep replay aligned
      const sensory = ctx.senses.sense(); // N×4 or 0 RNG — keeps replay aligned
      if (sensory) eventTexts.push(sensory);
      ctx.state.advanceTime(ctx.timeline.randomInt(2, 5));
    } else if (action.type === 'observe_time') {
      ctx.state.observeTime();
      const source = ctx.content.getTimeSource();
      if (source) responseText = source;
    } else if (action.type === 'observe_money') {
      ctx.state.observeMoney();
      const source = ctx.content.getMoneySource();
      if (source) responseText = source;
    }

    return { text: responseText || '', eventTexts };
  }

  /**
   * Navigate replay to a specific action index. Restores from nearest
   * snapshot and replays forward, collecting prose for display.
   * @param {number} targetIndex
   */
  function goToAction(targetIndex) {
    if (!replay) return;
    stopAutoplay();

    const { actions, scenes, snapshots } = replay;
    if (targetIndex < 0 || targetIndex >= actions.length) return;

    // Find the snapshot that covers this action
    let bestSnapshot = snapshots[0];
    for (const snap of snapshots) {
      if (snap.actionIndex <= targetIndex) {
        bestSnapshot = snap;
      } else {
        break;
      }
    }

    // Restore snapshot state (location is part of state, so World reads it correctly)
    ctx.state.restoreSnapshot(bestSnapshot.state);
    ctx.events.restoreLog(bestSnapshot.eventLog);
    ctx.timeline.setRngState(bestSnapshot.rngState);
    ctx.content.resetIdleTracking();

    // Replay from snapshot to target, collecting prose
    /** @type {string[]} */
    const proseBlocks = [];

    for (let i = bestSnapshot.actionIndex; i <= targetIndex; i++) {
      const result = executeActionForReplay(actions[i]);
      if (result.text && result.text.trim()) {
        proseBlocks.push(result.text);
      }
      for (const et of result.eventTexts) {
        if (et && et.trim()) proseBlocks.push(et);
      }
    }

    // Render collected prose
    const passageEl = /** @type {HTMLElement} */ (document.getElementById('passage'));
    const eventTextEl = /** @type {HTMLElement} */ (document.getElementById('event-text'));
    eventTextEl.innerHTML = '';
    eventTextEl.classList.remove('visible');

    if (proseBlocks.length > 0) {
      passageEl.innerHTML = proseBlocks.map(t => textToHTML(t)).join('');
    } else {
      // Show location description if no prose
      const location = ctx.world.getLocationId();
      const descFn = /** @type {Record<string, (() => string) | undefined>} */ (ctx.content.locationDescriptions)[location];
      passageEl.innerHTML = textToHTML(descFn ? descFn() : '');
    }
    passageEl.classList.add('visible');

    // Update scrubber position
    const scrubber = /** @type {HTMLInputElement | null} */ (document.getElementById('replay-scrubber'));
    if (scrubber) scrubber.value = String(targetIndex);

    // Update scene label
    updateSceneLabel(targetIndex);
  }

  /**
   * Find which scene contains a given action index.
   * @param {number} actionIndex
   * @returns {{ startIndex: number, endIndex: number, location: string } | null}
   */
  function findScene(actionIndex) {
    if (!replay) return null;
    for (const scene of replay.scenes) {
      if (actionIndex >= scene.startIndex && actionIndex <= scene.endIndex) {
        return scene;
      }
    }
    return null;
  }

  /**
   * Update the scene label display.
   * @param {number} actionIndex
   */
  function updateSceneLabel(actionIndex) {
    const label = document.getElementById('replay-scene-label');
    if (!label || !replay) return;

    const scene = findScene(actionIndex);
    if (!scene) { label.textContent = ''; return; }

    // Map location IDs to readable names
    /** @type {Record<string, string>} */
    const locationNames = {
      apartment_bedroom: 'bedroom',
      apartment_kitchen: 'kitchen',
      apartment_bathroom: 'bathroom',
      street: 'street',
      bus_stop: 'bus stop',
      workplace: 'work',
      corner_store: 'corner store',
    };
    const locName = locationNames[scene.location] || scene.location;
    const period = ctx.state.timePeriod().replace(/_/g, ' ');
    label.textContent = `${locName}, ${period}`;
  }

  // --- Autoplay ---

  function startAutoplay() {
    if (!replay) return;
    const btn = document.getElementById('replay-autoplay');
    if (btn) btn.textContent = 'pause';
    advanceAutoplay();
  }

  function stopAutoplay() {
    if (!replay) return;
    if (replay.autoplayTimer) {
      clearTimeout(replay.autoplayTimer);
      replay.autoplayTimer = null;
    }
    const btn = document.getElementById('replay-autoplay');
    if (btn) btn.textContent = 'play';
  }

  function toggleAutoplay() {
    if (!replay) return;
    if (replay.autoplayTimer) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  }

  function advanceAutoplay() {
    if (!replay) return;
    const scrubber = /** @type {HTMLInputElement | null} */ (document.getElementById('replay-scrubber'));
    if (!scrubber) return;

    const current = parseInt(scrubber.value, 10);
    if (current >= replay.actions.length - 1) {
      stopAutoplay();
      return;
    }

    const next = current + 1;
    goToAction(next);

    // Re-start autoplay after this action (goToAction stops it, so re-enable)
    const btn = document.getElementById('replay-autoplay');
    if (btn) btn.textContent = 'pause';

    // Compute delay: base rate scaled by significance, longer at scene boundaries
    const sig = replay.significance[next] || 0;
    const isSceneBoundary = replay.actions[next].action.type === 'move';
    let delay = 400 + sig * 800; // 400ms base, up to 1200ms for high significance
    if (isSceneBoundary) delay = 1500;

    replay.autoplayTimer = setTimeout(advanceAutoplay, delay);
  }

  // --- Heatmap rendering ---

  /**
   * Render the heatmap canvas from significance data.
   * @param {number[]} significance — normalized [0,1] per action
   */
  function renderHeatmap(significance) {
    const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('replay-heatmap'));
    if (!canvas) return;

    canvas.width = significance.length;
    canvas.height = 1;
    const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    const imageData = ctx.createImageData(significance.length, 1);

    for (let i = 0; i < significance.length; i++) {
      const s = significance[i];
      // Amber/gold tone: hsl(35, 60%, L%) mapped to RGB
      // Low significance = dark (#1a1a1a background), high = warm glow
      // Lightness: 11% (background) to 60% (bright amber)
      const l = 0.11 + s * 0.49;
      // Convert HSL(35, 0.6, l) to RGB
      const c = (1 - Math.abs(2 * l - 1)) * 0.6;
      const x = c * (1 - Math.abs(((35 / 60) % 2) - 1));
      const m = l - c / 2;
      // H=35 falls in [0,60) range: r=c, g=x, b=0
      const r = Math.round((c + m) * 255);
      const g = Math.round((x + m) * 255);
      const b = Math.round(m * 255);

      const idx = i * 4;
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /** @param {RunRecord} runData */
  function enterReplay(runData) {
    isReplaying = true;
    ctx.ui.stopIdleTimer();
    ctx.ui.hideAwareness();
    hideStepAway();
    hideLookBack();

    // Restore seed/character/PRNG
    const saved = ctx.timeline.restoreFrom(runData);
    if (saved.character) {
      ctx.character.set(saved.character);
    }

    ctx.state.init();
    ctx.character.applyToState();
    ctx.events.init();

    // Consume initial events + messages (same RNG as live start)
    const initEvents = ctx.world.checkEvents();
    for (const eventId of initEvents) {
      const eventFn = /** @type {Record<string, (() => string) | undefined>} */ (ctx.content.eventText)[eventId];
      if (eventFn) eventFn();
    }
    ctx.content.generateIncomingMessages();

    // Segment scenes
    const scenes = segmentScenes(saved.actions);

    // Generate snapshots + significance via full replay
    const { snapshots, significance } = replayWithSnapshots(saved.actions, scenes);

    // Initialize replay state
    replay = {
      actions: saved.actions,
      scenes,
      snapshots,
      significance,
      proseCache: new Map(),
      autoplayTimer: null,
      runData,
    };

    // Set up the DOM
    const passageEl = /** @type {HTMLElement} */ (document.getElementById('passage'));
    const actionsEl = /** @type {HTMLElement} */ (document.getElementById('actions'));
    const movementEl = /** @type {HTMLElement} */ (document.getElementById('movement'));

    passageEl.classList.remove('visible');
    actionsEl.innerHTML = '';
    actionsEl.classList.remove('visible');
    movementEl.innerHTML = '';
    movementEl.classList.remove('visible');

    // Show replay controls
    const controls = document.getElementById('replay-controls');
    if (controls) controls.classList.remove('hidden');

    // Set up scrubber
    const scrubber = /** @type {HTMLInputElement | null} */ (document.getElementById('replay-scrubber'));
    if (scrubber) {
      scrubber.min = '0';
      scrubber.max = String(saved.actions.length - 1);
      scrubber.value = '0';
      scrubber.oninput = () => goToAction(parseInt(scrubber.value, 10));
    }

    // Render heatmap
    renderHeatmap(significance);

    // Set up nav buttons
    const prevBtn = document.getElementById('replay-prev');
    const nextBtn = document.getElementById('replay-next');
    const autoBtn = document.getElementById('replay-autoplay');
    const backBtn = document.getElementById('replay-back');

    if (prevBtn) prevBtn.onclick = () => {
      if (!replay) return;
      const scrub = /** @type {HTMLInputElement} */ (document.getElementById('replay-scrubber'));
      const current = parseInt(scrub.value, 10);
      // Jump to previous scene boundary
      for (let i = replay.scenes.length - 1; i >= 0; i--) {
        if (replay.scenes[i].startIndex < current) {
          goToAction(replay.scenes[i].startIndex);
          return;
        }
      }
      goToAction(0);
    };

    if (nextBtn) nextBtn.onclick = () => {
      if (!replay) return;
      const scrub = /** @type {HTMLInputElement} */ (document.getElementById('replay-scrubber'));
      const current = parseInt(scrub.value, 10);
      // Jump to next scene boundary
      for (const scene of replay.scenes) {
        if (scene.startIndex > current) {
          goToAction(scene.startIndex);
          return;
        }
      }
      goToAction(replay.actions.length - 1);
    };

    if (autoBtn) autoBtn.onclick = toggleAutoplay;

    if (backBtn) backBtn.onclick = async () => {
      stopAutoplay();
      isReplaying = false;
      replay = null;
      document.removeEventListener('keydown', handleReplayKeydown);
      const replayControls = document.getElementById('replay-controls');
      if (replayControls) replayControls.classList.add('hidden');

      // Restore live game by reloading the run from IDB and replaying
      const activeId = ctx.timeline.getActiveRunId();
      if (activeId) {
        const freshRun = await ctx.runs.loadRun(activeId);
        if (freshRun) {
          await resumeRun(freshRun);
          return;
        }
      }
      // Fallback: go to threshold
      const runs = await ctx.runs.listRuns();
      showThreshold(runs);
    };

    // Set up keyboard navigation
    document.addEventListener('keydown', handleReplayKeydown);

    // Navigate to action 0
    goToAction(0);

    // Show actions area with back button
    actionsEl.classList.add('visible');
  }

  /** @param {KeyboardEvent} e */
  function handleReplayKeydown(e) {
    if (!replay) {
      document.removeEventListener('keydown', handleReplayKeydown);
      return;
    }
    const scrubber = /** @type {HTMLInputElement | null} */ (document.getElementById('replay-scrubber'));
    if (!scrubber) return;
    const current = parseInt(scrubber.value, 10);

    if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
      // Ctrl+Left: previous scene
      e.preventDefault();
      for (let i = replay.scenes.length - 1; i >= 0; i--) {
        if (replay.scenes[i].startIndex < current) {
          goToAction(replay.scenes[i].startIndex);
          return;
        }
      }
      goToAction(0);
    } else if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
      // Ctrl+Right: next scene
      e.preventDefault();
      for (const scene of replay.scenes) {
        if (scene.startIndex > current) {
          goToAction(scene.startIndex);
          return;
        }
      }
      goToAction(replay.actions.length - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (current > 0) goToAction(current - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (current < replay.actions.length - 1) goToAction(current + 1);
    } else if (e.key === ' ') {
      e.preventDefault();
      toggleAutoplay();
    }
  }

  /** @param {string} text @returns {string} */
  function textToHTML(text) {
    const paragraphs = text.split(/\n\n+/).filter(/** @param {string} p */ p => p.trim());
    if (paragraphs.length <= 1) {
      return `<p>${text}</p>`;
    }
    return paragraphs.map(/** @param {string} p */ p => `<p>${p.trim()}</p>`).join('');
  }

  // --- Step away ---

  function showStepAway() {
    const el = document.getElementById('step-away');
    if (el) {
      el.classList.remove('hidden');
      el.classList.add('arriving');
      el.textContent = 'step away';
      el.onclick = handleStepAway;
      el.addEventListener('animationend', () => el.classList.remove('arriving'), { once: true });
    }
  }

  function hideStepAway() {
    const el = document.getElementById('step-away');
    if (el) {
      el.classList.add('hidden');
      el.onclick = null;
    }
  }

  // --- Look back (in-game replay entry) ---

  function showLookBack() {
    const el = document.getElementById('look-back');
    if (el) {
      el.classList.remove('hidden');
      el.classList.add('arriving');
      el.textContent = 'look back';
      el.onclick = handleLookBack;
      el.addEventListener('animationend', () => el.classList.remove('arriving'), { once: true });
    }
  }

  function hideLookBack() {
    const el = document.getElementById('look-back');
    if (el) {
      el.classList.add('hidden');
      el.onclick = null;
    }
  }

  async function handleLookBack() {
    cancelAutoAdvance();
    ctx.runs.flush();
    const activeId = ctx.timeline.getActiveRunId();
    if (!activeId) return;
    const runData = await ctx.runs.loadRun(activeId);
    if (!runData) return;

    hideLookBack();
    enterReplay(runData);
  }

  async function handleStepAway() {
    cancelAutoAdvance();
    // Flush any pending save
    ctx.runs.flush();
    await ctx.runs.setActiveRunId(null);

    // Fade out and show threshold
    const passageEl = /** @type {HTMLElement} */ (document.getElementById('passage'));
    const actionsEl = /** @type {HTMLElement} */ (document.getElementById('actions'));
    const movementEl = /** @type {HTMLElement} */ (document.getElementById('movement'));

    passageEl.classList.remove('visible');
    actionsEl.classList.remove('visible');
    movementEl.classList.remove('visible');

    ctx.ui.stopIdleTimer();
    ctx.ui.hideAwareness();
    hideStepAway();
    hideLookBack();

    setTimeout(async () => {
      const runs = await ctx.runs.listRuns();
      showThreshold(runs);
    }, 500);
  }

  // --- Replay (state reconstruction, no visual) ---

  /** @param {ActionEntry[]} actions @returns {{ lastIdleThought: string | undefined, lastInnerVoice: string | null, lastInnerVoiceTier: string | null, lastSensoryText: string | null }} */
  function replayActions(actions) {
    let lastIdleThought;
    let lastInnerVoice = null;
    let lastInnerVoiceTier = null;
    let lastSensoryText = null;
    for (const entry of actions) {
      const action = entry.action;

      // Snapshot features before action for habit training
      const habitFeatures = ctx.habits.extractFeatures();

      if (action.type === 'interact') {
        replayInteraction(action.id, action.data);
        consumeEvents();
        ctx.habits.addExample(habitFeatures, action.id);
        lastIdleThought = undefined;
        lastInnerVoice = null;
        lastInnerVoiceTier = null;
      } else if (action.type === 'move') {
        replayMove(action.destination);
        consumeEvents();
        ctx.habits.addExample(habitFeatures, 'move:' + action.destination);
        lastIdleThought = undefined;
        lastInnerVoice = null;
        lastInnerVoiceTier = null;
      } else if (action.type === 'idle') {
        const result = replayIdle();
        lastIdleThought = result.thought;
        lastInnerVoice = result.voice;
        lastInnerVoiceTier = result.ivTier;
        lastSensoryText = result.sensory ?? null;
      } else if (action.type === 'observe_time') {
        ctx.state.observeTime();
      } else if (action.type === 'observe_money') {
        ctx.state.observeMoney();
      }
    }

    // Train habit trees from replay data
    ctx.habits.train();

    return { lastIdleThought, lastInnerVoice, lastInnerVoiceTier, lastSensoryText };
  }

  function consumeEvents() {
    const events = ctx.world.checkEvents();
    for (const eventId of events) {
      const eventFn = /** @type {Record<string, (() => string) | undefined>} */ (ctx.content.eventText)[eventId];
      if (eventFn) eventFn();
    }
    ctx.content.generateIncomingMessages();
  }

  /** @param {string | undefined} id @param {Record<string, any>} [data] */
  function replayInteraction(id, data = {}) {
    if (!id) return;
    // During replay, always execute — don't check availability.
    const interaction = findInteraction(id);
    if (interaction) {
      interaction.execute(data);
    }
  }

  /**
   * @returns {{ thought: string | undefined, voice: string | null, ivTier: string | null }}
   */
  function replayIdle() {
    // RNG order must match handleIdle() exactly (see comment there for breakdown)
    const thought = ctx.content.idleThoughts();
    const ivTier = ctx.state.innerVoiceTier();
    const voice = ivTier ? ctx.content.innerVoiceThoughts() : null;
    const sensory = ctx.senses.sense(); // same N×4 or 0 RNG as handleIdle
    ctx.state.advanceTime(ctx.timeline.randomInt(2, 5));
    return { thought, voice, ivTier, sensory };
  }

  /** @param {string | undefined} destId */
  function replayMove(destId) {
    if (!destId) return;
    // During replay, always execute the move
    const fromId = ctx.world.getLocationId();
    ctx.world.travelTo(destId);
    // Consume same RNG as live play — order must match handleMove exactly
    ctx.content.transitionText(fromId, destId);
    ctx.senses.arrivalSense(); // 4 RNG calls or 0, matching live play
  }

  /** @param {string} id */
  function findInteraction(id) {
    for (const interaction of Object.values(ctx.content.interactions)) {
      if (interaction.id === id) return interaction;
    }
    // Check call in sick
    const callIn = ctx.content.getInteraction('call_in');
    if (callIn && callIn.id === id) return callIn;
    return null;
  }

  // --- Focus handlers (clicking awareness display) ---

  function handleFocusTime() {
    if (isReplaying) return;
    ctx.ui.boostTimeFocus();
    const source = ctx.content.getTimeSource();
    if (source) {
      ctx.timeline.recordAction({ type: 'observe_time' });
      ctx.state.observeTime();
      ctx.ui.appendEventText(source);
    }
    ctx.ui.updateAwareness();
  }

  function handleFocusMoney() {
    if (isReplaying) return;
    ctx.ui.boostMoneyFocus();
    const source = ctx.content.getMoneySource();
    if (source) {
      ctx.timeline.recordAction({ type: 'observe_money' });
      ctx.state.observeMoney();
      ctx.ui.appendEventText(source);
    }
    ctx.ui.updateAwareness();
  }

  // --- Focus triggers from events ---

  /** @param {string[]} events @param {Interaction | null} interaction */
  function applyFocusTriggers(events, interaction) {
    for (const eventId of events) {
      if (eventId === 'alarm' || eventId === 'late_anxiety') {
        ctx.ui.boostTimeFocus();
      }
    }
    // Purchase interactions boost money focus
    if (interaction) {
      const id = interaction.id;
      if (id === 'buy_groceries' || id === 'buy_cheap_meal') {
        ctx.ui.boostMoneyFocus();
      }
    }
  }

  /** @param {string} destId */
  function applyMoveFocusTriggers(destId) {
    if (destId === 'corner_store') {
      ctx.ui.boostMoneyFocus();
    }
    if (destId === 'apartment_kitchen') {
      ctx.ui.boostTimeFocus();
    }
  }

  // --- Routine disruption detection ---

  /**
   * Check whether any high-confidence habit action is blocked at the current location.
   * When a ≥0.65 confidence action belongs to the current location but isn't available,
   * that's a disruption — the expected groove isn't there.
   *
   * Location scoping: an action's expected location is its `location` field.
   * - Fixed location (e.g. 'apartment_bedroom'): disruption only when at that location.
   * - location: null (multi-location, self-gated): disruption anywhere the action
   *   could plausibly fire — the action's own available() gate handles it.
   * - move:* actions (habits for movement): skipped — we don't track movement location scope here.
   *
   * Guard: fires at most once per 30 game-minute step to prevent double-firing when
   * both handleAction and handleMove would call it in the same beat.
   *
   * No RNG consumed. No prose here — prose happens in idle thoughts.
   */
  function checkRoutineDisruption() {
    const now = ctx.state.get('time');
    const lastCheck = ctx.state.get('last_disruption_check') ?? 0;
    if (now - lastCheck < 30) return;
    ctx.state.set('last_disruption_check', now);

    const highConf = ctx.habits.getHighConfidenceActions(0.65);
    if (highConf.length === 0) return;

    const currentLocation = ctx.world.getLocationId();

    // Build a set of currently-available action IDs for fast lookup.
    // Use getAvailableInteractions() rather than re-implementing — it already
    // handles the phone-mode guard and location filter.
    const availableIds = new Set(ctx.content.getAvailableInteractions().map(i => i.id));

    for (const actionId of highConf) {
      // Skip movement habits — we don't check movement disruption here.
      if (actionId.startsWith('move:')) continue;

      if (availableIds.has(actionId)) continue; // habit IS available — no disruption

      // Locate the interaction definition to determine its expected location scope.
      let interaction = null;
      for (const ix of Object.values(ctx.content.interactions)) {
        if (ix.id === actionId) { interaction = ix; break; }
      }
      // Check callInSick separately (not in interactions map)
      if (!interaction) {
        const cis = ctx.content.getInteraction('call_in');
        if (cis && cis.id === actionId) interaction = cis;
      }
      if (!interaction) continue; // unknown action — can't scope it

      // Determine whether this action is relevant to the current location.
      const expectedLocation = interaction.location;
      if (expectedLocation !== null && expectedLocation !== currentLocation) {
        // Action belongs to a different location — not a disruption here.
        continue;
      }

      // This action is expected here (or location: null) and is not available.
      // That's a disruption.
      const conf = ctx.habits.getConfidence(actionId);
      const irritation = Math.min(0.008, conf * 0.005);
      ctx.state.adjustSentiment('routine', 'irritation', irritation);
    }
  }

  // --- Action handling ---

  /** @param {Interaction} interaction @param {Record<string, any>} [data] */
  function handleAction(interaction, data = {}) {
    if (isReplaying) return;
    cancelAutoAdvance();

    // Snapshot features before action for habit training
    const habitFeatures = ctx.habits.extractFeatures();

    // Record the action (include data if present)
    const actionEntry = /** @type {{ type: string; id: string; data?: Record<string, any> }} */ ({ type: 'interact', id: interaction.id });
    if (Object.keys(data).length) actionEntry.data = data;
    ctx.timeline.recordAction(actionEntry);

    // Execute and get prose response
    const responseText = interaction.execute(data);

    // Record training example with source tag and retrain periodically
    const actionSource = ctx.habits.addExample(habitFeatures, interaction.id, nextActionSource || undefined);
    nextActionSource = null;
    if (ctx.habits.shouldRetrain()) ctx.habits.train();

    // Routine sentiment — comfort accumulates when the player enacts their own established patterns.
    // Only player-sourced actions count (not auto-advance, not suggestion-following).
    // Threshold 0.6 matches the habit suggestion cutoff — this IS a recognized pattern.
    // Approximation debt (habit sentiment): 0.003 per action chosen; sleep habituation (-0.002/activation)
    // provides a natural ceiling so routine comfort stays bounded without explicit caps.
    // Disruption (routine broken by unavailable habit) is checked in checkRoutineDisruption().
    if (actionSource === 'player') {
      const conf = ctx.habits.getConfidence(interaction.id);
      if (conf >= 0.6) {
        ctx.state.adjustSentiment('routine', 'comfort', 0.003);
      }
    }

    // Check for events after action
    const events = ctx.world.checkEvents();

    // Show the response
    ctx.ui.showPassage(responseText);

    // Generate event text now (consuming RNG synchronously), display later
    /** @type {string[]} */
    const eventTexts = [];
    generateEventTexts(events, eventTexts);

    // Generate incoming phone messages (consumes RNG)
    const msgArrived = ctx.content.generateIncomingMessages();

    // Buzz notification if message arrived + not silent + not in phone mode
    if (msgArrived && !ctx.state.get('phone_silent') && !ctx.state.get('viewing_phone')) {
      eventTexts.push('Your phone buzzes.');
    }

    // Apply focus triggers
    applyFocusTriggers(events, interaction);
    ctx.ui.updateAwareness();

    if (eventTexts.length > 0) {
      let delay = 1500;
      for (const text of eventTexts) {
        const t = text;
        setTimeout(() => ctx.ui.appendEventText(t), delay);
        delay += 1200;
      }
    }

    // Re-render actions and movement after a beat, then check auto-advance
    setTimeout(() => {
      // Phone mode — re-render the phone overlay (shows sent msg, updated compose row, etc.)
      if (ctx.state.get('viewing_phone')) {
        ctx.ui.render();
        return;
      }
      checkRoutineDisruption();
      const interactions = ctx.content.getAvailableInteractions();
      const connections = ctx.world.getConnections();
      const allIds = [
        ...interactions.map(i => i.id),
        ...connections.map(c => 'move:' + c.id),
      ];
      const prediction = ctx.habits.predictHabit(allIds);
      ctx.ui.showActions(interactions, prediction);
      ctx.ui.showMovement(connections, prediction);

      tryAutoAdvance(prediction, interactions, connections);
    }, 800);
  }

  /** @param {string} destId */
  function handleMove(destId) {
    if (isReplaying) return;
    cancelAutoAdvance();
    if (!ctx.world.canTravel(destId)) return;

    // Snapshot features before move for habit training
    const habitFeatures = ctx.habits.extractFeatures();

    // Record the action
    ctx.timeline.recordAction({ type: 'move', destination: destId });

    const fromId = ctx.world.getLocationId();

    // Execute travel
    const travel = ctx.world.travelTo(destId);
    if (!travel) return;

    // Transition text
    const transText = ctx.content.transitionText(travel.from, travel.to);

    // Arrival sense — first-impression observation of new location (RNG consumed synchronously)
    const arrivalText = ctx.senses.arrivalSense();

    // Check events at new location
    const events = ctx.world.checkEvents();

    // Generate event text now (consuming RNG synchronously), display later.
    // Arrival observation goes first — it's the immediate sense of the new place.
    /** @type {string[]} */
    const eventTexts = [];
    if (arrivalText) eventTexts.push(arrivalText);
    generateEventTexts(events, eventTexts);

    // Generate incoming phone messages (consumes RNG)
    const msgArrived = ctx.content.generateIncomingMessages();
    if (msgArrived && !ctx.state.get('phone_silent') && !ctx.state.get('viewing_phone')) {
      eventTexts.push('Your phone buzzes.');
    }

    // Record training example with source tag and retrain periodically
    const moveSource = ctx.habits.addExample(habitFeatures, 'move:' + destId, nextActionSource || undefined);
    nextActionSource = null;
    if (ctx.habits.shouldRetrain()) ctx.habits.train();

    // Routine sentiment — habitual movement patterns (same route at same time) also accumulate comfort.
    if (moveSource === 'player') {
      const conf = ctx.habits.getConfidence('move:' + destId);
      if (conf >= 0.6) {
        ctx.state.adjustSentiment('routine', 'comfort', 0.003);
      }
    }

    // Apply focus triggers
    applyMoveFocusTriggers(travel.to);
    applyFocusTriggers(events, null);
    ctx.ui.updateAwareness();

    if (transText && transText.trim()) {
      // Show transition, then location + auto-advance check
      ctx.ui.showPassage(transText);

      setTimeout(() => {
        // Explicit render steps (not ctx.ui.render()) so we can check auto-advance
        const location = ctx.world.getLocationId();
        const descFn = /** @type {Record<string, (() => string) | undefined>} */ (ctx.content.locationDescriptions)[location];
        ctx.ui.showPassage(descFn ? descFn() : '');

        checkRoutineDisruption();
        const interactions = ctx.content.getAvailableInteractions();
        const connections = ctx.world.getConnections();
        const allIds = [
          ...interactions.map(i => i.id),
          ...connections.map(c => 'move:' + c.id),
        ];
        const prediction = ctx.habits.predictHabit(allIds);
        ctx.ui.showActions(interactions, prediction);
        ctx.ui.showMovement(connections, prediction);
        ctx.ui.updateAwareness();

        tryAutoAdvance(prediction, interactions, connections);

        if (eventTexts.length > 0) {
          let delay = 1000;
          for (const text of eventTexts) {
            const t = text;
            setTimeout(() => ctx.ui.appendEventText(t), delay);
            delay += 1200;
          }
        }
      }, 1500);
    } else {
      // No transition text — render location + auto-advance check
      const location = ctx.world.getLocationId();
      const descFn = /** @type {Record<string, (() => string) | undefined>} */ (ctx.content.locationDescriptions)[location];
      ctx.ui.showPassage(descFn ? descFn() : '');

      checkRoutineDisruption();
      const interactions = ctx.content.getAvailableInteractions();
      const connections = ctx.world.getConnections();
      const allIds = [
        ...interactions.map(i => i.id),
        ...connections.map(c => 'move:' + c.id),
      ];
      const prediction = ctx.habits.predictHabit(allIds);
      ctx.ui.showActions(interactions, prediction);
      ctx.ui.showMovement(connections, prediction);
      ctx.ui.updateAwareness();

      tryAutoAdvance(prediction, interactions, connections);

      if (eventTexts.length > 0) {
        let delay = 800;
        for (const text of eventTexts) {
          const t = text;
          setTimeout(() => ctx.ui.appendEventText(t), delay);
          delay += 1200;
        }
      }
    }
  }

  function handleIdle() {
    if (isReplaying) return;

    // Record idle as an action so RNG consumption is replayable
    ctx.timeline.recordAction({ type: 'idle' });

    // RNG order must match replayIdle() exactly:
    // 1. idleThoughts() — always (1 RNG)
    // 2. innerVoiceThoughts() — only when ivTier !== null (1 RNG, conditional)
    // 3. ctx.senses.sense() — N×4 RNG if observations available (N=2 calm/flat/dissociated,
    //                     N=3 anxious/overwhelmed); 0 if no sources surface
    // 4. advanceTime(randomInt(2,5)) — always (1 RNG)
    const thought = ctx.content.idleThoughts();
    const ivTier = ctx.state.innerVoiceTier();
    const voice = ivTier ? ctx.content.innerVoiceThoughts() : null;
    const sensory = ctx.senses.sense(); // always call; RNG consumed only if pool > 1

    // Tremor: inner voice drowns out the narration
    if (thought && ivTier !== 'tremor') {
      ctx.ui.appendEventText(thought);
    }
    if (voice && ivTier) {
      const delay = ivTier === 'tremor' ? 0 : 800;
      setTimeout(() => ctx.ui.appendInnerVoice(voice, ivTier), delay);
    }
    // Display sensory text if cooldown allows
    if (sensory && ctx.senses.canDisplay()) {
      setTimeout(() => ctx.ui.appendEventText(sensory), 1200);
      ctx.senses.markDisplayed();
    }

    ctx.state.advanceTime(ctx.timeline.randomInt(2, 5));

    ctx.ui.updateAwareness();
  }

  return { init };
}

