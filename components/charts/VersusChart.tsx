"use client";

import { useEffect, useRef } from "react";
import { describeVersus, renderVersus, versusViewBox, type VersusData } from "@/lib/charts/versusChart.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

export function VersusChart({ data, title }: { data: VersusData; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const { width, scheme, isFirstDraw } = useChartFrame(ref);
  useEffect(
    () => (ref.current && width ? renderVersus(ref.current, data, { width, animate: isFirstDraw() }) : undefined),
    [data, width, scheme, isFirstDraw],
  );
  return <ChartSvg ref={ref} viewBox={versusViewBox(data.rows.length)} title={title} desc={describeVersus(data)} />;
}
