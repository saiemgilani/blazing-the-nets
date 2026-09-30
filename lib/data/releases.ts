import { asyncBufferFromUrl, parquetMetadataAsync, parquetReadObjects, type AsyncBuffer } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import { z } from "zod";

export const RELEASE_REPO = "sportsdataverse/sportsdataverse-data";

/** ISR window (6 h). The nightly hoopR-nba-stats-data producer refreshes the releases. */
export const REVALIDATE_SECONDS = 21600;

/** Decoded assets kept per release tag (so at most 4 seasons of shots are resident). */
export const MAX_RESIDENT_PER_TAG = 4;

/** The asset does not exist (HTTP 404). A failed fetch (403, 429, 5xx) is a plain Error: its answer is unknown. */
export class AssetMissingError extends Error {}

export function releaseUrl(tag: string, asset: string): string {
  return `https://github.com/${RELEASE_REPO}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(asset)}`;
}

type Entry = { at: number; value: Promise<unknown> };
const groups = new Map<string, Map<string, Entry>>();

/**
 * Per-process LRU memo of an async load: `MAX_RESIDENT_PER_TAG` entries per group, each kept for
 * one ISR window. A rejected load is evicted as soon as it settles, so one failed download cannot
 * poison the cache. Exported for tests.
 */
export function memo<T>(group: string, key: string, load: () => Promise<T>, now: number = Date.now()): Promise<T> {
  let cache = groups.get(group);
  if (!cache) groups.set(group, (cache = new Map()));
  const hit = cache.get(key);
  cache.delete(key); // re-inserted below: Map order is the LRU order
  if (hit && now - hit.at < REVALIDATE_SECONDS * 1000) {
    cache.set(key, hit);
    return hit.value as Promise<T>;
  }
  const value = load();
  const entry = { at: now, value };
  cache.set(key, entry);
  for (const oldest of cache.keys()) {
    if (cache.size <= MAX_RESIDENT_PER_TAG) break;
    cache.delete(oldest);
  }
  value.catch(() => {
    if (cache.get(key) === entry) cache.delete(key);
  });
  return value;
}

const init = { next: { revalidate: REVALIDATE_SECONDS } } satisfies RequestInit;

/** Per-request timeout. */
export const FETCH_TIMEOUT_MS = 20_000;

/** Wait before a retry (doubled on the second). */
export const RETRY_DELAY_MS = 500;

/**
 * fetch with a fresh AbortSignal.timeout per attempt (a shared signal would expire for later
 * calls) and one retry, after a short backoff, on a network error or a 5xx. Never on a 4xx: a 404
 * is an answer ("not in the release"), not a failure.
 */
export async function timedFetch(
  input: RequestInfo | URL,
  options?: RequestInit,
  { retries = 1, delayMs = RETRY_DELAY_MS }: { retries?: number; delayMs?: number } = {},
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(input, { ...options, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (res.status < 500 || attempt >= retries) return res;
      await res.body?.cancel();
    } catch (e) {
      if (attempt >= retries) throw e;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
  }
}

/**
 * A byte-range view of a release asset. The size comes from a one-byte `Range: bytes=0-0` GET
 * (its 206 Content-Range), not a HEAD: Next's data cache would keep a HEAD's size for 6 h while the
 * range reads hit the live file, so a replaced file would fail to decode. 206 responses are never
 * cached. (GitHub's asset host answers suffix ranges, `bytes=-N`, with 501.) Then `Range` GETs for
 * the footer and the column chunks read. 404 -> AssetMissingError.
 */
export async function openAsset(tag: string, asset: string): Promise<AsyncBuffer> {
  const url = releaseUrl(tag, asset);
  const res = await timedFetch(url, { ...init, headers: { range: "bytes=0-0" } });
  if (res.status === 404) throw new AssetMissingError(`${tag}/${asset}: not in the release`);
  if (!res.ok) throw new Error(`${tag}/${asset}: HTTP ${res.status}`);
  if (res.status === 200) {
    // The server ignored the range and sent the whole file: use it.
    const whole = await res.arrayBuffer();
    return { byteLength: whole.byteLength, slice: (start, end) => whole.slice(start, end) };
  }
  await res.body?.cancel();
  const total = Number(/\/(\d+)$/.exec(res.headers.get("content-range") ?? "")?.[1]);
  if (!(total > 0)) throw new Error(`${tag}/${asset}: no size in Content-Range`);
  return asyncBufferFromUrl({ url, byteLength: total, requestInit: init, fetch: timedFetch });
}

/**
 * Decode parquet into rows validated by `row`; only the schema's columns are read. Every row group
 * is read: the release files hold two mixed-team groups and the views need whole seasons.
 */
export async function parseParquet<S extends z.ZodObject>(file: AsyncBuffer, row: S): Promise<z.output<S>[]> {
  const metadata = await parquetMetadataAsync(file, { initialFetchSize: 1 << 16 });
  const raw = await parquetReadObjects({ file, metadata, columns: Object.keys(row.shape), compressors });
  return z.array(row).parse(raw);
}

/**
 * Typed rows of a release asset, memoised per process. With `optional`, a missing asset reads as
 * no rows (and that answer is cached too); any other failure still throws.
 */
export function readParquet<S extends z.ZodObject>(
  tag: string,
  asset: string,
  row: S,
  { optional = false }: { optional?: boolean } = {},
): Promise<z.output<S>[]> {
  const key = `${asset}#${Object.keys(row.shape).join(",")}${optional ? "?" : ""}`;
  return memo(tag, key, async () => {
    try {
      return await parseParquet(await openAsset(tag, asset), row);
    } catch (e) {
      if (optional && e instanceof AssetMissingError) return [];
      throw e;
    }
  });
}

/** INT64 parquet columns decode as bigint; every id and count here is far below 2^53. */
export const int64 = z.bigint().transform(Number);
