"use client";

import { zoomIdentity, type ZoomTransform } from "d3-zoom";
import { useCallback, useEffect, useRef } from "react";
import { describeScatter, renderScatter, SCATTER_VIEWBOX } from "@/lib/charts/scatterChart.ts";
import type { ScatterMetric, ScatterPoint } from "@/lib/scatterMetrics.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

/**
 * The svg plus a canvas laid exactly under it (faces). The zoom transform lives in a ref so
 * redraws for other reasons (filter, axis, resize) keep the view; `resetKey` returns to identity.
 */
export function ScatterChart({
  points,
  x,
  y,
  faces,
  filter,
  resetKey,
  title,
}: {
  points: ScatterPoint[];
  x: ScatterMetric;
  y: ScatterMetric;
  faces: boolean;
  filter: string;
  resetKey: number;
  title: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transform = useRef<ZoomTransform>(zoomIdentity);
  const lastReset = useRef(resetKey);
  const { width, scheme } = useChartFrame(ref);
  const onZoom = useCallback((t: ZoomTransform) => {
    transform.current = t;
  }, []);
  useEffect(() => {
    if (!ref.current || !width) return;
    if (lastReset.current !== resetKey) {
      lastReset.current = resetKey;
      transform.current = zoomIdentity;
    }
    return renderScatter(ref.current, points, { width, x, y, faces, filter, transform: transform.current, onZoom, canvas: canvasRef.current });
  }, [points, x, y, faces, filter, resetKey, width, scheme, onZoom]);
  return (
    // The canvas sits under the svg (its own stacking context) so names and medians stay on top of faces.
    <div className="relative isolate">
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <ChartSvg ref={ref} viewBox={SCATTER_VIEWBOX} title={title} desc={describeScatter(points, x, y)} />
    </div>
  );
}
