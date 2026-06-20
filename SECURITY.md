# Security

## Credentials

Do not commit real API credentials, refresh tokens, access tokens, account IDs, customer lists, or audience exports.

Use `.env.example` as a template and keep real `.env` files local.

## Supported Data Handling

The MVP supports:

- public official source checks
- read-only targeting metadata checks
- local examples with fictional or neutral inputs
- registry-backed fallback fields

The MVP does not support:

- campaign creation
- audience uploads
- customer list ingestion
- spend activation
- scraping logged-in ad platform UIs

## Reporting Issues

If you find a credential leak or unsafe mutation path, remove the credential from the repository history if needed, rotate the affected token, and open an issue describing the affected platform and file path without reposting secrets.
