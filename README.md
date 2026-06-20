# Channel Targeting Agent

Status: MVP scaffold
Last reviewed: 2026-06-13

Channel Targeting Agent helps PMMs translate broad ICP, persona, and campaign strategy into targeting options that actually exist inside advertising platforms.

It does not launch campaigns. It produces a reviewable strategy-to-targeting map with confidence, substitutes, unavailable dimensions, locale caveats, and source freshness.

The MVP is agent-first. It is meant to run from Codex, Claude Code, Cursor, or a local terminal, not from a web UI.

This repository is standalone. It does not require parent workspace context, private notes, ad account credentials, or customer data for the default pilot workflow.

## Why This Exists

PMM strategy is often intentionally broad:

- persona
- ICP
- pain
- gain
- buying trigger
- geography
- industry
- job title

Campaign builders are not broad. Platforms expose constrained fields, picklists, APIs, and policy-dependent options. This project helps bridge that gap before teams waste time trying to activate targeting that cannot be built.

## Platforms In V1

- LinkedIn Ads
- Meta Ads: Facebook / Instagram
- Google Ads / YouTube
- Google Display & Video 360
- Microsoft Advertising
- Reddit Ads
- X Ads
- TikTok Ads

Amazon DSP, Demandbase, and 6sense are intentionally excluded from this version.

## Locale Defaults

The default planning lens is B2B software advertising in:

- primary: United States, Canada
- secondary: United Kingdom, European Union priority markets, Australia, India

Use the `locale` and `geographies` input fields to narrow a recommendation.

## Install

```bash
npm install
```

This MVP has no runtime dependencies.

## Run A Match Or Report

```bash
npm run match -- examples/logistics-operations.json
```

Generate a PMM-readable Markdown report:

```bash
npm run report -- examples/logistics-operations.md
```

Write the report to a file:

```bash
npm run report -- examples/logistics-operations.md --out examples/outputs/logistics-operations-report.md
```

## Refresh Source Checks

The refresh command checks official source URLs and writes a source-status snapshot. It does not authenticate into ad accounts or mutate platform data.

```bash
npm run refresh
```

For a non-writing check:

```bash
npm run refresh -- --dry-run
```

The included GitHub Actions workflow runs tests and a source check on the first day of every month, then uploads the generated snapshot as a workflow artifact.

## Third-Party Pilot

For an external PMM, demand generation, or growth team testing this in their own Codex or Claude Code environment, use `docs/third-party-pilot.md`.

The recommended pilot loop is:

1. Clone or copy only this project folder.
2. Run `npm test`.
3. Generate a report from a neutral example.
4. Create a local sanitized campaign brief.
5. Generate a pilot report.
6. Score the report for actionability, targeting accuracy, confidence calibration, missing-input quality, and SME usefulness.

## API Connections

See `docs/api-connections.md` for per-platform setup notes, required environment variables, and recommended connector build order.

Check field availability for a platform. This currently returns registry fallback fields unless credentials and an authenticated connector exist:

```bash
npm run check-fields -- --platform google-ads-youtube
```

## Input Shape

```json
{
  "product": "Route orchestration software",
  "market": "Enterprise logistics",
  "locale": "US",
  "geographies": ["United States", "Canada"],
  "industries": ["Retail", "Logistics", "Third-party logistics"],
  "companySizes": ["1000+"],
  "jobTitles": ["VP Logistics", "Director of Transportation"],
  "jobFunctions": ["Operations", "Supply Chain"],
  "seniorities": ["Director", "VP"],
  "pains": ["manual dispatch exceptions", "high cost-to-serve"],
  "triggers": ["carrier complexity", "SLA pressure"],
  "campaignGoal": "Pipeline creation",
  "preferredChannels": ["linkedin-ads", "microsoft-ads", "google-ads-youtube"]
}
```

## Output Shape

The matcher returns:

- recommended platforms
- exact available targeting fields
- substitutes when exact targeting is unavailable
- dimensions that are not directly targetable
- locale caveats
- manual verification notes
- source timestamps

## Human Review

Human review is required before:

- uploading customer or account lists
- launching paid media
- using sensitive targeting
- making customer-facing claims
- treating registry-backed fields as exact authenticated availability

## Project Layout

```text
AGENTS.md                Instructions for Codex, Claude Code, and other agents
data/platforms/          Platform capability registry
data/snapshots/          Refresh outputs
docs/sources.md          Source and refresh policy
docs/third-party-pilot.md External pilot setup and scorecard
docs/workflow.md         Agent workflow and prompt examples
examples/                Neutral sample PMM briefs and JSON inputs
examples/outputs/        Sample Markdown reports
src/connectors/          Live source-check and future API adapters
src/matcher/             Strategy-to-targeting logic
src/report/              Markdown report rendering
src/schemas/             Input/output schema contracts
test/                    Node test suite
```

## Caveats

Exact picklists change. Some are dynamic, locale-specific, account-specific, or only visible inside authenticated campaign builders. The project favors official docs, API metadata, and explicit caveats over pretending every field is knowable from public pages.
