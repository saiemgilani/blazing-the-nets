"use client";

import { useEffect, useRef } from "react";
import { describeSignature, renderShootingSignature, SIGNATURE_VIEWBOX, type ShootingSignatureData } from "@/lib/charts/shootingSignature.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

export function ShootingSignature({ data, title }: { data: ShootingSignatureData; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const { width, scheme, isFirstDraw } = useChartFrame(ref);
  useEffect(
    () => (ref.current && width ? renderShootingSignature(ref.current, data, { width, animate: isFirstDraw() }) : undefined),
    [data, width, scheme, isFirstDraw],
  );
  return <ChartSvg ref={ref} viewBox={SIGNATURE_VIEWBOX} title={title} desc={describeSignature(data)} />;
}
