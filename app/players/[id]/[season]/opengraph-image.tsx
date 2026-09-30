import { hexbin } from "d3-hexbin";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { courtViewport } from "@/lib/charts/court.ts";
import { layoutHexes } from "@/lib/charts/hexShotChart.ts";
import { DIFF_WORDS } from "@/lib/charts/theme.ts";
import { courtLines } from "@/lib/data/court.ts";
import { seasonLabel } from "@/lib/data/seasons.ts";
import { fmtInt, fmtPct } from "@/lib/format.ts";
import { HEX_RADIUS, loadPlayerPage, resolveSeason } from "@/lib/pageData.ts";
import { SITE_NAME } from "@/lib/site.ts";

export const revalidate = 21600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Player shot chart";

/** The player's hex shot chart drawn as SVG paths (same geometry as the page), plus a typographic header. */
export default async function Image({ params }: { params: Promise<{ id: string; season: string }> }) {
  const { id, season: param } = await params;
  const { season } = await resolveSeason(param);
  const page = Number.isSafeInteger(Number(id)) ? await loadPlayerPage(season, Number(id)) : null;
  if (!page) notFound(); // no generic image for ids that are not players (each would be a new CDN object)
  const v = courtViewport(560);
  const shape = hexbin();
  const { marks } = layoutHexes(page.dashboard.hex.hexes, HEX_RADIUS, v, "dark");
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0a0a0a", color: "#f5f5f5", padding: 48, gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 30, color: "#ff6a13", fontWeight: 700 }}>{SITE_NAME}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.05 }}>{page.player.player_name}</div>
            <div style={{ display: "flex", fontSize: 30, color: "#a3a3a3" }}>
              {`${page.teams.join(", ")} · ${seasonLabel(season)}`}
            </div>
            <div style={{ display: "flex", fontSize: 32 }}>
              {`${fmtInt(page.line.makes)}/${fmtInt(page.line.attempts)} FG · ${fmtPct(page.line.fgPct)} · ${fmtPct(page.line.efgPct)} eFG`}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#a3a3a3" }}>{`Hex colour vs league: ${DIFF_WORDS}`}</div>
        </div>
        <svg width={v.width} height={v.height} viewBox={`0 0 ${v.width} ${v.height}`}>
          <rect width={v.width} height={v.height} fill="#151515" />
          {courtLines(v).map((l) => (
            <path key={l.name} d={l.d} fill="none" stroke="#5c5c5c" strokeWidth={1.5} strokeDasharray={l.dashed ? "5 5" : undefined} />
          ))}
          {marks.map((m) => (
            <path key={`${m.hex.x},${m.hex.y}`} d={shape.hexagon(m.r)} transform={`translate(${m.cx},${m.cy})`} fill={m.fill} />
          ))}
        </svg>
      </div>
    ),
    // The route renders on demand; let the CDN keep each image for the 6 h the data is fresh.
    { ...size, headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
  );
}
