# Required Response Standard

Status: source-of-truth
Last reviewed: 2026-06-26

Use this standard for every non-technical feasibility readout. Deliver the complete result in the response window; do not create, save, attach, or link a Markdown report file. Create only a temporary, source-backed campaign brief outside the repository, run preflight, then run the feasibility report.

Never create campaigns, upload audiences, mutate ad accounts, spend budget, or invent targeting fields.

Use exactly this two-layer structure. Do not compress, omit, merge, or replace it with a generic summary. The executive brief should stay decision-first; the appendix should carry the complete evidence, keyword clusters, raw inputs, platform inventory, and verification detail.

## Executive Brief

Use these subsections in this order.

### Top Opportunities

- Give the strongest three to five planning implications in plain language.
- Lead with channel fit, first-party/account targeting unlocks, search/custom-segment demand, and major experimental-channel caveats where source-backed.
- Keep this concise. Do not include the full field inventory here.

### Channel Readout

Group every relevant platform as `Conditional best fit`, `Strong secondary`, `Experimental or situational`, or `Low fit`.

### Best Campaign Concepts

- Provide source-backed campaign motions that a PMM or demand-gen partner could discuss next.
- Examples include account/customer activation, persona campaigns, search/custom-segment tests, retargeting sequences, and suppression-safe launch paths.
- Do not invent job titles, geographies, account lists, budget, conversion events, or targeting fields.

### Missing Inputs That Would Improve Targeting

Use this table:

| Missing input | Why it matters | Affected platforms | Decision blocked |
| --- | --- | --- | --- |

### Important Caveat

When account credentials are unavailable, state: `Registry-backed only — not account-confirmed.`

Also flag account-side checks that remain required before campaign build: dynamic picklists; authenticated/API field availability; campaign-type and locale constraints; audience-size/minimum-reach checks; policy constraints; first-party eligibility; and suppression logic.

## Appendix: Targeting Evidence and Platform Detail

Use these subsections in this order.

### Source Inputs

- State the product, market, locale, campaign goal, and every source-backed targeting or messaging input extracted from the source.
- Treat absent values as missing. If a persona narrative implies a likely title, label it `Working hypothesis`, not `Source-backed`.

### Keyword Cluster Guidance

Provide a practical overview of how to use the extracted clusters. Use source-backed terms only.

Expected cluster families:

- `First-party / account motion`: account lists, company names, customer/contact lists, visitors, retargeting audiences, engagement audiences, lookalike seeds, suppression lists.
- `Search / category demand`: keywords, intent signals, and technographics.
- `Contextual / audience signals`: topics, placements, communities, industries, and interests.
- `Pain / problem`: pains and objections.
- `Trigger / initiative`: triggers.
- `Gain / outcome`: gains.
- `Exclusions / launch safety`: exclusions, negative keywords, and suppression lists.

### Concrete Keyword and Audience Map

Provide actual source-backed clusters:

| Cluster | Exact terms | Allowed use | Suitable platforms | Verification needed |
| --- | --- | --- | --- | --- |

Allowed use is exactly one of: `Search keyword`, `Custom segment`, `Contextual/content test`, or `Creative, landing page, or sales follow-up only`.

Then include these subsections:

- `Use Directly`: exact targeting fields and source-backed values.
- `Use as Proxies or Test Sets`: keywords, contextual signals, interests, communities, and modeled audiences. Label every one as a test or reach proxy, not proof of buyer reach.
- `Keep in Messaging`: pains, gains, objections, and triggers for creative, landing pages, webinar content, nurture, and sales follow-up.

Never present pains, gains, objections, or triggers as targeting keywords unless an explicitly verified platform field supports them.

### Docs-Backed Value Evidence

When docs-backed platform-value catalogs are loaded, provide a table that ties source input terms to official-doc-backed fields and values/categories:

| Platform | Source input terms | Docs-backed field | Official values/categories | Official source | Verification needed |
| --- | --- | --- | --- | --- | --- |

Treat this section as evidence only. It supports the inferred ties between source terms and official platform categories, but it does not prove account-specific availability, full dynamic picklists, or campaign eligibility.

### Platform Field Inventory

For every relevant platform, provide a complete table:

| Platform | Available targeting field | Type | Source input available? | Source-backed value or missing input | Confidence | Manual verification needed |
| --- | --- | --- | --- | --- | --- | --- |

Evaluate every relevant field even when source inputs are absent: geography; company names/account lists; industry; company size; job title; job function; seniority; skills; search keywords/intent; contextual placements/topics/communities; customer/contact/account lists; website visitors/retargeting/engagement audiences; lookalike/similar-audience seeds; exclusions/suppression/negative keywords; and devices/demographics/education/life events where relevant.

Use only these field types: `Direct targeting field`, `Proxy or contextual test field`, `First-party audience field`, and `Not targetable`.

For a missing source value, write: `Input missing — provide [specific input].`

### Platform Detail

For every evaluated platform, include channel group, confidence, channel type, exact matches, proxy or substitute fields, unavailable dimensions, caveats, official source URL, source-check date, and authentication status.

### Cross-Platform Gaps

List source dimensions that remain unavailable or weak across platforms and any missing activation inputs that materially change planning.

### Manual Verification Required

List every required platform-side check. Include dynamic picklists; authenticated/API field availability; campaign-type and locale constraints; audience-size/minimum-reach checks; policy constraints; first-party eligibility; suppression logic; and negative-keyword treatment.

Keep the result in plain language suitable for a non-technical PMM gut check. Keep temporary inputs outside the standalone repository and do not save private source material unless explicitly asked.
