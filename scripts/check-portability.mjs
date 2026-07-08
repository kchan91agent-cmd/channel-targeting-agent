import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCANNED_EXTENSIONS = new Set([".js", ".json", ".md", ".mjs", ".ps1", ".sh", ".toml", ".txt"]);
const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "coverage"]);
const REQUIRED_IGNORE_LINES = [".env", ".env.*", "!.env.example", "*.private.md", "*.private.json", "pilot-brief.md", "pilot-report.md"];
const FORBIDDEN_PERSONAL_REFERENCES = ["/" + "Users/", "Kevin" + "OS"];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) files.push(...await filesUnder(join(directory, entry.name)));
    } else if (entry.isFile() && SCANNED_EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf(".")))) {
      files.push(join(directory, entry.name));
    }
  }
  return files;
}

export async function portabilityViolations(projectRoot = PROJECT_ROOT) {
  const violations = [];
  const gitignorePath = join(projectRoot, ".gitignore");
  const gitignore = await readFile(gitignorePath, "utf8");
  for (const requiredLine of REQUIRED_IGNORE_LINES) {
    if (!gitignore.split(/\r?\n/).includes(requiredLine)) violations.push(`.gitignore is missing ${requiredLine}`);
  }

  const packageJson = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  if (packageJson.engines?.node !== ">=20") violations.push("package.json must require Node.js >=20");
  try {
    await stat(join(projectRoot, "package-lock.json"));
  } catch {
    violations.push("package-lock.json is required for reproducible installs");
  }

  for (const file of await filesUnder(projectRoot)) {
    const content = await readFile(file, "utf8");
    for (const reference of FORBIDDEN_PERSONAL_REFERENCES) {
      if (content.includes(reference)) violations.push(`${relative(projectRoot, file)} contains a personal workspace reference (${reference})`);
    }
  }
  return violations;
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const violations = await portabilityViolations();
  if (violations.length > 0) {
    console.error("PORTABILITY_CHECK_FAILED");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exitCode = 1;
  } else {
    console.log("Portability check passed: standalone paths, reproducible install lock, and private-artifact ignores are present.");
  }
}
