"use client";

import { useCallback, useMemo, useState } from "react";
import { GameStrip } from "./charts/GameStrip.tsx";
import { RollingChart } from "./charts/RollingChart.tsx";
import { Timeline } from "./charts/Timeline.tsx";
import { VersusChart } from "./charts/VersusChart.tsx";
import { Card } from "./Card.tsx";
import { Dashboard } from "./Dashboard.tsx";
import { MobileCollapse } from "./MobileCollapse.tsx";
import { buildDashboard } from "@/lib/dashboard.ts";
import { rollingLines, shootingLine, versusOpponents } from "@/lib/data/aggregate.ts";
import { fmtDate, fmtInt, fmtPct } from "@/lib/format.ts";
import type { ExplorerData } from "@/lib/pageData.ts";
import {
  GAME_PRESETS,
  PRESET_LABELS,
  presetGames,
  shotsForGames,
  visibleGames,
  windowFromInputs,
  type DateWindow,
  type GamePreset,
} from "@/lib/selection.ts";

const WINDOWS = [5, 10, 20] as const;

const buttonClass = (active: boolean) =>
  `rounded border px-2.5 py-1 text-sm ${active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"}`;

const NO_GAMES = "No games selected: choose games above (a preset, single games or a date window) to draw this.";

/**
 * The player's season, filterable by game: preset and per-game selection, a date window (brushed or
 * typed), then every chart below rebuilt from the selected games: the six shot charts, the rolling
 * N-game line and the versus-opponent bars. All state is client-side; the server sends the shots,
 * the games and the league context once.
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
  const activePreset = games
    ? GAME_PRESETS.find((p) => {
        const ids = presetGames(games, p);
        return ids.length === selected.size && ids.every((id) => selected.has(id));
      })
    : undefined;

  const view = useMemo(() => (games ? visibleGames(games, selected, dateWindow) : null), [games, selected, dateWindow]);
  const shots = useMemo(() => (view ? shotsForGames(data.shots, new Set(view.map((g) => g.game_id))) : data.shots), [view, data.shots]);
  const dashboard = useMemo(() => buildDashboard(shots, data.league), [shots, data.league]);
  const rolling = useMemo(() => ({ points: view ? rollingLines(view, n) : [], seasonFgPct: data.seasonFgPct, n }), [view, n, data.seasonFgPct]);
  const versus = useMemo(() => (view ? { rows: versusOpponents(view), leagueFgPct: data.league.fgPct } : null), [view, data.league.fgPct]);
  const line = shootingLine(shots);
  const neutral = games ? games.filter((g) => g.venue === "neutral").length : 0;
  const empty = view !== null && view.length === 0;
  const first = games?.[0]?.date ?? "";
  const last = games?.[games.length - 1]?.date ?? "";
  const windowText = dateWindow ? `${fmtDate(dateWindow[0])} to ${fmtDate(dateWindow[1])}` : null;
  const caption = `${games && view ? `${view.length} of ${games.length} games${windowText ? `, ${windowText}` : ""}` : "Every game"}; league lines: full regular season.`;
  const dateField = (label: string, end: 0 | 1) => (
    <label className="inline-flex items-center gap-1.5 text-sm text-muted">
      {label}
      <input
        type="date"
        min={first}
        max={last}
        value={dateWindow?.[end] ?? ""}
        onChange={(e) => {
          const from = end === 0 ? e.target.value : (dateWindow?.[0] ?? "");
          const to = end === 1 ? e.target.value : (dateWindow?.[1] ?? "");
          setDateWindow(windowFromInputs(from, to, first, last));
        }}
        className="rounded border border-line bg-surface px-1.5 py-0.5 text-fg"
      />
    </label>
  );

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
            {neutral > 0 && (
              <span className="text-sm text-muted">
                {neutral} neutral-site game{neutral === 1 ? "" : "s"} (in neither Home nor Away)
              </span>
            )}
          </div>
          <p className="mb-2 text-sm tabular-nums" aria-live="polite">
            {view?.length ?? 0} of {games.length} games
            {windowText && ` · ${windowText}`} · {fmtInt(line.makes)}/{fmtInt(line.attempts)} FG, {fmtPct(line.fgPct)} FG%,{" "}
            {fmtPct(line.efgPct)} eFG%
          </p>
          <GameStrip data={{ games, seasonFgPct: data.seasonFgPct }} selected={selected} window={dateWindow} onToggle={toggle} title={`${subject} games`} />
          <div className="mb-1 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-muted">Drag across the timeline, or set the dates, to limit the charts to a date window.</p>
            <div role="group" aria-label="Date window" className="flex flex-wrap items-center gap-3">
              {dateField("From", 0)}
              {dateField("To", 1)}
              {dateWindow && (
                <button type="button" onClick={() => setDateWindow(null)} className={buttonClass(false)}>
                  Clear dates
                </button>
              )}
            </div>
          </div>
          <Timeline games={games} window={dateWindow} onBrush={setDateWindow} title={`${subject} game timeline (attempts per game)`} />
        </Card>
      ) : (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          Game-by-game views are unavailable for this season: the release&apos;s game logs do not cover every game this player shot in.
        </p>
      )}

      <div id="charts" className="scroll-mt-4 space-y-3">
        <p className="text-sm text-muted tabular-nums">{caption}</p>
        {empty ? <p className="rounded-lg border border-line bg-surface p-4 text-sm">{NO_GAMES}</p> : <Dashboard data={dashboard} subject={subject} />}
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
          {empty ? <p className="text-sm text-muted">{NO_GAMES}</p> : <RollingChart data={rolling} title={`${subject} rolling ${n}-game FG% and eFG%`} />}
        </Card>
      )}

      {versus && (
        <Card title="Versus each opponent" id="versus">
          {empty ? (
            <p className="text-sm text-muted">{NO_GAMES}</p>
          ) : (
            <MobileCollapse label={`Show ${versus.rows.length} opponents`}>
              <VersusChart data={versus} title={`${subject} attempts and FG% against each opponent`} />
            </MobileCollapse>
          )}
        </Card>
      )}
    </div>
  );
}
