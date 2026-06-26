# Analyze a Source

Status: working
Last reviewed: 2026-06-22

## One command

Use one explicit provider and exactly one source input:

```bash
npm run analyze-source -- --provider codex --file /secure/path/launch-deck.pptx
npm run analyze-source -- --provider claude --url https://example.com/public-brief
```

The command performs local ingestion, writes only temporary readable text and a normalized brief outside the repository, invokes the selected provider, validates the fixed report contract, prints the two-layer report, and removes temporary artifacts.

Add `--diagnose` to append a redacted JSON diagnosis. It includes provider, source type, failure class, remediation owner, and contract errors—never source content, source path, normalized values, model response, or report text beyond the normal report output.

## Input boundaries

- Require `--provider codex` or `--provider claude`; automatic selection is intentionally unsupported.
- Use either `--file` or `--url`, never both.
- URLs must be public HTTPS sources. Export or attach private Google Drive and Google Docs material as files.
- Run `npm ci` before first use and `npm run preflight` before a pilot.
