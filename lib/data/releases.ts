import { parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import { z } from "zod";

export const RELEASE_REPO = "sportsdataverse/sportsdataverse-data";

/** ISR window (6 h). The nightly hoopR-nba-stats-data producer refreshes the releases. */
export const REVALIDATE_SECONDS = 21600;

/** The asset does not exist (HTTP 404). A failed fetch (403, 429, 5xx) is a plain Error: its answer is unknown. */
export class AssetMissingError extends Error {}

export function releaseUrl(tag: string, asset: string): string {
  return `https://github.com/${RELEASE_REPO}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(asset)}`;
}

const cache = new Map<string, { at: number; value: Promise<unknown> }>();

/**
 * Per-process memo of an async load, kept for one ISR window. A rejected load is evicted so the
 * next call retries instead of serving the failure until the window closes.
 */
function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < REVALIDATE_SECONDS * 1000) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { at: Date.now(), value });
  value.catch(() => {
    if (cache.get(key)?.value === value) cache.delete(key);
  });
  return value;
}

export async function fetchAssetBytes(tag: string, asset: string): Promise<ArrayBuffer> {
  // ponytail: Next's data cache skips bodies over 2 MB (every shots file), so for those the
  // revalidate only sets the route's ISR window and the memo below is the real cache.
  const res = await fetch(releaseUrl(tag, asset), { next: { revalidate: REVALIDATE_SECONDS } });
  if (res.status === 404) throw new AssetMissingError(`${tag}/${asset}: not in the release`);
  if (!res.ok) throw new Error(`${tag}/${asset}: HTTP ${res.status}`);
  return res.arrayBuffer();
}

/** Decode parquet bytes into rows validated by `row`; only the schema's columns are read. */
export async function parseParquet<S extends z.ZodObject>(bytes: ArrayBuffer, row: S): Promise<z.output<S>[]> {
  const raw = await parquetReadObjects({ file: bytes, columns: Object.keys(row.shape), compressors });
  return z.array(row).parse(raw);
}

/** Download a release asset once per ISR window and decode it into typed rows. */
export function readParquet<S extends z.ZodObject>(tag: string, asset: string, row: S): Promise<z.output<S>[]> {
  const key = `${tag}/${asset}#${Object.keys(row.shape).join(",")}`;
  return memo(key, async () => parseParquet(await fetchAssetBytes(tag, asset), row));
}

const Release = z.object({ assets: z.array(z.object({ name: z.string() })) });

/** Asset names in a release tag, via the GitHub API (60 req/h unauthenticated; set GITHUB_TOKEN to lift it). */
export function listAssets(tag: string): Promise<string[]> {
  return memo(`assets:${tag}`, async () => {
    const headers: Record<string, string> = { accept: "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const url = `https://api.github.com/repos/${RELEASE_REPO}/releases/tags/${encodeURIComponent(tag)}`;
    const res = await fetch(url, { headers, next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) throw new Error(`GitHub API ${tag}: HTTP ${res.status}`);
    return Release.parse(await res.json()).assets.map((a) => a.name);
  });
}

/** INT64 parquet columns decode as bigint; every id and count here is far below 2^53. */
export const int64 = z.bigint().transform(Number);
