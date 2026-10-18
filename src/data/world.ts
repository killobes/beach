// OCEAN GAIA V3.2 — World Data
// 세션 B 소유 파일

import type { Region } from './species';

export interface IslandData {
  id: number;
  name: string;
  region: Region;
  x: number; // meters
  y: number; // meters (world Z)
  hasPort: boolean;
  hasShop: boolean;
  hasDock: boolean;
  description: string;
}

export interface CompanionData {
  id: string;
  name: string;
  role: string;
  bonus: {
    type: 'catch' | 'sell' | 'observation' | 'speed';
    value: number;
  };
  unlockCondition: string;
  description: string;
}

export interface FossilData {
  id: number;
  bossId: string;
  name: string;
  region: Region;
  rarity: number; // 1-5
}

export interface BossData {
  id: string;
  name: string;
  scientificName: string;
  hp: number;
  attack: number;
  defense: number;
  fossilRequired: number; // number of fossils needed to summon
  rewardShells: number;
  rewardTitle: string;
}

export interface WorldConfig {
  widthM: number;
  heightM: number;
  seaLevel: number;
  startShipX: number;
  startShipZ: number;
  regions: Record<Region, { xMin: number; xMax: number; zMin: number; zMax: number }>;
}

export const WORLD_CONFIG: WorldConfig = {
  widthM: 4800,
  heightM: 3200,
  seaLevel: 0,
  startShipX: 755,
  startShipZ: 1780,
  regions: {
    tropical: { xMin: 0, xMax: 1600, zMin: 0, zMax: 1600 },
    mangrove: { xMin: 1600, xMax: 3200, zMin: 0, zMax: 1600 },
    glacier: { xMin: 3200, xMax: 4800, zMin: 0, zMax: 1600 },
    ocean: { xMin: 0, xMax: 2400, zMin: 1600, zMax: 3200 },
    volcanic: { xMin: 2400, xMax: 4800, zMin: 1600, zMax: 2400 },
    deepsea: { xMin: 2400, xMax: 4800, zMin: 2400, zMax: 3200 },
  }
};

export const ISLANDS: IslandData[] = [
  { id: 1, name: '산호항', region: 'tropical', x: 400, y: 400, hasPort: true, hasShop: true, hasDock: true, description: '모험의 시작점. 따뜻한 산호초가 둘러싼 작은 항구.' },
  { id: 2, name: '야자섬', region: 'tropical', x: 800, y: 200, hasPort: true, hasShop: true, hasDock: true, description: '야자나무가 무성한 열대 낙원.' },
  { id: 3, name: '돌고래만', region: 'tropical', x: 200, y: 900, hasPort: false, hasShop: false, hasDock: true, description: '돌고래 떼가 자주 출몰하는 아름다운 만.' },
  { id: 4, name: '진주항', region: 'tropical', x: 1200, y: 800, hasPort: true, hasShop: true, hasDock: true, description: '진주 채취로 유명한 번화한 항구.' },
  { id: 5, name: '맹그로브숲', region: 'mangrove', x: 1800, y: 400, hasPort: true, hasShop: true, hasDock: true, description: '울창한 맹그로브 숲이 펼쳐진 지역.' },
  { id: 6, name: '늪지대', region: 'mangrove', x: 2400, y: 200, hasPort: false, hasShop: false, hasDock: true, description: '신비로운 늪지대. 희귀 생물이 서식한다.' },
  { id: 7, name: '어부의 마을', region: 'mangrove', x: 2800, y: 800, hasPort: true, hasShop: true, hasDock: true, description: '전통 어업 마을. 지역 특산품을 거래한다.' },
  { id: 8, name: '조개 해변', region: 'mangrove', x: 2000, y: 1200, hasPort: false, hasShop: false, hasDock: true, description: '아름다운 조개가 가득한 해변.' },
  { id: 9, name: '얼음항', region: 'glacier', x: 3600, y: 400, hasPort: true, hasShop: true, hasDock: true, description: '빙하 옆에 자리한 차가운 항구.' },
  { id: 10, name: '펭귄섬', region: 'glacier', x: 4200, y: 200, hasPort: false, hasShop: false, hasDock: true, description: '수많은 펭귄이 서식하는 얼음 섬.' },
  { id: 11, name: '고래만', region: 'glacier', x: 4400, y: 1000, hasPort: true, hasShop: true, hasDock: true, description: '고래가 회유하는 차가운 바다.' },
  { id: 12, name: '북극기지', region: 'glacier', x: 3800, y: 1400, hasPort: true, hasShop: true, hasDock: true, description: '북극 탐험의 전초기지.' },
  { id: 13, name: '대양항', region: 'ocean', x: 600, y: 2200, hasPort: true, hasShop: true, hasDock: true, description: '넓은 대양을 마주한 큰 항구.' },
  { id: 14, name: '바람섬', region: 'ocean', x: 1400, y: 2600, hasPort: false, hasShop: false, hasDock: true, description: '강한 바람이 부는 외딴 섬.' },
  { id: 15, name: '상어초', region: 'ocean', x: 200, y: 2800, hasPort: false, hasShop: false, hasDock: false, description: '상어가 배회하는 위험한 산호초.' },
  { id: 16, name: '화산항', region: 'volcanic', x: 3000, y: 1800, hasPort: true, hasShop: true, hasDock: true, description: '활화산 근처의 뜨거운 항구.' },
  { id: 17, name: '열수구섬', region: 'volcanic', x: 3800, y: 2000, hasPort: false, hasShop: false, hasDock: true, description: '해저 열수구가 분출하는 섬.' },
  { id: 18, name: '용암만', region: 'volcanic', x: 4200, y: 2200, hasPort: true, hasShop: true, hasDock: true, description: '용암이 흐르는 기이한 만.' },
  { id: 19, name: '심해기지', region: 'deepsea', x: 3200, y: 2800, hasPort: true, hasShop: true, hasDock: true, description: '심해 탐험을 위한 특수 기지.' },
  { id: 20, name: '심연의 문', region: 'deepsea', x: 4000, y: 3000, hasPort: false, hasShop: false, hasDock: true, description: '가장 깊은 심해로 이어지는 문.' },
];

export const COMPANIONS: CompanionData[] = [
  {
    id: 'mia',
    name: '미아',
    role: '생물학자',
    bonus: { type: 'observation', value: 0.5 },
    unlockCondition: '첫 보호종 관찰',
    description: '열정적인 해양 생물학자. 관찰 보너스를 50% 증가시킨다.'
  },
  {
    id: 'ari',
    name: '아리',
    role: '잠수 전문가',
    bonus: { type: 'speed', value: 0.3 },
    unlockCondition: '잠수 50회 달성',
    description: '숙련된 잠수부. 수중 이동 속도를 30% 증가시킨다.'
  },
  {
    id: 'leo',
    name: '레오',
    role: '항해사',
    bonus: { type: 'sell', value: 0.2 },
    unlockCondition: '포획 30종 달성',
    description: '베테랑 항해사. 판매 가격을 20% 증가시킨다.'
  }
];

export const BOSSES: BossData[] = [
  {
    id: 'dunkleosteus',
    name: '둔클레오스테우스',
    scientificName: 'Dunkleosteus terrelli',
    hp: 5000,
    attack: 200,
    defense: 150,
    fossilRequired: 5,
    rewardShells: 20000,
    rewardTitle: '고대 갑옷 파쇄자'
  },
  {
    id: 'megalodon',
    name: '메갈로돈',
    scientificName: 'Otodus megalodon',
    hp: 8000,
    attack: 300,
    defense: 200,
    fossilRequired: 5,
    rewardShells: 35000,
    rewardTitle: '거대 상어 헌터'
  },
  {
    id: 'mosasaurus',
    name: '모사사우루스',
    scientificName: 'Mosasaurus hoffmannii',
    hp: 10000,
    attack: 350,
    defense: 180,
    fossilRequired: 5,
    rewardShells: 50000,
    rewardTitle: '바다의 지배자'
  }
];

export const FOSSILS: FossilData[] = [
  // Dunkleosteus fossils (5)
  { id: 1, bossId: 'dunkleosteus', name: '둔클레오스테우스 두개골 조각', region: 'glacier', rarity: 4 },
  { id: 2, bossId: 'dunkleosteus', name: '둔클레오스테우스 갑옷 파편', region: 'ocean', rarity: 4 },
  { id: 3, bossId: 'dunkleosteus', name: '둔클레오스테우스 이빨', region: 'volcanic', rarity: 4 },
  { id: 4, bossId: 'dunkleosteus', name: '둔클레오스테우스 지느러미 화석', region: 'deepsea', rarity: 4 },
  { id: 5, bossId: 'dunkleosteus', name: '둔클레오스테우스 척추 화석', region: 'mangrove', rarity: 4 },
  // Megalodon fossils (5)
  { id: 6, bossId: 'megalodon', name: '메갈로돈 이빨 화석', region: 'tropical', rarity: 5 },
  { id: 7, bossId: 'megalodon', name: '메갈로돈 턱뼈 조각', region: 'ocean', rarity: 5 },
  { id: 8, bossId: 'megalodon', name: '메갈로돈 척추 마디', region: 'glacier', rarity: 5 },
  { id: 9, bossId: 'megalodon', name: '메갈로돈 지느러미 화석', region: 'deepsea', rarity: 5 },
  { id: 10, bossId: 'megalodon', name: '메갈로돈 두개골 파편', region: 'volcanic', rarity: 5 },
  // Mosasaurus fossils (5)
  { id: 11, bossId: 'mosasaurus', name: '모사사우루스 두개골', region: 'mangrove', rarity: 5 },
  { id: 12, bossId: 'mosasaurus', name: '모사사우루스 이빨', region: 'tropical', rarity: 5 },
  { id: 13, bossId: 'mosasaurus', name: '모사사우루스 갈비뼈', region: 'glacier', rarity: 5 },
  { id: 14, bossId: 'mosasaurus', name: '모사사우루스 꼬리 화석', region: 'ocean', rarity: 5 },
  { id: 15, bossId: 'mosasaurus', name: '모사사우루스 발가락 화석', region: 'deepsea', rarity: 5 },
];

export const WEATHER_TYPES = ['clear', 'cloudy', 'rain', 'storm', 'fog', 'snow'] as const;
export type WeatherType = typeof WEATHER_TYPES[number];

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = typeof SEASONS[number];

export interface WeatherEffect {
  type: WeatherType;
  visibilityMod: number; // 0-1
  moveSpeedMod: number; // 0.5-1.5
  catchMod: number; // 0.5-1.5
  spawnMod: Record<Region, number>; // spawn rate modifier per region
}

export const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {
  clear: { type: 'clear', visibilityMod: 1.0, moveSpeedMod: 1.0, catchMod: 1.0, spawnMod: { tropical: 1.0, glacier: 1.0, volcanic: 1.0, mangrove: 1.0, ocean: 1.0, deepsea: 1.0 } },
  cloudy: { type: 'cloudy', visibilityMod: 0.8, moveSpeedMod: 1.0, catchMod: 1.0, spawnMod: { tropical: 1.0, glacier: 1.0, volcanic: 1.0, mangrove: 1.0, ocean: 1.0, deepsea: 1.0 } },
  rain: { type: 'rain', visibilityMod: 0.6, moveSpeedMod: 0.9, catchMod: 0.9, spawnMod: { tropical: 1.2, glacier: 0.8, volcanic: 0.9, mangrove: 1.3, ocean: 1.0, deepsea: 1.0 } },
  storm: { type: 'storm', visibilityMod: 0.3, moveSpeedMod: 0.6, catchMod: 0.5, spawnMod: { tropical: 0.5, glacier: 0.5, volcanic: 0.5, mangrove: 0.5, ocean: 0.5, deepsea: 1.0 } },
  fog: { type: 'fog', visibilityMod: 0.2, moveSpeedMod: 0.8, catchMod: 0.7, spawnMod: { tropical: 0.8, glacier: 1.0, volcanic: 1.2, mangrove: 1.0, ocean: 0.9, deepsea: 1.0 } },
  snow: { type: 'snow', visibilityMod: 0.5, moveSpeedMod: 0.7, catchMod: 0.8, spawnMod: { tropical: 0.3, glacier: 1.5, volcanic: 0.5, mangrove: 0.5, ocean: 0.8, deepsea: 1.0 } },
};
