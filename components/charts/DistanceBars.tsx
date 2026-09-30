"use client";

import { useEffect, useRef } from "react";
import { describeBars, DISTANCE_BARS_VIEWBOX, renderDistanceBars, type BarMetric, type DistanceBarsData } from "@/lib/charts/distanceBars.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

export function DistanceBars({ data, metric, title }: { data: DistanceBarsData; metric: BarMetric; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const { width, scheme, isFirstDraw } = useChartFrame(ref);
  useEffect(
    () => (ref.current && width ? renderDistanceBars(ref.current, data, { metric, width, animate: isFirstDraw() }) : undefined),
    [data, metric, width, scheme, isFirstDraw],
  );
  return <ChartSvg ref={ref} viewBox={DISTANCE_BARS_VIEWBOX} title={title} desc={describeBars(data, metric)} />;
}
