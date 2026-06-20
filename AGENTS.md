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

```bash
npm test
npm run match -- examples/logistics-operations.json
npm run report -- examples/logistics-operations.md
npm run check-fields -- --platform google-ads-youtube
npm run refresh -- --dry-run
```

If `npm` is unavailable, run Node directly:

```bash
node --test
node src/report.js examples/logistics-operations.md
```

## Agent Workflow

1. Read the user brief.
2. Convert it to a JSON strategy input or a supported Markdown brief.
3. Run `npm run report -- <brief>`.
4. Review unsupported fields carefully.
5. Recommend campaign targeting only from exact or clearly labeled substitute fields.
6. Keep pains, gains, objections, and triggers primarily in message/creative strategy unless a platform exposes a real targeting proxy.

For third-party pilots, follow `docs/third-party-pilot.md`. Keep pilot briefs and reports local unless the user explicitly asks to commit or share them.

## Credential Handling

Use `.env.example` as a reference. Never commit real tokens. If credentials are missing, use registry-backed fallback behavior and say that live platform verification was not available.

## Output Standard

For PMMs, prefer Markdown reports over raw JSON. The report should make it obvious:

- what the PMM should do or verify next
- which direct targeting levers can be used if verified
- which proxy or contextual levers are test inputs, not proof of buyer reach
- which pains, gains, objections, and triggers should stay in copy, landing pages, and sales follow-up
- which missing inputs would materially change the plan
- how channels group by evidence quality without pretending the list is an absolute stack rank
- which platforms need manual or authenticated verification

The main report must be action-led. Lead with `Activation Actions`, `Targeting Map`, and `Missing Inputs That Change The Plan` before channel grouping, definitions, or raw platform detail. Do not bury exact fields, platform proxies, dynamic-picklist checks, first-party audience gaps, or measurement questions in the appendix.

`Activation Actions` should be written as operational checks, not generic advice:

- size the candidate audience in the strongest channel group before treating it as viable
- verify direct attributes available to target within each platform
- verify dynamic picklists or authenticated availability where fields are not static
- label proxy-heavy platforms as test paths for demand capture, contextual reach, or message learning unless audience sizing proves otherwise
- keep pains, gains, objections, and triggers primarily in copy, landing pages, and sales follow-up unless a platform exposes a confirmed targeting field; do not recommend broad keyword matching as the primary path for these inputs

`Targeting Map` should use these sections:

- `Use Directly`
- `Use As Proxies Or Test/Experiment Campaign Sets`
- `Keep Primarily In Messaging (Low Confidence in targeting for conversion)`

Prefer a PMM-readable activation readout over a raw platform-field dump. Long keyword, pain, trigger, interest, or community lists should be summarized as useful clusters in the main report and preserved in the appendix. Avoid generic PMM coaching unless it changes the activation decision.

`Keyword Cluster Guidance` must include a short overview explaining how to use the clusters. Product, category, trigger, and initiative terms may support search, custom-segment, or contextual tests when they map to real demand signals. Pain, gain, objection, and trigger language should usually shape copy, landing pages, and sales follow-up rather than targeting. Clusters are test-structure inputs, not proof of reach.

Also check whether the brief is missing common activation inputs beyond pains and triggers: first-party lists, retargeting audiences, engagement audiences, lookalike seeds, contextual placements/topics, devices, demographics/education/life events, and exclusions or suppression lists.
