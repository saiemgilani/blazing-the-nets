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

export interface HexBin extends Split {
  /** Hex centre, legacy frame. */
  x: number;
  y: number;
  meanDistance: number;
}

/** d3-hexbin over the legacy frame; `radiusTenths` = 10 is a 1 ft hex. */
export function hexbinShots(shots: Shot[], radiusTenths: number): HexBin[] {
  const bins = hexbin<Shot>()
    .x((s) => s.x_legacy)
    .y((s) => s.y_legacy)
    .radius(radiusTenths)(shots);
  return bins.map((b) => {
    let distance = 0;
    for (const s of b) distance += s.shot_distance;
    return { x: b.x || 0, y: b.y || 0, ...tally(b), meanDistance: distance / b.length };
  });
}

export interface DistanceBin extends Split {
  /** Bin start in feet. */
  distance: number;
  /** Share of the attempts within `maxFt`. */
  share: number;
}

/**
 * FG% by `shot_distance` (whole feet) in `binFt` bins from 0 to `maxFt`; longer attempts are left
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

/** Align a player's distance bins with the league's (same binFt/maxFt) and take the difference. */
export function vsLeague(player: DistanceBin[], league: DistanceBin[]): DistanceVsLeague[] {
  return player.map((b, i) => {
    const leagueFgPct = league[i]?.fgPct ?? null;
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
 * Left / centre / right of the hoop by distance. Left is x < 0 (the left of the chart with the hoop
 * at the bottom, the 2021 site's convention); centre is within the rim's width, |x| <= 7.5.
 */
export function statsBySide(shots: Shot[], binFt = 1, maxFt = 35): SideBin[] {
  const n = Math.floor(maxFt / binFt) + 1;
  const acc = Array.from({ length: n }, () => ({ left: [0, 0], centre: [0, 0], right: [0, 0] }));
  for (const s of shots) {
    if (s.shot_distance > maxFt) continue;
    const bin = acc[Math.floor(s.shot_distance / binFt)];
    const side = Math.abs(s.x_legacy) <= COURT.rimRadius ? bin.centre : s.x_legacy < 0 ? bin.left : bin.right;
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
  /** The trailing `window` games ending at this one (fewer at the start of the season). */
  rolling: Split;
}

/** Per-game FG with a trailing N-game window, in game_id order (stats.nba.com ids run in schedule order). */
export function rollingByGame(shots: Shot[], window: number): GamePoint[] {
  const games = new Map<string, [number, number]>();
  for (const s of shots) {
    const g = games.get(s.game_id) ?? [0, 0];
    g[0] += 1;
    if (made(s)) g[1] += 1;
    games.set(s.game_id, g);
  }
  const ordered = [...games].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return ordered.map(([game_id, [attempts, makes]], i) => {
    let wa = 0;
    let wm = 0;
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      wa += ordered[j][1][0];
      wm += ordered[j][1][1];
    }
    return { game_id, ...split(attempts, makes), rolling: split(wa, wm) };
  });
}
