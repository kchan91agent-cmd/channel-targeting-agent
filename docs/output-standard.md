# Required Response Standard

Status: source-of-truth
Last reviewed: 2026-06-21

Use this standard for every non-technical feasibility readout. Deliver the complete result in the response window; do not create, save, attach, or link a Markdown report file. Create only a temporary, source-backed campaign brief outside the repository, run preflight, then run the feasibility report.

Never create campaigns, upload audiences, mutate ad accounts, spend budget, or invent targeting fields.

Use exactly these sections. Do not compress, omit, merge, or replace them with a generic summary.

## 1. What the Source Says

- State the product, market, audience, campaign goal, industries, personas, keywords, pains, gains, objections, and triggers found in the source.
- Label each important item as `Source-backed`, `Working hypothesis`, or `Missing`.
- Flag material staleness, confidentiality, or evidence limitations.

## 2. Activation Readiness

- Give one verdict: `Ready`, `Partially ready`, or `Not ready`.
- State the minimum missing information needed before demand generation should plan spend.
- Do not omit available platform fields because the brief is incomplete.

## 3. Available Targeting Fields by Platform

For every relevant platform, provide a complete table:

| Platform | Available targeting field | Type | Source input available? | Source-backed value or missing input | Confidence | Manual verification needed |
| --- | --- | --- | --- | --- | --- |

Evaluate every relevant field even when source inputs are absent: geography; company names/account lists; industry; company size; job title; job function; seniority; skills; search keywords/intent; contextual placements/topics/communities; customer/contact/account lists; website visitors/retargeting/engagement audiences; lookalike/similar-audience seeds; exclusions/suppression/negative keywords; and devices/demographics/education/life events where relevant.

Use only these field types: `Direct targeting field`, `Proxy or contextual test field`, `First-party audience field`, and `Not targetable`.

For a missing source value, write: `Input missing — provide [specific input].`

## 4. Concrete Keyword and Audience Map

Provide actual source-backed clusters:

| Cluster | Exact terms | Allowed use | Suitable platforms | Verification needed |
| --- | --- | --- | --- | --- |

Allowed use is exactly one of: `Search keyword`, `Custom segment`, `Contextual/content test`, or `Creative, landing page, or sales follow-up only`.

Never present pains, gains, objections, or triggers as targeting keywords unless an explicitly verified platform field supports them.

## 5. Targeting Map

Use these subsections:

- `Use Directly`: exact targeting fields and source-backed values.
- `Use as Proxies or Test Sets`: keywords, contextual signals, interests, communities, and modeled audiences. Label every one as a test or reach proxy, not proof of buyer reach.
- `Keep in Messaging`: pains, gains, objections, and triggers for creative, landing pages, webinar content, nurture, and sales follow-up.

## 6. Channel Hypotheses

Group every relevant platform as `Conditional best fit`, `Strong secondary`, `Experimental or situational`, or `Low fit`.

For every platform, explain available supporting fields, its keyword/proxy role, why it belongs in the group, and what missing input or verification could move it up or down. Do not name a single best channel unless the evidence clearly supports it.

## 7. Manual Verification Required Before Any Campaign Build

List every required platform-side check: dynamic picklists; authenticated/API field availability; campaign-type and locale constraints; audience-size/minimum-reach checks; policy constraints; and first-party eligibility and suppression logic.

When account credentials are unavailable, state: `Registry-backed only — not account-confirmed.` Do not omit fields because authentication is unavailable.

## 8. Missing Inputs That Change the Plan

Use this table:

| Missing input | Why it matters | Affected platforms | Decision blocked |
| --- | --- | --- | --- |

## 9. Complete Platform Detail

For every evaluated platform, include exact matches, proxy or substitute fields, unavailable dimensions, caveats, official source URL, source-check date, and authentication status.

Keep the result in plain language suitable for a non-technical PMM gut check. Do not invent job titles, seniority, geography, account lists, budget, conversion events, or targeting fields. If a persona narrative implies a likely title, label it `Working hypothesis`, not `Source-backed`. Keep temporary inputs outside the standalone repository and do not save private source material unless explicitly asked.
