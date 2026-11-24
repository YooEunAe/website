import { CityCondition } from './types';

export interface AssetSlot {
  key: string;
  category: 'backgrounds' | 'characters' | 'virus' | 'environment' | 'ui' | 'sprites';
  label: string;
  description: string;
  defaultPath: string;
  customUrl: string | null;
}

export const INITIAL_ASSET_SLOTS: AssetSlot[] = [
  {
    key: 'city_background',
    category: 'backgrounds',
    label: '도시 배경 맵',
    description: '시뮬레이션 도시의 기본 지형 및 도로 배경 레이어',
    defaultPath: '/assets/backgrounds/city_map.png',
    customUrl: null,
  },
  {
    key: 'citizen_susceptible',
    category: 'characters',
    label: '일반 시민 (S)',
    description: '감염 가능 상태의 일반 시민 스프라이트',
    defaultPath: '/assets/characters/citizen_s.png',
    customUrl: null,
  },
  {
    key: 'citizen_exposed',
    category: 'characters',
    label: '잠복기 시민 (E)',
    description: 'SEIR 모드 잠복기 상태의 시민 스프라이트',
    defaultPath: '/assets/characters/citizen_e.png',
    customUrl: null,
  },
  {
    key: 'citizen_infected',
    category: 'characters',
    label: '감염자 (I)',
    description: '감염 상태에서 바이러스를 전파하는 시민 스프라이트',
    defaultPath: '/assets/characters/citizen_i.png',
    customUrl: null,
  },
  {
    key: 'citizen_recovered',
    category: 'characters',
    label: '회복자 (R)',
    description: '감염 후 회복하여 면역을 얻은 시민 스프라이트',
    defaultPath: '/assets/characters/citizen_r.png',
    customUrl: null,
  },
  {
    key: 'citizen_medic',
    category: 'characters',
    label: '의료진 캐릭터',
    description: '병원과 방역 현장에서 활동하는 의료진 스프라이트',
    defaultPath: '/assets/characters/medic.png',
    customUrl: null,
  },
  {
    key: 'building_hospital',
    category: 'environment',
    label: '병원 및 방역 시설',
    description: '입원 치료와 격리가 이루어지는 시립병원 건물',
    defaultPath: '/assets/environment/hospital.png',
    customUrl: null,
  },
  {
    key: 'virus_particle',
    category: 'virus',
    label: '바이러스 전파 아이콘',
    description: '접촉 및 전파 시 표시되는 바이러스 파티클',
    defaultPath: '/assets/virus/virus_icon.png',
    customUrl: null,
  },
  {
    key: 'mask_overlay',
    category: 'ui',
    label: '마스크 착용 오버레이',
    description: '마스크 정책 적용 시 시민 얼굴에 덧씌워지는 아이콘',
    defaultPath: '/assets/ui/mask.png',
    customUrl: null,
  },
  {
    key: 'vaccine_icon',
    category: 'ui',
    label: '백신 접종 아이콘',
    description: '백신 접종 완료 및 면역 보호 표시 아이콘',
    defaultPath: '/assets/ui/vaccine.png',
    customUrl: null,
  },
  {
    key: 'ambulance_sprite',
    category: 'sprites',
    label: '구급차 스프라이트',
    description: '중증·격리 대상 환자를 병원으로 이송하는 구급차',
    defaultPath: '/assets/sprites/ambulance.png',
    customUrl: null,
  },
];

export interface LoadedAssetCache {
  images: Record<string, HTMLImageElement | null>;
  statuses: Record<string, 'vector-fallback' | 'custom-loaded' | 'error'>;
}

export class AssetManager {
  slots: AssetSlot[];
  cache: LoadedAssetCache = { images: {}, statuses: {} };

  constructor() {
    this.slots = INITIAL_ASSET_SLOTS.map((s) => ({ ...s }));
    this.slots.forEach((slot) => {
      this.cache.statuses[slot.key] = 'vector-fallback';
      this.cache.images[slot.key] = null;
    });
  }

  async probeDefaultAssets(): Promise<void> {
    await Promise.all(
      this.slots.map(async (slot) => {
        const target = slot.customUrl || slot.defaultPath;
        try {
          await this.loadImage(slot.key, target);
        } catch {
          // Fallback to built-in crisp procedural vector/SVG sprites cleanly
          this.cache.images[slot.key] = null;
          this.cache.statuses[slot.key] = 'vector-fallback';
        }
      })
    );
  }

  setCustomAsset(key: string, url: string | null): Promise<boolean> {
    const slot = this.slots.find((s) => s.key === key);
    if (!slot) return Promise.resolve(false);
    slot.customUrl = url;
    if (!url) {
      this.cache.images[key] = null;
      this.cache.statuses[key] = 'vector-fallback';
      return Promise.resolve(true);
    }
    return this.loadImage(key, url)
      .then(() => true)
      .catch(() => {
        this.cache.images[key] = null;
        this.cache.statuses[key] = 'error';
        return false;
      });
  }

  private loadImage(key: string, src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Verify valid raster/SVG dimensions
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          this.cache.images[key] = img;
          this.cache.statuses[key] = 'custom-loaded';
          resolve(img);
        } else {
          reject(new Error('Empty image'));
        }
      };
      img.onerror = () => reject(new Error('Image not found'));
      img.src = src;
    });
  }

  getImage(key: string): HTMLImageElement | null {
    return this.cache.images[key] ?? null;
  }

  getCityConditionMeta(condition: CityCondition): {
    label: string;
    description: string;
    ambientTint: string;
    accentColor: string;
  } {
    switch (condition) {
      case 'calm':
        return {
          label: '일상 안정',
          description: '일반 시민들이 도시 전역에서 자유롭게 활동하고 있습니다.',
          ambientTint: 'rgba(241, 245, 249, 0)',
          accentColor: '#2563EB',
        };
      case 'spreading':
        return {
          label: '확산 진행',
          description: '접촉을 통해 감염자가 도시 여러 구역으로 퍼지고 있습니다.',
          ambientTint: 'rgba(217, 119, 6, 0.04)',
          accentColor: '#D97706',
        };
      case 'surge':
        return {
          label: '급증 경보',
          description: '감염이 빠르게 확산되어 병원 병상과 의료 체계에 큰 부담이 걸렸습니다.',
          ambientTint: 'rgba(220, 38, 38, 0.07)',
          accentColor: '#DC2626',
        };
      case 'recovering':
        return {
          label: '진정 국면',
          description: '회복자와 면역자가 늘어나며 신규 감염 속도가 둔화되고 있습니다.',
          ambientTint: 'rgba(5, 150, 105, 0.04)',
          accentColor: '#059669',
        };
      case 'contained':
        return {
          label: '감염병 종식',
          description: '새로운 감염 전파가 멈추어 도시가 안정적인 일상으로 돌아왔습니다.',
          ambientTint: 'rgba(5, 150, 105, 0.03)',
          accentColor: '#059669',
        };
    }
  }
}

export const assetManager = new AssetManager();
