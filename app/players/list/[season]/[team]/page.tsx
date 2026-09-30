import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerTable } from "@/components/PlayerTable.tsx";
import { QuerySelect } from "@/components/QuerySelect.tsx";
import { listSeasons, parseSeason, seasonLabel } from "@/lib/data/seasons.ts";
import { teamsFromShots } from "@/lib/data/teams.ts";
import { seasonQuery, withParams } from "@/lib/links.ts";
import { playerRows, readSeasonData, seasonOptions, teamRoster } from "@/lib/pageData.ts";

// Served at /players?season=&team= (proxy.ts). team is a tricode or ALL; default BKN.
export const revalidate = 21600;
type Params = Promise<{ season: string; team: string }>;

async function resolve(params: Params) {
  const [{ season: param, team }, seasons] = await Promise.all([params, listSeasons()]);
  const season = parseSeason(param, seasons);
  const current = String(seasons[seasons.length - 1]);
  return { team, season, seasons, current, defaults: { season: current, team: "BKN" } };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { team, season, defaults } = await resolve(params);
  if (team !== "ALL") {
    const data = await readSeasonData(season);
    if (!teamsFromShots(data.shots).some((t) => t.tricode === team)) notFound();
  }
  return { title: "Players", alternates: { canonical: withParams("/players", { season: String(season), team }, defaults) } };
}

export function generateStaticParams() {
  return [{ season: "current", team: "BKN" }];
}

export default async function Players({ params }: { params: Params }) {
  const { team, season, seasons, current, defaults } = await resolve(params);
  const data = await readSeasonData(season);
  const teams = teamsFromShots(data.shots);
  const selected = team === "ALL" ? null : teams.find((t) => t.tricode === team);
  if (team !== "ALL" && !selected) notFound();
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
      <PlayerTable rows={rows} seasonQuery={seasonQuery(season, Number(current))} search />
    </div>
  );
}
