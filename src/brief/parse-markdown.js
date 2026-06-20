const FIELD_ALIASES = new Map([
  ["product", "product"],
  ["offer", "product"],
  ["market", "market"],
  ["locale", "locale"],
  ["geographies", "geographies"],
  ["geography", "geographies"],
  ["industries", "industries"],
  ["industry", "industries"],
  ["company sizes", "companySizes"],
  ["company size", "companySizes"],
  ["company names", "companyNames"],
  ["companies", "companyNames"],
  ["account lists", "accountLists"],
  ["target account lists", "accountLists"],
  ["customer lists", "customerLists"],
  ["contact lists", "contactLists"],
  ["crm lists", "contactLists"],
  ["website visitors", "websiteVisitors"],
  ["retargeting audiences", "retargetingAudiences"],
  ["remarketing audiences", "retargetingAudiences"],
  ["engagement audiences", "engagementAudiences"],
  ["lookalike seeds", "lookalikeSeeds"],
  ["similar audience seeds", "lookalikeSeeds"],
  ["job titles", "jobTitles"],
  ["job title", "jobTitles"],
  ["job functions", "jobFunctions"],
  ["job function", "jobFunctions"],
  ["seniorities", "seniorities"],
  ["seniority", "seniorities"],
  ["skills", "skills"],
  ["interests", "interests"],
  ["keywords", "keywords"],
  ["communities", "communities"],
  ["placements", "placements"],
  ["topics", "topics"],
  ["content topics", "topics"],
  ["devices", "devices"],
  ["device types", "devices"],
  ["demographics", "demographics"],
  ["education", "education"],
  ["life events", "lifeEvents"],
  ["technographics", "technographics"],
  ["intent signals", "intentSignals"],
  ["pains", "pains"],
  ["gains", "gains"],
  ["objections", "objections"],
  ["pain", "pains"],
  ["triggers", "triggers"],
  ["trigger", "triggers"],
  ["exclusions", "exclusions"],
  ["negative keywords", "negativeKeywords"],
  ["suppression lists", "suppressionLists"],
  ["campaign goal", "campaignGoal"],
  ["goal", "campaignGoal"],
  ["preferred channels", "preferredChannels"],
  ["channels", "preferredChannels"],
  ["compliance constraints", "complianceConstraints"]
]);

const ARRAY_FIELDS = new Set([
  "geographies",
  "industries",
  "companySizes",
  "companyNames",
  "accountLists",
  "customerLists",
  "contactLists",
  "websiteVisitors",
  "retargetingAudiences",
  "engagementAudiences",
  "lookalikeSeeds",
  "jobTitles",
  "jobFunctions",
  "seniorities",
  "skills",
  "interests",
  "keywords",
  "communities",
  "placements",
  "topics",
  "devices",
  "demographics",
  "education",
  "lifeEvents",
  "technographics",
  "intentSignals",
  "pains",
  "gains",
  "objections",
  "triggers",
  "exclusions",
  "negativeKeywords",
  "suppressionLists",
  "preferredChannels",
  "complianceConstraints"
]);

const PLACEHOLDER_VALUES = new Set([
  "n/a",
  "na",
  "none",
  "not supplied",
  "not specified",
  "tbd",
  "unknown",
  "unspecified"
]);

function isPlaceholderValue(value) {
  return PLACEHOLDER_VALUES.has(value.toLowerCase().trim());
}

function splitValues(value) {
  return value
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter((item) => item && !isPlaceholderValue(item));
}

function normalizeLabel(label) {
  return label.toLowerCase().replace(/\s+/g, " ").trim();
}

export function parseMarkdownBrief(markdown) {
  const strategy = {};
  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(?:[-*]\s*)?\**([^:*]+)\**:\s*(.+)$/);
    if (!match) continue;

    const key = FIELD_ALIASES.get(normalizeLabel(match[1]));
    if (!key) continue;

    const rawValue = match[2].replace(/^`|`$/g, "").trim();
    if (ARRAY_FIELDS.has(key)) {
      const values = splitValues(rawValue);
      if (values.length > 0) strategy[key] = values;
    } else {
      if (!isPlaceholderValue(rawValue)) strategy[key] = rawValue;
    }
  }

  return strategy;
}
