"use client";

import { useEffect, useRef } from "react";
import { HEX_VIEWBOX, renderHexShotChart, type HexShotChartData } from "@/lib/charts/hexShotChart.ts";
import { ChartSvg } from "./ChartSvg.tsx";

export function HexShotChart({ data, title }: { data: HexShotChartData; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => (ref.current ? renderHexShotChart(ref.current, data) : undefined), [data]);
  return <ChartSvg ref={ref} viewBox={HEX_VIEWBOX} title={title} />;
}
