// test-context.js — headless simulation context for unit tests
// Wires the same simulation core as context.js but without ui.js, game.js, or chargen.js.
// The runs module automatically uses its in-memory backend when IndexedDB is unavailable,
// so no additional shim is needed here.

import { createRuns } from './runs.js';
import { createTimeline } from './timeline.js';
import { createState } from './state.js';
import { createEvents } from './events.js';
import { createHabits } from './habits.js';
import { createCharacter } from './character.js';
import { createWorld } from './world.js';
import { createContent } from './content.js';
import { createDishes } from './dishes.js';
import { createLinens } from './linens.js';
import { createBody } from './body.js';
import { createClothing } from './clothing.js';
import { createItems } from './items.js';
import { createMess } from './mess.js';
import { createSenses } from './senses.js';

/**
 * Create a fully wired simulation context suitable for bun/Node.js unit tests.
 * No DOM, no IndexedDB, no ui.js, no game.js.
 *
 * @param {number} [seed] — deterministic PRNG seed (default 12345)
 * @returns the simulation context with the same shape as createGameContext(), minus ui/chargen/game
 */
export function createTestContext(seed = 12345) {
  const ctx = /** @type {GameContext} */ ({});

  // Storage — in-memory backend (indexedDB unavailable in bun)
  ctx.runs = createRuns(ctx);

  // Timeline — pass seed directly, bypassing crypto.getRandomValues
  ctx.timeline = createTimeline(ctx);
  ctx.timeline.init(seed);

  // Core simulation modules — same wiring order as context.js
  ctx.state = createState(ctx);
  ctx.dishes = createDishes(ctx);
  ctx.linens = createLinens(ctx);
  ctx.body = createBody(ctx);
  ctx.clothing = createClothing(ctx);
  ctx.items = createItems(ctx);
  ctx.mess = createMess(ctx);
  ctx.events = createEvents(ctx);
  ctx.character = createCharacter(ctx);
  ctx.world = createWorld(ctx);
  ctx.habits = createHabits(ctx);
  ctx.content = createContent(ctx);
  ctx.senses = createSenses(ctx);

  return ctx;
}
