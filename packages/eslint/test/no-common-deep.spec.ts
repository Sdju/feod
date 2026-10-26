import path from "node:path";
import { describe, it } from "vitest";
import { RuleTester } from "eslint";

import rule from "../src/rules/no-common-deep";

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

tester.run("no-common-deep", rule, {
  valid: [
    {
      filename: filePath("src", "common", "utils", "math.js"),
      code: "export const sum = (a, b) => a + b;",
      options: [{ rootDir, maxDepth: 1 }],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.js"),
      code: "export const feature = true;",
      options: [{ rootDir, maxDepth: 1 }],
    },
  ],
  invalid: [
    {
      filename: filePath("src", "common", "utils", "math", "extra.js"),
      code: "export const extra = true;",
      options: [{ rootDir, maxDepth: 1 }],
      errors: [
        {
          messageId: "commonTooDeep",
          data: { maxDepth: "1" },
        },
      ],
    },
  ],
});
