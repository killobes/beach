// OCEAN GAIA V3.2 — Performance Optimizer
// 세션 B 소유 — 대량 생물 렌더링 최적화 가이드
// Three.js import 금지 — 순수 로직만 제공

import type { GameState, Specimen } from '../core/GameEngine';
import { getVisualData, type CreatureVisualData } from '../data/CreatureVisuals';

export interface PerformanceConfig {
  maxVisibleCreatures: number;
  lodDistances: {
    high: number;   // 고품질 모델 (가까운 거리)
    medium: number; // 중간 품질 모델
    low: number;    // 저품질 모델 (먼 거리)
    cull: number;   // 렌더링 제외 거리
  };
  instancingThreshold: number; // 같은 종 몇 마리부터 인스턴싱 사용
  maxParticles: number;
  targetFPS: number;
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  maxVisibleCreatures: 100,
  lodDistances: {
    high: 20,
    medium: 50,
    low: 100,
    cull: 150,
  },
  instancingThreshold: 5,
  maxParticles: 5000,
  targetFPS: 60,
};

export interface LODLevel {
  level: 'high' | 'medium' | 'low';
  polygonCount: number;
  textureResolution: number;
  animationQuality: 'full' | 'simplified' | 'none';
}

export interface RenderBatch {
  speciesId: number;
  specimens: Specimen[];
  lodLevel: LODLevel['level'];
  useInstancing: boolean;
}

/**
 * 성능 최적화 시스템
 * 세션 A가 Three.js에서 구현할 때 참고하는 로직
 */
export class PerformanceOptimizer {
  private config: PerformanceConfig;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private currentFPS: number = 60;

  constructor(config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG) {
    this.config = config;
  }

  /**
   * LOD(Level of Detail) 레벨 결정
   * 카메라와 개체 간 거리에 따라 다른 품질의 모델 사용
   */
  determineLODLevel(distance: number, visualData: CreatureVisualData): LODLevel['level'] {
    // 개체별 LOD 거리 설정 사용
    const customDistances = visualData.lodDistance;
    
    if (distance <= customDistances.high) {
      return 'high';
    } else if (distance <= customDistances.medium) {
      return 'medium';
    } else if (distance <= customDistances.low) {
      return 'low';
    } else {
      return 'low'; // 최대 거리까지는 low 품질 유지
    }
  }

  /**
   * 렌더링 배치 생성
   * 같은 종끼리 묶어서 인스턴싱 렌더링 가능 여부 판단
   */
  createRenderBatches(specimens: Specimen[], cameraPosition: { x: number; y: number; z: number }): RenderBatch[] {
    const batches: Map<number, RenderBatch> = new Map();

    for (const specimen of specimens) {
      // 카메라와의 거리 계산
      const distance = this.calculateDistance3D(
        cameraPosition.x, cameraPosition.y, cameraPosition.z,
        specimen.x, -specimen.depthM, specimen.z
      );

      // cull 거리 초과 시 제외
      if (distance > this.config.lodDistances.cull) {
        continue;
      }

      const visualData = getVisualData(specimen.speciesId);
      const lodLevel = this.determineLODLevel(distance, visualData);

      // 기존 배치 확인
      let batch = batches.get(specimen.speciesId);
      
      if (!batch) {
        batch = {
          speciesId: specimen.speciesId,
          specimens: [],
          lodLevel,
          useInstancing: false,
        };
        batches.set(specimen.speciesId, batch);
      }

      batch.specimens.push(specimen);

      // 인스턴싱 임계값 초과 시 인스턴싱 사용
      if (batch.specimens.length >= this.config.instancingThreshold) {
        batch.useInstancing = true;
      }
    }

    return Array.from(batches.values());
  }

  /**
   * 동적 LOD 조정
   * FPS가 낮아지면 LOD 거리를 줄여서 성능 확보
   */
  adjustLODBasedOnFPS(currentFPS: number): void {
    if (currentFPS < this.config.targetFPS * 0.8) {
      // FPS가 낮으면 LOD 거리 축소
      this.config.lodDistances.high *= 0.9;
      this.config.lodDistances.medium *= 0.9;
      this.config.lodDistances.low *= 0.9;
    } else if (currentFPS > this.config.targetFPS * 0.95) {
      // FPS가 충분하면 LOD 거리 복구
      const defaultConfig = DEFAULT_PERFORMANCE_CONFIG;
      this.config.lodDistances.high = Math.min(
        this.config.lodDistances.high * 1.05,
        defaultConfig.lodDistances.high
      );
      this.config.lodDistances.medium = Math.min(
        this.config.lodDistances.medium * 1.05,
        defaultConfig.lodDistances.medium
      );
      this.config.lodDistances.low = Math.min(
        this.config.lodDistances.low * 1.05,
        defaultConfig.lodDistances.low
      );
    }
  }

  /**
   * 프레임 시간 추적
   */
  updateFrameTime(deltaTime: number): void {
    this.frameCount++;
    this.lastFrameTime += deltaTime;

    if (this.lastFrameTime >= 1.0) {
      this.currentFPS = this.frameCount / this.lastFrameTime;
      this.frameCount = 0;
      this.lastFrameTime = 0;

      // FPS 기반 LOD 조정
      this.adjustLODBasedOnFPS(this.currentFPS);
    }
  }

  /**
   * 3D 거리 계산
   */
  private calculateDistance3D(
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number
  ): number {
    return Math.sqrt(
      Math.pow(x2 - x1, 2) +
      Math.pow(y2 - y1, 2) +
      Math.pow(z2 - z1, 2)
    );
  }

  /**
   * 현재 성능 설정 반환
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * 현재 FPS 반환
   */
  getCurrentFPS(): number {
    return this.currentFPS;
  }
}

/**
 * LOD별 모델 품질 가이드 (세션 A용)
 */
export const LOD_GUIDELINES = {
  high: {
    polygonCount: '2000-5000',
    textureResolution: '1024x1024',
    animationQuality: 'full',
    description: '고품질 모델. 모든 디테일 포함. 가까운 거리용.',
  },
  medium: {
    polygonCount: '500-1500',
    textureResolution: '512x512',
    animationQuality: 'simplified',
    description: '중간 품질. 주요 디테일만 포함. 중간 거리용.',
  },
  low: {
    polygonCount: '100-400',
    textureResolution: '256x256',
    animationQuality: 'none',
    description: '저품질. 기본 형태만. 먼 거리용.',
  },
};

/**
 * 인스턴싱 가이드 (세션 A용)
 * 같은 종의 물고기를 여러 마리 렌더링할 때 사용
 */
export const INSTANCING_GUIDE = {
  description: '같은 종의 물고기를 여러 마리 렌더링할 때 InstancedMesh 사용',
  benefits: [
    'Draw call 감소 (100마리 → 1 draw call)',
    '메모리 사용량 감소',
    'FPS 향상',
  ],
  implementation: `
    // Three.js 예제
    const geometry = createFishGeometry(speciesId);
    const material = createFishMaterial(speciesId);
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    
    // 각 개체의 위치/회전/크기 설정
    for (let i = 0; i < count; i++) {
      const matrix = new THREE.Matrix4();
      matrix.setPosition(specimens[i].x, specimens[i].y, specimens[i].z);
      instancedMesh.setMatrixAt(i, matrix);
    }
    
    scene.add(instancedMesh);
  `,
  variation: '같은 종이라도 크기/색상을 약간씩 다르게하여 자연스러움 유지',
};

/**
 * 컬링 가이드 (세션 A용)
 * 화면 밖에 있는 개체는 렌더링하지 않음
 */
export const CULLING_GUIDE = {
  description: '카메라 시야 밖에 있는 개체는 렌더링 제외',
  frustumCulling: 'Three.js 기본 frustum culling 사용',
  distanceCulling: '설정된 cull 거리 초과 시 완전 제외',
  occlusionCulling: '큰 물체에 가려진 개체는 렌더링 제외 (선택적)',
};

/**
 * 파티클 최적화 가이드 (세션 A용)
 * 기포, 빛 줄기 등 파티클 효과 최적화
 */
export const PARTICLE_GUIDE = {
  maxParticles: 5000,
  pooling: '파티클 풀 사용 (재생성 대신 재활용)',
  lodParticles: '먼 거리에서는 파티클 수 감소',
  gpuParticles: '가능한 경우 GPU 파티클 사용',
};
