"use client";

import Link from "next/link";
import { useState } from "react";
import { ACTIVE_DAYS, LEADER_LABELS, LEADER_METRICS, LEADER_WINDOWS, minAttempts, minThrees, type Boards, type LeaderMetric, type LeaderRow, type LeaderWindow } from "@/lib/data/leaders.ts";
import { fmtDate, fmtInt, fmtPct, fmtPts } from "@/lib/format.ts";
import { playerHref } from "@/lib/links.ts";

/** Nets rows shown below the top 15; the rest sit in a <details>. */
const NETS_SHOWN = 5;

// Fixed column widths (table-fixed) so the table inside the <details> lines up with the main one.
const W = { rank: "w-12", team: "w-16", value: "w-24", window: "w-24", season: "w-28", games: "w-36" };

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
      <td className={`${W.rank} py-1.5 pr-3 tabular-nums`}>{r.rank}</td>
      <td className="truncate py-1.5 pr-3">
        <Link href={playerHref(r.person_id, seasonQuery)} prefetch={false} className="underline decoration-muted/60 underline-offset-2 hover:decoration-accent">
          {r.name}
        </Link>
        {/* The Window column is hidden on phones; its end date still shows how current the row is. */}
        <span className="block text-xs font-normal text-muted md:hidden">last game {fmtDate(r.window.to)}</span>
      </td>
      <td className={`${W.team} py-1.5 pr-3 text-muted`}>{r.team}</td>
      <td className={`${W.value} py-1.5 pr-3 text-right tabular-nums`}>{value(r)}</td>
      <td className={`${W.window} hidden py-1.5 pr-3 text-right tabular-nums sm:table-cell`}>{detail(r)}</td>
      {metric === "improved" && <td className={`${W.season} hidden py-1.5 pr-3 text-right tabular-nums sm:table-cell`}>{fmtPct(r.seasonEfg)}</td>}
      <td className={`${W.games} hidden py-1.5 text-right text-muted tabular-nums md:table-cell`}>
        {fmtDate(r.window.from)} to {fmtDate(r.window.to)}
      </td>
    </tr>
  );
  const nets = board.also.slice(0, NETS_SHOWN);
  const moreNets = board.also.slice(NETS_SHOWN);
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
      <div className="flex flex-wrap gap-2" role="group" aria-label="Board">
        {LEADER_METRICS.map((m) => (
          <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)} className={button(metric === m)}>
            {LEADER_LABELS[m]}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">
        Each player&apos;s last {n} games with a field-goal attempt (a full {n}-game window), {minAttempts(n)}+ FGA in it
        {metric === "fg3Pct" ? ` and ${minThrees(n)}+ threes` : ""}.{" "}
        {metric === "improved" ? "Most improved: window eFG% minus his season eFG%. " : ""}
        Active shooters only: last game within {ACTIVE_DAYS} days of the season&apos;s latest game. {board.eligible} players qualify.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-line">
              <th scope="col" className={`${W.rank} py-2 pr-3 font-normal`}>#</th>
              <th scope="col" className="py-2 pr-3 font-normal">Player</th>
              <th scope="col" className={`${W.team} py-2 pr-3 font-normal`}>Team</th>
              <th scope="col" className={`${W.value} py-2 pr-3 text-right font-normal`}>{metric === "improved" ? "eFG% gain" : LEADER_LABELS[metric]}</th>
              <th scope="col" className={`${W.window} hidden py-2 pr-3 text-right font-normal sm:table-cell`}>{metric === "fg3Pct" ? "3P" : "FG"}</th>
              {metric === "improved" && (
                <th scope="col" className={`${W.season} hidden py-2 pr-3 text-right font-normal sm:table-cell`}>
                  Season eFG%
                </th>
              )}
              <th scope="col" className={`${W.games} hidden py-2 text-right font-normal md:table-cell`}>Window</th>
            </tr>
          </thead>
          <tbody>
            {board.rows.map(row)}
          </tbody>
        </table>
        {/* A heading between tables, not a colSpan row: a fixed-layout table would grow a column for it. */}
        {nets.length > 0 && (
          <>
            <p className="pt-3 pb-1 text-xs text-muted">Nets further down</p>
            <table className="w-full table-fixed text-sm">
              <tbody>{nets.map(row)}</tbody>
            </table>
          </>
        )}
      </div>
      {moreNets.length > 0 && (
        <details className="overflow-x-auto">
          <summary className="cursor-pointer text-sm text-accent">
            {moreNets.length} more Nets
          </summary>
          <table className="mt-1 w-full table-fixed text-sm">
            <tbody>{moreNets.map(row)}</tbody>
          </table>
        </details>
      )}
    </div>
  );
}
