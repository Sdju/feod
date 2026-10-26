import path from "node:path";
import { describe, it } from "vitest";
import { RuleTester } from "eslint";

import rule from "../src/rules/no-unknown-files";

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

tester.run("no-unknown-files", rule, {
  valid: [
    {
      filename: filePath("src", "modules", "Feature", "random.js"),
      code: "export const nope = true;",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Feature", "modules", "Auth", "entry.vue"),
      code: "export default {};",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Feature", "_", "internal.test.ts"),
      code: "export const value = true;",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "app", "index.js"),
      code: "export const app = true;",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "pages", "Home.js"),
      code: "export const page = true;",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.js"),
      code: "export const feature = true;",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Feature", "index.vue"),
      code: "export default {};",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "common", "utils", "math.js"),
      code: "export const sum = (a, b) => a + b;",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "global", "types.d.ts"),
      code: "export {};",
      options: [{ rootDir }],
    },
    {
      filename: path.join(rootDir, "source", "common", "util.js"),
      code: "export const util = true;",
      options: [{ rootDir, srcRoot: "source" }],
    },
    {
      filename: filePath("src", "ignored", "temp.js"),
      code: "export const temp = true;",
      options: [{ rootDir, ignore: ["src/ignored/**"] }],
    },
  ],
  invalid: [
    {
      filename: filePath("src", "unknown", "thing.js"),
      code: "export const oops = true;",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "unknownFile",
        },
      ],
    },
  ],
});
