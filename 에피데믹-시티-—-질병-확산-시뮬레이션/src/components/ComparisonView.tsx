import React from 'react';
import { BarChart3, BookmarkPlus, Trash2 } from 'lucide-react';
import { SavedExperimentRun } from '../game/types';

interface ComparisonViewProps {
  runs: SavedExperimentRun[];
  onSaveCurrentRun: () => void;
  onDeleteRun: (id: string) => void;
  onGoToCity: () => void;
}

const RUN_COLORS = ['#DC2626', '#2563EB', '#059669', '#7C3AED', '#D97706'];

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  runs,
  onSaveCurrentRun,
  onDeleteRun,
  onGoToCity,
}) => {
  const maxDays = Math.max(10, ...runs.map((r) => r.history.length));
  const maxPop = Math.max(100, ...runs.map((r) => r.totalPopulation));

  const width = 760;
  const height = 240;
  const padL = 44;
  const padR = 20;
  const padT = 18;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const xOf = (dayIdx: number) => padL + (dayIdx / Math.max(1, maxDays - 1)) * innerW;
  const yOf = (val: number) => padT + innerH - (val / maxPop) * innerH;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">실험 결과 비교</h1>
          <p className="text-sm text-slate-600 mt-1">
            동일한 조건에서 정책이나 시행 시점만 바꾸어 진행한 결과를 나란히 비교해 보세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveCurrentRun}
            className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <BookmarkPlus className="w-4 h-4" />
            현재 진행 결과 추가
          </button>
          <button
            type="button"
            onClick={onGoToCity}
            className="h-10 px-4 rounded-lg bg-[#0F172A] text-white hover:bg-slate-800 text-xs font-semibold whitespace-nowrap shrink-0"
          >
            도시로 돌아가기
          </button>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-xl bg-white border border-[#DCE3EC] p-12 text-center space-y-3">
          <BarChart3 className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-base font-semibold text-slate-900">저장된 실험 기록이 없습니다</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            시뮬레이션을 진행한 뒤 우측 하단의 &ldquo;비교함에 결과 저장&rdquo; 버튼을 누르면 이곳에서 유행 곡선과 피해를 비교할 수 있습니다.
          </p>
        </div>
      ) : (
        <>
          {/* Overlaid Active Infected Curve Comparison */}
          <section className="rounded-xl bg-white border border-[#DCE3EC] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">동시 감염자 수(I) 추이 비교</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {runs.map((run, idx) => (
                  <span key={run.id} className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                    <span
                      className="w-3 h-1 rounded-full inline-block"
                      style={{ backgroundColor: RUN_COLORS[idx % RUN_COLORS.length] }}
                    />
                    {run.name}
                  </span>
                ))}
              </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-[#F8FAFC] rounded-lg border border-slate-200/80">
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const v = Math.round(maxPop * t);
                const y = yOf(v);
                return (
                  <g key={t}>
                    <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#E2E8F0" strokeWidth="1" />
                    <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#64748B" fontFamily="IBM Plex Mono, monospace">
                      {v}
                    </text>
                  </g>
                );
              })}

              {runs.map((run, idx) => {
                const color = RUN_COLORS[idx % RUN_COLORS.length];
                const dPath = run.history
                  .map(
                    (snap, sIdx) =>
                      `${sIdx === 0 ? 'M' : 'L'} ${xOf(sIdx).toFixed(1)} ${yOf(snap.I).toFixed(1)}`
                  )
                  .join(' ');
                return (
                  <path key={run.id} d={dPath} fill="none" stroke={color} strokeWidth="2.4" />
                );
              })}

              <text x={padL} y={height - 8} fontSize="10" fill="#64748B" fontFamily="IBM Plex Mono, monospace">
                1일차
              </text>
              <text x={width - padR} y={height - 8} textAnchor="end" fontSize="10" fill="#64748B" fontFamily="IBM Plex Mono, monospace">
                {maxDays}일차
              </text>
            </svg>
          </section>

          {/* Side-by-Side Comparison Table */}
          <section className="rounded-xl bg-white border border-[#DCE3EC] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-3 px-4 font-semibold">실험 이름 · 시드</th>
                    <th className="py-3 px-4 font-semibold">모델</th>
                    <th className="py-3 px-4 font-semibold text-right">진행 일수</th>
                    <th className="py-3 px-4 font-semibold text-right">최대 동시 감염</th>
                    <th className="py-3 px-4 font-semibold text-right">누적 감염자</th>
                    <th className="py-3 px-4 font-semibold text-right">사망자</th>
                    <th className="py-3 px-4 font-semibold text-right">의료 초과 일수</th>
                    <th className="py-3 px-4 font-semibold">정책 요약</th>
                    <th className="py-3 px-4 font-semibold text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.map((run, idx) => (
                    <tr key={run.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: RUN_COLORS[idx % RUN_COLORS.length] }}
                          />
                          <span>{run.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono-num mt-0.5 pl-4">
                          {run.seed} · {run.savedAt}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono-num text-slate-700">{run.modelType}</td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-900">{run.finalDay}일</td>
                      <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#DC2626]">
                        {run.peakInfected}명 ({run.peakInfectedDay}일차)
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-900">
                        {run.cumulativeInfections} / {run.totalPopulation}명
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-slate-900">
                        {run.totalDeaths}명
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num">
                        <span className={run.healthcareOverloadDays > 0 ? 'text-[#DC2626] font-semibold' : 'text-[#059669]'}>
                          {run.healthcareOverloadDays}일
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">{run.policySummary}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteRun(run.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label={`${run.name} 삭제`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
