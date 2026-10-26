// Both adapters must enforce the same package architecture.
export const selfHostingFiles = {
  "src/rules/first.ts": "export const value = 1;",
  "src/rules/second.ts": "export const value = 2;",
  "src/modules/Feature/index.ts": "export const value = 1;",
  "src/modules/Feature/private.ts": "export const value = 2;",
  "src/common/value.ts": "export const value = 1;",
};

export const selfHostingCases = [
  { name: "app assembles rules", file: "src/app/main.ts", source: "import '../rules/first.js';", rule: null },
  { name: "rules consume public modules", file: "src/rules/check.ts", source: "import '../modules/Feature/index.js';", rule: null },
  { name: "rules consume common", file: "src/rules/check.ts", source: "import '../common/value.js';", rule: null },
  { name: "rules cannot import each other", file: "src/rules/check.ts", source: "import './first.js';", rule: "layer-imports" },
  { name: "common cannot import rules", file: "src/common/check.ts", source: "import '../rules/first.js';", rule: "layer-imports" },
  { name: "modules cannot import rules", file: "src/modules/Feature/check.ts", source: "import '../../rules/first.js';", rule: "layer-imports" },
  { name: "module implementation stays private", file: "src/app/main.ts", source: "import '../modules/Feature/private.js';", rule: "layer-imports" },
  { name: "files must belong to layers", file: "src/unknown.ts", source: "export {};", rule: "no-unknown-files" },
];
