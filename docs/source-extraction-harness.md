# Source-Extraction End-to-End Harness

Status: source-of-truth
Last reviewed: 2026-06-22

## Purpose

This harness verifies that semantically equivalent but architecturally different readable sources produce the same normalized strategy and the same required two-layer report. It tests source-to-brief extraction separately from matching and rendering.

The committed corpus is fictional and sanitized. Do not add customer documents, source URLs, account lists, user data, or model transcripts to fixtures or diagnostics.

## Executable extractor contract

The default extractor is executable and dependency-free:

```bash
node src/extract/extract-source.js --source /private/tmp/source.txt --out /private/tmp/normalized-brief.json
```

It is a conservative reference extractor for readable text. It only returns explicit facts and validates the generated brief before writing it. It is not a replacement for a capable source-reading agent for PDFs, Office documents, web pages, or ambiguous prose.

Use a production model-backed adapter by setting:

```bash
export CHANNEL_TARGETING_EXTRACTOR=/absolute/path/to/extractor
export CHANNEL_TARGETING_EXTRACTOR_ARGS='["--model","approved-model"]'
```

The harness appends `--source <ephemeral-readable-file> --out <ephemeral-normalized-brief.json>`. A model adapter must accept one universal response: a normalized strategy JSON object, or `{"status":"source_unreadable","reason":"..."}`. Project code validates the response before writing the brief; provider-native schema modes are optional and do not determine acceptance. The adapter must use only source-backed facts, leave absent values absent, return non-zero when source access is incomplete, and not emit source prose to stderr.

## Run

```bash
npm run test:source-extraction
```

Every run creates a restricted OS temporary directory. Source copies, normalized briefs, and rendered reports exist only there and are removed in a `finally` block. The repository retains only sanitized fixtures and expected normalized facts.

For one authorized private canary, print a redacted diagnosis without storing its source or report:

```bash
npm run diagnose-source -- --case private-canary-01 --source /secure/path/source.txt --expected /secure/path/approved-strategy.json
```

The output contains only the case ID, status, failure class, remediation owner, contract errors, and changed-field value counts. It never prints source text or extracted values.

## Failure interpretation

| Result | Required change |
| --- | --- |
| `extraction-fidelity` | Fix source-to-brief extraction. Add the sanitized failing architecture as a regression fixture before changing rules. |
| Valid brief but contract validator fails or reports differ | Fix agent instructions only if the agent bypassed the extractor; otherwise fix the output renderer / contract. The two-layer framework remains fixed. |
| Valid brief and report framework but targeting classification is wrong | Fix the matcher or platform registry with verified platform evidence. |
| `environment` | Repair adapter availability, source access, credentials, or temporary-directory cleanup. Do not classify this as a targeting regression. |

## Private manual canaries

The supplied Fleetio, EMRAM Express, Youturn Health, and ClearDent artifacts are intentionally not part of the equality corpus because they contain different business facts. Run them manually through the same adapter only when authorized. Review each against its own approved normalized fact sheet and record a redacted diagnosis with case ID, field-level counts, contract-validator errors, and remediation owner. Never save their source text, normalized brief, report, source URL, or transcript in this repository.
