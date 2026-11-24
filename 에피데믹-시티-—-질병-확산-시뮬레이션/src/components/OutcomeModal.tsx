import React from 'react';
import { BookmarkPlus, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { DailySnapshot, ModelType, PolicyEventLog, SimulationStats } from '../game/types';
import { EpidemicChart } from './EpidemicChart';

interface OutcomeModalProps {
  open: boolean;
  stats: SimulationStats;
  history: DailySnapshot[];
  modelType: ModelType;
  events: PolicyEventLog[];
  onClose: () => void;
  onSaveToComparison: () => void;
  onRestart: () => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  open,
  stats,
  history,
  modelType,
  events,
  onClose,
  onSaveToComparison,
  onRestart,
}) => {
  if (!open) return null;

  const attackRatePct = Math.round(
    (stats.cumulativeInfections / Math.max(1, stats.totalPopulation)) * 100
  );
  const survivalRatePct = Math.round(
    (stats.totalAlive / Math.max(1, stats.totalPopulation)) * 100
  );

  const title =
    stats.endReason === 'contained'
      ? '감염병 유행 종식 · 결과 분석'
      : stats.endReason === 'collapse'
      ? '시뮬레이션 종료 · 도시 위기 분석'
      : `현재 시점 (${stats.day}일차) 중간 분석`;

  const insight =
    stats.healthcareOverloadDays > 0
      ? `시립병원 병상(${stats.hospitalCapacity}개)이 총 ${stats.healthcareOverloadDays}일 동안 초과 가동되어, 적시에 치료받지 못한 중증 환자의 사망 위험이 높아졌습니다.`
      : stats.peakInfected <= stats.hospitalCapacity
      ? `최대 동시 감염자(${stats.peakInfected}명)가 병원 수용 범위 이내로 관리되어 의료 붕괴 없이 위기를 넘겼습니다.`
      : `감염이 빠르게 확산되었으나 방역 조치와 회복자 증가로 점차 진정 국면에 진입했습니다.`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {stats.endReason === 'contained' && (
              <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
            )}
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="분석 창 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* 4 Key Result Figures */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCell label="누적 감염률" value={`${attackRatePct}%`} sub={`${stats.cumulativeInfections}명 감염`} />
            <StatCell label="최대 동시 감염" value={`${stats.peakInfected}명`} sub={`${stats.peakInfectedDay}일차 정점`} accent="text-[#DC2626]" />
            <StatCell label="의료 초과 일수" value={`${stats.healthcareOverloadDays}일`} sub={`병상 ${stats.hospitalCapacity}개`} accent={stats.healthcareOverloadDays > 0 ? 'text-[#DC2626]' : 'text-[#059669]'} />
            <StatCell label="생존 · 사망" value={`${survivalRatePct}%`} sub={`사망 ${stats.D}명`} />
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-700 leading-relaxed">
            <div className="font-semibold text-slate-900 mb-1">핵심 인과 분석</div>
            {insight}
          </div>

          <EpidemicChart
            history={history}
            totalPopulation={stats.totalPopulation}
            hospitalCapacity={stats.hospitalCapacity}
            modelType={modelType}
            height={190}
          />

          {events.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-2">시행한 방역 정책 타임라인</div>
              <div className="max-h-32 overflow-y-auto space-y-1.5 text-xs">
                {events.map((ev, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-600">
                    <span className="font-mono-num font-semibold text-slate-900 w-12 shrink-0">
                      {ev.day}일차
                    </span>
                    <span className="font-medium text-slate-800">{ev.label}</span>
                    <span className="text-slate-400">·</span>
                    <span className="truncate">{ev.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSaveToComparison}
            className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <BookmarkPlus className="w-4 h-4" />
            비교함에 저장
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="h-10 px-4 rounded-lg bg-[#0F172A] text-white hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            조건 바꿔 재실험
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCell: React.FC<{
  label: string;
  value: string;
  sub: string;
  accent?: string;
}> = ({ label, value, sub, accent = 'text-slate-900' }) => (
  <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-3">
    <div className="text-[11px] text-slate-500">{label}</div>
    <div className={`text-lg font-bold font-mono-num mt-0.5 ${accent}`}>{value}</div>
    <div className="text-[11px] text-slate-500 font-mono-num mt-0.5">{sub}</div>
  </div>
);
