import { loadBrief } from "./brief/load-brief.js";
import { loadPlatforms } from "./platforms.js";
import { matchStrategyToPlatforms } from "./matcher/match.js";

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: npm run match -- <strategy-input.json>");
    process.exitCode = 1;
    return;
  }

  const strategy = await loadBrief(inputPath);
  const platforms = await loadPlatforms();
  const output = matchStrategyToPlatforms(strategy, platforms);
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
