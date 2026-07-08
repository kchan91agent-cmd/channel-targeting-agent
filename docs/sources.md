# Sources And Refresh Policy

Status: working
Last reviewed: 2026-06-13

## Source Rules

- Prefer official documentation, API references, and platform help centers.
- Treat authenticated UI-only picklists as unverified unless exported or checked through an official API.
- Store source timestamps with every platform registry entry.
- Use monthly automated source checks as the default fallback when live field checks are unavailable.

## Baseline Official Sources

| Platform | Baseline source | Notes |
|---|---|---|
| LinkedIn Ads | https://business.linkedin.com/advertise/ads/targeting | Public targeting overview; exact criteria should be checked through Campaign Manager or Marketing API access. |
| Meta Ads | https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-search/ | Targeting search API reference; many fields and policies are dynamic. |
| Google Ads / YouTube | https://developers.google.com/google-ads/api/docs/targeting/overview | API-supported targeting overview. |
| Display & Video 360 | https://developers.google.com/display-video/api/reference/rest/v4/targetingTypes.targetingOptions | Targeting options API reference. |
| Microsoft Advertising | https://learn.microsoft.com/en-us/advertising/campaign-management-service/profilecriterion?view=bingads-13 | Includes LinkedIn profile criterion types such as company, industry, and job function. |
| Reddit Ads | https://ads-api.reddit.com/docs/ | API documentation entrypoint; targeting details may require developer access. |
| X Ads | https://docs.x.com/x-ads-api/llms.txt | Current docs index; use targeting criteria endpoints where available. |
| TikTok Ads | https://business-api.tiktok.com/portal/docs | Business API documentation entrypoint; exact targeting availability varies by account and locale. |

## Refresh Cadence

| Platform group | Cadence | Reason |
|---|---:|---|
| LinkedIn, Meta, Reddit, TikTok, X | Monthly | Paid social targeting fields, policies, and UI behavior can change quickly. |
| Google Ads, DV360, Microsoft Advertising | Monthly or quarterly | Better documented APIs, but still subject to release and policy changes. |

## Live Check Policy

Live checks should be added in this order:

1. Public official source URL availability.
2. Official unauthenticated metadata endpoint, if available.
3. Official authenticated API endpoint using environment variables.
4. Manual export ingestion only if vendor-gated platforms are added later.

Do not scrape logged-in campaign-builder UIs in v1.
