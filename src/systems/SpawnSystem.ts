/**
 * OCEAN GAIA V3.2 — 스폰 시스템 (세션 B)
 * 시드 기반 재현: 같은 seed + 같은 tick → 같은 개체 군집.
 * 출현 조건: 해역 / 수심 / 시간대(낮·밤) / 날씨 / 계절 / 선박·잠수 티어.
 */

import type { Species } from "../data/speciesTypes";
import { Rng } from "../core/Rng";
import { ZONES, zoneAt, type ZoneDef } from "../data/world";
import { makeSpecimen, type Specimen } from "./CreatureBehavior";

export interface SpawnEnv {
  timeOfDay0to24: number;
  season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
  weather: "CLEAR" | "CLOUDY" | "RAIN" | "STORM" | "SNOW" | "FOG";
}

const RARITY_WEIGHT = { COMMON: 100, UNCOMMON: 55, RARE: 26, EPIC: 9, LEGENDARY: 3, UNKNOWN: 40 } as const;

/** 보호·관찰 전용 종은 일반 생태 스폰 대상에서 제외한다. (도감 관찰용 개체는 DEBUG 경로로만 배치) */
export function isPassiveSpawnExcluded(sp: Species): boolean {
  return sp.economy.protectedSpecies === true;
}

export function speciesCanSpawn(sp: Species, zoneId: string, env: SpawnEnv): boolean {
  if (sp.habitat.zone !== zoneId) return false;
  if (isPassiveSpawnExcluded(sp)) return false;
  const isNight = env.timeOfDay0to24 < 6 || env.timeOfDay0to24 >= 20;
  switch (sp.habitat.activity) {
    case "NOCTURNAL": if (!isNight) return false; break;
    case "DIURNAL": if (isNight) return false; break;
    case "CREPUSCULAR": if (!(env.timeOfDay0to24 >= 5 && env.timeOfDay0to24 <= 8) && !(env.timeOfDay0to24 >= 17 && env.timeOfDay0to24 <= 20)) return false; break;
    case "ANY": break;
  }
  // 폭풍 시 대부분의 어종 스폰 감소(특정 종만 활성) — 규칙상 STORM에서는 50%만 허용
  if (env.weather === "STORM" && sp.economy.rarity !== "EPIC" && sp.economy.rarity !== "LEGENDARY") return false;
  return true;
}

export class SpawnSystem {
  private nextSeqBySpecies = new Map<number, number>();

  constructor(private rng: Rng) {}

  /** 해당 좌표 해역에서 n마리 스폰 요청 → 새 개체 배열 반환 */
  spawnAround(x: number, z: number, allSpecies: Species[], count: number, env: SpawnEnv): Specimen[] {
    const zone = zoneAt(x, z);
    if (!zone) return [];
    const pool = allSpecies.filter((sp) => speciesCanSpawn(sp, zone.id, env));
    if (pool.length === 0) return [];
    const out: Specimen[] = [];
    for (let i = 0; i < count; i++) {
      const sp = this.weightedPick(pool);
      const seq = (this.nextSeqBySpecies.get(sp.id) ?? 0) + 1;
      this.nextSeqBySpecies.set(sp.id, seq);
      const bounds = { xMin: Math.max(zone.bounds.xMin, x - 120), xMax: Math.min(zone.bounds.xMax, x + 120), zMin: Math.max(zone.bounds.zMin, z - 120), zMax: Math.min(zone.bounds.zMax, z + 120) };
      out.push(makeSpecimen(sp, seq, this.rng, bounds));
    }
    return out;
  }

  /** 해역·시간대·날씨 제약 없이 해당 좌표 해역의 비보호종에서 강제 스폰 (최소 개체 수 보장용) */
  spawnForcedAny(x: number, z: number, allSpecies: Species[], count: number): Specimen[] {
    const zone = zoneAt(x, z);
    if (!zone || count <= 0) return [];
    const pool = allSpecies.filter((sp) => sp.habitat.zone === zone.id && !isPassiveSpawnExcluded(sp));
    if (pool.length === 0) return [];
    const out: Specimen[] = [];
    for (let i = 0; i < count; i++) {
      const sp = this.weightedPick(pool);
      const seq = (this.nextSeqBySpecies.get(sp.id) ?? 0) + 1;
      this.nextSeqBySpecies.set(sp.id, seq);
      const bounds = { xMin: zone.bounds.xMin, xMax: zone.bounds.xMax, zMin: zone.bounds.zMin, zMax: zone.bounds.zMax };
      out.push(makeSpecimen(sp, seq, this.rng, bounds));
    }
    return out;
  }

  /** 보호·관찰 전용 종 1개체를 지정 좌표 근처에 강제 생성 (DEBUG/도감 관찰 경로 전용) */
  spawnPassiveOne(sp: Species, x: number, z: number): Specimen | null {
    if (!isPassiveSpawnExcluded(sp)) return null; // 보호종만 허용
    const zone = zoneAt(x, z);
    const bounds = zone
      ? { xMin: Math.max(zone.bounds.xMin, x - 60), xMax: Math.min(zone.bounds.xMax, x + 60), zMin: Math.max(zone.bounds.zMin, z - 60), zMax: Math.min(zone.bounds.zMax, z + 60) }
      : { xMin: x - 60, xMax: x + 60, zMin: z - 60, zMax: z + 60 };
    const seq = (this.nextSeqBySpecies.get(sp.id) ?? 0) + 1;
    this.nextSeqBySpecies.set(sp.id, seq);
    return makeSpecimen(sp, seq, this.rng, bounds);
  }

  private weightedPick(pool: Species[]): Species {
    let total = 0;
    for (const s of pool) total += RARITY_WEIGHT[s.economy.rarity];
    let r = this.rng.next() * total;
    for (const s of pool) {
      r -= RARITY_WEIGHT[s.economy.rarity];
      if (r <= 0) return s;
    }
    return pool[pool.length - 1];
  }

  serialize(): Array<[number, number]> { return [...this.nextSeqBySpecies.entries()]; }
  /** 저장 시스템 연동: 내부 RNG 상태 직렬화/복원 (재현성 보장) */
  rngState() { return this.rng.serialize(); }
  restoreRng(st: ReturnType<Rng["serialize"]>) { this.rng = Rng.restore(st); }
  restore(entries: Array<[number, number]>): void {
    this.nextSeqBySpecies = new Map(entries);
  }
}
