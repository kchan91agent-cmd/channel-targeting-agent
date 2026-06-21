function formatList(items) {
  if (!items || items.length === 0) return "None";
  return items.join(", ");
}

function truncateList(items, limit = 8) {
  if (!items || items.length === 0) return "None";
  if (items.length <= limit) return formatList(items);
  return `${items.slice(0, limit).join(", ")} (+${items.length - limit} more; see appendix)`;
}

function shouldCompactMatch(match) {
  const compactInputs = new Set(["keywords", "pains", "triggers", "interests", "communities"]);
  return match.inputKeys.some((key) => compactInputs.has(key)) || match.requestedValues.length > 14;
}

function sectionForMatches(title, matches) {
  if (!matches || matches.length === 0) return `### ${title}\n\nNone\n`;

  const lines = [`### ${title}`, ""];
  for (const match of matches) {
    const values = shouldCompactMatch(match) ? truncateList(match.requestedValues) : formatList(match.requestedValues);
    lines.push(`- **${match.label}**: ${values} (${match.availability}, ${match.confidence} confidence)`);
  }
  return `${lines.join("\n")}\n`;
}

function sectionForSubstitutions(substitutions) {
  if (!substitutions || substitutions.length === 0) return "### Suggested Substitutes\n\nNone\n";

  const lines = ["### Suggested Substitutes", ""];
  for (const substitution of substitutions) {
    lines.push(`- **${substitution.input}**: ${substitution.recommendation} Requested: ${truncateList(substitution.requestedValues)} (${substitution.confidence} confidence)`);
  }
  return `${lines.join("\n")}\n`;
}

function sectionForUnavailable(unavailable) {
  if (!unavailable || unavailable.length === 0) return "### Not Directly Targetable\n\nNone\n";

  const lines = ["### Not Directly Targetable", ""];
  for (const item of unavailable) {
    lines.push(`- **${item.input}**: ${truncateList(item.requestedValues)}. ${item.reason}`);
  }
  return `${lines.join("\n")}\n`;
}

function recommendationLine(match) {
  return `**${match.channelGroupLabel}. Confidence: ${match.confidence}.**`;
}

function formatGroupPlatforms(group) {
  if (!group.platforms || group.platforms.length === 0) return "- None";
  return group.platforms
    .map((platform) => `- **${platform.platformName}**: ${platform.directFitLabel} direct fit, ${platform.proxyFitLabel.toLowerCase()} proxy fit`)
    .join("\n");
}

function formatNames(names, fallback = "") {
  if (!names || names.length === 0) return fallback;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

function summarizeBestFit(output) {
  const bestFit = output.channelGroups?.find((group) => group.group === "best-fit")?.platforms ?? [];
  if (bestFit.length === 0) return "No channel currently shows enough exact persona or account fit to act as a clear best-fit group.";
  const names = bestFit.map((platform) => platform.platformName);
  const verb = names.length === 1 ? "shows" : "show";
  return `Based on the current registry, ${formatNames(names)} ${verb} the clearest direct mapping from the PMM brief into available targeting fields. Treat this as a planning hypothesis to verify with audience sizing, campaign-type constraints, and in-platform picklists before committing budget.`;
}

function sectionForPmmReadout(output) {
  const lines = [
    "## PMM Readout",
    "",
    summarizeBestFit(output),
    "",
    "### Best-Fit Channel Groups",
    ""
  ];

  for (const group of output.channelGroups ?? []) {
    lines.push(`#### ${group.label}`);
    lines.push("");
    lines.push(formatGroupPlatforms(group));
    lines.push("");
  }

  lines.push("### How To Use This");
  lines.push("");
  lines.push("- Treat exact company, industry, size, role, seniority, and skill matches as stronger planning evidence than proxy-only signals.");
  lines.push("- Treat keyword, interest, content, and community options as reach or learning proxies, not proof that the platform can target the buyer directly.");
  lines.push("- Use the channel groups to discuss sequencing, budget allocation, and test design with demand generation, not as a final media plan.");
  lines.push("");
  lines.push("### Score Definitions");
  lines.push("");
  lines.push("- **Direct fit** means the platform exposes a native or authenticated targeting surface for the input, such as company, role, seniority, account list, customer list, retargeting audience, or device.");
  lines.push("- **Proxy fit** means the platform can approximate the strategy through keywords, interests, content, communities, lookalikes, or contextual signals, but cannot prove it is reaching the exact buyer.");
  lines.push("- **Very strong / strong / moderate / light** are planning bands, not media forecasts. Validate audience size, policy constraints, and campaign type inside the ad platform before launch.");
  lines.push("");
  return lines.join("\n");
}

function sectionForDemandGenPrep(output) {
  const bestFitNames = output.channelGroups?.find((group) => group.group === "best-fit")?.platforms.map((platform) => platform.platformName) ?? [];
  const experimentalNames = output.channelGroups?.find((group) => group.group === "experimental")?.platforms.map((platform) => platform.platformName) ?? [];
  const lines = [
    "## Demand Gen Conversation Prep",
    "",
    "- Confirm whether the candidate best-fit group has enough reachable audience after layering company, seniority, function, title, and skill filters.",
    "- Ask which proxy-heavy channels should support demand capture, retargeting, or message testing rather than direct persona targeting.",
    "- Check whether first-party, retargeting, engagement, or suppression audiences already exist before building cold targeting from scratch.",
    "- Validate whether keyword clusters should be separated into search campaigns, custom segments, contextual placements, or landing-page/creative themes.",
    "- Review manual verification needs before using dynamic picklists, matched audiences, account lists, or regulated/sensitive claims.",
    "- Decide what the PMM needs from demand gen: audience sizing, campaign structure, budget split, exclusions, measurement, and creative testing plan.",
    ""
  ];

  if (bestFitNames.length > 0) {
    lines.push(`Candidate best-fit channels to verify first: ${formatNames(bestFitNames)}.`);
    lines.push("");
  }
  if (experimentalNames.length > 0) {
    lines.push(`Experimental channels to discuss only after the core plan is clear: ${formatNames(experimentalNames)}.`);
    lines.push("");
  }
  return lines.join("\n");
}

function valuesForMatch(match) {
  return shouldCompactMatch(match) ? truncateList(match.requestedValues, 6) : truncateList(match.requestedValues, 6);
}

function rankedPlatformMatches(output, groups = ["best-fit", "strong-secondary"]) {
  return (output.platformMatches ?? []).filter((match) => groups.includes(match.channelGroup));
}

const PROXY_TEST_PLATFORM_ORDER = [
  "microsoft-ads",
  "dv360",
  "google-ads-youtube",
  "reddit-ads",
  "x-ads",
  "meta-ads",
  "tiktok-ads"
];

function hasProxyLevers(platform) {
  return platform.substituteMatches.length > 0 || platform.substitutions.length > 0;
}

function proxyPlatformRank(platform) {
  const index = PROXY_TEST_PLATFORM_ORDER.indexOf(platform.platformId);
  return index === -1 ? PROXY_TEST_PLATFORM_ORDER.length : index;
}

function proxyPlatformMatches(output) {
  const proxyPlatforms = rankedPlatformMatches(output, ["best-fit", "strong-secondary", "experimental"])
    .filter(hasProxyLevers)
    .sort((a, b) => {
      const rankDelta = proxyPlatformRank(a) - proxyPlatformRank(b);
      if (rankDelta !== 0) return rankDelta;
      return b.proxyActionabilityScore - a.proxyActionabilityScore;
    });
  const hasPreferredChannels = (output.rawInputs?.preferredChannels?.length ?? 0) > 0;
  if (hasPreferredChannels) return proxyPlatforms.filter((platform) => platform.recommended).slice(0, 5);
  return proxyPlatforms.slice(0, 3);
}

function sectionForActivationActions(output) {
  const candidatePlatforms = rankedPlatformMatches(output);
  const bestFitNames = output.channelGroups?.find((group) => group.group === "best-fit")?.platforms.map((platform) => platform.platformName) ?? [];
  const exactLevers = candidatePlatforms.flatMap((platform) =>
    platform.exactMatches.map((match) => ({
      platform: platform.platformName,
      label: match.label,
      values: valuesForMatch(match),
      needsPicklistCheck: match.availability.includes("dynamic") || match.confidence !== "high"
    }))
  );
  const dynamicLevers = exactLevers.filter((lever) => lever.needsPicklistCheck);
  const proxyPlatforms = proxyPlatformMatches(output);
  const lines = ["## Activation Actions", ""];

  if (bestFitNames.length > 0) {
    lines.push(`1. Size the candidate audience in ${formatNames(bestFitNames)} to ensure there is a large enough audience size.`);
  } else {
    lines.push("1. Do not move into channel planning yet; the brief does not contain enough direct audience or account targeting evidence.");
  }

  if (exactLevers.length > 0) {
    const leverSummary = exactLevers.slice(0, 5).map((lever) => `${lever.platform} ${lever.label}`).join("; ");
    lines.push(`2. Verify these direct attributes are available to target within each platform: ${leverSummary}.`);
  } else {
    lines.push("2. Add audience, account, role, seniority, or first-party inputs before asking demand gen for media recommendations.");
  }

  if (dynamicLevers.length > 0) {
    const dynamicSummary = dynamicLevers.slice(0, 5).map((lever) => `${lever.platform} ${lever.label}`).join("; ");
    lines.push(`3. Verify direct attributes within each platform such as dynamic picklists or authenticated availability for: ${dynamicSummary}.`);
  } else {
    lines.push("3. Confirm platform-specific policy, campaign type, and geography constraints before build.");
  }

  if (proxyPlatforms.length > 0) {
    const testPathLabel = proxyPlatforms.length === 1 ? "a test path" : "test paths";
    lines.push(`4. Treat ${formatNames(proxyPlatforms.map((platform) => platform.platformName))} as ${testPathLabel} for demand capture, contextual reach, or message learning unless audience sizing proves otherwise.`);
  } else {
    lines.push("4. Avoid proxy-heavy testing until there is a clearer audience or contextual signal.");
  }

  lines.push("5. Keep pains, gains, objections, and triggers primarily in copy, landing pages, and sales follow-up unless the platform exposes a confirmed targeting field. There is currently no direct way to target these aside from broad keyword matches, which are not recommended as a primary targeting strategy.");
  lines.push("");
  return lines.join("\n");
}

function sectionForTargetingMap(output) {
  const messageOnlyKeys = new Set(["pains", "gains", "objections", "triggers"]);
  const directLevers = rankedPlatformMatches(output).flatMap((platform) =>
    platform.exactMatches.map((match) => `- **${platform.platformName} / ${match.label}**: ${valuesForMatch(match)} (${match.confidence} confidence)`)
  );
  const proxyLevers = proxyPlatformMatches(output).flatMap((platform) => [
    ...platform.substituteMatches.map((match) => `- **${platform.platformName} / ${match.label}**: ${valuesForMatch(match)} (${match.confidence} confidence)`),
    ...platform.substitutions
      .filter((substitution) => !messageOnlyKeys.has(substitution.input))
      .map((substitution) => `- **${platform.platformName} / ${substitution.input}**: ${substitution.recommendation} Requested: ${truncateList(substitution.requestedValues, 6)} (${substitution.confidence} confidence)`)
  ]);
  const rawInputs = output.rawInputs ?? {};
  const messageInputs = [
    ["Pains", rawInputs.pains],
    ["Gains", rawInputs.gains],
    ["Objections", rawInputs.objections],
    ["Triggers", rawInputs.triggers]
  ].filter(([, values]) => values?.length > 0);
  const lines = ["## Targeting Map", ""];

  lines.push("### Use Directly");
  lines.push("");
  lines.push(...(directLevers.length > 0 ? directLevers.slice(0, 10) : ["- None yet. Add firmer ICP, account, persona, or first-party audience inputs."]));
  lines.push("");

  lines.push("### Use As Proxies Or Test/Experiment Campaign Sets");
  lines.push("");
  lines.push(...(proxyLevers.length > 0 ? proxyLevers.slice(0, 10) : ["- None detected from the current brief."]));
  lines.push("");

  lines.push("### Keep Primarily In Messaging (Low Confidence in targeting for conversion)");
  lines.push("");
  if (messageInputs.length === 0) {
    lines.push("- None supplied.");
  } else {
    for (const [label, values] of messageInputs) {
      lines.push(`- **${label}**: ${truncateList(values, 6)}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function countSupplied(rawInputs, keys) {
  return keys.flatMap((key) => rawInputs[key] ?? []).length;
}

function sectionForMissingInputs(output) {
  const rawInputs = output.rawInputs ?? {};
  const checks = [
    {
      label: "Geography / market scope",
      keys: ["geographies"],
      isMissing: () => rawInputs.geographies?.length === 0 && output.inputSummary.locale === "unspecified",
      action: "Add launch geographies or locale so platform availability, language, and audience-size checks are meaningful."
    },
    {
      label: "ICP company size",
      keys: ["companySizes"],
      action: "Add the ICP employee or revenue-size bands needed for this campaign."
    },
    {
      label: "ICP job titles",
      keys: ["jobTitles"],
      action: "Add the buyer or influencer titles to make persona targeting and audience sizing specific."
    },
    {
      label: "ICP job functions",
      keys: ["jobFunctions"],
      action: "Add the relevant job functions so platforms without title precision can be assessed."
    },
    {
      label: "ICP seniority",
      keys: ["seniorities"],
      action: "Add decision-maker and influencer seniority bands before treating role targeting as viable."
    },
    {
      label: "Named accounts or account list",
      keys: ["companyNames", "accountLists"],
      action: "Add named target accounts or an account-list source if ABM precision matters."
    },
    {
      label: "First-party audiences",
      keys: ["customerLists", "contactLists", "websiteVisitors", "retargetingAudiences", "engagementAudiences"],
      action: "Add customer, contact, visitor, retargeting, or engagement audiences if this should not be a cold-targeting test."
    },
    {
      label: "Lookalike / similar seeds",
      keys: ["lookalikeSeeds"],
      action: "Add seed audiences only if the goal includes modeled expansion beyond known accounts."
    },
    {
      label: "Contextual inventory",
      keys: ["placements", "communities"],
      action: "Add publications, communities, channels, or placements if contextual/programmatic testing is in scope."
    },
    {
      label: "Preferred paid channels",
      keys: ["preferredChannels"],
      action: "State which paid channels are in scope so the report can distinguish a requested test from a broad feasibility scan."
    },
    {
      label: "Budget",
      keys: ["budget"],
      action: "Define the test budget or budget range before demand gen recommends campaign structure or channel sequencing."
    },
    {
      label: "Conversion event",
      keys: ["conversionEvent"],
      action: "Define the primary success event: lead, meeting, opportunity, pipeline, expansion, or qualified engagement."
    },
    {
      label: "Measurement thresholds",
      keys: ["measurementThresholds"],
      action: "Define the minimum volume, quality, efficiency, or pipeline threshold that will make the test decision-ready."
    },
    {
      label: "Exclusions and suppression",
      keys: ["exclusions", "negativeKeywords", "suppressionLists"],
      action: "Define exclusions, negative keywords, and suppression rules before campaign build."
    },
    {
      label: "Audience-sizing requirements",
      keys: ["audienceSizingRequirements"],
      action: "Define the minimum reachable audience, account coverage, or frequency requirement needed before a channel can be considered viable."
    }
  ];

  const missing = checks.filter((check) => (check.isMissing ? check.isMissing() : countSupplied(rawInputs, check.keys) === 0));
  const lines = ["## Missing Inputs That Change The Plan", ""];
  if (missing.length === 0) {
    lines.push("- No major activation-input gaps detected from the current brief.");
  } else {
    for (const item of missing) {
      lines.push(`- **${item.label}**: ${item.action}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function sectionForChannelHypotheses(output) {
  const lines = ["## Channel Hypotheses", "", summarizeBestFit(output), ""];

  for (const group of output.channelGroups ?? []) {
    lines.push(`### ${group.label}`);
    lines.push("");
    lines.push(formatGroupPlatforms(group));
    lines.push("");
  }

  lines.push("Use these groups as hypotheses for sizing and SME review, not as a final media plan.");
  lines.push("");
  return lines.join("\n");
}

function sectionForInputReadiness(output) {
  const rawInputs = output.rawInputs ?? {};
  const readinessGroups = [
    {
      title: "Core audience definition",
      keys: ["industries", "companySizes", "companyNames", "jobTitles", "jobFunctions", "seniorities", "skills"],
      missingPrompt: "Add ICP, firmographic, account, and persona fields before treating channel recommendations as campaign-ready."
    },
    {
      title: "Intent and message strategy",
      keys: ["keywords", "intentSignals", "technographics", "pains", "gains", "objections", "triggers"],
      missingPrompt: "Add category, intent, pain, gain, objection, and trigger inputs before building search, custom segment, or creative tests."
    },
    {
      title: "Activation audiences",
      keys: ["accountLists", "customerLists", "contactLists", "websiteVisitors", "retargetingAudiences", "engagementAudiences", "lookalikeSeeds"],
      missingPrompt: "Ask demand gen whether first-party, retargeting, engagement, or lookalike seed audiences already exist."
    },
    {
      title: "Context and inventory",
      keys: ["communities", "placements", "topics", "devices"],
      missingPrompt: "Add communities, placements, topics, or device assumptions if contextual or programmatic channels are under consideration."
    },
    {
      title: "Controls and exclusions",
      keys: ["exclusions", "negativeKeywords", "suppressionLists", "complianceConstraints"],
      missingPrompt: "Define exclusions, suppression, negative keywords, and compliance constraints before campaign build."
    }
  ];

  const lines = ["## Input Readiness", ""];
  for (const group of readinessGroups) {
    const suppliedCount = countSupplied(rawInputs, group.keys);
    const status = suppliedCount >= 3 ? "strong" : suppliedCount > 0 ? "partial" : "missing";
    lines.push(`- **${group.title}**: ${status}. ${suppliedCount > 0 ? `${suppliedCount} input(s) supplied.` : group.missingPrompt}`);
  }
  lines.push("");
  lines.push("Readiness note: use this section to decide what the PMM can bring to demand gen now versus what must be gathered before final campaign planning.");
  lines.push("");
  return lines.join("\n");
}

function sectionForSmeValidationChecklist(output) {
  const bestFitNames = output.channelGroups?.find((group) => group.group === "best-fit")?.platforms.map((platform) => platform.platformName) ?? [];
  const strongSecondaryNames = output.channelGroups?.find((group) => group.group === "strong-secondary")?.platforms.map((platform) => platform.platformName) ?? [];
  const rawInputs = output.rawInputs ?? {};
  const hasActivationAudience = countSupplied(rawInputs, ["accountLists", "customerLists", "contactLists", "websiteVisitors", "retargetingAudiences", "engagementAudiences", "lookalikeSeeds"]) > 0;
  const hasExclusions = countSupplied(rawInputs, ["exclusions", "negativeKeywords", "suppressionLists", "complianceConstraints"]) > 0;

  const lines = [
    "## SME Validation Checklist",
    "",
    `- Can demand gen size the candidate best-fit audience in ${formatNames(bestFitNames, "the highest-evidence channel group")} after applying account, role, seniority, function, and skill filters?`,
    `- Should ${formatNames(strongSecondaryNames, "the strong secondary channels")} be used for demand capture, contextual reach, retargeting, or message testing?`,
    "- Which keyword clusters should become separate search/custom-segment groups versus creative or landing-page themes?",
    hasActivationAudience
      ? "- Are the supplied first-party, retargeting, engagement, or lookalike audiences usable for this campaign objective and geography?"
      : "- Do usable first-party, retargeting, engagement, or lookalike audiences exist, or is this plan mostly cold targeting?",
    hasExclusions
      ? "- Are the supplied exclusions and suppression rules enough to avoid poor-fit traffic and wasted spend?"
      : "- What exclusions are required, such as current customers, open opportunities, competitors, job seekers, students, SMBs, or irrelevant search intent?",
    "- Which dynamic fields need in-platform verification before PMM treats them as real targeting options?",
    "- What measurement event will determine whether this audience strategy is working: lead, meeting, opportunity, pipeline, expansion, or engagement?"
  ];

  lines.push("");
  return lines.join("\n");
}

function uniqueValues(values) {
  return [...new Set((values ?? []).filter(Boolean))];
}

function clusterKeywordInputs(rawInputs = {}) {
  const clusters = [
    {
      name: "Keyword Signals",
      keys: ["keywords"],
      use: "Use as candidate search, custom-segment, or contextual test inputs after platform-side verification."
    },
    {
      name: "Intent Signals",
      keys: ["intentSignals"],
      use: "Use to structure demand-capture and initiative-led test hypotheses, not as proof of buyer reach."
    },
    {
      name: "Technographic Signals",
      keys: ["technographics"],
      use: "Use only where a platform exposes a verified technographic or compatible contextual test surface."
    },
    {
      name: "Message / Creative Inputs",
      keys: ["pains", "gains", "objections", "triggers"],
      use: "Use in creative, landing pages, sales follow-up, and experiment messaging; do not use as targeting proxies."
    }
  ];

  return clusters
    .map((cluster) => ({
      ...cluster,
      values: uniqueValues(cluster.keys.flatMap((key) => rawInputs[key] ?? []))
    }))
    .filter((cluster) => cluster.values.length > 0);
}

function sectionForAudienceInputs(output) {
  const rawInputs = output.rawInputs ?? {};
  const sections = [
    {
      title: "First-Party / Matched Audiences",
      keys: ["accountLists", "customerLists", "contactLists"],
      why: "Often the strongest activation layer when the campaign has named accounts, customers, contacts, or CRM segments."
    },
    {
      title: "Retargeting / Engagement Audiences",
      keys: ["websiteVisitors", "retargetingAudiences", "engagementAudiences"],
      why: "Useful for sequencing, nurture, and high-intent follow-up based on prior interaction with the brand."
    },
    {
      title: "Lookalike / Similar Seeds",
      keys: ["lookalikeSeeds"],
      why: "Useful for expansion when there is a high-quality seed audience, but it should be treated as modeled reach rather than exact persona targeting."
    },
    {
      title: "Contextual / Inventory Inputs",
      keys: ["placements", "topics", "communities"],
      why: "Useful when the buying committee is hard to target directly but gathers around specific publications, communities, topics, channels, or content."
    },
    {
      title: "Device / Environment Inputs",
      keys: ["devices"],
      why: "Useful when the campaign experience, product use case, or platform behavior differs by device or environment."
    },
    {
      title: "Demographic / Education / Life-Event Inputs",
      keys: ["demographics", "education", "lifeEvents"],
      why: "Common in broad ad platforms, but usually secondary for B2B PMM and sensitive to policy, campaign type, and market."
    },
    {
      title: "Exclusions / Suppression",
      keys: ["exclusions", "negativeKeywords", "suppressionLists"],
      why: "Important for avoiding wasted spend, current customers, poor-fit segments, competitor ambiguity, or irrelevant search demand."
    }
  ];

  const lines = ["## Additional Audience Inputs To Consider", ""];
  for (const section of sections) {
    const supplied = section.keys.flatMap((key) => rawInputs[key] ?? []);
    lines.push(`### ${section.title}`);
    lines.push("");
    lines.push(section.why);
    lines.push("");
    lines.push(`Current brief status: ${supplied.length > 0 ? `supplied (${truncateList(supplied, 6)})` : "not supplied"}.`);
    lines.push("");
  }
  return lines.join("\n");
}

function sectionForKeywordClusters(output) {
  const clusters = clusterKeywordInputs(output.rawInputs);
  const lines = ["## Keyword Cluster Guidance", ""];

  lines.push("These source-aware groups preserve the brief's original inputs without guessing a product category from its vocabulary. Keyword, intent, and technographic inputs may structure verified search, custom-segment, or contextual tests. Pains, gains, objections, and triggers are message inputs only and never targeting proxies. Do not treat a group as proof of reach; use it to structure tests and keep the full raw list in the appendix.");
  lines.push("");

  if (clusters.length === 0) {
    lines.push("No keyword clusters were detected from the supplied brief.");
    lines.push("");
    return lines.join("\n");
  }

  for (const cluster of clusters) {
    lines.push(`### ${cluster.name}`);
    lines.push("");
    lines.push(`Most useful examples: ${truncateList(cluster.values, 6)}.`);
    lines.push(`Recommended use: ${cluster.use}`);
    lines.push("");
  }

  return lines.join("\n");
}

function sectionForAppendix(rawInputs = {}) {
  const appendixKeys = [
    ["Geographies", rawInputs.geographies],
    ["Industries", rawInputs.industries],
    ["Company Sizes", rawInputs.companySizes],
    ["Company Names", rawInputs.companyNames],
    ["Account Lists", rawInputs.accountLists],
    ["Customer Lists", rawInputs.customerLists],
    ["Contact Lists", rawInputs.contactLists],
    ["Website Visitors", rawInputs.websiteVisitors],
    ["Retargeting Audiences", rawInputs.retargetingAudiences],
    ["Engagement Audiences", rawInputs.engagementAudiences],
    ["Lookalike Seeds", rawInputs.lookalikeSeeds],
    ["Job Titles", rawInputs.jobTitles],
    ["Job Functions", rawInputs.jobFunctions],
    ["Seniorities", rawInputs.seniorities],
    ["Skills", rawInputs.skills],
    ["Interests", rawInputs.interests],
    ["Keywords", rawInputs.keywords],
    ["Communities", rawInputs.communities],
    ["Placements", rawInputs.placements],
    ["Topics", rawInputs.topics],
    ["Devices", rawInputs.devices],
    ["Demographics", rawInputs.demographics],
    ["Education", rawInputs.education],
    ["Life Events", rawInputs.lifeEvents],
    ["Technographics", rawInputs.technographics],
    ["Intent Signals", rawInputs.intentSignals],
    ["Pains", rawInputs.pains],
    ["Gains", rawInputs.gains],
    ["Objections", rawInputs.objections],
    ["Triggers", rawInputs.triggers],
    ["Exclusions", rawInputs.exclusions],
    ["Negative Keywords", rawInputs.negativeKeywords],
    ["Suppression Lists", rawInputs.suppressionLists],
    ["Budget", rawInputs.budget],
    ["Conversion Event", rawInputs.conversionEvent],
    ["Measurement Thresholds", rawInputs.measurementThresholds],
    ["Audience-Sizing Requirements", rawInputs.audienceSizingRequirements],
    ["Preferred Channels", rawInputs.preferredChannels],
    ["Compliance Constraints", rawInputs.complianceConstraints]
  ];

  const lines = ["## Appendix: Raw Inputs And Platform Detail", "", "### Raw Inputs", ""];
  for (const [label, values] of appendixKeys) {
    if (!values || values.length === 0) continue;
    lines.push(`- **${label}**: ${formatList(values)}`);
  }
  lines.push("");
  lines.push("### Platform Detail");
  lines.push("");
  return lines.join("\n");
}

export function renderMarkdownReport(output) {
  const lines = [
    "# Channel Targeting Feasibility Report",
    "",
    `Generated: ${output.generatedAt}`,
    "",
    "## Input Summary",
    "",
    `- Product: ${output.inputSummary.product ?? "unspecified"}`,
    `- Market: ${output.inputSummary.market ?? "unspecified"}`,
    `- Locale: ${output.inputSummary.locale ?? "unspecified"}`,
    `- Campaign goal: ${output.inputSummary.campaignGoal ?? "unspecified"}`,
    "",
    sectionForActivationActions(output),
    sectionForTargetingMap(output),
    sectionForMissingInputs(output),
    sectionForChannelHypotheses(output),
    sectionForKeywordClusters(output),
    sectionForAppendix(output.rawInputs)
  ];

  for (const match of output.platformMatches) {
    lines.push(`## ${match.platformName}`);
    lines.push("");
    lines.push(recommendationLine(match));
    lines.push("");
    lines.push(`Channel type: ${match.channelType}`);
    lines.push(`Source: ${match.source.url}`);
    lines.push(`Source checked: ${match.source.checkedAt}`);
    lines.push(`Refresh cadence: ${match.source.refreshCadence}`);
    lines.push("");
    lines.push(sectionForMatches("Exact Matches", match.exactMatches));
    lines.push(sectionForMatches("Platform Substitutes", match.substituteMatches));
    lines.push(sectionForSubstitutions(match.substitutions));
    lines.push(sectionForUnavailable(match.unavailable));
    lines.push("### Caveats");
    lines.push("");
    if (match.caveats.length === 0) {
      lines.push("None");
    } else {
      for (const caveat of match.caveats) lines.push(`- ${caveat}`);
    }
    lines.push("");
  }

  lines.push("## Cross-Platform Gaps");
  lines.push("");
  if (output.unavailableStrategyDimensions.length === 0) {
    lines.push("No recurring unavailable strategy dimensions were detected.");
  } else {
    for (const dimension of output.unavailableStrategyDimensions) {
      lines.push(`- ${dimension}`);
    }
  }
  lines.push("");
  lines.push("## Human Review Required");
  lines.push("");
  lines.push("- Verify exact picklists in authenticated platform accounts before campaign build.");
  lines.push("- Do not upload customer or account lists from this tool.");
  lines.push("- Treat pains, gains, objections, and triggers as message strategy unless a platform exposes a confirmed targeting field.");

  return `${lines.join("\n")}\n`;
}
