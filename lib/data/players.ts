import { z } from "zod";
import { int64, readParquet } from "./releases.ts";
import { addShot, type FieldGoals } from "./aggregate.ts";
import { readShots, type Shot } from "./shots.ts";

export const PLAYER_STATS_TAG = "nba_stats_player_season_stats";

/**
 * `nba_stats_player_season_stats/player_season_stats_<endYear>.parquet` stacks every
 * season_type x measure_type x per_mode combination (24 per season). The
 * `regular-season / advanced / totals` row carries gp, min, fga, fg_pct, efg_pct, ts_pct, usg_pct and
 * pie; in it `min` is minutes PER GAME and `fga` is the season total. Points, FGA per game and
 * total minutes come from the `base / pergame` and `base / totals` rows.
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
  pts: z.number().nullable(),
});

export type PlayerStatsRow = z.output<typeof PlayerStatsRow>;

export interface PlayerStats extends Pick<PlayerStatsRow, "gp" | "min" | "fga" | "fg_pct" | "efg_pct" | "ts_pct" | "usg_pct" | "pie"> {
  /** Points per game (base / pergame). */
  pts_pg: number | null;
  /** Field-goal attempts per game (base / pergame). */
  fga_pg: number | null;
  /** Total minutes (base / totals). */
  min_total: number | null;
}

export interface PlayerSeason extends FieldGoals {
  person_id: number;
  /** Full name from the season stats when available; the shots file only has the family name. */
  player_name: string;
  /** Team with the most attempts in the shots given (a traded player's primary team). */
  team_id: number;
  team_tricode: string;
  stats: PlayerStats | null;
  /**
   * "matching": `stats` cover the same games as attempts/makes. "all-teams": the player shot for
   * more than one team this season and the row is scoped to one team, so `stats` are his season
   * totals across teams (label them so) while attempts/makes are this team's only.
   */
  statsScope: "matching" | "all-teams";
}

/** One row per shooter, sorted by attempts (desc). Pass one team's shots for that team's roster. */
export function playerIndex(shots: Shot[]): PlayerSeason[] {
  const byPlayer = new Map<number, { name: string; fg: FieldGoals; teams: Map<number, [string, number]> }>();
  for (const s of shots) {
    let p = byPlayer.get(s.person_id);
    if (!p) byPlayer.set(s.person_id, (p = { name: s.player_name, fg: { attempts: 0, makes: 0, fg3a: 0, fg3m: 0 }, teams: new Map() }));
    addShot(p.fg, s);
    const t = p.teams.get(s.team_id);
    p.teams.set(s.team_id, [s.team_tricode, (t?.[1] ?? 0) + 1]);
  }
  return [...byPlayer]
    .map(([person_id, p]) => {
      const [team_id, [team_tricode]] = [...p.teams].reduce((a, b) => (b[1][1] > a[1][1] ? b : a));
      const row: PlayerSeason = { person_id, player_name: p.name, team_id, team_tricode, ...p.fg, stats: null, statsScope: "matching" };
      return row;
    })
    .sort((a, b) => b.attempts - a.attempts || a.person_id - b.person_id);
}

/**
 * Join the regular-season stats onto the index by stats.nba.com player id (both number): the
 * advanced totals row, plus points/FGA per game and total minutes from the base rows. Ids in
 * `allTeams` get statsScope "all-teams".
 */
export function withStats(players: PlayerSeason[], rows: PlayerStatsRow[], allTeams: ReadonlySet<number> = new Set()): PlayerSeason[] {
  const pick = (measure: string, mode: string) =>
    new Map(rows.filter((r) => r.season_type === "regular-season" && r.measure_type === measure && r.per_mode === mode).map((r) => [r.player_id, r]));
  const advanced = pick("advanced", "totals");
  const perGame = pick("base", "pergame");
  const totals = pick("base", "totals");
  return players.map((p) => {
    const r = advanced.get(p.person_id);
    if (!r) return p;
    const { gp, min, fga, fg_pct, efg_pct, ts_pct, usg_pct, pie } = r;
    const pg = perGame.get(p.person_id);
    const stats: PlayerStats = {
      gp,
      min,
      fga,
      fg_pct,
      efg_pct,
      ts_pct,
      usg_pct,
      pie,
      pts_pg: pg?.pts ?? null,
      fga_pg: pg?.fga ?? null,
      min_total: totals.get(p.person_id)?.min ?? null,
    };
    return { ...p, player_name: r.player_name, stats, statsScope: allTeams.has(p.person_id) ? "all-teams" : "matching" };
  });
}

/**
 * The season's shooters with stats, league-wide or for one team. For one team, a player who also
 * shot for another team keeps his season stats but is marked statsScope "all-teams".
 */
export function seasonPlayers(shots: Shot[], stats: PlayerStatsRow[], teamId?: number): PlayerSeason[] {
  if (teamId === undefined) return withStats(playerIndex(shots), stats);
  const teamsByPlayer = new Map<number, Set<number>>();
  for (const s of shots) {
    const teams = teamsByPlayer.get(s.person_id) ?? new Set<number>();
    teams.add(s.team_id);
    teamsByPlayer.set(s.person_id, teams);
  }
  const traded = new Set([...teamsByPlayer].filter(([, teams]) => teams.size > 1).map(([id]) => id));
  return withStats(playerIndex(shots.filter((s) => s.team_id === teamId)), stats, traded);
}

/** Regular-season shooters for a season (optionally one team), enriched with season stats. */
export async function readPlayers(season: number, teamId?: number): Promise<PlayerSeason[]> {
  const [shots, stats] = await Promise.all([
    readShots(season, "regular"),
    readParquet(PLAYER_STATS_TAG, `player_season_stats_${season}.parquet`, PlayerStatsRow, { optional: true }),
  ]);
  return seasonPlayers(shots, stats, teamId);
}
