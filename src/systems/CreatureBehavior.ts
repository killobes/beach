/**
 * OCEAN GAIA V3.2 — 개체 팩토리 & 행동 (세션 B)
 * SpecimenFactory: 고유 ID + 길이→무게 단방향 생성(절단 정규분포, std=기준의 20%)
 * CreatureBehavior: 위치/상태/식별자를 A팀이 읽을 수 있는 순수 데이터로 반환 (Three.js 금지)
 */

import type { Species } from "../data/speciesTypes";
import { rollSpecimenSize, type GrowthStage, type Sex } from "../creatures/WeightModel";
import { Rng } from "../core/Rng";
import { WORLD, clamp } from "../core/units";

export interface Specimen {
  id: string; // fish_{speciesId}_{seq} — 세션 A 계약 형식과 통일
  speciesId: number;
  lengthCm: number;
  massKg: number;
  growthStage: GrowthStage;
  sex: Sex;
  x: number; y: number; z: number; // m, y는 해수면 기준 음수 = 수심
  headingRad: number;
  behaviorState: BehaviorState;
  energy: number; // 0~1
  hunger: number; // 0~1
  alive: boolean;
  fleeTimerSec: number;
}

/** 어댑터/엔진 공용: 개체 목록 조회 */
export function listSpecimens(specimens: Specimen[]): Specimen[] { return specimens.map((s) => ({ ...s })); }

export type BehaviorState =
  | "IDLE" | "SCHOOL_MOVE" | "SOLO_ROAM" | "FORAGING" | "FLEEING"
  | "AMBUSH_WAIT" | "BENTHIC_REST" | "MIGRATING" | "NIGHT_PATROL";

export function makeSpecimen(sp: Species, seq: number, rng: Rng, zoneBounds: { xMin: number; xMax: number; zMin: number; zMax: number }): Specimen {
  const size = rollSpecimenSize(sp, rng);
  const depth = rng.range(Math.max(0.5, sp.habitat.depthMinM), sp.habitat.depthMaxM);
  return {
    id: `fish_${sp.id}_${String(seq).padStart(4, "0")}`,
    speciesId: sp.id,
    lengthCm: size.lengthCm,
    massKg: size.massKg,
    growthStage: size.growthStage,
    sex: size.sex,
    x: rng.range(zoneBounds.xMin, zoneBounds.xMax),
    y: -depth,
    z: rng.range(zoneBounds.zMin, zoneBounds.zMax),
    headingRad: rng.range(-Math.PI, Math.PI),
    behaviorState: initialBehavior(sp),
    energy: rng.range(0.6, 1.0),
    hunger: rng.range(0.1, 0.7),
    alive: true,
    fleeTimerSec: 0,
  };
}

function initialBehavior(sp: Species): BehaviorState {
  const b = sp.habitat.behaviors;
  if (b.includes("BENTHIC_REST")) return "BENTHIC_REST";
  if (b.includes("AMBUSH")) return "AMBUSH_WAIT";
  if (b.includes("SCHOOLING")) return "SCHOOL_MOVE";
  if (b.includes("NOCTURNAL")) return "NIGHT_PATROL";
  if (b.includes("MIGRATORY")) return "MIGRATING";
  return "SOLO_ROAM";
}

export interface EnvContext {
  timeOfDay0to24: number;
  isNight: boolean;
  weather: "CLEAR" | "CLOUDY" | "RAIN" | "STORM" | "SNOW" | "FOG";
  currentSpeedMs: number; // 해류
  diverPos: { x: number; y: number; z: number } | null;
}

/**
 * 한 틱 동안의 이동 목표와 행동 상태를 반환한다.
 * 실제 메시 이동/보간은 세션 A가 담당 — 여기서는 순수 규칙만.
 */
export function stepBehavior(spec: Specimen, sp: Species, env: EnvContext, dtSec: number, rng: Rng): void {
  if (!spec.alive) return;

  // 에너지/허기 소모 (시간 단위 초)
  spec.energy = clamp(spec.energy - dtSec * 0.0008, 0, 1);
  spec.hunger = clamp(spec.hunger + dtSec * 0.0006, 0, 1);
  if (spec.hunger > 0.8 && rng.chance(dtSec * 0.05)) spec.behaviorState = "FORAGING";
  if (spec.behaviorState === "FORAGING" && spec.hunger < 0.3) spec.behaviorState = "IDLE";

  // 야행성 종: 낮에는 휴식
  const nocturnal = sp.habitat.behaviors.includes("NOCTURNAL") || sp.habitat.activity === "NOCTURNAL";
  if (nocturnal && !env.isNight && spec.behaviorState !== "BENTHIC_REST") spec.behaviorState = "BENTHIC_REST";
  if (nocturnal && env.isNight && spec.behaviorState === "BENTHIC_REST") spec.behaviorState = "NIGHT_PATROL";

  // 플레이어 접근 → 도피 판정 (시야/날씨 보정)
  if (env.diverPos) {
    const dx = spec.x - env.diverPos.x, dy = spec.y - env.diverPos.y, dz = spec.z - env.diverPos.z;
    const dist = Math.hypot(dx, dy, dz);
    const visionRange = sp.habitat.behaviors.includes("AMBUSH") ? 6 : 14;
    const stormPenalty = env.weather === "STORM" ? 0.6 : env.weather === "FOG" ? 0.7 : 1;
    if (dist < visionRange * stormPenalty) {
      if (sp.habitat.behaviors.includes("FLEEING_PRONE") || sp.habitat.behaviors.includes("SOLO")) {
        spec.behaviorState = "FLEEING";
        spec.fleeTimerSec = 4;
        spec.headingRad = Math.atan2(-dx, -dz); // 플레이어 반대 방향
      } else if (sp.habitat.behaviors.includes("TERRITORIAL") && rng.chance(dtSec * 0.4)) {
        spec.headingRad = Math.atan2(dx, dz); // 영역 방어 접근
      }
    }
  }
  if (spec.fleeTimerSec > 0) {
    spec.fleeTimerSec -= dtSec;
    if (spec.fleeTimerSec <= 0 && spec.behaviorState === "FLEEING") spec.behaviorState = "IDLE";
  }

  // 조율된 랜덤 선회 + 경계 유지
  const turnRate = spec.behaviorState === "FLEEING" ? 0.9 : 0.25;
  spec.headingRad += rng.gauss() * turnRate * dtSec;
  const v = sp.habitat.swimSpeedMs * (spec.behaviorState === "FLEEING" ? 2.2 : spec.behaviorState === "MIGRATING" ? 1.3 : 1);
  const nx = spec.x + Math.sin(spec.headingRad) * v * dtSec;
  const nz = spec.z + Math.cos(spec.headingRad) * v * dtSec;
  // 월드 및 해저 깊이 클램프 (y 음수, 최대 수심 300)
  spec.x = clamp(nx, 0, WORLD.WIDTH_M);
  spec.z = clamp(nz, 0, WORLD.DEPTH_M);
  const dmin = sp.habitat.depthMinM, dmax = sp.habitat.depthMaxM;
  spec.y = clamp(spec.y + rng.gauss() * 0.15 * dtSec, -Math.min(dmax, WORLD.MAX_DEPTH_M), -dmin);
}
