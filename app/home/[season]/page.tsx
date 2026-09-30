import type { Metadata } from "next";
import Link from "next/link";
import { Headshot } from "@/components/Headshot.tsx";
import { QuerySelect } from "@/components/QuerySelect.tsx";
import { lineOf } from "@/lib/data/aggregate.ts";
import { readHeadshots } from "@/lib/data/rosters.ts";
import { listSeasons, parseSeason, seasonLabel } from "@/lib/data/seasons.ts";
import { NETS_TEAM_ID } from "@/lib/data/teams.ts";
import { fmtDec, fmtInt, fmtPct } from "@/lib/format.ts";
import { readSeasonData, seasonOptions, teamRoster } from "@/lib/pageData.ts";

// Served at / (proxy.ts rewrites /?season= here).
export const revalidate = 21600;
export const metadata: Metadata = { alternates: { canonical: "/" } };

export function generateStaticParams() {
  return [{ season: "current" }];
}

export default async function Home({ params }: { params: Promise<{ season: string }> }) {
  const [{ season: param }, seasons] = await Promise.all([params, listSeasons()]);
  const season = parseSeason(param, seasons);
  const data = await readSeasonData(season);
  const roster = teamRoster(data, NETS_TEAM_ID);
  const headshots = await readHeadshots(season, roster);
  const label = seasonLabel(season);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Where the Nets shoot, and how often it goes in.</h1>
        <p className="max-w-2xl text-muted">
          Hex shot charts, shooting signatures and distance and side splits for every Brooklyn Nets player, compared with
          the rest of the league, from stats.nba.com play-by-play.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <QuerySelect label="Season" name="season" value={String(season)} options={seasonOptions(seasons)} basePath="/" />
          <Link href={`/players?season=${season}`} className="text-sm text-accent hover:underline">
            All players →
          </Link>
          <Link href={`/teams?season=${season}`} className="text-sm text-accent hover:underline">
            All teams →
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">
          Brooklyn Nets, {label} <span className="text-base font-normal text-muted">regular season, by attempts</span>
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roster.map((p) => {
            const line = lineOf(p);
            return (
              <li key={p.person_id}>
                <Link
                  href={`/players/${p.person_id}?season=${season}`}
                  className="flex items-center gap-4 rounded-lg border border-line bg-surface p-3 hover:border-accent"
                >
                  <Headshot src={headshots.get(p.person_id) ?? null} name={p.player_name} size={88} />
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-display text-base font-bold">{p.player_name}</p>
                    <p className="tabular-nums">
                      {fmtInt(p.attempts)} FGA · {fmtPct(line.fgPct)} FG · {fmtPct(line.efgPct)} eFG
                    </p>
                    {p.stats && (
                      <p className="text-muted tabular-nums">
                        {fmtInt(p.stats.gp)} GP · {fmtDec(p.stats.min)} MIN
                        {p.statsScope === "all-teams" && <span> (season totals across teams)</span>}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
