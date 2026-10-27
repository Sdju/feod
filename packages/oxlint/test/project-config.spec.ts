import { entryCases } from "../../eslint/test/entry-fixtures";
import { globalImportCases } from "../../eslint/test/global-import-fixtures";
import { structureCases } from "../../eslint/test/structure-fixtures";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRuleConfig, loadFeodConfig as sharedLoader, type FeodConfig } from "@o-feod/eslint-structure-plugin";
import { loadFeodConfig } from "../dist/index.mjs";
import { createConfig, configFromProject } from "../dist/configs.mjs";
import { layerCases, submoduleCases, computedImportCases, visibilityCases } from "../../eslint/test/layer-fixtures";

const require = createRequire(import.meta.url);
const cli = path.join(path.dirname(require.resolve("oxlint/package.json")), "bin/oxlint");
const packageDir = fileURLToPath(new URL("..", import.meta.url));
let rootDir: string;
beforeEach(() => {
  rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "feod-oxlint-config-"));
  fs.mkdirSync(path.join(rootDir, "node_modules/@o-feod"), { recursive: true });
  fs.symlinkSync(packageDir, path.join(rootDir, "node_modules/@o-feod/oxlint-structure-plugin"), "dir");
});
afterEach(() => fs.rmSync(rootDir, { recursive: true, force: true }));
function write(filename: string, content: string) {
  const target = path.join(rootDir, filename);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
function lint(filename: string, code: string) {
  write(filename, code);
  write(
    "oxlint.config.ts",
    `import { configFromProject } from '@o-feod/oxlint-structure-plugin/configs';
export default { ...configFromProject({ preset: 'strict' }), categories: { correctness: 'off' } };`,
  );
  return spawnSync(process.execPath, [cli, "--threads=1", "--format=json", "--config", "oxlint.config.ts", filename], {
    cwd: rootDir,
    encoding: "utf8",
    timeout: 15_000,
  });
}

describe("project config through Oxlint public exports", () => {
  for (const fixture of [
    ...layerCases,
    ...submoduleCases,
    ...computedImportCases,
    ...visibilityCases,
    ...structureCases,
    ...entryCases,
    ...globalImportCases,
  ]) {
    it(`layer set: ${fixture.label}`, () => {
      write("feod.config.json", JSON.stringify(fixture.config));
      const result = lint(fixture.file, fixture.code);
      expect(result.error).toBeUndefined();
      expect(result.stderr).toBe("");
      expect(result.status).toBe(fixture.error ? 1 : 0);
      const diagnostics = JSON.parse(result.stdout).diagnostics;
      expect(diagnostics).toHaveLength(fixture.error ? 1 : 0);
      if (fixture.error) expect(diagnostics[0].code).toMatch(/^feod-structure\(/);
    });
  }
  it("allows warning severity for structural rules", () => {
    write("feod.config.json", JSON.stringify({ modules: { forbiddenNames: ["utils"] } }));
    write("src/modules/utils/index.ts", "export {};");
    write(
      "oxlint.config.ts",
      `import { configFromProject } from '@o-feod/oxlint-structure-plugin/configs';
const config = configFromProject();
const [, options] = config.rules['feod-structure/module-names'];
export default { ...config, categories: { correctness: 'off' }, rules: { ...config.rules, 'feod-structure/module-names': ['warn', options] } };`,
    );
    const result = spawnSync(
      process.execPath,
      [cli, "--threads=1", "--format=json", "--config", "oxlint.config.ts", "src/modules/utils/index.ts"],
      { cwd: rootDir, encoding: "utf8", timeout: 15_000 },
    );
    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).diagnostics).toEqual([
      expect.objectContaining({ code: "feod-structure(module-names)", severity: "warning" }),
    ]);
  });

  it("reuses the ESLint loader and rule builder", () => {
    expect(loadFeodConfig).toBe(sharedLoader);
    const config: FeodConfig = {
      srcRoot: "source",
      layerDirs: { modules: "features", global: "globals" },
      common: { maxDepth: 0 },
      modulePages: true,
      singleFileModules: true,
      transitModules: ["API"],
      levels: [{ name: "router", visibility: "default", maxDepth: 1 }],
    };
    for (const preset of ["recommended", "strict"] as const) {
      expect(createConfig(config, { rootDir, preset }).rules).toEqual(
        createRuleConfig(config, { rootDir, preset }).rules,
      );
    }
  });
  for (const source of ["package.json", "feod.config.json"]) {
    it(`loads ${source} and checks imports through custom aliases`, () => {
      const config: FeodConfig = {
        srcRoot: "source",
        layerDirs: { common: "shared", modules: "features", pages: "screens", global: "globals" },
        layerAliases: { "#modules": "source/features" },
        ignore: ["source/generated/**"],
        common: { maxDepth: 2 },
        transitModules: ["API"],
        singleFileModules: true,
        modulePages: true,
        levels: [{ name: "router", visibility: "default", maxDepth: 1 }],
      };
      write(
        source,
        JSON.stringify(source === "package.json" ? { type: "module", name: "consumer", feod: config } : config),
      );
      expect(configFromProject({ rootDir, preset: "strict" }).rules).toEqual(
        createRuleConfig(config, { rootDir, preset: "strict" }).rules,
      );
      const result = lint("source/shared/check.ts", "import '#modules/User';");
      expect(result.error).toBeUndefined();
      expect(result.stderr).toBe("");
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout).diagnostics).toEqual([
        expect.objectContaining({ code: "feod-structure(layer-imports)" }),
      ]);
    });
  }
  it("uses default rules when there is no configuration", () => {
    const result = lint("src/common/check.ts", "import '@modules/User';");
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).diagnostics).toEqual([
      expect.objectContaining({ code: "feod-structure(layer-imports)" }),
    ]);
  });
  it("applies global folder overrides, common depth and ignore", () => {
    write(
      "feod.config.json",
      JSON.stringify({ layerDirs: { global: "globals" }, common: { maxDepth: 0 }, ignore: "src/generated/**" }),
    );
    for (const filename of ["src/globals/types.ts", "src/generated/check.ts"]) {
      const result = lint(filename, "export const value = 1;");
      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);
    }
    const result = lint("src/common/utils/check.ts", "export const value = 1;");
    expect(JSON.parse(result.stdout).diagnostics).toEqual([
      expect.objectContaining({ code: "feod-structure(no-common-deep)" }),
    ]);
  });
  it("enforces configured visibility depth in strict", () => {
    write(
      "package.json",
      JSON.stringify({ type: "module", feod: { levels: [{ name: "router", visibility: "default", maxDepth: 1 }] } }),
    );
    const result = lint("src/app/check.ts", "import '@app/router/guards/deep.js';");
    expect(JSON.parse(result.stdout).diagnostics).toEqual([
      expect.objectContaining({ code: "feod-structure(visibility-levels)" }),
    ]);
  });
  it("inherits rootDefault and selects root overrides through the real CLI", () => {
    write(
      "feod.config.json",
      JSON.stringify({
        rootDefault: { layerDirs: { global: "globals" }, common: { maxDepth: 0 } },
        roots: { src: {}, server: { common: { maxDepth: 1 }, ignore: ["server/generated/**"] } },
      }),
    );
    for (const file of ["server/globals/types.ts", "server/common/utils/x.ts", "server/generated/x.ts"]) {
      const result = lint(file, "export const value = 1;");
      expect(result.error).toBeUndefined();
      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);
    }
    const result = lint("server/common/x.ts", "import '@modules/User';");
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout).diagnostics).toEqual([
      expect.objectContaining({ code: "feod-structure(layer-imports)" }),
    ]);
    expect(JSON.parse(lint("src/common/utils/x.ts", "export const value = 1;").stdout).diagnostics).toEqual([
      expect.objectContaining({ code: "feod-structure(no-common-deep)" }),
    ]);
  });
  it("enforces directional cross-root public APIs for type and value imports", () => {
    write(
      "feod.config.json",
      JSON.stringify({
        rootDefault: { layerAliases: { "@core": "core/modules" } },
        roots: { src: { dependencies: ["core"] }, core: {} },
      }),
    );
    expect(lint("src/app/x.ts", "import type { X } from '@core/User';").status).toBe(0);
    for (const [file, code, message] of [
      ["src/app/x.ts", "type X = import('@core/User/private').X;", "public top-level module"],
      ["core/app/x.ts", "import '../../src/modules/User';", "cannot import"],
    ]) {
      const result = lint(file, code);
      expect(result.error).toBeUndefined();
      expect(result.stderr).toBe("");
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout).diagnostics).toEqual([
        expect.objectContaining({ code: "feod-structure(layer-imports)", message: expect.stringContaining(message) }),
      ]);
    }
  });
  it("selects a nested root and rejects srcRoot together with roots", () => {
    write("feod.config.json", JSON.stringify({ roots: { src: {}, "src/modules/vendor": {} } }));
    expect(JSON.parse(lint("src/modules/vendor/common/x.ts", "import '@modules/User';").stdout).diagnostics).toEqual([
      expect.objectContaining({ code: "feod-structure(layer-imports)" }),
    ]);
    write("feod.config.json", JSON.stringify({ srcRoot: "src", roots: { src: {} } }));
    const result = lint("src/app/x.ts", "export const x = 1;");
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain("srcRoot and roots cannot be configured together");
  });
  for (const failure of ["invalid", "conflict"]) {
    it(`surfaces ${failure} configuration errors from the CLI`, () => {
      write("package.json", JSON.stringify({ type: "module", feod: failure === "invalid" ? { srcRot: "src" } : {} }));
      if (failure === "conflict") write("feod.config.json", "{}");
      const result = lint("src/app/check.ts", "export const value = 1;");
      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
      expect(result.stderr + result.stdout).toContain("FEOD configuration");
      expect(result.stderr + result.stdout).toContain(path.join(rootDir, "package.json"));
    });
  }
});
