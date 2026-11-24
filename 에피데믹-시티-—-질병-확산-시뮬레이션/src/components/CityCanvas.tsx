import React, { useEffect, useRef, useState } from 'react';
import {
  Crosshair,
  Eye,
  HeartPulse,
  MapPin,
  Maximize2,
  Shield,
  Syringe,
  UserCheck,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { assetManager } from '../game/assets';
import { CITY_ZONES, SimulationEngine, WORLD_HEIGHT, WORLD_WIDTH } from '../game/engine';
import { CanvasTool, Citizen, Vehicle } from '../game/types';

interface CityCanvasProps {
  engine: SimulationEngine;
  renderTick: number;
  activeTool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onForceRefresh: () => void;
}

const STATE_META: Record<
  Citizen['state'],
  { label: string; color: string; bg: string; shapeHint: string }
> = {
  S: { label: '감염 가능자 (S)', color: '#2563EB', bg: 'bg-blue-50 text-blue-700', shapeHint: '원형' },
  E: { label: '잠복기 (E)', color: '#D97706', bg: 'bg-amber-50 text-amber-800', shapeHint: '점선 마름모' },
  I: { label: '감염자 (I)', color: '#DC2626', bg: 'bg-red-50 text-red-700', shapeHint: '스파이크 파동' },
  R: { label: '회복자 (R)', color: '#059669', bg: 'bg-emerald-50 text-emerald-700', shapeHint: '회복 링' },
  D: { label: '사망 (D)', color: '#475569', bg: 'bg-slate-100 text-slate-700', shapeHint: '종료' },
};

const ACTIVITY_LABEL: Record<Citizen['activity'], string> = {
  home: '자택 체류',
  commute: '이동 중',
  school: '등교 · 수업',
  work: '출근 · 업무',
  shopping: '상점 방문',
  park: '공원 산책',
  hospital: '병원 입원 · 근무',
  quarantine: '자가 격리 중',
};

const ROLE_LABEL: Record<Citizen['traits']['role'], string> = {
  student: '학생',
  worker: '직장인',
  resident: '일반 시민',
  medic: '의료진',
};

export const CityCanvas: React.FC<CityCanvasProps> = ({
  engine,
  renderTick,
  activeTool,
  onSelectTool,
  soundEnabled,
  onToggleSound,
  onForceRefresh,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showZoneLabels, setShowZoneLabels] = useState(true);
  const [selectedCitizenId, setSelectedCitizenId] = useState<number | null>(null);
  const [hoveredCitizenId, setHoveredCitizenId] = useState<number | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, moved: false });

  const selectedCitizen =
    selectedCitizenId !== null
      ? engine.citizens.find((c) => c.id === selectedCitizenId) ?? null
      : null;

  // Screen to world coordinates
  const screenToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;

    const scaleX = rect.width / WORLD_WIDTH;
    const scaleY = rect.height / WORLD_HEIGHT;
    const baseScale = Math.min(scaleX, scaleY);
    const totalScale = baseScale * zoom;

    const offsetX = (rect.width - WORLD_WIDTH * totalScale) * 0.5 + pan.x;
    const offsetY = (rect.height - WORLD_HEIGHT * totalScale) * 0.5 + pan.y;

    return {
      x: (cx - offsetX) / totalScale,
      y: (cy - offsetY) / totalScale,
    };
  };

  // Draw the entire interactive city frame
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear outer backdrop
    ctx.fillStyle = '#E6ECF2';
    ctx.fillRect(0, 0, width, height);

    const baseScale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    const totalScale = baseScale * zoom;
    const offsetX = (width - WORLD_WIDTH * totalScale) * 0.5 + pan.x;
    const offsetY = (height - WORLD_HEIGHT * totalScale) * 0.5 + pan.y;

    ctx.translate(offsetX, offsetY);
    ctx.scale(totalScale, totalScale);

    // 1. Base City Terrain or Custom Background Image
    const bgImg = assetManager.getImage('city_background');
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    } else {
      ctx.fillStyle = '#EEF2F6';
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    // 2. Road Network (Avenues + Crosswalks)
    drawRoads(ctx);

    // 3. Districts & Buildings
    drawDistricts(ctx, engine, showZoneLabels);

    // 4. Ambient Time-of-Day & Outbreak Atmosphere Tint
    const dayProg = engine.stats.dayProgress;
    if (dayProg > 0.72) {
      const duskAlpha = Math.min(0.14, (dayProg - 0.72) * 0.5);
      ctx.fillStyle = `rgba(15, 23, 42, ${duskAlpha})`;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }
    const condMeta = assetManager.getCityConditionMeta(engine.stats.cityCondition);
    if (condMeta.ambientTint !== 'rgba(241, 245, 249, 0)') {
      ctx.fillStyle = condMeta.ambientTint;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    // 5. Contact Lines & Visual Effects (under citizens)
    drawEffectsUnderlay(ctx, engine);

    // 6. Citizens
    const nowSec = performance.now() * 0.001;
    for (const c of engine.citizens) {
      if (c.state === 'D') continue;
      if (c.inTransit) continue;
      const isSelected = c.id === selectedCitizenId;
      const isHovered = c.id === hoveredCitizenId;
      drawCitizen(ctx, c, nowSec, isSelected, isHovered);
    }

    // 7. Vehicles (Transit Buses & Ambulances)
    for (const v of engine.vehicles) {
      drawVehicle(ctx, v, nowSec);
    }

    // 8. Foreground Transmission Arcs & Particle Bursts
    drawEffectsOverlay(ctx, engine);

    ctx.restore();
  }, [engine, renderTick, zoom, pan, showZoneLabels, selectedCitizenId, hoveredCitizenId]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((z) => Math.max(0.75, Math.min(2.6, Number((z + delta).toFixed(2)))));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        dragStartRef.current.moved = true;
        setPan({
          x: dragStartRef.current.panX + dx,
          y: dragStartRef.current.panY + dy,
        });
      }
      return;
    }

    const pt = screenToWorld(e.clientX, e.clientY);
    const hovered = engine.findCitizenAt(pt.x, pt.y);
    setHoveredCitizenId(hovered ? hovered.id : null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wasMoved = dragStartRef.current.moved;
    isDraggingRef.current = false;
    if (wasMoved) return;

    const pt = screenToWorld(e.clientX, e.clientY);

    if (activeTool === 'infect') {
      const target = engine.infectNearestCitizen(pt.x, pt.y);
      if (target) {
        setSelectedCitizenId(target.id);
        onForceRefresh();
      }
      return;
    }

    if (activeTool === 'vaccinate') {
      const target = engine.vaccinateNearestCitizen(pt.x, pt.y);
      if (target) {
        setSelectedCitizenId(target.id);
        onForceRefresh();
      }
      return;
    }

    const clicked = engine.findCitizenAt(pt.x, pt.y);
    setSelectedCitizenId(clicked ? clicked.id : null);
  };

  const resetCamera = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const cursorClass =
    activeTool === 'infect' || activeTool === 'vaccinate'
      ? 'cursor-crosshair'
      : hoveredCitizenId !== null
      ? 'cursor-pointer'
      : 'cursor-grab active:cursor-grabbing';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-[#DCE3EC] bg-[#E6ECF2]"
    >
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          isDraggingRef.current = false;
          setHoveredCitizenId(null);
        }}
        className={`w-full h-full block touch-none ${cursorClass}`}
      />

      {/* Top-Left Compact Legend & State Guide (color-blind friendly shapes + text) */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 rounded-lg bg-white/92 backdrop-blur-sm border border-slate-200/90 text-xs text-slate-700 shadow-xs pointer-events-none">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] inline-block" />
          감염 가능(S)
        </span>
        {engine.params.modelType !== 'SIR' && (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rotate-45 border-2 border-[#D97706] bg-amber-100 inline-block" />
            잠복기(E)
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] ring-2 ring-red-200 inline-block" />
          감염자(I)
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] ring-1 ring-emerald-700 inline-block" />
          회복자(R)
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-[#7C3AED] bg-white inline-block" />
          백신 면역
        </span>
      </div>

      {/* Top-Right Camera & Audio Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowZoneLabels((v) => !v)}
          className={`h-9 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            showZoneLabels
              ? 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              : 'bg-slate-800 text-white border-slate-800'
          }`}
          title="구역 이름 표시 토글"
        >
          <MapPin className="w-3.5 h-3.5" />
          구역명
        </button>
        <button
          type="button"
          onClick={onToggleSound}
          className="h-9 w-9 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center transition-colors"
          title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
          aria-label={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>
        <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.2).toFixed(2))))}
            className="h-9 w-9 inline-flex items-center justify-center text-slate-700 hover:bg-slate-50 border-r border-slate-200"
            title="축소"
            aria-label="지도 축소"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetCamera}
            className="h-9 px-2 text-xs font-mono-num text-slate-600 hover:bg-slate-50 border-r border-slate-200"
            title="화면 맞춤"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.6, Number((z + 0.2).toFixed(2))))}
            className="h-9 w-9 inline-flex items-center justify-center text-slate-700 hover:bg-slate-50"
            title="확대"
            aria-label="지도 확대"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
          <button
            type="button"
            onClick={resetCamera}
            className="h-9 w-9 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center"
            title="기본 시점으로 복귀"
            aria-label="기본 시점으로 복귀"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom-Center Interactive Field Action Tools */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => onSelectTool('inspect')}
          className={`h-9 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeTool === 'inspect'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          시민 관찰
        </button>
        <button
          type="button"
          onClick={() => onSelectTool('infect')}
          className={`h-9 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeTool === 'infect'
              ? 'bg-[#DC2626] text-white'
              : 'text-slate-600 hover:bg-red-50 hover:text-[#DC2626]'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          클릭 감염원 투입
        </button>
        <button
          type="button"
          onClick={() => onSelectTool('vaccinate')}
          className={`h-9 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeTool === 'vaccinate'
              ? 'bg-[#7C3AED] text-white'
              : 'text-slate-600 hover:bg-violet-50 hover:text-[#7C3AED]'
          }`}
        >
          <Syringe className="w-3.5 h-3.5" />
          개별 백신 접종
        </button>
      </div>

      {/* Selected Citizen Inspector Popover */}
      {selectedCitizen && (
        <div className="absolute bottom-16 left-3 w-72 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md p-3.5 text-xs">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">
                  {selectedCitizen.name}
                </span>
                <span className="text-slate-500">· {ROLE_LABEL[selectedCitizen.traits.role]}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>ID #{selectedCitizen.id}</span>
                <span>·</span>
                <span>{ACTIVITY_LABEL[selectedCitizen.activity]}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCitizenId(null)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded"
              aria-label="시민 정보 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">감염 상태</span>
              <span className={`font-semibold px-2 py-0.5 rounded ${STATE_META[selectedCitizen.state].bg}`}>
                {STATE_META[selectedCitizen.state].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Shield className={`w-3.5 h-3.5 ${selectedCitizen.maskWearing ? 'text-sky-600' : 'text-slate-300'}`} />
                <span>마스크: {selectedCitizen.maskWearing ? '착용 중' : '미착용'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Syringe className={`w-3.5 h-3.5 ${selectedCitizen.vaccinated ? 'text-violet-600' : 'text-slate-300'}`} />
                <span>백신: {selectedCitizen.vaccinated ? '접종 완료' : '미접종'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <UserCheck className={`w-3.5 h-3.5 ${selectedCitizen.isolated ? 'text-amber-600' : 'text-slate-300'}`} />
                <span>격리: {selectedCitizen.hospitalized ? '병원 입원' : selectedCitizen.isolated ? '격리 중' : '자유 이동'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <HeartPulse className={`w-3.5 h-3.5 ${selectedCitizen.severe ? 'text-red-600' : 'text-slate-300'}`} />
                <span>증상: {selectedCitizen.state === 'I' ? (selectedCitizen.severe ? '중증' : '경증') : '해당 없음'}</span>
              </div>
            </div>

            {selectedCitizen.state === 'E' && (
              <div className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded">
                잠복기 잔여: <strong className="font-mono-num">{selectedCitizen.exposedDaysLeft}일</strong> 후 전염성 발현
              </div>
            )}
            {selectedCitizen.state === 'I' && (
              <div className="text-[11px] text-red-700 bg-red-50 px-2.5 py-1.5 rounded">
                회복까지 잔여: <strong className="font-mono-num">{selectedCitizen.infectiousDaysLeft}일</strong>
              </div>
            )}
          </div>

          {selectedCitizen.state === 'S' && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  engine.vaccinateNearestCitizen(selectedCitizen.x, selectedCitizen.y);
                  onForceRefresh();
                }}
                disabled={selectedCitizen.vaccinated}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-40 font-medium transition-colors"
              >
                백신 접종하기
              </button>
              <button
                type="button"
                onClick={() => {
                  engine.infectNearestCitizen(selectedCitizen.x, selectedCitizen.y);
                  onForceRefresh();
                }}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
              >
                감염원으로 지정
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------- Canvas Procedural Drawing Helpers ----------------

function drawRoads(ctx: CanvasRenderingContext2D) {
  // Main avenues separating the 6 city districts
  ctx.fillStyle = '#CBD5E1';
  // Horizontal main avenue
  ctx.fillRect(20, 345, WORLD_WIDTH - 40, 44);
  // Vertical avenues
  ctx.fillRect(380, 20, 44, WORLD_HEIGHT - 40);
  ctx.fillRect(770, 20, 44, WORLD_HEIGHT - 40);

  // Inner asphalt road surface
  ctx.fillStyle = '#64748B';
  ctx.fillRect(24, 350, WORLD_WIDTH - 48, 34);
  ctx.fillRect(385, 24, 34, WORLD_HEIGHT - 48);
  ctx.fillRect(775, 24, 34, WORLD_HEIGHT - 48);

  // Dashed lane lines
  ctx.save();
  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([12, 10]);

  ctx.beginPath();
  ctx.moveTo(28, 367);
  ctx.lineTo(WORLD_WIDTH - 28, 367);
  ctx.moveTo(402, 28);
  ctx.lineTo(402, WORLD_HEIGHT - 28);
  ctx.moveTo(792, 28);
  ctx.lineTo(792, WORLD_HEIGHT - 28);
  ctx.stroke();
  ctx.restore();

  // Crosswalks at intersections
  ctx.fillStyle = '#F1F5F9';
  const intersections = [
    { x: 402, y: 367 },
    { x: 792, y: 367 },
  ];
  for (const inter of intersections) {
    for (let s = -12; s <= 12; s += 6) {
      ctx.fillRect(inter.x - 26, inter.y + s - 1.5, 7, 3);
      ctx.fillRect(inter.x + 19, inter.y + s - 1.5, 7, 3);
      ctx.fillRect(inter.x + s - 1.5, inter.y - 26, 3, 7);
      ctx.fillRect(inter.x + s - 1.5, inter.y + 19, 3, 7);
    }
  }
}

function drawDistricts(
  ctx: CanvasRenderingContext2D,
  engine: SimulationEngine,
  showLabels: boolean
) {
  const restriction = engine.policy.facilityRestriction;
  const isNight = engine.stats.dayProgress > 0.72;

  for (const z of CITY_ZONES) {
    ctx.save();

    // Base district pad
    ctx.fillStyle = z.color;
    ctx.strokeStyle = z.borderColor;
    ctx.lineWidth = 2;
    roundRect(ctx, z.x, z.y, z.w, z.h, 14);
    ctx.fill();
    ctx.stroke();

    // District-specific architectural details
    if (z.kind === 'residential') {
      const blocks = [
        { bx: z.x + 26, by: z.y + 44, bw: 76, bh: 54 },
        { bx: z.x + 124, by: z.y + 44, bw: 76, bh: 54 },
        { bx: z.x + 220, by: z.y + 44, bw: 76, bh: 54 },
        { bx: z.x + 26, by: z.y + 145, bw: 86, bh: 64 },
        { bx: z.x + 140, by: z.y + 145, bw: 86, bh: 64 },
      ];
      for (const b of blocks) {
        if (b.bx + b.bw > z.x + z.w - 14 || b.by + b.bh > z.y + z.h - 14) continue;
        // Shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
        roundRect(ctx, b.bx + 4, b.by + 5, b.bw, b.bh, 6);
        ctx.fill();
        // Building roof
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.2;
        roundRect(ctx, b.bx, b.by, b.bw, b.bh, 6);
        ctx.fill();
        ctx.stroke();
        // Windows
        for (let wx = b.bx + 10; wx < b.bx + b.bw - 14; wx += 18) {
          for (let wy = b.by + 12; wy < b.by + b.bh - 14; wy += 18) {
            ctx.fillStyle = isNight ? '#FDE047' : '#CBD5E1';
            ctx.fillRect(wx, wy, 9, 9);
          }
        }
      }
    } else if (z.kind === 'school') {
      // Main school campus building
      ctx.fillStyle = 'rgba(15, 23, 42, 0.07)';
      roundRect(ctx, z.x + 34, z.y + 52, 240, 74, 8);
      ctx.fill();

      ctx.fillStyle = restriction === 'closed' ? '#E2E8F0' : '#FFFFFF';
      ctx.strokeStyle = '#818CF8';
      ctx.lineWidth = 1.6;
      roundRect(ctx, z.x + 30, z.y + 48, 240, 74, 8);
      ctx.fill();
      ctx.stroke();

      // Athletic track oval
      ctx.strokeStyle = '#FCA5A5';
      ctx.lineWidth = 12;
      roundRect(ctx, z.x + 56, z.y + 148, 194, 82, 40);
      ctx.stroke();
      ctx.fillStyle = '#BBF7D0';
      roundRect(ctx, z.x + 62, z.y + 154, 182, 70, 34);
      ctx.fill();

      if (restriction !== 'open') {
        ctx.fillStyle = restriction === 'closed' ? 'rgba(220,38,38,0.14)' : 'rgba(217,119,6,0.12)';
        roundRect(ctx, z.x, z.y, z.w, z.h, 14);
        ctx.fill();
      }
    } else if (z.kind === 'commercial') {
      // Market & Office Towers
      const stores = [
        { sx: z.x + 26, sy: z.y + 48, sw: 120, sh: 86, roof: '#F59E0B' },
        { sx: z.x + 174, sy: z.y + 48, sw: 126, sh: 86, roof: '#0EA5E9' },
        { sx: z.x + 26, sy: z.y + 162, sw: 274, sh: 102, roof: '#334155' },
      ];
      for (const s of stores) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
        roundRect(ctx, s.sx + 4, s.sy + 5, s.sw, s.sh, 8);
        ctx.fill();
        ctx.fillStyle = restriction === 'closed' ? '#E2E8F0' : '#FFFFFF';
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1.5;
        roundRect(ctx, s.sx, s.sy, s.sw, s.sh, 8);
        ctx.fill();
        ctx.stroke();
        // Awning / Roof accent
        ctx.fillStyle = restriction === 'closed' ? '#94A3B8' : s.roof;
        roundRect(ctx, s.sx + 8, s.sy + 8, s.sw - 16, 14, 4);
        ctx.fill();
      }
    } else if (z.kind === 'park') {
      // Park winding path & pond
      ctx.strokeStyle = '#F5EFE6';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(z.x + 30, z.y + 260);
      ctx.quadraticCurveTo(z.x + 160, z.y + 170, z.x + 285, z.y + 60);
      ctx.stroke();

      // Pond
      ctx.fillStyle = '#BAE6FD';
      ctx.strokeStyle = '#7DD3FC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(z.x + 195, z.y + 195, 58, 38, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Trees
      const trees = [
        [68, 78],
        [140, 66],
        [246, 86],
        [82, 165],
        [262, 250],
        [95, 260],
      ];
      for (const [tx, ty] of trees) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
        ctx.beginPath();
        ctx.arc(z.x + tx + 3, z.y + ty + 4, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4ADE80';
        ctx.beginPath();
        ctx.arc(z.x + tx, z.y + ty, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.arc(z.x + tx - 4, z.y + ty - 4, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (z.kind === 'hospital') {
      const hospImg = assetManager.getImage('building_hospital');
      if (hospImg) {
        ctx.drawImage(hospImg, z.x + 24, z.y + 44, z.w - 48, z.h - 86);
      } else {
        // Main hospital building
        ctx.fillStyle = 'rgba(15, 23, 42, 0.09)';
        roundRect(ctx, z.x + 28, z.y + 52, 256, 198, 10);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = engine.stats.healthcareLoadPct >= 100 ? '#DC2626' : '#EF4444';
        ctx.lineWidth = engine.stats.healthcareLoadPct >= 100 ? 3 : 2;
        roundRect(ctx, z.x + 24, z.y + 48, 256, 198, 10);
        ctx.fill();
        ctx.stroke();

        // Red Cross Emblem
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(z.x + 144, z.y + 64, 16, 44);
        ctx.fillRect(z.x + 130, z.y + 78, 44, 16);

        // Helipad circle
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(z.x + 68, z.y + 88, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#64748B';
        ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('H', z.x + 68, z.y + 93);
      }

      // Live Hospital Bed Occupancy Bar on the building facade
      const occ = engine.stats.hospitalOccupied;
      const cap = Math.max(1, engine.stats.hospitalCapacity);
      const ratio = Math.min(1, occ / cap);
      const barX = z.x + 36;
      const barY = z.y + 266;
      const barW = z.w - 72;

      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, barX - 6, barY - 18, barW + 12, 40, 8);
      ctx.fill();

      ctx.fillStyle = '#1E293B';
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`병상 가동 ${occ}/${cap}`, barX, barY - 4);

      ctx.textAlign = 'right';
      ctx.fillStyle =
        engine.stats.healthcareLoadPct >= 100
          ? '#DC2626'
          : engine.stats.healthcareLoadPct >= 75
          ? '#D97706'
          : '#059669';
      ctx.fillText(
        engine.stats.healthcareLoadPct >= 100
          ? '수용 초과!'
          : `${engine.stats.healthcareLoadPct}%`,
        barX + barW,
        barY - 4
      );

      ctx.fillStyle = '#E2E8F0';
      roundRect(ctx, barX, barY + 4, barW, 9, 4);
      ctx.fill();
      ctx.fillStyle =
        engine.stats.healthcareLoadPct >= 100
          ? '#DC2626'
          : engine.stats.healthcareLoadPct >= 75
          ? '#D97706'
          : '#059669';
      roundRect(ctx, barX, barY + 4, Math.max(4, barW * ratio), 9, 4);
      ctx.fill();
    }

    // District Header Label
    if (showLabels) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      roundRect(ctx, z.x + 12, z.y + 10, 174, 26, 6);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.font = '700 12px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(z.name, z.x + 20, z.y + 27);

      if (
        (z.kind === 'school' || z.kind === 'commercial') &&
        restriction !== 'open'
      ) {
        ctx.fillStyle = restriction === 'closed' ? '#DC2626' : '#D97706';
        ctx.font = '700 11px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
          restriction === 'closed' ? '운영 중단' : '부분 제한',
          z.x + z.w - 14,
          z.y + 27
        );
      }
    }

    ctx.restore();
  }
}

function drawCitizen(
  ctx: CanvasRenderingContext2D,
  c: Citizen,
  nowSec: number,
  isSelected: boolean,
  isHovered: boolean
) {
  ctx.save();
  ctx.translate(c.x, c.y);

  // Selection / Hover highlight
  if (isSelected || isHovered) {
    ctx.strokeStyle = isSelected ? '#0F172A' : '#64748B';
    ctx.lineWidth = isSelected ? 2.4 : 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Infection aura / shape accessibility cues
  if (c.state === 'I') {
    const pulse = 1 + Math.sin(nowSec * 6 + c.id) * 0.14;
    ctx.fillStyle = 'rgba(220, 38, 38, 0.14)';
    ctx.beginPath();
    ctx.arc(0, 0, 12.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Virus spike outline
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 1.4;
    for (let a = 0; a < 6; a++) {
      const ang = (a * Math.PI) / 3 + nowSec * 1.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 7.5, Math.sin(ang) * 7.5);
      ctx.lineTo(Math.cos(ang) * 11, Math.sin(ang) * 11);
      ctx.stroke();
    }
  } else if (c.state === 'E') {
    // Exposed: Amber rotating dashed diamond
    ctx.save();
    ctx.rotate(Math.PI / 4 + nowSec * 0.8);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.restore();
  } else if (c.state === 'R') {
    // Recovered: Emerald outer ring
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Vaccinated purple shield ring
  if (c.vaccinated) {
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Check custom character sprite override
  const customKey =
    c.traits.role === 'medic'
      ? 'citizen_medic'
      : c.state === 'S'
      ? 'citizen_susceptible'
      : c.state === 'E'
      ? 'citizen_exposed'
      : c.state === 'I'
      ? 'citizen_infected'
      : 'citizen_recovered';
  const spriteImg = assetManager.getImage(customKey);

  if (spriteImg) {
    ctx.drawImage(spriteImg, -10, -10, 20, 20);
  } else {
    // Drop shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
    ctx.beginPath();
    ctx.ellipse(0, 6.5, 5.5, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyColor =
      c.state === 'S'
        ? '#2563EB'
        : c.state === 'E'
        ? '#D97706'
        : c.state === 'I'
        ? '#DC2626'
        : '#059669';

    // Character torso & head
    ctx.fillStyle = c.traits.role === 'medic' ? '#FFFFFF' : bodyColor;
    ctx.strokeStyle = c.traits.role === 'medic' ? '#0F172A' : '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 6.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Role medic cross
    if (c.traits.role === 'medic') {
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-1.2, -3.5, 2.4, 7);
      ctx.fillRect(-3.5, -1.2, 7, 2.4);
    }

    // Mask overlay on citizen face
    if (c.maskWearing) {
      const maskImg = assetManager.getImage('mask_overlay');
      if (maskImg) {
        ctx.drawImage(maskImg, -5, -1, 10, 6);
      } else {
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#0284C7';
        ctx.lineWidth = 0.8;
        roundRect(ctx, -4.4, 0.4, 8.8, 4.2, 1.5);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  // Newly infected flash
  if (c.infectionFlash > 0) {
    ctx.strokeStyle = `rgba(220, 38, 38, ${c.infectionFlash})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 9 + (1 - c.infectionFlash) * 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawVehicle(ctx: CanvasRenderingContext2D, v: Vehicle, nowSec: number) {
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.rotate(v.angle);

  if (v.kind === 'bus') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    roundRect(ctx, -14, -7, 30, 16, 4);
    ctx.fill();

    ctx.fillStyle = '#0284C7';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    roundRect(ctx, -15, -8, 30, 16, 4);
    ctx.fill();
    ctx.stroke();

    // Bus windows
    ctx.fillStyle = '#E0F2FE';
    ctx.fillRect(-10, -5, 18, 10);
  } else if (v.kind === 'ambulance') {
    const ambImg = assetManager.getImage('ambulance_sprite');
    if (ambImg) {
      ctx.drawImage(ambImg, -16, -10, 32, 20);
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      roundRect(ctx, -13, -7, 28, 16, 4);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 1.6;
      roundRect(ctx, -14, -8, 28, 16, 4);
      ctx.fill();
      ctx.stroke();

      // Red stripe + flashing beacon
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-10, -1.5, 16, 3);
      const flash = Math.sin(nowSec * 16) > 0;
      ctx.fillStyle = flash ? '#EF4444' : '#3B82F6';
      ctx.beginPath();
      ctx.arc(4, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawEffectsUnderlay(ctx: CanvasRenderingContext2D, engine: SimulationEngine) {
  // Active contact highlight beams
  for (const c of engine.citizens) {
    if (c.lastContactTimer > 0 && c.lastContactId !== null) {
      const other = engine.citizens.find((o) => o.id === c.lastContactId);
      if (other && other.state !== 'D') {
        ctx.save();
        ctx.strokeStyle = `rgba(220, 38, 38, ${c.lastContactTimer * 0.45})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function drawEffectsOverlay(ctx: CanvasRenderingContext2D, engine: SimulationEngine) {
  const virusImg = assetManager.getImage('virus_particle');

  for (const e of engine.effects) {
    const alpha = Math.max(0, 1 - e.progress);
    ctx.save();

    if (e.kind === 'transmission_arc' && e.x2 !== undefined && e.y2 !== undefined) {
      ctx.strokeStyle = e.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(e.x1, e.y1);
      const mx = (e.x1 + e.x2) * 0.5;
      const my = (e.y1 + e.y2) * 0.5 - 16;
      ctx.quadraticCurveTo(mx, my, e.x2, e.y2);
      ctx.stroke();

      // Traveling virus particle along arc
      const t = e.progress;
      const px = (1 - t) * (1 - t) * e.x1 + 2 * (1 - t) * t * mx + t * t * e.x2;
      const py = (1 - t) * (1 - t) * e.y1 + 2 * (1 - t) * t * my + t * t * e.y2;
      if (virusImg) {
        ctx.drawImage(virusImg, px - 7, py - 7, 14, 14);
      } else {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (e.kind === 'infection_wave') {
      ctx.strokeStyle = e.color;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x1, e.y1, 8 + e.progress * 26, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.kind === 'vaccine_pulse') {
      ctx.strokeStyle = '#7C3AED';
      ctx.globalAlpha = alpha * 0.9;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(e.x1, e.y1, 7 + e.progress * 20, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.kind === 'recovery_spark') {
      ctx.strokeStyle = '#059669';
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x1, e.y1, 6 + e.progress * 18, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.kind === 'contact_ring') {
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(e.x1, e.y1, 4 + e.progress * 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
