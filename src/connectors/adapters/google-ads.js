import { fetchJson, hasRequiredAuth, missingAuthResult, registryFallbackResult, registryFields } from "./common.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_GOOGLE_ADS_API_VERSION = "v24";

const FIELD_METADATA_BY_DIMENSION = {
  geography: ["geo_target_constant.id", "campaign_criterion.location.geo_target_constant"],
  keyword: ["keyword_view.resource_name", "ad_group_criterion.keyword.text"],
  customSegment: ["custom_audience.id"],
  inMarket: ["user_interest.user_interest_id"],
  affinity: ["user_interest.user_interest_id"],
  detailedDemographics: ["detailed_demographic.detailed_demographic_id", "life_event.life_event_id"],
  yourData: ["user_list.id"],
  customerMatch: ["offline_user_data_job.id", "user_list.id"],
  lookalike: ["audience.id"],
  device: ["campaign_criterion.device.type"]
};

function cleanCustomerId(value) {
  return String(value ?? "").replaceAll("-", "").trim();
}

async function getAccessToken(env, options) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: "refresh_token"
  });
  const response = await fetchJson(GOOGLE_TOKEN_URL, {
    ...options,
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response?.access_token) throw new Error("Google OAuth response did not include access_token.");
  return response.access_token;
}

function googleAdsHeaders(env, accessToken) {
  const headers = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    "developer-token": env.GOOGLE_ADS_DEVELOPER_TOKEN
  };
  if (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers["login-customer-id"] = cleanCustomerId(env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  return headers;
}

function metadataQuery(platform) {
  const fieldNames = [
    ...new Set(platform.targetingDimensions.flatMap((dimension) => FIELD_METADATA_BY_DIMENSION[dimension.id] ?? []))
  ];
  const quoted = fieldNames.map((name) => `'${name}'`).join(", ");
  return `SELECT google_ads_field.name, google_ads_field.category, google_ads_field.selectable, google_ads_field.filterable FROM google_ads_field WHERE google_ads_field.name IN (${quoted})`;
}

function fieldNamesFromSearchStream(response) {
  return new Set(
    (Array.isArray(response) ? response : [response])
      .flatMap((batch) => batch?.results ?? [])
      .map((row) => row?.googleAdsField?.name)
      .filter(Boolean)
  );
}

function liveDimensionIds(platform, liveFieldNames) {
  return platform.targetingDimensions
    .filter((dimension) => (FIELD_METADATA_BY_DIMENSION[dimension.id] ?? []).some((fieldName) => liveFieldNames.has(fieldName)))
    .map((dimension) => dimension.id);
}

export async function checkGoogleAdsFields(platform, options = {}) {
  const env = options.env ?? process.env;
  const checkedAt = new Date().toISOString();
  if (!hasRequiredAuth(platform, env)) return missingAuthResult(platform, { checkedAt, env });

  try {
    const apiVersion = env.GOOGLE_ADS_API_VERSION || DEFAULT_GOOGLE_ADS_API_VERSION;
    const customerId = cleanCustomerId(env.GOOGLE_ADS_CUSTOMER_ID);
    const accessToken = await getAccessToken(env, options);
    const response = await fetchJson(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/googleAds:searchStream`, {
      ...options,
      method: "POST",
      headers: googleAdsHeaders(env, accessToken),
      body: JSON.stringify({ query: metadataQuery(platform) })
    });
    const liveFieldNames = fieldNamesFromSearchStream(response);
    const liveFieldIds = liveDimensionIds(platform, liveFieldNames);
    const evidenceById = Object.fromEntries(liveFieldIds.map((id) => [id, `Google Ads API field metadata returned at least one mapped field for ${id}.`]));

    return {
      platformId: platform.id,
      platformName: platform.name,
      checkedAt,
      mode: "live-api",
      fields: registryFields(platform, { liveFieldIds, evidenceById }),
      errors: liveFieldIds.length > 0 ? [] : [
        {
          code: "LIVE_CHECK_EMPTY",
          message: "Google Ads API call succeeded but returned no mapped targeting field metadata; using registry fallback for unconfirmed fields.",
          recoverable: true
        }
      ]
    };
  } catch (error) {
    return registryFallbackResult(platform, error, { checkedAt });
  }
}
