// OCEAN GAIA V3.2 — Island Models (12 Islands)
// 세션 B 소유 — 12개 섬 3D 모델

import * as THREE from 'three';
import { ISLANDS, type IslandData } from '../data/world';

export interface IslandConfig {
  size: number;
  height: number;
  terrainColor: number;
  vegetationColor: number;
  hasMangroves?: boolean;
  hasIce?: boolean;
  hasVolcanicRocks?: boolean;
  hasCoral?: boolean;
}

export class IslandModel {
  private island: THREE.Group;
  private data: IslandData;
  private config: IslandConfig;

  constructor(islandId: number) {
    this.data = ISLANDS.find(i => i.id === islandId) || ISLANDS[0];
    this.config = this.getIslandConfig(this.data.region);
    this.island = new THREE.Group();
    this.buildIsland();
  }

  private getIslandConfig(region: string): IslandConfig {
    switch (region) {
      case 'tropical':
        return {
          size: 30,
          height: 8,
          terrainColor: 0xf4e4c1,
          vegetationColor: 0x228b22,
          hasCoral: true,
        };
      case 'mangrove':
        return {
          size: 35,
          height: 5,
          terrainColor: 0x8b7355,
          vegetationColor: 0x2e8b57,
          hasMangroves: true,
        };
      case 'glacier':
        return {
          size: 40,
          height: 15,
          terrainColor: 0xf5f5f5,
          vegetationColor: 0x87ceeb,
          hasIce: true,
        };
      case 'ocean':
        return {
          size: 45,
          height: 10,
          terrainColor: 0xdeb887,
          vegetationColor: 0x3cb371,
        };
      case 'volcanic':
        return {
          size: 38,
          height: 20,
          terrainColor: 0x2f2f2f,
          vegetationColor: 0x556b2f,
          hasVolcanicRocks: true,
        };
      case 'deepsea':
        return {
          size: 25,
          height: 12,
          terrainColor: 0x1c1c1c,
          vegetationColor: 0x2f4f4f,
        };
      default:
        return {
          size: 30,
          height: 8,
          terrainColor: 0xf4e4c1,
          vegetationColor: 0x228b22,
        };
    }
  }

  private buildIsland(): void {
    // 1. 섬 기반 (지형)
    this.createTerrain();

    // 2. 식생
    this.createVegetation();

    // 3. 해역별 특수 요소
    if (this.config.hasMangroves) {
      this.createMangroves();
    }
    if (this.config.hasIce) {
      this.createIce();
    }
    if (this.config.hasVolcanicRocks) {
      this.createVolcanicRocks();
    }
    if (this.config.hasCoral) {
      this.createCoral();
    }

    // 4. 건축물
    if (this.data.hasPort) {
      this.createPort();
    }
    if (this.data.hasShop) {
      this.createShop();
    }
    if (this.data.hasDock) {
      this.createDock();
    }

    // 5. 장식 요소
    this.createDecorations();

    // 6. 섬 이름표
    this.createNameSign();
  }

  private createTerrain(): void {
    // 섬 본체 (원뿔 형태)
    const terrainGeometry = new THREE.ConeGeometry(
      this.config.size,
      this.config.height,
      32,
      4
    );
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: this.config.terrainColor,
      roughness: 0.9,
      metalness: 0.1,
    });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.y = this.config.height / 2 - 2;
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    this.island.add(terrain);

    // 해변 (원반 형태)
    const beachGeometry = new THREE.CylinderGeometry(
      this.config.size * 1.2,
      this.config.size * 1.3,
      1,
      32
    );
    const beachMaterial = new THREE.MeshStandardMaterial({
      color: this.config.terrainColor,
      roughness: 0.9,
    });
    const beach = new THREE.Mesh(beachGeometry, beachMaterial);
    beach.position.y = -1.5;
    beach.receiveShadow = true;
    this.island.add(beach);
  }

  private createVegetation(): void {
    const vegetationCount = Math.floor(this.config.size / 3);

    for (let i = 0; i < vegetationCount; i++) {
      const angle = (i / vegetationCount) * Math.PI * 2;
      const radius = Math.random() * this.config.size * 0.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // 나무 또는 덤불
      if (Math.random() > 0.5) {
        this.createTree(x, this.config.height * 0.3, z);
      } else {
        this.createBush(x, this.config.height * 0.2, z);
      }
    }
  }

  private createTree(x: number, y: number, z: number): void {
    const tree = new THREE.Group();

    // 나무 줄기
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    tree.add(trunk);

    // 나무 잎 (원뿔)
    const leavesGeometry = new THREE.ConeGeometry(2, 3, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({
      color: this.config.vegetationColor,
      roughness: 0.8,
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 5;
    leaves.castShadow = true;
    tree.add(leaves);

    tree.position.set(x, y, z);
    this.island.add(tree);
  }

  private createBush(x: number, y: number, z: number): void {
    const bushGeometry = new THREE.SphereGeometry(1, 8, 8);
    const bushMaterial = new THREE.MeshStandardMaterial({
      color: this.config.vegetationColor,
      roughness: 0.8,
    });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(x, y + 0.5, z);
    bush.scale.y = 0.7;
    bush.castShadow = true;
    this.island.add(bush);
  }

  private createMangroves(): void {
    // 맹그로브 나무 (뿌리가 물 위에 있음)
    const mangroveCount = 15;

    for (let i = 0; i < mangroveCount; i++) {
      const angle = (i / mangroveCount) * Math.PI * 2;
      const radius = this.config.size * 0.8 + Math.random() * 5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const mangrove = new THREE.Group();

      // 뿌리
      for (let j = 0; j < 5; j++) {
        const rootGeometry = new THREE.CylinderGeometry(0.1, 0.15, 3, 6);
        const rootMaterial = new THREE.MeshStandardMaterial({
          color: 0x654321,
          roughness: 0.9,
        });
        const root = new THREE.Mesh(rootGeometry, rootMaterial);
        const rootAngle = (j / 5) * Math.PI * 2;
        root.position.set(
          Math.cos(rootAngle) * 0.5,
          1.5,
          Math.sin(rootAngle) * 0.5
        );
        root.rotation.z = Math.cos(rootAngle) * 0.3;
        root.rotation.x = Math.sin(rootAngle) * 0.3;
        mangrove.add(root);
      }

      // 줄기
      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 4, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9,
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 4;
      trunk.castShadow = true;
      mangrove.add(trunk);

      // 잎
      const leavesGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      const leavesMaterial = new THREE.MeshStandardMaterial({
        color: this.config.vegetationColor,
        roughness: 0.8,
      });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.y = 6;
      leaves.scale.y = 0.6;
      leaves.castShadow = true;
      mangrove.add(leaves);

      mangrove.position.set(x, -1, z);
      this.island.add(mangrove);
    }
  }

  private createIce(): void {
    // 얼음 덩어리
    const iceCount = 20;

    for (let i = 0; i < iceCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.config.size;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const iceGeometry = new THREE.DodecahedronGeometry(1 + Math.random() * 2);
      const iceMaterial = new THREE.MeshStandardMaterial({
        color: 0xadd8e6,
        roughness: 0.2,
        metalness: 0.3,
        transparent: true,
        opacity: 0.7,
      });
      const ice = new THREE.Mesh(iceGeometry, iceMaterial);
      ice.position.set(x, Math.random() * 3, z);
      ice.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      ice.castShadow = true;
      this.island.add(ice);
    }
  }

  private createVolcanicRocks(): void {
    // 화산암
    const rockCount = 25;

    for (let i = 0; i < rockCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.config.size;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const rockGeometry = new THREE.DodecahedronGeometry(1 + Math.random() * 3);
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x1c1c1c,
        roughness: 0.9,
        metalness: 0.2,
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, Math.random() * 2, z);
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      this.island.add(rock);
    }

    // 용암 흐름 (발광)
    const lavaGeometry = new THREE.PlaneGeometry(10, 20);
    const lavaMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff4500,
      emissiveIntensity: 0.8,
      roughness: 0.5,
    });
    const lava = new THREE.Mesh(lavaGeometry, lavaMaterial);
    lava.rotation.x = -Math.PI / 2;
    lava.position.set(0, 0.1, 0);
    this.island.add(lava);

    // 용암 빛
    const lavaLight = new THREE.PointLight(0xff4500, 2, 30);
    lavaLight.position.set(0, 2, 0);
    this.island.add(lavaLight);
  }

  private createCoral(): void {
    // 산호초
    const coralCount = 30;

    for (let i = 0; i < coralCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = this.config.size * 0.9 + Math.random() * 5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const coralColors = [0xff6b9d, 0xffa07a, 0xffd700, 0x98fb98, 0xdda0dd];
      const coralColor = coralColors[Math.floor(Math.random() * coralColors.length)];

      const coralGeometry = new THREE.ConeGeometry(
        0.5 + Math.random() * 1,
        1 + Math.random() * 2,
        8
      );
      const coralMaterial = new THREE.MeshStandardMaterial({
        color: coralColor,
        roughness: 0.7,
      });
      const coral = new THREE.Mesh(coralGeometry, coralMaterial);
      coral.position.set(x, -2, z);
      coral.castShadow = true;
      this.island.add(coral);
    }
  }

  private createPort(): void {
    // 항구 건물
    const portGroup = new THREE.Group();

    // 창고
    const warehouseGeometry = new THREE.BoxGeometry(8, 5, 6);
    const warehouseMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });
    const warehouse = new THREE.Mesh(warehouseGeometry, warehouseMaterial);
    warehouse.position.set(-15, 2.5, 0);
    warehouse.castShadow = true;
    warehouse.receiveShadow = true;
    portGroup.add(warehouse);

    // 창고 지붕
    const roofGeometry = new THREE.ConeGeometry(6, 3, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.8,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-15, 6.5, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    portGroup.add(roof);

    // 크레인
    const craneBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.5, metalness: 0.7 })
    );
    craneBase.position.set(-10, 4, 5);
    portGroup.add(craneBase);

    const craneArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 6, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.5, metalness: 0.7 })
    );
    craneArm.position.set(-10, 10, 5);
    craneArm.rotation.z = Math.PI / 6;
    portGroup.add(craneArm);

    this.island.add(portGroup);
  }

  private createShop(): void {
    // 상점 건물
    const shopGroup = new THREE.Group();

    // 건물 본체
    const buildingGeometry = new THREE.BoxGeometry(6, 4, 5);
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      roughness: 0.7,
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(10, 2, -5);
    building.castShadow = true;
    building.receiveShadow = true;
    shopGroup.add(building);

    // 지붕
    const roofGeometry = new THREE.ConeGeometry(4.5, 2, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(10, 5, -5);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    shopGroup.add(roof);

    // 문
    const doorGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(10, 1.25, -2.5);
    shopGroup.add(door);

    // 간판
    const signGeometry = new THREE.BoxGeometry(3, 1, 0.1);
    const signMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0xffd700,
      emissiveIntensity: 0.2,
    });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(10, 3.5, -2.5);
    shopGroup.add(sign);

    this.island.add(shopGroup);
  }

  private createDock(): void {
    // 부두
    const dockGroup = new THREE.Group();

    // 부두 플랫폼
    const dockGeometry = new THREE.BoxGeometry(10, 0.5, 3);
    const dockMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8,
    });
    const dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(this.config.size + 5, 0, 0);
    dock.castShadow = true;
    dock.receiveShadow = true;
    dockGroup.add(dock);

    // 부두 기둥
    for (let i = 0; i < 5; i++) {
      const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
      const pillarMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a3a1a,
        roughness: 0.9,
      });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(this.config.size + 2 + i * 2, -1.5, 0);
      pillar.castShadow = true;
      dockGroup.add(pillar);
    }

    // 밧줄
    const ropeGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16);
    const ropeMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.9,
    });
    const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope.position.set(this.config.size + 9, 0.5, 0);
    rope.rotation.x = Math.PI / 2;
    dockGroup.add(rope);

    this.island.add(dockGroup);
  }

  private createDecorations(): void {
    // 조개껍데기
    for (let i = 0; i < 15; i++) {
      const shellGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const shellMaterial = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0xffc0cb : 0xfff8dc,
        roughness: 0.6,
      });
      const shell = new THREE.Mesh(shellGeometry, shellMaterial);
      const angle = Math.random() * Math.PI * 2;
      const radius = this.config.size * 0.8 + Math.random() * 3;
      shell.position.set(
        Math.cos(angle) * radius,
        0.1,
        Math.sin(angle) * radius
      );
      shell.scale.y = 0.5;
      this.island.add(shell);
    }

    // 돌
    for (let i = 0; i < 8; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5);
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.9,
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      const angle = Math.random() * Math.PI * 2;
      const radius = this.config.size * 0.9 + Math.random() * 2;
      rock.position.set(
        Math.cos(angle) * radius,
        0.2,
        Math.sin(angle) * radius
      );
      rock.castShadow = true;
      this.island.add(rock);
    }
  }

  private createNameSign(): void {
    // 섬 이름표
    const signGroup = new THREE.Group();

    // 기둥
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 1.5;
    signGroup.add(pole);

    // 이름판
    const boardGeometry = new THREE.BoxGeometry(3, 1, 0.1);
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.7,
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = 3;
    board.castShadow = true;
    signGroup.add(board);

    signGroup.position.set(0, 0, this.config.size + 2);
    this.island.add(signGroup);
  }

  getModel(): THREE.Group {
    return this.island;
  }

  getData(): IslandData {
    return this.data;
  }

  getPosition(): THREE.Vector3 {
    return new THREE.Vector3(this.data.x, 0, this.data.y);
  }
}

// 섬 생성 함수
export function createIsland(islandId: number): IslandModel {
  return new IslandModel(islandId);
}

// 모든 섬 생성
export function createAllIslands(): THREE.Group {
  const group = new THREE.Group();

  ISLANDS.forEach(islandData => {
    const island = createIsland(islandData.id);
    const model = island.getModel();
    model.position.copy(island.getPosition());
    group.add(model);
  });

  return group;
}
