const FIELD_CATALOG = [
  { id: "geography", label: "Geography", keys: ["geographies", "locale"], missing: "launch geographies or locale" },
  { id: "accounts", label: "Company names / account lists", keys: ["companyNames", "accountLists"], missing: "named companies or an account-list source" },
  { id: "industry", label: "Industry", keys: ["industries"], missing: "target industries" },
  { id: "company-size", label: "Company size", keys: ["companySizes"], missing: "ICP employee or revenue-size bands" },
  { id: "job-title", label: "Job title", keys: ["jobTitles"], missing: "source-backed job titles" },
  { id: "job-function", label: "Job function", keys: ["jobFunctions"], missing: "source-backed job functions" },
  { id: "seniority", label: "Seniority", keys: ["seniorities"], missing: "decision-maker and influencer seniority bands" },
  { id: "skills", label: "Skills", keys: ["skills"], missing: "source-backed skills" },
  { id: "search-intent", label: "Search keywords / intent", keys: ["keywords", "intentSignals", "technographics"], missing: "category, product, or intent keywords" },
  { id: "contextual", label: "Contextual placements, topics, and communities", keys: ["placements", "topics", "communities"], missing: "placements, topics, or communities" },
  { id: "first-party", label: "Customer, contact, and account lists", keys: ["customerLists", "contactLists", "accountLists"], missing: "eligible customer, contact, or account-list source" },
  { id: "retargeting", label: "Website visitors, retargeting, and engagement audiences", keys: ["websiteVisitors", "retargetingAudiences", "engagementAudiences"], missing: "eligible website, retargeting, or engagement audience" },
  { id: "lookalike", label: "Lookalike / similar-audience seeds", keys: ["lookalikeSeeds"], missing: "an eligible seed audience" },
  { id: "exclusions", label: "Exclusions, suppression lists, and negative keywords", keys: ["exclusions", "suppressionLists", "negativeKeywords"], missing: "exclusions, suppression lists, or negative keywords" },
  { id: "environment", label: "Devices, demographics, education, and life events", keys: ["devices", "demographics", "education", "lifeEvents"], missing: "device, demographic, education, or life-event constraints" }
];

const FIRST_PARTY_KEYS = new Set([
  "accountLists",
  "customerLists",
  "contactLists",
  "websiteVisitors",
  "retargetingAudiences",
  "engagementAudiences",
  "lookalikeSeeds",
  "suppressionLists"
]);

const MESSAGE_INPUTS = [
  ["Pains", "pains"],
  ["Gains", "gains"],
  ["Objections", "objections"],
  ["Triggers", "triggers"]
];

const CHANNEL_GROUPS = [
  ["best-fit", "Conditional Best Fit"],
  ["strong-secondary", "Strong Secondary"],
  ["experimental", "Experimental or Situational"],
  ["low-fit", "Low Fit"]
];

function values(rawInputs, keys, inputSummary = {}) {
  return keys.flatMap((key) => {
    if (key === "locale") return inputSummary.locale && inputSummary.locale !== "unspecified" ? [inputSummary.locale] : [];
    return rawInputs[key] ?? [];
  });
}

function list(items, fallback = "None") {
  const unique = [...new Set((items ?? []).filter(Boolean))];
  return unique.length > 0 ? unique.join(", ") : fallback;
}

function escapeTable(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function catalogDimensions(platform, field) {
  return (platform.targetingDimensions ?? []).filter((match) =>
    match.inputKeys.some((key) => field.keys.includes(key))
  );
}

function fieldType(platform, field) {
  const dimensions = catalogDimensions(platform, field);
  if (dimensions.length === 0) return "Not targetable";
  if (field.id === "accounts") {
    if (dimensions.some((dimension) => dimension.matchType === "exact" && dimension.inputKeys.includes("companyNames"))) {
      return "Direct targeting field";
    }
    if (dimensions.some((dimension) => dimension.inputKeys.some((key) => FIRST_PARTY_KEYS.has(key)))) {
      return "First-party audience field";
    }
  }
  if (["first-party", "retargeting", "lookalike", "exclusions"].includes(field.id) && dimensions.some((dimension) => dimension.inputKeys.some((key) => FIRST_PARTY_KEYS.has(key)))) {
    return "First-party audience field";
  }
  if (dimensions.some((dimension) => dimension.matchType === "exact")) return "Direct targeting field";
  return "Proxy or contextual test field";
}

function fieldConfidence(platform, field) {
  const dimensions = catalogDimensions(platform, field);
  if (dimensions.length === 0) return "low";
  if (dimensions.some((dimension) => dimension.confidence === "high")) return "high";
  if (dimensions.some((dimension) => dimension.confidence === "medium")) return "medium";
  return "low";
}

function authenticationStatus(platform) {
  return platform.caveats.some((caveat) => caveat.startsWith("Manual or authenticated verification needed:"))
    ? "Registry-backed only — not account-confirmed."
    : "Registry-backed; no account-specific verification run.";
}

function verificationNote(platform, field) {
  const dimensions = catalogDimensions(platform, field);
  const needsDynamicCheck = dimensions.some((dimension) => dimension.availability.includes("dynamic") || dimension.availability.includes("auth"));
  if (needsDynamicCheck || authenticationStatus(platform).startsWith("Registry-backed only")) {
    return "Yes — Registry-backed only — not account-confirmed.";
  }
  return "Yes — confirm campaign-type, locale, policy, and reach constraints.";
}

function sourceStatus(rawInputs, keys, inputSummary) {
  const supplied = values(rawInputs, keys, inputSummary);
  return supplied.length > 0 ? "Yes" : "No";
}

function sourceValue(rawInputs, field, inputSummary) {
  const supplied = values(rawInputs, field.keys, inputSummary);
  return supplied.length > 0 ? list(supplied) : `Input missing — provide ${field.missing}.`;
}

function sourceLabel(rawInputs, keys, inputSummary = {}) {
  return values(rawInputs, keys, inputSummary).length > 0 ? "Source-backed" : "Missing";
}

function sectionWhatSourceSays(output) {
  const { rawInputs, inputSummary } = output;
  const audienceValues = values(rawInputs, ["companyNames", "accountLists", "companySizes", "jobTitles", "jobFunctions", "seniorities", "skills"]);
  const entries = [
    ["Product", inputSummary.product && inputSummary.product !== "unspecified" ? [inputSummary.product] : []],
    ["Market", inputSummary.market && inputSummary.market !== "unspecified" ? [inputSummary.market] : []],
    ["Audience", audienceValues],
    ["Campaign goal", inputSummary.campaignGoal && inputSummary.campaignGoal !== "unspecified" ? [inputSummary.campaignGoal] : []],
    ["Industries", rawInputs.industries],
    ["Personas", values(rawInputs, ["jobTitles", "jobFunctions", "seniorities", "skills"])],
    ["Keywords", values(rawInputs, ["keywords", "intentSignals", "technographics"])],
    ...MESSAGE_INPUTS.map(([label, key]) => [label, rawInputs[key]])
  ];
  const lines = ["## 1. What the Source Says", ""];
  for (const [label, supplied] of entries) {
    const status = supplied?.length > 0 ? "Source-backed" : "Missing";
    lines.push(`- **${label} — ${status}:** ${list(supplied, `Input missing — provide ${label.toLowerCase()}.`)}`);
  }
  lines.push("- **Working hypotheses:** None generated. A likely title inferred from a persona narrative must remain a Working hypothesis until the source names it.");
  lines.push("- **Evidence limitations:** This report uses only the supplied source and registry-backed platform fields. Platform picklists, minimum reach, and account eligibility are not confirmed here.");
  lines.push("- **Staleness and confidentiality:** Treat source facts as current only to the date of the supplied material. Do not put confidential lists or source material into the standalone repository.");
  lines.push("");
  return lines.join("\n");
}

function readiness(output) {
  const { rawInputs, inputSummary } = output;
  const hasProduct = inputSummary.product && inputSummary.product !== "unspecified";
  const hasGoal = inputSummary.campaignGoal && inputSummary.campaignGoal !== "unspecified";
  const hasAudience = values(rawInputs, ["companyNames", "accountLists", "industries", "companySizes", "jobTitles", "jobFunctions", "seniorities", "skills"]).length > 0;
  const hasGeo = values(rawInputs, ["geographies", "locale"], inputSummary).length > 0;
  if (!hasProduct || !hasGoal || !hasAudience) return "Not ready";
  if (!hasGeo || !rawInputs.conversionEvent?.length || !rawInputs.budget?.length) return "Partially ready";
  return "Ready";
}

function sectionActivationReadiness(output) {
  const { rawInputs, inputSummary } = output;
  const required = [
    ["product", inputSummary.product && inputSummary.product !== "unspecified"],
    ["campaign goal", inputSummary.campaignGoal && inputSummary.campaignGoal !== "unspecified"],
    ["launch geography or locale", values(rawInputs, ["geographies", "locale"], inputSummary).length > 0],
    ["target audience definition (accounts, firmographics, or personas)", values(rawInputs, ["companyNames", "accountLists", "industries", "companySizes", "jobTitles", "jobFunctions", "seniorities", "skills"]).length > 0],
    ["primary conversion event", (rawInputs.conversionEvent ?? []).length > 0],
    ["budget or test range", (rawInputs.budget ?? []).length > 0]
  ].filter(([, present]) => !present)
    .map(([label]) => label);
  const lines = ["## 2. Activation Readiness", "", `**Verdict: ${readiness(output)}**`, ""];
  lines.push("Minimum missing information before demand generation should plan spend:");
  lines.push(...(required.length ? required.map((item) => `- ${item}`) : ["- No minimum source-input gaps detected. Account-side verification still remains required."]));
  lines.push("- Available platform fields remain listed below even when the corresponding source input is missing.");
  lines.push("");
  return lines.join("\n");
}

function sectionAvailableTargetingFields(output) {
  const lines = ["## 3. Available Targeting Fields by Platform", ""];
  for (const platform of output.platformMatches) {
    lines.push(`### ${platform.platformName}`);
    lines.push("");
    lines.push("| Platform | Available targeting field | Type | Source input available? | Source-backed value or missing input | Confidence | Manual verification needed |");
    lines.push("| --- | --- | --- | --- | --- | --- | --- |");
    for (const field of FIELD_CATALOG) {
      lines.push(`| ${escapeTable(platform.platformName)} | ${escapeTable(field.label)} | ${fieldType(platform, field)} | ${sourceStatus(output.rawInputs, field.keys, output.inputSummary)} | ${escapeTable(sourceValue(output.rawInputs, field, output.inputSummary))} | ${fieldConfidence(platform, field)} | ${escapeTable(verificationNote(platform, field))} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function platformNamesForField(output, keys, matchType) {
  return output.platformMatches
    .filter((platform) => catalogDimensions(platform, { keys }).some((dimension) => matchType ? dimension.matchType === matchType : true))
    .map((platform) => platform.platformName);
}

function keywordRows(output) {
  const raw = output.rawInputs;
  const rows = [];
  if (raw.keywords.length > 0) {
    const searchPlatforms = platformNamesForField(output, ["keywords"], "substitute").filter((name) => /Google|Microsoft/.test(name));
    if (searchPlatforms.length) rows.push(["Source keywords — search", raw.keywords, "Search keyword", searchPlatforms, "Confirm campaign type, match type, policy, and negative-keyword handling in the account."]);
    const customPlatforms = platformNamesForField(output, ["keywords"], "substitute").filter((name) => !/Microsoft Advertising/.test(name));
    if (customPlatforms.length) rows.push(["Source keywords — audience/context", raw.keywords, "Custom segment", customPlatforms, "Confirm the platform accepts these terms for a custom segment or equivalent audience test."]);
  }
  if (raw.intentSignals.length > 0 || raw.technographics.length > 0) {
    const terms = [...raw.intentSignals, ...raw.technographics];
    const platforms = platformNamesForField(output, ["intentSignals", "technographics"], "substitute");
    if (platforms.length) rows.push(["Intent and technographic signals", terms, "Contextual/content test", platforms, "Confirm the signal maps to an available contextual, content, or custom-segment surface."]);
  }
  const messageTerms = MESSAGE_INPUTS.flatMap(([, key]) => raw[key]);
  if (messageTerms.length > 0) rows.push(["Pains, gains, objections, and triggers", messageTerms, "Creative, landing page, or sales follow-up only", ["All evaluated platforms"], "No targeting use. Keep these in messaging unless an authenticated platform field explicitly supports the use."]);
  return rows;
}

function sectionKeywordAudienceMap(output) {
  const rows = keywordRows(output);
  const lines = ["## 4. Concrete Keyword and Audience Map", ""];
  if (rows.length === 0) {
    lines.push("No source-backed keyword, intent, technographic, pain, gain, objection, or trigger terms were supplied.");
    lines.push("");
    return lines.join("\n");
  }
  lines.push("| Cluster | Exact terms | Allowed use | Suitable platforms | Verification needed |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const [cluster, terms, allowedUse, platforms, verification] of rows) {
    lines.push(`| ${escapeTable(cluster)} | ${escapeTable(list(terms))} | ${allowedUse} | ${escapeTable(list(platforms))} | ${escapeTable(verification)} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function sectionTargetingMap(output) {
  const lines = ["## 5. Targeting Map", "", "### Use Directly", ""];
  const direct = output.platformMatches.flatMap((platform) => platform.exactMatches.map((match) => `- **${platform.platformName} / ${match.label}:** ${list(match.requestedValues)} — Source-backed; verify in the platform.`));
  lines.push(...(direct.length ? direct : ["- No source-backed direct targeting values yet."]));
  lines.push("", "### Use as Proxies or Test Sets", "");
  const proxies = output.platformMatches.flatMap((platform) => [
    ...platform.substituteMatches.map((match) => `- **${platform.platformName} / ${match.label}:** ${list(match.requestedValues)} — test or reach proxy, not proof of buyer reach.`),
    ...platform.substitutions.map((substitution) => `- **${platform.platformName} / ${substitution.input}:** ${substitution.recommendation} Requested: ${list(substitution.requestedValues)} — test or reach proxy, not proof of buyer reach.`)
  ]);
  lines.push(...(proxies.length ? proxies : ["- No source-backed proxy or contextual test set identified."]));
  lines.push("", "### Keep in Messaging", "");
  const messaging = MESSAGE_INPUTS.filter(([, key]) => output.rawInputs[key].length > 0)
    .map(([label, key]) => `- **${label}:** ${list(output.rawInputs[key])} — use in creative, landing pages, webinar content, nurture, and sales follow-up.`);
  lines.push(...(messaging.length ? messaging : ["- No pains, gains, objections, or triggers were supplied."]));
  lines.push("");
  return lines.join("\n");
}

function channelExplanation(platform) {
  const direct = platform.exactMatches.map((match) => match.label);
  const proxy = platform.substituteMatches.map((match) => match.label);
  const substitute = platform.substitutions.map((item) => item.recommendation);
  const missing = FIELD_CATALOG
    .filter((field) => sourceStatus(platform.rawInputs ?? {}, field.keys) === "No")
    .slice(0, 1);
  return {
    fields: direct.length ? list(direct) : "No source-backed direct field values",
    proxy: proxy.length || substitute.length ? list([...proxy, ...substitute]) : "No source-backed keyword or proxy role",
    why: direct.length ? `It has ${direct.length} direct source-backed field match(es).` : proxy.length || substitute.length ? "It can support a proxy or contextual test, not precise buyer proof." : "The current source does not map to a usable field.",
    move: `${authenticationStatus(platform)} Verify audience size, dynamic picklists, campaign-type and locale constraints; add missing account, persona, geography, or first-party inputs where applicable.`
  };
}

function sectionChannelHypotheses(output) {
  const lines = ["## 6. Channel Hypotheses", ""];
  for (const [group, label] of CHANNEL_GROUPS) {
    lines.push(`### ${label}`);
    lines.push("");
    const platforms = output.platformMatches.filter((platform) => platform.channelGroup === group);
    if (platforms.length === 0) {
      lines.push("- None.");
    } else {
      for (const platform of platforms) {
        const detail = channelExplanation(platform);
        lines.push(`- **${platform.platformName}:** Available fields: ${detail.fields}. Keyword or proxy role: ${detail.proxy}. Why: ${detail.why} Move up or down: ${detail.move}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

function sectionManualVerification(output) {
  const lines = ["## 7. Manual Verification Required Before Any Campaign Build", ""];
  lines.push("- Verify dynamic picklists and authenticated/API field availability for every platform listed below.");
  lines.push("- Verify campaign-type and locale constraints, policy constraints, audience-size/minimum-reach thresholds, and first-party audience eligibility before any build.");
  lines.push("- Verify suppression logic, exclusions, and negative-keyword treatment before activation.");
  for (const platform of output.platformMatches) {
    lines.push(`- **${platform.platformName}:** ${authenticationStatus(platform)} ${platform.caveats.join(" ")}`);
  }
  lines.push("");
  return lines.join("\n");
}

const MISSING_INPUTS = [
  ["Launch geography or locale", ["geographies", "locale"], "Platform availability, language, policy, and reach checks", "All evaluated platforms", "Audience feasibility and campaign setup"],
  ["Named accounts / account list", ["companyNames", "accountLists"], "Required for account-level precision and suppression logic", "LinkedIn, Google, Microsoft, Meta, Reddit, X, TikTok, DV360 where eligible", "ABM precision and account coverage"],
  ["Company size", ["companySizes"], "Determines firmographic reach and sizing", "LinkedIn and any platform with a verified equivalent", "Firmographic feasibility"],
  ["Job title, function, or seniority", ["jobTitles", "jobFunctions", "seniorities"], "Determines persona precision versus proxy-only reach", "LinkedIn; proxy assessment for other platforms", "Persona-targeting feasibility"],
  ["First-party audience source", ["customerLists", "contactLists", "websiteVisitors", "retargetingAudiences", "engagementAudiences"], "Enables retargeting, matched audiences, and sequencing", "Platforms with eligible first-party audience fields", "Warm-audience and suppression plan"],
  ["Lookalike / similar-audience seed", ["lookalikeSeeds"], "Required to evaluate modeled expansion", "Platforms with verified modeled-audience support", "Modeled-reach testing"],
  ["Exclusions, suppression lists, and negative keywords", ["exclusions", "suppressionLists", "negativeKeywords"], "Prevents wasted spend and inappropriate reach", "Search and platforms with suppression controls", "Launch safety and traffic quality"],
  ["Budget or test range", ["budget"], "Determines channel mix and minimum viable test design", "All evaluated platforms", "Spend planning"],
  ["Primary conversion event", ["conversionEvent"], "Defines optimization and success criteria", "All evaluated platforms", "Measurement plan"]
];

function isInputPresent(output, keys) {
  return values(output.rawInputs, keys, output.inputSummary).length > 0;
}

function sectionMissingInputs(output) {
  const lines = ["## 8. Missing Inputs That Change the Plan", "", "| Missing input | Why it matters | Affected platforms | Decision blocked |", "| --- | --- | --- | --- |"];
  const missing = MISSING_INPUTS.filter(([, keys]) => !isInputPresent(output, keys));
  if (!missing.length) {
    lines.push("| None identified from the standard activation inputs | Account-side validation still applies | All evaluated platforms | Final build confirmation |");
  } else {
    for (const [input, , why, platforms, blocked] of missing) lines.push(`| ${escapeTable(input)} | ${escapeTable(why)} | ${escapeTable(platforms)} | ${escapeTable(blocked)} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function matchesForDetail(matches) {
  return matches.length ? matches.map((match) => `${match.label}: ${list(match.requestedValues)}`).join("; ") : "None";
}

function sectionPlatformDetail(output) {
  const lines = ["## 9. Complete Platform Detail", ""];
  for (const platform of output.platformMatches) {
    lines.push(`### ${platform.platformName}`);
    lines.push("");
    lines.push(`- **Exact matches:** ${matchesForDetail(platform.exactMatches)}`);
    lines.push(`- **Proxy or substitute fields:** ${matchesForDetail(platform.substituteMatches)}${platform.substitutions.length ? `; ${platform.substitutions.map((item) => item.recommendation).join("; ")}` : ""}`);
    const unavailable = FIELD_CATALOG.filter((field) => fieldType(platform, field) === "Not targetable").map((field) => field.label);
    lines.push(`- **Unavailable dimensions:** ${list(unavailable)}`);
    lines.push(`- **Caveats:** ${list(platform.caveats)}`);
    lines.push(`- **Official source URL:** ${platform.source.url}`);
    lines.push(`- **Source-check date:** ${platform.source.checkedAt}`);
    lines.push(`- **Authentication status:** ${authenticationStatus(platform)}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function renderMarkdownReport(output) {
  const lines = [
    "# Channel Targeting Feasibility Report",
    "",
    sectionWhatSourceSays(output),
    sectionActivationReadiness(output),
    sectionAvailableTargetingFields(output),
    sectionKeywordAudienceMap(output),
    sectionTargetingMap(output),
    sectionChannelHypotheses(output),
    sectionManualVerification(output),
    sectionMissingInputs(output),
    sectionPlatformDetail(output)
  ];
  return `${lines.join("\n")}\n`;
}
