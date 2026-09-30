"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { debounce } from "@/lib/debounce.ts";

/** Resize redraws wait this long after the last size change. */
export const RESIZE_DEBOUNCE_MS = 150;

/**
 * What a chart effect depends on besides its data:
 * - `width`: the <svg>'s CSS width, 0 until measured (charts lay out at it, so text is 11 px on
 *   screen). The first measurement applies at once; later ones are debounced.
 * - `scheme`: changes when the OS colour scheme flips, so charts redraw with the new palette
 *   (they read the resolved theme from CSS; null until the first change).
 * - `isFirstDraw()`: true exactly once, so only the first draw animates.
 */
export function useChartFrame(ref: RefObject<SVGSVGElement | null>) {
  const [width, setWidth] = useState(0);
  const [scheme, setScheme] = useState<"light" | "dark" | null>(null);
  const drawn = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const later = debounce((w: number) => setWidth(w), RESIZE_DEBOUNCE_MS);
    let first = true;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (first) {
        first = false;
        setWidth(w);
      } else later(w);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      later.cancel();
    };
  }, [ref]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setScheme(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const isFirstDraw = useCallback(() => {
    const first = !drawn.current;
    drawn.current = true;
    return first;
  }, []);

  return { width, scheme, isFirstDraw };
}
