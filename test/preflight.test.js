import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFile = promisify(execFileCallback);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDirectory, "..");
const preflightPath = path.join(projectRoot, "scripts", "preflight.sh");

async function createFakeCommand(directory, name, body) {
  const commandPath = path.join(directory, name);
  await writeFile(commandPath, `#!/bin/sh\n${body}\n`, "utf8");
  await chmod(commandPath, 0o755);
}

async function runPreflight(pathValue) {
  return execFile("/bin/sh", [preflightPath], {
    env: { ...process.env, PATH: pathValue },
    encoding: "utf8"
  });
}

test("preflight gives a clear remediation message when Node is absent", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "channel-targeting-preflight-"));
  try {
    await assert.rejects(
      runPreflight(directory),
      (error) =>
        error.code === 1 &&
        error.stderr.includes("requires a working Node.js 20+ runtime") &&
        error.stderr.includes("https://nodejs.org/en/download")
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("preflight rejects Node versions below 20", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "channel-targeting-preflight-"));
  try {
    await createFakeCommand(directory, "node", 'if [ "$1" = "--version" ]; then echo "v18.20.0"; fi');
    await assert.rejects(
      runPreflight(directory),
      (error) =>
        error.code === 1 &&
        error.stderr.includes("requires Node.js 20 or newer") &&
        error.stderr.includes("https://nodejs.org/en/download")
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("preflight accepts Node 20+ without npm and provides direct commands", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "channel-targeting-preflight-"));
  try {
    await createFakeCommand(directory, "node", 'if [ "$1" = "--version" ]; then echo "v20.18.0"; fi');
    const { stdout } = await runPreflight(directory);
    assert.ok(stdout.includes("Node.js v20.18.0 detected."));
    assert.ok(stdout.includes("npm is not available. Core report commands can run only when dependencies are already installed."));
    assert.ok(stdout.includes("Full source ingestion requires npm ci"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("preflight detects npm when it is available", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "channel-targeting-preflight-"));
  try {
    await createFakeCommand(directory, "node", 'if [ "$1" = "--version" ]; then echo "v22.11.0"; fi');
    await createFakeCommand(directory, "npm", 'if [ "$1" = "--version" ]; then echo "10.9.0"; fi');
    const { stdout } = await runPreflight(directory);
    assert.ok(stdout.includes("npm 10.9.0 detected. Run: npm ci, then npm test"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
