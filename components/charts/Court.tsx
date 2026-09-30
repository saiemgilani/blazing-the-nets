"use client";

import { useEffect, useRef } from "react";
import { COURT_VIEWBOX, renderCourt } from "@/lib/charts/court.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

export function Court({ zones = false, title = "Half court" }: { zones?: boolean; title?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const { width, scheme } = useChartFrame(ref);
  useEffect(() => (ref.current && width ? renderCourt(ref.current, { width, zones }) : undefined), [width, zones, scheme]);
  const desc = zones ? "An NBA half court with the six shot zones outlined." : "An NBA half court.";
  return <ChartSvg ref={ref} viewBox={COURT_VIEWBOX} title={title} desc={desc} />;
}
