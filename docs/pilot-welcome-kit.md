# Channel Targeting Agent Pilot Welcome Kit

Status: shareable pilot handoff
Last reviewed: 2026-07-09

## Welcome

Channel Targeting Agent turns a campaign brief, messaging document, launch deck, product page, or rough notes into a practical paid-media targeting feasibility report.

It helps you separate:

- Inputs that platforms can target directly.
- Useful substitutes or experiments.
- Information that belongs in messaging rather than targeting.
- Missing inputs that would materially improve the plan.

This is a read-only planning tool. It does not create campaigns, upload audiences, change ad accounts, or spend budget.

The current pilot is most useful as a pre-launch feasibility check. It can help a PMM, demand generation lead, or paid-media specialist decide whether a strategy is targetable enough to explore, which channels deserve closer review, and what inputs are missing before launch planning. It is not a final media plan, launch approval, or budget recommendation.

## Open The Project

Start here: [Channel Targeting Agent on GitHub](https://github.com/kchan91agent-cmd/channel-targeting-agent)

If the repository is private, accept the GitHub invitation from the pilot host first. Open the project in Codex, then attach your source and follow the first-run request below. You do not need to download files manually or use Terminal.

## Staying Current

The GitHub repository is the source of truth for this project. Before starting a new pilot or rerun, the agent host should sync the project with the latest `main` branch from GitHub.

Do not assume a Codex/App Studio project created from the GitHub link automatically receives future updates. If the project cannot sync from GitHub, create a fresh project from the repo link before running the test.

## What You Need

You need only two things:

1. Access to the Channel Targeting Agent project in a Codex workspace.
2. One readable source: a document, slide deck, PDF, product page, public link, or pasted notes.

You do **not** need to use Terminal, install software, create a structured brief, know platform-field names, or share ad-account credentials.

## Start Your First Run

Attach your source or paste a public link, then send this message in the same conversation:

```text
Use the standalone Channel Targeting Agent to assess the supplied source.

Do all required setup and analysis work yourself. Do not ask me to use Terminal or run commands. Extract only facts that the source explicitly supports, then return the complete paid-media feasibility report directly in this conversation.

Use the exact two-layer report structure in docs/output-standard.md: concise Executive Brief first, then Appendix: Targeting Evidence and Platform Detail. Do not create campaigns, upload audiences, mutate ad accounts, spend budget, invent targeting fields, or save my source or report into the repository.
```

The agent performs its setup and analysis in the background, then returns the report here.

## What You Will Receive

Your report has two layers. The most useful parts are:

- **Executive Brief:** top opportunities, channel readout, campaign concepts, missing inputs, and important caveats.
- **Source Inputs:** facts the agent extracted from your source.
- **Keyword Cluster Guidance:** how to use search, contextual, first-party, message-only, and exclusion clusters.
- **Concrete Keyword and Audience Map:** exact terms, allowed use, suitable platforms, and verification needs.
- **Platform Field Inventory:** direct fields, proxy options, first-party audience fields, and unavailable inputs for each platform.
- **Platform Detail / Cross-Platform Gaps / Manual Verification:** deeper evidence a paid-media specialist should inspect before campaign build.

Treat the report as a planning starting point. A paid-media specialist must still validate account-specific audience availability, campaign-type rules, policy restrictions, reach, and cost before launch.

The strongest current use cases are:

- Checking whether a broad ICP, persona, or ABM idea maps to real platform targeting fields.
- Separating direct targeting from proxy tests and message-only inputs.
- Finding missing account, audience, suppression, budget, and measurement inputs before media planning.
- Creating a shared starting point for PMM, demand generation, and paid-media review.

The current report does not yet provide live account-specific picklists, audience sizes, cost forecasts, or a final go / no-go launch decision.

## Privacy And Safe Use

- Your source is processed temporarily for this run and is not saved into the project by default.
- Do not attach customer lists, contact lists, account lists, tokens, passwords, or other secrets.
- For private Google Docs or Drive files, attach an exported readable file instead of sharing a private link.
- If a source cannot be read, the agent should ask for an accessible version rather than guess.

## How To Review The Output

After reading the report, ask yourself:

1. Are the source facts correct?
2. Does it clearly distinguish direct targeting from a proxy or a message-only input?
3. Did it identify the missing information that would change your plan?
4. Would a demand-generation or paid-media specialist know what to verify next?
5. Does the report make the campaign feel ready for media planning, or does it expose missing inputs first?
6. Would a sharper go / no-go call, launch-readiness score, budget-aware channel sequence, or risk register make the output easier to use?

Do not treat a platform recommendation as an instruction to launch. It is a hypothesis grounded in the current registry and your source.

## Send Feedback

Reply in the same conversation with this short feedback format. Do not include source text, account lists, screenshots, or report copy unless you have approval to share them.

```text
Pilot result: pass | needs improvement | stop

What was useful:
-

What was wrong, unclear, or too generic:
-

Any targeting claim a paid-media specialist would change:
-

What would make this more useful for executive launch planning:
-

Would you use this as a planning starting point? yes | no | with changes
```

For a formal feedback packet, use `docs/pilot-feedback-template.md`.

## If Something Does Not Work

Stay in the conversation. Tell the agent what happened in plain language and let it diagnose the setup or source-access issue. You should not be asked to troubleshoot the project from Terminal.

## Pilot Scope

This pilot is currently validated for Codex. Platform recommendations are registry-backed and docs-backed where official source catalogs are available, unless a later, explicitly authorized read-only account check confirms a specific field. Treat the report as a feasibility preflight, not final launch approval.
