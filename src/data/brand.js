// SpearPals: Blue Harbor — 브랜드 & UI 텍스트 계약 (세션 B)
// OCEAN GAIA V3.2 → SpearPals 리브랜딩 (2026-10-19 확정)
// 규칙: 게임 로직은 영어 키(zone/weather 등)를 유지하고, 표시 이름만 여기서 관리한다.
// 세션 A(3D/HUD)도 이 파일을 import해 같은 이름을 사용할 것.

export const GAME_TITLE = 'SpearPals';
export const GAME_SUBTITLE = 'Blue Harbor';
export const GAME_FULL_TITLE = `${GAME_TITLE}: ${GAME_SUBTITLE}`;
export const TAGLINE = '귀엽고 둥근 바다 탐험 — 항구 장난감 가게 느낌의 밝은 탐험 인터페이스';

// 저장 키 (구 oceangaia.save → 마이그레이션 지원)
export const SAVE_KEY = 'spearpals.save';
export const LEGACY_SAVE_KEYS = ['oceangaia.save'];

// 6개 해역 표시명 (영어권 전달 우선, 내부 키는 기존 world/species와 동일 유지)
export const ZONE_NAMES = Object.freeze({
  tropical:    { en: 'Tropical Reef',   ko: '열대 산호해' },
  mangrove:    { en: 'Muddy Estuary',   ko: '탁한 하구해' },
  glacier:     { en: 'Frigid Shelf',    ko: '한랭 대륙붕' },
  volcanic:    { en: 'Volcanic Shallows', ko: '화산 열수해' },
  open_ocean:  { en: 'Open Sea',        ko: '대양 난류해' },
  deep_sea:    { en: 'Deep Ravine',     ko: '심해 협곡' },
});

// 날씨 표시 라벨 + 귀여운 이모지 (폭풍도 공포가 아닌 주황 경고 톤)
export const WEATHER_LABELS = Object.freeze({
  clear:  { en: 'Clear',  ko: '맑음',  icon: '☀️' },
  cloudy: { en: 'Cloudy', ko: '흐림',  icon: '⛅' },
  rain:   { en: 'Rainy',  ko: '비',    icon: '🌦️' },
  storm:  { en: 'Windy',  ko: '바람 강함', icon: '🌀' },
  snow:   { en: 'Snowy',  ko: '눈',    icon: '❄️' },
  fog:    { en: 'Foggy',  ko: '안개',  icon: '🌫️' },
});

export const SEASON_LABELS = Object.freeze({
  spring: { en: 'Spring', ko: '봄', icon: '🌸' },
  summer: { en: 'Summer', ko: '여름', icon: '🏖️' },
  autumn: { en: 'Autumn', ko: '가을', icon: '🍂' },
  winter: { en: 'Winter', ko: '겨울', icon: '⛄' },
});

// 시간대 라벨 (HUD용 짧은 텍스트)
export function timeOfDayLabel(hour) {
  if (hour < 5) return { en: 'Night', ko: '밤', icon: '🌙' };
  if (hour < 11) return { en: 'Morning', ko: '아침', icon: '🌅' };
  if (hour < 17) return { en: 'Afternoon', ko: '낮', icon: '☀️' };
  if (hour < 20) return { en: 'Evening', ko: '저녁', icon: '🌇' };
  return { en: 'Night', ko: '밤', icon: '🌙' };
}

// 항구 허브 메뉴 6개 고정 (UI 핵심 6타일)
export const HARBOR_MENU = Object.freeze([
  { id: 'shop',      en: 'Shop',         ko: '상점',   icon: '🛒', desc: '작살·장비를 구매해요' },
  { id: 'sell',      en: 'Sell Catch',   ko: '판매',   icon: '🐚', desc: '잡은 물고기를 팔아요' },
  { id: 'upgrades',  en: 'Upgrades',     ko: '강화',   icon: '⚓', desc: '장비와 배를 키워요' },
  { id: 'codex',     en: 'Codex',        ko: '도감',   icon: '📖', desc: '물고기 수집 기록' },
  { id: 'map',       en: 'Map',          ko: '지도',   icon: '🗺️', desc: '해역과 섬을 봐요' },
  { id: 'rest',      en: 'Rest / Save',  ko: '휴식·저장', icon: '🛟', desc: '잠들면 자동 저장돼요' },
]);

// 업그레이드 탭 4개
export const UPGRADE_TABS = Object.freeze([
  { id: 'spear', en: 'Harpoon', ko: '작살', icon: '🔱' },
  { id: 'tank',  en: 'Oxygen',  ko: '산소', icon: '🫧' },
  { id: 'suit',  en: 'Suit',    ko: '잠수복', icon: '🩱' },
  { id: 'boat',  en: 'Boat',    ko: '배',   icon: '⛵' },
]);

// 도감 필터
export const CODEX_FILTERS = Object.freeze([
  { id: 'all',      en: 'All',      ko: '전체' },
  { id: 'caught',   en: 'Caught',   ko: '포획' },
  { id: 'observed', en: 'Observed', ko: '관찰' },
  { id: 'rare',     en: 'Rare',     ko: '희귀' },
  { id: 'region',   en: 'Region',   ko: '해역' },
]);

// 희귀도 → 별 + 친근 라벨 (빨강 금지, 산호~주황 계열로 표현)
export const RARITY_LABELS = Object.freeze({
  1: { stars: '⭐',        en: 'Common',    ko: '흔함' },
  2: { stars: '⭐⭐',      en: 'Nice',      ko: '볼만함' },
  3: { stars: '⭐⭐⭐',    en: 'Special',   ko: '특별함' },
  4: { stars: '⭐⭐⭐⭐',  en: 'Rare',      ko: '희귀' },
  5: { stars: '⭐⭐⭐⭐⭐', en: 'Super Rare', ko: '초희귀' },
});

// 중앙 상호작용 프롬프트 (조준 시)
export const PROMPT = Object.freeze({
  observe: { en: 'Observe', ko: '관찰', key: 'F' },
  spear:   { en: 'Spear',   ko: '작살', key: 'Space' },
  protectedNote: { en: 'Friend! Only Observe 💛', ko: '친구예요! 관찰만 가능 💛' },
});

// 화폐 표기
export const CURRENCY = Object.freeze({ en: 'Shells', ko: '조개', icon: '🐚' });
