"use client";

import { useEffect, useRef, useState } from "react";
import { describeHex, HEX_VIEWBOX, renderHexShotChart, type HexMode, type HexShotChartData } from "@/lib/charts/hexShotChart.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

const MODES: { mode: HexMode; label: string }[] = [
  { mode: "raw", label: "Raw" },
  { mode: "zones", label: "Zones" },
];

export function HexShotChart({ data, title }: { data: HexShotChartData; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const { width, scheme, isFirstDraw } = useChartFrame(ref);
  const [mode, setMode] = useState<HexMode>("raw");
  useEffect(
    () => (ref.current && width ? renderHexShotChart(ref.current, data, { width, mode, animate: isFirstDraw() }) : undefined),
    [data, width, mode, scheme, isFirstDraw],
  );
  return (
    <div>
      <div role="group" aria-label="Shot chart view" className="mb-2 inline-flex overflow-hidden rounded border border-line text-sm">
        {MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            aria-pressed={mode === m.mode}
            onClick={() => setMode(m.mode)}
            className={`px-3 py-1 ${mode === m.mode ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <ChartSvg ref={ref} viewBox={HEX_VIEWBOX} title={title} desc={describeHex(data)} />
    </div>
  );
}
