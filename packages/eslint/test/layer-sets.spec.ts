import { entryCases } from "./entry-fixtures";
import { globalImportCases } from "./global-import-fixtures";
import { structureCases } from "./structure-fixtures";
import tsParser from "@typescript-eslint/parser";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import { createConfig, type FeodConfig } from "../src/app/index.js";
import { frontendLayers } from "../src/modules/Layers/index.js";
import { importPolicySchema } from "../src/modules/Architecture/index.js";
import { layerSetSchema } from "../src/modules/Architecture/index.js";
import schema from "../src/modules/ProjectConfig/feod.schema.json";
import { layerCases, submoduleCases, computedImportCases, visibilityCases } from "./layer-fixtures";

describe("declarative layer sets", () => {
  for (const fixture of [...layerCases, ...submoduleCases, ...computedImportCases, ...visibilityCases, ...structureCases, ...entryCases, ...globalImportCases]) {
    it(fixture.label, () => {
      const before = JSON.stringify(fixture.config);
      const messages = new Linter({ cwd: "/project" }).verify(fixture.code,
        [{ files: ["**/*.{ts,mts,cts}"], languageOptions: { parser: tsParser }, ...createConfig(fixture.config, { rootDir: "/project", preset: "strict" }) }],
        { filename: `/project/${fixture.file}` });
      expect(messages).toEqual(fixture.error ? [expect.objectContaining({ messageId: fixture.error })] : []);
      expect(JSON.stringify(fixture.config)).toBe(before);
    });
  }
  it("uses the same layer schema for project and direct rule options", () => {
    expect(schema.definitions.rootOptions.properties.layers).toEqual(layerSetSchema);
  });
  it("shares import policy schema and rejects unsupported policy values", () => {
    expect(schema.definitions.rootOptions.properties.imports).toEqual(importPolicySchema);
    expect(() => createConfig({ imports: { computed: "allow" } } as never)).toThrow("FEOD configuration:");
    expect(() => createConfig({ imports: { unresolved: "deny" } } as never)).toThrow("FEOD configuration:");
  });
  it("does not mutate exported presets", () => {
    const before = JSON.stringify(frontendLayers);
    createConfig({ layers: frontendLayers, layerDirs: { modules: "features" } });
    expect(JSON.stringify(frontendLayers)).toBe(before);
  });
  for (const layers of [
    {}, { a: { imports: ["missing"] } }, { a: {} },
    { a: { imports: [], role: "modules" }, b: { imports: [], role: "modules" } },
    { a: { imports: [], dir: "../outside" } },
    { a: { imports: [], dir: "same" }, b: { imports: [], dir: "./same" } },
    { "/absolute": { imports: [] } },
  ]) it(`rejects invalid layer set ${JSON.stringify(layers)}`, () => {
    expect(() => createConfig({ layers } as FeodConfig)).toThrow("FEOD configuration:");
  });
});
