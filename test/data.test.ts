import assert from "node:assert/strict";
import { test } from "node:test";
import { playerIndex, withStats, type PlayerStatsRow } from "../lib/data/players.ts";
import { releaseUrl } from "../lib/data/releases.ts";
import { bridgeHeadshots, normalizeName } from "../lib/data/rosters.ts";
import { seasonLabel, seasonsFromAssets } from "../lib/data/seasons.ts";
import { filterSeasonType } from "../lib/data/shots.ts";
import { NETS_TEAM_ID, TEAMS, teamById, teamsFromShots } from "../lib/data/teams.ts";
import { fixtureShots, shot } from "./helpers.ts";

const shots = await fixtureShots();

test("release asset URLs point at sportsdataverse-data downloads", () => {
  assert.equal(
    releaseUrl("nba_stats_shots", "shots_2026.parquet"),
    "https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_shots/shots_2026.parquet",
  );
});

test("seasons come from shots_<year>.parquet assets, 2016 on", () => {
  const names = ["shots_1997.parquet", "shots_2016.parquet", "shots_2026.csv", "shots_2026.parquet", "shots_2017.parquet", "timestamp.json"];
  assert.deepEqual(seasonsFromAssets(names), [2016, 2017, 2026]);
  assert.deepEqual(seasonsFromAssets(names, 1997), [1997, 2016, 2017, 2026]);
  assert.equal(seasonLabel(2026), "2025-26");
  assert.equal(seasonLabel(2000), "1999-00");
});

test("the static team map has 30 franchises and the Nets are 1610612751 / BKN", () => {
  assert.equal(new Set(TEAMS.map((t) => t.team_id)).size, 30);
  assert.equal(new Set(TEAMS.map((t) => t.espn_id)).size, 30);
  assert.equal(NETS_TEAM_ID, 1610612751);
  assert.equal(teamById(NETS_TEAM_ID)?.tricode, "BKN");
  assert.deepEqual(teamsFromShots(shots).map((t) => [t.team_id, t.tricode, t.name]), [[NETS_TEAM_ID, "BKN", "Brooklyn Nets"]]);
});

test("season type follows the game_id prefix", () => {
  const mixed = [shot(0, 0, 2, true, "0022500001"), shot(0, 0, 2, true, "0042500101")];
  assert.equal(filterSeasonType(mixed, "regular").length, 1);
  assert.equal(filterSeasonType(mixed, "playoffs")[0].game_id, "0042500101");
  assert.equal(filterSeasonType(mixed, "all").length, 2);
  assert.equal(filterSeasonType(shots, "regular").length, 2000);
});

test("playerIndex gives one row per shooter, busiest first", () => {
  const index = playerIndex(shots);
  assert.equal(index.length, 16);
  assert.equal(index.reduce((a, p) => a + p.attempts, 0), 2000);
  assert.ok(index.every((p, i) => i === 0 || index[i - 1].attempts >= p.attempts));
  assert.ok(index.every((p) => p.team_id === NETS_TEAM_ID && p.stats === null));
});

test("a traded player's primary team is the one he shot most for", () => {
  const traded = [
    { ...shot(0, 0, 2, true), team_id: 1, team_tricode: "AAA" },
    { ...shot(0, 0, 2, true), team_id: 2, team_tricode: "BBB" },
    { ...shot(0, 0, 2, false), team_id: 2, team_tricode: "BBB" },
  ];
  const [p] = playerIndex(traded);
  assert.deepEqual([p.team_id, p.team_tricode, p.attempts, p.makes], [2, "BBB", 3, 2]);
});

test("withStats joins the regular-season advanced totals row by player id", () => {
  const row = (measure_type: string, fga: number): PlayerStatsRow => ({
    player_id: 1,
    player_name: "Test Player",
    season_type: "regular-season",
    measure_type,
    per_mode: "totals",
    gp: 70,
    min: 30.5,
    fga,
    fg_pct: 0.5,
    efg_pct: 0.55,
    ts_pct: 0.6,
    usg_pct: 0.25,
    pie: 0.12,
  });
  const [p] = withStats(playerIndex([shot(0, 0, 2, true)]), [row("base", 1), row("advanced", 900)]);
  assert.equal(p.player_name, "Test Player");
  assert.deepEqual(p.stats, { gp: 70, min: 30.5, fga: 900, fg_pct: 0.5, efg_pct: 0.55, ts_pct: 0.6, usg_pct: 0.25, pie: 0.12 });
  assert.equal(withStats(playerIndex([{ ...shot(0, 0, 2, true), person_id: 2 }]), [row("advanced", 900)])[0].stats, null);
});

test("names fold case, accents, punctuation and suffixes", () => {
  assert.equal(normalizeName("Nikola Jokić"), "nikola jokic");
  assert.equal(normalizeName("Michael Porter Jr."), "michael porter");
  assert.equal(normalizeName("Day'Ron Sharpe"), "dayron sharpe");
  assert.equal(normalizeName("Nickeil Alexander-Walker"), "nickeil alexander walker");
});

test("headshots bridge by crosswalk first, then by a unique name", () => {
  const players = [
    { person_id: 1, player_name: "Alpha One" },
    { person_id: 2, player_name: "Beta Two Jr." },
    { person_id: 3, player_name: "Same Name" },
    { person_id: 4, player_name: "No Photo" },
  ];
  const athletes = [
    { athlete_id: "10", full_name: "Totally Different", headshot_href: "https://a.espncdn.com/10.png" },
    { athlete_id: "20", full_name: "Beta Two", headshot_href: "https://a.espncdn.com/20.png" },
    { athlete_id: "30", full_name: "Same Name", headshot_href: "https://a.espncdn.com/30.png" },
    { athlete_id: "31", full_name: "Same Name", headshot_href: "https://a.espncdn.com/31.png" },
    { athlete_id: "40", full_name: "No Photo", headshot_href: null },
  ];
  const out = bridgeHeadshots(players, athletes, [{ nba_player_id: "1", espn_athlete_id: "10" }, { nba_player_id: null, espn_athlete_id: "40" }]);
  assert.deepEqual([...out], [
    [1, "https://a.espncdn.com/10.png"],
    [2, "https://a.espncdn.com/20.png"],
  ]);
});
