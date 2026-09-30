"use client";

import { useEffect, useRef } from "react";
import { DISTANCE_BARS_VIEWBOX, renderDistanceBars, type BarMetric, type DistanceBarsData } from "@/lib/charts/distanceBars.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartWidth } from "./useChartWidth.ts";

export function DistanceBars({ data, metric, title }: { data: DistanceBarsData; metric: BarMetric; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useChartWidth(ref);
  useEffect(() => (ref.current && width ? renderDistanceBars(ref.current, data, { metric, width }) : undefined), [data, metric, width]);
  return <ChartSvg ref={ref} viewBox={DISTANCE_BARS_VIEWBOX} title={title} />;
}
