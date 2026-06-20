import { writeFile } from "node:fs/promises";
import { loadBrief } from "./brief/load-brief.js";
import { loadPlatforms } from "./platforms.js";
import { matchStrategyToPlatforms } from "./matcher/match.js";
import { renderMarkdownReport } from "./report/render-markdown.js";

function parseArgs(argv) {
  const args = { inputPath: null, outPath: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--out") {
      args.outPath = argv[index + 1];
      index += 1;
    } else if (!args.inputPath) {
      args.inputPath = value;
    }
  }
  return args;
}

async function main() {
  const { inputPath, outPath } = parseArgs(process.argv.slice(2));
  if (!inputPath) {
    console.error("Usage: npm run report -- <strategy-input.json|brief.md> [--out report.md]");
    process.exitCode = 1;
    return;
  }

  const strategy = await loadBrief(inputPath);
  const platforms = await loadPlatforms();
  const output = matchStrategyToPlatforms(strategy, platforms);
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
