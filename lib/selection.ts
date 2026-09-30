import type { PlayerGame } from "./data/aggregate.ts";
import type { ShotLite } from "./data/shots.ts";

/** The player page's game filters: preset selections, a date window, and the shots they keep. */

export const GAME_PRESETS = ["all", "none", "home", "away", "wins", "losses"] as const;
export type GamePreset = (typeof GAME_PRESETS)[number];

export const PRESET_LABELS: Record<GamePreset, string> = {
  all: "All",
  none: "None",
  home: "Home",
  away: "Away",
  wins: "Wins",
  losses: "Losses",
};

/** Game ids a preset selects. Home and Away leave out neutral-site games; the page says how many there are. */
export function presetGames(games: Pick<PlayerGame, "game_id" | "venue" | "win">[], preset: GamePreset): string[] {
  const keep: Record<GamePreset, (g: Pick<PlayerGame, "venue" | "win">) => boolean> = {
    all: () => true,
    none: () => false,
    home: (g) => g.venue === "home",
    away: (g) => g.venue === "away",
    wins: (g) => g.win === true,
    losses: (g) => g.win === false,
  };
  return games.filter(keep[preset]).map((g) => g.game_id);
}

/** An inclusive [first, last] "YYYY-MM-DD" window, or null for the whole season. */
export type DateWindow = [string, string] | null;

/**
 * The window two date fields describe (the keyboard route to the brush): an empty field is that end
 * of the season, reversed dates are swapped, and a window covering the whole season is no window.
 */
export function windowFromInputs(from: string, to: string, first: string, last: string): DateWindow {
  const valid = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  const a = valid(from) ? from : first;
  const b = valid(to) ? to : last;
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return lo <= first && hi >= last ? null : [lo, hi];
}

export function inWindow(date: string, window: DateWindow): boolean {
  return window === null || (date >= window[0] && date <= window[1]);
}

/** Games that are selected and inside the window, in their given (date) order. */
export function visibleGames<G extends Pick<PlayerGame, "game_id" | "date">>(games: G[], selected: ReadonlySet<string>, window: DateWindow): G[] {
  return games.filter((g) => selected.has(g.game_id) && inWindow(g.date, window));
}

export function shotsForGames(shots: ShotLite[], gameIds: ReadonlySet<string>): ShotLite[] {
  return shots.filter((s) => gameIds.has(s.game_id));
}
