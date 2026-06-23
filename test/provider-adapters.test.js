import assert from "node:assert/strict";
import test from "node:test";
import { buildClaudeCommand, buildCodexCommand, parseClaudeResponse, parseJsonText, runProviderCommand, validateProviderResponse } from "../src/extract/provider-adapters.js";

const SOURCE_PATH = "/private/tmp/channel-targeting/source.txt";

test("builds a read-only, ephemeral Codex extraction command with project-owned JSON validation", () => {
  const command = buildCodexCommand({ sourcePath: SOURCE_PATH, responsePath: "/private/tmp/response.json", codexBin: "codex-test" });
  assert.equal(command.command, "codex-test");
  assert.equal(command.args.indexOf("--ask-for-approval") < command.args.indexOf("exec"), true);
  assert.equal(command.args.indexOf("--ignore-user-config") > command.args.indexOf("exec"), true);
  assert.equal(command.args.indexOf("--sandbox") > command.args.indexOf("exec"), true);
  assert.equal(command.args.includes("--add-dir"), false);
  assert.equal(command.args[command.args.indexOf("--cd") + 1], "/private/tmp/channel-targeting");
  assert.ok(command.args.includes("exec"));
  assert.ok(command.args.includes("--ephemeral"));
  assert.ok(command.args.includes("read-only"));
  assert.ok(command.args.includes("--ignore-user-config"));
  assert.equal(command.args.includes("--output-schema"), false);
  assert.ok(command.args.includes("--output-last-message"));
  assert.ok(command.args.at(-1).includes(SOURCE_PATH));
  assert.ok(command.args.at(-1).includes("product"));
  assert.ok(command.args.at(-1).includes("preferredChannels"));
});

test("builds a read-only Claude print-mode extraction command", () => {
  const command = buildClaudeCommand({ sourcePath: SOURCE_PATH, claudeBin: "claude-test" });
  assert.equal(command.command, "claude-test");
  assert.deepEqual(command.args.slice(0, 2), ["-p", command.args[1]]);
  assert.ok(command.args.includes("--output-format"));
  assert.ok(command.args.includes("json"));
  assert.ok(command.args.includes("--allowedTools"));
  assert.ok(command.args.includes("Read"));
  assert.ok(command.args.includes("--disallowedTools"));
});

test("accepts only strict strategy responses and parses provider JSON", () => {
  const response = parseClaudeResponse(JSON.stringify({ result: JSON.stringify({ product: "Test product", market: "Test market", keywords: ["known term"] }) }));
  assert.deepEqual(validateProviderResponse(response), { product: "Test product", market: "Test market", keywords: ["known term"] });
  assert.deepEqual(parseJsonText("```json\n{\"product\":\"Test product\",\"market\":\"Test market\"}\n```"), { product: "Test product", market: "Test market" });
  assert.throws(() => validateProviderResponse({ product: "Test product", market: "Test market", explanation: "not allowed" }), { code: "INVALID_RESPONSE" });
  assert.throws(() => validateProviderResponse({ status: "source_unreadable", reason: "File cannot be read" }), { code: "SOURCE_UNREADABLE" });
  assert.throws(() => validateProviderResponse({ status: "source_unreadable", reason: "File cannot be read", detail: "not allowed" }), { code: "INVALID_RESPONSE" });
});

test("normalizes equivalent company-size wording at the provider boundary", () => {
  assert.deepEqual(
    validateProviderResponse({ product: "Test product", market: "Test market", companySizes: ["1000+ employees"] }),
    { product: "Test product", market: "Test market", companySizes: ["1000+"] }
  );
});

test("stops a hung provider command at the requested timeout", async () => {
  const started = Date.now();
  const result = await runProviderCommand(process.execPath, ["-e", "setInterval(() => {}, 1000)"], 25);
  assert.equal(result.ok, false);
  assert.equal(result.timedOut, true);
  assert.ok(Date.now() - started < 1000);
});
