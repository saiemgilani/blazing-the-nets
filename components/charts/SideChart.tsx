"use client";

import { useEffect, useRef } from "react";
import type { BarMetric } from "@/lib/charts/distanceBars.ts";
import { renderSideChart, sideViewBox, type SideChartData } from "@/lib/charts/sideChart.ts";
import { ChartSvg } from "./ChartSvg.tsx";

export function SideChart({ data, metric, title }: { data: SideChartData; metric: BarMetric; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => (ref.current ? renderSideChart(ref.current, data, { metric }) : undefined), [data, metric]);
  return <ChartSvg ref={ref} viewBox={sideViewBox(data.player.length)} title={title} />;
}
