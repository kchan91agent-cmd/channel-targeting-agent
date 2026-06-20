# Agent Workflow

Status: working
Last reviewed: 2026-06-19

This MVP is meant to run inside an agent workflow, not as a web app.

For external testers using their own Codex or Claude Code workspace, start with `docs/third-party-pilot.md`. The project is standalone and should not depend on parent workspace context.

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
Preferred channels: linkedin-ads, microsoft-ads, google-ads-youtube
```

## Codex Or Claude Prompt

```text
Use this repository to assess whether the attached PMM campaign brief can be translated into platform-available paid media targeting.

Run:
npm run report -- <brief-path>

Then summarize:
1. The concrete activation actions to take or verify next, including audience sizing.
2. The direct targeting attributes to verify within each platform.
3. The dynamic picklists or authenticated fields that need platform-side checking.
4. The proxy/contextual levers that can support test or experiment campaign sets but do not prove buyer reach.
5. The pains, gains, objections, and triggers that should stay in messaging, landing pages, or sales follow-up.
6. The missing inputs that would materially change the plan.
7. The channel hypotheses by evidence quality.
8. The manual or authenticated verification required before campaign build.
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

The output should help a PMM act, not just educate themselves. Lead with activation actions and targeting levers before channel groupings or definitions. Summarize high-value keyword clusters in the main readout and keep raw keyword, pain, trigger, interest, and community lists in the appendix.

Use this targeting-map structure in the main report:

- `Use Directly`
- `Use As Proxies Or Test/Experiment Campaign Sets`
- `Keep Primarily In Messaging (Low Confidence in targeting for conversion)`

Keyword cluster guidance should explain how the clusters are used. Product, category, trigger, and initiative clusters can structure search, custom-segment, or contextual tests when they map to demand signals. Pain, gain, objection, and trigger language usually belongs in copy, landing pages, and sales follow-up. Do not present broad keyword matching as the primary way to target pains or objections.

When available, include audience inputs beyond persona and pain:

- first-party lists: account, customer, contact, suppression
- retargeting and engagement audiences
- lookalike or similar-audience seed lists
- contextual inputs: placements, topics, communities
- environment inputs: device or operating context
- broad platform inputs: demographics, education, life events
- exclusions and negative keywords
