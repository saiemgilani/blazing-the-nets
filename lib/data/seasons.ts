import { z } from "zod";
import { FIRST_SEASON, LAST_KNOWN_SEASON } from "../seasonRange.ts";
import { PLAYER_STATS_TAG } from "./players.ts";
import { int64, memo, readParquet, releaseUrl, REVALIDATE_SECONDS, timedFetch } from "./releases.ts";
import { SHOTS_TAG, shotsAsset } from "./shots.ts";
import { TEAMS } from "./teams.ts";

export { FIRST_DATA_SEASON, FIRST_SEASON, LAST_KNOWN_SEASON } from "../seasonRange.ts";

/** Seasons the site lists, ascending; the last one is the current season. */
export function siteSeasons(nextSeasonPublished: boolean): number[] {
  const last = LAST_KNOWN_SEASON + (nextSeasonPublished ? 1 : 0);
  return Array.from({ length: last - FIRST_SEASON + 1 }, (_, i) => FIRST_SEASON + i);
}

export type ShotGameRow = { game_id: string; team_id: number };

/**
 * The next season becomes current only once every page can render it: every team has a
 * regular-season (002) shot (on opening night only a few do, and the Nets' page, roster and players
 * would be empty or 404) and its season stats file exists. Before the producer's October rollover
 * completes, one of the two is usually missing.
 */
export function nextSeasonReady(rows: ShotGameRow[], statsFileExists: boolean): boolean {
  if (!statsFileExists) return false;
  const teams = new Set(rows.filter((r) => r.game_id.startsWith("002")).map((r) => r.team_id));
  return TEAMS.every((t) => teams.has(t.team_id));
}

const GameTeamRow = z.object({ game_id: z.string(), team_id: int64 });

/** The probe's two reads, injectable so the tests can check how their answers are wired together. */
export interface ProbeReads {
  /** The next season's shot rows (two columns, range-read); none when the file is not published. */
  shots: (season: number) => Promise<ShotGameRow[]>;
  /** HTTP status of a HEAD on the next season's stats file. */
  statsStatus: (season: number) => Promise<number>;
}

const releaseReads: ProbeReads = {
  shots: (season) => readParquet(SHOTS_TAG, shotsAsset(season), GameTeamRow, { optional: true }),
  statsStatus: async (season) => {
    const res = await timedFetch(releaseUrl(PLAYER_STATS_TAG, `player_season_stats_${season}.parquet`), {
      method: "HEAD",
      next: { revalidate: REVALIDATE_SECONDS },
    });
    return res.status;
  },
};

/** One probe per 6 h. A stats HEAD that is neither found nor a 404 throws (the answer is unknown). */
export async function probeNextSeason(reads: ProbeReads = releaseReads): Promise<boolean> {
  const next = LAST_KNOWN_SEASON + 1;
  const rows = await reads.shots(next);
  if (!nextSeasonReady(rows, true)) return false; // no stats request until the shots are ready
  const status = await reads.statsStatus(next);
  if (status !== 404 && (status < 200 || status > 299)) throw new Error(`season probe: HEAD ${status}`);
  return nextSeasonReady(rows, status !== 404);
}

/** The static list plus next season once it is ready; static list on any error. */
export async function listSeasons(): Promise<number[]> {
  try {
    return siteSeasons(await memo("seasons", "next", () => probeNextSeason()));
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
