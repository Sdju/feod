#!/usr/bin/env node
/**
 * Smoke test of the delivered skill as a user receives it: skills/feod is copied into an empty
 * directory (spaces and non-ASCII in the path, no node_modules, no repository around it) and
 * `feod info` is run against a throwaway project. Run after `pnpm run skill:pack`.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const source = join(dirname(fileURLToPath(import.meta.url)), "..", "skills", "feod");
const failures = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : detail ? `: ${detail}` : ""}`);
  if (!ok) failures.push(name);
};

const sandbox = mkdtempSync(join(tmpdir(), "feod smoke тест "));
const skill = join(sandbox, "skill dir", "feod");
cpSync(source, skill, { recursive: true });

const project = join(sandbox, "project");
mkdirSync(join(project, "src/modules/Cart"), { recursive: true });
writeFileSync(join(project, "src/modules/Cart/index.ts"), "export {}\n");
writeFileSync(join(project, "package.json"), JSON.stringify({ feod: { layerDirs: { global: "globals" } } }));

const script = join(skill, "scripts/feod.mjs");
const run = args => spawnSync(process.execPath, [script, ...args], { cwd: project, encoding: "utf8" });

check("SKILL.md delivered", existsSync(join(skill, "SKILL.md")));
check("references delivered", existsSync(join(skill, "references/rules.md")));

const text = run(["info"]);
check("info exits 0", text.status === 0, text.stderr);
check("info lists the module", text.stdout.includes("Cart  index.ts"), text.stdout);

const json = run(["info", "--json"]);
let parsed;
try {
  parsed = JSON.parse(json.stdout);
} catch (error) {
  check("info --json is JSON", false, String(error));
}
if (parsed) {
  check("info --json reads package.json#feod", parsed.configSource === "package.json#feod");
  check("info --json finds the module", parsed.roots[0]?.modules[0]?.name === "Cart");
}

check("unknown command fails", run(["nope"]).status === 64);

const links = [...readFileSync(join(skill, "SKILL.md"), "utf8").matchAll(/\]\((references\/[^)#]+)\)/g)];
for (const [, link] of links) check(`link ${link}`, existsSync(join(skill, link)));

rmSync(sandbox, { recursive: true, force: true });
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nskill smoke passed");
