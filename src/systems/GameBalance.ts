// OCEAN GAIA V3.2 — Game Balance System
// 세션 B 소유 — 게임 밸런스 조정 시스템

import { SPECIES_DATA, type SpeciesData } from '../data/species';
import { HARPOONS, TANKS, SUITS, SHIP_UPGRADES } from '../data/equipment';

export interface BalanceConfig {
  // 경제 밸런스
  economy: {
    startingShells: number;
    catchValueMultiplier: number;
    upgradeCostMultiplier: number;
    merchantPriceVariation: number; // 0-1
  };
  
  // 진행 밸런스
  progression: {
    earlyGameDepth: number; // 0-30m
    midGameDepth: number; // 30-100m
    lateGameDepth: number; // 100-200m
    endGameDepth: number; // 200-300m
    speciesPerDepth: number; // 각 수심대별 평균 종 수
  };
  
  // 난이도 밸런스
  difficulty: {
    catchProbabilityBase: number; // 0-1
    catchProbabilityPerRarity: number; // 희귀도당 감소율
    catchProbabilityPerDepth: number; // 수심당 감소율
    observationRewardMultiplier: number;
  };
  
  // 시간 밸런스
  time: {
    earlyGameDuration: number; // 분 (0-30m 달성까지)
    midGameDuration: number; // 분 (30-100m 달성까지)
    lateGameDuration: number; // 분 (100-200m 달성까지)
    endGameDuration: number; // 분 (200-300m 달성까지)
  };
}

export const DEFAULT_BALANCE_CONFIG: BalanceConfig = {
  economy: {
    startingShells: 100,
    catchValueMultiplier: 1.0,
    upgradeCostMultiplier: 1.0,
    merchantPriceVariation: 0.2,
  },
  progression: {
    earlyGameDepth: 30,
    midGameDepth: 100,
    lateGameDepth: 200,
    endGameDepth: 300,
    speciesPerDepth: 50,
  },
  difficulty: {
    catchProbabilityBase: 0.7,
    catchProbabilityPerRarity: 0.08,
    catchProbabilityPerDepth: 0.001,
    observationRewardMultiplier: 1.0,
  },
  time: {
    earlyGameDuration: 15, // 15분
    midGameDuration: 45, // 45분
    lateGameDuration: 90, // 90분
    endGameDuration: 150, // 150분
  },
};

export class GameBalanceSystem {
  private config: BalanceConfig;

  constructor(config: BalanceConfig = DEFAULT_BALANCE_CONFIG) {
    this.config = config;
  }

  /**
   * 종의 가치 계산 (판매 가격)
   */
  calculateSpeciesValue(species: SpeciesData, lengthCm: number, weightKg: number): number {
    // 기본 가격
    const basePrice = species.sellBasePrice;
    
    // 크기 보너스 (지수 함수)
    const sizeRatio = lengthCm / species.gameBaseLengthCm;
    const sizeBonus = Math.pow(sizeRatio, 1.5);
    
    // 희귀도 보너스
    const rarityBonus = 1 + (species.rarity - 1) * 0.3;
    
    // 수심 보너스 (깊을수록 가치 있음)
    const avgDepth = (species.depthMinM + species.depthMaxM) / 2;
    const depthBonus = 1 + (avgDepth / 100) * 0.2;
    
    // 최종 가치
    const value = basePrice * sizeBonus * rarityBonus * depthBonus * this.config.economy.catchValueMultiplier;
    
    return Math.round(value);
  }

  /**
   * 포획 확률 계산
   */
  calculateCatchProbability(
    species: SpeciesData,
    distance: number,
    depth: number,
    harpoonId: number,
    companionBonus: number = 0
  ): number {
    const harpoon = HARPOONS.find(h => h.id === harpoonId);
    if (!harpoon) return 0;
    
    // 기본 확률
    let probability = this.config.difficulty.catchProbabilityBase;
    
    // 작살 보너스
    probability += harpoon.catchBonus;
    
    // 거리 페널티
    const distanceRatio = distance / harpoon.range;
    probability -= distanceRatio * 0.3;
    
    // 작살 안정성 보너스
    probability += harpoon.stability * 0.02;
    
    // 희귀도 페널티
    probability -= species.rarity * this.config.difficulty.catchProbabilityPerRarity;
    
    // 수심 페널티
    probability -= depth * this.config.difficulty.catchProbabilityPerDepth;
    
    // 동료 보너스
    probability += companionBonus;
    
    // 확률 제한 (5% ~ 95%)
    return Math.max(0.05, Math.min(0.95, probability));
  }

  /**
   * 관찰 보상 계산
   */
  calculateObservationReward(species: SpeciesData): number {
    // 기본 보상
    const baseReward = species.observationPoints;
    
    // 희귀도 보너스
    const rarityBonus = 1 + (species.rarity - 1) * 0.5;
    
    // 수심 보너스
    const avgDepth = (species.depthMinM + species.depthMaxM) / 2;
    const depthBonus = 1 + (avgDepth / 100) * 0.3;
    
    // 최종 보상
    const reward = baseReward * rarityBonus * depthBonus * this.config.difficulty.observationRewardMultiplier;
    
    return Math.round(reward);
  }

  /**
   * 장비 업그레이드 비용 계산
   */
  calculateUpgradeCost(currentLevel: number, equipmentType: 'harpoon' | 'tank' | 'suit' | 'ship'): number {
    let baseCost = 0;
    
    switch (equipmentType) {
      case 'harpoon':
        baseCost = 500 * Math.pow(1.5, currentLevel);
        break;
      case 'tank':
        baseCost = 800 * Math.pow(1.6, currentLevel);
        break;
      case 'suit':
        baseCost = 1000 * Math.pow(1.7, currentLevel);
        break;
      case 'ship':
        baseCost = 2000 * Math.pow(2.0, currentLevel);
        break;
    }
    
    return Math.round(baseCost * this.config.economy.upgradeCostMultiplier);
  }

  /**
   * 진행률 분석
   */
  analyzeProgression(
    currentDepth: number,
    speciesCaught: number,
    totalShells: number,
    playTimeMinutes: number
  ): {
    phase: 'early' | 'mid' | 'late' | 'end';
    progress: number; // 0-100
    nextGoal: string;
    estimatedTimeToNext: number; // 분
  } {
    let phase: 'early' | 'mid' | 'late' | 'end';
    let progress: number;
    let nextGoal: string;
    let estimatedTimeToNext: number;
    
    if (currentDepth < this.config.progression.earlyGameDepth) {
      phase = 'early';
      progress = (currentDepth / this.config.progression.earlyGameDepth) * 25;
      nextGoal = `${this.config.progression.earlyGameDepth}m 수심 도달`;
      estimatedTimeToNext = this.config.time.earlyGameDuration - playTimeMinutes;
    } else if (currentDepth < this.config.progression.midGameDepth) {
      phase = 'mid';
      progress = 25 + ((currentDepth - this.config.progression.earlyGameDepth) / 
                (this.config.progression.midGameDepth - this.config.progression.earlyGameDepth)) * 25;
      nextGoal = `${this.config.progression.midGameDepth}m 수심 도달`;
      estimatedTimeToNext = this.config.time.midGameDuration - playTimeMinutes;
    } else if (currentDepth < this.config.progression.lateGameDepth) {
      phase = 'late';
      progress = 50 + ((currentDepth - this.config.progression.midGameDepth) / 
                (this.config.progression.lateGameDepth - this.config.progression.midGameDepth)) * 25;
      nextGoal = `${this.config.progression.lateGameDepth}m 수심 도달`;
      estimatedTimeToNext = this.config.time.lateGameDuration - playTimeMinutes;
    } else {
      phase = 'end';
      progress = 75 + ((currentDepth - this.config.progression.lateGameDepth) / 
                (this.config.progression.endGameDepth - this.config.progression.lateGameDepth)) * 25;
      nextGoal = '게임 완료';
      estimatedTimeToNext = this.config.time.endGameDuration - playTimeMinutes;
    }
    
    return {
      phase,
      progress: Math.min(100, Math.max(0, progress)),
      nextGoal,
      estimatedTimeToNext: Math.max(0, estimatedTimeToNext),
    };
  }

  /**
   * 밸런스 검증
   */
  validateBalance(): { valid: boolean; issues: string[]; warnings: string[] } {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // 1. 종 가치 분포 확인
    const values = SPECIES_DATA.map(s => this.calculateSpeciesValue(s, s.gameBaseLengthCm, s.gameBaseWeightKg));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    
    if (maxValue / minValue > 100) {
      warnings.push(`종 가치 편차가 너무 큽니다: ${minValue} ~ ${maxValue}`);
    }
    
    // 2. 포획 확률 확인
    const probabilities = SPECIES_DATA.map(s => 
      this.calculateCatchProbability(s, 5, s.depthMinM, 1)
    );
    const minProb = Math.min(...probabilities);
    const maxProb = Math.max(...probabilities);
    
    if (minProb < 0.05) {
      issues.push(`포획 확률이 너무 낮은 종이 있습니다: ${minProb}`);
    }
    if (maxProb > 0.95) {
      warnings.push(`포획 확률이 너무 높은 종이 있습니다: ${maxProb}`);
    }
    
    // 3. 진행 시간 확인
    if (this.config.time.earlyGameDuration < 10) {
      warnings.push('초반 진행 시간이 너무 짧습니다');
    }
    if (this.config.time.endGameDuration > 300) {
      warnings.push('엔드게임 진행 시간이 너무 깁니다');
    }
    
    // 4. 경제 순환 확인
    const upgradeCosts = [
      this.calculateUpgradeCost(1, 'ship'),
      this.calculateUpgradeCost(2, 'ship'),
      this.calculateUpgradeCost(3, 'ship'),
      this.calculateUpgradeCost(4, 'ship'),
    ];
    
    if (upgradeCosts[0] > avgValue * 10) {
      warnings.push('첫 선박 업그레이드 비용이 너무 비쌉니다');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * 밸런스 리포트 생성
   */
  generateBalanceReport(): string {
    const report: string[] = [];
    
    report.push('═══════════════════════════════════════');
    report.push('🎮 게임 밸런스 리포트');
    report.push('═══════════════════════════════════════\n');
    
    // 종 가치 분포
    const values = SPECIES_DATA.map(s => this.calculateSpeciesValue(s, s.gameBaseLengthCm, s.gameBaseWeightKg));
    report.push('📊 종 가치 분포:');
    report.push(`  최소: ${Math.min(...values)} 조개`);
    report.push(`  최대: ${Math.max(...values)} 조개`);
    report.push(`  평균: ${Math.round(values.reduce((a, b) => a + b, 0) / values.length)} 조개\n`);
    
    // 포획 확률 분포
    const probabilities = SPECIES_DATA.map(s => 
      this.calculateCatchProbability(s, 5, s.depthMinM, 1)
    );
    report.push('🎯 포획 확률 분포:');
    report.push(`  최소: ${(Math.min(...probabilities) * 100).toFixed(1)}%`);
    report.push(`  최대: ${(Math.max(...probabilities) * 100).toFixed(1)}%`);
    report.push(`  평균: ${(probabilities.reduce((a, b) => a + b, 0) / probabilities.length * 100).toFixed(1)}%\n`);
    
    // 진행 시간
    report.push('⏱️ 예상 진행 시간:');
    report.push(`  초반 (0~30m): ${this.config.time.earlyGameDuration}분`);
    report.push(`  중반 (30~100m): ${this.config.time.midGameDuration}분`);
    report.push(`  후반 (100~200m): ${this.config.time.lateGameDuration}분`);
    report.push(`  엔드게임 (200~300m): ${this.config.time.endGameDuration}분`);
    report.push(`  총 플레이 시간: ${this.config.time.earlyGameDuration + this.config.time.midGameDuration + this.config.time.lateGameDuration + this.config.time.endGameDuration}분\n`);
    
    // 밸런스 검증
    const validation = this.validateBalance();
    report.push('✅ 밸런스 검증:');
    if (validation.valid) {
      report.push('  모든 검증 통과\n');
    } else {
      report.push('  문제 발생:');
      validation.issues.forEach(issue => report.push(`    ❌ ${issue}`));
      report.push('');
    }
    
    if (validation.warnings.length > 0) {
      report.push('⚠️ 경고:');
      validation.warnings.forEach(warning => report.push(`  ⚠️ ${warning}`));
      report.push('');
    }
    
    return report.join('\n');
  }

  getConfig(): BalanceConfig {
    return { ...this.config };
  }
}
