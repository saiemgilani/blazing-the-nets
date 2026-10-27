import { NextResponse, type NextRequest } from "next/server";
import { readSeasonData } from "@/lib/pageData.ts";
import { listSeasons } from "@/lib/data/seasons.ts";
import { toLite } from "@/lib/data/shots.ts";

/**
 * The compare view's other side, fetched by the player page in the browser:
 *   /api/shots?season=2026              every shooter that season (id, name, team, FGA), by name
 *   /api/shots?season=2026&player=<id>  one player's regular-season shots (ShotLite[])
 * Season must be a listed one and player a shooter in it, else 404. Cached at the edge for the
 * pages' 6-hour window; the season reads share the pages' per-process LRU.
 */

const CACHE = { "cache-control": "public, s-maxage=21600, stale-while-revalidate=86400" };

const notFound = () => NextResponse.json({ error: "not found" }, { status: 404 });

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const season = Number(params.get("season"));
  if (!(await listSeasons()).includes(season)) return notFound();
  const data = await readSeasonData(season);
  const player = params.get("player");
  if (player === null) {
    const players = data.players
      .map((p) => ({ id: p.person_id, name: p.player_name, team: p.team_tricode, fga: p.attempts }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ season, players }, { headers: CACHE });
  }
  const id = /^\d{1,10}$/.test(player) ? Number(player) : NaN;
  const p = data.players.find((x) => x.person_id === id);
  if (!p) return notFound();
  const shots = data.shots.filter((s) => s.person_id === id).map(toLite);
  return NextResponse.json({ season, id, name: p.player_name, shots }, { headers: CACHE });
}
