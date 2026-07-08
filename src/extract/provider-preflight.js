import { runProviderCommand } from "./provider-adapters.js";

function providerBinary(provider, env) {
  if (provider === "codex") return env.CODEX_BIN ?? "codex";
  if (provider === "claude") return env.CLAUDE_BIN ?? "claude";
  throw new Error("Provider must be codex or claude.");
}

function versionFrom(stdout) {
  return stdout.trim().split(/\r?\n/).find(Boolean) ?? null;
}

function codexRuntimeProbe(binary) {
  return [binary, [
    "--ask-for-approval", "never",
    "exec",
    "--ignore-user-config",
    "--ephemeral",
    "--sandbox", "read-only",
    "--skip-git-repo-check",
    "Reply with exactly this JSON and nothing else: {\"status\":\"ready\"}"
  ]];
}

export async function providerPreflight(provider, { env = process.env, runner = runProviderCommand, probe = false, timeoutMs = 15000 } = {}) {
  const binary = providerBinary(provider, env);
  const version = await runner(binary, ["--version"], timeoutMs);
  if (!version.ok) {
    return { provider, ready: false, code: "PROVIDER_UNAVAILABLE", version: null, authentication: "not-checked" };
  }
  if (provider === "codex") {
    const login = await runner(binary, ["login", "status"], timeoutMs);
    if (!login.ok) {
      return {
        provider,
        ready: false,
        code: "PROVIDER_AUTH_REQUIRED",
        version: versionFrom(version.stdout),
        authentication: "not-verified"
      };
    }
    if (probe) {
      const [command, args] = codexRuntimeProbe(binary);
      const runtime = await runner(command, args, timeoutMs);
      return {
        provider,
        ready: runtime.ok,
        code: runtime.ok ? null : "PROVIDER_RUNTIME_UNAVAILABLE",
        version: versionFrom(version.stdout),
        authentication: "verified",
        runtime: runtime.ok ? "verified" : "not-verified"
      };
    }
    return {
      provider,
      ready: true,
      code: null,
      version: versionFrom(version.stdout),
      authentication: "verified"
    };
  }
  return {
    provider,
    ready: true,
    code: null,
    version: versionFrom(version.stdout),
    authentication: "verified-by-live-run"
  };
}
