import { readFile } from "node:fs/promises";
import { parseMarkdownBrief } from "./parse-markdown.js";

export async function loadBrief(inputPath) {
  const raw = await readFile(inputPath, "utf8");
  if (inputPath.endsWith(".json")) {
    return JSON.parse(raw);
  }
  if (inputPath.endsWith(".md") || inputPath.endsWith(".markdown")) {
    return parseMarkdownBrief(raw);
  }
  throw new Error(`Unsupported input file type: ${inputPath}`);
}
