"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Headshot } from "./Headshot.tsx";
import { fmtDec, fmtInt, fmtPct, foldText } from "@/lib/format.ts";
import { playerHref } from "@/lib/links.ts";
import type { RosterRow } from "@/lib/pageData.ts";
import { hotkey, sortRows, tableReducer } from "@/lib/table.ts";

type Mode = "pergame" | "totals";
type Photos = "photos" | "initials" | "none";

interface Column {
  key: string;
  group: "Volume" | "Shooting" | "Usage";
  label: (mode: Mode) => string;
  value: (r: RosterRow, mode: Mode) => number | null;
  fmt: (v: number | null) => string;
}

const pct = (v: number | null) => fmtPct(v);
const COLUMNS: Column[] = [
  { key: "gp", group: "Volume", label: () => "GP", value: (r) => r.gp, fmt: fmtInt },
  { key: "min", group: "Volume", label: (m) => (m === "pergame" ? "MIN/g" : "MIN"), value: (r, m) => (m === "pergame" ? r.minPg : r.minTotal), fmt: (v) => (v === null ? "n/a" : v > 99 ? fmtInt(v) : fmtDec(v)) },
  { key: "fga", group: "Volume", label: (m) => (m === "pergame" ? "FGA/g" : "FGA"), value: (r, m) => (m === "pergame" ? r.fgaPg : r.fga), fmt: (v) => (v === null ? "n/a" : Number.isInteger(v) ? fmtInt(v) : fmtDec(v)) },
  { key: "fgPct", group: "Shooting", label: () => "FG%", value: (r) => r.fgPct, fmt: pct },
  { key: "efgPct", group: "Shooting", label: () => "eFG%", value: (r) => r.efgPct, fmt: pct },
  { key: "fg3Pct", group: "Shooting", label: () => "3P%", value: (r) => r.fg3Pct, fmt: pct },
  { key: "tsPct", group: "Shooting", label: () => "TS%", value: (r) => r.tsPct, fmt: pct },
  { key: "rimPct", group: "Shooting", label: () => "Rim FG%", value: (r) => r.rimPct, fmt: pct },
  { key: "midPct", group: "Shooting", label: () => "Mid FG%", value: (r) => r.midPct, fmt: pct },
  { key: "fg3Rate", group: "Shooting", label: () => "3P rate", value: (r) => r.fg3Rate, fmt: pct },
  { key: "usgPct", group: "Usage", label: () => "USG%", value: (r) => r.usgPct, fmt: pct },
  { key: "pie", group: "Usage", label: () => "PIE", value: (r) => r.pie, fmt: pct },
];
const KEYS = COLUMNS.map((c) => c.key);
const GROUPS = ["Volume", "Shooting", "Usage"] as const;

const button = (active: boolean) =>
  `rounded border px-2 py-0.5 text-xs ${active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"}`;

/**
 * A databallr-style roster table: column groups, click or `s` to sort (aria-sort on the header),
 * j/k and h/l to move the focus, / to search, per game or totals, and a headshot column.
 */
export function RosterTable({ rows, seasonQuery }: { rows: RosterRow[]; seasonQuery: string }) {
  // row -1: no row is outlined until the first j/k (the first j lands on row 0).
  const [state, dispatch] = useReducer(tableReducer, { sortKey: "fga", sortDir: "desc", row: -1, col: KEYS.indexOf("fga") });
  const [mode, setMode] = useState<Mode>("totals");
  const [photos, setPhotos] = useState<Photos>("photos");
  const [filter, setFilter] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const table = useRef<HTMLTableElement>(null);

  const shown = useMemo(() => {
    const column = COLUMNS.find((c) => c.key === state.sortKey) ?? COLUMNS[0];
    const kept = filter ? rows.filter((r) => foldText(r.name).includes(foldText(filter))) : rows;
    return sortRows(kept, state.sortDir, (r) => column.value(r, mode));
  }, [rows, filter, state.sortKey, state.sortDir, mode]);

  // The cursor row's player link is the table's one tab stop (roving tabindex); j/k move real focus
  // along the links, so Enter opens the player and screen readers hear the name.
  const cursor = Math.min(Math.max(state.row, 0), shown.length - 1);

  useEffect(() => {
    // The filter shrank the list under the cursor: clamp it (a move of zero clamps).
    if (state.row > shown.length - 1) dispatch({ type: "move", dRow: 0, dCol: 0, rows: shown.length, cols: KEYS.length });
  }, [state.row, shown.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      const inTable = !!target && !!table.current?.contains(target);
      if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) {
        if (e.key === "Escape") target.blur();
        return;
      }
      // Keys typed on a button or on a link outside the table are that control's, not hotkeys.
      if (target && (target.tagName === "BUTTON" || (target.tagName === "A" && !inTable))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const action = hotkey(e.key, shown.length, KEYS);
      if (!action) return;
      e.preventDefault();
      if (action === "search") return search.current?.focus();
      if (action.type !== "move") return dispatch(action);
      // Move from the focused row if there is one (a re-sort moves it), else from the cursor.
      const focused = inTable ? Number(target?.closest("tr")?.dataset.row ?? NaN) : NaN;
      const move = { ...action, from: Number.isNaN(focused) ? state.row : focused };
      dispatch(move);
      if (move.dRow !== 0) {
        // Rows do not reorder on a move, so the next row's link is already in the DOM.
        const next = tableReducer(state, move).row;
        const link = table.current?.querySelector<HTMLAnchorElement>(`tr[data-row="${next}"] a`);
        link?.focus({ preventScroll: true });
        link?.scrollIntoView({ block: "nearest" });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shown.length, state]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <label className="inline-flex items-center gap-2">
          Filter
          <input
            ref={search}
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="player name (/)"
            className="w-44 rounded border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
        <div role="group" aria-label="Per game or totals" className="inline-flex gap-1">
          <button type="button" aria-pressed={mode === "pergame"} onClick={() => setMode("pergame")} className={button(mode === "pergame")}>
            Per game
          </button>
          <button type="button" aria-pressed={mode === "totals"} onClick={() => setMode("totals")} className={button(mode === "totals")}>
            Totals
          </button>
        </div>
        <div role="group" aria-label="Headshots" className="inline-flex gap-1">
          {(["photos", "initials", "none"] as const).map((p) => (
            <button key={p} type="button" aria-pressed={photos === p} onClick={() => setPhotos(p)} className={button(photos === p)}>
              {p === "photos" ? "Photos" : p === "initials" ? "Initials" : "None"}
            </button>
          ))}
        </div>
        <span className="hidden text-xs md:inline">Keys: j/k rows, Enter opens, h/l columns, s sort, / search</span>
      </div>
      <div className="overflow-x-auto">
        <table ref={table} className="w-full min-w-[56rem] text-xs tabular-nums">
          <thead className="text-muted">
            <tr>
              <td colSpan={photos === "none" ? 1 : 2} />
              {GROUPS.map((g) => (
                <th key={g} scope="colgroup" colSpan={COLUMNS.filter((c) => c.group === g).length} className="border-b border-line px-1 pb-1 text-center font-normal">
                  {g}
                </th>
              ))}
            </tr>
            <tr className="border-b border-line">
              {photos !== "none" && <th scope="col" className="w-10" aria-label="Headshot" />}
              <th scope="col" className="py-1.5 pr-2 text-left font-normal">
                Player
              </th>
              {COLUMNS.map((c, i) => {
                const sorted = state.sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={sorted ? (state.sortDir === "desc" ? "descending" : "ascending") : "none"}
                    className={`px-1 py-1.5 text-right font-normal ${state.col === i ? "text-fg underline decoration-accent underline-offset-4" : ""}`}
                  >
                    <button type="button" onClick={() => dispatch({ type: "sort", key: c.key })} className="hover:text-fg">
                      {c.label(mode)}
                      <span aria-hidden className="ml-0.5 inline-block w-2">
                        {sorted ? (state.sortDir === "desc" ? "▾" : "▴") : ""}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={r.person_id} data-row={i} className="border-b border-line/60 focus-within:bg-surface focus-within:outline focus-within:outline-1 focus-within:outline-accent">
                {photos !== "none" && (
                  <td className="py-1 pr-1">
                    <Headshot src={photos === "photos" ? r.headshot : null} name={r.name} size={36} decorative />
                  </td>
                )}
                <th scope="row" className="py-1 pr-2 text-left font-normal">
                  <Link
                    href={playerHref(r.person_id, seasonQuery)}
                    prefetch={false}
                    tabIndex={i === cursor ? 0 : -1}
                    className="underline decoration-muted/60 underline-offset-2 hover:decoration-accent focus:outline-none"
                  >
                    {r.name}
                  </Link>
                  {r.acrossTeams && (
                    <span title="GP, MIN, FGA/g, TS%, USG% and PIE are season totals across teams" className="text-muted">
                      *
                    </span>
                  )}
                </th>
                {COLUMNS.map((c, j) => (
                  <td key={c.key} className={`px-1 py-1 text-right ${state.col === j ? "text-fg" : ""}`}>
                    {c.fmt(c.value(r, mode))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        FGA and shooting splits count this team&apos;s shots; rim = restricted area, mid = mid-range, 3P rate = threes / FGA. * GP, MIN,
        FGA/g, TS%, USG% and PIE are season totals across teams.
      </p>
    </div>
  );
}
