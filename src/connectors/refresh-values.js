import { loadPlatforms } from "../platforms.js";
import { buildEmptyValueCatalog, validatePublishableCatalog, writePlatformValueCatalog } from "../platform-values.js";
import { loadLocalEnv } from "../env.js";

const DEFAULT_PLATFORMS = ["linkedin-ads", "meta-ads", "google-ads-youtube", "microsoft-ads", "reddit-ads"];

function valuesAfterFlag(argv, flag) {
  const index = argv.indexOf(flag);
  if (index === -1) return [];
  const value = argv[index + 1];
  return value && !value.startsWith("--") ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function help() {
  return [
    "Usage: npm run refresh-values -- [--platform <id|comma-list>] [--write-templates]",
    "",
    "This command creates publishable field-value catalog templates only.",
    "Authenticated value pulls are intentionally not enabled until a platform adapter can sanitize raw responses.",
    "Private account objects such as custom audiences, matched audiences, remarketing lists, reach, and raw responses are blocked."
  ].join("\n");
}

async function main() {
  await loadLocalEnv();
  const argv = process.argv.slice(2);
  if (argv.includes("--help")) {
    console.log(help());
    return;
  }

  const requested = valuesAfterFlag(argv, "--platform");
  const shouldWrite = argv.includes("--write-templates");
  const platformIds = requested.length > 0 ? requested : DEFAULT_PLATFORMS;
  const platforms = await loadPlatforms();
  const selected = platforms.filter((platform) => platformIds.includes(platform.id));
  const unknown = platformIds.filter((id) => !platforms.some((platform) => platform.id === id));

  if (unknown.length > 0) {
    console.error(`Unknown platform(s): ${unknown.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const catalogs = selected.map((platform) => validatePublishableCatalog(buildEmptyValueCatalog(platform)));

  if (!shouldWrite) {
    console.log(JSON.stringify({
      mode: "template-preview",
      note: "No files written. Rerun with --write-templates to create publishable empty catalogs.",
      catalogs
    }, null, 2));
    return;
  }

  const written = [];
  for (const catalog of catalogs) written.push(await writePlatformValueCatalog(catalog));
  console.log(JSON.stringify({ mode: "templates-written", written }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
