# OCEAN GAIA V3.2 — 3D 렌더링 가이드 (세션 A용)

## 📋 개요

이 문서는 세션 A가 Three.js로 3D 물고기, 선박, 잠수사, 환경을 렌더링할 때 참고하는 가이드입니다.

세션 B에서 제공하는 데이터:
- `CreatureVisuals.ts`: 200종 물고기의 색상, 형태, 애니메이션 정보
- `PerformanceOptimizer.ts`: LOD, 인스턴싱, 컬링 최적화 로직

---

## 🐠 물고기 모델링 가이드

### 1. 모델 우선순위

**Priority 1 (즉시 제작)**: 20종 — 게임 플레이 필수
- ID 1, 2, 3, 6, 13, 17, 38, 44, 56, 75, 79, 87, 101, 113, 142, 147, 150, 170, 179, 184, 200

**Priority 2 (1주 내)**: 40종 — 주요 해역 대표종
- 각 해역별 10종씩

**Priority 3 (2주 내)**: 60종 — 일반 종

**Priority 4 (3주 내)**: 60종 — 흔한 종

**Priority 5 (4주 내)**: 20종 — 심해/희귀종

### 2. 모델 구조

각 물고기 모델은 다음을 포함해야 합니다:

```typescript
interface FishModel {
  body: THREE.Mesh;           // 몸통 (메인 메시)
  tail?: THREE.Mesh;          // 꼬리 (애니메이션 대상)
  fins?: THREE.Mesh[];        // 지느러미 (등, 가슴, 배)
  eyes?: THREE.Mesh[];        // 눈
  specialFeatures?: THREE.Mesh[]; // 특수 기능 (뿔, 미끼 등)
}
```

### 3. 색상 적용

`CreatureVisuals.ts`의 색상 데이터를 사용:

```typescript
const visualData = getVisualData(speciesId);

// 몸통 색상
bodyMaterial.color.set(visualData.primaryColor);

// 패턴 적용
if (visualData.pattern === 'striped') {
  // 줄무늬 텍스처 또는 셰이더
} else if (visualData.pattern === 'spotted') {
  // 점 패턴 텍스처
}

// 보조 색상 (배쪽, 지느러미 등)
finMaterial.color.set(visualData.secondaryColor);
```

### 4. 애니메이션

`animationHints` 배열을 참고:

```typescript
const hints = visualData.animationHints;

// 꼬리 흔들기
if (hints.includes('tail-wag')) {
  tail.rotation.y = Math.sin(time * swimSpeed) * 0.3;
}

// 지느러미 떨림
if (hints.includes('fin-flutter')) {
  fins.forEach(fin => {
    fin.rotation.z = Math.sin(time * 2) * 0.1;
  });
}

// 몸체 파동
if (hints.includes('body-undulate')) {
  body.position.x = Math.sin(time * 1.5) * 0.05;
}

// 생체 발광
if (hints.includes('glow-pulse')) {
  const intensity = (Math.sin(time * 2) + 1) * 0.5;
  emissiveMaterial.emissiveIntensity = intensity;
}
```

### 5. 크기 조정

`sizeCategory`에 따른 기본 크기:

```typescript
const sizeMap = {
  tiny: 0.1,      // 10cm 정도
  small: 0.3,     // 30cm 정도
  medium: 0.8,    // 80cm 정도
  large: 1.5,     // 1.5m 정도
  huge: 3.0,      // 3m 정도
  giant: 6.0,     // 6m 정도
};

const baseScale = sizeMap[visualData.sizeCategory];
const actualLength = specimen.lengthCm / 100; // cm → m
const scale = baseScale * (actualLength / visualData.baseLength);

model.scale.set(scale, scale, scale);
```

### 6. 절차적 변형

같은 종의 다른 개체를 만들 때:

```typescript
function createVariant(baseModel: THREE.Group, specimen: Specimen): THREE.Group {
  const variant = baseModel.clone();
  
  // 색상 약간 변경 (±10%)
  variant.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const color = child.material.color.clone();
      const hsl = { h: 0, s: 0, l: 0 };
      color.getHSL(hsl);
      
      hsl.h += (Math.random() - 0.5) * 0.02; // ±2% 색조
      hsl.l += (Math.random() - 0.5) * 0.1;  // ±10% 밝기
      
      color.setHSL(hsl.h, hsl.s, hsl.l);
      child.material.color = color;
    }
  });
  
  return variant;
}
```

---

## 🚢 선박 모델링 가이드

### 5단계 선박

```typescript
const shipLevels = [
  { level: 1, name: '낡은 어선', length: 5, color: '#8B4513' },
  { level: 2, name: '개량 어선', length: 8, color: '#A0522D' },
  { level: 3, name: '탐사선', length: 12, color: '#4682B4' },
  { level: 4, name: '연구선', length: 18, color: '#2F4F4F' },
  { level: 5, name: '가이아호', length: 25, color: '#1C1C1C' },
];
```

### 레벨별 추가 요소

- **Level 1**: 기본 선체, 돛대
- **Level 2**: + 선실, 작은 창고
- **Level 3**: + 탐사 장비, 레이더
- **Level 4**: + 연구실, 대형 창고
- **Level 5**: + 고급 장비, 헬리패드

---

## 🤿 잠수사 모델링 가이드

### 기본 구조

```typescript
const diverParts = {
  body: '잠수복 (검은색)',
  helmet: '금색 헬멧',
  visor: '파란색 투명 바이저',
  tank: '회색 산소통',
  arms: '잠수복 팔',
  legs: '잠수복 다리',
  flippers: '초록색 오리발',
};
```

### 애니메이션

```typescript
// 수영 애니메이션
function animateDiver(diver: THREE.Group, time: number, isMoving: boolean): void {
  if (isMoving) {
    // 팔 흔들기
    diver.leftArm.rotation.x = Math.sin(time * 3) * 0.5;
    diver.rightArm.rotation.x = Math.sin(time * 3 + Math.PI) * 0.5;
    
    // 다리 움직이기
    diver.leftLeg.rotation.x = Math.sin(time * 2) * 0.3;
    diver.rightLeg.rotation.x = Math.sin(time * 2 + Math.PI) * 0.3;
  }
  
  // 호흡에 따른 미세한 움직임
  diver.body.position.y = Math.sin(time * 0.5) * 0.02;
}
```

---

## 🌊 수중 환경 가이드

### 1. 수중 포그

```typescript
// 얕은 물
scene.fog = new THREE.FogExp2(0x006994, 0.01);

// 깊은 물
scene.fog = new THREE.FogExp2(0x001a33, 0.02);

// 심해
scene.fog = new THREE.FogExp2(0x000000, 0.05);
```

### 2. 기포 파티클

```typescript
const bubbleGeometry = new THREE.BufferGeometry();
const bubbleCount = 1000;
const positions = new Float32Array(bubbleCount * 3);

for (let i = 0; i < bubbleCount * 3; i += 3) {
  positions[i] = (Math.random() - 0.5) * 200;
  positions[i + 1] = Math.random() * -100;
  positions[i + 2] = (Math.random() - 0.5) * 200;
}

bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const bubbleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.3,
  transparent: true,
  opacity: 0.6,
});

const bubbles = new THREE.Points(bubbleGeometry, bubbleMaterial);
scene.add(bubbles);

// 애니메이션
function animateBubbles(bubbles: THREE.Points, time: number): void {
  const positions = bubbles.geometry.attributes.position.array;
  for (let i = 1; i < positions.length; i += 3) {
    positions[i] += 0.02; // 위로 상승
    if (positions[i] > 0) positions[i] = -100; // 리셋
  }
  bubbles.geometry.attributes.position.needsUpdate = true;
}
```

### 3. 빛 줄기 (God Rays)

```typescript
const godRayGeometry = new THREE.CylinderGeometry(0, 5, 50, 32, 1, true);
const godRayMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffcc,
  transparent: true,
  opacity: 0.1,
  side: THREE.DoubleSide,
});

for (let i = 0; i < 5; i++) {
  const godRay = new THREE.Mesh(godRayGeometry, godRayMaterial);
  godRay.position.set(
    (Math.random() - 0.5) * 100,
    25,
    (Math.random() - 0.5) * 100
  );
  scene.add(godRay);
}
```

### 4. 해저 지형

```typescript
const seabedGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);
const seabedMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b7355,
  roughness: 0.9,
  metalness: 0.1,
});

// 노이즈로 지형 변형
const positions = seabedGeometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const y = positions.getY(i);
  const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2;
  positions.setZ(i, noise);
}

const seabed = new THREE.Mesh(seabedGeometry, seabedMaterial);
seabed.rotation.x = -Math.PI / 2;
seabed.position.y = -50;
scene.add(seabed);
```

### 5. 산호초

```typescript
function createCoralReef(scene: THREE.Scene): void {
  const coralColors = [0xff6b9d, 0xffa07a, 0xffd700, 0x98fb98];
  
  for (let i = 0; i < 50; i++) {
    const coralGeometry = new THREE.ConeGeometry(
      Math.random() * 2 + 1,
      Math.random() * 3 + 2,
      8
    );
    const coralMaterial = new THREE.MeshStandardMaterial({
      color: coralColors[Math.floor(Math.random() * coralColors.length)],
      roughness: 0.8,
    });
    
    const coral = new THREE.Mesh(coralGeometry, coralMaterial);
    coral.position.set(
      (Math.random() - 0.5) * 200,
      -48 + Math.random() * 2,
      (Math.random() - 0.5) * 200
    );
    scene.add(coral);
  }
}
```

---

## ⚡ 성능 최적화

### 1. LOD (Level of Detail)

```typescript
// CreatureVisuals.ts의 lodDistance 사용
const visualData = getVisualData(speciesId);
const distance = camera.position.distanceTo(model.position);

if (distance <= visualData.lodDistance.high) {
  // 고품질 모델 (2000-5000 폴리곤)
  model.visible = true;
  model.useHighQuality();
} else if (distance <= visualData.lodDistance.medium) {
  // 중간 품질 (500-1500 폴리곤)
  model.visible = true;
  model.useMediumQuality();
} else if (distance <= visualData.lodDistance.low) {
  // 저품질 (100-400 폴리곤)
  model.visible = true;
  model.useLowQuality();
} else {
  // 렌더링 제외
  model.visible = false;
}
```

### 2. 인스턴싱

```typescript
// 같은 종 5마리 이상이면 인스턴싱 사용
if (sameSpeciesCount >= 5) {
  const instancedMesh = new THREE.InstancedMesh(
    fishGeometry,
    fishMaterial,
    sameSpeciesCount
  );
  
  for (let i = 0; i < sameSpeciesCount; i++) {
    const matrix = new THREE.Matrix4();
    matrix.setPosition(
      specimens[i].x,
      -specimens[i].depthM,
      specimens[i].z
    );
    instancedMesh.setMatrixAt(i, matrix);
  }
  
  scene.add(instancedMesh);
}
```

### 3. 동적 LOD 조정

```typescript
// PerformanceOptimizer.ts 사용
const optimizer = new PerformanceOptimizer();

function animate(deltaTime: number): void {
  optimizer.updateFrameTime(deltaTime);
  
  // FPS가 낮으면 LOD 거리 자동 축소
  const config = optimizer.getConfig();
  // config.lodDistances가 자동으로 조정됨
}
```

---

## 🎨 재질 가이드

### 물고기 재질

```typescript
const fishMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.4,
  metalness: 0.1,
  envMap: reflectionCube, // 환경 반사
});
```

### 선박 재질

```typescript
// 나무
const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x8B4513,
  roughness: 0.8,
  metalness: 0.1,
});

// 금속
const metalMaterial = new THREE.MeshStandardMaterial({
  color: 0x808080,
  roughness: 0.3,
  metalness: 0.9,
});
```

### 잠수사 재질

```typescript
// 잠수복
const suitMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.6,
  metalness: 0.2,
});

// 헬멧 바이저
const visorMaterial = new THREE.MeshStandardMaterial({
  color: 0x4a90e2,
  roughness: 0.1,
  metalness: 0.9,
  transparent: true,
  opacity: 0.7,
});
```

---

## 💡 조명 가이드

### 수중 조명

```typescript
// 방향광 (태양)
const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(100, 100, 50);
sunLight.castShadow = true;

// 환경광 (대기)
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);

// 수심에 따른 조명 감소
function updateLighting(diverDepth: number): void {
  const depthFactor = Math.max(0, 1 - Math.abs(diverDepth) / 100);
  sunLight.intensity = depthFactor;
  ambientLight.intensity = depthFactor * 0.5;
}
```

---

## 📊 체크리스트

### 필수 항목 (하우투 피쉬 수준)

- [ ] 물고기 모델 200종 (최소 로우폴리)
- [ ] 꼬리/지느러미 애니메이션
- [ ] 수중 포그 효과
- [ ] 기포 파티클
- [ ] 산호초/해저 지형
- [ ] 선박 모델 5단계
- [ ] 잠수사 캐릭터
- [ ] 기본 조명 (방향광 + 환경광)
- [ ] 그림자

### 목표 항목 (서브노티카 접근)

- [ ] 물 쉐이더 (파도)
- [ ] 빛 줄기 (God rays)
- [ ] 색상 변형 (같은 종 다른 개체)
- [ ] 군집 행동 애니메이션
- [ ] 생체 발광 (심해어)
- [ ] 환경 사운드
- [ ] UI 애니메이션

---

## 🔗 통합 방법

```typescript
import { createGame } from './core/GameEngine';
import { adaptForSessionA } from './systems/SessionAAdapter';
import { getVisualData } from './data/CreatureVisuals';
import { PerformanceOptimizer } from './systems/PerformanceOptimizer';

// 게임 엔진 초기화
const game = createGame({ seed: 12345 });

// 성능 최적화 초기화
const optimizer = new PerformanceOptimizer();

// 게임 루프
function gameLoop(deltaTime: number): void {
  // 상태 업데이트
  game.dispatch({ type: 'TICK', dtSec: deltaTime });
  
  // 세션 A용 데이터 변환
  const state = game.getSnapshot();
  const adapted = adaptForSessionA(state);
  
  // 성능 최적화
  optimizer.updateFrameTime(deltaTime);
  
  // 물고기 렌더링
  adapted.creatures.forEach(creature => {
    const visualData = getVisualData(creature.speciesId);
    const model = getOrCreateFishModel(creature.speciesId);
    
    // 위치 설정
    model.position.set(
      creature.position.x,
      creature.position.y,
      creature.position.z
    );
    
    // LOD 결정
    const distance = camera.position.distanceTo(model.position);
    const lodLevel = optimizer.determineLODLevel(distance, visualData);
    model.setLODLevel(lodLevel);
    
    // 애니메이션
    animateFish(model, creature.behaviorState, deltaTime);
  });
  
  // 렌더링
  renderer.render(scene, camera);
}
```

---

## 📝 참고 자료

- `src/data/CreatureVisuals.ts`: 200종 시각 데이터
- `src/systems/PerformanceOptimizer.ts`: 성능 최적화 로직
- `src/systems/SessionAAdapter.ts`: 세션 A 통합 어댑터
- `INTEGRATION_GUIDE.md`: 통합 가이드

---

**버전**: 3.2.0  
**최종 업데이트**: 2024
