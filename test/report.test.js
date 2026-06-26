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
  assert.ok(strategy.jobTitles.includes("VP Logistics"));
});

test("parses expanded audience inputs from Markdown briefs", () => {
  const strategy = parseMarkdownBrief("Product: Test product\nAccount lists: Tier 1 accounts\nGains: faster planning\nSuppression lists: open opportunities");
  assert.deepEqual(strategy.accountLists, ["Tier 1 accounts"]);
  assert.deepEqual(strategy.gains, ["faster planning"]);
  assert.deepEqual(strategy.suppressionLists, ["open opportunities"]);
});

test("renders the required executive brief, appendix, and all-platform field inventory", async () => {
  const platforms = await loadPlatforms();
  const markdown = await readFile(new URL("../examples/fleet-management.md", import.meta.url), "utf8");
  const report = renderMarkdownReport(matchStrategyToPlatforms(parseMarkdownBrief(markdown), platforms));

  for (const heading of [
    "## Executive Brief",
    "### Top Opportunities",
    "### Channel Readout",
    "### Best Campaign Concepts",
    "### Missing Inputs That Would Improve Targeting",
    "### Important Caveat",
    "## Appendix: Targeting Evidence and Platform Detail",
    "### Source Inputs",
    "### Keyword Cluster Guidance",
    "### Concrete Keyword and Audience Map",
    "### Platform Field Inventory",
    "### Platform Detail",
    "### Cross-Platform Gaps",
    "### Manual Verification Required"
  ]) assert.ok(report.includes(heading));

  assert.ok(report.includes("| LinkedIn Ads | Geography |"));
  assert.ok(report.includes("| LinkedIn Ads | Lookalike / similar-audience seeds |"));
  assert.ok(report.includes("| LinkedIn Ads | Job title | Direct targeting field |"));
  assert.ok(report.includes("| Google Ads / YouTube | Job title | Not targetable |"));
  assert.ok(report.includes("Input missing — provide an eligible seed audience."));
  assert.ok(report.includes("Registry-backed only — not account-confirmed."));
  assert.ok(report.indexOf("## Executive Brief") < report.indexOf("## Appendix: Targeting Evidence and Platform Detail"));
  assert.ok(report.indexOf("### Platform Field Inventory") < report.indexOf("### Platform Detail"));
});

test("keeps pains, gains, objections, and triggers out of targeting keywords", async () => {
  const platforms = await loadPlatforms();
  const strategy = parseMarkdownBrief("Product: Creator commerce analytics\nMarket: TikTok commerce teams\nKeywords: TikTok Shop analytics\nPains: unclear creator ROI\nGains: faster creative iteration\nTriggers: seasonal product drop");
  const report = renderMarkdownReport(matchStrategyToPlatforms(strategy, platforms));
  const targetingMap = report.slice(report.indexOf("### Concrete Keyword and Audience Map"), report.indexOf("### Platform Field Inventory"));

  assert.ok(report.includes("| Pains, gains, objections, and triggers |"));
  assert.ok(report.includes("Creative, landing page, or sales follow-up only"));
  assert.ok(targetingMap.includes("Keep in Messaging"));
  assert.equal(targetingMap.slice(targetingMap.indexOf("Use as Proxies"), targetingMap.indexOf("Keep in Messaging")).includes("unclear creator ROI"), false);
});

test("field checks fall back to registry fields when credentials are missing", async () => {
  const platforms = await loadPlatforms();
  const googleAds = platforms.find((platform) => platform.id === "google-ads-youtube");
  const result = checkPlatformFields(googleAds, { env: {} });
  assert.ok(result.fields.length > 0);
  assert.ok(result.errors.some((error) => error.code === "MISSING_AUTH" && error.recoverable));
});
