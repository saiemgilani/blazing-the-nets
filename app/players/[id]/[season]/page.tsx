import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Headshot } from "@/components/Headshot.tsx";
import { PlayerExplorer } from "@/components/PlayerExplorer.tsx";
import { QuerySelect } from "@/components/QuerySelect.tsx";
import { RankLists } from "@/components/RankLists.tsx";
import { listSeasons, seasonLabel } from "@/lib/data/seasons.ts";
import { NETS_TEAM_ID } from "@/lib/data/teams.ts";
import { fmtDec, fmtInt, fmtPct } from "@/lib/format.ts";
import { playerHref, teamHref } from "@/lib/links.ts";
import { loadPlayerPage, readPlayerSeasons, readSeasonData, resolveSeason, seasonOptions, teamRoster } from "@/lib/pageData.ts";

// Served at /players/<id>?season= (proxy.ts). The current season's Nets are prerendered; everyone
// else renders on first request and is cached for 6 h.
export const revalidate = 21600;

type Params = Promise<{ id: string; season: string }>;

export async function generateStaticParams() {
  const seasons = await listSeasons();
  const data = await readSeasonData(seasons[seasons.length - 1]);
  return teamRoster(data, NETS_TEAM_ID).map((p) => ({ id: String(p.person_id), season: "current" }));
}

// Metadata and page both call this; resolveSeason and loadPlayerPage are cache()d, so the work runs once per request.
async function resolve(params: Params) {
  const { id, season: param } = await params;
  const resolved = await resolveSeason(param);
  const personId = Number(id);
  const page = Number.isSafeInteger(personId) ? await loadPlayerPage(resolved.season, personId) : null;
  return { ...resolved, page };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { page, season, q } = await resolve(params);
  // A real 404 comes from there being no loading.tsx above this route (a loading boundary flushes
  // a 200 shell first); notFound() here just keeps the metadata from describing a missing player.
  if (!page) notFound();
  const { player, line } = page;
  const label = seasonLabel(season);
  return {
    title: `${player.player_name}, ${label}`,
    description: `${player.player_name} (${page.teams.join(", ")}) ${label}: ${fmtInt(line.makes)}/${fmtInt(line.attempts)} FG, ${fmtPct(line.fgPct)} FG%, ${fmtPct(line.efgPct)} eFG%. Hex shot chart, shooting signature and distance and side splits against the league.`,
    alternates: { canonical: playerHref(player.person_id, q) },
  };
}

export default async function PlayerPage({ params }: { params: Params }) {
  // The season picker's index (cold: one shots file per season) builds alongside the page data.
  const seasonIndex = readPlayerSeasons().catch(() => null);
  const { page, season, seasons, current, q } = await resolve(params);
  if (!page) notFound();
  const { player, line, prev, next } = page;
  const stats = player.stats;
  // Only seasons he took a regular-season shot in (others would 404); all of them if the index fails.
  const index = await seasonIndex;
  const hisSeasons = index ? (index.get(player.person_id) ?? [season]) : seasons;
  const options = seasonOptions(seasons.filter((s) => hisSeasons.includes(s) || s === season));
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start gap-5">
        <Headshot src={page.headshot} name={player.player_name} size={140} />
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="font-display text-3xl font-bold">{player.player_name}</h1>
          <p className="text-muted">
            {page.teams.join(", ")} · {seasonLabel(season)} regular season
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
            <QuerySelect
              label="Season"
              name="season"
              value={String(season)}
              options={options}
              basePath={`/players/${player.person_id}`}
              defaults={{ season: String(current) }}
            />
            <Link href={teamHref(player.team_id, q)} className="text-sm text-accent underline-offset-2 hover:underline">
              {player.team_tricode} team page →
            </Link>
          </div>
        </div>
      </header>

      <nav aria-label="On this page" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="text-muted">On this page:</span>
        {[
          ["#ranks", "League ranks"],
          ...(page.explorer.games ? [["#games", "Games"]] : []),
          ["#charts", "Shot charts"],
          ...(page.explorer.games ? [["#rolling", "Rolling shooting"]] : []),
          ...(page.explorer.games ? [["#versus", "Versus each opponent"]] : []),
        ].map(([href, label]) => (
          <a key={href} href={href} className="text-accent underline-offset-2 hover:underline">
            {label}
          </a>
        ))}
      </nav>

      <RankLists ranks={page.ranks} personId={player.person_id} seasonQuery={q} />

      <PlayerExplorer data={page.explorer} subject={`${player.player_name} ${seasonLabel(season)}`} />

      {/* ponytail: prev/next walk his primary team's roster, not the list the reader came from. */}
      <nav aria-label={`${player.team_tricode} players`} className="flex justify-between gap-4 text-sm">
        {prev ? (
          <Link href={playerHref(prev.person_id, q)} className="text-accent underline-offset-2 hover:underline">
            ← {prev.player_name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={playerHref(next.person_id, q)} className="text-accent underline-offset-2 hover:underline">
            {next.player_name} →
          </Link>
        )}
      </nav>
    </div>
  );
}
