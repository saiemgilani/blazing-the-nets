import type { Metadata } from "next";
import { Leaderboards } from "@/components/Leaderboards.tsx";
import { QuerySelect } from "@/components/QuerySelect.tsx";
import { seasonLabel } from "@/lib/data/seasons.ts";
import { NETS_TEAM_ID } from "@/lib/data/teams.ts";
import { readLeaders, resolveSeason, seasonOptions } from "@/lib/pageData.ts";

// Served at /leaders?season= (proxy.ts). Every board is built on the server; the window and the
// board are client state.
export const revalidate = 21600;
type Params = Promise<{ season: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { season, q } = await resolveSeason((await params).season);
  return {
    title: `Leaders, ${seasonLabel(season)}`,
    description: `Who is shooting best over their last 5, 10 and 20 games in ${seasonLabel(season)}: FG%, eFG%, 3P% and most improved, the Nets highlighted.`,
    alternates: { canonical: `/leaders${q}` },
  };
}

export function generateStaticParams() {
  return [{ season: "current" }];
}

export default async function Leaders({ params }: { params: Params }) {
  const { season, seasons, current, q } = await resolveSeason((await params).season);
  const data = await readLeaders(season);
  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Rolling leaders, {seasonLabel(season)}</h1>
        <QuerySelect label="Season" name="season" value={String(season)} options={seasonOptions(seasons)} basePath="/leaders" defaults={{ season: String(current) }} />
      </header>
      <Leaderboards boards={data.boards} netsTeamId={NETS_TEAM_ID} seasonQuery={q} />
    </div>
  );
}
