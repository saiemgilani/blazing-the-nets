"use client";

import { useEffect, useRef } from "react";
import type { BarMetric } from "@/lib/charts/distanceBars.ts";
import { renderSideChart, sideViewBox, type SideChartData } from "@/lib/charts/sideChart.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartWidth } from "./useChartWidth.ts";

export function SideChart({ data, metric, title }: { data: SideChartData; metric: BarMetric; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useChartWidth(ref);
  useEffect(() => (ref.current && width ? renderSideChart(ref.current, data, { metric, width }) : undefined), [data, metric, width]);
  return <ChartSvg ref={ref} viewBox={sideViewBox(data.player.length)} title={title} />;
}
