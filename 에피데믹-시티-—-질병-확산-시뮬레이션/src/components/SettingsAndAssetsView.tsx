import React, { useState } from 'react';
import { Dices, Image as ImageIcon, Play, RotateCcw, Upload } from 'lucide-react';
import { assetManager, AssetSlot } from '../game/assets';
import { DEFAULT_DISEASE_PARAMS } from '../game/engine';
import { DiseaseParams, ModelType } from '../game/types';

interface SettingsAndAssetsViewProps {
  currentParams: DiseaseParams;
  onApplyParams: (next: DiseaseParams) => void;
}

export const SettingsAndAssetsView: React.FC<SettingsAndAssetsViewProps> = ({
  currentParams,
  onApplyParams,
}) => {
  const [draft, setDraft] = useState<DiseaseParams>({ ...currentParams });
  const [slots, setSlots] = useState<AssetSlot[]>(() => assetManager.slots.map((s) => ({ ...s })));
  const [assetTick, setAssetTick] = useState(0);

  const generateRandomSeed = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    setDraft((prev) => ({ ...prev, seed: `CITY-${code}` }));
  };

  const handleUploadAsset = (slotKey: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      if (dataUrl) {
        await assetManager.setCustomAsset(slotKey, dataUrl);
        setSlots(assetManager.slots.map((s) => ({ ...s })));
        setAssetTick((t) => t + 1);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetAsset = async (slotKey: string) => {
    await assetManager.setCustomAsset(slotKey, null);
    setSlots(assetManager.slots.map((s) => ({ ...s })));
    setAssetTick((t) => t + 1);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-8" data-asset-tick={assetTick}>
      {/* Section 1: Epidemiological Model & Disease Parameters */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">질병 모델 · 실험 조건 설정</h1>
            <p className="text-sm text-slate-600 mt-1">
              전파력, 잠복기, 회복 기간, 의료 병상 수와 랜덤 시드를 조정하여 다양한 질병 특성을 실험하세요.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDraft({ ...DEFAULT_DISEASE_PARAMS })}
              className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              기본값 복원
            </button>
            <button
              type="button"
              onClick={() => onApplyParams(draft)}
              className="h-10 px-4 rounded-lg bg-[#0F172A] text-white hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              조건 적용 후 새 실험 시작
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Infection Model & Transmission */}
          <div className="rounded-xl bg-white border border-[#DCE3EC] p-5 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-2">감염병 확산 모델</h2>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'SIR', label: 'SIR 기본' },
                    { id: 'SEIR', label: 'SEIR 잠복기' },
                    { id: 'SEIRS', label: 'SEIRS 재감염' },
                  ] as { id: ModelType; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        modelType: m.id,
                        immunityDurationDays:
                          m.id === 'SEIRS' && prev.immunityDurationDays === 0
                            ? 14
                            : m.id !== 'SEIRS'
                            ? 0
                            : prev.immunityDurationDays,
                      }))
                    }
                    className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      draft.modelType === m.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {draft.modelType === 'SIR'
                  ? 'S(감염가능) → I(감염) → R(회복·영구면역) 구조의 기본 전파 모델입니다.'
                  : draft.modelType === 'SEIR'
                  ? 'E(잠복기) 단계가 추가되어 감염 직후 일정 기간 후 전파력이 발현됩니다.'
                  : '잠복기(E)와 함께 회복 후 일정 일수가 지나면 면역이 감소해 재감염될 수 있습니다.'}
              </p>
            </div>

            <SliderField
              label="기본 접촉 전파율"
              value={Math.round(draft.baseTransmissionProb * 100)}
              unit="%"
              min={10}
              max={65}
              step={2}
              onChange={(v) => setDraft((p) => ({ ...p, baseTransmissionProb: v / 100 }))}
            />

            <SliderField
              label="감염 전파 기간"
              value={draft.infectiousDays}
              unit="일"
              min={3}
              max={14}
              step={1}
              onChange={(v) => setDraft((p) => ({ ...p, infectiousDays: v }))}
            />

            {draft.modelType !== 'SIR' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <SliderField
                  label="잠복기 길이 (E → I)"
                  value={draft.incubationDays}
                  unit="일"
                  min={1}
                  max={7}
                  step={1}
                  onChange={(v) => setDraft((p) => ({ ...p, incubationDays: v }))}
                />
                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                  <span>잠복기 중 무증상 전파 허용 (약한 전파력)</span>
                  <input
                    type="checkbox"
                    checked={draft.incubationInfectious}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, incubationInfectious: e.target.checked }))
                    }
                    className="w-4 h-4 accent-slate-900"
                  />
                </label>
              </div>
            )}

            {draft.modelType === 'SEIRS' && (
              <SliderField
                label="면역 지속 기간 (R → S)"
                value={draft.immunityDurationDays || 14}
                unit="일"
                min={7}
                max={30}
                step={1}
                onChange={(v) => setDraft((p) => ({ ...p, immunityDurationDays: v }))}
              />
            )}
          </div>

          {/* Right Column: City Population, Healthcare & Seed */}
          <div className="rounded-xl bg-white border border-[#DCE3EC] p-5 space-y-5">
            <h2 className="text-sm font-bold text-slate-900">도시 인구 · 의료 역량 · 시드</h2>

            <SliderField
              label="총 도시 인구"
              value={draft.populationSize}
              unit="명"
              min={120}
              max={320}
              step={20}
              onChange={(v) => setDraft((p) => ({ ...p, populationSize: v }))}
            />

            <SliderField
              label="초기 감염자 수 (1일차)"
              value={draft.initialInfected}
              unit="명"
              min={1}
              max={15}
              step={1}
              onChange={(v) => setDraft((p) => ({ ...p, initialInfected: v }))}
            />

            <SliderField
              label="시립병원 병상 수"
              value={draft.hospitalBeds}
              unit="병상"
              min={10}
              max={60}
              step={2}
              onChange={(v) => setDraft((p) => ({ ...p, hospitalBeds: v }))}
            />

            <SliderField
              label="백신 예방 효과 (교육용 가정치)"
              value={Math.round(draft.vaccineEfficacy * 100)}
              unit="%"
              min={50}
              max={95}
              step={5}
              onChange={(v) => setDraft((p) => ({ ...p, vaccineEfficacy: v / 100 }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <SliderField
                label="기본 치명률"
                value={Number((draft.baseFatalityRate * 100).toFixed(1))}
                unit="%"
                min={0.5}
                max={10}
                step={0.5}
                onChange={(v) => setDraft((p) => ({ ...p, baseFatalityRate: v / 100 }))}
              />
              <SliderField
                label="의료 붕괴 시 치명률"
                value={Math.round(draft.overloadedFatalityRate * 100)}
                unit="%"
                min={5}
                max={35}
                step={1}
                onChange={(v) => setDraft((p) => ({ ...p, overloadedFatalityRate: v / 100 }))}
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label htmlFor="seed-input" className="block text-xs font-semibold text-slate-800 mb-1.5">
                재현용 랜덤 시드 (동일 시드 입력 시 같은 초기 배치와 확산 조건 재현)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="seed-input"
                  type="text"
                  value={draft.seed}
                  onChange={(e) => setDraft((p) => ({ ...p, seed: e.target.value }))}
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs font-mono-num text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                />
                <button
                  type="button"
                  onClick={generateRandomSeed}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Dices className="w-3.5 h-3.5" />
                  무작위 시드
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Modular Asset Management Registry (/public/assets/ + assets.ts) */}
      <section className="space-y-4">
        <div className="pb-3 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">이미지 · 스프라이트 에셋 관리</h2>
          <p className="text-xs text-slate-600 mt-1">
            게임 로직과 분리된 <code className="font-mono-num bg-slate-100 px-1.5 py-0.5 rounded">assets.ts</code> 구조로, 기본 벡터 스프라이트 대신 커스텀 이미지를 업로드해 도시 화면에 즉시 반영할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => {
            const status = assetManager.cache.statuses[slot.key];
            const previewUrl = slot.customUrl;

            return (
              <div
                key={slot.key}
                className="rounded-xl bg-white border border-[#DCE3EC] p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={slot.label}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{slot.label}</div>
                    <div className="text-[11px] font-mono-num text-slate-400 truncate mt-0.5">
                      {slot.defaultPath}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">{slot.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className={status === 'custom-loaded' ? 'text-[#059669] font-semibold' : 'text-slate-500'}>
                    {status === 'custom-loaded' ? '커스텀 이미지 적용됨' : '기본 벡터 스프라이트 사용 중'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {slot.customUrl && (
                      <button
                        type="button"
                        onClick={() => handleResetAsset(slot.key)}
                        className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        복원
                      </button>
                    )}
                    <label className="px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      교체
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadAsset(slot.key, f);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

interface SliderFieldProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}

const SliderField: React.FC<SliderFieldProps> = ({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1.5">
      <span className="font-semibold text-slate-800">{label}</span>
      <span className="font-mono-num font-semibold text-slate-900">
        {value}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full sim-slider"
    />
  </div>
);
