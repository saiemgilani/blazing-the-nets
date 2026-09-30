"use client";

import { useEffect, useRef } from "react";
import { describeGames, GAME_STRIP_VIEWBOX, renderGameStrip, type GameStripData } from "@/lib/charts/gameStrip.ts";
import type { DateWindow } from "@/lib/selection.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

export function GameStrip({
  data,
  selected,
  window: dateWindow,
  onToggle,
  title,
}: {
  data: GameStripData;
  selected: ReadonlySet<string>;
  window: DateWindow;
  onToggle: (gameId: string) => void;
  title: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const { width, scheme, isFirstDraw } = useChartFrame(ref);
  useEffect(
    () =>
      ref.current && width
        ? renderGameStrip(ref.current, data, { width, selected, window: dateWindow, onToggle, animate: isFirstDraw() })
        : undefined,
    [data, selected, dateWindow, onToggle, width, scheme, isFirstDraw],
  );
  return <ChartSvg ref={ref} viewBox={GAME_STRIP_VIEWBOX} title={title} desc={describeGames(data, selected)} />;
}
