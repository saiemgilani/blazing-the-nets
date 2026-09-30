import { max } from "d3-array";
import { scaleLinear } from "d3-scale";
import { pointer, select } from "d3-selection";
import { area, curveMonotoneX, line } from "d3-shape";
import type { DistanceVsLeague } from "../data/aggregate.ts";
import { diffColor, drawDiffLegend, fmtPct, fmtPts, motionMs, TOKENS, uniqueId } from "./theme.ts";

/** 1-ft bins 0..35 from `vsLeague(fgPctByDistance(player), fgPctByDistance(league))`. */
export type ShootingSignatureData = DistanceVsLeague[];

export const SIGNATURE_VIEWBOX = { width: 500, height: 300 };
const M = { top: 28, right: 12, bottom: 78, left: 36 };
const MAX_HALF = 20; // px half-width of the ribbon at the busiest distance
const STEP = 0.25; // ft between sampled points

/** Gaussian kernel smoothing; with `weights` it is a weighted local mean (empty bins do not pull to 0). */
export function kernelSmooth(values: number[], weights: number[] | null, sigma: number): number[] {
  const reach = Math.ceil(sigma * 3);
  return values.map((_, i) => {
    let num = 0;
    let den = 0;
    for (let j = Math.max(0, i - reach); j <= Math.min(values.length - 1, i + reach); j++) {
      const k = Math.exp(-((i - j) ** 2) / (2 * sigma * sigma)) * (weights ? weights[j] : 1);
      num += k * values[j];
      den += k;
    }
    return den > 0 ? num / den : 0;
  });
}

export interface SignaturePoint {
  distance: number;
  fgPct: number;
  leagueFgPct: number | null;
  share: number;
  diff: number | null;
  /** Smoothed attempts per foot; the ribbon is only drawn where this reaches MIN_SUPPORT. */
  support: number;
}

/** Below ~a quarter of an attempt per foot the smoothed FG% is noise (or an empty range read as 0%). */
export const MIN_SUPPORT = 0.25;

/** Smoothed FG%, league FG% and shot share every 0.25 ft, linearly interpolated between bins. */
export function signaturePoints(bins: ShootingSignatureData): SignaturePoint[] {
  const fg = kernelSmooth(bins.map((b) => b.fgPct ?? 0), bins.map((b) => b.attempts), 0.9);
  const share = kernelSmooth(bins.map((b) => b.share), null, 1);
  const support = kernelSmooth(bins.map((b) => b.attempts), null, 0.9);
  const league = kernelSmooth(bins.map((b) => b.leagueFgPct ?? 0), bins.map((b) => (b.leagueFgPct === null ? 0 : 1)), 0.6);
  const hasLeague = bins.map((b) => b.leagueFgPct !== null);
  const last = bins.length - 1;
  const lerp = (a: number[], d: number) => {
    const i = Math.min(Math.floor(d), last);
    const j = Math.min(i + 1, last);
    return a[i] + (a[j] - a[i]) * (d - i);
  };
  return Array.from({ length: Math.round(last / STEP) + 1 }, (_, k) => {
    const d = k * STEP;
    const fgPct = lerp(fg, d);
    const leagueFgPct = hasLeague[Math.min(Math.round(d), last)] ? lerp(league, d) : null;
    return { distance: d, fgPct, leagueFgPct, share: lerp(share, d), diff: leagueFgPct === null ? null : fgPct - leagueFgPct, support: lerp(support, d) };
  });
}

export function renderShootingSignature(svg: SVGSVGElement, data: ShootingSignatureData): () => void {
  const { width: W, height: H } = SIGNATURE_VIEWBOX;
  const root = select(svg).append("g");
  const points = signaturePoints(data);
  const maxFt = data.length - 1;
  const x = scaleLinear().domain([0, maxFt]).range([M.left, W - M.right]);
  const y = scaleLinear().domain([0, 1]).range([H - M.bottom, M.top]).clamp(true);
  const maxShare = max(points, (p) => p.share) || 1;
  const half = (p: SignaturePoint) => Math.max((p.share / maxShare) * MAX_HALF, 0.75);

  // Grid and axes, drawn by hand (no d3-axis in the dependency set).
  const axes = root.append("g").style("font-size", "10px").style("fill", TOKENS.muted);
  axes
    .selectAll("line.grid")
    .data([0, 0.25, 0.5, 0.75, 1])
    .join("line")
    .attr("class", "grid")
    .attr("x1", M.left)
    .attr("x2", W - M.right)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .style("stroke", TOKENS.line);
  axes
    .selectAll("text.y")
    .data([0, 0.25, 0.5, 0.75, 1])
    .join("text")
    .attr("class", "y")
    .attr("x", M.left - 6)
    .attr("y", (d) => y(d) + 3)
    .attr("text-anchor", "end")
    .text((d) => `${d * 100}%`);
  axes
    .selectAll("text.x")
    .data(x.ticks(7))
    .join("text")
    .attr("class", "x")
    .attr("x", (d) => x(d))
    .attr("y", H - M.bottom + 14)
    .attr("text-anchor", "middle")
    .text((d) => `${d} ft`);

  const gradient = uniqueId("bn-signature");
  root
    .append("defs")
    .append("linearGradient")
    .attr("id", gradient)
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", x(0))
    .attr("x2", x(maxFt))
    .selectAll("stop")
    .data(points.filter((_, i) => i % 2 === 0))
    .join("stop")
    .attr("offset", (p) => `${(p.distance / maxFt) * 100}%`)
    .attr("stop-color", (p) => diffColor(p.diff));

  const ribbon = root
    .append("path")
    .datum(points)
    .attr(
      "d",
      area<SignaturePoint>()
        .defined((p) => p.support >= MIN_SUPPORT)
        .x((p) => x(p.distance))
        .y0((p) => y(p.fgPct) + half(p))
        .y1((p) => y(p.fgPct) - half(p))
        .curve(curveMonotoneX),
    )
    .style("fill", `url(#${gradient})`)
    .style("stroke", TOKENS.fg)
    .style("stroke-opacity", 0.2)
    .style("stroke-width", 0.5);
  const ms = motionMs(600);
  if (ms) ribbon.style("opacity", 0).transition().duration(ms).style("opacity", 1);

  root
    .append("path")
    .datum(points)
    .attr(
      "d",
      line<SignaturePoint>()
        .defined((p) => p.leagueFgPct !== null)
        .x((p) => x(p.distance))
        .y((p) => y(p.leagueFgPct ?? 0))
        .curve(curveMonotoneX),
    )
    .style("fill", "none")
    .style("stroke", TOKENS.muted)
    .style("stroke-width", 1)
    .style("stroke-dasharray", "3 3");
  const note = root
    .append("text")
    .attr("x", W - M.right)
    .attr("y", M.top - 8)
    .attr("text-anchor", "end")
    .style("font-size", "10px")
    .style("fill", TOKENS.muted)
    .text("- - league FG%   ribbon width = share of shots");

  // Cursor: vertical rule, a dot on the curve and a one-line readout.
  const cursor = root.append("g").style("display", "none").attr("pointer-events", "none");
  cursor.append("line").attr("y1", M.top).attr("y2", H - M.bottom).style("stroke", TOKENS.fg).style("stroke-opacity", 0.5);
  const dot = cursor.append("circle").attr("r", 3).style("fill", TOKENS.fg);
  const readout = root.append("text").attr("x", M.left).attr("y", M.top - 8).style("font-size", "11px").style("fill", TOKENS.fg);
  root
    .append("rect")
    .attr("x", M.left)
    .attr("y", M.top)
    .attr("width", W - M.left - M.right)
    .attr("height", H - M.top - M.bottom)
    .style("fill", "transparent")
    .on("pointermove", (event: PointerEvent) => {
      const [px] = pointer(event, root.node());
      const p = points[Math.max(0, Math.min(points.length - 1, Math.round(x.invert(px) / STEP)))];
      note.style("display", "none");
      cursor.style("display", null).attr("transform", `translate(${x(p.distance)},0)`);
      dot.attr("cy", y(p.fgPct)).attr("visibility", p.support >= MIN_SUPPORT ? "visible" : "hidden");
      readout.text(
        `${p.distance.toFixed(1)} ft: ${fmtPct(p.fgPct)} vs league ${fmtPct(p.leagueFgPct)}` +
          (p.diff === null ? "" : ` (${fmtPts(p.diff)})`) +
          `, ${fmtPct(p.share)} of shots per ft`,
      );
    })
    .on("pointerleave", () => {
      cursor.style("display", "none");
      readout.text("");
      note.style("display", null);
    });

  drawDiffLegend(root.append("g"), W / 2 - 110, H - M.bottom + 30, 220);

  return () => {
    ribbon.interrupt();
    root.remove();
  };
}
