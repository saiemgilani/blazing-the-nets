import { scaleDiverging } from "d3-scale";
import { interpolateRdBu } from "d3-scale-chromatic";
import type { Selection } from "d3-selection";
import "d3-transition";

export type G = Selection<SVGGElement, unknown, null, undefined>;

/** Chart chrome follows the Tailwind tokens in app/globals.css, so light and dark both work. */
export const TOKENS = {
  bg: "var(--bg)",
  surface: "var(--surface)",
  fg: "var(--fg)",
  muted: "var(--muted)",
  line: "var(--line)",
  accent: "var(--accent)",
} as const;

/** FG% minus league FG% saturates at +/-15 points. */
export const DIFF_DOMAIN = 0.15;

// ponytail: one place to flip the palette. RdBu reversed = above league red, below league blue.
// The 2021 site ran the other way: red below league, green above (public/hex-shotchart.png).
const diffScale = scaleDiverging<string>((t) => interpolateRdBu(1 - t))
  .domain([-DIFF_DOMAIN, 0, DIFF_DOMAIN])
  .clamp(true);

/** Colour for a FG% difference (fraction); null (no league figure) is the muted token. */
export function diffColor(diff: number | null): string {
  return diff === null ? TOKENS.muted : diffScale(diff);
}

/** Transition length, 0 when the viewer asked for reduced motion (or outside a browser). */
export function motionMs(ms: number): number {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return 0;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
}

export const fmtPct = (v: number | null, digits = 1) => (v === null ? "n/a" : `${(v * 100).toFixed(digits)}%`);

/** Signed percentage points, e.g. +4.2. */
export const fmtPts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(1)}`;

let nextId = 0;
/** Unique ids for gradient defs; charts only render in the browser, so no SSR id clash. */
export const uniqueId = (prefix: string) => `${prefix}-${++nextId}`;

/** Horizontal FG%-vs-league legend: a gradient bar with -15 / 0 / +15 ticks and a caption. */
export function drawDiffLegend(g: G, x: number, y: number, width: number): void {
  const id = uniqueId("bn-diff");
  const grad = g.append("defs").append("linearGradient").attr("id", id);
  grad
    .selectAll("stop")
    .data([0, 0.25, 0.5, 0.75, 1])
    .join("stop")
    .attr("offset", (t) => `${t * 100}%`)
    .attr("stop-color", (t) => diffColor((t * 2 - 1) * DIFF_DOMAIN));
  g.append("rect").attr("x", x).attr("y", y).attr("width", width).attr("height", 8).attr("rx", 2).style("fill", `url(#${id})`);
  g.selectAll("text.tick")
    .data([-DIFF_DOMAIN, 0, DIFF_DOMAIN])
    .join("text")
    .attr("class", "tick")
    .attr("x", (d) => x + ((d + DIFF_DOMAIN) / (2 * DIFF_DOMAIN)) * width)
    .attr("y", y + 20)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", TOKENS.muted)
    .text((d) => (d === 0 ? "0" : fmtPts(d)));
  g.append("text")
    .attr("x", x + width / 2)
    .attr("y", y + 33)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", TOKENS.muted)
    .text("FG% vs league (points)");
}

/** An in-SVG tooltip: a surface-coloured box of text lines, kept inside `width` x `height`. */
export function tooltip(parent: G, width: number, height: number) {
  const g = parent.append("g").attr("pointer-events", "none").style("display", "none");
  const box = g.append("rect").attr("rx", 4).style("fill", TOKENS.surface).style("stroke", TOKENS.line);
  const text = g.append("text").style("font-size", "11px").style("fill", TOKENS.fg);
  return {
    show(x: number, y: number, lines: string[]) {
      g.style("display", null);
      text
        .selectAll("tspan")
        .data(lines)
        .join("tspan")
        .attr("x", 8)
        .attr("dy", (_, i) => (i === 0 ? "1.3em" : "1.35em"))
        .style("font-weight", (_, i) => (i === 0 ? "600" : null))
        .text((d) => d);
      const bb = (text.node() as SVGTextElement).getBBox();
      const w = bb.width + 16;
      const h = bb.height + 10;
      box.attr("width", w).attr("height", h);
      const tx = x + 12 + w > width ? x - 12 - w : x + 12;
      const ty = Math.min(Math.max(0, y - h - 8), height - h);
      g.attr("transform", `translate(${tx},${ty})`);
    },
    hide() {
      g.style("display", "none");
    },
  };
}
