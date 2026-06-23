import assert from "node:assert/strict";
import test from "node:test";
import { access, writeFile } from "node:fs/promises";
import { analyzeSource, parseAnalyzeSourceArgs } from "../src/analyze-source.js";
import { SourceIngestionError } from "../src/source/ingest.js";

test("parses an explicit provider and exactly one source input", () => {
  assert.deepEqual(parseAnalyzeSourceArgs(["--provider", "codex", "--file", "/tmp/source.docx", "--case", "pilot 1", "--diagnose"]), {
    provider: "codex", filePath: "/tmp/source.docx", url: null, caseId: "pilot-1", diagnose: true
  });
  assert.throws(() => parseAnalyzeSourceArgs(["--provider", "codex"]));
  assert.throws(() => parseAnalyzeSourceArgs(["--provider", "auto", "--file", "/tmp/source.txt"]));
});

test("runs ingestion through extraction and returns a validated standard report without retained temporary source", async () => {
  let temporarySourcePath;
  const result = await analyzeSource(
    { provider: "codex", filePath: "/unused/source.txt", caseId: "sanitized-case" },
    {
      ingestSource: async () => ({ text: "Sanitized source", sourceType: "file" }),
      extractWithProvider: async ({ sourcePath, outPath }) => {
        temporarySourcePath = sourcePath;
        await writeFile(outPath, JSON.stringify({ product: "Test product", market: "Test market", keywords: ["known term"] }));
        return { strategy: { product: "Test product", market: "Test market", keywords: ["known term"] } };
      },
      loadPlatforms: async () => [],
      matchStrategyToPlatforms: (strategy) => ({ strategy }),
      renderMarkdownReport: () => "## Standard report",
      validateStandardOutput: () => ({ valid: true, errors: [] })
    }
  );
  assert.equal(result.report, "## Standard report");
  assert.deepEqual(result.diagnosis, {
    caseId: "sanitized-case", provider: "codex", sourceType: "file", status: "passed", failureClass: null, owner: null, contractErrors: []
  });
  await assert.rejects(access(temporarySourcePath));
});

test("returns redacted ingestion and output-contract diagnoses", async () => {
  const ingestion = await analyzeSource(
    { provider: "claude", url: "https://example.com/source", caseId: "private-case" },
    { ingestSource: async () => { throw new SourceIngestionError("SOURCE_UNREADABLE", "private source detail"); } }
  );
  assert.deepEqual(ingestion.diagnosis, {
    caseId: "private-case", provider: "claude", sourceType: null, status: "inconclusive", failureClass: "source-input", owner: "source ingestion", code: "SOURCE_UNREADABLE"
  });
  const contract = await analyzeSource(
    { provider: "claude", filePath: "/unused", caseId: "contract-case" },
    {
      ingestSource: async () => ({ text: "Sanitized source", sourceType: "file" }),
      extractWithProvider: async ({ outPath }) => {
        await writeFile(outPath, JSON.stringify({ product: "Test product", market: "Test market" }));
        return { strategy: { product: "Test product", market: "Test market" } };
      },
      loadPlatforms: async () => [],
      matchStrategyToPlatforms: (strategy) => ({ strategy }),
      renderMarkdownReport: () => "Incomplete output",
      validateStandardOutput: () => ({ valid: false, errors: ["required heading missing"] })
    }
  );
  assert.equal(contract.diagnosis.failureClass, "output-framework");
  assert.equal(contract.diagnosis.owner, "output renderer / contract");
});
