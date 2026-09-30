"use client";

import Link from "next/link";
import { useState } from "react";
import { fmtDec, fmtInt, fmtPct, foldText } from "@/lib/format.ts";
import { playerHref } from "@/lib/links.ts";
import type { PlayerRow } from "@/lib/pageData.ts";

/** Hidden below the sm breakpoint so the table fits a phone without sideways scrolling. */
const WIDE = "hidden sm:table-cell";

/**
 * Players sorted by attempts, linking to their pages; with `search`, a text filter on the name.
 * `seasonQuery` is "" for the current season or "?season=YYYY". Links do not prefetch: a table can
 * hold 583 rows.
 */
export function PlayerTable({ rows, seasonQuery, search = false }: { rows: PlayerRow[]; seasonQuery: string; search?: boolean }) {
  const [q, setQ] = useState("");
  const shown = q ? rows.filter((r) => foldText(r.name).includes(foldText(q))) : rows;
  return (
    <div>
      {search && (
        <label className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          Filter
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="player name"
            className="w-56 rounded border border-line bg-surface px-2 py-1 text-fg"
          />
          <span>{shown.length} players</span>
        </label>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums sm:min-w-[34rem]">
          <thead className="text-left text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 font-normal">Player</th>
              <th scope="col" className={`${WIDE} py-2 pr-3 font-normal`}>Team</th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">FGA</th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">FG%</th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">eFG%</th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">3P%</th>
              <th scope="col" className={`${WIDE} py-2 pr-3 text-right font-normal`}>GP</th>
              <th scope="col" className={`${WIDE} py-2 text-right font-normal`}>MIN</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.person_id} className="border-b border-line/60">
                <td className="py-1.5 pr-3">
                  <Link
                    href={playerHref(r.person_id, seasonQuery)}
                    prefetch={false}
                    className="underline decoration-muted/60 underline-offset-2 hover:text-accent hover:decoration-accent"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className={`${WIDE} py-1.5 pr-3 text-muted`}>{r.team}</td>
                <td className="py-1.5 pr-3 text-right">{fmtInt(r.attempts)}</td>
                <td className="py-1.5 pr-3 text-right">{fmtPct(r.fgPct)}</td>
                <td className="py-1.5 pr-3 text-right">{fmtPct(r.efgPct)}</td>
                <td className="py-1.5 pr-3 text-right">{fmtPct(r.fg3Pct)}</td>
                <td className={`${WIDE} py-1.5 pr-3 text-right`} title={r.acrossTeams ? "season totals across teams" : undefined}>
                  {fmtInt(r.gp)}
                  {r.acrossTeams && "*"}
                </td>
                <td className={`${WIDE} py-1.5 text-right`}>{fmtDec(r.min)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.some((r) => r.acrossTeams) && <p className="mt-2 hidden text-xs text-muted sm:block">* GP and MIN are season totals across teams.</p>}
    </div>
  );
}
