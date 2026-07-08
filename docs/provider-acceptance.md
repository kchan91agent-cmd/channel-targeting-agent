# Provider Acceptance

Status: working
Last reviewed: 2026-06-22

## Preconditions

Run provider preflight before live extraction:

```bash
npm run provider-preflight -- codex
npm run provider-preflight -- claude
npm run provider-preflight -- codex --probe
```

Codex checks installed version and local login status. Add `--probe` to run one bounded, non-source authenticated request before any source is processed; a `PROVIDER_RUNTIME_UNAVAILABLE` result means repair Codex connectivity or local runtime state before proceeding. Claude checks installed version; its authenticated capability is confirmed only by a successful sanitized live run.

## Sanitized live acceptance

Run the equivalence corpus only with an explicit opt-in and provider-specific authenticated environment:

```bash
RUN_LIVE_PROVIDER_TESTS=1 LIVE_PROVIDER=codex LIVE_PROVIDER_REPETITIONS=3 npm run test:provider:live
RUN_LIVE_PROVIDER_TESTS=1 LIVE_PROVIDER=claude LIVE_PROVIDER_REPETITIONS=3 npm run test:provider:live
```

The suite uses only committed sanitized text fixtures. Each provider must extract the approved canonical strategy across six source architectures and produce one validator-compliant standard report for all runs. Live tests are excluded from the normal test suite because they use provider access and may consume account quota.

## Universal adapter gate

All providers are judged by one project-owned contract, not by a provider-specific schema dialect. An adapter must read the restricted temporary source file and return either one normalized strategy JSON object or `{"status":"source_unreadable","reason":"..."}`. The shared validator rejects explanatory prose, unknown fields, incomplete required facts, and invalid field types before matching or rendering begins. Codex and Claude Code are the only MVP transports; another LLM is accepted only after it passes this same corpus and fixed-report test.

## Pilot feedback

After a passing sanitized run, conduct one authorized private canary per provider. Compare it to an approved fact sheet locally, then send only the completed [feedback packet](pilot-feedback-template.md). Do not send raw input, output, account lists, or model transcripts.
