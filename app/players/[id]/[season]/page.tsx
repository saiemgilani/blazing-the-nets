import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Dashboard } from "@/components/Dashboard.tsx";
import { Headshot } from "@/components/Headshot.tsx";
import { QuerySelect } from "@/components/QuerySelect.tsx";
import { listSeasons, parseSeason, seasonLabel } from "@/lib/data/seasons.ts";
import { NETS_TEAM_ID } from "@/lib/data/teams.ts";
import { fmtDec, fmtInt, fmtPct } from "@/lib/format.ts";
import { loadPlayerPage, readSeasonData, seasonOptions, teamRoster } from "@/lib/pageData.ts";

// Served at /players/<id>?season= (proxy.ts). The current season's Nets are prerendered; everyone
// else renders on first request and is cached for 6 h.
export const revalidate = 21600;

type Params = Promise<{ id: string; season: string }>;

export async function generateStaticParams() {
  const seasons = await listSeasons();
  const data = await readSeasonData(seasons[seasons.length - 1]);
  return teamRoster(data, NETS_TEAM_ID).map((p) => ({ id: String(p.person_id), season: "current" }));
}

async function resolve(params: Params) {
  const [{ id, season: param }, seasons] = await Promise.all([params, listSeasons()]);
  const season = parseSeason(param, seasons);
  const personId = Number(id);
  const page = Number.isSafeInteger(personId) ? await loadPlayerPage(season, personId) : null;
  return { page, season, seasons, isCurrent: season === seasons[seasons.length - 1] };
}

const publicPath = (id: number, season: number, isCurrent: boolean) => `/players/${id}${isCurrent ? "" : `?season=${season}`}`;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { page, season, isCurrent } = await resolve(params);
  // notFound() here runs before the page streams, so an unknown id is a real 404 despite loading.tsx.
  if (!page) notFound();
  const { player, line } = page;
  const label = seasonLabel(season);
  return {
    title: `${player.player_name}, ${label}`,
    description: `${player.player_name} (${page.teams.join(", ")}) ${label}: ${fmtInt(line.makes)}/${fmtInt(line.attempts)} FG, ${fmtPct(line.fgPct)} FG%, ${fmtPct(line.efgPct)} eFG%. Hex shot chart, shooting signature and distance and side splits against the league.`,
    alternates: { canonical: publicPath(player.person_id, season, isCurrent) },
  };
}

export default async function PlayerPage({ params }: { params: Params }) {
  const { page, season, seasons } = await resolve(params);
  if (!page) notFound();
  const { player, line, prev, next } = page;
  const stats = player.stats;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start gap-5">
        <Headshot src={page.headshot} name={player.player_name} size={140} />
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="font-display text-3xl font-bold">{player.player_name}</h1>
          <p className="text-muted">
            {page.teams.map((t, i) => (
              <span key={t}>
                {i > 0 && ", "}
                {t}
              </span>
            ))}{" "}
            · {seasonLabel(season)} regular season
          </p>
          <p className="tabular-nums">
            {fmtInt(line.makes)}/{fmtInt(line.attempts)} FG · {fmtPct(line.fgPct)} FG% · {fmtPct(line.efgPct)} eFG% ·{" "}
            {fmtPct(line.fg3Pct)} 3P% ({fmtInt(line.fg3m)}/{fmtInt(line.fg3a)})
          </p>
          {stats && (
            <p className="text-sm text-muted tabular-nums">
              {fmtInt(stats.gp)} GP · {fmtDec(stats.min)} MIN · {fmtPct(stats.usg_pct)} USG% · {fmtPct(stats.ts_pct)} TS% ·{" "}
              {fmtPct(stats.pie)} PIE
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <QuerySelect label="Season" name="season" value={String(season)} options={seasonOptions(seasons)} basePath={`/players/${player.person_id}`} />
            <Link href={`/teams/${player.team_id}?season=${season}`} className="text-sm text-accent hover:underline">
              {player.team_tricode} team page →
            </Link>
          </div>
        </div>
      </header>

      <Dashboard data={page.dashboard} subject={`${player.player_name} ${seasonLabel(season)}`} />

      <nav aria-label={`${player.team_tricode} players`} className="flex justify-between gap-4 text-sm">
        {prev ? (
          <Link href={`/players/${prev.person_id}?season=${season}`} className="text-accent hover:underline">
            ← {prev.player_name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/players/${next.person_id}?season=${season}`} className="text-accent hover:underline">
            {next.player_name} →
          </Link>
        )}
      </nav>
    </div>
  );
}
