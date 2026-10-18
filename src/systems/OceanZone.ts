// OCEAN GAIA V3.2 — Ocean Zone Environment
// 세션 B 소유 — 6개 해역 환경 시스템

import * as THREE from 'three';
import { WORLD_CONFIG } from '../data/world';
import type { Region } from '../data/species';

export interface ZoneEnvironment {
  region: Region;
  waterColor: number;
  waterOpacity: number;
  fogColor: number;
  fogDensity: number;
  skyColor: number;
  ambientLightIntensity: number;
  sunLightColor: number;
  sunLightIntensity: number;
  terrainColor: number;
  description: string;
}

export const ZONE_ENVIRONMENTS: Record<Region, ZoneEnvironment> = {
  tropical: {
    region: 'tropical',
    waterColor: 0x00ced1, // 밝은 청록색
    waterOpacity: 0.7,
    fogColor: 0x87ceeb, // 하늘색
    fogDensity: 0.002,
    skyColor: 0x87ceeb,
    ambientLightIntensity: 0.7,
    sunLightColor: 0xffffff,
    sunLightIntensity: 1.0,
    terrainColor: 0xf4e4c1, // 모래색
    description: '따뜻하고 맑은 열대 바다',
  },
  mangrove: {
    region: 'mangrove',
    waterColor: 0x2e8b57, // 녹색-갈색
    waterOpacity: 0.8,
    fogColor: 0x90a090, // 회녹색
    fogDensity: 0.004,
    skyColor: 0xb0c4b0,
    ambientLightIntensity: 0.5,
    sunLightColor: 0xffffe0,
    sunLightIntensity: 0.8,
    terrainColor: 0x8b7355, // 늪지색
    description: '안개 낀 맹그로브 늪지대',
  },
  glacier: {
    region: 'glacier',
    waterColor: 0x4682b4, // 차가운 회색
    waterOpacity: 0.75,
    fogColor: 0xdcdcdc, // 밝은 회색
    fogDensity: 0.003,
    skyColor: 0xe0e0e0,
    ambientLightIntensity: 0.6,
    sunLightColor: 0xf0f8ff,
    sunLightIntensity: 0.9,
    terrainColor: 0xf5f5f5, // 눈/얼음색
    description: '차가운 빙하 바다',
  },
  ocean: {
    region: 'ocean',
    waterColor: 0x006994, // 깊은 파란색
    waterOpacity: 0.85,
    fogColor: 0x4682b4,
    fogDensity: 0.001,
    skyColor: 0x4682b4,
    ambientLightIntensity: 0.6,
    sunLightColor: 0xffffff,
    sunLightIntensity: 1.0,
    terrainColor: 0x2f4f4f, // 짙은 녹색
    description: '넓고 깊은 대양',
  },
  volcanic: {
    region: 'volcanic',
    waterColor: 0x8b4513, // 붉은 갈색
    waterOpacity: 0.9,
    fogColor: 0x696969, // 회색
    fogDensity: 0.005,
    skyColor: 0x8b0000,
    ambientLightIntensity: 0.4,
    sunLightColor: 0xff4500,
    sunLightIntensity: 0.7,
    terrainColor: 0x1c1c1c, // 검은 암석
    description: '화산 활동이 있는 뜨거운 바다',
  },
  deepsea: {
    region: 'deepsea',
    waterColor: 0x000033, // 매우 짙은 파란색
    waterOpacity: 0.95,
    fogColor: 0x000000, // 검은색
    fogDensity: 0.01,
    skyColor: 0x000033,
    ambientLightIntensity: 0.2,
    sunLightColor: 0x4169e1,
    sunLightIntensity: 0.3,
    terrainColor: 0x191970, // 짙은 청색
    description: '어둡고 깊은 심해',
  },
};

export class OceanZoneSystem {
  private scene: THREE.Scene;
  private currentRegion: Region = 'tropical';
  private waterMesh: THREE.Mesh | null = null;
  private fog: THREE.FogExp2 | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializeEnvironment();
  }

  private initializeEnvironment(): void {
    // 바다 평면 생성
    const waterGeometry = new THREE.PlaneGeometry(
      WORLD_CONFIG.widthM,
      WORLD_CONFIG.heightM,
      100,
      100
    );
    const env = ZONE_ENVIRONMENTS[this.currentRegion];
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: env.waterColor,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: env.waterOpacity,
    });
    this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(
      WORLD_CONFIG.widthM / 2,
      WORLD_CONFIG.seaLevel,
      WORLD_CONFIG.heightM / 2
    );
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // 안개 설정
    this.fog = new THREE.FogExp2(env.fogColor, env.fogDensity);
    this.scene.fog = this.fog;

    // 배경색 설정
    this.scene.background = new THREE.Color(env.skyColor);

    // 환경광
    this.ambientLight = new THREE.AmbientLight(0xffffff, env.ambientLightIntensity);
    this.scene.add(this.ambientLight);

    // 태양광
    this.sunLight = new THREE.DirectionalLight(env.sunLightColor, env.sunLightIntensity);
    this.sunLight.position.set(100, 100, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    this.scene.add(this.sunLight);
  }

  /**
   * 현재 해역 변경
   */
  changeRegion(region: Region): void {
    if (this.currentRegion === region) return;

    this.currentRegion = region;
    const env = ZONE_ENVIRONMENTS[region];

    // 물 색상 변경
    if (this.waterMesh) {
      const material = this.waterMesh.material as THREE.MeshStandardMaterial;
      material.color.setHex(env.waterColor);
      material.opacity = env.waterOpacity;
    }

    // 안개 변경
    if (this.fog) {
      this.fog.color.setHex(env.fogColor);
      this.fog.density = env.fogDensity;
    }

    // 배경색 변경
    if (this.scene.background) {
      (this.scene.background as THREE.Color).setHex(env.skyColor);
    }

    // 환경광 변경
    if (this.ambientLight) {
      this.ambientLight.intensity = env.ambientLightIntensity;
    }

    // 태양광 변경
    if (this.sunLight) {
      this.sunLight.color.setHex(env.sunLightColor);
      this.sunLight.intensity = env.sunLightIntensity;
    }
  }

  /**
   * 현재 해역 정보 반환
   */
  getCurrentRegion(): Region {
    return this.currentRegion;
  }

  /**
   * 현재 해역 환경 정보 반환
   */
  getCurrentEnvironment(): ZoneEnvironment {
    return ZONE_ENVIRONMENTS[this.currentRegion];
  }

  /**
   * 위치 기반 해역 자동 감지
   */
  detectRegionFromPosition(x: number, z: number): Region {
    const regions = WORLD_CONFIG.regions;
    for (const [region, bounds] of Object.entries(regions)) {
      if (
        x >= bounds.xMin &&
        x < bounds.xMax &&
        z >= bounds.zMin &&
        z < bounds.zMax
      ) {
        return region as Region;
      }
    }
    return 'ocean'; // 기본값
  }

  /**
   * 위치 기반 해역 자동 전환
   */
  updateRegionFromPosition(x: number, z: number): void {
    const detectedRegion = this.detectRegionFromPosition(x, z);
    this.changeRegion(detectedRegion);
  }

  /**
   * 바다 애니메이션 (파도 효과)
   */
  updateWaterAnimation(time: number): void {
    if (!this.waterMesh) return;

    const geometry = this.waterMesh.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      // 파도 효과
      const wave1 = Math.sin(x * 0.05 + time) * 0.3;
      const wave2 = Math.sin(y * 0.05 + time * 0.8) * 0.2;
      const wave3 = Math.sin((x + y) * 0.03 + time * 1.2) * 0.15;

      positions.setZ(i, wave1 + wave2 + wave3);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * 해역별 특수 효과 추가
   */
  addRegionSpecificEffects(region: Region): void {
    switch (region) {
      case 'tropical':
        this.addTropicalEffects();
        break;
      case 'mangrove':
        this.addMangroveEffects();
        break;
      case 'glacier':
        this.addGlacierEffects();
        break;
      case 'ocean':
        this.addOceanEffects();
        break;
      case 'volcanic':
        this.addVolcanicEffects();
        break;
      case 'deepsea':
        this.addDeepseaEffects();
        break;
    }
  }

  private addTropicalEffects(): void {
    // 산호초 파티클
    const coralGeometry = new THREE.BufferGeometry();
    const coralCount = 100;
    const coralPositions = new Float32Array(coralCount * 3);

    for (let i = 0; i < coralCount * 3; i += 3) {
      coralPositions[i] = Math.random() * 1600; // 열대 영역
      coralPositions[i + 1] = -5 - Math.random() * 10;
      coralPositions[i + 2] = Math.random() * 1600;
    }

    coralGeometry.setAttribute('position', new THREE.BufferAttribute(coralPositions, 3));
    const coralMaterial = new THREE.PointsMaterial({
      color: 0xff6b9d,
      size: 2,
      transparent: true,
      opacity: 0.6,
    });
    const corals = new THREE.Points(coralGeometry, coralMaterial);
    this.scene.add(corals);
  }

  private addMangroveEffects(): void {
    // 안개 파티클
    const fogGeometry = new THREE.BufferGeometry();
    const fogCount = 50;
    const fogPositions = new Float32Array(fogCount * 3);

    for (let i = 0; i < fogCount * 3; i += 3) {
      fogPositions[i] = 1600 + Math.random() * 1600; // 맹그로브 영역
      fogPositions[i + 1] = Math.random() * 5;
      fogPositions[i + 2] = Math.random() * 1600;
    }

    fogGeometry.setAttribute('position', new THREE.BufferAttribute(fogPositions, 3));
    const fogMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 5,
      transparent: true,
      opacity: 0.3,
    });
    const fogParticles = new THREE.Points(fogGeometry, fogMaterial);
    this.scene.add(fogParticles);
  }

  private addGlacierEffects(): void {
    // 눈 파티클
    const snowGeometry = new THREE.BufferGeometry();
    const snowCount = 200;
    const snowPositions = new Float32Array(snowCount * 3);

    for (let i = 0; i < snowCount * 3; i += 3) {
      snowPositions[i] = 3200 + Math.random() * 1600; // 빙하 영역
      snowPositions[i + 1] = Math.random() * 50;
      snowPositions[i + 2] = Math.random() * 1600;
    }

    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const snow = new THREE.Points(snowGeometry, snowMaterial);
    this.scene.add(snow);
  }

  private addOceanEffects(): void {
    // 큰 파도 효과는 updateWaterAnimation에서 처리
  }

  private addVolcanicEffects(): void {
    // 용암 파티클
    const lavaGeometry = new THREE.BufferGeometry();
    const lavaCount = 50;
    const lavaPositions = new Float32Array(lavaCount * 3);

    for (let i = 0; i < lavaCount * 3; i += 3) {
      lavaPositions[i] = 2400 + Math.random() * 2400; // 화산 영역
      lavaPositions[i + 1] = -10 - Math.random() * 20;
      lavaPositions[i + 2] = 1600 + Math.random() * 800;
    }

    lavaGeometry.setAttribute('position', new THREE.BufferAttribute(lavaPositions, 3));
    const lavaMaterial = new THREE.PointsMaterial({
      color: 0xff4500,
      size: 3,
      transparent: true,
      opacity: 0.7,
    });
    const lava = new THREE.Points(lavaGeometry, lavaMaterial);
    this.scene.add(lava);
  }

  private addDeepseaEffects(): void {
    // 생체발광 파티클
    const glowGeometry = new THREE.BufferGeometry();
    const glowCount = 100;
    const glowPositions = new Float32Array(glowCount * 3);

    for (let i = 0; i < glowCount * 3; i += 3) {
      glowPositions[i] = 2400 + Math.random() * 2400; // 심해 영역
      glowPositions[i + 1] = -50 - Math.random() * 100;
      glowPositions[i + 2] = 2400 + Math.random() * 800;
    }

    glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
    const glowMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 1,
      transparent: true,
      opacity: 0.5,
    });
    const glow = new THREE.Points(glowGeometry, glowMaterial);
    this.scene.add(glow);
  }
}
