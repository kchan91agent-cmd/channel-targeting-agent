import assert from "node:assert/strict";
import test from "node:test";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canonicalizeStrategy } from "../src/extract/strategy-input.js";
import { extractWithProvider } from "../src/extract/provider-adapters.js";
import { providerPreflight } from "../src/extract/provider-preflight.js";
import { loadPlatforms } from "../src/platforms.js";
import { matchStrategyToPlatforms } from "../src/matcher/match.js";
import { renderMarkdownReport } from "../src/report/render-markdown.js";
import { validateStandardOutput } from "../src/report/validate-standard-output.js";

const enabled = process.env.RUN_LIVE_PROVIDER_TESTS === "1";
const provider = process.env.LIVE_PROVIDER;
const repetitions = Number(process.env.LIVE_PROVIDER_REPETITIONS ?? "3");
const FIXTURE_ROOT = new URL("./fixtures/source-extraction/equivalent/", import.meta.url);
const CASES = ["messaging-brief", "gtm-plan", "campaign-plan", "executive-memo", "slide-style-narrative", "raw-prose"];

test("live provider preserves normalized facts and the fixed output framework", { skip: !enabled }, async () => {
  assert.ok(["codex", "claude"].includes(provider), "LIVE_PROVIDER must be codex or claude.");
  assert.ok(Number.isInteger(repetitions) && repetitions >= 1 && repetitions <= 3, "LIVE_PROVIDER_REPETITIONS must be between 1 and 3.");
  const preflight = await providerPreflight(provider);
  assert.equal(preflight.ready, true, `${provider} preflight must pass before live acceptance.`);
  const expected = canonicalizeStrategy(JSON.parse(await readFile(new URL("expected.json", FIXTURE_ROOT), "utf8")));
  const platforms = await loadPlatforms();
  const reports = [];
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "channel-targeting-live-provider-"));

  try {
    await chmod(temporaryDirectory, 0o700);
    for (const caseId of CASES) {
      const source = await readFile(new URL(`${caseId}.txt`, FIXTURE_ROOT), "utf8");
      for (let run = 0; run < repetitions; run += 1) {
        const sourcePath = join(temporaryDirectory, `${caseId}-${run}.txt`);
        const briefPath = join(temporaryDirectory, `${caseId}-${run}.json`);
        await writeFile(sourcePath, source, { encoding: "utf8", mode: 0o600 });
        const { strategy } = await extractWithProvider({ provider, sourcePath, outPath: briefPath });
        assert.deepEqual(strategy, expected, `${provider} extraction mismatch for ${caseId}, run ${run + 1}.`);
        const report = renderMarkdownReport(matchStrategyToPlatforms(strategy, platforms));
        assert.deepEqual(validateStandardOutput(report, platforms), { valid: true, errors: [] });
        reports.push(report);
      }
    }
    assert.equal(new Set(reports).size, 1, "Equivalent live-provider runs must render the same report.");
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
