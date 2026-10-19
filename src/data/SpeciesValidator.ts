// OCEAN GAIA V3.2 — Species Data Validator
// 세션 B 소유 — 200종 데이터 품질 검증

import { SPECIES_DATA, type SpeciesData } from './species';

export interface ValidationReport {
  totalSpecies: number;
  validSpecies: number;
  invalidSpecies: number;
  warnings: string[];
  errors: string[];
}

export function validateSpeciesDataQuality(): ValidationReport {
  const report: ValidationReport = {
    totalSpecies: SPECIES_DATA.length,
    validSpecies: 0,
    invalidSpecies: 0,
    warnings: [],
    errors: [],
  };

  for (const species of SPECIES_DATA) {
    const issues = validateSingleSpecies(species);
    
    if (issues.errors.length > 0) {
      report.invalidSpecies++;
      report.errors.push(...issues.errors.map(e => `[ID ${species.id}] ${e}`));
    } else {
      report.validSpecies++;
    }
    
    if (issues.warnings.length > 0) {
      report.warnings.push(...issues.warnings.map(w => `[ID ${species.id}] ${w}`));
    }
  }

  return report;
}

function validateSingleSpecies(species: SpeciesData): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. 기본 필드 검증
  if (!species.name || species.name.trim() === '') {
    errors.push('이름이 비어있습니다');
  }
  if (!species.scientificName || species.scientificName.trim() === '') {
    errors.push('학명이 비어있습니다');
  }

  // 2. 크기 검증
  if (species.avgLengthCm <= 0) {
    errors.push(`평균 길이가 0 이하: ${species.avgLengthCm}cm`);
  }
  if (species.maxLengthCm < species.avgLengthCm) {
    errors.push(`최대 길이(${species.maxLengthCm}cm)가 평균 길이(${species.avgLengthCm}cm)보다 작음`);
  }
  if (species.avgWeightKg <= 0) {
    errors.push(`평균 무게가 0 이하: ${species.avgWeightKg}kg`);
  }
  if (species.maxLengthCm > 2000) {
    warnings.push(`비정상적으로 큰 최대 길이: ${species.maxLengthCm}cm`);
  }

  // 3. 게임 범위 검증
  if (species.gameMinLengthCm <= 0) {
    errors.push(`게임 최소 길이가 0 이하: ${species.gameMinLengthCm}cm`);
  }
  if (species.gameMaxLengthCm < species.gameMinLengthCm) {
    errors.push(`게임 최대 길이(${species.gameMaxLengthCm}cm)가 최소 길이(${species.gameMinLengthCm}cm)보다 작음`);
  }
  if (species.gameBaseWeightKg <= 0) {
    errors.push(`게임 기본 무게가 0 이하: ${species.gameBaseWeightKg}kg`);
  }

  // 4. 체장-체중 관계식 검증
  if (species.lengthWeightA <= 0 || species.lengthWeightB <= 0) {
    errors.push(`체장-체중 관계식 계수가 잘못됨: a=${species.lengthWeightA}, b=${species.lengthWeightB}`);
  }

  // 5. 서식 수심 검증
  if (species.depthMinM < 0) {
    errors.push(`최소 서식 수심이 음수: ${species.depthMinM}m`);
  }
  if (species.depthMaxM < species.depthMinM) {
    errors.push(`최대 서식 수심(${species.depthMaxM}m)이 최소 수심(${species.depthMinM}m)보다 작음`);
  }
  if (species.depthMaxM > 11000) {
    warnings.push(`비정상적으로 깊은 서식 수심: ${species.depthMaxM}m`);
  }

  // 6. 희귀도 검증
  if (species.rarity < 1 || species.rarity > 5) {
    errors.push(`희귀도가 범위 벗어남: ${species.rarity} (1-5)`);
  }

  // 7. 판매 가격 검증
  if (species.sellBasePrice < 0) {
    errors.push(`판매 가격이 음수: ${species.sellBasePrice}`);
  }
  if (species.sellBasePrice > 100000) {
    warnings.push(`비정상적으로 높은 판매 가격: ${species.sellBasePrice}`);
  }

  // 8. 행동 패턴 검증
  if (!species.behaviors || species.behaviors.length === 0) {
    warnings.push('행동 패턴이 정의되지 않음');
  }

  // 9. 서식지 검증
  if (!species.habitat || species.habitat.length === 0) {
    warnings.push('서식지가 정의되지 않음');
  }

  // 10. 활동 시간대 검증
  if (!species.activityPattern) {
    warnings.push('활동 시간대가 정의되지 않음');
  }

  // 11. 군집 크기 검증
  if (!species.schoolSize || species.schoolSize.min < 0 || species.schoolSize.max < species.schoolSize.min) {
    errors.push(`군집 크기가 잘못됨: min=${species.schoolSize?.min}, max=${species.schoolSize?.max}`);
  }

  // 12. 수영 속도 검증
  if (!species.swimSpeed || species.swimSpeed.slow < 0 || species.swimSpeed.normal < species.swimSpeed.slow || species.swimSpeed.fast < species.swimSpeed.normal) {
    errors.push(`수영 속도가 잘못됨: slow=${species.swimSpeed?.slow}, normal=${species.swimSpeed?.normal}, fast=${species.swimSpeed?.fast}`);
  }

  // 13. 영양 단계 검증
  if (species.trophicLevel < 1 || species.trophicLevel > 5) {
    errors.push(`영양 단계가 범위 벗어남: ${species.trophicLevel} (1-5)`);
  }

  // 14. 서식지 설명 검증
  if (!species.habitatDescription || species.habitatDescription.trim() === '') {
    warnings.push('서식지 설명이 비어있습니다');
  }

  return { errors, warnings };
}

export function printValidationReport(report: ValidationReport): void {
  console.log('\n═══════════════════════════════════════');
  console.log('📊 200종 어종 데이터 품질 검증 보고서');
  console.log('═══════════════════════════════════════\n');
  
  console.log(`총 종 수: ${report.totalSpecies}`);
  console.log(`유효 종: ${report.validSpecies}`);
  console.log(`무효 종: ${report.invalidSpecies}`);
  console.log(`경고: ${report.warnings.length}개`);
  console.log(`오류: ${report.errors.length}개\n`);

  if (report.errors.length > 0) {
    console.log('❌ 오류 목록:');
    report.errors.forEach(e => console.log(`  - ${e}`));
    console.log('');
  }

  if (report.warnings.length > 0) {
    console.log('⚠️  경고 목록:');
    report.warnings.slice(0, 20).forEach(w => console.log(`  - ${w}`));
    if (report.warnings.length > 20) {
      console.log(`  ... (총 ${report.warnings.length}개 중 20개 표시)`);
    }
    console.log('');
  }

  if (report.invalidSpecies === 0) {
    console.log('✅ 모든 종 데이터가 유효합니다!\n');
  } else {
    console.log(`❌ ${report.invalidSpecies}개 종에서 오류가 발견되었습니다.\n`);
  }
}
