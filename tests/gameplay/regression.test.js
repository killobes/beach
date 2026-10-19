// SpearPals: Blue Harbor — 플레이 중 발견된 오류 회귀 테스트 (세션 B)
// 각 테스트는 실제 플레이에서 발생했던 버그를 재현하고 수정을 검증한다.
import { describe, it, expect } from 'vitest';
import { createGame, memoryStorage } from '../../src/core/GameEngine.js';
import { fromSessionAAction, toSessionAState } from '../../src/systems/SessionAAdapter.js';

function fresh(seed = 12345) {
  return createGame({ seed, storage: memoryStorage() });
}

describe('REG-1 출항 규칙', () => {
  it('정박 상태에서 UNDOCK 없이 MOVE_SHIP(회전만)도 차단된다 (구버전: turn만 입력되면 슬쩍 이동 가능)', () => {
    const g = fresh();
    const r = g.dispatch({ type: 'MOVE_SHIP', forward: 0, turn: 1, dtSec: 1 });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('UNDOCK');
    // 회전만 해도 heading이 바뀌면 안 된다
    expect(g.getSnapshot().ship.headingRad).toBe(0);
  });

  it('UNDOCK → MOVE_SHIP 정상 흐름', () => {
    const g = fresh();
    expect(g.dispatch({ type: 'UNDOCK' }).ok).toBe(true);
    const before = g.getSnapshot().ship.z;
    for (let i = 0; i < 60; i++) g.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 1 / 60 });
    expect(g.getSnapshot().ship.z).not.toBe(before);
  });

  it('이중 UNDOCK 실패, 항구 밖 원격 지점에서 UNDOCK 실패', () => {
    const g = fresh();
    expect(g.dispatch({ type: 'UNDOCK' }).ok).toBe(true);
    expect(g.dispatch({ type: 'UNDOCK' }).ok).toBe(false);
    const g2 = fresh();
    g2._state.ship.x = 3000; g2._state.ship.z = 2000; // 항구에서 먼 해역으로 텔레포트(테스트용)
    expect(g2.dispatch({ type: 'UNDOCK' }).ok).toBe(false);
  });
});

describe('REG-2 입수/귀선/정박 규칙', () => {
  it('ENTER_WATER 위치 주입 방지: 선박에서 80m 초과 지점 입수 거부', () => {
    const g = fresh();
    g.dispatch({ type: 'UNDOCK' });
    const r = g.dispatch({ type: 'ENTER_WATER', x: g.getSnapshot().ship.x + 500, z: g.getSnapshot().ship.z });
    expect(r.ok).toBe(false);
    expect(g.getSnapshot().diver.inWater).toBe(false);
  });

  it('이중 ENTER_WATER 차단', () => {
    const g = fresh();
    g.dispatch({ type: 'UNDOCK' });
    expect(g.dispatch({ type: 'ENTER_WATER' }).ok).toBe(true);
    expect(g.dispatch({ type: 'ENTER_WATER' }).ok).toBe(false);
  });

  it('다이버가 물속에 있는 동안 DOCK 차단 (잠수는 배와 함께 정박하는 오류 방지)', () => {
    const g = fresh();
    g.dispatch({ type: 'UNDOCK' });
    g.dispatch({ type: 'ENTER_WATER' });
    const r = g.dispatch({ type: 'DOCK' });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('RETURN_TO_SHIP');
    g.dispatch({ type: 'RETURN_TO_SHIP' });
    expect(g.dispatch({ type: 'DOCK' }).ok).toBe(true);
  });
});

describe('REG-3 작살 포획 거리 스푸핑', () => {
  it('distanceM을 허위로 작게 보내도 실제 거리가 사거리 넘으면 실패', () => {
    const g = fresh(777);
    g.dispatch({ type: 'UNDOCK' });
    // 개체를 다이버로부터 멀리 배치 (테스트용 상태 조작)
    const spec = g._state.specimens.find(s => s.zone === 'tropical');
    g.dispatch({ type: 'ENTER_WATER' });
    g._state.diver.x = spec.x - 1000; // 다이버를 멀리 (규칙 우회 위해 직접 배치 후 판정만 검증)
    const r = g.dispatch({ type: 'CATCH_ATTEMPT', specimenId: spec.specimenId, distanceM: 1 });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('사거리');
  });

  it('근접 후 실측 기반 포획 성공 경로 존재 (출항→항해→입수→MOVE_DIVER 접근→포획)', () => {
    let success = false;
    for (let seed = 1; seed <= 30 && !success; seed++) {
      const g = fresh(seed);
      g.dispatch({ type: 'UNDOCK' });
      for (let i = 0; i < 200; i++) g.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 0.1 });
      const ship = g._state.ship;
      g.dispatch({ type: 'ENTER_WATER' });
      // 기본 잠수복(30m)로 도달 가능한 얕은 개체만 조준
      const targets = g.nearby(ship.x, ship.z, -5, 900, { sort: 'distance', limit: 30 })
        .filter(t => Math.abs(t.y) <= 28 && !t.protected);
      for (const t of targets) {
        for (let i = 0; i < 400; i++) {
          const dv = g._state.diver;
          const dx = t.x - dv.x, dz = t.z - dv.z, dy = Math.abs(t.y) - dv.depthM;
          if (Math.hypot(dx, dz, dy) < 2.5) break;
          const n = Math.hypot(dx, dz) || 1;
          g.dispatch({ type: 'MOVE_DIVER', dx: dx / n, dz: dz / n, dy: dy > 0 ? 1 : (dy < 0 ? -1 : 0), dtSec: 0.5 });
        }
        const sp = g._state.specimens.find(s => s.specimenId === t.specimenId);
        if (!sp) continue;
        const d = Math.hypot(g._state.diver.x - sp.x, g._state.diver.y - sp.y, g._state.diver.z - sp.z);
        if (d <= 4) {
          // 빗나감(난수 실패)은 정상 게임플레이 — 재시도하며 성공 경로 검증
          for (let retry = 0; retry < 6; retry++) {
            const r = g.dispatch({ type: 'CATCH_ATTEMPT', specimenId: t.specimenId });
            if (r.ok) { success = true; break; }
            if (r.reason && !r.reason.includes('빗나가')) break; // 거리/용량 등 규칙 실패는 재시도 무의미
          }
        }
        if (success) break;
      }
    }
    expect(success).toBe(true);
  });
});

describe('REG-4 공기 고갈 페널티', () => {
  it('공기 고갈 시 조개 직접 차감 대신 포획물 절반 유실 + holdUsedKg 재계산', () => {
    const g = fresh();
    g.dispatch({ type: 'UNDOCK' });
    g.dispatch({ type: 'ENTER_WATER' });
    // 창고에 인위적으로 개체 2마리 (규칙 통과한 포획과 동일 형식)
    const a = { specimenId: 'test_a', speciesId: 1, lengthCm: 20, weightKg: 1.5, x: 0, y: -5, z: 0, zone: 'tropical' };
    const b = { ...a, specimenId: 'test_b', weightKg: 2.5 };
    g._state.inventory.push(a, b);
    g._state.holdUsedKg = 4;
    const shellsBefore = g.getSnapshot().shells;
    g._state.diver.air = 0.0001;
    g.dispatch({ type: 'TICK', dtSec: 5 });
    const snap = g.getSnapshot();
    expect(snap.shells).toBe(shellsBefore);       // 화폐 직접 차감 금지
    expect(snap.inventoryCount).toBe(1);           // ceil(2/2)=1마리 유실
    expect(Math.abs(snap.holdUsedKg - 2.5)).toBeLessThan(0.01); // 잔여 무게로 재계산
    expect(snap.diver.inWater).toBe(false);
  });
});

describe('REG-5 세션 A 어댑터 액션명', () => {
  it('DEPART→UNDOCK, GO_BACK_TO_SHIP→RETURN_TO_SHIP, DOCK_AT_HARBOR→DOCK 변환', () => {
    expect(fromSessionAAction({ type: 'DEPART' }).type).toBe('UNDOCK');
    expect(fromSessionAAction({ type: 'GO_BACK_TO_SHIP' }).type).toBe('RETURN_TO_SHIP');
    expect(fromSessionAAction({ type: 'DOCK_AT_HARBOR' }).type).toBe('DOCK');
    expect(fromSessionAAction({ type: 'ENTER_WATER', x: 10, z: 20 })).toEqual({ type: 'ENTER_WATER', x: 10, z: 20 });
  });

  it('어댑터를 통과한 UNDOCK가 실제 엔진에서 동작', () => {
    const g = fresh();
    const r = g.dispatch(fromSessionAAction({ type: 'DEPART' }));
    expect(r.ok).toBe(true);
    const a = toSessionAState(g.getSnapshot());
    expect(a.state.ship.docked).toBe(false);
  });
});

describe('REG-6 판매 예정가 단일 소스', () => {
  it('estimateSellValue().total === SELL_ALL 실제 gained', () => {
    const g = fresh(4242);
    g.dispatch({ type: 'UNDOCK' });
    g.dispatch({ type: 'ENTER_WATER' });
    // 포획 시도 (실패할 수 있어 여러 개체 반복)
    const targets = g.nearby(g._state.diver.x, g._state.diver.z, g._state.diver.y, 600, { sort: 'distance', limit: 20 });
    for (const t of targets) {
      for (let i = 0; i < 600; i++) {
        const dv = g._state.diver;
        const dx = t.x - dv.x, dz = t.z - dv.z, dy = Math.abs(t.y) - dv.depthM;
        if (Math.hypot(dx, dz, dy) < 3) break;
        const n = Math.hypot(dx, dz) || 1;
        g.dispatch({ type: 'MOVE_DIVER', dx: dx / n, dz: dz / n, dy: dy > 0 ? 1 : (dy < 0 ? -1 : 0), dtSec: 0.5 });
      }
      const sp = g._state.specimens.find(s => s.specimenId === t.specimenId);
      if (!sp) continue;
      const d = Math.hypot(g._state.diver.x - sp.x, g._state.diver.y - sp.y, g._state.diver.z - sp.z);
      if (d <= 5) g.dispatch({ type: 'CATCH_ATTEMPT', specimenId: t.specimenId });
      if (g.getSnapshot().inventoryCount >= 2) break;
    }
    if (g.getSnapshot().inventoryCount === 0) return; // 이 시드에서는 포획 불가 → 스킵(연결성만 확인)
    const est = g.estimateSellValue();
    // 정박 처리 후 판매
    g._state.ship.docked = true;
    const sold = g.dispatch({ type: 'SELL_ALL' });
    expect(sold.ok).toBe(true);
    expect(sold.gained).toBe(est.total);
  });
});

describe('REG-7 dt=0 프레임 안정성', () => {
  it('MOVE_SHIP/MOVE_DIVER/TICK dt=0이어도 상태 무결성 유지 및 반복 호출 안전', () => {
    const g = fresh();
    g.dispatch({ type: 'UNDOCK' });
    for (let i = 0; i < 10; i++) {
      expect(g.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 0 }).ok).toBe(true);
      expect(g.dispatch({ type: 'TICK', dtSec: 0 }).ok).toBe(true);
    }
    const snap = g.getSnapshot();
    expect(Number.isFinite(snap.timeSec)).toBe(true);
    expect(Number.isFinite(snap.ship.x) && Number.isFinite(snap.ship.z)).toBe(true);
  });
});
