// SpearPals: Blue Harbor — 브랜드/UI 계약 테스트 (세션 B)
// 이름·라벨·메뉴 6개·탭 4개·저장 키 마이그레이션이 확정안과 일치하는지 검증한다.
import { describe, it, expect } from 'vitest';
import { createGame } from '../../src/core/GameEngine.js';
import {
  GAME_TITLE, GAME_SUBTITLE, GAME_FULL_TITLE, SAVE_KEY, LEGACY_SAVE_KEYS,
  ZONE_NAMES, WEATHER_LABELS, SEASON_LABELS, timeOfDayLabel,
  HARBOR_MENU, UPGRADE_TABS, CODEX_FILTERS, RARITY_LABELS, PROMPT, CURRENCY,
} from '../../src/data/brand.js';
import { ZONES } from '../../src/data/species.js';

describe('SpearPals: Blue Harbor — 브랜드 계약', () => {
  it('정식 제목은 SpearPals: Blue Harbor', () => {
    expect(GAME_TITLE).toBe('SpearPals');
    expect(GAME_SUBTITLE).toBe('Blue Harbor');
    expect(GAME_FULL_TITLE).toBe('SpearPals: Blue Harbor');
  });

  it('해역 표시명은 영어권 읽기 쉬운 이름, 내부 키는 world/species와 동일', () => {
    expect(Object.keys(ZONE_NAMES).sort()).toEqual(Object.keys(ZONES).sort());
    expect(ZONE_NAMES.tropical.en).toBe('Tropical Reef');
    expect(ZONE_NAMES.deep_sea.en).toBe('Deep Ravine');
    for (const z of Object.values(ZONE_NAMES)) {
      expect(z.en).toMatch(/^[A-Za-z ]+$/); // 라틴 문자만 — 영문 HUD 안전
      expect(z.ko).toBeTruthy();
    }
  });

  it('날씨 라벨에 폭풍(storm)은 공포 톤 대신 Windy로 표기', () => {
    expect(Object.keys(WEATHER_LABELS)).toContain('storm');
    expect(WEATHER_LABELS.storm.en).toBe('Windy');
    for (const w of Object.values(SEASON_LABELS)) expect(w.icon).toBeTruthy();
    expect(timeOfDayLabel(8).en).toBe('Morning');
    expect(timeOfDayLabel(23).en).toBe('Night');
  });

  it('항구 허브 메뉴 6개 고정: Shop/Sell Catch/Upgrades/Codex/Map/Rest·Save', () => {
    expect(HARBOR_MENU.map(m => m.id)).toEqual(['shop', 'sell', 'upgrades', 'codex', 'map', 'rest']);
    expect(HARBOR_MENU.map(m => m.en)).toEqual(['Shop', 'Sell Catch', 'Upgrades', 'Codex', 'Map', 'Rest / Save']);
    for (const m of HARBOR_MENU) expect(m.icon && m.desc).toBeTruthy();
  });

  it('업그레이드 탭 4종: Harpoon/Oxygen/Suit/Boat + 도감 필터 5종', () => {
    expect(UPGRADE_TABS.map(t => t.en)).toEqual(['Harpoon', 'Oxygen', 'Suit', 'Boat']);
    expect(CODEX_FILTERS.map(f => f.id)).toEqual(['all', 'caught', 'observed', 'rare', 'region']);
  });

  it('Observe/Spear 프롬프트와 희귀도 라벨(빨강·공어 어휘 금지)', () => {
    expect(PROMPT.observe.en).toBe('Observe');
    expect(PROMPT.spear.en).toBe('Spear');
    expect(PROMPT.protectedNote.en).toContain('Friend');
    expect(Object.keys(RARITY_LABELS)).toEqual(['1', '2', '3', '4', '5']);
    const words = JSON.stringify([WEATHER_LABELS, RARITY_LABELS, PROMPT]).toLowerCase();
    for (const scary of ['terror', 'horror', 'deadly', 'monster']) expect(words).not.toContain(scary);
    expect(CURRENCY.en).toBe('Shells');
  });
});

describe('SpearPals 저장 키 마이그레이션', () => {
  function memStorage(init = {}) {
    const map = new Map(Object.entries(init));
    return {
      getItem: k => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, v),
      removeItem: k => map.delete(k),
      _dump: () => Object.fromEntries(map),
    };
  }

  it('신규 저장은 spearpals.save 키에 game:"spearpals" 메타와 함께 기록', () => {
    const storage = memStorage();
    const game = createGame({ seed: 7, storage });
    game.dispatch({ type: 'ENTER_WATER' });
    expect(game.dispatch({ type: 'CATCH_ATTEMPT', specimenId: 'fish_001_12', distanceM: 3 }).ok).toBe(true);
    const r = game.save();
    expect(r.ok).toBe(true);
    const raw = storage.getItem(SAVE_KEY);
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw);
    expect(data.game).toBe('spearpals');
    expect(storage.getItem('oceangaia.save')).toBe(null);
  });

  it('구 버전 oceangaia.save 저장본을 load하면 spearpals.save로 승격되고 구 키는 삭제', () => {
    const src = createGame({ seed: 99 });
    src.dispatch({ type: 'ENTER_WATER' });
    expect(src.dispatch({ type: 'CATCH_ATTEMPT', specimenId: 'fish_001_12', distanceM: 3 }).ok).toBe(true);
    // 구 엔진과 동일한 형태의 저장 데이터 생성
    const legacyData = JSON.stringify({
      version: '3.2.0', seed: 99,
      state: JSON.parse(JSON.stringify({ ...src._state, rngState: src._rng.getState() })),
    });
    const storage = memStorage({ 'oceangaia.save': legacyData });
    const game = createGame({ seed: 1, storage });
    const r = game.load();
    expect(r.ok).toBe(true);
    expect(r.migrated).toBe(true);
    expect(game.getSnapshot().inventoryCount).toBe(1); // 구 저장 상태 복원 확인
    expect(storage.getItem(SAVE_KEY)).toBeTruthy();     // 신 키 승격
    expect(storage.getItem('oceangaia.save')).toBe(null); // 구 키 정리
    // 재로드(2차)는 마이그레이션 없이 정상 동작
    const g2 = createGame({ seed: 1, storage });
    expect(g2.load().migrated).toBeFalsy();
  });

  it('LEGACY_SAVE_KEYS에 oceangaia.save 포함', () => {
    expect(LEGACY_SAVE_KEYS).toContain('oceangaia.save');
  });
});
