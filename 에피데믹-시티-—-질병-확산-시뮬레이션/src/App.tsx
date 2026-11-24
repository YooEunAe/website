import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';
import { CityCanvas } from './components/CityCanvas';
import { ComparisonView } from './components/ComparisonView';
import { MissionsView } from './components/MissionsView';
import { OutcomeModal } from './components/OutcomeModal';
import { PolicyDeck } from './components/PolicyDeck';
import { SettingsAndAssetsView } from './components/SettingsAndAssetsView';
import { assetManager } from './game/assets';
import { soundFX } from './game/audio';
import {
  DEFAULT_DISEASE_PARAMS,
  DEFAULT_POLICY,
  SimulationEngine,
} from './game/engine';
import {
  CanvasTool,
  DiseaseParams,
  DiscoveryMission,
  PolicyEventLog,
  PolicySettings,
  SavedExperimentRun,
} from './game/types';

type NavTab = 'city' | 'missions' | 'compare' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('city');
  const [params, setParams] = useState<DiseaseParams>({ ...DEFAULT_DISEASE_PARAMS });
  const [policy, setPolicy] = useState<PolicySettings>({ ...DEFAULT_POLICY });

  const engineRef = useRef<SimulationEngine>(
    new SimulationEngine(DEFAULT_DISEASE_PARAMS, DEFAULT_POLICY)
  );

  const [renderTick, setRenderTick] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [activeTool, setActiveTool] = useState<CanvasTool>('inspect');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [savedRuns, setSavedRuns] = useState<SavedExperimentRun[]>([]);
  const [policyEvents, setPolicyEvents] = useState<PolicyEventLog[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const prevEndedRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  // Probe optional /public/assets files on mount
  useEffect(() => {
    assetManager.probeDefaultAssets().then(() => {
      setRenderTick((t) => t + 1);
    });
  }, []);

  // Main 60fps simulation loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const engine = engineRef.current;

      if (isRunning) {
        engine.step(dt * speed);

        // Check newly unlocked discovery missions
        for (const m of engine.missions) {
          if (m.unlocked && !prevUnlockedRef.current.has(m.id)) {
            prevUnlockedRef.current.add(m.id);
            showToast(`원리 발견 달성: ${m.title}`);
          }
        }

        // Check simulation end state
        if (engine.stats.isEnded && !prevEndedRef.current) {
          prevEndedRef.current = true;
          setIsRunning(false);
          setShowOutcomeModal(true);
        }

        setRenderTick((t) => t + 1);
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning, speed, showToast]);

  const rebuildSimulation = useCallback(
    (nextParams: DiseaseParams, nextPolicy: PolicySettings, preserveMissions = true) => {
      const existingMissions: DiscoveryMission[] | undefined = preserveMissions
        ? engineRef.current.missions
        : undefined;
      engineRef.current = new SimulationEngine(nextParams, nextPolicy, existingMissions);
      prevEndedRef.current = false;
      setParams(nextParams);
      setPolicy(nextPolicy);
      setPolicyEvents([]);
      setShowOutcomeModal(false);
      setIsRunning(false);
      setRenderTick((t) => t + 1);
    },
    []
  );

  const handleUpdatePolicy = useCallback(
    (patch: Partial<PolicySettings>) => {
      setPolicy((prev) => {
        const next = { ...prev, ...patch };
        engineRef.current.setPolicy(next);

        const day = engineRef.current.stats.day;
        const summaries: string[] = [];
        if (patch.maskRate !== undefined) summaries.push(`마스크 ${patch.maskRate}%`);
        if (patch.vaccineRate !== undefined) summaries.push(`백신 ${patch.vaccineRate}%`);
        if (patch.distancingLevel !== undefined)
          summaries.push(`거리두기 ${patch.distancingLevel}단계`);
        if (patch.isolationPolicy !== undefined)
          summaries.push(
            `격리: ${
              patch.isolationPolicy === 'none'
                ? '해제'
                : patch.isolationPolicy === 'home'
                ? '자가격리'
                : '시설격리'
            }`
          );
        if (patch.facilityRestriction !== undefined)
          summaries.push(
            `시설: ${
              patch.facilityRestriction === 'open'
                ? '정상'
                : patch.facilityRestriction === 'partial'
                ? '부분제한'
                : '전면중단'
            }`
          );

        if (summaries.length > 0) {
          setPolicyEvents((logs) => [
            ...logs,
            { day, label: '정책 조정', detail: summaries.join(', ') },
          ]);
        }

        setRenderTick((t) => t + 1);
        return next;
      });
    },
    []
  );

  const handleApplyPreset = useCallback(
    (presetName: string, nextPolicy: PolicySettings) => {
      setPolicy(nextPolicy);
      engineRef.current.setPolicy(nextPolicy);
      setPolicyEvents((logs) => [
        ...logs,
        {
          day: engineRef.current.stats.day,
          label: `프리셋 적용 (${presetName})`,
          detail: `마스크 ${nextPolicy.maskRate}% · 백신 ${nextPolicy.vaccineRate}% · 거리두기 ${nextPolicy.distancingLevel}단계`,
        },
      ]);
      setRenderTick((t) => t + 1);
      showToast(`"${presetName}" 정책이 도시에 즉시 적용되었습니다.`);
    },
    [showToast]
  );

  const handleStepDay = useCallback(() => {
    const engine = engineRef.current;
    engine.advanceSingleDay();
    for (const m of engine.missions) {
      if (m.unlocked && !prevUnlockedRef.current.has(m.id)) {
        prevUnlockedRef.current.add(m.id);
        showToast(`원리 발견 달성: ${m.title}`);
      }
    }
    if (engine.stats.isEnded && !prevEndedRef.current) {
      prevEndedRef.current = true;
      setIsRunning(false);
      setShowOutcomeModal(true);
    }
    setRenderTick((t) => t + 1);
  }, [showToast]);

  const handleSaveCurrentRun = useCallback(() => {
    const engine = engineRef.current;
    const s = engine.stats;
    const p = engine.policy;

    const runNum = savedRuns.length + 1;
    const distLabels = ['해제', '1단계', '2단계', '3단계'];
    const isoLabels = { none: '격리없음', home: '자가격리', facility: '시설격리' };
    const facLabels = { open: '정상', partial: '부분제한', closed: '전면중단' };

    const summary = `마스크 ${p.maskRate}% · 백신 ${p.vaccineRate}% · 거리두기 ${distLabels[p.distancingLevel]} · ${isoLabels[p.isolationPolicy]} · 시설 ${facLabels[p.facilityRestriction]}`;

    const newRun: SavedExperimentRun = {
      id: `run-${Date.now()}`,
      name: `실험 #${runNum} (${engine.params.modelType})`,
      savedAt: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      seed: engine.params.seed,
      modelType: engine.params.modelType,
      totalPopulation: s.totalPopulation,
      hospitalCapacity: s.hospitalCapacity,
      finalDay: s.day,
      peakInfected: s.peakInfected,
      peakInfectedDay: s.peakInfectedDay,
      cumulativeInfections: s.cumulativeInfections,
      totalDeaths: s.D,
      totalRecovered: s.R,
      healthcareOverloadDays: s.healthcareOverloadDays,
      endReason: s.endReason,
      policySummary: summary,
      history: engine.history.map((h) => ({ ...h })),
    };

    setSavedRuns((prev) => [...prev, newRun]);
    showToast(`${newRun.name} 결과가 비교함에 저장되었습니다.`);
  }, [savedRuns.length, showToast]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFX.enabled = next;
      return next;
    });
  }, []);

  const handleLaunchMission = useCallback(
    (_missionId: string, paramsPatch: Partial<DiseaseParams>, policyPatch: Partial<PolicySettings>) => {
      const nextParams = { ...params, ...paramsPatch };
      const nextPolicy = { ...DEFAULT_POLICY, ...policyPatch };
      rebuildSimulation(nextParams, nextPolicy, true);
      setActiveTab('city');
      setIsRunning(true);
      showToast('실험 조건이 설정되어 시뮬레이션이 시작되었습니다.');
    },
    [params, rebuildSimulation, showToast]
  );

  const engine = engineRef.current;
  const stats = engine.stats;
  const condMeta = assetManager.getCityConditionMeta(stats.cityCondition);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-[#DCE3EC] px-6 h-16 flex items-center justify-between gap-8 shrink-0">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('city')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          에피데믹 시티
        </button>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        <nav className="flex items-center gap-6 overflow-x-auto">
          {(
            [
              { id: 'city', label: '시뮬레이션 도시' },
              { id: 'missions', label: '원리 실험실' },
              { id: 'compare', label: `결과 비교 (${savedRuns.length})` },
              { id: 'settings', label: '질병 · 에셋 설정' },
            ] as { id: NavTab; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => {
              rebuildSimulation(params, policy, true);
              setActiveTab('city');
              showToast('도시가 초기 상태로 재설정되었습니다.');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0F172A] rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            새 실험 시작
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'city' && (
        <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* Live Epidemic & Healthcare Telemetry Strip */}
          <section className="rounded-xl bg-white border border-[#DCE3EC] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            {/* Population State Counts */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">감염가능 S</span>
                <strong className="text-sm font-mono-num text-[#2563EB]">{stats.S}</strong>
              </div>
              {params.modelType !== 'SIR' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">잠복기 E</span>
                  <strong className="text-sm font-mono-num text-[#D97706]">{stats.E}</strong>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">감염자 I</span>
                <strong className="text-sm font-mono-num text-[#DC2626]">{stats.I}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">회복자 R</span>
                <strong className="text-sm font-mono-num text-[#059669]">{stats.R}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">사망 D</span>
                <strong className="text-sm font-mono-num text-slate-700">{stats.D}</strong>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">재생산지표 Rt</span>
                <strong
                  className={`text-sm font-mono-num ${
                    stats.rt >= 1.2
                      ? 'text-[#DC2626]'
                      : stats.rt >= 1.0
                      ? 'text-[#D97706]'
                      : 'text-[#059669]'
                  }`}
                >
                  {stats.rt.toFixed(2)}
                </strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="text-slate-400">·</span>
                <span>금일 접촉 {stats.dailyContacts}회</span>
                <span className="text-slate-400">·</span>
                <span>신규 {stats.todayNewInfections}명</span>
              </div>
            </div>

            {/* Healthcare Load & City Condition */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5 text-xs">
                <HeartPulse
                  className={`w-4 h-4 shrink-0 ${
                    stats.healthcareLoadPct >= 100
                      ? 'text-[#DC2626]'
                      : stats.healthcareLoadPct >= 75
                      ? 'text-[#D97706]'
                      : 'text-[#059669]'
                  }`}
                />
                <span className="text-slate-600">의료 부담</span>
                <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      stats.healthcareLoadPct >= 100
                        ? 'bg-[#DC2626]'
                        : stats.healthcareLoadPct >= 75
                        ? 'bg-[#D97706]'
                        : 'bg-[#059669]'
                    }`}
                    style={{ width: `${Math.min(100, stats.healthcareLoadPct)}%` }}
                  />
                </div>
                <span className="font-mono-num font-semibold text-slate-900">
                  {stats.hospitalOccupied}/{stats.hospitalCapacity} ({stats.healthcareLoadPct}%)
                </span>
                {stats.healthcareLoadPct >= 100 && (
                  <span className="inline-flex items-center gap-1 text-[#DC2626] font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    병상 초과
                  </span>
                )}
              </div>

              <span className="text-slate-300 hidden md:inline">|</span>

              <div className="flex items-center gap-1.5 text-xs">
                {stats.cityCondition === 'contained' || stats.cityCondition === 'calm' ? (
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                ) : (
                  <AlertTriangle
                    className="w-4 h-4"
                    style={{ color: condMeta.accentColor }}
                  />
                )}
                <span className="font-semibold" style={{ color: condMeta.accentColor }}>
                  {condMeta.label}
                </span>
              </div>
            </div>
          </section>

          {/* Two-Zone Sandbox Stage (Interactive City Canvas + Right Policy Deck) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[600px]">
            <div className="lg:col-span-8 flex flex-col">
              <CityCanvas
                engine={engine}
                renderTick={renderTick}
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                onForceRefresh={() => setRenderTick((t) => t + 1)}
              />
            </div>

            <div className="lg:col-span-4">
              <PolicyDeck
                isRunning={isRunning}
                speed={speed}
                stats={stats}
                policy={policy}
                history={engine.history}
                modelType={params.modelType}
                seed={params.seed}
                onToggleRun={() => setIsRunning((r) => !r)}
                onChangeSpeed={setSpeed}
                onStepDay={handleStepDay}
                onReset={() => rebuildSimulation(params, policy, true)}
                onUpdatePolicy={handleUpdatePolicy}
                onApplyPreset={handleApplyPreset}
                onSaveRun={handleSaveCurrentRun}
                onOpenReport={() => setShowOutcomeModal(true)}
              />
            </div>
          </div>
        </main>
      )}

      {activeTab === 'missions' && (
        <main className="flex-1">
          <MissionsView
            missions={engine.missions}
            onLaunchMission={handleLaunchMission}
          />
        </main>
      )}

      {activeTab === 'compare' && (
        <main className="flex-1">
          <ComparisonView
            runs={savedRuns}
            onSaveCurrentRun={handleSaveCurrentRun}
            onDeleteRun={(id) =>
              setSavedRuns((prev) => prev.filter((r) => r.id !== id))
            }
            onGoToCity={() => setActiveTab('city')}
          />
        </main>
      )}

      {activeTab === 'settings' && (
        <main className="flex-1">
          <SettingsAndAssetsView
            currentParams={params}
            onApplyParams={(next) => {
              rebuildSimulation(next, policy, true);
              setActiveTab('city');
              showToast('새로운 질병 모델 조건이 도시에 적용되었습니다.');
            }}
          />
        </main>
      )}

      {/* Outcome Report Modal */}
      <OutcomeModal
        open={showOutcomeModal}
        stats={stats}
        history={engine.history}
        modelType={params.modelType}
        events={policyEvents}
        onClose={() => setShowOutcomeModal(false)}
        onSaveToComparison={() => {
          handleSaveCurrentRun();
          setShowOutcomeModal(false);
          setActiveTab('compare');
        }}
        onRestart={() => {
          rebuildSimulation(params, policy, true);
        }}
      />

      {/* Non-intrusive Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-medium shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
