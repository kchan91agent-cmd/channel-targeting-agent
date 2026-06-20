# Contributing

Contributions should keep the project agent-friendly, transparent, and read-only.

## Development

```bash
npm test
npm run report -- examples/logistics-operations.md
```

## Guidelines

- Keep runtime dependencies minimal.
- Prefer official API documentation and platform help centers.
- Add source URLs and source dates when changing platform registry entries.
- Add tests for matcher behavior and connector fallback behavior.
- Do not add campaign creation or audience upload features to the MVP.
- Do not add scraped UI flows.
- Do not include private company strategy, customer lists, or ad account data in examples.

## Platform Registry Changes

When updating `data/platforms/*.json`, include:

- targeting dimension label
- input keys it maps from
- availability type
- match type
- confidence
- caveats when a field is dynamic, permissioned, or locale-specific

## Connector Changes

Connectors must be read-only and tolerate missing credentials. A missing token should return a recoverable error and registry fallback fields, not crash the whole workflow.
