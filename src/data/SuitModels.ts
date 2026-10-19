// OCEAN GAIA V3.2 — Suit Model Data
// 세션 B 소유 — 6종 잠수복 상세 3D 모델 데이터

export interface SuitModelData {
  id: number;
  name: string;
  thickness: number; // mm
  weight: number; // kg
  material: string;
  primaryColor: string; // HEX
  secondaryColor: string; // HEX
  helmetType: 'none' | 'basic' | 'advanced' | 'legendary';
  specialFeature: string;
  flexibility: number; // 1-10 (10 = most flexible)
  description: string;
}

export const SUIT_MODELS: SuitModelData[] = [
  {
    id: 1,
    name: '기본 잠수복',
    thickness: 3,
    weight: 2,
    material: 'neoprene',
    primaryColor: '#1C1C1C',
    secondaryColor: '#4169E1',
    helmetType: 'none',
    specialFeature: '없음',
    flexibility: 8,
    description: '기본적인 네오프렌 잠수복',
  },
  {
    id: 2,
    name: '보온 잠수복',
    thickness: 5,
    weight: 3,
    material: 'thermal_neoprene',
    primaryColor: '#2F4F4F',
    secondaryColor: '#FF6347',
    helmetType: 'basic',
    specialFeature: '보온 기능',
    flexibility: 7,
    description: '차가운 물에서도 따뜻함을 유지하는 잠수복',
  },
  {
    id: 3,
    name: '내열 잠수복',
    thickness: 6,
    weight: 4,
    material: 'heat_resistant',
    primaryColor: '#8B0000',
    secondaryColor: '#FFD700',
    helmetType: 'advanced',
    specialFeature: '내열 기능',
    flexibility: 6,
    description: '화산 지역의 뜨거운 물을 견디는 잠수복',
  },
  {
    id: 4,
    name: '경량 잠수복',
    thickness: 2,
    weight: 1.5,
    material: 'lightweight_neoprene',
    primaryColor: '#00CED1',
    secondaryColor: '#FFFFFF',
    helmetType: 'none',
    specialFeature: '경량 설계',
    flexibility: 10,
    description: '가볍고 유연한 잠수복',
  },
  {
    id: 5,
    name: '심해 잠수복',
    thickness: 8,
    weight: 6,
    material: 'pressure_resistant',
    primaryColor: '#191970',
    secondaryColor: '#00BFFF',
    helmetType: 'advanced',
    specialFeature: '고압 저항',
    flexibility: 5,
    description: '심해의 높은 압력을 견디는 잠수복',
  },
  {
    id: 6,
    name: '가이아 잠수복',
    thickness: 7,
    weight: 4,
    material: 'legendary_fabric',
    primaryColor: '#00CED1',
    secondaryColor: '#FFD700',
    helmetType: 'legendary',
    specialFeature: '전설적 성능',
    flexibility: 9,
    description: '전설적인 성능의 잠수복',
  },
];

export function getSuitModelData(id: number): SuitModelData {
  return SUIT_MODELS.find(s => s.id === id) || SUIT_MODELS[0];
}
