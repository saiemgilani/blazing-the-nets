"use client";

import { useEffect, useRef } from "react";
import { describeTimeline, renderTimeline, TIMELINE_VIEWBOX } from "@/lib/charts/timeline.ts";
import type { PlayerGame } from "@/lib/data/aggregate.ts";
import type { DateWindow } from "@/lib/selection.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

export function Timeline({
  games,
  window: dateWindow,
  onBrush,
  title,
}: {
  games: PlayerGame[];
  window: DateWindow;
  onBrush: (window: DateWindow) => void;
  title: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const { width, scheme } = useChartFrame(ref);
  useEffect(
    () => (ref.current && width ? renderTimeline(ref.current, games, { width, window: dateWindow, onBrush }) : undefined),
    [games, dateWindow, onBrush, width, scheme],
  );
  return <ChartSvg ref={ref} viewBox={TIMELINE_VIEWBOX} title={title} desc={describeTimeline(games, dateWindow)} />;
}
