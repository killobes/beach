// OCEAN GAIA V3.2 — Starting Island Model
// 세션 B 소유 — 시작섬 (산호항) 3D 모델

import * as THREE from 'three';

export interface IslandConfig {
  name: string;
  size: number; // meters
  position: THREE.Vector3;
  hasPort: boolean;
  hasShop: boolean;
  hasHouse: boolean;
}

export class StartingIslandModel {
  private island: THREE.Group;
  private config: IslandConfig;

  constructor(config: IslandConfig) {
    this.config = config;
    this.island = new THREE.Group();
    this.buildIsland();
  }

  private buildIsland(): void {
    // 1. 섬 기반 (모래 해변)
    this.createBeach();

    // 2. 중앙 언덕 (잔디)
    this.createHill();

    // 3. 야자나무
    this.createPalmTrees();

    // 4. 항구 (부두)
    if (this.config.hasPort) {
      this.createPort();
    }

    // 5. 상점
    if (this.config.hasShop) {
      this.createShop();
    }

    // 6. 플레이어 집
    if (this.config.hasHouse) {
      this.createHouse();
    }

    // 7. 해변 장식 (조개, 돌)
    this.createBeachDecorations();

    // 8. 바다
    this.createSurroundingSea();
  }

  private createBeach(): void {
    // 원형 섬 기반
    const beachGeometry = new THREE.CylinderGeometry(
      this.config.size,
      this.config.size * 1.2,
      2,
      32
    );
    const beachMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4e4c1, // 모래 색상
      roughness: 0.9,
      metalness: 0.1,
    });
    const beach = new THREE.Mesh(beachGeometry, beachMaterial);
    beach.position.y = -1;
    beach.receiveShadow = true;
    this.island.add(beach);
  }

  private createHill(): void {
    // 중앙 언덕
    const hillGeometry = new THREE.SphereGeometry(
      this.config.size * 0.6,
      32,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    const hillMaterial = new THREE.MeshStandardMaterial({
      color: 0x7cba3d, // 잔디 색상
      roughness: 0.8,
      metalness: 0.1,
    });
    const hill = new THREE.Mesh(hillGeometry, hillMaterial);
    hill.position.y = 0;
    hill.receiveShadow = true;
    hill.castShadow = true;
    this.island.add(hill);
  }

  private createPalmTrees(): void {
    // 야자나무 5개
    const treePositions = [
      new THREE.Vector3(-15, 0, -10),
      new THREE.Vector3(12, 0, -15),
      new THREE.Vector3(-20, 0, 8),
      new THREE.Vector3(18, 0, 12),
      new THREE.Vector3(0, 0, -20),
    ];

    treePositions.forEach(pos => {
      const tree = this.createPalmTree();
      tree.position.copy(pos);
      tree.position.y = 1;
      this.island.add(tree);
    });
  }

  private createPalmTree(): THREE.Group {
    const tree = new THREE.Group();

    // 나무 줄기
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 8, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.9,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 4;
    trunk.castShadow = true;
    tree.add(trunk);

    // 야자树叶 (6개)
    for (let i = 0; i < 6; i++) {
      const leafGeometry = new THREE.PlaneGeometry(4, 1);
      const leafMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d5016,
        side: THREE.DoubleSide,
        roughness: 0.8,
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.y = 8;
      leaf.rotation.y = (i / 6) * Math.PI * 2;
      leaf.rotation.x = -Math.PI / 6;
      leaf.castShadow = true;
      tree.add(leaf);
    }

    return tree;
  }

  private createPort(): void {
    // 부두
    const dockGroup = new THREE.Group();

    // 부두 플랫폼
    const dockGeometry = new THREE.BoxGeometry(8, 0.5, 3);
    const dockMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8,
    });
    const dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(25, 0, 0);
    dock.castShadow = true;
    dock.receiveShadow = true;
    dockGroup.add(dock);

    // 부두 기둥
    for (let i = 0; i < 4; i++) {
      const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
      const pillarMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a3a1a,
        roughness: 0.9,
      });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(22 + i * 2, -1.5, 0);
      pillar.castShadow = true;
      dockGroup.add(pillar);
    }

    // 선박 정박용 밧줄
    const ropeGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16);
    const ropeMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.9,
    });
    const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope.position.set(28, 0.5, 0);
    rope.rotation.x = Math.PI / 2;
    dockGroup.add(rope);

    this.island.add(dockGroup);
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
    building.position.set(-10, 2, -5);
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
    roof.position.set(-10, 5, -5);
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
    door.position.set(-10, 1.25, -2.5);
    shopGroup.add(door);

    // 간판
    const signGeometry = new THREE.BoxGeometry(3, 1, 0.1);
    const signMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.5,
      metalness: 0.3,
    });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(-10, 3.5, -2.5);
    shopGroup.add(sign);

    this.island.add(shopGroup);
  }

  private createHouse(): void {
    // 플레이어 집 (간단한 버전, HomeBaseSystem에서 확장)
    const houseGroup = new THREE.Group();

    // 집 본체
    const houseGeometry = new THREE.BoxGeometry(5, 3, 5);
    const houseMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.7,
    });
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(10, 1.5, -10);
    house.castShadow = true;
    house.receiveShadow = true;
    houseGroup.add(house);

    // 지붕
    const roofGeometry = new THREE.ConeGeometry(4, 2, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.8,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(10, 4, -10);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    // 문
    const doorGeometry = new THREE.BoxGeometry(1.2, 2, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(10, 1, -7.5);
    houseGroup.add(door);

    // 창문
    const windowGeometry = new THREE.BoxGeometry(1, 1, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.7,
    });
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(8, 2, -7.5);
    houseGroup.add(window1);

    const window2 = window1.clone();
    window2.position.x = 12;
    houseGroup.add(window2);

    this.island.add(houseGroup);
  }

  private createBeachDecorations(): void {
    // 조개껍데기
    for (let i = 0; i < 20; i++) {
      const shellGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const shellMaterial = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0xffc0cb : 0xfff8dc,
        roughness: 0.6,
      });
      const shell = new THREE.Mesh(shellGeometry, shellMaterial);
      const angle = Math.random() * Math.PI * 2;
      const radius = this.config.size * 0.8 + Math.random() * 5;
      shell.position.set(
        Math.cos(angle) * radius,
        0.1,
        Math.sin(angle) * radius
      );
      shell.scale.y = 0.5;
      this.island.add(shell);
    }

    // 돌
    for (let i = 0; i < 10; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5);
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.9,
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      const angle = Math.random() * Math.PI * 2;
      const radius = this.config.size * 0.9 + Math.random() * 3;
      rock.position.set(
        Math.cos(angle) * radius,
        0.2,
        Math.sin(angle) * radius
      );
      rock.castShadow = true;
      this.island.add(rock);
    }
  }

  private createSurroundingSea(): void {
    // 주변 바다
    const seaGeometry = new THREE.PlaneGeometry(200, 200);
    const seaMaterial = new THREE.MeshStandardMaterial({
      color: 0x006994,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: 0.8,
    });
    const sea = new THREE.Mesh(seaGeometry, seaMaterial);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -2;
    sea.receiveShadow = true;
    this.island.add(sea);
  }

  getModel(): THREE.Group {
    return this.island;
  }

  getPosition(): THREE.Vector3 {
    return this.config.position;
  }
}

// 시작섬 생성 함수
export function createStartingIsland(): StartingIslandModel {
  const config: IslandConfig = {
    name: '산호항',
    size: 30,
    position: new THREE.Vector3(755, 0, 1780),
    hasPort: true,
    hasShop: true,
    hasHouse: true,
  };

  return new StartingIslandModel(config);
}
