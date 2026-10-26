import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
const selection = process.env.RELEASE_PACKAGE ?? "both";
const dryRunValue = process.env.RELEASE_DRY_RUN ?? "true";
if (!["both", "eslint", "oxlint"].includes(selection)) {
  throw new Error(`Unknown package selection: ${selection}`);
}
if (!["true", "false"].includes(dryRunValue)) {
  throw new Error("RELEASE_DRY_RUN must be true or false");
}
const dryRun = dryRunValue === "true";
const registry = "https://registry.npmjs.org/";
const archiveDir = mkdtempSync(path.join(process.env.RUNNER_TEMP ?? tmpdir(), "o-feod-publish-"));

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
}

function isPublished(name, version) {
  const result = spawnSync("npm", ["view", `${name}@${version}`, "version", "--json", "--registry", registry], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status === 0) {
    if (JSON.parse(result.stdout) !== version) throw new Error(`Unexpected registry response for ${name}@${version}`);
    return true;
  }
  let error;
  try { error = JSON.parse(result.stdout).error; } catch { /* Report the original failure below. */ }
  if (error?.code === "E404") return false;
  throw new Error(`Cannot check ${name}@${version}: ${result.stderr || result.stdout}`);
}

// Sequential publication makes the shared ESLint dependency available first.
for (const directory of selection === "both" ? ["eslint", "oxlint"] : [selection]) {
  const packageDir = path.join(root, "packages", directory);
  const { name, version } = JSON.parse(readFileSync(path.join(packageDir, "package.json"), "utf8"));
  if (!dryRun && isPublished(name, version)) {
    console.log(`${name}@${version} is already published; skipping.`);
    continue;
  }
  // pnpm pack replaces workspace:^ with a publishable dependency range.
  run("pnpm", ["--dir", packageDir, "pack", "--pack-destination", archiveDir]);
  const archive = path.join(archiveDir, `${name.replace(/^@/, "").replace("/", "-")}-${version}.tgz`);
  console.log(`${dryRun ? "Validating" : "Publishing"} ${name}@${version}`);
  run("npm", ["publish", archive, "--access", "public", "--ignore-scripts", "--registry", registry,
    ...(dryRun ? ["--dry-run"] : [])]);
}
