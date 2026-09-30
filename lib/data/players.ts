import { z } from "zod";
import { int64, readParquet } from "./releases.ts";
import { readShots, type Shot } from "./shots.ts";

export const PLAYER_STATS_TAG = "nba_stats_player_season_stats";

/**
 * `nba_stats_player_season_stats/player_season_stats_<endYear>.parquet` stacks every
 * season_type x measure_type x per_mode combination (24 per season). The
 * `regular-season / advanced / totals` row carries all eight numbers below; in it `min` is
 * minutes PER GAME and `fga` is the season total.
 */
export const PlayerStatsRow = z.object({
  player_id: int64,
  player_name: z.string(),
  season_type: z.string(),
  measure_type: z.string(),
  per_mode: z.string(),
  gp: int64,
  min: z.number().nullable(),
  fga: z.number().nullable(),
  fg_pct: z.number().nullable(),
  efg_pct: z.number().nullable(),
  ts_pct: z.number().nullable(),
  usg_pct: z.number().nullable(),
  pie: z.number().nullable(),
});

export type PlayerStatsRow = z.output<typeof PlayerStatsRow>;

export type PlayerStats = Pick<PlayerStatsRow, "gp" | "min" | "fga" | "fg_pct" | "efg_pct" | "ts_pct" | "usg_pct" | "pie">;

export interface PlayerSeason {
  person_id: number;
  /** Full name from the season stats when available; the shots file only has the family name. */
  player_name: string;
  /** Team with the most attempts in the shots given (a traded player's primary team). */
  team_id: number;
  team_tricode: string;
  attempts: number;
  makes: number;
  stats: PlayerStats | null;
}

/** One row per shooter, sorted by attempts (desc). Pass one team's shots for that team's roster. */
export function playerIndex(shots: Shot[]): PlayerSeason[] {
  const byPlayer = new Map<number, { name: string; attempts: number; makes: number; teams: Map<number, [string, number]> }>();
  for (const s of shots) {
    let p = byPlayer.get(s.person_id);
    if (!p) byPlayer.set(s.person_id, (p = { name: s.player_name, attempts: 0, makes: 0, teams: new Map() }));
    p.attempts += 1;
    if (s.shot_result === "Made") p.makes += 1;
    const t = p.teams.get(s.team_id);
    p.teams.set(s.team_id, [s.team_tricode, (t?.[1] ?? 0) + 1]);
  }
  return [...byPlayer]
    .map(([person_id, p]) => {
      const [team_id, [team_tricode]] = [...p.teams].reduce((a, b) => (b[1][1] > a[1][1] ? b : a));
      return { person_id, player_name: p.name, team_id, team_tricode, attempts: p.attempts, makes: p.makes, stats: null };
    })
    .sort((a, b) => b.attempts - a.attempts || a.person_id - b.person_id);
}

/** Join regular-season advanced totals onto the index by stats.nba.com player id (both number). */
export function withStats(players: PlayerSeason[], rows: PlayerStatsRow[]): PlayerSeason[] {
  const byId = new Map(
    rows
      .filter((r) => r.season_type === "regular-season" && r.measure_type === "advanced" && r.per_mode === "totals")
      .map((r) => [r.player_id, r]),
  );
  return players.map((p) => {
    const r = byId.get(p.person_id);
    if (!r) return p;
    const { gp, min, fga, fg_pct, efg_pct, ts_pct, usg_pct, pie } = r;
    return { ...p, player_name: r.player_name, stats: { gp, min, fga, fg_pct, efg_pct, ts_pct, usg_pct, pie } };
  });
}

/** Regular-season shooters for a season (optionally one team), enriched with season stats. */
export async function readPlayers(season: number, teamId?: number): Promise<PlayerSeason[]> {
  const [shots, stats] = await Promise.all([
    readShots(season, "regular"),
    readParquet(PLAYER_STATS_TAG, `player_season_stats_${season}.parquet`, PlayerStatsRow),
  ]);
  const scoped = teamId === undefined ? shots : shots.filter((s) => s.team_id === teamId);
  return withStats(playerIndex(scoped), stats);
}
