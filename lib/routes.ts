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
 *
 * <season> is the 4-digit param or "current" (pages resolve and validate it with parseSeason);
 * <team> is an upper-cased tricode or ALL, default BKN. Returns null for paths it does not own.
 */
export function internalPath(pathname: string, query: URLSearchParams): string | null {
  const s = query.get("season") ?? "";
  const season = /^\d{4}$/.test(s) ? s : "current";
  const t = (query.get("team") ?? "").toUpperCase();
  const team = /^[A-Z]{2,4}$/.test(t) ? t : "BKN";
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return `/home/${season}`;
  if (path === "/players") return `/players/list/${season}/${team}`;
  if (path === "/teams") return `/teams/list/${season}`;
  const m = /^\/(players|teams)\/(\d{1,10})$/.exec(path);
  return m ? `/${m[1]}/${m[2]}/${season}` : null;
}

/** The internal routes themselves, reachable directly: the proxy marks them X-Robots-Tag: noindex. */
export function isInternalPath(pathname: string): boolean {
  return /^\/(home\/[^/]+|players\/list\/.+|teams\/list\/.+|(players|teams)\/\d+\/[^/]+)(\/.*)?$/.test(pathname);
}
