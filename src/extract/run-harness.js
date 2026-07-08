#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { canonicalizeStrategy } from "./strategy-input.js";
import { diagnoseExtraction, withEphemeralSource } from "./harness.js";
import { loadPlatforms } from "../platforms.js";
import { matchStrategyToPlatforms } from "../matcher/match.js";
import { renderMarkdownReport } from "../report/render-markdown.js";
import { validateStandardOutput } from "../report/validate-standard-output.js";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

async function main() {
  const caseId = argument("--case");
  const sourcePath = argument("--source");
  const expectedPath = argument("--expected");
  if (!caseId || !sourcePath || !expectedPath) {
    throw new Error("Usage: node src/extract/run-harness.js --case <sanitized-id> --source <readable-source> --expected <approved-strategy.json>");
  }

  const [source, expected] = await Promise.all([
    readFile(sourcePath, "utf8"),
    readFile(expectedPath, "utf8").then(JSON.parse)
  ]);
  const platforms = await loadPlatforms();
  const outcome = await withEphemeralSource(caseId, source, async ({ strategy, extractionError }) => {
    if (!strategy) return { extractionError };
    const report = renderMarkdownReport(matchStrategyToPlatforms(strategy, platforms));
    return { strategy, extractionError, contractErrors: validateStandardOutput(report, platforms).errors };
  });
  const diagnosis = diagnoseExtraction({
    caseId,
    expected: canonicalizeStrategy(expected),
    actual: outcome.strategy,
    extractionError: outcome.extractionError,
    contractErrors: outcome.contractErrors ?? []
  });
  console.log(JSON.stringify(diagnosis, null, 2));
  if (diagnosis.status !== "passed") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
