import { useSyncExternalStore } from "react";

/**
 * Chart options live in the address bar (see lib/viewParams.ts). Pages are prerendered, so this
 * reads `location.search` in the browser rather than useSearchParams (which would drop a static
 * page to client rendering below a Suspense boundary). The server render, and so the first
 * hydrated render, sees no params; the real values follow straight after hydration.
 */

const CHANGE = "bn:query";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

/** One query param, live: updates on setQuery and on back/forward. */
export function useQueryParam(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get(key),
    () => null,
  );
}

/**
 * Set (or, with null, remove) params in place. "replace" for tweaks within a view, "push" for a
 * change of view (a new history entry, so Back returns to the previous one). Next.js syncs its
 * router with native history calls, so no server round trip.
 */
export function setQuery(updates: Record<string, string | null>, how: "replace" | "push" = "replace"): void {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(updates)) {
    if (v === null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  if (url.href === window.location.href) return;
  if (how === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(CHANGE));
}
