import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getProjectRoot, loadPlatforms } from "./platforms.js";

const BLOCKED_PUBLIC_FIELD_IDS = new Set([
  "audience",
  "customerList",
  "customerMatch",
  "customAudience",
  "matchedAudience",
  "remarketing",
  "retargeting",
  "tailoredAudience",
  "yourData",
  "lookalike"
]);

const FORBIDDEN_KEY_PATTERN = /(?:access|refresh|developer)?token|secret|credential|password|accountid|advertiserid|customerid|userid|audiencesize|reach|raw/i;
const FORBIDDEN_TEXT_PATTERN = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|customer match|remarketing list|website visitor|matched audience|tailored audience|custom audience)/i;
const GENERIC_CAVEAT = "Platform-visible value; availability may vary by account, locale, campaign type, and policy.";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function assertSafeKey(key, pathLabel) {
  if (FORBIDDEN_KEY_PATTERN.test(key)) {
    throw new Error(`Unsafe platform-value key at ${pathLabel}: ${key}`);
  }
}

function assertSafeText(value, pathLabel) {
  if (typeof value === "string" && FORBIDDEN_TEXT_PATTERN.test(value)) {
    throw new Error(`Unsafe platform-value text at ${pathLabel}.`);
  }
}

function walkForUnsafeData(value, pathLabel = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkForUnsafeData(item, `${pathLabel}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      assertSafeKey(key, `${pathLabel}.${key}`);
      walkForUnsafeData(child, `${pathLabel}.${key}`);
    }
    return;
  }
  assertSafeText(value, pathLabel);
}

function publishableDimensions(platform) {
  return platform.targetingDimensions.filter((dimension) => !BLOCKED_PUBLIC_FIELD_IDS.has(dimension.id));
}

export function buildEmptyValueCatalog(platform, { checkedAt = new Date().toISOString() } = {}) {
  return {
    platformId: platform.id,
    platformName: platform.name,
    generatedAt: checkedAt,
    source: {
      mode: "registry-template",
      checkedAt,
      scope: "Publishable field-value template only; no authenticated account objects included.",
      caveats: [GENERIC_CAVEAT]
    },
    fields: publishableDimensions(platform).map((dimension) => ({
      fieldId: dimension.id,
      label: dimension.label,
      inputKeys: dimension.inputKeys,
      status: "ready-for-values",
      values: []
    }))
  };
}

export function validatePublishableCatalog(catalog) {
  if (!catalog || typeof catalog !== "object") throw new Error("Catalog must be an object.");
  if (!catalog.platformId || !catalog.platformName) throw new Error("Catalog requires platformId and platformName.");
  if (!Array.isArray(catalog.fields)) throw new Error("Catalog requires fields array.");

  for (const field of catalog.fields) {
    if (BLOCKED_PUBLIC_FIELD_IDS.has(field.fieldId)) {
      throw new Error(`Field ${field.fieldId} is account-owned or audience-owned and cannot be published.`);
    }
    for (const value of asArray(field.values)) {
      if (!value.label || !value.status || !value.checkedAt || !value.source) {
        throw new Error(`Value under ${field.fieldId} is missing required publishable metadata.`);
      }
      value.caveats ??= [GENERIC_CAVEAT];
    }
  }

  walkForUnsafeData(catalog);
  return catalog;
}

export function catalogPath(platformId, { root = getProjectRoot(), local = false } = {}) {
  const suffix = local ? ".local.json" : ".json";
  return path.join(root, "data", "platform-values", `${platformId}${suffix}`);
}

export async function writePlatformValueCatalog(catalog, options = {}) {
  validatePublishableCatalog(catalog);
  const outputPath = catalogPath(catalog.platformId, options);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return outputPath;
}

export async function loadPlatformValueCatalogs({ root = getProjectRoot() } = {}) {
  const directory = path.join(root, "data", "platform-values");
  let files = [];
  try {
    files = (await readdir(directory)).filter((file) => file.endsWith(".json") && !file.endsWith(".local.json")).sort();
  } catch {
    return [];
  }
  const catalogs = await Promise.all(
    files.map(async (file) => validatePublishableCatalog(JSON.parse(await readFile(path.join(directory, file), "utf8"))))
  );
  return catalogs;
}

export async function buildTemplateCatalogs(platformIds = []) {
  const platforms = await loadPlatforms();
  const requested = new Set(platformIds);
  return platforms
    .filter((platform) => requested.size === 0 || requested.has(platform.id))
    .map((platform) => buildEmptyValueCatalog(platform));
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreValue(value, terms) {
  const haystack = normalizeText([value.label, ...(value.aliases ?? [])].join(" "));
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

export function closestCatalogValues(catalogs, strategy, { limit = 5 } = {}) {
  const terms = [
    ...(strategy.jobTitles ?? []),
    ...(strategy.jobFunctions ?? []),
    ...(strategy.industries ?? []),
    ...(strategy.keywords ?? []),
    ...(strategy.intentSignals ?? []),
    ...(strategy.technographics ?? []),
    ...(strategy.interests ?? []),
    ...(strategy.communities ?? [])
  ].map(normalizeText).filter(Boolean);

  return catalogs.map((catalog) => ({
    platformId: catalog.platformId,
    platformName: catalog.platformName,
    fields: catalog.fields.map((field) => ({
      fieldId: field.fieldId,
      label: field.label,
      values: field.values
        .map((value) => ({ ...value, score: scoreValue(value, terms) }))
        .filter((value) => value.score > 0)
        .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
        .slice(0, limit)
    })).filter((field) => field.values.length > 0)
  })).filter((catalog) => catalog.fields.length > 0);
}
