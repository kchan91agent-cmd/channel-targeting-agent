# API Connections

Status: working
Last reviewed: 2026-07-04

This project now focuses only on public social and paid ad platforms. It excludes ABM vendors such as Demandbase and 6sense until there is a customer account, vendor API access, or a clean export path.

## Connection Tiers

| Tier | Platforms | What we can realistically pull |
|---|---|---|
| Strong API path | Google Ads, DV360, Microsoft Advertising | Targeting criteria, targeting options, profile criteria, location/device/audience metadata, and account-specific availability where credentials allow it. |
| Permissioned API path | LinkedIn Ads, Meta Ads, Reddit Ads, X Ads, TikTok Ads | Some targeting metadata and search/discovery endpoints, but exact availability may depend on app review, account access, locale, policy, and campaign type. |
| Not in scope now | Demandbase, 6sense | Vendor-gated ABM fields are tenant/package/integration dependent. |

## Local Setup

1. Copy `.env.example` to `.env`.
2. Add only the credentials for the platform you are building first.
3. Run `npm run refresh -- --dry-run` to verify official source URL checks.
4. Run `npm run check-fields -- --platform <platform-id>` to test the read-only connector or registry fallback.
5. Run `npm run report -- <brief.md> --with-field-checks` only when you want the report to include authenticated read-only evidence.
6. Keep connectors read-only until strategy matching is proven.

If a user does not configure live credentials, the connector layer must use the committed platform registry as the last-known attribute set. This is the normal default path for public pilots and should still return every known field for the platform with the `Registry-backed only — not account-confirmed.` caveat.

For publishable field-value snapshots, use `docs/platform-value-catalog.md`. Field-value snapshots must be sanitized before commit and must exclude account-owned audiences, reach, audience size, account IDs, and raw API responses.

## Implemented Connector Status

| Platform | Status | What it confirms | What it does not do |
|---|---|---|---|
| Google Ads / YouTube | Implemented read-only metadata probe | Uses OAuth + Google Ads API field metadata to confirm mapped targeting field families where available. | Does not create campaigns, upload audiences, or prove campaign-type reach. |
| LinkedIn Ads | Implemented read-only facet probe | Uses `adTargetingFacets` to confirm mapped targeting facets available to the token/app context. | Does not fetch every entity value or prove audience size. |
| Microsoft Advertising | Implemented authenticated account probe | Uses OAuth + GetUser to confirm the provided Microsoft Advertising access context. | Field-level LinkedIn profile criteria remain registry-backed until a profile-data read is added. |
| Meta, DV360, Reddit, X, TikTok | Registry fallback | Returns structured fallback fields and recoverable missing-auth / not-implemented errors. | Does not perform live account checks yet. |

## Platform Value Catalog Status

| Platform | Status | Commit-safe value families | Never publish |
|---|---|---|---|
| LinkedIn Ads | Template ready | job title, job function, seniority, skill, industry, company size, professional interest, geography | matched audiences, account IDs, reach, raw API responses |
| Meta Ads | Template ready | interests, behaviors, demographics, geography | custom audiences, lookalikes, account IDs, reach, raw API responses |
| Google Ads / YouTube | Template ready | geography, keywords, custom segment inputs, in-market, affinity, detailed demographics, device | Customer Match, remarketing lists, account IDs, reach, raw API responses |
| Microsoft Advertising | Template ready | geography, LinkedIn company/industry/job-function values, keywords | customer match, remarketing lists, account IDs, reach, raw API responses |
| Reddit Ads | Template ready | communities, interests, keywords, geography, device | custom audiences, account IDs, reach, raw API responses |

## Recommended Build Order

1. Google Ads / YouTube
2. Microsoft Advertising
3. LinkedIn Ads
4. Meta Ads
5. DV360
6. Reddit Ads
7. X Ads
8. TikTok Ads

This order balances B2B usefulness with API feasibility.

## Platform Setup Notes

### Google Ads / YouTube

What to set up:

- Google Ads manager or advertiser account.
- Google Cloud project.
- Google Ads API enabled.
- OAuth client credentials.
- Google Ads developer token.
- Refresh token for an authorized user.

Environment variables:

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_API_VERSION` optional; defaults to the connector's current version

Initial connector target:

- Pull Google Ads API field metadata and validate mapped targeting dimensions.
- Prioritize location, keyword, custom segment, in-market, affinity, and customer match capability checks.

Official docs:

- https://developers.google.com/google-ads/api/docs/get-started/introduction
- https://developers.google.com/google-ads/api/docs/oauth/overview
- https://developers.google.com/google-ads/api/docs/targeting/overview

### Display & Video 360

What to set up:

- Existing DV360 access.
- Google Cloud project.
- DV360 API enabled.
- OAuth or service-account-style credential flow appropriate for the organization.
- Partner or advertiser access.

Environment variables:

- `GOOGLE_APPLICATION_CREDENTIALS`
- `DV360_ADVERTISER_ID`
- `DV360_PARTNER_ID`

Initial connector target:

- Pull `targetingTypes.targetingOptions` metadata.
- Prioritize location, content category, keyword, device, and audience list capability checks.

Official docs:

- https://developers.google.com/display-video/api/guides/quickstart/overview
- https://developers.google.com/display-video/api/reference/rest/v4/targetingTypes.targetingOptions

### Microsoft Advertising

What to set up:

- Microsoft Advertising account.
- Developer token.
- Microsoft app registration / OAuth credentials.
- User consent for the accounts being checked.
- Customer ID and account ID.

Environment variables:

- `MICROSOFT_ADS_DEVELOPER_TOKEN`
- `MICROSOFT_ADS_CUSTOMER_ID`
- `MICROSOFT_ADS_ACCOUNT_ID`
- `MICROSOFT_ADS_CLIENT_ID`
- `MICROSOFT_ADS_CLIENT_SECRET`
- `MICROSOFT_ADS_REFRESH_TOKEN`
- `MICROSOFT_ADS_SCOPE` optional; defaults to Microsoft Advertising OAuth scope

Initial connector target:

- Confirm OAuth/developer-token account access first.
- Add a field-level profile-data read before claiming account-confirmed LinkedIn company, industry, or job-function availability.
- Prioritize LinkedIn company, industry, job function, location, keyword, and customer list checks.

Official docs:

- https://learn.microsoft.com/en-us/advertising/guides/get-started?view=bingads-13
- https://learn.microsoft.com/en-us/advertising/campaign-management-service/profilecriterion?view=bingads-13

### LinkedIn Ads

What to set up:

- LinkedIn Page.
- LinkedIn developer application.
- Advertising API product access.
- Access token with the required advertising permissions.
- Ad account mapped to the developer app in Development tier.
- Standard tier request later if the integration moves beyond internal testing.

Environment variables:

- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_AD_ACCOUNT_ID`
- `LINKEDIN_VERSION` optional; defaults to the connector's current Marketing API version

Initial connector target:

- Validate accessible ad accounts.
- Pull targeting facet metadata where permissions allow.
- Prioritize location, company, industry, company size, job title, job function, seniority, skills, and matched audiences.

Official docs:

- https://learn.microsoft.com/en-us/linkedin/marketing/quick-start
- https://business.linkedin.com/advertise/ads/targeting

### Meta Ads

What to set up:

- Meta developer app.
- Business portfolio / Business Manager access.
- Ad account access.
- Marketing API access token.
- App review if required by the permissions used.

Environment variables:

- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`

Initial connector target:

- Use Targeting Search API for interests, behaviors, demographics, and available targeting suggestions.
- Treat B2B title/employer style targeting as unverified unless the API confirms availability for the account and locale.

Official docs:

- https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-search/

### Reddit Ads

What to set up:

- Reddit Ads account.
- Reddit Ads API access.
- OAuth/access token.
- Ad account ID.

Environment variables:

- `REDDIT_ADS_ACCESS_TOKEN`
- `REDDIT_AD_ACCOUNT_ID`

Initial connector target:

- Pull available location, community, interest, keyword, and device targeting metadata.
- Treat Reddit as community/contextual strategy, not exact B2B persona targeting.

Official docs:

- https://ads-api.reddit.com/docs/v3

### X Ads

What to set up:

- X developer access.
- X Ads account access.
- Access token with Ads API permissions.
- Ad account ID.

Environment variables:

- `X_ADS_ACCESS_TOKEN`
- `X_AD_ACCOUNT_ID`

Initial connector target:

- Pull targeting criteria where available.
- Prioritize location, keyword, interest, follower-lookalike, and tailored audience checks.

Official docs:

- https://docs.x.com/x-ads-api/llms.txt

### TikTok Ads

What to set up:

- TikTok for Business developer app.
- Advertiser account access.
- Access token.
- Advertiser ID.

Environment variables:

- `TIKTOK_ACCESS_TOKEN`
- `TIKTOK_ADVERTISER_ID`

Initial connector target:

- Pull available location, interest, behavior, hashtag/content, and custom audience metadata.
- Treat TikTok as weak for precise enterprise B2B persona targeting unless API checks prove otherwise.

Official docs:

- https://business-api.tiktok.com/portal/docs

## Practical MVP Recommendation

Start with Google Ads and Microsoft Advertising because they have clearer setup paths and useful B2B targeting surfaces. Add LinkedIn next because it is the highest-value PMM targeting platform, but expect app access and permission work before exact field pulls are dependable.

Before implementing any connector, follow `docs/platform-freshness-policy.md`. All connectors remain read-only, scoped to the smallest required account question, and must fall back to the registry instead of blocking a non-technical pilot conversation.
