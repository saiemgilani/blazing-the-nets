"use client";

import { useEffect, useRef } from "react";
import { DISTANCE_BARS_VIEWBOX, renderDistanceBars, type BarMetric, type DistanceBarsData } from "@/lib/charts/distanceBars.ts";
import { ChartSvg } from "./ChartSvg.tsx";

export function DistanceBars({ data, metric, title }: { data: DistanceBarsData; metric: BarMetric; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => (ref.current ? renderDistanceBars(ref.current, data, { metric }) : undefined), [data, metric]);
  return <ChartSvg ref={ref} viewBox={DISTANCE_BARS_VIEWBOX} title={title} />;
}
