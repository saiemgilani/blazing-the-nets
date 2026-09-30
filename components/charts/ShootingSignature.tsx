"use client";

import { useEffect, useRef } from "react";
import { renderShootingSignature, SIGNATURE_VIEWBOX, type ShootingSignatureData } from "@/lib/charts/shootingSignature.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartWidth } from "./useChartWidth.ts";

export function ShootingSignature({ data, title }: { data: ShootingSignatureData; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useChartWidth(ref);
  useEffect(() => (ref.current && width ? renderShootingSignature(ref.current, data, { width }) : undefined), [data, width]);
  return <ChartSvg ref={ref} viewBox={SIGNATURE_VIEWBOX} title={title} />;
}
