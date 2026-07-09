#!/usr/bin/env node
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ingestSource, SourceIngestionError } from "./source/ingest.js";
import { extractWithProvider, ProviderExtractionError } from "./extract/provider-adapters.js";
import { loadPlatforms } from "./platforms.js";
import { matchStrategyToPlatforms } from "./matcher/match.js";
import { renderMarkdownReport } from "./report/render-markdown.js";
import { validateStandardOutput } from "./report/validate-standard-output.js";
import { loadPlatformValueCatalogs } from "./platform-values.js";

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1] ?? null;
}

function flag(argv, name) {
  return argv.includes(name);
}

function safeCaseId(value) {
  return (value ?? "source-run").replace(/[^a-z0-9_-]/gi, "-").slice(0, 80) || "source-run";
}

export function parseAnalyzeSourceArgs(argv) {
  const provider = argument(argv, "--provider");
  const filePath = argument(argv, "--file");
  const url = argument(argv, "--url");
  if (!provider || !new Set(["codex", "claude"]).has(provider)) throw new Error("Usage requires --provider codex|claude.");
  if (Boolean(filePath) === Boolean(url)) throw new Error("Usage requires exactly one of --file <path> or --url <public-https-url>.");
  return { provider, filePath, url, caseId: safeCaseId(argument(argv, "--case")), diagnose: flag(argv, "--diagnose") };
}

function diagnosis({ caseId, provider, sourceType, error, contractErrors = [] }) {
  if (error instanceof SourceIngestionError) {
    return { caseId, provider, sourceType: null, status: "inconclusive", failureClass: "source-input", owner: "source ingestion", code: error.code };
  }
  if (error instanceof ProviderExtractionError) {
    return {
      caseId,
      provider,
      sourceType,
      status: "inconclusive",
      failureClass: error.code === "SOURCE_UNREADABLE" ? "extraction-fidelity" : "environment",
      owner: error.code === "SOURCE_UNREADABLE" ? "source-to-brief extraction" : null,
      code: error.code
    };
  }
  if (error) return { caseId, provider, sourceType, status: "inconclusive", failureClass: "environment", owner: null, code: "ANALYSIS_FAILED" };
  if (contractErrors.length > 0) {
    return { caseId, provider, sourceType, status: "failed", failureClass: "output-framework", owner: "output renderer / contract", contractErrors };
  }
  return { caseId, provider, sourceType, status: "passed", failureClass: null, owner: null, contractErrors: [] };
}

export async function analyzeSource({ provider, filePath, url, caseId = "source-run" }, dependencies = {}) {
  const ingest = dependencies.ingestSource ?? ingestSource;
  const extract = dependencies.extractWithProvider ?? extractWithProvider;
  const platformsLoader = dependencies.loadPlatforms ?? loadPlatforms;
  const platformValueCatalogsLoader = dependencies.loadPlatformValueCatalogs ?? loadPlatformValueCatalogs;
  const match = dependencies.matchStrategyToPlatforms ?? matchStrategyToPlatforms;
  const render = dependencies.renderMarkdownReport ?? renderMarkdownReport;
  const validate = dependencies.validateStandardOutput ?? validateStandardOutput;
  let sourceType = null;
  let temporaryDirectory;

  try {
    const ingested = await ingest({ filePath, url });
    sourceType = ingested.sourceType;
    temporaryDirectory = await mkdtemp(join(tmpdir(), "channel-targeting-analysis-"));
    await chmod(temporaryDirectory, 0o700);
    const readableSourcePath = join(temporaryDirectory, "source.txt");
    const briefPath = join(temporaryDirectory, "normalized-brief.json");
    await writeFile(readableSourcePath, ingested.text, { encoding: "utf8", mode: 0o600 });
    const { strategy } = await extract({ provider, sourcePath: readableSourcePath, outPath: briefPath });
    await chmod(briefPath, 0o600);
    const platforms = await platformsLoader();
    const platformValueCatalogs = await platformValueCatalogsLoader();
    const report = render(match(strategy, platforms, { platformValueCatalogs }));
    const contractErrors = validate(report, platforms).errors;
    return { report, diagnosis: diagnosis({ caseId, provider, sourceType, contractErrors }) };
  } catch (error) {
    return { report: null, diagnosis: diagnosis({ caseId, provider, sourceType, error }) };
  } finally {
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function main() {
  let args;
  try {
    args = parseAnalyzeSourceArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  const result = await analyzeSource(args);
  if (result.report) console.log(result.report);
  if (args.diagnose) console.log(`\n--- Redacted diagnosis ---\n${JSON.stringify(result.diagnosis, null, 2)}`);
  if (result.diagnosis.status !== "passed") {
    if (!args.diagnose) console.error(result.diagnosis.code ?? result.diagnosis.failureClass);
    process.exitCode = 1;
  }
}

if (import.meta.url === new URL(process.argv[1], "file:").href) main();
