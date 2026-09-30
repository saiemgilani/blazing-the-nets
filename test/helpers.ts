import { readFileSync } from "node:fs";
import { parseParquet } from "../lib/data/releases.ts";
import { GameLogRow, ShotRow, type Shot } from "../lib/data/shots.ts";

/**
 * First 2 000 Nets rows, in file order, of the real `nba_stats_shots/shots_2026.parquet`
 * (downloaded 2026-09-30; games 0022500031..0022500373). Written with polars 1.42,
 * `df.filter(pl.col("team_tricode") == "BKN").head(2000).write_parquet(..., compression="zstd")`,
 * so it keeps the release's schema and codec and exercises the same decode path.
 */
export async function fixtureShots(): Promise<Shot[]> {
  const bytes = new Uint8Array(readFileSync(new URL("./fixtures/shots_2026_bkn_2000.parquet", import.meta.url)));
  return parseParquet(bytes.buffer, ShotRow);
}

/**
 * Both teams' rows for the fixture's 24 games (48), cut from the real
 * `nba_stats_player_game_logs/player_game_logs_2026.parquet` (2026-09-30, polars 1.42, zstd):
 * game_id, team_id, team_abbreviation, game_date, matchup, wl.
 */
export async function fixtureGameLogs(): Promise<GameLogRow[]> {
  const bytes = new Uint8Array(readFileSync(new URL("./fixtures/game_logs_2026_bkn.parquet", import.meta.url)));
  return parseParquet(bytes.buffer, GameLogRow);
}

/**
 * A hand-placed shot for geometry cases. Distance is ROUNDED feet like the release
 * (round(hypot/10) matches 93-96% of release rows), so 1-ft bins are centred on their distance.
 */
export function shot(x: number, y: number, value: 2 | 3, made: boolean, game_id = "0022500001"): Shot {
  return {
    game_id,
    period: 1,
    clock: "PT12M00.00S",
    team_id: 1610612751,
    team_tricode: "BKN",
    person_id: 1,
    player_name: "Test",
    sub_type: "Jump Shot",
    shot_result: made ? "Made" : "Missed",
    shot_value: value,
    shot_distance: Math.round(Math.hypot(x, y) / 10),
    x_legacy: x,
    y_legacy: y,
  };
}
