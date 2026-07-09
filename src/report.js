import { writeFile } from "node:fs/promises";
import { loadBrief } from "./brief/load-brief.js";
import { loadPlatforms } from "./platforms.js";
import { matchStrategyToPlatforms } from "./matcher/match.js";
import { renderMarkdownReport } from "./report/render-markdown.js";
import { checkPlatformFields } from "./connectors/field-check.js";
import { loadLocalEnv } from "./env.js";
import { loadPlatformValueCatalogs } from "./platform-values.js";

function parseArgs(argv) {
  const args = { inputPath: null, outPath: null, withFieldChecks: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--out") {
      args.outPath = argv[index + 1];
      index += 1;
    } else if (value === "--with-field-checks") {
      args.withFieldChecks = true;
    } else if (!args.inputPath) {
      args.inputPath = value;
    }
  }
  return args;
}

async function main() {
  await loadLocalEnv();
  const { inputPath, outPath, withFieldChecks } = parseArgs(process.argv.slice(2));
  if (!inputPath) {
    console.error("Usage: npm run report -- <strategy-input.json|brief.md> [--with-field-checks] [--out report.md]");
    process.exitCode = 1;
    return;
  }

  const strategy = await loadBrief(inputPath);
  const platforms = await loadPlatforms();
  const platformValueCatalogs = await loadPlatformValueCatalogs();
  const fieldChecks = withFieldChecks
    ? new Map((await Promise.all(platforms.map(async (platform) => [platform.id, await checkPlatformFields(platform)]))))
    : new Map();
  const output = matchStrategyToPlatforms(strategy, platforms, { fieldChecks, platformValueCatalogs });
  const report = renderMarkdownReport(output);

  if (outPath) {
    await writeFile(outPath, report, "utf8");
    console.log(`Wrote ${outPath}`);
    return;
  }

  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
