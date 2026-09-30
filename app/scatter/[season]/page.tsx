import type { Metadata } from "next";
import { QuerySelect } from "@/components/QuerySelect.tsx";
import { ScatterExplorer } from "@/components/ScatterExplorer.tsx";
import { listSeasons, parseSeason, seasonLabel } from "@/lib/data/seasons.ts";
import { seasonQuery } from "@/lib/links.ts";
import { readScatter, seasonOptions } from "@/lib/pageData.ts";

// Served at /scatter?season= (proxy.ts). Axes, marks and the filter are client state.
export const revalidate = 21600;
type Params = Promise<{ season: string }>;

async function resolve(params: Params) {
  const [{ season: param }, seasons] = await Promise.all([params, listSeasons()]);
  const season = parseSeason(param, seasons);
  const current = seasons[seasons.length - 1];
  return { season, seasons, current, q: seasonQuery(season, current) };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { season, q } = await resolve(params);
  return {
    title: `Scatter, ${seasonLabel(season)}`,
    description: `Every NBA player with 100+ field-goal attempts in ${seasonLabel(season)}, plotted on two shooting or volume numbers, the Nets highlighted.`,
    alternates: { canonical: `/scatter${q}` },
  };
}

export function generateStaticParams() {
  return [{ season: "current" }];
}

export default async function Scatter({ params }: { params: Params }) {
  const { season, seasons, current } = await resolve(params);
  const points = await readScatter(season);
  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">League scatter, {seasonLabel(season)}</h1>
        <QuerySelect label="Season" name="season" value={String(season)} options={seasonOptions(seasons)} basePath="/scatter" defaults={{ season: String(current) }} />
      </header>
      <ScatterExplorer points={points} subject={`NBA ${seasonLabel(season)}`} />
    </div>
  );
}
