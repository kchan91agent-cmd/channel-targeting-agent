# Universal Source-Extraction Adapter Contract

Status: working
Last reviewed: 2026-06-22

## Purpose

Every LLM provider must cross the same source-to-brief boundary. The provider is not allowed to define a new targeting schema, report layout, or pass condition. It supplies a transport adapter; the project owns validation, matching, report rendering, and output-contract validation.

## Inputs and outputs

The adapter receives a restricted, temporary readable source file through:

```text
--source <temporary-readable-file> --out <temporary-normalized-brief.json>
```

The model response must be exactly one JSON object:

```json
{
  "product": "...",
  "market": "..."
}
```

It may include only fields in the normalized strategy contract. All included values must be source-supported; absent facts stay absent. When the source cannot be read adequately or does not support both required facts, it must return exactly:

```json
{"status":"source_unreadable","reason":"short non-sensitive reason"}
```

No Markdown, code fences, explanation, source quotes, transcript, or provider metadata is part of the contract. The project parser tolerates a single accidental JSON code fence, then rejects anything else. The adapter writes a validated normalized brief only after the response passes project validation.

## Acceptance boundary

The universal gate is `npm run test:provider:live` with the sanitized six-artifact equivalence corpus. A provider passes only if every permitted repetition produces:

1. The approved canonical normalized strategy.
2. The same rendered report across every artifact and repetition.
3. A passing `validateStandardOutput` result.

Failure classification is project-owned: fact differences are extraction-fidelity failures; a failed standardized report after valid extraction is an output-framework failure; platform classification differences are matcher/registry failures; unavailable CLI, credentials, or file access are environment failures.

## MVP adapters

Codex and Claude Code are the only implemented transports in this MVP. Their invocation and output retrieval differ, but both use the shared prompt and validator in `src/extract/provider-adapters.js`. Provider-native structured-output features may be added as optional defense-in-depth, but they cannot be required for acceptance because schema dialects differ across environments.

To add another LLM later, implement only a transport that reads the temporary file, returns the universal JSON response, and passes provider preflight plus the live acceptance suite. Do not change the report framework or targeting contract to accommodate the provider.
