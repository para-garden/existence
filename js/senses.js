// senses.js — sensory prose compositor.
// Builds ambient passages from observation sources via the realization engine.
//
// Architecture:
//   createSenses(ctx) — factory.
//     sense() — main entry point. Delegates to getObservations() → realize().
//               RNG consumption: N×4 calls where N = observations above salience threshold
//               if any surface; 0 if nothing passes.
//               Returns string or null.

import { realize } from './realization.js';

/**
 * An observation source: a thing in the world (or body) with observable properties.
 * Sources are the input layer of the procedural prose pipeline.
 * Properties are evaluated values — not prose. The realization engine turns them into text.
 *
 * @typedef {{
 *   id: string,
 *   areas?: string[],
 *   locations?: string[],
 *   channels: string[],
 *   available: (s: any, w: any) => boolean,
 *   salience: (s: any) => number,
 *   habituationTau?: number,
 *   properties: Object.<string, Object.<string, (s: any) => any>>,
 * }} ObservationSource
 */

/**
 * The result of observing a source: evaluated property values + salience at observation time.
 *
 * @typedef {{
 *   sourceId: string,
 *   channels: string[],
 *   salience: number,
 *   properties: Object.<string, Object.<string, any>>,
 * }} Observation
 */

// --- Factory ---

/** @param {GameContext} ctx */
export function createSenses(ctx) {

  // Minimum game-minutes between sensory fragment displays.
  // RNG is always consumed regardless — this only gates UI output.
  const SENSE_COOLDOWN_MINUTES = 12;
  let lastSensoryGameTime = -Infinity;

  // --- Observation source library ---
  // Sources model things in the world (and body) with observable properties.
  // They are the foundation of the procedural prose pipeline (realization engine TBD).
  // Properties are evaluated values — not prose. The realization engine turns them into text.
  //
  // Available sources for the current location are filtered by areas/locations + available().
  // Salience (0–1) weights how much a source forces attention in current NT state.
  //
  /** @type {ObservationSource[]} */
  const sources = [

    // === INDOOR: ACOUSTIC ===
    {
      id: 'fridge',
      areas: ['apartment'],
      channels: ['sound'],
      available: () => true,
      salience: s => {
        const gaba = s.get('gaba');
        // More salient when GABA low (filtering degraded)
        return gaba < 45 ? 0.35 + ctx.state.lerp01(gaba, 45, 20) * 0.5 : 0.15;
      },
      properties: {
        sound: {
          quality: () => 'hum',
          // Perceived louder when GABA low — same physical level, reduced filtering
          perceived_intensity: s => ctx.state.lerp01(s.get('gaba'), 65, 20),
        },
      },
    },
    {
      id: 'pipes',
      areas: ['apartment'],
      channels: ['sound'],
      available: s => s.get('gaba') < 52 || s.get('norepinephrine') > 52,
      salience: s => {
        const gaba = s.get('gaba');
        const ne = s.get('norepinephrine');
        return Math.max(
          gaba < 52 ? ctx.state.lerp01(gaba, 52, 25) * 0.4 : 0,
          ne > 52 ? ctx.state.lerp01(ne, 52, 80) * 0.3 : 0,
        );
      },
      properties: {
        sound: {
          quality: () => 'tick',
          rhythm: () => 'irregular',
        },
      },
    },
    {
      id: 'electronic_whine',
      areas: ['apartment'],
      channels: ['sound'],
      available: s => s.get('gaba') < 42 || s.get('norepinephrine') > 58,
      salience: s => {
        const gaba = s.get('gaba');
        const ne = s.get('norepinephrine');
        return Math.max(
          gaba < 42 ? ctx.state.lerp01(gaba, 42, 20) * 0.35 : 0,
          ne > 58 ? ctx.state.lerp01(ne, 58, 85) * 0.3 : 0,
        );
      },
      properties: {
        sound: {
          quality: () => 'whine',
          pitch: () => 'high',
        },
      },
    },
    {
      id: 'traffic_through_walls',
      areas: ['apartment'],
      channels: ['sound'],
      available: () => true,
      salience: s => {
        const ne = s.get('norepinephrine');
        // Low baseline; harder to screen out at high NE
        return ne > 55 ? 0.2 + ctx.state.lerp01(ne, 55, 80) * 0.4 : 0.1;
      },
      properties: {
        sound: {
          quality: () => 'muffled_traffic',
          source_distance: () => 'outside',
          filtered: () => true,
        },
      },
    },

    // === INDOOR: THERMAL ===
    {
      id: 'indoor_temperature',
      areas: ['apartment'],
      channels: ['thermal', 'touch'],
      // Only surfaces when meaningfully outside comfort zone
      available: s => s.get('temperature') < 16 || s.get('temperature') > 26,
      salience: s => {
        const temp = s.get('temperature');
        if (temp < 16) return ctx.state.lerp01(temp, 16, 5) * 0.7;
        if (temp > 26) return ctx.state.lerp01(temp, 26, 35) * 0.5;
        return 0;
      },
      properties: {
        thermal: {
          celsius:   s => s.get('temperature'),
          cold:      s => s.get('temperature') < 16,
          warm:      s => s.get('temperature') > 26,
          very_cold: s => s.get('temperature') < 5,
        },
      },
    },

    // === INTEROCEPTIVE: FATIGUE ===
    {
      id: 'fatigue',
      channels: ['interoception'],
      available: s => s.get('adenosine') > 55,
      salience: s => ctx.state.lerp01(s.get('adenosine'), 55, 95) * 0.8,
      properties: {
        interoception: {
          adenosine: s => s.get('adenosine'),
        },
      },
    },

    // === INTEROCEPTIVE: HUNGER ===
    {
      id: 'hunger_signal',
      channels: ['interoception'],
      available: s => s.get('hunger') > 45,
      salience: s => ctx.state.lerp01(s.get('hunger'), 45, 90) * 0.7,
      properties: {
        interoception: {
          hollow:    s => s.get('hunger') > 75,
          gnawing:   s => s.get('hunger') > 60 && s.get('hunger') <= 75,
          low_grade: s => s.get('hunger') > 45 && s.get('hunger') <= 60,
          irritable: s => s.get('hunger') > 65,
        },
      },
    },

    // === INTEROCEPTIVE: ANXIETY ===
    {
      id: 'anxiety_signal',
      channels: ['interoception'],
      available: s => s.get('gaba') < 45 || s.get('norepinephrine') > 60,
      salience: s => {
        const gaba = s.get('gaba');
        const ne = s.get('norepinephrine');
        return Math.max(
          gaba < 45 ? ctx.state.lerp01(gaba, 45, 20) * 0.6 : 0,
          ne > 60 ? ctx.state.lerp01(ne, 60, 85) * 0.5 : 0,
        );
      },
      properties: {
        interoception: {
          gaba: s => s.get('gaba'),
          ne: s => s.get('norepinephrine'),
        },
      },
    },

    // === OUTDOOR: ACOUSTIC ===
    {
      id: 'traffic_outdoor',
      areas: ['outside'],
      channels: ['sound'],
      available: () => true,
      salience: s => {
        const ne = s.get('norepinephrine');
        return ne > 55 ? 0.3 + ctx.state.lerp01(ne, 55, 85) * 0.4 : 0.25;
      },
      properties: {
        sound: {
          quality: () => 'traffic',
          filtered: () => false,
        },
      },
    },
    {
      id: 'street_voices',
      areas: ['outside'],
      channels: ['sound'],
      available: () => true,
      salience: () => 0.3,
      properties: {
        sound: {
          quality: () => 'voices',
          source_distance: () => 'nearby',
          intelligible: () => false, // heard but not parsed
        },
      },
    },

    // === PARK: ACOUSTIC ===
    // park_ambient: birds, rustling leaves, distant children, dogs — the acoustic texture of a park.
    // Located only at 'park'; salience 0.45 baseline. Season-aware via properties.
    // habituationTau: 40 (same as other acoustic sources).
    {
      id: 'park_ambient',
      locations: ['park'],
      channels: ['sound'],
      available: () => true,
      salience: s => {
        const ne = s.get('norepinephrine');
        // Higher NE makes the ambient more intrusive; adenosine softens it (sounds arrive through fog)
        const aden = s.get('adenosine');
        const base = 0.45;
        if (ne > 60) return base + ctx.state.lerp01(ne, 60, 85) * 0.25;
        if (aden > 65) return base - ctx.state.lerp01(aden, 65, 90) * 0.15; // muffled through fatigue
        return base;
      },
      properties: {
        sound: {
          quality: () => 'park',
          season: () => ctx.state.season(),
          birds: () => {
            const season = ctx.state.season();
            // Birds are quieter in winter, most active in spring/summer
            return season === 'winter' ? false : true;
          },
          // Children present during the day; absent early morning and night
          children: () => {
            const h = ctx.state.getHour();
            return h >= 9 && h < 19;
          },
        },
      },
    },

    // === LIBRARY: ACOUSTIC ===
    // library_ambient: the sounds of a building trying to be quiet — pages, distant keyboards, AC.
    // Located only at 'library'; salience 0.30 baseline (quiet space, low baseline).
    // Habituates quickly — library acoustics become background fast.
    {
      id: 'library_ambient',
      locations: ['library'],
      channels: ['sound'],
      available: () => true,
      salience: s => {
        const gaba = s.get('gaba');
        const aden = s.get('adenosine');
        const ne = s.get('norepinephrine');
        // Low GABA: filtering degraded — the hush breaks apart into its components
        if (gaba < 38) return 0.30 + ctx.state.lerp01(gaba, 38, 20) * 0.25;
        // High adenosine: sounds arrive muffled, far away — but still register
        if (aden > 65) return 0.30 - ctx.state.lerp01(aden, 65, 90) * 0.10;
        // High NE: every small sound separates from the hush
        if (ne > 60) return 0.30 + ctx.state.lerp01(ne, 60, 80) * 0.20;
        return 0.30;
      },
      habituationTau: 30, // slightly faster than other acoustics — library acoustics become background quickly
      properties: {
        sound: {
          quality: () => 'library',
          // Busy during core hours: 10am–6pm
          busy: () => {
            const h = ctx.state.getHour();
            return h >= 10 && h < 18;
          },
        },
      },
    },

    // === FRIEND'S PLACE: ACOUSTIC ===
    // friends_ambient: the acoustic texture of someone else's home — a different building's rhythms,
    // muffled neighbors, their specific heater, the quiet of a space that isn't yours.
    // Located only at 'friends_apartment'. Habituates slower than home (still slightly novel).
    // Salience 0.40 baseline.
    {
      id: 'friends_ambient',
      locations: ['friends_apartment'],
      channels: ['sound'],
      available: () => true,
      salience: s => {
        const gaba = s.get('gaba');
        const aden = s.get('adenosine');
        const ne = s.get('norepinephrine');
        const base = 0.40;
        // Low GABA: unfamiliar acoustic environment breaks through more
        if (gaba < 40) return base + ctx.state.lerp01(gaba, 40, 20) * 0.20;
        // High adenosine: sounds arrive further away, muffled through fatigue
        if (aden > 65) return base - ctx.state.lerp01(aden, 65, 90) * 0.12;
        // High NE: the not-your-home quality is more intrusive
        if (ne > 58) return base + ctx.state.lerp01(ne, 58, 80) * 0.18;
        return base;
      },
      habituationTau: 20, // slower than home (τ=40) — still a bit novel, habituates in ~hour
      properties: {
        sound: {
          quality: () => 'ambient_home',
          // Is this the first time here this session? (arrival freshness — connection_depth proxy)
          familiar: () => ctx.state.connectionDepthTier() === 'deep',
        },
      },
    },

    // === OUTDOOR: THERMAL ===
    {
      id: 'outdoor_temperature',
      areas: ['outside'],
      channels: ['thermal'],
      available: s => s.get('temperature') < 10 || s.get('temperature') > 28,
      salience: s => {
        const temp = s.get('temperature');
        if (temp < 10) return 0.4 + ctx.state.lerp01(temp, 10, -5) * 0.5;
        if (temp > 28) return 0.2 + ctx.state.lerp01(temp, 28, 40) * 0.4;
        return 0;
      },
      properties: {
        thermal: {
          celsius:   s => s.get('temperature'),
          cold:      s => s.get('temperature') < 10,
          warm:      s => s.get('temperature') > 28,
          very_cold: s => s.get('temperature') < 0,
          // Very cold hits immediately; warmth you notice more gradually
          immediate: s => s.get('temperature') < 8,
        },
      },
    },
    {
      id: 'wind',
      areas: ['outside'],
      channels: ['thermal', 'touch'],
      available: s => s.get('temperature') < 8,
      salience: s => {
        const temp = s.get('temperature');
        return temp < 8 ? 0.3 + ctx.state.lerp01(temp, 8, -5) * 0.5 : 0;
      },
      properties: {
        thermal: {
          quality: () => 'cutting',
          celsius: s => s.get('temperature'),
        },
      },
    },

    // === OUTDOOR: RAIN ===
    {
      id: 'rain',
      areas: ['outside'],
      channels: ['sound', 'touch', 'sight'],
      available: s => s.get('rain') === true,
      salience: () => 0.6,
      properties: {
        sound:  { quality: () => 'rain' },
        touch:  { wet: () => true, cold: s => s.get('temperature') < 12 },
        sight:  { quality: () => 'grey' },
      },
    },

    // === APARTMENT: VISUAL ===
    {
      id: 'window_light',
      areas: ['apartment'],
      channels: ['sight'],
      available: () => true,
      salience: () => {
        const h = ctx.state.getHour();
        const rain = ctx.state.get('rain');
        // Most salient at transitions: dawn, evening dimming, and when still dark
        if (h >= 6 && h < 9)   return rain ? 0.5 : 0.45;  // morning grey or early light
        if (h >= 17 && h < 21) return 0.4;                 // evening darkening
        if (h < 6 || h >= 21)  return 0.35;                // window is dark
        return rain ? 0.2 : 0.1;                           // full daylight — not grabby
      },
      properties: {
        sight: {
          dark:        () => { const h = ctx.state.getHour(); return h < 6 || h >= 22; },
          grey:        () => { const h = ctx.state.getHour(); return ctx.state.get('rain') && h >= 6 && h < 22; },
          early_light: () => { const h = ctx.state.getHour(); return !ctx.state.get('rain') && h >= 6 && h < 8; },
          dimming:     () => { const h = ctx.state.getHour(); return !ctx.state.get('rain') && h >= 17 && h < 20; },
          rain:        () => ctx.state.get('rain'),
        },
      },
    },

    // === APARTMENT: BATHROOM ===
    {
      id: 'bathroom_echo',
      locations: ['apartment_bathroom'],
      channels: ['sound'],
      available: () => true,
      salience: () => {
        const ne = ctx.state.get('norepinephrine');
        const gaba = ctx.state.get('gaba');
        // Tile acoustics are more noticeable when perceptual filtering is reduced
        return Math.max(
          ne > 55 ? ctx.state.lerp01(ne, 55, 80) * 0.35 : 0.1,
          gaba < 45 ? ctx.state.lerp01(gaba, 45, 25) * 0.3 : 0,
        );
      },
      properties: {
        sound: {
          quality: () => 'reverberant',
          surface: () => 'tile',
        },
      },
    },

    // === INTEROCEPTIVE: STRESS ===
    {
      id: 'stress_signal',
      channels: ['interoception'],
      available: s => s.get('stress') > 50,
      salience: s => ctx.state.lerp01(s.get('stress'), 50, 90) * 0.65,
      properties: {
        interoception: {
          high: s => s.get('stress') > 65,
        },
      },
    },

    // === INTEROCEPTIVE: CAFFEINE ===
    {
      id: 'caffeine_signal',
      channels: ['interoception'],
      available: s => s.get('caffeine_level') > 30,
      salience: s => {
        const c = s.get('caffeine_level');
        return c > 60 ? ctx.state.lerp01(c, 60, 100) * 0.55 : ctx.state.lerp01(c, 30, 60) * 0.2;
      },
      properties: {
        interoception: {
          jitter: s => s.get('caffeine_level') > 75 && s.get('norepinephrine') > 65,
          sharp:  s => s.get('caffeine_level') > 50,
          edge:   s => s.get('caffeine_level') > 30 && s.get('caffeine_level') <= 50,
        },
      },
    },

    // === WORK: ACOUSTIC ===
    {
      id: 'workplace_hvac',
      areas: ['work'],
      channels: ['sound'],
      available: () => true,
      salience: () => {
        const gaba = ctx.state.get('gaba');
        // Normally screened out; breaks through when anxiety degrades filtering
        return gaba < 45 ? 0.15 + ctx.state.lerp01(gaba, 45, 20) * 0.3 : 0.1;
      },
      properties: {
        sound: {
          quality: () => 'hvac',
          source: () => 'overhead',
        },
      },
    },
    {
      id: 'fluorescent_lights',
      areas: ['work'],
      channels: ['sight', 'sound'],
      available: s => s.get('gaba') < 48 || s.get('norepinephrine') > 55,
      salience: s => {
        const gaba = s.get('gaba');
        const ne = s.get('norepinephrine');
        return Math.max(
          gaba < 48 ? ctx.state.lerp01(gaba, 48, 22) * 0.4 : 0,
          ne > 55 ? ctx.state.lerp01(ne, 55, 80) * 0.35 : 0,
        );
      },
      properties: {
        sight: {
          quality: () => 'fluorescent',
          // Flickering is a real phenomenon with fluorescents; NE makes it impossible to ignore
          flicker: s => s.get('norepinephrine') > 65,
        },
        sound: {
          quality: () => 'hum',
          pitch: () => 'high',
        },
      },
    },
    {
      id: 'coworker_background',
      areas: ['work'],
      channels: ['sound'],
      available: () => true,
      salience: () => {
        const ne = ctx.state.get('norepinephrine');
        const socialEnergy = ctx.state.get('social_energy');
        // High NE makes voices intrude; depleted social energy makes them harder to screen
        return Math.max(
          ne > 58 ? ctx.state.lerp01(ne, 58, 85) * 0.45 : 0.15,
          socialEnergy < 30 ? ctx.state.lerp01(socialEnergy, 30, 0) * 0.3 : 0,
        );
      },
      properties: {
        sound: {
          quality: () => 'voices',
          source: () => 'open_office',
          // At very high NE, individual voices become almost parseable — not quite
          intelligible: s => s.get('norepinephrine') > 70,
        },
      },
    },

    // === INDOOR: SMELL ===
    // habituationTau: 10 — olfactory habituation is ~10 min (vs 40 for sound/visual).

    {
      id: 'stale_air',
      areas: ['apartment'],
      channels: ['smell'],
      habituationTau: 10,
      available: () => true,
      salience: s => {
        const aden = s.get('adenosine');
        const daylight = s.get('daylight_exposure');
        // More present when closed in all day, or too tired to open a window
        const tirednessBoost = aden > 55 ? ctx.state.lerp01(aden, 55, 85) * 0.15 : 0;
        const indoorBoost    = daylight < 30 ? ctx.state.lerp01(daylight, 30, 0) * 0.12 : 0;
        return 0.10 + tirednessBoost + indoorBoost;
      },
      properties: {
        smell: {
          // intensity: how much air movement the room has had. Rises with time spent inside.
          intensity: s => {
            const daylight = s.get('daylight_exposure');
            if (daylight < 10) return 0.80;
            if (daylight < 40) return 0.45;
            return 0.20;
          },
          // hedonics: mildly unpleasant, worsens with intensity
          hedonics: s => {
            const daylight = s.get('daylight_exposure');
            if (daylight < 10) return 0.20;
            if (daylight < 40) return 0.32;
            return 0.42;
          },
        },
      },
    },

    {
      id: 'dishes_smell',
      areas: ['apartment'],
      channels: ['smell'],
      habituationTau: 10,
      available: s => {
        const tier = s.messTier();
        return tier === 'messy' || tier === 'squalid';
      },
      salience: s => {
        const tier = s.messTier();
        if (tier === 'squalid') return 0.45;
        if (tier === 'messy')   return 0.28;
        return 0;
      },
      properties: {
        smell: {
          intensity: s => s.messTier() === 'squalid' ? 0.80 : 0.50,
          hedonics:  s => s.messTier() === 'squalid' ? 0.10 : 0.22,
        },
      },
    },

    {
      id: 'cleaning_smell',
      areas: ['apartment'],
      channels: ['smell'],
      habituationTau: 10,
      available: s => s.get('cleaning_smell_intensity') > 15,
      salience: s => {
        const intensity = s.get('cleaning_smell_intensity');
        return (intensity / 100) * 0.7;
      },
      properties: {
        smell: {
          intensity: s => s.get('cleaning_smell_intensity') / 100,
          hedonics:  () => 0.62, // clean and slightly chemical — mildly pleasant, familiar
          // High intensity: recently showered (>= ~70); lower: dishes or faded shower
          strong: s => s.get('cleaning_smell_intensity') >= 70,
        },
      },
    },

    {
      id: 'coffee_smell',
      areas: ['apartment'],
      channels: ['smell'],
      habituationTau: 10,
      available: s => s.get('coffee_smell_intensity') > 10,
      salience: s => {
        const intensity = s.get('coffee_smell_intensity');
        return (intensity / 100) * 0.55;
      },
      properties: {
        smell: {
          intensity: s => s.get('coffee_smell_intensity') / 100,
          hedonics:  () => 0.72, // coffee aroma is broadly pleasant; broadly well-liked (de Wijk & Cain 1994)
          fresh: s => s.get('coffee_smell_intensity') >= 60,
        },
      },
    },

    {
      id: 'food_smell',
      areas: ['apartment'],
      channels: ['smell'],
      habituationTau: 10,
      available: s => s.get('food_smell_intensity') > 10,
      salience: s => {
        const intensity = s.get('food_smell_intensity');
        // Hunger elevates food salience — hungry nose notices cooking more.
        const hungerBoost = ctx.state.get('hunger') > 55
          ? ctx.state.lerp01(ctx.state.get('hunger'), 55, 85) * 0.15
          : 0;
        return (intensity / 100) * 0.40 + hungerBoost;
      },
      properties: {
        smell: {
          intensity: s => s.get('food_smell_intensity') / 100,
          hedonics: s => {
            // Hunger makes food smells more rewarding; gastritis can make them nauseating.
            const hungry = ctx.state.get('hunger') > 60;
            const gastritis = ctx.state.gastritisTier();
            if (gastritis === 'burn' || gastritis === 'ache') return 0.30;
            return hungry ? 0.78 : 0.62;
          },
          strong: s => s.get('food_smell_intensity') >= 60,
        },
      },
    },

    // === OUTDOOR: SMELL ===
    // habituationTau: 10 — same olfactory habituation rate as indoor smell.

    {
      id: 'petrichor',
      areas: ['outside'],
      channels: ['smell'],
      habituationTau: 10,
      available: s => s.get('rain') === true,
      // Noticeable; change spike on rain-start elevates it further
      salience: () => 0.48,
      properties: {
        smell: {
          intensity: () => 0.65,
          hedonics:  () => 0.75,  // broadly pleasant; sentiment modulation deferred
        },
      },
    },

    {
      id: 'cold_air_smell',
      areas: ['outside'],
      channels: ['smell'],
      habituationTau: 10,
      // Very cold air has a distinct quality — metallic, clean, almost nothing
      available: s => s.get('temperature') < 4,
      salience: s => ctx.state.lerp01(s.get('temperature'), 4, -12) * 0.35,
      properties: {
        smell: {
          intensity: s => ctx.state.lerp01(s.get('temperature'), 4, -12),
          hedonics:  () => 0.55,  // neutral; clean rather than pleasant or unpleasant
          // Below −5°C the clean emptiness has a sharp edge
          sharp: s => s.get('temperature') < -5,
        },
      },
    },

    {
      id: 'seasonal_outside_smell',
      areas: ['outside'],
      channels: ['smell'],
      habituationTau: 10,
      available: s => {
        const season = s.season();
        const zone   = s.climateZone();
        if (zone !== 'temperate') return false;
        return season === 'summer' || season === 'autumn' || season === 'spring';
      },
      salience: s => {
        const season = s.season();
        if (season === 'autumn') return 0.38;  // leaf decay is strongest
        if (season === 'summer') return 0.28;  // cut grass
        if (season === 'spring') return 0.22;  // bloom, lighter
        return 0;
      },
      properties: {
        smell: {
          // season_type is genuinely needed — one source, three distinct smells
          season_type: s => {
            const season = s.season();
            if (season === 'summer') return 'cut_grass';
            if (season === 'autumn') return 'leaf_decay';
            return 'bloom';
          },
          intensity: s => {
            const season = s.season();
            if (season === 'autumn') return 0.70;
            if (season === 'summer') return 0.55;
            return 0.40;
          },
          hedonics: s => {
            const season = s.season();
            if (season === 'autumn') return 0.48;  // earthy, neutral
            if (season === 'summer') return 0.70;  // pleasant, grass
            return 0.65;                           // pleasant, spring
          },
        },
      },
    },

    // === NIGHT: OUTDOOR ===
    // night_city_ambient: the city at 1am–6am. Traffic that moves without stopping.
    // Sounds that exist only at this hour — trucks, wind through empty space,
    // someone's car with music. The silence between sounds is the main texture.
    {
      id: 'night_city_ambient',
      areas: ['outside'],
      locations: ['street', 'bus_stop'],
      channels: ['sound'],
      available: () => {
        const tod = ctx.state.timeOfDay();
        return tod >= 60 && tod <= 360; // 1am–6am
      },
      salience: s => {
        const ne = s.get('norepinephrine');
        const aden = s.get('adenosine');
        const gaba = s.get('gaba');
        let base = 0.50;
        // NE-high: hypervigilant — each sound separates from the silence
        if (ne > 60) base += ctx.state.lerp01(ne, 60, 85) * 0.20;
        // Adenosine-high: sounds feel far, arrive muffled through fog
        if (aden > 60) base -= ctx.state.lerp01(aden, 60, 90) * 0.15;
        // GABA-low: threat-tracking raises salience
        if (gaba < 45) base += ctx.state.lerp01(gaba, 45, 20) * 0.18;
        return Math.max(0.25, Math.min(0.80, base));
      },
      habituationTau: 60, // night shift workers habituate to it slowly
      properties: {
        sound: {
          quality: () => 'night_city',
          deep_night: () => {
            const tod = ctx.state.timeOfDay();
            return tod >= 120 && tod <= 240; // 2am–4am is deepest
          },
        },
      },
    },

    // night_transit: waiting at the bus stop at night.
    // The other people at bus stops at this hour are there because they have to be.
    {
      id: 'night_transit',
      areas: ['outside'],
      locations: ['bus_stop'],
      channels: ['sound'],
      available: () => {
        const tod = ctx.state.timeOfDay();
        return tod >= 60 && tod <= 360; // 1am–6am
      },
      salience: s => {
        const ne = s.get('norepinephrine');
        const aden = s.get('adenosine');
        let base = 0.45;
        // NE-high: the sparse stop is more present
        if (ne > 58) base += ctx.state.lerp01(ne, 58, 82) * 0.18;
        // Adenosine-high: the wait feels longer, heavier
        if (aden > 65) base += ctx.state.lerp01(aden, 65, 90) * 0.10;
        return Math.max(0.25, Math.min(0.75, base));
      },
      habituationTau: 40,
      properties: {
        sound: {
          quality: () => 'transit_night',
          sparse: () => {
            const tod = ctx.state.timeOfDay();
            return tod >= 90; // sparsest in deepest hours
          },
        },
      },
    },

    // night_workplace_light: fluorescent light quality at night in the workplace.
    // Not the same as daytime fluorescent — the contrast with outside dark is total.
    // Adenosine raises salience (fatigue makes the light feel harsher).
    {
      id: 'night_workplace_light',
      areas: ['work'],
      channels: ['sight'],
      available: () => {
        const tod = ctx.state.timeOfDay();
        return tod >= 120 && tod <= 360; // 2am–6am
      },
      salience: s => {
        const aden = s.get('adenosine');
        const ne = s.get('norepinephrine');
        const ser = s.get('serotonin');
        let base = 0.35;
        // Adenosine-high: fatigue makes the light feel harsher, more present
        if (aden > 55) base += ctx.state.lerp01(aden, 55, 90) * 0.25;
        // NE-high: everything more vivid, each flicker registers
        if (ne > 58) base += ctx.state.lerp01(ne, 58, 82) * 0.20;
        // Low serotonin: the light has an edge to it
        if (ser < 40) base += ctx.state.lerp01(ser, 40, 20) * 0.15;
        return Math.max(0.20, Math.min(0.80, base));
      },
      habituationTau: 20, // habituates — you stop seeing it after a while
      properties: {
        sight: {
          quality: () => 'fluorescent_night',
        },
      },
    },

    // === WORK: SMELL ===

    {
      id: 'office_ambient_smell',
      areas: ['work'],
      channels: ['smell'],
      habituationTau: 10,
      available: () => true,
      salience: s => {
        const gaba = s.get('gaba');
        const aden = s.get('adenosine');
        // Mostly screened; surfaces when perceptual filtering is degraded or dissociated
        if (gaba < 38 || aden > 72) return 0.28;
        return 0.12;
      },
      properties: {
        smell: {
          intensity: s => {
            const gaba = s.get('gaba');
            const aden = s.get('adenosine');
            return (gaba < 38 || aden > 72) ? 0.40 : 0.20;
          },
          hedonics: () => 0.38,  // mildly institutional/unpleasant
        },
      },
    },

    // === STREET: NEIGHBOR ===
    // neighbor_presence: the recurring person seen on the block.
    // Visual channel — you see them, a specific recognizable presence.
    // Only available once seen at least once (tier > 'unseen') during daytime.
    // Habituates fairly quickly (tau=45 min) — when known well, they're just part of the block.
    // NT modulation: NE-high raises salience (hypervigilant, notice everyone);
    //   serotonin-high at 'known' tier lowers it (comfortable familiarity, don't need to look).
    {
      id: 'neighbor_presence',
      locations: ['street'],
      channels: ['visual'],
      available: () => {
        if (ctx.state.get('neighbor_archetype') === null) return false;
        const tier = ctx.state.neighborTier();
        if (tier === 'unseen') return false;
        // Daytime only — 6am to 10pm (tod 360–1320)
        const tod = ctx.state.timeOfDay();
        return tod >= 360 && tod <= 1320;
      },
      salience: () => {
        const ne = ctx.state.get('norepinephrine');
        const ser = ctx.state.get('serotonin');
        const tier = ctx.state.neighborTier();
        let base = 0.55;
        // NE-high: hypervigilant — you notice everyone
        if (ne > 60) base += ctx.state.lerp01(ne, 60, 85) * 0.15;
        // Serotonin-high at 'known': comfortable, don't need to look — they're just there
        if (tier === 'known' && ser > 55) base -= ctx.state.lerp01(ser, 55, 75) * 0.15;
        return Math.max(0.25, Math.min(0.80, base));
      },
      habituationTau: 45,
      properties: {
        visual: {
          archetype: () => ctx.state.get('neighbor_archetype'),
          tier: () => ctx.state.neighborTier(),
          name: () => ctx.state.get('neighbor_name'),
          pronoun_set: () => ctx.state.get('neighbor_pronoun_set'),
        },
      },
    },
    {
      id: 'shelter_ambient',
      locations: ['shelter'],
      channels: ['sound', 'smell'],
      available: () => ctx.state.get('displaced') === true,
      salience: s => {
        const ne = s.get('norepinephrine');
        const gaba = s.get('gaba');
        // Hypervigilance in shared spaces; low GABA can't filter
        const neBoost = Math.max(0, Math.min(1, (ne - 45) / 55)) * 0.25;
        const gabaBoost = Math.max(0, Math.min(1, (50 - gaba) / 50)) * 0.15;
        return Math.min(0.75, 0.45 + neBoost + gabaBoost);
      },
      habituationTau: 30, // Shared space stays alerting — habituation is slow
      properties: {
        sound: {
          quality: () => 'shared_space',
          intensity: () => 0.65,
        },
        smell: {
          quality: () => 'institutional',
          intensity: () => 0.40,
        },
      },
    },
  ];

  // --- Observation functions ---

  /**
   * Filter sources for the current location and state.
   * No RNG consumed.
   * @returns {ObservationSource[]}
   */
  function getAvailableSources() {
    const locationId = ctx.world.getLocationId();
    const location = ctx.world.getLocation(locationId);
    const area = location ? location.area : null;

    return sources.filter(src => {
      if (src.locations && !src.locations.includes(locationId)) return false;
      if (src.areas && !src.areas.includes(area ?? '')) return false;
      return src.available(ctx.state, ctx.world);
    });
  }

  /**
   * Evaluate a source's properties to produce an Observation.
   * No RNG consumed.
   * @param {ObservationSource} source
   * @returns {Observation}
   */
  function observe(source) {
    const evaluatedProperties = {};
    for (const [channel, props] of Object.entries(source.properties)) {
      evaluatedProperties[channel] = {};
      for (const [key, fn] of Object.entries(props)) {
        evaluatedProperties[channel][key] = fn(ctx.state);
      }
    }
    return {
      sourceId: source.id,
      channels: source.channels,
      salience: source.salience(ctx.state),
      properties: evaluatedProperties,
    };
  }

  /**
   * Get all observations for the current location and state,
   * sorted by effective salience descending. No RNG consumed.
   * Effective salience = (raw_salience × habituation_factor) + change_spike.
   * The change_spike is the orienting response — a decaying boost when a source's
   * discrete state (tier/quality/condition) changes. See getChangeSalience().
   * @returns {Observation[]}
   */
  function getObservations() {
    // Static sources filtered by location/area/availability
    const staticSources = getAvailableSources();

    // Dynamic item sources for current room
    const roomId = ctx.world.getLocationId();
    const itemSources = ctx.items.getItemSources(roomId);

    return [...staticSources, ...itemSources]
      .map(src => {
        const obs = observe(src);
        const spike = getChangeSalience(src.id, obs.properties);
        const hab = habituationFactor(src.habituationTau ?? 40);
        return { ...obs, salience: obs.salience * hab + spike };
      })
      .sort((a, b) => b.salience - a.salience);
  }

  // --- NT state → structure hint ---

  /**
   * Perceptual threshold: minimum effective salience for an observation to surface.
   * Varies by NT state — anxious / overwhelmed lowers the bar (more things break through);
   * dissociated raises it (fewer things penetrate the haze).
   * Constitutional sensory_sensitivity (−1 to +1) applies a multiplicative modifier:
   * hypersensitive characters (+1) → threshold × 0.75 (more things surface);
   * hyposensitive characters (−1) → threshold × 1.25 (fewer things surface).
   * @param {string} hint
   * @returns {number}
   */
  function getSalienceThreshold(hint) {
    let threshold;
    if (hint === 'overwhelmed') threshold = 0.25;
    else if (hint === 'anxious')     threshold = 0.30;
    else if (hint === 'heightened')  threshold = 0.40;
    else if (hint === 'flat')        threshold = 0.55;
    else if (hint === 'dissociated') threshold = 0.60;
    else                             threshold = 0.50; // calm

    const sensSens = ctx.state.get('sensory_sensitivity') ?? 0;
    threshold *= (1.0 - sensSens * 0.25); // Approximation debt (sensory processing): sensitivity→threshold coefficient 0.25 chosen
    return Math.max(0.10, Math.min(0.80, threshold));
  }

  /**
   * Salience multiplier for a source based on time spent at the current location.
   * Starts at 1.0 on arrival, decays toward a familiarity-derived floor with time constant tau.
   * Smell sources use τ≈10 min (olfactory habituation); other modalities use τ=40 min.
   *
   * Floor derivation:
   *   floor = 0.15 + (0.40 - 0.15) × (1 − familiarity)
   * Unfamiliar (familiarity=0) → floor=0.40 (original behavior, no change).
   * Deeply familiar (familiarity→1) → floor→0.15 (deep background, almost never surfaces).
   *
   * Approximation debt (habituation): floor bounds 0.15 and 0.40 are chosen; no empirical
   * data directly quantifies the habituation asymptote as a function of prior exposure.
   *
   * Even fully habituated sources can still surface under high-arousal NT states,
   * because those states lower the perceptual threshold below the habituated salience.
   * No PRNG — pure state read.
   * @param {number} tau — habituation time constant in game-minutes
   * @returns {number}
   */
  function habituationFactor(tau) {
    const minutesAtLocation = Math.max(0, ctx.state.get('time') - ctx.state.get('location_arrival_time'));
    const locationId = ctx.world.getLocationId();
    const familiarity = ctx.state.getLocationFamiliarity(locationId);
    const floor = 0.15 + (0.40 - 0.15) * (1 - familiarity); // Approximation debt (habituation)
    return floor + (1 - floor) * Math.exp(-minutesAtLocation / tau);
  }

  // --- Change detection (orienting response) ---
  // Tracks discrete property state per source. When a source's tier/quality/condition
  // label changes, a salience spike fires and decays over ~12 minutes.
  // This is the mechanism for noticing the fridge kick on, pipes pop, or rain start —
  // sources whose habituated salience is below threshold but whose state just changed.
  //
  // Only string and boolean values are included in change fingerprints —
  // continuous numeric values drift at every tick and would generate constant false positives.
  //
  // Spike magnitude: 0.4 — enough to surface a fully-habituated source (floor 0.4×min_salience)
  // across all NT thresholds (highest threshold = 0.60 dissociated).
  // Decay constant: 12 minutes — matches sense() cooldown; ~3 calls for spike to fade.

  const changeTracker = new Map(); // sourceId -> { prevKey: string, changeTime: number|null }
  const CHANGE_SPIKE_MAG = 0.4;
  const CHANGE_DECAY_MIN = 12;

  /**
   * Build a change-detection fingerprint from evaluated properties.
   * Excludes numeric values — only string and boolean properties count as meaningful state.
   * @param {Object} properties — evaluated channel→key→value map
   * @returns {string}
   */
  function discreteKey(properties) {
    const out = {};
    for (const [channel, props] of Object.entries(properties)) {
      const discrete = {};
      for (const [k, v] of Object.entries(props)) {
        if (typeof v === 'string' || typeof v === 'boolean') discrete[k] = v;
      }
      if (Object.keys(discrete).length > 0) out[channel] = discrete;
    }
    return JSON.stringify(out);
  }

  /**
   * Detect discrete state changes for a source and return the current spike salience.
   * Updates changeTracker as a side effect. No PRNG consumed.
   * - First observation: establishes baseline, returns 0.
   * - State change: resets changeTime to now, returns CHANGE_SPIKE_MAG.
   * - No change: returns CHANGE_SPIKE_MAG × exp(−minutesSince / CHANGE_DECAY_MIN).
   * @param {string} sourceId
   * @param {Object} properties — evaluated properties for this observation cycle
   * @returns {number}
   */
  function getChangeSalience(sourceId, properties) {
    const now = ctx.state.get('time');
    const key = discreteKey(properties);
    const tracked = changeTracker.get(sourceId);

    if (!tracked) {
      // First observation — establish baseline; no spike
      changeTracker.set(sourceId, { prevKey: key, changeTime: null });
      return 0;
    }

    if (key !== tracked.prevKey) {
      // Discrete state changed — orienting spike fires; update baseline
      changeTracker.set(sourceId, { prevKey: key, changeTime: now });
      return CHANGE_SPIKE_MAG;
    }

    // No change — return decaying spike from last change time
    if (tracked.changeTime === null) return 0;
    const minutesSince = Math.max(0, now - tracked.changeTime);
    return CHANGE_SPIKE_MAG * Math.exp(-minutesSince / CHANGE_DECAY_MIN);
  }

  function getStructureHint() {
    const gaba = ctx.state.get('gaba');
    const ne = ctx.state.get('norepinephrine');
    const aden = ctx.state.get('adenosine');
    const ser = ctx.state.get('serotonin');
    const dopa = ctx.state.get('dopamine');

    if (gaba < 30 && ne > 70) return 'overwhelmed';
    if (gaba < 40 || ne > 60) return 'anxious';
    if (aden > 75 && ne < 45) return 'dissociated';
    if (ser > 60 && dopa > 55 && ne > 50) return 'heightened';
    if (ser < 35 && dopa < 40) return 'flat';
    return 'calm';
  }

  /**
   * NT context for the realization engine — normalized 0–1 values.
   * @returns {{ gaba: number, ne: number, aden: number, serotonin: number, dopamine: number, synesthesia: boolean, apd: boolean }}
   */
  function getNtCtx() {
    return {
      gaba:        ctx.state.get('gaba')           / 100,
      ne:          ctx.state.get('norepinephrine') / 100,
      aden:        ctx.state.get('adenosine')      / 100,
      serotonin:   ctx.state.get('serotonin')      / 100,
      dopamine:    ctx.state.get('dopamine')       / 100,
      synesthesia: ctx.state.get('synesthesia')    ?? false,
      apd:         ctx.state.get('apd')            ?? false,
    };
  }

  /**
   * Compose a sensory passage for the current location and state.
   * Delegates to the observation source pipeline and realization engine.
   * RNG consumption: N×4 calls (N = observations above salience threshold)
   * if any surface; 0 if nothing passes the threshold.
   * @returns {string | null}
   */
  function sense() {
    const hint = getStructureHint();
    const threshold = getSalienceThreshold(hint);
    const observations = getObservations().filter(o => o.salience >= threshold);
    if (observations.length === 0) return null;
    return realize(observations, hint, getNtCtx(), () => ctx.timeline.random());
  }

  /**
   * Compose a background sensory observation during an atmospheric interaction.
   * Mind is partially occupied, so the salience threshold is slightly higher than idle.
   * hint controls threshold tuning: 'doing' (hands busy), 'waiting' (attention suspended),
   * 'moving' (body in motion, outdoors).
   *
   * RNG consumption: N×4 calls (N = observations above threshold) if any surface; 0 otherwise.
   * Must be called unconditionally in the interaction execute() to keep replay aligned.
   * Returns string or null (null if nothing clears the threshold — caller ignores it).
   * @param {'doing' | 'waiting' | 'moving'} [hint]
   * @returns {string | null}
   */
  function midSense(hint) {
    const structureHint = getStructureHint();
    // Base threshold slightly above idle sense() — attention is partially elsewhere.
    // 'doing': hands occupied; slight raise.
    // 'waiting': suspended attention; equivalent to idle (mind is free, body stopped).
    // 'moving': body in motion outdoors; sensory input elevated, threshold stays near idle.
    let baseThreshold = getSalienceThreshold(structureHint);
    if (hint === 'doing') {
      baseThreshold = Math.min(baseThreshold + 0.08, 0.75);
    }
    // 'waiting' and 'moving' keep the base threshold unchanged.
    const observations = getObservations().filter(o => o.salience >= baseThreshold);
    if (observations.length === 0) return null;
    return realize(observations, structureHint, getNtCtx(), () => ctx.timeline.random());
  }

  /**
   * Compose a single first-impression observation for location arrival.
   * Only the highest-salience source fires — a first impression, not a full passage.
   * RNG consumption: exactly 4 calls if any source is available; 0 otherwise.
   * No cooldown — arrival is a distinct context from idle sensing.
   * @returns {string | null}
   */
  function arrivalSense() {
    const hint = getStructureHint();
    const threshold = getSalienceThreshold(hint);
    // Habituation is 1.0 right after travelTo() — this uses the same getObservations()
    // which applies habituationFactor(), but timeDelta = 0 so factor = 1.0.
    const observations = getObservations().filter(o => o.salience >= threshold);
    if (observations.length === 0) return null;
    return realize(observations, hint, getNtCtx(), () => ctx.timeline.random());
  }

  /**
   * Whether enough game time has passed since last sensory display.
   * Gates UI output only — RNG consumption is always the same regardless.
   * @returns {boolean}
   */
  function canDisplay() {
    return ctx.state.get('time') - lastSensoryGameTime >= SENSE_COOLDOWN_MINUTES;
  }

  function markDisplayed() {
    lastSensoryGameTime = ctx.state.get('time');
  }

  return {
    sense,
    arrivalSense,
    midSense,
    canDisplay,
    markDisplayed,
    getStructureHint,
    getObservations,
  };
}
