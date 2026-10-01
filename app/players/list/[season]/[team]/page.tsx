import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerTable } from "@/components/PlayerTable.tsx";
import { QuerySelect } from "@/components/QuerySelect.tsx";
import { seasonLabel } from "@/lib/data/seasons.ts";
import { franchiseOf, teamsFromShots } from "@/lib/data/teams.ts";
import { withParams } from "@/lib/links.ts";
import { playerRows, readSeasonData, resolveSeason, seasonOptions, teamRoster } from "@/lib/pageData.ts";
import { netsTricode } from "@/lib/seasonRange.ts";

// Served at /players?season=&team= (proxy.ts). team is a tricode or ALL; default the season's Nets (BKN or NJN).
export const revalidate = 21600;
type Params = Promise<{ season: string; team: string }>;

/**
 * The season, its teams and the selected one. A tricode the season does not use but its franchise
 * did in another season (NJN in 2020, SEA in 2010) selects that franchise, so switching seasons from
 * a relocated team's list does not 404. Unknown tricodes -> notFound().
 */
async function resolve(params: Params) {
  const { season: param, team } = await params;
  const { season, seasons, current, q } = await resolveSeason(param);
  const data = await readSeasonData(season);
  const teams = teamsFromShots(data.shots, season);
  const selected = team === "ALL" ? null : (teams.find((t) => t.tricode === team) ?? teams.find((t) => t.team_id === franchiseOf(team)));
  if (selected === undefined) notFound();
  const defaults = { season: String(current), team: netsTricode(season) };
  return { data, teams, selected, team: selected?.tricode ?? "ALL", season, seasons, q, defaults };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { team, season, defaults } = await resolve(params);
  return { title: "Players", alternates: { canonical: withParams("/players", { season: String(season), team }, defaults) } };
}

export function generateStaticParams() {
  return [{ season: "current", team: "BKN" }];
}

export default async function Players({ params }: { params: Params }) {
  const { data, teams, selected, team, season, seasons, defaults, q } = await resolve(params);
  const rows = playerRows(selected ? teamRoster(data, selected.team_id) : data.players);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Players, {seasonLabel(season)}</h1>
        <div className="flex flex-wrap gap-4">
          <QuerySelect label="Season" name="season" value={String(season)} options={seasonOptions(seasons)} basePath="/players" params={{ team }} defaults={defaults} />
          <QuerySelect
            label="Team"
            name="team"
            value={team}
            options={[{ value: "ALL", label: "All teams" }, ...teams.map((t) => ({ value: t.tricode, label: `${t.tricode} · ${t.name}` }))]}
            basePath="/players"
            params={{ season: String(season) }}
            defaults={defaults}
          />
        </div>
        <p className="text-sm text-muted">Regular season field-goal attempts from play-by-play; FGA, FG%, eFG% and 3P% count the selected team only.</p>
      </header>
      <PlayerTable rows={rows} seasonQuery={q} search />
    </div>
  );
}
