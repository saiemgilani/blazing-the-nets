import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSeason } from "../lib/data/seasons.ts";
import { NETS_TEAM_ID } from "../lib/data/teams.ts";
import { assemblePlayerPage, assembleTeamPage, playerRows, seasonData } from "../lib/pageData.ts";
import { internalPath } from "../lib/routes.ts";
import { fixtureShots } from "./helpers.ts";

const shots = await fixtureShots();
const data = seasonData(2026, shots, []);

test("the season param: a listed season, else the current one", () => {
  const seasons = [2016, 2017, 2025, 2026];
  assert.equal(parseSeason("2025", seasons), 2025);
  assert.equal(parseSeason(["2017", "2025"], seasons), 2017);
  for (const bad of [undefined, "", "current", "abc", "1990", "2027", "20255", "2025.0", " 2025"]) {
    assert.equal(parseSeason(bad, seasons), 2026, `${JSON.stringify(bad)} -> current`);
  }
});

test("public URLs rewrite onto the internal season routes", () => {
  const q = (s: string) => new URLSearchParams(s);
  assert.equal(internalPath("/", q("")), "/home/current");
  assert.equal(internalPath("/", q("season=2025")), "/home/2025");
  assert.equal(internalPath("/players", q("season=2024&team=phx")), "/players/list/2024/PHX");
  assert.equal(internalPath("/players", q("team=all")), "/players/list/current/ALL");
  assert.equal(internalPath("/players", q("team=../x")), "/players/list/current/BKN");
  assert.equal(internalPath("/players/1629008", q("season=abc")), "/players/1629008/current");
  assert.equal(internalPath("/teams/1610612751/", q("season=2020")), "/teams/1610612751/2020");
  assert.equal(internalPath("/teams", q("")), "/teams/list/current");
  assert.equal(internalPath("/about", q("")), null);
  assert.equal(internalPath("/players/abc", q("")), null);
});

test("player page data for the fixture's busiest player", () => {
  const top = data.players[0];
  const page = assemblePlayerPage(data, top.person_id, null);
  assert.ok(page);
  const mine = shots.filter((s) => s.person_id === top.person_id);
  assert.equal(page.line.attempts, mine.length);
  assert.equal(page.line.makes, mine.filter((s) => s.shot_result === "Made").length);
  assert.equal(page.line.fg3a, mine.filter((s) => s.shot_value === 3).length);
  assert.ok(page.line.efgPct !== null && page.line.fgPct !== null && page.line.efgPct >= page.line.fgPct);
  assert.deepEqual(page.teams, ["BKN"]);
  assert.equal(page.prev, null, "the busiest player has no previous teammate");
  assert.equal(page.next?.person_id, data.players[1].person_id);
  const d = page.dashboard;
  assert.ok(d.hex.hexes.length > 20);
  assert.equal(d.hex.hexes.reduce((a, h) => a + h.attempts, 0), mine.length);
  assert.equal(Object.keys(d.hex.zones).length, 6);
  assert.equal(d.signature.length, 36);
  assert.equal(d.bars.player.length, 12);
  assert.equal(d.sides.player.length, 12);
  assert.doesNotThrow(() => JSON.stringify(page), "plain JSON for the client charts");
  assert.equal(assemblePlayerPage(data, 1, null), null);
});

test("team page data and table rows", () => {
  const page = assembleTeamPage(data, NETS_TEAM_ID);
  assert.ok(page);
  assert.equal(page.team.tricode, "BKN");
  assert.equal(page.line.attempts, 2000);
  assert.equal(page.roster.length, 16);
  assert.equal(assembleTeamPage(data, 1610612737), null, "no Hawks shots in the fixture");
  const rows = playerRows(page.roster);
  assert.equal(rows[0].attempts, page.roster[0].attempts);
  assert.ok(rows.every((r) => r.gp === null && !r.acrossTeams), "no stats rows in the fixture");
});
