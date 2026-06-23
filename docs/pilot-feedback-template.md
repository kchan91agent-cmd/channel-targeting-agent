# Channel Targeting Agent Pilot Feedback Packet

Status: working
Last reviewed: 2026-06-22

Return this packet with no private source material, normalized values, account lists, screenshots, model transcripts, or report copy unless the material is explicitly approved for sharing.

```json
{
  "provider": "codex|claude",
  "providerVersion": "observed version only",
  "sourceType": "txt|html|docx|pptx|pdf|public-url",
  "sourceArchitecture": "messaging-brief|gtm-plan|campaign-plan|executive-memo|slide-narrative|raw-prose|other",
  "runStatus": "passed|failed|inconclusive",
  "failureClass": "null|source-input|extraction-fidelity|output-framework|matcher-platform-registry|environment",
  "contractValid": true,
  "actionabilityScore": 1,
  "targetingAccuracyScore": 1,
  "confidenceCalibrationScore": 1,
  "missingInputQualityScore": 1,
  "smeUsefulnessScore": 1,
  "issues": ["redacted behavioral observation"],
  "requiredOwner": "null|source ingestion|source-to-brief extraction|agent instructions|output renderer / contract|matcher or platform registry|environment",
  "nextRunDecision": "promote|rerun-after-fix|stop"
}
```

Use scores from 1 to 5: 1 means unusable or unsafe, 3 means directionally useful but needs material correction, and 5 means a PMM and paid-media specialist can use it as a working starting point. A report should not be accepted for a pilot if the fixed contract is invalid, source facts are invented, or the diagnosis is not redacted. Choose `promote` only when the average score is at least 4, no score is below 3, and there is no unresolved high-risk targeting correction.
