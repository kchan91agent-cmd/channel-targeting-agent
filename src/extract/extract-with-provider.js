#!/usr/bin/env node
import { extractWithProvider, ProviderExtractionError } from "./provider-adapters.js";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

async function main() {
  const provider = argument("--provider");
  const sourcePath = argument("--source");
  const outPath = argument("--out");
  if (!provider || !sourcePath || !outPath) {
    throw new ProviderExtractionError("USAGE", "Usage: node src/extract/extract-with-provider.js --provider codex|claude --source <readable-text-file> --out <strategy.json>");
  }
  await extractWithProvider({ provider, sourcePath, outPath });
}

main().catch((error) => {
  console.error(error instanceof ProviderExtractionError ? error.code : "PROVIDER_EXTRACTION_FAILED");
  process.exitCode = 1;
});
