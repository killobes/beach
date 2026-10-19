// OCEAN GAIA V3.2 — Gameplay Scenario Tests
// 세션 B 소유 — 실제 게임 플레이 시나리오 테스트

import { createGame } from '../core/GameEngine';
import { TutorialSystem } from '../systems/TutorialSystem';
import { GameBalanceSystem } from '../systems/GameBalance';

export interface ScenarioTestResult {
  name: string;
  passed: boolean;
  duration: number; // ms
  message: string;
  details?: any;
}

/**
 * 시나리오 1: 튜토리얼 완료 테스트
 */
export function testTutorialCompletion(): ScenarioTestResult {
  const startTime = Date.now();
  
  try {
    const game = createGame({ seed: 12345 });
    const tutorial = new TutorialSystem();
    tutorial.start();
    
    // 단계 1: 게임 시작
    game.dispatch({ type: 'TICK', dtSec: 1 });
    let result = tutorial.update(game.getSnapshot());
    if (!result.completed && tutorial.getCompletedCount() !== 1) {
      return {
        name: '시나리오 1: 튜토리얼 완료',
        passed: false,
        duration: Date.now() - startTime,
        message: '1단계 완료 실패',
      };
    }
    
    // 단계 2: 선박 이동
    game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 5 });
    result = tutorial.update(game.getSnapshot());
    
    // 단계 3: 입수
    game.dispatch({ type: 'ENTER_WATER' });
    result = tutorial.update(game.getSnapshot());
    
    // 단계 4: 생물 관찰
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    const snapshot = game.getSnapshot();
    if (snapshot.activeSpecimens.length > 0) {
      game.dispatch({ 
        type: 'OBSERVE_CREATURE', 
        specimenId: snapshot.activeSpecimens[0].uid 
      });
    }
    result = tutorial.update(game.getSnapshot());
    
    // 단계 5: 작살 사용
    if (snapshot.activeSpecimens.length > 0) {
      game.dispatch({ 
        type: 'CATCH_ATTEMPT', 
        specimenId: snapshot.activeSpecimens[0].uid,
        distanceM: 3
      });
    }
    result = tutorial.update(game.getSnapshot());
    
    // 단계 6: 귀선
    game.dispatch({ type: 'RETURN_TO_SHIP' });
    result = tutorial.update(game.getSnapshot());
    
    // 단계 7: 판매
    game.dispatch({ type: 'SELL_ALL' });
    result = tutorial.update(game.getSnapshot());
    
    // 나머지 단계는 자동으로 완료
    while (!tutorial.isCompleted()) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
      result = tutorial.update(game.getSnapshot());
    }
    
    const duration = Date.now() - startTime;
    return {
      name: '시나리오 1: 튜토리얼 완료',
      passed: tutorial.isCompleted(),
      duration,
      message: `튜토리얼 완료: ${tutorial.getCompletedCount()}/${tutorial.getTotalSteps()} 단계`,
      details: {
        totalSteps: tutorial.getTotalSteps(),
        completedSteps: tutorial.getCompletedCount(),
        finalShells: game.getSnapshot().shells,
      },
    };
  } catch (e) {
    return {
      name: '시나리오 1: 튜토리얼 완료',
      passed: false,
      duration: Date.now() - startTime,
      message: `예외 발생: ${e}`,
    };
  }
}

/**
 * 시나리오 2: 포획-판매-업그레이드 루프
 */
export function testCatchSellUpgradeLoop(): ScenarioTestResult {
  const startTime = Date.now();
  
  try {
    const game = createGame({ seed: 12345 });
    const balance = new GameBalanceSystem();
    
    // 초기 상태
    const initialState = game.getSnapshot();
    const initialShells = initialState.shells;
    
    // 개체 생성
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    
    // 입수
    game.dispatch({ type: 'ENTER_WATER' });
    
    // 여러 번 포획 시도
    let catchCount = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      const snapshot = game.getSnapshot();
      if (snapshot.activeSpecimens.length === 0) break;
      
      const specimen = snapshot.activeSpecimens[0];
      const result = game.dispatch({
        type: 'CATCH_ATTEMPT',
        specimenId: specimen.uid,
        distanceM: 3,
      });
      
      if (result.success) {
        catchCount++;
      }
    }
    
    // 귀선
    game.dispatch({ type: 'RETURN_TO_SHIP' });
    
    // 판매
    const beforeSell = game.getSnapshot();
    const sellResult = game.dispatch({ type: 'SELL_ALL' });
    const afterSell = game.getSnapshot();
    
    // 업그레이드 시도
    const upgradeResult = game.dispatch({ type: 'UPGRADE_SHIP' });
    
    const duration = Date.now() - startTime;
    
    return {
      name: '시나리오 2: 포획-판매-업그레이드 루프',
      passed: catchCount > 0 && sellResult.success && afterSell.shells > initialShells,
      duration,
      message: `포획: ${catchCount}마리, 판매: ${sellResult.success ? '성공' : '실패'}, 업그레이드: ${upgradeResult.success ? '성공' : '실패'}`,
      details: {
        initialShells,
        finalShells: afterSell.shells,
        catchCount,
        soldItems: afterSell.cargo.length === 0 ? catchCount : 0,
        shipLevel: afterSell.shipLevel,
      },
    };
  } catch (e) {
    return {
      name: '시나리오 2: 포획-판매-업그레이드 루프',
      passed: false,
      duration: Date.now() - startTime,
      message: `예외 발생: ${e}`,
    };
  }
}

/**
 * 시나리오 3: 수심 진행 테스트
 */
export function testDepthProgression(): ScenarioTestResult {
  const startTime = Date.now();
  
  try {
    const game = createGame({ seed: 12345 });
    
    // 얕은 수심 탐험 (0-30m)
    game.dispatch({ type: 'ENTER_WATER' });
    for (let i = 0; i < 60; i++) {
      game.dispatch({ type: 'MOVE_DIVER', forward: 1, turn: 0, vertical: -1, dtSec: 1 });
    }
    
    let state = game.getSnapshot();
    const shallowDepth = Math.abs(state.diverY);
    
    // 귀선
    game.dispatch({ type: 'RETURN_TO_SHIP' });
    
    // 장비 업그레이드 시뮬레이션
    game.dispatch({ type: 'BUY_ITEM', itemType: 'tank', itemId: 2 });
    game.dispatch({ type: 'BUY_ITEM', itemType: 'suit', itemId: 2 });
    
    // 중간 수심 탐험 (30-100m)
    game.dispatch({ type: 'ENTER_WATER' });
    for (let i = 0; i < 120; i++) {
      game.dispatch({ type: 'MOVE_DIVER', forward: 1, turn: 0, vertical: -1, dtSec: 1 });
    }
    
    state = game.getSnapshot();
    const midDepth = Math.abs(state.diverY);
    
    // 귀선
    game.dispatch({ type: 'RETURN_TO_SHIP' });
    
    const duration = Date.now() - startTime;
    
    return {
      name: '시나리오 3: 수심 진행',
      passed: shallowDepth > 0 && midDepth > shallowDepth,
      duration,
      message: `얕은 수심: ${shallowDepth.toFixed(1)}m, 중간 수심: ${midDepth.toFixed(1)}m`,
      details: {
        shallowDepth,
        midDepth,
        depthIncrease: midDepth - shallowDepth,
      },
    };
  } catch (e) {
    return {
      name: '시나리오 3: 수심 진행',
      passed: false,
      duration: Date.now() - startTime,
      message: `예외 발생: ${e}`,
    };
  }
}

/**
 * 시나리오 4: 해역 탐험 테스트
 */
export function testRegionExploration(): ScenarioTestResult {
  const startTime = Date.now();
  
  try {
    const game = createGame({ seed: 12345 });
    
    // 다양한 위치로 이동
    const positions = [
      { x: 1500, z: 1500 }, // 열대
      { x: 4500, z: 1000 }, // 맹그로브
      { x: 8000, z: 1500 }, // 대양
      { x: 1500, z: 5500 }, // 빙하
      { x: 5000, z: 5000 }, // 화산
      { x: 8500, z: 6000 }, // 심해
    ];
    
    const visitedRegions = new Set<string>();
    
    for (const pos of positions) {
      // 선박 이동
      const state = game.getSnapshot();
      const dx = pos.x - state.shipX;
      const dz = pos.z - state.shipZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const time = distance / 5; // 속도 5m/s
      
      for (let i = 0; i < time; i++) {
        game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 1 });
      }
      
      // 현재 해역 확인
      const currentState = game.getSnapshot();
      const region = getRegionAt(currentState.shipX, currentState.shipZ);
      visitedRegions.add(region);
      
      // 약간의 시간 경과
      for (let i = 0; i < 30; i++) {
        game.dispatch({ type: 'TICK', dtSec: 1 });
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      name: '시나리오 4: 해역 탐험',
      passed: visitedRegions.size >= 3,
      duration,
      message: `방문한 해역: ${visitedRegions.size}개 (${Array.from(visitedRegions).join(', ')})`,
      details: {
        visitedRegions: Array.from(visitedRegions),
        regionCount: visitedRegions.size,
      },
    };
  } catch (e) {
    return {
      name: '시나리오 4: 해역 탐험',
      passed: false,
      duration: Date.now() - startTime,
      message: `예외 발생: ${e}`,
    };
  }
}

/**
 * 시나리오 5: 장시간 플레이 안정성 테스트
 */
export function testLongPlayStability(): ScenarioTestResult {
  const startTime = Date.now();
  
  try {
    const game = createGame({ seed: 12345 });
    
    // 10분 플레이 시뮬레이션 (600초)
    const simulatedTime = 600;
    const tickInterval = 1 / 30; // 30fps
    const totalTicks = simulatedTime / tickInterval;
    
    let errorCount = 0;
    let catchCount = 0;
    let observeCount = 0;
    
    for (let tick = 0; tick < totalTicks; tick++) {
      try {
        // 기본 틱
        game.dispatch({ type: 'TICK', dtSec: tickInterval });
        
        // 랜덤 작업
        if (tick % 100 === 0) {
          const action = Math.random();
          if (action < 0.3) {
            game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: tickInterval });
          } else if (action < 0.5) {
            game.dispatch({ type: 'ENTER_WATER' });
          } else if (action < 0.7) {
            game.dispatch({ type: 'RETURN_TO_SHIP' });
          } else {
            const state = game.getSnapshot();
            if (state.inWater && state.activeSpecimens.length > 0) {
              const specimen = state.activeSpecimens[0];
              const result = game.dispatch({
                type: 'CATCH_ATTEMPT',
                specimenId: specimen.uid,
                distanceM: 3,
              });
              if (result.success) catchCount++;
            }
          }
        }
        
        // 주기적으로 상태 확인
        if (tick % 300 === 0) {
          const state = game.getSnapshot();
          if (!state.version || !state.seed) {
            errorCount++;
          }
        }
      } catch (e) {
        errorCount++;
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      name: '시나리오 5: 장시간 플레이 안정성',
      passed: errorCount === 0,
      duration,
      message: `${simulatedTime}초 시뮬레이션 완료, 오류: ${errorCount}개`,
      details: {
        simulatedTime,
        totalTicks,
        errorCount,
        catchCount,
        finalState: game.getSnapshot(),
      },
    };
  } catch (e) {
    return {
      name: '시나리오 5: 장시간 플레이 안정성',
      passed: false,
      duration: Date.now() - startTime,
      message: `예외 발생: ${e}`,
    };
  }
}

/**
 * 시나리오 6: 저장/불러오기 테스트
 */
export function testSaveLoadCycle(): ScenarioTestResult {
  const startTime = Date.now();
  
  try {
    const game = createGame({ seed: 12345 });
    
    // 게임 진행
    for (let i = 0; i < 300; i++) {
      game.dispatch({ type: 'TICK', dtSec: 1 });
    }
    game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0.5, dtSec: 5 });
    
    // 저장 전 상태
    const beforeSave = game.getSnapshot();
    
    // 저장
    const saveResult = game.save();
    if (!saveResult.success) {
      return {
        name: '시나리오 6: 저장/불러오기',
        passed: false,
        duration: Date.now() - startTime,
        message: `저장 실패: ${saveResult.reason}`,
      };
    }
    
    // 새로운 게임 생성
    const game2 = createGame({ seed: 12345 });
    
    // 불러오기
    const loadResult = game2.load();
    if (!loadResult.success) {
      return {
        name: '시나리오 6: 저장/불러오기',
        passed: false,
        duration: Date.now() - startTime,
        message: `불러오기 실패: ${loadResult.reason}`,
      };
    }
    
    // 저장 후 상태
    const afterLoad = game2.getSnapshot();
    
    // 비교
    const positionMatch = 
      beforeSave.shipX === afterLoad.shipX &&
      beforeSave.shipZ === afterLoad.shipZ;
    const shellsMatch = beforeSave.shells === afterLoad.shells;
    const tickMatch = beforeSave.tick === afterLoad.tick;
    
    const duration = Date.now() - startTime;
    
    return {
      name: '시나리오 6: 저장/불러오기',
      passed: positionMatch && shellsMatch && tickMatch,
      duration,
      message: `저장/불러오기 완료, 일치: 위치=${positionMatch}, 자금=${shellsMatch}, 틱=${tickMatch}`,
      details: {
        beforeSave: {
          shipX: beforeSave.shipX,
          shipZ: beforeSave.shipZ,
          shells: beforeSave.shells,
          tick: beforeSave.tick,
        },
        afterLoad: {
          shipX: afterLoad.shipX,
          shipZ: afterLoad.shipZ,
          shells: afterLoad.shells,
          tick: afterLoad.tick,
        },
      },
    };
  } catch (e) {
    return {
      name: '시나리오 6: 저장/불러오기',
      passed: false,
      duration: Date.now() - startTime,
      message: `예외 발생: ${e}`,
    };
  }
}

/**
 * 시나리오 7: 밸런스 검증
 */
export function testBalanceValidation(): ScenarioTestResult {
  const startTime = Date.now();
  
  try {
    const balance = new GameBalanceSystem();
    const validation = balance.validateBalance();
    const report = balance.generateBalanceReport();
    
    const duration = Date.now() - startTime;
    
    return {
      name: '시나리오 7: 밸런스 검증',
      passed: validation.valid,
      duration,
      message: validation.valid 
        ? '밸런스 검증 통과' 
        : `문제: ${validation.issues.length}개, 경고: ${validation.warnings.length}개`,
      details: {
        issues: validation.issues,
        warnings: validation.warnings,
        report,
      },
    };
  } catch (e) {
    return {
      name: '시나리오 7: 밸런스 검증',
      passed: false,
      duration: Date.now() - startTime,
      message: `예외 발생: ${e}`,
    };
  }
}

/**
 * 모든 시나리오 테스트 실행
 */
export function runAllScenarioTests(): ScenarioTestResult[] {
  console.log('\n═══════════════════════════════════════');
  console.log('🎮 게임 플레이 시나리오 테스트');
  console.log('═══════════════════════════════════════\n');
  
  const results: ScenarioTestResult[] = [];
  
  results.push(testTutorialCompletion());
  results.push(testCatchSellUpgradeLoop());
  results.push(testDepthProgression());
  results.push(testRegionExploration());
  results.push(testLongPlayStability());
  results.push(testSaveLoadCycle());
  results.push(testBalanceValidation());
  
  // 결과 출력
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(`   ${result.message}`);
    console.log(`   소요 시간: ${result.duration}ms\n`);
  });
  
  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n결과: ${passedCount}/${results.length} 통과\n`);
  
  return results;
}

// 헬퍼 함수
function getRegionAt(x: number, z: number): string {
  const regions = {
    tropical: { xMin: 0, xMax: 3500, zMin: 0, zMax: 3000 },
    mangrove: { xMin: 3500, xMax: 6500, zMin: 0, zMax: 3000 },
    ocean: { xMin: 6500, xMax: 10000, zMin: 0, zMax: 3000 },
    glacier: { xMin: 0, xMax: 3500, zMin: 3000, zMax: 8000 },
    volcanic: { xMin: 3500, xMax: 6500, zMin: 3000, zMax: 8000 },
    deepsea: { xMin: 6500, xMax: 10000, zMin: 3000, zMax: 8000 },
  };
  
  for (const [region, bounds] of Object.entries(regions)) {
    if (x >= bounds.xMin && x < bounds.xMax && z >= bounds.zMin && z < bounds.zMax) {
      return region;
    }
  }
  
  return 'ocean';
}
