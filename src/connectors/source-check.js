export async function checkSourceUrl(platform, { timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(platform.sourceUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "user-agent": "channel-targeting-agent/0.1 source-check"
      }
    });

    return {
      platformId: platform.id,
      platformName: platform.name,
      sourceUrl: platform.sourceUrl,
      ok: response.ok,
      status: response.status,
      checkedAt: new Date().toISOString(),
      mode: platform.liveCheck?.mode ?? "source-url"
    };
  } catch (error) {
    return {
      platformId: platform.id,
      platformName: platform.name,
      sourceUrl: platform.sourceUrl,
      ok: false,
      status: null,
      checkedAt: new Date().toISOString(),
      mode: platform.liveCheck?.mode ?? "source-url",
      error: error.name === "AbortError" ? "timeout" : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function missingAuth(platform, env = process.env) {
  const vars = platform.liveCheck?.envVars ?? [];
  return vars.filter((name) => !env[name]);
}
