// SpearPals: Blue Harbor — 통합 시나리오 테스트: 출항 → 항해 → 잠수 → 포획 → 귀선 → 판매 → 업그레이드
import { describe, it, expect } from 'vitest';
import { createGame, memoryStorage } from '../../src/core/GameEngine.js';
import { toSessionAState, fromSessionAAction } from '../../src/systems/SessionAAdapter.js';

function depart(game) {
  game._state.ship.docked = false; // 기항지에서 출항 처리 (세션 A의 UNDOCK 상당)
  for (let i = 0; i < 60; i++) {
    const r = game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 1 });
    if (r.ok && Math.hypot(game._state.ship.x - 755, game._state.ship.z - 1780) > 200) return true;
  }
  return false;
}

describe('실전 플레이 루프 (시드 고정)', () => {
  it('출항 → 잠수 → 포획 → 귀선 → 재입수 → 판매全流程', () => {
    const game = createGame({ seed: 777 });
    // 1) 정박 중 MOVE_SHIP 차단 확인
    expect(game.dispatch({ type: 'MOVE_SHIP', forward: 1, dtSec: 1 }).ok).toBe(false);
    // 2) 출항
    expect(depart(game)).toBe(true);
    const shipPos = { x: game._state.ship.x, z: game._state.ship.z };
    expect(shipPos.x).toBeGreaterThan(0);
    // 3) 입수
    const enter = game.dispatch({ type: 'ENTER_WATER' });
    expect(enter.ok).toBe(true);
    // 4) 주변 생물 탐색 후 포획 시도 (사거리 내로 접근)
    let caught = null;
    const specs = game.getSpecimens();
    for (const target of specs.slice(0, 20)) {
      const dv = game._state.diver;
      dv.x = target.x; dv.z = target.z; dv.y = target.y; dv.depthM = Math.abs(target.y);
      for (let i = 0; i < 15 && !caught; i++) {
        const r = game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: target.specimenId, distanceM: 4 });
        if (r.ok) caught = r.specimen;
        else if (r.reason !== '빗나갔습니다.') break;
      }
      if (caught) break;
    }
    expect(caught).toBeTruthy();
    expect(game.getSnapshot().inventory.length).toBe(1);
    expect(game.getSnapshot().holdUsedKg).toBeCloseTo(caught.weightKg);
    // 5) 귀선 (다이버를 배 근처로 이동)
    game._state.diver.x = game._state.ship.x; game._state.diver.z = game._state.ship.z;
    expect(game.dispatch({ type: 'RETURN_TO_SHIP' }).ok).toBe(true);
    // 6) 산소 회복 없이 재입수 가능 확인
    expect(game.dispatch({ type: 'ENTER_WATER' }).ok).toBe(true);
    game.dispatch({ type: 'RETURN_TO_SHIP' });
    // 7) 항구 귀환 → 정박 → 판매
    game._state.ship.x = 755; game._state.ship.z = 1780;
    expect(game.dispatch({ type: 'DOCK' }).ok).toBe(true);
    const before = game.getSnapshot().shells;
    const sold = game.dispatch({ type: 'SELL_ALL' });
    expect(sold.ok).toBe(true);
    expect(sold.gained).toBeGreaterThan(0);
    expect(game.getSnapshot().shells).toBe(before + sold.gained);
    expect(game.getSnapshot().inventory.length).toBe(0);
    expect(game.getSnapshot().holdUsedKg).toBe(0);
  });

  it('포획 → 도감 갱신 → 관찰 기록 유지', () => {
    const game = createGame({ seed: 778 });
    depart(game);
    game.dispatch({ type: 'ENTER_WATER' });
    const target = game.getSpecimens()[0];
    const dv = game._state.diver;
    dv.x = target.x; dv.z = target.z; dv.y = target.y; dv.depthM = Math.abs(target.y);
    let okCatch = false;
    for (let i = 0; i < 20 && !okCatch; i++) {
      const r = game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: target.specimenId, distanceM: 3 });
      okCatch = r.ok || r.reason !== '빗나갔습니다.';
    }
    const snap = game.getSnapshot();
    const e = snap.codex[target.speciesId];
    expect(e).toBeTruthy();
    expect(e.firstSeenSec).not.toBeNull();
    expect(e.zones.length).toBeGreaterThanOrEqual(1);
  });

  it('장비 구매 → 장착 → 사거리 증가 확인', () => {
    const game = createGame({ seed: 779 });
    game._state.shells = 5000;
    game._state.ship.level = 2; // sp05 해금 조건(Lv2) 충족 후 구매
    expect(game.dispatch({ type: 'BUY_ITEM', kind: 'spear', itemId: 'sp05' }).ok).toBe(true);
    expect(game.dispatch({ type: 'EQUIP_ITEM', kind: 'spear', itemId: 'sp05' }).ok).toBe(true);
    const sp = game.getSnapshot().equipment.equippedSpear;
    expect(sp).toBe('sp05');
    // sp01 rangeM=6 → sp05 rangeM=10: 8m 거리는 이제 유효
    depart(game);
    game.dispatch({ type: 'ENTER_WATER' });
    const t = game.getSpecimens()[0];
    const dv = game._state.diver;
    dv.x = t.x; dv.z = t.z; dv.y = t.y; dv.depthM = Math.abs(t.y);
    const far = game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: t.specimenId, distanceM: 8 });
    expect(far.reason ?? '').not.toContain('사거리');
  });

  it('저장 → 불러오기 후 루프 재개 동일 동작', () => {
    const storage = memoryStorage();
    const g1 = createGame({ seed: 801, storage });
    depart(g1);
    g1.dispatch({ type: 'TICK', dtSec: 120 });
    g1._state.shells = 777;
    expect(g1.save().ok).toBe(true);
    const g2 = createGame({ seed: 1, storage });
    expect(g2.load().ok).toBe(true);
    expect(g2.getSnapshot().shells).toBe(777);
    expect(JSON.stringify(g2.getSnapshot())).toBe(JSON.stringify(g1.getSnapshot()));
    // 이어플레이: 정박→판매 흐름이 깨지지 않음
    g2._state.inventory.push({ specimenId: 'x1', speciesId: 1, lengthCm: 8, weightKg: 0.025 });
    g2._state.ship.x = 755; g2._state.ship.z = 1780; g2._state.ship.docked = true;
    expect(g2.dispatch({ type: 'SELL_ALL' }).ok).toBe(true);
  });

  it('세션 A 형식 왕복: 어댑터 스냅샷 state.ship.position 보유', () => {
    const game = createGame({ seed: 802 });
    depart(game);
    const a = toSessionAState(game.getSnapshot());
    expect(a.state.ship.position).toEqual({ x: game._state.ship.x, y: 0, z: game._state.ship.z });
    const converted = fromSessionAAction({ type: 'MOVE_SHIP', shipX: 1, shipZ: 0 });
    expect(converted.type).toBe('MOVE_SHIP');
    expect(typeof converted.dtSec).toBe('number');
  });

  it('날씨 결정론성: 같은 시드+같은 TICK 수 → 같은 날씨', () => {
    const run = () => {
      const g = createGame({ seed: 803 });
      for (let i = 0; i < 200; i++) g.dispatch({ type: 'TICK', dtSec: 3 });
      return g.getSnapshot().weather;
    };
    expect(run()).toBe(run());
  });

  it('nearby(): 거리순 정렬 및 radius 필터', () => {
    const game = createGame({ seed: 804 });
    const st = game._state;
    st.specimens = [];
    st.specimens.push({ specimenId: 'n1', speciesId: 1, lengthCm: 8, weightKg: 0.01, x: 10, z: 0, y: -1, zone: 'tropical' });
    st.specimens.push({ specimenId: 'n2', speciesId: 1, lengthCm: 8, weightKg: 0.01, x: 90, z: 0, y: -1, zone: 'tropical' });
    st.specimens.push({ specimenId: 'n3', speciesId: 1, lengthCm: 8, weightKg: 0.01, x: 500, z: 0, y: -1, zone: 'open_ocean' });
    const list = game.nearby(0, 0, -1, 100, { sort: 'distance' });
    expect(list.map(n => n.specimenId)).toEqual(['n1', 'n2']);
    expect(list[0].distanceM).toBeLessThan(list[1].distanceM);
  });
});
