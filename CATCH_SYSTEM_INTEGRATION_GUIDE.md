# 🎯 OCEAN GAIA V3.2 — 포획 시스템 통합 가이드 (최신)

## ⚠️ 핵심 변경사항

### 개체 ID 형식 변경
```typescript
// ❌ 이전 형식 (불안정)
`spec_${counter}_${Date.now()}`

// ✅ 새로운 형식 (안정적)
`fish_{speciesId}_{region}_{seq}`
// 예: fish_1_tropical_001, fish_45_glacier_042
```

### 세션 A/B ID 불일치 문제 해결
이제 세션 A와 세션 B 모두 **동일한 ID 형식**을 사용합니다.

---

## 🔧 세션 A 통합 방법

### 1단계: GameEngine 초기화

```typescript
import { createGame } from './core/GameEngine';

const game = createGame({ seed: 12345 });
```

### 2단계: 주변 개체 조회 (새로운 API)

```typescript
// 잠수부 위치에서 50m 반경 내 개체 조회
const diverPos = game.getDiverPosition();
if (diverPos) {
  const nearbyCreatures = game.getNearbySpecimens(
    diverPos.x, 
    diverPos.z, 
    50 // 반경 (m)
  );
  
  // 결과: 거리순으로 정렬된 개체 목록
  nearbyCreatures.forEach(creature => {
    console.log(`${creature.uid}: ${creature.distance.toFixed(1)}m`);
    // fish_1_tropical_001: 3.5m
    // fish_45_glacier_042: 12.8m
  });
}
```

### 3단계: 포획 실행

```typescript
// 방법 1: 거리 자동 계산 (권장)
const catchResult = game.dispatch({
  type: 'CATCH_ATTEMPT',
  specimenId: 'fish_1_tropical_001'
  // distanceM 생략 시 자동 계산
});

// 방법 2: 거리 수동 지정
const catchResult = game.dispatch({
  type: 'CATCH_ATTEMPT',
  specimenId: 'fish_1_tropical_001',
  distanceM: 3.5 // 미터
});

// 결과 처리
if (catchResult.success) {
  console.log('포획 성공!');
  console.log('종:', catchResult.data.species);
  console.log('크기:', catchResult.data.length, 'cm');
  console.log('무게:', catchResult.data.weight, 'kg');
  console.log('가치:', catchResult.data.value, '조개');
  console.log('성공률:', (catchResult.data.catchProb * 100).toFixed(1) + '%');
} else {
  console.log('포획 실패:', catchResult.reason);
}
```

### 4단계: 개체 정보 조회

```typescript
// ID로 개체 정보 가져오기
const specimen = game.getSpecimenById('fish_1_tropical_001');
if (specimen) {
  console.log('종 ID:', specimen.speciesId);
  console.log('위치:', specimen.x, specimen.z);
  console.log('수심:', specimen.depthM, 'm');
  console.log('크기:', specimen.lengthCm, 'cm');
  console.log('행동:', specimen.behaviorState);
}
```

### 5단계: 거리 계산

```typescript
// 두 지점 간 거리 계산
const distance = game.calculateDistance(
  diverPos.x, diverPos.z,
  specimen.x, specimen.z
);
console.log('거리:', distance.toFixed(1), 'm');
```

---

## 🎮 완전한 포획 루프 예제

```typescript
import { createGame } from './core/GameEngine';

const game = createGame({ seed: 12345 });

// 게임 루프
function gameLoop(deltaTime: number) {
  // 1. 게임 상태 업데이트
  game.dispatch({ type: 'TICK', dtSec: deltaTime });
  
  // 2. 잠수 상태 확인
  const diverPos = game.getDiverPosition();
  if (!diverPos) return; // 수중이 아니면 스킵
  
  // 3. 주변 개체 조회
  const nearbyCreatures = game.getNearbySpecimens(diverPos.x, diverPos.z, 50);
  if (nearbyCreatures.length === 0) return;
  
  // 4. 가장 가까운 개체 선택
  const target = nearbyCreatures[0];
  
  // 5. 포획 시도
  const catchResult = game.dispatch({
    type: 'CATCH_ATTEMPT',
    specimenId: target.uid
  });
  
  // 6. 결과 처리
  if (catchResult.success) {
    console.log(`✅ ${catchResult.data.species} 포획 성공!`);
    console.log(`   크기: ${catchResult.data.length}cm, 무게: ${catchResult.data.weight}kg`);
    console.log(`   가치: ${catchResult.data.value} 조개`);
    
    // 7. 귀선 및 판매
    game.dispatch({ type: 'RETURN_TO_SHIP' });
    const sellResult = game.dispatch({ type: 'SELL_ALL' });
    
    if (sellResult.success) {
      console.log(`💰 판매 완료: ${sellResult.data.totalEarned} 조개`);
      
      // 8. 업그레이드 시도
      const upgradeResult = game.dispatch({ type: 'UPGRADE_SHIP' });
      if (upgradeResult.success) {
        console.log(`⬆️ 선박 업그레이드: Lv.${upgradeResult.data.newLevel}`);
      }
    }
  } else {
    console.log(`❌ 포획 실패: ${catchResult.reason}`);
  }
}
```

---

## 📊 포획 시스템 체크리스트

### ✅ 구현된 기능
- [x] 개체 ID 형식 통일 (`fish_{speciesId}_{region}_{seq}`)
- [x] 거리 자동 계산
- [x] 수심 기반 포획 제한
- [x] 보호종 포획 차단
- [x] 화물 공간 체크
- [x] 작살 사거리 체크
- [x] 포획 확률 계산 (작살, 거리, 수심, 희귀도, 동료, 날씨)
- [x] 도감 자동 업데이트
- [x] 주변 개체 조회 API
- [x] 개체 정보 조회 API

### ✅ 세션 A 호환
- [x] `getNearbySpecimens(x, z, radius)` - 주변 개체 조회
- [x] `getSpecimenById(uid)` - ID로 개체 정보
- [x] `calculateDistance(x1, z1, x2, z2)` - 거리 계산
- [x] `getDiverPosition()` - 잠수부 위치
- [x] `getShipPosition()` - 선박 위치

### ✅ 테스트 완료
- [x] 개체 ID 형식 검증
- [x] 기본 포획 흐름
- [x] 거리 체크
- [x] 보호종 체크
- [x] 화물 공간 체크
- [x] 수심 제한 체크
- [x] 성공/실패 처리
- [x] 도감 업데이트
- [x] 포획-판매-업그레이드 루프
- [x] 주변 개체 조회 API

---

## 🐛 일반적인 문제 해결

### 문제 1: "개체를 찾을 수 없습니다"
```typescript
// ❌ 잘못된 ID 형식
game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: 'spec_123' });

// ✅ 올바른 ID 형식
game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: 'fish_1_tropical_001' });

// ✅ 주변 개체 조회 후 ID 사용
const nearby = game.getNearbySpecimens(x, z, 50);
if (nearby.length > 0) {
  game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: nearby[0].uid });
}
```

### 문제 2: "사거리 부족"
```typescript
// ✅ 거리 확인
const distance = game.calculateDistance(diverX, diverZ, specimenX, specimenZ);
console.log('거리:', distance, 'm');

// ✅ 가까운 개체만 선택
const nearby = game.getNearbySpecimens(diverX, diverZ, 5); // 5m 반경
```

### 문제 3: "수심 제한 초과"
```typescript
// ✅ 현재 장비의 최대 수심 확인
const snapshot = game.getSnapshot();
const tank = TANKS.find(t => t.id === snapshot.equippedTank);
const suit = SUITS.find(s => s.id === snapshot.equippedSuit);
const maxDepth = Math.min(tank.maxDepth, suit.maxDepth);

console.log('최대 수심:', maxDepth, 'm');

// ✅ 수심 제한 내 개체만 선택
const nearby = game.getNearbySpecimens(diverX, diverZ, 50);
const catchable = nearby.filter(c => c.depthM <= maxDepth);
```

### 문제 4: "보호종은 포획할 수 없습니다"
```typescript
// ✅ 보호종 확인
const species = SPECIES_BY_ID.get(specimen.speciesId);
if (species.protected) {
  console.log('보호종입니다. 관찰만 가능합니다.');
  game.dispatch({ type: 'OBSERVE_CREATURE', specimenId: specimen.uid });
}
```

---

## 🎯 세션 A 통합 코드

### SceneManager.ts 수정 예제

```typescript
import { createGame } from '../core/GameEngine';
import { SPECIES_BY_ID } from '../data/species';

class SceneManager {
  private game: ReturnType<typeof createGame>;
  
  constructor() {
    this.game = createGame({ seed: 12345 });
  }
  
  update(deltaTime: number) {
    // 게임 상태 업데이트
    this.game.dispatch({ type: 'TICK', dtSec: deltaTime });
    
    // 잠수 상태 확인
    const diverPos = this.game.getDiverPosition();
    if (!diverPos) return;
    
    // 주변 개체 조회
    const nearby = this.game.getNearbySpecimens(diverPos.x, diverPos.z, 50);
    
    // 개체 렌더링
    nearby.forEach(creature => {
      const species = SPECIES_BY_ID.get(creature.speciesId);
      const model = this.getCreatureModel(creature.speciesId);
      
      // 위치 설정
      model.position.set(creature.x, -creature.depthM, creature.z);
      
      // 크기 설정
      const scale = creature.lengthCm / 100;
      model.scale.set(scale, scale, scale);
      
      // 행동 애니메이션
      this.animateCreature(model, creature.behaviorState);
    });
  }
  
  onHarpoonFire() {
    // 잠수부 위치 확인
    const diverPos = this.game.getDiverPosition();
    if (!diverPos) return;
    
    // 가장 가까운 개체 찾기
    const nearby = this.game.getNearbySpecimens(diverPos.x, diverPos.z, 50);
    if (nearby.length === 0) {
      console.log('주변에 개체가 없습니다');
      return;
    }
    
    const target = nearby[0];
    
    // 포획 시도
    const result = this.game.dispatch({
      type: 'CATCH_ATTEMPT',
      specimenId: target.uid
    });
    
    if (result.success) {
      console.log(`✅ ${result.data.species} 포획 성공!`);
      this.playCatchAnimation(target);
    } else {
      console.log(`❌ 포획 실패: ${result.reason}`);
      this.playMissAnimation();
    }
  }
}
```

---

## 📝 요약

### 핵심 변경사항
1. **ID 형식 통일**: `fish_{speciesId}_{region}_{seq}`
2. **거리 자동 계산**: `distanceM` 생략 가능
3. **수심 제한**: 장비 기반 수심 체크
4. **새로운 API**: `getNearbySpecimens`, `getSpecimenById`, `calculateDistance`

### 세션 A가 할 일
1. MockGame → GameEngine 교체
2. 새로운 ID 형식 사용
3. `getNearbySpecimens` API 활용
4. 포획 시 거리 자동 계산 사용

### 테스트
```bash
# 포획 시스템 테스트 실행
npm run test -- catchSystem.test.ts
```

---

**버전**: 3.2.1 (포획 시스템 개선)  
**상태**: ✅ 포획 시스템 완성, 세션 A 통합 준비 완료
