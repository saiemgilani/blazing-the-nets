import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ZONES,
  fgPctByDistance,
  hexbinShots,
  rollingByGame,
  statsBySide,
  statsByZone,
  vsLeague,
  zoneOf,
} from "../lib/data/aggregate.ts";
import { fixtureShots, shot } from "./helpers.ts";

const shots = await fixtureShots();

test("the fixture is 2 000 real Nets attempts from 2025-26", () => {
  assert.equal(shots.length, 2000);
  assert.ok(shots.every((s) => s.team_id === 1610612751 && s.team_tricode === "BKN"));
  assert.equal(shots.filter((s) => s.shot_result === "Made").length, 890);
  assert.equal(new Set(shots.map((s) => s.game_id)).size, 24);
});

test("zones by value, distance and x", () => {
  const cases: [number, number, 2 | 3, string][] = [
    [0, 0, 2, "restricted_area"],
    [0, 39, 2, "restricted_area"],
    [0, 45, 2, "paint"],
    [79, 130, 2, "paint"],
    [85, 100, 2, "mid_range"],
    [0, 200, 2, "mid_range"],
    [-225, 10, 3, "corner_3_left"],
    [225, 85, 3, "corner_3_right"],
    [-225, 95, 3, "above_break_3"],
    [0, 260, 3, "above_break_3"],
  ];
  for (const [x, y, v, zone] of cases) assert.equal(zoneOf({ x_legacy: x, y_legacy: y, shot_value: v }), zone, `${x},${y}`);
});

test("real corner threes sit outside |x| = 220 and every zone adds up", () => {
  const corners = shots.filter((s) => zoneOf(s).startsWith("corner_3"));
  assert.ok(corners.length > 50);
  assert.ok(corners.every((s) => Math.abs(s.x_legacy) >= 215), "corner three inside the line");
  const zones = statsByZone(shots);
  assert.deepEqual(Object.keys(zones), [...ZONES]);
  assert.equal(Object.values(zones).reduce((a, z) => a + z.attempts, 0), 2000);
  assert.ok((zones.restricted_area.fgPct ?? 0) > 0.5, "rim FG% should beat 50%");
  assert.ok((zones.above_break_3.fgPct ?? 1) < 0.45);
});

test("fgPctByDistance bins whole feet and drops attempts past maxFt", () => {
  const bins = fgPctByDistance([shot(0, 0, 2, true), shot(0, 5, 2, false), shot(0, 100, 2, true), shot(0, 400, 3, false)], 1, 35);
  assert.equal(bins.length, 36);
  assert.deepEqual(bins[0], { distance: 0, attempts: 2, makes: 1, fgPct: 0.5, share: 2 / 3 });
  assert.equal(bins[10].fgPct, 1);
  assert.equal(bins[20].fgPct, null);
  const three = fgPctByDistance(shots, 3, 35);
  assert.equal(three.length, 12);
  const within = shots.filter((s) => s.shot_distance <= 35).length;
  assert.equal(three.reduce((a, b) => a + b.attempts, 0), within);
  assert.ok(Math.abs(three.reduce((a, b) => a + b.share, 0) - 1) < 1e-9);
});

test("vsLeague subtracts the league curve bin by bin", () => {
  const player = fgPctByDistance([shot(0, 0, 2, true), shot(0, 0, 2, true)], 1, 2);
  const league = fgPctByDistance([shot(0, 0, 2, true), shot(0, 0, 2, false), shot(0, 12, 2, true)], 1, 2);
  const out = vsLeague(player, league);
  assert.equal(out[0].diff, 0.5);
  assert.equal(out[1].diff, null);
  assert.equal(out[1].leagueFgPct, 1);
});

test("statsBySide splits left, centre (within the rim) and right", () => {
  const bins = statsBySide([shot(-8, 0, 2, true), shot(0, 5, 2, false), shot(7, 0, 2, true), shot(8, 0, 2, false)], 1, 35);
  assert.deepEqual(bins[0].left, { attempts: 1, makes: 1, fgPct: 1 });
  assert.deepEqual(bins[0].centre, { attempts: 2, makes: 1, fgPct: 0.5 });
  assert.deepEqual(bins[0].right, { attempts: 1, makes: 0, fgPct: 0 });
  const real = statsBySide(shots);
  const total = real.reduce((a, b) => a + b.left.attempts + b.centre.attempts + b.right.attempts, 0);
  assert.equal(total, shots.filter((s) => s.shot_distance <= 35).length);
});

test("hexbins keep every attempt and stay on the court", () => {
  const bins = hexbinShots(shots, 15);
  assert.ok(bins.length > 50);
  assert.equal(bins.reduce((a, b) => a + b.attempts, 0), 2000);
  assert.equal(bins.reduce((a, b) => a + b.makes, 0), 890);
  assert.ok(bins.every((b) => Math.abs(b.x) <= 270 && b.meanDistance >= 0));
  const rim = bins.reduce((a, b) => (b.attempts > a.attempts ? b : a));
  assert.ok(Math.hypot(rim.x, rim.y) < 30, "the busiest hex is at the rim");
});

test("rollingByGame orders games and windows the trailing N", () => {
  const series = rollingByGame(
    [shot(0, 0, 2, true, "0022500003"), shot(0, 0, 2, false, "0022500001"), shot(0, 0, 2, true, "0022500002")],
    2,
  );
  assert.deepEqual(series.map((g) => g.game_id), ["0022500001", "0022500002", "0022500003"]);
  assert.deepEqual(series[0].rolling, { attempts: 1, makes: 0, fgPct: 0 });
  assert.deepEqual(series[2].rolling, { attempts: 2, makes: 2, fgPct: 1 });
  const real = rollingByGame(shots, 5);
  assert.equal(real.length, 24);
  assert.equal(real.at(-1)?.rolling.attempts, real.slice(-5).reduce((a, g) => a + g.attempts, 0));
});
