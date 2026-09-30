import type { DistanceBarsData } from "./charts/distanceBars.ts";
import type { HexShotChartData } from "./charts/hexShotChart.ts";
import type { ShootingSignatureData } from "./charts/shootingSignature.ts";
import type { SideChartData } from "./charts/sideChart.ts";
import {
  fgPctByDistance,
  hexesVsLeague,
  leagueHexIndex,
  lineOf,
  shootingLine,
  statsBySide,
  statsByZone,
  vsLeague,
  ZONES,
  type DistanceBin,
  type LeagueHexIndex,
  type ShootingLine,
  type SideBin,
} from "./data/aggregate.ts";
import { PLAYER_STATS_TAG, PlayerStatsRow, seasonPlayers, type PlayerSeason } from "./data/players.ts";
import { memo, readParquet } from "./data/releases.ts";
import { readHeadshots } from "./data/rosters.ts";
import { seasonLabel } from "./data/seasons.ts";
import { readShots, type Shot } from "./data/shots.ts";
import { teamById, teamsFromShots, type Team } from "./data/teams.ts";

/**
 * Server-side assembly for the pages: plain JSON for the charts, computed once per season where
 * the work is league-wide. The `assemble*` functions are pure (tested offline on the fixture);
 * the `load*` functions add the release reads.
 */

export const HEX_RADIUS = 15; // tenths of a foot
export const BAR_BIN_FT = 3;

/** League-wide aggregates every dashboard compares against. */
export interface LeagueContext {
  hexIndex: LeagueHexIndex;
  byFoot: DistanceBin[];
  byBin: DistanceBin[];
  sides: SideBin[];
}

export function leagueContext(league: Shot[]): LeagueContext {
  return {
    hexIndex: leagueHexIndex(league, HEX_RADIUS),
    byFoot: fgPctByDistance(league),
    byBin: fgPctByDistance(league, BAR_BIN_FT),
    sides: statsBySide(league, BAR_BIN_FT),
  };
}

export interface DashboardData {
  hex: HexShotChartData;
  signature: ShootingSignatureData;
  bars: DistanceBarsData;
  sides: SideChartData;
}

/** The six charts' data for a set of shots (a player's or a team's) against the league. */
export function buildDashboard(subject: Shot[], league: LeagueContext): DashboardData {
  const zones = statsByZone(subject);
  return {
    hex: {
      hexes: hexesVsLeague(subject, league.hexIndex),
      radius: HEX_RADIUS,
      zones: Object.fromEntries(ZONES.map((z) => [z, { player: zones[z], league: league.hexIndex.zones[z] }])) as HexShotChartData["zones"],
    },
    signature: vsLeague(fgPctByDistance(subject), league.byFoot),
    bars: { player: fgPctByDistance(subject, BAR_BIN_FT), league: league.byBin, binFt: BAR_BIN_FT },
    sides: { player: statsBySide(subject, BAR_BIN_FT), league: league.sides, binFt: BAR_BIN_FT },
  };
}

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

// 2d note: when the game selector wires rollingByGame (needs readGameDates), catch its
// "no date for game" throw here per page and drop that game, so one bad release row is not a 500.

export interface PlayerPageData {
  season: number;
  player: PlayerSeason;
  line: ShootingLine;
  /** Tricodes of every team he shot for, primary first. */
  teams: string[];
  headshot: string | null;
  prev: PlayerSeason | null;
  next: PlayerSeason | null;
  dashboard: DashboardData;
}

export function assemblePlayerPage(data: SeasonData, personId: number, headshot: string | null): PlayerPageData | null {
  const player = data.players.find((p) => p.person_id === personId);
  if (!player) return null;
  const mine = data.shots.filter((s) => s.person_id === personId);
  const byTeam = new Map<string, number>();
  for (const s of mine) byTeam.set(s.team_tricode, (byTeam.get(s.team_tricode) ?? 0) + 1);
  const roster = teamRoster(data, player.team_id);
  const i = roster.findIndex((p) => p.person_id === personId);
  return {
    season: data.season,
    player,
    line: shootingLine(mine),
    teams: [...byTeam].sort((a, b) => b[1] - a[1]).map(([t]) => t),
    headshot,
    prev: i > 0 ? roster[i - 1] : null,
    next: i >= 0 && i < roster.length - 1 ? roster[i + 1] : null,
    dashboard: buildDashboard(mine, data.league),
  };
}

export async function loadPlayerPage(season: number, personId: number): Promise<PlayerPageData | null> {
  const data = await readSeasonData(season);
  const player = data.players.find((p) => p.person_id === personId);
  if (!player) return null;
  const headshots = await readHeadshots(season, [player]);
  return assemblePlayerPage(data, personId, headshots.get(personId) ?? null);
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
