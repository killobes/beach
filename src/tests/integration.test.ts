// OCEAN GAIA V3.2 — Integration Tests (Session A ↔ Session B)
// 세션 A의 3D 렌더링과 세션 B의 게임 엔진 통합 검증

import { createGame, type GameState } from '../core/GameEngine';
import { SPECIES_BY_ID } from '../data/species';
import { WORLD_CONFIG } from '../data/world';

export interface IntegrationTestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runIntegrationTests(): IntegrationTestResult[] {
  const results: IntegrationTestResult[] = [];

  results.push(test1_ContractInterface());
  results.push(test2_SnapshotSerialization());
  results.push(test3_PositionBounds());
  results.push(test4_CreatureDataIntegrity());
  results.push(test5_ActionResponseTime());
  results.push(test6_StateConsistency());
  results.push(test7_SaveLoadCycle());
  results.push(test8_EdgeCaseHandling());
  results.push(test9_ConcurrentActions());
  results.push(test10_MockRendererSync());

  return results;
}

function test1_ContractInterface(): IntegrationTestResult {
  try {
    const game = createGame({ seed: 12345 });
    if (typeof game.dispatch !== 'function') return { name: '1. 계약 인터페이스', passed: false, message: 'dispatch not a function' };
    if (typeof game.getSnapshot !== 'function') return { name: '1. 계약 인터페이스', passed: false, message: 'getSnapshot not a function' };
    if (typeof game.subscribe !== 'function') return { name: '1. 계약 인터페이스', passed: false, message: 'subscribe not a function' };
    if (typeof game.save !== 'function') return { name: '1. 계약 인터페이스', passed: false, message: 'save not a function' };
    if (typeof game.load !== 'function') return { name: '1. 계약 인터페이스', passed: false, message: 'load not a function' };

    const result = game.dispatch({ type: 'TICK', dtSec: 1 / 60 });
    if (typeof result.success !== 'boolean') return { name: '1. 계약 인터페이스', passed: false, message: 'dispatch result missing success' };

    const snapshot = game.getSnapshot();
    if (!snapshot.version) return { name: '1. 계약 인터페이스', passed: false, message: 'snapshot missing version' };
    if (typeof snapshot.shipX !== 'number') return { name: '1. 계약 인터페이스', passed: false, message: 'snapshot missing shipX' };
    if (!Array.isArray(snapshot.activeSpecimens)) return { name: '1. 계약 인터페이스', passed: false, message: 'snapshot missing activeSpecimens' };

    return { name: '1. 계약 인터페이스', passed: true, message: 'Contract interface verified' };
  } catch (e) {
    return { name: '1. 계약 인터페이스', passed: false, message: `Failed: ${e}` };
  }
}

function test2_SnapshotSerialization(): IntegrationTestResult {
  try {
    const game = createGame({ seed: 42 });
    for (let i = 0; i < 100; i++) game.dispatch({ type: 'TICK', dtSec: 1 / 30 });

    const snapshot1 = game.getSnapshot();
    const json = JSON.stringify(snapshot1);
    const snapshot2 = JSON.parse(json);

    if (snapshot1.shipX !== snapshot2.shipX) return { name: '2. 스냅샷 직렬화', passed: false, message: 'shipX mismatch' };
    if (snapshot1.shells !== snapshot2.shells) return { name: '2. 스냅샷 직렬화', passed: false, message: 'shells mismatch' };
    if (snapshot1.activeSpecimens.length !== snapshot2.activeSpecimens.length) return { name: '2. 스냅샷 직렬화', passed: false, message: 'specimens length mismatch' };

    return { name: '2. 스냅샷 직렬화', passed: true, message: 'Snapshot serialization verified' };
  } catch (e) {
    return { name: '2. 스냅샷 직렬화', passed: false, message: `Failed: ${e}` };
  }
}

function test3_PositionBounds(): IntegrationTestResult {
  try {
    const game = createGame({ seed: 99 });
    for (let i = 0; i < 1000; i++) game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 1 });

    const snapshot = game.getSnapshot();
    if (snapshot.shipX < 0 || snapshot.shipX > WORLD_CONFIG.widthM) return { name: '3. 위치 경계', passed: false, message: `shipX out of bounds: ${snapshot.shipX}` };
    if (snapshot.shipZ < 0 || snapshot.shipZ > WORLD_CONFIG.heightM) return { name: '3. 위치 경계', passed: false, message: `shipZ out of bounds: ${snapshot.shipZ}` };

    return { name: '3. 위치 경계', passed: true, message: 'Position bounds verified' };
  } catch (e) {
    return { name: '3. 위치 경계', passed: false, message: `Failed: ${e}` };
  }
}

function test4_CreatureDataIntegrity(): IntegrationTestResult {
  try {
    const game = createGame({ seed: 42 });
    for (let i = 0; i < 120; i++) game.dispatch({ type: 'TICK', dtSec: 1 });

    const snapshot = game.getSnapshot();
    for (const spec of snapshot.activeSpecimens) {
      const species = SPECIES_BY_ID.get(spec.speciesId);
      if (!species) return { name: '4. 생물 데이터', passed: false, message: `Unknown species: ${spec.speciesId}` };
      if (spec.lengthCm <= 0) return { name: '4. 생물 데이터', passed: false, message: `Invalid length: ${spec.lengthCm}` };
      if (spec.weightKg <= 0) return { name: '4. 생물 데이터', passed: false, message: `Invalid weight: ${spec.weightKg}` };
    }

    return { name: '4. 생물 데이터', passed: true, message: 'Creature data integrity verified' };
  } catch (e) {
    return { name: '4. 생물 데이터', passed: false, message: `Failed: ${e}` };
  }
}

function test5_ActionResponseTime(): IntegrationTestResult {
  try {
    const game = createGame({ seed: 42 });
    const iterations = 1000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) game.dispatch({ type: 'TICK', dtSec: 1 / 60 });

    const elapsed = performance.now() - start;
    const avgTime = elapsed / iterations;

    if (avgTime > 16) return { name: '5. 응답 시간', passed: false, message: `Too slow: ${avgTime.toFixed(2)}ms` };

    return { name: '5. 응답 시간', passed: true, message: `${avgTime.toFixed(2)}ms avg` };
  } catch (e) {
    return { name: '5. 응답 시간', passed: false, message: `Failed: ${e}` };
  }
}

function test6_StateConsistency(): IntegrationTestResult {
  try {
    const game = createGame({ seed: 42 });
    game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 1 });
    game.dispatch({ type: 'ENTER_WATER' });
    game.dispatch({ type: 'MOVE_DIVER', forward: 1, turn: 0, vertical: -1, dtSec: 1 });
    game.dispatch({ type: 'RETURN_TO_SHIP' });

    const snapshot = game.getSnapshot();
    if (snapshot.inWater) return { name: '6. 상태 일관성', passed: false, message: 'Should not be in water' };
    if (snapshot.diverY !== 0) return { name: '6. 상태 일관성', passed: false, message: 'Diver Y should be 0' };
    if (snapshot.airRemaining < 0 || snapshot.airRemaining > 100) return { name: '6. 상태 일관성', passed: false, message: `Invalid air: ${snapshot.airRemaining}` };

    return { name: '6. 상태 일관성', passed: true, message: 'State consistency verified' };
  } catch (e) {
    return { name: '6. 상태 일관성', passed: false, message: `Failed: ${e}` };
  }
}

function test7_SaveLoadCycle(): IntegrationTestResult {
  try {
    const game = createGame({ seed: 42 });
    for (let i = 0; i < 60; i++) game.dispatch({ type: 'TICK', dtSec: 1 });
    game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0.5, dtSec: 2 });

    const snapshot1 = game.getSnapshot();
    const saveResult = game.save();
    if (!saveResult.success) return { name: '7. 저장/불러오기', passed: false, message: 'Save failed' };

    const loadResult = game.load();
    if (!loadResult.success) return { name: '7. 저장/불러오기', passed: false, message: 'Load failed' };

    const snapshot2 = game.getSnapshot();
    if (snapshot1.shipX !== snapshot2.shipX) return { name: '7. 저장/불러오기', passed: false, message: 'shipX changed' };
    if (snapshot1.shells !== snapshot2.shells) return { name: '7. 저장/불러오기', passed: false, message: 'shells changed' };

    return { name: '7. 저장/불러오기', passed: true, message: 'Save/Load cycle verified' };
  } catch (e) {
    return { name: '7. 저장/불러오기', passed: false, message: `Failed: ${e}` };
  }
}

function test8_EdgeCaseHandling(): IntegrationTestResult {
  try {
    const game = createGame({ seed: 42 });

    const result1 = game.dispatch({ type: 'UNKNOWN_ACTION' });
    if (result1.success) return { name: '8. 엣지 케이스', passed: false, message: 'Unknown action should fail' };

    const result2 = game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: 'fake', distanceM: 5 });
    if (result2.success) return { name: '8. 엣지 케이스', passed: false, message: 'Catch without water should fail' };

    game.dispatch({ type: 'MOVE_SHIP', forward: 999999, turn: 0, dtSec: 999999 });
    const snapshot = game.getSnapshot();
    if (snapshot.shipX < 0 || snapshot.shipX > WORLD_CONFIG.widthM) return { name: '8. 엣지 케이스', passed: false, message: 'Extreme values not clamped' };

    return { name: '8. 엣지 케이스', passed: true, message: 'Edge case handling verified' };
  } catch (e) {
    return { name: '8. 엣지 케이스', passed: false, message: `Failed: ${e}` };
  }
}

function test9_ConcurrentActions(): IntegrationTestResult {
  try {
    const game = createGame({ seed: 42 });
    for (let i = 0; i < 100; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 / 60 });
      game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 1 / 60 });
    }

    const snapshot = game.getSnapshot();
    if (!snapshot.version) return { name: '9. 동시 액션', passed: false, message: 'State corrupted' };

    return { name: '9. 동시 액션', passed: true, message: 'Concurrent actions handled' };
  } catch (e) {
    return { name: '9. 동시 액션', passed: false, message: `Failed: ${e}` };
  }
}

function test10_MockRendererSync(): IntegrationTestResult {
  try {
    const game = createGame({ seed: 42 });
    let renderCount = 0;
    let lastShipX = 0;
    let lastShipZ = 0;

    const unsubscribe = game.subscribe((state) => {
      renderCount++;
      lastShipX = state.shipX;
      lastShipZ = state.shipZ;
    });

    for (let i = 0; i < 60; i++) {
      game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 1 / 60 });
      game.dispatch({ type: 'TICK', dtSec: 1 / 60 });
    }

    unsubscribe();

    if (renderCount === 0) return { name: '10. 렌더러 동기화', passed: false, message: 'Renderer not called' };

    const snapshot = game.getSnapshot();
    if (snapshot.shipX !== lastShipX) return { name: '10. 렌더러 동기화', passed: false, message: 'Renderer out of sync' };

    return { name: '10. 렌더러 동기화', passed: true, message: 'Renderer synchronization verified' };
  } catch (e) {
    return { name: '10. 렌더러 동기화', passed: false, message: `Failed: ${e}` };
  }
}
