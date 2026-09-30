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
  shot_distance: int64,
  x_legacy: int64,
  y_legacy: int64,
});

export type Shot = z.output<typeof ShotRow>;

export type SeasonType = "regular" | "playoffs" | "all";

/** stats.nba.com game_id prefixes: 002 regular season, 004 playoffs. */
const GAME_ID_PREFIX = { regular: "002", playoffs: "004" } as const;

export function filterSeasonType(shots: Shot[], seasonType: SeasonType): Shot[] {
  if (seasonType === "all") return shots;
  const prefix = GAME_ID_PREFIX[seasonType];
  return shots.filter((s) => s.game_id.startsWith(prefix));
}

export async function readShots(season: number, seasonType: SeasonType = "regular"): Promise<Shot[]> {
  return filterSeasonType(await readParquet(SHOTS_TAG, shotsAsset(season), ShotRow), seasonType);
}
