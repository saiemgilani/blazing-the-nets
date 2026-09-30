"use client";

import { useEffect, useRef } from "react";
import { describeRolling, renderRollingChart, ROLLING_VIEWBOX, type RollingData } from "@/lib/charts/rollingChart.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

export function RollingChart({ data, title }: { data: RollingData; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const { width, scheme, isFirstDraw } = useChartFrame(ref);
  useEffect(
    () => (ref.current && width ? renderRollingChart(ref.current, data, { width, animate: isFirstDraw() }) : undefined),
    [data, width, scheme, isFirstDraw],
  );
  return <ChartSvg ref={ref} viewBox={ROLLING_VIEWBOX} title={title} desc={describeRolling(data)} />;
}
