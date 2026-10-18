# OCEAN GAIA V3.2 — 세션 A 통합 완전 가이드

## 🎯 개요

이 문서는 세션 A(sea)가 세션 B(beach)의 코드를 통합하는 완전한 가이드입니다.

---

## 📦 1단계: 파일 복사

### 세션 B → 세션 A로 복사할 파일 목록

```
beach/src/ → sea/src/

core/
  └── GameEngine.ts (1112줄)

data/
  ├── species.ts (367줄)
  ├── CreatureVisuals.ts (500+줄)
  ├── equipment.ts (100줄)
  ├── world.ts (300줄)
  ├── ShipModels.ts (200줄)
  ├── HarpoonModels.ts (100줄)
  ├── TankModels.ts (100줄)
  ├── SuitModels.ts (100줄)
  ├── SpeciesValidator.ts (150줄)
  └── SpeciesDepthValidator.ts (200줄)

systems/
  ├── CreatureBehavior.ts (374줄)
  ├── AdvancedCreatureBehavior.ts (400줄)
  ├── SpawnSystem.ts (152줄)
  ├── EconomySystem.ts (162줄)
  ├── WeatherSystem.ts (200줄)
  ├── TravelingMerchant.ts (300줄)
  ├── SaveManager.ts (237줄)
  ├── ValidationSystem.ts (250줄)
  ├── SessionAAdapter.ts (239줄)
  ├── PerformanceOptimizer.ts (200줄)
  ├── InputSystem.ts (150줄)
  ├── IntroSystem.ts (100줄)
  ├── HomeBaseSystem.ts (300줄)
  ├── OceanZone.ts (350줄)
  └── SeabedTerrain.ts (400줄)

models/
  ├── StartingIsland.ts (280줄)
  ├── PlayerHouse.ts (450줄)
  ├── DiverCharacter.ts (380줄)
  ├── Ship.ts (600줄)
  ├── Harpoon.ts (400줄)
  └── IslandModel.ts (500줄)

tests/
  ├── gameEngine.test.ts (200줄)
  ├── integration.test.ts (300줄)
  └── sessionBCompletion.test.ts (250줄)
```

### 복사 명령어 (예시)

```bash
# 세션 A 저장소로 이동
cd sea

# 세션 B 파일 복사
cp -r ../beach/src/core ./src/
cp -r ../beach/src/data ./src/
cp -r ../beach/src/systems ./src/
cp -r ../beach/src/models ./src/
cp -r ../beach/src/tests ./src/
```

---

## 🔧 2단계: MockGame 제거

### SceneManager.ts 수정

```typescript
// ❌ Before (MockGame 사용)
import { MockGame } from './MockGame';

class SceneManager {
  private game: MockGame;
  
  constructor() {
    this.game = new MockGame();
  }
}

// ✅ After (실제 GameEngine 사용)
import { createGame } from '../core/GameEngine';

class SceneManager {
  private game: ReturnType<typeof createGame>;
  
  constructor() {
    this.game = createGame({ seed: 12345 });
  }
}
```

---

## 🎨 3단계: SessionAAdapter 사용

### 기본 사용법

```typescript
import { createGame } from '../core/GameEngine';
import { adaptForSessionA } from '../systems/SessionAAdapter';

// 게임 엔진 생성
const game = createGame({ seed: 12345 });

// 게임 루프
function gameLoop(deltaTime: number) {
  // 1. 게임 상태 업데이트
  game.dispatch({ type: 'TICK', dtSec: deltaTime });
  
  // 2. 세션 A용 데이터로 변환
  const gameState = game.getSnapshot();
  const adapted = adaptForSessionA(gameState);
  
  // 3. Three.js로 렌더링
  renderScene(adapted);
}

function renderScene(adapted: any) {
  // 선박 렌더링
  ship.position.set(
    adapted.ship.position.x,
    adapted.ship.position.y,
    adapted.ship.position.z
  );
  ship.rotation.y = adapted.ship.heading;
  
  // 잠수부 렌더링
  if (adapted.diver.inWater) {
    diver.position.set(
      adapted.diver.position.x,
      adapted.diver.position.y,
      adapted.diver.position.z
    );
    diver.rotation.y = adapted.diver.heading;
    diver.visible = true;
  } else {
    diver.visible = false;
  }
  
  // 생물 렌더링
  adapted.creatures.forEach((creature: any) => {
    const model = getCreatureModel(creature.speciesId);
    model.position.set(
      creature.position.x,
      creature.position.y,
      creature.position.z
    );
    model.scale.setScalar(creature.scale);
    scene.add(model);
  });
  
  // 날씨 효과
  updateWeather(adapted.weather);
}
```

---

## 🌊 4단계: 새로운 물리적 기준 적용

### 수심 시스템

```typescript
import { DEPTH_CONFIG, DIVING_EQUIPMENT_TIERS } from '../data/world';

// 수심 확인
function checkDepth(depth: number, equipment: any): boolean {
  const tankMaxDepth = equipment.tank.maxDepth;
  const suitMaxDepth = equipment.suit.maxDepth;
  const maxDepth = Math.min(tankMaxDepth, suitMaxDepth);
  
  return depth <= maxDepth;
}

// 수심대별 환경
function getDepthZone(depth: number): string {
  if (depth <= 30) return '얕은 바다';
  if (depth <= 100) return '중층';
  if (depth <= 200) return '심층';
  return '심해';
}
```

### 해역 시스템

```typescript
import { OceanZoneSystem } from '../systems/OceanZone';

// 해역 환경 시스템 초기화
const oceanZone = new OceanZoneSystem(scene);

// 플레이어 위치에 따라 해역 자동 전환
function updateRegion(playerX: number, playerZ: number) {
  oceanZone.updateRegionFromPosition(playerX, playerZ);
}

// 해역별 특수 효과
function addRegionEffects(region: string) {
  oceanZone.addRegionSpecificEffects(region);
}
```

### 해저 지형

```typescript
import { SeabedTerrainSystem } from '../systems/SeabedTerrain';

// 해저 지형 시스템 초기화
const seabedTerrain = new SeabedTerrainSystem();

// 지형 메시를 씬에 추가
scene.add(seabedTerrain.getModel());

// 특정 위치의 수심 확인
function getDepthAt(x: number, z: number): number {
  return seabedTerrain.getDepthAtPosition(x, z);
}
```

---

## 🎮 5단계: 게임 루프 통합

### 완전한 게임 루프 예제

```typescript
import * as THREE from 'three';
import { createGame } from '../core/GameEngine';
import { adaptForSessionA } from '../systems/SessionAAdapter';
import { OceanZoneSystem } from '../systems/OceanZone';
import { SeabedTerrainSystem } from '../systems/SeabedTerrain';
import { createStartingIsland } from '../models/StartingIsland';
import { createDiverCharacter } from '../models/DiverCharacter';
import { createShip } from '../models/Ship';

class GameScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private game: ReturnType<typeof createGame>;
  private oceanZone: OceanZoneSystem;
  private seabedTerrain: SeabedTerrainSystem;
  private clock: THREE.Clock;
  
  constructor() {
    // Three.js 초기화
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    // 게임 엔진 초기화
    this.game = createGame({ seed: 12345 });
    
    // 환경 시스템 초기화
    this.oceanZone = new OceanZoneSystem(this.scene);
    this.seabedTerrain = new SeabedTerrainSystem();
    
    // 시작 섬 추가
    const startingIsland = createStartingIsland();
    this.scene.add(startingIsland.getModel());
    
    // 해저 지형 추가
    this.scene.add(this.seabedTerrain.getModel());
    
    // 잠수사 캐릭터 추가
    const diver = createDiverCharacter(1, 1, 1);
    this.scene.add(diver.getModel());
    
    // 선박 추가
    const ship = createShip(1);
    this.scene.add(ship.getModel());
    
    this.clock = new THREE.Clock();
  }
  
  start() {
    this.animate();
  }
  
  private animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // 1. 게임 상태 업데이트
    this.game.dispatch({ type: 'TICK', dtSec: deltaTime });
    
    // 2. 세션 A용 데이터로 변환
    const gameState = this.game.getSnapshot();
    const adapted = adaptForSessionA(gameState);
    
    // 3. 해역 환경 업데이트
    this.oceanZone.updateRegionFromPosition(
      adapted.ship.position.x,
      adapted.ship.position.z
    );
    
    // 4. 바다 애니메이션
    this.oceanZone.updateWaterAnimation(this.clock.getElapsedTime());
    
    // 5. Three.js 씬 업데이트
    this.updateScene(adapted);
    
    // 6. 렌더링
    this.renderer.render(this.scene, this.camera);
  }
  
  private updateScene(adapted: any) {
    // 선박 업데이트
    // ... (선박 모델 찾기 및 업데이트)
    
    // 잠수부 업데이트
    // ... (잠수부 모델 찾기 및 업데이트)
    
    // 생물 업데이트
    adapted.creatures.forEach((creature: any) => {
      // ... (생물 모델 찾기 및 업데이트)
    });
  }
}

// 게임 시작
const gameScene = new GameScene();
gameScene.start();
```

---

## 🧪 6단계: 통합 테스트

### 테스트 실행

```typescript
import { runIntegrationTests } from '../tests/integration.test';

// 통합 테스트 실행
const results = runIntegrationTests();

// 결과 확인
results.forEach(result => {
  console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.message}`);
});

// 모든 테스트 통과 확인
const allPassed = results.every(r => r.passed);
console.log(allPassed ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패');
```

---

## 📊 7단계: 성능 최적화

### LOD 시스템

```typescript
import { PerformanceOptimizer } from '../systems/PerformanceOptimizer';

const optimizer = new PerformanceOptimizer();

// 매 프레임
optimizer.updateFrameTime(deltaTime);

// 생물마다 LOD 결정
const lodLevel = optimizer.determineLODLevel(distance, visualData);

switch (lodLevel) {
  case 'high':
    renderHighQualityModel(creature);
    break;
  case 'medium':
    renderMediumQualityModel(creature);
    break;
  case 'low':
    renderLowQualityModel(creature);
    break;
}
```

### 인스턴싱

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
      specimens[i].y,
      specimens[i].z
    );
    instancedMesh.setMatrixAt(i, matrix);
  }
  
  scene.add(instancedMesh);
}
```

---

## ✅ 체크리스트

### 필수 항목
- [ ] 모든 파일 복사 완료
- [ ] MockGame 제거
- [ ] SessionAAdapter 통합
- [ ] 새로운 수심 시스템 적용
- [ ] 해역 환경 시스템 통합
- [ ] 해저 지형 시스템 통합
- [ ] 통합 테스트 통과
- [ ] 성능 최적화 적용

### 선택 항목
- [ ] LOD 시스템 적용
- [ ] 인스턴싱 적용
- [ ] 생체 발광 효과
- [ ] 군집 행동 애니메이션
- [ ] 물 쉐이더
- [ ] 빛 줄기 효과

---

## 🎯 최종 목표

**하우투 피쉬 ~ 서브노티카 사이의 그래픽 품질**

- ✅ 로우폴리 스타일 유지
- ✅ 실제 생태계 반영
- ✅ 부드러운 애니메이션
- ✅ 몰입감 있는 수중 환경
- ✅ 최적화된 성능

---

## 📞 문제 해결

### 일반적인 문제

1. **타입 에러**: 모든 파일이 제대로 복사되었는지 확인
2. **렌더링 문제**: SessionAAdapter가 올바르게 작동하는지 확인
3. **성능 문제**: PerformanceOptimizer를 적용했는지 확인
4. **수심 문제**: DEPTH_CONFIG가 올바르게 설정되었는지 확인

### 디버깅 팁

```typescript
// 게임 상태 로깅
console.log('Game State:', game.getSnapshot());

// 변환된 데이터 로깅
console.log('Adapted Data:', adaptForSessionA(game.getSnapshot()));

// 수심 확인
console.log('Depth at position:', seabedTerrain.getDepthAtPosition(x, z));

// 해역 확인
console.log('Current region:', oceanZone.getCurrentRegion());
```

---

**버전**: 3.2.0  
**상태**: ✅ 세션 B 완료, 세션 A 통합 준비 완료  
**최종 업데이트**: 2024
