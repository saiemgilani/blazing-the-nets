import type { Metadata } from "next";
import Link from "next/link";
import { Headshot } from "@/components/Headshot.tsx";
import { QuerySelect } from "@/components/QuerySelect.tsx";
import { lineOf } from "@/lib/data/aggregate.ts";
import { readHeadshots } from "@/lib/data/rosters.ts";
import { listSeasons, parseSeason, seasonLabel } from "@/lib/data/seasons.ts";
import { NETS_TEAM_ID } from "@/lib/data/teams.ts";
import { fmtDec, fmtInt, fmtPct } from "@/lib/format.ts";
import { playerHref, seasonQuery, withParams } from "@/lib/links.ts";
import { readSeasonData, seasonOptions, teamRoster } from "@/lib/pageData.ts";

// Served at / (proxy.ts rewrites /?season= here).
export const revalidate = 21600;
type Params = Promise<{ season: string }>;

async function resolve(params: Params) {
  const [{ season: param }, seasons] = await Promise.all([params, listSeasons()]);
  const season = parseSeason(param, seasons);
  const current = seasons[seasons.length - 1];
  return { season, seasons, current, q: seasonQuery(season, current) };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { q } = await resolve(params);
  return { alternates: { canonical: `/${q}` } };
}

export function generateStaticParams() {
  return [{ season: "current" }];
}

export default async function Home({ params }: { params: Params }) {
  const { season, seasons, current, q } = await resolve(params);
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
          <QuerySelect label="Season" name="season" value={String(season)} options={seasonOptions(seasons)} basePath="/" defaults={{ season: String(current) }} />
          <Link href={withParams("/players", { season: String(season) }, { season: String(current) })} className="text-sm text-accent underline-offset-2 hover:underline">
            All players →
          </Link>
          <Link href={withParams("/teams", { season: String(season) }, { season: String(current) })} className="text-sm text-accent underline-offset-2 hover:underline">
            All teams →
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">
          Brooklyn Nets, {label} <span className="text-base font-normal text-muted">regular season, by attempts</span>
        </h2>
        {roster.length === 0 && (
          <p className="text-muted">No Nets regular-season shots in {label} yet; the charts fill in after their first game.</p>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roster.map((p) => {
            const line = lineOf(p);
            return (
              <li key={p.person_id}>
                <Link
                  href={playerHref(p.person_id, q)}
                  className="flex items-center gap-4 rounded-lg border border-line bg-surface p-3 hover:border-accent"
                >
                  <Headshot src={headshots.get(p.person_id) ?? null} name={p.player_name} size={88} decorative />
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
