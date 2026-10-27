"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameStrip } from "./charts/GameStrip.tsx";
import { RollingChart } from "./charts/RollingChart.tsx";
import { Timeline } from "./charts/Timeline.tsx";
import { VersusChart } from "./charts/VersusChart.tsx";
import { Card } from "./Card.tsx";
import { useCompareSlot } from "./ComparePicker.tsx";
import { Dashboard } from "./Dashboard.tsx";
import { MobileCollapse } from "./MobileCollapse.tsx";
import type { CardMeta } from "@/lib/charts/exportCard.ts";
import { buildDashboard } from "@/lib/dashboard.ts";
import { rollingLines, shootingLine } from "@/lib/data/aggregate.ts";
import { fmtDate, fmtInt, fmtPct } from "@/lib/format.ts";
import type { ExplorerData } from "@/lib/pageData.ts";
import { toggleClass } from "@/lib/ui.ts";
import { GAME_PRESETS, PRESET_LABELS, presetGames, selectedView, withTypedDate, type DateWindow, type GamePreset } from "@/lib/selection.ts";
import { setQuery, useQueryParam } from "@/lib/urlState.ts";
import { gamesParam, oneOf, parseGames, parseWindow, unlessDefault } from "@/lib/viewParams.ts";

const WINDOWS = [5, 10, 20] as const;

const NO_GAMES = "No games selected: choose games above (a preset, single games or a date window) to draw this.";

/** Who the page is about, for the compare picker and the export card. */
export interface ExplorerSubject {
  personId: number;
  season: number;
  name: string;
  /** His listed seasons, newest first. */
  seasons: { value: string; label: string }[];
  card: Omit<CardMeta, "filters">;
}

const setWindow = (w: DateWindow) => setQuery({ from: w?.[0] ?? null, to: w?.[1] ?? null });

/**
 * The player's season, filterable by game: preset and per-game selection, a date window (brushed or
 * typed), then every chart below rebuilt from the selected games: the six shot charts, the rolling
 * N-game line and the versus-opponent bars. The server sends the shots, the games and the league
 * context once; the selection, the window and every chart option live in the URL (lib/viewParams.ts).
 */
export function PlayerExplorer({ data, subject, who }: { data: ExplorerData; subject: string; who: ExplorerSubject }) {
  const games = data.games;
  const first = games?.[0]?.date ?? "";
  const last = games?.[games.length - 1]?.date ?? "";
  const gamesValue = useQueryParam("games");
  const selected = useMemo(() => parseGames(gamesValue, games ?? []), [gamesValue, games]);
  const fromValue = useQueryParam("from");
  const toValue = useQueryParam("to");
  const dateWindow = useMemo(() => parseWindow(fromValue, toValue, first, last), [fromValue, toValue, first, last]);
  const n = oneOf(WINDOWS, useQueryParam("roll"), 10);
  // What each date field shows while it has focus: Chromium reports every half-typed value
  // (0002-..., 0020-...), so the field keeps its own text and only a complete in-season date moves
  // the window; on blur it shows the window again.
  const [drafts, setDrafts] = useState<[string | null, string | null]>([null, null]);

  const setSelected = useCallback((next: ReadonlySet<string>) => games && setQuery({ games: gamesParam(next, games) }), [games]);
  // Stable for the strip's effect; reads the latest selection through the ref.
  const latest = useRef(selected);
  useEffect(() => {
    latest.current = selected;
  }, [selected]);
  const toggle = useCallback(
    (gameId: string) => {
      const next = new Set(latest.current);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      setSelected(next);
    },
    [setSelected],
  );
  const choose = (preset: GamePreset) => games && setSelected(new Set(presetGames(games, preset)));
  const activePreset = games
    ? GAME_PRESETS.find((p) => {
        const ids = presetGames(games, p);
        return ids.length === selected.size && ids.every((id) => selected.has(id));
      })
    : undefined;

  const { view, shots, versus } = useMemo(() => selectedView(data, selected, dateWindow), [data, selected, dateWindow]);
  const dashboard = useMemo(() => buildDashboard(shots, data.league), [shots, data.league]);
  const rolling = useMemo(() => ({ points: view ? rollingLines(view, n) : [], seasonFgPct: data.seasonFgPct, n }), [view, n, data.seasonFgPct]);
  const line = shootingLine(shots);
  const neutral = games ? games.filter((g) => g.venue === "neutral").length : 0;
  const empty = view !== null && view.length === 0;
  const windowText = dateWindow ? `${fmtDate(dateWindow[0])} to ${fmtDate(dateWindow[1])}` : null;
  const gamesText = games && view ? `${view.length} of ${games.length} games${windowText ? `, ${windowText}` : ""}` : "Every game";
  const caption = `${gamesText}; league lines: full regular season.`;
  const compare = useCompareSlot({ ...who, subject, shots, view });
  const card = useMemo(() => ({ ...who.card, filters: `Games: ${gamesText}` }), [who.card, gamesText]);
  const dateField = (label: string, end: 0 | 1) => (
    <label className="inline-flex items-center gap-1.5 text-sm text-muted">
      {label}
      <input
        type="date"
        min={first}
        max={last}
        value={drafts[end] ?? dateWindow?.[end] ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          setDrafts((d) => (end === 0 ? [value, d[1]] : [d[0], value]));
          const next = withTypedDate(dateWindow, end, value, first, last);
          if (next !== dateWindow) setWindow(next);
        }}
        onBlur={() => setDrafts((d) => (end === 0 ? [null, d[1]] : [d[0], null]))}
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
              <button key={p} type="button" aria-pressed={activePreset === p} onClick={() => choose(p)} className={toggleClass(activePreset === p)}>
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
                <button type="button" onClick={() => setWindow(null)} className={toggleClass(false)}>
                  Clear dates
                </button>
              )}
            </div>
          </div>
          <Timeline games={games} window={dateWindow} onBrush={setWindow} title={`${subject} game timeline (attempts per game)`} />
        </Card>
      ) : (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          Game-by-game views are unavailable for this season: the release&apos;s game logs do not cover every game this player shot in.
        </p>
      )}

      <div id="charts" className="scroll-mt-4 space-y-3">
        <p className="text-sm text-muted tabular-nums">{caption}</p>
        {empty ? <p className="rounded-lg border border-line bg-surface p-4 text-sm">{NO_GAMES}</p> : <Dashboard data={dashboard} subject={subject} card={card} compare={compare} />}
      </div>

      {games && (
        <Card title="Rolling shooting" id="rolling">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted" role="group" aria-label="Rolling window">
            Window
            {WINDOWS.map((w) => (
              <button key={w} type="button" aria-pressed={n === w} onClick={() => setQuery({ roll: unlessDefault(w, 10) })} className={toggleClass(n === w)}>
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
