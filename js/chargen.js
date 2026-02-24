// chargen.js — character generation and creation UI flow

import { NameData } from './names.js';

export function createChargen(ctx) {

  // --- Name generation ---

  /** @param {Set<string>} exclude */
  function generateName(exclude) {
    let first, last, attempts = 0;
    do {
      first = ctx.timeline.charWeightedPick(NameData.first);
      attempts++;
    } while (exclude.has(first) && attempts < 50);
    exclude.add(first);

    last = ctx.timeline.charWeightedPick(NameData.last);
    return { first, last };
  }

  /** @param {Set<string>} exclude */
  function generateFirstName(exclude) {
    let name, attempts = 0;
    do {
      name = ctx.timeline.charWeightedPick(NameData.first);
      attempts++;
    } while (exclude.has(name) && attempts < 50);
    exclude.add(name);
    return name;
  }

  // --- Outfit sets ---
  // Each set is a triple: [default, low_mood, messy]
  // Complete prose sentences — no assembly.

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
    { label: 'Somewhere the heat never quite lets go.', value: 'tropical', latitude: 10 },
    { label: 'A place where the seasons still bother to change.', value: 'nh_temperate', latitude: 42 },
    { label: 'Far enough north the cold has opinions.', value: 'nh_cold', latitude: 58 },
    { label: 'South of the equator. Everything\u2019s the same, but reversed.', value: 'sh_temperate', latitude: -35 },
  ];

  const jobLabels = {
    office: 'An office',
    retail: 'A store',
    food_service: 'A kitchen counter',
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

  // Pay rates by job type (biweekly take-home)
  const payRates = { food_service: 480, retail: 520, office: 600 };

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
   * @returns {{ starting_money: number, pay_rate: number, rent_amount: number, financial_anxiety: number, personality_adjustments: { neuroticism: number, self_esteem: number }, work_sentiment: { quality: string, intensity: number }, job_standing_start: number }}
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
    const pay_rate = payRates[job_type] || 520;

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

    return {
      starting_money,
      pay_rate,
      rent_amount,
      financial_anxiety,
      personality_adjustments: { neuroticism: neuroticismAdj, self_esteem: selfEsteemAdj },
      work_sentiment,
      job_standing_start,
      ebt_monthly_amount,
    };
  }

  // --- Labor arrangement generation ---

  /**
   * Generate labor arrangement from job type and simulation outputs.
   * No charRng calls — derives from backstory.career_stability (already generated).
   * Approximation debt (work scheduling): shift pool selection should use charRng, but charRng call-order
   * constraint (this runs in finishCreation after charRng stream is closed) prevents it.
   * career_stability used as a proxy: low stability → less-preferred shifts.
   * See docs/design/work-scheduling.md.
   *
   * @param {string} jobType
   * @param {{ job_standing_start: number, financial_anxiety: number }} sim
   * @param {{ career_stability: number }} backstory
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
        reveal_horizon_hours: null,
        reveal_tod: null,
        work_days_per_week: 5,
      };
    }

    if (jobType === 'retail') {
      // Low standing or high anxiety → on_demand scheduling terms even if nominally rotating.
      const type = (standing < 58 || anxiety > 0.55) ? 'on_demand' : 'rotating';
      // Shift from stability: low → morning (less desirable), mid → standard, high → afternoon
      let shiftStart;
      if (stability < 0.35) shiftStart = 6 * 60;      // 6am–2pm
      else if (stability < 0.65) shiftStart = 10 * 60; // 10am–6pm
      else shiftStart = 14 * 60;                        // 2pm–10pm
      // Higher standing → longer reveal horizon (schedule posted 3 days out vs day-before)
      const revealHorizonHours = standing >= 65 ? 72 : 24;
      return {
        type,
        day_pattern: 'any',
        work_days: [],
        shift_start: shiftStart,
        shift_end: shiftStart + 8 * 60,
        reveal_horizon_hours: type === 'on_demand' ? revealHorizonHours : null,
        reveal_tod: type === 'on_demand' ? 21 * 60 : null,  // 9pm reveal
        work_days_per_week: Math.round(3 + stability * 2),  // 3–5 days
      };
    }

    if (jobType === 'food_service') {
      // Food service: on_demand unless high standing (established worker gets rotating).
      const type = standing >= 70 ? 'rotating' : 'on_demand';
      let shiftStart;
      if (stability < 0.35) shiftStart = 6 * 60;
      else if (stability < 0.65) shiftStart = 10 * 60;
      else shiftStart = 14 * 60;
      // All reveals are night-before (evening). High anxiety → later/more last-minute (10pm);
      // lower anxiety → earlier (8pm). Morning-of reveals (for afternoon shifts) are a
      // future improvement — requires shift_start-aware reveal timing. Approximation debt (work scheduling).
      const revealHorizonHours = anxiety > 0.5 ? 14 : 20;
      const revealTod = anxiety > 0.5 ? 22 * 60 : 20 * 60;  // 10pm or 8pm
      return {
        type,
        day_pattern: 'any',
        work_days: [],
        shift_start: shiftStart,
        shift_end: shiftStart + 8 * 60,
        reveal_horizon_hours: type === 'on_demand' ? revealHorizonHours : null,
        reveal_tod: type === 'on_demand' ? revealTod : null,
        work_days_per_week: Math.round(3 + stability * 2),
      };
    }

    return {
      type: 'none',
      day_pattern: 'weekdays',
      work_days: [1, 2, 3, 4, 5],
      shift_start: 9 * 60,
      shift_end: 17 * 60,
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

  const wardrobeItemPools = {
    top: [
      'grey hoodie', 'black hoodie', 'green hoodie', 'white t-shirt', 'black t-shirt', 'grey t-shirt',
      'striped t-shirt', 'flannel shirt', 'plaid flannel', 'blue button-down', 'white button-down',
      'crewneck sweatshirt', 'grey sweatshirt', 'tank top', 'ribbed tank', 'striped long-sleeve',
      'black long-sleeve', 'polo shirt',
    ],
    bottom: [
      'dark jeans', 'black jeans', 'blue jeans', 'worn jeans', 'grey sweatpants', 'black sweatpants',
      'khakis', 'black slacks', 'shorts', 'athletic shorts', 'leggings', 'black leggings',
    ],
    dress:    ['black dress', 'grey dress', 'floral dress', 'jersey dress', 'shift dress'],
    underwear: ['underwear'],
    socks: [
      'white socks', 'black socks', 'ankle socks', 'crew socks', 'no-show socks',
      'striped socks', 'mismatched socks',
    ],
    shoes: [
      'sneakers', 'white sneakers', 'black sneakers', 'beat-up sneakers', 'canvas shoes',
      'work boots', 'ankle boots', 'boots', 'flats', 'sandals', 'slides',
    ],
    outerwear: ['winter coat', 'black coat', 'puffer jacket', 'denim jacket', 'rain jacket', 'grey jacket'],
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
  function generateWardrobe(backstory, latitude) {
    const origin = backstory.economic_origin ?? 'modest';
    const isTropical = Math.abs(latitude) < 23.5;
    const items = [];
    const idCounters = /** @type {Record<string, number>} */ ({});

    for (const type of ['top', 'bottom', 'underwear', 'socks', 'shoes', 'outerwear', 'dress']) {
      let [lo, hi] = wardrobeCounts[type][origin];
      if (type === 'outerwear' && isTropical) { lo = 0; hi = 0; }
      if (hi === 0) continue;

      // 1 charRng call for item count in this category
      const count = ctx.timeline.charRandomInt(lo, hi);

      const pool = wardrobeItemPools[type];
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
          // Approximation debt (clothing): fit defaults to comfortable until Body.dimensionAtTime()
          // is wired into wardrobe generation. chest_at_acquisition and
          // abdominal_at_acquisition remain null until body.md system fully activated.
          fit: 'comfortable',
          abdominal_at_acquisition: null,
          chest_at_acquisition: null,
        });
      }
    }
    return items;
  }

  // --- Random character generation ---

  function generateRandom() {
    const usedNames = new Set();

    // Player name
    const playerName = generateName(usedNames);

    // Friends
    const friend1Name = generateFirstName(usedNames);
    const friend2Name = generateFirstName(usedNames);
    const friendFlavors = ['sends_things', 'checks_in', 'dry_humor', 'earnest'];
    const f1flavor = ctx.timeline.charPick(friendFlavors);
    const remainingFriend = friendFlavors.filter(f => f !== f1flavor);
    const f2flavor = ctx.timeline.charPick(remainingFriend);

    // Coworkers
    const coworker1Name = generateFirstName(usedNames);
    const coworker2Name = generateFirstName(usedNames);
    const coworkerFlavors = ['warm_quiet', 'mundane_talker', 'stressed_out'];
    const c1flavor = ctx.timeline.charPick(coworkerFlavors);
    const remainingCoworker = coworkerFlavors.filter(f => f !== c1flavor);
    const c2flavor = ctx.timeline.charPick(remainingCoworker);

    // Supervisor
    const supervisorName = generateFirstName(usedNames);

    // Job, age
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
      // Non-drinker: tolerance 0 (RNG call still consumed for balance)
      ctx.timeline.charRandom(); // balance call — aligns with the two branches above
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

    // Umbrella — durable item owned before game start.
    // Approximation debt (consumables): 30% starting ownership; no empirical data on umbrella
    // ownership rates by economic origin. Practicality skews higher for modest/comfortable origins.
    const has_umbrella = ctx.timeline.charRandom() < 0.30;

    // Period supplies — starting stock for characters with a uterus.
    // Body params not yet generated at this point; use backstory as proxy for origin-based stock.
    // Approximation debt (consumables): range 0–14 is a plausible household stock; no
    // empirical data sourced. Upper end covers ~2 weeks' worth of typical supply.
    // NOTE: menstrual cycle not yet implemented; supplies exist but can't be depleted by cycle.
    // TODO: adjust range when menstrual cycle system exists and cycle phase is tracked.
    // AFAB status determined below in generateBodyParams; charRng call always consumed for balance.
    const period_supply_charRoll = ctx.timeline.charRandom();
    // Mapped to 0–14 range; backstory.economic_origin modulates upper end.
    const period_supply_upper = backstory.economic_origin === 'precarious' ? 7 : 14;
    const period_supply_count_raw = Math.round(period_supply_charRoll * period_supply_upper);

    // Body parameters — placed after health conditions; generateWardrobe() is called last.
    // generateBodyParams has variable charRng count (~14–22 calls); safe here because
    // character is stored verbatim and chargen never replays.
    const bodyParams = generateBodyParams(age, backstory);

    // Assign period supplies only for characters with a uterus; others get 0.
    // Determined after bodyParams since that's where ASAB is computed.
    const period_supply_count = bodyParams.reproductive_anatomy.has_uterus
      ? period_supply_count_raw
      : 0;

    // Wardrobe — MUST be last. Variable charRng count (~24–72 calls depending on origin).
    const wardrobe = generateWardrobe(backstory, latitude);

    return /** @type {GameCharacter} */ ({
      first_name: playerName.first,
      last_name: playerName.last,
      sleepwear,
      friend1: { name: friend1Name, flavor: f1flavor },
      friend2: { name: friend2Name, flavor: f2flavor },
      coworker1: { name: coworker1Name, flavor: c1flavor },
      coworker2: { name: coworker2Name, flavor: c2flavor },
      supervisor: { name: supervisorName },
      job_type: jobType,
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
      alcohol_tolerance_start,
      has_alcohol_start,
      has_umbrella,
      period_supply_count,
      // Wardrobe — initial item list. clothing.js copies from this at reset().
      wardrobe,
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
      char.friend1.name, char.friend2.name,
      char.coworker1.name, char.coworker2.name,
      char.supervisor.name,
    ]);

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
      locationP.append('You live \u2014 ', locationDropdown.element);
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

      // --- Wardrobe preview (static — items generated from backstory, not player-selected) ---
      const wardrobeP = document.createElement('p');
      {
        const visible = (char.wardrobe || []).filter(i => ['top', 'bottom', 'dress'].includes(i.type));
        const top = visible.find(i => i.type === 'top' || i.type === 'dress');
        const bottom = visible.find(i => i.type === 'bottom');
        let preview;
        if (top && bottom) preview = `${top.name} and ${bottom.name}.`;
        else if (top) preview = `${top.name}.`;
        else if (bottom) preview = `${bottom.name}.`;
        else preview = 'Something.';
        wardrobeP.textContent = `Getting dressed. ${preview}`;
      }
      passageEl.appendChild(wardrobeP);

      // --- Friends ---
      const friendP = document.createElement('p');
      friendP.textContent = 'Two people who still text you. Not every day. But enough.';
      passageEl.appendChild(friendP);

      const friendGroup = document.createElement('div');
      friendGroup.className = 'chargen-group';
      const friend1Input = createNameInput(char.friend1.name, usedNames);
      const friend2Input = createNameInput(char.friend2.name, usedNames);
      friendGroup.appendChild(friend1Input);
      friendGroup.appendChild(friend2Input);
      passageEl.appendChild(friendGroup);

      // --- Coworkers ---
      const workP = document.createElement('p');
      workP.textContent = 'The people at work. You didn\'t choose them. They didn\'t choose you.';
      passageEl.appendChild(workP);

      const workGroup = document.createElement('div');
      workGroup.className = 'chargen-group';
      const co1Input = createNameInput(char.coworker1.name, usedNames);
      const co2Input = createNameInput(char.coworker2.name, usedNames);
      const supInput = createNameInput(char.supervisor.name, usedNames);
      workGroup.appendChild(co1Input);
      workGroup.appendChild(co2Input);
      workGroup.appendChild(supInput);
      passageEl.appendChild(workGroup);

      // --- Player name ---
      const first = document.createElement('span');
      first.className = 'editable-name';
      first.contentEditable = 'true';
      first.spellcheck = false;
      first.textContent = char.first_name;

      const last = document.createElement('span');
      last.className = 'editable-name';
      last.contentEditable = 'true';
      last.spellcheck = false;
      last.textContent = char.last_name;

      const nameP = document.createElement('p');
      nameP.append('Your name is ', first, ' ', last, '. At least, that\u2019s what it says on everything.');
      passageEl.appendChild(nameP);

      const nameReroll = document.createElement('button');
      nameReroll.className = 'name-reroll';
      nameReroll.textContent = '\u21bb';
      nameReroll.addEventListener('click', () => {
        const currentFirst = (first.textContent || '').trim();
        if (currentFirst) usedNames.delete(currentFirst);
        const newName = generateName(usedNames);
        first.textContent = newName.first;
        last.textContent = newName.last;
      });
      passageEl.appendChild(nameReroll);

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
          char.friend1 = { ...char.friend1, name: /** @type {HTMLInputElement} */ (friend1Input.querySelector('input')).value.trim() || char.friend1.name };
          char.friend2 = { ...char.friend2, name: /** @type {HTMLInputElement} */ (friend2Input.querySelector('input')).value.trim() || char.friend2.name };
          char.coworker1 = { ...char.coworker1, name: /** @type {HTMLInputElement} */ (co1Input.querySelector('input')).value.trim() || char.coworker1.name };
          char.coworker2 = { ...char.coworker2, name: /** @type {HTMLInputElement} */ (co2Input.querySelector('input')).value.trim() || char.coworker2.name };
          char.supervisor = { name: /** @type {HTMLInputElement} */ (supInput.querySelector('input')).value.trim() || char.supervisor.name };
          char.first_name = (first.textContent || '').trim() || char.first_name;
          char.last_name = (last.textContent || '').trim() || char.last_name;
          // job_type, start_timestamp already updated via dropdown callbacks

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

  /** @param {string} defaultValue @param {Set<string>} [usedNames] */
  function createNameInput(defaultValue, usedNames) {
    const wrapper = document.createElement('div');
    wrapper.className = 'name-input-wrapper';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'name-input';
    input.value = defaultValue;
    input.maxLength = 20;
    wrapper.appendChild(input);

    if (usedNames) {
      const btn = document.createElement('button');
      btn.className = 'name-reroll';
      btn.textContent = '\u21bb';
      btn.addEventListener('click', () => {
        const current = input.value.trim();
        if (current) usedNames.delete(current);
        const newName = generateFirstName(usedNames);
        input.value = newName;
      });
      wrapper.appendChild(btn);
    }

    return wrapper;
  }

  // --- Finish ---

  /** @param {GameCharacter} char */
  async function finishCreation(char) {
    // Run fine-grained financial simulation — once per character, after finalization.
    // Produces exact starting_money, pay_rate, rent, sentiments, personality adjustments.
    if (char.backstory) {
      const sim = simulateFinancialHistory(char.backstory, char.age_stage, char.job_type);
      char.financial_sim = sim;
      char.labor_arrangement = generateLaborArrangement(char.job_type, sim, char.backstory);
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
    outfitSets,
    sleepwearOptions,
    simulateFinancialHistory,
  };
}

