const nodeVersion = process.versions.node;
const nodeMajor = Number(nodeVersion.split(".")[0]);

if (!Number.isInteger(nodeMajor) || nodeMajor < 20) {
  console.error(`Node.js v${nodeVersion} is installed, but Channel Targeting Agent requires Node.js 20 or newer.`);
  console.error("Install or activate the current Node.js LTS from https://nodejs.org/en/download, then rerun preflight.");
  process.exitCode = 1;
} else {
  console.log(`Node.js v${nodeVersion} detected.`);
  console.log("npm is available through the current command. Run: npm test");
}
