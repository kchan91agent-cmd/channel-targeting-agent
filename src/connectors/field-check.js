import { connectorNotImplementedResult, missingAuthResult, registryFields } from "./adapters/common.js";
import { checkGoogleAdsFields } from "./adapters/google-ads.js";
import { checkLinkedInAdsFields } from "./adapters/linkedin-ads.js";
import { checkMicrosoftAdsFields } from "./adapters/microsoft-ads.js";

export { registryFields };

const ADAPTERS = {
  "google-ads-youtube": checkGoogleAdsFields,
  "linkedin-ads": checkLinkedInAdsFields,
  "microsoft-ads": checkMicrosoftAdsFields
};

export async function checkPlatformFields(platform, options = {}) {
  const adapter = ADAPTERS[platform.id];
  if (adapter) return adapter(platform, options);

  if (platform.liveCheck?.authRequired) {
    const missingResult = missingAuthResult(platform, options);
    if (missingResult.errors.length > 0) return missingResult;
  }

  return connectorNotImplementedResult(platform, {
    message: `${platform.name} does not have an authenticated read-only adapter yet; using registry fallback.`
  });
}
