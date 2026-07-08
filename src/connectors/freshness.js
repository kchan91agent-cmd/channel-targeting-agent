const CADENCE_DAYS = {
  monthly: 35,
  "monthly-or-quarterly": 100
};

function parseCheckedAt(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function platformFreshness(platform, { now = new Date() } = {}) {
  const checkedAt = parseCheckedAt(platform.sourceCheckedAt);
  const maxAgeDays = CADENCE_DAYS[platform.refreshCadence] ?? CADENCE_DAYS.monthly;
  if (!checkedAt) return { platformId: platform.id, status: "unknown", checkedAt: null, maxAgeDays };
  const ageDays = Math.max(0, Math.floor((now.getTime() - checkedAt.getTime()) / 86_400_000));
  return {
    platformId: platform.id,
    status: ageDays <= maxAgeDays ? "current" : "stale",
    checkedAt: platform.sourceCheckedAt,
    ageDays,
    maxAgeDays
  };
}

export function registryFreshnessSummary(platforms, options = {}) {
  const platformsStatus = platforms.map((platform) => platformFreshness(platform, options));
  return {
    status: platformsStatus.some((item) => item.status === "stale") ? "stale" : platformsStatus.some((item) => item.status === "unknown") ? "unknown" : "current",
    platforms: platformsStatus
  };
}
