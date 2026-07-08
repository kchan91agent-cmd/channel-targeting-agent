import assert from "node:assert/strict";
import test from "node:test";
import { portabilityViolations } from "../scripts/check-portability.mjs";

test("keeps the shareable project isolated and portable", async () => {
  assert.deepEqual(await portabilityViolations(), []);
});
