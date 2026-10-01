import assert from "node:assert/strict";
import { test } from "node:test";
import { parquetMetadataAsync } from "hyparquet";
import { fgPctByDistance, hexbinShots, lineOf, onCourt, playerGames, statsByZone, versusOpponents } from "../lib/data/aggregate.ts";
import { THREE_BREAK_Y } from "../lib/data/court.ts";
import { teamGames } from "../lib/data/games.ts";
import { readPlayers } from "../lib/data/players.ts";
import { int64, openAsset, parseParquet } from "../lib/data/releases.ts";
import { readHeadshots } from "../lib/data/rosters.ts";
import { FIRST_SEASON, listSeasons } from "../lib/data/seasons.ts";
import { ShotRow, filterSeasonType, gameDateMap, readGameLogs, shotsAsset, SHOTS_TAG } from "../lib/data/shots.ts";
import { NETS_TEAM_ID, readTeams } from "../lib/data/teams.ts";

const skip = process.env.BN_NETWORK_TESTS === "1" ? false : "set BN_NETWORK_TESTS=1 to read the real release files";

test("real release files: shots 2026 -> Nets -> one player", { skip }, async (t) => {
  const seasons = await listSeasons();
  t.diagnostic(`seasons ${seasons.join(",")}`);
  assert.equal(seasons[0], FIRST_SEASON);
  assert.ok((seasons.at(-1) ?? 0) >= 2026);

  // Count what the range reads actually transfer.
  const realFetch = globalThis.fetch;
  let requests = 0;
  let transferred = 0;
  globalThis.fetch = async (input, init) => {
    const res = await realFetch(input, init);
    requests += 1;
    if (init?.method !== "HEAD") transferred += Number(res.headers.get("content-length") ?? 0);
    return res;
  };
  const t0 = performance.now();
  const { size, all } = await (async () => {
    const file = await openAsset(SHOTS_TAG, shotsAsset(2026));
    return { size: file.byteLength, all: await parseParquet(file, ShotRow) };
  })().finally(() => {
    globalThis.fetch = realFetch;
  });
  t.diagnostic(
    `shots_2026.parquet ${size} bytes on the release; ${requests} requests transferred ${transferred} bytes; ` +
      `range read + decode + validate ${(performance.now() - t0).toFixed(0)} ms, ${all.length} rows`,
  );
  assert.ok(all.length > 200_000);
  assert.ok(transferred < size, "column projection should read less than the whole file");

  const league = filterSeasonType(all, "regular");
  const nets = league.filter((s) => s.team_id === NETS_TEAM_ID);
  assert.ok(nets.length > 5000);
  assert.ok(nets.every((s) => s.team_tricode === "BKN"));

  // Shots-derived totals must agree with the published season stats: this catches filter, dedup
  // and scope bugs. Exact in 2016/2020/2022; at most one attempt off in 2024/2026.
  const leaguePlayers = await readPlayers(2026);
  let off = 0;
  for (const p of leaguePlayers) {
    const st = p.stats;
    assert.ok(st && st.fga !== null && st.fg_pct !== null, `no stats for ${p.player_name}`);
    const gap = Math.abs(p.attempts - st.fga);
    assert.ok(gap <= 1, `${p.player_name}: ${p.attempts} attempts vs fga ${st.fga}`);
    off += gap;
    // fg_pct is published to 3 decimals; one extra attempt moves FG% by up to 1/fga.
    const tolerance = gap === 0 ? 0.002 : 1 / st.fga + 0.0005;
    assert.ok(Math.abs(p.makes / p.attempts - st.fg_pct) <= tolerance, `${p.player_name}: ${p.makes}/${p.attempts} vs ${st.fg_pct}`);
    // eFG% from shots against the release's efg_pct (the regular-season advanced row).
    const efg = lineOf(p).efgPct;
    if (st.efg_pct !== null && efg !== null) {
      assert.ok(Math.abs(efg - st.efg_pct) <= tolerance, `${p.player_name}: eFG ${efg} vs ${st.efg_pct}`);
    }
  }
  t.diagnostic(`season-stats parity: ${leaguePlayers.length} players, ${off} attempt(s) off in total`);

  const logs = await readGameLogs(2026);
  const neutral = [...teamGames(logs).values()].filter((g) => g.venue === "neutral");
  assert.deepEqual([...new Set(neutral.map((g) => g.game_id))].sort(), ["0022500147", "0022500578", "0022500602", "0022501229", "0022501230"], "the five 2025-26 neutral-site games");
  const dates = gameDateMap(logs);
  // The shots file also carries play-in and NBA Cup final games (7 in 2025-26) that the regular-season
  // game logs do not; pages read regular-season shots only, so that is the set that must have dates.
  const regular = all.filter((s) => s.game_id.startsWith("002"));
  assert.ok(new Set(regular.map((s) => s.game_id)).size <= dates.size);
  assert.ok(regular.every((s) => dates.has(s.game_id)), "every regular-season shot game has a date");

  const teams = await readTeams(2026);
  assert.equal(teams.length, 30);
  assert.equal(teams.find((tm) => tm.team_id === NETS_TEAM_ID)?.tricode, "BKN");

  const roster = await readPlayers(2026, NETS_TEAM_ID);
  const headshots = await readHeadshots(2026, roster);
  for (const p of roster) {
    const s = p.stats;
    t.diagnostic(
      `${p.player_name} (${p.person_id}) FGA ${p.attempts} FG% ${(p.makes / p.attempts).toFixed(3)}` +
        (s ? ` gp ${s.gp} min ${s.min} ts ${s.ts_pct} usg ${s.usg_pct}` : " no stats") +
        (headshots.has(p.person_id) ? " headshot" : " NO headshot"),
    );
  }
  assert.equal(roster.reduce((a, p) => a + p.attempts, 0), nets.length);
  assert.ok(roster.filter((p) => p.stats).length >= roster.length - 1);
  assert.ok(headshots.size >= roster.length * 0.8);

  const top = roster[0];
  const mine = nets.filter((s) => s.person_id === top.person_id);
  const fg = top.makes / top.attempts;
  assert.ok(fg > 0.3 && fg < 0.7, `FG% ${fg}`);
  const hexes = hexbinShots(mine, 15);
  assert.ok(hexes.length > 20);
  const byDistance = fgPctByDistance(mine);
  assert.ok(byDistance[0].attempts > 0);
  const zones = statsByZone(mine);
  const corner = mine.filter((s) => s.shot_value === 3 && s.y_legacy <= 89).map((s) => Math.abs(s.x_legacy)).sort((a, b) => a - b);
  const median = corner[Math.floor(corner.length / 2)];
  t.diagnostic(
    `${top.player_name}: ${mine.length} FGA, FG% ${fg.toFixed(3)}, ${hexes.length} hexes, corner-3 |x| median ${median} (n=${corner.length}), ` +
      `zones ${Object.entries(zones).map(([z, v]) => `${z} ${v.makes}/${v.attempts}`).join(", ")}`,
  );
  assert.ok(median >= 215 && median <= 245, `corner |x| median ${median}`);
  const games = playerGames(mine, teamGames(logs));
  assert.equal(games.length, top.stats?.gp);
  assert.deepEqual(games.map((g) => g.date), games.map((g) => g.date).sort());
  const versus = versusOpponents(games);
  t.diagnostic(`${top.player_name}: ${games.length} games, ${games.filter((g) => g.venue === "home").length} home, ${games.filter((g) => g.venue === "neutral").length} neutral, ${games.filter((g) => g.win).length} wins, ${versus.length} opponents, most ${versus[0].opponent} ${versus[0].attempts} FGA`);
  assert.equal(versus.reduce((a, r) => a + r.attempts, 0), mine.length);
});

test("real release files: the oldest listed season has the columns, dtypes and frame the site reads", { skip }, async (t) => {
  const season = FIRST_SEASON;
  const file = await openAsset(SHOTS_TAG, shotsAsset(season));
  const metadata = await parquetMetadataAsync(file, { initialFetchSize: 1 << 16 });
  const types = new Map(metadata.schema.slice(1).map((c) => [c.name, c.type]));
  for (const [name, schema] of Object.entries(ShotRow.shape)) {
    assert.equal(types.get(name), schema === int64 ? "INT64" : "BYTE_ARRAY", `${name} in shots_${season}`);
  }
  const shots = filterSeasonType(await parseParquet(file, ShotRow), "regular");
  const n = shots.length;
  const share = (f: (s: (typeof shots)[number]) => boolean) => shots.filter(f).length / n;

  // Every shot has a team; 29 franchises before the 2004-05 expansion; the Nets are New Jersey.
  const teams = new Map(shots.map((s) => [s.team_id, s.team_tricode]));
  assert.equal(teams.size, season < 2005 ? 29 : 30);
  assert.ok([...teams.keys()].every((id) => id >= 1610612737 && id <= 1610612766), "a shot with no team");
  assert.equal(teams.get(NETS_TEAM_ID), "NJN");

  // The legacy frame: tenths of a foot, hoop at the origin, nothing behind the baseline (-52.5).
  assert.ok(share(onCourt) > 0.999, "on court");
  assert.equal(share((s) => s.y_legacy < -52.5), 0);
  const ys = shots.map((s) => s.y_legacy).sort((a, b) => a - b);
  const p99 = ys[Math.floor(0.99 * (n - 1))];
  assert.ok(p99 > 230 && p99 < 280, `y p99 ${p99}`);
  const rim = share((s) => Math.hypot(s.x_legacy, s.y_legacy) <= 40);
  assert.ok(rim > 0.25 && rim < 0.4, `restricted-area share ${rim}`);
  const threes = shots.filter((s) => s.shot_value === 3);
  const corner = threes.filter((s) => Math.abs(s.x_legacy) >= 220 && s.y_legacy <= THREE_BREAK_Y).length / threes.length;
  assert.ok(corner > 0.1 && corner < 0.4, `corner share of threes ${corner}`);
  const agree = share((s) => Math.abs(s.shot_distance - Math.hypot(s.x_legacy, s.y_legacy) / 10) <= 1);
  assert.ok(agree > 0.95, `shot_distance agrees with x/y for ${agree}`);
  // Layups, dunks and tips are parked at the hoop centre before 2010-11 (a README caveat); a jump
  // or hook shot there has no location, and must stay rare.
  const atRim = /Layup|Dunk|Tip|Finger Roll|Putback|Alley Oop/i;
  const lost = share((s) => s.x_legacy === 0 && s.y_legacy === 0 && !atRim.test(s.sub_type));
  assert.ok(lost < 0.005, `non-rim shots without a location ${lost}`);

  // Attempts equal the published FGA for every shooter.
  const players = await readPlayers(season);
  assert.ok(players.every((p) => p.stats?.fga === p.attempts), "shots vs FGA");
  t.diagnostic(`shots_${season}: ${n} regular-season shots, ${teams.size} teams, rim ${rim.toFixed(3)}, corner ${corner.toFixed(3)}, distance agrees ${agree.toFixed(3)}, no location ${lost.toFixed(4)}`);
});
