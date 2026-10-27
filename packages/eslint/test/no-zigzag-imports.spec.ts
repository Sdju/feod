import path from "node:path";
import { describe, it } from "vitest";
import { RuleTester } from "eslint";

import rule from "../src/rules/no-zigzag-imports";

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

tester.run("no-zigzag-imports", rule, {
  valid: [
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import '../Hub/Child/api.ts';",
      options: [{ rootDir, publicEntries: ["api.ts"], transitModules: ["Hub"] }],
    },
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import '../User/api.ts';",
      options: [{ rootDir, publicEntries: ["api.ts"] }],
    },
    ...[
      "@/modules/Users",
      "@modules/Users",
      "../Users",
      "../Users/index",
      "../Users/index.js",
      "../Users/modules/Profile/index.js",
      "../Users/modules/Profile/modules/Details/index.js",
    ].map(source => ({
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: `import Users from '${source}';`,
      options: [{ rootDir }],
    })),
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import utils from './utils.js';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Orders", "modules", "Checkout", "index.js"),
      code: "import service from '../../service.js';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "common", "utils", "math.js"),
      code: "import local from './local.js';",
      options: [{ rootDir }],
    },
  ],
  invalid: [
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import '../Hub/Child/index.ts';",
      options: [{ rootDir, publicEntries: ["api.ts"], transitModules: ["Hub"] }],
      errors: [{ messageId: "zigzagImport" }],
    },
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import '../User/index.js';",
      options: [{ rootDir, publicEntries: ["api.ts"] }],
      errors: [{ messageId: "zigzagImport" }],
    },
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import '../Users/modules/Profile/modules/Details/private.js';",
      options: [{ rootDir }],
      errors: [{ messageId: "zigzagImport", data: { from: "Orders", to: "Users/modules/Profile/modules/Details" } }],
    },
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import Users from '../Users/internal.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "zigzagImport",
          data: { from: "Orders", to: "Users" },
        },
      ],
    },
    {
      filename: filePath("src", "modules", "Orders", "modules", "Checkout", "index.js"),
      code: "import Users from '../../../Users/internal.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "zigzagImport",
          data: { from: "Orders/modules/Checkout", to: "Users" },
        },
      ],
    },
  ],
});
