"use client";

import { useState } from "react";
import { ScatterChart } from "./charts/ScatterChart.tsx";
import { randomPair, SCATTER_DEFAULT, SCATTER_INFO, SCATTER_METRICS, type ScatterMetric, type ScatterPoint } from "@/lib/scatterMetrics.ts";

const button = (active: boolean) =>
  `rounded border px-2.5 py-1 text-sm ${active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"}`;

/** Axis pickers, Random, dots/faces, a name filter and a zoom reset around the league scatter. */
export function ScatterExplorer({ points, subject }: { points: ScatterPoint[]; subject: string }) {
  const [x, setX] = useState<ScatterMetric>(SCATTER_DEFAULT.x);
  const [y, setY] = useState<ScatterMetric>(SCATTER_DEFAULT.y);
  const [faces, setFaces] = useState(false);
  const [filter, setFilter] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const picker = (label: string, value: ScatterMetric, set: (m: ScatterMetric) => void) => (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      {label}
      <select value={value} onChange={(e) => set(e.target.value as ScatterMetric)} className="rounded border border-line bg-surface px-2 py-1 text-fg">
        {SCATTER_METRICS.map((m) => (
          <option key={m} value={m}>
            {SCATTER_INFO[m].label}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {picker("Y", y, setY)}
        {picker("X", x, setX)}
        <button
          type="button"
          className={button(false)}
          onClick={() => {
            const [a, b] = randomPair();
            setX(a);
            setY(b);
          }}
        >
          Random
        </button>
        <div role="group" aria-label="Marks" className="inline-flex gap-1">
          <button type="button" aria-pressed={!faces} onClick={() => setFaces(false)} className={button(!faces)}>
            Dots
          </button>
          <button type="button" aria-pressed={faces} onClick={() => setFaces(true)} className={button(faces)}>
            Faces
          </button>
        </div>
        <button type="button" className={button(false)} onClick={() => setResetKey((k) => k + 1)}>
          Reset zoom
        </button>
      </div>
      <label className="flex flex-wrap items-center gap-2 text-sm text-muted">
        Find
        <input
          type="search"
          list="scatter-names"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="player name"
          className="w-56 rounded border border-line bg-surface px-2 py-1 text-fg"
        />
        <datalist id="scatter-names">
          {points.map((p) => (
            <option key={p.person_id} value={p.name} />
          ))}
        </datalist>
      </label>
      <ScatterChart points={points} x={x} y={y} faces={faces} filter={filter} resetKey={resetKey} title={`${subject}: ${SCATTER_INFO[y].label} against ${SCATTER_INFO[x].label}`} />
      <p className="text-sm text-muted">
        Players with 100+ FGA. <span className="text-accent">Nets</span> in orange with names, others in their team colours; dashed lines are
        the league medians. Scroll the wheel or pinch to zoom; drag (two fingers on a touch screen) to pan. Season stats where the release has them, shots otherwise.
      </p>
    </div>
  );
}
