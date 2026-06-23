# Agent Instructions

This repository is designed to be used from Codex, Claude Code, Cursor, or a local terminal. There is no web UI in the MVP.

This project must remain standalone. Do not rely on parent workspace context, personal notes, private operating systems, local absolute paths, or external memory when running or improving this repository for a third-party pilot. Use only files inside this project unless the user explicitly supplies an external brief or reference.

## What This Tool Does

Use this project to translate PMM ICP, persona, and campaign strategy into platform-available paid media targeting options.

The tool should:

- identify exact targeting fields where they exist
- suggest substitutes where exact fields do not exist
- flag unsupported strategy dimensions instead of inventing targeting fields
- cite platform source freshness and caveats
- stay read-only

The tool should not:

- create campaigns
- upload audiences
- mutate ad accounts
- spend budget
- scrape logged-in campaign-builder UIs
- claim exact picklist availability unless an official API or authenticated source confirms it

## Common Commands

Run the applicable preflight check before a third-party pilot. A working Node.js 20+ runtime is a hard prerequisite for every test and report command.

```bash
# macOS / Linux
sh scripts/preflight.sh

# PowerShell (does not change your persistent execution policy)
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```

```bash
npm test
npm run test:output-standard
npm run match -- examples/logistics-operations.json
npm run report -- examples/logistics-operations.md
npm run check-fields -- --platform google-ads-youtube
npm run refresh -- --dry-run
```

If preflight confirms Node 20+ but `npm` is unavailable, run Node directly:

```bash
node --test
node src/report.js examples/logistics-operations.md
```

## Agent Workflow

The default user is non-technical. Do not require them to create a Markdown brief, name schema fields, or run a command.

1. Accept a readable user-supplied source: link, attachment, slide deck, document, product page, or pasted notes.
2. Read the source. If it is inaccessible or incomplete, ask for accessible text or a downloadable file; do not infer missing content.
3. Extract only source-supported facts into a temporary JSON or Markdown strategy input outside the repository. For readable text, `node src/extract/extract-source.js --source <temporary-source> --out <temporary-brief.json>` provides the deterministic default. For ambiguous prose, use the project-owned Codex or Claude adapter: `node src/extract/extract-with-provider.js --provider codex|claude --source <temporary-source> --out <temporary-brief.json>`. Before either extraction path, use `src/source/ingest.js` to convert supported attachments and public URLs into readable temporary text. Do not use private Google Docs or Drive links directly: export or attach a readable file. Leave unsupported or absent fields blank so the report can identify them as missing.
4. For a supported file or public URL, run `npm run analyze-source -- --provider codex|claude --file <path>|--url <public-https-url>`; this owns temporary ingestion, extraction, report generation, and contract validation. Use the lower-level report command only when an advanced user explicitly supplies a structured brief.
5. Return the PMM-readable report. Do not expose internal input-field mechanics unless the user asks to refine the result.
6. Review unsupported fields carefully and recommend campaign targeting only from exact or clearly labeled substitute fields.
7. Keep pains, gains, objections, and triggers in message/creative strategy. They cannot be targeting proxies unless the registry contains an explicitly verified exact platform field.

Never write a user-supplied source, temporary brief, or generated report into this repository unless the user explicitly asks and confirms it is safe to share. Do not create campaigns, upload audiences, mutate ad accounts, or spend budget.

For third-party pilots, follow `docs/third-party-pilot.md`. Keep pilot briefs and reports local unless the user explicitly asks to commit or share them.

## Durable Isolation And Portability

Treat `docs/portability-and-isolation.md` as the release contract. Before sharing the project, run `npm ci`, `npm test`, and `npm run check:portability`. Keep all dependencies project-declared and locked; do not add parent-workspace paths, private artifacts, personal configuration, or undocumented runtime assumptions. When changing source retention, dependencies, provider behavior, credentials, or the pilot flow, update that contract and add a deterministic guard where possible.

## Credential Handling

Use `.env.example` as a reference. Never commit real tokens. If credentials are missing, use registry-backed fallback behavior and say that live platform verification was not available.

For a new agent host or pilot batch, run `npm run freshness` and then `npm run refresh -- --dry-run` before the first conversation when network access is available. These checks are advisory and read-only: do not delay a user report solely because an official documentation URL is unavailable. Follow `docs/platform-freshness-policy.md`; account-specific checks require explicit authorized credentials and remain read-only.

## Output Standard

`docs/output-standard.md` is the required response contract. It supersedes the older action-led report layout below whenever they conflict. Use all nine sections in that file, in that order, and return the complete report directly in the chat response. Do not write a report file unless the user explicitly asks for a saved artifact.

In particular, the agent must inventory every relevant platform field even when no source value exists, use `Input missing — provide [specific input].` for absent values, and retain the exact field-type vocabulary from the response contract. When platform credentials are unavailable, write `Registry-backed only — not account-confirmed.`

Keep pains, gains, objections, and triggers in the `Keep in Messaging` section. Never turn them into keyword or contextual targeting proxies without an explicitly verified platform field. The report may be long because the complete platform inventory is mandatory; do not summarize it away.

## Source-Extraction Regression Harness

Run `npm run test:source-extraction` to test the executable source-to-brief boundary before sharing changes to source extraction. The harness keeps all run material in an OS temporary directory and compares only sanitized normalized facts and report-contract outcomes. All provider transports must implement the model-neutral contract in `docs/universal-adapter-contract.md`; Codex and Claude Code are the current MVP adapters. See `docs/source-extraction-harness.md` for the harness and private-canary procedure.
