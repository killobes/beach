# OCEAN GAIA V3.2 — 세션 A ↔ 세션 B 통합 가이드

## 📋 개요

이 문서는 세션 A(3D 월드·렌더링)와 세션 B(게임 시스템)를 통합하는 방법을 설명합니다.

## 🔌 통합 인터페이스

### 세션 B가 제공하는 API

```typescript
import { createGame } from './core/GameEngine';

const game = createGame({
  seed: 12345,  // 재현 가능한 난수 시드
});

// 반환되는 객체
{
  dispatch(action: GameAction): GameActionResult,
  getSnapshot(): GameState,
  subscribe(callback: (state: GameState) => void): () => void,
  save(): GameActionResult,
  load(): GameActionResult,
}
```

### 핵심 데이터 구조

```typescript
interface GameState {
  version: string;           // '3.2.0'
  seed: number;              // 난수 시드
  tick: number;              // 프레임 카운터
  
  // 시간 시스템
  gameTimeSec: number;       // 총 게임 시간 (초)
  day: number;               // 현재 날짜
  hour: number;              // 현재 시간 (0-23)
  season: Season;            // 'spring' | 'summer' | 'autumn' | 'winter'
  weather: WeatherType;      // 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'snow'
  
  // 플레이어 상태
  shells: number;            // 재화
  shipLevel: number;         // 선박 레벨 (1-5)
  shipX: number;             // 선박 X 좌표 (m)
  shipZ: number;             // 선박 Z 좌표 (m)
  shipHeading: number;       // 선박 방향 (라디안)
  
  // 잠수 상태
  inWater: boolean;          // 수중 여부
  diverX: number;            // 잠수부 X (m)
  diverZ: number;            // 잠수부 Z (m)
  diverY: number;            // 잠수부 Y (m, 음수=수중)
  diverHeading: number;      // 잠수부 방향 (라디안)
  airRemaining: number;      // 산소량 (0-100%)
  
  // 생물 데이터
  activeSpecimens: Specimen[];  // 월드에 존재하는 생물
  
  // 도감
  codex: Record<number, CodexEntry>;  // 발견/포획 기록
}

interface Specimen {
  uid: string;               // 고유 ID
  speciesId: number;         // 종 ID (1-200)
  lengthCm: number;          // 길이 (cm)
  weightKg: number;          // 무게 (kg)
  depthM: number;            // 수심 (m)
  x: number;                 // X 좌표 (m)
  z: number;                 // Z 좌표 (m)
  behaviorState: string;     // 행동 상태
  spawnTime: number;         // 생성 시간
}
```

## 🎮 게임 루프 통합 예제

```typescript
// 세션 A의 메인 루프에서
import { createGame } from './core/GameEngine';

const game = createGame({ seed: 12345 });

// 상태 구독 (렌더링용)
game.subscribe((state) => {
  // Three.js 씬 업데이트
  updateShipPosition(state.shipX, state.shipZ, state.shipHeading);
  updateDiverPosition(state.diverX, state.diverY, state.diverZ, state.diverHeading);
  updateCreatures(state.activeSpecimens);
  updateWeather(state.weather, state.hour);
  updateUI(state);
});

// 게임 루프 (60fps)
function gameLoop(deltaTime: number) {
  // 1. 입력 처리
  const input = getInputState();
  
  // 2. 이동 액션
  if (state.inWater) {
    game.dispatch({
      type: 'MOVE_DIVER',
      forward: input.forward,
      turn: input.turn,
      vertical: input.vertical,
      dtSec: deltaTime,
    });
  } else {
    game.dispatch({
      type: 'MOVE_SHIP',
      forward: input.forward,
      turn: input.turn,
      dtSec: deltaTime,
    });
  }
  
  // 3. 게임 틱 (시간, 날씨, 생물 AI)
  game.dispatch({
    type: 'TICK',
    dtSec: deltaTime,
  });
  
  // 4. 렌더링 (subscribe 콜백에서 자동 처리)
}
```

## 🎯 주요 액션

### 이동
```typescript
// 선박 이동
game.dispatch({
  type: 'MOVE_SHIP',
  forward: 1,    // -1 ~ 1 (후진 ~ 전진)
  turn: 0,       // -1 ~ 1 (좌회전 ~ 우회전)
  dtSec: 1/60,   // 프레임 시간
});

// 잠수부 이동
game.dispatch({
  type: 'MOVE_DIVER',
  forward: 1,
  turn: 0,
  vertical: -1,  // -1 ~ 1 (상승 ~ 하강)
  dtSec: 1/60,
});
```

### 입수/귀선
```typescript
game.dispatch({ type: 'ENTER_WATER' });
game.dispatch({ type: 'RETURN_TO_SHIP' });
```

### 포획/관찰
```typescript
// 포획 시도
game.dispatch({
  type: 'CATCH_ATTEMPT',
  specimenId: 'spec_123_1234567890',  // Specimen.uid
  distanceM: 5,                        // 잠수부와 생물 간 거리
});

// 관찰
game.dispatch({
  type: 'OBSERVE_CREATURE',
  specimenId: 'spec_123_1234567890',
});
```

### 경제
```typescript
// 전체 판매 (항구 근처에서만)
game.dispatch({ type: 'SELL_ALL' });

// 장비 구매
game.dispatch({
  type: 'BUY_ITEM',
  itemType: 'harpoon',  // 'harpoon' | 'tank' | 'suit'
  itemId: 2,
});

// 선박 개조
game.dispatch({ type: 'UPGRADE_SHIP' });
```

## 🗺️ 월드 좌표계

```
월드 크기: 4800m × 3200m
해수면: Y = 0
Y축: 위쪽 (+Y = 하늘, -Y = 수중)
전방: +Z 방향

시작 위치:
  선박: (755, 0, 1780)
  
해역 배치:
  (0,0)────────────────(4800,0)
  │ 열대    │ 맹그로브 │ 빙하    │
  │         │          │         │
  │─────────┼──────────┼─────────│ (1600,1600)
  │ 대양    │ 화산     │ 심해    │
  │         │          │         │
  (0,3200)────────────────(4800,3200)
```

## 🐠 생물 렌더링 가이드

```typescript
// activeSpecimens를 Three.js로 렌더링
for (const spec of state.activeSpecimens) {
  const species = SPECIES_BY_ID.get(spec.speciesId);
  
  // 위치
  const position = new THREE.Vector3(spec.x, -spec.depthM, spec.z);
  
  // 크기 (길이 기반)
  const scale = spec.lengthCm / 100; // cm → m
  
  // 행동 상태에 따른 애니메이션
  switch (spec.behaviorState) {
    case 'patrol':
      // 일반적인 수영 애니메이션
      break;
    case 'flee':
      // 빠르게 도망치는 애니메이션
      break;
    case 'ambush_wait':
      // 정지 상태
      break;
    case 'school_follow':
      // 군무 애니메이션
      break;
  }
  
  // 종별 모델 선택
  const model = getCreatureModel(species.name);
  model.position.copy(position);
  model.scale.setScalar(scale);
  scene.add(model);
}
```

## 🌊 날씨 효과

```typescript
// 날씨에 따른 시각 효과
switch (state.weather) {
  case 'clear':
    // 맑은 하늘, 좋은 시야
    break;
  case 'rain':
    // 비 파티클, 약간 흐린 시야
    break;
  case 'storm':
    // 강한 비, 번개, 매우 흐린 시야
    break;
  case 'fog':
    // 안개 효과, 매우 낮은 시야
    break;
  case 'snow':
    // 눈 파티클 (빙하 지역)
    break;
}

// 시간대별 조명
const isNight = state.hour < 6 || state.hour > 18;
if (isNight) {
  // 어두운 조명, 달빛
} else {
  // 밝은 햇빛
}
```

## 💾 저장/불러오기

```typescript
// 저장
const result = game.save();
if (result.success) {
  console.log('저장 완료');
}

// 불러오기
const result = game.load();
if (result.success) {
  console.log('불러오기 완료');
  // Three.js 씬을 새 상태로 업데이트
}
```

## ⚠️ 주의사항

1. **단위 일관성**
   - 위치: 미터 (m)
   - 길이: 센티미터 (cm)
   - 무게: 킬로그램 (kg)
   - 시간: 초 (s)
   - 각도: 라디안 (rad)

2. **좌표계**
   - X: 좌우 (0 ~ 4800)
   - Y: 상하 (0 = 해수면, 음수 = 수중)
   - Z: 전후 (0 ~ 3200)

3. **성능**
   - `dispatch()`는 동기적으로 실행됨
   - `getSnapshot()`은 깊은 복사를 수행
   - 60fps 유지 필요 (16ms 이내)

4. **엣지 케이스**
   - 모든 위치는 자동으로 월드 경계로 클램핑됨
   - 산소가 0이 되면 자동으로 귀선
   - 보호종은 포획 불가

## 🧪 테스트

```typescript
import { runIntegrationTests } from './tests/integration.test';

const results = runIntegrationTests();
for (const result of results) {
  console.log(`${result.passed ? '✓' : '✗'} ${result.name}: ${result.message}`);
}
```

## 📞 문의

통합 문제 발생 시:
1. `getSnapshot()` 결과 확인
2. `dispatch()` 반환값 확인
3. 브라우저 콘솔 에러 로그 확인
4. 통합 테스트 실행

---

**버전**: 3.2.0  
**최종 업데이트**: 2024
