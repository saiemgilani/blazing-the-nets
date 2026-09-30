/** The season range as plain constants: no imports, so the proxy can use it without the data layer. */

/** First season the site lists (2015-16). The data layer reads any year the release has. */
export const FIRST_SEASON = 2016;

/** `nba_stats_shots` holds shots_1997..shots_2026 (checked 2026-09-30). Bump when a season lands. */
export const FIRST_DATA_SEASON = 1997;
export const LAST_KNOWN_SEASON = 2026;

/** A season a URL may name: listed now, or the next one once it is published. */
export function isAddressableSeason(year: number): boolean {
  return Number.isInteger(year) && year >= FIRST_SEASON && year <= LAST_KNOWN_SEASON + 1;
}
