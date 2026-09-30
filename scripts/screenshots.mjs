// Visual check: full-page screenshots of the main pages at 390 and 1280 px in light and dark.
//   npm run build && npm start   (then, in another shell)
//   BASE_URL=http://localhost:3000 node scripts/screenshots.mjs
// Uses Playwright's bundled Chromium; PW_CHANNEL=msedge (or chrome) uses an installed browser.
// Output: img/visual/<page>-<width>-<scheme>.png (git-ignored), plus for the player page a hex
// hover shot, the Zones view and a brushed date window. PAGES="player=/players/1629008,team=/teams/1610612751" overrides.
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const pages = (process.env.PAGES ?? "home=/,players=/players,player=/players/1629008,teams=/teams,team=/teams/1610612751")
  .split(",")
  .map((p) => p.split("="));
const widths = (process.env.WIDTHS ?? "390,1280").split(",").map(Number);
const outDir = fileURLToPath(new URL("../img/visual/", import.meta.url));
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
try {
  for (const [name, path] of pages) {
    for (const colorScheme of ["light", "dark"]) {
      for (const width of widths) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion: "reduce" });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
        const res = await page.goto(base + path, { waitUntil: "networkidle" });
        const file = `${outDir}${name}-${width}-${colorScheme}.png`;
        await page.screenshot({ path: file, fullPage: true });
        if (name === "player") {
          const hex = page.locator("svg[aria-label$='shot chart']").first();
          if (width === widths[widths.length - 1]) {
            // Hexes are drawn smallest first, so the last one in the hex layer is the busiest.
            const busiest = await hex.locator("g > g:nth-of-type(2) > path").last().boundingBox();
            if (busiest) await page.mouse.move(busiest.x + busiest.width / 2, busiest.y + busiest.height / 2);
            await hex.screenshot({ path: `${outDir}${name}-hover-${colorScheme}.png` });
          }
          await page.getByRole("button", { name: "Zones" }).click();
          await page.mouse.move(0, 0);
          await hex.screenshot({ path: `${outDir}${name}-zones-${width}-${colorScheme}.png` });
        }
        if (name === "player" && width === widths[widths.length - 1]) {
          // A brushed date window: reload, drag across the middle of the game timeline.
          await page.goto(base + path, { waitUntil: "networkidle" });
          const timeline = page.locator("svg[aria-label*='game timeline']");
          const box = await timeline.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.4, { steps: 8 });
            await page.mouse.up();
            await page.waitForTimeout(400);
            await page.screenshot({ path: `${outDir}${name}-brushed-${width}-${colorScheme}.png`, fullPage: true });
          }
        }
        console.log(`${res?.status()} ${file}${errors.length ? `  ERRORS: ${errors.join(" | ")}` : ""}`);
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
