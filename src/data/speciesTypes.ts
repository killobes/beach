/**
 * OCEAN GAIA V3.2 — 종( species ) 타입 정의 및 검증 상태 계약
 */

export type VerificationStatus =
  | "VERIFIED" // 실측 근거(출처 링크/자료) 확인됨
  | "GAME_ESTIMATE" // 게임용 추정값 (실측 미확인)
  | "UNKNOWN" // 자료 없음
  | "RECHECK_REQUIRED"; // 자료 충돌 — 측정기준(Fl/TL 등) 재확인 필요

export type LengthMeasureType = "TL" | "FL" | "SL" | "TOTAL" | "UNKNOWN";

export type ZoneId =
  | "tropical"
  | "glacial"
  | "volcanic"
  | "mangrove"
  | "oceanic"
  | "abyssal";

export type BehaviorPattern =
  | "SOLO"
  | "SCHOOLING"
  | "FLEEING_PRONE"
  | "AMBUSH"
  | "BENTHIC_REST"
  | "PELFOLLOWER" // 먹이 추적
  | "NOCTURNAL"
  | "VERTICAL_MIGRATION"
  | "TERRITORIAL"
  | "MIGRATORY"
  | "FILTER_FEEDING"
  | "DEEP_DIURNAL";

export type ActivityTime = "DIURNAL" | "NOCTURNAL" | "CREPUSCULAR" | "ANY";

export interface SpeciesLengthWeight {
  /** 실측 평균 길이 cm (미확인 시 null, VERIFIED 아님) */
  measuredAvgLengthCm: number | null;
  /** 실측 평균 무게 kg (미확인 시 null) */
  measuredAvgMassKg: number | null;
  /** 보고 최대 길이 cm */
  reportedMaxLengthCm: number;
  /** 게임 기준 길이 cm (생성 분포의 평균) */
  gameBaseLengthCm: number;
  /** 게임 기준 무게 kg */
  gameBaseMassKg: number;
  /** 게임 생성 최소 길이 cm */
  gameMinLengthCm: number;
  /** 게임 생성 최대 길이 cm */
  gameMaxLengthCm: number;
  /** 길이 측정 유형 */
  lengthMeasure: LengthMeasureType;
}

/**
 * 체장–체중 관계식 W = a * L^b
 * unit 이 "cm-g" 이면 계산 결과 g → kg 변환(b*1000) 적용.
 */
export interface LengthWeightRelation {
  a: number;
  b: number;
  unit: "cm-kg" | "cm-g" | "GAME_FIT";
  source: string;
  verified: boolean; // false 이면 게임 밸런스 피팅값 (생물학적 사실 아님)
}

export interface HabitatData {
  zone: ZoneId;
  depthMinM: number;
  depthMaxM: number;
  substrate: "CORAL" | "ROCK" | "SAND" | "MUD" | "KELP" | "OPEN_WATER" | "VENT" | "ICE" | "TRENCH";
  temperatureC: [number, number];
  behaviors: BehaviorPattern[];
  activity: ActivityTime;
  schoolSize: [number, number]; // [min, max] 개체 수
  swimSpeedMs: number; // m/s (게임용)
}

export interface EconomicData {
  baseValueShells: number; // 1kg당 기본 조개 값
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  protectedSpecies: boolean; // true → 일반 판매 불가(관찰 전용)
  catchable: boolean; // 작살 포획 가능 여부
}

export interface Species extends SpeciesLengthWeight {
  id: number; // 1..200 고정
  scientificName: string;
  nameKo: string;
  nameEn: string;
  extinct: boolean;
  relation: LengthWeightRelation;
  habitat: HabitatData;
  economy: EconomicData;
  verification: VerificationStatus;
  source: string; // 검증 출처 (없으면 "")
  spawnConditions?: Partial<SpawnConditionRule>;
}

export interface SpawnConditionRule {
  time: ActivityTime;
  weather: ("CLEAR" | "CLOUDY" | "RAIN" | "STORM" | "SNOW" | "FOG")[];
  season: ("SPRING" | "SUMMER" | "AUTUMN" | "WINTER")[];
  minVisibility: number; // 0~1
  requiredDiveTier: number; // 잠수 장비 티어 (0 = 기본)
  requiredShipTier: number; // 선박 단계 (1~5)
}
