/**
 * OCEAN GAIA V3.2 — 장비 데이터 (세션 B 소유)
 * 작살 24종 / 산소통 6종 / 잠수복 6종 / 선박 개조 5단계
 * 이름은 기존 V3 24종 작살 목록 유지.
 */

export type HarpoonTip = "STANDARD" | "BARBED" | "ELECTRIC" | "TRIPLE" | "GLACIAL" | "VOLCANIC" | "GOLDEN";

export interface Harpoon {
  id: string; // harpoon_01 .. harpoon_24
  index: number; // 1..24
  name: string; // 기존 V3 이름 유지
  damage: number; // 게임 추상 데미지
  rangeM: number; // 사거리 m
  handlingSec: number; // 재장전/조작 속도 초
  stability: number; // 0~1 안정성(명중 판정 보정)
  effect: "NONE" | "ELECTROSHOCK" | "DEEP_LOCK" | "HEAT" | "Frost" | "LURE" | "Pierce";
  priceShells: number;
  unlockReq: { shipTier?: number; discoveredSpecies?: number; zoneCleared?: string };
}

const H_NAMES = [
  "나무 작살", "돌 작살", "무게추 작살", "갈고리 작살", "삼치 창", "연어 작살",
  "번개 작살", "바다작살", "심해 작살", "얼음 작살", "화산 작살", "청동 삼갈래작살",
  "철제 꺾쇠작살", "유리 작살", "산호 작살", "진주 장식 작살", "잉어 잡이 창", "참치 작살",
  "상어 파쇄창", "전류 작살", "귀신 작살", "황금 작살", "가이아 성작살", "전설의 트리톤 작살",
];

export const HARPOONS: Harpoon[] = H_NAMES.map((name, i) => {
  const idx = i + 1;
  const tier = Math.floor(i / 6); // 0..3
  return {
    id: `harpoon_${String(idx).padStart(2, "0")}`,
    index: idx,
    name,
    damage: 8 + idx * 3,
    rangeM: 6 + tier * 4,
    handlingSec: Math.max(0.4, 1.4 - tier * 0.25),
    stability: Math.min(0.98, 0.55 + tier * 0.12),
    effect: pickEffect(i),
    priceShells: 60 + idx * idx * 22,
    unlockReq: { shipTier: Math.min(5, 1 + Math.floor(i / 6)), discoveredSpecies: i * 6 },
  };
});

function pickEffect(i: number): Harpoon["effect"] {
  if (i === 6 || i === 19) return "ELECTROSHOCK";
  if (i === 8) return "DEEP_LOCK";
  if (i === 9) return "Frost";
  if (i === 10) return "HEAT";
  if (i >= 21) return "LURE";
  return "NONE";
}

export interface Tank {
  id: string; name: string; airCapacity: number; // 게임용 추상 공기량
  moveMod: number; priceShells: number; unlockReq: { minShipTier: number };
}
export const TANKS: Tank[] = [
  { id: "tank_01", name: "기본 실린더", airCapacity: 100, moveMod: 1.0, priceShells: 0, unlockReq: { minShipTier: 1 } },
  { id: "tank_02", name: "듀얼 실린더", airCapacity: 170, moveMod: 0.95, priceShells: 320, unlockReq: { minShipTier: 2 } },
  { id: "tank_03", name: "탐사 탱크", airCapacity: 240, moveMod: 0.9, priceShells: 780, unlockReq: { minShipTier: 2 } },
  { id: "tank_04", name: "딥 다이브 탱크", airCapacity: 330, moveMod: 0.88, priceShells: 1650, unlockReq: { minShipTier: 3 } },
  { id: "tank_05", name: "재순환 리브리더", airCapacity: 460, moveMod: 0.92, priceShells: 3200, unlockReq: { minShipTier: 4 } },
  { id: "tank_06", name: "가이아 마크 VII", airCapacity: 620, moveMod: 0.96, priceShells: 6400, unlockReq: { minShipTier: 5 } },
];

export interface DiveSuit {
  id: string; name: string; envMod: number; visionMod: number; moveMod: number;
  maxDepthM: number; priceShells: number; unlockReq: { minShipTier: number };
}
export const SUITS: DiveSuit[] = [
  { id: "suit_01", name: "얕은 물 슈트", envMod: 0.1, visionMod: 0.0, moveMod: 1.0, maxDepthM: 20, priceShells: 0, unlockReq: { minShipTier: 1 } },
  { id: "suit_02", name: "네오프렌 잠수복", envMod: 0.25, visionMod: 0.05, moveMod: 1.0, maxDepthM: 40, priceShells: 260, unlockReq: { minShipTier: 1 } },
  { id: "suit_03", name: "건식 다이빙슈트", envMod: 0.45, visionMod: 0.1, moveMod: 0.95, maxDepthM: 80, priceShells: 900, unlockReq: { minShipTier: 2 } },
  { id: "suit_04", name: "냉수 방한 수트", envMod: 0.7, visionMod: 0.15, moveMod: 0.92, maxDepthM: 130, priceShells: 2100, unlockReq: { minShipTier: 3 } },
  { id: "suit_05", name: "심해 압력 외골격", envMod: 0.9, visionMod: 0.3, moveMod: 0.85, maxDepthM: 220, priceShells: 4800, unlockReq: { minShipTier: 4 } },
  { id: "suit_06", name: "가이아 심해 프로토콜", envMod: 1.0, visionMod: 0.45, moveMod: 0.9, maxDepthM: 300, priceShells: 9000, unlockReq: { minShipTier: 5 } },
];

export interface ShipStage {
  stage: number; name: string; maxSpeedMs: number; accelMs2: number;
  cargoKg: number; surveyRangeM: number; priceShells: number;
  unlockReq: { prevStage: number; discoveredSpecies: number; shellsSpentMin?: number };
  accessZones: string[];
}
export const SHIP_STAGES: ShipStage[] = [
  { stage: 1, name: "낡은 어선", maxSpeedMs: 6, accelMs2: 2.0, cargoKg: 120, surveyRangeM: 60, priceShells: 0, unlockReq: { prevStage: 0, discoveredSpecies: 0 }, accessZones: ["tropical", "mangrove"] },
  { stage: 2, name: "연안 순찰선", maxSpeedMs: 9, accelMs2: 3.0, cargoKg: 260, surveyRangeM: 110, priceShells: 900, unlockReq: { prevStage: 1, discoveredSpecies: 15 }, accessZones: ["tropical", "mangrove", "glacial"] },
  { stage: 3, name: "원양 탐사선", maxSpeedMs: 12, accelMs2: 3.8, cargoKg: 520, surveyRangeM: 180, priceShells: 2600, unlockReq: { prevStage: 2, discoveredSpecies: 45 }, accessZones: ["tropical", "mangrove", "glacial", "volcanic", "oceanic"] },
  { stage: 4, name: "심해 지원 모선", maxSpeedMs: 15, accelMs2: 4.5, cargoKg: 900, surveyRangeM: 260, priceShells: 6200, unlockReq: { prevStage: 3, discoveredSpecies: 95 }, accessZones: ["tropical", "mangrove", "glacial", "volcanic", "oceanic", "abyssal"] },
  { stage: 5, name: "전설적 가이아호", maxSpeedMs: 19, accelMs2: 5.5, cargoKg: 1500, surveyRangeM: 340, priceShells: 14000, unlockReq: { prevStage: 4, discoveredSpecies: 150 }, accessZones: ["tropical", "mangrove", "glacial", "volcanic", "oceanic", "abyssal"] },
];

export type EquipmentCategory = "harpoon" | "tank" | "suit";

export function findEquipment(id: string): { kind: EquipmentCategory; item: Harpoon | Tank | DiveSuit } | undefined {
  if (id.startsWith("harpoon_")) { const it = HARPOONS.find(h => h.id === id); return it ? { kind: "harpoon", item: it } : undefined; }
  if (id.startsWith("tank_")) { const it = TANKS.find(t => t.id === id); return it ? { kind: "tank", item: it } : undefined; }
  if (id.startsWith("suit_")) { const it = SUITS.find(s => s.id === id); return it ? { kind: "suit", item: it } : undefined; }
  return undefined;
}
