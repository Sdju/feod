import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { Linter } from "eslint";
import { configFromProject, createConfig, createRuleConfig, loadFeodConfig, FeodConfigError } from "../src/app/index.js";
import schema from "../src/modules/ProjectConfig/feod.schema.json";
import type { FeodConfig } from "../src/app/index.js";

const roots: string[] = [];
function project() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "feod-config-"));
  roots.push(root);
  return root;
}
function json(root: string, filename: string, value: unknown) {
  fs.mkdirSync(path.dirname(path.join(root, filename)), { recursive: true });
  fs.writeFileSync(path.join(root, filename), JSON.stringify(value));
}
afterEach(() => roots.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true })));

describe("project configuration", () => {
  it("uses defaults in an empty project and resolves the root", () => {
    const root = project();
    const loaded = loadFeodConfig({ rootDir: path.join(root, ".") });
    expect(loaded.rootDir).toBe(root);
    expect(loaded.filepath).toBeUndefined();
    expect(loaded.config.roots.src).toMatchObject({ aliasRoot: "src", layerDirs: { global: "global" },
      common: { maxDepth: 1 }, ignore: [], levels: [], singleFileModules: false });
  });
  it("loads a package section without validating unrelated package fields", () => {
    const root = project();
    json(root, "package.json", { name: "consumer", dependencies: { vue: "*" }, feod: { srcRoot: "source", layerDirs: { global: "globals" } } });
    const loaded = loadFeodConfig({ rootDir: root });
    expect(loaded.filepath).toBe(path.join(root, "package.json"));
    expect(loaded.config.roots.source).toMatchObject({ aliasRoot: "source", layerDirs: { global: "globals" },
      layerAliases: { "@global": "source/globals" } });
  });
  it("loads standalone JSON alongside an ordinary package manifest", () => {
    const root = project();
    json(root, "package.json", { name: "consumer" });
    json(root, "feod.config.json", { $schema: schema.$id, srcRoot: "./source", aliasRoot: "source",
      ignore: "source/generated/**", layerDirs: { modules: "features" } });
    const loaded = loadFeodConfig({ rootDir: root });
    expect(loaded.filepath).toBe(path.join(root, "feod.config.json"));
    expect(loaded.config.roots.source).toMatchObject({ layerAliases: { "@modules": "source/features" }, ignore: ["source/generated/**"] });
    expect(loaded.config).not.toHaveProperty("$schema");
  });
  it("rejects two sources, including an empty package section", () => {
    const root = project();
    json(root, "package.json", { feod: {} });
    json(root, "feod.config.json", {});
    expect(() => loadFeodConfig({ rootDir: root })).toThrow(`both ${path.join(root, "feod.config.json")} and ${path.join(root, "package.json")}#/feod`);
  });
  it("does not inherit the workspace root configuration", () => {
    const root = project();
    json(root, "package.json", { feod: { srcRoot: "workspace-source" } });
    const child = path.join(root, "packages/app");
    fs.mkdirSync(child, { recursive: true });
    expect(Object.keys(loadFeodConfig({ rootDir: child }).config.roots)).toEqual(["src"]);
    json(child, "package.json", { feod: { srcRoot: "app-source" } });
    expect(Object.keys(loadFeodConfig({ rootDir: child }).config.roots)).toEqual(["app-source"]);
  });
  for (const filename of ["feod.config.json", "package.json"]) {
    it(`reports malformed ${filename}`, () => {
      const root = project();
      fs.writeFileSync(path.join(root, filename), "{ broken");
      expect(() => loadFeodConfig({ rootDir: root })).toThrow(`${path.join(root, filename)}: invalid JSON`);
    });
    it(`does not hide a read failure for ${filename}`, () => {
      const root = project();
      fs.mkdirSync(path.join(root, filename));
      expect(() => loadFeodConfig({ rootDir: root })).toThrow(FeodConfigError);
    });
  }
  for (const [config, field] of [
    [{ srcRot: "src" }, "/srcRot"], [{ srcRoot: "" }, "/srcRoot"], [{ srcRoot: "/absolute" }, "/srcRoot"],
    [{ aliasRoot: "C:\\src" }, "/aliasRoot"], [{ layerDirs: { globals: "globals" } }, "/layerDirs/globals"],
    [{ common: { allowIndex: true } }, "/common/allowIndex"], [{ common: { maxDepth: -1 } }, "/common/maxDepth"],
    [{ common: { maxDepth: 1.5 } }, "/common/maxDepth"], [{ singleFileModules: "true" }, "/singleFileModules"],
    [{ levels: [{ name: "router", visibility: "private" }] }, "/levels/0/visibility"],
    [{ levels: [{ name: "router" }] }, "/levels/0/visibility"], [{ ignore: [3] }, "/ignore"],
    [{ $schema: "not a uri" }, "/$schema"], [null, "/"], [[], "/"],
  ] as const) {
    it(`rejects ${JSON.stringify(config)} with a file and field`, () => {
      const root = project();
      json(root, "package.json", { feod: config });
      expect(() => loadFeodConfig({ rootDir: root })).toThrow(`${path.join(root, "package.json")}#/feod`);
      expect(() => loadFeodConfig({ rootDir: root })).toThrow(field);
    });
  }
  it("requires package.json to be an object", () => {
    const root = project();
    json(root, "package.json", []);
    expect(() => loadFeodConfig({ rootDir: root })).toThrow("must be an object");
  });
  it("loads BOM-prefixed JSON", () => {
    const root = project();
    fs.writeFileSync(path.join(root, "feod.config.json"), '\uFEFF{"srcRoot":"source"}');
    expect(Object.keys(loadFeodConfig({ rootDir: root }).config.roots)).toEqual(["source"]);
  });
  it("validates inline configuration without changing it", () => {
    const config: FeodConfig = { $schema: schema.$id, ignore: "src/generated/**", layerDirs: { modules: "features" } };
    const before = JSON.stringify(config);
    createConfig(config);
    expect(JSON.stringify(config)).toBe(before);
    expect(() => createConfig({ srcRoot: 3 } as unknown as FeodConfig)).toThrow("inline config: /srcRoot");
    expect(() => createConfig({}, { preset: "typo" } as never)).toThrow("unknown preset");
  });
  it("loads every documented JSON example", () => {
    const doc = fs.readFileSync(fileURLToPath(new URL("../../../docs/linting/configuration.md", import.meta.url)), "utf8");
    const examples = [...doc.matchAll(/```json\n([\s\S]*?)\n```/g)].map(match => JSON.parse(match[1]));
    expect(examples.length).toBeGreaterThanOrEqual(2);
    for (const example of examples) {
      const root = project();
      json(root, "feod" in example ? "package.json" : "feod.config.json", example);
      const config = configFromProject({ rootDir: root, preset: "strict" });
      expect(config.rules).toHaveProperty("feod-structure/layer-imports");
    }
  });
  it("keeps the served schema equal to the canonical runtime schema", () => {
    const published = fileURLToPath(new URL("../../../docs/public/feod.schema.json", import.meta.url));
    expect(JSON.parse(fs.readFileSync(published, "utf8"))).toEqual(schema);
  });
});

describe("generated ESLint configs", () => {
  for (const preset of ["recommended", "strict"] as const) {
    it(`${preset}: accepts the complete config and finds an import across custom layers`, () => {
      const root = project();
      json(root, "feod.config.json", { srcRoot: "source", layerDirs: { modules: "features", pages: "screens", common: "shared", global: "globals" },
        layerAliases: { "#modules": "source/features" }, common: { maxDepth: 2 }, singleFileModules: true,
        transitModules: ["integrations"], modulePages: true, levels: [{ name: "router", visibility: "default", maxDepth: 1 }] });
      const config = configFromProject({ rootDir: root, preset });
      const filename = path.join(root, "source/shared/check.js");
      const messages = new Linter({ cwd: root }).verify("import '#modules/User';", [config], { filename });
      expect(messages).toEqual([expect.objectContaining({ ruleId: "feod-structure/layer-imports", messageId: "invalidLayerImport" })]);
    });
  }
  it("supports layers directly under the project root", () => {
    const root = project();
    const config = createConfig({ srcRoot: ".", layerDirs: { global: "globals" } }, { rootDir: root });
    const messages = new Linter({ cwd: root }).verify("import '@modules/User';", [config], { filename: path.join(root, "common/check.js") });
    expect(messages).toEqual([expect.objectContaining({ messageId: "invalidLayerImport" })]);
  });
  it("applies common.maxDepth, global directory and ignore consistently", () => {
    const root = project();
    const config = createConfig({ layerDirs: { global: "globals" }, common: { maxDepth: 0 }, ignore: "src/generated/**" }, { rootDir: root });
    const lint = (name: string) => new Linter({ cwd: root }).verify("export const value = 1;", [config], { filename: path.join(root, name) });
    expect(lint("src/globals/types.js")).toEqual([]);
    expect(lint("src/generated/code.js")).toEqual([]);
    expect(lint("src/common/utils/check.js")).toEqual([expect.objectContaining({ ruleId: "feod-structure/no-common-deep" })]);
  });
  it("enables visibility limits only in strict and keeps empty limits unrestricted", () => {
    const root = project();
    const filename = path.join(root, "src/app/check.js");
    const code = "import '@app/router/guards/deep.js';";
    const input: FeodConfig = { levels: [{ name: "router", visibility: "default", maxDepth: 1 }] };
    const lint = (config: ReturnType<typeof createConfig>) => new Linter({ cwd: root }).verify(code, [config], { filename });
    expect(lint(createConfig(input, { rootDir: root }))).toEqual([]);
    expect(lint(createConfig(input, { rootDir: root, preset: "strict" }))).toEqual([expect.objectContaining({ ruleId: "feod-structure/visibility-levels" })]);
    expect(lint(createConfig({}, { rootDir: root, preset: "strict" }))).toEqual([]);
  });
  it("builds independent configs that callers can override", () => {
    const first = createRuleConfig({ common: { maxDepth: 0 } });
    const second = createRuleConfig({ common: { maxDepth: 3 } });
    expect(first.rules).not.toBe(second.rules);
    expect(first.rules!["feod-structure/no-common-deep"]).toEqual(["error", expect.objectContaining({ maxDepth: 0 })]);
    expect(second.rules!["feod-structure/no-common-deep"]).toEqual(["error", expect.objectContaining({ maxDepth: 3 })]);
  });
});
