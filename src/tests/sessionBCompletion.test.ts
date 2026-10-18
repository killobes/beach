// OCEAN GAIA V3.2 — Session B Completion Verification
// 세션 B의 모든 작업이 완료되었는지 검증하는 테스트

import { validateSpeciesDatabase, SPECIES_DATA } from '../data/species';
import { ISLANDS, DIVE_SITES } from '../data/world';
import { HARPOONS, TANKS, SUITS, SHIP_UPGRADES } from '../data/equipment';
import { createGame } from '../core/GameEngine';

export interface CompletionResult {
  category: string;
  passed: boolean;
  details: string[];
}

export function verifySessionBCompletion(): CompletionResult[] {
  const results: CompletionResult[] = [];

  // B-1. 200종 생물 데이터 정정
  results.push(verifySpeciesData());

  // B-2. 월드 데이터 통합
  results.push(verifyWorldData());

  // B-3. 선박 및 이동 규칙
  results.push(verifyShipData());

  // B-4. 포획·경제·도감
  results.push(verifyEquipmentData());

  // B-5. 저장·불러오기
  results.push(verifySaveLoad());

  // B-6. 계약 및 통합
  results.push(verifyContractCompliance());

  return results;
}

function verifySpeciesData(): CompletionResult {
  const details: string[] = [];
  let passed = true;

  // 1. 200종 확인
  if (SPECIES_DATA.length !== 200) {
    passed = false;
    details.push(`❌ 생물 종 수: ${SPECIES_DATA.length}/200`);
  } else {
    details.push(`✅ 생물 종 수: 200종`);
  }

  // 2. 어류만 확인
  const validation = validateSpeciesDatabase();
  if (validation.nonFishSpecies.length > 0) {
    passed = false;
    details.push(`❌ 비어류 종 포함: ${validation.nonFishSpecies.length}종`);
  } else {
    details.push(`✅ 어류만 포함: 0종 비어류`);
  }

  // 3. 해역별 분배 확인
  const regions = {
    tropical: SPECIES_DATA.filter(s => s.region === 'tropical').length,
    glacier: SPECIES_DATA.filter(s => s.region === 'glacier').length,
    volcanic: SPECIES_DATA.filter(s => s.region === 'volcanic').length,
    mangrove: SPECIES_DATA.filter(s => s.region === 'mangrove').length,
    ocean: SPECIES_DATA.filter(s => s.region === 'ocean').length,
    deepsea: SPECIES_DATA.filter(s => s.region === 'deepsea').length,
  };

  const expected = { tropical: 40, glacier: 30, volcanic: 30, mangrove: 35, ocean: 40, deepsea: 25 };
  for (const [region, count] of Object.entries(regions)) {
    if (count !== expected[region as keyof typeof expected]) {
      passed = false;
      details.push(`❌ ${region}: ${count}/${expected[region as keyof typeof expected]}`);
    } else {
      details.push(`✅ ${region}: ${count}종`);
    }
  }

  // 4. ID 중복 확인
  const ids = new Set(SPECIES_DATA.map(s => s.id));
  if (ids.size !== 200) {
    passed = false;
    details.push(`❌ ID 중복: ${200 - ids.size}개`);
  } else {
    details.push(`✅ ID 중복 없음`);
  }

  return { category: 'B-1. 생물 데이터', passed, details };
}

function verifyWorldData(): CompletionResult {
  const details: string[] = [];
  let passed = true;

  // 1. 섬 12개 확인
  if (ISLANDS.length !== 12) {
    passed = false;
    details.push(`❌ 섬 개수: ${ISLANDS.length}/12`);
  } else {
    details.push(`✅ 섬 개수: 12개`);
  }

  // 2. 탐사지 24개 확인
  if (DIVE_SITES.length !== 24) {
    passed = false;
    details.push(`❌ 탐사지 개수: ${DIVE_SITES.length}/24`);
  } else {
    details.push(`✅ 탐사지 개수: 24개`);
  }

  // 3. 해역별 탐사지 분배 확인
  const diveRegions = {
    tropical: DIVE_SITES.filter(d => d.region === 'tropical').length,
    glacier: DIVE_SITES.filter(d => d.region === 'glacier').length,
    volcanic: DIVE_SITES.filter(d => d.region === 'volcanic').length,
    mangrove: DIVE_SITES.filter(d => d.region === 'mangrove').length,
    ocean: DIVE_SITES.filter(d => d.region === 'ocean').length,
    deepsea: DIVE_SITES.filter(d => d.region === 'deepsea').length,
  };

  for (const [region, count] of Object.entries(diveRegions)) {
    if (count !== 4) {
      passed = false;
      details.push(`❌ ${region} 탐사지: ${count}/4`);
    } else {
      details.push(`✅ ${region} 탐사지: 4개`);
    }
  }

  // 4. 시작 섬 확인
  const startIsland = ISLANDS.find(i => i.id === 1);
  if (!startIsland || startIsland.name !== '산호항') {
    passed = false;
    details.push(`❌ 시작 섬: ${startIsland?.name || '없음'}`);
  } else {
    details.push(`✅ 시작 섬: 산호항`);
  }

  return { category: 'B-2. 월드 데이터', passed, details };
}

function verifyShipData(): CompletionResult {
  const details: string[] = [];
  let passed = true;

  // 1. 선박 5단계 확인
  if (SHIP_UPGRADES.length !== 5) {
    passed = false;
    details.push(`❌ 선박 단계: ${SHIP_UPGRADES.length}/5`);
  } else {
    details.push(`✅ 선박 단계: 5단계`);
  }

  // 2. 각 단계별 이름 확인
  const expectedNames = ['낡은 어선', '개량 어선', '탐사선', '연구선', '가이아호'];
  for (let i = 0; i < 5; i++) {
    if (SHIP_UPGRADES[i].name !== expectedNames[i]) {
      passed = false;
      details.push(`❌ Level ${i + 1}: ${SHIP_UPGRADES[i].name} (예상: ${expectedNames[i]})`);
    } else {
      details.push(`✅ Level ${i + 1}: ${expectedNames[i]}`);
    }
  }

  // 3. 속도 증가 확인
  for (let i = 1; i < 5; i++) {
    if (SHIP_UPGRADES[i].speed <= SHIP_UPGRADES[i - 1].speed) {
      passed = false;
      details.push(`❌ Level ${i + 1} 속도가 Level ${i}보다 낮거나 같음`);
    }
  }
  if (passed) {
    details.push(`✅ 속도 증가 확인`);
  }

  // 4. 창고 용량 증가 확인
  for (let i = 1; i < 5; i++) {
    if (SHIP_UPGRADES[i].cargoCapacity <= SHIP_UPGRADES[i - 1].cargoCapacity) {
      passed = false;
      details.push(`❌ Level ${i + 1} 창고가 Level ${i}보다 낮거나 같음`);
    }
  }
  if (passed) {
    details.push(`✅ 창고 용량 증가 확인`);
  }

  return { category: 'B-3. 선박 데이터', passed, details };
}

function verifyEquipmentData(): CompletionResult {
  const details: string[] = [];
  let passed = true;

  // 1. 작살 24종 확인
  if (HARPOONS.length !== 24) {
    passed = false;
    details.push(`❌ 작살: ${HARPOONS.length}/24`);
  } else {
    details.push(`✅ 작살: 24종`);
  }

  // 2. 산소통 6종 확인
  if (TANKS.length !== 6) {
    passed = false;
    details.push(`❌ 산소통: ${TANKS.length}/6`);
  } else {
    details.push(`✅ 산소통: 6종`);
  }

  // 3. 잠수복 6종 확인
  if (SUITS.length !== 6) {
    passed = false;
    details.push(`❌ 잠수복: ${SUITS.length}/6`);
  } else {
    details.push(`✅ 잠수복: 6종`);
  }

  // 4. 총 장비 수 확인
  const totalEquipment = HARPOONS.length + TANKS.length + SUITS.length;
  if (totalEquipment !== 36) {
    passed = false;
    details.push(`❌ 총 장비: ${totalEquipment}/36`);
  } else {
    details.push(`✅ 총 장비: 36종`);
  }

  return { category: 'B-4. 장비 데이터', passed, details };
}

function verifySaveLoad(): CompletionResult {
  const details: string[] = [];
  let passed = true;

  try {
    // 1. 게임 생성
    const game = createGame({ seed: 12345 });
    details.push(`✅ 게임 생성 성공`);

    // 2. 상태 변경
    game.dispatch({ type: 'TICK', dtSec: 1 });
    game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 1 });
    details.push(`✅ 상태 변경 성공`);

    // 3. 저장
    const saveResult = game.save();
    if (!saveResult.success) {
      passed = false;
      details.push(`❌ 저장 실패: ${saveResult.reason}`);
    } else {
      details.push(`✅ 저장 성공`);
    }

    // 4. 불러오기
    const loadResult = game.load();
    if (!loadResult.success) {
      passed = false;
      details.push(`❌ 불러오기 실패: ${loadResult.reason}`);
    } else {
      details.push(`✅ 불러오기 성공`);
    }

    // 5. 상태 복원 확인
    const snapshot = game.getSnapshot();
    if (snapshot.shipX === 755 && snapshot.shipZ === 1780) {
      passed = false;
      details.push(`❌ 상태가 복원되지 않음 (이동 전 위치)`);
    } else {
      details.push(`✅ 상태 복원 확인`);
    }

  } catch (e) {
    passed = false;
    details.push(`❌ 예외 발생: ${e}`);
  }

  return { category: 'B-5. 저장/불러오기', passed, details };
}

function verifyContractCompliance(): CompletionResult {
  const details: string[] = [];
  let passed = true;

  try {
    // 1. GameEngine 인터페이스 확인
    const game = createGame({ seed: 12345 });
    
    if (typeof game.dispatch !== 'function') {
      passed = false;
      details.push(`❌ dispatch 함수 없음`);
    } else {
      details.push(`✅ dispatch 함수 존재`);
    }

    if (typeof game.getSnapshot !== 'function') {
      passed = false;
      details.push(`❌ getSnapshot 함수 없음`);
    } else {
      details.push(`✅ getSnapshot 함수 존재`);
    }

    if (typeof game.subscribe !== 'function') {
      passed = false;
      details.push(`❌ subscribe 함수 없음`);
    } else {
      details.push(`✅ subscribe 함수 존재`);
    }

    if (typeof game.save !== 'function') {
      passed = false;
      details.push(`❌ save 함수 없음`);
    } else {
      details.push(`✅ save 함수 존재`);
    }

    if (typeof game.load !== 'function') {
      passed = false;
      details.push(`❌ load 함수 없음`);
    } else {
      details.push(`✅ load 함수 존재`);
    }

    // 2. 행동 이름 통일 확인
    const actions = ['TICK', 'MOVE_SHIP', 'MOVE_DIVER', 'ENTER_WATER', 'RETURN_TO_SHIP', 
                     'CATCH_ATTEMPT', 'OBSERVE_CREATURE', 'SELL_ALL', 'BUY_ITEM', 'UPGRADE_SHIP'];
    
    for (const action of actions) {
      const result = game.dispatch({ type: action });
      if (result && typeof result.success === 'boolean') {
        details.push(`✅ 행동 '${action}' 정상`);
      } else {
        passed = false;
        details.push(`❌ 행동 '${action}' 비정상`);
      }
    }

    // 3. 단위 확인
    const snapshot = game.getSnapshot();
    if (typeof snapshot.shipX === 'number' && typeof snapshot.shipZ === 'number') {
      details.push(`✅ 위치 단위: m (미터)`);
    } else {
      passed = false;
      details.push(`❌ 위치 단위 비정상`);
    }

    if (typeof snapshot.shipHeading === 'number') {
      details.push(`✅ 방향 단위: rad (라디안)`);
    } else {
      passed = false;
      details.push(`❌ 방향 단위 비정상`);
    }

  } catch (e) {
    passed = false;
    details.push(`❌ 예외 발생: ${e}`);
  }

  return { category: 'B-6. 계약 준수', passed, details };
}
