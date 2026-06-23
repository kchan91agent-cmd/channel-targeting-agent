# API Connections

Status: working
Last reviewed: 2026-06-13

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
4. Add one connector at a time under `src/connectors/`.
5. Keep connectors read-only until strategy matching is proven.

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

Initial connector target:

- Pull criteria/resource metadata and validate available targeting dimensions.
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

Initial connector target:

- Pull profile criteria and available targeting types.
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

Initial connector target:

- Validate accessible ad accounts.
- Pull targeting criteria/facet metadata where permissions allow.
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
