export const REQUIRED_SECTION_HEADINGS = [
  "## 1. What the Source Says",
  "## 2. Activation Readiness",
  "## 3. Available Targeting Fields by Platform",
  "## 4. Concrete Keyword and Audience Map",
  "## 5. Targeting Map",
  "## 6. Channel Hypotheses",
  "## 7. Manual Verification Required Before Any Campaign Build",
  "## 8. Missing Inputs That Change the Plan",
  "## 9. Complete Platform Detail"
];

export const REQUIRED_TARGETING_MAP_HEADINGS = [
  "### Use Directly",
  "### Use as Proxies or Test Sets",
  "### Keep in Messaging"
];

export const REQUIRED_FIELD_TYPES = new Set([
  "Direct targeting field",
  "Proxy or contextual test field",
  "First-party audience field",
  "Not targetable"
]);

export const PLATFORM_FIELD_TABLE_HEADER = "| Platform | Available targeting field | Type | Source input available? | Source-backed value or missing input | Confidence | Manual verification needed |";
export const MISSING_INPUTS_TABLE_HEADER = "| Missing input | Why it matters | Affected platforms | Decision blocked |";
export const REQUIRED_FIELDS_PER_PLATFORM = 15;
