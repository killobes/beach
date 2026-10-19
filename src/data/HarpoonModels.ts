// OCEAN GAIA V3.2 — Harpoon Model Data
// 세션 B 소유 — 24종 작살 상세 3D 모델 데이터

export interface HarpoonModelData {
  id: number;
  name: string;
  length: number; // cm
  weight: number; // kg
  material: string;
  color: string; // HEX
  tipType: 'standard' | 'barbed' | 'electric' | 'explosive' | 'net' | 'laser' | 'sonic';
  specialEffect: string;
  glowColor?: string; // 발광 색상
  description: string;
}

export const HARPOON_MODELS: HarpoonModelData[] = [
  { id: 1, name: '나무 작살', length: 150, weight: 2, material: 'wood', color: '#8B4513', tipType: 'standard', specialEffect: '없음', description: '간단한 나무 작살' },
  { id: 2, name: '철 작살', length: 160, weight: 3, material: 'iron', color: '#696969', tipType: 'barbed', specialEffect: '관통력 증가', description: '철로 만든 작살' },
  { id: 3, name: '강철 작살', length: 170, weight: 3.5, material: 'steel', color: '#808080', tipType: 'barbed', specialEffect: '강력한 관통력', description: '강철로 만든 작살' },
  { id: 4, name: '티타늄 작살', length: 180, weight: 2.5, material: 'titanium', color: '#C0C0C0', tipType: 'barbed', specialEffect: '가볍고 강력', description: '티타늄 합금 작살' },
  { id: 5, name: '전자기 작살', length: 190, weight: 4, material: 'metal', color: '#4169E1', tipType: 'electric', specialEffect: '마비 효과', glowColor: '#00BFFF', description: '전기를 흘려보내는 작살' },
  { id: 6, name: '음파 작살', length: 200, weight: 5, material: 'metal', color: '#9370DB', tipType: 'sonic', specialEffect: '범위 공격', glowColor: '#BA55D3', description: '음파를 발사하는 작살' },
  { id: 7, name: '레이저 작살', length: 210, weight: 3, material: 'crystal', color: '#FF1493', tipType: 'laser', specialEffect: '정밀 사격', glowColor: '#FF69B4', description: '레이저를 발사하는 작살' },
  { id: 8, name: '그물 작살', length: 180, weight: 6, material: 'rope_metal', color: '#DAA520', tipType: 'net', specialEffect: '군집 포획', description: '그물이 달린 작살' },
  { id: 9, name: '작은 작살', length: 120, weight: 1.5, material: 'wood', color: '#A0522D', tipType: 'standard', specialEffect: '소형 전용', description: '작은 물고기용 작살' },
  { id: 10, name: '뇌관 작살', length: 200, weight: 7, material: 'metal', color: '#B22222', tipType: 'explosive', specialEffect: '폭발 범위', glowColor: '#FF4500', description: '폭발하는 작살' },
  { id: 11, name: '빙하 작살', length: 190, weight: 4, material: 'ice_metal', color: '#ADD8E6', tipType: 'barbed', specialEffect: '빙하 보너스', glowColor: '#87CEEB', description: '차가운 작살' },
  { id: 12, name: '화산 작살', length: 190, weight: 4.5, material: 'volcanic_metal', color: '#FF6347', tipType: 'barbed', specialEffect: '화산 보너스', glowColor: '#FF4500', description: '뜨거운 작살' },
  { id: 13, name: '맹그로브 작살', length: 170, weight: 3, material: 'wood_metal', color: '#228B22', tipType: 'standard', specialEffect: '맹그로브 보너스', description: '맹그로브 나무로 만든 작살' },
  { id: 14, name: '대양 작살', length: 220, weight: 5, material: 'steel', color: '#4682B4', tipType: 'barbed', specialEffect: '원거리 사격', description: '먼 거리까지 사격 가능한 작살' },
  { id: 15, name: '심해 작살', length: 200, weight: 6, material: 'pressure_resistant', color: '#2F4F4F', tipType: 'barbed', specialEffect: '고압 저항', description: '심해 압력을 견디는 작살' },
  { id: 16, name: '황금 작살', length: 200, weight: 8, material: 'gold', color: '#FFD700', tipType: 'barbed', specialEffect: '희귀종 유인', glowColor: '#FFA500', description: '황금으로 만든 작살' },
  { id: 17, name: '다이아몬드 작살', length: 210, weight: 4, material: 'diamond', color: '#E0FFFF', tipType: 'laser', specialEffect: '최고 정밀도', glowColor: '#00FFFF', description: '다이아몬드 작살' },
  { id: 18, name: '전기 작살', length: 180, weight: 3.5, material: 'metal', color: '#FFD700', tipType: 'electric', specialEffect: '전기 마비', glowColor: '#FFFF00', description: '전기를 흘려보내는 작살' },
  { id: 19, name: '독 작살', length: 170, weight: 3, material: 'poisoned_metal', color: '#9ACD32', tipType: 'barbed', specialEffect: '약화 효과', glowColor: '#32CD32', description: '독이 묻은 작살' },
  { id: 20, name: '얼음 작살', length: 180, weight: 3.5, material: 'ice', color: '#B0E0E6', tipType: 'barbed', specialEffect: '동결 효과', glowColor: '#ADD8E6', description: '얼음으로 만든 작살' },
  { id: 21, name: '용암 작살', length: 180, weight: 4, material: 'lava_metal', color: '#FF4500', tipType: 'barbed', specialEffect: '열 효과', glowColor: '#FF6347', description: '용암으로 만든 작살' },
  { id: 22, name: '바람 작살', length: 230, weight: 2, material: 'wind_crystal', color: '#E0FFFF', tipType: 'standard', specialEffect: '초고속', glowColor: '#87CEFA', description: '바람의 힘을 담은 작살' },
  { id: 23, name: '파동 작살', length: 200, weight: 5, material: 'wave_crystal', color: '#4169E1', tipType: 'sonic', specialEffect: '파동 추적', glowColor: '#1E90FF', description: '파동을 발사하는 작살' },
  { id: 24, name: '가이아의 작살', length: 250, weight: 6, material: 'legendary', color: '#00CED1', tipType: 'laser', specialEffect: '전 지역 보너스', glowColor: '#00FFFF', description: '전설적인 가이아의 작살' },
];

export function getHarpoonModelData(id: number): HarpoonModelData {
  return HARPOON_MODELS.find(h => h.id === id) || HARPOON_MODELS[0];
}
