import assert from "node:assert/strict";
import { test } from "node:test";
import { nextSeasonReady, parseSeason, probeNextSeason, type ShotGameRow } from "../lib/data/seasons.ts";
import { versusOpponents } from "../lib/data/aggregate.ts";
import { NETS_TEAM_ID, TEAMS } from "../lib/data/teams.ts";
import { assemblePlayerPage, assembleTeamPage, mapLimit, playerRows, SEASON_INDEX_CONCURRENCY, seasonData, seasonPlayerGames } from "../lib/pageData.ts";
import { playerHref, seasonQuery, withParams } from "../lib/links.ts";
import { internalPath, isInternalPath, isOgImagePath } from "../lib/routes.ts";
import { LAST_KNOWN_SEASON } from "../lib/seasonRange.ts";
import { fixtureGameLogs, fixtureShots } from "./helpers.ts";

const shots = await fixtureShots();
const data = seasonData(2026, shots, []);
const logs = await fixtureGameLogs();

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
  // Out-of-range years cannot mint cache entries: they read as the current season.
  assert.equal(internalPath("/players/1629008", q("season=9999")), "/players/1629008/current");
  assert.equal(internalPath("/players/1629008", q("season=2015")), "/players/1629008/current");
  assert.equal(internalPath("/players/1629008", q(`season=${LAST_KNOWN_SEASON + 1}`)), `/players/1629008/${LAST_KNOWN_SEASON + 1}`);
  assert.equal(internalPath("/teams/1610612751/", q("season=2020")), "/teams/1610612751/2020");
  assert.equal(internalPath("/teams", q("")), "/teams/list/current");
  assert.equal(internalPath("/scatter", q("season=2024")), "/scatter/2024");
  assert.equal(internalPath("/leaders", q("")), "/leaders/current");
  assert.equal(internalPath("/about", q("")), null);
  assert.equal(internalPath("/players/abc", q("")), null);
});

test("internal routes (noindex) are told apart from public ones", () => {
  for (const p of ["/home/current", "/scatter/current", "/leaders/2025", "/players/list/2026/BKN", "/players/1629008/current", "/players/1629008/2025/opengraph-image", "/teams/list/current", "/teams/1610612751/2026"]) {
    assert.ok(isInternalPath(p), p);
  }
  for (const p of ["/", "/players", "/players/1629008", "/teams", "/teams/1610612751", "/scatter", "/leaders", "/about", "/sitemap.xml"]) {
    assert.ok(!isInternalPath(p), p);
  }
});

test("player page data for the fixture's busiest player", () => {
  const top = data.players[0];
  const page = assemblePlayerPage(data, top.person_id, null, logs);
  assert.ok(page);
  const mine = shots.filter((s) => s.person_id === top.person_id);
  assert.equal(page.line.attempts, mine.length);
  assert.equal(page.line.makes, mine.filter((s) => s.shot_result === "Made").length);
  assert.equal(page.line.fg3a, mine.filter((s) => s.shot_value === 3).length);
  const fgm = mine.filter((s) => s.shot_result === "Made").length;
  const threes = mine.filter((s) => s.shot_value === 3);
  const fg3m = threes.filter((s) => s.shot_result === "Made").length;
  assert.equal(page.line.efgPct, (fgm + 0.5 * fg3m) / mine.length, "eFG% = (FGM + 0.5 * 3PM) / FGA from the fixture's own counts");
  assert.equal(page.line.fg3Pct, fg3m / threes.length);
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
  assert.equal(assemblePlayerPage(data, 1, null, logs), null);
  // Explorer: the shots and games the browser re-filters, in date order.
  const ex = page.explorer;
  assert.equal(ex.shots.length, mine.length);
  assert.deepEqual(Object.keys(ex.shots[0]).sort(), ["game_id", "shot_distance", "shot_result", "shot_value", "x_legacy", "y_legacy"], "no team_id: the browser never reads it");
  assert.ok(ex.games && ex.games.length > 0);
  assert.equal(ex.games.reduce((a, g) => a + g.attempts, 0), mine.length);
  assert.equal(versusOpponents(ex.games).reduce((a, r) => a + r.attempts, 0), mine.length, "the browser's versus bars cover every shot");
  assert.equal(page.ranks.length, 5);
  // Without game logs (or with a game missing from them) the per-game views are unavailable, not a 500.
  const noLogs = assemblePlayerPage(data, top.person_id, null, null);
  assert.equal(noLogs?.explorer.games, null);
  const partial = assemblePlayerPage(data, top.person_id, null, logs.slice(2));
  assert.equal(partial?.explorer.games, null);
});

test("team page data and table rows", () => {
  const page = assembleTeamPage(data, NETS_TEAM_ID);
  assert.ok(page);
  assert.equal(page.team.tricode, "BKN");
  assert.equal(page.line.attempts, 2000);
  assert.equal(page.roster.length, 16);
  assert.equal(assembleTeamPage(data, 1610612737), null, "no Hawks shots in the fixture");
  const rows = page.roster;
  assert.equal(rows.reduce((a, r) => a + r.fga, 0), 2000);
  assert.ok(rows.every((r) => r.gp === null && !r.acrossTeams), "no stats rows in the fixture");
  const top = rows[0];
  const mine = shots.filter((s) => s.person_id === top.person_id);
  const rim = mine.filter((s) => Math.hypot(s.x_legacy, s.y_legacy) <= 40 && s.shot_value === 2);
  assert.equal(top.rimPct, rim.filter((s) => s.shot_result === "Made").length / rim.length, "rim FG% is the restricted-area zone");
  assert.equal(top.fg3Rate, mine.filter((s) => s.shot_value === 3).length / mine.length);
  assert.equal(playerRows(data.players)[0].attempts, data.players[0].attempts);
});

const row = (game_id: string, team_id: number): ShotGameRow => ({ game_id, team_id });
const everyTeam = TEAMS.map((t, i) => row(`00226${String(i + 1).padStart(5, "0")}`, t.team_id));

test("the next season becomes current only when every team has a regular-season shot and stats exist", () => {
  assert.equal(nextSeasonReady([], true), false, "no shots file yet");
  assert.equal(nextSeasonReady(TEAMS.map((t) => row("0012600001", t.team_id)), true), false, "preseason (001) only");
  const openingNight = [row("0022600001", NETS_TEAM_ID), row("0022600001", 1610612738)];
  assert.equal(nextSeasonReady(openingNight, true), false, "one game played: most teams (maybe the Nets) have no shots");
  assert.equal(nextSeasonReady(everyTeam.slice(1), true), false, "29 of 30 teams");
  assert.equal(nextSeasonReady(everyTeam, false), false, "shots present, stats missing");
  assert.equal(nextSeasonReady(everyTeam, true), true);
});

test("the season probe wires the stats HEAD into the answer", async () => {
  let heads = 0;
  const reads = (rows: ShotGameRow[], status: number) => ({
    shots: async () => rows,
    statsStatus: async () => ((heads += 1), status),
  });
  assert.equal(await probeNextSeason(reads(everyTeam, 200)), true);
  assert.equal(await probeNextSeason(reads(everyTeam, 404)), false, "a missing stats file keeps the season closed");
  await assert.rejects(probeNextSeason(reads(everyTeam, 503)), /HEAD 503/, "an unknown answer is not a no");
  heads = 0;
  assert.equal(await probeNextSeason(reads(everyTeam.slice(0, 2), 200)), false);
  assert.equal(heads, 0, "no stats request before every team has played");
});

test("links to the current season carry no ?season=, others do; defaults drop out of the query", () => {
  assert.equal(seasonQuery(2026, 2026), "");
  assert.equal(playerHref(1629008, seasonQuery(2025, 2026)), "/players/1629008?season=2025");
  const defaults = { season: "2026", team: "BKN" };
  assert.equal(withParams("/players", { season: "2026", team: "BKN" }, defaults), "/players");
  assert.equal(withParams("/players", { season: "2020", team: "LAL" }, defaults), "/players?season=2020&team=LAL");
  assert.equal(withParams("/players", { season: "2026", team: "ALL" }, defaults), "/players?team=ALL");
});

test("only the OG image is served straight from an internal path", () => {
  assert.ok(isOgImagePath("/players/1629008/current/opengraph-image"));
  assert.ok(isOgImagePath("/players/1629008/2025/opengraph-image"));
  assert.ok(isOgImagePath(`/players/1629008/${LAST_KNOWN_SEASON + 1}/opengraph-image`));
  for (const season of ["foo", "2015", "9999", `${LAST_KNOWN_SEASON + 2}`, "02025", "current2"]) {
    assert.ok(!isOgImagePath(`/players/1629008/${season}/opengraph-image`), `clamped: ${season}`);
  }
  assert.ok(!isOgImagePath("/players/12345678901/current/opengraph-image"), "ids are at most 10 digits, like the public route");
  assert.ok(!isOgImagePath("/players/1629008/current"));
  assert.ok(!isOgImagePath("/players/1629008/..%2F..%2Fabout"));
  assert.ok(isInternalPath("/players/1629008/..%2F..%2Fabout"), "crafted internal paths are internal (so they 404)");
});

test("the season index reads at most two files at once, and keeps season order", async () => {
  assert.equal(SEASON_INDEX_CONCURRENCY, 2);
  let inFlight = 0;
  let peak = 0;
  const seasons = [2016, 2017, 2018, 2019, 2020, 2021, 2022];
  const out = await mapLimit(seasons, SEASON_INDEX_CONCURRENCY, async (season) => {
    peak = Math.max(peak, ++inFlight);
    await new Promise((resolve) => setTimeout(resolve, (2023 - season) * 2)); // later seasons finish first
    inFlight -= 1;
    return season * 10;
  });
  assert.equal(peak, 2);
  assert.deepEqual(out, seasons.map((s) => s * 10));
  assert.deepEqual(await mapLimit([], 2, async () => 1), []);
});

test("seasonPlayerGames: every shooter mapped (name, latest team, dated games); a game the logs lack skips only its shooters", () => {
  const all = seasonPlayerGames(data, logs);
  assert.equal(all.length, data.players.length, "every shooter in the fixture has games");
  for (const p of all) {
    const season = data.players.find((q) => q.person_id === p.person_id);
    assert.equal(p.name, season?.player_name);
    assert.deepEqual([p.team_id, p.team], [NETS_TEAM_ID, "BKN"]);
    assert.deepEqual(p.games.map((g) => g.date), p.games.map((g) => g.date).sort());
    assert.equal(p.games.reduce((a, g) => a + g.attempts, 0), shots.filter((s) => s.person_id === p.person_id).length);
  }
  const dropped = logs[0].game_id;
  const inDropped = new Set(shots.filter((s) => s.game_id === dropped).map((s) => s.person_id));
  const partial = seasonPlayerGames(data, logs.filter((r) => r.game_id !== dropped));
  assert.ok(inDropped.size > 0 && inDropped.size < all.length);
  assert.deepEqual(partial.map((p) => p.person_id).sort(), all.map((p) => p.person_id).filter((id) => !inDropped.has(id)).sort(), "only the players who shot in that game drop out");
});
