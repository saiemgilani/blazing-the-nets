import type { MetadataRoute } from "next";
import { listSeasons } from "@/lib/data/seasons.ts";
import { teamsFromShots } from "@/lib/data/teams.ts";
import { readSeasonData } from "@/lib/pageData.ts";
import { SITE_URL } from "@/lib/site.ts";

export const revalidate = 21600;

/** The fixed pages plus every player and team of the current season, at their default URLs. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seasons = await listSeasons();
  const data = await readSeasonData(seasons[seasons.length - 1]);
  const paths = [
    "",
    "/players",
    "/teams",
    "/scatter",
    "/leaders",
    "/about",
    ...data.players.map((p) => `/players/${p.person_id}`),
    ...teamsFromShots(data.shots).map((t) => `/teams/${t.team_id}`),
  ];
  return paths.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "daily" }));
}
