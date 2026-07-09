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

const FORBIDDEN_KEY_PATTERN = /(?:access|refresh|developer)?[_ -]?token|secret|credential|password|account[_ -]?id|advertiser[_ -]?id|customer[_ -]?id|user[_ -]?id|audience[_ -]?size|reach|raw/i;
const FORBIDDEN_TEXT_PATTERN = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|customer match|customer list|account list|contact list|suppression list|remarketing list|website visitor|matched audience|tailored audience|custom audience|audience size|reach estimate)/i;
const GENERIC_CAVEAT = "Platform-visible value; availability may vary by account, locale, campaign type, and policy.";
const DOCS_CAVEAT = "Official documentation confirms this category, but exact selectable values may vary by account, locale, campaign type, and policy.";
const VALID_CONFIDENCES = new Set(["low", "medium", "high"]);
const CATALOG_KEYS = new Set(["platformId", "platformName", "generatedAt", "source", "fields"]);
const CATALOG_SOURCE_KEYS = new Set(["mode", "checkedAt", "scope", "caveats"]);
const FIELD_KEYS = new Set(["fieldId", "label", "inputKeys", "status", "values"]);
const VALUE_KEYS = new Set([
  "label",
  "platformValueId",
  "aliases",
  "locale",
  "status",
  "checkedAt",
  "source",
  "sourceUrl",
  "sourceCheckedAt",
  "sourceLabel",
  "confidence",
  "caveats"
]);

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

function assertAllowedKeys(object, allowedKeys, pathLabel) {
  for (const key of Object.keys(object ?? {})) {
    if (!allowedKeys.has(key)) throw new Error(`Unexpected platform-value key at ${pathLabel}: ${key}`);
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

function safeFieldId(field) {
  if (BLOCKED_PUBLIC_FIELD_IDS.has(field.fieldId)) {
    throw new Error(`Field ${field.fieldId} is account-owned or audience-owned and cannot be published.`);
  }
  return field;
}

function assertConfidence(value, pathLabel) {
  if (!VALID_CONFIDENCES.has(value)) throw new Error(`Invalid platform-value confidence at ${pathLabel}: ${value}`);
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
  assertAllowedKeys(catalog, CATALOG_KEYS, "$");
  if (!catalog.platformId || !catalog.platformName) throw new Error("Catalog requires platformId and platformName.");
  if (!catalog.source || typeof catalog.source !== "object") throw new Error("Catalog requires source object.");
  assertAllowedKeys(catalog.source, CATALOG_SOURCE_KEYS, "$.source");
  if (!Array.isArray(catalog.fields)) throw new Error("Catalog requires fields array.");

  for (const field of catalog.fields) {
    assertAllowedKeys(field, FIELD_KEYS, `$.fields.${field.fieldId ?? "unknown"}`);
    if (BLOCKED_PUBLIC_FIELD_IDS.has(field.fieldId)) {
      throw new Error(`Field ${field.fieldId} is account-owned or audience-owned and cannot be published.`);
    }
    for (const value of asArray(field.values)) {
      assertAllowedKeys(value, VALUE_KEYS, `$.fields.${field.fieldId}.values`);
      if (!value.label || !value.status || !value.checkedAt || !value.source) {
        throw new Error(`Value under ${field.fieldId} is missing required publishable metadata.`);
      }
      if (value.source === "official-doc" && (!value.sourceUrl || !value.sourceCheckedAt || !value.sourceLabel || !value.confidence)) {
        throw new Error(`Official-doc value under ${field.fieldId} is missing source metadata.`);
      }
      if (value.confidence) assertConfidence(value.confidence, `${field.fieldId}.${value.label}`);
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

function sourceManifestDirectory(root = getProjectRoot()) {
  return path.join(root, "data", "platform-value-sources");
}

function assertSourceManifest(manifest) {
  if (!manifest || typeof manifest !== "object") throw new Error("Source manifest must be an object.");
  if (!manifest.platformId || !manifest.platformName) throw new Error("Source manifest requires platformId and platformName.");
  if (!manifest.sourceUrl || !manifest.sourceCheckedAt || !manifest.sourceLabel) {
    throw new Error(`Source manifest ${manifest.platformId} requires official source metadata.`);
  }
  if (!Array.isArray(manifest.fields)) throw new Error(`Source manifest ${manifest.platformId} requires fields array.`);
  if (manifest.confidence) assertConfidence(manifest.confidence, `${manifest.platformId}.confidence`);
  for (const field of manifest.fields) {
    safeFieldId(field);
    if (!field.label || !Array.isArray(field.inputKeys) || !Array.isArray(field.values)) {
      throw new Error(`Source manifest ${manifest.platformId} has an invalid field ${field.fieldId}.`);
    }
    if (field.confidence) assertConfidence(field.confidence, `${manifest.platformId}.${field.fieldId}.confidence`);
    for (const value of field.values) if (value.confidence) assertConfidence(value.confidence, `${manifest.platformId}.${field.fieldId}.${value.label}.confidence`);
  }
  walkForUnsafeData(manifest);
  return manifest;
}

export async function loadOfficialDocSourceManifests({ platformIds = [], root = getProjectRoot() } = {}) {
  const requested = new Set(platformIds);
  let files = [];
  if (requested.size > 0) {
    files = [...requested].map((platformId) => `${platformId}.json`);
  } else {
    files = (await readdir(sourceManifestDirectory(root))).filter((file) => file.endsWith(".json")).sort();
  }
  return Promise.all(
    files.map(async (file) => assertSourceManifest(JSON.parse(await readFile(path.join(sourceManifestDirectory(root), file), "utf8"))))
  );
}

function officialDocValue(value, field, manifest) {
  return {
    label: value.label,
    ...(value.platformValueId ? { platformValueId: value.platformValueId } : {}),
    ...(Array.isArray(value.aliases) ? { aliases: value.aliases } : {}),
    ...(value.locale ? { locale: value.locale } : {}),
    status: "manual-reviewed",
    checkedAt: manifest.sourceCheckedAt,
    source: "official-doc",
    sourceUrl: value.sourceUrl || field.sourceUrl || manifest.sourceUrl,
    sourceCheckedAt: value.sourceCheckedAt || field.sourceCheckedAt || manifest.sourceCheckedAt,
    sourceLabel: value.sourceLabel || field.sourceLabel || manifest.sourceLabel,
    confidence: value.confidence || field.confidence || manifest.confidence || "medium",
    caveats: value.caveats || field.caveats || manifest.caveats || [DOCS_CAVEAT]
  };
}

export function buildCatalogFromOfficialDocSource(manifest, { generatedAt = new Date().toISOString() } = {}) {
  assertSourceManifest(manifest);
  return validatePublishableCatalog({
    platformId: manifest.platformId,
    platformName: manifest.platformName,
    generatedAt,
    source: {
      mode: "official-doc-curated",
      checkedAt: manifest.sourceCheckedAt,
      scope: "Curated official documentation categories only; no credentials, account objects, or raw API responses included.",
      caveats: manifest.caveats || [DOCS_CAVEAT]
    },
    fields: manifest.fields.map((field) => safeFieldId({
      fieldId: field.fieldId,
      label: field.label,
      inputKeys: field.inputKeys,
      status: "manual-reviewed",
      values: field.values.map((value) => officialDocValue(value, field, manifest))
    }))
  });
}

export async function buildOfficialDocCatalogs(platformIds = [], options = {}) {
  const manifests = await loadOfficialDocSourceManifests({ platformIds, root: options.root });
  return manifests.map((manifest) => buildCatalogFromOfficialDocSource(manifest, options));
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreValue(value, terms) {
  const haystack = normalizeText([value.label, ...(value.aliases ?? [])].join(" "));
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function fieldAffinityScore(value, field) {
  const label = normalizeText(value.label);
  const keys = new Set(field.inputKeys ?? []);
  let score = 0;
  if (keys.has("companyNames") && label === "company name") score += 4;
  if (keys.has("companyNames") && label.includes("company")) score += 1;
  if (keys.has("jobTitles") && label.includes("job title")) score += 4;
  if (keys.has("jobTitles") && label.includes("experience")) score += 1;
  if (keys.has("jobFunctions") && label.includes("function")) score += 4;
  if (keys.has("industries") && label.includes("industry")) score += 4;
  if (keys.has("companySizes") && label.includes("size")) score += 4;
  if (keys.has("seniorities") && label.includes("seniority")) score += 4;
  if (keys.has("keywords") && label.includes("keyword")) score += 4;
  if ((keys.has("locale") || keys.has("geographies")) && /location|geo|country|region|city|metro/.test(label)) score += 2;
  if (keys.has("communities") && label.includes("community")) score += 4;
  if (keys.has("interests") && label.includes("interest")) score += 4;
  if (keys.has("devices") && label.includes("device")) score += 4;
  if (keys.has("demographics") && /demographic|member age|member gender/.test(label)) score += 3;
  if (keys.has("education") && /education|degree|school|study/.test(label)) score += 3;
  if (keys.has("lifeEvents") && label.includes("life event")) score += 4;
  if (keys.has("placements") && label.includes("placement")) score += 4;
  if (keys.has("topics") && label.includes("topic")) score += 4;
  return score;
}

function strategyValuesForKeys(strategy, keys) {
  return keys.flatMap((key) => {
    if (key === "locale") return strategy.locale ? [strategy.locale] : [];
    const value = strategy[key];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }).map(String).filter(Boolean);
}

export function closestCatalogValues(catalogs, strategy, { limit = 5 } = {}) {
  const terms = [
    strategy.locale,
    ...(strategy.geographies ?? []),
    ...(strategy.companyNames ?? []),
    ...(strategy.companySizes ?? []),
    ...(strategy.jobTitles ?? []),
    ...(strategy.jobFunctions ?? []),
    ...(strategy.seniorities ?? []),
    ...(strategy.industries ?? []),
    ...(strategy.keywords ?? []),
    ...(strategy.intentSignals ?? []),
    ...(strategy.technographics ?? []),
    ...(strategy.interests ?? []),
    ...(strategy.communities ?? []),
    ...(strategy.placements ?? []),
    ...(strategy.topics ?? []),
    ...(strategy.devices ?? []),
    ...(strategy.demographics ?? []),
    ...(strategy.education ?? []),
    ...(strategy.lifeEvents ?? [])
  ].map(normalizeText).filter(Boolean);

  return catalogs.map((catalog) => ({
    platformId: catalog.platformId,
    platformName: catalog.platformName,
    fields: catalog.fields.map((field) => {
      const requestedValues = strategyValuesForKeys(strategy, field.inputKeys ?? []);
      return {
        fieldId: field.fieldId,
        label: field.label,
        inputKeys: field.inputKeys ?? [],
        requestedValues,
        values: field.values
          .filter((value) => !catalog.source || catalog.source.mode !== "official-doc-curated" || value.source === "official-doc")
          .map((value) => ({
            ...value,
            score: scoreValue(value, terms) + fieldAffinityScore(value, field) + (requestedValues.length > 0 ? 1 : 0)
          }))
          .filter((value) => value.score > 0)
          .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
          .slice(0, limit)
      };
    }).filter((field) => field.values.length > 0 && field.requestedValues.length > 0)
  })).filter((catalog) => catalog.fields.length > 0);
}
