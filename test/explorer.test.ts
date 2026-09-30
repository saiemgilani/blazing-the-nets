import assert from "node:assert/strict";
import { test } from "node:test";
import { stripLayout } from "../lib/charts/gameStrip.ts";
import { rollingDomain } from "../lib/charts/rollingChart.ts";
import { snapWindow } from "../lib/charts/timeline.ts";
import { lineOf, playerGames } from "../lib/data/aggregate.ts";
import { teamGames } from "../lib/data/games.ts";
import type { PlayerSeason, PlayerStats } from "../lib/data/players.ts";
import { metricValue, RANK_MIN_FG3A, rankSummaries, rankTable } from "../lib/data/ranks.ts";
import { GAME_PRESETS, inWindow, presetGames, shotsForGames, visibleGames } from "../lib/selection.ts";
import { fixtureGameLogs, fixtureShots } from "./helpers.ts";

const shots = await fixtureShots();
const games = playerGames(shots, teamGames(await fixtureGameLogs()));

const player = (id: number, attempts: number, makes: number, extra: Partial<PlayerSeason> = {}, stats: Partial<PlayerStats> | null = null): PlayerSeason => ({
  person_id: id,
  player_name: `P${id}`,
  team_id: 1,
  team_tricode: "AAA",
  attempts,
  makes,
  fg3a: 0,
  fg3m: 0,
  stats: stats && {
    gp: 70,
    min: 30,
    fga: attempts,
    fg_pct: makes / attempts,
    efg_pct: null,
    ts_pct: null,
    usg_pct: null,
    pie: null,
    pts_pg: null,
    fga_pg: null,
    min_total: null,
    ...stats,
  },
  statsScope: "matching",
  ...extra,
});

test("ranks: competition ranking with ties, 100-FGA eligibility, best first", () => {
  const players = [player(1, 200, 100), player(2, 200, 90), player(3, 400, 180), player(4, 300, 150), player(5, 99, 90)];
  const table = rankTable(players, "fgPct");
  assert.deepEqual(table.map((r) => [r.person_id, r.rank]), [
    [1, 1],
    [4, 1],
    [2, 3],
    [3, 3],
  ]);
  assert.ok(!table.some((r) => r.person_id === 5), "under 100 FGA is not ranked");
  assert.deepEqual(rankTable(players, "fga").map((r) => r.rank), [1, 2, 3, 3]);
});

test("ranks: stats first, shots otherwise; 3P% needs 50 threes; TS% needs a stats row", () => {
  const withStats = player(1, 200, 90, {}, { fg_pct: 0.5, ts_pct: 0.6 });
  assert.equal(metricValue(withStats, "fgPct"), 0.5, "season stats win over shots");
  assert.equal(metricValue(player(2, 200, 90), "fgPct"), 0.45);
  assert.equal(metricValue(player(2, 200, 90), "tsPct"), null);
  assert.equal(metricValue(withStats, "tsPct"), 0.6);
  assert.equal(metricValue(player(3, 200, 90, { fg3a: RANK_MIN_FG3A - 1, fg3m: 40 }), "fg3Pct"), null);
  assert.equal(metricValue(player(3, 200, 90, { fg3a: 100, fg3m: 40 }), "fg3Pct"), 0.4);
  const efg = player(4, 200, 90, { fg3a: 60, fg3m: 20 });
  assert.equal(metricValue(efg, "efgPct"), lineOf(efg).efgPct);
});

test("rank summaries: his row, N, and the top five", () => {
  const players = Array.from({ length: 8 }, (_, i) => player(i + 1, 100 + i * 10, 50));
  const [fga] = rankSummaries(players, 1);
  assert.equal(fga.metric, "fga");
  assert.equal(fga.of, 8);
  assert.equal(fga.me?.rank, 8);
  assert.deepEqual(fga.top.map((r) => r.person_id), [8, 7, 6, 5, 4]);
  assert.equal(rankSummaries(players, 99)[0].me, null);
});

test("selection presets: home, away and neutral split the season; neutral is in neither preset", () => {
  const mixed = [
    { game_id: "a", venue: "home" as const, win: true },
    { game_id: "b", venue: "away" as const, win: false },
    { game_id: "c", venue: "neutral" as const, win: true },
  ];
  assert.deepEqual(presetGames(mixed, "home"), ["a"]);
  assert.deepEqual(presetGames(mixed, "away"), ["b"]);
  assert.deepEqual(presetGames(mixed, "wins"), ["a", "c"]);
});

test("selection presets on real games: home/away and wins/losses partition every game", () => {
  assert.equal(games.length, 24);
  const ids = (p: (typeof GAME_PRESETS)[number]) => new Set(presetGames(games, p));
  assert.equal(ids("all").size, 24);
  assert.equal(ids("none").size, 0);
  assert.equal(ids("home").size + ids("away").size, 24);
  assert.equal(ids("wins").size + ids("losses").size, games.filter((g) => g.win !== null).length);
  assert.ok([...ids("home")].every((id) => !ids("away").has(id)));
  assert.deepEqual([ids("home").size, ids("wins").size], [13, 6]);
});

test("the date window is inclusive and combines with the selection", () => {
  const all = new Set(games.map((g) => g.game_id));
  const window: [string, string] = [games[3].date, games[7].date];
  const inside = visibleGames(games, all, window);
  assert.ok(inside.length >= 5 && inside.every((g) => inWindow(g.date, window)));
  assert.equal(inside[0].game_id, games[3].game_id);
  assert.equal(visibleGames(games, new Set([games[4].game_id]), window).length, 1);
  assert.equal(visibleGames(games, all, null).length, 24);
  const kept = shotsForGames(shots, new Set(inside.map((g) => g.game_id)));
  assert.equal(kept.length, inside.reduce((a, g) => a + g.attempts, 0));
  assert.equal(shotsForGames(shots, new Set()).length, 0);
});

test("a brush snaps to the first and last game inside it, or clears", () => {
  const d = (s: string) => new Date(`${s}T00:00:00Z`);
  assert.deepEqual(snapWindow(games, d(games[2].date), d(games[5].date)), [games[2].date, games[5].date]);
  assert.equal(snapWindow(games, d("2020-01-01"), d("2020-02-01")), null);
});

test("the game strip wraps by width; the rolling axis pads and clamps", () => {
  const { cells, rows } = stripLayout(games, 190);
  assert.equal(rows, Math.ceil(24 / 10));
  assert.ok(cells.every((c) => c.x + 16 <= 190));
  const points = [{ fgPct: 0.42, efgPct: 0.51 }, { fgPct: 0.38, efgPct: null }].map((p, i) => ({ game_id: String(i), date: "2025-11-01", games: 1, attempts: 10, ...p }));
  assert.deepEqual(rollingDomain(points, 0.45), [0.3, 0.6]);
  assert.deepEqual(rollingDomain([], null), [0, 1]);
  assert.deepEqual(rollingDomain([{ ...points[0], fgPct: 0.98, efgPct: 1 }], null), [0.9, 1]);
});
