import { loadPlatforms } from "../src/platforms.js";
import { registryFreshnessSummary } from "../src/connectors/freshness.js";

const summary = registryFreshnessSummary(await loadPlatforms());
console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.status === "stale" ? 1 : 0;
