// types.d.ts — shared type definitions for existence

// --- Location IDs (mirrors top-level keys of `locations` in world.js) ---

type LocationId =
  | 'apartment_bedroom'
  | 'apartment_living_room'
  | 'apartment_kitchen'
  | 'apartment_bathroom'
  | 'street'
  | 'gym'
  | 'bus_stop'
  | 'workplace'
  | 'workplace_bathroom'
  | 'corner_store'
  | 'park'
  | 'beach'
  | 'library'
  | 'soup_kitchen'
  | 'food_bank'
  | 'friends_apartment'
  | 'shelter'
  | 'clinic'
  | 'pharmacy'
  | 'er'
  | 'grocery_store';

// --- NameData (from generated names.js, excluded from tsc) ---

type NamePair = [string, number];

declare const NameData: {
  firstF: NamePair[];
  firstM: NamePair[];
  last: NamePair[];
};

// --- NT snapshot (realization engine input) ---
//
// Shape matches senses.js#getNtCtx() — values are normalized to [0, 1] (divide-by-100).
// Used as the `nt` argument in weighted-pick callbacks: `w: nt => nt.serotonin < 0.4 ? 1 : 0`.
// All numeric fields are present; boolean flags reflect constitutional conditions.

interface NTSnapshot {
  gaba: number;
  ne: number;
  aden: number;
  serotonin: number;
  dopamine: number;
  cortisol: number;
  synesthesia: boolean;
  apd: boolean;
  has_ptsd: boolean;
}

// --- Character ---

interface PersonalityParams {
  neuroticism: number;      // 0-100
  self_esteem: number;      // 0-100
  rumination: number;       // 0-100
  trait_loneliness: number; // 0-100
  introversion: number;     // 0-100
}

interface Sentiment {
  target: string;
  quality: string;
  intensity: number;  // 0-1
}

interface NPCEvent {
  type: string;
  severity: number;
  start_time: number;
  duration_hours: number;
}

// Legacy alias — existing code references CoworkerNPCEvent
type CoworkerNPCEvent = NPCEvent;

interface FriendNPC {
  name: string;
  last_name: string;
  pronoun_set: PronounSet;
  // Personality (stable, set at chargen)
  warmth: number;       // 0-100
  openness: number;     // 0-100
  stability: number;    // 0-100
  // Life facts (set at chargen, can change via events)
  children: { age: number }[];
  has_partner: boolean;
  parent_health: 'healthy' | 'declining' | 'critical' | 'deceased';
  // Current state (drifts during play)
  stress: number;       // 0-100
  active_events: NPCEvent[];
  // Relationship with player (evolves)
  trust: number;        // 0-100
}

interface CoworkerNPC {
  name: string;
  last_name: string;
  pronoun_set: PronounSet;
  // Personality (stable, set at chargen)
  warmth: number;       // 0-100
  openness: number;     // 0-100
  stability: number;    // 0-100
  // Life facts (set at chargen, can change via events)
  children: { age: number }[];
  has_partner: boolean;
  parent_health: 'healthy' | 'declining' | 'critical' | 'deceased';
  // Current state (drifts during play)
  stress: number;       // 0-100
  active_events: NPCEvent[];
  // Relationship with player (evolves)
  trust: number;        // 0-100
}

interface SupervisorPerson {
  name: string;
  last_name: string;
  pronoun_set: PronounSet;
}

type FamilyType = 'supportive' | 'conditional' | 'distant' | 'absent' | 'hostile';
type FamilyRelationshipType = 'parent' | 'sibling' | 'other';

interface FamilyMemberOutDimensions {
  gender: boolean;
  orientation: boolean;
  name_change: boolean;
}

interface FamilyMemberPerson {
  name: string;
  relationship_type: FamilyRelationshipType;
  // Personality (stable, set at chargen — replaces archetype labels)
  warmth: number;       // 0-100
  openness: number;     // 0-100
  stability: number;    // 0-100
  unreachable: boolean; // contact unavailable — separate from personality
  alive: boolean;
  birth_day_of_year: number;           // 1–365
  death_day_of_year?: number;          // only if !alive
  contact_timestamp: number | null;    // last contact (ms game time), null if none
  guilt_weight: number;                // 0–1, contribution to aggregate family_guilt
  out_dimensions: FamilyMemberOutDimensions;
  // Life facts (set at chargen, can change via events)
  children: { age: number }[];
  has_partner: boolean;
  // Current state (drifts during play)
  stress: number;       // 0-100
  active_events: NPCEvent[];
  // Relationship with player (evolves)
  trust: number;        // 0-100
}

type NeighborArchetype = 'always_smoking' | 'dog_walker' | 'early_commuter' | 'night_shift' | 'front_stoop' | 'music_person' | 'quiet_one';

interface Neighbor {
  name: string;
  archetype: NeighborArchetype;
  pronoun_set: PronounSet;
}

interface BlockCharacter {
  name: string;
  pronoun_set: PronounSet;
}

interface ShelterResident {
  first_name: string;
  pronoun_set: PronounSet;
  archetype: 'quiet_corner' | 'loud_laugh' | 'early_riser' | 'slow_shuffle' | 'young_eyes';
}

type RaceEthnicity = 'white' | 'black' | 'hispanic' | 'asian' | 'indigenous' | 'multiracial';
type JobType = 'office' | 'retail' | 'food_service' | 'gig_worker' | 'freelance' | 'informal' | 'unemployed' | 'cant_work';
type GigType = 'delivery' | 'tasks' | 'mixed';
type EconomicOrigin = 'precarious' | 'modest' | 'comfortable' | 'secure';
type InsuranceType = 'employer' | 'marketplace' | 'medicaid' | 'uninsured' | 'public';

interface LifeEvent {
  type: string;
  financial_impact: number;
}

interface Backstory {
  economic_origin: EconomicOrigin;
  career_stability: number;  // 0-1
  /** Raw eventRoll stored so finishCreation() can recompute numEvents from the final age. */
  event_roll: number;
  /** All potential life events (always 2 slots, unconditionally generated). */
  all_life_events: LifeEvent[];
  /** Active life events for the current age (slice of all_life_events). Re-sliced in finishCreation(). */
  life_events: LifeEvent[];
  ebt_enrolled: boolean;
}

interface FinancialSim {
  starting_money: number;
  hourly_rate: number;
  rent_amount: number;
  financial_anxiety: number;       // 0-0.8
  personality_adjustments: { neuroticism: number; self_esteem: number };
  work_sentiment: { quality: string; intensity: number };
  job_standing_start: number;
  ebt_monthly_amount: number;      // 0 or 204
  phone_bill_amount: number;       // 25, 35, or 45
}

type LaborArrangementType = 'fixed' | 'on_demand' | 'rotating' | 'gig' | 'flexible' | 'none';

interface EmployedArrangement {
  type: 'fixed' | 'on_demand' | 'rotating';
  day_pattern: 'weekdays' | 'specific';
  work_days: number[];             // 0=Sun ... 6=Sat
  shift_start: number;             // minutes from midnight
  shift_end: number;               // minutes from midnight
  split_shift: boolean;            // two separate blocks in one day (e.g. 7-11 AM + 4-8 PM)
  shift_start_2: number | null;    // second block start, null if not split
  shift_end_2: number | null;      // second block end, null if not split
  reveal_horizon_hours: number | null;
  reveal_tod: number | null;       // minutes from midnight
  work_days_per_week: number;
  on_call: boolean;                // worker has on-call periods outside regular shifts
  on_call_start: number | null;    // minutes from midnight — start of on-call window
  on_call_end: number | null;      // minutes from midnight — end of on-call window
}

interface UnscheduledArrangement {
  type: 'gig' | 'flexible' | 'none';
  day_pattern: 'any';
  work_days: number[];             // empty
  shift_start: null;
  shift_end: null;
  split_shift: false;
  shift_start_2: null;
  shift_end_2: null;
  reveal_horizon_hours: null;
  reveal_tod: null;
  work_days_per_week: number;      // 0 typically
  on_call: false;
  on_call_start: null;
  on_call_end: null;
}

type LaborArrangement = EmployedArrangement | UnscheduledArrangement;

interface PubertyHistory {
  occurred: boolean;
  timing: 'early' | 'typical' | 'late';
  suppressed: boolean;
  suppression_timing: 'prepubertal' | 'mid_puberty' | null;
}

interface HrtHistory {
  type: 'feminizing' | 'masculinizing' | null;
  start_offset: number | null;     // months before game start
  dose_tier: 'low' | 'standard' | 'high';
}

interface ConstitutionalConditions {
  gigantomastia: boolean;
  micromastia: boolean;
  breast_asymmetry: number;        // 0-1
  poland_syndrome: boolean;
  poland_side: 'left' | 'right' | null;
  gynecomastia_score: number;      // 0-40
  post_mastectomy: boolean;
  mastectomy_type: 'flat' | 'reconstructed' | null;
}

interface ReproductiveAnatomy {
  has_uterus: boolean;
  has_ovaries: boolean;
  has_testes: boolean;
}

interface ClothingItem {
  id: string;
  type: 'top' | 'bottom' | 'dress' | 'underwear' | 'socks' | 'shoes' | 'outerwear';
  name: string;
  condition: 'worn' | 'faded' | 'damaged' | 'good';
  location: 'accessible' | 'stored';
  wearState: string;
  fit: string;
  abdominal_at_acquisition: number | null;
  damage: { torn: boolean; stained: boolean; stretched: boolean };
  wearCount: number;
  chest_at_acquisition: number | null;
}

interface FoodProfile {
  cooking_skill: number;                   // 10-85
  cultural_tradition: string;             // 'south_asian' | 'east_asian' | 'latin' | 'western' | 'eastern_european' | 'west_african' | 'middle_eastern' | 'mixed'
  ethical_stance: 'omnivore' | 'flexitarian' | 'vegetarian' | 'vegan' | 'pescatarian';
  health_restrictions: string[];          // e.g. ['lactose_intolerant', 'gluten_free', 'nut_allergy', 'low_fodmap']
  comfort_foods: string[];                // 2-3 specific items from cultural tradition
  pantry_slots: string[];                 // 6-10 staple ingredients this character keeps
}

interface Pantry {
  pasta: number;
  rice: number;
  canned: number;
  eggs: number;
  bread: number;
  beans: number;
  oats: number;
  potatoes: number;
  peanut_butter: number;
  ramen: number;
  oil: number;
  snacks: number;
  vegetables: number;
  flour: number;
  // Expanded vocabulary from food profile cultural traditions
  tortillas: number;
  noodles: number;
  tofu: number;
  canned_tuna: number;
  soy_sauce: number;
  hot_sauce: number;
  spices: number;
  [key: string]: number;  // allow unknown keys for forward compat
}

interface Jurisdiction {
  country: string;
  region: string | null;
}

interface PronounSet {
  subject: string;      // "she", "he", "they", "xe", "ze", "fae", "it", "ey"
  object: string;       // "her", "him", "them", "xem", "zir", "faer", "it", "em"
  possessive: string;   // "her", "his", "their", "xyr", "zir", "faer", "its", "eir"
  reflexive: string;    // "herself", "himself", "themself", "xemself", "zirself", "faerself", "itself", "emself"
  plural: boolean;      // verb conjugation: "they are" vs "xe is"
  label: string;        // display: "she/her", "xe/xem", etc.
}

interface GenderIdentity {
  binary_diversity: number;       // 0-100: cross-gender identification from ASAB
  nonbinary_diversity: number;    // 0-100: identification outside male/female
  expression_femininity: number;  // 0-100: feminine expression
  expression_masculinity: number; // 0-100: masculine expression
}

interface AttractionPattern {
  intensity: number;              // 0-100: 0 = ace/aro, 100 = strong
  orientation: number;            // 0-100: 0 = exclusively same-gender, 50 = bi/pan, 100 = exclusively different-gender
  gating: 'none' | 'bond' | 'rare'; // none = allo, bond = demi, rare = gray
}

interface AttractionProfile {
  sexual: AttractionPattern;
  romantic: AttractionPattern;
  sensual: number;                // 0-100: desire for physical contact/touch
  aesthetic: number;              // 0-100: how strongly beauty registers
}

type PerceivedPresentation = 'fem_read' | 'masc_read' | 'androgynous_read';
type HrtType = 'estradiol' | 'testosterone' | null;
type HousingType = 'all_inclusive' | 'room_share' | 'standard';
type LaundryAccess = 'in_unit' | 'building' | 'laundromat';
type ApartmentSize = 'studio' | 'small_1br' | '1br' | '2br' | '3br';
type HeatingType = 'electric_radiator' | 'gas' | 'heat_pump';
type InsulationQuality = 'poor' | 'fair' | 'good';
type Asab = 'afab' | 'amab' | 'intersex';

interface CalendarEvent {
  month: number;       // 0-11
  day: number;         // 1-31
  label: string;       // e.g. "Mom's birthday"
  type: 'birthday' | 'anniversary' | 'death_anniversary' | 'own_birthday';
  member_index?: number;  // index into family_members array (for per-member events)
}

interface FlightEvent {
  departure_offset_days: number;   // days from game start (continuous time: offset * 1440 minutes)
  duration_days: number;           // 1–5 days
  destination_type: 'home_visit' | 'work_trip' | 'vacation';
  flight_type: 'domestic' | 'international';
}

type FriendSlot = 'friend1' | 'friend2';
type CoworkerSlot = 'coworker1' | 'coworker2';

interface GameCharacter {
  // Identity
  first_name: string;
  last_name: string;
  sleepwear: string;
  pronoun_sets: PronounSet[];
  gender: GenderIdentity;
  attraction: AttractionProfile;
  hrt_active: boolean;
  hrt_type: HrtType;
  out_at_work: string[];        // disclosed dimensions: 'sexuality', 'gender', 'attraction'
  out_to_family: string[];      // disclosed dimensions: 'sexuality', 'gender', 'attraction'
  wears_makeup: boolean;
  makeup_count: number;
  wears_binder: boolean;
  binder_count: number;
  legal_name_changed: boolean;  // whether legal name change was completed before game start

  // Demographics
  race_ethnicity: RaceEthnicity;
  job_type: JobType;
  age_stage: number;
  start_timestamp: number;
  latitude: number;

  // Relationships
  friend1: FriendNPC;
  friend2: FriendNPC;
  coworker1: CoworkerNPC;
  coworker2: CoworkerNPC;
  supervisor: SupervisorPerson;
  family_type: FamilyType;           // summary field — derived from family_members at chargen
  family_members: FamilyMemberPerson[];
  neighbor: Neighbor;
  corner_store_clerk: BlockCharacter;
  bus_regular: BlockCharacter;
  shelter_residents: ShelterResident[];

  // Personality & sentiments
  personality: PersonalityParams;
  sentiments: Sentiment[];

  // Backstory & finances
  backstory: Backstory;
  financial_sim: FinancialSim;
  labor_arrangement: LaborArrangement;
  gig_type_roll: number;
  gig_type?: GigType;

  // Billing cycle offsets
  paycheck_day_offset: number;
  rent_day_offset: number;
  utility_day_offset: number;
  phone_bill_day_offset: number;
  ebt_day_offset: number;

  // Health & body
  conditions: string[];
  sleep_cycle_length: number;
  asab: Asab;
  puberty_history: PubertyHistory;
  hrt_history: HrtHistory;
  constitutional_conditions: ConstitutionalConditions;
  reproductive_anatomy: ReproductiveAnatomy;
  breast_tissue_score: number;
  height_cm: number;
  body_mass: number;
  waist_mass_sensitivity: number;
  hip_mass_sensitivity: number;
  waist_cm: number;
  hip_cm: number;
  chest_cm: number;
  fast_twitch_ratio: number;           // 0.30–0.70; constitutional fiber type ratio
  hypertrophic_response: number;       // 0.40–1.00; genetic resistance training response
  aerobic_trainability: number;        // 0.40–1.00; genetic VO2max trainability
  skeletal_muscle_mass: number;        // kg; starting value derived from body_mass at chargen
  skeletal_muscle_mass_max: number;    // kg; genetic ceiling derived from height × hypertrophic_response
  aerobic_capacity: number;            // 0–100 percentile; starting value at chargen

  // Nutrient tracking — daily accumulators (reset each wake period)
  kcal_today: number;
  protein_today_g: number;
  iron_today_mg: number;
  b12_today_mcg: number;
  folate_today_mcg: number;
  vitamin_d_today_iu: number;
  // 7-day EMAs
  caloric_ema: number;
  protein_ema_g: number;
  iron_ema_mg: number;
  b12_ema_mcg: number;
  folate_ema_mcg: number;
  vitamin_d_ema_iu: number;
  // Deficiency state (0–100)
  iron_deficiency: number;
  b12_deficiency: number;

  // Perceptual / neurodevelopmental
  synesthesia: boolean;
  sensory_sensitivity: number;     // -1.0 to +1.0
  apd: boolean;
  connective_tissue_laxity: number; // 0-100
  heds: boolean;
  mcas: boolean;
  adhd: boolean;
  autism: boolean;
  special_interest: string | null;
  // Constitutional mental health conditions
  has_depression: boolean;
  has_gad: boolean;
  has_ptsd: boolean;
  has_bipolar: boolean;
  // Constitutional metabolic conditions
  thyroid_condition: 'normal' | 'hypothyroid' | 'subclinical_hypothyroid' | 'hyperthyroid';
  // Raw RNG rolls stored for re-derivation when age changes in chargen UI
  depression_roll?: number;
  gad_roll?: number;
  ptsd_roll?: number;
  bipolar_roll?: number;

  // Substances
  starting_smoker: boolean;
  has_cigarettes_start: number;
  alcohol_tolerance_start: number;
  has_alcohol_start: number;
  cannabis_tolerance_start: number;
  has_cannabis_start: number;

  // Housing & phone
  phone_cracked: boolean;
  phone_age: number; // years; model age at chargen — drives battery health and slowness tier
  housing_quality: number;
  housing_type: HousingType;
  laundry_access: LaundryAccess;
  grocery_access: 'nearby' | 'transit' | 'distant' | 'food_desert';
  grocery_distance: number;
  apartment_size: ApartmentSize;
  heating_type: HeatingType;
  insulation_quality: InsulationQuality;

  // Gym membership
  gym_membership: boolean;
  gym_membership_cost: number;
  gym_bill_day_offset: number;

  // Consumables
  has_umbrella: boolean;
  period_supply_count: number;

  // Menstrual cycle
  cycle_length: number | null;
  cycle_start_day: number | null;
  cramp_severity: number | null;

  // Dental insurance
  has_dental_insurance: boolean;

  // Bariatric surgery history — derived from life history (prevalence proxy until BMI sim exists)
  has_bariatric_surgery: boolean;

  // Jurisdiction
  jurisdiction: Jurisdiction;

  // Insurance
  insurance_type: InsuranceType;
  insurance_bill_day_offset: number;

  // Content warning toggles — default true (content shown); false = softer alternatives
  content_self_harm: boolean;
  content_substance_detail: boolean;
  content_family_abuse: boolean;

  // Personal calendar — recurring dates (family birthdays, anniversary)
  personal_calendar: CalendarEvent[];

  // Upcoming flights — one-time future travel events generated at chargen (15% probability)
  upcoming_flights: FlightEvent[];

  // Wardrobe & food
  wardrobe: ClothingItem[];
  wardrobe_aesthetic: string;
  food_profile: FoodProfile;
  initial_pantry: Pantry;
}

// --- Interactions ---

/**
 * Data payload passed to Interaction.execute() for parameterized interactions.
 * All fields optional — most interactions ignore data entirely. Fields are a
 * closed union of every shape actually observed at call/dispatch sites.
 */
interface InteractionData {
  /** read_note: index into note list */
  index?: number;
  /** friend-thread interactions: contact id */
  contact?: string;
  /** set_alarm / sleep alarm path: time-of-day in minutes since midnight */
  alarmTod?: number;
  /** send_money / gift interactions: dollar amount */
  amount?: number;
  /** apply_for_job: company tier */
  company_type?: 'small' | 'mid' | 'large';
  /** timed activities (e.g. nap): duration in game minutes */
  duration?: number;
  /** buy_groceries: pantry item ids */
  items?: string[];
  /** masturbation/sex: modality selector */
  modality?: string;
  /** write_in_journal / send_message: free-form text */
  text?: string;
}

interface Interaction {
  id: string;
  label: string | (() => string);
  location: string | null;
  available: (data?: InteractionData) => boolean;
  execute: (data?: InteractionData) => string;
}

// --- Screen choices (chargen) ---

interface ScreenChoice {
  label: string;
  action: () => void;
}

// --- Weighted item ---

interface WeightedItem<T> {
  weight: number;
  value: T;
}

// --- Location ---

interface Acoustic {
  reverb: number;       // 0-1 (0 = dead/anechoic, 1 = cathedral)
  absorption: number;   // 0-1 (0 = hard reflective, 1 = soft absorptive)
  floor: string;        // underfoot surface (e.g. 'carpet', 'tile', 'linoleum')
}

interface LocationDef {
  name: string;
  area: string;
  smoke_exposure: number;
  acoustic: Acoustic;
  connections: Record<string, number | (() => number) | { time: number | (() => number); available?: () => boolean }>;
}

// --- Travel result ---

interface TravelResult {
  from: string;
  to: string;
  travelTime: number;
}

// --- Connection info ---

interface ConnectionInfo {
  id: string;
  name: string;
  travelTime: number;
  area: string;
}

// --- Action log entry ---

interface ActionEntry {
  action: { type: string; id?: string; destination?: string; data?: Record<string, any> };
  timestamp: number;
}

// --- Save data ---

interface SaveData {
  seed: number;
  character: GameCharacter | null;
  actions: ActionEntry[];
}

// --- Run records ---

interface RunRecord {
  id: string;
  seed: number;
  character: GameCharacter;
  actions: ActionEntry[];
  status: 'active' | 'finished';
  endCause?: string;
  createdAt: number;
  lastPlayed: number;
  version: number;
}

interface RunSummary {
  id: string;
  status: 'active' | 'finished';
  endCause?: string;
  createdAt: number;
  lastPlayed: number;
  actionCount: number;
  characterName: string;
  jobType: string;
  ageStage: string;
}

// --- UI callbacks ---

interface UICallbacks {
  onAction: (interaction: Interaction) => void;
  onMove: (destId: string) => void;
  onIdle: () => void;
  onFocusTime: () => void;
  onFocusMoney: () => void;
  onStepAway?: () => void;
}

// --- Game context ---
// Auto-inferred from factory return types. Adding a property to a factory's
// return object automatically updates GameContext — no manual sync needed.

interface GameContext {
  runs: ReturnType<typeof import('./runs.js').createRuns>;
  timeline: ReturnType<typeof import('./timeline.js').createTimeline>;
  state: ReturnType<typeof import('./state.js').createState>;
  dishes: ReturnType<typeof import('./dishes.js').createDishes>;
  linens: ReturnType<typeof import('./linens.js').createLinens>;
  body: ReturnType<typeof import('./body.js').createBody>;
  clothing: ReturnType<typeof import('./clothing.js').createClothing>;
  items: ReturnType<typeof import('./items.js').createItems>;
  mess: ReturnType<typeof import('./mess.js').createMess>;
  events: ReturnType<typeof import('./events.js').createEvents>;
  character: ReturnType<typeof import('./character.js').createCharacter>;
  world: ReturnType<typeof import('./world.js').createWorld>;
  habits: ReturnType<typeof import('./habits.js').createHabits>;
  content: ReturnType<typeof import('./content.js').createContent>;
  senses: ReturnType<typeof import('./senses.js').createSenses>;
  ui: ReturnType<typeof import('./ui.js').createUI>;
  chargen: ReturnType<typeof import('./chargen.js').createChargen>;
  game: ReturnType<typeof import('./game.js').createGame>;
}
