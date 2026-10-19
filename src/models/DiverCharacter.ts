// OCEAN GAIA V3.2 — Diver Character Model
// 세션 B 소유 — 잠수사 캐릭터 3D 모델

import * as THREE from 'three';
import { getSuitModelData } from '../data/SuitModels';

export interface DiverConfig {
  suitId: number;
  tankId: number;
  harpoonId: number;
}

export class DiverCharacterModel {
  private diver: THREE.Group;
  private config: DiverConfig;
  private animationTime: number = 0;
  private isSwimming: boolean = false;

  // 신체 부분 참조
  private body: THREE.Mesh | null = null;
  private head: THREE.Mesh | null = null;
  private leftArm: THREE.Mesh | null = null;
  private rightArm: THREE.Mesh | null = null;
  private leftLeg: THREE.Mesh | null = null;
  private rightLeg: THREE.Mesh | null = null;

  constructor(config: DiverConfig) {
    this.config = config;
    this.diver = new THREE.Group();
    this.buildDiver();
  }

  private buildDiver(): void {
    const suitData = getSuitModelData(this.config.suitId);

    // 1. 몸통
    this.createBody(suitData);

    // 2. 머리/헬멧
    this.createHead(suitData);

    // 3. 팔
    this.createArms(suitData);

    // 4. 다리
    this.createLegs(suitData);

    // 5. 오리발
    this.createFlippers(suitData);

    // 6. 산소통
    this.createTank();

    // 7. 작살
    this.createHarpoon();

    // 8. 잠수복 디테일
    this.createSuitDetails(suitData);
  }

  private createBody(suitData: any): void {
    // 몸통 (캡슐 형태)
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: suitData.primaryColor,
      roughness: 0.6,
      metalness: 0.2,
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.5;
    this.body.castShadow = true;
    this.diver.add(this.body);

    // 보조 색상 스트라이프
    const stripeGeometry = new THREE.CapsuleGeometry(0.31, 0.2, 8, 16);
    const stripeMaterial = new THREE.MeshStandardMaterial({
      color: suitData.secondaryColor,
      roughness: 0.6,
      metalness: 0.2,
    });
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.position.y = 0.5;
    this.diver.add(stripe);
  }

  private createHead(suitData: any): void {
    if (suitData.helmetType === 'none') {
      // 헬멧 없음 - 일반 머리
      const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const headMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdbac, // 피부 색상
        roughness: 0.8,
      });
      this.head = new THREE.Mesh(headGeometry, headMaterial);
      this.head.position.y = 1.1;
      this.head.castShadow = true;
      this.diver.add(this.head);

      // 머리띠
      const bandGeometry = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
      const bandMaterial = new THREE.MeshStandardMaterial({
        color: suitData.secondaryColor,
        roughness: 0.6,
      });
      const band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.position.y = 1.15;
      band.rotation.x = Math.PI / 2;
      this.diver.add(band);
    } else {
      // 헬멧
      const helmetGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const helmetColor = suitData.helmetType === 'legendary' ? 0xffd700 : 0x808080;
      const helmetMaterial = new THREE.MeshStandardMaterial({
        color: helmetColor,
        roughness: 0.3,
        metalness: 0.7,
      });
      this.head = new THREE.Mesh(helmetGeometry, helmetMaterial);
      this.head.position.y = 1.1;
      this.head.castShadow = true;
      this.diver.add(this.head);

      // 바이저 (얼굴 창)
      const visorGeometry = new THREE.SphereGeometry(
        0.2,
        16,
        16,
        0,
        Math.PI,
        0,
        Math.PI / 2
      );
      const visorMaterial = new THREE.MeshStandardMaterial({
        color: 0x4169e1,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.7,
      });
      const visor = new THREE.Mesh(visorGeometry, visorMaterial);
      visor.position.set(0.1, 1.1, 0);
      visor.rotation.y = Math.PI / 2;
      this.diver.add(visor);

      // 헬멧 디테일 (안테나, 라이트 등)
      if (suitData.helmetType === 'advanced' || suitData.helmetType === 'legendary') {
        // 안테나
        const antennaGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 8);
        const antennaMaterial = new THREE.MeshStandardMaterial({
          color: 0x808080,
          metalness: 0.9,
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(0, 1.35, 0);
        this.diver.add(antenna);

        // 안테나 끝
        const tipGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const tipMaterial = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0.5,
        });
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.set(0, 1.42, 0);
        this.diver.add(tip);
      }

      if (suitData.helmetType === 'legendary') {
        // 전설 헬멧 라이트
        const lightGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const lightMaterial = new THREE.MeshStandardMaterial({
          color: 0xffff00,
          emissive: 0xffff00,
          emissiveIntensity: 1,
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(0.15, 1.2, 0.15);
        this.diver.add(light);

        // 실제 포인트 라이트
        const pointLight = new THREE.PointLight(0xffff00, 1, 5);
        pointLight.position.set(0.15, 1.2, 0.15);
        this.diver.add(pointLight);
      }
    }
  }

  private createArms(suitData: any): void {
    const armGeometry = new THREE.CapsuleGeometry(0.1, 0.5, 4, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: suitData.primaryColor,
      roughness: 0.6,
      metalness: 0.2,
    });

    // 왼쪽 팔
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.leftArm.position.set(0.4, 0.7, 0);
    this.leftArm.rotation.z = 0.3;
    this.leftArm.castShadow = true;
    this.diver.add(this.leftArm);

    // 오른쪽 팔
    this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.rightArm.position.set(-0.4, 0.7, 0);
    this.rightArm.rotation.z = -0.3;
    this.rightArm.castShadow = true;
    this.diver.add(this.rightArm);

    // 장갑
    const gloveGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const gloveMaterial = new THREE.MeshStandardMaterial({
      color: suitData.secondaryColor,
      roughness: 0.7,
    });

    const leftGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
    leftGlove.position.set(0.5, 0.4, 0);
    this.diver.add(leftGlove);

    const rightGlove = leftGlove.clone();
    rightGlove.position.x = -0.5;
    this.diver.add(rightGlove);
  }

  private createLegs(suitData: any): void {
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.6, 4, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: suitData.primaryColor,
      roughness: 0.6,
      metalness: 0.2,
    });

    // 왼쪽 다리
    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.leftLeg.position.set(0.15, -0.2, 0);
    this.leftLeg.castShadow = true;
    this.diver.add(this.leftLeg);

    // 오른쪽 다리
    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.rightLeg.position.set(-0.15, -0.2, 0);
    this.rightLeg.castShadow = true;
    this.diver.add(this.rightLeg);
  }

  private createFlippers(suitData: any): void {
    const flipperGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.4);
    const flipperMaterial = new THREE.MeshStandardMaterial({
      color: suitData.secondaryColor,
      roughness: 0.5,
    });

    // 왼쪽 오리발
    const leftFlipper = new THREE.Mesh(flipperGeometry, flipperMaterial);
    leftFlipper.position.set(0.15, -0.6, 0.15);
    leftFlipper.castShadow = true;
    this.diver.add(leftFlipper);

    // 오른쪽 오리발
    const rightFlipper = leftFlipper.clone();
    rightFlipper.position.x = -0.15;
    this.diver.add(rightFlipper);
  }

  private createTank(): void {
    // 산소통
    const tankGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 16);
    const tankMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.4,
      metalness: 0.8,
    });
    const tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(-0.25, 0.5, -0.2);
    tank.castShadow = true;
    this.diver.add(tank);

    // 산소통 밸브
    const valveGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8);
    const valveMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.9,
    });
    const valve = new THREE.Mesh(valveGeometry, valveMaterial);
    valve.position.set(-0.25, 0.8, -0.2);
    this.diver.add(valve);

    // 호스
    const hoseGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 16, Math.PI);
    const hoseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.8,
    });
    const hose = new THREE.Mesh(hoseGeometry, hoseMaterial);
    hose.position.set(-0.1, 0.9, -0.1);
    hose.rotation.y = Math.PI / 2;
    this.diver.add(hose);
  }

  private createHarpoon(): void {
    // 작살 (오른손에 들기)
    const harpoonGroup = new THREE.Group();

    // 작살 몸통
    const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
    const shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7,
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.rotation.z = Math.PI / 2;
    harpoonGroup.add(shaft);

    // 작살 끝
    const tipGeometry = new THREE.ConeGeometry(0.04, 0.15, 8);
    const tipMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      roughness: 0.3,
      metalness: 0.9,
    });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.x = 0.65;
    tip.rotation.z = -Math.PI / 2;
    harpoonGroup.add(tip);

    // 손잡이
    const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.x = -0.5;
    handle.rotation.z = Math.PI / 2;
    harpoonGroup.add(handle);

    harpoonGroup.position.set(-0.5, 0.5, 0.3);
    harpoonGroup.rotation.z = -0.3;
    this.diver.add(harpoonGroup);
  }

  private createSuitDetails(suitData: any): void {
    // 잠수복 지퍼
    const zipperGeometry = new THREE.BoxGeometry(0.02, 0.6, 0.02);
    const zipperMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      roughness: 0.3,
      metalness: 0.9,
    });
    const zipper = new THREE.Mesh(zipperGeometry, zipperMaterial);
    zipper.position.set(0, 0.5, 0.3);
    this.diver.add(zipper);

    // 벨트
    const beltGeometry = new THREE.TorusGeometry(0.32, 0.03, 8, 16);
    const beltMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.7,
    });
    const belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.y = 0.3;
    belt.rotation.x = Math.PI / 2;
    this.diver.add(belt);

    // 벨트 버클
    const buckleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05);
    const buckleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.9,
    });
    const buckle = new THREE.Mesh(buckleGeometry, buckleMaterial);
    buckle.position.set(0, 0.3, 0.33);
    this.diver.add(buckle);
  }

  /**
   * 애니메이션 업데이트
   */
  update(deltaTime: number): void {
    this.animationTime += deltaTime;

    if (this.isSwimming) {
      // 수영 애니메이션
      this.animateSwimming();
    } else {
      // idle 애니메이션
      this.animateIdle();
    }
  }

  private animateSwimming(): void {
    // 팔 움직임
    if (this.leftArm && this.rightArm) {
      this.leftArm.rotation.x = Math.sin(this.animationTime * 3) * 0.5;
      this.rightArm.rotation.x = Math.sin(this.animationTime * 3 + Math.PI) * 0.5;
    }

    // 다리 움직임
    if (this.leftLeg && this.rightLeg) {
      this.leftLeg.rotation.x = Math.sin(this.animationTime * 2) * 0.3;
      this.rightLeg.rotation.x = Math.sin(this.animationTime * 2 + Math.PI) * 0.3;
    }

    // 몸체 약간의 흔들림
    if (this.body) {
      this.body.rotation.z = Math.sin(this.animationTime * 2) * 0.05;
    }
  }

  private animateIdle(): void {
    // 호흡에 따른 미세한 움직임
    if (this.body) {
      this.body.position.y = 0.5 + Math.sin(this.animationTime * 0.5) * 0.02;
    }

    // 팔 약간 흔들림
    if (this.leftArm && this.rightArm) {
      this.leftArm.rotation.z = 0.3 + Math.sin(this.animationTime * 0.3) * 0.05;
      this.rightArm.rotation.z = -0.3 + Math.sin(this.animationTime * 0.3) * 0.05;
    }
  }

  /**
   * 수영 상태 설정
   */
  setSwimming(swimming: boolean): void {
    this.isSwimming = swimming;
  }

  /**
   * 방향 설정
   */
  setDirection(direction: THREE.Vector3): void {
    const angle = Math.atan2(direction.x, direction.z);
    this.diver.rotation.y = angle;
  }

  getModel(): THREE.Group {
    return this.diver;
  }
}

// 잠수사 캐릭터 생성 함수
export function createDiverCharacter(
  suitId: number = 1,
  tankId: number = 1,
  harpoonId: number = 1
): DiverCharacterModel {
  const config: DiverConfig = {
    suitId,
    tankId,
    harpoonId,
  };

  return new DiverCharacterModel(config);
}
