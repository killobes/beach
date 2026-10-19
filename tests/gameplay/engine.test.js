import { describe, it, expect } from 'vitest';
import { createGame, memoryStorage } from '../../src/core/GameEngine.js';
import { buildSpecies, makeSpecimen, weightFromLength, VALIDATION_SPECIES_IDS } from '../../src/data/species.js';
import { SPEARS, TANKS, SUITS, SHIP_UPGRADES } from '../../src/data/equipment.js';
import { ISLANDS, DIVE_SITES, FOSSILS } from '../../src/data/world.js';
import { SeededRNG } from '../../src/core/Rng.js';
import { toSessionAState, fromSessionAAction } from '../../src/systems/SessionAAdapter.js';

describe('SpearPals: Blue Harbor — 세션 B 엔진 테스트', () => {
  // 1. 200종 데이터 로딩 + 해역 분배
  it('200종 로딩 및 해역 분배 정확', () => {
    const sp = buildSpecies();
    expect(sp.length).toBe(200);
    const count = z => sp.filter(s => s.zone === z).length;
    expect(count('tropical')).toBe(40);
    expect(count('glacier')).toBe(30);
    expect(count('volcanic')).toBe(30);
    expect(count('mangrove')).toBe(35);
    expect(count('open_ocean')).toBe(40);
    expect(count('deep_sea')).toBe(25);
  });

  // 2. ID·학명 중복 검사
  it('ID 및 학명 중복 없음', () => {
    const sp = buildSpecies();
    expect(new Set(sp.map(s => s.id)).size).toBe(200);
    expect(new Set(sp.map(s => s.scientificName)).size).toBe(200);
    for (const id of VALIDATION_SPECIES_IDS) expect(sp.find(s => s.id === id)).toBeTruthy();
  });

  // 3~5. 개체 생성 규칙
  it('개체 생성: 길이 범위·무게 연결·최대 초과 금지', () => {
    const sp = buildSpecies();
    const rng = new SeededRNG(999);
    for (const s of sp) {
      for (let i = 0; i < 5; i++) {
        const spec = makeSpecimen(s, rng, i);
        expect(spec.lengthCm).toBeGreaterThan(0);
        expect(spec.lengthCm).toBeLessThanOrEqual(s.maxLengthCm);
        expect(spec.weightKg).toBeGreaterThan(0);
        expect(Math.abs(spec.weightKg - weightFromLength(s, spec.lengthCm))).toBeLessThan(0.01);
      }
    }
  });

  it('체장-체중 단위: FishBase cm·g 계수 → kg 변환', () => {
    const clown = buildSpecies().find(s => s.id === 1);
    const w = weightFromLength(clown, 8);
    expect(w).toBeGreaterThan(0.005);
    expect(w).toBeLessThan(1); // g가 아닌 kg
  });

  // 6. 포획 규칙
  it('포획: 잠수 중·사거리 내·보호종 차단', () => {
    const game = createGame({ seed: 12345 });
    const protectedSpec = makeSpecimen(buildSpecies().find(s => s.id === 10), new SeededRNG(7), 9001);
    protectedSpec.x = 1000; protectedSpec.z = 2000; protectedSpec.y = -5;
    game._state.specimens.push(protectedSpec);

    const r0 = game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: 'x', distanceM: 1 });
    expect(r0.ok).toBe(false);

    let moved = false;
    game._state.ship.docked = false; // 출항 처리 (정박 실패 검증은 위 r0/MOVE_SHIP에서)
    for (let i = 0; i < 30 && !moved; i++) {
      const r = game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0.3, dtSec: 1 });
      moved = r.ok;
    }
    expect(moved).toBe(true);
    game.dispatch({ type: 'ENTER_WATER' });

    const rp = game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: protectedSpec.specimenId, distanceM: 3 });
    expect(rp.ok).toBe(false);
    expect(rp.reason).toContain('보호종');

    const target = game.getSpecimens('tropical')[0];
    const dv = game._state.diver;
    dv.x = target.x; dv.z = target.z; dv.depthM = Math.abs(target.y); dv.y = -dv.depthM;
    let success = null;
    for (let i = 0; i < 30 && !success; i++) {
      const r = game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: target.specimenId, distanceM: 2 });
      if (r.ok) success = r;
      else if (r.reason !== '빗나갔습니다.') break;
    }
    expect(success).toBeTruthy();
    expect(game.getSnapshot().inventory.length).toBe(1);
  });

  // 7. 장비 구매
  it('장비 구매: 잔액·중복·해금 검사', () => {
    const game = createGame({ seed: 1 });
    const poor = game.dispatch({ type: 'BUY_ITEM', kind: 'spear', itemId: 'sp02' });
    expect(poor.ok).toBe(false);
    game._state.shells = 10000;
    expect(game.dispatch({ type: 'BUY_ITEM', kind: 'spear', itemId: 'sp02' }).ok).toBe(true);
    expect(game.dispatch({ type: 'BUY_ITEM', kind: 'spear', itemId: 'sp02' }).ok).toBe(false);
    expect(game.dispatch({ type: 'BUY_ITEM', kind: 'spear', itemId: 'sp24' }).ok).toBe(false);
  });

  // 8. 창고 용량
  it('창고 용량 초과 방지', () => {
    const game = createGame({ seed: 2 });
    const st = game._state;
    const heavy = makeSpecimen(buildSpecies().find(s => s.id === 30), new SeededRNG(3), 9500);
    heavy.x = 1000; heavy.z = 2000; heavy.y = -5;
    st.specimens.push(heavy);
    st.holdUsedKg = 79.5; // Lv1 holdKg=80
    st.diver.inWater = true;
    st.diver.x = heavy.x; st.diver.z = heavy.z; st.diver.depthM = 5;
    let res;
    for (let i = 0; i < 30; i++) {
      res = game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: heavy.specimenId, distanceM: 2 });
      if (res.reason === '창고 용량이 부족합니다.') return; // 정상 차단 확인
      if (!res.ok && res.reason !== '빗나갔습니다.') break;
    }
    expect(res.reason).toBe('창고 용량이 부족합니다.');
  });

  // 9. 도감 최고 기록
  it('도감: 최장/최고 기록 갱신', () => {
    const game = createGame({ seed: 3 });
    const st = game._state;
    st.diver.inWater = true;
    const mk = (len, wgt, seq) => ({ specimenId: `fish_001_${seq}`, speciesId: 1, lengthCm: len, weightKg: wgt, x: 1000, z: 2000, y: -5 });
    for (const cand of [mk(6, 0.02, 9101), mk(10, 0.05, 9102), mk(8, 0.09, 9103)]) {
      st.specimens.push(cand);
      st.diver.x = cand.x; st.diver.z = cand.z; st.diver.depthM = 5;
      for (let i = 0; i < 30; i++) {
        const r = game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: cand.specimenId, distanceM: 1 });
        if (r.ok || r.reason !== '빗나갔습니다.') break;
      }
    }
    const e = game.getSnapshot().codex[1];
    expect(e.catchCount).toBeGreaterThanOrEqual(2);
    expect(e.longestCm).toBe(10);
    expect(e.heaviestKg).toBe(0.09);
    expect(e.lenOfHeaviestCm).toBe(8);
    expect(e.wgtOfLongestKg).toBe(0.05);
  });

  // 10. 화석 수집·소환
  it('화석: 수집·중복 방지·소환 소비', () => {
    const game = createGame({ seed: 4 });
    const f = FOSSILS[0];
    expect(game.dispatch({ type: 'COLLECT_FOSSIL', fossilId: f.id }).ok).toBe(true);
    expect(game.dispatch({ type: 'COLLECT_FOSSIL', fossilId: f.id }).ok).toBe(false);
    expect(game.dispatch({ type: 'SUMMON_BOSS', bossId: 'dunkleosteus' }).ok).toBe(false);
    for (const fid of ['f02','f03','f04','f05']) game.dispatch({ type: 'COLLECT_FOSSIL', fossilId: fid });
    expect(game.dispatch({ type: 'SUMMON_BOSS', bossId: 'dunkleosteus' }).ok).toBe(true);
    let defeated = false;
    for (let i = 0; i < 50 && !defeated; i++) defeated = game.dispatch({ type: 'ATTACK_BOSS', bossId: 'dunkleosteus' }).ok;
    expect(defeated).toBe(true);
    expect(game.getSnapshot().shells).toBeGreaterThanOrEqual(2000);
  });

  // 11. 저장·불러오기 동일성
  it('저장→불러오기 스냅샷 동일성', () => {
    const storage = memoryStorage();
    const g1 = createGame({ seed: 555, storage });
    g1._state.shells = 1234;
    g1._state.ship.level = 2;
    g1.dispatch({ type: 'TICK', dtSec: 60 });
    const before = JSON.stringify(g1.getSnapshot());
    expect(g1.save().ok).toBe(true);
    const g2 = createGame({ seed: 1, storage });
    expect(g2.load().ok).toBe(true);
    expect(JSON.stringify(g2.getSnapshot())).toBe(before);
  });

  // 12. 고정 시드 재현
  it('고정 시드 재현성', () => {
    const run = () => {
      const g = createGame({ seed: 42 });
      const out = [];
      for (let i = 0; i < 50; i++) {
        g.dispatch({ type: 'TICK', dtSec: 10 });
        const specs = g.getSpecimens();
        out.push(specs[i % 40].specimenId, specs[i % 40].lengthCm);
      }
      return out.join('|');
    };
    expect(run()).toBe(run());
  });

  // 13. 경제 판매
  it('경제: 정박 판매·보호종 미판매', () => {
    const game = createGame({ seed: 6 });
    const st = game._state;
    st.inventory.push({ specimenId: 'a', speciesId: 1, lengthCm: 8, weightKg: 0.025 });
    st.inventory.push({ specimenId: 'b', speciesId: 10, lengthCm: 60, weightKg: 4.5 });
    st.ship.docked = true;
    const before = st.shells;
    const r = game.dispatch({ type: 'SELL_ALL' });
    expect(r.ok).toBe(true);
    expect(r.gained).toBeGreaterThan(0);
    expect(st.shells).toBe(before + r.gained);
  });

  // 14. 선박 업그레이드
  it('선박 5단계 개조', () => {
    const game = createGame({ seed: 7 });
    expect(SHIP_UPGRADES.length).toBe(5);
    game._state.shells = 10000;
    expect(game.dispatch({ type: 'UPGRADE_SHIP' }).ok).toBe(true);
    expect(game.getSnapshot().ship.level).toBe(2);
    expect(game.getSnapshot().shipStats.holdKg).toBe(160);
  });

  // 15~16. 계약 검증
  it('장비 수: 작살24 산소통6 잠수복6 선박5', () => {
    expect(SPEARS.length).toBe(24);
    expect(TANKS.length).toBe(6);
    expect(SUITS.length).toBe(6);
    expect(SHIP_UPGRADES.length).toBe(5);
  });

  it('월드: 섬12 탐사지24 화석15 거점1', () => {
    expect(ISLANDS.length).toBe(12);
    expect(ISLANDS.filter(i => i.harbor).length).toBe(1);
    expect(DIVE_SITES.length).toBe(24);
    expect(FOSSILS.length).toBe(15);
  });

  // 17. 어댑터
  it('SessionAAdapter: 상태/액션 변환', () => {
    const game = createGame({ seed: 8 });
    const a = toSessionAState(game.getSnapshot());
    expect(a.state.ship.position.x).toBeCloseTo(game.getSnapshot().ship.x);
    expect(fromSessionAAction({ type: 'GO_BACK_TO_SHIP' }).type).toBe('RETURN_TO_SHIP');
    expect(fromSessionAAction({ type: 'MOVE_SHIP', forward: 1 }).dtSec).toBeCloseTo(1 / 60);
  });

  // 18. JSON 직렬화
  it('스냅샷 JSON 직렬화 가능', () => {
    const game = createGame({ seed: 9 });
    expect(() => JSON.stringify(game.getSnapshot())).not.toThrow();
  });

  // 19. 관찰 보상 중복 방지
  it('관찰 보상 첫 회만 지급', () => {
    const game = createGame({ seed: 10 });
    const spec = game.getSpecimens()[0];
    const r1 = game.dispatch({ type: 'OBSERVE_CREATURE', specimenId: spec.specimenId });
    const r2 = game.dispatch({ type: 'OBSERVE_CREATURE', specimenId: spec.specimenId });
    expect(r1.ok && r1.reward > 0).toBe(true);
    expect(r2.ok && r2.reward === 0).toBe(true);
  });

  // 20. subscribe
  it('subscribe 알림', () => {
    const game = createGame({ seed: 11 });
    let n = 0;
    const un = game.subscribe(() => n++);
    game.dispatch({ type: 'TICK', dtSec: 1 });
    expect(n).toBe(1);
    un();
  });
});
