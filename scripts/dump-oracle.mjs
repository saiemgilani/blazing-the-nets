// scripts/dump-oracle.mjs
// Writes lib/'s outputs on the committed real-row fixtures to JSON, for sdv-db's SQL parity
// tests. Run: node --experimental-strip-types scripts/dump-oracle.mjs <out-dir>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseParquet, readParquet } from "../lib/data/releases.ts";
import { GameLogRow, ShotRow } from "../lib/data/shots.ts";
import { PLAYER_STATS_TAG, PlayerStatsRow, seasonPlayers } from "../lib/data/players.ts";
import { HEX_RADIUS, leagueContext } from "../lib/dashboard.ts";
import { playerGames } from "../lib/data/aggregate.ts";
import { teamGames } from "../lib/data/games.ts";

const SEASON = 2026;
const out = process.argv[2];
if (!out) throw new Error("usage: dump-oracle.mjs <out-dir>");
mkdirSync(out, { recursive: true });

const bytes = (name) => new Uint8Array(readFileSync(new URL(`../test/fixtures/${name}`, import.meta.url))).buffer;
const shots = await parseParquet(bytes("shots_2026_bkn_2000.parquet"), ShotRow);
const logs = await parseParquet(bytes("game_logs_2026_bkn.parquet"), GameLogRow);
const people = new Set(shots.map((s) => s.person_id));
// Real release rows for the fixture's players only (regular season, all measure/per_mode combos).
const stats = (await readParquet(PLAYER_STATS_TAG, `player_season_stats_${SEASON}.parquet`, PlayerStatsRow)).filter(
  (r) => people.has(r.player_id) && r.season_type === "regular-season",
);

// d3-hexbin's centre -> bin indices (exact inverse of bin.x = (i + (j & 1) / 2) * dx, bin.y = j * dy).
const dx = HEX_RADIUS * 2 * Math.sin(Math.PI / 3);
const dy = HEX_RADIUS * 1.5;
const ij = (h) => {
  const j = Math.round(h.y / dy);
  const i = Math.round(h.x / dx - (j & 1) / 2);
  return { i, j, attempts: h.attempts, makes: Math.round((h.fgPct ?? 0) * h.attempts) };
};
const ctx = leagueContext(shots);
const leagueOut = {
  season: SEASON,
  radius: HEX_RADIUS,
  hexes: ctx.hexIndex.hexes.map(ij).sort((a, b) => a.j - b.j || a.i - b.i),
  zones: ctx.hexIndex.zones,
  byFoot: ctx.byFoot,
  byBin: ctx.byBin,
  sides: ctx.sides,
  fgPct: ctx.fgPct,
};
for (const h of ctx.hexIndex.hexes) {
  const { i, j } = ij(h);
  const x = (i + (j & 1) / 2) * dx;
  const y = j * dy;
  if (Math.abs(x - h.x) > 1e-9 || Math.abs(y - h.y) > 1e-9) throw new Error(`hex (i,j) inversion drifted at ${h.x},${h.y}`);
}

const games = teamGames(logs);
const byPlayer = new Map();
for (const s of shots) byPlayer.set(s.person_id, [...(byPlayer.get(s.person_id) ?? []), s]);
const playerGamesOut = Object.fromEntries([...byPlayer].map(([id, mine]) => [id, playerGames(mine, games)]));

const json = (name, value) => writeFileSync(join(out, name), JSON.stringify(value, (_, v) => (typeof v === "bigint" ? Number(v) : v)) + "\n");
json("shots.json", shots.map((s) => ({ ...s, season: SEASON })));
json("game_logs.json", logs.map((r) => ({ ...r, season: SEASON })));
json("player_season_stats.json", stats.map((r) => ({ ...r, season: SEASON })));
json("league_context.json", leagueOut);
json("season_players.json", seasonPlayers(shots, stats));
json("player_games.json", playerGamesOut);
writeFileSync(
  join(out, "README.md"),
  `# Blazing the Nets oracle (blazing-the-nets ${process.env.GIT_SHA ?? "working tree"})\n\n` +
    `Written by scripts/dump-oracle.mjs on ${new Date().toISOString().slice(0, 10)} from the committed real-row fixtures ` +
    `(test/fixtures/shots_2026_bkn_2000.parquet, game_logs_2026_bkn.parquet) and the live release ` +
    `nba_stats_player_season_stats/player_season_stats_2026.parquet filtered to the fixture's ${people.size} players. ` +
    `league_context.json hexes are d3-hexbin bin indices (i, j) with radius ${HEX_RADIUS}; everything else is lib/'s own shape.\n`,
);
console.log(`wrote ${out}: ${shots.length} shots, ${logs.length} logs, ${stats.length} stats rows, ${leagueOut.hexes.length} hexes`);
