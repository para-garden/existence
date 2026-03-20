// types.d.ts — shared type definitions for existence

// --- NameData (from generated names.js, excluded from tsc) ---

type NamePair = [string, number];

declare const NameData: {
  firstF: NamePair[];
  firstM: NamePair[];
  last: NamePair[];
};

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

interface RelationshipPerson {
  name: string;
  last_name: string;
  flavor: string;
  pronoun_set: PronounSet;
}

interface SupervisorPerson {
  name: string;
  last_name: string;
  pronoun_set: PronounSet;
}

type FamilyType = 'supportive' | 'conditional' | 'distant' | 'absent' | 'hostile';
type FamilyArchetype = 'warm_caring' | 'performance_watching' | 'checked_out' | 'unreachable' | 'critical';
type FamilyMember = 'parent' | 'both_parents' | 'sibling';

interface FamilyRelationship {
  type: FamilyType;
  archetype: FamilyArchetype;
  member: FamilyMember;
  name: string;
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

type RaceEthnicity = 'white' | 'black' | 'hispanic' | 'asian' | 'indigenous' | 'multiracial';
type JobType = 'office' | 'retail' | 'food_service' | 'gig_worker';
type GigType = 'delivery' | 'tasks' | 'mixed';
type EconomicOrigin = 'precarious' | 'modest' | 'comfortable' | 'secure';
type InsuranceType = 'employer' | 'marketplace' | 'medicaid' | 'uninsured';

interface LifeEvent {
  type: string;
  financial_impact: number;
}

interface Backstory {
  economic_origin: EconomicOrigin;
  career_stability: number;  // 0-1
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

type LaborArrangementType = 'fixed' | 'on_demand' | 'rotating' | 'gig' | 'none';

interface LaborArrangement {
  type: LaborArrangementType;
  day_pattern: 'weekdays' | 'specific' | 'any';
  work_days: number[];             // 0=Sun ... 6=Sat
  shift_start: number | null;      // minutes from midnight
  shift_end: number | null;        // minutes from midnight
  split_shift: boolean;            // two separate blocks in one day (e.g. 7-11 AM + 4-8 PM)
  shift_start_2: number | null;    // second block start (minutes from midnight), null if not split
  shift_end_2: number | null;      // second block end (minutes from midnight), null if not split
  reveal_horizon_hours: number | null;
  reveal_tod: number | null;       // minutes from midnight
  work_days_per_week: number;
  on_call: boolean;                // worker has on-call periods outside regular shifts
  on_call_start: number | null;    // minutes from midnight — start of on-call window
  on_call_end: number | null;      // minutes from midnight — end of on-call window
}

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
type Asab = 'afab' | 'amab' | 'intersex';

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

  // Demographics
  race_ethnicity: RaceEthnicity;
  job_type: JobType;
  age_stage: number;
  start_timestamp: number;
  latitude: number;

  // Relationships
  friend1: RelationshipPerson;
  friend2: RelationshipPerson;
  coworker1: RelationshipPerson;
  coworker2: RelationshipPerson;
  supervisor: SupervisorPerson;
  family: FamilyRelationship;
  neighbor: Neighbor;
  corner_store_clerk: BlockCharacter;
  bus_regular: BlockCharacter;

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
  abdominal_baseline: number;

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

  // Substances
  starting_smoker: boolean;
  has_cigarettes_start: number;
  alcohol_tolerance_start: number;
  has_alcohol_start: number;
  cannabis_tolerance_start: number;
  has_cannabis_start: number;

  // Housing & phone
  phone_cracked: boolean;
  phone_age: number; // years (0-5); older phones are slower and drain faster
  housing_quality: number;
  housing_type: HousingType;
  laundry_access: LaundryAccess;

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

  // Jurisdiction
  jurisdiction: Jurisdiction;

  // Insurance
  insurance_type: InsuranceType;
  insurance_bill_day_offset: number;

  // Content warning toggles — default true (content shown); false = softer alternatives
  content_self_harm: boolean;
  content_substance_detail: boolean;
  content_family_abuse: boolean;

  // Wardrobe & food
  wardrobe: ClothingItem[];
  wardrobe_aesthetic: string;
  food_profile: FoodProfile;
  initial_pantry: Pantry;
}

// --- Interactions ---

interface Interaction {
  id: string;
  label: string;
  location: string | null;
  available: () => boolean;
  execute: () => string;
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

interface LocationDef {
  name: string;
  area: string;
  connections: Record<string, number>;
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
