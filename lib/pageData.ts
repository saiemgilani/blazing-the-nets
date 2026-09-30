import { buildDashboard, leagueContext, type DashboardData, type LeagueContext } from "./dashboard.ts";
import { lineOf, playerGames, shootingLine, versusOpponents, type OpponentLine, type PlayerGame, type ShootingLine } from "./data/aggregate.ts";
import { teamGames } from "./data/games.ts";
import { PLAYER_STATS_TAG, PlayerStatsRow, seasonPlayers, type PlayerSeason } from "./data/players.ts";
import { rankSummaries, type RankSummary } from "./data/ranks.ts";
import { memo, readParquet } from "./data/releases.ts";
import { readHeadshots } from "./data/rosters.ts";
import { seasonLabel } from "./data/seasons.ts";
import { readGameLogs, readShots, toLite, type GameLogRow, type Shot, type ShotLite } from "./data/shots.ts";
import { teamById, teamsFromShots, type Team } from "./data/teams.ts";

/**
 * Server-side assembly for the pages: plain JSON for the charts, computed once per season where
 * the work is league-wide. The `assemble*` functions are pure (tested offline on the fixture);
 * the `load*` functions add the release reads.
 */

export { BAR_BIN_FT, HEX_RADIUS } from "./dashboard.ts";
export type { DashboardData, LeagueContext } from "./dashboard.ts";

/** One season's regular-season shots, stats, league context and league-wide player index. */
export interface SeasonData {
  season: number;
  shots: Shot[];
  stats: PlayerStatsRow[];
  league: LeagueContext;
  players: PlayerSeason[];
}

export function seasonData(season: number, shots: Shot[], stats: PlayerStatsRow[]): SeasonData {
  return { season, shots, stats, league: leagueContext(shots), players: seasonPlayers(shots, stats) };
}

/** Memoised per season (same 4-season LRU as the release reads). */
export function readSeasonData(season: number): Promise<SeasonData> {
  return memo("season-data", String(season), async () => {
    const [shots, stats] = await Promise.all([
      readShots(season, "regular"),
      readParquet(PLAYER_STATS_TAG, `player_season_stats_${season}.parquet`, PlayerStatsRow),
    ]);
    return seasonData(season, shots, stats);
  });
}

export function teamRoster(data: SeasonData, teamId: number): PlayerSeason[] {
  return seasonPlayers(data.shots, data.stats, teamId);
}

/** What the player page's game filters need in the browser to rebuild the six charts. */
export interface ExplorerData {
  shots: ShotLite[];
  /** Date-ordered games; null when the game logs cannot place every game (the per-game views say so). */
  games: PlayerGame[] | null;
  league: LeagueContext;
  seasonFgPct: number | null;
}

export interface PlayerPageData {
  season: number;
  player: PlayerSeason;
  line: ShootingLine;
  /** Tricodes of every team he shot for, primary first. */
  teams: string[];
  headshot: string | null;
  prev: PlayerSeason | null;
  next: PlayerSeason | null;
  /** The whole-season charts (the OG image; the page rebuilds them from `explorer`). */
  dashboard: DashboardData;
  explorer: ExplorerData;
  ranks: RankSummary[];
  /** By opponent, most attempts first; null when the per-game views are unavailable. */
  versus: OpponentLine[] | null;
}

/** Date-ordered games, or null (logged) when a game is missing from the logs, so the page still renders. */
function gamesOrNull(shots: ShotLite[], logs: GameLogRow[] | null, personId: number): PlayerGame[] | null {
  if (!logs) return null;
  try {
    return playerGames(shots, teamGames(logs));
  } catch (e) {
    console.warn(`[player ${personId}] per-game views unavailable: ${(e as Error).message}`);
    return null;
  }
}

export function assemblePlayerPage(data: SeasonData, personId: number, headshot: string | null, logs: GameLogRow[] | null): PlayerPageData | null {
  const player = data.players.find((p) => p.person_id === personId);
  if (!player) return null;
  const mine = data.shots.filter((s) => s.person_id === personId);
  const byTeam = new Map<string, number>();
  for (const s of mine) byTeam.set(s.team_tricode, (byTeam.get(s.team_tricode) ?? 0) + 1);
  const roster = teamRoster(data, player.team_id);
  const i = roster.findIndex((p) => p.person_id === personId);
  const shots = mine.map(toLite);
  const games = gamesOrNull(shots, logs, personId);
  const line = shootingLine(mine);
  return {
    season: data.season,
    player,
    line,
    teams: [...byTeam].sort((a, b) => b[1] - a[1]).map(([t]) => t),
    headshot,
    prev: i > 0 ? roster[i - 1] : null,
    next: i >= 0 && i < roster.length - 1 ? roster[i + 1] : null,
    dashboard: buildDashboard(shots, data.league),
    explorer: { shots, games, league: data.league, seasonFgPct: line.fgPct },
    ranks: rankSummaries(data.players, personId),
    versus: games ? versusOpponents(games) : null,
  };
}

export async function loadPlayerPage(season: number, personId: number): Promise<PlayerPageData | null> {
  const data = await readSeasonData(season);
  const player = data.players.find((p) => p.person_id === personId);
  if (!player) return null;
  const [headshots, logs] = await Promise.all([
    readHeadshots(season, [player]),
    readGameLogs(season).catch((e: unknown) => {
      console.warn(`[season ${season}] game logs unavailable: ${(e as Error).message}`);
      return null;
    }),
  ]);
  return assemblePlayerPage(data, personId, headshots.get(personId) ?? null, logs);
}

export interface TeamPageData {
  season: number;
  team: Team;
  line: ShootingLine;
  roster: PlayerSeason[];
  dashboard: DashboardData;
}

export function assembleTeamPage(data: SeasonData, teamId: number): TeamPageData | null {
  const shots = data.shots.filter((s) => s.team_id === teamId);
  const team = teamsFromShots(shots)[0] ?? teamById(teamId);
  if (shots.length === 0 || !team) return null;
  return { season: data.season, team, line: shootingLine(shots), roster: teamRoster(data, teamId), dashboard: buildDashboard(shots, data.league) };
}

export async function loadTeamPage(season: number, teamId: number): Promise<TeamPageData | null> {
  return assembleTeamPage(await readSeasonData(season), teamId);
}

/** Each team's shooting line for the season, keyed by team_id. */
export function teamLines(shots: Shot[]): Map<number, ShootingLine> {
  const byTeam = new Map<number, Shot[]>();
  for (const s of shots) {
    const list = byTeam.get(s.team_id);
    if (list) list.push(s);
    else byTeam.set(s.team_id, [s]);
  }
  return new Map([...byTeam].map(([id, list]) => [id, shootingLine(list)]));
}

/** A table row for a player (plain JSON for the client table). */
export interface PlayerRow {
  person_id: number;
  name: string;
  team: string;
  attempts: number;
  fgPct: number | null;
  efgPct: number | null;
  fg3Pct: number | null;
  gp: number | null;
  min: number | null;
  /** The row is one team's shots but gp/min are his season totals across teams. */
  acrossTeams: boolean;
}

export function playerRows(players: PlayerSeason[]): PlayerRow[] {
  return players.map((p) => {
    const line = lineOf(p);
    return {
      person_id: p.person_id,
      name: p.player_name,
      team: p.team_tricode,
      attempts: p.attempts,
      fgPct: line.fgPct,
      efgPct: line.efgPct,
      fg3Pct: line.fg3Pct,
      gp: p.stats?.gp ?? null,
      min: p.stats?.min ?? null,
      acrossTeams: p.statsScope === "all-teams",
    };
  });
}

/** Season picker options, newest first. */
export function seasonOptions(seasons: number[]): { value: string; label: string }[] {
  return [...seasons].reverse().map((s) => ({ value: String(s), label: seasonLabel(s) }));
}
