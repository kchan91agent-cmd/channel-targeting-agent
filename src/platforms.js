import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const platformDir = path.join(projectRoot, "data", "platforms");

export async function loadPlatforms() {
  const files = (await readdir(platformDir)).filter((file) => file.endsWith(".json")).sort();
  const platforms = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(platformDir, file), "utf8");
      return JSON.parse(raw);
    })
  );
  return platforms;
}

export function getProjectRoot() {
  return projectRoot;
}
