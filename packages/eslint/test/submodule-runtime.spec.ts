import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import { createConfig } from "../src/app/index.js";
import schema from "../src/modules/ProjectConfig/feod.schema.json";
import { submodulePolicySchema } from "../src/modules/Architecture/index.js";

describe("parent-child module policy", () => {
  it("shares schema between direct rule options and project configuration", () => {
    expect(schema.definitions.rootOptions.properties.submodules).toEqual(submodulePolicySchema);
    expect(() => createConfig({ submodules: { visibility: "private" } } as never)).toThrow("FEOD configuration:");
    expect(() => createConfig({ submodules: { parentImports: "private" } } as never)).toThrow("FEOD configuration:");
  });

  it("initializes through parent implementation without a barrel cycle", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "feod-parent-child-"));
    try {
      for (const [variant, childSource] of [["direct", "../../shared.mjs"], ["barrel", "../../index.mjs"]]) {
        const parent = `src/modules/${variant}`;
        const files = {
          [`${parent}/shared.mjs`]: 'export const prefix = "parent";',
          [`${parent}/index.mjs`]: 'import { read } from "./modules/Child/index.mjs"; export const value = read(); export const prefix = "parent";',
          [`${parent}/modules/Child/index.mjs`]: `import { prefix } from "${childSource}"; export function read() { return prefix + "/child"; }`,
        };
        for (const [filename, code] of Object.entries(files)) {
          fs.mkdirSync(path.dirname(path.join(rootDir, filename)), { recursive: true });
          fs.writeFileSync(path.join(rootDir, filename), code);
          expect(new Linter({ cwd: rootDir }).verify(code,
            [{ files: ["**/*.mjs"], ...createConfig({}, { rootDir, preset: "strict" }) }],
            { filename: path.join(rootDir, filename) })).toEqual([]);
        }
        const result = spawnSync(process.execPath, ["--input-type=module", "--eval",
          `const module = await import(${JSON.stringify(pathToFileURL(path.join(rootDir, parent, "index.mjs")).href)}); console.log(module.value);`],
          { encoding: "utf8", timeout: 5000 });
        expect(result.error).toBeUndefined();
        if (variant === "direct") {
          expect(result.status).toBe(0);
          expect(result.stdout.trim()).toBe("parent/child");
        } else {
          expect(result.status).not.toBe(0);
          expect(result.stderr).toContain("before initialization");
        }
      }
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
