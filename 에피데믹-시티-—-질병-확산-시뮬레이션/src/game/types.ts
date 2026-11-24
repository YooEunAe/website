export type ModelType = 'SIR' | 'SEIR' | 'SEIRS';

export type HealthState = 'S' | 'E' | 'I' | 'R' | 'D';

export type CitizenRole = 'resident' | 'student' | 'worker' | 'medic';

export type CitizenActivity =
  | 'home'
  | 'commute'
  | 'school'
  | 'work'
  | 'shopping'
  | 'park'
  | 'hospital'
  | 'quarantine';

export type ZoneId =
  | 'residential_nw'
  | 'residential_se'
  | 'school'
  | 'commercial'
  | 'park'
  | 'hospital';

export type CityCondition = 'calm' | 'spreading' | 'surge' | 'recovering' | 'contained';

export type DayPhase = 'morning' | 'daytime' | 'evening' | 'night';

export type IsolationPolicy = 'none' | 'home' | 'facility';

export type FacilityRestriction = 'open' | 'partial' | 'closed';

export type CanvasTool = 'inspect' | 'infect' | 'vaccinate';

export interface PolicySettings {
  maskRate: number; // 0 ~ 100 (%)
  vaccineRate: number; // 0 ~ 100 (%)
  distancingLevel: 0 | 1 | 2 | 3; // 0: 없음, 1: 권고, 2: 강화, 3: 고강도
  isolationPolicy: IsolationPolicy;
  facilityRestriction: FacilityRestriction;
}

export interface DiseaseParams {
  modelType: ModelType;
  populationSize: number; // e.g., 160 ~ 320
  initialInfected: number;
  baseTransmissionProb: number; // 0.05 ~ 0.60 per contact window
  incubationDays: number; // 1 ~ 7 days (SEIR/SEIRS)
  incubationInfectious: boolean; // whether E can transmit at reduced rate
  infectiousDays: number; // 4 ~ 14 days
  immunityDurationDays: number; // 0 = permanent, >0 for SEIRS waning
  baseFatalityRate: number; // 0.005 ~ 0.15
  overloadedFatalityRate: number; // 0.03 ~ 0.35 when beds full
  severeCaseRate: number; // 0.10 ~ 0.40 of infected need hospital care
  vaccineEfficacy: number; // 0.50 ~ 0.95 educational assumption
  hospitalBeds: number; // e.g., 16 ~ 60
  medicsCount: number; // e.g., 8 ~ 24
  seed: string;
}

export interface CitizenTraits {
  mobility: number; // 0.5 ~ 1.5
  compliance: number; // 0 ~ 1 (determines mask & distancing adherence)
  sociability: number; // 0.4 ~ 1.6
  role: CitizenRole;
}

export interface Citizen {
  id: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  homeZone: ZoneId;
  targetX: number;
  targetY: number;
  targetZone: ZoneId;
  state: HealthState;
  vaccinated: boolean;
  vaccinePulse: number; // 0..1 animation timer
  maskWearing: boolean;
  isolated: boolean;
  hospitalized: boolean;
  severe: boolean;
  infectedAtDay: number | null;
  exposedDaysLeft: number;
  infectiousDaysLeft: number;
  immuneDaysLeft: number | null;
  lastContactId: number | null;
  lastContactTimer: number; // visual contact highlight
  infectionFlash: number; // 0..1 animation on newly infected
  activity: CitizenActivity;
  traits: CitizenTraits;
  inTransit?: boolean;
}

export interface CityZone {
  id: ZoneId;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  borderColor: string;
  kind: 'residential' | 'school' | 'commercial' | 'park' | 'hospital';
}

export interface Vehicle {
  id: number;
  kind: 'ambulance' | 'bus';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  patientId?: number;
  phase?: 'pickup' | 'return';
  routeIndex?: number;
  angle: number;
}

export interface VisualEffect {
  id: number;
  kind: 'transmission_arc' | 'infection_wave' | 'vaccine_pulse' | 'recovery_spark' | 'contact_ring';
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  progress: number; // 0 -> 1
  color: string;
}

export interface DailySnapshot {
  day: number;
  S: number;
  E: number;
  I: number;
  R: number;
  D: number;
  vaccinated: number;
  newInfections: number;
  cumulativeInfections: number;
  contacts: number;
  transmissions: number;
  rt: number;
  hospitalOccupied: number;
  hospitalCapacity: number;
  healthcareLoadPct: number;
}

export interface SimulationStats {
  day: number;
  dayProgress: number; // 0 ~ 1
  phase: DayPhase;
  S: number;
  E: number;
  I: number;
  R: number;
  D: number;
  vaccinated: number;
  totalAlive: number;
  totalPopulation: number;
  dailyContacts: number;
  dailyTransmissions: number;
  todayNewInfections: number;
  cumulativeInfections: number;
  peakInfected: number;
  peakInfectedDay: number;
  rt: number;
  hospitalOccupied: number;
  hospitalCapacity: number;
  severePatients: number;
  medicsCount: number;
  healthcareLoadPct: number;
  healthcareOverloadDays: number;
  cityCondition: CityCondition;
  isEnded: boolean;
  endReason: 'contained' | 'collapse' | 'none';
  zeroInfectionStreak: number;
}

export interface PolicyEventLog {
  day: number;
  label: string;
  detail: string;
}

export interface SavedExperimentRun {
  id: string;
  name: string;
  savedAt: string;
  seed: string;
  modelType: ModelType;
  totalPopulation: number;
  hospitalCapacity: number;
  finalDay: number;
  peakInfected: number;
  peakInfectedDay: number;
  cumulativeInfections: number;
  totalDeaths: number;
  totalRecovered: number;
  healthcareOverloadDays: number;
  endReason: 'contained' | 'collapse' | 'none';
  policySummary: string;
  history: DailySnapshot[];
}

export interface DiscoveryMission {
  id: string;
  title: string;
  question: string;
  hint: string;
  principle: string;
  unlocked: boolean;
  unlockedAtDay?: number;
}
