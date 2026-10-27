// Interaction probe for a running build: the browser-side wiring the unit tests cannot reach
// (roles, focus, typed dates, touch scrolling, brushing). Exit 1 on any failed check.
//   npm run build && npm start   (then, in another shell)
//   BASE_URL=http://localhost:3000 node scripts/probe-ui.mjs
// Uses Playwright's bundled Chromium; PW_CHANNEL=msedge (or chrome) uses an installed browser.
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
let failed = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${detail ? `  (${detail})` : ""}`);
};

try {
  // --- Player page: strip keyboard, typed dates, versus following the window, brush over a gap.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${base}/players/1629008`, { waitUntil: "networkidle" });
    const caption = () => page.locator("#charts > p").first().textContent();
    const strip = page.locator("svg[aria-label$=' games']");
    check((await strip.getAttribute("role")) === "group", "game strip svg is a group");
    const total = await page.getByRole("checkbox").count();
    check(total > 10, "each game is a checkbox", `${total}`);
    await page.getByRole("button", { name: "Losses" }).focus();
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => document.activeElement?.getAttribute("data-game"));
    check(!!first, "Tab from the presets lands on the first game");
    await page.keyboard.press(" ");
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => ({ game: document.activeElement?.getAttribute("data-game"), checked: document.activeElement?.getAttribute("aria-checked") }));
    check(after.game === first && after.checked === "false", "Space drops the game and keeps focus on it", JSON.stringify(after));
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
    check((await caption())?.startsWith(`${total} of ${total} games`), "Enter adds it back");

    // Typed dates, one digit at a time (Chromium reports each half-typed value).
    const versusDesc = () => page.locator("#versus svg desc").textContent();
    const versusBefore = await versusDesc();
    const seen = [];
    const typeInto = async (label, digits) => {
      await page.getByLabel(label, { exact: true }).focus(); // the first (month) segment
      for (const d of digits) {
        await page.keyboard.type(d);
        seen.push(await caption());
      }
      await page.keyboard.press("Tab");
      await page.waitForTimeout(150);
    };
    await typeInto("From", "12012025");
    await typeInto("To", "01312026");
    const windowCaption = await caption();
    check(seen.every((c) => !c?.startsWith("0 of")), "no keystroke empties the window mid-entry", seen.filter((c) => c?.startsWith("0 of")).length ? "0-game caption seen" : "");
    check(/, Dec 1 to Jan 31;/.test(windowCaption ?? ""), "typed From/To set the window", windowCaption ?? "");
    check((await page.getByLabel("From", { exact: true }).inputValue()) === "2025-12-01", "From shows the typed date after blur");
    check((await versusDesc()) !== versusBefore, "the versus chart follows the window");

    // A brush over dates with no game (the widest gap between two games) is cleared, not left drawn.
    await page.goto(`${base}/players/1629008`, { waitUntil: "networkidle" });
    const timeline = page.locator("svg[aria-label*='game timeline']");
    await timeline.scrollIntoViewIfNeeded();
    const gap = await timeline.evaluate((svg) => {
      const xs = [...svg.querySelectorAll("rect[width='3']")].map((r) => Number(r.getAttribute("x"))).filter(Number.isFinite).sort((a, b) => a - b);
      let best = [0, 0];
      for (let i = 1; i < xs.length; i++) if (xs[i] - xs[i - 1] > best[1] - best[0]) best = [xs[i - 1], xs[i]];
      return { from: best[0] + 4, to: best[1] - 2, width: svg.viewBox.baseVal.width };
    });
    const box = await timeline.boundingBox();
    const toScreen = (x) => box.x + (x / gap.width) * box.width;
    await page.mouse.move(toScreen(gap.from), box.y + box.height * 0.4);
    await page.mouse.down();
    await page.mouse.move(toScreen(gap.to), box.y + box.height * 0.4, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    const selection = await timeline.evaluate((svg) => {
      const s = svg.querySelector(".selection");
      return s ? getComputedStyle(s).display : "missing";
    });
    check(selection === "none", "a brush over no game is cleared", `selection display ${selection}`);
    check(!(await caption())?.includes(" to "), "and no window is applied", (await caption()) ?? "");
    await page.close();
  }

  // --- URL state: every chart option round-trips through the query string and survives a reload.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${base}/players/1629008`, { waitUntil: "networkidle" });
    const pressed = (name) => page.getByRole("button", { name, exact: true }).first().getAttribute("aria-pressed");
    await page.getByRole("button", { name: "Zones", exact: true }).click();
    await page.getByRole("button", { name: "Away", exact: true }).click();
    await page.getByRole("button", { name: "20 games", exact: true }).click();
    const params = new URL(page.url()).searchParams;
    check(params.get("hex") === "zones" && params.get("games") === "away" && params.get("roll") === "20", "Zones, Away and 20 games land in the URL", page.url());
    await page.reload({ waitUntil: "networkidle" });
    const restored = [await pressed("Zones"), await pressed("Away"), await pressed("20 games")];
    check(restored.every((p) => p === "true"), "a reload reproduces the view", JSON.stringify(restored));
    await page.goBack({ waitUntil: "networkidle" });
    check(!new URL(page.url()).searchParams.has("hex") && (await pressed("Raw")) === "true", "Back undoes the view change (push), not the tweaks", page.url());
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${base}/scatter?x=fgaPg&y=tsPct&faces=1`, { waitUntil: "networkidle" });
    const axes = [await page.getByLabel("X").inputValue(), await page.getByLabel("Y").inputValue()];
    check(axes[0] === "fgaPg" && axes[1] === "tsPct", "scatter axes come from the URL", JSON.stringify(axes));
    check((await page.getByRole("button", { name: "Faces" }).getAttribute("aria-pressed")) === "true", "scatter faces come from the URL");
    await page.goto(`${base}/leaders?last=5&board=fg3Pct`, { waitUntil: "networkidle" });
    const lead = [
      await page.getByRole("button", { name: "5 games", exact: true }).getAttribute("aria-pressed"),
      await page.getByRole("button", { name: "3P%", exact: true }).getAttribute("aria-pressed"),
    ];
    check(lead.every((p) => p === "true"), "leaders window and board come from the URL", JSON.stringify(lead));
    await page.close();
  }

  // --- Compare view and export card.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    await page.goto(`${base}/players/1629008?hex=compare&compare=split:home-away`, { waitUntil: "networkidle" });
    const shotDesc = () => page.locator("svg[aria-label$=' shot chart'] desc").textContent();
    check((await shotDesc())?.startsWith("Shot share, home games"), "compare=split:home-away draws home vs away", (await shotDesc())?.slice(0, 60));
    const legend = await page.locator("svg[aria-label$=' shot chart']").textContent();
    check(legend?.includes("larger share for home games") && legend.includes("pale: under"), "the legend names both sides and the attempt floor");
    const picker = page.getByLabel("Compare with");
    await page.waitForFunction(() => document.querySelectorAll("optgroup[label^='Another player'] option").length > 10, null, { timeout: 30000 });
    const other = await page.locator("optgroup[label^='Another player'] option").nth(3).getAttribute("value");
    await picker.selectOption(other);
    await page.waitForFunction(() => !document.querySelector("svg[aria-label$=' shot chart'] desc")?.textContent?.includes("home games"), null, { timeout: 30000 });
    check(new URL(page.url()).searchParams.get("compare") === other, "picking a player sets compare=player:<id>", page.url());
    check((await shotDesc())?.startsWith("Shot share,") ?? false, "and redraws against that player", (await shotDesc())?.slice(0, 80));

    const save = async (label) => {
      const [download] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.getByRole("button", { name: label, exact: true }).click()]);
      return { name: download.suggestedFilename(), bytes: await readFile(await download.path()) };
    };
    const svg = await save("SVG");
    const text = svg.bytes.toString("utf8");
    check(svg.name.endsWith("-compare.svg"), "SVG export is named for the view", svg.name);
    check(text.includes("Data: sportsdataverse-data · NBA Stats") && text.includes("Compare: ") && text.includes("FG%") && !text.includes("var(--"), "the SVG card has the source, compare line, key numbers and no unresolved CSS vars");
    const png = await save("PNG");
    const isPng = png.bytes.subarray(1, 4).toString("ascii") === "PNG";
    const width = isPng ? png.bytes.readUInt32BE(16) : 0;
    check(isPng && width === 1296, "PNG export is a 2x raster of the 648 px card", `${png.name} ${width}px`);
    await page.close();
  }

  // --- Scatter at 390 px on a touch screen: one finger scrolls the page.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await page.goto(`${base}/scatter`, { waitUntil: "networkidle" });
    const cdp = await context.newCDPSession(page);
    const chart = page.locator("svg[aria-label*=' against ']");
    const box = await chart.boundingBox();
    const x = box.x + box.width / 2;
    const y = Math.min(box.y + box.height / 2, 700);
    const before = await page.evaluate(() => window.scrollY);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y + 100 }] });
    for (let i = 1; i <= 8; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + 100 - (250 * i) / 8 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => window.scrollY);
    check(after > before + 100, "a one-finger swipe on the scatter scrolls the page", `scrollY ${before} -> ${after}`);
    await context.close();
  }

  // --- Roster table: j/k move real focus, Enter opens, keys on a button are the button's.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${base}/teams/1610612751`, { waitUntil: "networkidle" });
    const sortOf = () => page.locator("th[aria-sort]:not([aria-sort='none'])").first().textContent();
    const sortBefore = await sortOf();
    await page.getByRole("button", { name: "Per game" }).focus();
    await page.keyboard.press("s");
    check((await sortOf()) === sortBefore, "s on a focused button does not re-sort", `${sortBefore} -> ${await sortOf()}`);
    await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined));
    await page.keyboard.press("j");
    await page.keyboard.press("j");
    const focus = await page.evaluate(() => ({ tag: document.activeElement?.tagName, row: document.activeElement?.closest("tr")?.getAttribute("data-row"), tab: document.activeElement?.getAttribute("tabindex") }));
    check(focus.tag === "A" && focus.row === "1", "j j focuses the second row's player link", JSON.stringify(focus));
    const stops = await page.locator("tbody a[tabindex='0']").count();
    check(stops === 1, "the table is one tab stop (roving tabindex)", `${stops}`);
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/players\/\d+/, { timeout: 15000 }).catch(() => {});
    check(/\/players\/\d+/.test(page.url()), "Enter opens the focused player", page.url());
    await page.close();
  }

  // --- Leaders: the metric picker is pressed buttons, not a half-built tablist.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${base}/leaders`, { waitUntil: "networkidle" });
    check((await page.locator("[role=tab], [role=tablist]").count()) === 0, "no tab roles on /leaders");
    const fg = page.getByRole("button", { name: "FG%", exact: true });
    await fg.click();
    check((await fg.getAttribute("aria-pressed")) === "true", "the metric buttons are aria-pressed");
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(failed ? `${failed} check(s) failed` : "all checks passed");
process.exit(failed ? 1 : 0);
