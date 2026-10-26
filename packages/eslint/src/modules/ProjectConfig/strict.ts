import type { Linter } from "eslint";

import recommended from "./recommended.js";

const config = {
  ...recommended,
  rules: {
    ...recommended.rules,
    "feod-structure/visibility-levels": "error",
  },
} satisfies Linter.Config;

export default config;
