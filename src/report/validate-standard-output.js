import {
  KEYWORD_CLUSTER_TABLE_HEADER,
  MISSING_INPUTS_TABLE_HEADER,
  PLATFORM_FIELD_TABLE_HEADER,
  REQUIRED_APPENDIX_HEADINGS,
  REQUIRED_EXECUTIVE_BRIEF_HEADINGS,
  REQUIRED_FIELDS_PER_PLATFORM,
  REQUIRED_FIELD_TYPES,
  REQUIRED_SECTION_HEADINGS,
  REQUIRED_TARGETING_MAP_HEADINGS
} from "./output-contract.js";

function countOccurrences(text, value) {
  return text.split(value).length - 1;
}

function topLevelHeadings(report) {
  return report.match(/^## [^\n]+$/gm) ?? [];
}

function orderedHeadings(report, headings) {
  return headings.every((heading, index) => {
    const current = report.indexOf(heading);
    const previous = index === 0 ? -1 : report.indexOf(headings[index - 1]);
    return current >= 0 && current > previous;
  });
}

function platformRows(report, platformName) {
  return report
    .split("\n")
    .filter((line) => line.startsWith(`| ${platformName} |`));
}

function fieldTypeFromRow(row) {
  return row.split("|").map((cell) => cell.trim())[3];
}

export function validateStandardOutput(report, platforms) {
  const errors = [];
  const headings = topLevelHeadings(report);

  if (headings.length !== REQUIRED_SECTION_HEADINGS.length || !headings.every((heading, index) => heading === REQUIRED_SECTION_HEADINGS[index])) {
    errors.push("Top-level sections must contain Executive Brief and Appendix headings exactly once and in order.");
  }

  for (const heading of REQUIRED_SECTION_HEADINGS) {
    if (countOccurrences(report, heading) !== 1) errors.push(`Required section is missing or duplicated: ${heading}`);
  }

  if (!orderedHeadings(report, REQUIRED_EXECUTIVE_BRIEF_HEADINGS)) {
    errors.push("Executive Brief subsections must be present and in the required order.");
  }
  for (const heading of REQUIRED_EXECUTIVE_BRIEF_HEADINGS) {
    if (countOccurrences(report, heading) !== 1) errors.push(`Required executive subsection is missing or duplicated: ${heading}`);
  }

  if (!orderedHeadings(report, REQUIRED_APPENDIX_HEADINGS)) {
    errors.push("Appendix subsections must be present and in the required order.");
  }
  for (const heading of REQUIRED_APPENDIX_HEADINGS) {
    if (countOccurrences(report, heading) !== 1) errors.push(`Required appendix subsection is missing or duplicated: ${heading}`);
  }

  for (const heading of REQUIRED_TARGETING_MAP_HEADINGS) {
    if (countOccurrences(report, heading) !== 1) errors.push(`Required targeting-map subsection is missing or duplicated: ${heading}`);
  }

  if (countOccurrences(report, PLATFORM_FIELD_TABLE_HEADER) !== platforms.length) {
    errors.push("Every evaluated platform must include the standard targeting-field table.");
  }

  if (countOccurrences(report, KEYWORD_CLUSTER_TABLE_HEADER) !== 1) {
    errors.push("The appendix must include the standard keyword and audience cluster table.");
  }

  if (countOccurrences(report, MISSING_INPUTS_TABLE_HEADER) !== 1) {
    errors.push("The Executive Brief missing-inputs section must include its standard table.");
  }

  for (const platform of platforms) {
    const rows = platformRows(report, platform.name);
    if (rows.length !== REQUIRED_FIELDS_PER_PLATFORM) {
      errors.push(`${platform.name} must include ${REQUIRED_FIELDS_PER_PLATFORM} standard targeting-field rows; found ${rows.length}.`);
    }
    for (const row of rows) {
      const type = fieldTypeFromRow(row);
      if (!REQUIRED_FIELD_TYPES.has(type)) errors.push(`${platform.name} uses an unsupported targeting field type: ${type || "missing"}.`);
    }
    if (countOccurrences(report, `#### ${platform.name}`) < 2) {
      errors.push(`${platform.name} must appear in both the platform field inventory and platform detail.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
