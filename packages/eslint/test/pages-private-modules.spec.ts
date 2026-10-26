import path from "node:path";
import { describe, it } from "vitest";
import { RuleTester } from "eslint";

import rule from "../src/rules/pages-private-modules";

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

function filePath(...parts: string[]) {
  return path.join(rootDir, ...parts);
}

tester.run("pages-private-modules", rule, {
  valid: [
    {
      filename: filePath("src", "pages", "home.vue"),
      code: "import useHome from './_home';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "pages", "home.form.vue"),
      code: "import Widget from './_home/components/Widget.vue';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "pages", "home", "_home", "index.ts"),
      code: "import api from './api/homeApi';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "pages", "account", "index.vue"),
      code: "import { AccountCard } from './_account';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "pages", "account", "settings.vue"),
      code: "import api from './_account/api/settings';",
      options: [{ rootDir }],
    },
  ],
  invalid: [
    {
      filename: filePath("src", "pages", "about.vue"),
      code: "import useHome from './_home';",
      options: [{ rootDir }],
      errors: [{ messageId: "privateModuleOutOfScope" }],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.ts"),
      code: "import useHome from '../../pages/_home';",
      options: [{ rootDir }],
      errors: [{ messageId: "privateModuleOutOfScope" }],
    },
    {
      filename: filePath("src", "pages", "home", "index.vue"),
      code: "import profile from '../profile/_profile';",
      options: [{ rootDir }],
      errors: [{ messageId: "privateModuleOutOfScope" }],
    },
  ],
});
