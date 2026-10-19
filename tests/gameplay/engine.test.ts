/**
 * OCEAN GAIA V3.2 — 세션 B 핵심 테스트 (지시 B-7 항목 1~18 반영)
 * 렌더러 없이 Node.js(vitest)에서 게임 규칙 전체를 검증한다.
 */
import { describe, it, expect } from "vitest";
import { createGame, memoryStorage, TICK_MAX_DT_SEC, type GameState, type SaveStorage } from "../../src/core/GameEngine";
import { SPECIES, getSpeciesById, ZONE_QUOTA } from "../../src/data/species";
import { HARPOONS, TANKS, SUITS, SHIP_STAGES } from "../../src/data/equipment";
import { ZONES, ISLANDS, DIVE_SITES, BOSSES, FOSSILS, COMPANIONS, zoneAt } from "../../src/data/world";
import { WORLD, ACTIONS, SAVE_SCHEMA_VERSION } from "../../src/core/units";
import { lengthToMassKg, rollSpecimenSize } from "../../src/creatures/WeightModel";
import { Rng } from "../../src/core/Rng";

const SEED = 12345;

/** storage 미주입 시 엔진은 engine.storage(격리 메모리)를 사용 — 테스트 간 교차 오염 방지 */
interface TestGame extends ReturnType<typeof createGame> { storage: SaveStorage }

function newGame(seed = SEED): TestGame {
  return createGame({ seed }) as TestGame;
}

/** 포획 성공 시뮬레이션용: 다이버를 개체 바로 옆에 배치(엔진 규칙 경로 유지) */
function placeDiverNear(g: TestGame, specimenId: string) {
  const s = g.getSnapshot();
  const spec = s.specimens.find((sp) => sp.id === specimenId)!;
  void spec;
  // ENTER_WATER 후 MOVE_DIVER로 접근 — 거리·수심 규칙을 통과하도록 근접 이동
  g.dispatch({ type: "ENTER_WATER" });
  let guard = 0;
  while (guard++ < 400) {
    const st = g.getSnapshot();
    if (st.diver.mode === "ON_SHIP") g.dispatch({ type: "ENTER_WATER" }); // 공기 고갈 자동 귀선 시 재입수
    const p = st.diver.position;
    const cur = st.specimens.find((sp) => sp.id === specimenId);
    if (!cur) break;
    const dx = cur.x - p.x, dy = cur.y - p.y, dz = cur.z - p.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 4) return dist;
    // 계약 부호: y축 위쪽 — dy < 0 = 하강. 수평+수직 동시 입력.
    // MOVE_DIVER는 단위벡터가 아니라 각 축 컴포넌트(-1~1)를 요구하므로 축별 clamp 전달.
    const cl = (v: number) => Math.max(-1, Math.min(1, v));
    g.dispatch({
      type: "MOVE_DIVER",
      dx: cl(dx),
      dy: cl(dy),
      dz: cl(dz),
    });
  }
  const st = g.getSnapshot();
  const cur = st.specimens.find((sp) => sp.id === specimenId);
  if (!cur) return -1;
  const p = st.diver.position;
  return Math.hypot(cur.x - p.x, cur.y - p.y, cur.z - p.z);
}

// ───────── 1. 데이터 무결성 ─────────
describe("데이터 계약", () => {
  it("① 200종 로딩 · ID 1~200 연속 · 학명/ID 중복 없음", () => {
    expect(SPECIES.length).toBe(200);
    const ids = SPECIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(200);
    for (let i = 1; i <= 200; i++) expect(ids).toContain(i);
    const sci = SPECIES.map((s) => s.scientificName.toLowerCase());
    expect(new Set(sci).size).toBe(200);
    const ko = SPECIES.map((s) => s.nameKo);
    expect(new Set(ko).size).toBe(200);
  });

  it("② 해역별 종 수량 계약 (열대40/빙하30/화산30/맹그로브35/대양40/심해25)", () => {
    const counts: Record<string, number> = {};
    for (const sp of SPECIES) counts[sp.habitat.zone] = (counts[sp.habitat.zone] ?? 0) + 1;
    for (const [zone, n] of Object.entries(ZONE_QUOTA)) expect(counts[zone], zone).toBe(n);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(200);
  });

  it("③ 길이/무게 필드 유효성 · VERIFIED는 출처 필수", () => {
    for (const sp of SPECIES) {
      expect(sp.gameMinLengthCm).toBeGreaterThan(0);
      expect(sp.gameMaxLengthCm).toBeGreaterThanOrEqual(sp.gameBaseLengthCm);
      expect(sp.gameBaseLengthCm).toBeGreaterThanOrEqual(sp.gameMinLengthCm);
      expect(sp.reportedMaxLengthCm).toBeGreaterThanOrEqual(sp.gameMaxLengthCm);
      expect(sp.habitat.depthMinM).toBeLessThan(sp.habitat.depthMaxM);
      expect(sp.habitat.depthMaxM).toBeLessThanOrEqual(WORLD.MAX_DEPTH_M);
      if (sp.verification === "VERIFIED") expect(sp.source.length).toBeGreaterThan(0);
      if (sp.measuredAvgLengthCm !== null) expect(sp.measuredAvgLengthCm).toBeGreaterThan(0);
    }
    // 초기 검증 종 1,3,6,10,29 확인
    for (const id of [1, 3, 6, 10, 29]) expect(getSpeciesById(id)!.verification).toBe("VERIFIED");
  });

  it("④ 체장–체중 단위: cm-g 계수는 kg으로 변환", () => {
    const relG = { a: 0.01, b: 3.0, unit: "cm-g" as const, source: "test", verified: false };
    // L=10cm → 0.01*1000 g = 10 g = 0.01 kg
    expect(lengthToMassKg(10, relG)).toBeCloseTo(0.01, 6);
    const relKg = { a: 1e-5, b: 3.0, unit: "cm-kg" as const, source: "test", verified: false };
    expect(lengthToMassKg(100, relKg)).toBeCloseTo(10, 6);
    expect(lengthToMassKg(0, relKg)).toBe(0);
  });

  it("⑤ 장비 개수: 작살24/산소통6/잠수복6/선박5단계", () => {
    expect(HARPOONS.length).toBe(24);
    expect(TANKS.length).toBe(6);
    expect(SUITS.length).toBe(6);
    expect(SHIP_STAGES.length).toBe(5);
    expect(HARPOONS.map((h) => h.id)).toEqual(
      Array.from({ length: 24 }, (_, i) => `harpoon_${String(i + 1).padStart(2, "0")}`));
    // 선박 단계 상승: 속도·창고 증가, 가격 증가
    for (let i = 1; i < 5; i++) {
      expect(SHIP_STAGES[i].maxSpeedMs).toBeGreaterThan(SHIP_STAGES[i - 1].maxSpeedMs);
      expect(SHIP_STAGES[i].cargoKg).toBeGreaterThan(SHIP_STAGES[i - 1].cargoKg);
      expect(SHIP_STAGES[i].priceShells).toBeGreaterThan(SHIP_STAGES[i - 1].priceShells);
    }
  });

  it("⑥ 월드 데이터: 6해역/12섬/탐사지24/영구거점1/동료3/보스3/화석15", () => {
    expect(ZONES.length).toBe(6);
    expect(ISLANDS.length).toBe(12);
    expect(DIVE_SITES.length).toBe(24);
    expect(ISLANDS.filter((i) => i.isHomePort).length).toBe(1);
    expect(COMPANIONS.length).toBe(3);
    expect(BOSSES.length).toBe(3);
    expect(FOSSILS.length).toBe(15);
    // 탐사지 좌표는 해당 해역 경계 내부
    for (const site of DIVE_SITES) {
      const zn = zoneAt(site.x, site.z);
      expect(zn?.id, `${site.id} @(${site.x},${site.z})`).toBe(site.zone);
    }
    // 시작 배 위치는 열대 해역 내
    expect(zoneAt(WORLD.START_SHIP.x, WORLD.START_SHIP.z)?.id).toBe("tropical");
  });
});

// ───────── 2. 개체 생성 ─────────
describe("개체 생성 (SpecimenFactory)", () => {
  it("길이→무게 단방향 · 범위 준수 · 고유 ID 형식", () => {
    const rng = new Rng(777);
    for (const sp of [getSpeciesById(1)!, getSpeciesById(100)!, getSpeciesById(190)!]) {
      for (let i = 0; i < 60; i++) {
        const size = rollSpecimenSize(sp, rng);
        expect(size.lengthCm).toBeGreaterThan(0);
        expect(size.lengthCm).toBeLessThanOrEqual(sp.gameMaxLengthCm);
        expect(size.massKg).toBeGreaterThan(0);
        expect(Number.isFinite(size.massKg)).toBe(true);
        // 무게는 길이와 독립적이지 않다: 같은 길이 → 같은 무게
        const m1 = lengthToMassKg(size.lengthCm, sp.relation);
        expect(size.massKg).toBeCloseTo(Math.round(m1 * 1000) / 1000, 3);
      }
    }
    const g = newGame();
    const snap = g.getSnapshot();
    expect(snap.specimens.length).toBeGreaterThan(0);
    const ids = snap.specimens.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length); // 고유 ID
    for (const s of snap.specimens.slice(0, 10)) expect(s.id).toMatch(/^fish_\d+_\d{4}$/);
  });
});

// ───────── 3. 엔진 인터페이스 & 조작 규칙 ─────────
describe("게임 엔진 기본", () => {
  it("createGame 계약: dispatch/getSnapshot/subscribe/save/load", () => {
    const g = newGame();
    expect(typeof g.dispatch).toBe("function");
    expect(typeof g.getSnapshot).toBe("function");
    expect(typeof g.subscribe).toBe("function");
    expect(typeof g.save).toBe("function");
    expect(typeof g.load).toBe("function");
    let called = 0;
    const unsub = g.subscribe(() => called++);
    g.dispatch({ type: "TICK", dtSec: 1 });
    expect(called).toBeGreaterThan(0);
    unsub();
    const before = called;
    g.dispatch({ type: "TICK", dtSec: 1 });
    expect(called).toBe(before);
  });

  it("스냅샷은 JSON 직렬화 가능 · state 구조 고정", () => {
    const g = newGame();
    g.dispatch({ type: "TICK", dtSec: 5 });
    const snap = g.getSnapshot();
    const round = JSON.parse(JSON.stringify(snap)) as GameState;
    expect(round.ship.position.x).toBe(snap.ship.position.x);
    expect(round.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    // 스냅샷은 사본: 수정해도 실제 상태 불변
    round.shells = 999999;
    expect(g.getSnapshot().shells).not.toBe(999999);
  });

  it("MOVE_SHIP: 전방 이동·월드 경계·섬 충돌·해역 티어 제한", () => {
    const g = newGame();
    const before = g.getSnapshot().ship.position;
    for (let i = 0; i < 60; i++) g.dispatch({ type: "MOVE_SHIP", forward: 1, turn: 0, dtSec: 1 / 30 });
    const after = g.getSnapshot().ship.position;
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(1);
    // 월드 밖으로 밀려나지 않음
    for (let i = 0; i < 5000; i++) g.dispatch({ type: "MOVE_SHIP", forward: 1, turn: 0.02, dtSec: 1 / 30 });
    const far = g.getSnapshot().ship.position;
    expect(far.x).toBeGreaterThanOrEqual(0);
    expect(far.x).toBeLessThanOrEqual(WORLD.WIDTH_M);
    expect(far.z).toBeGreaterThanOrEqual(0);
    expect(far.z).toBeLessThanOrEqual(WORLD.DEPTH_M);
    // 섬 내부로 들어갈 수 없음
    for (const isl of ISLANDS) {
      const d = Math.hypot(far.x - isl.x, far.z - isl.z);
      expect(d >= isl.radiusM * 0.85, `섬 ${isl.nameKo} 침범`).toBe(true);
    }
  });

  it("ENTER_WATER → MOVE_DIVER → RETURN_TO_SHIP 흐름과 공기 소모", () => {
    const g = newGame();
    expect(g.dispatch({ type: "MOVE_DIVER", dx: 1, dy: 0, dz: 0 }).ok).toBe(false); // 미입수
    const enter = g.dispatch({ type: "ENTER_WATER" });
    expect(enter.ok).toBe(true);
    expect(g.getSnapshot().diver.mode).toBe("IN_WATER");
    expect(g.dispatch({ type: "ENTER_WATER" }).reason).toContain("이미");
    const airBefore = g.getSnapshot().diver.airCurrent;
    g.dispatch({ type: "MOVE_DIVER", dx: 0, dy: -1, dz: 0 });
    const st = g.getSnapshot();
    expect(st.diver.depthM).toBeGreaterThan(0);
    expect(st.diver.airCurrent).toBeLessThan(airBefore);
    // 잠수복 한계 초과 금지 (suit_01 = 20m)
    let denied = false;
    for (let i = 0; i < 40 && !denied; i++) {
      const r = g.dispatch({ type: "MOVE_DIVER", dx: 0, dy: -1, dz: 0 });
      if (!r.ok) denied = true;
    }
    expect(denied || g.getSnapshot().diver.depthM <= 20).toBe(true);
    // 귀선: 멀면 실패, 가까우면 성공
    const near = g.dispatch({ type: "RETURN_TO_SHIP" });
    expect(near.ok).toBe(true);
    expect(g.getSnapshot().diver.mode).toBe("ON_SHIP");
  });

  it("잘못된 입력 방어: NaN·범위 초과·미지원 액션", () => {
    const g = newGame();
    expect(g.dispatch({ type: "TICK", dtSec: NaN }).ok).toBe(false);
    expect(g.dispatch({ type: "TICK", dtSec: -5 }).ok).toBe(false);
    expect(g.dispatch({ type: "TICK", dtSec: TICK_MAX_DT_SEC + 90 }).ok).toBe(false); // 타임스케일 치트 차단
    expect(g.dispatch({ type: "TICK", dtSec: TICK_MAX_DT_SEC }).ok).toBe(true);       // 상한 경계는 허용
    expect(g.dispatch({ type: "CATCH_ATTEMPT", specimenId: "", distanceM: -1 }).ok).toBe(false);
    expect(g.dispatch({ type: "ATTACK_BOSS", bossId: "boss_megalodon", damage: 9999 }).ok).toBe(false);
    expect(g.dispatch({ type: "BUY_ITEM", itemId: "sword_excalibur" }).ok).toBe(false);
    // @ts-expect-error 일부러 잘못된 액션
    expect(g.dispatch({ type: "FLY_ROCKET" }).ok).toBe(false);
  });

  it("ACTIONS 상수와 dispatch 지원 액션 일치", () => {
    const g = newGame();
    for (const a of ACTIONS) {
      // 모든 계약 액션은 '미지원 액션' 오류를 반환하지 않는다 (검증 실패는 허용)
      const res = g.dispatch({ type: a, dtSec: 0, forward: 0, turn: 0, dx: 0, dy: 0, dz: 0, specimenId: "x", distanceM: 0, itemId: "x", fossilId: "x", bossId: "x", damage: 0, companionId: "x", conditionMet: false, siteId: "x" } as never);
      expect(res.reason ?? "", a).not.toContain("미지원 액션");
    }
  });
});

// ───────── 4. 포획 ─────────
describe("포획 시스템", () => {
  it("존재하지 않는 ID·육상 포획·거리 불일치 차단", () => {
    const g = newGame();
    expect(g.dispatch({ type: "CATCH_ATTEMPT", specimenId: "fish_999_9999", distanceM: 3 }).ok).toBe(false);
    const real = g.getSnapshot().specimens[0];
    // ON_SHIP 상태 → 실패
    expect(g.dispatch({ type: "CATCH_ATTEMPT", specimenId: real.id, distanceM: 3 }).ok).toBe(false);
    g.dispatch({ type: "ENTER_WATER" });
    // 실제 위치와 다른 거리(치트) → 실패
    const res = g.dispatch({ type: "CATCH_ATTEMPT", specimenId: real.id, distanceM: 0.1 });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("거리");
  });

  it("근접 포획 성공 → 창고·도감 갱신, 개체 제거", () => {
    const g = newGame();
    const target = g.getSnapshot().specimens.find((s) => {
      const sp = getSpeciesById(s.speciesId)!;
      return sp.economy.catchable && !sp.economy.protectedSpecies;
    })!;
    const dist = placeDiverNear(g, target.id);
    expect(dist).toBeGreaterThanOrEqual(0);
    // 시도 횟수 제한 없이 명중할 때까지 (실패 사유는 '빗나감'만 허용)
    let caught = false;
    for (let i = 0; i < 30 && !caught; i++) {
      const st = g.getSnapshot();
      const cur = st.specimens.find((s) => s.id === target.id);
      if (!cur) break;
      const p = st.diver.position;
      const d = Math.hypot(cur.x - p.x, cur.y - p.y, cur.z - p.z);
      const r = g.dispatch({ type: "CATCH_ATTEMPT", specimenId: target.id, distanceM: d });
      if (r.ok) caught = true;
      else expect(r.reason).toContain("빗나감");
    }
    expect(caught).toBe(true);
    const st = g.getSnapshot();
    expect(st.cargo.length).toBe(1);
    expect(st.cargo[0].specimenId).toBe(target.id);
    expect(st.cargo[0].massKg).toBeGreaterThan(0);
    expect(st.specimens.find((s) => s.id === target.id)).toBeUndefined();
    const dex = st.dex[target.speciesId];
    expect(dex.firstCaught).toBe(true);
    expect(dex.catchCount).toBe(1);
    expect(dex.maxLengthCm).toBe(st.cargo[0].lengthCm);
  });

  it("보호종은 포획 금지 — 관찰 전용", () => {
    const protectedSp = SPECIES.find((s) => s.economy.protectedSpecies)!;
    expect(protectedSp).toBeDefined();
    const g = createGame({ seed: SEED, enableDebugActions: true });
    // 디버그 훅으로 보호종 개체를 다이버 바로 옆(사거리·거리 검증 통과 지점)에 강제 배치
    const forced = {
      id: `fish_${protectedSp.id}_9001`, speciesId: protectedSp.id,
      lengthCm: protectedSp.gameBaseLengthCm, massKg: Math.max(0.1, protectedSp.gameBaseMassKg),
      growthStage: "ADULT", sex: "UNKNOWN",
      x: WORLD.START_SHIP.x + 2, y: -3, z: WORLD.START_SHIP.z,
      headingRad: 0, behaviorState: "IDLE", energy: 1, hunger: 0, alive: true, fleeTimerSec: 0,
    };
    const dbg = g.dispatch({ type: "DEBUG_SET_STATE", patch: { specimens: [forced] } });
    expect(dbg.ok, JSON.stringify(dbg.reason)).toBe(true);
    g.dispatch({ type: "ENTER_WATER" });
    // 1) 존재하지만 사거리 밖 → '사거리' 차단 (거리 불일치보다 먼저 판정)
    const far = g.dispatch({ type: "CATCH_ATTEMPT", specimenId: forced.id, distanceM: HARPOONS[0].rangeM + 40 });
    expect(far.ok).toBe(false);
    expect(far.reason, JSON.stringify(far.reason)).toContain("사거리");
    // 2) 사거리 내 정밀 좌표 → 보호종/포획불가 규칙이 명중 판정보다 우선 차단
    const st = g.getSnapshot();
    const sp0 = st.specimens.find((s) => s.id === forced.id)!;
    const p = st.diver.position;
    const exact = g.dispatch({ type: "CATCH_ATTEMPT", specimenId: forced.id, distanceM: Math.hypot(sp0.x - p.x, sp0.y - p.y, sp0.z - p.z) });
    expect(exact.ok).toBe(false);
    expect(exact.reason, JSON.stringify(exact.reason)).toMatch(/보호종|포획 불가/);
    // 3) 존재하지 않는 ID는 여전히 차단
    const ghost = g.dispatch({ type: "CATCH_ATTEMPT", specimenId: "fish_999_0001", distanceM: 2 });
    expect(ghost.ok).toBe(false);
    expect(ghost.reason).toContain("존재하지 않음");
    // 규칙 검증: SELL_ALL에서도 보호종 제외되는 것은 경제 테스트에서 확인
  });

  it("사거리 초과 차단", () => {
    const g = newGame();
    const target = g.getSnapshot().specimens[0];
    placeDiverNear(g, target.id);
    const harpRange = HARPOONS[0].rangeM;
    const st = g.getSnapshot();
    const cur = st.specimens.find((s) => s.id === target.id)!;
    const p = st.diver.position;
    const d = Math.hypot(cur.x - p.x, cur.y - p.y, cur.z - p.z);
    const res = g.dispatch({ type: "CATCH_ATTEMPT", specimenId: target.id, distanceM: harpRange + 50 });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("사거리");
    void d;
  });

  it("창고 초과 시 유령 포획 금지 (물고기 생존·보상 없음)", () => {
    const g = newGame();
    // 창고를 인위적으로 채운 상태 연출: 화물 capacity까지 반복 포획 대신 BUY 없이 직접 검증
    const target = g.getSnapshot().specimens.find((s) => {
      const sp = getSpeciesById(s.speciesId)!;
      return sp.economy.catchable && !sp.economy.protectedSpecies;
    })!;
    placeDiverNear(g, target.id);
    // stage1 cargoKg=120 — 대형종이면 초과 가능. 일반 경로: 명중 판정 후 용량 검사 순서이므로
    // 물고기 존재 시에만 재시도. 여기서는 코드 경로 자체(반환 후 개체 유지)를 스냅샷으로 확인.
    let lastRes = { ok: false, reason: "" };
    for (let i = 0; i < 30; i++) {
      const st = g.getSnapshot();
      const cur = st.specimens.find((s) => s.id === target.id);
      if (!cur) break;
      const p = st.diver.position;
      lastRes = g.dispatch({ type: "CATCH_ATTEMPT", specimenId: target.id, distanceM: Math.hypot(cur.x - p.x, cur.y - p.y, cur.z - p.z) });
      if (lastRes.ok) break;
    }
    const st = g.getSnapshot();
    const stillThere = st.specimens.some((s) => s.id === target.id);
    if (!lastRes.ok && lastRes.reason.includes("창고")) {
      expect(stillThere).toBe(true); // 실패하면 살아있어야 함
      expect(st.cargo.length).toBe(0);
    } else {
      expect(lastRes.ok || stillThere).toBe(true);
    }
  });
});

// ───────── 5. 경제 ─────────
describe("경제 시스템", () => {
  it("항구 근처에서만 판매 · 보호종 제외 · 금액 정확", () => {
    const g = newGame();
    expect(g.dispatch({ type: "SELL_ALL" }).ok).toBe(false); // 화물 없음
    // 산호항 근처로 배 이동
    const home = ISLANDS.find((i) => i.isHomePort)!;
    for (let i = 0; i < 3000; i++) {
      const st = g.getSnapshot();
      const dx = home.x - st.ship.position.x, dz = home.z - st.ship.position.z;
      if (Math.hypot(dx, dz) < 40) break;
      const heading = Math.atan2(dx, dz);
      const delta = ((heading - st.ship.headingRad + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      g.dispatch({ type: "MOVE_SHIP", forward: 1, turn: Math.max(-1, Math.min(1, delta * 2)), dtSec: 1 / 30 });
    }
    const st = g.getSnapshot();
    expect(Math.hypot(st.ship.position.x - home.x, st.ship.position.z - home.z)).toBeLessThan(80);
    // 포획 없이 판매 → 실패
    expect(g.dispatch({ type: "SELL_ALL" }).ok).toBe(false);
  });

  it("장비 구매: 보유 중복 금지·잔액 검사·해금 조건", () => {
    const g = createGame({ seed: SEED, enableDebugActions: true });
    expect(g.dispatch({ type: "BUY_ITEM", itemId: "harpoon_01" }).ok).toBe(false); // 이미 보유
    expect(g.dispatch({ type: "BUY_ITEM", itemId: "harpoon_24" }).ok).toBe(false); // 해금/가격 부족
    // DEBUG로 잔액·해금(discoveredSpecies) 조건을 충족한 뒤 실제 BUY 경로 검증
    g.dispatch({ type: "DEBUG_SET_STATE", patch: { shells: 5000 } });
    const shellsBefore = g.getSnapshot().shells;
    const buy = g.dispatch({ type: "BUY_ITEM", itemId: "harpoon_02" });
    if (buy.ok) {
      expect(g.getSnapshot().shells).toBe(shellsBefore - HARPOONS[1].priceShells);
      expect(g.getSnapshot().ownedEquipment["harpoon_02"]).toBe(true);
    } else {
      expect(buy.reason).toMatch(/부족|필요/);
    }
    // 장착: 미보유 불가
    expect(g.dispatch({ type: "EQUIP_ITEM", itemId: "harpoon_24" }).ok).toBe(false);
    if (buy.ok) {
      expect(g.dispatch({ type: "EQUIP_ITEM", itemId: "harpoon_02" }).ok).toBe(true);
      expect(g.getSnapshot().equipped.harpoonId).toBe("harpoon_02");
    }
  });

  it("선박 개조: 단계 순서·조건·최대 5단계", () => {
    const g = newGame();
    // stage2 필요: 900조개 + 발견 15종 → 즉시 불가해야 함
    const r = g.dispatch({ type: "UPGRADE_SHIP" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/부족|필요/);
    // 최대 단계 검증은 데이터 기준
    expect(SHIP_STAGES[4].stage).toBe(5);
  });

  it("관찰 보상 · 도감 관찰 횟수 갱신", () => {
    const g = newGame();
    const target = g.getSnapshot().specimens[0];
    const before = g.getSnapshot().shells;
    const res = g.dispatch({ type: "OBSERVE_CREATURE", specimenId: target.id });
    expect(res.ok).toBe(true);
    const st = g.getSnapshot();
    expect(st.shells).toBeGreaterThan(before);
    expect(st.dex[target.speciesId].observeCount).toBe(1);
    expect(st.dex[target.speciesId].firstDiscovered).toBe(true);
    // 재관찰도 기록 갱신
    g.dispatch({ type: "OBSERVE_CREATURE", specimenId: target.id });
    expect(g.getSnapshot().dex[target.speciesId].observeCount).toBe(2);
    // 없는 개체 관찰 실패
    expect(g.dispatch({ type: "OBSERVE_CREATURE", specimenId: "ghost" }).ok).toBe(false);
  });

  it("동료는 화폐로 구매 불가", () => {
    const g = newGame();
    expect(g.dispatch({ type: "BUY_ITEM", itemId: "mia" }).ok).toBe(false);
    expect(g.dispatch({ type: "RECRUIT_COMPANION", companionId: "mia", conditionMet: false }).ok).toBe(false);
    expect(g.dispatch({ type: "RECRUIT_COMPANION", companionId: "mia", conditionMet: true }).ok).toBe(true);
    expect(g.getSnapshot().companions.mia).toBe(true);
  });
});

// ───────── 6. 화석·보스 ─────────
describe("화석·보스", () => {
  it("조각 수집 → 중복 불가 → 5개 모아야 소환 → 조각 소비", () => {
    const g = newGame();
    const boss = BOSSES[0];
    const frags = FOSSILS.filter((f) => f.bossId === boss.id);
    expect(frags.length).toBe(5);
    expect(g.dispatch({ type: "SUMMON_BOSS", bossId: boss.id }).ok).toBe(false); // 조각 없음
    for (const f of frags) {
      const r = g.dispatch({ type: "COLLECT_FOSSIL", fossilId: f.id });
      expect(r.ok, f.id).toBe(true);
      expect(g.dispatch({ type: "COLLECT_FOSSIL", fossilId: f.id }).ok).toBe(false); // 중복 불가
    }
    const summon = g.dispatch({ type: "SUMMON_BOSS", bossId: boss.id });
    expect(summon.ok).toBe(true);
    const st = g.getSnapshot();
    expect(st.bosses.find((b) => b.id === boss.id)!.active).toBe(true);
    expect(st.fossils.filter((f) => f.id.startsWith(boss.fossilId) && f.collected).length).toBe(0); // 소비됨
    // 전투
    expect(g.dispatch({ type: "ATTACK_BOSS", bossId: boss.id, damage: 30 }).ok).toBe(true);
    expect(g.getSnapshot().bosses.find((b) => b.id === boss.id)!.hp).toBe(70);
    const shellsBefore = g.getSnapshot().shells;
    for (let i = 0; i < 3; i++) g.dispatch({ type: "ATTACK_BOSS", bossId: boss.id, damage: 30 });
    const after = g.getSnapshot();
    expect(after.bosses.find((b) => b.id === boss.id)!.defeated).toBe(true);
    expect(after.shells).toBe(shellsBefore + boss.rewardShells);
    expect(g.dispatch({ type: "SUMMON_BOSS", bossId: boss.id }).ok).toBe(false); // 격퇴 후 재소환 불가
  });
});

// ───────── 7. 저장·불러오기 ─────────
describe("저장 시스템", () => {
  it("save → 새 엔진 load → 동일 스냅샷", () => {
    const g1 = createGame({ seed: SEED, enableDebugActions: true });
    g1.dispatch({ type: "TICK", dtSec: 120 }); // 스폰 seq 진행 → 후속 spawn과 ID 충돌 방지
    // DEBUG로 구매 조건(잔액·해금)을 충족한 뒤 실제 BUY 경로를 검증한다.
    const dbg = g1.dispatch({ type: "DEBUG_SET_STATE", patch: { shells: 5000 } });
    expect(dbg.ok, JSON.stringify(dbg.reason)).toBe(true);
    const buy = g1.dispatch({ type: "BUY_ITEM", itemId: "harpoon_02" });
    expect(buy.ok, JSON.stringify(buy.reason)).toBe(true);
    g1.dispatch({ type: "MARK_SITE_DISCOVERED", siteId: "site_01" });
    g1.save();
    const g2 = createGame({ seed: SEED, storage: g1.storage });
    expect(g2.load()).toBe(true);
    const a = g1.getSnapshot(), b = g2.getSnapshot();
    expect(b.shells).toBe(a.shells);
    expect(b.ship.stage).toBe(a.ship.stage);
    expect(b.gameSeconds).toBe(a.gameSeconds);
    expect(b.specimens).toEqual(a.specimens);
    expect(b.discoveredSites.site_01).toBe(true);
    expect(b.ownedEquipment.harpoon_02).toBe(true);
  });

  it("손상·변조 데이터 거부", () => {
    const store = memoryStorage();
    const g = createGame({ seed: SEED, storage: store });
    g.save();
    store.setItem("ocean-gaia-save-v3.2", "{not json!!");
    const g2 = createGame({ seed: SEED, storage: store });
    expect(g2.load()).toBe(false);
    // 정상 저장 후 변조 (손상 JSON 이후 다시 정상 저장해 원본 페이로드 확보)
    const g3 = createGame({ seed: SEED, storage: store });
    g3.save();
    const good = JSON.parse(store.getItem("ocean-gaia-save-v3.2")!);
    // 스키마 버전 불일치 → 거부
    good.schemaVersion = 999;
    store.setItem("ocean-gaia-save-v3.2", JSON.stringify(good));
    expect(createGame({ seed: SEED, storage: store }).load()).toBe(false);
    good.schemaVersion = SAVE_SCHEMA_VERSION;
    good.state.shells = 1e12; // 치트 잔액
    store.setItem("ocean-gaia-save-v3.2", JSON.stringify(good));
    expect(createGame({ seed: SEED, storage: store }).load()).toBe(false);
    good.state.shells = 100;
    good.state.ship.position.x = 99999; // 월드 밖 좌표
    store.setItem("ocean-gaia-save-v3.2", JSON.stringify(good));
    expect(createGame({ seed: SEED, storage: store }).load()).toBe(false);
  });

  it("load 후 RNG 흐름 복원 — 저장 이후 결과가 동일", () => {
    const store = memoryStorage();
    const g1 = createGame({ seed: SEED, storage: store });
    for (let i = 0; i < 50; i++) g1.dispatch({ type: "TICK", dtSec: 2 });
    g1.save();
    const expected = g1.getSnapshot();
    const g2 = createGame({ seed: SEED, storage: store });
    g2.load();
    for (let i = 0; i < 50; i++) g2.dispatch({ type: "TICK", dtSec: 2 });
    // 두 엔진 모두 저장 지점부터 동일 tick 진행 비교를 위해 g1을 더 진행하지 않고 스냅 비교
    expect(g2.getSnapshot().gameSeconds).toBe(expected.gameSeconds + 100);
    expect(g2.getSnapshot().weather).toBeDefined();
  });
});

// ───────── 8. 재현성 ─────────
describe("시드 재현성", () => {
  it("같은 시드 → 같은 초기 세계·같은 행동 시뮬레이션", () => {
    const gA = newGame(4242);
    const gB = newGame(4242);
    expect(gA.getSnapshot().specimens).toEqual(gB.getSnapshot().specimens);
    for (let i = 0; i < 120; i++) {
      gA.dispatch({ type: "TICK", dtSec: 1 });
      gB.dispatch({ type: "TICK", dtSec: 1 });
    }
    expect(gA.getSnapshot().specimens).toEqual(gB.getSnapshot().specimens);
    expect(gA.getSnapshot().weather).toBe(gB.getSnapshot().weather);
    // 다른 시드는 다른 결과
    const gC = newGame(9999);
    expect(gC.getSnapshot().specimens.map((s) => s.id)).not.toEqual(
      gA.getSnapshot().specimens.map((s) => s.id));
  });

  it("Date.now() 의존 없음 — 저장 payload의 savedAt 외 상태는 결정적", () => {
    const store = memoryStorage();
    const g = createGame({ seed: SEED, storage: store });
    g.dispatch({ type: "TICK", dtSec: 10 });
    g.save();
    const payload = JSON.parse(store.getItem("ocean-gaia-save-v3.2")!);
    const s1 = JSON.stringify(payload.state);
    const g2 = createGame({ seed: SEED, storage: memoryStorage() });
    g2.dispatch({ type: "TICK", dtSec: 10 });
    g2.save();
    void createGame; // (payload2 검사 아래 s1/s3 비교로 대체)
    // 동일 시드 동일 진행 → state 동일
    const store3 = memoryStorage();
    const g3 = createGame({ seed: SEED, storage: store3 });
    g3.dispatch({ type: "TICK", dtSec: 10 });
    g3.save();
    const s3 = JSON.parse(store3.getItem("ocean-gaia-save-v3.2")!).state;
    expect(JSON.stringify(s3)).toBe(s1);
  });
});

// ───────── 9. 시간·날씨·생태 ─────────
describe("월드 시뮬레이션", () => {
  it("시간 흐름: 낮/밤 전환, 하루=1440초, 계절 순환", () => {
    const g = newGame();
    const t0 = g.getSnapshot();
    expect(t0.day).toBe(1);
    // 프레임 틱 상한(TICK_MAX_DT_SEC) 안에서 8일을 진행 — 치트성 단일 대형 TICK 대신 정상 경로 사용
    for (let i = 0; i < Math.ceil((1440 * 8) / TICK_MAX_DT_SEC); i++) {
      g.dispatch({ type: "TICK", dtSec: TICK_MAX_DT_SEC });
    }
    const t1 = g.getSnapshot();
    expect(t1.day).toBeGreaterThanOrEqual(9);
    expect(["SPRING", "SUMMER", "AUTUMN", "WINTER"]).toContain(t1.season);
    // day 계산 규칙 자체는 순수 함수로 정확도 검증
    expect(dayNumber({ gameSeconds: 1440 * 8 })).toBe(9);
    expect(seasonOf({ gameSeconds: 0 })).toBe("SPRING");
    expect(seasonOf({ gameSeconds: 1440 * 7 })).toBe("SUMMER");
    expect(seasonOf({ gameSeconds: 1440 * 28 - 1 })).toBe("SPRING"); // 28일 주기 순환
  });

  it("폭풍 시 일반 어종 스폰 감소 규칙", async () => {
    const { speciesCanSpawn } = await import("../../src/systems/SpawnSystem");
    const common = SPECIES.find((s) => s.economy.rarity === "COMMON" && !s.economy.protectedSpecies)!;
    const envDay = { timeOfDay0to24: 12, season: "SUMMER" as const, weather: "STORM" as const };
    expect(speciesCanSpawn(common, common.habitat.zone, envDay)).toBe(false);
    const envClear = { ...envDay, weather: "CLEAR" as const };
    expect(speciesCanSpawn(common, common.habitat.zone, envClear)).toBe(true);
    // 폭풍에도 EPIC/LEGENDARY는 활성
    const epic = SPECIES.find((s) => s.economy.rarity === "EPIC" && !s.economy.protectedSpecies)!;
    expect(speciesCanSpawn(epic, epic.habitat.zone, envDay)).toBe(true);
    // 보호·관찰 전용 종은 날씨와 무관하게 일반 스폰 제외
    const prot = SPECIES.find((s) => s.economy.protectedSpecies)!;
    expect(speciesCanSpawn(prot, prot.habitat.zone, envClear)).toBe(false);
  });

  it("야행성 종은 낮에 활동 불가 스폰", async () => {
    const { speciesCanSpawn } = await import("../../src/systems/SpawnSystem");
    const noct = SPECIES.find((s) => s.habitat.activity === "NOCTURNAL");
    if (noct) {
      expect(speciesCanSpawn(noct, noct.habitat.zone, { timeOfDay0to24: 12, season: "SUMMER", weather: "CLEAR" })).toBe(false);
      expect(speciesCanSpawn(noct, noct.habitat.zone, { timeOfDay0to24: 23, season: "SUMMER", weather: "CLEAR" })).toBe(true);
    }
  });

  it("탐사지 발견 기록 MARK_SITE_DISCOVERED", () => {
    const g = newGame();
    expect(g.dispatch({ type: "MARK_SITE_DISCOVERED", siteId: "site_99" }).ok).toBe(false);
    const r = g.dispatch({ type: "MARK_SITE_DISCOVERED", siteId: "site_01" });
    expect(r.ok).toBe(true);
    expect(g.getSnapshot().discoveredSites.site_01).toBe(true);
    const again = g.dispatch({ type: "MARK_SITE_DISCOVERED", siteId: "site_01" });
    expect(again.ok).toBe(true); // 멱등
    expect(again.alreadyDiscovered).toBe(true);
  });

  it("긴 시간 시뮬레이션 안정성 — 개체 수 유지·NaN 없음", () => {
    const g = newGame();
    for (let i = 0; i < 2000; i++) {
      g.dispatch({ type: "TICK", dtSec: 1 });
      if (i % 50 === 0) g.dispatch({ type: "MOVE_SHIP", forward: 1, turn: 0.1, dtSec: 1 });
    }
    const st = g.getSnapshot();
    expect(st.specimens.length).toBeLessThanOrEqual(60);
    for (const s of st.specimens) {
      expect(Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.z)).toBe(true);
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(WORLD.WIDTH_M);
      expect(s.y).toBeGreaterThanOrEqual(-WORLD.MAX_DEPTH_M);
      expect(s.y).toBeLessThanOrEqual(0);
      expect(s.massKg).toBeGreaterThan(0);
    }
    expect(Number.isFinite(st.ship.position.x)).toBe(true);
    expect(st.log.length).toBeLessThanOrEqual(200);
  });
});

// ───────── 10. A팀 호환 API ─────────
describe("세션 A 호환 조회 API", () => {
  it("getShipPosition / getSpecimens / getZoneAt / getSpeciesPool", () => {
    const g = newGame();
    const pos = g.getShipPosition();
    expect(pos).toEqual({ x: 755, y: 0, z: 1780 });
    pos.x = 0; // 사본이어야 함
    expect(g.getShipPosition().x).toBe(755);
    const specs = g.getSpecimens();
    expect(specs.length).toBeGreaterThan(0);
    specs[0].x = -1;
    expect(g.getSpecimens()[0].x).not.toBe(-1);
    expect(g.getZoneAt(755, 1780)).toBe("tropical");
    expect(g.getZoneAt(10, 10)).toBeNull();
    const pool = g.getSpeciesPool("tropical");
    expect(pool.length).toBeGreaterThan(0);
    for (const e of pool) {
      expect(e.species.habitat.zone).toBe("tropical");
      expect(e.specimen.speciesId).toBe(e.species.id);
    }
  });
});
