import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { STRATEGY_FIELDS, canonicalizeStrategy, validateStrategyInput } from "./strategy-input.js";

export class ProviderExtractionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function extractionPrompt(sourcePath) {
  return [
    "You are the source-to-brief extraction stage for Channel Targeting Agent.",
    `Read only this source file: ${sourcePath}`,
    "Return exactly one JSON object and nothing else. Do not use Markdown, code fences, explanation, source quotes, or extra keys.",
    `For a successful extraction, product and market are required. The only permitted strategy keys are: ${[...STRATEGY_FIELDS].join(", ")}.`,
    "The object must be either one strategy object using only those exact keys, or exactly {\"status\":\"source_unreadable\",\"reason\":\"...\"}.",
    "Extract only explicitly source-supported strategy facts. Omit missing fields. Do not infer titles, industries, geographies, budgets, conversion events, audiences, or channels.",
    "Before responding, make one completeness pass over every permitted field. Preserve an explicitly stated launch locale separately from geographies: for example, an explicit 'US launch' requires locale: 'US' even when United States also appears in geographies.",
    "Keep pains, gains, objections, and triggers in their respective fields; never translate them into keywords or other targeting fields.",
    "If the source cannot be read completely or does not explicitly support both product and market, return the source_unreadable response instead of guessing.",
    "Do not create, modify, upload, or save any files."
  ].join("\n");
}

export function buildCodexCommand({ sourcePath, responsePath, codexBin = process.env.CODEX_BIN ?? "codex" }) {
  return {
    command: codexBin,
    args: [
      "--ask-for-approval", "never",
      "exec",
      "--ignore-user-config",
      "--ephemeral",
      "--sandbox", "read-only",
      "--skip-git-repo-check",
      "--cd", dirname(sourcePath),
      "--output-last-message", responsePath,
      extractionPrompt(sourcePath)
    ]
  };
}

export function buildClaudeCommand({ sourcePath, claudeBin = process.env.CLAUDE_BIN ?? "claude" }) {
  return {
    command: claudeBin,
    args: [
      "-p", extractionPrompt(sourcePath),
      "--output-format", "json",
      "--max-turns", "1",
      "--permission-mode", "plan",
      "--allowedTools", "Read",
      "--disallowedTools", "Edit,Bash",
      "--add-dir", dirname(sourcePath)
    ]
  };
}

export function runProviderCommand(command, args, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { detached: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };
    const stopProcessGroup = (signal) => {
      try {
        process.kill(-child.pid, signal);
      } catch {
        child.kill(signal);
      }
    };
    const timeout = setTimeout(() => {
      stopProcessGroup("SIGTERM");
      const forceKill = setTimeout(() => stopProcessGroup("SIGKILL"), 1000);
      forceKill.unref();
      child.stdout.destroy();
      child.stderr.destroy();
      child.unref();
      finish({ ok: false, stdout: "", stderr: "", timedOut: true });
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", () => {
      finish({ ok: false, stdout: "", stderr: "" });
    });
    child.on("close", (code) => {
      finish({ ok: code === 0, stdout, stderr });
    });
  });
}

function parseJson(value) {
  if (typeof value === "object" && value !== null) return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function parseJsonText(text) {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  const direct = parseJson(trimmed);
  if (direct) return direct;
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? parseJson(fenced[1]) : null;
}

export function parseClaudeResponse(stdout) {
  const envelope = parseJsonText(stdout);
  if (!envelope) return null;
  for (const candidate of [envelope.result, envelope.response, envelope.content, envelope]) {
    const parsed = typeof candidate === "string" ? parseJsonText(candidate) : parseJson(candidate);
    if (parsed) return parsed;
  }
  return null;
}

export function validateProviderResponse(response) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new ProviderExtractionError("INVALID_RESPONSE", "Provider did not return a JSON object.");
  }
  if (response.status === "source_unreadable") {
    if (Object.keys(response).length !== 2 || typeof response.reason !== "string" || !response.reason.trim()) {
      throw new ProviderExtractionError("INVALID_RESPONSE", "Provider returned an invalid source-unreadable response.");
    }
    throw new ProviderExtractionError("SOURCE_UNREADABLE", "Provider could not read enough source material to extract a brief.");
  }
  const unknownKeys = Object.keys(response).filter((key) => !STRATEGY_FIELDS.has(key));
  if (unknownKeys.length > 0) throw new ProviderExtractionError("INVALID_RESPONSE", "Provider returned fields outside the extraction contract.");
  const validation = validateStrategyInput(response);
  if (!validation.valid) throw new ProviderExtractionError("INVALID_RESPONSE", "Provider returned an invalid normalized brief.");
  return canonicalizeStrategy(response);
}

export async function extractWithProvider({ provider, sourcePath, outPath, timeoutMs }) {
  if (!sourcePath || !outPath) throw new ProviderExtractionError("USAGE", "Provider extraction requires source and output paths.");
  if (!new Set(["codex", "claude"]).has(provider)) throw new ProviderExtractionError("USAGE", "Provider must be codex or claude.");

  const temporaryDirectory = await mkdtemp(join(tmpdir(), "channel-targeting-provider-"));
  try {
    await chmod(temporaryDirectory, 0o700);
    const responsePath = join(temporaryDirectory, "provider-response.json");
    const command = provider === "codex"
      ? buildCodexCommand({ sourcePath, responsePath })
      : buildClaudeCommand({ sourcePath });
    const result = await runProviderCommand(command.command, command.args, timeoutMs);
    if (!result.ok) throw new ProviderExtractionError("PROVIDER_UNAVAILABLE", "Provider extraction command did not complete.");

    const response = provider === "codex"
      ? parseJsonText(await readFile(responsePath, "utf8"))
      : parseClaudeResponse(result.stdout);
    const strategy = validateProviderResponse(response);
    await writeFile(outPath, JSON.stringify(strategy, null, 2), { encoding: "utf8", mode: 0o600 });
    return { provider, strategy };
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
