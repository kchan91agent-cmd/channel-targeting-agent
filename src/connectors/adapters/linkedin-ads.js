import { fetchJson, hasRequiredAuth, missingAuthResult, registryFallbackResult, registryFields } from "./common.js";

const DEFAULT_LINKEDIN_VERSION = "202605";

const FACETS_BY_DIMENSION = {
  geography: ["locations", "geos", "profileGeos"],
  companyName: ["employers", "employersAll"],
  industry: ["industries"],
  companySize: ["companySizes"],
  jobTitle: ["titles"],
  jobFunction: ["functions"],
  seniority: ["seniorities"],
  skill: ["skills"],
  education: ["degrees", "fieldsOfStudy", "schools"],
  interest: ["interests", "memberInterests", "groups"],
  matchedAudience: ["matchedAudiences", "retargetingSegments"]
};

function linkedinHeaders(env) {
  return {
    authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
    "Linkedin-Version": env.LINKEDIN_VERSION || DEFAULT_LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0"
  };
}

function facetNames(response) {
  return new Set((response?.elements ?? []).map((facet) => facet?.facetName).filter(Boolean));
}

function liveDimensionIds(platform, facets) {
  return platform.targetingDimensions
    .filter((dimension) => (FACETS_BY_DIMENSION[dimension.id] ?? []).some((facet) => facets.has(facet)))
    .map((dimension) => dimension.id);
}

export async function checkLinkedInAdsFields(platform, options = {}) {
  const env = options.env ?? process.env;
  const checkedAt = new Date().toISOString();
  if (!hasRequiredAuth(platform, env)) return missingAuthResult(platform, { checkedAt, env });

  try {
    const response = await fetchJson("https://api.linkedin.com/rest/adTargetingFacets", {
      ...options,
      method: "GET",
      headers: linkedinHeaders(env)
    });
    const facets = facetNames(response);
    const liveFieldIds = liveDimensionIds(platform, facets);
    const evidenceById = Object.fromEntries(liveFieldIds.map((id) => [id, `LinkedIn adTargetingFacets returned a mapped facet for ${id}.`]));

    return {
      platformId: platform.id,
      platformName: platform.name,
      checkedAt,
      mode: "live-api",
      fields: registryFields(platform, { liveFieldIds, evidenceById }),
      errors: liveFieldIds.length > 0 ? [] : [
        {
          code: "LIVE_CHECK_EMPTY",
          message: "LinkedIn targeting facets call succeeded but returned no mapped facets; using registry fallback for unconfirmed fields.",
          recoverable: true
        }
      ]
    };
  } catch (error) {
    return registryFallbackResult(platform, error, { checkedAt });
  }
}
