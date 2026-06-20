import { loadPlatforms } from "../platforms.js";
import { checkPlatformFields } from "./field-check.js";

function parsePlatform(argv) {
  const index = argv.indexOf("--platform");
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

async function main() {
  const platformId = parsePlatform(process.argv.slice(2));
  if (!platformId) {
    console.error("Usage: npm run check-fields -- --platform <platform-id>");
    process.exitCode = 1;
    return;
  }

  const platforms = await loadPlatforms();
  const platform = platforms.find((item) => item.id === platformId);
  if (!platform) {
    console.error(`Unknown platform: ${platformId}`);
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(checkPlatformFields(platform), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
