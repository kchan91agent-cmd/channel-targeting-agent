# Pilot Readiness Roadmap

Status: working
Last reviewed: 2026-07-09

1. Provider-backed normalized-brief extraction — complete.
2. Portable local source ingestion — complete.
3. One standard source-to-report command — complete.
4. Cross-environment acceptance and feedback loop — Codex portion complete on 2026-06-22: the sanitized six-artifact corpus passed three times (18 live runs) with identical normalized facts and a validator-compliant fixed report. Claude Code acceptance remains deferred; run its same live suite before calling this cross-provider step fully complete.
5. External pilot release documentation and scorecard — complete. The release guide now separates the tester's conversation-only flow from agent-host setup, supplies a no-Terminal tester prompt, and defines redacted scorecard, ownership, and promotion rules.
6. Durable isolation and portability guardrails — complete. `docs/portability-and-isolation.md` is the durable release contract; `npm run check:portability` verifies private-artifact ignores, reproducible install metadata, Node requirement, and absence of known personal-workspace references.
7. Platform freshness and live-attribute evaluation — complete. `npm run freshness` provides a deterministic cadence assessment; first-host public source checks are advisory and read-only; the documented connector order is Google Ads, Microsoft Advertising, then LinkedIn, with account verification deferred until explicit authorized credentials are available.

## Backlog: Non-API Executive Usefulness Improvements

These improvements are intentionally scoped to raise planning usefulness without live ad-platform connectors, account credentials, audience-size pulls, or campaign mutation.

1. Launch-readiness layer — add a concise readiness assessment for ICP clarity, persona clarity, first-party/list readiness, keyword/intent readiness, suppression readiness, measurement readiness, and source completeness.
2. Go / no-go recommendation — add a final executive call such as `Proceed`, `Proceed after verification`, `Do not launch paid yet`, or `Use only for message testing`.
3. Budget-aware channel guidance — use supplied budget or test range to recommend a realistic channel sequence, especially when the budget cannot support many simultaneous tests.
4. Channel role classification — label each recommended channel by job-to-be-done: persona reach, demand capture, retargeting, account expansion, message testing, category education, or broad amplification.
5. First-party/list readiness diagnosis — distinguish cold-audience plans from account-list, customer-list, visitor, retargeting, exclusion, and suppression-ready plans.
6. Campaign sequencing recommendation — summarize a practical phased path, such as persona test, search/custom-intent test, retargeting once traffic exists, and experimental expansion only after learning.
7. Risk register — flag over-targeting, proxy dependence, missing suppression, weak conversion definition, overly broad channel mix, missing budget, and source claims that need paid-media review.
8. Persona-to-message fit check — assess whether the source gives enough pain, trigger, objection, and outcome specificity to make paid targeting worth buying.

These are decision-support improvements. They should not weaken the current safety boundary: no campaign creation, no audience upload, no account mutation, no spend, no invented fields, and no customer-specific artifacts committed by default.
