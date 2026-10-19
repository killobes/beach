// OCEAN GAIA V3.2 — Tutorial System
// 세션 B 소유 — 게임 튜토리얼 및 온보딩 시스템

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  objective: string;
  hint?: string;
  checkCompletion: (state: any) => boolean;
  reward?: {
    shells?: number;
    item?: string;
  };
}

export interface TutorialProgress {
  currentStep: number;
  completedSteps: string[];
  startedAt: number;
  lastCompletedAt: number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // 1. 게임 시작
  {
    id: 'start',
    title: 'OCEAN GAIA에 오신 것을 환영합니다!',
    description: '당신은 해양 탐험가입니다. 바다의 신비를 탐험하고 200종의 어류를 발견하세요.',
    objective: '시작섬에서 모험을 시작하세요',
    hint: 'WASD 키로 선박을 이동할 수 있습니다',
    checkCompletion: (state) => state.tick > 0,
    reward: { shells: 50 },
  },
  
  // 2. 선박 이동
  {
    id: 'move_ship',
    title: '선박 조종',
    description: 'W키로 전진, A/D키로 회전, S키로 후진합니다.',
    objective: '선박을 이동시켜보세요',
    hint: '화면 상단의 나침반을 확인하세요',
    checkCompletion: (state) => state.shipX !== 755 || state.shipZ !== 1780,
  },
  
  // 3. 입수
  {
    id: 'enter_water',
    title: '잠수 준비',
    description: 'E키를 눌러 물속에 들어가세요. 잠수복과 산소통이 준비되어 있습니다.',
    objective: '물속으로 들어가세요',
    hint: '산소량이 줄어들면 수면으로 올라와야 합니다',
    checkCompletion: (state) => state.inWater,
  },
  
  // 4. 생물 관찰
  {
    id: 'observe_creature',
    title: '생물 관찰',
    description: '물고기 근처에서 F키를 눌러 관찰하세요. 도감에 기록됩니다.',
    objective: '물고기 1마리를 관찰하세요',
    hint: '관찰하면 보상을 받을 수 있습니다',
    checkCompletion: (state) => Object.values(state.codex).some((entry: any) => entry.observeCount > 0),
    reward: { shells: 30 },
  },
  
  // 5. 작살 사용
  {
    id: 'use_harpoon',
    title: '작살 사용법',
    description: '물고기를 조준하고 Space 키를 눌러 작살을 발사하세요.',
    objective: '물고기 1마리를 포획하세요',
    hint: '가까울수록, 작은 물고기일수록 포획하기 쉽습니다',
    checkCompletion: (state) => state.totalCatches > 0,
    reward: { shells: 50 },
  },
  
  // 6. 귀선
  {
    id: 'return_to_ship',
    title: '수면으로 귀환',
    description: 'Q키를 눌러 선박으로 돌아갑니다. 산소가 부족하기 전에 돌아오세요!',
    objective: '선박으로 돌아오세요',
    hint: '산소 게이지를 확인하세요',
    checkCompletion: (state) => !state.inWater && state.totalDives > 0,
  },
  
  // 7. 판매
  {
    id: 'sell_catch',
    title: '포획물 판매',
    description: '항구에서 포획한 물고기를 판매하여 조개를 얻습니다.',
    objective: '물고기를 판매하세요',
    hint: 'Enter 키로 빠르게 판매할 수 있습니다',
    checkCompletion: (state) => state.shells > 100,
    reward: { shells: 20 },
  },
  
  // 8. 장비 업그레이드
  {
    id: 'upgrade_equipment',
    title: '장비 업그레이드',
    description: '조개를 모아 더 좋은 장비를 구매하세요. 깊은 바다로 갈 수 있습니다.',
    objective: '장비를 업그레이드하세요',
    hint: '상점에서 장비를 구매할 수 있습니다',
    checkCompletion: (state) => state.equippedHarpoon > 1 || state.equippedTank > 1 || state.equippedSuit > 1,
    reward: { shells: 100 },
  },
  
  // 9. 선박 업그레이드
  {
    id: 'upgrade_ship',
    title: '선박 업그레이드',
    description: '더 좋은 선박으로 업그레이드하면 더 먼 바다로 나갈 수 있습니다.',
    objective: '선박을 업그레이드하세요',
    hint: '선박 업그레이드는 더 많은 화물과 빠른 속도를 제공합니다',
    checkCompletion: (state) => state.shipLevel > 1,
    reward: { shells: 200 },
  },
  
  // 10. 새로운 해역 탐험
  {
    id: 'explore_new_region',
    title: '새로운 해역 탐험',
    description: '다른 해역으로 이동하여 새로운 물고기를 발견하세요!',
    objective: '새로운 해역에 도달하세요',
    hint: '각 해역마다 고유한 물고기가 있습니다',
    checkCompletion: (state) => {
      const regions = new Set(Object.values(state.codex).map((entry: any) => entry.discoveredRegions).flat());
      return regions.size > 1;
    },
    reward: { shells: 150 },
  },
  
  // 11. 도감 완성 진행
  {
    id: 'codex_progress',
    title: '도감 완성',
    description: '200종의 물고기를 모두 발견하세요. 각 물고기마다 고유한 특징이 있습니다.',
    objective: '10종의 물고기를 발견하세요',
    hint: '관찰만 해도 도감에 기록됩니다',
    checkCompletion: (state) => Object.keys(state.codex).length >= 10,
    reward: { shells: 300 },
  },
  
  // 12. 수심 탐험
  {
    id: 'depth_exploration',
    title: '수심 탐험',
    description: '더 깊은 바다로 잠수하세요. 깊은 곳에는 희귀한 물고기가 있습니다.',
    objective: '50m 깊이까지 잠수하세요',
    hint: '더 좋은 산소통과 잠수복이 필요합니다',
    checkCompletion: (state) => Math.abs(state.diverY) >= 50,
    reward: { shells: 250 },
  },
  
  // 13. 유랑 상인
  {
    id: 'traveling_merchant',
    title: '유랑 상인',
    description: '유랑 상인이 항구를 방문하면 희귀 아이템을 구매할 수 있습니다.',
    objective: '유랑 상인에게서 아이템을 구매하세요',
    hint: '상인은 주기적으로 다른 항구를 방문합니다',
    checkCompletion: (state) => state.merchant.totalVisits > 0,
    reward: { shells: 100 },
  },
  
  // 14. 동료 영입
  {
    id: 'recruit_companion',
    title: '동료 영입',
    description: '특정 조건을 달성하면 동료를 영입할 수 있습니다. 동료는 특별한 보너스를 제공합니다.',
    objective: '동료 1명을 영입하세요',
    hint: '미아, 아리, 레오 중 한 명을 선택할 수 있습니다',
    checkCompletion: (state) => state.companions.length > 0,
    reward: { shells: 500 },
  },
  
  // 15. 튜토리얼 완료
  {
    id: 'tutorial_complete',
    title: '튜토리얼 완료!',
    description: '축하합니다! 이제 OCEAN GAIA의 기본을 모두 배웠습니다. 바다의 신비를 탐험하세요!',
    objective: '튜토리얼을 완료하세요',
    hint: '이제 자유롭게 탐험할 수 있습니다',
    checkCompletion: () => true,
    reward: { shells: 1000 },
  },
];

export class TutorialSystem {
  private progress: TutorialProgress;
  private onComplete: (() => void) | null = null;

  constructor() {
    this.progress = {
      currentStep: 0,
      completedSteps: [],
      startedAt: Date.now(),
      lastCompletedAt: Date.now(),
    };
  }

  /**
   * 튜토리얼 시작
   */
  start(onComplete?: () => void): void {
    this.onComplete = onComplete || null;
    this.progress.startedAt = Date.now();
  }

  /**
   * 현재 단계 반환
   */
  getCurrentStep(): TutorialStep | null {
    if (this.progress.currentStep >= TUTORIAL_STEPS.length) {
      return null;
    }
    return TUTORIAL_STEPS[this.progress.currentStep];
  }

  /**
   * 진행 상태 업데이트
   */
  update(gameState: any): { completed: boolean; reward?: any } {
    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      return { completed: true };
    }

    // 완료 조건 확인
    if (currentStep.checkCompletion(gameState)) {
      // 단계 완료
      this.progress.completedSteps.push(currentStep.id);
      this.progress.lastCompletedAt = Date.now();
      this.progress.currentStep++;

      // 보상 확인
      const reward = currentStep.reward;

      // 마지막 단계인지 확인
      if (this.progress.currentStep >= TUTORIAL_STEPS.length) {
        if (this.onComplete) {
          this.onComplete();
        }
        return { completed: true, reward };
      }

      return { completed: false, reward };
    }

    return { completed: false };
  }

  /**
   * 진행률 계산 (0-100)
   */
  getProgress(): number {
    return (this.progress.currentStep / TUTORIAL_STEPS.length) * 100;
  }

  /**
   * 완료된 단계 수
   */
  getCompletedCount(): number {
    return this.progress.completedSteps.length;
  }

  /**
   * 전체 단계 수
   */
  getTotalSteps(): number {
    return TUTORIAL_STEPS.length;
  }

  /**
   * 튜토리얼 완료 여부
   */
  isCompleted(): boolean {
    return this.progress.currentStep >= TUTORIAL_STEPS.length;
  }

  /**
   * 진행 상태 저장
   */
  save(): TutorialProgress {
    return { ...this.progress };
  }

  /**
   * 진행 상태 불러오기
   */
  load(savedProgress: TutorialProgress): void {
    this.progress = { ...savedProgress };
  }

  /**
   * 튜토리얼 리셋
   */
  reset(): void {
    this.progress = {
      currentStep: 0,
      completedSteps: [],
      startedAt: Date.now(),
      lastCompletedAt: Date.now(),
    };
  }

  /**
   * 특정 단계로 이동 (디버그용)
   */
  skipToStep(stepId: string): void {
    const stepIndex = TUTORIAL_STEPS.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      this.progress.currentStep = stepIndex;
    }
  }

  /**
   * 튜토리얼 정보 반환
   */
  getInfo(): {
    currentStep: TutorialStep | null;
    progress: number;
    completedCount: number;
    totalSteps: number;
    isCompleted: boolean;
  } {
    return {
      currentStep: this.getCurrentStep(),
      progress: this.getProgress(),
      completedCount: this.getCompletedCount(),
      totalSteps: this.getTotalSteps(),
      isCompleted: this.isCompleted(),
    };
  }
}

/**
 * 튜토리얼 UI 데이터 생성
 */
export function createTutorialUIData(step: TutorialStep, progress: number): {
  title: string;
  description: string;
  objective: string;
  hint?: string;
  progressText: string;
  rewardText?: string;
} {
  return {
    title: step.title,
    description: step.description,
    objective: step.objective,
    hint: step.hint,
    progressText: `${Math.round(progress)}% 완료`,
    rewardText: step.reward 
      ? `보상: ${step.reward.shells ? `${step.reward.shells} 조개` : ''}${step.reward.item ? ` + ${step.reward.item}` : ''}`
      : undefined,
  };
}
