import { isAddressableSeason } from "./seasonRange.ts";

/**
 * Public URLs keep the season (and team filter) in the query string: /players/1629008?season=2025.
 * Reading searchParams would make every page dynamic, so proxy.ts rewrites the query into path
 * segments of internal routes that are prerendered for the current season and cached for 6 h:
 *
 *   /                  -> /home/<season>
 *   /players           -> /players/list/<season>/<team>
 *   /players/<id>      -> /players/<id>/<season>
 *   /teams             -> /teams/list/<season>
 *   /teams/<id>        -> /teams/<id>/<season>
 *   /scatter           -> /scatter/<season>
 *   /leaders           -> /leaders/<season>
 *
 * <season> is a 4-digit year in the site's range (FIRST_SEASON..LAST_KNOWN_SEASON + 1), anything
 * else is "current", so crafted URLs cannot mint new cache entries; pages resolve and validate it
 * with parseSeason. <team> is an upper-cased tricode or ALL, default BKN. Returns null for paths
 * it does not own.
 */
export function internalPath(pathname: string, query: URLSearchParams): string | null {
  const s = query.get("season") ?? "";
  const season = /^\d{4}$/.test(s) && isAddressableSeason(Number(s)) ? s : "current";
  const t = (query.get("team") ?? "").toUpperCase();
  const team = /^[A-Z]{2,4}$/.test(t) ? t : "BKN";
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return `/home/${season}`;
  if (path === "/players") return `/players/list/${season}/${team}`;
  if (path === "/teams") return `/teams/list/${season}`;
  if (path === "/scatter" || path === "/leaders") return `${path}/${season}`;
  const m = /^\/(players|teams)\/(\d{1,10})$/.exec(path);
  return m ? `/${m[1]}/${m[2]}/${season}` : null;
}

/** The internal routes themselves. Direct requests for them 404 (only the proxy's rewrites reach them). */
export function isInternalPath(pathname: string): boolean {
  return /^\/(home\/[^/]+|(scatter|leaders)\/[^/]+|players\/list\/.+|teams\/list\/.+|(players|teams)\/\d+\/[^/]+)(\/.*)?$/.test(pathname);
}

/**
 * The one internal path served directly: a player's OG image, which the page's metadata links to.
 * Only the season values the proxy itself produces ("current" or an addressable year), so crafted
 * URLs cannot each render and cache a fresh image.
 */
export function isOgImagePath(pathname: string): boolean {
  const m = /^\/players\/\d{1,10}\/(current|\d{4})\/opengraph-image$/.exec(pathname);
  return m !== null && (m[1] === "current" || isAddressableSeason(Number(m[1])));
}
