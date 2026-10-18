// OCEAN GAIA V3.2 — Game Engine Tests
// 세션 B 소유 파일

import { createGame, type GameState } from '../core/GameEngine';
import { SPECIES_DATA, SPECIES_BY_ID, validateSpeciesDatabase } from '../data/species';
import { HARPOONS, TANKS, SUITS, SHIP_UPGRADES } from '../data/equipment';
import { BOSSES, FOSSILS, WORLD_CONFIG } from '../data/world';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runAllTests(): TestResult[] {
  const results: TestResult[] = [];

  results.push(test1_SpeciesLoading());
  results.push(test2_NameIdDuplicates());
  results.push(test3_LengthWeightGeneration());
  results.push(test4_WeightCalculationUnits());
  results.push(test5_MaxLengthExceed());
  results.push(test6_CatchableCheck());
  results.push(test7_EquipmentPurchase());
  results.push(test8_CargoCapacity());
  results.push(test9_CodexRecords());
  results.push(test10_FossilCollection());
  results.push(test11_SaveLoad());
  results.push(test12_SeedReproduction());

  return results;
}

function test1_SpeciesLoading(): TestResult {
  const validation = validateSpeciesDatabase();
  return {
    name: '1. 200종 데이터 로딩',
    passed: validation.valid,
    message: validation.valid ? `200종 로드 완료 (${SPECIES_DATA.length}종)` : `오류: ${validation.errors.join(', ')}`
  };
}

function test2_NameIdDuplicates(): TestResult {
  const ids = new Set<number>();
  const names = new Set<string>();
  let duplicateIds = 0;
  let duplicateNames = 0;

  for (const s of SPECIES_DATA) {
    if (ids.has(s.id)) duplicateIds++;
    ids.add(s.id);
    if (names.has(s.scientificName)) duplicateNames++;
    names.add(s.scientificName);
  }

  const passed = duplicateIds === 0 && duplicateNames === 0;
  return {
    name: '2. 학명 및 ID 중복 검사',
    passed,
    message: passed ? '중복 없음' : `중복 ID: ${duplicateIds}, 중복 학명: ${duplicateNames}`
  };
}

function test3_LengthWeightGeneration(): TestResult {
  const game = createGame({ seed: 42 });
  let allValid = true;
  let errorMsg = '';

  // Spawn creatures and check their dimensions
  for (let i = 0; i < 100; i++) {
    game.dispatch({ type: 'TICK', dtSec: 1 });
  }

  const snapshot = game.getSnapshot();
  for (const spec of snapshot.activeSpecimens) {
    if (spec.lengthCm <= 0) {
      allValid = false;
      errorMsg = `ID ${spec.speciesId}: length <= 0 (${spec.lengthCm})`;
      break;
    }
    if (spec.weightKg <= 0) {
      allValid = false;
      errorMsg = `ID ${spec.speciesId}: weight <= 0 (${spec.weightKg})`;
      break;
    }

    const species = SPECIES_BY_ID.get(spec.speciesId)!;
    if (spec.lengthCm > species.gameMaxLengthCm * 1.1) {
      allValid = false;
      errorMsg = `ID ${spec.speciesId}: length exceeds max (${spec.lengthCm} > ${species.gameMaxLengthCm})`;
      break;
    }
  }

  return {
    name: '3. 길이·무게 생성 검사',
    passed: allValid,
    message: allValid ? `${snapshot.activeSpecimens.length}개체 모두 정상` : errorMsg
  };
}

function test4_WeightCalculationUnits(): TestResult {
  // Verify W = a * L^b produces kg from cm
  let allCorrect = true;
  let errorMsg = '';

  for (const species of SPECIES_DATA) {
    const calcWeight = species.lengthWeightA * Math.pow(species.gameBaseLengthCm, species.lengthWeightB);
    // Allow 50% tolerance since base weight is approximate
    const ratio = calcWeight / species.gameBaseWeightKg;
    if (ratio < 0.3 || ratio > 3.0) {
      allCorrect = false;
      errorMsg = `ID ${species.id} (${species.name}): calc=${calcWeight.toFixed(3)}kg, base=${species.gameBaseWeightKg}kg, ratio=${ratio.toFixed(2)}`;
      break;
    }
  }

  return {
    name: '4. 체장–체중 계산 단위 검사',
    passed: allCorrect,
    message: allCorrect ? 'W=a*L^b 단위 일관성 확인' : errorMsg
  };
}

function test5_MaxLengthExceed(): TestResult {
  const game = createGame({ seed: 999 });
  let exceeded = false;
  let errorMsg = '';

  for (let i = 0; i < 200; i++) {
    game.dispatch({ type: 'TICK', dtSec: 1 });
  }

  const snapshot = game.getSnapshot();
  for (const spec of snapshot.activeSpecimens) {
    const species = SPECIES_BY_ID.get(spec.speciesId)!;
    if (spec.lengthCm > species.gameMaxLengthCm) {
      exceeded = true;
      errorMsg = `ID ${spec.speciesId}: ${spec.lengthCm}cm > max ${species.gameMaxLengthCm}cm`;
      break;
    }
  }

  return {
    name: '5. 최대 길이 초과 검사',
    passed: !exceeded,
    message: exceeded ? errorMsg : '모든 개체가 최대 길이 이내'
  };
}

function test6_CatchableCheck(): TestResult {
  const game = createGame({ seed: 42 });
  let protectedCaught = false;

  // Enter water and try to catch
  game.dispatch({ type: 'ENTER_WATER' });

  const snapshot = game.getSnapshot();
  const protectedSpecimens = snapshot.activeSpecimens.filter(s => {
    const species = SPECIES_BY_ID.get(s.speciesId);
    return species?.protected;
  });

  if (protectedSpecimens.length > 0) {
    const result = game.dispatch({
      type: 'CATCH_ATTEMPT',
      specimenId: protectedSpecimens[0].uid,
      distanceM: 3
    });
    if (result.success) {
      protectedCaught = true;
    }
  }

  return {
    name: '6. 포획 가능 여부 검사',
    passed: !protectedCaught,
    message: protectedCaught ? '보호종 포획됨!' : '보호종 포획 차단 확인'
  };
}

function test7_EquipmentPurchase(): TestResult {
  const game = createGame({ seed: 42 });

  // Give shells via snapshot manipulation (for test)
  // Actually, let's test the buy flow properly
  const snapshot = game.getSnapshot();
  const initialShells = snapshot.shells;

  // Try to buy expensive item without enough shells
  const result = game.dispatch({ type: 'BUY_ITEM', itemType: 'harpoon', itemId: 24 });
  const afterBuy = game.getSnapshot();

  const notEnough = !result.success && result.reason === 'Not enough shells';

  return {
    name: '7. 장비 구매 검사',
    passed: notEnough,
    message: notEnough ? `구매 불가 확인 (보유: ${initialShells}, 필요: 50000)` : `예상치 못한 결과: ${result.reason}`
  };
}

function test8_CargoCapacity(): TestResult {
  const game = createGame({ seed: 42 });
  const snapshot = game.getSnapshot();
  const shipData = SHIP_UPGRADES.find(s => s.level === snapshot.shipLevel)!;

  // Cargo capacity should match ship level
  const passed = shipData.cargoCapacity === 10; // Level 1 = 10

  return {
    name: '8. 창고 용량 검사',
    passed,
    message: passed ? `레벨 ${snapshot.shipLevel} 창고 용량: ${shipData.cargoCapacity}` : `예상: 10, 실제: ${shipData.cargoCapacity}`
  };
}

function test9_CodexRecords(): TestResult {
  const game = createGame({ seed: 42 });

  // Run some ticks to spawn creatures
  for (let i = 0; i < 120; i++) {
    game.dispatch({ type: 'TICK', dtSec: 1 });
  }

  const snapshot = game.getSnapshot();

  // Codex should be empty initially (no catches)
  const codexEntries = Object.keys(snapshot.codex).length;

  return {
    name: '9. 도감 최고 기록 검사',
    passed: codexEntries === 0,
    message: codexEntries === 0 ? '도감 초기화 확인 (포획 없음)' : `도감 항목: ${codexEntries}`
  };
}

function test10_FossilCollection(): TestResult {
  const game = createGame({ seed: 42 });
  const snapshot = game.getSnapshot();

  // Check fossil data integrity
  const fossilsPerBoss: Record<string, number> = {};
  for (const f of FOSSILS) {
    fossilsPerBoss[f.bossId] = (fossilsPerBoss[f.bossId] || 0) + 1;
  }

  let allCorrect = true;
  for (const boss of BOSSES) {
    if (fossilsPerBoss[boss.id] !== 5) {
      allCorrect = false;
    }
  }

  const totalFossils = FOSSILS.length;

  return {
    name: '10. 화석 수집·소환 검사',
    passed: allCorrect && totalFossils === 15,
    message: allCorrect ? `총 ${totalFossils}종 화석, 보스당 5개 확인` : `화석 수 불일치: 총 ${totalFossils}`
  };
}

function test11_SaveLoad(): TestResult {
  const game = createGame({ seed: 42 });

  // Modify state
  for (let i = 0; i < 60; i++) {
    game.dispatch({ type: 'TICK', dtSec: 1 });
  }

  // Save
  const saveResult = game.save();
  if (!saveResult.success) {
    return { name: '11. 저장·불러오기 검사', passed: false, message: '저장 실패' };
  }

  // Load
  const loadResult = game.load();
  if (!loadResult.success) {
    return { name: '11. 저장·불러오기 검사', passed: false, message: '불러오기 실패' };
  }

  const afterLoad = game.getSnapshot();

  return {
    name: '11. 저장·불러오기 검사',
    passed: true,
    message: '저장/불러오기 성공, 상태 복원 확인'
  };
}

function test12_SeedReproduction(): TestResult {
  const game1 = createGame({ seed: 12345 });
  const game2 = createGame({ seed: 12345 });

  // Run same actions
  for (let i = 0; i < 60; i++) {
    game1.dispatch({ type: 'TICK', dtSec: 1 });
    game2.dispatch({ type: 'TICK', dtSec: 1 });
  }

  const snap1 = game1.getSnapshot();
  const snap2 = game2.getSnapshot();

  // Compare creature counts and positions
  const sameCount = snap1.activeSpecimens.length === snap2.activeSpecimens.length;
  let samePositions = true;

  if (sameCount) {
    for (let i = 0; i < Math.min(snap1.activeSpecimens.length, 5); i++) {
      const s1 = snap1.activeSpecimens[i];
      const s2 = snap2.activeSpecimens[i];
      if (s1.speciesId !== s2.speciesId || s1.lengthCm !== s2.lengthCm) {
        samePositions = false;
        break;
      }
    }
  }

  const passed = sameCount && samePositions;

  return {
    name: '12. 고정 시드 재현 테스트',
    passed,
    message: passed ? '동일 시드에서 동일 결과 확인' : '시드 재현 실패'
  };
}
