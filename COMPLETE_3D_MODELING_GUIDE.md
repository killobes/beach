# OCEAN GAIA V3.2 — 3D 모델링 완전 가이드

## 🎯 개요

B팀이 제공한 모든 3D 모델 데이터를 A팀에서 Three.js로 구현하는 방법

---

## 📦 모델 데이터 파일 목록

### 1. 선박 모델 (5단계)
**파일**: `src/data/ShipModels.ts`

```typescript
import { SHIP_MODELS, getShipModelData } from './data/ShipModels';

// 레벨별 선박 데이터
const shipData = getShipModelData(level); // level: 1-5

// 데이터 구조
{
  level: number,
  name: string,
  length: number,      // meters
  width: number,       // meters
  height: number,      // meters
  color: string,       // HEX
  materials: {
    hull: string,
    deck: string,
    cabin: string,
    mast: string,
  },
  components: ShipComponent[],
  description: string,
}
```

### 2. 작살 모델 (24종)
**파일**: `src/data/HarpoonModels.ts`

```typescript
import { HARPOON_MODELS, getHarpoonModelData } from './data/HarpoonModels';

const harpoonData = getHarpoonModelData(id); // id: 1-24

// 데이터 구조
{
  id: number,
  name: string,
  length: number,      // cm
  weight: number,      // kg
  material: string,
  color: string,       // HEX
  tipType: 'standard' | 'barbed' | 'electric' | 'explosive' | 'net' | 'laser' | 'sonic',
  specialEffect: string,
  glowColor?: string,  // 발광 색상
  description: string,
}
```

### 3. 산소통 모델 (6종)
**파일**: `src/data/TankModels.ts`

```typescript
import { TANK_MODELS, getTankModelData } from './data/TankModels';

const tankData = getTankModelData(id); // id: 1-6

// 데이터 구조
{
  id: number,
  name: string,
  height: number,      // cm
  diameter: number,    // cm
  weight: number,      // kg
  material: string,
  color: string,       // HEX
  pressure: number,    // atm
  valveType: 'standard' | 'advanced' | 'digital' | 'emergency',
  specialFeature: string,
  description: string,
}
```

### 4. 잠수복 모델 (6종)
**파일**: `src/data/SuitModels.ts`

```typescript
import { SUIT_MODELS, getSuitModelData } from './data/SuitModels';

const suitData = getSuitModelData(id); // id: 1-6

// 데이터 구조
{
  id: number,
  name: string,
  thickness: number,   // mm
  weight: number,      // kg
  material: string,
  primaryColor: string,   // HEX
  secondaryColor: string, // HEX
  helmetType: 'none' | 'basic' | 'advanced' | 'legendary',
  specialFeature: string,
  flexibility: number, // 1-10
  description: string,
}
```

### 5. 생물 모델 (200종)
**파일**: `src/data/CreatureVisuals.ts`

```typescript
import { CREATURE_VISUALS, getVisualData } from './data/CreatureVisuals';

const visualData = getVisualData(speciesId); // speciesId: 1-200

// 데이터 구조
{
  speciesId: number,
  bodyShape: 'streamlined' | 'round' | 'flat' | 'eel-like' | 'boxy' | 'disc' | 'torpedo',
  primaryColor: string,
  secondaryColor: string,
  pattern: 'solid' | 'striped' | 'spotted' | 'gradient' | 'camouflage' | 'banded' | 'marbled',
  finType: 'small' | 'large' | 'flowing' | 'spiny' | 'none' | 'wing-like',
  tailType: 'forked' | 'round' | 'pointed' | 'crescent' | 'whip-like' | 'square' | 'lunate',
  specialFeatures: string[],
  sizeCategory: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'giant',
  swimmingStyle: 'fast' | 'normal' | 'slow' | 'hovering' | 'bottom-dweller' | 'darting',
  animationHints: string[],
  modelPriority: 1 | 2 | 3 | 4 | 5,
  lodDistance: { high: number, medium: number, low: number },
  description: string,
}
```

### 6. 집 꾸미기 아이템 (22종)
**파일**: `src/systems/HomeBaseSystem.ts`

```typescript
import { FURNITURE_CATALOG } from './systems/HomeBaseSystem';

// 가구 카탈로그
FURNITURE_CATALOG.forEach(item => {
  item.id           // 아이템 ID
  item.name         // 이름
  item.category     // 카테고리 (bed, table, chair, storage, decoration, lighting, aquarium)
  item.position     // 위치 {x, y, z}
  item.rotation     // 회전 (라디안)
  item.scale        // 스케일
  item.price        // 가격
  item.unlockCondition  // 해금 조건
  item.description  // 설명
});
```

---

## 🎨 Three.js 구현 가이드

### 1. 선박 렌더링

```typescript
import { getShipModelData } from './data/ShipModels';

function createShipModel(level: number): THREE.Group {
  const shipData = getShipModelData(level);
  const ship = new THREE.Group();

  // 선체
  const hullGeometry = new THREE.BoxGeometry(
    shipData.length,
    shipData.height,
    shipData.width
  );
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: shipData.color,
    roughness: 0.7,
    metalness: 0.3,
  });
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  ship.add(hull);

  // 컴포넌트 추가
  shipData.components.forEach(component => {
    if (!component.visible) return;

    let geometry: THREE.BufferGeometry;
    let material: THREE.MeshStandardMaterial;

    switch (component.type) {
      case 'mast':
        geometry = new THREE.CylinderGeometry(0.1, 0.1, component.scale.y);
        material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        break;
      case 'sail':
        geometry = new THREE.PlaneGeometry(component.scale.x, component.scale.y);
        material = new THREE.MeshStandardMaterial({ 
          color: 0xFFFFFF, 
          side: THREE.DoubleSide 
        });
        break;
      case 'cabin':
        geometry = new THREE.BoxGeometry(
          component.scale.x,
          component.scale.y,
          component.scale.z
        );
        material = new THREE.MeshStandardMaterial({ color: 0xA0522D });
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshStandardMaterial({ color: 0x808080 });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      component.position.x,
      component.position.y,
      component.position.z
    );
    ship.add(mesh);
  });

  return ship;
}
```

### 2. 작살 렌더링

```typescript
import { getHarpoonModelData } from './data/HarpoonModels';

function createHarpoonModel(id: number): THREE.Group {
  const harpoonData = getHarpoonModelData(id);
  const harpoon = new THREE.Group();

  // 작살 몸통
  const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, harpoonData.length / 100);
  const shaftMaterial = new THREE.MeshStandardMaterial({
    color: harpoonData.color,
    roughness: 0.5,
    metalness: 0.7,
  });
  const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
  shaft.rotation.z = Math.PI / 2;
  harpoon.add(shaft);

  // 작살 끝
  let tipGeometry: THREE.BufferGeometry;
  switch (harpoonData.tipType) {
    case 'barbed':
      tipGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
      break;
    case 'electric':
      tipGeometry = new THREE.SphereGeometry(0.06, 16, 16);
      break;
    case 'laser':
      tipGeometry = new THREE.ConeGeometry(0.03, 0.2, 16);
      break;
    default:
      tipGeometry = new THREE.ConeGeometry(0.04, 0.12, 8);
  }

  const tipMaterial = new THREE.MeshStandardMaterial({
    color: harpoonData.color,
    roughness: 0.3,
    metalness: 0.9,
    emissive: harpoonData.glowColor ? new THREE.Color(harpoonData.glowColor) : undefined,
    emissiveIntensity: harpoonData.glowColor ? 0.5 : 0,
  });

  const tip = new THREE.Mesh(tipGeometry, tipMaterial);
  tip.position.x = harpoonData.length / 200;
  tip.rotation.z = -Math.PI / 2;
  harpoon.add(tip);

  return harpoon;
}
```

### 3. 산소통 렌더링

```typescript
import { getTankModelData } from './data/TankModels';

function createTankModel(id: number): THREE.Group {
  const tankData = getTankModelData(id);
  const tank = new THREE.Group();

  // 산소통 몸통
  const bodyGeometry = new THREE.CylinderGeometry(
    tankData.diameter / 200,
    tankData.diameter / 200,
    tankData.height / 100,
    16
  );
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: tankData.color,
    roughness: 0.4,
    metalness: 0.8,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  tank.add(body);

  // 밸브
  const valveGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8);
  const valveMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.3,
    metalness: 0.9,
  });
  const valve = new THREE.Mesh(valveGeometry, valveMaterial);
  valve.position.y = tankData.height / 200 + 0.025;
  tank.add(valve);

  return tank;
}
```

### 4. 잠수복 렌더링

```typescript
import { getSuitModelData } from './data/SuitModels';

function createDiverModel(suitId: number): THREE.Group {
  const suitData = getSuitModelData(suitId);
  const diver = new THREE.Group();

  // 몸통
  const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 8, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: suitData.primaryColor,
    roughness: 0.6,
    metalness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  diver.add(body);

  // 헬멧 (있는 경우)
  if (suitData.helmetType !== 'none') {
    const helmetGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const helmetMaterial = new THREE.MeshStandardMaterial({
      color: suitData.helmetType === 'legendary' ? 0xFFD700 : 0x808080,
      roughness: 0.3,
      metalness: 0.7,
    });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = 0.7;
    diver.add(helmet);

    // 바이저
    const visorGeometry = new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI);
    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4169E1,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.7,
    });
    const visor = new THREE.Mesh(visorGeometry, visorMaterial);
    visor.position.set(0.1, 0.7, 0);
    visor.rotation.y = Math.PI / 2;
    diver.add(visor);
  }

  // 팔
  const armGeometry = new THREE.CapsuleGeometry(0.1, 0.5, 4, 8);
  const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
  leftArm.position.set(0.4, 0.2, 0);
  leftArm.rotation.z = 0.3;
  diver.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = -0.4;
  rightArm.rotation.z = -0.3;
  diver.add(rightArm);

  // 다리
  const legGeometry = new THREE.CapsuleGeometry(0.12, 0.6, 4, 8);
  const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
  leftLeg.position.set(0.15, -0.7, 0);
  diver.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = -0.15;
  diver.add(rightLeg);

  // 오리발
  const flipperGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.4);
  const flipperMaterial = new THREE.MeshStandardMaterial({
    color: suitData.secondaryColor,
    roughness: 0.5,
  });
  const leftFlipper = new THREE.Mesh(flipperGeometry, flipperMaterial);
  leftFlipper.position.set(0.15, -1.1, 0.1);
  diver.add(leftFlipper);

  const rightFlipper = leftFlipper.clone();
  rightFlipper.position.x = -0.15;
  diver.add(rightFlipper);

  return diver;
}
```

### 5. 생물 렌더링

```typescript
import { getVisualData } from './data/CreatureVisuals';

function createCreatureModel(speciesId: number): THREE.Group {
  const visualData = getVisualData(speciesId);
  const creature = new THREE.Group();

  // 몸통
  let bodyGeometry: THREE.BufferGeometry;
  switch (visualData.bodyShape) {
    case 'streamlined':
      bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 8, 16);
      break;
    case 'round':
      bodyGeometry = new THREE.SphereGeometry(0.4, 16, 16);
      break;
    case 'flat':
      bodyGeometry = new THREE.BoxGeometry(1, 0.2, 0.6);
      break;
    case 'eel-like':
      bodyGeometry = new THREE.CapsuleGeometry(0.15, 1.5, 8, 16);
      break;
    case 'disc':
      bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
      break;
    default:
      bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.4);
  }

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: visualData.primaryColor,
    roughness: 0.6,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  creature.add(body);

  // 지느러미
  if (visualData.finType !== 'none') {
    const finGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const finMaterial = new THREE.MeshStandardMaterial({
      color: visualData.secondaryColor,
      roughness: 0.7,
    });

    // 등 지느러미
    const dorsalFin = new THREE.Mesh(finGeometry, finMaterial);
    dorsalFin.position.y = 0.3;
    dorsalFin.scale.set(0.8, 1, 0.3);
    creature.add(dorsalFin);
  }

  // 꼬리
  const tailGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
  const tailMaterial = new THREE.MeshStandardMaterial({
    color: visualData.secondaryColor,
    roughness: 0.7,
  });
  const tail = new THREE.Mesh(tailGeometry, tailMaterial);
  tail.position.x = -0.6;
  tail.rotation.z = Math.PI / 2;
  creature.add(tail);

  // 눈
  const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.3,
  });
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(0.3, 0.1, 0.2);
  creature.add(leftEye);

  const rightEye = leftEye.clone();
  rightEye.position.z = -0.2;
  creature.add(rightEye);

  // 발광 효과
  if (visualData.specialFeatures.includes('bioluminescent')) {
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: visualData.primaryColor,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(bodyGeometry.clone(), glowMaterial);
    glow.scale.set(1.1, 1.1, 1.1);
    creature.add(glow);
  }

  return creature;
}
```

---

## 🏠 집 꾸미기 렌더링

```typescript
import { FURNITURE_CATALOG } from './systems/HomeBaseSystem';

function createFurnitureModel(furnitureId: number): THREE.Group {
  const furniture = FURNITURE_CATALOG.find(f => f.id === furnitureId);
  if (!furniture) return new THREE.Group();

  const model = new THREE.Group();

  switch (furniture.category) {
    case 'bed':
      const bedGeometry = new THREE.BoxGeometry(1.5, 0.3, 2);
      const bedMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const bed = new THREE.Mesh(bedGeometry, bedMaterial);
      model.add(bed);
      break;

    case 'table':
      const tableGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.8);
      const tableMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
      const table = new THREE.Mesh(tableGeometry, tableMaterial);
      model.add(table);
      break;

    case 'chair':
      const chairGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const chair = new THREE.Mesh(chairGeometry, chairMaterial);
      model.add(chair);
      break;

    case 'aquarium':
      const aquariumGeometry = new THREE.BoxGeometry(1, 0.8, 0.5);
      const aquariumMaterial = new THREE.MeshStandardMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.5,
      });
      const aquarium = new THREE.Mesh(aquariumGeometry, aquariumMaterial);
      model.add(aquarium);
      break;

    default:
      const defaultGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const defaultMesh = new THREE.Mesh(defaultGeometry, defaultMaterial);
      model.add(defaultMesh);
  }

  return model;
}
```

---

## 🎬 인트로 렌더링

```typescript
import { IntroSystem, INTRO_SCENES } from './systems/IntroSystem';

const introSystem = new IntroSystem();

function renderIntro(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.Renderer) {
  const { scene: introScene, progress } = introSystem.update(1/60);

  if (!introScene) return;

  // 배경색
  renderer.setClearColor(introScene.content.backgroundColor || '#000000');

  // 텍스트 렌더링 (HTML 오버레이 사용)
  if (introScene.type === 'text') {
    // HTML 요소로 텍스트 표시
    const textElement = document.getElementById('intro-text');
    if (textElement) {
      textElement.textContent = introScene.content.text || '';
      textElement.style.color = introScene.content.textColor || '#FFFFFF';
      textElement.style.opacity = progress.toString();
    }
  }
}
```

---

## 📋 모델 제작 우선순위

### Priority 1 (즉시 제작): 20종
- ID 1, 2, 3, 6, 13, 17, 38, 44, 56, 75, 79, 87, 101, 113, 142, 147, 150, 170, 179, 184, 200

### Priority 2 (1주 내): 40종
- 각 해역별 대표종 10종씩

### Priority 3 (2주 내): 60종
- 일반 종

### Priority 4 (3주 내): 60종
- 흔한 종

### Priority 5 (4주 내): 20종
- 심해/희귀종

---

## 🎯 최종 체크리스트

### 필수 모델
- [ ] 선박 5단계
- [ ] 작살 24종
- [ ] 산소통 6종
- [ ] 잠수복 6종
- [ ] 생물 200종 (우선순위별)
- [ ] 집 꾸미기 아이템 22종
- [ ] 잠수사 캐릭터

### 필수 환경
- [ ] 수중 포그
- [ ] 기포 파티클
- [ ] 산호초
- [ ] 해저 지형
- [ ] 빛 줄기
- [ ] 날씨 효과

### 필수 애니메이션
- [ ] 생물 수영
- [ ] 꼬리 흔들기
- [ ] 지느러미 움직임
- [ ] 잠수사 수영
- [ ] 선박 움직임
- [ ] 인트로 시퀀스

---

**모든 모델 데이터는 B팀이 제공했습니다!**
**A팀은 Three.js로 렌더링만 구현하면 됩니다!**

**버전**: 3.2.0  
**상태**: ✅ B팀 완료, A팀 통합 준비 완료
