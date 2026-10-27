import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseParquet } from "../lib/data/releases.ts";
import { ShotRow, withDistance } from "../lib/data/shots.ts";

// The real fixture (see helpers.ts), parsed raw so each test controls which distances are missing.
const raw = () => parseParquet(new Uint8Array(readFileSync(new URL("./fixtures/shots_2026_bkn_2000.parquet", import.meta.url))).buffer, ShotRow);

test("the shots schema takes a null shot_distance instead of failing the whole season (1997-98 to 2008-09 have 159)", () => {
  assert.equal(ShotRow.shape.shot_distance.safeParse(null).success, true);
});

test("withDistance fills a missing distance from x/y the way the release rounds it, and leaves the rest alone", async () => {
  const truth = await raw();
  const rows = await raw();
  for (const r of rows) r.shot_distance = null;
  const filled = withDistance(rows);
  // The release records some corner threes (22-23 ft out) at distance 0; everywhere else it is round(hypot / 10).
  const off = filled.flatMap((r, i) => (r.shot_distance === truth[i].shot_distance ? [] : [[truth[i].shot_distance, r.shot_distance]]));
  assert.ok(off.length > 0 && off.length < truth.length * 0.1, `${off.length} of ${truth.length} differ`);
  assert.ok(off.every(([release, derived]) => release === 0 && derived !== null && derived >= 22), "only the release's zero-distance corner threes differ");
  assert.ok(filled.every((r) => Number.isInteger(r.shot_distance) && r.shot_distance >= 0));

  const kept = withDistance(await raw());
  assert.deepEqual(kept.map((r) => r.shot_distance), truth.map((r) => r.shot_distance), "present distances are untouched");
});
