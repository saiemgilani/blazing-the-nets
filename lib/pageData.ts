import { buildDashboard, leagueContext, type DashboardData, type LeagueContext } from "./dashboard.ts";
import { lineOf, playerGames, shootingLine, statsByZone, type PlayerGame, type ShootingLine } from "./data/aggregate.ts";
import { teamGames } from "./data/games.ts";
import { leaderBoards, type Boards, type PlayerGames } from "./data/leaders.ts";
import { scatterPoints } from "./data/scatter.ts";
import type { ScatterPoint } from "./scatterMetrics.ts";
import { PLAYER_STATS_TAG, PlayerStatsRow, seasonPlayers, type PlayerSeason } from "./data/players.ts";
import { rankSummaries, type RankSummary } from "./data/ranks.ts";
import { z } from "zod";
import { int64, memo, openAsset, parseParquet, readParquet } from "./data/releases.ts";
import { readHeadshots } from "./data/rosters.ts";
import { listSeasons, seasonLabel } from "./data/seasons.ts";
import { readGameLogs, readShots, SHOTS_TAG, shotsAsset, toLite, type GameLogRow, type Shot, type ShotLite } from "./data/shots.ts";
import { NETS_TEAM_ID, teamById, teamsFromShots, type Team } from "./data/teams.ts";

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
      readParquet(PLAYER_STATS_TAG, `player_season_stats_${season}.parquet`, PlayerStatsRow, { optional: true }),
    ]);
    return seasonData(season, shots, stats);
  });
}

const PersonGameRow = z.object({ person_id: int64, game_id: z.string() });

/**
 * person_id -> the listed seasons he took a regular-season shot in (for the player page's season
 * picker). Two columns of every season's shots file, read outside the release LRU so they do not
 * evict whole seasons; built once per process per 6 h.
 */
export function readPlayerSeasons(): Promise<Map<number, number[]>> {
  return memo("player-seasons", "all", async () => {
    const seasons = await listSeasons();
    const perSeason = await Promise.all(
      seasons.map(async (season) => {
        const rows = await parseParquet(await openAsset(SHOTS_TAG, shotsAsset(season)), PersonGameRow);
        return [season, new Set(rows.filter((r) => r.game_id.startsWith("002")).map((r) => r.person_id))] as const;
      }),
    );
    const index = new Map<number, number[]>();
    for (const [season, ids] of perSeason) {
      for (const id of ids) {
        const list = index.get(id);
        if (list) list.push(season);
        else index.set(id, [season]);
      }
    }
    return index;
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

/** One row of the dense roster table (plain JSON). Shooting numbers count this team's shots. */
export interface RosterRow {
  person_id: number;
  name: string;
  headshot: string | null;
  /** He also played for other teams: GP, MIN, FGA/g, TS%, USG% and PIE are his season totals across teams. */
  acrossTeams: boolean;
  gp: number | null;
  minPg: number | null;
  minTotal: number | null;
  fga: number;
  fgaPg: number | null;
  fgPct: number | null;
  efgPct: number | null;
  fg3Pct: number | null;
  tsPct: number | null;
  /** Restricted-area and mid-range FG%, and threes as a share of attempts. */
  rimPct: number | null;
  midPct: number | null;
  fg3Rate: number | null;
  usgPct: number | null;
  pie: number | null;
}

export function rosterRows(data: SeasonData, teamId: number, headshots: ReadonlyMap<number, string>): RosterRow[] {
  return teamRoster(data, teamId).map((p) => {
    const shots = data.shots.filter((s) => s.person_id === p.person_id && s.team_id === teamId);
    const zones = statsByZone(shots);
    const line = lineOf(p);
    const st = p.stats;
    return {
      person_id: p.person_id,
      name: p.player_name,
      headshot: headshots.get(p.person_id) ?? null,
      acrossTeams: p.statsScope === "all-teams",
      gp: st?.gp ?? null,
      minPg: st?.min ?? null,
      minTotal: st?.min_total ?? null,
      fga: p.attempts,
      fgaPg: st?.fga_pg ?? null,
      fgPct: line.fgPct,
      efgPct: line.efgPct,
      fg3Pct: line.fg3Pct,
      tsPct: st?.ts_pct ?? null,
      rimPct: zones.restricted_area.fgPct,
      midPct: zones.mid_range.fgPct,
      fg3Rate: p.attempts ? p.fg3a / p.attempts : null,
      usgPct: st?.usg_pct ?? null,
      pie: st?.pie ?? null,
    };
  });
}

export interface TeamPageData {
  season: number;
  team: Team;
  line: ShootingLine;
  roster: RosterRow[];
  dashboard: DashboardData;
}

export function assembleTeamPage(data: SeasonData, teamId: number, headshots: ReadonlyMap<number, string> = new Map()): TeamPageData | null {
  const shots = data.shots.filter((s) => s.team_id === teamId);
  const team = teamsFromShots(shots)[0] ?? teamById(teamId);
  if (shots.length === 0 || !team) return null;
  return { season: data.season, team, line: shootingLine(shots), roster: rosterRows(data, teamId, headshots), dashboard: buildDashboard(shots, data.league) };
}

export async function loadTeamPage(season: number, teamId: number): Promise<TeamPageData | null> {
  const data = await readSeasonData(season);
  const headshots = await readHeadshots(season, teamRoster(data, teamId));
  return assembleTeamPage(data, teamId, headshots);
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

/**
 * Every player's games in date order (for the rolling leaderboards). A player with a game the logs
 * cannot place is left out rather than failing the page.
 */
export function seasonPlayerGames(data: SeasonData, logs: GameLogRow[]): PlayerGames[] {
  const games = teamGames(logs);
  const byPlayer = new Map<number, Shot[]>();
  for (const s of data.shots) {
    const list = byPlayer.get(s.person_id);
    if (list) list.push(s);
    else byPlayer.set(s.person_id, [s]);
  }
  const names = new Map(data.players.map((p) => [p.person_id, p.player_name]));
  const out: PlayerGames[] = [];
  for (const [person_id, shots] of byPlayer) {
    try {
      const pg = playerGames(shots.map(toLite), games);
      const lastGame = pg[pg.length - 1];
      const lastShot = shots.find((s) => s.game_id === lastGame.game_id) ?? shots[0];
      out.push({ person_id, name: names.get(person_id) ?? lastShot.player_name, team_id: lastShot.team_id, team: lastShot.team_tricode, games: pg });
    } catch {
      // ponytail: skipped silently per player; the page states the eligibility rules, not the gaps
    }
  }
  return out;
}

export interface LeadersData {
  season: number;
  boards: Boards;
  players: number;
  /** Server time to build every board from the season's shots and logs. */
  computeMs: number;
}

/** The rolling leaderboards for a season, built once per process per 6 h (the heaviest computation). */
export function readLeaders(season: number): Promise<LeadersData> {
  return memo("leaders", String(season), async () => {
    const [data, logs] = await Promise.all([readSeasonData(season), readGameLogs(season)]);
    const t0 = performance.now();
    const players = seasonPlayerGames(data, logs);
    const boards = leaderBoards(players, NETS_TEAM_ID);
    return { season, boards, players: players.length, computeMs: Math.round(performance.now() - t0) };
  });
}

/** The scatter's points: every 100+ FGA player with his metrics and headshot. */
export async function readScatter(season: number): Promise<ScatterPoint[]> {
  const data = await readSeasonData(season);
  const headshots = await readHeadshots(season, data.players);
  return scatterPoints(data.players, headshots, NETS_TEAM_ID);
}
