import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Linter } from "eslint";
import parser from "@typescript-eslint/parser";
import { createConfig, type FeodConfig } from "../src/app/index.js";
import { libraryLayers } from "../src/modules/Layers/index.js";
import feodConfig from "../feod.config.js";
import { selfHostingCases, selfHostingFiles } from "./self-hosting-fixtures.js";

// The package policy is plain JS; the tests read it through the public config type.
const feod = feodConfig as FeodConfig & { layers: Record<string, { role?: string; imports: string[] }> };

let rootDir: string;
afterEach(() => {
  if (rootDir) fs.rmSync(rootDir, { recursive: true, force: true });
});

describe("package self-hosting architecture", () => {
  it("extends library and gives rules the pages role", () => {
    expect(feod.layers.rules).toEqual({ role: "pages", imports: ["modules", "common"] });
    expect(feod.layers.modules).toEqual(libraryLayers.modules);
    expect(feod.layers.common).toEqual(libraryLayers.common);
    expect(feod.layers.app.imports).toEqual([...libraryLayers.app.imports, "rules"]);
  });

  it.each(selfHostingCases)("$name", ({ file, source, rule }) => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "feod-self-eslint-"));
    for (const [filename, content] of Object.entries({ ...selfHostingFiles, [file]: source })) {
      const target = path.join(rootDir, filename);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    const config = createConfig(feod, { rootDir, preset: "strict" });
    const messages = new Linter({ cwd: rootDir }).verify(
      source,
      [
        {
          ...config,
          files: ["**/*.ts"],
          languageOptions: { parser },
        },
      ],
      { filename: path.join(rootDir, file) },
    );
    expect(messages.map(message => message.ruleId)).toEqual(rule ? [`feod-structure/${rule}`] : []);
  });
});
