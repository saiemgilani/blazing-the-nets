import { readShots, type Shot } from "./shots.ts";

export interface Team {
  /** stats.nba.com team id; stable across relocations and renames. */
  team_id: number;
  /** The season's own tricode comes from the shots file; this is the current one. */
  tricode: string;
  name: string;
  /** Primary colour, for marks and accents. */
  color: string;
  /** ESPN team id, the key in the espn_nba_* releases (logos, rosters). */
  espn_id: number;
}

export const NETS_TEAM_ID = 1610612751;

// ponytail: current names/colours only; the site lists 2016+, where every franchise already
// carries its current name. Pre-2016 pages (NJN, SEA, NOH, ...) would need a season-aware map.
export const TEAMS: readonly Team[] = [
  { team_id: 1610612737, tricode: "ATL", name: "Atlanta Hawks", color: "#E03A3E", espn_id: 1 },
  { team_id: 1610612738, tricode: "BOS", name: "Boston Celtics", color: "#007A33", espn_id: 2 },
  { team_id: 1610612751, tricode: "BKN", name: "Brooklyn Nets", color: "#000000", espn_id: 17 },
  { team_id: 1610612766, tricode: "CHA", name: "Charlotte Hornets", color: "#1D1160", espn_id: 30 },
  { team_id: 1610612741, tricode: "CHI", name: "Chicago Bulls", color: "#CE1141", espn_id: 4 },
  { team_id: 1610612739, tricode: "CLE", name: "Cleveland Cavaliers", color: "#860038", espn_id: 5 },
  { team_id: 1610612742, tricode: "DAL", name: "Dallas Mavericks", color: "#00538C", espn_id: 6 },
  { team_id: 1610612743, tricode: "DEN", name: "Denver Nuggets", color: "#0E2240", espn_id: 7 },
  { team_id: 1610612765, tricode: "DET", name: "Detroit Pistons", color: "#C8102E", espn_id: 8 },
  { team_id: 1610612744, tricode: "GSW", name: "Golden State Warriors", color: "#1D428A", espn_id: 9 },
  { team_id: 1610612745, tricode: "HOU", name: "Houston Rockets", color: "#CE1141", espn_id: 10 },
  { team_id: 1610612754, tricode: "IND", name: "Indiana Pacers", color: "#002D62", espn_id: 11 },
  { team_id: 1610612746, tricode: "LAC", name: "LA Clippers", color: "#C8102E", espn_id: 12 },
  { team_id: 1610612747, tricode: "LAL", name: "Los Angeles Lakers", color: "#552583", espn_id: 13 },
  { team_id: 1610612763, tricode: "MEM", name: "Memphis Grizzlies", color: "#5D76A9", espn_id: 29 },
  { team_id: 1610612748, tricode: "MIA", name: "Miami Heat", color: "#98002E", espn_id: 14 },
  { team_id: 1610612749, tricode: "MIL", name: "Milwaukee Bucks", color: "#00471B", espn_id: 15 },
  { team_id: 1610612750, tricode: "MIN", name: "Minnesota Timberwolves", color: "#0C2340", espn_id: 16 },
  { team_id: 1610612740, tricode: "NOP", name: "New Orleans Pelicans", color: "#0C2340", espn_id: 3 },
  { team_id: 1610612752, tricode: "NYK", name: "New York Knicks", color: "#006BB6", espn_id: 18 },
  { team_id: 1610612760, tricode: "OKC", name: "Oklahoma City Thunder", color: "#007AC1", espn_id: 25 },
  { team_id: 1610612753, tricode: "ORL", name: "Orlando Magic", color: "#0077C0", espn_id: 19 },
  { team_id: 1610612755, tricode: "PHI", name: "Philadelphia 76ers", color: "#006BB6", espn_id: 20 },
  { team_id: 1610612756, tricode: "PHX", name: "Phoenix Suns", color: "#1D1160", espn_id: 21 },
  { team_id: 1610612757, tricode: "POR", name: "Portland Trail Blazers", color: "#E03A3E", espn_id: 22 },
  { team_id: 1610612758, tricode: "SAC", name: "Sacramento Kings", color: "#5A2D81", espn_id: 23 },
  { team_id: 1610612759, tricode: "SAS", name: "San Antonio Spurs", color: "#C4CED4", espn_id: 24 },
  { team_id: 1610612761, tricode: "TOR", name: "Toronto Raptors", color: "#CE1141", espn_id: 28 },
  { team_id: 1610612762, tricode: "UTA", name: "Utah Jazz", color: "#002B5C", espn_id: 26 },
  { team_id: 1610612764, tricode: "WAS", name: "Washington Wizards", color: "#002B5C", espn_id: 27 },
];

const BY_ID = new Map(TEAMS.map((t) => [t.team_id, t]));

export function teamById(teamId: number): Team | undefined {
  return BY_ID.get(teamId);
}

/** The season's teams as they appear in its shots, with that season's tricode. Sorted by tricode. */
export function teamsFromShots(shots: Shot[]): Team[] {
  const seen = new Map<number, string>();
  for (const s of shots) if (!seen.has(s.team_id)) seen.set(s.team_id, s.team_tricode);
  return [...seen]
    .map(([team_id, tricode]) => {
      const known = BY_ID.get(team_id);
      return known ? { ...known, tricode } : { team_id, tricode, name: tricode, color: "#888888", espn_id: 0 };
    })
    .sort((a, b) => a.tricode.localeCompare(b.tricode));
}

export async function readTeams(season: number): Promise<Team[]> {
  return teamsFromShots(await readShots(season, "all"));
}
