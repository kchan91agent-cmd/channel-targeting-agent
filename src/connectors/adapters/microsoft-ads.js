import { fetchJson, hasRequiredAuth, missingAuthResult, registryFallbackResult, registryFields } from "./common.js";

const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MICROSOFT_GET_USER_URL = "https://clientcenter.api.bingads.microsoft.com/CustomerManagement/v13/User/Query";
const DEFAULT_MICROSOFT_SCOPE = "https://ads.microsoft.com/msads.manage";

async function getAccessToken(env, options) {
  const body = new URLSearchParams({
    client_id: env.MICROSOFT_ADS_CLIENT_ID,
    client_secret: env.MICROSOFT_ADS_CLIENT_SECRET,
    refresh_token: env.MICROSOFT_ADS_REFRESH_TOKEN,
    grant_type: "refresh_token",
    scope: env.MICROSOFT_ADS_SCOPE || DEFAULT_MICROSOFT_SCOPE
  });
  const response = await fetchJson(MICROSOFT_TOKEN_URL, {
    ...options,
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response?.access_token) throw new Error("Microsoft OAuth response did not include access_token.");
  return response.access_token;
}

function microsoftHeaders(env, accessToken) {
  const headers = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    DeveloperToken: env.MICROSOFT_ADS_DEVELOPER_TOKEN
  };
  if (env.MICROSOFT_ADS_CUSTOMER_ID) headers.CustomerId = env.MICROSOFT_ADS_CUSTOMER_ID;
  if (env.MICROSOFT_ADS_ACCOUNT_ID) headers.CustomerAccountId = env.MICROSOFT_ADS_ACCOUNT_ID;
  return headers;
}

export async function checkMicrosoftAdsFields(platform, options = {}) {
  const env = options.env ?? process.env;
  const checkedAt = new Date().toISOString();
  if (!hasRequiredAuth(platform, env)) return missingAuthResult(platform, { checkedAt, env });

  try {
    const accessToken = await getAccessToken(env, options);
    const response = await fetchJson(MICROSOFT_GET_USER_URL, {
      ...options,
      method: "POST",
      headers: microsoftHeaders(env, accessToken),
      body: JSON.stringify({ UserId: null })
    });

    return {
      platformId: platform.id,
      platformName: platform.name,
      checkedAt,
      mode: "live-api-account-probe",
      account: {
        source: "live-api",
        verified: Boolean(response?.User || response?.CustomerRoles),
        evidence: "Microsoft Advertising GetUser request succeeded for the provided OAuth/developer-token context."
      },
      fields: registryFields(platform),
      errors: [
        {
          code: "FIELD_LEVEL_PROFILE_PULL_DEFERRED",
          message: "Microsoft account access was verified, but field-level LinkedIn profile criteria are still registry-backed until a profile-data read is added.",
          recoverable: true
        }
      ]
    };
  } catch (error) {
    return registryFallbackResult(platform, error, { checkedAt });
  }
}
