import assert from "node:assert/strict";
import { test } from "node:test";
import { AssetMissingError, openAsset, timedFetch } from "../lib/data/releases.ts";

/** Swap global fetch for a scripted one for the length of `run`. */
async function withFetch(script: (() => Response | Promise<Response>)[], run: () => Promise<void>): Promise<number> {
  const real = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    const step = script[Math.min(calls, script.length - 1)];
    calls += 1;
    return step();
  };
  try {
    await run();
  } finally {
    globalThis.fetch = real;
  }
  return calls;
}

const fast = { delayMs: 0 };

test("timedFetch retries once on a network error or a 5xx, never on a 404", async () => {
  const reset = () => Promise.reject(new TypeError("fetch failed: ECONNRESET"));
  let calls = await withFetch([reset, () => new Response("ok")], async () => {
    assert.equal((await timedFetch("https://example.test/a", undefined, fast)).status, 200);
  });
  assert.equal(calls, 2);

  calls = await withFetch([() => new Response("busy", { status: 503 }), () => new Response("ok")], async () => {
    assert.equal((await timedFetch("https://example.test/a", undefined, fast)).status, 200);
  });
  assert.equal(calls, 2);

  calls = await withFetch([() => new Response("gone", { status: 404 })], async () => {
    assert.equal((await timedFetch("https://example.test/a", undefined, fast)).status, 404);
  });
  assert.equal(calls, 1, "a 404 is an answer, not a failure");

  calls = await withFetch([reset], async () => {
    await assert.rejects(timedFetch("https://example.test/a", undefined, fast), /ECONNRESET/);
  });
  assert.equal(calls, 2, "one retry, then the error surfaces");

  calls = await withFetch([() => new Response("busy", { status: 502 })], async () => {
    assert.equal((await timedFetch("https://example.test/a", undefined, fast)).status, 502);
  });
  assert.equal(calls, 2);
});

test("timedFetch retries a body that fails mid-read, and hands back the buffered body", async () => {
  const brokenBody = () =>
    new Response(
      new ReadableStream({
        pull(controller) {
          controller.error(new TypeError("terminated: ECONNRESET"));
        },
      }),
      { status: 206 },
    );
  const calls = await withFetch([brokenBody, () => new Response("bytes", { status: 206 })], async () => {
    const res = await timedFetch("https://example.test/a", undefined, fast);
    assert.equal(res.status, 206);
    assert.equal(await res.text(), "bytes");
  });
  assert.equal(calls, 2);
});

test("openAsset: the size from a 206's Content-Range, the whole body on a 200, 404 is missing", async () => {
  await withFetch([() => new Response("P", { status: 206, headers: { "content-range": "bytes 0-0/123456" } })], async () => {
    assert.equal((await openAsset("tag", "a.parquet")).byteLength, 123456);
  });
  await withFetch([() => new Response("P", { status: 206 })], async () => {
    await assert.rejects(openAsset("tag", "a.parquet"), /no size in Content-Range/);
  });
  await withFetch([() => new Response("P", { status: 206, headers: { "content-range": "bytes 0-0/*" } })], async () => {
    await assert.rejects(openAsset("tag", "a.parquet"), /no size in Content-Range/, "an unknown total is not a size");
  });
  await withFetch([() => new Response("PAR1-whole-file", { status: 200 })], async () => {
    const file = await openAsset("tag", "a.parquet");
    assert.equal(file.byteLength, 15, "the server ignored the range: use what it sent");
    assert.equal(new TextDecoder().decode(await file.slice(0, 4)), "PAR1");
  });
  await withFetch([() => new Response("gone", { status: 404 })], async () => {
    await assert.rejects(openAsset("tag", "a.parquet"), AssetMissingError);
  });
  await withFetch([() => new Response("no", { status: 403 })], async () => {
    await assert.rejects(openAsset("tag", "a.parquet"), (e) => !(e instanceof AssetMissingError) && /HTTP 403/.test(String(e)), "a 403 is a failure, not a missing asset");
  });
});
