import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildCatalogFromOfficialDocSource, buildEmptyValueCatalog, buildOfficialDocCatalogs, closestCatalogValues, validatePublishableCatalog, writePlatformValueCatalog } from "../src/platform-values.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const platform = {
  id: "test-platform",
  name: "Test Platform",
  targetingDimensions: [
    { id: "jobTitle", label: "Job title", inputKeys: ["jobTitles"] },
    { id: "customAudience", label: "Custom audiences", inputKeys: ["customerLists"] }
  ]
};

test("builds publishable templates without account-owned audience fields", () => {
  const catalog = buildEmptyValueCatalog(platform, { checkedAt: "2026-07-09T00:00:00.000Z" });
  assert.deepEqual(catalog.fields.map((field) => field.fieldId), ["jobTitle"]);
  assert.equal(validatePublishableCatalog(catalog), catalog);
});

test("rejects private audience fields and sensitive raw data", () => {
  assert.throws(() => validatePublishableCatalog({
    platformId: "test",
    platformName: "Test",
    generatedAt: "2026-07-09T00:00:00.000Z",
    source: { mode: "manual-reviewed", checkedAt: "2026-07-09", scope: "test", caveats: [] },
    fields: [{ fieldId: "customAudience", label: "Custom audiences", inputKeys: ["customerLists"], status: "manual-reviewed", values: [] }]
  }), /cannot be published/);

  assert.throws(() => validatePublishableCatalog({
    platformId: "test",
    platformName: "Test",
    generatedAt: "2026-07-09T00:00:00.000Z",
    source: { mode: "manual-reviewed", checkedAt: "2026-07-09", scope: "test", caveats: [] },
    fields: [{
      fieldId: "jobTitle",
      label: "Job title",
      inputKeys: ["jobTitles"],
      status: "manual-reviewed",
      values: [{ label: "Revenue Operations Manager", status: "api-confirmed", checkedAt: "2026-07-09", source: "authenticated-read-only-query", rawResponse: {} }]
    }]
  }), /Unexpected platform-value key|Unsafe platform-value key/);

  assert.throws(() => validatePublishableCatalog({
    platformId: "test",
    platformName: "Test",
    generatedAt: "2026-07-09T00:00:00.000Z",
    source: { mode: "manual-reviewed", checkedAt: "2026-07-09", scope: "test", caveats: [] },
    fields: [{
      fieldId: "jobTitle",
      label: "Job title",
      inputKeys: ["jobTitles"],
      status: "manual-reviewed",
      values: [{ label: "Customer list", status: "manual-reviewed", checkedAt: "2026-07-09", source: "manual-review" }]
    }]
  }), /Unsafe platform-value text/);

  assert.throws(() => validatePublishableCatalog({
    platformId: "test",
    platformName: "Test",
    generatedAt: "2026-07-09T00:00:00.000Z",
    source: { mode: "manual-reviewed", checkedAt: "2026-07-09", scope: "test", caveats: [] },
    fields: [{
      fieldId: "jobTitle",
      label: "Job title",
      inputKeys: ["jobTitles"],
      status: "manual-reviewed",
      values: [{ label: "Revenue Operations Manager", status: "manual-reviewed", checkedAt: "2026-07-09", source: "manual-review", account_id: "123" }]
    }]
  }), /Unexpected platform-value key|Unsafe platform-value key/);
});

test("finds closest catalog values without using private data", () => {
  const matches = closestCatalogValues([
    validatePublishableCatalog({
      platformId: "linkedin-ads",
      platformName: "LinkedIn Ads",
      generatedAt: "2026-07-09T00:00:00.000Z",
      source: { mode: "manual-reviewed", checkedAt: "2026-07-09", scope: "test", caveats: [] },
      fields: [{
        fieldId: "jobTitle",
        label: "Job title",
        inputKeys: ["jobTitles"],
        status: "manual-reviewed",
        values: [
          { label: "Revenue Operations Manager", aliases: ["RevOps Manager"], status: "manual-reviewed", checkedAt: "2026-07-09", source: "manual-review" },
          { label: "Finance Director", aliases: [], status: "manual-reviewed", checkedAt: "2026-07-09", source: "manual-review" }
        ]
      }]
    })
  ], { jobTitles: ["Revenue Operations Manager"] });

  assert.equal(matches[0].fields[0].values[0].label, "Revenue Operations Manager");
});

test("builds official-doc catalogs with source metadata", async () => {
  const catalogs = await buildOfficialDocCatalogs(["linkedin-ads", "meta-ads", "google-ads-youtube", "microsoft-ads", "reddit-ads"], {
    generatedAt: "2026-07-09T00:00:00.000Z"
  });
  assert.deepEqual(catalogs.map((catalog) => catalog.platformId), ["linkedin-ads", "meta-ads", "google-ads-youtube", "microsoft-ads", "reddit-ads"]);
  assert.ok(catalogs.every((catalog) => catalog.source.mode === "official-doc-curated"));

  const values = catalogs.flatMap((catalog) => catalog.fields.flatMap((field) => field.values));
  assert.ok(values.length > 0);
  assert.ok(values.every((value) => value.source === "official-doc"));
  assert.ok(values.every((value) => value.sourceUrl?.startsWith("https://")));
  assert.ok(values.every((value) => value.sourceCheckedAt === "2026-07-09"));
  assert.ok(values.every((value) => value.sourceLabel));
  assert.ok(values.every((value) => ["low", "medium", "high"].includes(value.confidence)));
  assert.ok(values.every((value) => value.caveats?.length > 0));
});

test("rejects invalid official-doc confidence metadata", () => {
  assert.throws(() => buildCatalogFromOfficialDocSource({
    platformId: "test",
    platformName: "Test",
    sourceLabel: "Official test source",
    sourceUrl: "https://example.com/source",
    sourceCheckedAt: "2026-07-09",
    confidence: "certain",
    fields: [{
      fieldId: "jobTitle",
      label: "Job title",
      inputKeys: ["jobTitles"],
      values: [{ label: "Job title" }]
    }]
  }), /Invalid platform-value confidence/);
});

test("prioritizes the most relevant docs-backed category for company names", async () => {
  const catalogs = await buildOfficialDocCatalogs(["linkedin-ads"], {
    generatedAt: "2026-07-09T00:00:00.000Z"
  });
  const matches = closestCatalogValues(catalogs, { companyNames: ["Acme Software"] });
  const companyField = matches[0].fields.find((field) => field.fieldId === "companyName");
  assert.equal(companyField.values[0].label, "Company name");
});

test("does not return docs-backed values without source input ties", async () => {
  const catalogs = await buildOfficialDocCatalogs(["linkedin-ads", "google-ads-youtube"], {
    generatedAt: "2026-07-09T00:00:00.000Z"
  });
  const matches = closestCatalogValues(catalogs, { product: "Sparse product", market: "Unspecified" });
  assert.deepEqual(matches, []);
});

test("rejects blocked fields in official-doc manifests", () => {
  assert.throws(() => buildCatalogFromOfficialDocSource({
    platformId: "test",
    platformName: "Test",
    sourceLabel: "Official test source",
    sourceUrl: "https://example.com/source",
    sourceCheckedAt: "2026-07-09",
    fields: [{
      fieldId: "customAudience",
      label: "Blocked",
      inputKeys: ["customerLists"],
      values: [{ label: "Blocked category" }]
    }]
  }), /cannot be published/);
});

test("writes official-doc catalogs to an explicit root", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "platform-values-"));
  const [catalog] = await buildOfficialDocCatalogs(["reddit-ads"], {
    generatedAt: "2026-07-09T00:00:00.000Z"
  });
  const outputPath = await writePlatformValueCatalog(catalog, { root });
  const written = JSON.parse(await readFile(outputPath, "utf8"));
  assert.equal(written.platformId, "reddit-ads");
  assert.equal(written.source.mode, "official-doc-curated");
});

test("refresh-values official-doc command previews without writing and scopes platforms", () => {
  const output = execFileSync(process.execPath, ["src/connectors/refresh-values.js", "--source", "official-docs", "--platform", "reddit-ads"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8"
  });
  const parsed = JSON.parse(output);
  assert.equal(parsed.mode, "official-docs-preview");
  assert.deepEqual(parsed.catalogs.map((catalog) => catalog.platformId), ["reddit-ads"]);
});

test("refresh-values preserves the legacy default template preview mode", () => {
  const output = execFileSync(process.execPath, ["src/connectors/refresh-values.js", "--platform", "reddit-ads"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8"
  });
  const parsed = JSON.parse(output);
  assert.equal(parsed.mode, "template-preview");
});

test("refresh-values reports unknown platforms and sources", () => {
  assert.throws(() => execFileSync(process.execPath, ["src/connectors/refresh-values.js", "--source", "official-docs", "--platform", "unknown"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    stdio: "pipe"
  }), /Unknown platform/);

  assert.throws(() => execFileSync(process.execPath, ["src/connectors/refresh-values.js", "--source", "bad-source"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    stdio: "pipe"
  }), /Unknown source/);
});
