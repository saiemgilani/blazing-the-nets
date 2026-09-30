import type { GameLogRow } from "./shots.ts";

/** Per-game context, pure (no release reads) so the browser can use it too. */

/** One team's view of one game. */
export interface GameInfo {
  game_id: string;
  date: string;
  team_id: number;
  opponent_id: number;
  opponent: string;
  /** "vs." in the matchup; neutral-site games list both sides with "@", so both count as away. */
  home: boolean;
  win: boolean | null;
}

export const gameKey = (gameId: string, teamId: number) => `${gameId}:${teamId}`;

/** (game_id, team_id) -> that team's game, with the opponent taken from the game's other row. */
export function teamGames(rows: GameLogRow[]): Map<string, GameInfo> {
  const byGame = new Map<string, GameLogRow[]>();
  for (const r of rows) byGame.set(r.game_id, [...(byGame.get(r.game_id) ?? []), r]);
  const out = new Map<string, GameInfo>();
  for (const [gameId, pair] of byGame) {
    if (pair.length !== 2) continue; // ponytail: a half-logged game has no opponent; it drops out of per-game views
    for (const [me, them] of [pair, [pair[1], pair[0]]]) {
      out.set(gameKey(gameId, me.team_id), {
        game_id: gameId,
        date: me.game_date,
        team_id: me.team_id,
        opponent_id: them.team_id,
        opponent: them.team_abbreviation,
        home: me.matchup.includes(" vs. "),
        win: me.wl === null ? null : me.wl === "W",
      });
    }
  }
  return out;
}
