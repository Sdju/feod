import type { Linter } from "eslint";

const config = {
  rules: {
    "feod-structure/confine": "off",
    "feod-structure/large-files": "off",
    "feod-structure/global-files": "off",
    "feod-structure/module-names": "off",
    "feod-structure/module-entries": "off",
    "feod-structure/no-module-cycles": "off",
    "feod-structure/no-file-cycles": "off",
    "feod-structure/layer-imports": "error",
    "feod-structure/no-common-index": "error",
    "feod-structure/no-common-deep": ["error", { maxDepth: 1 }],
    "feod-structure/no-zigzag-imports": "error",
    "feod-structure/no-unknown-files": "error",
    "feod-structure/visibility-levels": "off",
    "feod-structure/no-submodule-of-submodule": "error",
    "feod-structure/pages-private-modules": "error",
  },
} satisfies Linter.Config;

export default config;
