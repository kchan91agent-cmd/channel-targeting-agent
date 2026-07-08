import { writeFile } from "node:fs/promises";
import path from "node:path";
import { getProjectRoot, loadPlatforms } from "../platforms.js";
import { checkSourceUrl, missingAuth } from "./source-check.js";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const platforms = await loadPlatforms();
  const checks = [];

  for (const platform of platforms) {
    const sourceCheck = await checkSourceUrl(platform);
    checks.push({
      ...sourceCheck,
      authRequired: Boolean(platform.liveCheck?.authRequired),
      missingAuth: missingAuth(platform)
    });
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    note: "Source URL checks only. Authenticated platform-field checks are intentionally not run unless connector credentials are added.",
    checks
  };

  if (dryRun) {
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  const outputPath = path.join(getProjectRoot(), "data", "snapshots", "latest-source-check.local.json");
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
