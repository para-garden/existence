// chargen.js — character generation and creation UI flow

import { NameData } from './names.js';
import { itemSizeLabel } from './clothing.js';

/** @param {GameContext} ctx */
export function createChargen(ctx) {

  // --- Name generation ---

  /**
   * Generate a gendered first name using expression dimensions to weight pool selection.
   * 2 charRng calls: 1 for pool selection, 1 for charWeightedPick.
   * @param {Set<string>} exclude
   * @param {number} expressionFem — expression_femininity (0-100)
   * @param {number} expressionMasc — expression_masculinity (0-100)
   */
  function generateGenderedFirstName(exclude, expressionFem, expressionMasc) {
    const poolRoll = ctx.timeline.charRandom(); // 1 call: pool selection
    let pool;
    if (expressionFem > expressionMasc + 10) {
      // Fem-leaning: 85% F pool, 15% M pool
      pool = poolRoll < 0.85 ? NameData.firstF : NameData.firstM;
    } else if (expressionMasc > expressionFem + 10) {
      // Masc-leaning: 85% M pool, 15% F pool
      pool = poolRoll < 0.85 ? NameData.firstM : NameData.firstF;
    } else {
      // Roughly equal: 50/50
      pool = poolRoll < 0.50 ? NameData.firstF : NameData.firstM;
    }
    let name, attempts = 0;
    do {
      name = ctx.timeline.charWeightedPick(pool);
      attempts++;
    } while (exclude.has(name) && attempts < 50);
    exclude.add(name);
    return name;
  }

  /**
   * Generate a last name. 1 charRng call.
   * @param {Set<string>} _exclude — unused but kept for API consistency
   */
  function generateLastName(_exclude) {
    return ctx.timeline.charWeightedPick(NameData.last);
  }

  /**
   * Generate a gendered first name + last name. 3 charRng calls total.
   * @param {Set<string>} exclude
   * @param {number} expressionFem
   * @param {number} expressionMasc
   */
  function generateFullName(exclude, expressionFem, expressionMasc) {
    const first = generateGenderedFirstName(exclude, expressionFem, expressionMasc);
    const last = generateLastName(exclude);
    return { first, last };
  }

  /**
   * Generate an NPC pronoun set. 1 charRng call.
   * Distribution: 50% they/them, 25% she/her, 25% he/him (matches neighbor pattern).
   * @returns {PronounSet}
   */
  function generateNpcPronounSet() {
    const roll = ctx.timeline.charRandom();
    return roll < 0.50 ? pronounSet('they/them')
         : roll < 0.75 ? pronounSet('she/her')
         : pronounSet('he/him');
  }

  /**
   * Get expression dimensions from a pronoun set (for NPC name generation).
   * NPCs don't have full gender identity — derive rough expression from pronouns.
   * @param {PronounSet} ps
   * @returns {{ fem: number, masc: number }}
   */
  function expressionFromPronounSet(ps) {
    if (ps.subject === 'she') return { fem: 65, masc: 15 };
    if (ps.subject === 'he') return { fem: 15, masc: 65 };
    return { fem: 40, masc: 40 }; // they/them and others → balanced
  }

  /**
   * Generate a first name without gender weighting (50/50 pool split).
   * Used for family members and neighbors whose gender isn't pre-determined.
   * 2 charRng calls: 1 for pool selection, 1 for charWeightedPick.
   * @param {Set<string>} exclude
   */
  function generateFirstName(exclude) {
    return generateGenderedFirstName(exclude, 50, 50);
  }

  // --- Outfit sets ---
  // Each set is a triple: [default, low_mood, messy]
  // Complete prose sentences — no assembly.

  // --- Common pronoun sets ---
  /** @type {Record<string, PronounSet>} */
  /** @type {Record<string, PronounSet>} */
  const PRONOUN_SETS = {
    'she/her':   { subject: 'she',  object: 'her',  possessive: 'her',  reflexive: 'herself',   plural: false, label: 'she/her' },
    'he/him':    { subject: 'he',   object: 'him',  possessive: 'his',  reflexive: 'himself',   plural: false, label: 'he/him' },
    'they/them': { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themself', plural: true,  label: 'they/them' },
    'xe/xem':    { subject: 'xe',   object: 'xem',  possessive: 'xyr',  reflexive: 'xemself',  plural: false, label: 'xe/xem' },
    'ze/zir':    { subject: 'ze',   object: 'zir',  possessive: 'zir',  reflexive: 'zirself',  plural: false, label: 'ze/zir' },
    'fae/faer':  { subject: 'fae',  object: 'faer', possessive: 'faer', reflexive: 'faerself', plural: false, label: 'fae/faer' },
    'it/its':    { subject: 'it',   object: 'it',   possessive: 'its',  reflexive: 'itself',   plural: false, label: 'it/its' },
    'ey/em':     { subject: 'ey',   object: 'em',   possessive: 'eir',  reflexive: 'emself',   plural: false, label: 'ey/em' },
  };

  const PRONOUN_LABELS = Object.keys(PRONOUN_SETS);

  /**
   * Look up a pronoun set by label, with guaranteed non-null return for known keys.
   * @param {string} key
   * @returns {PronounSet}
   */
  function pronounSet(key) {
    const set = PRONOUN_SETS[key];
    if (!set) throw new Error(`Unknown pronoun set: ${key}`);
    return set;
  }

  // --- Attraction label presets ---
  /** @type {Record<string, AttractionProfile>} */
  const ATTRACTION_PRESETS = {
    'straight':    { sexual: { intensity: 75, orientation: 90, gating: 'none' }, romantic: { intensity: 75, orientation: 90, gating: 'none' }, sensual: 60, aesthetic: 50 },
    'gay/lesbian':  { sexual: { intensity: 75, orientation: 10, gating: 'none' }, romantic: { intensity: 75, orientation: 10, gating: 'none' }, sensual: 60, aesthetic: 55 },
    'bisexual':    { sexual: { intensity: 70, orientation: 50, gating: 'none' }, romantic: { intensity: 70, orientation: 50, gating: 'none' }, sensual: 60, aesthetic: 55 },
    'asexual':     { sexual: { intensity: 5,  orientation: 50, gating: 'none' }, romantic: { intensity: 65, orientation: 50, gating: 'none' }, sensual: 40, aesthetic: 55 },
    'aromantic':   { sexual: { intensity: 65, orientation: 50, gating: 'none' }, romantic: { intensity: 5,  orientation: 50, gating: 'none' }, sensual: 50, aesthetic: 50 },
    'demisexual':  { sexual: { intensity: 60, orientation: 50, gating: 'bond' }, romantic: { intensity: 70, orientation: 50, gating: 'none' }, sensual: 55, aesthetic: 50 },
    'aroace':      { sexual: { intensity: 5,  orientation: 50, gating: 'none' }, romantic: { intensity: 5,  orientation: 50, gating: 'none' }, sensual: 35, aesthetic: 50 },
  };

  const ATTRACTION_LABELS = Object.keys(ATTRACTION_PRESETS);

  // --- Gender presets (for chargen dropdown) ---
  // These map display labels to GenderIdentity parameter sets.
  // The actual values stored are the continuous dimensions, not the label.
  /** @type {Record<string, {gender: GenderIdentity, needsAsab?: Asab}>} */
  const GENDER_PRESETS = {
    'woman':       { gender: { binary_diversity: 5,  nonbinary_diversity: 5,  expression_femininity: 65, expression_masculinity: 15 }, needsAsab: 'afab' },
    'man':         { gender: { binary_diversity: 5,  nonbinary_diversity: 5,  expression_femininity: 10, expression_masculinity: 70 }, needsAsab: 'amab' },
    'trans woman':  { gender: { binary_diversity: 90, nonbinary_diversity: 10, expression_femininity: 65, expression_masculinity: 15 } },
    'trans man':    { gender: { binary_diversity: 90, nonbinary_diversity: 10, expression_femininity: 10, expression_masculinity: 70 } },
    'nonbinary':   { gender: { binary_diversity: 30, nonbinary_diversity: 65, expression_femininity: 40, expression_masculinity: 40 } },
    'genderqueer': { gender: { binary_diversity: 45, nonbinary_diversity: 55, expression_femininity: 50, expression_masculinity: 50 } },
    'agender':     { gender: { binary_diversity: 10, nonbinary_diversity: 80, expression_femininity: 25, expression_masculinity: 25 } },
  };

  const GENDER_LABELS = Object.keys(GENDER_PRESETS);

  // --- Sleepwear options ---
  const sleepwearOptions = [
    'the old grey t-shirt and boxers you slept in',
    'a faded band shirt and sweatpants',
    'an oversized sleep shirt that hangs past your knees',
    'a tank top and flannel pajama pants',
    'the same clothes you wore yesterday, because you fell asleep in them',
    'a worn hoodie and shorts',
  ];

  // --- Season helpers ---

  const seasonLabels = {
    winter: 'Cold. Frost on the window.',
    spring: 'Something blooming somewhere. You can almost smell it.',
    summer: 'Already warm. Going to be one of those days.',
    autumn: 'Grey light. Days getting shorter.',
  };

  const tropicalSeasonLabels = {
    wet: 'The air is thick, rain every afternoon.',
    dry: 'Dry heat. Dust on everything.',
  };

  const locationOptions = [
    { label: 'Somewhere the heat never quite lets go.', value: 'tropical_nh', latitude: 10 },
    { label: 'Somewhere with seasons. They come whether you notice or not.', value: 'nh_temperate', latitude: 42 },
    { label: 'Far enough north the cold has opinions.', value: 'nh_cold', latitude: 58 },
    { label: 'Heat, but the other side of the equator.', value: 'tropical_sh', latitude: -10 },
    { label: 'Seasons, reversed. Summer in December.', value: 'sh_temperate', latitude: -35 },
    { label: 'Far enough south the cold has opinions.', value: 'sh_cold', latitude: -50 },
  ];

  const jobLabels = {
    office: 'An office',
    retail: 'A store',
    food_service: 'A kitchen counter',
    gig_worker: 'An app',
  };

  /**
   * Derive the season name from a start_timestamp and latitude.
   * Mirrors State.season() logic — month from timestamp, hemisphere flip.
   */
  function deriveSeasonFromTimestamp(startTimestamp, latitude) {
    const d = new Date(startTimestamp * 60000);
    const month = d.getUTCMonth(); // 0-11

    // Tropical — wet/dry
    if (Math.abs(latitude) < 23.5) {
      if (latitude >= 0) {
        return (month >= 4 && month <= 9) ? 'wet' : 'dry';
      }
      return (month >= 10 || month <= 3) ? 'wet' : 'dry';
    }

    // Temperate — four seasons
    let m = month;
    if (latitude < 0) {
      m = (month + 6) % 12;
    }
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'autumn';
    return 'winter';
  }

  /**
   * Compute a new start_timestamp that falls in the requested season.
   * Keeps the same year but picks a day within the target season's months.
   * Accounts for hemisphere by flipping months for southern latitudes.
   */
  function timestampForSeason(seasonName, latitude) {
    // Tropical wet/dry
    if (seasonName === 'wet' || seasonName === 'dry') {
      // NH tropical: wet = May–Oct, dry = Nov–Apr
      // SH tropical: wet = Oct–Mar, dry = Apr–Sep
      let targetMonth;
      if (latitude >= 0) {
        targetMonth = seasonName === 'wet' ? 6 : 0; // Jul or Jan
      } else {
        targetMonth = seasonName === 'wet' ? 0 : 6; // Jan or Jul
      }
      const d = new Date(Date.UTC(2024, targetMonth, 15));
      return Math.floor(d.getTime() / 60000);
    }

    // Temperate four seasons
    const seasonMonthStarts = { spring: 2, summer: 5, autumn: 8, winter: 11 };
    let targetMonth = seasonMonthStarts[seasonName];
    // For SH, flip by 6 months so the calendar date produces the right derived season
    if (latitude < 0) {
      targetMonth = (targetMonth + 6) % 12;
    }
    // Pick the 15th of that month
    const d = new Date(Date.UTC(2024, targetMonth, 15));
    return Math.floor(d.getTime() / 60000);
  }

  // --- Life history generation ---
  // Compressed backstory like Dwarf Fortress legends — broad strokes explaining
  // who this person is. Financial position, personality adjustments, work sentiments
  // are all derived outputs. Uses charRng so rerolling produces different lives.

  const economicOrigins = ['precarious', 'modest', 'comfortable', 'secure'];

  // Life event types and their multi-dimensional impacts
  const lifeEventDefs = {
    medical_crisis:    { financial: [-8000, -2000], neuroticism_adj: 3, sentiment: { target: 'health', quality: 'anxiety', intensity: 0.1 } },
    job_loss:          { financial: [-3000, -1000], self_esteem_adj: -3, sentiment: { target: 'work', quality: 'dread', intensity: 0.05 } },
    family_help:       { financial: [1000, 5000], sentiment: { target: 'family', quality: 'guilt', intensity: 0.05 } },
    small_inheritance: { financial: [2000, 8000] },
    accident:          { financial: [-5000, -1000], neuroticism_adj: 2 },
    legal_trouble:     { financial: [-4000, -500], sentiment: { target: 'authority', quality: 'dread', intensity: 0.08 } },
    relationship_end:  { financial: [-2000, -500], self_esteem_adj: -3 },
  };

  // Which events are available depends on origin — secure people have different crises
  const eventPoolByOrigin = {
    precarious:  ['medical_crisis', 'job_loss', 'legal_trouble', 'relationship_end', 'family_help'],
    modest:      ['medical_crisis', 'job_loss', 'relationship_end', 'family_help', 'small_inheritance'],
    comfortable: ['medical_crisis', 'job_loss', 'relationship_end', 'small_inheritance', 'accident'],
    secure:      ['medical_crisis', 'relationship_end', 'small_inheritance', 'accident', 'legal_trouble'],
  };

  /**
   * Generate life history backstory on charRng stream.
   * ~5 charRng calls. Produces broad strokes — the story of this person.
   * @param {number} age
   * @returns {{ economic_origin: string, career_stability: number, life_events: Array<{ type: string, financial_impact: number }>, ebt_enrolled: boolean }}
   */
  function generateBackstory(age) {
    // 1. Economic origin (1 charRng call)
    const economic_origin = ctx.timeline.charPick(economicOrigins);

    // 2. Career stability 0-1 (1 charRng call)
    const career_stability = ctx.timeline.charRandom();

    // 3. Life events — 0-2 events (1 charRng call for count, 0-2 for selection)
    const yearsAdult = Math.max(0, age - 18);
    // More years = more chance of events. 0-2 events.
    const eventChance = Math.min(0.9, yearsAdult / 30);
    const eventRoll = ctx.timeline.charRandom();
    let numEvents = 0;
    if (eventRoll < eventChance * 0.5) numEvents = 2;
    else if (eventRoll < eventChance) numEvents = 1;

    const life_events = [];
    const pool = eventPoolByOrigin[economic_origin];
    for (let i = 0; i < numEvents; i++) {
      const type = ctx.timeline.charPick(pool);
      const def = lifeEventDefs[type];
      // Financial impact interpolated by charRandom
      const t = ctx.timeline.charRandom();
      const financial_impact = Math.round(def.financial[0] + (def.financial[1] - def.financial[0]) * t);
      life_events.push({ type, financial_impact });
    }

    // 4. SNAP/EBT enrollment — probability by economic origin (1 charRng call)
    // Based on US SNAP eligibility: ~65% of eligible people (precarious) actually enroll.
    // Modest origin: some qualify depending on income, lower enrollment awareness.
    const ebtEnrollRate = { precarious: 0.65, modest: 0.25, comfortable: 0.04, secure: 0.0 };
    const ebt_enrolled = ctx.timeline.charRandom() < (ebtEnrollRate[economic_origin] ?? 0);

    return { economic_origin, career_stability, life_events, ebt_enrolled };
  }

  // --- Fine-grained financial simulation ---
  // Runs once per character after finalization. Year-by-year accumulation
  // from age 18 to current age, producing exact starting money, rent, pay rate,
  // financial sentiments, personality adjustments, and job standing.

  // Accumulation rates by origin ($/year range [low, high])
  const accumulationRate = {
    precarious:  [-50, 100],
    modest:      [100, 500],
    comfortable: [500, 2000],
    secure:      [1000, 5000],
  };

  // Hourly take-home rates by job type.
  // Approximation debt (paycheck): flat hourly rate per job type. Real wages vary by employer,
  // region, seniority. food_service ~$6/hr, retail ~$6.50/hr, office ~$7.50/hr chosen near
  // minimum wage for the game's economic register.
  // gig_worker: 11/hr effective (midpoint of delivery/task range $9–13/hr before platform fees).
  // Approximation debt (gig work): $11/hr is a rough midpoint; real effective hourly rates vary
  // widely once expenses (fuel, vehicle wear, time waiting for gigs) are factored in.
  const payRates = { food_service: 6.00, retail: 6.50, office: 7.50, gig_worker: 11.00 };

  // Rent ranges by origin bracket (monthly)
  const rentRanges = {
    precarious:  [400, 550],
    modest:      [500, 650],
    comfortable: [600, 800],
    secure:      [700, 950],
  };

  /**
   * Run the fine-grained financial simulation.
   * Deterministic from backstory params — no PRNG consumed.
   * @param {{ economic_origin: string, career_stability: number, life_events: Array<{ type: string, financial_impact: number }> }} backstory
   * @param {number} age
   * @param {string} job_type
   * @returns {{ starting_money: number, hourly_rate: number, rent_amount: number, financial_anxiety: number, personality_adjustments: { neuroticism: number, self_esteem: number }, work_sentiment: { quality: string, intensity: number }, job_standing_start: number }}
   */
  function simulateFinancialHistory(backstory, age, job_type) {
    const { economic_origin, career_stability, life_events } = backstory;

    // Year-by-year accumulation
    const yearsWorking = Math.max(0, age - 18);
    const [lo, hi] = accumulationRate[economic_origin];
    const yearlyRate = lo + (hi - lo) * career_stability;
    let savings = yearsWorking * yearlyRate;

    // Apply life event financial impacts
    let totalEventImpact = 0;
    for (const evt of life_events) {
      totalEventImpact += evt.financial_impact;
    }
    savings += totalEventImpact;

    // Secure origins cushion losses; precarious origins amplify them
    if (totalEventImpact < 0 && economic_origin === 'secure') {
      savings -= totalEventImpact * 0.3; // recover 30% of losses (family safety net)
    }

    const starting_money = Math.max(0, Math.round(savings * 100) / 100);

    // Pay rate from job type
    const hourly_rate = payRates[job_type] || 520;

    // Rent from origin bracket — interpolated by career stability
    const [rLo, rHi] = rentRanges[economic_origin];
    const rent_amount = Math.round(rLo + (rHi - rLo) * career_stability);

    // Financial anxiety — from origin + stability + negative events
    let financial_anxiety = 0;
    if (economic_origin === 'precarious') financial_anxiety += 0.25;
    else if (economic_origin === 'modest') financial_anxiety += 0.1;
    financial_anxiety += (1 - career_stability) * 0.15;
    for (const evt of life_events) {
      if (evt.financial_impact < 0) financial_anxiety += 0.05;
    }
    financial_anxiety = Math.min(0.8, financial_anxiety);

    // Personality adjustments from life events (small nudges)
    let neuroticismAdj = 0;
    let selfEsteemAdj = 0;
    for (const evt of life_events) {
      const def = lifeEventDefs[evt.type];
      if (def.neuroticism_adj) neuroticismAdj += def.neuroticism_adj;
      if (def.self_esteem_adj) selfEsteemAdj += def.self_esteem_adj;
    }
    // Secure origin cushions personality damage
    if (economic_origin === 'secure') {
      if (neuroticismAdj > 0) neuroticismAdj = Math.round(neuroticismAdj * 0.5);
      if (selfEsteemAdj < 0) selfEsteemAdj = Math.round(selfEsteemAdj * 0.5);
    }

    // Work sentiment from career stability
    let work_sentiment;
    if (career_stability < 0.3) {
      work_sentiment = { quality: 'dread', intensity: 0.05 + (0.3 - career_stability) * 0.33 };
    } else if (career_stability > 0.7) {
      work_sentiment = { quality: 'satisfaction', intensity: 0.05 + (career_stability - 0.7) * 0.17 };
    } else {
      work_sentiment = { quality: 'satisfaction', intensity: 0 };
    }
    // Life events can add work dread
    for (const evt of life_events) {
      if (evt.type === 'job_loss' && work_sentiment.quality === 'dread') {
        work_sentiment.intensity = Math.min(0.15, work_sentiment.intensity + 0.05);
      }
    }

    // Job standing from career stability
    let job_standing_start;
    if (career_stability > 0.7) {
      job_standing_start = 70 + Math.round((career_stability - 0.7) * 17);
    } else if (career_stability < 0.3) {
      job_standing_start = 55 + Math.round(career_stability * 17);
    } else {
      job_standing_start = 60 + Math.round((career_stability - 0.3) * 25);
    }
    // Job loss events scar standing
    for (const evt of life_events) {
      if (evt.type === 'job_loss') job_standing_start = Math.max(50, job_standing_start - 5);
    }

    // SNAP/EBT monthly benefit — ~US average for single-person household.
    // Approximation debt (financial cycle): should eventually derive from income, household size,
    // state rules. For now, a flat amount if enrolled.
    const ebt_monthly_amount = backstory.ebt_enrolled ? 204 : 0;

    // Phone plan cost — derived deterministically from economic_origin and hourly_rate.
    // Precarious origin OR below ~$600/biweekly → prepaid/budget carrier.
    // Modest origin OR below ~$900/biweekly → basic plan.
    // Otherwise → standard plan.
    // Approximation debt (phone bill): plan cost derived from economic_origin + hourly_rate;
    // real factors include carrier, data limits, family plan discount.
    const biweeklyPay = hourly_rate * 80; // hourly rate × 80 hours per biweekly period
    let phone_bill_amount;
    if (economic_origin === 'precarious' || biweeklyPay < 600) {
      phone_bill_amount = 25;
    } else if (economic_origin === 'modest' || biweeklyPay < 900) {
      phone_bill_amount = 35;
    } else {
      phone_bill_amount = 45;
    }

    return {
      starting_money,
      hourly_rate,
      rent_amount,
      financial_anxiety,
      personality_adjustments: { neuroticism: neuroticismAdj, self_esteem: selfEsteemAdj },
      work_sentiment,
      job_standing_start,
      ebt_monthly_amount,
      phone_bill_amount,
    };
  }

  // --- Labor arrangement generation ---

  /**
   * Generate labor arrangement from job type and simulation outputs.
   * No charRng calls — derives from backstory.career_stability (already generated).
   * Approximation debt (work scheduling): shift pool selection should use charRng, but charRng call-order
   * constraint (this runs in finishCreation after charRng stream is closed) prevents it.
   * career_stability used as a proxy: low stability → less-preferred shifts (including overnight).
   * Night shifts: retail/food_service only. stability < 0.15 → 22:00–06:00; stability < 0.25 + high
   * anxiety → 23:00–07:00. Overnight wrapping handled by withinShift() in state.js.
   * See docs/design/work-scheduling.md.
   *
   * @param {string} jobType
   * @param {{ job_standing_start: number, financial_anxiety: number }} sim
   * @param {{ career_stability: number }} backstory
   * @returns {LaborArrangement}
   */
  function generateLaborArrangement(jobType, sim, backstory) {
    const standing = sim.job_standing_start;
    const anxiety = sim.financial_anxiety;
    const stability = backstory.career_stability;

    if (jobType === 'office') {
      // Office: always fixed/weekdays. Slight flex in start time from stability.
      const shiftStart = stability > 0.5 ? 9 * 60 : 8 * 60 + 30;
      return {
        type: 'fixed',
        day_pattern: 'weekdays',
        work_days: [1, 2, 3, 4, 5],
        shift_start: shiftStart,
        shift_end: shiftStart + 8 * 60,
        split_shift: false,
        shift_start_2: null,
        shift_end_2: null,
        reveal_horizon_hours: null,
        reveal_tod: null,
        work_days_per_week: 5,
      };
    }

    /**
     * Derive which days a retail/food_service worker is potentially scheduled.
     * Low-seniority workers get weekend-including schedules (less desirable, harder to avoid).
     * High-seniority workers accumulate enough standing to claim M-F.
     * Approximation debt (work-scheduling): retail shift day distribution chosen deterministically
     * from stability as proxy for seniority. charRng not available here (finishCreation constraint).
     * Real distribution would sample from employer posting patterns.
     * Three weekend-including patterns cover ~60% of workers (stability < 0.60):
     *   Tue–Sat [2,3,4,5,6], Wed–Sun [3,4,5,6,0], Sun–Thu [0,1,2,3,4]
     * M–F [1,2,3,4,5] for stability ≥ 0.60.
     */
    function retailWorkDays() {
      if (stability >= 0.60) return { day_pattern: 'weekdays', work_days: [1, 2, 3, 4, 5] };
      if (stability < 0.20) return { day_pattern: 'specific', work_days: [2, 3, 4, 5, 6] };  // Tue–Sat
      if (stability < 0.40) return { day_pattern: 'specific', work_days: [3, 4, 5, 6, 0] };  // Wed–Sun
      return { day_pattern: 'specific', work_days: [0, 1, 2, 3, 4] };                         // Sun–Thu
    }

    if (jobType === 'retail') {
      // Low standing or high anxiety → on_demand scheduling terms even if nominally rotating.
      const type = (standing < 58 || anxiety > 0.55) ? 'on_demand' : 'rotating';
      // Split shift: stability in [0.25, 0.40) — workers with enough seniority to avoid overnight
      // but not enough to get a contiguous block. Common in retail for opening/closing coverage.
      // ~15% of the stability range. Two blocks: morning stock/setup + evening closing rush.
      // Approximation debt (work scheduling): split shift prevalence derived from stability band width;
      // real prevalence varies by store type, location, and labor law.
      const isSplit = stability >= 0.25 && stability < 0.40;
      // Shift from stability: lowest → overnight (most undesirable), low → morning, mid → standard, high → afternoon.
      // Night shift: stability < 0.15 → 10pm–6am; stability < 0.25 with high anxiety → 11pm–7am.
      // Overnight shifts cross midnight; withinShift() in state.js handles the wrap (end < start case).
      let shiftStart;
      if (stability < 0.15) shiftStart = 22 * 60;           // 10pm–6am (overnight)
      else if (stability < 0.25 && anxiety > 0.60) shiftStart = 23 * 60; // 11pm–7am (overnight)
      else if (stability < 0.35) shiftStart = 6 * 60;        // 6am–2pm
      else if (stability < 0.65) shiftStart = 10 * 60;       // 10am–6pm
      else shiftStart = 14 * 60;                              // 2pm–10pm
      // Higher standing → longer reveal horizon (schedule posted 3 days out vs day-before)
      const revealHorizonHours = standing >= 65 ? 72 : 24;
      const { day_pattern, work_days } = retailWorkDays();
      if (isSplit) {
        // Split shift: two 4-hour blocks with a gap. Morning block 7–11 AM, evening block 4–8 PM.
        // Total hours = 8 (same as a contiguous shift).
        return {
          type,
          day_pattern,
          work_days,
          shift_start: 7 * 60,      // first block: 7:00 AM
          shift_end: 11 * 60,       // first block end: 11:00 AM
          split_shift: true,
          shift_start_2: 16 * 60,   // second block: 4:00 PM
          shift_end_2: 20 * 60,     // second block end: 8:00 PM
          reveal_horizon_hours: type === 'on_demand' ? revealHorizonHours : null,
          reveal_tod: type === 'on_demand' ? 21 * 60 : 6 * 60,
          work_days_per_week: Math.round(3 + stability * 2),
        };
      }
      return {
        type,
        day_pattern,
        work_days,
        shift_start: shiftStart,
        shift_end: (shiftStart + 8 * 60) % (24 * 60),  // may wrap: e.g. 22*60+480=1800 → 360 (6am)
        split_shift: false,
        shift_start_2: null,
        shift_end_2: null,
        reveal_horizon_hours: type === 'on_demand' ? revealHorizonHours : null,
        reveal_tod: type === 'on_demand' ? 21 * 60 : 6 * 60,  // on_demand: 9pm reveal; rotating: 6am morning reveal
        work_days_per_week: Math.round(3 + stability * 2),  // 3–5 days
      };
    }

    if (jobType === 'food_service') {
      // Food service: on_demand unless high standing (established worker gets rotating).
      const type = standing >= 70 ? 'rotating' : 'on_demand';
      // Split shift: stability in [0.25, 0.40) — prep in the morning, dinner service in the evening.
      // Common in restaurants: open for lunch, close mid-afternoon, reopen for dinner.
      // ~15% of the stability range.
      // Approximation debt (work scheduling): split shift prevalence derived from stability band width;
      // real prevalence varies by restaurant type (fine dining vs fast food), location, and labor law.
      const isSplit = stability >= 0.25 && stability < 0.40;
      // Shift from stability: lowest → overnight (most undesirable), low → morning, mid → standard, high → afternoon.
      // Night shift: stability < 0.15 → 10pm–6am; stability < 0.25 with high anxiety → 11pm–7am.
      // Overnight shifts cross midnight; withinShift() in state.js handles the wrap (end < start case).
      let shiftStart;
      if (stability < 0.15) shiftStart = 22 * 60;           // 10pm–6am (overnight)
      else if (stability < 0.25 && anxiety > 0.60) shiftStart = 23 * 60; // 11pm–7am (overnight)
      else if (stability < 0.35) shiftStart = 6 * 60;
      else if (stability < 0.65) shiftStart = 10 * 60;
      else shiftStart = 14 * 60;
      // All reveals are night-before (evening). High anxiety → later/more last-minute (10pm);
      // lower anxiety → earlier (8pm). Morning-of reveals (for afternoon shifts) are a
      // future improvement — requires shift_start-aware reveal timing. Approximation debt (work scheduling).
      const revealHorizonHours = anxiety > 0.5 ? 14 : 20;
      const revealTod = anxiety > 0.5 ? 22 * 60 : 20 * 60;  // 10pm or 8pm
      const { day_pattern, work_days } = retailWorkDays();
      if (isSplit) {
        // Split shift: two 4-hour blocks with a gap. Lunch prep 10–2 PM, dinner service 5–9 PM.
        // Total hours = 8 (same as a contiguous shift).
        return {
          type,
          day_pattern,
          work_days,
          shift_start: 10 * 60,     // first block: 10:00 AM (lunch prep)
          shift_end: 14 * 60,       // first block end: 2:00 PM
          split_shift: true,
          shift_start_2: 17 * 60,   // second block: 5:00 PM (dinner service)
          shift_end_2: 21 * 60,     // second block end: 9:00 PM
          reveal_horizon_hours: type === 'on_demand' ? revealHorizonHours : null,
          reveal_tod: type === 'on_demand' ? revealTod : 6 * 60,
          work_days_per_week: Math.round(3 + stability * 2),
        };
      }
      return {
        type,
        day_pattern,
        work_days,
        shift_start: shiftStart,
        shift_end: (shiftStart + 8 * 60) % (24 * 60),  // may wrap: e.g. 22*60+480=1800 → 360 (6am)
        split_shift: false,
        shift_start_2: null,
        shift_end_2: null,
        reveal_horizon_hours: type === 'on_demand' ? revealHorizonHours : null,
        reveal_tod: type === 'on_demand' ? revealTod : 6 * 60,  // on_demand: evening reveal; rotating: 6am morning reveal
        work_days_per_week: Math.round(3 + stability * 2),
      };
    }

    if (jobType === 'gig_worker') {
      // Gig arrangement: no fixed shifts, no day pattern, no guaranteed income.
      // shift_start/shift_end null — gig availability checked by advanceTime() against app-hours (8am–10pm).
      // work_days_per_week = 0: no guaranteed days. Player can work whenever gigs appear.
      return {
        type: 'gig',
        day_pattern: 'any',
        work_days: [],
        shift_start: null,
        shift_end: null,
        split_shift: false,
        shift_start_2: null,
        shift_end_2: null,
        reveal_horizon_hours: null,
        reveal_tod: null,
        work_days_per_week: 0,
      };
    }

    return {
      type: 'none',
      day_pattern: 'weekdays',
      work_days: [1, 2, 3, 4, 5],
      shift_start: 9 * 60,
      shift_end: 17 * 60,
      split_shift: false,
      shift_start_2: null,
      shift_end_2: null,
      reveal_horizon_hours: null,
      reveal_tod: null,
      work_days_per_week: 0,
    };
  }

  // --- Body parameter generation ---
  // Placed before generateRandom() but called at the END of that function,
  // after all other charRng calls, so variable call count is safe.

  /**
   * Generate body parameters. ~14–22 charRng calls depending on rolls.
   * @param {number} age
   * @param {{ economic_origin: string }} backstory
   */
  function generateBodyParams(age, backstory) {
    // 1. ASAB — 1 charRng call
    // Approximation debt (body chargen): intersex prevalence depends on definition.
    // Broad criteria: Fausto-Sterling 2000 (doi:10.1002/j.1550-8528.2000.tb00019.x) ~1.7%.
    // Using 1.5% placeholder pending design decision on scope. See TODO.md.
    const asabRoll = ctx.timeline.charRandom();
    const asab = asabRoll < 0.4925 ? 'afab'
               : asabRoll < 0.985  ? 'amab'
               : 'intersex';

    // 2. Puberty history — 3–4 charRng calls
    // Approximation debt (body chargen): puberty non-occurrence rate not characterized for this model.
    const puberty_occurred = ctx.timeline.charRandom() > 0.01;
    // Approximation debt (body chargen): timing prevalence distribution not literature-anchored.
    const puberty_timing = ctx.timeline.charPick(['early', 'typical', 'typical', 'typical', 'late']);
    // Approximation debt (body chargen): puberty suppression prevalence poorly characterized. 0.5% placeholder.
    const puberty_suppressed = puberty_occurred && ctx.timeline.charRandom() < 0.005;
    const suppression_timing = puberty_suppressed
      ? ctx.timeline.charPick(['prepubertal', 'mid_puberty'])
      : null;

    // 3. HRT history — 1 (no HRT) or 4 (HRT present) charRng calls
    // Approximation debt (body chargen): should derive from life history (gender-affirming care access,
    // menopause, clinical prescription). ~3% base placeholder until that exists.
    const hrt_any = ctx.timeline.charRandom() < 0.03;
    let hrt_history = { type: null, start_offset: null, dose_tier: 'standard' };
    if (hrt_any) {
      const hrt_type = ctx.timeline.charPick(['feminizing', 'masculinizing']);
      const hrt_start_offset = ctx.timeline.charRandomInt(1, 60); // months before game start
      const hrt_dose_tier = ctx.timeline.charPick(['low', 'standard', 'standard', 'high']);
      hrt_history = { type: hrt_type, start_offset: hrt_start_offset, dose_tier: hrt_dose_tier };
    }

    // 4. Constitutional conditions — 5+ charRng calls
    // Approximation debt (body chargen): gigantomastia prevalence. 1:28,000–1:100,000 cited;
    // using 1:50,000 placeholder. Needs PMID. See TODO.md.
    const gigantomastia = ctx.timeline.charRandom() < (1 / 50000);
    // Approximation debt (body chargen): micromastia as isolated condition poorly characterized. 1% placeholder.
    const micromastia = !gigantomastia && ctx.timeline.charRandom() < 0.01;
    // Breast asymmetry: exponential distribution mean 0.1, capped 1.0.
    // Approximation debt (body chargen): distribution shape needs calibration from literature.
    const breast_asymmetry = Math.min(
      1.0,
      -Math.log(Math.max(1e-9, 1 - ctx.timeline.charRandom())) * 0.1
    );
    // Approximation debt (body chargen): Poland syndrome prevalence. 1:20,000 placeholder. Needs PMID.
    const poland_syndrome = ctx.timeline.charRandom() < (1 / 20000);
    const poland_side = poland_syndrome ? ctx.timeline.charPick(['left', 'right']) : null;
    // Gynecomastia (AMAB only). PMID 8074834 covers adolescent transient (65%).
    // Adult persistent rate poorly characterized; 15% placeholder for AMAB.
    let gynecomastia_score = 0;
    if (asab === 'amab' && !gigantomastia) {
      if (ctx.timeline.charRandom() < 0.15) {
        gynecomastia_score = Math.round(5 + ctx.timeline.charRandom() * 35);
      }
    }
    // Post-mastectomy: circumstantial — should derive from life history.
    // ~0.5% placeholder until surgical history exists in backstory.
    const post_mastectomy = ctx.timeline.charRandom() < 0.005;
    const mastectomy_type = post_mastectomy
      ? ctx.timeline.charPick(['flat', 'reconstructed'])
      : null;

    // 5. Reproductive anatomy — deterministic from ASAB (no charRng calls)
    // Approximation debt (body chargen): intersex reproductive anatomy not individually modeled.
    // Defaulting to AFAB anatomy as rough approximation for intersex.
    const reproductive_anatomy = {
      has_uterus:  asab === 'afab' || asab === 'intersex',
      has_ovaries: asab === 'afab' || asab === 'intersex',
      has_testes:  asab === 'amab',
    };

    // 6. Breast tissue score — 1–3 more charRng calls depending on path
    // Approximation debt (body chargen): genetic_breast_ceiling distribution has no literature anchor.
    // Uniform [10, 90] used as placeholder.
    const genetic_breast_ceiling = 10 + Math.round(ctx.timeline.charRandom() * 80);

    let breast_tissue_score = 0;
    if (gigantomastia) {
      // Constitutional override — very high score. +1 charRng call.
      breast_tissue_score = 80 + Math.round(ctx.timeline.charRandom() * 20);
    } else if (post_mastectomy) {
      breast_tissue_score = 0;
    } else if (micromastia) {
      // Constitutional cap at low value. +1 charRng call.
      breast_tissue_score = Math.round(ctx.timeline.charRandom() * 15);
    } else {
      // AFAB puberty pathway
      if ((asab === 'afab' || asab === 'intersex') && puberty_occurred) {
        if (puberty_suppressed && suppression_timing === 'prepubertal') {
          breast_tissue_score = 0;
        } else if (puberty_suppressed) {
          // Mid-puberty suppression: partial development. +1 charRng call.
          breast_tissue_score = Math.round(
            genetic_breast_ceiling * (0.25 + ctx.timeline.charRandom() * 0.35)
          );
        } else {
          // Full development. +1 charRng call.
          const base = puberty_timing === 'early' ? 0.85
                     : puberty_timing === 'late'  ? 0.70
                     : 0.75;
          breast_tissue_score = Math.round(
            genetic_breast_ceiling * (base + ctx.timeline.charRandom() * 0.15)
          );
        }
      } else if (asab === 'amab') {
        breast_tissue_score = gynecomastia_score;
      }
      // Feminizing HRT contribution. Hembree et al. 2017 (PMID 28945902):
      // onset 3–6 months, progression 2–3 years.
      if (hrt_history.type === 'feminizing' && hrt_history.start_offset) {
        const doseFactor = hrt_history.dose_tier === 'high' ? 1.2
                         : hrt_history.dose_tier === 'low'  ? 0.7 : 1.0;
        const hrtCeiling = genetic_breast_ceiling * 0.6 * doseFactor;
        const hrtContrib = hrtCeiling * (1 - Math.exp(-hrt_history.start_offset / 24));
        breast_tissue_score = Math.max(breast_tissue_score, Math.round(hrtContrib));
      }
      // Poland syndrome: unilateral — reduces effective score ~50%
      if (poland_syndrome) breast_tissue_score = Math.round(breast_tissue_score * 0.5);
    }
    breast_tissue_score = Math.min(100, Math.max(0, breast_tissue_score));

    // 7. Abdominal baseline — 1 charRng call
    // Approximation debt (body chargen): distribution not literature-anchored. Uniform [20, 70] placeholder.
    // Real drivers: age, economic origin, activity level — not yet modeled.
    const abdominal_baseline = 20 + Math.round(ctx.timeline.charRandom() * 50);

    return {
      asab,
      puberty_history: {
        occurred: puberty_occurred,
        timing: puberty_timing,
        suppressed: puberty_suppressed,
        suppression_timing,
      },
      hrt_history,
      constitutional_conditions: {
        gigantomastia,
        micromastia,
        breast_asymmetry,
        poland_syndrome,
        poland_side,
        gynecomastia_score,
        post_mastectomy,
        mastectomy_type,
      },
      reproductive_anatomy,
      breast_tissue_score,
      abdominal_baseline,
    };
  }

  // --- Wardrobe generation ---
  // generateWardrobe() MUST be called LAST in generateRandom() — its charRng call
  // count varies by character (precarious ~8 items × 3 calls = ~24 calls vs.
  // secure ~24 items × 3 calls = ~72 calls). No downstream charRng calls after it.

  // --- Wardrobe aesthetic system ---
  // Each aesthetic defines item pools per clothing type. The aesthetic determines the
  // flavor of items generated; counts still come from wardrobeCounts by economic origin.

  const WARDROBE_AESTHETICS = ['comfy', 'dark_academia', 'streetwear', 'alt', 'pastel', 'classic', 'workwear'];

  const wardrobeItemPoolsByAesthetic = {
    classic: {
      top: ['white t-shirt', 'grey t-shirt', 'black t-shirt', 'blue jeans jacket', 'flannel shirt', 'plaid flannel', 'polo shirt', 'striped t-shirt', 'crewneck sweatshirt', 'grey sweatshirt', 'long-sleeve tee', 'henley'],
      bottom: ['blue jeans', 'dark jeans', 'worn jeans', 'khakis', 'shorts', 'grey sweatpants'],
      dress: ['jersey dress', 'shift dress', 'grey dress'],
      underwear: ['underwear'],
      socks: ['white socks', 'black socks', 'ankle socks', 'crew socks', 'no-show socks'],
      shoes: ['sneakers', 'white sneakers', 'beat-up sneakers', 'canvas shoes', 'sandals', 'slides'],
      outerwear: ['denim jacket', 'rain jacket', 'grey jacket', 'puffer jacket', 'windbreaker'],
    },
    comfy: {
      top: ['grey hoodie', 'black hoodie', 'oversized sweatshirt', 'soft flannel', 'waffle henley', 'fleece pullover', 'faded crew tee', 'slouchy long-sleeve', 'thermal top'],
      bottom: ['grey sweatpants', 'black sweatpants', 'fleece joggers', 'soft leggings', 'worn-in jeans', 'knit shorts', 'jersey shorts'],
      dress: ['jersey dress', 'oversized sleep dress', 'knit sweater dress'],
      underwear: ['underwear'],
      socks: ['fuzzy socks', 'thick crew socks', 'ankle socks', 'cozy socks', 'mismatched socks'],
      shoes: ['slides', 'beat-up sneakers', 'slip-ons', 'crocs', 'old running shoes'],
      outerwear: ['puffer jacket', 'fleece jacket', 'oversized hoodie', 'quilted jacket', 'sherpa jacket'],
    },
    dark_academia: {
      top: ['cream button-down', 'white button-down', 'brown cardigan', 'cable-knit sweater', 'turtleneck', 'black turtleneck', 'wool vest', 'tweed blazer', 'linen shirt', 'burgundy sweater'],
      bottom: ['brown slacks', 'black slacks', 'corduroy pants', 'pleated trousers', 'dark wool skirt', 'herringbone trousers'],
      dress: ['plaid dress', 'brown shift dress', 'wool dress', 'corduroy pinafore'],
      underwear: ['underwear'],
      socks: ['dark crew socks', 'wool socks', 'argyle socks', 'ribbed socks', 'knee-high socks'],
      shoes: ['loafers', 'oxford shoes', 'brown boots', 'ankle boots', 'leather shoes'],
      outerwear: ['wool coat', 'brown coat', 'trench coat', 'tweed jacket', 'herringbone overcoat'],
    },
    streetwear: {
      top: ['graphic tee', 'oversized tee', 'black hoodie', 'cropped hoodie', 'basketball jersey', 'windbreaker top', 'color-block tee', 'logo sweatshirt', 'long-sleeve graphic'],
      bottom: ['joggers', 'black joggers', 'cargo pants', 'baggy jeans', 'track pants', 'basketball shorts', 'wide-leg pants'],
      dress: ['jersey dress', 'oversized tee dress'],
      underwear: ['underwear'],
      socks: ['white crew socks', 'black crew socks', 'logo socks', 'ankle socks', 'striped socks'],
      shoes: ['high-tops', 'platform sneakers', 'retro sneakers', 'white sneakers', 'chunky sneakers'],
      outerwear: ['puffer jacket', 'windbreaker', 'bomber jacket', 'track jacket', 'oversized denim jacket'],
    },
    alt: {
      top: ['band tee', 'black tank', 'mesh top', 'black long-sleeve', 'ripped tee', 'faded band shirt', 'black henley', 'thermal top', 'distressed crop top'],
      bottom: ['black jeans', 'ripped black jeans', 'black skirt', 'plaid pants', 'dark cargo pants', 'black shorts', 'chain-detail pants'],
      dress: ['black dress', 'slip dress', 'mesh-layer dress', 'velvet dress'],
      underwear: ['underwear'],
      socks: ['black socks', 'fishnet socks', 'striped socks', 'knee-high socks', 'black ankle socks'],
      shoes: ['combat boots', 'platform boots', 'black sneakers', 'creepers', 'doc martens'],
      outerwear: ['black leather jacket', 'black denim jacket', 'black coat', 'spiked jacket', 'dark hoodie'],
    },
    pastel: {
      top: ['lavender tee', 'pink blouse', 'mint cardigan', 'cream knit top', 'soft yellow tee', 'lilac sweatshirt', 'baby blue top', 'peach tank', 'white eyelet top'],
      bottom: ['light wash jeans', 'cream trousers', 'pink skirt', 'white shorts', 'pastel leggings', 'soft blue jeans'],
      dress: ['floral dress', 'pastel sundress', 'lavender dress', 'white linen dress', 'pink gingham dress'],
      underwear: ['underwear'],
      socks: ['white socks', 'pastel ankle socks', 'lace-trim socks', 'pink socks', 'no-show socks'],
      shoes: ['white sneakers', 'canvas shoes', 'ballet flats', 'pastel slides', 'white sandals'],
      outerwear: ['cream jacket', 'pastel denim jacket', 'light cardigan', 'white rain jacket', 'soft pink coat'],
    },
    workwear: {
      top: ['flannel shirt', 'plaid flannel', 'canvas work shirt', 'thermal henley', 'grey pocket tee', 'chambray shirt', 'worn button-down', 'canvas vest'],
      bottom: ['canvas pants', 'dark jeans', 'worn jeans', 'cargo pants', 'duck canvas pants', 'brown work pants'],
      dress: ['denim dress', 'canvas jumper'],
      underwear: ['underwear'],
      socks: ['thick crew socks', 'wool socks', 'boot socks', 'work socks', 'insulated socks'],
      shoes: ['work boots', 'steel-toe boots', 'hiking boots', 'broken-in boots', 'canvas sneakers'],
      outerwear: ['canvas jacket', 'insulated work jacket', 'denim jacket', 'waxed jacket', 'wool-lined coat'],
    },
  };

  const wardrobeAestheticLabels = {
    comfy: 'soft things. worn things.',
    dark_academia: 'earth tones. layers.',
    streetwear: 'graphics. logos. loud.',
    alt: 'black. always black.',
    pastel: 'soft colors. light fabrics.',
    classic: 'jeans and tees. nothing remarkable.',
    workwear: 'practical. durable.',
  };

  // Item count ranges [lo, hi] per category per economic origin
  const wardrobeCounts = {
    top:      { precarious: [2,3], modest: [3,5], comfortable: [5,7], secure: [6,9] },
    bottom:   { precarious: [1,2], modest: [2,3], comfortable: [3,4], secure: [4,5] },
    underwear:{ precarious: [2,4], modest: [4,6], comfortable: [6,8], secure: [7,10] },
    socks:    { precarious: [2,4], modest: [4,6], comfortable: [5,8], secure: [6,9] },
    shoes:    { precarious: [1,1], modest: [1,2], comfortable: [2,3], secure: [2,4] },
    outerwear:{ precarious: [0,1], modest: [1,2], comfortable: [1,3], secure: [2,4] },
    dress:    { precarious: [0,0], modest: [0,1], comfortable: [0,2], secure: [0,3] },
  };

  // Condition pool weighted by origin
  const conditionPoolByOrigin = {
    precarious:  ['worn', 'worn', 'worn', 'faded', 'faded', 'damaged', 'good'],
    modest:      ['worn', 'worn', 'worn', 'faded', 'faded', 'faded', 'faded', 'damaged', 'good', 'good'],
    comfortable: ['worn', 'faded', 'faded', 'good', 'good', 'good', 'good', 'good', 'good', 'good'],
    secure:      ['worn', 'faded', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'],
  };

  // Location pool weighted by origin
  const locationPoolByOrigin = {
    precarious:  ['accessible','accessible','accessible','accessible','accessible','accessible','stored','stored','stored','stored'],
    modest:      ['accessible','accessible','accessible','accessible','stored','stored','stored','stored','stored','stored'],
    comfortable: ['accessible','accessible','stored','stored','stored','stored','stored','stored','stored','stored'],
    secure:      ['accessible','stored','stored','stored','stored','stored','stored','stored','stored','stored'],
  };

  /**
   * Generate the initial wardrobe. Must be called LAST in generateRandom().
   * 1 charRng call per category (count), 3 per item (name, condition, location).
   * Total call count varies by origin: ~24 (precarious) to ~72 (secure).
   *
   * Approximation debt (clothing): wardrobe generation uses economic_origin as a snapshot proxy for
   * (financial situation × housing stability × time-indexed exit events × job tenure ×
   * laundry access × body trajectory). The correct model is a simulated trajectory —
   * accumulation from some historical start point, loss events applied at specific dates.
   * When simulateLifeHistory() exists, this function should draw from it directly.
   *
   * @param {{ economic_origin: string }} backstory
   * @param {number} latitude
   * @returns {import('./clothing.js').ClothingItem[]}
   */
  /**
   * @param {{ economic_origin: string }} backstory
   * @param {number} latitude
   * @param {string} aesthetic
   * @param {{ breast_tissue_score?: number | null, abdominal_baseline?: number | null } | null} [bodyParams]
   */
  function generateWardrobe(backstory, latitude, aesthetic, bodyParams) {
    const origin = backstory.economic_origin ?? 'modest';
    const isTropical = Math.abs(latitude) < 23.5;
    const items = [];
    const idCounters = /** @type {Record<string, number>} */ ({});
    const aestheticPools = wardrobeItemPoolsByAesthetic[aesthetic] || wardrobeItemPoolsByAesthetic.classic;

    for (const type of ['top', 'bottom', 'underwear', 'socks', 'shoes', 'outerwear', 'dress']) {
      let [lo, hi] = wardrobeCounts[type][origin];
      if (type === 'outerwear' && isTropical) { lo = 0; hi = 0; }
      if (hi === 0) continue;

      // 1 charRng call for item count in this category
      const count = ctx.timeline.charRandomInt(lo, hi);

      const pool = aestheticPools[type];
      const condPool = conditionPoolByOrigin[origin];
      const locPool = locationPoolByOrigin[origin];

      for (let i = 0; i < count; i++) {
        if (!idCounters[type]) idCounters[type] = 0;
        const id = `${type}_${idCounters[type]++}`;

        // 3 charRng calls per item: name, condition, location
        const name = pool[Math.floor(ctx.timeline.charRandom() * pool.length)];
        const condition = condPool[Math.floor(ctx.timeline.charRandom() * condPool.length)];
        const location = locPool[Math.floor(ctx.timeline.charRandom() * locPool.length)];

        items.push({
          id,
          type,
          name,
          condition,
          location,
          wearState: 'clean',
          fit: 'comfortable',
          chest_at_acquisition: bodyParams?.breast_tissue_score ?? null,
          abdominal_at_acquisition: bodyParams?.abdominal_baseline ?? null,
          damage: { torn: false, stained: false, stretched: false },
          wearCount: 0,
        });
      }
    }
    return items;
  }

  // --- Random character generation ---

  function generateRandom() {
    const usedNames = new Set();

    // --- Identity dimensions (moved up — needed for gendered name generation) ---
    // 8 unconditional charRng calls. All calls always consumed regardless of result.
    // Approximation debt (identity): prevalence estimates approximate — US general population, 2020s.
    const pronounsRoll   = ctx.timeline.charRandom(); // call 1: pronouns
    const genderRoll     = ctx.timeline.charRandom(); // call 2: gender identity
    const expressionRoll = ctx.timeline.charRandom(); // call 3: expression variation
    const hrtRoll        = ctx.timeline.charRandom(); // call 4: HRT
    const sexualityRoll  = ctx.timeline.charRandom(); // call 5: sexual orientation
    const romanticRoll   = ctx.timeline.charRandom(); // call 6: romantic orientation
    const sensualRoll    = ctx.timeline.charRandom(); // call 7: sensual + aesthetic
    const outStatusRoll  = ctx.timeline.charRandom(); // call 8: out-status variation

    // Derive expression dimensions early — needed for gendered name pools.
    const isTrans = genderRoll < 0.008;
    const isNonbinary = !isTrans && genderRoll < 0.023;
    let expression_femininity, expression_masculinity;
    if (isTrans) {
      const femExpression = pronounsRoll < 0.47;
      expression_femininity = femExpression ? 55 + Math.floor(expressionRoll * 35) : 10 + Math.floor(expressionRoll * 25);
      expression_masculinity = femExpression ? 10 + Math.floor(expressionRoll * 20) : 55 + Math.floor(expressionRoll * 35);
    } else if (isNonbinary) {
      expression_femininity = 25 + Math.floor(expressionRoll * 50);
      expression_masculinity = 25 + Math.floor(expressionRoll * 50);
    } else {
      const femLeaning = pronounsRoll < 0.47;
      expression_femininity = femLeaning ? 50 + Math.floor(expressionRoll * 40) : 5 + Math.floor(expressionRoll * 30);
      expression_masculinity = femLeaning ? 5 + Math.floor(expressionRoll * 25) : 50 + Math.floor(expressionRoll * 40);
    }

    // Player name — gendered by expression dimensions. 3 charRng calls.
    const playerName = generateFullName(usedNames, expression_femininity, expression_masculinity);

    // Friends — pronoun → gendered first name → last name. 4 charRng calls each.
    const friend1Pronoun = generateNpcPronounSet();
    const f1expr = expressionFromPronounSet(friend1Pronoun);
    const friend1Name = generateGenderedFirstName(usedNames, f1expr.fem, f1expr.masc);
    const friend1Last = generateLastName(usedNames);

    const friend2Pronoun = generateNpcPronounSet();
    const f2expr = expressionFromPronounSet(friend2Pronoun);
    const friend2Name = generateGenderedFirstName(usedNames, f2expr.fem, f2expr.masc);
    const friend2Last = generateLastName(usedNames);

    const friendFlavors = ['sends_things', 'checks_in', 'dry_humor', 'earnest'];
    const f1flavor = ctx.timeline.charPick(friendFlavors);
    const remainingFriend = friendFlavors.filter(f => f !== f1flavor);
    const f2flavor = ctx.timeline.charPick(remainingFriend);

    // Coworkers — pronoun → gendered first name → last name. 4 charRng calls each.
    const coworker1Pronoun = generateNpcPronounSet();
    const c1expr = expressionFromPronounSet(coworker1Pronoun);
    const coworker1Name = generateGenderedFirstName(usedNames, c1expr.fem, c1expr.masc);
    const coworker1Last = generateLastName(usedNames);

    const coworker2Pronoun = generateNpcPronounSet();
    const c2expr = expressionFromPronounSet(coworker2Pronoun);
    const coworker2Name = generateGenderedFirstName(usedNames, c2expr.fem, c2expr.masc);
    const coworker2Last = generateLastName(usedNames);

    const coworkerFlavors = ['warm_quiet', 'mundane_talker', 'stressed_out'];
    const c1flavor = ctx.timeline.charPick(coworkerFlavors);
    const remainingCoworker = coworkerFlavors.filter(f => f !== c1flavor);
    const c2flavor = ctx.timeline.charPick(remainingCoworker);

    // Supervisor — pronoun → gendered first name → last name. 4 charRng calls.
    const supervisorPronoun = generateNpcPronounSet();
    const supExpr = expressionFromPronounSet(supervisorPronoun);
    const supervisorName = generateGenderedFirstName(usedNames, supExpr.fem, supExpr.masc);
    const supervisorLast = generateLastName(usedNames);

    // Job, age
    // gigTypeRoll: 1 unconditional charRng call for stream balance regardless of whether
    // the character ends up as a gig worker. Gig arrangement decided in finishCreation()
    // after backstory is generated; this call must be consumed on all branches.
    const gigTypeRoll = ctx.timeline.charRandom(); // 1 call always — replay balance
    const jobType = ctx.timeline.charPick(['office', 'retail', 'food_service']);
    const age = ctx.timeline.charRandomInt(22, 48);
    const sleepwear = ctx.timeline.charPick(sleepwearOptions);

    // Start date — random day in 2024, stored as minutes since Unix epoch
    const baseDateMinutes = 28401120; // 2024-01-01 00:00 UTC
    const dayOffset = ctx.timeline.charRandomInt(0, 364);
    const startTimestamp = baseDateMinutes + dayOffset * 1440;
    // Personality — generated silently, never shown in chargen UI
    const personality = {
      neuroticism:      Math.floor(ctx.timeline.charRandom() * 101),
      self_esteem:      Math.floor(ctx.timeline.charRandom() * 101),
      rumination:       Math.floor(ctx.timeline.charRandom() * 101),
      trait_loneliness: Math.floor(ctx.timeline.charRandom() * 101), // h²=48% (Boomsma 2005 PMID 16273322); sets social decay asymptote
      introversion:     Math.floor(ctx.timeline.charRandom() * 101), // h²=49% (Vukasović & Bratko 2015 PMID 26053889); scales social energy depletion and recovery
    };

    // Extract latitude before sentiments to preserve existing charRng order
    const latitude = ctx.timeline.charPick(locationOptions).latitude;

    // Sentiments — likes/dislikes, generated silently (Layer 2 basic sentiments)
    const sentiments = [];

    // Weather — everyone has preferences
    const weathers = ['clear', 'overcast', 'grey', 'drizzle'];
    const likedWeather = ctx.timeline.charPick(weathers);
    const likedIntensity = 0.05 + ctx.timeline.charRandom() * 0.8;
    sentiments.push({ target: 'weather_' + likedWeather, quality: 'comfort', intensity: likedIntensity });
    const dislikedPool = weathers.filter(w => w !== likedWeather);
    const dislikedWeather = ctx.timeline.charPick(dislikedPool);
    const dislikedIntensity = 0.05 + ctx.timeline.charRandom() * 0.55;
    sentiments.push({ target: 'weather_' + dislikedWeather, quality: 'irritation', intensity: dislikedIntensity });

    // Time of day — morning or evening person
    const timePref = ctx.timeline.charPick(['morning', 'evening']);
    const timeIntensity = 0.1 + ctx.timeline.charRandom() * 0.7;
    sentiments.push({ target: 'time_' + timePref, quality: 'comfort', intensity: timeIntensity });

    // Food comfort — some eat for comfort, others eat mechanically
    const foodIntensity = 0.02 + ctx.timeline.charRandom() * 0.78;
    sentiments.push({ target: 'eating', quality: 'comfort', intensity: foodIntensity });

    // Rain sound — the sound of rain on windows
    const rainIntensity = 0.02 + ctx.timeline.charRandom() * 0.88;
    sentiments.push({ target: 'rain_sound', quality: 'comfort', intensity: rainIntensity });

    // Quiet — comfort or irritation
    const quietIntensity = 0.1 + ctx.timeline.charRandom() * 0.6;
    const quietQuality = ctx.timeline.charRandom() > 0.35 ? 'comfort' : 'irritation';
    sentiments.push({ target: 'quiet', quality: quietQuality, intensity: quietIntensity });

    // Being outside
    const outsideIntensity = 0.02 + ctx.timeline.charRandom() * 0.68;
    sentiments.push({ target: 'outside', quality: 'comfort', intensity: outsideIntensity });

    // Physical warmth
    const warmthIntensity = 0.02 + ctx.timeline.charRandom() * 0.78;
    sentiments.push({ target: 'warmth', quality: 'comfort', intensity: warmthIntensity });

    // Routine — comfort or irritation
    const routineIntensity = 0.1 + ctx.timeline.charRandom() * 0.5;
    const routineQuality = ctx.timeline.charRandom() > 0.4 ? 'comfort' : 'irritation';
    sentiments.push({ target: 'routine', quality: routineQuality, intensity: routineIntensity });

    // Life history — backstory generation (charRng stream)
    const backstory = generateBackstory(age);

    // Phone cracked screen — derived from economic_origin (which itself comes from backstory).
    // Tight budget + years of use → decent chance of a crack that never got fixed.
    // Exactly 1 charRng call.
    const crackedProb = { precarious: 0.55, modest: 0.30, comfortable: 0.08, secure: 0.01 };
    const phone_cracked = ctx.timeline.charRandom() < (crackedProb[backstory.economic_origin] ?? 0.30);

    // housing_quality and laundry_access computed after financialSim (see below)

    // Bill day offsets — deterministic per character (charRng)
    const paycheck_day_offset = ctx.timeline.charRandomInt(0, 13);
    const rent_day_offset = ctx.timeline.charRandomInt(0, 29);
    const utility_day_offset = ctx.timeline.charRandomInt(0, 29);
    const phone_bill_day_offset = ctx.timeline.charRandomInt(0, 29);
    const ebt_day_offset = ctx.timeline.charRandomInt(0, 29); // day EBT reloads each month

    // Sleep cycle length — stable biological trait. Blume et al. 2023 (Sleep Health,
    // n=6,064 PSG cycles): median 96 min, right-skewed. We use a truncated normal
    // (mean=93, SD=12, clipped to [70,120]) sampled via inverse CDF — exactly 1 RNG call.
    // Φ⁻¹ implemented with Peter Acklam's rational approximation (max |error| < 1.15×10⁻⁹).
    // Approximation debt (sleep cycles): rational approximation introduces small tail error (~10⁻⁹ max);
    // negligible in practice but not exact. See TODO.md.
    const sleep_cycle_length = (() => {
      const MEAN = 93, SD = 12, LO = 70, HI = 120;
      // Φ(x): standard normal CDF via complementary error function
      function phi(x) {
        // Abramowitz & Stegun 26.2.17 — erfc rational approximation
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
        const p = 1 - poly * Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
        return x >= 0 ? p : 1 - p;
      }
      // Φ⁻¹(p): probit via Peter Acklam's rational approximation
      // Approximation debt (sleep cycles): rational approximation (max |error| < 1.15×10⁻⁹ over (0,1)).
      function probit(p) {
        const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
                    1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
        const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
                    6.680131188771972e+01, -1.328068155288572e+01];
        const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
                   -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
        const d = [ 7.784695709041462e-03,  3.224671290700398e-01,  2.445134137142996e+00,
                    3.754408661907416e+00];
        const pLow = 0.02425, pHigh = 1 - pLow;
        if (p < pLow) {
          const q = Math.sqrt(-2 * Math.log(p));
          return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                 ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
        } else if (p <= pHigh) {
          const q = p - 0.5, r = q * q;
          return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
                 (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
        } else {
          const q = Math.sqrt(-2 * Math.log(1 - p));
          return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                  ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
        }
      }
      const phiLo = phi((LO - MEAN) / SD);
      const phiHi = phi((HI - MEAN) / SD);
      const u = ctx.timeline.charRandom(); // exactly 1 RNG call
      const p = phiLo + u * (phiHi - phiLo);
      return Math.round(Math.max(LO, Math.min(HI, MEAN + SD * probit(p))));
    })();

    // Health conditions — generated last to preserve PRNG order of prior systems
    const conditions = /** @type {string[]} */ ([]);
    // Migraines: ~15% prevalence; slightly higher with neurotic/high-stress backstory
    const migraineBase = 0.15;
    const migraineBoost = (personality.neuroticism > 65 ? 0.05 : 0)
      + (backstory.career_stability < 0.4 ? 0.05 : 0); // precarious careers → more chronic stress
    if (ctx.timeline.charRandom() < migraineBase + migraineBoost) {
      conditions.push('migraines');
    }

    // Dental pain: circumstantial condition. Only at-risk for characters whose economic history
    // indicates inability to afford regular dental care. For comfortable/secure origins the
    // probability is effectively zero — don't roll. Within the at-risk group, ~35% prevalence
    // is consistent with CDC NHANES data for low-income adults with untreated dental decay.
    // Approximation debt (dental pain): no jurisdiction model yet — dental access varies enormously by country.
    // Note: simulateFinancialHistory() is deterministic (no charRng); calling it here for the
    // dental eligibility check doesn't affect RNG order. The same call happens in finishCreation().
    const financialSim = simulateFinancialHistory(backstory, age, jobType);

    // Housing quality — composite score 0–100 derived from rent, economic origin, and financial anxiety.
    // Primary driver: rent_amount (higher rent within budget → better apartment quality).
    // Secondary: economic_origin (better origin → more likely to have secured good housing for the rent).
    // Tertiary: financial_anxiety (anxious characters more likely to have chosen cheap housing to save).
    // Normalization: rent ranges across all origins span [400, 950]; dividing by 1200 gives headroom.
    // Approximation debt (housing quality): derived formula chosen; real factors include local housing
    // market conditions, age at renting, social network access, disability, and discrimination.
    // No empirical literature on housing quality as a function of income bracket and anxiety.
    const hqRentNorm = Math.min(financialSim.rent_amount / 1200, 1.0);
    const hqOriginBonus = { precarious: -15, modest: -5, comfortable: 5, secure: 15 }[backstory.economic_origin] ?? 0;
    const hqAnxietyPenalty = financialSim.financial_anxiety * 20;
    const housing_quality = Math.max(5, Math.min(95, hqRentNorm * 80 + hqOriginBonus - hqAnxietyPenalty + 20));

    // Laundry access — derived from housing_quality. No charRng consumed (deterministic).
    // housing_quality >= 70: in_unit laundry likely (higher-end apartments include it)
    // housing_quality >= 35: building laundry likely (mid-range buildings have shared machines)
    // housing_quality < 35: laundromat only (budget apartments rarely include any shared laundry)
    // 'handwash' deferred — requires separate sink interaction that doesn't exist yet.
    const laundry_access = housing_quality >= 70 ? 'in_unit'
                         : housing_quality >= 35 ? 'building'
                         : 'laundromat';

    // --- Family relationship generation ---
    // 4 charRng calls total: family type roll, member type roll, name (2 calls: pool + pick).
    // Family type probabilities are modulated by economic origin, neuroticism, and financial anxiety.
    // Three buckets based on background stress level:
    //   Low stress (low anxiety + comfortable/secure): supportive 55%, conditional 25%, distant 15%, absent 4%, hostile 1%
    //   Medium (everything else):                      supportive 35%, conditional 30%, distant 20%, absent 12%, hostile 3%
    //   High stress (precarious OR high anxiety OR neuroticism > 70):
    //                                                  supportive 20%, conditional 25%, distant 25%, absent 20%, hostile 10%
    //
    // Approximation debt (family): probabilities chosen to reflect qualitative literature on family dysfunction
    // rates by SES and stress exposure; not directly derived from published conditional probability data.
    // Direction: lower SES and higher stress correlate with more adverse family dynamics
    // (Conger & Donnellan 2007 — PMID unverified; see docs/research/family.md when created).
    const familyRoll = ctx.timeline.charRandom(); // call 1: family type
    const fa = financialSim.financial_anxiety;
    const neu = personality.neuroticism;
    const isHighStress = backstory.economic_origin === 'precarious' || fa > 0.4 || neu > 70;
    const isLowStress = fa < 0.3 && (backstory.economic_origin === 'comfortable' || backstory.economic_origin === 'secure') && neu <= 60;

    let family_type;
    if (isLowStress) {
      // Low stress bucket: supportive 55%, conditional 25%, distant 15%, absent 4%, hostile 1%
      if      (familyRoll < 0.55) family_type = 'supportive';
      else if (familyRoll < 0.80) family_type = 'conditional';
      else if (familyRoll < 0.95) family_type = 'distant';
      else if (familyRoll < 0.99) family_type = 'absent';
      else                         family_type = 'hostile';
    } else if (isHighStress) {
      // High stress bucket: supportive 20%, conditional 25%, distant 25%, absent 20%, hostile 10%
      if      (familyRoll < 0.20) family_type = 'supportive';
      else if (familyRoll < 0.45) family_type = 'conditional';
      else if (familyRoll < 0.70) family_type = 'distant';
      else if (familyRoll < 0.90) family_type = 'absent';
      else                         family_type = 'hostile';
    } else {
      // Medium bucket: supportive 35%, conditional 30%, distant 20%, absent 12%, hostile 3%
      if      (familyRoll < 0.35) family_type = 'supportive';
      else if (familyRoll < 0.65) family_type = 'conditional';
      else if (familyRoll < 0.85) family_type = 'distant';
      else if (familyRoll < 0.97) family_type = 'absent';
      else                         family_type = 'hostile';
    }

    const familyArchetypeMap = {
      supportive:  'warm_caring',
      conditional: 'performance_watching',
      distant:     'checked_out',
      absent:      'unreachable',
      hostile:     'critical',
    };
    const family_archetype = familyArchetypeMap[family_type];

    // Call 2: family member type (who is this person?)
    const familyMemberRoll = ctx.timeline.charRandom();
    const family_member = familyMemberRoll < 0.60 ? 'parent'
                        : familyMemberRoll < 0.85 ? 'both_parents'
                        : 'sibling';

    // Calls 3-4: family member name (pool selection + charWeightedPick)
    const familyName = generateFirstName(usedNames);

    const family = { type: family_type, archetype: family_archetype, member: family_member, name: familyName };

    if (backstory.economic_origin === 'precarious') {
      if (ctx.timeline.charRandom() < 0.35) conditions.push('dental_pain');
    } else if (backstory.economic_origin === 'modest' && financialSim.starting_money < 200) {
      // Modest origin + severe financial hardship from life events → borderline at-risk
      if (ctx.timeline.charRandom() < 0.20) conditions.push('dental_pain');
    }

    // Autonomic dysregulation: constitutional predisposition to vasovagal episodes.
    // Clinically significant dysautonomia ~1–3% prevalence; recurrent vasovagal syncope ~3–5%.
    // Using 4% base rate to cover the overlap.
    // Ref: Grubb 2005 (PMID 15996440); Sheldon et al. 2015 (Europace, DOI 10.1093/europace/euv014).
    // Approximation debt (vasovagal): no jurisdiction or family history model; no sex-differential
    // (young women are overrepresented ~2:1 in POTS/dysautonomia populations).
    if (ctx.timeline.charRandom() < 0.04) {
      conditions.push('autonomic_dysregulation');
    }

    // Gastritis: chronic inflammation of the stomach lining.
    // Three upstream pathways — implement paths 1 (stress history) and 3 (H. pylori via SES proxy)
    // from available backstory data. NSAID overuse (path 2) requires game-history data unavailable at chargen.
    //
    // Path 1 — Stress history: chronic psychosocial stress upregulates cortisol, disrupts gastric
    //   mucosal defense, and alters gut microbiome. High-stress backstory raises gastritis risk.
    //   Operationalized via: precarious economic origin + high financial anxiety from life events.
    //   Ref: Approximation debt (gastritis): stress→gastritis link direction from Jones et al. 2006
    //   (PMID 17148741) but individual-level probability magnitude not derived from that data.
    //
    // Path 3 — H. pylori: ~44% global prevalence; higher with lower SES (crowding, water quality).
    //   SES proxy: economic_origin. Precarious → ~60–70% H. pylori exposure; modest → ~45%;
    //   comfortable/secure → ~25–30%. Gastritis develops in ~10–15% of H. pylori carriers.
    //   Ref: Hooi et al. 2017 — PMID unverified; direction and order-of-magnitude from
    //   systematic review (Gastroenterology, DOI 10.1053/j.gastro.2017.04.022). Approximation debt (gastritis): conditional probability
    //   (gastritis | H. pylori) not cleanly separated from (gastritis | stress); real data
    //   shows additive risk. Modeling as independent paths with combined base rate.
    //
    // Overall prevalence target: ~10–15% general population (Bytzer 2001 PMID 11389773).
    // Approximation debt (gastritis): individual path probabilities below chosen to hit ~12% overall;
    //   not independently derived from multi-path conditional probability data.
    {
      // financialSim already computed above for dental_pain check (deterministic, no RNG)
      const highStress = backstory.economic_origin === 'precarious'
        || (backstory.career_stability < 0.3 && financialSim.financial_anxiety > 0.25);

      // H. pylori path — SES-stratified exposure probability, then conditional gastritis
      const hPyloriExposureRate = backstory.economic_origin === 'precarious' ? 0.65
        : backstory.economic_origin === 'modest' ? 0.45
        : 0.27; // comfortable/secure — Approximation debt (gastritis)
      const hPyloriConditionalGastritis = 0.12; // ~12% of carriers develop chronic gastritis — Approximation debt (gastritis)
      const hPyloriPath = ctx.timeline.charRandom() < hPyloriExposureRate * hPyloriConditionalGastritis;

      // Stress path — elevated gastritis risk from chronic psychosocial stress history
      // Approximation debt (gastritis): 0.08 stress-path probability chosen; no published individual-level RR
      const stressPath = highStress && ctx.timeline.charRandom() < 0.08;

      if (hPyloriPath || stressPath) {
        conditions.push('gastritis');
      }
    }

    // --- Food profile ---
    // Dietary identity: cultural tradition, ethical stance, health restrictions,
    // cooking skill, comfort foods, and pantry slots.
    // 9 charRng calls always consumed, placed after conditions, before substances.
    const food_profile = (() => {
      // --- cooking_skill: deterministic (no RNG). ---
      // Derived from economic_origin + career_stability.
      // Precarious+stable = high (learned from necessity), precarious+unstable = low (chaotic home),
      // modest = mid, comfortable/secure = mid (food was provided, not taught).
      // Approximation debt (cooking_skill): derivation from economic_origin + career_stability;
      // real skill depends on parental modeling, culture, disability, interest.
      let cooking_skill;
      const origin = backstory.economic_origin;
      const stability = backstory.career_stability;
      if (origin === 'precarious' && stability >= 0.5) {
        cooking_skill = 55 + Math.round(stability * 30); // 55–85
      } else if (origin === 'precarious') {
        cooking_skill = 10 + Math.round(stability * 40); // 10–30
      } else if (origin === 'modest') {
        cooking_skill = 30 + Math.round(stability * 30); // 30–60
      } else {
        // comfortable/secure — food was provided, skill varies
        cooking_skill = 25 + Math.round(stability * 25); // 25–50
      }

      // --- cultural_tradition: 1 charRng call. ---
      // No ethnicity system exists — tradition is derived from jurisdiction as a population-level
      // proxy. Within a jurisdiction, all traditions are plausible; the roll samples from a
      // weighted distribution that roughly reflects immigration and demographic composition.
      // This is a coarse approximation: real cultural food identity is individual, not national.
      // Approximation debt (food profile): tradition weights derived from rough US/CA/UK/AU
      // demographic composition estimates; no jurisdiction-differentiated distribution; real
      // individual-level identity depends on family history, immigration generation, and
      // self-identification — none of which are modeled yet.
      const traditionRoll = ctx.timeline.charRandom(); // call 1
      // Weight pool: western 35%, latin 18%, east_asian 14%, south_asian 10%,
      //   west_african 8%, middle_eastern 7%, eastern_european 5%, mixed 3%.
      // Approximation debt (food profile): weights chosen to approximate anglophone-country
      // demographics; no per-jurisdiction differentiation implemented.
      let cultural_tradition;
      if      (traditionRoll < 0.35) cultural_tradition = 'western';
      else if (traditionRoll < 0.53) cultural_tradition = 'latin';
      else if (traditionRoll < 0.67) cultural_tradition = 'east_asian';
      else if (traditionRoll < 0.77) cultural_tradition = 'south_asian';
      else if (traditionRoll < 0.85) cultural_tradition = 'west_african';
      else if (traditionRoll < 0.92) cultural_tradition = 'middle_eastern';
      else if (traditionRoll < 0.97) cultural_tradition = 'eastern_european';
      else                           cultural_tradition = 'mixed';

      // --- ethical_stance: 2 charRng calls always consumed. ---
      // Approximation debt (food profile): US Gallup 2023 ~5% vegetarian, ~3% vegan.
      // Added flexitarian (~10%) and pescatarian (~3%) from IFIC Foundation 2023 estimates.
      // No jurisdiction, age, or cultural differential implemented.
      // Empathy proxy: self_esteem > 60 AND neuroticism > 40 → slight boost toward restrictive stances.
      const ethicalRoll1 = ctx.timeline.charRandom(); // call 2: stance type
      const ethicalRoll2 = ctx.timeline.charRandom(); // call 3: always consumed for balance
      const empathyBoost = (personality.self_esteem > 60 && personality.neuroticism > 40) ? 0.02 : 0;
      /** @type {'omnivore'|'flexitarian'|'vegetarian'|'vegan'|'pescatarian'} */
      let ethical_stance;
      if      (ethicalRoll1 < 0.03 + empathyBoost)                    ethical_stance = 'vegan';
      else if (ethicalRoll1 < 0.08 + empathyBoost)                    ethical_stance = 'vegetarian';
      else if (ethicalRoll1 < 0.11 + empathyBoost)                    ethical_stance = 'pescatarian';
      else if (ethicalRoll1 < 0.21 + empathyBoost)                    ethical_stance = 'flexitarian';
      else                                                              ethical_stance = 'omnivore';
      void ethicalRoll2; // consumed for balance — available for future pescatarian/flexitarian branching

      // --- health_restrictions: 2 charRng calls always consumed. ---
      // Restrictions are probabilistic draws from real prevalence data; can stack.
      // Approximation debt (food profile): prevalence values below are approximate; individual
      // lactose intolerance rates vary strongly by ancestry — using tradition as proxy.
      //
      // Lactose intolerance:
      //   ~15% European-ancestry (western, eastern_european): Swallow 2003 (PMID 12564266)
      //   ~70-80% East Asian ancestry: Swallow 2003 (PMID 12564266) — Approximation debt (food profile): exact rate varies by population subgroup
      //   ~65-70% West African ancestry: Swallow 2003 (PMID 12564266) — Approximation debt (food profile): idem
      //   ~65-70% South Asian ancestry: Approximation debt (food profile): Swallow 2003 cited direction; exact South Asian rate less well-characterized, PMID unverified for this specific estimate
      //   ~30-50% Latin ancestry: Approximation debt (food profile): heterogeneous; mixed indigenous/European heritage
      //   ~65% Middle Eastern ancestry: Approximation debt (food profile): Swallow 2003 cited direction; PMID unverified for Middle Eastern subgroup
      //   ~1% mixed (use mean ~40%): Approximation debt (food profile): population-weighted mean placeholder
      const lactoseRate = cultural_tradition === 'east_asian'         ? 0.75
                        : cultural_tradition === 'west_african'        ? 0.68
                        : cultural_tradition === 'south_asian'         ? 0.67
                        : cultural_tradition === 'middle_eastern'      ? 0.65
                        : cultural_tradition === 'latin'               ? 0.40
                        : cultural_tradition === 'mixed'               ? 0.40
                        : 0.15; // western, eastern_european
      const health_restrictions = /** @type {string[]} */ ([]);
      const lactoseRoll = ctx.timeline.charRandom(); // call 4
      if (lactoseRoll < lactoseRate) {
        health_restrictions.push('lactose_intolerant');
      }

      // Celiac / gluten sensitivity:
      //   ~1% clinically diagnosed celiac (Fasano et al. 2003, PMID 12548071);
      //   ~6% non-celiac gluten sensitivity (Approximation debt (food profile): Catassi 2015 — PMID unverified;
      //   estimated range wide, 0.5-13% across studies; 6% chosen as conservative midpoint).
      //   Combined dietary gluten avoidance ~7%: using combined roll with tier split.
      const glutenRoll = ctx.timeline.charRandom(); // call 5
      if (glutenRoll < 0.01) {
        health_restrictions.push('gluten_free'); // celiac — strict requirement
      } else if (glutenRoll < 0.07) {
        health_restrictions.push('low_gluten'); // sensitivity — avoidance preference
      }

      // Nut allergy: ~1-2% adults (FARE, Sicherer & Sampson 2014 — PMID unverified;
      // Approximation debt (food profile): 1.5% placeholder for tree nut + peanut combined).
      // Approximation debt (food profile): nut allergy roll not yet added — deferred to keep
      // call count manageable for this implementation step. Stub for future addition.

      // --- pantry_slots and comfort_foods: 4 charRng calls always consumed. ---
      // pantry_slots: the set of ingredient types this character keeps stocked.
      // Derived from cultural_tradition + ethical_stance. Universal base, then tradition-specific additions.

      // Base staples — everyone has these (or vegan substitutes)
      const pantry_slots = /** @type {string[]} */ ([]);

      // Grain/starch base: tradition determines the primary carbohydrate(s)
      const traditionStarchPick = ctx.timeline.charRandom(); // call 6: primary starch variant
      if (cultural_tradition === 'east_asian' || cultural_tradition === 'south_asian') {
        pantry_slots.push('rice');
        if (traditionStarchPick < 0.4) pantry_slots.push('noodles');
      } else if (cultural_tradition === 'latin') {
        pantry_slots.push('rice');
        pantry_slots.push('tortillas');
      } else if (cultural_tradition === 'west_african') {
        pantry_slots.push('rice');
        if (traditionStarchPick < 0.5) pantry_slots.push('oats'); else pantry_slots.push('bread');
      } else if (cultural_tradition === 'middle_eastern') {
        pantry_slots.push('rice');
        pantry_slots.push('bread');
      } else if (cultural_tradition === 'eastern_european') {
        pantry_slots.push('potatoes');
        pantry_slots.push('bread');
        if (traditionStarchPick < 0.6) pantry_slots.push('pasta');
      } else {
        // western, mixed
        pantry_slots.push('bread');
        if (traditionStarchPick < 0.55) pantry_slots.push('pasta'); else pantry_slots.push('rice');
      }

      // Protein staple: gated by ethical_stance
      const proteinRoll = ctx.timeline.charRandom(); // call 7: protein variant
      if (ethical_stance === 'vegan' || ethical_stance === 'vegetarian') {
        pantry_slots.push('beans');
        if (cultural_tradition === 'east_asian' || cultural_tradition === 'south_asian') {
          if (proteinRoll < 0.6) pantry_slots.push('tofu');
        } else if (proteinRoll < 0.5) {
          pantry_slots.push('peanut_butter');
        }
      } else if (ethical_stance === 'pescatarian') {
        if (proteinRoll < 0.5) {
          pantry_slots.push('canned_tuna');
        } else {
          pantry_slots.push('beans');
        }
        pantry_slots.push('eggs');
      } else {
        // omnivore / flexitarian — eggs are the default protein staple
        pantry_slots.push('eggs');
        if (cultural_tradition === 'latin' || cultural_tradition === 'west_african') {
          pantry_slots.push('beans'); // beans are a starch+protein staple in these traditions
        } else if (proteinRoll < 0.4) {
          pantry_slots.push('beans'); // others sometimes keep beans too
        }
      }

      // Canned goods — universal shelf-stable
      pantry_slots.push('canned');

      // Condiments/oil — the tradition determines which flavoring agents
      const condimentRoll = ctx.timeline.charRandom(); // call 8: condiment variant
      pantry_slots.push('oil');
      if (cultural_tradition === 'east_asian') {
        pantry_slots.push('soy_sauce');
      } else if (cultural_tradition === 'south_asian') {
        pantry_slots.push('spices'); // curry powder / garam masala / etc.
      } else if (cultural_tradition === 'latin') {
        pantry_slots.push('hot_sauce');
      } else if (cultural_tradition === 'west_african') {
        pantry_slots.push('spices');
      } else if (cultural_tradition === 'middle_eastern') {
        pantry_slots.push('spices');
      } else {
        // western, eastern_european, mixed — default condiment
        if (condimentRoll < 0.5) pantry_slots.push('hot_sauce'); else pantry_slots.push('spices');
      }

      // Snack slot — always present (category that gets restocked impulsively)
      pantry_slots.push('snacks');

      // --- comfort_foods: 1 charRng call. ---
      // 2-3 specific items drawn from cultural tradition. These are what feel like "home."
      // Approximation debt (food profile): comfort food lists are culturally plausible but not
      // empirically sourced; items chosen to be recognizable and texturally meaningful.
      const comfortRoll = ctx.timeline.charRandom(); // call 9: comfort food variant
      /** @type {Record<string, string[][]>} */
      const traditionComfortSets = {
        western:           [['grilled_cheese', 'tomato_soup'], ['mac_and_cheese', 'chips'], ['scrambled_eggs', 'toast', 'coffee']],
        latin:             [['rice_and_beans', 'hot_sauce'], ['tortillas_with_eggs', 'salsa'], ['arroz_con_leche', 'pan_dulce']],
        east_asian:        [['congee', 'soy_sauce_eggs'], ['instant_noodles', 'soft_boiled_eggs'], ['rice_porridge', 'pickled_vegetables']],
        south_asian:       [['dal_and_rice', 'roti'], ['khichdi', 'yogurt'], ['chai', 'biscuits', 'dal']],
        west_african:      [['jollof_rice', 'fried_plantains'], ['rice_and_stew', 'hot_sauce'], ['oatmeal_porridge', 'groundnuts']],
        middle_eastern:    [['rice_and_lentils', 'flatbread'], ['hummus_and_pita', 'olives'], ['shakshuka', 'bread']],
        eastern_european:  [['potato_soup', 'bread'], ['kasha_with_butter', 'tea'], ['boiled_potatoes', 'pickles', 'bread']],
        mixed:             [['rice_with_whatever', 'hot_sauce'], ['pasta_with_sauce', 'bread'], ['eggs_and_toast', 'tea']],
      };
      const sets = traditionComfortSets[cultural_tradition] || traditionComfortSets['western'] || [['eggs_and_toast', 'tea']];
      const setIdx = Math.floor(comfortRoll * sets.length);
      const comfort_foods = sets[setIdx] || sets[0] || ['eggs_and_toast', 'tea'];

      return {
        cooking_skill,
        cultural_tradition,
        ethical_stance,
        health_restrictions,
        comfort_foods,
        pantry_slots,
      };
    })();

    // Smoker status — established nicotine habit at game start.
    // Prevalence ~15–18% in many high-income countries; higher in lower-SES populations.
    // Approximation debt (nicotine): 0.17 base rate chosen; real rates vary significantly by
    // jurisdiction, age, and SES (CDC NHANES 2021: ~11% US adults; UK NHS 2022: ~13%; lower-
    // income subgroups 20–30%). No jurisdiction or age-differential model implemented.
    // SES boost: precarious → +8%, modest → +3%. Direction from CDC health disparities data.
    // Approximation debt (nicotine): SES boost magnitudes chosen, not literature-derived.
    const smokerBase = 0.17;
    const smokerBoost = backstory.economic_origin === 'precarious' ? 0.08
      : backstory.economic_origin === 'modest' ? 0.03 : 0;
    const starting_smoker = ctx.timeline.charRandom() < (smokerBase + smokerBoost);
    // has_cigarettes_start — starting inventory for smokers. Always 2 charRng calls for balance,
    // matching the alcohol/cannabis pattern (ownership roll + amount roll both consumed regardless).
    const cigaretteOwnershipRoll = ctx.timeline.charRandom(); // 1 call always
    const cigaretteAmountRoll = ctx.timeline.charRandom();    // 1 call always (balance)
    const has_cigarettes_start = starting_smoker
      ? 3 + Math.floor(cigaretteAmountRoll * 16) // smoker: 3–18 cigarettes (partial to near-full pack)
      : 0;                                        // non-smoker: none

    // Alcohol tolerance — established drinking pattern at game start.
    // Heavy/problem drinker prevalence: ~15% (DSM-5 AUD lifetime ~29%; current heavy drinking ~15%
    // per NIAAA 2021 survey data). Social/light drinkers ~50%. Non-drinkers ~35%.
    // Approximation debt (alcohol): base prevalence rates chosen; real rates vary significantly by
    // jurisdiction, age, SES, and culture. No jurisdiction or age-differential model implemented.
    // SES boost for heavy drinking: precarious → +5%, modest → +2% (stress-driven use, limited
    // coping resources). Approximation debt (alcohol): SES boost magnitudes chosen.
    // tolerance=0: non-drinker or very light. tolerance=30–60: social drinker. tolerance=70+: heavy.
    const alcoholRoll = ctx.timeline.charRandom();
    const heavyDrinkerRate = 0.15
      + (backstory.economic_origin === 'precarious' ? 0.05 : 0)
      + (backstory.economic_origin === 'modest' ? 0.02 : 0);
    const socialDrinkerRate = 0.50; // cumulative threshold

    let alcohol_tolerance_start;
    if (alcoholRoll < heavyDrinkerRate) {
      // Heavy drinker: tolerance 60–90
      alcohol_tolerance_start = 60 + Math.round(ctx.timeline.charRandom() * 30);
    } else if (alcoholRoll < heavyDrinkerRate + socialDrinkerRate) {
      // Social/light drinker: tolerance 10–40
      alcohol_tolerance_start = 10 + Math.round(ctx.timeline.charRandom() * 30);
    } else {
      // Non-drinker
      alcohol_tolerance_start = 0;
    }

    // has_alcohol — starting home inventory.
    // Non-drinkers: 0. Social drinkers: ~40% chance of having something at home.
    // Heavy drinkers: ~85% chance.
    // Approximation debt (alcohol): ownership rates chosen; no empirical data on home alcohol
    // stock by drinking pattern.
    // RNG: always 2 calls (ownership check + amount roll) for balance across all branches.
    const alcoholOwnershipRoll = ctx.timeline.charRandom(); // 1 call always
    const alcoholAmountRoll = ctx.timeline.charRandom();    // 1 call always (balance)
    let has_alcohol_start = 0;
    if (alcohol_tolerance_start >= 60) {
      if (alcoholOwnershipRoll < 0.85) {
        has_alcohol_start = 1 + Math.floor(alcoholAmountRoll * 4); // 1–4 units
      }
    } else if (alcohol_tolerance_start >= 10) {
      if (alcoholOwnershipRoll < 0.40) {
        has_alcohol_start = 1 + Math.floor(alcoholAmountRoll * 2); // 1–2 units
      }
    }
    // Non-drinker: both calls consumed above, has_alcohol_start stays 0

    // Cannabis tolerance — established use pattern at game start.
    // Regular user prevalence: ~15–20% in many Western countries. Light/occasional: ~20%.
    // Non-users: ~60%.
    // Approximation debt (cannabis): base prevalence rates chosen; real rates vary significantly
    // by jurisdiction, age, and SES (SAMHSA 2022: ~19% past-year use among US adults; higher in
    // young adults 18–25 ~35%; lower in older adults). No jurisdiction or age differential implemented.
    // Approximation debt (jurisdiction): cannabis use prevalence here is jurisdiction-agnostic
    // (all characters draw from the same rate pool regardless of jurisdiction). Real rates in
    // illegal-majority jurisdictions are lower. Purchase is gated by canPurchaseSubstance() but
    // starting tolerance/inventory assumes past use occurred in a legal or accessible environment.
    // SES boost for regular use: precarious → +3% (self-medication pattern). Chosen, not literature-derived.
    // Approximation debt (cannabis): SES boost magnitude chosen.
    // RNG: always 2 calls (tolerance roll + inventory roll) for balance across all branches.
    const cannabisRoll = ctx.timeline.charRandom(); // 1 call always
    const cannabisInventoryRoll = ctx.timeline.charRandom(); // 1 call always (balance)
    const regularUserRate = 0.18
      + (backstory.economic_origin === 'precarious' ? 0.03 : 0);
    const lightUserRate = 0.20; // cumulative threshold

    let cannabis_tolerance_start;
    let has_cannabis_start = 0;
    if (cannabisRoll < regularUserRate) {
      // Regular user: tolerance 40–80
      // Approximation debt (cannabis): tolerance range 40–80 chosen; represents CB1 downregulation
      // from weekly-to-daily use. Hirvonen 2012 (PMID 22170954) shows measurable receptor changes
      // in heavy users; these are partial proxies.
      cannabis_tolerance_start = 40 + Math.round(cannabisInventoryRoll * 40);
      // Regular users likely have supply at home
      // Approximation debt (cannabis): 75% home ownership for regular users chosen.
      if (cannabisInventoryRoll < 0.75) {
        has_cannabis_start = 1 + Math.floor(cannabisInventoryRoll * 3); // 1–3 units
      } else {
        has_cannabis_start = 0;
      }
    } else if (cannabisRoll < regularUserRate + lightUserRate) {
      // Light/occasional user: tolerance 5–25
      cannabis_tolerance_start = 5 + Math.round(cannabisInventoryRoll * 20);
      // Occasional users rarely keep supply at home
      // Approximation debt (cannabis): 25% home ownership for light users chosen.
      if (cannabisInventoryRoll < 0.25) {
        has_cannabis_start = 1;
      }
    } else {
      // Non-user: tolerance 0
      cannabis_tolerance_start = 0;
      // has_cannabis_start stays 0 — both RNG calls consumed above
    }

    // Jurisdiction — country + optional region (state/province for federal systems).
    // ISO 3166-1 alpha-2 country codes; ISO 3166-2 subdivision codes for US/CA/AU.
    // Weighted to reflect English-speaking and Western-European game audience while including
    // jurisdictions where major substance laws differ meaningfully.
    //
    // Country group weights (Approximation debt (jurisdiction): weights chosen to represent
    // plausible player population distribution; no empirical data sourced):
    //   US (24 rec-legal states + 26 not): weight 50
    //   CA (federally legal): weight 12
    //   GB (illegal): weight 10
    //   AU (state-by-state, mostly decrim): weight 8
    //   DE (recently legalized, 2024): weight 6
    //   NL (tolerated/coffeeshop): weight 5
    //   FR (illegal): weight 4
    //   Other illegal majority: weight 5
    // Total: 100
    //
    // 2 charRng calls always consumed:
    //   Call 1: country group (always 1 call)
    //   Call 2: US state OR AU state/territory OR balance call for non-federal countries
    const jurisdictionRoll = ctx.timeline.charRandom(); // call 1: country group

    // US recreational-cannabis-legal states as of 2024 (24 states + DC):
    // CO, CA, OR, WA, AK, NV, MI, IL, MA, ME, VT, AZ, NJ, NY, CT, NM, MT, VA, MO, MD, MN, RI, DE, OH, DC
    const usLegalRegions = ['CO','CA','OR','WA','AK','NV','MI','IL','MA','ME','VT','AZ','NJ','NY','CT','NM','MT','VA','MO','MD','MN','RI','DE','OH'];
    // US states where recreational cannabis remains illegal (non-exhaustive):
    const usIllegalRegions = ['TX','FL','GA','NC','SC','AL','MS','LA','TN','KY','IN','OH_no','ID','UT','WY','ND','SD','NE','KS','OK','AR','WV','PA','VA_no'];
    // Note: PA and VA passed legislation so we keep them out of illegal list; OH passed in 2023.
    // Approximation debt (jurisdiction): US illegal list uses rough set; exact 50-state enumeration not implemented.
    // AU states/territories — cannabis mostly decriminalized or tolerated in ACT (legal), others decrim:
    const auRegions = ['ACT','NSW','VIC','QLD','WA','SA','TAS','NT'];

    let jurisdiction;
    if (jurisdictionRoll < 0.50) {
      // US — 50 states split legal/illegal
      const regionRoll = ctx.timeline.charRandom(); // call 2: US region
      // 24 legal states out of ~50 → ~48% chance of landing in a legal state
      const region = regionRoll < 0.48
        ? usLegalRegions[Math.floor(regionRoll / 0.48 * usLegalRegions.length)]
        : usIllegalRegions[Math.floor((regionRoll - 0.48) / 0.52 * usIllegalRegions.length)];
      jurisdiction = { country: 'US', region };
    } else if (jurisdictionRoll < 0.62) {
      // Canada — federally legal
      jurisdiction = { country: 'CA', region: null };
    } else if (jurisdictionRoll < 0.72) {
      // United Kingdom — illegal
      jurisdiction = { country: 'GB', region: null };
    } else if (jurisdictionRoll < 0.80) {
      // Australia — state-by-state; ACT is legal, others mostly decrim
      const regionRoll = ctx.timeline.charRandom(); // call 2: AU state
      const region = auRegions[Math.floor(regionRoll * auRegions.length)];
      jurisdiction = { country: 'AU', region };
    } else if (jurisdictionRoll < 0.86) {
      // Germany — recreational cannabis legalized April 2024
      jurisdiction = { country: 'DE', region: null };
    } else if (jurisdictionRoll < 0.91) {
      // Netherlands — tolerated (coffeeshop system); not technically legal but purchase accessible
      jurisdiction = { country: 'NL', region: null };
    } else if (jurisdictionRoll < 0.95) {
      // France — illegal
      jurisdiction = { country: 'FR', region: null };
    } else {
      // Other — treat as illegal majority (covers countries where most substances restricted)
      jurisdiction = { country: 'XX', region: null };
    }

    // Gym membership — active at game start.
    // Probability and cost derived from economic_origin.
    // Approximation debt (gym): membership probabilities and cost ranges chosen; no empirical
    // prevalence data by income bracket sourced. Direction: higher SES → more likely to have
    // and maintain a membership; precarious → budget gym if any.
    // Overall ~25% base rate across all origins; weighted higher for stable/comfortable.
    // 1 charRng call (membership roll); cost derived deterministically from origin.
    const gymMembershipRoll = ctx.timeline.charRandom(); // 1 call always
    const gymMembershipProb = backstory.economic_origin === 'precarious' ? 0.08
      : backstory.economic_origin === 'modest' ? 0.20
      : backstory.economic_origin === 'comfortable' ? 0.38
      : 0.52; // secure
    const gym_membership = gymMembershipRoll < gymMembershipProb;
    // Cost derived deterministically from origin — no RNG.
    // Approximation debt (gym): cost ranges chosen; real costs vary by city, amenities, and plan.
    // Precarious: budget gym $15–25 (Planet Fitness tier); modest: mid-range $30–50;
    // comfortable/secure: standard club $60+.
    const gym_membership_cost = backstory.economic_origin === 'precarious' ? 15
      : backstory.economic_origin === 'modest' ? 30
      : backstory.economic_origin === 'comfortable' ? 45
      : 65; // secure
    // Bill day offset — always 1 charRng call for balance.
    const gym_bill_day_offset = ctx.timeline.charRandomInt(0, 29);

    // Umbrella — durable item owned before game start.
    // Approximation debt (consumables): 30% starting ownership; no empirical data on umbrella
    // ownership rates by economic origin. Practicality skews higher for modest/comfortable origins.
    const has_umbrella = ctx.timeline.charRandom() < 0.30;

    // Chromesthesia (sound-colour synesthesia) — prevalence ~4%; Cytowic & Eagleman 2011 (ISBN 978-0-262-01542-3)
    // Constitutional perceptual trait: sounds evoke automatic visual percepts (colour, shape, movement).
    // Implemented as a single unconditional charRng call — 1 call on all branches (no balance needed).
    const synesthesia = ctx.timeline.charRandom() < 0.04;

    // APD (auditory processing disorder) — prevalence ~5%; Bamiou 2001 (PMID 11581479)
    // Constitutional processing deficit: auditory signal arrives intact but language parsing fails,
    // especially in noise. Not hearing loss — detection is normal, comprehension is impaired.
    // Single unconditional charRng call — 1 call on all branches (no balance needed).
    const apd = ctx.timeline.charRandom() < 0.05;

    // Sensory sensitivity — continuous trait, −1.0 (hyposensitive) to +1.0 (hypersensitive).
    // +1.0: everything is louder, brighter, more present (high-end SPD, certain anxiety presentations).
    // −1.0: world arrives at reduced intensity, harder to notice (some ADHD presentations, dissociative states).
    // Two unconditional charRng calls — triangular distribution centered at 0, range [−1, +1].
    // Approximation debt (sensory processing): distribution shape chosen; h² not well-established for continuous sensitivity trait.
    // let (not const) so autism can apply a floor after the autism roll below.
    let sensory_sensitivity = ctx.timeline.charRandom() + ctx.timeline.charRandom() - 1.0;

    // connective_tissue_laxity — heritable continuous parameter underlying pelvic floor dysfunction,
    // joint hypermobility, and diastasis risk. h²=0.43 for prolapse (twin studies, Altman 2008
    // PMID 18374452). Population distribution approximated as triangular-ish centered at 50 (SD ~18)
    // via sum of 3 uniforms, shifted and scaled. hEDS is the extreme high end (~top 1–2%).
    // 3 charRng calls, unconditional — same on every branch.
    // let (not const) so hEDS can override upward to ensure consistency.
    let connective_tissue_laxity = Math.min(100, Math.max(0,
      (ctx.timeline.charRandom() + ctx.timeline.charRandom() + ctx.timeline.charRandom() - 1.5) * 40 + 50
    ));

    // hEDS — hypermobile Ehlers-Danlos Syndrome: extreme high end of connective_tissue_laxity.
    // hEDS is not a separate random event — it IS the extreme of the laxity distribution.
    // Threshold 88 gives ~1–2% prevalence from the triangular-ish distribution above,
    // consistent with published prevalence estimates of ~1 in 500 (0.2%) to 1 in 200 (0.5%).
    // Approximation debt (hEDS): threshold 88 chosen to hit ~1–2% prevalence from this distribution.
    // Ref: Hakim & Grahame 2003 PMID 12873383 (hEDS prevalence review); Malfait 2017
    // (PMID 28306229, 2017 EDS International Classification). Population prevalence uncertain;
    // estimates range 1:500 to 1:5000; clinical hypermobility spectrum prevalence higher.
    const heds = connective_tissue_laxity >= 88;
    // Ensure consistency: hEDS characters have laxity >= 88 (already true deterministically).
    // This guard handles any future code paths that might set heds directly.
    if (heds) {
      connective_tissue_laxity = Math.max(connective_tissue_laxity, 88);
    }

    // hEDS–POTS comorbidity roll — ALWAYS 1 charRng call regardless of hEDS status.
    // Unconditional for RNG balance: conditional charRng calls break replay when branch coverage changes.
    // Comorbidity rate: hEDS + POTS ~40–75% (Gazit 2003 PMID 12527542; Castori 2012 PMID 22258532).
    // Using 0.50 (midpoint of range). Result ignored when heds=false.
    // Approximation debt (comorbidity): hEDS-POTS comorbidity 40-75%; Gazit 2003 PMID 12527542.
    const hedsPotsRoll = ctx.timeline.charRandom(); // unconditional — 1 call always
    if (heds && hedsPotsRoll < 0.50 && !conditions.includes('autonomic_dysregulation')) {
      conditions.push('autonomic_dysregulation');
    }

    // hEDS–MCAS comorbidity roll — ALWAYS 1 charRng call regardless of hEDS status.
    // Unconditional for RNG balance: same pattern as POTS roll above.
    // Comorbidity rate: hEDS + MCAS ~30–70% (Akin 2021 PMID 34199069; Afrin 2015 PMID 25946189).
    // Using 0.40 (lower-midpoint; uncertainty in prevalence estimates is wide). Result ignored when heds=false.
    // Approximation debt (comorbidity): hEDS-MCAS comorbidity ~30-70%; Akin 2021 PMID 34199069 direction.
    const hedsMcasRoll = ctx.timeline.charRandom(); // unconditional — 1 call always
    const mcas = heds && hedsMcasRoll < 0.40;

    // ADHD — prevalence ~5% adults; Fayyad 2007 PMID 17668418 (adult prevalence meta-analysis).
    // Executive dysfunction, time blindness, hyperfocus. Affects initiation and attention structure
    // (starting tasks, switching tasks, tracking time). Not capability — the character can do anything.
    // Single unconditional charRng call — 1 call on all branches (no balance needed).
    const adhd = ctx.timeline.charRandom() < 0.05;

    // Autism spectrum — prevalence ~2.3% adults; Lundström 2015 PMID 26185775 (adult prevalence).
    // Sensory processing differences, masking cost (performing NT behavior drains energy),
    // routine importance (disrupted routines more aversive). Not a deficit — a different structure.
    // Single unconditional charRng call — 1 call on all branches (no balance needed).
    const autism = ctx.timeline.charRandom() < 0.023;

    // Autism sensory sensitivity floor — autistic distribution is shifted toward higher sensitivity,
    // though heterogeneous (hyposensitive presentations exist). Floor at 0.3 pulls hyposensitive draws
    // upward without capping hypersensitive ones. Deterministic — no new charRng call.
    // Approximation debt (sensory processing): autism sensitivity distribution heterogeneous;
    // Baranek 2006 PMID 17130462 (sensory processing in autism); floor 0.3 chosen.
    if (autism) {
      sensory_sensitivity = Math.max(sensory_sensitivity, 0.3);
    }

    // Special interest domain — UNCONDITIONAL charRng call (stream balance: always 1 call regardless of autism).
    // Only autistic characters get a special interest; call consumed on all branches to avoid replay divergence.
    const siRoll = ctx.timeline.charRandom(); // 1 call always — replay balance
    const special_interest = autism
      ? ['nature', 'music', 'fiction', 'technology', 'science', 'craft', 'history', 'animals'][
          Math.floor(siRoll * 8)
        ]
      : null;

    // --- Constitutional mental health conditions ---
    // These are structural constraints on NT range, not mood states. A character with
    // major depression has a persistent serotonin floor — the good moments are genuinely
    // less good. These are configuration, not state.
    //
    // 4 unconditional charRng calls — always consumed regardless of outcome.
    // Backstory modulates prevalence where upstream data exists.

    // Major depression: ~7% 12-month prevalence (Hasin 2018 — PMID unverified).
    // Backstory modulation: high neuroticism (+3%), low self-esteem (+2%), trauma life events (+2%).
    // Approximation debt (mental health): prevalence modulation coefficients chosen; no published
    // conditional probability data for MDD given specific personality parameter configurations.
    const depressionRoll = ctx.timeline.charRandom(); // 1 call always
    const depressionBase = 0.07;
    const depressionBoost = (personality.neuroticism > 65 ? 0.03 : 0)
      + (personality.self_esteem < 35 ? 0.02 : 0)
      + (backstory.life_events?.some(e => e.type === 'medical_crisis' || e.type === 'job_loss') ? 0.02 : 0);
    const has_depression = depressionRoll < depressionBase + depressionBoost;

    // Generalized anxiety disorder: ~3.1% prevalence (Bandelow & Michaelis 2015 — PMID unverified).
    // Backstory modulation: high neuroticism (+2%), precarious origin (+1.5%).
    // Approximation debt (mental health): GAD prevalence modulation coefficients chosen.
    const gadRoll = ctx.timeline.charRandom(); // 1 call always
    const gadBase = 0.031;
    const gadBoost = (personality.neuroticism > 70 ? 0.02 : 0)
      + (backstory.economic_origin === 'precarious' ? 0.015 : 0);
    const has_gad = gadRoll < gadBase + gadBoost;

    // PTSD: ~3.6% prevalence (Goldstein 2016 — PMID unverified).
    // Backstory modulation: trauma life events are the primary driver (+4%).
    // Without upstream trauma, base rate applies (some characters have pre-game trauma
    // not captured in backstory — this is an approximation).
    // Approximation debt (mental health): PTSD prevalence should be primarily trauma-derived;
    // base rate without trauma history is a placeholder for unmodeled life events.
    const ptsdRoll = ctx.timeline.charRandom(); // 1 call always
    const ptsdBase = 0.036;
    const ptsdBoost = (backstory.life_events?.some(e => e.type === 'medical_crisis' || e.type === 'legal_trouble') ? 0.04 : 0);
    const has_ptsd = ptsdRoll < ptsdBase + ptsdBoost;

    // Bipolar II: ~1.1% prevalence (Merikangas 2007 — PMID unverified).
    // No backstory modulation — bipolar is highly heritable (h² ~60-85%),
    // life events are triggers not causes. Flat rate is the correct model
    // until family history exists in chargen.
    // Approximation debt (mental health): bipolar prevalence 1.1% chosen; no family
    // history model. h² 60-85% (McGuffin 2003 PMID 12505794 — PMID unverified).
    const bipolarRoll = ctx.timeline.charRandom(); // 1 call always
    const has_bipolar = bipolarRoll < 0.011;

    // --- Identity-derived values (rolls consumed at top of generateRandom) ---

    // Pronoun sets — structured PronounSet objects, not string enums.
    // Approximation debt (identity): prevalence estimates approximate.
    /** @type {PronounSet[]} */
    const pronoun_sets =
      pronounsRoll < 0.47 ? [pronounSet('she/her')]
    : pronounsRoll < 0.94 ? [pronounSet('he/him')]
    : pronounsRoll < 0.97 ? [pronounSet('they/them')]
    : pronounsRoll < 0.98 ? [pronounSet('she/her'), pronounSet('they/them')]  // she/they
    : pronounsRoll < 0.99 ? [pronounSet('he/him'), pronounSet('they/them')]   // he/they
    : pronounsRoll < 0.993 ? [pronounSet('xe/xem')]
    : pronounsRoll < 0.996 ? [pronounSet('ze/zir')]
    : [pronounSet('ey/em')];

    // Gender identity — continuous dimensions (0-100 each).
    // binary_diversity: 0 = cis-aligned, 100 = cross-gender from ASAB.
    // nonbinary_diversity: 0 = within binary, 100 = strong nonbinary identity.
    // ~0.8% trans (binary_diversity > 60), ~1.5% nonbinary (nonbinary_diversity > 40).
    // Williams Institute 2022 approximate; PMID unverified.
    // isTrans, isNonbinary, expression_femininity, expression_masculinity derived above.
    const binary_diversity = isTrans ? 70 + Math.floor(expressionRoll * 30)  // 70-99
                           : isNonbinary ? 20 + Math.floor(expressionRoll * 30) // 20-49
                           : Math.floor(genderRoll * 12); // 0-11 (cis cluster)
    const nonbinary_diversity = isNonbinary ? 50 + Math.floor(genderRoll * 10000 % 50) // 50-99
                              : isTrans ? Math.floor(expressionRoll * 30) // 0-29 (binary trans cluster)
                              : Math.floor(genderRoll * 8); // 0-7 (cis cluster)

    /** @type {GenderIdentity} */
    const gender = { binary_diversity, nonbinary_diversity, expression_femininity, expression_masculinity };

    // HRT — ~65% of trans people are on some form of hormone therapy (approximate; PMID unverified).
    // hrtRoll consumed on all branches for replay balance.
    const hrt_active = isTrans && hrtRoll < 0.65;
    /** @type {HrtType} */
    const hrt_type = hrt_active
      ? (expression_femininity > expression_masculinity ? 'estradiol' : 'testosterone')
      : null;

    // Attraction — split model: sexual and romantic are independent axes.
    // Approximation debt (identity): prevalence estimates approximate — US general population, 2020s.
    /** @type {AttractionPattern} */
    const sexual =
      sexualityRoll < 0.01  ? { intensity: 5 + Math.floor(sensualRoll * 10), orientation: Math.floor(sensualRoll * 100), gating: 'none' }    // asexual
    : sexualityRoll < 0.015 ? { intensity: 55 + Math.floor(sensualRoll * 30), orientation: Math.floor(sensualRoll * 100), gating: 'bond' }   // demisexual
    : sexualityRoll < 0.02  ? { intensity: 30 + Math.floor(sensualRoll * 30), orientation: Math.floor(sensualRoll * 100), gating: 'rare' }   // graysexual
    : sexualityRoll < 0.06  ? { intensity: 65 + Math.floor(sensualRoll * 25), orientation: 5 + Math.floor(sensualRoll * 15), gating: 'none' }  // gay/lesbian
    : sexualityRoll < 0.12  ? { intensity: 60 + Math.floor(sensualRoll * 25), orientation: 30 + Math.floor(sensualRoll * 40), gating: 'none' } // bisexual
    : { intensity: 65 + Math.floor(sensualRoll * 25), orientation: 85 + Math.floor(sensualRoll * 12), gating: 'none' }; // straight

    /** @type {AttractionPattern} */
    const romantic =
      romanticRoll < 0.005 ? { intensity: 5 + Math.floor(outStatusRoll * 10), orientation: sexual.orientation, gating: 'none' }    // aromantic
    : romanticRoll < 0.01  ? { intensity: 50 + Math.floor(outStatusRoll * 30), orientation: sexual.orientation, gating: 'bond' }   // demiromantic
    : { intensity: 60 + Math.floor(outStatusRoll * 30), orientation: sexual.orientation + Math.floor((romanticRoll - 0.5) * 20), gating: sexual.gating === 'bond' ? 'bond' : 'none' };
    romantic.orientation = Math.max(0, Math.min(100, romantic.orientation));

    const sensual = 30 + Math.floor(sensualRoll * 50);  // 30-79
    const aesthetic = 25 + Math.floor(outStatusRoll * 55); // 25-79

    /** @type {AttractionProfile} */
    const attraction = { sexual, romantic, sensual, aesthetic };

    const isStraight = sexual.orientation > 80 && sexual.intensity > 30 && romantic.intensity > 30;
    const isNormativeGender = !isTrans && !isNonbinary;

    // Out status — derived deterministically from existing variables (no new charRng calls).
    const safeForWork = financialSim.financial_anxiety < 0.5 && personality.neuroticism < 55;
    const safeForFamily = financialSim.financial_anxiety < 0.4 && personality.neuroticism < 60;
    /** @type {string[]} */
    const out_at_work = [];
    /** @type {string[]} */
    const out_to_family = [];
    if (!isStraight) {
      if (safeForWork) out_at_work.push('sexuality');
      if (safeForFamily) out_to_family.push('sexuality');
    }
    if (!isNormativeGender) {
      if (safeForWork) out_at_work.push('gender');
      if (safeForFamily) out_to_family.push('gender');
    }
    if (sexual.intensity < 20 || sexual.gating !== 'none' || romantic.intensity < 20) {
      if (safeForWork) out_at_work.push('attraction');
      if (safeForFamily) out_to_family.push('attraction');
    }

    // Makeup — 1 unconditional charRng call. Keyed on expression_femininity.
    const makeupRoll = ctx.timeline.charRandom();
    const makeupBaseProb = 0.05 + (expression_femininity / 100) * 0.80;
    const wears_makeup = makeupRoll < Math.min(0.92, makeupBaseProb);
    const makeup_count = wears_makeup
      ? (backstory.economic_origin === 'precarious' && financialSim.financial_anxiety > 0.6 ? 0 : 15)
      : 0;

    // Binder — 1 unconditional charRng call.
    const binderRoll = ctx.timeline.charRandom();
    const binderBaseProb = (isTrans || isNonbinary)
      ? (expression_masculinity > 50 ? 0.70
        : expression_masculinity > 30 ? 0.30
        : 0.04)
      : (expression_masculinity > 70 ? 0.02 : 0);
    const wears_binder = binderRoll < binderBaseProb;
    const binder_count = wears_binder ? 2 : 0;

    // Period supplies — starting stock for characters with a uterus.
    // Body params not yet generated at this point; use backstory as proxy for origin-based stock.
    // Approximation debt (consumables): range 0–14 is a plausible household stock; no
    // empirical data sourced. Upper end covers ~2 weeks' worth of typical supply.
    // AFAB status determined below in generateBodyParams; charRng call always consumed for balance.
    const period_supply_charRoll = ctx.timeline.charRandom();
    // Mapped to 0–14 range; backstory.economic_origin modulates upper end.
    const period_supply_upper = backstory.economic_origin === 'precarious' ? 7 : 14;
    const period_supply_count_raw = Math.round(period_supply_charRoll * period_supply_upper);

    // Menstrual cycle parameters — 3 charRng calls always consumed for balance.
    // Cycle length: 24–35 day range (FIGO normal: 24–38d, median 28d; Münster 1992 PMID 1429030).
    // Approximation debt (menstrual): cycle_length uniform [24,35] chosen; real distribution is
    // right-skewed toward 28d. Truncated normal would be more accurate; uniform is a placeholder.
    // Approximation debt (menstrual): cramp_severity uniform [0,1] chosen; real dysmenorrhea
    // prevalence ~45–95% with moderate-severe in ~15–20% (Latthe 2006 PMID 16484239). No chargen
    // heritability model yet — should derive from family history when backstory system supports it.
    const cycle_length_raw = ctx.timeline.charRandom();       // 1 call always
    const cycle_start_raw = ctx.timeline.charRandom();        // 1 call always
    const cramp_severity_raw = ctx.timeline.charRandom();     // 1 call always
    // These will only be used for characters with a uterus (determined after bodyParams).
    const cycle_length_computed = 24 + Math.round(cycle_length_raw * 11); // 24–35 // Approximation debt (menstrual)
    // Random starting phase — uniformly distributed across the cycle to avoid always starting at day 1.
    // cycle_start_day is set after bodyParams so the formula uses cycle_length_computed.
    // Math: charRandom() → [0,1), floor(x * cycle_length) → day index 0–(len-1), +1 → 1–len.
    const cycle_start_day_computed = 1 + Math.floor(cycle_start_raw * cycle_length_computed);
    // cramp_severity: a small portion of characters have severe cramping (dysmenorrhea).
    // Approximation debt (menstrual): distribution shape chosen; 0.3 produces mostly mild cramping
    // with ~15% of characters having cramp_severity > 0.7 (severe dysmenorrhea range).
    const cramp_severity_computed = Math.pow(cramp_severity_raw, 0.7); // Approximation debt (menstrual)

    // Neighbor — the recurring person seen on the block. 4 unconditional charRng calls.
    // Placed before generateBodyParams (variable call count) to preserve replay alignment.
    const neighborArchetypeRoll = ctx.timeline.charRandom(); // call 1: archetype
    const neighborArchetype =
      neighborArchetypeRoll < 0.15 ? 'always_smoking'
    : neighborArchetypeRoll < 0.30 ? 'dog_walker'
    : neighborArchetypeRoll < 0.45 ? 'early_commuter'
    : neighborArchetypeRoll < 0.60 ? 'night_shift'
    : neighborArchetypeRoll < 0.75 ? 'front_stoop'
    : neighborArchetypeRoll < 0.90 ? 'music_person'
    : 'quiet_one';

    const neighborName = generateFirstName(usedNames);  // calls 2-3: pool selection + charWeightedPick

    const neighborGenderRoll = ctx.timeline.charRandom(); // call 4: pronoun hint
    /** @type {PronounSet} */
    const neighborPronounSet = neighborGenderRoll < 0.50 ? pronounSet('they/them')
                             : neighborGenderRoll < 0.75 ? pronounSet('she/her')
                             : pronounSet('he/him');

    const neighbor = { name: neighborName, archetype: neighborArchetype, pronoun_set: neighborPronounSet };

    // Body parameters — placed after health conditions; generateWardrobe() is called last.
    // generateBodyParams has variable charRng count (~14–22 calls); safe here because
    // character is stored verbatim and chargen never replays.
    const bodyParams = generateBodyParams(age, backstory);

    // Assign period supplies and cycle params only for characters with a uterus; others get 0/null.
    // Determined after bodyParams since that's where ASAB is computed.
    const period_supply_count = bodyParams.reproductive_anatomy.has_uterus
      ? period_supply_count_raw
      : 0;
    const cycle_length = bodyParams.reproductive_anatomy.has_uterus ? cycle_length_computed : null;
    const cycle_start_day = bodyParams.reproductive_anatomy.has_uterus ? cycle_start_day_computed : null;
    const cramp_severity = bodyParams.reproductive_anatomy.has_uterus ? cramp_severity_computed : null;

    // Wardrobe aesthetic — 1 charRng call.
    const wardrobeAesthetic = ctx.timeline.charPick(WARDROBE_AESTHETICS);

    // Wardrobe — MUST be last. Variable charRng count (~24–72 calls depending on origin).
    const wardrobe = generateWardrobe(backstory, latitude, wardrobeAesthetic, bodyParams);

    return /** @type {GameCharacter} */ ({
      first_name: playerName.first,
      last_name: playerName.last,
      sleepwear,
      friend1: { name: friend1Name, last_name: friend1Last, flavor: f1flavor, pronoun_set: friend1Pronoun },
      friend2: { name: friend2Name, last_name: friend2Last, flavor: f2flavor, pronoun_set: friend2Pronoun },
      coworker1: { name: coworker1Name, last_name: coworker1Last, flavor: c1flavor, pronoun_set: coworker1Pronoun },
      coworker2: { name: coworker2Name, last_name: coworker2Last, flavor: c2flavor, pronoun_set: coworker2Pronoun },
      supervisor: { name: supervisorName, last_name: supervisorLast, pronoun_set: supervisorPronoun },
      family,
      job_type: jobType,
      gig_type_roll: gigTypeRoll, // stored so finishCreation() can set gig_type on character
      age_stage: age,
      start_timestamp: startTimestamp,
      latitude,
      personality,
      sentiments,
      backstory,
      paycheck_day_offset,
      rent_day_offset,
      utility_day_offset,
      phone_bill_day_offset,
      ebt_day_offset,
      conditions,
      sleep_cycle_length,
      phone_cracked,
      housing_quality,
      laundry_access,
      // Body parameters
      asab: bodyParams.asab,
      puberty_history: bodyParams.puberty_history,
      hrt_history: bodyParams.hrt_history,
      constitutional_conditions: bodyParams.constitutional_conditions,
      reproductive_anatomy: bodyParams.reproductive_anatomy,
      breast_tissue_score: bodyParams.breast_tissue_score,
      abdominal_baseline: bodyParams.abdominal_baseline,
      // Consumable inventory at game start
      starting_smoker,
      has_cigarettes_start,
      alcohol_tolerance_start,
      has_alcohol_start,
      cannabis_tolerance_start,
      has_cannabis_start,
      gym_membership,
      gym_membership_cost,
      gym_bill_day_offset,
      has_umbrella,
      period_supply_count,
      cycle_length,
      cycle_start_day,
      cramp_severity,
      // Jurisdiction — { country: ISO 3166-1 alpha-2, region: ISO 3166-2 subdivision or null }
      // Gates legal substance purchase.
      jurisdiction,
      // Wardrobe — initial item list. clothing.js copies from this at reset().
      wardrobe,
      wardrobe_aesthetic: wardrobeAesthetic,
      // Constitutional perceptual traits
      synesthesia,
      sensory_sensitivity,
      apd,
      // Constitutional structural trait — heritable, continuous (0–100)
      connective_tissue_laxity,
      // Constitutional connective tissue disorder — derived from laxity >= 88
      heds,
      // MCAS — mast cell activation syndrome; comorbid with hEDS (~30–70%)
      mcas,
      // Constitutional neurodevelopmental traits
      adhd,
      autism,
      special_interest,
      // Constitutional mental health conditions
      has_depression,
      has_gad,
      has_ptsd,
      has_bipolar,
      // Identity dimensions — structured pronoun sets, gender model, attraction profile
      pronoun_sets,
      gender,
      attraction,
      hrt_active,
      hrt_type,
      out_at_work,
      out_to_family,
      wears_makeup,
      makeup_count,
      wears_binder,
      binder_count,
      // Food profile — dietary identity from chargen. 9 charRng calls consumed above (calls 1-9).
      food_profile,
      // Initial pantry — derived from food_profile.pantry_slots + financial_anxiety + economic_origin.
      // No charRng consumed — derived from backstory data already generated.
      // Higher financial anxiety and more precarious origins → less food on hand at game start.
      // Pantry keys cover the full expanded vocabulary; only slots in pantry_slots are stocked.
      initial_pantry: (() => {
        const origin = backstory.economic_origin;
        const anxiety = financialSim.financial_anxiety;
        // Full vocabulary with all possible pantry keys initialized to 0.
        // Pantry slots not in this character's pantry_slots will stay at 0.
        /** @type {Record<string, number>} */
        const p = {
          pasta: 0, rice: 0, canned: 0, eggs: 0, bread: 0,
          beans: 0, oats: 0, potatoes: 0, peanut_butter: 0, ramen: 0,
          oil: 0, snacks: 0,
          // Expanded vocabulary from food profile
          tortillas: 0, noodles: 0, tofu: 0, canned_tuna: 0,
          soy_sauce: 0, hot_sauce: 0, spices: 0,
        };
        const slots = food_profile.pantry_slots;
        if (anxiety > 0.35 || origin === 'precarious') {
          // High anxiety or precarious: maybe one staple item, maybe nothing
          const first = slots[0];
          if (financialSim.starting_money >= 10 && first !== undefined && p[first] !== undefined) {
            p[first] = 1;
          }
        } else if (anxiety <= 0.15 && (origin === 'comfortable' || origin === 'secure')) {
          // Well-stocked: 1–2 of each pantry slot
          for (const item of slots) {
            if (p[item] !== undefined) p[item] = item === 'canned' ? 2 : 1;
          }
        } else if (anxiety <= 0.35 && (origin === 'modest' || origin === 'comfortable')) {
          // Moderate: first 3 pantry slots get 1 each
          for (let i = 0; i < Math.min(3, slots.length); i++) {
            const key = slots[i];
            if (key !== undefined && p[key] !== undefined) p[key] = 1;
          }
        } else {
          // Default: modest/working starting position — first 3 pantry slots
          for (let i = 0; i < Math.min(3, slots.length); i++) {
            const key = slots[i];
            if (key !== undefined && p[key] !== undefined) p[key] = 1;
          }
        }
        return p;
      })(),
      // Neighbor — the recurring person seen on this character's block.
      neighbor,
    });
  }

  // --- Custom dropdown component ---

  /**
   * @param {Array<{label: string, value: string}>} options
   * @param {string} selectedValue
   * @param {(value: string) => void} onChange
   * @returns {{ element: HTMLElement, getValue: () => string, setValue: (v: string) => void }}
   */
  function createDropdown(options, selectedValue, onChange) {
    const wrapper = document.createElement('span');
    wrapper.className = 'chargen-dropdown';

    const trigger = document.createElement('span');
    trigger.className = 'chargen-dropdown-trigger';
    const selected = options.find(o => o.value === selectedValue);
    trigger.textContent = selected ? selected.label : options[0].label;

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'chargen-dropdown-options';

    let currentValue = selectedValue;

    for (const opt of options) {
      const btn = document.createElement('button');
      btn.className = 'chargen-option';
      if (opt.value === selectedValue) btn.classList.add('selected');
      btn.textContent = opt.label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentValue = opt.value;
        trigger.textContent = opt.label;
        optionsContainer.querySelectorAll('.chargen-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        optionsContainer.classList.remove('open');
        onChange(opt.value);
      });
      optionsContainer.appendChild(btn);
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close any other open dropdowns
      document.querySelectorAll('.chargen-dropdown-options.open').forEach(el => {
        if (el !== optionsContainer) el.classList.remove('open');
      });
      optionsContainer.classList.toggle('open');
      if (optionsContainer.classList.contains('open')) {
        requestAnimationFrame(() => optionsContainer.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
      }
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsContainer);

    return {
      element: wrapper,
      getValue: () => currentValue,
      setValue: (v) => {
        currentValue = v;
        const match = options.find(o => o.value === v);
        if (match) {
          trigger.textContent = match.label;
          optionsContainer.querySelectorAll('.chargen-option').forEach(b => b.classList.remove('selected'));
          const btns = optionsContainer.querySelectorAll('.chargen-option');
          btns.forEach(b => { if (b.textContent === match.label) b.classList.add('selected'); });
        }
      },
    };
  }

  // --- Creation UI flow ---

  /** @type {(() => void) | null} */
  let activeCloseDropdowns = null;

  /** @type {((char: GameCharacter) => void) | null} */
  let resolveCreation = null;

  function startCreation() {
    return new Promise(resolve => {
      resolveCreation = resolve;
      showOpeningScreen();
    });
  }

  function showOpeningScreen() {
    const passageEl = /** @type {HTMLElement} */ (document.getElementById('passage'));
    const actionsEl = /** @type {HTMLElement} */ (document.getElementById('actions'));
    const movementEl = /** @type {HTMLElement} */ (document.getElementById('movement'));
    const eventTextEl = /** @type {HTMLElement} */ (document.getElementById('event-text'));

    passageEl.classList.remove('visible');
    actionsEl.innerHTML = '';
    actionsEl.classList.remove('visible');
    movementEl.innerHTML = '';
    movementEl.classList.remove('visible');
    eventTextEl.innerHTML = '';
    eventTextEl.classList.remove('visible');

    setTimeout(() => {
      passageEl.innerHTML = '<p>A life.</p><p>Not the one you would have picked, maybe. But the one that\u2019s here.</p>';
      passageEl.classList.add('visible');

      setTimeout(() => {
        const btn = document.createElement('button');
        btn.className = 'action';
        btn.textContent = 'Begin.';
        btn.addEventListener('click', () => {
          const char = generateRandom();
          showCharacterScreen(char);
        });
        actionsEl.appendChild(btn);
        actionsEl.classList.add('visible');
      }, 400);
    }, 150);
  }

  // --- Character screen (merged, always expanded) ---

  /** @param {GameCharacter} char */
  function showCharacterScreen(char) {
    const passageEl = /** @type {HTMLElement} */ (document.getElementById('passage'));
    const actionsEl = /** @type {HTMLElement} */ (document.getElementById('actions'));
    const movementEl = /** @type {HTMLElement} */ (document.getElementById('movement'));
    const eventTextEl = /** @type {HTMLElement} */ (document.getElementById('event-text'));

    const usedNames = new Set([
      char.first_name,
      char.friend1?.name, char.friend1?.last_name,
      char.friend2?.name, char.friend2?.last_name,
      char.coworker1?.name, char.coworker1?.last_name,
      char.coworker2?.name, char.coworker2?.last_name,
      char.supervisor?.name, char.supervisor?.last_name,
    ].filter(Boolean));

    passageEl.classList.remove('visible');
    actionsEl.innerHTML = '';
    actionsEl.classList.remove('visible');
    movementEl.innerHTML = '';
    movementEl.classList.remove('visible');
    eventTextEl.innerHTML = '';
    eventTextEl.classList.remove('visible');

    // Close dropdowns when clicking outside
    if (activeCloseDropdowns) {
      document.removeEventListener('click', activeCloseDropdowns);
    }
    activeCloseDropdowns = () => {
      document.querySelectorAll('.chargen-dropdown-options.open').forEach(el => el.classList.remove('open'));
    };
    document.addEventListener('click', activeCloseDropdowns);

    setTimeout(() => {
      passageEl.innerHTML = '';

      // --- Job ---
      const jobDropdown = createDropdown(
        Object.entries(jobLabels).map(([value, label]) => ({ label, value })),
        char.job_type,
        (v) => { char.job_type = v; }
      );

      const jobP = document.createElement('p');
      jobP.append('Work is a fact. ', jobDropdown.element, '.');
      passageEl.appendChild(jobP);

      // --- Age ---
      const ageInput = document.createElement('input');
      ageInput.type = 'text';
      ageInput.inputMode = 'numeric';
      ageInput.className = 'age-input';
      ageInput.value = String(char.age_stage);
      ageInput.maxLength = 2;

      const ageP = document.createElement('p');
      ageP.append('You\u2019re ');
      ageP.appendChild(ageInput);
      ageP.append('.');
      passageEl.appendChild(ageP);

      // --- Location ---
      const closestLocation = locationOptions.reduce((best, opt) =>
        Math.abs(opt.latitude - char.latitude) < Math.abs(best.latitude - char.latitude) ? opt : best
      );

      const locationDropdown = createDropdown(
        locationOptions.map(o => ({ label: o.label, value: o.value })),
        closestLocation.value,
        (v) => {
          const loc = locationOptions.find(o => o.value === v);
          char.latitude = loc.latitude;
          rebuildSeasonDropdown();
        }
      );

      const locationP = document.createElement('p');
      locationP.append('You live ', locationDropdown.element);
      passageEl.appendChild(locationP);

      // --- Season ---
      const seasonP = document.createElement('p');
      passageEl.appendChild(seasonP);

      function rebuildSeasonDropdown() {
        const isTropical = Math.abs(char.latitude) < 23.5;
        const labels = isTropical ? tropicalSeasonLabels : seasonLabels;
        const currentSeason = deriveSeasonFromTimestamp(char.start_timestamp, char.latitude);
        // If current season isn't valid for the new climate, pick the first option
        const validSeason = labels[currentSeason] ? currentSeason : Object.keys(labels)[0];
        if (validSeason !== currentSeason) {
          char.start_timestamp = timestampForSeason(validSeason, char.latitude);
        }

        const dropdown = createDropdown(
          Object.entries(labels).map(([value, label]) => ({ label, value })),
          validSeason,
          (v) => {
            char.start_timestamp = timestampForSeason(v, char.latitude);
          }
        );

        seasonP.textContent = '';
        seasonP.append('Outside \u2014 ', dropdown.element);
      }

      rebuildSeasonDropdown();

      // --- Sleepwear ---
      const currentSleepwearIndex = sleepwearOptions.indexOf(char.sleepwear);
      const sleepwearDropdownOptions = sleepwearOptions.map((sw, i) => ({
        label: sw,
        value: String(i),
      }));

      const sleepwearDropdown = createDropdown(
        sleepwearDropdownOptions,
        String(currentSleepwearIndex === -1 ? 0 : currentSleepwearIndex),
        (v) => { char.sleepwear = sleepwearOptions[parseInt(v, 10)]; }
      );

      const sleepwearP = document.createElement('p');
      sleepwearP.append('You\u2019re still in ', sleepwearDropdown.element, '.');
      passageEl.appendChild(sleepwearP);

      // --- Pronouns ---
      const currentPronounLabel = (char.pronoun_sets || []).map(s => s.label).join(' & ') || 'they/them';
      // Build pronoun options: common single sets + common mixed sets + custom
      const pronounOptions = [
        ...PRONOUN_LABELS.map(label => ({ label, value: label })),
        { label: 'she/they', value: 'she/they' },
        { label: 'he/they', value: 'he/they' },
        { label: 'custom', value: 'custom' },
      ];
      // Find current value
      let currentPronounValue = 'they/them';
      if (char.pronoun_sets && char.pronoun_sets.length === 2) {
        const combo = char.pronoun_sets.map(s => s.label).join('/');
        if (combo === 'she/her/they/them') currentPronounValue = 'she/they';
        else if (combo === 'he/him/they/them') currentPronounValue = 'he/they';
      } else if (char.pronoun_sets && char.pronoun_sets.length === 1) {
        currentPronounValue = char.pronoun_sets[0].label;
      }

      // Custom pronoun fields — shown only when 'custom' is selected.
      const customPronounFields = /** @type {{ input: HTMLInputElement, field: string }[]} */ ([
        { label: 'subject (they)',    field: 'subject',    default: 'they' },
        { label: 'object (them)',     field: 'object',     default: 'them' },
        { label: 'possessive (their)',field: 'possessive', default: 'their' },
        { label: 'reflexive (themself)',field: 'reflexive',default: 'themself' },
      ].map(({ label, field, default: def }) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = label;
        input.value = def;
        input.className = 'pronoun-custom-field';
        input.style.cssText = 'display:none;width:7em;margin:0 0.3em;font:inherit;background:transparent;border:none;border-bottom:1px solid currentColor;color:inherit;';
        return { input, field };
      }));

      // Plural checkbox for custom set.
      const customPluralLabel = document.createElement('label');
      customPluralLabel.style.cssText = 'display:none;margin:0 0.3em;font:inherit;cursor:pointer;';
      const customPluralCheck = document.createElement('input');
      customPluralCheck.type = 'checkbox';
      customPluralCheck.checked = true;
      customPluralCheck.style.marginRight = '0.2em';
      customPluralLabel.append(customPluralCheck, 'plural');

      /** Build a custom PronounSet from current field values. */
      function buildCustomPronounSet() {
        const subj = customPronounFields[0].input.value.trim() || 'they';
        const obj  = customPronounFields[1].input.value.trim() || 'them';
        const poss = customPronounFields[2].input.value.trim() || 'their';
        const refl = customPronounFields[3].input.value.trim() || 'themself';
        const isPlural = customPluralCheck.checked;
        const lbl = `${subj}/${obj}`;
        return { subject: subj, object: obj, possessive: poss, reflexive: refl, plural: isPlural, label: lbl };
      }

      /** Show or hide the custom fields. */
      function setCustomPronounVisible(visible) {
        for (const { input } of customPronounFields) input.style.display = visible ? '' : 'none';
        customPluralLabel.style.display = visible ? '' : 'none';
      }

      const pronounDropdown = createDropdown(
        pronounOptions,
        currentPronounValue,
        (v) => {
          if (v === 'she/they') {
            char.pronoun_sets = [pronounSet('she/her'), pronounSet('they/them')];
            setCustomPronounVisible(false);
          } else if (v === 'he/they') {
            char.pronoun_sets = [pronounSet('he/him'), pronounSet('they/them')];
            setCustomPronounVisible(false);
          } else if (v === 'custom') {
            setCustomPronounVisible(true);
            char.pronoun_sets = [buildCustomPronounSet()];
          } else if (PRONOUN_SETS[v]) {
            char.pronoun_sets = [pronounSet(v)];
            setCustomPronounVisible(false);
          }
        }
      );

      // Wire custom field changes into char.
      for (const { input } of customPronounFields) {
        input.addEventListener('input', () => { char.pronoun_sets = [buildCustomPronounSet()]; });
      }
      customPluralCheck.addEventListener('change', () => { char.pronoun_sets = [buildCustomPronounSet()]; });

      // Initialise visibility if the character was already custom.
      const startedCustom = currentPronounValue === 'custom' ||
        (char.pronoun_sets && char.pronoun_sets.length === 1 &&
         !PRONOUN_SETS[char.pronoun_sets[0].label] &&
         char.pronoun_sets[0].label !== 'she/they' &&
         char.pronoun_sets[0].label !== 'he/they');
      if (startedCustom) {
        const existing = char.pronoun_sets && char.pronoun_sets[0];
        if (existing) {
          customPronounFields[0].input.value = existing.subject    || 'they';
          customPronounFields[1].input.value = existing.object     || 'them';
          customPronounFields[2].input.value = existing.possessive || 'their';
          customPronounFields[3].input.value = existing.reflexive  || 'themself';
          customPluralCheck.checked = existing.plural !== false;
        }
        setCustomPronounVisible(true);
      }

      const pronounP = document.createElement('p');
      pronounP.append('Pronouns \u2014 ', pronounDropdown.element,
        ...customPronounFields.map(f => f.input), customPluralLabel);
      passageEl.appendChild(pronounP);

      // --- Gender / Presentation ---
      // Find closest preset to current gender dimensions
      let currentGenderValue = 'woman';
      if (char.gender) {
        const g = char.gender;
        if (g.binary_diversity > 60 && g.expression_femininity > g.expression_masculinity) currentGenderValue = 'trans woman';
        else if (g.binary_diversity > 60) currentGenderValue = 'trans man';
        else if (g.nonbinary_diversity > 60) currentGenderValue = 'agender';
        else if (g.nonbinary_diversity > 40) currentGenderValue = 'nonbinary';
        else if (g.expression_femininity > g.expression_masculinity + 20) currentGenderValue = 'woman';
        else if (g.expression_masculinity > g.expression_femininity + 20) currentGenderValue = 'man';
        else currentGenderValue = 'genderqueer';
      }

      const genderDropdown = createDropdown(
        GENDER_LABELS.map(label => ({ label, value: label })),
        currentGenderValue,
        (v) => {
          const preset = GENDER_PRESETS[v];
          if (preset) {
            char.gender = { ...preset.gender };
            // Update HRT if gender implies trans
            const isTransGender = preset.gender.binary_diversity > 60 || preset.gender.nonbinary_diversity > 40;
            if (!isTransGender) {
              char.hrt_active = false;
              char.hrt_type = null;
            }
          }
        }
      );

      const genderP = document.createElement('p');
      genderP.append('You are \u2014 ', genderDropdown.element);
      passageEl.appendChild(genderP);

      // --- Attraction / Orientation ---
      // Find closest preset to current attraction profile
      let currentAttractionValue = 'straight';
      if (char.attraction) {
        const a = char.attraction;
        if (a.sexual.intensity < 15 && a.romantic.intensity < 15) currentAttractionValue = 'aroace';
        else if (a.sexual.intensity < 15) currentAttractionValue = 'asexual';
        else if (a.romantic.intensity < 15) currentAttractionValue = 'aromantic';
        else if (a.sexual.gating === 'bond') currentAttractionValue = 'demisexual';
        else if (a.sexual.orientation < 20) currentAttractionValue = 'gay/lesbian';
        else if (a.sexual.orientation > 80) currentAttractionValue = 'straight';
        else currentAttractionValue = 'bisexual';
      }

      const attractionDropdown = createDropdown(
        ATTRACTION_LABELS.map(label => ({ label, value: label })),
        currentAttractionValue,
        (v) => {
          const preset = ATTRACTION_PRESETS[v];
          if (preset) {
            char.attraction = JSON.parse(JSON.stringify(preset));
          }
        }
      );

      const attractionP = document.createElement('p');
      attractionP.append('Attracted to \u2014 ', attractionDropdown.element);
      passageEl.appendChild(attractionP);

      // --- NPC row builder (shared by friends / coworkers / supervisor) ---
      /**
       * Build an NPC row with name input, pronoun dropdown, optional flavor dropdown, and delete button.
       * Closes over `usedNames` from the outer sandbox scope.
       * @param {any} npc
       * @param {string[] | null} flavorOptions — null for supervisor (no flavor)
       * @param {() => void} onDelete
       * @returns {HTMLDivElement}
       */
      function buildNpcRow(npc, flavorOptions, onDelete) {
        const row = document.createElement('div');
        row.className = 'name-input-wrapper';

        const firstInput = document.createElement('input');
        firstInput.type = 'text';
        firstInput.className = 'name-input';
        firstInput.value = npc.name;
        firstInput.maxLength = 20;
        firstInput.addEventListener('input', () => {
          usedNames.delete(npc.name);
          npc.name = firstInput.value.trim() || npc.name;
          if (npc.name) usedNames.add(npc.name);
        });

        const firstReroll = document.createElement('button');
        firstReroll.className = 'name-reroll';
        firstReroll.textContent = '\u21bb';
        firstReroll.addEventListener('click', () => {
          usedNames.delete(firstInput.value.trim());
          const expr = expressionFromPronounSet(npc.pronoun_set);
          const newName = generateGenderedFirstName(usedNames, expr.fem, expr.masc); // 2 calls
          firstInput.value = newName;
          npc.name = newName;
        });

        const pronounOpts = PRONOUN_LABELS.map(l => ({ label: l, value: l }));
        const pronounLabel = npc.pronoun_set?.label ?? 'they/them';
        const pronounDD = createDropdown(pronounOpts, pronounLabel, (v) => {
          npc.pronoun_set = pronounSet(v);
        });

        row.append(firstInput, firstReroll, pronounDD.element);

        if (flavorOptions && npc.flavor != null) {
          const flavorOpts = flavorOptions.map(f => ({ label: f, value: f }));
          const flavorDD = createDropdown(flavorOpts, npc.flavor, (v) => { npc.flavor = v; });
          row.appendChild(flavorDD.element);
        }

        const delBtn = document.createElement('button');
        delBtn.className = 'name-reroll';
        delBtn.textContent = '\u00d7';
        delBtn.addEventListener('click', onDelete);
        row.appendChild(delBtn);

        return row;
      }

      // --- Jurisdiction dropdown ---
      // Direct assignment — no charRng consumed (overrides generated value).
      const jurisdictionOptions = [
        { label: 'Somewhere in the States.', value: 'US' },
        { label: 'Canada.', value: 'CA' },
        { label: 'The UK.', value: 'GB' },
        { label: 'Australia.', value: 'AU' },
        { label: 'Germany.', value: 'DE' },
        { label: 'The Netherlands.', value: 'NL' },
        { label: 'France.', value: 'FR' },
      ];
      const defaultRegionFor = (/** @type {string} */ country) => {
        if (country === 'US') return 'CA';   // legal cannabis state
        if (country === 'AU') return 'ACT';  // legal state
        return null;
      };
      const currentCountry = char.jurisdiction?.country ?? 'US';
      const jurisdictionDropdown = createDropdown(
        jurisdictionOptions,
        jurisdictionOptions.find(o => o.value === currentCountry) ? currentCountry : 'US',
        (v) => {
          char.jurisdiction = { country: v, region: defaultRegionFor(v) };
          // Re-render wardrobe list so size labels update.
          buildWardrobeList();
        }
      );
      const jurisdictionP = document.createElement('p');
      jurisdictionP.append('Your country \u2014 ', jurisdictionDropdown.element);
      passageEl.appendChild(jurisdictionP);

      // --- Wardrobe: aesthetic + full item list ---
      function wardrobePreviewText() {
        const visible = (char.wardrobe || []).filter(i => ['top', 'bottom', 'dress'].includes(i.type));
        const top = visible.find(i => i.type === 'top' || i.type === 'dress');
        const bottom = visible.find(i => i.type === 'bottom');
        if (top && bottom) return `${top.name} and ${bottom.name}.`;
        if (top) return `${top.name}.`;
        if (bottom) return `${bottom.name}.`;
        return 'Something.';
      }

      const aestheticDropdown = createDropdown(
        WARDROBE_AESTHETICS.map(a => ({ label: wardrobeAestheticLabels[a], value: a })),
        char.wardrobe_aesthetic || 'classic',
        (v) => {
          char.wardrobe_aesthetic = v;
          // Swap item names to match new aesthetic — no charRng consumed.
          // Counts, conditions, locations stay from original generation.
          const pools = /** @type {any} */ (wardrobeItemPoolsByAesthetic)[v] || wardrobeItemPoolsByAesthetic.classic;
          for (const item of char.wardrobe) {
            const pool = /** @type {string[] | undefined} */ (pools[item.type]);
            if (pool && pool.length > 0) {
              const idx = parseInt(item.id.split('_')[1], 10) || 0;
              item.name = pool[idx % pool.length] ?? item.name;
            }
          }
          buildWardrobeList();
          wardrobePreviewEl.textContent = wardrobePreviewText();
        }
      );

      const wardrobeP = document.createElement('p');
      wardrobeP.append('Your closet \u2014 ', aestheticDropdown.element);
      passageEl.appendChild(wardrobeP);

      // Wardrobe list container — rebuilt on each change.
      const wardrobeListEl = document.createElement('div');
      wardrobeListEl.className = 'chargen-group wardrobe-list';
      passageEl.appendChild(wardrobeListEl);

      let wardrobeDragSrcIdx = /** @type {number | null} */ (null);

      function buildWardrobeList() {
        wardrobeListEl.innerHTML = '';
        for (let i = 0; i < char.wardrobe.length; i++) {
          const item = char.wardrobe[i];
          if (!item) continue;
          const row = document.createElement('div');
          row.className = 'wardrobe-item';
          row.draggable = true;

          const handle = document.createElement('span');
          handle.className = 'drag-handle';
          handle.textContent = '\u28bf'; // ⠿

          // Name dropdown — pool from current aesthetic for this type
          const pools = /** @type {any} */ (wardrobeItemPoolsByAesthetic)[char.wardrobe_aesthetic] || wardrobeItemPoolsByAesthetic.classic;
          const typePool = /** @type {string[]} */ (pools[item.type] || [item.name]);
          const nameOpts = typePool.includes(item.name)
            ? typePool.map((/** @type {string} */ n) => ({ label: n, value: n }))
            : [{ label: item.name, value: item.name }, ...typePool.map((/** @type {string} */ n) => ({ label: n, value: n }))];
          const nameDD = createDropdown(nameOpts, item.name, (v) => {
            item.name = v;
            wardrobePreviewEl.textContent = wardrobePreviewText();
          });

          // Size label — derived from acquisition dims + jurisdiction
          const sizeSpan = document.createElement('span');
          sizeSpan.className = 'wardrobe-size';
          const sl = itemSizeLabel(/** @type {import('./clothing.js').ClothingItem} */ (item), char.jurisdiction?.country ?? 'US');
          sizeSpan.textContent = sl ? `(${sl})` : '';

          // Condition dropdown
          const condDD = createDropdown(
            ['good', 'worn', 'faded', 'damaged'].map(c => ({ label: c, value: c })),
            item.condition || 'good',
            (v) => { item.condition = /** @type {any} */ (v); }
          );

          // Location dropdown
          const itemLoc = (item.location === 'stored' || item.location === 'accessible') ? item.location : 'accessible';
          const locDD = createDropdown(
            [{ label: 'accessible', value: 'accessible' }, { label: 'stored', value: 'stored' }],
            itemLoc,
            (v) => { item.location = /** @type {any} */ (v); }
          );

          // Delete button
          const delBtn = document.createElement('button');
          delBtn.className = 'name-reroll';
          delBtn.textContent = '\u00d7'; // ×
          const capturedI = i;
          delBtn.addEventListener('click', () => {
            char.wardrobe.splice(capturedI, 1);
            buildWardrobeList();
            wardrobePreviewEl.textContent = wardrobePreviewText();
          });

          // Drag-to-reorder
          row.addEventListener('dragstart', (e) => {
            wardrobeDragSrcIdx = capturedI;
            row.classList.add('dragging');
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
          });
          row.addEventListener('dragend', () => { row.classList.remove('dragging'); wardrobeDragSrcIdx = null; });
          row.addEventListener('dragover', (e) => { e.preventDefault(); });
          row.addEventListener('drop', (e) => {
            e.preventDefault();
            if (wardrobeDragSrcIdx !== null && wardrobeDragSrcIdx !== capturedI) {
              const moved = char.wardrobe.splice(wardrobeDragSrcIdx, 1)[0];
              if (moved) char.wardrobe.splice(capturedI, 0, moved);
              buildWardrobeList();
              wardrobePreviewEl.textContent = wardrobePreviewText();
            }
          });

          row.append(handle, nameDD.element, sizeSpan, condDD.element, locDD.element, delBtn);
          wardrobeListEl.appendChild(row);
        }

        // Add-item button — shows type picker inline
        const addRow = document.createElement('div');
        addRow.className = 'wardrobe-add-row';
        const addBtn = document.createElement('button');
        addBtn.className = 'chargen-add-item';
        addBtn.textContent = '+ add item';
        addBtn.addEventListener('click', () => {
          // Show type selector inline
          const typeSel = document.createElement('span');
          typeSel.className = 'wardrobe-type-select';
          const typeLabels = [
            { type: 'top', label: 'top' }, { type: 'bottom', label: 'bottom' },
            { type: 'dress', label: 'dress' }, { type: 'outerwear', label: 'outerwear' },
            { type: 'socks', label: 'socks' }, { type: 'underwear', label: 'underwear' },
            { type: 'shoes', label: 'shoes' },
          ];
          for (const { type, label } of typeLabels) {
            const tb = document.createElement('button');
            tb.className = 'name-reroll';
            tb.textContent = label;
            tb.addEventListener('click', () => {
              const pools = /** @type {any} */ (wardrobeItemPoolsByAesthetic)[char.wardrobe_aesthetic] || wardrobeItemPoolsByAesthetic.classic;
              const pool = /** @type {string[]} */ (pools[type] || ['item']);
              // Compute next ID for this type
              const existing = char.wardrobe.filter(it => it.type === type);
              const maxIdx = existing.reduce((m, /** @type {import('./clothing.js').ClothingItem} */ it) => {
                const n = parseInt(it.id.split('_')[1], 10);
                return isNaN(n) ? m : Math.max(m, n + 1);
              }, 0);
              char.wardrobe.push(/** @type {any} */ ({
                id: `${type}_${maxIdx}`,
                type,
                name: pool[0] ?? 'item',
                condition: 'good',
                location: 'accessible',
                wearState: 'clean',
                fit: 'comfortable',
                damage: { torn: false, stained: false, stretched: false },
                wearCount: 0,
                chest_at_acquisition: char.breast_tissue_score ?? null,
                abdominal_at_acquisition: char.abdominal_baseline ?? null,
              }));
              buildWardrobeList();
              wardrobePreviewEl.textContent = wardrobePreviewText();
            });
            typeSel.appendChild(tb);
          }
          addRow.replaceWith(typeSel); // swap button for type picker (list rebuilds on pick)
        });
        addRow.appendChild(addBtn);
        wardrobeListEl.appendChild(addRow);
      }

      buildWardrobeList();

      const wardrobePreviewEl = document.createElement('p');
      wardrobePreviewEl.textContent = wardrobePreviewText();
      passageEl.appendChild(wardrobePreviewEl);

      // --- Friends ---
      // Synthetic array for sandbox; syncs back to char.friend1, char.friend2, char.friend3... on each change.
      // Content.js reads named keys (friend1, friend2); extra friends stored but unused until prose is authored.
      // See TODO.md: Flavor pool (NPC count) debt.
      const friendFlavors = ['sends_things', 'checks_in', 'dry_humor', 'earnest'];
      let friends = [char.friend1, char.friend2].filter(Boolean);

      function syncFriendsToChar() {
        const maxSlot = Math.max(friends.length, 2);
        for (let i = 0; i < maxSlot; i++) {
          const key = i === 0 ? 'friend1' : i === 1 ? 'friend2' : `friend${i + 1}`;
          /** @type {any} */ (char)[key] = friends[i] ?? null;
        }
      }

      const friendHeaderP = document.createElement('p');
      const friendAddBtn = document.createElement('button');
      friendAddBtn.className = 'name-reroll';
      friendAddBtn.textContent = '+';
      friendAddBtn.addEventListener('click', () => {
        // Generate new friend — 4 charRng calls (pronoun+name+last)
        const pronoun = generateNpcPronounSet(); // 1 call
        const expr = expressionFromPronounSet(pronoun);
        const name = generateGenderedFirstName(usedNames, expr.fem, expr.masc); // 2 calls
        const last = generateLastName(usedNames); // 1 call
        const flavor = friendFlavors[friends.length % friendFlavors.length];
        friends.push({ name, last_name: last, flavor, pronoun_set: pronoun });
        syncFriendsToChar();
        renderFriendList();
        friendHeaderP.firstChild && (friendHeaderP.firstChild.textContent = _friendHeaderText());
      });
      const _friendHeaderText = () => friends.length === 1 ? 'One person. They have your number.' : `${friends.length === 0 ? 'No one' : friends.length === 2 ? 'Two people' : `${friends.length} people`}. They have your number.`;
      friendHeaderP.append(_friendHeaderText(), '\u00a0', friendAddBtn);
      passageEl.appendChild(friendHeaderP);

      const friendGroup = document.createElement('div');
      friendGroup.className = 'chargen-group';
      passageEl.appendChild(friendGroup);

      function renderFriendList() {
        friendGroup.innerHTML = '';
        for (let i = 0; i < friends.length; i++) {
          const f = friends[i];
          if (!f) continue;
          const capturedI = i;
          const row = buildNpcRow(f, friendFlavors, () => {
            usedNames.delete(f.name);
            usedNames.delete(f.last_name);
            friends.splice(capturedI, 1);
            syncFriendsToChar();
            renderFriendList();
            if (friendHeaderP.childNodes[0]) friendHeaderP.childNodes[0].textContent = _friendHeaderText();
          });
          friendGroup.appendChild(row);
        }
      }
      renderFriendList();

      // --- Coworkers ---
      const coworkerFlavors = ['warm_quiet', 'mundane_talker', 'stressed_out'];
      let coworkers = [char.coworker1, char.coworker2].filter(Boolean);

      function syncCoworkersToChar() {
        const maxSlot = Math.max(coworkers.length, 2);
        for (let i = 0; i < maxSlot; i++) {
          const key = i === 0 ? 'coworker1' : i === 1 ? 'coworker2' : `coworker${i + 1}`;
          /** @type {any} */ (char)[key] = coworkers[i] ?? null;
        }
      }

      const workHeaderP = document.createElement('p');
      const workerAddBtn = document.createElement('button');
      workerAddBtn.className = 'name-reroll';
      workerAddBtn.textContent = '+';
      workerAddBtn.addEventListener('click', () => {
        const pronoun = generateNpcPronounSet(); // 1 call
        const expr = expressionFromPronounSet(pronoun);
        const name = generateGenderedFirstName(usedNames, expr.fem, expr.masc); // 2 calls
        const last = generateLastName(usedNames); // 1 call
        const flavor = coworkerFlavors[coworkers.length % coworkerFlavors.length];
        coworkers.push({ name, last_name: last, flavor, pronoun_set: pronoun });
        syncCoworkersToChar();
        renderCoworkerList();
      });
      workHeaderP.append('The people at work.\u00a0', workerAddBtn);
      passageEl.appendChild(workHeaderP);

      const workGroup = document.createElement('div');
      workGroup.className = 'chargen-group';
      passageEl.appendChild(workGroup);

      function renderCoworkerList() {
        workGroup.innerHTML = '';
        for (let i = 0; i < coworkers.length; i++) {
          const cw = coworkers[i];
          if (!cw) continue;
          const capturedI = i;
          const row = buildNpcRow(cw, coworkerFlavors, () => {
            usedNames.delete(cw.name);
            usedNames.delete(cw.last_name);
            coworkers.splice(capturedI, 1);
            syncCoworkersToChar();
            renderCoworkerList();
          });
          workGroup.appendChild(row);
        }
      }
      renderCoworkerList();

      // --- Supervisor toggle ---
      const supP = document.createElement('p');
      const supToggleBtn = document.createElement('button');
      supToggleBtn.className = 'name-reroll';

      const supGroup = document.createElement('div');
      supGroup.className = 'chargen-group';
      passageEl.appendChild(supP);
      passageEl.appendChild(supGroup);

      function renderSupervisorSection() {
        const hasSup = char.supervisor != null;
        supToggleBtn.textContent = hasSup ? 'remove' : 'add supervisor';
        supP.innerHTML = '';
        supP.append(hasSup ? 'Your supervisor.\u00a0' : 'No supervisor.\u00a0', supToggleBtn);
        supGroup.innerHTML = '';
        if (hasSup && char.supervisor) {
          // No flavor for supervisor
          const sup = char.supervisor;
          const row = buildNpcRow(sup, null, () => {
            usedNames.delete(sup.name);
            usedNames.delete(sup.last_name);
            char.supervisor = /** @type {any} */ (null);
            renderSupervisorSection();
          });
          supGroup.appendChild(row);
        }
      }

      supToggleBtn.addEventListener('click', () => {
        if (char.supervisor != null) {
          usedNames.delete(char.supervisor.name);
          usedNames.delete(char.supervisor.last_name);
          char.supervisor = /** @type {any} */ (null);
        } else {
          // Generate new supervisor — 4 charRng calls
          const pronoun = generateNpcPronounSet(); // 1 call
          const expr = expressionFromPronounSet(pronoun);
          const name = generateGenderedFirstName(usedNames, expr.fem, expr.masc); // 2 calls
          const last = generateLastName(usedNames); // 1 call
          char.supervisor = { name, last_name: last, pronoun_set: pronoun };
        }
        renderSupervisorSection();
      });
      renderSupervisorSection();

      // --- Player name ---
      const first = document.createElement('span');
      first.className = 'editable-name';
      first.contentEditable = 'true';
      first.spellcheck = false;
      first.textContent = char.first_name;

      const firstReroll = document.createElement('button');
      firstReroll.className = 'name-reroll';
      firstReroll.textContent = '\u21bb';
      firstReroll.addEventListener('click', () => {
        const current = (first.textContent || '').trim();
        if (current) usedNames.delete(current);
        const ef = char.gender ? char.gender.expression_femininity : 50;
        const em = char.gender ? char.gender.expression_masculinity : 50;
        // 2 charRng calls (pool selection + weighted pick) — sandbox rerolls are fine
        first.textContent = generateGenderedFirstName(usedNames, ef, em);
      });

      const last = document.createElement('span');
      last.className = 'editable-name';
      last.contentEditable = 'true';
      last.spellcheck = false;
      last.textContent = char.last_name;

      const lastReroll = document.createElement('button');
      lastReroll.className = 'name-reroll';
      lastReroll.textContent = '\u21bb';
      lastReroll.addEventListener('click', () => {
        last.textContent = generateLastName(usedNames);
      });

      const nameP = document.createElement('p');
      nameP.append('Your name is ', first, ' ', firstReroll, ' ', last, ' ', lastReroll, '.');
      passageEl.appendChild(nameP);

      /** @param {KeyboardEvent} e */
      const preventEnter = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); /** @type {HTMLElement} */ (e.target).blur(); }
      };
      /** @param {ClipboardEvent} e */
      const pastePlain = (e) => {
        e.preventDefault();
        const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
        document.execCommand('insertText', false, text.replace(/\n/g, ''));
      };
      first.addEventListener('keydown', preventEnter);
      first.addEventListener('paste', pastePlain);
      last.addEventListener('keydown', preventEnter);
      last.addEventListener('paste', pastePlain);

      passageEl.classList.add('visible');

      // --- Action buttons ---
      setTimeout(() => {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'action';
        confirmBtn.textContent = 'This is you.';
        confirmBtn.addEventListener('click', () => {
          // Read final values from controls
          const ageVal = parseInt(ageInput.value, 10);
          char.age_stage = (ageVal >= 18 && ageVal <= 65) ? ageVal : char.age_stage;
          // NPC names written directly via inline input listeners in new sandbox UI.
          char.first_name = (first.textContent || '').trim() || char.first_name;
          char.last_name = (last.textContent || '').trim() || char.last_name;
          // job_type, start_timestamp already updated via dropdown callbacks

          // Validate custom pronoun fields — all must be non-empty.
          const customVisible = customPronounFields[0].input.style.display !== 'none';
          if (customVisible) {
            const allFilled = customPronounFields.every(({ input }) => input.value.trim().length > 0);
            if (!allFilled) {
              customPronounFields.forEach(({ input }) => {
                if (!input.value.trim()) input.style.outline = '1px solid currentColor';
              });
              return;
            }
            char.pronoun_sets = [buildCustomPronounSet()];
          }

          if (activeCloseDropdowns) {
            document.removeEventListener('click', activeCloseDropdowns);
            activeCloseDropdowns = null;
          }
          finishCreation(char);
        });
        actionsEl.appendChild(confirmBtn);

        const rerollBtn = document.createElement('button');
        rerollBtn.className = 'action';
        rerollBtn.textContent = 'A different life';
        rerollBtn.addEventListener('click', () => {
          if (activeCloseDropdowns) {
            document.removeEventListener('click', activeCloseDropdowns);
            activeCloseDropdowns = null;
          }
          const newChar = generateRandom();
          showCharacterScreen(newChar);
        });
        actionsEl.appendChild(rerollBtn);

        const startOverBtn = document.createElement('button');
        startOverBtn.className = 'action';
        startOverBtn.textContent = 'Start over';
        startOverBtn.addEventListener('click', () => {
          if (activeCloseDropdowns) {
            document.removeEventListener('click', activeCloseDropdowns);
            activeCloseDropdowns = null;
          }
          showOpeningScreen();
        });
        actionsEl.appendChild(startOverBtn);

        actionsEl.classList.add('visible');
      }, 400);
    }, 150);
  }

  // --- Helpers ---

  /**
   * Create NPC name input row with independent first/last rerolls.
   * @param {RelationshipPerson | SupervisorPerson} npc
   * @param {Set<string>} usedNames
   */
  function createNpcNameInput(npc, usedNames) {
    const wrapper = document.createElement('div');
    wrapper.className = 'name-input-wrapper';

    const firstInput = document.createElement('input');
    firstInput.type = 'text';
    firstInput.className = 'name-input';
    firstInput.value = npc.name;
    firstInput.maxLength = 20;
    firstInput.dataset.field = 'first';
    wrapper.appendChild(firstInput);

    const firstReroll = document.createElement('button');
    firstReroll.className = 'name-reroll';
    firstReroll.textContent = '\u21bb';
    firstReroll.addEventListener('click', () => {
      const current = firstInput.value.trim();
      if (current) usedNames.delete(current);
      const expr = expressionFromPronounSet(npc.pronoun_set);
      firstInput.value = generateGenderedFirstName(usedNames, expr.fem, expr.masc);
    });
    wrapper.appendChild(firstReroll);

    const lastInput = document.createElement('input');
    lastInput.type = 'text';
    lastInput.className = 'name-input';
    lastInput.value = npc.last_name;
    lastInput.maxLength = 20;
    lastInput.dataset.field = 'last';
    wrapper.appendChild(lastInput);

    const lastReroll = document.createElement('button');
    lastReroll.className = 'name-reroll';
    lastReroll.textContent = '\u21bb';
    lastReroll.addEventListener('click', () => {
      lastInput.value = generateLastName(usedNames);
    });
    wrapper.appendChild(lastReroll);

    return wrapper;
  }

  /**
   * Read values from an NPC name input row back into the NPC object.
   * @param {HTMLElement} wrapper
   * @param {RelationshipPerson | SupervisorPerson} npc
   */
  function readNpcNameInput(wrapper, npc) {
    const inputs = wrapper.querySelectorAll('input');
    for (const input of inputs) {
      const val = /** @type {HTMLInputElement} */ (input).value.trim();
      if (/** @type {HTMLInputElement} */ (input).dataset.field === 'first' && val) {
        npc.name = val;
      } else if (/** @type {HTMLInputElement} */ (input).dataset.field === 'last' && val) {
        npc.last_name = val;
      }
    }
  }

  // --- Finish ---

  /** @param {GameCharacter} char */
  async function finishCreation(char) {
    // Run fine-grained financial simulation — once per character, after finalization.
    // Produces exact starting_money, hourly_rate, rent, sentiments, personality adjustments.
    if (char.backstory) {
      // Gig arrangement decision — made here (after backstory is available) using the
      // gigTypeRoll already consumed on the charRng stream in generateRandom().
      // Probability: precarious origin or high financial_anxiety → 25% gig chance; else 8%.
      // Approximation debt (gig work): 25%/8% probabilities chosen; real rates by SES not
      // derived from labor statistics. BLS: 1.3–1.6% of employed used gig platforms as primary
      // income (2017 CWS, most recent available), but structural precarity undercounts.
      const gigTypeRoll = char.gig_type_roll ?? 0.5; // use stored roll
      const isHighPrecarity = char.backstory.economic_origin === 'precarious';
      // We can't access financial_sim.financial_anxiety here yet — backstory is available.
      // Use career_stability proxy: low stability → higher gig chance (career instability
      // correlates with gig adoption; Katz & Krueger 2019 PMID unverified).
      const isFinanciallyAnxious = char.backstory.career_stability < 0.35;
      const gigChance = (isHighPrecarity || isFinanciallyAnxious) ? 0.25 : 0.08;
      const becomesGig = gigTypeRoll < gigChance;

      let effectiveJobType = char.job_type;
      if (becomesGig) {
        effectiveJobType = 'gig_worker';
        char.job_type = 'gig_worker';
        // Gig subtype from roll (same roll, remapped to [0,1] range past the gigChance threshold).
        // Using normalized position within the remaining roll range for independence.
        const normalizedRoll = (gigTypeRoll / gigChance); // [0,1] within the gig range
        const gigSubtype = normalizedRoll < 0.4 ? 'delivery'
                         : normalizedRoll < 0.7 ? 'tasks'
                         : 'mixed';
        char.gig_type = gigSubtype;
      }

      const sim = simulateFinancialHistory(char.backstory, char.age_stage, effectiveJobType);

      // Gender pay gap — keyed on expression, not pronouns. Characters who present as
      // feminine-read in the workplace face the pay gap regardless of their pronoun set.
      // perceivedPresentation is not yet available (state not initialized), so we derive
      // a rough read from expression_femininity / expression_masculinity directly.
      // Approximation debt (pay gap): sector rates from BLS USDOL aggregate data — no
      // jurisdiction model, no race/ethnicity intersection. Does not model intersectional
      // compounding (Black women ~63 cents, Latinas ~57 cents relative to white men;
      // AAUW 2023 — PMIDs unavailable, org research).
      // BLS Women's Earnings 2023, Report 1100, DOI: 10.2307/bls.report.1100 — unverified.
      /** @type {Record<string, number>} */
      const PAY_GAP_BY_SECTOR = {
        food_service:  0.90,  // Approximation debt (pay gap): BLS aggregate — narrow gap in tipped/hourly sectors
        retail:        0.88,  // Approximation debt (pay gap): BLS aggregate — minimum wage compression narrows gap
        warehouse:     0.85,  // Approximation debt (pay gap): BLS aggregate
        healthcare:    0.80,  // Approximation debt (pay gap): BLS aggregate — physician/nurse hierarchy widens gap
        education:     0.85,  // Approximation debt (pay gap): BLS aggregate
        professional:  0.75,  // Approximation debt (pay gap): BLS aggregate — widest gap in high-earning sectors
        technical:     0.75,  // Approximation debt (pay gap): BLS aggregate
        creative:      0.78,  // Approximation debt (pay gap): BLS aggregate — freelance/project-based widens gap
        office:        0.80,  // Approximation debt (pay gap): BLS aggregate
        admin:         0.80,  // Approximation debt (pay gap): BLS aggregate
        manual:        0.87,  // Approximation debt (pay gap): BLS aggregate
        trades:        0.87,  // Approximation debt (pay gap): BLS aggregate
        gig_worker:    0.78,  // Approximation debt (pay gap): platform-mediated but women cluster in lower-earning gig categories
      };
      const payGapRate = PAY_GAP_BY_SECTOR[effectiveJobType] ?? 0.82;
      const g = char.gender;
      if (g && g.expression_femininity > g.expression_masculinity + 15) {
        sim.hourly_rate = Math.round(sim.hourly_rate * payGapRate * 100) / 100;
      }

      char.financial_sim = sim;
      char.labor_arrangement = generateLaborArrangement(effectiveJobType, sim, char.backstory);
    }

    ctx.timeline.setCharacter(char);
    ctx.character.set(char);

    // Create run in IndexedDB and set as active
    const runId = await ctx.runs.createRun(ctx.timeline.getSeed(), char);
    ctx.timeline.setActiveRunId(runId);

    if (resolveCreation) {
      resolveCreation(char);
      resolveCreation = null;
    }
  }

  return {
    generateRandom,
    startCreation,
    sleepwearOptions,
    simulateFinancialHistory,
  };
}

