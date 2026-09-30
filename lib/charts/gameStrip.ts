import { select } from "d3-selection";
import type { PlayerGame } from "../data/aggregate.ts";
import { fmtDate, fmtPct } from "../format.ts";
import { inWindow, type DateWindow } from "../selection.ts";
import { DEFAULT_WIDTH } from "./court.ts";
import { chartTheme, diffColor, drawDiffLegend, motionMs, setViewBox, tooltip, TOKENS } from "./theme.ts";

/** A game selector: one cell per game in date order, coloured by that game's FG% vs his season FG%. */

export interface GameStripData {
  games: PlayerGame[];
  seasonFgPct: number | null;
}

export interface GameStripOptions {
  width: number;
  selected: ReadonlySet<string>;
  window: DateWindow;
  onToggle: (gameId: string) => void;
  animate?: boolean;
}

const CELL = 16;
const GAP = 3;
const PAD = 2;

export const GAME_STRIP_VIEWBOX = { width: DEFAULT_WIDTH, height: 150 };

export interface StripCell {
  game: PlayerGame;
  x: number;
  y: number;
}

/** Cells wrap onto as many rows as the width needs. */
export function stripLayout(games: PlayerGame[], width: number): { cells: StripCell[]; rows: number } {
  const perRow = Math.max(1, Math.floor((width - 2 * PAD + GAP) / (CELL + GAP)));
  const cells = games.map((game, i) => ({ game, x: PAD + (i % perRow) * (CELL + GAP), y: PAD + Math.floor(i / perRow) * (CELL + GAP) }));
  return { cells, rows: Math.ceil(games.length / perRow) };
}

/** Raw difference: one game is too few shots to shrink toward anything meaningful. */
export function gameDiff(g: Pick<PlayerGame, "fgPct">, seasonFgPct: number | null): number | null {
  return g.fgPct === null || seasonFgPct === null ? null : g.fgPct - seasonFgPct;
}

export function describeGames(data: GameStripData, selected: ReadonlySet<string>): string {
  const n = data.games.filter((g) => selected.has(g.game_id)).length;
  return `${data.games.length} games in date order, ${n} selected; each game's FG% against his season FG% of ${fmtPct(data.seasonFgPct)}.`;
}

export function renderGameStrip(svg: SVGSVGElement, data: GameStripData, opts: GameStripOptions): () => void {
  const { width, selected, window, onToggle, animate = true } = opts;
  const theme = chartTheme(svg);
  const root = select(svg).append("g");
  const { cells, rows } = stripLayout(data.games, width);
  const gridH = PAD * 2 + rows * (CELL + GAP);
  const inView = (g: PlayerGame) => selected.has(g.game_id) && inWindow(g.date, window);

  const rects = root
    .append("g")
    .selectAll("rect")
    .data(cells)
    .join("rect")
    .attr("x", (c) => c.x)
    .attr("y", (c) => c.y)
    .attr("width", CELL)
    .attr("height", CELL)
    .attr("rx", 2)
    .style("cursor", "pointer")
    .style("fill", (c) => diffColor(gameDiff(c.game, data.seasonFgPct), theme))
    .style("stroke", (c) => (inView(c.game) ? TOKENS.fg : TOKENS.line))
    .style("stroke-width", (c) => (inView(c.game) ? 1 : 0.5))
    .style("opacity", (c) => (inView(c.game) ? 1 : selected.has(c.game.game_id) ? 0.45 : 0.15));
  const ms = animate ? motionMs(300) : 0;
  if (ms) rects.style("fill-opacity", 0).transition().duration(ms).style("fill-opacity", 1);

  const tip = tooltip(root, width, gridH + 60);
  rects
    .on("click", (_, c) => onToggle(c.game.game_id))
    .on("pointerenter", (_, c) => {
      const g = c.game;
      tip.show(c.x + CELL, c.y + CELL, [
        `${fmtDate(g.date)} ${g.venue === "home" ? "vs" : g.venue === "away" ? "@" : "vs (neutral site)"} ${g.opponent}${g.win === null ? "" : g.win ? ", W" : ", L"}`,
        `${g.makes}/${g.attempts} FG, ${fmtPct(g.fgPct)}`,
        selected.has(g.game_id) ? "click to drop" : "click to add",
      ]);
    })
    .on("pointerleave", () => tip.hide());

  const legend = root.append("g").attr("transform", `translate(${PAD},${gridH + 8})`);
  const used = drawDiffLegend(
    legend,
    0,
    0,
    width - 2 * PAD,
    theme,
    ["click a game to add or drop it; faded: not in the charts below"],
    ["game FG% vs his season FG% (points)", "red: above his season rate · blue: below"],
  );
  setViewBox(svg, width, gridH + 8 + used + 4);

  return () => {
    rects.interrupt();
    root.remove();
  };
}
