import { hexbin } from "d3-hexbin";
import { COURT, THREE_BREAK_Y } from "./court.ts";
import type { Shot } from "./shots.ts";

/** Pure aggregations over shots, all in the legacy frame (tenths of a foot) or in feet. */

export interface Split {
  attempts: number;
  makes: number;
  fgPct: number | null;
}

const made = (s: Pick<Shot, "shot_result">) => s.shot_result === "Made";

function split(attempts: number, makes: number): Split {
  return { attempts, makes, fgPct: attempts > 0 ? makes / attempts : null };
}

function tally(shots: Pick<Shot, "shot_result">[]): Split {
  let makes = 0;
  for (const s of shots) if (made(s)) makes += 1;
  return split(shots.length, makes);
}

/** Field goals with the three-point part, the inputs to FG%, eFG% and 3P%. */
export interface FieldGoals {
  attempts: number;
  makes: number;
  fg3a: number;
  fg3m: number;
}

export interface ShootingLine extends FieldGoals {
  fgPct: number | null;
  /** (FGM + 0.5 * 3PM) / FGA */
  efgPct: number | null;
  fg3Pct: number | null;
}

export function lineOf(fg: FieldGoals): ShootingLine {
  const { attempts, makes, fg3a, fg3m } = fg;
  return {
    ...fg,
    fgPct: attempts ? makes / attempts : null,
    efgPct: attempts ? (makes + 0.5 * fg3m) / attempts : null,
    fg3Pct: fg3a ? fg3m / fg3a : null,
  };
}

export function countFieldGoals(shots: Pick<Shot, "shot_result" | "shot_value">[]): FieldGoals {
  const fg = { attempts: 0, makes: 0, fg3a: 0, fg3m: 0 };
  for (const s of shots) addShot(fg, s);
  return fg;
}

/** Add one shot to running field-goal counts. */
export function addShot(fg: FieldGoals, s: Pick<Shot, "shot_result" | "shot_value">): void {
  fg.attempts += 1;
  if (made(s)) fg.makes += 1;
  if (s.shot_value === 3) {
    fg.fg3a += 1;
    if (made(s)) fg.fg3m += 1;
  }
}

/** Shooting line straight from shots. */
export function shootingLine(shots: Pick<Shot, "shot_result" | "shot_value">[]): ShootingLine {
  return lineOf(countFieldGoals(shots));
}

export interface HexBin extends Split {
  /** Hex centre, legacy frame. */
  x: number;
  y: number;
  meanDistance: number;
  /** The zone most of the hex's attempts fall in. */
  zone: Zone;
}

/** Inside the sidelines and in front of the baseline; the release has a few impossible points (2001-02: x = -16398). */
export function onCourt(s: Pick<Shot, "x_legacy" | "y_legacy">): boolean {
  return Math.abs(s.x_legacy) <= COURT.halfWidth && s.y_legacy >= COURT.baselineY;
}

/** d3-hexbin over the legacy frame; `radiusTenths` = 10 is a 1 ft hex. Off-court coordinates are dropped. */
export function hexbinShots(shots: Shot[], radiusTenths: number): HexBin[] {
  const bins = hexbin<Shot>()
    .x((s) => s.x_legacy)
    .y((s) => s.y_legacy)
    .radius(radiusTenths)(shots.filter(onCourt));
  return bins.map((b) => {
    let distance = 0;
    const zones = new Map<Zone, number>();
    for (const s of b) {
      distance += s.shot_distance;
      const z = zoneOf(s);
      zones.set(z, (zones.get(z) ?? 0) + 1);
    }
    const zone = [...zones].reduce((a, c) => (c[1] > a[1] ? c : a))[0];
    // `|| 0` folds d3-hexbin's -0 centres into 0 so equal hexes share one key.
    return { x: b.x || 0, y: b.y || 0, ...tally(b), meanDistance: distance / b.length, zone };
  });
}

/**
 * League attempts behind a hex's league FG% before it falls back to the zone, and the prior
 * (in attempts) that colours shrink toward the league rate with. One number for both.
 */
export const LEAGUE_PRIOR_ATTEMPTS = 25;

/**
 * FG% above/below the league rate L, shrunk toward L by a k-attempt prior:
 * (makes + k*L) / (attempts + k) - L. A 1-for-1 hex reads near 0; 20-for-20 reads strongly hot.
 * For colour only: tooltips and labels show the raw numbers.
 */
export function shrunkDiff(makes: number, attempts: number, league: number, k: number = LEAGUE_PRIOR_ATTEMPTS): number {
  return (makes + k * league) / (attempts + k) - league;
}

export interface HexVsLeague extends HexBin {
  leagueFgPct: number | null;
}

/** The league's hexes (keyed by centre) and zone rates, computed once per season and radius. */
export interface LeagueHexIndex {
  radius: number;
  hexes: Map<string, HexBin>;
  zones: Record<Zone, Split>;
}

export function leagueHexIndex(league: Shot[], radiusTenths: number): LeagueHexIndex {
  return {
    radius: radiusTenths,
    hexes: new Map(hexbinShots(league, radiusTenths).map((h) => [`${h.x},${h.y}`, h])),
    zones: statsByZone(league),
  };
}

/**
 * Player hexes with the league FG% of the same hex: the same radius gives the same centres. A hex
 * the league took fewer than `minLeague` shots from falls back to the league FG% of its zone.
 */
export function hexesVsLeague(player: Shot[], league: LeagueHexIndex, minLeague = LEAGUE_PRIOR_ATTEMPTS): HexVsLeague[] {
  return hexbinShots(player, league.radius).map((h) => {
    const l = league.hexes.get(`${h.x},${h.y}`);
    return { ...h, leagueFgPct: l && l.attempts >= minLeague ? l.fgPct : league.zones[h.zone].fgPct };
  });
}

export interface DistanceBin extends Split {
  /**
   * First foot in the bin. The release's shot_distance is ROUNDED feet, so a 1-ft bin is centred
   * on this value (it holds true distances in [d - 0.5, d + 0.5)).
   */
  distance: number;
  /** Share of the attempts within `maxFt`. */
  share: number;
}

/**
 * FG% by `shot_distance` (rounded feet) in `binFt` bins from 0 to `maxFt`; longer attempts are left
 * out, as on the 2021 site. Run it on league shots for the league curve.
 */
export function fgPctByDistance(shots: Shot[], binFt = 1, maxFt = 35): DistanceBin[] {
  const bins = Array.from({ length: Math.floor(maxFt / binFt) + 1 }, () => ({ attempts: 0, makes: 0 }));
  let total = 0;
  for (const s of shots) {
    if (s.shot_distance > maxFt) continue;
    const b = bins[Math.floor(s.shot_distance / binFt)];
    b.attempts += 1;
    if (made(s)) b.makes += 1;
    total += 1;
  }
  return bins.map((b, i) => ({ distance: i * binFt, ...split(b.attempts, b.makes), share: total ? b.attempts / total : 0 }));
}

export interface DistanceVsLeague extends DistanceBin {
  leagueFgPct: number | null;
  /** Player FG% minus league FG% (fraction, not points), null when either side has no attempts. */
  diff: number | null;
}

/** Pair a player's distance bins with the league's and take the difference; the bins must match exactly. */
export function vsLeague(player: DistanceBin[], league: DistanceBin[]): DistanceVsLeague[] {
  if (player.length !== league.length || player.some((b, i) => b.distance !== league[i].distance)) {
    throw new Error("vsLeague: player and league bins differ (use the same binFt and maxFt)");
  }
  return player.map((b, i) => {
    const leagueFgPct = league[i].fgPct;
    return { ...b, leagueFgPct, diff: b.fgPct !== null && leagueFgPct !== null ? b.fgPct - leagueFgPct : null };
  });
}

export interface SideBin {
  distance: number;
  left: Split;
  centre: Split;
  right: Split;
}

/**
 * Left / centre / right of the hoop by distance. Left is x < -centreHalfWidth (the left of the
 * chart with the hoop at the bottom), right is x > centreHalfWidth, centre is in between. The
 * default 0 keeps the 2021 split (x < 0 left, x > 0 right); x == 0 lands in centre, where the 2021
 * site dropped it. A wider band (e.g. 7.5, the rim) moves ~20% of attempts into centre.
 */
export function statsBySide(shots: Shot[], binFt = 1, maxFt = 35, centreHalfWidth = 0): SideBin[] {
  const n = Math.floor(maxFt / binFt) + 1;
  const acc = Array.from({ length: n }, () => ({ left: [0, 0], centre: [0, 0], right: [0, 0] }));
  for (const s of shots) {
    if (s.shot_distance > maxFt) continue;
    const bin = acc[Math.floor(s.shot_distance / binFt)];
    const side = s.x_legacy < -centreHalfWidth ? bin.left : s.x_legacy > centreHalfWidth ? bin.right : bin.centre;
    side[0] += 1;
    if (made(s)) side[1] += 1;
  }
  return acc.map((b, i) => ({
    distance: i * binFt,
    left: split(b.left[0], b.left[1]),
    centre: split(b.centre[0], b.centre[1]),
    right: split(b.right[0], b.right[1]),
  }));
}

export const ZONES = [
  "restricted_area",
  "paint",
  "mid_range",
  "corner_3_left",
  "corner_3_right",
  "above_break_3",
] as const;

export type Zone = (typeof ZONES)[number];

/**
 * Two or three comes from `shot_value` (the scorer's call; coordinates near the line are noisy).
 * Threes at or below the corner break (y <= ~89.5) are corner threes, split by the sign of x.
 * Twos: within 4 ft of the hoop centre is the restricted area, then the 16 ft lane up to the
 * free-throw line is the paint, anything else is mid-range.
 */
export function zoneOf(s: Pick<Shot, "x_legacy" | "y_legacy" | "shot_value">): Zone {
  if (s.shot_value === 3) {
    if (s.y_legacy <= THREE_BREAK_Y) return s.x_legacy < 0 ? "corner_3_left" : "corner_3_right";
    return "above_break_3";
  }
  if (Math.hypot(s.x_legacy, s.y_legacy) <= COURT.restrictedRadius) return "restricted_area";
  if (Math.abs(s.x_legacy) <= COURT.laneHalfWidth && s.y_legacy <= COURT.freeThrowY) return "paint";
  return "mid_range";
}

export function statsByZone(shots: Shot[]): Record<Zone, Split> {
  const acc = Object.fromEntries(ZONES.map((z) => [z, [0, 0]])) as Record<Zone, [number, number]>;
  for (const s of shots) {
    const z = acc[zoneOf(s)];
    z[0] += 1;
    if (made(s)) z[1] += 1;
  }
  return Object.fromEntries(ZONES.map((z) => [z, split(acc[z][0], acc[z][1])])) as Record<Zone, Split>;
}

export interface GamePoint extends Split {
  game_id: string;
  game_date: string;
  /** The trailing `window` games ending at this one (fewer at the start of the season). */
  rolling: Split;
}

/**
 * Per-game FG with a trailing N-game window, in date order (then game_id). game_id order is not
 * date order, so dates come from `readGameDates`; a game without a date throws.
 */
export function rollingByGame(shots: Shot[], window: number, gameDates: ReadonlyMap<string, string>): GamePoint[] {
  const games = new Map<string, [number, number]>();
  for (const s of shots) {
    const g = games.get(s.game_id) ?? [0, 0];
    g[0] += 1;
    if (made(s)) g[1] += 1;
    games.set(s.game_id, g);
  }
  const dated = [...games].map(([id, g]) => {
    const date = gameDates.get(id);
    if (date === undefined) throw new Error(`rollingByGame: no date for game ${id}`);
    return [id, g, date] as const;
  });
  const ordered = dated.sort((a, b) => a[2].localeCompare(b[2]) || a[0].localeCompare(b[0]));
  return ordered.map(([game_id, [attempts, makes], game_date], i) => {
    let wa = 0;
    let wm = 0;
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      wa += ordered[j][1][0];
      wm += ordered[j][1][1];
    }
    return { game_id, game_date, ...split(attempts, makes), rolling: split(wa, wm) };
  });
}
