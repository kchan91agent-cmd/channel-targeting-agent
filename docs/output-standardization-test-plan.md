# Output-Framework Standardization Tests

Status: source-of-truth
Last reviewed: 2026-06-22

## Purpose

This suite protects the response framework, not the marketing judgment. It ensures that document architecture does not change the Channel Targeting Agent’s two-layer output contract: concise Executive Brief first, then Appendix: Targeting Evidence and Platform Detail.

Marketers can therefore assess targeting usefulness, evidence quality, and direct-versus-proxy judgment without receiving different report skeletons.

## Automated Coverage

Run:

```bash
npm run test:output-standard
```

The suite contains two controls:

1. **Format invariance:** a messaging brief, GTM plan, campaign plan, and executive memo express identical targeting facts. Each must parse to the same strategy and render byte-for-byte identical output.
2. **Targeting variance:** ABM, search-intent, first-party, persona-incomplete, and sparse strategies must render the same framework while changing only targeting-dependent content.

The contract validator rejects missing, duplicated, reordered, or renamed executive/appendix sections; missing keyword-cluster and platform field tables; changed table headers; unsupported field types; missing targeting-map subsections; and incomplete per-platform field inventories.

## Scope Boundary

The CLI works from the temporary structured brief that the agent creates after reading a supplied document. These tests verify that different structured source-document architectures normalize to the same standard output.

For a fully unstructured attachment or product page, the running agent must still extract source-backed facts into the temporary brief before invoking the CLI. That extraction behavior is evaluated separately from this report-structure regression suite.

## Post-Run Diagnosis

After every run, report one of these outcomes:

- **No agent change required:** all format-invariance and targeting-variance checks pass. The fixed output framework is safe to use as the basis for external targeting-quality review.
- **Agent change required:** state the failing fixture, expected and actual structure, and the responsible layer:
  - source-to-brief extraction, if equivalent source facts normalize differently;
  - output-contract instructions or renderer, if sections, tables, or labels change;
  - matcher or platform registry, if the framework is intact but targeting classifications are wrong.

Do not change the agent while evaluating the suite. Add the failing fixture as a regression case, then make a separate, scoped implementation change.
