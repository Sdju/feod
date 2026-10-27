import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { OxlintConfig } from "oxlint";
import { backendLayers, cliLayers } from "@o-feod/eslint-structure-plugin/presets";
import { backendLayers as oxBackendLayers, cliLayers as oxCliLayers } from "../dist/presets.mjs";
import { typeImportForms } from "../../eslint/test/import-forms";
import plugin, { rules } from "../dist/index.mjs";
import eslintPlugin, { configs } from "@o-feod/eslint-structure-plugin";
import { recommended, strict } from "../dist/configs.mjs";

const packageDir = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const oxlintDir = path.dirname(require.resolve("oxlint/package.json"));
const cli = path.join(oxlintDir, "bin/oxlint");
let rootDir: string;

beforeAll(() => {
  rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "feod-oxlint-test-"));
  fs.mkdirSync(path.join(rootDir, "node_modules/@o-feod"), { recursive: true });
  fs.symlinkSync(packageDir, path.join(rootDir, "node_modules/@o-feod/oxlint-structure-plugin"), "dir");
  fs.symlinkSync(oxlintDir, path.join(rootDir, "node_modules/oxlint"), "dir");
  fs.writeFileSync(path.join(rootDir, "package.json"), JSON.stringify({ type: "module" }));
});

afterAll(() => fs.rmSync(rootDir, { recursive: true, force: true }));

function writeFile(filename: string, code: string) {
  const target = path.join(rootDir, filename);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, code);
  return target;
}

function lint(filename: string, code: string, config: OxlintConfig, tsConfig = false) {
  const target = writeFile(filename, code);
  const configFile = tsConfig
    ? writeFile(
        "oxlint.config.ts",
        `import { defineConfig } from 'oxlint';
import { strict } from '@o-feod/oxlint-structure-plugin/configs';
export default defineConfig({ ...strict, categories: { correctness: 'off' } });`,
      )
    : writeFile(".oxlintrc.json", JSON.stringify({ plugins: [], categories: { correctness: "off" }, ...config }));
  const result = spawnSync(
    process.execPath,
    [cli, "--config", configFile, "--threads=1", "--no-ignore", "--format=json", target],
    {
      cwd: rootDir,
      encoding: "utf8",
      timeout: 15_000,
    },
  );
  expect(result.error).toBeUndefined();
  expect(result.stderr).toBe("");
  const output = JSON.parse(result.stdout) as {
    diagnostics: { code: string; message: string; severity: string }[];
    number_of_files: number;
  };
  expect(output.number_of_files).toBe(1);
  expect(result.status).toBe(output.diagnostics.length ? 1 : 0);
  return output.diagnostics;
}

function ruleConfig(rule: string, options: Record<string, unknown> = {}): OxlintConfig {
  return {
    jsPlugins: recommended.jsPlugins,
    rules: { [`feod-structure/${rule}`]: ["error", { rootDir, ...options }] },
  };
}

const forms = {
  import: (source: string) => `import '${source}';`,
  "export all": (source: string) => `export * from '${source}';`,
  "export named": (source: string) => `export { value } from '${source}';`,
  require: (source: string) => `require('${source}');`,
  "dynamic import": (source: string) => `void import('${source}');`,
  "template import": (source: string) => "void import(`" + source + "`);",
  "template require": (source: string) => "require(`" + source + "`);",
  ...typeImportForms,
};

describe("Oxlint package", () => {
  it("shares the plugin, rule implementations and preset rules with ESLint", () => {
    expect(plugin).toBe(eslintPlugin);
    expect(oxBackendLayers).toBe(backendLayers);
    expect(oxCliLayers).toBe(cliLayers);
    expect(rules).toBe(eslintPlugin.rules);
    expect(recommended.rules).toBe(configs.recommended.rules);
    expect(strict.rules).toBe(configs.strict.rules);
  });

  for (const [rule, filename, good, bad, options] of [
    ["layer-imports", "src/common/check.ts", "@common/utils/math.js", "@modules/Users", {}],
    ["no-common-index", "src/app/check.ts", "@common/utils/math.js", "@common/utils/index.js", {}],
    ["no-zigzag-imports", "src/modules/Orders/check.ts", "../Users/index.js", "../Users/private.js", {}],
    [
      "no-submodule-of-submodule",
      "src/modules/Orders/check.ts",
      "./modules/Checkout/index.js",
      "@modules/Orders/modules/Checkout/modules/Step/index.js",
      {},
    ],
    ["pages-private-modules", "src/app/check.ts", "@pages/home.js", "@pages/_home/api.js", {}],
    [
      "visibility-levels",
      "src/app/check.ts",
      "@app/router/guards.js",
      "@app/router/guards/deep.js",
      { levels: [{ name: "router", visibility: "default", maxDepth: 1 }] },
    ],
  ] as const) {
    for (const [form, code] of Object.entries(forms)) {
      it(`${rule}: allows ${form} within the boundary`, () => {
        expect(lint(filename, code(good), ruleConfig(rule, options))).toEqual([]);
      });
      it(`${rule}: rejects ${form} across the boundary`, () => {
        expect(lint(filename, code(bad), ruleConfig(rule, options))).toEqual([
          expect.objectContaining({ code: `feod-structure(${rule})`, severity: "error" }),
        ]);
      });
    }
  }

  for (const [rule, good, bad, options] of [
    ["no-common-deep", "src/common/utils/math.ts", "src/common/utils/math/extra.ts", { maxDepth: 1 }],
    ["no-unknown-files", "src/app/main.ts", "src/alien/file.ts", {}],
    ["no-common-index", "src/common/utils/math.ts", "src/common/utils/index.ts", {}],
  ] as const) {
    it(`${rule}: checks the physical file path`, () => {
      const code = "export const value: boolean = true;";
      expect(lint(good, code, ruleConfig(rule, options))).toEqual([]);
      expect(lint(bad, code, ruleConfig(rule, options))).toEqual([
        expect.objectContaining({ code: `feod-structure(${rule})` }),
      ]);
    });
  }

  it("passes settings to the shared Node import resolver", () => {
    writeFile("src/modules/Feature/index.js", "export const value = true;");
    expect(
      lint("src/common/resolver.js", "import 'modules/Feature';", {
        ...ruleConfig("layer-imports"),
        settings: { "import/resolver": { node: { paths: [path.join(rootDir, "src")], extensions: [".js"] } } },
      }),
    ).toEqual([expect.objectContaining({ code: "feod-structure(layer-imports)" })]);
  });

  it("supports custom layer directories and aliases", () => {
    expect(
      lint(
        "source/shared/check.ts",
        "import '#features/Users/private';",
        ruleConfig("layer-imports", {
          srcRoot: "source",
          layerDirs: { common: "shared", modules: "features" },
          layerAliases: { "#features": "source/features" },
        }),
      ),
    ).toEqual([expect.objectContaining({ code: "feod-structure(layer-imports)" })]);
  });

  it("respects rule ignore options", () => {
    expect(
      lint(
        "src/common/check.ts",
        "import '@modules/Users';",
        ruleConfig("layer-imports", { ignore: ["src/common/**"] }),
      ),
    ).toEqual([]);
  });

  for (const script of ["script", 'script setup lang="ts"']) {
    it(`checks imports in Vue <${script}>`, () => {
      expect(
        lint(
          "src/common/check.vue",
          `<${script}>import '@modules/Users/private';</script><template><div /></template>`,
          ruleConfig("layer-imports"),
        ),
      ).toEqual([expect.objectContaining({ code: "feod-structure(layer-imports)" })]);
    });
  }

  it("checks both Vue scripts and type imports in a single SFC", () => {
    expect(
      lint(
        "src/common/both.vue",
        `<script lang="ts">type X = import('../modules/Users/private').X;</script>
<script setup lang="ts">import type { Y } from '../modules/Orders/private';</script><template><div /></template>`,
        ruleConfig("layer-imports"),
      ),
    ).toHaveLength(2);
  });

  it("uses the nearest module's public entry for the relative zigzag rule", () => {
    const file = "src/modules/Orders/index.ts";
    expect(
      lint(file, "import '../Users/modules/Profile/modules/Details/index.ts';", ruleConfig("no-zigzag-imports")),
    ).toEqual([]);
    expect(
      lint(file, "import '../Users/modules/Profile/modules/Details/private.ts';", ruleConfig("no-zigzag-imports")),
    ).toEqual([expect.objectContaining({ code: "feod-structure(no-zigzag-imports)" })]);
  });

  it("checks computed imports in both Vue script blocks", () => {
    const code = `<script lang="ts">void import(target);</script>
<script setup lang="ts">require(target);</script><template><div /></template>`;
    expect(
      lint("src/app/computed.vue", code, ruleConfig("layer-imports", { imports: { computed: "forbid" } })),
    ).toHaveLength(2);
    expect(lint("src/app/computed.vue", code, ruleConfig("layer-imports"))).toEqual([]);
  });

  it("checks literal file URLs without treating shadowed loaders as imports", () => {
    const file = "src/common/url.ts";
    expect(
      lint(file, "import(new URL('../modules/Users/private', import.meta.url).href)", ruleConfig("layer-imports")),
    ).toEqual([expect.objectContaining({ code: "feod-structure(layer-imports)" })]);
    for (const code of [
      "function f(URL) { import(new URL('../modules/Users/private', import.meta.url).href) }",
      "function f(require) { require('../modules/Users/private') }",
      "import(new URL('../modules/Users/private', otherBase).href)",
      "import(target)",
      "import(`../modules/${name}/private`)",
    ])
      expect(lint(file, code, ruleConfig("layer-imports"))).toEqual([]);
  });

  it("rejects a path nested below a purported public index", () => {
    expect(lint("src/app/check.ts", "import '@modules/Users/index.js/private';", ruleConfig("layer-imports"))).toEqual([
      expect.objectContaining({ code: "feod-structure(layer-imports)" }),
    ]);
  });

  it("loads the recommended preset as JSON through package exports", () => {
    expect(lint("src/common/preset.ts", "import '@modules/Users/private';", recommended)).toEqual([
      expect.objectContaining({ code: "feod-structure(layer-imports)" }),
    ]);
  });

  it("loads the strict preset from a TypeScript config through package exports", () => {
    expect(lint("src/common/preset.ts", "import '@modules/Users/private';", strict, true)).toEqual([
      expect.objectContaining({ code: "feod-structure(layer-imports)" }),
    ]);
  });
});
