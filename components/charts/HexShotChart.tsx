"use client";

import { useEffect, useRef, useState } from "react";
import { HEX_VIEWBOX, renderHexShotChart, type HexMode, type HexShotChartData } from "@/lib/charts/hexShotChart.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartWidth } from "./useChartWidth.ts";

const MODES: { mode: HexMode; label: string }[] = [
  { mode: "raw", label: "Raw" },
  { mode: "zones", label: "Zones" },
];

export function HexShotChart({ data, title }: { data: HexShotChartData; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const width = useChartWidth(ref);
  const [mode, setMode] = useState<HexMode>("raw");
  useEffect(() => (ref.current && width ? renderHexShotChart(ref.current, data, { width, mode }) : undefined), [data, width, mode]);
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
      <ChartSvg ref={ref} viewBox={HEX_VIEWBOX} title={title} />
    </div>
  );
}
