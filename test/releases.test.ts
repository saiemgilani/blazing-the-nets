import assert from "node:assert/strict";
import { test } from "node:test";
import { timedFetch } from "../lib/data/releases.ts";

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
