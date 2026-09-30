import { quantile } from "d3-array";
import { Delaunay } from "d3-delaunay";
import { hexbin } from "d3-hexbin";
import { scaleSqrt, type ScalePower } from "d3-scale";
import { pointer, select } from "d3-selection";
import type { HexVsLeague, Zone } from "../data/aggregate.ts";
import { toSvg, toSvgLength, type Viewport } from "../data/court.ts";
import { courtViewport, COURT_WIDTH, drawCourt } from "./court.ts";
import { diffColor, drawDiffLegend, fmtPct, fmtPts, motionMs, tooltip, TOKENS } from "./theme.ts";

export interface HexShotChartData {
  /** Player hexes from `hexesVsLeague`, legacy frame. */
  hexes: HexVsLeague[];
  /** Hex radius in tenths of a foot (the radius the hexes were binned with). */
  radius: number;
}

const LEGEND_H = 48;

export const HEX_VIEWBOX = { width: COURT_WIDTH, height: courtViewport().height + LEGEND_H };

export const ZONE_LABELS: Record<Zone, string> = {
  restricted_area: "Restricted area",
  paint: "Paint (non-RA)",
  mid_range: "Mid-range",
  corner_3_left: "Left corner 3",
  corner_3_right: "Right corner 3",
  above_break_3: "Above-the-break 3",
};

export interface HexMark {
  hex: HexVsLeague;
  cx: number;
  cy: number;
  r: number;
  fill: string;
}

/**
 * Pixel marks for the hexes inside the viewport: size is a sqrt scale of attempts capped at the
 * 95th percentile (so one busy rim hex does not shrink the rest), colour is FG% minus league FG%.
 */
export function layoutHexes(
  hexes: HexVsLeague[],
  radius: number,
  v: Viewport,
): { marks: HexMark[]; cap: number; size: ScalePower<number, number> } {
  const cap = Math.max(2, Math.ceil(quantile(hexes, 0.95, (h) => h.attempts) ?? 2));
  const size = scaleSqrt().domain([0, cap]).range([0, toSvgLength(radius, v)]).clamp(true);
  const marks = hexes
    .filter((h) => h.y <= v.top)
    .map((hex) => {
      const p = toSvg(hex, v);
      const diff = hex.fgPct !== null && hex.leagueFgPct !== null ? hex.fgPct - hex.leagueFgPct : null;
      return { hex, cx: p.x, cy: p.y, r: size(hex.attempts), fill: diffColor(diff) };
    })
    .sort((a, b) => a.hex.attempts - b.hex.attempts);
  return { marks, cap, size };
}

export function renderHexShotChart(svg: SVGSVGElement, data: HexShotChartData): () => void {
  const v = courtViewport();
  const root = select(svg).append("g");
  drawCourt(root, v);

  const { marks, cap, size } = layoutHexes(data.hexes, data.radius, v);
  const shape = hexbin();
  const ms = motionMs(500);
  const hexes = root
    .append("g")
    .selectAll("path")
    .data(marks)
    .join("path")
    .attr("transform", (m) => `translate(${m.cx},${m.cy})`)
    .attr("d", (m) => shape.hexagon(ms ? 0 : m.r))
    .style("fill", (m) => m.fill)
    .style("stroke", TOKENS.fg)
    .style("stroke-opacity", 0.25)
    .style("stroke-width", 0.5);
  if (ms) hexes.transition().duration(ms).attr("d", (m) => shape.hexagon(m.r));

  // Legend: hex sizes on the left, the colour scale on the right.
  const legend = root.append("g").attr("transform", `translate(0,${v.height + 6})`);
  const steps = [1, Math.max(2, Math.round(cap / 2)), cap];
  steps.forEach((n, i) => {
    const x = 24 + i * 34;
    legend
      .append("path")
      .attr("transform", `translate(${x},12)`)
      .attr("d", shape.hexagon(size(n)))
      .style("fill", TOKENS.muted);
    legend
      .append("text")
      .attr("x", x)
      .attr("y", 36)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", TOKENS.muted)
      .text(i === steps.length - 1 ? `${n}+` : String(n));
  });
  legend.append("text").attr("x", 126).attr("y", 16).style("font-size", "10px").style("fill", TOKENS.muted).text("attempts");
  drawDiffLegend(legend, COURT_WIDTH - 210, 4, 190);

  // Hover: nearest hex centre (Delaunay), within 18 px.
  const focus = root.append("path").style("fill", "none").style("stroke", TOKENS.fg).style("stroke-width", 1.5).style("display", "none");
  const tip = tooltip(root, v.width, v.height);
  const delaunay = Delaunay.from(marks, (m) => m.cx, (m) => m.cy);
  root
    .append("rect")
    .attr("width", v.width)
    .attr("height", v.height)
    .style("fill", "transparent")
    .on("pointermove", (event: PointerEvent) => {
      const [px, py] = pointer(event, root.node());
      const m = marks.length ? marks[delaunay.find(px, py)] : undefined;
      if (!m || Math.hypot(m.cx - px, m.cy - py) > 18) {
        focus.style("display", "none");
        tip.hide();
        return;
      }
      const h = m.hex;
      focus
        .style("display", null)
        .attr("transform", `translate(${m.cx},${m.cy})`)
        .attr("d", shape.hexagon(Math.max(m.r, 4)));
      tip.show(m.cx, m.cy, [
        ZONE_LABELS[h.zone],
        `${h.makes}/${h.attempts} FG, ${fmtPct(h.fgPct)}`,
        `League ${fmtPct(h.leagueFgPct)}` +
          (h.fgPct !== null && h.leagueFgPct !== null ? ` (${fmtPts(h.fgPct - h.leagueFgPct)})` : ""),
        `${h.meanDistance.toFixed(1)} ft`,
      ]);
    })
    .on("pointerleave", () => {
      focus.style("display", "none");
      tip.hide();
    });

  return () => {
    hexes.interrupt();
    root.remove();
  };
}
