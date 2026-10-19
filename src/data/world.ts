/**
 * OCEAN GAIA V3.2 — 월드 데이터 (세션 B 소유)
 * 고정 계약: 월드 4800×3200m, 해수면 Y=0, 시작 배 (755,0,1780), 최대 수심 300m(게임용)
 * 해역 6 / 섬 12(V3 확정) / 탐사지(잠수 지점) 24 / 영구 거점은 시작 항구 1곳뿐
 */

import { WORLD } from "../core/units";

export interface ZoneDef {
  id: "tropical" | "glacial" | "volcanic" | "mangrove" | "oceanic" | "abyssal";
  nameKo: string;
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number };
  depthRangeM: [number, number];
  baseTempC: [number, number];
  requiredShipTier: number; // 이 해역 항해 가능 최소 선박 단계
}

// 월드 4800(x) × 3200(z). 열대/맹그로브는 시작 항구 주변.
export const ZONES: ZoneDef[] = [
  { id: "tropical", nameKo: "열대 산호해", bounds: { xMin: 400, xMax: 1600, zMin: 1200, zMax: 2400 }, depthRangeM: [0, 35], baseTempC: [24, 30], requiredShipTier: 1 },
  { id: "mangrove", nameKo: "탁한 하구해", bounds: { xMin: 1600, xMax: 2600, zMin: 1200, zMax: 2200 }, depthRangeM: [2, 30], baseTempC: [22, 32], requiredShipTier: 1 },
  { id: "glacial", nameKo: "한랭 대륙붕", bounds: { xMin: 200, xMax: 1500, zMin: 100, zMax: 1100 }, depthRangeM: [0, 160], baseTempC: [-2, 8], requiredShipTier: 2 },
  { id: "volcanic", nameKo: "화산 해협", bounds: { xMin: 3000, xMax: 4400, zMin: 1800, zMax: 3000 }, depthRangeM: [0, 120], baseTempC: [18, 42], requiredShipTier: 3 },
  { id: "oceanic", nameKo: "대양 난류해", bounds: { xMin: 1500, xMax: 3400, zMin: 100, zMax: 1200 }, depthRangeM: [10, 120], baseTempC: [12, 28], requiredShipTier: 3 },
  { id: "abyssal", nameKo: "심해 협곡", bounds: { xMin: 3200, xMax: 4700, zMin: 100, zMax: 1700 }, depthRangeM: [60, 300], baseTempC: [2, 12], requiredShipTier: 4 },
];

export function zoneAt(x: number, z: number): ZoneDef | undefined {
  return ZONES.find((zn) => x >= zn.bounds.xMin && x <= zn.bounds.xMax && z >= zn.bounds.zMin && z <= zn.bounds.zMax);
}

export interface IslandDef {
  id: string; nameKo: string; x: number; z: number; radiusM: number;
  zone: ZoneDef["id"]; landable: boolean; isHomePort: boolean; hasShop: boolean;
}

// V3 확정 12개 섬. 영구 거점은 산호항(시작 항구) 한 곳.
export const ISLANDS: IslandDef[] = [
  { id: "island_01", nameKo: "산호항", x: 755, z: 1780, radiusM: 90, zone: "tropical", landable: true, isHomePort: true, hasShop: true },
  { id: "island_02", nameKo: "야자섬", x: 1150, z: 2050, radiusM: 60, zone: "tropical", landable: true, isHomePort: false, hasShop: false },
  { id: "island_03", nameKo: "나비암초", x: 600, z: 1400, radiusM: 45, zone: "tropical", landable: true, isHomePort: false, hasShop: false },
  { id: "island_04", nameKo: "진주등대", x: 1450, z: 1500, radiusM: 40, zone: "tropical", landable: true, isHomePort: false, hasShop: false },
  { id: "island_05", nameKo: "갈대하구", x: 2000, z: 1700, radiusM: 70, zone: "mangrove", landable: true, isHomePort: false, hasShop: false },
  { id: "island_06", nameKo: "붉은망그루브뻘섬", x: 2400, z: 2000, radiusM: 55, zone: "mangrove", landable: true, isHomePort: false, hasShop: false },
  { id: "island_07", nameKo: "북극관문", x: 700, z: 600, radiusM: 80, zone: "glacial", landable: true, isHomePort: false, hasShop: false },
  { id: "island_08", nameKo: "빙벽앞바다섬", x: 1200, z: 350, radiusM: 50, zone: "glacial", landable: false, isHomePort: false, hasShop: false },
  { id: "island_09", nameKo: "유황섬", x: 3600, z: 2400, radiusM: 75, zone: "volcanic", landable: true, isHomePort: false, hasShop: false },
  { id: "island_10", nameKo: "검은모래비치", x: 4100, z: 2700, radiusM: 60, zone: "volcanic", landable: true, isHomePort: false, hasShop: false },
  { id: "island_11", nameKo: "난류조망대", x: 2400, z: 600, radiusM: 45, zone: "oceanic", landable: true, isHomePort: false, hasShop: false },
  { id: "island_12", nameKo: "협곡입구등대", x: 3900, z: 900, radiusM: 40, zone: "abyssal", landable: true, isHomePort: false, hasShop: false },
];

export interface DiveSite {
  id: string; x: number; z: number; zone: ZoneDef["id"];
  depthMinM: number; depthMaxM: number; environment: string;
  riskLevel: 1 | 2 | 3 | 4 | 5; requiredSuitTier: number; requiredTankTier: number;
  speciesPoolZonesMatch: true; // 출현 가능한 생물 = 해당 해역 종풀(SpawnSystem이 시간/날씨 조건 필터)
}

// 탐사지 24개 (V3 유지). 좌표는 반드시 해당 해역 경계 안.
const SITE_DEFS: Array<[number, number, ZoneDef["id"], number, number, string, 1|2|3|4|5, number, number]> = [
  [820, 1650, "tropical", 3, 25, "산호 정원", 1, 1, 1],
  [900, 1900, "tropical", 5, 30, "드롭오프 가장자리", 2, 1, 1],
  [1100, 2200, "tropical", 2, 20, "라군 얕은물", 1, 1, 1],
  [1350, 1650, "tropical", 8, 35, "동굴 진입부", 2, 2, 1],
  [640, 1500, "tropical", 4, 28, "해를 품은 암초", 1, 1, 1],
  [1500, 2300, "tropical", 10, 35, "외곽 성벽초", 2, 2, 2],
  [1900, 1500, "mangrove", 2, 18, "갈대 터널", 2, 1, 1],
  [2100, 1850, "mangrove", 3, 22, "진흙 평원", 2, 1, 1],
  [2350, 1950, "mangrove", 5, 30, "붉은늪 골", 3, 2, 2],
  [2500, 2100, "mangrove", 4, 26, "큰나무 그늘", 2, 1, 1],
  [1950, 2150, "mangrove", 6, 30, "하구 모래톱", 3, 2, 2],
  [2300, 1350, "mangrove", 3, 24, "소금기둥터", 2, 1, 1],
  [650, 500, "glacial", 15, 90, "녹색 빙벽 아래", 3, 3, 3],
  [950, 700, "glacial", 20, 120, "한랭 대륙붕 절벽", 3, 3, 3],
  [1250, 500, "glacial", 30, 160, "차가운 협곡 입구", 4, 4, 4],
  [500, 850, "glacial", 10, 70, "해초 군락 서쪽", 2, 2, 2],
  [3400, 700, "oceanic", 20, 100, "난류 소용돌이", 3, 3, 3],
  [2800, 400, "oceanic", 15, 80, "해산 봉우리", 3, 2, 3],
  [3200, 1000, "oceanic", 30, 120, "중층 폭포 조류", 4, 4, 4],
  [2000, 300, "oceanic", 25, 110, "긴 여울 지대", 3, 3, 3],
  [3500, 2200, "volcanic", 10, 80, "용암 선상지", 3, 3, 3],
  [3900, 2500, "volcanic", 20, 120, "분공 열수구", 4, 4, 4],
  [4200, 2850, "volcanic", 15, 100, "유황 동굴", 4, 4, 3],
  [3600, 1200, "abyssal", 80, 300, "심해 협곡 본굴", 5, 5, 5],
];
export const DIVE_SITES: DiveSite[] = SITE_DEFS.map(([x, z, zone, dmin, dmax, env, risk, suit, tank], i) => ({
  id: `site_${String(i + 1).padStart(2, "0")}`,
  x, z, zone, depthMinM: dmin, depthMaxM: dmax, environment: env,
  riskLevel: risk, requiredSuitTier: suit, requiredTankTier: tank, speciesPoolZonesMatch: true,
}));

export interface CompanionDef {
  id: string; nameKo: string; recruitCondition: string; bonus: Record<string, number>;
}
// 동료 3명 — 화폐 구매 금지, 탐험/이벤트로만 영입
export const COMPANIONS: CompanionDef[] = [
  { id: "mia", nameKo: "미아", recruitCondition: "산호항 북쪽 난파선 조사 후 대화", bonus: { surveyRange: 1.2, observeReward: 1.5 } },
  { id: "ari", nameKo: "아리", recruitCondition: "빙하 해역 첫 탐사 완료", bonus: { airEfficiency: 1.25 } },
  { id: "leo", nameKo: "레오", recruitCondition: "화산 해역 보스 메갈로돈 격퇴 지원", bonus: { catchBonus: 1.15, cargo: 1.2 } },
];

export interface BossDef {
  id: string; nameKo: string; fossilId: string; requiredFragments: number; summonZone: ZoneDef["id"]; rewardShells: number;
}
export const BOSSES: BossDef[] = [
  { id: "boss_dunkleosteus", nameKo: "둔클레오스테우스", fossilId: "fossil_dunkleosteus", requiredFragments: 5, summonZone: "glacial", rewardShells: 5000 },
  { id: "boss_megalodon", nameKo: "메갈로돈", fossilId: "fossil_megalodon", requiredFragments: 5, summonZone: "oceanic", rewardShells: 9000 },
  { id: "boss_mosasaurus", nameKo: "모사사우루스", fossilId: "fossil_mosasaurus", requiredFragments: 5, summonZone: "abyssal", rewardShells: 15000 },
];

// 보스별 화석 5종 = 총 15 조각
export interface FossilDef { id: string; bossId: string; fragmentIndex: number; respawnGameHours: number }
export const FOSSILS: FossilDef[] = BOSSES.flatMap((b) =>
  Array.from({ length: 5 }, (_, i) => ({ id: `${b.fossilId}_${i + 1}`, bossId: b.id, fragmentIndex: i + 1, respawnGameHours: 24 + i * 6 }))
);

export const WORLD_CONFIG = { ...WORLD, zones: ZONES, islands: ISLANDS, diveSites: DIVE_SITES };
