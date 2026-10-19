// 세션 A 형식(state.ship.position 중첩) ↔ 세션 B 스냅샷 호환 어댑터
export function toSessionAState(snapB) {
  return {
    ...snapB,
    state: {
      ship: {
        position: { x: snapB.ship.x, y: snapB.ship.y, z: snapB.ship.z },
        headingRad: snapB.ship.headingRad,
        speedMs: snapB.ship.speedMs,
        level: snapB.ship.level,
        docked: snapB.ship.docked,
      },
      player: {
        inWater: snapB.diver.inWater,
        position: { x: snapB.diver.x, y: snapB.diver.y, z: snapB.diver.z },
        depthM: snapB.diver.depthM,
        air: snapB.diver.air, maxAir: snapB.diver.maxAir,
      },
    },
  };
}

// A가 보낸 평면 필드(shipX/shipZ) 액션을 B 계약으로 변환
export function fromSessionAAction(action) {
  if (!action) return action;
  switch (action.type) {
    case 'MOVE_SHIP':
      return { type: 'MOVE_SHIP', forward: action.forward ?? 0, turn: action.turn ?? 0, dtSec: action.dtSec ?? 1 / 60 };
    case 'RETURN_TO_SHIP':
    case 'GO_BACK_TO_SHIP': // 구버전 A 호환
      return { type: 'RETURN_TO_SHIP' };
    case 'UNDOCK':
    case 'DEPART': // 세션 A의 출항 액션명 호환
      return { type: 'UNDOCK' };
    case 'ENTER_WATER':
      return { type: 'ENTER_WATER', x: action.x, z: action.z };
    case 'DOCK_AT_HARBOR':
      return { type: 'DOCK' };
    default:
      return action;
  }
}

// 스냅샷에서 어종 정보를 붙여 개체 목록 반환 (세션 A 렌더러용)
export function specimensWithSpecies(snapB, speciesById) {
  return snapB.specimens.map(s => ({
    ...s,
    nameKo: speciesById?.get(s.speciesId)?.nameKo ?? null,
    zone: s.zone ?? null,
  }));
}
