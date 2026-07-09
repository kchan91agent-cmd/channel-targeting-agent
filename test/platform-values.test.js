import assert from "node:assert/strict";
import test from "node:test";
import { buildEmptyValueCatalog, closestCatalogValues, validatePublishableCatalog } from "../src/platform-values.js";

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
  }), /Unsafe platform-value key/);
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
