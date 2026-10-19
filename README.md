# 🐚 SpearPals: Blue Harbor
*귀엽고 둥근 바다 탐험 — 항구 장난감 가게 느낌의 밝은 탐험 인터페이스*

> 舊 OCEAN GAIA V3.2 → **SpearPals: Blue Harbor**로 리브랜딩 (2026-10-19 확정)

세션 B 저장소(beach): 시뮬레이션 엔진 · 200종 어류 데이터 · 경제 · 도감 · 장비 · 날씨 · 저장 시스템 전담.
Three.js 렌더링(세션 A / sea 저장소)과는 `createGame()` 계약으로만 연결된다.

## 브랜드 & UI 계약
- 모든 표시 텍스트/라벨은 `src/data/brand.js` 단일 소스. 세션 A도 같은 파일을 import할 것.
- 정식 제목: **SpearPals: Blue Harbor**
- 저장 키: `spearpals.save` (구 `oceangaia.save` 자동 마이그레이션)
- 항구 허브 메뉴 6개 고정: Shop · Sell Catch · Upgrades · Codex · Map · Rest/Save
- 업그레이드 탭 4개: Harpoon · Oxygen · Suit · Boat
- 색상 톤: 하늘색/민트/청록 + 샌드 베이지/산호, 강조 노랑·주황, 경고는 빨강 대신 주황~산호(공포 금지)

## 엔진 사용법
```js
import { createGame } from './src/core/GameEngine.js';
const game = createGame({ seed: 12345 });
game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 1 / 60 });
game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: 'fish_001_12', distanceM: 5 });
const snap = game.getSnapshot(); // JSON 직렬화 가능
game.save(); game.load();
```

단위 계약: 위치 m · 길이 cm · 무게 kg · 시간 s · 각도 rad. 월드 4800×3200m, 최대 수심 300m, 시작 좌표 (755, 0, 1780).

## 검증
```bash
npm test    # vitest — 엔진/시나리오/데이터 정합성/브랜드 계약 테스트
npm run build
```
