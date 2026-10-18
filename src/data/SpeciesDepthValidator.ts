// OCEAN GAIA V3.2 — Species Depth Validator
// 세션 B 소유 — 어종 수심 검증 및 조정 시스템

import { SPECIES_DATA, type SpeciesData, type Region } from './species';
import { DEPTH_CONFIG } from './world';

export interface DepthValidationResult {
  totalSpecies: number;
  validSpecies: number;
  adjustedSpecies: number;
  adjustments: Array<{
    id: number;
    name: string;
    region: Region;
    originalMin: number;
    originalMax: number;
    newMin: number;
    newMax: number;
    reason: string;
  }>;
}

/**
 * 모든 어종의 수심을 새로운 기준에 맞게 검증 및 조정
 */
export function validateAndAdjustSpeciesDepths(): DepthValidationResult {
  const result: DepthValidationResult = {
    totalSpecies: SPECIES_DATA.length,
    validSpecies: 0,
    adjustedSpecies: 0,
    adjustments: [],
  };

  SPECIES_DATA.forEach(species => {
    const depthRange = DEPTH_CONFIG.regionDepths[species.region];
    const isValid = validateSpeciesDepth(species, depthRange);

    if (isValid) {
      result.validSpecies++;
    } else {
      // 수심 조정
      const adjustment = adjustSpeciesDepth(species, depthRange);
      result.adjustments.push(adjustment);
      result.adjustedSpecies++;
    }
  });

  return result;
}

/**
 * 어종 수심이 해역 기준에 맞는지 검증
 */
function validateSpeciesDepth(
  species: SpeciesData,
  depthRange: { min: number; max: number }
): boolean {
  // 최소 수심이 해역 최소 수심보다 크거나 같아야 함
  if (species.depthMinM < depthRange.min) {
    return false;
  }
  
  // 최대 수심이 해역 최대 수심보다 작거나 같아야 함
  if (species.depthMaxM > depthRange.max) {
    return false;
  }
  
  // 최소 수심이 최대 수심보다 작아야 함
  if (species.depthMinM >= species.depthMaxM) {
    return false;
  }
  
  return true;
}

/**
 * 어종 수심을 해역 기준에 맞게 조정
 */
function adjustSpeciesDepth(
  species: SpeciesData,
  depthRange: { min: number; max: number }
): DepthValidationResult['adjustments'][0] {
  const originalMin = species.depthMinM;
  const originalMax = species.depthMaxM;
  
  let newMin = species.depthMinM;
  let newMax = species.depthMaxM;
  let reason = '';
  
  // 최소 수심이 해역 최소 수심보다 작으면 조정
  if (species.depthMinM < depthRange.min) {
    newMin = depthRange.min;
    reason += `최소 수심을 ${depthRange.min}m로 조정. `;
  }
  
  // 최대 수심이 해역 최대 수심보다 크면 조정
  if (species.depthMaxM > depthRange.max) {
    newMax = depthRange.max;
    reason += `최대 수심을 ${depthRange.max}m로 조정. `;
  }
  
  // 최소 수심이 최대 수심보다 크거나 같으면 조정
  if (newMin >= newMax) {
    newMin = Math.max(depthRange.min, newMax - 5);
    reason += `수심 범위 재조정. `;
  }
  
  // 실제 데이터 업데이트
  species.depthMinM = newMin;
  species.depthMaxM = newMax;
  
  return {
    id: species.id,
    name: species.name,
    region: species.region,
    originalMin,
    originalMax,
    newMin,
    newMax,
    reason,
  };
}

/**
 * 수심대별 어종 분포 통계
 */
export function getDepthDistribution(): {
  shallow: number;
  medium: number;
  deep: number;
  abyss: number;
} {
  const distribution = {
    shallow: 0,  // 0~30m
    medium: 0,   // 30~100m
    deep: 0,     // 100~200m
    abyss: 0,    // 200~300m
  };
  
  SPECIES_DATA.forEach(species => {
    const avgDepth = (species.depthMinM + species.depthMaxM) / 2;
    
    if (avgDepth <= 30) {
      distribution.shallow++;
    } else if (avgDepth <= 100) {
      distribution.medium++;
    } else if (avgDepth <= 200) {
      distribution.deep++;
    } else {
      distribution.abyss++;
    }
  });
  
  return distribution;
}

/**
 * 해역별 어종 수심 통계
 */
export function getRegionDepthStats(): Record<Region, {
  count: number;
  avgMin: number;
  avgMax: number;
  avgDepth: number;
}> {
  const stats: Record<Region, { count: number; avgMin: number; avgMax: number; avgDepth: number }> = {
    tropical: { count: 0, avgMin: 0, avgMax: 0, avgDepth: 0 },
    mangrove: { count: 0, avgMin: 0, avgMax: 0, avgDepth: 0 },
    ocean: { count: 0, avgMin: 0, avgMax: 0, avgDepth: 0 },
    glacier: { count: 0, avgMin: 0, avgMax: 0, avgDepth: 0 },
    volcanic: { count: 0, avgMin: 0, avgMax: 0, avgDepth: 0 },
    deepsea: { count: 0, avgMin: 0, avgMax: 0, avgDepth: 0 },
  };
  
  const sums: Record<Region, { min: number; max: number; depth: number }> = {
    tropical: { min: 0, max: 0, depth: 0 },
    mangrove: { min: 0, max: 0, depth: 0 },
    ocean: { min: 0, max: 0, depth: 0 },
    glacier: { min: 0, max: 0, depth: 0 },
    volcanic: { min: 0, max: 0, depth: 0 },
    deepsea: { min: 0, max: 0, depth: 0 },
  };
  
  SPECIES_DATA.forEach(species => {
    stats[species.region].count++;
    sums[species.region].min += species.depthMinM;
    sums[species.region].max += species.depthMaxM;
    sums[species.region].depth += (species.depthMinM + species.depthMaxM) / 2;
  });
  
  // 평균 계산
  for (const region of Object.keys(stats) as Region[]) {
    const count = stats[region].count;
    if (count > 0) {
      stats[region].avgMin = sums[region].min / count;
      stats[region].avgMax = sums[region].max / count;
      stats[region].avgDepth = sums[region].depth / count;
    }
  }
  
  return stats;
}

/**
 * 수심 검증 결과 출력
 */
export function printDepthValidationReport(result: DepthValidationResult): void {
  console.log('\n═══════════════════════════════════════');
  console.log('🌊 어종 수심 검증 보고서');
  console.log('═══════════════════════════════════════\n');
  
  console.log(`총 어종 수: ${result.totalSpecies}`);
  console.log(`유효 어종: ${result.validSpecies}`);
  console.log(`조정된 어종: ${result.adjustedSpecies}\n`);
  
  if (result.adjustments.length > 0) {
    console.log('조정된 어종 목록:');
    result.adjustments.forEach(adj => {
      console.log(`  [${adj.id}] ${adj.name} (${adj.region})`);
      console.log(`    기존: ${adj.originalMin}~${adj.originalMax}m`);
      console.log(`    조정: ${adj.newMin}~${adj.newMax}m`);
      console.log(`    이유: ${adj.reason}\n`);
    });
  }
  
  // 수심대별 분포
  const distribution = getDepthDistribution();
  console.log('\n수심대별 분포:');
  console.log(`  얕은 바다 (0~30m): ${distribution.shallow}종`);
  console.log(`  중층 (30~100m): ${distribution.medium}종`);
  console.log(`  심층 (100~200m): ${distribution.deep}종`);
  console.log(`  심해 (200~300m): ${distribution.abyss}종\n`);
  
  // 해역별 통계
  const regionStats = getRegionDepthStats();
  console.log('해역별 수심 통계:');
  for (const [region, stats] of Object.entries(regionStats)) {
    console.log(`  ${region}: ${stats.count}종, 평균 ${stats.avgDepth.toFixed(1)}m (${stats.avgMin.toFixed(1)}~${stats.avgMax.toFixed(1)}m)`);
  }
}
