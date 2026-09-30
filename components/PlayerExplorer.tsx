"use client";

import { useCallback, useMemo, useState } from "react";
import { GameStrip } from "./charts/GameStrip.tsx";
import { RollingChart } from "./charts/RollingChart.tsx";
import { Timeline } from "./charts/Timeline.tsx";
import { Card } from "./Card.tsx";
import { Dashboard } from "./Dashboard.tsx";
import { buildDashboard } from "@/lib/dashboard.ts";
import { rollingLines, shootingLine } from "@/lib/data/aggregate.ts";
import { fmtDate, fmtInt, fmtPct } from "@/lib/format.ts";
import type { ExplorerData } from "@/lib/pageData.ts";
import { GAME_PRESETS, PRESET_LABELS, presetGames, shotsForGames, visibleGames, type DateWindow, type GamePreset } from "@/lib/selection.ts";

const WINDOWS = [5, 10, 20] as const;

const buttonClass = (active: boolean) =>
  `rounded border px-2.5 py-1 text-sm ${active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"}`;

/**
 * The player's season, filterable by game: preset and per-game selection, a brushed date window,
 * the six charts rebuilt from the selected games' shots, and a rolling N-game line. All state is
 * client-side; the server sends the shots, the games and the league context once.
 */
export function PlayerExplorer({ data, subject }: { data: ExplorerData; subject: string }) {
  const games = data.games;
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(games?.map((g) => g.game_id) ?? []));
  const [dateWindow, setDateWindow] = useState<DateWindow>(null);
  const [n, setN] = useState<(typeof WINDOWS)[number]>(10);

  const toggle = useCallback(
    (gameId: string) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(gameId)) next.delete(gameId);
        else next.add(gameId);
        return next;
      }),
    [],
  );
  const choose = (preset: GamePreset) => games && setSelected(new Set(presetGames(games, preset)));
  const activePreset = games ? GAME_PRESETS.find((p) => {
    const ids = presetGames(games, p);
    return ids.length === selected.size && ids.every((id) => selected.has(id));
  }) : undefined;

  const view = useMemo(() => (games ? visibleGames(games, selected, dateWindow) : null), [games, selected, dateWindow]);
  const shots = useMemo(() => (view ? shotsForGames(data.shots, new Set(view.map((g) => g.game_id))) : data.shots), [view, data.shots]);
  const dashboard = useMemo(() => buildDashboard(shots, data.league), [shots, data.league]);
  const rolling = useMemo(() => ({ points: view ? rollingLines(view, n) : [], seasonFgPct: data.seasonFgPct, n }), [view, n, data.seasonFgPct]);
  const line = shootingLine(shots);
  const neutral = games ? games.filter((g) => g.venue === "neutral").length : 0;

  return (
    <div className="space-y-6">
      {games ? (
        <Card title="Games" id="games">
          <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Select games">
            {GAME_PRESETS.map((p) => (
              <button key={p} type="button" aria-pressed={activePreset === p} onClick={() => choose(p)} className={buttonClass(activePreset === p)}>
                {PRESET_LABELS[p]}
              </button>
            ))}
            {dateWindow && (
              <button type="button" onClick={() => setDateWindow(null)} className={buttonClass(false)}>
                Clear dates
              </button>
            )}
            {neutral > 0 && (
              <span className="text-sm text-muted">
                {neutral} neutral-site game{neutral === 1 ? "" : "s"} (in neither Home nor Away)
              </span>
            )}
          </div>
          <p className="mb-2 text-sm tabular-nums" aria-live="polite">
            {view?.length ?? 0} of {games.length} games
            {dateWindow && ` · ${fmtDate(dateWindow[0])} to ${fmtDate(dateWindow[1])}`} · {fmtInt(line.makes)}/{fmtInt(line.attempts)} FG,{" "}
            {fmtPct(line.fgPct)} FG%, {fmtPct(line.efgPct)} eFG%
          </p>
          <GameStrip data={{ games, seasonFgPct: data.seasonFgPct }} selected={selected} window={dateWindow} onToggle={toggle} title={`${subject} games`} />
          <p className="mb-1 mt-4 text-sm text-muted">Drag across the timeline to limit the charts to a date window.</p>
          <Timeline games={games} window={dateWindow} onBrush={setDateWindow} title={`${subject} game timeline (attempts per game)`} />
        </Card>
      ) : (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          Game-by-game views are unavailable for this season: the release&apos;s game logs do not cover every game this player shot in.
        </p>
      )}

      <div id="charts" className="scroll-mt-4">
        <Dashboard data={dashboard} subject={subject} />
      </div>

      {games && (
        <Card title="Rolling shooting" id="rolling">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted" role="group" aria-label="Rolling window">
            Window
            {WINDOWS.map((w) => (
              <button key={w} type="button" aria-pressed={n === w} onClick={() => setN(w)} className={buttonClass(n === w)}>
                {w} games
              </button>
            ))}
          </div>
          <RollingChart data={rolling} title={`${subject} rolling ${n}-game FG% and eFG%`} />
        </Card>
      )}
    </div>
  );
}
