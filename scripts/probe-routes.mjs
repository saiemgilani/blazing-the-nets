// Route probe for a running build: status codes and robots headers.
//   BASE_URL=http://localhost:3000 node scripts/probe-routes.mjs   (exit 1 on any mismatch)
const base = process.env.BASE_URL ?? "http://localhost:3000";
const cases = [
  // [path, expected status, expected X-Robots-Tag or null]
  ["/", 200, null],
  ["/players", 200, null],
  ["/players/1629008", 200, null],
  ["/players/1629008?season=1990", 200, null], // bad season falls back to the current one
  ["/teams/1610612751", 200, null],
  ["/players/123", 404, null], // unknown player: a real 404, not a 200 not-found page
  ["/teams/999", 404, null],
  ["/players?team=ZZZ", 404, null],
  ["/players/1629008/current", 200, "noindex"], // internal routes are reachable but noindex
  ["/home/current", 200, "noindex"],
  ["/teams/list/current", 200, "noindex"],
  ["/sitemap.xml", 200, null],
  ["/robots.txt", 200, null],
];
let failed = 0;
for (const [path, status, robots] of cases) {
  const res = await fetch(base + path, { redirect: "manual" });
  await res.arrayBuffer();
  const tag = res.headers.get("x-robots-tag");
  const ok = res.status === status && tag === robots;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${res.status} ${path} x-robots-tag=${tag ?? "-"}`);
}
process.exit(failed ? 1 : 0);
