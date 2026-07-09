import { readFile } from "node:fs/promises";
import path from "node:path";
import { getProjectRoot } from "./platforms.js";

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const index = trimmed.indexOf("=");
  if (index === -1) return null;
  const key = trimmed.slice(0, index).trim();
  let value = trimmed.slice(index + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return key ? [key, value] : null;
}

export async function loadLocalEnv({ envPath = path.join(getProjectRoot(), ".env"), env = process.env } = {}) {
  let text;
  try {
    text = await readFile(envPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { loaded: false, keys: [] };
    throw error;
  }

  const keys = [];
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    if (env[key] === undefined) {
      env[key] = value;
      keys.push(key);
    }
  }
  return { loaded: true, keys };
}
