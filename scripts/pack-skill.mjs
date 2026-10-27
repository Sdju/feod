#!/usr/bin/env node
/**
 * Assemble the delivered skill into skills/feod from the sources:
 *
 *   skill/SKILL.template.md   -> SKILL.md          (authored)
 *   skill/references/         -> references/       (authored)
 *   packages/skill-cli        -> scripts/feod.mjs  (built, self-contained)
 *
 * skills/feod is generated output: never edit it by hand, change skill/ or packages/skill-cli instead.
 * `--check` packs into a scratch directory and fails when it differs from the committed skills/feod.
 * `--no-build` reuses existing builds.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const target = join(repo, "skills/feod");
const out = check ? mkdtempSync(join(tmpdir(), "feod-pack-")) : target;

const run = args => {
  // Windows resolves pnpm through a .cmd shim, which spawn only finds with a shell.
  const result = spawnSync("pnpm", args, {
    cwd: repo,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
    shell: process.platform === "win32",
  });
  if (result.error) console.error(`pnpm ${args.join(" ")} failed to start: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
};

if (!process.argv.includes("--no-build")) {
  run(["--filter", "@o-feod/config", "run", "build"]);
  run(["--filter", "@open-feod/skill-cli", "run", "build"]);
}

const script = join(repo, "packages/skill-cli/dist/feod.mjs");
if (!existsSync(script)) throw new Error(`skill-cli build is missing: ${script}`);
const core = JSON.parse(readFileSync(join(repo, "packages/config/package.json"), "utf8"));

for (const entry of ["SKILL.md", "scripts", "references", "VERSION.json"]) {
  rmSync(join(out, entry), { recursive: true, force: true });
}
mkdirSync(join(out, "scripts"), { recursive: true });
cpSync(join(repo, "skill/SKILL.template.md"), join(out, "SKILL.md"));
cpSync(join(repo, "skill/references"), join(out, "references"), { recursive: true });
cpSync(script, join(out, "scripts/feod.mjs"));

// Content hash of everything delivered: changes exactly when the skill changes.
const build = digest(out).toString("hex").slice(0, 12);
writeFileSync(join(out, "VERSION.json"), `${JSON.stringify({ configVersion: core.version, build }, null, 2)}\n`);

if (check) {
  const stale = diffDirs(out, target);
  rmSync(out, { recursive: true, force: true });
  if (stale.length) {
    console.error(`skills/feod is out of date (run \`pnpm run skill:pack\`):\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  console.log("skills/feod is up to date");
} else {
  console.log(`Skill packed into ${out} (config ${core.version}, build ${build})`);
}

function files(dir) {
  if (!existsSync(dir)) return [];
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...files(full));
    else if (entry.isFile()) result.push(full);
  }
  return result.sort((a, b) => a.localeCompare(b));
}

function digest(dir) {
  const hash = createHash("sha256");
  for (const file of files(dir)) {
    hash.update(relative(dir, file).split(sep).join("/"));
    hash.update(readFileSync(file));
  }
  return hash.digest();
}

/** Relative paths that differ between two trees. */
function diffDirs(a, b) {
  const rel = (root, list) => new Map(list.map(file => [relative(root, file).split(sep).join("/"), file]));
  const left = rel(a, files(a));
  const right = rel(b, files(b));
  const stale = [];
  for (const [name, file] of left) {
    if (!right.has(name) || !readFileSync(file).equals(readFileSync(right.get(name)))) stale.push(name);
  }
  for (const name of right.keys()) if (!left.has(name)) stale.push(`${name} (extra)`);
  return stale.sort((a, b) => a.localeCompare(b));
}
