// OCEAN GAIA V3.2 — 메인 게임 엔진 (세션 B)
// Three.js import 금지. 순수 JS. createGame(config) → { dispatch, getSnapshot, subscribe, save, load }
import { SeededRNG } from './Rng.js';
import { WORLD_CONFIG, clamp } from './units.js';
import { buildSpecies, makeSpecimen, weightFromLength, ZONES } from '../data/species.js';
import { SPEARS, TANKS, SUITS, SHIP_UPGRADES } from '../data/equipment.js';
import { ISLANDS, DIVE_SITES, COMPANIONS, BOSSES, FOSSILS, zoneAt } from '../data/world.js';

const GAME_VERSION = '3.2.0';
const SPECIMEN_CAP_PER_ZONE = 40;

export function createGame(config = {}) {
  const seed = config.seed ?? 12345;
  const species = config.species ?? buildSpecies();
  const storage = config.storage ?? memoryStorage();
  const rng = new SeededRNG(seed);

  const byId = new Map(species.map(s => [s.id, s]));

  // ---------- 상태 ----------
  const state = {
    version: GAME_VERSION,
    seed,
    timeSec: 8 * 3600,          // 시작: 오전 8시
    day: 1,
    weather: 'clear',
    season: 'spring',
    ship: {
      x: WORLD_CONFIG.startShip.x, y: 0, z: WORLD_CONFIG.startShip.z,
      headingRad: 0, speedMs: 0, level: 1, docked: true,
    },
    diver: {
      inWater: false, x: 0, y: 0, z: 0, depthM: 0,
      air: TANKS[0].airCapacity, maxAir: TANKS[0].airCapacity,
    },
    inventory: [],              // 포획 개체 { specimenId, speciesId, lengthCm, weightKg }
    holdUsedKg: 0,
    shells: 50,                 // 초기 화폐
    equipment: {
      ownedSpears: ['sp01'], ownedTanks: ['tk01'], ownedSuits: ['st01'],
      equippedSpear: 'sp01', equippedTank: 'tk01', equippedSuit: 'st01',
    },
    codex: {},                  // speciesId -> 기록
    specimens: [],              // 활성 개체 + 위치
    nextSpecSeq: 1,
    fossils: {},                // fossilId -> collectedTimeSec|null
    bossState: {},              // bossId -> { defeated:boolean, summoned:boolean }
    companions: {},             // id -> recruited boolean
    discoveredSites: {},        // siteId -> true
    observedCount: 0,
    zonesVisited: ['tropical'],
    maxDepthReachedM: 0,        // 심해 장비 해금용 기록
    weatherChanges: 0,          // 결정론적 날씨 체인 카운터
    log: [],
  };
  for (const f of FOSSILS) state.fossils[f.id] = null;
  for (const b of BOSSES) state.bossState[b.id] = { defeated: false, summoned: false };

  const listeners = new Set();
  const emit = () => listeners.forEach(cb => cb(getSnapshot()));

  // ---------- 스폰 ----------
  // 희귀도 가중치: 낮을수록 자주 등장 (rarity 1→5배 빈도)
  function rarityWeight(r) { return 6 - r; }
  // 출현 조건: nocturnal 종은 야간 우세, 낮 전용종(대형 상어 등)은 주간 우세.
  // seasonCold=true 종은 여름에 출현률이 떨어지는 등 게임 밸런스 보정.
  function spawnEligible(sp, hour, season) {
    const night = hour < 5 || hour >= 20;
    if (sp.behaviors.includes('nocturnal') && !night && rng.next() < 0.6) return false;
    if (!sp.behaviors.includes('nocturnal') && night && rng.next() < 0.4) return false;
    if (season === 'winter' && sp.zone === 'tropical' && rng.next() < 0.3) return false;
    return true;
  }
  function weightedPick(pool) {
    let total = 0;
    for (const s of pool) total += rarityWeight(s.rarity);
    let t = rng.next() * total;
    for (const s of pool) { t -= rarityWeight(s.rarity); if (t <= 0) return s; }
    return pool[pool.length - 1];
  }
  function spawnZone(zoneKey, count) {
    const hour = (state.timeSec / 3600) % 24;
    let pool = species.filter(s => s.zone === zoneKey && !s.protected);
    if (!pool.length) pool = species.filter(s => s.zone === zoneKey);
    for (let i = 0; i < count && pool.length; i++) {
      let sp = weightedPick(pool);
      let tries = 0;
      while (!spawnEligible(sp, hour, state.season) && tries++ < 4) sp = weightedPick(pool);
      if (!spawnEligible(sp, hour, state.season)) continue;
      const seq = state.nextSpecSeq++;
      const spec = makeSpecimen(sp, rng, seq);
      const b = boundsOf(zoneKey);
      spec.x = Math.round(b.x0 + rng.next() * (b.x1 - b.x0));
      spec.z = Math.round(b.z0 + rng.next() * (b.z1 - b.z0));
      const dmin = Math.max(sp.depthMinM, ZONES[zoneKey].depthMin);
      const dmax = Math.min(sp.depthMaxM, ZONES[zoneKey].depthMax);
      spec.y = -Math.round((dmin + rng.next() * Math.max(1, dmax - dmin)) * 10) / 10;
      spec.behavior = rng.pick(sp.behaviors);
      spec.zone = zoneKey;
      state.specimens.push(spec);
    }
  }
  function boundsOf(zoneKey) {
    // world.js의 ZONE_BOUNDS 재구성 없이 zoneAt으로 검증되므로 여기서 사각형 정의 복사
    return ZONE_RECT[zoneKey];
  }
  const ZONE_RECT = {
    tropical:   { x0: 400,  z0: 1400, x1: 1800, z1: 2600 },
    mangrove:   { x0: 1800, z0: 1400, x1: 2800, z1: 2600 },
    glacier:    { x0: 400,  z0: 200,  x1: 1800, z1: 1400 },
    volcanic:   { x0: 2800, z0: 200,  x1: 4400, z1: 1400 },
    open_ocean: { x0: 1800, z0: 200,  x1: 2800, z1: 1400 },
    deep_sea:   { x0: 2800, z0: 1400, x1: 4400, z1: 2600 },
  };

  function initialSpawn() {
    state.specimens = [];
    for (const zk of Object.keys(ZONE_RECT)) spawnZone(zk, SPECIMEN_CAP_PER_ZONE);
  }
  initialSpawn();

  // ---------- 유틸 ----------
  function fail(reason) { return { ok: false, reason }; }
  function ok(extra = {}) { return { ok: true, ...extra }; }
  function addLog(msg) { state.log.push({ t: state.timeSec, msg }); if (state.log.length > 200) state.log.shift(); }
  function spearDef(id) { return SPEARS.find(s => s.id === id); }
  function tankDef(id) { return TANKS.find(t => t.id === id); }
  function suitDef(id) { return SUITS.find(t => t.id === id); }
  function shipDef(level) { return SHIP_UPGRADES.find(u => u.level === level); }
  function holdCapacityKg() {
    const leo = state.companions.leo ? COMPANIONS.find(c => c.id === 'leo').bonus.value : 0;
    return shipDef(state.ship.level).holdKg + leo;
  }
  function isNight() { const h = (state.timeSec / 3600) % 24; return h < 5 || h >= 20; }
  function seasonOf(day) { return ['spring','summer','autumn','winter'][Math.floor(((day - 1) % 148) / 37)]; }

  // ---------- 도감 ----------
  function codexEntry(sid) {
    if (!state.codex[sid]) {
      state.codex[sid] = { firstSeenSec: null, firstCatchSec: null, catchCount: 0, observeCount: 0,
        longestCm: 0, heaviestKg: 0, lenOfHeaviestCm: 0, wgtOfLongestKg: 0, zones: [] };
    }
    return state.codex[sid];
  }
  function markDiscovered(sid, zoneKey) {
    const e = codexEntry(sid);
    if (e.firstSeenSec == null) e.firstSeenSec = state.timeSec;
    if (zoneKey && !e.zones.includes(zoneKey)) e.zones.push(zoneKey);
  }
  function recordCatch(sid, specimen, zoneKey) {
    const e = codexEntry(sid);
    if (e.firstCatchSec == null) e.firstCatchSec = state.timeSec;
    e.catchCount += 1;
    markDiscovered(sid, zoneKey);
    if (specimen.lengthCm > e.longestCm) { e.longestCm = specimen.lengthCm; e.wgtOfLongestKg = specimen.weightKg; }
    if (specimen.weightKg > e.heaviestKg) { e.heaviestKg = specimen.weightKg; e.lenOfHeaviestCm = specimen.lengthCm; }
  }

  // ---------- 가격 ----------
  function sellPrice(sp, specimen) {
    if (sp.protected) return 0;
    const sizeFactor = specimen.lengthCm / sp.gameLengthCm;
    return Math.round(sp.rarity * 30 * Math.max(0.3, sizeFactor) * (1 + specimen.weightKg / 50));
  }

  // ---------- 액션 처리 ----------
  const handlers = {
    TICK(a) {
      const dt = clamp(a.dtSec ?? 1, 0, 30);
      state.timeSec += dt;
      const dayLen = 24 * 3600;
      state.day = 1 + Math.floor(state.timeSec / dayLen);
      state.season = seasonOf(state.day);
      // 날씨 변화: 게임 내 10분(600s) 경계마다 결정론적 판정 (dt 세분화 보존)
      const WEATHER_INTERVAL = 600;
      const prevMark = Math.floor((state.timeSec - dt) / WEATHER_INTERVAL);
      const curMark = Math.floor(state.timeSec / WEATHER_INTERVAL);
      for (let m = prevMark + 1; m <= curMark; m++) {
        if (rng.next() < 0.25) {
          const w = rng.next();
          state.weather = w < 0.45 ? 'clear' : w < 0.65 ? 'cloudy' : w < 0.78 ? 'rain' : w < 0.88 ? (state.season === 'winter' ? 'snow' : 'rain') : w < 0.95 ? 'fog' : 'storm';
          state.weatherChanges++;
        }
      }
      // 다이버 공기 감소
      if (state.diver.inWater) {
        const depthPenalty = 1 + state.diver.depthM / 100;
        state.diver.air = Math.max(0, state.diver.air - dt * depthPenalty / suitDef(state.equipment.equippedSuit).envMod);
        if (state.diver.air <= 0) {
          // 강제 귀환: 위험 상태 표시
          state.diver.inWater = false; state.diver.depthM = 0; state.diver.y = 0;
          state.diver.x = state.ship.x; state.diver.z = state.ship.z;
          state.shells = Math.max(0, state.shells - 20);
          addLog('공기 고갈 — 구조됨 (조개 20 소모)');
        }
      }
      // 개체 유지: 부족분 재생성 (시드 난수 소비 최소화 — 부족한 해역만 판정)
      for (const zk of Object.keys(ZONE_RECT)) {
        let n = 0;
        for (const s of state.specimens) if (s.zone === zk) n++;
        if (n < SPECIMEN_CAP_PER_ZONE) spawnZone(zk, Math.min(3, SPECIMEN_CAP_PER_ZONE - n));
      }
      // 화석 재출현
      for (const f of FOSSILS) {
        if (state.fossils[f.id] != null && state.timeSec - state.fossils[f.id] > f.respawnSec) {
          state.fossils[f.id] = null;
        }
      }
      return ok();
    },

    MOVE_SHIP(a) {
      const def = shipDef(state.ship.level);
      const fwd = clamp(a.forward ?? 0, -1, 1);
      const turn = clamp(a.turn ?? 0, -1, 1);
      const dt = clamp(a.dtSec ?? 1 / 60, 0, 1);
      if (state.ship.docked && fwd !== 0) return fail('배가 부두에 정박해 있습니다. ENTER_WATER 전에 출항하세요.');
      state.ship.headingRad += turn * 1.5 * dt;
      const target = fwd * def.maxSpeedMs * (state.weather === 'storm' ? 0.6 : 1);
      state.ship.speedMs += (target - state.ship.speedMs) * Math.min(1, dt * 2);
      // 전방 +Z 기준
      const nx = state.ship.x + Math.sin(state.ship.headingRad) * state.ship.speedMs * dt;
      const nz = state.ship.z + Math.cos(state.ship.headingRad) * state.ship.speedMs * dt;
      // 월드 경계
      if (nx < 0 || nx > WORLD_CONFIG.widthM || nz < 0 || nz > WORLD_CONFIG.depthM) return fail('월드 경계를 벗어날 수 없습니다.');
      // 섬 충돌 (출항 직후: 항구 중심에서 150m 이내면 정박 위치에서 출발한 것으로 허용.
      //  그 외 섬/접근 재진입은 40m 이내 금지)
      const start = WORLD_CONFIG.startShip;
      for (const isl of ISLANDS) {
        const dx = nx - isl.x, dz = nz - isl.z;
        const dist2 = dx * dx + dz * dz;
        if (dist2 >= 40 * 40) continue;
        const leavingHarbor = isl.harbor && Math.hypot(state.ship.x - start.x, state.ship.z - start.z) < 150;
        if (!leavingHarbor) return fail(`${isl.name}과(와) 충돌합니다.`);
      }
      state.ship.x = nx; state.ship.z = nz;
      const zk = zoneAt(nx, nz);
      if (!state.zonesVisited.includes(zk)) state.zonesVisited.push(zk);
      // 탐사지 발견
      for (const site of DIVE_SITES) {
        const dx = nx - site.x, dz = nz - site.z;
        if (dx * dx + dz * dz < 100 * 100) state.discoveredSites[site.id] = true;
      }
      return ok({ x: state.ship.x, z: state.ship.z, zone: zk });
    },

    DOCK(a) {
      const isl = ISLANDS.find(i => i.harbor);
      const dx = state.ship.x - isl.x, dz = state.ship.z - isl.z;
      if (dx * dx + dz * dz > 120 * 120) return fail('항구 근처에서만 정박할 수 있습니다.');
      state.ship.docked = true;
      return ok();
    },

    ENTER_WATER(a) {
      if (state.ship.docked) return fail('먼저 출항하세요 (MOVE_SHIP).');
      const suit = suitDef(state.equipment.equippedSuit);
      const tank = tankDef(state.equipment.equippedTank);
      state.diver.inWater = true;
      state.diver.x = a?.x ?? state.ship.x;
      state.diver.z = a?.z ?? state.ship.z;
      state.diver.y = -1;
      state.diver.depthM = 1;
      state.diver.maxAir = tank.airCapacity + (state.companions.ari ? COMPANIONS.find(c=>c.id==='ari').bonus.value : 0);
      state.diver.air = state.diver.maxAir;
      return ok({ maxDepthM: suit.maxDepthM });
    },

    RETURN_TO_SHIP(a) {
      if (!state.diver.inWater) return fail('물에 들어가지 않았습니다.');
      const dx = state.diver.x - state.ship.x, dz = state.diver.z - state.ship.z;
      if (dx * dx + dz * dz > 80 * 80) return fail('선박이 가까워야 귀선할 수 있습니다.');
      state.diver.inWater = false; state.diver.depthM = 0; state.diver.y = 0;
      return ok();
    },

    MOVE_DIVER(a) {
      if (!state.diver.inWater) return fail('다이버가 물속에 있지 않습니다.');
      const suit = suitDef(state.equipment.equippedSuit);
      const tank = tankDef(state.equipment.equippedTank);
      const speed = 2 * suit.moveMod * tank.moveMod;
      const dt = clamp(a.dtSec ?? 1 / 60, 0, 1);
      const mx = clamp(a.dx ?? 0, -1, 1) * speed * dt;
      const mz = clamp(a.dz ?? 0, -1, 1) * speed * dt;
      // 하강: dy>0 = 내려감(깊이 증가). Y좌표는 음수.
      const my = clamp(a.dy ?? 0, -1, 1);
      const ndepth = clamp(state.diver.depthM + my * speed * dt, 0.5, suit.maxDepthM);
      if (ndepth > suit.maxDepthM) return fail(`잠수복 한계 수심 ${suit.maxDepthM}m를 초과할 수 없습니다.`);
      const nx = clamp(state.diver.x + mx, 0, WORLD_CONFIG.widthM);
      const nz = clamp(state.diver.z + mz, 0, WORLD_CONFIG.depthM);
      state.diver.x = nx; state.diver.z = nz; state.diver.depthM = ndepth; state.diver.y = -ndepth;
      if (ndepth > state.maxDepthReachedM) state.maxDepthReachedM = ndepth;
      return ok({ depthM: ndepth });
    },

    CATCH_ATTEMPT(a) {
      if (!state.diver.inWater) return fail('잠수 중이 아닙니다.');
      const sp_id = a.specimenId;
      const idx = state.specimens.findIndex(s => s.specimenId === sp_id);
      if (idx < 0) return fail('존재하지 않는 개체입니다.');
      const specimen = state.specimens[idx];
      const sp = byId.get(specimen.speciesId);
      // 보호종 차단 (거리 판정보다 먼저)
      if (sp.protected) { markDiscovered(sp.id, zoneAt(specimen.x, specimen.z)); return fail('보호종은 포획할 수 없습니다. 관찰만 가능합니다.'); }
      // 거리 검사
      const dist = a.distanceM ?? Math.hypot(state.diver.x - specimen.x, state.diver.y - specimen.y, state.diver.z - specimen.z);
      const spear = spearDef(state.equipment.equippedSpear);
      if (dist > spear.rangeM) return fail(`작살 사거리(${spear.rangeM}m)를 초과했습니다 (${Math.round(dist)}m).`);
      // 성공 판정 (시드 난수)
      const hitChance = clamp(0.5 + spear.stability * 0.3 - specimen.lengthCm / sp.maxLengthCm * 0.15, 0.1, 0.95);
      if (rng.next() > hitChance) return fail('빗나갔습니다.');
      // 창고 용량
      if (state.holdUsedKg + specimen.weightKg > holdCapacityKg()) return fail('창고 용량이 부족합니다.');
      // 성공 처리
      state.specimens.splice(idx, 1);
      state.inventory.push({ ...specimen });
      state.holdUsedKg += specimen.weightKg;
      recordCatch(sp.id, specimen, zoneAt(specimen.x, specimen.z));
      addLog(`${sp.nameKo} 포획 (${specimen.lengthCm}cm / ${specimen.weightKg}kg)`);
      return ok({ specimen });
    },

    OBSERVE_CREATURE(a) {
      const specimen = state.specimens.find(s => s.specimenId === a.specimenId);
      const sp = specimen ? byId.get(specimen.speciesId) : byId.get(a.speciesId);
      if (!sp) return fail('대상을 찾을 수 없습니다.');
      const zoneKey = specimen ? zoneAt(specimen.x, specimen.z) : null;
      const e = codexEntry(sp.id);
      const first = e.observeCount === 0;
      e.observeCount += 1;
      state.observedCount += 1;
      markDiscovered(sp.id, zoneKey);
      if (first) { const reward = 10 + sp.rarity * 5; state.shells += reward; return ok({ reward, first: true }); }
      return ok({ reward: 0, first: false }); // 중복 관찰 보상 방지
    },

    SELL_ALL(a) {
      if (!state.ship.docked) return fail('항구에 정박해야 판매할 수 있습니다.');
      if (state.inventory.length === 0) return fail('판매할 포획물이 없습니다.');
      let total = 0;
      for (const it of state.inventory) {
        const sp = byId.get(it.speciesId);
        if (sp && !sp.protected) total += sellPrice(sp, it);
      }
      state.inventory = [];
      state.holdUsedKg = 0;
      state.shells += total;
      addLog(`전량 판매 +${total} 조개`);
      return ok({ gained: total });
    },

    BUY_ITEM(a) {
      const kind = a.kind; // 'spear'|'tank'|'suit'
      const list = kind === 'spear' ? SPEARS : kind === 'tank' ? TANKS : kind === 'suit' ? SUITS : null;
      if (!list) return fail('알 수 없는 장비 종류입니다.');
      const item = list.find(i => i.id === a.itemId);
      if (!item) return fail('장비를 찾을 수 없습니다.');
      const ownedKey = kind === 'spear' ? 'ownedSpears' : kind === 'tank' ? 'ownedTanks' : 'ownedSuits';
      if (state.equipment[ownedKey].includes(item.id)) return fail('이미 보유 중인 장비입니다.');
      if (item.unlock) {
        if (item.unlock.shipLevel && state.ship.level < item.unlock.shipLevel) return fail(`선박 ${item.unlock.shipLevel}단계 이상 필요`);
        if (item.unlock.zone && !state.zonesVisited.includes(item.unlock.zone)) return fail(`${item.unlock.zone} 해역 탐사 후 해금`);
        if (item.unlock.depth && state.maxDepthReachedM < item.unlock.depth) return fail(`수심 ${item.unlock.depth}m 도달 후 해금 (현재 기록 ${Math.round(state.maxDepthReachedM)}m)`);
        if (item.unlock.boss && !state.bossState[item.unlock.boss]?.defeated) return fail('보스 토벌 후 해금');
      }
      if (state.shells < item.price) return fail('조개가 부족합니다.');
      state.shells -= item.price;
      state.equipment[ownedKey].push(item.id);
      addLog(`${item.name} 구매 -${item.price} 조개`);
      return ok({ item });
    },

    EQUIP_ITEM(a) {
      const kind = a.kind;
      const ownedKey = kind === 'spear' ? 'ownedSpears' : kind === 'tank' ? 'ownedTanks' : 'ownedSuits';
      const eqKey = kind === 'spear' ? 'equippedSpear' : kind === 'tank' ? 'equippedTank' : 'equippedSuit';
      if (!state.equipment[ownedKey]?.includes(a.itemId)) return fail('보유하지 않은 장비입니다.');
      state.equipment[eqKey] = a.itemId;
      if (kind === 'tank') { state.diver.maxAir = tankDef(a.itemId).airCapacity; state.diver.air = Math.min(state.diver.air, state.diver.maxAir); }
      return ok();
    },

    UPGRADE_SHIP(a) {
      const cur = state.ship.level;
      if (cur >= 5) return fail('최대 단계입니다.');
      const next = shipDef(cur + 1);
      const req = next.unlock || {};
      if (req.shells && state.shells < req.shells) return fail('조개가 부족합니다.');
      if (req.zones && state.zonesVisited.length < req.zones) return fail(`해역 ${req.zones}개 탐사 필요`);
      if (req.boss && Object.values(state.bossState).every(b => !b.defeated)) return fail('보스 토벌 필요');
      if (req.shells) state.shells -= req.shells;
      state.ship.level = cur + 1;
      addLog(`선박 ${cur + 1}단계 개조: ${next.name}`);
      return ok({ level: state.ship.level, ship: next });
    },

    COLLECT_FOSSIL(a) {
      const f = FOSSILS.find(x => x.id === a.fossilId);
      if (!f) return fail('화석을 찾을 수 없습니다.');
      if (state.fossils[f.id] != null) return fail('이미 수집한 화석 조각입니다 (재출현 대기 중).');
      state.fossils[f.id] = state.timeSec;
      addLog(`화석 조각 ${f.id} 수집 (${f.bossId})`);
      return ok({ fossil: f });
    },

    SUMMON_BOSS(a) {
      const boss = BOSSES.find(b => b.id === a.bossId);
      if (!boss) return fail('보스를 찾을 수 없습니다.');
      if (state.bossState[boss.id].defeated && !a.force) return fail('이미 토벌한 보스입니다.');
      const missing = boss.fossils.filter(fid => state.fossils[fid] == null);
      if (missing.length > 0) return fail(`화석 조각 부족: ${missing.join(', ')}`);
      // 조각 소비
      for (const fid of boss.fossils) state.fossils[fid] = state.timeSec;
      state.bossState[boss.id].summoned = true;
      addLog(`${boss.name} 소환!`);
      return ok({ boss });
    },

    ATTACK_BOSS(a) {
      const boss = BOSSES.find(b => b.id === a.bossId);
      if (!boss) return fail('보스를 찾을 수 없습니다.');
      if (!state.bossState[boss.id].summoned) return fail('소환된 보스가 아닙니다.');
      const power = rng.next() + spearDef(state.equipment.equippedSpear).stability * 0.5;
      if (power > 0.8) {
        state.bossState[boss.id].defeated = true;
        state.bossState[boss.id].summoned = false;
        const reward = 2000;
        state.shells += reward;
        addLog(`${boss.name} 토벌 성공 +${reward} 조개`);
        return ok({ defeated: true, reward });
      }
      return fail('공격 실패 — 보스가 여전히 강하다.');
    },

    RECRUIT_COMPANION(a) {
      const c = COMPANIONS.find(x => x.id === a.companionId);
      if (!c) return fail('동료를 찾을 수 없습니다.');
      if (state.companions[c.id]) return fail('이미 영입한 동료입니다.');
      if (c.cost > 0) return fail('동료는 돈으로 구매할 수 없습니다.');
      // 영입 조건
      if (c.recruit.quest === 'obs_20' && state.observedCount < 20) return fail('관찰 20회 필요');
      if (c.recruit.quest === 'zone_glacier' && !state.zonesVisited.includes('glacier')) return fail('빙하 해역 탐사 필요');
      if (c.recruit.quest.startsWith('boss_') && !state.bossState[c.recruit.quest.slice(5)]?.defeated) return fail('보스 토벌 필요');
      state.companions[c.id] = true;
      addLog(`${c.name} 영입!`);
      return ok({ companion: c });
    },
  };

  function dispatch(action) {
    if (!action || typeof action.type !== 'string') return fail('잘못된 액션 형식입니다.');
    const h = handlers[action.type];
    if (!h) return fail(`미지원 액션: ${action.type}`);
    const res = h(action);
    if (res.ok) emit();
    return res;
  }

  // ---------- 스냅샷 ----------
  function getSnapshot() {
    return JSON.parse(JSON.stringify({
      version: state.version, seed: state.seed,
      timeSec: state.timeSec, day: state.day, season: state.season, weather: state.weather,
      ship: state.ship, diver: state.diver,
      shipStats: shipDef(state.ship.level),
      holdCapacityKg: holdCapacityKg(), holdUsedKg: state.holdUsedKg,
      shells: state.shells,
      equipment: state.equipment,
      codex: state.codex,
      inventoryCount: state.inventory.length,
      inventory: state.inventory,
      specimens: state.specimens,
      fossils: state.fossils, bossState: state.bossState, companions: state.companions,
      discoveredSites: state.discoveredSites,
      zonesVisited: state.zonesVisited,
      maxDepthReachedM: state.maxDepthReachedM,
      isNight: isNight(),
      currentZone: zoneAt(state.diver.inWater ? state.diver.x : state.ship.x, state.diver.inWater ? state.diver.z : state.ship.z),
    }));
  }

  // 주변 생물 조회 (시각적 거리 기반 — 세션 A의 카메라 위치 전달용)
  // 예: game.nearby(x, z, y, radiusM, { sort: 'distance' })
  function nearby(x = state.diver.x, z = state.diver.z, y = state.diver.y, radiusM = 100, opts = {}) {
    const r2 = radiusM * radiusM;
    const out = [];
    for (const s of state.specimens) {
      const dx = s.x - x, dz = s.z - z, dy = (s.y ?? 0) - y;
      const d2 = dx * dx + dz * dz + dy * dy;
      if (d2 <= r2) out.push({ ...s, distanceM: Math.round(Math.sqrt(d2) * 10) / 10 });
    }
    if (opts.sort === 'distance') out.sort((a, b) => a.distanceM - b.distanceM);
    return out.slice(0, opts.limit ?? 50);
  }

  // ---------- 저장/불러오기 ----------
  function save() {
    const data = {
      version: GAME_VERSION, seed: state.seed,
      state: JSON.parse(JSON.stringify({ ...state, rngState: rng.getState() })),
    };
    storage.setItem('oceangaia.save', JSON.stringify(data));
    return ok({ savedAt: state.timeSec });
  }

  function load() {
    const raw = storage.getItem('oceangaia.save');
    if (!raw) return fail('저장 데이터가 없습니다.');
    let data;
    try { data = JSON.parse(raw); } catch { return fail('저장 데이터가 손상되었습니다.'); }
    if (!data || data.version !== GAME_VERSION) return fail(`버전 불일치 (${data?.version}). 마이그레이션 필요.`);
    const s = data.state;
    // 무결성 검사
    if (!s.ship || !s.diver || !Array.isArray(s.specimens) || typeof s.shells !== 'number') return fail('저장 데이터 무결성 검사 실패.');
    if (s.shells < 0 || !Number.isFinite(s.shells)) return fail('비정상 재화 값 감지.');
    Object.keys(state).forEach(k => { if (k in s) state[k] = s[k]; });
    delete state.rngState;
    rng.setState(s.rngState);
    addLog('게임 불러오기 완료');
    emit();
    return ok();
  }

  return {
    dispatch, getSnapshot, save, load,
    subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    nearby,
    // 세션 A 호환 API
    getSpecimens(zoneKey) {
      return state.specimens.filter(s => !zoneKey || (s.zone ?? zoneAt(s.x, s.z)) === zoneKey).map(s => ({ ...s }));
    },
    getZoneAt(x, z) { return zoneAt(x, z); },
    _state: state,
  };
}

// Node 테스트용 메모리 스토리지
export function memoryStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  };
}
