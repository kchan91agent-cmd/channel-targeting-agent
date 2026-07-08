import { missingAuth } from "../source-check.js";

export const DEFAULT_TIMEOUT_MS = 10000;

export function registryFields(platform, overrides = {}) {
  const liveFieldIds = new Set(overrides.liveFieldIds ?? []);
  const evidenceById = overrides.evidenceById ?? {};

  return platform.targetingDimensions.map((dimension) => {
    const liveEvidence = evidenceById[dimension.id];
    const liveConfirmed = liveFieldIds.has(dimension.id) || Boolean(liveEvidence);
    return {
      id: dimension.id,
      label: dimension.label,
      category: dimension.matchType,
      availability: liveConfirmed ? "available" : dimension.availability.includes("auth") || dimension.availability.includes("dynamic") ? "unknown" : "available",
      source: liveConfirmed ? "live-api" : "registry",
      evidence: liveEvidence ?? `Registry-backed: ${dimension.availability}.`,
      caveats: liveConfirmed ? [] : ["Registry-backed only — not account-confirmed."]
    };
  });
}

export function missingAuthResult(platform, { checkedAt = new Date().toISOString(), env = process.env } = {}) {
  const missing = missingAuth(platform, env);
  return {
    platformId: platform.id,
    platformName: platform.name,
    checkedAt,
    mode: "registry-fallback",
    fields: registryFields(platform),
    errors: missing.length > 0 ? [
      {
        code: "MISSING_AUTH",
        message: `Missing credentials: ${missing.join(", ")}`,
        recoverable: true
      }
    ] : []
  };
}

export function registryFallbackResult(platform, error, { checkedAt = new Date().toISOString(), code = "LIVE_CHECK_FAILED" } = {}) {
  return {
    platformId: platform.id,
    platformName: platform.name,
    checkedAt,
    mode: "registry-fallback",
    fields: registryFields(platform),
    errors: [
      {
        code,
        message: error instanceof Error ? error.message : String(error),
        recoverable: true
      }
    ]
  };
}

export function connectorNotImplementedResult(platform, { checkedAt = new Date().toISOString(), message } = {}) {
  return {
    platformId: platform.id,
    platformName: platform.name,
    checkedAt,
    mode: "registry-fallback",
    fields: registryFields(platform),
    errors: [
      {
        code: "CONNECTOR_NOT_IMPLEMENTED",
        message: message ?? "Authenticated field pull is not implemented yet; using registry fallback.",
        recoverable: true
      }
    ]
  };
}

export async function fetchJson(url, options = {}) {
  const {
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...fetchOptions
  } = options;
  if (!fetchImpl) throw new Error("fetch is not available in this runtime.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { ...fetchOptions, signal: controller.signal });
    const text = await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    if (!response.ok) {
      const message = body?.error?.message ?? body?.message ?? body?.raw ?? `HTTP ${response.status}`;
      throw new Error(message);
    }

    return body;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Live connector request timed out.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function hasRequiredAuth(platform, env = process.env) {
  return missingAuth(platform, env).length === 0;
}
