"use client";

import { useEffect, useRef } from "react";
import { COURT_VIEWBOX, renderCourt } from "@/lib/charts/court.ts";
import { ChartSvg } from "./ChartSvg.tsx";

export function Court({ zones = false, title = "Half court" }: { zones?: boolean; title?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => (ref.current ? renderCourt(ref.current, { zones }) : undefined), [zones]);
  return <ChartSvg ref={ref} viewBox={COURT_VIEWBOX} title={title} />;
}
