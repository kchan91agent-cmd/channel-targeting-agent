import assert from "node:assert/strict";
import test from "node:test";
import { checkPlatformFields } from "../src/connectors/field-check.js";
import { loadPlatforms } from "../src/platforms.js";

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    text: async () => JSON.stringify(body)
  };
}

async function platform(id) {
  const platforms = await loadPlatforms();
  return platforms.find((item) => item.id === id);
}

test("all platforms default to committed last-known registry attributes without live credentials", async () => {
  const platforms = await loadPlatforms();

  for (const item of platforms) {
    const result = await checkPlatformFields(item, { env: {} });
    assert.equal(result.mode, "registry-fallback");
    assert.deepEqual(
      result.fields.map((field) => field.id),
      item.targetingDimensions.map((dimension) => dimension.id)
    );
    assert.ok(result.fields.every((field) => field.source === "registry"));
    assert.ok(result.fields.every((field) => field.evidence.startsWith("Registry-backed:")));
    assert.ok(result.errors.every((error) => error.recoverable));
  }
});

test("Google Ads adapter marks API-confirmed metadata fields as live-api", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("oauth2.googleapis.com")) return jsonResponse({ access_token: "google-token" });
    return jsonResponse([
      {
        results: [
          { googleAdsField: { name: "geo_target_constant.id" } },
          { googleAdsField: { name: "custom_audience.id" } },
          { googleAdsField: { name: "user_list.id" } }
        ]
      }
    ]);
  };

  const result = await checkPlatformFields(await platform("google-ads-youtube"), {
    fetchImpl,
    env: {
      GOOGLE_ADS_DEVELOPER_TOKEN: "dev",
      GOOGLE_ADS_CUSTOMER_ID: "123-456-7890",
      GOOGLE_ADS_CLIENT_ID: "client",
      GOOGLE_ADS_CLIENT_SECRET: "secret",
      GOOGLE_ADS_REFRESH_TOKEN: "refresh",
      GOOGLE_ADS_API_VERSION: "v24"
    }
  });

  assert.equal(result.mode, "live-api");
  assert.equal(result.fields.find((field) => field.id === "geography").source, "live-api");
  assert.equal(result.fields.find((field) => field.id === "customSegment").source, "live-api");
  assert.equal(result.fields.find((field) => field.id === "yourData").source, "live-api");
  assert.equal(calls[1].url, "https://googleads.googleapis.com/v24/customers/1234567890/googleAds:searchStream");
  assert.match(calls[1].options.body, /google_ads_field\.name/);
});

test("LinkedIn adapter maps available targeting facets to live-api fields", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    return jsonResponse({
      elements: [
        { facetName: "industries" },
        { facetName: "titles" },
        { facetName: "seniorities" }
      ]
    });
  };

  const result = await checkPlatformFields(await platform("linkedin-ads"), {
    fetchImpl,
    env: {
      LINKEDIN_ACCESS_TOKEN: "linkedin-token",
      LINKEDIN_AD_ACCOUNT_ID: "123"
    }
  });

  assert.equal(result.mode, "live-api");
  assert.equal(result.fields.find((field) => field.id === "industry").source, "live-api");
  assert.equal(result.fields.find((field) => field.id === "jobTitle").source, "live-api");
  assert.equal(result.fields.find((field) => field.id === "seniority").source, "live-api");
  assert.equal(calls[0].url, "https://api.linkedin.com/rest/adTargetingFacets");
  assert.equal(calls[0].options.headers["X-Restli-Protocol-Version"], "2.0.0");
});

test("Microsoft adapter verifies account access without overstating field-level proof", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("login.microsoftonline.com")) return jsonResponse({ access_token: "microsoft-token" });
    return jsonResponse({ User: { Id: 42 }, CustomerRoles: [{ CustomerId: 123, AccountIds: [456] }] });
  };

  const result = await checkPlatformFields(await platform("microsoft-ads"), {
    fetchImpl,
    env: {
      MICROSOFT_ADS_DEVELOPER_TOKEN: "dev",
      MICROSOFT_ADS_CUSTOMER_ID: "123",
      MICROSOFT_ADS_ACCOUNT_ID: "456",
      MICROSOFT_ADS_CLIENT_ID: "client",
      MICROSOFT_ADS_CLIENT_SECRET: "secret",
      MICROSOFT_ADS_REFRESH_TOKEN: "refresh"
    }
  });

  assert.equal(result.mode, "live-api-account-probe");
  assert.equal(result.account.verified, true);
  assert.equal(result.fields.find((field) => field.id === "industry").source, "registry");
  assert.ok(result.errors.some((error) => error.code === "FIELD_LEVEL_PROFILE_PULL_DEFERRED" && error.recoverable));
  assert.equal(calls[1].url, "https://clientcenter.api.bingads.microsoft.com/CustomerManagement/v13/User/Query");
});
