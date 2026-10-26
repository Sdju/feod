import path from "node:path";
import { describe, it } from "vitest";
import { RuleTester } from "eslint";

import rule from "../src/rules/no-common-index";

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

tester.run("no-common-index", rule, {
  valid: [
    {
      filename: filePath("src", "common", "utils", "math.js"),
      code: "export const sum = (a, b) => a + b;",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.js"),
      code: "import util from '../../common/utils/math.js';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "common", "utils", "index.js"),
      code: "export * from './math.js';",
      options: [{ rootDir, ignore: ["src/common/utils/index.js"] }],
    },
  ],
  invalid: [
    {
      filename: filePath("src", "common", "utils", "index.js"),
      code: "export * from './math.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "noCommonIndex",
        },
      ],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.js"),
      code: "import util from '../../common/utils/index.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "noCommonIndexImport",
        },
      ],
    },
  ],
});
