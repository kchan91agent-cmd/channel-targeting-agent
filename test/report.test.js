import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { parseMarkdownBrief } from "../src/brief/parse-markdown.js";
import { checkPlatformFields } from "../src/connectors/field-check.js";
import { loadPlatforms } from "../src/platforms.js";
import { matchStrategyToPlatforms } from "../src/matcher/match.js";
import { renderMarkdownReport } from "../src/report/render-markdown.js";

test("parses Markdown campaign briefs into strategy input", async () => {
  const markdown = await readFile(new URL("../examples/logistics-operations.md", import.meta.url), "utf8");
  const strategy = parseMarkdownBrief(markdown);

  assert.equal(strategy.product, "Route orchestration software");
  assert.equal(strategy.locale, "US");
  assert.deepEqual(strategy.preferredChannels, ["linkedin-ads", "microsoft-ads", "google-ads-youtube", "dv360"]);
  assert.ok(strategy.jobTitles.includes("VP Logistics"));
});

test("parses expanded audience inputs from Markdown briefs", () => {
  const strategy = parseMarkdownBrief(`
# Campaign Brief

Product: Test product
Market: Test market
Account lists: Tier 1 accounts
Customer lists: Expansion customers
Website visitors: Pricing page visitors
Retargeting audiences: Webinar attendees
Lookalike seeds: Closed-won customers
Placements: supply chain trade publications
Topics: logistics technology
Devices: desktop
Demographics: age 35-54
Education: MBA
Life events: new job
Gains: faster planning
Objections: implementation risk
Exclusions: current customers
Negative keywords: jobs
Suppression lists: open opportunities
`);

  assert.deepEqual(strategy.accountLists, ["Tier 1 accounts"]);
  assert.deepEqual(strategy.customerLists, ["Expansion customers"]);
  assert.deepEqual(strategy.websiteVisitors, ["Pricing page visitors"]);
  assert.deepEqual(strategy.retargetingAudiences, ["Webinar attendees"]);
  assert.deepEqual(strategy.lookalikeSeeds, ["Closed-won customers"]);
  assert.deepEqual(strategy.placements, ["supply chain trade publications"]);
  assert.deepEqual(strategy.topics, ["logistics technology"]);
  assert.deepEqual(strategy.devices, ["desktop"]);
  assert.deepEqual(strategy.demographics, ["age 35-54"]);
  assert.deepEqual(strategy.education, ["MBA"]);
  assert.deepEqual(strategy.lifeEvents, ["new job"]);
  assert.deepEqual(strategy.gains, ["faster planning"]);
  assert.deepEqual(strategy.objections, ["implementation risk"]);
  assert.deepEqual(strategy.exclusions, ["current customers"]);
  assert.deepEqual(strategy.negativeKeywords, ["jobs"]);
  assert.deepEqual(strategy.suppressionLists, ["open opportunities"]);
});

test("ignores placeholder values in Markdown briefs", () => {
  const strategy = parseMarkdownBrief(`
# Campaign Brief

Product: Test product
Market: Test market
Pains: unspecified
Gains: N/A
Triggers: unknown
Keywords: market maturity, unspecified, digital maturity
Locale: not specified
`);

  assert.equal(strategy.locale, undefined);
  assert.equal(strategy.pains, undefined);
  assert.equal(strategy.gains, undefined);
  assert.equal(strategy.triggers, undefined);
  assert.deepEqual(strategy.keywords, ["market maturity", "digital maturity"]);
});

test("renders a Markdown report with exact, substitute, and unavailable sections", async () => {
  const platforms = await loadPlatforms();
  const markdown = await readFile(new URL("../examples/fleet-management.md", import.meta.url), "utf8");
  const strategy = parseMarkdownBrief(markdown);
  const output = matchStrategyToPlatforms(strategy, platforms);
  const report = renderMarkdownReport(output);

  assert.ok(report.includes("# Channel Targeting Feasibility Report"));
  assert.ok(report.includes("## LinkedIn Ads"));
  assert.ok(report.includes("### Exact Matches"));
  assert.ok(report.includes("### Suggested Substitutes"));
  assert.ok(report.includes("### Not Directly Targetable"));
});

test("frames best-fit channels as hypotheses to verify", async () => {
  const platforms = await loadPlatforms();
  const markdown = await readFile(new URL("../examples/fleet-management.md", import.meta.url), "utf8");
  const strategy = parseMarkdownBrief(markdown);
  const output = matchStrategyToPlatforms(strategy, platforms);
  const report = renderMarkdownReport(output);

  assert.ok(report.includes("Treat this as a planning hypothesis to verify"));
  assert.ok(report.includes("Size the candidate audience"));
  assert.equal(report.includes("Use this group for the first demand gen planning conversation"), false);
});

test("renders action-led sections before platform details", async () => {
  const platforms = await loadPlatforms();
  const d2iq = JSON.parse(await readFile(new URL("../examples/d2iq-smart-apps-day2.json", import.meta.url), "utf8"));
  const output = matchStrategyToPlatforms(d2iq, platforms);
  const report = renderMarkdownReport(output);

  assert.ok(report.includes("## Activation Actions"));
  assert.ok(report.includes("## Targeting Map"));
  assert.ok(report.includes("### Use Directly"));
  assert.ok(report.includes("### Use As Proxies Or Test/Experiment Campaign Sets"));
  assert.ok(report.includes("### Keep Primarily In Messaging (Low Confidence in targeting for conversion)"));
  assert.ok(report.includes("## Missing Inputs That Change The Plan"));
  assert.ok(report.includes("## Channel Hypotheses"));
  assert.ok(report.includes("## Keyword Cluster Guidance"));
  assert.ok(report.includes("Use these clusters to decide where each idea belongs in the activation plan."));
  assert.ok(report.includes("## Appendix: Raw Inputs And Platform Detail"));
  assert.ok(report.indexOf("## Activation Actions") < report.indexOf("## LinkedIn Ads"));
});

test("keeps long keyword dumps out of the main platform recommendation body", async () => {
  const platforms = await loadPlatforms();
  const d2iq = JSON.parse(await readFile(new URL("../examples/d2iq-smart-apps-day2.json", import.meta.url), "utf8"));
  const output = matchStrategyToPlatforms(d2iq, platforms);
  const report = renderMarkdownReport(output);
  const googleStart = report.indexOf("## Google Ads / YouTube");
  const nextHeading = report.slice(googleStart + 1).search(/\n## [^\n]+/);
  const googleEnd = nextHeading === -1 ? report.length : googleStart + 1 + nextHeading;
  const googleSection = report.slice(googleStart, googleEnd);

  assert.ok(googleSection.includes("see appendix"));
  assert.equal(googleSection.includes("competitive evaluation against Red Hat OpenShift, Rancher, or VMware, Government, Defense"), false);
});

test("field checks fall back to registry fields when credentials are missing", async () => {
  const platforms = await loadPlatforms();
  const googleAds = platforms.find((platform) => platform.id === "google-ads-youtube");
  const result = checkPlatformFields(googleAds, { env: {} });

  assert.equal(result.platformId, "google-ads-youtube");
  assert.ok(result.fields.length > 0);
  assert.ok(result.errors.some((error) => error.code === "MISSING_AUTH" && error.recoverable));
});
