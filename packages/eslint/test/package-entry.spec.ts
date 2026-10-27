import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { Linter } from "eslint";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(testDir, "..");

describe("package entry", () => {
  it("points main to an existing build artifact", () => {
    const packageJsonPath = path.join(packageDir, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
      main?: string;
    };

    expect(typeof packageJson.main).toBe("string");
    expect(fs.existsSync(path.join(packageDir, packageJson.main as string))).toBe(true);
  });

  it("can be imported via package root", async () => {
    const packageJsonPath = path.join(packageDir, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
      main?: string;
    };
    const entryPath = path.join(packageDir, packageJson.main as string);
    await expect(import(pathToFileURL(entryPath).href)).resolves.toBeDefined();
  });

  it("resolves imports with settings from the native ESM build", async () => {
    const { default: plugin } = await import(pathToFileURL(path.join(packageDir, "dist/index.mjs")).href);
    const rootDir = path.join(testDir, "fixtures/resolver");
    const messages = new Linter({ cwd: rootDir }).verify(
      "import 'modules/Feature';",
      [
        {
          plugins: { "feod-structure": plugin },
          rules: { "feod-structure/layer-imports": ["error", { rootDir }] },
          settings: { "import/resolver": { node: { paths: [path.join(rootDir, "src")], extensions: [".js"] } } },
        },
      ],
      { filename: path.join(rootDir, "src/common/util.js") },
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe("invalidLayerImport");
  });

  it("exposes declarations consumable with strict NodeNext resolution", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "feod-types-"));
    try {
      fs.mkdirSync(path.join(root, "node_modules/@o-feod"), { recursive: true });
      fs.symlinkSync(packageDir, path.join(root, "node_modules/@o-feod/eslint-structure-plugin"), "dir");
      const source = path.join(root, "check.mts");
      fs.writeFileSync(
        source,
        `import { createConfig, configFromProject, loadFeodConfig, type FeodConfig, type SubmodulePolicy, type ImportPolicy, type GlobalFilesPolicy, type InventoryPolicy, type ModuleNamesPolicy, type ModulePolicy } from '@o-feod/eslint-structure-plugin';
const globals: GlobalFilesPolicy = { allowedFiles: ["**/*.d.ts"], localImports: "type-only" };
const entryPolicy: ModulePolicy = { publicEntries: ["index.ts"], requirePublicEntry: true };
createConfig({ modules: entryPolicy });
const inventory: InventoryPolicy = { uncovered: true };
createConfig({ inventory });
const modules: ModuleNamesPolicy = { forbiddenNames: ["utils"] };
createConfig({ rootDefault: { globals, modules } });
const imports: ImportPolicy = { computed: "forbid", unresolved: "forbid" };
createConfig({ rootDefault: { imports } });
const submodules: SubmodulePolicy = { visibility: "parent-only", parentImports: "public", childImportsParent: "implementation" };
createConfig({ rootDefault: { submodules } });
const input: FeodConfig = { rootDefault: { layerDirs: { global: 'globals' } }, roots: { src: {}, core: {} } };
// @ts-expect-error srcRoot and roots are mutually exclusive.
const conflict: FeodConfig = { srcRoot: 'src', roots: { src: {} } };
const roots = loadFeodConfig().config.roots;
import { frontendLayers, backendLayers, cliLayers, type LayerSet } from '@o-feod/eslint-structure-plugin/presets';
const layers: LayerSet = { ...frontendLayers, custom: { imports: [] } };
createConfig({ roots: { src: { layers }, server: { layers: backendLayers }, cli: { layers: cliLayers } } });
createConfig(input).rules['feod-structure/layer-imports'];
configFromProject({ preset: 'strict' }).rules;
import { resolveImport, type ResolveResult } from '@o-feod/eslint-structure-plugin';
const sample: ResolveResult = { status: "external", via: "package" };
void resolveImport;
void sample;
const rootDir: string = loadFeodConfig().rootDir;`,
      );
      const require = createRequire(import.meta.url);
      const typescriptPackagePath = require.resolve("typescript/package.json");
      const typescriptPackage = JSON.parse(fs.readFileSync(typescriptPackagePath, "utf8"));
      const compilerPath = path.resolve(path.dirname(typescriptPackagePath), typescriptPackage.bin.tsc);
      const result = spawnSync(
        process.execPath,
        [
          compilerPath,
          source,
          "--noEmit",
          "--strict",
          "--module",
          "NodeNext",
          "--moduleResolution",
          "NodeNext",
          "--target",
          "ES2022",
        ],
        { cwd: root, encoding: "utf8", timeout: 30_000 },
      );
      expect(result.error).toBeUndefined();
      expect(result.stdout + result.stderr).toBe("");
      expect(result.status).toBe(0);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("builds a validated flat config from the native ESM API", async () => {
    const { createConfig, loadFeodConfig } = await import(pathToFileURL(path.join(packageDir, "dist/index.mjs")).href);
    const rootDir = path.join(testDir, "fixtures/resolver");
    expect(Object.keys(loadFeodConfig({ rootDir }).config.roots)).toEqual(["src"]);
    const config = createConfig({ layerDirs: { global: "globals" } }, { rootDir });
    const messages = new Linter({ cwd: rootDir }).verify("import '@modules/Feature';", [config], {
      filename: path.join(rootDir, "src/common/util.js"),
    });
    expect(messages).toEqual([expect.objectContaining({ messageId: "invalidLayerImport" })]);
  });
});
