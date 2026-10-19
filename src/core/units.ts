/**
 * OCEAN GAIA V3.2 — 세션 B 고정 단위·월드 계약 상수
 * 모든 시스템은 이 파일을 유일한 기준으로 사용한다.
 * 단위: 위치 m / 길이 cm / 무게 kg / 시간 s / 각도 rad
 */

export const WORLD = {
  WIDTH_M: 4800,
  DEPTH_M: 3200, // z축 크기 (world 4800 x 3200)
  SEA_LEVEL_Y: 0,
  MAX_DEPTH_M: 300, // 게임용 최대 수심
  START_SHIP: { x: 755, y: 0, z: 1780 },
  UNIT_PER_METER: 1,
} as const;

export const UNITS = {
  POSITION: "m",
  LENGTH: "cm",
  MASS: "kg",
  TIME: "s",
  ANGLE: "rad",
} as const;

export const GAME_VERSION = "3.2.0";
export const SAVE_KEY = "ocean-gaia-save-v3.2";
export const SAVE_SCHEMA_VERSION = 3;

/** 액션 이름 고정 (세션 A와의 계약) — GameEngine.dispatch 실제 지원 목록과 1:1 */
export const ACTIONS = [
  "TICK",
  "MOVE_SHIP",
  "ENTER_WATER",
  "MOVE_DIVER",
  "RETURN_TO_SHIP",
  "CATCH_ATTEMPT",
  "OBSERVE_CREATURE",
  "SELL_ALL",
  "BUY_ITEM",
  "EQUIP_ITEM",
  "UPGRADE_SHIP",
  "COLLECT_FOSSIL",
  "SUMMON_BOSS",
  "ATTACK_BOSS",
  "RECRUIT_COMPANION",
  "MERCHANT_VISIT",
  "MERCHANT_BUY",
  "MARK_SITE_DISCOVERED",
] as const;

export type ActionType = (typeof ACTIONS)[number];

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
