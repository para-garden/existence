// habits.js — behavioral momentum from observed play
// The character develops habits. The player interrupts.
// CART decision trees learn action patterns from features.
// No RNG consumed — pure state reads + ML.

export function createHabits(ctx) {

  // --- Feature schema ---
  // Declares whether each feature is continuous or categorical.
  // Continuous: split on midpoint thresholds between sorted unique values.
  // Categorical: split on "is this value?" binary tests.

  const CONTINUOUS = 'continuous';
  const CATEGORICAL = 'categorical';

  /** @type {Record<string, string>} */
  const featureSchema = {
    energy: CONTINUOUS,
    stress: CONTINUOUS,
    hunger: CONTINUOUS,
    social: CONTINUOUS,
    social_energy: CONTINUOUS,
    serotonin: CONTINUOUS,
    dopamine: CONTINUOUS,
    norepinephrine: CONTINUOUS,
    gaba: CONTINUOUS,
    adenosine: CONTINUOUS,
    cortisol: CONTINUOUS,
    energy_tier: CATEGORICAL,
    stress_tier: CATEGORICAL,
    mood_tone: CATEGORICAL,
    time_period: CATEGORICAL,
    hour: CONTINUOUS,
    location: CATEGORICAL,
    dressed: CATEGORICAL,
    hygiene_level: CONTINUOUS,
    stomach_fullness: CONTINUOUS,
    at_work_today: CATEGORICAL,   // derived from event log
    called_in: CATEGORICAL,       // derived from event log
    weather: CATEGORICAL,
    fridge_food: CONTINUOUS,
    phone_battery: CONTINUOUS,
    viewing_phone: CATEGORICAL,
    work_dread: CONTINUOUS,
    work_satisfaction: CONTINUOUS,
    routine_comfort: CONTINUOUS,
    routine_irritation: CONTINUOUS,
    money: CONTINUOUS,
    money_tier: CATEGORICAL,
    has_unread: CATEGORICAL,
    time_since_wake: CONTINUOUS,
    last_action: CATEGORICAL,
    pantry_total: CONTINUOUS,
    snacks: CONTINUOUS,
    has_peanut_butter: CATEGORICAL,
    cooking_skill: CONTINUOUS,
  };

  const featureNames = Object.keys(featureSchema);

  // --- Training data ---

  // Source weighting: actions the player chose independently are full weight.
  // Actions that matched a visible suggestion are downweighted — the player
  // *might* have chosen them anyway, but the suggestion biases the evidence.
  // Without this, the system trains on its own suggestions and snowballs
  // into manufacturing the predictability it's trying to detect.
  const SOURCE_WEIGHT = {
    player: 1.0,     // player chose from undifferentiated list
    suggested: 0.5,  // player confirmed a visible suggestion
    auto: 0.1,       // auto-advance fired and player didn't interrupt
  };

  const AUTO_THRESHOLD = 0.75;

  /** @type {{ features: Record<string, number|string|boolean>, action: string, time: number, source: string }[]} */
  let trainingData = [];

  /** @type {Record<string, any>} */
  let trees = {};

  /** @type {Record<string, number>} */
  let lastTimeFor = {};

  /** @type {number} */
  let lastWakeTime = 0;

  /** @type {string} */
  let lastActionId = '';

  /** @type {number} */
  let examplesSinceTrain = 0;

  /** @type {string | null} */
  let lastPredictionId = null;

  // --- Feature extraction ---

  /** @returns {Record<string, number|string|boolean>} */
  function extractFeatures() {
    const features = {
      energy: ctx.state.get('energy'),
      stress: ctx.state.get('stress'),
      hunger: ctx.state.get('hunger'),
      social: ctx.state.get('social'),
      social_energy: ctx.state.get('social_energy'),
      serotonin: ctx.state.get('serotonin'),
      dopamine: ctx.state.get('dopamine'),
      norepinephrine: ctx.state.get('norepinephrine'),
      gaba: ctx.state.get('gaba'),
      adenosine: ctx.state.get('adenosine'),
      cortisol: ctx.state.get('cortisol'),
      energy_tier: ctx.state.energyTier(),
      stress_tier: ctx.state.stressTier(),
      mood_tone: ctx.state.moodTone(),
      time_period: ctx.state.timePeriod(),
      hour: ctx.state.getHour(),
      location: ctx.world.getLocationId(),
      dressed: ctx.state.get('dressed'),
      hygiene_level: ctx.state.get('hygiene_level'),
      stomach_fullness: ctx.state.get('stomach_fullness'),
      at_work_today: ctx.events.any('arrived_at_work', ctx.state.get('wake_period_start')),
      called_in: ctx.events.any('called_in_sick', ctx.state.get('wake_period_start')),
      weather: ctx.state.get('weather'),
      fridge_food: ctx.state.get('fridge_food'),
      phone_battery: ctx.state.get('phone_battery'),
      viewing_phone: ctx.state.get('viewing_phone'),
      work_dread: ctx.state.sentimentIntensity('work', 'dread'),
      work_satisfaction: ctx.state.sentimentIntensity('work', 'satisfaction'),
      routine_comfort: ctx.state.sentimentIntensity('routine', 'comfort'),
      routine_irritation: ctx.state.sentimentIntensity('routine', 'irritation'),
      money: ctx.state.get('money'),
      money_tier: ctx.state.moneyTier(),
      has_unread: ctx.state.hasUnreadMessages(),
      time_since_wake: lastWakeTime > 0 ? (ctx.state.get('time') - lastWakeTime) : 99999,
      last_action: lastActionId || 'none',
      pantry_total: ctx.state.pantryTotal(),
      snacks: ctx.state.get('pantry')?.snacks || 0,
      has_peanut_butter: (ctx.state.get('pantry')?.peanut_butter || 0) > 0 || (ctx.state.get('peanut_butter_uses') || 0) > 0,
      cooking_skill: ctx.state.get('cooking_skill') || 30,
    };
    return features;
  }

  // --- Training data collection ---

  /**
   * Record a training example: features snapshot + chosen action.
   * Source is determined automatically unless overridden: if the action
   * matches the last visible prediction, it's 'suggested' (downweighted).
   * Otherwise it's 'player' (full weight). Pass 'auto' explicitly for
   * auto-advance actions.
   * @param {Record<string, number|string|boolean>} features
   * @param {string} actionId
   * @param {string} [sourceOverride]
   * @returns {string} resolved source ('player' | 'suggested' | 'auto')
   */
  function addExample(features, actionId, sourceOverride) {
    const time = ctx.state.get('time');
    const source = sourceOverride || ((lastPredictionId && actionId === lastPredictionId) ? 'suggested' : 'player');
    trainingData.push({ features, action: actionId, time, source });
    lastTimeFor[actionId] = time;
    lastActionId = actionId;
    lastPredictionId = null; // consumed — next action starts clean
    examplesSinceTrain++;
    return source;
  }

  /**
   * Update wake time tracking. Called when wakeUp happens.
   */
  function noteWake() {
    lastWakeTime = ctx.state.get('time');
  }

  /** @returns {boolean} */
  function shouldRetrain() {
    return examplesSinceTrain >= 10;
  }

  // --- CART Decision Tree ---

  /**
   * Compute Gini impurity for a set of labels.
   * @param {boolean[]} labels
   * @param {number[]} weights
   * @returns {number}
   */
  function gini(labels, weights) {
    let totalWeight = 0;
    let positiveWeight = 0;
    for (let i = 0; i < labels.length; i++) {
      totalWeight += weights[i];
      if (labels[i]) positiveWeight += weights[i];
    }
    if (totalWeight === 0) return 0;
    const p = positiveWeight / totalWeight;
    return 2 * p * (1 - p);
  }

  /**
   * Find the best split across all features.
   * @param {Record<string, number|string|boolean>[]} data
   * @param {boolean[]} labels
   * @param {number[]} weights
   * @returns {{ feature: string, threshold: number|null, category: string|boolean|null, gain: number } | null}
   */
  function findBestSplit(data, labels, weights) {
    const parentGini = gini(labels, weights);
    let bestGain = 0;
    /** @type {{ feature: string, threshold: number|null, category: string|boolean|null, gain: number } | null} */
    let bestSplit = null;

    let totalWeight = 0;
    for (const w of weights) totalWeight += w;
    if (totalWeight === 0) return null;

    for (const feature of featureNames) {
      const type = featureSchema[feature];

      if (type === CONTINUOUS) {
        // Collect unique sorted values
        /** @type {number[]} */
        const vals = [];
        for (const row of data) {
          const v = /** @type {number} */ (row[feature]);
          if (typeof v === 'number') vals.push(v);
        }
        vals.sort((a, b) => a - b);
        // Deduplicate
        const unique = [];
        for (let i = 0; i < vals.length; i++) {
          if (i === 0 || vals[i] !== vals[i - 1]) unique.push(vals[i]);
        }
        if (unique.length < 2) continue;

        // Try midpoint thresholds
        for (let i = 0; i < unique.length - 1; i++) {
          const threshold = (unique[i] + unique[i + 1]) / 2;

          let leftWeight = 0, leftPositive = 0, leftCount = 0;
          let rightWeight = 0, rightPositive = 0, rightCount = 0;

          for (let j = 0; j < data.length; j++) {
            const v = /** @type {number} */ (data[j][feature]);
            if (v <= threshold) {
              leftWeight += weights[j];
              if (labels[j]) leftPositive += weights[j];
              leftCount++;
            } else {
              rightWeight += weights[j];
              if (labels[j]) rightPositive += weights[j];
              rightCount++;
            }
          }

          if (leftCount === 0 || rightCount === 0) continue;

          const leftP = leftWeight > 0 ? leftPositive / leftWeight : 0;
          const rightP = rightWeight > 0 ? rightPositive / rightWeight : 0;
          const leftGini = 2 * leftP * (1 - leftP);
          const rightGini = 2 * rightP * (1 - rightP);
          const weightedGini = (leftWeight * leftGini + rightWeight * rightGini) / totalWeight;
          const gain = parentGini - weightedGini;

          if (gain > bestGain) {
            bestGain = gain;
            bestSplit = { feature, threshold, category: null, gain };
          }
        }
      } else {
        // Categorical: try each unique value
        /** @type {Set<string|boolean>} */
        const categories = new Set();
        for (const row of data) {
          categories.add(/** @type {string|boolean} */ (row[feature]));
        }
        if (categories.size < 2) continue;

        for (const cat of categories) {
          let leftWeight = 0, leftPositive = 0, leftCount = 0;
          let rightWeight = 0, rightPositive = 0, rightCount = 0;

          for (let j = 0; j < data.length; j++) {
            if (data[j][feature] === cat) {
              leftWeight += weights[j];
              if (labels[j]) leftPositive += weights[j];
              leftCount++;
            } else {
              rightWeight += weights[j];
              if (labels[j]) rightPositive += weights[j];
              rightCount++;
            }
          }

          if (leftCount === 0 || rightCount === 0) continue;

          const leftP = leftWeight > 0 ? leftPositive / leftWeight : 0;
          const rightP = rightWeight > 0 ? rightPositive / rightWeight : 0;
          const leftGini = 2 * leftP * (1 - leftP);
          const rightGini = 2 * rightP * (1 - rightP);
          const weightedGini = (leftWeight * leftGini + rightWeight * rightGini) / totalWeight;
          const gain = parentGini - weightedGini;

          if (gain > bestGain) {
            bestGain = gain;
            bestSplit = { feature, threshold: null, category: cat, gain };
          }
        }
      }
    }

    return bestSplit;
  }

  /**
   * Build a binary CART decision tree.
   * @param {Record<string, number|string|boolean>[]} data
   * @param {boolean[]} labels
   * @param {number[]} weights
   * @param {number} depth
   * @param {number} maxDepth
   * @param {number} minSamples
   * @param {string[]} path
   * @returns {any}
   */
  function buildTree(data, labels, weights, depth, maxDepth, minSamples, path) {
    // Count positive/negative
    let posWeight = 0, negWeight = 0, totalWeight = 0;
    for (let i = 0; i < labels.length; i++) {
      totalWeight += weights[i];
      if (labels[i]) posWeight += weights[i];
      else negWeight += weights[i];
    }

    const probability = totalWeight > 0 ? posWeight / totalWeight : 0;

    // Leaf conditions
    if (depth >= maxDepth || data.length < minSamples || posWeight === 0 || negWeight === 0) {
      return { leaf: true, prediction: probability >= 0.5, probability, count: data.length, path };
    }

    const split = findBestSplit(data, labels, weights);
    if (!split || split.gain < 0.001) {
      return { leaf: true, prediction: probability >= 0.5, probability, count: data.length, path };
    }

    // Partition data
    const leftData = [], leftLabels = [], leftWeights = [];
    const rightData = [], rightLabels = [], rightWeights = [];

    for (let i = 0; i < data.length; i++) {
      let goLeft;
      if (split.threshold !== null) {
        goLeft = /** @type {number} */ (data[i][split.feature]) <= split.threshold;
      } else {
        goLeft = data[i][split.feature] === split.category;
      }

      if (goLeft) {
        leftData.push(data[i]);
        leftLabels.push(labels[i]);
        leftWeights.push(weights[i]);
      } else {
        rightData.push(data[i]);
        rightLabels.push(labels[i]);
        rightWeights.push(weights[i]);
      }
    }

    // Build description for path tracking
    let desc;
    if (split.threshold !== null) {
      desc = split.feature + '<=' + split.threshold.toFixed(1);
    } else {
      desc = split.feature + '=' + String(split.category);
    }

    return {
      leaf: false,
      feature: split.feature,
      threshold: split.threshold,
      category: split.category,
      left: buildTree(leftData, leftLabels, leftWeights, depth + 1, maxDepth, minSamples, [...path, desc]),
      right: buildTree(rightData, rightLabels, rightWeights, depth + 1, maxDepth, minSamples, [...path, '!' + desc]),
    };
  }

  /**
   * Predict using a trained tree.
   * @param {any} tree
   * @param {Record<string, number|string|boolean>} features
   * @returns {{ prediction: boolean, probability: number, path: string[] }}
   */
  function predict(tree, features) {
    if (tree.leaf) {
      return { prediction: tree.prediction, probability: tree.probability, path: tree.path };
    }

    let goLeft;
    if (tree.threshold !== null) {
      goLeft = /** @type {number} */ (features[tree.feature]) <= tree.threshold;
    } else {
      goLeft = features[tree.feature] === tree.category;
    }

    return predict(goLeft ? tree.left : tree.right, features);
  }

  // --- Training ---

  /**
   * Train one-vs-rest binary trees for each action in the training data.
   * Applies recency weighting — recent examples count more.
   */
  function train() {
    if (trainingData.length < 20) {
      trees = {};
      return;
    }

    // Compute weights: recency (exponential decay) * source (player vs suggested)
    // Recency: half-life ~7 in-game days
    // Source: actions matching a visible suggestion are downweighted to prevent
    // the system from training on its own predictions and snowballing
    const halfLifeMinutes = 7 * 1440;
    const latestTime = trainingData[trainingData.length - 1].time;
    const weights = trainingData.map(ex => {
      const age = latestTime - ex.time;
      const recency = Math.pow(2, -age / halfLifeMinutes);
      const sourceW = SOURCE_WEIGHT[ex.source] ?? 1.0;
      return recency * sourceW;
    });

    // Count per-action occurrences
    /** @type {Record<string, number>} */
    const actionCounts = {};
    for (const ex of trainingData) {
      actionCounts[ex.action] = (actionCounts[ex.action] || 0) + 1;
    }

    const newTrees = {};
    const data = trainingData.map(ex => ex.features);

    for (const [actionId, count] of Object.entries(actionCounts)) {
      if (count < 3) continue; // not enough positive examples

      const labels = trainingData.map(ex => ex.action === actionId);
      newTrees[actionId] = buildTree(data, labels, weights, 0, 5, 3, []);
    }

    trees = newTrees;
    examplesSinceTrain = 0;
  }

  // --- Prediction ---

  /**
   * Predict the most likely habitual action from available actions.
   * @param {string[]} availableActionIds
   * @returns {{ actionId: string, strength: number, tier: 'auto' | 'suggested', path: string[] } | null}
   */
  function predictHabit(availableActionIds) {
    if (Object.keys(trees).length === 0) return null;
    if (availableActionIds.length === 0) return null;

    const features = extractFeatures();

    // Routine sentiment modulates thresholds
    const routineComfort = ctx.state.sentimentIntensity('routine', 'comfort');
    const routineIrritation = ctx.state.sentimentIntensity('routine', 'irritation');
    // Comfort lowers threshold (habits form easier), irritation raises it
    const thresholdAdjust = -routineComfort * 0.1 + routineIrritation * 0.1;
    // Base 0.6 (not 0.5) — a weak habit shouldn't look like a habit.
    // Borderline predictions stay quiet. Only clear patterns surface.
    const mediumThreshold = 0.6 + thresholdAdjust;

    /** @type {{ actionId: string, probability: number, path: string[] }[]} */
    const candidates = [];

    for (const actionId of availableActionIds) {
      const tree = trees[actionId];
      if (!tree) continue;

      const result = predict(tree, features);
      if (result.probability >= mediumThreshold) {
        candidates.push({ actionId, probability: result.probability, path: result.path });
      }
    }

    if (candidates.length === 0) {
      lastPredictionId = null;
      return null;
    }

    // Sort by probability descending
    candidates.sort((a, b) => b.probability - a.probability);

    // Check for competing habits — if top two are close, no suggestion
    if (candidates.length >= 2) {
      const gap = candidates[0].probability - candidates[1].probability;
      if (gap < 0.1) {
        lastPredictionId = null;
        return null; // competing habits
      }
    }

    const best = candidates[0];
    // Record what we predicted so addExample can detect suggestion-following
    lastPredictionId = best.actionId;
    const autoThreshold = AUTO_THRESHOLD + thresholdAdjust;
    return {
      actionId: best.actionId,
      strength: best.probability,
      tier: best.probability >= autoThreshold ? 'auto' : 'suggested',
      path: best.path,
    };
  }

  /**
   * Return the habit confidence score for a specific action given current features.
   * Returns 0 if no tree exists for this action (not enough history).
   * Used by game.js to detect whether a just-executed player action was habitual,
   * so routine sentiment can accumulate when the player enacts their own patterns.
   * @param {string} actionId
   * @returns {number} probability in [0,1]
   */
  function getConfidence(actionId) {
    const tree = trees[actionId];
    if (!tree) return 0;
    const features = extractFeatures();
    const result = predict(tree, features);
    return result.probability;
  }

  /**
   * Return the decision path for an action — the list of feature conditions traversed to reach
   * the current prediction. Each entry is a string like "hunger<=45.0" (went left = feature low)
   * or "!hunger<=45.0" (went right = feature high). The first item is the most discriminating
   * feature for the current prediction. Used by approachingProse to hint at motivation.
   * @param {string} actionId
   * @returns {string[]}
   */
  function getDecisionPath(actionId) {
    const tree = trees[actionId];
    if (!tree) return [];
    const features = extractFeatures();
    return predict(tree, features).path;
  }

  /**
   * Return action IDs where the current-state confidence meets or exceeds threshold.
   * Considers all trained trees, not just actions in the available set.
   * No RNG consumed — pure read.
   * @param {number} [threshold]
   * @returns {string[]}
   */
  function getHighConfidenceActions(threshold = 0.65) {
    if (Object.keys(trees).length === 0) return [];
    const features = extractFeatures();
    const result = [];
    for (const [actionId, tree] of Object.entries(trees)) {
      const { probability } = predict(tree, features);
      if (probability >= threshold) result.push(actionId);
    }
    return result;
  }

  /**
   * Detect ADHD hyperfocus: actionId appears 3+ times in the last 60 game-minutes.
   * Uses the action log's timestamp field (State.get('time') in game-minutes).
   * Pure read — no side effects, no RNG consumed.
   * Approximation debt (ADHD hyperfocus): "current interest" is measured as action-streak
   * frequency within a 60-min window. The real phenomenon is attentional lock that persists
   * beyond the triggering task — a proper model would track interest domain, not just recurrence.
   * @param {string} actionId
   * @param {{ action: { type: string; id?: string; destination?: string }, timestamp?: number }[]} actionLog
   * @param {number} currentTime — State.get('time'), in game-minutes
   * @returns {boolean}
   */
  function isHyperfocusing(actionId, actionLog, currentTime) {
    const window = 60; // game-minutes
    const cutoff = currentTime - window;

    let count = 0;
    for (let i = actionLog.length - 1; i >= 0; i--) {
      const entry = actionLog[i];
      if (entry.timestamp === undefined || entry.timestamp === null) continue; // legacy entries
      if (entry.timestamp < cutoff) break;
      // Match direct interaction ID or move action
      const entryId = entry.action.type === 'move'
        ? 'move:' + entry.action.destination
        : entry.action.id;
      if (entryId === actionId) count++;
      if (count >= 3) return true;
    }
    return false;
  }

  /**
   * Reset all habit data. Called on new game.
   */
  function reset() {
    trainingData = [];
    trees = {};
    lastTimeFor = {};
    lastWakeTime = 0;
    lastActionId = '';
    examplesSinceTrain = 0;
    lastPredictionId = null;
  }

  return {
    extractFeatures,
    addExample,
    noteWake,
    shouldRetrain,
    train,
    predictHabit,
    getConfidence,
    getDecisionPath,
    getHighConfidenceActions,
    isHyperfocusing,
    reset,
  };
}

