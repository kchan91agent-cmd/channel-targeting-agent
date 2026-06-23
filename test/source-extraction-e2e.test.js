import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { canonicalizeStrategy } from "../src/extract/strategy-input.js";
import { diagnoseExtraction, withEphemeralSource } from "../src/extract/harness.js";
import { loadPlatforms } from "../src/platforms.js";
import { matchStrategyToPlatforms } from "../src/matcher/match.js";
import { renderMarkdownReport } from "../src/report/render-markdown.js";
import { validateStandardOutput } from "../src/report/validate-standard-output.js";

const FIXTURE_ROOT = new URL("./fixtures/source-extraction/equivalent/", import.meta.url);
const CASES = ["messaging-brief", "gtm-plan", "campaign-plan", "executive-memo", "slide-style-narrative", "raw-prose"];

async function fixture(name) {
  return readFile(new URL(`${name}.txt`, FIXTURE_ROOT), "utf8");
}

test("extracts equivalent unstructured artifacts into one normalized strategy and fixed report", async () => {
  const expected = canonicalizeStrategy(JSON.parse(await readFile(new URL("expected.json", FIXTURE_ROOT), "utf8")));
  const platforms = await loadPlatforms();
  const reports = [];
  const temporaryDirectories = [];

  for (const caseId of CASES) {
    const outcome = await withEphemeralSource(caseId, await fixture(caseId), async ({ strategy, extractionError, temporaryDirectory }) => {
      temporaryDirectories.push(temporaryDirectory);
      const report = strategy ? renderMarkdownReport(matchStrategyToPlatforms(strategy, platforms)) : null;
      return { strategy, extractionError, report };
    });
    const diagnosis = diagnoseExtraction({
      caseId,
      expected,
      actual: outcome.strategy,
      extractionError: outcome.extractionError,
      contractErrors: outcome.report ? validateStandardOutput(outcome.report, platforms).errors : []
    });
    assert.deepEqual(diagnosis, { caseId, status: "passed", failureClass: null, owner: null, fieldDiff: [] });
    assert.deepEqual(outcome.strategy, expected);
    reports.push(outcome.report);
  }

  assert.equal(new Set(reports).size, 1, "Equivalent extractions must render the same standardized report.");
  for (const directory of temporaryDirectories) await assert.rejects(access(directory));
});

test("diagnoses extraction, output-contract, and runtime failures without source prose", () => {
  const expected = { product: "Test product", market: "Test market", keywords: ["known term"] };
  assert.deepEqual(diagnoseExtraction({ caseId: "missing-keyword", expected, actual: { product: "Test product", market: "Test market" } }), {
    caseId: "missing-keyword",
    status: "failed",
    failureClass: "extraction-fidelity",
    owner: "source-to-brief extraction",
    fieldDiff: [{ field: "keywords", expectedValueCount: 1, actualValueCount: 0 }]
  });
  assert.equal(diagnoseExtraction({ caseId: "contract", expected, actual: expected, contractErrors: ["missing heading"] }).owner, "output renderer / contract");
  assert.equal(diagnoseExtraction({ caseId: "matcher", expected, actual: expected, matcherErrors: ["registry expectation changed"] }).owner, "matcher or platform registry");
  assert.equal(diagnoseExtraction({ caseId: "runtime", expected, extractionError: "Source extractor did not complete." }).failureClass, "environment");
});
