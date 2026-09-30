import { lineOf, type FieldGoals, type PlayerGame } from "./aggregate.ts";

/** Shotline-style rolling-window leaderboards: each player's latest N games against the league. */

export const LEADER_WINDOWS = [5, 10, 20] as const;
export type LeaderWindow = (typeof LEADER_WINDOWS)[number];

export const LEADER_METRICS = ["fgPct", "efgPct", "fg3Pct", "improved"] as const;
export type LeaderMetric = (typeof LEADER_METRICS)[number];

export const LEADER_LABELS: Record<LeaderMetric, string> = {
  fgPct: "FG%",
  efgPct: "eFG%",
  fg3Pct: "3P%",
  improved: "Most improved",
};

/** Eligible: 5 attempts per game of the window (and 3 threes per game for 3P%). */
export const minAttempts = (n: number) => 5 * n;
export const minThrees = (n: number) => 3 * n;

export interface PlayerGames {
  person_id: number;
  name: string;
  /** His team in his latest game. */
  team_id: number;
  team: string;
  games: PlayerGame[]; // date order
}

export interface WindowLine extends FieldGoals {
  games: number;
  from: string;
  to: string;
}

/** The player's last `n` games (fewer if he played fewer), pooled. */
export function windowLine(games: PlayerGame[], n: number): WindowLine | null {
  const last = games.slice(-n);
  if (!last.length) return null;
  const fg = { attempts: 0, makes: 0, fg3a: 0, fg3m: 0 };
  for (const g of last) {
    fg.attempts += g.attempts;
    fg.makes += g.makes;
    fg.fg3a += g.fg3a;
    fg.fg3m += g.fg3m;
  }
  return { ...fg, games: last.length, from: last[0].date, to: last[last.length - 1].date };
}

export interface LeaderRow {
  person_id: number;
  name: string;
  /** His team in the window's last game. */
  team_id: number;
  team: string;
  rank: number;
  /** The ranked number: the window's rate, or for "improved" the window eFG% minus his season eFG%. */
  value: number;
  window: WindowLine;
  /** His season eFG% ("improved" only). */
  seasonEfg: number | null;
}

/**
 * One board: eligible players ranked on `metric` over their last `n` games (competition ranking:
 * ties share a rank). A full window is required (n games played) so a 5-game rookie is not
 * compared with a 20-game window.
 */
export function leaderboard(players: PlayerGames[], n: number, metric: LeaderMetric): LeaderRow[] {
  const rows: Omit<LeaderRow, "rank">[] = [];
  for (const p of players) {
    const w = windowLine(p.games, n);
    if (!w || w.games < n || w.attempts < minAttempts(n)) continue;
    const line = lineOf(w);
    let value: number | null;
    let seasonEfg: number | null = null;
    if (metric === "fg3Pct") value = w.fg3a >= minThrees(n) ? line.fg3Pct : null;
    else if (metric === "improved") {
      seasonEfg = lineOf(windowLine(p.games, p.games.length) ?? w).efgPct;
      value = line.efgPct !== null && seasonEfg !== null ? line.efgPct - seasonEfg : null;
    } else value = line[metric];
    if (value === null) continue;
    rows.push({ person_id: p.person_id, name: p.name, team_id: p.team_id, team: p.team, value, window: w, seasonEfg });
  }
  rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.value !== rows[i - 1].value) rank = i + 1;
    return { ...r, rank };
  });
}

export interface Board {
  /** The top rows. */
  rows: LeaderRow[];
  /** Highlighted-team players ranked below the top rows (so the Nets always show). */
  also: LeaderRow[];
  eligible: number;
}

export type Boards = Record<LeaderWindow, Record<LeaderMetric, Board>>;

/** Every window x metric board, top `top` rows each, plus the highlighted team's other rows. */
export function leaderBoards(players: PlayerGames[], highlightTeamId: number, top = 15): Boards {
  const out = {} as Boards;
  for (const n of LEADER_WINDOWS) {
    out[n] = {} as Record<LeaderMetric, Board>;
    for (const metric of LEADER_METRICS) {
      const all = leaderboard(players, n, metric);
      out[n][metric] = { rows: all.slice(0, top), also: all.slice(top).filter((r) => r.team_id === highlightTeamId), eligible: all.length };
    }
  }
  return out;
}
