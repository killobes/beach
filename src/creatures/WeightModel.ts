/**
 * OCEAN GAIA V3.2 — 체장–체중 모델 (WeightModel / SizeDistribution)
 * 길이(cm)로 무게(kg)를 계산한다. 무게와 길이를 독립적으로 뽑지 않는다.
 */

import type { LengthWeightRelation, Species } from "../data/speciesTypes";
import { Rng } from "../core/Rng";
import { clamp } from "../core/units";

/** W = a * L^b → kg 반환. cm-g 계수는 /1000 변환. */
export function lengthToMassKg(lengthCm: number, rel: LengthWeightRelation): number {
  if (lengthCm <= 0) return 0;
  const raw = rel.a * Math.pow(lengthCm, rel.b); // unit 에 따라 g 또는 kg
  const kg = rel.unit === "cm-g" ? raw / 1000 : raw;
  return kg;
}

/** 게임 생성용 기준 길이 분포: std = 기준 길이의 20%, 절단 정규분포 */
export function rollLengthCm(sp: Species, rng: Rng, growthStage: GrowthStage = "ADULT", sex: Sex = "UNKNOWN"): number {
  const base = sp.gameBaseLengthCm * stageFactor(growthStage) * sexFactor(sex, sp);
  const std = sp.gameBaseLengthCm * 0.2;
  const min = Math.max(1, sp.gameMinLengthCm * stageFactor(growthStage));
  const max = sp.gameMaxLengthCm;
  return round1(clamp(rng.truncatedGauss(base, std, min, max), min, max));
}

export type GrowthStage = "JUVENILE" | "SUBADULT" | "ADULT";
export type Sex = "MALE" | "FEMALE" | "UNKNOWN";

function stageFactor(s: GrowthStage): number {
  switch (s) {
    case "JUVENILE": return 0.45;
    case "SUBADULT": return 0.78;
    case "ADULT": return 1.0;
  }
}

/** 성별 크기 차이(암수 대형화 종 등)는 GAME_FIT 보정 — 추정값 */
function sexFactor(sex: Sex, sp: Species): number {
  if (sex === "FEMALE") return sp.habitat.zone === "abyssal" ? 1.08 : 1.05;
  if (sex === "MALE") return 0.96;
  return 1.0;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export interface SpecimenSizeRoll {
  lengthCm: number;
  massKg: number;
  growthStage: GrowthStage;
  sex: Sex;
}

/** 개체 크기 일괄 생성 — 길이→무게 단방향 의존, 범위 위반 금지 */
export function rollSpecimenSize(sp: Species, rng: Rng): SpecimenSizeRoll {
  const stageRoll = rng.next();
  const growthStage: GrowthStage = stageRoll < 0.18 ? "JUVENILE" : stageRoll < 0.42 ? "SUBADULT" : "ADULT";
  const sexRoll = rng.next();
  const sex: Sex = sexRoll < 0.45 ? "MALE" : sexRoll < 0.9 ? "FEMALE" : "UNKNOWN";

  let lengthCm = rollLengthCm(sp, rng, growthStage, sex);
  // 안전장치: 어떤 경로로도 0 이하·최대 범위 초과 불가
  lengthCm = clamp(lengthCm, Math.max(1, sp.gameMinLengthCm * 0.3), sp.gameMaxLengthCm);
  let massKg = lengthToMassKg(lengthCm, sp.relation);
  if (!Number.isFinite(massKg) || massKg <= 0) {
    massKg = Math.max(0.01, sp.gameBaseMassKg * Math.pow(lengthCm / sp.gameBaseLengthCm, sp.relation.b));
  }
  return { lengthCm: round1(lengthCm), massKg: round3(massKg), growthStage, sex };
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
