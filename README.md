# existence

A text-based HTML5 game. Power anti-fantasy — constrained agency without judgment. No stats visible. All state hidden. Prose carries everything.

You play as someone trying to get through the day. The simulation runs underneath: neurochemistry, sleep debt, financial anxiety, the weight of unanswered messages. None of it surfaces as numbers. What you see is what the character produces — options that feel closer or further, text that reads differently depending on things you can't name.

Tone: Porpentine's *With Those We Love Alive* (2014). Body-aware, fragmentary, dissociation through texture not description.

## Running

```sh
bun serve.js
```

localhost:3000. No build step. Requires [bun](https://bun.sh).

A `flake.nix` is provided if you use Nix.

## Architecture

ES modules, factory functions, no global mutable state. `createGameContext()` in `context.js` wires all modules.

Key modules: `state.js` (28 neurochemical systems + hidden state), `content.js` (all prose and interaction definitions), `timeline.js` (seeded PRNG + action log + replay), `game.js` (orchestration), `senses.js` / `realization.js` (procedural prose pipeline).

All randomness through `Timeline.random()`. Same seed + same action sequence = same world state.

Save format: IndexedDB. One run per playthrough. Autosave on every action.

## Design

See `docs/design/` for the full design documentation — `philosophy.md`, `emotions.md`, `overview.md`, `health.md`, and others. `STATUS.md` tracks what's currently implemented. `INFLUENCES.md` catalogs prior art and atmospheric references.

## Tests

```sh
bun test
```

Tests cover the sensory compositor (`tests/senses.test.js`) and realization engine (`tests/realization.test.js`).
