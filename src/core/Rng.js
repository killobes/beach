// 재현 가능한 시드 난수 생성기 (mulberry32 + 문자열 해시)
export function hashSeed(str) {
  const s = String(str);
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export class SeededRNG {
  constructor(seed) {
    this.setSeed(seed);
  }
  setSeed(seed) {
    this.seed = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
    this._s = this.seed || 1;
  }
  getState() {
    return { seed: this.seed, s: this._s };
  }
  setState(state) {
    if (!state) return;
    this.seed = state.seed >>> 0;
    this._s = state.s >>> 0 || 1;
  }
  next() {
    let t = (this._s += 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) {
    return a + this.next() * (b - a);
  }
  int(a, b) {
    return Math.floor(this.range(a, b + 1));
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  // Box-Muller 정규분포
  normal(mean = 0, std = 1) {
    const u1 = Math.max(this.next(), 1e-9);
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  }
}
