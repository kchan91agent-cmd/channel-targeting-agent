#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { canonicalizeStrategy, validateStrategyInput } from "./strategy-input.js";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function first(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
}

function list(text, patterns) {
  const value = first(text, patterns);
  if (!value) return undefined;
  return value.split(/\s*(?:,|;|\band\b)\s*/i).map((item) => item.trim()).filter(Boolean);
}

// This is a conservative, executable reference extractor for readable text. It intentionally
// extracts only explicit statements; a production LLM adapter may replace this command via
// CHANNEL_TARGETING_EXTRACTOR while retaining the same input/output contract.
export function extractStrategyFromText(source) {
  const text = source.replace(/\r/g, "").replace(/\s+/g, " ").trim();
  const strategy = {
    product: first(text, [
      /(?:product|offer|solution)\s+(?:is|:)\s*([^.!?;]+)/i,
      /(?:^|[.!?])\s*([^.!?;]+?)\s+is\s+(?:the\s+)?product\b/i,
      /(?:position|promote|introduce)\s+(?:the\s+)?([^.!?]+?)\s+(?:to|for)\s+(?:enterprise|commercial|b2b)/i
    ]),
    market: first(text, [
      /(?:market|audience)\s+(?:is|:)\s*([^.!?;]+)/i,
      /(?:^|[.!?])\s*([^.!?;]+?)\s+is\s+(?:the\s+)?market\b/i,
      /(?:for|into)\s+([^.!?]+?)\s+(?:teams|leaders|companies|organizations)(?:[.!?]|\s+across\b)/i
    ]),
    locale: first(text, [
      /(?:locale|market locale)\s*(?:is|:)\s*([^.!?;]+)/i,
      /\bfor\s+(?:a\s+|the\s+)?([A-Z]{2})\s+(?:launch|motion)\b/i
    ]),
    geographies: list(text, [
      /(?:geographies|markets)(?:\s+(?:are|include)\s+|\s*:\s*)([^.!?;]+)/i,
      /\bacross\s+([^.!?;]+)/i
    ]),
    industries: list(text, [/(?:industries|verticals)(?:\s+(?:are|include)\s+|\s*:\s*)([^.!?;]+)/i]),
    companySizes: list(text, [/(?:company sizes|company size)(?:\s+(?:are|is)\s+|\s*:\s*)([^.!?;]+)/i]),
    jobTitles: list(text, [/(?:job titles|titles)(?:\s+(?:are|include)\s+|\s*:\s*)([^.!?;]+)/i]),
    jobFunctions: list(text, [/(?:job functions|functions)(?:\s+(?:are|include)\s+|\s*:\s*)([^.!?;]+)/i]),
    seniorities: list(text, [/(?:seniorities|seniority)(?:\s+(?:are|is)\s+|\s*:\s*)([^.!?;]+)/i]),
    keywords: list(text, [/(?:keywords|search terms)(?:\s+(?:are|include)\s+|\s*:\s*)([^.!?;]+)/i]),
    pains: list(text, [/(?:pains|problems)(?:\s+(?:are|include)\s+|\s*:\s*)([^.!?;]+)/i]),
    triggers: list(text, [/(?:triggers|buying triggers)(?:\s+(?:are|include)\s+|\s*:\s*)([^.!?;]+)/i]),
    campaignGoal: first(text, [/(?:campaign goal|goal)\s+(?:is|:)\s*([^.!?;]+)/i]),
    preferredChannels: list(text, [/(?:preferred channels|channels)(?:\s+(?:are|include)\s+|\s*:\s*)([^.!?;]+)/i])
  };
  return canonicalizeStrategy(strategy);
}

async function main() {
  const sourcePath = argument("--source");
  const outPath = argument("--out");
  if (!sourcePath || !outPath) throw new Error("Usage: node src/extract/extract-source.js --source <readable-text-file> --out <strategy.json>");
  const strategy = extractStrategyFromText(await readFile(sourcePath, "utf8"));
  const validation = validateStrategyInput(strategy);
  if (!validation.valid) throw new Error(`Source extraction did not produce a usable brief: ${validation.errors.join(" ")}`);
  await writeFile(outPath, JSON.stringify(strategy, null, 2), { encoding: "utf8", mode: 0o600 });
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
