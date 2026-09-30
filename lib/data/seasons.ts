import { memo, releaseUrl, REVALIDATE_SECONDS } from "./releases.ts";
import { SHOTS_TAG, shotsAsset } from "./shots.ts";

/** First season the site lists (2015-16). The data layer reads any year the release has. */
export const FIRST_SEASON = 2016;

/** `nba_stats_shots` holds shots_1997..shots_2026 (checked 2026-09-30). Bump when a season lands. */
export const FIRST_DATA_SEASON = 1997;
export const LAST_KNOWN_SEASON = 2026;

/** Seasons the site lists, ascending; the last one is the current season. */
export function siteSeasons(nextSeasonPublished: boolean): number[] {
  const last = LAST_KNOWN_SEASON + (nextSeasonPublished ? 1 : 0);
  return Array.from({ length: last - FIRST_SEASON + 1 }, (_, i) => FIRST_SEASON + i);
}

/** HEAD the next season's shots asset: 200 -> published, 404 -> not yet, anything else throws. */
async function nextSeasonPublished(): Promise<boolean> {
  const res = await fetch(releaseUrl(SHOTS_TAG, shotsAsset(LAST_KNOWN_SEASON + 1)), {
    method: "HEAD",
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`season probe: HEAD ${res.status}`);
  return true;
}

/** The static list plus next season if its shots file exists; one probe per 6 h, static list on any error. */
export async function listSeasons(): Promise<number[]> {
  try {
    return siteSeasons(await memo("seasons", "next", nextSeasonPublished));
  } catch {
    return siteSeasons(false);
  }
}

/** 2026 -> "2025-26" (assets are keyed by the season's ending year). */
export function seasonLabel(endYear: number): string {
  return `${endYear - 1}-${String(endYear % 100).padStart(2, "0")}`;
}
