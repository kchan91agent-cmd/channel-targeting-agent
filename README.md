# Channel Targeting Agent

Status: working
Last reviewed: 2026-07-04

Channel Targeting Agent helps PMMs translate broad ICP, persona, and campaign strategy into targeting options that actually exist inside advertising platforms.

It does not launch campaigns. It produces a reviewable strategy-to-targeting map with confidence, substitutes, unavailable dimensions, locale caveats, and source freshness.

The MVP is agent-first. It is meant to run from Codex, Claude Code, Cursor, or a local terminal, not from a web UI.

This repository is standalone. It does not require parent workspace context, private notes, ad account credentials, or customer data for the default pilot workflow.

## Staying Current

The GitHub repository is the source of truth for this project. Before each new pilot, test run, or Codex/App Studio project run, the agent host should sync or pull the latest `main` branch from GitHub.

Do not assume a project created from the GitHub link automatically receives future repository updates. If the environment cannot sync from GitHub, create a fresh project from the repo link before running the test.

## Why This Exists

PMM strategy is often intentionally broad:

- persona
- ICP
- pain
- gain
- buying trigger
- geography
- industry
- job title

Campaign builders are not broad. Platforms expose constrained fields, picklists, APIs, and policy-dependent options. This project helps bridge that gap before teams waste time trying to activate targeting that cannot be built.

## Platforms In V1

- LinkedIn Ads
- Meta Ads: Facebook / Instagram
- Google Ads / YouTube
- Google Display & Video 360
- Microsoft Advertising
- Reddit Ads
- X Ads
- TikTok Ads

Amazon DSP, Demandbase, and 6sense are intentionally excluded from this version.

## Locale Defaults

The default planning lens is B2B software advertising in:

- primary: United States, Canada
- secondary: United Kingdom, European Union priority markets, Australia, India

Use the `locale` and `geographies` input fields to narrow a recommendation.

## Start Here: Give An Agent Your Source

You do not need to prepare a campaign brief, know advertising-platform fields, or run terminal commands.

1. Open this project in Codex, Claude Code, Cursor, or another supported agent environment.
2. Attach or link a readable source: a launch deck, messaging document, campaign brief, product page, or pasted notes.
3. Send this request:

```text
Use the standalone Channel Targeting Agent to assess the supplied source.

Run preflight, then use `npm run analyze-source` with an explicit provider and the supplied source. The command creates the temporary, source-backed brief outside the repository and runs the feasibility report.

Deliver the complete result directly in this response window for a non-technical user to gut-check. Do not create, save, attach, or link a Markdown report file. Use the exact two-layer response structure in docs/output-standard.md: concise Executive Brief first, then Appendix: Targeting Evidence and Platform Detail. Do not create campaigns, upload audiences, mutate ad accounts, spend budget, or invent targeting fields.
```

The agent extracts only facts supported by your source, creates a temporary internal brief, runs the report, and tells you which information is missing. You should not need to fill in a form unless you want to add detail after the first report.

For a standard local run, install dependencies once with `npm ci`, then use one provider and source:

```bash
npm run analyze-source -- --provider codex --file /secure/path/launch-deck.pptx
```

Use `--provider claude` in an authenticated Claude Code environment, or `--url https://...` for a public HTTPS source. Add `--diagnose` for redacted run metadata. See `docs/analyze-source.md` and `docs/universal-adapter-contract.md`.

Supported sources include readable links and attachments, slides, documents, PDFs, product pages, and pasted notes. If the agent cannot read a supplied source, it must ask for accessible text or a downloadable file rather than guess from partial access.

## Runtime Setup (One-Time)

The agent environment needs Node.js 20 or newer. Use the current Node LTS when setting up a new environment; download it from the official [Node.js download page](https://nodejs.org/en/download), reopen the terminal, and confirm:

```bash
node --version
npm --version
```

Run `npm ci` before the first source-analysis run. Before a pilot, an agent should run the applicable preflight check:

```bash
# macOS / Linux
sh scripts/preflight.sh

# PowerShell (does not change your persistent execution policy)
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```

Full source ingestion and provider extraction require `npm ci`. Without npm, only preinstalled dependencies and advanced structured-brief report commands can run directly.

### Agent Host Troubleshooting

These are setup issues for the agent host, not tasks for a non-technical pilot tester.

- If `node` or `npm` is missing, install Node.js 20+ or use the Node runtime bundled with the agent environment. Confirm both commands with `node --version` and `npm --version`.
- If `npm` is available but scripts fail with `node: command not found`, Node is not on the shell `PATH`. Add the directory containing the Node binary to `PATH`, then rerun the script. In Codex Desktop on macOS, an agent host can usually use:

  ```bash
  PATH=/Applications/Codex.app/Contents/Resources/cua_node/bin:$PATH npm test
  ```

- Project folders with spaces, such as `Channel Targeting Agent`, are supported. If source-extraction tests fail only in a path with spaces, check for URL-encoded paths such as `%20` in the error output.
- `npm run refresh -- --dry-run` checks public official documentation URLs and requires outbound network access. A `fetch failed` result is usually an environment or network-access issue first, not proof that platform sources are stale.
- Missing ad-platform credentials are expected in the default pilot. Reports are registry-backed only unless explicitly authorized read-only connector checks are configured and run.

## Verify Output Standardization

Run the format-invariance and targeting-variance regression suite before sharing the agent for external targeting-quality review:

```bash
npm run test:output-standard
```

See `docs/output-standardization-test-plan.md`. The suite keeps the two-layer report framework fixed across messaging briefs, GTM plans, campaign plans, and strategy changes, so reviewer feedback can focus on targeting usefulness rather than output structure.

## Shareable Project Check

Before sharing this repository outside its current workspace, run:

```bash
npm run check:portability
```

See `docs/portability-and-isolation.md` for the durable isolation contract and release checklist.

## Run A Match Or Report

```bash
npm run match -- examples/b2b-saas-generic.json
```

Print the full PMM-readable response to the terminal:

```bash
npm run report -- examples/b2b-saas-generic.md
```

For a non-technical user, the agent must return this output in the response window using `docs/output-standard.md`; it must not save or attach a report file unless explicitly asked.

## Refresh Source Checks

The refresh command checks official source URLs and writes a source-status snapshot. It does not authenticate into ad accounts or mutate platform data.

```bash
npm run refresh
```

For a non-writing check:

```bash
npm run refresh -- --dry-run
```

The included GitHub Actions workflow runs tests and a source check on the first day of every month, then uploads the generated snapshot as a workflow artifact.

## Platform Value Catalogs

The project includes publishable platform-value templates in `data/platform-values/`. These are for safe field values such as job titles, industries, interests, communities, keywords, and geographies that can help the agent recommend the closest selectable platform values.

Do not publish account-owned values such as custom audiences, matched audiences, remarketing lists, customer lists, audience sizes, reach estimates, account IDs, or raw API responses.

Preview or refresh the safe templates:

```bash
npm run refresh-values
npm run refresh-values -- --write-templates
```

See `docs/platform-value-catalog.md` for credential setup and the publish-safety boundary.

## Third-Party Pilot

For an external PMM, demand generation, or growth team testing this in their own Codex or Claude Code environment, use `docs/third-party-pilot.md`.

For a non-technical tester, share `docs/pilot-welcome-kit.md`.

The recommended pilot loop is:

1. Clone or copy only this project folder.
2. Give the agent a readable source and the request from “Start Here.”
3. Let the agent run preflight and create a temporary supported brief.
4. Review the resulting report for actionability, targeting accuracy, confidence calibration, missing-input quality, and SME usefulness.

The command-line input format below is for agent implementation and advanced users; it is not required for normal use.

## API Connections

See `docs/api-connections.md` for per-platform setup notes, required environment variables, and recommended connector build order.

Check field availability for a platform. Google Ads / YouTube and LinkedIn Ads have read-only field/facet probes; Microsoft Advertising has an authenticated account probe. Other platforms return registry fallback fields until a live adapter is added:

```bash
npm run check-fields -- --platform google-ads-youtube
```

To include read-only connector evidence in a report:

```bash
npm run report -- examples/b2b-saas-generic.md --with-field-checks
```

Unconfirmed fields remain registry-backed. The tool must still not create campaigns, upload audiences, mutate ad accounts, or spend budget.

## Input Shape

```json
{
  "product": "B2B workflow automation platform",
  "market": "Mid-market SaaS operations teams",
  "locale": "GB",
  "geographies": ["United Kingdom", "Ireland"],
  "industries": ["Software", "Professional services"],
  "companySizes": ["51-200", "201-500"],
  "jobTitles": ["Revenue Operations Manager", "Marketing Operations Director"],
  "jobFunctions": ["Marketing", "Sales", "Operations"],
  "seniorities": ["Manager", "Director"],
  "pains": ["manual handoffs", "slow lead follow-up"],
  "triggers": ["CRM migration", "pipeline conversion pressure"],
  "campaignGoal": "Trial demand",
  "preferredChannels": ["linkedin-ads", "microsoft-ads", "google-ads-youtube"]
}
```

## Output Shape

The matcher returns:

- recommended platforms
- exact available targeting fields
- substitutes when exact targeting is unavailable
- dimensions that are not directly targetable
- locale caveats
- manual verification notes
- source timestamps

## Human Review

Human review is required before:

- uploading customer or account lists
- launching paid media
- using sensitive targeting
- making customer-facing claims
- treating registry-backed fields as exact authenticated availability

## Project Layout

```text
AGENTS.md                Instructions for Codex, Claude Code, and other agents
data/platforms/          Platform capability registry
data/snapshots/          Refresh outputs
docs/sources.md          Source and refresh policy
docs/third-party-pilot.md External pilot setup and scorecard
docs/portability-and-isolation.md Shareable-project isolation and release contract
docs/workflow.md         Agent workflow and prompt examples
docs/output-standardization-test-plan.md Output-framework regression protocol
examples/                Neutral sample PMM briefs and JSON inputs
examples/outputs/        Sample Markdown reports
src/connectors/          Live source-check and future API adapters
src/matcher/             Strategy-to-targeting logic
src/report/              Markdown report rendering
src/schemas/             Input/output schema contracts
test/                    Node test suite
```

## Caveats

Exact picklists change. Some are dynamic, locale-specific, account-specific, or only visible inside authenticated campaign builders. The project favors official docs, API metadata, and explicit caveats over pretending every field is knowable from public pages.
