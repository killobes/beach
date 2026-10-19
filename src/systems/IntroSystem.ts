// OCEAN GAIA V3.2 — Intro System
// 세션 B 소유 — 게임 시작 인트로 시퀀스

export interface IntroScene {
  id: number;
  duration: number; // seconds
  type: 'fade_in' | 'text' | 'image' | 'transition';
  content: {
    text?: string;
    subtitle?: string;
    image?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

export const INTRO_SCENES: IntroScene[] = [
  {
    id: 1,
    duration: 3,
    type: 'fade_in',
    content: {
      backgroundColor: '#000000',
    }
  },
  {
    id: 2,
    duration: 5,
    type: 'text',
    content: {
      text: 'OCEAN GAIA',
      subtitle: '바다의 신비로운 세계로',
      textColor: '#00CED1',
      backgroundColor: '#001a33',
    }
  },
  {
    id: 3,
    duration: 4,
    type: 'text',
    content: {
      text: '200종의 해양 생물',
      subtitle: '6개의 해역을 탐험하세요',
      textColor: '#FFFFFF',
      backgroundColor: '#002244',
    }
  },
  {
    id: 4,
    duration: 4,
    type: 'text',
    content: {
      text: '당신의 모험이 시작됩니다',
      subtitle: '산호항에서 첫 걸음을',
      textColor: '#FFD700',
      backgroundColor: '#003355',
    }
  },
  {
    id: 5,
    duration: 3,
    type: 'transition',
    content: {
      backgroundColor: '#000000',
    }
  },
];

export class IntroSystem {
  private currentScene: number = 0;
  private sceneTimer: number = 0;
  private isPlaying: boolean = false;
  private onComplete: (() => void) | null = null;

  start(onComplete: () => void): void {
    this.currentScene = 0;
    this.sceneTimer = 0;
    this.isPlaying = true;
    this.onComplete = onComplete;
  }

  stop(): void {
    this.isPlaying = false;
    this.onComplete = null;
  }

  skip(): void {
    this.isPlaying = false;
    if (this.onComplete) {
      this.onComplete();
    }
  }

  update(dtSec: number): { scene: IntroScene | null; progress: number } {
    if (!this.isPlaying) {
      return { scene: null, progress: 0 };
    }

    this.sceneTimer += dtSec;
    const currentScene = INTRO_SCENES[this.currentScene];

    if (this.sceneTimer >= currentScene.duration) {
      this.sceneTimer = 0;
      this.currentScene++;

      if (this.currentScene >= INTRO_SCENES.length) {
        this.isPlaying = false;
        if (this.onComplete) {
          this.onComplete();
        }
        return { scene: null, progress: 1 };
      }
    }

    const progress = this.sceneTimer / currentScene.duration;
    return { scene: INTRO_SCENES[this.currentScene], progress };
  }

  isPlayingIntro(): boolean {
    return this.isPlaying;
  }

  getCurrentScene(): number {
    return this.currentScene;
  }

  getTotalScenes(): number {
    return INTRO_SCENES.length;
  }
}
