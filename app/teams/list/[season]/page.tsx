import type { Metadata } from "next";
import Link from "next/link";
import { QuerySelect } from "@/components/QuerySelect.tsx";
import { seasonLabel } from "@/lib/data/seasons.ts";
import { teamsFromShots } from "@/lib/data/teams.ts";
import { fmtInt, fmtPct } from "@/lib/format.ts";
import { teamHref } from "@/lib/links.ts";
import { readSeasonData, resolveSeason, seasonOptions, teamLines } from "@/lib/pageData.ts";

// Served at /teams?season= (proxy.ts).
export const revalidate = 21600;
type Params = Promise<{ season: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { q } = await resolveSeason((await params).season);
  return { title: "Teams", alternates: { canonical: `/teams${q}` } };
}

export function generateStaticParams() {
  return [{ season: "current" }];
}

export default async function Teams({ params }: { params: Params }) {
  const { season, seasons, current, q } = await resolveSeason((await params).season);
  const data = await readSeasonData(season);
  const lines = teamLines(data.shots);
  const teams = teamsFromShots(data.shots);
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Teams, {seasonLabel(season)}</h1>
        <QuerySelect label="Season" name="season" value={String(season)} options={seasonOptions(seasons)} basePath="/teams" defaults={{ season: String(current) }} />
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => {
          const line = lines.get(t.team_id);
          return (
            <li key={t.team_id}>
              <Link
                href={teamHref(t.team_id, q)}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 hover:border-accent"
              >
                <span aria-hidden className="h-10 w-2 shrink-0 rounded-sm ring-1 ring-muted" style={{ background: t.color }} />
                <span className="min-w-0 text-sm">
                  <span className="block font-display text-base font-bold">
                    {t.tricode} <span className="font-sans text-sm font-normal text-muted">{t.name}</span>
                  </span>
                  <span className="tabular-nums">
                    {fmtInt(line?.attempts)} FGA · {fmtPct(line?.fgPct)} FG · {fmtPct(line?.efgPct)} eFG
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
