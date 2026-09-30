import type { Ref } from "react";

/**
 * The server-rendered shell every chart draws into: an empty, scalable <svg> with its viewBox, an
 * accessible name (<title>) and the numbers in words (<desc>). d3 appends its own <g> after
 * hydration and removes it on cleanup.
 */
export function ChartSvg({
  ref,
  viewBox,
  title,
  desc,
  role = "img",
}: {
  ref: Ref<SVGSVGElement>;
  viewBox: { width: number; height: number };
  title: string;
  desc: string;
  /** "group" when the chart holds controls (an img's children are hidden from assistive tech). */
  role?: "img" | "group";
}) {
  return (
    <svg ref={ref} viewBox={`0 0 ${viewBox.width} ${viewBox.height}`} role={role} aria-label={title} className="h-auto w-full">
      <title>{title}</title>
      <desc>{desc}</desc>
    </svg>
  );
}
