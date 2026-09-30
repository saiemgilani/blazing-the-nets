"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * The rendered CSS width of the chart's <svg>, 0 until measured. Charts lay out at this width so
 * one viewBox unit is one pixel and text is FONT_PX on screen at every breakpoint.
 */
export function useChartWidth(ref: RefObject<SVGSVGElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
