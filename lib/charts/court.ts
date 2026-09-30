import { select } from "d3-selection";
import { courtLines, viewport, zoneLines, type Viewport } from "../data/court.ts";
import { TOKENS, type G } from "./theme.ts";

/** Charts show the half court from the baseline up to 35 ft, hoop at the bottom (the 2021 orientation). */
export const COURT_TOP = 350;
export const COURT_WIDTH = 500;

export function courtViewport(): Viewport {
  return viewport(COURT_WIDTH, COURT_TOP);
}

export interface CourtOptions {
  /** Outline the zones `zoneOf` uses, in the accent colour. */
  zones?: boolean;
}

export function drawCourt(g: G, v: Viewport, { zones = false }: CourtOptions = {}): void {
  g.append("g")
    .attr("class", "court")
    .selectAll("path")
    .data(courtLines(v))
    .join("path")
    .attr("d", (l) => l.d)
    .style("fill", "none")
    .style("stroke", TOKENS.muted)
    .style("stroke-opacity", 0.6)
    .style("stroke-width", 1)
    .style("stroke-dasharray", (l) => (l.dashed ? "4 4" : null));
  if (!zones) return;
  g.append("g")
    .attr("class", "zones")
    .selectAll("path")
    .data(zoneLines(v))
    .join("path")
    .attr("d", (l) => l.d)
    .style("fill", "none")
    .style("stroke", TOKENS.accent)
    .style("stroke-width", 1.5)
    .style("stroke-dasharray", "6 3");
}

export const COURT_VIEWBOX = { width: COURT_WIDTH, height: courtViewport().height };

export function renderCourt(svg: SVGSVGElement, opts: CourtOptions = {}): () => void {
  const root = select(svg).append("g");
  drawCourt(root, courtViewport(), opts);
  return () => root.remove();
}
