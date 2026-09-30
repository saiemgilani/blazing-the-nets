import { max } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import type { DistanceBin } from "../data/aggregate.ts";
import { fmtPct, motionMs, tooltip, TOKENS } from "./theme.ts";

export type BarMetric = "share" | "fgPct";

/** `fgPctByDistance` for the player and for the league, same `binFt`. */
export interface DistanceBarsData {
  player: DistanceBin[];
  league: DistanceBin[];
  binFt: number;
}

export const DISTANCE_BARS_VIEWBOX = { width: 500, height: 250 };
const M = { top: 24, right: 8, bottom: 34, left: 38 };

export interface Bar {
  who: "player" | "league";
  x: number;
  width: number;
  y: number;
  height: number;
  value: number | null;
}

export interface BarGroup {
  label: string;
  x: number;
  width: number;
  bars: [Bar, Bar];
  player: DistanceBin;
  league: DistanceBin | undefined;
}

const valueOf = (b: DistanceBin | undefined, metric: BarMetric) => (b === undefined ? null : metric === "share" ? b.share : b.fgPct);

/** Grouped player/league bars per distance bin; FG% runs 0-100%, shares 0 to the largest share. */
export function barLayout(data: DistanceBarsData, metric: BarMetric): { groups: BarGroup[]; yMax: number } {
  const { width: W, height: H } = DISTANCE_BARS_VIEWBOX;
  const yMax =
    metric === "fgPct" ? 1 : (max([...data.player, ...data.league], (b) => b.share) ?? 0) * 1.1 || 0.1;
  const x = scaleBand<number>()
    .domain(data.player.map((_, i) => i))
    .range([M.left, W - M.right])
    .paddingInner(0.2);
  const inner = scaleBand<"player" | "league">().domain(["player", "league"]).range([0, x.bandwidth()]).padding(0.05);
  const y = scaleLinear().domain([0, yMax]).range([H - M.bottom, M.top]).clamp(true);
  const groups = data.player.map((player, i): BarGroup => {
    const league = data.league[i];
    const bar = (who: "player" | "league", b: DistanceBin | undefined): Bar => {
      const value = valueOf(b, metric);
      const top = y(value ?? 0);
      return { who, x: (x(i) ?? 0) + (inner(who) ?? 0), width: inner.bandwidth(), y: top, height: H - M.bottom - top, value };
    };
    const lo = player.distance;
    const hi = lo + data.binFt - 1;
    return {
      label: data.binFt === 1 ? `${lo}` : `${lo}-${hi}`,
      x: x(i) ?? 0,
      width: x.bandwidth(),
      bars: [bar("player", player), bar("league", league)],
      player,
      league,
    };
  });
  return { groups, yMax };
}

export function renderDistanceBars(svg: SVGSVGElement, data: DistanceBarsData, opts: { metric: BarMetric }): () => void {
  const { width: W, height: H } = DISTANCE_BARS_VIEWBOX;
  const root = select(svg).append("g");
  const { groups, yMax } = barLayout(data, opts.metric);
  const y = scaleLinear().domain([0, yMax]).range([H - M.bottom, M.top]);

  const axes = root.append("g").style("font-size", "10px").style("fill", TOKENS.muted);
  const ticks = y.ticks(4);
  axes
    .selectAll("line")
    .data(ticks)
    .join("line")
    .attr("x1", M.left)
    .attr("x2", W - M.right)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .style("stroke", TOKENS.line);
  axes
    .selectAll("text.y")
    .data(ticks)
    .join("text")
    .attr("class", "y")
    .attr("x", M.left - 6)
    .attr("y", (d) => y(d) + 3)
    .attr("text-anchor", "end")
    .text((d) => `${Math.round(d * 100)}%`);
  axes
    .selectAll("text.x")
    .data(groups.filter((_, i) => i % 2 === 0))
    .join("text")
    .attr("class", "x")
    .attr("x", (g) => g.x + g.width / 2)
    .attr("y", H - M.bottom + 13)
    .attr("text-anchor", "middle")
    .text((g) => g.label);
  axes
    .append("text")
    .attr("x", (M.left + W - M.right) / 2)
    .attr("y", H - 4)
    .attr("text-anchor", "middle")
    .text("shot distance (ft)");

  const legend = root.append("g").attr("transform", `translate(${W - M.right - 130},8)`).style("font-size", "10px");
  (["player", "league"] as const).forEach((who, i) => {
    legend.append("rect").attr("x", i * 66).attr("y", -7).attr("width", 9).attr("height", 9).style("fill", who === "player" ? TOKENS.accent : TOKENS.muted);
    legend.append("text").attr("x", i * 66 + 13).attr("y", 1).style("fill", TOKENS.muted).text(who === "player" ? "Player" : "League");
  });

  const ms = motionMs(400);
  const bars = root
    .append("g")
    .selectAll("rect")
    .data(groups.flatMap((g) => g.bars))
    .join("rect")
    .attr("x", (b) => b.x)
    .attr("width", (b) => b.width)
    .attr("y", (b) => (ms ? H - M.bottom : b.y))
    .attr("height", (b) => (ms ? 0 : b.height))
    .style("fill", (b) => (b.who === "player" ? TOKENS.accent : TOKENS.muted))
    .style("fill-opacity", (b) => (b.who === "player" ? 1 : 0.55));
  if (ms) bars.transition().duration(ms).attr("y", (b) => b.y).attr("height", (b) => b.height);

  const tip = tooltip(root, W, H);
  root
    .append("g")
    .selectAll("rect")
    .data(groups)
    .join("rect")
    .attr("x", (g) => g.x)
    .attr("width", (g) => g.width)
    .attr("y", M.top)
    .attr("height", H - M.top - M.bottom)
    .style("fill", "transparent")
    .on("pointerenter", (_, g) => {
      const line = (who: string, b: DistanceBin | undefined) =>
        b === undefined
          ? `${who}: n/a`
          : opts.metric === "share"
            ? `${who}: ${fmtPct(b.share)} of shots (${b.attempts})`
            : `${who}: ${fmtPct(b.fgPct)} (${b.makes}/${b.attempts})`;
      tip.show(g.x + g.width / 2, M.top + 30, [`${g.label} ft`, line("Player", g.player), line("League", g.league)]);
    })
    .on("pointerleave", () => tip.hide());

  return () => {
    bars.interrupt();
    root.remove();
  };
}
