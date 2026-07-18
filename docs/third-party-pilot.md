# Third-Party Pilot Guide

Status: working
Last reviewed: 2026-07-18

This guide is for an external PMM, demand generation, or growth team testing Channel Targeting Agent in Codex or Claude Code.

The project is standalone. It does not require parent workspace context, private notes, personal workspace paths, ad account access, or customer data.

## Two Roles: Tester And Agent Host

The **tester** is non-technical. They stay in the conversation window: attach a source or give a public link, then ask for the analysis. They must never be asked to open Terminal, install a dependency, name a schema field, or run a command.

The **agent host** is the Codex or Claude Code environment containing this project. It runs the required commands privately and returns the final report in chat. If its runtime is unavailable, it reports that plain-language setup problem and stops; it does not give the tester a terminal command.

## What The Pilot Tests

Use the pilot to evaluate whether the agent can turn a real campaign, ICP, persona, or ABM idea into a practical targeting feasibility readout.

The pilot should answer:

- Which inputs are directly targetable in paid platforms?
- Which inputs are only proxies or experiment paths?
- Which pains, gains, objections, and triggers should stay in copy, landing pages, or sales follow-up?
- Which missing inputs would materially change the plan?
- Which fields need manual or authenticated platform verification before build?

Do not use the pilot to launch campaigns, upload audiences, mutate ad accounts, or make budget decisions without human review.

## Share With A Tester

Send the tester [Pilot Welcome Kit](pilot-welcome-kit.md). It contains the only instructions they need: complete the conversation-only quick start, optionally run the example, attach a source, review the report, and return redacted feedback.

## Share The Project

Use one of these handoff paths:

1. Private Git repo: create a new repository from this folder and invite the pilot user.
2. Zip handoff: zip this folder and send it through an approved file-sharing path.
3. Internal fork: copy this folder into the tester's existing agent workspace.

Share only the `channel-targeting-agent` folder. Do not include parent workspace folders, private notes, local `.env` files, generated one-off reports, or customer-specific briefs unless the pilot user is authorized to see them.

## Keep The Project Current

The GitHub repository is the source of truth. Before each new pilot, test run, or project-based rerun, the agent host must run `npm run sync-check`. The user-facing analysis and report commands also run this check automatically.

The check fast-forwards a clean checkout when a newer `main` is available. If GitHub cannot be reached or the update cannot be applied safely, continue with the cached commit reported by the check. Never overwrite local changes. Do not assume a Codex project or Claude Code workspace created from the GitHub repository automatically receives future updates.

## Required Setup Completion Handoff

When the agent host completes setup and the tester has not supplied a source, it must return the canonical `Setup Completion Response` in `docs/workflow.md`. Successful setup must not end with only a technical completion summary or a generic question.

The handoff offers two paths:

1. `Run the example` to see the included sample report.
2. `Analyze your own material` by attaching an unformatted source.

If the tester already supplied a readable source, the agent host should skip the choice and continue directly into analysis. If setup fails, it should report the plain-language host problem instead of showing the success handoff.

## For A Non-Technical Pilot User

The pilot user can begin by running the included example or by supplying a readable source: a launch deck, messaging document, campaign brief, product page, link, attachment, PDF, or pasted notes. They do not need to create a campaign brief, understand platform fields, choose a provider, or run commands.

Give the agent this request in the conversation window:

```text
Use the standalone Channel Targeting Agent to assess the supplied source.

Do all required setup and analysis work yourself. Do not ask me to use Terminal or run commands. Run preflight, then use `npm run analyze-source` with the provider and supplied source. The command creates a temporary, source-backed campaign brief outside the repository and runs the feasibility report.

Deliver the complete result directly in this response window for a non-technical user to gut-check. Do not create, save, attach, or link a Markdown report file. Use the exact two-layer response structure in docs/output-standard.md: concise Executive Brief first, then Appendix: Targeting Evidence and Platform Detail. Do not create campaigns, upload audiences, mutate ad accounts, spend budget, or invent targeting fields.
```

The agent must use an explicit provider (`codex` or `claude`), extract only source-backed facts into a temporary brief, keep absent inputs absent, and return the report. If it cannot read the source, it must ask for an accessible file or public HTTPS URL instead of guessing. It must keep the source, temporary brief, and report outside the repository unless the pilot user explicitly authorizes saving a shareable version.

## Agent-Host Requirements

These are handled by the agent host before or during the conversation. They are not tester tasks.

- A working Node.js 20 or newer runtime. This is a hard prerequisite for `npm test`, `node --test`, and every report command; the project cannot generate a report without it. Use the current Node LTS for a new environment from the official [Node.js download page](https://nodejs.org/en/download).
- An authenticated Codex or Claude Code environment that can run project commands.
- No platform credentials are required for the first pilot pass.

Optional:

- Read-only platform API credentials for field checks. See `docs/api-connections.md`.

## Agent-Host Preparation (Not A Tester Task)

The hosting agent runs preflight before creating a pilot brief or attempting a report:

```bash
# macOS / Linux
sh scripts/preflight.sh

# PowerShell (does not change your persistent execution policy)
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```

If preflight fails, the hosting agent reports the setup issue to its operator. Do not start the tester session until it succeeds.

For the first conversation in a new host, the agent should also run `npm run freshness` and, when network access is available, `npm run refresh -- --dry-run`. These are read-only advisory checks. They never require a tester credential, never modify an ad platform, and do not block a report when a public documentation URL is unavailable.

Install dependencies, then run:

```bash
npm ci
npm test
npm run analyze-source -- --provider codex --file examples/b2b-saas-generic.md
```

The host preparation run should pass the test suite and print the complete example report. If the tester has not supplied a source, the agent then returns the required setup-completion handoff rather than dumping host output into the conversation. Source ingestion and provider extraction cannot run in a fresh environment without npm-installed dependencies.

## Agent Host Troubleshooting

Keep these fixes behind the scenes. A non-technical tester should not be asked to run Terminal commands.

- If `node` or `npm` is missing, the host needs Node.js 20+ installed or an activated bundled runtime from the agent environment.
- If `npm` works but project scripts fail with `node: command not found`, the host has npm available but Node is not on `PATH`. Add the Node binary directory to `PATH`, then rerun setup. In Codex Desktop on macOS, the bundled runtime is commonly available with:

  ```bash
  PATH=/Applications/Codex.app/Contents/Resources/cua_node/bin:$PATH npm test
  ```

- Folder names with spaces are supported. If extraction fails only in a path such as `Channel Targeting Agent`, check whether the failing path contains URL encoding such as `%20`.
- `npm run refresh -- --dry-run` requires outbound network access to official documentation URLs. If it returns `fetch failed`, treat that as a network or sandbox-access issue before treating it as a source freshness problem.
- Missing ad-platform credentials are expected for the default pilot. The first-pass report is registry-backed only; authenticated field checks are optional later-stage validation.

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
npm run report -- pilot-brief.md
```

Do not commit `pilot-brief.md` if it contains confidential strategy, target accounts, customer data, or private campaign details. The non-technical workflow returns the report in chat and does not save a report file.

## Agent Prompt For Codex Or Claude Code

```text
Use this repository as a standalone Channel Targeting Agent.

Goal:
Assess whether the attached campaign, ICP, persona, or ABM brief can be translated into platform-available paid media targeting.

Steps:
1. Read AGENTS.md and docs/workflow.md.
2. Run the applicable preflight command. If it fails, stop and report the runtime setup failure.
3. Run `npm ci` when dependencies are not installed, then run `npm test`.
4. Run `npm run analyze-source -- --provider codex|claude --file <source-file>` or use `--url <public-https-url>`.
5. Review the report for overconfident recommendations.
6. Return the complete response using the exact two-layer structure in `docs/output-standard.md`; do not save or attach a report file.

Rules:
- Do not use parent workspace context, external memory, or unrelated personal notes.
- Do not invent platform fields.
- Do not treat pains, gains, objections, or triggers as direct targeting or proxy targeting; keep them as message and creative inputs unless an explicitly verified exact platform field exists.
- Do not upload audiences, create campaigns, mutate ad accounts, or spend budget.
- Keep confidential pilot briefs and reports local unless the user explicitly asks to share or commit them.
- Never ask the pilot user to run a command, use Terminal, install Node, or choose a provider. Resolve setup yourself or explain in plain language that the agent environment needs repair.
- After successful setup without a supplied source, return the canonical quick start in `docs/workflow.md`; do not stop at a setup summary.
```

## Suggested Pilot Scorecard

After each test brief, rate the output from 1 to 5. Use these anchors: **1** means unusable or unsafe without major rework; **3** means directionally useful but needs material human correction; **5** means ready for a PMM and paid-media specialist to use as a working starting point.

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

Use `docs/pilot-feedback-template.md` to return a redacted, structured feedback packet with provider/version, source type, contract status, scores, and remediation owner.

### Pilot Decision Rule

Continue the pilot only when the report contract is valid and no source fact was invented. A run is ready to promote when its average score is at least 4, no category is below 3, and the paid-media SME has no unresolved high-risk targeting correction. Otherwise, submit the redacted feedback packet and classify the required change before rerunning.

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

For each pilot run, send back only:

- the scorecard ratings
- notes on overconfidence, missing fields, or confusing wording
- any platform-specific corrections from a demand generation SME
- the redacted feedback packet in `docs/pilot-feedback-template.md`

Do not send source text, reports, screenshots, account lists, or model transcripts by default. If something is confidential, send only concrete feedback about report behavior.
