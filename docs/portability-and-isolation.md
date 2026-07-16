# Portability And Isolation Contract

Status: source-of-truth
Last reviewed: 2026-07-15

## What Must Stay True

This repository is shareable by itself. It must not depend on a parent workspace, any personal workspace, a developer's absolute path, private notes, a local model configuration, or a private source artifact.

- Project dependencies are declared in `package.json` and locked in `package-lock.json`; a new host uses Node.js 20+ and `npm ci`.
- Raw sources, normalized briefs, provider responses, and reports are temporary by default and removed after a run.
- Committed fixtures are fictional and sanitized. Real sources are manual local canaries only.
- Credentials are environment variables or local ignored files. They are never committed.
- Codex extraction ignores personal user configuration and runs beside its temporary source, not inside a personal workspace.
- The fixed report contract, extraction contract, matcher, and platform registry remain project-owned and provider-neutral.
- A successful setup-only pilot request ends with the canonical quick-start handoff in `docs/workflow.md`, offering the bundled example or the tester's own source. The welcome kit, third-party guide, and agent instructions must preserve that same next-step contract across Codex and Claude Code.

## Maintainer Release Check

Before sharing this project, run:

```bash
npm ci
npm test
npm run check:portability
```

For a provider release, also run its preflight and sanitized live acceptance suite. Do not substitute a private brief for the committed corpus.

Review `git status --short` before sharing. Do not include `.env` files, private-marked documents, one-off pilot briefs or reports, parent folders, or an unrelated workspace configuration.

## When You Change The Project

Update this contract and `AGENTS.md` whenever a change affects dependencies, source retention, environment variables, provider behavior, file locations, or the external pilot flow. Add a deterministic test when the rule can be checked mechanically.

`npm run check:portability` is the mechanical guard. It verifies the Node requirement, install lock, private-artifact ignores, and absence of known personal-workspace references in project text files. It does not replace human review of new files or secrets.
