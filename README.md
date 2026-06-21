# Channel Targeting Agent

Status: working
Last reviewed: 2026-06-21

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

## Start Here: Give An Agent Your Source

You do not need to prepare a campaign brief, know advertising-platform fields, or run terminal commands.

1. Open this project in Codex, Claude Code, Cursor, or another supported agent environment.
2. Attach or link a readable source: a launch deck, messaging document, campaign brief, product page, or pasted notes.
3. Send this request:

```text
Use the Channel Targeting Agent in this project to assess the attached or linked source.
Create any temporary input it needs, run the feasibility report, and return the activation actions, targeting map, missing inputs, channel hypotheses, and manual verification required. Do not create campaigns, upload audiences, or invent targeting fields.
```

The agent extracts only facts supported by your source, creates a temporary internal brief, runs the report, and tells you which information is missing. You should not need to fill in a form unless you want to add detail after the first report.

Supported sources include readable links and attachments, slides, documents, PDFs, product pages, and pasted notes. If the agent cannot read a supplied source, it must ask for accessible text or a downloadable file rather than guess from partial access.

## Runtime Setup (One-Time)

The agent environment needs Node.js 20 or newer. Use the current Node LTS when setting up a new environment; download it from the official [Node.js download page](https://nodejs.org/en/download), reopen the terminal, and confirm:

```bash
node --version
npm --version
```

No `npm install` step is required: this MVP has no runtime dependencies. Before a pilot, an agent should run the applicable preflight check:

```bash
# macOS / Linux
sh scripts/preflight.sh

# PowerShell (does not change your persistent execution policy)
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```

If Node passes preflight but npm is unavailable, this dependency-free project can still run via `node --test` and `node src/report.js ...`.

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
2. Give the agent a readable source and the request from “Start Here.”
3. Let the agent run preflight and create a temporary supported brief.
4. Review the resulting report for actionability, targeting accuracy, confidence calibration, missing-input quality, and SME usefulness.

The command-line input format below is for agent implementation and advanced users; it is not required for normal use.

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
