import React from 'react';
import {
  BookmarkPlus,
  Building2,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  StepForward,
  Syringe,
  Users,
} from 'lucide-react';
import { DailySnapshot, ModelType, PolicySettings, SimulationStats } from '../game/types';
import { EpidemicChart } from './EpidemicChart';

interface PolicyDeckProps {
  isRunning: boolean;
  speed: 1 | 2 | 4;
  stats: SimulationStats;
  policy: PolicySettings;
  history: DailySnapshot[];
  modelType: ModelType;
  seed: string;
  onToggleRun: () => void;
  onChangeSpeed: (speed: 1 | 2 | 4) => void;
  onStepDay: () => void;
  onReset: () => void;
  onUpdatePolicy: (patch: Partial<PolicySettings>) => void;
  onApplyPreset: (presetName: string, nextPolicy: PolicySettings) => void;
  onSaveRun: () => void;
  onOpenReport: () => void;
}

const PHASE_LABEL: Record<SimulationStats['phase'], string> = {
  morning: '하루 시작 · 등교/출근',
  daytime: '주간 활동 · 접촉 전파',
  evening: '저녁 교류 · 귀가',
  night: '야간 정산 · 회복 판정',
};

export const PolicyDeck: React.FC<PolicyDeckProps> = ({
  isRunning,
  speed,
  stats,
  policy,
  history,
  modelType,
  seed,
  onToggleRun,
  onChangeSpeed,
  onStepDay,
  onReset,
  onUpdatePolicy,
  onApplyPreset,
  onSaveRun,
  onOpenReport,
}) => {
  return (
    <aside className="flex flex-col gap-3.5 h-full">
      {/* 1. Round & Time Progression Controller */}
      <section className="rounded-xl bg-white border border-[#DCE3EC] p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900 font-mono-num">
                {stats.day}일차
              </span>
              <span className="text-xs text-slate-500">· {PHASE_LABEL[stats.phase]}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono-num mt-0.5">
              시드: {seed}
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeSpeed(s)}
                className={`px-2.5 py-1 text-xs font-mono-num font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  speed === s
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Day Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-3">
          <div
            className="h-full bg-slate-900 transition-all duration-100"
            style={{ width: `${Math.round(stats.dayProgress * 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onToggleRun}
            disabled={stats.isEnded}
            className={`h-10 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              isRunning
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-[#0F172A] text-white hover:bg-slate-800 disabled:opacity-40'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? '일시정지' : '진행 시작'}
          </button>

          <button
            type="button"
            onClick={onStepDay}
            disabled={stats.isEnded}
            className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-40 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            title="현재 라운드(하루)를 완료하고 다음 날로 진행"
          >
            <StepForward className="w-3.5 h-3.5" />
            다음 날
          </button>

          <button
            type="button"
            onClick={onReset}
            className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            초기화
          </button>
        </div>

        {/* Quick Policy Presets */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-medium text-slate-500 mb-1.5">빠른 방역 시나리오 프리셋</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() =>
                onApplyPreset('무대응 방치', {
                  maskRate: 0,
                  vaccineRate: 0,
                  distancingLevel: 0,
                  isolationPolicy: 'none',
                  facilityRestriction: 'open',
                })
              }
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 text-left truncate"
            >
              무대응 자연 확산
            </button>
            <button
              type="button"
              onClick={() =>
                onApplyPreset('초기 선제 방역', {
                  maskRate: 80,
                  vaccineRate: 20,
                  distancingLevel: 2,
                  isolationPolicy: 'facility',
                  facilityRestriction: 'partial',
                })
              }
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 text-left truncate"
            >
              초기 마스크 + 격리
            </button>
            <button
              type="button"
              onClick={() =>
                onApplyPreset('백신 집중 방어', {
                  maskRate: 40,
                  vaccineRate: 75,
                  distancingLevel: 1,
                  isolationPolicy: 'home',
                  facilityRestriction: 'open',
                })
              }
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 text-left truncate"
            >
              백신 집단면역 실험
            </button>
            <button
              type="button"
              onClick={() =>
                onApplyPreset('고강도 봉쇄', {
                  maskRate: 95,
                  vaccineRate: 50,
                  distancingLevel: 3,
                  isolationPolicy: 'facility',
                  facilityRestriction: 'closed',
                })
              }
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 text-left truncate"
            >
              고강도 전면 봉쇄
            </button>
          </div>
        </div>
      </section>

      {/* 2. Interactive Public Health Policy Deck */}
      <section className="rounded-xl bg-white border border-[#DCE3EC] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">도시 방역 정책 결정</h2>
          <span className="text-[11px] text-slate-500">즉시 시민 행동에 반영</span>
        </div>

        {/* Policy 1: Mask Mandate */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="mask-slider" className="font-semibold text-slate-800">
              마스크 착용률
            </label>
            <span className="font-mono-num font-semibold text-sky-700">{policy.maskRate}%</span>
          </div>
          <input
            id="mask-slider"
            type="range"
            min={0}
            max={100}
            step={5}
            value={policy.maskRate}
            onChange={(e) => onUpdatePolicy({ maskRate: Number(e.target.value) })}
            className="w-full sim-slider"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            시민 얼굴에 마스크가 착용되며 접촉 시 전파 확률을 낮춥니다.
          </p>
        </div>

        {/* Policy 2: Vaccination Coverage */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="vaccine-slider" className="font-semibold text-slate-800 inline-flex items-center gap-1">
              <Syringe className="w-3.5 h-3.5 text-[#7C3AED]" />
              목표 백신 접종률
            </label>
            <span className="font-mono-num font-semibold text-[#7C3AED]">
              {policy.vaccineRate}% ({stats.vaccinated}명 완료)
            </span>
          </div>
          <input
            id="vaccine-slider"
            type="range"
            min={0}
            max={100}
            step={5}
            value={policy.vaccineRate}
            onChange={(e) => onUpdatePolicy({ vaccineRate: Number(e.target.value) })}
            className="w-full sim-slider"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            접종자는 감염 위험과 중증 진행 확률이 크게 감소합니다.
          </p>
        </div>

        {/* Policy 3: Social Distancing */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-600" />
              사회적 거리두기
            </span>
            <span className="font-mono-num font-medium text-slate-700">
              {['해제', '1단계 권고', '2단계 강화', '3단계 고강도'][policy.distancingLevel]}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
            {([0, 1, 2, 3] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onUpdatePolicy({ distancingLevel: lvl })}
                className={`py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  policy.distancingLevel === lvl
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl === 0 ? '해제' : `${lvl}단계`}
              </button>
            ))}
          </div>
        </div>

        {/* Policy 4: Patient Isolation */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
              감염자 격리 정책
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'none', label: '격리 없음' },
                { id: 'home', label: '자가 격리' },
                { id: 'facility', label: '병원·시설' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdatePolicy({ isolationPolicy: opt.id })}
                className={`py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  policy.isolationPolicy === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            시설 격리 시행 시 구급차가 환자를 병원으로 이송해 접촉을 차단합니다.
          </p>
        </div>

        {/* Policy 5: School & Commercial Facility Restrictions */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              학교 · 공공시설 운영
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'open', label: '정상 운영' },
                { id: 'partial', label: '부분 제한' },
                { id: 'closed', label: '전면 중단' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdatePolicy({ facilityRestriction: opt.id })}
                className={`py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  policy.facilityRestriction === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Live Epidemic Curve + Save/Analyze Actions */}
      <section className="rounded-xl bg-white border border-[#DCE3EC] p-4 space-y-3">
        <EpidemicChart
          history={history}
          totalPopulation={stats.totalPopulation}
          hospitalCapacity={stats.hospitalCapacity}
          modelType={modelType}
        />

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onSaveRun}
            className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            비교함에 결과 저장
          </button>
          <button
            type="button"
            onClick={onOpenReport}
            className="h-9 px-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            결과 분석
          </button>
        </div>
      </section>
    </aside>
  );
};
