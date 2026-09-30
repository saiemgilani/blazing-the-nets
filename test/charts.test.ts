import assert from "node:assert/strict";
import { test } from "node:test";
import { fgPctByDistance, hexesVsLeague, statsBySide, vsLeague } from "../lib/data/aggregate.ts";
import { THREE_BREAK_Y, toSvgLength, zoneLines } from "../lib/data/court.ts";
import { courtViewport } from "../lib/charts/court.ts";
import { barLayout, DISTANCE_BARS_VIEWBOX } from "../lib/charts/distanceBars.ts";
import { layoutHexes } from "../lib/charts/hexShotChart.ts";
import { kernelSmooth, MIN_SUPPORT, signaturePoints } from "../lib/charts/shootingSignature.ts";
import { sideLayout } from "../lib/charts/sideChart.ts";
import { diffColor, DIFF_DOMAIN, TOKENS } from "../lib/charts/theme.ts";
import { fixtureShots } from "./helpers.ts";

const league = await fixtureShots();
const topId = [...Map.groupBy(league, (s) => s.person_id)].sort((a, b) => b[1].length - a[1].length)[0][0];
const mine = league.filter((s) => s.person_id === topId);

const rgb = (c: string) => {
  const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(c);
  assert.ok(m, `not rgb: ${c}`);
  return m.slice(1).map(Number);
};

test("diff colours: hot red, cold blue, near-white at 0, clamped, muted without a league figure", () => {
  const [hr, , hb] = rgb(diffColor(0.1));
  const [cr, , cb] = rgb(diffColor(-0.1));
  assert.ok(hr > hb + 80, `+0.1 should be red: ${diffColor(0.1)}`);
  assert.ok(cb > cr + 80, `-0.1 should be blue: ${diffColor(-0.1)}`);
  assert.ok(rgb(diffColor(0)).every((ch) => ch > 230), `0 should be near white: ${diffColor(0)}`);
  assert.equal(diffColor(0.4), diffColor(DIFF_DOMAIN));
  assert.equal(diffColor(null), TOKENS.muted);
});

test("hex marks stay in the court viewport, sized by a capped sqrt scale, rim hex at the bottom centre", () => {
  const radius = 15;
  const v = courtViewport();
  const { marks, cap, size } = layoutHexes(hexesVsLeague(mine, league, radius), radius, v);
  assert.ok(marks.length > 20);
  assert.ok(marks.every((m) => m.cx >= -1 && m.cx <= v.width + 1 && m.cy >= 0 && m.cy <= v.height + 1));
  assert.ok(marks.every((m, i) => i === 0 || marks[i - 1].hex.attempts <= m.hex.attempts), "drawn smallest first");
  assert.equal(size(cap * 10), toSvgLength(radius, v), "size is capped at the hex radius");
  assert.ok(Math.abs(size(cap / 4) - toSvgLength(radius, v) / 2) < 1e-9, "sqrt scale");
  const busiest = marks[marks.length - 1];
  assert.ok(Math.abs(busiest.cx - 250) < 30 && Math.abs(busiest.cy - 350) < 30, `busiest hex at ${busiest.cx},${busiest.cy}`);
});

test("hexes carry the league FG% of the same hex (or the zone when the league hex is thin)", () => {
  const hexes = hexesVsLeague(mine, league, 15, 1);
  assert.ok(hexes.every((h) => h.leagueFgPct !== null && h.leagueFgPct >= 0 && h.leagueFgPct <= 1));
  const self = hexesVsLeague(league, league, 15, 1);
  assert.ok(self.every((h) => h.leagueFgPct === h.fgPct), "a player compared with himself has zero diff");
});

test("kernel smoothing is a weighted local mean", () => {
  assert.deepEqual(kernelSmooth([0.5, 0.5, 0.5], [1, 2, 3], 1), [0.5, 0.5, 0.5]);
  const s = kernelSmooth([1, 0, 0, 0, 0, 0, 0, 0, 0], [5, 0, 0, 0, 0, 0, 0, 0, 0], 0.9);
  assert.equal(s[0], 1);
  assert.equal(s[8], 0, "no weight in reach -> 0");
});

test("signature points every 0.25 ft; no support where the player has no attempts", () => {
  const points = signaturePoints(vsLeague(fgPctByDistance(mine), fgPctByDistance(league)));
  assert.equal(points.length, 141);
  assert.equal(points[4].distance, 1);
  const shotFeet = new Set(mine.map((s) => s.shot_distance));
  for (const p of points.filter((q) => Number.isInteger(q.distance))) {
    const near = [...shotFeet].some((d) => Math.abs(d - p.distance) <= 2);
    if (!near) assert.ok(p.support < MIN_SUPPORT, `support at ${p.distance} ft`);
  }
  assert.ok(points.every((p) => p.fgPct >= 0 && p.fgPct <= 1));
});

test("distance bars: 12 three-foot groups, bars inside their band, FG% on a 0-1 axis", () => {
  const data = { player: fgPctByDistance(mine, 3), league: fgPctByDistance(league, 3), binFt: 3 };
  const fg = barLayout(data, "fgPct");
  assert.equal(fg.yMax, 1);
  assert.equal(fg.groups.length, 12);
  assert.equal(fg.groups[0].label, "0-2");
  const plot = DISTANCE_BARS_VIEWBOX.height - 34 - 24;
  for (const g of fg.groups) {
    for (const b of g.bars) {
      assert.ok(b.x >= g.x - 1e-9 && b.x + b.width <= g.x + g.width + 1e-9);
      if (b.value !== null) assert.ok(Math.abs(b.height - b.value * plot) < 1e-6);
    }
  }
  const share = barLayout(data, "share");
  assert.ok(share.yMax > Math.max(...data.player.map((b) => b.share)));
});

test("side bars mirror around the centre column and shares add to 1", () => {
  const data = { player: statsBySide(mine, 3), league: statsBySide(league, 3), binFt: 3 };
  const { rows } = sideLayout(data, "share");
  const lefts = rows.map((r) => r.bars[0]);
  const rights = rows.map((r) => r.bars[2]);
  const leftEdge = Math.max(...lefts.map((b) => b.x + b.width));
  assert.ok(lefts.every((b) => Math.abs(b.x + b.width - leftEdge) < 1e-9), "left bars end at the centre column");
  assert.ok(rights.every((b) => b.x === rights[0].x), "right bars start at the centre column");
  assert.ok(rights[0].x > leftEdge);
  const total = rows.flatMap((r) => r.bars).reduce((a, b) => a + (b.value ?? 0), 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `shares sum to ${total}`);
});

test("zone outlines add the corner breaks at the arc height", () => {
  const v = courtViewport();
  const names = zoneLines(v).map((l) => l.name);
  assert.deepEqual(names, ["paint", "restricted-area", "three-point-line", "corner-break-left", "corner-break-right"]);
  const y = (v.top - THREE_BREAK_Y) * v.scale;
  assert.ok(zoneLines(v).at(-1)?.d.includes(`,${y.toFixed(2)}`));
});
