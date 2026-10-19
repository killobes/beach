// OCEAN GAIA V3.2 — Tank Model Data
// 세션 B 소유 — 6종 산소통 상세 3D 모델 데이터

export interface TankModelData {
  id: number;
  name: string;
  height: number; // cm
  diameter: number; // cm
  weight: number; // kg (when empty)
  material: string;
  color: string; // HEX
  pressure: number; // atm
  valveType: 'standard' | 'advanced' | 'digital' | 'emergency';
  specialFeature: string;
  description: string;
}

export const TANK_MODELS: TankModelData[] = [
  {
    id: 1,
    name: '기본 산소통',
    height: 50,
    diameter: 18,
    weight: 10,
    material: 'steel',
    color: '#808080',
    pressure: 200,
    valveType: 'standard',
    specialFeature: '없음',
    description: '표준적인 다이빙 산소통',
  },
  {
    id: 2,
    name: '강화 산소통',
    height: 55,
    diameter: 20,
    weight: 12,
    material: 'reinforced_steel',
    color: '#696969',
    pressure: 250,
    valveType: 'advanced',
    specialFeature: '내구성 증가',
    description: '강화된 강철 산소통',
  },
  {
    id: 3,
    name: '대용량 산소통',
    height: 65,
    diameter: 22,
    weight: 15,
    material: 'steel',
    color: '#4682B4',
    pressure: 300,
    valveType: 'advanced',
    specialFeature: '대용량',
    description: '많은 공기를 저장하는 대형 산소통',
  },
  {
    id: 4,
    name: '경량 산소통',
    height: 45,
    diameter: 16,
    weight: 6,
    material: 'aluminum',
    color: '#C0C0C0',
    pressure: 200,
    valveType: 'standard',
    specialFeature: '경량 설계',
    description: '가벼운 알루미늄 산소통',
  },
  {
    id: 5,
    name: '심해용 산소통',
    height: 60,
    diameter: 24,
    weight: 18,
    material: 'titanium',
    color: '#2F4F4F',
    pressure: 400,
    valveType: 'digital',
    specialFeature: '고압 저항',
    description: '심해의 높은 압력을 견디는 산소통',
  },
  {
    id: 6,
    name: '가이아 산소통',
    height: 70,
    diameter: 25,
    weight: 14,
    material: 'legendary_alloy',
    color: '#00CED1',
    pressure: 500,
    valveType: 'emergency',
    specialFeature: '전설적 성능',
    description: '전설적인 성능의 산소통',
  },
];

export function getTankModelData(id: number): TankModelData {
  return TANK_MODELS.find(t => t.id === id) || TANK_MODELS[0];
}
