// OCEAN GAIA V3.2 — Game Engine Core
// 세션 B 소유 파일 — Three.js import 금지
// 세션 A는 이 모듈의 반환 인터페이스만 사용한다

import { SPECIES_DATA, SPECIES_BY_ID, type SpeciesData, type Region } from '../data/species';
import { HARPOONS, TANKS, SUITS, SHIP_UPGRADES, type HarpoonData, type TankData, type SuitData } from '../data/equipment';
import { WORLD_CONFIG, ISLANDS, COMPANIONS, BOSSES, FOSSILS, WEATHER_EFFECTS, type WeatherType, type Season, type CompanionData } from '../data/world';
import { CreatureBehaviorSystem, type CreatureState } from '../systems/CreatureBehavior';
import { SpawnSystem, DEFAULT_SPAWN_CONFIG } from '../systems/SpawnSystem';
import { EconomySystem, DEFAULT_ECONOMY_CONFIG } from '../systems/EconomySystem';
import { WeatherSystem } from '../systems/WeatherSystem';
import { validateState, sanitizeSnapshot, detectImpossibleState, ActionRateLimiter } from '../systems/ValidationSystem';
import { TravelingMerchantSystem, DEFAULT_MERCHANT_CONFIG, type MerchantState } from '../systems/TravelingMerchant';
import { IntroSystem } from '../systems/IntroSystem';
import { HomeBaseSystem, type HouseState } from '../systems/HomeBaseSystem';
import { validateAndAdjustSpeciesDepths } from '../data/SpeciesDepthValidator';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface Specimen {
  uid: string;
  speciesId: number;
  lengthCm: number;
  weightKg: number;
  depthM: number;
  x: number;
  z: number;
  behaviorState: string;
  spawnTime: number;
}

export interface CodexEntry {
  speciesId: number;
  firstDiscoverTime: number;
  firstCatchTime: number | null;
  catchCount: number;
  observeCount: number;
  maxLengthCm: number;
  maxWeightKg: number;
  maxLengthWeightKg: number;
  maxWeightLengthCm: number;
  discoveredRegions: Region[];
}

export interface GameState {
  version: string;
  seed: number;
  tick: number;
  gameTimeSec: number;
  day: number;
  hour: number; // 0-23
  season: Season;
  weather: WeatherType;
  weatherTimer: number;

  // Player
  shells: number;
  shipLevel: number;
  shipX: number;
  shipZ: number;
  shipHeading: number; // radians

  // Diver
  inWater: boolean;
  diverX: number;
  diverZ: number;
  diverY: number; // depth (negative = underwater)
  diverHeading: number;
  airRemaining: number;

  // Equipment
  equippedHarpoon: number;
  equippedTank: number;
  equippedSuit: number;
  ownedHarpoons: number[];
  ownedTanks: number[];
  ownedSuits: number[];

  // Inventory
  cargo: Specimen[];
  storage: Specimen[];

  // Codex
  codex: Record<number, CodexEntry>;

  // Companions
  companions: string[]; // companion ids

  // Fossils
  fossils: number[]; // fossil ids collected

  // Boss
  bossActive: string | null;
  bossHp: number;

  // World creatures (active specimens)
  activeSpecimens: Specimen[];

  // Traveling Merchant
  merchant: MerchantState;

  // Stats
  totalDives: number;
  totalCatches: number;
  uniqueSpeciesCaught: number;
  title: string;
}

export interface GameAction {
  type: string;
  [key: string]: unknown;
}

export interface GameActionResult {
  success: boolean;
  reason?: string;
  data?: unknown;
}

export interface GameConfig {
  seed: number;
  species?: SpeciesData[];
  worldConfig?: typeof WORLD_CONFIG;
}

// ═══════════════════════════════════════════
// SEEDED RNG
// ═══════════════════════════════════════════

class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (this.state >>> 0) / 0xFFFFFFFF;
  }

  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextRange(min, max + 1));
  }

  // Truncated normal distribution (Box-Muller)
  nextTruncatedNormal(mean: number, stddev: number, min: number, max: number): number {
    let value: number;
    let attempts = 0;
    do {
      const u1 = this.next();
      const u2 = this.next();
      const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
      value = mean + z * stddev;
      attempts++;
    } while ((value < min || value > max) && attempts < 100);
    return Math.max(min, Math.min(max, value));
  }

  getState(): number {
    return this.state;
  }

  setState(s: number): void {
    this.state = s;
  }
}

// ═══════════════════════════════════════════
// SPECIMEN FACTORY
// ═══════════════════════════════════════════

let uidCounter = 0;

/**
 * 개체 고유 ID 생성
 * 형식: fish_{speciesId}_{region}_{sequentialNumber}
 * 예: fish_1_tropical_001, fish_45_glacier_042
 * 
 * 세션 A와 세션 B 모두 이 형식을 사용해야 함
 */
function generateSpecimenUID(speciesId: number, region: Region): string {
  uidCounter++;
  const seq = String(uidCounter).padStart(3, '0');
  return `fish_${speciesId}_${region}_${seq}`;
}

/**
 * 개체 ID에서 정보 추출
 */
export function parseSpecimenUID(uid: string): { speciesId: number; region: Region; seq: number } | null {
  const parts = uid.split('_');
  if (parts.length !== 4 || parts[0] !== 'fish') return null;
  
  const speciesId = parseInt(parts[1], 10);
  const region = parts[2] as Region;
  const seq = parseInt(parts[3], 10);
  
  if (isNaN(speciesId) || isNaN(seq)) return null;
  
  return { speciesId, region, seq };
}

function generateSpecimen(species: SpeciesData, rng: SeededRNG, region: Region, gameTime: number): Specimen {
  const baseLength = species.gameBaseLengthCm;
  const stddev = baseLength * 0.2;
  const minL = species.gameMinLengthCm;
  const maxL = species.gameMaxLengthCm;

  const lengthCm = Math.round(rng.nextTruncatedNormal(baseLength, stddev, minL, maxL) * 10) / 10;

  // Weight from length-weight relationship: W = a * L^b
  const weightKg = species.lengthWeightA * Math.pow(lengthCm, species.lengthWeightB);
  const clampedWeight = Math.round(Math.max(0.001, weightKg) * 1000) / 1000;

  const regionBounds = WORLD_CONFIG.regions[region];
  const x = rng.nextRange(regionBounds.xMin, regionBounds.xMax);
  const z = rng.nextRange(regionBounds.zMin, regionBounds.zMax);
  const depthM = rng.nextRange(species.depthMinM, species.depthMaxM);

  const behaviors = species.behaviors;
  const behaviorState = behaviors[rng.nextInt(0, behaviors.length - 1)];

  return {
    uid: generateSpecimenUID(species.id, region),
    speciesId: species.id,
    lengthCm,
    weightKg: clampedWeight,
    depthM,
    x: Math.round(x * 10) / 10,
    z: Math.round(z * 10) / 10,
    behaviorState,
    spawnTime: gameTime,
  };
}

// ═══════════════════════════════════════════
// GAME ENGINE
// ═══════════════════════════════════════════

export function createGame(config: GameConfig) {
  const seed = config.seed;
  const rng = new SeededRNG(seed);
  const subscribers: Array<(state: GameState) => void> = [];

  // ═══════════════════════════════════════════
  // 수심 검증 및 조정 (게임 시작 시 1회만 실행)
  // ═══════════════════════════════════════════
  const depthValidationResult = validateAndAdjustSpeciesDepths();
  if (depthValidationResult.adjustedSpecies > 0) {
    console.log(`[GameEngine] ${depthValidationResult.adjustedSpecies}종 어종의 수심이 새로운 기준에 맞게 조정되었습니다.`);
  }

  // Initialize subsystems
  const behaviorSystem = new CreatureBehaviorSystem();
  const spawnSystem = new SpawnSystem(DEFAULT_SPAWN_CONFIG);
  const economySystem = new EconomySystem(DEFAULT_ECONOMY_CONFIG);
  const weatherSystem = new WeatherSystem();
  const merchantSystem = new TravelingMerchantSystem(DEFAULT_MERCHANT_CONFIG);
  const rateLimiter = new ActionRateLimiter(16); // 60fps max

  // Initialize state
  let state: GameState = createInitialState(seed);
  let previousState: GameState | null = null;

  function createInitialState(s: number): GameState {
    return {
      version: '3.2.0',
      seed: s,
      tick: 0,
      gameTimeSec: 0,
      day: 1,
      hour: 8,
      season: 'spring',
      weather: 'clear',
      weatherTimer: 3600,

      shells: 100,
      shipLevel: 1,
      shipX: WORLD_CONFIG.startShipX,
      shipZ: WORLD_CONFIG.startShipZ,
      shipHeading: 0,

      inWater: false,
      diverX: WORLD_CONFIG.startShipX,
      diverZ: WORLD_CONFIG.startShipZ,
      diverY: 0,
      diverHeading: 0,
      airRemaining: 100,

      equippedHarpoon: 1,
      equippedTank: 1,
      equippedSuit: 1,
      ownedHarpoons: [1],
      ownedTanks: [1],
      ownedSuits: [1],

      cargo: [],
      storage: [],

      codex: {},
      companions: [],
      fossils: [],
      bossActive: null,
      bossHp: 0,

      activeSpecimens: [],
      merchant: merchantSystem.getState(),
      totalDives: 0,
      totalCatches: 0,
      uniqueSpeciesCaught: 0,
      title: '초보 탐험가',
    };
  }

  // ─── Dispatch ───
  function dispatch(action: GameAction): GameActionResult {
    // Rate limiting (except TICK which is called every frame)
    if (action.type !== 'TICK' && !rateLimiter.canPerform(action.type)) {
      return { success: false, reason: 'Action rate limited' };
    }

    // Store previous state for anti-cheat detection
    previousState = JSON.parse(JSON.stringify(state));

    const result = processAction(action);

    // Validate state after action
    const validation = validateState(state);
    if (!validation.valid) {
      console.warn('State validation errors:', validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.warn('State validation warnings:', validation.warnings);
    }

    // Anti-cheat detection
    if (previousState) {
      const violations = detectImpossibleState(previousState, state);
      if (violations.length > 0) {
        console.error('Impossible state detected:', violations);
        // Revert to previous state if critical violation
        if (violations.some(v => v.includes('Impossible'))) {
          state = previousState;
          return { success: false, reason: 'Invalid state change detected' };
        }
      }
    }

    notifySubscribers();
    return result;
  }

  function processAction(action: GameAction): GameActionResult {
    switch (action.type) {
      case 'TICK': return handleTick(action.dtSec as number);
      case 'MOVE_SHIP': return handleMoveShip(action.forward as number, action.turn as number, action.dtSec as number);
      case 'ENTER_WATER': return handleEnterWater();
      case 'MOVE_DIVER': return handleMoveDiver(action.forward as number, action.turn as number, action.vertical as number, action.dtSec as number);
      case 'RETURN_TO_SHIP': return handleReturnToShip();
      case 'CATCH_ATTEMPT': return handleCatchAttempt(action.specimenId as string, action.distanceM as number);
      case 'OBSERVE_CREATURE': return handleObserve(action.specimenId as string);
      case 'SELL_ALL': return handleSellAll();
      case 'BUY_ITEM': return handleBuyItem(action.itemType as string, action.itemId as number);
      case 'EQUIP_ITEM': return handleEquipItem(action.itemType as string, action.itemId as number);
      case 'UPGRADE_SHIP': return handleUpgradeShip();
      case 'COLLECT_FOSSIL': return handleCollectFossil(action.fossilId as number);
      case 'SUMMON_BOSS': return handleSummonBoss(action.bossId as string);
      case 'ATTACK_BOSS': return handleAttackBoss(action.damage as number);
      case 'RECRUIT_COMPANION': return handleRecruitCompanion(action.companionId as string);
      case 'MERCHANT_BUY': return handleMerchantBuy(action.itemIndex as number);
      default:
        return { success: false, reason: `Unknown action: ${action.type}` };
    }
  }

  // ─── Action Handlers ───

  function handleTick(dtSec: number): GameActionResult {
    if (dtSec <= 0 || dtSec > 1) dtSec = 1 / 60;
    state.tick++;
    state.gameTimeSec += dtSec;

    // Time progression (1 game hour = 60 real seconds)
    const hourProgress = dtSec / 60;
    state.hour += hourProgress;
    if (state.hour >= 24) {
      state.hour -= 24;
      state.day++;
      // Season change every 30 days
      if (state.day % 30 === 0) {
        const seasonIdx = ['spring', 'summer', 'autumn', 'winter'].indexOf(state.season);
        state.season = (['spring', 'summer', 'autumn', 'winter'] as Season[])[(seasonIdx + 1) % 4];
      }
    }

    // Weather system update
    weatherSystem.update(dtSec, state.season, () => rng.next());
    const weatherState = weatherSystem.getState();
    state.weather = weatherState.current;

    // Traveling merchant update
    merchantSystem.update(state.gameTimeSec, () => rng.next());
    state.merchant = merchantSystem.getState();

    // Air consumption underwater
    if (state.inWater) {
      const tankData = TANKS.find(t => t.id === state.equippedTank)!;
      const airConsumption = dtSec * (1 / tankData.airCapacity) * 100;
      state.airRemaining = Math.max(0, state.airRemaining - airConsumption);
      if (state.airRemaining <= 0) {
        // Auto return
        state.inWater = false;
        state.diverY = 0;
      }
    }

    // Creature spawning
    if (state.tick % 60 === 0) {
      spawnCreatures();
    }

    // Creature movement (simplified)
    updateCreatureBehaviors(dtSec);

    // Boss combat tick
    if (state.bossActive) {
      // Boss attacks every 2 seconds
      if (state.tick % 120 === 0) {
        const boss = BOSSES.find(b => b.id === state.bossActive);
        if (boss && state.inWater) {
          // Boss damage to player (handled by visual layer)
        }
      }
    }

    return { success: true };
  }

  function handleMoveShip(forward: number, turn: number, dtSec: number): GameActionResult {
    const shipData = SHIP_UPGRADES.find(s => s.level === state.shipLevel)!;
    const speed = shipData.speed * forward;
    const turnRate = 1.5 * turn;

    state.shipHeading += turnRate * dtSec;
    state.shipX += Math.sin(state.shipHeading) * speed * dtSec;
    state.shipZ += Math.cos(state.shipHeading) * speed * dtSec;

    // Clamp to world bounds
    state.shipX = Math.max(0, Math.min(WORLD_CONFIG.widthM, state.shipX));
    state.shipZ = Math.max(0, Math.min(WORLD_CONFIG.heightM, state.shipZ));

    // If diver is in water, diver follows ship (if near)
    if (state.inWater) {
      const dist = distance2D(state.diverX, state.diverZ, state.shipX, state.shipZ);
      if (dist > 50) {
        state.inWater = false;
        state.diverY = 0;
      }
    }

    return { success: true };
  }

  function handleEnterWater(): GameActionResult {
    if (state.inWater) return { success: false, reason: 'Already in water' };
    if (state.airRemaining <= 0) return { success: false, reason: 'No air remaining' };

    state.inWater = true;
    state.diverX = state.shipX;
    state.diverZ = state.shipZ;
    state.diverY = -1;
    state.totalDives++;
    checkCompanionUnlocks();

    return { success: true };
  }

  function handleMoveDiver(forward: number, turn: number, vertical: number, dtSec: number): GameActionResult {
    if (!state.inWater) return { success: false, reason: 'Not in water' };

    const suitData = SUITS.find(s => s.id === state.equippedSuit)!;
    const tankData = TANKS.find(t => t.id === state.equippedTank)!;
    const baseSpeed = 3;
    const speed = baseSpeed * forward * tankData.moveModifier * suitData.moveModifier;

    state.diverHeading += 1.2 * turn * dtSec;
    state.diverX += Math.sin(state.diverHeading) * speed * dtSec;
    state.diverZ += Math.cos(state.diverHeading) * speed * dtSec;
    state.diverY += vertical * 2 * dtSec;

    // Clamp depth
    state.diverY = Math.max(-2000, Math.min(0, state.diverY));

    // Clamp position
    state.diverX = Math.max(0, Math.min(WORLD_CONFIG.widthM, state.diverX));
    state.diverZ = Math.max(0, Math.min(WORLD_CONFIG.heightM, state.diverZ));

    // Environmental damage check
    const envProtection = suitData.envProtection;
    const depthDamage = Math.abs(state.diverY) > 100 ? (Math.abs(state.diverY) - 100) * 0.001 * (1 - envProtection) : 0;
    // Damage is tracked but doesn't end dive in this version

    return { success: true };
  }

  function handleReturnToShip(): GameActionResult {
    if (!state.inWater) return { success: false, reason: 'Not in water' };

    const dist = distance2D(state.diverX, state.diverZ, state.shipX, state.shipZ);
    if (dist > 20) return { success: false, reason: 'Too far from ship' };

    state.inWater = false;
    state.diverY = 0;
    state.diverX = state.shipX;
    state.diverZ = state.shipZ;

    // Restore some air at surface
    state.airRemaining = Math.min(100, state.airRemaining + 10);

    return { success: true };
  }

  /**
   * 포획 시도
   * @param specimenId - 개체 ID (fish_{speciesId}_{region}_{seq} 형식)
   * @param distanceM - 잠수부와 개체 간 거리 (m). 생략 시 자동 계산
   */
  function handleCatchAttempt(specimenId: string, distanceM?: number): GameActionResult {
    // 1. 수중 상태 확인
    if (!state.inWater) {
      return { success: false, reason: '수중 상태가 아닙니다' };
    }

    // 2. 개체 찾기
    const specimen = state.activeSpecimens.find(s => s.uid === specimenId);
    if (!specimen) {
      return { success: false, reason: `개체를 찾을 수 없습니다: ${specimenId}` };
    }

    // 3. 거리 자동 계산 (제공되지 않은 경우)
    if (distanceM === undefined) {
      distanceM = distance3D(
        state.diverX, state.diverZ, state.diverY,
        specimen.x, specimen.z, -specimen.depthM
      );
    }

    // 4. 종 정보 가져오기
    const species = SPECIES_BY_ID.get(specimen.speciesId);
    if (!species) {
      return { success: false, reason: `종 정보를 찾을 수 없습니다: ${specimen.speciesId}` };
    }

    // 5. 작살 정보 가져오기
    const harpoon = HARPOONS.find(h => h.id === state.equippedHarpoon);
    if (!harpoon) {
      return { success: false, reason: '작살을 찾을 수 없습니다' };
    }

    // 6. 거리 체크
    if (distanceM > harpoon.range) {
      return { 
        success: false, 
        reason: `사거리 부족: ${distanceM.toFixed(1)}m > ${harpoon.range}m`,
        data: { distance: distanceM, maxRange: harpoon.range }
      };
    }

    // 7. 수심 체크 (장비 제한)
    const tankData = TANKS.find(t => t.id === state.equippedTank);
    const suitData = SUITS.find(s => s.id === state.equippedSuit);
    const maxDepth = Math.min(tankData?.maxDepth || 30, suitData?.maxDepth || 30);
    
    if (specimen.depthM > maxDepth) {
      return {
        success: false,
        reason: `수심 제한 초과: ${specimen.depthM}m > ${maxDepth}m`,
        data: { depth: specimen.depthM, maxDepth }
      };
    }

    // 8. 보호종 체크
    if (species.protected) {
      return { 
        success: false, 
        reason: '보호종은 포획할 수 없습니다',
        data: { species: species.name, protected: true }
      };
    }

    // 9. 화물 공간 체크
    const shipData = SHIP_UPGRADES.find(s => s.level === state.shipLevel);
    if (!shipData) {
      return { success: false, reason: '선박 정보를 찾을 수 없습니다' };
    }
    
    if (state.cargo.length >= shipData.cargoCapacity) {
      return { 
        success: false, 
        reason: `화물 공간 부족: ${state.cargo.length}/${shipData.cargoCapacity}`,
        data: { current: state.cargo.length, capacity: shipData.cargoCapacity }
      };
    }

    // 10. 포획 확률 계산
    let catchProb = 0.5; // 기본 확률
    
    // 작살 보너스
    catchProb += harpoon.catchBonus;
    
    // 거리 페널티 ( 가까울수록 유리)
    const distanceRatio = distanceM / harpoon.range;
    catchProb -= distanceRatio * 0.3;
    
    // 작살 안정성 보너스
    catchProb += harpoon.stability * 0.02;
    
    // 희귀도 페널티
    catchProb -= species.rarity * 0.05;
    
    // 수심 페널티 (깊을수록 어려움)
    const depthPenalty = (specimen.depthM / maxDepth) * 0.1;
    catchProb -= depthPenalty;

    // 동료 보너스
    if (state.companions.includes('ari')) {
      catchProb += 0.1; // 아리: 포획 보너스
    }

    // 날씨 효과
    const weatherEffect = WEATHER_EFFECTS[state.weather];
    catchProb *= weatherEffect.catchMod;

    // 확률 제한 (5% ~ 95%)
    catchProb = Math.max(0.05, Math.min(0.95, catchProb));

    // 11. 포획 시도
    const roll = rng.next();
    
    if (roll < catchProb) {
      // ✅ 성공
      const caughtSpecimen = { ...specimen };
      state.cargo.push(caughtSpecimen);
      state.activeSpecimens = state.activeSpecimens.filter(s => s.uid !== specimenId);
      state.totalCatches++;

      // 도감 업데이트
      updateCodexCatch(specimen);

      return { 
        success: true, 
        data: { 
          specimen: caughtSpecimen,
          catchProb,
          distance: distanceM,
          depth: specimen.depthM,
          species: species.name,
          length: specimen.lengthCm,
          weight: specimen.weightKg,
          value: Math.round(species.sellBasePrice * (specimen.lengthCm / species.gameBaseLengthCm))
        }
      };
    } else {
      // ❌ 실패
      return { 
        success: false, 
        reason: '포획에 실패했습니다',
        data: { 
          catchProb,
          roll,
          distance: distanceM,
          depth: specimen.depthM,
          species: species.name
        }
      };
    }
  }

  function handleObserve(specimenId: string): GameActionResult {
    if (!state.inWater) return { success: false, reason: 'Not in water' };

    const specimen = state.activeSpecimens.find(s => s.uid === specimenId);
    if (!specimen) return { success: false, reason: 'Specimen not found' };

    const species = SPECIES_BY_ID.get(specimen.speciesId)!;
    const observeDistance = 15;
    const dist = distance3D(
      state.diverX, state.diverZ, state.diverY,
      specimen.x, specimen.z, -specimen.depthM
    );

    if (dist > observeDistance) return { success: false, reason: 'Too far to observe' };

    // Update codex
    updateCodexObserve(specimen);

    // Observation reward using economy system
    let companionBonus = 0;
    if (state.companions.includes('mia')) {
      companionBonus = 0.5;
    }
    const reward = economySystem.calculateObservationReward(specimen.speciesId, companionBonus);
    state.shells += reward;

    return { success: true, data: { species: species.name, reward } };
  }

  function handleSellAll(): GameActionResult {
    if (state.inWater) return { success: false, reason: 'Must be on ship' };

    // Check if near port
    const nearPort = ISLANDS.some(island =>
      island.hasPort && distance2D(state.shipX, state.shipZ, island.x, island.y) < 100
    );
    if (!nearPort) return { success: false, reason: 'Must be near a port' };

    let sellBonus = 0;
    if (state.companions.includes('leo')) sellBonus = DEFAULT_ECONOMY_CONFIG.companionSellBonus;

    const saleResult = economySystem.sellAll(state.cargo, sellBonus);
    state.shells += saleResult.totalEarned;
    state.cargo = [];

    return { success: true, data: { totalEarned: saleResult.totalEarned, itemsSold: saleResult.itemsSold } };
  }

  function handleBuyItem(itemType: string, itemId: number): GameActionResult {
    let price = 0;
    let ownedList: number[];

    switch (itemType) {
      case 'harpoon': {
        const item = HARPOONS.find(h => h.id === itemId);
        if (!item) return { success: false, reason: 'Item not found' };
        if (state.ownedHarpoons.includes(itemId)) return { success: false, reason: 'Already owned' };
        price = item.price;
        ownedList = state.ownedHarpoons;
        break;
      }
      case 'tank': {
        const item = TANKS.find(t => t.id === itemId);
        if (!item) return { success: false, reason: 'Item not found' };
        if (state.ownedTanks.includes(itemId)) return { success: false, reason: 'Already owned' };
        price = item.price;
        ownedList = state.ownedTanks;
        break;
      }
      case 'suit': {
        const item = SUITS.find(s => s.id === itemId);
        if (!item) return { success: false, reason: 'Item not found' };
        if (state.ownedSuits.includes(itemId)) return { success: false, reason: 'Already owned' };
        price = item.price;
        ownedList = state.ownedSuits;
        break;
      }
      default:
        return { success: false, reason: 'Unknown item type' };
    }

    if (state.shells < price) return { success: false, reason: 'Not enough shells' };

    state.shells -= price;
    ownedList.push(itemId);

    return { success: true, data: { itemType, itemId } };
  }

  function handleEquipItem(itemType: string, itemId: number): GameActionResult {
    switch (itemType) {
      case 'harpoon':
        if (!state.ownedHarpoons.includes(itemId)) return { success: false, reason: 'Not owned' };
        state.equippedHarpoon = itemId;
        break;
      case 'tank':
        if (!state.ownedTanks.includes(itemId)) return { success: false, reason: 'Not owned' };
        state.equippedTank = itemId;
        break;
      case 'suit':
        if (!state.ownedSuits.includes(itemId)) return { success: false, reason: 'Not owned' };
        state.equippedSuit = itemId;
        break;
      default:
        return { success: false, reason: 'Unknown item type' };
    }
    return { success: true };
  }

  function handleUpgradeShip(): GameActionResult {
    const nextLevel = state.shipLevel + 1;
    if (nextLevel > 5) return { success: false, reason: 'Max level reached' };

    const upgrade = SHIP_UPGRADES.find(s => s.level === nextLevel)!;
    if (state.shells < upgrade.price) return { success: false, reason: 'Not enough shells' };

    state.shells -= upgrade.price;
    state.shipLevel = nextLevel;

    return { success: true, data: { newLevel: nextLevel } };
  }

  function handleCollectFossil(fossilId: number): GameActionResult {
    if (!state.inWater) return { success: false, reason: 'Must be underwater' };

    const fossil = FOSSILS.find(f => f.id === fossilId);
    if (!fossil) return { success: false, reason: 'Fossil not found' };
    if (state.fossils.includes(fossilId)) return { success: false, reason: 'Already collected' };

    // Check if diver is in the right region
    const currentRegion = getRegionAt(state.diverX, state.diverZ);
    if (currentRegion !== fossil.region) return { success: false, reason: 'Wrong region' };

    // Discovery probability based on rarity
    const discoveryChance = 0.1 / fossil.rarity;
    if (rng.next() > discoveryChance) return { success: false, reason: 'Fossil not found here' };

    state.fossils.push(fossilId);

    return { success: true, data: { fossil: fossil.name } };
  }

  function handleSummonBoss(bossId: string): GameActionResult {
    if (state.inWater) return { success: false, reason: 'Must be on ship' };
    if (state.bossActive) return { success: false, reason: 'Boss already active' };

    const boss = BOSSES.find(b => b.id === bossId);
    if (!boss) return { success: false, reason: 'Boss not found' };

    const bossFossils = FOSSILS.filter(f => f.bossId === bossId);
    const collectedBossFossils = bossFossils.filter(f => state.fossils.includes(f.id));

    if (collectedBossFossils.length < boss.fossilRequired) {
      return { success: false, reason: `Need ${boss.fossilRequired} fossils, have ${collectedBossFossils.length}` };
    }

    // Consume fossils
    for (const f of collectedBossFossils) {
      state.fossils = state.fossils.filter(fid => fid !== f.id);
    }

    state.bossActive = bossId;
    state.bossHp = boss.hp;

    return { success: true, data: { boss: boss.name, hp: boss.hp } };
  }

  function handleAttackBoss(damage: number): GameActionResult {
    if (!state.bossActive) return { success: false, reason: 'No boss active' };
    if (!state.inWater) return { success: false, reason: 'Must be in water' };

    const boss = BOSSES.find(b => b.id === state.bossActive)!;
    state.bossHp -= damage;

    if (state.bossHp <= 0) {
      // Victory
      state.shells += boss.rewardShells;
      state.title = boss.rewardTitle;
      state.bossActive = null;
      state.bossHp = 0;
      return { success: true, data: { victory: true, reward: boss.rewardShells, title: boss.rewardTitle } };
    }

    return { success: true, data: { bossHp: state.bossHp } };
  }

  function handleRecruitCompanion(companionId: string): GameActionResult {
    if (state.companions.includes(companionId)) return { success: false, reason: 'Already recruited' };

    const companion = COMPANIONS.find(c => c.id === companionId);
    if (!companion) return { success: false, reason: 'Companion not found' };

    // Check unlock conditions
    switch (companionId) {
      case 'mia':
        if (!hasObservedProtectedSpecies()) return { success: false, reason: 'Observe a protected species first' };
        break;
      case 'ari':
        if (state.totalDives < 50) return { success: false, reason: 'Need 50 dives' };
        break;
      case 'leo':
        if (getUniqueSpeciesCaught() < 30) return { success: false, reason: 'Need 30 unique catches' };
        break;
    }

    state.companions.push(companionId);
    return { success: true, data: { companion: companion.name } };
  }

  function handleMerchantBuy(itemIndex: number): GameActionResult {
    if (!state.merchant.isActive) {
      return { success: false, reason: 'Merchant not visiting' };
    }

    const item = state.merchant.inventory[itemIndex];
    if (!item) {
      return { success: false, reason: 'Item not found' };
    }

    if (item.stock <= 0) {
      return { success: false, reason: 'Out of stock' };
    }

    if (state.shells < item.price) {
      return { success: false, reason: 'Not enough shells' };
    }

    // Process purchase through merchant system
    const result = merchantSystem.buyItem(itemIndex, state.shells);
    if (!result.success) {
      return { success: false, reason: result.reason };
    }

    // Update player state
    state.shells = result.newShells!;

    // Add item to player inventory based on type
    switch (item.type) {
      case 'harpoon':
        if (!state.ownedHarpoons.includes(item.itemId)) {
          state.ownedHarpoons.push(item.itemId);
        }
        break;
      case 'tank':
        if (!state.ownedTanks.includes(item.itemId)) {
          state.ownedTanks.push(item.itemId);
        }
        break;
      case 'suit':
        if (!state.ownedSuits.includes(item.itemId)) {
          state.ownedSuits.push(item.itemId);
        }
        break;
      case 'material':
      case 'rare':
        // Materials and rare items are consumed immediately or stored
        // For now, just deduct the price
        break;
    }

    // Update merchant state in game state
    state.merchant = merchantSystem.getState();

    return { success: true, data: { item: item.name, price: item.price } };
  }

  // ─── Helper Functions ───

  // Weather is now handled by WeatherSystem

  function spawnCreatures(): void {
    const spawnConfig = spawnSystem.getConfig();
    if (state.activeSpecimens.length >= spawnConfig.maxActive) return;

    const toSpawn = Math.min(spawnConfig.spawnBatchSize, spawnConfig.maxActive - state.activeSpecimens.length);

    // Get region weights based on player position, weather, season, time
    const regionWeights = spawnSystem.getRegionSpawnWeights(
      state.shipX, state.shipZ, state.weather, state.season, state.hour
    );

    for (let i = 0; i < toSpawn; i++) {
      // Select region using spawn system
      const region = spawnSystem.selectRegion(regionWeights, () => rng.next());

      // Select species using spawn system
      const selectedSpecies = spawnSystem.selectSpecies(region, () => rng.next());

      // Generate position and depth
      const pos = spawnSystem.generatePosition(region, () => rng.next());
      const depth = spawnSystem.generateDepth(selectedSpecies, () => rng.next());

      // Generate specimen using existing factory
      const specimen = generateSpecimen(selectedSpecies, rng, region, state.gameTimeSec);
      // Override position with spawn system values
      specimen.x = Math.round(pos.x * 10) / 10;
      specimen.z = Math.round(pos.z * 10) / 10;
      specimen.depthM = Math.round(Math.abs(depth));

      state.activeSpecimens.push(specimen);
    }
  }

  function updateCreatureBehaviors(dtSec: number): void {
    // Prepare diver position for behavior system
    const diverPos = state.inWater ? {
      x: state.diverX,
      y: state.diverY,
      z: state.diverZ,
    } : null;

    for (const spec of state.activeSpecimens) {
      const species = SPECIES_BY_ID.get(spec.speciesId);
      if (!species) continue;

      // Use CreatureBehaviorSystem for complex behaviors
      const creatureState: CreatureState = {
        uid: spec.uid,
        speciesId: spec.speciesId,
        x: spec.x,
        y: -spec.depthM,
        z: spec.z,
        heading: 0,
        speed: 1,
        behaviorState: spec.behaviorState as any,
        targetX: spec.x,
        targetZ: spec.z,
        targetY: -spec.depthM,
        alertLevel: 0,
        hunger: 0.3,
        schoolId: null,
        age: state.gameTimeSec - spec.spawnTime,
        maxAge: 600, // 10 minutes
      };

      // Update behavior using the behavior system
      behaviorSystem.updateBehavior(creatureState, species, dtSec, diverPos, [], state.hour);

      // Write back to specimen
      spec.x = creatureState.x;
      spec.z = creatureState.z;
      spec.behaviorState = creatureState.behaviorState;

      // Keep in world bounds
      const bounds = WORLD_CONFIG.regions[species.region];
      spec.x = Math.max(bounds.xMin, Math.min(bounds.xMax, spec.x));
      spec.z = Math.max(bounds.zMin, Math.min(bounds.zMax, spec.z));

      // Despawn if too old
      if (state.gameTimeSec - spec.spawnTime > 600) {
        spec.behaviorState = 'despawned';
      }
    }

    // Remove despawned
    state.activeSpecimens = state.activeSpecimens.filter(s => s.behaviorState !== 'despawned');
  }

  function updateCodexCatch(specimen: Specimen): void {
    const sid = specimen.speciesId;
    if (!state.codex[sid]) {
      state.codex[sid] = {
        speciesId: sid,
        firstDiscoverTime: state.gameTimeSec,
        firstCatchTime: state.gameTimeSec,
        catchCount: 0,
        observeCount: 0,
        maxLengthCm: 0,
        maxWeightKg: 0,
        maxLengthWeightKg: 0,
        maxWeightLengthCm: 0,
        discoveredRegions: [],
      };
    }

    const entry = state.codex[sid];
    entry.catchCount++;
    if (!entry.firstCatchTime) entry.firstCatchTime = state.gameTimeSec;

    if (specimen.lengthCm > entry.maxLengthCm) {
      entry.maxLengthCm = specimen.lengthCm;
      entry.maxLengthWeightKg = specimen.weightKg;
    }
    if (specimen.weightKg > entry.maxWeightKg) {
      entry.maxWeightKg = specimen.weightKg;
      entry.maxWeightLengthCm = specimen.lengthCm;
    }

    const region = getRegionAt(specimen.x, specimen.z);
    if (!entry.discoveredRegions.includes(region)) {
      entry.discoveredRegions.push(region);
    }

    state.uniqueSpeciesCaught = getUniqueSpeciesCaught();
    checkCompanionUnlocks();
    updateTitle();
  }

  function updateCodexObserve(specimen: Specimen): void {
    const sid = specimen.speciesId;
    if (!state.codex[sid]) {
      state.codex[sid] = {
        speciesId: sid,
        firstDiscoverTime: state.gameTimeSec,
        firstCatchTime: null,
        catchCount: 0,
        observeCount: 0,
        maxLengthCm: 0,
        maxWeightKg: 0,
        maxLengthWeightKg: 0,
        maxWeightLengthCm: 0,
        discoveredRegions: [],
      };
    }

    const entry = state.codex[sid];
    entry.observeCount++;

    const region = getRegionAt(specimen.x, specimen.z);
    if (!entry.discoveredRegions.includes(region)) {
      entry.discoveredRegions.push(region);
    }
  }

  function getRegionAt(x: number, z: number): Region {
    for (const [region, bounds] of Object.entries(WORLD_CONFIG.regions)) {
      if (x >= bounds.xMin && x < bounds.xMax && z >= bounds.zMin && z < bounds.zMax) {
        return region as Region;
      }
    }
    return 'ocean';
  }

  function getUniqueSpeciesCaught(): number {
    return Object.values(state.codex).filter(e => e.catchCount > 0).length;
  }

  function hasObservedProtectedSpecies(): boolean {
    return Object.entries(state.codex).some(([sid, entry]) => {
      const species = SPECIES_BY_ID.get(Number(sid));
      return species?.protected && entry.observeCount > 0;
    });
  }

  function checkCompanionUnlocks(): void {
    // Auto-check but don't auto-recruit
  }

  function updateTitle(): void {
    const unique = getUniqueSpeciesCaught();
    if (unique >= 180) state.title = '가이아의 수호자';
    else if (unique >= 150) state.title = '전설의 탐험가';
    else if (unique >= 100) state.title = '숙련된 해양학자';
    else if (unique >= 50) state.title = '경험있는 잠수부';
    else if (unique >= 20) state.title = '열정적인 탐험가';
    else if (unique >= 5) state.title = '초보 탐험가';
  }

  function distance2D(x1: number, z1: number, x2: number, z2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
  }

  function distance3D(x1: number, z1: number, y1: number, x2: number, z2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2 + (y2 - y1) ** 2);
  }

  // ─── Snapshot & Subscription ───

  function getSnapshot(): GameState {
    // Sanitize before returning to prevent data corruption
    return sanitizeSnapshot(state);
  }

  function subscribe(callback: (state: GameState) => void): () => void {
    subscribers.push(callback);
    return () => {
      const idx = subscribers.indexOf(callback);
      if (idx >= 0) subscribers.splice(idx, 1);
    };
  }

  function notifySubscribers(): void {
    const snapshot = getSnapshot();
    for (const cb of subscribers) {
      cb(snapshot);
    }
  }

  // ─── Save / Load ───

  function save(): GameActionResult {
    try {
      // Validate and sanitize before saving
      const validation = validateState(state);
      if (!validation.valid) {
        console.warn('Saving with validation errors:', validation.errors);
      }

      const sanitizedState = sanitizeSnapshot(state);
      const saveData = {
        version: state.version,
        state: sanitizedState,
        rngState: rng.getState(),
        uidCounter,
        timestamp: Date.now(),
      };
      localStorage.setItem('oceangaia_save', JSON.stringify(saveData));
      return { success: true };
    } catch (e) {
      console.error('Save failed:', e);
      return { success: false, reason: 'Save failed' };
    }
  }

  function load(): GameActionResult {
    try {
      const raw = localStorage.getItem('oceangaia_save');
      if (!raw) return { success: false, reason: 'No save data' };

      const saveData = JSON.parse(raw);
      
      // Version check
      if (saveData.version !== state.version) {
        return { success: false, reason: `Version mismatch: save=${saveData.version}, current=${state.version}` };
      }

      // Validate loaded state
      const loadedState = saveData.state as GameState;
      const validation = validateState(loadedState);
      if (!validation.valid) {
        console.error('Loaded state validation failed:', validation.errors);
        return { success: false, reason: `Corrupted save data: ${validation.errors.join(', ')}` };
      }

      // Restore game state
      state = loadedState;
      
      // Restore RNG state
      if (typeof saveData.rngState === 'number') {
        rng.setState(saveData.rngState);
      }
      
      // Restore UID counter
      if (typeof saveData.uidCounter === 'number') {
        uidCounter = saveData.uidCounter;
      }

      // Notify subscribers of state change
      notifySubscribers();

      return { success: true };
    } catch (e) {
      console.error('Load failed:', e);
      return { success: false, reason: `Load failed: ${e}` };
    }
  }

  // ─── Helper API for Session A ───

  /**
   * 주변 개체 조회 (세션 A용)
   * @param x - 중심 X 좌표
   * @param z - 중심 Z 좌표
   * @param radius - 검색 반경 (m)
   * @returns 범위 내 개체 목록 (거리순 정렬)
   */
  function getNearbySpecimens(x: number, z: number, radius: number = 50): Array<Specimen & { distance: number }> {
    return state.activeSpecimens
      .map(spec => ({
        ...spec,
        distance: distance2D(x, z, spec.x, spec.z)
      }))
      .filter(spec => spec.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * ID로 개체 정보 가져오기 (세션 A용)
   * @param uid - 개체 ID (fish_{speciesId}_{region}_{seq} 형식)
   * @returns 개체 정보 또는 null
   */
  function getSpecimenById(uid: string): Specimen | null {
    return state.activeSpecimens.find(s => s.uid === uid) || null;
  }

  /**
   * 두 지점 간 거리 계산 (세션 A용)
   */
  function calculateDistance(x1: number, z1: number, x2: number, z2: number): number {
    return distance2D(x1, z1, x2, z2);
  }

  /**
   * 현재 잠수부 위치 가져오기 (세션 A용)
   */
  function getDiverPosition(): { x: number; y: number; z: number } | null {
    if (!state.inWater) return null;
    return {
      x: state.diverX,
      y: state.diverY,
      z: state.diverZ
    };
  }

  /**
   * 현재 선박 위치 가져오기 (세션 A용)
   */
  function getShipPosition(): { x: number; y: number; z: number } {
    return {
      x: state.shipX,
      y: 0,
      z: state.shipZ
    };
  }

  // ─── Return API ───

  return {
    // Core API
    dispatch,
    getSnapshot,
    subscribe,
    save,
    load,
    
    // Helper API for Session A
    getNearbySpecimens,
    getSpecimenById,
    calculateDistance,
    getDiverPosition,
    getShipPosition,
  };
}

export type Game = ReturnType<typeof createGame>;
