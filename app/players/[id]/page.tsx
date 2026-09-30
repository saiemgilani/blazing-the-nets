import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Court } from "@/components/charts/Court.tsx";
import { DistanceBars } from "@/components/charts/DistanceBars.tsx";
import { HexShotChart } from "@/components/charts/HexShotChart.tsx";
import { ShootingSignature } from "@/components/charts/ShootingSignature.tsx";
import { SideChart } from "@/components/charts/SideChart.tsx";
import { fgPctByDistance, hexesVsLeague, statsBySide, vsLeague } from "@/lib/data/aggregate.ts";
import { readPlayers } from "@/lib/data/players.ts";
import { listSeasons, seasonLabel } from "@/lib/data/seasons.ts";
import { readShots } from "@/lib/data/shots.ts";

// ponytail: temporary 2b harness for the six charts; Phase 2c replaces it with the real page.
const HEX_RADIUS = 15; // tenths of a foot
const BAR_BIN_FT = 3;

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const [{ id }, { season: seasonParam }, seasons] = await Promise.all([params, searchParams, listSeasons()]);
  const season = Number(seasonParam ?? seasons[seasons.length - 1]);
  const personId = Number(id);
  if (!Number.isInteger(personId) || !seasons.includes(season)) notFound();

  const [league, players] = await Promise.all([readShots(season), readPlayers(season)]);
  const mine = league.filter((s) => s.person_id === personId);
  const player = players.find((p) => p.person_id === personId);
  if (mine.length === 0 || !player) notFound();

  const hex = { hexes: hexesVsLeague(mine, league, HEX_RADIUS), radius: HEX_RADIUS };
  const signature = vsLeague(fgPctByDistance(mine), fgPctByDistance(league));
  const bars = { player: fgPctByDistance(mine, BAR_BIN_FT), league: fgPctByDistance(league, BAR_BIN_FT), binFt: BAR_BIN_FT };
  const sides = { player: statsBySide(mine, BAR_BIN_FT), league: statsBySide(league, BAR_BIN_FT), binFt: BAR_BIN_FT };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{player.player_name}</h1>
        <p className="text-muted">
          {player.team_tricode} · {seasonLabel(season)} regular season · {player.makes}/{player.attempts} FG
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Shot chart">
          <HexShotChart data={hex} title={`${player.player_name} shot chart, ${seasonLabel(season)}`} />
        </Card>
        <Card title="Shooting signature">
          <ShootingSignature data={signature} title={`${player.player_name} FG% by distance vs league`} />
        </Card>
        <Card title="Shot proportion by distance">
          <DistanceBars data={bars} metric="share" title="Share of shots by distance, player and league" />
        </Card>
        <Card title="Field goal percentage by distance">
          <DistanceBars data={bars} metric="fgPct" title="FG% by distance, player and league" />
        </Card>
        <Card title="Shooting frequency by side">
          <SideChart data={sides} metric="share" title="Share of shots left, centre and right of the hoop" />
        </Card>
        <Card title="Field goal percentage by side">
          <SideChart data={sides} metric="fgPct" title="FG% left, centre and right of the hoop" />
        </Card>
        <Card title="Zones">
          <Court zones title="Court with the shot zones outlined" />
        </Card>
      </div>
    </div>
  );
}
