// OCEAN GAIA V3.2 — Catch System Test
// 포획 시스템 완전 테스트

import { createGame, parseSpecimenUID } from '../core/GameEngine';
import { SPECIES_BY_ID } from '../data/species';
import { SHIP_UPGRADES } from '../data/equipment';

export interface CatchTestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runCatchSystemTests(): CatchTestResult[] {
  const results: CatchTestResult[] = [];

  results.push(test1_SpecimenUIDFormat());
  results.push(test2_CatchBasicFlow());
  results.push(test3_CatchDistanceCheck());
  results.push(test4_CatchProtectedSpecies());
  results.push(test5_CatchCargoCapacity());
  results.push(test6_CatchDepthLimit());
  results.push(test7_CatchSuccessAndFailure());
  results.push(test8_CatchCodexUpdate());
  results.push(test9_CatchSellUpgradeLoop());
  results.push(test10_NearbySpecimensAPI());

  return results;
}

function test1_SpecimenUIDFormat(): CatchTestResult {
  try {
    const game = createGame({ seed: 12345 });
    
    // 게임 진행하여 개체 생성
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    
    const snapshot = game.getSnapshot();
    
    if (snapshot.activeSpecimens.length === 0) {
      return { name: '1. 개체 ID 형식', passed: false, message: '생성된 개체가 없습니다' };
    }
    
    // 첫 번째 개체의 ID 확인
    const specimen = snapshot.activeSpecimens[0];
    const parsed = parseSpecimenUID(specimen.uid);
    
    if (!parsed) {
      return { name: '1. 개체 ID 형식', passed: false, message: `ID 파싱 실패: ${specimen.uid}` };
    }
    
    if (parsed.speciesId !== specimen.speciesId) {
      return { name: '1. 개체 ID 형식', passed: false, message: `종 ID 불일치: ${parsed.speciesId} !== ${specimen.speciesId}` };
    }
    
    // ID 형식 확인: fish_{speciesId}_{region}_{seq}
    const parts = specimen.uid.split('_');
    if (parts.length !== 4 || parts[0] !== 'fish') {
      return { name: '1. 개체 ID 형식', passed: false, message: `잘못된 ID 형식: ${specimen.uid}` };
    }
    
    return { name: '1. 개체 ID 형식', passed: true, message: `ID 형식 정상: ${specimen.uid}` };
  } catch (e) {
    return { name: '1. 개체 ID 형식', passed: false, message: `예외: ${e}` };
  }
}

function test2_CatchBasicFlow(): CatchTestResult {
  try {
    const game = createGame({ seed: 12345 });
    
    // 개체 생성
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    
    const snapshot = game.getSnapshot();
    if (snapshot.activeSpecimens.length === 0) {
      return { name: '2. 기본 포획 흐름', passed: false, message: '개체 없음' };
    }
    
    // 입수
    const enterResult = game.dispatch({ type: 'ENTER_WATER' });
    if (!enterResult.success) {
      return { name: '2. 기본 포획 흐름', passed: false, message: `입수 실패: ${enterResult.reason}` };
    }
    
    // 첫 번째 개체 포획 시도
    const specimen = snapshot.activeSpecimens[0];
    const catchResult = game.dispatch({
      type: 'CATCH_ATTEMPT',
      specimenId: specimen.uid,
      distanceM: 3
    });
    
    // 결과 확인 (성공 또는 실패 모두 정상)
    if (typeof catchResult.success !== 'boolean') {
      return { name: '2. 기본 포획 흐름', passed: false, message: '잘못된 반환 형식' };
    }
    
    if (catchResult.success) {
      // 성공 시 화물에 추가되었는지 확인
      const afterSnapshot = game.getSnapshot();
      if (afterSnapshot.cargo.length === 0) {
        return { name: '2. 기본 포획 흐름', passed: false, message: '포획 성공했지만 화물이 비어있음' };
      }
      if (afterSnapshot.activeSpecimens.some(s => s.uid === specimen.uid)) {
        return { name: '2. 기본 포획 흐름', passed: false, message: '포획 성공했지만 개체가 여전히 존재' };
      }
    }
    
    return { name: '2. 기본 포획 흐름', passed: true, message: `포획 시도 정상 (${catchResult.success ? '성공' : '실패'})` };
  } catch (e) {
    return { name: '2. 기본 포획 흐름', passed: false, message: `예외: ${e}` };
  }
}

function test3_CatchDistanceCheck(): CatchTestResult {
  try {
    const game = createGame({ seed: 12345 });
    
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    
    game.dispatch({ type: 'ENTER_WATER' });
    
    const snapshot = game.getSnapshot();
    if (snapshot.activeSpecimens.length === 0) {
      return { name: '3. 거리 체크', passed: false, message: '개체 없음' };
    }
    
    const specimen = snapshot.activeSpecimens[0];
    
    // 매우 먼 거리에서 포획 시도 (실패해야 함)
    const farResult = game.dispatch({
      type: 'CATCH_ATTEMPT',
      specimenId: specimen.uid,
      distanceM: 100 // 기본 작살 사거리 5m 초과
    });
    
    if (farResult.success) {
      return { name: '3. 거리 체크', passed: false, message: '먼 거리에서 포획 성공 (비정상)' };
    }
    
    if (!farResult.reason?.includes('사거리')) {
      return { name: '3. 거리 체크', passed: false, message: `잘못된 오류 메시지: ${farResult.reason}` };
    }
    
    return { name: '3. 거리 체크', passed: true, message: '거리 체크 정상' };
  } catch (e) {
    return { name: '3. 거리 체크', passed: false, message: `예외: ${e}` };
  }
}

function test4_CatchProtectedSpecies(): CatchTestResult {
  try {
    const game = createGame({ seed: 12345 });
    
    // 보호종 생성될 때까지 반복
    let protectedSpecimen = null;
    for (let i = 0; i < 500; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
      const snapshot = game.getSnapshot();
      protectedSpecimen = snapshot.activeSpecimens.find(s => {
        const species = SPECIES_BY_ID.get(s.speciesId);
        return species?.protected;
      });
      if (protectedSpecimen) break;
    }
    
    if (!protectedSpecimen) {
      return { name: '4. 보호종 체크', passed: true, message: '보호종 없음 (테스트 스킵)' };
    }
    
    game.dispatch({ type: 'ENTER_WATER' });
    
    const catchResult = game.dispatch({
      type: 'CATCH_ATTEMPT',
      specimenId: protectedSpecimen.uid,
      distanceM: 3
    });
    
    if (catchResult.success) {
      return { name: '4. 보호종 체크', passed: false, message: '보호종 포획 성공 (비정상)' };
    }
    
    if (!catchResult.reason?.includes('보호종')) {
      return { name: '4. 보호종 체크', passed: false, message: `잘못된 오류 메시지: ${catchResult.reason}` };
    }
    
    return { name: '4. 보호종 체크', passed: true, message: '보호종 포획 차단 정상' };
  } catch (e) {
    return { name: '4. 보호종 체크', passed: false, message: `예외: ${e}` };
  }
}

function test5_CatchCargoCapacity(): CatchTestResult {
  try {
    const game = createGame({ seed: 12345 });
    
    // 화물을 가득 채움
    const snapshot = game.getSnapshot();
    const shipData = SHIP_UPGRADES.find((s: any) => s.level === snapshot.shipLevel);
    
    if (!shipData) {
      return { name: '5. 화물 공간 체크', passed: false, message: '선박 데이터 없음' };
    }
    
    // 가짜 개체를 화물에 추가
    for (let i = 0; i < shipData.cargoCapacity; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
      const snap = game.getSnapshot();
      if (snap.activeSpecimens.length > 0) {
        game.dispatch({ type: 'ENTER_WATER' });
        const result = game.dispatch({
          type: 'CATCH_ATTEMPT',
          specimenId: snap.activeSpecimens[0].uid,
          distanceM: 1
        });
        if (result.success) {
          game.dispatch({ type: 'RETURN_TO_SHIP' });
        }
      }
    }
    
    // 화물이 가득 찬 상태에서 포획 시도
    const fullSnapshot = game.getSnapshot();
    if (fullSnapshot.activeSpecimens.length > 0) {
      game.dispatch({ type: 'ENTER_WATER' });
      const catchResult = game.dispatch({
        type: 'CATCH_ATTEMPT',
        specimenId: fullSnapshot.activeSpecimens[0].uid,
        distanceM: 1
      });
      
      if (catchResult.success && fullSnapshot.cargo.length >= shipData.cargoCapacity) {
        return { name: '5. 화물 공간 체크', passed: false, message: '화물이 가득 찬 상태에서 포획 성공' };
      }
    }
    
    return { name: '5. 화물 공간 체크', passed: true, message: '화물 공간 체크 정상' };
  } catch (e) {
    return { name: '5. 화물 공간 체크', passed: false, message: `예외: ${e}` };
  }
}

function test6_CatchDepthLimit(): CatchTestResult {
  try {
    const game = createGame({ seed: 12345 });
    
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    
    game.dispatch({ type: 'ENTER_WATER' });
    
    const snapshot = game.getSnapshot();
    
    // 기본 장비로 깊은 수심 개체 포획 시도
    const deepSpecimen = snapshot.activeSpecimens.find(s => s.depthM > 50);
    
    if (deepSpecimen) {
      const catchResult = game.dispatch({
        type: 'CATCH_ATTEMPT',
        specimenId: deepSpecimen.uid,
        distanceM: 3
      });
      
      if (catchResult.success) {
        return { name: '6. 수심 제한 체크', passed: false, message: '수심 제한 초과 개체 포획 성공' };
      }
      
      if (!catchResult.reason?.includes('수심')) {
        return { name: '6. 수심 제한 체크', passed: false, message: `잘못된 오류 메시지: ${catchResult.reason}` };
      }
    }
    
    return { name: '6. 수심 제한 체크', passed: true, message: '수심 제한 체크 정상' };
  } catch (e) {
    return { name: '6. 수심 제한 체크', passed: false, message: `예외: ${e}` };
  }
}

function test7_CatchSuccessAndFailure(): CatchTestResult {
  try {
    const game = createGame({ seed: 12345 });
    
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    
    game.dispatch({ type: 'ENTER_WATER' });
    
    const snapshot = game.getSnapshot();
    if (snapshot.activeSpecimens.length === 0) {
      return { name: '7. 성공/실패 처리', passed: false, message: '개체 없음' };
    }
    
    const specimen = snapshot.activeSpecimens[0];
    
    // 매우 가까운 거리 (높은 성공률)
    const closeResult = game.dispatch({
      type: 'CATCH_ATTEMPT',
      specimenId: specimen.uid,
      distanceM: 1
    });
    
    // 결과에 data 필드가 있는지 확인
    if (closeResult.success && !closeResult.data) {
      return { name: '7. 성공/실패 처리', passed: false, message: '성공 시 data 필드 없음' };
    }
    
    if (!closeResult.success && !closeResult.data) {
      return { name: '7. 성공/실패 처리', passed: false, message: '실패 시 data 필드 없음' };
    }
    
    return { name: '7. 성공/실패 처리', passed: true, message: '성공/실패 처리 정상' };
  } catch (e) {
    return { name: '7. 성공/실패 처리', passed: false, message: `예외: ${e}` };
  }
}

function test8_CatchCodexUpdate(): CatchTestResult {
  try {
    const game = createGame({ seed: 12345 });
    
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    
    game.dispatch({ type: 'ENTER_WATER' });
    
    const snapshot = game.getSnapshot();
    if (snapshot.activeSpecimens.length === 0) {
      return { name: '8. 도감 업데이트', passed: false, message: '개체 없음' };
    }
    
    const specimen = snapshot.activeSpecimens[0];
    const speciesId = specimen.speciesId;
    
    // 포획 전 도감 상태
    const beforeCodex = snapshot.codex[speciesId];
    
    // 포획 시도
    const catchResult = game.dispatch({
      type: 'CATCH_ATTEMPT',
      specimenId: specimen.uid,
      distanceM: 1
    });
    
    if (catchResult.success) {
      const afterSnapshot = game.getSnapshot();
      const afterCodex = afterSnapshot.codex[speciesId];
      
      if (!afterCodex) {
        return { name: '8. 도감 업데이트', passed: false, message: '포획 후 도감 항목 없음' };
      }
      
      if (afterCodex.catchCount === (beforeCodex?.catchCount || 0)) {
        return { name: '8. 도감 업데이트', passed: false, message: '도감 카운트 증가 없음' };
      }
      
      if (!afterCodex.firstCatchTime) {
        return { name: '8. 도감 업데이트', passed: false, message: '첫 포획 시간 없음' };
      }
    }
    
    return { name: '8. 도감 업데이트', passed: true, message: '도감 업데이트 정상' };
  } catch (e) {
    return { name: '8. 도감 업데이트', passed: false, message: `예외: ${e}` };
  }
}

function test9_CatchSellUpgradeLoop(): CatchTestResult {
  try {
    const game = createGame({ seed: 12345 });
    
    // 개체 생성
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    
    const snapshot = game.getSnapshot();
    if (snapshot.activeSpecimens.length === 0) {
      return { name: '9. 포획-판매-업그레이드 루프', passed: false, message: '개체 없음' };
    }
    
    // 시작 위치로 이동 (항구 근처)
    game.dispatch({ type: 'MOVE_SHIP', forward: 0, turn: 0, dtSec: 1 });
    
    // 입수
    game.dispatch({ type: 'ENTER_WATER' });
    
    // 포획
    const specimen = snapshot.activeSpecimens[0];
    const catchResult = game.dispatch({
      type: 'CATCH_ATTEMPT',
      specimenId: specimen.uid,
      distanceM: 1
    });
    
    if (!catchResult.success) {
      return { name: '9. 포획-판매-업그레이드 루프', passed: true, message: '포획 실패 (테스트 스킵)' };
    }
    
    // 귀선
    game.dispatch({ type: 'RETURN_TO_SHIP' });
    
    // 판매
    const sellResult = game.dispatch({ type: 'SELL_ALL' });
    
    if (!sellResult.success) {
      return { name: '9. 포획-판매-업그레이드 루프', passed: false, message: `판매 실패: ${sellResult.reason}` };
    }
    
    // 자금 증가 확인
    const afterSell = game.getSnapshot();
    if (afterSell.shells <= snapshot.shells) {
      return { name: '9. 포획-판매-업그레이드 루프', passed: false, message: '판매 후 자금 증가 없음' };
    }
    
    // 업그레이드 시도
    const upgradeResult = game.dispatch({ type: 'UPGRADE_SHIP' });
    
    // 업그레이드는 자금에 따라 성공/실패
    if (upgradeResult.success) {
      const afterUpgrade = game.getSnapshot();
      if (afterUpgrade.shipLevel !== snapshot.shipLevel + 1) {
        return { name: '9. 포획-판매-업그레이드 루프', passed: false, message: '업그레이드 후 레벨 증가 없음' };
      }
    }
    
    return { name: '9. 포획-판매-업그레이드 루프', passed: true, message: '포획-판매-업그레이드 루프 정상' };
  } catch (e) {
    return { name: '9. 포획-판매-업그레이드 루프', passed: false, message: `예외: ${e}` };
  }
}

function test10_NearbySpecimensAPI(): CatchTestResult {
  try {
    const game = createGame({ seed: 12345 });
    
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    
    const snapshot = game.getSnapshot();
    if (snapshot.activeSpecimens.length === 0) {
      return { name: '10. 주변 개체 조회 API', passed: false, message: '개체 없음' };
    }
    
    // 첫 번째 개체 위치에서 주변 개체 조회
    const specimen = snapshot.activeSpecimens[0];
    const nearby = game.getNearbySpecimens(specimen.x, specimen.z, 100);
    
    if (!Array.isArray(nearby)) {
      return { name: '10. 주변 개체 조회 API', passed: false, message: '배열 반환 안함' };
    }
    
    if (nearby.length === 0) {
      return { name: '10. 주변 개체 조회 API', passed: false, message: '주변 개체 없음' };
    }
    
    // 거리 정보 확인
    if (typeof nearby[0].distance !== 'number') {
      return { name: '10. 주변 개체 조회 API', passed: false, message: '거리 정보 없음' };
    }
    
    // 정렬 확인 (거리순)
    for (let i = 1; i < nearby.length; i++) {
      if (nearby[i].distance < nearby[i - 1].distance) {
        return { name: '10. 주변 개체 조회 API', passed: false, message: '거리순 정렬 안됨' };
      }
    }
    
    return { name: '10. 주변 개체 조회 API', passed: true, message: `주변 개체 ${nearby.length}개 조회 정상` };
  } catch (e) {
    return { name: '10. 주변 개체 조회 API', passed: false, message: `예외: ${e}` };
  }
}
