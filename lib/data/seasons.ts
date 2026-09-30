import { z } from "zod";
import { FIRST_SEASON, LAST_KNOWN_SEASON } from "../seasonRange.ts";
import { PLAYER_STATS_TAG } from "./players.ts";
import { memo, readParquet, releaseUrl, REVALIDATE_SECONDS, timedFetch } from "./releases.ts";
import { SHOTS_TAG, shotsAsset } from "./shots.ts";

export { FIRST_DATA_SEASON, FIRST_SEASON, LAST_KNOWN_SEASON } from "../seasonRange.ts";

/** Seasons the site lists, ascending; the last one is the current season. */
export function siteSeasons(nextSeasonPublished: boolean): number[] {
  const last = LAST_KNOWN_SEASON + (nextSeasonPublished ? 1 : 0);
  return Array.from({ length: last - FIRST_SEASON + 1 }, (_, i) => FIRST_SEASON + i);
}

/**
 * The next season becomes current only once every page can render it: its shots file holds
 * regular-season (002) rows, not just preseason, and its season stats file exists. Before the
 * producer's October rollover completes, one of the two is usually missing.
 */
export function nextSeasonReady(shotGameIds: string[], statsFileExists: boolean): boolean {
  return statsFileExists && shotGameIds.some((id) => id.startsWith("002"));
}

const GameIdRow = z.object({ game_id: z.string() });

/** One probe per 6 h: the next season's shot game ids (one column, range-read) and a HEAD on its stats file. */
async function probeNextSeason(): Promise<boolean> {
  const next = LAST_KNOWN_SEASON + 1;
  const ids = await readParquet(SHOTS_TAG, shotsAsset(next), GameIdRow, { optional: true });
  if (!ids.some((r) => r.game_id.startsWith("002"))) return false;
  const stats = await timedFetch(releaseUrl(PLAYER_STATS_TAG, `player_season_stats_${next}.parquet`), {
    method: "HEAD",
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (stats.status !== 404 && !stats.ok) throw new Error(`season probe: HEAD ${stats.status}`);
  return nextSeasonReady(
    ids.map((r) => r.game_id),
    stats.ok,
  );
}

/** The static list plus next season once it is ready; static list on any error. */
export async function listSeasons(): Promise<number[]> {
  try {
    return siteSeasons(await memo("seasons", "next", probeNextSeason));
  } catch {
    return siteSeasons(false);
  }
}

/** 2026 -> "2025-26" (assets are keyed by the season's ending year). */
export function seasonLabel(endYear: number): string {
  return `${endYear - 1}-${String(endYear % 100).padStart(2, "0")}`;
}

/** A `?season=` value (or path segment): a listed season, else the current (last) one. */
export function parseSeason(param: string | string[] | undefined, seasons: number[]): number {
  const raw = Array.isArray(param) ? param[0] : param;
  const year = raw !== undefined && /^\d{4}$/.test(raw) ? Number(raw) : NaN;
  return seasons.includes(year) ? year : seasons[seasons.length - 1];
}
