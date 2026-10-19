import { it } from "vitest";
import { createGame } from "../src/core/GameEngine";

it("dbg", () => {
  const g = createGame({ seed: 12345 });
  let st = g.getSnapshot();
  console.log("ship", st.ship.position, "heading", st.ship.headingRad.toFixed(3));
  for (let i = 0; i < 60; i++) g.dispatch({ type: "MOVE_SHIP", forward: 1, turn: 0, dtSec: 1/30 });
  const a = g.getSnapshot().ship.position;
  console.log("after60", a, "distFromStart", Math.hypot(a.x-755, a.z-1780).toFixed(2));
  // diver approach dbg
  const target = g.getSnapshot().specimens.find(s => s.y < -1)!;
  console.log("target", target.id, target.x.toFixed(1), target.y.toFixed(1), target.z.toFixed(1));
  g.dispatch({ type: "ENTER_WATER" });
  let guard = 0;
  while (guard++ < 400) {
    const s = g.getSnapshot();
    if (s.diver.mode === "ON_SHIP") { g.dispatch({ type: "ENTER_WATER" }); continue; }
    const p = s.diver.position;
    const cur = s.specimens.find(sp => sp.id === target.id);
    if (!cur) { console.log("target gone at guard", guard); break; }
    const dx = cur.x - p.x, dy = cur.y - p.y, dz = cur.z - p.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 4) { console.log("near dist", dist.toFixed(2), "diverY", p.y.toFixed(2), "curY", cur.y.toFixed(2), "guard", guard); break; }
    const cl = (v: number) => Math.max(-1, Math.min(1, v));
    const r = g.dispatch({ type: "MOVE_DIVER", dx: cl(dx), dy: cl(dy), dz: cl(dz) });
    if (!r.ok && guard % 50 === 0) console.log("move fail", r.reason);
  }
  const s2 = g.getSnapshot();
  const cur = s2.specimens.find(sp => sp.id === target.id);
  if (cur) {
    const p = s2.diver.position;
    const d = Math.hypot(cur.x-p.x, cur.y-p.y, cur.z-p.z);
    const r = g.dispatch({ type: "CATCH_ATTEMPT", specimenId: target.id, distanceM: d });
    console.log("catch attempt d=", d.toFixed(2), "ok=", r.ok, "reason=", r.reason);
  }
});
