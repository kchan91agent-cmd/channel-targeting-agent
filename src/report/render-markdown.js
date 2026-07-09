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

const SENSITIVE_DOC_EVIDENCE_KEYS = new Set([
  "companyNames",
  "accountLists",
  "customerLists",
  "contactLists",
  "websiteVisitors",
  "retargetingAudiences",
  "engagementAudiences",
  "lookalikeSeeds",
  "suppressionLists"
]);

const SOURCE_INPUTS = [
  ["Geographies", "geographies"],
  ["Industries", "industries"],
  ["Company sizes", "companySizes"],
  ["Company names", "companyNames"],
  ["Account lists", "accountLists"],
  ["Customer lists", "customerLists"],
  ["Contact lists", "contactLists"],
  ["Website visitors", "websiteVisitors"],
  ["Retargeting audiences", "retargetingAudiences"],
  ["Engagement audiences", "engagementAudiences"],
  ["Lookalike seeds", "lookalikeSeeds"],
  ["Job titles", "jobTitles"],
  ["Job functions", "jobFunctions"],
  ["Seniorities", "seniorities"],
  ["Skills", "skills"],
  ["Interests", "interests"],
  ["Keywords", "keywords"],
  ["Communities", "communities"],
  ["Placements", "placements"],
  ["Topics", "topics"],
  ["Devices", "devices"],
  ["Demographics", "demographics"],
  ["Education", "education"],
  ["Life events", "lifeEvents"],
  ["Technographics", "technographics"],
  ["Intent signals", "intentSignals"],
  ["Pains", "pains"],
  ["Gains", "gains"],
  ["Objections", "objections"],
  ["Triggers", "triggers"],
  ["Exclusions", "exclusions"],
  ["Negative keywords", "negativeKeywords"],
  ["Suppression lists", "suppressionLists"],
  ["Budget", "budget"],
  ["Conversion event", "conversionEvent"],
  ["Measurement thresholds", "measurementThresholds"],
  ["Audience sizing requirements", "audienceSizingRequirements"],
  ["Preferred channels", "preferredChannels"],
  ["Compliance constraints", "complianceConstraints"]
];

const MESSAGE_INPUTS = [
  ["Pains", "pains"],
  ["Gains", "gains"],
  ["Objections", "objections"],
  ["Triggers", "triggers"]
];

const CHANNEL_GROUPS = [
  ["best-fit", "Conditional best fit"],
  ["strong-secondary", "Strong secondary"],
  ["experimental", "Experimental or situational"],
  ["low-fit", "Low fit"]
];

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

function shortList(items, limit = 6, fallback = "None") {
  const unique = [...new Set((items ?? []).filter(Boolean))];
  if (unique.length === 0) return fallback;
  const visible = unique.slice(0, limit).join(", ");
  return unique.length > limit ? `${visible} (+${unique.length - limit} more; see appendix)` : visible;
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
  if (platform.fieldCheck?.mode === "live-api" && platform.fieldCheck.liveFields?.length > 0) {
    return `Read-only live API field check run at ${platform.fieldCheck.checkedAt}; account/API-confirmed fields: ${platform.fieldCheck.liveFields.map((field) => field.label).join(", ")}. Unlisted fields remain registry-backed only.`;
  }
  if (platform.fieldCheck?.mode === "live-api-account-probe" && platform.fieldCheck.account?.verified) {
    return `Read-only account probe succeeded at ${platform.fieldCheck.checkedAt}; field-level availability remains registry-backed only.`;
  }
  if (platform.fieldCheck?.errors?.some((error) => error.code === "MISSING_AUTH")) {
    return "Registry-backed only — not account-confirmed.";
  }
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
  return values(rawInputs, keys, inputSummary).length > 0 ? "Yes" : "No";
}

function sourceValue(rawInputs, field, inputSummary) {
  const supplied = values(rawInputs, field.keys, inputSummary);
  return supplied.length > 0 ? list(supplied) : `Input missing — provide ${field.missing}.`;
}

function isInputPresent(output, keys) {
  return values(output.rawInputs, keys, output.inputSummary).length > 0;
}

function missingInputRows(output) {
  return MISSING_INPUTS.filter(([, keys]) => !isInputPresent(output, keys));
}

function platformsInGroup(output, group) {
  return output.platformMatches.filter((platform) => platform.channelGroup === group);
}

function platformNames(platforms, fallback = "none") {
  return platforms.length ? platforms.map((platform) => platform.platformName).join(", ") : fallback;
}

function platformSubject(platforms) {
  return {
    names: platformNames(platforms),
    verb: platforms.length === 1 ? "is" : "are",
    secondaryNoun: platforms.length === 1 ? "a strong secondary path" : "strong secondary paths"
  };
}

function directFieldLabels(platform) {
  return platform.exactMatches.map((match) => match.label);
}

function proxyFieldLabels(platform) {
  return [
    ...platform.substituteMatches.map((match) => match.label),
    ...platform.substitutions.map((substitution) => substitution.recommendation)
  ];
}

function platformNamesForField(output, keys, matchType) {
  return output.platformMatches
    .filter((platform) => catalogDimensions(platform, { keys }).some((dimension) => matchType ? dimension.matchType === matchType : true))
    .map((platform) => platform.platformName);
}

function clusterValues(output, keys) {
  return values(output.rawInputs, keys, output.inputSummary);
}

function keywordRows(output) {
  const rows = [];
  const searchTerms = clusterValues(output, ["keywords", "intentSignals", "technographics"]);
  if (searchTerms.length > 0) {
    const searchPlatforms = platformNamesForField(output, ["keywords", "intentSignals", "technographics"], "substitute").filter((name) => /Google|Microsoft/.test(name));
    if (searchPlatforms.length) rows.push(["Search and category demand", searchTerms, "Search keyword", searchPlatforms, "Confirm campaign type, match type, policy, volume, and negative-keyword handling in the account."]);
    const customPlatforms = platformNamesForField(output, ["keywords", "intentSignals", "technographics"], "substitute").filter((name) => !/Microsoft Advertising/.test(name));
    if (customPlatforms.length) rows.push(["Custom segment and intent proxies", searchTerms, "Custom segment", customPlatforms, "Confirm the platform accepts these terms for a custom segment or equivalent audience test."]);
  }

  const contextualTerms = clusterValues(output, ["topics", "placements", "communities", "industries", "interests"]);
  if (contextualTerms.length > 0) {
    const platforms = platformNamesForField(output, ["topics", "placements", "communities", "industries", "interests"], "substitute");
    rows.push(["Contextual and audience signals", contextualTerms, "Contextual/content test", platforms.length ? platforms : ["All evaluated platforms where contextual inventory is available"], "Verify inventory, picklists, reach, and whether the signal is contextual rather than persona-precise."]);
  }

  const firstPartyTerms = clusterValues(output, ["companyNames", "accountLists", "customerLists", "contactLists", "websiteVisitors", "retargetingAudiences", "engagementAudiences", "lookalikeSeeds", "suppressionLists"]);
  if (firstPartyTerms.length > 0) {
    rows.push(["First-party and account motion", firstPartyTerms, "Custom segment", ["Platforms with eligible matched-audience, customer-list, retargeting, or suppression support"], "Verify upload eligibility, consent, match rates, audience minimums, and suppression logic."]);
  }

  const messageTerms = MESSAGE_INPUTS.flatMap(([, key]) => output.rawInputs[key]);
  if (messageTerms.length > 0) {
    rows.push(["Pains, gains, objections, and triggers", messageTerms, "Creative, landing page, or sales follow-up only", ["All evaluated platforms"], "No targeting use unless an authenticated platform field explicitly supports it."]);
  }

  return rows;
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

function topOpportunities(output) {
  const opportunities = [];
  const firstParty = clusterValues(output, ["companyNames", "accountLists", "customerLists", "contactLists", "websiteVisitors", "retargetingAudiences", "engagementAudiences", "suppressionLists"]);
  const best = platformsInGroup(output, "best-fit");
  const strong = platformsInGroup(output, "strong-secondary");
  const searchTerms = clusterValues(output, ["keywords", "intentSignals", "technographics"]);
  const experimental = platformsInGroup(output, "experimental");

  if (best.length > 0) {
    const platform = best[0];
    opportunities.push(`${platform.platformName} is the strongest paid-media fit. It maps the source into ${shortList(directFieldLabels(platform), 5, "source-backed direct fields")}; verify audience size and dynamic picklists before spend.`);
  }
  if (firstParty.length > 0) {
    opportunities.push(`First-party/account targeting is the biggest activation unlock. Use ${shortList(firstParty, 6)} for matched audiences, retargeting, sequencing, and suppression where the platform allows it.`);
  } else {
    opportunities.push("The biggest missing unlock is first-party/account targeting. Named accounts, customer/contact lists, website audiences, and suppression lists would materially improve precision.");
  }
  if (strong.length > 0) {
    const subject = platformSubject(strong);
    opportunities.push(`${subject.names} ${subject.verb} ${subject.secondaryNoun}. Treat as demand-capture, contextual, or profile-derived tests unless authenticated checks prove tighter persona reach.`);
  }
  if (searchTerms.length > 0) {
    opportunities.push(`Search and custom-segment tests have usable demand language: ${shortList(searchTerms, 6)}. Use these as intent/proxy signals, not proof of exact buyer reach.`);
  }
  if (experimental.length > 0) {
    const subject = platformSubject(experimental);
    opportunities.push(`${subject.names} ${subject.verb} experimental or situational. Use for message learning, content/context tests, retargeting, or amplification rather than precise B2B persona targeting.`);
  }

  return opportunities.slice(0, 5);
}

function campaignConcepts(output) {
  const concepts = [];
  const firstParty = clusterValues(output, ["companyNames", "accountLists", "customerLists", "contactLists"]);
  const retargeting = clusterValues(output, ["websiteVisitors", "retargetingAudiences", "engagementAudiences"]);
  const suppression = clusterValues(output, ["suppressionLists", "exclusions", "negativeKeywords"]);
  const searchTerms = clusterValues(output, ["keywords", "intentSignals", "technographics"]);
  const best = platformsInGroup(output, "best-fit")[0];
  const industries = output.rawInputs.industries ?? [];
  const personas = clusterValues(output, ["jobTitles", "jobFunctions", "seniorities"]);

  if (firstParty.length > 0) concepts.push(`Account/customer activation campaign: use ${shortList(firstParty, 6)} as the core matched-audience or CRM-backed motion.`);
  if (best && (industries.length > 0 || personas.length > 0)) concepts.push(`${best.platformName} persona campaign: target ${shortList([...industries, ...personas], 8)} with source-backed messaging.`);
  if (searchTerms.length > 0) concepts.push(`Search/custom-segment demand test: build tightly controlled tests around ${shortList(searchTerms, 8)} with negative keywords and landing-page alignment.`);
  if (retargeting.length > 0) concepts.push(`Retargeting and engagement sequence: use ${shortList(retargeting, 6)} to move warm audiences to the next conversion event.`);
  if (suppression.length > 0) concepts.push(`Suppression-safe launch path: apply ${shortList(suppression, 6)} so the wrong audience does not receive the wrong CTA.`);
  if (concepts.length === 0) concepts.push("Source-backed targeting is too sparse for campaign concepts; add audience, intent, first-party, and conversion inputs before planning spend.");

  return concepts.slice(0, 5);
}

function renderMissingInputsTable(output) {
  const lines = ["| Missing input | Why it matters | Affected platforms | Decision blocked |", "| --- | --- | --- | --- |"];
  const missing = missingInputRows(output);
  if (!missing.length) {
    lines.push("| None identified from the standard activation inputs | Account-side validation still applies | All evaluated platforms | Final build confirmation |");
  } else {
    for (const [input, , why, platforms, blocked] of missing) lines.push(`| ${escapeTable(input)} | ${escapeTable(why)} | ${escapeTable(platforms)} | ${escapeTable(blocked)} |`);
  }
  return lines;
}

export function renderExecutiveBrief(output) {
  const lines = ["## Executive Brief", "", "### Top Opportunities", ""];
  topOpportunities(output).forEach((opportunity, index) => lines.push(`${index + 1}. ${opportunity}`));

  lines.push("", "### Channel Readout", "");
  for (const [group, label] of CHANNEL_GROUPS) {
    lines.push(`- **${label}:** ${platformNames(platformsInGroup(output, group))}`);
  }
  lines.push(`- **Activation readiness:** ${readiness(output)}`);

  lines.push("", "### Best Campaign Concepts", "");
  for (const concept of campaignConcepts(output)) lines.push(`- ${concept}`);

  lines.push("", "### Missing Inputs That Would Improve Targeting", "");
  lines.push(...renderMissingInputsTable(output));

  lines.push("", "### Important Caveat", "");
  lines.push("All platform conclusions are registry-backed unless authenticated account checks were explicitly run. Registry-backed only — not account-confirmed. Verify picklists, audience size, campaign type, locale, policy constraints, first-party eligibility, and suppression logic before any campaign build.");
  lines.push("");
  return lines.join("\n");
}

function renderSourceInputs(output) {
  const lines = ["### Source Inputs", ""];
  lines.push(`- **Product:** ${output.inputSummary.product ?? "Input missing — provide product."}`);
  lines.push(`- **Market:** ${output.inputSummary.market ?? "Input missing — provide market."}`);
  lines.push(`- **Locale:** ${output.inputSummary.locale ?? "unspecified"}`);
  lines.push(`- **Campaign goal:** ${output.inputSummary.campaignGoal ?? "Input missing — provide campaign goal."}`);
  for (const [label, key] of SOURCE_INPUTS) {
    const supplied = output.rawInputs[key] ?? [];
    if (supplied.length > 0) lines.push(`- **${label}:** ${list(supplied)}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function renderKeywordClusterGuidance(output) {
  const clusters = [
    ["First-party / account motion", clusterValues(output, ["companyNames", "accountLists", "customerLists", "contactLists", "websiteVisitors", "retargetingAudiences", "engagementAudiences", "lookalikeSeeds", "suppressionLists"]), "Use for matched audiences, CRM-backed activation, retargeting, sequencing, lookalike seeds, and suppression after eligibility checks."],
    ["Search / category demand", clusterValues(output, ["keywords", "intentSignals", "technographics"]), "Use for search, custom-segment, and demand-capture tests when the term maps to real buyer intent."],
    ["Contextual / audience signals", clusterValues(output, ["topics", "placements", "communities", "industries", "interests"]), "Use for contextual inventory, content adjacency, communities, and broad audience tests; do not treat as persona precision."],
    ["Pain / problem", clusterValues(output, ["pains", "objections"]), "Use mostly for creative, landing-page copy, sales follow-up, and problem-led ad variants."],
    ["Trigger / initiative", clusterValues(output, ["triggers"]), "Use for timely campaign angles, search modifiers, nurture logic, and sales conversation context."],
    ["Gain / outcome", clusterValues(output, ["gains"]), "Use for proof points, CTA framing, landing-page hierarchy, and sales enablement."],
    ["Exclusions / launch safety", clusterValues(output, ["exclusions", "negativeKeywords", "suppressionLists"]), "Use for negative keywords, exclusions, and audience-safety review before activation."]
  ].filter(([, terms]) => terms.length > 0);

  const lines = ["### Keyword Cluster Guidance", ""];
  if (clusters.length === 0) {
    lines.push("No source-backed keyword, contextual, first-party, message, or exclusion clusters were supplied.");
  } else {
    for (const [label, terms, use] of clusters) {
      lines.push(`- **${label}:** Most useful examples: ${shortList(terms, 8)}. Recommended use: ${use}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function renderKeywordAudienceMap(output) {
  const rows = keywordRows(output);
  const lines = ["### Concrete Keyword and Audience Map", ""];
  if (rows.length === 0) {
    lines.push("No source-backed keyword, intent, technographic, first-party, pain, gain, objection, or trigger terms were supplied.");
  } else {
    lines.push("| Cluster | Exact terms | Allowed use | Suitable platforms | Verification needed |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const [cluster, terms, allowedUse, platforms, verification] of rows) {
      lines.push(`| ${escapeTable(cluster)} | ${escapeTable(list(terms))} | ${allowedUse} | ${escapeTable(list(platforms))} | ${escapeTable(verification)} |`);
    }
  }

  lines.push("", "#### Use Directly", "");
  const direct = output.platformMatches.flatMap((platform) => platform.exactMatches.map((match) => `- **${platform.platformName} / ${match.label}:** ${shortList(match.requestedValues, 8)} — Source-backed; verify in the platform.`));
  lines.push(...(direct.length ? direct : ["- No source-backed direct targeting values yet."]));

  lines.push("", "#### Use as Proxies or Test Sets", "");
  const proxies = output.platformMatches.flatMap((platform) => [
    ...platform.substituteMatches.map((match) => `- **${platform.platformName} / ${match.label}:** ${shortList(match.requestedValues, 8)} — test or reach proxy, not proof of buyer reach.`),
    ...platform.substitutions.map((substitution) => `- **${platform.platformName} / ${substitution.input}:** ${substitution.recommendation} Requested: ${shortList(substitution.requestedValues, 8)} — test or reach proxy, not proof of buyer reach.`)
  ]);
  lines.push(...(proxies.length ? proxies : ["- No source-backed proxy or contextual test set identified."]));

  lines.push("", "#### Keep in Messaging", "");
  const messaging = MESSAGE_INPUTS.filter(([, key]) => output.rawInputs[key].length > 0)
    .map(([label, key]) => `- **${label}:** ${list(output.rawInputs[key])} — Creative, landing page, or sales follow-up only unless an authenticated platform field explicitly supports targeting use.`);
  lines.push(...(messaging.length ? messaging : ["- No pains, gains, objections, or triggers were supplied."]));
  lines.push("");
  return lines.join("\n");
}

function renderDocsBackedValueEvidence(output) {
  const lines = ["### Docs-Backed Value Evidence", ""];
  const matches = output.docsBackedValueMatches ?? [];
  if (matches.length === 0) {
    lines.push("No docs-backed platform-value catalogs were loaded, or no source inputs mapped to a docs-backed value category.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("| Platform | Source input terms | Docs-backed field | Official values/categories | Official source | Verification needed |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  let rowCount = 0;
  for (const catalog of matches) {
    for (const field of catalog.fields) {
      if ((field.inputKeys ?? []).some((key) => SENSITIVE_DOC_EVIDENCE_KEYS.has(key))) continue;
      if ((field.requestedValues ?? []).length === 0) continue;
      const values = field.values ?? [];
      const first = values[0] ?? {};
      const officialValues = values.map((value) => value.label).join(", ");
      const source = first.sourceUrl ? `[${escapeTable(first.sourceLabel ?? "official source")}](${first.sourceUrl})` : "Official source metadata unavailable";
      const caveat = first.caveats?.[0] ?? "Verify exact account availability, locale, policy, and current picklists before campaign build.";
      lines.push(`| ${escapeTable(catalog.platformName)} | ${escapeTable(shortList(field.requestedValues, 8))} | ${escapeTable(field.label)} | ${escapeTable(officialValues)} | ${source} | ${escapeTable(caveat)} |`);
      rowCount += 1;
    }
  }
  if (rowCount === 0) lines.push("| None | No non-private source input terms mapped to docs-backed categories | None | None | None | Account/list-style inputs are intentionally omitted from this evidence table. |");
  lines.push("");
  return lines.join("\n");
}

function renderPlatformFieldInventory(output) {
  const lines = ["### Platform Field Inventory", ""];
  for (const platform of output.platformMatches) {
    lines.push(`#### ${platform.platformName}`);
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

function matchesForDetail(matches) {
  return matches.length ? matches.map((match) => `${match.label}: ${list(match.requestedValues)}`).join("; ") : "None";
}

function renderPlatformDetail(output) {
  const lines = ["### Platform Detail", ""];
  for (const platform of output.platformMatches) {
    const unavailable = FIELD_CATALOG.filter((field) => fieldType(platform, field) === "Not targetable").map((field) => field.label);
    lines.push(`#### ${platform.platformName}`);
    lines.push("");
    lines.push(`- **Channel group:** ${platform.channelGroupLabel}. Confidence: ${platform.confidence}.`);
    lines.push(`- **Channel type:** ${platform.channelType}`);
    lines.push(`- **Exact matches:** ${matchesForDetail(platform.exactMatches)}`);
    lines.push(`- **Proxy or substitute fields:** ${matchesForDetail(platform.substituteMatches)}${platform.substitutions.length ? `; ${platform.substitutions.map((item) => `${item.input}: ${item.recommendation} Requested: ${list(item.requestedValues)}`).join("; ")}` : ""}`);
    lines.push(`- **Unavailable dimensions:** ${list(unavailable)}`);
    lines.push(`- **Caveats:** ${list(platform.caveats)}`);
    lines.push(`- **Official source URL:** ${platform.source.url}`);
    lines.push(`- **Source-check date:** ${platform.source.checkedAt}`);
    lines.push(`- **Authentication status:** ${authenticationStatus(platform)}`);
    lines.push("");
  }
  return lines.join("\n");
}

function renderCrossPlatformGaps(output) {
  const lines = ["### Cross-Platform Gaps", ""];
  const gaps = output.unavailableStrategyDimensions ?? [];
  if (gaps.length === 0) {
    lines.push("- No cross-platform unavailable source dimensions were identified. Account-side validation still applies.");
  } else {
    for (const gap of gaps) lines.push(`- ${gap}`);
  }
  const missing = missingInputRows(output).map(([input]) => input);
  if (missing.length > 0) lines.push(`- Missing activation inputs with material planning impact: ${list(missing)}.`);
  lines.push("");
  return lines.join("\n");
}

function renderManualVerification(output) {
  const lines = ["### Manual Verification Required", ""];
  lines.push("- Verify exact picklists and authenticated/API field availability in each ad account before campaign build.");
  lines.push("- Verify campaign-type and locale constraints, policy constraints, audience-size/minimum-reach thresholds, and first-party audience eligibility.");
  lines.push("- Verify suppression logic, exclusions, and negative-keyword treatment before activation.");
  lines.push("- Do not upload customer, contact, or account lists from this tool.");
  lines.push("- Treat pains, gains, objections, and triggers as message strategy unless a platform exposes a confirmed targeting field.");
  for (const platform of output.platformMatches) {
    lines.push(`- **${platform.platformName}:** ${authenticationStatus(platform)} ${platform.caveats.join(" ")}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function renderAppendix(output) {
  return [
    "## Appendix: Targeting Evidence and Platform Detail",
    "",
    renderSourceInputs(output),
    renderKeywordClusterGuidance(output),
    renderKeywordAudienceMap(output),
    renderDocsBackedValueEvidence(output),
    renderPlatformFieldInventory(output),
    renderPlatformDetail(output),
    renderCrossPlatformGaps(output),
    renderManualVerification(output)
  ].join("\n");
}

export function renderMarkdownReport(output) {
  const lines = [
    "# Channel Targeting Feasibility Report",
    "",
    renderExecutiveBrief(output),
    renderAppendix(output)
  ];
  return `${lines.join("\n")}\n`;
}
