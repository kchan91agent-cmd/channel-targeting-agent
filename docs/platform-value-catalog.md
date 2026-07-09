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

Each file starts as a safe template with empty `values` arrays. After local credentialed checks exist, the template can be populated with sanitized, reviewed values.

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

Preview a single platform:

```bash
npm run refresh-values -- --platform linkedin-ads
```

Write or refresh empty publishable templates:

```bash
npm run refresh-values -- --write-templates
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

`refresh-values` creates and validates publishable catalog templates. It does not yet pull live value lists from platform APIs. Add one value adapter at a time, starting with LinkedIn, and keep each adapter read-only, sanitized, and test-covered before committing generated values.
