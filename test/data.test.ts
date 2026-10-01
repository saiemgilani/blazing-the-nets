import assert from "node:assert/strict";
import { test } from "node:test";
import { playerIndex, seasonPlayers, withStats, type PlayerStatsRow } from "../lib/data/players.ts";
import { memo, releaseUrl, REVALIDATE_SECONDS } from "../lib/data/releases.ts";
import { bridgeHeadshots, normalizeName } from "../lib/data/rosters.ts";
import { FIRST_SEASON, LAST_KNOWN_SEASON, seasonLabel, siteSeasons } from "../lib/data/seasons.ts";
import { filterSeasonType } from "../lib/data/shots.ts";
import { franchiseOf, NETS_TEAM_ID, TEAMS, teamById, teamName, teamsFromShots } from "../lib/data/teams.ts";
import { FIRST_BROOKLYN_SEASON, isAddressableSeason, netsTricode } from "../lib/seasonRange.ts";
import { fixtureShots, shot } from "./helpers.ts";

const shots = await fixtureShots();

test("release asset URLs point at sportsdataverse-data downloads", () => {
  assert.equal(
    releaseUrl("nba_stats_shots", "shots_2026.parquet"),
    "https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_shots/shots_2026.parquet",
  );
});

test("the site lists 1997-98 to the last known season, plus next season once published", () => {
  // The floor is measured (lib/seasonRange.ts): 1996-97 has games without shot locations.
  assert.equal(FIRST_SEASON, 1998);
  assert.ok(!isAddressableSeason(1997) && isAddressableSeason(1998) && isAddressableSeason(LAST_KNOWN_SEASON + 1));
  const known = siteSeasons(false);
  assert.equal(known[0], FIRST_SEASON);
  assert.equal(known.at(-1), LAST_KNOWN_SEASON);
  assert.equal(known.length, LAST_KNOWN_SEASON - FIRST_SEASON + 1);
  assert.equal(siteSeasons(true).at(-1), LAST_KNOWN_SEASON + 1);
  assert.equal(seasonLabel(2026), "2025-26");
  assert.equal(seasonLabel(2000), "1999-00");
});

test("the memo is an LRU of 4 per group and never keeps a rejection", async () => {
  const loads: string[] = [];
  const load = (k: string) => () => (loads.push(k), Promise.resolve(k));
  for (const k of ["a", "b", "c", "d"]) await memo("lru-test", k, load(k));
  await memo("lru-test", "a", load("a")); // touch a: b is now the oldest
  await memo("lru-test", "e", load("e")); // evicts b
  await memo("lru-test", "a", load("a"));
  await memo("lru-test", "b", load("b"));
  assert.deepEqual(loads, ["a", "b", "c", "d", "e", "b"]);

  let calls = 0;
  const flaky = () => (++calls === 1 ? Promise.reject(new Error("503")) : Promise.resolve("ok"));
  await assert.rejects(memo("flaky-test", "x", flaky));
  assert.equal(await memo("flaky-test", "x", flaky), "ok");

  const stale = Date.now() + REVALIDATE_SECONDS * 1000 + 1;
  assert.equal(await memo("flaky-test", "x", () => Promise.resolve("fresh"), stale), "fresh");
});

test("the static team map has 30 franchises and the Nets are 1610612751 / BKN", () => {
  assert.equal(new Set(TEAMS.map((t) => t.team_id)).size, 30);
  assert.equal(new Set(TEAMS.map((t) => t.espn_id)).size, 30);
  assert.equal(NETS_TEAM_ID, 1610612751);
  assert.equal(teamById(NETS_TEAM_ID)?.tricode, "BKN");
  assert.deepEqual(teamsFromShots(shots, 2026).map((t) => [t.team_id, t.tricode, t.name]), [[NETS_TEAM_ID, "BKN", "Brooklyn Nets"]]);
});

test("the Nets are New Jersey (NJN) through 2011-12 and Brooklyn (BKN) from 2012-13", () => {
  assert.equal(FIRST_BROOKLYN_SEASON, 2013);
  assert.deepEqual([1998, 2003, 2012, 2013, 2026].map(netsTricode), ["NJN", "NJN", "NJN", "BKN", "BKN"]);
  assert.equal(teamName(NETS_TEAM_ID, 2003), "New Jersey Nets");
  assert.equal(teamName(NETS_TEAM_ID, 2012), "New Jersey Nets");
  assert.equal(teamName(NETS_TEAM_ID, 2013), "Brooklyn Nets");
  // The release spells the season's tricode; the name follows the season, not the tricode.
  const njn = shots.slice(0, 3).map((s) => ({ ...s, team_tricode: "NJN", game_id: "0020200001" }));
  assert.deepEqual(teamsFromShots(njn, 2003).map((t) => [t.team_id, t.tricode, t.name]), [[NETS_TEAM_ID, "NJN", "New Jersey Nets"]]);
  // Other renames in the listed range, and the one franchise per id.
  assert.equal(teamName(1610612760, 2008), "Seattle SuperSonics");
  assert.equal(teamName(1610612760, 2009), "Oklahoma City Thunder");
  assert.equal(teamName(1610612763, 2001), "Vancouver Grizzlies");
  assert.equal(teamName(1610612766, 2002), "Charlotte Hornets");
  assert.equal(teamName(1610612766, 2010), "Charlotte Bobcats");
  assert.equal(teamName(1610612766, 2015), "Charlotte Hornets");
  assert.equal(teamName(1610612740, 2007), "New Orleans/Oklahoma City Hornets");
  assert.equal(teamName(1610612740, 2013), "New Orleans Hornets");
  assert.equal(teamName(1610612740, 2014), "New Orleans Pelicans");
  assert.deepEqual(["NJN", "BKN", "SEA", "VAN", "CHH", "NOK", "NOH", "ZZZ"].map(franchiseOf), [NETS_TEAM_ID, NETS_TEAM_ID, 1610612760, 1610612763, 1610612766, 1610612740, 1610612740, undefined]);
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
    pts: null,
  });
  const [p] = withStats(playerIndex([shot(0, 0, 2, true)]), [row("base", 1), row("advanced", 900)]);
  assert.equal(p.player_name, "Test Player");
  assert.deepEqual(p.stats, {
    gp: 70,
    min: 30.5,
    fga: 900,
    fg_pct: 0.5,
    efg_pct: 0.55,
    ts_pct: 0.6,
    usg_pct: 0.25,
    pie: 0.12,
    pts_pg: null,
    fga_pg: null,
    min_total: 30.5, // the base totals row passed above
  });
  // Points and FGA per game come from the base per-game row, total minutes from base totals.
  const [withBase] = withStats(playerIndex([shot(0, 0, 2, true)]), [
    row("advanced", 900),
    { ...row("base", 12.5), per_mode: "pergame", pts: 18.2 },
    { ...row("base", 900), min: 2135 },
  ]);
  assert.deepEqual([withBase.stats?.pts_pg, withBase.stats?.fga_pg, withBase.stats?.min_total], [18.2, 12.5, 2135]);
  assert.equal(withStats(playerIndex([{ ...shot(0, 0, 2, true), person_id: 2 }]), [row("advanced", 900)])[0].stats, null);
});

test("a traded player's team row keeps season stats but says they cover all his teams", () => {
  // Mikal Bridges 2022-23 shape: 3 attempts for team 1 (Suns), 2 for team 2 (Nets); stats are season totals.
  const bridges = (team_id: number, made: boolean) => ({ ...shot(0, 0, 2, made), person_id: 7, team_id, team_tricode: team_id === 1 ? "PHX" : "BKN" });
  const stayer = { ...shot(0, 0, 2, true), person_id: 8, team_id: 2, team_tricode: "BKN" };
  const shots = [bridges(1, true), bridges(1, true), bridges(1, false), bridges(2, true), bridges(2, false), stayer];
  const row = (player_id: number, fga: number): PlayerStatsRow => ({
    player_id,
    player_name: `P${player_id}`,
    season_type: "regular-season",
    measure_type: "advanced",
    per_mode: "totals",
    gp: 80,
    min: 30,
    fga,
    fg_pct: 0.5,
    efg_pct: 0.5,
    ts_pct: 0.5,
    usg_pct: 0.2,
    pie: 0.1,
    pts: null,
  });
  const stats = [row(7, 5), row(8, 1)];

  const nets = seasonPlayers(shots, stats, 2);
  const b = nets.find((p) => p.person_id === 7);
  assert.ok(b);
  assert.deepEqual([b.attempts, b.stats?.fga, b.statsScope], [2, 5, "all-teams"]);
  assert.equal(nets.find((p) => p.person_id === 8)?.statsScope, "matching");

  const league = seasonPlayers(shots, stats);
  const all = league.find((p) => p.person_id === 7);
  assert.deepEqual([all?.attempts, all?.stats?.fga, all?.statsScope, all?.team_tricode], [5, 5, "matching", "PHX"]);
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
  // Two NBA players of the season share "Beta Two": no name match for either (the crosswalk still wins).
  const seasonNames = ["Alpha One", "Beta Two Jr.", "Beta Two", "Same Name", "No Photo"];
  assert.deepEqual([...bridgeHeadshots(players, athletes, [{ nba_player_id: "1", espn_athlete_id: "10" }], seasonNames)], [
    [1, "https://a.espncdn.com/10.png"],
  ]);
});
