import type { PlayerGame } from "./data/aggregate.ts";
import { GAME_PRESETS, presetGames, withTypedDate, type DateWindow } from "./selection.ts";

/**
 * Every chart option as a query param, so a view is a link and a reload reproduces it. Each param
 * has a default that is left out of the URL; anything unknown or malformed reads as the default.
 *
 *   hex=zones|compare          shot chart view (default raw)
 *   compare=player:<id> | season:<yyyy> | split:home-away
 *   games=<preset> | <id>-<id>-…  player game selection (default all)
 *   from=YYYY-MM-DD&to=…       date window (default the whole season)
 *   roll=5|20                  rolling window (default 10)
 *   x=<metric>&y=<metric>&faces=1   scatter
 *   last=5|20&board=<metric>   leaders
 */

/** `value` if it is one of `options`, else `fallback`. */
export function oneOf<T extends string | number>(options: readonly T[], value: string | null, fallback: T): T {
  return options.find((o) => String(o) === value) ?? fallback;
}

/** `value`, or null (leave the param out) when it is the default. */
export const unlessDefault = <T extends string | number>(value: T, fallback: T): string | null => (value === fallback ? null : String(value));

export const HEX_MODES = ["raw", "zones", "compare"] as const;
export type HexMode = (typeof HEX_MODES)[number];

export type Compare = { kind: "player"; id: number } | { kind: "season"; season: number } | { kind: "split" };

export function parseCompare(value: string | null): Compare | null {
  const m = /^(player|season|split):(.+)$/.exec(value ?? "");
  if (!m) return null;
  if (m[1] === "split") return m[2] === "home-away" ? { kind: "split" } : null;
  if (!/^\d{1,10}$/.test(m[2])) return null;
  const n = Number(m[2]);
  if (m[1] === "player") return { kind: "player", id: n };
  return m[2].length === 4 ? { kind: "season", season: n } : null;
}

export function compareParam(c: Compare): string {
  return c.kind === "player" ? `player:${c.id}` : c.kind === "season" ? `season:${c.season}` : "split:home-away";
}

type Games = Pick<PlayerGame, "game_id" | "venue" | "win">[];

/** The selection as a param: a preset's name when it matches one (null for all), else the ids. */
export function gamesParam(selected: ReadonlySet<string>, games: Games): string | null {
  for (const p of GAME_PRESETS) {
    const ids = presetGames(games, p);
    if (ids.length === selected.size && ids.every((id) => selected.has(id))) return p === "all" ? null : p;
  }
  // ponytail: one id per selected game (about 11 characters each); a bitmask if URLs get too long.
  return games.filter((g) => selected.has(g.game_id)).map((g) => g.game_id).join("-");
}

/** The selected game ids from the param; unknown ids are dropped, and nothing valid means every game. */
export function parseGames(value: string | null, games: Games): Set<string> {
  const preset = GAME_PRESETS.find((p) => p === value);
  if (preset) return new Set(presetGames(games, preset));
  const known = new Set(games.map((g) => g.game_id));
  const ids = (value ?? "").split("-").filter((id) => known.has(id));
  return new Set(ids.length ? ids : known);
}

/** from/to through the same rules as the typed date fields (complete, in-season, ordered). */
export function parseWindow(from: string | null, to: string | null, first: string, last: string): DateWindow {
  return withTypedDate(withTypedDate(null, 0, from ?? "", first, last), 1, to ?? "", first, last);
}
