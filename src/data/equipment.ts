// OCEAN GAIA V3.2 — Equipment Data
// 세션 B 소유 파일

export interface HarpoonData {
  id: number;
  name: string;
  range: number; // meters
  speed: number; // 1-10, higher = faster
  stability: number; // 1-10, higher = more stable
  specialEffect: string;
  price: number; // shells
  unlockCondition: string;
  catchBonus: number; // 0-1, bonus to catch probability
}

export interface TankData {
  id: number;
  name: string;
  airCapacity: number; // abstract units
  moveModifier: number; // 1.0 = normal, >1 = faster
  price: number;
  unlockCondition: string;
}

export interface SuitData {
  id: number;
  name: string;
  envProtection: number; // 0-1, damage reduction
  visionBonus: number; // 0-1, visibility improvement
  moveModifier: number; // 1.0 = normal
  price: number;
  unlockCondition: string;
}

export interface ShipUpgradeData {
  level: number;
  name: string;
  speed: number; // m/s
  cargoCapacity: number; // number of specimens
  explorationRange: number; // meters
  price: number;
  unlockCondition: string;
}

export const HARPOONS: HarpoonData[] = [
  { id: 1, name: '나무 작살', range: 5, speed: 4, stability: 3, specialEffect: '없음', price: 0, unlockCondition: '기본', catchBonus: 0 },
  { id: 2, name: '철 작살', range: 7, speed: 5, stability: 4, specialEffect: '없음', price: 200, unlockCondition: '조개 200개', catchBonus: 0.05 },
  { id: 3, name: '강철 작살', range: 10, speed: 6, stability: 5, specialEffect: '관통력 증가', price: 500, unlockCondition: '포획 10종', catchBonus: 0.1 },
  { id: 4, name: '티타늄 작살', range: 12, speed: 7, stability: 6, specialEffect: '부식 방지', price: 1200, unlockCondition: '포획 30종', catchBonus: 0.15 },
  { id: 5, name: '전자기 작살', range: 15, speed: 7, stability: 7, specialEffect: '마비 효과', price: 2500, unlockCondition: '포획 50종', catchBonus: 0.2 },
  { id: 6, name: '음파 작살', range: 18, speed: 6, stability: 8, specialEffect: '범위 포획', price: 4000, unlockCondition: '포획 80종', catchBonus: 0.25 },
  { id: 7, name: '레이저 작살', range: 20, speed: 9, stability: 7, specialEffect: '정밀 조준', price: 6000, unlockCondition: '포획 100종', catchBonus: 0.3 },
  { id: 8, name: '그물 작살', range: 8, speed: 4, stability: 9, specialEffect: '군집 포획', price: 3000, unlockCondition: '포획 60종', catchBonus: 0.2 },
  { id: 9, name: '작은 작살', range: 4, speed: 9, stability: 8, specialEffect: '소형 전용', price: 800, unlockCondition: '포획 20종', catchBonus: 0.3 },
  { id: 10, name: '뇌관 작살', range: 12, speed: 5, stability: 4, specialEffect: '폭발 범위', price: 5000, unlockCondition: '포획 70종', catchBonus: 0.15 },
  { id: 11, name: '빙하 작살', range: 14, speed: 6, stability: 7, specialEffect: '빙하 지역 보너스', price: 4500, unlockCondition: '빙하 해역 탐험', catchBonus: 0.25 },
  { id: 12, name: '화산 작살', range: 14, speed: 6, stability: 7, specialEffect: '화산 지역 보너스', price: 4500, unlockCondition: '화산 해역 탐험', catchBonus: 0.25 },
  { id: 13, name: '맹그로브 작살', range: 10, speed: 7, stability: 8, specialEffect: '맹그로브 보너스', price: 3500, unlockCondition: '맹그로브 해역 탐험', catchBonus: 0.2 },
  { id: 14, name: '대양 작살', range: 22, speed: 8, stability: 6, specialEffect: '원거리 사격', price: 7000, unlockCondition: '대양 해역 탐험', catchBonus: 0.3 },
  { id: 15, name: '심해 작살', range: 16, speed: 5, stability: 9, specialEffect: '고압 저항', price: 8000, unlockCondition: '심해 해역 탐험', catchBonus: 0.3 },
  { id: 16, name: '황금 작살', range: 15, speed: 8, stability: 8, specialEffect: '희귀종 유인', price: 12000, unlockCondition: '포획 120종', catchBonus: 0.35 },
  { id: 17, name: '다이아몬드 작살', range: 18, speed: 9, stability: 9, specialEffect: '최고 정밀도', price: 20000, unlockCondition: '포획 150종', catchBonus: 0.4 },
  { id: 18, name: '전기 작살', range: 12, speed: 7, stability: 6, specialEffect: '전기 마비', price: 3500, unlockCondition: '포획 40종', catchBonus: 0.2 },
  { id: 19, name: '독 작살', range: 10, speed: 5, stability: 5, specialEffect: '약화 효과', price: 2800, unlockCondition: '포획 35종', catchBonus: 0.15 },
  { id: 20, name: '얼음 작살', range: 13, speed: 6, stability: 7, specialEffect: '동결 효과', price: 4000, unlockCondition: '빙하 10종 포획', catchBonus: 0.2 },
  { id: 21, name: '용암 작살', range: 13, speed: 6, stability: 7, specialEffect: '열 효과', price: 4000, unlockCondition: '화산 10종 포획', catchBonus: 0.2 },
  { id: 22, name: '바람 작살', range: 20, speed: 10, stability: 5, specialEffect: '초고속', price: 6500, unlockCondition: '포획 90종', catchBonus: 0.2 },
  { id: 23, name: '파동 작살', range: 16, speed: 7, stability: 8, specialEffect: '파동 추적', price: 9000, unlockCondition: '포획 130종', catchBonus: 0.35 },
  { id: 24, name: '가이아의 작살', range: 25, speed: 10, stability: 10, specialEffect: '전 지역 보너스, 보호종 비포획', price: 50000, unlockCondition: '포획 180종', catchBonus: 0.5 },
];

export const TANKS: TankData[] = [
  { id: 1, name: '기본 산소통', airCapacity: 100, moveModifier: 1.0, price: 0, unlockCondition: '기본' },
  { id: 2, name: '강화 산소통', airCapacity: 150, moveModifier: 0.95, price: 300, unlockCondition: '잠수 10회' },
  { id: 3, name: '대용량 산소통', airCapacity: 250, moveModifier: 0.9, price: 800, unlockCondition: '잠수 30회' },
  { id: 4, name: '경량 산소통', airCapacity: 120, moveModifier: 1.15, price: 1500, unlockCondition: '잠수 50회' },
  { id: 5, name: '심해용 산소통', airCapacity: 300, moveModifier: 0.85, price: 3000, unlockCondition: '심해 탐험' },
  { id: 6, name: '가이아 산소통', airCapacity: 500, moveModifier: 1.1, price: 10000, unlockCondition: '보스 1회 처치' },
];

export const SUITS: SuitData[] = [
  { id: 1, name: '기본 잠수복', envProtection: 0.1, visionBonus: 0, moveModifier: 1.0, price: 0, unlockCondition: '기본' },
  { id: 2, name: '보온 잠수복', envProtection: 0.3, visionBonus: 0, moveModifier: 0.95, price: 500, unlockCondition: '빙하 탐험' },
  { id: 3, name: '내열 잠수복', envProtection: 0.4, visionBonus: 0.1, moveModifier: 0.9, price: 800, unlockCondition: '화산 탐험' },
  { id: 4, name: '경량 잠수복', envProtection: 0.15, visionBonus: 0, moveModifier: 1.2, price: 1200, unlockCondition: '잠수 50회' },
  { id: 5, name: '심해 잠수복', envProtection: 0.6, visionBonus: 0.3, moveModifier: 0.85, price: 4000, unlockCondition: '심해 탐험' },
  { id: 6, name: '가이아 잠수복', envProtection: 0.8, visionBonus: 0.5, moveModifier: 1.1, price: 15000, unlockCondition: '보스 2회 처치' },
];

export const SHIP_UPGRADES: ShipUpgradeData[] = [
  { level: 1, name: '낡은 어선', speed: 3, cargoCapacity: 10, explorationRange: 500, price: 0, unlockCondition: '기본' },
  { level: 2, name: '개량 어선', speed: 5, cargoCapacity: 20, explorationRange: 1000, price: 2000, unlockCondition: '조개 2000개' },
  { level: 3, name: '탐사선', speed: 7, cargoCapacity: 35, explorationRange: 2000, price: 8000, unlockCondition: '포획 50종' },
  { level: 4, name: '연구선', speed: 10, cargoCapacity: 50, explorationRange: 3500, price: 25000, unlockCondition: '포획 100종' },
  { level: 5, name: '가이아호', speed: 15, cargoCapacity: 80, explorationRange: 5000, price: 80000, unlockCondition: '포획 180종' },
];
