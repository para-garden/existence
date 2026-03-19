// e2e-snapshot-gen.js — one-time script to generate the smoke-01.json fixture.
// Run with: bun tests/e2e-snapshot-gen.js
// Output is printed as JSON; redirect to tests/fixtures/smoke-01.json.

import { createTestContext } from '../js/test-context.js';
import { createChargen } from '../js/chargen.js';

const SEED = 42;

// ---------------------------------------------------------------------------
// Character setup (mirrors integration.test.js makeCtxWithChar)
// ---------------------------------------------------------------------------

function makeCtxWithChar(seed) {
  const ctx = createTestContext(seed);
  const chargen = createChargen(ctx);
  const char = chargen.generateRandom();

  const sim = chargen.simulateFinancialHistory(char.backstory, char.age_stage, char.job_type);
  if (char.pronouns === 'she/her' || char.pronouns === 'she/they') {
    sim.hourly_rate = Math.round(sim.hourly_rate * 0.82 * 100) / 100;
  }
  char.financial_sim = sim;

  if (!char.labor_arrangement) {
    char.labor_arrangement = {
      type: 'fixed',
      day_pattern: 'weekdays',
      work_days: [1, 2, 3, 4, 5],
      shift_start: 540,
      shift_end: 1020,
      reveal_horizon_hours: null,
      reveal_tod: null,
      work_days_per_week: 5,
    };
  }

  ctx.character.set(char);
  ctx.state.init();
  ctx.items.reset();
  ctx.character.applyToState();
  ctx.events.init();
  ctx.dishes.reset();
  ctx.linens.reset();
  ctx.clothing.reset();

  return ctx;
}

// ---------------------------------------------------------------------------
// Headless replay helpers (mirrors game.js replayActions / replayInteraction /
// replayMove / replayIdle / consumeEvents)
// ---------------------------------------------------------------------------

function consumeEvents(ctx) {
  const events = ctx.world.checkEvents();
  for (const eventId of events) {
    const fn = ctx.content.eventText[eventId];
    if (fn) fn();
  }
  ctx.content.generateIncomingMessages();
}

function replayInteraction(ctx, id, data = {}) {
  if (!id) return;
  const interaction = ctx.content.getInteraction(id);
  if (interaction) interaction.execute(data);
}

function replayMove(ctx, destId) {
  if (!destId) return;
  const fromId = ctx.world.getLocationId();
  const wasHome = ctx.world.locations[fromId]?.area === 'apartment';
  ctx.world.travelTo(destId);
  if (wasHome && ctx.world.locations[destId]?.area !== 'apartment') {
    ctx.items.resolveLeaveHome();
  }
  ctx.content.transitionText(fromId, destId);
  ctx.senses.arrivalSense();
}

function replayIdle(ctx) {
  ctx.content.idleThoughts();
  const ivTier = ctx.state.innerVoiceTier();
  if (ivTier) ctx.content.innerVoiceThoughts();
  ctx.senses.sense();
  ctx.state.advanceTime(ctx.timeline.randomInt(2, 5));
}

function runActions(ctx, actions) {
  // Consume initial events + messages — same as resumeRun in game.js
  const initEvents = ctx.world.checkEvents();
  for (const eventId of initEvents) {
    const fn = ctx.content.eventText[eventId];
    if (fn) fn();
  }
  ctx.content.generateIncomingMessages();

  for (const entry of actions) {
    const { type, id, destination, data } = entry;
    if (type === 'interact') {
      replayInteraction(ctx, id, data || {});
      consumeEvents(ctx);
    } else if (type === 'move') {
      replayMove(ctx, destination);
      consumeEvents(ctx);
    } else if (type === 'idle') {
      replayIdle(ctx);
    } else if (type === 'observe_time') {
      ctx.state.observeTime();
    } else if (type === 'observe_money') {
      ctx.state.observeMoney();
    }
  }
}

// ---------------------------------------------------------------------------
// Action sequence — deterministic, no availability checks needed for fixture
// generation since we're recording the sequence we intend to replay
// ---------------------------------------------------------------------------

// Start at bedroom, time = 6:30. Sleep first (restores energy from low state).
// Then: kitchen → make_coffee → observe_time → move to bus_stop → workplace →
// do_work (twice) → move back to bus_stop → street → kitchen → lie_there.

// Force low energy so sleep fires and duration is meaningful.
const ctx = makeCtxWithChar(SEED);

// Apply initial overrides in the same order as replayFixture() in e2e.test.js:
// iterate fixture.initialOverrides, then set location_arrival_time to the final time.
const fixture_overrides = {
  location: 'apartment_bedroom',
  energy: 5,
  adenosine: 80,
  time: 30,
};
for (const [key, value] of Object.entries(fixture_overrides)) {
  ctx.state.set(key, value);
}
ctx.state.set('location_arrival_time', ctx.state.get('time')); // = 30

const actions = [
  // 1. Sleep — long sleep from depleted energy; adenosine clears
  { type: 'interact', id: 'sleep' },
  // 2. Idle in bedroom after waking
  { type: 'idle' },
  // 3. Move to kitchen
  { type: 'move', destination: 'apartment_kitchen' },
  // 4. Make coffee
  { type: 'interact', id: 'make_coffee' },
  // 5. Check time
  { type: 'observe_time' },
  // 6. Move to street (leave home)
  { type: 'move', destination: 'street' },
  // 7. Move to bus stop
  { type: 'move', destination: 'bus_stop' },
  // 8. Move to workplace
  { type: 'move', destination: 'workplace' },
  // 9. Do work
  { type: 'interact', id: 'do_work' },
  // 10. Do work again
  { type: 'interact', id: 'do_work' },
  // 11. Check phone at work
  { type: 'interact', id: 'check_phone_work' },
  // 12. Do work one more time
  { type: 'interact', id: 'do_work' },
  // 13. Move back to bus stop
  { type: 'move', destination: 'bus_stop' },
  // 14. Move to street
  { type: 'move', destination: 'street' },
  // 15. Move home
  { type: 'move', destination: 'apartment_kitchen' },
  // 16. Observe money
  { type: 'observe_money' },
  // 17. Move to bedroom
  { type: 'move', destination: 'apartment_bedroom' },
  // 18. Idle
  { type: 'idle' },
];

runActions(ctx, actions);

// ---------------------------------------------------------------------------
// Capture snapshot
// ---------------------------------------------------------------------------

const finalState = ctx.state.getAll();
const snapshot = {
  time: finalState.time,
  energy: finalState.energy,
  stress: finalState.stress,
  hunger: finalState.hunger,
  money: finalState.money,
  social: finalState.social,
  adenosine: finalState.adenosine,
  serotonin: finalState.serotonin,
  dopamine: finalState.dopamine,
  job_standing: finalState.job_standing,
  location: finalState.location,
  hours_worked_period: finalState.hours_worked_period,
  energyTier: ctx.state.energyTier(),
  stressTier: ctx.state.stressTier(),
  moneyTier: ctx.state.moneyTier(),
};

const fixture = {
  seed: SEED,
  // Initial state overrides applied before runActions
  initialOverrides: {
    location: 'apartment_bedroom',
    energy: 5,
    adenosine: 80,
    time: 30,
  },
  actions,
  snapshot,
};

console.log(JSON.stringify(fixture, null, 2));
