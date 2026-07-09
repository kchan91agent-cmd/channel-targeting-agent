import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadLocalEnv } from "../src/env.js";

test("loads local env files without overriding existing environment values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "channel-targeting-env-test-"));
  const envPath = join(directory, ".env");
  const env = { EXISTING: "keep" };
  try {
    await writeFile(envPath, "TOKEN=local\nEXISTING=replace\nQUOTED=\"hello world\"\n# comment\n", "utf8");
    const result = await loadLocalEnv({ envPath, env });
    assert.deepEqual(result, { loaded: true, keys: ["TOKEN", "QUOTED"] });
    assert.equal(env.TOKEN, "local");
    assert.equal(env.EXISTING, "keep");
    assert.equal(env.QUOTED, "hello world");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
