// SpearPals: Blue Harbor — 단위 계약 (세션 B)
// 위치: m, 물고기 길이: cm, 무게: kg, 시간: s, 각도: rad
export const UNITS = Object.freeze({
  POSITION: 'm',
  LENGTH: 'cm',
  WEIGHT: 'kg',
  TIME: 'sec',
  ANGLE: 'rad',
});

export const WORLD_CONFIG = Object.freeze({
  widthM: 4800,          // 월드 X축 크기 (m)
  depthM: 3200,          // 월드 Z축 크기 (m)
  seaLevelY: 0,          // 해수면 Y=0
  maxDepthM: 300,        // 게임 최대 수심 (m)
  upAxis: 'Y',
  forwardAxis: '+Z',
  startShip: { x: 755, y: 0, z: 1780 },
});

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
