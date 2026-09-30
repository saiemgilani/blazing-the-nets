"use client";

import { useEffect, useRef } from "react";
import type { BarMetric } from "@/lib/charts/distanceBars.ts";
import { describeSides, renderSideChart, sideViewBox, type SideChartData } from "@/lib/charts/sideChart.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

export function SideChart({ data, metric, title }: { data: SideChartData; metric: BarMetric; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const { width, scheme, isFirstDraw } = useChartFrame(ref);
  useEffect(
    () => (ref.current && width ? renderSideChart(ref.current, data, { metric, width, animate: isFirstDraw() }) : undefined),
    [data, metric, width, scheme, isFirstDraw],
  );
  return <ChartSvg ref={ref} viewBox={sideViewBox(data.player.length)} title={title} desc={describeSides(data, metric)} />;
}
