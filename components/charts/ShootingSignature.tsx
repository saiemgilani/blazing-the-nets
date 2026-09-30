"use client";

import { useEffect, useRef } from "react";
import { renderShootingSignature, SIGNATURE_VIEWBOX, type ShootingSignatureData } from "@/lib/charts/shootingSignature.ts";
import { ChartSvg } from "./ChartSvg.tsx";

export function ShootingSignature({ data, title }: { data: ShootingSignatureData; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => (ref.current ? renderShootingSignature(ref.current, data) : undefined), [data]);
  return <ChartSvg ref={ref} viewBox={SIGNATURE_VIEWBOX} title={title} />;
}
