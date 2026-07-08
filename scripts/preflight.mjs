import { spawnSync } from "node:child_process";

const nodeVersion = process.versions.node;
const nodeMajor = Number(nodeVersion.split(".")[0]);

if (!Number.isInteger(nodeMajor) || nodeMajor < 20) {
  console.error(`Node.js v${nodeVersion} is installed, but Channel Targeting Agent requires Node.js 20 or newer.`);
  console.error("Install or activate the current Node.js LTS from https://nodejs.org/en/download, then rerun preflight.");
  process.exitCode = 1;
} else {
  console.log(`Node.js v${nodeVersion} detected.`);
  const npm = spawnSync("npm", ["--version"], { encoding: "utf8" });
  if (npm.status === 0) {
    console.log(`npm ${npm.stdout.trim()} detected. Run: npm ci, then npm test`);
  } else {
    console.log("npm is not available. Core report commands can run only when dependencies are already installed.");
    console.log("Full source ingestion requires npm ci before running tests or provider extraction.");
  }
}
