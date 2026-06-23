import assert from "node:assert/strict";
import test from "node:test";
import { platformFreshness, registryFreshnessSummary } from "../src/connectors/freshness.js";

test("treats registry entries inside their declared cadence as current", () => {
  const result = platformFreshness(
    { id: "social", refreshCadence: "monthly", sourceCheckedAt: "2026-06-13" },
    { now: new Date("2026-06-22T12:00:00Z") }
  );
  assert.deepEqual(result, { platformId: "social", status: "current", checkedAt: "2026-06-13", ageDays: 9, maxAgeDays: 35 });
});

test("flags only the stale registry entries without changing matching behavior", () => {
  const summary = registryFreshnessSummary([
    { id: "current", refreshCadence: "monthly", sourceCheckedAt: "2026-06-13" },
    { id: "stale", refreshCadence: "monthly", sourceCheckedAt: "2026-04-01" }
  ], { now: new Date("2026-06-22T12:00:00Z") });
  assert.equal(summary.status, "stale");
  assert.equal(summary.platforms[0].status, "current");
  assert.equal(summary.platforms[1].status, "stale");
});
