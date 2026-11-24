import { soundFX } from './audio';
import {
  Citizen,
  CitizenActivity,
  CitizenRole,
  CityCondition,
  CityZone,
  DailySnapshot,
  DayPhase,
  DiseaseParams,
  DiscoveryMission,
  PolicySettings,
  SimulationStats,
  Vehicle,
  VisualEffect,
  ZoneId,
} from './types';

export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 760;
export const DAY_DURATION_SEC = 7.0;

export const CITY_ZONES: CityZone[] = [
  {
    id: 'residential_nw',
    name: '북서 주거단지',
    subtitle: '아파트 · 연립주택',
    x: 40,
    y: 40,
    w: 320,
    h: 280,
    color: '#E8EEF5',
    borderColor: '#CBD5E1',
    kind: 'residential',
  },
  {
    id: 'school',
    name: '중앙 학교 캠퍼스',
    subtitle: '초·중·고 교육시설',
    x: 440,
    y: 40,
    w: 310,
    h: 260,
    color: '#EEF2FF',
    borderColor: '#C7D2FE',
    kind: 'school',
  },
  {
    id: 'commercial',
    name: '동부 상업 · 업무지구',
    subtitle: '시장 · 오피스 · 상점',
    x: 830,
    y: 40,
    w: 330,
    h: 300,
    color: '#FEF3C7',
    borderColor: '#FDE68A',
    kind: 'commercial',
  },
  {
    id: 'park',
    name: '서부 중앙공원',
    subtitle: '산책로 · 야외 광장',
    x: 40,
    y: 410,
    w: 320,
    h: 310,
    color: '#DCFCE7',
    borderColor: '#BBF7D0',
    kind: 'park',
  },
  {
    id: 'hospital',
    name: '시립병원 · 방역센터',
    subtitle: '응급병상 · 격리치료동',
    x: 440,
    y: 400,
    w: 310,
    h: 320,
    color: '#FEE2E2',
    borderColor: '#FECACA',
    kind: 'hospital',
  },
  {
    id: 'residential_se',
    name: '남동 주거단지',
    subtitle: '단독주택 · 타운하우스',
    x: 830,
    y: 430,
    w: 330,
    h: 290,
    color: '#E8EEF5',
    borderColor: '#CBD5E1',
    kind: 'residential',
  },
];

export const DEFAULT_POLICY: PolicySettings = {
  maskRate: 0,
  vaccineRate: 0,
  distancingLevel: 0,
  isolationPolicy: 'none',
  facilityRestriction: 'open',
};

export const DEFAULT_DISEASE_PARAMS: DiseaseParams = {
  modelType: 'SIR',
  populationSize: 220,
  initialInfected: 3,
  baseTransmissionProb: 0.34,
  incubationDays: 3,
  incubationInfectious: false,
  infectiousDays: 7,
  immunityDurationDays: 0,
  baseFatalityRate: 0.015,
  overloadedFatalityRate: 0.14,
  severeCaseRate: 0.22,
  vaccineEfficacy: 0.85,
  hospitalBeds: 24,
  medicsCount: 14,
  seed: 'CITY-2026',
};

export const INITIAL_MISSIONS: DiscoveryMission[] = [
  {
    id: 'mission_unmitigated',
    title: '실험 1 · 무방역 확산과 의료 체계 한계',
    question: '아무 방역 정책도 시행하지 않으면 도시의 병상과 사망자 수는 어떻게 변할까요?',
    hint: '정책을 모두 0으로 둔 채 12~18일간 시뮬레이션을 진행해 의료 부담률이 100%를 넘는 순간을 관찰하세요.',
    principle:
      '감염자가 기하급수적으로 늘어나면 의료 수용 한계(병상 수)를 초과하는 "의료 붕괴"가 발생하며, 적시에 치료받지 못한 중증 환자의 치명률이 급격히 상승합니다.',
    unlocked: false,
  },
  {
    id: 'mission_mask_timing',
    title: '실험 2 · 초기 방역(골든타임)의 힘',
    question: '마스크 착용과 격리를 확산 초기에 시행할 때와 늦게 시행할 때 누적 감염자는 얼마나 다를까요?',
    hint: '감염 초기(5일 이내)에 마스크 70% 이상 + 격리 정책을 실행하고 결과를 비교함에 저장해 보세요.',
    principle:
      '질병 확산은 복리처럼 지수적으로 증가하므로, 초기 며칠의 선제적 마스크·격리 대응이 후반부의 고강도 봉쇄보다 훨씬 적은 피해로 유행을 억제합니다.',
    unlocked: false,
  },
  {
    id: 'mission_vaccine_herd',
    title: '실험 3 · 백신과 집단 면역 효과',
    question: '인구의 상당수가 백신을 접종하거나 회복해 면역을 가지면, 접종하지 않은 사람에게도 변화가 생길까요?',
    hint: '백신 접종률을 65% 이상으로 높여 감염 재생산 지표(Rt)가 1.0 아래로 내려가는지 관찰하세요.',
    principle:
      '면역자 비율이 일정 수준을 넘으면 감염자가 새로운 감수성자를 만나기 어려워져 재생산 지표 Rt가 1 미만으로 떨어지고 유행이 자연스럽게 꺾입니다.',
    unlocked: false,
  },
  {
    id: 'mission_seir_latency',
    title: '실험 4 · 잠복기(SEIR)가 확산에 미치는 착시',
    question: '감염 직후 증상이 나타나는 SIR 모델과 달리, 잠복기(E)가 있으면 어떤 현상이 나타날까요?',
    hint: '질병 설정에서 모델을 SEIR로 전환하고 실험을 진행해 황색(잠복기) 시민이 늘어난 뒤 며칠 후 감염 파동이 오는지 확인하세요.',
    principle:
      '잠복기가 있는 감염병은 정책을 시행해도 이미 잠복기에 있던 사람들이 며칠 뒤 환자로 전환되기 때문에, 정책 효과가 통계에 반영되기까지 시차가 존재합니다.',
    unlocked: false,
  },
];

const KOREAN_SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황'];
const KOREAN_GIVEN_NAMES = [
  '민준',
  '서연',
  '지훈',
  '유진',
  '도현',
  '하은',
  '시우',
  '수빈',
  '예준',
  '지우',
  '주원',
  '서윤',
  '건우',
  '채원',
  '현우',
  '다은',
  '준서',
  '지민',
  '우진',
  '소율',
];

function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createMulberry32(seedNum: number): () => number {
  let a = seedNum >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getZone(id: ZoneId): CityZone {
  return CITY_ZONES.find((z) => z.id === id) || CITY_ZONES[0];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export class SimulationEngine {
  public params: DiseaseParams;
  public policy: PolicySettings;
  public citizens: Citizen[] = [];
  public vehicles: Vehicle[] = [];
  public effects: VisualEffect[] = [];
  public history: DailySnapshot[] = [];
  public stats: SimulationStats;
  public missions: DiscoveryMission[];

  private rng: () => number;
  private effectIdCounter = 1;
  private vehicleIdCounter = 1;
  private contactCooldowns = new Map<string, number>();
  private totalSimTime = 0;
  private prevOccupiedBeds = 0;
  private overloadAlertPlayed = false;
  private containmentPlayed = false;

  constructor(
    params: DiseaseParams = DEFAULT_DISEASE_PARAMS,
    policy: PolicySettings = DEFAULT_POLICY,
    existingMissions?: DiscoveryMission[]
  ) {
    this.params = { ...params };
    this.policy = { ...policy };
    this.missions = existingMissions
      ? existingMissions.map((m) => ({ ...m }))
      : INITIAL_MISSIONS.map((m) => ({ ...m }));
    this.rng = createMulberry32(hashString(this.params.seed || 'CITY-2026'));
    this.stats = this.createInitialStats();
    this.initializeWorld();
  }

  private createInitialStats(): SimulationStats {
    return {
      day: 1,
      dayProgress: 0,
      phase: 'morning',
      S: 0,
      E: 0,
      I: 0,
      R: 0,
      D: 0,
      vaccinated: 0,
      totalAlive: this.params.populationSize,
      totalPopulation: this.params.populationSize,
      dailyContacts: 0,
      dailyTransmissions: 0,
      todayNewInfections: 0,
      cumulativeInfections: 0,
      peakInfected: 0,
      peakInfectedDay: 1,
      rt: 0,
      hospitalOccupied: 0,
      hospitalCapacity: this.params.hospitalBeds,
      severePatients: 0,
      medicsCount: this.params.medicsCount,
      healthcareLoadPct: 0,
      healthcareOverloadDays: 0,
      cityCondition: 'calm',
      isEnded: false,
      endReason: 'none',
      zeroInfectionStreak: 0,
    };
  }

  private randomPointInZone(zoneId: ZoneId, padding = 24): { x: number; y: number } {
    const z = getZone(zoneId);
    return {
      x: z.x + padding + this.rng() * Math.max(20, z.w - padding * 2),
      y: z.y + padding + this.rng() * Math.max(20, z.h - padding * 2),
    };
  }

  private initializeWorld(): void {
    this.citizens = [];
    this.vehicles = [];
    this.effects = [];
    this.history = [];
    this.contactCooldowns.clear();
    this.totalSimTime = 0;
    this.overloadAlertPlayed = false;
    this.containmentPlayed = false;

    const n = this.params.populationSize;
    const medicsTarget = Math.min(this.params.medicsCount, Math.floor(n * 0.12));

    for (let i = 0; i < n; i++) {
      let role: CitizenRole = 'resident';
      if (i < medicsTarget) {
        role = 'medic';
      } else {
        const r = this.rng();
        if (r < 0.24) role = 'student';
        else if (r < 0.7) role = 'worker';
        else role = 'resident';
      }

      const homeZone: ZoneId =
        role === 'medic'
          ? 'hospital'
          : this.rng() < 0.52
          ? 'residential_nw'
          : 'residential_se';

      const homePos = this.randomPointInZone(homeZone, 24);
      const surname = KOREAN_SURNAMES[Math.floor(this.rng() * KOREAN_SURNAMES.length)];
      const given = KOREAN_GIVEN_NAMES[Math.floor(this.rng() * KOREAN_GIVEN_NAMES.length)];

      const citizen: Citizen = {
        id: i + 1,
        name: `${surname}${given}`,
        x: homePos.x,
        y: homePos.y,
        vx: 0,
        vy: 0,
        homeX: homePos.x,
        homeY: homePos.y,
        homeZone,
        targetX: homePos.x,
        targetY: homePos.y,
        targetZone: homeZone,
        state: 'S',
        vaccinated: false,
        vaccinePulse: 0,
        maskWearing: false,
        isolated: false,
        hospitalized: false,
        severe: false,
        infectedAtDay: null,
        exposedDaysLeft: 0,
        infectiousDaysLeft: 0,
        immuneDaysLeft: null,
        lastContactId: null,
        lastContactTimer: 0,
        infectionFlash: 0,
        activity: role === 'medic' ? 'hospital' : 'home',
        traits: {
          mobility: 0.65 + this.rng() * 0.85,
          compliance: this.rng(),
          sociability: 0.5 + this.rng() * 1.0,
          role,
        },
      };

      this.citizens.push(citizen);
    }

    // Seed initial infected (avoid medics first)
    const candidates = this.citizens.filter((c) => c.traits.role !== 'medic');
    const initCount = Math.min(this.params.initialInfected, candidates.length);
    for (let k = 0; k < initCount; k++) {
      const idx = Math.floor(this.rng() * candidates.length);
      const patientZero = candidates.splice(idx, 1)[0];
      if (patientZero) {
        patientZero.state = 'I';
        patientZero.infectedAtDay = 1;
        patientZero.infectiousDaysLeft = this.params.infectiousDays;
        patientZero.severe = this.rng() < this.params.severeCaseRate * 0.5;
        patientZero.infectionFlash = 1;
      }
    }

    // Spawn 2 public transit buses on main road loops
    this.vehicles.push(
      {
        id: this.vehicleIdCounter++,
        kind: 'bus',
        x: 400,
        y: 355,
        targetX: 790,
        targetY: 355,
        speed: 92,
        routeIndex: 0,
        angle: 0,
      },
      {
        id: this.vehicleIdCounter++,
        kind: 'bus',
        x: 790,
        y: 355,
        targetX: 400,
        targetY: 355,
        speed: 88,
        routeIndex: 2,
        angle: Math.PI,
      }
    );

    this.applyPolicyToCitizens();
    this.assignTargetsForPhase('morning');
    this.recomputeLiveStats();
    this.recordDailySnapshot();
  }

  public setPolicy(nextPolicy: Partial<PolicySettings>): void {
    this.policy = { ...this.policy, ...nextPolicy };
    this.applyPolicyToCitizens();
    this.assignTargetsForPhase(this.stats.phase);
  }

  private applyPolicyToCitizens(): void {
    const maskThreshold = 1 - this.policy.maskRate / 100;

    // Mask adherence based on compliance trait
    for (const c of this.citizens) {
      if (c.state === 'D') continue;
      if (c.traits.role === 'medic') {
        c.maskWearing = true;
      } else {
        c.maskWearing = this.policy.maskRate > 0 && c.traits.compliance >= maskThreshold;
      }
    }

    // Vaccination rollout up to vaccineRate %
    const aliveNonInfected = this.citizens.filter(
      (c) => c.state === 'S' || c.state === 'R'
    );
    const targetVaccinatedCount = Math.round(
      (this.policy.vaccineRate / 100) * this.citizens.filter((c) => c.state !== 'D').length
    );
    const currentVaccinated = this.citizens.filter((c) => c.state !== 'D' && c.vaccinated).length;

    if (currentVaccinated < targetVaccinatedCount) {
      const needed = targetVaccinatedCount - currentVaccinated;
      const unvaccinated = aliveNonInfected.filter((c) => !c.vaccinated);
      // Sort deterministically by compliance descending so compliant citizens get vaccinated first
      unvaccinated.sort((a, b) => b.traits.compliance - a.traits.compliance);
      const toVaccinate = unvaccinated.slice(0, needed);
      if (toVaccinate.length > 0) {
        soundFX.playVaccine();
      }
      for (const c of toVaccinate) {
        c.vaccinated = true;
        c.vaccinePulse = 1;
        this.spawnEffect({
          kind: 'vaccine_pulse',
          x1: c.x,
          y1: c.y,
          color: '#7C3AED',
        });
      }
    }

    // Immediate isolation check if isolationPolicy is turned on
    if (this.policy.isolationPolicy !== 'none') {
      for (const c of this.citizens) {
        if (c.state === 'I' && !c.isolated && c.infectedAtDay !== null) {
          const daysSince = this.stats.day - c.infectedAtDay;
          if (daysSince >= 1 || c.severe) {
            this.handleIsolationForCitizen(c);
          }
        }
      }
    } else {
      // If isolation policy removed, non-severe isolated patients may return
      for (const c of this.citizens) {
        if (c.isolated && !c.severe) {
          c.isolated = false;
          c.hospitalized = false;
        }
      }
    }
  }

  private handleIsolationForCitizen(c: Citizen): void {
    const hospitalOccupied = this.citizens.filter((p) => p.hospitalized && p.state !== 'D').length;

    if (c.severe && hospitalOccupied < this.params.hospitalBeds) {
      c.hospitalized = true;
      c.isolated = true;
      this.dispatchAmbulance(c);
      return;
    }

    if (this.policy.isolationPolicy === 'facility') {
      if (hospitalOccupied < this.params.hospitalBeds + 18) {
        c.isolated = true;
        c.hospitalized = hospitalOccupied < this.params.hospitalBeds;
        this.dispatchAmbulance(c);
      } else {
        // Facility full -> fallback to home isolation
        c.isolated = true;
      }
    } else if (this.policy.isolationPolicy === 'home') {
      if (c.traits.compliance > 0.2) {
        c.isolated = true;
        c.targetX = c.homeX;
        c.targetY = c.homeY;
        c.targetZone = c.homeZone;
        c.activity = 'quarantine';
      }
    }
  }

  private dispatchAmbulance(patient: Citizen): void {
    const alreadyDispatched = this.vehicles.some(
      (v) => v.kind === 'ambulance' && v.patientId === patient.id
    );
    if (alreadyDispatched) return;

    const hosp = getZone('hospital');
    this.vehicles.push({
      id: this.vehicleIdCounter++,
      kind: 'ambulance',
      x: hosp.x + 28,
      y: hosp.y + 42,
      targetX: patient.x,
      targetY: patient.y,
      speed: 240,
      patientId: patient.id,
      phase: 'pickup',
      angle: 0,
    });
  }

  private assignTargetsForPhase(phase: DayPhase): void {
    const restriction = this.policy.facilityRestriction;

    for (const c of this.citizens) {
      if (c.state === 'D') continue;

      if (c.hospitalized || (c.isolated && this.policy.isolationPolicy === 'facility')) {
        const pt = this.randomPointInZone('hospital', 28);
        c.targetX = pt.x;
        c.targetY = pt.y;
        c.targetZone = 'hospital';
        c.activity = 'hospital';
        continue;
      }

      if (c.isolated) {
        c.targetX = c.homeX;
        c.targetY = c.homeY;
        c.targetZone = c.homeZone;
        c.activity = 'quarantine';
        continue;
      }

      if (c.traits.role === 'medic') {
        const pt = this.randomPointInZone('hospital', 28);
        c.targetX = pt.x;
        c.targetY = pt.y;
        c.targetZone = 'hospital';
        c.activity = 'hospital';
        continue;
      }

      if (phase === 'night') {
        c.targetX = c.homeX;
        c.targetY = c.homeY;
        c.targetZone = c.homeZone;
        c.activity = 'home';
        continue;
      }

      if (phase === 'morning' || phase === 'daytime') {
        if (c.traits.role === 'student') {
          if (restriction === 'closed' || (restriction === 'partial' && this.rng() < 0.55)) {
            c.targetX = c.homeX + (this.rng() - 0.5) * 32;
            c.targetY = c.homeY + (this.rng() - 0.5) * 32;
            c.targetZone = c.homeZone;
            c.activity = 'home';
          } else {
            const pt = this.randomPointInZone('school', 26);
            c.targetX = pt.x;
            c.targetY = pt.y;
            c.targetZone = 'school';
            c.activity = 'school';
          }
        } else if (c.traits.role === 'worker') {
          if (restriction === 'closed' && this.rng() < 0.72) {
            c.targetX = c.homeX + (this.rng() - 0.5) * 30;
            c.targetY = c.homeY + (this.rng() - 0.5) * 30;
            c.targetZone = c.homeZone;
            c.activity = 'home';
          } else if (restriction === 'partial' && this.rng() < 0.38) {
            const pt = this.randomPointInZone('park', 28);
            c.targetX = pt.x;
            c.targetY = pt.y;
            c.targetZone = 'park';
            c.activity = 'park';
          } else {
            const pt = this.randomPointInZone('commercial', 28);
            c.targetX = pt.x;
            c.targetY = pt.y;
            c.targetZone = 'commercial';
            c.activity = 'work';
          }
        } else {
          // Resident
          const roll = this.rng();
          if (restriction !== 'closed' && roll < 0.45) {
            const pt = this.randomPointInZone('commercial', 28);
            c.targetX = pt.x;
            c.targetY = pt.y;
            c.targetZone = 'commercial';
            c.activity = 'shopping';
          } else if (roll < 0.82) {
            const pt = this.randomPointInZone('park', 28);
            c.targetX = pt.x;
            c.targetY = pt.y;
            c.targetZone = 'park';
            c.activity = 'park';
          } else {
            c.targetX = c.homeX;
            c.targetY = c.homeY;
            c.targetZone = c.homeZone;
            c.activity = 'home';
          }
        }
      } else if (phase === 'evening') {
        const roll = this.rng();
        if (restriction === 'closed' || this.policy.distancingLevel >= 3) {
          c.targetX = c.homeX;
          c.targetY = c.homeY;
          c.targetZone = c.homeZone;
          c.activity = 'home';
        } else if (roll < 0.35 && restriction === 'open') {
          const pt = this.randomPointInZone('commercial', 28);
          c.targetX = pt.x;
          c.targetY = pt.y;
          c.targetZone = 'commercial';
          c.activity = 'shopping';
        } else if (roll < 0.68) {
          const pt = this.randomPointInZone('park', 28);
          c.targetX = pt.x;
          c.targetY = pt.y;
          c.targetZone = 'park';
          c.activity = 'park';
        } else {
          c.targetX = c.homeX;
          c.targetY = c.homeY;
          c.targetZone = c.homeZone;
          c.activity = 'home';
        }
      }
    }
  }

  public step(dtSeconds: number): boolean {
    if (this.stats.isEnded) {
      this.updateEffects(dtSeconds);
      return false;
    }

    const clampedDt = Math.min(dtSeconds, 0.08);
    this.totalSimTime += clampedDt;

    const prevPhase = this.stats.phase;
    this.stats.dayProgress += clampedDt / DAY_DURATION_SEC;

    const newPhase: DayPhase =
      this.stats.dayProgress < 0.18
        ? 'morning'
        : this.stats.dayProgress < 0.6
        ? 'daytime'
        : this.stats.dayProgress < 0.82
        ? 'evening'
        : 'night';

    if (newPhase !== prevPhase) {
      this.stats.phase = newPhase;
      this.assignTargetsForPhase(newPhase);
    }

    this.updateCitizensMovement(clampedDt);
    this.updateVehicles(clampedDt);
    this.evaluateContactsAndTransmission(clampedDt);
    this.updateEffects(clampedDt);

    let dayCompleted = false;
    if (this.stats.dayProgress >= 1) {
      this.stats.dayProgress -= 1;
      this.resolveEndOfDay();
      dayCompleted = true;
    }

    this.recomputeLiveStats();
    return dayCompleted;
  }

  public advanceSingleDay(): void {
    // Steps cleanly to the end of the current day in discrete simulation sub-ticks
    const remainingProgress = 1 - this.stats.dayProgress;
    const steps = Math.max(12, Math.round(remainingProgress * 36));
    const subDt = (remainingProgress * DAY_DURATION_SEC + 0.01) / steps;
    for (let i = 0; i < steps; i++) {
      const done = this.step(subDt);
      if (done) break;
    }
  }

  private updateCitizensMovement(dt: number): void {
    const distancing = this.policy.distancingLevel;
    const speedScale = distancing === 3 ? 0.68 : distancing === 2 ? 0.8 : 1.0;

    // Periodic micro-wander within current zone
    for (const c of this.citizens) {
      if (c.state === 'D') continue;

      if (c.infectionFlash > 0) c.infectionFlash = Math.max(0, c.infectionFlash - dt * 1.4);
      if (c.vaccinePulse > 0) c.vaccinePulse = Math.max(0, c.vaccinePulse - dt * 1.1);
      if (c.lastContactTimer > 0) {
        c.lastContactTimer = Math.max(0, c.lastContactTimer - dt * 1.8);
        if (c.lastContactTimer === 0) c.lastContactId = null;
      }

      if (c.inTransit) continue;

      const dx = c.targetX - c.x;
      const dy = c.targetY - c.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 6) {
        const baseSpeed = (c.hospitalized ? 110 : 72) * c.traits.mobility * speedScale;
        c.vx = (dx / dist) * baseSpeed;
        c.vy = (dy / dist) * baseSpeed;
      } else {
        // Gentle local wandering unless isolated at home
        if (!c.isolated && this.rng() < 0.03) {
          const wanderRadius = distancing >= 2 ? 18 : 34;
          const z = getZone(c.targetZone);
          c.targetX = clamp(c.x + (this.rng() - 0.5) * wanderRadius * 2, z.x + 18, z.x + z.w - 18);
          c.targetY = clamp(c.y + (this.rng() - 0.5) * wanderRadius * 2, z.y + 18, z.y + z.h - 18);
        }
        c.vx *= 0.82;
        c.vy *= 0.82;
      }

      c.x = clamp(c.x + c.vx * dt, 18, WORLD_WIDTH - 18);
      c.y = clamp(c.y + c.vy * dt, 18, WORLD_HEIGHT - 18);
    }
  }

  private updateVehicles(dt: number): void {
    const busWaypoints = [
      { x: 400, y: 355 },
      { x: 790, y: 355 },
      { x: 790, y: 700 },
      { x: 400, y: 700 },
    ];

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];

      if (v.kind === 'bus') {
        const busSpeedScale =
          this.policy.facilityRestriction === 'closed'
            ? 0.35
            : this.policy.facilityRestriction === 'partial'
            ? 0.65
            : 1.0;

        const wp = busWaypoints[v.routeIndex ?? 0];
        const dx = wp.x - v.x;
        const dy = wp.y - v.y;
        const d = Math.hypot(dx, dy);
        if (d < 8) {
          v.routeIndex = ((v.routeIndex ?? 0) + 1) % busWaypoints.length;
        } else {
          v.angle = Math.atan2(dy, dx);
          v.x += (dx / d) * v.speed * busSpeedScale * dt;
          v.y += (dy / d) * v.speed * busSpeedScale * dt;
        }
      } else if (v.kind === 'ambulance') {
        const patient = this.citizens.find((c) => c.id === v.patientId);
        if (!patient || patient.state === 'D') {
          this.vehicles.splice(i, 1);
          continue;
        }

        if (v.phase === 'pickup') {
          v.targetX = patient.x;
          v.targetY = patient.y;
          const dx = v.targetX - v.x;
          const dy = v.targetY - v.y;
          const d = Math.hypot(dx, dy);
          if (d < 14) {
            v.phase = 'return';
            patient.inTransit = true;
            const hosp = getZone('hospital');
            v.targetX = hosp.x + hosp.w * 0.5;
            v.targetY = hosp.y + hosp.h * 0.5;
          } else {
            v.angle = Math.atan2(dy, dx);
            v.x += (dx / d) * v.speed * dt;
            v.y += (dy / d) * v.speed * dt;
          }
        } else {
          const dx = v.targetX - v.x;
          const dy = v.targetY - v.y;
          const d = Math.hypot(dx, dy);
          patient.x = v.x;
          patient.y = v.y;
          if (d < 16) {
            patient.inTransit = false;
            const pt = this.randomPointInZone('hospital', 28);
            patient.x = pt.x;
            patient.y = pt.y;
            patient.targetX = pt.x;
            patient.targetY = pt.y;
            patient.targetZone = 'hospital';
            patient.activity = 'hospital';
            this.vehicles.splice(i, 1);
          } else {
            v.angle = Math.atan2(dy, dx);
            v.x += (dx / d) * v.speed * dt;
            v.y += (dy / d) * v.speed * dt;
          }
        }
      }
    }
  }

  private evaluateContactsAndTransmission(dt: number): void {
    const distancing = this.policy.distancingLevel;
    const contactRadius = [26, 22, 18, 14][distancing];
    const cellSize = 36;
    const grid = new Map<string, Citizen[]>();

    for (const c of this.citizens) {
      if (c.state === 'D' || c.inTransit) continue;
      const gx = Math.floor(c.x / cellSize);
      const gy = Math.floor(c.y / cellSize);
      const key = `${gx},${gy}`;
      let list = grid.get(key);
      if (!list) {
        list = [];
        grid.set(key, list);
      }
      list.push(c);
    }

    // Repulsion steering when social distancing is active
    if (distancing > 0) {
      const repulseRadius = 18 + distancing * 8;
      const repulseStrength = 28 * distancing;
      for (const c of this.citizens) {
        if (c.state === 'D' || c.isolated || c.hospitalized) continue;
        const gx = Math.floor(c.x / cellSize);
        const gy = Math.floor(c.y / cellSize);
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const neighbors = grid.get(`${gx + ox},${gy + oy}`);
            if (!neighbors) continue;
            for (const other of neighbors) {
              if (other.id <= c.id) continue;
              const dx = c.x - other.x;
              const dy = c.y - other.y;
              const d = Math.hypot(dx, dy);
              if (d > 0.5 && d < repulseRadius) {
                const push = ((repulseRadius - d) / repulseRadius) * repulseStrength * dt;
                c.x = clamp(c.x + (dx / d) * push, 18, WORLD_WIDTH - 18);
                c.y = clamp(c.y + (dy / d) * push, 18, WORLD_HEIGHT - 18);
                other.x = clamp(other.x - (dx / d) * push, 18, WORLD_WIDTH - 18);
                other.y = clamp(other.y - (dy / d) * push, 18, WORLD_HEIGHT - 18);
              }
            }
          }
        }
      }
    }

    // Contact & infection checks
    const infectiousCitizens = this.citizens.filter(
      (c) =>
        (c.state === 'I' || (c.state === 'E' && this.params.incubationInfectious)) &&
        !c.inTransit
    );

    const distancingFactor = [1.0, 0.76, 0.52, 0.28][distancing];

    for (const infector of infectiousCitizens) {
      // Isolated/hospitalized citizens have heavily reduced contact radius & rate
      const effRadius = infector.isolated || infector.hospitalized ? contactRadius * 0.45 : contactRadius;
      const gx = Math.floor(infector.x / cellSize);
      const gy = Math.floor(infector.y / cellSize);

      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const neighbors = grid.get(`${gx + ox},${gy + oy}`);
          if (!neighbors) continue;
          for (const target of neighbors) {
            if (target.id === infector.id) continue;
            if (target.isolated || target.hospitalized) continue;
            if (infector.hospitalized && target.traits.role === 'medic') {
              // Medics in full PPE have strong protection inside hospital
              continue;
            }

            const d = Math.hypot(target.x - infector.x, target.y - infector.y);
            if (d > effRadius) continue;

            const pairKey =
              infector.id < target.id
                ? `${infector.id}-${target.id}`
                : `${target.id}-${infector.id}`;
            const lastTime = this.contactCooldowns.get(pairKey) ?? -10;
            if (this.totalSimTime - lastTime < 0.75) continue;
            this.contactCooldowns.set(pairKey, this.totalSimTime);

            this.stats.dailyContacts += 1;
            infector.lastContactId = target.id;
            infector.lastContactTimer = 0.7;

            if (target.state !== 'S') continue;

            // Compute infection probability
            let prob = this.params.baseTransmissionProb * 0.24 * distancingFactor;
            if (infector.state === 'E') prob *= 0.4;
            if (infector.maskWearing) prob *= 0.38;
            if (target.maskWearing) prob *= 0.62;
            if (target.vaccinated) prob *= 1 - this.params.vaccineEfficacy;
            if (infector.isolated) prob *= 0.15;

            if (this.rng() < prob) {
              this.infectCitizen(target, infector);
            } else {
              // Subtle contact ring visual
              this.spawnEffect({
                kind: 'contact_ring',
                x1: (infector.x + target.x) * 0.5,
                y1: (infector.y + target.y) * 0.5,
                color: '#94A3B8',
              });
            }
          }
        }
      }
    }
  }

  private infectCitizen(target: Citizen, source: Citizen | null): void {
    const usesLatent = this.params.modelType === 'SEIR' || this.params.modelType === 'SEIRS';
    target.infectedAtDay = this.stats.day;
    target.infectionFlash = 1;
    target.severe =
      this.rng() <
      this.params.severeCaseRate * (target.vaccinated ? 0.2 : 1.0);

    if (usesLatent) {
      target.state = 'E';
      target.exposedDaysLeft = this.params.incubationDays;
    } else {
      target.state = 'I';
      target.infectiousDaysLeft = this.params.infectiousDays;
    }

    this.stats.todayNewInfections += 1;
    this.stats.cumulativeInfections += 1;
    this.stats.dailyTransmissions += 1;

    soundFX.playInfection();

    if (source) {
      this.spawnEffect({
        kind: 'transmission_arc',
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y,
        color: usesLatent ? '#D97706' : '#DC2626',
      });
    }
    this.spawnEffect({
      kind: 'infection_wave',
      x1: target.x,
      y1: target.y,
      color: usesLatent ? '#D97706' : '#DC2626',
    });
  }

  private resolveEndOfDay(): void {
    // 1. State progressions (E -> I, I -> R/D, R -> S if SEIRS)
    for (const c of this.citizens) {
      if (c.state === 'E') {
        c.exposedDaysLeft -= 1;
        if (c.exposedDaysLeft <= 0) {
          c.state = 'I';
          c.infectiousDaysLeft = this.params.infectiousDays;
          c.infectionFlash = 1;
          this.spawnEffect({
            kind: 'infection_wave',
            x1: c.x,
            y1: c.y,
            color: '#DC2626',
          });
        }
      } else if (c.state === 'I') {
        // Check if isolation/hospitalization triggers today
        if (!c.isolated && c.infectedAtDay !== null && this.stats.day - c.infectedAtDay >= 1) {
          if (this.policy.isolationPolicy !== 'none' || c.severe) {
            this.handleIsolationForCitizen(c);
          }
        }

        c.infectiousDaysLeft -= 1;
        if (c.infectiousDaysLeft <= 0) {
          const hospitalFull =
            this.citizens.filter((p) => p.hospitalized && p.state !== 'D').length >=
            this.params.hospitalBeds;

          let fatality = this.params.baseFatalityRate;
          if (c.severe && !c.hospitalized && hospitalFull) {
            fatality = this.params.overloadedFatalityRate;
          } else if (c.severe && !c.hospitalized) {
            fatality = this.params.baseFatalityRate * 2.2;
          }
          if (c.vaccinated) {
            fatality *= 0.15;
          }

          if (this.rng() < fatality) {
            c.state = 'D';
            c.hospitalized = false;
            c.isolated = false;
            c.inTransit = false;
          } else {
            c.state = 'R';
            c.hospitalized = false;
            c.isolated = false;
            c.inTransit = false;
            c.severe = false;
            if (
              this.params.modelType === 'SEIRS' &&
              this.params.immunityDurationDays > 0
            ) {
              c.immuneDaysLeft = this.params.immunityDurationDays;
            }
            this.spawnEffect({
              kind: 'recovery_spark',
              x1: c.x,
              y1: c.y,
              color: '#059669',
            });
          }
        }
      } else if (
        c.state === 'R' &&
        this.params.modelType === 'SEIRS' &&
        c.immuneDaysLeft !== null
      ) {
        c.immuneDaysLeft -= 1;
        if (c.immuneDaysLeft <= 0) {
          c.state = 'S';
          c.immuneDaysLeft = null;
        }
      }
    }

    this.recomputeLiveStats();

    if (this.stats.healthcareLoadPct >= 100) {
      this.stats.healthcareOverloadDays += 1;
      if (!this.overloadAlertPlayed) {
        soundFX.playAlert();
        this.overloadAlertPlayed = true;
      }
    }

    // Record snapshot for today before resetting daily counters
    this.stats.day += 1;
    this.recordDailySnapshot();

    // Evaluate discovery missions
    this.evaluateMissions();

    // Check termination conditions
    const activeCases = this.stats.I + this.stats.E;
    if (this.stats.totalAlive === 0) {
      this.stats.isEnded = true;
      this.stats.endReason = 'collapse';
    } else if (this.stats.day >= 3 && activeCases === 0 && this.stats.cumulativeInfections > 0) {
      this.stats.zeroInfectionStreak += 1;
      if (this.stats.zeroInfectionStreak >= 2) {
        this.stats.isEnded = true;
        this.stats.endReason = 'contained';
        if (!this.containmentPlayed) {
          soundFX.playContainment();
          this.containmentPlayed = true;
        }
      }
    } else {
      this.stats.zeroInfectionStreak = 0;
    }

    // Reset daily rolling counters for the new day
    this.stats.todayNewInfections = 0;
    this.stats.dailyContacts = 0;
    this.stats.dailyTransmissions = 0;
    this.contactCooldowns.clear();
    soundFX.playDayTick();
  }

  private recomputeLiveStats(): void {
    let S = 0;
    let E = 0;
    let I = 0;
    let R = 0;
    let D = 0;
    let vaccinated = 0;
    let hospitalized = 0;
    let severe = 0;

    for (const c of this.citizens) {
      if (c.state === 'S') S++;
      else if (c.state === 'E') E++;
      else if (c.state === 'I') I++;
      else if (c.state === 'R') R++;
      else if (c.state === 'D') D++;

      if (c.state !== 'D' && c.vaccinated) vaccinated++;
      if (c.state !== 'D' && c.hospitalized) hospitalized++;
      if (c.state === 'I' && c.severe) severe++;
    }

    const totalAlive = S + E + I + R;
    const capacity = Math.max(1, this.params.hospitalBeds);
    const loadPct = Math.round((hospitalized / capacity) * 100);

    if (I > this.stats.peakInfected) {
      this.stats.peakInfected = I;
      this.stats.peakInfectedDay = this.stats.day;
    }

    // Estimate effective Rt from recent transmissions per active infectious person
    const activeInf = Math.max(1, I + E * 0.4);
    const estRt =
      I + E === 0
        ? 0
        : Number(
            (
              (this.stats.todayNewInfections / activeInf) *
              Math.max(1, this.params.infectiousDays * 0.45)
            ).toFixed(2)
          );

    // Determine City Condition for state-linked visuals
    let condition: CityCondition = 'calm';
    if (this.stats.isEnded && this.stats.endReason === 'contained') {
      condition = 'contained';
    } else if (I === 0 && E === 0) {
      condition = this.stats.cumulativeInfections > 0 ? 'contained' : 'calm';
    } else if (loadPct >= 85 || I >= this.params.populationSize * 0.18) {
      condition = 'surge';
    } else if (
      this.history.length >= 3 &&
      I < this.history[this.history.length - 1].I &&
      R > I
    ) {
      condition = 'recovering';
    } else {
      condition = 'spreading';
    }

    this.prevOccupiedBeds = hospitalized;

    this.stats.S = S;
    this.stats.E = E;
    this.stats.I = I;
    this.stats.R = R;
    this.stats.D = D;
    this.stats.vaccinated = vaccinated;
    this.stats.totalAlive = totalAlive;
    this.stats.totalPopulation = this.citizens.length;
    this.stats.hospitalOccupied = hospitalized;
    this.stats.hospitalCapacity = this.params.hospitalBeds;
    this.stats.severePatients = severe;
    this.stats.healthcareLoadPct = loadPct;
    this.stats.rt = estRt;
    this.stats.cityCondition = condition;
  }

  private recordDailySnapshot(): void {
    this.history.push({
      day: this.stats.day,
      S: this.stats.S,
      E: this.stats.E,
      I: this.stats.I,
      R: this.stats.R,
      D: this.stats.D,
      vaccinated: this.stats.vaccinated,
      newInfections: this.stats.todayNewInfections,
      cumulativeInfections: this.stats.cumulativeInfections,
      contacts: this.stats.dailyContacts,
      transmissions: this.stats.dailyTransmissions,
      rt: this.stats.rt,
      hospitalOccupied: this.stats.hospitalOccupied,
      hospitalCapacity: this.stats.hospitalCapacity,
      healthcareLoadPct: this.stats.healthcareLoadPct,
    });
  }

  private evaluateMissions(): void {
    for (const m of this.missions) {
      if (m.unlocked) continue;
      if (
        m.id === 'mission_unmitigated' &&
        this.stats.healthcareOverloadDays >= 1
      ) {
        m.unlocked = true;
        m.unlockedAtDay = this.stats.day;
      } else if (
        m.id === 'mission_mask_timing' &&
        this.policy.maskRate >= 60 &&
        this.policy.isolationPolicy !== 'none' &&
        this.stats.day >= 8 &&
        this.stats.cumulativeInfections < this.params.populationSize * 0.45
      ) {
        m.unlocked = true;
        m.unlockedAtDay = this.stats.day;
      } else if (
        m.id === 'mission_vaccine_herd' &&
        this.policy.vaccineRate >= 60 &&
        this.stats.day >= 6 &&
        this.stats.rt < 1.0 &&
        this.stats.cumulativeInfections > 0
      ) {
        m.unlocked = true;
        m.unlockedAtDay = this.stats.day;
      } else if (
        m.id === 'mission_seir_latency' &&
        (this.params.modelType === 'SEIR' || this.params.modelType === 'SEIRS') &&
        this.stats.E >= 3 &&
        this.stats.day >= 4
      ) {
        m.unlocked = true;
        m.unlockedAtDay = this.stats.day;
      }
    }
  }

  private spawnEffect(partial: Omit<VisualEffect, 'id' | 'progress'>): void {
    if (this.effects.length > 90) this.effects.shift();
    this.effects.push({
      ...partial,
      id: this.effectIdCounter++,
      progress: 0,
    });
  }

  private updateEffects(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.progress += dt * (e.kind === 'transmission_arc' ? 2.1 : 1.5);
      if (e.progress >= 1) {
        this.effects.splice(i, 1);
      }
    }
  }

  // Interactive User Tools on Canvas
  public infectNearestCitizen(worldX: number, worldY: number): Citizen | null {
    let best: Citizen | null = null;
    let bestDist = 36;
    for (const c of this.citizens) {
      if (c.state !== 'S') continue;
      const d = Math.hypot(c.x - worldX, c.y - worldY);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    if (best) {
      this.infectCitizen(best, null);
      this.stats.isEnded = false;
      this.stats.endReason = 'none';
      this.stats.zeroInfectionStreak = 0;
      this.recomputeLiveStats();
    }
    return best;
  }

  public vaccinateNearestCitizen(worldX: number, worldY: number): Citizen | null {
    let best: Citizen | null = null;
    let bestDist = 36;
    for (const c of this.citizens) {
      if (c.state === 'D' || c.state === 'I' || c.vaccinated) continue;
      const d = Math.hypot(c.x - worldX, c.y - worldY);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    if (best) {
      best.vaccinated = true;
      best.vaccinePulse = 1;
      soundFX.playVaccine();
      this.spawnEffect({
        kind: 'vaccine_pulse',
        x1: best.x,
        y1: best.y,
        color: '#7C3AED',
      });
      this.recomputeLiveStats();
    }
    return best;
  }

  public findCitizenAt(worldX: number, worldY: number): Citizen | null {
    let best: Citizen | null = null;
    let bestDist = 20;
    for (const c of this.citizens) {
      if (c.state === 'D') continue;
      const d = Math.hypot(c.x - worldX, c.y - worldY);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  }
}
