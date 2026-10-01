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
  ["/players/1629008?season=9999", 200, null], // out-of-range season: the current one, no new cache entry
  ["/players/1629008/current", 404, null], // internal routes are only reachable through the proxy's rewrites
  ["/players/1629008/9999", 404, null],
  ["/players/1629008/..%2F..%2Fabout", 404, null],
  ["/home/current", 404, null],
  ["/teams/list/current", 404, null],
  ["/players/1629008/current/opengraph-image", 200, null], // the one internal path metadata links to
  ["/players/1629008/foo/opengraph-image", 404, null], // only "current" or an addressable year
  ["/players/1629008/9999/opengraph-image", 404, null],
  ["/players/9999999/current/opengraph-image", 404, null], // not a player: no generic image
  ["/scatter", 200, null],
  ["/leaders?season=2025", 200, null],
  ["/scatter/current", 404, null],
  ["/leaders/2026", 404, null],
  // Seasons from 1997-98 (FIRST_SEASON) render on demand; 1996-97 is out of range.
  ["/?season=2003", 200, null],
  ["/players?season=2003", 200, null], // no team: that season's Nets (NJN)
  ["/players?season=2003&team=BKN", 200, null], // another season's tricode selects the franchise
  ["/players?season=2010&team=SEA", 200, null],
  ["/players/467?season=2003", 200, null], // Jason Kidd, 2002-03 New Jersey Nets
  ["/teams/1610612751?season=1998", 200, null],
  ["/teams?season=1998", 200, null],
  ["/scatter?season=2008", 200, null],
  ["/leaders?season=2013", 200, null],
  ["/players/467/2003", 404, null],
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
