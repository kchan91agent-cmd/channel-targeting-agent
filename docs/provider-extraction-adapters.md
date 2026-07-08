# Provider Extraction Adapters

Status: working
Last reviewed: 2026-06-22

## Contract

The provider adapters turn readable temporary text into one model-neutral response: either a strict normalized strategy JSON object, or `{"status":"source_unreadable","reason":"..."}`. `src/extract/provider-adapters.js` is the authoritative validator; it rejects extra fields, malformed arrays, missing `product` or `market`, and non-JSON output. Matching, report rendering, and report validation remain provider-independent.

```bash
node src/extract/extract-with-provider.js --provider codex --source /private/tmp/source.txt --out /private/tmp/brief.json
node src/extract/extract-with-provider.js --provider claude --source /private/tmp/source.txt --out /private/tmp/brief.json
```

Both commands use the same prompt, response contract, and project-owned validator before writing the brief. They return only a short error code on failure and do not print source content or model output. Provider-native schema controls are deliberately not required: they are optional hardening only, because their dialects differ and must not define project correctness.

The adapter has a 120-second provider-command deadline. A timeout terminates the provider process group, removes temporary files, and reports `PROVIDER_UNAVAILABLE`; it is an environment failure, not an extraction-fidelity result.

Before a Codex live run, use `npm run provider-preflight -- codex --probe`. This bounded non-source request verifies that Codex can execute with the current account and local runtime state; it does not access a campaign source.

The complete portable contract and gate are in [Universal Source-Extraction Adapter Contract](universal-adapter-contract.md).

## Provider requirements

- **Codex:** an authenticated `codex` CLI on `PATH`, or `CODEX_BIN` set to its executable. The adapter uses non-interactive `codex exec`, a read-only sandbox, an ephemeral session, and captures its final message for project validation.
- **Claude Code:** an authenticated `claude` CLI on `PATH`, or `CLAUDE_BIN` set to its executable. The adapter uses print mode, JSON output, one turn, and read-only tools.

The MVP implements Codex and Claude Code adapters only. The Codex adapter ignores personal CLI configuration and starts beside the temporary source rather than inside this repository, so local plugins, repository instructions, hooks, and project preferences cannot change extraction behavior. It retains account authentication. A later provider needs only a thin transport adapter that receives a temporary readable file, returns the same JSON contract, and passes the shared live acceptance corpus. The project guarantees its local temporary-file cleanup. Provider account retention, telemetry, and enterprise data controls remain governed by the tester's provider account and policy.

## Harness use

Set the generic harness adapter before a live provider extraction run:

```bash
export CHANNEL_TARGETING_EXTRACTOR=node
export CHANNEL_TARGETING_EXTRACTOR_ARGS='["src/extract/extract-with-provider.js","--provider","codex"]'
npm run test:source-extraction
```

Use `claude` instead of `codex` only after the Claude provider preflight passes. Live provider calls are not part of the default test suite because they require authentication and may process user-provided source material.
