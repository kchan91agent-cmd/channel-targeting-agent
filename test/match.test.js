import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { loadPlatforms } from "../src/platforms.js";
import { matchStrategyToPlatforms } from "../src/matcher/match.js";

test("maps logistics strategy to high-fit B2B platforms", async () => {
  const platforms = await loadPlatforms();
  const output = matchStrategyToPlatforms(
    {
      product: "Route orchestration software",
      market: "Enterprise logistics",
      locale: "US",
      geographies: ["United States", "Canada"],
      industries: ["Retail", "Third-party logistics"],
      jobTitles: ["VP Logistics"],
      jobFunctions: ["Operations", "Supply Chain"],
      seniorities: ["VP"],
      pains: ["manual dispatch exceptions"],
      triggers: ["SLA pressure"],
      preferredChannels: ["linkedin-ads", "microsoft-ads", "google-ads-youtube", "dv360"]
    },
    platforms
  );

  const recommendedIds = output.platformMatches.filter((match) => match.recommended).map((match) => match.platformId);
  assert.ok(recommendedIds.includes("linkedin-ads"));
  assert.ok(recommendedIds.includes("microsoft-ads"));
  assert.ok(recommendedIds.includes("google-ads-youtube"));
  assert.ok(recommendedIds.includes("dv360"));
});

test("does not pretend pains are exact targeting fields", async () => {
  const platforms = await loadPlatforms();
  const output = matchStrategyToPlatforms(
    {
      product: "Fleet maintenance software",
      market: "Commercial fleets",
      locale: "US",
      pains: ["maintenance downtime"],
      preferredChannels: ["linkedin-ads"]
    },
    platforms
  );

  const linkedIn = output.platformMatches.find((match) => match.platformId === "linkedin-ads");
  assert.equal(linkedIn.exactMatches.some((match) => match.inputKeys.includes("pains")), false);
  assert.ok(
    linkedIn.unavailable.some((item) => item.input === "pains"),
    "LinkedIn should flag pains as unavailable unless a real targeting proxy exists"
  );
});

test("does not treat pains or triggers as keyword targeting levers", async () => {
  const platforms = await loadPlatforms();
  const output = matchStrategyToPlatforms(
    {
      product: "Digital maturity benchmark",
      market: "Health systems",
      pains: ["analysis paralysis", "limited ROI measurement"],
      triggers: ["EMR modernization planning"],
      preferredChannels: ["google-ads-youtube", "microsoft-ads", "dv360"]
    },
    platforms
  );

  for (const platformId of ["google-ads-youtube", "microsoft-ads", "dv360"]) {
    const match = output.platformMatches.find((platform) => platform.platformId === platformId);
    const substituteInputs = match.substituteMatches.flatMap((substitute) => substitute.inputKeys);
    const suggestedInputs = match.substitutions.map((substitution) => substitution.input);

    assert.equal(substituteInputs.includes("pains"), false);
    assert.equal(substituteInputs.includes("triggers"), false);
    assert.equal(suggestedInputs.includes("pains"), false);
    assert.equal(suggestedInputs.includes("triggers"), false);
    assert.ok(match.unavailable.some((item) => item.input === "pains"));
    assert.ok(match.unavailable.some((item) => item.input === "triggers"));
  }
});

test("keeps all message-only inputs out of proxy scores and proxy recommendations", async () => {
  const platforms = await loadPlatforms();
  const output = matchStrategyToPlatforms(
    {
      product: "Creator analytics software",
      market: "TikTok commerce teams",
      pains: ["unclear creator ROI"],
      gains: ["faster content decisions"],
      objections: ["hard to prove attribution"],
      triggers: ["new product launch"]
    },
    platforms
  );

  for (const match of output.platformMatches) {
    assert.equal(match.exactActionabilityScore, 0);
    assert.equal(match.proxyActionabilityScore, 0);
    assert.equal(match.actionabilityScore, 0);
    assert.equal(match.substituteMatches.length, 0);
    assert.equal(match.substitutions.length, 0);
  }
});

test("allows a message input only through an explicitly verified exact platform field", () => {
  const output = matchStrategyToPlatforms(
    {
      product: "Test product",
      market: "Test market",
      pains: ["manual reconciliation"]
    },
    [
      {
        id: "verified-platform",
        name: "Verified Platform",
        channelType: "social",
        supportedLocales: ["GLOBAL"],
        knownLimitations: [],
        sourceUrl: "https://example.com",
        sourceCheckedAt: "2026-06-21",
        refreshCadence: "manual",
        targetingDimensions: [
          {
            id: "verifiedPainField",
            label: "Verified pain field",
            inputKeys: ["pains"],
            availability: "official-auth",
            matchType: "exact",
            confidence: "high",
            verifiedMessageTargeting: true
          }
        ]
      }
    ]
  );

  const match = output.platformMatches[0];
  assert.equal(match.exactMatches.length, 1);
  assert.equal(match.exactActionabilityScore, 0);
  assert.equal(match.proxyActionabilityScore, 0);
});

test("keeps vendor-gated ABM platforms out of the v1 registry", async () => {
  const platforms = await loadPlatforms();
  const ids = platforms.map((platform) => platform.id);
  assert.equal(ids.includes("demandbase"), false);
  assert.equal(ids.includes("6sense"), false);
});

test("keeps Amazon DSP out of the v1 registry", async () => {
  const platforms = await loadPlatforms();
  assert.equal(platforms.some((platform) => platform.id.includes("amazon")), false);
});

test("ranks exact B2B targeting above keyword-heavy proxies for D2iQ-style campaigns", async () => {
  const platforms = await loadPlatforms();
  const d2iq = JSON.parse(await readFile(new URL("../examples/d2iq-smart-apps-day2.json", import.meta.url), "utf8"));
  const output = matchStrategyToPlatforms(d2iq, platforms);

  const bestFitIds = output.channelGroups.find((group) => group.group === "best-fit").platforms.map((platform) => platform.platformId);
  const linkedInIndex = output.platformMatches.findIndex((match) => match.platformId === "linkedin-ads");
  const googleIndex = output.platformMatches.findIndex((match) => match.platformId === "google-ads-youtube");

  assert.ok(bestFitIds.includes("linkedin-ads"));
  assert.ok(linkedInIndex < googleIndex, "LinkedIn should rank above Google / YouTube when exact B2B targeting is materially stronger");
});
