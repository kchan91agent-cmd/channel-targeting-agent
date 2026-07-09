import { loadPlatforms } from "../platforms.js";
import { buildEmptyValueCatalog, buildOfficialDocCatalogs, validatePublishableCatalog, writePlatformValueCatalog } from "../platform-values.js";
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
    "Usage: npm run refresh-values -- [--platform <id|comma-list>] [--source <templates|official-docs>] [--write|--write-templates]",
    "",
    "This command creates publishable field-value catalogs without credentials.",
    "--source templates creates empty registry-backed templates.",
    "--source official-docs creates curated official-doc-backed categories.",
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
  const source = valuesAfterFlag(argv, "--source")[0] || "templates";
  const shouldWrite = argv.includes("--write") || argv.includes("--write-templates");
  const platformIds = requested.length > 0 ? requested : DEFAULT_PLATFORMS;
  const platforms = await loadPlatforms();
  const selected = platforms.filter((platform) => platformIds.includes(platform.id));
  const unknown = platformIds.filter((id) => !platforms.some((platform) => platform.id === id));

  if (unknown.length > 0) {
    console.error(`Unknown platform(s): ${unknown.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  if (!["templates", "official-docs"].includes(source)) {
    console.error(`Unknown source: ${source}`);
    process.exitCode = 1;
    return;
  }

  const catalogs = source === "official-docs"
    ? await buildOfficialDocCatalogs(platformIds)
    : selected.map((platform) => validatePublishableCatalog(buildEmptyValueCatalog(platform)));

  if (!shouldWrite) {
    console.log(JSON.stringify({
      mode: source === "templates" ? "template-preview" : `${source}-preview`,
      note: `No files written. Rerun with ${source === "official-docs" ? "--write" : "--write-templates"} to update publishable catalogs.`,
      catalogs
    }, null, 2));
    return;
  }

  const written = [];
  for (const catalog of catalogs) written.push(await writePlatformValueCatalog(catalog));
  console.log(JSON.stringify({ mode: source === "templates" ? "templates-written" : `${source}-written`, written }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
