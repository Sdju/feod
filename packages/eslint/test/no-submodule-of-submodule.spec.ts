import path from "node:path";
import { describe, it } from "vitest";
import { RuleTester } from "eslint";

import rule from "../src/rules/no-submodule-of-submodule";

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

tester.run("no-submodule-of-submodule", rule, {
  valid: [
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import Checkout from './modules/Checkout/index.js';",
      options: [{ rootDir }],
    },
    {
      filename: filePath("src", "modules", "Orders", "modules", "Checkout", "index.js"),
      code: "import service from '../../service.js';",
      options: [{ rootDir }],
    },
  ],
  invalid: [
    {
      filename: filePath("src", "modules", "Orders", "index.js"),
      code: "import Deep from './modules/Checkout/modules/Step/index.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "noSubmoduleOfSubmodule",
        },
      ],
    },
    {
      filename: filePath("src", "modules", "Orders", "modules", "Checkout", "index.js"),
      code: "import Deep from '../Payment/modules/Step/index.js';",
      options: [{ rootDir }],
      errors: [
        {
          messageId: "noSubmoduleOfSubmodule",
        },
      ],
    },
  ],
});
