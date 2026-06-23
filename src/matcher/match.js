const EXACT_ACTIONABILITY_WEIGHTS = {
  companyNames: 3,
  jobTitles: 3,
  accountLists: 3,
  customerLists: 3,
  contactLists: 3,
  websiteVisitors: 2.5,
  retargetingAudiences: 2.5,
  engagementAudiences: 2,
  companySizes: 2,
  industries: 2,
  jobFunctions: 2,
  seniorities: 2,
  skills: 2,
  technographics: 2,
  intentSignals: 2,
  keywords: 1,
  interests: 1,
  communities: 1,
  placements: 1,
  topics: 1,
  devices: 1,
  demographics: 0.75,
  education: 0.75,
  lifeEvents: 0.75,
  exclusions: 0.5,
  negativeKeywords: 0.5,
  suppressionLists: 0.5,
  locale: 0.5,
  geographies: 0.5
};

const PROXY_ACTIONABILITY_WEIGHTS = {
  keywords: 1.5,
  technographics: 1.25,
  intentSignals: 1.25,
  communities: 1,
  placements: 1,
  topics: 1,
  lookalikeSeeds: 1,
  interests: 1,
  industries: 0.75,
  demographics: 0.5,
  education: 0.5,
  lifeEvents: 0.5,
  jobTitles: 0.4,
  companyNames: 0.4
};

const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 };
const MESSAGE_ONLY_INPUTS = new Set(["pains", "gains", "objections", "triggers"]);

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function hasInput(strategy, key) {
  return asArray(strategy[key]).length > 0 || (typeof strategy[key] === "string" && strategy[key].trim().length > 0);
}

function inputValues(strategy, keys) {
  return keys.flatMap((key) => asArray(strategy[key]).map((value) => String(value)));
}

function canUseInputOnDimension(dimension, inputKey) {
  if (!MESSAGE_ONLY_INPUTS.has(inputKey)) return true;
  return dimension.matchType === "exact" && dimension.verifiedMessageTargeting === true;
}

function localeSupported(platform, strategy) {
  const locale = strategy.locale;
  if (!locale) return true;
  const normalized = locale.toUpperCase();
  return platform.supportedLocales.includes(normalized) || platform.supportedLocales.includes("GLOBAL");
}

function scoreConfidence(matchCount, substituteCount, caveatCount, preferred) {
  let score = matchCount * 2 + substituteCount - caveatCount;
  if (preferred) score += 2;
  if (score >= 8) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function weightedInputScore(matches, weights) {
  const inputKeys = new Set(matches.flatMap((match) => match.inputKeys));
  return [...inputKeys].reduce((score, inputKey) => score + (MESSAGE_ONLY_INPUTS.has(inputKey) ? 0 : weights[inputKey] ?? 0), 0);
}

function weightedSubstitutionScore(substitutions) {
  return substitutions.reduce(
    (score, substitution) => score + (MESSAGE_ONLY_INPUTS.has(substitution.input) ? 0 : PROXY_ACTIONABILITY_WEIGHTS[substitution.input] ?? 0.5),
    0
  );
}

function classifyChannelGroup({ platform, exactActionabilityScore, proxyActionabilityScore, exactMatches, substituteMatches, substitutions }) {
  const meaningfulExactMatches = exactMatches.filter((match) => !match.inputKeys.every((key) => key === "locale" || key === "geographies"));
  const proxyCount = substituteMatches.length + substitutions.length;
  const proxyCanSupportDemandCapture = ["search-video-display", "programmatic"].includes(platform.channelType);

  if (exactActionabilityScore >= 7 || meaningfulExactMatches.length >= 4) return "best-fit";
  if (exactActionabilityScore >= 3.5 || (meaningfulExactMatches.length >= 2 && proxyActionabilityScore >= 2)) return "strong-secondary";
  if (proxyCanSupportDemandCapture && proxyActionabilityScore >= 5) return "strong-secondary";
  if (proxyActionabilityScore >= 2 || proxyCount >= 2) return "experimental";
  return "low-fit";
}

function channelGroupLabel(group) {
  const labels = {
    "best-fit": "Best Fit Channels",
    "strong-secondary": "Strong Secondary Channels",
    experimental: "Experimental / Situational Channels",
    "low-fit": "Low-Fit Channels"
  };
  return labels[group] ?? "Low-Fit Channels";
}

function scoreBand(score, type) {
  if (type === "direct") {
    if (score >= 10) return "very-strong";
    if (score >= 7) return "strong";
    if (score >= 3.5) return "moderate";
    if (score > 0) return "light";
    return "none";
  }

  if (score >= 7) return "very-strong";
  if (score >= 5) return "strong";
  if (score >= 2.5) return "moderate";
  if (score > 0) return "light";
  return "none";
}

function scoreBandLabel(band) {
  const labels = {
    "very-strong": "Very strong",
    strong: "Strong",
    moderate: "Moderate",
    light: "Light",
    none: "None"
  };
  return labels[band] ?? "None";
}

function platformPreferred(strategy, platformId) {
  const preferred = asArray(strategy.preferredChannels).map((value) => String(value).toLowerCase());
  return preferred.length === 0 || preferred.includes(platformId.toLowerCase());
}

function buildSubstitutions(platform, strategy, directMatches) {
  const matchedIds = new Set(directMatches.map((match) => match.dimensionId));
  const dimensions = platform.targetingDimensions;
  const hasDimension = (id) => dimensions.some((dimension) => dimension.id === id);
  const substitutions = [];

  if (hasInput(strategy, "jobTitles") && !matchedIds.has("jobTitle")) {
    const available = [];
    if (hasDimension("jobFunction")) available.push("job function");
    if (hasDimension("seniority")) available.push("seniority");
    if (hasDimension("keyword")) available.push("keywords");
    if (hasDimension("persona")) available.push("persona segment");
    if (available.length > 0) {
      substitutions.push({
        input: "jobTitles",
        requestedValues: asArray(strategy.jobTitles),
        recommendation: `Approximate title targeting with ${available.join(" + ")}.`,
        confidence: available.includes("job function") ? "medium" : "low"
      });
    }
  }

  if (hasInput(strategy, "industries") && !matchedIds.has("industry")) {
    const available = [];
    if (hasDimension("interest")) available.push("interests");
    if (hasDimension("keyword")) available.push("keywords");
    if (hasDimension("category")) available.push("content categories");
    if (available.length > 0) {
      substitutions.push({
        input: "industries",
        requestedValues: asArray(strategy.industries),
        recommendation: `Approximate industry targeting with ${available.join(" + ")}.`,
        confidence: "low"
      });
    }
  }

  if (hasInput(strategy, "companyNames") && !matchedIds.has("companyName") && !matchedIds.has("accountList")) {
    const available = [];
    if (hasDimension("customAudience")) available.push("custom audience");
    if (hasDimension("matchedAudience")) available.push("matched audience");
    if (hasDimension("tailoredAudience")) available.push("tailored audience");
    if (available.length > 0) {
      substitutions.push({
        input: "companyNames",
        requestedValues: asArray(strategy.companyNames),
        recommendation: `Use ${available.join(" or ")} if an uploadable account or customer list exists.`,
        confidence: "medium"
      });
    }
  }

  return substitutions;
}

function unavailableDimensions(platform, strategy, directMatches, substitutions) {
  const covered = new Set([
    ...directMatches.flatMap((match) => match.inputKeys),
    ...substitutions.map((substitution) => substitution.input)
  ]);

  return [
    "jobTitles",
    "jobFunctions",
    "seniorities",
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
    "technographics",
    "intentSignals",
    "placements",
    "topics",
    "devices",
    "demographics",
    "education",
    "lifeEvents",
    "pains",
    "gains",
    "objections",
    "triggers",
    "exclusions",
    "negativeKeywords",
    "suppressionLists"
  ]
    .filter((key) => hasInput(strategy, key) && !covered.has(key))
    .map((key) => ({
      input: key,
      requestedValues: asArray(strategy[key]),
      reason: `${platform.name} does not expose a reliable native or substitute field for this input in the current registry.`
    }));
}

export function matchStrategyToPlatforms(strategy, platforms) {
  const platformMatches = platforms.map((platform) => {
    const preferred = platformPreferred(strategy, platform.id);
    const directMatches = platform.targetingDimensions
      .map((dimension) => {
        const inputKeys = dimension.inputKeys.filter((key) => hasInput(strategy, key) && canUseInputOnDimension(dimension, key));
        const values = inputValues(strategy, inputKeys);
        if (values.length === 0) return null;
        return {
          dimensionId: dimension.id,
          label: dimension.label,
          inputKeys,
          requestedValues: values,
          matchType: dimension.matchType,
          availability: dimension.availability,
          confidence: dimension.confidence
        };
      })
      .filter(Boolean);

    const exactMatches = directMatches.filter((match) => match.matchType === "exact");
    const substituteMatches = directMatches.filter((match) => match.matchType === "substitute");
    const substitutions = buildSubstitutions(platform, strategy, directMatches);
    const unavailable = unavailableDimensions(platform, strategy, directMatches, substitutions);
    const caveats = [];

    if (!localeSupported(platform, strategy)) {
      caveats.push(`Locale ${strategy.locale} is not listed as supported in the current registry.`);
    }
    caveats.push(...platform.knownLimitations);
    if (platform.liveCheck?.authRequired) {
      caveats.push(`Manual or authenticated verification needed: ${platform.liveCheck.notes}`);
    }

    const exactActionabilityScore = weightedInputScore(exactMatches, EXACT_ACTIONABILITY_WEIGHTS);
    const proxyActionabilityScore = weightedInputScore(substituteMatches, PROXY_ACTIONABILITY_WEIGHTS) + weightedSubstitutionScore(substitutions);
    const actionabilityScore = exactActionabilityScore * 2 + proxyActionabilityScore;
    const directFitBand = scoreBand(exactActionabilityScore, "direct");
    const proxyFitBand = scoreBand(proxyActionabilityScore, "proxy");
    const channelGroup = classifyChannelGroup({
      platform,
      exactActionabilityScore,
      proxyActionabilityScore,
      exactMatches,
      substituteMatches,
      substitutions
    });

    return {
      platformId: platform.id,
      platformName: platform.name,
      channelType: platform.channelType,
      recommended: preferred && (exactMatches.length > 0 || substituteMatches.length > 0 || substitutions.length > 0),
      confidence: scoreConfidence(exactMatches.length, substituteMatches.length + substitutions.length, caveats.length, preferred),
      channelGroup,
      channelGroupLabel: channelGroupLabel(channelGroup),
      actionabilityScore,
      exactActionabilityScore,
      proxyActionabilityScore,
      directFitBand,
      directFitLabel: scoreBandLabel(directFitBand),
      proxyFitBand,
      proxyFitLabel: scoreBandLabel(proxyFitBand),
      targetingDimensions: platform.targetingDimensions.map((dimension) => ({
        id: dimension.id,
        label: dimension.label,
        inputKeys: dimension.inputKeys,
        matchType: dimension.matchType,
        availability: dimension.availability,
        confidence: dimension.confidence
      })),
      exactMatches,
      substituteMatches,
      substitutions,
      unavailable,
      localeSupported: localeSupported(platform, strategy),
      source: {
        url: platform.sourceUrl,
        checkedAt: platform.sourceCheckedAt,
        refreshCadence: platform.refreshCadence
      },
      caveats
    };
  });

  const unavailableStrategyDimensions = [...new Set(platformMatches.flatMap((match) => match.unavailable.map((item) => item.input)))];
  const groupOrder = ["best-fit", "strong-secondary", "experimental", "low-fit"];

  return {
    generatedAt: new Date().toISOString(),
    inputSummary: {
      product: strategy.product,
      market: strategy.market,
      locale: strategy.locale ?? "unspecified",
      campaignGoal: strategy.campaignGoal ?? "unspecified"
    },
    rawInputs: {
      geographies: asArray(strategy.geographies),
      industries: asArray(strategy.industries),
      companySizes: asArray(strategy.companySizes),
      companyNames: asArray(strategy.companyNames),
      accountLists: asArray(strategy.accountLists),
      customerLists: asArray(strategy.customerLists),
      contactLists: asArray(strategy.contactLists),
      websiteVisitors: asArray(strategy.websiteVisitors),
      retargetingAudiences: asArray(strategy.retargetingAudiences),
      engagementAudiences: asArray(strategy.engagementAudiences),
      lookalikeSeeds: asArray(strategy.lookalikeSeeds),
      jobTitles: asArray(strategy.jobTitles),
      jobFunctions: asArray(strategy.jobFunctions),
      seniorities: asArray(strategy.seniorities),
      skills: asArray(strategy.skills),
      interests: asArray(strategy.interests),
      keywords: asArray(strategy.keywords),
      communities: asArray(strategy.communities),
      placements: asArray(strategy.placements),
      topics: asArray(strategy.topics),
      devices: asArray(strategy.devices),
      demographics: asArray(strategy.demographics),
      education: asArray(strategy.education),
      lifeEvents: asArray(strategy.lifeEvents),
      technographics: asArray(strategy.technographics),
      intentSignals: asArray(strategy.intentSignals),
      pains: asArray(strategy.pains),
      gains: asArray(strategy.gains),
      objections: asArray(strategy.objections),
      triggers: asArray(strategy.triggers),
      exclusions: asArray(strategy.exclusions),
      negativeKeywords: asArray(strategy.negativeKeywords),
      suppressionLists: asArray(strategy.suppressionLists),
      budget: asArray(strategy.budget),
      conversionEvent: asArray(strategy.conversionEvent),
      measurementThresholds: asArray(strategy.measurementThresholds),
      audienceSizingRequirements: asArray(strategy.audienceSizingRequirements),
      preferredChannels: asArray(strategy.preferredChannels),
      complianceConstraints: asArray(strategy.complianceConstraints)
    },
    channelGroups: groupOrder.map((group) => ({
      group,
      label: channelGroupLabel(group),
      platforms: platformMatches
        .filter((match) => match.channelGroup === group)
        .sort((a, b) => {
          if (b.exactActionabilityScore !== a.exactActionabilityScore) return b.exactActionabilityScore - a.exactActionabilityScore;
          if (b.proxyActionabilityScore !== a.proxyActionabilityScore) return b.proxyActionabilityScore - a.proxyActionabilityScore;
          const preferredDelta = Number(b.recommended) - Number(a.recommended);
          if (preferredDelta !== 0) return preferredDelta;
          return CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
        })
    })),
    platformMatches: platformMatches.sort((a, b) => {
      const groupDelta = groupOrder.indexOf(a.channelGroup) - groupOrder.indexOf(b.channelGroup);
      if (groupDelta !== 0) return groupDelta;
      if (b.exactActionabilityScore !== a.exactActionabilityScore) return b.exactActionabilityScore - a.exactActionabilityScore;
      if (b.proxyActionabilityScore !== a.proxyActionabilityScore) return b.proxyActionabilityScore - a.proxyActionabilityScore;
      const preferredDelta = Number(b.recommended) - Number(a.recommended);
      if (preferredDelta !== 0) return preferredDelta;
      return CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
    }),
    unavailableStrategyDimensions
  };
}
