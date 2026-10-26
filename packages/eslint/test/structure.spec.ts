import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import plugin, { createConfig, configs } from "../src/app/index.js";
import schema from "../src/modules/ProjectConfig/feod.schema.json";
import {
  globalFilesSchema,
  modulePolicySchema,
} from "../src/modules/Architecture/index.js";

describe("optional structural rules", () => {
  it("uses the same project and rule policy schemas", () => {
    expect(schema.definitions.rootOptions.properties.globals).toEqual(globalFilesSchema);
    expect(schema.definitions.rootOptions.properties.modules).toEqual(modulePolicySchema);
  });

  it("accepts the globals policy in direct layer-imports options", () => {
    const messages = new Linter({ cwd: "/project" }).verify("import '@modules/User';", [{
      plugins: { "feod-structure": plugin },
      rules: { "feod-structure/layer-imports": ["error", { rootDir: "/project", globals: { localImports: "forbid" } }] },
    }], { filename: "/project/src/global/check.js" });
    expect(messages).toEqual([expect.objectContaining({ messageId: "invalidGlobalLocalImport" })]);
  });

  it("keeps both presets and unconfigured roots unrestricted", () => {
    for (const preset of ["recommended", "strict"] as const) {
      for (const rule of ["global-files", "module-names", "module-entries", "no-module-cycles", "no-file-cycles"]) {
        expect(configs[preset].rules[`feod-structure/${rule}` as keyof typeof configs[typeof preset]["rules"]]).toBe("off");
        expect(createConfig({}, { preset }).rules[`feod-structure/${rule}`]).toBe("off");
      }
    }
  });

  it("supports independent severity and deterministic repeated lint", () => {
    const config = createConfig({ modules: { forbiddenNames: ["utils", "shared"] } }, { rootDir: "/project" });
    const entry = config.rules["feod-structure/module-names"] as [string, object];
    config.rules["feod-structure/module-names"] = ["warn", entry[1]];
    const linter = new Linter({ cwd: "/project" });
    for (const file of ["src/modules/utils/modules/shared/index.js", "src/modules/utils/modules/shared/other.js", "src/modules/utils/modules/shared/index.js"]) {
      const messages = linter.verify("export {};", [config], { filename: `/project/${file}` });
      expect(messages).toEqual([
        expect.objectContaining({ messageId: "forbiddenModuleName", severity: 1, message: expect.stringContaining("'utils'") }),
        expect.objectContaining({ messageId: "forbiddenModuleName", severity: 1, message: expect.stringContaining("'shared'") }),
      ]);
    }
  });

  for (const input of [
    ...["", ".", "..", "dir/index.ts", "dir\\index.ts", "*.ts", "api?.ts", "[ab].ts", "{a,b}.ts"].map(entry => ({ modules: { publicEntries: [entry] } })),
    { modules: { publicEntries: ["index.ts", "index.ts"] } },
    { globals: { allowedFiles: [""] } },
    { globals: { allowedFiles: ["**/*.d.ts", "**/*.d.ts"] } },
    ...["types", "deny", true, null].map(localImports => ({ globals: { localImports } })),
    { modules: { forbiddenNames: ["a/b"] } },
    { modules: { forbiddenNames: ["a\\b"] } },
    { modules: { forbiddenNames: [""] } },
    { modules: { forbiddenNames: ["utils", "utils"] } },
  ]) it(`rejects invalid policy ${JSON.stringify(input)}`, () => {
    expect(() => createConfig(input)).toThrow("FEOD configuration:");
  });
});
