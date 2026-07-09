# Platform Freshness And Read-Only Connector Policy

Status: source-of-truth
Last reviewed: 2026-07-04

## Decision

The MVP uses a versioned platform registry as its default evidence source. It does not make account API calls during every user conversation and never creates, changes, or uploads anything to an advertising platform.

This is deliberate: public documentation availability does not prove account-specific targeting eligibility, and automatic authenticated checks add credential, rate-limit, policy, and tenant-specific failure modes to a non-technical conversation flow.

If live connectors are not configured, are missing credentials, are unavailable, or are not implemented for a platform, the agent must default to the committed platform registry as the last-known attribute set for that platform. A missing live check should never produce an empty field set, block report generation, or remove a platform's known targeting attributes from the output. The correct caveat is `Registry-backed only — not account-confirmed.`

## First Agent-Host Run

Before the first pilot conversation in a newly shared project copy, the hosting agent should run:

```bash
npm run freshness
npm run refresh -- --dry-run
```

`freshness` evaluates the committed source-check dates against each platform's stated cadence. `refresh -- --dry-run` performs public official-source availability checks only and prints a transient result; it does not alter the registry, use credentials, or block a source-analysis conversation if a website is unavailable.

If the public check cannot run, the agent proceeds with the report's existing `Registry-backed only — not account-confirmed.` caveat. A failed public URL check is an environment or documentation-access signal, not evidence that a targeting field disappeared.

## Cadence

| Evidence | Cadence | Owner | Effect |
|---|---:|---|---|
| Registry date assessment | Every new agent host and before a pilot batch | Agent host | Warn when the committed registry is stale; never changes recommendations automatically. |
| Public official-source check | First host run, then monthly | Maintainer or optional CI | Detects source availability changes; requires human registry review. |
| Registry update | When a source check or release review finds a material change | Maintainer + paid-media SME | Update facts, sources, tests, and `sourceCheckedAt` together. |
| Account-specific API check | Before campaign build or when an exact dynamic field matters | Authorized account owner | Confirms only the necessary account, campaign type, locale, and policy conditions. |

## Read-Only Connector Order

1. **Google Ads / YouTube:** use read-only criteria and geographic metadata checks first. Google documents targeting at campaign and ad-group levels, with some criteria limited by campaign type and targeting mode. [Google Ads targeting overview](https://developers.google.com/google-ads/api/docs/targeting/overview)
2. **Microsoft Advertising:** confirm authorized account access first, then add a field-level profile-data read before claiming account-confirmed company, industry, or job-function profile criteria. [Microsoft ProfileCriterion reference](https://learn.microsoft.com/en-us/advertising/campaign-management-service/profilecriterion?view=bingads-13)
3. **LinkedIn Ads:** query available targeting facets and entities only after Marketing API access is approved. LinkedIn exposes targeting facets through its Marketing API, but availability remains permission- and account-dependent. [LinkedIn Ad Targeting API](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/advertising-targeting/ads-targeting?view=li-lms-2025-02)
4. Add Meta, DV360, Reddit, X, and TikTok only when a real pilot requires a specific account-side question that the registry cannot answer.

Each connector must be read-only, use scoped environment credentials, return structured availability evidence without raw account data, set a timeout, and fall back to registry-backed output. Do not scrape logged-in campaign-builder interfaces.

Current implementation:

- `npm run check-fields -- --platform google-ads-youtube` runs a read-only Google Ads API field-metadata probe when credentials exist.
- `npm run check-fields -- --platform linkedin-ads` runs a read-only LinkedIn `adTargetingFacets` probe when credentials exist.
- `npm run check-fields -- --platform microsoft-ads` runs a Microsoft Advertising authenticated account probe; field-level profile criteria are still registry-backed.
- `npm run report -- <brief.md> --with-field-checks` includes connector evidence in the report where checks were explicitly run.
- `npm run refresh-values` previews publishable platform-value catalog templates. It does not pull live values until a platform-specific value adapter is implemented and tested.

## What Is Not Automated

- No account creation, campaign creation, audience upload, budget change, or spend.
- No credential prompts to a non-technical tester.
- No automatic registry rewrite from a live API response.
- No claim that a public source check is an account confirmation.
