import { createGame } from '/workspace/src/core/GameEngine.js';
const g = createGame({ seed: 12345 });
g._state.ship.docked = false;
for (let i = 0; i < 30; i++) {
  const r = g.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0.3, dtSec: 1 });
  console.log(i, 'ok=', r.ok, r.reason || '', 'pos', Math.round(g._state.ship.x), Math.round(g._state.ship.z));
}
