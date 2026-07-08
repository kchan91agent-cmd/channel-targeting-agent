import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { parseMarkdownBrief } from "../src/brief/parse-markdown.js";
import { loadPlatforms } from "../src/platforms.js";
import { matchStrategyToPlatforms } from "../src/matcher/match.js";
import { renderMarkdownReport } from "../src/report/render-markdown.js";
import { REQUIRED_SECTION_HEADINGS } from "../src/report/output-contract.js";
import { validateStandardOutput } from "../src/report/validate-standard-output.js";

const FIXTURE_ROOT = new URL("./fixtures/output-standardization/", import.meta.url);

async function sourceFixture(group, name) {
  return readFile(new URL(group + "/" + name + ".md", FIXTURE_ROOT), "utf8");
}

async function renderedFixture(platforms, group, name) {
  const strategy = parseMarkdownBrief(await sourceFixture(group, name));
  return {
    strategy,
    report: renderMarkdownReport(matchStrategyToPlatforms(strategy, platforms))
  };
}

function reportHeadings(report) {
  return report.match(/^## [^\n]+$/gm) ?? [];
}

test("keeps the output identical when the same targeting strategy arrives as different document architectures", async () => {
  const platforms = await loadPlatforms();
  const fixtures = await Promise.all(
    ["messaging-brief", "gtm-plan", "campaign-plan", "executive-memo"].map((name) =>
      renderedFixture(platforms, "format-invariance", name)
    )
  );

  const baseline = fixtures[0];
  for (const fixture of fixtures) {
    assert.deepEqual(fixture.strategy, baseline.strategy);
    assert.equal(fixture.report, baseline.report);
    assert.deepEqual(validateStandardOutput(fixture.report, platforms), { valid: true, errors: [] });
  }
});

test("keeps the required framework fixed while targeting strategy variables change", async () => {
  const platforms = await loadPlatforms();
  const fixtures = await Promise.all(
    ["abm", "search-intent", "first-party", "persona-incomplete", "sparse"].map(async (name) => ({
      name,
      ...(await renderedFixture(platforms, "targeting-variance", name))
    }))
  );

  for (const fixture of fixtures) {
    assert.deepEqual(reportHeadings(fixture.report), REQUIRED_SECTION_HEADINGS);
    assert.deepEqual(validateStandardOutput(fixture.report, platforms), { valid: true, errors: [] });
  }

  assert.ok(fixtures.find((fixture) => fixture.name === "abm").report.includes("Acme Software"));
  assert.ok(fixtures.find((fixture) => fixture.name === "search-intent").report.includes("cloud spend allocation"));
  assert.ok(fixtures.find((fixture) => fixture.name === "first-party").report.includes("At-risk renewal accounts"));
  assert.ok(fixtures.find((fixture) => fixture.name === "persona-incomplete").report.includes("**Activation readiness:** Partially ready"));
  assert.ok(fixtures.find((fixture) => fixture.name === "sparse").report.includes("**Activation readiness:** Not ready"));
  assert.ok(fixtures.find((fixture) => fixture.name === "first-party").report.includes("First-party/account targeting is the biggest activation unlock."));
  assert.ok(fixtures.find((fixture) => fixture.name === "search-intent").report.includes("### Keyword Cluster Guidance"));
  assert.ok(fixtures.find((fixture) => fixture.name === "search-intent").report.includes("### Platform Field Inventory"));
  assert.equal(new Set(fixtures.map((fixture) => fixture.report)).size, fixtures.length);
});

test("keeps the executive brief concise while long-tail evidence moves to the appendix", async () => {
  const platforms = await loadPlatforms();
  const { report } = await renderedFixture(platforms, "targeting-variance", "search-intent");
  const executiveBrief = report.slice(report.indexOf("## Executive Brief"), report.indexOf("## Appendix: Targeting Evidence and Platform Detail"));
  const appendix = report.slice(report.indexOf("## Appendix: Targeting Evidence and Platform Detail"));

  assert.ok(executiveBrief.includes("### Top Opportunities"));
  assert.equal(executiveBrief.includes("### Platform Field Inventory"), false);
  assert.equal(executiveBrief.includes("| LinkedIn Ads | Geography |"), false);
  assert.ok(appendix.includes("| LinkedIn Ads | Geography |"));
  assert.ok(appendix.includes("| Pains, gains, objections, and triggers |"));
  assert.ok(appendix.includes("Creative, landing page, or sales follow-up only"));
});

test("rejects a report when the fixed framework is changed", async () => {
  const platforms = await loadPlatforms();
  const { report } = await renderedFixture(platforms, "format-invariance", "messaging-brief");
  const altered = report.replace("### Missing Inputs That Would Improve Targeting", "### Activation Gaps");
  const result = validateStandardOutput(altered, platforms);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("Executive Brief subsections")));
  assert.ok(result.errors.some((error) => error.includes("Missing Inputs That Would Improve Targeting")));
});
