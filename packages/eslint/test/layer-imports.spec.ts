import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "vitest";
import { RuleTester } from "eslint";

import rule from "../src/rules/layer-imports";

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
const customRoot = "/custom";
const customDirs = {
  app: "core",
  pages: "screens",
  modules: "features",
  common: "shared",
  global: "globals",
};
const fixturesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "resolver");

function filePath(...parts: string[]) {
  return path.join(rootDir, ...parts);
}

function customPath(...parts: string[]) {
  return path.join(customRoot, ...parts);
}

tester.run("layer-imports", rule, {
  valid: [
    {
      filename: filePath("src", "pages", "home.tsx"),
      code: "import './home.scss';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "pages", "home.tsx"),
      code: "import './home.module.scss';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "pages", "home", "index.tsx"),
      code: "import './styles/hero.css';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "app", "index.js"),
      code: "import Page from '../pages/Home.js';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "pages", "Home.js"),
      code: "import Feature from '../modules/Feature/index.js';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.js"),
      code: "import util from '../../common/util.js';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "common", "util.js"),
      code: "import other from './other.js';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.js"),
      code: "import ext from 'react';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import Users from '../Users/index.js';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Auth", "index.ts"),
      code: "import Login from './pages/login.vue';",
      options: [{ rootDir, modulePages: true }],
    },
    {
      filename: filePath("src", "modules", "Auth", "index.mjs"),
      code: "import Login from './pages/login.vue';",
      options: [{ rootDir, modulePages: true }],
    },
    {
      filename: filePath("src", "pages", "home.vue"),
      code: "import Npm from '@modules/package-manager/npm';",
      options: [{ rootDir, transitModules: ["package-manager"] }],
    },
    {
      filename: filePath("src", "modules", "package-manager", "npm", "index.ts"),
      code: "import core from '../_';",
      options: [{ rootDir, transitModules: ["package-manager"] }],
    },
    {
      filename: filePath("src", "common", "util.js"),
      code: "import Feature from '../modules/Feature/index.js';",
      options: [{ rootDir, ignore: ["src/modules/**"] }],
    },
    {
      filename: filePath("src", "modules", "Orders", "modules", "Checkout", "index.js"),
      code: "import service from '../../service.js';",
      options: [{ rootDir }],
    },
  ],
  invalid: [
    {
      filename: filePath("src", "pages", "home.tsx"),
      code: "import './about.scss';",
      options: [{ rootDir }],
      errors: [{ messageId: "pagesImportRestricted", data: { fromLayer: "pages" } }],
    },
    {
      filename: filePath("src", "pages", "home.tsx"),
      code: "import './home-extra.tsx';",
      options: [{ rootDir }],
      errors: [{ messageId: "pagesImportRestricted", data: { fromLayer: "pages" } }],
    },
    {
      filename: filePath("src", "modules", "Logger.ts"),
      code: "import internal from './Orders/internal.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "invalidModuleImport",
          data: { fromName: "modules", toName: "Orders" },
        },
      ],
    },
    {
      filename: filePath("src", "pages", "Home.js"),
      code: "import AppConfig from '../app/index.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "appImportRestricted",
          data: { fromLayer: "pages" },
        },
      ],
    },
    {
      filename: filePath("src", "modules", "Logger.ts"),
      code: "import internal from './Orders/internal.js';",
      options: [{ rootDir, singleFileModules: true }],
      errors: [
        {
          messageId: "invalidModuleImport",
          data: { fromName: "Logger", toName: "Orders" },
        },
      ],
    },
    {
      filename: filePath("src", "modules", "Auth", "routes.ts"),
      code: "import Login from './pages/login.vue';",
      options: [{ rootDir, modulePages: true }],
      errors: [{ messageId: "modulePagesImportRestricted" }],
    },
    {
      filename: filePath("src", "modules", "Auth", "routes.mjs"),
      code: "import Login from './pages/login.vue';",
      options: [{ rootDir, modulePages: true }],
      errors: [{ messageId: "modulePagesImportRestricted" }],
    },
    {
      filename: filePath("src", "app", "router.ts"),
      code: "import Login from '../modules/Auth/pages/login.vue';",
      options: [{ rootDir, modulePages: true }],
      errors: [{ messageId: "modulePagesImportRestricted" }],
    },
    {
      filename: filePath("src", "modules", "Auth", "pages", "login.vue"),
      code: "import AppEntry from '../../../app/index.js';",
      options: [{ rootDir, modulePages: true }],
      errors: [
        {
          messageId: "appImportRestricted",
          data: { fromLayer: "pages" },
        },
      ],
    },
    {
      filename: filePath("src", "pages", "home.vue"),
      code: "import core from '@modules/package-manager/_/core';",
      options: [{ rootDir, transitModules: ["package-manager"] }],
      errors: [{ messageId: "invalidTransitPrivateImport" }],
    },
    {
      filename: filePath("src", "modules", "Other", "index.js"),
      code: "import core from '../package-manager/_/core';",
      options: [{ rootDir, transitModules: ["package-manager"] }],
      errors: [{ messageId: "invalidTransitPrivateImport" }],
    },
    {
      filename: filePath("src", "pages", "home.vue"),
      code: "import Button from '@modules/package-manager/npm/components/Button';",
      options: [{ rootDir, transitModules: ["package-manager"] }],
      errors: [{ messageId: "invalidTransitSubmoduleImport" }],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.js"),
      code: "import Page from '../../pages/Home.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "pagesImportRestricted",
          data: { fromLayer: "modules" },
        },
      ],
    },
    {
      filename: filePath("src", "common", "util.js"),
      code: "import Page from '../pages/Home.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "pagesImportRestricted",
          data: { fromLayer: "common" },
        },
      ],
    },
    {
      filename: path.join(fixturesRoot, "src", "common", "util.js"),
      code: "import Feature from 'modules/Feature';",
      options: [{ rootDir: fixturesRoot }],
      settings: {
        "import/resolver": {
          node: {
            paths: [path.join(fixturesRoot, "src")],
            extensions: [".js"],
          },
        },
      },
      errors: [
        {
          messageId: "invalidLayerImport",
          data: { fromLayer: "common", toLayer: "modules" },
        },
      ],
    },
    {
      filename: customPath("source", "common", "util.js"),
      code: "import Feature from '../modules/Feature/index.js';",
      options: [{ rootDir: customRoot, srcRoot: "source" }],
      errors: [
        {
          messageId: "invalidLayerImport",
          data: { fromLayer: "common", toLayer: "modules" },
        },
      ],
    },
    {
      filename: customPath("source", "shared", "util.js"),
      code: "import Feature from '../features/Feature/index.js';",
      options: [
        {
          rootDir: customRoot,
          srcRoot: "source",
          layerDirs: customDirs,
        },
      ],
      errors: [
        {
          messageId: "invalidLayerImport",
          data: { fromLayer: "common", toLayer: "modules" },
        },
      ],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.js"),
      code: "import AppConfig from '../../app/index.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "appImportRestricted",
          data: { fromLayer: "modules" },
        },
      ],
    },
    {
      filename: filePath("src", "common", "util.js"),
      code: "import Feature from '../modules/Feature/index.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "invalidLayerImport",
          data: { fromLayer: "common", toLayer: "modules" },
        },
      ],
    },
    {
      filename: filePath("src", "common", "util.js"),
      code: "import Feature from '@modules/Feature/index.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "invalidLayerImport",
          data: { fromLayer: "common", toLayer: "modules" },
        },
      ],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.js"),
      code: "import types from '../../global/types.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "invalidGlobalImport",
          data: { fromLayer: "modules" },
        },
      ],
    },
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import Users from '../Users/internal.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "invalidModuleImport",
          data: {
            fromName: "Orders",
            toName: "Users",
          },
        },
      ],
    },
    {
      filename: filePath("src", "modules", "Orders", "modules", "Checkout", "index.js"),
      code: "import payment from '../Payments/internal.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "invalidModuleImport",
          data: {
            fromName: "Orders/modules/Checkout",
            toName: "Orders/modules/Payments",
          },
        },
      ],
    },
    {
      filename: filePath("src", "app", "index.js"),
      code: "import types from '../global/types.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "invalidGlobalImport",
          data: { fromLayer: "app" },
        },
      ],
    },
  ],
});
