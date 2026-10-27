import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "vitest";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import { typeImportForms } from "./import-forms";

import layerImports from "../src/rules/layer-imports";
import noCommonIndex from "../src/rules/no-common-index";
import noZigzagImports from "../src/rules/no-zigzag-imports";
import noSubmoduleOfSubmodule from "../src/rules/no-submodule-of-submodule";
import pagesPrivateModules from "../src/rules/pages-private-modules";
import visibilityLevels from "../src/rules/visibility-levels";

const RuleTesterWithVitest = RuleTester as typeof RuleTester & {
  describe: typeof describe;
  it: typeof it;
  itOnly: typeof it.only;
};
RuleTesterWithVitest.describe = describe;
RuleTesterWithVitest.it = it;
RuleTesterWithVitest.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: "module" },
});
const rootDir = "/project";
const levels = [{ name: "router", visibility: "default", maxDepth: 1 }];
const forms = [
  (source: string) => `import '${source}';`,
  (source: string) => `export * from '${source}';`,
  (source: string) => `export { value } from '${source}';`,
  (source: string) => `require('${source}');`,
  (source: string) => `void import('${source}');`,
  (source: string) => "void import(`" + source + "`);",
  (source: string) => "require(`" + source + "`);",
];

function validImports(filename: string, source: string, options: Record<string, unknown> = { rootDir }) {
  return forms.map(form => ({
    filename: path.join(rootDir, filename),
    code: form(source),
    options: [options],
  }));
}

function invalidImports(
  filename: string,
  source: string,
  messageId: string,
  options: Record<string, unknown> = { rootDir },
) {
  return validImports(filename, source, options).map(test => ({
    ...test,
    errors: [{ messageId }],
  }));
}

// All import forms must enforce the same boundary, including lazy imports.
tester.run("layer-imports boundaries", layerImports, {
  valid: [
    ...["./App.vue", "./router", "@app/router"].flatMap(source => validImports("src/app/main.ts", source)),
    ...validImports("server/app/vite-plugin.ts", "./api", { rootDir, srcRoot: "server" }),
    ...["app", "pages", "modules/Orders"].flatMap(caller =>
      ["@/modules/Users", "@modules/Users", "@modules/Users/index.js"].flatMap(source =>
        validImports(`src/${caller}/fixture.ts`, source),
      ),
    ),
    ...validImports("src/modules/Orders/index.ts", "./_/internal"),
    ...validImports("src/modules/Orders/index.ts", "./modules/Checkout/index.ts"),
    ...validImports("src/modules/Orders/modules/Checkout/index.ts", "../../private"),
    ...validImports("src/modules/Orders/modules/Checkout/index.ts", "../Payment/index.js"),
    ...validImports("src/app/router.ts", "@modules/game/world", { rootDir, transitModules: ["game"] }),
    ...validImports("src/modules/game/world/fixture.ts", "../_/types", { rootDir, transitModules: ["game"] }),
    ...validImports("src/modules/game/world/fixture.ts", "./_/internal", { rootDir, transitModules: ["game"] }),
    ...validImports("src/modules/Auth/index.ts", "./pages/login.vue", { rootDir, modulePages: true }),
    ...validImports("src/app/router.ts", "@modules/Logger.ts", { rootDir, singleFileModules: true }),
    ...validImports("source/core/main.ts", "#features/Users", {
      rootDir,
      srcRoot: "source",
      layerDirs: { app: "core", modules: "features" },
      layerAliases: { "#features": "source/features" },
    }),
    {
      filename: "/project/src/common/util.ts",
      code: "void import(target); void import(`@/modules/${name}`);",
      options: [{ rootDir }],
    },
  ],
  invalid: [
    ...["app", "pages", "modules/Orders"].flatMap(caller =>
      ["@/modules/Users/_/types", "@modules/Users/stores/user"].flatMap(source =>
        invalidImports(`src/${caller}/fixture.ts`, source, "invalidModuleImport"),
      ),
    ),
    ...invalidImports("server/app/fixture.ts", "../modules/Users/private", "invalidModuleImport", {
      rootDir,
      srcRoot: "server",
    }),
    ...invalidImports("src/modules/Orders/modules/Checkout/index.ts", "../Payment/private", "invalidModuleImport"),
    ...invalidImports("src/modules/Orders/index.ts", "./modules/Checkout/private", "invalidModuleImport"),
    ...["common", "modules/Orders", "pages"].flatMap(caller =>
      invalidImports(`src/${caller}/fixture.ts`, "@app/router", "appImportRestricted"),
    ),
    ...invalidImports("src/common/util.ts", "@modules/Users", "invalidLayerImport"),
    ...invalidImports("src/app/main.ts", "@modules/Users/index.js/private", "invalidModuleImport"),
    ...invalidImports("src/app/router.ts", "@modules/game/world/private", "invalidTransitSubmoduleImport", {
      rootDir,
      transitModules: ["game"],
    }),
    ...invalidImports("src/app/router.ts", "@modules/game/_/types", "invalidTransitPrivateImport", {
      rootDir,
      transitModules: ["game"],
    }),
    ...invalidImports("src/modules/game/world/fixture.ts", "../inventory/private", "invalidTransitSubmoduleImport", {
      rootDir,
      transitModules: ["game"],
    }),
    ...invalidImports("src/app/router.ts", "@modules/Auth/pages/login.vue", "modulePagesImportRestricted", {
      rootDir,
      modulePages: true,
    }),
  ],
});

tester.run("no-common-index lazy imports", noCommonIndex, {
  valid: validImports("src/app/main.ts", "@common/utils/math.js"),
  invalid: invalidImports("src/app/main.ts", "@common/utils/index.js", "noCommonIndexImport"),
});

tester.run("no-zigzag-imports boundaries", noZigzagImports, {
  valid: [
    ...["../Users", "../Users/index.js", "@modules/Users", "../Users/modules/Profile/index.js"].flatMap(source =>
      validImports("src/modules/Orders/index.ts", source),
    ),
    ...validImports("src/modules/Orders/modules/Checkout/index.ts", "../../private"),
  ],
  invalid: [
    ...invalidImports("src/modules/Orders/index.ts", "../Users/private", "zigzagImport"),
    ...invalidImports("src/modules/Orders/index.ts", "../Users/index.js/private", "zigzagImport"),
  ],
});

tester.run("no-submodule-of-submodule lazy imports", noSubmoduleOfSubmodule, {
  valid: validImports("src/modules/Orders/index.ts", "./modules/Checkout/index.js"),
  invalid: invalidImports(
    "src/modules/Orders/index.ts",
    "@modules/Orders/modules/Checkout/modules/Step/index.js",
    "noSubmoduleOfSubmodule",
  ),
});

tester.run("pages-private-modules lazy imports", pagesPrivateModules, {
  valid: validImports("src/pages/home.vue", "./_home/api"),
  invalid: invalidImports("src/app/router.ts", "@pages/_home/api", "privateModuleOutOfScope"),
});

const fixturesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "fixtures/resolver");
tester.run("visibility-levels alias boundaries", visibilityLevels, {
  valid: [
    ...validImports("src/app/main.ts", "@/app/router/guards.js", { rootDir, levels }),
    ...validImports("src/app/router/main.ts", "@app/router/guards/deep.js", { rootDir, levels }),
    ...validImports("src/app/main.ts", "@app/router/guards/deep.js"), // No configured levels.
    ...validImports("src/app/main.ts", "@app/router/guards/deep.js", {
      rootDir,
      levels,
      ignore: ["src/app/router/**"],
    }),
    ...validImports("src/app/main.ts", "react", { rootDir, levels }),
    { filename: "/project/src/app/main.ts", code: "void import(target);", options: [{ rootDir, levels }] },
  ],
  invalid: [
    ...[
      "./router/guards/deep.js",
      "@/app/router/guards/deep.js",
      "@app/router/guards/deep.js",
      "src/app/router/guards/deep.js",
    ].flatMap(source => invalidImports("src/app/main.ts", source, "visibilityDepth", { rootDir, levels })),
    ...invalidImports("server/app/main.ts", "@app/router/guards/deep.js", "visibilityDepth", {
      rootDir,
      levels,
      srcRoot: "server",
    }),
    ...invalidImports("src/app/main.ts", "~/core/router/guards/deep.js", "visibilityDepth", {
      rootDir,
      levels,
      aliasPrefix: "~",
      aliasRoot: "source",
    }),
    ...invalidImports("source/core/main.ts", "@app/router/guards/deep.js", "visibilityDepth", {
      rootDir,
      levels,
      srcRoot: "source",
      layerDirs: { app: "core" },
    }),
    ...invalidImports("src/app/main.ts", "#router/guards/deep.js", "visibilityDepth", {
      rootDir,
      levels,
      layerAliases: { "#router": "src/app/router" },
    }),
    {
      filename: path.join(fixturesRoot, "src/common/util.js"),
      code: "void import('modules/Feature');",
      options: [{ rootDir: fixturesRoot, levels: [{ name: "modules", visibility: "default", maxDepth: 1 }] }],
      settings: { "import/resolver": { node: { paths: [path.join(fixturesRoot, "src")], extensions: [".js"] } } },
      errors: [{ messageId: "visibilityDepth" }],
    },
  ],
});

const tsTester = new RuleTester({
  languageOptions: { parser: tsParser, ecmaVersion: "latest", sourceType: "module" },
});
for (const [name, rule, file, good, bad, messageId, extra] of [
  [
    "layer-imports",
    layerImports,
    "src/common/check.ts",
    "./math",
    "../modules/Users/private",
    "invalidModuleImport",
    {},
  ],
  [
    "no-common-index",
    noCommonIndex,
    "src/app/check.ts",
    "../common/math",
    "../common/utils/index.ts",
    "noCommonIndexImport",
    {},
  ],
  [
    "no-zigzag-imports",
    noZigzagImports,
    "src/modules/Orders/check.ts",
    "../Users/index.ts",
    "../Users/private",
    "zigzagImport",
    {},
  ],
  [
    "no-submodule-of-submodule",
    noSubmoduleOfSubmodule,
    "src/modules/Orders/check.ts",
    "./modules/Checkout/index.ts",
    "./modules/Checkout/modules/Step/index.ts",
    "noSubmoduleOfSubmodule",
    {},
  ],
  [
    "pages-private-modules",
    pagesPrivateModules,
    "src/app/check.ts",
    "../pages/home.ts",
    "../pages/_home/api",
    "privateModuleOutOfScope",
    {},
  ],
  [
    "visibility-levels",
    visibilityLevels,
    "src/app/check.ts",
    "./router/guards.ts",
    "./router/guards/deep.ts",
    "visibilityDepth",
    { levels },
  ],
] as const) {
  tsTester.run(`${name} TypeScript dependency forms`, rule, {
    valid: Object.values(typeImportForms).map(form => ({
      filename: `${rootDir}/${file}`,
      code: form(good),
      options: [{ rootDir, ...extra }],
    })),
    invalid: Object.values(typeImportForms).map(form => ({
      filename: `${rootDir}/${file}`,
      code: form(bad),
      options: [{ rootDir, ...extra }],
      errors: [{ messageId }],
    })),
  });
}

for (const form of Object.values(typeImportForms)) {
  tsTester.run("parent-child TypeScript policy", layerImports, {
    valid: [
      { filename: "/project/src/modules/Parent/index.ts", code: form("./modules/Child"), options: [{ rootDir }] },
      {
        filename: "/project/src/modules/Parent/modules/Child/index.ts",
        code: form("../../shared"),
        options: [{ rootDir }],
      },
    ],
    invalid: [
      {
        filename: "/project/src/modules/Parent/index.ts",
        code: form("./modules/Child/private"),
        options: [{ rootDir }],
        errors: [{ messageId: "invalidModuleImport" }],
      },
    ],
  });
}

// Only the native URL constructor and unshadowed require are module loaders.
tester.run("layer-imports static file URLs and loader scope", layerImports, {
  valid: [
    {
      filename: "/project/src/common/x.js",
      code: "import(new URL('./math.js', import.meta.url).href)",
      options: [{ rootDir }],
    },
    {
      filename: "/project/src/common/x.js",
      code: "function f(require) { require('../modules/Users/private') }",
      options: [{ rootDir }],
    },
    {
      filename: "/project/src/common/x.js",
      code: "function f(URL) { import(new URL('../modules/Users/private', import.meta.url).href) }",
      options: [{ rootDir }],
    },
    {
      filename: "/project/src/common/x.js",
      code: "import(new URL('../modules/Users/private', otherBase).href)",
      options: [{ rootDir }],
    },
    {
      filename: "/project/src/common/x.js",
      code: "import(new URL(target, import.meta.url).href)",
      options: [{ rootDir }],
    },
  ],
  invalid: [
    {
      filename: "/project/src/common/x.js",
      code: "import(new URL('../modules/Users/private', import.meta.url).href)",
      options: [{ rootDir }],
      errors: [{ messageId: "invalidModuleImport" }],
    },
    {
      filename: "/project/src/common/x.js",
      code: "import(new URL(`../modules/Users/private`, import.meta.url).href)",
      options: [{ rootDir }],
      errors: [{ messageId: "invalidModuleImport" }],
    },
    {
      filename: "/project/src/common/x.js",
      code: "function f() { require('../modules/Users/private') }",
      options: [{ rootDir }],
      errors: [{ messageId: "invalidModuleImport" }],
    },
  ],
});
