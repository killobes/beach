// OCEAN GAIA V3.2 — Seabed Terrain System
// 세션 B 소유 — 해저 지형 생성 시스템

import * as THREE from 'three';
import { WORLD_CONFIG, DEPTH_CONFIG } from '../data/world';
import type { Region } from '../data/species';

export type TerrainType = 'slope' | 'cliff' | 'canyon' | 'cave' | 'plain';

export interface TerrainFeature {
  type: TerrainType;
  position: THREE.Vector3;
  size: number;
  depth: number;
  region: Region;
}

export class SeabedTerrainSystem {
  private terrain: THREE.Group;
  private features: TerrainFeature[] = [];
  private heightMap: Float32Array;
  private mapWidth: number;
  private mapHeight: number;
  private resolution: number;

  constructor() {
    this.terrain = new THREE.Group();
    this.mapWidth = WORLD_CONFIG.widthM;
    this.mapHeight = WORLD_CONFIG.heightM;
    this.resolution = 50; // 50m 격자
    this.heightMap = new Float32Array(
      Math.ceil(this.mapWidth / this.resolution) * 
      Math.ceil(this.mapHeight / this.resolution)
    );
    
    this.generateHeightMap();
    this.generateTerrainMesh();
    this.generateTerrainFeatures();
  }

  /**
   * 노이즈 기반 높이맵 생성
   */
  private generateHeightMap(): void {
    const widthCells = Math.ceil(this.mapWidth / this.resolution);
    const heightCells = Math.ceil(this.mapHeight / this.resolution);

    for (let z = 0; z < heightCells; z++) {
      for (let x = 0; x < widthCells; x++) {
        const worldX = x * this.resolution;
        const worldZ = z * this.resolution;
        const region = this.getRegionAt(worldX, worldZ);
        
        // 해역별 기본 깊이
        const baseDepth = this.getBaseDepth(region);
        
        // 노이즈 추가
        const noise1 = this.perlinNoise(worldX * 0.001, worldZ * 0.001) * 20;
        const noise2 = this.perlinNoise(worldX * 0.005, worldZ * 0.005) * 5;
        const noise3 = this.perlinNoise(worldX * 0.01, worldZ * 0.01) * 2;
        
        // 해역 경계에서는 깊 급변
        const edgeFactor = this.getEdgeFactor(worldX, worldZ);
        
        const depth = baseDepth + noise1 + noise2 + noise3 + edgeFactor;
        
        this.heightMap[z * widthCells + x] = Math.max(0, Math.min(DEPTH_CONFIG.maxDepth, depth));
      }
    }
  }

  /**
   * 해역별 기본 깊이 반환
   */
  private getBaseDepth(region: Region): number {
    const depthRange = DEPTH_CONFIG.regionDepths[region as keyof typeof DEPTH_CONFIG.regionDepths];
    return (depthRange.min + depthRange.max) / 2;
  }

  /**
   * 해역 경계 계수 (경계에서 깊이 급변)
   */
  private getEdgeFactor(x: number, z: number): number {
    const regions = WORLD_CONFIG.regions;
    let minDistance = Infinity;
    
    // 모든 해역 경계와의 거리 계산
    for (const [region, bounds] of Object.entries(regions)) {
      // X 경계
      const distXMin = Math.abs(x - bounds.xMin);
      const distXMax = Math.abs(x - bounds.xMax);
      // Z 경계
      const distZMin = Math.abs(z - bounds.zMin);
      const distZMax = Math.abs(z - bounds.zMax);
      
      minDistance = Math.min(minDistance, distXMin, distXMax, distZMin, distZMax);
    }
    
    // 경계에서 200m 이내일수록 깊이 증가
    if (minDistance < 200) {
      return (200 - minDistance) * 0.5;
    }
    
    return 0;
  }

  /**
   * 간단한 Perlin 노이즈
   */
  private perlinNoise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const u = this.fade(xf);
    const v = this.fade(yf);
    
    const aa = this.random(X, Y);
    const ab = this.random(X, Y + 1);
    const ba = this.random(X + 1, Y);
    const bb = this.random(X + 1, Y + 1);
    
    const x1 = this.lerp(aa, ba, u);
    const x2 = this.lerp(ab, bb, u);
    
    return this.lerp(x1, x2, v);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private random(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * 위치 기반 해역 판별
   */
  private getRegionAt(x: number, z: number): Region {
    const regions = WORLD_CONFIG.regions;
    for (const [region, bounds] of Object.entries(regions)) {
      if (x >= bounds.xMin && x < bounds.xMax && 
          z >= bounds.zMin && z < bounds.zMax) {
        return region as Region;
      }
    }
    return 'ocean';
  }

  /**
   * 높이맵 기반 지형 메시 생성
   */
  private generateTerrainMesh(): void {
    const widthCells = Math.ceil(this.mapWidth / this.resolution);
    const heightCells = Math.ceil(this.mapHeight / this.resolution);
    
    const geometry = new THREE.PlaneGeometry(
      this.mapWidth,
      this.mapHeight,
      widthCells - 1,
      heightCells - 1
    );
    
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // 월드 좌표로 변환
      const worldX = x + this.mapWidth / 2;
      const worldZ = y + this.mapHeight / 2;
      
      // 높이맵에서 깊이 가져오기
      const gridX = Math.floor(worldX / this.resolution);
      const gridZ = Math.floor(worldZ / this.resolution);
      const depth = this.heightMap[gridZ * widthCells + gridX] || 0;
      
      // Z축으로 설정 (아래로)
      positions.setZ(i, -depth);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // 재질 (해역별 색상)
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(this.mapWidth / 2, 0, this.mapHeight / 2);
    mesh.receiveShadow = true;
    
    this.terrain.add(mesh);
  }

  /**
   * 지형 특징 생성 (절벽, 협곡, 동굴)
   */
  private generateTerrainFeatures(): void {
    // 절벽 생성 (해역 경계)
    this.generateCliffs();
    
    // 협곡 생성 (심해 해역)
    this.generateCanyons();
    
    // 동굴 생성 (랜덤)
    this.generateCaves();
  }

  /**
   * 절벽 생성
   */
  private generateCliffs(): void {
    const regions = WORLD_CONFIG.regions;
    const regionEntries = Object.entries(regions);
    
    for (let i = 0; i < regionEntries.length; i++) {
      for (let j = i + 1; j < regionEntries.length; j++) {
        const [region1, bounds1] = regionEntries[i];
        const [region2, bounds2] = regionEntries[j];
        
        // 인접한 해역인지 확인
        if (this.areRegionsAdjacent(bounds1, bounds2)) {
          // 경계선에 절벽 생성
          const cliffCount = 3 + Math.floor(Math.random() * 3);
          
          for (let k = 0; k < cliffCount; k++) {
            const t = Math.random();
            let x, z;
            
            // 경계선 따라 위치 계산
            if (Math.abs(bounds1.xMax - bounds2.xMin) < 100) {
              x = bounds1.xMax;
              z = bounds1.zMin + t * (bounds1.zMax - bounds1.zMin);
            } else {
              x = bounds1.xMin + t * (bounds1.xMax - bounds1.xMin);
              z = bounds1.zMax;
            }
            
            const depth = this.getDepthAt(x, z);
            
            this.features.push({
              type: 'cliff',
              position: new THREE.Vector3(x, -depth, z),
              size: 50 + Math.random() * 100,
              depth: depth,
              region: region1 as Region,
            });
          }
        }
      }
    }
  }

  /**
   * 협곡 생성 (심해 해역)
   */
  private generateCanyons(): void {
    const deepseaBounds = WORLD_CONFIG.regions.deepsea;
    const canyonCount = 5;
    
    for (let i = 0; i < canyonCount; i++) {
      const x = deepseaBounds.xMin + Math.random() * (deepseaBounds.xMax - deepseaBounds.xMin);
      const z = deepseaBounds.zMin + Math.random() * (deepseaBounds.zMax - deepseaBounds.zMin);
      const depth = this.getDepthAt(x, z);
      
      this.features.push({
        type: 'canyon',
        position: new THREE.Vector3(x, -depth, z),
        size: 100 + Math.random() * 200,
        depth: depth,
        region: 'deepsea',
      });
    }
  }

  /**
   * 동굴 생성
   */
  private generateCaves(): void {
    const caveCount = 15;
    
    for (let i = 0; i < caveCount; i++) {
      const region = this.getRandomRegion();
      const bounds = WORLD_CONFIG.regions[region];
      
      const x = bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin);
      const z = bounds.zMin + Math.random() * (bounds.zMax - bounds.zMin);
      const depth = this.getDepthAt(x, z);
      
      this.features.push({
        type: 'cave',
        position: new THREE.Vector3(x, -depth, z),
        size: 20 + Math.random() * 50,
        depth: depth,
        region: region,
      });
    }
  }

  /**
   * 두 해역이 인접한지 확인
   */
  private areRegionsAdjacent(
    bounds1: { xMin: number; xMax: number; zMin: number; zMax: number },
    bounds2: { xMin: number; xMax: number; zMin: number; zMax: number }
  ): boolean {
    return (
      Math.abs(bounds1.xMax - bounds2.xMin) < 100 ||
      Math.abs(bounds1.xMin - bounds2.xMax) < 100 ||
      Math.abs(bounds1.zMax - bounds2.zMin) < 100 ||
      Math.abs(bounds1.zMin - bounds2.zMax) < 100
    );
  }

  /**
   * 특정 위치의 깊이 반환
   */
  private getDepthAt(x: number, z: number): number {
    const widthCells = Math.ceil(this.mapWidth / this.resolution);
    const gridX = Math.floor(x / this.resolution);
    const gridZ = Math.floor(z / this.resolution);
    
    if (gridX < 0 || gridX >= widthCells || gridZ < 0 || gridZ >= widthCells) {
      return 0;
    }
    
    return this.heightMap[gridZ * widthCells + gridX] || 0;
  }

  /**
   * 랜덤 해역 선택
   */
  private getRandomRegion(): Region {
    const regions: Region[] = ['tropical', 'mangrove', 'ocean', 'glacier', 'volcanic', 'deepsea'];
    return regions[Math.floor(Math.random() * regions.length)] as Region;
  }

  /**
   * 지형 특징 시각화 (디버깅용)
   */
  visualizeFeatures(): THREE.Group {
    const group = new THREE.Group();
    
    this.features.forEach(feature => {
      let geometry: THREE.BufferGeometry;
      let material: THREE.MeshStandardMaterial;
      
      switch (feature.type) {
        case 'cliff':
          geometry = new THREE.BoxGeometry(feature.size, 50, feature.size);
          material = new THREE.MeshStandardMaterial({ color: 0x808080 });
          break;
        case 'canyon':
          geometry = new THREE.CylinderGeometry(feature.size / 2, feature.size / 2, 100, 16);
          material = new THREE.MeshStandardMaterial({ color: 0x2f4f4f });
          break;
        case 'cave':
          geometry = new THREE.SphereGeometry(feature.size / 2, 16, 16);
          material = new THREE.MeshStandardMaterial({ color: 0x1c1c1c });
          break;
        default:
          geometry = new THREE.BoxGeometry(10, 10, 10);
          material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(feature.position);
      group.add(mesh);
    });
    
    return group;
  }

  getModel(): THREE.Group {
    return this.terrain;
  }

  getFeatures(): TerrainFeature[] {
    return this.features;
  }

  getDepthAtPosition(x: number, z: number): number {
    return this.getDepthAt(x, z);
  }
}
