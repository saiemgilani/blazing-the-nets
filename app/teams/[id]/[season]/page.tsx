import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card.tsx";
import { Dashboard } from "@/components/Dashboard.tsx";
import { PlayerTable } from "@/components/PlayerTable.tsx";
import { QuerySelect } from "@/components/QuerySelect.tsx";
import { listSeasons, parseSeason, seasonLabel } from "@/lib/data/seasons.ts";
import { TEAMS } from "@/lib/data/teams.ts";
import { fmtInt, fmtPct } from "@/lib/format.ts";
import { seasonQuery, teamHref } from "@/lib/links.ts";
import { loadTeamPage, playerRows, seasonOptions } from "@/lib/pageData.ts";

// Served at /teams/<id>?season= (proxy.ts). All 30 teams are prerendered for the current season.
export const revalidate = 21600;

type Params = Promise<{ id: string; season: string }>;

export function generateStaticParams() {
  return TEAMS.map((t) => ({ id: String(t.team_id), season: "current" }));
}

async function resolve(params: Params) {
  const [{ id, season: param }, seasons] = await Promise.all([params, listSeasons()]);
  const season = parseSeason(param, seasons);
  const teamId = Number(id);
  const page = Number.isSafeInteger(teamId) ? await loadTeamPage(season, teamId) : null;
  const current = seasons[seasons.length - 1];
  return { page, season, seasons, current, q: seasonQuery(season, current) };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { page, season, q } = await resolve(params);
  // The real 404 comes from there being no loading.tsx above this route; this keeps the metadata honest.
  if (!page) notFound();
  const label = seasonLabel(season);
  return {
    title: `${page.team.name}, ${label}`,
    description: `${page.team.name} ${label} shooting: ${fmtPct(page.line.fgPct)} FG%, ${fmtPct(page.line.efgPct)} eFG% on ${fmtInt(page.line.attempts)} attempts, charted against the league.`,
    alternates: { canonical: teamHref(page.team.team_id, q) },
  };
}

export default async function TeamPage({ params }: { params: Params }) {
  const { page, season, seasons, current, q } = await resolve(params);
  if (!page) notFound();
  const { team, line } = page;
  return (
    <div className="space-y-6">
      <header className="flex items-stretch gap-4">
        <span aria-hidden className="w-2 shrink-0 rounded-sm ring-1 ring-muted" style={{ background: team.color }} />
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold">
            {team.tricode} <span className="font-normal">{team.name}</span>
          </h1>
          <p className="text-muted">{seasonLabel(season)} regular season</p>
          <p className="tabular-nums">
            {fmtInt(line.makes)}/{fmtInt(line.attempts)} FG · {fmtPct(line.fgPct)} FG% · {fmtPct(line.efgPct)} eFG% ·{" "}
            {fmtPct(line.fg3Pct)} 3P%
          </p>
          <QuerySelect
            label="Season"
            name="season"
            value={String(season)}
            options={seasonOptions(seasons)}
            basePath={`/teams/${team.team_id}`}
            defaults={{ season: String(current) }}
          />
        </div>
      </header>
      <Dashboard data={page.dashboard} subject={`${team.name} ${seasonLabel(season)}`} subjectLabel="Team" />
      <Card title="Roster by attempts">
        <PlayerTable rows={playerRows(page.roster)} seasonQuery={q} />
      </Card>
    </div>
  );
}
