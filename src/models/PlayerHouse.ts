// OCEAN GAIA V3.2 — Player House Model
// 세션 B 소유 — 플레이어 집 3D 모델 (집 꾸미기 시스템 연동)

import * as THREE from 'three';
import { FURNITURE_CATALOG, type FurnitureItem } from '../systems/HomeBaseSystem';

export interface HouseConfig {
  level: number; // 1-5
  position: THREE.Vector3;
}

export class PlayerHouseModel {
  private house: THREE.Group;
  private config: HouseConfig;
  private furnitureModels: Map<number, THREE.Group> = new Map();

  constructor(config: HouseConfig) {
    this.config = config;
    this.house = new THREE.Group();
    this.buildHouse();
  }

  private buildHouse(): void {
    // 집 레벨에 따라 크기 조정
    const sizeMultiplier = 1 + (this.config.level - 1) * 0.3;

    // 1. 집 본체
    this.createHouseBody(sizeMultiplier);

    // 2. 지붕
    this.createRoof(sizeMultiplier);

    // 3. 문
    this.createDoor();

    // 4. 창문
    this.createWindows(sizeMultiplier);

    // 5. 내부 바닥
    this.createFloor(sizeMultiplier);

    // 6. 레벨별 추가 요소
    if (this.config.level >= 2) {
      this.createChimney();
    }
    if (this.config.level >= 3) {
      this.createBalcony();
    }
    if (this.config.level >= 4) {
      this.createGarden();
    }
    if (this.config.level >= 5) {
      this.createFlag();
    }
  }

  private createHouseBody(sizeMultiplier: number): void {
    const width = 5 * sizeMultiplier;
    const height = 3 * sizeMultiplier;
    const depth = 5 * sizeMultiplier;

    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.getHouseColor(),
      roughness: 0.7,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    this.house.add(body);
  }

  private getHouseColor(): number {
    // 레벨별 집 색상
    const colors = [
      0xdeb887, // 레벨 1: 기본 베이지
      0xd2b48c, // 레벨 2: 탄
      0xbc8f8f, // 레벨 3: 로지 브라운
      0x8fbc8f, // 레벨 4: 다크 씨 그린
      0x4682b4, // 레벨 5: 스틸 블루
    ];
    return colors[this.config.level - 1] || colors[0];
  }

  private createRoof(sizeMultiplier: number): void {
    const roofSize = 4 * sizeMultiplier;
    const roofGeometry = new THREE.ConeGeometry(roofSize, 2 * sizeMultiplier, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.8,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3 * sizeMultiplier + 1 * sizeMultiplier;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    this.house.add(roof);
  }

  private createDoor(): void {
    const doorGeometry = new THREE.BoxGeometry(1.2, 2, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1, 2.5);
    this.house.add(door);

    // 문 손잡이
    const knobGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const knobMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.8,
    });
    const knob = new THREE.Mesh(knobGeometry, knobMaterial);
    knob.position.set(0.4, 1, 2.55);
    this.house.add(knob);
  }

  private createWindows(sizeMultiplier: number): void {
    const windowGeometry = new THREE.BoxGeometry(1, 1, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.7,
    });

    // 왼쪽 창문
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-1.5, 2, 2.5);
    this.house.add(window1);

    // 오른쪽 창문
    const window2 = window1.clone();
    window2.position.x = 1.5;
    this.house.add(window2);

    // 창문 프레임
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });

    [window1, window2].forEach(win => {
      // 수평 프레임
      const hFrame = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.05, 0.12),
        frameMaterial
      );
      hFrame.position.copy(win.position);
      hFrame.position.z += 0.01;
      this.house.add(hFrame);

      // 수직 프레임
      const vFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.1, 0.12),
        frameMaterial
      );
      vFrame.position.copy(win.position);
      vFrame.position.z += 0.01;
      this.house.add(vFrame);
    });
  }

  private createFloor(sizeMultiplier: number): void {
    const floorGeometry = new THREE.PlaneGeometry(
      5 * sizeMultiplier,
      5 * sizeMultiplier
    );
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    this.house.add(floor);
  }

  private createChimney(): void {
    const chimneyGeometry = new THREE.BoxGeometry(0.8, 2, 0.8);
    const chimneyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
    });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(2, 4.5, -2);
    chimney.castShadow = true;
    this.house.add(chimney);
  }

  private createBalcony(): void {
    const balconyGroup = new THREE.Group();

    // 발코니 바닥
    const floorGeometry = new THREE.BoxGeometry(3, 0.2, 1.5);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, 2.5, 3.25);
    floor.castShadow = true;
    balconyGroup.add(floor);

    // 난간
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });

    // 앞쪽 난간
    const frontRail = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.8, 0.1),
      railMaterial
    );
    frontRail.position.set(0, 3, 4);
    balconyGroup.add(frontRail);

    // 옆쪽 난간
    const sideRail1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.8, 1.5),
      railMaterial
    );
    sideRail1.position.set(-1.5, 3, 3.25);
    balconyGroup.add(sideRail1);

    const sideRail2 = sideRail1.clone();
    sideRail2.position.x = 1.5;
    balconyGroup.add(sideRail2);

    this.house.add(balconyGroup);
  }

  private createGarden(): void {
    const gardenGroup = new THREE.Group();

    // 꽃 5개
    for (let i = 0; i < 5; i++) {
      const flower = this.createFlower();
      const angle = (i / 5) * Math.PI * 2;
      flower.position.set(
        Math.cos(angle) * 4,
        0,
        Math.sin(angle) * 4
      );
      gardenGroup.add(flower);
    }

    this.house.add(gardenGroup);
  }

  private createFlower(): THREE.Group {
    const flower = new THREE.Group();

    // 줄기
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.8,
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.4;
    flower.add(stem);

    // 꽃잎
    const petalGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const petalMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0xff69b4 : 0xffff00,
      roughness: 0.6,
    });
    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    petal.position.y = 0.8;
    flower.add(petal);

    return flower;
  }

  private createFlag(): void {
    // 깃대
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.5,
      metalness: 0.7,
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, 6.5, 0);
    this.house.add(pole);

    // 깃발
    const flagGeometry = new THREE.PlaneGeometry(1.5, 1);
    const flagMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ced1,
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(0.75, 7.5, 0);
    this.house.add(flag);
  }

  /**
   * 가구 배치
   */
  placeFurniture(furniture: FurnitureItem): void {
    const model = this.createFurnitureModel(furniture);
    model.position.set(
      furniture.position.x,
      furniture.position.y,
      furniture.position.z
    );
    model.rotation.y = furniture.rotation;
    model.scale.setScalar(furniture.scale);

    this.furnitureModels.set(furniture.id, model);
    this.house.add(model);
  }

  /**
   * 가구 제거
   */
  removeFurniture(furnitureId: number): void {
    const model = this.furnitureModels.get(furnitureId);
    if (model) {
      this.house.remove(model);
      this.furnitureModels.delete(furnitureId);
    }
  }

  /**
   * 가구 이동
   */
  moveFurniture(furnitureId: number, newPosition: { x: number; y: number; z: number }): void {
    const model = this.furnitureModels.get(furnitureId);
    if (model) {
      model.position.set(newPosition.x, newPosition.y, newPosition.z);
    }
  }

  private createFurnitureModel(furniture: FurnitureItem): THREE.Group {
    const model = new THREE.Group();

    switch (furniture.category) {
      case 'bed':
        this.createBed(model, furniture);
        break;
      case 'table':
        this.createTable(model, furniture);
        break;
      case 'chair':
        this.createChair(model, furniture);
        break;
      case 'storage':
        this.createStorage(model, furniture);
        break;
      case 'decoration':
        this.createDecoration(model, furniture);
        break;
      case 'lighting':
        this.createLighting(model, furniture);
        break;
      case 'aquarium':
        this.createAquarium(model, furniture);
        break;
    }

    return model;
  }

  private createBed(model: THREE.Group, furniture: FurnitureItem): void {
    // 침대 프레임
    const frameGeometry = new THREE.BoxGeometry(1.5, 0.3, 2);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 0.15;
    model.add(frame);

    // 매트리스
    const mattressGeometry = new THREE.BoxGeometry(1.4, 0.2, 1.9);
    const mattressMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
    });
    const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
    mattress.position.y = 0.4;
    model.add(mattress);

    // 베개
    const pillowGeometry = new THREE.BoxGeometry(0.5, 0.15, 0.3);
    const pillowMaterial = new THREE.MeshStandardMaterial({
      color: 0xadd8e6,
      roughness: 0.9,
    });
    const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
    pillow.position.set(0, 0.55, -0.7);
    model.add(pillow);
  }

  private createTable(model: THREE.Group, furniture: FurnitureItem): void {
    // 테이블 상판
    const topGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.8);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.7,
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 0.8;
    model.add(top);

    // 다리 4개
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });

    const positions = [
      [-0.5, 0.4, -0.3],
      [0.5, 0.4, -0.3],
      [-0.5, 0.4, 0.3],
      [0.5, 0.4, 0.3],
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      model.add(leg);
    });
  }

  private createChair(model: THREE.Group, furniture: FurnitureItem): void {
    // 의자 좌석
    const seatGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.y = 0.5;
    model.add(seat);

    // 등받이
    const backGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.1);
    const back = new THREE.Mesh(backGeometry, seatMaterial);
    back.position.set(0, 0.8, -0.2);
    model.add(back);

    // 다리 4개
    const legGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    const positions = [
      [-0.2, 0.25, -0.2],
      [0.2, 0.25, -0.2],
      [-0.2, 0.25, 0.2],
      [0.2, 0.25, 0.2],
    ];

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, seatMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      model.add(leg);
    });
  }

  private createStorage(model: THREE.Group, furniture: FurnitureItem): void {
    // 상자/옷장
    const boxGeometry = new THREE.BoxGeometry(1, 1.5, 0.8);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.8,
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.y = 0.75;
    model.add(box);

    // 손잡이
    const handleGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 16);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.8,
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.75, 0.41);
    model.add(handle);
  }

  private createDecoration(model: THREE.Group, furniture: FurnitureItem): void {
    // 장식 (조개, 산호 등)
    const decorGeometry = new THREE.DodecahedronGeometry(0.3);
    const decorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffc0cb,
      roughness: 0.6,
    });
    const decor = new THREE.Mesh(decorGeometry, decorMaterial);
    decor.position.y = 0.3;
    model.add(decor);
  }

  private createLighting(model: THREE.Group, furniture: FurnitureItem): void {
    // 램프
    const baseGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.1, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.05;
    model.add(base);

    // 램프 몸통
    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.5, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.5,
      emissive: 0xffd700,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.35;
    model.add(body);

    // 실제 조명
    const light = new THREE.PointLight(0xffd700, 1, 5);
    light.position.y = 0.5;
    model.add(light);
  }

  private createAquarium(model: THREE.Group, furniture: FurnitureItem): void {
    // 수족관 유리
    const tankGeometry = new THREE.BoxGeometry(1, 0.8, 0.5);
    const tankMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.3,
    });
    const tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.y = 0.4;
    model.add(tank);

    // 수족관 바닥 (모래)
    const sandGeometry = new THREE.BoxGeometry(0.95, 0.05, 0.45);
    const sandMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4e4c1,
      roughness: 0.9,
    });
    const sand = new THREE.Mesh(sandGeometry, sandMaterial);
    sand.position.y = 0.05;
    model.add(sand);

    // 작은 물고기 (간단한 형태)
    const fishGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
    const fishMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6347,
      roughness: 0.6,
    });
    const fish = new THREE.Mesh(fishGeometry, fishMaterial);
    fish.position.set(0, 0.4, 0);
    fish.rotation.z = Math.PI / 2;
    model.add(fish);
  }

  getModel(): THREE.Group {
    return this.house;
  }

  getPosition(): THREE.Vector3 {
    return this.config.position;
  }
}

// 플레이어 집 생성 함수
export function createPlayerHouse(level: number = 1): PlayerHouseModel {
  const config: HouseConfig = {
    level: level,
    position: new THREE.Vector3(10, 0, -10),
  };

  return new PlayerHouseModel(config);
}
