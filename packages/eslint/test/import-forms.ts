// The same syntax matrix is exercised by ESLint and the real Oxlint CLI.
export const typeImportForms = {
  "type import": (source: string) => `import type { Value } from '${source}';`,
  "type reexport": (source: string) => `export type { Value } from '${source}';`,
  "import type expression": (source: string) => `type Value = import('${source}').Value;`,
  "typeof import expression": (source: string) => `type Value = typeof import('${source}');`,
  "import equals": (source: string) => `import value = require('${source}');`,
};
