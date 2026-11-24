import React, { useState } from 'react';
import { DailySnapshot, ModelType } from '../game/types';

interface EpidemicChartProps {
  history: DailySnapshot[];
  totalPopulation: number;
  hospitalCapacity: number;
  modelType: ModelType;
  height?: number;
}

export const EpidemicChart: React.FC<EpidemicChartProps> = ({
  history,
  totalPopulation,
  hospitalCapacity,
  modelType,
  height = 175,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 420;
  const padL = 34;
  const padR = 12;
  const padT = 14;
  const padB = 24;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxDays = Math.max(10, history.length - 1);
  const maxY = Math.max(10, totalPopulation);

  const xOf = (idx: number) =>
    padL + (history.length <= 1 ? 0 : (idx / Math.max(1, history.length - 1)) * innerW);
  const yOf = (val: number) => padT + innerH - (Math.min(maxY, val) / maxY) * innerH;

  const buildPath = (selector: (d: DailySnapshot) => number) => {
    if (history.length === 0) return '';
    return history
      .map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${xOf(idx).toFixed(1)} ${yOf(selector(d)).toFixed(1)}`)
      .join(' ');
  };

  const buildArea = (selector: (d: DailySnapshot) => number) => {
    if (history.length === 0) return '';
    const line = buildPath(selector);
    const lastX = xOf(history.length - 1).toFixed(1);
    const baseY = (padT + innerH).toFixed(1);
    return `${line} L ${lastX} ${baseY} L ${padL} ${baseY} Z`;
  };

  const capY = yOf(hospitalCapacity);
  const activeHover =
    hoverIdx !== null && history[hoverIdx] ? history[hoverIdx] : history[history.length - 1];

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
        <span className="font-medium text-slate-700">실시간 유행 곡선 (SIR/SEIR)</span>
        {activeHover && (
          <div className="flex items-center gap-2 font-mono-num">
            <span>{activeHover.day}일차</span>
            <span className="text-[#DC2626] font-semibold">I:{activeHover.I}</span>
            {modelType !== 'SIR' && (
              <span className="text-[#D97706] font-semibold">E:{activeHover.E}</span>
            )}
            <span className="text-[#059669] font-semibold">R:{activeHover.R}</span>
            <span className="text-slate-600">D:{activeHover.D}</span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto rounded-lg bg-[#F8FAFC] border border-slate-200/80"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          if (history.length <= 1) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * width - padL;
          const ratio = Math.max(0, Math.min(1, relX / innerW));
          const idx = Math.round(ratio * (history.length - 1));
          setHoverIdx(idx);
        }}
      >
        {/* Horizontal Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const val = Math.round(maxY * t);
          const y = yOf(val);
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text
                x={padL - 5}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="#64748B"
                fontFamily="IBM Plex Mono, monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Hospital Capacity Threshold Line (Flatten the Curve reference) */}
        <line
          x1={padL}
          y1={capY}
          x2={width - padR}
          y2={capY}
          stroke="#DC2626"
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.7"
        />
        <text
          x={width - padR - 2}
          y={Math.max(padT + 9, capY - 4)}
          textAnchor="end"
          fontSize="9"
          fontWeight="600"
          fill="#DC2626"
        >
          병상 한계 ({hospitalCapacity})
        </text>

        {/* Susceptible (S) */}
        <path
          d={buildPath((d) => d.S)}
          fill="none"
          stroke="#2563EB"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          opacity="0.65"
        />

        {/* Recovered (R) */}
        <path d={buildPath((d) => d.R)} fill="none" stroke="#059669" strokeWidth="1.8" />

        {/* Exposed (E) */}
        {modelType !== 'SIR' && (
          <path d={buildPath((d) => d.E)} fill="none" stroke="#D97706" strokeWidth="1.8" />
        )}

        {/* Infected (I) Area + Line */}
        <path d={buildArea((d) => d.I)} fill="rgba(220, 38, 38, 0.14)" />
        <path d={buildPath((d) => d.I)} fill="none" stroke="#DC2626" strokeWidth="2.3" />

        {/* Deceased (D) */}
        <path d={buildPath((d) => d.D)} fill="none" stroke="#475569" strokeWidth="1.4" />

        {/* Hover Vertical Indicator */}
        {hoverIdx !== null && history[hoverIdx] && (
          <line
            x1={xOf(hoverIdx)}
            y1={padT}
            x2={xOf(hoverIdx)}
            y2={padT + innerH}
            stroke="#0F172A"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}

        {/* X Axis Labels */}
        <text x={padL} y={height - 6} fontSize="9" fill="#64748B" fontFamily="IBM Plex Mono, monospace">
          1일
        </text>
        <text
          x={width - padR}
          y={height - 6}
          textAnchor="end"
          fontSize="9"
          fill="#64748B"
          fontFamily="IBM Plex Mono, monospace"
        >
          {history.length > 0 ? `${history[history.length - 1].day}일차` : `${maxDays}일`}
        </text>
      </svg>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-0.5 bg-[#DC2626] inline-block" /> 감염(I)
        </span>
        {modelType !== 'SIR' && (
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#D97706] inline-block" /> 잠복(E)
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-0.5 bg-[#059669] inline-block" /> 회복(R)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-0.5 border-t border-dashed border-[#2563EB] inline-block" /> 감염가능(S)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-0.5 bg-[#475569] inline-block" /> 사망(D)
        </span>
      </div>
    </div>
  );
};
