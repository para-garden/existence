// context.js — wires all modules into a single game context
// Each factory receives ctx and accesses siblings through it.
// Circular deps resolve naturally — factories capture ctx by reference,
// and no methods are called during construction.

import { NameData } from './names.js';
import { createRuns } from './runs.js';
import { createTimeline } from './timeline.js';
import { createState } from './state.js';
import { createEvents } from './events.js';
import { createHabits } from './habits.js';
import { createCharacter } from './character.js';
import { createWorld } from './world.js';
import { createContent } from './content.js';
import { createUI } from './ui.js';
import { createChargen } from './chargen.js';
import { createDishes } from './dishes.js';
import { createLinens } from './linens.js';
import { createBody } from './body.js';
import { createClothing } from './clothing.js';
import { createItems } from './items.js';
import { createMess } from './mess.js';
import { createSenses } from './senses.js';
import { createGame } from './game.js';

export { NameData };

export function createGameContext() {
  const ctx = {};
  ctx.runs = createRuns(ctx);
  ctx.timeline = createTimeline(ctx);
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
  ctx.ui = createUI(ctx);
  ctx.chargen = createChargen(ctx);
  ctx.game = createGame(ctx);
  return ctx;
}
