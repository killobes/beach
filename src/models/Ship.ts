// OCEAN GAIA V3.2 — Ship Models (5 Levels)
// 세션 B 소유 — 5단계 선박 3D 모델

import * as THREE from 'three';
import { getShipModelData, type ShipModelData } from '../data/ShipModels';

export class ShipModel {
  private ship: THREE.Group;
  private level: number;
  private shipData: ShipModelData;

  constructor(level: number) {
    this.level = level;
    this.shipData = getShipModelData(level);
    this.ship = new THREE.Group();
    this.buildShip();
  }

  private buildShip(): void {
    switch (this.level) {
      case 1:
        this.buildLevel1();
        break;
      case 2:
        this.buildLevel2();
        break;
      case 3:
        this.buildLevel3();
        break;
      case 4:
        this.buildLevel4();
        break;
      case 5:
        this.buildLevel5();
        break;
    }
  }

  // 레벨 1: 낡은 어선
  private buildLevel1(): void {
    // 선체 (간단한 보트 모양)
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-2.5, 0);
    hullShape.quadraticCurveTo(-2.5, -0.8, 0, -1);
    hullShape.quadraticCurveTo(2.5, -0.8, 2.5, 0);
    hullShape.lineTo(2.5, 0.3);
    hullShape.lineTo(-2.5, 0.3);

    const extrudeSettings = {
      steps: 1,
      depth: 2,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
    };

    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.1,
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.y = Math.PI / 2;
    hull.position.z = -1;
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.ship.add(hull);

    // 갑판
    const deckGeometry = new THREE.BoxGeometry(2, 0.1, 4.5);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.8,
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0.35;
    deck.castShadow = true;
    deck.receiveShadow = true;
    this.ship.add(deck);

    // 돛대
    const mastGeometry = new THREE.CylinderGeometry(0.08, 0.1, 3, 8);
    const mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(0, 1.8, 0);
    mast.castShadow = true;
    this.ship.add(mast);

    // 돛 (간단한 사각형)
    const sailGeometry = new THREE.PlaneGeometry(1.5, 2);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(0, 2, 0.8);
    sail.castShadow = true;
    this.ship.add(sail);

    // 닻
    const anchorGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 16);
    const anchorMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.6,
      metalness: 0.8,
    });
    const anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
    anchor.position.set(2, 0.2, 0);
    anchor.rotation.y = Math.PI / 2;
    this.ship.add(anchor);

    // 노 (왼쪽)
    const oarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
    const oarMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });
    const leftOar = new THREE.Mesh(oarGeometry, oarMaterial);
    leftOar.position.set(-1.2, 0.5, 0);
    leftOar.rotation.z = Math.PI / 4;
    this.ship.add(leftOar);

    // 노 (오른쪽)
    const rightOar = leftOar.clone();
    rightOar.position.x = 1.2;
    rightOar.rotation.z = -Math.PI / 4;
    this.ship.add(rightOar);
  }

  // 레벨 2: 개량 어선
  private buildLevel2(): void {
    // 선체 (더 큰 보트)
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-4, 0);
    hullShape.quadraticCurveTo(-4, -1, 0, -1.3);
    hullShape.quadraticCurveTo(4, -1, 4, 0);
    hullShape.lineTo(4, 0.4);
    hullShape.lineTo(-4, 0.4);

    const extrudeSettings = {
      steps: 1,
      depth: 3,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.15,
    };

    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.8,
      metalness: 0.15,
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.y = Math.PI / 2;
    hull.position.z = -1.5;
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.ship.add(hull);

    // 갑판
    const deckGeometry = new THREE.BoxGeometry(3, 0.15, 7);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0xcd853f,
      roughness: 0.7,
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0.5;
    deck.castShadow = true;
    deck.receiveShadow = true;
    this.ship.add(deck);

    // 선실
    const cabinGeometry = new THREE.BoxGeometry(2, 1.5, 2);
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.7,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(-1, 1.25, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    this.ship.add(cabin);

    // 선실 지붕
    const roofGeometry = new THREE.BoxGeometry(2.2, 0.1, 2.2);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-1, 2.05, 0);
    roof.castShadow = true;
    this.ship.add(roof);

    // 선실 문
    const doorGeometry = new THREE.BoxGeometry(0.6, 1, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-1, 1, 1.05);
    this.ship.add(door);

    // 선실 창문
    const windowGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.7,
    });
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-1, 1.5, 1.05);
    this.ship.add(window1);

    // 돛대
    const mastGeometry = new THREE.CylinderGeometry(0.1, 0.12, 4, 8);
    const mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(1.5, 2.5, 0);
    mast.castShadow = true;
    this.ship.add(mast);

    // 돛
    const sailGeometry = new THREE.PlaneGeometry(2, 3);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(1.5, 3, 1);
    sail.castShadow = true;
    this.ship.add(sail);

    // 핸들 (조타 장치)
    const wheelGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7,
    });
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(-1, 1.5, -0.8);
    wheel.rotation.x = Math.PI / 2;
    this.ship.add(wheel);

    // 닻
    const anchorGeometry = new THREE.TorusGeometry(0.2, 0.04, 8, 16);
    const anchorMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.6,
      metalness: 0.8,
    });
    const anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
    anchor.position.set(3.5, 0.3, 0);
    anchor.rotation.y = Math.PI / 2;
    this.ship.add(anchor);
  }

  // 레벨 3: 탐사선
  private buildLevel3(): void {
    // 선체 (더 크고 튼튼함)
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-6, 0);
    hullShape.quadraticCurveTo(-6, -1.3, 0, -1.6);
    hullShape.quadraticCurveTo(6, -1.3, 6, 0);
    hullShape.lineTo(6, 0.5);
    hullShape.lineTo(-6, 0.5);

    const extrudeSettings = {
      steps: 1,
      depth: 4,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2,
    };

    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x4682b4,
      roughness: 0.6,
      metalness: 0.3,
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.y = Math.PI / 2;
    hull.position.z = -2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.ship.add(hull);

    // 갑판
    const deckGeometry = new THREE.BoxGeometry(4, 0.2, 10);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.7,
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0.6;
    deck.castShadow = true;
    deck.receiveShadow = true;
    this.ship.add(deck);

    // 선실 (더 큰 연구실)
    const cabinGeometry = new THREE.BoxGeometry(3, 2, 3);
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,
      roughness: 0.6,
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(-2, 1.6, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    this.ship.add(cabin);

    // 선실 지붕
    const roofGeometry = new THREE.BoxGeometry(3.2, 0.15, 3.2);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      roughness: 0.7,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-2, 2.65, 0);
    roof.castShadow = true;
    this.ship.add(roof);

    // 선실 창문 2개
    const windowGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.7,
    });
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-2, 1.8, 1.55);
    this.ship.add(window1);

    const window2 = window1.clone();
    window2.position.z = -1.55;
    this.ship.add(window2);

    // 돛대 (강철)
    const mastGeometry = new THREE.CylinderGeometry(0.12, 0.15, 5, 8);
    const mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.5,
      metalness: 0.7,
    });
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(2, 3.1, 0);
    mast.castShadow = true;
    this.ship.add(mast);

    // 큰 돛
    const sailGeometry = new THREE.PlaneGeometry(3, 4);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(2, 3.5, 1.5);
    sail.castShadow = true;
    this.ship.add(sail);

    // 탐사 장비 (크레인)
    const craneBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.5, metalness: 0.7 })
    );
    craneBase.position.set(3, 0.85, 2);
    this.ship.add(craneBase);

    const craneArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.5, metalness: 0.7 })
    );
    craneArm.position.set(3, 1.85, 2);
    craneArm.rotation.z = Math.PI / 6;
    this.ship.add(craneArm);

    // 레이더
    const radarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.5, metalness: 0.7 })
    );
    radarBase.position.set(2, 5.75, 0);
    this.ship.add(radarBase);

    const radarDish = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.3, metalness: 0.8 })
    );
    radarDish.position.set(2, 6, 0);
    radarDish.rotation.x = Math.PI;
    this.ship.add(radarDish);

    // 깃발
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.5, metalness: 0.7 })
    );
    flagPole.position.set(2, 6.5, 0);
    this.ship.add(flagPole);

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0x00ced1,
        roughness: 0.7,
        side: THREE.DoubleSide,
      })
    );
    flag.position.set(2.4, 7, 0);
    this.ship.add(flag);

    // 닻 (더 큰 것)
    const anchorGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 16);
    const anchorMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.6,
      metalness: 0.8,
    });
    const anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
    anchor.position.set(5, 0.4, 0);
    anchor.rotation.y = Math.PI / 2;
    this.ship.add(anchor);

    // 핸들
    const wheelGeometry = new THREE.TorusGeometry(0.35, 0.06, 8, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7,
    });
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(-2, 2, -1.3);
    wheel.rotation.x = Math.PI / 2;
    this.ship.add(wheel);
  }

  // 레벨 4: 연구선
  private buildLevel4(): void {
    // 선체 (매우 크고 튼튼함)
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-9, 0);
    hullShape.quadraticCurveTo(-9, -1.6, 0, -2);
    hullShape.quadraticCurveTo(9, -1.6, 9, 0);
    hullShape.lineTo(9, 0.6);
    hullShape.lineTo(-9, 0.6);

    const extrudeSettings = {
      steps: 1,
      depth: 5,
      bevelEnabled: true,
      bevelThickness: 0.25,
      bevelSize: 0.25,
    };

    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      roughness: 0.5,
      metalness: 0.4,
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.y = Math.PI / 2;
    hull.position.z = -2.5;
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.ship.add(hull);

    // 갑판
    const deckGeometry = new THREE.BoxGeometry(5, 0.25, 14);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.6,
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0.75;
    deck.castShadow = true;
    deck.receiveShadow = true;
    this.ship.add(deck);

    // 연구실 (큰 건물)
    const labGeometry = new THREE.BoxGeometry(4, 2.5, 4);
    const labMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,
      roughness: 0.6,
    });
    const lab = new THREE.Mesh(labGeometry, labMaterial);
    lab.position.set(-3, 2, 0);
    lab.castShadow = true;
    lab.receiveShadow = true;
    this.ship.add(lab);

    // 연구실 지붕
    const labRoof = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.2, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x2f4f4f, roughness: 0.7 })
    );
    labRoof.position.set(-3, 3.35, 0);
    labRoof.castShadow = true;
    this.ship.add(labRoof);

    // 대형 창고
    const storageGeometry = new THREE.BoxGeometry(3, 2, 3);
    const storageMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.7,
    });
    const storage = new THREE.Mesh(storageGeometry, storageMaterial);
    storage.position.set(3, 1.75, 0);
    storage.castShadow = true;
    storage.receiveShadow = true;
    this.ship.add(storage);

    // 창고 문
    const storageDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 })
    );
    storageDoor.position.set(3, 1.65, 1.55);
    this.ship.add(storageDoor);

    // 창문들 (연구실)
    const windowGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < 3; i++) {
      const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
      window1.position.set(-3, 2.2, -1.5 + i * 1.5);
      this.ship.add(window1);
    }

    // 돛대 (강철, 더 큼)
    const mastGeometry = new THREE.CylinderGeometry(0.15, 0.2, 6, 8);
    const mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.4,
      metalness: 0.8,
    });
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(0, 3.75, 0);
    mast.castShadow = true;
    this.ship.add(mast);

    // 큰 돛
    const sailGeometry = new THREE.PlaneGeometry(4, 5);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(0, 4.5, 2);
    sail.castShadow = true;
    this.ship.add(sail);

    // 연구 장비 (안테나)
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2, 8),
      new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.3, metalness: 0.9 })
    );
    antenna.position.set(-3, 4.5, 0);
    this.ship.add(antenna);

    // 레이더 (더 큰 것)
    const radarDish = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.3, metalness: 0.8 })
    );
    radarDish.position.set(0, 7, 0);
    radarDish.rotation.x = Math.PI;
    this.ship.add(radarDish);

    // 깃발 (더 큰 것)
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2, 8),
      new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.5, metalness: 0.7 })
    );
    flagPole.position.set(0, 8, 0);
    this.ship.add(flagPole);

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.8),
      new THREE.MeshStandardMaterial({
        color: 0x00ced1,
        roughness: 0.7,
        side: THREE.DoubleSide,
      })
    );
    flag.position.set(0.6, 8.5, 0);
    this.ship.add(flag);

    // 랜턴 2개
    const lanternGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const lanternMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
      roughness: 0.5,
    });
    const lantern1 = new THREE.Mesh(lanternGeometry, lanternMaterial);
    lantern1.position.set(6, 2, 2);
    this.ship.add(lantern1);

    const lantern2 = lantern1.clone();
    lantern2.position.set(6, 2, -2);
    this.ship.add(lantern2);

    // 실제 포인트 라이트
    const light1 = new THREE.PointLight(0xffff00, 1, 10);
    light1.position.set(6, 2, 2);
    this.ship.add(light1);

    const light2 = new THREE.PointLight(0xffff00, 1, 10);
    light2.position.set(6, 2, -2);
    this.ship.add(light2);

    // 닻 (더 큰 것)
    const anchor = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.07, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.6, metalness: 0.8 })
    );
    anchor.position.set(7.5, 0.5, 0);
    anchor.rotation.y = Math.PI / 2;
    this.ship.add(anchor);

    // 핸들 (더 큰 것)
    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.08, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 })
    );
    wheel.position.set(-3, 2.5, -1.8);
    wheel.rotation.x = Math.PI / 2;
    this.ship.add(wheel);
  }

  // 레벨 5: 가이아호 (전설적 선박)
  private buildLevel5(): void {
    // 선체 (최대 크기, 전설적 디자인)
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-12.5, 0);
    hullShape.quadraticCurveTo(-12.5, -2, 0, -2.5);
    hullShape.quadraticCurveTo(12.5, -2, 12.5, 0);
    hullShape.lineTo(12.5, 0.8);
    hullShape.lineTo(-12.5, 0.8);

    const extrudeSettings = {
      steps: 1,
      depth: 7,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.3,
    };

    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.3,
      metalness: 0.7,
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.y = Math.PI / 2;
    hull.position.z = -3.5;
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.ship.add(hull);

    // 금색 장식 라인
    const goldLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0xffd700,
        emissiveIntensity: 0.2,
      })
    );
    goldLine.position.set(0, 0.85, 0);
    this.ship.add(goldLine);

    // 갑판 (황금색 티크)
    const deckGeometry = new THREE.BoxGeometry(7, 0.3, 20);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.5,
      metalness: 0.3,
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0.95;
    deck.castShadow = true;
    deck.receiveShadow = true;
    this.ship.add(deck);

    // 선장실 (화려한 건물)
    const captainGeometry = new THREE.BoxGeometry(5, 3, 5);
    const captainMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.3,
      metalness: 0.6,
    });
    const captain = new THREE.Mesh(captainGeometry, captainMaterial);
    captain.position.set(-5, 2.5, 0);
    captain.castShadow = true;
    captain.receiveShadow = true;
    this.ship.add(captain);

    // 선장실 금색 장식
    const captainTrim = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.15, 5.2),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
      })
    );
    captainTrim.position.set(-5, 4.1, 0);
    this.ship.add(captainTrim);

    // 연구실
    const labGeometry = new THREE.BoxGeometry(4, 2.5, 4);
    const labMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      roughness: 0.4,
      metalness: 0.5,
    });
    const lab = new THREE.Mesh(labGeometry, labMaterial);
    lab.position.set(0, 2.25, 0);
    lab.castShadow = true;
    lab.receiveShadow = true;
    this.ship.add(lab);

    // 대형 창고
    const storageGeometry = new THREE.BoxGeometry(4, 2.5, 4);
    const storageMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      roughness: 0.4,
      metalness: 0.5,
    });
    const storage = new THREE.Mesh(storageGeometry, storageMaterial);
    storage.position.set(5, 2.25, 0);
    storage.castShadow = true;
    storage.receiveShadow = true;
    this.ship.add(storage);

    // 창문들 (금색 프레임)
    const windowGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.2,
      metalness: 0.6,
      transparent: true,
      opacity: 0.8,
    });
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.2,
      metalness: 0.9,
    });

    for (let i = 0; i < 4; i++) {
      const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
      window1.position.set(-5, 2.5, -2 + i * 1.3);
      this.ship.add(window1);

      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.9, 0.05),
        frameMaterial
      );
      frame.position.copy(window1.position);
      frame.position.z += 0.05;
      this.ship.add(frame);
    }

    // 전설의 돛대
    const mastGeometry = new THREE.CylinderGeometry(0.2, 0.25, 8, 16);
    const mastMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0xffd700,
      emissiveIntensity: 0.2,
    });
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(0, 5, 0);
    mast.castShadow = true;
    this.ship.add(mast);

    // 전설의 돛 (금색 테두리)
    const sailGeometry = new THREE.PlaneGeometry(5, 6);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(0, 6, 3);
    sail.castShadow = true;
    this.ship.add(sail);

    // 돛 금색 테두리
    const sailBorder = new THREE.Mesh(
      new THREE.RingGeometry(2.8, 3, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
      })
    );
    sailBorder.position.set(0, 6, 3.05);
    this.ship.add(sailBorder);

    // 전설의 레이더 (빛남)
    const radarDish = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x00ced1,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0x00ced1,
        emissiveIntensity: 0.5,
      })
    );
    radarDish.position.set(0, 9.5, 0);
    radarDish.rotation.x = Math.PI;
    this.ship.add(radarDish);

    // 전설의 깃발
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3, 8),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9,
      })
    );
    flagPole.position.set(0, 10.5, 0);
    this.ship.add(flagPole);

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1),
      new THREE.MeshStandardMaterial({
        color: 0x00ced1,
        roughness: 0.6,
        side: THREE.DoubleSide,
        emissive: 0x00ced1,
        emissiveIntensity: 0.3,
      })
    );
    flag.position.set(0.75, 11.5, 0);
    this.ship.add(flag);

    // 헬리패드
    const helipadGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 32);
    const helipadMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.7,
    });
    const helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
    helipad.position.set(5, 3.6, 0);
    helipad.receiveShadow = true;
    this.ship.add(helipad);

    // 헬리패드 H 마크
    const hMark = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.05, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
      })
    );
    hMark.position.set(5, 3.65, 0);
    this.ship.add(hMark);

    const hMark2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.05, 1),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
      })
    );
    hMark2.position.set(4.6, 3.65, 0);
    this.ship.add(hMark2);

    const hMark3 = hMark2.clone();
    hMark3.position.x = 5.4;
    this.ship.add(hMark3);

    // 전설의 장비 (황금색 대포)
    const cannonBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0xffd700,
        emissiveIntensity: 0.2,
      })
    );
    cannonBase.position.set(8, 1.2, 2);
    this.ship.add(cannonBase);

    const cannonBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 1.5, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0xffd700,
        emissiveIntensity: 0.2,
      })
    );
    cannonBarrel.position.set(8, 2, 2);
    cannonBarrel.rotation.z = Math.PI / 4;
    this.ship.add(cannonBarrel);

    // 랜턴 4개 (모두 빛남)
    const lanternGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const lanternMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ced1,
      emissive: 0x00ced1,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });

    const lanternPositions = [
      [8, 3, 3],
      [8, 3, -3],
      [-8, 3, 3],
      [-8, 3, -3],
    ];

    lanternPositions.forEach(pos => {
      const lantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
      lantern.position.set(pos[0], pos[1], pos[2]);
      this.ship.add(lantern);

      const light = new THREE.PointLight(0x00ced1, 2, 15);
      light.position.set(pos[0], pos[1], pos[2]);
      this.ship.add(light);
    });

    // 전설의 닻 (황금색)
    const anchor = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.1, 16, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
      })
    );
    anchor.position.set(10, 0.6, 0);
    anchor.rotation.y = Math.PI / 2;
    this.ship.add(anchor);

    // 선장의 핸들 (황금색)
    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.1, 16, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
      })
    );
    wheel.position.set(-5, 3.5, -2.3);
    wheel.rotation.x = Math.PI / 2;
    this.ship.add(wheel);

    // 추가 장식 (배 주변 금색 라인)
    for (let i = 0; i < 8; i++) {
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 24),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          roughness: 0.2,
          metalness: 0.9,
          emissive: 0xffd700,
          emissiveIntensity: 0.2,
        })
      );
      const angle = (i / 8) * Math.PI * 2;
      trim.position.set(Math.cos(angle) * 3.5, 0.9, 0);
      trim.rotation.y = angle;
      this.ship.add(trim);
    }
  }

  getModel(): THREE.Group {
    return this.ship;
  }

  getLevel(): number {
    return this.level;
  }

  getSize(): { length: number; width: number; height: number } {
    return {
      length: this.shipData.length,
      width: this.shipData.width,
      height: this.shipData.height,
    };
  }
}

// 선박 생성 함수
export function createShip(level: number): ShipModel {
  return new ShipModel(level);
}
