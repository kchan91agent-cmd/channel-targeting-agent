export const REQUIRED_SECTION_HEADINGS = [
  "## Executive Brief",
  "## Appendix: Targeting Evidence and Platform Detail"
];

export const REQUIRED_EXECUTIVE_BRIEF_HEADINGS = [
  "### Top Opportunities",
  "### Channel Readout",
  "### Best Campaign Concepts",
  "### Missing Inputs That Would Improve Targeting",
  "### Important Caveat"
];

export const REQUIRED_APPENDIX_HEADINGS = [
  "### Source Inputs",
  "### Keyword Cluster Guidance",
  "### Concrete Keyword and Audience Map",
  "### Platform Field Inventory",
  "### Platform Detail",
  "### Cross-Platform Gaps"
];

export const REQUIRED_TARGETING_MAP_HEADINGS = [
  "#### Use Directly",
  "#### Use as Proxies or Test Sets",
  "#### Keep in Messaging"
];

export const REQUIRED_FIELD_TYPES = new Set([
  "Direct targeting field",
  "Proxy or contextual test field",
  "First-party audience field",
  "Not targetable"
]);

export const PLATFORM_FIELD_TABLE_HEADER = "| Platform | Available targeting field | Type | Source input available? | Source-backed value or missing input | Confidence | Manual verification needed |";
export const KEYWORD_CLUSTER_TABLE_HEADER = "| Cluster | Exact terms | Allowed use | Suitable platforms | Verification needed |";
export const MISSING_INPUTS_TABLE_HEADER = "| Missing input | Why it matters | Affected platforms | Decision blocked |";
export const REQUIRED_FIELDS_PER_PLATFORM = 15;
