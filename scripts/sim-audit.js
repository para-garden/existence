#!/usr/bin/env bun
// sim-audit.js — Living simulation diagnostic
// Extracts the simulation coupling graph via static analysis and runs pathology detection.
// Usage: bun scripts/sim-audit.js
// Outputs: sim-graph.json (queryable graph) + text report to stdout.
// Exit 0 always (diagnostic, not CI gate).

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function readFile(relPath) {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

// ============================================================
// EXTRACTION LAYER
// ============================================================

function extractStateVars(stateSource) {
  const vars = {};

  // Extract from defaults() function body
  const defaultsMatch = stateSource.match(/function defaults\(\)\s*\{[\s\S]*?^  \}/m);
  if (!defaultsMatch) {
    console.error('WARNING: Could not find defaults() in state.js');
    return vars;
  }
  const defaultsBody = defaultsMatch[0];

  // Match property definitions: name: value (with optional jsdoc type casts)
  // Handles: simple values, arrays, objects, template expressions
  const propRe = /^\s+(\w+):\s*(?:\/\*\*[^*]*\*\/\s*\(?)?([\s\S]*?)(?:\)?),?\s*(?:\/\/.*)?$/gm;
  let m;
  while ((m = propRe.exec(defaultsBody)) !== null) {
    const name = m[1];
    const rawVal = m[2].trim();

    // Determine type and default
    let type = 'unknown';
    let defaultVal = rawVal;
    if (rawVal === 'true' || rawVal === 'false') type = 'boolean';
    else if (rawVal === 'null') type = 'nullable';
    else if (/^-?\d+(\.\d+)?$/.test(rawVal)) type = 'number';
    else if (rawVal.startsWith("'") || rawVal.startsWith('"')) type = 'string';
    else if (rawVal.startsWith('[') || rawVal === '([])') type = 'array';
    else if (rawVal.startsWith('{') || rawVal === '({})') type = 'object';

    // Categorize
    let category = 'misc';
    if (['serotonin', 'dopamine', 'norepinephrine', 'gaba', 'glutamate', 'endorphin',
         'acetylcholine', 'endocannabinoid', 'histamine'].includes(name)) category = 'neurotransmitter';
    else if (['cortisol', 'cortisol_gi_slow', 'melatonin', 'adenosine'].includes(name)) category = 'neuromodulator';
    else if (['testosterone', 'dht', 'estradiol', 'progesterone', 'allopregnanolone',
              'lh', 'fsh', 'oxytocin', 'prolactin'].includes(name)) category = 'hormone';
    else if (['thyroid', 'insulin', 'leptin', 'ghrelin', 'hormonal_satiation',
              'dhea', 'hcg', 'calcitriol'].includes(name)) category = 'metabolic_hormone';
    else if (['energy', 'hunger', 'thirst', 'stomach_fullness', 'stomach_liquid_fraction',
              'pending_hydration', 'bladder_fill', 'nausea'].includes(name)) category = 'physiology';
    else if (['stress', 'social', 'social_energy', 'connection_depth'].includes(name)) category = 'psychosocial';
    else if (['money', 'hourly_rate', 'rent_amount', 'ebt_balance', 'ebt_monthly_amount'].includes(name)) category = 'financial';
    else if (['caffeine_level', 'caffeine_habit', 'caffeine_today_peak',
              'nicotine_level', 'nicotine_habit', 'nicotine_today_peak',
              'alcohol_level', 'alcohol_tolerance', 'alcohol_sleep_flag',
              'cannabis_level', 'cannabis_tolerance', 'cannabis_sleep_flag'].includes(name)) category = 'substance';
    else if (name.startsWith('serotonin_baseline') || name.startsWith('dopamine_baseline') ||
             name.startsWith('norepinephrine_baseline') || name.startsWith('gaba_baseline')) category = 'nt_baseline';
    else if (['neuroticism', 'self_esteem', 'rumination', 'trait_loneliness',
              'introversion', 'sensory_sensitivity'].includes(name)) category = 'personality';
    else if (name.includes('phone') || name.includes('viewing_') || name.includes('notes') ||
             name.includes('timer_')) category = 'phone';
    else if (name.includes('job') || name.includes('work') || name.includes('labor') ||
             name.includes('gig_') || name.includes('shift')) category = 'work';
    else if (name.includes('sleep') || name.includes('wake_') || name.includes('daylight') ||
             name === 'is_sleeping' || name === 'rem_rebound_pending') category = 'sleep';
    else if (name.includes('location') || name === 'previous_location' || name === 'weather' ||
             name === 'rain' || name === 'latitude') category = 'world';

    vars[name] = { default: defaultVal, type, category, tau: null, hasTier: false, tierLabels: [] };
  }

  return vars;
}

function extractNtRates(stateSource) {
  const systems = {};
  const ratesMatch = stateSource.match(/const ntRates\s*=\s*\{([\s\S]*?)\};/);
  if (!ratesMatch) return systems;

  const ratesBody = ratesMatch[1];
  const lineRe = /(\w+):\s*\[([0-9.]+),\s*([0-9.]+)\]/g;
  let m;
  while ((m = lineRe.exec(ratesBody)) !== null) {
    systems[m[1]] = {
      upRate: parseFloat(m[2]),
      downRate: parseFloat(m[3]),
      targetInputs: [],
      sentimentInputs: [],
    };
  }
  return systems;
}

function extractTargetFunctions(stateSource, ntSystems) {
  // For each xxxTarget() function, extract state variable reads
  const targetFnRe = /function (\w+)Target\(\)\s*\{([\s\S]*?)(?=\n  function |\n  \/\/ ---|\n  const ntRates)/g;
  let m;
  while ((m = targetFnRe.exec(stateSource)) !== null) {
    const ntName = m[1];
    const body = m[2];
    if (!ntSystems[ntName]) continue;

    // Extract s.xxx reads
    const sReads = new Set();
    const sReadRe = /s\.(\w+)/g;
    let sr;
    while ((sr = sReadRe.exec(body)) !== null) {
      sReads.add(sr[1]);
    }

    // Extract sentimentIntensity calls
    const sentimentInputs = [];
    const sentRe = /sentimentIntensity\('([^']+)',\s*'([^']+)'\)/g;
    let ss;
    while ((ss = sentRe.exec(body)) !== null) {
      sentimentInputs.push({ target: ss[1], quality: ss[2] });
    }

    // Extract function calls (tier functions used as inputs)
    const fnCallRe = /(\w+Tier|moneyTier|cyclePhaseTier|timeOfDay|isDaytime|isWorkHours|ambientTemperature)\(\)/g;
    let fc;
    while ((fc = fnCallRe.exec(body)) !== null) {
      sReads.add(`[fn:${fc[1]}]`);
    }

    ntSystems[ntName].targetInputs = [...sReads];
    ntSystems[ntName].sentimentInputs = sentimentInputs;
  }

  // Also record which target functions are defined (for registration check).
  // Store both the raw camelCase prefix and the fn name → registered key mapping.
  // Convention: ntTargetFns uses snake_case keys; function names use camelCase prefix.
  // To compare, extract both the function-name prefix AND the value name (registered fn name).
  // e.g., `substance_p: substancePTarget` → registered key 'substance_p', fn name 'substanceP'
  const allDefined = new Set(); // camelCase prefixes: 'substanceP', 'serotonin', etc.
  const defRe = /function (\w+)Target\(\)/g;
  let dm;
  while ((dm = defRe.exec(stateSource)) !== null) {
    if (dm[1] !== 'placeholder') allDefined.add(dm[1]);
  }

  // Record registered: key → fnPrefix pairs from ntTargetFns map
  const allRegistered = new Set(); // fn name prefixes referenced in ntTargetFns values
  const registeredKeys = new Set(); // snake_case keys
  const regMatch = stateSource.match(/const ntTargetFns\s*=\s*\{([\s\S]*?)\};/);
  if (regMatch) {
    // Match: key: fnNameTarget
    const regRe = /(\w+):\s*(\w+)Target/g;
    let rm;
    while ((rm = regRe.exec(regMatch[1])) !== null) {
      registeredKeys.add(rm[1]);   // snake_case key (e.g. 'substance_p')
      allRegistered.add(rm[2]);    // camelCase fn prefix (e.g. 'substanceP')
    }
  }

  return { allDefined, allRegistered, registeredKeys };
}

/**
 * Count how many times each state var is read as s.varName inside state.js target function bodies.
 * Returns a map: varName → count.
 */
function extractStateInternalReads(stateSource) {
  const counts = {};

  // Extract all target function bodies
  const targetFnRe = /function (\w+)Target\(\)\s*\{([\s\S]*?)(?=\n  function |\n  \/\/ ---|\n  const ntRates)/g;
  let m;
  while ((m = targetFnRe.exec(stateSource)) !== null) {
    const body = m[2];
    const sReadRe = /s\.(\w+)/g;
    let sr;
    while ((sr = sReadRe.exec(body)) !== null) {
      counts[sr[1]] = (counts[sr[1]] || 0) + 1;
    }
  }

  // Also scan advanceTime body for s.xxx reads (tick-level internal coupling)
  const advanceMatch = stateSource.match(/function advanceTime\(minutes\)\s*\{([\s\S]*?)(?=\n  \/\/ --- (?:Target|NT drift)|\n  function (?!advanceTime))/);
  if (advanceMatch) {
    const body = advanceMatch[1];
    const sReadRe = /s\.(\w+)/g;
    let sr;
    while ((sr = sReadRe.exec(body)) !== null) {
      counts[sr[1]] = (counts[sr[1]] || 0) + 1;
    }
  }

  return counts;
}

function extractTierFunctions(stateSource, stateVars) {
  const tiers = {};

  // Pattern: function xxxTier() { return tier(s.varName, [ [threshold, 'label'], ... ]) }
  const tierFnRe = /function (\w+Tier)\(\)\s*\{[\s\S]*?return tier\(s\.(\w+),\s*\[([\s\S]*?)\]\)/g;
  let m;
  while ((m = tierFnRe.exec(stateSource)) !== null) {
    const fnName = m[1];
    const readsVar = m[2];
    const thresholdBody = m[3];

    const labels = [];
    const thresholds = [];
    const labelRe = /\[([0-9.]+),\s*'(\w+)'\]/g;
    let lm;
    while ((lm = labelRe.exec(thresholdBody)) !== null) {
      thresholds.push(parseFloat(lm[1]));
      labels.push(lm[2]);
    }

    tiers[fnName] = { readsVar, labels, thresholds };
    if (stateVars[readsVar]) {
      stateVars[readsVar].hasTier = true;
      stateVars[readsVar].tierLabels = labels;
    }
  }

  // Also catch composite tier functions that don't use the simple tier() pattern
  // e.g. appearanceAwareness, messTier, innerVoiceTier, lateTier
  const complexTierRe = /function (\w+(?:Tier|Awareness))\(\)\s*\{([\s\S]*?)(?=\n  function )/g;
  while ((m = complexTierRe.exec(stateSource)) !== null) {
    const fnName = m[1];
    if (tiers[fnName]) continue; // already extracted
    const body = m[2];
    // Extract labels from string returns
    const returnLabels = [];
    const retRe = /return '(\w+)'/g;
    let rl;
    while ((rl = retRe.exec(body)) !== null) {
      if (!returnLabels.includes(rl[1])) returnLabels.push(rl[1]);
    }
    // Extract s.xxx reads
    const reads = new Set();
    const sReadRe = /s\.(\w+)/g;
    let sr;
    while ((sr = sReadRe.exec(body)) !== null) reads.add(sr[1]);

    if (returnLabels.length > 0) {
      tiers[fnName] = {
        readsVar: [...reads].join('+'),
        labels: returnLabels,
        thresholds: [],
      };
    }
  }

  return tiers;
}

function extractTimeConstants(stateSource) {
  const constants = [];

  // Pattern: exp(-t/τ) or exp(-minutes/τ) or exp(-hours*rate)
  const tauRe = /Math\.exp\(-(?:minutes|t|hours\s*\*\s*[\w.]+)\s*\/\s*([0-9.]+)\)/g;
  let m;
  while ((m = tauRe.exec(stateSource)) !== null) {
    constants.push({ type: 'tau', value: parseFloat(m[1]), unit: 'minutes', context: getLineContext(stateSource, m.index) });
  }

  // Pattern: exp(-LN2 / halflife * minutes) or pow(0.5, hours / halflife)
  const hlRe = /Math\.LN2\s*\/\s*([0-9.]+)\s*\*\s*minutes|Math\.pow\(0\.5,\s*hours\s*\/\s*([0-9.]+)\)/g;
  while ((m = hlRe.exec(stateSource)) !== null) {
    const hl = parseFloat(m[1] || m[2]);
    const unit = m[1] ? 'minutes' : 'hours';
    constants.push({ type: 'half_life', value: hl, unit, context: getLineContext(stateSource, m.index) });
  }

  // Pattern: exp(-hours * rate) where rate is a literal
  const rateRe = /Math\.exp\(-hours\s*\*\s*([0-9.]+)\)/g;
  while ((m = rateRe.exec(stateSource)) !== null) {
    constants.push({ type: 'decay_rate', value: parseFloat(m[1]), unit: 'per_hour', context: getLineContext(stateSource, m.index) });
  }

  return constants;
}

function getLineContext(source, index) {
  const before = source.substring(Math.max(0, index - 200), index);
  const lines = before.split('\n');
  return lines[lines.length - 1].trim().substring(0, 80);
}

function extractInteractions(contentSource) {
  const interactions = {};

  // Find the interactions object block
  const interactionsStart = contentSource.indexOf('const interactions = {');
  if (interactionsStart === -1) return interactions;

  // Find the end of the interactions block: the first '\n  };' after the block opens.
  // This prevents the last interaction's block from bleeding into subsequent functions.
  const interactionsEnd = contentSource.indexOf('\n  };', interactionsStart);
  const interactionsLimit = interactionsEnd !== -1 ? interactionsEnd : contentSource.length;

  // Extract individual interaction blocks by finding id: 'xxx' patterns
  // and then capturing the execute block to analyze reads/writes
  const idRe = /id:\s*'([^']+)'/g;
  const locationRe = /location:\s*(?:'([^']*)'|null)/;

  // Split into interaction blocks — find all id declarations within the interactions block
  let match;
  const ids = [];
  while ((match = idRe.exec(contentSource)) !== null) {
    if (match.index < interactionsStart) continue;
    if (match.index > interactionsLimit) break;
    ids.push({ id: match[1], index: match.index });
  }

  for (let i = 0; i < ids.length; i++) {
    const { id, index } = ids[i];
    const endIndex = i + 1 < ids.length ? ids[i + 1].index : interactionsLimit;
    const block = contentSource.substring(index, endIndex);

    // Location
    const locMatch = block.match(locationRe);
    const location = locMatch ? (locMatch[1] || null) : null;

    // State reads — ctx.state.get('xxx'), ctx.state.xxxTier(), ctx.state.lerp01, moodTone
    const reads = new Set();
    const getRe = /ctx\.state\.get\('(\w+)'\)/g;
    let rm;
    while ((rm = getRe.exec(block)) !== null) reads.add(rm[1]);
    const tierCallRe = /ctx\.state\.(\w+Tier)\(\)/g;
    while ((rm = tierCallRe.exec(block)) !== null) reads.add(`[tier:${rm[1]}]`);
    if (block.includes('moodTone')) reads.add('[fn:moodTone]');
    if (block.includes('sentimentIntensity')) {
      const siRe = /sentimentIntensity\('([^']+)',\s*'([^']+)'\)/g;
      while ((rm = siRe.exec(block)) !== null) reads.add(`[sentiment:${rm[1]}:${rm[2]}]`);
    }
    if (block.includes('lerp01')) {
      const lerpRe = /lerp01\((\w+)/g;
      while ((rm = lerpRe.exec(block)) !== null) reads.add(rm[1]);
    }
    if (block.includes('timePeriod')) reads.add('[fn:timePeriod]');
    if (block.includes('timeOfDay')) reads.add('[fn:timeOfDay]');

    // State writes — ctx.state.set('xxx', ...), ctx.state.adjustNT, adjustSentiment
    const writes = new Set();
    const setRe = /ctx\.state\.set\('(\w+)'/g;
    while ((rm = setRe.exec(block)) !== null) writes.add(rm[1]);

    const writesNT = new Set();
    const ntRe = /ctx\.state\.adjustNT\('(\w+)'/g;
    while ((rm = ntRe.exec(block)) !== null) writesNT.add(rm[1]);
    // Also catch adjustStress (modifies stress)
    if (block.includes('adjustStress')) writes.add('stress');

    const writesSentiment = [];
    const sentWRe = /ctx\.state\.adjustSentiment\('([^']+)',\s*'([^']+)'/g;
    while ((rm = sentWRe.exec(block)) !== null) {
      writesSentiment.push({ target: rm[1], quality: rm[2] });
    }

    // Time cost — advanceTime
    let advanceTime = null;
    const atRe = /advanceTime\((\d+)\)/;
    const atm = block.match(atRe);
    if (atm) advanceTime = parseInt(atm[1]);

    // RNG calls
    let rngCalls = 0;
    const rngRe = /ctx\.timeline\.(random|randomInt|chance|weightedPick)\(/g;
    while (rngRe.exec(block) !== null) rngCalls++;

    interactions[id] = {
      location,
      reads: [...reads],
      writes: [...writes],
      writesNT: [...writesNT],
      writesSentiment,
      advanceTime,
      rngCalls,
    };
  }

  return interactions;
}

function extractSReadsWrites(source, filename) {
  // Extract all s.xxx read and write patterns from state.js advanceTime and other functions
  const reads = new Set();
  const writes = new Set();

  // s.xxx on left side of assignment = write
  const writeRe = /s\.(\w+)\s*(?:=|\+=|-=|\*=)/g;
  let m;
  while ((m = writeRe.exec(source)) !== null) writes.add(m[1]);

  // s.xxx in expressions = read
  const readRe = /s\.(\w+)/g;
  while ((m = readRe.exec(source)) !== null) reads.add(m[1]);

  return { reads: [...reads], writes: [...writes], filename };
}

function extractCrossModuleReads(files) {
  const crossReads = {};
  for (const { path, name } of files) {
    let source;
    try { source = readFile(path); } catch { continue; }
    const reads = new Set();
    // ctx.state.get('xxx')
    const getRe = /ctx\.state\.get\('(\w+)'\)/g;
    let m;
    while ((m = getRe.exec(source)) !== null) reads.add(m[1]);
    // ctx.state.xxxTier()
    const tierRe = /ctx\.state\.(\w+Tier)\(\)/g;
    while ((m = tierRe.exec(source)) !== null) reads.add(`[tier:${m[1]}]`);
    // ctx.state.set('xxx'
    const setRe = /ctx\.state\.set\('(\w+)'/g;
    while ((m = setRe.exec(source)) !== null) reads.add(`[write:${m[1]}]`);
    if (reads.size > 0) crossReads[name] = [...reads];
  }
  return crossReads;
}

function buildEdges(ntSystems, interactions, stateSource) {
  const edges = [];

  // NT target coupling edges: stateVar → ntSystem
  for (const [nt, info] of Object.entries(ntSystems)) {
    for (const input of info.targetInputs) {
      if (input.startsWith('[fn:') || input.startsWith('[tier:')) {
        edges.push({ from: input, to: nt, via: `${nt}Target()`, type: 'target_input' });
      } else {
        edges.push({ from: input, to: nt, via: `${nt}Target()`, type: 'target_input' });
      }
    }
    for (const sent of info.sentimentInputs) {
      edges.push({ from: `sentiment:${sent.target}:${sent.quality}`, to: nt, via: `${nt}Target()`, type: 'sentiment_input' });
    }
  }

  // Interaction edges: interaction writes → stateVar
  for (const [id, info] of Object.entries(interactions)) {
    for (const w of info.writes) {
      edges.push({ from: `interaction:${id}`, to: w, via: 'set', type: 'interaction_write' });
    }
    for (const nt of info.writesNT) {
      edges.push({ from: `interaction:${id}`, to: nt, via: 'adjustNT', type: 'interaction_nt' });
    }
    for (const sent of info.writesSentiment) {
      edges.push({ from: `interaction:${id}`, to: `sentiment:${sent.target}:${sent.quality}`, via: 'adjustSentiment', type: 'interaction_sentiment' });
    }
  }

  // advanceTime edges: extract which vars are modified per tick,
  // AND which vars are read to compute those modifications (creates coupling edges)
  const advanceMatch = stateSource.match(/function advanceTime\(minutes\)\s*\{([\s\S]*?)(?=\n  \/\/ --- (?:Target|NT drift)|\n  function (?!advanceTime))/);
  if (advanceMatch) {
    const body = advanceMatch[1];
    const writeRe = /s\.(\w+)\s*(?:=|\+=|-=)/g;
    let m;
    const advWrites = new Set();
    while ((m = writeRe.exec(body)) !== null) {
      advWrites.add(m[1]);
      edges.push({ from: 'advanceTime', to: m[1], via: 'tick', type: 'time_advance' });
    }
    // Extract reads within advanceTime — creates coupling from read vars to written vars
    // We do this by scanning for s.xxx reads, then for each contextual block,
    // identify which var is being written. Simplified: just note all reads.
    const advReads = new Set();
    const readRe = /s\.(\w+)/g;
    while ((m = readRe.exec(body)) !== null) {
      if (!advWrites.has(m[1])) advReads.add(m[1]);
    }
    for (const r of advReads) {
      edges.push({ from: r, to: 'advanceTime', via: 'read_in_tick', type: 'tick_input' });
    }
  }

  // NT drift edges: each NT system's level is pulled toward its target.
  // Therefore, every target input is effectively an indirect edge to the NT level.
  // This creates the feedback paths needed for cycle detection.
  // We model: ntTarget reads var X → ntLevel drifts → ntLevel feeds some other target
  for (const [nt, info] of Object.entries(ntSystems)) {
    // The NT level itself may be read by other target functions
    // (e.g., stress reads cortisol indirectly through state coupling)
    // These edges are already captured by target_input edges.
    // But we need: every input var → nt (already done above) PLUS
    // nt → any var that nt feeds back into. The key coupling:
    // cortisol→stress (indirect via HPA), NE→stress (arousal), etc.
    // These show up when advanceTime uses one NT to modify another state var.
  }

  // Known mechanistic feedback edges not captured by static regex
  // (these are implicit in the computation flow of advanceTime)
  const mechanisticEdges = [
    // Cortisol GI slow pathway reads cortisol
    { from: 'cortisol', to: 'cortisol_gi_slow', via: 'exponential_approach', type: 'mechanistic' },
    // Gastric emptying rate depends on NE and cortisol_gi_slow
    { from: 'norepinephrine', to: 'stomach_fullness', via: 'gastric_motility', type: 'mechanistic' },
    { from: 'cortisol_gi_slow', to: 'stomach_fullness', via: 'gastric_motility', type: 'mechanistic' },
    // Stomach fullness suppresses hunger
    { from: 'stomach_fullness', to: 'hunger', via: 'stretch_receptors', type: 'mechanistic' },
    // Hunger feeds serotonin target (already captured, but explicit)
    { from: 'hunger', to: 'serotonin', via: 'tryptophan_competition', type: 'mechanistic' },
    // Stress feeds cortisol target
    { from: 'stress', to: 'cortisol', via: 'HPA_axis', type: 'mechanistic' },
    // Caffeine blocks adenosine receptors
    { from: 'caffeine_level', to: 'adenosine', via: 'receptor_blockade', type: 'mechanistic' },
    // Energy feeds dopamine target
    { from: 'energy', to: 'dopamine', via: 'striatal_DA', type: 'mechanistic' },
    // Sleep quality feeds serotonin and NE targets
    { from: 'last_sleep_quality', to: 'serotonin', via: 'kynurenine_pathway', type: 'mechanistic' },
    { from: 'last_sleep_quality', to: 'norepinephrine', via: 'REM_LC_quiescence', type: 'mechanistic' },
  ];
  edges.push(...mechanisticEdges);

  return edges;
}

// ============================================================
// ANALYSIS LAYER
// ============================================================

function analyzeOrphans(stateVars, edges, interactions, crossModuleReads, stateSource, ntSystems) {
  // Collect all vars that are read anywhere
  const allReads = new Set();
  const allWrites = new Set();

  // From edges
  for (const e of edges) {
    if (e.type === 'target_input' && !e.from.startsWith('[')) allReads.add(e.from);
    if (e.type === 'interaction_write' || e.type === 'time_advance') allWrites.add(e.to);
    if (e.type === 'interaction_nt') allWrites.add(e.to);
  }

  // From interactions reads
  for (const info of Object.values(interactions)) {
    for (const r of info.reads) {
      if (!r.startsWith('[')) allReads.add(r);
    }
  }

  // From cross-module reads
  for (const vars of Object.values(crossModuleReads)) {
    for (const v of vars) {
      if (!v.startsWith('[')) allReads.add(v);
    }
  }

  // From state.js s.xxx reads (comprehensive — static property access)
  const sReadRe = /s\.(\w+)/g;
  let m;
  while ((m = sReadRe.exec(stateSource)) !== null) allReads.add(m[1]);

  // From state.js s.xxx writes (static)
  const sWriteRe = /s\.(\w+)\s*(?:=|\+=|-=|\*=)/g;
  while ((m = sWriteRe.exec(stateSource)) !== null) allWrites.add(m[1]);

  // NT systems use dynamic access (s[key]) in the drift engine — mark all NT system
  // names as read+written even though static regex won't catch them
  for (const ntName of Object.keys(ntSystems)) {
    allReads.add(ntName);
    allWrites.add(ntName);
  }

  const neverRead = [];
  const neverWritten = [];
  for (const name of Object.keys(stateVars)) {
    if (!allReads.has(name)) neverRead.push(name);
  }

  return { neverRead, neverWritten };
}

function analyzeDegrees(stateVars, edges) {
  const inDeg = {};
  const outDeg = {};

  for (const e of edges) {
    const from = e.from;
    const to = e.to;
    outDeg[from] = (outDeg[from] || 0) + 1;
    inDeg[to] = (inDeg[to] || 0) + 1;
  }

  // Sort by degree
  const topIn = Object.entries(inDeg).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const topOut = Object.entries(outDeg).sort((a, b) => b[1] - a[1]).slice(0, 15);

  return { inDegree: Object.fromEntries(topIn), outDegree: Object.fromEntries(topOut) };
}

function analyzeCycles(edges) {
  // Build adjacency list for state vars and NT systems (exclude interactions as sources)
  const adj = {};
  for (const e of edges) {
    if (e.from.startsWith('interaction:')) continue;
    if (!adj[e.from]) adj[e.from] = new Set();
    adj[e.from].add(e.to);
  }

  // Tarjan's SCC
  const nodes = new Set([...Object.keys(adj), ...Object.values(adj).flatMap(s => [...s])]);
  let index = 0;
  const stack = [];
  const onStack = new Set();
  const indices = {};
  const lowlinks = {};
  const sccs = [];

  function strongconnect(v) {
    indices[v] = index;
    lowlinks[v] = index;
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of (adj[v] || [])) {
      if (indices[w] === undefined) {
        strongconnect(w);
        lowlinks[v] = Math.min(lowlinks[v], lowlinks[w]);
      } else if (onStack.has(w)) {
        lowlinks[v] = Math.min(lowlinks[v], indices[w]);
      }
    }

    if (lowlinks[v] === indices[v]) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 1) sccs.push(scc);
    }
  }

  for (const v of nodes) {
    if (indices[v] === undefined) strongconnect(v);
  }

  return sccs;
}

function analyzeMultiPaths(edges) {
  // For state vars / NT systems, find cases where the same source reaches the same target
  // through multiple distinct paths (double-counting risk)
  const adj = {};
  for (const e of edges) {
    if (e.from.startsWith('interaction:')) continue;
    if (!adj[e.from]) adj[e.from] = [];
    adj[e.from].push({ to: e.to, via: e.via });
  }

  const multiPaths = [];
  // Check: does the same source var appear in multiple target functions?
  const sourceToTargets = {};
  for (const e of edges) {
    if (e.type !== 'target_input') continue;
    const key = e.from;
    if (!sourceToTargets[key]) sourceToTargets[key] = [];
    sourceToTargets[key].push(e.to);
  }

  // Multi-path: same source reaching same target via different routes
  // For now detect: source → NT1 (via target) AND source → NT2 → NT1 (indirect via NT coupling)
  // This is a simplified check — full transitive closure would be expensive
  for (const [source, targets] of Object.entries(sourceToTargets)) {
    if (targets.length > 1) {
      multiPaths.push({ source, reachesTargets: targets, note: 'feeds multiple NT targets' });
    }
  }

  return multiPaths;
}

function analyzeTimescales(ntSystems, stateVars) {
  const timescales = {};

  // NT systems: half-life from rates
  for (const [name, info] of Object.entries(ntSystems)) {
    const avgRate = (info.upRate + info.downRate) / 2;
    const halfLifeHours = Math.LN2 / avgRate;
    let scale = 'hours';
    if (halfLifeHours < 1) scale = 'minutes';
    else if (halfLifeHours > 168) scale = 'weeks';
    else if (halfLifeHours > 24) scale = 'days';
    timescales[name] = { halfLifeHours: Math.round(halfLifeHours * 10) / 10, scale };
  }

  // Hard-coded time constants from known vars and systems
  const knownTau = {
    // Substance metabolism
    caffeine_level: { halfLifeHours: 5, scale: 'hours' },
    nicotine_level: { halfLifeHours: 2, scale: 'hours' },
    // Alcohol: zero-order (linear) elimination, ~15 units/hr — not exponential, but effective
    // clearance of 1 drink in ~1h
    alcohol_level: { halfLifeHours: null, scale: 'hours', note: 'linear elimination ~15 units/hr' },
    // Cannabis: t½ ~90 min for acute psychoactive THC
    cannabis_level: { halfLifeHours: 1.5, scale: 'hours' },
    // Physiological
    stress: { halfLifeHours: 1.5, scale: 'hours' },
    hunger: { halfLifeHours: null, scale: 'hours', note: 'accumulates ~8 pts/hr' },
    stomach_fullness: { halfLifeHours: null, scale: 'hours', note: 'mixed liquid/solid t½ 25-90 min' },
    hygiene_level: { halfLifeHours: null, scale: 'hours', note: 'linear decay ~3 pts/hr' },
    clothing_cleanliness: { halfLifeHours: null, scale: 'hours', note: 'linear decay ~3 pts/hr awake, ~1 asleep' },
    social_energy: { halfLifeHours: null, scale: 'hours', note: 'recovers ~3 pts/hr × introversion; reset by sleep' },
    // Smells
    cleaning_smell_intensity: { halfLifeHours: 1.03, scale: 'hours' },
    coffee_smell_intensity: { halfLifeHours: 0.69, scale: 'minutes' },
    food_smell_intensity: { halfLifeHours: 1.39, scale: 'hours' },
    // Social
    social: { halfLifeHours: 46, scale: 'days' },
    connection_depth: { halfLifeHours: 48, scale: 'days' },
    // NT baselines — τ=30240 min (3 weeks). Physiological setpoint adaptation.
    serotonin_baseline: { halfLifeHours: 350, scale: 'weeks', note: 'τ=30240min (3 weeks) — receptor adaptation' },
    dopamine_baseline: { halfLifeHours: 350, scale: 'weeks', note: 'τ=30240min (3 weeks) — receptor adaptation' },
    norepinephrine_baseline: { halfLifeHours: 350, scale: 'weeks', note: 'τ=30240min (3 weeks) — receptor adaptation' },
    gaba_baseline: { halfLifeHours: 350, scale: 'weeks', note: 'τ=30240min (3 weeks) — receptor adaptation' },
    // Sleep
    sleep_debt: { halfLifeHours: null, scale: 'days', note: 'accumulates from deficit; 33% repayment per sleep; cap 4800' },
    sleep_inertia: { halfLifeHours: 0.25, scale: 'minutes', note: 'τ=15min base, scales with debt up to ~7×' },
    // Personality — static after chargen (set once by applyToState, never modified)
    neuroticism: { halfLifeHours: Infinity, scale: 'static', note: 'set at chargen, never drifts' },
    self_esteem: { halfLifeHours: Infinity, scale: 'static', note: 'set at chargen, never drifts' },
    rumination: { halfLifeHours: Infinity, scale: 'static', note: 'set at chargen, never drifts' },
    trait_loneliness: { halfLifeHours: Infinity, scale: 'static', note: 'set at chargen, never drifts' },
    introversion: { halfLifeHours: Infinity, scale: 'static', note: 'set at chargen, never drifts' },
    sensory_sensitivity: { halfLifeHours: Infinity, scale: 'static', note: 'set at chargen, never drifts' },
    sensory_load: { halfLifeHours: null, scale: 'hours', note: 'drifts toward location×NE×sensitivity target in advanceTime; cleared by sleep' },
    // Other slow vars
    caffeine_habit: { halfLifeHours: null, scale: 'days', note: 'grows/fades per wake cycle' },
    nicotine_habit: { halfLifeHours: null, scale: 'days', note: 'grows/fades per wake cycle' },
    alcohol_tolerance: { halfLifeHours: null, scale: 'days', note: 'grows/fades per wake cycle' },
    cannabis_tolerance: { halfLifeHours: null, scale: 'days', note: 'grows/fades per wake cycle' },
    job_standing: { halfLifeHours: null, scale: 'days', note: 'slow ambient decay + coworker influence' },
    skin_condition: { halfLifeHours: null, scale: 'hours', note: 'degrades outdoors in cold; recovers overnight' },
  };

  for (const [name, info] of Object.entries(knownTau)) {
    timescales[name] = info;
  }

  return timescales;
}

function analyzeScaleMismatches(edges, timescales) {
  const warnings = [];

  // Find coupled variables at very different timescales
  for (const e of edges) {
    if (e.type !== 'target_input') continue;
    const fromScale = timescales[e.from];
    const toScale = timescales[e.to];
    if (!fromScale || !toScale) continue;
    if (!fromScale.halfLifeHours || !toScale.halfLifeHours) continue;

    const ratio = fromScale.halfLifeHours / toScale.halfLifeHours;
    if (ratio > 20 || ratio < 0.05) {
      warnings.push({
        from: e.from,
        to: e.to,
        fromHalfLife: `${fromScale.halfLifeHours}h`,
        toHalfLife: `${toScale.halfLifeHours}h`,
        ratio: Math.round(ratio * 10) / 10,
        note: ratio > 20
          ? `${e.from} is much slower than ${e.to} — input changes rarely relative to target drift`
          : `${e.from} is much faster than ${e.to} — input oscillates faster than target can follow`,
      });
    }
  }

  return warnings;
}

function analyzeUnderutilization(stateVars, interactions, crossModuleReads, tierFunctions) {
  // Build a reverse map: tier function name → underlying state var(s) it reads.
  // Tier functions are named xxxTier; readsVar may be a '+'-joined composite for complex tiers.
  const tierToVars = {};
  for (const [fnName, info] of Object.entries(tierFunctions || {})) {
    const strippedName = fnName.replace(/^function\s+/, ''); // already stripped by extractor
    if (info.readsVar) {
      tierToVars[strippedName] = info.readsVar.split('+').filter(v => v && !v.startsWith('['));
    }
  }

  // Count how many content interactions read each state var.
  // [tier:xxxTier] reads are resolved back to their underlying vars via tierToVars.
  const contentReads = {};
  for (const [id, info] of Object.entries(interactions)) {
    for (const r of info.reads) {
      if (r.startsWith('[tier:')) {
        const fnName = r.slice(6, -1); // strip '[tier:' and ']'
        for (const v of (tierToVars[fnName] || [])) {
          contentReads[v] = (contentReads[v] || 0) + 1;
        }
      } else if (!r.startsWith('[')) {
        contentReads[r] = (contentReads[r] || 0) + 1;
      }
    }
  }

  // Also count cross-module reads
  for (const vars of Object.values(crossModuleReads)) {
    for (const v of vars) {
      if (v.startsWith('[tier:')) {
        const fnName = v.slice(6, -1);
        for (const sv of (tierToVars[fnName] || [])) {
          contentReads[sv] = (contentReads[sv] || 0) + 1;
        }
      } else if (!v.startsWith('[')) {
        contentReads[v] = (contentReads[v] || 0) + 1;
      }
    }
  }

  // Vars with zero or very few content reads
  const underused = [];
  for (const name of Object.keys(stateVars)) {
    const count = contentReads[name] || 0;
    if (count <= 1 && !['time', 'location', 'is_sleeping', 'start_timestamp',
                        'previous_location', 'location_arrival_time', 'last_observed_time',
                        'last_observed_money', 'wake_period_start'].includes(name)) {
      underused.push({ name, contentReads: count, category: stateVars[name].category });
    }
  }
  underused.sort((a, b) => a.contentReads - b.contentReads);

  return underused;
}

/**
 * Improved orphan analysis: for each state var, count content reads vs state-internal reads.
 * True orphans have 0 of both. Vars only used internally are a lesser concern.
 */
function analyzeReadCategorization(stateVars, interactions, crossModuleReads, tierFunctions, stateInternalReadCounts) {
  // Build tier → vars map
  const tierToVars = {};
  for (const [fnName, info] of Object.entries(tierFunctions || {})) {
    if (info.readsVar) {
      tierToVars[fnName] = info.readsVar.split('+').filter(v => v && !v.startsWith('['));
    }
  }

  // Count content reads (State.get + tier reads resolved to underlying vars)
  const contentReads = {};
  for (const [, info] of Object.entries(interactions)) {
    for (const r of info.reads) {
      if (r.startsWith('[tier:')) {
        const fnName = r.slice(6, -1);
        for (const v of (tierToVars[fnName] || [])) {
          contentReads[v] = (contentReads[v] || 0) + 1;
        }
      } else if (!r.startsWith('[')) {
        contentReads[r] = (contentReads[r] || 0) + 1;
      }
    }
  }
  for (const vars of Object.values(crossModuleReads)) {
    for (const v of vars) {
      if (v.startsWith('[tier:')) {
        const fnName = v.slice(6, -1);
        for (const sv of (tierToVars[fnName] || [])) {
          contentReads[sv] = (contentReads[sv] || 0) + 1;
        }
      } else if (!v.startsWith('[')) {
        contentReads[v] = (contentReads[v] || 0) + 1;
      }
    }
  }

  const results = [];
  // Ignore infrastructure vars that are accessed indirectly or are internal-only by design
  const infrastructureVars = new Set([
    'time', 'location', 'is_sleeping', 'start_timestamp', 'previous_location',
    'location_arrival_time', 'last_observed_time', 'last_observed_money', 'wake_period_start',
    'sentiments', 'personal_calendar', 'scheduled_interrupts', 'pantry',
    'labor_arrangement', 'known_shifts', 'health_conditions',
  ]);

  for (const name of Object.keys(stateVars)) {
    if (infrastructureVars.has(name)) continue;
    const cr = contentReads[name] || 0;
    const si = stateInternalReadCounts[name] || 0;
    results.push({ name, contentReads: cr, stateInternalReads: si, category: stateVars[name].category });
  }

  const trueOrphans = results.filter(r => r.contentReads === 0 && r.stateInternalReads === 0);
  const internalOnly = results.filter(r => r.contentReads === 0 && r.stateInternalReads > 0);
  const contentOnly = results.filter(r => r.contentReads > 0 && r.stateInternalReads === 0);

  return { all: results, trueOrphans, internalOnly, contentOnly };
}

/**
 * Find NT vars in ntRates that have no entry in ntTargetFns (drift toward 50 forever).
 */
function analyzeNtMissingTargets(ntSystems, stateSource) {
  // Extract registered snake_case keys from ntTargetFns map
  const registeredKeys = new Set();
  const regMatch = stateSource.match(/const ntTargetFns\s*=\s*\{([\s\S]*?)\};/);
  if (regMatch) {
    const regRe = /(\w+):\s*\w+Target/g;
    let rm;
    while ((rm = regRe.exec(regMatch[1])) !== null) registeredKeys.add(rm[1]);
  }

  const missing = [];
  for (const key of Object.keys(ntSystems)) {
    if (!registeredKeys.has(key)) missing.push(key);
  }
  return { missing, registered: [...registeredKeys] };
}

/**
 * Check that all *Target() functions defined in state.js are registered in ntTargetFns, and vice versa.
 * Both sets use camelCase function name prefixes for comparison (e.g. 'substanceP', 'serotonin').
 */
function analyzeTargetRegistration(targetFnMeta) {
  const { allDefined, allRegistered } = targetFnMeta;
  // definedNotRegistered: function exists but ntTargetFns doesn't reference it
  const definedNotRegistered = [...allDefined].filter(n => !allRegistered.has(n));
  // registeredNotDefined: ntTargetFns references a fn that doesn't exist
  const registeredNotDefined = [...allRegistered].filter(n => !allDefined.has(n));
  return { definedNotRegistered, registeredNotDefined };
}

function analyzeLocationGaps(interactions) {
  // Group interactions by location and analyze state domain coverage
  const byLocation = {};
  for (const [id, info] of Object.entries(interactions)) {
    const loc = info.location || 'global';
    if (!byLocation[loc]) byLocation[loc] = { count: 0, reads: new Set(), writes: new Set(), writesNT: new Set() };
    byLocation[loc].count++;
    for (const r of info.reads) byLocation[loc].reads.add(r);
    for (const w of info.writes) byLocation[loc].writes.add(w);
    for (const nt of info.writesNT) byLocation[loc].writesNT.add(nt);
  }

  // Convert Sets to arrays for JSON
  const gaps = {};
  for (const [loc, info] of Object.entries(byLocation)) {
    gaps[loc] = {
      interactionCount: info.count,
      stateReads: [...info.reads],
      stateWrites: [...info.writes],
      ntWrites: [...info.writesNT],
    };
  }
  return gaps;
}

function analyzeTierCoverage(stateVars, interactions, contentSource) {
  // Find state vars read raw by content.js that lack a tier function
  const rawReads = new Set();
  const getRe = /ctx\.state\.get\('(\w+)'\)/g;
  let m;
  while ((m = getRe.exec(contentSource)) !== null) rawReads.add(m[1]);

  const warnings = [];
  for (const name of rawReads) {
    if (!stateVars[name]) continue;
    if (stateVars[name].hasTier) continue;
    // Exempt: vars legitimately read raw
    // - NT vars: read via lerp01 for weighted prose selection (by design)
    // - Boolean/string/enum vars: no continuous scale → no tier needed
    // - Inventory/count vars: discrete quantities
    // - Phone UI state: transient navigation
    // - Identity/personality params: read for branching, not continuous display
    // - Timestamps: compared against time, not tiered
    // - Financial guard vars: day counters for billing cycles
    // - Sentiment/friend/family state: specialized accessors
    const exemptPrefixes = ['last_', 'phone_', 'family_', 'friend_', 'neighbor_',
                            'upcoming_shift', 'gig_', 'asked_for_help', 'friend_in_need'];
    if (exemptPrefixes.some(p => name.startsWith(p))) continue;
    if (['time', 'money', 'location', 'weather', 'rain',
         'viewing_phone', 'dressed', 'has_phone', 'phone_service',
         'utilities_on', 'fridge_food', 'pantry_food', 'has_cigarettes', 'has_alcohol',
         'has_cannabis', 'has_umbrella', 'hrt_active', 'trans', 'autism', 'adhd',
         'synesthesia', 'apd', 'heds', 'mcas', 'pronouns', 'sexuality',
         'moisturizer_count', 'pain_reliever_count', 'period_supply_count',
         'binder_count', 'makeup_count', 'special_interest',
         'quit_attempt', 'clothing_visible_damage', 'needs_period_supplies',
         'laundry_access', 'laundry_phase', 'displaced', 'staying_with',
         'ebt_balance', 'ebt_monthly_amount', 'rent_amount', 'hourly_rate',
         'hours_worked_period', 'paycheck_day_offset', 'rent_day_offset',
         'utility_day_offset', 'ebt_day_offset',
         'work_tasks_expected', 'labor_arrangement', 'job_seeking',
         'interview_outcome', 'callback_pending', 'interview_is_followup',
         'pending_replies', 'pending_bills', 'notes', 'timer_duration',
         'available_gigs', 'scheduled_interrupts', 'couch_available', 'couch_days',
         'couch_strain', 'clinic_checkin_time', 'clinic_ready', 'clinic_prescriptions',
         'out_at_work', 'out_to_family', 'connective_tissue_laxity',
         'wake_period_start', 'daylight_exposure', 'pantry', 'teeth_lost',
         // NT vars — read raw via lerp01 for weighted prose shading (by design)
         'serotonin', 'dopamine', 'norepinephrine', 'gaba', 'adenosine',
         'cortisol', 'melatonin', 'histamine',
         // NT baselines — read raw for withdrawal calculation
         'serotonin_baseline', 'dopamine_baseline', 'norepinephrine_baseline', 'gaba_baseline',
         // Personality — continuous but read raw for inertia/regulation calculation
         'neuroticism', 'rumination', 'self_esteem', 'introversion', 'sensory_sensitivity',
         // Substance vars read for dose/tolerance comparisons
         'nicotine_habit', 'alcohol_tolerance', 'cannabis_tolerance',
         // Health condition continuous vars — some have tiers, some don't yet
         'illness_severity', 'illness_day', 'cramps_active', 'cramp_severity',
         'chronic_pain_level', 'dental_ache', 'gastritis_pain', 'migraine_intensity',
         'rem_rebound_pending', 'tremor_active', 'eviction_risk', 'trans_presentation',
         'soup_kitchen_visits', 'food_bank_visits', 'shelter_bed',
         'connection_depth', 'sleep_debt', 'nausea', 'craving_intensity',
         'cleaning_smell_intensity', 'coffee_smell_intensity', 'food_smell_intensity',
         'hrt_last_taken', 'binder_start_time', 'timer_end_time',
         'meeting_last_attended', 'battery_health',
        ].includes(name)) continue;
    warnings.push({ var: name, category: stateVars[name].category, note: 'read raw by content.js without tier function' });
  }

  return warnings;
}

// ============================================================
// GRAPH-THEORETIC ANALYSIS
// ============================================================

/**
 * Section A — Degree distribution & outliers.
 * Computes in/out degree for every node in the edge set and finds z-score outliers.
 */
function analyzeGraphDegrees(edges) {
  const inDeg = {};
  const outDeg = {};
  const nodes = new Set();

  for (const e of edges) {
    nodes.add(e.from);
    nodes.add(e.to);
    outDeg[e.from] = (outDeg[e.from] || 0) + 1;
    inDeg[e.to] = (inDeg[e.to] || 0) + 1;
  }

  // Ensure every node appears in both maps
  for (const n of nodes) {
    if (inDeg[n] === undefined) inDeg[n] = 0;
    if (outDeg[n] === undefined) outDeg[n] = 0;
  }

  // Helper: z-score outliers from a degree map
  function zOutliers(degMap, threshold = 2.0) {
    const vals = Object.values(degMap);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const sd = Math.sqrt(variance);
    if (sd === 0) return [];
    return Object.entries(degMap)
      .map(([node, deg]) => ({ node, deg, z: (deg - mean) / sd }))
      .filter(x => Math.abs(x.z) > threshold)
      .sort((a, b) => b.deg - a.deg);
  }

  const inOutliers = zOutliers(inDeg);
  const outOutliers = zOutliers(outDeg);

  // True structural orphans: degree 0 in both directions
  const trueOrphans = [...nodes].filter(n => inDeg[n] === 0 && outDeg[n] === 0);

  return { inDeg, outDeg, nodes: [...nodes], inOutliers, outOutliers, trueOrphans };
}

/**
 * Section B — Weakly connected components (union-find, treating all edges as undirected).
 */
function analyzeWeakComponents(edges) {
  const parent = {};

  function find(x) {
    if (parent[x] === undefined) parent[x] = x;
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  for (const e of edges) {
    union(e.from, e.to);
  }

  // Group nodes by root
  const components = {};
  for (const node of Object.keys(parent)) {
    const root = find(node);
    if (!components[root]) components[root] = [];
    components[root].push(node);
  }

  const componentList = Object.values(components).sort((a, b) => b.length - a.length);

  return { components: componentList };
}

/**
 * Section C — Strongly connected components with full detail (Tarjan's, directed edges).
 * Excludes interaction: prefix nodes from sources to focus on state/NT/system coupling.
 * Reports all SCCs with size > 1, flags those with size > 3 as "complex feedback".
 */
function analyzeStrongComponents(edges) {
  // Build adjacency list — exclude interaction: nodes as sources for cleaner signal
  const adj = {};
  const nodes = new Set();

  for (const e of edges) {
    if (e.from.startsWith('interaction:')) continue;
    nodes.add(e.from);
    nodes.add(e.to);
    if (!adj[e.from]) adj[e.from] = new Set();
    adj[e.from].add(e.to);
  }

  let index = 0;
  const stack = [];
  const onStack = new Set();
  const indices = {};
  const lowlinks = {};
  const sccs = [];

  function strongconnect(v) {
    indices[v] = index;
    lowlinks[v] = index;
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of (adj[v] || [])) {
      if (indices[w] === undefined) {
        strongconnect(w);
        lowlinks[v] = Math.min(lowlinks[v], lowlinks[w]);
      } else if (onStack.has(w)) {
        lowlinks[v] = Math.min(lowlinks[v], indices[w]);
      }
    }

    if (lowlinks[v] === indices[v]) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 1) {
        sccs.push({
          nodes: scc,
          size: scc.length,
          isComplex: scc.length > 3,
        });
      }
    }
  }

  // Use iterative Tarjan's to avoid stack overflow on large graphs
  for (const v of nodes) {
    if (indices[v] === undefined) strongconnect(v);
  }

  sccs.sort((a, b) => b.size - a.size);
  return { sccs };
}

/**
 * Section D — Betweenness centrality (Brandes algorithm, O(VE)).
 * Operates on the full directed edge set (excluding interaction: source nodes).
 */
function analyzeBetweenness(edges) {
  // Build adjacency list; exclude interaction: sources
  const adj = {};
  const nodes = new Set();

  for (const e of edges) {
    if (e.from.startsWith('interaction:')) continue;
    nodes.add(e.from);
    nodes.add(e.to);
    if (!adj[e.from]) adj[e.from] = [];
    adj[e.from].push(e.to);
  }
  // Ensure all nodes have an entry (even sinks)
  for (const n of nodes) {
    if (!adj[n]) adj[n] = [];
  }

  const nodeList = [...nodes];
  const N = nodeList.length;
  const nodeIndex = {};
  for (let i = 0; i < N; i++) nodeIndex[nodeList[i]] = i;

  // Brandes algorithm
  const betweenness = new Float64Array(N);

  for (let sIdx = 0; sIdx < N; sIdx++) {
    const s = nodeList[sIdx];

    const stack = [];
    const pred = Array.from({ length: N }, () => []);
    const sigma = new Float64Array(N);   // number of shortest paths from s
    const dist = new Int32Array(N).fill(-1);

    sigma[sIdx] = 1;
    dist[sIdx] = 0;

    const queue = [sIdx];
    let qi = 0;

    while (qi < queue.length) {
      const vIdx = queue[qi++];
      const v = nodeList[vIdx];
      stack.push(vIdx);

      for (const w of (adj[v] || [])) {
        const wIdx = nodeIndex[w];
        if (wIdx === undefined) continue;

        // First time visiting w?
        if (dist[wIdx] < 0) {
          queue.push(wIdx);
          dist[wIdx] = dist[vIdx] + 1;
        }

        // Is this a shortest path to w via v?
        if (dist[wIdx] === dist[vIdx] + 1) {
          sigma[wIdx] += sigma[vIdx];
          pred[wIdx].push(vIdx);
        }
      }
    }

    // Accumulation
    const delta = new Float64Array(N);
    while (stack.length > 0) {
      const wIdx = stack.pop();
      for (const vIdx of pred[wIdx]) {
        const coeff = (sigma[vIdx] / sigma[wIdx]) * (1 + delta[wIdx]);
        delta[vIdx] += coeff;
      }
      if (wIdx !== sIdx) {
        betweenness[wIdx] += delta[wIdx];
      }
    }
  }

  // Normalize: divide by (N-1)(N-2) for directed graph
  const norm = N > 2 ? (N - 1) * (N - 2) : 1;
  const result = nodeList.map((node, i) => ({
    node,
    betweenness: betweenness[i] / norm,
  })).sort((a, b) => b.betweenness - a.betweenness);

  const top10 = result.slice(0, 10);
  const bridges = result.filter(x => x.betweenness > 0.1);

  return { top10, bridges, all: result };
}

// ============================================================
// REPORT GENERATION
// ============================================================

function formatReport(graph) {
  const lines = [];
  const hr = '─'.repeat(70);

  lines.push('');
  lines.push('╔══════════════════════════════════════════════════════════╗');
  lines.push('║           EXISTENCE — Simulation Diagnostic            ║');
  lines.push('╚══════════════════════════════════════════════════════════╝');
  lines.push('');

  // Summary
  lines.push(`State variables: ${Object.keys(graph.stateVars).length}`);
  lines.push(`NT systems: ${Object.keys(graph.ntSystems).length}`);
  lines.push(`Tier functions: ${Object.keys(graph.tierFunctions).length}`);
  lines.push(`Interactions: ${Object.keys(graph.interactions).length}`);
  lines.push(`Edges: ${graph.edges.length}`);
  lines.push('');

  // Category breakdown
  const cats = {};
  for (const v of Object.values(graph.stateVars)) {
    cats[v.category] = (cats[v.category] || 0) + 1;
  }
  lines.push('State vars by category:');
  for (const [cat, count] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${cat}: ${count}`);
  }
  lines.push('');

  // 1. Orphans
  lines.push(hr);
  lines.push('1. ORPHAN ANALYSIS');
  lines.push(hr);
  const { neverRead } = graph.analyses.orphans;
  if (neverRead.length === 0) {
    lines.push('  No orphaned state variables found.');
  } else {
    lines.push(`  State vars never read (possible dead state): ${neverRead.length}`);
    for (const v of neverRead.slice(0, 20)) {
      lines.push(`    - ${v} (${graph.stateVars[v]?.category || '?'})`);
    }
    if (neverRead.length > 20) lines.push(`    ... and ${neverRead.length - 20} more`);
  }
  lines.push('');

  // 2. Degree hotspots
  lines.push(hr);
  lines.push('2. DEGREE HOTSPOTS');
  lines.push(hr);
  lines.push('  Top in-degree (most influenced):');
  for (const [node, deg] of Object.entries(graph.analyses.degrees.inDegree)) {
    lines.push(`    ${String(deg).padStart(3)} ← ${node}`);
  }
  lines.push('');
  lines.push('  Top out-degree (most influential):');
  for (const [node, deg] of Object.entries(graph.analyses.degrees.outDegree)) {
    lines.push(`    ${String(deg).padStart(3)} → ${node}`);
  }
  lines.push('');

  // 3. Cycles
  lines.push(hr);
  lines.push('3. FEEDBACK LOOPS (SCCs)');
  lines.push(hr);
  const cycles = graph.analyses.cycles;
  if (cycles.length === 0) {
    lines.push('  No feedback loops detected.');
  } else {
    lines.push(`  ${cycles.length} feedback loop(s) found:`);
    for (const scc of cycles) {
      lines.push(`    [${scc.join(' → ')} → ${scc[0]}]`);
    }
  }
  lines.push('');

  // 4. Multi-path
  lines.push(hr);
  lines.push('4. MULTI-PATH DETECTION (double-counting risk)');
  lines.push(hr);
  const mp = graph.analyses.multiPaths;
  if (mp.length === 0) {
    lines.push('  No multi-path concerns detected.');
  } else {
    for (const p of mp.slice(0, 15)) {
      lines.push(`  ${p.source} → [${p.reachesTargets.join(', ')}] — ${p.note}`);
    }
    if (mp.length > 15) lines.push(`  ... and ${mp.length - 15} more`);
  }
  lines.push('');

  // 5. Timescales
  lines.push(hr);
  lines.push('5. TEMPORAL SCALE STRATIFICATION');
  lines.push(hr);
  const ts = graph.analyses.timescales;
  const byScale = { minutes: [], hours: [], days: [], weeks: [], static: [] };
  for (const [name, info] of Object.entries(ts)) {
    (byScale[info.scale] || []).push({ name, ...info });
  }
  for (const [scale, items] of Object.entries(byScale)) {
    if (items.length === 0) continue;
    lines.push(`  ${scale.toUpperCase()} (${items.length}):`);
    for (const item of items.sort((a, b) => (a.halfLifeHours || 0) - (b.halfLifeHours || 0))) {
      const hl = item.halfLifeHours === Infinity ? 'constant'
               : item.halfLifeHours ? `t½=${item.halfLifeHours}h`
               : (item.note || '');
      lines.push(`    ${item.name}: ${hl}`);
    }
  }
  lines.push('');

  // 6. Scale mismatches
  lines.push(hr);
  lines.push('6. SCALE MISMATCH WARNINGS');
  lines.push(hr);
  const sm = graph.analyses.scaleMismatches;
  if (sm.length === 0) {
    lines.push('  No severe scale mismatches found.');
  } else {
    for (const w of sm) {
      lines.push(`  ${w.from} (${w.fromHalfLife}) → ${w.to} (${w.toHalfLife}): ratio ${w.ratio}×`);
      lines.push(`    ${w.note}`);
    }
  }
  lines.push('');

  // 7. Underutilization
  lines.push(hr);
  lines.push('7. UNDERUTILIZED STATE VARIABLES');
  lines.push(hr);
  const uu = graph.analyses.underutilization;
  if (uu.length === 0) {
    lines.push('  All state variables well-utilized.');
  } else {
    lines.push(`  ${uu.length} state var(s) with ≤1 content read:`);
    for (const item of uu.slice(0, 25)) {
      lines.push(`    ${item.name} (${item.category}): ${item.contentReads} reads`);
    }
    if (uu.length > 25) lines.push(`    ... and ${uu.length - 25} more`);
  }
  lines.push('');

  // 8. Location gaps
  lines.push(hr);
  lines.push('8. LOCATION INTERACTION COVERAGE');
  lines.push(hr);
  const lg = graph.analyses.locationGaps;
  for (const [loc, info] of Object.entries(lg).sort((a, b) => b.interactionCount - a.interactionCount)) {
    lines.push(`  ${loc}: ${info.interactionCount} interactions, ${info.stateReads.length} state reads, ${info.ntWrites.length} NT writes`);
  }
  lines.push('');

  // 9. Tier coverage
  lines.push(hr);
  lines.push('9. TIER COVERAGE WARNINGS');
  lines.push(hr);
  const tc = graph.analyses.tierCoverage;
  if (tc.length === 0) {
    lines.push('  All content state reads use tier functions.');
  } else {
    lines.push(`  ${tc.length} var(s) read raw by content without tier function:`);
    for (const item of tc) {
      lines.push(`    ${item.var} (${item.category})`);
    }
  }
  lines.push('');

  // 10. Read categorization (content vs state-internal)
  lines.push(hr);
  lines.push('10. READ CATEGORIZATION — content vs state-internal');
  lines.push(hr);
  const rc = graph.analyses.readCategorization;
  lines.push(`  True orphans (0 content reads, 0 state-internal reads): ${rc.trueOrphans.length}`);
  if (rc.trueOrphans.length > 0) {
    for (const item of rc.trueOrphans.slice(0, 30)) {
      lines.push(`    - ${item.name} (${item.category})`);
    }
    if (rc.trueOrphans.length > 30) lines.push(`    ... and ${rc.trueOrphans.length - 30} more`);
  }
  lines.push('');
  lines.push(`  Internal-only (read in state.js target/advanceTime, 0 content reads): ${rc.internalOnly.length}`);
  if (rc.internalOnly.length > 0) {
    for (const item of rc.internalOnly.slice(0, 20)) {
      lines.push(`    - ${item.name} (${item.category}): ${item.stateInternalReads} internal reads`);
    }
    if (rc.internalOnly.length > 20) lines.push(`    ... and ${rc.internalOnly.length - 20} more`);
  }
  lines.push('');

  // 11. NT vars missing target functions
  lines.push(hr);
  lines.push('11. NT VARS MISSING TARGET FUNCTIONS');
  lines.push(hr);
  const nm = graph.analyses.ntMissingTargets;
  lines.push(`  ${nm.missing.length} NT system(s) in ntRates with no ntTargetFns entry (drift toward 50 forever):`);
  for (const name of nm.missing) {
    lines.push(`    - ${name}`);
  }
  lines.push(`  ${nm.registered.length} NT systems have target functions: ${nm.registered.join(', ')}`);
  lines.push('');

  // 12. NT target input graph
  lines.push(hr);
  lines.push('12. NT TARGET INPUT GRAPH');
  lines.push(hr);
  lines.push('  For each NT system with a target function, which state vars shape its equilibrium:');
  lines.push('');
  for (const [nt, info] of Object.entries(graph.ntSystems)) {
    if (!nm.registered.includes(nt)) continue;
    const stateInputs = info.targetInputs.filter(i => !i.startsWith('['));
    const fnInputs = info.targetInputs.filter(i => i.startsWith('['));
    const sentInputs = info.sentimentInputs || [];
    const parts = [];
    if (stateInputs.length > 0) parts.push(`state: ${stateInputs.join(', ')}`);
    if (fnInputs.length > 0) parts.push(`fns: ${fnInputs.map(f => f.slice(4, -1)).join(', ')}`);
    if (sentInputs.length > 0) parts.push(`sentiments: ${sentInputs.map(s => `${s.target}/${s.quality}`).join(', ')}`);
    const summary = parts.length > 0 ? parts.join(' | ') : '(no s.xxx reads found — may use only constants or fn calls)';
    lines.push(`  ${nt}:`);
    lines.push(`    ${summary}`);
  }
  lines.push('');

  // 13. Target function registration check
  lines.push(hr);
  lines.push('13. TARGET FUNCTION REGISTRATION CHECK');
  lines.push(hr);
  const tr = graph.analyses.targetRegistration;
  if (tr.definedNotRegistered.length === 0 && tr.registeredNotDefined.length === 0) {
    lines.push('  All target functions defined and registered. No mismatches.');
  } else {
    if (tr.definedNotRegistered.length > 0) {
      lines.push(`  Defined but NOT registered in ntTargetFns (${tr.definedNotRegistered.length}):`);
      for (const name of tr.definedNotRegistered) {
        lines.push(`    - ${name}Target() — function exists but won't be called by drift engine`);
      }
    }
    if (tr.registeredNotDefined.length > 0) {
      lines.push(`  Registered but NOT defined (${tr.registeredNotDefined.length}):`);
      for (const name of tr.registeredNotDefined) {
        lines.push(`    - ${name} — registered in ntTargetFns but no matching function found`);
      }
    }
  }
  lines.push('');

  // === Graph Analysis: Degree Distribution ===
  lines.push(hr);
  lines.push('=== Graph Analysis: Degree Distribution ===');
  lines.push(hr);
  const gd = graph.analyses.graphDegrees;
  lines.push(`  Total graph nodes: ${gd.nodes.length}`);
  lines.push('');
  lines.push('  Hub inputs — high in-degree outliers (z > 2.0, read by many):');
  if (gd.inOutliers.length === 0) {
    lines.push('    None');
  } else {
    for (const x of gd.inOutliers) {
      lines.push(`    in=${x.deg} (z=${x.z.toFixed(2)})  ${x.node}`);
    }
  }
  lines.push('');
  lines.push('  Hub readers — high out-degree outliers (z > 2.0, reads many):');
  if (gd.outOutliers.length === 0) {
    lines.push('    None');
  } else {
    for (const x of gd.outOutliers) {
      lines.push(`    out=${x.deg} (z=${x.z.toFixed(2)})  ${x.node}`);
    }
  }
  lines.push('');
  lines.push(`  True structural orphans (degree 0 in both directions): ${gd.trueOrphans.length}`);
  if (gd.trueOrphans.length > 0) {
    for (const n of gd.trueOrphans.slice(0, 20)) {
      lines.push(`    - ${n}`);
    }
    if (gd.trueOrphans.length > 20) lines.push(`    ... and ${gd.trueOrphans.length - 20} more`);
  }
  lines.push('');

  // === Graph Analysis: Weakly Connected Components ===
  lines.push(hr);
  lines.push('=== Graph Analysis: Weakly Connected Components ===');
  lines.push(hr);
  const wc = graph.analyses.weakComponents;
  lines.push(`  Total components: ${wc.components.length}`);
  lines.push(`  Largest component ("main cluster"): ${wc.components[0]?.length ?? 0} nodes`);
  lines.push('');
  const smallComponents = wc.components.filter(c => c.length < 5 && c.length > 0);
  if (smallComponents.length === 0) {
    lines.push('  No isolated clusters (all components size ≥ 5).');
  } else {
    lines.push(`  Isolated clusters (size < 5): ${smallComponents.length}`);
    for (const comp of smallComponents) {
      lines.push(`    [${comp.join(', ')}]`);
    }
  }
  lines.push('');
  lines.push('  All component sizes:');
  for (let i = 0; i < wc.components.length; i++) {
    const label = i === 0 ? ' ← main cluster' : '';
    lines.push(`    Component ${i + 1}: ${wc.components[i].length} nodes${label}`);
  }
  lines.push('');

  // === Graph Analysis: Strongly Connected Components (Feedback Loops) ===
  lines.push(hr);
  lines.push('=== Graph Analysis: Strongly Connected Components (Feedback Loops) ===');
  lines.push(hr);
  const sc = graph.analyses.strongComponents;
  if (sc.sccs.length === 0) {
    lines.push('  No feedback loops detected (no directed cycles in state/NT coupling graph).');
  } else {
    lines.push(`  ${sc.sccs.length} feedback loop(s) found (SCCs with size > 1):`);
    lines.push('');
    for (const scc of sc.sccs) {
      const flag = scc.isComplex ? '  *** COMPLEX FEEDBACK ***' : '';
      lines.push(`  Size ${scc.size}${flag}`);
      lines.push(`    Nodes: ${scc.nodes.join(', ')}`);
    }
  }
  lines.push('');

  // === Graph Analysis: Betweenness Centrality ===
  lines.push(hr);
  lines.push('=== Graph Analysis: Betweenness Centrality ===');
  lines.push(hr);
  const bc = graph.analyses.betweenness;
  lines.push('  Top 10 nodes by betweenness (structural bottlenecks):');
  for (const x of bc.top10) {
    const bridgeFlag = x.betweenness > 0.1 ? '  [BRIDGE NODE]' : '';
    lines.push(`    ${x.betweenness.toFixed(4)}  ${x.node}${bridgeFlag}`);
  }
  lines.push('');
  if (bc.bridges.length === 0) {
    lines.push('  No bridge nodes found (no node with betweenness > 0.1).');
  } else {
    lines.push(`  Bridge nodes (betweenness > 0.1) — removal would most disconnect the graph:`);
    for (const x of bc.bridges) {
      lines.push(`    ${x.betweenness.toFixed(4)}  ${x.node}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  const stateSource = readFile('js/state.js');
  const contentSource = readFile('js/content.js');

  // Extraction
  const stateVars = extractStateVars(stateSource);
  const ntSystems = extractNtRates(stateSource);
  const targetFnMeta = extractTargetFunctions(stateSource, ntSystems);
  const stateInternalReadCounts = extractStateInternalReads(stateSource);
  const tierFunctions = extractTierFunctions(stateSource, stateVars);
  const timeConstants = extractTimeConstants(stateSource);
  const interactions = extractInteractions(contentSource);
  const crossModuleReads = extractCrossModuleReads([
    { path: 'js/senses.js', name: 'senses.js' },
    { path: 'js/habits.js', name: 'habits.js' },
    { path: 'js/game.js', name: 'game.js' },
    { path: 'js/world.js', name: 'world.js' },
    { path: 'js/chargen.js', name: 'chargen.js' },
    { path: 'js/character.js', name: 'character.js' },
    { path: 'js/ui.js', name: 'ui.js' },
  ]);
  const edges = buildEdges(ntSystems, interactions, stateSource);

  // Analysis
  const orphans = analyzeOrphans(stateVars, edges, interactions, crossModuleReads, stateSource, ntSystems);
  const degrees = analyzeDegrees(stateVars, edges);
  const cycles = analyzeCycles(edges);
  const multiPaths = analyzeMultiPaths(edges);
  const timescales = analyzeTimescales(ntSystems, stateVars);
  const scaleMismatches = analyzeScaleMismatches(edges, timescales);
  const underutilization = analyzeUnderutilization(stateVars, interactions, crossModuleReads, tierFunctions);
  const locationGaps = analyzeLocationGaps(interactions);
  const tierCoverage = analyzeTierCoverage(stateVars, interactions, contentSource);
  const readCategorization = analyzeReadCategorization(stateVars, interactions, crossModuleReads, tierFunctions, stateInternalReadCounts);
  const ntMissingTargets = analyzeNtMissingTargets(ntSystems, stateSource);
  const targetRegistration = analyzeTargetRegistration(targetFnMeta);

  // Graph-theoretic analyses
  const graphDegrees = analyzeGraphDegrees(edges);
  const weakComponents = analyzeWeakComponents(edges);
  const strongComponents = analyzeStrongComponents(edges);
  const betweenness = analyzeBetweenness(edges);

  const graph = {
    stateVars,
    ntSystems,
    tierFunctions,
    timeConstants,
    interactions,
    edges,
    crossModuleReads,
    analyses: {
      orphans,
      degrees,
      cycles,
      multiPaths,
      timescales,
      scaleMismatches,
      underutilization,
      locationGaps,
      tierCoverage,
      readCategorization,
      ntMissingTargets,
      targetRegistration,
      graphDegrees,
      weakComponents,
      strongComponents,
      betweenness,
    },
  };

  // Write JSON
  const jsonPath = join(ROOT, 'sim-graph.json');
  writeFileSync(jsonPath, JSON.stringify(graph, null, 2));

  // Print report
  console.log(formatReport(graph));
  console.log(`Graph written to: sim-graph.json`);
}

main();
