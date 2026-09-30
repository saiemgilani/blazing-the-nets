// Visual check: full-page screenshots at 390/768/1280 px in light and dark.
//   BASE_URL=http://localhost:3000 PAGE_PATH="/players/1629008?season=2026" node scripts/screenshots.mjs
// Uses Playwright's bundled Chromium; PW_CHANNEL=msedge (or chrome) uses an installed browser instead.
// Output: img/visual/<name>-<width>-<scheme>.png (git-ignored), plus one hover shot of the hex chart.
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const pagePath = process.env.PAGE_PATH ?? "/players/1629008?season=2026";
const name = process.env.SHOT_NAME ?? "player";
const outDir = fileURLToPath(new URL("../img/visual/", import.meta.url));
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
try {
  for (const colorScheme of ["light", "dark"]) {
    for (const width of [390, 768, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion: "reduce" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await page.goto(base + pagePath, { waitUntil: "networkidle" });
      await page.waitForSelector("svg g path");
      const file = `${outDir}${name}-${width}-${colorScheme}.png`;
      await page.screenshot({ path: file, fullPage: true });
      if (width === 1280) {
        const hex = page.locator("svg").first();
        // Hexes are drawn smallest first, so the last one in the hex layer is the busiest.
        const busiest = await hex.locator("g > g:nth-of-type(2) > path").last().boundingBox();
        if (busiest) await page.mouse.move(busiest.x + busiest.width / 2, busiest.y + busiest.height / 2);
        await hex.screenshot({ path: `${outDir}${name}-hover-${colorScheme}.png` });
      }
      console.log(`${file}${errors.length ? `  ERRORS: ${errors.join(" | ")}` : ""}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
