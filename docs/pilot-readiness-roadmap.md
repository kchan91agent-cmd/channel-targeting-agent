# Pilot Readiness Roadmap

Status: working
Last reviewed: 2026-06-22

1. Provider-backed normalized-brief extraction — complete.
2. Portable local source ingestion — complete.
3. One standard source-to-report command — complete.
4. Cross-environment acceptance and feedback loop — Codex portion complete on 2026-06-22: the sanitized six-artifact corpus passed three times (18 live runs) with identical normalized facts and a validator-compliant fixed report. Claude Code acceptance remains deferred; run its same live suite before calling this cross-provider step fully complete.
5. External pilot release documentation and scorecard — complete. The release guide now separates the tester's conversation-only flow from agent-host setup, supplies a no-Terminal tester prompt, and defines redacted scorecard, ownership, and promotion rules.
6. Durable isolation and portability guardrails — complete. `docs/portability-and-isolation.md` is the durable release contract; `npm run check:portability` verifies private-artifact ignores, reproducible install metadata, Node requirement, and absence of known personal-workspace references.
7. Platform freshness and live-attribute evaluation — complete. `npm run freshness` provides a deterministic cadence assessment; first-host public source checks are advisory and read-only; the documented connector order is Google Ads, Microsoft Advertising, then LinkedIn, with account verification deferred until explicit authorized credentials are available.
