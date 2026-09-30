import { listAssets } from "./releases.ts";
import { SHOTS_TAG } from "./shots.ts";

/** First season the site lists (2015-16). The data layer reads any year the release has (1997+). */
export const FIRST_SEASON = 2016;

/** End years with a `shots_<year>.parquet` asset, from `first` up, ascending. */
export function seasonsFromAssets(assetNames: string[], first = FIRST_SEASON): number[] {
  const years = assetNames
    .map((name) => /^shots_(\d{4})\.parquet$/.exec(name)?.[1])
    .filter((y): y is string => y !== undefined)
    .map(Number)
    .filter((y) => y >= first);
  return [...new Set(years)].sort((a, b) => a - b);
}

/** Seasons the site offers; the last one is the current season. */
export async function listSeasons(): Promise<number[]> {
  return seasonsFromAssets(await listAssets(SHOTS_TAG));
}

/** 2026 -> "2025-26" (assets are keyed by the season's ending year). */
export function seasonLabel(endYear: number): string {
  return `${endYear - 1}-${String(endYear % 100).padStart(2, "0")}`;
}
