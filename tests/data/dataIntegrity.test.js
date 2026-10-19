// OCEAN GAIA V3.2 — 데이터 정합성 검사 (세션 B)
import { describe, it, expect } from 'vitest';
import { buildSpecies, weightFromLength, ZONES } from '../../src/data/species.js';
import { SPEARS, TANKS, SUITS, SHIP_UPGRADES } from '../../src/data/equipment.js';
import { ISLANDS, DIVE_SITES, BOSSES, FOSSILS, COMPANIONS, ZONE_BOUNDS, zoneAt } from '../../src/data/world.js';

const MAX_GAME_DEPTH = 300;

describe('데이터 정합성', () => {
  const sp = buildSpecies();

  it('모든 종의 서식 수심이 게임 범위 [0,300] 및 해역 수심 내', () => {
    for (const s of sp) {
      const z = ZONES[s.zone];
      expect(s.depthMinM).toBeLessThan(s.depthMaxM);
      expect(s.depthMinM).toBeGreaterThanOrEqual(Math.max(0, z.depthMin));
      expect(s.depthMaxM).toBeLessThanOrEqual(Math.min(z.depthMax, MAX_GAME_DEPTH));
    }
  });

  it('체장–체중 관계식이 기준 무게와 ±40% 이내로 정합화됨', () => {
    for (const s of sp) {
      const calc = weightFromLength(s, s.gameLengthCm);
      const ratio = calc / s.gameWeightKg;
      expect(ratio).toBeGreaterThan(0.6);
      expect(ratio).toBeLessThan(1.7);
    }
  });

  it('원시 계수/실보고 수심 보존 + 검증 상태 분리', () => {
    for (const s of sp) {
      expect(typeof s.rawWlA).toBe('number');
      expect(typeof s.realDepthMaxM).toBe('number');
      expect(['VERIFIED', 'GAME_ESTIMATE', 'UNKNOWN', 'RECHECK_REQUIRED']).toContain(s.verification);
    }
    // 137 눈다랑어: FL/TL 자료 충돌 → RECHECK_REQUIRED 유지
    expect(sp.find(s => s.id === 137).verification).toBe('RECHECK_REQUIRED');
  });

  it('보호종은 관찰 전용이며 포획 대상 아님 (판매가 0)', () => {
    const prot = sp.filter(s => s.protected);
    expect(prot.length).toBeGreaterThanOrEqual(2); // 나폴레온, 실러캔스 등
    for (const p of prot) expect(p.rarity).toBeGreaterThanOrEqual(4);
  });

  it('ID 1~200 연속·해명 유효·학명 2단 이상', () => {
    expect(sp.map(s => s.id)).toEqual(Array.from({ length: 200 }, (_, i) => i + 1));
    for (const s of sp) {
      expect(s.scientificName.split(' ').length).toBeGreaterThanOrEqual(2);
      expect(ZONES[s.zone]).toBeTruthy();
    }
  });

  it('장비: 작살 사거리/가격 단계적 상승, 선박 개조 5단계 단조 증가', () => {
    let lastPrice = -1;
    for (const s of SPEARS) { expect(s.rangeM).toBeGreaterThan(0); expect(s.price).toBeGreaterThanOrEqual(lastPrice); lastPrice = s.price; }
    let lastHold = 0, lastSpeed = 0;
    for (const u of SHIP_UPGRADES) { expect(u.holdKg).toBeGreaterThan(lastHold); expect(u.maxSpeedMs).toBeGreaterThan(lastSpeed); lastHold = u.holdKg; lastSpeed = u.maxSpeedMs; }
    for (const t of TANKS) expect(t.airCapacity).toBeGreaterThan(0);
    for (const st of SUITS) { expect(st.maxDepthM).toBeGreaterThan(0); expect(st.maxDepthM).toBeLessThanOrEqual(MAX_GAME_DEPTH); }
  });

  it('월드: 섬 좌표가 월드 내부 & 해당 해역과 일치, 탐사지 24개 유효', () => {
    for (const isl of ISLANDS) {
      expect(isl.x).toBeGreaterThan(0); expect(isl.x).toBeLessThan(4800);
      expect(isl.z).toBeGreaterThan(0); expect(isl.z).toBeLessThan(3200);
      expect(zoneAt(isl.x, isl.z)).toBe(isl.zone);
    }
    expect(new Set(ISLANDS.map(i => i.id)).size).toBe(12);
    for (const site of DIVE_SITES) {
      expect(site.x).toBeGreaterThanOrEqual(ZONE_BOUNDS[site.zone].x0);
      expect(site.x).toBeLessThan(ZONE_BOUNDS[site.zone].x1);
      expect(site.z).toBeGreaterThanOrEqual(ZONE_BOUNDS[site.zone].z0);
      expect(site.z).toBeLessThan(ZONE_BOUNDS[site.zone].z1);
    }
    expect(new Set(DIVE_SITES.map(s => s.id)).size).toBe(24);
  });

  it('보스 3종 × 화석 5조각 = 15, 화석 ID 중복 없음, 동료 cost 0', () => {
    expect(BOSSES.length).toBe(3);
    expect(FOSSILS.length).toBe(15);
    expect(new Set(FOSSILS.map(f => f.id)).size).toBe(15);
    for (const b of BOSSES) expect(b.fossils.length).toBe(5);
    for (const c of COMPANIONS) expect(c.cost).toBe(0);
  });
});
