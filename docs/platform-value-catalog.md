# Platform Value Catalog

Status: working
Last reviewed: 2026-07-09

The platform value catalog is the publishable layer for selectable platform values: job titles, industries, interests, communities, keywords, geographies, and similar field values that help the agent recommend the closest available targeting choices.

It is separate from `data/platforms/*.json`:

- `data/platforms/*.json` says which field families exist.
- `data/platform-values/*.json` says which publishable values are available inside those field families.

## Safety Boundary

Commit only generic platform-visible values that can help another user choose close matches.

Do not commit:

- access tokens, refresh tokens, client secrets, developer tokens, or service-account files
- ad account IDs, advertiser IDs, customer IDs, user IDs, or business IDs
- custom audiences, matched audiences, tailored audiences, customer lists, remarketing lists, website visitor audiences, suppression lists, or lookalike seeds
- reach estimates, audience sizes, match rates, spend, campaigns, line items, or raw API responses
- private account names, customer names, account-list names, URLs, emails, or screenshots

The catalog utilities block account-owned audience fields and common secret/raw-response keys before writing publishable JSON.

## Files

```text
data/platform-values/
  google-ads-youtube.json
  linkedin-ads.json
  meta-ads.json
  microsoft-ads.json
  reddit-ads.json
```

Each file can be generated either as an empty safe template or as a docs-backed catalog populated with sanitized, official-source category values. Local credentialed checks can later add sanitized, reviewed live values without changing the publish-safety boundary.

## Docs-Backed Importer

The docs-backed importer creates source-defensible catalogs from curated official documentation manifests in `data/platform-value-sources/`. It does not use credentials and does not scrape pages at runtime. This makes the committed catalogs more transparent than the static registry because every generated value carries an official source URL, source label, checked date, confidence, and caveats.

Docs-backed catalogs are not account-specific and are not full dynamic picklists. They confirm field families and stable category-level values from official documentation. API credentials remain optional for a later live verification layer when exact account availability, typeahead values, locale differences, or policy gating matter.

Official sources used by the importer:

| Platform | Official source | Source type | Checked date | Confirms | Still requires API/account verification |
| --- | --- | --- | --- | --- | --- |
| LinkedIn Ads | [LinkedIn Ads targeting options](https://www.linkedin.com/help/lms/answer/a424655) | Official help documentation | 2026-07-09 | Location, company attributes, demographics, devices, education, job experience, interests, and traits categories | Exact typeahead values, account eligibility, locale restrictions, and campaign-type availability |
| Meta Ads | [Meta Marketing API Targeting Search](https://developers.facebook.com/docs/marketing-api/audiences/reference/targeting-search/) | Official API documentation | 2026-07-09 | Location, interest, behavior, and demographic search families | Exact dynamic values, policy-sensitive availability, and ad-account eligibility |
| Google Ads / YouTube | [Google Ads API targeting overview](https://developers.google.com/google-ads/api/docs/targeting/overview) | Official API documentation | 2026-07-09 | Location, keyword, custom segment, audience-family, demographic, life-event, and device targeting families | API metadata values, account eligibility, campaign subtype support, and policy restrictions |
| Microsoft Advertising | [Microsoft Advertising ProfileCriterion](https://learn.microsoft.com/en-us/advertising/campaign-management-service/profilecriterion?view=bingads-13) | Official API documentation | 2026-07-09 | LinkedIn company, industry, and job-function profile criteria | Profile identifiers, account eligibility, campaign-type support, and current selectable values |
| Reddit Ads | [Reddit Ads API docs](https://ads-api.reddit.com/docs/v3/) | Official API documentation | 2026-07-09 | Location, community, interest, keyword, and device targeting families | Exact dynamic values, account eligibility, locale availability, and policy gating |

## Local Credential Setup

Copy the example environment file and fill in only the platforms you want to check:

```bash
cp .env.example .env
```

Never commit `.env`. It is ignored by Git.

The project command entrypoints load `.env` automatically when it exists. Existing shell environment variables win over `.env` values, so you can override a local file for one run without editing it.

### LinkedIn Ads

Set:

```bash
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_AD_ACCOUNT_ID=
LINKEDIN_VERSION=
```

Use this first for B2B persona values such as job title, job function, seniority, skills, company size, company industry, and professional interests.

### Meta Ads

Set:

```bash
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
```

Use this for public-ish interest, behavior, demographic, and targeting-search values. Do not publish custom audiences or lookalikes.

### Google Ads / YouTube

Set:

```bash
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_API_VERSION=
```

Use this for geographies, keyword-related checks, custom segment inputs, in-market, affinity, detailed demographics, life events, and device targeting. Do not publish Customer Match, remarketing, or account-owned audience lists.

### Microsoft Advertising

Set:

```bash
MICROSOFT_ADS_DEVELOPER_TOKEN=
MICROSOFT_ADS_CUSTOMER_ID=
MICROSOFT_ADS_ACCOUNT_ID=
MICROSOFT_ADS_CLIENT_ID=
MICROSOFT_ADS_CLIENT_SECRET=
MICROSOFT_ADS_REFRESH_TOKEN=
MICROSOFT_ADS_SCOPE=
```

Use this for account access first, then LinkedIn profile criteria such as company, industry, and job function after field-level profile reads are implemented.

### Reddit Ads

Set:

```bash
REDDIT_ADS_ACCESS_TOKEN=
REDDIT_AD_ACCOUNT_ID=
```

Use this for community, interest, keyword, location, and device values. Treat Reddit as contextual/community fit, not exact B2B persona fit.

## Commands

Preview safe catalog templates:

```bash
npm run refresh-values
```

Preview docs-backed official-source catalogs:

```bash
npm run refresh-values -- --source official-docs
```

Preview a single platform:

```bash
npm run refresh-values -- --platform linkedin-ads
npm run refresh-values -- --source official-docs --platform linkedin-ads
```

Write or refresh empty publishable templates:

```bash
npm run refresh-values -- --write-templates
```

Write docs-backed publishable catalogs:

```bash
npm run refresh-values -- --source official-docs --write
```

Run existing read-only field-family checks:

```bash
npm run check-fields -- --platform linkedin-ads
npm run check-fields -- --platform google-ads-youtube
npm run check-fields -- --platform microsoft-ads
```

Before committing platform values:

```bash
git status --short
git check-ignore -v .env
npm test
```

## Current Limitation

`refresh-values` creates and validates publishable catalog templates or curated official-doc catalogs. It does not yet pull live value lists from platform APIs. Add one value adapter at a time, starting with LinkedIn, and keep each adapter read-only, sanitized, and test-covered before committing generated values.
