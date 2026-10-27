"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompareSlot } from "./charts/HexShotChart.tsx";
import { compareShares, type PlayerGame } from "@/lib/data/aggregate.ts";
import type { ShotLite } from "@/lib/data/shots.ts";
import { HEX_RADIUS } from "@/lib/dashboard.ts";
import { fmtInt } from "@/lib/format.ts";
import { setQuery, useQueryParam } from "@/lib/urlState.ts";
import { compareParam, parseCompare } from "@/lib/viewParams.ts";

type Option = { value: string; label: string };
type Shooter = { id: number; name: string; team: string; fga: number };
type Side = { name: string; shots: ShotLite[] };

// One request per URL for the life of the page (the route is cached at the edge for 6 h anyway).
const requests = new Map<string, Promise<unknown>>();
function getJson<T>(url: string): Promise<T> {
  let p = requests.get(url);
  if (!p) {
    // A stalled request fails after 20 s (the server-side release reads use the same limit) instead of hanging.
    p = fetch(url, { signal: AbortSignal.timeout(20_000) }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))));
    p.catch(() => requests.delete(url)); // let a later pick retry
    requests.set(url, p);
  }
  return p as Promise<T>;
}

/**
 * The shot chart's compare view for a player page: the picker (home vs away from his own games,
 * another of his seasons, or another player in the same season) and the shared-grid shares. The
 * choice is the `compare=` param; the other side's shots come from /api/shots.
 */
export function useCompareSlot({
  personId,
  season,
  name,
  subject,
  seasons,
  shots,
  view,
}: {
  personId: number;
  season: number;
  /** The player's name, and name + season. */
  name: string;
  subject: string;
  /** His listed seasons (newest first), for "another season". */
  seasons: Option[];
  /** Side A: the shots of the selected games. */
  shots: ShotLite[];
  /** The selected games (null without game logs: no home/away split). */
  view: PlayerGame[] | null;
}): CompareSlot {
  const param = useQueryParam("compare");
  // Memoised on the string: a fresh object each render would recompute the shares and redraw the chart.
  const compare = useMemo(() => parseCompare(param), [param]);
  const active = useQueryParam("hex") === "compare";
  // Keyed by season and player, so the list never outlives the page it was loaded for; null = failed.
  const listKey = `${season}:${personId}`;
  const [list, setList] = useState<{ key: string; players: Shooter[] | null } | null>(null);
  const players = list?.key === listKey ? list.players : undefined;
  const [fetched, setFetched] = useState<{ url: string; side: Side | null } | null>(null);

  useEffect(() => {
    if (!active || players !== undefined) return;
    let live = true;
    getJson<{ players: Shooter[] }>(`/api/shots?season=${season}`).then(
      (r) => live && setList({ key: listKey, players: r.players.filter((p) => p.id !== personId) }),
      () => live && setList({ key: listKey, players: null }),
    );
    return () => {
      live = false;
    };
  }, [active, players, season, personId, listKey]);

  const url =
    compare?.kind === "player" ? `/api/shots?season=${season}&player=${compare.id}` : compare?.kind === "season" ? `/api/shots?season=${compare.season}&player=${personId}` : null;
  useEffect(() => {
    if (!active || !url) return;
    let live = true;
    getJson<{ name: string; shots: ShotLite[] }>(url).then(
      (r) => live && setFetched({ url, side: { name: r.name, shots: r.shots } }),
      () => live && setFetched({ url, side: null }),
    );
    return () => {
      live = false;
    };
  }, [active, url]);

  const sides = useMemo((): { a: Side; b: Side } | string | null => {
    if (!compare) return null;
    if (compare.kind === "split") {
      if (!view) return "Home vs away needs the game logs, which this season does not have for him.";
      const home = new Set(view.filter((g) => g.venue === "home").map((g) => g.game_id));
      const away = new Set(view.filter((g) => g.venue === "away").map((g) => g.game_id));
      if (!home.size || !away.size) return `The selected games have no ${home.size ? "away" : "home"} games; select some to compare home and away.`;
      return {
        a: { name: "home games", shots: shots.filter((s) => home.has(s.game_id)) },
        b: { name: "away games", shots: shots.filter((s) => away.has(s.game_id)) },
      };
    }
    if (!fetched || fetched.url !== url) return "Loading the other side…";
    if (!fetched.side) return "Could not load that comparison; pick another.";
    if (compare.kind === "season") {
      const label = seasons.find((o) => o.value === String(compare.season))?.label ?? String(compare.season);
      return { a: { name: subject, shots }, b: { name: `${fetched.side.name} ${label}`, shots: fetched.side.shots } };
    }
    return { a: { name, shots }, b: fetched.side };
  }, [compare, view, shots, fetched, url, seasons, subject, name]);

  const data = useMemo(() => {
    if (!sides || typeof sides === "string" || !sides.a.shots.length || !sides.b.shots.length) return null;
    return { hexes: compareShares(sides.a.shots, sides.b.shots, HEX_RADIUS), radius: HEX_RADIUS, nameA: sides.a.name, nameB: sides.b.name };
  }, [sides]);

  const status = !compare
    ? "Choose what to compare with: his home and away games, another of his seasons or another player this season."
    : typeof sides === "string"
      ? sides
      : sides && !data
        ? "One side has no shots in the selected games; select more games."
        : null;

  const otherSeasons = seasons.filter((o) => o.value !== String(season));
  const value = compare ? compareParam(compare) : "";
  const picker = (
    <label className="inline-flex flex-wrap items-center gap-2 text-sm text-muted">
      Compare with
      <select
        value={value}
        onChange={(e) => setQuery({ compare: e.target.value || null })}
        className="max-w-full rounded border border-line bg-surface px-2 py-1 text-fg"
      >
        <option value="">Choose…</option>
        {view && <option value="split:home-away">Home vs away games</option>}
        {otherSeasons.length > 0 && (
          <optgroup label="Another of his seasons">
            {otherSeasons.map((o) => (
              <option key={o.value} value={`season:${o.value}`}>
                {o.label}
              </option>
            ))}
          </optgroup>
        )}
        <optgroup label="Another player, same season">
          {compare?.kind === "player" && !players?.some((p) => p.id === compare.id) && <option value={value}>{players ? "(not a shooter this season)" : players === null ? "Could not load the players" : "Loading players…"}</option>}
          {players === null && <option disabled>Could not load the players (reload the page to retry)</option>}
          {(players ?? []).map((p) => (
            <option key={p.id} value={`player:${p.id}`}>
              {p.name} ({p.team}, {fmtInt(p.fga)} FGA)
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
  return { picker, data, status };
}
