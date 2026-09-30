"use client";

import { useEffect, useRef } from "react";
import { COURT_VIEWBOX, renderCourt } from "@/lib/charts/court.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartWidth } from "./useChartWidth.ts";

export function Court({ zones = false, title = "Half court" }: { zones?: boolean; title?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useChartWidth(ref);
  useEffect(() => (ref.current && width ? renderCourt(ref.current, { width, zones }) : undefined), [width, zones]);
  return <ChartSvg ref={ref} viewBox={COURT_VIEWBOX} title={title} />;
}
