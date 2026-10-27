"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { buildCard, cardPng, download, slug, type CardMeta } from "@/lib/charts/exportCard.ts";
import {
  describeCompare,
  describeHex,
  HEX_VIEWBOX,
  renderHexShotChart,
  type CompareChartData,
  type HexMode,
  type HexShotChartData,
} from "@/lib/charts/hexShotChart.ts";
import { fmtInt, fmtPct } from "@/lib/format.ts";
import { toggleClass } from "@/lib/ui.ts";
import { setQuery, useQueryParam } from "@/lib/urlState.ts";
import { HEX_MODES, oneOf, unlessDefault } from "@/lib/viewParams.ts";
import { ChartSvg } from "./ChartSvg.tsx";
import { useChartFrame } from "./useChartFrame.ts";

const noop = () => () => {};

const LABELS: Record<HexMode, string> = { raw: "Raw", zones: "Zones", compare: "Compare" };

/** The compare view, supplied by a page that has a second side to offer (the player page). */
export interface CompareSlot {
  /** The picker (compare with a player, a season or home vs away). */
  picker: ReactNode;
  data: CompareChartData | null;
  /** Why there is no data yet ("Loading…", "Choose…"), or null. */
  status: string | null;
}

/** FGA, FG% and eFG% from the zone splits (threes are the three corner/above-break zones). */
function keyNumbers(data: HexShotChartData): [string, string][] {
  let attempts = 0;
  let makes = 0;
  let fg3m = 0;
  for (const [zone, { player }] of Object.entries(data.zones)) {
    attempts += player.attempts;
    makes += player.makes;
    if (zone.includes("3")) fg3m += player.makes;
  }
  return [
    ["FGA", fmtInt(attempts)],
    ["FG%", fmtPct(attempts ? makes / attempts : null)],
    ["eFG%", fmtPct(attempts ? (makes + 0.5 * fg3m) / attempts : null)],
  ];
}

export function HexShotChart({ data, title, compare, card }: { data: HexShotChartData; title: string; compare?: CompareSlot; card?: CardMeta }) {
  const ref = useRef<SVGSVGElement>(null);
  const { width, scheme, isFirstDraw } = useChartFrame(ref);
  const modes = HEX_MODES.filter((m) => m !== "compare" || compare);
  const mode = oneOf(modes, useQueryParam("hex"), "raw");
  const compareData = mode === "compare" ? (compare?.data ?? null) : null;
  useEffect(
    () => (ref.current && width ? renderHexShotChart(ref.current, data, { width, mode, compare: compareData, animate: isFirstDraw() }) : undefined),
    [data, width, mode, compareData, scheme, isFirstDraw],
  );

  const [exportStatus, setExportStatus] = useState("");
  // An image ClipboardItem: Chromium, Safari and Firefox 127+. False on the server and in the hydrating render.
  const canCopy = useSyncExternalStore(noop, () => typeof ClipboardItem !== "undefined" && !!navigator.clipboard?.write, () => false);

  // Nothing to export in Compare until both sides are drawn.
  const canExport = mode !== "compare" || compareData !== null;
  const exportAs = async (format: "png" | "svg" | "copy") => {
    if (!card || !canExport) return;
    setExportStatus("Building…");
    try {
      const filters = [card.filters, compareData ? `Compare: ${compareData.nameA} vs ${compareData.nameB}, by shot share` : `View: ${LABELS[mode]}`].join(" · ");
      const built = buildCard({ ...card, filters }, keyNumbers(data), (svg, w) => renderHexShotChart(svg, data, { width: w, mode, compare: compareData, animate: false }));
      const name = `blazing-the-nets-${slug(card.name)}-${slug(card.subtitle)}${compareData ? "-compare" : mode === "zones" ? "-zones" : ""}`;
      if (format === "copy") {
        // Safari wants the ClipboardItem created inside the click, holding a promise.
        await navigator.clipboard.write([new ClipboardItem({ "image/png": built.then((c) => cardPng(c)) })]);
        setExportStatus("Copied the PNG");
      } else if (format === "svg") {
        download(new Blob([(await built).svg], { type: "image/svg+xml" }), `${name}.svg`);
        setExportStatus("Saved the SVG");
      } else {
        download(await cardPng(await built), `${name}.png`);
        setExportStatus("Saved the PNG");
      }
    } catch (e) {
      setExportStatus(`Export failed: ${(e as Error).message}`);
    }
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Shot chart view" className="inline-flex overflow-hidden rounded border border-line text-sm">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setQuery({ hex: unlessDefault(m, "raw") }, "push")}
              className={`px-3 py-1 ${mode === m ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
            >
              {LABELS[m]}
            </button>
          ))}
        </div>
        {card && (
          <div role="group" aria-label="Export the shot chart" className="flex items-center gap-1 text-xs text-muted">
            Export
            <button type="button" disabled={!canExport} onClick={() => exportAs("png")} className={`${toggleClass(false, true)} disabled:opacity-40`}>
              PNG
            </button>
            <button type="button" disabled={!canExport} onClick={() => exportAs("svg")} className={`${toggleClass(false, true)} disabled:opacity-40`}>
              SVG
            </button>
            {canCopy && (
              <button type="button" disabled={!canExport} onClick={() => exportAs("copy")} className={`${toggleClass(false, true)} disabled:opacity-40`}>
                Copy
              </button>
            )}
          </div>
        )}
      </div>
      {mode === "compare" && compare && (
        <div className="mb-2 space-y-1">
          {compare.picker}
          {compare.status && <p className="text-sm text-muted">{compare.status}</p>}
        </div>
      )}
      <p className={exportStatus ? "mb-1 text-xs text-muted" : "sr-only"} aria-live="polite">
        {exportStatus}
      </p>
      <ChartSvg ref={ref} viewBox={HEX_VIEWBOX} title={title} desc={compareData ? describeCompare(compareData) : describeHex(data)} />
    </div>
  );
}
