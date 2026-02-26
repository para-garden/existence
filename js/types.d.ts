// types.d.ts — shared type definitions for existence

// --- NameData (from generated names.js, excluded from tsc) ---

type NamePair = [string, number];

declare const NameData: {
  first: NamePair[];
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
  flavor: string;
}

interface SupervisorPerson {
  name: string;
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
  pronoun: 'they' | 'she' | 'he';
}

type JobType = 'office' | 'retail' | 'food_service' | 'gig_worker';
type GigType = 'delivery' | 'tasks' | 'mixed';
type EconomicOrigin = 'precarious' | 'modest' | 'comfortable' | 'secure';

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
  reveal_horizon_hours: number | null;
  reveal_tod: number | null;       // minutes from midnight
  work_days_per_week: number;
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
  cooking_skill: number;           // 10-85
  ethical: 'vegan' | 'vegetarian' | null;
  staples: string[];
  comfort_snack: 'chips' | 'cookies' | 'candy' | 'crackers' | 'instant_ramen';
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
}

interface Jurisdiction {
  country: string;
  region: string | null;
}

type Pronouns = 'she/her' | 'he/him' | 'they/them' | 'she/they' | 'he/they';
type TransPresentation = 'transfem' | 'transmasc' | 'nonbinary' | null;
type Sexuality = 'gay' | 'bisexual' | 'straight';
type LaundryAccess = 'in_unit' | 'building' | 'laundromat';
type Asab = 'afab' | 'amab' | 'intersex';

interface GameCharacter {
  // Identity
  first_name: string;
  last_name: string;
  sleepwear: string;
  pronouns: Pronouns;
  trans: boolean;
  trans_presentation: TransPresentation;
  hrt_active: boolean;
  sexuality: Sexuality;
  out_at_work: boolean;
  out_to_family: boolean;
  wears_makeup: boolean;
  makeup_count: number;
  wears_binder: boolean;
  binder_count: number;

  // Demographics
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

  // Substances
  starting_smoker: boolean;
  has_cigarettes_start: number;
  alcohol_tolerance_start: number;
  has_alcohol_start: number;
  cannabis_tolerance_start: number;
  has_cannabis_start: number;

  // Housing & phone
  phone_cracked: boolean;
  housing_quality: number;
  laundry_access: LaundryAccess;

  // Consumables
  has_umbrella: boolean;
  period_supply_count: number;

  // Menstrual cycle
  cycle_length: number | null;
  cycle_start_day: number | null;
  cramp_severity: number | null;

  // Jurisdiction
  jurisdiction: Jurisdiction;

  // Wardrobe & food
  wardrobe: ClothingItem[];
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
  action: { type: string; id?: string; destination?: string };
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
  status: 'active';
  createdAt: number;
  lastPlayed: number;
  version: number;
}

interface RunSummary {
  id: string;
  status: 'active';
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
