import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { canonicalizeStrategy, diffStrategy, validateStrategyInput } from "./strategy-input.js";

export function extractorScriptPath(moduleUrl = import.meta.url) {
  return fileURLToPath(new URL("./extract-source.js", moduleUrl));
}

function defaultExtractor() {
  return { command: process.execPath, args: [extractorScriptPath()] };
}

function configuredExtractor() {
  const command = process.env.CHANNEL_TARGETING_EXTRACTOR;
  if (!command) return defaultExtractor();
  const rawArgs = process.env.CHANNEL_TARGETING_EXTRACTOR_ARGS ?? "[]";
  let args;
  try {
    args = JSON.parse(rawArgs);
  } catch {
    throw new Error("CHANNEL_TARGETING_EXTRACTOR_ARGS must be a JSON array.");
  }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) throw new Error("CHANNEL_TARGETING_EXTRACTOR_ARGS must be a JSON array of strings.");
  return { command, args };
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => resolve({ ok: false, error: error.message }));
    child.on("close", (code) => resolve({ ok: code === 0, error: stderr.trim() || `Extractor exited ${code}.` }));
  });
}

export function diagnoseExtraction({ caseId, expected, actual, extractionError, contractErrors = [], matcherErrors = [], reportEqual = true }) {
  if (extractionError) return { caseId, status: "inconclusive", failureClass: "environment", owner: null, details: [extractionError] };
  const fieldDiff = diffStrategy(expected, actual).map(({ field, expected: expectedValue, actual: actualValue }) => ({
    field,
    expectedValueCount: Array.isArray(expectedValue) ? expectedValue.length : expectedValue ? 1 : 0,
    actualValueCount: Array.isArray(actualValue) ? actualValue.length : actualValue ? 1 : 0
  }));
  if (fieldDiff.length > 0) return { caseId, status: "failed", failureClass: "extraction-fidelity", owner: "source-to-brief extraction", fieldDiff };
  if (contractErrors.length > 0 || !reportEqual) return {
    caseId,
    status: "failed",
    failureClass: "output-framework",
    owner: "output renderer / contract",
    contractErrors,
    reportEqual
  };
  if (matcherErrors.length > 0) return {
    caseId,
    status: "failed",
    failureClass: "matcher-platform-registry",
    owner: "matcher or platform registry",
    matcherErrors
  };
  return { caseId, status: "passed", failureClass: null, owner: null, fieldDiff: [] };
}

export async function withEphemeralSource(caseId, source, callback) {
  const directory = await mkdtemp(join(tmpdir(), "channel-targeting-extraction-"));
  try {
    await chmod(directory, 0o700);
    const sourcePath = join(directory, `${basename(caseId)}.txt`);
    const briefPath = join(directory, "normalized-brief.json");
    await writeFile(sourcePath, source, { encoding: "utf8", mode: 0o600 });
    const extractor = configuredExtractor();
    const extraction = await run(extractor.command, [...extractor.args, "--source", sourcePath, "--out", briefPath]);
    if (!extraction.ok) return callback({ extractionError: "Source extractor did not complete.", temporaryDirectory: directory });
    let brief;
    try {
      await chmod(briefPath, 0o600);
      brief = JSON.parse(await readFile(briefPath, "utf8"));
    } catch {
      return callback({ extractionError: "Source extractor did not produce readable JSON.", temporaryDirectory: directory });
    }
    const validation = validateStrategyInput(brief);
    if (!validation.valid) return callback({ extractionError: `Normalized brief is invalid: ${validation.errors.join(" ")}`, temporaryDirectory: directory });
    return callback({ strategy: canonicalizeStrategy(brief), temporaryDirectory: directory });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
