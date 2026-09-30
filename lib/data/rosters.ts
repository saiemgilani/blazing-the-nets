import { z } from "zod";
import { readParquet } from "./releases.ts";

export const ROSTERS_TAG = "espn_nba_rosters";
export const PLAYER_CORE_TAG = "espn_nba_player_core";
export const CROSSWALK_TAG = "nba_crosswalk";

/**
 * ESPN athlete rows carrying a headshot. `espn_nba_player_core/player_core_<year>` (2002+) and
 * `espn_nba_rosters/rosters_<year>` (2025+) share these columns; athlete_id is INT64 in the
 * first and a string in the second, so it is normalised to a string here.
 */
export const EspnAthleteRow = z.object({
  athlete_id: z.union([z.string(), z.bigint()]).transform(String),
  full_name: z.string(),
  headshot_href: z.string().nullable(),
});

export type EspnAthleteRow = z.output<typeof EspnAthleteRow>;

/** `nba_crosswalk/nba_player_crosswalk_<year>` (2026+): stats.nba.com id -> ESPN id, both strings. */
export const CrosswalkRow = z.object({
  nba_player_id: z.string().nullable(),
  espn_athlete_id: z.string().nullable(),
});

export type CrosswalkRow = z.output<typeof CrosswalkRow>;

/** Fold case, accents, punctuation and generational suffixes so "Nicolás Jr." meets "nicolas". */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/-/g, " ")
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * stats.nba.com person_id -> ESPN headshot URL. ESPN and stats.nba.com ids are different
 * namespaces: bridge by the crosswalk first, then by normalised full name when that name is
 * unique in the ESPN rows. Players matched by neither get no entry.
 */
export function bridgeHeadshots(
  players: { person_id: number; player_name: string }[],
  athletes: EspnAthleteRow[],
  crosswalk: CrosswalkRow[],
): Map<number, string> {
  const href = new Map<string, string>();
  const byName = new Map<string, string | null>();
  for (const a of athletes) {
    if (a.headshot_href) href.set(a.athlete_id, a.headshot_href);
    const key = normalizeName(a.full_name);
    byName.set(key, byName.has(key) && byName.get(key) !== a.athlete_id ? null : a.athlete_id);
  }
  const viaCrosswalk = new Map<string, string>();
  for (const c of crosswalk) if (c.nba_player_id && c.espn_athlete_id) viaCrosswalk.set(c.nba_player_id, c.espn_athlete_id);

  const out = new Map<number, string>();
  for (const p of players) {
    // person_id is an integer, so String() is exact (no "123.0").
    const athleteId = viaCrosswalk.get(String(p.person_id)) ?? byName.get(normalizeName(p.player_name));
    const url = athleteId ? href.get(athleteId) : undefined;
    if (url) out.set(p.person_id, url);
  }
  return out;
}

/**
 * Headshots for a season's players. player_core is per season (2002+) and lists everyone who
 * appeared, so it also covers traded and waived players (2026: 561/582 shooters vs 517/582 from
 * rosters); rosters is a current-state snapshot, kept as the fallback for a season player_core
 * does not have yet.
 */
export async function readHeadshots(
  season: number,
  players: { person_id: number; player_name: string }[],
): Promise<Map<number, string>> {
  const optional = { optional: true };
  const [core, xw] = await Promise.all([
    readParquet(PLAYER_CORE_TAG, `player_core_${season}.parquet`, EspnAthleteRow, optional),
    readParquet(CROSSWALK_TAG, `nba_player_crosswalk_${season}.parquet`, CrosswalkRow, optional),
  ]);
  const athletes = core.length > 0 ? core : await readParquet(ROSTERS_TAG, `rosters_${season}.parquet`, EspnAthleteRow, optional);
  return bridgeHeadshots(players, athletes, xw);
}
