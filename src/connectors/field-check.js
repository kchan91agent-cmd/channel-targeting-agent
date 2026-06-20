import { missingAuth } from "./source-check.js";

export function registryFields(platform) {
  return platform.targetingDimensions.map((dimension) => ({
    id: dimension.id,
    label: dimension.label,
    category: dimension.matchType,
    availability: dimension.availability.includes("auth") ? "unknown" : "available",
    source: "registry"
  }));
}

export function checkPlatformFields(platform, { env = process.env } = {}) {
  const missing = missingAuth(platform, env);
  const errors = [];

  if (missing.length > 0) {
    errors.push({
      code: "MISSING_AUTH",
      message: `Missing credentials: ${missing.join(", ")}`,
      recoverable: true
    });
  } else {
    errors.push({
      code: "CONNECTOR_NOT_IMPLEMENTED",
      message: "Authenticated field pull is not implemented yet; using registry fallback.",
      recoverable: true
    });
  }

  return {
    platformId: platform.id,
    checkedAt: new Date().toISOString(),
    fields: registryFields(platform),
    errors
  };
}
