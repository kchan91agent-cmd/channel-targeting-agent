import { providerPreflight } from "../src/extract/provider-preflight.js";

const provider = process.argv.find((argument) => argument === "codex" || argument === "claude");
const probe = process.argv.includes("--probe");
if (!provider) {
  console.error("Usage: node scripts/provider-preflight.mjs codex|claude [--probe]");
  process.exitCode = 1;
} else {
  try {
    const result = await providerPreflight(provider, { probe });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ready) process.exitCode = 1;
  } catch {
    console.error("PROVIDER_PREFLIGHT_FAILED");
    process.exitCode = 1;
  }
}
