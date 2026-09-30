/**
 * Public URLs. The current season has no ?season= so links land on the prerendered
 * /…/current routes (a cache hit) instead of rendering a duplicate /…/2026 entry.
 */
export function seasonQuery(season: number, current: number): string {
  return season === current ? "" : `?season=${season}`;
}

export const playerHref = (personId: number, q: string) => `/players/${personId}${q}`;
export const teamHref = (teamId: number, q: string) => `/teams/${teamId}${q}`;

/** `path?params`, leaving out any param equal to its default (so defaults map to the canonical URL). */
export function withParams(path: string, params: Record<string, string>, defaults: Record<string, string> = {}): string {
  const kept = Object.entries(params).filter(([k, v]) => v !== defaults[k]);
  return kept.length ? `${path}?${new URLSearchParams(kept)}` : path;
}
