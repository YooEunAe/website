import React from 'react';
import { CheckCircle2, Compass, FlaskConical, Play } from 'lucide-react';
import { DiseaseParams, DiscoveryMission, PolicySettings } from '../game/types';

interface MissionsViewProps {
  missions: DiscoveryMission[];
  onLaunchMission: (
    missionId: string,
    paramsPatch: Partial<DiseaseParams>,
    policyPatch: Partial<PolicySettings>
  ) => void;
}

const MISSION_LAUNCH_CONFIGS: Record<
  string,
  { params: Partial<DiseaseParams>; policy: Partial<PolicySettings>; buttonLabel: string }
> = {
  mission_unmitigated: {
    params: { modelType: 'SIR', hospitalBeds: 20, baseTransmissionProb: 0.36, seed: 'EXP-UNMITIGATED' },
    policy: {
      maskRate: 0,
      vaccineRate: 0,
      distancingLevel: 0,
      isolationPolicy: 'none',
      facilityRestriction: 'open',
    },
    buttonLabel: '무방역 실험 시작',
  },
  mission_mask_timing: {
    params: { modelType: 'SIR', hospitalBeds: 24, baseTransmissionProb: 0.36, seed: 'EXP-GOLDEN-TIME' },
    policy: {
      maskRate: 80,
      vaccineRate: 0,
      distancingLevel: 1,
      isolationPolicy: 'facility',
      facilityRestriction: 'partial',
    },
    buttonLabel: '초기 방역 실험 시작',
  },
  mission_vaccine_herd: {
    params: { modelType: 'SIR', hospitalBeds: 24, baseTransmissionProb: 0.36, seed: 'EXP-HERD-IMMUNITY' },
    policy: {
      maskRate: 20,
      vaccineRate: 75,
      distancingLevel: 0,
      isolationPolicy: 'none',
      facilityRestriction: 'open',
    },
    buttonLabel: '백신 집단면역 실험 시작',
  },
  mission_seir_latency: {
    params: {
      modelType: 'SEIR',
      incubationDays: 4,
      incubationInfectious: false,
      hospitalBeds: 24,
      seed: 'EXP-SEIR-LATENCY',
    },
    policy: {
      maskRate: 0,
      vaccineRate: 0,
      distancingLevel: 0,
      isolationPolicy: 'none',
      facilityRestriction: 'open',
    },
    buttonLabel: 'SEIR 잠복기 실험 시작',
  },
};

export const MissionsView: React.FC<MissionsViewProps> = ({ missions, onLaunchMission }) => {
  const unlockedCount = missions.filter((m) => m.unlocked).length;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">원리 발견 실험실</h1>
          <p className="text-sm text-slate-600 mt-1">
            조건을 직접 바꾸어 도시에서 실험하고, 감염병 확산과 방역의 핵심 원리를 스스로 확인해 보세요.
          </p>
        </div>
        <div className="text-sm font-mono-num text-slate-700">
          발견한 원리 <strong className="text-slate-900">{unlockedCount}</strong> / {missions.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {missions.map((mission) => {
          const cfg = MISSION_LAUNCH_CONFIGS[mission.id];
          return (
            <article
              key={mission.id}
              className="rounded-xl bg-white border border-[#DCE3EC] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    {mission.unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                    ) : (
                      <FlaskConical className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>
                      {mission.unlocked
                        ? `검증 완료 · ${mission.unlockedAtDay ?? ''}일차 달성`
                        : '미검증 실험 과제'}
                    </span>
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-900">{mission.title}</h2>
                <p className="text-sm text-slate-700 leading-relaxed">{mission.question}</p>

                <div className="rounded-lg bg-slate-50 border border-slate-200/70 p-3 text-xs text-slate-600 flex items-start gap-2">
                  <Compass className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>{mission.hint}</span>
                </div>

                {mission.unlocked ? (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-950 leading-relaxed">
                    <div className="font-semibold text-emerald-800 mb-1">발견된 감염병 원리</div>
                    {mission.principle}
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-100/80 p-3.5 text-xs text-slate-500">
                    시뮬레이션에서 위 조건을 직접 달성하면 핵심 원리 노트가 해금됩니다.
                  </div>
                )}
              </div>

              {cfg && (
                <button
                  type="button"
                  onClick={() => onLaunchMission(mission.id, cfg.params, cfg.policy)}
                  className="h-10 px-4 rounded-lg bg-[#0F172A] text-white hover:bg-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  {cfg.buttonLabel}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
