# Channel Targeting Agent Pilot Welcome Kit

Status: shareable pilot handoff
Last reviewed: 2026-07-18

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

If the repository is private, accept the GitHub invitation from the pilot host first. Open the project in a supported agent workspace: Codex or Claude Code. The agent host handles repository and runtime preparation; the pilot tester should not be asked to use Terminal.

## Staying Current

The GitHub repository is the source of truth for this project. Before starting a new pilot or rerun, the agent host should run `npm run sync-check`; the main user-facing analysis and report commands also run it automatically.

The check safely fast-forwards a clean checkout. If GitHub is unavailable or the update cannot be applied without risking local work, the agent continues with the cached commit it reports. Do not assume a Codex project or Claude Code workspace created from the GitHub repository automatically receives future updates.

## What You Need

You need only two things:

1. Access to the Channel Targeting Agent project in a Codex or Claude Code workspace.
2. One readable source: a document, slide deck, PDF, product page, public link, or pasted notes.

You do **not** need to use Terminal, install software, create a structured brief, know platform-field names, or share ad-account credentials.

## After Setup: Quick Start

When the project is ready and you have not supplied a source yet, the agent should not stop after saying setup is complete. It should offer two next steps in the same conversation:

1. **Run the example:** see the expected report using the included sample.
2. **Analyze your own material:** attach a campaign brief, messaging document, deck, PDF, public product page, or paste rough notes.

You can reply with `run the example` or attach your source. You do not need to format the source or use Terminal. Do not attach customer lists, account lists, credentials, or other secrets.

If the project says setup is complete without showing these choices, send:

```text
Show me the Channel Targeting Agent quick start.
```

## Analyze Your Own Material

Attach your source or paste a public link, then send this message in the same conversation:

```text
Use the standalone Channel Targeting Agent to assess the supplied source.

Do all required setup and analysis work yourself. Do not ask me to use Terminal or run commands. Extract only facts that the source explicitly supports, then return the complete paid-media feasibility report directly in this conversation.

Use the exact two-layer report structure in docs/output-standard.md: concise Executive Brief first, then Appendix: Targeting Evidence and Platform Detail. Do not create campaigns, upload audiences, mutate ad accounts, spend budget, invent targeting fields, or save my source or report into the repository.
```

The agent performs any remaining host setup and analysis in the background, then returns the report here. Codex and Claude Code use the same report contract and tester experience; the hosting environment chooses its own supported provider adapter behind the scenes.

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

The conversation-only pilot flow supports Codex and Claude Code. Codex has completed the current live acceptance corpus; Claude Code remains a supported pilot path whose cross-provider acceptance is still being expanded. Platform recommendations are registry-backed and docs-backed where official source catalogs are available, unless a later, explicitly authorized read-only account check confirms a specific field. Treat the report as a feasibility preflight, not final launch approval.
