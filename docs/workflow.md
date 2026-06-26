# Agent Workflow

Status: working
Last reviewed: 2026-06-21

This MVP is meant to run inside an agent workflow, not as a web app.

For external testers using their own Codex or Claude Code workspace, start with `docs/third-party-pilot.md`. The project is standalone and should not depend on parent workspace context.

## Default User Flow: Readable Source In, Report Out

The person requesting analysis should only need to provide a readable source: a launch deck, messaging document, campaign brief, product page, PDF, link, attachment, or pasted notes. They do not need to make a Markdown brief or run commands.

The agent must:

1. Read the supplied source.
2. Create a temporary supported brief from facts in that source only.
3. Leave absent fields empty so missing-input checks remain useful.
4. Run preflight and `npm run analyze-source -- --provider codex|claude --file <path>|--url <public-https-url>`.
5. Return the complete two-layer report defined in `docs/output-standard.md` directly in the response window: concise Executive Brief first, then Appendix: Targeting Evidence and Platform Detail. Do not save, attach, or link a report file unless explicitly asked.

The standard command owns ingestion and provider extraction. It requires an explicit provider, writes temporary material outside the repository, and validates the fixed report contract. The lower-level extraction commands remain available for regression tests and advanced debugging only.

If the source cannot be read, request accessible text or a downloadable file. Do not proceed from partial access or invent missing details. Keep the temporary brief and report outside the repository unless the user explicitly authorizes saving a shareable version.

## Runtime Preflight

A working Node.js 20+ runtime is required before any test or report command. Use the current Node LTS for a new setup; obtain it from the official [Node.js download page](https://nodejs.org/en/download), reopen the terminal, then run the applicable check from the project root:

```bash
# macOS / Linux
sh scripts/preflight.sh

# PowerShell (does not change your persistent execution policy)
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```

If Node is not installed or is older than 20, stop the pilot, install or activate Node 20+, and rerun preflight. Run `npm ci` before source ingestion or provider extraction so the document-conversion libraries are installed from the committed lockfile. If Node passes but npm is absent, only limited structured-brief report commands may work when dependencies are already installed.

## Basic Usage

```bash
npm run report -- examples/logistics-operations.md
```

The command reads a brief, runs the matcher, and prints a Markdown report.

## Supported Brief Format

Use simple label/value lines. Comma-separated values become arrays.

```markdown
# Campaign Brief

Product: Route orchestration software
Market: Enterprise logistics
Locale: US
Geographies: United States, Canada
Industries: Retail, CPG, Third-party logistics
Company sizes: 1000+
Job titles: VP Logistics, Director of Transportation
Job functions: Operations, Supply Chain
Seniorities: Director, VP
Account lists: Strategic target accounts
Customer lists: Current customer CRM segment
Website visitors: Product page visitors
Keywords: route optimization, last mile logistics
Placements: supply chain trade publications
Topics: last mile delivery, logistics technology
Pains: manual dispatch exceptions, high cost-to-serve
Triggers: SLA pressure, mixed fleet complexity
Exclusions: current customers, students, job seekers
Campaign goal: Pipeline creation
Budget: $15,000 test budget
Conversion event: Sales-qualified meeting
Measurement thresholds: 20 sales-qualified meetings, cost per meeting below $750
Audience-sizing requirements: At least 10,000 reachable members per channel
Preferred channels: linkedin-ads, microsoft-ads, google-ads-youtube
```

## Codex Or Claude Prompt

```text
Use this repository to assess whether the attached or linked launch deck, messaging document, campaign brief, product page, or notes can be translated into platform-available paid media targeting.

Read the source and create a temporary supported brief from source-backed facts only. Do not ask the user to create a brief or run terminal commands. If the source cannot be read, request accessible text or a downloadable file. Run preflight, then generate the report.

Return the complete result using the exact two-layer response structure in `docs/output-standard.md`. Keep the Executive Brief concise, but do not compress the appendix field inventory, keyword map, source inputs, platform details, gaps, or verification checks. Do not save the source, temporary brief, or report in the repository unless the user explicitly asks for a shareable version.
```

## Field Checks

Run a registry-backed field check:

```bash
npm run check-fields -- --platform google-ads-youtube
```

If credentials are missing, this returns a recoverable `MISSING_AUTH` error and registry fallback fields.

## Report Review Rule

Do not treat a substitute as an exact field. A PMM should be able to tell the difference between:

- direct platform targeting
- proxy targeting
- creative/message strategy
- manual platform verification

The output must follow `docs/output-standard.md`. Keyword, intent, and technographic inputs may structure verified search, custom-segment, or contextual tests. Pain, gain, objection, and trigger language belongs in copy, landing pages, and sales follow-up; it must not be presented as a proxy targeting lever.

A registry maintainer may map one of those message inputs only by adding `verifiedMessageTargeting: true` to an `exact` targeting dimension backed by a verified official platform field. That field is shown as direct targeting but still receives no targeting-fit score.

When available, include audience inputs beyond persona and pain:

- first-party lists: account, customer, contact, suppression
- retargeting and engagement audiences
- lookalike or similar-audience seed lists
- contextual inputs: placements, topics, communities
- environment inputs: device or operating context
- broad platform inputs: demographics, education, life events
- exclusions and negative keywords
- budget, conversion event, measurement thresholds, and audience-sizing requirements
