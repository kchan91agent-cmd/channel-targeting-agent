# Source Ingestion

Status: working
Last reviewed: 2026-06-22

## Supported inputs

The project converts these sources to temporary readable text before provider extraction:

- local `.txt`, `.md`, `.html`, `.docx`, `.pptx`, and text-based `.pdf` files
- public HTTPS text, HTML, DOCX, PPTX, and PDF URLs

Run `npm ci` before source ingestion. The committed lockfile pins the conversion libraries used in every supported environment.

The ingestion layer has a 15 MB limit and validates the file type before conversion. It does not write converted text into the repository.

## Explicit boundaries

- Scanned/image-only PDFs fail as `SOURCE_UNREADABLE`; OCR is not enabled.
- Private Google Docs and Drive links fail safely. Export or attach a readable file instead.
- Password-protected, inaccessible, unsupported, or oversized sources fail rather than falling back to partial extraction.
- Source conversion is local. Provider-account retention and telemetry begin only when extracted text is passed to a provider adapter.
