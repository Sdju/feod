import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Linter } from "eslint";
import { createConfig, loadFeodConfig, type FeodConfig } from "../src/app/index.js";

const temporary: string[] = [];
function project(config: FeodConfig) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "feod-roots-"));
  temporary.push(root);
  fs.writeFileSync(path.join(root, "feod.config.json"), JSON.stringify(config));
  return root;
}
afterEach(() => temporary.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true })));

function lint(config: FeodConfig, file: string, code = "export const value = 1;") {
  const rootDir = "/project";
  const linter = new Linter({ cwd: rootDir });
  return linter.verify(code, [createConfig(config, { rootDir, preset: "strict" })], { filename: path.join(rootDir, file) });
}

describe("files outside explicit roots", () => {
  const config: FeodConfig = { roots: { src: {}, core: {} }, rootDefault: {
    extra: { confine: [{ name: "ws", imports: ["ws"] }], largeFiles: { thresholds: { default: 1 } } },
    modules: { requirePublicEntry: true }, inventory: { uncovered: true },
  } };

  it("are not checked by any rule, while files inside a root are", () => {
    const code = 'import "ws";\nimport "./nope";\nexport const a = 1;\nexport const b = 2;\n';
    for (const file of ["tests/a.js", "scripts/b.js", "vite.config.js", "source/app/x.js"]) {
      expect(lint(config, file, code)).toEqual([]);
    }
    expect(lint(config, "src/app/x.js", code).map(message => message.ruleId)).toContain("feod-structure/confine");
  });

  it("do not inherit the first root's policy in the legacy single-root form", () => {
    expect(lint({ srcRoot: "src" }, "elsewhere/orphan.js")).toEqual([]);
  });
});

describe("root defaults and overrides", () => {
  it("defaults to src and normalizes legacy srcRoot without retaining it", () => {
    const standard = loadFeodConfig({ rootDir: project({ rootDefault: { common: { maxDepth: 0 } } }) }).config;
    expect(Object.keys(standard.roots)).toEqual(["src"]);
    expect(standard.roots.src.common.maxDepth).toBe(0);
    const legacy = loadFeodConfig({ rootDir: project({ srcRoot: "source" }) }).config;
    expect(Object.keys(legacy.roots)).toEqual(["source"]);
    expect(legacy).not.toHaveProperty("srcRoot");
    expect(lint(legacy, "source/app/x.js", "import '@modules/User';")).toEqual([]);
  });

  it("merges maps by field, replaces arrays and leaves input untouched", () => {
    const input: FeodConfig = {
      rootDefault: { layerDirs: { global: "globals", modules: "features" },
        layerAliases: { "#core": "core/features" }, common: { maxDepth: 0 },
        ignore: ["**/generated/**"], dependencies: ["core"], transitModules: ["API"] },
      roots: { src: {}, server: { layerDirs: { modules: "modules" },
        ignore: [], transitModules: [], common: { maxDepth: 2 } }, core: { dependencies: [] } },
    };
    const before = JSON.stringify(input);
    const normalized = loadFeodConfig({ rootDir: project(input) }).config;
    expect(normalized.roots.src).toMatchObject({ aliasRoot: "src", layerDirs: { modules: "features", global: "globals" },
      layerAliases: { "@modules": "src/features", "#core": "core/features" }, dependencies: ["core"] });
    expect(normalized.roots.server).toMatchObject({ layerDirs: { modules: "modules", global: "globals" },
      common: { maxDepth: 2 }, ignore: [], transitModules: [], dependencies: ["core"] });
    expect(normalized.roots.core.dependencies).toEqual([]);
    expect(createConfig(normalized).rules).toEqual(createConfig(input).rules);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("selects per-root aliases, ignores and common depth for all file rules", () => {
    const config: FeodConfig = {
      rootDefault: { layerDirs: { global: "globals" }, common: { maxDepth: 0 } },
      roots: { src: {}, server: { common: { maxDepth: 1 }, ignore: ["server/generated/**"] } },
    };
    expect(lint(config, "server/globals/types.js")).toEqual([]);
    expect(lint(config, "server/generated/x.js")).toEqual([]);
    expect(lint(config, "server/common/utils/x.js")).toEqual([]);
    expect(lint(config, "src/common/utils/x.js")).toEqual([expect.objectContaining({ messageId: "commonTooDeep" })]);
    expect(lint(config, "server/common/x.js", "import '@modules/User';")).toEqual([
      expect.objectContaining({ messageId: "invalidLayerImport" }),
    ]);
  });

  it("assigns nested roots to their closest owner", () => {
    const config: FeodConfig = { roots: { src: {}, "src/modules/vendor": { layerDirs: { common: "shared" } } } };
    expect(lint(config, "src/modules/vendor/shared/x.js", "import '@modules/User';")).toEqual([
      expect.objectContaining({ messageId: "invalidLayerImport" }),
    ]);
    expect(lint(config, "src/modules/vendor/unknown/x.js")).toEqual([
      expect.objectContaining({ ruleId: "feod-structure/no-unknown-files" }),
    ]);
    expect(lint(config, "src/modules/vendor-other/index.js")).toEqual([]);
  });

  it("does not apply source visibility conventions within another nested root", () => {
    const config: FeodConfig = {
      rootDefault: { levels: [{ name: "router", visibility: "default", maxDepth: 1 }] },
      roots: { src: { dependencies: ["src/app/router"] }, "src/app/router": {} },
    };
    expect(lint(config, "src/app/x.js", "import './router/modules/User/index.js';")).toEqual([]);
  });

  for (const config of [
    { srcRoot: "src", roots: { src: {} } }, { roots: {} },
    { roots: { "/absolute": {} } }, { roots: { "../outside": {} } },
    { roots: { src: {}, "./src": {} } },
    { roots: { src: { dependencies: ["missing"] } } },
    { rootDefault: { typo: true } }, { roots: { src: { common: { maxDepth: -1 } } } },
  ]) {
    it(`rejects invalid root config ${JSON.stringify(config)}`, () => {
      expect(() => createConfig(config as FeodConfig)).toThrow("FEOD configuration:");
      expect(() => loadFeodConfig({ rootDir: project(config as FeodConfig) })).toThrow("FEOD configuration:");
    });
  }
});

describe("cross-root imports", () => {
  const config: FeodConfig = {
    rootDefault: { layerAliases: { "@core": "core/modules" } },
    roots: { src: { dependencies: ["core"] }, core: {} },
  };
  it("permits public module APIs, rejecting private, nested and upper-layer targets", () => {
    expect(lint(config, "src/app/x.js", "import '@core/User';")).toEqual([]);
    for (const target of ["@core/User/private", "@core/User/modules/Child/index.ts", "../../core/app/x.js", "../../core/common/x.js"]) {
      expect(lint(config, "src/app/x.js", `import '${target}';`)).toEqual([
        expect.objectContaining({ messageId: "crossRootPublicOnly" }),
      ]);
    }
  });
  it("requires directional dependencies and keeps common free of business imports", () => {
    expect(lint(config, "core/app/x.js", "import '../../src/modules/User';")).toEqual([
      expect.objectContaining({ messageId: "invalidRootImport" }),
    ]);
    expect(lint(config, "src/common/x.js", "import '@core/User';")).toEqual([
      expect.objectContaining({ messageId: "invalidLayerImport" }),
    ]);
    expect(lint({ roots: { src: {}, core: {} } }, "src/app/x.js", "import '../../core/modules/User';")).toEqual([
      expect.objectContaining({ messageId: "invalidRootImport" }),
    ]);
  });
  it("uses the target root's single-file and transit module settings", () => {
    const extended: FeodConfig = { ...config, roots: { src: { dependencies: ["core"] },
      core: { singleFileModules: true, transitModules: ["API"] } } };
    expect(lint(extended, "src/app/x.js", "import '@core/User.ts';")).toEqual([]);
    expect(lint(extended, "src/app/x.js", "import '@core/API/client';")).toEqual([]);
    expect(lint(extended, "src/app/x.js", "import '@core/API/_/private';")).toEqual([
      expect.objectContaining({ messageId: "crossRootPublicOnly" }),
    ]);
  });
});
