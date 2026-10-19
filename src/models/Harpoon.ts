// OCEAN GAIA V3.2 — Harpoon Models (24 Types)
// 세션 B 소유 — 24종 작살 3D 모델

import * as THREE from 'three';
import { HARPOON_MODELS, type HarpoonModelData } from '../data/HarpoonModels';

export class HarpoonModel {
  private harpoon: THREE.Group;
  private data: HarpoonModelData;
  private glowLight: THREE.PointLight | null = null;

  constructor(harpoonId: number) {
    this.data = HARPOON_MODELS.find(h => h.id === harpoonId) || HARPOON_MODELS[0];
    this.harpoon = new THREE.Group();
    this.buildHarpoon();
  }

  private buildHarpoon(): void {
    const lengthM = this.data.length / 100; // cm → m

    // 1. 몸통 (Shaft)
    this.createShaft(lengthM);

    // 2. 끝부분 (Tip)
    this.createTip(lengthM);

    // 3. 손잡이 (Handle)
    this.createHandle(lengthM);

    // 4. 특수 효과 (Special Effects)
    if (this.data.glowColor) {
      this.createGlowEffect(lengthM);
    }

    // 5. 디테일 (Details)
    this.createDetails(lengthM);
  }

  private createShaft(lengthM: number): void {
    const shaftRadius = 0.025;
    const shaftLength = lengthM * 0.7;

    // 몸통 재질
    let shaftMaterial: THREE.MeshStandardMaterial;

    switch (this.data.material) {
      case 'wood':
        shaftMaterial = new THREE.MeshStandardMaterial({
          color: this.data.color,
          roughness: 0.9,
          metalness: 0.0,
        });
        break;
      case 'iron':
        shaftMaterial = new THREE.MeshStandardMaterial({
          color: this.data.color,
          roughness: 0.6,
          metalness: 0.7,
        });
        break;
      case 'steel':
      case 'titanium':
      case 'metal':
        shaftMaterial = new THREE.MeshStandardMaterial({
          color: this.data.color,
          roughness: 0.4,
          metalness: 0.8,
        });
        break;
      case 'crystal':
      case 'diamond':
      case 'legendary':
        shaftMaterial = new THREE.MeshStandardMaterial({
          color: this.data.color,
          roughness: 0.2,
          metalness: 0.9,
          emissive: new THREE.Color(this.data.color),
          emissiveIntensity: 0.3,
        });
        break;
      default:
        shaftMaterial = new THREE.MeshStandardMaterial({
          color: this.data.color,
          roughness: 0.5,
          metalness: 0.5,
        });
    }

    // 몸통 형태 (재료에 따라 다르게)
    let shaftGeometry: THREE.BufferGeometry;

    if (this.data.material === 'wood' || this.data.material === 'rope_metal') {
      // 나무/로프: 원통형
      shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 8);
    } else if (this.data.material === 'crystal' || this.data.material === 'diamond') {
      // 수정/다이아몬드: 팔각형
      shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 8);
    } else {
      // 금속: 둥근 원통
      shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius * 1.1, shaftLength, 16);
    }

    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.x = 0;
    shaft.castShadow = true;
    this.harpoon.add(shaft);

    // 나무 작살은 나이테 디테일
    if (this.data.material === 'wood') {
      for (let i = 0; i < 3; i++) {
        const ringGeometry = new THREE.TorusGeometry(shaftRadius + 0.002, 0.003, 8, 16);
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: 0x654321,
          roughness: 0.9,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.x = -shaftLength / 3 + i * (shaftLength / 3);
        ring.rotation.y = Math.PI / 2;
        this.harpoon.add(ring);
      }
    }
  }

  private createTip(lengthM: number): void {
    const tipPosition = lengthM * 0.35;
    let tipGeometry: THREE.BufferGeometry;
    let tipMaterial: THREE.MeshStandardMaterial;

    // 재질 설정
    const isLegendary = this.data.material === 'legendary' || this.data.material === 'diamond';
    const isElectric = this.data.tipType === 'electric';
    const isLaser = this.data.tipType === 'laser';
    const isSonic = this.data.tipType === 'sonic';

    switch (this.data.tipType) {
      case 'standard':
        // 표준: 간단한 원뿔
        tipGeometry = new THREE.ConeGeometry(0.04, 0.15, 8);
        tipMaterial = new THREE.MeshStandardMaterial({
          color: 0xc0c0c0,
          roughness: 0.3,
          metalness: 0.9,
        });
        break;

      case 'barbed':
        // 갈고리: 여러 개의 갈고리가 있는 끝
        tipGeometry = new THREE.ConeGeometry(0.05, 0.18, 6);
        tipMaterial = new THREE.MeshStandardMaterial({
          color: isLegendary ? 0xffd700 : 0xa0a0a0,
          roughness: isLegendary ? 0.2 : 0.4,
          metalness: isLegendary ? 0.9 : 0.8,
          emissive: isLegendary ? new THREE.Color(0xffd700) : undefined,
          emissiveIntensity: isLegendary ? 0.3 : 0,
        });

        // 갈고리 추가
        for (let i = 0; i < 3; i++) {
          const barbGeometry = new THREE.ConeGeometry(0.015, 0.08, 6);
          const barb = new THREE.Mesh(barbGeometry, tipMaterial);
          const angle = (i / 3) * Math.PI * 2;
          barb.position.set(
            tipPosition - 0.05,
            Math.cos(angle) * 0.04,
            Math.sin(angle) * 0.04
          );
          barb.rotation.z = Math.PI / 3;
          barb.rotation.y = angle;
          this.harpoon.add(barb);
        }
        break;

      case 'electric':
        // 전기: 구형 + 전기 스파크
        tipGeometry = new THREE.SphereGeometry(0.06, 16, 16);
        tipMaterial = new THREE.MeshStandardMaterial({
          color: 0x00bfff,
          roughness: 0.1,
          metalness: 0.9,
          emissive: new THREE.Color(0x00bfff),
          emissiveIntensity: 0.8,
        });

        // 전기 스파크 (얇은 원통 여러 개)
        for (let i = 0; i < 6; i++) {
          const sparkGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4);
          const sparkMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
          });
          const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
          const angle = (i / 6) * Math.PI * 2;
          spark.position.set(
            tipPosition,
            Math.cos(angle) * 0.08,
            Math.sin(angle) * 0.08
          );
          spark.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
          spark.rotation.y = angle;
          this.harpoon.add(spark);
        }
        break;

      case 'explosive':
        // 폭발: 둥근 폭탄 형태
        tipGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        tipMaterial = new THREE.MeshStandardMaterial({
          color: 0xb22222,
          roughness: 0.5,
          metalness: 0.6,
          emissive: new THREE.Color(0xff4500),
          emissiveIntensity: 0.4,
        });

        // 폭탄 퓨즈
        const fuseGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.1, 8);
        const fuseMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          roughness: 0.8,
        });
        const fuse = new THREE.Mesh(fuseGeometry, fuseMaterial);
        fuse.position.set(tipPosition + 0.05, 0.08, 0);
        fuse.rotation.z = Math.PI / 6;
        this.harpoon.add(fuse);

        // 퓨즈 끝 불꽃
        const sparkGeometry = new THREE.SphereGeometry(0.015, 8, 8);
        const sparkMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff00,
        });
        const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
        spark.position.set(tipPosition + 0.08, 0.12, 0);
        this.harpoon.add(spark);
        break;

      case 'net':
        // 그물: 그물망이 접힌 형태
        tipGeometry = new THREE.SphereGeometry(0.07, 8, 8);
        tipMaterial = new THREE.MeshStandardMaterial({
          color: 0xdaa520,
          roughness: 0.8,
          wireframe: true,
        });

        // 그물 손잡이
        const netHandleGeometry = new THREE.TorusGeometry(0.06, 0.01, 8, 16);
        const netHandleMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          roughness: 0.7,
        });
        const netHandle = new THREE.Mesh(netHandleGeometry, netHandleMaterial);
        netHandle.position.set(tipPosition, 0, 0);
        netHandle.rotation.y = Math.PI / 2;
        this.harpoon.add(netHandle);
        break;

      case 'laser':
        // 레이저: 뾰족한 크리스탈 형태
        tipGeometry = new THREE.ConeGeometry(0.03, 0.25, 16);
        tipMaterial = new THREE.MeshStandardMaterial({
          color: this.data.glowColor || 0xff1493,
          roughness: 0.1,
          metalness: 0.9,
          emissive: new THREE.Color(this.data.glowColor || 0xff1493),
          emissiveIntensity: 1.0,
          transparent: true,
          opacity: 0.9,
        });

        // 레이저 빔 효과
        const beamGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.5, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({
          color: this.data.glowColor || 0xff1493,
          transparent: true,
          opacity: 0.5,
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.rotation.z = Math.PI / 2;
        beam.position.x = tipPosition + 0.35;
        this.harpoon.add(beam);
        break;

      case 'sonic':
        // 음파: 접시 형태 (소나)
        tipGeometry = new THREE.SphereGeometry(0.07, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        tipMaterial = new THREE.MeshStandardMaterial({
          color: this.data.glowColor || 0xba55d3,
          roughness: 0.2,
          metalness: 0.8,
          emissive: new THREE.Color(this.data.glowColor || 0xba55d3),
          emissiveIntensity: 0.6,
        });

        // 음파 링
        for (let i = 1; i <= 3; i++) {
          const ringGeometry = new THREE.TorusGeometry(0.05 * i, 0.005, 8, 16);
          const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.data.glowColor || 0xba55d3,
            transparent: true,
            opacity: 0.5 / i,
          });
          const ring = new THREE.Mesh(ringGeometry, ringMaterial);
          ring.position.x = tipPosition + 0.05 * i;
          ring.rotation.y = Math.PI / 2;
          this.harpoon.add(ring);
        }
        break;

      default:
        tipGeometry = new THREE.ConeGeometry(0.04, 0.15, 8);
        tipMaterial = new THREE.MeshStandardMaterial({
          color: 0xc0c0c0,
          roughness: 0.3,
          metalness: 0.9,
        });
    }

    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.x = tipPosition;
    tip.rotation.z = -Math.PI / 2;
    tip.castShadow = true;
    this.harpoon.add(tip);
  }

  private createHandle(lengthM: number): void {
    const handlePosition = -lengthM * 0.35;
    const handleLength = lengthM * 0.2;

    // 손잡이 재질
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
      metalness: 0.1,
    });

    // 손잡이 본체
    const handleGeometry = new THREE.CylinderGeometry(0.04, 0.04, handleLength, 16);
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.x = handlePosition;
    handle.castShadow = true;
    this.harpoon.add(handle);

    // 손잡이 그립 디테일 (고무 링)
    for (let i = 0; i < 4; i++) {
      const gripGeometry = new THREE.TorusGeometry(0.045, 0.008, 8, 16);
      const gripMaterial = new THREE.MeshStandardMaterial({
        color: 0x1c1c1c,
        roughness: 0.9,
      });
      const grip = new THREE.Mesh(gripGeometry, gripMaterial);
      grip.position.x = handlePosition - handleLength / 3 + i * (handleLength / 3);
      grip.rotation.y = Math.PI / 2;
      this.harpoon.add(grip);
    }

    // 손잡이 끝 (스트랩 고리)
    const ringGeometry = new THREE.TorusGeometry(0.025, 0.005, 8, 16);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      roughness: 0.4,
      metalness: 0.8,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.x = handlePosition - handleLength / 2 - 0.02;
    ring.rotation.y = Math.PI / 2;
    this.harpoon.add(ring);
  }

  private createGlowEffect(lengthM: number): void {
    if (!this.data.glowColor) return;

    // 발광 오라
    const auraGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: this.data.glowColor,
      transparent: true,
      opacity: 0.3,
    });
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    aura.position.x = lengthM * 0.35;
    this.harpoon.add(aura);

    // 실제 포인트 라이트
    this.glowLight = new THREE.PointLight(
      new THREE.Color(this.data.glowColor),
      1.5,
      5
    );
    this.glowLight.position.x = lengthM * 0.35;
    this.harpoon.add(this.glowLight);

    // 전설적 작살은 추가 발광 효과
    if (this.data.material === 'legendary') {
      // 몸통 전체에 발광
      const shaftGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, lengthM * 0.7, 16),
        new THREE.MeshBasicMaterial({
          color: this.data.glowColor,
          transparent: true,
          opacity: 0.2,
        })
      );
      shaftGlow.rotation.z = Math.PI / 2;
      this.harpoon.add(shaftGlow);

      // 추가 라이트
      const extraLight = new THREE.PointLight(
        new THREE.Color(this.data.glowColor),
        2,
        8
      );
      extraLight.position.x = 0;
      this.harpoon.add(extraLight);
    }
  }

  private createDetails(lengthM: number): void {
    // 작살 이름에 따른 특수 디테일

    // 빙하/얼음 작살: 얼음 결정
    if (this.data.name.includes('빙하') || this.data.name.includes('얼음')) {
      for (let i = 0; i < 5; i++) {
        const iceGeometry = new THREE.OctahedronGeometry(0.02);
        const iceMaterial = new THREE.MeshStandardMaterial({
          color: 0xadd8e6,
          roughness: 0.1,
          metalness: 0.3,
          transparent: true,
          opacity: 0.7,
        });
        const ice = new THREE.Mesh(iceGeometry, iceMaterial);
        ice.position.set(
          (Math.random() - 0.5) * lengthM * 0.5,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        );
        this.harpoon.add(ice);
      }
    }

    // 화산/용암 작살: 불꽃
    if (this.data.name.includes('화산') || this.data.name.includes('용암')) {
      for (let i = 0; i < 4; i++) {
        const flameGeometry = new THREE.ConeGeometry(0.015, 0.06, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
          color: 0xff4500,
          transparent: true,
          opacity: 0.8,
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.set(
          lengthM * 0.35 - 0.05,
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08
        );
        flame.rotation.z = Math.PI + (Math.random() - 0.5) * 0.5;
        this.harpoon.add(flame);
      }
    }

    // 황금/다이아몬드 작살: 보석 장식
    if (this.data.name.includes('황금') || this.data.name.includes('다이아몬드')) {
      const gemGeometry = new THREE.OctahedronGeometry(0.03);
      const gemMaterial = new THREE.MeshStandardMaterial({
        color: this.data.material === 'diamond' ? 0xe0ffff : 0xffd700,
        roughness: 0.1,
        metalness: 0.9,
        emissive: new THREE.Color(this.data.material === 'diamond' ? 0xe0ffff : 0xffd700),
        emissiveIntensity: 0.5,
      });

      // 손잡이와 몸통 사이에 보석
      const gem = new THREE.Mesh(gemGeometry, gemMaterial);
      gem.position.x = -lengthM * 0.2;
      this.harpoon.add(gem);
    }

    // 가이아의 작살: 특별한 장식
    if (this.data.name.includes('가이아')) {
      // 몸통에 파동 패턴
      for (let i = 0; i < 8; i++) {
        const waveGeometry = new THREE.TorusGeometry(0.035, 0.005, 8, 16);
        const waveMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.6,
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.x = -lengthM * 0.3 + i * (lengthM * 0.08);
        wave.rotation.y = Math.PI / 2;
        this.harpoon.add(wave);
      }

      // 끝부분에 큰 오라
      const bigAura = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.2,
        })
      );
      bigAura.position.x = lengthM * 0.35;
      this.harpoon.add(bigAura);
    }

    // 독 작살: 독 방울
    if (this.data.name.includes('독')) {
      for (let i = 0; i < 3; i++) {
        const dropGeometry = new THREE.SphereGeometry(0.015, 8, 8);
        const dropMaterial = new THREE.MeshStandardMaterial({
          color: 0x32cd32,
          roughness: 0.3,
          metalness: 0.5,
          emissive: new THREE.Color(0x32cd32),
          emissiveIntensity: 0.5,
        });
        const drop = new THREE.Mesh(dropGeometry, dropMaterial);
        drop.position.set(
          lengthM * 0.35 - 0.08,
          -0.05 - i * 0.02,
          (Math.random() - 0.5) * 0.05
        );
        drop.scale.y = 1.5;
        this.harpoon.add(drop);
      }
    }

    // 바람 작살: 바람결 효과
    if (this.data.name.includes('바람')) {
      for (let i = 0; i < 5; i++) {
        const windGeometry = new THREE.TorusGeometry(0.04, 0.003, 8, 16, Math.PI);
        const windMaterial = new THREE.MeshBasicMaterial({
          color: 0x87cefa,
          transparent: true,
          opacity: 0.4,
        });
        const wind = new THREE.Mesh(windGeometry, windMaterial);
        wind.position.x = lengthM * 0.1 + i * 0.05;
        wind.rotation.y = Math.PI / 2;
        wind.rotation.z = i * 0.3;
        this.harpoon.add(wind);
      }
    }

    // 파동 작살: 파동 링
    if (this.data.name.includes('파동')) {
      for (let i = 1; i <= 4; i++) {
        const waveGeometry = new THREE.TorusGeometry(0.05 * i, 0.008, 8, 16);
        const waveMaterial = new THREE.MeshBasicMaterial({
          color: 0x1e90ff,
          transparent: true,
          opacity: 0.5 / i,
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.x = lengthM * 0.35 + 0.05 * i;
        wave.rotation.y = Math.PI / 2;
        this.harpoon.add(wave);
      }
    }
  }

  /**
   * 애니메이션 업데이트 (발광 효과 등)
   */
  update(deltaTime: number): void {
    // 발광 효과 애니메이션
    if (this.glowLight) {
      const time = Date.now() * 0.001;
      this.glowLight.intensity = 1.5 + Math.sin(time * 2) * 0.5;
    }
  }

  getModel(): THREE.Group {
    return this.harpoon;
  }

  getData(): HarpoonModelData {
    return this.data;
  }
}

// 작살 생성 함수
export function createHarpoon(harpoonId: number): HarpoonModel {
  return new HarpoonModel(harpoonId);
}

// 모든 작살 모델 생성 (미리보기용)
export function createAllHarpoons(): THREE.Group {
  const group = new THREE.Group();
  const spacing = 0.5;

  HARPOON_MODELS.forEach((data, index) => {
    const harpoon = createHarpoon(data.id);
    const model = harpoon.getModel();

    // 그리드 배치
    const row = Math.floor(index / 6);
    const col = index % 6;
    model.position.set(col * spacing, row * spacing, 0);
    model.rotation.z = Math.PI / 6;

    group.add(model);
  });

  return group;
}
