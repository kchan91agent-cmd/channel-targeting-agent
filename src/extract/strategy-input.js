export const ARRAY_FIELDS = [
  "geographies", "industries", "companySizes", "companyNames", "accountLists", "customerLists",
  "contactLists", "websiteVisitors", "retargetingAudiences", "engagementAudiences", "lookalikeSeeds",
  "jobTitles", "jobFunctions", "seniorities", "skills", "interests", "keywords", "communities",
  "placements", "topics", "devices", "demographics", "education", "lifeEvents", "technographics",
  "intentSignals", "pains", "gains", "objections", "triggers", "exclusions", "negativeKeywords",
  "suppressionLists", "measurementThresholds", "audienceSizingRequirements", "preferredChannels",
  "complianceConstraints"
];

export const STRING_FIELDS = ["product", "market", "locale", "campaignGoal", "budget", "conversionEvent"];
export const STRATEGY_FIELDS = new Set([...ARRAY_FIELDS, ...STRING_FIELDS]);

function cleanString(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function canonicalizeFieldValue(key, value) {
  const cleaned = cleanString(value);
  return key === "companySizes" ? cleaned.replace(/\s+employees?$/i, "") : cleaned;
}

export function canonicalizeStrategy(input) {
  const strategy = {};
  for (const key of STRING_FIELDS) {
    const value = canonicalizeFieldValue(key, input?.[key]);
    if (value) strategy[key] = value;
  }
  for (const key of ARRAY_FIELDS) {
    const values = (Array.isArray(input?.[key]) ? input[key] : input?.[key] ? [input[key]] : [])
      .map((value) => canonicalizeFieldValue(key, value))
      .filter(Boolean);
    const unique = [...new Set(values)];
    if (unique.length > 0) strategy[key] = unique.sort((left, right) => left.localeCompare(right));
  }
  return strategy;
}

export function validateStrategyInput(input) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Strategy input must be a JSON object."] };
  }
  for (const key of ["product", "market"]) {
    if (typeof input[key] !== "string" || !input[key].trim()) errors.push(`Required field ${key} must be a non-empty string.`);
  }
  for (const key of STRING_FIELDS) {
    if (input[key] !== undefined && typeof input[key] !== "string") errors.push(`${key} must be a string when supplied.`);
  }
  for (const key of ARRAY_FIELDS) {
    if (input[key] !== undefined && (!Array.isArray(input[key]) || input[key].some((value) => typeof value !== "string" || !value.trim()))) {
      errors.push(`${key} must be an array of non-empty strings when supplied.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function diffStrategy(expected, actual) {
  const baseline = canonicalizeStrategy(expected);
  const candidate = canonicalizeStrategy(actual);
  const keys = [...new Set([...Object.keys(baseline), ...Object.keys(candidate)])].sort();
  return keys.flatMap((key) => {
    const expectedValue = baseline[key] ?? null;
    const actualValue = candidate[key] ?? null;
    return JSON.stringify(expectedValue) === JSON.stringify(actualValue)
      ? []
      : [{ field: key, expected: expectedValue, actual: actualValue }];
  });
}
