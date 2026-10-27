import { z } from "zod";
import { int64, readParquet } from "./releases.ts";

export const SHOTS_TAG = "nba_stats_shots";

export const shotsAsset = (season: number) => `shots_${season}.parquet`;

/**
 * One field-goal attempt from `nba_stats_shots/shots_<endYear>.parquet` (stats.nba.com pbp v3).
 * `x_legacy`/`y_legacy` are raw: tenths of a foot, hoop at the origin, y growing toward half
 * court. Only `court.ts` turns them into pixels.
 * ponytail: `season`, `action_type` (duplicates shot_result), `description`, `score_home` and
 * `score_away` are not read; add them to the schema when a view needs them.
 */
export const ShotRow = z.object({
  game_id: z.string(),
  period: int64,
  clock: z.string(),
  team_id: int64,
  team_tricode: z.string(),
  person_id: int64,
  player_name: z.string(),
  sub_type: z.string(),
  shot_result: z.enum(["Made", "Missed"]),
  shot_value: int64,
  // Null on a few rows of some past seasons : 159 rows across 1997-98 to 2008-09 (2026-10-27), all with x/y; withDistance fills it.
  shot_distance: int64.nullable(),
  x_legacy: int64,
  y_legacy: int64,
});

export type ShotFileRow = z.output<typeof ShotRow>;
export type Shot = Omit<ShotFileRow, "shot_distance"> & { shot_distance: number };

/**
 * Fill a missing shot_distance from the coordinates the way the release rounds it,
 * round(hypot(x, y) / 10) feet, so every attempt still counts toward FGA. On the 2025-26 fixture
 * that reproduces every release distance except the 0 the release gives some corner threes.
 * In place: these are fresh rows from parseParquet.
 */
export function withDistance(rows: ShotFileRow[]): Shot[] {
  for (const r of rows) if (r.shot_distance === null) r.shot_distance = Math.round(Math.hypot(r.x_legacy, r.y_legacy) / 10);
  return rows as Shot[];
}

/**
 * The fields the aggregations read; what the player page ships to the browser for re-filtering.
 * No team_id: the browser gets his games already placed (playerGames runs on the server).
 */
export type ShotLite = Pick<Shot, "game_id" | "x_legacy" | "y_legacy" | "shot_distance" | "shot_value" | "shot_result">;

export function toLite(s: Shot): ShotLite {
  const { game_id, x_legacy, y_legacy, shot_distance, shot_value, shot_result } = s;
  return { game_id, x_legacy, y_legacy, shot_distance, shot_value, shot_result };
}

export type SeasonType = "regular" | "playoffs" | "all";

/** stats.nba.com game_id prefixes: 002 regular season, 004 playoffs. */
const GAME_ID_PREFIX = { regular: "002", playoffs: "004" } as const;

export function filterSeasonType(shots: Shot[], seasonType: SeasonType): Shot[] {
  if (seasonType === "all") return shots;
  const prefix = GAME_ID_PREFIX[seasonType];
  return shots.filter((s) => s.game_id.startsWith(prefix));
}

export async function readShots(season: number, seasonType: SeasonType = "regular"): Promise<Shot[]> {
  return filterSeasonType(withDistance(await readParquet(SHOTS_TAG, shotsAsset(season), ShotRow)), seasonType);
}

export const GAME_LOGS_TAG = "nba_stats_player_game_logs";

/**
 * `nba_stats_player_game_logs/player_game_logs_<endYear>.parquet` is one row per TEAM per game
 * (two rows per game_id). `matchup` is "BKN vs. MIA" for the home side and "BKN @ MIA" for the
 * away side (neutral-site games list both sides with "@"); `wl` is "W" or "L". game_id order is
 * NOT date order (NBA Cup group games carry low ids but are played in November), so anything
 * per-game sorts by `game_date`.
 */
export const GameLogRow = z.object({
  game_id: z.string(),
  team_id: int64,
  team_abbreviation: z.string(),
  game_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  matchup: z.string(),
  wl: z.enum(["W", "L"]).nullable(),
});

export type GameLogRow = z.output<typeof GameLogRow>;

export function readGameLogs(season: number): Promise<GameLogRow[]> {
  return readParquet(GAME_LOGS_TAG, `player_game_logs_${season}.parquet`, GameLogRow);
}

/** game_id -> "YYYY-MM-DD". */
export function gameDateMap(rows: Pick<GameLogRow, "game_id" | "game_date">[]): Map<string, string> {
  return new Map(rows.map((r) => [r.game_id, r.game_date]));
}

/** game_id -> "YYYY-MM-DD" for every game of the season (regular season and playoffs). */
export async function readGameDates(season: number): Promise<Map<string, string>> {
  return gameDateMap(await readGameLogs(season));
}
