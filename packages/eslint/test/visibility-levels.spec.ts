import path from "node:path";
import { describe, it } from "vitest";
import { RuleTester } from "eslint";

import rule from "../src/rules/visibility-levels";

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

const levels = [
  { name: "router", visibility: "default", maxDepth: 1 },
  { name: "components", visibility: "transparent" },
  { name: "common", visibility: "open" },
] as const;

tester.run("visibility-levels", rule, {
  valid: [
    {
      filename: filePath("src", "app", "index.js"),
      code: "import routes from './router/index.js';",
      options: [{ rootDir, levels }],
    },
    {
      filename: filePath("src", "app", "index.js"),
      code: "import guard from './router/guards.js';",
      options: [{ rootDir, levels }],
    },
    {
      filename: filePath("src", "app", "router", "guards.js"),
      code: "import deep from './guards/deep.js';",
      options: [{ rootDir, levels }],
    },
  ],
  invalid: [
    {
      filename: filePath("src", "app", "index.js"),
      code: "import deep from './router/guards/deep.js';",
      options: [{ rootDir, levels }],
      errors: [
        {
          messageId: "visibilityDepth",
          data: { level: "router", maxDepth: "1" },
        },
      ],
    },
  ],
});
