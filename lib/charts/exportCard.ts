import { foldText } from "../format.ts";
import { wrapText } from "./theme.ts";

/**
 * The shot chart as a shareable card: header (headshot or mark, name, season, an FGA / FG% / eFG%
 * strip), the chart and its legend redrawn at a fixed width, the filters in force and the source
 * line. Built as one standalone SVG (CSS variables resolved, the headshot inlined as a data URL),
 * then drawn to a canvas at 2x for PNG. Browser only.
 */

export interface CardMeta {
  name: string;
  /** e.g. "BKN · 2025-26 regular season". */
  subtitle: string;
  /** ESPN headshot URL; the mark is drawn when it is missing or cannot be fetched. */
  headshot: string | null;
  /** Initials or a tricode, on `markColor` (default the line token). */
  mark: string;
  markColor?: string;
  /** The game filters in force, in words. */
  filters: string;
}

export const CARD_CHART_WIDTH = 600;
const PAD = 24;
const W = CARD_CHART_WIDTH + 2 * PAD;
const HEADER = 150;
export const SOURCE_LINE = "Data: sportsdataverse-data · NBA Stats";
const FONT = `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
const TOKEN_NAMES = ["bg", "surface", "fg", "muted", "line", "accent"] as const;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function dataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null; // no CORS headers or offline: the mark stands in
  }
}

/**
 * The card as SVG markup. `draw` renders the chart into an <svg> at the given width (the live
 * chart's own render function, so the card always matches the page); it is mounted off-screen in
 * the document so theme and CSS variables resolve as they do on the page.
 */
export async function buildCard(meta: CardMeta, stats: [label: string, value: string][], draw: (svg: SVGSVGElement, width: number) => () => void): Promise<{ svg: string; width: number; height: number }> {
  const host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  host.setAttribute("style", `position:fixed;left:-10000px;top:0;width:${CARD_CHART_WIDTH}px`);
  document.body.append(host);
  let chart: string;
  let chartH: number;
  const css = getComputedStyle(host);
  const tokens = Object.fromEntries(TOKEN_NAMES.map((t) => [t, css.getPropertyValue(`--${t}`).trim()]));
  try {
    const cleanup = draw(host, CARD_CHART_WIDTH);
    chartH = host.viewBox.baseVal.height;
    chart = host.innerHTML;
    cleanup();
  } finally {
    host.remove();
  }
  // The chart styles marks with var(--token); a standalone SVG has no stylesheet to resolve them.
  chart = chart.replace(/var\(--(\w+)\)/g, (m, name: string) => tokens[name] || m);

  const photo = meta.headshot ? await dataUrl(meta.headshot) : null;
  const text = (x: number, y: number, s: string, size: number, fill: string, extra = "") =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}"${extra}>${esc(s)}</text>`;
  const imgW = 120;
  const imgH = Math.round((imgW * 254) / 350);
  const left = PAD + imgW + 18;
  const header = [
    photo
      ? `<image href="${photo}" x="${PAD}" y="${PAD}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="${PAD}" y="${PAD}" width="${imgW}" height="${imgH}" rx="6" fill="${esc(meta.markColor ?? tokens.line)}"/>` +
        text(PAD + imgW / 2, PAD + imgH / 2 + 9, meta.mark, 26, meta.markColor ? "#ffffff" : tokens.muted, ` text-anchor="middle" font-weight="700"`),
    text(left, PAD + 22, meta.name, 26, tokens.fg, ` font-weight="700"`),
    text(left, PAD + 46, meta.subtitle, 14, tokens.muted),
    ...stats.flatMap(([label, value], i) => [
      text(left + i * 120, PAD + 76, label, 12, tokens.muted),
      text(left + i * 120, PAD + 100, value, 22, tokens.fg, ` font-weight="700"`),
    ]),
  ];
  // wrapText measures 11 px text; these lines are 13 px.
  const filterLines = wrapText(meta.filters, CARD_CHART_WIDTH * 0.8);
  let y = HEADER + chartH + 22;
  const footer = filterLines.map((line, i) => text(PAD, y + i * 17, line, 13, tokens.fg));
  y += filterLines.length * 17 + 8;
  footer.push(text(PAD, y, SOURCE_LINE, 12, tokens.muted), text(W - PAD, y, "blazingthenets.com", 12, tokens.muted, ` text-anchor="end"`));
  const height = Math.ceil(y + PAD - 6);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" font-family='${FONT}'>` +
    `<rect width="${W}" height="${height}" fill="${tokens.bg}"/>` +
    header.join("") +
    `<svg x="${PAD}" y="${HEADER}" width="${CARD_CHART_WIDTH}" height="${chartH}" viewBox="0 0 ${CARD_CHART_WIDTH} ${chartH}">${chart}</svg>` +
    footer.join("") +
    `</svg>`;
  return { svg, width: W, height };
}

/** The card's SVG drawn to a canvas at `scale` (2 for a crisp PNG on any screen). */
export async function cardPng(card: { svg: string; width: number; height: number }, scale = 2): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([card.svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = card.width * scale;
    canvas.height = card.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "Mikal Bridges" + "2025-26" -> "mikal-bridges-2025-26". */
export const slug = (s: string) =>
  foldText(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
