import type { Ref } from "react";

/**
 * The server-rendered shell every chart draws into: an empty, scalable <svg> with its viewBox and
 * an accessible name. d3 appends its own <g> after hydration and removes it on cleanup.
 */
export function ChartSvg({
  ref,
  viewBox,
  title,
}: {
  ref: Ref<SVGSVGElement>;
  viewBox: { width: number; height: number };
  title: string;
}) {
  return (
    <svg ref={ref} viewBox={`0 0 ${viewBox.width} ${viewBox.height}`} role="img" aria-label={title} className="h-auto w-full">
      <title>{title}</title>
    </svg>
  );
}
