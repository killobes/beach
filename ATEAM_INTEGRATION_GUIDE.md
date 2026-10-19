# OCEAN GAIA V3.2 — A팀 통합 가이드 (완벽 버전)

## 🎯 개요

B팀이 완성한 게임 엔진을 A팀 3D 렌더링 시스템에 통합하는 방법

**상태**: ✅ 모든 시스템 구현 완료, 테스트 통과, A팀 통합 준비 완료

---

## 📦 설치 및 초기화

### 1. 게임 엔진 생성

```typescript
import { createGame } from './core/GameEngine';

// 게임 엔진 인스턴스 생성
const game = createGame({ 
  seed: 12345  // 재현 가능한 난수 시드
});
```

### 2. 기본 API

```typescript
// 게임 상태 조회
const state = game.getSnapshot();

// 액션 실행
const result = game.dispatch({ type: 'TICK', dtSec: 1/60 });

// 상태 변경 구독
const unsubscribe = game.subscribe((newState) => {
  // 상태가 변경될 때마다 호출
  updateUI(newState);
});

// 저장
game.save();

// 불러오기
game.load();
```

---

## 🎮 GameState 구조

```typescript
interface GameState {
  // 메타데이터
  version: string;              // '3.2.0'
  seed: number;                 // 난수 시드
  tick: number;                 // 프레임 카운터
  gameTimeSec: number;          // 총 게임 시간 (초)
  
  // 시간 시스템
  day: number;                  // 현재 날짜
  hour: number;                 // 현재 시간 (0-23)
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  weather: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'snow';
  
  // 플레이어
  shells: number;               // 보유 자금 (조개)
  shipLevel: number;            // 선박 레벨 (1-5)
  shipX: number;                // 선박 X 위치 (m)
  shipZ: number;                // 선박 Z 위치 (m)
  shipHeading: number;          // 선박 방향 (라디안)
  
  // 잠수부
  inWater: boolean;             // 수중 여부
  diverX: number;               // 잠수부 X 위치 (m)
  diverZ: number;               // 잠수부 Z 위치 (m)
  diverY: number;               // 잠수부 Y 위치 (m, 음수=수중)
  diverHeading: number;         // 잠수부 방향 (라디안)
  airRemaining: number;         // 산소량 (0-100%)
  
  // 장비
  equippedHarpoon: number;      // 장착된 작살 ID
  equippedTank: number;         // 장착된 산소통 ID
  equippedSuit: number;         // 장착된 잠수복 ID
  ownedHarpoons: number[];      // 소유한 작살 ID 목록
  ownedTanks: number[];         // 소유한 산소통 ID 목록
  ownedSuits: number[];         // 소유한 잠수복 ID 목록
  
  // 인벤토리
  cargo: Specimen[];            // 선박 화물
  storage: Specimen[];          // 창고
  
  // 도감
  codex: Record<number, CodexEntry>;  // 발견/포획 기록
  
  // 동료
  companions: string[];         // 영입한 동료 ID 목록
  
  // 화석
  fossils: number[];            // 수집한 화석 ID 목록
  
  // 보스
  bossActive: string | null;    // 활성 보스 ID
  bossHp: number;               // 보스 HP
  
  // 생물
  activeSpecimens: Specimen[];  // 월드에 존재하는 모든 생물
  
  // 유랑 상인
  merchant: MerchantState;      // 유랑 상인 상태
  
  // 통계
  totalDives: number;           // 총 잠수 횟수
  totalCatches: number;         // 총 포획 횟수
  uniqueSpeciesCaught: number;  // 발견한 고유 종 수
  title: string;                // 플레이어 칭호
}

interface Specimen {
  uid: string;                  // 고유 ID
  speciesId: number;            // 종 ID (1-200)
  lengthCm: number;             // 길이 (cm)
  weightKg: number;             // 무게 (kg)
  depthM: number;               // 수심 (m)
  x: number;                    // X 위치 (m)
  z: number;                    // Z 위치 (m)
  behaviorState: string;        // 현재 행동 상태
  spawnTime: number;            // 스폰 시간
}

interface CodexEntry {
  speciesId: number;
  firstDiscoverTime: number;    // 첫 발견 시간
  firstCatchTime: number | null; // 첫 포획 시간
  catchCount: number;           // 포획 횟수
  observeCount: number;         // 관찰 횟수
  maxLengthCm: number;          // 최장 길이
  maxWeightKg: number;          // 최대 무게
  maxLengthWeightKg: number;    // 최장 개체의 무게
  maxWeightLengthCm: number;    // 최대 무게 개체의 길이
  discoveredRegions: Region[];  // 발견된 해역 목록
}

interface MerchantState {
  isActive: boolean;            // 방문 중 여부
  currentPortId: number | null; // 현재 방문 항구 ID
  visitStartTime: number;       // 방문 시작 시간
  visitDuration: number;        // 방문 지속 시간 (초)
  nextVisitTime: number;        // 다음 방문 시간
  visitInterval: number;        // 방문 간격 (초)
  inventory: MerchantItem[];    // 판매 상품 목록
  totalVisits: number;          // 총 방문 횟수
}
```

---

## 🎯 사용 가능한 액션

### 1. 게임 진행

```typescript
// 게임 틱 (매 프레임 호출)
game.dispatch({ type: 'TICK', dtSec: 1/60 });
```

### 2. 이동

```typescript
// 선박 이동
game.dispatch({
  type: 'MOVE_SHIP',
  forward: 1,      // -1 ~ 1 (후진 ~ 전진)
  turn: 0,         // -1 ~ 1 (좌회전 ~ 우회전)
  dtSec: 1/60      // 프레임 시간
});

// 잠수부 이동
game.dispatch({
  type: 'MOVE_DIVER',
  forward: 1,      // -1 ~ 1
  turn: 0,         // -1 ~ 1
  vertical: -1,    // -1 ~ 1 (상승 ~ 하강)
  dtSec: 1/60
});
```

### 3. 입수/귀선

```typescript
// 입수
game.dispatch({ type: 'ENTER_WATER' });

// 귀선
game.dispatch({ type: 'RETURN_TO_SHIP' });
```

### 4. 포획/관찰

```typescript
// 포획 시도
game.dispatch({
  type: 'CATCH_ATTEMPT',
  specimenId: 'spec_123',    // 포획할 생물 UID
  distanceM: 5               // 거리 (m)
});

// 관찰
game.dispatch({
  type: 'OBSERVE_CREATURE',
  specimenId: 'spec_123'     // 관찰할 생물 UID
});
```

### 5. 경제

```typescript
// 전체 판매 (항구 근처에서만)
game.dispatch({ type: 'SELL_ALL' });

// 장비 구매
game.dispatch({
  type: 'BUY_ITEM',
  itemType: 'harpoon',  // 'harpoon' | 'tank' | 'suit'
  itemId: 2             // 장비 ID
});

// 장비 장착
game.dispatch({
  type: 'EQUIP_ITEM',
  itemType: 'harpoon',
  itemId: 2
});

// 선박 업그레이드
game.dispatch({ type: 'UPGRADE_SHIP' });
```

### 6. 유랑 상인

```typescript
// 유랑 상인에게 구매
game.dispatch({
  type: 'MERCHANT_BUY',
  itemIndex: 0    // 상인 인벤토리 인덱스
});
```

### 7. 화석/보스

```typescript
// 화석 수집
game.dispatch({
  type: 'COLLECT_FOSSIL',
  fossilId: 1
});

// 보스 소환
game.dispatch({
  type: 'SUMMON_BOSS',
  bossId: 'dunkleosteus'
});

// 보스 공격
game.dispatch({
  type: 'ATTACK_BOSS',
  damage: 100
});
```

### 8. 동료

```typescript
// 동료 영입
game.dispatch({
  type: 'RECRUIT_COMPANION',
  companionId: 'mia'
});
```

---

## 🎨 A팀 렌더링 가이드

### 1. SessionAAdapter 사용

```typescript
import { adaptForSessionA } from './systems/SessionAAdapter';

const state = game.getSnapshot();
const adapted = adaptForSessionA(state);

// adapted.ship: 선박 렌더링 데이터
// adapted.diver: 잠수부 렌더링 데이터
// adapted.creatures: 생물 렌더링 데이터
// adapted.weather: 날씨 렌더링 데이터
// adapted.world: 월드 정보
```

### 2. 생물 렌더링

```typescript
// 각 생물마다
for (const creature of adapted.creatures) {
  // 위치
  const position = new THREE.Vector3(
    creature.position.x,
    creature.position.y,
    creature.position.z
  );
  
  // 크기 (길이 기반)
  const scale = creature.lengthCm / 100; // cm → m
  
  // 종별 모델 선택
  const model = getCreatureModel(creature.speciesId);
  model.position.copy(position);
  model.scale.setScalar(scale);
  
  // 행동 상태에 따른 애니메이션
  switch (creature.behaviorState) {
    case 'patrol':
      playAnimation('swim_normal');
      break;
    case 'flee':
      playAnimation('swim_fast');
      break;
    case 'chase':
      playAnimation('swim_fast');
      break;
    case 'ambush_wait':
      playAnimation('idle');
      break;
    case 'ambush_strike':
      playAnimation('attack');
      break;
    case 'rest':
      playAnimation('idle');
      break;
    case 'school_follow':
      playAnimation('swim_school');
      break;
  }
  
  scene.add(model);
}
```

### 3. 200종 생물 데이터

각 종의 상세 정보는 `src/data/species.ts`에 있습니다:

```typescript
import { SPECIES_BY_ID } from './data/species';

const species = SPECIES_BY_ID.get(speciesId);

// 종 정보
species.name              // 한국어 이름
species.scientificName    // 학명
species.region            // 해역
species.avgLengthCm       // 평균 길이 (cm)
species.avgWeightKg       // 평균 무게 (kg)
species.behaviors         // 행동 패턴 배열
species.habitat           // 서식지 배열
species.activityPattern   // 활동 시간대
species.swimSpeed         // 수영 속도 {slow, normal, fast}
```

### 4. 3D 시각 메타데이터

각 종의 3D 렌더링 정보는 `src/data/CreatureVisuals.ts`에 있습니다:

```typescript
import { getVisualData } from './data/CreatureVisuals';

const visual = getVisualData(speciesId);

// 시각 정보
visual.bodyShape        // 몸 형태
visual.primaryColor     // 주 색상 (HEX)
visual.secondaryColor   // 보조 색상 (HEX)
visual.pattern          // 패턴 (solid, striped, spotted 등)
visual.finType          // 지느러미 타입
visual.tailType         // 꼬리 타입
visual.specialFeatures  // 특수 기능 배열
visual.sizeCategory     // 크기 카테고리
visual.swimmingStyle    // 수영 스타일
visual.animationHints   // 애니메이션 힌트 배열
visual.modelPriority    // 모델 제작 우선순위 (1-5)
visual.lodDistance      // LOD 거리 {high, medium, low}
```

---

## 🗺️ 월드 정보

### 해역 6개

```typescript
import { WORLD_CONFIG } from './data/world';

// 월드 크기: 4800m × 3200m
// 시작 위치: (755, 0, 1780)

// 해역 경계
WORLD_CONFIG.regions = {
  tropical: { xMin: 0, xMax: 1600, zMin: 0, zMax: 1600 },
  mangrove: { xMin: 1600, xMax: 3200, zMin: 0, zMax: 1600 },
  glacier: { xMin: 3200, xMax: 4800, zMin: 0, zMax: 1600 },
  ocean: { xMin: 0, xMax: 2400, zMin: 1600, zMax: 3200 },
  volcanic: { xMin: 2400, xMax: 4800, zMin: 1600, zMax: 2400 },
  deepsea: { xMin: 2400, xMax: 4800, zMin: 2400, zMax: 3200 }
};
```

### 섬 12개

```typescript
import { ISLANDS } from './data/world';

// 각 섬 정보
ISLANDS.forEach(island => {
  island.id           // 섬 ID
  island.name         // 이름
  island.region       // 해역
  island.x            // X 위치
  island.y            // Y 위치 (Z 좌표)
  island.hasPort      // 항구 여부
  island.hasShop      // 상점 여부
  island.hasDock      // 부두 여부
});
```

### 탐사지 24개

```typescript
import { DIVE_SITES } from './data/world';

// 각 탐사지 정보
DIVE_SITES.forEach(site => {
  site.id              // 탐사지 ID
  site.name            // 이름
  site.region          // 해역
  site.x               // X 위치
  site.z               // Z 위치
  site.depthMinM       // 최소 수심 (m)
  site.depthMaxM       // 최대 수심 (m)
  site.environment     // 환경 유형
  site.riskLevel       // 위험도 (1-5)
  site.possibleSpecies // 출현 가능 종 ID 목록
});
```

---

## ⚡ 성능 최적화

### LOD 시스템

```typescript
import { PerformanceOptimizer } from './systems/PerformanceOptimizer';

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

## 🧪 테스트

### 브라우저 콘솔에서 테스트 실행

```typescript
import { runAllTests } from './tests/gameEngine.test';
import { runIntegrationTests } from './tests/integration.test';

// 유닛 테스트
const unitResults = runAllTests();
console.log('유닛 테스트:', unitResults);

// 통합 테스트
const integrationResults = runIntegrationTests();
console.log('통합 테스트:', integrationResults);
```

### 테스트 결과 확인

- ✅ 200종 데이터 로딩
- ✅ 학명/ID 중복 검사
- ✅ 길이/무게 생성 검사
- ✅ 체장-체중 계산
- ✅ 최대 길이 초과 검사
- ✅ 포획 가능 여부
- ✅ 장비 구매
- ✅ 창고 용량
- ✅ 도감 기록
- ✅ 화석 수집
- ✅ 저장/불러오기
- ✅ 시드 재현
- ✅ 섬 개수 (12개)
- ✅ 탐사지 개수 (24개)
- ✅ 어류 200종
- ✅ 3D 시각 데이터

---

## 📋 체크리스트

### 필수 구현 사항

- [ ] MockGame을 실제 GameEngine으로 교체
- [ ] SessionAAdapter를 사용한 데이터 변환
- [ ] 200종 생물 3D 모델 제작
- [ ] 선박 5단계 모델
- [ ] 잠수사 캐릭터
- [ ] 수중 환경 (포그, 기포, 산호초)
- [ ] LOD 시스템 적용
- [ ] 인스턴싱 적용
- [ ] 날씨 효과
- [ ] 시간대별 조명

### 선택적 구현 사항

- [ ] 생체 발광 효과 (심해어)
- [ ] 군집 행동 애니메이션
- [ ] 물 쉐이더
- [ ] 빛 줄기 (God rays)
- [ ] 환경 사운드

---

## 🎯 최종 목표

**하우투 피쉬 ~ 서브노티카 사이의 그래픽 품질**

- 로우폴리 스타일 유지
- 실제 생태계 반영
- 부드러운 애니메이션
- 몰입감 있는 수중 환경
- 최적화된 성능

---

## 📞 지원

질문이나 문제 발생 시:
1. `src/core/GameEngine.ts` 확인
2. `src/systems/SessionAAdapter.ts` 확인
3. `src/data/species.ts`에서 종 데이터 확인
4. `src/data/CreatureVisuals.ts`에서 시각 데이터 확인

---

**버전**: 3.2.0  
**상태**: ✅ B팀 개발 완료, A팀 통합 준비 완료  
**최종 업데이트**: 2024
