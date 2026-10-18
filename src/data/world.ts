// OCEAN GAIA V3.2 — World Data
// 세션 B 소유 파일
// 계약: 섬 12개, 탐사지 24개, 해역 6개

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

export interface DiveSiteData {
  id: number;
  name: string;
  region: Region;
  x: number;
  z: number;
  depthMinM: number;
  depthMaxM: number;
  environment: string;
  riskLevel: number; // 1-5
  discovered: boolean;
  possibleSpecies: number[]; // species IDs
  equipmentRequired: string;
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
  rarity: number;
}

export interface BossData {
  id: string;
  name: string;
  scientificName: string;
  hp: number;
  attack: number;
  defense: number;
  fossilRequired: number;
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

// ═══════════════════════════════════════════
// 12개 섬 (V3 계약)
// ═══════════════════════════════════════════
export const ISLANDS: IslandData[] = [
  { id: 1, name: '산호항', region: 'tropical', x: 755, y: 1780, hasPort: true, hasShop: true, hasDock: true, description: '모험의 시작점. 따뜻한 산호초가 둘러싼 작은 항구.' },
  { id: 2, name: '야자섬', region: 'tropical', x: 400, y: 400, hasPort: false, hasShop: false, hasDock: true, description: '야자나무가 무성한 열대 낙원.' },
  { id: 3, name: '돌고래만', region: 'tropical', x: 1200, y: 800, hasPort: false, hasShop: false, hasDock: true, description: '돌고래 떼가 자주 출몰하는 아름다운 만.' },
  { id: 4, name: '맹그로브숲', region: 'mangrove', x: 2000, y: 600, hasPort: true, hasShop: true, hasDock: true, description: '울창한 맹그로브 숲이 펼쳐진 지역.' },
  { id: 5, name: '늪지대', region: 'mangrove', x: 2600, y: 400, hasPort: false, hasShop: false, hasDock: true, description: '신비로운 늪지대. 희귀 생물이 서식한다.' },
  { id: 6, name: '어부의 마을', region: 'mangrove', x: 2800, y: 1200, hasPort: true, hasShop: true, hasDock: true, description: '전통 어업 마을. 지역 특산품을 거래한다.' },
  { id: 7, name: '얼음항', region: 'glacier', x: 3600, y: 600, hasPort: true, hasShop: true, hasDock: true, description: '빙하 옆에 자리한 차가운 항구.' },
  { id: 8, name: '펭귄섬', region: 'glacier', x: 4200, y: 400, hasPort: false, hasShop: false, hasDock: true, description: '수많은 펭귄이 서식하는 얼음 섬.' },
  { id: 9, name: '대양항', region: 'ocean', x: 800, y: 2200, hasPort: true, hasShop: true, hasDock: true, description: '넓은 대양을 마주한 큰 항구.' },
  { id: 10, name: '화산항', region: 'volcanic', x: 3200, y: 1800, hasPort: true, hasShop: true, hasDock: true, description: '활화산 근처의 뜨거운 항구.' },
  { id: 11, name: '열수구섬', region: 'volcanic', x: 4000, y: 2000, hasPort: false, hasShop: false, hasDock: true, description: '해저 열수구가 분출하는 섬.' },
  { id: 12, name: '심해기지', region: 'deepsea', x: 3600, y: 2800, hasPort: true, hasShop: true, hasDock: true, description: '심해 탐험을 위한 특수 기지.' },
];

// ═══════════════════════════════════════════
// 24개 탐사지 (V3 계약)
// ═══════════════════════════════════════════
export const DIVE_SITES: DiveSiteData[] = [
  // Tropical (4 sites)
  { id: 1, name: '산호초 탐사지', region: 'tropical', x: 500, z: 600, depthMinM: 5, depthMaxM: 30, environment: '산호초', riskLevel: 1, discovered: false, possibleSpecies: [1, 2, 7, 8], equipmentRequired: '기본' },
  { id: 2, name: '열대 해초밭', region: 'tropical', x: 900, z: 400, depthMinM: 3, depthMaxM: 20, environment: '해초밭', riskLevel: 1, discovered: false, possibleSpecies: [13, 16, 29], equipmentRequired: '기본' },
  { id: 3, name: '열대 심호', region: 'tropical', x: 1200, z: 1000, depthMinM: 20, depthMaxM: 60, environment: '심호', riskLevel: 2, discovered: false, possibleSpecies: [11, 17, 38], equipmentRequired: '중급 산소통' },
  { id: 4, name: '열대 해저 동굴', region: 'tropical', x: 300, z: 1200, depthMinM: 15, depthMaxM: 50, environment: '동굴', riskLevel: 3, discovered: false, possibleSpecies: [15, 40], equipmentRequired: '중급 잠수복' },

  // Mangrove (4 sites)
  { id: 5, name: '맹그로브 뿌리', region: 'mangrove', x: 2200, z: 500, depthMinM: 2, depthMaxM: 15, environment: '맹그로브', riskLevel: 1, discovered: false, possibleSpecies: [101, 102, 106], equipmentRequired: '기본' },
  { id: 6, name: '늪지대 탐사', region: 'mangrove', x: 2500, z: 800, depthMinM: 5, depthMaxM: 25, environment: '늪', riskLevel: 2, discovered: false, possibleSpecies: [107, 128], equipmentRequired: '기본' },
  { id: 7, name: '맹그로브 심층', region: 'mangrove', x: 2800, z: 600, depthMinM: 20, depthMaxM: 50, environment: '심층', riskLevel: 3, discovered: false, possibleSpecies: [118, 132], equipmentRequired: '중급 산소통' },
  { id: 8, name: '어부 마을 해안', region: 'mangrove', x: 3000, z: 1000, depthMinM: 3, depthMaxM: 20, environment: '해안', riskLevel: 1, discovered: false, possibleSpecies: [103, 112, 134], equipmentRequired: '기본' },

  // Glacier (4 sites)
  { id: 9, name: '빙하 수중 동굴', region: 'glacier', x: 3800, z: 500, depthMinM: 30, depthMaxM: 100, environment: '빙하 동굴', riskLevel: 4, discovered: false, possibleSpecies: [44, 56], equipmentRequired: '고급 잠수복' },
  { id: 10, name: '북극 해저', region: 'glacier', x: 4200, z: 800, depthMinM: 50, depthMaxM: 200, environment: '북극 해저', riskLevel: 3, discovered: false, possibleSpecies: [41, 47, 52], equipmentRequired: '고급 산소통' },
  { id: 11, name: '빙하 산호초', region: 'glacier', x: 3600, z: 1200, depthMinM: 20, depthMaxM: 80, environment: '냉수 산호초', riskLevel: 2, discovered: false, possibleSpecies: [49, 60, 64], equipmentRequired: '보온 잠수복' },
  { id: 12, name: '대서양 빙하', region: 'glacier', x: 4400, z: 1400, depthMinM: 100, depthMaxM: 300, environment: '대서양 심해', riskLevel: 4, discovered: false, possibleSpecies: [44, 61, 63], equipmentRequired: '심해용 장비' },

  // Ocean (4 sites)
  { id: 13, name: '대양 산호초', region: 'ocean', x: 600, z: 2000, depthMinM: 10, depthMaxM: 50, environment: '대양 산호초', riskLevel: 2, discovered: false, possibleSpecies: [136, 143, 148], equipmentRequired: '기본' },
  { id: 14, name: '대양 심층', region: 'ocean', x: 1200, z: 2400, depthMinM: 100, depthMaxM: 500, environment: '대양 심층', riskLevel: 4, discovered: false, possibleSpecies: [147, 150, 152], equipmentRequired: '심해용 장비' },
  { id: 15, name: '상어 회유지', region: 'ocean', x: 1800, z: 2200, depthMinM: 20, depthMaxM: 100, environment: '회유지', riskLevel: 3, discovered: false, possibleSpecies: [138, 139, 146], equipmentRequired: '고급 잠수복' },
  { id: 16, name: '대양 해저 평원', region: 'ocean', x: 400, z: 2800, depthMinM: 200, depthMaxM: 800, environment: '해저 평원', riskLevel: 5, discovered: false, possibleSpecies: [147, 152, 172], equipmentRequired: '심해용 장비' },

  // Volcanic (4 sites)
  { id: 17, name: '화산 열수구', region: 'volcanic', x: 3400, z: 1800, depthMinM: 500, depthMaxM: 2000, environment: '열수구', riskLevel: 5, discovered: false, possibleSpecies: [71, 79, 85], equipmentRequired: '내열 잠수복' },
  { id: 18, name: '용암 지대', region: 'volcanic', x: 4000, z: 2000, depthMinM: 300, depthMaxM: 1500, environment: '용암', riskLevel: 4, discovered: false, possibleSpecies: [75, 80, 83], equipmentRequired: '내열 잠수복' },
  { id: 19, name: '화산 심해', region: 'volcanic', x: 4400, z: 2200, depthMinM: 1000, depthMaxM: 3000, environment: '화산 심해', riskLevel: 5, discovered: false, possibleSpecies: [87, 95, 100], equipmentRequired: '심해용 장비' },
  { id: 20, name: '화산 동굴', region: 'volcanic', x: 3800, z: 2400, depthMinM: 200, depthMaxM: 1000, environment: '화산 동굴', riskLevel: 4, discovered: false, possibleSpecies: [73, 78, 92], equipmentRequired: '고급 잠수복' },

  // Deepsea (4 sites)
  { id: 21, name: '심해 평원', region: 'deepsea', x: 2800, z: 2600, depthMinM: 2000, depthMaxM: 4000, environment: '심해 평원', riskLevel: 5, discovered: false, possibleSpecies: [176, 180, 184], equipmentRequired: '심해용 장비' },
  { id: 22, name: '심해 해구', region: 'deepsea', x: 3600, z: 2800, depthMinM: 4000, depthMaxM: 6000, environment: '해구', riskLevel: 5, discovered: false, possibleSpecies: [177, 179, 192], equipmentRequired: '심해용 장비' },
  { id: 23, name: '심해 열수구', region: 'deepsea', x: 4200, z: 3000, depthMinM: 3000, depthMaxM: 5000, environment: '심해 열수구', riskLevel: 5, discovered: false, possibleSpecies: [186, 189, 197], equipmentRequired: '심해용 장비' },
  { id: 24, name: '심연의 문', region: 'deepsea', x: 4600, z: 3100, depthMinM: 5000, depthMaxM: 8000, environment: '심연', riskLevel: 5, discovered: false, possibleSpecies: [195, 199, 200], equipmentRequired: '가이아 장비' },
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
  visibilityMod: number;
  moveSpeedMod: number;
  catchMod: number;
  spawnMod: Record<Region, number>;
}

export const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {
  clear: { type: 'clear', visibilityMod: 1.0, moveSpeedMod: 1.0, catchMod: 1.0, spawnMod: { tropical: 1.0, glacier: 1.0, volcanic: 1.0, mangrove: 1.0, ocean: 1.0, deepsea: 1.0 } },
  cloudy: { type: 'cloudy', visibilityMod: 0.8, moveSpeedMod: 1.0, catchMod: 1.0, spawnMod: { tropical: 1.0, glacier: 1.0, volcanic: 1.0, mangrove: 1.0, ocean: 1.0, deepsea: 1.0 } },
  rain: { type: 'rain', visibilityMod: 0.6, moveSpeedMod: 0.9, catchMod: 0.9, spawnMod: { tropical: 1.2, glacier: 0.8, volcanic: 0.9, mangrove: 1.3, ocean: 1.0, deepsea: 1.0 } },
  storm: { type: 'storm', visibilityMod: 0.3, moveSpeedMod: 0.6, catchMod: 0.5, spawnMod: { tropical: 0.5, glacier: 0.5, volcanic: 0.5, mangrove: 0.5, ocean: 0.5, deepsea: 1.0 } },
  fog: { type: 'fog', visibilityMod: 0.2, moveSpeedMod: 0.8, catchMod: 0.7, spawnMod: { tropical: 0.8, glacier: 1.0, volcanic: 1.2, mangrove: 1.0, ocean: 0.9, deepsea: 1.0 } },
  snow: { type: 'snow', visibilityMod: 0.5, moveSpeedMod: 0.7, catchMod: 0.8, spawnMod: { tropical: 0.3, glacier: 1.5, volcanic: 0.5, mangrove: 0.5, ocean: 0.8, deepsea: 1.0 } },
};
