import Link from "next/link";
import { RANK_MIN_FG3A, RANK_MIN_FGA, type RankEntry, type RankMetric, type RankSummary } from "@/lib/data/ranks.ts";
import { fmtInt, fmtPct } from "@/lib/format.ts";

const fmt = (metric: RankMetric, v: number) => (metric === "fga" ? fmtInt(v) : fmtPct(v));

const why: Record<RankMetric, string> = {
  fga: `under ${RANK_MIN_FGA} FGA`,
  fgPct: `under ${RANK_MIN_FGA} FGA`,
  efgPct: `under ${RANK_MIN_FGA} FGA`,
  fg3Pct: `under ${RANK_MIN_FGA} FGA or ${RANK_MIN_FG3A} 3PA`,
  tsPct: `under ${RANK_MIN_FGA} FGA or no season stats`,
};

/** Where the player sits league-wide on five shooting numbers, with each list's top five. */
export function RankLists({ ranks, personId, season }: { ranks: RankSummary[]; personId: number; season: number }) {
  const row = (r: RankEntry, metric: RankMetric) => (
    <li key={r.person_id} className={`flex justify-between gap-2 ${r.person_id === personId ? "font-bold text-accent" : ""}`}>
      <Link href={`/players/${r.person_id}?season=${season}`} className="truncate hover:underline">
        {r.rank}. {r.name}
      </Link>
      <span className="tabular-nums">{fmt(metric, r.value)}</span>
    </li>
  );
  return (
    <section aria-label="League ranks" className="space-y-2">
      <h2 className="font-display text-lg font-bold">League ranks</h2>
      <p className="text-sm text-muted">
        Among players with {RANK_MIN_FGA}+ field-goal attempts this regular season; season stats where the release has them, else
        play-by-play shots.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ranks.map((s) => (
          <li key={s.metric} className="rounded-lg border border-line bg-surface p-3 text-sm">
            <p className="text-muted">{s.label}</p>
            {s.me ? (
              <p className="font-display text-xl font-bold tabular-nums">
                #{s.me.rank} <span className="font-sans text-sm font-normal text-muted">of {s.of}</span>{" "}
                <span className="font-sans text-base">{fmt(s.metric, s.me.value)}</span>
              </p>
            ) : (
              <p className="text-muted">not ranked ({why[s.metric]})</p>
            )}
            <ol className="mt-2 space-y-0.5">
              {s.top.map((r) => row(r, s.metric))}
              {s.me && !s.top.some((r) => r.person_id === personId) && (
                <>
                  <li aria-hidden className="text-muted">
                    …
                  </li>
                  {row(s.me, s.metric)}
                </>
              )}
            </ol>
          </li>
        ))}
      </ul>
    </section>
  );
}
