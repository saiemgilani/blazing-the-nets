"use client";

import Link from "next/link";
import { useState } from "react";
import { LEADER_LABELS, LEADER_METRICS, LEADER_WINDOWS, minAttempts, minThrees, type Boards, type LeaderMetric, type LeaderRow, type LeaderWindow } from "@/lib/data/leaders.ts";
import { fmtDate, fmtInt, fmtPct, fmtPts } from "@/lib/format.ts";
import { playerHref } from "@/lib/links.ts";

const button = (active: boolean) =>
  `rounded border px-2.5 py-1 text-sm ${active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"}`;

/** Rolling-window leaderboards: pick the window and the board; the Nets are highlighted. */
export function Leaderboards({ boards, netsTeamId, seasonQuery }: { boards: Boards; netsTeamId: number; seasonQuery: string }) {
  const [n, setN] = useState<LeaderWindow>(10);
  const [metric, setMetric] = useState<LeaderMetric>("efgPct");
  const board = boards[n][metric];
  const value = (r: LeaderRow) => (metric === "improved" ? `${fmtPts(r.value)} pts` : fmtPct(r.value));
  const detail = (r: LeaderRow) =>
    metric === "fg3Pct" ? `${r.window.fg3m}/${r.window.fg3a} 3P` : `${fmtInt(r.window.makes)}/${fmtInt(r.window.attempts)} FG`;
  const row = (r: LeaderRow) => (
    <tr key={r.person_id} className={`border-b border-line/60 ${r.team_id === netsTeamId ? "font-bold text-accent" : ""}`}>
      <td className="py-1.5 pr-3 tabular-nums">{r.rank}</td>
      <td className="py-1.5 pr-3">
        <Link href={playerHref(r.person_id, seasonQuery)} prefetch={false} className="underline decoration-muted/60 underline-offset-2 hover:decoration-accent">
          {r.name}
        </Link>
      </td>
      <td className="py-1.5 pr-3 text-muted">{r.team}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums">{value(r)}</td>
      <td className="hidden py-1.5 pr-3 text-right tabular-nums sm:table-cell">{detail(r)}</td>
      {metric === "improved" && <td className="hidden py-1.5 pr-3 text-right tabular-nums sm:table-cell">{fmtPct(r.seasonEfg)}</td>}
      <td className="hidden py-1.5 text-right text-muted tabular-nums md:table-cell">
        {fmtDate(r.window.from)} to {fmtDate(r.window.to)}
      </td>
    </tr>
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Window">
        <span className="text-sm text-muted">Last</span>
        {LEADER_WINDOWS.map((w) => (
          <button key={w} type="button" aria-pressed={n === w} onClick={() => setN(w)} className={button(n === w)}>
            {w} games
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Board">
        {LEADER_METRICS.map((m) => (
          <button key={m} type="button" role="tab" aria-selected={metric === m} onClick={() => setMetric(m)} className={button(metric === m)}>
            {LEADER_LABELS[m]}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">
        Each player&apos;s latest {n} games (a full {n}-game window), {minAttempts(n)}+ FGA in it
        {metric === "fg3Pct" ? ` and ${minThrees(n)}+ threes` : ""}.{" "}
        {metric === "improved" ? "Most improved: window eFG% minus his season eFG%. " : ""}
        {board.eligible} players qualify.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 font-normal">#</th>
              <th scope="col" className="py-2 pr-3 font-normal">Player</th>
              <th scope="col" className="py-2 pr-3 font-normal">Team</th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">{metric === "improved" ? "eFG% gain" : LEADER_LABELS[metric]}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-normal sm:table-cell">Window</th>
              {metric === "improved" && (
                <th scope="col" className="hidden py-2 pr-3 text-right font-normal sm:table-cell">
                  Season eFG%
                </th>
              )}
              <th scope="col" className="hidden py-2 text-right font-normal md:table-cell">Games</th>
            </tr>
          </thead>
          <tbody>
            {board.rows.map(row)}
            {board.also.length > 0 && (
              <tr>
                <td colSpan={7} className="pt-3 pb-1 text-xs text-muted">
                  Nets further down
                </td>
              </tr>
            )}
            {board.also.map(row)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
