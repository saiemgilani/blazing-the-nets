import assert from "node:assert/strict";
import { test } from "node:test";
import { playerGames } from "../lib/data/aggregate.ts";
import { teamGames } from "../lib/data/games.ts";
import { compareParam, gamesParam, oneOf, parseCompare, parseGames, parseWindow, unlessDefault, type Compare } from "../lib/viewParams.ts";
import { fixtureGameLogs, fixtureShots } from "./helpers.ts";

const games = playerGames(await fixtureShots(), teamGames(await fixtureGameLogs()));
const first = games[0].date;
const last = games[games.length - 1].date;

test("compare params round-trip, and malformed ones read as no compare", () => {
  const cases: Compare[] = [{ kind: "player", id: 1629008 }, { kind: "season", season: 2003 }, { kind: "split" }];
  for (const c of cases) assert.deepEqual(parseCompare(compareParam(c)), c);
  for (const bad of [null, "", "player:", "player:abc", "season:03", "split:home", "team:1", "player:12345678901"]) {
    assert.equal(parseCompare(bad), null, String(bad));
  }
});

test("game selections round-trip: presets by name, every game as no param, anything else as ids", () => {
  const all = new Set(games.map((g) => g.game_id));
  assert.equal(gamesParam(all, games), null);
  assert.deepEqual(parseGames(null, games), all);
  const home = parseGames("home", games);
  assert.ok(home.size > 0 && home.size < all.size);
  assert.equal(gamesParam(home, games), "home");
  assert.equal(gamesParam(new Set(), games), "none");
  assert.equal(parseGames("none", games).size, 0);
  const custom = new Set([games[0].game_id, games[3].game_id]);
  const param = gamesParam(custom, games);
  assert.equal(param, `${games[0].game_id}-${games[3].game_id}`);
  assert.deepEqual(parseGames(param, games), custom);
  assert.deepEqual(parseGames(`${games[1].game_id}-nope`, games), new Set([games[1].game_id]), "unknown ids are dropped");
  assert.deepEqual(parseGames("garbage", games), all, "nothing valid: every game");
});

test("date windows go through the typed-date rules", () => {
  assert.equal(parseWindow(null, null, first, last), null);
  const [d2, d10] = [games[2].date, games[10].date];
  assert.deepEqual(parseWindow(d2, d10, first, last), [d2, d10]);
  assert.equal(parseWindow("2025-02-30", null, first, last), null, "not a date");
  assert.equal(parseWindow("1990-01-01", "2030-01-01", first, last), null, "outside the season");
  assert.deepEqual(parseWindow(d10, d2, first, last), [d2, d2], "To before From pulls From back");
});

test("oneOf and unlessDefault keep defaults out of the URL", () => {
  assert.equal(oneOf([5, 10, 20] as const, "20", 10), 20);
  assert.equal(oneOf([5, 10, 20] as const, "7", 10), 10);
  assert.equal(oneOf(["raw", "zones"] as const, null, "raw"), "raw");
  assert.equal(unlessDefault(10, 10), null);
  assert.equal(unlessDefault("zones", "raw"), "zones");
});
