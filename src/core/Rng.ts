/**
 * 재현 가능한 난수 생성기 (mulberry32 + 문자열 해시 시드)
 * 상태 직렬화/복원 가능 → 저장·불러오기에서 RNG 흐름 유지.
 */

export function hashSeed(input: string | number): number {
  if (typeof input === "number") return input >>> 0;
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export interface RngState {
  s: number;
  spare: number | null;
}

export class Rng {
  private s: number;
  private spare: number | null = null; // 가우시안 Box-Muller 예비값

  constructor(seed: string | number) {
    this.s = hashSeed(seed);
  }

  next(): number {
    let t = (this.s += 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(minIncl: number, maxIncl: number): number {
    return Math.floor(this.range(minIncl, maxIncl + 1 - 1e-12));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  /** 표준정규분포 표본 (Box-Muller) */
  gauss(): number {
    if (this.spare !== null) {
      const v = this.spare;
      this.spare = null;
      return v;
    }
    const u1 = Math.max(this.next(), 1e-12);
    const u2 = this.next();
    const r = Math.sqrt(-2 * Math.log(u1));
    this.spare = r * Math.sin(2 * Math.PI * u2);
    return r * Math.cos(2 * Math.PI * u2);
  }

  /** 절단 정규분포: mean±std를 [min,max] 안에서 재시도 없이 잘라 생성 */
  truncatedGauss(mean: number, std: number, min: number, max: number): number {
    for (let i = 0; i < 16; i++) {
      const v = mean + this.gauss() * std;
      if (v >= min && v <= max) return v;
    }
    // 극단 확률 대비: 마지막은 클램프 (RNG 흐름은 결정적 유지)
    return Math.min(max, Math.max(min, mean + this.gauss() * std));
  }

  serialize(): RngState {
    return { s: this.s, spare: this.spare };
  }

  static restore(state: RngState): Rng {
    const r = new Rng(0);
    r.s = state.s >>> 0;
    r.spare = state.spare;
    return r;
  }
}
