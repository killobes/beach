// OCEAN GAIA V3.2 — Ship Model Data
// 세션 B 소유 — 5단계 선박 상세 3D 모델 데이터

export interface ShipModelData {
  level: number;
  name: string;
  length: number; // meters
  width: number; // meters
  height: number; // meters
  color: string; // HEX
  materials: {
    hull: string;
    deck: string;
    cabin: string;
    mast: string;
  };
  components: ShipComponent[];
  description: string;
}

export interface ShipComponent {
  name: string;
  type: 'hull' | 'deck' | 'cabin' | 'mast' | 'sail' | 'anchor' | 'wheel' | 'cannon' | 'flag' | 'lantern';
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  rotation: number;
  visible: boolean;
}

export const SHIP_MODELS: ShipModelData[] = [
  // 레벨 1: 낡은 어선
  {
    level: 1,
    name: '낡은 어선',
    length: 5,
    width: 2,
    height: 1.5,
    color: '#8B4513',
    materials: {
      hull: 'weathered_wood',
      deck: 'old_wood',
      cabin: 'none',
      mast: 'simple_wood',
    },
    components: [
      { name: '선체', type: 'hull', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, rotation: 0, visible: true },
      { name: '갑판', type: 'deck', position: { x: 0, y: 0.5, z: 0 }, scale: { x: 1, y: 0.1, z: 1 }, rotation: 0, visible: true },
      { name: '돛대', type: 'mast', position: { x: 0, y: 1.5, z: 0 }, scale: { x: 0.1, y: 2, z: 0.1 }, rotation: 0, visible: true },
      { name: '닻', type: 'anchor', position: { x: 2, y: 0, z: 0 }, scale: { x: 0.3, y: 0.3, z: 0.3 }, rotation: 0, visible: true },
    ],
    description: '낡았지만 믿음직한 작은 어선',
  },

  // 레벨 2: 개량 어선
  {
    level: 2,
    name: '개량 어선',
    length: 8,
    width: 3,
    height: 2,
    color: '#A0522D',
    materials: {
      hull: 'treated_wood',
      deck: 'polished_wood',
      cabin: 'small_cabin',
      mast: 'reinforced_wood',
    },
    components: [
      { name: '선체', type: 'hull', position: { x: 0, y: 0, z: 0 }, scale: { x: 1.6, y: 1.2, z: 1.5 }, rotation: 0, visible: true },
      { name: '갑판', type: 'deck', position: { x: 0, y: 0.6, z: 0 }, scale: { x: 1.6, y: 0.1, z: 1.5 }, rotation: 0, visible: true },
      { name: '선실', type: 'cabin', position: { x: -1, y: 1.2, z: 0 }, scale: { x: 1, y: 1, z: 1 }, rotation: 0, visible: true },
      { name: '돛대', type: 'mast', position: { x: 1, y: 2, z: 0 }, scale: { x: 0.15, y: 2.5, z: 0.15 }, rotation: 0, visible: true },
      { name: '돛', type: 'sail', position: { x: 1, y: 2.5, z: 0 }, scale: { x: 1.5, y: 1.5, z: 0.1 }, rotation: 0, visible: true },
      { name: '닻', type: 'anchor', position: { x: 3, y: 0, z: 0 }, scale: { x: 0.4, y: 0.4, z: 0.4 }, rotation: 0, visible: true },
      { name: '핸들', type: 'wheel', position: { x: -1, y: 1.5, z: 0.5 }, scale: { x: 0.3, y: 0.3, z: 0.3 }, rotation: 0, visible: true },
    ],
    description: '개량된 어선. 작은 선실이 있음',
  },

  // 레벨 3: 탐사선
  {
    level: 3,
    name: '탐사선',
    length: 12,
    width: 4,
    height: 3,
    color: '#4682B4',
    materials: {
      hull: 'steel_wood',
      deck: 'teak_wood',
      cabin: 'explorer_cabin',
      mast: 'steel_mast',
    },
    components: [
      { name: '선체', type: 'hull', position: { x: 0, y: 0, z: 0 }, scale: { x: 2.4, y: 1.5, z: 2 }, rotation: 0, visible: true },
      { name: '갑판', type: 'deck', position: { x: 0, y: 0.8, z: 0 }, scale: { x: 2.4, y: 0.1, z: 2 }, rotation: 0, visible: true },
      { name: '선실', type: 'cabin', position: { x: -2, y: 1.8, z: 0 }, scale: { x: 1.5, y: 1.5, z: 1.5 }, rotation: 0, visible: true },
      { name: '돛대', type: 'mast', position: { x: 2, y: 3, z: 0 }, scale: { x: 0.2, y: 3, z: 0.2 }, rotation: 0, visible: true },
      { name: '돛', type: 'sail', position: { x: 2, y: 3.5, z: 0 }, scale: { x: 2, y: 2, z: 0.1 }, rotation: 0, visible: true },
      { name: '탐사 장비', type: 'cannon', position: { x: 3, y: 1, z: 1 }, scale: { x: 0.5, y: 0.5, z: 0.5 }, rotation: 0, visible: true },
      { name: '레이더', type: 'lantern', position: { x: 2, y: 4, z: 0 }, scale: { x: 0.4, y: 0.4, z: 0.4 }, rotation: 0, visible: true },
      { name: '닻', type: 'anchor', position: { x: 5, y: 0, z: 0 }, scale: { x: 0.5, y: 0.5, z: 0.5 }, rotation: 0, visible: true },
      { name: '핸들', type: 'wheel', position: { x: -2, y: 2.2, z: 0.8 }, scale: { x: 0.4, y: 0.4, z: 0.4 }, rotation: 0, visible: true },
      { name: '깃발', type: 'flag', position: { x: 2, y: 5, z: 0 }, scale: { x: 0.8, y: 0.5, z: 0.1 }, rotation: 0, visible: true },
    ],
    description: '탐험에 특화된 탐사선. 레이더와 탐사 장비 보유',
  },

  // 레벨 4: 연구선
  {
    level: 4,
    name: '연구선',
    length: 18,
    width: 5,
    height: 4,
    color: '#2F4F4F',
    materials: {
      hull: 'reinforced_steel',
      deck: 'premium_teak',
      cabin: 'research_lab',
      mast: 'advanced_steel',
    },
    components: [
      { name: '선체', type: 'hull', position: { x: 0, y: 0, z: 0 }, scale: { x: 3.6, y: 2, z: 2.5 }, rotation: 0, visible: true },
      { name: '갑판', type: 'deck', position: { x: 0, y: 1, z: 0 }, scale: { x: 3.6, y: 0.1, z: 2.5 }, rotation: 0, visible: true },
      { name: '연구실', type: 'cabin', position: { x: -3, y: 2.5, z: 0 }, scale: { x: 2, y: 2, z: 2 }, rotation: 0, visible: true },
      { name: '대형 창고', type: 'cabin', position: { x: 3, y: 2, z: 0 }, scale: { x: 1.5, y: 1.5, z: 1.5 }, rotation: 0, visible: true },
      { name: '돛대', type: 'mast', position: { x: 0, y: 4, z: 0 }, scale: { x: 0.25, y: 4, z: 0.25 }, rotation: 0, visible: true },
      { name: '돛', type: 'sail', position: { x: 0, y: 5, z: 0 }, scale: { x: 3, y: 3, z: 0.1 }, rotation: 0, visible: true },
      { name: '연구 장비', type: 'cannon', position: { x: 5, y: 1.5, z: 1.5 }, scale: { x: 0.8, y: 0.8, z: 0.8 }, rotation: 0, visible: true },
      { name: '레이더', type: 'lantern', position: { x: 0, y: 6, z: 0 }, scale: { x: 0.6, y: 0.6, z: 0.6 }, rotation: 0, visible: true },
      { name: '닻', type: 'anchor', position: { x: 7, y: 0, z: 0 }, scale: { x: 0.7, y: 0.7, z: 0.7 }, rotation: 0, visible: true },
      { name: '핸들', type: 'wheel', position: { x: -3, y: 3, z: 1 }, scale: { x: 0.5, y: 0.5, z: 0.5 }, rotation: 0, visible: true },
      { name: '깃발', type: 'flag', position: { x: 0, y: 7, z: 0 }, scale: { x: 1.2, y: 0.8, z: 0.1 }, rotation: 0, visible: true },
      { name: '랜턴', type: 'lantern', position: { x: 6, y: 2, z: 2 }, scale: { x: 0.3, y: 0.3, z: 0.3 }, rotation: 0, visible: true },
    ],
    description: '연구 기능이 강화된 연구선. 대형 실험실과 창고 보유',
  },

  // 레벨 5: 가이아호
  {
    level: 5,
    name: '가이아호',
    length: 25,
    width: 7,
    height: 5,
    color: '#1C1C1C',
    materials: {
      hull: 'legendary_steel',
      deck: 'golden_teak',
      cabin: 'captain_quarters',
      mast: 'legendary_mast',
    },
    components: [
      { name: '선체', type: 'hull', position: { x: 0, y: 0, z: 0 }, scale: { x: 5, y: 2.5, z: 3.5 }, rotation: 0, visible: true },
      { name: '갑판', type: 'deck', position: { x: 0, y: 1.2, z: 0 }, scale: { x: 5, y: 0.1, z: 3.5 }, rotation: 0, visible: true },
      { name: '선장실', type: 'cabin', position: { x: -5, y: 3, z: 0 }, scale: { x: 2.5, y: 2.5, z: 2.5 }, rotation: 0, visible: true },
      { name: '연구실', type: 'cabin', position: { x: 0, y: 2.5, z: 0 }, scale: { x: 2, y: 2, z: 2 }, rotation: 0, visible: true },
      { name: '대형 창고', type: 'cabin', position: { x: 5, y: 2.5, z: 0 }, scale: { x: 2, y: 2, z: 2 }, rotation: 0, visible: true },
      { name: '돛대', type: 'mast', position: { x: 0, y: 5, z: 0 }, scale: { x: 0.3, y: 5, z: 0.3 }, rotation: 0, visible: true },
      { name: '전설의 돛', type: 'sail', position: { x: 0, y: 6.5, z: 0 }, scale: { x: 4, y: 4, z: 0.1 }, rotation: 0, visible: true },
      { name: '전설의 장비', type: 'cannon', position: { x: 8, y: 2, z: 2 }, scale: { x: 1, y: 1, z: 1 }, rotation: 0, visible: true },
      { name: '전설의 레이더', type: 'lantern', position: { x: 0, y: 8, z: 0 }, scale: { x: 0.8, y: 0.8, z: 0.8 }, rotation: 0, visible: true },
      { name: '전설의 닻', type: 'anchor', position: { x: 10, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, rotation: 0, visible: true },
      { name: '선장의 핸들', type: 'wheel', position: { x: -5, y: 3.5, z: 1.5 }, scale: { x: 0.6, y: 0.6, z: 0.6 }, rotation: 0, visible: true },
      { name: '전설의 깃발', type: 'flag', position: { x: 0, y: 9, z: 0 }, scale: { x: 1.5, y: 1, z: 0.1 }, rotation: 0, visible: true },
      { name: '랜턴 1', type: 'lantern', position: { x: 8, y: 3, z: 3 }, scale: { x: 0.4, y: 0.4, z: 0.4 }, rotation: 0, visible: true },
      { name: '랜턴 2', type: 'lantern', position: { x: -8, y: 3, z: 3 }, scale: { x: 0.4, y: 0.4, z: 0.4 }, rotation: 0, visible: true },
      { name: '헬리패드', type: 'deck', position: { x: 5, y: 3, z: 0 }, scale: { x: 2, y: 0.1, z: 2 }, rotation: 0, visible: true },
    ],
    description: '전설적인 탐험선 가이아호. 모든 것을 갖춘 최고의 선박',
  },
];

export function getShipModelData(level: number): ShipModelData {
  return SHIP_MODELS.find(s => s.level === level) || SHIP_MODELS[0];
}
