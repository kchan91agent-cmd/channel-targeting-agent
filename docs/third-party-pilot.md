# Third-Party Pilot Guide

Status: working
Last reviewed: 2026-06-21

This guide is for an external PMM, demand generation, or growth team testing Channel Targeting Agent in their own Codex, Claude Code, Cursor, or terminal environment.

The project is standalone. It does not require parent workspace context, private notes, personal workspace paths, ad account access, or customer data.

## What The Pilot Tests

Use the pilot to evaluate whether the agent can turn a real campaign, ICP, persona, or ABM idea into a practical targeting feasibility readout.

The pilot should answer:

- Which inputs are directly targetable in paid platforms?
- Which inputs are only proxies or experiment paths?
- Which pains, gains, objections, and triggers should stay in copy, landing pages, or sales follow-up?
- Which missing inputs would materially change the plan?
- Which fields need manual or authenticated platform verification before build?

Do not use the pilot to launch campaigns, upload audiences, mutate ad accounts, or make budget decisions without human review.

## Share The Project

Use one of these handoff paths:

1. Private Git repo: create a new repository from this folder and invite the pilot user.
2. Zip handoff: zip this folder and send it through an approved file-sharing path.
3. Internal fork: copy this folder into the tester's existing agent workspace.

Share only the `channel-targeting-agent` folder. Do not include parent workspace folders, private notes, local `.env` files, generated one-off reports, or customer-specific briefs unless the pilot user is authorized to see them.

## For A Non-Technical Pilot User

The pilot user supplies only a readable source: a launch deck, messaging document, campaign brief, product page, link, attachment, PDF, or pasted notes. They do not need to create a campaign brief, understand platform fields, or run commands.

Give the agent this request:

```text
Use the Channel Targeting Agent in this project to assess the attached or linked source. Create any temporary input it needs, run the feasibility report, and return the activation actions, targeting map, missing inputs, channel hypotheses, and manual verification required. Do not create campaigns, upload audiences, or invent targeting fields.
```

The agent must extract only source-backed facts into a temporary brief, keep absent inputs absent, and return the report. If it cannot read the source, it must ask for accessible text or a downloadable file instead of guessing. It must keep the source, temporary brief, and report outside the repository unless the pilot user explicitly authorizes saving a shareable version.

## Requirements

- A working Node.js 20 or newer runtime. This is a hard prerequisite for `npm test`, `node --test`, and every report command; the project cannot generate a report without it. Use the current Node LTS for a new environment from the official [Node.js download page](https://nodejs.org/en/download).
- Codex, Claude Code, Cursor, or a local terminal.
- No platform credentials are required for the first pilot pass.

Optional:

- Read-only platform API credentials for field checks. See `docs/api-connections.md`.

## First Run

From the project root, run preflight before creating a pilot brief or attempting a report:

```bash
# macOS / Linux
sh scripts/preflight.sh

# PowerShell (does not change your persistent execution policy)
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```

If preflight fails, install or activate Node.js 20+, reopen the terminal, and rerun preflight. Do not continue the pilot until it succeeds.

If preflight finds npm, run:

```bash
npm test
npm run report -- examples/logistics-operations.md --out examples/outputs/logistics-operations-report.md
```

If preflight confirms Node 20+ but npm is unavailable, run:

```bash
node --test
node src/report.js examples/logistics-operations.md --out examples/outputs/logistics-operations-report.md
```

The first run should pass the test suite and generate a Markdown report.

## Advanced: Test With A Real Brief

The agent should normally create this local file for the user. Create one manually only when an advanced user wants to control every input.

```markdown
# Campaign Brief

Product:
Market:
Locale:
Geographies:
Industries:
Company sizes:
Account lists:
Customer lists:
Contact lists:
Website visitors:
Retargeting audiences:
Engagement audiences:
Lookalike seeds:
Job titles:
Job functions:
Seniorities:
Keywords:
Placements:
Topics:
Devices:
Demographics:
Education:
Life events:
Pains:
Gains:
Objections:
Triggers:
Exclusions:
Negative keywords:
Suppression lists:
Campaign goal:
Budget:
Conversion event:
Measurement thresholds:
Audience-sizing requirements:
Preferred channels:
```

Then run:

```bash
npm run report -- pilot-brief.md --out pilot-report.md
```

Do not commit `pilot-brief.md` or `pilot-report.md` if they contain confidential strategy, target accounts, customer data, or private campaign details.

## Agent Prompt For Codex Or Claude Code

```text
Use this repository as a standalone Channel Targeting Agent.

Goal:
Assess whether the attached campaign, ICP, persona, or ABM brief can be translated into platform-available paid media targeting.

Steps:
1. Read AGENTS.md and docs/workflow.md.
2. If no brief file exists, create a local temporary Markdown brief from the user's source material.
3. Run the applicable preflight command. If it fails, stop and report the runtime setup failure.
4. Run `npm test` and `npm run report -- <brief.md> --out <report.md>` when npm is available; otherwise run `node --test` and `node src/report.js <brief.md> --out <report.md>`.
5. Review the report for overconfident recommendations.
6. Summarize:
   - direct targeting attributes to verify
   - proxy or experiment campaign sets
   - message-only pains, gains, objections, and triggers
   - missing inputs that would change the plan
   - manual or authenticated verification needed before campaign build

Rules:
- Do not use parent workspace context, external memory, or unrelated personal notes.
- Do not invent platform fields.
- Do not treat pains, gains, objections, or triggers as direct targeting or proxy targeting; keep them as message and creative inputs unless an explicitly verified exact platform field exists.
- Do not upload audiences, create campaigns, mutate ad accounts, or spend budget.
- Keep confidential pilot briefs and reports local unless the user explicitly asks to share or commit them.
```

## Suggested Pilot Scorecard

After each test brief, rate the output from 1 to 5:

- Actionability: Can a PMM brief demand generation from the output?
- Targeting accuracy: Are direct fields, proxies, and unavailable dimensions separated correctly?
- Confidence calibration: Does the report avoid saying a channel is "the answer" when it is only a hypothesis?
- Missing-input quality: Does the report identify the inputs needed to improve the plan?
- SME usefulness: Would a paid media specialist know what to verify next?

Capture 3-5 concrete notes:

- What was useful?
- What was too generic?
- What was overconfident?
- What field or platform behavior did the report miss?
- What would make the next run more useful?

## Safe Pilot Boundaries

Allowed:

- fictional or sanitized campaign briefs
- local Markdown reports
- read-only source checks
- registry-backed field checks
- human review with a demand generation SME

Not allowed in this MVP:

- campaign creation
- ad account mutation
- audience upload
- customer list ingestion
- scraping logged-in campaign-builder UIs
- treating registry-backed output as authenticated field availability

## What To Send Back

For each pilot run, send back:

- the sanitized input brief, if shareable
- the generated report, if shareable
- the scorecard ratings
- notes on overconfidence, missing fields, or confusing wording
- any platform-specific corrections from a demand generation SME

If the input brief is confidential, send back only a redacted brief and concrete feedback about the report behavior.
