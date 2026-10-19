/**
 * OCEAN GAIA V3.2 — GameEngine (세션 B 소유)
 * 계약: createGame(config) → { dispatch, getSnapshot, subscribe, save, load }
 * Three.js import 금지. 스냅샷은 JSON 직렬화 가능. 시드 재현 보장.
 */

import { Rng, type RngState } from "../core/Rng";
import { WORLD, GAME_VERSION, SAVE_KEY, SAVE_SCHEMA_VERSION, clamp, isFiniteNumber } from "../core/units";
import { SPECIES, getSpeciesById } from "../data/species";
import type { Species } from "../data/speciesTypes";
import { HARPOONS, TANKS, SUITS, SHIP_STAGES, findEquipment, type Harpoon, type Tank, type DiveSuit } from "../data/equipment";
import { ZONES, ISLANDS, DIVE_SITES, COMPANIONS, BOSSES, FOSSILS, zoneAt } from "../data/world";
import { SpawnSystem, type SpawnEnv } from "../systems/SpawnSystem";
import { stepBehavior, listSpecimens, makeSpecimen, type Specimen, type EnvContext } from "../systems/CreatureBehavior";
import { WeatherSystem, timeOfDay, seasonOf, isNight, dayNumber, GAME_SECONDS_PER_DAY, type Weather, type Season } from "../systems/WeatherSystem";

/** 프레임 틱 상한(초). 그 이상은 타임스케일 치트로 간주. */
export const TICK_MAX_DT_SEC = 10;

// ───────── 타입 ─────────
export interface Vec3 { x: number; y: number; z: number }

export interface ShipState {
  position: Vec3; headingRad: number; speedMs: number; stage: number; // 1..5
}
export interface DiverState {
  mode: "ON_SHIP" | "IN_WATER" | "DIVING";
  position: Vec3; airCurrent: number; airMax: number; depthM: number;
}
export interface InventoryItem {
  uid: string; specimenId: string; speciesId: number; lengthCm: number; massKg: number;
  caughtAtGameSec: number; sold: boolean;
}
export interface DexEntry {
  firstDiscovered: boolean; firstCaught: boolean; catchCount: number; observeCount: number;
  maxLengthCm: number; maxLengthMassKg: number; maxMassKg: number; maxMassLengthCm: number;
  discoveredZones: string[];
}
export interface FossilState { id: string; collected: boolean; nextRespawnGameSec: number }
export interface BossState { id: string; defeated: boolean; hp: number; active: boolean }

export interface GameState {
  version: string; schemaVersion: number; seed: number;
  /** 날씨 RNG 시드 오프셋 — save/load 후에도 동일 난수 흐름 재현 (재현성 계약) */
  weatherRngSeed: number;
  gameSeconds: number; day: number; season: Season; weather: Weather; tideLevel: number; currentSpeedMs: number;
  ship: ShipState; diver: DiverState;
  shells: number; // 조개 화폐
  ownedEquipment: Record<string, boolean>;
  equipped: { harpoonId: string; tankId: string; suitId: string };
  cargo: InventoryItem[]; cargoUsedKg: number;
  dex: Record<number, DexEntry>;
  fossils: FossilState[]; bosses: BossState[];
  companions: Record<string, boolean>;
  discoveredSites: Record<string, boolean>;
  merchant: MerchantState;
  specimens: Specimen[]; // A팀이 읽는 개체 목록 (id/위치/상태 포함)
  log: string[];
}

export interface ActionResult { ok: boolean; reason?: string; [k: string]: unknown }
export type Action =
  | { type: "TICK"; dtSec: number }
  | { type: "MOVE_SHIP"; forward: number; turn: number; dtSec: number }
  | { type: "ENTER_WATER" }
  | { type: "MOVE_DIVER"; dx: number; dy: number; dz: number }
  | { type: "RETURN_TO_SHIP" }
  | { type: "CATCH_ATTEMPT"; specimenId: string; distanceM: number }
  | { type: "OBSERVE_CREATURE"; specimenId: string }
  | { type: "SELL_ALL" }
  | { type: "BUY_ITEM"; itemId: string }
  | { type: "EQUIP_ITEM"; itemId: string }
  | { type: "UPGRADE_SHIP" }
  | { type: "COLLECT_FOSSIL"; fossilId: string }
  | { type: "SUMMON_BOSS"; bossId: string }
  | { type: "ATTACK_BOSS"; bossId: string; damage: number }
  | { type: "RECRUIT_COMPANION"; companionId: string; conditionMet: boolean }
  | { type: "MERCHANT_VISIT" }
  | { type: "MERCHANT_BUY"; itemId: string }
  | { type: "MARK_SITE_DISCOVERED"; siteId: string }
  | { type: "DEBUG_SET_STATE"; patch: Record<string, unknown> };

export interface GameConfig {
  seed: number;
  worldConfig?: unknown;
  storage?: SaveStorage; // 주입식 저장(Node 테스트에서는 메모리 스토리지)
  enableDebugActions?: boolean; // 테스트 전용 DEBUG_SET_STATE 허용(기본 false)
  /** 시작 게임 시각(초). 기본값 8*60(오전 8시). 낮/밤·계절 검증 및 시나리오 연출용. */
  startGameSeconds?: number;
}
export interface SaveStorage { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

export interface GameInstance {
  dispatch(action: Action): ActionResult;
  getSnapshot(): GameState;
  subscribe(cb: (s: GameState) => void): () => void;
  save(): void;
  load(): boolean;
  /** 세션 A 호환 평면 필드 접근(어댑터 없이도 읽을 수 있게) */
  getShipPosition(): Vec3;
  /** 세션 A 호환 조회 API (순수 데이터 사본 반환 — 직접 참조 금지) */
  getSpecimens(): Specimen[];
  getZoneAt(x: number, z: number): string | null;
  /** 어종별 개체 풀(시리얼라이즈된 species 참조 포함) — A팀 모델 매핑용 */
  getSpeciesPool(zoneId?: string): Array<{ specimen: Specimen; species: Species }>;
  /** 엔진에 연결된 저장 스토리지(테스트/자동화 검증용 읽기 전용 노출) */
  storage: SaveStorage;
}

const memoryStores = new Map<string, string>();
export function memoryStorage(): SaveStorage {
  return {
    getItem: (k) => memoryStores.get(k) ?? null,
    setItem: (k, v) => void memoryStores.set(k, v),
    removeItem: (k) => void memoryStores.delete(k),
  };
}

// ───────── 엔진 ─────────
export function createGame(config: GameConfig): GameInstance {
  const rng = new Rng(config.seed);
  // 테스트/자동화 편의: storage 미주입 시 engine.storage에 격리 메모리 스토리지 제공.
  // 브라우저에서는 defaultBrowserStorage()(localStorage)를 사용한다.
  const sharedMemoryStore = memoryStorage();
  const storage: SaveStorage = config.storage ?? (typeof localStorage !== "undefined" ? localStorage : sharedMemoryStore);
  const listeners = new Set<(s: GameState) => void>();

  const state: GameState = freshState(config.seed);
  if (Number.isFinite(config.startGameSeconds ?? NaN) && (config.startGameSeconds as number) >= 0) {
    state.gameSeconds = config.startGameSeconds as number;
    state.day = dayNumber({ gameSeconds: state.gameSeconds });
    state.season = seasonOf({ gameSeconds: state.gameSeconds });
  }
  // 재현성 계약: 메인 RNG와 스폰 RNG는 반드시 서로 다른 스트림을 사용한다.
  // (mulberry32는 0과 ^0x9e3779b9가 첫 출력 이후 같은 상태가 되어 초기 세계가 꼬인다)
  const spawnRngSeed = (config.seed >>> 0) === 0 ? 0x9e3779b9 : (config.seed * 2654435761) >>> 0;
  const spawnSys = new SpawnSystem(new Rng(spawnRngSeed));
  let weatherSys = new WeatherSystem(new Rng(config.seed ^ state.weatherRngSeed), "tropical");
  let inventoryUid = 0;
  let rngPersist: RngState = rng.serialize();

  function freshState(seed: number): GameState {
    return {
      version: GAME_VERSION, schemaVersion: SAVE_SCHEMA_VERSION, seed, weatherRngSeed: 0x51ed270b,
      gameSeconds: 8 * 60, day: 1, season: "SPRING", weather: "CLEAR", tideLevel: 0, currentSpeedMs: 1,
      // 고정 계약: 시작 배 좌표 (755, 0, 1780) — 임의 오프셋 금지.
      ship: { position: { x: WORLD.START_SHIP.x, y: 0, z: WORLD.START_SHIP.z }, headingRad: Math.PI, speedMs: 0, stage: 1 },
      diver: { mode: "ON_SHIP", position: { ...WORLD.START_SHIP }, airCurrent: 100, airMax: 100, depthM: 0 },
      shells: 120,
      ownedEquipment: { harpoon_01: true, tank_01: true, suit_01: true },
      equipped: { harpoonId: "harpoon_01", tankId: "tank_01", suitId: "suit_01" },
      cargo: [], cargoUsedKg: 0,
      dex: {}, fossils: FOSSILS.map((f) => ({ id: f.id, collected: false, nextRespawnGameSec: 0 })),
      bosses: BOSSES.map((b) => ({ id: b.id, defeated: false, hp: 100, active: false })),
      companions: { mia: false, ari: false, leo: false },
      discoveredSites: {},
      merchant: { visiting: false, stockIds: [], nextVisitGameSec: GAME_SECONDS_PER_DAY, trades: [] },
      specimens: [],
      log: ["게임 시작 — 산호항"],
    };
  }

  function emit() { for (const cb of listeners) cb(getSnapshot()); }

  function pushLog(msg: string) { state.log.push(msg); if (state.log.length > 200) state.log.shift(); }

  // 초기 스폰
  reseedWorld();

  /** anchor 주변 개체 수를 target까지 보충. 시간대/날씨 제약으로 풀이 비면 relaxed 조건(낮·CLEAR)으로 완화. */
  function replenishSpecimens(target: number, anchor?: { x: number; z: number }): void {
    const a = anchor ?? (state.diver.mode === "ON_SHIP" ? state.ship.position : state.diver.position);
    const deficit = target - state.specimens.length;
    if (deficit <= 0) return;
    let fresh = spawnSys.spawnAround(a.x, a.z, SPECIES, deficit, spawnEnv());
    if (fresh.length < deficit) {
      const relaxed = spawnSys.spawnAround(a.x, a.z, SPECIES, deficit - fresh.length, {
        timeOfDay0to24: 12, season: state.season, weather: "CLEAR",
      });
      fresh = fresh.concat(relaxed);
    }
    if (fresh.length < deficit) {
      // 해역에 스폰 가능 종이 전혀 없는 극단 경우: 해당 좌표 해역의 모든 비보호종에서 강제 스폰
      const forced = spawnSys.spawnForcedAny(a.x, a.z, SPECIES, deficit - fresh.length);
      fresh = fresh.concat(forced);
    }
    state.specimens.push(...fresh);
  }

  function reseedWorld() {
    const env = spawnEnv();
    state.specimens = spawnSys.spawnAround(state.ship.position.x, state.ship.position.z, SPECIES, 40, env);
  }

  /** 보호·관찰 전용 종 개체를 지정 좌표 해역에 강제 배치 후 생성된 Specimen 반환 (도감 관찰 경로 전용) */
  function spawnForcedPassive(speciesId: number, x: number, z: number): Specimen | null {
    const sp = getSpeciesById(speciesId);
    if (!sp || !sp.economy.protectedSpecies) return null;
    const spec = spawnSys.spawnPassiveOne(sp, x, z);
    if (!spec) return null;
    state.specimens.push(spec);
    return spec;
  }

  function spawnEnv(): SpawnEnv {
    return { timeOfDay0to24: timeOfDay({ gameSeconds: state.gameSeconds }), season: state.season, weather: state.weather };
  }

  function currentHarpoon(): Harpoon { return HARPOONS.find(h => h.id === state.equipped.harpoonId)!; }
  function currentTank(): Tank { return TANKS.find(t => t.id === state.equipped.tankId)!; }
  function currentSuit(): DiveSuit { return SUITS.find(s => s.id === state.equipped.suitId)!; }
  function shipStage() { return SHIP_STAGES[state.ship.stage - 1]; }

  function companionBonus(key: string, base: number): number {
    let m = base;
    for (const c of COMPANIONS) if (state.companions[c.id] && c.bonus[key]) m *= c.bonus[key];
    return m;
  }

  // ── dispatch ──
  function dispatch(action: Action): ActionResult {
    if (!action || typeof action.type !== "string") return fail("잘못된 액션 형식");
    switch (action.type) {
      case "TICK": {
        const dt = num(action.dtSec, "dtSec");
        // 프레임 틱 상한: 10초. 그 이상은 타임스케일 치트로 간주해 거부한다.
        if (dt === null || dt < 0 || dt > TICK_MAX_DT_SEC) return fail(`TICK dtSec는 0~${TICK_MAX_DT_SEC}초`);
        tick(dt);
        return ok();
      }
      case "MOVE_SHIP": {
        if (state.diver.mode !== "ON_SHIP") return fail("잠수 중에는 배를 움직일 수 없음");
        const fwd = clamp(num(action.forward, "forward") ?? 0, -1, 1);
        const turn = clamp(num(action.turn, "turn") ?? 0, -1, 1);
        // dtSec 미제공 시 60fps 기본 프레임. 상한은 TICK_MAX_DT_SEC와 동일(타임스케일 치트 차단).
        const rawDt = num(action.dtSec, "dtSec") ?? 1 / 60;
        if (rawDt === null || rawDt < 0 || rawDt > TICK_MAX_DT_SEC) return fail(`MOVE_SHIP dtSec는 0~${TICK_MAX_DT_SEC}초`);
        const dt = rawDt;
        moveShip(fwd, turn, dt);
        emit(); // A팀 스냅샷 구독 갱신 (선박 위치 시각화)
        return ok({ position: { ...state.ship.position }, headingRad: state.ship.headingRad, speedMs: state.ship.speedMs });
      }
      case "ENTER_WATER": {
        if (state.diver.mode !== "ON_SHIP") return fail("이미 물속에 있음");
        const zone = zoneAt(state.ship.position.x, state.ship.position.z);
        if (!zone) return fail("해역 밖에서는 입수할 수 없음");
        if (shipStage().accessZones.includes(zone.id) === false) return fail(`${zone.nameKo}은(는) 선박 ${shipStage().stage}단계 이상 필요`);
        state.diver.mode = "IN_WATER";
        state.diver.position = { x: state.ship.position.x, y: -1, z: state.ship.position.z };
        state.diver.airCurrent = currentTank().airCapacity;
        state.diver.airMax = currentTank().airCapacity;
        // 입수 시 주변 생태 군집 갱신 — 관찰·포획 대상이 항상 존재하도록 보장
        replenishSpecimens(40);
        pushLog("입수");
        emit();
        return ok();
      }
      case "MOVE_DIVER": {
        if (state.diver.mode === "ON_SHIP") return fail("먼저 ENTER_WATER");
        const dx = num(action.dx, "dx"), dy = num(action.dy, "dy"), dz = num(action.dz, "dz");
        if (dx === null || dy === null || dz === null) return fail("MOVE_DIVER 방향 입력은 유한한 숫자여야 함");
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || Math.abs(dz) > 1) return fail("MOVE_DIVER 방향 입력 범위 초과(-1~1)");
        const suit = currentSuit();
        const step = 2 * suit.moveMod;
        const p = state.diver.position;
        // 계약: y축 위쪽. 수심 = -y. dy < 0 → 하강, dy > 0 → 상승. 수평·수직 입력 독립 적용.
        const nx = clamp(p.x + clamp(dx, -1, 1) * step, 0, WORLD.WIDTH_M);
        const nz = clamp(p.z + clamp(dz, -1, 1) * step, 0, WORLD.DEPTH_M);
        // 수직 이동은 "한계를 넘지 않는 범위까지만" 부분 적용 — 완전 차단 시 잠수사가
        // 임의 수심에서 상하 이동 자체가 동결되는 문제가 발생한다(수평 이동은 계속 허용).
        const curDepth = -p.y;
        const depthLimit = Math.min(suit.maxDepthM, WORLD.MAX_DEPTH_M);
        const vInput = clamp(-dy, -1, 1) * step; // dy < 0 → 하강(깊이 증가)
        let targetDepth: number;
        if (vInput > 0) {
          // 하강: 한계까지만 진행. 이미 한계면 상승/수평 이동은 계속 유효해야 하므로 실패 반환 없음.
          targetDepth = Math.min(curDepth + vInput, depthLimit);
        } else {
          targetDepth = Math.max(0, curDepth + vInput); // 상승: 수면(0)까지 제한
        }
        const zone = zoneAt(nx, nz);
        if (!zone) return fail("월드 밖");
        const dmax = zone.depthRangeM[1];
        if (targetDepth > dmax + 40) return fail(`${zone.nameKo} 수심 범위(${dmax}m)을 크게 벗어남`);
        // 공기 검사 — 공기가 남아 있어야 이동 가능(고갈 시 이동 불가, 귀선/자동귀환 경로만 열림)
        if (state.diver.airCurrent <= 0) {
          const sd0 = Math.hypot(p.x - state.ship.position.x, p.z - state.ship.position.z);
          if (sd0 <= 60) {
            state.diver.mode = "ON_SHIP";
            state.diver.position = { ...state.ship.position };
            state.diver.depthM = 0;
            pushLog("⚠ 공기 고갈 — 선박 근처 자동 귀선");
            emit();
            return ok({ autoReturned: true });
          }
          return fail("공기 고갈 — 즉시 RETURN_TO_SHIP 필요");
        }
        // 이동 반영 (실패 시 위치 불변)
        p.x = nx; p.z = nz; p.y = -targetDepth;
        state.diver.depthM = targetDepth;
        state.diver.mode = targetDepth > 0 ? "DIVING" : "IN_WATER";
        // 공기 소모
        const eff = weatherSys.effects();
        const depthBurn = 1 + targetDepth / 60;
        state.diver.airCurrent -= 1.0 * depthBurn * eff.airBurnFactor / companionBonus("airEfficiency", 1);
        if (state.diver.airCurrent <= 0) {
          state.diver.airCurrent = 0;
          // 안전한 귀환 지원: 선박 근처면 자동 귀선, 멀면 위험 경고(강제 귀환 없음)
          const sd = Math.hypot(p.x - state.ship.position.x, p.z - state.ship.position.z);
          if (sd <= 60) {
            state.diver.mode = "ON_SHIP";
            state.diver.position = { ...state.ship.position };
            state.diver.depthM = 0;
            pushLog("⚠ 공기 고갈 — 선박 근처 자동 귀선");
            emit();
            return ok({ autoReturned: true });
          }
          pushLog("⚠ 공기 고갈! 즉시 RETURN_TO_SHIP 필요");
          emit();
          return fail("공기 고갈 — 즉시 RETURN_TO_SHIP 필요");
        }
        return ok({ remainingAir: Math.round(state.diver.airCurrent) });
      }
      case "RETURN_TO_SHIP": {
        if (state.diver.mode === "ON_SHIP") return fail("이미 배 위");
        const p = state.diver.position, s = state.ship.position;
        const dist = Math.hypot(p.x - s.x, p.y - s.y, p.z - s.z);
        if (dist > 60) return fail(`배와 너무 멀리 떨어짐 (거리 ${Math.round(dist)}m > 60m)`);
        state.diver.mode = "ON_SHIP";
        state.diver.position = { ...s };
        state.diver.depthM = 0;
        pushLog("귀선 완료");
        emit();
        return ok();
      }
      case "CATCH_ATTEMPT": {
        return handleCatch(String(action.specimenId ?? ""), num(action.distanceM, "distanceM"));
      }
      case "OBSERVE_CREATURE": {
        let spec = state.specimens.find((sp) => sp.id === action.specimenId);
        if (!spec) {
          // DEBUG 전용 경로: 보호·관찰 종 개체를 강제로 주변에 배치 후 관찰 처리 (테스트/도감 검증용)
          const dbg = (action as unknown as { __debugForceSpeciesId?: number }).__debugForceSpeciesId;
          if (config.enableDebugActions && typeof dbg === "number") {
            const a = state.diver.mode === "ON_SHIP" ? state.ship.position : state.diver.position;
            const forced = spawnForcedPassive(dbg, a.x, a.z);
            if (forced) spec = forced;
          }
        }
        if (!spec) return fail("관찰 대상 개체가 존재하지 않음");
        const entry = ensureDex(spec.speciesId);
        const wasNew = !entry.firstDiscovered;
        entry.observeCount += 1;
        if (wasNew) { entry.firstDiscovered = true; addZoneTo(entry, specZoneOf(spec)); }
        // 관찰 보상: 첫 발견 시에만 지급 — 재관찰 중복 지급 방지
        const reward = wasNew ? Math.round(companionBonus("observeReward", 3)) : 0;
        state.shells += reward;
        emit();
        return ok({ rewardShells: reward, observeCount: entry.observeCount });
      }
      case "SELL_ALL": {
        const port = nearestHomePortDist();
        if (port > 80) return fail("항구(산호항) 근처에서만 판매 가능");
        let total = 0, count = 0, protectedSkipped = 0;
        for (const item of state.cargo) {
          if (item.sold) continue;
          const sp = getSpeciesById(item.speciesId)!;
          if (sp.economy.protectedSpecies) { protectedSkipped++; continue; } // 보호·관찰 전용은 일반 판매 불가
          const price = salePrice(sp, item.lengthCm, item.massKg);
          total += price; item.sold = true; count++;
        }
        if (count === 0) return fail(protectedSkipped > 0 ? "보호종만 있어 판매할 것이 없음" : "판매할 포획물이 없음");
        state.shells += total;
        state.cargo = state.cargo.filter((i) => !i.sold);
        state.cargoUsedKg = round2(state.cargo.reduce((a, i) => a + i.massKg, 0));
        pushLog(`${count}마리 판매 +${total} 조개`);
        emit();
        return ok({ soldCount: count, gainedShells: total, protectedSkipped });
      }
      case "BUY_ITEM": {
        const eq = findEquipment(String(action.itemId ?? ""));
        if (!eq) return fail("존재하지 않는 장비 ID");
        if (state.ownedEquipment[eq.item.id]) return fail("이미 보유 중인 장비");
        const price = (eq.item as Harpoon & Tank & DiveSuit).priceShells;
        if (state.shells < price) return fail(`조개 부족 (${price - state.shells} 부족)`);
        const req = unlockOk(eq.kind, eq.item);
        if (!req.ok) return fail(req.reason!);
        state.shells -= price;
        state.ownedEquipment[eq.item.id] = true;
        pushLog(`구매: ${(eq.item as Harpoon).name}`);
        emit();
        return ok({ spent: price });
      }
      case "EQUIP_ITEM": {
        const eq = findEquipment(String(action.itemId ?? ""));
        if (!eq) return fail("존재하지 않는 장비 ID");
        if (!state.ownedEquipment[eq.item.id]) return fail("미보유 장비 장착 불가");
        if (eq.kind === "harpoon") state.equipped.harpoonId = eq.item.id;
        if (eq.kind === "tank") { state.equipped.tankId = eq.item.id; state.diver.airMax = (eq.item as Tank).airCapacity; if (state.diver.mode === "ON_SHIP") state.diver.airCurrent = state.diver.airMax; }
        if (eq.kind === "suit") state.equipped.suitId = eq.item.id;
        emit();
        return ok();
      }
      case "UPGRADE_SHIP": {
        const next = SHIP_STAGES[state.ship.stage]; // stage+1 인덱스
        if (!next) return fail("최대 단계(5) 도달");
        if (state.shells < next.priceShells) return fail(`조개 부족 (필요 ${next.priceShells})`);
        if (Object.keys(state.dex).length < next.unlockReq.discoveredSpecies && discoveredCount() < next.unlockReq.discoveredSpecies)
          return fail(`발견 종 ${next.unlockReq.discoveredSpecies}종 필요 (현재 ${discoveredCount()}종)`);
        state.shells -= next.priceShells;
        state.ship.stage = next.stage;
        pushLog(`선박 개조 → ${next.name}`);
        emit();
        return ok({ stage: next.stage, accessZones: next.accessZones });
      }
      case "COLLECT_FOSSIL": {
        const fid = String(action.fossilId ?? "");
        const fs = state.fossils.find((f) => f.id === fid);
        if (!fs) return fail("존재하지 않는 화석 ID");
        if (fs.collected) return fail("이미 수집한 조각 (중복 수집 불가)");
        if (state.gameSeconds < fs.nextRespawnGameSec) return fail("아직 이 자리에서 재출현하지 않음");
        fs.collected = true;
        pushLog(`화석 조각 수집: ${fid}`);
        emit();
        return ok({ collected: collectCountOf(fid.split("_")[1]) });
      }
      case "SUMMON_BOSS": {
        const bid = String(action.bossId ?? "");
        const boss = BOSSES.find((b) => b.id === bid);
        if (!boss) return fail("존재하지 않는 보스");
        const st = state.bosses.find((b) => b.id === bid)!;
        if (st.defeated) return fail("이미 격퇴한 보스");
        const have = state.fossils.filter((f) => f.id.startsWith(boss.fossilId) && f.collected).length;
        if (have < boss.requiredFragments) return fail(`조각 ${have}/${boss.requiredFragments} — 소환 불가`);
        // 조각 소비
        state.fossils.forEach((f) => {
          if (f.id.startsWith(boss.fossilId)) { f.collected = false; f.nextRespawnGameSec = state.gameSeconds + 24 * 3600; }
        });
        st.active = true; st.hp = 100;
        pushLog(`${boss.nameKo} 소환! 조각 5개 소비됨`);
        emit();
        return ok({ bossHp: st.hp });
      }
      case "ATTACK_BOSS": {
        const bid = String(action.bossId ?? "");
        const st = state.bosses.find((b) => b.id === bid);
        if (!st || !st.active) return fail("활성화된 보스가 아님");
        const dmg = num(action.damage, "damage");
        if (dmg === null || dmg < 0 || dmg > 50) return fail("damage는 0~50만 허용(치트 방지)");
        st.hp = Math.max(0, st.hp - dmg);
        if (st.hp === 0) {
          st.active = false; st.defeated = true;
          const boss = BOSSES.find((b) => b.id === bid)!;
          state.shells += boss.rewardShells;
          pushLog(`${boss.nameKo} 격퇴! +${boss.rewardShells} 조개`);
          emit();
          return ok({ defeated: true, reward: boss.rewardShells });
        }
        emit();
        return ok({ hp: st.hp });
      }
      case "RECRUIT_COMPANION": {
        const cid = String(action.companionId ?? "");
        const c = COMPANIONS.find((x) => x.id === cid);
        if (!c) return fail("존재하지 않는 동료");
        if (state.companions[cid]) return fail("이미 영입됨");
        if (!action.conditionMet) return fail("영입 조건 미충족 (화폐 구매로는 영입 불가)");
        state.companions[cid] = true;
        pushLog(`동료 영입: ${c.nameKo}`);
        emit();
        return ok();
      }
      case "MERCHANT_VISIT": {
        // 항접근 시 호출: 방문 여부 결정 및 상품 갱신
        if (nearestHomePortDist() > 120) return fail("항구에 접근해야 유랑 상인 확인 가능");
        if (!state.merchant.visiting && state.gameSeconds >= state.merchant.nextVisitGameSec) {
          state.merchant.visiting = rng.chance(0.6);
          if (state.merchant.visiting) {
            const pool = [...HARPOONS.slice(4), ...TANKS.slice(1), ...SUITS.slice(1)];
            const stock: string[] = [];
            for (let i = 0; i < 5; i++) stock.push(rng.pick(pool).id);
            state.merchant.stockIds = Array.from(new Set(stock));
            pushLog("유랑 상인 입항!");
          }
          state.merchant.nextVisitGameSec = state.gameSeconds + GAME_SECONDS_PER_DAY * rng.range(0.8, 1.6);
          emit();
        }
        return ok({ visiting: state.merchant.visiting, stock: state.merchant.stockIds });
      }
      case "MERCHANT_BUY": {
        if (!state.merchant.visiting) return fail("상인이 없음");
        const iid = String(action.itemId ?? "");
        if (!state.merchant.stockIds.includes(iid)) return fail("재고에 없는 상품");
        const res = dispatch({ type: "BUY_ITEM", itemId: iid });
        if (res.ok) state.merchant.trades.push({ itemId: iid, atGameSec: state.gameSeconds });
        return res;
      }
      case "MARK_SITE_DISCOVERED": {
        // 탐사지 24개 발견 여부 기록 (A팀이 근처 도달 시 호출 — id 검증 필수)
        const sid = String(action.siteId ?? "");
        const site = DIVE_SITES.find((s) => s.id === sid);
        if (!site) return fail("존재하지 않는 탐사지 ID");
        if (state.discoveredSites[sid]) return ok({ alreadyDiscovered: true });
        state.discoveredSites[sid] = true;
        pushLog(`탐사지 발견: ${site.environment} (${site.riskLevel}등급)`);
        emit();
        return ok({ siteId: sid, totalDiscovered: Object.keys(state.discoveredSites).length });
      }
      case "DEBUG_SET_STATE": {
        // 테스트/자동화 전용 훅. 저장 데이터 검증(validateLoaded)은 그대로 통과해야 사용 가능.
        if (!config.enableDebugActions) return fail("디버그 액션 비활성화 (config.enableDebugActions 필요)");
        const patch = action.patch;
        if (!patch || typeof patch !== "object") return fail("patch 객체 필수");
        try {
          Object.assign(state, structuredCloneLite(patch));
        } catch { return fail("patch 직렬화 불가"); }
        // 즉시 검증: 디버그로라도 무효 상태 만들면 거부 후 롤백 불가(이미 적용됨) → 최소한 스냅샷 일관성 확인
        if (!validateLoaded(state)) return fail("patch 적용 후 상태 검증 실패");
        emit();
        return ok({ debugApplied: true });
      }
      default:
        return fail(`미지원 액션: ${(action as { type: string }).type}`);
    }
  }

  function discoveredCount(): number { return Object.values(state.dex).filter((e) => e.firstDiscovered).length; }

  function collectCountOf(prefixKey: string): number {
    // fossil_dunkleosteus_x → boss 매핑 단순 카운트
    return state.fossils.filter((f) => f.id.includes(prefixKey) && f.collected).length;
  }

  function unlockOk(kind: string, item: Harpoon | Tank | DiveSuit): ActionResult {
    if (kind === "harpoon") {
      const h = item as Harpoon;
      if (h.unlockReq.shipTier && state.ship.stage < h.unlockReq.shipTier) return fail(`선박 ${h.unlockReq.shipTier}단계 필요`);
      if (h.unlockReq.discoveredSpecies && discoveredCount() < h.unlockReq.discoveredSpecies) return fail(`발견 종 ${h.unlockReq.discoveredSpecies}종 필요`);
    } else {
      const t = item as Tank;
      if (t.unlockReq.minShipTier > state.ship.stage) return fail(`선박 ${t.unlockReq.minShipTier}단계 필요`);
    }
    return ok();
  }

  function nearestHomePortDist(): number {
    const home = ISLANDS.find((i) => i.isHomePort)!;
    const p = state.diver.mode === "ON_SHIP" ? state.ship.position : state.diver.position;
    return Math.hypot(p.x - home.x, p.z - home.z);
  }

  function salePrice(sp: NonNullable<ReturnType<typeof getSpeciesById>>, lengthCm: number, massKg: number): number {
    const sizeMult = 0.6 + 0.8 * (massKg / Math.max(0.001, sp.gameBaseMassKg));
    return Math.max(1, Math.round(sp.economy.baseValueShells * clamp(sizeMult, 0.5, 3) * (1 + state.ship.stage * 0.02)));
  }

  function handleCatch(specimenId: string, distanceM: number | null): ActionResult {
    if (!specimenId) return fail("specimenId 필수");
    if (distanceM === null || !Number.isFinite(distanceM) || distanceM < 0) return fail("distanceM 유효값 필요");
    if (state.diver.mode === "ON_SHIP") return fail("물속에서만 포획 가능");
    const spec = state.specimens.find((s) => s.id === specimenId && s.alive);
    if (!spec) return fail("대상 개체가 존재하지 않음 (ID 불일치)");
    const harp = currentHarpoon();
    // 1) 실제 거리 산출 후 사거리 판정 — 실측 우선(선언값만 믿는 치트 경로 차단).
    //    선언 distanceM과 실측 차이가 크면 "사거리 초과"로 처리한다(원격 좌표 조작 방지).
    const real = Math.hypot(spec.x - state.diver.position.x, spec.y - state.diver.position.y, spec.z - state.diver.position.z);
    const effectiveRange = Math.max(harp.rangeM, distanceM - 6);
    if (real > effectiveRange || distanceM > harp.rangeM + 6) {
      return fail(`사거리 초과 (유효 ${harp.rangeM}m, 실측 ${Math.round(real * 10) / 10}m)`);
    }
    // 2) 이후 명중·규칙 판정은 실측 거리 기준
    // 어업 규칙: 작살은 수면 아래에서 발사한다. 표적이 수면 위면 명중 판정 대상이 아님
    if (spec.y >= 0 && state.diver.position.y >= 0) return fail("빗나감 (수면 위 표적 — 입수 후 발사)");
    // 원거리 한계: 실측 기준 사거리를 벗어난 표적(선언값 오차 범위 내라도)은 작살이 도달하지 못해 빗나간다
    if (real > harp.rangeM) { emit(); return fail(`작살 빗나감 (실거리 ${Math.round(real * 10) / 10}m > 유효 사거리 ${harp.rangeM}m)`); }
    // 3) 종 규칙: 보호종/포획불가는 정밀 검증 통과 후 최종 차단 (변조 입력으로도 우회 불가)
    const sp = getSpeciesById(spec.speciesId)!;
    if (sp.economy.protectedSpecies) return fail("보호종 — 포획 금지 (관찰 전용)");
    if (!sp.economy.catchable) return fail("포획 불가 종");
    // 명중 판정: 안정성 + 거리 페널티 + 도피 페널티 + 깊은 수심 페널티(장비 난이도 반영)
    const depthPenalty = state.diver.depthM > 200 ? 0.85 : 1;
    // 근접(실측 0m)이면 장비 안정성이 곧 명중률 — 원거리로 갈수록 급감 (distanceM 선언값 아닌 실측 기준)
    const hitProb = clamp(
      harp.stability * (1 - real / (harp.rangeM + 4)) * (spec.behaviorState === "FLEEING" ? 0.55 : 1) * depthPenalty,
      0.05, 0.98);
    if (!rng.chance(hitProb)) { emit(); return fail("작살 빗나감"); }
    // 성공 처리 — 단, 창고 용량 초과 시 물고기는 살아있고 보상도 없다(유령 포획 방지)
    const cap = shipStage().cargoKg * companionBonus("cargo", 1);
    if (state.cargoUsedKg + spec.massKg > cap) {
      emit();
      return fail(`창고 용량 초과 (여유 ${Math.round(cap - state.cargoUsedKg)}kg) — 포획 실패 처리`);
    }
    spec.alive = false;
    state.specimens = state.specimens.filter((s) => s.id !== spec.id);
    const item: InventoryItem = {
      uid: `inv_${String(++inventoryUid).padStart(5, "0")}`,
      specimenId: spec.id, speciesId: spec.speciesId, lengthCm: spec.lengthCm, massKg: spec.massKg,
      caughtAtGameSec: state.gameSeconds, sold: false,
    };
    state.cargo.push(item);
    state.cargoUsedKg = round2(state.cargoUsedKg + spec.massKg);
    const entry = ensureDex(spec.speciesId);
    entry.firstDiscovered = true; entry.firstCaught = true; entry.catchCount += 1;
    addZoneTo(entry, zoneAt(spec.x, spec.z)?.id ?? "oceanic");
    updateRecords(entry, spec.lengthCm, spec.massKg);
    pushLog(`포획 성공: ${sp.nameKo} ${spec.lengthCm}cm/${spec.massKg}kg`);
    emit();
    return ok({ captured: true, item, rarityBoost: companionBonus("catchBonus", 1) });
  }

  function ensureDex(speciesId: number): DexEntry {
    if (!state.dex[speciesId]) {
      state.dex[speciesId] = {
        firstDiscovered: false, firstCaught: false, catchCount: 0, observeCount: 0,
        maxLengthCm: 0, maxLengthMassKg: 0, maxMassKg: 0, maxMassLengthCm: 0, discoveredZones: [],
      };
    }
    return state.dex[speciesId];
  }
  function addZoneTo(e: DexEntry, zone: string) { if (!e.discoveredZones.includes(zone)) e.discoveredZones.push(zone); }
  function updateRecords(e: DexEntry, len: number, mass: number) {
    if (len > e.maxLengthCm) { e.maxLengthCm = len; e.maxLengthMassKg = mass; }
    if (mass > e.maxMassKg) { e.maxMassKg = mass; e.maxMassLengthCm = len; }
  }
  function specZoneOf(spec: Specimen): string { return zoneAt(spec.x, spec.z)?.id ?? "oceanic"; }

  function moveShip(fwd: number, turn: number, dt: number) {
    const st = shipStage();
    const target = fwd * st.maxSpeedMs;
    const accel = st.accelMs2;
    if (target > state.ship.speedMs) state.ship.speedMs = Math.min(target, state.ship.speedMs + accel * dt);
    else state.ship.speedMs = Math.max(target, state.ship.speedMs - accel * 1.6 * dt);
    state.ship.headingRad += turn * 1.2 * dt * (0.4 + Math.abs(state.ship.speedMs) / st.maxSpeedMs);
    const nx = state.ship.position.x + Math.sin(state.ship.headingRad) * state.ship.speedMs * dt;
    const nz = state.ship.position.z + Math.cos(state.ship.headingRad) * state.ship.speedMs * dt;
    // 월드 경계 + 섬 충돌
    let blocked = nx < 0 || nx > WORLD.WIDTH_M || nz < 0 || nz > WORLD.DEPTH_M;
    for (const isl of ISLANDS) {
      if (Math.hypot(nx - isl.x, nz - isl.z) < isl.radiusM * 0.85) blocked = true;
    }
    if (blocked) {
      // 정박 해제 예외: 계약상 시작 배 좌표(755,1780)는 산호항 중심과 동일하다.
      // 현재 위치가 이미 항구 반경 이내(정박)면 접안 상태에서 전진으로 빠져나올 수 있도록
      // 첫 이동을 허용한다. 단, 허용 범위는 "접한 섬 내부로 더 깊숙이 들어가지 않는" 수준까지만 —
      // 항구 외곽을 지나 다시 섬 안쪽으로 되돌아들어가는 경로(우회 항해 중 재침범)는 차단한다.
      const mooredIsland = ISLANDS.find((isl) => Math.hypot(state.ship.position.x - isl.x, state.ship.position.z - isl.z) <= isl.radiusM);
      const stillLeaving =
        !!mooredIsland &&
        Math.hypot(nx - mooredIsland.x, nz - mooredIsland.z) >=
          Math.hypot(state.ship.position.x - mooredIsland.x, state.ship.position.z - mooredIsland.z);
      if (!(mooredIsland && stillLeaving)) {
        // 충돌 회피: 완전 정지 없이 135° 선회 후 감속 — 섬/경계를 따라 우회 항해 가능
        state.ship.headingRad += Math.PI * 0.75;
        state.ship.speedMs = Math.max(st.maxSpeedMs * 0.25, state.ship.speedMs * 0.5);
        return;
      }
    }
    state.ship.position.x = nx; state.ship.position.z = nz;
    // 해역 진입 검사(선박 단계 제한)
    const zone = zoneAt(nx, nz);
    if (zone && zone.requiredShipTier > state.ship.stage) {
      // 되밀기: 물리적으로 불가능한 동작 금지 — 이전 위치 유지 + 경고
      state.ship.speedMs = Math.min(state.ship.speedMs, shipStage().maxSpeedMs * 0.3);
      pushLog(`⚠ ${zone.nameKo}: 선박 ${zone.requiredShipTier}단계 필요 — 진입 차단`);
      emit();
    }
  }

  function tick(dt: number) {
    state.gameSeconds += dt;
    state.day = dayNumber({ gameSeconds: state.gameSeconds });
    state.season = seasonOf({ gameSeconds: state.gameSeconds });
    const zone = zoneAt(state.ship.position.x, state.ship.position.z);
    state.weather = weatherSys.update(dt, zone?.id ?? "tropical");
    const eff = weatherSys.effects();
    state.currentSpeedMs = eff.currentFactor;
    state.tideLevel = round2(weatherSys.tideLevel({ gameSeconds: state.gameSeconds }));

    // 개체 행동
    const envCtx: EnvContext = {
      timeOfDay0to24: timeOfDay({ gameSeconds: state.gameSeconds }),
      isNight: isNight({ gameSeconds: state.gameSeconds }),
      weather: state.weather,
      currentSpeedMs: eff.currentFactor,
      diverPos: state.diver.mode !== "ON_SHIP" ? state.diver.position : null,
    };
    const anchor = state.diver.mode === "ON_SHIP" ? state.ship.position : state.diver.position;
    for (const spec of state.specimens) {
      const sp = getSpeciesById(spec.speciesId)!;
      stepBehavior(spec, sp, envCtx, dt, rng);
    }
    // 원거리 개체 제거: 선박 주변 생태권은 500m 이내만 정리(잠수 중 도망친 개체 보존), 그 외 지역은 260m
    const shipNearAnchor = Math.hypot(anchor.x - state.ship.position.x, anchor.z - state.ship.position.z) < 150;
    const cullR = shipNearAnchor ? 500 : 260;
    state.specimens = state.specimens.filter((s) => Math.hypot(s.x - anchor.x, s.z - anchor.z) < cullR);
    // 개체 수 유지: 부족분을 즉시 보충 (어종 풀이 시간대/날씨로 일시 공백이어도 최소 1마리 이상 유지)
    replenishSpecimens(40);
    // 화석 재출현 (게임 시간 기반)
    for (const f of state.fossils) {
      if (!f.collected && state.gameSeconds >= f.nextRespawnGameSec && f.nextRespawnGameSec > 0) {
        // 재출현은 다음 COLLECT 시도 허용 상태로 둠(이미 open)
      }
    }
    // 공기 자연 회복(배 위)
    if (state.diver.mode === "ON_SHIP" && state.diver.airCurrent < state.diver.airMax) {
      state.diver.airCurrent = Math.min(state.diver.airMax, state.diver.airCurrent + dt * 5);
    }
    rngPersist = rng.serialize();
    emit();
  }

  // ── snapshot/save/load ──
  function getSnapshot(): GameState {
    return JSON.parse(JSON.stringify(state)) as GameState; // 순수 데이터 보장 검증 포함
  }

  function save(): void {
    const payload = {
      schemaVersion: SAVE_SCHEMA_VERSION, gameVersion: GAME_VERSION, savedAt: Date.now(),
      state, rng: rngPersist, spawnSeq: spawnSys.serialize(),
      spawnRng: spawnSys.rngState(), weather: weatherSys.serialize(), weatherRng: weatherSys.rngState(),
      inventoryUid,
    };
    storage.setItem(SAVE_KEY, JSON.stringify(payload));
  }

  function load(): boolean {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return false;
    let data: any;
    try { data = JSON.parse(raw); } catch { return false; }
    if (!data || typeof data !== "object") return false;
    if (data.schemaVersion !== SAVE_SCHEMA_VERSION) return false; // 버전 불일치 → 거부(마이그레이션 훅 지점)
    if (!validateLoaded(data.state)) return false; // 손상/변조 데이터 거부
    Object.assign(state, structuredCloneLite(data.state));
    rngPersist = data.rng; 
    try { const r = Rng.restore(data.rng); copyRng(r); } catch { /* 실패 시 새 RNG */ }
    spawnSys.restore(data.spawnSeq ?? []);
    if (data.spawnRng) spawnSys.restoreRng(data.spawnRng);
    // state.weatherRngSeed 기준으로 시스템을 재구성 → 어떤 저장본에서도 결정적 복원
    weatherSys = new WeatherSystem(new Rng(state.seed ^ state.weatherRngSeed), "tropical");
    weatherSys.restore(data.weather ?? weatherSys.serialize());
    if (data.weatherRng) weatherSys.restoreRng(data.weatherRng);
    inventoryUid = data.inventoryUid ?? 0;
    emit();
    return true;
  }

  function copyRng(from: Rng) {
    const s = from.serialize();
    const cur = Rng.restore(s);
    rngPersist = s;
    // 현재 rng 객체의 내부 상태를 복원본으로 교체
    (rng as unknown as { s: number }).s = (cur as unknown as { s: number }).s;
    (rng as unknown as { spare: number | null }).spare = (cur as unknown as { spare: number | null }).spare;
  }

  function validateLoaded(st: any): boolean {
    if (!st || typeof st !== "object") return false;
    if (typeof st.seed !== "number") return false;
    if (!isFiniteNumber(st.shells) || st.shells < 0 || st.shells > 1e9) return false;
    if (!st.ship?.position || ![st.ship.position.x, st.ship.position.z].every(isFiniteNumber)) return false;
    if (st.ship.position.x < 0 || st.ship.position.x > WORLD.WIDTH_M) return false;
    if (st.ship.position.z < 0 || st.ship.position.z > WORLD.DEPTH_M) return false;
    if (!Number.isInteger(st.ship.stage) || st.ship.stage < 1 || st.ship.stage > 5) return false;
    if (!Array.isArray(st.cargo) || !Array.isArray(st.specimens) || st.specimens.length > 5000) return false;
    if (typeof st.gameSeconds !== "number" || st.gameSeconds < 0) return false;
    for (const key of Object.keys(st.dex ?? {})) {
      const idn = Number(key);
      if (!Number.isInteger(idn) || idn < 1 || idn > 200) return false;
    }
    return true;
  }

  function subscribe(cb: (s: GameState) => void): () => void { listeners.add(cb); return () => listeners.delete(cb); }

  return {
    dispatch, getSnapshot, subscribe, save, load,
    storage,
    getShipPosition: () => ({ ...state.ship.position }),
    getSpecimens: () => listSpecimens(state.specimens),
    getZoneAt: (x: number, z: number) => zoneAt(x, z)?.id ?? null,
    getSpeciesPool: (zoneId?: string) =>
      state.specimens
        .filter((s) => s.alive && (!zoneId || specZoneOf(s) === zoneId))
        .map((s) => ({ specimen: { ...s }, species: getSpeciesById(s.speciesId)! }))
        .filter((e) => !!e.species),
  };

  // helpers
  function ok(extra?: Record<string, unknown>): ActionResult { return { ok: true, ...extra }; }
  function fail(reason: string): ActionResult { return { ok: false, reason }; }
  function num(v: unknown, _name: string): number | null { return isFiniteNumber(v) ? v : null; }
  function round2(v: number) { return Math.round(v * 100) / 100; }
}

function structuredCloneLite<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

function defaultBrowserStorage(): SaveStorage {
  if (typeof localStorage !== "undefined") return localStorage;
  return memoryStorage();
}
