/**
 * OCEAN GAIA V3.2 — 날씨·시간·계절·조류·조수 (세션 B)
 * 발생 확률과 게임 효과 계산. 화면 표현은 세션 A 위임.
 * 1 게임일 = 1440초(24분) 실측 아케이드 속도. 계절 = 7일.
 */

import { Rng } from "../core/Rng";

export type Weather = "CLEAR" | "CLOUDY" | "RAIN" | "STORM" | "SNOW" | "FOG";
export type Season = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";

export const GAME_SECONDS_PER_DAY = 1440;
export const DAYS_PER_SEASON = 7;

export interface WorldClock {
  gameSeconds: number;
}

export function timeOfDay(clock: WorldClock): number {
  const dayFrac = (clock.gameSeconds % GAME_SECONDS_PER_DAY) / GAME_SECONDS_PER_DAY;
  return dayFrac * 24;
}
export function dayNumber(clock: WorldClock): number {
  return Math.floor(clock.gameSeconds / GAME_SECONDS_PER_DAY) + 1;
}
export function seasonOf(clock: WorldClock): Season {
  const idx = Math.floor(dayNumber(clock) / DAYS_PER_SEASON) % 4;
  return (["SPRING", "SUMMER", "AUTUMN", "WINTER"] as const)[idx];
}
export function isNight(clock: WorldClock): boolean {
  const t = timeOfDay(clock);
  return t < 6 || t >= 20;
}

/** 해역별 날씨 전이 확률(고정 테이블) — snow는 빙하 전용, storm 확률은 화산/심해 증가 */
const TRANSITION: Record<string, Partial<Record<Weather, number>>> = {
  tropical: { CLEAR: 0.6, CLOUDY: 0.25, RAIN: 0.1, FOG: 0.03, STORM: 0.02 },
  mangrove: { CLEAR: 0.5, CLOUDY: 0.3, RAIN: 0.12, FOG: 0.06, STORM: 0.02 },
  glacial: { CLEAR: 0.4, CLOUDY: 0.25, SNOW: 0.2, FOG: 0.1, STORM: 0.05 },
  volcanic: { CLEAR: 0.35, CLOUDY: 0.25, RAIN: 0.15, FOG: 0.15, STORM: 0.1 },
  oceanic: { CLEAR: 0.45, CLOUDY: 0.25, RAIN: 0.1, STORM: 0.15, FOG: 0.05 },
  abyssal: { CLEAR: 0.5, CLOUDY: 0.3, FOG: 0.2 },
};

export class WeatherSystem {
  current: Weather = "CLEAR";
  private changeTimerSec = 0;

  constructor(private rng: Rng, private zoneId: string) {}

  /** dt 초 진행. 변경 주기는 120~420 게임초. */
  update(dtSec: number, zoneId: string): Weather {
    if (zoneId !== this.zoneId) { this.zoneId = zoneId; this.changeTimerSec = 0; }
    this.changeTimerSec -= dtSec;
    if (this.changeTimerSec <= 0) {
      this.roll();
      this.changeTimerSec = this.rng.range(120, 420);
    }
    return this.current;
  }

  roll(): Weather {
    const table = TRANSITION[this.zoneId] ?? TRANSITION.tropical;
    let total = 0;
    for (const v of Object.values(table)) total += v!;
    let r = this.rng.next() * total;
    for (const [k, w] of Object.entries(table)) {
      r -= w!;
      if (r <= 0) { this.current = k as Weather; return this.current; }
    }
    return this.current;
  }

  /** 게임 효과: 시야 배율, 조류 배율, 공기 소모 배율 */
  effects(): { visionFactor: number; currentFactor: number; airBurnFactor: number } {
    switch (this.current) {
      case "STORM": return { visionFactor: 0.55, currentFactor: 1.8, airBurnFactor: 1.3 };
      case "RAIN": return { visionFactor: 0.8, currentFactor: 1.2, airBurnFactor: 1.1 };
      case "FOG": return { visionFactor: 0.6, currentFactor: 1.0, airBurnFactor: 1.0 };
      case "SNOW": return { visionFactor: 0.75, currentFactor: 1.1, airBurnFactor: 1.15 };
      case "CLOUDY": return { visionFactor: 0.92, currentFactor: 1.05, airBurnFactor: 1.0 };
      default: return { visionFactor: 1.0, currentFactor: 1.0, airBurnFactor: 1.0 };
    }
  }

  tideLevel(clock: WorldClock): number {
    // 반일조: 하루 2주기, -1..1
    const f = (clock.gameSeconds % (GAME_SECONDS_PER_DAY / 2)) / (GAME_SECONDS_PER_DAY / 2);
    return Math.sin(f * Math.PI * 2);
  }

  serialize() { return { current: this.current, changeTimerSec: this.changeTimerSec, zoneId: this.zoneId }; }
  restore(d: { current: Weather; changeTimerSec: number; zoneId: string }) {
    this.current = d.current; this.changeTimerSec = d.changeTimerSec; this.zoneId = d.zoneId;
  }
}
