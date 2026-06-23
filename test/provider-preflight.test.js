import assert from "node:assert/strict";
import test from "node:test";
import { providerPreflight } from "../src/extract/provider-preflight.js";

test("requires an installed and authenticated Codex provider", async () => {
  const calls = [];
  const result = await providerPreflight("codex", {
    env: { CODEX_BIN: "codex-test" },
    runner: async (command, args) => {
      calls.push([command, args]);
      return { ok: true, stdout: args[0] === "--version" ? "codex-cli 1.2.3\n" : "Logged in\n" };
    }
  });
  assert.deepEqual(result, { provider: "codex", ready: true, code: null, version: "codex-cli 1.2.3", authentication: "verified" });
  assert.deepEqual(calls, [["codex-test", ["--version"]], ["codex-test", ["login", "status"]]]);
});

test("returns redacted unavailable and Claude live-run states", async () => {
  const unavailable = await providerPreflight("claude", { runner: async () => ({ ok: false, stdout: "private error" }) });
  assert.deepEqual(unavailable, { provider: "claude", ready: false, code: "PROVIDER_UNAVAILABLE", version: null, authentication: "not-checked" });
  const claude = await providerPreflight("claude", { runner: async () => ({ ok: true, stdout: "2.0.0\n" }) });
  assert.deepEqual(claude, { provider: "claude", ready: true, code: null, version: "2.0.0", authentication: "verified-by-live-run" });
});

test("uses a bounded Codex runtime probe only when explicitly requested", async () => {
  const calls = [];
  const result = await providerPreflight("codex", {
    env: { CODEX_BIN: "codex-test" },
    probe: true,
    timeoutMs: 25,
    runner: async (command, args, timeoutMs) => {
      calls.push([command, args, timeoutMs]);
      return { ok: true, stdout: args[0] === "--version" ? "codex-cli 1.2.3\n" : "" };
    }
  });
  assert.deepEqual(result, { provider: "codex", ready: true, code: null, version: "codex-cli 1.2.3", authentication: "verified", runtime: "verified" });
  assert.equal(calls.length, 3);
  assert.equal(calls[2][1].includes("--ignore-user-config"), true);
  assert.equal(calls[2][1].includes("Reply with exactly this JSON and nothing else: {\"status\":\"ready\"}"), true);
  assert.equal(calls.every((call) => call[2] === 25), true);
});

test("reports a failed Codex runtime probe without source content", async () => {
  let call = 0;
  const result = await providerPreflight("codex", {
    probe: true,
    runner: async (_command, args) => {
      call += 1;
      return { ok: call < 3, stdout: args[0] === "--version" ? "codex-cli 1.2.3\n" : "" };
    }
  });
  assert.deepEqual(result, { provider: "codex", ready: false, code: "PROVIDER_RUNTIME_UNAVAILABLE", version: "codex-cli 1.2.3", authentication: "verified", runtime: "not-verified" });
});
