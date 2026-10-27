import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createConfig } from "../dist/configs.mjs";
import feod from "../feod.config.js";
import { selfHostingCases, selfHostingFiles } from "../../eslint/test/self-hosting-fixtures.js";

const require = createRequire(import.meta.url);
const cli = path.join(path.dirname(require.resolve("oxlint/package.json")), "bin/oxlint");
const plugin = fileURLToPath(new URL("../dist/index.mjs", import.meta.url));
let rootDir: string;
afterEach(() => {
  if (rootDir) fs.rmSync(rootDir, { recursive: true, force: true });
});

describe("Oxlint package self-hosting architecture", () => {
  it.each(selfHostingCases)("$name", ({ file, source, rule }) => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "feod-self-oxlint-"));
    for (const [filename, content] of Object.entries({ ...selfHostingFiles, [file]: source })) {
      const target = path.join(rootDir, filename);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    const configFile = path.join(rootDir, ".oxlintrc.json");
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        ...createConfig(feod, { rootDir, preset: "strict" }),
        jsPlugins: [{ name: "feod-structure", specifier: plugin }],
        plugins: [],
        categories: { correctness: "off" },
      }),
    );
    const result = spawnSync(
      process.execPath,
      [cli, "--config", configFile, "--threads=1", "--format=json", path.join(rootDir, file)],
      {
        cwd: rootDir,
        encoding: "utf8",
        timeout: 15_000,
      },
    );
    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout).diagnostics.map((message: { code: string }) => message.code)).toEqual(
      rule ? [`feod-structure(${rule})`] : [],
    );
    expect(result.status).toBe(rule ? 1 : 0);
  });
});
